import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Start a production server and a dedicated Chrome with --remote-debugging-port=9238.
// node scripts/check-exhibition-card-swap.mjs
// node scripts/check-exhibition-card-swap.mjs --gestures-only (also checks HTTP routing/SSR)
// node scripts/check-exhibition-card-swap.mjs --home --gestures-only (focused Home integration)
// This script owns only the CDP tabs it creates. No browser automation package is required.
const origin = process.env.CARD_SWAP_ORIGIN ?? 'http://127.0.0.1:3142';
const port = Number(process.env.CDP_PORT ?? 9238);
const homeMode = process.argv.includes('--home');
const outputDirectory = path.resolve(process.env.CARD_SWAP_OUTPUT ?? fileURLToPath(new URL(homeMode ? '../../verification/exhibition-card-swap-home/' : '../../verification/exhibition-card-swap-feature/', import.meta.url)));
const previewPath = '/exposiciones?preview=card-swap';
const prototypePath = homeMode ? '/#exposiciones' : previewPath;
const gesturesOnly = process.argv.includes('--gestures-only');
const focusedRun = gesturesOnly || homeMode;
const reportFilename = homeMode ? 'report-home.json' : gesturesOnly ? 'report-gestures.json' : 'report.json';
const expectedArtworkIds = ['membrana-rosa', 'corriente-de-cielo', 'umbral-lavanda', 'la-forma-del-silencio', 'materia-blanda'];
const rootSelector = '.exhibition-card-swap';
const deckSelector = '.exhibition-card-swap__deck';
const cardSelector = '.exhibition-artwork-card';
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const report = {
  origin, prototypePath, mode: homeMode ? 'home-focused' : gesturesOnly ? 'gestures-only' : 'full', startedAt: new Date().toISOString(), checks: [], failures: [], errors: [],
  viewports: [], idle: [], interactions: {}, screenshots: [], resources: [], routing: [],
  limitations: [
    'Chrome CDP emulates touch; this does not replace a physical iOS/Android browser check.',
    'Resource byte totals describe this production page load and are not a before/after bundle comparison.',
    'Timer/RAF probes cover browser allocations and deck DOM changes during the observed windows; source tests separately verify the disabled autoplay branch.',
  ],
};

function check(condition, description, detail) {
  const entry = { passed: !!condition, description, ...(detail === undefined ? {} : { detail }) };
  report.checks.push(entry);
  if (!entry.passed) report.failures.push(entry);
}

async function routingChecks() {
  const cases = [
    { label: 'Default Exhibition', route: '/exposiciones', preview: false },
    { label: 'CardSwap query preview', route: previewPath, preview: true },
    { label: 'Repeated preview, valid first', route: '/exposiciones?preview=card-swap&preview=other', preview: false },
    { label: 'Repeated preview, valid last', route: '/exposiciones?preview=other&preview=card-swap', preview: false },
    { label: 'Repeated identical preview', route: '/exposiciones?preview=card-swap&preview=card-swap', preview: false },
    { label: 'Unknown preview', route: '/exposiciones?preview=other', preview: false },
    { label: 'Empty preview', route: '/exposiciones?preview=', preview: false },
    { label: 'Removed nested prototype route', route: '/exposiciones/card-swap', status: 404 },
  ];
  const results = await Promise.allSettled(cases.map(async (entry) => {
    const response = await fetch(`${origin}${entry.route}`, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
    // Inspect real server markup, excluding serialized React data inside scripts.
    const html = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map(([tag]) => Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/g)].map(([, name, , value]) => [name.toLowerCase(), value])));
    const articleIds = [...html.matchAll(/<article\b[^>]*\bdata-artwork-id="([^"]+)"/g)].map(([, id]) => id);
    return {
      ...entry, status: response.status, expectedStatus: entry.status ?? 200,
      legacySSR: /class="[^"]*\bexhibition-slider__viewport\b/.test(html),
      cardSwapSSR: /<section\b[^>]*\bclass="exhibition-card-swap"/.test(html),
      previewNotice: /class="[^"]*\bexhibition-card-swap-preview\b/.test(html),
      titles: [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map(([, title]) => title),
      robots: meta.filter((entry) => entry.name?.toLowerCase() === 'robots').map((entry) => entry.content),
      activeId: html.match(/<section\b[^>]*\bclass="exhibition-card-swap"[^>]*\bdata-active-id="([^"]+)"/)?.[1],
      articleIds, frostLayers: [...html.matchAll(/class="exhibition-artwork-card__frost"/g)].length,
      detailLayers: [...html.matchAll(/class="exhibition-artwork-card__detail"/g)].length,
    };
  }));
  for (const [index, result] of results.entries()) {
    if (result.status === 'rejected') {
      check(false, `${cases[index].label}: HTTP SSR response available`, String(result.reason));
      continue;
    }
    const entry = result.value;
    report.routing.push(entry);
    check(entry.status === entry.expectedStatus, `${entry.label}: HTTP ${entry.expectedStatus}`, entry.status);
    if (entry.expectedStatus === 404) {
      check(!entry.cardSwapSSR && !entry.legacySSR, `${entry.label}: no Exhibition content mounted`);
      continue;
    }
    check(entry.preview ? entry.cardSwapSSR && !entry.legacySSR && entry.previewNotice : entry.legacySSR && !entry.cardSwapSSR && !entry.previewNotice, `${entry.label}: correct server-rendered gallery selected`, { legacySSR: entry.legacySSR, cardSwapSSR: entry.cardSwapSSR, previewNotice: entry.previewNotice });
    check(entry.titles.some((title) => title.includes('Exposiciones') && title.includes('CardSwap') === entry.preview), `${entry.label}: matching page title`, entry.titles);
    check(entry.preview ? entry.robots.some((value) => /\bnoindex\b/i.test(value) && /\bnofollow\b/i.test(value)) : entry.robots.every((value) => !/\bnoindex\b/i.test(value)), `${entry.label}: preview-only noindex metadata`, entry.robots);
    if (entry.preview) check(entry.articleIds.length > 1 && entry.activeId === entry.articleIds[0] && entry.frostLayers === entry.articleIds.length && entry.detailLayers === entry.articleIds.length, `${entry.label}: deterministic active ID and permanent frost/editorial layers in SSR`, { activeId: entry.activeId, articleIds: entry.articleIds, frostLayers: entry.frostLayers, detailLayers: entry.detailLayers });
  }
}

async function homeSSRChecks() {
  const response = await fetch(`${origin}/`, { signal: AbortSignal.timeout(20000) });
  const html = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const start = html.indexOf('id="exposiciones"');
  const section = start >= 0 ? html.slice(start, html.indexOf('</section>', start)) : '';
  const ids = [...section.matchAll(/<article\b[^>]*\bdata-artwork-id="([^"]+)"/g)].map(([, id]) => id);
  report.homeSSR = {
    status: response.status,
    cardSwapCount: [...html.matchAll(/<section\b[^>]*\bclass="exhibition-card-swap"/g)].length,
    legacySlider: /class="[^"]*\bexhibition-slider__viewport\b/.test(section), ids,
    sectionHeading: /<h2\b[^>]*\bid="home-featured-title"/.test(section),
    artworkH3Count: [...section.matchAll(/<h3\b[^>]*\bclass="exhibition-artwork-card__title"/g)].length,
  };
  check(response.status === 200, 'Home: HTTP 200 SSR response', response.status);
  check(report.homeSSR.cardSwapCount === 1 && !report.homeSSR.legacySlider, 'Home: exactly one CardSwap and no legacy slider in Exhibition', report.homeSSR);
  check(JSON.stringify(ids) === JSON.stringify(expectedArtworkIds), 'Home: original five artworks present in deterministic SSR order', ids);
  check(report.homeSSR.sectionHeading && report.homeSSR.artworkH3Count === 5, 'Home: section h2 and artwork h3 headings rendered on server', report.homeSSR);
}

async function connect() {
  const endpoint = `http://127.0.0.1:${port}`;
  const response = await fetch(`${endpoint}/json/new?about:blank`, { method: 'PUT', signal: AbortSignal.timeout(10000) });
  assert.ok(response.ok, `Chrome CDP unavailable: ${endpoint}`);
  const tab = await response.json();
  const socket = new WebSocket(tab.webSocketDebuggerUrl);
  const pending = new Map();
  const listeners = new Map();
  let sequence = 0;
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const handler = pending.get(message.id);
      if (!handler) return;
      pending.delete(message.id);
      if (message.error) handler.reject(new Error(JSON.stringify(message.error)));
      else handler.resolve(message.result);
    } else {
      for (const listener of listeners.get(message.method) ?? []) listener(message.params);
    }
  };
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('CDP WebSocket connection timed out')), 10000);
    socket.onopen = () => { clearTimeout(timeout); resolve(); };
    socket.onerror = () => { clearTimeout(timeout); reject(new Error('CDP WebSocket connection failed')); };
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 30000);
    pending.set(id, {
      resolve: (value) => { clearTimeout(timeout); resolve(value); },
      reject: (error) => { clearTimeout(timeout); reject(error); },
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
  return {
    send,
    on(method, listener) {
      const entries = listeners.get(method) ?? new Set();
      entries.add(listener);
      listeners.set(method, entries);
    },
    async evaluate(expression) {
      const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description ?? JSON.stringify(response.exceptionDetails));
      return response.result.value;
    },
    async close() {
      socket.close();
      await fetch(`${endpoint}/json/close/${tab.id}`).catch(() => {});
    },
  };
}

// Install before hydration. Keep allocations and executions distinct: merely waiting is
// not evidence that an autoplay timer was never created.
function installProbe() {
  const probe = window.__cardSwapProbe = { timers: [], frames: [], frameExecutions: 0, mutations: [], captures: [], captureCalls: [], pointerEvents: [], start: 0 };
  for (const name of ['setPointerCapture', 'releasePointerCapture']) {
    const original = Element.prototype[name];
    if (typeof original !== 'function') continue;
    Element.prototype[name] = function (pointerId) {
      const value = original.call(this, pointerId);
      probe.captureCalls.push({ name, pointerId, target: this.className, captured: this.hasPointerCapture(pointerId) });
      return value;
    };
  }
  for (const name of ['setTimeout', 'setInterval']) {
    const original = window[name];
    window[name] = function (callback, delay, ...arguments_) {
      const entry = { kind: name, delay: Number(delay ?? 0), at: performance.now(), stack: new Error().stack, executions: 0 };
      probe.timers.push(entry);
      const wrapped = typeof callback === 'function' ? function (...values) { entry.executions++; return callback.apply(this, values); } : callback;
      return original.call(this, wrapped, delay, ...arguments_);
    };
  }
  const originalFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = function (callback) {
    const entry = { at: performance.now(), stack: new Error().stack };
    probe.frames.push(entry);
    return originalFrame.call(this, (time) => { probe.frameExecutions++; callback(time); });
  };
  probe.reset = () => {
    probe.start = performance.now();
    probe.timers.length = 0;
    probe.frames.length = 0;
    probe.frameExecutions = 0;
    probe.mutations.length = 0;
    probe.observer ??= new MutationObserver((entries) => {
      for (const entry of entries) probe.mutations.push({ at: performance.now(), name: entry.attributeName, target: entry.target.className, value: entry.target.getAttribute?.(entry.attributeName) });
    });
    probe.observer.disconnect();
    const root = document.querySelector('.exhibition-card-swap');
    if (root) probe.observer.observe(root, { subtree: true, attributes: true, childList: true });
  };
  for (const type of ['gotpointercapture', 'lostpointercapture', 'pointercancel']) {
    document.addEventListener(type, (event) => {
      if (event.target.closest?.('.exhibition-card-swap')) probe.captures.push({ type, pointerId: event.pointerId, target: event.target.className });
    }, true);
  }
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'gotpointercapture', 'lostpointercapture', 'click']) {
    document.addEventListener(type, (event) => {
      if (probe.pointerEvents.length >= 300) return;
      const deck = document.querySelector('.exhibition-card-swap__deck');
      probe.pointerEvents.push({ type, pointerId: event.pointerId, isPrimary: event.isPrimary, pointerType: event.pointerType, target: event.target.className, targetIsDeck: event.target === deck, index: event.target.closest?.('[data-swap-index]')?.dataset.swapIndex, button: event.button, buttons: event.buttons, x: event.clientX, y: event.clientY, captured: deck?.hasPointerCapture?.(event.pointerId), dragging: deck?.hasAttribute('data-dragging') });
    }, true);
  }
}

function inspectPage() {
  const root = document.querySelector('.exhibition-card-swap');
  if (!root) return null;
  const deck = root.querySelector('.exhibition-card-swap__deck');
  const home = root.closest('#exposiciones');
  const textMetric = (node) => {
    if (!node) return null;
    const css = getComputedStyle(node);
    const scale = node.offsetWidth ? node.getBoundingClientRect().width / node.offsetWidth : 1;
    return { cssPixels: parseFloat(css.fontSize), renderedPixels: parseFloat(css.fontSize) * scale };
  };
  const alpha = (color) => {
    if (!color || color === 'transparent') return 0;
    if (color.includes('/')) return parseFloat(color.split('/')[1]);
    if (color.startsWith('rgba')) return Number(color.match(/[\d.]+/g)?.at(-1));
    return 1;
  };
  const chain = (node) => {
    const result = [];
    while (node && node !== root) {
      const css = getComputedStyle(node);
      result.push({ className: node.className, transform: css.transform, opacity: css.opacity, visibility: css.visibility, filter: css.filter });
      node = node.parentElement;
    }
    return result;
  };
  const cards = [...root.querySelectorAll('.exhibition-artwork-card')].map((card) => {
    const image = card.querySelector('img');
    const frost = card.querySelector('.exhibition-artwork-card__frost');
    const detail = card.querySelector('.exhibition-artwork-card__detail');
    const title = card.querySelector('h2,h3');
    const text = detail?.querySelector('p');
    const frostStyle = frost && getComputedStyle(frost);
    const imageStyle = image && getComputedStyle(image);
    const ancestors = chain(card);
    return {
      id: card.dataset.artworkId, active: card.dataset.active === 'true', details: card.dataset.details,
      title: title?.textContent, headingTag: title?.tagName, alt: image?.alt, rect: card.getBoundingClientRect().toJSON(),
      visible: ancestors.every((item) => item.visibility !== 'hidden' && Number(item.opacity) > .01), ancestors,
      image: image && { loaded: image.complete && image.naturalWidth > 0, src: image.currentSrc, filter: imageStyle.filter, opacity: imageStyle.opacity, objectFit: imageStyle.objectFit },
      frost: frost && { opacity: Number(frostStyle.opacity), color: frostStyle.backgroundColor, image: frostStyle.backgroundImage, alpha: (frostStyle.backgroundImage !== 'none' ? 1 : alpha(frostStyle.backgroundColor)) * Number(frostStyle.opacity) },
      detail: detail && { opacity: Number(getComputedStyle(detail).opacity), filter: getComputedStyle(detail).filter, ariaHidden: detail.getAttribute('aria-hidden'), text: detail.textContent, rect: detail.getBoundingClientRect().toJSON() },
      fonts: { title: title && getComputedStyle(title).fontFamily, text: text && getComputedStyle(text).fontFamily },
      textMetrics: { title: textMetric(title), technique: textMetric(card.querySelector('.exhibition-artwork-card__technique')), description: textMetric(card.querySelector('.exhibition-artwork-card__description')) },
      layerCount: { frost: card.querySelectorAll('.exhibition-artwork-card__frost').length, detail: card.querySelectorAll('.exhibition-artwork-card__detail').length },
    };
  });
  return {
    activeId: root.dataset.activeId, cards, root: root.getBoundingClientRect().toJSON(),
    home: home && { cardSwapCount: home.querySelectorAll('.exhibition-card-swap').length, documentCardSwapCount: document.querySelectorAll('.exhibition-card-swap').length, legacySliderCount: home.querySelectorAll('.exhibition-slider__viewport').length, sectionHeadingTag: home.querySelector('#home-featured-title')?.tagName, sectionHeading: home.querySelector('#home-featured-title')?.textContent, rect: home.getBoundingClientRect().toJSON() },
    deck: deck && { rect: deck.getBoundingClientRect().toJSON(), role: deck.getAttribute('role'), label: deck.getAttribute('aria-label'), tabIndex: deck.tabIndex, touchAction: getComputedStyle(deck).touchAction },
    geometry: deck && { width: deck.style.getPropertyValue('--swap-w'), height: deck.style.getPropertyValue('--swap-h'), perspective: getComputedStyle(deck.lastElementChild).perspective, visibleCards: cards.filter((card) => card.visible).length },
    status: root.querySelector('[role="status"], [aria-live="polite"]')?.textContent,
    controls: [...root.querySelectorAll('button')].map((button) => ({ label: button.getAttribute('aria-label') ?? button.textContent, disabled: button.disabled, rect: button.getBoundingClientRect().toJSON() })),
    focus: { className: document.activeElement?.className, isDeck: document.activeElement === deck, outline: document.activeElement && getComputedStyle(document.activeElement).outline, shadow: document.activeElement && getComputedStyle(document.activeElement).boxShadow },
    viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollY },
    fonts: { status: document.fonts.status, acid: getComputedStyle(document.documentElement).getPropertyValue('--font-acid'), mono: getComputedStyle(document.documentElement).getPropertyValue('--font-basis-mono'), faces: [...document.fonts].map((face) => ({ family: face.family, status: face.status, weight: face.weight })) },
    animations: root.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length,
  };
}

let browser;
const state = () => browser.evaluate(`(${inspectPage.toString()})()`);
const transformKey = (value) => JSON.stringify(value?.cards.map((card) => ({ id: card.id, active: card.active, rect: card.rect, ancestors: card.ancestors })));

async function waitFor(expression, description, timeout = 20000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await browser.evaluate(expression)) return;
    await pause(100);
  }
  throw new Error(`Timed out waiting for ${description}`);
}

async function settled(expectedId, requireImages = true) {
  const deadline = Date.now() + 12000;
  let previous = null;
  let unchanged = 0;
  while (Date.now() < deadline) {
    const current = await state();
    if (current && current.cards.filter((card) => card.active).length === 1 && (!requireImages || current.cards.filter((card) => card.visible).every((card) => card.image.loaded)) && (!expectedId || current.activeId === expectedId) && current.animations === 0) {
      const signature = transformKey(current);
      unchanged = signature === previous ? unchanged + 1 : 0;
      previous = signature;
      if (unchanged >= 3) { await pause(700); return state(); }
    }
    await pause(100);
  }
  report.unsettled = await state();
  throw new Error(`CardSwap did not settle: expected ${expectedId ?? 'stable transforms'}, actual ${report.unsettled?.activeId}. Full state saved in report.unsettled.`);
}

async function viewport(width) {
  const mobile = width <= 430;
  await browser.send('Emulation.setDeviceMetricsOverride', { width, height: mobile ? (width === 320 ? 740 : 844) : width === 768 ? 1024 : 1000, deviceScaleFactor: 1, mobile });
  await browser.send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 1 });
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
}

async function navigate(route = prototypePath) {
  await browser.send('Page.navigate', { url: `${origin}${route}` });
  await waitFor(`!!document.querySelector(${JSON.stringify(rootSelector)})?.dataset.activeId`, 'hydrated CardSwap');
  await browser.evaluate('document.fonts.ready.then(() => true)');
  if (homeMode) {
    // Home's existing ScrollTrigger sections can refresh their responsive pin
    // spacers after resize. Align only after that layout has first settled.
    await settled(undefined, false);
    for (let attempt = 0; attempt < 3; attempt++) {
      await browser.evaluate(`document.querySelector(${JSON.stringify(rootSelector)}).scrollIntoView({block:'center',behavior:'instant'})`);
      const current = await settled();
      if (current.root.top >= 0 && current.root.bottom <= current.viewport.height) return current;
    }
    throw new Error('Home CardSwap could not be positioned inside the visible viewport');
  }
  await browser.evaluate(`document.querySelector(${JSON.stringify(rootSelector)}).scrollIntoView({block:'center',behavior:'instant'})`);
  return settled();
}

async function screenshot(label) {
  const clip = homeMode ? await browser.evaluate(`(() => {const n=document.querySelector('#exposiciones');if(!n)return null;const r=n.getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1};})()`) : null;
  const { data } = await browser.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!clip, ...(clip ? { clip } : {}) });
  const filename = `${label}.png`;
  await fs.writeFile(path.join(outputDirectory, filename), Buffer.from(data, 'base64'));
  report.screenshots.push(filename);
}

async function point(selector) {
  return browser.evaluate(`(() => {const n=document.querySelector(${JSON.stringify(selector)});if(!n)return null;const r=n.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+r.height/2;return {x,y,width:r.width,height:r.height,inViewport:x>=0&&x<innerWidth&&y>=0&&y<innerHeight,hit:n.contains(document.elementFromPoint(x,y))};})()`);
}

async function click(selector, touch = false) {
  if (homeMode) {
    await browser.evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'nearest',behavior:'instant'})`);
    await pause(100);
  }
  const location = await point(selector);
  assert.ok(location, `Missing click target: ${selector}`);
  assert.ok(location.inViewport && location.hit, `Click target must be visible and hit-tested: ${selector} ${JSON.stringify(location)}`);
  if (touch) {
    await browser.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: location.x, y: location.y }] });
    await pause(40);
    await browser.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: location.x, y: location.y });
    await browser.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: location.x, y: location.y, button: 'left', buttons: 1, clickCount: 1 });
    await browser.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: location.x, y: location.y, button: 'left', buttons: 0, clickCount: 1 });
  }
}

async function key(keyName, code, number) {
  await browser.send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, code, windowsVirtualKeyCode: number });
  await browser.send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, code, windowsVirtualKeyCode: number });
}

async function idle(label) {
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  await settled();
  await browser.evaluate('window.__cardSwapProbe.reset()');
  const before = await state();
  const samples = [];
  const started = Date.now();
  // Three real five-second waits: no mocked clock and no page interactions.
  for (let sample = 0; sample < 3; sample++) {
    await pause(5000);
    samples.push(await state());
  }
  const probe = await browser.evaluate(`(() => { const p=window.__cardSwapProbe; return ${homeMode ? '{elapsed:performance.now()-p.start,globalActivityExcluded:true,globalTimerAllocations:p.timers.length,globalFrameAllocations:p.frames.length,globalFrameExecutions:p.frameExecutions,mutations:p.mutations}' : '{elapsed:performance.now()-p.start,timers:p.timers,frameAllocations:p.frames,frameExecutions:p.frameExecutions,mutations:p.mutations}'};})()`);
  const entry = { label, scope: homeMode ? 'CardSwap DOM, active ID and transforms only' : 'isolated Exhibition page', wallMilliseconds: Date.now() - started, activeId: before.activeId, sampleIds: samples.map((item) => item.activeId), probe };
  report.idle.push(entry);
  check(samples.every((item) => item.activeId === before.activeId), `${label}: active artwork unchanged for 15 seconds`, entry.sampleIds);
  check(samples.every((item) => transformKey(item) === transformKey(before)), `${label}: card transforms and bounds unchanged for 15 seconds`);
  check(probe.mutations.length === 0, `${label}: no card DOM mutations while idle`, probe.mutations);
  if (!homeMode) {
    check(probe.frameAllocations.length === 0 && probe.frameExecutions === 0, `${label}: no browser animation frames allocated or executed while idle`, { allocations: probe.frameAllocations.length, executions: probe.frameExecutions });
    check(!probe.timers.some((timer) => timer.kind === 'setInterval'), `${label}: no interval allocated while idle`, probe.timers);
    check(!probe.timers.some((timer) => timer.delay >= 400), `${label}: no delayed rotation timer allocated while idle`, probe.timers);
  }
  console.log(`Observed ${label}: ${entry.wallMilliseconds} ms, active ${entry.activeId}, ${probe.mutations.length} mutations.`);
}

function validateRest(current, label) {
  const active = current.cards.find((card) => card.active);
  const inactive = current.cards.filter((card) => !card.active && card.visible);
  const blur = (filter) => Number(filter?.match(/blur\(([\d.]+)px\)/)?.[1] ?? 0);
  const contrast = (filter) => Number(filter?.match(/contrast\(([\d.]+)\)/)?.[1] ?? 1);
  check(current.cards.length > 1 && current.cards.filter((card) => card.active).length === 1, `${label}: exactly one active artwork`);
  check(active?.id === current.activeId, `${label}: active stable ID matches root`);
  check(active?.image.loaded && active.alt?.length > 0, `${label}: active image loaded with alt text`);
  check(blur(active?.image.filter) === 0 && contrast(active?.image.filter) === 1, `${label}: front image sharp with original contrast`, active?.image.filter);
  check(active?.frost?.alpha === 0, `${label}: front veil invisible at rest`, active?.frost);
  check(active?.detail?.opacity === 0, `${label}: details hidden at rest`, active?.detail);
  check(inactive.length > 0 && inactive.every((card) => blur(card.image.filter) >= 3 && blur(card.image.filter) <= 4 && Math.abs(contrast(card.image.filter) - .94) < .01), `${label}: rear images frosted at 3–4px blur and 94% contrast`, inactive.map((card) => ({ id: card.id, filter: card.image.filter })));
  check(inactive.every((card) => card.frost?.alpha >= .20 && card.frost?.alpha <= .25), `${label}: rear veil alpha 20–25%`, inactive.map((card) => card.frost));
  check(current.cards.every((card) => card.image.objectFit === 'contain'), `${label}: complete portrait artworks preserved within landscape cards`);
  check(current.geometry.width === '460px' && current.geometry.height === '340px' && current.geometry.perspective === '900px' && current.geometry.visibleCards === Math.min(4, current.cards.length), `${label}: reference landscape geometry and internal perspective`, current.geometry);
  check(current.cards.every((card) => card.layerCount.frost === 1 && card.layerCount.detail === 1), `${label}: permanent image, frost, and editorial layers`);
  check(current.cards.every((card) => card.ancestors.every((item) => item.filter === 'none')), `${label}: filters do not blur whole cards or text`);
  check(current.viewport.scrollWidth <= current.viewport.width + 1, `${label}: no document horizontal overflow`, current.viewport);
  check(current.cards.filter((card) => card.visible).every((card) => card.rect.left >= -1 && card.rect.right <= current.viewport.width + 1), `${label}: all visible card bounds fit viewport`, current.cards.filter((card) => card.visible).map((card) => card.rect));
  check(current.cards.filter((card) => card.visible).every((card) => card.rect.top >= current.root.top - 1 && card.rect.bottom <= current.root.bottom + 1), `${label}: visible cards fit gallery bounds`);
  check(current.controls.filter((control) => /Obra (anterior|siguiente)/.test(control.label)).every((control) => control.rect.width >= 44 && control.rect.height >= 44), `${label}: navigation targets at least 44px`);
  check(current.deck?.role === 'region' && !!current.deck.label && current.deck.tabIndex === 0, `${label}: labeled keyboard-focusable gallery`, current.deck);
  check(current.fonts.status === 'loaded' && current.fonts.faces.some((face) => /acid/i.test(face.family) && face.status === 'loaded') && current.fonts.faces.some((face) => /basis/i.test(face.family) && face.status === 'loaded'), `${label}: Acid and Basis font faces loaded`, current.fonts);
  check(!!current.status?.includes(active?.title), `${label}: status announces active artwork`, current.status);
}

async function hoverDetails() {
  const target = await point(`${cardSelector}[data-active="true"]`);
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: target.x, y: target.y });
  await pause(800);
  const current = await state();
  const active = current.cards.find((card) => card.active);
  report.interactions.hover = current;
  check(/blur\([3-5](?:\.\d+)?px\)/.test(active.image.filter) && active.frost.alpha >= .19 && active.detail.opacity >= .99, 'Desktop hover frosts image and reveals information', { image: active.image, frost: active.frost, detail: active.detail });
  check(active.detail.filter === 'none' && active.ancestors.every((item) => item.filter === 'none'), 'Hover text remains sharp');
  await screenshot('1440-hover');
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  await pause(800);
  check((await state()).cards.find((card) => card.active).detail.opacity === 0, 'Desktop hover information hides when pointer leaves');
}

async function mobileInformationPanel(width, touch = true) {
  await click('button[aria-label="Mostrar información de la obra"]', touch);
  await pause(700);
  const current = await state();
  const active = current.cards.find((card) => card.active);
  check(active.details === 'true' && active.detail.opacity >= .99, `${width}px: ${touch ? 'touch' : 'button'} opens information without hover`);
  check(active.detail.rect.top >= active.rect.top - 1 && active.detail.rect.bottom <= active.rect.bottom + 1 && active.detail.rect.left >= active.rect.left - 1 && active.detail.rect.right <= active.rect.right + 1, `${width}px: visible information fits inside the card`, { card: active.rect, detail: active.detail.rect });
  if (homeMode) check(active.textMetrics.title.renderedPixels >= 16 && active.textMetrics.description.renderedPixels >= 12, `${width}px: artwork title and description retain readable rendered sizes`, active.textMetrics);
  await screenshot(`${width}-information`);
  await click('button[aria-label="Ocultar información de la obra"]', touch);
  await pause(700);
}

function validateHome(current, label) {
  check(current.home?.cardSwapCount === 1 && current.home.documentCardSwapCount === 1 && current.home.legacySliderCount === 0, `${label}: one CardSwap in Home Exhibition`, current.home);
  check(JSON.stringify(current.cards.map((card) => card.id)) === JSON.stringify(expectedArtworkIds), `${label}: original five artworks preserved`, current.cards.map((card) => card.id));
  check(current.home?.sectionHeadingTag === 'H2' && current.cards.every((card) => card.headingTag === 'H3'), `${label}: artwork h3 titles beneath Exhibition h2`, { sectionHeadingTag: current.home?.sectionHeadingTag, cardHeadings: current.cards.map((card) => card.headingTag) });
}

async function homeChecks() {
  for (const width of [320, 390, 1440]) {
    await viewport(width);
    const current = await navigate();
    validateRest(current, `Home ${width}px`);
    validateHome(current, `Home ${width}px`);
    report.viewports.push({ width, ...current });
    await screenshot(`${width}-rest`);
    await mobileInformationPanel(width, width <= 430);
  }
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  await idle('Home Exhibition after load');
  await hoverDetails();
  await navigationChecks();
}

async function navigationChecks() {
  const initial = await state();
  const ids = initial.cards.map((card) => card.id);
  await click('button[aria-label="Obra anterior"]');
  let current = await settled(ids.at(-1));
  check(current.activeId === ids.at(-1), 'Previous wraps from first to last artwork');
  await click('button[aria-label="Obra siguiente"]');
  current = await settled(ids[0]);
  check(current.activeId === ids[0], 'Next wraps from last to first artwork');
  await browser.evaluate(`document.querySelector(${JSON.stringify(deckSelector)}).focus({preventScroll:true})`);
  await key('ArrowRight', 'ArrowRight', 39);
  current = await settled(ids[1]);
  check(current.activeId === ids[1] && current.focus.isDeck, 'ArrowRight advances and retains gallery focus');
  check(!current.focus.outline.startsWith('rgb(0, 0, 0) none 0px') && !current.focus.outline.includes(' none 0px') || current.focus.shadow !== 'none', 'Keyboard focus has a visible outline or shadow', current.focus);
  await key('ArrowLeft', 'ArrowLeft', 37);
  current = await settled(ids[0]);
  check(current.activeId === ids[0], 'ArrowLeft returns to first artwork');
  await key('ArrowLeft', 'ArrowLeft', 37);
  current = await settled(ids.at(-1));
  check(current.activeId === ids.at(-1), 'Keyboard previous wraps to last artwork');
  await key('ArrowRight', 'ArrowRight', 39);
  current = await settled(ids[0]);
  check(current.activeId === ids[0], 'Keyboard next wraps to first artwork');
  report.interactions.keyboard = current;
}

async function mouseDrag() {
  const initial = await state();
  const location = await point(`${cardSelector}[data-active="true"]`);
  const start = { x: location.x + location.width * .2, y: location.y };
  const distance = Math.min(200, location.width * .7);
  await browser.evaluate('window.__cardSwapProbe.captures.length=0;window.__cardSwapProbe.captureCalls.length=0;window.__cardSwapProbe.pointerEvents.length=0');
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...start });
  await browser.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...start, button: 'left', buttons: 1, clickCount: 1 });
  for (let step = 1; step <= 10; step++) {
    await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x - distance * step / 10, y: start.y, button: 'left', buttons: 1 });
    await pause(25);
  }
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: start.x - distance, y: start.y, button: 'left', buttons: 0, clickCount: 1 });
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  const current = await settled();
  const captures = await browser.evaluate('window.__cardSwapProbe.captures');
  check(current.activeId !== initial.activeId, 'Real mouse drag changes active artwork');
  check(captures.some((entry) => entry.type === 'gotpointercapture') && captures.some((entry) => entry.type === 'lostpointercapture'), 'Mouse drag captures and releases pointer', captures);
  check(current.cards.every((card) => card.details !== 'true'), 'Mouse drag does not accidentally toggle artwork details');
  report.interactions.mouseDrag = { before: initial.activeId, after: current.activeId, captures, captureCalls: await browser.evaluate('window.__cardSwapProbe.captureCalls'), pointerEvents: await browser.evaluate('window.__cardSwapProbe.pointerEvents') };
  await screenshot('1440-after-drag');
}

async function touchGesture({ dx, dy }) {
  const location = await point(`${cardSelector}[data-active="true"]`);
  const start = { x: location.x, y: Math.max(100, Math.min(location.y, 650)) };
  await browser.evaluate('window.__cardSwapProbe.pointerEvents.length=0;window.__cardSwapProbe.captureCalls.length=0');
  await browser.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
  for (let step = 1; step <= 12; step++) {
    await browser.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + dx * step / 12, y: start.y + dy * step / 12 }] });
    await pause(25);
  }
  await browser.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function touchChecks() {
  await viewport(390);
  const initial = await navigate();
  await click('button[aria-label="Mostrar información de la obra"]', true);
  await pause(800);
  let current = await state();
  check(current.cards.find((card) => card.active).details === 'true' && current.cards.find((card) => card.active).detail.opacity >= .99, 'Touch information button reveals front artwork without hover');
  await screenshot('390-touch-information');
  await click('button[aria-label="Ocultar información de la obra"]', true);
  await pause(800);
  check((await state()).cards.find((card) => card.active).details === 'false', 'Touch information button hides details');
  await touchGesture({ dx: -150, dy: 0 });
  current = await settled();
  check(current.activeId !== initial.activeId, 'Emulated touch horizontal swipe advances artwork');
  check(current.cards.every((card) => card.details !== 'true'), 'Touch swipe does not accidentally open information');
  report.interactions.touchSwipe = { before: initial.activeId, after: current.activeId, touchAction: current.deck.touchAction, captureCalls: await browser.evaluate('window.__cardSwapProbe.captureCalls'), pointerEvents: await browser.evaluate('window.__cardSwapProbe.pointerEvents') };
  await screenshot('390-after-touch-swipe');
  // A downward scroll must originate on the card and remain a browser scroll gesture.
  await browser.evaluate(`(() => {const r=document.querySelector('${cardSelector}[data-active="true"]').getBoundingClientRect();scrollTo({top:Math.max(0,scrollY+r.top-330),behavior:'instant'});})()`);
  await pause(100);
  const beforeVertical = await state();
  await touchGesture({ dx: 4, dy: -170 });
  await pause(900);
  const afterVertical = await settled();
  check(afterVertical.viewport.scrollY > beforeVertical.viewport.scrollY + 30, 'Vertical touch gesture on card naturally scrolls the page', { before: beforeVertical.viewport.scrollY, after: afterVertical.viewport.scrollY });
  check(afterVertical.activeId === beforeVertical.activeId, 'Vertical touch gesture preserves active artwork');
  report.interactions.verticalScroll = { before: beforeVertical.viewport, after: afterVertical.viewport };
}

async function reducedMotionChecks() {
  await viewport(1440);
  await browser.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const initial = await navigate();
  await browser.evaluate('window.__cardSwapProbe.reset()');
  const start = Date.now();
  await click('button[aria-label="Obra siguiente"]');
  await pause(20);
  const immediate = await state();
  const immediateMilliseconds = Date.now() - start;
  await pause(250);
  const later = await state();
  const probe = await browser.evaluate('({frames:window.__cardSwapProbe.frames,frameExecutions:window.__cardSwapProbe.frameExecutions,mutations:window.__cardSwapProbe.mutations})');
  check(immediate.activeId !== initial.activeId, 'Reduced motion navigation activates next artwork immediately', { immediateMilliseconds });
  check(transformKey(immediate) === transformKey(later) && later.animations === 0, 'Reduced motion navigation has no animated displacement after the initial update');
  check(probe.frameExecutions === 0, 'Reduced motion navigation does not start a browser animation frame loop', probe);
  report.interactions.reducedMotion = { immediateMilliseconds, initial: initial.activeId, immediate: immediate.activeId, later: later.activeId, probe };
  await screenshot('1440-reduced-motion');
  await browser.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
}

await fs.mkdir(outputDirectory, { recursive: true });
try {
  await routingChecks();
  if (homeMode) await homeSSRChecks();
  browser = await connect();
  browser.on('Runtime.exceptionThrown', ({ exceptionDetails }) => report.errors.push({ kind: 'exception', ...exceptionDetails }));
  browser.on('Runtime.consoleAPICalled', ({ type, args, stackTrace }) => {
    if (type === 'error' || (type === 'warning' && args.some((entry) => /hydrat|mismatch/i.test(entry.value ?? '')))) report.errors.push({ kind: 'console', type, text: args.map((entry) => entry.value ?? entry.description).join(' '), stackTrace });
  });
  browser.on('Log.entryAdded', ({ entry }) => {
    if (entry.level === 'error' && !entry.url?.endsWith('/favicon.ico')) report.errors.push({ kind: 'log', ...entry });
  });
  for (const method of ['Page.enable', 'Runtime.enable', 'Log.enable', 'Network.enable']) await browser.send(method);
  await browser.send('Page.addScriptToEvaluateOnNewDocument', { source: `(${installProbe.toString()})()` });
  await browser.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await viewport(1440);
  await navigate();
  report.initialAllocations = await browser.evaluate(homeMode ? '({globalActivityExcluded:true,globalTimerAllocations:window.__cardSwapProbe.timers.length,globalFrameAllocations:window.__cardSwapProbe.frames.length,globalFrameExecutions:window.__cardSwapProbe.frameExecutions})' : '({timers:window.__cardSwapProbe.timers,frames:window.__cardSwapProbe.frames,frameExecutions:window.__cardSwapProbe.frameExecutions})');
  if (!focusedRun) {
  await idle('initial load');
  const otherTab = await connect();
  try {
    await otherTab.send('Page.enable');
    await otherTab.send('Page.bringToFront');
    await pause(600);
    report.backgroundVisibility = await browser.evaluate('document.visibilityState');
    await browser.send('Page.bringToFront');
    await waitFor('document.visibilityState === "visible"', 'tab return');
  } finally {
    await otherTab.close();
  }
  check(report.backgroundVisibility === 'hidden', 'Tab-return idle test actually backgrounds the prototype tab', report.backgroundVisibility);
  await idle('after tab return');
  await viewport(1024);
  await idle('after viewport resize');

  for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
    await viewport(width);
    const current = await navigate();
    validateRest(current, `${width}px`);
    report.viewports.push({ width, ...current });
    await screenshot(`${width}-rest`);
    if (width <= 430) await mobileInformationPanel(width);
    if (width === 1440) {
      report.resources = await browser.evaluate('performance.getEntriesByType("resource").map(entry => ({name:entry.name,initiatorType:entry.initiatorType,transferSize:entry.transferSize,encodedBodySize:entry.encodedBodySize,decodedBodySize:entry.decodedBodySize,duration:entry.duration}))');
      report.resourceTotals = report.resources.reduce((totals, entry) => {
        totals.transferSize += entry.transferSize;
        totals.encodedBodySize += entry.encodedBodySize;
        totals.decodedBodySize += entry.decodedBodySize;
        if (entry.initiatorType === 'script') totals.javascriptEncodedBodySize += entry.encodedBodySize;
        if (entry.initiatorType === 'img') totals.imageEncodedBodySize += entry.encodedBodySize;
        return totals;
      }, { transferSize: 0, encodedBodySize: 0, decodedBodySize: 0, javascriptEncodedBodySize: 0, imageEncodedBodySize: 0 });
    }
  }
  await hoverDetails();
  await navigationChecks();
  }
  if (homeMode) await homeChecks();
  await mouseDrag();
  await touchChecks();
  if (!focusedRun) {
  await reducedMotionChecks();
  }

  // The existing route remains the production fallback until the prototype is approved.
  await browser.send('Page.navigate', { url: `${origin}/exposiciones` });
  await waitFor('!!document.querySelector(".exhibition-slider__viewport")', 'legacy Exhibition fallback');
  await pause(800);
  report.legacy = await browser.evaluate('({legacy:!!document.querySelector(".exhibition-slider__viewport"),prototype:!!document.querySelector(".exhibition-card-swap"),overflow:document.documentElement.scrollWidth>innerWidth+1})');
  check(report.legacy.legacy && !report.legacy.prototype && !report.legacy.overflow, 'Existing Exhibition route remains available without prototype integration', report.legacy);
  await screenshot('legacy-exhibition-regression');
  check(report.errors.length === 0, 'No hydration, console, or uncaught browser errors', report.errors);
} catch (error) {
  report.fatal = error.stack ?? String(error);
  check(false, 'Browser verification completed', report.fatal);
  if (browser) await screenshot('failure').catch(() => {});
} finally {
  report.finishedAt = new Date().toISOString();
  report.passed = report.failures.length === 0;
  await fs.writeFile(path.join(outputDirectory, reportFilename), `${JSON.stringify(report, null, 2)}\n`);
  await browser?.close();
}

console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, failures: report.failures, report: path.join(outputDirectory, reportFilename), screenshots: report.screenshots.length }, null, 2));
if (!report.passed) process.exitCode = 1;
