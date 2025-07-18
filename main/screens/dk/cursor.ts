import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

import { SheetProps } from "./sheet-props.js";
import { ScreenDk } from "./main.js";
import { Options } from "./options.js";
import { EventEmitter } from "../../event-emitter.js";
import { ScreenStates } from "../../state.js";

export class Cursor {
    private gl: WebGLRenderingContext;

    private buffers: Buffers;
    private programInfo: ProgramInfo;

    private screen: ScreenDk;
    private sheetProps: SheetProps;
    private options?: Options;

    private position: [number, number] = [-0.52, 0];
    private coords: [number, number] = [518.99, 265.5];

    public isMouseControlled: boolean = true;
    public selectedIndex: number = 0;
    private optionPosition: [number, number][] = [];
    private cursorTargetPosition: [number, number] = [0, 0];
    private cursorCurrentPosition: [number, number] = [0, 0];
    private readonly cursorOffsetX = this.position[0];

    public selectedColor: [number, number, number, number];
    public selected: boolean = false;

    constructor(
        gl: WebGLRenderingContext,
        buffers: Buffers, 
        programInfo: ProgramInfo,
        screen: ScreenDk,
        sheetProps: SheetProps,
        options?: Options
    ) {
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;

        this.screen = screen;
        this.sheetProps = sheetProps;
        this.options = options;

        this.selectedColor = this.screen.parseColor('rgb(103, 103, 103)');

        this.selectedIndex = 0;
        this.setOptionPosition();
    }

    public setOptions(options: Options) {
        this.options = options;
    }

    public setOptionPosition(): void {
        if(this.options) {
            this.optionPosition = this.options.getOptionPositions();

            if(this.optionPosition.length > 0) {
                this.cursorCurrentPosition = [...this.optionPosition[0]];
                this.cursorTargetPosition = [...this.optionPosition[0]];
                this.selectedIndex = 0;

                this.position = [this.cursorOffsetX, this.optionPosition[0][0]];
                EventEmitter.emit('play-audio', { type: 'option', screen: ScreenStates.Dk });
                this.updateCursor();
            }
        }
    }

    public drawCursor(projectionMatrix: mat4): void {
        const modelViewMatrix = mat4.create();
        const size = [0.03, 0.03];

        const x = this.position[0];
        const y = this.position[1];

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

        const spriteCoords = this.coords;
        const [spriteX, spriteY] = spriteCoords;
        const [sheetWidth, sheetHeight] = this.sheetProps.spriteSheetSize;
        const [spriteWidth, spriteHeight] = [8, 8];

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
        this.gl.uniform1f(this.programInfo.uniformLocations.uTex, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isText, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isCursor, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isShadowText, 0);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        this.gl.uniform1f(this.programInfo.uniformLocations.uThreshold, 0.1);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    private setOptionPositions(): void {
        if(this.options) {
            this.optionPosition = this.options.getOptionPositions();

            if(this.optionPosition.length > 0 &&
                this.selectedIndex < this.optionPosition.length
            ) {
                this.cursorTargetPosition = [...this.optionPosition[this.selectedIndex]];
                this.cursorCurrentPosition = [...this.cursorTargetPosition];
                this.getSelectedIndex();
            }
        }
    }

    private updateCursor(): void {
        this.position = [
            this.cursorOffsetX,
            this.cursorCurrentPosition[1]
        ];
    }

    private moveSelection(direction: number): void {
        if(!this.options || !this.optionPosition || this.optionPosition.length === 0) {
            this.setOptionPositions();
            return;
        }

        const defaultColor = [...this.options.color] as [number, number, number, number];
        this.options.options.forEach(option => {
            option.color = defaultColor;
            option.selected = false;
        });

        this.selectedIndex = (this.selectedIndex + direction + this.optionPosition.length) % this.optionPosition.length;
        this.cursorTargetPosition = [...this.optionPosition[this.selectedIndex]];
        this.cursorCurrentPosition = [...this.cursorTargetPosition];
        EventEmitter.emit('play-audio', { type: 'option', screen: ScreenStates.Dk });

        if(this.options && this.options.options[this.selectedIndex]) this.options.options[this.selectedIndex].color = this.selectedColor;

        this.getSelectedIndex();
    }

    public getSelectedIndex(): number {
        this.updateCursor();    
        return this.selectedIndex;
    }

    public handleInput(key: string): void {
        if(!this.options) return;
        if(!this.optionPosition || this.optionPosition.length === 0) this.setOptionPositions();
        this.selected = false;
        this.isMouseControlled = false;

        switch(key) {
            case 'ArrowUp':
            case 'W':
                this.moveSelection(-1);
                break;
            case 'ArrowDown':
            case 'S':
                this.moveSelection(1);
                break;
            case 'Enter':
                this.selected = true
                this.options.selectedOption();
                setTimeout(() => this.selected = false, this.options.intervalSelected);
                break;
        }
    }

    public handleMouseMove(x: number, y: number): void {
        if(!this.options || !this.optionPosition || this.optionPosition.length === 0) {
            this.setOptionPosition();
            return;
        }
        
        this.isMouseControlled = true;

        const canvas = <HTMLCanvasElement>(this.gl.canvas);
        const rect = canvas.getBoundingClientRect();

        const ndcX = ((x - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((y - rect.top) / rect.height * 2 - 1);

        for(let i = 0; i < this.optionPosition.length; i++) {
            const option = this.options.options[i];
            if(!option.boundsDk) return;
            if(!option) continue;

            const optionX = this.optionPosition[i][0];
            const optionY = this.optionPosition[i][1];
            const [minX, maxX] = option.boundsDk.x;
            const [minY, maxY] = option.boundsDk.y;

            if(
                ndcX >= optionX + minX &&
                ndcX <= optionX + maxX &&
                ndcY >= optionY + minY &&
                ndcY <= optionY + maxY
            ) {
                if(this.selectedIndex !== i) {
                    EventEmitter.emit('play-audio', { type: 'option', screen: ScreenStates.Dk });
                    
                    this.selectedIndex = i;

                    this.cursorTargetPosition = [
                        this.cursorTargetPosition[0],
                        this.optionPosition[i][1]
                    ];
                    
                    this.selected = false;

                    const defaultColor = [...this.options.color] as [number, number, number, number];
    
                    this.options.options.forEach((option, idx) => {
                        option.color = idx === i ? this.selectedColor : defaultColor;
                    });

                    option.color = this.selectedColor;
                }

                break;
            }
        }
    }

    public handleMouseClick(x: number, y: number): void {
        if(!this.options || !this.optionPosition || this.optionPosition.length === 0) {
            this.setOptionPosition();
            return;
        } 

        const canvas = <HTMLCanvasElement>(this.gl.canvas);
        const rect = canvas.getBoundingClientRect();

        const ndcX = ((x - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((y - rect.top) / rect.height * 2 - 1);

        for(let i = 0; i < this.optionPosition.length; i++) {
            const option = this.options.options[i];
            if(!option.boundsDk || !option) continue;

            const optionX = this.optionPosition[i][0];
            const optionY = this.optionPosition[i][1];
            const [minX, maxX] = option.boundsDk.x;
            const [minY, maxY] = option.boundsDk.y;

            if(
                ndcX >= optionX + minX &&
                ndcX <= optionX + maxX &&
                ndcY >= optionY + minY &&
                ndcY <= optionY + maxY
            ) {
                this.selectedIndex = i;
                this.selected = true;
                this.options.selectedOption();

                const defaultColor = [...this.options.color] as [number, number, number, number];
                this.options.options.forEach(opt => opt.color = defaultColor);
                option.color = this.selectedColor;

                setTimeout(() => {
                    this.selected = false;
                }, this.options.intervalSelected);

                break;
            }
        }
    }

    public update(): void {
        const dy = this.cursorTargetPosition[1] - this.cursorCurrentPosition[1];
        const speed = this.isMouseControlled ? 1.0 : 1.0;
        this.cursorCurrentPosition[1] += dy * speed;

        this.getSelectedIndex();
    }
}