/**
 * Capture the original Three.js liquid shader at t=0, outside the app build.
 * Requires Node 22+ and an existing local Chrome DevTools endpoint:
 *   node scripts/generate-liquid-poster.mjs --cdp-url http://127.0.0.1:9226
 * The script owns its temporary HTTP server and browser target, and closes both.
 * No browser package, production dependency, or network asset is required.
 */
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const shaderPath = path.join(projectRoot, 'src/shared/ui/liquid-gradient/liquid-gradient-shaders.ts');
const metadataPath = path.join(projectRoot, 'src/shared/ui/liquid-gradient/liquid-gradient-poster.ts');
const outputDirectory = path.join(projectRoot, 'public/home');
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
};
const cdpUrl = option('--cdp-url', 'http://127.0.0.1:9226');
const port = Number(option('--port', '3201'));
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid --port');
const shaderSource = await readFile(shaderPath, 'utf8');
const extractShader = (name) => {
  const match = shaderSource.match(new RegExp('export const ' + name + ' = `([\\s\\S]*?)`;'));
  if (!match) throw new Error(`Could not extract ${name} from ${shaderPath}`);
  return match[1];
};
const vertexShader = extractShader('liquidGradientVertexShader');
const fragmentShader = extractShader('liquidGradientFragmentShader');
// The original default palette, interpreted by THREE.Color as sRGB input.
const palette = ['#f7b3d4', '#a1d6e4', '#fff1d7', '#c8b4e5'];
const captures = [
  { name: 'portrait', width: 384, height: 1536, thumbnailWidth: 32, thumbnailHeight: 128 },
  { name: 'landscape', width: 2048, height: 512, thumbnailWidth: 128, thumbnailHeight: 32 },
];

// Use installed Three.js directly: no app bundle or shader approximation.
const server = createServer(async (request, response) => {
  try {
    if (request.url === '/') {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.end('<!doctype html><meta charset="utf-8"><title>Liquid shader poster capture</title><script type="module">import * as THREE from "/three/three.module.js"; window.posterThree = THREE;</script>');
      return;
    }
    const moduleFilename = request.url?.match(/^\/three\/(three\.(?:module|core)\.js)$/)?.[1];
    if (!moduleFilename) {
      response.writeHead(404).end();
      return;
    }
    response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    response.end(await readFile(path.join(projectRoot, 'node_modules/three/build', moduleFilename)));
  } catch (error) {
    response.writeHead(500).end(String(error));
  }
});

class DevTools {
  constructor(socket) {
    this.socket = socket;
    this.sequence = 0;
    this.pending = new Map();
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      const operation = this.pending.get(message.id);
      if (!operation) return;
      this.pending.delete(message.id);
      clearTimeout(operation.timeout);
      if (message.error) operation.reject(new Error(JSON.stringify(message.error)));
      else operation.resolve(message.result);
    });
  }

  send(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`DevTools timed out: ${method}`));
      }, 30000);
      this.pending.set(id, { resolve, reject, timeout });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async close() {
    for (const operation of this.pending.values()) {
      clearTimeout(operation.timeout);
      operation.reject(new Error('DevTools session closed'));
    }
    this.pending.clear();
    if (this.socket.readyState === WebSocket.CLOSED) return;
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 2000);
      this.socket.addEventListener('close', () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });
      this.socket.close();
    });
  }
}

let target;
let devtools;
try {
  // Fail before binding the server if Chrome is not running.
  const browser = await fetch(new URL('/json/version', cdpUrl));
  if (!browser.ok) throw new Error(`Chrome endpoint returned ${browser.status}`);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  const targetResponse = await fetch(new URL(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/`)}`, cdpUrl), { method: 'PUT' });
  if (!targetResponse.ok) throw new Error(`Cannot create capture target: ${targetResponse.status}`);
  target = await targetResponse.json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  devtools = new DevTools(socket);
  const captureOptions = { vertexShader, fragmentShader, palette, captures };
  const result = await devtools.send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(${async function capture({ vertexShader, fragmentShader, palette, captures }) {
      const started = performance.now();
      while (!window.posterThree) {
        if (performance.now() - started > 15000) throw new Error('Three.js module did not load');
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      const THREE = window.posterThree;
      const canvas = document.createElement('canvas');
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: true });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.debug.onShaderError = () => { throw new Error('Liquid gradient shader compilation failed'); };
      const geometry = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          u_time: { value: 0 },
          u_resolution: { value: new THREE.Vector2(1, 1) },
          u_pink: { value: new THREE.Color(palette[0]) },
          u_blue: { value: new THREE.Color(palette[1]) },
          u_cream: { value: new THREE.Color(palette[2]) },
          u_lavender: { value: new THREE.Color(palette[3]) },
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
      try {
        const frames = [];
        for (const capture of captures) {
          renderer.setDrawingBufferSize(capture.width, capture.height, 1);
          renderer.getDrawingBufferSize(material.uniforms.u_resolution.value);
          renderer.render(scene, camera);
          const image = canvas.toDataURL('image/webp', 0.88);
          const thumbnail = document.createElement('canvas');
          thumbnail.width = capture.thumbnailWidth;
          thumbnail.height = capture.thumbnailHeight;
          const context = thumbnail.getContext('2d');
          context.imageSmoothingQuality = 'high';
          context.drawImage(canvas, 0, 0, thumbnail.width, thumbnail.height);
          const placeholder = thumbnail.toDataURL('image/webp', 0.72);
          if (!image.startsWith('data:image/webp;') || !placeholder.startsWith('data:image/webp;')) throw new Error('WebP encoding unavailable');
          frames.push({ ...capture, image, placeholder });
        }
        return { frames, threeRevision: THREE.REVISION };
      } finally {
        scene.clear();
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
      }
    }.toString()})(${JSON.stringify(captureOptions)})`,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? JSON.stringify(result.exceptionDetails));
  const { frames, threeRevision } = result.result.value;
  await mkdir(outputDirectory, { recursive: true });
  const metadata = {
    generator: 'scripts/generate-liquid-poster.mjs',
    time: 0,
    palette,
    threeRevision,
    colorSpace: 'srgb',
    shaderSha256: createHash('sha256').update(vertexShader + '\n' + fragmentShader).digest('hex'),
  };
  for (const { name, width, height, thumbnailWidth, thumbnailHeight, image, placeholder } of frames) {
    const buffer = Buffer.from(image.split(',')[1], 'base64');
    const filename = `liquid-initial-${name}.webp`;
    await writeFile(path.join(outputDirectory, filename), buffer);
    metadata[name] = { src: `/home/${filename}`, width, height, bytes: buffer.byteLength, thumbnailWidth, thumbnailHeight, placeholder };
  }
  await writeFile(metadataPath, '// Generated by scripts/generate-liquid-poster.mjs. Do not edit by hand.\n' +
    '// An actual t=0 shader frame, with the original linear palette and sRGB output.\n' +
    'export const liquidGradientPoster = ' + JSON.stringify(metadata, null, 2) + ' as const;\n');
  const manifest = { ...metadata };
  for (const { name } of captures) {
    const { placeholder, ...frame } = metadata[name];
    manifest[name] = { ...frame, placeholderBytes: Buffer.from(placeholder.split(',')[1], 'base64').byteLength };
  }
  await writeFile(path.join(outputDirectory, 'liquid-initial.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify(manifest, null, 2));
} finally {
  await devtools?.close();
  if (target) await fetch(new URL(`/json/close/${target.id}`, cdpUrl)).catch(() => {});
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
