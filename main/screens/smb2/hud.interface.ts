import { States } from "./texture-map.interface";

export interface HudProps {
    text: string;
    position: [number, number];
    color: [number, number, number, number];
    type?: States;
}