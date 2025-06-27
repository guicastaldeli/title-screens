export class Points {
    private score: number = 0;
    private coins: number = 0;

    public addScore(points: number): void {
        this.score += points;
    }

    public addCoin(): void {
        this.coins += 1;
    }

    public getScore(): string {
        return this.score.toString().padStart(6, '0').substring(0, 6);
    }

    public getCoins(): string {
        return this.coins.toString().padStart(2, '0');
    }
}