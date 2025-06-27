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
export class Entities {
    get startX() {
        return this.currentState === States.Castle ? this.castleStartX : this.defaultStartX;
    }
    constructor(tick, gl, buffers, programInfo, screen, levelState, sheetProps, points) {
        this.texture = null;
        //Direction
        this.currentY = -0.48;
        this.defaultStartX = 1.8;
        this.castleStartX = 0.5;
        this.startY = -0.61;
        this.endX = -1.0;
        //
        //Entities Animation
        this.walkSpeed = 0.2;
        this.walkDirection = -1;
        this.walkPositionX = this.startX;
        this.walkSpriteToggleTime = 0;
        this.walkSpriteInterval = 500;
        this.useFirstWalkSprite = true;
        this.lastUpdateTime = 0;
        //Koopa Animation
        this.koopaStartY = -0.62;
        this.koopaStartX = 2.3;
        this.koopaEndX = -2.5;
        this.jumpStartTime = 0;
        this.isJumping = false;
        this.gravity = -3.2;
        this.jumpDelay = 3000;
        this.lastJumpTime = 0;
        this.left = true;
        this.jumpPosition = { x: this.koopaStartX, y: this.currentY };
        this.jumpVelocity = { x: -2.5, y: -3.0 };
        this.spriteStateTime = 0;
        this.useStandingprite = true;
        this.isClickable = true;
        this.clickCooldown = 100;
        this.lastClickTime = 0;
        this.tick = tick;
        this.tick.add(this.update.bind(this));
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;
        this.screen = screen;
        this.levelState = levelState;
        this.currentState = this.levelState.getCurrentState();
        this.sheetProps = sheetProps;
        this.textureMap = new TextureMap();
        this.startJump();
        this.lastJumpTime = performance.now();
        this.walkSpriteToggleTime = performance.now();
        this.points = points;
        this.handleClick = this.handleClick.bind(this);
        this.clickHandler = (e) => this.handleClick(e);
        document.addEventListener('click', this.clickHandler);
    }
    drawEntities(projectionMatrix) {
        const modelViewMatrix = mat4.create();
        const sizes = {
            normal: { w: 0.1, h: 0.1 },
            big: { w: 0.1, h: 0.15 }
        };
        const stateEntity = this.textureMap.entity[this.currentState];
        const type = Object.keys(stateEntity)[0];
        const data = stateEntity[type];
        let map;
        if (this.currentState === States.Overworld) {
            if (type === 'koopa')
                map = this.useStandingprite ? data.s : data.f;
        }
        else {
            if (type !== 'koopa')
                map = this.useFirstWalkSprite ? data.f : data.s;
        }
        const entityProps = this.sheetProps.entityProps();
        const sheetSize = entityProps.sheetSize;
        const stateSpriteSizes = entityProps.spriteSize[this.currentState];
        const spriteSize = stateSpriteSizes[type];
        const boxSizeType = stateSpriteSizes.boxSize;
        const currentSize = sizes[boxSizeType];
        let x, y;
        if (this.currentState === States.Overworld) {
            x = this.isJumping ? this.jumpPosition.x : this.koopaStartX;
            y = this.isJumping ? this.jumpPosition.y : this.koopaStartY + currentSize.h;
        }
        else {
            x = this.walkPositionX;
            y = this.startY + currentSize.h;
        }
        mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, -0.5]);
        if (!this.left) {
            mat4.scale(modelViewMatrix, modelViewMatrix, [-1, 1, 1]);
        }
        const positions = [
            -currentSize.w, -currentSize.h,
            currentSize.w, -currentSize.h,
            -currentSize.w, currentSize.h,
            currentSize.w, currentSize.h,
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
        this.gl.uniform1f(this.programInfo.uniformLocations.isGround, 0);
        this.gl.uniform1f(this.programInfo.uniformLocations.needTransp, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isPlayer, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.isCloud, 0);
        const currentStateValue = Number(this.levelState.getStateId());
        this.gl.uniform1f(this.programInfo.uniformLocations.haveState, 1);
        this.gl.uniform1f(this.programInfo.uniformLocations.uState, currentStateValue);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        this.gl.depthFunc(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.LEQUAL);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    getTex() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const path = './screens/smb2/assets/sprites/smb2-enemies-sprites.png';
                this.texture = yield this.screen.loadTexture(this.gl, path);
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    //Entity Animation
    //Other Entities
    updateWalk(deltaTime) {
        const currentTime = performance.now();
        const deltaTimeUpdate = deltaTime / 1000;
        this.walkPositionX += this.walkDirection * this.walkSpeed * deltaTimeUpdate;
        if (this.walkPositionX <= this.endX) {
            this.walkPositionX = this.endX;
            this.walkDirection = 1;
            this.left = false;
        }
        else if (this.walkPositionX >= this.startX) {
            this.walkPositionX = this.startX;
            this.walkDirection = -1;
            this.left = true;
        }
        if (currentTime - this.walkSpriteToggleTime > this.walkSpriteInterval) {
            this.useFirstWalkSprite = !this.useFirstWalkSprite;
            this.walkSpriteToggleTime = currentTime;
        }
    }
    //Koopa
    startJump() {
        this.isJumping = true;
        this.jumpStartTime = performance.now();
        this.lastJumpTime = this.jumpStartTime;
        this.jumpPosition.y = this.currentY;
        if (this.left) {
            this.jumpVelocity = { x: -0.3, y: 1.5 };
        }
        else {
            this.jumpVelocity = { x: 0.3, y: 1.5 };
        }
    }
    updateJump(deltaTime) {
        if (!this.isJumping)
            return;
        const currentTime = performance.now();
        const deltaTimeUpdate = deltaTime / 1000;
        this.jumpPosition.x += this.jumpVelocity.x * deltaTimeUpdate;
        this.jumpPosition.y += this.jumpVelocity.y * deltaTimeUpdate + 0.5 * this.gravity * deltaTimeUpdate * deltaTimeUpdate;
        this.jumpVelocity.y += this.gravity * deltaTimeUpdate;
        if (this.jumpPosition.x <= this.koopaEndX) {
            this.jumpPosition.x = this.koopaEndX;
            this.jumpVelocity.x = Math.abs(this.jumpVelocity.x);
            this.left = false;
        }
        else if (this.jumpPosition.x >= this.koopaStartX) {
            this.jumpPosition.x = this.koopaStartX;
            this.jumpVelocity.x = -Math.abs(this.jumpVelocity.x);
            this.left = true;
        }
        if (this.jumpPosition.y > this.currentY) {
            if (this.useStandingprite) {
                if (this.spriteStateTime === 0)
                    this.spriteStateTime = currentTime;
                if ((currentTime - this.spriteStateTime) > 500)
                    this.useStandingprite = false;
            }
        }
        if (this.jumpPosition.y < this.currentY) {
            this.jumpPosition.y = this.currentY;
            this.isJumping = false;
            this.lastJumpTime = currentTime;
            this.useStandingprite = true;
            this.spriteStateTime = 0;
            this.startJump();
        }
    }
    //
    handleClick(e) {
        const currentTime = performance.now();
        if (currentTime - this.lastClickTime < this.clickCooldown)
            return;
        if (!this.isClickable)
            return;
        this.lastClickTime = currentTime;
        const canvas = this.gl.canvas;
        if (!(canvas instanceof HTMLCanvasElement))
            return;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        let entityX, entityY;
        if (this.currentState === States.Overworld) {
            entityX = this.isJumping ? this.jumpPosition.x : this.koopaStartX;
            entityY = this.isJumping ? this.jumpPosition.y : this.koopaStartY;
        }
        else {
            entityX = this.walkPositionX;
            entityY = this.startY;
        }
        const entityWidth = 1.0;
        const entityHeight = 1.0;
        if (x >= entityX - entityWidth &&
            x <= entityX + entityWidth &&
            y >= entityY - entityHeight &&
            y <= entityY + entityHeight) {
            const point = Math.floor(Math.random() * 200);
            this.points.addScore(point);
            this.points.addCoin();
            this.points.addTime();
            this.screen.hud.setHud();
        }
    }
    initEntity(projectionMatrix) {
        this.drawEntities(projectionMatrix);
    }
    updateState() {
        this.currentState = this.levelState.getCurrentState();
    }
    update(deltaTime) {
        if (deltaTime <= 0 || this.tick.timeScale <= 0)
            return;
        const currentTime = deltaTime * 800;
        if (this.currentState === States.Overworld && this.textureMap.entity[this.currentState].koopa) {
            if (!this.isJumping && (currentTime - this.lastJumpTime) > this.jumpDelay)
                this.startJump();
            if (this.isJumping)
                this.updateJump(currentTime);
        }
        else {
            this.updateWalk(currentTime);
        }
    }
}
