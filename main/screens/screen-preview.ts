import { mat4 } from "../../node_modules/gl-matrix/esm/index.js";

import { Buffers } from "../init-buffers.js";
import { ProgramInfo } from "../main.js";
import { TextureMap } from "./texture-map.js";
import { ScreenManager } from "../screen-manager.js";
import { Contoller } from "../controller.js";
import { GlobalActions } from "./global-actions.js";

export class ScreenPreview {
    private gl: WebGLRenderingContext;
    private buffers: Buffers;
    private programInfo: ProgramInfo;
    private screenManager: ScreenManager;
    private controller: Contoller;
    private globalActions: GlobalActions;

    public texture: WebGLTexture | null = null
    private textureMap: TextureMap;

    private isHovered: boolean = false;
    private hoverProgress: number = 0;
    private lastHoverTime: number = 0;

    constructor(
        gl: WebGLRenderingContext,
        buffers: Buffers,
        programInfo: ProgramInfo,
        screenManager: ScreenManager,
        controller: Contoller,
        globalActions: GlobalActions
    ) {
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;
        this.screenManager = screenManager;
        this.controller = controller;
        this.globalActions = globalActions;
        this.textureMap = new TextureMap();
    }

    public drawPreview(projectionMatrix: mat4): void {
        this.drawPreviewElement(projectionMatrix, this.textureMap.preview.shadow, 0.9, true);
        this.drawPreviewElement(projectionMatrix, this.textureMap.preview[this.screenManager.currentScreen()], 1.0, false);
    }
    
    private drawPreviewElement(
        projectionMatrix: mat4,
        map: [number, number],
        z: number,
        isShadow: boolean
    ): void {
        const modelViewMatrix = mat4.create();
    
        const sheetSize = [52, 52];
        const spriteSize = [16, 16];
        const size = [0.1, 0.2];
    
        const x = isShadow ? 0.835 : 0.85;
        const y = isShadow ? 0.71 : 0.74;
    
        mat4.translate(
            modelViewMatrix,
            modelViewMatrix,
            [x, y, -0.9]
        );
    
        const positions = [
            -size[0], -size[1],
            size[0], -size[1],
            -size[0], size[1],
            size[0], size[1],
        ];
    
        const [spriteX, spriteY] = map;
        const [sheetWidth, sheetHeight] = sheetSize;
        const [spriteWidth, spriteHeight] = spriteSize;
    
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
    
        const now = performance.now();
        const deltaTime = (now - this.lastHoverTime) / 1000;
        const hoverSpeed = 10.0;
    
        if(this.isHovered) {
            this.hoverProgress = Math.min(1, this.hoverProgress + deltaTime * hoverSpeed);
        } else {
            this.hoverProgress = Math.max(0, this.hoverProgress - deltaTime * hoverSpeed);
        }
    
        this.lastHoverTime = now;
        
        this.gl.uniform1f(this.programInfo.uniformLocations.isShadow, isShadow ? 1 : 0);
        this.gl.uniform1i(this.programInfo.uniformLocations.isHovered, this.isHovered ? 1 : 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.hoverProgress, this.hoverProgress);
        this.gl.uniform1f(this.programInfo.uniformLocations.previewTransp, 1);
        this.globalActions.glConfig(projectionMatrix, modelViewMatrix, positions, coords, this.texture);
        this.gl.uniform1f(this.programInfo.uniformLocations.previewTransp, 0);
    }
    
    private setHoverState(hovered: boolean): void {
        this.isHovered = hovered;
        this.lastHoverTime = performance.now();
    }

    public setupInput(): void {
        const canvas = <HTMLCanvasElement>(this.gl.canvas);

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const glX = (x / canvas.width) * 2 - 1;
            const glY = (y / canvas.height) * 2;

            const previewX = 0.83;
            const previewY = 0.25;
            const previewWidth = 0.4;
            const previewHeight = 0.4;

            this.isHovered =
            glX >= previewX - previewWidth / 2 && 
            glX <= previewX + previewWidth / 2 &&
            glY >= previewY - previewHeight &&
            glY <= previewY + previewHeight;

            this.setHoverState(this.isHovered);
        });

        canvas.addEventListener('click', () => {
            if(this.isHovered && this.controller) {
                this.controller.toggleScreen();
            }
        });

        canvas.addEventListener('mouseleave', () => {
            this.setHoverState(false);
            this.isHovered = false;
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === '1' && this.controller) {
                this.controller.toggleScreen();
            }
        })
    }

    private async getTex(): Promise<void> {
        try {
            const path = './assets/sprites/level-tile.png';
            this.texture = await this.globalActions.loadTexture(this.gl, path);
        } catch(err) {
            console.log(err);
        }
    }
    
    public async initPreview(): Promise<void> {
        const projectionMatrix = mat4.create();

        this.drawPreview(projectionMatrix);
        await this.getTex();
        this.setupInput();
    }
}