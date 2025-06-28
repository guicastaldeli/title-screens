import { ScreenMap } from "./option.interface.js";
import { ScreenStates } from "../state.js";

export class TextureMap {
    public screen: ScreenMap;

    constructor() {
        this.screen = this.setScreen();
    }

    private setScreen(): ScreenMap {
        return {
            [ScreenStates.Dk]: [0, 0],
            [ScreenStates.Smb]: [0, 0],
            shadow: [1.0, 35]
        }
    }
}