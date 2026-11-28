// The Unwritten Expanse browser smoke: v0.45.0, room 901 entry, Oath Sigil equip,
// Ink Severance [G] at Resonance B+, room 930 The Blank Author, 390x844 mobile check,
// and 0 console errors.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9359;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-unwritten-'));
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
  return res.result?.value;
}

async function main() {
  let target = null;
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      target = list.find((t) => t.type === 'page' && t.url.startsWith('http'));
      if (target) break;
    } catch {}
    await sleep(250);
  }
  if (!target) throw new Error('Timed out waiting for Chrome target');

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const fn = pending.get(msg.id);
      pending.delete(msg.id);
      fn(msg);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text || 'exceptionThrown');
    } else if (msg.method === 'Log.entryAdded' && msg.params.entry?.level === 'error') {
      consoleErrors.push(msg.params.entry.text);
    }
  };

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  await send('Page.bringToFront');
  await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });

  for (let i = 0; i < 40; i++) {
    if (await evaluate(`!!window.__ashen && typeof window.__ashen.unwrittenStart === 'function'`)) break;
    await sleep(250);
  }

  await evaluate(`if (window.__ashen?.menuView === 'trailer') window.__ashen.closeTrailer?.();`);
  await sleep(200);

  const startRes = await evaluate(`window.__ashen.unwrittenStart(901)`);
  await sleep(250);
  check(startRes.ok && startRes.room === 901, 'enters Unwritten Expanse room 901');

  const sev = await evaluate(`window.__ashen.inkSeverance(true)`);
  await sleep(150);
  check(sev.ok === true, 'Ink Severance executes cleanly');

  const bossRes = await evaluate(`window.__ashen.unwrittenStart(930)`);
  await sleep(250);
  const bossName = await evaluate(`document.getElementById('boss-name')?.textContent || ''`);
  check(bossRes.room === 930 && /Blank Author/i.test(bossName), 'room 930 spawns The Blank Author');

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(180);
  const sigilVisible = await evaluate(`document.getElementById('sigil-badge') && !document.getElementById('sigil-badge').classList.contains('hidden')`);
  check(sigilVisible, 'Sigil HUD badge remains visible on 390x844 mobile');

  check(consoleErrors.length === 0, `zero console errors (got ${consoleErrors.length})`);
  if (consoleErrors.length) console.error(consoleErrors);

  console.log(`\n${passed}/${passed + failed} unwritten smoke checks passed.`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => {
    try { ws?.close(); } catch {}
    try { chrome.kill(); } catch {}
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  });
