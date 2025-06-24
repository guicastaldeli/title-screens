import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

import { ScreenSmb } from "./main.js";
import { LevelState } from "./level-state.js";
import { GroundCoords, States } from "./texture-map.interface.js";
import { SheetProps } from "./sheet-props.js";
import { TextureMap } from "./texture-map.js";
import { GroundPairedCoords } from "./texture-map.interface.js";

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
    private rows: number = 2;
    private numClouds: number = 8;
    private scroll: number = 0.0;
    private speed: number = 0.2;
    private spacing: number = 50;
    private clouds: Array<{
        x: number,
        y: number,
        speed: number,
        scale: number,
        variant: keyof GroundPairedCoords
    }> = [];

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
        this.initCloudVariants();
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

        this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 1);
        this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
        this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 0);
    }

    private setTerrain(projectionMatrix: mat4): void {
        const width = this.size[0] * 1.95;
        const height = this.size[1] * 1.95;
        const lastWidth = width * 0.83;
        const lastHeight = height * 9.25;

        const startX = this.position[0];
        const startY = this.position[1] + this.screen['setSize'].h * 0.1;

        for(let i = 0; i < this.rows; i++) {
            for(let j = 0; j < this.cols; j++) {
                const x = startX + j * width;
                const y = startY + i * height;

                switch(this.currentState) {
                    case States.Overworld:
                        this.setOverworldTerrain(projectionMatrix, x, y, j, i);
                        this.drawGround(projectionMatrix, this.currentState, x, y);
                        break;
                    case States.Underground:
                        this.setUndergroundTerrain(projectionMatrix, x, y, i, j, startX, startY, lastWidth, lastHeight);
                        break;
                    case States.Underwater:
                        this.setUnderwaterTerrain(projectionMatrix, x, width, height, startX, startY, lastHeight, i);
                        this.drawGround(projectionMatrix, this.currentState, x, y);
                        break;
                    case States.Castle:
                        this.setCastleTerrain(projectionMatrix, x, y, width, height, startX, startY, i, j);
                        break;
                }
            }
        }
    }

    //Elements
        //Overworld
            //Cloud
                private cloudLength = 15;
                private cloudGapX = () => Math.random() * (2 - 1.5) + 1.5;
                private cloudGapY = () => Math.random() * (0.5 - (-0.5)) + (-0.5);

                private initCloudVariants(): void {
                    for(let i = 0; i < this.cloudLength; i++) {
                        this.clouds.push({
                            x: this.position[0] + (i * this.cloudGapX()),
                            y: (this.size[1] * 2) + this.cloudGapY(),
                            speed: Math.random() * 0.05 + 0.05,
                            scale: 0.18,
                            variant: Math.random() < 0.6 ? 'f' : 's'
                        });
                    }
                }

                private updateClouds(deltaTime: number): void {
                    const lScreen = this.position[0];

                    for(const cloud of this.clouds) {
                        cloud.x -= cloud.speed * deltaTime;

                        if(cloud.x + cloud.scale < lScreen) {
                            let fCloud = this.clouds[0];

                            for(const c of this.clouds) {
                                if(c.x > fCloud.x) {
                                    fCloud = c;
                                }
                            }

                            cloud.x = fCloud.x + this.cloudGapX();
                            cloud.y = (this.size[1] * 2) + this.cloudGapY();
                            cloud.variant = Math.random() < 0.6 ? 'f' : 's'; 
                        }
                    }
                }

                private drawClouds(projectionMatrix: mat4): void {
                    const map = this.textureMap.elements.overworld.clouds as GroundPairedCoords;
                    const sheetSize = this.sheetProps.tilesetProps().spriteSheetSize;
                    const baseSize = [0.95, 0.6];
                    const spriteSizes = { f: [35, 25], s: [50, 30] }

                    for(const c of this.clouds) {
                        const modelViewMatrix = mat4.create();
                        const scaledWidth = baseSize[0] * c.scale;
                        const scaleHeight = baseSize[1] * c.scale;

                        mat4.translate(
                            modelViewMatrix,
                            modelViewMatrix,
                            [c.x, c.y, 0]
                        );

                        const positions = [
                            -scaledWidth, -scaleHeight,
                            scaledWidth, -scaleHeight,
                            -scaledWidth, scaleHeight,
                            scaledWidth, scaleHeight
                        ];
                        
                        const [spriteX, spriteY] = map[c.variant];
                        const [spriteWidth, spriteHeight] = spriteSizes[c.variant];
                        const [sheetWidth, sheetHeight] = sheetSize;

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

                        this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 1);
                        this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
                        this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 0);
                    }
                }
            //

            private drawCastle(
                projectionMatrix: mat4, 
                x: number,
                y: number
            ): void {
                const modelViewMatrix = mat4.create();

                const size = [0.5, 0.5];

                const map = this.textureMap.elements.overworld.castle as [number, number];
                const sheetSize = this.sheetProps.tilesetProps().spriteSheetSize;
                const spriteSize = [80, 80]

                const updX = 0.53;
                const updY = 0.79;

                mat4.translate(
                    modelViewMatrix,
                    modelViewMatrix,
                    [x + updX, y + updY, 0]
                );

                const positions = [
                    -size[0], -size[1],
                    size[0], -size[1],
                    -size[0], size[1],
                    size[0], size[1],
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
    
                this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 1);
                this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
                this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 0);
            }

            private drawTrees(
                projectionMatrix: mat4, 
                x: number,
                y: number
            ): void {
                const map = this.textureMap.elements.overworld.trees as { f: [number, number], s: [number, number] }
                const sheetSize = this.sheetProps.tilesetProps().spriteSheetSize;
                const spriteSizes = { f: [15.5, 31.7], s: [15.5, 65] }
                const variants = ['f', 's'];

                const updX = 3.2;
                const updY = 0.49;

                for(const variant of variants) {
                    const modelViewMatrix = mat4.create();
                    const size = variant === 'f' ? [0.11, 0.2] : [0.11, 0.41];
                    const xOffset = variant === 's' ? 0.5 : 0;

                    mat4.translate(
                        modelViewMatrix,
                        modelViewMatrix,
                        [
                            x + updX + xOffset, 
                            y + updY,
                            0
                        ]
                    );

                    const positions = [
                        -size[0], -size[1],
                        size[0], -size[1],
                        -size[0], size[1],
                        size[0], size[1],
                    ];

                    const [spriteX, spriteY] = map[variant];
                    const [spriteWidth, spriteHeight] = spriteSizes[variant];
                    const [sheetWidth, sheetHeight] = sheetSize;

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
        
                    this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 1);
                    this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
                    this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 0);
                }
            }

            private drawMushrooms(
                projectionMatrix: mat4, 
                x: number,
                y: number
            ): void {
                const modelViewMatrix = mat4.create();

                const map = this.textureMap.elements.overworld.mushrooms as [number, number];
                const sheetSize = this.sheetProps.tilesetProps().spriteSheetSize;
                const spriteSize = [32, 16.2];
                const size = [0.18, 0.08];

                const updX = 4.0;
                const updY = 0.37;

                mat4.translate(
                    modelViewMatrix,
                    modelViewMatrix,
                    [x + updX, y + updY, 0]
                );

                const positions = [
                    -size[0], -size[1],
                    size[0], -size[1],
                    -size[0], size[1],
                    size[0], size[1],
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
    
                this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 1);
                this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
                this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 0);
            }

            //Set
            private setOverworldTerrain(
                projectionMatrix: mat4, 
                x: number, 
                y: number,
                j: number,
                i: number
            ): void {
                this.drawClouds(projectionMatrix);

                if(i === 0 && j === 0) {
                    this.drawCastle(projectionMatrix, x, y);
                    this.drawTrees(projectionMatrix, x, y);
                    this.drawMushrooms(projectionMatrix, x, y);
                }
            }
        //

        //Underground
            private drawPipe(
                projectionMatrix: mat4, 
                x: number,
                y: number
            ): void {
                const modelViewMatrix = mat4.create();

                const map = this.textureMap.elements.underground.pipe;
                const sheetSize = this.sheetProps.tilesetProps().spriteSheetSize;
                const spriteSize = [31, 63];
                const size = [0.12, 0.29];

                const updX = 0.12;
                const updY = 1.61;

                mat4.translate(
                    modelViewMatrix,
                    modelViewMatrix,
                    [x + updX, y + updY, 0]
                );

                const positions = [
                    -size[0], -size[1],
                    size[0], -size[1],
                    -size[0], size[1],
                    size[0], size[1],
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
    
                this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 1);
                this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
                this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 0);
            }

            //Set
            private setUndergroundTerrain(
                projectionMatrix: mat4,
                x: number,
                y: number,
                i: number,
                j: number,
                startX: number,
                startY: number,
                lastWidth: number,
                lastHeight: number
            ): void {
                this.rows = 3;
                const ceilX = startX / 1.25 + j * lastWidth;
                const ceilY = startY + lastHeight;

                if(i === 0 && j === 0) this.drawPipe(projectionMatrix, x, y);

                if(i === 2) {
                    const ceilCoords = this.textureMap.ground.underground.ceil as [number, number];
                    this.drawGround(
                        projectionMatrix, 
                        this.currentState, 
                        ceilX, 
                        ceilY, 
                        ceilCoords
                    );
                } else {
                    this.drawGround(projectionMatrix, this.currentState, x, y);
                }
            }
        //

        //Underwater
            private drawWater(
                projectionMatrix: mat4, 
                x: number,
                y: number
            ): void {
                const modelViewMatrix = mat4.create();

                const map = this.textureMap.elements.underwater.water as [number, number];
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

            //Set
            private setUnderwaterTerrain(
                projectionMatrix: mat4, 
                x: number,
                width: number,
                height: number,
                startX: number,
                startY: number,
                lastHeight: number,
                i: number
            ): void {
                this.rows = 1;
                if(i <= 1) startY + (i <= 1 ? height * i : lastHeight);
                const waterCoordsY = height * 4.62;

                const scroll = x + this.scroll;
                const wrapped = scroll % (this.cols * width);
                const finalCoord = 1.1;
                const finalX = wrapped < startX * finalCoord ? wrapped + (this.cols * width) : wrapped;
                this.drawWater(projectionMatrix, finalX, waterCoordsY);
            }
        //

        //Castle
            private drawLava(
                projectionMatrix: mat4, 
                x: number,
                y: number
            ): void {
                const map = this.textureMap.elements.castle.lava as { f: [number, number], s: [number, number] }
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
                this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 1);
                this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
                this.gl.uniform1f(this.programInfo.uniformLocations.isLava, 0);
                this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 0);
            }

            //Set
            private setCastleTerrain(
                projectionMatrix: mat4,
                x: number,
                y: number,
                width: number,
                height: number,
                startX: number,
                startY: number,
                i: number,
                j: number
            ): void {
                this.rows = 4;
                const normalCoord = this.position[0] + j * width;
                const castleGroundCoords = this.position[0] * 2.8;
                const groundY = (startY * 1.11) + (i * height / 2);
                const castleX = castleGroundCoords + j * width;
                const lavaCoordsY = height - 1.003;
                const ceilY = startY + height * 9.25;

                if(i === 0) {
                    const scroll = x + this.scroll;
                    const wrapped = scroll % (this.cols * width);
                    const finalCoord = 1.1;
                    const finalX = wrapped < startX * finalCoord ? wrapped + (this.cols * width) : wrapped;
                    this.drawLava(projectionMatrix, finalX, lavaCoordsY);
                } else if(i === 2) {
                    this.drawGround(projectionMatrix, this.currentState, normalCoord, ceilY);
                } else {
                    this.drawGround(projectionMatrix, this.currentState, castleX, groundY);
                }
            }
        //
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
        this.setTerrain(projectionMatrix);
    }

    public updateState(): void {
        this.rows = 2;
        this.currentState = this.levelState.getCurrentState();
    }

    public update(deltaTime: number) {
        const width = this.cols * this.size[0];
        this.scroll -= this.speed * deltaTime;
        this.updateClouds(deltaTime);

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