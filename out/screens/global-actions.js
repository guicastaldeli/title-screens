import { ScreenPreview } from "./screen-preview.js";
export class GlobalActions {
    constructor(gl, buffers, programInfo, screenManager, controller) {
        this.gl = gl;
        this.screenManager = screenManager;
        this.controller = controller;
        this.screenPreview = new ScreenPreview(gl, buffers, programInfo, this.screenManager, this.controller, this);
    }
    initPlayPauseButton() {
    }
    initScreenPreview() {
        this.screenPreview.initPreview();
    }
    loadTexture(gl, url) {
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
        return new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
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
}
