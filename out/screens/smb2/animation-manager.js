import { Animation } from "./animation.js";
export class AnimationManager {
    constructor(sheetProps, groups) {
        this.coinAnimation = new Animation(sheetProps, [], 'coin');
        this.titleAnimation = new Animation(sheetProps, groups, 'title');
        this.syncAnimation();
    }
    syncAnimation() {
        const state = this.titleAnimation.getCurrentState();
        this.coinAnimation['currentPhase'] = state.phase;
        this.coinAnimation['flashState'] = state.flashState;
        this.coinAnimation['currentFrameIndex'] = state.frameIndex;
        this.coinAnimation['isPaused'] = this.titleAnimation['isPaused'];
        this.coinAnimation['pausedFrameIndex'] = this.titleAnimation['pausedFrameIndex'];
        if (this.titleAnimation['isPaused'] &&
            this.titleAnimation['currentGroup'] &&
            this.coinAnimation['currentGroup']) {
            const frameKey = this.titleAnimation['determineFrameKey']();
            this.coinAnimation['currentGroup'].coords = Object.assign(Object.assign({}, this.coinAnimation['currentGroup'].coords), { f: this.titleAnimation['currentGroup'].coords[frameKey], s: this.titleAnimation['currentGroup'].coords[frameKey], t: this.titleAnimation['currentGroup'].coords[frameKey] });
        }
    }
    getTitleFrame() {
        return this.titleAnimation.getCurrentFrame();
    }
    getCoinFrame() {
        return this.coinAnimation.getCurrentFrame();
    }
    update(deltaTime) {
        this.titleAnimation.update(deltaTime);
        this.syncAnimation();
    }
}
