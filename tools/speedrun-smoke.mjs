// Speedrun challenge mode browser smoke test (headless Chrome + CDP).
//
// Verifies the 2× start, the single-life death summary, lethal pits, the
// Oathbreaker escalation to 3×, and that records survive a reload.
//
// Usage:
//   npm start
//   node tools/speedrun-smoke.mjs
//
// Env: ASHEN_URL, CHROME_PATH, CDP_PORT (default 9238).

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9238;

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

  const profile = mkdtempSync(join(tmpdir(), 'ashen-speedrun-'));
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

    const boot = await evaluate(`(async () => {
      const A = window.__ashen;
      A.clearProgress();
      await A.loadMode('speedrun'); // the speedrun block is sanitized when its mode loads
      return { version: A.version, title: document.title, progress: A.speedrun.progress };
    })()`);
    check('boot reports v0.36.0', boot.version, '0.36.0');
    assert.match(boot.title, /0\.36\.0/);
    check('speedrun save starts empty', boot.progress.bestMultiplier, 0);

    const hub = await evaluate(`(() => {
      const A = window.__ashen;
      document.getElementById('btn-speedrun-menu').click();
      return {
        view: A.menuView,
        rules: document.querySelectorAll('.speedrun-rules li').length,
        rungs: document.querySelectorAll('.speedrun-rung').length,
        start: document.getElementById('speedrun-start').textContent.trim(),
        startHidden: document.getElementById('speedrun-screen').classList.contains('hidden'),
      };
    })()`);
    check('speedrun hub opens', hub.view, 'speedrun');
    check('hub lists five rules', hub.rules, 5);
    check('hub ladder shows five records plus endless', hub.rungs, 7);
    check('start button names the 2x run', hub.start, 'MULAI SPEEDRUN 2×');
    check('hub is visible', hub.startHidden, false);

    await evaluate(`document.getElementById('speedrun-start').click()`);
    await sleep(900);
    const started = await evaluate(`(() => {
      const A = window.__ashen;
      return {
        runKind: A.runKind,
        started: A.started,
        room: A.game.roomIndex,
        state: A.game.state,
        oneLife: A.game.oneLife,
        multiplier: A.speedrun.multiplier,
        cycle: A.speedrun.run.cycle,
        checkpoint: A.game.respawnAtCheckpoint(),
        badge: document.getElementById('speedrun-badge').textContent.trim(),
        badgeHidden: document.getElementById('speedrun-badge').classList.contains('hidden'),
      };
    })()`);
    check('speedrun starts as its own run kind', started.runKind, 'speedrun');
    check('run starts in room 0', started.room, 0);
    check('run is live', started.state, 'playing');
    check('run has exactly one life flag', started.oneLife, true);
    check('run starts at 2x', started.multiplier, 2);
    check('run starts on cycle 0', started.cycle, 0);
    check('checkpoint revival is refused', started.checkpoint, false);
    check('hud badge shows the multiplier and life', /2×/.test(started.badge) && /1 NYAWA/.test(started.badge), true);
    check('hud badge is visible', started.badgeHidden, false);

    // The clock must run faster than real time. Measure 700 ms of wall clock.
    const pacing = await evaluate(`(async () => {
      const A = window.__ashen;
      const t0 = A.game.time;
      const r0 = performance.now();
      await new Promise((resolve) => setTimeout(resolve, 700));
      return { game: A.game.time - t0, real: (performance.now() - r0) / 1000 };
    })()`);
    check('simulated time outruns wall clock', pacing.game > pacing.real * 1.5, true);

    // Pit fall ends the run instead of respawning.
    const pit = await evaluate(`(() => {
      const A = window.__ashen;
      A.game.player.x = 420;
      A.game.player.y = 700;
      A.game.player.vy = 220;
      for (let i = 0; i < 8 && A.game.state === 'playing'; i += 1) A.game.update(1 / 120, {});
      return { state: A.game.state, hp: A.game.player.hp };
    })()`);
    check('speedrun pit is lethal', pit.state, 'dead');
    check('pit fall leaves no health', pit.hp, 0);

    await sleep(500);
    const ended = await evaluate(`(() => {
      const A = window.__ashen;
      const saved = JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-progress-v1')).speedrun;
      return {
        summaryOpen: A.speedrun.summaryOpen,
        screenHidden: document.getElementById('speedrun-summary-screen').classList.contains('hidden'),
        deadHidden: document.getElementById('dead-screen').classList.contains('hidden'),
        runs: saved.runs,
        deaths: saved.deaths,
        best: saved.bestMultiplier,
        attempts: A.speedrun.lastSummary?.multiplier,
      };
    })()`);
    check('death opens the speedrun summary', ended.summaryOpen, true);
    check('summary screen is visible', ended.screenHidden, false);
    check('generic death screen stays hidden', ended.deadHidden, true);
    check('the death is recorded', ended.runs, 1);
    check('the death is counted separately', ended.deaths, 1);
    check('best multiplier is recorded', ended.best, 2);

    // Restart from the summary and clear the final boss to escalate to 3x.
    await evaluate(`document.getElementById('speedrun-summary-again').click()`);
    await sleep(700);
    const restarted = await evaluate(`(() => {
      const A = window.__ashen;
      return {
        room: A.game.roomIndex,
        state: A.game.state,
        multiplier: A.speedrun.multiplier,
        summaryOpen: A.speedrun.summaryOpen,
      };
    })()`);
    check('summary restart begins a fresh 2x run', restarted.multiplier, 2);
    check('summary restart returns to room 0', restarted.room, 0);
    check('summary restart resumes play', restarted.state, 'playing');
    check('summary closes on restart', restarted.summaryOpen, false);

    const clear = await evaluate(`(() => {
      const A = window.__ashen;
      A.game.enterRoom(7);
      for (let i = 0; i < 400 && A.game.state === 'playing'; i += 1) {
        if (A.game.boss) {
          A.game.boss.invuln = 0;
          A.game.damageBoss(4000);
        }
        A.step(1 / 120, {});
      }
      return { state: A.game.state, boss: !!A.game.boss };
    })()`);
    assert.ok(['victory', 'playing'].includes(clear.state), 'final boss must fall');

    await sleep(1200);
    const escalated = await evaluate(`(() => {
      const A = window.__ashen;
      const saved = JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-progress-v1')).speedrun;
      return {
        multiplier: A.speedrun.multiplier,
        cycle: A.speedrun.run.cycle,
        room: A.game.roomIndex,
        state: A.game.state,
        badge: document.getElementById('speedrun-badge').textContent.trim(),
        clears: saved.clears,
        best: saved.bestMultiplier,
        summaryOpen: A.speedrun.summaryOpen,
      };
    })()`);
    check('final boss death escalates to 3x', escalated.multiplier, 3);
    check('escalation advances the cycle', escalated.cycle, 1);
    check('escalation restarts the campaign', escalated.room, 0);
    check('escalation keeps the run alive', escalated.state, 'playing');
    check('badge follows the new multiplier', /3×/.test(escalated.badge), true);
    check('cleared cycles are recorded', escalated.clears, 1);
    check('best multiplier follows the escalation', escalated.best, 3);
    check('escalation never opens the death summary', escalated.summaryOpen, false);

    // A second death at 3x must end the run and keep the 3x record.
    const death2 = await evaluate(`(() => {
      const A = window.__ashen;
      A.game.player.invuln = 0;
      A.game.damagePlayer(9999, 0);
      return { state: A.game.state };
    })()`);
    check('second death ends the run', death2.state, 'dead');
    await sleep(500);
    const final = await evaluate(`(() => {
      const A = window.__ashen;
      const saved = JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-progress-v1')).speedrun;
      return { runs: saved.runs, best: saved.bestMultiplier, text: document.getElementById('speedrun-summary-body').textContent };
    })()`);
    check('second run is recorded', final.runs, 2);
    check('record holds the highest multiplier', final.best, 3);
    check('summary reports the run multiplier', /3×/.test(final.text), true);

    const history = await evaluate(`(() => {
      const saved = JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-progress-v1')).speedrun;
      return { len: saved.history.length, entries: saved.history };
    })()`);
    check('history records every attempt', history.len, 3);
    check('history leads with the latest death', history.entries[0].died, true);
    check('history keeps the cleared cycle', history.entries[1].died, false);
    check('history keeps the earliest attempt', history.entries[2].multiplier, 2);
    check('history keeps the attempt details', history.entries[1].time > 0 && typeof history.entries[1].rooms === 'number', true);

    // Reload: records and the hub summary must survive.
    await send('Page.reload');
    await sleep(2600);
    const reloaded = await evaluate(`(async () => {
      const A = window.__ashen;
      document.getElementById('btn-speedrun-menu').click();
      await A.loadMode('speedrun');
      return {
        view: A.menuView,
        best: A.speedrun.progress.bestMultiplier,
        runs: A.speedrun.progress.runs,
        summary: document.getElementById('speedrun-summary').textContent,
        entries: document.querySelectorAll('#update-log .update-entry').length,
        rows: document.querySelectorAll('.speedrun-history-row').length,
        rowFits: (() => {
          const row = document.querySelector('.speedrun-history-row');
          if (!row) return false;
          const rect = row.getBoundingClientRect();
          return rect.left >= -1 && rect.right <= window.innerWidth + 1;
        })(),
        historyHead: /RIWAYAT RUN/.test(document.getElementById('speedrun-body').textContent),
        rowText: document.querySelector('.speedrun-history-row')?.textContent || '',
      };
    })()`);
    check('hub reopens after reload', reloaded.view, 'speedrun');
    check('best multiplier survives reload', reloaded.best, 3);
    check('run count survives reload', reloaded.runs, 2);
    check('hub summary shows the record', /3×/.test(reloaded.summary), true);
    check('hub renders the run history', reloaded.historyHead, true);
    check('history rows survive reload', reloaded.rows, 3);
    check('history rows fit the panel', reloaded.rowFits, true);
    check('history rows name the outcome', /GUGUR|TUNTAS/.test(reloaded.rowText), true);

    check('no console errors', pageErrors.length, 0);
    if (pageErrors.length) console.error(pageErrors.join('\n'));

    console.log(`\nSPEEDRUN SMOKE PASS — ${checks.length} checks`);
  } finally {
    try {
      ws?.close();
    } catch {
      // Already closed.
    }
    chrome.kill();
    await sleep(200);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      // Windows can keep the profile locked for a moment.
    }
  }
}

main().catch((error) => {
  console.error('SPEEDRUN SMOKE FAIL');
  console.error(error);
  process.exitCode = 1;
});
