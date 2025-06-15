import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";
export class Title {
    constructor(buffers, programInfo, screen) {
        this.position = [0, 0];
        this.size = [1.5, 0.5];
        this.color = [1, 1, 1, 1];
        this.buffers = buffers;
        this.programInfo = programInfo;
        this.screen = screen;
    }
    drawTitle(projectionMatrix) {
        const gl = this.screen['gl'];
        const modelViewMatrix = mat4.create();
        const titleX = this.position[0];
        const titleY = this.position[1] + this.screen['setSize'].h * 0.1;
        mat4.translate(modelViewMatrix, modelViewMatrix, [titleX, titleY, 0]);
        const positions = [
            -this.size[0], -this.size[1],
            this.size[0], -this.size[1],
            -this.size[0], this.size[1],
            this.size[0], this.size[1],
        ];
        const colors = [
            ...this.color, ...this.color,
            ...this.color, ...this.color
        ];
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.dkTilePosition);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.dkTileColor);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(this.programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);
        gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
