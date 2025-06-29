import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";
import { LetterMap } from "./letter-map.js";
import { EventEmitter } from "../../event-emitter.js";
import { ScreenStates } from "../../state.js";
export class Options {
    get musicText() {
        return this.isMusicOn ? 'MUSIC ON' : 'MUSIC OFF';
    }
    //
    constructor(tick, gl, buffers, programInfo, screen, sheetProps, cursor) {
        this.containerPosition = [0.12, 0];
        this.isCopyright = false;
        this.copyrightText = [];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.options = [];
        this.waveTime = 0.0;
        this.waveSpeed = 2.0;
        this.intervalSelected = 1000;
        this.selectionTimeout = new Map();
        //Music
        this.isMusicOn = false;
        this.tick = tick;
        this.tick.add(this.update.bind(this));
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;
        this.screen = screen;
        this.sheetProps = sheetProps;
        this.cursor = cursor;
        this.color =
            this.isCopyright ?
                this.screen.parseColor('rgb(255, 255, 255)') :
                this.screen.parseColor('rgb(252, 152, 56)');
        this.setOptions();
        this.toggleAudio();
        this.letterMap = LetterMap;
    }
    setOptions() {
        this.options = [
            this.createOption('1 PLAYER GAME A', 0, 0),
            this.createOption('1 PLAYER GAME B', 0, -0.15),
            this.createOption('2 PLAYER GAME A', 0, -0.30),
            this.createOption('2 PLAYER GAME B', 0, -0.45),
            this.createOption(this.musicText, 0, -0.60)
        ];
        this.copyrightText = [
            this.createOption('©1981 NINTENDO COZLTD.', 0, -0.75, true),
            this.createOption('MADE IN JAPAN', 0.1, -0.85, true)
        ];
        if (this.options.length > 0)
            this.options[0].color = this.cursor.selectedColor;
    }
    drawOptions(projectionMatrix, text, x, y, isCopyright = false) {
        var _a;
        const letters = text.split('');
        const spacing = 0.07;
        const startX = x - ((letters.length * spacing) / 2);
        const textStartX = x;
        const textEndX = startX + (letters.length * spacing);
        const option = this.options.find(opt => {
            const dx = Math.abs(opt.position[0] - (x - this.containerPosition[0]));
            const dy = Math.abs(opt.position[1] - (y - this.containerPosition[1]));
            return dx < 0.001 && dy < 0.001;
        });
        const isSelected = option !== undefined
            && this.options.indexOf(option) === this.cursor.selectedIndex;
        const originalColor = [...this.color];
        if (option)
            this.color = (_a = option.color) !== null && _a !== void 0 ? _a : originalColor;
        letters.forEach((l, i) => {
            const letterX = startX + (i * spacing);
            this.drawLetter(projectionMatrix, l, letterX, y, isCopyright, textStartX, textEndX, isSelected);
        });
        this.color = originalColor;
    }
    drawLetter(projectionMatrix, letter, x, y, isCopyright = false, textStartX, textEndX, isSelected) {
        const modelViewMatrix = mat4.create();
        const size = [0.03, 0.03];
        mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, 0]);
        const positions = [
            -size[0], -size[1],
            size[0], -size[1],
            -size[0], size[1],
            size[0], size[1],
        ];
        const spriteCoords = this.letterMap[letter] || this.letterMap[' '];
        const [spriteX, spriteY] = spriteCoords;
        const [sheetWidth, sheetHeight] = this.sheetProps.spriteSheetSize;
        const [spriteWidth, spriteHeight] = letter === '©' ? [8, 8] : [7, 7];
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
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkTilePosition);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkTileTextureCoord);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(coords), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.textureCoord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.buffers.dkTileTexture);
        this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isCursor, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.uTex, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isText, isCopyright ? 0.0 : 1.0);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.uniform1i(this.programInfo.uniformLocations.isSelected, isSelected && !this.cursor.selected ? 1 : 0);
        if (isSelected === true && !this.cursor.selected)
            this.gl.uniform2f(this.programInfo.uniformLocations.uTextStartPos, textStartX, textEndX);
        this.gl.uniform4f(this.programInfo.uniformLocations.uColor, ...this.color);
        this.gl.uniform1f(this.programInfo.uniformLocations.uThreshold, 0.1);
        this.gl.uniform1f(this.programInfo.uniformLocations.uTime, this.waveTime);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    createOption(text, x, y, isCopyright = false) {
        const width = text.length;
        const height = 0.05;
        return {
            text,
            position: [x, y],
            selected: false,
            color: this.color,
            boundsDk: {
                x: [x - width / 2, x + width / 2],
                y: [y / 20 - height, y / 20 + height]
            }
        };
    }
    selectedOption() {
        if (!this.cursor)
            return;
        const selectedIndex = this.cursor.getSelectedIndex();
        if (selectedIndex >= 0 &&
            selectedIndex < this.options.length) {
            this.handleSelection(this.options[selectedIndex]);
        }
    }
    handleSelection(option) {
        EventEmitter.emit('stop-all-audio');
        const defaultColor = [...this.color];
        const exTimeout = this.selectionTimeout.get(option);
        if (exTimeout) {
            clearTimeout(exTimeout);
            this.selectionTimeout.delete(option);
        }
        this.options.forEach(opt => {
            if (opt !== option) {
                opt.selected = false;
                opt.color = defaultColor;
            }
        });
        if (!this.cursor.isMouseControlled) {
            setTimeout(() => {
                if (this.options[this.cursor.selectedIndex] === option) {
                    option.color = this.cursor.selectedColor;
                }
                else {
                    option.color = defaultColor;
                }
                this.selectionTimeout.delete(option);
            }, this.intervalSelected);
            this.selectionTimeout.set(option, this.intervalSelected);
        }
        if (option.text.startsWith('MUSIC')) {
            this.isMusicOn = !this.isMusicOn;
            option.text = this.musicText;
            EventEmitter.emit('play-audio', { type: 'selected', screen: ScreenStates.Dk });
            EventEmitter.emit('toggle-music', this.isMusicOn);
            EventEmitter.emit('toggle-song', {
                isOn: this.isMusicOn,
                state: 'default',
                screen: ScreenStates.Dk
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
        if (option.text.includes('GAME'))
            EventEmitter.emit('play-audio', { type: 'block', screen: ScreenStates.Dk });
        option.color = this.screen.parseColor('rgb(102, 102, 102)');
        option.selected = true;
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
        EventEmitter.on('screen-changed', () => {
            this.setAudioState(false);
            EventEmitter.emit('toggle-song', {
                isOn: false,
                state: 'default'
            });
        });
    }
    setAudioState(isOn) {
        this.isMusicOn = isOn;
        this.updateMusicOptionText();
        EventEmitter.emit('toggle-music', isOn);
    }
    //
    getOptionPositions() {
        return this.options.map(option => {
            return [
                this.containerPosition[0] + option.position[0],
                this.containerPosition[1] + option.position[1]
            ];
        });
    }
    initOptions(projectionMatrix) {
        const originalContainerPosition = [...this.containerPosition];
        this.options.forEach(option => {
            const x = originalContainerPosition[0] + option.position[0];
            const y = originalContainerPosition[1] + option.position[1];
            this.drawOptions(projectionMatrix, option.text, x, y, false);
        });
        this.copyrightText.forEach(option => {
            this.drawOptions(projectionMatrix, option.text, option.position[0], option.position[1], true);
        });
    }
    update(deltaTime) {
        if (deltaTime <= 0 || this.tick.timeScale <= 0)
            return;
        this.waveTime += this.waveSpeed * deltaTime;
    }
}
