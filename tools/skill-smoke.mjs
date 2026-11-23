// Skill Point + Panggung Abadi browser smoke test (headless Chrome + CDP).
//
// Usage:
//   npm start
//   node tools/skill-smoke.mjs
//
// Env: ASHEN_URL, CHROME_PATH, CDP_PORT (default 9234).

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9234;

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

  const profile = mkdtempSync(join(tmpdir(), 'ashen-skill-'));
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
      return { version: A.version, title: document.title };
    })()`);
    check('boot reports v0.35.0', boot.version, '0.35.0');
    assert.match(boot.title, /0\.35\.0/);

    // Skill panel renders and spends a point.
    const panel = await evaluate(`(() => {
      const A = window.__ashen;
      document.getElementById('btn-character-menu').click();
      const nodes = document.querySelectorAll('#char-skill-list .skill-node').length;
      A.skills.points = 3;
      A.skills.earned = Math.max(A.skills.earned, 3);
      A.applySkills();
      A.buildCharacterScreen ? A.buildCharacterScreen() : null;
      const before = A.skillSummary.bonuses.ultDamage;
      const button = document.querySelector('#char-skill-list [data-skill="ult_damage"]');
      button.click();
      return {
        screen: A.menuView,
        nodes,
        before,
        after: A.skillSummary.bonuses.ultDamage,
        points: A.skills.points,
        saved: JSON.parse(localStorage.getItem('ashen-vow-progress-v1')).skills.ranks.ult_damage,
        label: document.getElementById('char-ability-key').textContent,
      };
    })()`);
    check('skill screen opens', panel.screen, 'character');
    check('six skill nodes render', panel.nodes, 6);
    check('spending raises ultimate damage', panel.after > panel.before, true);
    check('skill point consumed', panel.points, 2);
    check('rank persists to save', panel.saved, 1);
    assert.match(panel.label, /ULT ×1\.15/);

    // Pack hub renders and starts the first guardian.
    const hub = await evaluate(`(() => {
      const A = window.__ashen;
      document.getElementById('btn-court-menu').click();
      const cards = document.querySelectorAll('.pack-card').length;
      const first = document.querySelector('[data-action="start-pack"][data-index="0"]');
      const locked = document.querySelector('[data-action="start-pack"][data-index="1"]').disabled;
      first.click();
      return {
        cards,
        locked,
        runKind: A.runKind,
        boss: A.game.boss?.kind || null,
        phases: A.game.boss?.maxPhases || 0,
        hp: A.game.boss?.maxHp || 0,
        music: A.musicTrack,
        track: A.bossMusicFor ? A.bossMusicFor('pack_ashking') : null,
      };
    })()`);
    check('six pack cards render', hub.cards, 6);
    check('second guardian starts locked', hub.locked, true);
    check('first guardian spawns', hub.boss, 'pack_ashking');
    check('first guardian has three phases', hub.phases, 3);
    check('guardian uses its own boss theme', hub.track, 'bossAsh');

    // Kill through the gauntlet: each boss advances and the pack completes.
    const run = await evaluate(`(() => {
      const A = window.__ashen;
      const kinds = [];
      const trace = [];
      for (let i = 0; i < 6; i += 1) {
        const boss = A.game.boss;
        if (boss) kinds.push(boss.kind);
        trace.push({ i, kind: boss?.kind || null, hp: boss?.hp ?? null, runKind: A.runKind, state: A.game.state });
        A.game.player.invuln = 9999;
        A.game.player.hp = A.game.player.maxHp;
        A.damageBoss(99999);
        for (let f = 0; f < 400; f += 1) {
          A.game.player.invuln = 9999;
          A.game.player.hp = A.game.player.maxHp;
          A.step(1 / 120, {});
          A.drainEvents();
        }
        trace.push({ after: i, cleared: Object.keys(A.pack.cleared), next: A.game.boss?.kind || null, runKind: A.runKind, state: A.game.state });
      }
      return {
        kinds,
        trace,
        cleared: Object.keys(A.pack.cleared).length,
        gauntletClears: A.pack.gauntletClears,
        skillPoints: A.skills.points,
        menuView: A.menuView,
      };
    })()`);
    if (run.kinds.length !== 6) console.log('trace', JSON.stringify(run.trace));
    check('gauntlet walks all six guardians', run.kinds.length, 6);
    if (run.cleared !== 6) console.log('trace', JSON.stringify(run.trace, null, 1));
    check('all six guardians cleared', run.cleared, 6);
    check('gauntlet completion recorded', run.gauntletClears, 1);
    check('gauntlet paid skill points', run.skillPoints >= 7, true);

    // Reload persistence.
    await send('Page.reload', { ignoreCache: false });
    await sleep(2600);
    const reload = await evaluate(`(() => {
      const A = window.__ashen;
      return {
        version: A.version,
        ranks: A.skills.ranks.ult_damage,
        cleared: Object.keys(A.pack.cleared).length,
        points: A.skills.points,
      };
    })()`);
    check('save survives reload (rank)', reload.ranks, 1);
    check('save survives reload (pack)', reload.cleared, 6);
    assert.ok(reload.points >= 7);

    assert.deepEqual(pageErrors, [], `no console errors: ${pageErrors.join(' | ')}`);
    checks.push('no console errors');

    console.log(`PASS — ${checks.length} checks`);
    for (const name of checks) console.log(`  ✔ ${name}`);
  } finally {
    try {
      ws?.close();
    } catch {
      // ignore
    }
    chrome.kill();
    await sleep(400);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      // Windows may still hold the profile; harmless.
    }
  }
}

main().catch((error) => {
  console.error('FAIL —', error.message);
  process.exit(1);
});
