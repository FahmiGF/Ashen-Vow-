// Tidewrought Cistern (BAB IX) — deterministic Node tests.
// Pure data/progression plus live-core checks for the new rooms, secret walls,
// enemies and the three-phase tide regent.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CISTERN_ROOMS,
  CISTERN_ROOM_START,
  CISTERN_ROOMS as ROOMS_SOURCE,
  CISTERN_STAGE_COUNT,
  CISTERN_HALL_COUNT,
  CISTERN_SECRET_IDS,
  CISTERN_STAGE_META,
  CISTERN_ENEMY_INFO,
  CISTERN_BOSS_INFO,
  CISTERN_BOSS_INFO as BOSSES,
  validateCisternRooms,
  defaultCisternProgress,
  sanitizeCisternProgress,
  cisternUnlocked,
  cisternStageUnlocked,
  cisternStageCleared,
  cisternStageForRoom,
  cisternRoomForStage,
  cisternSecretCount,
  recordCisternStage,
  recordCisternSecret,
  recordCisternBoss,
  recordCisternRun,
  cisternSummary,
} from '../src/cistern.js';
import { ALL_ROOMS, ALL_BOSS_INFO, ALL_ENEMY_INFO, AshenGame } from '../src/core.js';

const roomById = (id) => ALL_ROOMS.find((room) => room?.id === id);

test('cistern rooms are contiguous and appended after every existing arc', () => {
  assert.equal(CISTERN_ROOMS.length, 7);
  assert.equal(CISTERN_STAGE_COUNT, 5);
  assert.equal(CISTERN_HALL_COUNT, 4);
  CISTERN_ROOMS.forEach((room, i) => assert.equal(room.id, CISTERN_ROOM_START + i));
  assert.equal(roomById(661).name.startsWith('Godfall'), true, 'the previous last room is untouched');
  assert.equal(ALL_ROOMS.length, 874, 'BAB X, Frontiers and Overdrive append after the cistern');
  assert.equal(ALL_ROOMS.at(-1).id, 873, 'Overdrive closes the table');
  assert.equal(roomById(668).cistern, true, 'the cistern block itself is untouched');
  for (const room of CISTERN_ROOMS) {
    assert.equal(room.zone, 'cistern');
    assert.ok(room.platforms.length >= 1);
    assert.equal(room.enemies.every((e) => CISTERN_ENEMY_INFO[e.type]), true);
  }
});

test('structure validator accepts the authored rooms', () => {
  assert.deepEqual(validateCisternRooms(), []);
  assert.deepEqual(validateCisternRooms(CISTERN_ROOMS.map((room) => ({ ...room, enemies: [] }))), []);
});

test('the main route walks 662 -> 666 and the victory boss opens no gate', () => {
  const chain = [662, 663, 664, 665];
  for (const id of chain) {
    const room = roomById(id);
    const east = (room.gates || [room.gate]).find((gate) => gate.x > 1000);
    assert.ok(east, `room ${id} has an east gate`);
    assert.equal(east.requires, 'clear');
    assert.equal(roomById(east.next).id, id + 1);
  }
  const bossRoom = roomById(666);
  assert.equal(bossRoom.boss, 'tidebound');
  assert.equal(bossRoom.gate, null);
  assert.equal(bossRoom.gates, undefined);
  assert.equal(BOSSES.tidebound.reward, 'victory');
});

test('secret rooms are only reachable through a breakable wall', () => {
  assert.deepEqual(CISTERN_SECRET_IDS, ['alcove', 'lowcave']);
  const inbound = new Map();
  for (const room of CISTERN_ROOMS) {
    for (const gate of room.gates || (room.gate ? [room.gate] : [])) {
      const list = inbound.get(gate.next) || [];
      list.push({ from: room.id, gate });
      inbound.set(gate.next, list);
    }
  }
  for (const secret of CISTERN_ROOMS.filter((room) => room.secret)) {
    const entries = inbound.get(secret.id) || [];
    assert.ok(entries.length >= 1, `${secret.name} has an entrance`);
    for (const entry of entries) {
      assert.equal(entry.gate.requires, 'wall', `${secret.name} only opens after a wall breaks`);
      assert.equal(entry.gate.secret, true);
      assert.ok(roomById(entry.from).secretWall, `room ${entry.from} can actually be broken`);
    }
    assert.equal(secret.secret, true);
    assert.ok(secret.platforms.length >= 2);
  }
  assert.equal(roomById(662).secretWall.next, 668);
  assert.equal(roomById(663).secretWall.next, 667);
});

test('new enemies ride the seven engine archetypes', () => {
  const allowed = new Set(['chaser', 'lunge', 'ranged', 'slam', 'burrower', 'spawner', 'hopper']);
  const types = Object.keys(CISTERN_ENEMY_INFO);
  assert.equal(types.length, 4);
  for (const [type, info] of Object.entries(CISTERN_ENEMY_INFO)) {
    assert.equal(ALL_ENEMY_INFO[type], info);
    assert.ok(allowed.has(info.behavior), `${type} uses a real behaviour`);
    assert.ok(info.hp > 0 && info.dmg > 0 && info.reward >= 1);
    assert.ok(info.name && info.title && info.desc);
  }
});

test('the tide regent has three descending phases and full dialogue', () => {
  const boss = BOSSES.tidebound;
  assert.equal(boss.maxPhases, 3);
  assert.equal(boss.phaseThresholds.length, 2);
  assert.ok(boss.phaseThresholds[0] > boss.phaseThresholds[1]);
  assert.ok(boss.phaseThresholds[0] < 1);
  for (const key of ['intro', 'phase2', 'phase3', 'defeat']) {
    assert.ok(Array.isArray(boss.dialogue[key]) && boss.dialogue[key].length > 0, `${key} dialogue`);
    for (const line of boss.dialogue[key]) assert.ok(line.speaker && line.text);
  }
  assert.equal(ALL_BOSS_INFO.tidebound, boss);
});

test('chapter unlock follows The Oathbreaker', () => {
  assert.equal(cisternUnlocked({ cleared: [false, false, false, false, false, false, false, false] }), false);
  assert.equal(cisternUnlocked({ cleared: [] }), false);
  assert.equal(cisternUnlocked(null), false);
  const cleared = Array.from({ length: 14 }, () => false);
  cleared[7] = true;
  assert.equal(cisternUnlocked({ cleared }), true);
});

test('stage unlocks are sequential and the altar needs all four halls', () => {
  const p = defaultCisternProgress();
  assert.equal(cisternStageUnlocked(p, 0), true);
  assert.equal(cisternStageUnlocked(p, 1), false);
  assert.equal(recordCisternStage(p, 1).ok, false, 'cannot skip a hall');
  for (let i = 0; i < CISTERN_HALL_COUNT; i += 1) {
    assert.equal(cisternStageUnlocked(p, i), true);
    assert.equal(recordCisternStage(p, i).ok, true);
    assert.equal(cisternStageCleared(p, i), true);
  }
  assert.equal(cisternStageUnlocked(p, 4), true, 'boss altar opens after four halls');
  assert.equal(cisternStageUnlocked(p, 5), false, 'secret rooms never join the chain');
  assert.equal(recordCisternBoss(p).ok, true);
  assert.equal(cisternStageCleared(p, 4), true);
  assert.equal(cisternSummary(p).stagesCleared, 5);
});

test('the sanitizer repairs impossible saves', () => {
  const repaired = sanitizeCisternProgress({ halls: [true, false, true, false], boss: true, secrets: { alcove: 'yes' } });
  assert.deepEqual(repaired.halls, [true, false, false, false]);
  assert.equal(repaired.boss, false, 'a skipped hall also drops the boss clear');
  assert.equal(repaired.secrets.alcove, false);
  assert.equal(repaired.secrets.lowcave, false);

  assert.equal(sanitizeCisternProgress(null).halls.length, CISTERN_HALL_COUNT);
  assert.deepEqual(sanitizeCisternProgress({}).discovered, [true, false, false, false, false, false, false]);
  const junk = sanitizeCisternProgress({ halls: 'nope', runs: -4, bestTime: 'x', discovered: [1, 1] });
  assert.equal(junk.runs, 0);
  assert.equal(junk.bestTime, 0);
  assert.equal(junk.discovered[0], true);
  assert.equal(junk.discovered[1], false);
});

test('secrets are recorded once and revealed only when found', () => {
  const p = defaultCisternProgress();
  const first = recordCisternSecret(p, 'alcove');
  assert.equal(first.firstFind, true);
  assert.equal(first.allFound, false);
  assert.equal(p.discovered[5], true);
  assert.equal(p.discovered[6], false);
  assert.equal(recordCisternSecret(p, 'alcove').firstFind, false);
  assert.equal(cisternStageUnlocked(p, 5), true);
  assert.equal(cisternSecretCount(p), 1);
  const second = recordCisternSecret(p, 'lowcave');
  assert.equal(second.allFound, true);
  assert.equal(recordCisternSecret(p, 'unknown').ok, false);
  const summary = cisternSummary(p);
  assert.equal(summary.secretsFound, 2);
  assert.equal(summary.complete, false);
  assert.equal(summary.percent, 29);
});

test('run bookkeeping keeps the fastest clear', () => {
  const p = defaultCisternProgress();
  recordCisternRun(p, 84.4);
  recordCisternRun(p, 121.9);
  recordCisternRun(p, 61.2);
  assert.equal(p.runs, 3);
  assert.equal(p.bestTime, 61.2);
  assert.equal(p.lastTime, 61.2);
});

test('stage lookup helpers map both ways', () => {
  const stage = cisternStageForRoom(664);
  assert.equal(stage.local, 2);
  assert.equal(stage.room.name, 'Ruang Katup');
  assert.equal(stage.secret, false);
  assert.equal(cisternStageForRoom(1), null);
  assert.equal(cisternStageForRoom(668).secret, true);
  assert.equal(cisternRoomForStage(4).boss, 'tidebound');
  assert.equal(cisternRoomForStage(99), null);
  assert.equal(CISTERN_STAGE_META.length, CISTERN_ROOMS.length);
  assert.equal(ROOMS_SOURCE[0].name, 'Ambang Pasang');
});

test('live core: secret wall breaks and the west gate enters the spelean room', () => {
  const game = new AshenGame({});
  game.loadRoom(662);
  assert.equal(game.roomIndex, 662);
  assert.equal(game.activeWall().name, 'Dinding Pasang');
  for (let i = 0; i < 8; i += 1) game.damageWall(20);
  assert.equal(game.brokenWalls[662], true);
  game.player.x = 24;
  game.player.y = 400;
  for (let i = 0; i < 180 && game.roomIndex === 662; i += 1) game.update(1 / 120, { left: true });
  assert.equal(game.roomIndex, 668);
  assert.equal(game.room.name, 'Gua Surut');
  assert.ok(game.enemies.length >= 2);
});

test('live core: the tide regent reaches all three phases and ends in victory', () => {
  const game = new AshenGame({});
  game.loadRoom(666);
  const boss = game.boss;
  assert.equal(boss.kind, 'tidebound');
  assert.equal(boss.maxPhases, 3);
  assert.equal(boss.maxHp, 860);

  const seen = new Set();
  for (let i = 0; i < 900; i += 1) {
    game.update(1 / 120, {});
    if (game.boss) seen.add(game.boss.state);
  }
  assert.ok(seen.size >= 2, `boss cycles states (${[...seen].join(',')})`);

  let guard = 0;
  while (game.boss && !game.boss.dying && game.boss.phase < 3 && guard++ < 80) {
    game.hurtBoss(150, 90, 1, false);
    game.update(1 / 120, {});
  }
  assert.equal(game.boss.phase, 3);
  const events = () => game.events.map((ev) => ev.type);
  assert.ok(events().includes('bossPhase'));
  assert.ok(game.enemies.some((enemy) => enemy.type === 'drowned_thrall'), 'phase summons thralls');

  game.boss.phase = 3;
  game.boss.hp = 1;
  for (let i = 0; i < 600 && game.state !== 'victory'; i += 1) {
    if (game.boss && !game.boss.dying) game.hurtBoss(400, 90, 1, false);
    game.update(1 / 120, {});
  }
  assert.equal(game.state, 'victory');
  assert.ok(events().includes('victory'));
  const down = game.events.find((ev) => ev.type === 'bossDown');
  assert.equal(down.kind, 'tidebound');
  assert.equal(down.reward, 'victory');
});

test('live core: every hall spawns its authored enemies on the right floor', () => {
  for (let id = 662; id <= 665; id += 1) {
    const game = new AshenGame({});
    game.loadRoom(id);
    const authored = roomById(id).enemies.length;
    assert.equal(game.enemies.length, authored, `room ${id} spawn count`);
    for (const enemy of game.enemies) {
      assert.equal(enemy.dead, false);
      assert.ok(enemy.ai, 'enemy has an engine archetype');
      assert.ok(enemy.y < 471, 'enemy sits on or above the floor');
    }
  }
});
