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

type ScreenCoord = [number, number];
type BaseScreenMap = {
    [key in ScreenStates]: ScreenCoord;
}

export type ScreenMap = BaseScreenMap & {
    shadow: ScreenCoord;
}