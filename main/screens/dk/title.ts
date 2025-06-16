import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

import { SheetProps } from "./sheet-props.js";
import { ScreenDk } from "./main.js";

export class Title {
    private gl: WebGLRenderingContext;

    private buffers: Buffers;
    private programInfo: ProgramInfo;
    
    private screen: ScreenDk;
    private sheetProps: SheetProps;

    private position: [number, number] = [-0.05, 0.2];
    private size: [number, number] = [0.8, 0.4];

    constructor(
        gl: WebGLRenderingContext,
        buffers: Buffers, 
        programInfo: ProgramInfo,
        screen: ScreenDk,
        sheetProps: SheetProps,
    ) {
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;

        this.screen = screen;
        this.sheetProps = sheetProps;
    }

    public drawTitle(projectionMatrix: mat4): void {
        const modelViewMatrix = mat4.create();

        const titleX = this.position[0];
        const titleY = this.position[1] + this.screen['setSize'].h * 0.1;

        mat4.translate(
            modelViewMatrix,
            modelViewMatrix,
            [titleX, titleY, 0]
        );

        const positions = [
            -this.size[0], -this.size[1],
            this.size[0], -this.size[1],
            -this.size[0], this.size[1],
            this.size[0], this.size[1],
        ];

        const [spriteX, spriteY] = this.sheetProps.spriteCoords;
        const [sheetWidth, sheetHeight] = this.sheetProps.spriteSheetSize;
        const [spriteWidth, spriteHeight] = this.sheetProps.spriteSize;

        const left = spriteX / sheetWidth;
        const right = (spriteX + spriteWidth) / sheetWidth;
        const top = spriteY / sheetHeight;
        const bottom = ((spriteY + spriteHeight) / sheetHeight);

        const coords = [
            left, bottom,
            right, bottom,
            left, top,
            right, top
        ];

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkTilePosition);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkTitleTextureCoord);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(coords), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.textureCoord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.buffers.dkTitleTexture);
        this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.uTex, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isText, 0);
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
}