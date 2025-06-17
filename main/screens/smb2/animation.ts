import { SheetProps } from "./sheet-props.js";

interface SpriteGroup {
    id: string;
    coords: Record<string, [number, number]>;
    avaliableAnimations: string[];
    starts?: number;
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

export class Animation {
    private readonly sheetProps: SheetProps;
    private readonly groups: SpriteGroup[];
    private currentGroup: SpriteGroup | null = null;
    private availableGroups: SpriteGroup[] = [];

    private currentPhase: 'initial' | 'flash' = 'initial';
    private currentFrameIndex: number = 0;
    private flashState: boolean = false;
    private lastUpdateTime: number = performance.now();

    private isPaused: boolean = false;
    private pauseTimer: number = 0;
    private pauseIntervalTimer: number = 0;
    private pauseInterval: number = 500;
    private lastPhase: 'initial' | 'flash' = 'initial';

    private animationTimer: number = 0;
    private frameKeys: string[] = ['f', 's', 't'];
    private animationParams = {
        initialSpeed: 100,
        flashSpeed: 1000,
        initialCycles: 6,
        flashDuration: 1000,
        pauseDuration: 2000,
        pausePhase: 'initial'
    }

    //Title
    private titleProps: any; 

    constructor(sheetProps: SheetProps, groups: SpriteGroup[]) {
        this.sheetProps = sheetProps;
        this.groups = groups;
        
        this.titleProps = this.sheetProps.titleProps();
        this.init();
    }

    private init(): void {
        this.generateAvaliableGroups();
        this.selectRandomGroup();
    }
    
    private generateAvaliableGroups(): void {
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
            case 'initial': return this.animationParams.initialSpeed;
            case 'flash': return this.animationParams.flashSpeed;
            default: return this.animationParams.initialSpeed;
        }
    }

    private advanceAnimation(): void {
        if(this.isPaused) return;

        if(this.currentPhase !== 'flash') {
            this.currentFrameIndex++
        }

        if(this.currentPhase === 'initial') {
            const initialFramesComplete = this.frameKeys.length * this.animationParams.initialCycles;

            if(this.currentFrameIndex >= initialFramesComplete) {
                this.transitionPhase('flash');
            }
        } else if(this.currentPhase === 'flash') {
            if(this.currentFrameIndex >= this.animationParams.flashDuration) {
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
        this.currentFrameIndex = 0;

        if(newPhase === 'flash') this.flashState = true;
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
        }
    }

    private determineFrameKey(): string {
        if(!this.currentGroup) return 'f'; 

        const phaseIndex = this.currentPhase === 'flash'
        ? Math.floor(this.currentFrameIndex / this.animationParams.initialCycles) % this.frameKeys.length
        : this.currentFrameIndex % this.frameKeys.length;

        const baseKey = this.frameKeys[phaseIndex];

        return this.currentGroup.coords[`${baseKey}_offset`]
        ? `${baseKey}_offset`
        : baseKey;
    }

    private getDefaultFrame(): FrameData {
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
        }
    }

    public update(deltaTime: number): void {
        const time = deltaTime * 1000;

        if(this.isPaused) {
            this.pauseTimer += time;
            
            if(this.pauseTimer >= this.animationParams.pauseDuration) this.endPause();
            return;
        }

        this.pauseIntervalTimer += time;

        if(this.pauseIntervalTimer >= this.pauseInterval) {
            this.lastPhase = this.currentPhase;
            this.startPause();
            this.pauseIntervalTimer = 0;
            return;
        }

        this.animationTimer += time;
        const frameDuration = this.getCurrentPhaseDuration();

        if(this.animationTimer >= frameDuration) {
            this.animationTimer -= frameDuration;
            this.advanceAnimation();

            this.pauseIntervalTimer = 0;
        }
    }
}