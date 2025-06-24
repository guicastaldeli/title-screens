import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

import { Option } from "../option.interface.js";
import { ScreenSmb } from "./main.js";
import { Title } from "./title.js";
import { Cursor } from "./cursor.js";
import { SheetProps } from "./sheet-props.js";
import { TextureMap } from "./texture-map.js";
import { States } from "./texture-map.interface.js";
import { LevelState } from "./level-state.js";

export class Options {
    private gl: WebGLRenderingContext;

    private buffers: Buffers;
    private programInfo: ProgramInfo;

    private screen: ScreenSmb;
    private levelState: LevelState;
    private currentState: States;
    private sheetProps: SheetProps;
    private cursor: Cursor;
    private textureMap: TextureMap;

    private containerPosition: [number, number] = [0.12, -0.20];
    private isCopyright: boolean = false;

    private copyrightText: {
        text: string,
        position: [number, number]
    }[] = [];

    public color: [number, number, number, number] = [1.0, 1.0, 1.0, 1.0];

    public options: Option[] = [];
    private waveTime: number = 0.0;
    private waveSpeed: number = 2.0;
    public intervalSelected: number = 1000;
    private selectionTimeout: Map<Option, number> = new Map();
    private prevSelectedIndex: any;

    constructor(
        gl: WebGLRenderingContext,
        buffers: Buffers, 
        programInfo: ProgramInfo,
        screen: ScreenSmb,
        levelState: LevelState,
        sheetProps: SheetProps,
        cursor: Cursor
    ) {
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;

        this.screen = screen;
        this.levelState = levelState;
        this.currentState = this.levelState.getCurrentState();
        this.sheetProps = sheetProps;
        this.cursor = cursor;

        this.setOptions();
        this.textureMap = new TextureMap();

        this.prevSelectedIndex = this.cursor.selectedIndex;
    }

    private setOptions(): void {
        const prevIndex = this.cursor.getSelectedIndex();
        const prevSelectedOpt = this.options[prevIndex]?.text;

        this.options = [
            this.createOption('MARIO GAME', 0, 0, this.currentState),
            this.createOption('LUIGI GAME', 0, -0.15, this.currentState),
            this.createOption('MUSIC OFF', 0, -0.30, this.currentState),
        ];

        const updIndex = this.options.findIndex(opt => opt.text === prevSelectedOpt);
        this.cursor.selectedIndex = updIndex >= 0 ? updIndex : 0;
        this.updateSelectionColors();
    }

    private updateSelectionColors(): void {
        const selectedIndex = this.cursor.getSelectedIndex();
        this.options.forEach((opt, i) => {
            if(!(opt.text === 'MARIO GAME' || 
                opt.text === 'LUIGI GAME') && 
                opt.selected
            ) {
                return;
            }

            opt.color = i === selectedIndex
                ? this.cursor.selectedColor
                : this.color
            opt.selected = i === selectedIndex;
        });
    }

    public drawOptions(
        projectionMatrix: mat4,
        text: string,
        x: number,
        y: number,
        type: States
    ): void {
        const letters = text.split('');
        const spacing = 0.08;
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
                textStartX,
                textEndX,
                isSelected,
                type,
                option?.selected || false
            );
        });

        this.color = originalColor;
    }

    private drawLetter(
        projectionMatrix: mat4,
        letter: string,
        x: number,
        y: number,
        textStartX: number,
        textEndX: number,
        isSelected: boolean,
        type: States,
        optionSelected: boolean,
    ): void {
        if(!type) return;

        const modelViewMatrix = mat4.create();
        const size = [0.04, 0.04];
        const map = this.textureMap.letters;

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

        const spriteCoords = map[type][letter] || map[type][' '];
        const [spriteX, spriteY] = spriteCoords;
        const [sheetWidth, sheetHeight] = this.sheetProps.miscProps().spriteSheetSize;
        const [spriteWidth, spriteHeight] = this.sheetProps.miscProps().spriteProps.letter.spriteSize;

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

        const currentState = this.levelState.getCurrentState();
        const stateValue = 
        currentState === States.Overworld ? 0 :
        currentState === States.Underground ? 1 :
        currentState === States.Underwater ? 2 : 3

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
        this.gl.uniform1f(this.programInfo.uniformLocations.isCursor, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.uTex, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isText, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isHudText, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isShadowText, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isLava, 0);
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        const shouldShowSelectedShader = isSelected && !this.cursor.selected && !optionSelected;
        this.gl.uniform1i(this.programInfo.uniformLocations.isSelected, shouldShowSelectedShader ? 1 : 0);
        if(shouldShowSelectedShader) this.gl.uniform2f(this.programInfo.uniformLocations.uTextStartPos, textStartX, textEndX);

        this.gl.uniform4f(this.programInfo.uniformLocations.uColor, ...this.color);
        this.gl.uniform1f(this.programInfo.uniformLocations.uThreshold, 0.1);
        this.gl.uniform1f(this.programInfo.uniformLocations.uTime, this.waveTime);
        this.gl.uniform1f(this.programInfo.uniformLocations.haveState, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.uState, stateValue);

        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    private createOption(
        text: string,
        x: number,
        y: number,
        type?: States
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
            },
            type
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

        if(option.text === 'MARIO GAME' || option.text === 'LUIGI GAME') {
            this.options.forEach(opt => {
                if(opt.text === 'MARIO GAME' ||
                    opt.text === 'LUIGI GAME'
                ) {
                    opt.selected = false;
                    opt.color = defaultColor;
                }
            });

            option.selected = true;
            option.color = this.cursor.selectedColor;
            if(option.text === 'MARIO GAME') this.screen.setCurrentPlayer('mario');
            if(option.text === 'LUIGI GAME') this.screen.setCurrentPlayer('luigi');            
        } else {
             this.options.forEach(opt => {
                if (!(opt.text === 'MARIO GAME' || 
                    opt.text === 'LUIGI GAME')
                ) {
                    opt.selected = false;
                    opt.color = defaultColor;
                }
            });

            option.selected = true;
            option.color = this.cursor.selectedColor;

            setTimeout(() => {
                if(this.options[this.cursor.selectedIndex] === option) {
                    option.color = this.cursor.selectedColor;
                } else {
                    option.color = defaultColor;
                }
    
                option.selected = false;
                this.selectionTimeout.delete(option);
            }, this.intervalSelected);
    
            this.selectionTimeout.set(option, this.intervalSelected);
        }
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
                option.type!
            );
        });
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

    public updateState(): void {
        this.currentState = this.levelState.getCurrentState();
        this.setOptions();
    }

    public update(deltaTime: number): void {
        this.waveTime += this.waveSpeed * deltaTime;
    }
}