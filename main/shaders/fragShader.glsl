precision highp float;

varying lowp vec4 vColor;

varying highp vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform bool uTex;

void main() {
    if(uTex) {
        vec4 tex = texture2D(uSampler, vTextureCoord);
        gl_FragColor = tex;
    } else {
        gl_FragColor = vColor;
    }
}