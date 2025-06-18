import { SheetProps } from "./sheet-props";
import { Animation } from "./animation.js"
import { SpriteGroup } from "./animation.js";

export class AnimationManager {
    private coinAnimation: Animation;
    private titleAnimation: Animation;

    constructor(sheetProps: SheetProps, groups: SpriteGroup[]) {
        this.coinAnimation = new Animation(sheetProps, [], 'coin');
        this.titleAnimation = new Animation(sheetProps, groups, 'title');
        this.syncAnimation();
    }

    private syncAnimation() {
        const state = this.titleAnimation.getCurrentState();

        this.coinAnimation['currentPhase'] = state.phase;
        this.coinAnimation['flashState'] = state.flashState;
        this.coinAnimation['currentFrameIndex'] = state.frameIndex;
        this.coinAnimation['isPaused'] = this.titleAnimation['isPaused'];
        this.coinAnimation['pausedFrameIndex'] = this.titleAnimation['pausedFrameIndex'];

        if(this.titleAnimation['isPaused'] &&
            this.titleAnimation['currentGroup'] &&
            this.coinAnimation['currentGroup']
        ) {
            const frameKey = this.titleAnimation['determineFrameKey']();

            this.coinAnimation['currentGroup'].coords = {
                ...this.coinAnimation['currentGroup'].coords,
                f: this.titleAnimation['currentGroup'].coords[frameKey],
                s: this.titleAnimation['currentGroup'].coords[frameKey],
                t: this.titleAnimation['currentGroup'].coords[frameKey],
            }
        }
    }

    public getTitleFrame() {
        return this.titleAnimation.getCurrentFrame();
    }

    public getCoinFrame() {
        return this.coinAnimation.getCurrentFrame();
    }

    public update(deltaTime: number) {
        this.titleAnimation.update(deltaTime);
        this.syncAnimation();
    }
}