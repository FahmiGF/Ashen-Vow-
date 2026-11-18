import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WAVE_DEFENSE_MAPS,
  WAVE_DEFENSE_MAP_BY_ID,
  WAVE_DEFENSE_TOWERS,
  WAVE_DEFENSE_TOWER_BY_ID,
  WAVE_DEFENSE_ENEMY_TYPES,
  WAVE_DEFENSE_BOSSES,
  WAVE_DEFENSE_WAVES,
  WAVE_DEFENSE_TOTAL_WAVES,
  WAVE_DEFENSE_MAX_TOWER_LEVEL,
  createWaveDefense,
  updateWaveDefense,
  waveDefenseBuild,
  waveDefenseUpgrade,
  waveDefenseUpgradeCost,
  waveDefenseSell,
  waveDefenseSellValue,
  waveDefenseSelect,
  waveDefenseSelectTower,
  waveDefenseNextWave,
  waveDefenseSetSpeed,
  waveDefenseSnapshot,
  defaultWaveDefenseProgress,
  sanitizeWaveDefenseProgress,
  recordWaveDefense,
  waveDefenseSummary,
  endWaveDefense,
  renderWaveDefense,
} from '../src/wavedefense.js';

test('wave defense ships 3 maps, 12 towers, 18 enemies, 6 bosses and 24 waves', () => {
  assert.equal(WAVE_DEFENSE_MAPS.length, 3);
  for (const map of WAVE_DEFENSE_MAPS) {
    assert.ok(map.slots.length >= 20, `${map.id} needs plenty of build sites`);
    assert.ok(map.path.length >= 8);
    assert.ok(map.pathLength > 1000);
  }
  assert.equal(WAVE_DEFENSE_TOWERS.length, 12);
  assert.equal(WAVE_DEFENSE_ENEMY_TYPES.length, 18);
  assert.equal(WAVE_DEFENSE_BOSSES.length, 6);
  assert.equal(WAVE_DEFENSE_WAVES.length, WAVE_DEFENSE_TOTAL_WAVES);
  assert.equal(WAVE_DEFENSE_TOTAL_WAVES, 24);
  for (const name of ['Ballista', 'Catapult', 'Trebuchet', 'Mage Tower', 'Cannon Tower']) {
    assert.ok(WAVE_DEFENSE_TOWERS.some((tower) => tower.name === name), name);
  }
  assert.equal(WAVE_DEFENSE_WAVES.filter((wave) => wave.groups.some(([type]) => WAVE_DEFENSE_TOWER_BY_ID[type])).length, 0);
  assert.equal(WAVE_DEFENSE_WAVES.filter((wave) => wave.groups.some(([type]) => WAVE_DEFENSE_ENEMY_TYPES.find((enemy) => enemy.id === type)?.boss)).length, 6);
});

test('a match starts in prep with a real castle, gold, slots and deterministic state', () => {
  const a = createWaveDefense({ mapId: 'ember_bastion', difficulty: 'warlord', seed: 42 });
  const b = createWaveDefense({ mapId: 'ember_bastion', difficulty: 'warlord', seed: 42 });
  assert.equal(a.mapId, 'ember_bastion');
  assert.equal(a.phase, 'prep');
  assert.equal(a.wave, 0);
  assert.equal(a.castle.maxHp, 100);
  assert.equal(a.castle.hp, 100);
  assert.equal(a.gold, 225);
  assert.equal(a.slots.length, WAVE_DEFENSE_MAP_BY_ID.ember_bastion.slots.length);
  assert.equal(a.enemies.length, 0);
  assert.equal(a.towers.length, 0);
  assert.deepEqual(a.slots.map((slot) => [slot.x, slot.y]), b.slots.map((slot) => [slot.x, slot.y]));
  assert.equal(a.rng(), b.rng());
});

test('tower construction, upgrades, selection and selling respect the economy', () => {
  const m = createWaveDefense({ gold: 1000 });
  m.gold = 1000;
  const slot = m.slots[0];
  assert.ok(waveDefenseBuild(m, slot.index, 'ballista'));
  assert.equal(m.slots[0].towerId !== null, true);
  assert.equal(m.towers.length, 1);
  assert.equal(m.gold, 930);
  assert.equal(waveDefenseBuild(m, slot.index, 'cannon_tower'), null, 'slot is occupied');
  assert.equal(waveDefenseBuild(m, 999, 'ballista'), null, 'slot must exist');
  assert.equal(waveDefenseBuild(m, 1, 'unknown_tower'), null, 'tower must exist');

  m.selectedSlot = 0;
  const tower = m.towers[0];
  assert.equal(waveDefenseUpgradeCost(tower), 63);
  assert.ok(waveDefenseUpgrade(m));
  assert.equal(tower.level, 2);
  assert.ok(waveDefenseUpgrade(m));
  assert.equal(tower.level, WAVE_DEFENSE_MAX_TOWER_LEVEL);
  assert.equal(waveDefenseUpgrade(m), null, 'max level');
  const refund = waveDefenseSellValue(tower);
  assert.equal(waveDefenseSell(m), refund);
  assert.equal(m.towers.length, 0);
  assert.equal(m.slots[0].towerId, null);
  assert.equal(m.gold, 930 - 63 - 95 + refund - 0);
});

test('waves count down, spawn real enemies and a tower earns bounty without crashing', () => {
  const m = createWaveDefense({ mapId: 'ashen_keep', difficulty: 'squire', seed: 7 });
  m.gold = 500;
  for (let i = 0; i < 12; i += 1) waveDefenseBuild(m, i, i % 3 === 0 ? 'catapult' : 'ballista');
  assert.ok(waveDefenseNextWave(m));
  assert.equal(m.phase, 'wave');
  assert.equal(m.wave, 1);
  for (let i = 0; i < 60 * 25; i += 1) updateWaveDefense(m, 1 / 60);
  assert.ok(m.stats.spawned >= 6);
  assert.ok(m.stats.kills >= 1, 'towers must kill enemies');
  assert.ok(m.gold > 0);
  assert.ok(m.score > 0);
  assert.ok(m.stats.damage > 0);
});

test('a boss wave inserts the boss and reaches the castle when undefended', () => {
  const m = createWaveDefense({ difficulty: 'squire' });
  m.wave = 3;
  m.phase = 'prep';
  m.prepTimer = 0;
  assert.ok(waveDefenseNextWave(m));
  assert.equal(m.wave, 4);
  for (let i = 0; i < 60 * 2; i += 1) updateWaveDefense(m, 1 / 60);
  assert.ok(m.enemies.some((enemy) => enemy.boss), 'Bone Colossus must spawn');
  for (let i = 0; i < 60 * 120; i += 1) updateWaveDefense(m, 1 / 60);
  assert.ok(m.castle.hp < m.castle.maxHp);
  assert.ok(m.stats.leaks >= 1);
});

test('losing the castle ends the match, and speed is clamped', () => {
  const m = createWaveDefense({ difficulty: 'warlord' });
  m.castle.hp = 1;
  m.phase = 'prep';
  m.prepTimer = 0;
  waveDefenseNextWave(m);
  for (let i = 0; i < 60 * 90; i += 1) updateWaveDefense(m, 1 / 60);
  assert.equal(m.phase, 'ended');
  assert.equal(m.result, 'defeat');
  assert.equal(m.castle.hp, 0);
  assert.ok(m.stats.leaks >= 1);

  const s = createWaveDefense();
  assert.equal(waveDefenseSetSpeed(s, 9), true);
  assert.equal(s.speed, 3);
  assert.equal(waveDefenseSetSpeed(s, 0), true);
  assert.equal(s.speed, 1);
});

test('all tower upgrades and the final wave can produce victory', () => {
  const m = createWaveDefense({ mapId: 'frostgate', difficulty: 'squire', seed: 11 });
  m.gold = 999999;
  m.wave = 23;
  m.phase = 'prep';
  m.prepTimer = 0;
  for (const slot of m.slots) {
    waveDefenseBuild(m, slot.index, slot.index % 2 ? 'trebuchet' : 'sniper_nest');
    waveDefenseSelect(m, slot.index);
    waveDefenseUpgrade(m);
    waveDefenseUpgrade(m);
  }
  assert.equal(m.towers.length, m.slots.length);
  for (let i = 0; i < 60 * 300; i += 1) {
    if (m.phase === 'ended') break;
    updateWaveDefense(m, 1 / 60);
  }
  assert.equal(m.phase, 'ended');
  assert.equal(m.result, 'victory');
  assert.equal(m.wave, 24);
  assert.equal(m.stats.bossesDown, 1);
  assert.ok(m.score > 0);
});

test('save data sanitizes, records records and survives junk fields', () => {
  const base = defaultWaveDefenseProgress();
  const dirty = {
    ...base,
    runs: '12',
    wins: -4,
    bestWave: 99,
    bestScore: -10,
    bestTime: 88,
    maps: {
      ashen_keep: { runs: 3, wins: 1, bestWave: 24, bestScore: 1000 },
      unknown_map: { runs: 999 },
    },
    futureField: { keep: true },
  };
  const clean = sanitizeWaveDefenseProgress(dirty);
  assert.equal(clean.runs, 12);
  assert.equal(clean.wins, 0);
  assert.equal(clean.bestWave, WAVE_DEFENSE_TOTAL_WAVES);
  assert.equal(clean.bestScore, 0);
  assert.equal(clean.maps.ashen_keep.bestWave, 24);
  assert.equal(clean.maps.unknown_map, undefined);
  assert.deepEqual(clean.futureField, { keep: true });
  assert.equal(sanitizeWaveDefenseProgress('bad').runs, 0);
});

test('match records, summaries and snapshots expose the real battlefield', () => {
  const m = createWaveDefense({ mapId: 'ashen_keep', seed: 2 });
  m.gold = 500;
  waveDefenseBuild(m, 2, 'mage_tower');
  waveDefenseSelect(m, 2);
  waveDefenseUpgrade(m);
  m.wave = 10;
  m.score = 1234;
  m.stats.kills = 54;
  m.stats.leaks = 2;
  m.result = 'victory';
  m.time = 420;
  const saved = recordWaveDefense(defaultWaveDefenseProgress(), m);
  assert.equal(saved.isRecord, true);
  assert.equal(saved.progress.runs, 1);
  assert.equal(saved.progress.wins, 1);
  assert.equal(saved.progress.bestWave, 10);
  assert.equal(saved.progress.maps.ashen_keep.bestWave, 10);
  assert.equal(saved.progress.totalKills, 54);
  assert.equal(saved.progress.totalLeaks, 2);
  const summary = waveDefenseSummary(saved.progress);
  assert.equal(summary.winRate, 100);
  assert.equal(summary.mapsPlayed, 1);
  assert.equal(summary.towers, 12);
  const snap = waveDefenseSnapshot(m);
  assert.equal(snap.mapName, 'ASHEN KEEP');
  assert.equal(snap.towers.length, 1);
  assert.equal(snap.selectedTower.name, 'Mage Tower');
  assert.equal(snap.selectedTower.level, 2);
  assert.equal(snap.castle.maxHp, 120);
  assert.equal(snap.totalWaves, 24);
});

test('endWaveDefense is idempotent and the renderer tolerates a minimal context', () => {
  const m = createWaveDefense();
  assert.equal(endWaveDefense(m, 'victory').result, 'victory');
  assert.equal(endWaveDefense(m, 'defeat').result, 'victory');
  const calls = [];
  const ctx = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'canvas') return { width: 960, height: 540 };
      if (prop === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (prop === 'measureText') return () => ({ width: 10 });
      if (['fillStyle', 'strokeStyle', 'lineWidth', 'font', 'textAlign', 'globalAlpha'].includes(prop)) return '';
      return (...args) => { calls.push([prop, ...args]); };
    },
    set() { return true; },
  });
  assert.doesNotThrow(() => renderWaveDefense(ctx, m, { width: 960, height: 540, time: 1 }));
  assert.ok(calls.length > 0);
});
