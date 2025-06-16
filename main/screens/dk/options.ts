import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

import { ScreenDk } from "./main.js";
import { Title } from "./title.js";

export class Options {
    private gl: WebGLRenderingContext;

    private buffers: Buffers;
    private programInfo: ProgramInfo;

    private screen: ScreenDk;
    private title: Title;

    private containerPosition: [number, number] = [0, 0];

    private options: {
        text: string,
        position: [number, number]
    }[] = [];

    private letterCoords: Record<string, [number, number]> = {
        ' ': [0, 0],
        '1': [0, 0],
        '2': [0, 0],
        'A': [0, 0],
        'B': [0, 0],
        'E': [0, 0],
        'G': [0, 0],
        'L': [0, 0],
        'M': [0, 0],
        'P': [0, 0],
        'R': [0, 0],
        'Y': [0, 0],
    }

    constructor(
        gl: WebGLRenderingContext,
        buffers: Buffers, 
        programInfo: ProgramInfo,
        screen: ScreenDk,
        title: Title
    ) {
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;

        this.screen = screen;
        this.title = title;

        this.setOptions();
    }

    private setOptions(): void {
        this.options = [
            {
                text: '1 PLAYER GAME A',
                position: [0, 0]
            },
            {
                text: '1 PLAYER GAME B',
                position: [0, -0.15]
            },
            {
                text: '2 PLAYER GAME A',
                position: [0, -0.30]
            },
            {
                text: '2 PLAYER GAME B',
                position: [0, -0.45]
            }
        ];   
    }

    public drawOptions(
        projectionMatrix: mat4,
        text: string,
        x: number,
        y: number,
    ): void {
        const letters = text.split('');
        const spacing = 0.2;
        const startX = x - ((letters.length * spacing) / 2);

        letters.forEach((l, i) => {
            const letterX = startX + (i * spacing);

            this.drawLetter(
                projectionMatrix,
                l,
                letterX,
                y,
            );
        });
    }

    private drawLetter(
        projectionMatrix: mat4,
        letter: string,
        x: number,
        y: number,
    ): void {
        const modelViewMatrix = mat4.create();
        const size = [0.05, 0.05];

        mat4.translate(
            modelViewMatrix,
            modelViewMatrix,
            [x, y, 0]
        );

        const positions = [
            -size[0], -size[1],
            size[0], -size[1],
            -size[0], size[1],
            size[0], size[1],
        ];

        const spriteCoords = this.letterCoords[letter] || this.letterCoords[' '];
        const [spriteX, spriteY] = spriteCoords;
        const [sheetWidth, sheetHeight] = this.title['spriteSheetSize'];
        const [spriteWidth, spriteHeight] = this.title['spriteSize'];

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
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    public initOptions(projectionMatrix: mat4): void {
        const originalContainerPosition = [...this.containerPosition];

        this.options.forEach(option => {
            const x = originalContainerPosition[0] + option.position[0];
            const y = originalContainerPosition[1] + option.position[1];

            this.drawOptions(
                projectionMatrix,
                option.text,
                x,
                y
            );
        });
    }
}