export class State {
    constructor() {
        this.loading = true;
        this.running = false;
        this.current = 'dk';
        this.initializedStates = new Set();
    }
    setCurrentState(screen) {
        this.current = screen;
    }
    getCurrentState() {
        return this.current;
    }
    markInit(state) {
        this.initializedStates.add(state);
    }
    isInit(state) {
        return this.initializedStates.has(state);
    }
    //Loading
    isLoading() {
        return this.loading;
    }
    setLoading(loading) {
        this.loading = loading;
    }
    //Running
    isRunning() {
        return this.running;
    }
    setRunning(running) {
        this.running = running;
    }
}
