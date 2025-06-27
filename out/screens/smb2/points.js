export class Points {
    constructor(tick) {
        this.score = 0;
        this.coins = 0;
        this.time = 999;
        this.timerInterval = null;
        this.lastUpdateTime = 0;
        this.listeners = [];
        this.maxScore = 999999;
        this.maxCoins = 99;
        this.maxTime = 999;
        this.tick = tick;
        this.startTimer(this.tick.timeScale);
    }
    startTimer(timeScale) {
        const deltaTime = timeScale * 10000;
        if (this.timerInterval)
            clearInterval(this.timerInterval);
        this.timerInterval = window.setInterval(() => {
            this.updateTime();
        }, deltaTime);
    }
    updateTime() {
        if (this.time > 0) {
            this.time--;
        }
        else {
            this.time = this.maxTime;
        }
    }
    addScore(points) {
        this.score = Math.min(this.score + points, this.maxScore);
    }
    addCoin() {
        const count = 1;
        this.coins = Math.min(this.coins + count, this.maxCoins);
    }
    addTime() {
        const sec = 10;
        this.time = Math.min(this.time + sec, this.maxTime);
    }
    getScore() {
        return this.score.toString().padStart(6, '0').substring(0, 6);
    }
    getCoins() {
        return this.coins.toString().padStart(2, '0');
    }
    getTime() {
        return this.time.toString().padStart(3, '0');
    }
    addListener(cb) {
        this.listeners.forEach(cb => cb());
    }
}
