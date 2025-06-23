import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

import { Option } from "../option.interface.js";
import { ScreenDk } from "./main.js";
import { Title } from "./title.js";
import { Cursor } from "./cursor.js";
import { SheetProps } from "./sheet-props.js";
import { LetterMap } from "./letter-map.js";

export class Options {
    private gl: WebGLRenderingContext;

    private buffers: Buffers;
    private programInfo: ProgramInfo;

    private screen: ScreenDk;
    private sheetProps: SheetProps;
    private cursor: Cursor;
    private letterMap: typeof LetterMap;

    private containerPosition: [number, number] = [0.12, 0];
    private isCopyright: boolean = false;

    private copyrightText: {
        text: string,
        position: [number, number]
    }[] = [];

    public color: [number, number, number, number] = [1.0, 1.0, 1.0, 1.0]

    public options: Option[] = [];
    private waveTime: number = 0.0;
    private waveSpeed: number = 2.0;
    public intervalSelected: number = 1000;
    private selectionTimeout: Map<Option, number> = new Map();

    constructor(
        gl: WebGLRenderingContext,
        buffers: Buffers, 
        programInfo: ProgramInfo,
        screen: ScreenDk,
        sheetProps: SheetProps,
        cursor: Cursor
    ) {
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;

        this.screen = screen;
        this.sheetProps = sheetProps;
        this.cursor = cursor;

        this.color = 
            this.isCopyright ? 
            this.screen.parseColor('rgb(255, 255, 255)') : 
            this.screen.parseColor('rgb(252, 152, 56)')
        ;

        this.setOptions();

        this.letterMap = LetterMap;
    }

    private setOptions(): void {
        this.options = [
            this.createOption('1 PLAYER GAME A', 0, 0),
            this.createOption('1 PLAYER GAME B', 0, -0.15),
            this.createOption('2 PLAYER GAME A', 0, -0.30),
            this.createOption('2 PLAYER GAME B', 0, -0.45)
        ];
        
        this.copyrightText = [
            this.createOption('©1981 NINTENDO COZLTD.', 0, -0.75, true),
            this.createOption('MADE IN JAPAN', 0.1, -0.85, true)
        ];

        if(this.options.length > 0) this.options[0].color = this.cursor.selectedColor;
    }

    public drawOptions(
        projectionMatrix: mat4,
        text: string,
        x: number,
        y: number,
        isCopyright: boolean = false
    ): void {
        const letters = text.split('');
        const spacing = 0.07;
        const startX = x - ((letters.length * spacing) / 2);
        const textStartX = x;
        const textEndX = startX + (letters.length * spacing);

        const option = this.options.find(opt => {
            const dx = Math.abs(opt.position[0] - (x - this.containerPosition[0]));
            const dy = Math.abs(opt.position[1] - (y - this.containerPosition[1]));
            return dx < 0.001 && dy < 0.001;
        });

        const isSelected = option !== undefined 
        && this.options.indexOf(option) === this.cursor.selectedIndex;

        const originalColor = [...this.color] as [number, number, number, number];
        if(option) this.color = option.color ?? originalColor;

        letters.forEach((l, i) => {
            const letterX = startX + (i * spacing);

            this.drawLetter(
                projectionMatrix,
                l,
                letterX,
                y,
                isCopyright,
                textStartX,
                textEndX,
                isSelected
            );
        });

        this.color = originalColor;
    }

    private drawLetter(
        projectionMatrix: mat4,
        letter: string,
        x: number,
        y: number,
        isCopyright: boolean = false,
        textStartX: number,
        textEndX: number,
        isSelected: boolean
    ): void {
        const modelViewMatrix = mat4.create();
        const size = [0.03, 0.03];

        mat4.translate(
            modelViewMatrix,
            modelViewMatrix,
            [x, y, 0]
        );

        const positions = [
            -size[0], -size[1],
            size[0], -size[1],
            -size[0], size[1],
            size[0], size[1],
        ];

        const spriteCoords = this.letterMap[letter] || this.letterMap[' '];
        const [spriteX, spriteY] = spriteCoords;
        const [sheetWidth, sheetHeight] = this.sheetProps.spriteSheetSize;
        const [spriteWidth, spriteHeight] = letter === '©' ? [8, 8] : [7, 7]

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

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.dkTileTextureCoord);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(coords), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.textureCoord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.buffers.dkTileTexture);
        this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isCursor, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.uTex, 1);
        this.gl.uniform1f(
            this.programInfo.uniformLocations.isText,
            isCopyright ? 0.0 : 1.0
        );
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.uniform1i(this.programInfo.uniformLocations.isSelected, isSelected && !this.cursor.selected ? 1 : 0);
        if(isSelected === true && !this.cursor.selected) this.gl.uniform2f(this.programInfo.uniformLocations.uTextStartPos, textStartX, textEndX);

        this.gl.uniform4f(this.programInfo.uniformLocations.uColor, ...this.color);
        this.gl.uniform1f(this.programInfo.uniformLocations.uThreshold, 0.1);
        this.gl.uniform1f(this.programInfo.uniformLocations.uTime, this.waveTime);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    private createOption(
        text: string,
        x: number,
        y: number,
        isCopyright = false
    ): Option {
        const width = text.length;
        const height = 0.05;

        return {
            text,
            position: [x, y],
            selected: false,
            color: this.color,
            bounds: {
                x: [x - width / 2, x + width / 2],
                y: [y / 20 - height, y / 20 + height]
            }
        }
    }

    public selectedOption(): void {
        if(!this.cursor) return;
        const selectedIndex = this.cursor.getSelectedIndex();

        if(selectedIndex >= 0 && 
            selectedIndex < this.options.length
        ) {
            this.handleSelection(this.options[selectedIndex]);
        }
    }

    private handleSelection(option: Option) {
        const defaultColor = [...this.color] as [number, number, number, number];
        const exTimeout = this.selectionTimeout.get(option);
        if(exTimeout) {
            clearTimeout(exTimeout);
            this.selectionTimeout.delete(option);
        }

        this.options.forEach(opt => {
            if(opt !== option) {
                opt.selected = false;
                opt.color = defaultColor;
            }
        });

        if(!this.cursor.isMouseControlled) {
            setTimeout(() => {
                if(this.options[this.cursor.selectedIndex] === option) {
                    option.color = this.cursor.selectedColor;
                } else {
                    option.color = defaultColor;
                }

                this.selectionTimeout.delete(option);
            }, this.intervalSelected);

            this.selectionTimeout.set(option, this.intervalSelected);
        }

        option.color = this.screen.parseColor('rgb(102, 102, 102)');
        option.selected = true;
    }

    public getOptionPositions(): [number, number][] {
        return this.options.map(option => {
            return [
                this.containerPosition[0] + option.position[0],
                this.containerPosition[1] + option.position[1]
            ];
        });
    }

    public initOptions(projectionMatrix: mat4): void {
        const originalContainerPosition = [...this.containerPosition];

        this.options.forEach(option => {
            const x = originalContainerPosition[0] + option.position[0];
            const y = originalContainerPosition[1] + option.position[1];

            this.drawOptions(
                projectionMatrix,
                option.text,
                x,
                y,
                false
            );
        });

        this.copyrightText.forEach(option => {
            this.drawOptions(
                projectionMatrix,
                option.text,
                option.position[0],
                option.position[1],
                true
            );
        });
    }

    public update(deltaTime: number): void {
        this.waveTime += this.waveSpeed * deltaTime;
    }
}