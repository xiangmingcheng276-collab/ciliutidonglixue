export const FLUID_VERTEX_SHADER = `
varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float uTime;
uniform vec2 uMouse;
uniform float uHoverState;
uniform float uSpeed;
uniform float uStrength;

// Simplex 3D Noise 
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

void main() {
  vUv = uv;
  vec3 pos = position;

  // Base fluid motion
  float noiseVal = snoise(vec3(pos.x * 2.0, pos.y * 2.0, uTime * uSpeed * 0.2));
  float noiseVal2 = snoise(vec3(pos.x * 4.0 - uTime * 0.1, pos.y * 4.0 + uTime * 0.1, uTime * 0.3));
  
  // Turbulent fractal layering
  float elevation = noiseVal * 0.5 + noiseVal2 * 0.25;
  
  // Interaction (Magnetic Influence)
  float dist = distance(uv, uMouse);
  float influence = smoothstep(0.4, 0.0, dist) * uHoverState * uStrength;
  
  // Ripple/Wave effect from interaction
  float wave = sin(dist * 20.0 - uTime * 5.0) * influence * 0.5;
  
  // Combine
  elevation += influence * 1.5 + wave;
  
  // Apply to Z
  pos.z += elevation * 0.8;
  
  vElevation = elevation;
  
  // Recalculate normal approximation for lighting in frag
  vNormal = normal; // Simplified, will do shading tricks in frag
  
  vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
  vViewPosition = -modelViewPosition.xyz;
  gl_Position = projectionMatrix * modelViewPosition;
}
`;

export const FLUID_FRAGMENT_SHADER = `
varying vec2 vUv;
varying float vElevation;
varying vec3 vViewPosition;

uniform float uTime;
uniform vec3 uColorCold;
uniform vec3 uColorHot;
uniform float uColorTemp;

void main() {
    // Reconstruct normals from derivatives for sharp fluid ridges
    vec3 xTangent = dFdx( vViewPosition );
    vec3 yTangent = dFdy( vViewPosition );
    vec3 faceNormal = normalize( cross( xTangent, yTangent ) );
    
    // View direction
    vec3 viewDir = normalize(vViewPosition);
    
    // Fresnel Effect (Iridescence)
    float fresnel = pow(1.0 - dot(faceNormal, viewDir), 2.0);
    
    // Color Ramp based on elevation (Magnetic Strength)
    // Map elevation -0.5 to 1.5 to 0.0 - 1.0
    float mixFactor = smoothstep(-0.2, 1.0, vElevation);
    
    // Heat Color (Black Body Radiation approximation)
    vec3 cold = uColorCold;
    vec3 hot = uColorHot;
    vec3 color = mix(cold, hot, mixFactor * uColorTemp);
    
    // Add iridescent fringe at edges
    vec3 iridescence = 0.5 + 0.5 * cos(uTime * 0.5 + vUv.xyx * 3.0 + vec3(0,2,4));
    color += iridescence * fresnel * 0.3;
    
    // Specular Highlight (Liquid Metal look)
    vec3 lightDir = normalize(vec3(1.0, 1.0, 2.0));
    vec3 halfVector = normalize(lightDir + viewDir);
    float NdotH = max(0.0, dot(faceNormal, halfVector));
    float specular = pow(NdotH, 64.0); // Sharp highlights for metal
    
    // Combine
    vec3 finalColor = color + vec3(specular) * 0.8;
    
    // Darken deep valleys
    finalColor *= smoothstep(-0.8, 0.0, vElevation) * 0.5 + 0.5;

    gl_FragColor = vec4(finalColor, 1.0);
    
    // Glow output (simple brightness thresholding for bloom pass to pick up)
    // We boost the alpha or brightness for very hot areas if using selective bloom, 
    // but here we just rely on high color values.
}
`;

export const PARTICLES_VERTEX_SHADER = `
uniform float uTime;
attribute float aScale;
varying float vAlpha;

void main() {
    vec3 pos = position;
    
    // Flow along magnetic lines (fake via noise)
    float t = uTime * 0.5;
    pos.x += sin(pos.y * 4.0 + t) * 0.1;
    pos.y += cos(pos.x * 4.0 + t) * 0.1;
    pos.z += sin(pos.x * 10.0 + t) * 0.1;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = aScale * (30.0 / -mvPosition.z);
    
    vAlpha = smoothstep(5.0, 0.0, distance(pos, vec3(0.0)));
}
`;

export const PARTICLES_FRAGMENT_SHADER = `
varying float vAlpha;

void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 2.0);
    
    gl_FragColor = vec4(0.8, 0.9, 1.0, vAlpha * glow);
}
`;
