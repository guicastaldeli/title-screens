import { Tick } from "../../tick";
import { SheetProps } from "./sheet-props";
import { Animation } from "./animation.js"
import { SpriteGroup } from "./animation.js";

export class AnimationManager {
    private tick: Tick;
    private sheetProps: SheetProps;
    private animations: Record<string, Animation> = {};
    private currentStars: number = 0;

    constructor(
        tick: Tick,
        sheetProps: SheetProps, 
        titleGroups: SpriteGroup[], 
        coinGroups: SpriteGroup[]
    ) {
        this.tick = tick;
        this.sheetProps = sheetProps;
        
        this.animations.title = new Animation(
            tick,
            sheetProps, 
            titleGroups, 
        {
            frameKeys: ['f', 's', 't'],
            spriteSize: sheetProps.titleProps().size,
            spriteSheetSize: sheetProps.titleProps().sheetSize,
            defaultCoords: [0, 0]
        });

        this.animations.coin = new Animation(
            tick,
            sheetProps, 
            coinGroups, 
        {
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
        const frameKey = this.animations.title.getCurrentFrameKey();
        const frameIndex = this.animations.title.getFrameIndex();
    
        this.animations.coin.setExternalFrameIndex(frameKey);
        this.animations.coin['currentPhase'] = state.phase;
        this.animations.coin['flashState'] = state.flashState;
        this.animations.coin['isPaused'] = this.animations.title['isPaused'];
        this.animations.coin.setFrameIndex(frameIndex);
    }

    public getTitleFrame() {
        return this.animations.title.getCurrentFrame();
    }

    public getCoinFrame() {
        return this.animations.coin.getCurrentFrame();
    }

    public update(deltaTime: number): void {
        if(deltaTime <= 0 || this.tick.timeScale <= 0) return;
        this.animations.title.update(deltaTime);
        this.syncAnimation();
    }
}