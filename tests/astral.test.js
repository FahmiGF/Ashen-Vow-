import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ASTRAL_ARC_NUMBER,
  ASTRAL_BOSSES,
  ASTRAL_BOSS_INFO,
  ASTRAL_ENEMY_INFO,
  ASTRAL_REGIONS,
  ASTRAL_ROOMS,
  ASTRAL_ROOM_START,
  astralRoomUnlocked,
  astralSummary,
  defaultAstralProgress,
  recordAstralBoss,
  recordAstralRoom,
  sanitizeAstralProgress,
  validateAstralRooms,
} from '../src/astral.js';
import { ALL_BOSS_INFO, ALL_ENEMY_INFO, ALL_ROOMS, ROOMS } from '../src/core.js';

test('Arc VI registers five regions and twenty rooms after Arc V', () => {
  assert.equal(ASTRAL_ARC_NUMBER, 6);
  assert.equal(ASTRAL_REGIONS.length, 5);
  assert.equal(ASTRAL_ROOMS.length, 20);
  assert.equal(ASTRAL_ROOMS[0].id, ASTRAL_ROOM_START);
  assert.equal(ASTRAL_ROOMS.at(-1).id, ASTRAL_ROOM_START + 19);
  assert.equal(ROOMS.length, 14);
  assert.equal(ALL_ROOMS.length, 662);
  assert.deepEqual(ALL_ROOMS.slice(ASTRAL_ROOM_START, ASTRAL_ROOM_START + ASTRAL_ROOMS.length), ASTRAL_ROOMS);
  const report = validateAstralRooms();
  assert.equal(report.ok, true, report.errors.join('\n'));
  for (let i = 0; i < 15; i += 1) {
    const room = ASTRAL_ROOMS[i];
    if (room.astralBoss) continue;
    assert.equal(room.enemies.length, 20);
    const types = new Set(room.enemies.map((enemy) => enemy.type));
    assert.equal(types.size, 5);
    assert.equal(room.enemies.filter((enemy) => ASTRAL_ENEMY_INFO[enemy.type].elite).length, 1);
  }
  assert.equal(Object.keys(ASTRAL_ENEMY_INFO).length, 5);
  assert.equal(Object.keys(ALL_ENEMY_INFO).filter((id) => ASTRAL_ENEMY_INFO[id]).length, 5);
  for (const [id, enemy] of Object.entries(ASTRAL_ENEMY_INFO)) assert.equal(ALL_ENEMY_INFO[id], enemy);
});

test('the Architect of Eternity is the four-phase final boss', () => {
  const final = ASTRAL_BOSSES.find((boss) => boss.final);
  assert.ok(final);
  assert.equal(final.id, 'architect_of_eternity');
  assert.equal(final.phases, 4);
  assert.equal(ASTRAL_BOSS_INFO[final.kind].reward, 'victory');
  assert.equal(Object.keys(ASTRAL_BOSS_INFO).length, 5);
  assert.equal(ALL_BOSS_INFO[final.kind].maxPhases, 4);
  for (const boss of ASTRAL_BOSSES) {
    const info = ASTRAL_BOSS_INFO[boss.kind];
    assert.ok(info.dialogue.intro.length > 0);
    assert.ok(info.dialogue.defeat.length > 0);
    for (let phase = 2; phase <= boss.phases; phase += 1) assert.ok(info.dialogue[`phase${phase}`].length > 0);
    assert.ok(ALL_BOSS_INFO[boss.kind]);
  }
});

test('Astral progression unlocks halls and bosses in order', () => {
  const state = defaultAstralProgress();
  state.unlocked = true;
  assert.equal(astralRoomUnlocked(state, 505), true);
  assert.equal(astralRoomUnlocked(state, 506), false);
  const first = recordAstralRoom(state, 505);
  assert.equal(first.firstClear, true);
  assert.equal(astralRoomUnlocked(state, 506), true);
  recordAstralRoom(state, 506);
  recordAstralRoom(state, 507);
  const boss = recordAstralBoss(state, 'star_eaten_sentinel');
  assert.equal(boss.ok, true);
  assert.equal(state.regions[0], true);
  assert.equal(astralRoomUnlocked(state, 509), true);
  const summary = astralSummary(state);
  assert.equal(summary.roomsCleared, 4);
  assert.equal(summary.bossesCleared, 1);
  assert.equal(summary.regionsCleared, 1);
  assert.equal(summary.unwrittenExpanse.locked, true);
});

test('Astral save data is sanitized and preserves earned progress', () => {
  const raw = {
    arcId: 'astral',
    unlocked: true,
    rooms: Array.from({ length: 20 }, (_, i) => i < 9),
    bosses: { star_eaten_sentinel: true, nebula_harvester: true },
    core: true,
    sovereign: true,
    archive: { enemies: ['starbound_wraith', 'fake_enemy'], bosses: ['star_eaten_sentinel', 'fake_boss'] },
    unknown: 'kept',
  };
  const safe = sanitizeAstralProgress(raw);
  assert.equal(safe.unlocked, true);
  assert.equal(safe.arcId, 'astral');
  assert.equal(safe.rooms.length, 20);
  assert.equal(safe.archive.enemies.length, 1);
  assert.equal(safe.archive.bosses.length, 1);
  assert.equal(safe.cleared, false, 'core cannot imply campaign completion without the final boss');
  assert.equal(safe.core, false);
  assert.equal(safe.sovereign, false);
  assert.equal(safe.unwrittenExpanse.locked, true);
  assert.equal('unknown' in safe, false);
});
