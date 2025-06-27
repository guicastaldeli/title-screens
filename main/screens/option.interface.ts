import { States } from "./smb2/texture-map.interface";

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