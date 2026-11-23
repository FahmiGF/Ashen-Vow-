// Background cost probe across room types: legacy ash, mycelial, biome
// parallax, court and a late arc room. Usage: node tools/bg-probe.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9277;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const local = process.env.LOCALAPPDATA || '';
  const list = process.platform === 'win32'
    ? ['C:/Program Files/Google/Chrome/Application/chrome.exe',
      local ? join(local, 'Google/Chrome/Application/chrome.exe') : '',
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
    : ['/usr/bin/google-chrome', '/usr/bin/chromium'];
  return list.filter(Boolean).find((path) => existsSync(path));
}

const dir = mkdtempSync(join(tmpdir(), 'ashen-bg-'));
const chrome = spawn(findBrowser(), [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`,
  '--no-first-run', '--mute-audio', '--window-size=1280,900', URL,
], { stdio: 'ignore' });

let ws;
try {
  let page;
  for (let i = 0; i < 120; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      page = list.find((t) => t.type === 'page' && t.url.startsWith(URL));
      if (page) break;
    } catch { /* starting */ }
    await sleep(150);
  }
  assert.ok(page, 'page target');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });
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
  for (let i = 0; i < 120 && !(await evaluate('typeof window.__ashen === "object"')); i += 1) await sleep(100);

  const out = await evaluate(`(() => {
    const A = window.__ashen;
    A.clearProgress();
    A.start();
    A.togglePause();
    const R = A.renderer;
    const ctx = R.ctx;
    const bench = (fn, n = 24) => {
      for (let i = 0; i < 8; i += 1) { fn(); ctx.getImageData(0, 0, 1, 1); }
      const t0 = performance.now();
      for (let i = 0; i < n; i += 1) { fn(); ctx.getImageData(0, 0, 1, 1); }
      return +((performance.now() - t0) / n).toFixed(2);
    };
    const original = R.drawBackground;
    const rows = [];
    for (const roomId of [1, 9, 14, 120, 360, 520]) {
      try { A.enterRoom(roomId); } catch { continue; }
      const game = A.game;
      const room = game.room;
      if (!room) continue;
      R.drawBackground = original;
      const full = bench(() => R.render(game));
      R.drawBackground = function noBackground() {};
      const bare = bench(() => R.render(game));
      R.drawBackground = original;
      rows.push({
        room: roomId,
        name: room.name,
        biome: room.biome || '',
        parallax: room.parallax || '',
        mycelial: roomId >= 8 && roomId < 14,
        full,
        bare,
        background: +(full - bare).toFixed(2),
      });
    }
    R.drawBackground = original;

    // Parallax source experiments on the legacy strip.
    A.enterRoom(1);
    const pal = { fog: '#26313a', glow: '#d07a35', top: '#0c0a09' };
    const layer = R._archesLayer(pal);
    const offset = 420;
    const pattern = ctx.createPattern(layer, 'repeat');
    if (pattern.setTransform) pattern.setTransform(new DOMMatrix([1, 0, 0, 1, -offset, 0]));
    const patternFill = bench(() => { ctx.fillStyle = pattern; ctx.fillRect(0, 0, 960, 540); }, 16);
    const translateBlit = bench(() => { ctx.save(); ctx.translate(-offset, 0); ctx.drawImage(layer, 0, 0); ctx.restore(); }, 6);
    const cropAt420 = bench(() => ctx.drawImage(layer, offset, 0, 960, 540, 0, 0, 960, 540), 10);
    return { rows, patternFill, translateBlit, cropAt420 };
  })()`);
  for (const row of out.rows) console.log(JSON.stringify(row));
  console.log(JSON.stringify({ patternFill: out.patternFill, translateBlit: out.translateBlit, cropAt420: out.cropAt420 }));
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
  await sleep(250);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
}
