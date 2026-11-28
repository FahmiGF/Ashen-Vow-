import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_ROOMS,
  ALL_BOSS_INFO,
  ALL_ENEMY_INFO,
  AshenGame,
} from '../src/core.js';
import {
  UNWRITTEN_ROOM_START,
  UNWRITTEN_ROOM_COUNT,
  UNWRITTEN_CHAPTERS,
  UNWRITTEN_SIGILS,
  UNWRITTEN_ENEMY_INFO,
  UNWRITTEN_BOSS_INFO,
  UNWRITTEN_ROOMS,
  defaultUnwrittenProgress,
  sanitizeUnwrittenProgress,
  unwrittenUnlocked,
  recordUnwrittenRoom,
  recordUnwrittenBoss,
  equipUnwrittenSigil,
  unwrittenSummary,
  validateUnwrittenRooms,
} from '../src/unwritten.js';

test('The Unwritten Expanse appends 30 rooms (901–930), 6 enemies, and 4 bosses cleanly', () => {
  assert.equal(UNWRITTEN_ROOM_START, 901);
  assert.equal(UNWRITTEN_ROOM_COUNT, 30);
  assert.equal(UNWRITTEN_CHAPTERS.length, 3);
  assert.equal(UNWRITTEN_SIGILS.length, 4);
  assert.equal(Object.keys(UNWRITTEN_ENEMY_INFO).length, 6);
  assert.equal(Object.keys(UNWRITTEN_BOSS_INFO).length, 4);
  assert.equal(UNWRITTEN_ROOMS.length, 30);
  assert.equal(ALL_ROOMS.length, 931);
  assert.equal(ALL_ROOMS[901].id, 901);
  assert.equal(ALL_ROOMS[930].id, 930);
  assert.equal(ALL_ROOMS[930].boss, 'unwritten_blank_author');
  for (const key of Object.keys(UNWRITTEN_ENEMY_INFO)) {
    assert.ok(ALL_ENEMY_INFO[key], `missing enemy ${key}`);
  }
  for (const key of Object.keys(UNWRITTEN_BOSS_INFO)) {
    assert.ok(ALL_BOSS_INFO[key], `missing boss ${key}`);
  }
  const check = validateUnwrittenRooms();
  assert.equal(check.ok, true, check.errors.join('\n'));
});

test('Oath Sigils scale with Resonance and Ink Severance [G] hits enemies in range', () => {
  const game = new AshenGame();
  game.loadRoom(901, true);
  game.state = 'playing';

  // Requires B+ (35+) Resonance unless forced
  assert.equal(game.inkSeverance().ok, false);
  game.gainResonance(40, 'hit');
  assert.equal(game.resonanceRank, 'B');

  assert.equal(game.setOathSigil('authors_vow'), true);
  const foe = game.enemies[0];
  foe.x = game.player.x + 50;
  foe.y = game.player.y;
  const hpBefore = foe.hp;
  const res = game.inkSeverance();
  assert.equal(res.ok, true);
  assert.ok(res.hits >= 1);
  assert.ok(foe.hp < hpBefore);
  assert.ok(game.inkSeveranceCooldown > 0);
});

test('Unwritten progress unlocks after Rift/Astral/victory and sanitizes sigils', () => {
  assert.equal(unwrittenUnlocked({}), false);
  assert.equal(unwrittenUnlocked({ rift: { cleared: true } }), true);
  assert.equal(unwrittenUnlocked({ astral: { bosses: { astral_architect_of_eternity: true } } }), true);

  let st = defaultUnwrittenProgress();
  st = recordUnwrittenRoom({ unwritten: st }, 905);
  st = recordUnwrittenBoss({ unwritten: st }, 'unwritten_scribe');
  st = equipUnwrittenSigil({ unwritten: st }, 'scorched_ink');
  assert.equal(st.equippedSigil, 'scorched_ink');

  const clean = sanitizeUnwrittenProgress({ ...st, roomsCleared: { 905: true, 9999: true }, equippedSigil: 'fake' });
  assert.equal(clean.roomsCleared[905], true);
  assert.equal(clean.roomsCleared[9999], undefined);
  assert.equal(clean.equippedSigil, 'blank_page');

  const sum = unwrittenSummary({ unwritten: clean });
  assert.equal(sum.rooms, 1);
  assert.equal(sum.bosses, 1);
  assert.equal(sum.totalRooms, 30);
  assert.equal(sum.totalBosses, 4);
});
