import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_ROOMS,
  ALL_BOSS_INFO,
  ALL_ENEMY_INFO,
  AshenGame,
} from '../src/core.js';
import {
  RIFT_ROOM_START,
  RIFT_ROOM_COUNT,
  RIFT_REGIONS,
  RIFT_ROOMS,
  RIFT_ENEMY_INFO,
  RIFT_BOSS_INFO,
  defaultRiftProgress,
  sanitizeRiftProgress,
  riftUnlocked,
  recordRiftRoom,
  recordRiftBoss,
  riftSummary,
  validateRiftRooms,
} from '../src/rift.js';

test('Arc IV The Rift appends 27 playable rooms (874–900), 8 enemies, and 6 bosses cleanly', () => {
  assert.equal(RIFT_ROOM_START, 874);
  assert.equal(RIFT_ROOM_COUNT, 27);
  assert.equal(RIFT_REGIONS.length, 5);
  assert.equal(Object.keys(RIFT_ENEMY_INFO).length, 8);
  assert.equal(Object.keys(RIFT_BOSS_INFO).length, 6);
  assert.equal(RIFT_ROOMS.length, 27);
  assert.equal(ALL_ROOMS.length, 931);
  assert.equal(ALL_ROOMS[874].id, 874);
  assert.equal(ALL_ROOMS[900].id, 900);
  assert.equal(ALL_ROOMS[900].secret, true);
  for (const key of Object.keys(RIFT_ENEMY_INFO)) {
    assert.ok(ALL_ENEMY_INFO[key], `missing Rift enemy ${key}`);
  }
  for (const key of Object.keys(RIFT_BOSS_INFO)) {
    assert.ok(ALL_BOSS_INFO[key], `missing Rift boss ${key}`);
  }
  const check = validateRiftRooms();
  assert.equal(check.ok, true, check.errors.join('\n'));
});

test('Dual-Reality Fracture alternates platforms and Phase-Shift shatters veils', () => {
  const game = new AshenGame();
  game.loadRoom(874, true);
  assert.equal(game.fracturePhase, 0);
  const platA = game.room.platforms.find((p) => p.reality === 'a');
  const platB = game.room.platforms.find((p) => p.reality === 'b');
  assert.ok(platA && platB);
  assert.equal(game.isPlatformActive(platA), true);
  assert.equal(game.isPlatformActive(platB), false);

  // Place a veiled enemy near the player and trigger Phase-Shift
  const veiled = game.enemies[0];
  veiled.veil = true;
  veiled.x = game.player.x + 40;
  veiled.y = game.player.y;
  const shifted = game.phaseShift();
  assert.equal(shifted, true);
  assert.equal(game.fracturePhase, 1);
  assert.equal(game.isPlatformActive(platA), false);
  assert.equal(game.isPlatformActive(platB), true);
  assert.equal(veiled.veil, false, 'Phase-Shift shockwave breaks nearby Rift Veil');

  // Cooldown blocks immediate second shift unless forced
  assert.equal(game.phaseShift(), false);

  // Auto-flip triggers after fractureInterval (8s)
  game.fractureTimer = 7.98;
  game.update(0.05, {});
  assert.equal(game.fracturePhase, 0);
});

test('Oath Resonance scales D -> ASHEN, boosts speed & damage, and drops on hit', () => {
  const game = new AshenGame();
  game.loadRoom(0, true);
  assert.equal(game.resonanceRank, 'D');
  assert.equal(game.resonanceDamageMult(), 1);
  assert.equal(game.resonanceSpeedMult(), 1);

  // Two hits reach Rank C+ and activate scaling
  game.gainResonance(20, 'hit');
  assert.equal(game.resonanceRank, 'C');
  assert.ok(game.resonanceDamageMult() > 1);
  assert.ok(game.resonanceSpeedMult() > 1);

  game.gainResonance(80, 'bossHit');
  assert.equal(game.resonanceRank, 'ASHEN');
  assert.ok(Math.abs(game.resonanceDamageMult() - 1.3) < 1e-6);
  assert.ok(Math.abs(game.resonanceSpeedMult() - 1.12) < 1e-6);

  game.dropResonance(40);
  assert.equal(game.resonanceRank, 'A');
});

test('Rift progress unlocks from Crusade Paladin / victory and sanitizes safely', () => {
  assert.equal(riftUnlocked({}), false);
  assert.equal(riftUnlocked({ crusade: { bosses: { paladin: true } } }), true);
  assert.equal(riftUnlocked({ victory: true }), true);

  let rift = defaultRiftProgress();
  rift = recordRiftRoom({ rift }, 899);
  rift = recordRiftBoss({ rift }, 'rift_devilish_scum');
  const clean = sanitizeRiftProgress({ ...rift, roomsCleared: { 899: true, 9999: true }, bestResonance: 'FAKE' });
  assert.equal(clean.unlocked, true);
  assert.equal(clean.cleared, true);
  assert.equal(clean.secretsFound[899], true);
  assert.equal(clean.roomsCleared[9999], undefined);
  assert.equal(clean.bestResonance, 'D');

  const summary = riftSummary({ rift: clean });
  assert.equal(summary.rooms, 1);
  assert.equal(summary.bosses, 1);
  assert.equal(summary.secrets, 1);
  assert.equal(summary.totalRooms, 27);
  assert.equal(summary.totalBosses, 6);
});
