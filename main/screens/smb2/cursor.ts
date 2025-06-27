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
                if(this.options.options[this.selectedIndex].interactive === false) {
                    const interactiveIndex = this.options.options.findIndex(opt => opt.interactive !== false);
                    
                    if(interactiveIndex !== -1) {
                        this.selectedIndex = interactiveIndex
                    } else {
                        this.selectedIndex = 0;
                    }
                }

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

        this.options.clearSelection();

        this.options.options.forEach(option => {
            option.hovered = false;
            
            if(!option.selected &&
                option.text !== 'MARIO GAME' &&
                option.text !== 'LUIGI GAME') {
                option.color = defaultColor;
            }
        });

        let newIndex = this.selectedIndex;
        let attempts = 0;
        const maxAttempts = this.optionPosition.length * 2;

        do {
            newIndex = (newIndex + direction + this.optionPosition.length) % this.optionPosition.length;
            attempts++;

            const currentOption = this.options.options[newIndex];
            if(currentOption.interactive !== false) break;
        } while(attempts < maxAttempts);

        if(attempts >= maxAttempts) return;
        if(this.options.options[newIndex].interactive === false) return;

        this.selectedIndex = newIndex;
        this.cursorTargetPosition = [...this.optionPosition[this.selectedIndex]];
        this.cursorCurrentPosition = [...this.cursorTargetPosition];
        const currentOption = this.options.options[this.selectedIndex];

        if(currentOption) {
            currentOption.hovered = true;

            if(!currentOption.selected &&
                currentOption.text !== 'MARIO GAME' &&
                currentOption.text !== 'LUIGI GAME'){
                currentOption.color = this.selectedColor;
            }
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
                const currentOption = this.options.options[this.selectedIndex];

                if(currentOption) {
                    currentOption.hovered = true;
                    
                    this.options.selectedOption(
                        this.optionPosition[this.selectedIndex][0],
                        this.optionPosition[this.selectedIndex][1]
                    );
                }

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
        const defaultColor = [...this.options.color] as [number, number, number, number];

        this.options.options.forEach(option => {
            if(!option.selected &&
                option.text !== 'MARIO GAME' &&
                option.text !== 'LUIGI GAME') {
                option.color = defaultColor;
            }
        });

        for(let i = 0; i < this.optionPosition.length; i++) {
            const option = this.options.options[i];
            if(option.interactive === false) continue;

            if(this.options.isPointOption(ndcX, ndcY, option)) {
                hoveredIndex = i;
                option.hovered = true;

                if(!option.selected &&
                    option.text !== 'MARIO GAME' &&
                    option.text !== 'LUIGI GAME') {
                    option.color = this.selectedColor;
                }

                break;
            }
        }

        if(hoveredIndex !== -1 && hoveredIndex !== this.selectedIndex) {
            const updOption = this.options.options[hoveredIndex]; 
            const prev = this.options.options[this.selectedIndex];
            if(prev) prev.hovered = false;

            if(updOption.interactive !== false) {
                this.selectedIndex = hoveredIndex;
                this.cursorTargetPosition = [...this.optionPosition[this.selectedIndex]];
            }

            this.options.clearSelection();
        }
    }

    public handleMouseClick(x: number, y: number): void {
        if(!this.options) return;
        const [ndcX, ndcY] = this.screenCoords(x, y);

        for(let i = 0; i < this.optionPosition.length; i++) {
            const option = this.options.options[i];
            if(!option || option.interactive === false) continue;

            if(this.options.isPointOption(ndcX, ndcY, option)) {
                this.selectedIndex = i;
                this.selected = true;

                this.cursorTargetPosition = [...this.optionPosition[this.selectedIndex]];
                const selectedOption = this.options.options[this.selectedIndex];

                if(selectedOption.text !== 'MARIO GAME' && 
                    selectedOption.text !== 'LUIGI GAME') {
                    setTimeout(() => {
                    this.selected = false;
                    }, this.options?.intervalSelected || 1000);
                }

                this.options.selectedOption(ndcX, ndcY);
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