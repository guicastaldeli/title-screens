import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { Tick } from "../../tick.js";
import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

import { ScreenSmb } from "./main.js";
import { LevelState } from "./level-state.js";
import { States } from "./texture-map.interface.js";
import { SheetProps } from "./sheet-props.js";
import { TextureMap } from "./texture-map.js";
import { EventEmitter } from "../../event-emitter.js";
import { ScreenStates } from "../../state.js";

export class Player {
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

    public character: 'mario' | 'luigi' = 'mario';
    private sizeState: 'small' | 'big' = 'small';
    private actionState: 'normal' | 'swim' = 'normal';
    private charSizes: Record<'mario' | 'luigi', 'small' | 'big'> = {
        mario: 'small',
        luigi: 'small'
    }

    private currentY: number = -0.61;
    private targetY: number = -0.81;
    private transitionSpeed: number = 2.0;
    private isTransitioning: boolean = false;
    private hasTransitioned: boolean = false;

    private animationTimer: number = 0;
    private animationSpeed: number = 0.5;
    private currentFrame: 'f' | 's' = 'f';

    private isSizeChanging: boolean = false;
    private sizeChangeTimer: number = 0;
    private sizeChangeDuration: number = 0.8;
    private blinkInterval: number = 0.15;
    private nextBlinkTime: number = 0.15;
    private isVisible: boolean = true;
    private nextSizeState: 'small' | 'big' = 'small';
    private showNextSize: boolean = false;

    private readonly groundLevel = -0.61;
    private readonly seaLevel = -0.81;

    constructor(
        tick: Tick,
        gl: WebGLRenderingContext,
        buffers: Buffers,
        programInfo: ProgramInfo,
        screen: ScreenSmb,
        levelState: LevelState,
        sheetProps: SheetProps,
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

        window.addEventListener('keydown', (e) => this.handleKey(e));
    }

    public setCharacter(char: 'mario' | 'luigi'): void {
        this.character = char;
        this.sizeState = this.charSizes[char];
    }

    private drawPlayer(projectionMatrix: mat4): void {
        if(this.isSizeChanging && !this.isVisible) return;

        const modelViewMatrix = mat4.create();
        this.updateActionState();

        const displaySizeState = this.isSizeChanging && this.showNextSize
        ? this.nextSizeState
        : this.sizeState;

        const sizes = { 
            small: { w: 0.1, h: 0.1 }, 
            big: { w: 0.1, h: 0.2 } 
        };

        const currentSize = sizes[displaySizeState];
        const map = this.textureMap.player.player[this.character][displaySizeState][this.actionState];
        let spriteCoords: [number, number];

        if(this.actionState === 'normal') {
            spriteCoords = map as [number, number];
        } else {
            if(this.currentY !== this.seaLevel) {
                spriteCoords = (map as { f: [number, number], s: [number, number] }).f;
            } else {
                spriteCoords = (map as { f: [number, number], s: [number, number] }).s;
            }
        }

        const sheetSize = this.sheetProps.playersetProps().sheetSize;
        const spriteSize = this.sheetProps.playersetProps().spriteSize.player[this.character][displaySizeState];

        const x = -1.45;
        const y = this.currentY + currentSize.h;

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

    private updateActionState(): void {
        const prevState = this.currentState;
        this.currentState = this.levelState.getCurrentState();
        this.actionState = this.currentState === States.Underwater ? 'swim' : 'normal';

        if(prevState === this.currentState) return;

        if(this.currentState === States.Underwater) {
            if(!this.hasTransitioned) {
                this.targetY = this.seaLevel;
                this.isTransitioning = true;
                this.hasTransitioned = true;
            } else {
                this.currentY = this.seaLevel;
                this.targetY = this.seaLevel;
                this.isTransitioning = false;
            }
        } else {
            this.currentY = this.groundLevel;
            this.targetY = this.groundLevel;
            this.isTransitioning = false;
        }
    }

    private handleKey(e: KeyboardEvent): void {
        if(e.key.toLowerCase() === 'g') this.toggleSize();
    }

    private toggleSize(): void {
        if(this.isSizeChanging) return;

        this.isSizeChanging = true;
        this.sizeChangeTimer = 0;
        this.nextBlinkTime = 0;
        this.isVisible = true;
        this.showNextSize = false;

        const soundType = this.sizeState === 'small' ? 'grow' : 'hitTaken';
        this.nextSizeState = this.sizeState === 'small' ? 'big' : 'small';
        
        EventEmitter.emit('play-audio', {
            type: 'player',
            screen: ScreenStates.Smb,
            player: soundType
        })
    }

    private updateSize(deltaTime: number) {
        if(this.isSizeChanging) {
            this.sizeChangeTimer += deltaTime;

            if(this.sizeChangeTimer >= this.nextBlinkTime) {
                this.isVisible = !this.isVisible;
                if(this.isVisible) this.showNextSize = !this.showNextSize;
                this.nextBlinkTime += this.blinkInterval;
            }

            if(this.sizeChangeTimer >= this.sizeChangeDuration) {
                this.isSizeChanging = false;
                this.isVisible = true;
                this.charSizes[this.character] = this.nextSizeState;
                this.sizeState = this.charSizes[this.character];
            }
        }
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

    public update(deltaTime: number): void {
        if(deltaTime <= 0 || this.tick.timeScale <= 0) return;
        
        if(this.isTransitioning) {
            const diff = this.targetY - this.currentY;

            if(Math.abs(diff) < 0.001) {
                this.currentY = this.targetY;
                this.isTransitioning = false;
            } else {
                this.currentY += diff * this.transitionSpeed * deltaTime;
            }
        }

        this.updateSize(deltaTime);
    }
}