import { SheetProps } from "./sheet-props.js";

export interface SpriteGroup {
    id: string;
    coords: Record<string, [number, number]>;
    availableAnimations?: string[];
    stars?: number;
}

export interface FrameData {
    coords: [number, number];
    size: [number, number];
    sheetSize: [number, number]
    effects: { flash: boolean }
    metadata: {
        groupId: string;
        phase: 'initial' | 'flash';
        stars?: number
    }
}

interface AnimationState {
    phase: 'initial' | 'flash';
    flashState: boolean;
    frameIndex: number
}

interface AnimationConfig {
    frameKeys: string[];
    initialSpeed: number;
    flashSpeed: number;
    initialCycles: number;
    flashDuration: number;
    pauseDuration: number;
    pauseInterval: number;
    spriteSize: [number, number];
    spriteSheetSize: [number, number];
    defaultCoords: [number, number];
}

export class Animation {
    private sheetProps: SheetProps;
    private groups: SpriteGroup[];
    private currentGroup: SpriteGroup | null = null;
    private availableGroups: SpriteGroup[] = [];

    private config: AnimationConfig;
    private isSync: boolean = false;
    private externalFrameIndex: number | null = null;

    private currentPhase: 'initial' | 'flash' = 'initial';
    private currentFrameIndex: number = 0;
    private flashState: boolean = false;
    private lastUpdateTime: number = performance.now();

    private isPaused: boolean = false;
    private pauseTimer: number = 0;
    private pauseIntervalTimer: number = 0;
    private pauseInterval: number = 500;
    private pausedFrameIndex: number = 0;
    
    private animationTimer: number = 0;
    private lastPhase: 'initial' | 'flash' = 'initial';
    private static sharedFlashIndex: number = 0;

    constructor(
        sheetProps: SheetProps, 
        groups: SpriteGroup[],
        config: Partial<AnimationConfig> = {}
    ) {
        this.sheetProps = sheetProps;
        this.groups = groups;
        
        this.config = {
            frameKeys: ['f', 's', 't'],
            initialSpeed: 70,
            flashSpeed: 1000,
            initialCycles: 6,
            flashDuration: 1000,
            pauseDuration: 2000,
            pauseInterval: 500,
            spriteSize: [0, 0],
            spriteSheetSize: [0, 0],
            defaultCoords: [0, 0],
            ...config
        }

        this.init();
    }

    private generateAnimationId(): string {
        const effectiveIndex = this.externalFrameIndex !== null ? this.externalFrameIndex : this.currentFrameIndex;
        const frameKey = this.getCurrentFrameKey();
        const syncStatus = this.externalFrameIndex !== null ? ' [SYNCED]' : '';
        
        return `${this.currentGroup?.id || 'animation'}: ${frameKey}-${effectiveIndex} [${this.currentPhase}]${syncStatus}`;
    }

    private init(): void {
        this.generateAvailableGroups();
        this.selectRandomGroup();
    }
    
    private generateAvailableGroups(): void {
        if(!this.groups) return;

        this.availableGroups = this.groups.map(group => {
            const dynamicFrames = this.createDynamicFrames(group);

            return {
                ...group,
                coords: {
                    ...group.coords,
                    ...dynamicFrames
                }
            }
        });
    }

    private createDynamicFrames(group: SpriteGroup): Record<string, [number, number]> {
        const dynamicFrames: Record<string, [number, number]> = {}

        Object.entries(group.coords).forEach(([key, [x, y]]) => {
            dynamicFrames[`${key}_offset`] = [x, y];
        });

        return dynamicFrames;
    }

    private getCurrentPhaseDuration(): number {
        switch(this.currentPhase) {
            case 'initial': return this.config.initialSpeed;
            case 'flash': return this.config.flashSpeed;
            default: return this.config.initialSpeed;
        }
    }

    private advanceAnimation(): void {
        if(this.isPaused || this.isSync) return;
        this.currentFrameIndex++

        if(this.currentPhase === 'initial') {
            const initialFramesComplete = this.config.frameKeys.length * this.config.initialCycles;

            if(this.currentFrameIndex >= initialFramesComplete) {
                this.transitionPhase('flash');
            }
        } else if(this.currentPhase === 'flash') {
            if(this.currentFrameIndex >= this.config.flashDuration) {
                this.transitionPhase('initial');
                this.resetAnimation();
            }
        }
    }

    private startPause(): void {
        this.isPaused = true;
        this.pauseTimer = 0;
    }

    private endPause(): void {
        this.isPaused = false;
        this.pauseTimer = 0;
        if(this.lastPhase === 'flash') this.resetAnimation();
    }

    private transitionPhase(newPhase: 'initial' | 'flash'): void {
        this.currentPhase = newPhase;
        this.animationTimer = 0;

        if(newPhase === 'flash') {
            this.flashState = true;

            if(this.isSync) {
               this.currentFrameIndex = 0;
            } else {
                this.currentFrameIndex = Math.floor(Math.random() * this.config.frameKeys.length);
            }
        }
    }

    private resetAnimation(): void {
        this.currentPhase = 'initial';
        this.currentFrameIndex = 0;
        this.animationTimer = 0;
        this.flashState = false;
    }

    private selectRandomGroup(): void {
        if(this.currentGroup !== null) return;
        if(this.availableGroups.length === 0) return;

        const randomIndex = Math.floor(Math.random() * this.availableGroups.length);
        this.currentGroup = this.availableGroups[randomIndex];
    }

    public getCurrentFrame(): FrameData {
        if(!this.currentGroup) return this.getDefaultFrame();
        const frameKey = this.determineFrameKey()

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
        }
    }

    public getCurrentFrameKey(): string {
        const index = this.externalFrameIndex !== null
            ? this.externalFrameIndex
            : this.currentFrameIndex % this.config.frameKeys.length;
        return this.config.frameKeys[index];
    }

    public setFrameIndex(i: number): void {
        this.currentFrameIndex = i;
    }

    public setSync(sync: boolean): void {
        this.isSync = sync;
    }

    public setExternalFrameIndex(key: string): void {
        const frameIndex = this.config.frameKeys.indexOf(key);
        if(frameIndex >= 0) this.externalFrameIndex = frameIndex;
    }

    public getFrameIndex(): number {
        return this.externalFrameIndex !== null ? this.externalFrameIndex : this.currentFrameIndex;
    }

    public determineFrameKey(): string {
        if(!this.currentGroup) return this.config.frameKeys[0]; 

        const externalIndex = this.getFrameIndex();
        const phaseIndex = externalIndex % this.config.frameKeys.length;
        const baseKey = this.config.frameKeys[phaseIndex];

        return this.currentGroup.coords[`${baseKey}_offset`]
        ? `${baseKey}_offset`
        : baseKey;
    }

    private getDefaultFrame(): FrameData {
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
        }
    }

    public getCurrentState(): AnimationState {
        return {
            phase: this.currentPhase,
            flashState: this.flashState,
            frameIndex: this.externalFrameIndex !== null ? this.externalFrameIndex : this.currentFrameIndex
        }
    }

    public update(deltaTime: number): void {
        const time = deltaTime * 1000;

        if(this.isPaused) {
            this.pauseTimer += time;
            if(this.pauseTimer >= this.config.pauseDuration) this.endPause();
            return;
        }

        this.pauseIntervalTimer += time;

        if(this.pauseIntervalTimer >= this.config.pauseInterval) {
            this.lastPhase = this.currentPhase;
            this.pauseIntervalTimer = 0;
            this.startPause();
            return;
        }

        //Animation
        this.animationTimer += time;
        const frameDuration = this.getCurrentPhaseDuration();

        if(this.animationTimer >= frameDuration) {
            this.animationTimer -= frameDuration;
            this.advanceAnimation();
            this.pauseIntervalTimer = 0;
        }
    }
}