import { Tick } from "../../tick";

export class Points {
    private tick: Tick;
    private score: number = 0;
    private coins: number = 0;
    private time: number = 999;
    private timerInterval: number | null = null;
    private lastUpdateTime: number = 0;
    private listeners: (() => void)[] = [];

    private readonly maxScore = 999999;
    private readonly maxCoins = 99;
    private readonly maxTime = 999;

    constructor(tick: Tick) {
        this.tick = tick;
        this.startTimer(this.tick.timeScale);
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
        this.score = Math.min(this.score + points, this.maxScore);
    }

    public addCoin(): void {
        const count = 1;
        this.coins = Math.min(this.coins + count, this.maxCoins);
    }

    public addTime(): void {
        const sec = 10;
        this.time = Math.min(this.time + sec, this.maxTime);
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
}