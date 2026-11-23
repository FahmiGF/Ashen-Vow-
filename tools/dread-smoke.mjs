// Update XII browser smoke: The Dread Beyond — environments, Unnatural enemies,
// events, bosses, awareness, modes, journal, settings and persistence, driven
// through the real game in headless Chrome.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9341;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-dread-'));
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
  try { ws?.close(); } catch { /* ignore */ }
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
    version: document.title,
    dread: window.__ashen.dread,
    counts: {
      environments: window.__ashen.dreadEnvironments.length,
      enemies: window.__ashen.dreadEnemies.length,
      bosses: window.__ashen.dreadBosses.length,
      modes: window.__ashen.dreadModes.length,
      equipment: window.__ashen.dreadEquipment.length,
      tabs: window.__ashen.dreadTabs.length,
    },
  }))()`);
  check(/0\.34\.0/.test(String(boot.version)), `boots v0.34.0 (${String(boot.version).slice(0, 44)})`);
  check(boot.dread && boot.dread.settings.enabled === true, 'The Dread Beyond is enabled by default');
  check(boot.dread.settings.awarenessEnabled === false, 'Awareness is opt-in');
  check(boot.counts.environments === 5 && boot.counts.enemies === 7 && boot.counts.bosses === 3, '5 environments, 7 Unnatural, 3 bosses');
  check(boot.counts.modes === 10 && boot.counts.equipment === 10 && boot.counts.tabs === 7, '10 modes, 10 tools, 7 UI tabs');

  const screen = await evaluate(`(async () => {
    const a = window.__ashen;
    a.openDread();
    await new Promise((r) => setTimeout(r, 150));
    const tabs = document.querySelectorAll('[data-dread-tab]').length;
    const cards = document.querySelectorAll('[data-dread-enter]').length;
    const visible = !document.getElementById('dread-screen').classList.contains('hidden');
    return { menu: a.menuView, tabs, cards, visible, summary: document.getElementById('dread-summary').textContent };
  })()`);
  check(screen.menu === 'dread' && screen.visible, 'the Dread Beyond screen opens from Scary Mode');
  check(screen.tabs === 7, `seven Dread tabs render (${screen.tabs})`);
  check(screen.cards === 5, `five environment cards render (${screen.cards})`);
  check(screen.summary.length > 20, 'the summary reports real state');

  const tabs = await evaluate(`(async () => {
    const out = {};
    for (const tab of ['unnatural', 'bosses', 'modes', 'equipment', 'journal']) {
      document.querySelector('[data-dread-tab="' + tab + '"]').click();
      await new Promise((r) => setTimeout(r, 80));
      out[tab] = document.querySelectorAll('.dread-card').length;
    }
    out.categories = document.querySelectorAll('.dread-board-row').length;
    return out;
  })()`);
  check(tabs.unnatural === 7 && tabs.bosses === 3, `enemy and boss panels are real (${tabs.unnatural}/${tabs.bosses})`);
  check(tabs.modes === 10 && tabs.equipment === 10, 'modes and equipment panels are real');
  check(tabs.categories === 10, `journal shows ten categories (${tabs.categories})`);

  const entered = await evaluate(`(async () => {
    const a = window.__ashen;
    a.enterDread('black_manor');
    await new Promise((r) => setTimeout(r, 300));
    const g = a.game;
    return {
      menu: a.menuView,
      started: a.started,
      env: g.dreadEnvironmentId,
      platforms: g.room.platforms.length,
      ceilings: g.room.ceilingSpans.length,
      nav: g.nav.nodes.length,
      enemies: g.enemies.filter((e) => e.unnaturalKind).length,
      tactics: [...new Set(g.enemies.filter((e) => e.unnaturalKind).map((e) => e.unnaturalTactic))],
      label: a.dread.environmentLabel,
    };
  })()`);
  check(entered.menu === 'none' && entered.started === true, 'entering a Dread environment starts a real run');
  check(entered.env === 'black_manor' && entered.platforms >= 4 && entered.ceilings >= 1, 'the 2D arena and ceiling surfaces are loaded');
  check(entered.nav > 0, `the navigation graph is built (${entered.nav} nodes)`);
  check(entered.enemies >= 2 && entered.tactics.length >= 2, `Unnatural enemies patrol the room (${entered.enemies})`);

  const perception = await evaluate(`(() => {
    const a = window.__ashen;
    const g = a.game;
    g.enemies.length = 0;
    g.projectiles.length = 0;
    const visitor = g.spawnUnnatural('faceless_visitor', 400);
    visitor.facing = 1;
    g.player.x = 560;
    g.player.y = 390;
    for (let i = 0; i < 30; i += 1) g.update(1 / 120, {});
    const seen = visitor.aiState;
    g.enemies.length = 0;
    const knight = g.spawnUnnatural('empty_knight', 1000);
    knight.facing = 1;
    g.player.x = 300;
    g.emitNoise('step', 940, { loudness: 1 });
    for (let i = 0; i < 10; i += 1) g.update(1 / 120, {});
    return { seen, heard: knight.aiState, memory: knight.dreadBrain ? knight.dreadBrain.memory.size : 0 };
  })()`);
  check(perception.seen === 'hunt', `sight starts a real hunt (${perception.seen})`);
  check(perception.heard === 'investigate' && perception.memory >= 1, `hearing starts an investigation with memory (${perception.heard})`);

  const ceiling = await evaluate(`(() => {
    const a = window.__ashen;
    const g = a.game;
    g.enemies.length = 0;
    const dweller = g.spawnUnnatural('ceiling_dweller', 600);
    g.player.x = 1380;
    const span = dweller.ceilingSpan;
    for (let i = 0; i < 240; i += 1) g.update(1 / 120, {});
    return { y: dweller.y, ceilingY: dweller.ceilingY, x: dweller.x, span, above: dweller.y < 300 };
  })()`);
  check(ceiling.y === ceiling.ceilingY && ceiling.above, 'the Ceiling Dweller stays on its designated ceiling');
  check(ceiling.x >= ceiling.span.x1 && ceiling.x <= ceiling.span.x2, 'it never leaves the ceiling span');

  const events = await evaluate(`(async () => {
    const a = window.__ashen;
    a.cancelDreadEvent('prep');
    a.dreadTick(0.1);
    const started = a.dreadEvent('the_unanswered_call', { hp: 900, roomCleared: true });
    a.dreadTick(0.2);
    const during = a.dread.events.active.map((e) => e.id);
    a.cancelDreadEvent('smoke');
    const after = a.dread.events.active.length;
    return { started, during, after, cooldown: a.dread.events.cooldowns.the_unanswered_call || 0, count: a.dread.events.seen ? Object.keys(a.dread.events.seen).length : 0 };
  })()`);
  check(events.started && events.started.id === 'the_unanswered_call', 'a psychological event starts with a real phase');
  check(events.during.includes('the_unanswered_call'), 'the event is active during its duration');
  check(events.after === 0 && events.cooldown > 0, 'cancelling closes it and applies a cooldown');

  const boss = await evaluate(`(() => {
    const a = window.__ashen;
    a.startDreadBoss('watcher_beyond');
    const g = a.game;
    const b = g.boss;
    g.player.hp = 9999;
    g.player.maxHp = 9999;
    const info = { phases: b.maxPhases, phase: b.phase, arena: b.arena };
    b.hp = b.maxHp * 0.7;
    b.invuln = 0;
    b.stagger = 0;
    g.hitstop = 0;
    g.damageBoss(1);
    info.afterPhase = b.phase;
    b.x = -500;
    b.intro = 0;
    b.stagger = 0;
    g.hitstop = 0;
    g.update(1 / 120, {});
    info.clampedX = Math.round(b.x);
    info.minX = b.arena.minX;
    info.boss = g.boss ? g.boss.dreadBoss : null;
    return info;
  })()`);
  check(boss.phases === 4 && boss.phase === 1, 'The Watcher Beyond spawns with four phases');
  check(boss.afterPhase === 2, `damage advances the phase (${boss.afterPhase})`);
  check(boss.clampedX >= boss.minX, `arena containment holds (${boss.clampedX} ≥ ${boss.minX})`);

  const bossDown = await evaluate(`(async () => {
    const a = window.__ashen;
    const g = a.game;
    const b = g.boss;
    g.player.hp = 9999;
    g.player.maxHp = 9999;
    b.invuln = 0;
    b.stagger = 0;
    g.hitstop = 0;
    g.damageBoss(b.maxHp * 4);
    // Drive the fixed-step engine directly instead of relying on a background
    // tab's animation-frame cadence; this still exercises the real death and
    // journal path through core and the shell.
    for (let i = 0; i < 400 && g.boss; i += 1) g.update(1 / 120, {});
    a.dreadTick(1 / 120);
    return { boss: g.boss ? g.boss.dreadBoss : null, journalBoss: a.dread.journal.bosses, state: g.state, playerHp: g.player.hp, dying: b.dying, deathTimer: b.deathTimer };
  })()`);
  check(bossDown.boss === null, 'the horror boss fight ends');
  check(bossDown.journalBoss.includes('watcher_beyond'), 'the boss is recorded in the Dread journal');

  const awareness = await evaluate(`(() => {
    const a = window.__ashen;
    a.setAwareness(72);
    const high = a.dread.awareness;
    const grounded = a.groundAwareness();
    return { high: high.value, level: high.level, control: high.effects.controlBlocked, penalty: high.effects.healthPenalty, grounded: grounded.value };
  })()`);
  check(awareness.high === 72 && awareness.level !== 'flat', 'Awareness tracks a real value and level');
  check(awareness.control === false && awareness.penalty === 0, 'Awareness never removes control or penalises health');
  check(awareness.grounded === 0, 'stabilizing always resets the meter');

  const modes = await evaluate(`(() => {
    const a = window.__ashen;
    for (const [id, target] of [['tasks', 3], ['rooms', 5]]) {
      const mode = a.dreadModes.find((entry) => entry.id === 'night_shift');
      const goal = mode.objectives.find((entry) => entry.id === id);
      a.recordDreadObjective('night_shift', id, target - (goal ? 0 : 0));
    }
    a.recordDreadObjective('night_shift', 'tasks', 3);
    a.recordDreadObjective('night_shift', 'rooms', 5);
    const result = a.completeDreadMode('night_shift');
    return { complete: result.complete, ratio: result.ratio, modes: a.dread.journal.modes, equipment: a.dreadEquipment.every((entry) => entry.combatBonus === 0) };
  })()`);
  check(modes.complete === true && modes.ratio === 1, 'mode objectives complete through real counters');
  check(modes.modes.includes('night_shift'), 'the completed mode is saved');
  check(modes.equipment === true, 'all ten exploration tools are combat-free');

  const journal = await evaluate(`(() => {
    const a = window.__ashen;
    a.recordDread('entry', 'entities.faceless_visitor');
    a.recordDread('entry', 'mysteries.twin_origin');
    const first = a.connectDreadClues();
    const second = a.connectDreadClues();
    return {
      percent: a.dreadJournal2.percent,
      categories: a.dreadJournal2.categories.length,
      first,
      second,
      rewards: a.dreadJournal2.rewards.length,
      achievement: a.dreadJournal2.achievements,
    };
  })()`);
  check(journal.categories === 10 && journal.percent > 0, `the journal records discoveries (${journal.percent}%)`);
  check(journal.first && journal.first.ok === true && journal.first.optional === true, 'the mystery board connects discovered clues');
  check(journal.second && journal.second.ok === false, 'duplicate connections are rejected');
  check(Array.isArray(journal.achievement) && journal.achievement.length === 8, `eight achievements are exposed (${Array.isArray(journal.achievement) ? journal.achievement.length : 'n/a'})`);

  const settings = await evaluate(`(() => {
    const a = window.__ashen;
    a.setDreadPath('dread.profile3D.darkness', 25);
    a.toggleAntiJumpscare(true);
    const dread = a.dread;
    return {
      threeD: dread.settings.profile3D.darkness,
      twoD: dread.settings.profile2D.darkness,
      anti: dread.presentation.antiJumpscare,
      cinematics: dread.presentation.boss.cinematics,
      darkness: dread.presentation.atmosphere.darkness,
      fog: dread.presentation.atmosphere.fog,
      overrides: dread.presentation.overrides.length,
    };
  })()`);
  check(settings.threeD === 25 && settings.twoD !== 25, '2D and 3D horror profiles are independent');
  check(settings.anti === true && settings.cinematics === false, 'Anti-Jumpscare suppresses boss startling presentation');
  check(settings.darkness > 0 && settings.fog > 0, 'atmosphere survives Anti-Jumpscare');
  check(settings.overrides >= 1, 'setting precedence is explained');

  const render = await evaluate(`(async () => {
    const a = window.__ashen;
    const drawable = typeof a.renderer.drawDreadWorld === 'function';
    const frames = await new Promise((resolve) => {
      let count = 0;
      const tick = () => { count += 1; if (count < 15) requestAnimationFrame(tick); else resolve(count); };
      requestAnimationFrame(tick);
    });
    return { drawable, frames, state: a.game.state };
  })()`);
  check(render.drawable === true, 'the renderer exposes the Dread environment layer');
  check(render.frames >= 15, `the environment renders across real frames (${render.frames})`);

  await send('Page.navigate', { url: BASE });
  await sleep(900);
  await attach(BASE);
  const reload = await evaluate(`(() => ({
    profile3D: window.__ashen.dread.settings.profile3D.darkness,
    anti: window.__ashen.settings.scary.antiJumpscare,
    journal: window.__ashen.dreadJournal2.percent,
    modes: window.__ashen.dreadJournal2.modes,
    achievements: window.__ashen.dreadJournal2.achievements,
  }))()`);
  check(reload.profile3D === 25 && reload.anti === true, 'Dread settings survive a full reload');
  check(reload.journal > 0 && reload.modes.includes('night_shift'), 'journal and completed modes survive a full reload');
  check(Array.isArray(reload.achievements) && reload.achievements.length === 8, 'achievements survive a full reload');

  check(consoleErrors.length === 0, `no console errors${consoleErrors.length ? `: ${consoleErrors[0].slice(0, 160)}` : ''}`);

  console.log(`\nDread Beyond smoke: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
}
