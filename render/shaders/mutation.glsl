export const MUTATION_VERTEX_SHADER = `
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vUv;

uniform float uMutationTime;
uniform float uMutationMeter;
uniform float uVegetationSway;
uniform float uVegetationColorShift;
uniform float uStructureHueOffset;
uniform float uStructureEdgeGlow;

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

void main() {
  vUv = uv;
  vec3 displaced = position;
  float noise = hash31(position + vec3(uMutationTime * 0.17));
  float pulse = sin((position.x + position.z) * 0.19 + uMutationTime * 1.8);
  displaced.y += pulse * (uVegetationSway * 0.55) * (0.35 + noise) * uMutationMeter;
  displaced.xz += normal.xz * uMutationMeter * 0.015;

  vec4 world = modelMatrix * vec4(displaced, 1.0);
  vWorldPosition = world.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const MUTATION_FRAGMENT_SHADER = `
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vUv;

uniform float uMutationTime;
uniform float uMutationMeter;
uniform float uMutationResidualFloor;
uniform float uVegetationColorShift;
uniform float uStructureHueOffset;
uniform float uStructureEdgeGlow;

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  float base = 0.35 + vWorldNormal.y * 0.45;
  float shimmer = sin(vWorldPosition.x * 0.05 + vWorldPosition.z * 0.08 + uMutationTime * 0.9) * 0.5 + 0.5;
  float meter = max(uMutationMeter, uMutationResidualFloor);
  vec3 color = vec3(0.18, 0.42, 0.21);
  color += vec3(0.05, 0.03, 0.09) * shimmer * meter;

  vec3 hsv = rgb2hsv(color);
  hsv.x = fract(hsv.x + uVegetationColorShift * meter + uStructureHueOffset * 0.35);
  hsv.y = clamp(hsv.y + meter * 0.45, 0.0, 1.0);
  hsv.z = clamp(base + meter * 0.28, 0.0, 1.0);

  vec3 mutated = hsv2rgb(hsv);
  float edge = pow(1.0 - clamp(dot(normalize(vWorldNormal), vec3(0.0, 1.0, 0.0)), 0.0, 1.0), 2.2);
  mutated += vec3(0.4, 0.2, 0.65) * edge * uStructureEdgeGlow * meter;

  gl_FragColor = vec4(mutated, 1.0);
}
`;
