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
export type CoinCoords = {
    f: [number, number];
    s: [number, number];
    t: [number, number];
}

export type CoinMap = {
    [key in States]: CoinCoords;
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
        type GroundSingleCoord = [number, number];
        export type GroundPairedCoords = {
            f: GroundSingleCoord,
            s: GroundSingleCoord
        }

        export type ElementsCoords =
        GroundSingleCoord |
        GroundPairedCoords |
        Record<string, GroundSingleCoord | GroundPairedCoords>;

        export interface CloudParameters {
            finalX: number;
            coordsY: number;
            i: number;
        }

        export interface ElementsMap {
            overworld: {
                clouds: GroundPairedCoords,
                castle: GroundSingleCoord,
                trees: GroundPairedCoords,
                mushrooms: GroundSingleCoord
            }
            underground: {
                pipe: GroundSingleCoord
            }
            underwater: {
                water: GroundSingleCoord
            }
            castle: {
                lava: GroundPairedCoords
            }
        }
    //

//

//Player
type PlayerSingleCoord = [number, number];

type PlayerPairedCoords = {
    normal: PlayerSingleCoord;
    swim: {
        f: PlayerSingleCoord;
        s: PlayerSingleCoord;
    }
}

type CharCoords = {
    small: PlayerPairedCoords;
    big: PlayerPairedCoords;
}

export type PlayerCoords = {
    mario: CharCoords;
    luigi: CharCoords;
}

export interface PlayerMap {
    player: PlayerCoords;
}

//Entities
type EntitiesSingleCoord = [number, number];

export type EntityCoord = {
    f: EntitiesSingleCoord;
    s: EntitiesSingleCoord;
}

export type EntityMap = {
    [key in States]: Record<string, EntityCoord>;
}

//Level State
type LevelStateCoord = [number, number];
type BaseLevelStateMap = {
    [key in States]: LevelStateCoord;
}

export type LevelStateMap = BaseLevelStateMap & {
    shadow: LevelStateCoord;
}