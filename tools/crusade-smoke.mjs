// The Radiant Crusade (Arc III) browser smoke test (headless Chrome + CDP).
//
// Verifies the war-camp menu, the five-level hub, a real Valor Chain run, the
// Giant Paladin's three phases, and the Arc IV rift teaser through the live UI.
//
// Usage:
//   npm start
//   node tools/crusade-smoke.mjs
//
// Env: ASHEN_URL, CHROME_PATH, CDP_PORT (default 9241).

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9241;

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

  const profile = mkdtempSync(join(tmpdir(), 'ashen-crusade-'));
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
      return { version: A.version, title: document.title, crusade: !!A.progress.crusade };
    })()`);
    check('boot reports v0.16.0', boot.version, '0.16.0');
    assert.match(boot.title, /0.16.0/);
    check('fresh saves carry a crusade progress block', boot.crusade, true);

    const arc2 = await evaluate(`(() => {
      const A = window.__ashen;
      A.progress.cleared[7] = true;
      A.ascendNow();
      A.showFallen('regions');
      return {
        regions: document.querySelectorAll('.fallen-region').length,
        bestiary: (() => { A.showFallen('bestiary'); return document.querySelectorAll('#fallen-body .fallen-card').length; })(),
        progress: A.fallen.summary.regionTotal,
      };
    })()`);
    check('Arc II hub now lists eleven regions and four optional bosses', arc2.regions, 15);
    check('Arc II bestiary grows to thirty-two', arc2.bestiary, 32);

    const unlocked = await evaluate(`(() => {
      const A = window.__ashen;
      A.progress.fallen.endings.dawn = true;
      A.progress.fallen.ending = 'dawn';
      const result = A.unlockCrusadeNow();
      A.showCrusadeMenu();
      const options = [...document.querySelectorAll('[data-crusade-menu]')];
      return {
        ok: result.ok,
        menu: A.menuView,
        options: options.length,
        rift: options.find((b) => b.dataset.crusadeMenu === 'rift').disabled,
        titleButton: !document.getElementById('btn-crusade-menu').classList.contains('hidden'),
        stats: document.querySelectorAll('#crusade-menu-summary .crusade-stat').length,
        canvas: !!document.getElementById('crusade-menu-figure'),
      };
    })()`);
    check('a Fallen ending unlocks the crusade', unlocked.ok, true);
    check('war-camp menu opens', unlocked.menu, 'crusadeMenu');
    check('six war-camp options render', unlocked.options, 6);
    check('The Rift stays disabled', unlocked.rift, true);
    check('title screen exposes the crusade button', unlocked.titleButton, true);
    check('camp summary renders five stats', unlocked.stats, 5);
    check('camp canvas exists', unlocked.canvas, true);

    const hub = await evaluate(`(() => {
      const A = window.__ashen;
      A.showCrusade('levels');
      const levels = [...document.querySelectorAll('[data-crusade-level]')];
      const bosses = [...document.querySelectorAll('[data-crusade-boss]')];
      const first = { level: levels[0].disabled, boss: bosses[0].disabled };
      A.showCrusade('bestiary');
      const bestiary = document.querySelectorAll('#crusade-body .crusade-card').length;
      A.showCrusade('camp');
      const upgrades = document.querySelectorAll('[data-crusade-upgrade]').length;
      A.showCrusade('banners');
      const banners = document.querySelectorAll('#crusade-body .crusade-card').length;
      return { screen: A.menuView, levels: levels.length, bosses: bosses.length, first, bestiary, upgrades, banners, tabs: document.querySelectorAll('[data-crusade-tab]').length };
    })()`);
    check('crusade hub opens', hub.screen, 'crusade');
    check('five levels render', hub.levels, 5);
    check('five level bosses render', hub.bosses, 5);
    check('level one is playable', hub.first.level, false);
    check('Marshal Aurion starts sealed', hub.first.boss, true);
    check('bestiary lists twenty-one enemies', hub.bestiary, 21);
    check('camp lists three upgrade tracks', hub.upgrades, 3);
    check('five banners render', hub.banners, 5);
    check('five hub tabs render', hub.tabs, 5);

    const run = await evaluate(`(() => {
      const A = window.__ashen;
      A.startCrusadeLevel(0);
      const first = A.snap();
      return {
        room: first.room,
        started: A.started,
        menu: A.menuView,
        hp: first.hp,
        expectedHp: A.crusade.run.hp,
        valor: A.crusade.run.valor,
        hud: !document.getElementById('crusade-hud').classList.contains('hidden'),
        level: A.crusade.activeLevel,
      };
    })()`);
    check('level one starts in room 485', run.room, 485);
    check('run is live', run.started, true);
    check('run hides menus', run.menu, 'none');
    check('crusade HP comes from the arc', run.hp, run.expectedHp);
    check('crusade base HP is 140', run.expectedHp, 140);
    check('valor starts empty', run.valor, 0);
    check('valor HUD is visible', run.hud, true);
    check('active level tracks the room', run.level, 0);

    const boss = await evaluate(`(() => {
      const A = window.__ashen;
      A.progress.crusade.rooms.splice(0, 3, true, true, true);
      A.startCrusadeBoss('marshal_aurion');
      const b = A.game.boss;
      return { room: A.snap().room, kind: b.kind, shield: b.purityShield, hp: b.hp };
    })()`);
    check('Marshal Aurion spawns in room 488', boss.room, 488);
    check('Marshal kind is registered', boss.kind, 'crusade_marshal_aurion');
    check('boss starts behind a purity shield', boss.shield, 140);

    const valor = await evaluate(`(() => {
      const A = window.__ashen;
      A.damageBoss(40);
      A.step(0.12, {});
      const afterHit = { valor: A.crusade.run.valor, shield: A.game.boss.purityShield };
      for (let i = 0; i < 6; i += 1) {
        A.damageBoss(10);
        A.step(0.12, {});
      }
      return { afterHit, valor: A.crusade.run.valor, strikeReady: A.crusade.run.valor >= 5 };
    })()`);
    check('boss damage drains the purity shield', valor.afterHit.shield, 100);
    check('boss damage fills the Valor Chain', valor.afterHit.valor > 0, true);
    check('clean hits unlock Crusader Strike', valor.strikeReady, true);

    const strike = await evaluate(`(() => {
      const A = window.__ashen;
      const before = A.game.boss.hp;
      const result = A.crusadeStrike();
      return { ok: result.ok, damage: result.damage, lost: before - A.game.boss.hp, chain: A.crusade.run.valor, strikes: A.crusade.run.strikes };
    })()`);
    check('Crusader Strike fires at five valor', strike.ok, true);
    check('strike spends chain', strike.chain < 5, true);
    check('strike damages the boss', strike.lost > 0, true);
    check('strike counter increments', strike.strikes, 1);

    const kill = await evaluate(`(async () => {
      const A = window.__ashen;
      A.game.player.maxHp = 9999;
      A.game.player.hp = 9999;
      A.game.boss.purityShield = 0;
      A.damageBoss(99999);
      for (let i = 0; i < 14 && !A.progress.crusade.bosses.marshal_aurion; i += 1) {
        A.step(0.4, {});
        A.drainEvents();
        await new Promise((r) => setTimeout(r, 80));
      }
      return {
        cleared: A.progress.crusade.bosses.marshal_aurion,
        banner: A.progress.crusade.banners.includes('banner_of_dawn'),
        sigils: A.progress.crusade.sigils,
        saved: !!JSON.parse(localStorage.getItem('ashen-vow-progress-v1') || '{}').crusade,
      };
    })()`);
    check('defeating the Marshal records the boss', kill.cleared, true);
    check('first clear raises the Banner of Dawn', kill.banner, true);
    check('first clear grants war sigils', kill.sigils > 0, true);
    check('crusade progress persists in the shared save key', kill.saved, true);

    const paladin = await evaluate(`(async () => {
      const A = window.__ashen;
      const state = A.progress.crusade;
      // Unlock every earlier level without replaying them in the smoke.
      for (const [id, level] of [['ballista_choir', 'sky_bastion'], ['lady_vesperine', 'sanctified_armory'], ['warden_ophelion', 'cathedral_of_swords']]) {
        state.bosses[id] = true;
      }
      state.rooms.splice(4, 15, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true);
      state.banners.push('siege_break', 'mercy_edge', 'wall_breaker');
      A.startCrusadeBoss('giant_paladin');
      const b = A.game.boss;
      const result = { room: A.snap().room, kind: b.kind, phases: b.maxPhases, shield: b.purityShield };
      b.purityShield = 0;
      b.intro = 0;
      A.damageBoss(999999);
      for (let i = 0; i < 18 && !A.progress.crusade.cleared; i += 1) {
        A.step(0.4, {});
        A.drainEvents();
        await new Promise((r) => setTimeout(r, 80));
      }
      return {
        ...result,
        cleared: A.progress.crusade.cleared,
        rift: A.progress.crusade.riftLocked === false,
        hook: A.progress.crusade.arc4Hook,
        screen: A.crusade.clearOpen,
        body: document.getElementById('crusade-clear-body').textContent.includes('CELAH TERBUKA'),
      };
    })()`);
    check('the Giant Paladin spawns in room 504', paladin.room, 504);
    check('Paladin kind is registered', paladin.kind, 'crusade_giant_paladin');
    check('Paladin runs three phases', paladin.phases, 3);
    check('Paladin starts behind a 200 shield', paladin.shield, 200);
    check('defeating the Paladin clears Arc III', paladin.cleared, true);
    check('the rift unlocks after the Paladin', paladin.rift, true);
    check('Arc IV hook is armed', paladin.hook, true);
    check('the clear screen opens', paladin.screen, true);
    check('the clear screen teases the rift', paladin.body, true);

    const reboot = await evaluate(`(() => {
      const A = window.__ashen;
      A.showMenu();
      return {
        menu: A.menuView,
        rift: [...document.querySelectorAll('[data-crusade-menu]')].find((b) => b.dataset.crusadeMenu === 'rift')?.disabled,
        levels: A.crusade.summary.levelsCleared,
        saved: JSON.parse(localStorage.getItem('ashen-vow-progress-v1') || '{}').crusade.arc4Hook,
      };
    })()`);
    check('after the clear the game boots to the war camp', reboot.menu, 'crusadeMenu');
    check('The Rift is still not playable', reboot.rift, true);
    check('all five levels stay cleared', reboot.levels, 5);
    check('the Arc IV hook survives save/reload', reboot.saved, true);

    check('no page exceptions', pageErrors.length, 0);
    console.log(`✔ crusade smoke: ${checks.length} checks passed`);
  } finally {
    try { ws?.close(); } catch { /* ignore */ }
    chrome.kill();
    await sleep(400);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

main().catch((error) => {
  console.error('✖ crusade smoke failed:', error.message);
  process.exit(1);
});
