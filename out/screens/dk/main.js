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
import { BaseScreen } from "../../screen.interface.js";
import { Title } from "./title.js";
import { Options } from "./options.js";
export class ScreenDk extends BaseScreen {
    constructor(state, screenManager, tick, gl, programInfo, buffers) {
        super(state, gl, programInfo, buffers, tick);
        this.rotation = 0.0;
        this.speed = 1.0;
        this.setSize = {
            w: 3.0,
            h: 3.0
        };
        this.size = [1, 1];
        this.color = [0, 0, 0, 1];
        this.gridSize = [8, 8];
        this.gridDimensions = [100, 100];
        this.tileMap = [];
        this.screenManager = screenManager;
        this.title = new Title(gl, buffers, programInfo, this);
        this.options = new Options(gl, buffers, programInfo, this, this.title);
    }
    //Background
    drawBackground(projectionMatrix) {
        const modelViewMatrix = mat4.create();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkBackgroundPosition);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkBackgroundColor);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexColor, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.uniform1f(this.programInfo.uniformLocations.uTex, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    createBackground() {
        this.gl.useProgram(this.programInfo.program);
        this.gl.disable(this.gl.DEPTH_TEST);
        const projectionMatrix = mat4.create();
        const canvas = this.gl.canvas;
        const aspect = canvas.width / canvas.height;
        mat4.ortho(projectionMatrix, -aspect, aspect, -1.0, 1.0, -1.0, 1.0);
        //Background
        this.drawBackground(projectionMatrix);
        this.setBackground();
        //Tile
        this.drawTile(projectionMatrix);
        //Elements
        this.title.drawTitle(projectionMatrix);
        this.options.initOptions(projectionMatrix);
        //
        this.gl.enable(this.gl.DEPTH_TEST);
    }
    setBackground() {
        this.size = [this.setSize.w, this.setSize.h];
        const positions = [
            -this.size[0], -this.size[1],
            this.size[0], -this.size[1],
            -this.size[0], this.size[1],
            this.size[0], this.size[1],
        ];
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkBackgroundPosition);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        this.setColor('rgb(7, 0, 111)');
    }
    //Tile Grid
    initGrid() {
        this.tileMap = Array(this.gridDimensions[1]).fill(0)
            .map(() => Array(this.gridDimensions[0]).fill(0));
        for (let y = 0; y < this.gridDimensions[1]; y++) {
            for (let x = 0; x < this.gridDimensions[0]; x++) {
                this.tileMap[y][x] = (x + y) % 2;
            }
        }
    }
    drawTile(projectionMatrix) {
        const canvas = this.gl.canvas;
        const aspect = canvas.width / canvas.height;
        const backgroundWidth = this.setSize.w;
        const backgroundHeight = this.setSize.h;
        const tileWidth = (2 * backgroundWidth * aspect) / this.gridDimensions[0];
        const tileHeight = (2 * backgroundHeight * aspect) / this.gridDimensions[1];
        const startX = -backgroundWidth * aspect;
        const startY = backgroundHeight;
        for (let y = 0; y < this.gridDimensions[1]; y++) {
            for (let x = 0; x < this.gridDimensions[0]; x++) {
                const tileType = this.tileMap[y][x];
                this.renderTile(x, y, tileType, tileWidth, tileHeight, startX, startY, projectionMatrix);
            }
        }
    }
    renderTile(gridX, gridY, tileType, tileWidth, tileHeight, startX, startY, projectionMatrix) {
        const modelViewMatrix = mat4.create();
        const x = startX + gridX * tileWidth;
        const y = startY - (gridY + 1) * tileHeight;
        mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, 0]);
        const positions = [
            0, 0,
            tileWidth, 0,
            0, tileHeight,
            tileWidth, tileHeight
        ];
        const color = tileType === 0 ?
            this.parseColor('rgb(0, 0, 0)') :
            this.parseColor('rgb(0, 0, 0)');
        const colors = [
            ...color, ...color, ...color, ...color
        ];
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkTilePosition);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkTileColor);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexColor, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.uniform1f(this.programInfo.uniformLocations.uTex, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    //Texture
    loadTexture(gl, url) {
        return new Promise((res, rej) => {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            const level = 0;
            const internalFormat = gl.RGBA;
            const width = 1;
            const height = 1;
            const border = 0;
            const srcFormat = gl.RGBA;
            const srcType = gl.UNSIGNED_BYTE;
            const pixel = new Uint8Array([255, 255, 255, 255]);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);
            const img = new Image();
            img.onload = () => {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, img);
                if (this.isPowerOf2(img.width) && this.isPowerOf2(img.height)) {
                    gl.generateMipmap(gl.TEXTURE_2D);
                }
                else {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                }
                res(texture);
            };
            img.onerror = rej;
            img.src = url;
        });
    }
    isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }
    setColor(color) {
        this.color = this.parseColor(color);
        const colors = [
            this.color[0], this.color[1], this.color[2], this.color[3],
            this.color[0], this.color[1], this.color[2], this.color[3],
            this.color[0], this.color[1], this.color[2], this.color[3],
            this.color[0], this.color[1], this.color[2], this.color[3]
        ];
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkBackgroundColor);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
    }
    parseColor(color) {
        if (Array.isArray(color))
            return color;
        if (color.startsWith('#')) {
            const hex = color.substring(1);
            const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16) / 255;
            return [r, g, b, 1];
        }
        if (color.startsWith('rgb')) {
            const values = color.match(/(\d+\.?\d*)/g);
            if (values && values.length >= 3) {
                const r = parseInt(values[0]) / 255;
                const g = parseInt(values[1]) / 255;
                const b = parseInt(values[2]) / 255;
                const a = values[3] ? parseFloat(values[3]) : 1;
                return [r, g, b, a];
            }
        }
        return [0, 0, 0, 1];
    }
    getTex() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const path = './screens/dk/assets/sprites/dk-title-screen-sheet.png';
                const tex = yield this.loadTexture(this.gl, path);
                this.buffers.dkTitleTexture = tex;
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    loadAssets() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getTex();
        });
    }
    update(deltaTime) {
        if (this.state.isLoading())
            return;
        this.rotation += this.tick['speed'] * deltaTime;
        this.createBackground();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.initGrid();
            yield this.loadAssets();
            this.state.markInit('dk');
            return this.createBackground();
        });
    }
}
