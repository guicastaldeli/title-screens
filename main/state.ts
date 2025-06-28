export enum ScreenStates {
    Dk = 'dk',
    Smb = 'smb'
}

export class State {
    private loading: boolean = true;
    private running: boolean = false;

    private current: ScreenStates = ScreenStates.Dk;
    private initializedStates: Set<ScreenStates> = new Set();

    public setCurrentState(screen: ScreenStates): void {
        this.current = screen;
    }

    public getCurrentState(): ScreenStates {
        return this.current;
    }

    public markInit(state: ScreenStates): void {
        this.initializedStates.add(state);
    }

    public isInit(state: ScreenStates): boolean {
        return this.initializedStates.has(state);
    }

    //Loading
    public isLoading(): boolean {
        return this.loading;
    }

    public setLoading(loading: boolean): void {
        this.loading = loading;
    }

    //Running
    public isRunning(): boolean {
        return this.running;
    }

    public setRunning(running: boolean): void {
        this.running = running;
    }
}