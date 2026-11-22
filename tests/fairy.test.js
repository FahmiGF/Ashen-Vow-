import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AshenGame,
  ALL_ROOMS,
  ALL_ENEMY_INFO,
  ALL_BOSS_INFO,
  FLOOR_Y,
} from '../src/core.js';
import {
  FAIRY_ROOM_START,
  FAIRY_STAGE_COUNT,
  FAIRY_ROOM_COUNT,
  FAIRY_ROOMS,
  FAIRY_STAGE_ROOMS,
  FAIRY_STAGES,
  FAIRY_BOSSES,
  FAIRY_BOSS_INFO,
  FAIRY_ENEMY_INFO,
  FAIRY_NPCS,
  FAIRY_NPC_BY_ID,
  FAIRY_ZONE,
  validateFairyRooms,
  defaultFairyProgress,
  sanitizeFairyProgress,
  fairyStageUnlocked,
  fairyStageCleared,
  fairyBossesUnlocked,
  fairyBossUnlocked,
  recordFairyStage,
  recordFairyBoss,
  recordFairyRun,
  fairyProgressSummary,
} from '../src/fairy.js';
import { TRACKS, bossTrackFor } from '../src/music.js';
import { BOSS_CUTSCENE, POST_CREDIT, cutsceneBeatAt } from '../src/cutscene.js';
import { ZONES, zoneForRoom } from '../src/zones.js';

const step = (g, seconds, input = {}) => {
  const frames = Math.ceil(seconds * 120);
  for (let i = 0; i < frames; i++) g.update(1 / 120, input);
};

test('faewood defines 10 stages and 2 boss arenas after Hearthfall', () => {
  assert.equal(FAIRY_ROOM_START, 414);
  assert.equal(FAIRY_STAGE_COUNT, 10);
  assert.equal(FAIRY_ROOM_COUNT, 12);
  assert.equal(FAIRY_ROOMS.length, 12);
  assert.equal(FAIRY_STAGE_ROOMS.length, 10);
  assert.equal(FAIRY_BOSSES.length, 2);
  assert.equal(Object.keys(FAIRY_ENEMY_INFO).length, 10);
  assert.equal(FAIRY_NPCS.length, 4);
  assert.equal(ALL_ROOMS[FAIRY_ROOM_START], FAIRY_ROOMS[0]);
  assert.equal(ALL_ROOMS[FAIRY_ROOM_START + 11], FAIRY_ROOMS[11]);
  assert.equal(ALL_ROOMS.length, 662);
  assert.equal(ALL_ENEMY_INFO.cap_chaser, FAIRY_ENEMY_INFO.cap_chaser);
  assert.equal(ALL_BOSS_INFO.fairy_magma_slime, FAIRY_BOSS_INFO.fairy_magma_slime);
  assert.equal(ALL_BOSS_INFO.fairy_spectral_dragon, FAIRY_BOSS_INFO.fairy_spectral_dragon);
});

test('fairy rooms chain in order and the bosses sit behind all ten stages', () => {
  const report = validateFairyRooms();
  assert.equal(report.ok, true, report.errors.join('; '));
  FAIRY_ROOMS.forEach((room, i) => {
    assert.equal(room.id, FAIRY_ROOM_START + i);
    assert.ok(room.platforms.some((platform) => platform.y >= FLOOR_Y - 2));
    assert.equal(room.spawn.y, FLOOR_Y - 46);
    if (i < FAIRY_ROOMS.length - 1) assert.equal(room.gate.next, FAIRY_ROOM_START + i + 1);
  });
  const lastStage = FAIRY_STAGE_ROOMS[FAIRY_STAGE_COUNT - 1];
  assert.equal(lastStage.gate.next, FAIRY_ROOM_START + FAIRY_STAGE_COUNT);
  assert.equal(lastStage.gate.requires, 'clear');
  assert.equal(FAIRY_ROOMS[10].boss, 'fairy_magma_slime');
  assert.equal(FAIRY_ROOMS[10].gate.next, FAIRY_ROOM_START + 11);
  assert.equal(FAIRY_ROOMS[10].gate.requires, 'boss');
  assert.equal(FAIRY_ROOMS[11].boss, 'fairy_spectral_dragon');
  assert.equal(FAIRY_ROOMS[11].gate, null, 'the dragon is the final arena');
  assert.ok(FAIRY_STAGE_ROOMS.every((room) => room.boss === null));
  const npcStages = FAIRY_STAGES.filter((stage) => stage.npc);
  assert.equal(npcStages.length, 4);
  for (const stage of npcStages) {
    const room = FAIRY_STAGE_ROOMS[stage.index];
    assert.equal(room.npcs?.[0]?.name, FAIRY_NPC_BY_ID[stage.npc].name, `stage ${stage.index + 1} must place its NPC`);
  }
  assert.ok(FAIRY_STAGE_ROOMS.every((room) => room.enemies.every((enemy) => FAIRY_ENEMY_INFO[enemy.type])));
});

test('fairy mobs cover tiny swarmers, elites and a spawner', () => {
  const tiny = Object.values(FAIRY_ENEMY_INFO).filter((info) => info.tiny);
  const elite = Object.values(FAIRY_ENEMY_INFO).filter((info) => info.elite);
  assert.ok(tiny.length >= 3, 'the biome needs tiny mushroom/fairy mobs');
  assert.ok(elite.length >= 3, 'the biome needs elites');
  assert.equal(FAIRY_ENEMY_INFO.elder_spore.childType, 'cap_chaser');
  assert.equal(FAIRY_ENEMY_INFO.elder_spore.behavior, 'spawner');
  assert.equal(FAIRY_ENEMY_INFO.glow_midge.flying, true);
  for (const info of Object.values(FAIRY_ENEMY_INFO)) {
    assert.ok(info.hp > 0 && info.dmg > 0 && info.speed > 0);
    assert.ok(info.color.startsWith('#'));
  }
});

test('both fairy bosses have phases, dialogue and their own music', () => {
  const slime = FAIRY_BOSS_INFO.fairy_magma_slime;
  const dragon = FAIRY_BOSS_INFO.fairy_spectral_dragon;
  assert.equal(slime.maxPhases, 4);
  assert.equal(dragon.maxPhases, 4);
  assert.equal(dragon.flying, true);
  assert.equal(dragon.reward, 'victory');
  assert.equal(slime.reward, 'blessing');
  assert.equal(dragon.summonType, 'glow_midge');
  for (const boss of [slime, dragon]) {
    assert.ok(boss.dialogue.intro.length > 0);
    assert.ok(boss.dialogue.defeat.length > 0);
    for (let phase = 2; phase <= boss.maxPhases; phase += 1) {
      assert.ok(boss.dialogue[`phase${phase}`]?.length, `${boss.kind} needs phase ${phase} dialogue`);
    }
    assert.equal(boss.phaseThresholds.length, boss.maxPhases - 1);
    for (let i = 1; i < boss.phaseThresholds.length; i += 1) {
      assert.ok(boss.phaseThresholds[i] < boss.phaseThresholds[i - 1], 'thresholds descend');
    }
  }
  assert.equal(bossTrackFor('fairy_magma_slime'), 'magmaBoss');
  assert.equal(bossTrackFor('fairy_spectral_dragon'), 'fairyBoss');
  assert.ok(TRACKS.faewood && TRACKS.magmaBoss && TRACKS.fairyBoss);
  assert.ok(TRACKS.celebration, 'a celebratory theme must exist for the finale');
});

test('the final boss shifts the arena to heaven and hell as it phases', () => {
  const dragon = FAIRY_BOSS_INFO.fairy_spectral_dragon;
  assert.equal(dragon.forms[3].id, 'heaven');
  assert.equal(dragon.forms[4].id, 'hell');
  assert.match(dragon.forms[4].name, /Demon Lord/i);
  assert.notEqual(dragon.forms[3].arena.palette.glow, dragon.forms[4].arena.palette.glow);
  assert.ok(dragon.dialogue.phase3[0].text.length > 0);
  assert.match(dragon.dialogue.phase4[0].speaker, /Vharos/);
  const slime = FAIRY_BOSS_INFO.fairy_magma_slime;
  assert.equal(slime.forms, null, 'only the final boss changes form');

  const g = new AshenGame();
  g.enterRoom(FAIRY_ROOM_START + FAIRY_STAGE_COUNT + 1);
  const boss = g.boss;
  boss.intro = 0;
  assert.equal(g.arenaTheme, null, 'the fight starts in Faewood');
  g.damageBoss(boss.maxHp * 0.3);
  assert.equal(boss.phase, 2);
  assert.equal(g.arenaTheme, null);
  boss.invuln = 0;
  g.damageBoss(boss.maxHp * 0.25);
  assert.equal(boss.phase, 3);
  assert.equal(g.arenaTheme.id, 'heaven');
  assert.equal(boss.name, 'Sylvara, Seraph of the Woven Sky');
  assert.ok(g.events.some((event) => event.type === 'bossForm' && event.arena === 'heaven'));
  boss.invuln = 0;
  g.damageBoss(boss.maxHp * 0.25);
  assert.equal(boss.phase, 4);
  assert.equal(g.arenaTheme.id, 'hell');
  assert.match(boss.name, /Vharos/);
  assert.equal(boss.formMusic, 'magmaBoss');
  assert.ok(g.events.some((event) => event.type === 'bossForm' && event.arena === 'hell'));
});

test('final-boss cutscene portraits the boss for 20 s and the epilogue runs 30 s', () => {
  assert.equal(BOSS_CUTSCENE.duration, 20);
  assert.equal(POST_CREDIT.duration, 30);
  assert.ok(BOSS_CUTSCENE.beats.length >= 6);
  assert.ok(POST_CREDIT.beats.length >= 7);
  assert.equal(BOSS_CUTSCENE.beats[0].at, 0);
  assert.ok(BOSS_CUTSCENE.beats[BOSS_CUTSCENE.beats.length - 1].at < BOSS_CUTSCENE.duration);
  assert.ok(POST_CREDIT.beats[POST_CREDIT.beats.length - 1].at < POST_CREDIT.duration);
  assert.match(cutsceneBeatAt(BOSS_CUTSCENE, 0).text, /cahaya/i);
  assert.match(cutsceneBeatAt(POST_CREDIT, 29).text, /namamu|dipanggil|penjaga/i);
  assert.equal(POST_CREDIT.music, 'celebration');
});

test('faewood registers its zone and music for the map and soundtrack', () => {
  assert.equal(ZONES[FAIRY_ZONE.id].music, 'faewood');
  assert.equal(zoneForRoom(FAIRY_ROOM_START).id, 'faewood');
  assert.equal(zoneForRoom(FAIRY_ROOM_START + 11).bossMusic, 'fairyBoss');
  assert.equal(FAIRY_ROOMS[0].particle, 'spores');
});

test('stages unlock in order and bosses stay sealed until all ten are clear', () => {
  const p = defaultFairyProgress();
  assert.equal(fairyStageUnlocked(p, 0), true);
  assert.equal(fairyStageUnlocked(p, 1), false);
  assert.equal(fairyBossesUnlocked(p), false);
  assert.equal(fairyBossUnlocked(p, 'magma'), false);
  assert.equal(fairyBossUnlocked(p, 'dragon'), false);
  assert.equal(recordFairyStage(p, 3).ok, false, 'skipping stages must fail');

  for (let i = 0; i < FAIRY_STAGE_COUNT; i += 1) {
    assert.equal(fairyStageUnlocked(p, i), true);
    const result = recordFairyStage(p, i);
    assert.equal(result.ok, true);
    assert.equal(result.firstClear, true);
    assert.equal(recordFairyStage(p, i).firstClear, false, 'reclears do not pay twice');
  }
  assert.equal(fairyBossesUnlocked(p), true);
  assert.equal(fairyStageCleared(p, 9), true);
  assert.equal(fairyBossUnlocked(p, 'magma'), true);
  assert.equal(fairyBossUnlocked(p, 'dragon'), false, 'dragon needs the slime first');
  assert.equal(recordFairyBoss(p, 'dragon').ok, false);
  assert.equal(recordFairyBoss(p, 'magma').ok, true);
  assert.equal(fairyBossUnlocked(p, 'dragon'), true);
  assert.equal(recordFairyBoss(p, 'dragon').complete, true);
});

test('fairy progress sanitizes impossible states and keeps valid ones', () => {
  const dirty = sanitizeFairyProgress({
    stages: [true, true, false, true, true, true, true, true, true, true],
    bosses: { magma: true, dragon: true },
    runs: '12',
    bestTime: 42.34,
    extra: 'kept in the save elsewhere',
  });
  assert.equal(dirty.stages[2], false);
  assert.equal(dirty.stages[3], false, 'a stage after a gap cannot stay cleared');
  assert.deepEqual(dirty.bosses, { magma: false, dragon: false });
  assert.equal(dirty.runs, 12);
  assert.equal(dirty.bestTime, 42.3);

  const all = defaultFairyProgress();
  for (let i = 0; i < FAIRY_STAGE_COUNT; i += 1) recordFairyStage(all, i);
  recordFairyBoss(all, 'magma');
  const clean = sanitizeFairyProgress(all);
  assert.equal(clean.stages.every(Boolean), true);
  assert.equal(clean.bosses.magma, true);
  assert.equal(clean.bosses.dragon, false);

  assert.deepEqual(sanitizeFairyProgress(null), defaultFairyProgress());
  assert.deepEqual(sanitizeFairyProgress('nope'), defaultFairyProgress());
});

test('fairy summary tracks stages, bosses, runs and best clear time', () => {
  const p = defaultFairyProgress();
  for (let i = 0; i < 4; i += 1) recordFairyStage(p, i);
  let summary = fairyProgressSummary(p);
  assert.equal(summary.stagesCleared, 4);
  assert.equal(summary.bossesCleared, 0);
  assert.equal(summary.nextStage, 4);
  assert.equal(summary.bossesUnlocked, false);
  assert.equal(summary.complete, false);

  recordFairyRun(p, 0, { won: false });
  recordFairyRun(p, 210.4, { won: true });
  recordFairyRun(p, 190.2, { won: true });
  summary = fairyProgressSummary(p);
  assert.equal(summary.runs, 3);
  assert.equal(summary.bestTime, 190.2);
});

test('core spawns fairy mobs and runs the magma slime through its phases', () => {
  const g = new AshenGame();
  g.enterRoom(FAIRY_ROOM_START + 3);
  assert.equal(g.room.zone, 'faewood');
  assert.ok(g.enemies.length >= 2, 'stage 4 must populate its elite room');
  const guard = g.enemies.find((enemy) => enemy.name === 'Myconid Guard');
  assert.ok(guard, 'the elite myconid guard must spawn');
  assert.equal(guard.elite, true);
  assert.ok(guard.maxHp > 0);

  const small = g.spawnEnemy({ type: 'cap_chaser', x: 500, minX: 40, maxX: 1300 });
  assert.equal(small.flying, false);
  assert.ok(small.w <= 30, 'tiny mobs keep a small hitbox');

  g.enterRoom(FAIRY_ROOM_START + FAIRY_STAGE_COUNT);
  assert.ok(g.boss, 'the magma slime spawns in its arena');
  assert.equal(g.boss.kind, 'fairy_magma_slime');
  assert.equal(g.boss.maxPhases, 4);
  g.boss.intro = 0;
  g.damageBoss(g.boss.maxHp * 0.3);
  assert.equal(g.boss.phase, 2);
  assert.ok(g.events.some((event) => event.type === 'bossDialogue' && event.phase === 'phase2'));
  g.boss.invuln = 0;
  g.damageBoss(g.boss.maxHp * 0.3);
  g.boss.invuln = 0;
  g.damageBoss(g.boss.maxHp * 0.3);
  assert.equal(g.boss.phase, 4);
  assert.ok(g.events.some((event) => event.type === 'bossDialogue' && event.phase === 'phase4'));
});

test('the spectral fairy dragon summons wisps and ends with victory', () => {
  const g = new AshenGame();
  g.enterRoom(FAIRY_ROOM_START + FAIRY_STAGE_COUNT + 1);
  assert.ok(g.boss);
  assert.equal(g.boss.kind, 'fairy_spectral_dragon');
  assert.equal(g.boss.maxPhases, 4);
  assert.equal(g.boss.flying, true);
  g.boss.intro = 0;
  step(g, 1.2);
  g.damageBoss(g.boss.maxHp + 1);
  step(g, 1.5);
  assert.equal(g.state, 'victory');
  assert.ok(g.events.some((event) => event.type === 'bossDown' && event.room === FAIRY_ROOM_START + 11));
});
