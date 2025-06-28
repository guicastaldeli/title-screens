import { ScreenController } from "./controller.js";
export class GlobalActions {
    constructor(gl, buffers, programInfo, screenManager, controller) {
        this.gl = gl;
        this.screenManager = screenManager;
        this.controller = controller;
        this.screenController = new ScreenController(gl, buffers, programInfo, this.screenManager, this.controller);
    }
    initPlayPauseButton() {
    }
    initScreenControllerPreview() {
        this.screenController.initPreview();
    }
}
