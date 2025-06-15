import { initBuffers } from "./init-buffers.js";

import { Tick } from "./tick.js";
import { Camera } from "./camera.js";

import { ScreenDk } from "./screens/dk/main.js";

export interface ProgramInfo {
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

const canvas = <HTMLCanvasElement>(document.getElementById('container'));
const gl = <WebGLRenderingContext>(canvas.getContext('webgl'));

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const tick = new Tick();

//Renders
    //Camera
    let renderCamera: Camera;

    //Dk
    let renderScreenDk: ScreenDk;
//

async function initShaders(): Promise<WebGLProgram | null> {
    if(!gl) return null;

    try {
        const [vertexShaderSource, fragShaderSource] = await Promise.all([
            loadShader('./shaders/vertexShader.glsl'),
            loadShader('./shaders/fragShader.glsl')
        ]);

        if(!vertexShaderSource || !fragShaderSource) return null;

        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        if(!vertexShader) return null;
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);
    
        const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        if(!fragShader) return null;
        gl.shaderSource(fragShader, fragShaderSource);
        gl.compileShader(fragShader);

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragShader);
        gl.linkProgram(shaderProgram);
    
        if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.log(gl.getProgramInfoLog);
            return null;
        }
    
        return shaderProgram;
    } catch(err) {
        console.log(err);
        throw err;
    }
}

async function loadShader(url: string): Promise<string | null> {
    const res = await fetch(url);
    if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
    return await res.text();
}

async function main(): Promise<void> {
    const shaderProgram = await initShaders();
    if(!shaderProgram) return;

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor')
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix')
        }
    }

    gl.useProgram(programInfo.program);

    const buffers = initBuffers(gl);
    if(!buffers) return;

    //Renders
        //Dk
        renderScreenDk = new ScreenDk(tick, gl, programInfo, buffers);
        renderScreenDk.init();

        //Camera
        renderCamera = new Camera(tick, gl, programInfo, buffers);
        renderCamera.init();

        //Scene
        initScene(gl, programInfo, buffers);
    //
}

function initScene(
    gl: WebGLRenderingContext, 
    programInfo: any, 
    buffers: any
): void {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
}

function handleResize(gl: WebGLRenderingContext) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', () => {
    handleResize(gl);
    renderScreenDk.init();
});

//Render
    let initialized = false;
    let then = 0;

    async function render(): Promise<void> {
        if(gl === null) return;
        
        const now = performance.now() * 0.001;
        const deltaTime = now - then;
        then = now;

        if(!initialized) {
            await main();
            initialized = true;
        }

        tick.update(deltaTime);
        renderCamera.update(deltaTime);
        renderScreenDk.update(deltaTime);

        requestAnimationFrame(render);
    }
//

function init(): void {
    handleResize(gl);
    render();
}

init();