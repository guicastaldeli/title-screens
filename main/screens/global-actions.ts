import { Buffers } from "../init-buffers.js";
import { ProgramInfo } from "../main.js";

import { Contoller } from "../controller.js";
import { ScreenManager } from "../screen-manager.js";
import { ScreenController } from "./controller.js";

export class GlobalActions {
    private gl: WebGLRenderingContext;
    private screenManager: ScreenManager;
    private controller: Contoller;

    private screenController: ScreenController;

    constructor(
        gl: WebGLRenderingContext,
        buffers: Buffers,
        programInfo: ProgramInfo,
        screenManager: ScreenManager,
        controller: Contoller
    ) {
        this.gl = gl;
        this.screenManager = screenManager;
        this.controller = controller;

        this.screenController = new ScreenController(gl, buffers, programInfo, this.screenManager, this.controller);
    }

    public initPlayPauseButton(): void {
        
    }

    public initScreenControllerPreview(): void {
        this.screenController.initPreview();
    }
}