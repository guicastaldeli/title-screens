import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";
import { Cursor } from "./cursor.js";
export class Options {
    constructor(gl, buffers, programInfo, screen, sheetProps) {
        this.containerPosition = [0.12, 0];
        this.options = [];
        this.letterCoords = {
            ' ': [555.5, 330.5],
            '.': [552.1, 339.1],
            'Z': [561, 339.1],
            '©': [612.9, 339],
            '1': [528.5, 312.2],
            '2': [537.1, 312.1],
            '8': [591.1, 312.1],
            '9': [600.1, 312.1],
            'A': [609.1, 312.2],
            'B': [618, 312.1],
            'C': [627, 312.1],
            'D': [636, 312.1],
            'E': [645, 312],
            'G': [519.1, 321.1],
            'I': [537.1, 321.1],
            'J': [546.1, 321.1],
            'L': [564.5, 321.2],
            'M': [573, 321.1],
            'N': [582, 321.1],
            'O': [591.1, 321.1],
            'P': [600, 321],
            'R': [618, 321.1],
            'T': [636.5, 321.1],
            'Y': [537.5, 330.1],
        };
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;
        this.screen = screen;
        this.sheetProps = sheetProps;
        this.cursor = new Cursor(this.gl, this.buffers, this.programInfo, this.screen, this.sheetProps, this);
        this.setOptions();
    }
    setOptions() {
        this.options = [
            {
                text: '1 PLAYER GAME A',
                position: [0, 0],
                color: [1.0, 0.0, 0.0, 1.0]
            },
            {
                text: '1 PLAYER GAME B',
                position: [0, -0.15]
            },
            {
                text: '2 PLAYER GAME A',
                position: [0, -0.30]
            },
            {
                text: '2 PLAYER GAME B',
                position: [0, -0.45]
            },
            {
                text: '©1981 NINTENDO COZLTD.',
                position: [-0.1, -0.75]
            },
            {
                text: 'MADE IN JAPAN',
                position: [0.01, -0.85]
            }
        ];
    }
    drawOptions(projectionMatrix, text, x, y, isCopyright = false) {
        const letters = text.split('');
        const spacing = 0.07;
        const startX = x - ((letters.length * spacing) / 2);
        letters.forEach((l, i) => {
            const letterX = startX + (i * spacing);
            this.drawLetter(projectionMatrix, l, letterX, y, isCopyright);
        });
    }
    drawLetter(projectionMatrix, letter, x, y, isCopyright = false) {
        const modelViewMatrix = mat4.create();
        const size = [0.03, 0.03];
        mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, 0]);
        const positions = [
            -size[0], -size[1],
            size[0], -size[1],
            -size[0], size[1],
            size[0], size[1],
        ];
        const spriteCoords = this.letterCoords[letter] || this.letterCoords[' '];
        const [spriteX, spriteY] = spriteCoords;
        const [sheetWidth, sheetHeight] = this.sheetProps.spriteSheetSize;
        const [spriteWidth, spriteHeight] = letter === '©' ? [8, 8] : [7, 7];
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
        this.gl.uniform1f(this.programInfo.uniformLocations.isText, isCopyright ? 0.0 : 1.0);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        const color = isCopyright ?
            this.screen.parseColor('rgb(255, 255, 255)') :
            this.screen.parseColor('rgb(252, 152, 56)');
        this.gl.uniform4f(this.programInfo.uniformLocations.uColor, ...color);
        this.gl.uniform1f(this.programInfo.uniformLocations.uThreshold, 0.1);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    initOptions(projectionMatrix) {
        const originalContainerPosition = [...this.containerPosition];
        this.options.forEach(option => {
            const x = originalContainerPosition[0] + option.position[0];
            const y = originalContainerPosition[1] + option.position[1];
            this.drawOptions(projectionMatrix, option.text, x, y, option.text.includes('©1981') ||
                option.text.includes('MADE'));
        });
    }
}
