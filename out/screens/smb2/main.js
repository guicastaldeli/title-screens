import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";
export class ScreenSmb {
    constructor(tick, gl, programInfo, buffers) {
        this.rotation = 0.0;
        this.speed = 1.0;
        this.size = [1, 1];
        this.color = [0, 0, 0, 1];
        this.tick = tick;
        this.gl = gl;
        this.programInfo = programInfo;
        this.buffers = buffers;
    }
    createBackground() {
        this.gl.useProgram(this.programInfo.program);
        this.gl.disable(this.gl.DEPTH_TEST);
        const projectionMatrix = mat4.create();
        const canvas = this.gl.canvas;
        const aspect = canvas.width / canvas.height;
        mat4.ortho(projectionMatrix, -aspect, aspect, -1.0, 1.0, -1.0, 1.0);
        const modelViewMatrix = mat4.create();
        mat4.rotate(modelViewMatrix, modelViewMatrix, this.rotation, [0, 0, 0]);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.smbBackgroundPosition);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.smbBackgroundColor);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexColor, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.setBackground();
    }
    setBackground() {
        const size = { w: 1.0, h: 0.8 };
        this.size = [size.w, size.h];
        const positions = [
            -this.size[0], -this.size[1],
            this.size[0], -this.size[1],
            -this.size[0], this.size[1],
            this.size[0], this.size[1],
        ];
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.smbBackgroundPosition);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        this.setColor('rgb(119, 0, 0)');
    }
    setColor(color) {
        this.color = this.parseColor(color);
        const colors = [
            this.color[0], this.color[1], this.color[2], this.color[3],
            this.color[0], this.color[1], this.color[2], this.color[3],
            this.color[0], this.color[1], this.color[2], this.color[3],
            this.color[0], this.color[1], this.color[2], this.color[3]
        ];
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.smbBackgroundColor);
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
    update(deltaTime) {
        this.rotation += this.tick['speed'] * deltaTime;
        this.setBackground();
        this.createBackground();
    }
    init() {
        const onInit = [
            this.setBackground(),
            this.createBackground()
        ];
        return onInit;
    }
}
