export class Tick {
    private lastTime: number = 0;
    private time: number = 0;
    private length: number = 16;
    private speed: number = 0.1;
    private tickCallback: Array<(deltaTime: number) => void> = [];

    constructor() {
        this.lastTime = performance.now();
    }

    private setSpeedFactor(factor: number): void {
        this.speed = Math.max(0, factor);
    }

    public addCall(callback: (deltaTime: number) => void): void {
        this.tickCallback.push(callback);
    }

    public update(deltaTime: number): void {
        this.setSpeedFactor(this.speed);

        const now = performance.now();
        deltaTime = (now - this.lastTime) / 1000;
        const scaledDelta = deltaTime * this.speed;
        this.lastTime = now;

        for(const cb of this.tickCallback) cb(scaledDelta);
    }
}