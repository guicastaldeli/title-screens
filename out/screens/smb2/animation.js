export class Animation {
    constructor(sheetProps, groups) {
        this.currentGroup = null;
        this.availableGroups = [];
        this.animationTimer = 0;
        this.currentPhase = 'initial';
        this.currentFrameIndex = 0;
        this.flashState = false;
        this.lastUpdateTime = performance.now();
        this.isPaused = false;
        this.pauseTimer = 0;
        this.lastPhase = 'initial';
        this.frameKeys = ['f', 's', 't'];
        this.animationParams = {
            initialSpeed: 200,
            rapidSpeed: 80,
            flashSpeed: 150,
            initialCycles: 2,
            rapidFrames: 6,
            flashDuration: 2000,
            pauseDuration: 1000,
            pausePhase: 'initial'
        };
        this.sheetProps = sheetProps;
        this.groups = groups;
        this.titleProps = this.sheetProps.titleProps();
        this.init();
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
            case 'rapid': return this.animationParams.rapidSpeed;
            case 'flash': return this.animationParams.flashSpeed;
            default: return this.animationParams.initialSpeed;
        }
    }
    advanceAnimation() {
        if (this.isPaused)
            return;
        if (this.currentPhase !== 'flash') {
            this.currentFrameIndex++;
        }
        else {
            this.flashState = !this.flashState;
        }
        if (this.currentPhase === 'initial' &&
            this.currentFrameIndex >= this.frameKeys.length *
                this.animationParams.initialCycles) {
            if (this.animationParams.pausePhase === 'initial') {
                this.startPause();
            }
            else {
                this.transitionPhase('rapid');
            }
        }
        if (this.currentPhase === 'rapid' &&
            this.currentFrameIndex >= this.frameKeys.length *
                this.animationParams.initialCycles +
                this.animationParams.rapidFrames) {
            if (this.animationParams.pausePhase === 'rapid') {
                this.startPause();
            }
            else {
                this.transitionPhase('flash');
            }
        }
        if (this.currentPhase === 'flash' &&
            this.animationTimer >= this.animationParams.flashDuration) {
            if (this.animationParams.pausePhase === 'rapid') {
                this.startPause();
            }
            else {
                this.resetAnimation();
            }
        }
    }
    startPause() {
        this.isPaused = true;
        this.pauseTimer = 0;
        this.lastPhase = this.currentPhase;
    }
    endPause() {
        this.isPaused = false;
        if (this.lastPhase === 'flash') {
            this.resetAnimation();
        }
        else if (this.lastPhase === 'rapid') {
            this.transitionPhase('flash');
        }
        else {
            this.transitionPhase('rapid');
        }
    }
    transitionPhase(newPhase) {
        this.currentPhase = newPhase;
        this.animationTimer = 0;
        if (newPhase === 'flash')
            this.flashState = true;
    }
    resetAnimation() {
        this.currentPhase = 'initial';
        this.currentFrameIndex = 0;
        this.animationTimer = 0;
        this.flashState = false;
        this.selectRandomGroup();
    }
    selectRandomGroup() {
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
            coords: this.currentGroup.coords[frameKey] || this.currentGroup.coords.f,
            size: this.titleProps.spriteSize,
            sheetSize: this.titleProps.spriteSheetSize,
            effects: { flash: this.currentPhase === 'flash' && this.flashState },
            metadata: {
                groupId: this.currentGroup.id,
                phase: this.currentPhase,
                stars: this.currentGroup.starts
            }
        };
    }
    determineFrameKey() {
        if (this.currentPhase === 'flash')
            return this.flashState ? 'f' : 's';
        if (!this.currentGroup)
            return 'f';
        const phaseIndex = this.currentPhase === 'initial'
            ? Math.floor(this.currentFrameIndex / this.animationParams.initialCycles) % this.frameKeys.length
            : this.currentFrameIndex % this.frameKeys.length;
        const baseKey = this.frameKeys[phaseIndex];
        return Math.random() > 0.8 &&
            this.currentGroup.coords[`${baseKey}_offset`]
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
                phase: 'initial',
                stars: 0
            }
        };
    }
    update(deltaTime) {
        const time = deltaTime * 2000;
        if (this.isPaused) {
            this.pauseTimer += time;
            if (this.pauseTimer >= this.animationParams.pauseDuration)
                this.endPause();
            return;
        }
        this.animationTimer += time;
        const frameDuration = this.getCurrentPhaseDuration();
        if (this.animationTimer >= frameDuration) {
            this.animationTimer = 0;
            this.advanceAnimation();
        }
    }
}
