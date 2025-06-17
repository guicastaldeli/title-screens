import { State } from "./state.js";
import { ScreenStates } from "./state.js";
import { ScreenManager } from "./screen-manager.js";

export class Contoller {
    private state: State;
    private screenManager: ScreenManager;

    constructor(state: State, screenManager: ScreenManager) {
        this.state = state;
        this.screenManager = screenManager;
    }

    public async toggleScreen(): Promise<void> {
        if(this.state.isLoading()) return;

        const current = this.state.getCurrentState();
        const updScreen = current === 'dk' ? 'smb' : 'dk';
        await this.switch(updScreen);
    }

    public async switch(screen: ScreenStates): Promise<void> {
        if(this.state.isLoading()) return;
        await this.screenManager.current(screen);
    }
}