import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { Tick } from "../../tick.js";
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
    private tick: Tick;
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
    public selectionTimeout: Map<Option, number> = new Map();
    private prevSelectedIndex: any;

    constructor(
        tick: Tick,
        gl: WebGLRenderingContext,
        buffers: Buffers, 
        programInfo: ProgramInfo,
        screen: ScreenSmb,
        levelState: LevelState,
        sheetProps: SheetProps,
        cursor: Cursor
    ) {
        this.tick = tick;
        this.tick.add(this.update.bind(this));

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
        const prevSelected = new Set<string>();
        const prevHoveredIndex = this.options.findIndex(opt => opt.hovered);
        const points = this.screen.points;
        const topScore = points ? points.getTopScore() : 0;
        const scoreFormat = `TOP- ${topScore.toString().padStart(6, '0').substring(0, 6)}`;
        const score = this.options.find(opt => opt.text.startsWith('TOP-'))?.text || scoreFormat;

        this.options.forEach(opt => {
            if(opt.selected) prevSelected.add(opt.text);
        });

        this.options = [
            this.createOption('MARIO GAME', 0, 0, this.currentState),
            this.createOption('LUIGI GAME', 0, -0.15, this.currentState),
            this.createOption('MUSIC OFF', 0, -0.30, this.currentState),
            this.createOption(score, 0, -0.45, this.currentState),
        ];

        this.options.forEach((opt, i) => {
            if(prevSelected.has(opt.text)) {
                opt.selected = true;
                opt.color = this.cursor.selectedColor;
            }

            if(i === prevHoveredIndex) opt.hovered = true;
        });

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

        const isSelected = option !== undefined &&
        (option.selected ||
        (this.options.indexOf(option) === this.cursor.selectedIndex && (option.hovered ?? false)));

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
                option?.selected || false,
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
            [x, y, 1]
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

        const option = this.options.find(opt => {
            const optionX = this.containerPosition[0] + opt.position[0];
            const optionY = this.containerPosition[1] + opt.position[1];
            const width = opt.text.length * 0.08;
            const height = 0.08

            return Math.abs(x - optionX) < width &&
                    Math.abs(y - optionY) < height;
        });

        const isHovered = option?.hovered ?? false;
        const actuallySelected = option?.selected ?? false;

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
        this.gl.uniform1f(this.programInfo.uniformLocations.isPlayer, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isCloud, 0);
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        const shouldShowSelectedShader = isHovered && !actuallySelected;
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
        this.gl.depthFunc(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.LEQUAL);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    private createOption(
        text: string,
        x: number,
        y: number,
        type?: States
    ): Option {
        const width = text.length * 0.08;
        const height = 0.08;
        const interactive = !text.startsWith('TOP-');

        return {
            text,
            position: [x, y],
            selected: false,
            color: this.color,
            interactive,
            bounds: {
                minX: x - (width / 2),
                maxX: x + (width / 2),
                minY: y - height / 0.3,
                maxY: y + height / 0.3
            },
            type
        }
    }

    public selectedOption(x: number, y: number): void {
        if(!this.cursor) return;
        const selectedIndex = this.cursor.getSelectedIndex();

        if(selectedIndex >= 0 && selectedIndex < this.options.length) {
            const option = this.options[selectedIndex];

            if(x !== undefined && y !== undefined) {
                if(!this.isPointOption(x, y, option)) {
                    return;
                }
            }

            this.handleSelection(option);
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
            const wasSelected = option.selected;

             this.options.forEach(opt => {
                if (!(opt.text === 'MARIO GAME' || 
                    opt.text === 'LUIGI GAME')
                ) {
                    opt.selected = false;
                    opt.color = defaultColor;
                }
            });

            option.selected = !wasSelected;
            option.color = option.selected ? this.cursor.selectedColor : defaultColor;

            if(option.selected) {
                const timoutId = setTimeout(() => {
                   if(this.options[this.cursor.selectedIndex] === option) {
                        option.color = this.cursor.selectedColor
                   } else {
                        option.color = defaultColor
                   }

                   option.selected = false;
                   this.selectionTimeout.delete(option)
                }, this.intervalSelected) as unknown as number;

                this.selectionTimeout.set(option, timoutId);
            }
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

    public isPointOption(x: number, y: number, option: Option): boolean {
        if(!option.bounds) return false;

        return x >= option.bounds.minX &&
                x <= option.bounds.maxX &&
                y >= option.bounds.minY &&
                y <= option.bounds.maxY;
    }

    public clearSelection(): void {
        const defaultColor = [...this.color] as [number, number, number, number];

        this.options.forEach(option => {
            if(option.text !== 'MARIO GAME' &&
                option.text !== 'LUIGI GAME'
            ) {
                const timeoutId = this.selectionTimeout.get(option);

                if(timeoutId) {
                    clearTimeout(timeoutId);
                    this.selectionTimeout.delete(option);
                    option.selected = false;
                    option.color = defaultColor;
                }
            }
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
        const prevSelectedIndex = this.cursor.getSelectedIndex();
        const prevSelectedOpt = this.options[prevSelectedIndex]?.text;
        const prevSelected = this.options.filter(opt => opt.selected).map(opt => opt.text);
        const prevHoveredIndex = this.options.findIndex(opt => opt.hovered);

        this.selectionTimeout.forEach((timeoutId, option) => {
            clearTimeout(timeoutId);
            option.selected = false;
            option.color = this.color;
            this.selectionTimeout.delete(option);
        });

        this.currentState = this.levelState.getCurrentState();
        this.setOptions();

        this.options.forEach((opt, i) => {
            if(opt.text === 'MARIO GAME' || opt.text === 'LUIGI GAME') {
                const wasSelected = prevSelected.includes(opt.text);
                opt.selected = wasSelected;
                opt.color = wasSelected ? this.cursor.selectedColor : this.color;
            } else {
                opt.selected = false;
                opt.color = this.color;
                opt.hovered = (i === prevHoveredIndex);
            }
        });

        const updIndex = this.options.findIndex(opt => opt.text === prevSelectedOpt);
        this.cursor.selectedIndex = updIndex >= 0 ? updIndex : 0;
        this.cursor.setOptionPosition();
    }

    public update(deltaTime: number): void {
        if(deltaTime <= 0 || this.tick.timeScale <= 0) return;
        this.waveTime += this.waveSpeed * deltaTime;
    }
}