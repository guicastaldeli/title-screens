import { TextureMap } from "./texture-map.js";
import { States, TitleMap } from "./texture-map.interface.js";

interface MiscProps {
    spriteSheetSize: [number, number];
    spriteProps: {
        letter: {
            spriteSize: [number, number] 
        },
        hud: {
            position: [number, number];
            coords: [number, number]; 
            size: [number, number]; 
            spriteSize: [number, number] 
        },
        coin: {
            position: [number, number]
            size: [number, number]; 
            spriteSize: [number, number] 
            coords: Record<string, [number, number]>
        }
    };
}

interface TilesetProps {
    spriteSheetSize: [number, number];
    spriteProps: {
        ground: {
            spriteSize: [number, number] 
        }
    };
}

interface TitleProps {
    sheetSize: [number, number];
    size: [number, number];
    coords: TitleMap;
}

interface PlayerProps {
    sheetSize: [number, number];
    spriteSize: {
        player: {
            mario: {
                small: [number, number];
                big: [number, number];
            },
            luigi: {
                small: [number, number];
                big: [number, number];
            }
        }
    }
}

interface EntityProps {
    sheetSize: [number, number];
    spriteSize: {
        [States.Overworld]: {
            koopa: [number, number];
            boxSize: string;
        },
        [States.Underground]: {
            goomba: [number, number];
            boxSize: string;
        },
        [States.Underwater]: {
            cheep: [number, number];
            boxSize: string;
        },
        [States.Castle]: {
            buzzy: [number, number];
            boxSize: string;
        }
    }
}

interface LevelStateProps {
    sheetSize: [number, number];
    spriteSize: [number, number]
}

export class SheetProps {
    private map: TextureMap;

    constructor() {
        this.map = new TextureMap();
        
        this.tilesetProps();
        this.miscProps();
        this.titleProps();
        this.playersetProps();
        this.entityProps();
        this.levelStateProps();
    }

    //Tileset
    public tilesetProps(): TilesetProps {
        const spriteSheetSize: [number, number] = [680, 764];
        const spriteProps: {
            ground: {
                spriteSize: [number, number]
            }
        } = {
            ground: {
                spriteSize: [16, 16]
            }
        }

        return {
            spriteSheetSize,
            spriteProps
        }
    }

    //Misc
    public miscProps(): MiscProps {
        const spriteSheetSize: [number, number] = [1172, 884];
        const spriteProps: {
            letter: {
                spriteSize: [number, number] 
            },
            hud: {
                position: [number, number];
                coords: [number, number]; 
                size: [number, number]; 
                spriteSize: [number, number] 
            },
            coin: {
                position: [number, number]
                size: [number, number]; 
                spriteSize: [number, number] 
                coords: Record<string, [number, number]>
            }
        } = {
            letter: {
                spriteSize: [7.85, 7.9]
            },
            hud: {
                position: [0, 0.61],
                coords: [-10, 22.8],
                size: [1.3, 0.08],
                spriteSize: [260, 17]
            },
            coin: {
                position: [-0.28, 0.715],
                size: [0.04, 0.038],
                spriteSize: [7, 7],
                coords: this.map.coins.overworld
            }
        }

        return {
            spriteSheetSize,
            spriteProps
        }
    }

    //Title
    public titleProps(): TitleProps {
        const sheetSize: [number, number] = [2599.9, 528];
        const size: [number, number] = [199.8, 87.83];
        const coords = this.map.title;

        return {
            sheetSize,
            size,
            coords: coords
        }
    }

    //Playerset
    public playersetProps(): PlayerProps {
        const sheetSize: [number, number] = [584, 468];
        const spriteSize: {
            player: {
                mario: {
                    small: [number, number],
                    big: [number, number]
                },
                luigi: {
                    small: [number, number],
                    big: [number, number]
                }
            }
        } = {
            player: {
                mario: {
                    small: [16, 16],
                    big: [16, 32],
                },
                luigi: {
                    small: [16, 16],
                    big: [16, 32],
                }
            }
        }

        return {
            sheetSize,
            spriteSize
        }
    }

    //Entities
    public entityProps(): EntityProps {
        const sheetSize: [number, number] = [436, 508];
        const spriteSize: {
            overworld: {
                koopa: [number, number];
                boxSize: string;
            },
            underground: {
                goomba: [number, number];
                boxSize: string;
            },
            underwater: {
                cheep: [number, number];
                boxSize: string;
            },
            castle: {
                buzzy: [number, number];
                boxSize: string;
            }
        } = {
            [States.Overworld]: {
                koopa: [16, 24],
                boxSize: 'big'
            },
            [States.Underground]: {
                goomba: [16, 16],
                boxSize: 'normal'
            },
            [States.Underwater]: {
                cheep: [16, 16],
                boxSize: 'normal'
            },
            [States.Castle]: {
                buzzy: [16, 16],
                boxSize: 'normal'
            }
        }

        return {
            sheetSize,
            spriteSize
        }
    }

    public levelStateProps(): LevelStateProps {
        const sheetSize: [number, number] = [52, 52];
        const spriteSize: [number, number] = [16, 16];

        return {
            sheetSize,
            spriteSize
        }
    }
}