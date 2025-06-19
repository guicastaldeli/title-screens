export class Animation {
    constructor(sheetProps, groups, config = {}) {
        this.currentGroup = null;
        this.availableGroups = [];
        this.isSync = false;
        this.externalFrameIndex = null;
        this.currentPhase = 'initial';
        this.currentFrameIndex = 0;
        this.flashState = false;
        this.lastUpdateTime = performance.now();
        this.isPaused = false;
        this.pauseTimer = 0;
        this.pauseIntervalTimer = 0;
        this.pauseInterval = 500;
        this.pausedFrameIndex = 0;
        this.animationTimer = 0;
        this.lastPhase = 'initial';
        this.sheetProps = sheetProps;
        this.groups = groups;
        this.config = Object.assign({ frameKeys: ['f', 's', 't'], initialSpeed: 70, flashSpeed: 1000, initialCycles: 6, flashDuration: 1000, pauseDuration: 2000, pauseInterval: 500, spriteSize: [0, 0], spriteSheetSize: [0, 0], defaultCoords: [0, 0] }, config);
        this.init();
    }
    generateAnimationId() {
        var _a;
        const effectiveIndex = this.externalFrameIndex !== null ? this.externalFrameIndex : this.currentFrameIndex;
        const frameKey = this.getCurrentFrameKey();
        const syncStatus = this.externalFrameIndex !== null ? ' [SYNCED]' : '';
        return `${((_a = this.currentGroup) === null || _a === void 0 ? void 0 : _a.id) || 'animation'}: ${frameKey}-${effectiveIndex} [${this.currentPhase}]${syncStatus}`;
    }
    init() {
        this.generateAvailableGroups();
        this.selectRandomGroup();
    }
    generateAvailableGroups() {
        if (!this.groups)
            return;
        this.availableGroups = this.groups.map(group => {
            const dynamicFrames = this.createDynamicFrames(group);
            return Object.assign(Object.assign({}, group), { coords: Object.assign(Object.assign({}, group.coords), dynamicFrames) });
        });
    }
    createDynamicFrames(group) {
        const dynamicFrames = {};
        Object.entries(group.coords).forEach(([key, [x, y]]) => {
            dynamicFrames[`${key}_offset`] = [x, y];
        });
        return dynamicFrames;
    }
    getCurrentPhaseDuration() {
        switch (this.currentPhase) {
            case 'initial': return this.config.initialSpeed;
            case 'flash': return this.config.flashSpeed;
            default: return this.config.initialSpeed;
        }
    }
    advanceAnimation() {
        if (this.isPaused || this.isSync)
            return;
        this.currentFrameIndex++;
        if (this.currentPhase === 'initial') {
            const initialFramesComplete = this.config.frameKeys.length * this.config.initialCycles;
            if (this.currentFrameIndex >= initialFramesComplete) {
                this.transitionPhase('flash');
            }
        }
        else if (this.currentPhase === 'flash') {
            if (this.currentFrameIndex >= this.config.flashDuration) {
                this.transitionPhase('initial');
                this.resetAnimation();
            }
        }
    }
    startPause() {
        this.isPaused = true;
        this.pauseTimer = 0;
    }
    endPause() {
        this.isPaused = false;
        this.pauseTimer = 0;
        if (this.lastPhase === 'flash')
            this.resetAnimation();
    }
    transitionPhase(newPhase) {
        this.currentPhase = newPhase;
        this.animationTimer = 0;
        if (newPhase === 'flash') {
            this.flashState = true;
            if (this.isSync) {
                this.currentFrameIndex = 0;
            }
            else {
                this.currentFrameIndex = Math.floor(Math.random() * this.config.frameKeys.length);
            }
        }
    }
    resetAnimation() {
        this.currentPhase = 'initial';
        this.currentFrameIndex = 0;
        this.animationTimer = 0;
        this.flashState = false;
    }
    selectRandomGroup() {
        if (this.currentGroup !== null)
            return;
        if (this.availableGroups.length === 0)
            return;
        const randomIndex = Math.floor(Math.random() * this.availableGroups.length);
        this.currentGroup = this.availableGroups[randomIndex];
    }
    getCurrentFrame() {
        if (!this.currentGroup)
            return this.getDefaultFrame();
        const frameKey = this.determineFrameKey();
        return {
            coords: this.currentGroup.coords[frameKey] || this.currentGroup.coords.t,
            size: this.config.spriteSize,
            sheetSize: this.config.spriteSheetSize,
            effects: { flash: this.currentPhase === 'flash' },
            metadata: {
                groupId: this.currentGroup.id,
                phase: this.currentPhase,
                stars: this.currentGroup.stars
            }
        };
    }
    getCurrentFrameKey() {
        const index = this.externalFrameIndex !== null
            ? this.externalFrameIndex
            : this.currentFrameIndex % this.config.frameKeys.length;
        return this.config.frameKeys[index];
    }
    setFrameIndex(i) {
        this.currentFrameIndex = i;
    }
    setSync(sync) {
        this.isSync = sync;
    }
    setExternalFrameIndex(key) {
        const frameIndex = this.config.frameKeys.indexOf(key);
        if (frameIndex >= 0)
            this.externalFrameIndex = frameIndex;
    }
    getFrameIndex() {
        return this.externalFrameIndex !== null ? this.externalFrameIndex : this.currentFrameIndex;
    }
    determineFrameKey() {
        if (!this.currentGroup)
            return this.config.frameKeys[0];
        const externalIndex = this.getFrameIndex();
        const phaseIndex = externalIndex % this.config.frameKeys.length;
        const baseKey = this.config.frameKeys[phaseIndex];
        return this.currentGroup.coords[`${baseKey}_offset`]
            ? `${baseKey}_offset`
            : baseKey;
    }
    getDefaultFrame() {
        return {
            coords: [0, 0],
            size: this.config.spriteSize,
            sheetSize: this.config.spriteSheetSize,
            effects: { flash: false },
            metadata: {
                groupId: '',
                phase: 'flash',
                stars: 0
            }
        };
    }
    getCurrentState() {
        return {
            phase: this.currentPhase,
            flashState: this.flashState,
            frameIndex: this.externalFrameIndex !== null ? this.externalFrameIndex : this.currentFrameIndex
        };
    }
    update(deltaTime) {
        const time = deltaTime * 1000;
        if (this.isPaused) {
            this.pauseTimer += time;
            if (this.pauseTimer >= this.config.pauseDuration)
                this.endPause();
            return;
        }
        this.pauseIntervalTimer += time;
        if (this.pauseIntervalTimer >= this.config.pauseInterval) {
            this.lastPhase = this.currentPhase;
            this.pauseIntervalTimer = 0;
            this.startPause();
            return;
        }
        //Animation
        this.animationTimer += time;
        const frameDuration = this.getCurrentPhaseDuration();
        if (this.animationTimer >= frameDuration) {
            this.animationTimer -= frameDuration;
            this.advanceAnimation();
            this.pauseIntervalTimer = 0;
        }
    }
}
Animation.sharedFlashIndex = 0;
