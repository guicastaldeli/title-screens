export class SheetProps {
    constructor() {
        this.titleProps();
    }
    titleProps() {
        const spriteSheetSize = [2600, 528];
        const spriteSize = [1, 1];
        const spriteCoords = [0, 0];
        return {
            spriteSheetSize,
            spriteSize,
            spriteCoords
        };
    }
}
