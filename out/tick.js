export class Tick {
    constructor() {
        this.lastTime = 0.0;
        this.timeScale = 0.1;
        this.tickCallback = [];
        this.lastTime = performance.now();
    }
    add(callback) {
        this.tickCallback.push(callback);
    }
    setTimeScale(scale) {
        this.timeScale = scale;
    }
    update() {
        if (this.timeScale === 0.0)
            return;
        const now = performance.now();
        const deltaTime = now - this.lastTime;
        const scaledDelta = (deltaTime * this.timeScale) / 1000;
        this.lastTime = now;
        if (this.timeScale > 0.0) {
            for (const cb of this.tickCallback) {
                cb(scaledDelta);
            }
        }
    }
}
