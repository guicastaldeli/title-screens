export class Tick {
    private lastTime: number = 0.0;
    public timeScale: number = 0.1;
    private tickCallback: Array<(deltaTime: number) => void> = [];

    constructor() {
        this.lastTime = performance.now();
    }

    public add(callback: (deltaTime: number) => void): void {
        this.tickCallback.push(callback);
    }

    public setTimeScale(scale: number): void {
        this.timeScale = scale;
    }

    public update(): void {
        if(this.timeScale === 0.0) return;

        const now = performance.now();
        const deltaTime = now - this.lastTime;
        const scaledDelta = (deltaTime * this.timeScale) / 1000;
        this.lastTime = now;
        
        if(this.timeScale > 0.0) {
            for(const cb of this.tickCallback) {
                cb(scaledDelta);
            }
        }
    }
}