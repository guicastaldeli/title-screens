import { TextureMap } from "./texture-map.js";
export class Player {
    constructor(gl, buffers, programInfo, screen, levelState, sheetProps) {
        this.texture = null;
        this.position = [-2.1, -1.2];
        this.size = [0.1, 0.1];
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;
        this.screen = screen;
        this.levelState = levelState;
        this.currentState = this.levelState.getCurrentState();
        this.sheetProps = sheetProps;
        this.textureMap = new TextureMap();
    }
    drawPlayer() {
    }
}
