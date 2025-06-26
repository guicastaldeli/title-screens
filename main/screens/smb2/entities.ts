import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

import { ScreenSmb } from "./main.js";
import { LevelState } from "./level-state.js";
import { States } from "./texture-map.interface.js";
import { SheetProps } from "./sheet-props.js";
import { TextureMap } from "./texture-map.js";

export class Entities {
    private gl: WebGLRenderingContext;
    private texture: WebGLTexture | null = null;

    private buffers: Buffers;
    private programInfo: ProgramInfo;

    private screen: ScreenSmb;
    private levelState: LevelState;
    private currentState: States;
    private sheetProps: SheetProps;
    private textureMap: TextureMap;

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
    }

    private drawEntities(projectionMatrix: mat4): void {
        const modelViewMatrix = mat4.create();

        const sizes = { 
            normal: { w: 0.1, h: 0.1 }, 
            big: { w: 0.1, h: 0.15 } 
        };
        
        const stateEntity = this.textureMap.entity[this.currentState];
        const type = Object.keys(stateEntity)[0];
        const data = stateEntity[type];
        const map = data.f;

        const entityProps = this.sheetProps.entityProps();
        const sheetSize = entityProps.sheetSize;

        const stateSpriteSizes = entityProps.spriteSize[this.currentState];
        const spriteSize = stateSpriteSizes[type];

        const boxSizeType = stateSpriteSizes.boxSize;
        const currentSize = sizes[boxSizeType];

        const x = -1;
        const y = -0.5;

        mat4.translate(
            modelViewMatrix,
            modelViewMatrix,
            [x, y, 0]
        );

        const positions = [
            -currentSize.w, -currentSize.h,
            currentSize.w, -currentSize.h,
            -currentSize.w, currentSize.h,
            currentSize.w, currentSize.h,
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
        this.gl.uniform1f(this.programInfo.uniformLocations.isPlayer, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isCloud, 0);

        const currentStateValue = Number(this.levelState.getStateId());
        this.gl.uniform1f(this.programInfo.uniformLocations.haveState, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.uState, currentStateValue);
            
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        this.gl.enable(this.gl.BLEND);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    public async getTex(): Promise<void> {
        try {
            const path = './screens/smb2/assets/sprites/smb2-enemies-sprites.png';
            this.texture = await this.screen.loadTexture(this.gl, path);
        } catch(err) {
            console.log(err);
        }
    }

    public initEntity(projectionMatrix: mat4): void {
        this.drawEntities(projectionMatrix);
    }

    public updateState(): void {
        this.currentState = this.levelState.getCurrentState();
    }

    public update(deltaTime: number): void {

    }
}