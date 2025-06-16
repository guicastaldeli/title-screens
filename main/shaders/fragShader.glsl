precision highp float;

varying lowp vec4 vColor;

varying highp vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform bool uTex;
uniform bool isText;
uniform bool isCursor;

uniform vec4 uColor;
uniform float uThreshold;

void main() {
    vec4 tex = texture2D(uSampler, vTextureCoord);
    
    if(uTex) {
        if(isText) {
            float brightness = (tex.r + tex.g + tex.b) / 3.0;
            vec4 backgroundColor = vec4(0.0, 0.0, 0.0, 1.0);
            float alpha = step(0.1, brightness);
            gl_FragColor = mix(backgroundColor, uColor, alpha);
        } else if(isCursor) {
            vec3 purple = vec3(0.502, 0.0, 0.502);
            float threshold = 0.1;

            if(distance(tex.rgb, purple) < threshold) {
                discard;
            } else {
                gl_FragColor = tex;
            }
        } else {
            gl_FragColor = tex;
        }
    } else {
        gl_FragColor = vColor;
    }
}