import { dkInitBackgroundPositionBuffer } from "./screens/dk/buffers.js";
import { dkInitBackgroundColorBuffer } from "./screens/dk/buffers.js";
import { dkInitTilePositionBuffer } from "./screens/dk/buffers.js";
import { dkInitTileColorBuffer } from "./screens/dk/buffers.js";
import { smbInitBackgroundPositionBuffer } from "./screens/smb2/buffer.js";
import { smbInitBackgroundColorBuffer } from "./screens/smb2/buffer.js";
export function initBuffers(gl) {
    const positionBuffer = initPositionBuffer(gl);
    const colorBuffer = initColorBuffer(gl);
    //Screens
    //Dk
    const dkBackgroundPositionBuffer = dkInitBackgroundPositionBuffer(gl);
    const dkBackgroundColorBuffer = dkInitBackgroundColorBuffer(gl);
    const dkTilePositionBuffer = dkInitTilePositionBuffer(gl);
    const dkTileColorBuffer = dkInitTileColorBuffer(gl);
    //SMB
    const smbBackgroundPositionBuffer = smbInitBackgroundPositionBuffer(gl);
    const smbBackgroundColorBuffer = smbInitBackgroundColorBuffer(gl);
    //
    return {
        position: positionBuffer,
        color: colorBuffer,
        dkBackgroundPosition: dkBackgroundPositionBuffer,
        dkBackgroundColor: dkBackgroundColorBuffer,
        dkTilePosition: dkTilePositionBuffer,
        dkTileColor: dkTileColorBuffer,
        smbBackgroundPosition: smbBackgroundPositionBuffer,
        smbBackgroundColor: smbBackgroundColorBuffer
    };
}
function initPositionBuffer(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const canvas = (gl.canvas);
    const w = canvas.width;
    const h = canvas.height;
    const aspectRatio = w / h;
    const positions = [
        -1.0 * aspectRatio, -1.0,
        1.0 * aspectRatio, -1.0,
        -1.0 * aspectRatio, 1.0,
        1.0 * aspectRatio, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return positionBuffer;
}
function initColorBuffer(gl) {
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
