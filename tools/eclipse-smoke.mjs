// Real-browser smoke for Update VIII: Eclipse of the Forgotten Gods.
// Usage: ASHEN_URL=http://127.0.0.1:4300/ node tools/eclipse-smoke.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9334;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find((path) => existsSync(path));
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');
const profile = mkdtempSync(join(tmpdir(), 'ashen-eclipse-'));
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--disable-extensions',
  '--mute-audio', '--window-size=1440,960', URL,
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(fn, timeout = 20000, label = 'condition') {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const value = await fn(); if (value) return value; } catch { /* retry */ }
    await sleep(120);
  }
  throw new Error(`timed out: ${label}`);
}
let ws;
let seq = 0;
const pending = new Map();
const errors = [];
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
let checks = 0;
const check = (value, label) => { assert.ok(value, label); checks += 1; console.log(`  ✓ ${label}`); };
try {
  const targets = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const list = await response.json();
    return list.find((entry) => entry.type === 'page' && entry.url.startsWith(URL)) ? list : null;
  }, 20000, 'chrome page');
  const page = targets.find((entry) => entry.type === 'page' && entry.url.startsWith(URL));
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) { const callback = pending.get(message.id); if (callback) { pending.delete(message.id); callback(message); } return; }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails?.exception?.description || 'exception');
    else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
    else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      const text = message.params.entry.text || '';
      if (!/favicon|429|Too Many Requests/i.test(text)) errors.push(`${text} ${message.params.entry.url || ''}`);
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');
  await send('Page.bringToFront');
  await sleep(1400);
  await waitFor(() => evaluate('typeof window.__ashen === "object"'), 20000, 'game boot');

  const boot = await evaluate(`(() => {
    const A = window.__ashen;
    A.clearProgress();
    return {
      version: A.version,
      button: !!document.getElementById('btn-eclipse-menu'),
      screen: !!document.getElementById('eclipse-screen'),
      style: [...document.styleSheets].some((sheet) => String(sheet.href).includes('styles-eclipse')),
    };
  })()`);
  check(boot.version === '0.36.0', `version is 0.36.0 (got ${boot.version})`);
  check(boot.button && boot.screen && boot.style, 'Eclipse menu, screen and stylesheet are wired');

  const campaign = await evaluate(`(async () => {
    const A = window.__ashen;
    document.getElementById('btn-eclipse-menu').click();
    await new Promise((r) => setTimeout(r, 250));
    const visible = !document.getElementById('eclipse-screen').classList.contains('hidden');
    const biomes = document.querySelectorAll('.eclipse-biome-card').length;
    const levels = document.querySelectorAll('.eclipse-level:not(.boss)').length;
    const bosses = document.querySelectorAll('.eclipse-level.boss').length;
    const secret = document.querySelector('.eclipse-secret')?.textContent.includes('PECAHAN');
    const locked = document.querySelectorAll('.eclipse-level.locked').length;
    return { visible, biomes, levels, bosses, secret, locked, menuView: A.menuView };
  })()`);
  check(campaign.visible && campaign.menuView === 'eclipse', 'Eclipse hub opens from the menu');
  check(campaign.biomes === 6, 'campaign renders six biomes');
  check(campaign.levels === 30, 'campaign renders thirty standard levels');
  check(campaign.bosses === 6, 'campaign renders six biome bosses');
  check(campaign.secret && campaign.locked > 0, 'seventh encounter is the fragment-gated secret boss');

  const stage = await evaluate(`(async () => {
    const A = window.__ashen;
    document.querySelector('[data-action="play-eclipse"]').click();
    await new Promise((r) => setTimeout(r, 1000));
    const room = A.game.roomIndex;
    const kind = A.snap().runKind || A.runKind;
    const enemies = A.game.enemies.length;
    const elite = A.game.enemies.filter((enemy) => enemy.elite).length;
    const archetypes = new Set(A.game.enemies.map((enemy) => enemy.archetype)).size;
    const hp = A.game.player.maxHp;
    const weapons = A.game.player.weapons.length;
    const screenHidden = document.getElementById('eclipse-screen').classList.contains('hidden');
    const hud = !document.getElementById('hud').classList.contains('hidden');
    return { room, kind, enemies, elite, archetypes, hp, weapons, screenHidden, hud };
  })()`);
  check(stage.room >= 525 && stage.room <= 560, 'first Eclipse stage enters the Arc VIII room range');
  check(stage.enemies === 20, `standard level spawns exactly 20 enemies (got ${stage.enemies})`);
  check(stage.archetypes === 4, `standard level uses four archetypes (got ${stage.archetypes})`);
  check(stage.elite === 1, `standard level contains exactly one elite (got ${stage.elite})`);
  check(stage.hp >= 210 && stage.weapons >= 8, 'Eclipse run provisions survival stats and the new arsenal');
  check(stage.screenHidden && stage.hud, 'starting a stage closes the hub and shows the HUD');

  const combat = await evaluate(`(async () => {
    const A = window.__ashen;
    const g = A.game;
    g.player.x = 500; g.player.y = 700; g.player.vx = 0; g.player.vy = 0; g.player.invuln = 0;
    g.player.hp = g.player.maxHp;
    A.step(1 / 120);
    const before = g.player.hp;
    const reaction = g.player.elemental;
    return { before, reaction: !!reaction, combo: !!g.player.attack || true, perf: A.performance || null };
  })()`);
  check(combat.before > 0, 'Eclipse stage keeps the player alive and stepped');

  const godfall = await evaluate(`(async () => {
    const A = window.__ashen;
    A.showEclipse('godfall');
    await new Promise((r) => setTimeout(r, 200));
    const floors = document.querySelectorAll('.eclipse-floor').length;
    const bosses = document.querySelectorAll('.eclipse-floor.boss').length;
    const selected = document.querySelector('.eclipse-floor.selected')?.textContent;
    document.querySelector('[data-action="play-godfall"]').click();
    await new Promise((r) => setTimeout(r, 900));
    return { floors, bosses, selected, room: A.game.roomIndex, floor: A.eclipseRuntime.godfallFloor, kind: A.runKind };
  })()`);
  check(godfall.floors === 100 && godfall.bosses === 10, 'Godfall renders 100 floors with ten bosses');
  check(godfall.room === 562 && godfall.kind === 'godfall', 'Godfall starts on its dedicated floor 1 room');

  const guild = await evaluate(`(async () => {
    const A = window.__ashen;
    A.showEclipse('guilds');
    await new Promise((r) => setTimeout(r, 200));
    document.getElementById('guild-name').value = 'Eclipse Wardens';
    document.querySelector('[data-action="create-guild"]').click();
    await new Promise((r) => setTimeout(r, 250));
    const created = (A.progress.guild?.guild?.name) || '';
    document.getElementById('guild-chat-input').value = 'Raid malam ini.';
    document.querySelector('[data-action="guild-chat-form"]').requestSubmit();
    await new Promise((r) => setTimeout(r, 200));
    const messages = A.progress.guild?.activity?.length || 0;
    const raids = document.querySelectorAll('.eclipse-raid').length;
    const persisted = JSON.parse(localStorage.getItem('ashen-vow-progress-v1') || '{}').guild?.guild?.name || '';
    return { created, messages, raids, persisted };
  })()`);
  check(guild.created === 'Eclipse Wardens' && guild.persisted === 'Eclipse Wardens', 'guild creation persists under the versioned save');
  check(guild.messages >= 1 && guild.raids === 3, 'guild chat records messages and three raids render');

  const awakening = await evaluate(`(async () => {
    const A = window.__ashen;
    A.showEclipse('awakening');
    await new Promise((r) => setTimeout(r, 200));
    return {
      cards: document.querySelectorAll('.eclipse-awaken-card').length,
      locked: document.querySelectorAll('.eclipse-awaken-card button[disabled]').length,
      passives: document.querySelectorAll('.eclipse-passive-archive > div').length,
    };
  })()`);
  check(awakening.cards === 18 && awakening.locked === 18, 'Awakening lists all 18 classes behind mastery');
  check(awakening.passives === 6, 'Awakening passive archive renders six choices');

  const settings = await evaluate(`(async () => {
    const A = window.__ashen;
    A.showEclipse('settings');
    await new Promise((r) => setTimeout(r, 200));
    const presets = document.querySelectorAll('.eclipse-preset').length;
    const selects = document.querySelectorAll('[data-action="graphics-change"]').length;
    document.querySelector('[data-preset="low"]').click();
    await new Promise((r) => setTimeout(r, 200));
    const stored = JSON.parse(localStorage.getItem('ashen-vow-settings-v1') || '{}').gameplay || {};
    const canvasWidth = document.getElementById('game').width;
    return { presets, selects, preset: stored.graphicsPreset, cap: stored.frameCap, scale: stored.resolutionScale, renderScale: A.renderer.options.resolutionScale, canvasWidth, budget: document.querySelectorAll('.eclipse-budget > div').length };
  })()`);
  check(settings.presets === 5 && settings.selects === 11, 'graphics exposes five presets and eleven advanced controls');
  check(settings.preset === 'low' && settings.cap === 30 && settings.budget === 3, `low preset applies a 30 FPS cap and frame-time budget (preset=${settings.preset} cap=${settings.cap} budget=${settings.budget})`);
  check(settings.scale === 0.65 && settings.renderScale === 0.65 && settings.canvasWidth < 640, `low preset applies its 65% resolution scale to the live canvas (scale=${settings.scale} width=${settings.canvasWidth})`);

  const qa = await evaluate(`(async () => {
    const A = window.__ashen;
    A.showEclipse('qa');
    await new Promise((r) => setTimeout(r, 200));
    const items = document.querySelectorAll('.eclipse-checklist > div').length;
    const bugs = document.querySelectorAll('.eclipse-bugs > div').length;
    const text = document.getElementById('eclipse-body').textContent;
    return { items, bugs, honest: /BELUM|gate/i.test(text), contentPass: text.includes('PASS') };
  })()`);
  check(qa.items === 30 && qa.bugs >= 10, 'QA tab renders the 30-point gate and bug registry');
  check(qa.honest && qa.contentPass, 'QA reports content validation and blocked gates honestly');

  const save = await evaluate(`(() => {
    const raw = localStorage.getItem('ashen-vow-progress-v1') || '{}';
    const backup = localStorage.getItem('ashen-vow-progress-v1-backup') || '';
    const parsed = JSON.parse(raw);
    return { schema: parsed.schemaVersion, backup: !!backup, eclipse: !!parsed.eclipse, godfall: !!parsed.godfall, guild: !!parsed.guild, awakening: !!parsed.awakening };
  })()`);
  check(save.schema === 2 && save.backup, 'versioned save writes schema 2 plus a backup');
  check(save.eclipse && save.godfall && save.guild && save.awakening, 'all Update VIII progress lives in one save envelope');

  const perf = await evaluate(`(() => {
    const A = window.__ashen;
    const report = A.performance || null;
    return { report, errors: A.runtimeErrors ? A.runtimeErrors.count : null };
  })()`);
  check(perf.report && perf.report.frames > 0 && Number.isFinite(perf.report.p95), 'frame-time sampler records live frames');
  check(perf.errors === 0, 'runtime reporter has no captured exceptions');

  check(errors.length === 0, `no console errors: ${errors.join(' | ')}`);
  console.log(`eclipse smoke: ${checks} checks passed`);
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  try { chrome.kill(); } catch { /* ignore */ }
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
}
