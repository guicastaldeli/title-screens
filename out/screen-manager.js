var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ScreenStates } from "./state.js";
import { EventEmitter } from "./event-emitter.js";
export class ScreenManager {
    constructor(state, gl, programInfo, buffers, tick) {
        this.state = state;
        this.gl = gl;
        this.programInfo = programInfo;
        this.buffers = buffers;
        this.tick = tick;
        this.screens = new Map();
        this.lastScreen = ScreenStates.Dk;
        this.state = state;
        this.gl = gl;
        this.programInfo = programInfo;
        this.buffers = buffers;
        this.tick = tick;
    }
    registerScreen(name, screen) {
        this.screens.set(name, screen);
    }
    current(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.screens.has(name))
                throw new Error(`Screen ${name} not registered`);
            this.state.setLoading(true);
            try {
                if (!this.state.isInit(name)) {
                    yield this.screens.get(name).init();
                    this.state.markInit(name);
                }
                const prevScreen = this.state.getCurrentState();
                this.state.setCurrentState(name);
                EventEmitter.emit('screen-changed', {
                    prev: prevScreen,
                    current: name,
                    isInit: this.state.isInit(name)
                });
            }
            catch (err) {
                console.log(err);
            }
            finally {
                this.state.setLoading(false);
            }
        });
    }
    getCurrentScreen() {
        return this.screens.get(this.state.getCurrentState());
    }
    currentScreen() {
        return this.state.getCurrentState();
    }
    setCurrentScreen(screen) {
        let currentScreen = this.state.getCurrentState();
        this.lastScreen = currentScreen;
        currentScreen = screen;
    }
    update(deltaTime) {
        if (!this.state.isRunning() || this.state.isLoading())
            return;
        const currentScreen = this.screens.get(this.state.getCurrentState());
        currentScreen === null || currentScreen === void 0 ? void 0 : currentScreen.update(deltaTime);
    }
}
