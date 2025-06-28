type Callback = (data?: any) => void;

export class EventEmitter {
    private static listeners: Map<string, Callback[]> = new Map();

    static on(event: string, callback: Callback) {
        if(!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        this.listeners.get(event)!.push(callback);
    }

    static emit(event: string, data?: any) {
        this.listeners.get(event)?.forEach(cb => cb(data));
    }
}