// Riftwar browser smoke: real Chrome + CDP, hero picker, battle canvas, ability,
// lane simulation, victory/defeat results and save persistence.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9251;

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
  const profile = mkdtempSync(join(tmpdir(), 'ashen-moba-'));
  const chrome = spawn(findBrowser(), [
    '--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--mute-audio',
    '--window-size=1280,900', URL,
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
    for (let i = 0; i < 100; i += 1) {
      try {
        const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
        list = await response.json();
        if (list.some((target) => target.type === 'page' && target.url.startsWith(URL))) break;
      } catch { /* starting */ }
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
      if (message.method === 'Runtime.exceptionThrown') pageErrors.push(message.params.exceptionDetails?.exception?.description || 'exception');
      else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') pageErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
      else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error' && !/favicon|429|Too Many Requests/i.test(message.params.entry.text || '')) pageErrors.push(message.params.entry.text);
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, (message) => (message.error ? reject(new Error(`${method}: ${message.error.message}`)) : resolve(message.result)));
      ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const boot = async () => {
      for (let i = 0; i < 100; i += 1) {
        try {
          if (await evaluate('typeof window.__ashen === "object" && document.readyState === "complete"')) return;
        } catch { /* loading */ }
        await sleep(120);
      }
      throw new Error('game did not boot');
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Log.enable');
    await send('Page.bringToFront');
    await boot();

    const hub = await evaluate(`(async () => {
      const A = window.__ashen;
      A.clearProgress();
      await A.showMoba();
      return {
        view: A.menuView,
        heroes: document.querySelectorAll('[data-moba-hero]').length,
        maps: document.querySelectorAll('[data-moba-map]').length,
        lanes: document.querySelectorAll('[data-moba-lane]').length,
        difficulties: document.querySelectorAll('[data-moba-difficulty]').length,
        codex: document.querySelectorAll('.moba-codex article').length,
        save: !!A.progress.moba,
        total: A.moba.summary.heroes,
      };
    })()`);
    check('Riftwar hub opens from the menu', hub.view, 'moba');
    check('all thirty-three classes are selectable', hub.heroes, 33);
    check('hub exposes all three battlefields', hub.maps, 3);
    check('hub exposes all five lanes', hub.lanes, 5);
    check('hub exposes four difficulties', hub.difficulties, 4);
    check('hub codex has units, jungle bosses and map lore', hub.codex, 3);
    check('save carries moba progress', hub.save, true);
    check('hero summary counts every class', hub.total, 33);

    const selected = await evaluate(`(() => {
      const A = window.__ashen;
      document.querySelector('[data-moba-hero="frontier_riftwalker"]').click();
      document.querySelector('[data-moba-map="ember_vale"]').click();
      document.querySelector('[data-moba-lane="top"]').click();
      document.querySelector('[data-moba-difficulty="veteran"]').click();
      const start = document.querySelector('#btn-moba-start');
      return {
        hero: A.moba.heroId,
        map: A.moba.mapId,
        lane: A.moba.lane,
        difficulty: A.moba.difficulty,
        label: start.textContent,
      };
    })()`);
    check('hero picker selects a frontier class', selected.hero, 'frontier_riftwalker');
    check('map picker selects Ember Vale', selected.map, 'ember_vale');
    check('lane picker selects top lane', selected.lane, 'top');
    check('difficulty picker selects Veteran', selected.difficulty, 'veteran');
    check('start button names the selected hero', /Riftwalker/.test(selected.label), true);

    const battle = await evaluate(`(async () => {
      const A = window.__ashen;
      await A.startMobaBattle();
      return {
        view: A.menuView,
        active: A.moba.active,
        snapshot: A.moba.snapshot,
        abilities: document.querySelectorAll('[data-moba-cast]').length,
        playerHp: document.querySelector('#moba-player-hp-text').textContent,
        teamBlue: document.querySelectorAll('#moba-team-blue .mt-row').length,
        teamRed: document.querySelectorAll('#moba-team-red .mt-row').length,
      };
    })()`);
    check('battle screen becomes active', battle.view, 'mobaBattle');
    check('match reports active', battle.active, true);
    check('selected hero enters the match', battle.snapshot.heroId, 'frontier_riftwalker');
    check('all ten heroes spawn', battle.snapshot.counts.blue + battle.snapshot.counts.red, 10);
    check('four abilities render in the HUD', battle.abilities, 4);
    check('player HP renders', battle.playerHp.includes(' / '), true);
    check('blue team scoreboard has five rows', battle.teamBlue, 5);
    check('red team scoreboard has five rows', battle.teamRed, 5);

    const action = await evaluate(`(async () => {
      const A = window.__ashen;
      const canvas = document.querySelector('#moba-canvas');
      const rect = canvas.getBoundingClientRect();
      const point = { clientX: rect.left + rect.width * 0.62, clientY: rect.top + rect.height * 0.52 };
      canvas.dispatchEvent(new PointerEvent('pointerdown', { ...point, bubbles: true, pointerId: 1 }));
      const before = { x: A.moba.snapshot.player.hp, time: A.moba.snapshot.time };
      const move = A.moba.snapshot.player;
      A.mobaSetOrder(move.x + 220, move.y);
      A.mobaStep(1.2);
      const afterMove = A.moba.snapshot.player;
      const mana = afterMove.mana;
      const cast = A.mobaCast(0, { x: A.moba.snapshot.player.x + 250, y: A.moba.snapshot.player.y });
      A.mobaStep(0.1);
      return { before, move, afterMove, cast, mana, afterMana: A.moba.snapshot.player.mana };
    })()`);
    check('pointer input is accepted by the battlefield', action.move.lane, 'top');
    check('click-to-move changes hero position', Math.hypot(action.afterMove.x - action.move.x, action.afterMove.y - action.move.y) > 30, true);
    check('ability cast succeeds', action.cast.ok, true);
    check('ability consumes mana', action.afterMana < action.mana, true);

    const simulated = await evaluate(`(() => {
      const A = window.__ashen;
      const snap = A.mobaStep(92);
      return {
        time: snap.time,
        wave: snap.wave,
        minions: snap.counts.minions,
        towers: snap.counts.towers,
        epics: snap.counts.epics,
        phase: snap.phase,
      };
    })()`);
    check('match clock advances', simulated.time >= 90, true);
    check('minion waves spawn in the lanes', simulated.minions > 0, true);
    check('towers stand until destroyed', simulated.towers >= 20, true);
    check('epic bosses arrive after the timer', simulated.epics >= 2, true);

    const victory = await evaluate(`(() => {
      const A = window.__ashen;
      A.mobaDamageCore('red', 99999);
      return {
        result: A.moba.result,
        phase: A.moba.snapshot.phase,
        winner: A.moba.snapshot.winner,
        visible: !document.querySelector('#moba-result').classList.contains('hidden'),
        matches: A.progress.moba.matches,
        wins: A.progress.moba.wins,
      };
    })()`);
    check('destroying the enemy nexus ends the match', victory.phase, 'ended');
    check('blue wins when the red nexus falls', victory.winner, 'blue');
    check('result overlay appears', victory.visible, true);
    check('recorded result is a win', victory.result.win, true);
    check('first match is saved', victory.matches, 1);
    check('victory increments wins', victory.wins, 1);

    const rematch = await evaluate(`(() => {
      const A = window.__ashen;
      document.querySelector('[data-moba-action="rematch"]').click();
      const started = { view: A.menuView, phase: A.moba.snapshot.phase, matches: A.progress.moba.matches };
      A.mobaDamageCore('blue', 99999);
      return {
        started,
        win: A.moba.result.win,
        phase: A.moba.snapshot.phase,
        matches: A.progress.moba.matches,
        losses: A.progress.moba.losses,
        heroes: A.moba.result.heroes.length,
      };
    })()`);
    check('rematch starts a fresh match', rematch.started.phase, 'playing');
    check('rematch does not double-record the previous result', rematch.started.matches, 1);
    check('losing the blue nexus is recorded as defeat', rematch.win, false);
    check('defeat increments losses', rematch.losses, 1);
    check('second match is saved', rematch.matches, 2);
    check('result table contains all ten heroes', rematch.heroes, 10);

    const left = await evaluate(`(() => {
      const A = window.__ashen;
      document.querySelector('[data-moba-action="leave"]').click();
      return { view: A.menuView, active: A.moba.active, result: A.moba.result, heroes: document.querySelectorAll('[data-moba-hero]').length };
    })()`);
    check('leaving the result returns to the hub', left.view, 'moba');
    check('battle simulation stops on leave', left.active, false);
    check('result is cleared on leave', left.result, null);
    check('hero roster still renders after leave', left.heroes, 33);

    await send('Page.reload');
    await sleep(350);
    await boot();
    const persisted = await evaluate(`(async () => {
      const A = window.__ashen;
      await A.showMoba();
      return {
        matches: A.progress.moba.matches,
        wins: A.progress.moba.wins,
        losses: A.progress.moba.losses,
        heroPlays: A.progress.moba.heroPlays.frontier_riftwalker,
        mapWins: A.progress.moba.mapWins.ember_vale,
        cards: document.querySelectorAll('[data-moba-hero]').length,
      };
    })()`);
    check('moba match count survives reload', persisted.matches, 2);
    check('moba wins survive reload', persisted.wins, 1);
    check('moba losses survive reload', persisted.losses, 1);
    check('hero play count survives reload', persisted.heroPlays, 2);
    check('map win survives reload', persisted.mapWins, 1);
    check('roster survives reload', persisted.cards, 33);

    await sleep(300);
    assert.deepEqual(pageErrors, [], `console errors: ${pageErrors.join(' | ')}`);
    console.log(`✔ moba smoke: ${checks.length} checks passed`);
  } finally {
    try { ws?.close(); } catch { /* ignore */ }
    chrome.kill();
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
