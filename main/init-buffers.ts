
import { initBackgroundPositionBuffer } from "./screens/dk/buffers.js";
import { initBackgroundColorBuffer } from "./screens/dk/buffers.js";

export interface Buffers {
    position: WebGLBuffer,
    color: WebGLBuffer,

    dkBackgroundPosition: WebGLBuffer,
    dkBackgroundColor: WebGLBuffer
}

export function initBuffers(gl: WebGLRenderingContext): Buffers {
    const positionBuffer = initPositionBuffer(gl);
    const colorBuffer = initColorBuffer(gl);

    //Dk
    const dkBackgroundPositionBuffer = initBackgroundPositionBuffer(gl);
    const dkBackgroundColorBuffer = initBackgroundColorBuffer(gl);

    return { 
        position: positionBuffer,
        color: colorBuffer,

        dkBackgroundPosition: dkBackgroundPositionBuffer,
        dkBackgroundColor: dkBackgroundColorBuffer,
    }
}

function initPositionBuffer(gl: WebGLRenderingContext): WebGLBuffer {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const canvas = <HTMLCanvasElement>(gl.canvas);
    const w = canvas.width;
    const h = canvas.height;
    const aspectRatio = w / h;
    
    const positions = [
        -1.0 * aspectRatio, -1.0,
        1.0 * aspectRatio, -1.0,
        -1.0 * aspectRatio,  1.0,
        1.0 * aspectRatio,  1.0
    ];
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return positionBuffer;
}

function initColorBuffer(gl: WebGLRenderingContext): WebGLBuffer {
    const colors = [
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0 
    ];

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    return colorBuffer;
}