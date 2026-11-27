// Lazy-loaded controller for PETA SUMPAH (Campaign Map Editor, Update XXIX–XXXI).
// Owns the editor save, form rendering, canvas terrain painter, share codes,
// and custom stage run/chain lifecycle. Loaded on demand when entering Peta Sumpah.
import {
  ALL_ENEMY_INFO,
  ALL_BOSS_INFO,
  WORLD_W,
  FLOOR_Y,
} from './core.js';
import { ZONES } from './zones.js';
import { bossTrackFor } from './music.js';
import { SPIRAL_INTRO_CUTSCENE } from './cutscene.js';
import {
  MAP_EDITOR_SAVE_KEY,
  MAP_EDITOR_MAX_ARROWS,
  MAP_EDITOR_MAX_ASH,
  MAP_EDITOR_MAX_ENEMIES,
  MAP_EDITOR_MAX_FLASKS,
  MAP_EDITOR_MAX_STAGES,
  MAP_EDITOR_MAX_WEAPONS,
  MAP_EDITOR_MAX_PLATFORMS,
  MAP_EDITOR_MAX_CHAIN,
  MAP_EDITOR_GRID,
  MAP_EDITOR_WORLD_H,
  MAP_EDITOR_NAME_MAX,
  MAP_EDITOR_SUBTITLE_MAX,
  MAP_EDITOR_LAYOUTS,
  MAP_EDITOR_INTROS,
  MAP_EDITOR_ZONE_OPTIONS,
  MAP_EDITOR_MUSIC_OPTIONS,
  MAP_EDITOR_WEAPON_OPTIONS,
  MAP_EDITOR_CLASS_OPTIONS,
  MAP_EDITOR_ENEMY_OPTIONS,
  MAP_EDITOR_BOSS_OPTIONS,
  MAP_EDITOR_DIFFICULTY_OPTIONS,
  MAP_EDITOR_OBJECTIVES,
  MAP_EDITOR_SURVIVE_MIN,
  MAP_EDITOR_SURVIVE_MAX,
  MAP_EDITOR_MAX_ELITES,
  MAP_EDITOR_BALANCE_TARGET,
  layoutFor,
  mapDifficultyScale,
  threatRating,
  autoBalanceBlueprint,
  customBossOverrides,
  terrainFromLayout,
  supportsSpawn,
  isTemplateTerrain,
  blueprintFromPreset,
  sanitizeBlueprint,
  sanitizeEditorSave,
  defaultEditorSave,
  validateBlueprint,
  customRoomFromBlueprint,
  newBlueprintId,
  upsertBlueprint,
  removeBlueprint,
  recordEditorPlay,
  recordEditorClear,
  editorSummary,
  chainFor,
  encodeShareCode,
  decodeShareCode,
  drawEditorPreview,
} from './mapeditor.js';

export function createMapEditorController(ctx) {
  const {
    $,
    esc,
    game,
    audio,
    formatTime,
    getMenuView,
    setMenuView,
    isStarted,
    setStarted,
    setPaused,
    getActiveRunKind,
    setActiveRunKind,
    clearShellOverlays,
    resetArenaStateForCustomRun,
    applyCustomPlayerLoadout,
    applyCustomHunterItems,
    beginCustomStageRecord,
    setCustomIntroCallback,
    startPrologue,
    openTrailer,
    startCutscene,
    syncScreens,
    updateHud,
    clearHeldKeys,
    showBanner,
    showToast,
    showMenu,
    unlockAudio,
  } = ctx;

  let editorSave = loadEditorSave();
  let editorSelectedId = editorSave.selectedId || editorSave.stages[0]?.id || null;
  let editorMessage = null;
  let editorMessageKind = '';

  let customStage = null;
  let customChain = [];
  let customChainIndex = 0;
  let customStageCleared = false;
  let customStageEngaged = false;
  let customStageElapsed = 0;
  let customClearOpen = false;

  let editorSelectedPlatform = -1;
  let editorDrag = null;
  let editorShareMessage = '';
  let editorShareKind = '';
  let editorShareText = '';

  let customSurviveLeft = 0;
  let domBound = false;

  function loadEditorSave() {
    try {
      const raw = localStorage.getItem(MAP_EDITOR_SAVE_KEY);
      return sanitizeEditorSave(raw ? JSON.parse(raw) : null);
    } catch {
      return defaultEditorSave();
    }
  }

  function saveEditorSave() {
    try {
      localStorage.setItem(MAP_EDITOR_SAVE_KEY, JSON.stringify(editorSave));
    } catch {
      /* storage unavailable — keep the in-memory copy */
    }
  }

  function currentEditorStage() {
    return editorSave.stages.find((stage) => stage.id === editorSelectedId) || editorSave.stages[0] || null;
  }

  function editorAttr(value) {
    return esc(String(value ?? '')).replace(/"/g, '&quot;');
  }

  function editorOptions(list, selected) {
    return list
      .map((option) => `<option value="${editorAttr(option.id)}"${option.id === selected ? ' selected' : ''}>${esc(option.name)}</option>`)
      .join('');
  }

  function open() {
    clearShellOverlays();
    setStarted(false);
    setPaused(false);
    customClearOpen = false;
    editorSave = loadEditorSave();
    editorSelectedPlatform = -1;
    editorDrag = null;
    editorShareMessage = '';
    editorShareKind = '';
    if (!editorSave.stages.some((stage) => stage.id === editorSelectedId)) {
      editorSelectedId = editorSave.stages[0]?.id || null;
    }
    setMenuView('editor');
    clearHeldKeys();
    buildEditorScreen();
    syncScreens();
    return true;
  }

  function buildEditorScreen() {
    const summary = editorSummary(editorSave);
    const box = $('editor-summary');
    if (box) {
      box.innerHTML = `
        <div class="stat"><strong>${summary.stages}</strong><span>Peta Tersimpan</span></div>
        <div class="stat"><strong>${summary.platforms}</strong><span>Pijakan</span></div>
        <div class="stat"><strong>${summary.enemies}</strong><span>Total Musuh</span></div>
        <div class="stat"><strong>${summary.elites}</strong><span>Musuh Elite</span></div>
        <div class="stat"><strong>${summary.bosses}</strong><span>Peta Berbos</span></div>
        <div class="stat"><strong>${summary.survive}</strong><span>Peta Bertahan</span></div>
        <div class="stat"><strong>${summary.chained}</strong><span>Ruangan Berantai</span></div>
        <div class="stat"><strong>${summary.plays}</strong><span>Kali Dimainkan</span></div>`;
    }
    renderEditorList();
    renderEditorForm();
    renderEditorMessage();
  }

  function editorChainLength(id) {
    const seen = new Set();
    let length = 0;
    let current = editorSave.stages.find((stage) => stage.id === id) || null;
    while (current && !seen.has(current.id) && length < MAP_EDITOR_MAX_CHAIN) {
      seen.add(current.id);
      length += 1;
      current = current.nextStageId
        ? editorSave.stages.find((stage) => stage.id === current.nextStageId) || null
        : null;
    }
    return length;
  }

  function renderEditorList() {
    const list = $('editor-list');
    if (!list) return;
    list.innerHTML = editorSave.stages
      .map((stage) => {
        const boss = stage.boss ? ALL_BOSS_INFO[stage.boss]?.name || stage.boss : null;
        const plays = editorSave.plays[stage.id] || 0;
        const rooms = editorChainLength(stage.id);
        const rating = threatRating(stage);
        const scale = mapDifficultyScale(stage.difficulty);
        return `<li class="${stage.id === editorSelectedId ? 'active' : ''}">
          <button type="button" data-editor-select="${editorAttr(stage.id)}">
            <b>${esc(stage.name)}</b>
            <em>${esc(stage.subtitle)} · ${stage.enemies.length} musuh${boss ? ` · ${esc(boss)}` : ''}${rooms > 1 ? ` · ${rooms} ruang` : ''}${plays ? ` · ${plays}× main` : ''}</em>
            <em class="editor-list-tags"><span class="tag ${rating.tone}">${esc(scale.name.toUpperCase())} · ${esc(rating.label.toUpperCase())}</span>${stage.objective === 'survive' ? `<span class="tag survive">BERTAHAN ${stage.surviveSeconds} DTK</span>` : ''}${rating.elites ? `<span class="tag elite">${rating.elites} ELITE</span>` : ''}</em>
          </button>
        </li>`;
      })
      .join('');
  }

  function editorBalanceHtml(stage) {
    const rating = threatRating(stage);
    const pct = Math.max(4, Math.min(100, (rating.ratio / 4) * 100));
    const mark = Math.max(0, Math.min(100, (MAP_EDITOR_BALANCE_TARGET / 4) * 100));
    const tips = rating.tips.length
      ? rating.tips.map((tip) => `<li>${esc(tip)}</li>`).join('')
      : '<li>Takaran ini sudah di titik seimbang.</li>';
    return `
      <div class="editor-balance ${rating.tone}">
        <div class="editor-balance-head">
          <strong>${esc(rating.label.toUpperCase())}</strong>
          <span>${rating.ratio}× tekanan · ${esc(rating.difficultyName)}</span>
        </div>
        <div class="editor-balance-meter" role="img" aria-label="Tekanan ${rating.ratio} kali kekuatan pemain">
          <span class="editor-balance-fill" style="width:${pct.toFixed(1)}%"></span>
          <i class="editor-balance-mark" style="left:${mark.toFixed(1)}%" title="Target seimbang"></i>
        </div>
        <div class="editor-balance-figures">
          <span><b>${rating.score}</b> beban ruang</span>
          <span><b>${rating.power}</b> kekuatan pemain</span>
          <span><b>${rating.elites}</b> elite</span>
          <span><b>${MAP_EDITOR_BALANCE_TARGET}×</b> target</span>
        </div>
        <ul class="editor-balance-tips">${tips}</ul>
        <div class="editor-terrain-actions">
          <button class="btn btn-ghost btn-compact" type="button" data-editor-balance="auto">AUTO-SEIMBANG</button>
          <button class="btn btn-ghost btn-compact" type="button" data-editor-balance="lighter">TAKARAN LEBIH RINGAN</button>
        </div>
      </div>`;
  }

  function renderEditorBalance() {
    const panel = $('editor-balance-panel');
    const stage = currentEditorStage();
    if (!panel || !stage) return;
    panel.innerHTML = editorBalanceHtml(stage);
  }

  function renderEditorForm() {
    const host = $('editor-form');
    if (!host) return;
    const stage = currentEditorStage();
    if (!stage) {
      host.innerHTML = '<p class="editor-empty">Belum ada peta. Tekan PETA BARU.</p>';
      return;
    }
    const zone = ZONES[stage.zone] || ZONES.ashen;
    const layout = layoutFor(stage.layout);
    const scale = mapDifficultyScale(stage.difficulty);
    const objectiveOptions = MAP_EDITOR_OBJECTIVES.map((entry) => ({ id: entry.id, name: entry.label }));
    const bossOptions = [{ id: '', name: '— tanpa bos —' }, ...MAP_EDITOR_BOSS_OPTIONS];
    const nextOptions = [
      { id: '', name: '— tamat di ruang ini —' },
      ...editorSave.stages.filter((entry) => entry.id !== stage.id).map((entry) => ({ id: entry.id, name: entry.name })),
    ];
    const chain = chainFor(editorSave, stage.id);
    host.innerHTML = `
      <h3>IDENTITAS &amp; DUNIA</h3>
      <div class="editor-grid">
        <label>NAMA<input data-editor-field="name" maxlength="${MAP_EDITOR_NAME_MAX}" value="${editorAttr(stage.name)}" /></label>
        <label>SUBJUDUL<input data-editor-field="subtitle" maxlength="${MAP_EDITOR_SUBTITLE_MAX}" value="${editorAttr(stage.subtitle)}" /></label>
        <label>LATAR ZONA<select data-editor-field="zone">${editorOptions(MAP_EDITOR_ZONE_OPTIONS, stage.zone)}</select></label>
        <label>TATA LETAK<select data-editor-field="layout">${editorOptions(MAP_EDITOR_LAYOUTS, stage.layout)}</select></label>
        <label>MUSIK<select data-editor-field="music">${editorOptions(MAP_EDITOR_MUSIC_OPTIONS, stage.music)}</select></label>
        <label>MUSIK BOS<select data-editor-field="bossMusic">${editorOptions(MAP_EDITOR_MUSIC_OPTIONS, stage.bossMusic)}</select></label>
        <label>PEMBUKA<select data-editor-field="intro">${editorOptions(MAP_EDITOR_INTROS, stage.intro)}</select></label>
        <label>KELAS<select data-editor-field="classId">${editorOptions(MAP_EDITOR_CLASS_OPTIONS, stage.classId)}</select></label>
        <label>TAKARAN<select data-editor-field="difficulty">${editorOptions(MAP_EDITOR_DIFFICULTY_OPTIONS, stage.difficulty)}</select></label>
        <label>OBJEKTIF<select data-editor-field="objective">${editorOptions(objectiveOptions, stage.objective)}</select></label>
        <label>WAKTU BERTAHAN (DTK)<input type="number" min="${MAP_EDITOR_SURVIVE_MIN}" max="${MAP_EDITOR_SURVIVE_MAX}" step="5" data-editor-field="surviveSeconds" value="${stage.surviveSeconds}"${stage.objective === 'survive' ? '' : ' disabled'} /></label>
        <label>ANAK PANAH<input type="number" min="0" max="${MAP_EDITOR_MAX_ARROWS}" data-editor-field="arrows" value="${stage.arrows}" /></label>
        <label>FLASK<input type="number" min="1" max="${MAP_EDITOR_MAX_FLASKS}" data-editor-field="flasks" value="${stage.flasks}" /></label>
        <label>ABU AWAL<input type="number" min="0" max="${MAP_EDITOR_MAX_ASH}" data-editor-field="ash" value="${stage.ash}" /></label>
        <label>BOS<select data-editor-field="boss">${editorOptions(bossOptions, stage.boss || '')}</select></label>
        <label>LANJUT KE PETA<select data-editor-field="nextStageId">${editorOptions(nextOptions, stage.nextStageId || '')}</select></label>
      </div>
      <div class="editor-toggles">
        <label><input type="checkbox" data-editor-field="relic"${stage.relic ? ' checked' : ''} /> Relik di ujung peta</label>
        <label><input type="checkbox" data-editor-field="checkpoint"${stage.checkpoint ? ' checked' : ''} /> Warung Abu di pintu masuk</label>
      </div>
      <p class="editor-empty">${esc(layout.note)} · ${esc(zone.name)} · partikel ${esc(zone.particle || 'ash')} · ${esc(scale.note)}</p>

      <div class="editor-section">
        <h3>TAKARAN &amp; KESEIMBANGAN</h3>
        <div id="editor-balance-panel">${editorBalanceHtml(stage)}</div>
      </div>

      <div class="editor-section">
        <h3>KANVAS MEDAN · ${stage.platforms.length}/${MAP_EDITOR_MAX_PLATFORMS} PIJAKAN · ${isTemplateTerrain(stage) ? esc(layout.label) : 'KANVAS BEBAS'}</h3>
        <canvas id="editor-canvas" class="editor-canvas" width="700" height="270" aria-label="Pratinjau medan peta"></canvas>
        <div class="editor-terrain-actions">
          <button class="btn btn-ghost btn-compact" type="button" data-editor-terrain="floor">+ LANTAI PENUH</button>
          <button class="btn btn-ghost btn-compact" type="button" data-editor-terrain="ledge">+ PIJAKAN</button>
          <button class="btn btn-ghost btn-compact" type="button" data-editor-terrain="delete"${editorSelectedPlatform < 0 ? ' disabled' : ''}>HAPUS TERPILIH</button>
          <button class="btn btn-ghost btn-compact" type="button" data-editor-terrain="reset">RESET TATA LETAK</button>
        </div>
        <p class="editor-empty">Seret di kanvas untuk menggambar pijakan. Klik pijakan untuk memilihnya, lalu HAPUS. Titik awal (hijau) harus tetap beralas.</p>
      </div>

      <div class="editor-section">
        <h3>SENJATA AWAL · ${stage.weapons.length}/${MAP_EDITOR_MAX_WEAPONS}</h3>
        <div class="editor-weapons">
          ${MAP_EDITOR_WEAPON_OPTIONS.map((weapon) => `<label><input type="checkbox" data-editor-weapon="${editorAttr(weapon.id)}"${stage.weapons.includes(weapon.id) ? ' checked' : ''} /> ${esc(weapon.name)}</label>`).join('')}
        </div>
      </div>

      <div class="editor-section">
        <h3>MUSUH · ${stage.enemies.length}/${MAP_EDITOR_MAX_ENEMIES} · ${stage.enemies.filter((enemy) => enemy.elite).length}/${MAP_EDITOR_MAX_ELITES} ELITE</h3>
        <div class="editor-enemy-add">
          <select id="editor-enemy-select" aria-label="Jenis musuh">${editorOptions(MAP_EDITOR_ENEMY_OPTIONS, '')}</select>
          <button class="btn btn-ghost btn-compact" type="button" data-editor-add-enemy="1">+ TAMBAH</button>
        </div>
        <div class="editor-enemies">
          ${stage.enemies.length
            ? stage.enemies.map((enemy, index) => `
            <div class="editor-enemy-row${enemy.elite ? ' elite' : ''}">
              <span>${esc(ALL_ENEMY_INFO[enemy.type]?.name || enemy.type)}</span>
              <button type="button" class="editor-elite-btn${enemy.elite ? ' active' : ''}" data-editor-elite="${index}" aria-pressed="${!!enemy.elite}" title="Tandai musuh ini sebagai elite">⚔</button>
              <label class="editor-enemy-x">X<input type="number" min="60" max="${WORLD_W - 60}" step="10" data-editor-enemy-x="${index}" value="${enemy.x}" /></label>
              <button type="button" data-editor-remove-enemy="${index}" aria-label="Hapus musuh">×</button>
            </div>`).join('')
            : '<p class="editor-empty">Belum ada musuh. Peta bisa tetap dimainkan tanpa musuh.</p>'}
        </div>
      </div>

      <div class="editor-section">
        <h3>KODE BAGI · RANTAI ${chain.length} RUANG</h3>
        <div class="editor-share-row">
          <input id="editor-share-input" class="editor-share-input" type="text" spellcheck="false" autocomplete="off" placeholder="AVME1.…" value="${editorAttr(editorShareText)}" />
          <button class="btn btn-ghost btn-compact" type="button" data-editor-share="copy">SALIN KODE</button>
          <button class="btn btn-ghost btn-compact" type="button" data-editor-share="import">IMPOR</button>
        </div>
        <p class="editor-share-note ${editorShareKind}">${editorShareMessage ? esc(editorShareMessage) : 'Salin kode rantai untuk dibagikan, atau tempel kode peta orang lain lalu tekan IMPOR.'}</p>
      </div>
    `;
    paintEditorCanvas();
  }

  function renderEditorMessage() {
    const box = $('editor-message');
    if (!box) return;
    box.textContent = editorMessage || '';
    box.className = editorMessage ? `editor-message ${editorMessageKind}`.trim() : 'editor-message';
  }

  function paintEditorCanvas() {
    const canvas = $('editor-canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx2d = canvas.getContext('2d');
    const stage = currentEditorStage();
    if (!ctx2d || !stage) return;
    drawEditorPreview(ctx2d, stage, canvas.width, canvas.height, {
      selected: editorSelectedPlatform,
      pending: editorDrag && editorDrag.mode === 'paint' ? editorDrag.preview : null,
    });
  }

  function editorCanvasPoint(event) {
    const canvas = $('editor-canvas');
    if (!canvas || !canvas.getBoundingClientRect) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * WORLD_W,
      y: ((event.clientY - rect.top) / rect.height) * MAP_EDITOR_WORLD_H,
    };
  }

  const editorSnap = (value, min, max) =>
    Math.max(min, Math.min(max, Math.round(value / MAP_EDITOR_GRID) * MAP_EDITOR_GRID));

  function editorPointerDown(event) {
    if (getMenuView() !== 'editor') return;
    const stage = currentEditorStage();
    const point = editorCanvasPoint(event);
    if (!stage || !point) return;
    event.preventDefault();
    const hit = stage.platforms.findIndex(
      (platform) => point.x >= platform.x && point.x <= platform.x + platform.w
        && point.y >= platform.y - 10 && point.y <= platform.y + platform.h + 10,
    );
    if (hit >= 0) {
      editorSelectedPlatform = hit;
      editorDrag = { mode: 'select' };
      paintEditorCanvas();
      return;
    }
    editorSelectedPlatform = -1;
    const x = editorSnap(point.x, 0, WORLD_W - 40);
    const y = editorSnap(point.y, 140, FLOOR_Y);
    editorDrag = { mode: 'paint', startX: x, startY: y, x1: x, preview: null };
    paintEditorCanvas();
  }

  function editorPointerMove(event) {
    if (!editorDrag || editorDrag.mode !== 'paint') return;
    const point = editorCanvasPoint(event);
    if (!point) return;
    editorDrag.x1 = editorSnap(point.x, 0, WORLD_W);
    const left = Math.min(editorDrag.startX, editorDrag.x1);
    const spread = Math.abs(editorDrag.x1 - editorDrag.startX);
    editorDrag.preview = {
      x: left,
      y: editorDrag.startY,
      w: Math.max(MAP_EDITOR_GRID * 2, Math.min(WORLD_W - left, spread < MAP_EDITOR_GRID ? 160 : spread)),
      h: 18,
    };
    paintEditorCanvas();
  }

  function editorPointerUp() {
    const drag = editorDrag;
    editorDrag = null;
    if (!drag || drag.mode !== 'paint') {
      paintEditorCanvas();
      return;
    }
    const stage = currentEditorStage();
    if (!stage) return;
    if (stage.platforms.length >= MAP_EDITOR_MAX_PLATFORMS) {
      editorMessage = `Maksimal ${MAP_EDITOR_MAX_PLATFORMS} pijakan per peta.`;
      editorMessageKind = 'error';
      renderEditorMessage();
      paintEditorCanvas();
      return;
    }
    const left = Math.min(drag.startX, drag.x1);
    const spread = Math.abs(drag.x1 - drag.startX);
    const width = Math.max(MAP_EDITOR_GRID * 2, Math.min(WORLD_W - left, spread < MAP_EDITOR_GRID ? 160 : spread));
    stage.platforms.push({ x: left, y: drag.startY, w: width, h: 18 });
    editorSelectedPlatform = stage.platforms.length - 1;
    stage.updatedAt = Date.now();
    editorMessage = null;
    renderEditorList();
    renderEditorForm();
    renderEditorMessage();
  }

  function addEditorPlatform(kind) {
    const stage = currentEditorStage();
    if (!stage) return false;
    if (stage.platforms.length >= MAP_EDITOR_MAX_PLATFORMS) {
      editorMessage = `Maksimal ${MAP_EDITOR_MAX_PLATFORMS} pijakan per peta.`;
      editorMessageKind = 'error';
      renderEditorMessage();
      return false;
    }
    const platform = kind === 'floor'
      ? { x: 0, y: FLOOR_Y, w: WORLD_W, h: 70 }
      : { x: 420, y: 340, w: 240, h: 18 };
    stage.platforms.push(platform);
    editorSelectedPlatform = stage.platforms.length - 1;
    stage.updatedAt = Date.now();
    editorMessage = null;
    renderEditorList();
    renderEditorForm();
    return true;
  }

  function deleteEditorPlatform() {
    const stage = currentEditorStage();
    if (!stage || editorSelectedPlatform < 0 || !stage.platforms[editorSelectedPlatform]) return false;
    stage.platforms.splice(editorSelectedPlatform, 1);
    editorSelectedPlatform = -1;
    if (!supportsSpawn(stage.platforms)) {
      stage.platforms.push({ x: 0, y: FLOOR_Y, w: WORLD_W, h: 70 });
      editorMessage = 'Lantai penuh ditambahkan agar titik awal tetap beralas.';
      editorMessageKind = 'ok';
    }
    stage.updatedAt = Date.now();
    renderEditorList();
    renderEditorForm();
    renderEditorMessage();
    return true;
  }

  function resetEditorTerrain() {
    const stage = currentEditorStage();
    if (!stage) return false;
    stage.platforms = terrainFromLayout(stage.layout);
    editorSelectedPlatform = -1;
    stage.updatedAt = Date.now();
    editorMessage = `Medan dikembalikan ke ${layoutFor(stage.layout).label}.`;
    editorMessageKind = 'ok';
    renderEditorList();
    renderEditorForm();
    renderEditorMessage();
    return true;
  }

  function copyEditorShare() {
    const stages = chainFor(editorSave, editorSelectedId);
    const code = encodeShareCode(stages);
    if (!code) {
      editorShareMessage = 'Peta ini belum bisa dibagikan.';
      editorShareKind = 'error';
      renderEditorForm();
      return '';
    }
    editorShareText = code;
    editorShareMessage = `Kode ${stages.length} ruang siap dibagikan (${code.length} karakter).`;
    editorShareKind = 'ok';
    renderEditorForm();
    const input = $('editor-share-input');
    if (input) {
      input.focus();
      input.select();
    }
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(code).catch(() => {});
    return code;
  }

  function importEditorShare() {
    const report = decodeShareCode(editorShareText);
    if (!report.ok) {
      editorShareMessage = report.error;
      editorShareKind = 'error';
      renderEditorForm();
      return false;
    }
    const room = MAP_EDITOR_MAX_STAGES - editorSave.stages.length;
    if (room <= 0) {
      editorShareMessage = `Maksimal ${MAP_EDITOR_MAX_STAGES} peta tersimpan.`;
      editorShareKind = 'error';
      renderEditorForm();
      return false;
    }
    const accepted = report.stages.slice(0, room);
    const idMap = new Map();
    let state = editorSave;
    for (const stage of accepted) {
      const id = newBlueprintId(state);
      idMap.set(stage.id, id);
      state = upsertBlueprint(state, { ...stage, id, nextStageId: null, createdAt: Date.now(), updatedAt: Date.now() });
    }
    for (const stage of accepted) {
      const id = idMap.get(stage.id);
      const next = stage.nextStageId ? idMap.get(stage.nextStageId) || null : null;
      if (!next) continue;
      const saved = state.stages.find((entry) => entry.id === id);
      if (saved) state = upsertBlueprint(state, { ...saved, nextStageId: next });
    }
    editorSave = state;
    editorSelectedId = idMap.get(accepted[0].id) || editorSave.stages[0].id;
    editorSave.selectedId = editorSelectedId;
    saveEditorSave();
    editorShareText = '';
    editorMessage = `${accepted.length} peta diimpor${accepted.length < report.stages.length ? ' (sisanya tidak muat)' : ''}.`;
    editorMessageKind = 'ok';
    editorShareMessage = editorMessage;
    editorShareKind = 'ok';
    buildEditorScreen();
    return true;
  }

  function updateEditorField(field, value) {
    const stage = currentEditorStage();
    if (!stage) return;
    if (field === 'arrows') stage.arrows = Math.max(0, Math.min(MAP_EDITOR_MAX_ARROWS, Math.round(Number(value) || 0)));
    else if (field === 'flasks') stage.flasks = Math.max(1, Math.min(MAP_EDITOR_MAX_FLASKS, Math.round(Number(value) || 1)));
    else if (field === 'ash') stage.ash = Math.max(0, Math.min(MAP_EDITOR_MAX_ASH, Math.round(Number(value) || 0)));
    else if (field === 'relic' || field === 'checkpoint') stage[field] = !!value;
    else if (field === 'boss') stage.boss = ALL_BOSS_INFO[value] ? value : null;
    else if (field === 'nextStageId') {
      stage.nextStageId = editorSave.stages.some((entry) => entry.id === value && entry.id !== stage.id)
        ? value
        : null;
    } else if (field === 'layout') {
      stage.layout = layoutFor(value).id;
      stage.platforms = terrainFromLayout(stage.layout);
      editorSelectedPlatform = -1;
    } else if (field === 'difficulty') {
      stage.difficulty = MAP_EDITOR_DIFFICULTY_OPTIONS.some((entry) => entry.id === value) ? value : 'normal';
    } else if (field === 'objective') {
      stage.objective = value === 'survive' ? 'survive' : 'clear';
    } else if (field === 'surviveSeconds') {
      stage.surviveSeconds = Math.max(
        MAP_EDITOR_SURVIVE_MIN,
        Math.min(MAP_EDITOR_SURVIVE_MAX, Math.round(Number(value) || MAP_EDITOR_SURVIVE_MIN)),
      );
    } else stage[field] = value;
    stage.updatedAt = Date.now();
    editorMessage = null;
    renderEditorList();
    renderEditorBalance();
    renderEditorMessage();
  }

  function toggleEditorWeapon(id, on) {
    const stage = currentEditorStage();
    if (!stage) return;
    if (on) {
      if (!stage.weapons.includes(id) && stage.weapons.length < MAP_EDITOR_MAX_WEAPONS) stage.weapons.push(id);
    } else {
      stage.weapons = stage.weapons.filter((weapon) => weapon !== id);
      if (!stage.weapons.length) stage.weapons = ['sword'];
    }
    stage.updatedAt = Date.now();
    renderEditorList();
    renderEditorForm();
  }

  function addEditorEnemy() {
    const stage = currentEditorStage();
    if (!stage) return;
    if (stage.enemies.length >= MAP_EDITOR_MAX_ENEMIES) {
      editorMessage = `Maksimal ${MAP_EDITOR_MAX_ENEMIES} musuh per peta.`;
      editorMessageKind = 'error';
      renderEditorMessage();
      return;
    }
    const type = $('editor-enemy-select')?.value;
    if (!type || !ALL_ENEMY_INFO[type]) return;
    stage.enemies.push({ type, x: Math.min(WORLD_W - 80, 260 + stage.enemies.length * 84) });
    stage.updatedAt = Date.now();
    editorMessage = null;
    renderEditorList();
    renderEditorForm();
  }

  function removeEditorEnemy(index) {
    const stage = currentEditorStage();
    if (!stage || !Number.isInteger(index) || index < 0 || index >= stage.enemies.length) return;
    stage.enemies.splice(index, 1);
    stage.updatedAt = Date.now();
    renderEditorList();
    renderEditorForm();
  }

  function setEditorEnemyX(index, value) {
    const stage = currentEditorStage();
    if (!stage || !stage.enemies[index]) return;
    stage.enemies[index].x = Math.max(60, Math.min(WORLD_W - 60, Math.round(Number(value) || 60)));
    stage.updatedAt = Date.now();
  }

  function toggleEditorElite(index) {
    const stage = currentEditorStage();
    if (!stage || !stage.enemies[index]) return false;
    stage.enemies[index].elite = !stage.enemies[index].elite;
    stage.updatedAt = Date.now();
    saveEditorSave();
    renderEditorList();
    renderEditorForm();
    return stage.enemies[index].elite;
  }

  function autoBalanceEditor() {
    const stage = currentEditorStage();
    if (!stage) return null;
    const result = autoBalanceBlueprint(stage);
    editorSave = upsertBlueprint(editorSave, result.blueprint);
    editorSelectedId = editorSave.selectedId;
    saveEditorSave();
    editorMessage = result.steps.length
      ? `Diseimbangkan (${result.steps.join(', ')}) · tekanan ${result.rating.ratio}× — ${result.rating.label}.`
      : `Sudah di titik seimbang: tekanan ${result.rating.ratio}× — ${result.rating.label}.`;
    editorMessageKind = result.rating.band === 'brutal' ? 'error' : 'ok';
    buildEditorScreen();
    return result.rating;
  }

  function lowerEditorDifficulty() {
    const stage = currentEditorStage();
    if (!stage) return null;
    const order = MAP_EDITOR_DIFFICULTY_OPTIONS.map((entry) => entry.id);
    const index = order.indexOf(stage.difficulty);
    if (index <= 0) {
      editorMessage = 'Takaran sudah yang paling ringan (Mode Cerita).';
      editorMessageKind = 'ok';
      renderEditorMessage();
      return null;
    }
    stage.difficulty = order[index - 1];
    stage.updatedAt = Date.now();
    saveEditorSave();
    editorMessage = `Takaran diturunkan ke ${mapDifficultyScale(stage.difficulty).name} · tekanan ${threatRating(stage).ratio}×.`;
    editorMessageKind = 'ok';
    buildEditorScreen();
    return stage.difficulty;
  }

  function newEditorFromPreset(presetId) {
    if (editorSave.stages.length >= MAP_EDITOR_MAX_STAGES) {
      editorMessage = `Maksimal ${MAP_EDITOR_MAX_STAGES} peta tersimpan.`;
      editorMessageKind = 'error';
      renderEditorMessage();
      return false;
    }
    const blueprint = blueprintFromPreset(presetId, editorSave, editorSave.stages.length);
    editorSave = upsertBlueprint(editorSave, blueprint);
    editorSelectedId = editorSave.selectedId;
    editorSelectedPlatform = -1;
    saveEditorSave();
    editorMessage = `"${blueprint.name}" dibuat dari preset · ${threatRating(blueprint).label}.`;
    editorMessageKind = 'ok';
    buildEditorScreen();
    return true;
  }

  function newEditorStage() {
    if (editorSave.stages.length >= MAP_EDITOR_MAX_STAGES) {
      editorMessage = `Maksimal ${MAP_EDITOR_MAX_STAGES} peta tersimpan.`;
      editorMessageKind = 'error';
      renderEditorMessage();
      return;
    }
    const blueprint = blueprintFromPreset('preset_hall', editorSave, editorSave.stages.length);
    blueprint.name = `Peta ${editorSave.stages.length + 1}`;
    editorSave = upsertBlueprint(editorSave, blueprint);
    editorSelectedId = editorSave.selectedId;
    editorSelectedPlatform = -1;
    saveEditorSave();
    editorMessage = 'Peta baru dibuat. Ubah isinya lalu tekan SIMPAN.';
    editorMessageKind = 'ok';
    buildEditorScreen();
  }

  function duplicateEditorStage() {
    const stage = currentEditorStage();
    if (!stage) return;
    if (editorSave.stages.length >= MAP_EDITOR_MAX_STAGES) {
      editorMessage = `Maksimal ${MAP_EDITOR_MAX_STAGES} peta tersimpan.`;
      editorMessageKind = 'error';
      renderEditorMessage();
      return;
    }
    const copy = sanitizeBlueprint(
      {
        ...stage,
        id: newBlueprintId(editorSave),
        name: `${stage.name} II`.slice(0, MAP_EDITOR_NAME_MAX),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      editorSave.stages.length,
    );
    editorSave = upsertBlueprint(editorSave, copy);
    editorSelectedId = editorSave.selectedId;
    editorSelectedPlatform = -1;
    saveEditorSave();
    editorMessage = 'Peta diduplikasi.';
    editorMessageKind = 'ok';
    buildEditorScreen();
  }

  function deleteEditorStage() {
    const stage = currentEditorStage();
    if (!stage) return;
    if (editorSave.stages.length <= 1) {
      editorMessage = 'Minimal satu peta harus tersisa.';
      editorMessageKind = 'error';
      renderEditorMessage();
      return;
    }
    const name = stage.name;
    editorSave = removeBlueprint(editorSave, stage.id);
    editorSelectedId = editorSave.selectedId;
    editorSelectedPlatform = -1;
    saveEditorSave();
    editorMessage = `"${name}" dihapus.`;
    editorMessageKind = 'ok';
    buildEditorScreen();
  }

  function saveEditorStage() {
    const stage = currentEditorStage();
    if (!stage) return false;
    const report = validateBlueprint(stage, editorSave);
    editorSave = upsertBlueprint(editorSave, stage);
    editorSelectedId = editorSave.selectedId;
    saveEditorSave();
    if (!report.ok) {
      editorMessage = `Tersimpan, tetapi belum bisa dimainkan: ${report.errors.join(' ')}`;
      editorMessageKind = 'error';
    } else if (report.warnings.length) {
      editorMessage = `Tersimpan. Catatan: ${report.warnings.join(' ')}`;
      editorMessageKind = 'ok';
    } else {
      editorMessage = `"${stage.name}" tersimpan dan siap dimainkan · tekanan ${report.rating.ratio}× (${report.rating.label}).`;
      editorMessageKind = 'ok';
    }
    buildEditorScreen();
    return report.ok;
  }

  function startCustomStage(id = editorSelectedId) {
    const stage = editorSave.stages.find((entry) => entry.id === id) || currentEditorStage();
    if (!stage) return false;
    const report = validateBlueprint(stage, editorSave);
    if (!report.ok) {
      editorMessage = report.errors.join(' ');
      editorMessageKind = 'error';
      if (getMenuView() === 'editor') buildEditorScreen();
      return false;
    }
    const blueprint = sanitizeBlueprint(stage, 0);
    const broken = chainFor(editorSave, blueprint.id)
      .filter((entry) => !validateBlueprint(entry, editorSave).ok)
      .map((entry) => entry.name);
    if (broken.length) {
      editorMessage = `Ruang lanjutan belum valid: ${broken.join(', ')}.`;
      editorMessageKind = 'error';
      if (getMenuView() === 'editor') buildEditorScreen();
      return false;
    }
    editorSelectedId = blueprint.id;
    editorSave = recordEditorPlay(editorSave, blueprint.id);
    editorSave.selectedId = blueprint.id;
    saveEditorSave();
    customStage = blueprint;
    const run = () => beginCustomStage(blueprint);
    if (blueprint.intro === 'prologue') {
      startPrologue(run);
      return true;
    }
    if (blueprint.intro === 'trailer') {
      setCustomIntroCallback(run);
      openTrailer();
      return true;
    }
    if (blueprint.intro === 'spiral') {
      startCutscene(SPIRAL_INTRO_CUTSCENE, run);
      return true;
    }
    run();
    return true;
  }

  function beginCustomStage(bp) {
    unlockAudio();
    resetArenaStateForCustomRun();
    setActiveRunKind('custom');
    customChain = chainFor(editorSave, bp.id);
    if (!customChain.length) customChain = [bp];
    customChainIndex = 0;
    customStageCleared = false;
    customStageEngaged = false;
    customStageElapsed = 0;
    customClearOpen = false;
    const room = loadCustomRoom(customChain[0], { fresh: true });
    setStarted(true);
    setPaused(false);
    clearShellOverlays();
    setMenuView('none');
    clearHeldKeys();
    beginCustomStageRecord(bp, room);
    showBanner(bp.name, bp.subtitle);
    showToast(
      customChain.length > 1 ? `PETA SUMPAH · ${bp.name} · 1/${customChain.length} RUANG` : `PETA SUMPAH · ${bp.name}`,
      2200,
    );
    syncScreens();
    updateHud();
  }

  function loadCustomRoom(bp, options = {}) {
    const fresh = options.fresh === true;
    const room = customRoomFromBlueprint(bp);
    customStage = bp;
    customStageEngaged = false;
    if (fresh) {
      game.reset();
      applyCustomPlayerLoadout(bp);
    }
    game.labyrinth = false;
    game.loadArena(room);
    delete game.bossDefeated[room.index];
    const p = game.player;
    if (fresh) {
      p.weapons = [...bp.weapons];
      p.weapon = bp.weapons[0];
      p.arrows = bp.arrows;
      p.maxFlasks = bp.flasks;
      p.flasks = bp.flasks;
      p.relic = false;
      game.ash = bp.ash;
    } else {
      p.invuln = Math.max(p.invuln, 1);
    }
    applyCustomHunterItems();
    if (bp.checkpoint) {
      game.checkpoint = { ...room.checkpoint, active: true };
      game.checkpointRoom = room.index;
    }
    for (const def of room.enemies) game.spawnEnemy(def);
    if (bp.boss) game.spawnBoss(bp.boss, customBossOverrides(bp));
    customSurviveLeft = bp.objective === 'survive' ? bp.surviveSeconds : 0;
    game.events.length = 0;
    return room;
  }

  function advanceCustomStage() {
    if (!customChain.length) return false;
    customChainIndex += 1;
    const next = customChain[customChainIndex];
    if (!next) {
      finishCustomStage();
      return false;
    }
    loadCustomRoom(next, { fresh: false });
    customClearOpen = false;
    const label = `RUANG ${customChainIndex + 1}/${customChain.length}`;
    showBanner(label, next.name);
    showToast(`${next.name} · ${label}`, 2000);
    return true;
  }

  function tick(dt) {
    if (customClearOpen || !customStage) return;
    customStageElapsed += dt;
    if (!customStageEngaged) {
      if (game.boss || game.enemies.length) customStageEngaged = true;
      else if (customStageElapsed > 0.6) customStageEngaged = true;
      return;
    }
    if (game.state !== 'playing') return;
    if (customStage.objective === 'survive') {
      customSurviveLeft = Math.max(0, customSurviveLeft - dt);
      if (customSurviveLeft > 0) return;
      if (customChainIndex < customChain.length - 1) advanceCustomStage();
      else finishCustomStage();
      return;
    }
    if (game.boss) return;
    if (game.enemies.some((enemy) => !enemy.dead && enemy.hp > 0)) return;
    if (customChainIndex < customChain.length - 1) {
      advanceCustomStage();
      return;
    }
    finishCustomStage();
  }

  function finishCustomStage() {
    if (customStageCleared || !customStage) return false;
    customStageCleared = true;
    customClearOpen = true;
    const seconds = Math.round(customStageElapsed * 10) / 10;
    const root = customChain[0] || customStage;
    const rooms = customChain.length || 1;
    editorSave = recordEditorClear(editorSave, root.id, seconds);
    saveEditorSave();
    const title = $('custom-clear-title');
    if (title) title.textContent = root.name;
    const sub = $('custom-clear-sub');
    if (sub) {
      const mode = root.objective === 'survive' ? ` · BERTAHAN ${root.surviveSeconds} DTK` : '';
      sub.textContent = `${root.subtitle} · ${layoutFor(root.layout).label}${rooms > 1 ? ` · ${rooms} ruang` : ''}${mode}`;
    }
    const body = $('custom-clear-body');
    if (body) {
      const record = editorSave.clears[root.id];
      const rating = threatRating(root);
      body.innerHTML = `
        <div class="stat"><strong>${formatTime(seconds)}</strong><span>Waktu</span></div>
        <div class="stat"><strong>${game.kills || 0}</strong><span>Musuh Gugur</span></div>
        <div class="stat"><strong>${rooms}</strong><span>Ruang</span></div>
        <div class="stat"><strong>${esc(mapDifficultyScale(root.difficulty).name)}</strong><span>Takaran</span></div>
        <div class="stat"><strong>${esc(rating.label)}</strong><span>Tekanan ${rating.ratio}×</span></div>
        <div class="stat"><strong>${record?.best ? formatTime(record.best) : '—'}</strong><span>Rekor Peta</span></div>
        <div class="stat"><strong>${record?.count || 0}×</strong><span>Tuntas</span></div>`;
    }
    audio.play({ type: 'bossDown' });
    syncScreens();
    return true;
  }

  function resetActiveRun() {
    customClearOpen = false;
    customStage = null;
    customChain = [];
    customChainIndex = 0;
  }

  function retryCustomStage() {
    customClearOpen = false;
    return startCustomStage(customChain[0]?.id || customStage?.id);
  }

  function hudBadge() {
    if (!customStage) return null;
    return {
      text: customStage.objective === 'survive'
        ? `⏳ ${Math.max(0, Math.ceil(customSurviveLeft))} DTK · BERTAHAN`
        : `🎯 ${mapDifficultyScale(customStage.difficulty).name.toUpperCase()} · ${threatRating(customStage).ratio}×`,
      urgent: customStage.objective === 'survive' && customSurviveLeft <= 10,
    };
  }

  function desiredTrack() {
    if (!customStage) return 'ashen';
    if (game.boss && game.state === 'playing') return bossTrackFor(game.boss.kind, customStage.bossMusic || 'boss');
    return customStage.music || 'ashen';
  }

  function bindDom() {
    if (domBound) return;
    domBound = true;
    $('editor-new')?.addEventListener('click', () => newEditorStage());
    $('editor-duplicate')?.addEventListener('click', () => duplicateEditorStage());
    $('editor-delete')?.addEventListener('click', () => deleteEditorStage());
    $('editor-save')?.addEventListener('click', () => saveEditorStage());
    $('editor-play')?.addEventListener('click', () => startCustomStage());
    $('custom-clear-again')?.addEventListener('click', () => {
      const id = customStage?.id;
      customClearOpen = false;
      startCustomStage(id);
    });
    $('custom-clear-editor')?.addEventListener('click', () => {
      customClearOpen = false;
      open();
    });
    $('custom-clear-menu')?.addEventListener('click', () => {
      customClearOpen = false;
      customStage = null;
      showMenu();
    });
    $('editor-presets')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-editor-preset]');
      if (button) newEditorFromPreset(button.dataset.editorPreset);
    });
    $('editor-list')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-editor-select]');
      if (!button) return;
      editorSelectedId = button.dataset.editorSelect;
      editorSave.selectedId = editorSelectedId;
      editorSelectedPlatform = -1;
      saveEditorSave();
      editorMessage = null;
      buildEditorScreen();
    });
    $('editor-form')?.addEventListener('click', (event) => {
      if (event.target.closest('[data-editor-add-enemy]')) {
        addEditorEnemy();
        return;
      }
      const elite = event.target.closest('[data-editor-elite]');
      if (elite) {
        toggleEditorElite(Number(elite.dataset.editorElite));
        return;
      }
      const balance = event.target.closest('[data-editor-balance]');
      if (balance) {
        if (balance.dataset.editorBalance === 'auto') autoBalanceEditor();
        else lowerEditorDifficulty();
        return;
      }
      const remove = event.target.closest('[data-editor-remove-enemy]');
      if (remove) {
        removeEditorEnemy(Number(remove.dataset.editorRemoveEnemy));
        return;
      }
      const terrain = event.target.closest('[data-editor-terrain]');
      if (terrain) {
        const action = terrain.dataset.editorTerrain;
        if (action === 'floor' || action === 'ledge') addEditorPlatform(action);
        else if (action === 'delete') deleteEditorPlatform();
        else if (action === 'reset') resetEditorTerrain();
        return;
      }
      const share = event.target.closest('[data-editor-share]');
      if (share) {
        if (share.dataset.editorShare === 'copy') copyEditorShare();
        else importEditorShare();
      }
    });
    $('editor-form')?.addEventListener('pointerdown', (event) => {
      if (event.target?.id === 'editor-canvas') editorPointerDown(event);
    });
    window.addEventListener('pointermove', (event) => {
      if (editorDrag) editorPointerMove(event);
    });
    window.addEventListener('pointerup', () => {
      if (editorDrag) editorPointerUp();
    });
    $('editor-form')?.addEventListener('change', (event) => {
      const target = event.target;
      if (target.dataset?.editorField) {
        updateEditorField(target.dataset.editorField, target.type === 'checkbox' ? target.checked : target.value);
        if (target.tagName === 'SELECT') renderEditorForm();
        return;
      }
      if (target.dataset?.editorWeapon) {
        toggleEditorWeapon(target.dataset.editorWeapon, target.checked);
        return;
      }
      if (target.dataset?.editorEnemyX != null) {
        setEditorEnemyX(Number(target.dataset.editorEnemyX), target.value);
      }
    });
    $('editor-form')?.addEventListener('input', (event) => {
      const target = event.target;
      if (target.id === 'editor-share-input') {
        editorShareText = target.value;
        return;
      }
      if (target.dataset?.editorField && target.tagName !== 'SELECT' && target.type !== 'checkbox') {
        updateEditorField(target.dataset.editorField, target.value);
      } else if (target.dataset?.editorEnemyX != null) {
        setEditorEnemyX(Number(target.dataset.editorEnemyX), target.value);
      }
    });
  }

  function snapshot() {
    return {
      loaded: true,
      save: editorSave,
      selectedId: editorSelectedId,
      summary: editorSummary(editorSave),
      stage: currentEditorStage(),
      message: editorMessage,
      activeStage: customStage,
      chain: customChain.map((stage) => stage.id),
      chainIndex: customChainIndex,
      activeRunKind: getActiveRunKind(),
      clearOpen: customClearOpen,
      cleared: customStageCleared,
      engaged: customStageEngaged,
      elapsed: customStageElapsed,
      selectedPlatform: editorSelectedPlatform,
      shareMessage: editorShareMessage,
      shareText: editorShareText,
      gameState: game.state,
      rating: currentEditorStage() ? threatRating(currentEditorStage()) : null,
      difficulty: customStage?.difficulty || null,
      objective: customStage?.objective || null,
      surviveLeft: customSurviveLeft,
    };
  }

  return {
    bindDom,
    open,
    buildEditorScreen,
    saveEditorStage,
    newEditorStage,
    duplicateEditorStage,
    deleteEditorStage,
    startCustomStage,
    finishCustomStage,
    addEditorPlatform,
    deleteEditorPlatform,
    resetEditorTerrain,
    paintEditorCanvas,
    copyEditorShare,
    importEditorShare,
    autoBalanceEditor,
    lowerEditorDifficulty,
    toggleEditorElite,
    newEditorFromPreset,
    tick,
    hudBadge,
    desiredTrack,
    resetActiveRun,
    retryCustomStage,
    isClearOpen: () => customClearOpen,
    snapshot,
    editorRating: (stage) => threatRating(stage || currentEditorStage()),
    editorChain: (id) => chainFor(editorSave, id || editorSelectedId).map((stage) => stage.id),
    editorShareCode: (id) => encodeShareCode(chainFor(editorSave, id || editorSelectedId)),
    importEditorCode: (code) => {
      editorShareText = String(code ?? '');
      return importEditorShare();
    },
    decodeEditorCode: (code) => decodeShareCode(code),
    validateEditorBlueprint: (stage) => validateBlueprint(stage || currentEditorStage(), editorSave),
    editorBlueprintRoom: (stage) => customRoomFromBlueprint(stage || currentEditorStage()),
  };
}
