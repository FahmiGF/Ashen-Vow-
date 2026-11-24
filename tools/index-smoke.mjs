// Illustrated Index + class roster smoke test (headless Chrome + CDP).
//
// Drives the real UI on a desktop and a portrait phone viewport:
//   · the Index lists every enemy and boss the game can spawn,
//   · portraits are painted by the game renderer (data URLs, idle-queued),
//   · search, arc filter and the detail panel work,
//   · the class roster shows a portrait for each of the 18 classes,
//   · the class preview draws the hero above the pedestal (not cut off),
//   · nothing overflows horizontally, and the console stays clean.
//
// Usage:  npm start   then   npm run smoke:index
// Env:    ASHEN_URL, CHROME_PATH, CDP_PORT (default 9241), SHOT_DIR (optional PNG output)

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9241;
const SHOT_DIR = process.env.SHOT_DIR || '';

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
      : ['/opt/pw-browsers/chromium', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const found = candidates.filter(Boolean).find((path) => existsSync(path));
  if (!found) throw new Error('No Chrome/Chromium found. Set CHROME_PATH.');
  return found;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const res = await fetch(URL, { method: 'HEAD' });
  assert.equal(res.ok, true, 'game server must be running');
  if (SHOT_DIR) mkdirSync(SHOT_DIR, { recursive: true });

  const profile = mkdtempSync(join(tmpdir(), 'ashen-index-smoke-'));
  const chrome = spawn(findBrowser(), [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--no-sandbox',
    '--mute-audio',
    '--window-size=1366,800',
    URL,
  ], { stdio: 'ignore' });

  let ws;
  const pageErrors = [];
  const checks = [];
  const check = (name, value, expected) => {
    assert.equal(value, expected, `${name} (got ${JSON.stringify(value)})`);
    checks.push(name);
    if (process.env.SMOKE_VERBOSE) console.log(`· ${name}`);
  };
  try {
    let list;
    for (let i = 0; i < 100; i++) {
      try {
        list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
        if (list.some((t) => t.type === 'page' && t.url.startsWith(URL))) break;
      } catch {
        // Chrome is still starting.
      }
      await sleep(150);
    }
    const page = list?.find((t) => t.type === 'page' && t.url.startsWith(URL));
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
        pageErrors.push(message.params.args.map((a) => a.value ?? a.description).join(' '));
      } else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
        if (!/favicon|ERR_NETWORK_ACCESS_DENIED|429|Too Many Requests|fonts\.g/i.test(message.params.entry.text || '')) {
          pageErrors.push(message.params.entry.text);
        }
      }
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
      ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const shot = async (name) => {
      if (!SHOT_DIR) return;
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(SHOT_DIR, `${name}.png`), Buffer.from(data, 'base64'));
    };
    const waitFor = async (expression, timeout = 6000) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        if (await evaluate(expression)) return true;
        await sleep(100);
      }
      return false;
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Log.enable');

    const viewports = [
      { name: 'desktop', width: 1366, height: 800, scale: 1, mobile: false },
      { name: 'phone', width: 390, height: 844, scale: 2, mobile: true },
    ];

    for (const vp of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width, height: vp.height, deviceScaleFactor: vp.scale, mobile: vp.mobile,
      });
      await send('Page.reload');
      await send('Page.bringToFront');
      const booted = await waitFor('typeof window.__ashen === "object" && document.readyState === "complete" && window.__ashen.menuView === "title"', 15000);
      check(`${vp.name}: game boots to the title menu`, booted, true);

      // ── Index ──────────────────────────────────────────────────────────
      const opened = await evaluate(`(() => {
        const A = window.__ashen;
        A.openCodex('enemies');
        return A.codex;
      })()`);
      check(`${vp.name}: Index opens on enemies`, opened.tab, 'enemies');
      check(`${vp.name}: Index lists all 262 enemies`, opened.enemies, 262);
      check(`${vp.name}: Index lists all 116 bosses`, opened.bosses, 116);
      check(`${vp.name}: every enemy gets a card`, opened.shown, 262);

      await evaluate(`document.getElementById('codex-entries').scrollIntoView({ block: 'start' })`);
      const painted = await waitFor('window.__ashen.codex.painted >= 4');
      check(`${vp.name}: visible enemy portraits are painted`, painted, true);
      const lazy = await evaluate('window.__ashen.codex');
      check(`${vp.name}: off-screen portraits stay unpainted (lazy)`, lazy.painted < lazy.shown, true);
      const realArt = await evaluate(`(() => {
        const img = document.querySelector('#codex-entries img[data-portrait][src]');
        return img ? img.src.slice(0, 15) : '';
      })()`);
      check(`${vp.name}: portraits are generated images`, /^data:image\/(webp|png)/.test(realArt), true);

      const detail = await evaluate(`(() => {
        const d = document.getElementById('codex-detail');
        return { name: d.querySelector('h3')?.textContent || '', img: !!d.querySelector('img[src]'), stats: d.querySelectorAll('.ix-stats span').length };
      })()`);
      check(`${vp.name}: detail panel shows the selected entry`, detail.name.length > 0, true);
      check(`${vp.name}: detail panel has a portrait`, detail.img, true);
      check(`${vp.name}: detail panel has three stats`, detail.stats, 3);
      await shot(`${vp.name}-index-enemies`);

      const bosses = await evaluate(`(() => {
        document.querySelector('[data-codex-tab="bosses"]').click();
        return window.__ashen.codex;
      })()`);
      check(`${vp.name}: boss tab shows all 116 bosses`, bosses.shown, 116);
      const filtered = await evaluate(`(() => {
        document.querySelector('[data-codex-source="court"]').click();
        return window.__ashen.codex;
      })()`);
      check(`${vp.name}: arc filter narrows to Hollow Court bosses`, filtered.shown, 12);
      const searched = await evaluate(`(() => {
        window.__ashen.setCodexSource('all');
        return window.__ashen.setCodexQuery('mordrake');
      })()`);
      check(`${vp.name}: search finds Sir Mordrake`, searched, 1);
      const picked = await evaluate(`(() => {
        window.__ashen.setCodexQuery('');
        const card = document.querySelector('[data-codex-entry="wyrm"]');
        card.click();
        return { selected: window.__ashen.codex.selected, name: document.querySelector('#codex-detail h3').textContent, quote: !!document.querySelector('#codex-detail blockquote') };
      })()`);
      check(`${vp.name}: clicking a card selects it`, picked.selected, 'wyrm');
      check(`${vp.name}: detail follows the clicked boss`, /Vhael/.test(picked.name), true);
      check(`${vp.name}: boss detail quotes its intro line`, picked.quote, true);
      await waitFor('window.__ashen.codex.painted >= 4');
      await shot(`${vp.name}-index-bosses`);

      const typing = await evaluate(`(() => {
        const input = document.getElementById('codex-search');
        input.focus();
        for (const code of ['KeyO', 'KeyM', 'Backspace']) {
          input.dispatchEvent(new KeyboardEvent('keydown', { code, key: code.slice(-1).toLowerCase(), bubbles: true }));
        }
        return { open: window.__ashen.codexOpen, map: window.__ashen.mapOpen };
      })()`);
      check(`${vp.name}: typing O/M in search keeps the Index open`, typing.open && !typing.map, true);

      const weapons = await evaluate(`(() => {
        document.querySelector('[data-codex-tab="weapons"]').click();
        return window.__ashen.codex;
      })()`);
      check(`${vp.name}: weapons tab still lists the codex weapons`, weapons.shown, 3);
      const overflowIndex = await evaluate('document.documentElement.scrollWidth - window.innerWidth');
      check(`${vp.name}: Index has no horizontal overflow`, overflowIndex <= 0, true);
      await evaluate('window.__ashen.closeCodex()');

      // ── Class roster ───────────────────────────────────────────────────
      await evaluate('window.__ashen.showCharacter()');
      await sleep(100);
      await evaluate("document.getElementById('char-roster').scrollIntoView({ block: 'start' })");
      const rosterPainted = await waitFor(`document.querySelectorAll('#char-roster img[data-portrait][src]').length >= 4`);
      const roster = await evaluate(`(() => ({
        cards: document.querySelectorAll('#char-roster .char-card').length,
        images: document.querySelectorAll('#char-roster img[data-portrait]').length,
        overflowCards: [...document.querySelectorAll('#char-roster .char-card')].filter((c) => c.scrollWidth > c.clientWidth + 2).length,
      }))()`);
      check(`${vp.name}: roster lists 18 classes`, roster.cards, 18);
      check(`${vp.name}: every class card has a portrait`, roster.images, 18);
      check(`${vp.name}: roster portraits paint`, rosterPainted, true);
      check(`${vp.name}: no class card overflows its text`, roster.overflowCards, 0);

      await sleep(400);
      const preview = await evaluate(`(() => {
        const c = document.getElementById('char-preview');
        const ctx = c.getContext('2d');
        const w = c.width, h = c.height;
        const band = (y0, y1) => {
          const data = ctx.getImageData(Math.round(w * 0.3), Math.round(h * y0), Math.round(w * 0.4), Math.max(1, Math.round(h * (y1 - y0)))).data;
          let solid = 0;
          for (let i = 3; i < data.length; i += 4) if (data[i] > 200) solid++;
          return solid / (data.length / 4);
        };
        return { cssW: c.clientWidth, w, upper: band(0.3, 0.6), below: band(0.93, 1) };
      })()`);
      check(`${vp.name}: preview canvas matches its laid-out size`, Math.abs(preview.w / Math.max(1, preview.cssW) - Math.min(2, vp.scale)) < 0.05, true);
      check(`${vp.name}: hero is drawn above the pedestal`, preview.upper > 0.08, true);
      check(`${vp.name}: nothing is drawn below the pedestal edge`, preview.below < 0.05, true);
      const overflowChar = await evaluate('document.documentElement.scrollWidth - window.innerWidth');
      check(`${vp.name}: class screen has no horizontal overflow`, overflowChar <= 0, true);
      await shot(`${vp.name}-classes`);

      // ── Level Select thumbnails ────────────────────────────────────────
      await evaluate('window.__ashen.showLevels()');
      const thumbs = await waitFor(`document.querySelectorAll('#level-cards img.level-thumb[src^="data:image"]').length >= 3`, 8000);
      const levelInfo = await evaluate(`(() => ({
        cards: document.querySelectorAll('#level-cards .level-card').length,
        thumbs: document.querySelectorAll('#level-cards img.level-thumb').length,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        liveCanvas: !!document.querySelector('canvas#game'),
      }))()`);
      check(`${vp.name}: level select keeps its cards`, levelInfo.cards >= 14, true);
      check(`${vp.name}: every visible legacy room card has a thumbnail slot`, levelInfo.thumbs >= 13, true);
      check(`${vp.name}: room thumbnails paint`, thumbs, true);
      check(`${vp.name}: level select has no horizontal overflow`, levelInfo.overflow <= 0, true);
      await shot(`${vp.name}-levels`);
      await evaluate('window.__ashen.showMenu()');
    }

    check('no console errors', pageErrors.length, 0);
    if (pageErrors.length) console.error(pageErrors.join('\n'));
    console.log(`\nINDEX SMOKE PASS — ${checks.length} checks`);
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
  console.error('INDEX SMOKE FAIL');
  console.error(error);
  process.exitCode = 1;
});
