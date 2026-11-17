// The Fallen Ones (Arc II) browser smoke test (headless Chrome + CDP).
//
// Verifies the heavenly menu takeover, the arc hub, a real region run, and a
// real boss fight with a Purity Shield — all through the live UI.
//
// Usage:
//   npm start
//   node tools/fallen-smoke.mjs
//
// Env: ASHEN_URL, CHROME_PATH, CDP_PORT (default 9237).

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9237;

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
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const found = candidates.filter(Boolean).find((path) => existsSync(path));
  if (!found) throw new Error('No Chrome/Chromium found. Set CHROME_PATH.');
  return found;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const res = await fetch(URL, { method: 'HEAD' });
  assert.equal(res.ok, true, 'game server must be running');

  const profile = mkdtempSync(join(tmpdir(), 'ashen-fallen-'));
  const chrome = spawn(findBrowser(), [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--mute-audio',
    '--window-size=1280,900',
    URL,
  ], { stdio: 'ignore' });

  let ws;
  const pageErrors = [];
  const checks = [];
  const check = (name, value, expected) => {
    assert.equal(value, expected, name);
    checks.push(name);
    if (process.env.SMOKE_VERBOSE) console.log(`· ${name}`);
  };
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
        if (!/favicon|ERR_NETWORK_ACCESS_DENIED/i.test(message.params.entry.text || '')) {
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
    await sleep(2400);

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
      return { version: A.version, title: document.title, fallen: !!A.progress.fallen };
    })()`);
    check('boot reports v0.15.0', boot.version, '0.15.0');
    assert.match(boot.title, /0\.14\.0/);
    check('fresh saves carry a fallen progress block', boot.fallen, true);

    const ascended = await evaluate(`(() => {
      const A = window.__ashen;
      A.progress.cleared[7] = true;
      const result = A.ascendNow();
      A.showMenu();
      return {
        ok: result.ok,
        menu: A.menuView,
        options: document.querySelectorAll('[data-fallen-menu]').length,
        stats: document.querySelectorAll('#fallen-menu-summary .fallen-stat').length,
        canvas: !!document.getElementById('fallen-menu-figure'),
        titleButton: !document.getElementById('btn-fallen-menu').classList.contains('hidden'),
      };
    })()`);
    check('clearing room 7 ascends', ascended.ok, true);
    check('boot/return lands on the heavenly menu', ascended.menu, 'fallenMenu');
    check('six heavenly menu options render', ascended.options, 6);
    check('menu summary renders five stats', ascended.stats, 5);
    check('kneeling figure canvas exists', ascended.canvas, true);
    check('title screen exposes the arc button', ascended.titleButton, true);

    const hub = await evaluate(`(() => {
      const A = window.__ashen;
      A.showFallen('regions');
      const regionButtons = [...document.querySelectorAll('[data-fallen-region]')];
      const bossButtons = [...document.querySelectorAll('[data-fallen-boss]')];
      return {
        screen: A.menuView,
        regions: document.querySelectorAll('.fallen-region').length,
        regionButtons: regionButtons.length,
        firstRegionLocked: regionButtons[0].disabled,
        firstBossLocked: bossButtons[0].disabled,
        tabs: document.querySelectorAll('[data-fallen-tab]').length,
        bestiary: (() => { A.showFallen('bestiary'); return document.querySelectorAll('#fallen-body .fallen-card').length; })(),
        archive: (() => { A.showFallen('archive'); return document.querySelectorAll('#fallen-ending-card, #fallen-body .fallen-card').length; })(),
      };
    })()`);
    check('arc hub opens', hub.screen, 'fallen');
    check('fifteen boss entries render (11 regions + 4 optional)', hub.regions, 15);
    check('region 1 is playable', hub.firstRegionLocked, false);
    check('Aurelian starts sealed', hub.firstBossLocked, true);
    check('five hub tabs render', hub.tabs, 5);
    check('hub bestiary lists thirty-two enemies', hub.bestiary, 32);
    check('archive lists three endings', hub.archive, 3);

    const run = await evaluate(`(() => {
      const A = window.__ashen;
      A.startFallenRegion(0);
      const first = A.snap();
      A.enterRoom(427);
      return {
        room: first.room,
        started: A.started,
        menu: A.menuView,
        hp: first.hp,
        maxHp: first.maxHp,
        enemies: A.game.enemies.length,
        hud: !document.getElementById('fallen-hud').classList.contains('hidden'),
        radiance: A.fallen.run.radiance,
        expectedHp: A.fallen.run.hp,
      };
    })()`);
    check('region 1 starts in room 426', run.room, 426);
    check('run is live', run.started, true);
    check('run hides menus', run.menu, 'none');
    check('fallen HP comes from the arc', run.hp, run.expectedHp);
    check('HP and max HP agree', run.maxHp, run.expectedHp);
    check('echo_resolve adds its bonus HP', run.expectedHp, 138);
    check('hall 2 spawns real enemies', run.enemies > 0, true);
    check('radiance HUD is visible', run.hud, true);
    check('radiance starts empty', run.radiance, 0);

    const boss = await evaluate(`(() => {
      const A = window.__ashen;
      A.progress.fallen.rooms.splice(0, 4, true, true, true, true);
      A.startFallenBoss('aurelian');
      const b = A.game.boss;
      return { room: A.snap().room, kind: b.kind, shield: b.purityShield, max: b.purityMax, hp: b.hp };
    })()`);
    check('Aurelian spawns in room 430', boss.room, 430);
    check('boss kind is registered', boss.kind, 'fallen_aurelian');
    check('boss starts behind a purity shield', boss.shield, 120);
    check('purity shield tracks its max', boss.max, 120);

    const shield = await evaluate(`(() => {
      const A = window.__ashen;
      const before = A.game.boss.hp;
      A.damageBoss(50);
      return { shield: A.game.boss.purityShield, lost: before - A.game.boss.hp };
    })()`);
    check('raw damage drains the shield', shield.shield, 70);
    check('shielded damage is heavily reduced', shield.lost < 15, true);

    await sleep(700);
    const kill = await evaluate(`(async () => {
      const A = window.__ashen;
      // Keep the idle test player alive so the fight is not interrupted by death.
      A.game.player.maxHp = 9999;
      A.game.player.hp = 9999;
      A.damageBoss(4000);
      // Drive the fixed-step simulation directly: a backgrounded tab can throttle
      // requestAnimationFrame, which would otherwise freeze i-frames mid-fight.
      A.step(0.6, {});
      A.game.player.hp = 9999;
      A.damageBoss(4000);
      // The death animation has to finish before bossDown is emitted.
      for (let i = 0; i < 12 && !A.progress.fallen.bosses.aurelian; i += 1) {
        A.step(0.4, {});
        A.drainEvents();
        await new Promise((r) => setTimeout(r, 80));
      }
      return {
        cleared: A.progress.fallen.bosses.aurelian,
        shards: A.progress.fallen.shards,
        ability: A.progress.fallen.abilities.includes('halo_dash'),
        archive: A.progress.fallen.archive.bosses.includes('aurelian'),
        state: A.snap().state,
        bossHp: A.game.boss ? A.game.boss.hp : null,
        saved: !!JSON.parse(localStorage.getItem('ashen-vow-progress-v1') || '{}').fallen,
      };
    })()`);
    if (process.env.SMOKE_VERBOSE) console.log('kill', kill);
    check('defeating Aurelian records the boss', kill.cleared, true);
    check('first clear grants Shards of Halo', kill.shards > 0, true);
    check('Aurelian unlocks Halo Dash', kill.ability, true);
    check('archive tracks the boss', kill.archive, true);

    const endingGate = await evaluate(`(() => {
      const A = window.__ashen;
      return { ending: A.chooseFallenEnding('dawn').ok, eclipse: A.chooseFallenEnding('eclipse').ok };
    })()`);
    check('endings stay sealed before Seraphiel', endingGate.ending, false);
    check('Eclipse stays sealed without optional bosses', endingGate.eclipse, false);

    const persist = await evaluate(`(() => {
      const A = window.__ashen;
      const raw = JSON.parse(localStorage.getItem('ashen-vow-progress-v1') || '{}').fallen || {};
      return { bosses: !!raw.bosses?.aurelian, shards: raw.shards > 0, rooms: raw.rooms?.[0] === true };
    })()`);
    check('fallen progress persists in the shared save key', persist.bosses, true);
    check('shards persist across reloads', persist.shards, true);

    check('no page exceptions', pageErrors.length, 0);
    console.log(`✔ fallen smoke: ${checks.length} checks passed`);
  } finally {
    try { ws?.close(); } catch { /* ignore */ }
    chrome.kill();
    await sleep(400);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

main().catch((error) => {
  console.error('✖ fallen smoke failed:', error.message);
  process.exit(1);
});
