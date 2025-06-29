import { State } from "./state.js";
import { ScreenStates } from "./state.js";
import { intScreen } from "./screen.interface";
import { ProgramInfo } from "./main";
import { Buffers } from "./init-buffers";
import { Tick } from "./tick";
import { EventEmitter } from "./event-emitter.js";

export class ScreenManager {
    private screens: Map<ScreenStates, intScreen> = new Map();
    public lastScreen: ScreenStates = ScreenStates.Dk;

    constructor(
        private state: State,
        private gl: WebGLRenderingContext,
        private programInfo: ProgramInfo,
        private buffers: Buffers,
        private tick: Tick
    ) {
        this.state = state;
        this.gl = gl;
        this.programInfo = programInfo;
        this.buffers = buffers;
        this.tick = tick;
    }

    public registerScreen(name: ScreenStates, screen: intScreen): void {
        this.screens.set(name, screen);
    }

    public async current(name: ScreenStates): Promise<void> {
        if(!this.screens.has(name)) throw new Error(`Screen ${name} not registered`);

        this.state.setLoading(true);

        try {
            if(!this.state.isInit(name)) {
                await this.screens.get(name)!.init();
                this.state.markInit(name);
            }

            const prevScreen = this.state.getCurrentState();
            this.state.setCurrentState(name);

            EventEmitter.emit('screen-changed', {
                prev: prevScreen,
                current: name,
                isInit: this.state.isInit(name)
            });
        } catch(err) {
            console.log(err);
        } finally {
            this.state.setLoading(false);
        }
    }

    public getCurrentScreen(): intScreen | undefined {
        return this.screens.get(this.state.getCurrentState());
    }

    public currentScreen(): ScreenStates {
        return this.state.getCurrentState();
    }

    public setCurrentScreen(screen: ScreenStates): void {
        let currentScreen = this.state.getCurrentState();
        this.lastScreen = currentScreen
        currentScreen = screen;
    }

    public update(deltaTime: number): void {
        if(!this.state.isRunning() || this.state.isLoading()) return;

        const currentScreen = this.screens.get(this.state.getCurrentState());
        currentScreen?.update(deltaTime);
    }
}