// Real frame-cost profile in Chrome: rAF cadence + Long Animation Frame (LoAF)
// attribution per scenario. Usage: npm start && node tools/frame-profile.mjs
// Add SCENARIOS=pirates,wave to limit runs; HEADED=1 to watch.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9271;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const WANTED = (process.env.SCENARIOS || 'menu,campaign,pirates,pirateEndless,wave,waveEndless')
  .split(',').map((entry) => entry.trim()).filter(Boolean);

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

const profileDir = mkdtempSync(join(tmpdir(), 'ashen-frames-'));
const chrome = spawn(findBrowser(), [
  ...(process.env.HEADED === '1' ? [] : ['--headless=new']),
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profileDir}`,
  '--no-first-run', '--no-default-browser-check', '--mute-audio',
  '--window-size=1280,900', URL,
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
    } catch { /* starting */ }
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
    pending.set(id, (message) => (message.error ? reject(new Error(`${method}: ${message.error.message}`)) : resolve(message.result)));
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
  for (let i = 0; i < 120 && !(await evaluate('typeof window.__ashen === "object"')); i += 1) await sleep(100);

  // LoAF is the browser's own record of what made a frame late (scripts,
  // rendering, style/layout). rAF gaps give the honest end-to-end cadence.
  const support = await evaluate(`(() => {
    window.__pf = { loaf: [], gaps: [], watching: false };
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__pf.loaf.push({
            duration: +entry.duration.toFixed(2),
            blocking: +(entry.blockingDuration || 0).toFixed(2),
            render: entry.renderStart ? +(entry.duration - (entry.renderStart - entry.startTime)).toFixed(2) : 0,
          });
        }
      }).observe({ type: 'long-animation-frame', buffered: true });
      window.__pf.loafSupported = true;
    } catch { window.__pf.loafSupported = false; }
    return { loaf: window.__pf.loafSupported, webgl2: !!document.createElement('canvas').getContext('webgl2') };
  })()`);

  const sample = async (ms) => evaluate(`(async () => {
    const pf = window.__pf;
    pf.loaf.length = 0;
    const gaps = [];
    pf.watching = true;
    const start = performance.now();
    await new Promise((resolve) => {
      const tick = (now) => {
        const last = pf._last ?? now;
        pf._last = now;
        if (gaps.length) gaps.push(now - last);
        else gaps.push(0);
        if (now - start < ${ms}) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    pf._last = 0;
    gaps.shift();
    const sorted = [...gaps].sort((a, b) => a - b);
    const pick = (p) => +(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] || 0).toFixed(2);
    const avg = gaps.reduce((sum, value) => sum + value, 0) / Math.max(1, gaps.length);
    const loaf = pf.loaf.map((entry) => entry.duration);
    loaf.sort((a, b) => a - b);
    return {
      frames: gaps.length,
      fps: +(1000 / avg).toFixed(1),
      p50: pick(0.5),
      p95: pick(0.95),
      p99: pick(0.99),
      worst: +(sorted[sorted.length - 1] || 0).toFixed(2),
      longFrames: loaf.length,
      loafP95: +(loaf[Math.floor(loaf.length * 0.95)] || 0).toFixed(2),
      loafWorst: +(loaf[loaf.length - 1] || 0).toFixed(2),
      hudFps: window.__ashen.fps,
    };
  })()`);

  const setup = {
    menu: `(() => { const A = window.__ashen; A.showMenu(); return 'menu'; })()`,
    campaign: `(() => {
      const A = window.__ashen;
      A.clearProgress();
      A.start();
      A.enterRoom(3);
      return A.snap().room;
    })()`,
    pirates: `(() => {
      const A = window.__ashen;
      A.showPirates();
      A.setPirateStage('first_tide');
      A.startPirateVoyage();
      A.pirateSetKills(4);
      A.pirateStep(0.2);
      return A.pirates.snapshot.enemies.length;
    })()`,
    pirateEndless: `(() => {
      const A = window.__ashen;
      A.startPirateEndless();
      for (let i = 0; i < 21; i += 1) A.pirateNextSurge();
      A.pirateStep(0.2);
      return A.pirates.snapshot.surge;
    })()`,
    wave: `(() => {
      const A = window.__ashen;
      A.leavePirates();
      A.showWaveDefense();
      A.setWaveDefenseMap('sunken_causeway');
      A.setWaveDefenseMode('classic');
      A.startWaveDefenseBattle();
      A.waveDefenseGold(5000);
      for (let slot = 0; slot < 12; slot += 1) A.waveDefenseBuild(slot, slot % 4 === 0 ? 'trebuchet' : 'sniper_nest');
      A.waveDefenseSetWave(20);
      A.waveDefenseNextWave();
      A.waveDefenseStep(7);
      return A.waveDefense.snapshot.wave;
    })()`,
    waveEndless: `(() => {
      const A = window.__ashen;
      A.leaveWaveDefense();
      A.showWaveDefense();
      A.setWaveDefenseMode('endless');
      A.startWaveDefenseBattle();
      A.waveDefenseGold(5000);
      for (let slot = 0; slot < 14; slot += 1) A.waveDefenseBuild(slot, slot % 3 === 0 ? 'cannon_tower' : 'sniper_nest');
      A.waveDefenseSetWave(26);
      A.waveDefenseNextWave();
      A.waveDefenseStep(7);
      return A.waveDefense.snapshot.wave;
    })()`,
  };

  // Direct canvas cost with a readback flush: independent of the headless
  // compositor's vsync, so it shows what the renderer itself costs.
  const directMeasure = {
    campaign: `(() => {
      const A = window.__ashen;
      const ctx = A.renderer.ctx;
      const flush = () => ctx.getImageData(0, 0, 1, 1);
      for (let i = 0; i < 12; i += 1) { A.renderer.render(A.game); flush(); }
      const t0 = performance.now();
      for (let i = 0; i < 60; i += 1) { A.renderer.render(A.game); flush(); }
      return +((performance.now() - t0) / 60).toFixed(2);
    })()`,
    pirates: `(() => {
      const A = window.__ashen;
      const canvas = document.getElementById('pirate-canvas');
      const flush = () => canvas.getContext('2d').getImageData(0, 0, 1, 1);
      for (let i = 0; i < 10; i += 1) { A.renderPirateFrame(); flush(); }
      const t0 = performance.now();
      for (let i = 0; i < 50; i += 1) { A.renderPirateFrame(); flush(); }
      return +((performance.now() - t0) / 50).toFixed(2);
    })()`,
    wave: `(() => {
      const A = window.__ashen;
      const canvas = document.getElementById('wd-canvas');
      const flush = () => canvas.getContext('2d').getImageData(0, 0, 1, 1);
      for (let i = 0; i < 10; i += 1) { A.renderWaveDefenseFrame(); flush(); }
      const t0 = performance.now();
      for (let i = 0; i < 50; i += 1) { A.renderWaveDefenseFrame(); flush(); }
      return +((performance.now() - t0) / 50).toFixed(2);
    })()`,
  };
  directMeasure.pirateEndless = directMeasure.pirates;
  directMeasure.waveEndless = directMeasure.wave;

  // CPU sampling attributes the real loop cost per function instead of
  // guessing from canvas readback, which includes a GPU sync.
  await send('Profiler.enable');
  await send('Profiler.setSamplingInterval', { interval: 250 });
  const cpuProfile = async () => {
    await send('Profiler.start');
    await sleep(2200);
    const { profile } = await send('Profiler.stop');
    const totals = new Map();
    let samples = 0;
    for (const node of profile.nodes) {
      const hits = node.hitCount || 0;
      if (!hits) continue;
      samples += hits;
      const name = node.callFrame.functionName || '(anonymous)';
      if (name === '(idle)' || name === '(program)' || name === '(garbage collector)') continue;
      const file = (node.callFrame.url || '').split('/').pop() || 'native';
      const key = `${name} · ${file}:${(node.callFrame.lineNumber || 0) + 1}`;
      totals.set(key, (totals.get(key) || 0) + hits);
    }
    const top = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([fn, hits]) => ({ fn, pct: +((hits / Math.max(1, samples)) * 100).toFixed(1) }));
    return { samples, top };
  };

  const results = [];
  for (const name of WANTED) {
    if (!setup[name]) continue;
    const detail = await evaluate(setup[name]);
    await sleep(700);
    const result = await sample(2600);
    const direct = directMeasure[name] ? await evaluate(directMeasure[name]) : null;
    const cpu = await cpuProfile();
    results.push({ scenario: name, detail, directMs: direct, cpu, ...result });
    console.log(`${name.padEnd(13)} ${String(result.fps).padStart(6)} fps · p50 ${result.p50} ms · p95 ${result.p95} ms · worst ${result.worst} ms · canvas ${direct == null ? '—' : `${direct} ms`} · long frames ${result.longFrames}`);
    console.log(`               cpu ${cpu.top.slice(0, 4).map((entry) => `${entry.fn} ${entry.pct}%`).join(' | ')}`);
  }

  console.log('\n' + JSON.stringify({ support, results }, null, 2));
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
  await sleep(300);
  try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* windows lock */ }
}
