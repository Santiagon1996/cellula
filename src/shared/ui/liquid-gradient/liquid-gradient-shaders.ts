/** Fullscreen ShaderMaterial shader; Three.js supplies position and uv attributes. */
export const liquidGradientVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/**
 * A continuous noise volume folds the whole colour field together. Colours have
 * no individual paths or blob centres. Palette uniforms are linear THREE.Color
 * values; the final shader chunk converts them to the renderer's output space.
 */
export const liquidGradientFragmentShader = `
uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_pink;
uniform vec3 u_blue;
uniform vec3 u_cream;
uniform vec3 u_lavender;

varying vec2 vUv;

float hash3(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}

float volumeNoise(vec3 p) {
  vec3 cell = floor(p);
  vec3 local = fract(p);
  // Quintic interpolation keeps velocity smooth through lattice boundaries.
  vec3 blend = local * local * local * (local * (local * 6.0 - 15.0) + 10.0);

  float lower = mix(
    mix(hash3(cell), hash3(cell + vec3(1.0, 0.0, 0.0)), blend.x),
    mix(hash3(cell + vec3(0.0, 1.0, 0.0)), hash3(cell + vec3(1.0, 1.0, 0.0)), blend.x),
    blend.y
  );
  float upper = mix(
    mix(hash3(cell + vec3(0.0, 0.0, 1.0)), hash3(cell + vec3(1.0, 0.0, 1.0)), blend.x),
    mix(hash3(cell + vec3(0.0, 1.0, 1.0)), hash3(cell + vec3(1.0, 1.0, 1.0)), blend.x),
    blend.y
  );
  return mix(lower, upper, blend.z);
}

float fluidNoise(vec3 p) {
  // Three octaves keep the masses broad and mobile GPU work bounded.
  float field = 0.57 * volumeNoise(p);
  p = p * 2.03 + vec3(7.1, 3.4, 5.2);
  field += 0.29 * volumeNoise(p);
  p = p * 2.01 + vec3(2.8, 8.3, 1.7);
  field += 0.14 * volumeNoise(p);
  return field;
}

void main() {
  // Uniform density across portrait and ultrawide displays, without edge masks.
  vec2 aspect = u_resolution / max(min(u_resolution.x, u_resolution.y), 1.0);
  vec2 p = (vUv - 0.5) * aspect * 2.65;
  float t = u_time * 0.28;

  vec2 bend = vec2(
    fluidNoise(vec3(p * 0.72, t) + vec3(2.7, 4.1, 1.8)),
    fluidNoise(vec3(p * 0.72, t) + vec3(8.3, 1.5, 6.2))
  ) - 0.5;

  vec2 flow = p + bend * 1.9;
  vec2 fold = vec2(
    fluidNoise(vec3(flow * 0.86, t * 0.83) + vec3(1.2, 9.4, 3.6)),
    fluidNoise(vec3(flow * 0.86, t * 0.83) + vec3(6.8, 2.1, 8.5))
  ) - 0.5;

  // Both palette fields sample the same folded domain, so neighbouring masses
  // stretch and merge together instead of behaving as separately drawn shapes.
  vec2 domain = flow + fold * 1.55;
  float temperature = fluidNoise(vec3(domain * 0.81, t * 0.91) + vec3(4.8, 2.6, 5.7));
  float depth = fluidNoise(vec3(domain * 0.89, t * 1.07) + vec3(9.1, 6.3, 2.4));
  float warm = smoothstep(0.40, 0.60, temperature);
  float light = smoothstep(0.40, 0.60, depth);

  // Weights sum to one, preserving distinct pastels through their transitions.
  vec3 warmColor = mix(u_pink, u_cream, light);
  vec3 coolColor = mix(u_blue, u_lavender, light);
  vec3 color = mix(coolColor, warmColor, warm);

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;
