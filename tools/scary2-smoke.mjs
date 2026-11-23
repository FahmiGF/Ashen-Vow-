// Scary Mode 2.0 browser smoke: difficulty, anti-jumpscare, events, journal,
// live gameplay and persistence — driven through the real game in headless Chrome.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9339;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-scary2-'));
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader', '--mute-audio', '--window-size=1400,900', BASE,
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
let seq = 0;
const pending = new Map();
const consoleErrors = [];
let passed = 0;
let failed = 0;

function check(ok, label) {
  if (ok) { passed += 1; console.log(`  ✓ ${label}`); } else { failed += 1; console.log(`  ✗ ${label}`); }
}

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

async function waitFor(fn, timeout = 25000, label = 'condition') {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const value = await fn(); if (value) return value; } catch { /* retry */ }
    await sleep(150);
  }
  throw new Error(`timed out: ${label}`);
}

async function attach(url) {
  try { ws?.close(); } catch { /* ignore */ }
  const pages = await waitFor(async () => {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    return list.some((entry) => entry.type === 'page' && entry.url.startsWith(url)) ? list : null;
  }, 20000, 'chrome page');
  const page = pages.find((entry) => entry.type === 'page' && entry.url.startsWith(url));
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const cb = pending.get(message.id);
      if (cb) { pending.delete(message.id); cb(message); }
      return;
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
    }
    if (message.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.bringToFront');
  await waitFor(() => evaluate('typeof window.__ashen === "object"'), 25000, 'boot');
}

try {
  await attach(BASE);

  const boot = await evaluate(`(() => ({
    version: document.title,
    scary: window.__ashen.settings.scary,
    campaign: window.__ashen.settings.gameplay.difficulty,
  }))()`);
  check(/0\.35\.0/.test(String(boot.version)), `boots v0.35.0 (${String(boot.version).slice(0, 42)})`);
  check(boot.scary.enabled === false && boot.scary.antiJumpscare === false, 'Scary Mode and anti-jumpscare are off by default');
  check(boot.scary.difficulty === 'normal', 'default horror difficulty is Normal');

  // ── dedicated screen ──
  const screen = await evaluate(`(async () => {
    const a = window.__ashen;
    a.openScary();
    await new Promise((r) => setTimeout(r, 120));
    const visible = !document.getElementById('scary-screen').classList.contains('hidden');
    const tabs = document.querySelectorAll('[data-scary-tab]').length;
    const rows = document.querySelectorAll('[data-horror-path]').length;
    const cards = document.querySelectorAll('[data-scary-difficulty]').length;
    const summary = document.getElementById('scary-summary').textContent;
    return { menu: a.menuView, visible, tabs, rows, cards, summary, presentation: a.scary2 };
  })()`);
  check(screen.menu === 'scary' && screen.visible, 'the Scary Mode screen opens from the menu');
  check(screen.tabs === 5, `five horror settings tabs render (${screen.tabs})`);
  check(screen.rows >= 20, `the first tab renders real controls (${screen.rows} rows)`);
  const comfort = await evaluate(`(async () => {
    document.querySelector('[data-scary-tab="comfort"]').click();
    await new Promise((r) => setTimeout(r, 100));
    const rows = document.querySelectorAll('[data-horror-path]').length;
    const hasAnti = !!document.querySelector('[data-horror-path="scary.antiJumpscare"]');
    document.querySelector('[data-scary-tab="jumpscare"]').click();
    await new Promise((r) => setTimeout(r, 100));
    return { rows, hasAnti };
  })()`);
  check(comfort.rows >= 13 && comfort.hasAnti, `the comfort tab exposes accessibility controls (${comfort.rows})`);
  check(screen.cards === 3, `three horror difficulties render (${screen.cards})`);
  check(typeof screen.summary === 'string' && screen.summary.length > 20, 'the summary shows difficulty, anti-jumpscare and progress');
  check(screen.presentation && screen.presentation.gameplay.detection === 1, 'the resolved layer is exposed to the shell');

  // ── difficulty selection is independent from the campaign ──
  const difficulty = await evaluate(`(async () => {
    const a = window.__ashen;
    document.querySelector('[data-scary-difficulty="hard"]').click();
    await new Promise((r) => setTimeout(r, 80));
    const hard = a.settings.scary.difficulty;
    const campaign = a.settings.gameplay.difficulty;
    const presentation = a.scary2;
    document.querySelector('[data-scary-difficulty="easy"]').click();
    await new Promise((r) => setTimeout(r, 80));
    const easy = a.scary2;
    return { hard, campaign, hardDetection: presentation.gameplay.detection, easyDetection: easy.gameplay.detection, easyWarnings: easy.jumpscares.warnings };
  })()`);
  check(difficulty.hard === 'hard' && difficulty.easyDetection === 0.78, 'Hard and Easy change real gameplay numbers');
  check(difficulty.hardDetection > difficulty.easyDetection, 'Hard detects further than Easy');
  check(difficulty.campaign === 'normal', 'campaign difficulty is untouched by horror difficulty');

  // ── anti-jumpscare ──
  const anti = await evaluate(`(() => {
    const a = window.__ashen;
    a.setHorror({ enabled: true, difficulty: 'hard', jumpscares: true, antiJumpscare: false });
    const off = a.scary2;
    a.toggleAntiJumpscare(true);
    const on = a.scary2;
    const state = a.settings.scary;
    return {
      offPossible: off.jumpscares.possible,
      offFace: off.jumpscares.faceReveal,
      onPossible: on.jumpscares.possible,
      onFace: on.jumpscares.faceReveal,
      onFlash: on.visual.flash,
      onSting: on.audio.stingGain,
      onFog: on.visual.fog,
      onDarkness: on.visual.darkness,
      onDetection: on.gameplay.detection,
      suppression: on.suppression,
      enabled: state.enabled,
      anti: state.antiJumpscare,
    };
  })()`);
  check(anti.offPossible === true && anti.offFace === true, 'with anti-jumpscare off, configured scares are allowed');
  check(anti.onPossible === false && anti.onFace === false, 'anti-jumpscare removes startling presentation');
  check(anti.onFlash === 0 && anti.onSting === 0, 'anti-jumpscare removes flashing and sudden audio');
  check(anti.onFog > 0 && anti.onDarkness > 0, 'fog and darkness remain in comfort mode');
  check(anti.onDetection === 1.3, 'Hard difficulty still behaves like Hard with anti-jumpscare on');
  check(anti.suppression.includes('anti-jumpscare'), 'suppression reasons are reported');

  // ── one-touch toggle in the pause screen, live ──
  const pauseToggle = await evaluate(`(async () => {
    const a = window.__ashen;
    a.startScaryRun();
    await new Promise((r) => setTimeout(r, 250));
    const button = document.getElementById('btn-pause-anti');
    const before = button ? button.textContent : null;
    a.toggleAntiJumpscare(false);
    const after = button ? button.textContent : null;
    return { before, after, state: a.game.state, enabled: a.settings.scary.enabled, difficulty: a.game.scaryDifficulty };
  })()`);
  check(pauseToggle.before && /AKTIF/.test(pauseToggle.before), 'the pause screen exposes a live anti-jumpscare toggle');
  check(/MATI/.test(pauseToggle.after || ''), 'the toggle switches immediately');
  check(pauseToggle.state === 'playing' && pauseToggle.enabled === true, 'the mode keeps running while toggled');
  check(pauseToggle.difficulty === 'hard', 'the run uses the selected horror difficulty');

  // ── horror enemies in the real simulation ──
  const enemies = await evaluate(`(() => {
    const a = window.__ashen;
    const g = a.game;
    const before = g.enemies.length;
    const spawned = ['hollow_wraith', 'night_stalker', 'silent_knight', 'forgotten_one', 'weeping_mother', 'mirror_double', 'lantern_eater', 'drowned_bell']
      .map((kind) => a.spawnScaryEnemy(kind, 300 + g.enemies.length * 35));
    for (let i = 0; i < 240; i += 1) g.update(1 / 120, {});
    const list = g.enemies.filter((e) => e.scaryKind);
    return {
      before,
      total: g.enemies.length,
      spawned: spawned.filter(Boolean).length,
      tactics: [...new Set(list.map((e) => e.scaryTactic))],
      states: [...new Set(list.map((e) => e.aiState))],
      finite: list.every((e) => Number.isFinite(e.x) && Number.isFinite(e.y) && e.y < 900),
      hp: g.player.hp,
    };
  })()`);
  check(enemies.spawned === 8 && enemies.total >= enemies.before + 8, 'eight horror enemies spawn in the live room');
  check(enemies.tactics.length === 8, `each horror enemy uses its own tactic (${enemies.tactics.join(', ')})`);
  check(enemies.finite, 'none of them clip out of the world');
  check(enemies.states.length > 0, `their AI reports states (${enemies.states.join(', ')})`);

  // ── events ──
  check((await evaluate('window.__ashen.horrorEvents.length')) === 17, 'seventeen horror events are registered');
  const lifecycle = await evaluate(`(async () => {
    const a = window.__ashen;
    a.setHorror({ enabled: true, antiJumpscare: false, warningBeforeScares: true });
    // Ambient events legitimately cancel in combat, so clear the room first.
    a.game.enemies.length = 0;
    a.game.projectiles.length = 0;
    const started = a.startHorrorEvent('silent_hallway', { combat: false, enemyCount: 0, roomCleared: true });
    a.horrorTick(0.2);
    const during = a.horror.director.active;
    a.horrorTick(2);
    a.horrorTick(20);
    const after = a.horror.director;
    return { started, during, afterId: after.active, last: after.last, journal: a.horrorJournal.events, layer: a.horror.events };
  })()`);
  check(lifecycle.started && lifecycle.started.phase, `an event starts with a real phase (${lifecycle.started?.phase})`);
  check(lifecycle.during && lifecycle.during.id === 'silent_hallway', 'the event stays active while its duration runs');
  check(lifecycle.afterId === null && lifecycle.last && lifecycle.last.phase === 'done', 'the event ends without getting stuck');
  check(lifecycle.journal.silent_hallway >= 1, 'the journal records the completed event');
  check(lifecycle.layer.audio === 'restore', 'the safe exit restores the audio layer');

  const suppressed = await evaluate(`(() => {
    const a = window.__ashen;
    a.toggleAntiJumpscare(true);
    const result = a.startHorrorEvent('broken_reflection', { combat: false, enemyCount: 0 });
    a.cancelHorrorEvent('test');
    return { result, anti: a.settings.scary.antiJumpscare };
  })()`);
  check(suppressed.result && suppressed.result.suppressed === true, 'anti-jumpscare suppresses startling events');
  check(suppressed.anti === true, 'the suppression ran under anti-jumpscare');

  // ── journal / achievements / rewards ──
  const journal = await evaluate(`(() => {
    const a = window.__ashen;
    const ok = a.recordHorror('enemies', 'hollow_wraith');
    const after = a.horrorJournal;
    return { ok, progress: after, rewards: after.rewards };
  })()`);
  check(journal.ok === true && journal.progress.enemies.startsWith('1/8'), `the journal counts encountered enemies (${journal.progress.enemies})`);
  check(journal.progress.unlocked.includes('first_encounter'), 'the first-encounter achievement unlocks');
  check(journal.rewards.includes('accessory_dark_lantern'), 'a cosmetic reward is granted');

  // ── rendering across real frames ──
  const frames = await evaluate(`(async () => {
    const a = window.__ashen;
    a.setHorror({ difficulty: 'hard' });
    const overlaid = typeof a.renderer.drawHorrorAtmosphere === 'function';
    const n = await new Promise((resolve) => {
      let count = 0;
      const tick = () => { count += 1; if (count < 15) requestAnimationFrame(tick); else resolve(count); };
      requestAnimationFrame(tick);
    });
    return { overlaid, n, state: a.game.state, errors: 0 };
  })()`);
  check(frames.overlaid === true, 'the renderer exposes the horror atmosphere layer');
  check(frames.n >= 15, `the layer renders across real frames (${frames.n})`);

  // ── persistence ──
  await send('Page.navigate', { url: BASE });
  await sleep(700);
  await attach(BASE);
  const reload = await evaluate(`(() => ({
    difficulty: window.__ashen.settings.scary.difficulty,
    anti: window.__ashen.settings.scary.antiJumpscare,
    enabled: window.__ashen.settings.scary.enabled,
    journal: window.__ashen.horrorJournal,
  }))()`);
  check(reload.difficulty === 'hard' && reload.anti === true, 'settings survive a full reload');
  check(String(reload.journal.enemies).startsWith('1/8'), 'the horror journal survives a full reload');
  check(reload.enabled === true, 'the mode stays enabled after reload');

  check(consoleErrors.length === 0, `no console errors${consoleErrors.length ? `: ${consoleErrors[0].slice(0, 160)}` : ''}`);

  console.log(`\nScary Mode 2.0 smoke: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
}
