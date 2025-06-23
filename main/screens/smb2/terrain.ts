import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

import { ScreenSmb } from "./main.js";
import { LevelState } from "./level-state.js";
import { GroundCoords, States } from "./texture-map.interface.js";
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

    private cols: number = 35;
    private scroll: number = 0.0;
    private speed: number = 0.1;

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
    private isGroundTuple(coords: GroundCoords): coords is [number, number] {
        return Array.isArray(coords) && coords.length === 2;
    }

    private isGroundObj(coords: GroundCoords): coords is { 
        ground: [number, number]; 
        ceil: [number, number] 
    } {
        return !Array.isArray(coords) && 'ground' in coords;
    }

    private drawGround(
        projectionMatrix: mat4, 
        type: States,
        x: number,
        y: number,
        lastTexture?: [number, number]
    ): void {
        if(!type) return;

        const modelViewMatrix = mat4.create();

        const groundMap = this.textureMap.ground;
        const map = groundMap[type];
        if(!map) return;

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

        let spriteCoords: [number, number];

        if(this.isGroundTuple(map)) {
            spriteCoords = map;
        } else if(this.isGroundObj(map)){
            spriteCoords = (type === States.Underground && lastTexture)
            ? lastTexture
            : map.ground
        } else {
            spriteCoords = [0, 0];
            throw new Error('err');
        }

        const [spriteX, spriteY] = spriteCoords;
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
        const width = this.size[0] * 1.95;
        const height = this.size[1] * 1.95;
        const lastWidth = width * 0.83;
        const lastHeight = height * 9.25;

        //Underwater
        const waterCoords = height * 4.62;

        //Castle
        const castleGroundCoords = this.position[0] * 2.8;
        const lavaCoords = height - 1.003;

        const rows =
        this.currentState === States.Underwater ? 1 :
        this.currentState === States.Castle ? 3 :
        this.currentState === States.Underground ? 3 : 2

        const startX = this.position[0];
        const startY = this.position[1] + this.screen['setSize'].h * 0.1;

        for(let i = 0; i < rows; i++) {
            for(let j = 0; j < this.cols; j++) {
                //Normal X
                const x =
                this.currentState === States.Castle && i <= 1
                ? castleGroundCoords + j * width
                : startX + j * width

                //Normal Y
                const y = 
                (this.currentState !== States.Castle && this.currentState !== States.Underground)
                ? startY + i * height
                : startY + (i <= 1 ? height * i : lastHeight);

                //Last X
                const lx = startX + j * lastWidth;

                //Underground
                if(this.currentState === States.Underground && i === 2) {
                    const ceilCoords = this.textureMap.ground.underground.ceil as [number, number];

                    this.drawGround(
                        projectionMatrix, 
                        this.currentState, 
                        lx, 
                        y,
                        ceilCoords
                    );
                } else {
                    this.drawGround(projectionMatrix, this.currentState, x, y);
                }

                //Underwater
                if(this.currentState === States.Underwater) {
                    const scroll = x + this.scroll;
                    const wrapped = scroll % (this.cols * width);
                    const finalCoord = 1.1;
                    const final = wrapped < startX * finalCoord ? wrapped + (this.cols * width) : wrapped;
                    this.drawWater(projectionMatrix, final, waterCoords);
                }

                //Lava
                if(this.currentState === States.Castle && i === 0) {
                    const scroll = x + this.scroll;
                    const wrapped = scroll % (this.cols * width);
                    const finalCoord = 1.1;
                    const final = wrapped < startX * finalCoord ? wrapped + (this.cols * width) : wrapped;
                    this.drawLava(projectionMatrix, final, lavaCoords);
                }
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

            const map = this.textureMap.elements.water as [number, number];
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

    //Castle
        private drawLava(
            projectionMatrix: mat4, 
            x: number,
            y: number
        ): void {
            const map = 
            this.textureMap.elements.lava as { 
                f: [number, number],
                s: [number, number]
            }
            
            const sheetSize = this.sheetProps.tilesetProps().spriteSheetSize;
            const spriteSize = this.sheetProps.tilesetProps().spriteProps.ground.spriteSize;


            const positions = [
                -this.size[0], -this.size[1],
                this.size[0], -this.size[1],
                -this.size[0], this.size[1],
                this.size[0], this.size[1],
            ];

            const topRowY = y + this.size[1];
            const bottomRowY = y;
            const depperRowY = y - this.size[1];
            const z = -0.1;

           const fModelViewMatrix = mat4.create();
           mat4.translate(fModelViewMatrix, fModelViewMatrix, [x, topRowY, z]);
           this.drawLavaFrame(projectionMatrix, fModelViewMatrix, positions, map.f, sheetSize, spriteSize);

           const sModelViewMatrix = mat4.create();
           mat4.translate(sModelViewMatrix, sModelViewMatrix, [x, bottomRowY, z]);
           this.drawLavaFrame(projectionMatrix, sModelViewMatrix, positions, map.s, sheetSize, spriteSize);

           const tModelViewMatrix = mat4.create();
           mat4.translate(tModelViewMatrix, tModelViewMatrix, [x, depperRowY, z]);
           this.drawLavaFrame(projectionMatrix, tModelViewMatrix, positions, map.s, sheetSize, spriteSize);
        }

        private drawLavaFrame(
            projectionMatrix: mat4,
            modelViewMatrix: mat4,
            positions: number[],
            frameCoords: [number, number],
            sheetSize: [number, number],
            spriteSize: [number, number]
        ): void {
            const [spriteX, spriteY] = frameCoords;
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

            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.uniform1f(this.programInfo.uniformLocations.isLava, 1);
            this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
            this.gl.uniform1f(this.programInfo.uniformLocations.isLava, 0);
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

    public update(deltaTime: number) {
        const width = this.cols * this.size[0];

        if(this.currentState === States.Underwater) {
            this.scroll -= this.speed * deltaTime;
            const totalWidth = width;
            if(this.scroll <= -totalWidth) this.scroll += totalWidth;
        }

        if(this.currentState === States.Castle) {
            this.scroll -= this.speed * deltaTime;
            const totalWidth = width;
            if(this.scroll <= -totalWidth) this.scroll += totalWidth;
        }
    }
}