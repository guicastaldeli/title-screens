import { TextureMap } from "./texture-map.js";
import { States } from "./texture-map.interface.js";
export class SheetProps {
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
    tilesetProps() {
        const spriteSheetSize = [680, 764];
        const spriteProps = {
            ground: {
                spriteSize: [16, 16]
            }
        };
        return {
            spriteSheetSize,
            spriteProps
        };
    }
    //Misc
    miscProps() {
        const spriteSheetSize = [1172, 884];
        const spriteProps = {
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
        };
        return {
            spriteSheetSize,
            spriteProps
        };
    }
    //Title
    titleProps() {
        const sheetSize = [2599.9, 528];
        const size = [199.8, 87.83];
        const coords = this.map.title;
        return {
            sheetSize,
            size,
            coords: coords
        };
    }
    //Playerset
    playersetProps() {
        const sheetSize = [584, 468];
        const spriteSize = {
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
        };
        return {
            sheetSize,
            spriteSize
        };
    }
    //Entities
    entityProps() {
        const sheetSize = [436, 508];
        const spriteSize = {
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
        };
        return {
            sheetSize,
            spriteSize
        };
    }
    levelStateProps() {
        const sheetSize = [52, 52];
        const spriteSize = [16, 16];
        return {
            sheetSize,
            spriteSize
        };
    }
}
