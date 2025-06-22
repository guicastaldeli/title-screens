import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

import { ScreenSmb } from "./main.js";
import { LevelState } from "./level-state.js";
import { States } from "./texture-map.interface.js";
import { SheetProps } from "./sheet-props.js";
import { TextureMap } from "./texture-map.js";

export class Terrain {
    private gl: WebGLRenderingContext;
    private texture: WebGLTexture | null = null;

    private buffers: Buffers;
    private programInfo: ProgramInfo;

    private screen: ScreenSmb;
    private levelState: LevelState;
    private currentState: States;
    private sheetProps: SheetProps;
    private textureMap: TextureMap;
    
    private position: [number, number] = [-2.1, -1.2];
    private size: [number, number] = [0.1, 0.1];

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

    private glConfig(
        projectionMatrix: mat4,
        modelViewMatrix: mat4,
        positions: number[], 
        coords: number[]
    ) {
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
        this.gl.uniform1f(this.programInfo.uniformLocations.isGround, 1);
            
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    //Ground    
    private drawGround(
        projectionMatrix: mat4, 
        type: States,
        x: number,
        y: number
    ): void {
        if(!type) return;

        const modelViewMatrix = mat4.create();

        const map = this.textureMap.ground;
        const sheetSize = this.sheetProps.tilesetProps().spriteSheetSize;
        const spriteSize = this.sheetProps.tilesetProps().spriteProps.ground.spriteSize;

        mat4.translate(
            modelViewMatrix,
            modelViewMatrix,
            [x, y, 0]
        );

        const positions = [
            -this.size[0], -this.size[1],
            this.size[0], -this.size[1],
            -this.size[0], this.size[1],
            this.size[0], this.size[1],
        ];

        const [spriteX, spriteY] = map[type];
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

        this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
    }

    private setGround(projectionMatrix: mat4): void {
        const width = this.size[0] * 1.98;
        const height = this.size[1] * 1.98;

        //Underwater
        const waterCoords = height * 4.55;

        //Castle
        const lavaCoords = 0;
        const castleHeight = height * 9.1;

        const cols = 25;
        const rows = this.currentState !== States.Underwater ? 2 : 1;

        const startX = this.position[0];
        const startY = this.position[1] + this.screen['setSize'].h * 0.1;

        for(let i = 0; i < rows; i++) {
            for(let j = 0; j < cols; j++) {
                const x = startX + j * width;

                const y = 
                this.currentState !== 
                States.Castle 
                ? startY + i * height
                : startY + i * castleHeight;

                this.drawGround(projectionMatrix, this.currentState, x, y);
                if(this.currentState === States.Underwater) this.drawWater(projectionMatrix, x, waterCoords);
            }
        }
    }

    //Underwater
        private drawWater(
            projectionMatrix: mat4, 
            x: number,
            y: number
        ): void {
            const modelViewMatrix = mat4.create();

            const map = this.textureMap.elements.water;
            const sheetSize = this.sheetProps.tilesetProps().spriteSheetSize;
            const spriteSize = this.sheetProps.tilesetProps().spriteProps.ground.spriteSize;

            mat4.translate(
                modelViewMatrix,
                modelViewMatrix,
                [x, y, 0]
            );

            const positions = [
                -this.size[0], -this.size[1],
                this.size[0], -this.size[1],
                -this.size[0], this.size[1],
                this.size[0], this.size[1],
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
 
            this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
        }
    //

    public async getTex(): Promise<void> {
        try {
            const path = './screens/smb2/assets/sprites/smb2-tileset.png';
            this.texture = await this.screen.loadTexture(this.gl, path);
        } catch(err) {
            console.log(err);
        }
    }

    public initTerrain(projectionMatrix: mat4): void {        
        this.setGround(projectionMatrix);
    }

    public updateState(): void {
        this.currentState = this.levelState.getCurrentState();
    }
}