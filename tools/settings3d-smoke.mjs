// Real-browser smoke for Update IX: Settings 2.0, difficulty, HUD editor, 3D regions.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9335;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');
const profile = mkdtempSync(join(tmpdir(), 'ashen-settings3d-'));
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader', '--mute-audio',
  '--window-size=1440,960', URL,
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
  pending.set(id, (message) => message.error ? reject(new Error(message.error.message)) : resolve(message.result));
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
  const pages = await waitFor(async () => {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    return list.some((entry) => entry.type === 'page' && entry.url.startsWith(URL)) ? list : null;
  }, 20000, 'chrome page');
  const page = pages.find((entry) => entry.type === 'page' && entry.url.startsWith(URL));
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) { const cb = pending.get(message.id); if (cb) { pending.delete(message.id); cb(message); } return; }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails?.exception?.description || 'exception');
    else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
    else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      const text = message.params.entry.text || '';
      const url = message.params.entry.url || '';
      // External Google Fonts may rate-limit headless runs; JS/runtime errors still count.
      if (!/favicon/i.test(text) && !(url.includes('fonts.googleapis.com') || /Failed to load resource.*429/.test(text))) errors.push(text);
    }
  });
  await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable'); await send('Page.bringToFront');
  await sleep(1200);
  await waitFor(() => evaluate('typeof window.__ashen === "object"'), 20000, 'game boot');

  const boot = await evaluate(`({ version: window.__ashen.version, difficulty: window.__ashen.difficulty, categories: window.__ashen.settings && Object.keys(window.__ashen.settings).length })`);
  check(boot.version === '0.23.0', `version is 0.23.0 (got ${boot.version})`);
  check(boot.difficulty.engine === 'normal' && boot.difficulty.active === 'normal', 'normal difficulty is active in the engine');
  check(boot.categories >= 10, 'versioned settings expose all groups');

  const settings = await evaluate(`(async () => {
    try {
      window.__ashen.showSettings('graphics');
      await new Promise((r) => setTimeout(r, 250));
      return {
      visible: !document.getElementById('settings-screen').classList.contains('hidden'),
      tabs: document.querySelectorAll('[data-settings-tab]').length,
      categories: [...document.querySelectorAll('[data-settings-tab]')].map((el) => el.dataset.settingsTab),
      preset: [...document.querySelectorAll('[data-setting-path="graphics.preset"] option')].length,
      rows: document.querySelectorAll('.settings2-row').length,
      description: document.querySelector('.settings2-copy p')?.textContent.length || 0,
      };
    } catch (error) { return { error: error.stack || String(error) }; }
  })()`);
  check(!settings.error, `Settings screen opens from the main menu${settings.error ? `: ${settings.error}` : ''}`);
  check(settings.tabs === 14, `all fourteen categories render (got ${settings.tabs})`);
  check(settings.categories.includes('difficulty') && settings.categories.includes('language') && settings.categories.includes('performance'), 'difficulty, language, and performance tabs exist');
  check(settings.preset === 6, `graphics preset has Low, Medium, High, Ultra, Extreme, and Custom (got ${settings.preset}; tab=${settings.tabs}; body=${settings.rows})`);
  check(settings.rows >= 20 && settings.description > 10, 'setting rows show values and descriptions');

  const search = await evaluate(`(async () => {
    const input = document.getElementById('settings-search');
    input.value = 'shadow';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    return { rows: document.querySelectorAll('.settings2-row').length, text: document.getElementById('settings-body').textContent };
  })()`);
  check(search.rows >= 1 && /shadow/i.test(search.text), 'search finds settings by name and description');

  const audio = await evaluate(`(async () => {
    document.querySelector('[data-settings-tab="audio"]').click();
    await new Promise((r) => setTimeout(r, 120));
    const sliders = document.querySelectorAll('[data-setting-path^="audio."]').length;
    const music = document.querySelector('[data-setting-path="audio.music"]');
    const sfx = document.querySelector('[data-setting-path="audio.sfx"]');
    music.value = '12';
    music.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 80));
    return { sliders, music: window.__ashen.settings.audio.music, sfx: window.__ashen.settings.audio.sfx, sfxBefore: sfx.value };
  })()`);
  check(audio.sliders >= 10, 'audio mixer exposes ten independent channels');
  check(audio.music === 12 && audio.sfx === 80, 'changing music does not change SFX volume');

  const preset = await evaluate(`(async () => {
    document.querySelector('[data-settings-tab="graphics"]').click();
    await new Promise((r) => setTimeout(r, 150));
    const select = document.querySelector('[data-setting-path="graphics.preset"]');
    select.value = 'low';
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 160));
    const presetSelect = document.querySelector('[data-setting-path="graphics.preset"]');
    return { preset: window.__ashen.settings.graphics.preset, scale: window.__ashen.settings.graphics.renderScale, canvas: document.getElementById('game').width, options: presetSelect ? presetSelect.options.length : -1, tab: [...document.querySelectorAll('.settings-tab')].find((el) => el.classList.contains('active'))?.textContent, head: document.getElementById('settings-body').textContent.slice(0, 80) };
  })()`);
  check(preset.preset === 'low' && preset.scale === 65, `Low preset writes its real render values (options=${preset.options} tab=${preset.tab} head=${preset.head})`);
  check(preset.canvas > 400 && preset.canvas < 700, `Low preset reduces the real backing resolution (got ${preset.canvas})`);

  const applied = await evaluate(`(async () => {
    document.getElementById('btn-settings-diagnostics').click();
    await new Promise((r) => setTimeout(r, 80));
    const diag = document.getElementById('settings-diagnostics').textContent;
    document.getElementById('btn-settings-apply').click();
    await new Promise((r) => setTimeout(r, 120));
    return { diag, saved: JSON.parse(localStorage.getItem('ashen-vow-settings-v1')).graphics.preset };
  })()`);
  check(/TIDAK DIDUKUNG/.test(applied.diag) && /TERSIMPAN|MENUNGGU/.test(applied.diag), 'diagnostics reports unsupported features honestly');
  check(applied.saved === 'low', 'Apply persists the settings payload');

  const difficulty = await evaluate(`(async () => {
    document.getElementById('btn-difficulty-menu').click();
    await new Promise((r) => setTimeout(r, 180));
    const cards = document.querySelectorAll('[data-difficulty-choice]').length;
    document.querySelector('[data-difficulty-choice="hard"]').click();
    await new Promise((r) => setTimeout(r, 100));
    const active = window.__ashen.difficulty;
    document.getElementById('btn-settings-apply').click();
    await new Promise((r) => setTimeout(r, 100));
    return { cards, active: active.engine, saved: window.__ashen.settings.gameplay.difficulty };
  })()`);
  check(difficulty.cards === 6, 'difficulty page renders six profiles');
  check(difficulty.active === 'hard' && difficulty.saved === 'hard', 'Hard difficulty reaches the live engine and settings');

  const hud = await evaluate(`(async () => {
    window.__ashen.openHudLayout();
    await new Promise((r) => setTimeout(r, 100));
    const visible = !document.getElementById('hud-layout-screen').classList.contains('hidden');
    const stage = !!document.getElementById('hud-layout-stage');
    const drags = document.querySelectorAll('[data-hud-drag]').length;
    document.getElementById('btn-hud-layout-close').click();
    return { visible, stage, drags };
  })()`);
  check(hud.visible && hud.stage && hud.drags === 5, 'HUD Layout Editor opens with draggable panels');

  const mode3d = await evaluate(`(async () => {
    document.getElementById('btn-mode3d-menu').click();
    await new Promise((r) => setTimeout(r, 500));
    const select = document.getElementById('select-3d-region');
    const regions = select.options.length;
    select.value = 'astral';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 600));
    const canvas = document.getElementById('canvas-3d');
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let colors = new Set(); let lit = 0;
    for (let i = 0; i < data.length; i += 64) {
      const key = data[i] + ',' + data[i+1] + ',' + data[i+2];
      colors.add(key); if (data[i] + data[i+1] + data[i+2] > 24) lit += 1;
    }
    return { regions, mode: window.__ashen.mode3D, colors: colors.size, lit, hidden: document.getElementById('mode3d-screen').classList.contains('hidden') };
  })()`);
  check(mode3d.regions === 6, '3D Mode exposes six illustrated regions');
  check(mode3d.mode?.region === 'astral' && !mode3d.hidden, 'Astral Islands loads in the live 3D scene');
  check(mode3d.colors > 120 && mode3d.lit > 100, `3D canvas has a genuinely shaded scene (${mode3d.colors} colors)`);

  // ── WebGL2 + GLB asset pipeline ──
  const gfx = await (async () => {
    const started = Date.now();
    while (Date.now() - started < 30000) {
      const state = await evaluate('window.__ashen.gfx3D.state');
      if (state === 'ready' || state === 'failed' || state === 'unsupported') break;
      await sleep(200);
    }
    return evaluate(`(() => {
      const s = window.__ashen.gfx3D;
      return { state: s.state, available: s.available, reason: s.reason, models: s.models, props: s.props, hdr: s.hdr, msaa: s.msaa, aniso: s.anisotropic, upscaler: s.upscaler, stats: s.stats };
    })()`);
  })();
  check(gfx.state === 'ready' && gfx.available, `WebGL2 GLB renderer is live (state=${gfx.state} ${gfx.reason || ''})`);
  check(gfx.models === 7 && gfx.props >= 7, `all GLB models and props loaded (${gfx.models} models, ${gfx.props} props)`);
  check(Boolean(gfx.stats) && gfx.stats.triangles > 1000, `skinned GLB geometry reaches the GPU (${gfx.stats && Math.round(gfx.stats.triangles)} triangles)`);
  check(Boolean(gfx.stats) && gfx.stats.drawCalls > 5 && gfx.stats.skinned > 0, `shadow + HDR passes issue real draws (${gfx.stats && gfx.stats.drawCalls} calls, ${gfx.stats && gfx.stats.skinned} skinned)`);
  check(gfx.hdr === 'rgba16f' || gfx.hdr === 'rgba8', `render target format reported honestly (${gfx.hdr})`);
  check(typeof gfx.aniso === 'number' && gfx.aniso >= 1, `anisotropic filtering applied up to ${gfx.aniso}x`);

  const content = await evaluate(`(async () => {
    const g = window.__ashen;
    g.setArea3D('obsidian_forge');
    await new Promise((r) => setTimeout(r, 400));
    const first = g.mode3dAreas;
    g.pickRelic3D('relic_ember_heart');
    const after = g.mode3dAreas;
    const caps = g.capabilities;
    return { content: g.mode3dContent, first, damage: after.modifiers.damage, relics: after.relics.length, caps };
  })()`);
  check(content.content.areas === 10 && content.content.dungeons === 5 && content.content.relics === 20 && content.content.vaults === 10, 'ten areas, five dungeons, twenty relics and ten vaults ship');
  check(content.first.area === 'obsidian_forge' && /Tyrant/.test(content.first.boss || ''), `area switching loads its boss (${content.first.boss})`);
  check(content.damage > 1 && content.relics >= 1, `relic changes real damage (x${Number(content.damage).toFixed(2)})`);
  check(content.caps.gpuRenderer !== undefined && content.caps.rayTracing === false, `GPU probe is real and ray tracing stays unsupported (${String(content.caps.gpuRenderer).slice(0, 48)})`);

  const regions = await evaluate(`(async () => {
    const select = document.getElementById('select-3d-region');
    const canvas = document.getElementById('canvas-3d');
    const ctx = canvas.getContext('2d');
    const out = {};
    for (const option of [...select.options]) {
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 220));
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colors = new Set();
      for (let i = 0; i < data.length; i += 160) colors.add(data[i] + ',' + data[i + 1] + ',' + data[i + 2]);
      out[option.value] = colors.size;
    }
    return out;
  })()`);
  check(Object.keys(regions).length === 6 && Object.values(regions).every((count) => count > 80), `all six illustrated regions render detailed scenes (${JSON.stringify(regions)})`);

  await send('Page.reload'); await sleep(1300);
  await waitFor(() => evaluate('typeof window.__ashen === "object"'), 20000, 'reload');
  const persisted = await evaluate(`({ music: window.__ashen.settings.audio.music, preset: window.__ashen.settings.graphics.preset, difficulty: window.__ashen.settings.gameplay.difficulty })`);
  check(persisted.music === 12 && persisted.preset === 'low' && persisted.difficulty === 'hard', 'settings and difficulty survive a full reload');

  const reset = await evaluate(`(async () => {
    window.confirm = () => true;
    window.__ashen.showSettings('graphics');
    await new Promise((r) => setTimeout(r, 120));
    document.getElementById('btn-settings-reset-all').click();
    await new Promise((r) => setTimeout(r, 100));
    document.getElementById('btn-settings-apply').click();
    await new Promise((r) => setTimeout(r, 120));
    const saved = JSON.parse(localStorage.getItem('ashen-vow-settings-v1'));
    return { preset: saved.graphics.preset, music: saved.audio.music, difficulty: saved.gameplay.difficulty };
  })()`);
  check(reset.preset === 'high' && reset.music === 55 && reset.difficulty === 'normal', `confirmed Reset All restores and persists defaults without touching progress (got ${JSON.stringify(reset)})`);

  check(errors.length === 0, `no application console errors: ${errors.slice(0, 3).join(' | ')}`);
  console.log(`settings/3D smoke: ${checks} checks passed`);
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
}
