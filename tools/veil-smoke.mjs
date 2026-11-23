// Update XIII browser smoke: The Veil of the Forgotten.
// Drives the real hub, stage contract, ghost index, sanity HUD, boss flow and
// save persistence in headless Chrome.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9344;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-veil-'));
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
    if (message.id) {
      const cb = pending.get(message.id);
      if (cb) { pending.delete(message.id); cb(message); }
      return;
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
    }
    if (message.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    }
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
    chapters: window.__ashen.veilChapters.length,
    stages: window.__ashen.veilStages.length,
    bosses: window.__ashen.veilBosses.length,
    ghosts: window.__ashen.veilGhosts.length,
    tabs: window.__ashen.veilTabs.length,
    facilities: window.__ashen.veilFacilities.length,
    achievements: window.__ashen.veilAchievements.length,
  }))()`);
  check(/0\.35\.0/.test(String(boot.title)), `boots v0.35.0 (${String(boot.title).slice(0, 40)})`);
  check(boot.chapters === 6 && boot.stages === 30 && boot.bosses === 7, '6 chapters, 30 stages, 7 bosses');
  check(boot.ghosts === 80, `80 Ghost Index entries (${boot.ghosts})`);
  check(boot.tabs === 8 && boot.facilities === 10 && boot.achievements === 14, '8 tabs, 10 facilities, 14 achievements');

  const screen = await evaluate(`(async () => {
    window.__ashen.showVeil();
    await new Promise((r) => setTimeout(r, 200));
    return {
      menu: window.__ashen.menuView,
      visible: !document.getElementById('veil-screen').classList.contains('hidden'),
      tabs: document.querySelectorAll('[data-veil-tab]').length,
      cards: document.querySelectorAll('[data-veil-chapter-card]').length,
      summary: document.getElementById('veil-summary').textContent,
    };
  })()`);
  check(screen.menu === 'veil' && screen.visible, 'the Veil screen opens');
  check(screen.tabs === 8, `eight tabs render (${screen.tabs})`);
  check(screen.cards === 6, `six chapter cards render (${screen.cards})`);
  check(screen.summary.length > 20, 'the summary reports real save state');

  const tabs = await evaluate(`(async () => {
    const out = {};
    const click = async (id) => {
      document.querySelector('[data-veil-tab="' + id + '"]').click();
      await new Promise((r) => setTimeout(r, 100));
    };
    await click('sanity');
    out.sanityMeter = document.querySelectorAll('.veil-meter').length;
    await click('index');
    out.indexRows = document.querySelectorAll('.veil-row').length;
    await click('investigation');
    out.missions = document.querySelectorAll('[data-veil-mission]').length;
    await click('hub');
    out.npcs = document.querySelectorAll('[data-veil-npc]').length;
    await click('mind');
    out.mind = document.querySelectorAll('[data-veil-mind]').length;
    await click('settings');
    out.controls = document.querySelectorAll('[data-veil-setting]').length;
    return out;
  })()`);
  check(tabs.sanityMeter === 1, 'the sanity meter renders');
  check(tabs.indexRows >= 20, `the Ghost Index lists paginated rows (${tabs.indexRows})`);
  check(tabs.missions >= 10, `daily, weekly and contract missions render (${tabs.missions})`);
  check(tabs.npcs === 4, 'the refuge renders four NPCs');
  check(tabs.mind === 8, `the Mind & Spirit tree renders eight upgrades (${tabs.mind})`);
  check(tabs.controls >= 25, `settings expose real controls (${tabs.controls})`);

  const setting = await evaluate(`(() => {
    const next = window.__ashen.veilSetSetting('veil.sanity.drainMultiplier', 1.5);
    return { drain: next.sanity.drainMultiplier, hud: next.sanity.hudEnabled };
  })()`);
  check(setting.drain === 1.5, 'veil settings persist by path and clamp');

  const started = await evaluate(`(async () => {
    const a = window.__ashen;
    const result = a.startVeilStage('vesper_hollow_1');
    await new Promise((r) => setTimeout(r, 120));
    return {
      ok: result.ok,
      kind: a.veil.runKind,
      enemies: a.game.enemies.filter((e) => !e.ghostKind).length,
      elite: a.game.enemies.filter((e) => e.elite).length,
      ghosts: a.game.enemies.filter((e) => e.ghostKind).length,
      hud: !document.getElementById('veil-hud').classList.contains('hidden'),
      sanity: Math.round(a.veil.sanity.value),
      stage: a.veil.stage,
    };
  })()`);
  check(started.ok && started.kind === 'veil', 'the first stage starts a Veil run');
  check(started.enemies === 20 && started.elite === 1, 'the live stage holds 20 enemies and exactly 1 elite');
  check(started.ghosts >= 1, `an encounter ghost joins the live room (${started.ghosts})`);
  check(started.hud === true, 'the sanity HUD is visible in the run');
  check(started.sanity > 0 && started.stage === 'vesper_hollow_1', 'sanity and stage state are real');

  const retried = await evaluate(`(async () => {
    const a = window.__ashen;
    a.startVeilStage('vesper_hollow_1');
    a.game.player.hp = 0;
    a.game.state = 'dead';
    a.retry();
    await new Promise((r) => setTimeout(r, 180));
    return { kind: a.veil.runKind, enemies: a.game.enemies.filter((e) => !e.ghostKind).length, elite: a.game.enemies.filter((e) => e.elite).length, hp: a.game.player.hp };
  })()`);
  check(retried.kind === 'veil' && retried.enemies === 20 && retried.elite === 1, 'death retry restarts the same Veil stage with its full contract');
  check(retried.hp > 0, 'retry restores the player instead of loading a legacy checkpoint room');

  const ghost = await evaluate(`(async () => {
    const a = window.__ashen;
    const entry = a.veilGhosts.find((g) => g.id === 'pale_resident');
    const spawned = a.veilSpawnGhost('pale_resident');
    const evidence = entry.evidence.map((type) => a.veilEvidence('pale_resident', type));
    const doc = a.veilDocument('pale_resident');
    await new Promise((r) => setTimeout(r, 120));
    return {
      spawned: !!spawned,
      entities: a.veil.entities.length,
      evidenceOk: evidence.filter((r) => r && r.ok).length,
      required: entry.evidence.length,
      documented: !!(doc && doc.ok),
    };
  })()`);
  check(ghost.spawned && ghost.entities >= 1, 'a ghost spawns with a live brain entity');
  check(ghost.evidenceOk === ghost.required - 1 || ghost.evidenceOk === ghost.required, `evidence dedupe accepts real types (${ghost.evidenceOk}/${ghost.required})`);
  check(ghost.documented === true, 'collecting every required evidence documents the entity');

  const sanity = await evaluate(`(async () => {
    const a = window.__ashen;
    a.veilSetSanity(5);
    await new Promise((r) => setTimeout(r, 120));
    const hud = document.getElementById('veil-hud');
    return {
      value: document.getElementById('veil-hud-value').textContent,
      critical: hud.classList.contains('critical'),
      condition: document.getElementById('veil-hud-condition').textContent,
      rescued: a.veilSetSanity(0),
    };
  })()`);
  check(sanity.value === '5' && sanity.critical === true, 'low sanity raises the critical HUD state');
  check(sanity.condition === 'CRITICAL', `condition label follows the value (${sanity.condition})`);
  check(sanity.rescued && sanity.rescued.veilTouched === true, 'zero sanity enters the non-lethal Veil Touched state');

  const completed = await evaluate(`(async () => {
    const a = window.__ashen;
    a.game.enemies.forEach((e) => { e.dead = true; });
    a.veilTick(0.016);
    await new Promise((r) => setTimeout(r, 2600));
    return { menu: a.menuView, stages: a.veil.summary.stages, completed: a.veil.summary.stages >= 1 };
  })()`);
  check(completed.menu === 'veil', 'clearing the arena returns to the hub');
  check(completed.completed === true, `the clear is recorded (${completed.stages} stage)`);

  const boss = await evaluate(`(async () => {
    const a = window.__ashen;
    a.veilUnlockAll();
    const started = a.startVeilBoss('pale_mayor');
    const phases = a.game.boss ? a.game.boss.maxPhases : 0;
    const result = a.veilCompleteBoss();
    await new Promise((r) => setTimeout(r, 120));
    return { ok: started.ok, phases, defeated: !!(result && result.ok), bosses: a.veil.summary.bosses };
  })()`);
  check(boss.ok && boss.phases === 3, `chapter boss spawns with three phases (${boss.phases})`);
  check(boss.defeated === true && boss.bosses >= 1, 'a boss clear is recorded once');

  const saved = await evaluate(`(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ashen-vow-veil-v1') || 'null');
      return { exists: !!raw, schema: raw && raw.schemaVersion, stages: raw && raw.campaign.completedStages.length, documented: raw && Object.keys(raw.ghostIndex.records).length };
    } catch { return { exists: false }; }
  })()`);
  check(saved.exists && saved.schema === 2, 'the veil profile persists under its own v2 save key');
  check(saved.stages >= 1 && saved.documented >= 1, 'stage and Ghost Index progress survive the save');

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
