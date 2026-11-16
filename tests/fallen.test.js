import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FALLEN_NAME,
  FALLEN_ARC_ID,
  FALLEN_ROOM_START,
  FALLEN_ROOM_COUNT,
  FALLEN_REGION_COUNT,
  FALLEN_ROOMS,
  FALLEN_ROOM_BY_ID,
  FALLEN_REGIONS,
  FALLEN_REGION_ROOMS,
  FALLEN_ENEMY_INFO,
  FALLEN_ELITES,
  FALLEN_AMBIENT,
  FALLEN_BOSSES,
  FALLEN_BOSS_INFO,
  FALLEN_MAIN_BOSSES,
  FALLEN_OPTIONAL_BOSSES,
  FALLEN_ABILITIES,
  FALLEN_ECHOES,
  FALLEN_ENDINGS,
  FALLEN_BOONS,
  FALLEN_UPGRADES,
  FALLEN_MOVEMENTS,
  ECHO_CAP,
  MARK_MAX,
  MARK_DAMAGE,
  SHADOW_DAMAGE_MUL,
  defaultFallenProgress,
  sanitizeFallenProgress,
  ascendProgress,
  fallenIsAscended,
  fallenRegionUnlocked,
  fallenRoomUnlocked,
  fallenBossUnlocked,
  recordFallenRoom,
  recordFallenBoss,
  recordFallenEnding,
  recordFallenDeath,
  recordFallenRun,
  buyFallenUpgrade,
  equipFallenWeapon,
  chooseFallenBoon,
  addFallenShards,
  setFallenMenuTheme,
  fallenSummary,
  fallenMenuFigure,
  fallenArchive,
  fallenRunConfig,
  fallenEchoesFor,
  createFallenRun,
  radianceGain,
  radianceFull,
  blindingBurst,
  applyJudgment,
  judgmentTick,
  toggleShadow,
  shadowTick,
  shadowDamageMul,
  purityDamage,
  validateFallenRooms,
  fallenBoonChoices,
} from '../src/fallen.js';
import { AshenGame, ROOMS, ALL_ROOMS, ALL_ENEMY_INFO, ALL_BOSS_INFO } from '../src/core.js';

const clearHalls = (state, regionIndex) => {
  const region = FALLEN_REGIONS[regionIndex];
  for (let slot = 0; slot < 4; slot += 1) recordFallenRoom(state, region.roomStart + slot);
  return region;
};

test('fallen arc exposes 39 contiguous rooms after the base game', () => {
  assert.equal(FALLEN_ROOM_COUNT, 39);
  assert.equal(FALLEN_ROOMS.length, 39);
  assert.equal(FALLEN_ROOMS[0].id, FALLEN_ROOM_START);
  FALLEN_ROOMS.forEach((room, i) => assert.equal(room.id, FALLEN_ROOM_START + i));
  assert.equal(validateFallenRooms().ok, true);
  assert.equal(validateFallenRooms([{ id: 1, name: 'x', spawn: { x: 0 }, platforms: [] }]).ok, false);
});

test('seven regions expose four halls plus a boss room each', () => {
  assert.equal(FALLEN_REGIONS.length, FALLEN_REGION_COUNT);
  assert.equal(FALLEN_REGION_ROOMS.length, 7);
  for (const [index, region] of FALLEN_REGIONS.entries()) {
    const rooms = FALLEN_REGION_ROOMS[index];
    assert.equal(rooms.length, 5);
    assert.equal(rooms[0].id, region.roomStart);
    assert.equal(rooms[4].id, region.bossRoom);
    assert.equal(rooms[4].boss, FALLEN_BOSS_INFO[rooms[4].boss].kind);
    assert.ok(rooms[0].checkpoint, 'first hall keeps a checkpoint');
    assert.ok(rooms[0].merchant, 'first hall keeps a merchant');
  }
  const optional = FALLEN_ROOMS.filter((r) => r.fallenOptional);
  assert.equal(optional.length, 4);
  optional.forEach((r) => assert.equal(r.gate, null));
});

test('halls chain in order and the campaign gate leads to the next region', () => {
  for (const region of FALLEN_REGIONS) {
    for (let slot = 0; slot < 4; slot += 1) {
      const room = FALLEN_ROOM_BY_ID[region.roomStart + slot];
      assert.equal(room.gate.next, room.id + 1);
      assert.equal(room.gate.requires, 'clear');
    }
  }
  for (let i = 0; i < FALLEN_REGION_COUNT - 1; i += 1) {
    const bossRoom = FALLEN_ROOM_BY_ID[FALLEN_REGIONS[i].bossRoom];
    assert.equal(bossRoom.gate.next, FALLEN_REGIONS[i + 1].roomStart);
    assert.equal(bossRoom.gate.requires, 'boss');
  }
  assert.equal(FALLEN_ROOM_BY_ID[FALLEN_REGIONS[6].bossRoom].gate, null);
});

test('eleven bosses split into seven story fights and four optional ones', () => {
  assert.equal(FALLEN_BOSSES.length, 11);
  assert.equal(FALLEN_MAIN_BOSSES.length, 7);
  assert.equal(FALLEN_OPTIONAL_BOSSES.length, 4);
  const kinds = new Set(FALLEN_BOSSES.map((b) => b.kind));
  assert.equal(kinds.size, 11);
  for (const boss of FALLEN_BOSSES) {
    const info = FALLEN_BOSS_INFO[boss.kind];
    assert.ok(info, `${boss.id} has engine info`);
    assert.ok(info.maxPhases >= 2, `${boss.id} has at least two phases`);
    assert.ok(info.purityShield > 0, `${boss.id} has a purity shield`);
    assert.ok(['slam', 'volley', 'ring', 'charge', 'summon', 'rain'].includes(info.pattern));
    const thresholds = info.phaseThresholds;
    thresholds.forEach((value, i) => {
      if (i > 0) assert.ok(value < thresholds[i - 1], 'thresholds descend');
    });
    assert.equal(thresholds.length, info.maxPhases - 1);
  }
});

test('every boss speaks on intro, each transition, and defeat', () => {
  for (const boss of FALLEN_BOSSES) {
    const dialogue = FALLEN_BOSS_INFO[boss.kind].dialogue;
    assert.ok(Array.isArray(dialogue.intro) && dialogue.intro.length, `${boss.id} intro`);
    assert.ok(Array.isArray(dialogue.defeat) && dialogue.defeat.length, `${boss.id} defeat`);
    for (let phase = 2; phase <= boss.phases; phase += 1) {
      assert.ok(Array.isArray(dialogue[`phase${phase}`]) && dialogue[`phase${phase}`].length, `${boss.id} phase ${phase}`);
    }
  }
});

test('bestiary uses the six engine archetypes and keeps six elites', () => {
  const ids = Object.keys(FALLEN_ENEMY_INFO);
  assert.equal(ids.length, 17);
  assert.equal(FALLEN_ELITES.length, 6);
  assert.equal(FALLEN_AMBIENT.length, 3);
  for (const id of ids) {
    const info = FALLEN_ENEMY_INFO[id];
    assert.ok(['chaser', 'lunge', 'ranged', 'slam', 'spawner', 'hopper'].includes(info.behavior));
    assert.ok(info.hp > 0 && info.dmg > 0 && info.reward > 0);
  }
});

test('default progress is empty but fully shaped', () => {
  const state = defaultFallenProgress();
  assert.equal(state.ascended, false);
  assert.equal(state.rooms.length, FALLEN_ROOM_COUNT);
  assert.ok(state.rooms.every((v) => v === false));
  assert.equal(Object.keys(state.bosses).length, 11);
  assert.equal(Object.keys(state.endings).length, 3);
  assert.deepEqual(state.upgrades, { health: 0, radiance: 0, damage: 0, weapon: 0 });
  assert.equal(state.movement, 0);
  assert.equal(fallenIsAscended({ fallen: state }), false);
});

test('sanitize repairs halls cleared out of order and drops phantom bosses', () => {
  const raw = defaultFallenProgress();
  raw.rooms[2] = true;
  raw.bosses.aurelian = true;
  const clean = sanitizeFallenProgress(raw);
  assert.equal(clean.rooms[2], false, 'hall 3 needs hall 2');
  assert.equal(clean.bosses.aurelian, false, 'boss needs all four halls');
  assert.equal(clean.rooms[4], false);
});

test('sanitize keeps earned abilities and drops unearned ones', () => {
  const raw = defaultFallenProgress();
  raw.abilities = ['halo_dash', 'feather_glide', 'absolution', 'bogus'];
  let clean = sanitizeFallenProgress(raw);
  assert.deepEqual(clean.abilities, ['absolution']);
  const state = defaultFallenProgress();
  clearHalls(state, 0);
  recordFallenBoss(state, 'aurelian');
  clean = sanitizeFallenProgress(state);
  assert.ok(clean.abilities.includes('halo_dash'));
});

test('sanitize caps echoes, clamps numbers, and gates the secret ending', () => {
  const raw = defaultFallenProgress();
  raw.echoes = FALLEN_ECHOES.map((e) => e.id).slice(0, 8).concat(['nope']);
  raw.shards = -50;
  raw.upgrades = { health: 9, radiance: -4, damage: 2, weapon: 1 };
  raw.endings.eclipse = true;
  raw.ending = 'eclipse';
  const clean = sanitizeFallenProgress(raw);
  assert.equal(clean.echoes.length, ECHO_CAP);
  assert.equal(clean.shards, 0);
  assert.deepEqual(clean.upgrades, { health: 3, radiance: 0, damage: 2, weapon: 1 });
  assert.equal(clean.endings.eclipse, false);
  assert.equal(clean.ending, null);
});

test('regions unlock only through the previous region boss', () => {
  const state = defaultFallenProgress();
  assert.equal(fallenRegionUnlocked(state, 0), true);
  assert.equal(fallenRegionUnlocked(state, 1), false);
  clearHalls(state, 0);
  assert.equal(fallenRegionUnlocked(state, 1), false, 'halls alone do not open the sky');
  recordFallenBoss(state, 'aurelian');
  assert.equal(fallenRegionUnlocked(state, 1), true);
  assert.equal(fallenRegionUnlocked(state, 2), false);
});

test('rooms and bosses unlock sequentially inside a region', () => {
  const state = defaultFallenProgress();
  const region = FALLEN_REGIONS[0];
  assert.equal(fallenRoomUnlocked(state, region.roomStart), true);
  assert.equal(fallenRoomUnlocked(state, region.roomStart + 1), false);
  recordFallenRoom(state, region.roomStart);
  assert.equal(fallenRoomUnlocked(state, region.roomStart + 1), true);
  assert.equal(fallenBossUnlocked(state, 'aurelian'), false);
  clearHalls(state, 0);
  assert.equal(fallenBossUnlocked(state, 'aurelian'), true);
  assert.equal(fallenRoomUnlocked(state, FALLEN_OPTIONAL_BOSSES[0].roomIndex), false);
  recordFallenBoss(state, 'aurelian');
  for (let i = 1; i < 6; i += 1) {
    clearHalls(state, i);
    recordFallenBoss(state, FALLEN_REGIONS[i].boss);
  }
  assert.equal(fallenBossUnlocked(state, FALLEN_OPTIONAL_BOSSES[0].id), true);
});

test('clearing a region records its room, movement, and reward once', () => {
  const state = defaultFallenProgress();
  const region = FALLEN_REGIONS[0];
  const first = recordFallenRoom(state, region.roomStart);
  assert.equal(first.ok, true);
  assert.equal(first.firstClear, true);
  assert.equal(recordFallenRoom(state, region.roomStart).firstClear, false);
  for (let slot = 1; slot < 4; slot += 1) recordFallenRoom(state, region.roomStart + slot);
  assert.ok(state.movement >= 1);
  const boss = recordFallenBoss(state, 'aurelian');
  assert.equal(boss.ok, true);
  assert.equal(boss.firstClear, true);
  assert.equal(boss.ability, 'halo_dash');
  assert.ok(state.abilities.includes('halo_dash'));
  assert.ok(state.shards > 0);
  const again = recordFallenBoss(state, 'aurelian');
  assert.equal(again.firstClear, false);
  assert.equal(again.shards, 0);
  assert.equal(state.rooms[region.bossRoom - FALLEN_ROOM_START], true);
  assert.ok(state.archive.bosses.includes('aurelian'));
});

test('boss records are rejected while the region is still locked', () => {
  const state = defaultFallenProgress();
  const result = recordFallenBoss(state, 'zephyria');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'locked');
});

test('endings require Seraphiel and Eclipse requires all four optional bosses', () => {
  const state = defaultFallenProgress();
  assert.equal(recordFallenEnding(state, 'dawn').ok, false);
  for (let i = 0; i < 7; i += 1) {
    clearHalls(state, i);
    recordFallenBoss(state, FALLEN_REGIONS[i].boss);
  }
  assert.ok(state.bosses.seraphiel);
  assert.equal(recordFallenEnding(state, 'eclipse').reason, 'optional_required');
  assert.equal(recordFallenEnding(state, 'dawn').ok, true);
  assert.equal(state.choices.struck, 1);
  assert.equal(recordFallenEnding(state, 'dusk').ok, true);
  assert.equal(state.choices.spared, 1);
  for (const boss of FALLEN_OPTIONAL_BOSSES) recordFallenBoss(state, boss.id);
  const eclipse = recordFallenEnding(state, 'eclipse');
  assert.equal(eclipse.ok, true);
  assert.equal(state.ending, 'eclipse');
  assert.equal(state.movement, FALLEN_MOVEMENTS.length - 1);
});

test('upgrades and weapons spend Shards of Halo and refuse overspend', () => {
  const state = defaultFallenProgress();
  const upgrade = FALLEN_UPGRADES[0];
  const cost = upgrade.tiers[0].cost;
  assert.equal(buyFallenUpgrade(state, upgrade.id).reason, 'shards');
  addFallenShards(state, cost);
  const bought = buyFallenUpgrade(state, upgrade.id);
  assert.equal(bought.ok, true);
  assert.equal(state.upgrades[upgrade.id], 1);
  assert.equal(state.shards, 0);
  assert.equal(buyFallenUpgrade(state, upgrade.id).reason, 'shards');
  assert.equal(buyFallenUpgrade(state, 'nope').reason, 'unknown');
  addFallenShards(state, 500);
  while (state.upgrades[upgrade.id] < upgrade.tiers.length) buyFallenUpgrade(state, upgrade.id);
  assert.equal(buyFallenUpgrade(state, upgrade.id).reason, 'maxed');
  assert.equal(equipFallenWeapon(state, 'nope').ok, false);
  assert.equal(equipFallenWeapon(state, 'blade').ok, true);
});

test('boons are unique and refused twice', () => {
  const state = defaultFallenProgress();
  assert.equal(chooseFallenBoon(state, 'nope').ok, false);
  assert.equal(chooseFallenBoon(state, FALLEN_BOONS[0].id).ok, true);
  assert.equal(chooseFallenBoon(state, FALLEN_BOONS[0].id).reason, 'owned');
});

test('echoes derive from base progress and cap at five', () => {
  assert.deepEqual(fallenEchoesFor({}), []);
  const base = { cleared: ROOMS.map((_, i) => i === 7 || i === 12) };
  const echoes = fallenEchoesFor(base);
  assert.ok(echoes.includes('echo_resolve'));
  assert.ok(echoes.includes('echo_hunters'));
  assert.ok(echoes.length <= ECHO_CAP);
  assert.ok(fallenEchoesFor(null).length === 0);
});

test('ascension requires the base final boss and is idempotent', () => {
  const progress = { cleared: ROOMS.map(() => false) };
  assert.equal(ascendProgress(progress).ok, false);
  progress.cleared[7] = true;
  const first = ascendProgress(progress);
  assert.equal(first.ok, true);
  assert.equal(first.firstTime, true);
  assert.equal(progress.fallen.ascended, true);
  assert.equal(progress.fallen.arcId, FALLEN_ARC_ID);
  assert.equal(ascendProgress(progress).firstTime, false);
  assert.equal(fallenIsAscended(progress), true);
});

test('radiance fills, never overfills, and bursts only when full', () => {
  const run = createFallenRun();
  assert.equal(blindingBurst(run).reason, 'not_full');
  radianceGain(run, 10000);
  assert.equal(radianceFull(run), true);
  assert.equal(run.radiance, run.radianceMax);
  const burst = blindingBurst(run);
  assert.equal(burst.ok, true);
  assert.ok(burst.damage > 0);
  assert.equal(run.radiance, 0);
  assert.equal(run.bursts, 1);
  assert.equal(radianceGain(null, 10).gained, 0);
});

test('judgment marks cap, detonate when still, and clear on action', () => {
  const run = createFallenRun();
  for (let i = 0; i < 9; i += 1) applyJudgment(run);
  assert.equal(run.marks, MARK_MAX);
  const tick = judgmentTick(run, 0.5, { moved: true });
  assert.equal(tick.detonated, false);
  const detonate = judgmentTick(run, 5);
  assert.equal(detonate.detonated, true);
  assert.equal(detonate.damage, MARK_MAX * MARK_DAMAGE);
  applyJudgment(run, 2);
  const cleared = judgmentTick(run, 0.1, { acted: true });
  assert.equal(cleared.cleared, true);
  assert.equal(run.marks, 0);
});

test('shadow stance drains health, boosts damage, and stays locked early', () => {
  const run = createFallenRun();
  assert.equal(toggleShadow(run).reason, 'locked');
  run.shadowUnlocked = true;
  assert.equal(toggleShadow(run).shadow, true);
  assert.equal(shadowDamageMul(run), SHADOW_DAMAGE_MUL);
  const drained = shadowTick(run, 1, run.maxHp);
  assert.ok(drained.drain > 0);
  assert.equal(toggleShadow(run).shadow, false);
  assert.equal(shadowDamageMul(run), 1);
});

test('purity damage rewards burst, parry, and shadow over raw swings', () => {
  const raw = purityDamage(100, 40, 'normal');
  const burst = purityDamage(100, 40, 'burst');
  assert.ok(burst.shield < raw.shield);
  assert.equal(purityDamage(0, 40, 'normal').damage, 40);
  assert.equal(purityDamage(10, 40, 'parry').broke, true);
});

test('run config folds upgrades, echoes, and curses into health and shards', () => {
  const state = defaultFallenProgress();
  state.upgrades.health = 2;
  state.echoes = ['echo_resolve'];
  const { region, run, shardBonus } = fallenRunConfig(state, 0);
  assert.equal(region.id, 'gilded_ruins');
  assert.equal(run.maxHp, 120 + 24 + 18);
  assert.ok(run.radianceMax >= 100);
  assert.equal(shardBonus, 1);
  assert.ok(fallenRunConfig(state, 99).region.final);
});

test('boon rolls are deterministic and unique', () => {
  const a = fallenBoonChoices(1234);
  const b = fallenBoonChoices(1234);
  assert.deepEqual(a, b);
  assert.equal(new Set(a).size, a.length);
  assert.equal(a.length, 3);
  assert.notDeepEqual(fallenBoonChoices(9999), a);
});

test('menu figure and archive react to progress', () => {
  const state = defaultFallenProgress();
  assert.equal(fallenMenuFigure(state).pose, 'kneeling');
  const region = clearHalls(state, 0);
  recordFallenBoss(state, region.boss);
  clearHalls(state, 1);
  recordFallenBoss(state, 'zephyria');
  assert.equal(fallenMenuFigure(state).pose, 'kneeling_alert');
  assert.equal(fallenSummary(state).regionsCleared, 2);
  const archive = fallenArchive(state);
  assert.equal(archive.bestiary.length, 17);
  assert.equal(archive.bosses.filter((b) => b.cleared).length, 2);
  assert.equal(archive.echoes.length, FALLEN_ECHOES.length);
});

test('menu theme and death/run counters persist', () => {
  const state = defaultFallenProgress();
  setFallenMenuTheme(state, 'base');
  assert.equal(state.menuTheme, 'base');
  setFallenMenuTheme(state, 'weird');
  assert.equal(state.menuTheme, 'heavenly');
  recordFallenDeath(state);
  recordFallenRun(state, 90, { won: true });
  recordFallenRun(state, 120, { won: true });
  assert.equal(state.deaths, 1);
  assert.equal(state.runs, 2);
  assert.equal(state.bestTime, 90);
});

test('the engine registers every fallen room, enemy, and boss', () => {
  assert.equal(ROOMS.length, 14);
  assert.equal(ALL_ROOMS.length, ALL_ROOMS.indexOf(FALLEN_ROOMS[0]) + FALLEN_ROOM_COUNT);
  assert.equal(ALL_ROOMS.at(-1).id, FALLEN_ROOM_START + FALLEN_ROOM_COUNT - 1);
  for (const room of FALLEN_ROOMS) assert.equal(ALL_ROOMS[room.id], room);
  assert.ok(ALL_ENEMY_INFO.lesser_cherub.fallen);
  assert.equal(Object.keys(ALL_BOSS_INFO).filter((k) => k.startsWith('fallen_')).length, 11);
});

test('a fallen boss spawns with a purity shield that soaks raw damage', () => {
  const game = new AshenGame();
  game.player.relic = true;
  game.enterRoom(FALLEN_REGIONS[0].bossRoom);
  const boss = game.boss;
  assert.ok(boss);
  assert.equal(boss.kind, 'fallen_aurelian');
  assert.equal(boss.purityShield, 120);
  const startHp = boss.hp;
  game.hurtBoss(100);
  assert.equal(boss.purityShield, 20);
  assert.ok(startHp - boss.hp < 30, 'raw swings barely dent the boss');
  assert.ok(game.events.some((e) => e.type === 'purityHit'));
  game.hurtBoss(100);
  assert.equal(boss.purityShield, 0);
  assert.ok(game.events.some((e) => e.type === 'purityHit' && e.broke));
  const hpBefore = boss.hp;
  game.hurtBoss(100);
  assert.ok(hpBefore - boss.hp >= 100, 'broken shield lets full damage through');
});

test('fallen hall rooms spawn their listed enemies in the real engine', () => {
  const game = new AshenGame();
  game.enterRoom(FALLEN_REGIONS[0].roomStart + 1);
  const room = FALLEN_ROOM_BY_ID[FALLEN_REGIONS[0].roomStart + 1];
  assert.equal(game.roomIndex, room.id);
  assert.ok(game.enemies.length > 0);
  game.enemies.forEach((e) => assert.ok(ALL_ENEMY_INFO[e.type]?.fallen));
});
