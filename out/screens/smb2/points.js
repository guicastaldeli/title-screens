export class Points {
    constructor(tick) {
        this.score = 0;
        this.coins = 0;
        this.time = 999;
        this.timerInterval = null;
        this.lastUpdateTime = 0;
        this.listeners = [];
        this.addedScore = 0;
        this.addedCoins = 0;
        this.addedTime = 0;
        this.topScoreKey = 'smb-top-score';
        this.sessionScoreKey = 'smb-session-score';
        this.maxScore = 999999;
        this.maxCoins = 99;
        this.maxTime = 999;
        this.tick = tick;
        this.startTimer(this.tick.timeScale);
        this.loadTopScore();
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
        const currentPoints = Math.min(this.score + points, this.maxScore);
        this.score = currentPoints;
        this.addedScore = currentPoints;
    }
    addCoin() {
        const count = 1;
        const currentCoins = Math.min(this.coins + count, this.maxCoins);
        this.coins = currentCoins;
        this.addedCoins = currentCoins;
    }
    addTime() {
        const sec = 10;
        const currentTime = Math.min(this.time + sec, this.maxTime);
        this.time = currentTime;
        this.addedTime = currentTime;
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
    calculateTotalPoints() {
        const coins = 100;
        const time = 10;
        return this.addedScore + (this.addedCoins * coins) + (this.addedTime * time);
    }
    getTopScore() {
        const topScore = localStorage.getItem(this.topScoreKey);
        return topScore ? parseInt(topScore, 10) : 0;
    }
    updateTopScore() {
        const currentTotal = this.calculateTotalPoints();
        localStorage.setItem(this.topScoreKey, currentTotal.toString());
    }
    loadTopScore() {
        const topScore = this.getTopScore();
        if (topScore > 0) {
            this.score = topScore;
            this.addedScore = topScore;
        }
    }
    resetValues() {
        this.addedScore = 0;
        this.addedCoins = 0;
        this.addedTime = 0;
    }
}
