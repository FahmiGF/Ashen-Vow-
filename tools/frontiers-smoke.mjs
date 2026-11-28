// Infinite Frontiers browser smoke. Drives the real hub rail, a live 20-body
// level, a chapter boss, the full 100-level ladder, reload persistence and a
// 390x844 viewport through Chrome.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9352;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-frontiers-'));
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader', '--mute-audio', '--window-size=1400,900', BASE,
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
let seq = 0;
const pending = new Map();
const consoleErrors = [];
let passed = 0;
let failed = 0;

const check = (ok, label) => {
  if (ok) { passed += 1; console.log(`  ✓ ${label}`); } else { failed += 1; console.log(`  ✗ ${label}`); }
};

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, (message) => (message.error ? reject(new Error(message.error.message)) : resolve(message.result)));
  ws.send(JSON.stringify({ id, method, params }));
});

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(fn, timeout = 25000, label = 'condition') {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const value = await fn(); if (value) return value; } catch { /* retry */ }
    await sleep(150);
  }
  throw new Error(`timed out: ${label}`);
}

try {
  const pages = await waitFor(async () => {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    return list.some((entry) => entry.type === 'page' && entry.url.startsWith(BASE)) ? list : null;
  }, 20000, 'chrome page');
  const page = pages.find((entry) => entry.type === 'page' && entry.url.startsWith(BASE));
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const cb = pending.get(message.id);
      if (cb) { pending.delete(message.id); cb(message); }
      return;
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
    }
    if (message.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.bringToFront');
  await waitFor(() => evaluate('typeof window.__ashen === "object"'), 25000, 'boot');

  const boot = await evaluate(`(() => ({
    title: document.title,
    version: window.__ashen.version || null,
    entry: !!document.getElementById('btn-frontier-menu'),
    rooms: window.__ashen.frontiers.chapters.length,
  }))()`);
  check(!!boot.version && boot.title.includes(`v${boot.version}`), `the page boots as v${boot.version} (${boot.title})`);
  check(boot.entry === true, 'the menu keeps its INFINITE FRONTIERS entry');
  check(boot.rooms === 10, `the hub reports ten chapters (${boot.rooms})`);

  const locked = await evaluate(`(async () => {
    const a = window.__ashen;
    document.getElementById('btn-frontier-menu').click();
    await new Promise((r) => setTimeout(r, 220));
    const screen = document.getElementById('frontier-screen');
    return {
      open: !screen.classList.contains('hidden'),
      chips: document.querySelectorAll('.frontier-chip').length,
      cards: document.querySelectorAll('.frontier-level').length,
      play: document.querySelectorAll('[data-frontier-play]').length,
      note: !!document.querySelector('.frontier-lock-note'),
      summary: document.querySelector('#frontier-summary .stat-value')?.textContent || '',
      unlocked: a.frontiers.unlocked,
    };
  })()`);
  check(locked.open === true, 'the hub opens from the menu');
  check(locked.chips === 10, `the chapter rail renders ten chips (${locked.chips})`);
  check(locked.cards === 10, `only the selected chapter's ten levels render (${locked.cards})`);
  check(locked.note === true && locked.unlocked === false, 'the ladder stays locked before the campaign clear');
  check(locked.play === 0, `no level is playable while locked (${locked.play})`);
  check(locked.summary.includes('0 / 100'), `the summary reads 0 / 100 (${locked.summary})`);

  const opened = await evaluate(`(async () => {
    const a = window.__ashen;
    a.progress.cleared[7] = true;
    a.frontierChapter(11);
    await new Promise((r) => setTimeout(r, 120));
    return {
      unlocked: a.frontiers.unlocked,
      play: document.querySelectorAll('[data-frontier-play]').length,
      firstLevel: document.querySelector('.frontier-level .fl-num')?.textContent || '',
    };
  })()`);
  check(opened.unlocked === true, 'The Oathbreaker clear opens the ladder');
  check(opened.play === 1, `exactly one level is open at the start (${opened.play})`);
  check(opened.firstLevel.includes('101'), `the first card is Lv 101 (${opened.firstLevel})`);

  const rail = await evaluate(`(async () => {
    document.querySelector('[data-frontier-chapter="12"]').click();
    await new Promise((r) => setTimeout(r, 120));
    const levels = [...document.querySelectorAll('.frontier-level .fl-num')].map((el) => el.textContent.trim());
    const active = document.querySelector('.frontier-chip.active strong')?.textContent || '';
    return { levels, active, play: document.querySelectorAll('[data-frontier-play]').length };
  })()`);
  check(rail.active.includes('12'), `the rail switches chapters (${rail.active})`);
  check(rail.levels[0].includes('111') && rail.levels.at(-1).includes('120'), 'chapter 12 shows Lv 111–120');
  check(rail.play === 0, 'later chapters are locked until their turn');

  const run = await evaluate(`(async () => {
    const a = window.__ashen;
    a.frontierChapter(11);
    await new Promise((r) => setTimeout(r, 120));
    document.querySelector('[data-frontier-play]').click();
    await new Promise((r) => setTimeout(r, 420));
    const archetypes = [...new Set(a.game.enemies.filter((e) => !e.elite).map((e) => e.ai))];
    return {
      runKind: a.frontiers.runKind,
      room: a.game.roomIndex,
      level: a.frontiers.level,
      enemies: a.game.enemies.length,
      elites: a.game.enemies.filter((e) => e.elite).length,
      archetypes,
      rank: a.game.enemies.find((e) => e.elite)?.eliteRank || null,
      badge: document.getElementById('frontier-badge')?.textContent || '',
      badgeHidden: document.getElementById('frontier-badge')?.classList.contains('hidden'),
    };
  })()`);
  check(run.runKind === 'frontiers' && run.room === 674, `MAINKAN enters room 674 (${run.room})`);
  check(run.level === 101, `the run reports Lv 101 (${run.level})`);
  check(run.enemies === 20, `the live level spawns twenty bodies (${run.enemies})`);
  check(run.elites === 1, `exactly one elite is guaranteed (${run.elites})`);
  check(run.archetypes.length === 4, `four standard archetypes are live (${run.archetypes.join(',')})`);
  check(/^E[1-7]$/.test(run.rank || ''), `the elite carries a rank (${run.rank})`);
  check(run.badgeHidden === false && run.badge.includes('LV 101'), `the HUD badge reads the level (${run.badge})`);

  const cleared = await evaluate(`(async () => {
    const a = window.__ashen;
    a.frontierClear(0);
    // saveProgress is debounced to one write per 1.2 s.
    await new Promise((r) => setTimeout(r, 1500));
    a.frontierChapter(11);
    await new Promise((r) => setTimeout(r, 120));
    return {
      first: a.frontiers.summary.levels,
      play: document.querySelectorAll('[data-frontier-play]').length,
      clearedCards: document.querySelectorAll('.frontier-level.cleared').length,
      saved: JSON.parse(localStorage.getItem('ashen-vow-progress-v1') || '{}').frontiers?.levels?.[0] === true,
    };
  })()`);
  check(cleared.first[0] === true, 'clearing Lv 101 records the level');
  check(cleared.play === 2, `the next level unlocks after a clear (${cleared.play})`);
  check(cleared.clearedCards === 1, 'the cleared card is marked TUNTAS');
  check(cleared.saved === true, 'the clear is written to ashen-vow-progress-v1');

  const boss = await evaluate(`(async () => {
    const a = window.__ashen;
    for (let i = 1; i <= 8; i += 1) a.frontierClear(i);
    a.frontierStart(9);
    await new Promise((r) => setTimeout(r, 320));
    const spawned = a.game.boss ? { kind: a.game.boss.kind, phases: a.game.boss.maxPhases, hp: a.game.boss.maxHp } : null;
    const power = { dmg: Math.round(a.game.player.damageMult * 100) / 100, hp: a.game.player.maxHp };
    const room = a.game.roomIndex;
    let phase = 1;
    // Headless Chrome throttles rAF, so the fight is stepped through the debug
    // hook, which drains the same events the render loop does.
    for (let i = 0; i < 160 && a.game.state !== 'blessing' && a.game.state !== 'victory'; i += 1) {
      for (let line = 0; line < 4; line += 1) a.advanceDialogue();
      if (a.game.boss && !a.game.boss.dying) a.game.hurtBoss(4000, 90, 1, false);
      if (a.game.boss) phase = Math.max(phase, a.game.boss.phase);
      a.step(0.2);
    }
    if (a.game.state === 'blessing') a.chooseBlessing(0);
    a.step(0.2);
    await new Promise((r) => setTimeout(r, 1500));
    return {
      spawned,
      power,
      room,
      phase,
      state: a.game.state,
      chapterBoss: a.frontiers.summary.bosses[0],
      saved: JSON.parse(localStorage.getItem('ashen-vow-progress-v1') || '{}').frontiers?.bosses?.[0] === true,
    };
  })()`);
  check(boss.room === 683 && boss.spawned?.kind === 'skybreaker', 'the chapter seat spawns The Skybreaker');
  check(boss.spawned?.phases === 3, `The Skybreaker has three phases (${boss.spawned?.phases})`);
  check(boss.phase === 3, `the boss reaches its final phase (${boss.phase})`);
  check(boss.power.dmg > 1, `the run carries player power (x${boss.power.dmg})`);
  check(boss.chapterBoss === true && boss.saved === true, 'the chapter boss clear is recorded and persisted');

  const ladder = await evaluate(`(async () => {
    const a = window.__ashen;
    for (let i = 10; i <= 98; i += 1) a.frontierClear(i);
    const before = a.frontiers.summary;
    a.frontierStart(99);
    await new Promise((r) => setTimeout(r, 320));
    const final = a.game.boss ? { kind: a.game.boss.kind, phases: a.game.boss.maxPhases, hp: a.game.boss.maxHp } : null;
    const power = { dmg: Math.round(a.game.player.damageMult * 100) / 100, hp: a.game.player.maxHp, flasks: a.game.player.maxFlasks };
    for (let i = 0; i < 200 && a.game.state !== 'victory'; i += 1) {
      for (let line = 0; line < 4; line += 1) a.advanceDialogue();
      if (a.game.boss && !a.game.boss.dying) a.game.hurtBoss(9000, 90, 1, false);
      a.step(0.25);
    }
    await new Promise((r) => setTimeout(r, 1500));
    return {
      before,
      power,
      final,
      state: a.game.state,
      after: a.frontiers.summary,
      saved: JSON.parse(localStorage.getItem('ashen-vow-progress-v1') || '{}').frontiers,
    };
  })()`);
  check(ladder.before.levelsCleared === 99 && ladder.before.bossesCleared === 9, `the ladder clears 99 levels before the finale (${ladder.before.levelsCleared}/${ladder.before.bossesCleared})`);
  check(ladder.final?.kind === 'aethron_origin' && ladder.final?.phases === 5, `Aethron spawns with five phases (${ladder.final?.kind}/${ladder.final?.phases})`);
  check(ladder.state === 'victory', `the finale ends the ladder in victory (${ladder.state})`);
  check(ladder.after.levelsCleared === 100 && ladder.after.bossesCleared === 10, 'all 100 levels and 10 bosses are recorded');
  check(ladder.saved?.levels?.filter(Boolean).length === 100, 'the full ladder is persisted');

  await evaluate('location.reload()').catch(() => null);
  await sleep(2600);
  const after = await waitFor(() => evaluate(`(() => {
    const a = window.__ashen;
    if (!a) return null;
    document.getElementById('btn-frontier-menu').click();
    return {
      levels: a.frontiers.summary.levelsCleared,
      bosses: a.frontiers.summary.bossesCleared,
      cards: document.querySelectorAll('.frontier-level').length,
      percent: a.frontiers.summary.percent,
    };
  })()`), 25000, 'reload boot');
  check(after.levels === 100 && after.percent === 100, `progress survives reload (${after.levels}, ${after.percent}%)`);
  check(after.bosses === 10 && after.cards === 10, 'boss clears and the hub cards survive reload');

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(300);
  const phone = await evaluate(`(() => {
    const a = window.__ashen;
    a.frontierChapter(16);
    const screen = document.getElementById('frontier-screen');
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      cards: document.querySelectorAll('.frontier-level').length,
      visible: !screen.classList.contains('hidden'),
      rail: document.querySelectorAll('.frontier-chip').length,
    };
  })()`);
  check(phone.overflow <= 1, `390x844 has no horizontal overflow (${phone.overflow}px)`);
  check(phone.cards === 10 && phone.rail === 10 && phone.visible === true, 'the ladder stays usable on a phone');
  await send('Emulation.clearDeviceMetricsOverride');

  check(consoleErrors.length === 0, `no console errors (${consoleErrors.length})`);

  console.log(`\nFrontiers smoke: ${passed} passed, ${failed} failed`);
  if (consoleErrors.length) console.log(consoleErrors.join('\n'));
  process.exitCode = failed ? 1 : 0;
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill('SIGKILL');
  process.exit(failed ? 1 : 0);
}
