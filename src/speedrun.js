// Ashen Vow — Speedrun challenge mode.
//
// One life, no checkpoints, and a clock that keeps tightening: the campaign
// starts at 2× game speed and every defeated final boss raises the multiplier
// by one (3×, 4×, 5× …) until the player dies. This module is pure data and
// arithmetic so the Node suite can prove the rules without a browser.

export const SPEEDRUN_NAME = 'SPEEDRUN — SATU NYAWA';
export const SPEEDRUN_START_MULTIPLIER = 2;
export const SPEEDRUN_STEP = 1;
export const SPEEDRUN_LIVES = 1;
export const SPEEDRUN_MAX_MULTIPLIER = 40;
export const SPEEDRUN_LAST_BOSS = 'oathbreaker';
export const SPEEDRUN_LAST_ROOM = 7;
export const SPEEDRUN_FIXED = 1 / 120;
export const SPEEDRUN_HISTORY_LIMIT = 10;

export const SPEEDRUN_RULES = [
  'Satu nyawa. Kematian mengakhiri run — tidak ada checkpoint, tidak ada bangkit di Warung Abu.',
  'Kampanye dimulai pada 2× kecepatan: simulasi tetap 120 Hz, hanya saja langkahnya berjalan dua kali lebih rapat.',
  'Setiap kali The Oathbreaker gugur, kecepatan naik satu tingkat (3×, 4×, 5×, …) dan kampanye dimulai lagi dari Gerbang Abu.',
  'Jurang berubah jadi maut: jatuh berarti run selesai, bukan terlempar kembali ke titik aman.',
  'Rekor multiplier tertinggi, jumlah putaran, dan waktu total disimpan di progress.speedrun.',
];

export function speedrunMultiplier(cycle = 0) {
  const safe = Math.max(0, Math.floor(Number(cycle) || 0));
  return Math.min(SPEEDRUN_MAX_MULTIPLIER, SPEEDRUN_START_MULTIPLIER + safe * SPEEDRUN_STEP);
}

export function speedrunCycleLabel(cycle = 0) {
  return `PUTARAN ${Math.max(1, Math.floor(Number(cycle) || 0) + 1)}`;
}

// The frame loop still advances the fixed 1/120 s simulation; a speedrun simply
// asks for more substeps per rendered frame. The cap keeps a stalled tab from
// trying to catch up with thousands of steps at once.
export function speedrunMaxSubsteps(scales = SPEEDRUN_START_MULTIPLIER) {
  const scale = Math.max(1, Number(scales) || 1);
  return Math.max(10, Math.min(240, Math.ceil(scale * 4) + 10));
}

export function defaultSpeedrunProgress() {
  return {
    version: 1,
    runs: 0,
    deaths: 0,
    clears: 0,
    bestMultiplier: 0,
    bestCycles: 0,
    bestTime: 0,
    bestRooms: 0,
    lastMultiplier: 0,
    lastTime: 0,
    // Newest attempt first; capped so the save stays small.
    history: [],
  };
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function wholeNumber(value, min, max) {
  return Math.floor(clampNumber(value, min, max));
}

export function sanitizeSpeedrunHistory(raw, limit = SPEEDRUN_HISTORY_LIMIT) {
  if (!Array.isArray(raw)) return [];
  const cap = wholeNumber(limit, 1, 50);
  return raw
    .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
    .slice(0, cap)
    .map((entry) => ({
      ...entry,
      multiplier: wholeNumber(entry.multiplier, 0, SPEEDRUN_MAX_MULTIPLIER),
      clears: wholeNumber(entry.clears, 0, 1e4),
      rooms: wholeNumber(entry.rooms, 0, 1e4),
      time: Math.round(clampNumber(entry.time, 0, 1e7) * 10) / 10,
      died: entry.died !== false,
      at: wholeNumber(entry.at, 0, 4e12),
    }));
}

export function sanitizeSpeedrunProgress(raw) {
  const base = defaultSpeedrunProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  return {
    ...raw,
    version: 1,
    runs: wholeNumber(raw.runs, 0, 1e6),
    deaths: wholeNumber(raw.deaths, 0, 1e6),
    clears: wholeNumber(raw.clears, 0, 1e6),
    bestMultiplier: wholeNumber(raw.bestMultiplier, 0, SPEEDRUN_MAX_MULTIPLIER),
    bestCycles: wholeNumber(raw.bestCycles, 0, 1e4),
    bestTime: Math.round(clampNumber(raw.bestTime, 0, 1e7) * 10) / 10,
    bestRooms: wholeNumber(raw.bestRooms, 0, 1e4),
    lastMultiplier: wholeNumber(raw.lastMultiplier, 0, SPEEDRUN_MAX_MULTIPLIER),
    lastTime: Math.round(clampNumber(raw.lastTime, 0, 1e7) * 10) / 10,
    history: sanitizeSpeedrunHistory(raw.history),
  };
}

export function speedrunSummary(progress) {
  const p = sanitizeSpeedrunProgress(progress);
  return {
    runs: p.runs,
    deaths: p.deaths,
    clears: p.clears,
    bestMultiplier: p.bestMultiplier,
    bestCycles: p.bestCycles,
    bestTime: p.bestTime,
    bestRooms: p.bestRooms,
    hasRecord: p.bestMultiplier > 0,
    history: p.history,
  };
}

// One row per speed reached, newest/highest first, built from the run history.
// `attempts` counts every attempt that reached that multiplier, `bestCycles`
// and `bestTime` are the best numbers seen there, and `reached` marks a speed
// the player has actually stood at.
export function speedrunLadder(progress) {
  const p = sanitizeSpeedrunProgress(progress);
  const rows = new Map();
  for (const entry of p.history) {
    if (entry.multiplier <= 0) continue;
    const row = rows.get(entry.multiplier) || {
      multiplier: entry.multiplier,
      cycle: Math.max(0, entry.multiplier - SPEEDRUN_START_MULTIPLIER),
      attempts: 0,
      deaths: 0,
      clears: 0,
      bestCycles: 0,
      bestTime: 0,
      lastAt: 0,
      reached: true,
    };
    row.attempts += 1;
    if (entry.died) row.deaths += 1;
    else row.clears += 1;
    row.bestCycles = Math.max(row.bestCycles, entry.clears);
    row.bestTime = Math.max(row.bestTime, entry.time);
    row.lastAt = Math.max(row.lastAt, entry.at);
    rows.set(entry.multiplier, row);
  }
  return [...rows.values()].sort((a, b) => b.multiplier - a.multiplier);
}

// Deeper aggregate stats for the hub panel. Everything derives from the same
// sanitized save, so a corrupt history can never produce a nonsense rate.
export function speedrunStats(progress) {
  const p = sanitizeSpeedrunProgress(progress);
  const history = p.history;
  const attempts = history.length;
  const deaths = history.filter((entry) => entry.died).length;
  const clearedRuns = attempts - deaths;
  const totalTime = Math.round(history.reduce((sum, entry) => sum + entry.time, 0) * 10) / 10;
  const averageTime = attempts ? Math.round((totalTime / attempts) * 10) / 10 : 0;
  const averageClears = attempts
    ? Math.round((history.reduce((sum, entry) => sum + entry.clears, 0) / attempts) * 10) / 10
    : 0;
  const longestClear = history.reduce((best, entry) => (entry.clears > best ? entry.clears : best), 0);
  const best = p.bestMultiplier;
  return {
    attempts,
    deaths,
    clearedRuns,
    totalTime,
    averageTime,
    averageClears,
    longestClear,
    clearRate: attempts ? Math.round((clearedRuns / attempts) * 1000) / 10 : 0,
    deathRate: attempts ? Math.round((deaths / attempts) * 1000) / 10 : 0,
    bestMultiplier: best,
    bestCycles: p.bestCycles,
    bestTime: p.bestTime,
    bestRooms: p.bestRooms,
    nextMultiplier: best ? Math.min(SPEEDRUN_MAX_MULTIPLIER, best + SPEEDRUN_STEP) : SPEEDRUN_START_MULTIPLIER,
    stepsToNext: best ? Math.max(0, Math.min(SPEEDRUN_MAX_MULTIPLIER, best + SPEEDRUN_STEP) - best) : 0,
    ladder: speedrunLadder(p),
  };
}

// Records one finished run (death) or one cleared cycle (boss down). Returns a
// summary of the attempt plus whether it set a new multiplier record.
export function recordSpeedrun(progress, attempt = {}) {
  const p = sanitizeSpeedrunProgress(progress);
  const multiplier = wholeNumber(attempt.multiplier, 0, SPEEDRUN_MAX_MULTIPLIER);
  const clears = wholeNumber(attempt.clears, 0, 1e4);
  const rooms = wholeNumber(attempt.rooms, 0, 1e4);
  const time = Math.round(clampNumber(attempt.time, 0, 1e7) * 10) / 10;
  const died = attempt.died !== false;

  if (died) {
    p.runs += 1;
    p.deaths += 1;
  } else {
    p.clears += 1;
  }
  p.lastMultiplier = multiplier;
  p.lastTime = time;
  const at = wholeNumber(attempt.at, 0, 4e12) || Date.now();
  p.history = sanitizeSpeedrunHistory([
    { multiplier, clears, rooms, time, died, at },
    ...(Array.isArray(p.history) ? p.history : []),
  ]);

  const beatMultiplier = multiplier > p.bestMultiplier;
  const beatCycles = clears > p.bestCycles;
  const beatTime = multiplier >= p.bestMultiplier && time > p.bestTime;
  if (beatMultiplier) p.bestMultiplier = multiplier;
  if (beatCycles) p.bestCycles = clears;
  if (beatTime) p.bestTime = time;
  if (rooms > p.bestRooms) p.bestRooms = rooms;

  // Callers keep the live save object around, so write the records back into it.
  if (progress && typeof progress === 'object' && !Array.isArray(progress)) {
    Object.assign(progress, p);
  }

  return {
    ...speedrunSummary(p),
    multiplier,
    clears,
    rooms,
    time,
    died,
    at,
    isRecord: beatMultiplier || beatCycles,
  };
}
