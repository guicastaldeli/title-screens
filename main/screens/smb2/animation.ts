import { Tick } from "../../tick.js";

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
        phase: 'initial' | 'rapid' | 'flash';
        stars?: number
    }
}

export class Animation {
    private readonly sheetProps: SheetProps;
    private readonly groups: SpriteGroup[];
    private currentGroup: SpriteGroup | null = null;
    private availableGroups: SpriteGroup[] = [];

    private animationTimer: number = 0;
    private currentPhase: 'initial' | 'rapid' | 'flash' = 'initial';
    private currentFrameIndex: number = 0;
    private flashState: boolean = false;
    private lastUpdateTime: number = performance.now();

    private isPaused: boolean = false;
    private pauseTimer: number = 0;
    private lastPhase: 'initial' | 'rapid' | 'flash' = 'initial';

    private frameKeys: string[] = ['f', 's', 't'];
    private animationParams = {
        initialSpeed: 200,
        rapidSpeed: 80,
        flashSpeed: 150,
        initialCycles: 2,
        rapidFrames: 6,
        flashDuration: 2000,
        pauseDuration: 1000,
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
            case 'rapid': return this.animationParams.rapidSpeed;
            case 'flash': return this.animationParams.flashSpeed;
            default: return this.animationParams.initialSpeed;
        }
    }

    private advanceAnimation(): void {
        if(this.isPaused) return;

        if(this.currentPhase !== 'flash') {
            this.currentFrameIndex++
        } else {
            this.flashState = !this.flashState
        }

        if(this.currentPhase === 'initial' &&
            this.currentFrameIndex >= this.frameKeys.length * 
            this.animationParams.initialCycles
        ) {
            if(this.animationParams.pausePhase === 'initial') {
                this.startPause();
            } else {
                this.transitionPhase('rapid');
            }
        }

        if(this.currentPhase === 'rapid' &&
            this.currentFrameIndex >= this.frameKeys.length *
            this.animationParams.initialCycles +
            this.animationParams.rapidFrames
        ) {
            if(this.animationParams.pausePhase === 'rapid') {
                this.startPause();
            } else {
                this.transitionPhase('flash');
            }
        }

        if(this.currentPhase === 'flash' &&
            this.animationTimer >= this.animationParams.flashDuration
        ) {
            if(this.animationParams.pausePhase === 'rapid') {
                this.startPause();
            } else {
                this.resetAnimation();
            }
        }
    }

    private startPause(): void {
        this.isPaused = true;
        this.pauseTimer = 0;
        this.lastPhase = this.currentPhase;
    }

    private endPause(): void {
        this.isPaused = false;

        if(this.lastPhase === 'flash') {
            this.resetAnimation();
        } else if(this.lastPhase === 'rapid') {
            this.transitionPhase('flash');
        } else {
            this.transitionPhase('rapid');
        }
    }

    private transitionPhase(newPhase: 'rapid' | 'flash'): void {
        this.currentPhase = newPhase;
        this.animationTimer = 0;

        if(newPhase === 'flash') this.flashState = true;
    }

    private resetAnimation(): void {
        this.currentPhase = 'initial';
        this.currentFrameIndex = 0;
        this.animationTimer = 0;
        this.flashState = false;
        this.selectRandomGroup();
    }

    private selectRandomGroup(): void {
        if(this.availableGroups.length === 0) return;
        const randomIndex = Math.floor(Math.random() * this.availableGroups.length);
        this.currentGroup = this.availableGroups[randomIndex];
    }

    public getCurrentFrame(): FrameData {
        if(!this.currentGroup) return this.getDefaultFrame();
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
        }
    }

    private determineFrameKey(): string {
        if(this.currentPhase === 'flash') return this.flashState ? 'f' : 's';
        if(!this.currentGroup) return 'f';

        const phaseIndex = this.currentPhase === 'initial'
        ? Math.floor(this.currentFrameIndex / this.animationParams.initialCycles) % this.frameKeys.length
        : this.currentFrameIndex % this.frameKeys.length;

        const baseKey = this.frameKeys[phaseIndex];

        return Math.random() > 0.8 && 
        this.currentGroup.coords[`${baseKey}_offset`]
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
                phase: 'initial',
                stars: 0
            }
        }
    }

    public update(deltaTime: number): void {
        const time = deltaTime * 2000;

        if(this.isPaused) {
            this.pauseTimer += time;
            
            if(this.pauseTimer >= this.animationParams.pauseDuration) this.endPause();
            return;
        }

        this.animationTimer += time;
        const frameDuration = this.getCurrentPhaseDuration();

        if(this.animationTimer >= frameDuration) {
            this.animationTimer = 0;
            this.advanceAnimation();
        }
    }
}