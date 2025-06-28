import { ScreenStates } from "../state.js";
export class TextureMap {
    constructor() {
        this.screen = this.setScreen();
    }
    setScreen() {
        return {
            [ScreenStates.Dk]: [18, 18],
            [ScreenStates.Smb]: [35, 18],
            shadow: [1.0, 35]
        };
    }
}
