// Real-browser smoke test for Ashen Vow using headless Chrome + CDP.
// Covers the Atlas hub (all seven tabs), purchases, quick slots, lore, gear,
// diagnostics, an Atlas room run/retry, all eight boss arenas, the final
// ending, and save persistence across a page reload.
//
// Usage:
//   npm start                     # in one terminal
//   npm run smoke:browser         # in another
//
// Optional environment variables:
//   ASHEN_URL   page URL (default http://127.0.0.1:4300/)
//   CHROME_PATH full path to Chrome/Edge/Chromium
//   CDP_PORT    DevTools port (default 9223)
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GAME_VERSION } from '../src/updates.js';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9223;

function findBrowser() {
  if (process.env.CHROME_PATH) {
    if (!existsSync(process.env.CHROME_PATH)) {
      throw new Error(`CHROME_PATH does not exist: ${process.env.CHROME_PATH}`);
    }
    return process.env.CHROME_PATH;
  }
  const localAppData = process.env.LOCALAPPDATA || '';
  const candidates = process.platform === 'win32'
    ? [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        localAppData ? join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      ]
    : process.platform === 'darwin'
      ? [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Chromium.app/Contents/MacOS/Chromium',
          '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        ]
      : [
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable',
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser',
        ];
  const found = candidates.filter(Boolean).find((path) => existsSync(path));
  if (!found) {
    throw new Error('No Chrome/Chromium found. Set CHROME_PATH to the browser executable.');
  }
  return found;
}

async function ensureServer() {
  try {
    const res = await fetch(URL, { method: 'HEAD' });
    if (res.ok) return;
  } catch {
    // Fall through to the helpful error below.
  }
  throw new Error(`Cannot reach ${URL}. Start the game first with "npm start".`);
}

const browserPath = findBrowser();
await ensureServer();

const profile = mkdtempSync(join(tmpdir(), 'ashen-chrome-'));
const chrome = spawn(browserPath, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-extensions',
  '--mute-audio',
  '--window-size=1280,800',
  URL,
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(fn, timeout = 15000, label = 'condition') {
  const start = Date.now();
  let lastError = null;
  while (Date.now() - start < timeout) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw new Error(`timed out waiting for ${label}${lastError ? `: ${lastError.message}` : ''}`);
}

let ws;
let nextId = 0;
const pending = new Map();
const pageErrors = [];

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, (message) => {
      if (message.error) reject(new Error(`${method}: ${message.error.message}`));
      else resolve(message.result);
    });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    const detail = result.exceptionDetails.exception?.description
      || result.exceptionDetails.text
      || 'runtime exception';
    throw new Error(detail);
  }
  return result.result.value;
}

try {
  const targets = await waitFor(async () => {
    const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const list = await res.json();
    return list.some((target) => target.type === 'page' && target.url.startsWith(URL)) ? list : null;
  }, 20000, 'Chrome page target');
  const page = targets.find((target) => target.type === 'page' && target.url.startsWith(URL));

  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const callback = pending.get(message.id);
      if (callback) {
        pending.delete(message.id);
        callback(message);
      }
      return;
    }
    if (message.method === 'Runtime.exceptionThrown') {
      pageErrors.push(message.params.exceptionDetails?.exception?.description || 'exception');
    } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      pageErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
    } else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      const text = message.params.entry.text || '';
      if (!/favicon|429|Too Many Requests/i.test(text)) pageErrors.push(text);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');
  // Let the ES-module graph settle before polling; attaching immediately after
  // `Runtime.enable` can evaluate against a pre-module context and time out.
  await sleep(1800);

  await waitFor(async () => evaluate('document.readyState === "complete"'), 15000, 'page load');
  await waitFor(async () => evaluate('typeof window.__ashen === "object"'), 15000, 'game boot');

  const result = await evaluate(`(async () => {
    const A = window.__ashen;
    const out = { version: A.version, title: document.title, tabs: [], checks: {} };
    A.clearProgress();
    document.getElementById('btn-atlas-menu').click();
    out.checks.menuView = A.menuView;
    out.checks.atlasVisible = !document.getElementById('atlas-screen').classList.contains('hidden');

    const tabMarkers = {
      zones: 'DELAPAN HALAMAN ATLAS',
      story: 'LINIMASA SUMPAH',
      lore: 'INDEKS SUMPAH',
      shops: 'ENAM WARUNG ATLAS',
      gear: 'PERLENGKAPAN ATLAS',
      items: 'SLOT CEPAT',
      systems: 'STATISTIK ATLAS',
    };
    for (const [tab, marker] of Object.entries(tabMarkers)) {
      document.querySelector('#atlas-tabs [data-tab="' + tab + '"]').click();
      const text = document.getElementById('atlas-body').textContent;
      out.tabs.push({ tab, rendered: text.includes(marker) });
    }

    // Economy and quick-slot assignment through real DOM clicks.
    const p = A.atlas;
    p.marks = 2000;
    p.loreFragments = 20;
    document.querySelector('#atlas-tabs [data-tab="shops"]').click();
    const marksBefore = p.marks;
    document.querySelector('[data-atlas-action="buy"][data-shop="shop_vael"][data-item="atlas_heal_1"]').click();
    out.checks.bought = p.consumables.atlas_heal_1 === 1 && p.marks < marksBefore;

    document.querySelector('#atlas-tabs [data-tab="items"]').click();
    document.querySelector('[data-atlas-action="assign-quick"][data-item="atlas_heal_1"][data-slot="0"]').click();
    out.checks.quickAssigned = p.quickSlots[0] === 'atlas_heal_1';

    document.querySelector('#atlas-tabs [data-tab="lore"]').click();
    document.querySelector('[data-atlas-action="reveal"]').click();
    out.checks.loreRevealed = (p.lore.lore_1 || 0) >= 1;

    p.ownedArmor.push('armor_1');
    document.querySelector('#atlas-tabs [data-tab="gear"]').click();
    document.querySelector('[data-atlas-action="equip-armor"][data-armor="armor_1"]').click();
    out.checks.armorEquipped = p.equippedArmor === 'armor_1';
    p.marks = 2000;
    document.querySelector('[data-atlas-action="gear-tab"][data-tab="weapons"]').click();
    document.querySelector('[data-atlas-action="infuse"][data-weapon="' + p.equippedWeapon + '"][data-infusion="ember"]').click();
    out.checks.infused = p.weaponInfusions[p.equippedWeapon] === 'ember';

    document.querySelector('#atlas-tabs [data-tab="systems"]').click();
    document.querySelector('[data-atlas-action="validate"]').click();
    out.checks.validator = document.getElementById('atlas-body').textContent.includes('LULUS');
    document.querySelector('[data-atlas-action="boss-bot"]').click();
    out.checks.bossBot = document.getElementById('atlas-body').textContent.includes('BOT BOS ATLAS');

    // Run a real Atlas room and use the quick slot through the HUD button.
    A.startAtlasRoom(114);
    out.checks.room = A.game.roomIndex === 114 && A.game.atlasRun === true;
    out.checks.quickbarVisible = !document.getElementById('atlas-quickbar').classList.contains('hidden');
    A.game.player.hp = Math.max(1, A.game.player.hp - 30);
    const hpBefore = A.game.player.hp;
    document.querySelector('#atlas-quickbar [data-atlas-quick-use="0"]').click();
    out.checks.quickUsed = p.consumables.atlas_heal_1 === 0 && A.game.player.hp > hpBefore;

    A.retry();
    out.checks.retry = A.game.roomIndex === 114 && A.game.atlasRun === true;

    // Zone boss clear through finishBoss + drainEvents.
    for (let local = 0; local < 29; local++) p.clearedRooms[114 + local] = true;
    p.abilities = [];
    p.zoneBosses = {};
    A.startAtlasRoom(143);
    out.checks.bossNavigator = A.game.boss?.atlas === true && !!A.game.boss?.navigator;
    A.game.finishBoss();
    A.drainEvents();
    out.checks.zoneBoss = p.zoneBosses.vael === true
      && p.abilities.includes('vow_dash')
      && p.ownedCharms.includes('charm_1')
      && p.clearedRooms[143] === true;

    // Simulate real frames in an Atlas combat room and every boss arena.
    A.clearProgress();
    const p2 = A.atlas;
    p2.unlockedZones = ['vael', 'aviary', 'starfall', 'witherwood', 'sandglass', 'catacombs', 'abyss', 'foundry'];
    p2.abilities = ['vow_dash', 'echo_sight', 'time_slow', 'grave_step', 'abyssal_breath', 'overclock'];
    A.startAtlasRoom(115);
    A.step(2);
    out.checks.combatRoom = A.game.roomIndex === 115 && A.game.state === 'playing';
    const bossRooms = [143, 173, 203, 233, 263, 293, 323, 353];
    out.checks.bossSims = [];
    for (const room of bossRooms) {
      const zoneStart = 114 + Math.floor((room - 114) / 30) * 30;
      for (let local = 0; local < 30; local++) p2.clearedRooms[zoneStart + local] = true;
      A.startAtlasRoom(room);
      A.game.player.maxHp = 99999;
      A.game.player.hp = 99999;
      A.game.player.invuln = 999;
      const boss = A.game.boss;
      const before = boss ? { x: boss.x, y: boss.y } : null;
      A.step(2.5);
      const after = A.game.boss;
      out.checks.bossSims.push({
        room,
        spawned: !!boss,
        navigator: !!boss?.navigator,
        moved: !!after && !!before && (Math.abs(after.x - before.x) + Math.abs(after.y - before.y) > 0.5),
        state: A.game.state,
      });
    }

    // Final boss and ending.
    p2.unlockedZones = ['vael', 'aviary', 'starfall', 'witherwood', 'sandglass', 'catacombs', 'abyss', 'foundry'];
    p2.abilities = ['vow_dash', 'echo_sight', 'time_slow', 'grave_step', 'abyssal_breath', 'overclock'];
    p2.zoneBosses = { vael: true, aviary: true, starfall: true, witherwood: true, sandglass: true, catacombs: true, abyss: true };
    p2.equippedArmor = 'armor_1';
    if (!p2.ownedArmor.includes('armor_1')) p2.ownedArmor.push('armor_1');
    p2.weaponInfusions = { [p2.equippedWeapon]: 'ember' };
    p2.lore.lore_1 = 1;
    p2.quickSlots[0] = 'atlas_heal_1';
    for (let local = 0; local < 29; local++) p2.clearedRooms[324 + local] = true;
    A.startAtlasRoom(353);
    A.game.finishBoss();
    A.drainEvents();
    out.checks.finalVictory = A.game.state === 'victory';
    out.checks.ending = p2.endings.length === 1 && p2.endings[0] === 'ending_rule';
    A.fillVictoryStats();
    out.checks.endingText = document.getElementById('victory-blessings').textContent.includes('Pembuat Peta Baru');
    return out;
  })()`);

  assert.equal(result.version, GAME_VERSION);
  assert.match(result.title, new RegExp(`v${GAME_VERSION.replace(/\./g, '\\.')}`));
  assert.equal(result.checks.menuView, 'atlas');
  assert.equal(result.checks.atlasVisible, true);
  assert.equal(result.tabs.length, 7);
  assert.ok(result.tabs.every((tab) => tab.rendered), JSON.stringify(result.tabs));
  for (const key of [
    'bought', 'quickAssigned', 'loreRevealed', 'armorEquipped', 'infused',
    'validator', 'bossBot', 'room', 'quickbarVisible', 'quickUsed', 'retry',
    'bossNavigator', 'zoneBoss', 'combatRoom', 'finalVictory', 'ending', 'endingText',
  ]) {
    assert.equal(result.checks[key], true, `check failed: ${key}`);
  }
  assert.equal(result.checks.bossSims.length, 8, 'all eight boss arenas should be simulated');
  for (const sim of result.checks.bossSims) {
    assert.equal(sim.spawned, true, `boss ${sim.room} should spawn`);
    assert.equal(sim.navigator, true, `boss ${sim.room} should have a navigator`);
    assert.equal(sim.moved, true, `boss ${sim.room} should move during 2.5s`);
    assert.equal(sim.state, 'playing', `boss ${sim.room} simulation should stay playable`);
  }

  // Reload the real page and verify the Atlas save survived.
  await send('Page.reload', { ignoreCache: true });
  await waitFor(async () => evaluate('document.readyState === "complete"'), 15000, 'reloaded page');
  await waitFor(async () => evaluate('typeof window.__ashen === "object"'), 15000, 'reloaded game boot');
  const persisted = await evaluate(`(() => {
    const a = window.__ashen.progress.atlas;
    return {
      endings: a.endings,
      zoneBosses: Object.keys(a.zoneBosses),
      armor: a.equippedArmor,
      infusion: a.weaponInfusions[a.equippedWeapon],
      lore: a.lore.lore_1,
      quickSlot: a.quickSlots[0],
    };
  })()`);
  assert.deepEqual(persisted.endings, ['ending_rule']);
  assert.equal(persisted.zoneBosses.length, 8);
  assert.equal(persisted.armor, 'armor_1');
  assert.equal(persisted.infusion, 'ember');
  assert.equal(persisted.lore, 1);
  assert.equal(persisted.quickSlot, 'atlas_heal_1');
  assert.deepEqual(pageErrors, [], `browser errors: ${pageErrors.join(' | ')}`);

  console.log('BROWSER SMOKE PASS');
  console.log(JSON.stringify(result, null, 2));
} finally {
  try { ws?.close(); } catch {}
  chrome.kill();
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
