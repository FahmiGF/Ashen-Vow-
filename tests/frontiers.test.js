// Phase 2 — Infinite Frontiers playable. Pure structure/progression plus
// live-core checks for the 100-room ladder and its ten chapter bosses.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FRONTIER_ROOMS,
  FRONTIER_ROOM_BY_ID,
  FRONTIER_ROOMS_PER_CHAPTER,
  FRONTIER_LEVEL_COUNT,
  FRONTIER_ENEMIES_PER_ROOM,
  FRONTIER_GLOBAL_START,
  FRONTIER_ELITE_INFO,
  FRONTIER_ENEMY_INFO,
  FRONTIER_BOSS_INFO,
  FRONTIER_CHAPTER_META,
  FRONTIERS_NAME,
  validateFrontierRooms,
  frontierLevelScale,
  frontierDamageScale,
  frontierSpeedScale,
  frontierPlayerScale,
  frontierVitalityScale,
  frontierFlaskBonus,
  frontierAshStipend,
  frontierRoomForIndex,
  frontierIndexForRoom,
  frontierRoomForLevel,
  frontierChapterForLevel,
  frontierCampaignUnlocked,
  frontierLevelUnlocked,
  frontierLevelCleared,
  frontierChapterProgress,
  frontierCampaignSummary,
  recordFrontierLevel,
  recordFrontierRun,
  defaultFrontierCampaignProgress,
  sanitizeFrontierCampaignProgress,
} from '../src/frontiers.js';
import { ALL_ROOMS, ALL_BOSS_INFO, ALL_ENEMY_INFO, AshenGame } from '../src/core.js';
import { TRACKS } from '../src/music.js';
import { ZONES } from '../src/zones.js';

const roomById = (id) => ALL_ROOMS.find((room) => room?.id === id);

test('the ladders appends 100 rooms after the Lanternwake', () => {
  assert.equal(FRONTIER_ROOMS.length, FRONTIER_LEVEL_COUNT);
  assert.equal(FRONTIER_LEVEL_COUNT, 100);
  assert.equal(FRONTIER_GLOBAL_START, 674);
  FRONTIER_ROOMS.forEach((room, i) => {
    assert.equal(room.id, 674 + i);
    assert.equal(room.frontierLevel, 101 + i);
    assert.equal(room.frontierIndex, i);
    assert.equal(room.zone, 'frontier');
    assert.ok(room.palette.glow, `room ${room.id} has a palette`);
    assert.ok(room.particle, `room ${room.id} has a particle mood`);
  });
  assert.equal(roomById(673).name, 'Ambang Sumbu', 'the Lanternwake still ends at 673');
  assert.equal(ALL_ROOMS.length, 901);
  assert.equal(ALL_ROOMS.at(-1).id, 900);
  assert.equal(roomById(773).boss, 'aethron_origin');
  assert.ok(ZONES.frontier, 'the frontier zone exists');
  assert.ok(TRACKS.frontier && TRACKS.frontierBoss, 'both frontier tracks exist');
});

test('the structure validator accepts all 100 rooms and every boss', () => {
  assert.deepEqual(validateFrontierRooms(), []);
});

test('every standard level keeps the 20-body contract with exactly one elite', () => {
  const standard = FRONTIER_ROOMS.filter((room) => !room.boss);
  assert.equal(standard.length, 90);
  for (const room of standard) {
    assert.equal(room.enemies.length, FRONTIER_ENEMIES_PER_ROOM, `room ${room.id} body count`);
    const elites = room.enemies.filter((enemy) => enemy.elite || FRONTIER_ELITE_INFO[enemy.type]?.elite);
    assert.equal(elites.length, 1, `room ${room.id} has one elite`);
    assert.ok(FRONTIER_ELITE_INFO[elites[0].type], `room ${room.id} elite is an authored body`);
    assert.match(elites[0].eliteRank, /^E[1-7]$/);
    const archetypes = new Set(
      room.enemies
        .filter((enemy) => !enemy.elite)
        .map((enemy) => FRONTIER_ENEMY_INFO[enemy.type]?.behavior),
    );
    assert.deepEqual([...archetypes].sort(), ['chaser', 'lunge', 'ranged', 'slam'], `room ${room.id} archetypes`);
    for (const enemy of room.enemies) {
      assert.ok(enemy.minX < enemy.x && enemy.x < enemy.maxX, `${room.id} ${enemy.type} patrol`);
    }
    if (room.frontierIndex % 5 === 0) assert.ok(room.checkpoint, `${room.id} keeps a Warung Abu`);
  }
});

test('the enemy tables are authored and registered with the shared index', () => {
  assert.equal(Object.keys(FRONTIER_ENEMY_INFO).length, 40);
  assert.equal(Object.keys(FRONTIER_ELITE_INFO).length, 15);
  for (const [type, info] of Object.entries({ ...FRONTIER_ENEMY_INFO, ...FRONTIER_ELITE_INFO })) {
    assert.equal(ALL_ENEMY_INFO[type], info, `${type} is in ALL_ENEMY_INFO`);
    assert.ok(info.hp > 0 && info.dmg > 0 && info.reward >= 1, `${type} stats`);
    assert.ok(info.name && info.title && info.desc && info.where, `${type} codex data`);
    assert.ok(['chaser', 'ranged', 'lunge', 'slam', 'burrower', 'spawner', 'hover'].includes(info.behavior), `${type} behaviour`);
  }
  const ranks = [...new Set(Object.values(FRONTIER_ELITE_INFO).map((info) => info.eliteRank))].sort();
  // The authored mob table starts at E2: E1 is the rank every ordinary body
  // effectively fights at, so the ladder ships six live ranks (E2–E7).
  assert.deepEqual(ranks, ['E2', 'E3', 'E4', 'E5', 'E6', 'E7']);
  for (const rank of ranks) assert.match(rank, /^E[1-7]$/);
});

test('the route walks 674 -> 773 and only the last level closes the ladder', () => {
  for (const room of FRONTIER_ROOMS) {
    if (room.id === 773) {
      assert.equal(room.gate, null);
      assert.equal(room.boss, 'aethron_origin');
      continue;
    }
    assert.equal(room.gate.next, room.id + 1);
    assert.equal(room.gate.requires, room.boss ? 'boss' : 'clear');
  }
  for (const room of FRONTIER_ROOMS.filter((entry) => entry.boss)) {
    assert.deepEqual(room.enemies, [], `boss room ${room.id} has no mobs`);
    assert.equal(room.id % 10, 3, 'boss seats sit on the third id of each decade');
    assert.ok(room.checkpoint, `boss room ${room.id} keeps a checkpoint`);
  }
});

test('ten chapter bosses own phases, dialogue, patterns and music', () => {
  assert.equal(FRONTIER_CHAPTER_META.length, 10);
  assert.equal(Object.keys(FRONTIER_BOSS_INFO).length, 10);
  let previousHp = 0;
  for (const [kind, boss] of Object.entries(FRONTIER_BOSS_INFO)) {
    assert.equal(ALL_BOSS_INFO[kind], boss, `${kind} is registered`);
    assert.ok(boss.maxPhases >= 3 && boss.maxPhases <= 5, `${kind} phases`);
    assert.equal(boss.phaseThresholds.length, boss.maxPhases - 1);
    for (let i = 1; i < boss.phaseThresholds.length; i += 1) {
      assert.ok(boss.phaseThresholds[i] < boss.phaseThresholds[i - 1], `${kind} thresholds descend`);
    }
    for (const key of ['intro', 'defeat', ...Array.from({ length: boss.maxPhases - 1 }, (_, i) => `phase${i + 2}`)]) {
      assert.ok(Array.isArray(boss.dialogue[key]) && boss.dialogue[key].length, `${kind} ${key}`);
      for (const line of boss.dialogue[key]) assert.ok(line.speaker && line.text);
    }
    assert.ok(boss.pattern, `${kind} has an attack family`);
    assert.ok(TRACKS[boss.music], `${kind} music ${boss.music} exists`);
    assert.ok(boss.maxHp > previousHp, `${kind} escalates over the previous chapter`);
    previousHp = boss.maxHp;
  }
  assert.equal(FRONTIER_BOSS_INFO.aethron_origin.reward, 'victory');
  assert.equal(FRONTIER_BOSS_INFO.aethron_origin.maxPhases, 5);
  for (const chapter of FRONTIER_CHAPTER_META) {
    assert.equal(FRONTIER_BOSS_INFO[chapter.bossId].name, chapter.bossName);
    assert.equal(chapter.rooms, FRONTIER_ROOMS_PER_CHAPTER);
    assert.equal(chapter.lastRoom - chapter.firstRoom, 9);
    assert.ok(chapter.elites.length >= 1);
  }
});

test('the difficulty table climbs without spikes', () => {
  assert.equal(frontierLevelScale(0), 1);
  assert.ok(frontierLevelScale(99) > 2.18 && frontierLevelScale(99) < 2.2);
  assert.equal(frontierDamageScale(0), 1);
  assert.ok(frontierDamageScale(99) > 1.58 && frontierDamageScale(99) < 1.6);
  assert.equal(frontierSpeedScale(0), 1);
  assert.ok(frontierSpeedScale(99) > frontierSpeedScale(0));
  assert.equal(frontierAshStipend(0), 120);
  assert.ok(frontierAshStipend(99) > frontierAshStipend(0));
  for (let i = 1; i < FRONTIER_LEVEL_COUNT; i += 1) {
    assert.ok(frontierLevelScale(i) > frontierLevelScale(i - 1));
    assert.ok(frontierDamageScale(i) > frontierDamageScale(i - 1));
  }
  // Player growth outruns body HP growth, so the ladder never becomes a wall.
  assert.equal(frontierPlayerScale(0), 1);
  assert.equal(frontierVitalityScale(0), 1);
  assert.equal(frontierFlaskBonus(0), 0);
  assert.ok(frontierPlayerScale(99) > frontierLevelScale(99));
  assert.ok(frontierPlayerScale(99) > frontierVitalityScale(99));
  assert.equal(frontierFlaskBonus(99), 3);
  for (let i = 1; i < FRONTIER_LEVEL_COUNT; i += 1) {
    assert.ok(frontierPlayerScale(i) > frontierPlayerScale(i - 1));
    assert.ok(frontierVitalityScale(i) > frontierVitalityScale(i - 1));
  }
  const first = FRONTIER_ROOMS[0].enemies[0];
  const last = FRONTIER_ROOMS[88].enemies[0];
  assert.ok(last.hpScale > first.hpScale, 'later rooms scale their bodies');
});

test('levels unlock in order and the boss seat closes its chapter', () => {
  const state = defaultFrontierCampaignProgress();
  assert.equal(frontierLevelUnlocked(state, 0), true);
  assert.equal(frontierLevelUnlocked(state, 1), false);
  assert.deepEqual(recordFrontierLevel(state, 3), { ok: false, reason: 'locked' });
  for (let i = 0; i < FRONTIER_LEVEL_COUNT; i += 1) {
    assert.equal(frontierLevelUnlocked(state, i), true, `level ${i} unlock`);
    const result = recordFrontierLevel(state, i);
    assert.equal(result.ok, true);
    assert.equal(frontierLevelCleared(state, i), true);
  }
  const summary = frontierCampaignSummary(state);
  assert.equal(summary.levelsCleared, 100);
  assert.equal(summary.bossesCleared, 10);
  assert.equal(summary.percent, 100);
  assert.equal(summary.complete, true);
});

test('a chapter boss is only recorded on its own seat', () => {
  const state = defaultFrontierCampaignProgress();
  for (let i = 0; i < 9; i += 1) recordFrontierLevel(state, i);
  assert.equal(frontierChapterProgress(state, 11).bossCleared, false);
  const seat = recordFrontierLevel(state, 9);
  assert.equal(seat.ok, true);
  assert.equal(seat.bossFirstClear, true);
  assert.equal(frontierChapterProgress(state, 11).bossCleared, true);
  assert.equal(frontierChapterProgress(state, 11).cleared, 10);
  const again = recordFrontierLevel(state, 9);
  assert.equal(again.firstClear, false);
  assert.equal(again.bossFirstClear, false);
  assert.equal(state.bossClears, 1);
});

test('the sanitizer repairs skipped clears and forged bosses', () => {
  const repaired = sanitizeFrontierCampaignProgress({
    levels: [true, false, true, false, true],
    bosses: [true, true, true],
    runs: -4,
    bestTime: 'nope',
  });
  assert.deepEqual(repaired.levels.slice(0, 5), [true, false, false, false, false]);
  assert.deepEqual(repaired.bosses, [false, false, false, false, false, false, false, false, false, false]);
  assert.equal(repaired.runs, 0);
  assert.equal(repaired.bestTime, 0);
  assert.equal(sanitizeFrontierCampaignProgress(null).levels.length, FRONTIER_LEVEL_COUNT);
  assert.deepEqual(sanitizeFrontierCampaignProgress({}).discovered.slice(0, 3), [true, false, false]);

  const forged = defaultFrontierCampaignProgress();
  for (let i = 0; i < FRONTIER_LEVEL_COUNT; i += 1) forged.levels[i] = true;
  forged.bosses[9] = true;
  const repairedForged = sanitizeFrontierCampaignProgress(forged);
  assert.equal(repairedForged.bosses[9], true, 'a forged boss with a cleared seat survives');
  forged.levels[99] = false;
  assert.equal(sanitizeFrontierCampaignProgress(forged).bosses[9], false, 'a boss without its seat is dropped');
});

test('run records keep the best time and count deaths', () => {
  const state = defaultFrontierCampaignProgress();
  recordFrontierRun(state, 300);
  recordFrontierRun(state, 240.44);
  recordFrontierRun(state, 0, true);
  assert.equal(state.runs, 3);
  assert.equal(state.deaths, 1);
  assert.equal(state.bestTime, 240.4);
  assert.equal(state.lastTime, 240.4);
});

test('the ladder opens on the campaign clear only', () => {
  assert.equal(frontierCampaignUnlocked(null), false);
  assert.equal(frontierCampaignUnlocked({ cleared: [] }), false);
  const cleared = Array.from({ length: 14 }, () => false);
  assert.equal(frontierCampaignUnlocked({ cleared }), false);
  cleared[7] = true;
  assert.equal(frontierCampaignUnlocked({ cleared }), true);
});

test('lookup helpers clamp and stay inside the ladder', () => {
  assert.equal(frontierRoomForIndex(0).frontierLevel, 101);
  assert.equal(frontierRoomForIndex(99).id, 773);
  assert.equal(frontierRoomForIndex(100), null);
  assert.equal(frontierRoomForIndex(-1), null);
  assert.equal(frontierIndexForRoom(674), 0);
  assert.equal(frontierIndexForRoom(773), 99);
  assert.equal(frontierRoomForLevel(147).frontierChapter, 15);
  assert.equal(frontierRoomForLevel(100), null);
  assert.equal(frontierChapterForLevel(200).bossId, 'aethron_origin');
  assert.equal(FRONTIER_ROOM_BY_ID[730].frontierLevel, 157);
  assert.equal(FRONTIERS_NAME, 'Infinite Frontiers');
});

test('live core: frontier rooms spawn twenty bodies, one elite and four archetypes', () => {
  for (const index of [0, 37, 61, 88]) {
    const room = FRONTIER_ROOMS[index];
    const game = new AshenGame({});
    game.loadRoom(room.id);
    assert.equal(game.roomIndex, room.id);
    assert.equal(game.enemies.length, 20, `room ${room.id} body count`);
    assert.equal(game.enemies.filter((enemy) => enemy.elite).length, 1, `room ${room.id} elite`);
    const elite = game.enemies.find((enemy) => enemy.elite);
    assert.ok(elite.maxHp > game.enemies.find((enemy) => !enemy.elite).maxHp, 'the elite is the tankiest body');
    assert.ok(new Set(game.enemies.filter((enemy) => !enemy.elite).map((enemy) => enemy.ai)).size === 4);
    for (const enemy of game.enemies) {
      assert.equal(enemy.dead, false);
      assert.ok(enemy.y < 471, 'bodies stand on or above the floor');
    }
  }
});

test('live core: a chapter boss reaches its phases and opens its gate after a blessing', () => {
  const game = new AshenGame({});
  game.loadRoom(683);
  assert.equal(game.boss.kind, 'skybreaker');
  assert.equal(game.boss.maxPhases, 3);
  assert.equal(game.gates[0].open, false);
  let guard = 0;
  while (game.boss && !game.boss.dying && game.boss.phase < 3 && guard++ < 120) {
    game.hurtBoss(260, 90, 1, false);
    game.update(1 / 120, {});
  }
  assert.equal(game.boss.phase, 3);
  const phases = game.events.filter((event) => event.type === 'bossPhase').map((event) => event.phase);
  assert.deepEqual(phases, [2, 3]);
  game.boss.hp = 1;
  for (let i = 0; i < 400 && game.state !== 'blessing'; i += 1) {
    if (game.boss && !game.boss.dying) game.hurtBoss(3000, 90, 1, false);
    game.update(1 / 120, {});
  }
  assert.equal(game.state, 'blessing');
  game.chooseBlessing(0);
  assert.equal(game.gates[0].open, true, 'the boss gate opens after the blessing');
});

test('live core: Aethron reaches five phases and ends the ladder in victory', () => {
  const game = new AshenGame({});
  game.loadRoom(773);
  assert.equal(game.boss.kind, 'aethron_origin');
  assert.equal(game.boss.maxPhases, 5);
  assert.ok(game.boss.maxHp >= FRONTIER_BOSS_INFO.aethron_origin.maxHp);
  let guard = 0;
  while (game.boss && !game.boss.dying && game.boss.phase < 5 && guard++ < 240) {
    game.hurtBoss(260, 90, 1, false);
    game.update(1 / 120, {});
  }
  assert.equal(game.boss.phase, 5);
  assert.deepEqual(
    game.events.filter((event) => event.type === 'bossPhase').map((event) => event.phase),
    [2, 3, 4, 5],
  );
  game.boss.hp = 1;
  for (let i = 0; i < 1200 && game.state !== 'victory'; i += 1) {
    if (game.boss && !game.boss.dying) game.hurtBoss(4000, 90, 1, false);
    game.update(1 / 120, {});
  }
  assert.equal(game.state, 'victory');
  const down = game.events.find((event) => event.type === 'bossDown');
  assert.equal(down.kind, 'aethron_origin');
  assert.equal(down.reward, 'victory');
});
