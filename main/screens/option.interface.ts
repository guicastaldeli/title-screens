import { ScreenStates } from "../state.js";
import { States } from "./smb2/texture-map.interface.js";

export interface Option {
    text: string;
    position: [number, number];
    color?: [number, number, number, number];
    selected?: boolean,
    hovered?: boolean,
    interactive?: boolean,
    bounds?: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    },
    boundsDk?: {
        x: [number, number],
        y: [number, number]
    }
    type?: States
}

//Preview
    type PreviewCoord = [number, number];

    type BasePreviewMap = {
        [key in ScreenStates]: PreviewCoord;
    }

    export type PreviewMap = BasePreviewMap & {
        shadow: PreviewCoord;
    }
//

//Play-Pause
    export type PlayPauseSingleCoord = [number, number];

    export type PlayPausePairedCoords = {
        play: PlayPauseSingleCoord;
        pause: PlayPauseSingleCoord;
    }

    export type PlayPauseMap = {
        [ScreenStates.Dk]: PlayPausePairedCoords;
        [ScreenStates.Smb]: {
            [key in States]: PlayPausePairedCoords;
        }
    }
//