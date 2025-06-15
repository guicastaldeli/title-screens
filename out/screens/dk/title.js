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
export class Title {
    constructor(gl, buffers, programInfo, screen) {
        this.position = [0, 0];
        this.size = [1, 0.5];
        this.color = [1, 1, 1, 1];
        this.spriteSheetSize = [772, 507];
        this.spriteSize = [230, 100];
        this.spriteCoords = [
            13,
            36
        ];
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;
        this.screen = screen;
    }
    drawTitle(projectionMatrix) {
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
        //Coords
        let coords;
        if (this.spriteCoords) {
            const [spriteX, spriteY] = this.spriteCoords;
            const [sheetWidth, sheetHeight] = this.spriteSheetSize;
            const [spriteWidth, spriteHeight] = this.spriteSize;
            const left = spriteX / sheetWidth;
            const right = (spriteX + spriteWidth) / sheetWidth;
            const top = spriteY / sheetHeight;
            const bottom = ((spriteY + spriteHeight) / sheetHeight);
            coords = [
                left, bottom,
                right, bottom,
                left, top,
                right, top
            ];
        }
        else {
            coords = [
                0.0, 1.0,
                1.0, 1.0,
                0.0, 0.0,
                1.0, 0.0
            ];
        }
        //
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkTilePosition);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkTitleTextureCoord);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(coords), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.textureCoord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.buffers.dkTitleTexture);
        this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.uTex, 1);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    getTex() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const path = './screens/dk/assets/sprites/dk-title-screen-sheet.png';
                const tex = yield this.screen.loadTexture(this.gl, path);
                this.buffers.dkTitleTexture = tex;
            }
            catch (err) {
                console.log(err);
            }
        });
    }
}
