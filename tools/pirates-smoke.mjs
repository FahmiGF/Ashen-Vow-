// Pirate Tide browser smoke: real Chrome + CDP. Hub, open-sea battle,
// movement, broadsides, stage boss, result, save progress and phone layout.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9264;

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
  const profile = mkdtempSync(join(tmpdir(), 'ashen-pirates-'));
  const chrome = spawn(findBrowser(), [
    '--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--mute-audio',
    '--window-size=1280,900', URL,
  ], { stdio: 'ignore' });

  let ws;
  const pageErrors = [];
  const checks = [];
  const check = (value, name, expected = true) => {
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

    const bootState = await evaluate(`(() => ({
      version: window.__ashen.gameVersion || document.querySelector('#updates-version')?.textContent || '',
      title: document.title,
      hasPirate: !!document.getElementById('btn-pirate-menu'),
      hasScreen: !!document.getElementById('pirate-screen'),
      hasBattle: !!document.getElementById('pirate-battle'),
    }))()`);
    check(bootState.hasPirate && bootState.hasScreen && bootState.hasBattle, 'Pirate Tide screens exist');
    check(/0\.34\./.test(`${bootState.version} ${bootState.title}`), `boots v0.34.0 (${bootState.title})`);

    const hub = await evaluate(`(() => {
      const A = window.__ashen;
      A.clearProgress();
      A.showPirates();
      return {
        view: A.menuView,
        cards: document.querySelectorAll('[data-pirate-stage]').length,
        unlocked: document.querySelectorAll('[data-pirate-stage]:not([disabled])').length,
        islands: document.querySelectorAll('#pirate-world .pirate-island').length,
        ports: document.querySelectorAll('#pirate-world .pirate-island.port').length,
        stats: document.querySelectorAll('#pirate-summary .pirate-stat').length,
        bosses: A.pirates.bosses.length,
        ships: A.pirates.shipTypes.length,
        active: A.pirates.active,
        actTwoLocked: !!document.querySelector('[data-pirate-stage="mist_hunt"]')?.disabled,
        finaleLocked: !!document.querySelector('[data-pirate-stage="first_vow"]')?.disabled,
      };
    })()`);
    check(hub.view === 'pirates', 'the Pirate Tide hub opens from the menu');
    check(hub.cards === 10, 'ten captain routes render');
    check(hub.unlocked === 1, 'only the first route starts unlocked');
    check(hub.islands === 10 && hub.ports === 7, 'ten islands and seven ports render');
    check(hub.stats === 6 && hub.bosses === 10 && hub.ships >= 8, 'summary, ships and captains are real');
    check(hub.actTwoLocked, 'act two routes stay locked behind the first five');
    check(!hub.active, 'the hub does not start a voyage by itself');

    const start = await evaluate(`(() => {
      const A = window.__ashen;
      A.setPirateStage('first_tide');
      A.startPirateVoyage();
      const s = A.pirates.snapshot;
      return {
        view: A.menuView,
        active: A.pirates.active,
        battleHidden: document.getElementById('pirate-battle').classList.contains('hidden'),
        controlsHidden: document.getElementById('pirate-controls').classList.contains('hidden'),
        stage: s.stageName,
        hp: s.player.hp,
        maxHp: s.player.maxHp,
        enemies: s.enemies.length,
        target: s.targetKills,
        port: s.nearPort,
      };
    })()`);
    check(start.view === 'piratesBattle' && start.active, 'a voyage starts in the open sea');
    check(!start.battleHidden && !start.controlsHidden, 'battle canvas and controls are visible');
    check(start.stage === 'Pasang Pertama' && start.hp === 300 && start.maxHp === 300, 'the player ship starts at full hull');
    check(start.enemies >= 3, 'roaming enemy ships are spawned');
    check(start.target === 4 && start.port !== null, 'the route has a bounty and open-sea ports');

    await sleep(900);
    const canvas = await evaluate(`(() => {
      const c = document.getElementById('pirate-canvas');
      const ctx = c.getContext('2d');
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let lit = 0;
      let total = 0;
      for (let i = 0; i < data.length; i += 320) {
        total += 1;
        if (data[i] + data[i + 1] + data[i + 2] > 38) lit += 1;
      }
      return { lit, total };
    })()`);
    check(canvas.lit > canvas.total * 0.2, `the open sea renders live frames (${canvas.lit}/${canvas.total})`);

    const moved = await evaluate(`(() => {
      const A = window.__ashen;
      const before = A.pirates.snapshot.player;
      A.pirateSetControls(1, 0);
      A.pirateStep(1);
      const after = A.pirates.snapshot.player;
      return { distance: Math.hypot(after.x - before.x, after.y - before.y), hp: after.hp, phase: A.pirates.snapshot.phase };
    })()`);
    check(moved.distance > 20, 'WASD throttle moves the ship through the open world');
    check(moved.phase === 'sailing' && moved.hp > 0, 'sailing does not end by itself');

    const guns = await evaluate(`(() => {
      const A = window.__ashen;
      A.pirateSetControls(0, 0);
      const first = A.pirateFire(1);
      const shots = A.pirates.snapshot.shotsFired;
      const second = A.pirateFire(1);
      A.pirateStep(0.2);
      return { first, second, shots, reload: A.pirates.snapshot.reloadStarboard, hull: A.pirates.snapshot.player.hp };
    })()`);
    check(guns.first === true && guns.shots > 0, 'starboard broadside fires real cannonballs');
    check(guns.second === false && guns.reload > 0, 'the same broadside must reload');
    check(guns.hull > 0, 'the ship survives the test volley');

    const boss = await evaluate(`(() => {
      const A = window.__ashen;
      A.pirateSetKills(4);
      const spawned = A.pirates.snapshot.bossSpawned;
      const bossName = A.pirates.snapshot.bossName;
      const sunk = A.pirateSinkBoss();
      return {
        spawned, bossName, sunk,
        phase: A.pirates.snapshot.phase,
        result: A.pirates.result,
        card: !!document.querySelector('#pirate-result .pirate-result-card'),
        cleared: !!A.progress.pirates.stages.first_tide?.cleared,
        wins: A.progress.pirates.wins,
      };
    })()`);
    check(boss.spawned && boss.bossName.includes('Morrow'), 'the stage captain spawns after the bounty');
    check(boss.sunk && boss.phase === 'cleared', 'sinking the captain completes the route');
    check(boss.result?.win === true && boss.result?.score > 0, 'the result reports a real victory');
    check(boss.card, 'the victory overlay renders');
    check(boss.cleared && boss.wins === 1, 'route progress is saved to the main progress object');

    const next = await evaluate(`(() => {
      const A = window.__ashen;
      A.showPirates();
      A.setPirateStage('bell_below');
      return {
        stage: A.pirates.stageId,
        unlocked: !document.querySelector('[data-pirate-stage="bell_below"]')?.disabled,
        cleared: A.pirates.summary.cleared,
        finaleLocked: !!document.querySelector('[data-pirate-stage="first_vow"]')?.disabled,
      };
    })()`);
    check(next.stage === 'bell_below' && next.unlocked, 'clearing route one unlocks route two');
    check(next.cleared === 1, 'the hub summary counts the cleared route');
    check(next.finaleLocked, 'the act two finale stays sealed after a single clear');

    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await sleep(250);
    const mobile = await evaluate(`(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      cards: document.querySelectorAll('[data-pirate-stage]').length,
      visible: !document.getElementById('pirate-screen').classList.contains('hidden'),
    }))()`);
    check(mobile.overflow <= 1, `phone layout has no horizontal overflow (${mobile.overflow}px)`);
    check(mobile.cards === 10 && mobile.visible, 'the hub remains usable at 390x844');

    const mobileBattle = await evaluate(`(() => {
      const A = window.__ashen;
      A.setPirateStage('first_tide');
      A.startPirateVoyage();
      const battle = document.getElementById('pirate-battle');
      const canvas = document.getElementById('pirate-canvas');
      const controls = document.getElementById('pirate-controls');
      const fire = document.getElementById('btn-pirate-fire-starboard');
      const rect = battle.getBoundingClientRect();
      const fireRect = fire.getBoundingClientRect();
      const shotsBefore = A.pirates.snapshot.shotsFired;
      fire.click();
      const result = {
        position: getComputedStyle(battle).position,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        innerW: window.innerWidth,
        innerH: window.innerHeight,
        canvasW: canvas.width,
        canvasH: canvas.height,
        controlsVisible: !controls.classList.contains('hidden'),
        fireInView: fireRect.left >= 0 && fireRect.right <= window.innerWidth && fireRect.bottom <= window.innerHeight,
        shotsBefore,
        shotsAfter: A.pirates.snapshot.shotsFired,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      };
      A.leavePirates();
      return result;
    })()`);
    check(mobileBattle.position === 'fixed', 'the phone battle escapes the 16:9 frame');
    check(
      mobileBattle.width >= mobileBattle.innerW - 2 && mobileBattle.height >= mobileBattle.innerH - 2,
      `the naval battle fills 390x844 (${mobileBattle.width}x${mobileBattle.height})`,
    );
    check(mobileBattle.canvasW >= 320 && mobileBattle.canvasH >= 800, 'the battle canvas resizes for portrait');
    check(mobileBattle.controlsVisible && mobileBattle.fireInView, 'touch fire controls stay on screen');
    check(mobileBattle.shotsAfter > mobileBattle.shotsBefore, 'the touch cannon button fires a broadside');
    check(mobileBattle.overflow <= 1, `the battle adds no horizontal overflow (${mobileBattle.overflow}px)`);

    await send('Page.reload');
    await boot();
    const reload = await evaluate(`(() => {
      const A = window.__ashen;
      A.showPirates();
      return {
        cleared: !!A.progress.pirates.stages.first_tide?.cleared,
        unlocked: !document.querySelector('[data-pirate-stage="bell_below"]')?.disabled,
        wins: A.progress.pirates.wins,
      };
    })()`);
    check(reload.cleared && reload.unlocked && reload.wins === 1, 'route clears survive a full page reload');

    // Act two: open the first five routes, then run the mist hunt end to end.
    const actTwo = await evaluate(`(() => {
      const A = window.__ashen;
      const stages = A.pirates.stages;
      for (let i = 0; i < 5; i += 1) {
        A.progress.pirates.stages[stages[i].id] = { runs: 1, cleared: true, bestScore: 100, bestTime: 60 };
      }
      A.showPirates();
      const unlocked = !document.querySelector('[data-pirate-stage="mist_hunt"]')?.disabled;
      A.setPirateStage('mist_hunt');
      A.startPirateVoyage();
      A.pirateSetKills(9);
      const bossName = A.pirates.snapshot.bossName;
      const routeName = A.pirates.snapshot.stageName;
      const sunk = A.pirateSinkBoss();
      A.showPirates();
      return {
        unlocked,
        routeName,
        bossName,
        sunk,
        cleared: !!A.progress.pirates.stages.mist_hunt?.cleared,
        nextUnlocked: !document.querySelector('[data-pirate-stage="hollow_tide"]')?.disabled,
      };
    })()`);
    check(actTwo.unlocked && actTwo.routeName === 'Perburuan Kabut', 'five clears unlock the first act two route');
    check(actTwo.bossName.includes('Heron'), 'the act two captain spawns with its own flagship');
    check(actTwo.sunk && actTwo.cleared, 'sinking the act two captain saves the route');
    check(actTwo.nextUnlocked, 'the act two chain advances to Pasang Kosong');

    // Endless tide: surges grow the fleet, captains are bounties, not a finish.
    const endless = await evaluate(`(() => {
      const A = window.__ashen;
      A.showPirates();
      const winsBefore = A.progress.pirates.wins;
      const clearedBefore = A.pirates.summary.cleared;
      document.querySelector('[data-pirate-endless]').click();
      const start = A.pirates.snapshot;
      A.pirateNextSurge();
      A.pirateNextSurge();
      const surged = A.pirates.snapshot;
      const captainName = surged.bossName;
      const playerId = surged.player.id;
      A.pirateSinkBoss();
      const afterCaptain = A.pirates.snapshot;
      A.pirateDamageShip(playerId, 99999);
      return {
        mode: start.mode,
        endless: start.endless,
        stage: start.stageName,
        baseHp: start.player.maxHp,
        surge: surged.surge,
        surgeNext: surged.surgeNext,
        surgedHp: surged.player.maxHp,
        captainName,
        captainPhase: afterCaptain.phase,
        sunk: A.progress.pirates.endless,
        resultEndless: !!A.pirates.result?.endless,
        winsBefore,
        wins: A.progress.pirates.wins,
        clearedBefore,
        cleared: A.pirates.summary.cleared,
      };
    })()`);
    check(endless.endless && endless.mode === 'endless', 'the hub starts the endless tide');
    check(endless.stage === 'Pasang Tak Berujung', 'the endless tide has its own stage name');
    check(endless.surge === 3 && endless.surgeNext === 3, 'surges advance the tide counter');
    check(endless.surgedHp === endless.baseHp + 24, 'every surge upgrades the hull');
    check(!!endless.captainName && endless.captainPhase === 'sailing', 'a captain arrives on the third surge but the run continues');
    check(endless.resultEndless && endless.sunk?.runs >= 1 && endless.sunk?.bestSurge >= 3, 'a sunk run records in the endless ledger');
    check(endless.wins === endless.winsBefore && endless.cleared === endless.clearedBefore, 'endless runs never count as route wins');

    check(pageErrors.length === 0, `no runtime or console errors (${pageErrors.length})`);

    console.log(`\nPirate Tide smoke: ${checks.length}/${checks.length} checks passed`);
    if (pageErrors.length) console.log(pageErrors.join('\n'));
  } finally {
    try { ws?.close(); } catch { /* already closed */ }
    chrome.kill();
    await sleep(250);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* windows lock */ }
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
