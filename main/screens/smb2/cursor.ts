import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

import { SheetProps } from "./sheet-props.js";
import { ScreenSmb } from "./main.js";
import { Options } from "./options.js";

export class Cursor {
    private gl: WebGLRenderingContext;

    private buffers: Buffers;
    private programInfo: ProgramInfo;

    private screen: ScreenSmb;
    private sheetProps: SheetProps;
    private options?: Options;

    private position: [number, number] = [-0.45, 0];
    private coords: [number, number] = [12.08, 360.1];

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
        screen: ScreenSmb,
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

                this.position = [this.cursorOffsetX, this.optionPosition[0][1]];
                this.updateCursor();
            }
        }
    }

    public drawCursor(projectionMatrix: mat4): void {
        const modelViewMatrix = mat4.create();
        const size = [0.04, 0.04];

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
        const [sheetWidth, sheetHeight] = this.sheetProps.miscProps().spriteSheetSize;
        const [spriteWidth, spriteHeight] = [7.8, 7.8];

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

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.smbTilePosition);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.smbTileTextureCoord);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(coords), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.textureCoord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.buffers.smbTileTexture);
        this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.uTex, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isText, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isCursor, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isSelected, 0);

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
            if(!option.selected) {
                option.color = defaultColor;
            }
        });

        this.selectedIndex = (this.selectedIndex + direction + this.optionPosition.length) % this.optionPosition.length;
        this.cursorTargetPosition = [...this.optionPosition[this.selectedIndex]];
        this.cursorCurrentPosition = [...this.cursorTargetPosition];

        const currentOption = this.options.options[this.selectedIndex];
        if(currentOption && !currentOption.selected) currentOption.color = this.selectedColor;

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
                this.selected = true;
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

        const ndcY = -((y - rect.top) / rect.height * 2 - 1);

        for(let i = 0; i < this.optionPosition.length; i++) {
            const option = this.options.options[i];
            if(!option) continue;

            const optionY = this.optionPosition[i][1];
            const [minY, maxY] = option.bounds.y;

            if(
                ndcY >= optionY + minY &&
                ndcY <= optionY + maxY
            ) {
                if(this.selectedIndex !== i) {
                    this.selectedIndex = i;

                    this.cursorTargetPosition = [
                        this.cursorTargetPosition[0],
                        this.optionPosition[i][1]
                    ];
                    
                    if(this.isMouseControlled) {
                        this.selected = false;
                        const defaultColor = [...this.options.color] as [number, number, number, number];
    
                        this.options.options.forEach((option, idx) => {
                            if(option.selected && 
                                option.text !== 'MARIO GAME' && 
                                option.text !== 'LUIGI GAME'
                            ) {
                                option.color = idx === i ? this.selectedColor : defaultColor;
                            }
                        });
                    }
                }

                break;
            }
        }
    }

    public handleMouseClick(): void {
        if(!this.selected && this.options) {
            this.selected = true;
            const selectedOption = this.options.options[this.selectedIndex];

            if(selectedOption.text !== 'MARIO GAME' && 
                selectedOption.text !== 'LUIGI GAME') {
                setTimeout(() => {
                   this.selected = false;
                }, this.options?.intervalSelected || 1000);
            }

            this.options.selectedOption();
        }
    }

    public async getTex(): Promise<void> {
        try {
            const path = './screens/smb2/assets/sprites/smb2-misc-sprites.png';
            const tex = await this.screen.loadTexture(this.gl, path);
            this.buffers.smbTileTexture = tex;
        } catch(err) {
            console.log(err);
        }
    }

    public update(): void {
        const dy = this.cursorTargetPosition[1] - this.cursorCurrentPosition[1];
        const speed = this.isMouseControlled ? 1.0 : 1.0;
        this.cursorCurrentPosition[1] += dy * speed;

        this.getSelectedIndex();
    }
}