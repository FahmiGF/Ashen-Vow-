// Frame-budget probe: measures render, simulation and real rAF cadence in Chrome.
// Usage: npm start && node tools/perf-probe.mjs

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9255;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const local = process.env.LOCALAPPDATA || '';
  const list = process.platform === 'win32'
    ? ['C:/Program Files/Google/Chrome/Application/chrome.exe',
       'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
       local ? join(local, 'Google/Chrome/Application/chrome.exe') : '',
       'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
    : ['/usr/bin/google-chrome', '/usr/bin/chromium'];
  return list.filter(Boolean).find(existsSync);
}

const profile = mkdtempSync(join(tmpdir(), 'ashen-perf-'));
const headed = process.env.HEADED === '1';
const chrome = spawn(findBrowser(), [
  ...(headed ? ['--window-position=-2400,-2400'] : ['--headless=new']),
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--mute-audio', '--window-size=1280,900', URL,
], { stdio: 'ignore' });

let ws;
try {
  await fetch(URL, { method: 'HEAD' });
  let page;
  for (let i = 0; i < 100; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      page = list.find((t) => t.type === 'page' && t.url.startsWith(URL));
      if (page) break;
    } catch { /* starting */ }
    await sleep(150);
  }
  assert.ok(page, 'page target');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const n = ++id;
    pending.set(n, (m) => (m.error ? rej(new Error(m.error.message)) : res(m.result)));
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.bringToFront');
  await sleep(2200);
  for (let i = 0; i < 80 && !(await evaluate('typeof window.__ashen === "object"')); i++) await sleep(100);

  const info = await evaluate(`(() => {
    const A = window.__ashen;
    A.clearProgress();
    A.start();
    A.enterRoom(1);
    A.togglePause();
    return {
      version: A.version,
      dpr: A.renderer.dpr,
      canvas: [A.renderer.canvas.width, A.renderer.canvas.height],
      view: [A.game.viewW, A.game.viewH],
      room: A.snap().room,
      fps: A.fps,
      quality: A.renderer.options,
    };
  })()`);

  const render = await evaluate(`(() => {
    const A = window.__ashen;
    const ctx = A.renderer.ctx;
    const flush = () => ctx.getImageData(0, 0, 1, 1);
    for (let i = 0; i < 20; i++) { A.renderer.render(A.game); flush(); }
    const t0 = performance.now();
    for (let i = 0; i < 60; i++) { A.renderer.render(A.game); flush(); }
    const ms = (performance.now() - t0) / 60;
    return { ms: +ms.toFixed(2), fps: +(1000 / ms).toFixed(1) };
  })()`);

  const scaled = await evaluate(`(() => {
    const A = window.__ashen;
    const R = A.renderer;
    R.setPixelScale(0.6);
    const ctx = R.ctx;
    const flush = () => ctx.getImageData(0, 0, 1, 1);
    for (let i = 0; i < 15; i++) { R.render(A.game); flush(); }
    const t0 = performance.now();
    for (let i = 0; i < 60; i++) { R.render(A.game); flush(); }
    const ms = (performance.now() - t0) / 60;
    const out = { ms: +ms.toFixed(2), fps: +(1000 / ms).toFixed(1), dpr: R.dpr, canvas: [R.canvas.width, R.canvas.height] };
    R.setPixelScale(1);
    return out;
  })()`);

  const sim = await evaluate(`(() => {
    const A = window.__ashen;
    for (let i = 0; i < 300; i++) A.game.update(1 / 120, {});
    const t0 = performance.now();
    for (let i = 0; i < 1200; i++) A.game.update(1 / 120, {});
    const ms = (performance.now() - t0) / 1200;
    return { ms: +ms.toFixed(3), stepsPerSec: Math.round(1000 / ms) };
  })()`);

  const raf = await evaluate(`(async () => {
    const A = window.__ashen;
    A.togglePause();
    const gaps = [];
    let last = performance.now();
    await new Promise((resolve) => {
      const tick = (now) => {
        gaps.push(now - last);
        last = now;
        if (gaps.length < 180) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    gaps.shift();
    gaps.sort((a, b) => a - b);
    const avg = gaps.reduce((s, v) => s + v, 0) / gaps.length;
    return {
      fps: +(1000 / avg).toFixed(1),
      avg: +avg.toFixed(2),
      p50: +gaps[Math.floor(gaps.length * 0.5)].toFixed(2),
      p95: +gaps[Math.floor(gaps.length * 0.95)].toFixed(2),
      worst: +gaps[gaps.length - 1].toFixed(2),
      hudFps: A.fps,
    };
  })()`);

  const breakdown = await evaluate(`(() => {
    const A = window.__ashen;
    const R = A.renderer;
    const ctx = R.ctx;
    const flush = () => ctx.getImageData(0, 0, 1, 1);
    const names = ['drawBackground', 'drawGate', 'drawCheckpoint', 'drawRelic', 'drawPlatforms',
      'drawRoomProps', 'drawFairies', 'drawHazards', 'drawCollectibles', 'drawProjectiles',
      'drawEnemies', 'drawBoss', 'drawPlayer', 'drawFx', 'drawForeground'];
    const totals = {};
    const originals = {};
    for (const name of names) {
      originals[name] = R[name];
      totals[name] = 0;
      R[name] = function patched(...args) {
        const t0 = performance.now();
        const out = originals[name].apply(this, args);
        flush();
        totals[name] += performance.now() - t0;
        return out;
      };
    }
    for (let i = 0; i < 30; i++) R.render(A.game);
    for (const name of names) R[name] = originals[name];
    const out = {};
    for (const name of names) out[name] = +(totals[name] / 30).toFixed(2);
    return out;
  })()`);

  const layerCost = await evaluate(`(() => {
    const A = window.__ashen;
    const R = A.renderer;
    const ctx = R.ctx;
    const flush = () => ctx.getImageData(0, 0, 1, 1);
    const costs = {};
    for (const [key, canvas] of R._layers) {
      for (let i = 0; i < 5; i++) { ctx.drawImage(canvas, 0, 0); flush(); }
      const t0 = performance.now();
      for (let i = 0; i < 20; i++) { ctx.drawImage(canvas, 0, 0); flush(); }
      costs[key] = +((performance.now() - t0) / 20).toFixed(2);
    }
    const g = ctx.createLinearGradient(0, 0, 0, 540);
    g.addColorStop(0, '#000');
    g.addColorStop(1, '#111');
    const t0 = performance.now();
    for (let i = 0; i < 20; i++) { ctx.globalAlpha = 0.5; ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 540); ctx.globalAlpha = 1; flush(); }
    costs['halfAlphaGradientFill'] = +((performance.now() - t0) / 20).toFixed(2);
    return costs;
  })()`);

  console.log(JSON.stringify({ info, render, scaled, sim, raf, breakdown, layerCost }, null, 2));
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
}
