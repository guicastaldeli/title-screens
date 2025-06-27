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
                this.selectedIndex = Math.min(this.selectedIndex, this.optionPosition.length - 1);
                this.selectedIndex = Math.max(0, this.selectedIndex);
                
                this.cursorCurrentPosition = [...this.optionPosition[this.selectedIndex]];
                this.cursorTargetPosition = [...this.optionPosition[this.selectedIndex]];
                
                this.position = [this.cursorOffsetX, this.optionPosition[this.selectedIndex][1]];
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
            [x, y, 1]
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
        this.gl.uniform1f(this.programInfo.uniformLocations.isPlayer, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isCloud, 0);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        this.gl.uniform1f(this.programInfo.uniformLocations.uThreshold, 0.1);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

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
            if(option.text !== 'MARIO GAME' &&
                option.text !== 'LUIGI GAME'
            ) {
                option.selected = false;
                option.color = defaultColor;
            }
        });

        this.selectedIndex = (this.selectedIndex + direction + this.optionPosition.length) % this.optionPosition.length;
        this.cursorTargetPosition = [...this.optionPosition[this.selectedIndex]];
        this.cursorCurrentPosition = [...this.cursorTargetPosition];

        const currentOption = this.options.options[this.selectedIndex];
        if(currentOption && 
            currentOption.text !== 'MARIO GAME' &&
            currentOption.text !== 'LUIGI GAME'
        )  {
            currentOption.color = this.selectedColor;
        }

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
                const selectedOptionPos = this.optionPosition[this.selectedIndex];
                this.options.selectedOption(
                    selectedOptionPos[0],
                    selectedOptionPos[1]
                );
                setTimeout(() => this.selected = false, this.options.intervalSelected);
                break;
        }
    }

    private screenCoords(clientX: number, clientY: number): [number, number] {
        const canvas = this.gl.canvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();

        const x = (clientX - rect.left) / rect.width * 2 - 1;
        const y = -((clientY - rect.top) / rect.height * 2 - 1);

        return [x, y];
    }

    public handleMouseMove(x: number, y: number): void {
        if(!this.options || !this.optionPosition || this.optionPosition.length === 0) {
            this.setOptionPosition();
            return;
        }
        
        const [ndcX, ndcY] = this.screenCoords(x, y);
        this.isMouseControlled = true;

        let hoveredIndex = -1;
        for(let i = 0; i < this.optionPosition.length; i++) {
            const option = this.options.options[i];

            if(this.options.isPointOption(ndcX, ndcY, option)) {
                hoveredIndex = i;
                return;
            }
        }

        if(hoveredIndex !== -1 && hoveredIndex !== this.selectedIndex) {
            this.selectedIndex = hoveredIndex;
            this.cursorTargetPosition = [...this.optionPosition[this.selectedIndex]];
            const defaultColor = [...this.options.color] as [number, number, number, number];
                    
            if(this.isMouseControlled) {
                this.selected = false;
    
                this.options.options.forEach((option, idx) => {
                    option.hovered = (idx === hoveredIndex);
                            
                    if(!option.selected && 
                        option.text !== 'MARIO GAME' && 
                        option.text !== 'LUIGI GAME'
                    ) {
                        option.selected = false;
                        option.color = defaultColor;
                        option.color = idx === hoveredIndex ? this.selectedColor : defaultColor;
                    }
                });
            }
        }
    }

    public handleMouseClick(x: number, y: number): void {
        if(!this.options) return;
        const [ndX, ndcY] = this.screenCoords(x, y);

        for(let i = 0; i < this.optionPosition.length; i++) {
            const option = this.options.options[i];

            if(this.options.isPointOption(x, y, option)) {
                this.selectedIndex = i;
                this.selected = true;
                const selectedOption = this.options.options[this.selectedIndex];

                if(selectedOption.text !== 'MARIO GAME' && 
                    selectedOption.text !== 'LUIGI GAME') {
                    setTimeout(() => {
                    this.selected = false;
                    }, this.options?.intervalSelected || 1000);
                }

                this.options.selectedOption(ndX, ndcY);
                break;
            }
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