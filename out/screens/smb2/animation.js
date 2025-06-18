export class Animation {
    constructor(sheetProps, groups, type = 'title') {
        this.currentGroup = null;
        this.availableGroups = [];
        this.currentPhase = 'initial';
        this.currentFrameIndex = 0;
        this.flashState = false;
        this.lastUpdateTime = performance.now();
        this.isPaused = false;
        this.pauseTimer = 0;
        this.pauseIntervalTimer = 0;
        this.pauseInterval = 500;
        this.pausedFrameIndex = 0;
        this.pausedFrameTimer = 0;
        this.pausedFrameInterval = 200;
        this.animationTimer = 0;
        this.frameKeys = ['f', 's', 't'];
        this.lastPhase = 'initial';
        this.animationParams = {
            initialSpeed: 70,
            flashSpeed: 1000,
            initialCycles: 6,
            flashDuration: 1000,
            pauseDuration: 2000,
            pausePhase: 'initial'
        };
        this.sheetProps = sheetProps;
        this.type = type;
        this.coinProps = sheetProps.miscProps().spriteProps.coin;
        this.titleProps = sheetProps.titleProps();
        this.groups = type === 'coin'
            ? this.getCoinGroups()
            : groups;
        this.init();
    }
    //Coin
    getCoinGroups() {
        return this.coinProps.coords.map((c, i) => ({
            id: c.groupId,
            coords: {
                f: this.coinProps.coords[i % this.coinProps.coords.length].coords,
                s: this.coinProps.coords[(i + 1) % this.coinProps.coords.length].coords,
                t: this.coinProps.coords[(i + 2) % this.coinProps.coords.length].coords
            }
        }));
    }
    init() {
        this.generateAvaliableGroups();
        this.selectRandomGroup();
    }
    generateAvaliableGroups() {
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
            case 'initial': return this.animationParams.initialSpeed;
            case 'flash': return this.animationParams.flashSpeed;
            default: return this.animationParams.initialSpeed;
        }
    }
    advanceAnimation() {
        if (this.isPaused)
            return;
        this.currentFrameIndex++;
        if (this.currentPhase !== 'flash') {
            this.currentFrameIndex++;
        }
        if (this.currentPhase === 'initial') {
            const initialFramesComplete = this.frameKeys.length * this.animationParams.initialCycles;
            if (this.currentFrameIndex >= initialFramesComplete) {
                this.transitionPhase('flash');
            }
        }
        else if (this.currentPhase === 'flash') {
            if (this.currentFrameIndex >= this.animationParams.flashDuration) {
                this.transitionPhase('initial');
                this.resetAnimation();
            }
        }
    }
    startPause() {
        this.isPaused = true;
        this.pauseTimer = 0;
        this.pausedFrameIndex = Math.floor(Math.random() * this.frameKeys.length);
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
        this.currentFrameIndex = 0;
        if (newPhase === 'flash') {
            this.flashState = true;
            this.currentFrameIndex = Math.floor(Math.random() * this.frameKeys.length);
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
            size: this.titleProps.spriteSize,
            sheetSize: this.titleProps.spriteSheetSize,
            effects: { flash: this.currentPhase === 'flash' },
            metadata: {
                groupId: this.currentGroup.id,
                phase: this.currentPhase,
                stars: this.currentGroup.starts
            }
        };
    }
    determineFrameKey() {
        if (!this.currentGroup)
            return 'f';
        const phaseIndex = this.currentPhase === 'flash'
            ? this.currentFrameIndex % this.frameKeys.length
            : this.currentFrameIndex % this.frameKeys.length;
        const baseKey = this.frameKeys[phaseIndex];
        return this.currentGroup.coords[`${baseKey}_offset`]
            ? `${baseKey}_offset`
            : baseKey;
    }
    getDefaultFrame() {
        return {
            coords: [0, 0],
            size: this.titleProps.spriteSize,
            sheetSize: this.titleProps.spriteSheetSize,
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
            frameIndex: this.currentFrameIndex
        };
    }
    update(deltaTime) {
        const time = deltaTime * 1000;
        if (this.isPaused) {
            this.pauseTimer += time;
            if (this.pausedFrameTimer >= this.pausedFrameInterval) {
                this.pausedFrameTimer = 0;
                this.pausedFrameIndex = Math.floor(Math.random() * this.frameKeys.length);
            }
            if (this.pauseTimer >= this.animationParams.pauseDuration)
                this.endPause();
            return;
        }
        this.pauseIntervalTimer += time;
        if (this.pauseIntervalTimer >= this.pauseInterval) {
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
