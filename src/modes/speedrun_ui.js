// Speedrun — Satu Nyawa — screen module split out of main.js (Phase 1, v0.37.0).
// Loaded on demand by main.js's mode loader. `A` is the shell context: every
// shared binding of main.js is reached through it, so this file owns no globals.
import {
  SPEEDRUN_LIVES,
  SPEEDRUN_RULES,
  SPEEDRUN_START_MULTIPLIER,
  recordSpeedrun,
  sanitizeSpeedrunProgress,
  speedrunMultiplier,
  speedrunStats,
  speedrunSummary,
} from '../speedrun.js';
import * as __lib0 from '../speedrun.js';

export function install(A) {
// ── Speedrun: one life, escalating game speed ─────────────────────────────
function speedrunState() {
  return A.progressBlock('speedrun', sanitizeSpeedrunProgress);
}

function speedrunStamp(at) {
  const ms = Number(at);
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function showSpeedrun() {
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
  A.speedrunSummaryOpen = false;
  A.menuView = 'speedrun';
  A.clearHeldKeys();
  buildSpeedrunScreen();
  A.syncScreens();
}

function buildSpeedrunScreen() {
  const summary = speedrunSummary(speedrunState());
  const stats = speedrunStats(speedrunState());
  const history = summary.history || [];
  const box = A.$('speedrun-summary');
  if (box) {
    box.innerHTML = `
      <div class="stat"><strong>${summary.bestMultiplier ? `${summary.bestMultiplier}×` : '—'}</strong><span>Rekor Kecepatan</span></div>
      <div class="stat"><strong>${summary.bestCycles}</strong><span>Putaran Tuntas</span></div>
      <div class="stat"><strong>${summary.bestTime ? A.formatTime(summary.bestTime) : '—'}</strong><span>Waktu Bertahan</span></div>
      <div class="stat"><strong>${summary.runs}</strong><span>Run Selesai</span></div>
    `;
  }
  const body = A.$('speedrun-body');
  if (body) {
    body.innerHTML = `
      <section class="exp-section">
        <div class="exp-section-head">
          <h3>ATURAN SATU NYAWA</h3>
          <span>${SPEEDRUN_LIVES} nyawa · tanpa checkpoint</span>
        </div>
        <ul class="speedrun-rules">
          ${SPEEDRUN_RULES.map((line) => `<li>${A.esc(line)}</li>`).join('')}
        </ul>
      </section>
      <section class="exp-section">
        <div class="exp-section-head">
          <h3>JALUR KECEPATAN</h3>
          <span>berhenti hanya saat kau gugur</span>
        </div>
        <div class="speedrun-ladder">
          ${[0, 1, 2, 3, 4, 5].map((cycle) => {
            const mult = speedrunMultiplier(cycle);
            return `<div class="speedrun-rung"><span>${cycle === 0 ? 'AWAL' : `SETELAH BOS ${cycle}`}</span><strong>${mult}×</strong></div>`;
          }).join('')}
          <div class="speedrun-rung endless"><span>DAN SETERUSNYA</span><strong>∞</strong></div>
        </div>
      </section>
      <section class="exp-section">
        <div class="exp-section-head">
          <h3>STATISTIK MENDALAM</h3>
          <span>${stats.attempts ? `${stats.attempts} percobaan tercatat` : 'belum ada data'}</span>
        </div>
        <div class="speedrun-stats">
          <div class="sr-stat"><span>RASIO TUNTAS</span><strong>${stats.clearRate}%</strong><em>${stats.clearedRuns} dari ${stats.attempts} percobaan</em></div>
          <div class="sr-stat"><span>RATA-RATA BERTAHAN</span><strong>${stats.averageTime ? A.formatTime(stats.averageTime) : '—'}</strong><em>total ${A.formatTime(stats.totalTime)}</em></div>
          <div class="sr-stat"><span>PUTARAN TERPANJANG</span><strong>${stats.longestClear}</strong><em>rata-rata ${stats.averageClears} putaran</em></div>
          <div class="sr-stat"><span>LANGKAH BERIKUT</span><strong>${stats.nextMultiplier}×</strong><em>${stats.bestMultiplier ? `${stats.bestMultiplier}× sudah tercapai` : 'belum ada rekor'}</em></div>
        </div>
        ${stats.ladder.length ? `<div class="speedrun-ladder-detail">
          ${stats.ladder.map((row) => `<div class="sr-rung-row${row.multiplier === stats.bestMultiplier ? ' record' : ''}">
            <strong>${row.multiplier}×</strong>
            <span>${row.attempts} percobaan · ${row.clears} tuntas</span>
            <span>putaran terbaik ${row.bestCycles}</span>
            <span>${row.bestTime ? A.formatTime(row.bestTime) : '—'}</span>
          </div>`).join('')}
        </div>` : '<p class="speedrun-empty">Statistik per kecepatan muncul setelah percobaan pertamamu.</p>'}
      </section>
      <section class="exp-section">
        <div class="exp-section-head">
          <h3>RIWAYAT RUN</h3>
          <span>${history.length ? `${history.length} percobaan terakhir · terbaru di atas` : 'belum ada percobaan'}</span>
        </div>
        ${history.length ? `<ol class="speedrun-history">
          ${history.map((entry, index) => `<li class="speedrun-history-row${entry.died ? '' : ' cleared'}${entry.multiplier >= summary.bestMultiplier ? ' record' : ''}">
            <span class="sr-index">#${index + 1}</span>
            <strong class="sr-speed">${entry.multiplier}×</strong>
            <span class="sr-meta"><span>${entry.clears} putaran tuntas</span><span>${entry.rooms} ruang</span></span>
            <span class="sr-time">${A.formatTime(entry.time)}</span>
            <em class="sr-result">${entry.died ? 'GUGUR' : 'TUNTAS'}</em>
            <small class="sr-stamp">${speedrunStamp(entry.at)}</small>
          </li>`).join('')}
        </ol>` : '<p class="speedrun-empty">Belum ada riwayat. Setiap percobaan tercatat di sini dan tersimpan di browser ini.</p>'}
      </section>
    `;
  }
  const start = A.$('speedrun-start');
  if (start) {
    const label = start.querySelector('span');
    if (label) label.textContent = `MULAI SPEEDRUN ${SPEEDRUN_START_MULTIPLIER}×`;
  }
}

function startSpeedrun(cycle = 0, options = {}) {
  const safeCycle = Math.max(0, Math.min(98, Math.floor(Number(cycle) || 0)));
  const multiplier = speedrunMultiplier(safeCycle);
  A.audio.init();
  A.attempts = 1;
  A.coopGuestMode = false;
  A.coopGuestRoom = -1;
  A.activeRunKind = 'speedrun';
  A.activeCourtTrial = null;
  A.activeCourtRoom = null;
  A.activePackIndex = -1;
  A.activeFairyStage = -1;
  A.activeFairyBoss = null;
  A.activeExpansionIndex = null;
  A.activeModeId = null;
  A.activeTrialId = null;
  A.modeRunRewarded = false;
  A.packRunActive = false;
  A.labRun = null;
  A.labDirector = null;
  A.labGuestMode = false;
  A.labRewardsOpen = false;
  A.labSummaryOpen = false;
  A.game.labyrinth = false;
  A.game.reset();
  A.game.oneLife = true;
  A.applyCharacterToGame();
  A.applySkinToGame();
  A.speedrunRoomCount = 0;
  A.speedrunCleared = false;
  A.speedrunSummaryOpen = false;
  A.speedrunRun = { cycle: safeCycle, multiplier, startedAt: performance.now() };
  A.cutsceneSeen = new Set();
  A.postCreditTimer = -1;
  A.game.events.length = 0;
  A.started = true;
  A.paused = false;
  A.hunterShopOpen = false;
  A.shopOpen = false;
  A.mapOpen = false;
  A.codexOpen = false;
  A.inventoryOpen = false;
  A.settingsOpen = false;
  A.closeDialogue(true);
  A.spectating = false;
  A.spectateGame = null;
  A.menuView = 'none';
  A.lastGameState = 'playing';
  A.accumulator = 0;
  A.lastTime = performance.now();
  A.clearHeldKeys();
  A.discoverCurrentRoom(A.game.roomIndex);
  A.beginStage(A.game.roomIndex, A.game.room.name);
  A.showBanner(`${multiplier}× SPEEDRUN`, `PUTARAN ${safeCycle + 1} · SATU NYAWA`);
  if (!options.silent) {
    A.showToast(`⚡ ${multiplier}× — ${SPEEDRUN_LIVES} nyawa, tanpa checkpoint.`, 2600);
  }
  A.syncScreens();
  A.updateHud();
}

function finishSpeedrun() {
  if (A.activeRunKind !== 'speedrun' || !A.speedrunRun || A.speedrunSummaryOpen) return;
  const attempt = recordSpeedrun(speedrunState(), {
    multiplier: A.speedrunRun.multiplier,
    clears: A.speedrunRun.cycle,
    rooms: A.speedrunRoomCount,
    time: A.game.time,
    died: true,
  });
  A.saveProgress();
  A.speedrunLastSummary = attempt;
  A.speedrunSummaryOpen = true;
  A.speedrunCleared = false;
  buildSpeedrunSummary(attempt);
  A.syncScreens();
}

function buildSpeedrunSummary(attempt) {
  const sub = A.$('speedrun-summary-sub');
  if (sub) {
    sub.textContent = attempt.isRecord
      ? `Rekor baru: ${attempt.bestMultiplier}× dengan ${attempt.bestCycles} putaran tuntas.`
      : `Kau gugur pada ${attempt.multiplier}×. Rekor ${attempt.bestMultiplier || attempt.multiplier}× masih berdiri.`;
  }
  const body = A.$('speedrun-summary-body');
  if (body) {
    body.innerHTML = `${A.statsHtml([
      [`${attempt.multiplier}×`, 'Kecepatan'],
      [attempt.clears, 'Putaran Tuntas'],
      [attempt.rooms, 'Ruang Dilewati'],
      [A.formatTime(attempt.time), 'Waktu Bertahan'],
    ])}<p class="micro">Rekor tersimpan di progress.speedrun · satu nyawa, tanpa checkpoint.</p>`;
  }
  const again = A.$('speedrun-summary-again');
  if (again) {
    const label = again.querySelector('span');
    if (label) label.textContent = `MULAI LAGI ${SPEEDRUN_START_MULTIPLIER}×`;
  }
}

function handleSpeedrunClear() {
  if (A.activeRunKind !== 'speedrun' || !A.speedrunRun) return;
  const cleared = A.speedrunRun.multiplier;
  const nextCycle = A.speedrunRun.cycle + 1;
  const nextMultiplier = speedrunMultiplier(nextCycle);
  // The run has now reached the *next* speed, so that is the multiplier the
  // record keeps even if the player dies before the new boss falls.
  const attempt = recordSpeedrun(speedrunState(), {
    multiplier: nextMultiplier,
    clears: nextCycle,
    rooms: A.speedrunRoomCount,
    time: A.game.time,
    died: false,
  });
  A.saveProgress();
  A.speedrunLastSummary = attempt;
  startSpeedrun(nextCycle, { silent: true });
  A.showToast(`⚡ ${cleared}× tuntas — naik ke ${nextMultiplier}×`, 2800);
}

  return { speedrunState, speedrunStamp, showSpeedrun, buildSpeedrunScreen, startSpeedrun, finishSpeedrun, buildSpeedrunSummary, handleSpeedrunClear, lib: __lib0 };
}
