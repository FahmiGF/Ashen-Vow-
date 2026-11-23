// Update XVIII browser smoke: arc credit scenes + hidden secrets in real Chrome.
// It uses the live campaign run for a real rune pickup, the real keydown
// sequence for a mode mark, and the real Oathbreaker death for a credit scene.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9352;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-credits-'));
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader', '--mute-audio', '--window-size=1440,1000', BASE,
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let ws;
let seq = 0;
const pending = new Map();
const errors = [];
let checks = 0;

function check(ok, label) {
  if (!ok) throw new Error(`CHECK FAILED: ${label}`);
  checks += 1;
  console.log(`  ✓ ${label}`);
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
    await sleep(140);
  }
  throw new Error(`timed out: ${label}`);
}

async function attach() {
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
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails?.exception?.description || 'exception');
    else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      errors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
    } else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      const text = message.params.entry.text || '';
      const url = message.params.entry.url || '';
      if (!/favicon|429|Too Many Requests/i.test(text) && !(url.includes('fonts.googleapis.com') || /Failed to load resource.*429/.test(text))) errors.push(text);
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');
  await send('Page.bringToFront');
}

try {
  await attach();
  await sleep(1200);
  await waitFor(() => evaluate('typeof window.__ashen === "object" && Array.isArray(window.__ashen.creditArcs)'), 20000, 'game boot');

  const boot = await evaluate(`({
    version: window.__ashen.version,
    arcs: window.__ashen.creditArcs,
    spots: window.__ashen.secretSpots,
    sequence: window.__ashen.secretSequence,
    summary: window.__ashen.secrets.summary,
  })`);
  check(/^0\.34\./.test(boot.version), `boots v0.34.0 (${boot.version})`);
  check(boot.arcs.length === 11, `eleven arc credit scenes are registered (${boot.arcs.length})`);
  check(boot.arcs.some((arc) => arc.id === 'arc1' && arc.bosses.legacy.includes('oathbreaker')), 'Arc I maps the real Oathbreaker final boss');
  check(boot.arcs.some((arc) => arc.id === 'eternal' && arc.bosses.eternal.includes('first_forgotten')), 'Arc X maps The First Forgotten');
  check(boot.spots.length === 5 && boot.sequence.length === 10, 'five hidden runes and one ten-key sequence are loaded');

  const overlay = await evaluate(`(() => {
    window.__ashen.openCreditScene('arc1');
    const screen = document.getElementById('credit-scene-screen');
    const roles = [...document.querySelectorAll('.credit-scene-role')].map((row) => ({
      role: row.querySelector('span')?.textContent,
      name: row.querySelector('strong')?.textContent,
    }));
    return {
      visible: !screen.classList.contains('hidden'),
      open: window.__ashen.creditScene.open,
      title: document.getElementById('credit-scene-title').textContent,
      roles,
      footer: document.querySelector('.credit-scene-footer strong')?.textContent,
      text: screen.textContent,
    };
  })()`);
  check(overlay.visible && overlay.open, 'credit scene opens over the game');
  check(overlay.title === 'THE ASHEN VOW', `Arc I credit title is correct (${overlay.title})`);
  check(overlay.roles.length === 8 && overlay.roles.every((row) => row.name === 'Sealius'), 'Sealius is credited in all eight roles');
  check(overlay.roles.some((row) => row.role === 'Technical Lead') && overlay.roles.some((row) => row.role === 'Artist & Designer'), 'Technical Lead and Artist & Designer are present');
  check(overlay.footer === 'Made by SealiusHQ with a lot of support from Contributors', 'canonical SealiusHQ footer is exact');
  const skipped = await evaluate(`(() => { window.__ashen.closeCreditScene(); return document.getElementById('credit-scene-screen').classList.contains('hidden'); })()`);
  check(skipped === true, 'credit scene closes cleanly');

  await evaluate('window.__ashen.start(0)');
  await sleep(450);
  const rune = await evaluate(`(() => {
    const spot = window.__ashen.secretSpots.find((entry) => entry.room === 0);
    const game = window.__ashen.game;
    game.player.x = spot.x - 15;
    game.player.y = spot.y - 23;
    return { spot, rune: window.__ashen.secrets.rune, binding: window.__ashen.settings.bindings.interact[0], state: game.state };
  })()`);
  check(rune.rune && rune.rune.id === rune.spot.id, 'the room 0 hidden rune is attached to the live run');
  const picked = await evaluate(`(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: '${rune.binding}', key: 'f', bubbles: true }));
    return { summary: window.__ashen.secrets.summary, rune: window.__ashen.secrets.rune };
  })()`);
  check(picked.summary.levels === 1 && picked.rune === null, 'standing on the rune and using interact collects it once');
  check(picked.summary.found >= 1 && picked.summary.modeTotal >= 30, 'the secret summary counts the find across the full mode set');

  const beforeModes = await evaluate('window.__ashen.secrets.summary.modes');
  const sequence = await evaluate(`(() => {
    for (const code of window.__ashen.secretSequence) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code, key: 'x', bubbles: true }));
    }
    return window.__ashen.secrets.summary;
  })()`);
  check(sequence.modes === beforeModes + 1, 'the hidden sequence records exactly one mode mark');
  const saved = await evaluate(`JSON.parse(localStorage.getItem('ashen-vow-secrets-v1'))`);
  check(saved && saved.found.length >= 2 && saved.levelFinds >= 1 && saved.modeFinds >= 1, 'the separate secret save stores only found ids and counts');

  await evaluate('window.__ashen.start(7)');
  await sleep(700);
  const boss = await evaluate(`window.__ashen.snap()`);
  check(boss.room === 7 && boss.boss && boss.boss.kind === 'oathbreaker', 'the real Arc I final boss is live in room 7');
  await evaluate(`(() => {
    window.__ashen.damageBoss(99999);
    // Headless Chrome throttles rAF; advance the same fixed simulation the
    // real page uses, then drain the real bossDown event.
    window.__ashen.step(3);
    window.__ashen.drainEvents();
  })()`);
  const victory = await evaluate(`window.__ashen.snap()`);
  check(victory.state === 'victory', 'the final boss dies from real damage');
  const creditDiag = await evaluate(`window.__ashen.creditDebug`);
  check(creditDiag.lastEvent && creditDiag.lastEvent.arc === 'arc1', 'bossDown is classified as the Arc I finale');
  const triggered = await waitFor(() => evaluate('window.__ashen.creditScene.open && window.__ashen.creditScene.arc === "arc1"'), 7000, 'arc1 credit trigger');
  check(triggered === true, 'the shared bossDown event opens the Arc I credit scene');
  const triggerTitle = await evaluate(`document.getElementById('credit-scene-title').textContent`);
  check(triggerTitle === 'THE ASHEN VOW', 'the triggered scene shows the correct arc');
  await evaluate('window.__ashen.closeCreditScene()');

  await send('Page.reload', { ignoreCache: true });
  await sleep(1000);
  await waitFor(() => evaluate('typeof window.__ashen === "object" && typeof window.__ashen.secrets === "object"'), 20000, 'reload boot');
  const persisted = await evaluate(`({
    summary: window.__ashen.secrets.summary,
    version: window.__ashen.version,
    title: document.title,
  })`);
  check(persisted.summary.levels >= 1 && persisted.summary.modes >= 1, 'rune and mode secrets survive a full page reload');
  check(/^0\.34\./.test(persisted.version) && /0\.34\.0/.test(persisted.title), 'reload keeps the v0.34.0 build');

  check(errors.length === 0, `no runtime or console errors${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
  console.log(`\nCredit scene + secret smoke: ${checks}/${checks} checks passed`);
} finally {
  try { chrome.kill(); } catch { /* ignore */ }
}
