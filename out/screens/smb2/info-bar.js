import { Animation } from "./animation.js";
export class InfoBar {
    constructor(gl, buffers, programInfo, screen, sheetProps) {
        this.position = [-0.05, 0.15];
        this.size = [1.0, 0.4];
        this.gl = gl;
        this.buffers = buffers;
        this.programInfo = programInfo;
        this.screen = screen;
        this.sheetProps = sheetProps;
        this.animation = new Animation(sheetProps, sheetProps.titleProps().spriteCoords.map(group => ({
            id: `group-${group.groupId}`,
            coords: group.coords,
            avaliableAnimations: ['flash'],
            stars: group.stars
        })));
        this.currentFrame = this.animation.getCurrentFrame();
    }
}
