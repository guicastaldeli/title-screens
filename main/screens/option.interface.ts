export interface Option {
    text: string;
    position: [number, number];
    color?: [number, number, number, number];
    selected?: boolean,
    bounds: {
        x: [number, number],
        y: [number, number]
    }
}