export class Points {
    constructor() {
        this.score = 0;
        this.coins = 0;
    }
    addScore(points) {
        this.score += points;
    }
    addCoin() {
        this.coins += 1;
    }
    getScore() {
        return this.score.toString().padStart(6, '0').substring(0, 6);
    }
    getCoins() {
        return this.coins.toString().padStart(2, '0');
    }
}
