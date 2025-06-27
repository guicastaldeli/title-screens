import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { Tick } from "../../tick.js";
import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

import { ScreenSmb } from "./main.js";
import { LevelState } from "./level-state.js";
import { States } from "./texture-map.interface.js";
import { SheetProps } from "./sheet-props.js";
import { TextureMap } from "./texture-map.js";

import { Points } from "./points.js";

export class Entities {
    private tick: Tick;
    private gl: WebGLRenderingContext;
    private texture: WebGLTexture | null = null;

    private buffers: Buffers;
    private programInfo: ProgramInfo;

    private screen: ScreenSmb;
    private levelState: LevelState;
    private currentState: States;
    private sheetProps: SheetProps;
    private textureMap: TextureMap;

    private points: Points;

    //Direction
        private readonly currentY: number = -0.48;
        private readonly defaultStartX: number = 1.8;
        private readonly castleStartX: number = 0.5;
        private readonly startY: number = -0.61;
        private readonly endX: number = -1.0;

        private get startX(): number {
            return this.currentState === States.Castle ? this.castleStartX : this.defaultStartX;
        }
    //

    //Entities Animation
    private walkSpeed: number = 0.2;
    private walkDirection: number = -1;
    private walkPositionX: number = this.startX;
    private walkSpriteToggleTime: number = 0;
    private walkSpriteInterval: number = 500;
    private useFirstWalkSprite: boolean = true;
    private lastUpdateTime: number = 0;
    
    //Koopa Animation
    private readonly koopaStartY = -0.62;
    private readonly koopaStartX = 2.3;
    private readonly koopaEndX = -2.5;
    
    private jumpStartTime: number = 0;
    private isJumping: boolean = false;
    private gravity: number = -3.2;
    private jumpDelay: number = 3000;
    private lastJumpTime: number = 0;
    private left: boolean = true;
    private jumpPosition: { x: number, y: number } = { x: this.koopaStartX, y: this.currentY }
    private jumpVelocity: { x: number, y: number } = { x: -2.5, y: -3.0 }
    private spriteStateTime: number = 0;
    private useStandingprite: boolean = true;

    //Points
    private clickHandler: (e: globalThis.MouseEvent) => void;
    private isClickable: boolean = true;
    private clickCooldown: number = 100;
    private lastClickTime: number = 0;

    constructor(
        tick: Tick,
        gl: WebGLRenderingContext,
        buffers: Buffers,
        programInfo: ProgramInfo,
        screen: ScreenSmb,
        levelState: LevelState,
        sheetProps: SheetProps,
        points: Points
    ) {
        this.tick = tick;
        this.tick.add(this.update.bind(this));
        
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;

        this.screen = screen;
        this.levelState = levelState;
        this.currentState = this.levelState.getCurrentState();
        this.sheetProps = sheetProps;
        this.textureMap = new TextureMap();

        this.startJump();
        this.lastJumpTime = performance.now();
        this.walkSpriteToggleTime = performance.now();

        this.points = points;
        this.handleClick = this.handleClick.bind(this);
        this.clickHandler = (e: MouseEvent) => this.handleClick(e);
        document.addEventListener('click', this.clickHandler);
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
        let map;

        if(this.currentState === States.Overworld) {
            if(type === 'koopa') map = this.useStandingprite ? data.s : data.f;
        } else {
            if(type !== 'koopa') map = this.useFirstWalkSprite ? data.f : data.s;
        }

        const entityProps = this.sheetProps.entityProps();
        const sheetSize = entityProps.sheetSize;

        const stateSpriteSizes = entityProps.spriteSize[this.currentState];
        const spriteSize = stateSpriteSizes[type];

        const boxSizeType = stateSpriteSizes.boxSize;
        const currentSize = sizes[boxSizeType];

        let x, y;
        
        if(this.currentState === States.Overworld) {
            x = this.isJumping ? this.jumpPosition.x : this.koopaStartX;
            y = this.isJumping ? this.jumpPosition.y : this.koopaStartY + currentSize.h;
        } else {
            x = this.walkPositionX;
            y = this.startY + currentSize.h;
        }

        mat4.translate(
            modelViewMatrix,
            modelViewMatrix,
            [x, y, -0.5]
        );

        if(!this.left) {
            mat4.scale(
                modelViewMatrix,
                modelViewMatrix,
                [-1, 1, 1]
            );
        }

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

        this.gl.depthFunc(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.LEQUAL);
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

    //Entity Animation
        //Other Entities
        private updateWalk(deltaTime: number): void {
            const currentTime = performance.now();
            const deltaTimeUpdate = deltaTime / 1000;
            this.walkPositionX += this.walkDirection * this.walkSpeed * deltaTimeUpdate;

            if(this.walkPositionX <= this.endX) {
                this.walkPositionX = this.endX;
                this.walkDirection = 1;
                this.left = false;
            } else if(this.walkPositionX >= this.startX) {
                this.walkPositionX = this.startX;
                this.walkDirection = -1;
                this.left = true;
            }

            if(currentTime - this.walkSpriteToggleTime > this.walkSpriteInterval) {
                this.useFirstWalkSprite = !this.useFirstWalkSprite;
                this.walkSpriteToggleTime = currentTime;
            }
        }

        //Koopa
        private startJump(): void {
            this.isJumping = true;
            this.jumpStartTime = performance.now();
            this.lastJumpTime = this.jumpStartTime;

            this.jumpPosition.y = this.currentY;

            if(this.left) {
                this.jumpVelocity = { x: -0.3, y: 1.5 }
            } else {
                this.jumpVelocity = { x: 0.3, y: 1.5 }
            }
        }

        private updateJump(deltaTime: number): void {
            if(!this.isJumping) return;

            const currentTime = performance.now();
            const deltaTimeUpdate = deltaTime / 1000;

            this.jumpPosition.x += this.jumpVelocity.x * deltaTimeUpdate;
            this.jumpPosition.y += this.jumpVelocity.y * deltaTimeUpdate + 0.5 * this.gravity * deltaTimeUpdate * deltaTimeUpdate;
            this.jumpVelocity.y += this.gravity * deltaTimeUpdate;

            if(this.jumpPosition.x <= this.koopaEndX) {
                this.jumpPosition.x = this.koopaEndX;
                this.jumpVelocity.x = Math.abs(this.jumpVelocity.x);
                this.left = false;
            } else if(this.jumpPosition.x >= this.koopaStartX) {
                this.jumpPosition.x = this.koopaStartX;
                this.jumpVelocity.x = -Math.abs(this.jumpVelocity.x);
                this.left = true;
            }

            if(this.jumpPosition.y > this.currentY) {
                if(this.useStandingprite) {
                    if(this.spriteStateTime === 0) this.spriteStateTime = currentTime;
                    if((currentTime - this.spriteStateTime) > 500) this.useStandingprite = false;
                }
            }

            if(this.jumpPosition.y < this.currentY) {
                this.jumpPosition.y = this.currentY;
                this.isJumping = false;
                this.lastJumpTime = currentTime;

                this.useStandingprite = true;
                this.spriteStateTime = 0;

                this.startJump();
            }
        }
    //

    private handleClick(e: MouseEvent): void {
        const currentTime = performance.now();
        if(currentTime - this.lastClickTime < this.clickCooldown) return;
        if(!this.isClickable) return;

        this.lastClickTime = currentTime;

        const canvas = this.gl.canvas;
        if(!(canvas instanceof HTMLCanvasElement)) return;
        const rect = canvas.getBoundingClientRect();

        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        let entityX, entityY;

        if(this.currentState === States.Overworld) {
            entityX = this.isJumping ? this.jumpPosition.x : this.koopaStartX;
            entityY = this.isJumping ? this.jumpPosition.y : this.koopaStartY;
        } else {
            entityX = this.walkPositionX;
            entityY = this.startY;
        }

        const entityWidth = 1.0;
        const entityHeight = 1.0;

        if(x >= entityX - entityWidth &&
            x <= entityX + entityWidth &&
            y >= entityY - entityHeight &&
            y <= entityY + entityHeight
        ) {
            const point = Math.floor(Math.random() * 200);
            this.points.addScore(point);
            this.points.addCoin();
            this.points.addTime();
            this.screen.hud.setHud();
        }
    }

    public initEntity(projectionMatrix: mat4): void {
        this.drawEntities(projectionMatrix);
    }

    public updateState(): void {
        this.currentState = this.levelState.getCurrentState();
    }

    public update(deltaTime: number): void {
        if(deltaTime <= 0 || this.tick.timeScale <= 0) return;
        const currentTime = deltaTime * 800;

        if(this.currentState === States.Overworld && this.textureMap.entity[this.currentState].koopa) {
            if(!this.isJumping && (currentTime - this.lastJumpTime) > this.jumpDelay) this.startJump();   
            if(this.isJumping) this.updateJump(currentTime);
        } else {
            this.updateWalk(currentTime);
        }
    }
}