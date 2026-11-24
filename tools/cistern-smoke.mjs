// Tidewrought Cistern browser smoke test (headless Chrome + CDP).
//
// Drives the real level-select section: the chapter stays locked until The
// Oathbreaker falls, both wall secrets stay hidden, stage I clears through the
// live gate, the secret wall opens the spelean room, and the tide regent ends
// in victory. Persistence is checked after a reload.
//
// Usage:
//   npm start
//   node tools/cistern-smoke.mjs
//
// Env: ASHEN_URL, CHROME_PATH, CDP_PORT (default 9266), SMOKE_VERBOSE=1.

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9266;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const local = process.env.LOCALAPPDATA || '';
  const candidates = process.platform === 'win32'
    ? [
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        local ? join(local, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      ]
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium'];
  const found = candidates.filter(Boolean).find((path) => existsSync(path));
  if (!found) throw new Error('No Chrome/Chromium found. Set CHROME_PATH.');
  return found;
}

async function main() {
  assert.equal((await fetch(URL, { method: 'HEAD' })).ok, true, 'game server must be running');

  const profile = mkdtempSync(join(tmpdir(), 'ashen-cistern-'));
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
  const check = (value, name) => {
    assert.ok(value, name);
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
      } catch { /* Chrome is still starting. */ }
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
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
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

    for (let i = 0; i < 100; i += 1) {
      if (await evaluate('typeof window.__ashen === "object" && document.readyState === "complete"')) break;
      await sleep(120);
    }

    const boot = await evaluate(`(() => {
      const A = window.__ashen;
      A.clearProgress();
      return { version: A.version, title: document.title, rooms: A.cistern.rooms.length, stageCount: A.cistern.stageCount };
    })()`);
    check(boot.version === '0.36.0', `boots v0.36.0 (${boot.version})`);
    check(/0\.36\.0/.test(boot.title), 'title carries v0.36.0');
    check(boot.rooms === 7 && boot.stageCount === 5, 'chapter exposes 7 rooms and 5 stages');

    const locked = await evaluate(`(() => {
      const A = window.__ashen;
      A.showLevels();
      const section = document.querySelector('.cistern-section');
      return {
        cisternCards: document.querySelectorAll('.cistern-card').length,
        legacyCards: document.querySelectorAll('#level-cards .level-card').length,
        label: document.getElementById('cistern-progress').textContent,
        noteVisible: !document.getElementById('cistern-lock-note').classList.contains('hidden'),
        playButtons: document.querySelectorAll('.cistern-card .play-btn').length,
        unlocked: !!section && A.cistern.unlocked,
      };
    })()`);
    check(locked.cisternCards === 7, 'level select renders seven cistern cards');
    check(locked.legacyCards === 14, 'the fourteen legacy cards are untouched');
    check(locked.label === 'TERKUNCI' && locked.unlocked === false, 'chapter starts locked');
    check(locked.noteVisible === true, 'the lock note explains the requirement');
    check(locked.playButtons === 0, 'no cistern stage can be started before unlock');

    const unlocked = await evaluate(`(() => {
      const A = window.__ashen;
      A.unlockCistern();
      A.showLevels();
      const hidden = [...document.querySelectorAll('.cistern-card')].filter((card) => card.querySelector('h3')?.textContent === '???').length;
      return {
        label: document.getElementById('cistern-progress').textContent,
        noteVisible: !document.getElementById('cistern-lock-note').classList.contains('hidden'),
        playButtons: document.querySelectorAll('.cistern-card .play-btn').length,
        hidden,
        unlocked: A.cistern.unlocked,
      };
    })()`);
    check(unlocked.unlocked === true, 'Oathbreaker clear unlocks the cistern');
    check(/0\/5 TAHAP/.test(unlocked.label), `label reports stage progress (${unlocked.label})`);
    check(unlocked.noteVisible === false, 'the lock note hides after unlock');
    check(unlocked.playButtons === 1, 'only the first hall is playable');
    check(unlocked.hidden === 2, 'both secret rooms stay hidden as ???');

    const started = await evaluate(`(() => {
      const A = window.__ashen;
      A.startCisternStage(0);
      return {
        room: A.game.roomIndex,
        name: A.game.room.name,
        enemies: A.game.enemies.length,
        runKind: A.runKind,
        zone: A.game.room.zone,
        particle: A.game.room.particle,
        palette: A.game.room.palette?.glow || null,
      };
    })()`);
    check(started.room === 662, 'stage I loads room 662');
    check(started.runKind === 'cistern', 'the run kind is cistern');
    check(started.enemies === 4, 'stage I spawns four enemies');
    check(started.zone === 'cistern' && started.particle === 'bubbles', 'the room uses the cistern zone and bubble mood');
    check(started.palette === '#5fd3c2', 'the room carries the cistern palette');

    const cleared = await evaluate(`(() => {
      const A = window.__ashen;
      A.game.enemies.slice().forEach((enemy) => A.game.hurtEnemy(enemy, { dmg: 99999, knock: 0, name: 'smoke' }, 1));
      A.game.player.x = 1330;
      A.game.player.y = 400;
      for (let i = 0; i < 240 && A.game.roomIndex === 662; i += 1) {
        A.game.player.x = Math.min(1360, A.game.player.x + 4);
        A.step(1 / 120, { right: true });
        A.drainEvents();
      }
      return { room: A.game.roomIndex, halls: A.cistern.state.halls.slice(), cleared: A.cistern.summary.stagesCleared };
    })()`);
    check(cleared.room === 663, 'the east gate walks into the leaking gallery');
    check(cleared.halls[0] === true, 'stage I is recorded as cleared');

    const secret = await evaluate(`(() => {
      const A = window.__ashen;
      const wall = A.game.activeWall();
      const name = wall?.name || null;
      for (let i = 0; i < 10; i += 1) A.game.damageWall(40);
      A.game.player.x = 24;
      A.game.player.y = 400;
      for (let i = 0; i < 240 && A.game.roomIndex === 663; i += 1) {
        A.game.player.x = Math.max(10, A.game.player.x - 4);
        A.step(1 / 120, { left: true });
        A.drainEvents();
      }
      return {
        wall: name,
        room: A.game.roomIndex,
        secrets: A.cistern.summary.secretsFound,
        discovered: A.cistern.summary.discovered.slice(),
        bye: A.game.room.name,
      };
    })()`);
    check(secret.wall === 'Dinding Lumut', 'the gallery carries its own breakable wall');
    check(secret.room === 667, 'the west wall opens the sunken alcove');
    check(secret.secrets === 1, 'finding the secret records it');
    check(secret.discovered[5] === true, 'the secret room becomes discovered');

    const revealed = await evaluate(`(() => {
      const A = window.__ashen;
      A.showLevels();
      const cards = [...document.querySelectorAll('.cistern-card')];
      return {
        hidden: cards.filter((card) => card.querySelector('h3')?.textContent === '???').length,
        names: cards.map((card) => card.querySelector('h3')?.textContent),
      };
    })()`);
    check(revealed.hidden === 1, 'only the unfound secret is still hidden');
    check(revealed.names.includes('Relung Karam'), 'the found secret reveals its name');

    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await evaluate(`(() => { window.__ashen.showLevels(); return 1; })()`);
    await sleep(350);
    const mobile = await evaluate(`(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      cards: document.querySelectorAll('.cistern-card').length,
      sectionWidth: document.querySelector('.cistern-section')?.getBoundingClientRect().width || 0,
      viewport: window.innerWidth,
    }))()`);
    check(mobile.overflow <= 1, `portrait 390x844 has no horizontal overflow (${mobile.overflow}px)`);
    check(mobile.cards === 7, 'portrait keeps all seven cistern cards');
    check(mobile.sectionWidth <= mobile.viewport, 'the cistern section fits the phone viewport');
    await send('Emulation.clearDeviceMetricsOverride');

    const boss = await evaluate(`(() => {
      const A = window.__ashen;
      A.cisternClear(2);
      A.cisternClear(3);
      A.startCisternStage(4);
      const spawned = { room: A.game.roomIndex, kind: A.game.boss?.kind || null, phases: A.game.boss?.maxPhases || 0, hp: A.game.boss?.maxHp || 0 };
      for (let i = 0; i < 400 && A.game.state !== 'victory'; i += 1) {
        if (A.game.boss && !A.game.boss.dying) A.damageBoss(260);
        A.step(1 / 120, {});
        A.drainEvents();
      }
      return {
        spawned,
        state: A.game.state,
        cleared: A.cistern.summary.bossCleared,
        bossClears: A.cistern.state.bossClears,
        victoryVisible: !document.getElementById('victory-screen').classList.contains('hidden'),
      };
    })()`);
    check(boss.spawned.room === 666, 'stage V loads the tide altar');
    check(boss.spawned.kind === 'tidebound' && boss.spawned.phases === 3, 'Vasska spawns with three phases');
    check(boss.state === 'victory', 'defeating Vasska ends the chapter');
    check(boss.cleared === true && boss.bossClears >= 1, 'the boss clear is recorded');
    check(boss.victoryVisible === true, 'the victory screen is shown');

    await send('Page.reload', { ignoreCache: true });
    await sleep(2600);
    for (let i = 0; i < 100; i += 1) {
      if (await evaluate('typeof window.__ashen === "object"').catch(() => false)) break;
      await sleep(150);
    }
    const persisted = await evaluate(`(() => {
      const A = window.__ashen;
      A.showLevels();
      return {
        halls: A.cistern.state.halls.slice(),
        boss: A.cistern.state.boss,
        secrets: A.cistern.summary.secretsFound,
        percent: A.cistern.summary.percent,
        cards: document.querySelectorAll('.cistern-card').length,
        label: document.getElementById('cistern-progress').textContent,
        version: A.version,
      };
    })()`);
    check(persisted.halls.every(Boolean), 'cleared halls survive a reload');
    check(persisted.boss === true && persisted.secrets === 1, 'boss and secret records survive a reload');
    check(persisted.percent >= 80, `completion percent is reported (${persisted.percent}%)`);
    check(persisted.cards === 7 && /TAHAP/.test(persisted.label), 'the section rebuilds after reload');
    check(persisted.version === '0.36.0', 'the reload keeps the 0.36.0 build');

    check(pageErrors.length === 0, `no console errors (${pageErrors.join(' | ')})`);

    console.log(`cistern smoke: ${checks.length} checks passed`);
  } finally {
    try { ws?.close(); } catch { /* ignore */ }
    chrome.kill();
    await sleep(400);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* windows lock */ }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
