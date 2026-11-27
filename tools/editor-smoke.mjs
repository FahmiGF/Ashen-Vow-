// Real-browser smoke for Peta Sumpah, including portrait layout, terrain,
// room chains, share codes and the schema 3 balancing controls.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9356;
const mobile = process.env.ASHEN_SMOKE_MOBILE === '1';
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-editor-'));
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  ...(process.env.ASHEN_CHROME_NO_SANDBOX === '1' ? ['--no-sandbox'] : []),
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
  if (mobile) await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, mobile: true, deviceScaleFactor: 1 });
  await waitFor(() => evaluate('typeof window.__ashen === "object"'), 25000, 'boot');

  const boot = await evaluate(`(async () => {
    const a = window.__ashen;
    localStorage.removeItem('ashen-vow-mapeditor-v1');
    if (a.menuView === "trailer") a.closeTrailer();
    const editorResources = () => performance.getEntriesByType('resource').filter(entry =>
      /\\/(mapeditor\\.js|styles-mapeditor\\.css)$/.test(new URL(entry.name).pathname));
    const coldAssets = editorResources().length;
    const opening = a.showEditor();
    const loading = document.getElementById('editor-load-status').textContent.includes('Memuat');
    document.getElementById('btn-editor-back').click();
    const stayedBack = !(await opening) && a.menuView === 'title' && !a.editor;
    document.getElementById('btn-editor-menu').click();
    for (let tries = 0; !a.editor && tries < 100; tries += 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (!a.editor) throw new Error('The editor never finished loading');
    return {
      coldAssets, loading, stayedBack, fetchedAssets: editorResources().length,
      hasEditor: typeof a.showEditor === 'function',
      summary: a.editor.summary,
      stages: a.editor.save.stages.length,
      schema: a.editor.save.version,
    };
  })()`);
  check(boot.coldAssets === 0 && boot.fetchedAssets === 2, 'editor JavaScript and CSS load together on first entry');
  check(boot.loading && boot.stayedBack, 'the loading view can be dismissed before the editor resolves');
  check(boot.hasEditor, 'the editor ships a real debug surface');
  check(boot.stages === 1, 'a fresh profile starts with exactly one starter map');
  check(boot.schema === 3, 'the save is schema 3 (takaran + terrain + chains)');
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
  if (mobile) check(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'the editor fits the portrait viewport');

  // Paint a platform through the real canvas pointer events.
  const painted = await evaluate(`(async () => {
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
    const ctx = canvas.getContext('2d');
    const createLinearGradient = ctx.createLinearGradient;
    let previews = 0;
    ctx.createLinearGradient = function (...args) {
      previews += 1;
      return createLinearGradient.apply(this, args);
    };
    try {
      for (let move = 1; move <= 60; move += 1) {
        window.dispatchEvent(new PointerEvent('pointermove', opts(toClient(912 + (190 * move) / 60, 238))));
      }
      await new Promise(resolve => requestAnimationFrame(resolve));
    } finally {
      ctx.createLinearGradient = createLinearGradient;
    }
    window.dispatchEvent(new PointerEvent('pointerup', opts(end)));
    const stage = window.__ashen.editor.stage;
    const selected = window.__ashen.editor.selectedPlatform;
    canvas.dispatchEvent(new PointerEvent('pointerdown', opts(toClient(200, 180))));
    window.dispatchEvent(new PointerEvent('pointermove', opts(toClient(420, 180))));
    window.dispatchEvent(new PointerEvent('pointercancel', opts(toClient(420, 180))));
    const afterCancel = window.__ashen.editor.stage.platforms.length;
    canvas.dispatchEvent(new PointerEvent('pointerdown', opts(toClient(1000, 245))));
    window.dispatchEvent(new PointerEvent('pointerup', opts(toClient(1000, 245))));
    return {
      before, previews,
      after: stage.platforms.length,
      last: stage.platforms[stage.platforms.length - 1],
      selected, afterCancel,
    };
  })()`);
  check(painted.previews === 1, `60 pointer moves in one frame repaint the preview once (${painted.previews})`);
  check(painted.afterCancel === painted.after, 'a cancelled pointer gesture does not create a platform');
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

  await send('Page.reload');
  await waitFor(() => evaluate('typeof window.__ashen === "object"'), 25000, 'boot after reload');
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
      campaignUntouched: Object.keys(progress.stageTimes || {}).every((key) => !key.startsWith('custom:')),
    };
  })()`);
  check(persisted.name === 'Ujian Peta Otomatis' && persisted.stages === share.stagesAfter, 'maps and imports survive a reload');
  check(persisted.clears === 1, 'the chain clear record survives a reload');
  check(persisted.platforms >= 4 && persisted.linked >= 2, 'terrain and chain links survive a reload');
  check(persisted.campaignUntouched, 'no custom stage time is written into campaign progress');

  const updated = await evaluate(`(async () => {
    const a = window.__ashen;
    if (a.menuView === 'trailer') a.closeTrailer();
    await a.showEditor();
    const field = (name, value) => {
      const element = document.querySelector('[data-editor-field="' + name + '"]');
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    };
    field('difficulty', 'story');
    field('objective', 'survive');
    field('surviveSeconds', '25');
    field('boss', '');
    field('flasks', '6');
    for (let i = 0; i < 28; i += 1) {
      document.querySelector('[data-editor-remove-enemy]')?.click();
    }
    document.getElementById('editor-enemy-select').value = 'crawler';
    document.querySelector('[data-editor-add-enemy]').click();
    document.querySelector('[data-editor-elite="0"]').click();
    const before = structuredClone(a.editor.stage);
    const previous = before.enemies.length;
    const initial = document.querySelector('#editor-balance-panel').innerText;
    document.querySelector('[data-editor-balance="auto"]').click();
    const after = structuredClone(a.editor.stage);
    const raw = JSON.parse(localStorage.getItem('ashen-vow-mapeditor-v1'));
    const result = {
      difficultyOptions: document.querySelector('[data-editor-field="difficulty"]').options.length,
      before: before.objective === 'survive' && before.surviveSeconds === 25 && before.enemies[0].elite,
      after: after.objective === 'survive' && after.surviveSeconds === 25 && after.enemies[0].elite,
      updated: after.enemies.length !== previous || after.difficulty !== 'story' || after.flasks !== before.flasks,
      meter: document.querySelector('#editor-balance-panel').innerText !== initial,
      message: document.getElementById('editor-message').innerText,
      saved: JSON.stringify(raw.stages.find(stage => stage.id === after.id)) === JSON.stringify(after),
    };
    field('nextStageId', '');
    field('intro', 'none');
    result.started = a.startCustomStage();
    a.game.player.invuln = 100;
    a.step(10);
    result.midRun = !a.editor.clearOpen && a.editor.surviveLeft > 0 && a.editor.surviveLeft < 25;
    a.step(16);
    result.timedClear = a.editor.clearOpen && a.game.enemies.some(enemy => !enemy.dead && enemy.hp > 0);
    return result;
  })()`);
  check(updated.difficultyOptions === 6, 'all six takaran are selectable');
  check(updated.before && updated.after, 'auto-balance preserves the survival objective, duration and first elite');
  check(updated.updated && updated.meter, 'auto-balance updates the real draft and pressure meter');
  check(/Diseimbangkan/i.test(updated.message) && updated.saved, 'auto-balance reports the changes and saves the result');
  check(updated.started && updated.midRun && updated.timedClear, 'a timed run clears at the deadline with enemies still alive');
  if (!(updated.updated && updated.meter && updated.saved)) console.log(updated);

  const legacyCode = 'AVME1.' + Buffer.from(JSON.stringify({ v: 2, stages: [{ n: 'Peta v0.40', e: [] }] })).toString('base64url');
  const legacy = await evaluate(`window.__ashen.decodeEditorCode(${JSON.stringify(legacyCode)})`);
  check(legacy.ok && legacy.stages[0].name === 'Peta v0.40' && legacy.stages[0].difficulty === 'normal'
    && legacy.stages[0].objective === 'clear', 'a schema 2 share code gets the correct schema 3 defaults');

  check(consoleErrors.length === 0, `no console errors (${consoleErrors.length})`);
  if (consoleErrors.length) console.log(consoleErrors.slice(0, 5).join('\n'));
} catch (error) {
  failed += 1;
  console.log(`  ✗ ${error.message}`);
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
  await sleep(200);
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
