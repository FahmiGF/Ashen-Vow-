// Update X browser smoke: real navigation, boss guards, Scary Mode and the
// developer dashboard, driven through the live game in headless Chrome.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9338;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-updatex-'));
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
  if (ok) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    console.log(`  ✗ ${label}`);
  }
}

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, (message) => (message.error ? reject(new Error(message.error.message)) : resolve(message.result)));
  ws.send(JSON.stringify({ id, method, params }));
});

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  }
  return result.result.value;
}

async function waitFor(fn, timeout = 25000, label = 'condition') {
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
      if (cb) {
        pending.delete(message.id);
        cb(message);
      }
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
    version: window.__ashen.version || document.title,
    scary: window.__ashen.scary,
    menu: window.__ashen.menuView,
  }))()`);
  check(String(boot.version).includes('0.34.0'), `boots v0.34.0 (${String(boot.version).slice(0, 48)})`);
  check(boot.scary && boot.scary.enabled === false, 'Scary Mode is disabled by default');

  // ── AI navigation in the live engine ──
  const ai = await evaluate(`(async () => {
    const a = window.__ashen;
    const g = a.game;
    g.enterRoom(0);
    for (let i = 0; i < 30; i += 1) g.update(1 / 120, {});
    await new Promise((r) => setTimeout(r, 200));
    const dbg = a.aiDebug;
    g.enterRoom(2);
    for (let i = 0; i < 30; i += 1) g.update(1 / 120, {});
    return {
      nav: dbg.nav,
      enemies: dbg.enemies,
      boss: a.aiDebug.boss,
      room: a.snap().room,
    };
  })()`);
  check(ai.nav && ai.nav.nodes > 10, `navigation graph built for the room (${ai.nav?.nodes} nodes, ${ai.nav?.edges} edges)`);
  check(Array.isArray(ai.enemies) && ai.enemies.length > 0, `every enemy has an AI brain (${ai.enemies?.length})`);
  const states = new Set((ai.enemies || []).map((e) => e.state));
  check(states.size > 0 && !states.has(undefined), `enemies report real states (${[...states].join(', ')})`);
  check((ai.enemies || []).every((e) => e.detectionRange > 0 && e.attackRange > 0), 'detection and attack ranges are populated');
  check(Boolean(ai.boss) && ai.boss.phase >= 1 && ai.boss.maxPhases >= 2, `boss exposes phase state (${ai.boss?.kind} ${ai.boss?.phase}/${ai.boss?.maxPhases})`);
  check(ai.boss && typeof ai.boss.grounded === 'boolean' && Array.isArray(ai.boss.hitboxes), 'boss panel reports physics and hitboxes');

  // ── Navigation actually moves an enemy ──
  const chase = await evaluate(`(async () => {
    const a = window.__ashen;
    const g = a.game;
    g.enterRoom(0);
    for (let i = 0; i < 5; i += 1) g.update(1 / 120, {});
    g.player.x = 180;
    g.player.y = 470;
    const enemy = g.enemies.find((e) => !e.dead);
    const startX = enemy.x;
    for (let i = 0; i < 180; i += 1) g.update(1 / 120, {});
    return { startX, endX: enemy.x, state: enemy.aiState, stuck: enemy.aiStuck || 0, transitions: enemy.brain ? enemy.brain.transitions.length : 0 };
  })()`);
  check(chase.transitions > 0, `enemy state machine ran (${chase.transitions} transitions, state ${chase.state})`);
  check(Math.abs(chase.endX - chase.startX) > 6, `enemy navigated toward the player (${Math.round(chase.startX)} → ${Math.round(chase.endX)})`);

  // ── Boss phase guards in the live engine ──
  const bossGuard = await evaluate(`(() => {
    const g = window.__ashen.game;
    g.enterRoom(2);
    for (let i = 0; i < 10; i += 1) g.update(1 / 120, {});
    const b = g.boss;
    const phases = b.maxPhases;
    g.damageBoss(b.maxHp * 10);
    for (let i = 0; i < 360; i += 1) g.update(1 / 120, {});
    return { phase: b.phase, maxPhases: phases, hp: b.hp, dying: b.dying, hitboxes: b.hitboxes ? b.hitboxes.snapshot().length : 0, state: g.state };
  })()`);
  check(bossGuard.hp >= 0, `boss HP never goes negative (${bossGuard.hp})`);
  check(bossGuard.phase <= bossGuard.maxPhases, `boss stays within its phase ceiling (${bossGuard.phase}/${bossGuard.maxPhases})`);
  check(bossGuard.hitboxes === 0, 'no hitbox survives the defeat state');

  // ── Scary Mode ──
  const enabled = await evaluate(`(() => window.__ashen.setScary({ enabled: true, frequency: 'high', cooldown: 30, screenEffects: 'full', suddenAudio: 'off' }))()`);
  check(enabled && enabled.enabled === true, 'Scary Mode enables from settings and persists in the schema');

  const hit = await evaluate(`(async () => {
    const a = window.__ashen;
    a.game.enterRoom(0);
    await new Promise((r) => setTimeout(r, 200));
    const before = a.game.player.hp;
    const result = a.simulateHit('sentinel', true);
    await new Promise((r) => setTimeout(r, 120));
    return { before, after: a.game.player.hp, result, state: a.game.state, snapshot: a.scary };
  })()`);
  check(hit.result.forced === true, 'a confirmed hit triggers a scare presentation');
  check(hit.before - hit.after <= 12 && hit.after < hit.before, `the scare adds no hidden damage (hp ${hit.before} → ${hit.after})`);
  check(hit.state === 'playing', 'gameplay continues during the scare');
  check(hit.snapshot && hit.snapshot.count >= 1 && hit.snapshot.triggerSource === 'sentinel', `scare telemetry names the source (${hit.snapshot?.triggerSource})`);
  check(hit.snapshot && hit.snapshot.cooldown > 0, `cooldown armed (${hit.snapshot?.cooldown}s)`);

  const preview = await evaluate(`(() => {
    const ok = window.__ashen.previewScare();
    const overlay = document.getElementById('scare-preview');
    return { ok, active: overlay ? overlay.className.includes('active') : false, line: overlay?.querySelector('[data-scare-line]')?.textContent || '' };
  })()`);
  check(preview.ok && preview.active, 'the settings preview demonstrates the effect');
  check(preview.line.length > 5, 'the preview shows its enemy-specific line');

  // Disabled again: no more scares.
  const off = await evaluate(`(() => {
    window.__ashen.setScary({ enabled: false });
    const result = window.__ashen.simulateHit('brute', false);
    return { scary: window.__ashen.scary, dealt: result.dealt };
  })()`);
  check(off.scary.enabled === false, 'Scary Mode can be turned off again');

  // ── Developer dashboard gating ──
  const gated = await evaluate(`(() => ({ opened: window.__ashen.openDebug(), active: document.getElementById('debug-screen')?.classList.contains('active') }))()`);
  check(gated.opened === false && gated.active === false, 'debug dashboard is hidden without the developer flag');

  await send('Page.navigate', { url: `${BASE}?dev=1` });
  await sleep(600);
  await attach(`${BASE}?dev=1`);
  const dev = await evaluate(`(async () => {
    const a = window.__ashen;
    a.game.enterRoom(2);
    await new Promise((r) => setTimeout(r, 400));
    const opened = a.openDebug();
    await new Promise((r) => setTimeout(r, 400));
    return {
      opened,
      active: document.getElementById('debug-screen')?.classList.contains('active'),
      ai: document.getElementById('debug-ai')?.textContent.length || 0,
      boss: document.getElementById('debug-boss')?.textContent.length || 0,
      scare: document.getElementById('debug-scare')?.textContent.length || 0,
      overlay: a.toggleAiDebug(),
      frames: await new Promise((resolve) => {
        let n = 0;
        const tick = () => { n += 1; if (n < 12) requestAnimationFrame(tick); else resolve(n); };
        requestAnimationFrame(tick);
      }),
    };
  })()`);
  check(dev.opened === true && dev.active === true, '?dev=1 unlocks the dashboard');
  check(dev.ai > 20 && dev.boss > 20 && dev.scare > 20, `all three panels render data (${dev.ai}/${dev.boss}/${dev.scare} chars)`);
  check(dev.overlay === true, 'the AI overlay toggles on');
  check(dev.frames >= 12, `overlay renders across real frames (${dev.frames})`);

  check(consoleErrors.length === 0, `no console errors${consoleErrors.length ? `: ${consoleErrors[0].slice(0, 160)}` : ''}`);

  console.log(`\nupdate X smoke: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
}
