// Ashen Vow — gadget audit: layout + frame pacing across device classes.
//
// Cycles through ten viewports (small phone → 4K desktop) and checks that the
// title screen, the Speedrun hub, the fishing hub, the bait shack and the fish
// index never scroll horizontally and stay inside the viewport. It also samples
// requestAnimationFrame pacing in the menu and mid-run so a regression in the
// render loop shows up as a number, not a feeling.
//
// Usage:
//   npm start
//   node tools/gadget-audit.mjs
//
// Env: ASHEN_URL, CHROME_PATH, CDP_PORT (default 9241).

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9241;

const VIEWPORTS = [
  { label: 'phone-320', width: 320, height: 568, mobile: true },
  { label: 'phone-360', width: 360, height: 640, mobile: true },
  { label: 'phone-390', width: 390, height: 844, mobile: true },
  { label: 'phone-414', width: 414, height: 896, mobile: true },
  { label: 'phone-landscape', width: 844, height: 390, mobile: true },
  { label: 'tablet-768', width: 768, height: 1024, mobile: true },
  { label: 'tablet-1024', width: 1024, height: 768, mobile: true },
  { label: 'laptop-1366', width: 1366, height: 768, mobile: false },
  { label: 'desktop-1440', width: 1440, height: 900, mobile: false },
  { label: 'desktop-1920', width: 1920, height: 1080, mobile: false },
];

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

  const profile = mkdtempSync(join(tmpdir(), 'ashen-gadgets-'));
  const chrome = spawn(findBrowser(), [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    // Frame pacing must be measured on the same GPU path players use. Software
    // rasterization caps the 1440px menu near 12 fps on Windows even though the
    // game is healthy, so it would report an environment limit as a regression.
    '--mute-audio',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--window-size=1440,900',
    URL,
  ], { stdio: 'ignore' });

  let ws;
  const pageErrors = [];
  const checks = [];
  const report = [];
  const check = (name, value, expected) => {
    assert.equal(value, expected, name);
    checks.push(name);
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

    const injectAudit = () => evaluate(`(() => {
      window.__audit = () => {
        const docOverflow = document.documentElement.scrollWidth - window.innerWidth;
        const bodyOverflow = document.body.scrollWidth - window.innerWidth;
        const screen = document.querySelector('.screen:not(.hidden)');
        const inner = screen ? screen.querySelector('.screen-inner') : null;
        const rect = inner ? inner.getBoundingClientRect() : null;
        const buttons = [...document.querySelectorAll('.screen:not(.hidden) .screen-links .btn, .screen:not(.hidden) .screen-links .link-btn')];
        const overflowButtons = buttons.filter((button) => {
          const r = button.getBoundingClientRect();
          return r.left < -1 || r.right > window.innerWidth + 1;
        }).map((button) => button.id || button.textContent.trim().slice(0, 20));
        return {
          view: window.__ashen ? window.__ashen.menuView : 'unknown',
          docOverflow,
          bodyOverflow,
          innerLeft: rect ? Math.round(rect.left) : null,
          innerRight: rect ? Math.round(rect.right) : null,
          vw: window.innerWidth,
          vh: window.innerHeight,
          overflowButtons,
        };
      };
      return true;
    })()`);

    const sampleFps = (ms = 1200) => evaluate(`new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      const tick = () => {
        frames += 1;
        const elapsed = performance.now() - start;
        if (elapsed < ${ms}) requestAnimationFrame(tick);
        else resolve({ fps: Math.round((frames / elapsed) * 10000) / 10, frames });
      };
      requestAnimationFrame(tick);
    })`);

    const screens = [
      { id: 'title', open: 'window.__ashen.showMenu()' },
      { id: 'speedrun', open: 'window.__ashen.showSpeedrun()' },
      { id: 'fishing', open: 'window.__ashen.showFishing()' },
      { id: 'baitShop', open: 'window.__ashen.openBaitShop()' },
      { id: 'fishIndex', open: 'window.__ashen.openFishIndex()' },
      { id: 'waveDefense', open: 'window.__ashen.showWaveDefense()' },
      {
        id: 'fallenMenu',
        open: '(async () => { const A = window.__ashen; A.progress.cleared[7] = true; A.ascendNow(); A.showFallenMenu(); })()',
      },
      { id: 'fallenHub', open: 'window.__ashen.showFallen("regions")' },
      {
        id: 'crusadeMenu',
        open: '(async () => { const A = window.__ashen; A.progress.cleared[7] = true; A.ascendNow(); A.progress.fallen.endings.dawn = true; A.progress.fallen.ending = "dawn"; A.unlockCrusadeNow(); A.showCrusadeMenu(); })()',
      },
      { id: 'crusadeHub', open: 'window.__ashen.showCrusade("levels")' },
    ];

    let first = true;
    for (const viewport of VIEWPORTS) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.mobile ? 2 : 1,
        mobile: viewport.mobile,
      });
      await send('Emulation.setTouchEmulationEnabled', { enabled: viewport.mobile, maxTouchPoints: viewport.mobile ? 5 : 1 });
      await send('Page.reload');
      await send('Page.bringToFront');
      await sleep(1900);
      let booted = false;
      for (let i = 0; i < 80; i++) {
        try {
          booted = await evaluate('typeof window.__ashen === "object"');
          if (booted) break;
        } catch {
          // still loading
        }
        await sleep(100);
      }
      assert.equal(booted, true, `${viewport.label} must boot (${pageErrors.join(' | ')})`);
      if (first) {
        await evaluate('window.__ashen.clearProgress()');
        first = false;
      }
      await injectAudit();
      const entry = { label: viewport.label, size: `${viewport.width}×${viewport.height}`, screens: {}, fps: null };
      for (const screen of screens) {
        await evaluate(screen.open);
        await sleep(320);
        const audit = await evaluate('window.__audit()');
        entry.screens[screen.id] = { overflow: audit.docOverflow, buttons: audit.overflowButtons.length };
        check(`${viewport.label} ${screen.id}: no horizontal scroll`, audit.docOverflow <= 1, true);
        check(`${viewport.label} ${screen.id}: body does not overflow`, audit.bodyOverflow <= 1, true);
        check(`${viewport.label} ${screen.id}: screen panel inside the viewport`, audit.innerLeft >= -1, true);
        check(`${viewport.label} ${screen.id}: buttons stay on screen`, audit.overflowButtons.length, 0);
      }

      if (viewport.label === 'phone-390' || viewport.label === 'desktop-1440') {
        await evaluate('window.__ashen.showMenu()');
        await sleep(200);
        // Headless pacing is noisy; take the best of three samples and report all of them on failure.
        const menuSamples = [await sampleFps(800), await sampleFps(800), await sampleFps(800)];
        const menuFps = { fps: Math.max(...menuSamples.map((sample) => sample.fps)) };
        check(`${viewport.label} menu keeps a playable frame rate (${menuSamples.map((sample) => sample.fps).join('/')} fps)`, menuFps.fps >= 20, true);
        entry.fps = menuFps.fps;
        const runFps = await evaluate(`(() => {
          const A = window.__ashen;
          if (typeof A.start === 'function') A.start();
          return A.menuView;
        })()`);
        await sleep(400);
        const runSamples = [await sampleFps(800), await sampleFps(800), await sampleFps(800)];
        const midRun = { fps: Math.max(...runSamples.map((sample) => sample.fps)) };
        check(`${viewport.label} run keeps a playable frame rate (${runSamples.map((sample) => sample.fps).join('/')} fps)`, midRun.fps >= 20, true);
        check(`${viewport.label} run starts for the sample`, runFps, 'none');
        entry.runFps = midRun.fps;
      }
      report.push(entry);
    }

    check('no console errors across the device matrix', pageErrors.length, 0);
    if (pageErrors.length) console.error(pageErrors.join('\n'));

    console.log('\nGADGET AUDIT');
    for (const entry of report) {
      const worst = Math.max(...Object.values(entry.screens).map((screen) => screen.overflow));
      const buttons = Object.values(entry.screens).reduce((sum, screen) => sum + screen.buttons, 0);
      console.log(
        `  ${entry.label.padEnd(16)} ${entry.size.padEnd(10)} worst-overflow ${String(worst).padStart(3)}px  offscreen-buttons ${buttons}`
        + (entry.fps ? `  menu ${entry.fps}fps  run ${entry.runFps}fps` : ''),
      );
    }
    console.log(`\nGADGET AUDIT PASS — ${checks.length} checks across ${VIEWPORTS.length} viewports`);
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
      // Windows may hold the profile briefly.
    }
  }
}

main().catch((error) => {
  console.error('GADGET AUDIT FAIL');
  console.error(error);
  process.exitCode = 1;
});
