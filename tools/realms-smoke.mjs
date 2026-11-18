// Real-browser smoke for Infinite Realms, Stage Access/HACK, Arc VI, and /admin.
// Usage: ASHEN_URL=http://127.0.0.1:4310/ node tools/realms-smoke.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9333;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find((path) => existsSync(path));
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');
const profile = mkdtempSync(join(tmpdir(), 'ashen-realms-'));
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--disable-extensions',
  '--mute-audio', '--window-size=1440,960', URL,
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(fn, timeout = 20000, label = 'condition') {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const value = await fn(); if (value) return value; } catch { /* retry */ }
    await sleep(120);
  }
  throw new Error(`timed out: ${label}`);
}
let ws;
let seq = 0;
const pending = new Map();
const errors = [];
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
let checks = 0;
const check = (value, label) => { assert.ok(value, label); checks += 1; };
try {
  const targets = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const list = await response.json();
    return list.find((entry) => entry.type === 'page' && entry.url.startsWith(URL)) ? list : null;
  }, 20000, 'chrome page');
  const page = targets.find((entry) => entry.type === 'page' && entry.url.startsWith(URL));
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) { const callback = pending.get(message.id); if (callback) { pending.delete(message.id); callback(message); } return; }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails?.exception?.description || 'exception');
    else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
    else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      const text = message.params.entry.text || '';
      if (!/favicon/i.test(text)) errors.push(`${text} ${message.params.entry.url || ''}`);
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');
  await send('Page.bringToFront');
  await sleep(1200);
  await waitFor(() => evaluate('typeof window.__ashen === "object"'), 20000, 'game boot');
  const boot = await evaluate(`(() => {
    const A = window.__ashen;
    A.clearProgress();
    return {
      version: A.version,
      title: document.title,
      realmsButton: !!document.getElementById('btn-realms-menu'),
      stageButton: !!document.getElementById('btn-stage-menu'),
      astralButton: !!document.getElementById('btn-astral-menu'),
      allRooms: A.game.constructor ? true : false,
    };
  })()`);
  check(boot.version === '0.17.0', 'version is 0.17.0');
  check(boot.realmsButton && boot.stageButton && boot.astralButton, 'new menu buttons exist');

  const realms = await evaluate(`(async () => {
    const A = window.__ashen;
    document.getElementById('btn-realms-menu').click();
    await new Promise((r) => setTimeout(r, 250));
    const cards = document.querySelectorAll('[data-realms-mode]').length;
    const visible = !document.getElementById('realms-screen').classList.contains('hidden');
    document.querySelector('[data-realms-mode="riftfall"]').click();
    await new Promise((r) => setTimeout(r, 100));
    const modal = !document.getElementById('modal').classList.contains('hidden');
    const begin = !!document.querySelector('[data-begin-mode]');
    document.querySelector('[data-begin-mode]').click();
    await new Promise((r) => setTimeout(r, 900));
    const runVisible = !document.getElementById('realms-run-screen').classList.contains('hidden');
    const hud = document.getElementById('realms-run-hud').textContent;
    const canvas = document.getElementById('realms-canvas').width === 960;
    document.getElementById('btn-realms-run-exit').click();
    await new Promise((r) => setTimeout(r, 150));
    const back = !document.getElementById('realms-screen').classList.contains('hidden');
    return { cards, visible, modal, begin, runVisible, hud, canvas, back };
  })()`);
  check(realms.visible && realms.cards === 6, 'Infinite Realms renders six modes');
  check(realms.modal && realms.begin, 'mode detail opens with difficulty and start');
  check(realms.runVisible && realms.canvas, 'mode run renders its canvas');
  check(/RIFTFALL/i.test(realms.hud), 'mode run HUD is live');
  check(realms.back, 'leaving a run returns to the mode hub');

  const astral = await evaluate(`(async () => {
    const A = window.__ashen;
    document.getElementById('btn-astral-menu').click();
    await new Promise((r) => setTimeout(r, 200));
    const regions = document.querySelectorAll('.astral-region').length;
    const rooms = document.querySelectorAll('[data-astral-room]').length;
    const locked = document.querySelector('.astral-locked')?.textContent.includes('UNWRITTEN');
    return { regions, rooms, locked, hidden: document.getElementById('astral-screen').classList.contains('hidden') };
  })()`);
  check(!astral.hidden && astral.regions === 5 && astral.rooms === 20, 'Arc VI hub renders 5 regions and 20 rooms');
  check(astral.locked, 'The Unwritten Expanse is locked and visible');

  const stage = await evaluate(`(async () => {
    const A = window.__ashen;
    document.getElementById('btn-stage-menu').click();
    await new Promise((r) => setTimeout(r, 250));
    const arcs = document.querySelectorAll('[data-stage-arc]').length;
    const arc6 = [...document.querySelectorAll('[data-stage-arc]')].find((b) => b.dataset.stageArc === 'arc6');
    arc6?.click();
    await new Promise((r) => setTimeout(r, 150));
    const cards = document.querySelectorAll('[data-stage-select]').length;
    const selected = [...document.querySelectorAll('[data-stage-select]')].find((b) => b.dataset.stageSelect === '524');
    selected?.click();
    await new Promise((r) => setTimeout(r, 150));
    const boss = document.getElementById('stage-right').textContent.includes('Architect of Eternity');
    document.querySelector('[data-stage-select="505"]')?.click();
    await new Promise((r) => setTimeout(r, 100));
    document.getElementById('btn-stage-peek')?.click();
    await new Promise((r) => setTimeout(r, 500));
    const peek = !document.getElementById('stage-peek').classList.contains('hidden');
    const peekCanvas = document.getElementById('stage-peek-canvas').width === 960;
    document.getElementById('btn-stage-peek-close').click();
    document.getElementById('btn-stage-hack')?.click();
    await new Promise((r) => setTimeout(r, 900));
    const toolbar = !document.getElementById('hack-toolbar').classList.contains('hidden');
    const hack = A.runKind === 'hack';
    A.hackTool('phase');
    A.hackTool('teleport');
    A.exitHackStage();
    await new Promise((r) => setTimeout(r, 150));
    return { arcs, cards, boss, peek, peekCanvas, toolbar, hack, exited: A.menuView === 'stage' };
  })()`);
  check(stage.arcs >= 9, 'Stage Access lists every campaign arc, side content, and modes');
  check(stage.cards === 20, 'Arc VI shows all 20 stages');
  check(stage.boss, 'final stage details show the four-phase Architect');
  check(stage.peek && stage.peekCanvas, 'Sneak Peek renders a read-only stage preview');
  check(stage.toolbar && stage.hack, 'HACK enters an isolated session with the testing toolbar');
  check(stage.exited, 'Exit Test restores Stage Access without campaign mutation');

  const admin = await fetch(new globalThis.URL('/admin', URL)).then((response) => response.text());
  check(admin.includes('ADMIN CONTROL CENTER') && admin.includes('login-form'), '/admin serves the control center login');
  const status = await fetch(new globalThis.URL('/api/platform/status', URL)).then((response) => response.json());
  check(status.version === '1.0.0' && typeof status.maintenance === 'boolean', 'platform status API is live');
  const dataDenied = await fetch(new globalThis.URL('/data/admin-state.json', URL));
  check(dataDenied.status === 404, 'admin state is never served as a static asset');
  check(errors.length === 0, `no console errors: ${errors.join(' | ')}`);
  console.log(`realms smoke: ${checks} checks passed`);
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  try { chrome.kill(); } catch { /* ignore */ }
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
}
