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
import { EventEmitter } from "../event-emitter.js";
import { States } from "./smb2/texture-map.interface.js";
export class AudioManager {
    constructor(gl, buffers, programInfo, screenManager, controller, globalActions) {
        //Audio
        this.isPlayed = new Set();
        this.songMap = new Map();
        this.audioStates = new Map();
        this.isPaused = false;
        this.pausedTime = 0;
        this.lastPlayedState = null;
        this.isStateChanged = false;
        this.currentSong = null;
        this.currentState = null;
        this.playerSound = new Map();
        this.texture = null;
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;
        this.screenManager = screenManager;
        this.controller = controller;
        this.globalActions = globalActions;
        this.initAudio();
        this.requestState();
        this.toggleAudio();
        this.initAudioScreens();
        this.levelStateChange();
        this.handleScreenChange();
        this.textureMap = new TextureMap();
        //Emits
        this.emitScreenChange();
        this.emitSound();
        this.emitSong();
    }
    initAudio() {
        this.song = new Audio();
        this.optionSound = new Audio();
        this.selectedSound = new Audio();
        this.blockSound = new Audio();
        this.hitSound = new Audio();
        this.getSource();
        this.preloadAudio();
    }
    initAudioScreens() {
        this.audioStates.set(ScreenStates.Dk, false);
        this.audioStates.set(ScreenStates.Smb, false);
    }
    getSource() {
        //Path
        //Global
        const optionSoundPath = './assets/sounds/option-sound.ogg';
        const selectedSoundPath = './assets/sounds/selected-sound.ogg';
        const blockSoundPath = "./assets/sounds/block-sound.ogg";
        //Dk
        const dkSong = './screens/dk/assets/sounds/dk-song.ogg';
        //Smb
        const playerSoundPath = new Map([
            ['mario', './screens/smb2/assets/sounds/player/mario-sound.ogg'],
            ['luigi', './screens/smb2/assets/sounds/player/luigi-sound.ogg'],
            ['grow', './screens/smb2/assets/sounds/player/grow-sound.ogg'],
            ['hitTaken', './screens/smb2/assets/sounds/player/hit-taken-sound.ogg']
        ]);
        const overworldSong = './screens/smb2/assets/sounds/state/smb2-overworld-song.ogg';
        const undergroundSong = './screens/smb2/assets/sounds/state/smb2-underground-song.ogg';
        const underwaterSong = './screens/smb2/assets/sounds/state/smb2-underwater-song.ogg';
        const castleSong = './screens/smb2/assets/sounds/state/smb2-castle-song.ogg';
        //Hit
        const hitSoundPath = './screens/smb2/assets/sounds/player/hit-sound.ogg';
        //
        //Source
        this.optionSound.src = optionSoundPath;
        this.blockSound.src = blockSoundPath;
        this.selectedSound.src = selectedSoundPath;
        this.hitSound.src = hitSoundPath;
        playerSoundPath.forEach((path, player) => {
            const audio = new Audio(path);
            this.playerSound.set(player, audio);
        });
        this.songMap.set(ScreenStates.Dk, {
            hasStates: false,
            songs: new Map([['default', dkSong]])
        });
        this.songMap.set(ScreenStates.Smb, {
            hasStates: true,
            songs: new Map([
                [States.Overworld, overworldSong],
                [States.Underground, undergroundSong],
                [States.Underwater, underwaterSong],
                [States.Castle, castleSong]
            ])
        });
    }
    getSound(type, player) {
        switch (type) {
            case 'song':
                return this.song;
            case 'option':
                return this.optionSound;
            case 'block':
                return this.blockSound;
            case 'selected':
                return this.selectedSound;
            case 'hit':
                return this.hitSound;
            case 'player':
                if (!player)
                    return null;
                return this.getPlayerSound(player);
            default:
                console.warn(`Unknown sound type: ${type}`);
                return null;
        }
    }
    preloadAudio() {
        this.song.load();
        this.optionSound.load();
        this.selectedSound.load();
        this.blockSound.load();
        this.hitSound.load();
        this.playerSound.forEach(s => s.load());
    }
    playAudio(type, player) {
        if (type === 'song') {
            this.playStateSong();
            return;
        }
        const sound = type === 'player' && player
            ? this.playerSound.get(player)
            : this.getSound(type);
        if (!sound || this.isPlayed.has(type))
            return;
        try {
            sound.currentTime = 0;
            sound.play().then(() => {
                this.isPlayed.add(type);
                sound.onended = () => this.isPlayed.delete(type);
            }).catch(e => console.warn(`${type} sound failed:`, e));
        }
        catch (e) {
            console.warn(`Error playing ${type} sound:`, e);
        }
    }
    playStateSong() {
        if (!this.currentState || !this.audioStates)
            return;
        const currentScreen = this.screenManager.currentScreen();
        const screenConfig = this.songMap.get(currentScreen);
        if (!screenConfig)
            return;
        const songKey = currentScreen === ScreenStates.Dk ? 'default' :
            (screenConfig.hasStates ? this.currentState : 'default');
        const songPath = screenConfig.songs.get(songKey);
        if (!songPath)
            return;
        const stateChanged = this.lastPlayedState !== this.currentState;
        this.isStateChanged = stateChanged;
        this.lastPlayedState = this.currentState;
        try {
            if (this.song.src !== songPath) {
                this.song.src = songPath;
                this.song.load();
            }
            this.song.loop = false;
            this.song.onended = () => EventEmitter.emit('song-ended');
            if (stateChanged || !this.isPaused) {
                this.song.currentTime = 0;
            }
            else if (this.isPaused) {
                this.song.currentTime = this.pausedTime;
            }
            this.song.play().catch(e => console.warn('Song play failed', e));
            this.isPaused = false;
        }
        catch (err) {
            console.log(err);
        }
    }
    stopAudio(type) {
        const sound = this.getSound(type);
        if (!sound)
            return;
        sound.pause();
        sound.currentTime = 0;
        this.isPaused = false;
        this.pausedTime = 0;
        this.isStateChanged = true;
        if (type === 'song')
            this.currentSong = null;
    }
    stopAllAudio() {
        this.stopAudio('song');
        this.optionSound.pause();
        this.optionSound.currentTime = 0;
        this.selectedSound.pause();
        this.selectedSound.currentTime = 0;
        this.blockSound.pause();
        this.blockSound.currentTime = 0;
        this.hitSound.pause();
        this.hitSound.currentTime = 0;
        this.playerSound.forEach(s => {
            s.pause();
            s.currentTime = 0;
        });
    }
    pauseAudio(type) {
        if (type !== 'song')
            return;
        const sound = this.getSound(type);
        if (!sound)
            return;
        this.isPaused = true;
        this.pausedTime = sound.currentTime;
        sound.pause();
    }
    resumeAudio(type) {
        if (type !== 'song')
            return;
        const sound = this.getSound(type);
        if (!sound)
            return;
        this.isPaused = false;
        sound.currentTime = this.pausedTime;
        sound.play().catch(e => console.warn('Resume failed', e));
    }
    handleScreenChange(updScreen) {
        this.stopAllAudio();
        const screen = updScreen !== null && updScreen !== void 0 ? updScreen : this.screenManager.currentScreen();
        const screenConfig = this.songMap.get(screen);
        if (!screenConfig)
            return;
        this.currentSong = null;
        this.currentState = null;
        this.isStateChanged = true;
        this.lastPlayedState = null;
        this.isPaused = false;
        this.pausedTime = 0;
        this.isPlayed.clear();
        this.resetAudioElements();
        const isAudioPlaying = this.audioStates.get(screen);
        if (isAudioPlaying)
            this.playStateSong();
    }
    resetAudioElements() {
        this.song = new Audio();
        this.optionSound = new Audio();
        this.selectedSound = new Audio();
        this.blockSound = new Audio();
        this.hitSound = new Audio();
        this.getSource();
        this.preloadAudio();
    }
    requestState() {
        EventEmitter.emit('req-current-level-state');
        EventEmitter.on('res-current-level-state', (state) => {
            this.currentState = state;
        });
    }
    toggleAudio() {
        const currentScreen = this.screenManager.currentScreen();
        let isAudioPlaying = this.audioStates.get(currentScreen);
        EventEmitter.on('toggle-music', (data) => {
            var _a;
            const screen = (_a = data.screen) !== null && _a !== void 0 ? _a : currentScreen;
            isAudioPlaying = data.isOn;
            this.audioStates.set(screen, data.isOn);
        });
    }
    //Emits
    emitSong() {
        EventEmitter.on('toggle-song', ({ isOn, state, screen }) => {
            const currentScreen = this.screenManager.currentScreen();
            const screenConfig = this.songMap.get(currentScreen);
            let isAudioPlaying = this.audioStates.get(currentScreen);
            if (screen && screen !== currentScreen) {
                if (this.song.currentTime > 0 && !this.song.paused)
                    this.stopAudio('song');
                return;
            }
            else {
                if (state !== undefined)
                    this.currentState = state;
                isAudioPlaying = isOn;
                this.audioStates.set(currentScreen, isOn);
                if (isOn) {
                    if (screenConfig) {
                        const songKey = screenConfig.hasStates ? this.currentState : 'default';
                        const songPath = screenConfig.songs.get(songKey);
                        if (songPath) {
                            const source = this.song.src.endsWith(songPath);
                            if (this.isPaused && !this.isStateChanged && source) {
                                this.resumeAudio('song');
                            }
                            else {
                                this.isStateChanged = true;
                                this.playStateSong();
                            }
                        }
                    }
                }
                else {
                    if (this.song.currentTime > 0 && !this.song.paused) {
                        this.pauseAudio('song');
                    }
                    else {
                        this.stopAudio('song');
                    }
                }
            }
        });
        EventEmitter.on('song-ended', () => {
            this.isPaused = false;
            this.pausedTime = 0;
        });
        EventEmitter.on('level-state-changed', () => {
            this.isStateChanged = true;
        });
    }
    emitScreenChange() {
        EventEmitter.on('screen-changed', (newScreen) => {
            this.handleScreenChange(newScreen);
        });
    }
    emitSound() {
        EventEmitter.on('play-audio', (e) => {
            const type = typeof e === 'string' ? e : e.type;
            const srcScreen = typeof e === 'object' ? e.screen : undefined;
            const currentScreen = this.screenManager.currentScreen();
            if (srcScreen && srcScreen !== currentScreen)
                return;
            if (type === 'player' && currentScreen === ScreenStates.Smb) {
                const player = typeof e === 'object' && 'player' in e ? e.player : undefined;
                if (player)
                    this.playAudio(type, player);
            }
            this.playAudio(type);
        });
    }
    //
    getPlayerSound(player) {
        return this.playerSound.get(player) || null;
    }
    levelStateChange() {
        EventEmitter.on('level-state-changed', (e) => {
            if (this.currentState !== e.newState) {
                this.currentState = e.newState;
                this.isStateChanged = true;
                const currentScreen = this.screenManager.currentScreen();
                let isAudioPlaying = this.audioStates.get(currentScreen);
                if (isAudioPlaying)
                    this.playStateSong();
            }
        });
    }
    //Button
    drawPlayPause(projectionMatrix) {
        var _a;
        const modelViewMatrix = mat4.create();
        const currentScreen = this.screenManager.currentScreen();
        const isAudioPlaying = this.audioStates.get(currentScreen);
        const map = this.textureMap.playPause[currentScreen];
        let spriteCoords;
        if (currentScreen === ScreenStates.Dk) {
            spriteCoords = isAudioPlaying
                ? map.pause
                : map.play;
        }
        else {
            const stateMap = map;
            const currentState = (_a = this.currentState) !== null && _a !== void 0 ? _a : States.Overworld;
            spriteCoords = isAudioPlaying
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
