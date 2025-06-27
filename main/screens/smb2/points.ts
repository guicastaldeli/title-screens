import { Tick } from "../../tick";

export class Points {
    private tick: Tick;
    private score: number = 0;
    private coins: number = 0;
    private time: number = 999;
    private timerInterval: number | null = null;
    private lastUpdateTime: number = 0;
    private listeners: (() => void)[] = [];

    private addedScore: number = 0;
    private addedCoins: number = 0;
    private addedTime: number = 0;
    private topScoreKey = 'smb-top-score';
    private sessionScoreKey = 'smb-session-score';

    private readonly maxScore = 999999;
    private readonly maxCoins = 99;
    private readonly maxTime = 999;

    constructor(tick: Tick) {
        this.tick = tick;
        this.startTimer(this.tick.timeScale);
        this.loadTopScore();
    }

    private startTimer(timeScale: number): void {
        const deltaTime = timeScale * 10000;

        if(this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = window.setInterval(() => {
            this.updateTime();
        }, deltaTime);
    }

    private updateTime(): void {
        if(this.time > 0) {
            this.time--;
        } else {
            this.time = this.maxTime;
        }
    }

    public addScore(points: number): void {
        const currentPoints = Math.min(this.score + points, this.maxScore); 
        this.score = currentPoints;
        this.addedScore = currentPoints;
    }

    public addCoin(): void {
        const count = 1;
        const currentCoins = Math.min(this.coins + count, this.maxCoins);
        this.coins = currentCoins;
        this.addedCoins = currentCoins;
    }

    public addTime(): void {
        const sec = 10;
        const currentTime = Math.min(this.time + sec, this.maxTime);
        this.time = currentTime;
        this.addedTime = currentTime;
    }

    public getScore(): string {
        return this.score.toString().padStart(6, '0').substring(0, 6);
    }

    public getCoins(): string {
        return this.coins.toString().padStart(2, '0');
    }

    public getTime(): string {
        return this.time.toString().padStart(3, '0');
    }

    public addListener(cb: () => void): void {
        this.listeners.forEach(cb => cb());
    }

    public calculateTotalPoints(): number {
        const coins = 100;
        const time = 10;
        return this.addedScore + (this.addedCoins * coins) + (this.addedTime * time);
    }

    public getTopScore(): number {
        const topScore = localStorage.getItem(this.topScoreKey);
        return topScore ? parseInt(topScore, 10) : 0;
    }

    public updateTopScore(): void {
        const currentTotal = this.calculateTotalPoints();
        localStorage.setItem(this.topScoreKey, currentTotal.toString());
    }

    private loadTopScore(): void {
        const topScore = this.getTopScore();

        if(topScore > 0) {
            this.score = topScore;
            this.addedScore = topScore;
        }
    }

    public resetValues(): void {
        this.addedScore = 0;
        this.addedCoins = 0;
        this.addedTime = 0;
    }
}