import { Animation } from "./animation.js";
export class AnimationManager {
    constructor(sheetProps, titleGroups, coinGroups) {
        this.animations = {};
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
    syncAnimation() {
        const state = this.animations.title.getCurrentState();
        this.animations.coin.setExternalFrameIndex(state.frameIndex);
        this.animations.coin['currentPhase'] = state.phase;
        this.animations.coin['flashState'] = state.flashState;
        this.animations.coin['isPaused'] = this.animations.title['isPaused'];
    }
    getTitleFrame() {
        return this.animations.title.getCurrentFrame();
    }
    getCoinFrame() {
        return this.animations.coin.getCurrentFrame();
    }
    update(deltaTime) {
        this.animations.title.update(deltaTime);
        this.syncAnimation();
    }
}
