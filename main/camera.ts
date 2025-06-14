import { mat4 } from "../node_modules/gl-matrix/esm/index.js";

import { Tick } from "./tick.js";

interface ProgramInfo {
    program: WebGLProgram,
    attribLocations: {
        vertexPosition: number;
        vertexColor: number;
    }
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation | null;
        modelViewMatrix: WebGLUniformLocation | null
    }
}

interface Buffers {
    position: WebGLBuffer;
    color: WebGLBuffer;
}

export class Camera {
    private tick: Tick;
    private gl: WebGLRenderingContext;
    private programInfo: ProgramInfo;
    private buffers: Buffers;

    private rotation: number = 0.0;
    private speed: number = 1.0;

    constructor(
        tick: Tick,
        gl: WebGLRenderingContext,
        programInfo: ProgramInfo,
        buffers: Buffers
    ) {
        this.tick = tick;
        tick.addCall(this.update.bind(this));

        this.gl = gl;
        this.programInfo = programInfo;
        this.buffers = buffers;
    }

    private setCamera(): void {
        const canvas = <HTMLCanvasElement>(this.gl.canvas);
        this.gl.viewport(0, 0, canvas.width, canvas.height);
        
        const fov = (45 * Math.PI) / 180;
        const aspect = canvas.clientWidth / canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;

        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);
        const modelViewMatrix = mat4.create();

        mat4.translate(
            modelViewMatrix,
            modelViewMatrix,
            [-0.0, 0.0, -6.0]
        );
        
        mat4.rotate(
            modelViewMatrix,
            modelViewMatrix,
            this.rotation,
            [0, 0, 1]
        )

        this.setPositionAttribute();
        this.setColorAttribute();
        this.gl.useProgram(this.programInfo.program);

        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix
        );

        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix
        )

        const offset = 0;
        const vertexCount = 4;
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, vertexCount);
    }

    private setPositionAttribute(): void {
        const numComponents = 2;
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);

        this.gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );

        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
    }

    private setColorAttribute(): void {
        const numComponents = 4;
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.color);

        this.gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexColor,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );

        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);
    }

    public update(deltaTime: number): void {
        this.rotation += this.tick['speed'] * deltaTime;
        this.setCamera();
    }

    public init(): void {
        this.setCamera();
    }
}
