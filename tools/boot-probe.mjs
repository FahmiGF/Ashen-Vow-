// Boot probe (headless Chrome + CDP): measures what the browser parses before
// the menu is interactive (performance mark `ashen-boot-ready`).
// Master Plan 3.0 §9.1 budgets: boot JS, render-blocking stylesheets, time to
// menu. Reports every script and stylesheet loaded before boot-ready, then
// opens each lazy mode to prove it loads on demand without console errors.
//
// Usage: npm start && node tools/boot-probe.mjs   (JSON=1 for machine output)
// Env: ASHEN_URL, CHROME_PATH, CDP_PORT (default 9281), BOOT_BUDGET_KB.

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9281;
const BUDGET_KB = Number(process.env.BOOT_BUDGET_KB) || 0;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const local = process.env.LOCALAPPDATA || '';
  const list = process.platform === 'win32'
    ? ['C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      local ? join(local, 'Google/Chrome/Application/chrome.exe') : '',
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium'];
  const found = list.filter(Boolean).find((path) => existsSync(path));
  if (!found) throw new Error('No Chrome/Chromium found. Set CHROME_PATH.');
  return found;
}

const profileDir = mkdtempSync(join(tmpdir(), 'ashen-render-'));
const chrome = spawn(findBrowser(), [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profileDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--mute-audio',
  '--window-size=1280,900',
  URL,
], { stdio: 'ignore' });

let ws;
try {
  assert.equal((await fetch(URL, { method: 'HEAD' })).ok, true, 'game server must be running');
  let page;
  for (let i = 0; i < 120; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      page = list.find((target) => target.type === 'page' && target.url.startsWith(URL));
      if (page) break;
    } catch { /* still starting */ }
    await sleep(150);
  }
  assert.ok(page, 'Chrome page target');

  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    } else if (message.method === 'Runtime.exceptionThrown') {
      errors.push(message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text || 'exception');
    } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      errors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
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
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.bringToFront');
  await sleep(2000);
  for (let i = 0; i < 80; i += 1) {
    if (await evaluate('typeof window.__ashen === "object"')) break;
    await sleep(120);
  }

  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Page.reload', { ignoreCache: true });
  for (let i = 0; i < 200; i += 1) {
    await sleep(100);
    try { if (await evaluate("performance.getEntriesByName('ashen-boot-ready').length > 0")) break; } catch { /* navigating */ }
  }
  const boot = await evaluate(`(() => {
    const ready = performance.getEntriesByName('ashen-boot-ready')[0];
    const readyAt = ready ? ready.startTime : performance.now();
    const res = performance.getEntriesByType('resource').filter((e) => e.startTime <= readyAt);
    const pick = (kind) => res.filter((e) => kind === 'script' ? /\\.m?js(\\?|$)/.test(e.name) : /\\.css(\\?|$)/.test(e.name))
      .map((e) => ({ file: e.name.replace(location.origin + '/', ''), kb: +((e.decodedBodySize || e.encodedBodySize || 0) / 1024).toFixed(1), blocking: e.renderBlockingStatus || '' }));
    const scripts = pick('script').sort((a, b) => b.kb - a.kb);
    const styles = pick('css');
    return {
      readyMs: Math.round(readyAt),
      scriptKb: +scripts.reduce((s, e) => s + e.kb, 0).toFixed(1),
      scriptCount: scripts.length,
      blockingStyles: styles.filter((e) => e.blocking === 'blocking').length,
      styleCount: styles.length,
      scripts,
      styles,
    };
  })()`);
  const bootErrors = errors.splice(0);
  if (!(await evaluate('typeof window.__ashen === "object"'))) {
    console.log('BOOT FAILED', JSON.stringify(bootErrors), await evaluate("document.getElementById('boot-status')?.textContent || ''"));
    process.exit(1);
  }
  const modes = await evaluate(`(async () => {
    const A = window.__ashen;
    const out = [];
    for (const id of A.lazyModes || []) {
      const before = performance.getEntriesByType('resource').length;
      const t0 = performance.now();
      let ok = true; let error = null;
      try { await A.loadMode(id); } catch (e) { ok = false; error = String(e && e.message || e); }
      const added = performance.getEntriesByType('resource').slice(before).filter((e) => /\\.m?js/.test(e.name));
      out.push({ id, ok, error, ms: Math.round(performance.now() - t0), kb: +(added.reduce((s, e) => s + (e.decodedBodySize || 0), 0) / 1024).toFixed(1) });
    }
    return out;
  })()`);
  const report = { ...boot, bootErrors, modes, modeErrors: errors };
  if (process.env.JSON === '1') console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`boot-ready ${boot.readyMs} ms · JS before menu ${boot.scriptKb} KB in ${boot.scriptCount} files · stylesheets ${boot.styleCount} (${boot.blockingStyles} render-blocking)`);
    for (const s of boot.scripts.slice(0, 15)) console.log(`  ${String(s.kb).padStart(7)} KB  ${s.file}`);
    console.log('lazy modes:');
    for (const m of modes) console.log(`  ${m.ok ? '✓' : '✗'} ${m.id.padEnd(12)} ${String(m.kb).padStart(7)} KB  ${m.ms} ms${m.error ? '  ' + m.error : ''}`);
    console.log(`console errors: boot ${bootErrors.length}, modes ${errors.length}`);
    for (const e of [...bootErrors, ...errors].slice(0, 5)) console.log('  ', e.slice(0, 200));
  }
  const failed = bootErrors.length || errors.length || modes.some((m) => !m.ok) || (BUDGET_KB && boot.scriptKb > BUDGET_KB);
  process.exitCode = failed ? 1 : 0;
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
  await sleep(300);
  try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* windows lock */ }
}
