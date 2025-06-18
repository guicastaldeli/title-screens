import { mat4 } from "../../../node_modules/gl-matrix/esm/index.js";

import { Buffers } from "../../init-buffers.js";
import { ProgramInfo } from "../../main.js";

import { ScreenSmb } from "./main.js";
import { SheetProps } from "./sheet-props.js";

import { Animation } from "./animation.js";
import { FrameData } from "./animation.js";

export class InfoBar {
    private gl: WebGLRenderingContext;

    private buffers: Buffers;
    private programInfo: ProgramInfo;

    private screen: ScreenSmb;
    private sheetProps: SheetProps;
    
    private position: [number, number] = [-0.05, 0.15];
    private size: [number, number] = [1.0, 0.4];

    private animation: Animation;
    private currentFrame: FrameData;

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

        this.animation = new Animation(
            sheetProps,
            sheetProps.titleProps().spriteCoords.map(group => ({
                id: `group-${group.groupId}`,
                coords: group.coords,
                avaliableAnimations: ['flash'],
                stars: group.stars
            }))
        );

        this.currentFrame = this.animation.getCurrentFrame();
    }
}