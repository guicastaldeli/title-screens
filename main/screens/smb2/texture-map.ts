import { States } from "./texture-map.interface.js";
import { TitleMap } from "./texture-map.interface.js";
import { CoinCoords } from "./texture-map.interface.js";
import { CoinMap } from "./texture-map.interface.js";
import { LetterCoords } from "./texture-map.interface.js";
import { LetterMap } from "./texture-map.interface.js";
import { GroundCoords } from "./texture-map.interface.js";
import { GroundMap } from "./texture-map.interface.js";
import { ElementsCoords } from "./texture-map.interface.js";
import { ElementsMap } from "./texture-map.interface.js";
import { PlayerCoords } from "./texture-map.interface.js";
import { PlayerMap } from "./texture-map.interface.js";
import { EntityCoord } from "./texture-map.interface.js";
import { EntityMap } from "./texture-map.interface.js";
import { LevelStateMap } from "./texture-map.interface.js";

export class TextureMap {
    public title: TitleMap;
    public coins: CoinMap;
    public letters: LetterMap;
    public ground: GroundMap;
    public elements: ElementsMap;
    public player: PlayerMap;
    public entity: EntityMap;
    public levelState: LevelStateMap;

    constructor() {
        this.letters = this.setLetters();

        //Title
        this.title = this.setTitle();
        this.coins = this.setCoins();

        //Terrain
        this.ground = this.setGround();
        this.elements = this.setElements();

        //Player
        this.player = this.setPlayer();

        //Entity
        this.entity = this.setEntity();

        //Level State
        this.levelState = this.setLevelState();
    }

    private setLetters(): LetterMap {
        const overworld: LetterCoords = {
            " ": [373.05, 53],
            "0": [264, 8],
            "1": [273, 8],
            "2": [282.1, 8],
            "3": [291.05, 8],
            "4": [300.05, 8],
            "5": [309.05, 8],
            "6": [318.1, 8],
            "7": [327, 8],
            "8": [336.05, 8],
            "9": [345.1, 8],
            "A": [354.1, 8],
            "B": [363, 8],
            "C": [372.05, 8],
            "D": [381.05, 8],
            "E": [390.1, 8],
            "F": [399.1, 8],
            "G": [264, 17],
            "H": [273, 17],
            "I": [282.05, 17],
            "J": [291.1, 17],
            "K": [300.1, 17],
            "L": [309.05, 17],
            "M": [318.1, 17],
            "N": [327, 17],
            "O": [336.05, 17],
            "P": [345.1, 17],
            "Q": [354.1, 17],
            "R": [363, 17],
            "S": [372, 17],
            "T": [381.05, 17],
            "U": [390.1, 17],
            "V": [399.1, 17],
            "W": [264.05, 26],
            "X": [273, 26],
            "Y": [282.05, 26],
            "Z": [291.1, 26],
            "-": [300, 26],
            "x": [309.05, 26],
            "!": [318.1, 26],
            ".": [327.05, 26],
            "©": [336.05, 26],
            ",": [354.1, 26],
            "+": [372.1, 26],
        }
        const underground: LetterCoords = {
            " ": [373.05, 53],
            "0": [408.05, 8],
            "1": [417.05, 8],
            "2": [426.1, 8],
            "3": [435.1, 8],
            "4": [444.05, 8],
            "5": [453.1, 8],
            "6": [462.1, 8],
            "7": [471.08, 8],
            "8": [480.05, 8],
            "9": [489.1, 8],
            "A": [498.1, 8],
            "B": [507.1, 8],
            "C": [516.05, 8],
            "D": [525.1, 8],
            "E": [534.1, 8],
            "F": [543.1, 8],
            "G": [408.05, 17],
            "H": [417.05, 17],
            "I": [426.1, 17],
            "J": [435.1, 17],
            "K": [444.05, 17],
            "L": [453.1, 17],
            "M": [462.1, 17],
            "N": [471.08, 17],
            "O": [480.05, 17],
            "P": [489.1, 17],
            "Q": [498.1, 17],
            "R": [507.1, 17],
            "S": [516.05, 17],
            "T": [525.1, 17],
            "U": [534.1, 17],
            "V": [543.1, 17],
            "W": [408.05, 26],
            "X": [417.1, 26],
            "Y": [426.1, 26],
            "Z": [435.1, 26],
            "-": [444.08, 26],
            "x": [453.1, 26],
            "!": [462.1, 26],
            ".": [471.05, 26],
            "©": [480.05, 26],
            ",": [489.075, 26],
            "+": [515, 26],
        }
        const underwater: LetterCoords = {
            " ": [373.05, 53],
            "0": [264, 8],
            "1": [273, 8],
            "2": [282.1, 8],
            "3": [291.05, 8],
            "4": [300.05, 8],
            "5": [309.05, 8],
            "6": [318.1, 8],
            "7": [327, 8],
            "8": [336.05, 8],
            "9": [345.1, 8],
            "A": [354.1, 8],
            "B": [363, 8],
            "C": [372.05, 8],
            "D": [381.05, 8],
            "E": [390.1, 8],
            "F": [399.1, 8],
            "G": [264, 17],
            "H": [273, 17],
            "I": [282.05, 17],
            "J": [291.1, 17],
            "K": [300.1, 17],
            "L": [309.05, 17],
            "M": [318.1, 17],
            "N": [327, 17],
            "O": [336.05, 17],
            "P": [345.1, 17],
            "Q": [354.1, 17],
            "R": [363, 17],
            "S": [372, 17],
            "T": [381.05, 17],
            "U": [390.1, 17],
            "V": [399.1, 17],
            "W": [264.05, 26],
            "X": [273, 26],
            "Y": [282.05, 26],
            "Z": [291.1, 26],
            "-": [300, 26],
            "x": [309.05, 26],
            "!": [318.1, 26],
            ".": [327.05, 26],
            "©": [336.05, 26],
            ",": [354.1, 26],
            "+": [372.1, 26],
        }
        const castle: LetterCoords = {
            " ": [373.05, 53],
            "0": [408.05, 35],
            "1": [417.05, 35],
            "2": [426.1, 35],
            "3": [435.1, 35],
            "4": [444.1, 35],
            "5": [453.1, 35],
            "6": [462.1, 35],
            "7": [471.05, 35],
            "8": [480.1, 35],
            "9": [489.1, 35],
            "A": [498.1, 35],
            "B": [507.1, 35],
            "C": [516.1, 35],
            "D": [525.1, 35],
            "E": [534.1, 35],
            "F": [543.1, 35],
            "G": [408.05, 44],
            "H": [417.05, 44],
            "I": [426.1, 44],
            "J": [435.1, 44],
            "K": [444.05, 44],
            "L": [453.1, 44],
            "M": [462.1, 44],
            "N": [471.08, 44],
            "O": [480.05, 44],
            "P": [489.1, 44],
            "Q": [498.1, 44],
            "R": [507.1, 44],
            "S": [516.05, 44],
            "T": [525.1, 44],
            "U": [534.1, 44],
            "V": [543.1, 44],
            "W": [408.05, 53],
            "X": [417.1, 53],
            "Y": [426.1, 53],
            "Z": [435.1, 53],
            "-": [444.08, 53],
            "x": [453.1, 53],
            "!": [462.1, 53],
            ".": [471.05, 53],
            "©": [480.05, 53],
            ",": [489.075, 53],
            "+": [515, 53],
        }
        const info: LetterCoords = {
            " ": [373.05, 53],
            "0": [264, 35],
            "1": [273, 35],
            "2": [282.1, 35],
            "3": [291, 35],
            "4": [300, 35],
            "5": [309.05, 35],
            "6": [318.1, 35],
            "7": [327, 35],
            "8": [336.1, 35],
            "9": [345.1, 35],
            "A": [354.1, 35],
            "B": [363, 35],
            "C": [372.1, 35],
            "D": [381.05, 35],
            "E": [390.1, 35],
            "F": [399.1, 35],
            "G": [264, 44],
            "H": [273, 44],
            "I": [282.05, 44],
            "J": [291.1, 44],
            "K": [300.1, 44],
            "L": [309.05, 44],
            "M": [318.1, 44],
            "N": [327, 44],
            "O": [336.05, 44],
            "P": [345.1, 44],
            "Q": [354.1, 44],
            "R": [363, 44],
            "S": [372.1, 44],
            "T": [381.05, 44],
            "U": [390.1, 44],
            "V": [399.1, 44],
            "W": [264.05, 53],
            "X": [273, 53],
            "Y": [282.05, 53],
            "Z": [291.1, 53],
            "-": [300, 53],
            "x": [309.05, 53],
            "!": [318.1, 53],
            ".": [327.05, 53],
            "©": [336.05, 53],
            ",": [354.1, 53],
        }

        return {
            overworld,
            underground,
            underwater,
            castle,
            info,
        }
    }

    private setTitle(): TitleMap {
        return [
            {
                groupId: 'group-0',
                stars: 0,
                coords: {
                    f: [0, 0],
                    s: [0, 88],
                    t: [0, 176]
                }
            },
            {
                groupId: 'group-1',
                stars: 1,
                coords: {
                    f: [200, 0],
                    s: [200, 88],
                    t: [200, 176]
                }
            },
            {
                groupId: 'group-2',
                stars: 2,
                coords: {
                    f: [400, 0],
                    s: [400, 88],
                    t: [400, 176]
                }
            },
            {
                groupId: 'group-3',
                stars: 3,
                coords: {
                    f: [600, 0],
                    s: [600, 88],
                    t: [600, 176]
                }
            },
            {
                groupId: 'group-4',
                stars: 4,
                coords: {
                    f: [800, 0],
                    s: [800, 88],
                    t: [800, 176]
                }
            },
            {
                groupId: 'group-5',
                stars: 5,
                coords: {
                    f: [1000, 0],
                    s: [1000, 88],
                    t: [1000, 176]
                }
            },
            {
                groupId: 'group-6',
                stars: 6,
                coords: {
                    f: [1200, 0],
                    s: [1200, 88],
                    t: [1200, 176]
                }
            },
            {
                groupId: 'group-7',
                stars: 7,
                coords: {
                    f: [1400, 0],
                    s: [1400, 88],
                    t: [1400, 176]
                }
            },
            {
                groupId: 'group-8',
                stars: 8,
                coords: {
                    f: [1600, 0],
                    s: [1600, 88],
                    t: [1600, 176]
                }
            },
            {
                groupId: 'group-9',
                stars: 9,
                coords: {
                    f: [1800, 0],
                    s: [1800, 88],
                    t: [1800, 176]
                }
            },
            {
                groupId: 'group-10',
                stars: 10,
                coords: {
                    f: [2000, 0],
                    s: [2000, 88],
                    t: [2000, 176]
                }
            },
            {
                groupId: 'group-11',
                stars: 11,
                coords: {
                    f: [2200, 0],
                    s: [2200, 88],
                    t: [2200, 176]
                }
            },
            {
                groupId: 'group-12',
                stars: 12,
                coords: {
                    f: [2400, 0],
                    s: [2400, 88],
                    t: [2400, 176]
                }
            },
            {
                groupId: 'group-13',
                stars: 13,
                coords: {
                    f: [0, 264],
                    s: [0, 352],
                    t: [0, 440]
                }
            },
            {
                groupId: 'group-14',
                stars: 14,
                coords: {
                    f: [200, 264],
                    s: [200, 352],
                    t: [200, 440]
                }
            },
            {
                groupId: 'group-15',
                stars: 15,
                coords: {
                    f: [400, 264],
                    s: [400, 352],
                    t: [400, 440]
                }
            },
            {
                groupId: 'group-16',
                stars: 16,
                coords: {
                    f: [600, 264],
                    s: [600, 352],
                    t: [600, 440]
                }
            },
            {
                groupId: 'group-17',
                stars: 17,
                coords: {
                    f: [800, 264],
                    s: [800, 352],
                    t: [800, 440]
                }
            },
            {
                groupId: 'group-18',
                stars: 18,
                coords: {
                    f: [1000, 264],
                    s: [1000, 352],
                    t: [1000, 440]
                }
            },
            {
                groupId: 'group-19',
                stars: 19,
                coords: {
                    f: [1200, 264],
                    s: [1200, 352],
                    t: [1200, 440]
                }
            },
            {
                groupId: 'group-20',
                stars: 20,
                coords: {
                    f: [1400, 264],
                    s: [1400, 352],
                    t: [1400, 440]
                }
            },
            {
                groupId: 'group-21',
                stars: 21,
                coords: {
                    f: [1600, 264],
                    s: [1600, 352],
                    t: [1600, 440]
                }
            },
            {
                groupId: 'group-22',
                stars: 22,
                coords: {
                    f: [1800, 264],
                    s: [1800, 352],
                    t: [1800, 440]
                }
            },
            {
                groupId: 'group-23',
                stars: 23,
                coords: {
                    f: [2000, 264],
                    s: [2000, 352],
                    t: [2000, 440]
                }
            },
            {
                groupId: 'group-24',
                stars: 24,
                coords: {
                    f: [2200, 264],
                    s: [2200, 352],
                    t: [2200, 440]
                }
            }
        ];
    }

    private setCoins(): CoinMap {
        return {
            overworld: {
                f: [264.1, 76.05],
                s: [274.1, 76.05],
                t: [284.1, 76.05],
            },
            underground: {
                f: [264.1, 92.05],
                s: [274.1, 92.05],
                t: [284.1, 92.05],
            },
            underwater: {
                f: [344.1, 92.05],
                s: [344.1, 92.05],
                t: [344.1, 92.05],
            },
            castle: {
                f: [344.1, 76.05],
                s: [344.1, 76.05],
                t: [344.1, 76.05],
            },
            info: {
                f: [0, 0],
                s: [0, 0],
                t: [0, 0],
            }
        }
    }

    //Terrain
    private setGround(): GroundMap {
        const overworld: GroundCoords = [0, 16];
        const underground: GroundCoords = {
            ground: [147, 16],
            ceil: [167, 15.9],
        }
        const underwater: GroundCoords = [147, 99.9];
        const castle: GroundCoords = [17, 99.9];

        return {
            overworld,
            underground,
            underwater,
            castle
        }
    }

    private setElements(): ElementsMap {
        const overworld: ElementsCoords = {
            clouds: {
                f: [350, 628.18],
                s: [624, 596.18]
            },
            castle: [24.05, 683.1],
            trees: {
                f: [264.2, 644.2],
                s: [288.2, 628.1]
            },
            mushrooms: [112, 588]
        }
        const underground: ElementsCoords = {
            pipe: [152, 612]
        }
        const underwater: ElementsCoords = {
            water: [637, 15.9]
        }
        const castle: ElementsCoords = {
            lava: {
                f: [200, 476],
                s: [540, 33],
            }
        }

        return {
            overworld,
            underground,
            underwater,
            castle
        } as ElementsMap
    }

    //Player
    private setPlayer(): PlayerMap {
        const player: PlayerCoords = {
            //Mario
            mario: {
                small: {
                    normal: [0, 8],
                    swim: {
                        f: [192, 8],
                        s: [228, 8]
                    }
                },
                big: {
                    normal: [0, 32],
                    swim: {
                        f: [192.1, 31],
                        s: [228.1, 31]
                    }
                }
            },
            //Luigi
            luigi: {
                small: {
                    normal: [288, 8],
                    swim: {
                        f: [462, 8],
                        s: [516, 8]
                    }
                },
                big: {
                    normal: [288, 32],
                    swim: {
                        f: [462.1, 31],
                        s: [516, 31]
                    }
                }
            }
        }

        return { player };
    }
    
    //Entities
    private setEntity(): EntityMap {
        return {
            [States.Overworld]: {
                koopa: {
                    f: [36, 113],
                    s: [53.9, 112]
                }
            },
            [States.Underground]: {
                goomba: {
                    f: [74, 16],
                    s: [92, 16]
                }
            },
            [States.Underwater]: {
                cheep: {
                    f: [292, 164],
                    s: [310, 164]
                }
            },
            [States.Castle]: {
                buzzy: {
                    f: [148, 34],
                    s: [166, 34]
                }
            },
            [States.Info]: {}
        }
    }

    //Level State
    private setLevelState(): LevelStateMap {
        return {
            [States.Overworld]: [18.0, 1.1],
            [States.Underground]: [35.0, 1.1],
            [States.Underwater]: [1.1, 18.0],
            [States.Castle]: [1.0, 1.1],
            [States.Info]: [0, 0],
            shadow: [1.0, 35]
        }
    }
}