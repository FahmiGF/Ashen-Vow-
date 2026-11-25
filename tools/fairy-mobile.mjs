// Faewood mobile (portrait 390×844) layout smoke test (headless Chrome + CDP).
//
// Checks that the title menu, the Faewood hub, the in-game Update Log and the
// cinematic cutscene screen all fit a portrait phone without horizontal
// overflow, and that the v0.10.0 release note actually renders in the game.
//
// Usage:
//   npm start
//   node tools/fairy-mobile.mjs
//
// Env: ASHEN_URL, CHROME_PATH, CDP_PORT (default 9237).

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9237;

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

  const profile = mkdtempSync(join(tmpdir(), 'ashen-fairy-mobile-'));
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
      A.openMenuHub('arcs');
      const overflow = window.__overflow();
      return {
        view: A.menuView,
        overflow,
        fairyButton: window.__fit('#btn-fairy-menu'),
        titleScreen: window.__fit('#title-screen'),
        updatesButton: window.__fit('#btn-updates'),
      };
    })()`);
    check('boot lands on the title menu', title.view, 'title');
    check('title screen has no horizontal overflow', title.overflow.doc <= 0, true);
    check('fairy menu entry fits the phone', title.fairyButton.fitsWidth, true);
    check('update-log entry fits the phone', title.updatesButton.fitsWidth, true);
    check('title screen fills the viewport', title.titleScreen.height >= 800, true);

    await evaluate(`document.getElementById('btn-fairy-menu').click()`);
    await sleep(600);
    const hub = await evaluate(`(() => {
      const A = window.__ashen;
      return {
        view: A.menuView,
        stages: document.querySelectorAll('.fairy-stage-card').length,
        bosses: document.querySelectorAll('.fairy-boss-card').length,
        overflow: window.__overflow(),
        screen: window.__fit('#fairy-screen'),
        body: window.__fit('#fairy-body'),
        summary: window.__fit('#fairy-summary'),
        stageCard: window.__fit('.fairy-stage-card'),
        bossCard: window.__fit('.fairy-boss-card'),
        stageButton: window.__fit('[data-fairy-stage="0"]'),
        bossButton: window.__fit('[data-fairy-boss]'),
        cardStacked: (() => {
          const card = document.querySelector('.fairy-stage-card');
          const btn = card?.querySelector('.btn');
          if (!card || !btn) return false;
          return btn.getBoundingClientRect().width <= card.getBoundingClientRect().width + 1;
        })(),
      };
    })()`);
    check('fairy hub opens on mobile', hub.view, 'fairy');
    check('ten stage cards render on mobile', hub.stages, 10);
    check('two boss cards render on mobile', hub.bosses, 2);
    check('fairy hub has no horizontal overflow', hub.overflow.doc <= 0, true);
    check('fairy hub fills the phone viewport', hub.screen.height >= 800, true);
    check('fairy hub body fits the phone', hub.body.fitsWidth, true);
    check('fairy summary fits the phone', hub.summary.fitsWidth, true);
    check('stage card fits the phone', hub.stageCard.fitsWidth, true);
    check('boss card fits the phone', hub.bossCard.fitsWidth, true);
    check('stage button is reachable', hub.stageButton.fitsWidth, true);
    check('boss button is reachable', hub.bossButton.fitsWidth, true);
    check('stage button wraps under the card text', hub.cardStacked, true);

    const updates = await evaluate(`(async () => {
      const A = window.__ashen;
      await A.showUpdates();
      const entries = [...document.querySelectorAll('.update-entry, .update-card, #update-log > *')];
      const firstText = document.getElementById('update-log')?.textContent || '';
      return {
        view: A.menuView,
        entries: entries.length,
        badge: document.getElementById('updates-version')?.textContent.trim(),
        firstText,
        firstEntryText: entries[0]?.textContent || '',
        meta: document.querySelector('.updates-meta')?.textContent || '',
        overflow: window.__overflow(),
        screen: window.__fit('#updates-screen'),
        log: window.__fit('#update-log'),
        logText: document.getElementById('update-log')?.textContent || '',
      };
    })()`);
    check('update log opens', updates.view, 'updates');
    check('update log renders the release history', updates.entries >= 12, true);
    check('update log shows v0.36.0', /v0\.36\.0/i.test(updates.badge || ''), true);
    check('update log leads with the newest release', Boolean(updates.badge) && updates.firstEntryText.includes(updates.badge.replace(/^.*?(v\d+\.\d+\.\d+).*$/i, '$1')), true);
    check('update log keeps the Faewood entry', /FAEWOOD/i.test(updates.firstText), true);
    check('update log mentions the spectral dragon forms', /Demon Lord of the Last Vow/.test(updates.firstText), true);
    check('update log mentions the 30-second epilogue', /30 detik/.test(updates.firstText), true);
    check('update log is dated November 2026', /NOVEMBER 2026/i.test(updates.meta || ''), true);
    check('update log has no horizontal overflow', updates.overflow.doc <= 0, true);
    check('update log fills the phone viewport', updates.screen.height >= 800, true);
    check('update log body fits the phone', updates.log.fitsWidth, true);

    // The cutscene is not reachable from the menu, so unhide it to test layout.
    const cutscene = await evaluate(`(() => {
      const A = window.__ashen;
      A.showMenu();
      const screen = document.getElementById('cutscene-screen');
      screen.classList.remove('hidden');
      document.getElementById('cutscene-line').textContent =
        'Cahaya itu milikku sejak awal. Aku adalah Raja Iblis yang kau kira telah lama mati.';
      document.getElementById('cutscene-title').textContent = 'SYLVARA';
      return {
        screen: window.__fit('#cutscene-screen'),
        subtitle: window.__fit('.cutscene-subtitle'),
        line: window.__fit('#cutscene-line'),
        skip: window.__fit('#btn-cutscene-skip'),
        overflow: window.__overflow(),
      };
    })()`);
    check('cutscene screen fills the phone viewport', cutscene.screen.height >= 800, true);
    check('cutscene screen starts at the top of the viewport', cutscene.screen.top, 0);
    check('cutscene screen is full width', cutscene.screen.width >= 390, true);
    check('cutscene has no horizontal overflow', cutscene.overflow.doc <= 0, true);
    check('cutscene subtitle stays on screen', cutscene.subtitle.fitsWidth, true);
    check('cutscene line fits the subtitle box', cutscene.line.fitsWidth, true);
    check('cutscene subtitle sits in the lower half', cutscene.subtitle.bottom <= 844, true);
    check('skip button is reachable', cutscene.skip.fitsWidth, true);

    await evaluate(`document.getElementById('cutscene-screen').classList.add('hidden')`);

    // Reload: the phone view must survive a fresh boot.
    await send('Page.reload');
    await sleep(600);
    for (let i = 0; i < 80; i += 1) {
      const ready = await evaluate('typeof window.__ashen === "object" && document.readyState === "complete"').catch(() => false);
      if (ready) break;
      await sleep(150);
    }
    const reloaded = await evaluate(`(() => {
      const A = window.__ashen;
      const overflow = {
        doc: document.documentElement.scrollWidth - window.innerWidth,
        body: document.body.scrollWidth - window.innerWidth,
      };
      return { booted: typeof A === 'object', view: A.menuView, overflow, version: A.version };
    })()`);
    check('game boots again at the phone size', reloaded.booted, true);
    check('reload lands on the title menu', reloaded.view, 'title');
    check('reload keeps the viewport clean', reloaded.overflow.doc <= 0, true);
    check('reload reports v0.36.0', reloaded.version, '0.36.0');

    check('no console errors', pageErrors.length, 0);
    if (pageErrors.length) console.error(pageErrors.join('\n'));

    console.log(`\nFAIRY MOBILE SMOKE PASS — ${checks.length} checks`);
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
  console.error('FAIRY MOBILE SMOKE FAIL');
  console.error(error);
  process.exitCode = 1;
});
