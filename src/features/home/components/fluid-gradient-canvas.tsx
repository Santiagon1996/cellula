'use client';

import { useEffect, useRef } from 'react';

// WebGL 1: broad, domain-warped colour ribbons with an independent animation clock.
// No external 3D dependency, images, or per-frame React renders.
const vertexShader = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShader = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform float u_time;

float ribbon(float distanceToCenter, float width) {
  return 1.0 - smoothstep(width * 0.24, width, abs(distanceToCenter));
}

void main() {
  // Frame the composition by both dimensions so wide screens also contain flow.
  vec2 p = (gl_FragCoord.xy / u_resolution - 0.5) * vec2(1.6, 1.25);
  float t = u_time;
  // Overlapping waves stretch and fold the ribbons continuously, even at rest.
  vec2 flow = p;
  flow.x += 0.23 * sin(p.y * 3.6 + t * 0.72);
  flow.y += 0.19 * sin(p.x * 3.4 - t * 0.61);
  flow.x += 0.10 * sin(flow.y * 7.0 - t * 0.48);
  flow.y += 0.08 * sin(flow.x * 6.0 + t * 0.54);

  // Independent winding trajectories, with rounded edges and variable thickness.
  float pinkCenter = -0.44
    + 0.36 * sin(flow.y * 2.8 + t * 0.78)
    + 0.12 * sin(flow.y * 5.8 - t * 0.46);
  float blueCenter = 0.42
    + 0.37 * sin(flow.y * 2.5 - t * 0.69 + 1.65)
    + 0.12 * cos(flow.y * 5.4 + t * 0.43);
  float creamCenter = 0.06
    + 0.38 * sin(flow.y * 2.3 + t * 0.57 + 3.0);
  float lavenderCenter = -0.02
    + 0.46 * sin(flow.y * 2.6 - t * 0.64 + 4.6)
    + 0.10 * cos(flow.y * 5.0 + t * 0.51);

  float pink = ribbon(flow.x - pinkCenter, 0.33 + 0.09 * sin(flow.y * 4.2 - t * 0.67));
  float blue = ribbon(flow.x - blueCenter, 0.35 + 0.09 * sin(flow.y * 3.8 + t * 0.63));
  float cream = ribbon(flow.x - creamCenter, 0.25 + 0.07 * cos(flow.y * 3.4 - t * 0.52));
  float lavender = ribbon(flow.x - lavenderCenter, 0.29 + 0.08 * sin(flow.y * 4.0 + t * 0.59));

  // Normalized weights preserve every pastel, including cream and lavender,
  // without a final opaque layer washing out the other moving contours.
  vec4 weights = pow(vec4(pink, blue, cream, lavender), vec4(1.4))
    * vec4(1.2, 1.15, 0.85, 1.05);
  vec3 color = (vec3(0.975, 0.940, 0.911) * 0.18
    + vec3(0.978, 0.666, 0.815) * weights.x
    + vec3(0.600, 0.828, 0.905) * weights.y
    + vec3(0.997, 0.961, 0.864) * weights.z
    + vec3(0.785, 0.711, 0.908) * weights.w)
    / (0.18 + dot(weights, vec4(1.0)));
  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('CÉLULA fluid shader unavailable:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function startRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  });
  if (!gl) return; // CSS pastel fallback stays visible.

  const vert = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
  if (!vert || !frag) {
    if (vert) gl.deleteShader(vert);
    if (frag) gl.deleteShader(frag);
    return;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vert);
    gl.deleteShader(frag);
    return;
  }

  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('CÉLULA fluid program unavailable:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return;
  }

  const buffer = gl.createBuffer();
  const position = gl.getAttribLocation(program, 'a_position');
  const timeLocation = gl.getUniformLocation(program, 'u_time');
  const sizeLocation = gl.getUniformLocation(program, 'u_resolution');
  if (!buffer || position < 0 || !timeLocation || !sizeLocation) {
    if (buffer) gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
  ]), gl.STATIC_DRAW);
  gl.useProgram(program);
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const resize = () => {
    // Limit GPU fill-rate on high-density phones and older laptops.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.4);
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
  };

  let raf = 0;
  let visible = true;
  let lastDraw = 0;
  let elapsed = 0;
  let previous: number | null = null;
  let running = true;

  const draw = () => {
    gl.uniform2f(sizeLocation, canvas.width, canvas.height);
    gl.uniform1f(timeLocation, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  const render = (now: number) => {
    if (!running) return;
    raf = window.requestAnimationFrame(render);
    if (!visible || document.hidden) {
      previous = null;
      return;
    }
    // Advance in real seconds, independently of the GPU's frame rate.
    if (previous !== null) elapsed += (now - previous) / 1000;
    previous = now;
    // Leave room for fractional RAF timestamps at 60 Hz.
    if (now - lastDraw < 33) return;
    lastDraw = now;
    draw();
  };

  const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting !== visible) previous = null;
    visible = entry.isIntersecting;
  });
  observer?.observe(canvas);

  const onResize = () => {
    resize();
    if (visible && !document.hidden) draw();
  };
  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
  resizeObserver?.observe(canvas);
  window.addEventListener('resize', onResize);
  const onVisibilityChange = () => { previous = null; };
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Paint immediately; reveal only a successfully initialized WebGL surface.
  resize();
  draw();
  canvas.style.opacity = '1';
  raf = window.requestAnimationFrame(render);

  return () => {
    running = false;
    window.cancelAnimationFrame(raf);
    observer?.disconnect();
    resizeObserver?.disconnect();
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    canvas.style.opacity = '0';
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  };
}

export function FluidGradientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let dispose: (() => void) | undefined;
    let contextLost = false;
    const stop = () => {
      dispose?.();
      dispose = undefined;
      canvas.style.opacity = '0';
    };
    const start = () => {
      if (!motionPreference.matches && !contextLost && !dispose) dispose = startRenderer(canvas);
    };
    const onMotionChange = () => { stop(); start(); };
    const onContextLost = (event: Event) => { event.preventDefault(); contextLost = true; stop(); };
    const onContextRestored = () => { contextLost = false; start(); };

    motionPreference.addEventListener('change', onMotionChange);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);
    start();

    return () => {
      stop();
      motionPreference.removeEventListener('change', onMotionChange);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
    };
  }, []);

  return <canvas ref={canvasRef} className="home-atmosphere__canvas" aria-hidden="true" />;
}
