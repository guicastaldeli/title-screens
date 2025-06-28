var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { mat4 } from "../../node_modules/gl-matrix/esm/index.js";
import { TextureMap } from "./texture-map.js";
import { ScreenStates } from "../state.js";
import { EventEmitter } from "./event-emitter.js";
import { States } from "./smb2/texture-map.interface.js";
export class AudioManager {
    constructor(gl, buffers, programInfo, screenManager, controller, globalActions) {
        this.texture = null;
        this.currentState = null;
        //Audio
        this.isAudioPlaying = false;
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
    requestState() {
        EventEmitter.emit('req-current-level-state');
        EventEmitter.on('res-current-level-state', (state) => {
            this.currentState = state;
        });
    }
    toggleAudio() {
        EventEmitter.on('toggle-music', (isOn) => {
            this.isAudioPlaying = isOn;
        });
    }
    levelStateChange() {
        EventEmitter.on('level-state-changed', (e) => {
            this.currentState = e.newState;
        });
    }
    drawPlayPause(projectionMatrix) {
        var _a;
        const modelViewMatrix = mat4.create();
        const currentScreen = this.screenManager.currentScreen();
        const map = this.textureMap.playPause[currentScreen];
        let spriteCoords;
        if (currentScreen === ScreenStates.Dk) {
            spriteCoords = this.isAudioPlaying
                ? map.pause
                : map.play;
        }
        else {
            const stateMap = map;
            const currentState = (_a = this.currentState) !== null && _a !== void 0 ? _a : States.Overworld;
            spriteCoords = this.isAudioPlaying
                ? stateMap[currentState].pause
                : stateMap[currentState].play;
        }
        const sheetSize = [52, 52];
        const spriteSize = [16, 16];
        const size = [0.045, 0.1];
        const x = currentScreen === ScreenStates.Dk ? -0.45 : -0.55;
        const y = currentScreen === ScreenStates.Dk ? 0.73 : 0.7;
        mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, -0.9]);
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
    getTex() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const path = './assets/sprites/play-pause-btn-tile.png';
                this.texture = yield this.globalActions.loadTexture(this.gl, path);
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    initAudioManager() {
        return __awaiter(this, void 0, void 0, function* () {
            const projectionMatrix = mat4.create();
            this.drawPlayPause(projectionMatrix);
            yield this.getTex();
        });
    }
}
