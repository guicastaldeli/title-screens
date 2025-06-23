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
export class Options {
    constructor(gl, buffers, programInfo, screen, levelState, sheetProps, cursor) {
        this.containerPosition = [0.12, -0.20];
        this.isCopyright = false;
        this.copyrightText = [];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.options = [];
        this.waveTime = 0.0;
        this.waveSpeed = 2.0;
        this.intervalSelected = 1000;
        this.selectionTimeout = new Map();
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
    }
    setOptions() {
        this.options = [
            this.createOption('MARIO GAME', 0, 0, this.currentState),
            this.createOption('LUIGI GAME', 0, -0.15, this.currentState),
            this.createOption('MUSIC OFF', 0, -0.30, this.currentState),
        ];
        if (this.options.length > 0)
            this.options[0].color = this.cursor.selectedColor;
    }
    drawOptions(projectionMatrix, text, x, y, type) {
        var _a;
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
        const isSelected = option !== undefined
            && this.options.indexOf(option) === this.cursor.selectedIndex;
        const originalColor = [...this.color];
        if (option)
            this.color = (_a = option.color) !== null && _a !== void 0 ? _a : originalColor;
        letters.forEach((l, i) => {
            const letterX = startX + (i * spacing);
            this.drawLetter(projectionMatrix, l, letterX, y, textStartX, textEndX, isSelected, type);
        });
        this.color = originalColor;
    }
    drawLetter(projectionMatrix, letter, x, y, textStartX, textEndX, isSelected, type) {
        if (!type)
            return;
        const modelViewMatrix = mat4.create();
        const size = [0.04, 0.04];
        const map = this.textureMap.letters;
        mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, 0]);
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
                currentState === States.Underwater ? 2 :
                    3;
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
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.uniform1i(this.programInfo.uniformLocations.isSelected, isSelected && !this.cursor.selected ? 1 : 0);
        if (isSelected === true && !this.cursor.selected)
            this.gl.uniform2f(this.programInfo.uniformLocations.uTextStartPos, textStartX, textEndX);
        this.gl.uniform4f(this.programInfo.uniformLocations.uColor, ...this.color);
        this.gl.uniform1f(this.programInfo.uniformLocations.uThreshold, 0.1);
        this.gl.uniform1f(this.programInfo.uniformLocations.uTime, this.waveTime);
        this.gl.uniform1f(this.programInfo.uniformLocations.haveState, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.uState, stateValue);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    createOption(text, x, y, type) {
        const width = text.length;
        const height = 0.05;
        return {
            text,
            position: [x, y],
            selected: false,
            color: this.color,
            bounds: {
                x: [x - width / 2, x + width / 2],
                y: [y / 20 - height, y / 20 + height]
            },
            type
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
        option.selected = true;
        option.color = this.screen.parseColor('rgb(102, 102, 102)');
    }
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
        this.currentState = this.levelState.getCurrentState();
        this.setOptions();
    }
    update(deltaTime) {
        this.waveTime += this.waveSpeed * deltaTime;
    }
}
