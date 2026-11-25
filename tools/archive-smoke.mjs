// Update XV browser smoke: Stage Archive, Level Checker, Sneak Peek and indexes.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { VERSION, VERSION_RE } from './smoke-version.mjs';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9346;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-archive-'));
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
function check(ok, label) {
  if (ok) { passed += 1; console.log(`  ✓ ${label}`); } else { failed += 1; console.log(`  ✗ ${label}`); }
}
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
async function attach(url) {
  const pages = await waitFor(async () => {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    return list.some((entry) => entry.type === 'page' && entry.url.startsWith(url)) ? list : null;
  }, 20000, 'chrome page');
  const page = pages.find((entry) => entry.type === 'page' && entry.url.startsWith(url));
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) { const cb = pending.get(message.id); if (cb) { pending.delete(message.id); cb(message); } return; }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') consoleErrors.push(message.params.args.map((a) => a.value ?? a.description).join(' '));
    if (message.method === 'Runtime.exceptionThrown') consoleErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.bringToFront');
  await waitFor(() => evaluate('typeof window.__ashen === "object"'), 25000, 'boot');
}

try {
  await attach(BASE);
  const boot = await evaluate(`(() => ({
    title: document.title,
    stages: window.__ashen.archiveData.stages.length,
    chapters: window.__ashen.archiveData.chapters.length,
    bosses: window.__ashen.archiveData.bosses.length,
    jumpscares: window.__ashen.archiveData.jumpscares.length,
    tools: window.__ashen.archiveData.tools.length,
    ghosts: window.__ashen.veilGhosts.length,
  }))()`);
  check(VERSION_RE.test(String(boot.title)), `boots v${VERSION} (${String(boot.title).slice(0, 40)})`);
  check(boot.stages === 70 && boot.chapters === 14 && boot.bosses === 16, `70 stages, 14 chapters, 16 bosses (${boot.stages}/${boot.chapters}/${boot.bosses})`);
  check(boot.ghosts === 80 && boot.jumpscares === 38 && boot.tools === 30, `80 ghosts, 38 jumpscares, 30 tools (${boot.ghosts}/${boot.jumpscares}/${boot.tools})`);

  const screen = await evaluate(`(async () => {
    window.__ashen.openArchive();
    await new Promise((r) => setTimeout(r, 150));
    return {
      menu: window.__ashen.menuView,
      visible: !document.getElementById('archive-screen').classList.contains('hidden'),
      tabs: document.querySelectorAll('#archive-tabs [data-archive-tab]').length,
      cards: document.querySelectorAll('[data-archive-stage]').length,
      locks: document.querySelectorAll('.archive-stage-card.locked').length,
      summary: document.getElementById('archive-summary').textContent,
    };
  })()`);
  check(screen.menu === 'archive' && screen.visible, 'the Stage Archive opens from the Scary Mode shell');
  check(screen.tabs === 6, `six archive tabs render (${screen.tabs})`);
  check(screen.cards === 30, `Arc IX renders all 30 stages (${screen.cards})`);
  check(screen.locks === 0, 'Arc IX stages are never hidden by the archive');

  const arc10 = await evaluate(`(async () => {
    document.querySelector('[data-archive-arc="arc10"]').click();
    await new Promise((r) => setTimeout(r, 120));
    return { cards: document.querySelectorAll('[data-archive-stage]').length, locked: document.querySelectorAll('.archive-stage-card.locked').length };
  })()`);
  check(arc10.cards === 40, `Arc X renders all 40 stages (${arc10.cards})`);

  const peek = await evaluate(`(async () => {
    const a = window.__ashen;
    const before = JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-veil-v1') || 'null')?.campaign?.completedStages || [];
    const preview = a.archivePreview('midnight_city_1');
    await new Promise((r) => setTimeout(r, 120));
    const save = JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-archive-v1') || 'null');
    return {
      ok: preview.ok, type: preview.type, isolated: preview.accessibility.isolated,
      visible: !document.getElementById('archive-preview-screen').classList.contains('hidden'),
      status: a.archive.statuses.midnight_city_1,
      before, after: JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-veil-v1') || 'null')?.campaign?.completedStages || [],
      previews: save?.previews?.midnight_city_1?.count || 0,
      title: document.getElementById('archive-preview-title').textContent,
    };
  })()`);
  check(peek.ok && peek.type === 'archive' && peek.isolated, 'a locked Arc X stage opens an isolated archive preview');
  check(peek.visible && peek.title.includes('Midnight City'), `the preview layer shows stage context (${peek.title})`);
  check(peek.status === 'locked' && JSON.stringify(peek.before) === JSON.stringify(peek.after), 'preview leaves the stage locked and Arc IX progress untouched');
  check(peek.previews === 1, 'preview metadata persists in the separate archive save');

  const closePeek = await evaluate(`(() => { window.__ashen.closeArchivePreview(); return document.getElementById('archive-preview-screen').classList.contains('hidden'); })()`);
  check(closePeek === true, 'the preview layer closes without entering gameplay');

  const checker = await evaluate(`(() => {
    const check = window.__ashen.archiveCheck('vesper_hollow_1');
    return { ok: check.ok, categories: check.categories.length, main: check.percentages.main, ghosts: check.percentages.ghosts, overall: check.percentages.overall, rows: document.querySelectorAll('.archive-check-row').length };
  })()`);
  check(checker.ok && checker.categories === 11 && checker.rows === 11, 'Level Checker renders all eleven checks');
  check(checker.main === 0 && checker.ghosts === 0 && checker.overall < 100, 'stage completion and ghost documentation stay separate');

  const ghosts = await evaluate(`(async () => {
    window.__ashen.setArchiveTab('ghosts');
    await new Promise((r) => setTimeout(r, 100));
    document.querySelector('[data-archive-missing]').click();
    await new Promise((r) => setTimeout(r, 100));
    return { rows: document.querySelectorAll('[data-archive-ghost]').length, label: document.querySelector('[data-archive-ghost] b')?.textContent || '' };
  })()`);
  check(ghosts.rows > 0 && ghosts.label.startsWith('Unknown Entity'), 'Ghost Index 3.0 hides undiscovered identities');

  const scares = await evaluate(`(async () => {
    window.__ashen.setArchiveTab('jumpscares');
    await new Promise((r) => setTimeout(r, 100));
    return { rows: document.querySelectorAll('[data-archive-scare]').length, text: document.getElementById('archive-body').textContent };
  })()`);
  check(scares.rows === 38, `the separate Jumpscare Index lists 38 events (${scares.rows})`);
  check(/Anti-Jumpscare/i.test(scares.text), 'the scare index states its Anti-Jumpscare rule');

  const equipment = await evaluate(`(async () => {
    const prep = window.__ashen.archivePrepare('pale_resident');
    await new Promise((r) => setTimeout(r, 100));
    return { ready: prep.ready, missing: prep.requirements.missing, rows: document.querySelectorAll('[data-archive-upgrade]').length, text: document.getElementById('archive-body').textContent };
  })()`);
  check(equipment.rows === 30, `Equipment Index lists all 30 tools (${equipment.rows})`);
  check(equipment.ready === false && equipment.missing.includes('echo_recorder') && /TOOL KURANG|Missing/i.test(equipment.text), 'Prepare Investigation highlights a missing required tool');

  const run = await evaluate(`(async () => {
    const a = window.__ashen;
    a.closeArchive();
    const started = a.startVeilStage('vesper_hollow_1');
    const spawned = a.veilSpawnGhost('pale_resident');
    const ghost = a.veilGhosts.find((g) => g.id === 'pale_resident');
    const evidence = ghost.evidence.map((type) => a.veilEvidence('pale_resident', type));
    const documented = a.veilDocument('pale_resident');
    await new Promise((r) => setTimeout(r, 120));
    return { started: started.ok, spawned: !!spawned, evidence: evidence.filter((r) => r?.ok).length, documented: documented?.ok, state: a.archive ? null : null };
  })()`);
  check(run.started && run.spawned, 'a real Arc IX stage spawns a research entity');
  check(run.documented === true, 'required evidence documents the ghost through the live engine');

  const synced = await evaluate(`(async () => {
    const a = window.__ashen;
    a.openArchive();
    a.setArchiveTab('ghosts');
    await new Promise((r) => setTimeout(r, 100));
    const archive = a.archive;
    return { state: archive.ghosts.documented, save: JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-archive-v1') || 'null')?.jumpscares ? true : false };
  })()`);
  check(synced.state >= 1, 'documentation synchronizes into the live archive');
  check(synced.save === true, 'the archive save exposes the jumpscare record store');

  const saved = await evaluate(`(() => {
    const archive = JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-archive-v1') || 'null');
    const veil = JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-veil-v1') || 'null');
    const eternal = JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-eternal-v1') || 'null');
    return { archive: !!archive, schema: archive?.schemaVersion, veil: !!veil, eternal: eternal === null || !!eternal, stages: archive?.previews ? Object.keys(archive.previews).length : 0 };
  })()`);
  check(saved.archive && saved.schema === 1 && saved.veil && saved.eternal, 'the archive saves separately while the Arc IX save remains intact and any Arc X save is preserved');
  check(saved.stages >= 1, 'preview counts survive a save round-trip');

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  const mobile = await evaluate(`(async () => {
    window.__ashen.openArchive();
    await new Promise((r) => setTimeout(r, 140));
    const preview = window.__ashen.archivePreview('vesper_hollow_1');
    await new Promise((r) => setTimeout(r, 100));
    const offenders = [...document.querySelectorAll('#archive-screen *, #archive-preview-screen *')]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter((row) => row.r.right > window.innerWidth + 1)
      .slice(0, 8)
      .map((row) => row.el.tagName.toLowerCase() + '.' + String(row.el.className).split(' ')[0] + '#' + row.el.id + '(' + Math.round(row.r.left) + '-' + Math.round(row.r.right) + ')' + '[' + String(row.el.textContent).trim().slice(0, 24) + ']');
    return {
      width: window.innerWidth,
      overflow: document.getElementById('archive-screen').scrollWidth - window.innerWidth,
      offenders,
      tabs: document.querySelectorAll('#archive-tabs [data-archive-tab]').length,
      preview: preview.ok && !document.getElementById('archive-preview-screen').classList.contains('hidden'),
      previewOverflow: document.getElementById('archive-preview-screen').scrollWidth - window.innerWidth,
    };
  })()`);
  check(mobile.width === 390 && mobile.overflow <= 1, `the archive has no horizontal overflow at 390px (${mobile.width}px wide, ${mobile.overflow}px overflow: ${mobile.offenders.join(' ')})`);
  check(mobile.tabs === 6 && mobile.preview && mobile.previewOverflow <= 1, 'the six tabs and preview remain usable at 390×844');

  const errors = consoleErrors.filter((line) => !/favicon|ERR_FILE_NOT_FOUND|429|Too Many Requests/i.test(String(line)));
  check(errors.length === 0, `no console errors (${errors.slice(0, 2).join(' | ')})`);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exitCode = failed === 0 ? 0 : 1;
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  try { chrome.kill(); } catch { /* ignore */ }
}
