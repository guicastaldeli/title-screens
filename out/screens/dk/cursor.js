import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";
export class Cursor {
    constructor(gl, buffers, programInfo, screen, sheetProps, options) {
        this.position = [-0.52, 0];
        this.coords = [518.99, 265.5];
        this.size = [8, 8];
        this.selectedIndex = 0;
        this.optionPosition = [];
        this.cursorTargetPosition = [0, 0];
        this.cursorCurrentPosition = [0, 0];
        this.cursorOffsetX = this.position[0];
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;
        this.screen = screen;
        this.sheetProps = sheetProps;
        this.options = options;
        this.selectedColor = this.screen.parseColor('rgb(211, 211, 211)');
        this.selectedIndex = 0;
        this.setOptionPosition();
    }
    setOptions(options) {
        this.options = options;
    }
    setOptionPosition() {
        if (this.options) {
            this.optionPosition = this.options.getOptionPositions();
            if (this.optionPosition.length > 0) {
                this.cursorCurrentPosition = [...this.optionPosition[0]];
                this.cursorTargetPosition = [...this.optionPosition[0]];
                this.selectedIndex = 0;
                this.updateCursor();
            }
        }
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
        this.gl.uniform1f(this.programInfo.uniformLocations.isCursor, 1);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.uniform1f(this.programInfo.uniformLocations.uThreshold, 0.1);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    setOptionPositions() {
        if (this.options) {
            this.optionPosition = this.options.getOptionPositions();
            if (this.optionPosition.length > 0 &&
                this.selectedIndex < this.optionPosition.length) {
                this.cursorTargetPosition = [...this.optionPosition[this.selectedIndex]];
                this.cursorCurrentPosition = [...this.cursorTargetPosition];
                this.getSelectedIndex();
            }
        }
    }
    updateCursor() {
        this.position = [
            this.cursorOffsetX,
            this.cursorCurrentPosition[1]
        ];
    }
    moveSelection(direction) {
        if (!this.optionPosition || this.optionPosition.length === 0) {
            this.setOptionPositions();
            return;
        }
        this.selectedIndex = (this.selectedIndex + direction + this.optionPosition.length) % this.optionPosition.length;
        this.cursorTargetPosition = [...this.optionPosition[this.selectedIndex]];
        this.cursorCurrentPosition = [...this.cursorTargetPosition];
        if (this.options && this.options.options[this.selectedIndex]) {
            const defaultColor = [...this.options.color];
            this.options.options[this.selectedIndex].color = this.selectedColor;
            this.options.options.forEach((option, i) => {
                if (i !== this.selectedIndex) {
                    option.color = defaultColor;
                }
            });
        }
        this.getSelectedIndex();
    }
    getSelectedIndex() {
        this.updateCursor();
        return this.selectedIndex;
    }
    handleInput(key) {
        if (!this.options)
            return;
        if (!this.optionPosition || this.optionPosition.length === 0)
            this.setOptionPositions();
        switch (key) {
            case 'ArrowUp':
            case 'W':
                this.moveSelection(-1);
                break;
            case 'ArrowDown':
            case 'S':
                this.moveSelection(1);
                break;
            case 'Enter':
                this.options.selectedOption();
                break;
        }
    }
    update() {
        const dx = this.cursorTargetPosition[0] - this.cursorCurrentPosition[0];
        const dy = this.cursorTargetPosition[1] - this.cursorCurrentPosition[1];
        this.cursorCurrentPosition[0] += dx;
        this.cursorCurrentPosition[1] += dy;
        this.getSelectedIndex();
    }
}
