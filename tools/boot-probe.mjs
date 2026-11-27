// Startup & lazy-loading probe (Masterplan 4.0 P1 / §2):
// Measures cold-boot JS/CSS module count, raw bytes, transfer bytes, boot time
// to `__ashenBootReady`, time to interactive title menu after trailer dismiss,
// and first-click load latency for Update Log and Peta Sumpah.
//
// Usage:  npm start   then   node tools/boot-probe.mjs
// Env:    ASHEN_URL, CHROME_PATH, CDP_PORT (default 9365), RUNS (default 3)
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9365;
const RUNS = Math.max(1, Number(process.env.RUNS) || 3);

function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const local = process.env.LOCALAPPDATA || '';
  const candidates = process.platform === 'win32'
    ? [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        local ? join(local, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      ]
    : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return candidates.filter(Boolean).find(existsSync) || '';
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const percentile = (sorted, p) => {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
};

function localRawSize(urlStr) {
  try {
    const pathname = new URL(urlStr).pathname.replace(/^\/+/, '');
    if (!pathname) return 0;
    const rel = decodeURIComponent(pathname);
    return existsSync(rel) ? statSync(rel).size : 0;
  } catch {
    return 0;
  }
}

async function runSingleBoot(chromePath, runIndex) {
  const profile = mkdtempSync(join(tmpdir(), `ashen-boot-${runIndex}-`));
  const port = PORT + runIndex;
  let chrome;
  try {
    chrome = spawn(chromePath, [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--enable-unsafe-swiftshader',
      '--use-angle=swiftshader',
      '--mute-audio',
      '--window-size=1280,900',
      'about:blank',
    ], { stdio: 'ignore' });
  } catch (err) {
    throw new Error(`[BROWSER_LAUNCH] Failed to launch Chrome: ${err.message}`);
  }

  let ws;
  try {
    let list = null;
    for (let i = 0; i < 100; i += 1) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json/list`);
        list = await res.json();
        if (list.some((t) => t.type === 'page')) break;
      } catch { /* waiting for CDP */ }
      await sleep(100);
    }
    const page = list?.find((t) => t.type === 'page');
    if (!page) throw new Error('[BROWSER_LAUNCH] Chrome started without a page target');
    const verInfo = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json().catch(() => ({}));

    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });

    let seq = 0;
    const pending = new Map();
    const requests = new Map();
    const http404s = [];

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
        return;
      }
      if (msg.method === 'Network.requestWillBeSent') {
        const { requestId, request, timestamp } = msg.params;
        requests.set(requestId, {
          url: request.url,
          type: msg.params.type,
          startedAt: timestamp,
          transferBytes: 0,
          status: 0,
          done: false,
          phase: 'boot',
        });
      } else if (msg.method === 'Network.responseReceived') {
        const rec = requests.get(msg.params.requestId);
        if (rec) {
          rec.status = msg.params.response.status;
          rec.mime = msg.params.response.mimeType || '';
          rec.type = msg.params.type || rec.type;
          if (rec.status === 404) http404s.push(rec.url);
        }
      } else if (msg.method === 'Network.loadingFinished') {
        const rec = requests.get(msg.params.requestId);
        if (rec) {
          rec.transferBytes = msg.params.encodedDataLength || 0;
          rec.done = true;
        }
      }
    });

    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
      ws.send(JSON.stringify({ id, method, params }));
    });

    const evaluate = async (expression) => {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
      }
      return res.result.value;
    };

    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Runtime.enable');
    await send('Page.enable');

    const navT0 = performance.now();
    await send('Page.navigate', { url: BASE });

    let booted = false;
    for (let i = 0; i < 200; i += 1) {
      try {
        booted = await evaluate('Boolean(window.__ashenBoot && window.__ashenBoot.ready && window.__ashen)');
        if (booted) break;
      } catch { /* navigating */ }
      await sleep(50);
    }
    if (!booted) throw new Error('[APP_BOOT] Timed out waiting for __ashenBoot.ready');
    const bootWallMs = performance.now() - navT0;

    // Allow any immediate boot-triggered fetches (manifest, /api/voice) a moment to settle.
    await sleep(250);
    const bootTiming = await evaluate(`(() => {
      const b = window.__ashenBoot;
      const a = window.__ashen;
      const nav = performance.getEntriesByType('navigation')[0];
      return {
        menuView: a.menuView,
        bootDeltaMs: (b.readyAt && b.startedAt) ? (b.readyAt - b.startedAt) : null,
        domInteractiveMs: nav ? Math.round(nav.domInteractive) : null,
        version: a.version,
      };
    })()`);

    // Snapshot boot-only requests before opening optional panels.
    const baseOrigin = new URL(BASE).origin;
    const isJs = (r) => r.url.startsWith(baseOrigin) && /\.m?js(\?|$)/.test(new URL(r.url).pathname);
    const isCss = (r) => r.url.startsWith(baseOrigin) && /\.css(\?|$)/.test(new URL(r.url).pathname);
    const bootRecs = [...requests.values()].map((r) => ({ ...r }));
    const bootJs = bootRecs.filter(isJs);
    const bootCss = bootRecs.filter(isCss);

    // Dismiss fresh-profile trailer if open and measure time to interactive menu.
    const menuT0 = performance.now();
    const menuView = await evaluate(`(() => {
      const a = window.__ashen;
      if (a.menuView === 'trailer') {
        document.getElementById('btn-trailer-close')?.click();
      }
      return a.menuView;
    })()`);
    const menuAfterTrailerMs = performance.now() - menuT0;

    // Measure first click into Update Log.
    const updT0 = performance.now();
    await evaluate(`document.getElementById('btn-updates')?.click()`);
    let updatesReady = false;
    for (let i = 0; i < 120; i += 1) {
      updatesReady = await evaluate(`document.querySelectorAll('#update-log .update-entry').length > 0`);
      if (updatesReady) break;
      await sleep(25);
    }
    const updateOpenMs = performance.now() - updT0;
    await evaluate(`document.getElementById('btn-updates-back')?.click()`);
    await sleep(50);

    // Measure first click into Peta Sumpah (Map Editor).
    const edT0 = performance.now();
    await evaluate(`document.getElementById('btn-editor-menu')?.click()`);
    let editorReady = false;
    for (let i = 0; i < 120; i += 1) {
      editorReady = await evaluate(`document.querySelectorAll('#editor-list li').length > 0 && document.querySelectorAll('[data-editor-field]').length >= 13`);
      if (editorReady) break;
      await sleep(25);
    }
    const editorOpenMs = performance.now() - edT0;

    // Verify Back -> menu and re-entering Peta Sumpah + stale switch guard on Update Log.
    await evaluate(`window.__ashen.showMenu()`);
    await sleep(50);
    await evaluate(`document.getElementById('btn-editor-menu')?.click()`);
    await sleep(80);
    const editorReopenOk = await evaluate(`document.querySelectorAll('#editor-list li').length > 0 && window.__ashen.menuView === 'editor'`);
    await evaluate(`window.__ashen.showMenu()`);
    await sleep(30);
    await evaluate(`(() => { window.__ashen.showUpdates(); window.__ashen.showMenu(); })()`);
    await sleep(150);
    const staleGuardOk = await evaluate(`window.__ashen.menuView === 'title'`);

    const sumRaw = (list) => list.reduce((acc, r) => acc + localRawSize(r.url), 0);
    const sumTransfer = (list) => list.reduce((acc, r) => acc + (r.transferBytes || 0), 0);

    return {
      browser: verInfo.Browser || 'Chrome',
      version: bootTiming.version,
      bootWallMs: Math.round(bootWallMs * 10) / 10,
      bootDeltaMs: bootTiming.bootDeltaMs,
      domInteractiveMs: bootTiming.domInteractiveMs,
      menuViewInitial: bootTiming.menuView,
      menuViewAfterTrailer: menuView,
      menuAfterTrailerMs: Math.round(menuAfterTrailerMs * 10) / 10,
      updateOpenMs: Math.round(updateOpenMs * 10) / 10,
      updatesReady,
      editorOpenMs: Math.round(editorOpenMs * 10) / 10,
      editorReady,
      editorReopenOk,
      staleGuardOk,
      bootJsModules: bootJs.length,
      bootJsRawBytes: sumRaw(bootJs),
      bootJsTransferBytes: sumTransfer(bootJs),
      bootCssCount: bootCss.length,
      bootCssRawBytes: sumRaw(bootCss),
      bootCssTransferBytes: sumTransfer(bootCss),
      updatesLoadedAtBoot: bootJs.some((r) => /\/src\/updates\.js$/.test(new URL(r.url).pathname)),
      mapeditorLoadedAtBoot: bootJs.some((r) => /\/src\/mapeditor(_ui)?\.js$/.test(new URL(r.url).pathname)),
      mapeditorCssAtBoot: bootCss.some((r) => /\/styles-mapeditor\.css$/.test(new URL(r.url).pathname)),
      http404s,
    };
  } finally {
    try { ws?.close(); } catch { /* ignore */ }
    chrome?.kill();
    await sleep(150);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

async function main() {
  try {
    const head = await fetch(BASE, { method: 'HEAD' });
    if (!head.ok) throw new Error(`HTTP ${head.status}`);
  } catch (err) {
    console.error(`[SERVER] Cannot reach ${BASE}: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  const chromePath = findBrowser();
  if (!chromePath) {
    console.error('[BROWSER_LAUNCH] No Chrome or Edge binary found. Set CHROME_PATH.');
    process.exitCode = 1;
    return;
  }

  const results = [];
  for (let i = 0; i < RUNS; i += 1) {
    results.push(await runSingleBoot(chromePath, i));
  }
  const boots = results.map((r) => r.bootWallMs).sort((a, b) => a - b);
  const updTimes = results.map((r) => r.updateOpenMs).sort((a, b) => a - b);
  const edTimes = results.map((r) => r.editorOpenMs).sort((a, b) => a - b);

  const summary = {
    url: BASE,
    runs: RUNS,
    browser: results[0].browser,
    version: results[0].version,
    bootJsModules: results[0].bootJsModules,
    bootJsRawBytes: results[0].bootJsRawBytes,
    bootJsTransferBytes: results[0].bootJsTransferBytes,
    bootCssCount: results[0].bootCssCount,
    bootCssRawBytes: results[0].bootCssRawBytes,
    bootCssTransferBytes: results[0].bootCssTransferBytes,
    updatesLoadedAtBoot: results[0].updatesLoadedAtBoot,
    mapeditorLoadedAtBoot: results[0].mapeditorLoadedAtBoot,
    mapeditorCssAtBoot: results[0].mapeditorCssAtBoot,
    bootWallMs: { p50: percentile(boots, 50), p95: percentile(boots, 95), all: boots },
    updateOpenMs: { p50: percentile(updTimes, 50), p95: percentile(updTimes, 95), all: updTimes },
    editorOpenMs: { p50: percentile(edTimes, 50), p95: percentile(edTimes, 95), all: edTimes },
    updatesReady: results.every((r) => r.updatesReady),
    editorReady: results.every((r) => r.editorReady),
    editorReopenOk: results.every((r) => r.editorReopenOk),
    staleGuardOk: results.every((r) => r.staleGuardOk),
    http404Count: results.reduce((acc, r) => acc + r.http404s.length, 0),
    http404s: [...new Set(results.flatMap((r) => r.http404s))],
  };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
