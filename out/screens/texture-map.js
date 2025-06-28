import { ScreenStates } from "../state.js";
import { States } from "./smb2/texture-map.interface.js";
export class TextureMap {
    constructor() {
        this.preview = this.setPreview();
        this.playPause = this.setPlayPause();
    }
    setPreview() {
        return {
            [ScreenStates.Dk]: [18, 18],
            [ScreenStates.Smb]: [35, 18],
            shadow: [1.0, 35]
        };
    }
    setPlayPause() {
        return {
            [ScreenStates.Dk]: {
                play: [18, 35],
                pause: [0, 35]
            },
            [ScreenStates.Smb]: {
                [States.Overworld]: {
                    play: [1, 18],
                    pause: [0, 0]
                },
                [States.Underground]: {
                    play: [18, 18],
                    pause: [17, 0]
                },
                [States.Underwater]: {
                    play: [1, 18],
                    pause: [0, 0]
                },
                [States.Castle]: {
                    play: [35, 18],
                    pause: [34, 0]
                },
                [States.Info]: {
                    play: [0, 0],
                    pause: [0, 0]
                }
            }
        };
    }
}
