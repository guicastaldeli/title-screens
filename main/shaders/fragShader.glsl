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
uniform bool isLava;
uniform bool needTransp;
uniform bool isPlayer;
uniform bool isCloud;
uniform bool previewTransp;
uniform bool isHovered;
uniform bool isShadow;

uniform float uState;
uniform float hoverProgress;
uniform float cloudDepth;

uniform vec4 uColor;
uniform float uThreshold;
uniform vec2 uTextStartPos;

void main() {
    vec4 tex = texture2D(uSampler, vTextureCoord);

    if(haveState) {
        float overworldState = 0.1;
        float undergroundState = 1.1;
        float underwaterState = 2.1;

        if(!uTex && !isText && !isHud && !isCursor) {
            vec4 tileColor = vColor;

            if(uState < overworldState) {
                tileColor = vec4(0.580, 0.580, 1.0, 1.0);
            } else if(uState < undergroundState) {
                tileColor = vec4(0.0, 0.0, 0.0, 1.0);
            } else if(uState < underwaterState) {
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

                float waveSpeed = 1.0;
                float waveFrequency = 10.0;
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
            vec3 selectedColor = vec3(0.9176, 0.9176, 0.9176);

            float waveSpeed = 0.8;
            float waveFrequency = 5.0;
            float waveWidth = 2.0;
                
            float wavePos = (gl_FragCoord.x / 100.0 - uTime * waveSpeed) * waveFrequency;
            float waveFactor = sin(wavePos) * 0.5 + 0.5;
            vec3 waveColor = mix(darkGray, selectedColor, smoothstep(0.5 - waveWidth, 0.5 + waveWidth, waveFactor));

            vec3 finalColor = mix(tex.rgb, waveColor, waveFactor);
            gl_FragColor = vec4(finalColor, tex.a);
        } else {
            gl_FragColor = vec4(mix(tex.rgb, tex.rgb * uColor.rgb, alpha), tex.a);
        }

        return;
    }

    if(isHudText) {
        vec4 color = vec4(0.580, 0.580, 1.0, 1.0);
        float threshold = 0.1;
        if(length(tex.rgb - color.rgb) < threshold) discard;
    }

    if(needTransp) {
        vec4 fColor = vec4(0.580, 0.580, 1.0, 1.0);
        vec4 sColor = vec4(0.0, 0.160784, 0.54902, 1.0);
        vec4 tColor = vec4(0.8902, 0.0118, 0.9529, 1.0);
        vec4 frColor = vec4(0.5843, 0.2275, 0.6471, 1.0);
        vec3 threshold = vec3(0.1);

        bool fIsTransp = all(lessThan(abs(tex.rgb - fColor.rgb), threshold));
        bool sIsTransp = all(lessThan(abs(tex.rgb - sColor.rgb), threshold));
        bool tIsTransp = all(lessThan(abs(tex.rgb - tColor.rgb), threshold));
        bool frIsTransp = all(lessThan(abs(tex.rgb - frColor.rgb), threshold));
        if(fIsTransp || sIsTransp || tIsTransp || frIsTransp) discard;

        if(isPlayer) {
            if(haveState && abs(uState - 2.0) < 0.01) {
                float intensity = 0.3;
                vec4 color = vec4(0.2588, 0.2588, 1.0, 1.0);
                tex.rgb = mix(tex.rgb, color.rgb, intensity * tex.a);
                gl_FragColor = vec4(tex.rgb, tex.a);
                return;
            } else {
                gl_FragColor = tex;
                return;
            }
        }

        if(isCloud && cloudDepth < 0.8) {
            float intensity = 0.5;
            vec4 color = vec4(0.2588, 0.2588, 1.0, 1.0);
            tex.rgb = mix(tex.rgb, color.rgb, intensity * tex.a);
            gl_FragColor = vec4(tex.rgb, tex.a);
            return;
        }
    }

    if(previewTransp) {
        vec4 color = vec4(0.8902, 0.0118, 0.9529, 1.0);
        vec3 threshold = vec3(0.1);

        bool isTransp = all(lessThan(abs(tex.rgb - color.rgb), threshold));
        if(isTransp) discard;

        float targetAlpha = isHovered ? 1.0 : 0.5;
        float currentAlpha = mix(0.5, 1.0, hoverProgress);
        gl_FragColor = vec4(tex.rgb, tex.a * currentAlpha);
        return;

        if(isShadow) {
            float targetAlpha = isHovered ? hoverProgress : 0.5;
            vec4 color = vec4(tex.rgb, tex.a * targetAlpha);
            gl_FragColor = color;
            return;
        }
    }

    if(isLava) {
        vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
        float threshold = 0.1;
        if(length(tex.rgb - color.rgb) < threshold) discard;
    }
}