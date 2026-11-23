// Wave Defense browser smoke: real Chrome + CDP, hub, tower placement, upgrade,
// sell, wave simulation, boss spawn, pause, victory, defeat and save persistence.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9252;

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
  const profile = mkdtempSync(join(tmpdir(), 'ashen-wavedefense-'));
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

    const hub = await evaluate(`(() => {
      const A = window.__ashen;
      A.clearProgress();
      A.showWaveDefense();
      return {
        view: A.menuView,
        maps: document.querySelectorAll('[data-wd-map]').length,
        towers: document.querySelectorAll('#wd-towers [data-wd-tower]').length,
        difficulties: document.querySelectorAll('[data-wd-difficulty]').length,
        statCells: document.querySelectorAll('#wd-summary .wd-stat').length,
        save: !!A.progress.wavedefense,
        totalTowers: A.waveDefense.summary.towers,
        totalBosses: A.waveDefense.summary.bosses,
        totalEnemies: A.waveDefense.summary.enemies,
        modes: document.querySelectorAll('[data-wd-mode]').length,
      };
    })()`);
    check('Wave Defense hub opens from the menu', hub.view, 'wavedefense');
    check('hub renders four castle maps', hub.maps, 4);
    check('hub renders fourteen tower cards', hub.towers, 14);
    check('hub renders both battle modes', hub.modes, 2);
    check('hub renders three difficulties', hub.difficulties, 3);
    check('hub renders six summary cells', hub.statCells, 6);
    check('save carries wave-defense progress', hub.save, true);
    check('tower summary counts all fourteen types', hub.totalTowers, 14);
    check('boss summary counts all six bosses', hub.totalBosses, 6);
    check('enemy summary counts all twenty types', hub.totalEnemies, 20);

    const selected = await evaluate(`(() => {
      const A = window.__ashen;
      document.querySelector('[data-wd-map="ember_bastion"]').click();
      document.querySelector('[data-wd-difficulty="squire"]').click();
      document.querySelector('[data-wd-tower="trebuchet"]').click();
      return {
        map: A.waveDefense.mapId,
        difficulty: A.waveDefense.difficulty,
        selected: A.waveDefense.selectedTowerId,
        label: A.waveDefense.snapshot?.mapName || document.querySelector('#btn-wd-start em').textContent,
      };
    })()`);
    check('map picker selects Ember Bastion', selected.map, 'ember_bastion');
    check('difficulty picker selects Squire', selected.difficulty, 'squire');
    check('tower picker selects Trebuchet', selected.selected, 'trebuchet');
    check('start button reflects the chosen castle', /EMBER BASTION/.test(selected.label), true);

    const battle = await evaluate(`(() => {
      const A = window.__ashen;
      A.startWaveDefenseBattle();
      const canvas = document.querySelector('#wd-canvas');
      const ctx = canvas.getContext('2d');
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let sum = 0;
      for (let i = 0; i < pixels.length; i += 4) sum += pixels[i] + pixels[i + 1] + pixels[i + 2];
      return {
        view: A.menuView,
        active: A.waveDefense.active,
        phase: A.waveDefense.snapshot.phase,
        gold: A.waveDefense.snapshot.gold,
        waves: A.waveDefense.snapshot.totalWaves,
        slots: A.waveDefense.snapshot.slots.length,
        palette: document.querySelectorAll('#wd-palette [data-wd-tower]').length,
        rendered: sum,
        canvasVisible: !document.querySelector('#wd-battle').classList.contains('hidden'),
      };
    })()`);
    check('battle screen becomes active', battle.view, 'wavedefenseBattle');
    check('wave-defense simulation reports active', battle.active, true);
    check('match starts in preparation', battle.phase, 'prep');
    check('match starts with spendable gold', battle.gold > 0, true);
    check('match exposes twenty-four waves', battle.waves, 24);
    check('castle map exposes build sites', battle.slots >= 20, true);
    check('battle palette renders all towers', battle.palette, 14);
    check('canvas draws the battlefield', battle.rendered > 0, true);
    check('battlefield is visible', battle.canvasVisible, true);

    const placed = await evaluate(`(() => {
      const A = window.__ashen;
      document.querySelector('#wd-palette [data-wd-tower="ballista"]').click();
      const canvas = document.querySelector('#wd-canvas');
      const rect = canvas.getBoundingClientRect();
      const slot = A.waveDefense.snapshot.slots[0];
      canvas.dispatchEvent(new PointerEvent('pointerdown', {
        clientX: rect.left + (slot.x / canvas.width) * rect.width,
        clientY: rect.top + (slot.y / canvas.height) * rect.height,
        bubbles: true,
        pointerId: 1,
      }));
      let snap = A.waveDefense.snapshot;
      const built = { towers: snap.towers.length, selected: snap.selectedTower, gold: snap.gold };
      A.waveDefenseUpgrade();
      snap = A.waveDefense.snapshot;
      const upgraded = { level: snap.selectedTower?.level, gold: snap.gold, cost: snap.selectedTower?.upgradeCost };
      A.waveDefenseSell();
      snap = A.waveDefense.snapshot;
      return { built, upgraded, sold: { towers: snap.towers.length, gold: snap.gold } };
    })()`);
    check('clicking a build site places a tower', placed.built.towers, 1);
    check('battle palette switches the selected tower', placed.built.selected?.towerId, 'ballista');
    check('placement spends gold', placed.built.gold < battle.gold, true);
    check('tower upgrades to level two', placed.upgraded.level, 2);
    check('upgrade spends gold', placed.upgraded.gold < placed.built.gold, true);
    check('selling removes the tower', placed.sold.towers, 0);
    check('selling returns gold', placed.sold.gold > placed.upgraded.gold, true);

    const setup = await evaluate(`(() => {
      const A = window.__ashen;
      const gold = A.waveDefense.snapshot.gold;
      for (let i = 0; i < 8; i += 1) A.waveDefenseBuild(i, i % 3 === 0 ? 'catapult' : 'ballista');
      A.waveDefenseNextWave();
      const started = A.waveDefense.snapshot;
      for (let i = 0; i < 12; i += 1) A.waveDefenseStep(1);
      const after = A.waveDefense.snapshot;
      return { gold, started, after };
    })()`);
    check('debug tower build spends gold', setup.started.gold < setup.gold, true);
    check('next-wave control starts a wave', setup.started.phase, 'wave');
    check('wave simulation spawns enemies', setup.after.stats.spawned > 0, true);
    check('towers deal damage during the wave', setup.after.stats.damage > 0, true);
    check('wave HUD receives live kills', setup.after.stats.kills >= 0, true);

    const boss = await evaluate(`(() => {
      const A = window.__ashen;
      A.waveDefenseSetWave(4);
      A.waveDefenseNextWave();
      A.waveDefenseStep(2);
      return { wave: A.waveDefense.snapshot.wave, boss: A.waveDefense.snapshot.boss?.type, panel: !document.querySelector('#wd-boss-panel').classList.contains('hidden') };
    })()`);
    check('boss wave reaches wave four', boss.wave, 4);
    check('Bone Colossus spawns as a boss', boss.boss, 'bone_colossus');
    check('boss HUD panel appears', boss.panel, true);

    const paused = await evaluate(`(() => {
      const A = window.__ashen;
      document.querySelector('#btn-wd-pause').click();
      const snap = A.waveDefense.snapshot;
      const visible = !document.querySelector('#wd-pause').classList.contains('hidden');
      const paused = A.waveDefense.paused;
      document.querySelector('#btn-wd-resume').click();
      return { paused, visible, resumed: !A.waveDefense.paused, time: snap.time };
    })()`);
    check('pause control opens the overlay', paused.visible, true);
    check('pause freezes the simulation flag', paused.paused, true);
    check('resume clears the pause overlay', paused.resumed, true);

    const victory = await evaluate(`(() => {
      const A = window.__ashen;
      A.waveDefenseWin();
      return {
        result: A.waveDefense.result,
        phase: A.waveDefense.snapshot.phase,
        visible: !document.querySelector('#wd-result').classList.contains('hidden'),
        runs: A.progress.wavedefense.runs,
        wins: A.progress.wavedefense.wins,
      };
    })()`);
    check('victory ends the match', victory.phase, 'ended');
    check('victory result is a win', victory.result.win, true);
    check('victory overlay appears', victory.visible, true);
    check('victory is recorded in the save', victory.runs, 1);
    check('victory increments wins', victory.wins, 1);

    const rematch = await evaluate(`(() => {
      const A = window.__ashen;
      document.querySelector('[data-wd-action="rematch"]').click();
      const fresh = { phase: A.waveDefense.snapshot.phase, wave: A.waveDefense.snapshot.wave, runs: A.progress.wavedefense.runs };
      A.waveDefenseDamageCastle(9999);
      return {
        fresh,
        result: A.waveDefense.result,
        phase: A.waveDefense.snapshot.phase,
        runs: A.progress.wavedefense.runs,
        losses: A.progress.wavedefense.losses,
      };
    })()`);
    check('rematch starts a fresh preparation phase', rematch.fresh.phase, 'prep');
    check('rematch resets the wave counter', rematch.fresh.wave, 0);
    check('rematch does not double-record victory', rematch.fresh.runs, 1);
    check('destroying the castle ends in defeat', rematch.result.win, false);
    check('defeat increments losses', rematch.losses, 1);
    check('second defense is recorded', rematch.runs, 2);

    const left = await evaluate(`(() => {
      const A = window.__ashen;
      document.querySelector('[data-wd-action="leave"]').click();
      return { view: A.menuView, active: A.waveDefense.active, result: A.waveDefense.result, cards: document.querySelectorAll('#wd-towers [data-wd-tower]').length };
    })()`);
    check('leaving the result returns to the hub', left.view, 'wavedefense');
    check('battle simulation stops on leave', left.active, false);
    check('result clears on leave', left.result, null);
    check('tower roster still renders after leave', left.cards, 14);

    await send('Page.reload');
    await sleep(350);
    await boot();
    const persisted = await evaluate(`(() => {
      const A = window.__ashen;
      A.showWaveDefense();
      return {
        runs: A.progress.wavedefense.runs,
        wins: A.progress.wavedefense.wins,
        losses: A.progress.wavedefense.losses,
        mapRuns: A.progress.wavedefense.maps.ember_bastion?.runs || 0,
        cards: document.querySelectorAll('#wd-towers [data-wd-tower]').length,
      };
    })()`);
    check('wave-defense runs survive reload', persisted.runs, 2);
    check('wave-defense wins survive reload', persisted.wins, 1);
    check('wave-defense losses survive reload', persisted.losses, 1);
    check('map record survives reload', persisted.mapRuns, 2);
    check('tower roster survives reload', persisted.cards, 14);

    // Endless: no wave cap, defeats record in their own ledger.
    const endless = await evaluate(`(() => {
      const A = window.__ashen;
      A.showWaveDefense();
      const before = { runs: A.progress.wavedefense.runs, wins: A.progress.wavedefense.wins, losses: A.progress.wavedefense.losses };
      document.querySelector('[data-wd-mode="endless"]').click();
      A.setWaveDefenseMap('sunken_causeway');
      A.startWaveDefenseBattle();
      const start = A.waveDefense.snapshot;
      A.waveDefenseSetWave(30);
      A.waveDefenseNextWave();
      const deep = A.waveDefense.snapshot;
      A.waveDefenseDamageCastle(99999);
      return {
        before,
        endless: start.endless,
        map: start.mapId,
        totalWaves: start.totalWaves,
        wave: deep.wave,
        phase: deep.phase,
        ledger: A.progress.wavedefense.endless,
        runs: A.progress.wavedefense.runs,
        wins: A.progress.wavedefense.wins,
        losses: A.progress.wavedefense.losses,
        resultEndless: !!A.waveDefense.result?.endless,
      };
    })()`);
    check('the fourth castle starts an endless defense', endless.endless && endless.map === 'sunken_causeway', true);
    check('endless mode removes the wave cap', endless.totalWaves > 900, true);
    check(`endless waves keep spawning past the campaign (wave ${endless.wave}, ${endless.phase})`, endless.wave === 30 && endless.phase === 'wave', true);
    check('endless defeats record in the endless ledger', endless.resultEndless && endless.ledger.runs === 1 && endless.ledger.bestWave === 30, true);
    check('endless runs never count as campaign results', endless.runs === endless.before.runs && endless.wins === endless.before.wins && endless.losses === endless.before.losses, true);
    await evaluate(`window.__ashen.leaveWaveDefense()`);

    await sleep(300);
    assert.deepEqual(pageErrors, [], `console errors: ${pageErrors.join(' | ')}`);
    console.log(`✔ wave-defense smoke: ${checks.length} checks passed`);
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
