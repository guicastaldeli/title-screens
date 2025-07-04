var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { mat4 } from "../node_modules/gl-matrix/esm/index.js";
export class Camera {
    constructor(tick, gl, programInfo, buffers, screenManager) {
        this.rotation = 0.0;
        this.speed = 1.0;
        this.tick = tick;
        tick.add(this.update.bind(this));
        this.gl = gl;
        this.programInfo = programInfo;
        this.buffers = buffers;
        this.screenManager = screenManager;
    }
    setCamera() {
        const canvas = (this.gl.canvas);
        this.gl.viewport(0, 0, canvas.width, canvas.height);
        const fov = (45 * Math.PI) / 180;
        const aspect = canvas.clientWidth / canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);
        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -1.0]);
        this.setPositionAttribute();
        this.setColorAttribute();
        this.gl.useProgram(this.programInfo.program);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        const offset = 0;
        const vertexCount = 4;
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, vertexCount);
    }
    setPositionAttribute() {
        const numComponents = 2;
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
    }
    setColorAttribute() {
        const numComponents = 4;
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.color);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexColor, numComponents, type, normalize, stride, offset);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);
    }
    update(deltaTime) {
        this.rotation += this.tick['speed'] * deltaTime;
        this.setCamera();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setCamera();
        });
    }
}
