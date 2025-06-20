import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

import { ScreenSmb } from "./main.js";
import { SheetProps } from "./sheet-props.js";

import { AnimationManager } from "./animation-manager.js";
import { FrameData } from "./animation.js";
import { HudProps } from "./hud.interface.js";
import { LetterMap } from "./letter-map.js";

export class Hud {
    private gl: WebGLRenderingContext;
    private texture: WebGLTexture | null = null;

    private buffers: Buffers;
    private programInfo: ProgramInfo;

    private screen: ScreenSmb;
    private sheetProps: SheetProps;

    private animationManager: AnimationManager;
    private currentFrame: FrameData;
    private hudProps: HudProps[] = [];
    private letterMap: typeof LetterMap;

    private color: [number, number, number, number] = [1.0, 1.0, 1.0, 1.0];
    private containerPosition: [number, number] = [0, -0.15];

    constructor(
        gl: WebGLRenderingContext,
        buffers: Buffers,
        programInfo: ProgramInfo,
        screen: ScreenSmb,
        sheetProps: SheetProps,
    ) {
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;

        this.screen = screen;
        this.sheetProps = sheetProps;

        this.animationManager = new AnimationManager(
            sheetProps, 
            [],
            sheetProps.miscProps().spriteProps.coin.coords.map((c, i) => ({
                id: `coin-${i}`,
                coords: {
                    f: c.f,
                    s: c.s,
                    t: c.t
                },
                availableAnimations: ['flash'],
                stars: 0
            })),
        );
        
        this.letterMap = LetterMap;
        this.currentFrame = this.animationManager.getCoinFrame();
        this.color = this.screen.parseColor('rgb(255, 255, 255)');
    }

    //Hud
        public drawHud(projectionMatrix: mat4): void {
            const modelViewMatrix = mat4.create();

            const position = this.sheetProps.miscProps().spriteProps.hud.position;
            const size = this.sheetProps.miscProps().spriteProps.hud.size;
            const spriteCoords = this.sheetProps.miscProps().spriteProps.hud.coords;
            const spriteSize = this.sheetProps.miscProps().spriteProps.hud.spriteSize;
            const sheetSize = this.sheetProps.miscProps().spriteSheetSize;

            const hudX = position[0];
            const hudY = position[1] + this.screen['setSize'].h * 0.1;

            mat4.translate(
                modelViewMatrix,
                modelViewMatrix,
                [hudX, hudY, 0]
            );

            const positions = [
                -size[0], -size[1],
                size[0], -size[1],
                -size[0], size[1],
                size[0], size[1],
            ];

            const [spriteX, spriteY] = spriteCoords;
            const [spriteWidth, spriteHeight] = spriteSize;
            const [sheetWidth, sheetHeight] = sheetSize;

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
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
            this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
            this.gl.uniform1f(this.programInfo.uniformLocations.uTex, 1);
            this.gl.uniform1f(this.programInfo.uniformLocations.isText, 0);
            
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

            this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
            this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

            //Elments
            this.setHud();
            this.initHudProps(projectionMatrix);
            this.drawCoin(projectionMatrix);
        }

        private drawHudProps(
            projectionMatrix: mat4,
            text: string,
            x: number,
            y: number
        ): void {
            const letters = text.split('');
            const spacing = 0.2;
            const startX = x - ((letters.length * spacing) / 2);
            const textStartX = x;
            const textEndX = startX + (letters.length * spacing);

            letters.forEach((l, i) => {
                const letterX = startX + (i * spacing);

                this.drawLetter(
                    projectionMatrix,
                    l,
                    letterX,
                    y,
                    textStartX,
                    textEndX
                );
            });
        }

        private setHud(): void {
            this.hudProps = [
                this.createHudProps('0123456789ABCDEF', 0, 0),
                //this.createHudProps('00000', 0, 0),
                //this.createHudProps('00', 0, 0),
                //this.createHudProps('1-1', 0, 0),
                //this.createHudProps('000', 0, 0)
            ];
        }

        private createHudProps(
            text: string,
            x: number,
            y: number
        ): HudProps {
            return {
                text,
                position: [x, y],
                color: this.color,
            }
        }

        private initHudProps(projectionMatrix: mat4): void {
            const originalContainerPosition = [...this.containerPosition];

            this.hudProps.forEach(props => {
                const x = originalContainerPosition[0] + props.position[0];
                const y = originalContainerPosition[1] + props.position[1];

                this.drawHudProps(
                    projectionMatrix,
                    props.text,
                    x,
                    y,
                );
            });
        }

        private drawLetter(
            projectionMatrix: mat4,
            letter: string,
            x: number,
            y: number,
            textStartX: number,
            textEndX: number
        ): void {
            const modelViewMatrix = mat4.create();
            const size = [0.09, 0.1];

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

            const spriteCoords = this.letterMap.overworld[letter] || this.letterMap.overworld[' '];
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

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.smbTilePosition);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
            this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.smbTileTextureCoord);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(coords), this.gl.STATIC_DRAW);
            this.gl.vertexAttribPointer(this.programInfo.attribLocations.textureCoord, 2, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);

            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
            this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
            this.gl.uniform1f(this.programInfo.uniformLocations.uTex, 1);
            this.gl.uniform1f(this.programInfo.uniformLocations.isText, 0);
            
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

            this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
            this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        }
    //

    //Coin
        private drawCoin(projectionMatrix: mat4): void {
            const modelViewMatrix = mat4.create();
            const coinFrame = this.currentFrame;

            const position = this.sheetProps.miscProps().spriteProps.coin.position;
            const size = this.sheetProps.miscProps().spriteProps.coin.size;
            const spriteSize = this.sheetProps.miscProps().spriteProps.coin.spriteSize;
            const sheetSize = this.sheetProps.miscProps().spriteSheetSize;

            const hudX = position[0];
            const hudY = position[1] + this.screen['setSize'].h * 0.1;

            mat4.translate(
                modelViewMatrix,
                modelViewMatrix,
                [hudX, hudY, 0]
            );

            const positions = [
                -size[0], -size[1],
                size[0], -size[1],
                -size[0], size[1],
                size[0], size[1],
            ];

            const [spriteX, spriteY] = coinFrame.coords;
            const [spriteWidth, spriteHeight] = spriteSize;
            const [sheetWidth, sheetHeight] = sheetSize;

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
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
            this.gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
            this.gl.uniform1f(this.programInfo.uniformLocations.uTex, 1);
            this.gl.uniform1f(this.programInfo.uniformLocations.isText, 0);
            
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

            this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
            this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4); 
        }
    //

    public async getTex(): Promise<void> {
        try {
            const path = './screens/smb2/assets/sprites/smb2-misc-sprites.png';
            this.texture = await this.screen.loadTexture(this.gl, path);
        } catch(err) {
            console.log(err);
        }
    }

    public update(deltaTime: number) {
        this.animationManager.update(deltaTime);
        this.currentFrame = this.animationManager.getCoinFrame()
    }
}