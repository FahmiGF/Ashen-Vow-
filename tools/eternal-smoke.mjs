// Update XIV browser smoke: The Eternal Night (Arc X).
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9345;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-eternal-'));
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
    chapters: window.__ashen.eternalChapters.length,
    stages: window.__ashen.eternalStages.length,
    bosses: window.__ashen.eternalBosses.length,
    ghosts: window.__ashen.veilGhosts.length,
    classifications: window.__ashen.veilGhosts ? 12 : 0,
    hunts: window.__ashen.eternalHuntVariants.length,
    equipment: window.__ashen.eternalEquipment.length,
    events: window.__ashen.eternalWorldEvents.length,
    milestones: window.__ashen.eternalRankMilestones.length,
  }))()`);
  check(/0\.31\.0/.test(String(boot.title)), `boots v0.31.0 (${String(boot.title).slice(0, 40)})`);
  check(boot.chapters === 8 && boot.stages === 40 && boot.bosses === 9, `8 chapters, 40 stages, 9 bosses (${boot.chapters}/${boot.stages}/${boot.bosses})`);
  check(boot.ghosts === 80, `80 Ghost Index entries (${boot.ghosts})`);
  check(boot.hunts === 7 && boot.equipment === 12 && boot.events === 11 && boot.milestones === 10, '7 hunts, 12 equipment, 11 events, 10 rank milestones');

  const screen = await evaluate(`(async () => {
    window.__ashen.openEternal();
    await new Promise((r) => setTimeout(r, 200));
    const tabs = document.querySelectorAll('#eternal-tabs [data-eternal-tab]').length;
    const locked = !!document.querySelector('[data-eternal-action="unlock"]');
    window.__ashen.eternalUnlockAll();
    document.querySelector('#eternal-tabs [data-eternal-tab="campaign"]').click();
    await new Promise((r) => setTimeout(r, 150));
    return {
      menu: window.__ashen.menuView,
      visible: !document.getElementById('eternal-screen').classList.contains('hidden'),
      tabs,
      locked,
      stages: document.querySelectorAll('[data-eternal-stage]').length,
      bosses: document.querySelectorAll('[data-eternal-boss]').length,
    };
  })()`);
  check(screen.menu === 'eternal' && screen.visible, 'the Eternal Night screen opens');
  check(screen.tabs === 11, `eleven tabs render (${screen.tabs})`);
  check(screen.locked === true, 'the campaign is locked before Arc X is unlocked');
  check(screen.stages === 40 && screen.bosses === 9, `the campaign renders 40 stages and 9 boss buttons (${screen.stages}/${screen.bosses})`);

  const setting = await evaluate(`(() => {
    const next = window.__ashen.eternalSetSetting('eternal.sanity.exposureGain', 1.4);
    return { gain: next['sanity.exposureGain'] };
  })()`);
  check(setting.gain === 1.4, 'Arc X settings persist by path');

  const started = await evaluate(`(async () => {
    const a = window.__ashen;
    const result = a.startEternalStage('midnight_city_1');
    await new Promise((r) => setTimeout(r, 150));
    return {
      ok: result.ok,
      kind: a.eternal.runKind,
      enemies: a.game.enemies.filter((e) => !e.ghostKind).length,
      elite: a.game.enemies.filter((e) => e.elite).length,
      ghosts: a.game.enemies.filter((e) => e.ghostKind).length,
      hud: !document.getElementById('veil-hud').classList.contains('hidden'),
      exposure: !!document.getElementById('veil-hud-exposure'),
      focus: document.getElementById('veil-hud-focus').textContent,
    };
  })()`);
  check(started.ok && started.kind === 'eternal', `an Arc X stage starts a real run (${started.kind})`);
  check(started.enemies === 20 && started.elite === 1, `the live stage holds 20 enemies and 1 elite (${started.enemies}/${started.elite})`);
  check(started.ghosts >= 1 && started.hud && started.exposure, `the shared sanity HUD and a research ghost are live (ghosts ${started.ghosts}, hud ${started.hud}, exposure ${started.exposure})`);
  check(Number(started.focus) > 0, `Mental Focus renders in the HUD (${started.focus})`);

  const retried = await evaluate(`(async () => {
    const a = window.__ashen;
    a.game.player.hp = 0;
    a.game.state = 'dead';
    a.retry();
    await new Promise((r) => setTimeout(r, 180));
    return { kind: a.eternal.runKind, enemies: a.game.enemies.filter((e) => !e.ghostKind).length, hp: a.game.player.hp };
  })()`);
  check(retried.kind === 'eternal' && retried.enemies === 20 && retried.hp > 0, `death retry restarts the same Arc X stage (${retried.kind}, ${retried.enemies}, hp ${retried.hp})`);

  const sanity = await evaluate(`(() => {
    const a = window.__ashen;
    a.eternalSetExposure(55);
    a.eternalSetFocus(40);
    const snap = a.veil.sanity;
    return { exposure: snap.exposure, focus: snap.focus, sanity: Math.round(snap.value), label: snap.focusLabel };
  })()`);
  check(sanity.exposure === 55 && sanity.focus === 40, 'Sanity, Exposure and Focus are independent values');
  check(sanity.sanity > 0 && sanity.label, 'Sanity remains valid in the live run');

  const generated = await evaluate(`(() => {
    const a = window.__ashen;
    const result = a.eternalGenerateCase('smoke-seed', { difficulty: 'hard' });
    const mission = result.mission;
    const completed = a.eternalCompleteCase(mission.id, 99);
    return { ok: result.ok, valid: !!mission.stage && mission.ghostPool.length > 0, evidence: mission.evidenceGoal, completed: completed.ok, duplicate: a.eternalCompleteCase(mission.id, 99).reason };
  })()`);
  check(generated.ok && generated.valid, 'a procedural case is generated with a real location and entity');
  check(generated.completed === true && generated.duplicate === 'duplicate', 'a generated case completes once with dedupe');

  const hunt = await evaluate(`(async () => {
    const a = window.__ashen;
    const result = a.startEternalHunt({ variant: 'advanced', chapter: 'midnight_city' });
    a.game.enemies.forEach((e) => { e.dead = true; });
    a.eternalTick(0.016);
    await new Promise((r) => setTimeout(r, 2100));
    return { ok: result.ok, menu: a.menuView, hunts: a.eternal.summary.hunts, history: a.eternal.summary.hunts >= 1 };
  })()`);
  check(hunt.ok === true, 'Spectral Pursuit starts');
  check(hunt.menu === 'eternal' && hunt.history, `a completed hunt returns to the hub and records history (${hunt.hunts})`);

  const workshop = await evaluate(`(() => {
    const a = window.__ashen;
    const grant = a.eternalGrant('spiritShards', 5000);
    const upgraded = a.eternalUpgrade('portable_lantern');
    return { granted: grant.ok, ok: upgraded.ok, tier: upgraded.tier };
  })()`);
  check(workshop.ok && workshop.tier === 2, `workshop upgrade reaches Tier II (${workshop.tier})`);

  const events = await evaluate(`(() => {
    const a = window.__ashen;
    const activated = a.eternalEvent('midnight_disturbance');
    a.eternalEventStep(0); a.eternalEventStep(1); a.eternalEventStep(2);
    const complete = a.eternalEventComplete();
    return { activated: activated.ok, complete: complete.ok, journal: a.eternal.dashboard.missions.journal.includes('midnight_disturbance') };
  })()`);
  check(events.activated && events.complete && events.journal, 'world event completes and enters the journal');

  const coop = await evaluate(`(() => {
    const a = window.__ashen;
    const session = a.eternalCreateExpedition({ seed: 'smoke-coop' });
    const joined = a.eternalJoinExpedition(session.id, 'guest', 'archivist');
    const task = a.eternalCoopTask(session.id, 'mechanisms');
    const complete = a.eternalCoopComplete(session.id);
    return { joined: joined.ok, task: task.ok, complete: complete.ok, again: a.eternalCoopComplete(session.id).ok };
  })()`);
  check(coop.joined && coop.task && coop.complete, 'two investigators complete a coordinated task and expedition');
  check(coop.again === false, 'expedition rewards cannot be granted twice');

  const boss = await evaluate(`(async () => {
    const a = window.__ashen;
    const started = a.startEternalBoss('first_forgotten');
    const phases = a.game.boss ? a.game.boss.maxPhases : 0;
    const defeated = a.eternalCompleteBoss();
    await new Promise((r) => setTimeout(r, 150));
    return { ok: started.ok, phases, defeated: !!(defeated && defeated.ok) };
  })()`);
  check(boss.ok && boss.phases === 5, `the final boss spawns with five phases (${boss.phases})`);
  check(boss.defeated === true, 'the final Arc X boss clear is recorded');

  const saved = await evaluate(`(() => {
    const eternal = JSON.parse(localStorage.getItem('ashen-vow-eternal-v1') || 'null');
    const veil = JSON.parse(localStorage.getItem('ashen-vow-veil-v1') || 'null');
    const settings = JSON.parse(localStorage.getItem('ashen-vow-settings-v1') || 'null');
    return {
      eternal: !!eternal, schema: eternal && eternal.schemaVersion, stages: eternal && eternal.campaign.completedStages.length,
      veil: !!veil, veilSchema: veil && veil.schemaVersion,
      hasEternalSettings: !!(settings && settings.eternal),
      separation: !!(eternal && veil && !Object.hasOwn(eternal, 'ghostIndex')),
    };
  })()`);
  check(saved.eternal && saved.schema === 1, 'Arc X persists under its own v1 save key');
  check(saved.veil && saved.veilSchema === 2, 'the Arc IX save remains intact at schema 2');
  check(saved.separation && saved.hasEternalSettings, 'Arc X never writes Arc IX fields and its settings persist');

  const errors = consoleErrors.filter((line) => !/favicon|ERR_FILE_NOT_FOUND/i.test(String(line)));
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
