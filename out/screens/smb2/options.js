var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";
import { TextureMap } from "./texture-map.js";
import { States } from "./texture-map.interface.js";
import { EventEmitter } from "../../event-emitter.js";
export class Options {
    get musicText() {
        return this.isMusicOn ? 'MUSIC ON' : 'MUSIC OFF';
    }
    //
    constructor(tick, gl, buffers, programInfo, screen, levelState, sheetProps, cursor) {
        this.containerPosition = [0.12, -0.20];
        this.isCopyright = false;
        this.copyrightText = [];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.options = [];
        this.waveTime = 0.0;
        this.waveSpeed = 2.0;
        this.intervalSelected = 500;
        this.selectionTimeout = new Map();
        //Music
        this.isMusicOn = false;
        this.tick = tick;
        this.tick.add(this.update.bind(this));
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;
        this.screen = screen;
        this.levelState = levelState;
        this.currentState = this.levelState.getCurrentState();
        this.sheetProps = sheetProps;
        this.cursor = cursor;
        this.setOptions();
        this.textureMap = new TextureMap();
        this.toggleAudio();
        this.prevSelectedIndex = this.cursor.selectedIndex;
    }
    setOptions() {
        var _a, _b;
        const prevIndex = this.cursor.getSelectedIndex();
        const prevSelectedOpt = (_a = this.options[prevIndex]) === null || _a === void 0 ? void 0 : _a.text;
        const prevSelected = new Set();
        const prevHoveredIndex = this.options.findIndex(opt => opt.hovered);
        const points = this.screen.points;
        const topScore = points ? points.getTopScore() : 0;
        const scoreFormat = `TOP- ${topScore.toString().padStart(6, '0').substring(0, 6)}`;
        const score = ((_b = this.options.find(opt => opt.text.startsWith('TOP-'))) === null || _b === void 0 ? void 0 : _b.text) || scoreFormat;
        this.options.forEach(opt => {
            if (opt.selected)
                prevSelected.add(opt.text);
        });
        this.options = [
            this.createOption('MARIO GAME', 0, 0, this.currentState),
            this.createOption('LUIGI GAME', 0, -0.15, this.currentState),
            this.createOption(this.musicText, 0, -0.30, this.currentState),
            this.createOption(score, 0, -0.45, this.currentState),
        ];
        this.options.forEach((opt, i) => {
            if (prevSelected.has(opt.text)) {
                opt.selected = true;
                opt.color = this.cursor.selectedColor;
            }
            if (i === prevHoveredIndex)
                opt.hovered = true;
        });
        const updIndex = this.options.findIndex(opt => opt.text === prevSelectedOpt);
        this.cursor.selectedIndex = updIndex >= 0 ? updIndex : 0;
        this.updateSelectionColors();
    }
    updateSelectionColors() {
        const selectedIndex = this.cursor.getSelectedIndex();
        this.options.forEach((opt, i) => {
            if (!(opt.text === 'MARIO GAME' ||
                opt.text === 'LUIGI GAME') &&
                opt.selected) {
                return;
            }
            opt.color = i === selectedIndex
                ? this.cursor.selectedColor
                : this.color;
            opt.selected = i === selectedIndex;
        });
    }
    drawOptions(projectionMatrix, text, x, y, type) {
        var _a, _b;
        const letters = text.split('');
        const spacing = 0.08;
        const startX = x - ((letters.length * spacing) / 2);
        const textStartX = x;
        const textEndX = startX + (letters.length * spacing);
        const option = this.options.find(opt => {
            const dx = Math.abs(opt.position[0] - (x - this.containerPosition[0]));
            const dy = Math.abs(opt.position[1] - (y - this.containerPosition[1]));
            return dx < 0.001 && dy < 0.001;
        });
        const isSelected = option !== undefined &&
            (option.selected ||
                (this.options.indexOf(option) === this.cursor.selectedIndex && ((_a = option.hovered) !== null && _a !== void 0 ? _a : false)));
        const originalColor = [...this.color];
        if (option)
            this.color = (_b = option.color) !== null && _b !== void 0 ? _b : originalColor;
        letters.forEach((l, i) => {
            const letterX = startX + (i * spacing);
            this.drawLetter(projectionMatrix, l, letterX, y, textStartX, textEndX, isSelected, type, (option === null || option === void 0 ? void 0 : option.selected) || false);
        });
        this.color = originalColor;
    }
    drawLetter(projectionMatrix, letter, x, y, textStartX, textEndX, isSelected, type, optionSelected) {
        var _a, _b;
        if (!type)
            return;
        const modelViewMatrix = mat4.create();
        const size = [0.04, 0.04];
        const map = this.textureMap.letters;
        mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, 1]);
        const positions = [
            -size[0], -size[1],
            size[0], -size[1],
            -size[0], size[1],
            size[0], size[1],
        ];
        const spriteCoords = map[type][letter] || map[type][' '];
        const [spriteX, spriteY] = spriteCoords;
        const [sheetWidth, sheetHeight] = this.sheetProps.miscProps().spriteSheetSize;
        const [spriteWidth, spriteHeight] = this.sheetProps.miscProps().spriteProps.letter.spriteSize;
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
        const currentState = this.levelState.getCurrentState();
        const stateValue = currentState === States.Overworld ? 0 :
            currentState === States.Underground ? 1 :
                currentState === States.Underwater ? 2 : 3;
        const option = this.options.find(opt => {
            const optionX = this.containerPosition[0] + opt.position[0];
            const optionY = this.containerPosition[1] + opt.position[1];
            const width = opt.text.length * 0.08;
            const height = 0.08;
            return Math.abs(x - optionX) < width &&
                Math.abs(y - optionY) < height;
        });
        const isHovered = (_a = option === null || option === void 0 ? void 0 : option.hovered) !== null && _a !== void 0 ? _a : false;
        const actuallySelected = (_b = option === null || option === void 0 ? void 0 : option.selected) !== null && _b !== void 0 ? _b : false;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.smbTilePosition);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.smbTileTextureCoord);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(coords), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.textureCoord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.buffers.smbTileTexture);
        this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isCursor, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.uTex, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isText, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isHudText, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isShadowText, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isLava, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isPlayer, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isCloud, 0);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        const shouldShowSelectedShader = isHovered && !actuallySelected;
        this.gl.uniform1i(this.programInfo.uniformLocations.isSelected, shouldShowSelectedShader ? 1 : 0);
        if (shouldShowSelectedShader)
            this.gl.uniform2f(this.programInfo.uniformLocations.uTextStartPos, textStartX, textEndX);
        this.gl.uniform4f(this.programInfo.uniformLocations.uColor, ...this.color);
        this.gl.uniform1f(this.programInfo.uniformLocations.uThreshold, 0.1);
        this.gl.uniform1f(this.programInfo.uniformLocations.uTime, this.waveTime);
        this.gl.uniform1f(this.programInfo.uniformLocations.haveState, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.uState, stateValue);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.enable(this.gl.BLEND);
        this.gl.depthFunc(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.LEQUAL);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    createOption(text, x, y, type) {
        const width = text.length * 0.08;
        const height = 0.08;
        const interactive = !text.startsWith('TOP-');
        return {
            text,
            position: [x, y],
            selected: false,
            color: this.color,
            interactive,
            bounds: {
                minX: x - (width / 2),
                maxX: x + (width / 2),
                minY: y - height / 0.3,
                maxY: y + height / 0.3
            },
            type
        };
    }
    selectedOption(x, y) {
        if (!this.cursor)
            return;
        const selectedIndex = this.cursor.getSelectedIndex();
        if (selectedIndex >= 0 && selectedIndex < this.options.length) {
            const option = this.options[selectedIndex];
            if (x !== undefined && y !== undefined) {
                if (!this.isPointOption(x, y, option)) {
                    return;
                }
            }
            this.handleSelection(option);
        }
    }
    handleSelection(option) {
        const defaultColor = [...this.color];
        const exTimeout = this.selectionTimeout.get(option);
        if (exTimeout) {
            clearTimeout(exTimeout);
            this.selectionTimeout.delete(option);
        }
        if (option.text === 'MARIO GAME' || option.text === 'LUIGI GAME') {
            this.options.forEach(opt => {
                if (opt.text === 'MARIO GAME' ||
                    opt.text === 'LUIGI GAME') {
                    opt.selected = false;
                    opt.color = defaultColor;
                }
            });
            option.selected = true;
            option.color = this.cursor.selectedColor;
            if (option.text === 'MARIO GAME')
                this.screen.setCurrentPlayer('mario');
            if (option.text === 'LUIGI GAME')
                this.screen.setCurrentPlayer('luigi');
        }
        else {
            if (option.text.startsWith('MUSIC')) {
                this.isMusicOn = !this.isMusicOn;
                option.text = this.musicText;
                EventEmitter.emit('toggle-music', this.isMusicOn);
                EventEmitter.emit('toggle-song', {
                    isOn: this.isMusicOn,
                    state: this.currentState
                });
                if (this.isMusicOn) {
                    EventEmitter.on('song-ended', () => {
                        this.isMusicOn = false;
                        option.text = this.musicText;
                        option.selected = false;
                        option.color = defaultColor;
                        EventEmitter.emit('toggle-music', false);
                    });
                }
                const timeoutId = setTimeout(() => {
                    if (this.options[this.cursor.selectedIndex] === option) {
                        option.color = this.cursor.selectedColor;
                    }
                    else {
                        option.color = defaultColor;
                    }
                    option.selected = false;
                    this.selectionTimeout.delete(option);
                }, this.intervalSelected);
                this.selectionTimeout.set(option, timeoutId);
                return;
            }
            const wasSelected = option.selected;
            this.options.forEach(opt => {
                if (!(opt.text === 'MARIO GAME' ||
                    opt.text === 'LUIGI GAME')) {
                    opt.selected = false;
                    opt.color = defaultColor;
                }
            });
            option.selected = !wasSelected;
            option.color = option.selected ? this.cursor.selectedColor : defaultColor;
            if (option.selected) {
                const timoutId = setTimeout(() => {
                    if (this.options[this.cursor.selectedIndex] === option) {
                        option.color = this.cursor.selectedColor;
                    }
                    else {
                        option.color = defaultColor;
                    }
                    option.selected = false;
                    this.selectionTimeout.delete(option);
                }, this.intervalSelected);
                this.selectionTimeout.set(option, timoutId);
            }
        }
    }
    getOptionPositions() {
        return this.options.map(option => {
            return [
                this.containerPosition[0] + option.position[0],
                this.containerPosition[1] + option.position[1]
            ];
        });
    }
    isPointOption(x, y, option) {
        if (!option.bounds)
            return false;
        return x >= option.bounds.minX &&
            x <= option.bounds.maxX &&
            y >= option.bounds.minY &&
            y <= option.bounds.maxY;
    }
    clearSelection() {
        const defaultColor = [...this.color];
        this.options.forEach(option => {
            if (option.text !== 'MARIO GAME' &&
                option.text !== 'LUIGI GAME') {
                const timeoutId = this.selectionTimeout.get(option);
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    this.selectionTimeout.delete(option);
                    option.selected = false;
                    option.color = defaultColor;
                }
            }
        });
    }
    //Audio State
    updateMusicOptionText() {
        const option = this.options.find(opt => opt.text.startsWith('MUSIC'));
        if (option)
            option.text = this.musicText;
    }
    toggleAudio() {
        this.isMusicOn = false;
        this.updateMusicOptionText();
        EventEmitter.on('level-state-changed', () => {
            this.setAudioState(false);
        });
        EventEmitter.on('screen-changed', () => {
            this.setAudioState(false);
            EventEmitter.emit('toggle-song', {
                isOn: false,
                state: this.currentState
            });
        });
    }
    setAudioState(isOn) {
        this.isMusicOn = isOn;
        this.updateMusicOptionText();
        EventEmitter.emit('toggle-music', isOn);
    }
    //
    initOptions(projectionMatrix) {
        const originalContainerPosition = [...this.containerPosition];
        this.options.forEach(option => {
            const x = originalContainerPosition[0] + option.position[0];
            const y = originalContainerPosition[1] + option.position[1];
            this.drawOptions(projectionMatrix, option.text, x, y, option.type);
        });
    }
    getTex() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const path = './screens/smb2/assets/sprites/smb2-misc-sprites.png';
                const tex = yield this.screen.loadTexture(this.gl, path);
                this.buffers.smbTileTexture = tex;
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    updateState() {
        var _a;
        const prevSelectedIndex = this.cursor.getSelectedIndex();
        const prevSelectedOpt = (_a = this.options[prevSelectedIndex]) === null || _a === void 0 ? void 0 : _a.text;
        const prevSelected = this.options.filter(opt => opt.selected).map(opt => opt.text);
        const prevHoveredIndex = this.options.findIndex(opt => opt.hovered);
        const wasMusicOn = this.isMusicOn;
        this.currentState = this.levelState.getCurrentState();
        this.setOptions();
        this.isMusicOn = wasMusicOn;
        this.selectionTimeout.forEach((timeoutId, option) => {
            clearTimeout(timeoutId);
            option.selected = false;
            option.color = this.color;
            this.selectionTimeout.delete(option);
        });
        this.currentState = this.levelState.getCurrentState();
        this.setOptions();
        this.options.forEach((opt, i) => {
            if (opt.text === 'MARIO GAME' || opt.text === 'LUIGI GAME') {
                const wasSelected = prevSelected.includes(opt.text);
                opt.selected = wasSelected;
                opt.color = wasSelected ? this.cursor.selectedColor : this.color;
            }
            else {
                opt.selected = false;
                opt.color = this.color;
                opt.hovered = (i === prevHoveredIndex);
            }
        });
        const updIndex = this.options.findIndex(opt => opt.text === prevSelectedOpt);
        this.cursor.selectedIndex = updIndex >= 0 ? updIndex : 0;
        this.cursor.setOptionPosition();
    }
    update(deltaTime) {
        if (deltaTime <= 0 || this.tick.timeScale <= 0)
            return;
        this.waveTime += this.waveSpeed * deltaTime;
    }
}
