// Real frame-cost profile in Chrome: rAF cadence + Long Animation Frame (LoAF)
// attribution per scenario. Usage: npm start && node tools/frame-profile.mjs
// Set SCENARIOS to a comma-separated subset, e.g. riftwar,godfall,horror3d.
// HEADED=1 opens a visible browser with a temporary test profile.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9271;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const WANTED = (process.env.SCENARIOS || 'menu,campaign,cistern,lanternwake,pirates,pirateEndless,wave,waveEndless,infinitower,riftwar,godfall,horror2d,horror3d')
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
  '--no-first-run',
  ...(process.env.ASHEN_CHROME_NO_SANDBOX === '1' ? ['--no-sandbox'] : []), '--no-default-browser-check', '--mute-audio',
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
  await evaluate('if (window.__ashen?.menuView === "trailer") window.__ashen.closeTrailer()');

  // LoAF is the browser's own record of what made a frame late (scripts,
  // rendering, style/layout). rAF gaps give the honest end-to-end cadence.
  const support = await evaluate(`(() => {
    window.__pf = { loaf: [] };
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__pf.loaf.push({
            startTime: entry.startTime,
            duration: +entry.duration.toFixed(2),
            blocking: +(entry.blockingDuration || 0).toFixed(2),
            render: entry.renderStart ? +(entry.duration - (entry.renderStart - entry.startTime)).toFixed(2) : 0,
          });
        }
      }).observe({ type: 'long-animation-frame', buffered: true });
      window.__pf.loafSupported = true;
    } catch { window.__pf.loafSupported = false; }
    const gl = document.createElement('canvas').getContext('webgl2');
    const debug = gl?.getExtension('WEBGL_debug_renderer_info');
    return {
      loaf: window.__pf.loafSupported,
      webgl2: !!gl,
      webglRenderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
    };
  })()`);

  const sample = async (ms) => evaluate(`(async () => {
    const pf = window.__pf;
    pf.loaf.length = 0;
    const gaps = [];
    const start = performance.now();
    let last;
    await new Promise((resolve) => {
      const tick = (now) => {
        if (last !== undefined) gaps.push(now - last);
        last = now;
        if (now - start < ${ms}) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    const sorted = [...gaps].sort((a, b) => a - b);
    const pick = (p) => +(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] || 0).toFixed(2);
    const avg = gaps.reduce((sum, value) => sum + value, 0) / Math.max(1, gaps.length);
    const loaf = pf.loaf.filter((entry) => entry.startTime >= start).map((entry) => entry.duration);
    loaf.sort((a, b) => a - b);
    return {
      frames: gaps.length,
      fps: +(1000 / avg).toFixed(1),
      p50: pick(0.5),
      p95: pick(0.95),
      p99: pick(0.99),
      worst: +(sorted[sorted.length - 1] || 0).toFixed(2),
      gapsOver50Ms: gaps.filter((gap) => gap > 50).length,
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
    pirates: `(async () => {
      const A = window.__ashen;
      await A.showPirates();
      A.setPirateStage('first_tide');
      A.startPirateVoyage();
      A.pirateSetKills(4);
      A.pirateStep(0.2);
      return A.pirates.snapshot.enemies.length;
    })()`,
    pirateEndless: `(async () => {
      const A = window.__ashen;
      await A.showPirates();
      A.startPirateEndless();
      for (let i = 0; i < 21; i += 1) A.pirateNextSurge();
      A.pirateStep(0.2);
      return A.pirates.snapshot.surge;
    })()`,
    cistern: `(() => {
      const A = window.__ashen;
      A.clearProgress();
      A.unlockCistern();
      A.cisternClear(0);
      A.startCisternStage(1);
      return A.snap().room;
    })()`,
    lanternwake: `(() => {
      const A = window.__ashen;
      A.clearProgress();
      A.unlockCistern();
      for (let hall = 0; hall < 4; hall += 1) A.cisternClear(hall);
      A.cisternBossDown();
      A.lanternwakeClear(0);
      const stage = A.lanternwakeStart(1);
      if (stage.runKind !== 'lanternwake' || stage.stage !== 1) throw new Error('Lanternwake hall 2 failed to load');
      return { room: stage.room, enemies: A.game.enemies.length };
    })()`,
    riftwar: `(() => {
      const A = window.__ashen;
      A.showMoba();
      A.setMobaHero('frontier_riftwalker');
      A.setMobaMap('ember_vale');
      A.setMobaLane('top');
      document.querySelector('[data-moba-difficulty="veteran"]').click();
      A.startMobaBattle();
      const battle = A.mobaStep(95);
      if (battle?.phase !== 'playing' || battle.wave < 3) throw new Error('Riftwar battle failed to reach wave 3');
      return { wave: battle.wave, counts: battle.counts };
    })()`,
    godfall: `(() => {
      const A = window.__ashen;
      A.startEclipseGodfall(100, { practice: true });
      const floor = A.eclipseRuntime.godfallFloor;
      if (A.runKind !== 'godfall' || floor !== 100) throw new Error('Godfall floor 100 failed to load');
      return { floor, room: A.game.roomIndex, enemies: A.game.enemies.length };
    })()`,
    horror2d: `(() => {
      const A = window.__ashen;
      const stage = A.startVeilStage('vesper_hollow_1');
      if (!stage.ok) throw new Error('Veil stage failed to load');
      return { room: A.game.roomIndex, enemies: A.game.enemies.length };
    })()`,
    horror3d: `(async () => {
      const A = window.__ashen;
      const stage = await A.start3DHorror('saint_orra');
      if (!stage?.active || stage.siteId !== 'saint_orra') throw new Error('Saint Orra failed to load');
      const terminalStates = ['ready', 'unsupported', 'failed'];
      const deadline = performance.now() + 20000;
      while (!terminalStates.includes(A.gfx3D.state) && performance.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      if (!terminalStates.includes(A.gfx3D.state)) throw new Error('Saint Orra renderer did not finish loading');
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const graphics = A.gfx3D;
      return { site: stage.siteId, phase: stage.phase, rendererState: graphics.state, width: graphics.internalWidth };
    })()`,
    wave: `(async () => {
      const A = window.__ashen;
      A.leavePirates();
      await A.showWaveDefense();
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
    waveEndless: `(async () => {
      const A = window.__ashen;
      if (A.pirates?.active) A.leavePirates();
      A.leaveWaveDefense();
      await A.showWaveDefense();
      A.setWaveDefenseMap('ashen_keep');
      A.setWaveDefenseMode('endless');
      A.startWaveDefenseBattle();
      A.waveDefenseGold(5000);
      for (let slot = 0; slot < 14; slot += 1) A.waveDefenseBuild(slot, slot % 3 === 0 ? 'cannon_tower' : 'sniper_nest');
      A.waveDefenseSetWave(26);
      A.waveDefenseNextWave();
      A.waveDefenseStep(7);
      return A.waveDefense.snapshot.wave;
    })()`,
    infinitower: `(async () => {
      const A = window.__ashen;
      if (A.pirates?.active) A.leavePirates();
      await A.showWaveDefense();
      A.setWaveDefenseMode('infinitower');
      A.startWaveDefenseBattle();
      A.waveDefenseGold(7000);
      for (let slot = 0; slot < 19; slot += 1) {
        A.waveDefenseBuild(slot, slot % 3 === 0 ? 'spiral_anchor' : 'sniper_nest');
      }
      A.waveDefenseSetWave(34);
      A.waveDefenseNextWave();
      A.waveDefenseStep(5);
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
    pirates: `(async () => {
      const A = window.__ashen;
      const canvas = document.getElementById('pirate-canvas');
      const flush = () => canvas.getContext('2d').getImageData(0, 0, 1, 1);
      for (let i = 0; i < 10; i += 1) { A.renderPirateFrame(); flush(); }
      const t0 = performance.now();
      for (let i = 0; i < 50; i += 1) { A.renderPirateFrame(); flush(); }
      return +((performance.now() - t0) / 50).toFixed(2);
    })()`,
    wave: `(async () => {
      const A = window.__ashen;
      const canvas = document.getElementById('wd-canvas');
      const flush = () => canvas.getContext('2d').getImageData(0, 0, 1, 1);
      for (let i = 0; i < 10; i += 1) { A.renderWaveDefenseFrame(); flush(); }
      const t0 = performance.now();
      for (let i = 0; i < 50; i += 1) { A.renderWaveDefenseFrame(); flush(); }
      return +((performance.now() - t0) / 50).toFixed(2);
    })()`,
  };
  for (const name of ['cistern', 'lanternwake', 'godfall', 'horror2d']) directMeasure[name] = directMeasure.campaign;
  directMeasure.pirateEndless = directMeasure.pirates;
  directMeasure.waveEndless = directMeasure.wave;
  directMeasure.infinitower = directMeasure.wave;

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
    assert.ok(Object.hasOwn(setup, name), `Unknown frame profile scenario: ${name}`);
    await evaluate('window.__ashen.showMenu()');
    const detail = await evaluate(setup[name]);
    await sleep(700);
    const result = await sample(2600);
    const cpu = await cpuProfile();
    results.push({ scenario: name, detail, directMs: null, cpu, ...result });
    console.log(`${name.padEnd(13)} ${String(result.fps).padStart(6)} fps · p50 ${result.p50} ms · p95 ${result.p95} ms · worst ${result.worst} ms · long frames ${result.longFrames}`);
    console.log(`               cpu ${cpu.top.slice(0, 4).map((entry) => `${entry.fn} ${entry.pct}%`).join(' | ')}`);
  }

  // Repeated pixel reads can change Chrome's canvas renderer. Complete every
  // cadence and CPU sample before starting any readback on a shared canvas.
  for (const result of results) {
    const measure = directMeasure[result.scenario];
    if (!measure) continue;
    await evaluate('window.__ashen.showMenu()');
    await evaluate(setup[result.scenario]);
    await sleep(700);
    result.directMs = await evaluate(measure);
    console.log(`${result.scenario.padEnd(13)} canvas with readback ${result.directMs} ms`);
  }

  console.log('\n' + JSON.stringify({ support, results }, null, 2));
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
  await sleep(300);
  try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* windows lock */ }
}
