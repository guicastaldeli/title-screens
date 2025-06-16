import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";
export class Cursor {
    constructor(gl, buffers, programInfo, screen, sheetProps, options) {
        this.position = [-0.52, 0];
        this.coords = [519, 266];
        this.size = [6.8, 6.8];
        this.optionPosition = [];
        this.selectedIndex = 0;
        this.cursorTargetPosition = [0, 0];
        this.cursorCurrentPosition = [0, 0];
        this.cursorOffsetX = this.position[0];
        this.cursorSpeed = 0.1;
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;
        this.screen = screen;
        this.sheetProps = sheetProps;
        this.options = options;
    }
    drawCursor(projectionMatrix) {
        const modelViewMatrix = mat4.create();
        const size = [0.03, 0.03];
        const x = this.position[0];
        const y = this.position[1];
        mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, 0]);
        const positions = [
            -size[0], -size[1],
            size[0], -size[1],
            -size[0], size[1],
            size[0], size[1],
        ];
        const spriteCoords = this.coords;
        const [spriteX, spriteY] = spriteCoords;
        const [sheetWidth, sheetHeight] = this.sheetProps.spriteSheetSize;
        const [spriteWidth, spriteHeight] = [this.size[0], this.size[1]];
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
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkTitleTextureCoord);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(coords), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.textureCoord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.buffers.dkTitleTexture);
        this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.uTex, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isText, 0);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    setOptionPositions() {
        if (this.options) {
            this.optionPosition = this.options.getOptionPositions();
            if (this.optionPosition.length > 0 &&
                this.selectedIndex < this.optionPosition.length) {
                this.cursorTargetPosition = [...this.optionPosition[0]];
                this.cursorTargetPosition = [...this.optionPosition[1]];
                this.updateCursor();
            }
        }
    }
    updateCursor() {
        this.position = [
            this.cursorCurrentPosition[0] + this.cursorOffsetX,
            this.cursorCurrentPosition[1]
        ];
    }
    moveSelection(direction) {
        if (!this.optionPosition || this.optionPosition.length === 0) {
            this.setOptionPositions();
            return;
        }
    }
    handleInput(key) {
        if (!this.optionPosition || this.optionPosition.length === 0)
            this.setOptionPositions();
        switch (key) {
            case 'ArrowUp':
                this.moveSelection(-1);
                break;
            case 'ArrowDown':
                this.moveSelection(1);
                break;
        }
    }
    update(deltaTime) {
        const speed = deltaTime * 50;
        const dx = this.cursorTargetPosition[0] - this.cursorCurrentPosition[0];
        const dy = this.cursorTargetPosition[1] - this.cursorCurrentPosition[1];
        this.cursorCurrentPosition[0] += dx * this.cursorSpeed * speed;
        this.cursorCurrentPosition[1] += dy * this.cursorSpeed * speed;
        this.updateCursor();
    }
}
