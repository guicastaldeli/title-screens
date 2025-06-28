var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { initBuffers } from "./init-buffers.js";
import { ScreenStates, State } from "./state.js";
import { ScreenManager } from "./screen-manager.js";
import { Contoller } from "./controller.js";
import { Tick } from "./tick.js";
import { Camera } from "./camera.js";
import { GlobalActions } from "./screens/global-actions.js";
import { ScreenDk } from "./screens/dk/main.js";
import { ScreenSmb } from "./screens/smb2/main.js";
const canvas = (document.getElementById('container'));
const gl = (canvas.getContext('webgl'));
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const tick = new Tick();
//State
let state;
let levelState;
let screenManager;
let controller;
let globalActions;
//Renders
//Camera
let renderCamera;
//Dk
let renderScreenDk;
//Smb
let renderScreenSmb;
//
function initShaders() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!gl)
            return null;
        try {
            const [vertexShaderSource, fragShaderSource] = yield Promise.all([
                loadShader('./shaders/vertexShader.glsl'),
                loadShader('./shaders/fragShader.glsl')
            ]);
            if (!vertexShaderSource || !fragShaderSource)
                return null;
            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            if (!vertexShader)
                return null;
            gl.shaderSource(vertexShader, vertexShaderSource);
            gl.compileShader(vertexShader);
            const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
            if (!fragShader)
                return null;
            gl.shaderSource(fragShader, fragShaderSource);
            gl.compileShader(fragShader);
            const shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragShader);
            gl.linkProgram(shaderProgram);
            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                console.log(gl.getProgramInfoLog(shaderProgram));
                return null;
            }
            return shaderProgram;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    });
}
function loadShader(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(url);
        if (!res.ok)
            throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return yield res.text();
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const shaderProgram = yield initShaders();
        if (!shaderProgram)
            return;
        const programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
                textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord')
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
                uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
                uTex: gl.getUniformLocation(shaderProgram, 'uTex'),
                isText: gl.getUniformLocation(shaderProgram, 'isText'),
                isCursor: gl.getUniformLocation(shaderProgram, 'isCursor'),
                uColor: gl.getUniformLocation(shaderProgram, 'uColor'),
                uThreshold: gl.getUniformLocation(shaderProgram, 'uThreshold'),
                uTime: gl.getUniformLocation(shaderProgram, 'uTime'),
                uTextStartPos: gl.getUniformLocation(shaderProgram, 'uTextStartPos'),
                isSelected: gl.getUniformLocation(shaderProgram, 'isSelected'),
                isHud: gl.getUniformLocation(shaderProgram, 'isHud'),
                isHudText: gl.getUniformLocation(shaderProgram, 'isHudText'),
                isShadowText: gl.getUniformLocation(shaderProgram, 'isShadowText'),
                uState: gl.getUniformLocation(shaderProgram, 'uState'),
                haveState: gl.getUniformLocation(shaderProgram, 'haveState'),
                isGround: gl.getUniformLocation(shaderProgram, 'isGround'),
                isLava: gl.getUniformLocation(shaderProgram, 'isLava'),
                needTransp: gl.getUniformLocation(shaderProgram, 'needTransp'),
                isPlayer: gl.getUniformLocation(shaderProgram, 'isPlayer'),
                uOpacity: gl.getUniformLocation(shaderProgram, 'uOpacity'),
                isCloud: gl.getUniformLocation(shaderProgram, 'isCloud'),
                cloudDepth: gl.getUniformLocation(shaderProgram, 'cloudDepth'),
                previewTransp: gl.getUniformLocation(shaderProgram, 'previewTransp'),
                isHovered: gl.getUniformLocation(shaderProgram, 'isHovered'),
                hoverProgress: gl.getUniformLocation(shaderProgram, 'hoverProgress'),
                isShadow: gl.getUniformLocation(shaderProgram, 'isShadow')
            }
        };
        gl.useProgram(programInfo.program);
        const buffers = initBuffers(gl);
        if (!buffers)
            return;
        //State
        state = new State();
        screenManager = new ScreenManager(state, gl, programInfo, buffers, tick);
        //Renders
        //Camera
        renderCamera = new Camera(tick, gl, programInfo, buffers, screenManager);
        renderCamera.init();
        //Dk
        renderScreenDk = new ScreenDk(tick, state, screenManager, gl, programInfo, buffers);
        screenManager.registerScreen(ScreenStates.Dk, renderScreenDk);
        //Smb
        renderScreenSmb = new ScreenSmb(tick, state, screenManager, gl, programInfo, buffers);
        screenManager.registerScreen(ScreenStates.Smb, renderScreenSmb);
        //
        yield screenManager.current(ScreenStates.Dk);
        controller = new Contoller(state, screenManager);
        globalActions = new GlobalActions(gl, buffers, programInfo, screenManager, controller);
        state.setLoading(false);
        state.setRunning(true);
        //Scene
        initScene(gl, programInfo, buffers);
    });
}
function initScene(gl, programInfo, buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
}
function handleResize(gl) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', () => __awaiter(void 0, void 0, void 0, function* () {
    handleResize(gl);
    yield renderScreenDk.init();
    renderScreenSmb.init();
}));
function __windowConfig() {
    if (!state)
        return;
    const current = state.getCurrentState();
    //Title
    const titles = {
        dk: 'Donkey Kong',
        smb: 'Super Mario Bros. 2: The Lost Levels'
    };
    const title = titles[current];
    document.title = title;
    //
    //Icon
    const icons = {
        dk: './assets/icon/dkfavicon.ico',
        smb: './assets/icon/smbfavicon.ico'
    };
    const icon = icons[current];
    const link = document.querySelector("link[rel*='icon'") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = icon;
    if (!document.querySelector("link[rel*='icon']"))
        document.getElementsByTagName('head')[0].appendChild(link);
    //
}
//Render
let initialized = false;
let then = 0;
function render() {
    return __awaiter(this, void 0, void 0, function* () {
        if (gl === null)
            return;
        const now = performance.now() * 0.001;
        const deltaTime = now - then;
        then = now;
        if (!initialized) {
            yield main();
            initialized = true;
        }
        __windowConfig();
        tick.update();
        renderCamera.update(deltaTime);
        screenManager.update(deltaTime);
        globalActions.init();
        requestAnimationFrame(render);
    });
}
//
function init() {
    handleResize(gl);
    render();
}
init();
