var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";
import { States } from "./texture-map.interface.js";
import { TextureMap } from "./texture-map.js";
export class Terrain {
    constructor(gl, buffers, programInfo, screen, levelState, sheetProps) {
        this.texture = null;
        this.position = [-2.1, -1.2];
        this.size = [0.1, 0.1];
        this.cols = 35;
        this.numClouds = 8;
        this.scroll = 0.0;
        this.speed = 0.2;
        this.spacing = 50;
        this.clouds = [];
        //Elements
        //Overworld
        //Cloud
        this.cloudLength = 35;
        this.cloudGapX = () => Math.random() * (3 - 1.5) + 1.5;
        this.cloudGapY = () => Math.random() * (0.5 - (-0.5)) + (-0.5);
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;
        this.screen = screen;
        this.levelState = levelState;
        this.currentState = this.levelState.getCurrentState();
        this.sheetProps = sheetProps;
        this.textureMap = new TextureMap();
        this.initCloudVariants();
    }
    glConfig(projectionMatrix, modelViewMatrix, positions, coords) {
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
        this.gl.uniform1f(this.programInfo.uniformLocations.isHud, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isShadowText, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isHudText, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isGround, 1);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    //Ground
    isGroundTuple(coords) {
        return Array.isArray(coords) && coords.length === 2;
    }
    isGroundObj(coords) {
        return !Array.isArray(coords) && 'ground' in coords;
    }
    drawGround(projectionMatrix, type, x, y, lastTexture) {
        if (!type)
            return;
        const modelViewMatrix = mat4.create();
        const groundMap = this.textureMap.ground;
        const map = groundMap[type];
        if (!map)
            return;
        const sheetSize = this.sheetProps.tilesetProps().spriteSheetSize;
        const spriteSize = this.sheetProps.tilesetProps().spriteProps.ground.spriteSize;
        mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, 0]);
        const positions = [
            -this.size[0], -this.size[1],
            this.size[0], -this.size[1],
            -this.size[0], this.size[1],
            this.size[0], this.size[1],
        ];
        let spriteCoords;
        if (this.isGroundTuple(map)) {
            spriteCoords = map;
        }
        else if (this.isGroundObj(map)) {
            spriteCoords = (type === States.Underground && lastTexture)
                ? lastTexture
                : map.ground;
        }
        else {
            spriteCoords = [0, 0];
            throw new Error('err');
        }
        const [spriteX, spriteY] = spriteCoords;
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
        this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
    }
    setTerrain(projectionMatrix) {
        const width = this.size[0] * 1.95;
        const height = this.size[1] * 1.95;
        const lastWidth = width * 0.83;
        const lastHeight = height * 9.25;
        //Overworld
        const cloudCoordsY = height * 2;
        //Underwater
        const waterCoordsY = height * 4.62;
        //Castle
        const castleGroundCoords = this.position[0] * 2.8;
        const lavaCoordsY = height - 1.003;
        const rows = this.currentState === States.Underwater ? 1 :
            this.currentState === States.Castle ? 3 :
                this.currentState === States.Underground ? 3 : 2;
        const startX = this.position[0];
        const startY = this.position[1] + this.screen['setSize'].h * 0.1;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                //Normal X
                const x = this.currentState === States.Castle && i <= 1
                    ? castleGroundCoords + j * width
                    : startX + j * width;
                //Normal Y
                const y = (this.currentState !== States.Castle && this.currentState !== States.Underground)
                    ? startY + i * height
                    : startY + (i <= 1 ? height * i : lastHeight);
                //Last X
                const lx = startX + j * lastWidth;
                //Overworld
                if (this.currentState === States.Overworld)
                    this.setOverworldTerrain(projectionMatrix, x, y, j, i);
                //Underground
                if (this.currentState === States.Underground && i === 2) {
                    const ceilCoords = this.textureMap.ground.underground.ceil;
                    this.drawGround(projectionMatrix, this.currentState, lx, y, ceilCoords);
                }
                else {
                    this.drawGround(projectionMatrix, this.currentState, x, y);
                }
                //Underwater
                if (this.currentState === States.Underwater) {
                    const scroll = x + this.scroll;
                    const wrapped = scroll % (this.cols * width);
                    const finalCoord = 1.1;
                    const finalX = wrapped < startX * finalCoord ? wrapped + (this.cols * width) : wrapped;
                    this.drawWater(projectionMatrix, finalX, waterCoordsY);
                }
                //Lava
                if (this.currentState === States.Castle && i === 0) {
                    const scroll = x + this.scroll;
                    const wrapped = scroll % (this.cols * width);
                    const finalCoord = 1.1;
                    const finalX = wrapped < startX * finalCoord ? wrapped + (this.cols * width) : wrapped;
                    this.drawLava(projectionMatrix, finalX, lavaCoordsY);
                }
            }
        }
    }
    initCloudVariants() {
        for (let i = 0; i < this.cloudLength; i++) {
            this.clouds.push({
                x: this.position[0] + (i * this.cloudGapX()),
                y: (this.size[1] * 2) + this.cloudGapY(),
                speed: Math.random() * 0.05 + 0.05,
                scale: 0.15,
                variant: Math.random() < 0.6 ? 'f' : 's'
            });
        }
    }
    updateClouds(deltaTime) {
        const lScreen = this.position[0];
        for (const cloud of this.clouds) {
            cloud.x -= cloud.speed * deltaTime;
            if (cloud.x + cloud.scale < lScreen) {
                let fCloud = this.clouds[0];
                for (const c of this.clouds) {
                    if (c.x > fCloud.x) {
                        fCloud = c;
                    }
                }
                cloud.x = fCloud.x + this.cloudGapX();
                cloud.y = (this.size[1] * 2) + this.cloudGapY();
                cloud.variant = Math.random() < 0.6 ? 'f' : 's';
            }
        }
    }
    drawClouds(projectionMatrix) {
        const map = this.textureMap.elements.overworld.clouds;
        const sheetSize = this.sheetProps.tilesetProps().spriteSheetSize;
        const baseSize = [0.9, 0.6];
        const spriteSizes = {
            f: [35, 25],
            s: [50, 30]
        };
        for (const c of this.clouds) {
            const modelViewMatrix = mat4.create();
            const scaledWidth = baseSize[0] * c.scale;
            const scaleHeight = baseSize[1] * c.scale;
            mat4.translate(modelViewMatrix, modelViewMatrix, [c.x, c.y, 0]);
            const positions = [
                -scaledWidth, -scaleHeight,
                scaledWidth, -scaleHeight,
                -scaledWidth, scaleHeight,
                scaledWidth, scaleHeight
            ];
            const [spriteX, spriteY] = map[c.variant];
            const [spriteWidth, spriteHeight] = spriteSizes[c.variant];
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
            this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 1);
            this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
            this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 0);
        }
    }
    //
    drawCastle(projectionMatrix, x, y) {
        const modelViewMatrix = mat4.create();
        const size = [0.5, 0.5];
        const map = this.textureMap.elements.overworld.castle;
        const sheetSize = this.sheetProps.tilesetProps().spriteSheetSize;
        const spriteSize = [80, 80];
        const updX = 0.5;
        const updY = 0.79;
        mat4.translate(modelViewMatrix, modelViewMatrix, [x + updX, y + updY, 0]);
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
        this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 1);
        this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
        this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 0);
    }
    drawTrees(projectionMatrix, x, y) {
        const modelViewMatrix = mat4.create();
        const size = [0.5, 0.5];
        const map = this.textureMap.elements.overworld.trees;
        const sheetSize = this.sheetProps.tilesetProps().spriteSheetSize;
        const spriteSize = [80, 80];
        const updX = 0.5;
        const updY = 0.79;
        mat4.translate(modelViewMatrix, modelViewMatrix, [x + updX, y + updY, 0]);
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
        this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 1);
        this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
        this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 0);
    }
    drawMushrooms(projectionMatrix, x, y) {
        const modelViewMatrix = mat4.create();
        const map = this.textureMap.elements.overworld.mushrooms;
        const sheetSize = this.sheetProps.tilesetProps().spriteSheetSize;
        const spriteSize = this.sheetProps.tilesetProps().spriteProps.ground.spriteSize;
        const updX = 1.0;
        const updY = 1.0;
        mat4.translate(modelViewMatrix, modelViewMatrix, [x + updX, y + updY, 0]);
        const positions = [
            -this.size[0], -this.size[1],
            this.size[0], -this.size[1],
            -this.size[0], this.size[1],
            this.size[0], this.size[1],
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
        this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
    }
    //Set
    setOverworldTerrain(projectionMatrix, x, y, j, i) {
        this.drawClouds(projectionMatrix);
        if (i === 0 && j === 0) {
            this.drawCastle(projectionMatrix, x, y);
            //this.drawTrees(projectionMatrix, x, y);
            //this.drawMushrooms(projectionMatrix, x, y);
        }
    }
    //
    //Underwater
    drawWater(projectionMatrix, x, y) {
        const modelViewMatrix = mat4.create();
        const map = this.textureMap.elements.underwater.water;
        const sheetSize = this.sheetProps.tilesetProps().spriteSheetSize;
        const spriteSize = this.sheetProps.tilesetProps().spriteProps.ground.spriteSize;
        mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, 0]);
        const positions = [
            -this.size[0], -this.size[1],
            this.size[0], -this.size[1],
            -this.size[0], this.size[1],
            this.size[0], this.size[1],
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
        this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
    }
    //
    //Castle
    drawLava(projectionMatrix, x, y) {
        const map = this.textureMap.elements.castle.lava;
        const sheetSize = this.sheetProps.tilesetProps().spriteSheetSize;
        const spriteSize = this.sheetProps.tilesetProps().spriteProps.ground.spriteSize;
        const positions = [
            -this.size[0], -this.size[1],
            this.size[0], -this.size[1],
            -this.size[0], this.size[1],
            this.size[0], this.size[1],
        ];
        const topRowY = y + this.size[1];
        const bottomRowY = y;
        const depperRowY = y - this.size[1];
        const z = -0.1;
        const fModelViewMatrix = mat4.create();
        mat4.translate(fModelViewMatrix, fModelViewMatrix, [x, topRowY, z]);
        this.drawLavaFrame(projectionMatrix, fModelViewMatrix, positions, map.f, sheetSize, spriteSize);
        const sModelViewMatrix = mat4.create();
        mat4.translate(sModelViewMatrix, sModelViewMatrix, [x, bottomRowY, z]);
        this.drawLavaFrame(projectionMatrix, sModelViewMatrix, positions, map.s, sheetSize, spriteSize);
        const tModelViewMatrix = mat4.create();
        mat4.translate(tModelViewMatrix, tModelViewMatrix, [x, depperRowY, z]);
        this.drawLavaFrame(projectionMatrix, tModelViewMatrix, positions, map.s, sheetSize, spriteSize);
    }
    drawLavaFrame(projectionMatrix, modelViewMatrix, positions, frameCoords, sheetSize, spriteSize) {
        const [spriteX, spriteY] = frameCoords;
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
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.uniform1f(this.programInfo.uniformLocations.isLava, 1);
        this.glConfig(projectionMatrix, modelViewMatrix, positions, coords);
        this.gl.uniform1f(this.programInfo.uniformLocations.isLava, 0);
    }
    //
    //
    getTex() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const path = './screens/smb2/assets/sprites/smb2-tileset.png';
                this.texture = yield this.screen.loadTexture(this.gl, path);
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    initTerrain(projectionMatrix) {
        this.setTerrain(projectionMatrix);
    }
    updateState() {
        this.currentState = this.levelState.getCurrentState();
    }
    update(deltaTime) {
        const width = this.cols * this.size[0];
        this.scroll -= this.speed * deltaTime;
        this.updateClouds(deltaTime);
        if (this.currentState === States.Underwater) {
            this.scroll -= this.speed * deltaTime;
            const totalWidth = width;
            if (this.scroll <= -totalWidth)
                this.scroll += totalWidth;
        }
        if (this.currentState === States.Castle) {
            this.scroll -= this.speed * deltaTime;
            const totalWidth = width;
            if (this.scroll <= -totalWidth)
                this.scroll += totalWidth;
        }
    }
}
