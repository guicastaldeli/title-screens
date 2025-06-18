export class SheetProps {
    constructor() {
        this.miscProps();
        this.titleProps();
    }
    //Misc
    miscProps() {
        const spriteSheetSize = [1172, 884];
        const spriteProps = {
            font: {
                position: [0, 0],
                coords: [0, 0],
                size: [0, 0],
                spriteSize: [200, 200]
            },
            hud: {
                position: [0, 0.61],
                coords: [0, 22.8],
                size: [1.0, 0.08],
                spriteSize: [200, 17]
            },
            coin: {
                position: [-0.08, 0.567],
                size: [0.04, 0.038],
                spriteSize: [7, 7],
                coords: [
                    {
                        groupId: 'group-0',
                        coords: [264, 76],
                    },
                    {
                        groupId: 'group-1',
                        coords: [274, 76],
                    },
                    {
                        groupId: 'group-2',
                        coords: [284, 76]
                    }
                ],
            }
        };
        return {
            spriteSheetSize,
            spriteProps
        };
    }
    //Title
    titleProps() {
        const spriteSheetSize = [2600, 528];
        const spriteSize = [199.8, 88];
        const spriteCoords = [
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
            }
        ];
        return {
            spriteSheetSize,
            spriteSize,
            spriteCoords
        };
    }
}
