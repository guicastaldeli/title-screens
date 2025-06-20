import { States } from "./texture-map.interface.js";

export class LevelState {
    private state: States = States.Overworld;

    public getCurrentState(): States {
        return this.state;
    }

    public setCurrentState(state: States): void {
        this.state = state;
    }

    public getState(): States {
        return this.state;
    }

    public toggleState(): void {
        switch(this.state) {
            case States.Overworld:
                this.state = States.Underground;
                break;
            case States.Underground:
                this.state = States.Underwater;
                break;
            case States.Underwater:
                this.state = States.Castle
                break;
            case States.Castle:
                this.state = States.Overworld;
                break;
            default:
                this.state = States.Overworld;
        }
    }
}