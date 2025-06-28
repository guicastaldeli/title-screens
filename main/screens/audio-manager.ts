import { mat4 } from "../../node_modules/gl-matrix/esm/index.js";

import { Buffers } from "../init-buffers.js";
import { ProgramInfo } from "../main.js";
import { TextureMap } from "./texture-map.js";
import { ScreenManager } from "../screen-manager.js";
import { ScreenStates } from "../state.js";
import { Contoller } from "../controller.js";
import { GlobalActions } from "./global-actions.js";
import { EventEmitter } from "./event-emitter.js";
import { States } from "./smb2/texture-map.interface.js";
import { PlayPausePairedCoords, PlayPauseSingleCoord } from "./option.interface.js";

export class AudioManager {
    private gl: WebGLRenderingContext;
    private buffers: Buffers;
    private programInfo: ProgramInfo;
    private screenManager: ScreenManager;
    private controller: Contoller;
    private globalActions: GlobalActions;

    public texture: WebGLTexture | null = null
    private textureMap: TextureMap;
    private currentState: States | null = null;

    //Audio
    private isAudioPlaying: boolean = false;

    constructor(
        gl: WebGLRenderingContext,
        buffers: Buffers,
        programInfo: ProgramInfo,
        screenManager: ScreenManager,
        controller: Contoller,
        globalActions: GlobalActions,
    ) {
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;
        this.screenManager = screenManager;
        this.controller = controller;
        this.globalActions = globalActions;

        this.textureMap = new TextureMap();
        this.requestState();
        this.toggleAudio();
        this.levelStateChange();
    }

    private requestState(): void {
        EventEmitter.emit('req-current-level-state');
        EventEmitter.on('res-current-level-state', (state: States) => {
            this.currentState = state;
        });
    }

    private toggleAudio(): void {
        EventEmitter.on('toggle-music', (isOn: boolean) => {
            this.isAudioPlaying = isOn;
        });
    }

    private levelStateChange(): void {
        EventEmitter.on('level-state-changed', (e: {
            newState: States;
            prevState: States | null;
            stateId: number;
            stateName: string
        }) => {
            this.currentState = e.newState;
        });
    }

    private drawPlayPause(projectionMatrix: mat4): void {
        const modelViewMatrix = mat4.create();
    
        const currentScreen = this.screenManager.currentScreen();
        const map = this.textureMap.playPause[currentScreen];
        let spriteCoords: PlayPauseSingleCoord;

        if(currentScreen === ScreenStates.Dk) {
            spriteCoords = this.isAudioPlaying
            ? (map as PlayPausePairedCoords).pause
            : (map as PlayPausePairedCoords).play;
        } else {
            const stateMap = (map as Record<States, PlayPausePairedCoords>);
            const currentState = this.currentState ?? States.Overworld;

            spriteCoords = this.isAudioPlaying
            ? stateMap[currentState].pause
            : stateMap[currentState].play; 
        }

        const sheetSize = [52, 52];
        const spriteSize = [16, 16];
        const size = [0.045, 0.1];
    
        const x = currentScreen === ScreenStates.Dk ? -0.45 : -0.55;
        const y = currentScreen === ScreenStates.Dk ? 0.73 : 0.7;
    
        mat4.translate(
            modelViewMatrix,
            modelViewMatrix,
            [x, y, -0.9]
        );
    
        const positions = [
            -size[0], -size[1],
            size[0], -size[1],
            -size[0], size[1],
            size[0], size[1],
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

        this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 1);
        this.globalActions.glConfig(projectionMatrix, modelViewMatrix, positions, coords, this.texture);
        this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 0);
    }

    private async getTex(): Promise<void> {
        try {
            const path = './assets/sprites/play-pause-btn-tile.png';
            this.texture = await this.globalActions.loadTexture(this.gl, path);
        } catch(err) {
            console.log(err);
        }
    }

    public async initAudioManager(): Promise<void> {
        const projectionMatrix = mat4.create();

        this.drawPlayPause(projectionMatrix);
        await this.getTex();
    }
}