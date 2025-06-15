import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { State } from "../../state.js";
import { ScreenManager } from "../../screen-manager.js";
import { BaseScreen } from "../../screen.interface.js";

import { Tick } from "../../tick.js";
import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

export class ScreenSmb extends BaseScreen {
    private screenManager: ScreenManager;

    private rotation: number = 0.0;
    private speed: number = 1.0;

    private size: [number, number] = [1, 1];
    private color: [number, number, number, number] = [0, 0, 0, 1];

    constructor(
        state: State,
        screenManager: ScreenManager,
        tick: Tick,
        gl: WebGLRenderingContext,
        programInfo: ProgramInfo,
        buffers: Buffers
    ) {
        super(state, gl, programInfo, buffers, tick);
        this.screenManager = screenManager;
    }

    private createBackground(): void {
        this.gl.useProgram(this.programInfo.program);
        this.gl.disable(this.gl.DEPTH_TEST);

        const projectionMatrix = mat4.create();
        const canvas = this.gl.canvas;
        const aspect = canvas.width / canvas.height;

        mat4.ortho(
            projectionMatrix,
            -aspect, aspect,
            -1.0, 1.0,
            -1.0, 1.0
        );

        const modelViewMatrix = mat4.create();

        mat4.rotate(
            modelViewMatrix,
            modelViewMatrix,
            this.rotation,
            [0, 0, 0]
        );

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.smbBackgroundPosition);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.smbBackgroundColor);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexColor, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);

        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.enable(this.gl.DEPTH_TEST);

        this.setBackground();
    }

    private setBackground(): void {
        const size = { w: 0.5, h: 0.5 }
        this.size = [size.w, size.h];

        const positions = [
            -this.size[0], -this.size[1],
            this.size[0], -this.size[1],
            -this.size[0],  this.size[1],
            this.size[0],  this.size[1],
        ];

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.smbBackgroundPosition);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        this.setColor('rgb(119, 0, 0)');
    }

    private setColor(color: string | [number, number, number, number]): void {
        this.color = this.parseColor(color);

        const colors = [
            this.color[0], this.color[1], this.color[2], this.color[3],
            this.color[0], this.color[1], this.color[2], this.color[3],
            this.color[0], this.color[1], this.color[2], this.color[3],
            this.color[0], this.color[1], this.color[2], this.color[3]
        ];

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.smbBackgroundColor);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
    }

    private parseColor(
        color: string |
        [number, number, number, number]
    ): [number, number, number, number] {
        if(Array.isArray(color)) return color;

        if(color.startsWith('#')) {
            const hex = color.substring(1);
            const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16) / 255; 
            return [r, g, b, 1];
        }

        if(color.startsWith('rgb')) {
            const values = color.match(/(\d+\.?\d*)/g);

            if(values && values.length >= 3) {
                const r = parseInt(values[0]) / 255;
                const g = parseInt(values[1]) / 255;
                const b = parseInt(values[2]) / 255;
                const a = values[3] ? parseFloat(values[3]) : 1;
                return [r, g, b, a];
            }
        }

        return [0, 0, 0, 1];
    }

    public update(deltaTime: number) {
        this.rotation += this.tick['speed'] * deltaTime;
        this.setBackground();
        this.createBackground();
    }

    public async init(): Promise<void[]> {
        const onInit = [
            this.setBackground(),
            this.createBackground()
        ];

        await this.state.markInit('smb');
        return onInit;
    }
}