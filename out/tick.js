export class Tick {
    constructor() {
        this.lastTime = 0;
        this.time = 0;
        this.length = 16;
        this.speed = 0.1;
        this.tickCallback = [];
        this.lastTime = performance.now();
    }
    setSpeedFactor(factor) {
        this.speed = Math.max(0, factor);
    }
    addCall(callback) {
        this.tickCallback.push(callback);
    }
    update(deltaTime) {
        this.setSpeedFactor(this.speed);
        const now = performance.now();
        deltaTime = (now - this.lastTime) / 1000;
        const scaledDelta = deltaTime * this.speed;
        this.lastTime = now;
        for (const cb of this.tickCallback)
            cb(scaledDelta);
    }
}
