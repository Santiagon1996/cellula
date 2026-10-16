'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import type { OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, WebGLRenderer } from 'three';
import { cn } from '@/shared/lib/cn';
import { liquidGradientFragmentShader, liquidGradientVertexShader } from './liquid-gradient-shaders';
import { liquidGradientPoster } from './liquid-gradient-poster';
import styles from './liquid-gradient.module.css';

export type LiquidGradientPalette = readonly [pink: string, blue: string, cream: string, lavender: string];

type LiquidGradientProps = {
  className?: string;
  palette?: LiquidGradientPalette;
  speed?: number;
  priority?: boolean;
};

const pastelPalette: LiquidGradientPalette = liquidGradientPoster.palette;

// Temporary, opt-in audit instrumentation; removed after comparative captures.
function markPhase(phase: string) {
  if (typeof window !== 'undefined' && window.location.search.includes('liquid-perf=1')) {
    performance.mark(`liquid:${phase}`);
  }
}

type Surface = {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: OrthographicCamera;
  geometry: PlaneGeometry;
  material: ShaderMaterial;
};

/** A decorative liquid colour field. Its parent supplies the layout dimensions. */
export function LiquidGradient({ className, palette = pastelPalette, speed = 1, priority = false }: LiquidGradientProps) {
  if (typeof window !== 'undefined' && !performance.getEntriesByName('liquid:client-render').length) markPhase('client-render');
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pink, blue, cream, lavender] = palette;
  const hasPoster = palette.every((color, index) => color.toLowerCase() === pastelPalette[index]);

  useEffect(() => {
    markPhase('effect');
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animationSpeed = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    let surface: Surface | undefined;
    let disposed = false;
    let loading = false;
    let failed = false;
    let contextLost = false;
    let visible = typeof IntersectionObserver === 'undefined';
    if (priority && !visible) {
      // Start the first viewport without waiting for the observer's next task.
      // The observer still owns subsequent visibility and offscreen pausing.
      const bounds = root.getBoundingClientRect();
      visible = bounds.width > 0 && bounds.height > 0 && bounds.bottom > 0 && bounds.right > 0
        && bounds.top < window.innerHeight && bounds.left < window.innerWidth;
    }
    let looping = false;
    let elapsed = 0;
    let previous: number | null = null;
    let lastDraw: number | null = null;
    let firstRender = true;
    let showingCanvas = false;
    let sizeKey = '';

    const fallback = () => {
      showingCanvas = false;
      root.dataset.renderer = 'fallback';
      canvas.style.opacity = '0';
    };

    const pause = () => {
      if (looping) surface?.renderer.setAnimationLoop(null);
      looping = false;
      previous = null;
      lastDraw = null;
    };

    const release = () => {
      pause();
      if (!surface) return;
      const current = surface;
      surface = undefined;
      current.scene.clear();
      current.geometry.dispose();
      current.material.dispose();
      current.renderer.dispose();
    };

    const reportFailure = (error: unknown) => {
      if (disposed) return;
      failed = true;
      fallback();
      release();
      console.warn('CÉLULA liquid gradient unavailable:', error);
    };

    const canAnimate = () => !disposed && !failed && !contextLost && visible && !document.hidden && !motion.matches;

    const resize = () => {
      if (!surface || contextLost) return false;
      const width = Math.max(1, root.clientWidth);
      const height = Math.max(1, root.clientHeight);
      // This soft field needs no full device resolution. Bound total GPU work too.
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.4, Math.sqrt(1_800_000 / (width * height)));
      const nextSizeKey = `${width}:${height}:${pixelRatio}`;
      if (sizeKey === nextSizeKey) return false;
      surface.renderer.setDrawingBufferSize(width, height, pixelRatio);
      // Match the poster's logical aspect exactly, independently of DPR rounding.
      surface.material.uniforms.u_resolution.value.set(width, height);
      sizeKey = nextSizeKey;
      return true;
    };

    const draw = () => {
      if (!surface || !canAnimate()) return;
      try {
        surface.material.uniforms.u_time.value = elapsed;
        if (firstRender) markPhase('render-start');
        surface.renderer.render(surface.scene, surface.camera);
        if (firstRender) markPhase('render-end');
        if (!showingCanvas) {
          root.dataset.renderer = 'webgl';
          canvas.style.opacity = '1';
          showingCanvas = true;
        }
        if (firstRender) markPhase('visible');
        firstRender = false;
      } catch (error) {
        reportFailure(error);
      }
    };

    const render = (now: number) => {
      if (!canAnimate()) { update(); return; }
      if (previous !== null) elapsed += (now - previous) / 1000 * animationSpeed;
      previous = now;
      // A 33 ms threshold accommodates fractional 60 Hz RAF timestamps.
      if (lastDraw !== null && now - lastDraw < 33) return;
      lastDraw = now;
      draw();
    };

    const startLoop = () => {
      if (!surface || looping || !canAnimate()) return;
      resize();
      draw();
      if (!surface || failed) return;
      looping = true;
      surface.renderer.setAnimationLoop(render);
    };

    const initialize = async () => {
      if (loading || surface || !canAnimate()) return;
      loading = true;
      let renderer: WebGLRenderer | undefined;
      let geometry: PlaneGeometry | undefined;
      let material: ShaderMaterial | undefined;
      try {
        // Keep Three.js out of server execution and reduced-motion downloads.
        markPhase('import-start');
        const THREE = await import('./liquid-gradient-three');
        markPhase('import-end');
        if (!canAnimate()) return;
        markPhase('renderer-start');
        renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
        markPhase('renderer-end');
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.debug.onShaderError = () => { throw new Error('Liquid gradient shader compilation failed'); };
        geometry = new THREE.PlaneGeometry(2, 2);
        material = new THREE.ShaderMaterial({
          vertexShader: liquidGradientVertexShader,
          fragmentShader: liquidGradientFragmentShader,
          uniforms: {
            u_time: { value: elapsed },
            u_resolution: { value: new THREE.Vector2(1, 1) },
            u_pink: { value: new THREE.Color(pink) },
            u_blue: { value: new THREE.Color(blue) },
            u_cream: { value: new THREE.Color(cream) },
            u_lavender: { value: new THREE.Color(lavender) },
          },
          depthTest: false,
          depthWrite: false,
          toneMapped: false,
        });
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false;
        scene.add(mesh);
        surface = { renderer, geometry, material, scene, camera };
        startLoop();
      } catch (error) {
        // Also release partially constructed surfaces when initialization fails.
        if (!surface) {
          geometry?.dispose();
          material?.dispose();
          renderer?.dispose();
        }
        reportFailure(error);
      } finally {
        loading = false;
      }
    };

    const update = () => {
      if (disposed) return;
      if (!canAnimate()) {
        pause();
        if (motion.matches || contextLost || failed) fallback();
        return;
      }
      if (surface) startLoop();
      else void initialize();
    };

    const onResize = () => {
      if (!canAnimate() || !surface) return;
      if (resize()) draw();
    };
    const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      update();
    };
    const onContextRestored = () => {
      contextLost = false;
      sizeKey = '';
      // Three.js also handles this event; let it rebuild its internal GL state first.
      queueMicrotask(update);
    };

    fallback();
    intersection?.observe(root);
    resizeObserver?.observe(root);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', update);
    motion.addEventListener('change', update);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);
    update();

    return () => {
      disposed = true;
      intersection?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', update);
      motion.removeEventListener('change', update);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      release();
      fallback();
    };
  }, [pink, blue, cream, lavender, speed, priority]);

  const colors = {
    '--liquid-pink': pink,
    '--liquid-blue': blue,
    '--liquid-cream': cream,
    '--liquid-lavender': lavender,
    ...(hasPoster ? {
      '--liquid-poster-portrait': `url("${liquidGradientPoster.portrait.src}")`,
      '--liquid-poster-landscape': `url("${liquidGradientPoster.landscape.src}")`,
      '--liquid-thumbnail-portrait': `url("${liquidGradientPoster.portrait.placeholder}")`,
      '--liquid-thumbnail-landscape': `url("${liquidGradientPoster.landscape.placeholder}")`,
    } : {}),
  } as CSSProperties;

  return (
    <>
      {priority && hasPoster && <>
        <link rel="preload" as="image" href={liquidGradientPoster.portrait.src} media="(max-aspect-ratio: 1/1)" fetchPriority="high" />
        <link rel="preload" as="image" href={liquidGradientPoster.landscape.src} media="(min-aspect-ratio: 1/1)" fetchPriority="high" />
      </>}
      <div ref={rootRef} className={cn(styles.root, className)} style={colors} data-renderer="fallback" aria-hidden="true">
        {hasPoster && <div className={styles.poster} data-liquid-poster aria-hidden="true" />}
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      </div>
    </>
  );
}
