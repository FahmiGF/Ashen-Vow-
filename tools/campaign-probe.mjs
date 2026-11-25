// Campaign renderer probe (headless Chrome + CDP): per-layer cost and
// per-frame gradient allocations for a spread of room types.
// Usage: npm start && node tools/campaign-probe.mjs   (ROOMS=0,2,5 ITER=120 GPU=1)
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
const ROOMS = (process.env.ROOMS || '0,1,2,3,5,7,8,9,11,13,14,40,113,354,414,426,485,525,662,669').split(',').map(Number);
const GPU = process.env.GPU === '1';
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
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profileDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--mute-audio',
  ...(GPU ? ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] : ['--disable-gpu']),
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


  const results = [];
  for (const room of ROOMS) {
    const r = await evaluate(`(async () => {
      const A = window.__ashen;
      A.start(0);
      await new Promise((r) => setTimeout(r, 120));
      A.enterRoom(${room});
      A.togglePause?.(); A.togglePause?.();
      await new Promise((r) => setTimeout(r, 200));
      const R = A.renderer, game = A.game, ctx = R.ctx;
      const proto = Object.getPrototypeOf(R);
      const names = Object.getOwnPropertyNames(proto).filter((n) => /^draw/.test(n) && typeof proto[n] === 'function');
      const totals = {};
      const depth = { v: 0 };
      const wrapped = {};
      for (const n of names) {
        const orig = proto[n];
        wrapped[n] = orig;
        R[n] = function (...args) {
          const top = depth.v === 0;
          depth.v += 1;
          const s = performance.now();
          try { return orig.apply(this, args); } finally {
            depth.v -= 1;
            const d = performance.now() - s;
            if (depth.v === 0 || true) totals[n] = (totals[n] || 0) + d;
          }
        };
      }
      let grads = 0;
      const lg = ctx.createLinearGradient, rg = ctx.createRadialGradient, pat = ctx.createPattern;
      ctx.createLinearGradient = function (...a) { grads += 1; return lg.apply(this, a); };
      ctx.createRadialGradient = function (...a) { grads += 1; return rg.apply(this, a); };
      const flush = () => ctx.getImageData(0, 0, 1, 1);
      const N = ${ITER};
      for (let i = 0; i < 20; i += 1) { game.time += 1 / 60; R.render(game); flush(); }
      for (const k of Object.keys(totals)) delete totals[k];
      grads = 0;
      const start = performance.now();
      for (let i = 0; i < N; i += 1) { game.time += 1 / 60; R.render(game); flush(); }
      const ms = (performance.now() - start) / N;
      const g = grads / N;
      // sim cost
      const st = performance.now();
      const input = { left: false, right: false, jump: false, attack: false, dash: false };
      let steps = 0;
      for (let i = 0; i < 600 && game.state === 'playing'; i += 1) { game.update(1 / 120, input); steps += 1; }
      const simMs = (performance.now() - st) / Math.max(1, steps);
      for (const n of names) delete R[n];
      ctx.createLinearGradient = lg; ctx.createRadialGradient = rg;
      const top = Object.entries(totals).map(([k, v]) => [k, +(v / N).toFixed(2)]).sort((a, b) => b[1] - a[1]).slice(0, 8);
      return { room: ${room}, name: game.room?.name, zone: game.room?.zone || '', enemies: game.enemies?.length || 0, ms: +ms.toFixed(2), gradients: +g.toFixed(1), simMs: +simMs.toFixed(3), canvas: R.canvas.width + 'x' + R.canvas.height, top };
    })()`);
    results.push(r);
    console.log(`${String(r.room).padStart(4)} ${String(r.name).slice(0, 24).padEnd(24)} ${String(r.ms).padStart(6)} ms  grad/frame ${String(r.gradients).padStart(5)}  sim ${r.simMs} ms/step  enemies ${r.enemies}  ${r.top.slice(0, 4).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  }
  console.log(JSON.stringify(results));
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
  await sleep(300);
  try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* windows lock */ }
}
