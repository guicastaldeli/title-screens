import { ScreenStates } from "../state.js";
export class TextureMap {
    constructor() {
        this.screen = this.setScreen();
    }
    setScreen() {
        return {
            [ScreenStates.Dk]: [0, 0],
            [ScreenStates.Smb]: [0, 0],
            shadow: [1.0, 35]
        };
    }
}
