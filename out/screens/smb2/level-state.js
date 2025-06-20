import { States } from "./texture-map.interface.js";
export class LevelState {
    constructor() {
        this.state = States.Overworld;
    }
    getCurrentState() {
        return this.state;
    }
    setCurrentState(state) {
        this.state = state;
    }
    getState() {
        return this.state;
    }
    toggleState() {
        switch (this.state) {
            case States.Overworld:
                this.state = States.Underground;
                break;
            case States.Underground:
                this.state = States.Castle;
                break;
            case States.Castle:
                this.state = States.Overworld;
                break;
            default:
                this.state = States.Overworld;
        }
    }
}
