import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

import { ScreenSmb } from "./main.js";
import { LevelState } from "./level-state.js";
import { GroundCoords, States } from "./texture-map.interface.js";
import { SheetProps } from "./sheet-props.js";
import { TextureMap } from "./texture-map.js";

export class Player {
    private gl: WebGLRenderingContext;
    private texture: WebGLTexture | null = null;

    private buffers: Buffers;
    private programInfo: ProgramInfo;

    private screen: ScreenSmb;
    private levelState: LevelState;
    private currentState: States;
    private sheetProps: SheetProps;
    private textureMap: TextureMap;

    public character: 'mario' | 'luigi' = 'mario';
    private sizeState: 'small' | 'big' = 'small';
    private actionState: 'normal' | 'swim' = 'normal';
    private charSizes: Record<'mario' | 'luigi', 'small' | 'big'> = {
        mario: 'small',
        luigi: 'small'
    }

    constructor(
        gl: WebGLRenderingContext,
        buffers: Buffers,
        programInfo: ProgramInfo,
        screen: ScreenSmb,
        levelState: LevelState,
        sheetProps: SheetProps,
    ) {
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;

        this.screen = screen;
        this.levelState = levelState;
        this.currentState = this.levelState.getCurrentState();
        this.sheetProps = sheetProps;
        this.textureMap = new TextureMap();

        window.addEventListener('keydown', (e) => this.handleKey(e));
    }

    public setCharacter(char: 'mario' | 'luigi'): void {
        this.character = char;
        this.sizeState = this.charSizes[char];
    }

    private drawPlayer(projectionMatrix: mat4): void {
        const modelViewMatrix = mat4.create();

        const sizes = { small: [0.1, 0.1], big: [0.1, 0.2] };
        const currentSize = sizes[this.sizeState];

        const map = this.textureMap.player.player[this.character][this.sizeState][this.actionState] as [number, number];
        const sheetSize = this.sheetProps.playersetProps().sheetSize;
        const spriteSize = this.sheetProps.playersetProps().spriteSize.player[this.character][this.sizeState];

        const x = -1.5;
        const y = 0.7;

        mat4.translate(
            modelViewMatrix,
            modelViewMatrix,
            [x, y, 0]
        );

        const positions = [
            -currentSize[0], -currentSize[1],
            currentSize[0], -currentSize[1],
            -currentSize[0], currentSize[1],
            currentSize[0], currentSize[1],
        ];

        const [spriteX, spriteY] = map;
        const [sheetWidth, sheetHeight] = sheetSize;
        const [spriteWidth, spriteHeight] = spriteSize;

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

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.smbTilePosition);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.smbTileTextureCoord);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(coords), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.textureCoord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.uTex, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isText, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isHud, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isShadowText, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isHudText, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isGround, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 1);
            
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    private handleKey(e: KeyboardEvent): void {
        if(e.key.toLowerCase() === 'g') this.toggleSize();
    }

    private toggleSize(): void {
        this.charSizes[this.character] = this.charSizes[this.character] === 'small' ? 'big' : 'small';
        this.sizeState = this.charSizes[this.character];
    }

    public async getTex(): Promise<void> {
        try {
            const path = './screens/smb2/assets/sprites/smb2-mario-luigi-sprites.png';
            this.texture = await this.screen.loadTexture(this.gl, path);
        } catch(err) {
            console.log(err);
        }
    }

    public initPlayer(projectionMatrix: mat4) {
        this.drawPlayer(projectionMatrix);
    }
}