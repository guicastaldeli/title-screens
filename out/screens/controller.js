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
export class ScreenController {
    constructor(gl, buffers, programInfo, screenManager, controller, globalActions) {
        this.texture = null;
        this.isHovered = false;
        this.hoverProgress = 0;
        this.lastHoverTime = 0;
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;
        this.screenManager = screenManager;
        this.controller = controller;
        this.globalActions = globalActions;
        this.textureMap = new TextureMap();
    }
    drawPreview(projectionMatrix) {
        this.drawPreviewElement(projectionMatrix, this.textureMap.screen.shadow, 0.9, true);
        this.drawPreviewElement(projectionMatrix, this.textureMap.screen[this.screenManager.currentScreen()], 1.0, false);
    }
    drawPreviewElement(projectionMatrix, map, z, isShadow) {
        const modelViewMatrix = mat4.create();
        const sheetSize = [52, 52];
        const spriteSize = [16, 16];
        const size = [0.1, 0.2];
        const x = isShadow ? 0.85 : 0.865;
        const y = isShadow ? 0.71 : 0.74;
        mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, -0.9]);
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
        const now = performance.now();
        const deltaTime = (now - this.lastHoverTime) / 1000;
        const hoverSpeed = 10.0;
        if (this.isHovered) {
            this.hoverProgress = Math.min(1, this.hoverProgress + deltaTime * hoverSpeed);
        }
        else {
            this.hoverProgress = Math.max(0, this.hoverProgress - deltaTime * hoverSpeed);
        }
        this.lastHoverTime = now;
        this.gl.disable(this.gl.DEPTH_TEST);
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
        this.gl.uniform1f(this.programInfo.uniformLocations.isPlayer, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.previewTransp, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isCursor, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isShadow, isShadow ? 1 : 0);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.uniform1i(this.programInfo.uniformLocations.isHovered, this.isHovered ? 1 : 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.hoverProgress, this.hoverProgress);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    setHoverState(hovered) {
        this.isHovered = hovered;
        this.lastHoverTime = performance.now();
    }
    getTex() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const path = './assets/sprites/level-tile.png';
                this.texture = yield this.globalActions.loadTexture(this.gl, path);
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    setupInput() {
        const canvas = (this.gl.canvas);
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const glX = (x / canvas.width) * 2 - 1;
            const glY = (y / canvas.height) * 2;
            const previewX = 0.83;
            const previewY = 0.25;
            const previewWidth = 0.4;
            const previewHeight = 0.4;
            this.isHovered =
                glX >= previewX - previewWidth / 2 &&
                    glX <= previewX + previewWidth / 2 &&
                    glY >= previewY - previewHeight &&
                    glY <= previewY + previewHeight;
            this.setHoverState(this.isHovered);
        });
        canvas.addEventListener('click', () => {
            if (this.isHovered && this.controller) {
                this.controller.toggleScreen();
            }
        });
        canvas.addEventListener('mouseleave', () => {
            this.setHoverState(false);
            this.isHovered = false;
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === '1' && this.controller) {
                this.controller.toggleScreen();
            }
        });
    }
    initPreview() {
        return __awaiter(this, void 0, void 0, function* () {
            const projectionMatrix = mat4.create();
            this.drawPreview(projectionMatrix);
            yield this.getTex();
            this.setupInput();
        });
    }
}
