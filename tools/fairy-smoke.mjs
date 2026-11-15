// Faewood biome browser smoke test (headless Chrome + CDP).
//
// Walks the real 10-stage chain, checks that the bosses stay sealed until the
// tenth stage is cleared, then fights both bosses through the live UI.
//
// Usage:
//   npm start
//   node tools/fairy-smoke.mjs
//
// Env: ASHEN_URL, CHROME_PATH, CDP_PORT (default 9236).

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9236;

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

  const profile = mkdtempSync(join(tmpdir(), 'ashen-fairy-'));
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
      return { version: A.version, title: document.title, progressKey: !!localStorage.getItem('ashen-vow-progress-v1') };
    })()`);
    check('boot reports v0.10.0', boot.version, '0.10.0');
    assert.match(boot.title, /0\.10\.0/);

    const hub = await evaluate(`(() => {
      const A = window.__ashen;
      document.getElementById('btn-fairy-menu').click();
      const stages = document.querySelectorAll('.fairy-stage-card').length;
      const bosses = document.querySelectorAll('.fairy-boss-card').length;
      const stageButtons = [...document.querySelectorAll('[data-fairy-stage]')];
      const bossButtons = [...document.querySelectorAll('[data-fairy-boss]')];
      return {
        screen: A.menuView,
        stages,
        bosses,
        stage1Locked: stageButtons[0].disabled,
        stage2Locked: stageButtons[1].disabled,
        boss1Locked: bossButtons[0].disabled,
        summary: A.fairy.summary.stagesCleared,
        zones: document.querySelectorAll('.fairy-stage-card.locked').length,
      };
    })()`);
    check('fairy hub opens', hub.screen, 'fairy');
    check('ten stage cards render', hub.stages, 10);
    check('two boss cards render', hub.bosses, 2);
    check('stage 1 is playable', hub.stage1Locked, false);
    check('stage 2 starts locked', hub.stage2Locked, true);
    check('both bosses start locked', hub.boss1Locked, true);
    check('nine stages start locked', hub.zones, 9);
    check('fresh progress is empty', hub.summary, 0);

    await evaluate(`document.querySelector('[data-fairy-stage="0"]').click()`);
    await sleep(700);
    const start = await evaluate(`(() => {
      const A = window.__ashen;
      return {
        runKind: A.runKind,
        room: A.game.roomIndex,
        zone: A.game.room.zone,
        npc: A.game.room.npcs?.length || 0,
        music: A.musicTrack,
        enemies: A.game.enemies.length,
        activeStage: A.fairy.activeStage,
      };
    })()`);
    check('stage 1 starts a fairy run', start.runKind, 'fairy');
    check('stage 1 is room 414', start.room, 414);
    check('room uses the faewood zone', start.zone, 'faewood');
    check('stage 1 has a tiny NPC', start.npc, 1);
    check('faewood theme plays', start.music, 'faewood');
    check('stage 1 entry is safe', start.enemies, 0);
    check('active stage tracked', start.activeStage, 0);

    // Walk through the open gate of stage 1 into stage 2.
    const gate = await evaluate(`(() => {
      const A = window.__ashen;
      const g = A.game.gate;
      A.game.player.x = g.x + 4;
      A.game.player.y = 400;
      for (let i = 0; i < 40; i += 1) { A.step(1 / 120, {}); A.drainEvents(); }
      return {
        room: A.game.roomIndex,
        stage: A.fairy.activeStage,
        cleared: A.fairy.progress.stages[0],
        saved: JSON.parse(localStorage.getItem('ashen-vow-progress-v1')).fairy.stages[0],
        mobs: A.game.enemies.length,
      };
    })()`);
    check('gate leads to stage 2', gate.room, 415);
    check('stage 2 tracked as active', gate.stage, 1);
    check('stage 1 marked cleared', gate.cleared, true);
    check('stage 1 clear persisted', gate.saved, true);
    check('stage 2 spawns mushroom mobs', gate.mobs > 0, true);

    // Clear stages 2-10 through the real gates.
    const chain = await evaluate(`(() => {
      const A = window.__ashen;
      const trace = [];
      for (let i = 0; i < 9; i += 1) {
        A.game.player.invuln = 9999;
        A.game.player.hp = A.game.player.maxHp;
        for (const enemy of A.game.enemies.slice()) {
          A.game.hurtEnemy(enemy, { dmg: 99999, knock: 0, name: 'smoke' }, 1);
        }
        for (let f = 0; f < 60; f += 1) { A.step(1 / 120, {}); A.drainEvents(); }
        const g = A.game.gate;
        if (!g) { trace.push({ i, noGate: true, room: A.game.roomIndex }); break; }
        A.game.player.x = g.x + 4;
        A.game.player.y = 400;
        for (let f = 0; f < 40; f += 1) { A.step(1 / 120, {}); A.drainEvents(); }
        trace.push({ i, room: A.game.roomIndex, stage: A.fairy.activeStage, boss: A.fairy.activeBoss });
      }
      return {
        trace,
        room: A.game.roomIndex,
        stagesCleared: A.fairy.progress.stages.filter(Boolean).length,
        bossesUnlocked: A.fairy.summary.bossesUnlocked,
        boss: A.game.boss?.kind || null,
        music: A.musicTrack,
        bossTheme: A.bossMusicFor('fairy_magma_slime'),
      };
    })()`);
    if (chain.stagesCleared !== 10) console.log('trace', JSON.stringify(chain.trace, null, 1));
    check('all ten stages clear through real gates', chain.stagesCleared, 10);
    check('boss seal opens after stage 10', chain.bossesUnlocked, true);
    check('stage 10 leads into the magma arena', chain.room, 424);
    check('magma slime spawns', chain.boss, 'fairy_magma_slime');
    check('magma slime has its own theme', chain.bossTheme, 'magmaBoss');
    await sleep(700);
    check('magma theme is playing', await evaluate('window.__ashen.musicTrack'), 'magmaBoss');

    // Kill the slime, take the blessing, and enter the dragon arena.
    const slime = await evaluate(`(() => {
      const A = window.__ashen;
      A.game.boss.intro = 0;
      A.game.player.invuln = 9999;
      for (let i = 0; i < 40 && A.game.boss && !A.game.boss.dying; i += 1) A.damageBoss(99999);
      for (let f = 0; f < 200; f += 1) {
        A.game.player.invuln = 9999;
        A.game.player.hp = A.game.player.maxHp;
        A.step(1 / 120, {});
        A.drainEvents();
      }
      const blessing = A.game.state;
      A.chooseBlessing(0);
      for (let f = 0; f < 30; f += 1) A.step(1 / 120, {});
      const g = A.game.gate;
      A.game.player.x = g.x + 4;
      A.game.player.y = 400;
      for (let f = 0; f < 40; f += 1) { A.step(1 / 120, {}); A.drainEvents(); }
      return {
        blessing,
        room: A.game.roomIndex,
        boss: A.game.boss?.kind || null,
        music: A.musicTrack,
        slimeCleared: A.fairy.progress.bosses.magma,
        saved: JSON.parse(localStorage.getItem('ashen-vow-progress-v1')).fairy.bosses.magma,
      };
    })()`);
    check('slime defeat opens the blessing screen', slime.blessing, 'blessing');
    check('slime kill is recorded', slime.slimeCleared, true);
    check('slime clear persisted', slime.saved, true);
    check('gate leads to the dragon', slime.room, 425);
    check('spectral dragon spawns', slime.boss, 'fairy_spectral_dragon');
    check('dragon has its own theme', slime.music, 'fairyBoss');

    // The 20-second portrait cutscene plays before the final fight.
    const intro = await evaluate(`(() => {
      const A = window.__ashen;
      const cut = A.cutscene;
      A.finishCutscene(true);
      return {
        active: cut.active,
        id: cut.id,
        duration: cut.duration,
        title: document.getElementById('cutscene-title').textContent,
      };
    })()`);
    check('final boss cutscene plays first', intro.active, true);
    check('cutscene is the boss portrait', intro.id, 'final_boss');
    check('boss portrait runs 20 seconds', intro.duration, 20);
    assert.match(intro.title, /SYLVARA/);
    await sleep(400);
    check('cutscene is skippable', await evaluate('window.__ashen.cutscene.active'), false);

    const dragon = await evaluate(`(() => {
      const A = window.__ashen;
      const boss = A.game.boss;
      boss.intro = 0;
      const trace = [];
      const forms = [];
      let guard = 0;
      while (boss && boss.phase < 4 && !boss.dying) {
        if ((guard += 1) > 40) throw new Error('phase loop stuck at ' + boss.phase + ' (' + boss.hp + '/' + boss.maxHp + ')');
        boss.invuln = 0;
        A.damageBoss(boss.maxHp * 0.26);
        trace.push({ phase: boss.phase, arena: A.game.arenaTheme?.id || null, name: boss.name });
        if (boss.phase >= 3) forms.push({ phase: boss.phase, arena: A.game.arenaTheme?.id || null, name: boss.name });
      }
      const fourPhases = boss?.maxPhases;
      A.game.player.invuln = 9999;
      for (let i = 0; i < 40 && boss && !boss.dying; i += 1) {
        boss.invuln = 0;
        A.damageBoss(99999);
      }
      for (let f = 0; f < 260; f += 1) {
        A.game.player.invuln = 9999;
        A.game.player.hp = A.game.player.maxHp;
        A.step(1 / 120, {});
        A.drainEvents();
      }
      return {
        state: A.game.state,
        fourPhases,
        forms,
        trace,
        complete: A.fairy.summary.complete,
        dragon: A.fairy.progress.bosses.dragon,
        best: A.fairy.summary.bestTime,
        arenaCleared: A.game.arenaTheme,
      };
    })()`);
    check('final boss has four phases', dragon.fourPhases, 4);
    check('phase 3 opens the heaven arena', dragon.forms[0]?.arena, 'heaven');
    check('phase 3 changes the boss form', /Seraph/.test(dragon.forms[0]?.name || ''), true);
    check('phase 4 opens the hell arena', dragon.forms[1]?.arena, 'hell');
    check('phase 4 becomes the demon lord', /Vharos/.test(dragon.forms[1]?.name || ''), true);
    check('dragon defeat wins the biome', dragon.state, 'victory');
    check('dragon clear recorded', dragon.dragon, true);
    check('biome reports complete', dragon.complete, true);
    check('best clear time stored', dragon.best > 0, true);
    check('arena returns to Faewood after victory', dragon.arenaCleared, null);

    // Celebration theme after the kill.
    await sleep(700);
    check('celebration theme plays on victory', await evaluate('window.__ashen.musicTrack'), 'celebration');

    // Post-credit epilogue rolls 30 seconds after the victory moment.
    await sleep(3200);
    const epilogue = await evaluate(`(() => {
      const A = window.__ashen;
      const cut = A.cutscene;
      return { active: cut.active, id: cut.id, duration: cut.duration, title: document.getElementById('cutscene-title').textContent };
    })()`);
    check('post-credit scene starts after the kill', epilogue.active, true);
    check('post-credit scene is the epilogue', epilogue.id, 'post_credit');
    check('post-credit scene runs 30 seconds', epilogue.duration, 30);
    assert.match(epilogue.title, /OPUS/);
    await evaluate('window.__ashen.finishCutscene(true)');
    await sleep(300);
    check('victory screen remains after epilogue', await evaluate('!document.getElementById("victory-screen").classList.contains("hidden")'), true);

    // Reload and confirm persistence in the hub.
    await send('Page.reload', { ignoreCache: true });
    await sleep(2600);
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        ready = await evaluate('typeof window.__ashen === "object"');
        if (ready) break;
      } catch {
        // still loading
      }
      await sleep(120);
    }
    assert.equal(ready, true);
    const reload = await evaluate(`(() => {
      const A = window.__ashen;
      document.getElementById('btn-fairy-menu').click();
      const buttons = [...document.querySelectorAll('[data-fairy-boss]')];
      return {
        stages: A.fairy.summary.stagesCleared,
        bosses: A.fairy.summary.bossesCleared,
        bossUnlocked: buttons.every((button) => !button.disabled),
        roster: A.fairy.summary.percent,
      };
    })()`);
    check('stages survive reload', reload.stages, 10);
    check('bosses survive reload', reload.bosses, 2);
    check('boss cards stay unlocked', reload.bossUnlocked, true);
    check('hub reports 100%', reload.roster, 100);

    check('no console errors', pageErrors.length, 0);
    if (pageErrors.length) console.log(pageErrors.join('\n'));
    console.log(`\nFAIRY SMOKE PASS — ${checks.length} checks`);
  } finally {
    try { ws?.close(); } catch { /* ignore */ }
    chrome.kill();
    await sleep(300);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

main().catch((error) => {
  console.error('FAIRY SMOKE FAIL');
  console.error(error);
  process.exitCode = 1;
});
