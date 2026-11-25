// Speedrun mobile (portrait 390×844) layout smoke test (headless Chrome + CDP).
//
// Checks that the Speedrun hub, its rule list and ladder, the in-run HUD badge,
// the one-life summary screen and the run-history rows all fit a portrait phone
// without horizontal overflow, and that history persists across a reload.
//
// Usage:
//   npm start
//   node tools/speedrun-mobile.mjs
//
// Env: ASHEN_URL, CHROME_PATH, CDP_PORT (default 9239).

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9239;

function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const local = process.env.LOCALAPPDATA || '';
  const candidates = process.platform === 'win32'
    ? [
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        local ? join(local, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
      ]
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const found = candidates.filter(Boolean).find((path) => existsSync(path));
  if (!found) throw new Error('No Chrome/Chromium found. Set CHROME_PATH.');
  return found;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const res = await fetch(URL, { method: 'HEAD' });
  assert.equal(res.ok, true, 'game server must be running');

  const profile = mkdtempSync(join(tmpdir(), 'ashen-speedrun-mobile-'));
  const chrome = spawn(findBrowser(), [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--mute-audio',
    '--window-size=390,844',
    URL,
  ], { stdio: 'ignore' });

  let ws;
  const pageErrors = [];
  const checks = [];
  const check = (name, value, expected) => {
    assert.equal(value, expected, name);
    checks.push(name);
    if (process.env.SMOKE_VERBOSE) console.log(`· ${name}`);
  };
  try {
    let list;
    for (let i = 0; i < 100; i++) {
      try {
        const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
        list = await response.json();
        if (list.some((target) => target.type === 'page' && target.url.startsWith(URL))) break;
      } catch {
        // Chrome is still starting.
      }
      await sleep(150);
    }
    const page = list?.find((target) => target.type === 'page' && target.url.startsWith(URL));
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
        return;
      }
      if (message.method === 'Runtime.exceptionThrown') {
        pageErrors.push(message.params.exceptionDetails?.exception?.description || 'exception');
      } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        pageErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
      } else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
        if (!/favicon|ERR_NETWORK_ACCESS_DENIED|429|Too Many Requests/i.test(message.params.entry.text || '')) {
          pageErrors.push(message.params.entry.text);
        }
      }
    });

    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, (message) => {
        if (message.error) reject(new Error(`${method}: ${message.error.message}`));
        else resolve(message.result);
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      }
      return result.result.value;
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Log.enable');

    // Portrait phone: 390×844 CSS pixels with touch.
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Page.reload');
    await send('Page.bringToFront');
    await sleep(2600);

    let booted = false;
    for (let i = 0; i < 100; i++) {
      try {
        booted = await evaluate('typeof window.__ashen === "object" && document.readyState === "complete"');
        if (booted) break;
      } catch {
        // Module graph is still loading.
      }
      await sleep(120);
    }
    assert.equal(booted, true, `game must boot (errors: ${pageErrors.join(' | ')})`);

    // Shared helpers injected once, then reused by every check below.
    await evaluate(`(() => {
      window.__fit = (selector) => {
        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          fitsWidth: rect.left >= -1 && rect.right <= window.innerWidth + 1,
          scrollFits: el.scrollWidth <= el.clientWidth + 2,
        };
      };
      window.__overflow = () => ({
        doc: document.documentElement.scrollWidth - window.innerWidth,
        body: document.body.scrollWidth - window.innerWidth,
        viewport: [window.innerWidth, window.innerHeight],
      });
      return true;
    })()`);

    const viewport = await evaluate('({ w: window.innerWidth, h: window.innerHeight, touch: navigator.maxTouchPoints })');
    check('portrait viewport applied', viewport.w, 390);
    check('portrait height applied', viewport.h, 844);
    check('touch input available', viewport.touch >= 1, true);

    const title = await evaluate(`(() => {
      const A = window.__ashen;
      A.clearProgress();
      A.showMenu();
      // The entry now sits in a menu hub (v0.39.0).
      A.openMenuHub('arena');
      return {
        view: A.menuView,
        overflow: window.__overflow(),
        speedrunButton: window.__fit('#btn-speedrun-menu'),
        titleScreen: window.__fit('#title-screen'),
      };
    })()`);
    check('boot lands on the title menu', title.view, 'title');
    check('title screen has no horizontal overflow', title.overflow.doc <= 0, true);
    check('speedrun menu entry fits the phone', title.speedrunButton.fitsWidth, true);
    check('title screen fills the viewport', title.titleScreen.height >= 800, true);

    await evaluate(`document.getElementById('btn-speedrun-menu').click()`);
    await sleep(600);
    const hub = await evaluate(`(() => {
      const A = window.__ashen;
      return {
        view: A.menuView,
        rules: document.querySelectorAll('.speedrun-rules li').length,
        rungs: document.querySelectorAll('.speedrun-rung').length,
        overflow: window.__overflow(),
        screen: window.__fit('#speedrun-screen'),
        body: window.__fit('#speedrun-body'),
        summary: window.__fit('#speedrun-summary'),
        rule: window.__fit('.speedrun-rules li'),
        rung: window.__fit('.speedrun-rung'),
        start: window.__fit('#speedrun-start'),
        empty: window.__fit('#speedrun-body .exp-section:last-child .speedrun-empty'),
        emptyText: [...document.querySelectorAll('.speedrun-empty')].map((node) => node.textContent).join(' '),
        startText: document.getElementById('speedrun-start').textContent.trim(),
      };
    })()`);
    check('speedrun hub opens on mobile', hub.view, 'speedrun');
    check('hub lists five rules on mobile', hub.rules, 5);
    check('hub ladder shows five records plus endless', hub.rungs, 7);
    check('speedrun hub has no horizontal overflow', hub.overflow.doc <= 0, true);
    check('speedrun hub fills the phone viewport', hub.screen.height >= 800, true);
    check('speedrun hub body fits the phone', hub.body.fitsWidth, true);
    check('speedrun summary fits the phone', hub.summary.fitsWidth, true);
    check('rule text fits the phone', hub.rule.fitsWidth, true);
    check('ladder rung fits the phone', hub.rung.fitsWidth, true);
    check('start button is reachable', hub.start.fitsWidth, true);
    check('start button names the 2x run', hub.startText, 'MULAI SPEEDRUN 2×');
    check('empty history note is shown before the first run', hub.emptyText.includes('Belum ada riwayat'), true);
    check('empty history note fits the phone', hub.empty.fitsWidth, true);

    await evaluate(`document.getElementById('speedrun-start').click()`);
    await sleep(900);
    const running = await evaluate(`(() => {
      const A = window.__ashen;
      return {
        kind: A.runKind,
        room: A.game.roomIndex,
        oneLife: A.game.oneLife,
        multiplier: A.speedrun.multiplier,
        badge: window.__fit('#speedrun-badge'),
        badgeText: document.getElementById('speedrun-badge').textContent.trim(),
        badgeHidden: document.getElementById('speedrun-badge').classList.contains('hidden'),
        overflow: window.__overflow(),
      };
    })()`);
    check('speedrun run starts on the phone', running.kind, 'speedrun');
    check('mobile run starts in room 0', running.room, 0);
    check('mobile run keeps one life', running.oneLife, true);
    check('mobile run starts at 2x', running.multiplier, 2);
    check('hud badge is visible on the phone', running.badgeHidden, false);
    check('hud badge fits the phone', running.badge.fitsWidth, true);
    check('hud badge stays inside the viewport', running.badge.right <= 390, true);
    check('hud badge names the multiplier', running.badgeText.includes('2×'), true);
    check('mobile run has no horizontal overflow', running.overflow.doc <= 0, true);

    await evaluate(`(() => {
      const A = window.__ashen;
      A.game.player.invuln = 0;
      A.game.damagePlayer(9999, 0);
      return true;
    })()`);
    await sleep(600);
    const summary = await evaluate(`(() => {
      const A = window.__ashen;
      const saved = JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-progress-v1')).speedrun;
      return {
        open: A.speedrun.summaryOpen,
        hidden: document.getElementById('speedrun-summary-screen').classList.contains('hidden'),
        screen: window.__fit('#speedrun-summary-screen'),
        inner: window.__fit('#speedrun-summary-screen .screen-inner'),
        body: window.__fit('#speedrun-summary-body'),
        again: window.__fit('#speedrun-summary-again'),
        menu: window.__fit('#speedrun-summary-menu'),
        overflow: window.__overflow(),
        history: saved.history.length,
        sub: document.getElementById('speedrun-summary-sub').textContent,
      };
    })()`);
    check('death opens the speedrun summary on the phone', summary.open, true);
    check('summary screen is visible', summary.hidden, false);
    check('summary screen fills the phone viewport', summary.screen.height >= 800, true);
    check('summary has no horizontal overflow', summary.overflow.doc <= 0, true);
    check('summary panel fits the phone', summary.inner.fitsWidth, true);
    check('summary body fits the phone', summary.body.fitsWidth, true);
    check('summary restart button is reachable', summary.again.fitsWidth, true);
    check('summary menu button is reachable', summary.menu.fitsWidth, true);
    check('summary reports the failed multiplier', summary.sub.includes('2×'), true);
    check('mobile death lands in the history', summary.history, 1);

    await evaluate(`document.getElementById('speedrun-summary-menu').click()`);
    await sleep(500);
    await evaluate(`document.getElementById('btn-speedrun-menu').click()`);
    await sleep(600);
    const history = await evaluate(`(() => {
      const A = window.__ashen;
      const row = document.querySelector('.speedrun-history-row');
      return {
        view: A.menuView,
        rows: document.querySelectorAll('.speedrun-history-row').length,
        row: window.__fit('.speedrun-history-row'),
        text: row?.textContent || '',
        overflow: window.__overflow(),
        body: window.__fit('#speedrun-body'),
      };
    })()`);
    check('hub reopens after the mobile death', history.view, 'speedrun');
    check('history renders one mobile attempt', history.rows, 1);
    check('history row fits the phone', history.row.fitsWidth, true);
    check('history row wraps inside the panel', history.row.scrollFits !== false, true);
    check('history row names the outcome', history.text.includes('GUGUR'), true);
    check('history panel has no horizontal overflow', history.overflow.doc <= 0, true);
    check('history panel fits the phone body', history.body.fitsWidth, true);

    // Reload: the phone view and the run history must survive a fresh boot.
    await send('Page.reload');
    await sleep(2600);
    // A reload wipes the injected helpers, so put them back before measuring.
    await evaluate(`(() => {
      window.__fit = (selector) => {
        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          fitsWidth: rect.left >= -1 && rect.right <= window.innerWidth + 1,
        };
      };
      window.__overflow = () => ({ doc: document.documentElement.scrollWidth - window.innerWidth });
      return true;
    })()`);
    const reloaded = await evaluate(`(async () => {
      const A = window.__ashen;
      document.getElementById('btn-speedrun-menu').click();
      await A.loadMode('speedrun');
      const row = document.querySelector('.speedrun-history-row');
      return {
        booted: typeof A === 'object',
        version: A.version,
        view: A.menuView,
        rows: document.querySelectorAll('.speedrun-history-row').length,
        row: window.__fit('.speedrun-history-row'),
        best: A.speedrun.progress.bestMultiplier,
        overflow: window.__overflow(),
        overflowText: row ? row.textContent : '',
      };
    })()`);
    check('game boots again at the phone size', reloaded.booted, true);
    check('reload reports v0.36.0', reloaded.version, '0.36.0');
    check('reload lands on the phone speedrun hub', reloaded.view, 'speedrun');
    check('history survives the reload', reloaded.rows, 1);
    check('reloaded history row fits the phone', reloaded.row.fitsWidth, true);
    check('record survives the reload', reloaded.best, 2);
    check('reload keeps the viewport clean', reloaded.overflow.doc <= 0, true);

    check('no console errors', pageErrors.length, 0);
    if (pageErrors.length) console.error(pageErrors.join('\n'));

    console.log(`\nSPEEDRUN MOBILE SMOKE PASS — ${checks.length} checks`);
  } finally {
    try {
      ws?.close();
    } catch {
      // Already closed.
    }
    chrome.kill();
    await sleep(200);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      // Windows can keep the profile locked for a moment.
    }
  }
}

main().catch((error) => {
  console.error('SPEEDRUN MOBILE SMOKE FAIL');
  console.error(error);
  process.exitCode = 1;
});
