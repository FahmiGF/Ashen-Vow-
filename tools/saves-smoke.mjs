// Save-slot smoke (headless Chrome + CDP), Phase 1 v0.38.0: legacy
// migration into slot 1, three profiles, export/import with checksum,
// guarded delete with undo, debounced writes and reload persistence.
// Usage: npm start && node tools/saves-smoke.mjs   (Env: ASHEN_URL, CDP_PORT)

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9283;
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

  let passed = 0; let failed = 0;
  const check = (ok, label) => { if (ok) { passed += 1; console.log(`  ✓ ${label}`); } else { failed += 1; console.log(`  ✗ ${label}`); } };
  const ready = async () => {
    for (let i = 0; i < 150; i += 1) {
      await sleep(100);
      try { if (await evaluate("typeof window.__ashen === 'object' && performance.getEntriesByName('ashen-boot-ready').length > 0")) return; } catch { /* navigating */ }
    }
    throw new Error('boot timed out');
  };
  const reload = async () => { await send('Page.reload'); await sleep(300); await ready(); };
  await ready();
  const fresh = await evaluate('window.__ashen.saves');
  check(fresh.active === 1 && fresh.count === 3, `boots on profile 1 of 3 (${fresh.active}/${fresh.count})`);

  // A v0.36 save lives only under the legacy key: it must land in slot 1.
  await evaluate(`(() => {
    window.__ashen.flushSaves();
    for (const k of Object.keys(localStorage)) if (k.startsWith('ashen-vow-slot') || k === 'ashen-vow-active-slot-v1') localStorage.removeItem(k);
    localStorage.setItem('ashen-vow-progress-v1', JSON.stringify({ version: 1, unlocked: 4, cleared: [true, true, true] }));
    localStorage.setItem('ashen-vow-character-v1', JSON.stringify({ characterId: 'lyna', race: 'elf' }));
    window.onpagehide = null;
    return true;
  })()`);
  // Navigate without running the page's pagehide flush (which would rewrite slot 1).
  await send('Page.navigate', { url: 'about:blank' });
  await sleep(300);
  await send('Page.navigate', { url: URL });
  await ready();
  const migrated = await evaluate(`({ s: window.__ashen.saves, cleared: window.__ashen.progress.cleared.filter(Boolean).length, slot1: !!localStorage.getItem('ashen-vow-slot1-progress-v1'), legacy: !!localStorage.getItem('ashen-vow-progress-v1') })`);
  check(migrated.slot1 && migrated.cleared === 3, `legacy progress migrates into slot 1 (${migrated.cleared} rooms)`);
  check(migrated.legacy, 'the legacy key is kept for one release');
  check(migrated.s.slots[0].characterId === 'lyna' && migrated.s.slots[1].empty && migrated.s.slots[2].empty, 'slot cards: profile 1 holds Lyna, 2 and 3 are empty');

  const screen = await evaluate(`(async () => { await window.__ashen.showSlots(); return { view: window.__ashen.menuView, cards: document.querySelectorAll('.slot-card').length, visible: !document.getElementById('slots-screen').classList.contains('hidden') }; })()`);
  check(screen.view === 'slots' && screen.cards === 3 && screen.visible, 'the profile screen shows three cards');

  await evaluate('(async () => { window.__ashen.flushSaves(); await new Promise((r) => setTimeout(r, 2100)); return 1; })()');
  const burst = await evaluate(`(async () => {
    const A = window.__ashen; const before = A.saves.writes;
    for (let i = 0; i < 25; i += 1) A.saveProgress();
    const during = A.saves.writes - before;
    const pending = A.saves.pending;
    A.flushSaves();
    return { during, pending, after: A.saves.writes - before };
  })()`);
  check(burst.during <= 1 && burst.pending >= 1, `25 saves in a burst hit storage ${burst.during} time(s), the rest wait (pending ${burst.pending})`);
  check(burst.after <= 2, `flush lands the burst (${burst.after} writes total)`);

  const exported = await evaluate(`(async () => {
    const A = window.__ashen; await A.showSlots();
    const text = await A.exportSlot(1);
    const bad = JSON.parse(text); bad.areas.progress = JSON.stringify({ cleared: Array(14).fill(true) });
    const tampered = await A.importSlot(3, JSON.stringify(bad));
    const ok = await A.importSlot(2, text);
    return { format: JSON.parse(text).format, tampered: tampered.error, ok: ok.ok, slot2: A.saves.slots[1].cleared };
  })()`);
  check(exported.format === 'ashen-vow-save', 'export writes a versioned ashen-vow-save document');
  check(exported.tampered === 'checksum', 'an edited export is rejected by its checksum');
  check(exported.ok && exported.slot2 === 3, `import copies profile 1 into profile 2 (${exported.slot2} rooms)`);

  await evaluate('window.__ashen.switchSlot(2, { reload: false })');
  await reload();
  const second = await evaluate(`({ active: window.__ashen.saves.active, cleared: window.__ashen.progress.cleared.filter(Boolean).length })`);
  check(second.active === 2 && second.cleared === 3, `switching to profile 2 loads its own save (${second.cleared} rooms)`);
  await evaluate('(() => { window.__ashen.clearProgress(); window.__ashen.flushSaves(); return 1; })()');
  const isolated = await evaluate(`({ s1: JSON.parse(localStorage.getItem('ashen-vow-slot1-progress-v1')).cleared.filter(Boolean).length, s2: JSON.parse(localStorage.getItem('ashen-vow-slot2-progress-v1')).cleared.filter(Boolean).length, legacy: JSON.parse(localStorage.getItem('ashen-vow-progress-v1')).cleared.filter(Boolean).length })`);
  check(isolated.s1 === 3 && isolated.s2 === 0, `profiles are isolated (slot 1: ${isolated.s1}, slot 2: ${isolated.s2})`);
  check(isolated.legacy === 3, 'only profile 1 mirrors the legacy key');

  const refused = await evaluate(`(async () => (await window.__ashen.deleteSlot(1, 'profil satu')).error)()`);
  check(refused === 'not-confirmed', 'delete refuses without the typed profile name');
  await evaluate(`(async () => { await window.__ashen.deleteSlot(1, 'PROFIL 1'); return 1; })()`);
  const gone = await evaluate('window.__ashen.saves.slots[0].empty');
  check(gone, 'typing PROFIL 1 deletes profile 1');
  const undo = await evaluate(`(async () => (await window.__ashen.undoDeleteSlot()).ok)()`);
  const back = await evaluate('window.__ashen.saves.slots[0].cleared');
  check(undo && back === 3, 'undo restores the deleted profile from its 24 h backup');

  await evaluate('window.__ashen.switchSlot(1, { reload: false })');
  await reload();
  const final = await evaluate(`({ active: window.__ashen.saves.active, cleared: window.__ashen.progress.cleared.filter(Boolean).length })`);
  check(final.active === 1 && final.cleared === 3, 'profile 1 survives the round trip and a reload');
  check(errors.length === 0, `no console errors (${errors.length}) ${errors.slice(0, 2).join(' | ')}`);
  console.log(`\nSaves smoke: ${passed} passed, ${failed} failed`);
  process.exitCode = failed ? 1 : 0;
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
  await sleep(300);
  try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* windows lock */ }
}
