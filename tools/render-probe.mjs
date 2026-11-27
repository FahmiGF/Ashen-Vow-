// Renderer layer probe (headless Chrome + CDP).
//
// Times individual renderer layers instead of the whole frame, so a change can
// be attributed to the function that actually moved. Canvas micro-timings on a
// software rasterizer are noisy run to run: compare medians of several runs,
// and prefer controlled A/B measurements of one primitive over whole-frame
// deltas.
//
// Usage:
//   npm start
//   node tools/render-probe.mjs
//
// Env: ASHEN_URL, CHROME_PATH, CDP_PORT (default 9273), ITER (default 240).

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9273;
const ITER = Number(process.env.ITER) || 240;
const ROOM = Number(process.env.ROOM) || 663;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const local = process.env.LOCALAPPDATA || '';
  const list = process.platform === 'win32'
    ? ['C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      local ? join(local, 'Google/Chrome/Application/chrome.exe') : '',
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium'];
  const found = list.filter(Boolean).find((path) => existsSync(path));
  if (!found) throw new Error('No Chrome/Chromium found. Set CHROME_PATH.');
  return found;
}

const profileDir = mkdtempSync(join(tmpdir(), 'ashen-render-'));
const chrome = spawn(findBrowser(), [
  '--headless=new',
  ...(process.env.ASHEN_CHROME_NO_SANDBOX === '1' ? ['--no-sandbox'] : []),
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profileDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--mute-audio',
  '--window-size=1280,900',
  URL,
], { stdio: 'ignore' });

let ws;
try {
  assert.equal((await fetch(URL, { method: 'HEAD' })).ok, true, 'game server must be running');
  let page;
  for (let i = 0; i < 120; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      page = list.find((target) => target.type === 'page' && target.url.startsWith(URL));
      if (page) break;
    } catch { /* still starting */ }
    await sleep(150);
  }
  assert.ok(page, 'Chrome page target');

  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, (message) => {
      if (message.error) reject(new Error(`${method}: ${message.error.message}`));
      else resolve(message.result);
    });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.bringToFront');
  await sleep(2000);
  for (let i = 0; i < 80; i += 1) {
    if (await evaluate('typeof window.__ashen === "object"')) break;
    await sleep(120);
  }

  const detail = await evaluate(`(() => {
    const A = window.__ashen;
    if (A.menuView === 'trailer') A.closeTrailer();
    A.clearProgress();
    A.unlockCistern();
    A.cisternClear(0);
    A.startCisternStage(1);
    return { room: A.game.roomIndex, name: A.game.room.name };
  })()`);
  assert.equal(detail.room, ROOM, 'cistern room 663 loads');
  await sleep(400);

  const probe = await evaluate(`(async () => {
    const A = window.__ashen;
    const R = A.renderer;
    const game = A.game;
    const ctx = R.ctx;
    const room = game.room;
    const pal = { ...room.palette };
    const camX = 0;
    const t = game.time;
    const flush = () => ctx.getImageData(0, 0, 1, 1);
    const time = (label, fn, iterations) => {
      for (let i = 0; i < 20; i += 1) { fn(i); flush(); }
      const start = performance.now();
      for (let i = 0; i < iterations; i += 1) { fn(i); flush(); }
      return { label, ms: +((performance.now() - start) / iterations).toFixed(3) };
    };
    const layers = [
      time('background', (i) => R.drawCisternBackground(ctx, room, pal, camX + i, t + i * 0.016, game), ${ITER}),
      time('weather', (i) => R.drawWeather(ctx, game, pal, t + i * 0.016, camX), ${ITER}),
      time('platforms', (i) => R.drawPlatforms(ctx, room, pal, t + i * 0.016), ${ITER}),
      time('full render', (i) => R.render(game), 80),
    ];
    const stroke = ctx.stroke;
    let strokes = 0;
    ctx.stroke = function (...args) {
      strokes += 1;
      return stroke.apply(this, args);
    };
    let pixels;
    ctx.save();
    try {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      R.drawCisternBackground(ctx, room, pal, 120, 4.25);
      pixels = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
    } finally {
      ctx.restore();
      ctx.stroke = stroke;
    }
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', pixels));
    const pixelHash = Array.from(hash, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return { layers, strokes, pixelHash };
  })()`);

  console.log(`cistern room ${detail.room} — ${detail.name}`);
  for (const layer of probe.layers) console.log(`${layer.label.padEnd(14)} ${String(layer.ms).padStart(7)} ms`);
  console.log(JSON.stringify(probe, null, 2));
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
  await sleep(300);
  try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* windows lock */ }
}
