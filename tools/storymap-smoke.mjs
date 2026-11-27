// Real-browser smoke for PETA KISAH — the main-menu storyline map.
// Opens the screen through the real menu button, walks the arc rail, checks
// the locked Rift, verifies Escape/keyboard and phone layout, and proves the
// screen never writes to the save.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9361;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-storymap-'));
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

  const boot = await evaluate(`(() => {
    const a = window.__ashen;
    // A fresh profile auto-opens the first-visit trailer; close it so the
    // assertions start from the normal main menu.
    if (a.menuView === 'trailer') a.closeTrailer?.();
    const button = document.getElementById('btn-storymap-menu');
    return {
      view: a.menuView,
      onTitle: a.menuView === 'title',
      hasButton: !!button,
      label: button ? button.querySelector('span')?.textContent : '',
      api: typeof a.showStoryMap === 'function',
      saveBefore: localStorage.getItem('ashen-vow-progress-v1'),
    };
  })()`);
  console.log(`  · boot view: ${boot.view}`);
  check(boot.onTitle, 'the game still boots into the main menu');
  check(boot.hasButton && /PETA KISAH/.test(boot.label), 'the main menu ships a PETA KISAH entry');

  await evaluate(`document.getElementById('btn-storymap-menu').click()`);
  await sleep(250);
  const opened = await evaluate(`(() => {
    const a = window.__ashen;
    const screen = document.getElementById('storymap-screen');
    const summary = document.getElementById('storymap-summary');
    return {
      view: a.menuView,
      visible: !!screen && !screen.classList.contains('hidden'),
      title: screen ? screen.querySelector('.screen-title')?.textContent : '',
      chips: document.querySelectorAll('#storymap-rail [data-story-arc]').length,
      stats: summary ? summary.querySelectorAll('.storymap-meta-cell').length : 0,
      statText: summary ? summary.textContent : '',
      selected: a.storyMap.selected,
    };
  })()`);
  check(opened.view === 'storymap', 'the button switches the shell to the story map view');
  check(opened.visible, 'the story map screen is actually visible');
  check(opened.title.trim() === 'PETA KISAH', 'the screen is titled PETA KISAH');
  check(opened.chips === 14, `the rail lists every saga (${opened.chips})`);
  check(opened.stats === 5, 'the summary strip renders five counters');
  check(/SAGA/.test(opened.statText) && /BOSS/.test(opened.statText), 'the summary names the saga and boss totals');
  check(opened.selected === 'arc11', 'the newest arc is selected by default');

  const current = await evaluate(`(() => {
    const a = window.__ashen;
    const detail = document.getElementById('storymap-detail');
    const active = document.querySelector('#storymap-rail .storymap-chip.active');
    return {
      title: detail.querySelector('h3')?.textContent || '',
      badge: detail.querySelector('.storymap-badge')?.textContent || '',
      beats: detail.querySelectorAll('.storymap-beats li').length,
      cast: detail.querySelectorAll('.storymap-cast span').length,
      activeLocked: active ? active.classList.contains('locked') : null,
      note: detail.querySelector('.storymap-note')?.textContent || '',
      summary: a.storyMap.summary,
    };
  })()`);
  check(/THE LANTERNWAKE/.test(current.title), 'the detail pane shows the current arc');
  check(current.badge.trim() === 'TERBARU', 'the current arc is badged TERBARU');
  check(current.beats >= 3 && current.cast >= 1, 'the arc renders beats and a cast');
  check(current.summary.bosses >= 100, `the map totals every boss (${current.summary.bosses})`);
  check(/Arc XII/.test(current.note), 'the newest arc points at the next planned arc');

  await evaluate(`document.querySelector('[data-story-arc="hearthfall"]').click()`);
  await sleep(150);
  const prolog = await evaluate(`(() => {
    const detail = document.getElementById('storymap-detail');
    return {
      title: detail.querySelector('h3')?.textContent || '',
      meta: detail.querySelector('.storymap-meta')?.textContent.replace(/\\s+/g, ' ').trim() || '',
      selected: window.__ashen.storyMap.selected,
      counter: detail.querySelector('.storymap-nav span')?.textContent || '',
    };
  })()`);
  check(/HEARTHFALL/.test(prolog.title), 'clicking a chip swaps the detail pane');
  check(/60/.test(prolog.meta), 'Hearthfall reports its sixty rooms');
  check(prolog.selected === 'hearthfall', 'the debug surface follows the selection');
  check(/1 \/ 14/.test(prolog.counter), 'the arc counter reports its position');

  await evaluate(`document.querySelector('[data-story-arc="rift"]').click()`);
  await sleep(150);
  const rift = await evaluate(`(() => {
    const detail = document.getElementById('storymap-detail');
    return {
      badge: detail.querySelector('.storymap-badge')?.textContent || '',
      locked: detail.querySelector('.storymap-badge')?.classList.contains('locked'),
      text: detail.textContent,
    };
  })()`);
  check(rift.badge.trim() === 'TERKUNCI' && rift.locked, 'the Rift is badged as locked');
  check(/belum ada ruang/i.test(rift.text), 'the Rift explains that it has no rooms');

  await evaluate(`document.querySelector('[data-story-step="-1"]').click()`);
  await sleep(150);
  check(await evaluate(`window.__ashen.storyMap.selected === 'crusade'`), 'the previous-arc button walks the timeline');

  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(250);
  check(await evaluate(`window.__ashen.menuView === 'title'`), 'Escape returns to the main menu');

  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'v', code: 'KeyV', windowsVirtualKeyCode: 86 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'v', code: 'KeyV', windowsVirtualKeyCode: 86 });
  await sleep(250);
  check(await evaluate(`window.__ashen.menuView === 'storymap'`), 'the V shortcut opens the story map');

  const saveAfter = await evaluate(`localStorage.getItem('ashen-vow-progress-v1')`);
  check(saveAfter === boot.saveBefore, 'reading the story map never writes to the save');

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(400);
  const phone = await evaluate(`(() => {
    const screen = document.getElementById('storymap-screen');
    const inner = screen.querySelector('.storymap-inner');
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      railDirection: getComputedStyle(document.getElementById('storymap-rail')).flexDirection,
      chip: document.querySelector('#storymap-rail .storymap-chip')?.getBoundingClientRect().width || 0,
      innerWidth: inner ? Math.round(inner.getBoundingClientRect().width) : 0,
    };
  })()`);
  check(phone.overflow <= 1, `390x844 has no horizontal overflow (${phone.overflow}px)`);
  check(phone.railDirection === 'row', 'the rail becomes a horizontal strip on phones');
  check(phone.chip >= 140 && phone.innerWidth <= 390, 'chips stay tappable inside the narrow frame');

  check(consoleErrors.length === 0, `no console errors (${consoleErrors.length})`);
  if (consoleErrors.length) console.log(consoleErrors.slice(0, 5).join('\n'));
} catch (error) {
  failed += 1;
  console.log(`  ✗ ${error.message}`);
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
  await sleep(200);
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
