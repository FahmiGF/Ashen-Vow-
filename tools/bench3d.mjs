// Real-browser 3D benchmark. Measures frame pacing of the WebGL2 GLB pipeline
// and a short heap soak, then prints exactly what this machine produced. It is a
// measurement harness, not a claim about other hardware.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9337;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');
const profile = mkdtempSync(join(tmpdir(), 'ashen-bench3d-'));
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader', '--mute-audio', '--window-size=1440,960', URL,
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
let seq = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, (message) => (message.error ? reject(new Error(message.error.message)) : resolve(message.result)));
  ws.send(JSON.stringify({ id, method, params }));
});
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function waitFor(fn, timeout = 30000, label = 'condition') {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const value = await fn();
      if (value) return value;
    } catch { /* retry */ }
    await sleep(150);
  }
  throw new Error(`timed out: ${label}`);
}

try {
  const pages = await waitFor(async () => {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    return list.some((entry) => entry.type === 'page' && entry.url.startsWith(URL)) ? list : null;
  }, 20000, 'chrome page');
  const page = pages.find((entry) => entry.type === 'page' && entry.url.startsWith(URL));
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const cb = pending.get(message.id);
    if (cb) {
      pending.delete(message.id);
      cb(message);
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.bringToFront');
  await waitFor(() => evaluate('typeof window.__ashen === "object"'), 25000, 'boot');

  await evaluate(`(async () => {
    document.getElementById('btn-mode3d-menu').click();
    await new Promise((r) => setTimeout(r, 400));
  })()`);
  await waitFor(async () => (await evaluate('window.__ashen.gfx3D.state')) === 'ready', 40000, 'gfx3D ready');

  const info = await evaluate(`(() => {
    const s = window.__ashen.gfx3D;
    const c = window.__ashen.capabilities;
    return { gpu: c.gpuRenderer, vendor: c.gpuVendor, tier: c.gpuTier, hdr: s.hdr, msaa: s.msaa, aniso: s.anisotropic, models: s.models, props: s.props,
      internal: s.internalWidth, memory: performance.memory ? performance.memory.usedJSHeapSize : null };
  })()`);

  // 180 frames: frame interval from requestAnimationFrame plus the renderer's own
  // measured render cost.
  const frameStats = await evaluate(`(async () => {
    const intervals = [];
    const renderCosts = [];
    let last = performance.now();
    for (let i = 0; i < 180; i += 1) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const now = performance.now();
      intervals.push(now - last);
      last = now;
      const stats = window.__ashen.gfx3D.stats;
      if (stats && stats.frameMs) renderCosts.push(stats.frameMs);
    }
    const sorted = [...intervals].sort((a, b) => a - b);
    const costs = [...renderCosts].sort((a, b) => a - b);
    const pick = (arr, p) => (arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * p))] : null);
    return {
      frames: intervals.length,
      mean: intervals.reduce((a, b) => a + b, 0) / intervals.length,
      p50: pick(sorted, 0.5),
      p95: pick(sorted, 0.95),
      worst: sorted[sorted.length - 1],
      renderP50: pick(costs, 0.5),
      renderP95: pick(costs, 0.95),
      heap: performance.memory ? performance.memory.usedJSHeapSize : null,
      triangles: window.__ashen.gfx3D.stats.triangles,
      drawCalls: window.__ashen.gfx3D.stats.drawCalls,
    };
  })()`);

  // Short soak: switch areas repeatedly and confirm the heap does not run away.
  const soak = await evaluate(`(async () => {
    const start = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const areas = ['veilroot_approach', 'obsidian_forge', 'pale_court', 'veil_edge', 'thornveil_heart'];
    for (let i = 0; i < 25; i += 1) {
      window.__ashen.setArea3D(areas[i % areas.length]);
      await new Promise((r) => requestAnimationFrame(r));
    }
    await new Promise((r) => setTimeout(r, 300));
    const end = performance.memory ? performance.memory.usedJSHeapSize : 0;
    return { start, end, state: window.__ashen.gfx3D.state };
  })()`);

  // Read pipeline state again AFTER frames have rendered: HDR format, MSAA and
  // anisotropy are only finalised once the targets exist.
  const finalInfo = await evaluate(`(() => {
    const s = window.__ashen.gfx3D;
    const c = window.__ashen.capabilities;
    return { gpu: c.gpuRenderer, tier: c.gpuTier, hdr: s.hdr, msaa: s.msaa, aniso: s.anisotropic, models: s.models, props: s.props, internal: s.internalWidth };
  })()`);

  const fmt = (value) => (value === null || value === undefined ? 'n/a' : Number(value).toFixed(2));
  const mb = (bytes) => (bytes ? `${(bytes / 1048576).toFixed(1)} MB` : 'unavailable');
  console.log('3D benchmark (measured on this machine)');
  console.log(`  adapter        : ${finalInfo.gpu || 'masked'} ${finalInfo.tier ? `(${finalInfo.tier})` : ''}`);
  console.log(`  pipeline       : HDR ${finalInfo.hdr}, MSAA ${finalInfo.msaa}x, aniso ${finalInfo.aniso}x, ${finalInfo.models} models / ${finalInfo.props} props`);
  console.log(`  internal width : ${finalInfo.internal}px`);
  console.log(`  draw calls     : ${frameStats.drawCalls}, triangles ${Math.round(frameStats.triangles)}`);
  console.log(`  frame interval : mean ${fmt(frameStats.mean)} ms, p50 ${fmt(frameStats.p50)} ms, p95 ${fmt(frameStats.p95)} ms, worst ${fmt(frameStats.worst)} ms (${frameStats.frames} frames)`);
  console.log(`  render cost    : p50 ${fmt(frameStats.renderP50)} ms, p95 ${fmt(frameStats.renderP95)} ms`);
  console.log(`  heap           : ${mb(frameStats.heap)} after run`);
  console.log(`  soak           : ${mb(soak.start)} -> ${mb(soak.end)} across 25 area switches, renderer still ${soak.state}`);
  const growth = soak.start && soak.end ? (soak.end - soak.start) / soak.start : 0;
  console.log(`  soak growth    : ${(growth * 100).toFixed(1)}%`);
  if (finalInfo.gpu && /swiftshader|llvmpipe|software/i.test(finalInfo.gpu)) {
    console.log('  note           : software rasterizer in this environment; numbers are not representative of GPU hardware.');
  }
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
}
