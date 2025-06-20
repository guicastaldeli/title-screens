//States
export enum States { 
    Overworld = 'overworld',
    Underground = 'underground',
    Castle = 'castle',
    Info = 'info'
}

//Title
interface TitleCoords {
    f: [number, number];
    s: [number, number];
    t: [number, number];
} 

export interface TitleProps {
    groupId: string;
    stars: number;
    coords: TitleCoords;
}

export type TitleMap = TitleProps[];

//Coins
export type CoinCoords = Record<string, [number, number]>;

export interface CoinMap {
    overworld: CoinCoords;
    underground: CoinCoords;
    castle: CoinCoords;
    info: CoinCoords; 
}

//Letters
export type LetterCoords = Record<string, [number, number]>;

export interface LetterMap {
    overworld: LetterCoords;
    underground: LetterCoords;
    castle: LetterCoords;
    info: LetterCoords;
}