// Hearthfall browser smoke test (headless Chrome + CDP).
//
// Usage:
//   npm start
//   npm run smoke:court
//
// Env: ASHEN_URL, CHROME_PATH, CDP_PORT (default 9233).

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9233;

function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const local = process.env.LOCALAPPDATA || '';
  const candidates = process.platform === 'win32'
    ? [
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        local ? join(local, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
      ]
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const found = candidates.filter(Boolean).find((path) => existsSync(path));
  if (!found) throw new Error('No Chrome/Chromium found. Set CHROME_PATH.');
  return found;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const res = await fetch(URL, { method: 'HEAD' });
  assert.equal(res.ok, true, 'game server must be running');

  const profile = mkdtempSync(join(tmpdir(), 'ashen-court-'));
  const chrome = spawn(findBrowser(), [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--mute-audio',
    '--window-size=1280,800',
    URL,
  ], { stdio: 'ignore' });

  let ws;
  const pageErrors = [];
  try {
    let list;
    for (let i = 0; i < 100; i++) {
      try {
        const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
        list = await response.json();
        if (list.some((target) => target.type === 'page' && target.url.startsWith(URL))) break;
      } catch {
        // Chrome is still starting.
      }
      await sleep(150);
    }
    const page = list?.find((target) => target.type === 'page' && target.url.startsWith(URL));
    assert.ok(page, 'Chrome page target');

    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });

    let nextId = 0;
    const pending = new Map();
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)(message);
        pending.delete(message.id);
        return;
      }
      if (message.method === 'Runtime.exceptionThrown') {
        pageErrors.push(message.params.exceptionDetails?.exception?.description || 'exception');
      } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        pageErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
      } else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
        if (!/favicon|ERR_NETWORK_ACCESS_DENIED|429|Too Many Requests/i.test(message.params.entry.text || '')) {
          pageErrors.push(message.params.entry.text);
        }
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
      const result = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      }
      return result.result.value;
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Log.enable');
    await send('Page.bringToFront');
    // Headless Chrome can attach while the ES-module graph is still fetching;
    // give the page a settle window before polling the debug hook.
    await sleep(2200);

    let booted = false;
    for (let i = 0; i < 100; i++) {
      try {
        booted = await evaluate('typeof window.__ashen === "object" && document.readyState === "complete"');
        if (booted) break;
      } catch {
        // Module graph is still loading.
      }
      await sleep(120);
    }
    assert.equal(booted, true, `game must boot (errors: ${pageErrors.join(' | ')})`);

    const boot = await evaluate(`(() => {
      const A = window.__ashen;
      A.clearProgress();
      return { version: A.version, title: document.title, levelCards: document.querySelectorAll('#level-cards .level-card').length };
    })()`);
    assert.equal(boot.version, '0.36.0');
    assert.match(boot.title, /0.36.0/);

    // Hub render.
    const hub = await evaluate(`(() => {
      document.getElementById('btn-court-menu').click();
      const A = window.__ashen;
      return {
        menuView: A.menuView,
        visible: !document.getElementById('court-screen').classList.contains('hidden'),
        summary: document.querySelectorAll('#court-summary > div').length,
        rooms: document.querySelectorAll('#court-body .court-room').length,
        bosses: document.querySelectorAll('#court-body .court-boss-card').length,
        tabs: document.querySelectorAll('#court-tabs [data-court-tab]').length,
      };
    })()`);
    assert.equal(hub.menuView, 'court');
    assert.equal(hub.visible, true);
    assert.equal(hub.summary, 6);
    assert.equal(hub.rooms, 60);
    assert.equal(hub.bosses, 12);
    assert.equal(hub.tabs, 4);

    // House + residents + arsenal render.
    for (const [tab, selector, expected] of [
      ['house', '.court-house-card', 6],
      ['residents', '.court-resident-chip', 8],
      ['arsenal', '.court-weapon-card', 8],
    ]) {
      const count = await evaluate(`(() => {
        document.querySelector('[data-court-tab="${tab}"]').click();
        return document.querySelectorAll('${selector}').length;
      })()`);
      assert.equal(count, expected, `${tab} tab renders ${expected} cards`);
    }
    const toolCount = await evaluate(`document.querySelectorAll('.court-tool-card').length`);
    assert.equal(toolCount, 12);
    const furnishingCount = await evaluate(`(() => {
      document.querySelector('[data-court-tab="house"]').click();
      return document.querySelectorAll('.court-furnishing').length;
    })()`);
    assert.equal(furnishingCount, 24);

    // Economy: upgrade a room, install furniture, gift an NPC.
    const house = await evaluate(`(() => {
      const A = window.__ashen;
      A.court.progress.marks = 2000;
      A.buildCourtScreen();
      const up = document.querySelector('[data-action="upgrade-room"][data-room-id="hall"]');
      up.click();
      const furn = document.querySelector('[data-action="buy-furnishing"][data-furnishing="long_table"]');
      furn.click();
      return {
        level: A.court.progress.house.rooms.hall,
        furniture: A.court.progress.house.furnishings.includes('long_table'),
        bonus: A.court.bonuses.maxHp,
        warmth: A.court.stats.warmth,
      };
    })()`);
    assert.equal(house.level, 1);
    assert.equal(house.furniture, true);
    assert.equal(house.bonus, 8);

    const npc = await evaluate(`(() => {
      const A = window.__ashen;
      document.querySelector('[data-court-tab="residents"]').click();
      document.querySelector('[data-action="select-resident"][data-resident="mara"]').click();
      document.querySelector('[data-action="talk-resident"][data-resident="mara"]').click();
      const before = A.court.progress.marks;
      document.querySelector('[data-action="gift-resident"][data-resident="mara"]').click();
      return {
        affinity: A.court.progress.residents.mara.affinity,
        spent: before - A.court.progress.marks,
        dialogue: document.querySelector('.court-dialogue')?.textContent?.length || 0,
      };
    })()`);
    assert.equal(npc.affinity, 10);
    assert.equal(npc.spent, 25);
    assert.ok(npc.dialogue > 5);

    // Start the first court room and verify a real simulation.
    const run = await evaluate(`(() => {
      const A = window.__ashen;
      document.querySelector('[data-court-tab="journey"]').click();
      document.querySelector('[data-action="start-room"][data-room="0"]').click();
      return {
        menuView: A.menuView,
        started: A.started,
        roomIndex: A.game.roomIndex,
        roomName: A.game.room.name,
        maxHp: A.game.player.maxHp,
        hudVisible: !document.getElementById('hud').classList.contains('hidden'),
      };
    })()`);
    assert.equal(run.menuView, 'none');
    assert.equal(run.started, true);
    assert.equal(run.roomIndex, 354);
    assert.equal(run.maxHp, 108);
    assert.equal(run.hudVisible, true);

    // Kill the room and walk through the gate; verify save progress.
    const cleared = await evaluate(`(async () => {
      const A = window.__ashen;
      A.game.enemies.slice().forEach((enemy) => A.game.hurtEnemy(enemy, { dmg: 99999, knock: 0, name: 'smoke' }, 1));
      A.step(0.2);
      A.drainEvents();
      A.game.player.x = 1350;
      A.game.player.y = 380;
      A.step(0.3);
      A.drainEvents();
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        roomIndex: A.game.roomIndex,
        cleared: A.court.progress.cleared[0],
        marks: A.court.progress.marks,
        saved: JSON.parse(localStorage.getItem('ashen-vow-progress-v1')).court.cleared[0],
      };
    })()`);
    assert.equal(cleared.roomIndex, 355);
    assert.equal(cleared.cleared, true);
    assert.ok(cleared.marks > 0);
    assert.equal(cleared.saved, true);

    // New HUD/inventory/graphics surfaces use real renderer/settings state.
    const surfaces = await evaluate(`(() => {
      const A = window.__ashen;
      const stage = A.progress.stageTimes['court:354'];
      A.showSettings(false);
      document.querySelector('[data-settings-tab="graphics"]').click();
      const graphics = {
        tab: document.querySelector('[data-settings-tab="graphics"]')?.getAttribute('aria-selected'),
        ranges: document.querySelectorAll('#settings-body input[type="range"][data-setting-path]').length,
        selects: document.querySelectorAll('#settings-body select[data-setting-path]').length,
        toggles: document.querySelectorAll('#settings-body input[type="checkbox"][data-setting-path]').length,
        aa: A.settings.gameplay.antiAliasing,
        fov: A.settings.gameplay.fov,
        distance: A.settings.gameplay.renderDistance,
      };
      A.closeSettings();
      A.openInventory();
      const inventory = {
        open: A.inventoryOpen,
        loadout: document.querySelectorAll('#inventory-loadout .loadout-cell').length,
        binds: document.querySelectorAll('#inventory-bindings .binding-mini-row').length,
        controls: !!document.querySelector('[data-inventory-controls]'),
      };
      A.closeInventory();
      return {
        stage,
        graphics,
        inventory,
        clock: document.getElementById('live-clock-time')?.textContent || '',
        stageClock: document.getElementById('live-clock-stage')?.textContent || '',
      };
    })()`);
    assert.ok(surfaces.stage && surfaces.stage.last > 0, 'cleared stage records elapsed time');
    assert.equal(surfaces.graphics.tab, 'true');
    assert.ok(surfaces.graphics.ranges >= 3, 'graphics tab keeps its sliders');
    assert.ok(surfaces.graphics.selects >= 2, 'graphics tab keeps its selects');
    assert.ok(surfaces.graphics.toggles >= 1, 'graphics tab keeps its toggles');
    assert.equal(surfaces.graphics.aa, true);
    assert.ok(surfaces.graphics.fov >= 80 && surfaces.graphics.fov <= 120);
    assert.ok(surfaces.graphics.distance >= 50 && surfaces.graphics.distance <= 100);
    assert.equal(surfaces.inventory.open, true);
    assert.equal(surfaces.inventory.loadout, 4);
    assert.ok(surfaces.inventory.binds >= 14, 'inventory lists every binding');
    assert.equal(surfaces.inventory.controls, true);
    assert.match(surfaces.clock, /\d{2}:\d{2}:\d{2}/);
    assert.match(surfaces.stageClock, /STAGE/);

    // Court weapon profile fires and damages in the real game.
    const weapon = await evaluate(`(() => {
      const A = window.__ashen;
      const p = A.game.player;
      p.weapons.push('greataxe');
      p.weapon = 'greataxe';
      p.attack = null;
      A.game.startAttack();
      return { weapon: p.attack.weapon, dmg: p.attack.def.dmg, hasWeapon: !!A.game.hud };
    })()`);
    assert.equal(weapon.weapon, 'greataxe');
    assert.equal(weapon.dmg, 34);

    // Reload and confirm progress.court survives.
    await send('Page.navigate', { url: URL });
    await send('Page.bringToFront');
    await sleep(2600);
    let persisted = null;
    for (let i = 0; i < 100; i++) {
      try {
        persisted = await evaluate(`(() => {
          const A = window.__ashen;
          return A && {
            marks: A.progress.court.marks,
            cleared: A.progress.court.cleared[0],
            hall: A.progress.court.house.rooms.hall,
            furniture: A.progress.court.house.furnishings,
            affinity: A.progress.court.residents.mara.affinity,
          };
        })()`);
        if (persisted) break;
      } catch {
        // Reload in progress.
      }
      await sleep(120);
    }
    assert.ok(persisted);
    assert.equal(persisted.cleared, true);
    assert.equal(persisted.hall, 1);
    assert.deepEqual(persisted.furniture, ['long_table']);
    assert.equal(persisted.affinity, 10);

    // Court boss art/arena: unlock room 9 and let a few frames render.
    const bossRun = await evaluate(`(() => {
      const A = window.__ashen;
      A.progress.court.cleared = A.progress.court.cleared.map(() => true);
      A.startCourtRoom(9);
      return { name: A.game.boss?.name, color: A.game.boss?.color, phase: A.game.boss?.phase };
    })()`);
    assert.equal(bossRun.name, 'Mother Hearth');
    assert.equal(bossRun.color, '#ffb066');
    await sleep(700);

    // Court trials: NG+ + first boss of the rush, then advance to the second.
    const trialStart = await evaluate(`(() => {
      const A = window.__ashen;
      A.progress.court.completion = true;
      A.progress.court.ngPlus = 2;
      A.startCourtTrial('boss_rush');
      return {
        started: A.started,
        room: A.game.roomIndex,
        boss: A.game.boss?.name,
        ngPlus: A.game.ngPlus,
        trial: A.court.activeTrial?.id,
        index: A.court.activeTrial?.index,
      };
    })()`);
    assert.equal(trialStart.started, true);
    assert.equal(trialStart.room, 360);
    assert.equal(trialStart.boss, 'Cinder Steward');
    assert.equal(trialStart.ngPlus, 2);
    assert.equal(trialStart.trial, 'boss_rush');
    assert.equal(trialStart.index, 0);

    const trialAdvance = await evaluate(`(() => {
      const A = window.__ashen;
      A.game.boss.invuln = 0;
      A.game.boss.hp = 0;
      A.game.finishBoss();
      return true;
    })()`);
    assert.equal(trialAdvance, true);
    await sleep(700);
    const trialNext = await evaluate(`(() => {
      const A = window.__ashen;
      return { boss: A.game.boss?.name, room: A.game.roomIndex, index: A.court.activeTrial?.index, hp: A.game.player.hp, maxHp: A.game.player.maxHp };
    })()`);
    assert.equal(trialNext.index, 1);
    assert.equal(trialNext.room, 363);
    assert.equal(trialNext.boss, 'Mother Hearth');
    assert.ok(trialNext.hp > 0 && trialNext.hp <= trialNext.maxHp);

    assert.deepEqual(pageErrors, [], `browser errors: ${pageErrors.join(' | ')}`);
    console.log('COURT SMOKE PASS');
    console.log(JSON.stringify({ boot, hub, house, npc, run, cleared, persisted, trialStart, trialNext }, null, 2));
  } finally {
    try { ws?.close(); } catch {}
    chrome.kill();
    await sleep(300);
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

await main();
