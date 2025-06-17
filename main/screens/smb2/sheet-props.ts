export class SheetProps {
    constructor() {
        this.titleProps();
    }

    public titleProps() {
        const spriteSheetSize: [number, number] = [2600, 528];
        const spriteSize: [number, number] = [199.8, 88];
        const spriteCoords: [number, number] = [0, 0];

        return {
            spriteSheetSize,
            spriteSize,
            spriteCoords
        }
    }
}