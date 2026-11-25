// Wave Defense — The Last Rampart — screen module split out of main.js (Phase 1, v0.37.0).
// Loaded on demand by main.js's mode loader. `A` is the shell context: every
// shared binding of main.js is reached through it, so this file owns no globals.
import {
  formatPuzzleTime,
} from '../puzzle.js';
import {
  WAVE_DEFENSE_BOSSES,
  WAVE_DEFENSE_DIFFICULTIES,
  WAVE_DEFENSE_ENEMY_TYPES,
  WAVE_DEFENSE_MAPS,
  WAVE_DEFENSE_MAP_BY_ID,
  WAVE_DEFENSE_TOTAL_WAVES,
  WAVE_DEFENSE_TOWERS,
  WAVE_DEFENSE_TOWER_BY_ID,
  createWaveDefense,
  recordWaveDefense,
  renderWaveDefense,
  sanitizeWaveDefenseProgress,
  updateWaveDefense,
  waveDefenseBuild,
  waveDefenseSelect,
  waveDefenseSelectTower,
  waveDefenseSellValue,
  waveDefenseSnapshot,
  waveDefenseSummary,
  waveDefenseUpgradeCost,
} from '../wavedefense.js';
import * as __lib0 from '../wavedefense.js';

export function install(A) {
// ── Wave Defense: hub, castle battlefield and result handling ──────
function waveDefenseState() {
  return A.progressBlock('wavedefense', sanitizeWaveDefenseProgress);
}

function showWaveDefense() {
  A.cancelPrologue();
  A.started = false;
  A.paused = false;
  A.shopOpen = false;
  A.mapOpen = false;
  A.codexOpen = false;
  A.inventoryOpen = false;
  A.settingsOpen = false;
  A.closeDialogue(true);
  A.spectating = false;
  A.spectateGame = null;
  A.wdActive = false;
  A.wdPaused = false;
  A.wdMatch = null;
  A.wdResult = null;
  A.wdRecorded = false;
  A.wdRenderDirty = true;
  A.menuView = 'wavedefense';
  A.clearHeldKeys();
  buildWaveDefenseScreen();
  A.syncScreens();
}

function buildWaveDefenseScreen() {
  const state = waveDefenseState();
  const summary = waveDefenseSummary(state);
  const summaryEl = A.$('wd-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="wd-stat"><span>PERTAHANAN</span><strong>${summary.runs}</strong><em>${summary.wins} menang · ${summary.losses} kalah</em></div>
      <div class="wd-stat"><span>WIN RATE</span><strong>${summary.winRate}%</strong><em>${summary.mapsPlayed}/${summary.mapsTotal} benteng</em></div>
      <div class="wd-stat"><span>GELOMBANG</span><strong>${summary.bestWave}/${WAVE_DEFENSE_TOTAL_WAVES}</strong><em>rekor tertinggi</em></div>
      <div class="wd-stat"><span>SKOR</span><strong>${summary.bestScore}</strong><em>rekor benteng</em></div>
      <div class="wd-stat"><span>TOTAL KILL</span><strong>${summary.totalKills}</strong><em>${summary.totalLeaks} bocor</em></div>
      <div class="wd-stat"><span>MENARA</span><strong>${summary.towers}</strong><em>${summary.enemies} musuh · ${summary.bosses} bos</em></div>`;
  }
  if (!WAVE_DEFENSE_MAP_BY_ID[A.wdMapId]) A.wdMapId = WAVE_DEFENSE_MAPS[0].id;
  if (!WAVE_DEFENSE_DIFFICULTIES.some((entry) => entry.id === A.wdDifficulty)) A.wdDifficulty = 'knight';
  if (!WAVE_DEFENSE_TOWER_BY_ID[A.wdSelectedTowerId]) A.wdSelectedTowerId = WAVE_DEFENSE_TOWERS[0].id;
  const maps = A.$('wd-maps');
  if (maps) {
    maps.innerHTML = WAVE_DEFENSE_MAPS.map((map) => {
      const record = state.maps?.[map.id] || {};
      return `<button class="wd-map-card${map.id === A.wdMapId ? ' active' : ''}" type="button" data-wd-map="${map.id}">
        <strong>${A.esc(map.name)}</strong><em>${A.esc(map.subtitle)}</em><span>${A.esc(map.lore)}</span>
        <b>${map.slots.length} POS · REKOR GEL ${record.bestWave || 0} · SKOR ${record.bestScore || 0}</b>
      </button>`;
    }).join('');
  }
  const diffs = A.$('wd-difficulties');
  if (diffs) diffs.innerHTML = WAVE_DEFENSE_DIFFICULTIES.map((entry) => `<button class="${entry.id === A.wdDifficulty ? 'active' : ''}" type="button" data-wd-difficulty="${entry.id}" title="${A.esc(entry.desc)}">${entry.name} · ${entry.castle} HP</button>`).join('');
  const modes = A.$('wd-modes');
  if (modes) {
    const best = summary.endlessBest || {};
    modes.innerHTML = `
      <button class="${A.wdEndless ? '' : 'active'}" type="button" data-wd-mode="classic">KAMPANYE · 24 GELOMBANG<em>Rekor gel ${summary.bestWave}/${WAVE_DEFENSE_TOTAL_WAVES} · skor ${summary.bestScore}</em></button>
      <button class="${A.wdEndless ? 'active' : ''}" type="button" data-wd-mode="endless">TANPA AKHIR<em>Rekor gel ${best.bestWave || 0} · ${best.bestKills || 0} kill · skor ${best.bestScore || 0}</em></button>`;
  }
  const towers = A.$('wd-towers');
  if (towers) {
    towers.innerHTML = WAVE_DEFENSE_TOWERS.map((tower) => `<button class="wd-tower-card${tower.id === A.wdSelectedTowerId ? ' active' : ''}" type="button" data-wd-tower="${tower.id}" style="--tower-color:${tower.color}">
      <span class="wt-top"><span class="wt-glyph">${tower.glyph}</span><strong>${A.esc(tower.name)}</strong></span>
      <em>${tower.cost} EMAS</em>
      <span>${A.esc(tower.desc)}</span>
      <span class="wt-stats">DMG ${tower.damage} · RANGE ${tower.range} · ${tower.rate.toFixed(2)}/s${tower.splash ? ` · AREA ${tower.splash}` : ''}</span>
    </button>`).join('');
  }
  const count = A.$('wd-tower-count');
  if (count) count.textContent = `${WAVE_DEFENSE_TOWERS.length} JENIS · ${WAVE_DEFENSE_ENEMY_TYPES.length} MUSUH · ${WAVE_DEFENSE_BOSSES.length} BOS`;
  const button = A.$('btn-wd-start');
  if (button) button.innerHTML = `<span>${A.wdEndless ? 'MULAI TANPA AKHIR' : 'MULAI PERTAHANAN'}</span><em>${A.esc(WAVE_DEFENSE_MAP_BY_ID[A.wdMapId]?.name || 'ASHEN KEEP')} · ${WAVE_DEFENSE_TOWER_BY_ID[A.wdSelectedTowerId]?.name || 'BALLISTA'} · ${WAVE_DEFENSE_DIFFICULTIES.find((entry) => entry.id === A.wdDifficulty)?.name || 'KNIGHT'}${A.wdEndless ? ' · ∞' : ''}</em>`;
}

function buildWaveDefensePalette() {
  const palette = A.$('wd-palette');
  if (!palette) return;
  palette.innerHTML = WAVE_DEFENSE_TOWERS.map((tower) => `<button type="button" data-wd-tower="${tower.id}" style="--tower-color:${tower.color}">
    <span class="wp-glyph">${tower.glyph}</span><span class="wp-name">${A.esc(tower.name)}</span><span class="wp-cost">${tower.cost}</span>
  </button>`).join('');
  A.wdSelectionKey = '';
  A.wdFeedKey = '';
}

function startWaveDefenseBattle() {
  if (!WAVE_DEFENSE_MAP_BY_ID[A.wdMapId]) A.wdMapId = WAVE_DEFENSE_MAPS[0].id;
  if (!WAVE_DEFENSE_TOWER_BY_ID[A.wdSelectedTowerId]) A.wdSelectedTowerId = WAVE_DEFENSE_TOWERS[0].id;
  A.wdMatch = createWaveDefense({
    mapId: A.wdMapId,
    difficulty: A.wdDifficulty,
    endless: A.wdEndless,
    seed: (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0,
  });
  waveDefenseSelectTower(A.wdMatch, A.wdSelectedTowerId);
  A.wdActive = true;
  A.wdPaused = false;
  A.wdResult = null;
  A.wdRecorded = false;
  A.wdUiTimer = 0;
  A.wdRenderDirty = true;
  A.started = false;
  A.paused = false;
  A.shopOpen = false;
  A.mapOpen = false;
  A.codexOpen = false;
  A.inventoryOpen = false;
  A.settingsOpen = false;
  A.menuView = 'wavedefenseBattle';
  A.accumulator = 0;
  A.lastTime = performance.now();
  A.$('wd-result')?.classList.add('hidden');
  A.$('wd-pause')?.classList.add('hidden');
  buildWaveDefensePalette();
  updateWaveDefenseHud(true);
  A.syncScreens();
  const canvas = A.$('wd-canvas');
  const ctx = canvas?.getContext('2d');
  if (canvas && ctx) renderWaveDefense(ctx, A.wdMatch, { width: canvas.width, height: canvas.height, time: performance.now() / 1000 });
}

function toggleWaveDefensePause(next = !A.wdPaused) {
  if (!A.wdActive || !A.wdMatch) return;
  A.wdPaused = !!next;
  A.lastTime = performance.now();
  A.wdRenderDirty = true;
  A.syncScreens();
  updateWaveDefenseHud(true);
}

function leaveWaveDefense() {
  A.wdActive = false;
  A.wdPaused = false;
  A.wdMatch = null;
  A.wdResult = null;
  A.wdRecorded = false;
  A.wdRenderDirty = true;
  showWaveDefense();
}

function completeWaveDefense() {
  if (!A.wdMatch || A.wdMatch.phase !== 'ended' || A.wdRecorded) return;
  A.wdRecorded = true;
  const saved = recordWaveDefense(waveDefenseState(), A.wdMatch);
  A.progress.wavedefense = saved.progress;
  A.saveProgress();
  A.wdResult = {
    ...saved,
    mapName: A.wdMatch.map.name,
    difficultyName: WAVE_DEFENSE_DIFFICULTIES.find((entry) => entry.id === A.wdMatch.difficulty)?.name || 'KNIGHT',
    snapshot: waveDefenseSnapshot(A.wdMatch),
  };
  renderWaveDefenseResult();
  updateWaveDefenseHud(true);
}

function renderWaveDefenseResult() {
  const overlay = A.$('wd-result');
  if (!overlay || !A.wdResult) return;
  const r = A.wdResult;
  const endless = !!r.endless || !!r.snapshot?.endless;
  const win = r.win || r.snapshot?.result === 'victory';
  const title = endless ? 'PASANG TANPA AKHIR' : win ? 'MAHKOTA BERTAHAN' : 'GERBANG TERBELAH';
  const body = endless
    ? `Benteng jatuh pada gelombang ${r.snapshot?.wave || 0}. Rekor ${r.isRecord ? 'diperbarui' : 'tetap berdiri'}.`
    : win ? 'Dua puluh empat gelombang hancur. Benteng terakhir masih berdiri.' : `Benteng jatuh pada gelombang ${r.snapshot?.wave || 0}. Bangun lebih awal dan tutup jalur dengan area damage.`;
  overlay.innerHTML = `<div class="wd-modal wd-result-card ${endless || win ? 'victory' : 'defeat'}">
    <p class="eyebrow">WAVE DEFENSE · ${A.esc(endless ? 'TANPA AKHIR' : r.mapName)} · ${formatPuzzleTime(r.snapshot?.time || 0)}</p>
    <h3 class="wd-result-title">${title}</h3>
    <p>${body}</p>
    <div class="wd-result-stats">
      <div><span>GELOMBANG</span><b>${r.snapshot?.wave || 0}${endless ? '' : `/${WAVE_DEFENSE_TOTAL_WAVES}`}</b></div>
      <div><span>KILL</span><b>${r.snapshot?.stats?.kills || 0}</b></div>
      <div><span>BOCOR</span><b>${r.snapshot?.stats?.leaks || 0}</b></div>
      <div><span>SKOR</span><b>${r.snapshot?.score || 0}</b></div>
    </div>
    <div class="wd-result-actions">
      <button class="btn btn-primary" type="button" data-wd-action="rematch">COBA LAGI</button>
      <button class="btn btn-ghost" type="button" data-wd-action="leave">KEMBALI KE HUB</button>
    </div>
  </div>`;
  overlay.classList.remove('hidden');
}

function waveDefenseSelectionKey() {
  if (!A.wdMatch) return '';
  const tower = A.wdMatch.selectedSlot >= 0 ? A.wdMatch.towers.find((entry) => entry.slot === A.wdMatch.selectedSlot) : null;
  return tower ? `${tower.id}:${tower.level}:${A.wdMatch.gold >= waveDefenseUpgradeCost(tower)}` : `slot:${A.wdMatch.selectedSlot}:${A.wdMatch.gold}`;
}

function updateWaveDefenseHud(force = false) {
  if (!A.wdMatch) return;
  if (A.wdMatch.phase === 'ended' && !A.wdRecorded) completeWaveDefense();
  if (!force && A.wdUiTimer < 1 / 8) return;
  A.wdUiTimer = 0;
  const m = A.wdMatch;
  const setText = (id, value) => { const node = A.$(id); if (node) node.textContent = value; };
  const hpRatio = Math.max(0, m.castle.hp / m.castle.maxHp);
  setText('wd-castle-text', `${Math.ceil(m.castle.hp)} / ${m.castle.maxHp}`);
  const fill = A.$('wd-castle-fill');
  if (fill) fill.style.width = `${hpRatio * 100}%`;
  const bar = A.$('wd-castle-bar');
  if (bar) bar.classList.toggle('low', hpRatio <= 0.3);
  setText('wd-map-name', m.endless ? `${m.map.name} · TANPA AKHIR` : m.map.name);
  setText('wd-wave', m.phase === 'prep' ? 'SIAP' : `GELOMBANG ${m.wave}`);
  setText('wd-phase', m.phase === 'prep'
    ? `GELOMBANG ${m.wave + 1}${m.endless ? ' · TANPA AKHIR' : ` / ${m.totalWaves}`} DALAM ${Math.max(0, m.prepTimer).toFixed(1)}`
    : m.phase === 'wave' ? `${m.enemies.length} MUSUH · ${m.stats.kills} KILL` : 'PERTAHANAN SELESAI');
  setText('wd-gold', m.gold);
  setText('wd-score', m.score);
  setText('wd-kills', m.stats.kills);

  const next = A.$('btn-wd-next');
  if (next) {
    next.disabled = m.phase !== 'prep';
    next.textContent = m.phase === 'prep' ? `KIRIM GELOMBANG ${Math.min(m.totalWaves, m.wave + 1)}` : m.phase === 'wave' ? `GELOMBANG ${m.wave} BERJALAN` : 'PERTAHANAN SELESAI';
  }
  document.querySelectorAll('#wd-speed [data-wd-speed]').forEach((button) => button.classList.toggle('active', Number(button.dataset.wdSpeed) === m.speed));
  document.querySelectorAll('#wd-palette [data-wd-tower]').forEach((button) => {
    const def = WAVE_DEFENSE_TOWER_BY_ID[button.dataset.wdTower];
    button.classList.toggle('active', button.dataset.wdTower === m.buildTowerId);
    button.classList.toggle('disabled', !def || m.gold < def.cost);
  });

  const boss = m.enemies.find((enemy) => enemy.boss);
  const bossPanel = A.$('wd-boss-panel');
  if (bossPanel) {
    bossPanel.classList.toggle('hidden', !boss);
    if (boss) {
      setText('wd-boss-name', `${boss.name} · ${Math.ceil(boss.hp)} / ${boss.maxHp}`);
      const bossFill = A.$('wd-boss-fill');
      if (bossFill) bossFill.style.width = `${Math.max(0, boss.hp / boss.maxHp) * 100}%`;
    }
  }

  const selection = A.$('wd-selection');
  const key = waveDefenseSelectionKey();
  if (selection && key !== A.wdSelectionKey) {
    A.wdSelectionKey = key;
    const tower = m.selectedSlot >= 0 ? m.towers.find((entry) => entry.slot === m.selectedSlot) : null;
    if (tower) {
      const def = WAVE_DEFENSE_TOWER_BY_ID[tower.towerId];
      const cost = waveDefenseUpgradeCost(tower);
      const maxed = tower.level >= 3;
      selection.innerHTML = `<div class="ws-line"><strong>${A.esc(def.name)} · POS ${tower.slot + 1}</strong><span>LEVEL ${tower.level}/3</span><em>${def.cost} emas</em></div>
        <p>${A.esc(def.desc)}</p>
        <div class="wd-selection-actions">
          <button type="button" data-wd-action="upgrade" ${maxed || m.gold < cost ? 'disabled' : ''}>${maxed ? 'LEVEL MAKSIMUM' : `TINGKATKAN · ${cost} EMAS`}</button>
          <button type="button" data-wd-action="sell">JUAL +${waveDefenseSellValue(tower)}</button>
        </div>`;
    } else {
      const def = WAVE_DEFENSE_TOWER_BY_ID[m.buildTowerId];
      selection.innerHTML = `<div class="ws-line"><strong>POS ${m.selectedSlot >= 0 ? m.selectedSlot + 1 : '—'}</strong><span>${def?.name || 'PILIH MENARA'}</span><em>${def?.cost || 0} emas</em></div>
        <p>Klik pos kosong untuk membangun. Pilih menara di panel kiri, lalu klik pos di sepanjang jalan.</p>
        <div class="wd-selection-actions"><button type="button" data-wd-action="hint" disabled>MENUNGGU POS</button></div>`;
    }
  }

  const feedKey = m.texts.map((entry) => entry.text).join('|');
  if (feedKey !== A.wdFeedKey) {
    A.wdFeedKey = feedKey;
    const feed = A.$('wd-feed');
    if (feed) feed.innerHTML = m.texts.slice(-5).reverse().map((entry) => `<span style="color:${entry.color}">${A.esc(entry.text)}</span>`).join('');
  }
  const pause = A.$('wd-pause');
  if (pause) pause.classList.toggle('hidden', !A.wdPaused);
}

function waveDefensePointerWorld(event) {
  const canvas = A.$('wd-canvas');
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / Math.max(1, rect.width)) * canvas.width,
    y: ((event.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height,
  };
}

function waveDefenseSlotAt(x, y) {
  if (!A.wdMatch) return -1;
  let best = -1;
  let bestDist = 27;
  for (const slot of A.wdMatch.slots) {
    const dist = Math.hypot(slot.x - x, slot.y - y);
    if (dist < bestDist) { bestDist = dist; best = slot.index; }
  }
  return best;
}

function handleWaveDefenseSlot(index) {
  if (!A.wdMatch || A.wdMatch.phase === 'ended' || index < 0) return;
  const slot = A.wdMatch.slots[index];
  if (!slot) return;
  if (slot.towerId === null) {
    const def = WAVE_DEFENSE_TOWER_BY_ID[A.wdMatch.buildTowerId];
    if (def && A.wdMatch.gold >= def.cost) waveDefenseBuild(A.wdMatch, index, A.wdMatch.buildTowerId);
    else waveDefenseSelect(A.wdMatch, index);
  } else {
    waveDefenseSelect(A.wdMatch, index);
  }
  A.wdRenderDirty = true;
  updateWaveDefenseHud(true);
}

function waveDefenseFrame(raw, now) {
  if (A.wdMatch && !A.wdPaused && A.wdMatch.phase !== 'ended') {
    updateWaveDefense(A.wdMatch, Math.min(raw, 0.05));
  }
  if (A.wdMatch && (!A.wdPaused || A.wdRenderDirty)) {
    const canvas = A.$('wd-canvas');
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) renderWaveDefense(ctx, A.wdMatch, { width: canvas.width, height: canvas.height, time: now / 1000 });
  }
  A.wdRenderDirty = false;
  if (A.wdMatch?.phase === 'ended') completeWaveDefense();
  A.wdUiTimer += raw;
  updateWaveDefenseHud();
}

  return { waveDefenseState, showWaveDefense, buildWaveDefenseScreen, buildWaveDefensePalette, startWaveDefenseBattle, toggleWaveDefensePause, leaveWaveDefense, completeWaveDefense, renderWaveDefenseResult, waveDefenseSelectionKey, updateWaveDefenseHud, waveDefensePointerWorld, waveDefenseSlotAt, handleWaveDefenseSlot, waveDefenseFrame, lib: __lib0 };
}
