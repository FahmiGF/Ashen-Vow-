// Phase 2 Release 2 — Overdrive Lv 201–300 playable ladder.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OVERDRIVE_ROOMS,
  OVERDRIVE_LEVEL_COUNT,
  OVERDRIVE_ROOMS_PER_CHAPTER,
  OVERDRIVE_ENEMIES_PER_ROOM,
  OVERDRIVE_GLOBAL_START,
  OVERDRIVE_ENEMY_INFO,
  OVERDRIVE_BOSS_INFO,
  OVERDRIVE_CHAPTER_META,
  validateOverdriveRooms,
  overdriveLevelScale,
  overdriveDamageScale,
  overdriveSpeedScale,
  overdrivePlayerScale,
  overdriveVitalityScale,
  overdriveFlaskBonus,
  overdriveAshStipend,
  overdriveRoomForIndex,
  overdriveIndexForRoom,
  overdriveRoomForLevel,
  overdriveCampaignUnlocked,
  overdriveLevelUnlocked,
  overdriveLevelCleared,
  overdriveChapterProgress,
  overdriveCampaignSummary,
  overdriveSpellFor,
  recordOverdriveLevel,
  recordOverdriveRun,
  defaultOverdriveLadderState,
  sanitizeOverdriveLadderProgress,
} from '../src/overdrive_ladder.js';
import { ALL_ROOMS, ALL_BOSS_INFO, ALL_ENEMY_INFO, AshenGame } from '../src/core.js';
import { TRACKS } from '../src/music.js';
import { ZONES } from '../src/zones.js';

const roomById = (id) => ALL_ROOMS.find((room) => room?.id === id);

test('Overdrive appends 100 rooms (774–873) cleanly after Infinite Frontiers', () => {
  assert.equal(OVERDRIVE_ROOMS.length, OVERDRIVE_LEVEL_COUNT);
  assert.equal(OVERDRIVE_LEVEL_COUNT, 100);
  assert.equal(OVERDRIVE_GLOBAL_START, 774);
  OVERDRIVE_ROOMS.forEach((room, i) => {
    assert.equal(room.id, 774 + i);
    assert.equal(room.overdriveLevel, 201 + i);
    assert.equal(room.overdriveIndex, i);
    assert.equal(room.zone, 'overdrive');
    assert.ok(room.palette.glow);
    assert.ok(room.particle);
  });
  assert.equal(roomById(773).boss, 'aethron_origin', 'Frontiers ends at room 773');
  assert.equal(ALL_ROOMS.length, 874);
  assert.equal(ALL_ROOMS.at(-1).id, 873);
  assert.equal(ALL_ROOMS.at(-1).boss, 'the_first_god');
  assert.ok(ZONES.overdrive);
  assert.ok(TRACKS.overdrive && TRACKS.overdriveBoss);
});

test('validateOverdriveRooms accepts all 100 rooms and all 10 chapter bosses', () => {
  assert.deepEqual(validateOverdriveRooms(), []);
  assert.equal(Object.keys(OVERDRIVE_ENEMY_INFO).length, 50);
  assert.equal(Object.keys(OVERDRIVE_BOSS_INFO).length, 10);
  for (const id of Object.keys(OVERDRIVE_ENEMY_INFO)) {
    assert.equal(ALL_ENEMY_INFO[id], OVERDRIVE_ENEMY_INFO[id]);
  }
  for (const id of Object.keys(OVERDRIVE_BOSS_INFO)) {
    assert.equal(ALL_BOSS_INFO[id], OVERDRIVE_BOSS_INFO[id]);
  }
});

test('every standard Overdrive room enforces the 20-body 4-archetype contract', () => {
  const standard = OVERDRIVE_ROOMS.filter((r) => !r.boss);
  assert.equal(standard.length, 90);
  for (const room of standard) {
    assert.equal(room.enemies.length, OVERDRIVE_ENEMIES_PER_ROOM);
    assert.equal(room.enemies.filter((e) => e.elite).length, 1);
    const behaviors = new Set(room.enemies.filter((e) => !e.elite).map((e) => OVERDRIVE_ENEMY_INFO[e.type]?.behavior));
    assert.deepEqual([...behaviors].sort(), ['chaser', 'lunge', 'ranged', 'slam']);
    assert.ok(room.variant && room.variantName);
  }
  assert.equal(OVERDRIVE_CHAPTER_META.length, 10);
});

test('scaling, sequential unlock, legendary drops, and sanitizer hold', () => {
  assert.ok(overdriveLevelScale(99) > overdriveLevelScale(0));
  assert.ok(overdriveDamageScale(99) > overdriveDamageScale(0));
  assert.ok(overdriveSpeedScale(99) >= overdriveSpeedScale(0));
  assert.ok(overdrivePlayerScale(99) > overdrivePlayerScale(0));
  assert.ok(overdriveVitalityScale(99) > overdriveVitalityScale(0));
  assert.ok(overdriveFlaskBonus(99) > overdriveFlaskBonus(0));
  assert.ok(overdriveAshStipend(99) > overdriveAshStipend(0));

  assert.equal(overdriveCampaignUnlocked({}), false);
  assert.equal(overdriveCampaignUnlocked({ frontiers: { levels: Array.from({ length: 100 }, (_, i) => i === 99) } }), true);

  const state = defaultOverdriveLadderState();
  assert.equal(overdriveLevelUnlocked(state, 0), true);
  assert.equal(overdriveLevelUnlocked(state, 1), false);
  assert.equal(recordOverdriveLevel(state, 1).ok, false);
  for (let i = 0; i < 10; i += 1) {
    const res = recordOverdriveLevel(state, i);
    assert.equal(res.ok, true);
    if (i === 9) {
      assert.equal(res.bossFirstClear, true);
      assert.ok(res.unlockedLegendary);
    }
  }
  assert.equal(overdriveLevelCleared(state, 9), true);
  assert.equal(overdriveChapterProgress(state, 21).bossCleared, true);
  assert.equal(overdriveCampaignSummary(state).legendariesCount, 1);

  recordOverdriveRun(state, 42.5, false);
  const forged = sanitizeOverdriveLadderProgress({
    levels: Array.from({ length: 100 }, (_, i) => i === 0 || i === 15),
    bosses: [true, true],
    legendaryWeaponsFound: ['worldbreaker', 'fake_weapon'],
    equippedLegendary: 'fake_weapon',
    runs: -5,
  });
  assert.equal(forged.levels[0], true);
  assert.equal(forged.levels[15], false);
  assert.equal(forged.bosses[0], false);
  assert.equal(forged.equippedLegendary, null);
  assert.deepEqual(forged.legendaryWeaponsFound, ['worldbreaker']);
  assert.equal(forged.runs, 0);
});

test('Overdrive rooms, [Q] spell casting, Sunken Emperor, and The First God run live in AshenGame', () => {
  const g = new AshenGame();
  g.reset();
  const r201 = overdriveRoomForLevel(201);
  assert.equal(overdriveIndexForRoom(r201.id), 0);
  assert.equal(overdriveRoomForIndex(0).id, 774);
  g.enterRoom(r201.id);
  assert.equal(g.enemies.length, 20);
  const { school, spell } = overdriveSpellFor('storm', 0);
  const cast = g.castOverdriveSpell(spell, school.color);
  assert.equal(cast.ok, true);
  assert.ok(cast.mana < 100);

  const gBoss1 = new AshenGame();
  gBoss1.reset();
  gBoss1.enterRoom(overdriveRoomForIndex(9).id);
  assert.equal(gBoss1.boss.kind, 'sunken_emperor');
  assert.equal(gBoss1.boss.maxPhases, 3);

  const gFinal = new AshenGame();
  gFinal.reset();
  gFinal.enterRoom(overdriveRoomForIndex(99).id);
  assert.equal(gFinal.boss.kind, 'the_first_god');
  assert.equal(gFinal.boss.maxPhases, 5);
  gFinal.hurtBoss(999999, 0, 1, false);
  for (let i = 0; i < 40; i += 1) gFinal.update(0.1, {});
  assert.equal(gFinal.state, 'victory');
});
