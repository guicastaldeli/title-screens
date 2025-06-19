import { SheetProps } from "./sheet-props";
import { Animation } from "./animation.js"
import { SpriteGroup } from "./animation.js";

export class AnimationManager {
    private animations: Record<string, Animation> = {};

    constructor(sheetProps: SheetProps, titleGroups: SpriteGroup[], coinGroups: SpriteGroup[]) {
        this.animations.title = new Animation(sheetProps, titleGroups, {
            frameKeys: ['f', 's', 't'],
            spriteSize: sheetProps.titleProps().spriteSize,
            spriteSheetSize: sheetProps.titleProps().spriteSheetSize,
            defaultCoords: [0, 0]
        });

        this.animations.coin = new Animation(sheetProps, coinGroups, {
            frameKeys: ['f', 's', 't'],
            spriteSize: sheetProps.miscProps().spriteProps.coin.spriteSize,
            spriteSheetSize: sheetProps.miscProps().spriteSheetSize,
            defaultCoords: [0, 0]
        });

        this.animations.coin.setSync(true);
        this.syncAnimation();
    }

    private syncAnimation() {
        const state = this.animations.title.getCurrentState();
        
        this.animations.coin.setExternalFrameIndex(state.frameIndex);
        this.animations.coin['currentPhase'] = state.phase;
        this.animations.coin['flashState'] = state.flashState;
        this.animations.coin['isPaused'] = this.animations.title['isPaused'];
    }

    public getTitleFrame() {
        return this.animations.title.getCurrentFrame();
    }

    public getCoinFrame() {
        return this.animations.coin.getCurrentFrame();
    }

    public update(deltaTime: number) {
        this.animations.title.update(deltaTime);
        this.syncAnimation();
    }
}