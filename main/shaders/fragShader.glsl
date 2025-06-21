precision highp float;

uniform float uTime;
varying lowp vec4 vColor;

varying highp vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform bool uTex;
uniform bool isText;
uniform bool isHud;
uniform bool isHudText;
uniform bool isShadowText;
uniform bool isCursor;
uniform bool isSelected;
uniform bool haveState;

uniform float uState;

uniform vec4 uColor;
uniform float uThreshold;
uniform vec2 uTextStartPos;

void main() {
    vec4 tex = texture2D(uSampler, vTextureCoord);

    if(haveState) {
        if(!uTex && !isText && !isHud && !isCursor) {
            vec4 tileColor = vColor;

            if(uState < 0.1) {
                tileColor = vec4(0.580, 0.580, 1.0, 1.0);
            } else if(uState < 1.1) {
                tileColor = vec4(0.0, 0.0, 0.0, 1.0);
            } else if(uState < 2.1) {
                tileColor = vec4(0.2588, 0.2588, 1.0, 1.0);
            } else {
                tileColor = vec4(0.0, 0.0, 0.0, 1.0);
            }

            gl_FragColor = tileColor;
            return;
        }
    }

    if(isHud) discard;
    
    if(uTex) {
        if(isText) {
            vec4 color = vec4(0.580, 0.580, 1.0, 1.0);
            float threshold = 0.1;
            if(length(tex.rgb - color.rgb) < threshold) discard;
            
            float brightness = (tex.r + tex.g + tex.b) / 3.0;
            vec4 backgroundColor = vec4(0.0, 0.0, 0.0, 1.0);

            float alpha = step(0.1, brightness);

            if(isSelected) {
                vec3 darkGray = vec3(0.6431, 0.6431, 0.6431);
                vec3 selectedColor = vec3(0.82745, 0.82745, 0.82745);

                float waveSpeed = 0.8;
                float waveFrequency = 5.0;
                float waveWidth = 2.0;
                
                float wavePos = (gl_FragCoord.x / 100.0 - uTime * waveSpeed) * waveFrequency;
                float waveFactor = sin(wavePos) * 0.5 + 0.5;

                vec3 waveColor = mix(darkGray, selectedColor, smoothstep(0.5 - waveWidth, 0.5 + waveWidth, waveFactor));
                vec3 finalColor = mix(backgroundColor.rgb, waveColor, alpha);
                gl_FragColor = vec4(finalColor, 1.0);
            } else {
                gl_FragColor = mix(backgroundColor, uColor, alpha);
            }
        } else if(isCursor) {
            vec3 blue = vec3(0.580, 0.580, 1.0);
            vec3 purple = vec3(0.502, 0.0, 0.502);
            float threshold = 0.1;

            if(distance(tex.rgb, purple) < threshold || distance(tex.rgb, blue) < threshold) {
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

    if(isShadowText && !isCursor) {
        vec4 color = vec4(0.580, 0.580, 1.0, 1.0);
        float threshold = 0.1;
        if(length(tex.rgb - color.rgb) < threshold) discard;

        float brightness = (tex.r + tex.g + tex.b) / 3.0;
        vec4 backgroundColor = vec4(0.0, 0.0, 0.0, 1.0);
        float alpha = step(0.1, brightness);

        if(isSelected) {
            vec3 darkGray = vec3(0.6431, 0.6431, 0.6431);
            vec3 selectedColor = vec3(0.82745, 0.82745, 0.82745);

            float waveSpeed = 0.8;
            float waveFrequency = 5.0;
            float waveWidth = 2.0;
                
            float wavePos = (gl_FragCoord.x / 100.0 - uTime * waveSpeed) * waveFrequency;
            float waveFactor = sin(wavePos) * 0.5 + 0.5;
            vec3 waveColor = mix(darkGray, selectedColor, smoothstep(0.5 - waveWidth, 0.5 + waveWidth, waveFactor));

            vec3 baseColor = mix(backgroundColor.rgb, waveColor, waveFactor);
            vec3 finalColor = mix(baseColor, tex.rgb, alpha);
            gl_FragColor = vec4(finalColor, 1.0);
        } else {
            gl_FragColor = mix(backgroundColor, uColor, alpha);
        }

        return;
    }

    if(isHudText) {
        vec4 color = vec4(0.580, 0.580, 1.0, 1.0);
        float threshold = 0.1;
        if(length(tex.rgb - color.rgb) < threshold) discard;
    }
}