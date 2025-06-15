import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { State } from "../../state.js";
import { ScreenManager } from "../../screen-manager.js";
import { BaseScreen } from "../../screen.interface.js";

import { Tick } from "../../tick.js";
import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

export class ScreenDk extends BaseScreen {
    private screenManager: ScreenManager;
    
    private rotation: number = 0.0;
    private speed: number = 1.0;

    private size: [number, number] = [1, 1];
    private setSize: { w: number, h: number} = { 
        w: 3.0, 
        h: 3.0
    }

    private color: [number, number, number, number] = [0, 0, 0, 1];

    private gridSize: [number, number] = [8, 8];
    private gridDimensions: [number, number] = [300, 300];
    private tileMap: number[][] = [];

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

    //Background
    private drawBackground(projectionMatrix: mat4): void {
        const modelViewMatrix = mat4.create();
        
        mat4.rotate(
            modelViewMatrix,
            modelViewMatrix,
            this.rotation,
            [0, 0, 0]
        );

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkBackgroundPosition);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkBackgroundColor);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexColor, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);

        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
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

        //Background
        this.drawBackground(projectionMatrix);
        this.setBackground();

        //Tile
        this.drawTile(projectionMatrix);

        this.gl.enable(this.gl.DEPTH_TEST);
    }

    private setBackground(): void {
        this.size = [this.setSize.w, this.setSize.h];

        const positions = [
            -this.size[0], -this.size[1],
            this.size[0], -this.size[1],
            -this.size[0],  this.size[1],
            this.size[0],  this.size[1],
        ];

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkBackgroundPosition);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        
        this.setColor('rgb(7, 0, 111)');
    }

    //Tile Grid
    private initGrid(): void {
        this.tileMap = Array(this.gridDimensions[1]).fill(0)
        .map(() => Array(this.gridDimensions[0]).fill(0));

        for(let y = 0; y < this.gridDimensions[1]; y++) {
            for(let x = 0; x < this.gridDimensions[0]; x++) {
                this.tileMap[y][x] = (x + y) % 2;
            }
        }
    }

    private drawTile(projectionMatrix: mat4): void {
        const canvas = this.gl.canvas;
        const aspect = canvas.width / canvas.height;

        const backgroundWidth = this.setSize.w;
        const backgroundHeight = this.setSize.h;

        const tileWidth = (2 * backgroundWidth * aspect) / this.gridDimensions[0];
        const tileHeight = (2 * backgroundHeight * aspect) / this.gridDimensions[1];

        const startX = -backgroundWidth * aspect;
        const startY = backgroundHeight;

        for(let y = 0; y < this.gridDimensions[1]; y++) {
            for(let x = 0; x < this.gridDimensions[0]; x++) {
                const tileType = this.tileMap[y][x];
                this.renderTile(
                    x, y, 
                    tileType, 
                    tileWidth, tileHeight, 
                    startX, startY,
                    projectionMatrix,
                );
            }
        }
    }

    private renderTile(
        gridX: number,
        gridY: number,
        tileType: number,
        tileWidth: number,
        tileHeight: number,
        startX: number,
        startY: number,
        projectionMatrix: mat4
    ): void {
        const modelViewMatrix = mat4.create();

        const x = startX + gridX * tileWidth;
        const y = startY - (gridY + 1) * tileHeight;

        mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, 0]);

        const positions = [
            0, 0,
            tileWidth, 0,
            0, tileHeight,
            tileWidth, tileHeight
        ];

        const color = 
            tileType === 0 ?
            this.parseColor('rgb(0, 0, 0)') :
            this.parseColor('rgb(41, 41, 41)')
        ;

        const colors = [
            ...color, ...color, ...color, ...color
        ];

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkTilePosition);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkTileColor);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexColor, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);

        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    private setColor(color: string | [number, number, number, number]): void {
        this.color = this.parseColor(color);

        const colors = [
            this.color[0], this.color[1], this.color[2], this.color[3],
            this.color[0], this.color[1], this.color[2], this.color[3],
            this.color[0], this.color[1], this.color[2], this.color[3],
            this.color[0], this.color[1], this.color[2], this.color[3]
        ];

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkBackgroundColor);
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
        if(this.state.isLoading()) return;

        this.rotation += this.tick['speed'] * deltaTime;
        this.createBackground();
    }

    public async init(): Promise<void[]> {
        this.initGrid();

        const onInit = [
            this.createBackground()
        ];

        this.state.markInit('dk');
        return onInit;
    }
}