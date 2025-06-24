import { TextureMap } from "./texture-map.js";
import { TitleMap } from "./texture-map.interface.js";

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

export class SheetProps {
    private map: TextureMap;

    constructor() {
        this.map = new TextureMap();
        
        this.tilesetProps();
        this.miscProps();
        this.titleProps();
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
        const sheetSize: [number, number] = [2600, 528];
        const size: [number, number] = [199.8, 88];
        const coords = this.map.title;

        return {
            sheetSize,
            size,
            coords: coords
        }
    }

    //Playerset
    public playersetProps(): void {
        const sheetSize: [number, number] = [584, 468];
        const spriteSize: {
            player: {
                mario: {
                    small: {
                        normal: [number, number],
                        swim: {
                            f: [number, number],
                            s: [number, number]
                        }
                    }
                    big: {
                        normal: [number, number],
                        swim: {
                            f: [number, number],
                            s: [number, number]
                        }
                    }
                },
                luigi: {
                    small: {
                        normal: [number, number],
                        swim: {
                            f: [number, number],
                            s: [number, number]
                        }
                    }
                    big: {
                        normal: [number, number],
                        swim: {
                            f: [number, number],
                            s: [number, number]
                        }
                    }
                }
            }
        } = {
            player: {
                mario: {
                    small: {
                        normal: [8, 8],
                        swim: {
                            f: [8, 8],
                            s: [8, 8]
                        }
                    },
                    big: {
                        normal: [10, 10],
                        swim: {
                            f: [10, 10],
                            s: [10, 10]
                        }
                    }
                },
                luigi: {
                    small: {
                        normal: [8, 8],
                        swim: {
                            f: [8, 8],
                            s: [8, 8]
                        }
                    },
                    big: {
                        normal: [10, 10],
                        swim: {
                            f: [10, 10],
                            s: [10, 10]
                        }
                    }
                }
            }
        }
    }
}