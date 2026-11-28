// BAB X — The Lanternwake. Pure structure/progression plus live-core checks for
// the four halls (20 enemies each) and the four-phase Wickbearer.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LANTERN_ROOMS,
  LANTERN_ROOM_START,
  LANTERN_STAGE_COUNT,
  LANTERN_HALL_COUNT,
  LANTERN_ENEMIES_PER_HALL,
  LANTERN_STAGE_META,
  LANTERN_ENEMY_INFO,
  LANTERN_BOSS_INFO,
  validateLanternRooms,
  defaultLanternProgress,
  sanitizeLanternProgress,
  lanternwakeUnlocked,
  lanternStageUnlocked,
  lanternStageCleared,
  lanternStageForRoom,
  lanternRoomForStage,
  recordLanternStage,
  recordLanternBoss,
  recordLanternRun,
  lanternSummary,
} from '../src/lanternwake.js';
import { ALL_ROOMS, ALL_BOSS_INFO, ALL_ENEMY_INFO, AshenGame } from '../src/core.js';

const roomById = (id) => ALL_ROOMS.find((room) => room?.id === id);

test('the chapter is appended after the cistern without moving any room', () => {
  assert.equal(LANTERN_ROOMS.length, 5);
  assert.equal(LANTERN_STAGE_COUNT, 5);
  assert.equal(LANTERN_HALL_COUNT, 4);
  LANTERN_ROOMS.forEach((room, i) => assert.equal(room.id, LANTERN_ROOM_START + i));
  assert.equal(roomById(668).name, 'Gua Surut', 'the cistern still ends at 668');
  assert.equal(ALL_ROOMS.length, 931, 'Frontiers, Overdrive, Arc IV Rift and Unwritten Expanse follow the Lanternwake');
  assert.equal(roomById(673).lanternwake, true, 'the Lanternwake still owns 669-673');
  assert.equal(roomById(674).frontier, true, 'the next table entry is a Frontier room');
  for (const room of LANTERN_ROOMS) {
    assert.equal(room.zone, 'lanternwake');
    assert.ok(room.palette.glow && room.particle === 'embers');
    assert.ok(room.platforms.length >= 4);
  }
});

test('the structure validator accepts the authored rooms', () => {
  assert.deepEqual(validateLanternRooms(), []);
});

test('every hall keeps the 20-enemy contract: 19 normal bodies and one elite', () => {
  const halls = LANTERN_ROOMS.filter((room) => !room.boss);
  assert.equal(halls.length, LANTERN_HALL_COUNT);
  for (const hall of halls) {
    assert.equal(hall.enemies.length, LANTERN_ENEMIES_PER_HALL, `hall ${hall.id} body count`);
    const elites = hall.enemies.filter((enemy) => enemy.elite || LANTERN_ENEMY_INFO[enemy.type]?.elite);
    assert.equal(elites.length, 1, `hall ${hall.id} has exactly one elite`);
    assert.equal(elites[0].type, 'wickbearer_acolyte');
    const archetypes = new Set(hall.enemies.map((enemy) => LANTERN_ENEMY_INFO[enemy.type]?.behavior));
    assert.deepEqual([...archetypes].sort(), ['chaser', 'lunge', 'ranged', 'slam']);
    for (const enemy of hall.enemies) {
      assert.ok(enemy.minX < enemy.x && enemy.x < enemy.maxX, `${enemy.type} patrol is valid`);
    }
    const meta = LANTERN_STAGE_META.find((stage) => stage.roomId === hall.id);
    assert.equal(meta.enemies, 20);
    assert.equal(meta.elites, 1);
  }
});

test('new enemies ride real engine archetypes and expose codex data', () => {
  assert.equal(Object.keys(LANTERN_ENEMY_INFO).length, 5);
  for (const [type, info] of Object.entries(LANTERN_ENEMY_INFO)) {
    assert.equal(ALL_ENEMY_INFO[type], info);
    assert.ok(info.hp > 0 && info.dmg > 0 && info.reward >= 1);
    assert.ok(info.name && info.title && info.desc && info.where);
  }
});

test('the main route walks 669 -> 673 and the victory boss opens no gate', () => {
  for (let id = 669; id <= 671; id += 1) {
    const room = roomById(id);
    assert.equal(room.gate.requires, 'clear');
    assert.equal(room.gate.next, id + 1);
  }
  const bossRoom = roomById(673);
  assert.equal(bossRoom.boss, 'wickbearer');
  assert.equal(bossRoom.gate, null);
  assert.deepEqual(bossRoom.enemies, []);
  assert.equal(LANTERN_BOSS_INFO.wickbearer.reward, 'victory');
});

test('Orsella has four descending phases and full dialogue', () => {
  const boss = ALL_BOSS_INFO.wickbearer;
  assert.equal(boss.maxPhases, 4);
  assert.equal(boss.phaseThresholds.length, 3);
  assert.deepEqual(boss.phaseThresholds, [0.75, 0.5, 0.25]);
  for (let i = 1; i < boss.phaseThresholds.length; i += 1) {
    assert.ok(boss.phaseThresholds[i] < boss.phaseThresholds[i - 1]);
  }
  for (const key of ['intro', 'phase2', 'phase3', 'phase4', 'defeat']) {
    assert.ok(Array.isArray(boss.dialogue[key]) && boss.dialogue[key].length > 0, `${key} dialogue`);
    for (const line of boss.dialogue[key]) assert.ok(line.speaker && line.text);
  }
  assert.equal(boss.behaviorKind, 'tidebound');
  assert.equal(boss.summonType, 'wick_moth');
});

test('the wake opens only after Vasska falls', () => {
  const cleared = Array.from({ length: 14 }, () => false);
  cleared[7] = true;
  assert.equal(lanternwakeUnlocked(null), false);
  assert.equal(lanternwakeUnlocked({ cleared }), false, 'a campaign clear alone is not enough');
  assert.equal(lanternwakeUnlocked({ cleared, cistern: { boss: false } }), false);
  assert.equal(lanternwakeUnlocked({ cleared, cistern: { boss: true } }), true);
  const withoutCampaign = { cleared: [], cistern: { boss: true } };
  assert.equal(lanternwakeUnlocked(withoutCampaign), false);
});

test('halls unlock in order and the altar needs all four', () => {
  const p = defaultLanternProgress();
  assert.equal(lanternStageUnlocked(p, 0), true);
  assert.equal(lanternStageUnlocked(p, 1), false);
  assert.equal(recordLanternStage(p, 2).ok, false, 'cannot skip ahead');
  for (let i = 0; i < LANTERN_HALL_COUNT; i += 1) {
    assert.equal(lanternStageUnlocked(p, i), true);
    assert.equal(recordLanternStage(p, i).ok, true);
    assert.equal(lanternStageCleared(p, i), true);
  }
  assert.equal(lanternStageUnlocked(p, LANTERN_HALL_COUNT), true);
  assert.equal(lanternStageCleared(p, LANTERN_HALL_COUNT), false);
  assert.equal(recordLanternBoss(p).ok, true);
  assert.equal(lanternStageCleared(p, LANTERN_HALL_COUNT), true);
  assert.equal(lanternSummary(p).stagesCleared, 5);
  assert.equal(lanternSummary(p).percent, 100);
});

test('the sanitizer repairs skipped halls and forged boss clears', () => {
  const repaired = sanitizeLanternProgress({ halls: [true, false, true, false], boss: true, runs: -9, bestTime: 'x' });
  assert.deepEqual(repaired.halls, [true, false, false, false]);
  assert.equal(repaired.boss, false);
  assert.equal(repaired.runs, 0);
  assert.equal(repaired.bestTime, 0);
  assert.equal(sanitizeLanternProgress(null).halls.length, LANTERN_HALL_COUNT);
  assert.deepEqual(sanitizeLanternProgress({}).discovered, [true, false, false, false, false]);
});

test('lookup helpers and run bookkeeping behave', () => {
  const stage = lanternStageForRoom(671);
  assert.equal(stage.local, 2);
  assert.equal(stage.room.name, 'Aula Abu');
  assert.equal(lanternStageForRoom(999), null);
  assert.equal(lanternRoomForStage(4).boss, 'wickbearer');
  assert.equal(lanternRoomForStage(9), null);
  const p = defaultLanternProgress();
  recordLanternRun(p, 120.4);
  recordLanternRun(p, 88.25);
  recordLanternRun(p, 99);
  assert.equal(p.runs, 3);
  assert.equal(p.bestTime, 88.3);
  assert.equal(p.lastTime, 99);
});

test('live core: every hall spawns its twenty bodies and exactly one elite', () => {
  for (let id = 669; id <= 672; id += 1) {
    const game = new AshenGame({});
    game.loadRoom(id);
    assert.equal(game.roomIndex, id);
    assert.equal(game.enemies.length, 20, `room ${id} spawn count`);
    const elites = game.enemies.filter((enemy) => enemy.type === 'wickbearer_acolyte');
    assert.equal(elites.length, 1, `room ${id} elite count`);
    for (const enemy of game.enemies) {
      assert.equal(enemy.dead, false);
      assert.ok(enemy.ai, 'enemy has an engine archetype');
      assert.ok(enemy.y < 471, 'enemy sits on or above the floor');
    }
  }
});

test('live core: Orsella reaches four phases, summons wick moths and ends in victory', () => {
  const game = new AshenGame({});
  game.loadRoom(673);
  const boss = game.boss;
  assert.equal(boss.kind, 'wickbearer');
  assert.equal(boss.maxPhases, 4);
  assert.ok(boss.maxHp >= LANTERN_BOSS_INFO.wickbearer.maxHp);

  let guard = 0;
  while (game.boss && !game.boss.dying && game.boss.phase < 4 && guard++ < 120) {
    game.hurtBoss(140, 90, 1, false);
    game.update(1 / 120, {});
  }
  assert.equal(game.boss.phase, 4);
  const phases = game.events.filter((event) => event.type === 'bossPhase').map((event) => event.phase);
  assert.deepEqual(phases, [2, 3, 4]);
  assert.ok(game.enemies.some((enemy) => enemy.type === 'wick_moth'), 'phases summon the chapter body');

  game.boss.hp = 1;
  for (let i = 0; i < 900 && game.state !== 'victory'; i += 1) {
    if (game.boss && !game.boss.dying) game.hurtBoss(400, 90, 1, false);
    game.update(1 / 120, {});
  }
  assert.equal(game.state, 'victory');
  const down = game.events.find((event) => event.type === 'bossDown');
  assert.equal(down.kind, 'wickbearer');
  assert.equal(down.reward, 'victory');
});
