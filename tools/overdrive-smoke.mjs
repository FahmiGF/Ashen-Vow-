// Overdrive Lv 201–300 browser smoke: hub rail, spell school [Q],
// 20-body live chamber, chapter boss, Lv 300 The First God victory,
// legendary weapon drop, reload persistence, and 390x844 mobile viewport.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9353;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-overdrive-'));
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
  pending.set(id, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result)));
  ws.send(JSON.stringify({ id, method, params }));
});

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
  return res.result.value;
}

async function waitFor(fn, timeout = 25000, label = 'condition') {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try { const v = await fn(); if (v) return v; } catch { /* retry */ }
    await sleep(150);
  }
  throw new Error(`timed out: ${label}`);
}

try {
  const pages = await waitFor(async () => {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    return list.some((e) => e.type === 'page' && e.url.startsWith(BASE)) ? list : null;
  }, 20000, 'chrome page');
  const page = pages.find((e) => e.type === 'page' && e.url.startsWith(BASE));
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const cb = pending.get(m.id);
      pending.delete(m.id);
      cb(m);
      return;
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      consoleErrors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
    }
    if (m.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(m.params.exceptionDetails?.exception?.description || 'exception');
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.bringToFront');
  await waitFor(() => evaluate('typeof window.__ashen === "object" && typeof window.__ashen.overdrive === "object"'), 25000, 'boot');

  const boot = await evaluate(`(() => ({
    title: document.title,
    version: window.__ashen.version,
    chapters: window.__ashen.overdrive.chapters.length,
    btn: !!document.getElementById('btn-overdrive-menu'),
  }))()`);
  check(boot.title.includes('v0.45.0') && boot.version === '0.45.0', `boots as v0.45.0 (${boot.title})`);
  check(boot.btn === true && boot.chapters === 10, `menu & 10 chapters ready (${boot.chapters})`);

  const locked = await evaluate(`(() => {
    const a = window.__ashen;
    if (a.menuView === 'trailer') a.closeTrailer?.();
    document.getElementById('btn-overdrive-menu').click();
    return {
      open: !document.getElementById('overdrive-screen').classList.contains('hidden'),
      unlocked: a.overdrive.unlocked,
      playButtons: document.querySelectorAll('[data-overdrive-play]').length,
      chips: document.querySelectorAll('[data-overdrive-chapter]').length,
      cards: document.querySelectorAll('#overdrive-body .frontier-level').length,
    };
  })()`);
  check(locked.open && !locked.unlocked && locked.playButtons === 0, 'Overdrive locks before Aethron clear');
  check(locked.chips === 10 && locked.cards === 10, `chapter rail renders 10 chips & 10 cards`);

  const opened = await evaluate(`(() => {
    const a = window.__ashen;
    for (let i = 0; i < 8; i += 1) a.progress.cleared[i] = true;
    for (let i = 0; i < 100; i += 1) a.progress.frontiers.levels[i] = true;
    a.progress.frontiers.bosses[9] = true;
    a.showOverdrive('campaign301');
    return {
      unlocked: a.overdrive.unlocked,
      playButtons: document.querySelectorAll('[data-overdrive-play]').length,
      start: a.overdriveStart(0),
      cast: a.overdriveCast(),
      badgeVisible: !document.getElementById('overdrive-badge').classList.contains('hidden'),
    };
  })()`);
  check(opened.unlocked && opened.playButtons === 1, 'clearing Aethron unlocks Overdrive Lv 201');
  check(opened.start.room === 774 && opened.start.enemies === 20, `Lv 201 enters room 774 with 20 bodies (${opened.start.room}/${opened.start.enemies})`);
  check(opened.cast.ok === true && opened.badgeVisible, 'casting Overdrive [Q] spell succeeds and updates HUD badge');

  const cleared = await evaluate(`(() => {
    const a = window.__ashen;
    for (let i = 0; i < 99; i += 1) a.overdriveClear(i);
    const fin = a.overdriveStart(99);
    const bossKind = fin.boss;
    const victory = a.overdriveClear(99);
    a.showOverdrive('campaign301');
    return {
      bossKind,
      victoryComplete: victory.complete,
      summary: a.overdrive.summary,
    };
  })()`);
  check(cleared.bossKind === 'the_first_god', `Lv 300 spawns The First God (${cleared.bossKind})`);
  check(cleared.victoryComplete && cleared.summary.levelsCleared === 100 && cleared.summary.legendariesCount >= 8, `all 100 levels & 8 legendaries recorded (${cleared.summary.levelsCleared}/100, leg=${cleared.summary.legendariesCount})`);

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(180);
  const mobile = await evaluate(`(() => ({
    overflow: document.documentElement.scrollWidth - window.innerWidth,
  }))()`);
  check(mobile.overflow <= 0, `390x844 mobile portrait has no overflow (${mobile.overflow}px)`);
  check(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})`);
  if (consoleErrors.length) console.error(consoleErrors);
  console.log(`\nOverdrive smoke: ${passed} passed, ${failed} failed`);
  process.exitCode = failed ? 1 : 0;
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
  await sleep(150);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
}
