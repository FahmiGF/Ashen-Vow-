// Update XVII browser smoke: 3D Scary Mode in real Chrome, including the live
// WebGL/GLB canvas, first-person runtime, three-phase clear, anti-jumpscare and
// save persistence across a reload.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9350;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-horror3d-'));
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
      if (!/favicon/i.test(text) && !(url.includes('fonts.googleapis.com') || /Failed to load resource.*429/.test(text))) errors.push(text);
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
  await waitFor(() => evaluate('typeof window.__ashen === "object" && typeof window.__ashen.horror3D === "object"'), 20000, 'game boot');

  const boot = await evaluate(`({
    version: window.__ashen.version,
    opened: !document.getElementById('mode3d-screen').classList.contains('hidden'),
    cards: document.querySelectorAll('.horror3d-card').length,
    choices: document.querySelectorAll('#horror3d-select option').length,
    gl: window.__ashen.gfx3D,
  })`);
  check(boot.version && /^0\./.test(boot.version), `game boots (${boot.version})`);
  check(boot.choices === 5, `site selector lists five buildings (got ${boot.choices})`);

  await evaluate(`document.getElementById('btn-horror3d-menu').click()`);
  await sleep(500);
  const opened = await evaluate(`(() => {
    const g = window.__ashen.game3D;
    const s = window.__ashen.horror3D;
    return {
      screen: !document.getElementById('mode3d-screen').classList.contains('hidden'),
      view: window.__ashen.menuView,
      active: s.snapshot && s.snapshot.active,
      site: s.snapshot && s.snapshot.siteId,
      firstPerson: s.snapshot && s.snapshot.firstPerson,
      entity: s.snapshot && s.snapshot.entityName,
      phase: s.snapshot && s.snapshot.phase,
      area: g && g.areaId,
      enemies: g && g.enemies.length,
      scenery: g && g.scenery[0].type,
      building: g && g.scenery[0].horrorSite,
      cards: document.querySelectorAll('.horror3d-card').length,
    };
  })()`);
  check(opened.screen && opened.view === 'mode3d', '3D screen opens from the new menu entry');
  check(opened.active === true && opened.site === 'blackveil_manor', 'Blackveil Manor starts immediately');
  check(opened.firstPerson === true && opened.phase === 0, 'camera is first-person and the stage starts at phase 1');
  check(opened.enemies === 1 && opened.entity === 'The Governess', 'The Governess is the live hunting entity');
  check(opened.area === 'horror_blackveil_manor' && opened.scenery === 'manor', 'the real manor 3D area and building are loaded');
  check(opened.cards === 5, 'the horror site rail is populated');

  await sleep(1800);
  const gfx = await evaluate(`(() => {
    const status = window.__ashen.render3DFrame();
    const c = document.getElementById('canvas-3d');
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let lit = 0;
    let total = 0;
    for (let i = 0; i < data.length; i += 400) {
      total += 1;
      if (data[i] + data[i + 1] + data[i + 2] > 45) lit += 1;
    }
    return { gfx: status, lit, total, snapshot: window.__ashen.horror3DSnapshot };
  })()`);
  check(gfx.gfx.available === true && gfx.gfx.stats && gfx.gfx.stats.drawCalls > 0, `WebGL2 + GLB renderer is drawing (${gfx.gfx.stats?.drawCalls || 0} calls, available=${gfx.gfx.available}, state=${gfx.gfx.state}, reason=${gfx.gfx.reason || 'none'})`);
  check(gfx.lit > gfx.total * 0.02, `3D canvas contains lit geometry (${gfx.lit}/${gfx.total} samples)`);
  check(gfx.snapshot.firstPerson === true && gfx.snapshot.scare, 'first-person view and a live jumpscare layer are rendered');

  const firstEcho = await evaluate(`window.__ashen.horror3DCollect(0)`);
  check(firstEcho.collected === 1 && firstEcho.phase === 1, 'first echo advances to phase 2 and wakes the hunt');
  const secondEcho = await evaluate(`window.__ashen.horror3DCollect(1)`);
  check(secondEcho.collected === 2 && secondEcho.scares >= 3, 'second echo raises fear and triggers another scare');
  const thirdEcho = await evaluate(`window.__ashen.horror3DCollect(2)`);
  check(thirdEcho.collected === 3 && thirdEcho.phase === 2, 'third echo opens the escape phase');

  const exit = await evaluate(`window.__ashen.horror3DExit()`);
  check(exit.active === false && exit.result === 'cleared', 'reaching the exit clears the 3D site');
  await sleep(500);
  const saved = await evaluate(`JSON.parse(localStorage.getItem('ashen-vow-3dhorror-v1'))`);
  check(saved && saved.clears >= 1 && saved.sites.blackveil_manor.clears === 1, 'clear is written to the dedicated 3D horror save');

  const anti = await evaluate(`(async () => {
    const box = document.getElementById('horror3d-anti');
    box.checked = true;
    box.dispatchEvent(new Event('change', { bubbles: true }));
    const snap = window.__ashen.start3DHorror('saint_orra');
    await new Promise((r) => setTimeout(r, 250));
    return snap;
  })()`);
  check(anti.active === true && anti.siteId === 'saint_orra', 'anti-jumpscare starts a second site');
  check(anti.scare && anti.scare.shape === 'atmospheric' && anti.scare.flash === 0, 'anti-jumpscare downgrades every scare and removes flashes');

  await evaluate(`document.getElementById('btn-mode3d-back').click()`);
  await sleep(250);
  await send('Page.reload', { ignoreCache: true });
  await sleep(1000);
  await waitFor(() => evaluate('typeof window.__ashen === "object" && typeof window.__ashen.horror3D === "object"'), 20000, 'reload boot');
  const persisted = await evaluate(`({
    clears: window.__ashen.horror3D.summary.clears,
    clearedSites: window.__ashen.horror3D.summary.clearedSites,
    anti: window.__ashen.horror3D.save.settings.antiJumpscare,
    cards: document.querySelectorAll('.horror3d-card').length,
    version: window.__ashen.version,
  })`);
  check(persisted.clears >= 1 && persisted.clearedSites >= 1, '3D horror clear survives a full page reload');
  check(persisted.anti === true, 'anti-jumpscare preference survives reload');
  check(persisted.cards === 5, 'the horror site rail rebuilds after reload');

  check(errors.length === 0, `no runtime or console errors${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
  console.log(`\n3D Scary Mode smoke: ${checks}/${checks} checks passed`);
} finally {
  try { chrome.kill(); } catch { /* ignore */ }
}
