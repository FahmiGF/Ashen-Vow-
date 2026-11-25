// The Fivefold Trials — screen module split out of main.js (Phase 1, v0.37.0).
// Loaded on demand by main.js's mode loader. `A` is the shell context: every
// shared binding of main.js is reached through it, so this file owns no globals.
import {
  WORLD_W,
} from '../core.js';
import {
  LABYRINTH_ZONE_BY_ID,
} from '../labyrinth.js';
import {
  TRIAL_BIOMES,
  TRIAL_BIOME_BY_ID,
  TRIAL_LEVELS_PER_BIOME,
  biomeProgress,
  buildEncounter,
  recordTrialBoss,
  recordTrialClear,
  sanitizeTrialProgress,
  trialArena,
  trialBossOverrides,
  trialBossUnlocked,
  trialLevelUnlocked,
  trialSummary,
  waveForEncounter,
} from '../trials.js';
import * as __lib0 from '../trials.js';

export function install(A) {
// ── Fivefold Trials ───────────────────────────────────────────────────────
function trialsState() {
  return A.progressBlock('trials', sanitizeTrialProgress);
}

function showTrials() {
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
  A.trialRun = null;
  A.activeRunKind = 'legacy';
  A.menuView = 'trials';
  A.clearHeldKeys();
  buildTrialsScreen();
  A.syncScreens();
}

function buildTrialsScreen() {
  const p = trialsState();
  const summary = trialSummary(p);
  const head = A.$('trials-summary');
  if (head) {
    head.innerHTML = `
      <div class="lab-stat"><span>LEVEL SELESAI</span><strong>${summary.clearedLevels}/${summary.levels}</strong></div>
      <div class="lab-stat"><span>BIOME</span><strong>${summary.biomes}</strong></div>
      <div class="lab-stat"><span>MUSUH DIJADWALKAN</span><strong>${summary.enemies}</strong></div>
      <div class="lab-stat"><span>ELITE DIJAMIN</span><strong>${summary.elites}</strong></div>
      <div class="lab-stat"><span>BOS GUGUR</span><strong>${summary.bosses}/${summary.biomes}</strong></div>
      <div class="lab-stat"><span>PROGRES</span><strong>${summary.completion}%</strong></div>`;
  }
  const body = A.$('trials-body');
  if (!body) return;
  body.innerHTML = TRIAL_BIOMES.map((biome) => {
    const state = biomeProgress(p, biome.id);
    const zone = LABYRINTH_ZONE_BY_ID[biome.id];
    const levels = biome.levels.map((level, index) => {
      const cleared = p.cleared[biome.id][index];
      const unlocked = trialLevelUnlocked(p, biome.id, index);
      return `<button class="trial-level ${cleared ? 'cleared' : ''}" type="button"
        data-trial-biome="${biome.id}" data-trial-level="${index}" ${unlocked ? '' : 'disabled'}>
        <b>${index + 1}. ${A.esc(level.name)}</b>
        <span>${cleared ? 'SELESAI' : unlocked ? '20 MUSUH · 4 ARKETIPE · 1 ELITE' : 'TERKUNCI'}</span>
        <span>ELITE: ${A.esc(level.elite.name)}</span>
      </button>`;
    }).join('');
    return `<article class="trials-biome" style="--zone:${zone?.color || '#d8b06a'}">
      <div class="trials-biome-head">
        <h3>${A.esc(biome.name)}</h3>
        <em>${A.esc(biome.localName)} · ${state.cleared}/${TRIAL_LEVELS_PER_BIOME}</em>
        <span class="trials-boss">BOS: ${A.esc(biome.boss.name)} · ${biome.boss.phases} FASE</span>
      </div>
      <div class="trials-levels">${levels}
        <button class="trial-level boss ${state.bossCleared ? 'cleared' : ''}" type="button" data-trial-boss="${biome.id}" ${state.bossUnlocked ? '' : 'disabled'}>
          <b>${state.bossCleared ? '✔ ' : ''}${A.esc(biome.boss.name)}</b>
          <span>${state.bossCleared ? 'BOS GUGUR' : state.bossUnlocked ? 'ARENA BOS TERBUKA' : 'SELESAIKAN 5 LEVEL'}</span>
          <span>${biome.boss.phases} fase · ${biome.boss.hp} HP dasar</span>
        </button>
      </div>
    </article>`;
  }).join('');
}

function startTrialLevel(biomeId, levelIndex) {
  A.audio.init();
  const biome = TRIAL_BIOME_BY_ID[biomeId];
  const level = biome?.levels[levelIndex];
  if (!level || !trialLevelUnlocked(trialsState(), biomeId, levelIndex)) return false;
  A.activeRunKind = 'trials';
  A.activeExpansionIndex = null;
  A.game.reset();
  A.applyCharacterToGame();
  A.applySkinToGame();
  A.game.labyrinth = true;
  A.game.player.relic = true;
  A.game.ash = Math.max(A.game.ash, 80);
  A.trialRun = {
    mode: 'level', biomeId, levelIndex, biome, level,
    encounter: buildEncounter(level), wave: -1, finished: false, clearTimer: 0,
    startedAt: performance.now(), hudTimer: 0,
  };
  A.game.loadArena(trialArena(biome, level));
  spawnTrialWave();
  A.started = true;
  A.paused = false;
  A.shopOpen = false;
  A.mapOpen = false;
  A.codexOpen = false;
  A.inventoryOpen = false;
  A.settingsOpen = false;
  A.closeDialogue(true);
  A.spectating = false;
  A.menuView = 'none';
  A.lastGameState = 'playing';
  A.accumulator = 0;
  A.lastTime = performance.now();
  A.clearHeldKeys();
  A.showBanner(level.name, `${biome.localName} · 20 musuh · 4 arketipe · 1 elite`);
  A.syncScreens();
  A.updateHud();
  updateTrialHud();
  return true;
}

function startTrialBoss(biomeId) {
  A.audio.init();
  const biome = TRIAL_BIOME_BY_ID[biomeId];
  if (!biome || !trialBossUnlocked(trialsState(), biomeId)) return false;
  A.activeRunKind = 'trials';
  A.game.reset();
  A.applyCharacterToGame();
  A.applySkinToGame();
  A.game.labyrinth = true;
  A.game.player.relic = true;
  A.game.ash = Math.max(A.game.ash, 160);
  A.trialRun = {
    mode: 'boss', biomeId, biome, level: biome.levels[biome.levels.length - 1],
    encounter: null, wave: 0, finished: false, clearTimer: 0,
    startedAt: performance.now(), hudTimer: 0,
  };
  A.game.loadArena(trialArena(biome, biome.levels[biome.levels.length - 1]));
  A.game.spawnBoss('trial_boss', trialBossOverrides(biome.boss));
  A.started = true;
  A.paused = false;
  A.shopOpen = false;
  A.mapOpen = false;
  A.codexOpen = false;
  A.inventoryOpen = false;
  A.settingsOpen = false;
  A.closeDialogue(true);
  A.spectating = false;
  A.menuView = 'none';
  A.lastGameState = 'playing';
  A.accumulator = 0;
  A.lastTime = performance.now();
  A.clearHeldKeys();
  A.showBanner(biome.boss.name, `${biome.boss.title} · ${biome.boss.phases} fase`);
  A.syncScreens();
  A.updateHud();
  updateTrialHud();
  return true;
}

function spawnTrialWave() {
  if (!A.trialRun?.encounter) return;
  A.trialRun.wave += 1;
  const units = waveForEncounter(A.trialRun.encounter, A.trialRun.wave);
  units.forEach((unit, index) => {
    A.game.spawnEnemy({
      type: unit.type,
      name: unit.name,
      x: A.clamp(260 + index * 230, 80, WORLD_W - 120),
      minX: 40,
      maxX: WORLD_W - 80,
      elite: unit.elite,
      eliteRank: unit.eliteRank,
      hpScale: unit.hpScale,
      dmgScale: unit.dmgScale,
    });
  });
  A.showToast(`Wave ${A.trialRun.wave + 1}/${A.trialRun.encounter.waves.length}${units.some((unit) => unit.elite) ? ' — ELITE' : ''}`, 1600);
  updateTrialHud();
}

function trialAliveCount() {
  return A.game.enemies.filter((enemy) => !enemy.dead && enemy.hp > 0).length;
}

function tickTrials(dt) {
  if (!A.trialRun) return;
  if (A.game.state === 'dead') {
    trialsState().stats.deaths += 1;
    A.saveProgress();
    A.trialRun = null;
    showTrials();
    A.showToast('Trial gagal — coba lagi.', 2200);
    return;
  }
  if (A.trialRun.clearTimer > 0) {
    A.trialRun.clearTimer -= dt;
    if (A.trialRun.clearTimer <= 0) {
      A.trialRun = null;
      showTrials();
    }
    return;
  }
  if (A.trialRun.mode === 'boss') return;
  A.trialRun.hudTimer += dt;
  if (A.trialRun.hudTimer >= 0.25) {
    A.trialRun.hudTimer = 0;
    updateTrialHud();
  }
  if (trialAliveCount() > 0) return;
  if (A.trialRun.wave < A.trialRun.encounter.waves.length - 1) {
    spawnTrialWave();
    return;
  }
  if (!A.trialRun.finished) {
    A.trialRun.finished = true;
    const record = recordTrialClear(A.progress.trials, A.trialRun.level.id, { time: (performance.now() - A.trialRun.startedAt) / 1000 });
    A.progress.trials = record.progress;
    if (record.firstClear) {
      A.game.ash += 120;
      A.labState().currencies.shards += 2;
      A.showToast(`${A.trialRun.level.name} selesai — 20 musuh, 1 elite. Boss ${record.bossUnlocked ? 'terbuka' : 'terkunci'}.`, 2600);
    } else {
      A.showToast('Level ini sudah pernah diselesaikan.', 1800);
    }
    A.saveProgress();
    A.trialRun.clearTimer = 1.2;
  }
}

function handleTrialBoss(ev) {
  if (!A.trialRun || A.trialRun.mode !== 'boss') return;
  const record = recordTrialBoss(A.progress.trials, A.trialRun.biomeId);
  A.progress.trials = record.progress;
  if (record.firstClear && record.reward) {
    A.game.ash += record.reward.ash;
    A.labState().currencies.shards += record.reward.shards;
    A.showToast(`${ev.name} gugur — ${record.reward.name} diraih.`, 2600);
  }
  A.saveProgress();
  A.trialRun.clearTimer = 1.8;
}

function updateTrialHud() {
  const hud = A.$('trial-hud');
  const show = A.started && !A.spectating && A.menuView === 'none' && A.activeRunKind === 'trials' && !!A.trialRun;
  if (hud) hud.classList.toggle('hidden', !show);
  if (!show) return;
  const levelEl = A.$('trial-hud-level');
  const biomeEl = A.$('trial-hud-biome');
  const waveEl = A.$('trial-hud-wave');
  const enemyEl = A.$('trial-hud-enemies');
  const eliteEl = A.$('trial-hud-elite');
  if (levelEl) levelEl.textContent = A.trialRun.mode === 'boss' ? 'BOSS' : `LEVEL ${A.trialRun.levelIndex + 1} / 5`;
  if (biomeEl) biomeEl.textContent = A.trialRun.biome?.localName || '';
  if (waveEl) waveEl.textContent = A.trialRun.mode === 'boss' ? 'ARENA BOS' : `WAVE ${Math.max(1, A.trialRun.wave + 1)} / 4`;
  if (enemyEl) enemyEl.textContent = A.trialRun.mode === 'boss' ? (A.game.boss ? `${A.game.boss.hp}/${A.game.boss.maxHp}` : 'BOS') : `${Math.max(0, 20 - Math.max(0, A.trialRun.wave) * 5 - trialAliveCount())} / 20 MUSUH`;
  if (eliteEl) eliteEl.textContent = A.trialRun.mode === 'boss' ? `${A.trialRun.biome?.boss?.phases || 3} FASE` : '1 ELITE DIJAMIN';
}

  return { trialsState, showTrials, buildTrialsScreen, startTrialLevel, startTrialBoss, spawnTrialWave, trialAliveCount, tickTrials, handleTrialBoss, updateTrialHud, lib: __lib0 };
}
