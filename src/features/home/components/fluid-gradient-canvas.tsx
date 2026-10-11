'use client';

import { useEffect, useRef } from 'react';

// WebGL 1: broad, domain-warped colour ribbons instead of moving CSS ellipses.
// No external 3D dependency, images, or per-frame React renders.
const vertexShader = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

float ribbon(float distanceToCenter, float width) {
  return 1.0 - smoothstep(width * 0.55, width, abs(distanceToCenter));
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  float t = u_time;
  // Slow domain warping: contours bend and stretch like liquid, without flashing.
  vec2 flow = p;
  flow.x += 0.16 * sin(flow.y * 3.4 + t * 0.55);
  flow.y += 0.13 * sin(flow.x * 3.9 - t * 0.43);
  flow.x += 0.065 * sin(flow.y * 8.0 - t * 0.36);
  flow.y += 0.045 * sin(flow.x * 7.0 + t * 0.40);

  // Independent winding trajectories, with rounded edges and variable thickness.
  float pinkCenter = -0.31
    + 0.38 * sin(flow.y * 2.65 + t * 0.57)
    + 0.105 * sin(flow.y * 6.0 - t * 0.31);
  float blueCenter = 0.30
    + 0.36 * sin(flow.y * 2.3 - t * 0.46 + 1.65)
    + 0.13 * cos(flow.y * 5.6 + t * 0.32);
  float creamCenter = 0.10
    + 0.29 * sin(flow.y * 2.2 + t * 0.35 + 3.0);

  float pink = ribbon(flow.x - pinkCenter, 0.28 + 0.09 * sin(flow.y * 4.2 - t * 0.55));
  float blue = ribbon(flow.x - blueCenter, 0.32 + 0.10 * sin(flow.y * 3.8 + t * 0.48));
  float cream = ribbon(flow.x - creamCenter, 0.18 + 0.07 * cos(flow.y * 3.4 - t * 0.36));

  // Soft light background and Figma's pink / cyan / cream palette.
  vec3 base = mix(vec3(0.973, 0.893, 0.924), vec3(0.814, 0.921, 0.934),
                  smoothstep(-0.85, 0.82, p.x));
  vec3 color = mix(base, vec3(1.0, 0.57, 0.78), pink * 0.83);
  color = mix(color, vec3(0.48, 0.81, 0.88), blue * 0.78);
  color = mix(color, vec3(0.994, 0.956, 0.901), cream * 0.72);
  // Subtle veil keeps colour transitions atmospheric, never neon.
  color = mix(color, vec3(0.965, 0.936, 0.930), 0.08);
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

export function FluidGradientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
        gl.viewport(0, 0, width, height);
      }
    };

    let raf = 0;
    let visible = true;
    let lastDraw = -1000;
    let elapsed = 0;
    let previous = 0;
    let running = true;
    const render = (now: number) => {
      if (!running) return;
      raf = window.requestAnimationFrame(render);
      if (!visible || document.hidden) {
        previous = 0;
        return;
      }
      if (now - lastDraw < 33) return;
      elapsed += previous === 0 ? 0 : Math.min(0.05, (now - previous) / 1000);
      previous = now;
      lastDraw = now;
      resize();
      gl.uniform2f(sizeLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (canvas.style.opacity !== '1') canvas.style.opacity = '1';
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      previous = 0;
    }, { threshold: 0 });
    observer.observe(canvas);
    raf = window.requestAnimationFrame(render);

    return () => {
      running = false;
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.style.opacity = '0';
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvasRef} className="home-atmosphere__canvas" aria-hidden="true" />;
}
