// Real-browser smoke test for Infinite Labyrinth (v0.7.0).
// Verifies: hub render, deterministic run start, real wave/boss/reward flow,
// cursed item application, run summary + persistence, and a live 2-player
// co-op lobby over the zero-dependency WebSocket relay with snapshots.
//
// Usage:
//   npm start            # or let this script boot its own server on PORT 4312
//   node tools/lab-smoke.mjs
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { VERSION, VERSION_RE } from './smoke-version.mjs';

const PORT = Number(process.env.LAB_PORT) || 4312;
const URL = process.env.ASHEN_URL || `http://127.0.0.1:${PORT}/`;
const CDP_PORT = Number(process.env.CDP_PORT) || 9336;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findBrowser() {
  const candidates = process.platform === 'win32'
    ? [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      ]
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium']
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const found = candidates.filter(Boolean).find((path) => existsSync(path));
  if (!found) throw new Error('No Chrome/Chromium found. Set CHROME_PATH.');
  return found;
}

let server = null;
try {
  const res = await fetch(URL, { method: 'HEAD' });
  if (!res.ok) throw new Error('not ok');
} catch {
  server = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
  });
  for (let i = 0; i < 50; i += 1) {
    await sleep(100);
    try {
      const res = await fetch(URL, { method: 'HEAD' });
      if (res.ok) break;
    } catch {
      /* retry */
    }
  }
}

const profile = mkdtempSync(join(tmpdir(), 'ashen-lab-'));
const chrome = spawn(findBrowser(), [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--disable-extensions',
  '--mute-audio',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--window-size=1280,800',
  URL,
], { stdio: 'ignore' });

let ws;
let nextId = 0;
const pending = new Map();
const pageErrors = [];
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, (message) => (message.error ? reject(new Error(message.error.message)) : resolve(message.result)));
  ws.send(JSON.stringify({ id, method, params }));
});
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  }
  return result.result.value;
}

const results = [];
function check(name, condition, detail = '') {
  results.push({ name, ok: !!condition, detail });
  assert.ok(condition, `${name}${detail ? ` — ${detail}` : ''}`);
}

try {
  let page = null;
  for (let i = 0; i < 80; i += 1) {
    await sleep(150);
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
      page = list.find((target) => target.type === 'page' && target.url.startsWith(URL));
      if (page) break;
    } catch {
      /* retry */
    }
  }
  assert.ok(page, 'Chrome page target');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const callback = pending.get(message.id);
      if (callback) {
        pending.delete(message.id);
        callback(message);
      }
      return;
    }
    if (message.method === 'Runtime.exceptionThrown') {
      pageErrors.push(message.params.exceptionDetails?.exception?.description || 'exception');
    } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      pageErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.bringToFront');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Page.setWebLifecycleState', { state: 'active' });

  let booted = false;
  for (let i = 0; i < 120; i += 1) {
    await sleep(150);
    try {
      booted = await evaluate('!!(window.__ashen && window.__ashen.game)');
    } catch {
      booted = false;
    }
    if (booted) break;
  }
  assert.ok(booted, 'window.__ashen booted');

  const boot = await evaluate(`(() => {
    const a = window.__ashen;
    a.clearProgress();
    a.showLabyrinth('run');
    return {
      version: a.version,
      menu: a.menuView,
      modes: document.querySelectorAll('[data-lab-mode]').length,
      summaryCells: document.querySelectorAll('#lab-summary .lab-stat').length,
      tabs: document.querySelectorAll('[data-lab-tab]').length,
      titleVisible: !document.getElementById('labyrinth-screen').classList.contains('hidden'),
    };
  })()`);
  check(`boot reports v${VERSION}`, boot.version === VERSION, boot.version);
  check('lab hub shows 10 modes and 5 tabs', boot.modes === 10 && boot.tabs === 5, JSON.stringify(boot));
  check('lab hub renders', boot.menu === 'labyrinth' && boot.titleVisible);

  const started = await evaluate(`(() => {
    const a = window.__ashen;
    a.startLabyrinth('standard');
    return {
      started: a.started,
      menu: a.menuView,
      enemies: a.game.enemies.length,
      boss: !!a.game.boss,
      cycle: a.labyrinth.run.cycle,
      hud: !document.getElementById('lab-hud').classList.contains('hidden'),
      zone: a.labyrinth.run.zoneId,
      weapons: a.game.player.weapons.length,
    };
  })()`);
  check('run starts inside the labyrinth', started.started && started.menu === 'none', JSON.stringify(started));
  check('first wave spawns 2–3 enemies', started.enemies >= 2 && started.enemies <= 3, String(started.enemies));
  check('lab HUD is visible', started.hud);
  check('cycle 1 and a zone are assigned', started.cycle === 1 && !!started.zone, started.zone);

  // Play the first cycle by clearing real waves with the live frame loop.
  let rewardState = null;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await evaluate(`(() => {
      const a = window.__ashen;
      a.game.player.invuln = 10;
      a.game.player.hp = a.game.player.maxHp;
      for (let i = 0; i < 12 && a.dialogueOpen; i += 1) a.advanceDialogue();
      a.closeDialogue?.();
      a.game.enemies.forEach((enemy) => { enemy.dead = true; enemy.hp = 0; });
      if (a.game.boss) {
        a.game.boss.intro = 0;
        a.game.boss.invuln = 0;
        a.game.boss.dialogue = null;
        a.game.damageBoss(1e9);
        for (let i = 0; i < 12 && a.dialogueOpen; i += 1) a.advanceDialogue();
      }
      return true;
    })()`);
    await sleep(220);
    rewardState = await evaluate(`(() => {
      const a = window.__ashen;
      return {
        rewardsOpen: a.labyrinth.rewardsOpen,
        rewards: a.labyrinth.rewards.map((reward) => ({ type: reward.type, item: reward.itemId || null, name: reward.name })),
        cycle: a.labyrinth.run.cycle,
        bosses: a.labyrinth.run.stats.bossesDefeated,
        ticks: a.labyrinth.ticks,
        engaged: a.labyrinth.engaged,
        waveIndex: a.labyrinth.waveIndex,
        totalWaves: a.labyrinth.totalWaves,
        alive: a.labyrinth.alive,
        boss: !!a.game.boss,
        bossHp: a.game.boss?.hp ?? null,
        dialogueOpen: a.dialogueOpen,
        state: a.game.state,
        summaryOpen: a.labyrinth.summaryOpen,
      };
    })()`);
    if (attempt % 10 === 0) console.log('lab progress', JSON.stringify(rewardState));
    if (rewardState.rewardsOpen) break;
  }
  check('reward chamber opens after the boss', rewardState?.rewardsOpen, JSON.stringify(rewardState));
  check('reward chamber offers 3–4 choices', rewardState.rewards.length >= 3, String(rewardState.rewards.length));
  check('boss defeat was counted', rewardState.bosses >= 1, String(rewardState.bosses));

  const itemIndex = rewardState.rewards.findIndex((reward) => reward.type === 'item');
  const chosen = await evaluate(`(() => {
    const a = window.__ashen;
    for (let i = 0; i < 12 && a.dialogueOpen; i += 1) a.advanceDialogue();
    const before = a.labyrinth.run.items.length;
    const index = ${Math.max(0, itemIndex)};
    const ok = a.chooseLabReward(index);
    return {
      ok,
      itemsBefore: before,
      itemsAfter: a.labyrinth.run.items.length,
      cycle: a.labyrinth.run.cycle,
      rewardsOpen: a.labyrinth.rewardsOpen,
      enemies: a.game.enemies.length,
      hp: a.game.player.hp,
      maxHp: a.game.player.maxHp,
    };
  })()`);
  check('reward selection advances to the next cycle', chosen.ok && !chosen.rewardsOpen && chosen.cycle === 2, JSON.stringify(chosen));
  check('item reward is applied to the run loadout', itemIndex < 0 || chosen.itemsAfter > chosen.itemsBefore, JSON.stringify(chosen));

  const summary = await evaluate(`(() => {
    const a = window.__ashen;
    a.game.player.invuln = 0;
    a.game.player.hp = 1;
    a.game.damagePlayer(999, 0);
    return new Promise((resolve) => setTimeout(() => resolve({
      summaryOpen: a.labyrinth.summaryOpen,
      best: a.labyrinth.progress.best.cycle,
      history: a.labyrinth.progress.history.length,
      screen: !document.getElementById('lab-summary-screen').classList.contains('hidden'),
      deadScreen: document.getElementById('dead-screen').classList.contains('hidden'),
    }), 500));
  })()`);
  check('death records a run and shows the lab summary', summary.summaryOpen && summary.history >= 1, JSON.stringify(summary));
  check('generic death screen is suppressed in the labyrinth', summary.deadScreen);

  const coop = await evaluate(`(() => {
    const a = window.__ashen;
    a.closeLabSummary();
    a.showLabyrinth('coop');
    a.labHostCoop();
    return new Promise((resolve) => setTimeout(() => resolve({
      role: a.labyrinth.coop.role,
      code: a.labyrinth.coop.code,
      status: a.labyrinth.coop.status,
      connected: a.labyrinth.coop.connected,
      hostButtons: document.querySelectorAll('[data-lab-action]').length,
    }), 900));
  })()`);
  check('co-op host creates a room over WebSocket', coop.role === 'host' && coop.connected && coop.code.length === 5, JSON.stringify(coop));
  check('co-op panel exposes lobby actions', coop.hostButtons >= 3, String(coop.hostButtons));

  const guestMessages = [];
  const guest = new WebSocket(`ws://127.0.0.1:${PORT}/ws?room=${coop.code}`);
  guest.addEventListener('message', (event) => {
    try {
      guestMessages.push(JSON.parse(event.data));
    } catch {
      /* ignore */
    }
  });
  await new Promise((resolve, reject) => {
    guest.addEventListener('open', resolve, { once: true });
    guest.addEventListener('error', reject, { once: true });
  });
  guest.send(JSON.stringify({ type: 'lab_join', name: 'Guest Lyna', classId: 'lyna' }));
  await sleep(500);
  const lobby = await evaluate(`(() => {
    const a = window.__ashen;
    return {
      players: a.labyrinth.coop.lobby?.players?.length || 0,
      names: a.labyrinth.coop.lobby?.players?.map((player) => player.name) || [],
    };
  })()`);
  check('guest joins the host lobby', lobby.players === 2 && lobby.names.includes('Guest Lyna'), JSON.stringify(lobby));

  await evaluate(`window.__ashen.labStartCoopSession()`);
  await sleep(1600);
  const session = await evaluate(`(() => {
    const a = window.__ashen;
    return {
      started: a.started,
      run: !!a.labyrinth.run,
      partySize: a.labyrinth.run?.partySize || 0,
      allies: a.game.allies.length,
      cycle: a.labyrinth.run?.cycle || 0,
    };
  })()`);
  check('host starts a real co-op session', session.started && session.run && session.partySize === 2, JSON.stringify(session));
  check('host simulates the guest companion', session.allies >= 1, String(session.allies));
  check('guest receives welcome and snapshots', guestMessages.some((m) => m.type === 'lab_welcome') && guestMessages.some((m) => m.type === 'snapshot'), `messages=${[...new Set(guestMessages.map((m) => m.type))].join(',')}`);
  guest.close();
  await evaluate(`window.__ashen.showMenu()`);

  // Campaign co-op: a second guest joins, the host starts a real campaign run,
  // and the snapshot carries scene/room/two identified players.
  const campaignHost = await evaluate(`(() => {
    const A = window.__ashen;
    A.showCoop();
    document.querySelector('[data-coop-mode="campaign"]').click();
    A.labHostCoop();
    return new Promise((resolve) => setTimeout(() => resolve({
      role: A.labyrinth.coop.role,
      code: A.labyrinth.coop.code,
      mode: A.labyrinth.coop.mode,
      connected: A.labyrinth.coop.connected,
      visible: !document.getElementById('labyrinth-screen').classList.contains('hidden'),
    }), 900));
  })()`);
  check('campaign co-op host creates a room', campaignHost.role === 'host' && campaignHost.connected && campaignHost.mode === 'campaign', JSON.stringify(campaignHost));

  const campaignMessages = [];
  const campaignGuest = new WebSocket(`ws://127.0.0.1:${PORT}/ws?room=${campaignHost.code}`);
  campaignGuest.addEventListener('message', (event) => {
    try { campaignMessages.push(JSON.parse(event.data)); } catch { /* ignore */ }
  });
  await new Promise((resolve, reject) => {
    campaignGuest.addEventListener('open', resolve, { once: true });
    campaignGuest.addEventListener('error', reject, { once: true });
  });
  campaignGuest.send(JSON.stringify({ type: 'lab_join', name: 'Guest Kael', classId: 'kael' }));
  await sleep(450);
  const campaignStart = await evaluate(`(() => {
    const A = window.__ashen;
    A.labStartCoopSession();
    return new Promise((resolve) => setTimeout(() => resolve({
      started: A.started,
      room: A.game.roomIndex,
      roomName: A.game.room?.name,
      allies: A.game.allies.length,
      mode: A.labyrinth.coop.mode,
      role: A.labyrinth.coop.role,
    }), 900));
  })()`);
  check('campaign host starts room 1 with a companion', campaignStart.started && campaignStart.room === 0 && campaignStart.allies === 1, JSON.stringify(campaignStart));
  const campaignStartPacket = campaignMessages.find((message) => message.type === 'coop_start');
  const campaignSnapshot = campaignMessages.find((message) => message.type === 'snapshot' && message.delta?.sc === 'campaign');
  check('guest receives campaign start metadata', !!campaignStartPacket && campaignStartPacket.mode === 'campaign', JSON.stringify(campaignStartPacket));
  check('guest receives campaign room/scene snapshot', !!campaignSnapshot && campaignSnapshot.delta.ri === 0, JSON.stringify(campaignSnapshot?.delta && { scene: campaignSnapshot.delta.sc, room: campaignSnapshot.delta.ri }));
  check('campaign snapshot identifies both players', !!campaignSnapshot && campaignSnapshot.delta.p.filter((row) => row[7]).length >= 2, JSON.stringify(campaignSnapshot?.delta?.p));
  campaignGuest.close();
  await evaluate(`window.__ashen.showMenu()`);

  const guestView = await evaluate(`(() => {
    const A = window.__ashen;
    A.startCoopGuestForTest({
      mode: 'campaign',
      lobby: {
        started: true,
        players: [
          { id: 'p1', name: 'Host', host: true, classId: 'sera' },
          { id: 'p2', name: 'Sera Vayne', host: false, classId: 'sera' },
        ],
      },
    });
    const applied = A.applyCoopTestSnapshot({
      v: 1, t: 2, k: 1, sc: 'campaign', ri: 0, rn: 'Gerbang Abu', ty: ['crawler'],
      p: [[0, 3600, 6784, 100, 100, 0, 1, 'p1'], [1, 1680, 6784, 80, 100, 0, 1, 'p2']],
      e: [[0, 3040, 6784, 34, 34, 0, -1]], b: null, bm: null, pr: [],
    });
    return { applied, guest: A.labyrinth.coop.guest, active: A.started, room: A.game.roomIndex, hp: A.game.player.hp, allies: A.game.allies.map((ally) => ally.id) };
  })()`);
  check('guest applies its own player slot, not the host', guestView.applied?.selfId === 'p2' && guestView.applied?.playerX > 419 && guestView.applied?.playerX < 421, JSON.stringify(guestView));
  check('guest snapshot keeps host as a companion and spawns enemies', guestView.allies.includes('p1') && guestView.guest === true, JSON.stringify(guestView));
  await evaluate(`window.__ashen.showMenu()`);

  check('no runtime exceptions or console errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
  console.log(JSON.stringify({ ok: true, checks: results.length, results }, null, 2));
} finally {
  try {
    ws?.close();
  } catch {
    /* ignore */
  }
  chrome.kill();
  server?.kill();
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}
