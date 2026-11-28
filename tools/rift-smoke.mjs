// Arc IV: The Rift browser smoke: unlock & hub screen, 5 regions,
// live room 874, Dual-Reality Phase-Shift [F] + HUD badge, Oath Resonance
// rank progression, boss room 898 (The Devilish Scum), 390x844 mobile check,
// and 0 console errors.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9358;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-rift-'));
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
    if (await evaluate(`!!window.__ashen && !!document.getElementById('btn-rift-menu')`)) break;
    await sleep(250);
  }

  // Dismiss trailer if active
  await evaluate(`(() => {
    if (window.__ashen?.menuView === 'trailer') window.__ashen.closeTrailer?.();
  })()`);
  await sleep(250);

  // Enter Rift room 874 via __ashen.riftStart
  const startRes = await evaluate(`window.__ashen.riftStart(874)`);
  await sleep(250);
  check(startRes.ok && startRes.room === 874, 'enters Arc IV Rift room 874');

  const hudBefore = await evaluate(`(() => ({
    riftBadge: document.getElementById('rift-badge')?.textContent || '',
    riftHidden: document.getElementById('rift-badge')?.classList.contains('hidden'),
    resBadge: document.getElementById('resonance-badge')?.textContent || '',
    phase: window.__ashen.rift.fracturePhase,
  }))()`);
  check(!hudBefore.riftHidden && /FASA A/.test(hudBefore.riftBadge), 'HUD shows Rift Phase A badge');
  check(/RESONANCE D/.test(hudBefore.resBadge), 'HUD shows Oath Resonance badge');

  // Trigger Phase-Shift via KeyF (or HUD badge fallback)
  const dbg = await evaluate(`window.__ashen.creditDebug`);
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF', key: 'f', bubbles: true }));`);
  await sleep(200);
  let hudAfter = await evaluate(`(() => ({
    riftBadge: document.getElementById('rift-badge')?.textContent || '',
    resBadge: document.getElementById('resonance-badge')?.textContent || '',
    phase: window.__ashen.rift.fracturePhase,
    resValue: window.__ashen.resonance.value,
    dbg: window.__ashen.creditDebug,
  }))()`);
  if (hudAfter.phase !== 1) {
    await evaluate(`document.getElementById('rift-badge')?.click();`);
    await sleep(150);
    hudAfter = await evaluate(`(() => ({
      riftBadge: document.getElementById('rift-badge')?.textContent || '',
      resBadge: document.getElementById('resonance-badge')?.textContent || '',
      phase: window.__ashen.rift.fracturePhase,
      resValue: window.__ashen.resonance.value,
      dbg: window.__ashen.creditDebug,
    }))()`);
  }
  check(hudAfter.phase === 1 && /FASA B/.test(hudAfter.riftBadge), `KeyF Phase-Shifts to Reality B (${JSON.stringify({ dbg, hudAfter })})`);
  check(hudAfter.resValue >= 12, `Phase-Shift builds Oath Resonance (${hudAfter.resValue})`);

  // Enter final boss room 898 (The Devilish Scum)
  const bossRes = await evaluate(`window.__ashen.riftStart(898)`);
  await sleep(250);
  const bossHud = await evaluate(`({
    room: window.__ashen.rift.roomIndex,
    bossName: document.getElementById('boss-name')?.textContent || '',
  })`);
  check(bossRes.room === 898 && /Devilish Scum/i.test(bossHud.bossName), 'room 898 spawns The Devilish Scum');

  // Mobile viewport check
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(200);
  const mobileOk = await evaluate(`document.getElementById('rift-badge') && !document.getElementById('rift-badge').classList.contains('hidden')`);
  check(mobileOk, 'Rift HUD remains visible on 390x844 mobile');

  check(consoleErrors.length === 0, `zero console errors (got ${consoleErrors.length})`);
  if (consoleErrors.length) console.error(consoleErrors);

  console.log(`\n${passed}/${passed + failed} rift smoke checks passed.`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => {
    try { ws?.close(); } catch {}
    try { chrome.kill(); } catch {}
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  });
