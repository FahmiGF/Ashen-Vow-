// Real-browser smoke for Update XXX: the Campaign Map Editor's terrain canvas,
// room chains and share codes. Drives the actual editor screen and the real
// engine, clears a two-room chain, imports its share code and reloads.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9356;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-editor-'));
let chrome;
try {
  chrome = spawn(chromePath, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader', '--mute-audio', '--window-size=1400,900', BASE,
  ], { stdio: 'ignore' });
} catch (err) {
  console.error(`[BROWSER_LAUNCH] Failed to launch Chrome: ${err.message}`);
  process.exit(1);
}

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
  let pages;
  try {
    pages = await waitFor(async () => {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      return list.some((entry) => entry.type === 'page' && entry.url.startsWith(BASE)) ? list : null;
    }, 20000, 'chrome page');
  } catch (err) {
    throw new Error(`[BROWSER_LAUNCH] ${err.message}`);
  }
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
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      const text = message.params.entry.text || '';
      if (!/favicon|ERR_NETWORK_ACCESS_DENIED|429|Too Many Requests|fonts\.g/i.test(text)) {
        consoleErrors.push(text);
      }
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');
  await send('Page.bringToFront');
  try {
    await waitFor(() => evaluate('typeof window.__ashen === "object" && window.__ashenBoot?.ready === true'), 25000, 'boot');
  } catch (err) {
    throw new Error(`[APP_BOOT] ${err.message}`);
  }

  const trailerFlow = await evaluate(`(async () => {
    const a = window.__ashen;
    const initialView = a.menuView;
    const trailerVisible = !document.getElementById('trailer-screen')?.classList.contains('hidden');
    if (initialView === 'trailer') {
      document.getElementById('btn-trailer-close')?.click();
      await new Promise((r) => setTimeout(r, 120));
    }
    return { initialView, trailerVisible, afterCloseView: a.menuView };
  })()`);
  check(trailerFlow.initialView === 'trailer' && trailerFlow.trailerVisible, 'fresh profile boots into the trailer flow');
  check(trailerFlow.afterCloseView === 'title', 'closing the trailer via its button opens the title menu');

  const boot = await evaluate(`(async () => {
    const a = window.__ashen;
    localStorage.removeItem('ashen-vow-mapeditor-v1');
    const preLoaded = a.editor.loaded;
    document.getElementById('btn-editor-menu')?.click();
    const start = Date.now();
    while (!a.editor.loaded && Date.now() - start < 8000) await new Promise((r) => setTimeout(r, 50));
    return {
      preLoaded,
      loaded: a.editor.loaded,
      hasCss: !!document.querySelector('link[href*="styles-mapeditor.css"]'),
      hasEditor: typeof a.showEditor === 'function',
      summary: a.editor.summary,
      stages: a.editor.save?.stages?.length || 0,
      schema: a.editor.save?.version || 0,
    };
  })()`);
  check(boot.preLoaded === false, 'Peta Sumpah stays deferred during cold boot');
  check(boot.loaded && boot.hasCss, 'opening Peta Sumpah lazy-loads its module and stylesheet');
  check(boot.hasEditor, 'the editor ships a real debug surface');
  check(boot.stages === 1, 'a fresh profile starts with exactly one starter map');
  check(boot.schema === 3, 'the save is schema 3 (takaran, objective, elites)');
  check(boot.summary.stages === 1 && boot.summary.enemies >= 1, 'the starter map already carries a roster');
  check(boot.summary.platforms >= 4, 'the starter map seeds its terrain from the layout template');

  await sleep(300);
  const ui = await evaluate(`(() => {
    const screen = document.getElementById('editor-screen');
    const name = document.querySelector('[data-editor-field="name"]');
    const canvas = document.getElementById('editor-canvas');
    return {
      open: !!screen && !screen.classList.contains('hidden'),
      list: document.querySelectorAll('#editor-list li').length,
      fields: document.querySelectorAll('[data-editor-field]').length,
      weapons: document.querySelectorAll('[data-editor-weapon]').length,
      rows: document.querySelectorAll('.editor-enemy-row').length,
      name: name ? name.value : null,
      canvas: !!canvas && canvas.width > 0 && canvas.height > 0,
      terrainButtons: document.querySelectorAll('[data-editor-terrain]').length,
      shareButtons: document.querySelectorAll('[data-editor-share]').length,
      shareInput: !!document.getElementById('editor-share-input'),
      chainOptions: document.querySelectorAll('[data-editor-field="nextStageId"] option').length,
      difficultyOptions: document.querySelectorAll('[data-editor-field="difficulty"] option').length,
      objectiveOptions: document.querySelectorAll('[data-editor-field="objective"] option').length,
      balancePanel: !!document.getElementById('editor-balance-panel'),
      balanceButtons: document.querySelectorAll('[data-editor-balance]').length,
      presets: document.querySelectorAll('[data-editor-preset]').length,
      bossOptions: document.querySelectorAll('[data-editor-field="boss"] option').length,
      zoneOptions: document.querySelectorAll('[data-editor-field="zone"] option').length,
      musicOptions: document.querySelectorAll('[data-editor-field="music"] option').length,
      introOptions: document.querySelectorAll('[data-editor-field="intro"] option').length,
    };
  })()`);
  check(ui.open, 'the editor screen opens from the debug hook');
  check(ui.list === 1, 'the stage list renders the saved map');
  check(ui.fields >= 13, 'the form exposes identity, world, run, boss and chain fields');
  check(ui.bossOptions > 100, 'every boss in the game is placeable');
  check(ui.zoneOptions >= 10, 'every zone can be used as a background');
  check(ui.musicOptions >= 30, 'the music picker lists the real procedural tracks');
  check(ui.introOptions === 4, 'four openers, including the three real cutscenes');
  check(ui.canvas, 'the terrain preview canvas renders');
  check(ui.terrainButtons === 4, 'the terrain toolbar ships floor, ledge, delete and reset');
  check(ui.shareButtons === 2 && ui.shareInput, 'the share panel ships a code field, copy and import');
  check(ui.chainOptions === 1, 'a single map has only the "stop here" chain option');
  check(ui.difficultyOptions === 6, 'six takaran levels are offered per map');
  check(ui.objectiveOptions === 2, 'two objectives: clear and survive');
  check(ui.balancePanel && ui.balanceButtons === 2, 'the balance meter ships AUTO-SEIMBANG and a lighter-takaran button');
  check(ui.presets === 4, 'all four presets are one click away');

  const tuning = await evaluate(`(() => {
    const a = window.__ashen;
    const stage = a.editor.stage;
    const before = a.editorRating(stage);
    const select = document.querySelector('[data-editor-field="difficulty"]');
    select.value = 'hard';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const selectedDifficulty = a.editor.stage.difficulty;
    const harder = a.editor.rating;
    document.querySelector('[data-editor-elite="0"]').click();
    const elite = a.editor.stage.enemies[0].elite;
    const eliteCount = a.editor.rating.elites;
    // Force a brutal roster, then let the real button tune it.
    const brutalStage = a.editor.stage;
    brutalStage.enemies = Array.from({ length: 20 }, (_, index) => ({ type: 'brute', x: 200 + index * 50, elite: false }));
    brutalStage.boss = 'warden';
    brutalStage.difficulty = 'abyssal';
    const brutal = a.editorRating(brutalStage);
    document.querySelector('[data-editor-balance="auto"]').click();
    const tuned = a.editor.rating;
    return {
      selectedDifficulty,
      ratingDifficulty: harder.difficulty,
      ratioGrew: harder.ratio > before.ratio,
      elite,
      eliteCount,
      brutalBand: brutal.band,
      tunedBand: tuned.band,
      brutalRatio: brutal.ratio,
      tunedRatio: tuned.ratio,
      flasks: a.editor.stage.flasks,
      message: a.editor.message || '',
    };
  })()`);
  check(tuning.selectedDifficulty === 'hard' && tuning.ratingDifficulty === 'hard', 'the TAKARAN select really changes the map difficulty');
  check(tuning.ratioGrew, 'a harder takaran raises the measured threat ratio');
  check(tuning.elite === true && tuning.eliteCount === 1, 'the elite toggle flips one entry and the meter counts it');
  check(tuning.brutalBand === 'brutal' && tuning.tunedBand !== 'brutal', 'AUTO-SEIMBANG pulls a brutal map back into a fair band');
  check(tuning.tunedRatio < tuning.brutalRatio && /Diseimbangkan/.test(tuning.message), 'auto-balance lowers the pressure and reports its steps');

  // Hand the tuned map back to a clean, boss-free state so the chain checks
  // below measure the chain, not the stress roster used for the meter.
  await evaluate(`(() => {
    const a = window.__ashen;
    const stage = a.editor.stage;
    stage.boss = null;
    stage.difficulty = 'normal';
    stage.enemies = [
      { type: 'crawler', x: 300, elite: false },
      { type: 'crawler', x: 520, elite: false },
      { type: 'sentinel', x: 760, elite: false },
    ];
    a.saveEditorStage();
  })()`);

  // Paint a platform through the real canvas pointer events.
  const painted = await evaluate(`(() => {
    const canvas = document.getElementById('editor-canvas');
    const rect = canvas.getBoundingClientRect();
    const toClient = (wx, wy) => ({
      clientX: rect.left + (wx / 1400) * rect.width,
      clientY: rect.top + (wy / 540) * rect.height,
    });
    const before = window.__ashen.editor.stage.platforms.length;
    const start = toClient(912, 238);
    const end = toClient(1102, 238);
    const opts = (point) => ({ bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, ...point });
    canvas.dispatchEvent(new PointerEvent('pointerdown', opts(start)));
    window.dispatchEvent(new PointerEvent('pointermove', opts(end)));
    window.dispatchEvent(new PointerEvent('pointerup', opts(end)));
    const stage = window.__ashen.editor.stage;
    return {
      before,
      after: stage.platforms.length,
      last: stage.platforms[stage.platforms.length - 1],
      selected: window.__ashen.editor.selectedPlatform,
    };
  })()`);
  check(painted.after === painted.before + 1, 'dragging on the canvas paints one platform');
  check(painted.last.x === 920 && painted.last.y === 240 && painted.last.w === 180,
    'painted terrain snaps to the 20 px grid and keeps the dragged width');
  check(painted.selected === painted.after - 1, 'the fresh platform is selected for deletion');

  const removed = await evaluate(`(() => {
    const before = window.__ashen.editor.stage.platforms.length;
    window.__ashen.deleteEditorPlatform();
    return { before, after: window.__ashen.editor.stage.platforms.length };
  })()`);
  check(removed.after === removed.before - 1, 'HAPUS TERPILIH removes the selected platform');

  // Rename the map and add a brute.
  await evaluate(`(() => {
    const input = document.querySelector('[data-editor-field="name"]');
    input.value = 'Ujian Peta Otomatis';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const select = document.getElementById('editor-enemy-select');
    select.value = 'brute';
    document.querySelector('[data-editor-add-enemy]').click();
  })()`);
  await sleep(250);
  const edited = await evaluate(`(() => {
    const a = window.__ashen;
    return {
      name: a.editor.stage.name,
      enemies: a.editor.stage.enemies.length,
      lastType: a.editor.stage.enemies[a.editor.stage.enemies.length - 1].type,
      rows: document.querySelectorAll('.editor-enemy-row').length,
    };
  })()`);
  check(edited.name === 'Ujian Peta Otomatis', 'typing in the name field updates the blueprint');
  check(edited.lastType === 'brute' && edited.rows === edited.enemies, 'adding an enemy updates data and the row list');

  // Second room, then chain room one into room two through the real select.
  const chain = await evaluate(`(() => {
    const a = window.__ashen;
    a.saveEditorStage();
    a.newEditorStage();
    const second = a.editor.stage.id;
    const name = document.querySelector('[data-editor-field="name"]');
    name.value = 'Ruang Kedua';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    a.saveEditorStage();
    document.querySelector('[data-editor-select="' + a.editor.save.stages[0].id + '"]').click();
    const select = document.querySelector('[data-editor-field="nextStageId"]');
    select.value = second;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    a.saveEditorStage();
    const stage = a.editor.stage;
    return {
      stages: a.editor.save.stages.length,
      chain: a.editorChain(stage.id),
      next: stage.nextStageId,
      second,
      options: document.querySelectorAll('[data-editor-field="nextStageId"] option').length,
    };
  })()`);
  check(chain.stages === 2, 'PETA BARU adds a second room');
  check(chain.next === chain.second && chain.options === 2, 'LANJUT KE PETA links the rooms through the real select');
  check(chain.chain.length === 2 && chain.chain[0] !== chain.chain[1], 'the chain reports both rooms in order');

  const saved = await evaluate(`(() => {
    window.__ashen.saveEditorStage();
    const raw = JSON.parse(localStorage.getItem('ashen-vow-mapeditor-v1'));
    return {
      name: raw.stages[0].name,
      enemies: raw.stages[0].enemies.length,
      platforms: raw.stages[0].platforms.length,
      next: raw.stages[0].nextStageId,
      message: window.__ashen.editor.message,
    };
  })()`);
  check(saved.name === 'Ujian Peta Otomatis' && saved.enemies === edited.enemies, 'saving writes the map to ashen-vow-mapeditor-v1');
  check(saved.platforms >= 4 && saved.next, 'the save keeps terrain and the chain link');

  const played = await evaluate(`(() => {
    const a = window.__ashen;
    const started = a.startCustomStage();
    const g = a.game;
    return {
      started,
      kind: a.editor.activeRunKind,
      inRun: a.started === true,
      customRoom: !!g.room.custom,
      roomIndex: g.roomIndex,
      enemies: g.enemies.length,
      weapon: g.player.weapon,
      weapons: g.player.weapons.length,
      flask: g.player.maxFlasks,
      ash: g.ash,
      checkpoint: g.checkpointRoom,
      chain: a.editor.chain.length,
      chainIndex: a.editor.chainIndex,
      platforms: g.room.platforms.length,
    };
  })()`);
  check(played.started === true, 'startCustomStage accepts a valid chained map');
  check(played.kind === 'custom' && played.inRun, 'the run is a custom run and the shell is playing');
  check(played.customRoom && played.roomIndex === -1, 'the engine loads the synthetic room, not a campaign slot');
  check(played.enemies === edited.enemies, 'every placed enemy spawns in the live engine');
  check(played.weapon === 'sword' && played.flask >= 1, 'class, weapon and flask loadout are applied');
  check(played.chain === 2 && played.chainIndex === 0, 'the run starts at room one of the chain');
  check(played.platforms >= 4, 'the painted terrain reaches the live room');

  // Clear room one: the chain must advance instead of ending.
  await evaluate(`(() => {
    const a = window.__ashen;
    a.game.ash = 333;
    for (const enemy of a.game.enemies) { enemy.hp = 0; enemy.dead = true; }
    a.game.cleanup();
    a.step(1.4);
  })()`);
  await sleep(200);
  const advanced = await evaluate(`(() => {
    const a = window.__ashen;
    return {
      chainIndex: a.editor.chainIndex,
      room: a.editor.activeStage?.name,
      enemies: a.game.enemies.length,
      ash: a.game.ash,
      clearOpen: a.editor.clearOpen,
      roomIndex: a.game.roomIndex,
      menu: a.menuView,
    };
  })()`);
  check(advanced.chainIndex === 1, 'clearing room one advances the chain');
  check(advanced.room === 'Ruang Kedua' && advanced.roomIndex === -1, 'the second room loads into the same custom slot');
  check(advanced.ash === 333, 'ash carries across the chain');
  check(advanced.clearOpen === false, 'the result card waits for the last room');

  // Clear room two: the chain is done.
  await evaluate(`(() => {
    const a = window.__ashen;
    for (const enemy of a.game.enemies) { enemy.hp = 0; enemy.dead = true; }
    a.game.cleanup();
    a.step(1.4);
  })()`);
  let cleared;
  try {
    cleared = await waitFor(
      () => evaluate(`(() => {
        const screen = document.getElementById('custom-clear-screen');
        const a = window.__ashen;
        return (!screen.classList.contains('hidden') && a.editor.clearOpen) ? {
          open: true,
          title: document.getElementById('custom-clear-title').textContent,
          body: document.getElementById('custom-clear-body').textContent,
          clears: a.editor.save.clears[a.editor.save.stages[0].id]?.count || 0,
        } : null;
      })()`),
      8000,
      'custom clear card',
    );
  } catch (error) {
    const diag = await evaluate(`(() => {
      const a = window.__ashen;
      const e = a.editor;
      return { cleared: e.cleared, engaged: e.engaged, elapsed: e.elapsed, gameState: e.gameState, clearOpen: e.clearOpen, chainIndex: e.chainIndex, chain: e.chain, started: a.started, menuView: a.menuView };
    })()`);
    console.log(`  · diagnostics ${JSON.stringify(diag)}`);
    cleared = { open: false, title: '', body: '', clears: 0 };
  }
  check(cleared.open && cleared.title === 'Ujian Peta Otomatis', 'clearing the last room opens the result card for the chain');
  check(/Ruang/.test(cleared.body) && cleared.clears === 1, 'the chain clear is recorded once against its first room');

  // Share code round trip through the real buttons.
  const share = await evaluate(`(() => {
    const a = window.__ashen;
    const stagesBefore = a.editor.save.stages.length;
    document.querySelector('[data-editor-share="copy"]').click();
    const code = document.getElementById('editor-share-input').value;
    document.querySelector('[data-editor-share="import"]').click();
    return {
      stagesBefore,
      prefix: code.slice(0, 6),
      length: code.length,
      stagesAfter: a.editor.save.stages.length,
      names: a.editor.save.stages.map((stage) => stage.name),
      raw: JSON.parse(localStorage.getItem('ashen-vow-mapeditor-v1')).stages.length,
      message: a.editor.shareMessage,
    };
  })()`);
  check(share.prefix === 'AVME1.' && share.length > 40, 'SALIN KODE fills the field with an AVME1 chain code');
  check(share.stagesAfter === share.stagesBefore + 2, 'IMPOR adds every room of the shared chain');
  check(share.names.includes('Ujian Peta Otomatis') && share.names.includes('Ruang Kedua'), 'imported rooms keep their names');
  check(share.raw === share.stagesAfter, 'the imported chain is written to the editor save');

  const rejected = await evaluate(`(() => {
    const a = window.__ashen;
    const before = a.editor.save.stages.length;
    const input = document.getElementById('editor-share-input');
    input.value = 'bukan kode';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('[data-editor-share="import"]').click();
    return { before, after: a.editor.save.stages.length, message: a.editor.shareMessage };
  })()`);
  check(rejected.after === rejected.before, 'a junk code is refused without touching the save');
  check(/AVME1/.test(rejected.message), 'the refusal explains the expected prefix');

  const siegeStart = await evaluate(`(() => {
    const a = window.__ashen;
    const before = a.editor.save.stages.length;
    document.querySelector('[data-editor-preset="preset_siege"]').click();
    const stage = a.editor.stage;
    const started = a.startCustomStage();
    const badge = document.getElementById('custom-badge');
    return {
      before,
      after: a.editor.save.stages.length,
      name: stage.name,
      objective: stage.objective,
      seconds: stage.surviveSeconds,
      started,
      runObjective: a.editor.objective,
      badge: badge ? badge.textContent : '',
      badgeHidden: badge ? badge.classList.contains('hidden') : true,
    };
  })()`);
  check(siegeStart.after === siegeStart.before + 1 && siegeStart.started, 'the Pengepungan preset adds a playable fourth map');
  check(siegeStart.objective === 'survive' && siegeStart.runObjective === 'survive', 'the survival objective reaches the live run');
  check(/BERTAHAN/.test(siegeStart.badge) && !siegeStart.badgeHidden, 'the HUD badge shows the survival clock');

  const siegeDone = await evaluate(`(() => {
    const a = window.__ashen;
    a.game.enemies.length = 0;
    for (let i = 0; i < 46; i += 1) a.step(1.4);
    const title = document.getElementById('custom-clear-title');
    return {
      clearOpen: a.editor.clearOpen,
      title: title ? title.textContent : '',
      left: a.editor.surviveLeft,
      state: a.editor.gameState,
    };
  })()`);
  check(siegeDone.clearOpen && /Pengepungan/.test(siegeDone.title), 'a survival room ends on the clock even with the roster emptied');
  check(siegeDone.left === 0 && siegeDone.state === 'playing', 'the survival clock reached zero and the run never died');

  // Backward compatibility: import a v0.40.0 (schema 2) AVME1 code through the real form.
  const legacyV2 = await evaluate(`(() => {
    const a = window.__ashen;
    const before = a.editor.save.stages.length;
    const payload = {
      v: 2,
      stages: [{
        n: 'Warisan v0.40', s: 'skema dua', l: 'flat', p: [{ x: 0, y: 470, w: 1400, h: 70 }],
        z: 'ashen', m: 'ashen', bm: 'boss', i: 'none', c: 'sera', w: ['sword'],
        a: 0, f: 3, ash: 45, r: false, k: false, bo: null, e: [{ type: 'crawler', x: 320 }], nx: -1,
      }],
    };
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    const b64url = btoa(String.fromCharCode(...bytes)).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/g, '');
    const input = document.getElementById('editor-share-input');
    input.value = 'AVME1.' + b64url;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('[data-editor-share="import"]').click();
    const imported = a.editor.save.stages.find((s) => s.name === 'Warisan v0.40');
    return {
      before,
      after: a.editor.save.stages.length,
      difficulty: imported?.difficulty,
      objective: imported?.objective,
      elite: imported?.enemies?.[0]?.elite,
    };
  })()`);
  check(legacyV2.after === legacyV2.before + 1, 'a v0.40.0 (schema 2) AVME1 code still imports');
  check(legacyV2.difficulty === 'normal' && legacyV2.objective === 'clear' && legacyV2.elite === false,
    'imported v0.40.0 maps receive safe schema 3 defaults');

  await send('Page.reload');
  try {
    await waitFor(() => evaluate('typeof window.__ashen === "object" && window.__ashenBoot?.ready === true'), 25000, 'boot after reload');
  } catch (err) {
    throw new Error(`[APP_BOOT] reload failed: ${err.message}`);
  }
  const persisted = await evaluate(`(() => {
    const raw = JSON.parse(localStorage.getItem('ashen-vow-mapeditor-v1'));
    const progress = JSON.parse(localStorage.getItem('ashen-vow-progress-v1') || '{}');
    const linked = raw.stages.filter((stage) => stage.nextStageId && raw.stages.some((other) => other.id === stage.nextStageId));
    return {
      name: raw.stages[0].name,
      stages: raw.stages.length,
      clears: raw.clears[raw.stages[0].id]?.count || 0,
      platforms: raw.stages[0].platforms.length,
      linked: linked.length,
      difficulty: raw.stages[0].difficulty,
      surviveMaps: raw.stages.filter((stage) => stage.objective === 'survive').length,
      campaignUntouched: Object.keys(progress.stageTimes || {}).every((key) => !key.startsWith('custom:')),
    };
  })()`);
  check(persisted.name === 'Ujian Peta Otomatis' && persisted.stages === share.stagesAfter + 2, 'maps and imports survive a reload');
  check(['story', 'easy', 'normal', 'hard', 'nightmare', 'abyssal'].includes(persisted.difficulty), 'the map takaran survives a reload');
  check(persisted.surviveMaps === 1, 'the survival map survives a reload');
  check(persisted.clears === 1, 'the chain clear record survives a reload');
  check(persisted.platforms >= 4 && persisted.linked >= 2, 'terrain and chain links survive a reload');
  check(persisted.campaignUntouched, 'no custom stage time is written into campaign progress');

  // Mobile portrait viewport (390x844): layout overflow, canvas drag and auto-balance.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await evaluate(`(async () => {
    const a = window.__ashen;
    if (a.menuView === 'trailer') document.getElementById('btn-trailer-close')?.click();
    await a.showEditor();
  })()`);
  await sleep(250);
  const mobile = await evaluate(`(() => {
    const a = window.__ashen;
    const screen = document.getElementById('editor-screen');
    const canvas = document.getElementById('editor-canvas');
    const rect = canvas.getBoundingClientRect();
    const toClient = (wx, wy) => ({
      clientX: rect.left + (wx / 1400) * rect.width,
      clientY: rect.top + (wy / 540) * rect.height,
    });
    const beforePlats = a.editor.stage.platforms.length;
    const opts = (pt) => ({ bubbles: true, cancelable: true, pointerId: 2, pointerType: 'touch', isPrimary: true, ...pt });
    canvas.dispatchEvent(new PointerEvent('pointerdown', opts(toClient(400, 200))));
    window.dispatchEvent(new PointerEvent('pointermove', opts(toClient(620, 200))));
    window.dispatchEvent(new PointerEvent('pointerup', opts(toClient(620, 200))));
    const afterPlats = a.editor.stage.platforms.length;
    document.querySelector('[data-editor-balance="auto"]').click();
    return {
      open: !!screen && !screen.classList.contains('hidden'),
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      beforePlats,
      afterPlats,
      band: a.editor.rating?.band,
    };
  })()`);
  await send('Emulation.clearDeviceMetricsOverride');
  check(mobile.open && mobile.overflow <= 1, `390x844 portrait opens editor without horizontal overflow (${mobile.overflow}px)`);
  check(mobile.afterPlats === mobile.beforePlats + 1, 'canvas drag works on 390x844 mobile portrait');
  check(Boolean(mobile.band), `AUTO-SEIMBANG works on 390x844 mobile portrait (${mobile.band})`);

  check(consoleErrors.length === 0, `no console errors (${consoleErrors.length})`);
  if (consoleErrors.length) console.log(consoleErrors.slice(0, 5).join('\n'));
} catch (error) {
  failed += 1;
  const msg = String(error?.message || error);
  const kind = /^\[(BROWSER_LAUNCH|APP_BOOT)\]/.test(msg) ? '' : '[ASSERTION] ';
  console.log(`  ✗ ${kind}${msg}`);
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
  await sleep(200);
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
