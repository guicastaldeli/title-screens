//States
export enum States { 
    Overworld = 'overworld',
    Underground = 'underground',
    Underwater = 'underwater',
    Castle = 'castle',
    Info = 'info'
}

//Letters
export type LetterCoords = Record<string, [number, number]>;

export interface LetterMap {
    overworld: LetterCoords;
    underground: LetterCoords;
    underwater: LetterCoords;
    castle: LetterCoords;
    info: LetterCoords;
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
    underwater: CoinCoords;
    castle: CoinCoords;
    info: CoinCoords; 
}

//Tileset
    //Terrain
        //Ground
        export type GroundCoords = 
            [number, number] |
            {
                ground: [number, number];
                ceil: [number, number]
            }

        export interface GroundMap {
            overworld: GroundCoords;
            underground: {
                ground: GroundCoords;
                ceil: GroundCoords;
            }
            underwater: GroundCoords;
            castle: GroundCoords;
        }

        //Elements
        type SingleCoord = [number, number];
        export type PairedCoords = {
            f: SingleCoord,
            s: SingleCoord
        }

        export type ElementsCoords =
        SingleCoord |
        PairedCoords |
        Record<string, SingleCoord | PairedCoords>;

        export interface CloudParameters {
            finalX: number;
            coordsY: number;
            i: number;
        }

        export interface ElementsMap {
            overworld: {
                clouds: PairedCoords,
                castle: SingleCoord,
                trees: PairedCoords,
                mushrooms: SingleCoord
            }
            underground: {
                pipe: SingleCoord
            }
            underwater: {
                water: SingleCoord
            }
            castle: {
                lava: PairedCoords
            }
        }
    //
//