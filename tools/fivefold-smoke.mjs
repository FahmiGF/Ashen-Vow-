// Fivefold Trials + Puzzle Adventure browser smoke (headless Chrome + CDP).
// Verifies the hubs, a real 20-enemy trial run, biome boss gating/reward,
// all one hundred puzzle stages, lore/index tabs, boss timers, paid hints, and
// save persistence across a reload.

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9247;

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
  const profile = mkdtempSync(join(tmpdir(), 'ashen-fivefold-'));
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
    const initial = await evaluate(`(async () => {
      const A = window.__ashen; A.clearProgress();
      // Trial and puzzle progress are sanitized when their (lazy) mode opens.
      await A.showTrials(); await A.showPuzzleAdventure(); A.showMenu();
      return { version: A.version, trials: !!A.progress.trials, puzzle: !!A.progress.puzzle };
    })()`);
    check('boot reports v0.36.0', initial.version, '0.36.0');
    check('save carries trial progress', initial.trials, true);
    check('save carries puzzle progress', initial.puzzle, true);

    const hubs = await evaluate(`(async () => {
      const A = window.__ashen;
      await A.showTrials();
      await A.loadMode('puzzle');
      return {
        view: A.menuView,
        biomes: document.querySelectorAll('.trials-biome').length,
        levels: document.querySelectorAll('[data-trial-level]').length,
        bosses: document.querySelectorAll('[data-trial-boss]').length,
        lockedBosses: [...document.querySelectorAll('[data-trial-boss]')].filter((b) => b.disabled).length,
        puzzleStages: (() => { A.showPuzzleAdventure(); return document.querySelectorAll('[data-puzzle-stage]').length; })(),
        puzzleArcs: document.querySelectorAll('.puzzle-arc-head').length,
        puzzleView: A.menuView,
      };
    })()`);
    check('trial hub opens from the menu', hubs.view, 'trials');
    check('hub lists twenty biomes', hubs.biomes, 20);
    check('hub lists one hundred levels', hubs.levels, 100);
    check('hub lists twenty biome bosses', hubs.bosses, 20);
    check('bosses start locked', hubs.lockedBosses, 20);
    check('puzzle hub lists one hundred stages', hubs.puzzleStages, 100);
    check('puzzle hub groups ten arcs', hubs.puzzleArcs, 10);
    check('puzzle view is active', hubs.puzzleView, 'puzzle');

    const codex = await evaluate(`(async () => {
      const A = window.__ashen;
      document.querySelector('[data-puzzle-tab="index"]').click();
      const indexCards = document.querySelectorAll('.puzzle-lore-card').length;
      const indexText = document.querySelector('#puzzle-body').textContent;
      document.querySelector('[data-puzzle-tab="lore"]').click();
      const loreCards = document.querySelectorAll('.puzzle-arc-lore').length;
      const loreText = document.querySelector('#puzzle-body').textContent;
      await A.showPuzzleAdventure('stages');
      return { indexCards, indexText, loreCards, loreText };
    })()`);
    check('index lists all twenty-three puzzle systems', codex.indexCards, 23);
    check('index carries real descriptions', /mekanisme|jalur|pipa/i.test(codex.indexText), true);
    check('lore lists ten arc chapters', codex.loreCards, 10);
    check('lore carries the lost-mechanism story', /mekanisme|sumpah|penjaga/i.test(codex.loreText), true);

    const hint = await evaluate(`(async () => {
      const A = window.__ashen;
      await A.showPuzzleAdventure();
      A.progress.expansion.echoes = 250;
      await A.startPuzzleStage(0);
      document.querySelector('#btn-puzzle-hint').click();
      const paid = { echoes: A.progress.expansion.echoes, hints: A.puzzle.progress.stats.hints, status: document.querySelector('#puzzle-status').textContent };
      A.progress.expansion.echoes = 50;
      document.querySelector('#btn-puzzle-hint').click();
      const poor = { echoes: A.progress.expansion.echoes, hints: A.puzzle.progress.stats.hints, status: document.querySelector('#puzzle-status').textContent };
      return { paid, poor };
    })()`);
    check('hint deducts 100 campaign Gema', hint.paid.echoes, 150);
    check('hint records one purchase', hint.paid.hints, 1);
    check('hint reveals a solution step', /petak|pipa|cermin|tukar|putar|tekan|geser/i.test(hint.paid.status), true);
    check('insufficient Gema is not charged', hint.poor.echoes, 50);
    check('insufficient Gema gives no hint', hint.poor.hints, 1);
    check('insufficient Gema is explained', /tidak cukup/i.test(hint.poor.status), true);

    const run = await evaluate(`(async () => {
      const A = window.__ashen;
      await A.startTrialLevel('forgotten_crypt', 0);
      return { room: A.snap().room, enemies: A.game.enemies.length, total: A.trials.run.encounter.total, view: A.menuView };
    })()`);
    check('trial level enters its arena', run.view, 'none');
    check('first wave spawns five enemies', run.enemies, 5);
    check('encounter budget is twenty', run.total, 20);

    const cleared = await evaluate(`(() => {
      const A = window.__ashen;
      for (let wave = 0; wave < 4; wave += 1) {
        A.game.enemies.length = 0;
        A.step(0.1);
      }
      A.step(1.5);
      return { cleared: A.trials.progress.cleared.forgotten_crypt[0], view: A.menuView };
    })()`);
    check('first trial level records completion', cleared.cleared, true);
    check('trial returns to the hub', cleared.view, 'trials');

    const boss = await evaluate(`(async () => {
      const A = window.__ashen;
      for (let index = 1; index < 5; index += 1) {
        await A.startTrialLevel('forgotten_crypt', index);
        for (let wave = 0; wave < 4; wave += 1) { A.game.enemies.length = 0; A.step(0.1); }
        A.step(1.5);
      }
      const unlocked = !document.querySelector('[data-trial-boss="forgotten_crypt"]').disabled;
      await A.startTrialBoss('forgotten_crypt');
      const bossName = A.game.boss?.name || '';
      for (let hit = 0; hit < 8; hit += 1) { A.damageBoss(999999); A.step(0.4); A.drainEvents(); }
      A.step(2.5);
      A.drainEvents();
      return {
        unlocked, bossName, bosses: A.trials.progress.bosses.length, view: A.menuView,
        bossHp: A.game.boss ? A.game.boss.hp : null, state: A.snap().state,
        cleared: A.trials.progress.cleared.forgotten_crypt.filter(Boolean).length,
      };
    })()`);
    check('five clears unlock the biome boss', boss.unlocked, true);
    check('biome boss spawns in its arena', boss.bossName, 'Gravebound King');
    check('boss reward is recorded once', boss.bosses, 1);
    check('all five clears were banked before the boss', boss.cleared, 5);

    const timed = await evaluate(`(async () => {
      const A = window.__ashen;
      await A.showPuzzleAdventure('stages');
      for (let index = 0; index < 9; index += 1) {
        await A.startPuzzleStage(index);
        let guard = 0;
        while (!A.puzzle.run.done && guard < 5) { A.solveCurrentPuzzle(); guard += 1; }
      }
      await A.startPuzzleStage(9);
      const before = { visible: !document.querySelector('#puzzle-timer').classList.contains('hidden'), limit: A.puzzleTimer.timeLimit, label: document.querySelector('#puzzle-timer').textContent };
      A.expirePuzzleTimer();
      return before;
    })()`);
    check('arc finale shows the boss timer', timed.visible, true);
    check('boss timer is ninety seconds', timed.limit, 90);
    check('boss timer labels the finale', /BOSS-TIMED/i.test(timed.label), true);
    await sleep(1600);
    const timeout = await evaluate(`(() => {
      const A = window.__ashen;
      return { view: A.menuView, timeouts: A.puzzle.progress.stats.timeouts, solved: A.puzzle.progress.solved.length };
    })()`);
    check('expired boss timer fails the stage', timeout.timeouts, 1);
    check('expired boss timer returns to the hub', timeout.view, 'puzzle');
    check('failed boss stage does not grant progress', timeout.solved, 9);

    const puzzles = await evaluate(`(async () => {
      const A = window.__ashen;
      await A.showPuzzleAdventure('stages');
      let solved = 0;
      for (let index = 0; index < 100; index += 1) {
        await A.startPuzzleStage(index);
        let guard = 0;
        while (!A.puzzle.run.done && guard < 5) { A.solveCurrentPuzzle(); guard += 1; }
        if (A.puzzle.progress.solved.includes(A.puzzle.run.stage.id)) solved += 1;
      }
      return { solved, abilities: A.puzzle.progress.abilities.length, solvedList: A.puzzle.progress.solved.length, bosses: A.puzzle.progress.bosses.length };
    })()`);
    check('all one hundred puzzle stages solve', puzzles.solved, 100);
    check('ten Metroidvania abilities unlock', puzzles.abilities, 10);
    check('all ten puzzle bosses are recorded', puzzles.bosses, 10);

    await send('Page.reload');
    await sleep(300);
    await boot();
    const persisted = await evaluate(`(() => {
      const A = window.__ashen;
      return {
        trialClears: A.progress.trials.cleared.forgotten_crypt.filter(Boolean).length,
        bosses: A.progress.trials.bosses.length,
        puzzleSolved: A.progress.puzzle.solved.length,
        abilities: A.progress.puzzle.abilities.length,
        puzzleBosses: A.progress.puzzle.bosses.length,
        timeouts: A.progress.puzzle.stats.timeouts,
      };
    })()`);
    check('trial clears survive reload', persisted.trialClears, 5);
    check('trial boss survives reload', persisted.bosses, 1);
    check('puzzle progress survives reload', persisted.puzzleSolved, 100);
    check('puzzle abilities survive reload', persisted.abilities, 10);
    check('puzzle bosses survive reload', persisted.puzzleBosses, 10);
    check('boss timeout count survives reload', persisted.timeouts, 1);
    await sleep(250);
    assert.deepEqual(pageErrors, [], `console errors: ${pageErrors.join(' | ')}`);
    console.log(`✔ fivefold smoke: ${checks.length} checks passed`);
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
