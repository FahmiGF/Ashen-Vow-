// Pirate Tide — Open Sea — screen module split out of main.js (Phase 1, v0.37.0).
// Loaded on demand by main.js's mode loader. `A` is the shell context: every
// shared binding of main.js is reached through it, so this file owns no globals.
import {
  PIRATE_BOSS_TYPES,
  PIRATE_DOCK_COST,
  PIRATE_ISLANDS,
  PIRATE_PORTS,
  PIRATE_SHIP_TYPES,
  PIRATE_STAGES,
  PIRATE_STAGE_BY_ID,
  createPirateEndless,
  createPirateVoyage,
  pirateDock,
  pirateFire,
  pirateScreenToWorld,
  pirateSnapshot,
  pirateStageUnlocked,
  pirateSummary,
  recordPirateEndless,
  recordPirateVoyage,
  renderPirateVoyage,
  sanitizePirateProgress,
  setPirateControls,
  updatePirateVoyage,
} from '../pirates.js';
import {
  formatPuzzleTime,
} from '../puzzle.js';
import * as __lib0 from '../pirates.js';

export function install(A) {
// ── Pirate Tide: open-world hub, voyage and result handling ─────────
function pirateState() {
  return A.progressBlock('pirates', sanitizePirateProgress);
}

function showPirates() {
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
  A.pirateActive = false;
  A.piratePaused = false;
  A.pirateMatch = null;
  A.pirateResult = null;
  A.pirateRecorded = false;
  A.pirateLastSnapshot = null;
  A.pirateHeld.clear();
  A.menuView = 'pirates';
  if (!pirateStageUnlocked(pirateState(), A.pirateStageId)) A.pirateStageId = PIRATE_STAGES[0].id;
  buildPirateScreen();
  A.syncScreens();
}

function buildPirateScreen() {
  const state = pirateState();
  const summary = pirateSummary(state);
  const summaryEl = A.$('pirate-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="pirate-stat"><span>PELAYARAN</span><strong>${summary.voyages}</strong><em>${summary.wins} menang · ${summary.losses} kalah</em></div>
      <div class="pirate-stat"><span>KAPTEN</span><strong>${summary.cleared}/${summary.total}</strong><em>rute selesai</em></div>
      <div class="pirate-stat"><span>AKURASI MERIAM</span><strong>${summary.accuracy}%</strong><em>${summary.totalHits}/${summary.totalShots} tembakan</em></div>
      <div class="pirate-stat"><span>KAPAL TENGGELAM</span><strong>${summary.totalKills}</strong><em>${summary.totalGold} emas dirampas</em></div>
      <div class="pirate-stat"><span>SKOR TERBAIK</span><strong>${summary.bestScore}</strong><em>laut terbuka</em></div>
      <div class="pirate-stat"><span>DUNIA</span><strong>${summary.islands}</strong><em>${summary.ports} pelabuhan · ${summary.bosses} kapten</em></div>`;
  }
  const stages = A.$('pirate-stages');
  if (stages) {
    stages.innerHTML = PIRATE_STAGES.map((stage) => {
      const unlocked = pirateStageUnlocked(state, stage.id);
      const record = state.stages?.[stage.id] || {};
      return `<button class="pirate-stage-card${stage.id === A.pirateStageId ? ' active' : ''}${unlocked ? '' : ' locked'}" type="button" data-pirate-stage="${stage.id}" ${unlocked ? '' : 'disabled'}>
        <span class="ps-index">${String(stage.index + 1).padStart(2, '0')}</span>
        <strong>${A.esc(stage.name)}</strong>
        <em>${A.esc(stage.subtitle)}</em>
        <span>${A.esc(stage.desc)}</span>
        <b>${unlocked ? `${record.cleared ? 'SELESAI' : `${stage.targetKills} KAPAL + KAPTEN`}${record.bestTime ? ` · ${formatPuzzleTime(record.bestTime)}` : ''}` : 'TERKUNCI · SELESAIKAN RUTE SEBELUMNYA'}</b>
      </button>`;
    }).join('');
  }
  const world = A.$('pirate-world');
  if (world) {
    world.innerHTML = PIRATE_ISLANDS.map((island) => `<div class="pirate-island${island.port ? ' port' : ''}">
      <strong>${A.esc(island.name)}</strong><span>${island.port ? 'PELABUHAN · REPARASI' : 'PERAIRAN TERBUKA'}</span>
    </div>`).join('');
  }
  const endlessEl = A.$('pirate-endless');
  if (endlessEl) {
    const best = summary.endless || {};
    endlessEl.innerHTML = `<div class="pirate-endless-card">
      <div class="pe-copy">
        <strong>PASANG TAK BERUJUNG</strong>
        <span>Tanpa kapten terakhir. Setiap pasang menambah armada, memperkuat lambungmu, dan mendatangkan kapten baru tiap tiga pasang. Berlabuh tetap bisa menyelamatkan lambung.</span>
        <em>REKOR: PASANG ${best.bestSurge || 0} · ${best.bestKills || 0} KAPAL · SKOR ${best.bestScore || 0}</em>
      </div>
      <button id="btn-pirate-endless" class="btn btn-ghost" type="button" data-pirate-endless="start">MULAI PASANG TAK BERUJUNG</button>
    </div>`;
  }
  const count = A.$('pirate-count');
  if (count) count.textContent = `${PIRATE_SHIP_TYPES.length} JENIS KAPAL · ${PIRATE_BOSS_TYPES.length} KAPTEN · ${PIRATE_PORTS.length} PELABUHAN`;
  const button = A.$('btn-pirate-start');
  if (button) {
    const stage = PIRATE_STAGE_BY_ID[A.pirateStageId] || PIRATE_STAGES[0];
    button.innerHTML = `<span>TAK LAYAR</span><em>${A.esc(stage.name)} · ${stage.targetKills} kapal · ${A.esc(PIRATE_BOSS_TYPES.find((boss) => boss.id === stage.bossId)?.name || 'KAPTEN')}</em>`;
  }
  const controls = A.$('pirate-controls');
  if (controls) controls.classList.add('hidden');
}

function syncPirateCanvasSize() {
  const canvas = A.$('pirate-canvas');
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return canvas;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let width = rect.width * dpr;
  let height = rect.height * dpr;
  const scale = Math.min(1, 1280 / width, 900 / height);
  width = Math.max(320, Math.round(width * scale));
  height = Math.max(240, Math.round(height * scale));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  return canvas;
}

function beginPirateMatch(match) {
  A.pirateMatch = match;
  A.pirateActive = true;
  A.piratePaused = false;
  A.pirateResult = null;
  A.pirateRecorded = false;
  A.pirateLastSnapshot = null;
  A.pirateUiTimer = 0;
  A.pirateHeld.clear();
  A.started = false;
  A.paused = false;
  A.shopOpen = false;
  A.mapOpen = false;
  A.codexOpen = false;
  A.inventoryOpen = false;
  A.settingsOpen = false;
  A.menuView = 'piratesBattle';
  A.accumulator = 0;
  A.lastTime = performance.now();
  A.$('pirate-result')?.classList.add('hidden');
  A.$('pirate-pause')?.classList.add('hidden');
  A.$('pirate-controls')?.classList.remove('hidden');
  updatePirateHud(true);
  A.syncScreens();
  const canvas = syncPirateCanvasSize();
  const ctx = canvas?.getContext('2d');
  if (canvas && ctx) renderPirateVoyage(ctx, A.pirateMatch, { width: canvas.width, height: canvas.height, time: performance.now() / 1000 });
  return true;
}

function startPirateVoyage() {
  const stage = PIRATE_STAGE_BY_ID[A.pirateStageId] || PIRATE_STAGES[0];
  if (!pirateStageUnlocked(pirateState(), stage.id)) return false;
  return beginPirateMatch(createPirateVoyage({
    stageId: stage.id,
    seed: (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0,
  }));
}

function startPirateEndless() {
  return beginPirateMatch(createPirateEndless({
    seed: (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0,
  }));
}

function togglePiratePause(next = !A.piratePaused) {
  if (!A.pirateActive || !A.pirateMatch || A.pirateMatch.phase !== 'sailing') return;
  A.piratePaused = !!next;
  A.pirateHeld.clear();
  setPirateControls(A.pirateMatch, { throttle: 0, turn: 0 });
  A.lastTime = performance.now();
  A.syncScreens();
  updatePirateHud(true);
}

function leavePirates() {
  A.pirateActive = false;
  A.piratePaused = false;
  A.pirateMatch = null;
  A.pirateResult = null;
  A.pirateRecorded = false;
  A.pirateLastSnapshot = null;
  A.pirateHeld.clear();
  showPirates();
}

function completePirateVoyage() {
  if (!A.pirateMatch || A.pirateRecorded) return;
  if (A.pirateMatch.phase !== 'cleared' && A.pirateMatch.phase !== 'sunk') return;
  A.pirateRecorded = true;
  const saved = A.pirateMatch.endless
    ? recordPirateEndless(pirateState(), A.pirateMatch)
    : recordPirateVoyage(pirateState(), A.pirateMatch);
  A.progress.pirates = saved.progress;
  A.saveProgress();
  A.pirateResult = {
    ...saved,
    snapshot: pirateSnapshot(A.pirateMatch),
    endless: !!A.pirateMatch.endless,
    bossName: PIRATE_BOSS_TYPES.find((boss) => boss.id === A.pirateMatch.stage.bossId)?.name || '',
  };
  buildPirateScreen();
  renderPirateResult();
  updatePirateHud(true);
}

function renderPirateResult() {
  const overlay = A.$('pirate-result');
  if (!overlay || !A.pirateResult) return;
  const r = A.pirateResult;
  const endless = !!r.endless;
  const win = r.win;
  const title = endless ? 'PASANG BERAKHIR' : win ? 'KAPTEN JATUH' : 'LAMBUNG TERBELAH';
  const body = endless
    ? `Kau bertahan sampai pasang ${r.surge || r.snapshot?.surge || 1} dan menenggelamkan ${r.kills || 0} kapal. ${r.isRecord ? 'Rekor baru tersimpan.' : 'Rekor lama masih berdiri.'}`
    : win
      ? `${A.esc(r.bossName)} tenggelam. Laut terbuka dan rute berikutnya menunggu.`
      : `Kau tenggelam setelah ${r.snapshot?.kills || 0} kapal. Pelabuhan dapat memulihkan lambung, tetapi hanya jika masih ada emas.`;
  overlay.innerHTML = `<div class="pirate-modal pirate-result-card ${endless || win ? 'victory' : 'defeat'}">
    <p class="eyebrow">PIRATE TIDE · ${A.esc(endless ? 'PASANG TAK BERUJUNG' : r.stageName)} · ${formatPuzzleTime(r.time || r.snapshot?.time || 0)}</p>
    <h3>${title}</h3>
    <p>${body}</p>
    <div class="pirate-result-stats">
      ${endless ? `<div><span>PASANG</span><b>${r.surge || 0}</b></div>` : ''}
      <div><span>KAPAL</span><b>${endless ? r.kills || 0 : `${r.snapshot?.kills || 0}/${r.snapshot?.targetKills || 0}`}</b></div>
      <div><span>TEMBAKAN</span><b>${r.snapshot?.shotsFired || 0}</b></div>
      <div><span>KAPTEN</span><b>${r.snapshot?.captains || 0}</b></div>
      <div><span>SKOR</span><b>${r.score || 0}</b></div>
    </div>
    <div class="pirate-result-actions">
      <button class="btn btn-primary" type="button" data-pirate-action="retry">LAYAR LAGI</button>
      <button class="btn btn-ghost" type="button" data-pirate-action="leave">KEMBALI KE HUB</button>
    </div>
  </div>`;
  overlay.classList.remove('hidden');
}

function updatePirateHud(force = false) {
  if (!A.pirateMatch) return;
  if ((A.pirateMatch.phase === 'cleared' || A.pirateMatch.phase === 'sunk') && !A.pirateRecorded) completePirateVoyage();
  if (!force && A.pirateUiTimer < 1 / 8) return;
  A.pirateUiTimer = 0;
  const snapshot = pirateSnapshot(A.pirateMatch);
  A.pirateLastSnapshot = snapshot;
  const setText = (id, value) => { const node = A.$(id); if (node) node.textContent = value; };
  const p = snapshot.player;
  const hpPct = A.clamp(p.hp / p.maxHp, 0, 1) * 100;
  setText('pirate-hull-text', `${Math.ceil(p.hp)} / ${p.maxHp}`);
  const hull = A.$('pirate-hull-fill'); if (hull) hull.style.width = `${hpPct}%`;
  setText('pirate-stage-name', snapshot.stageName);
  setText('pirate-objective', snapshot.endless
    ? `${snapshot.kills} KAPAL · PASANG ${snapshot.surge} · ${Math.ceil(snapshot.surgeTimer)}s`
    : snapshot.bossSpawned
      ? (snapshot.bossDefeated ? 'KAPTEN TENGGELAM' : `KAPTEN: ${snapshot.bossName}`)
      : `${snapshot.kills}/${snapshot.targetKills} KAPAL · CARI KAPTEN`);
  setText('pirate-gold', snapshot.gold);
  setText('pirate-kills', snapshot.endless ? snapshot.kills : `${snapshot.kills}/${snapshot.targetKills}`);
  setText('pirate-score', snapshot.score);
  setText('pirate-speed', `${Math.round(Math.abs(A.pirateMatch.player.speed))} KN`);
  setText('pirate-port-text', snapshot.nearPort?.inRange ? `BERLABUH · ${PIRATE_DOCK_COST} EMAS` : (snapshot.nearPort?.name || 'PELABUHAN'));
  const portButton = A.$('btn-pirate-dock');
  if (portButton) {
    portButton.disabled = !snapshot.nearPort?.inRange || snapshot.gold < PIRATE_DOCK_COST || p.hp >= p.maxHp || snapshot.phase !== 'sailing';
    portButton.classList.toggle('ready', snapshot.nearPort?.inRange && snapshot.gold >= PIRATE_DOCK_COST && p.hp < p.maxHp);
  }
  const portPanel = A.$('pirate-port');
  if (portPanel) portPanel.classList.toggle('hidden', !snapshot.nearPort?.inRange);
  const bossPanel = A.$('pirate-boss-panel');
  if (bossPanel) bossPanel.classList.toggle('hidden', !snapshot.bossSpawned || snapshot.bossDefeated);
  setText('pirate-boss-name', snapshot.bossName);
  const bossFill = A.$('pirate-boss-fill');
  if (bossFill) bossFill.style.width = `${snapshot.bossMaxHp ? A.clamp(snapshot.bossHp / snapshot.bossMaxHp, 0, 1) * 100 : 0}%`;
  const portCd = A.$('pirate-port-cooldown');
  if (portCd) portCd.textContent = snapshot.reloadPort > 0 ? `${snapshot.reloadPort.toFixed(1)}s` : 'SIAP';
  const starboardCd = A.$('pirate-starboard-cooldown');
  if (starboardCd) starboardCd.textContent = snapshot.reloadStarboard > 0 ? `${snapshot.reloadStarboard.toFixed(1)}s` : 'SIAP';
  const portFire = A.$('btn-pirate-fire-port');
  if (portFire) portFire.classList.toggle('cooling', snapshot.reloadPort > 0);
  const starboardFire = A.$('btn-pirate-fire-starboard');
  if (starboardFire) starboardFire.classList.toggle('cooling', snapshot.reloadStarboard > 0);
  const feed = A.$('pirate-feed');
  if (feed) {
    feed.innerHTML = snapshot.messages.map((message) => `<span class="${message.tone}">${A.esc(message.text)}</span>`).join('');
  }
  const pause = A.$('pirate-pause');
  if (pause) pause.classList.toggle('hidden', !A.piratePaused);
}

function piratePointerWorld(event) {
  const canvas = A.$('pirate-canvas');
  if (!canvas || !A.pirateMatch) return null;
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * canvas.width;
  const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height;
  return pirateScreenToWorld(A.pirateMatch, x, y, canvas.width, canvas.height);
}

function setPirateControlKey(code, down) {
  if (!A.pirateActive) return;
  if (down) A.pirateHeld.add(code);
  else A.pirateHeld.delete(code);
  if (!A.pirateMatch) return;
  const throttle = (A.pirateHeld.has('KeyW') || A.pirateHeld.has('ArrowUp') ? 1 : 0) - (A.pirateHeld.has('KeyS') || A.pirateHeld.has('ArrowDown') ? 1 : 0);
  const turn = (A.pirateHeld.has('KeyD') || A.pirateHeld.has('ArrowRight') ? 1 : 0) - (A.pirateHeld.has('KeyA') || A.pirateHeld.has('ArrowLeft') ? 1 : 0);
  setPirateControls(A.pirateMatch, { throttle, turn });
}

function firePirateSide(side) {
  if (!A.pirateActive || A.piratePaused || !A.pirateMatch) return false;
  const fired = pirateFire(A.pirateMatch, side);
  if (fired) updatePirateHud(true);
  return fired;
}

function dockPirate() {
  if (!A.pirateActive || A.piratePaused || !A.pirateMatch) return;
  const result = pirateDock(A.pirateMatch);
  if (!result.ok) A.showToast(result.reason, 1800);
  else A.showToast(`Lambung dipulihkan +${Math.round(result.healed)}.`, 1600);
  updatePirateHud(true);
}

function piratesFrame(raw, now) {
  if (A.pirateMatch && !A.piratePaused && A.pirateMatch.phase === 'sailing') {
    updatePirateVoyage(A.pirateMatch, Math.min(raw, 0.05));
  }
  if (A.pirateMatch) {
    const canvas = A.$('pirate-canvas');
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) renderPirateVoyage(ctx, A.pirateMatch, { width: canvas.width, height: canvas.height, time: now / 1000 });
  }
  if (A.pirateMatch?.phase === 'cleared' || A.pirateMatch?.phase === 'sunk') completePirateVoyage();
  A.pirateUiTimer += raw;
  updatePirateHud();
}

  return { pirateState, showPirates, buildPirateScreen, syncPirateCanvasSize, beginPirateMatch, startPirateVoyage, startPirateEndless, togglePiratePause, leavePirates, completePirateVoyage, renderPirateResult, updatePirateHud, piratePointerWorld, setPirateControlKey, firePirateSide, dockPirate, piratesFrame, lib: __lib0 };
}
