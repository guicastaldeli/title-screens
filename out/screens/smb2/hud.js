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
import { AnimationManager } from "./animation-manager.js";
import { TextureMap } from "./texture-map.js";
import { States } from "./texture-map.interface.js";
export class Hud {
    constructor(tick, gl, buffers, programInfo, screen, levelState, sheetProps, points) {
        this.texture = null;
        this.hudProps = [];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.containerPosition = [-0.075, -0.15];
        this.tick = tick;
        this.tick.add(this.update.bind(this));
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;
        this.screen = screen;
        this.levelState = levelState;
        this.currentState = this.levelState.getCurrentState();
        this.sheetProps = sheetProps;
        this.points = points;
        this.points.addListener(() => this.setHud());
        this.textureMap = new TextureMap();
        this.color = this.screen.parseColor('rgb(255, 255, 255)');
        this.updateCoin(this.tick);
    }
    //Hud
    drawHud(projectionMatrix) {
        this.setHud();
        const modelViewMatrix = mat4.create();
        const position = this.sheetProps.miscProps().spriteProps.hud.position;
        const size = this.sheetProps.miscProps().spriteProps.hud.size;
        const spriteCoords = this.sheetProps.miscProps().spriteProps.hud.coords;
        const spriteSize = this.sheetProps.miscProps().spriteProps.hud.spriteSize;
        const sheetSize = this.sheetProps.miscProps().spriteSheetSize;
        const hudX = position[0] + this.containerPosition[0];
        const hudY = position[1] + this.screen['setSize'].h * 0.1;
        mat4.translate(modelViewMatrix, modelViewMatrix, [hudX, hudY, 0]);
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
        this.gl.uniform1f(this.programInfo.uniformLocations.isHud, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isShadowText, 0);
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
    drawHudProps(projectionMatrix, text, x, y, type) {
        const letters = text.split('');
        const spacing = 0.08;
        const startX = x - ((letters.length * spacing) / 2);
        const textStartX = x;
        const textEndX = startX + (letters.length * spacing);
        letters.forEach((l, i) => {
            const letterX = startX + (i * spacing);
            this.drawLetter(projectionMatrix, l, letterX, y, textStartX, textEndX, type);
        });
    }
    setHud() {
        const worldId = this.setWorld();
        const score = this.points.getScore();
        const coins = this.points.getCoins();
        const time = this.points.getTime();
        this.hudProps = [
            //Player
            this.createHudProps('MARIO', -0.72, 1.09, this.currentState),
            this.createHudProps(score, -0.68, 1.014, this.currentState),
            //Coin
            this.createHudProps('x', -0.16, 1.014, this.currentState),
            this.createHudProps(coins, -0.04, 1.014, this.currentState),
            //World
            this.createHudProps('WORLD', 0.48, 1.09, this.currentState),
            this.createHudProps(worldId, 0.48, 1.01, this.currentState),
            //Time
            this.createHudProps('TIME', 1.0, 1.09, this.currentState),
            this.createHudProps(time, 1.04, 1.01, this.currentState),
            //Copyright
            this.createHudProps('©1986 NINTENDO', 0.55, 0.13, States.Info)
        ];
    }
    createHudProps(text, x, y, type) {
        return {
            text,
            position: [x, y],
            color: this.color,
            type
        };
    }
    initHudProps(projectionMatrix) {
        const originalContainerPosition = [...this.containerPosition];
        this.hudProps.forEach(props => {
            const x = originalContainerPosition[0] + props.position[0];
            const y = originalContainerPosition[1] + props.position[1];
            this.drawHudProps(projectionMatrix, props.text, x, y, props.type);
        });
    }
    setWorld() {
        const id = {
            overworld: '1-1',
            underground: '1-2',
            underwater: '3-2',
            castle: '8-4'
        };
        const worlds = {
            [States.Overworld]: id.overworld,
            [States.Underground]: id.underground,
            [States.Underwater]: id.underwater,
            [States.Castle]: id.castle
        };
        const worldId = worlds[this.currentState] || worlds[States.Overworld];
        return worldId;
    }
    drawLetter(projectionMatrix, letter, x, y, textStartX, textEndX, type) {
        if (!type)
            return;
        const modelViewMatrix = mat4.create();
        const size = [0.04, 0.04];
        const map = this.textureMap.letters;
        mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, 0.85]);
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
        this.gl.uniform1f(this.programInfo.uniformLocations.isHudText, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isShadowText, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isSelected, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isPlayer, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isCloud, 0);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    //
    //Coin
    drawCoin(projectionMatrix) {
        const modelViewMatrix = mat4.create();
        const coinFrame = this.currentFrame;
        const position = this.sheetProps.miscProps().spriteProps.coin.position;
        const size = this.sheetProps.miscProps().spriteProps.coin.size;
        const spriteSize = this.sheetProps.miscProps().spriteProps.coin.spriteSize;
        const sheetSize = this.sheetProps.miscProps().spriteSheetSize;
        const hudX = position[0] + this.containerPosition[0];
        const hudY = position[1] + this.screen['setSize'].h * 0.1 + this.containerPosition[1];
        mat4.translate(modelViewMatrix, modelViewMatrix, [hudX, hudY, 0.85]);
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
        this.gl.uniform1f(this.programInfo.uniformLocations.isHud, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.isShadowText, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 1);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    updateCoin(tick) {
        const map = this.textureMap.coins;
        const coords = map[this.currentState] || map[States.Overworld];
        this.animationManager = new AnimationManager(tick, this.sheetProps, [], [{
                id: `coin-${this.currentState}`,
                stars: 0,
                coords: coords,
                availableAnimations: ['flash']
            }]);
        this.currentFrame = this.animationManager.getCoinFrame();
    }
    //
    getTex() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const path = './screens/smb2/assets/sprites/smb2-misc-sprites.png';
                this.texture = yield this.screen.loadTexture(this.gl, path);
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    updateState() {
        this.currentState = this.levelState.getCurrentState();
        this.setHud();
        this.updateCoin(this.tick);
    }
    update(deltaTime) {
        var _a, _b;
        (_a = this.animationManager) === null || _a === void 0 ? void 0 : _a.update(deltaTime);
        this.currentFrame = (_b = this.animationManager) === null || _b === void 0 ? void 0 : _b.getCoinFrame();
    }
}
