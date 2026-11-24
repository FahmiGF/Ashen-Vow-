// BAB X — The Lanternwake browser smoke. Drives the real level select, a live
// hall with its twenty bodies, and the four-phase Wickbearer through Chrome.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9346;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-lantern-'));
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

const check = (ok, label) => {
  if (ok) { passed += 1; console.log(`  ✓ ${label}`); } else { failed += 1; console.log(`  ✗ ${label}`); }
};

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

try {
  const pages = await waitFor(async () => {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    return list.some((entry) => entry.type === 'page' && entry.url.startsWith(BASE)) ? list : null;
  }, 20000, 'chrome page');
  const page = pages.find((entry) => entry.type === 'page' && entry.url.startsWith(BASE));
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

  const locked = await evaluate(`(() => {
    const a = window.__ashen;
    a.showLevels();
    const cards = document.querySelectorAll('#lanternwake-cards .level-card').length;
    const label = document.getElementById('lanternwake-progress').textContent;
    const lockedCount = document.querySelectorAll('#lanternwake-cards .level-card.locked').length;
    const room = a.lanternwake.rooms[0];
    return { cards, label, lockedCount, room, stageCount: a.lanternwake.stageCount, unlocked: a.lanternwake.unlocked };
  })()`);
  check(locked.cards === 5, `five Lanternwake cards render (${locked.cards})`);
  check(locked.stageCount === 5 && locked.room.id === 669, 'the hub reports five stages starting at room 669');
  check(locked.label === 'TERKUNCI' && locked.lockedCount === 5, 'the chapter stays locked before Vasska falls');

  const unlocked = await evaluate(`(async () => {
    const a = window.__ashen;
    a.progress.cleared[7] = true;
    for (let i = 0; i < 4; i += 1) a.cisternClear(i);
    a.cisternBossDown();
    a.showLevels();
    await new Promise((r) => setTimeout(r, 120));
    const label = document.getElementById('lanternwake-progress').textContent;
    const cards = [...document.querySelectorAll('#lanternwake-cards .level-card')];
    return { label, unlocked: a.lanternwake.unlocked, playable: cards.filter((card) => !card.classList.contains('locked')).length };
  })()`);
  check(unlocked.unlocked === true && unlocked.label.includes('0/5'), `the chapter opens after the cistern (${unlocked.label})`);
  check(unlocked.playable === 1, `only the first hall is playable at first (${unlocked.playable})`);

  const run = await evaluate(`(async () => {
    const a = window.__ashen;
    document.querySelector('#lanternwake-cards .play-btn').click();
    await new Promise((r) => setTimeout(r, 500));
    return {
      room: a.game.roomIndex,
      enemies: a.game.enemies.length,
      kind: a.game.room ? a.game.room.name : null,
      started: a.started,
    };
  })()`);
  check(run.room === 669 && run.started === true, `MAINKAN starts the first hall (${run.kind})`);
  check(run.enemies === 20, `the live hall spawns twenty bodies (${run.enemies})`);

  const boss = await evaluate(`(async () => {
    const a = window.__ashen;
    for (let i = 0; i < 4; i += 1) a.lanternwakeClear(i);
    a.lanternwakeStart(4);
    await new Promise((r) => setTimeout(r, 300));
    const spawned = a.game.boss ? { kind: a.game.boss.kind, phases: a.game.boss.maxPhases, hp: a.game.boss.maxHp } : null;
    // Boss intro and every phase open a dialogue overlay, and dialogue pauses
    // the fixed step. Advance it the way a player does, then keep fighting.
    for (let i = 0; i < 120 && a.game.state !== 'victory'; i += 1) {
      for (let line = 0; line < 4; line += 1) a.advanceDialogue();
      if (a.game.boss && !a.game.boss.dying) a.game.hurtBoss(220, 90, 1, false);
      await new Promise((r) => setTimeout(r, 120));
    }
    await new Promise((r) => setTimeout(r, 400));
    return {
      spawned,
      state: a.game.state,
      debug: a.game.boss ? {
        hp: Math.round(a.game.boss.hp),
        phase: a.game.boss.phase,
        dying: a.game.boss.dying,
        intro: Math.round(a.game.boss.intro * 100) / 100,
        invuln: Math.round(a.game.boss.invuln * 100) / 100,
        paused: a.paused,
        started: a.started,
        menu: a.menuView,
      } : null,
      summary: a.lanternwake.summary,
      saved: JSON.parse(localStorage.getItem('ashen-vow-progress-v1') || '{}').lanternwake?.boss === true,
    };
  })()`);
  check(boss.spawned?.kind === 'wickbearer' && boss.spawned.phases === 4, 'Orsella spawns with four phases');
  check(boss.state === 'victory', `the four-phase boss ends in victory (${boss.state} ${JSON.stringify(boss.debug)})`);
  check(boss.summary.bossCleared === true && boss.saved === true, 'the boss clear is recorded and persisted');

  await evaluate('window.__ashen.showLevels()');
  const reload = await evaluate(`(async () => {
    location.reload();
    return true;
  })()`).catch(() => true);
  check(reload === true, 'reload requested');
  await sleep(2500);
  const after = await waitFor(() => evaluate(`(() => {
    const a = window.__ashen;
    if (!a) return null;
    a.showLevels();
    return {
      cards: document.querySelectorAll('#lanternwake-cards .level-card').length,
      label: document.getElementById('lanternwake-progress').textContent,
      cleared: document.querySelectorAll('#lanternwake-cards .level-card.cleared').length,
    };
  })()`), 25000, 'reload boot');
  check(after.cards === 5 && after.label.includes('5/5'), `progress survives reload (${after.label})`);
  check(after.cleared === 5, `every cleared card survives reload (${after.cleared})`);
  check(consoleErrors.length === 0, `no console errors (${consoleErrors.length})`);

  console.log(`\nLanternwake smoke: ${passed} passed, ${failed} failed`);
  if (consoleErrors.length) console.log(consoleErrors.join('\n'));
  process.exitCode = failed ? 1 : 0;
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
}
