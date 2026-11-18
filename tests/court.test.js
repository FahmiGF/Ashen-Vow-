import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AshenGame,
  ALL_ROOMS,
  ALL_ENEMY_INFO,
  ALL_BOSS_INFO,
  WEAPONS,
  FLOOR_Y,
} from '../src/core.js';
import {
  COURT_VERSION,
  COURT_ROOM_START,
  COURT_ROOM_COUNT,
  COURT_ROOMS_PER_ZONE,
  COURT_ZONES,
  COURT_ZONE_BY_ID,
  COURT_ROOMS,
  COURT_ROOM_BY_ID,
  COURT_BOSS_INFO,
  COURT_ENEMY_INFO,
  COURT_WEAPONS,
  COURT_TOOLS,
  COURT_TOOL_BY_ID,
  HOUSE_ROOMS,
  HOUSE_FURNISHINGS,
  HOUSE_FURNISHING_BY_ID,
  HOUSE_RESIDENTS,
  HOUSE_RESIDENT_BY_ID,
  GIFT_COST,
  COURT_TRIALS,
  COURT_TRIAL_BY_ID,
  COURT_NG_PLUS_MAX,
  COURT_ECONOMY,
  courtMarksForRoom,
  courtTrialUnlocked,
  setCourtNgPlus,
  recordCourtTrial,
  defaultCourtProgress,
  sanitizeCourtProgress,
  validateCourtRooms,
  courtZoneForRoom,
  courtLevelUnlocked,
  courtLevelStatus,
  courtZoneCleared,
  courtStats,
  courtBonuses,
  resetCourtCaches,
  applyCourtLoadout,
  recordCourtClear,
  upgradeHouseRoom,
  buyFurnishing,
  buyCourtWeapon,
  equipCourtWeapon,
  buyCourtTool,
  equipCourtTool,
  houseWarmth,
  residentUnlocked,
  talkToResident,
  giftResident,
  advanceResidentQuests,
} from '../src/court.js';
import { TRACKS } from '../src/music.js';
import { ZONES, zoneForRoom } from '../src/zones.js';
import { ATLAS_ENEMY_INFO, ATLAS_BOSS_INFO } from '../src/atlas.js';
import { PACK_BOSS_INFO } from '../src/bosspack.js';

const step = (g, seconds, input = {}) => {
  const frames = Math.ceil(seconds * 120);
  for (let i = 0; i < frames; i++) g.update(1 / 120, input);
};

test('court defines 6 zones, 60 rooms, 24 enemies, 12 bosses, 8 weapons and 12 tools', () => {
  assert.equal(COURT_VERSION, '0.8.0');
  assert.equal(COURT_ROOM_START, 354);
  assert.equal(COURT_ROOM_COUNT, 60);
  assert.equal(COURT_ZONES.length, 6);
  assert.equal(COURT_ROOMS.length, 60);
  assert.equal(Object.keys(COURT_ENEMY_INFO).length, 24);
  assert.equal(Object.keys(COURT_BOSS_INFO).length, 12);
  assert.equal(COURT_WEAPONS.length, 8);
  assert.equal(COURT_TOOLS.length, 12);
  assert.equal(HOUSE_ROOMS.length, 6);
  assert.equal(HOUSE_FURNISHINGS.length, 24);
  assert.equal(HOUSE_RESIDENTS.length, 8);
  assert.equal(ALL_ROOMS.length, 14 + 100 + 240 + 60 + 12 + 59 + 20 + 20);
  assert.equal(ALL_ROOMS[COURT_ROOM_START], COURT_ROOMS[0]);
  assert.equal(ALL_ROOMS[COURT_ROOM_START + 59], COURT_ROOMS[59]);
  assert.equal(Object.keys(ALL_ENEMY_INFO).length, 7 + 100 + Object.keys(ATLAS_ENEMY_INFO).length + 24 + 10 + 32 + 21 + 5);
  assert.equal(
    Object.keys(ALL_BOSS_INFO).length,
    6 + 30 + Object.keys(ATLAS_BOSS_INFO).length + 12 + Object.keys(PACK_BOSS_INFO).length + 2 + 15 + 5 + 5,
  );
  for (const weapon of COURT_WEAPONS) {
    assert.ok(WEAPONS[weapon.id], `${weapon.id} must be exposed by core`);
    assert.ok(COURT_WEAPON_PROFILE(weapon.id), `${weapon.id} needs an attack profile`);
  }
});

function COURT_WEAPON_PROFILE(id) {
  return COURT_WEAPONS.find((weapon) => weapon.id === id);
}

test('every court room has a valid floor, spawn, gate and boss reference', () => {
  const report = validateCourtRooms();
  assert.equal(report.ok, true, report.errors.join('; '));
  for (let i = 0; i < COURT_ROOMS.length; i++) {
    const room = COURT_ROOMS[i];
    assert.equal(room.id, COURT_ROOM_START + i);
    assert.equal(room.courtLocal, i % COURT_ROOMS_PER_ZONE);
    assert.ok(room.platforms.some((platform) => platform.y >= FLOOR_Y - 2));
    assert.equal(room.spawn.y, FLOOR_Y - 46);
    if (i % COURT_ROOMS_PER_ZONE === COURT_ROOMS_PER_ZONE - 1) {
      assert.ok(room.boss);
      if (room.courtZoneIndex === COURT_ZONES.length - 1) assert.equal(room.gate, null);
      else assert.equal(room.gate.next, room.id + 1, 'boss rooms must lead into the next zone');
    } else {
      assert.equal(room.gate.next, room.id + 1);
      assert.ok(COURT_ROOM_BY_ID[room.gate.next]);
    }
    if (room.courtTemplate === 'puzzle') assert.ok(room.relic);
  }
  for (const zone of COURT_ZONES) {
    assert.equal(courtZoneForRoom(zone.roomStart).id, zone.id);
    assert.ok(COURT_ROOM_BY_ID[zone.roomStart + 9].boss);
  }
});

test('court bosses expose valid phases, patterns and full dialogue', () => {
  const patterns = new Set(['slam', 'volley', 'ring', 'charge', 'summon', 'rain']);
  for (const boss of Object.values(COURT_BOSS_INFO)) {
    assert.ok(boss.maxPhases >= 2);
    assert.ok(patterns.has(boss.pattern), `${boss.kind} pattern`);
    assert.equal(boss.phaseThresholds.length, boss.maxPhases - 1);
    for (let i = 1; i < boss.phaseThresholds.length; i++) {
      assert.ok(boss.phaseThresholds[i] <= boss.phaseThresholds[i - 1]);
    }
    assert.ok(boss.dialogue.intro.length > 0, `${boss.kind} intro`);
    assert.ok(boss.dialogue.phase2.length > 0, `${boss.kind} phase2`);
    assert.ok(boss.dialogue.defeat.length > 0, `${boss.kind} defeat`);
    if (boss.maxPhases >= 3) assert.ok(boss.dialogue.phase3.length > 0, `${boss.kind} phase3`);
    if (boss.maxPhases >= 4) assert.ok(boss.dialogue.phase4.length > 0, `${boss.kind} phase4`);
  }
  const final = COURT_BOSS_INFO.court_boss_firstvow;
  assert.equal(final.reward, 'victory');
  assert.equal(final.courtZone, 'reliquary');
  assert.equal(COURT_BOSS_INFO.court_boss_lastwatch.reward, 'blessing');
  assert.equal(COURT_BOSS_INFO.court_boss_nameless.reward, 'blessing');
  assert.equal(COURT_BOSS_INFO.court_boss_hearthmother.summonType, 'ember_thrall');
  assert.equal(COURT_BOSS_INFO.court_boss_forgeking.summonType, 'soot_artisan');
  assert.equal(COURT_ENEMY_INFO.bloom_mother.childType, 'glass_hopper');
});

test('court zones plug into zone lookup and the procedural music engine', () => {
  assert.equal(Object.keys(ZONES).filter((id) => COURT_ZONE_BY_ID[id]).length, 6);
  for (const zone of COURT_ZONES) {
    assert.ok(TRACKS[zone.music], `${zone.id} music`);
    assert.ok(TRACKS[zone.bossMusic], `${zone.id} boss music`);
    assert.equal(zoneForRoom(zone.roomStart).id, zone.id);
    assert.equal(zoneForRoom(zone.roomStart).music, zone.music);
  }
  assert.ok(TRACKS.hearth, 'house theme');
  assert.ok(TRACKS.courtBoss, 'shared court boss theme');
});

test('core spawns court enemies and runs court bosses through the phase loop', () => {
  const g = new AshenGame();
  const enemy = g.spawnEnemy({ type: 'court_shade', x: 400, minX: 40, maxX: 1300 });
  assert.equal(enemy.ai, 'crawler');
  assert.equal(enemy.expansion, true);
  assert.ok(enemy.maxHp > 0);
  assert.equal(enemy.color, '#b28fd8', 'renderer needs a court accent colour');
  assert.equal(enemy.chapter, 3);
  const spawner = g.spawnEnemy({ type: 'bloom_mother', x: 700, minX: 40, maxX: 1300 });
  assert.equal(spawner.childType, 'glass_hopper');

  g.spawnBoss('court_boss_nameless');
  assert.equal(g.boss.name, 'The Nameless Sovereign');
  assert.equal(g.boss.maxPhases, 4);
  assert.equal(g.boss.color, '#e0c8ff');
  g.boss.intro = 0;
  g.damageBoss(g.boss.maxHp * 0.3);
  assert.equal(g.boss.phase, 2);
  g.boss.invuln = 0;
  g.damageBoss(g.boss.maxHp * 0.2);
  assert.equal(g.boss.phase, 3);
  g.boss.invuln = 0;
  g.damageBoss(g.boss.maxHp * 0.3);
  assert.equal(g.boss.phase, 4);
  assert.ok(g.events.some((event) => event.type === 'bossDialogue' && event.phase === 'phase4'));
});

test('court melee weapons use their own combos and on-hit riders', () => {
  const g = new AshenGame();
  g.enterRoom(COURT_ROOMS[1].id);
  const p = g.player;
  const enemy = g.enemies[0];
  p.weapons.push('greataxe', 'oathblade', 'warhammer');
  p.weapon = 'greataxe';
  p.attack = null;
  enemy.x = p.x + 20;
  enemy.y = p.y;
  enemy.hp = 500;
  enemy.maxHp = 500;
  assert.equal(g.startAttack(), true);
  assert.equal(p.attack.def.dmg, 34);
  p.attack.t = p.attack.def.windup + 0.001;
  g.updatePlayerAttack(0.001);
  assert.ok(enemy.hp < 500, 'greataxe must damage an adjacent enemy');

  // Lifesteal heals on a landed hit.
  p.weapon = 'oathblade';
  p.attack = null;
  p.hp = 40;
  enemy.x = p.x + 20;
  enemy.y = p.y;
  enemy.hp = 500;
  assert.equal(g.startAttack(), true);
  p.attack.t = p.attack.def.windup + 0.001;
  g.updatePlayerAttack(0.001);
  assert.ok(p.hp > 40, 'oathblade lifesteal');

  // Warhammer emits shockwaves once per landed swing.
  g.projectiles.length = 0;
  p.weapon = 'warhammer';
  p.attack = null;
  enemy.x = p.x + 20;
  enemy.y = p.y;
  enemy.hp = 500;
  assert.equal(g.startAttack(), true);
  p.attack.t = p.attack.def.windup + 0.001;
  g.updatePlayerAttack(0.001);
  assert.ok(g.projectiles.some((projectile) => projectile.type === 'shockwave'));
});

test('court ranged weapons fire projectiles and respect arrow ammo', () => {
  const g = new AshenGame();
  const p = g.player;
  p.weapons.push('crossbow', 'emberwand');
  p.weapon = 'crossbow';
  p.arrows = 2;
  p.attack = null;
  assert.equal(g.startAttack(), true);
  p.attack.t = 0.201;
  g.updatePlayerAttack(0.001);
  assert.equal(p.arrows, 1);
  assert.ok(g.projectiles.some((projectile) => projectile.type === 'bolt'));

  p.arrows = 0;
  p.attack = null;
  assert.equal(g.startAttack(), false, 'crossbow must refuse to fire without arrows');

  p.weapon = 'emberwand';
  p.attack = null;
  assert.equal(g.startAttack(), true, 'wand does not consume arrows');
  p.attack.t = 0.261;
  g.updatePlayerAttack(0.001);
  assert.ok(g.projectiles.some((projectile) => projectile.type === 'ember'));
});

test('house upgrades and furnishings stack into cached run bonuses', () => {
  resetCourtCaches();
  const p = defaultCourtProgress();
  p.marks = 10000;
  const base = courtBonuses(p);
  assert.equal(base.maxHp, 0);
  assert.equal(courtBonuses(p), base, 'unchanged progress reuses the cached object');

  assert.equal(upgradeHouseRoom(p, 'hall').ok, true);
  const one = courtBonuses(p);
  assert.notEqual(one, base);
  assert.equal(one.maxHp, 8);

  assert.equal(upgradeHouseRoom(p, 'chapel').ok, true);
  assert.equal(courtBonuses(p).flasks, 0, 'chapel grants a flask every two levels');
  assert.equal(upgradeHouseRoom(p, 'chapel').ok, true);
  assert.equal(courtBonuses(p).flasks, 1);

  assert.equal(upgradeHouseRoom(p, 'forge').ok, true);
  assert.equal(courtBonuses(p).damage, 0.05);

  const furnishing = buyFurnishing(p, 'long_table');
  assert.equal(furnishing.ok, true);
  assert.equal(houseWarmth(p), HOUSE_FURNISHING_BY_ID.long_table.warmth);
  assert.equal(buyFurnishing(p, 'long_table').ok, false, 'furnishings cannot be bought twice');
  assert.equal(buyFurnishing(p, 'ash_rug').ok, true);
  assert.equal(houseWarmth(p), 3);
});

test('house rooms gate furnishings and respect max levels', () => {
  const p = defaultCourtProgress();
  p.marks = 10000;
  assert.equal(buyFurnishing(p, 'long_table').reason, 'room');
  for (let i = 0; i < HOUSE_ROOMS[0].maxLevel; i++) assert.equal(upgradeHouseRoom(p, 'hall').ok, true);
  assert.equal(upgradeHouseRoom(p, 'hall').reason, 'max');
  assert.equal(buyFurnishing(p, 'long_table').ok, true);
});

test('tools equip by slot, replace the previous tool and add their bonus', () => {
  resetCourtCaches();
  const p = defaultCourtProgress();
  p.marks = 10000;
  for (const id of ['vow_charm', 'iron_ring', 'oath_pebble', 'ember_boots']) {
    assert.equal(buyCourtTool(p, id).ok, true);
  }
  assert.equal(equipCourtTool(p, 'vow_charm').ok, true);
  assert.equal(courtBonuses(p).flasks, 1);
  assert.equal(equipCourtTool(p, 'iron_ring').equipped, true);
  assert.equal(courtBonuses(p).maxHp, 10);
  const swap = equipCourtTool(p, 'oath_pebble');
  assert.equal(swap.replaced, 'iron_ring');
  assert.deepEqual(p.equippedTools, ['vow_charm', 'oath_pebble']);
  assert.equal(courtBonuses(p).damage, 0.04);
  assert.equal(equipCourtTool(p, 'vow_charm').equipped, false, 'clicking an equipped tool removes it');
});

test('court weapons are bought and equipped from the forge', () => {
  const p = defaultCourtProgress();
  p.marks = 10000;
  assert.equal(buyCourtWeapon(p, 'greataxe').ok, true);
  assert.equal(buyCourtWeapon(p, 'greataxe').ok, false);
  assert.equal(equipCourtWeapon(p, 'greataxe').ok, true);
  assert.equal(p.equippedWeapon, 'greataxe');
  assert.equal(equipCourtWeapon(p, 'oathblade').ok, false, 'cannot equip an unowned weapon');
  assert.equal(equipCourtWeapon(p, 'sword').ok, true);
});

test('resident dialogue unlocks by progress and gifting raises affinity', () => {
  const p = defaultCourtProgress();
  p.marks = 1000;
  assert.equal(talkToResident(p, 'mara', 1).ok, true);
  assert.ok(p.residents.mara.met);
  assert.equal(talkToResident(p, 'saul', 1).ok, false, 'Saul needs six clears');
  p.stats.clears = 6;
  assert.equal(residentUnlocked(p, 'saul'), true);
  assert.equal(talkToResident(p, 'saul', 2).ok, true);

  const before = p.marks;
  const gift = giftResident(p, 'mara');
  assert.equal(gift.ok, true);
  assert.equal(p.marks, before - GIFT_COST);
  assert.equal(p.residents.mara.affinity, 10);
  assert.equal(gift.tier, 'low');

  p.marks = 0;
  assert.equal(giftResident(p, 'mara').reason, 'marks');
  assert.equal(giftResident(p, 'nobody').ok, false);
});

test('resident quests count targets, advance on events and pay their reward', () => {
  const p = defaultCourtProgress();
  p.marks = 1000;
  // Mara: 2 clears -> 1 boss -> 1 gift.
  assert.equal(recordCourtClear(p, 0).firstClear, true);
  assert.equal(p.residents.mara.questStep, 0, 'one of two clears is not enough');
  recordCourtClear(p, 1);
  assert.equal(p.residents.mara.questStep, 1);
  recordCourtClear(p, 9, { boss: true, kind: 'court_boss_hearthmother' });
  assert.equal(p.residents.mara.questStep, 2);
  const gift = giftResident(p, 'mara');
  assert.equal(gift.ok, true);
  assert.equal(p.residents.mara.questDone, true);
  assert.ok(p.tools.includes('hearth_stone'), 'quest reward tool is granted');
  assert.ok(gift.quest.some((entry) => entry.residentId === 'mara'));
});

test('court clears are idempotent, unlock zones and finish the pack', () => {
  const p = defaultCourtProgress();
  const first = recordCourtClear(p, 0);
  assert.equal(first.firstClear, true);
  assert.ok(first.marks > 0);
  const marks = p.marks;
  const again = recordCourtClear(p, 0);
  assert.equal(again.firstClear, false);
  assert.equal(p.marks, marks);

  assert.equal(courtLevelUnlocked(p, 0), true);
  assert.equal(courtLevelUnlocked(p, 1), true, 'clearing room 1 unlocks room 2');
  assert.equal(courtLevelUnlocked(p, 2), false);
  assert.equal(courtLevelUnlocked(p, 10), false, 'zone 2 needs zone 1 boss');

  recordCourtClear(p, 9, { boss: true, kind: 'court_boss_hearthmother' });
  assert.ok(p.zoneUnlocked.includes('glassorchard'));
  assert.equal(courtLevelUnlocked(p, 10), true);
  assert.equal(courtZoneCleared(p, 'hearthfall'), 2);
  assert.equal(courtLevelStatus(p, 0), 'cleared');
  assert.equal(courtLevelStatus(p, 10), 'available');

  recordCourtClear(p, 59, { boss: true, kind: 'court_boss_firstvow' });
  assert.equal(p.completion, true);
  assert.ok(courtStats(p).completion);
});

test('court trials unlock by progression and NG+ is gated behind completion', () => {
  assert.equal(COURT_TRIALS.length, 2);
  for (const trial of COURT_TRIALS) {
    assert.equal(trial.start, trial.order[0]);
    assert.equal(trial.end, trial.order[trial.order.length - 1]);
    for (const local of trial.order) assert.ok(COURT_ROOMS[local], `${trial.id} room ${local} must exist`);
    assert.ok(COURT_ROOMS[trial.end]?.boss, `${trial.id} must end on a boss room`);
  }
  assert.equal(COURT_TRIAL_BY_ID.boss_rush.order.length, 12);
  assert.equal(COURT_TRIAL_BY_ID.boss_rush.reward, 950);
  assert.equal(COURT_TRIAL_BY_ID.boss_rush.requires, 'completion');
  assert.equal(COURT_TRIAL_BY_ID.glass_gauntlet.requires, 'glassorchard');

  const p = defaultCourtProgress();
  assert.equal(courtTrialUnlocked(p, 'boss_rush'), false);
  assert.equal(courtTrialUnlocked(p, 'glass_gauntlet'), false);
  recordCourtClear(p, 9, { boss: true, kind: 'court_boss_hearthmother' });
  assert.equal(courtTrialUnlocked(p, 'glass_gauntlet'), true);
  assert.equal(courtTrialUnlocked(p, 'boss_rush'), false);
  assert.equal(setCourtNgPlus(p, 3).reason, 'locked');

  p.completion = true;
  assert.equal(courtTrialUnlocked(p, 'boss_rush'), true);
  assert.equal(setCourtNgPlus(p, 3).ngPlus, 3);
  assert.equal(setCourtNgPlus(p, 99).ngPlus, COURT_NG_PLUS_MAX);
  assert.equal(setCourtNgPlus(p, -5).ngPlus, 0);
});

test('court trials record times and marks without clearing campaign rooms', () => {
  const p = defaultCourtProgress();
  p.completion = true;
  assert.equal(setCourtNgPlus(p, 2).ngPlus, 2);
  const first = recordCourtTrial(p, 'boss_rush', 83.44, { ngPlus: 2 });
  assert.equal(first.ok, true);
  assert.equal(first.firstClear, true);
  assert.equal(first.isBest, true);
  assert.equal(first.time, 83.4);
  assert.equal(first.marks, 1030, '950 base + 2 NG+ tiers');
  assert.equal(p.stats.trialClears, 1);
  assert.equal(p.cleared.filter(Boolean).length, 0, 'a trial must not mark campaign rooms cleared');

  const faster = recordCourtTrial(p, 'boss_rush', 70.2, { ngPlus: 2 });
  assert.equal(faster.firstClear, false);
  assert.equal(faster.isBest, true);
  assert.equal(faster.marks, 238, 'repeat clears pay a quarter reward');
  assert.equal(faster.bestTime, 70.2);

  const slower = recordCourtTrial(p, 'boss_rush', 90, { ngPlus: 2 });
  assert.equal(slower.isBest, false);
  assert.equal(slower.bestTime, 70.2);
  assert.equal(p.trials.boss_rush.clears, 3);

  const saved = sanitizeCourtProgress(JSON.parse(JSON.stringify(p)));
  assert.equal(saved.ngPlus, 2);
  assert.equal(saved.trials.boss_rush.bestTime, 70.2);
  assert.equal(saved.trials.boss_rush.clears, 3);
  assert.equal(saved.stats.trialClears, 3, 'sanitizer keeps the trial counter it was given');
});

test('court NG+ scales spawned enemies and bosses through applyCourtLoadout', () => {
  resetCourtCaches();
  const p = defaultCourtProgress();
  p.completion = true;
  const g0 = new AshenGame();
  applyCourtLoadout(p, g0);
  g0.enterRoom(COURT_ROOMS[1].id);
  const enemyHp0 = g0.enemies[0].maxHp;
  g0.enterRoom(COURT_ROOMS[9].id);
  const bossHp0 = g0.boss.maxHp;

  setCourtNgPlus(p, 4);
  const g4 = new AshenGame();
  applyCourtLoadout(p, g4);
  assert.equal(g4.ngPlus, 4);
  g4.enterRoom(COURT_ROOMS[1].id);
  assert.ok(g4.enemies[0].maxHp > enemyHp0, 'NG+ must scale court enemies');
  g4.enterRoom(COURT_ROOMS[9].id);
  assert.ok(g4.boss.maxHp > bossHp0, 'NG+ must scale court bosses');
});

test('save sanitizer clamps values, filters unknown ids and keeps extra fields', () => {
  const raw = {
    marks: -50,
    cleared: Array.from({ length: 50 }, (_, i) => i === 0),
    unlocked: 999,
    zoneUnlocked: ['hearthfall', 'glassorchard', 'nope', 'glassorchard'],
    weapons: ['greataxe', 'nope', 'greataxe'],
    tools: ['vow_charm', 'ember_boots'],
    equippedWeapon: 'greataxe',
    equippedTools: ['vow_charm', 'iron_ring', 'ember_boots'],
    house: {
      rooms: { hall: 99, forge: -3 },
      furnishings: ['long_table', 'nope', 'long_table'],
    },
    residents: { mara: { affinity: 999, questStep: 99, questCount: -4, questDone: true } },
    bossKills: { court_boss_nameless: 2, nope: 9 },
    stats: { clears: -2, bossKills: 3 },
    flags: { met_hollis: true },
    futureField: 'keep-me',
  };
  const p = sanitizeCourtProgress(raw);
  assert.equal(p.marks, 0);
  assert.equal(p.unlocked, 60);
  assert.deepEqual(p.zoneUnlocked, ['hearthfall', 'glassorchard']);
  assert.deepEqual(p.weapons, ['greataxe']);
  assert.deepEqual(p.tools, ['vow_charm', 'ember_boots']);
  assert.deepEqual(p.equippedTools, ['vow_charm', 'ember_boots']);
  assert.equal(p.house.rooms.hall, 3);
  assert.equal(p.house.rooms.forge, 0);
  assert.deepEqual(p.house.furnishings, ['long_table']);
  assert.equal(p.residents.mara.affinity, 100);
  assert.equal(p.residents.mara.questStep, 3);
  assert.equal(p.residents.mara.questCount, 0);
  assert.deepEqual(p.bossKills, { court_boss_nameless: 2 });
  assert.equal(p.stats.clears, 0);
  assert.equal(p.stats.bossKills, 3);
  assert.deepEqual(p.flags, { met_hollis: true });
  assert.equal(p.ngPlus, 0, 'NG+ stays locked without completion');
  assert.deepEqual(p.trials.boss_rush, { clears: 0, bestTime: 0 });
  assert.equal(p.futureField, 'keep-me');
  assert.equal(sanitizeCourtProgress(null).marks, 0);
});

test('applyCourtLoadout grants owned weapons and applies house/tool bonuses', () => {
  resetCourtCaches();
  const p = defaultCourtProgress();
  p.marks = 10000;
  upgradeHouseRoom(p, 'hall');
  upgradeHouseRoom(p, 'hall');
  upgradeHouseRoom(p, 'chapel');
  upgradeHouseRoom(p, 'chapel');
  buyCourtWeapon(p, 'greataxe');
  equipCourtWeapon(p, 'greataxe');
  buyCourtTool(p, 'vow_charm');
  equipCourtTool(p, 'vow_charm');
  const g = new AshenGame();
  const bonus = applyCourtLoadout(p, g);
  assert.equal(bonus.maxHp, 16);
  assert.equal(bonus.flasks, 2);
  assert.equal(g.player.maxHp, 116);
  assert.equal(g.player.maxFlasks, 5);
  assert.equal(g.player.weapon, 'greataxe');
  assert.ok(g.player.weapons.includes('greataxe'));
  assert.ok(g.player.weapons.includes('sword'));
});

test('court mark pacing stays between grind and sprint thresholds', () => {
  const firstFour = [0, 1, 2, 3].reduce((sum, index) => sum + courtMarksForRoom(index), 0);
  assert.ok(firstFour >= 60, 'the cheapest tool must be reachable within four rooms');
  const firstSix = [0, 1, 2, 3, 4, 5].reduce((sum, index) => sum + courtMarksForRoom(index), 0);
  assert.ok(firstSix >= 80, 'the cheapest weapon must be reachable within six rooms');

  let campaign = 0;
  for (let zone = 0; zone < COURT_ZONES.length; zone++) {
    for (let local = 0; local < COURT_ROOMS_PER_ZONE; local++) {
      const index = zone * COURT_ROOMS_PER_ZONE + local;
      campaign += courtMarksForRoom(index);
    }
    campaign += COURT_ECONOMY.miniBossBonus + COURT_ECONOMY.bossBonus + COURT_ECONOMY.zoneClearBonus;
  }
  const gearCost = COURT_TOOLS.reduce((sum, tool) => sum + tool.cost, 0)
    + COURT_WEAPONS.reduce((sum, weapon) => sum + weapon.cost, 0);
  assert.ok(campaign >= gearCost, 'a full clear must fund every weapon and tool');
  assert.ok(campaign < gearCost + HOUSE_ROOMS.reduce((sum, room) => sum + room.costs[room.costs.length - 1], 0) + 1200,
    'a single clear must not also buy the entire house without trials or NG+');
  assert.ok(courtMarksForRoom(59) > courtMarksForRoom(0), 'marks scale across the pack');
  assert.equal(courtMarksForRoom(9, { boss: true, zoneClear: true }), courtMarksForRoom(9) + COURT_ECONOMY.bossBonus + COURT_ECONOMY.zoneClearBonus);
});

test('each court boss gate opens after the blessing and enters the next zone', () => {
  for (const room of [9, 19, 29, 39, 49]) {
    const g = new AshenGame();
    g.enterRoom(COURT_ROOMS[room].id);
    assert.equal(g.gates[0]?.open, false, 'the boss gate starts sealed');
    g.boss.invuln = 0;
    g.boss.hp = 0;
    g.finishBoss();
    assert.equal(g.state, 'blessing');
    g.chooseBlessing(0);
    assert.equal(g.gates[0]?.open, true, 'the gate opens after the blessing');
    step(g, 0.7);
    g.player.x = 1362;
    g.player.y = 380;
    step(g, 0.25);
    assert.equal(g.roomIndex, COURT_ROOMS[room].id + 1, `room ${room} must enter the next zone`);
  }
  const g = new AshenGame();
  g.enterRoom(COURT_ROOMS[59].id);
  g.boss.invuln = 0;
  g.boss.hp = 0;
  g.finishBoss();
  assert.equal(g.state, 'victory');
});

test('court rooms can be entered and cleared through the real simulation', () => {
  const g = new AshenGame();
  const combat = COURT_ROOMS[2];
  g.enterRoom(combat.id);
  assert.equal(g.roomIndex, combat.id);
  assert.ok(g.enemies.length > 0);
  for (const enemy of g.enemies) g.hurtEnemy(enemy, { dmg: 99999, knock: 0, name: 'test' }, 1);
  step(g, 0.1);
  assert.equal(g.enemies.length, 0);
  assert.equal(g.gates[0].open, true, 'clear gate opens when the room is empty');
  assert.equal(g.state, 'playing');
});
