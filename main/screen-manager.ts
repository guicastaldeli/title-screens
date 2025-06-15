import { State } from "./state";
import { ScreenStates } from "./state";
import { intScreen } from "./screen.interface";
import { ProgramInfo } from "./main";
import { Buffers } from "./init-buffers";
import { Tick } from "./tick";

export class ScreenManager {
    private screens: Map<ScreenStates, intScreen> = new Map();

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

    public async switch(name: ScreenStates): Promise<void> {
        if(!this.screens.has(name)) throw new Error(`Screen ${name} not registered`);

        this.state.setLoading(true);

        try {
            if(!this.state.isInit(name)) {
                await this.screens.get(name)!.init();
                this.state.markInit(name);
            }

            this.state.setCurrentState(name);
            this.state.markInit(name);
        } catch(err) {
            console.log(err);
        } finally {
            this.state.setLoading(false);
        }
    }

    public getCurrentScreen(): intScreen | undefined {
        return this.screens.get(this.state.getCurrentState());
    }

    public update(deltaTime: number): void {
        if(!this.state.isRunning() || this.state.isLoading()) return;

        const currentScreen = this.screens.get(this.state.getCurrentState());
        currentScreen?.update(deltaTime);
    }
}