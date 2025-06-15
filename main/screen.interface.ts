import { State } from "./state.js";
import { ProgramInfo } from "./main.js";
import { Buffers } from "./init-buffers.js";
import { Tick } from "./tick.js";

export interface intScreen {
    init(): void;
    update(deltaTime: number): void;
    clear?(): void;
}

export abstract class BaseScreen implements intScreen {
    constructor(
        protected state: State,
        protected gl: WebGLRenderingContext,
        protected programInfo: ProgramInfo,
        protected buffers: Buffers,
        protected tick: Tick,
    ) {
        this.state = state;
        this.gl = gl;
        this.programInfo = programInfo;
        this.buffers = buffers;
        this.tick = tick;
    }

    abstract init(): void;
    abstract update(deltaTime: number): void;
}