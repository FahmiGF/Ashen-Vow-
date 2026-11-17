import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRIAL_BIOMES, TRIAL_LEVELS, TRIAL_BOSSES, TRIAL_BIOME_BY_ID,
  TRIAL_ENEMIES_PER_LEVEL, TRIAL_ARCHETYPES_PER_LEVEL, TRIAL_WAVE_SIZE,
  buildEncounter, validateEncounter, trialBossUnlocked, trialLevelUnlocked,
  trialArena, trialBossOverrides, defaultTrialProgress, sanitizeTrialProgress,
  recordTrialClear, recordTrialBoss, trialSummary, waveForEncounter,
} from '../src/trials.js';
import { LABYRINTH_ZONES } from '../src/labyrinth.js';

test('twenty biomes each hold five levels and a dedicated boss', () => {
  assert.equal(TRIAL_BIOMES.length, 20);
  assert.equal(TRIAL_LEVELS.length, 100);
  assert.equal(TRIAL_BOSSES.length, 20);
  for (const biome of TRIAL_BIOMES) {
    assert.equal(biome.levels.length, 5);
    assert.equal(biome.stages, 5);
    assert.ok(biome.boss.name && biome.boss.hp > 0 && biome.boss.phases >= 3);
    assert.equal(new Set(biome.levels.map((level) => level.name)).size, 5);
    assert.equal(new Set(biome.levels.map((level) => level.elite.name)).size, 5);
  }
});

test('every biome maps to an existing labyrinth biome and boss', () => {
  for (const biome of TRIAL_BIOMES) {
    const zone = LABYRINTH_ZONES.find((entry) => entry.id === biome.id);
    assert.ok(zone, `missing labyrinth zone for ${biome.id}`);
    assert.ok(TRIAL_BIOME_BY_ID[biome.id]);
  }
});

test('every standard level has exactly 20 enemies, 4 archetypes and 1 elite', () => {
  for (const level of TRIAL_LEVELS) {
    const encounter = buildEncounter(level);
    const validation = validateEncounter(encounter);
    assert.ok(validation.ok, `${level.id}: ${validation.errors.join(', ')}`);
    assert.equal(encounter.units.length, TRIAL_ENEMIES_PER_LEVEL);
    assert.equal(new Set(encounter.units.map((unit) => unit.archetype)).size, TRIAL_ARCHETYPES_PER_LEVEL);
    assert.equal(encounter.units.filter((unit) => unit.elite).length, 1);
    assert.equal(encounter.units.filter((unit) => !unit.elite).length, 19);
    assert.equal(encounter.units.filter((unit) => unit.boss).length, 0);
  }
});

test('encounter waves total twenty and never exceed the level budget', () => {
  for (const level of TRIAL_LEVELS) {
    const encounter = buildEncounter(level);
    assert.equal(encounter.waves.length, 4);
    assert.equal(encounter.waves.flat().length, 20);
    for (let wave = 0; wave < encounter.waves.length; wave += 1) {
      assert.equal(waveForEncounter(encounter, wave).length, TRIAL_WAVE_SIZE);
    }
    assert.equal(waveForEncounter(encounter, 4).length, 0);
  }
});

test('invalid encounters are rejected by the validator', () => {
  const level = TRIAL_LEVELS[0];
  const good = buildEncounter(level);
  const duplicated = { ...good, units: good.units.map((unit) => ({ ...unit, archetype: 'crawler', elite: false })) };
  assert.equal(validateEncounter(duplicated).ok, false);
  assert.equal(validateEncounter({ ...good, units: good.units.slice(0, 19) }).ok, false);
  const twoElites = { ...good, units: good.units.map((unit, index) => (index < 2 ? { ...unit, elite: true } : unit)) };
  assert.equal(validateEncounter(twoElites).ok, false);
});

test('boss unlocks only after all five levels are cleared in order', () => {
  let progress = defaultTrialProgress();
  const biome = TRIAL_BIOMES[0];
  assert.equal(trialBossUnlocked(progress, biome.id), false);
  assert.equal(trialLevelUnlocked(progress, biome.id, 0), true);
  assert.equal(trialLevelUnlocked(progress, biome.id, 1), false);
  // Out-of-order clears are refused.
  const skipped = recordTrialClear(progress, biome.levels[2].id);
  assert.equal(skipped.progress.cleared[biome.id][2], false);
  for (const level of biome.levels) {
    const result = recordTrialClear(progress, level.id);
    progress = result.progress;
  }
  assert.equal(trialBossUnlocked(progress, biome.id), true);
  assert.equal(progress.cleared[biome.id].filter(Boolean).length, 5);
});

test('boss rewards are granted exactly once and only when unlocked', () => {
  let progress = defaultTrialProgress();
  const biome = TRIAL_BIOMES[1];
  const early = recordTrialBoss(progress, biome.id);
  assert.equal(early.firstClear, false);
  assert.equal(early.reward, null);
  for (const level of biome.levels) progress = recordTrialClear(progress, level.id).progress;
  const first = recordTrialBoss(progress, biome.id);
  assert.equal(first.firstClear, true);
  assert.ok(first.reward.ash > 0);
  progress = first.progress;
  const again = recordTrialBoss(progress, biome.id);
  assert.equal(again.firstClear, false);
  assert.equal(again.progress.stats.bosses, 1);
});

test('save sanitizer rejects impossible and forged trial state', () => {
  const biome = TRIAL_BIOMES[2];
  const forged = sanitizeTrialProgress({
    cleared: { [biome.id]: [false, true, true, false, false] },
    bosses: [biome.id, 'not_a_biome'],
    stats: { levels: -4, enemies: 'x' },
    futureField: 'kept',
  });
  assert.deepEqual(forged.cleared[biome.id], [false, false, false, false, false]);
  assert.deepEqual(forged.bosses, []);
  assert.equal(forged.stats.levels, 0);
  assert.equal(forged.futureField, 'kept');
  // Sequentially cleared data survives.
  let progress = defaultTrialProgress();
  for (const level of biome.levels) progress = recordTrialClear(progress, level.id).progress;
  progress = recordTrialBoss(progress, biome.id).progress;
  const roundTrip = sanitizeTrialProgress(JSON.parse(JSON.stringify(progress)));
  assert.equal(roundTrip.cleared[biome.id].filter(Boolean).length, 5);
  assert.deepEqual(roundTrip.bosses, [biome.id]);
});

test('trials expose playable arenas and boss overrides', () => {
  const biome = TRIAL_BIOMES[3];
  const level = biome.levels[2];
  const arena = trialArena(biome, level);
  assert.ok(arena.spawn && arena.platforms.length >= 3);
  assert.equal(arena.gates.length, 0);
  assert.equal(arena.zoneId, biome.id);
  assert.equal(arena.labyrinth, true);
  const boss = trialBossOverrides(biome.boss, { difficulty: 1.5 });
  assert.ok(boss.maxHp > biome.boss.hp);
  assert.equal(boss.maxPhases, biome.boss.phases);
  assert.equal(boss.phaseThresholds.length, biome.boss.phases - 1);
  assert.ok(boss.phaseThresholds.every((value, index, list) => index === 0 || value < list[index - 1]));
});

test('summary reports 100 levels, 2000 encounters and 100 guaranteed elites', () => {
  const summary = trialSummary(defaultTrialProgress());
  assert.equal(summary.biomes, 20);
  assert.equal(summary.levels, 100);
  assert.equal(summary.enemies, 2000);
  assert.equal(summary.elites, 100);
  assert.equal(summary.levelsPerBiome, 5);
});
