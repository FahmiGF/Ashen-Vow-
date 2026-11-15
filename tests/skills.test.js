import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SKILL_BONUSES,
  SKILL_MAX_RANKS,
  SKILL_NODES,
  defaultSkillState,
  grantBossSkillPoints,
  grantSkillPoints,
  resetSkillRanks,
  sanitizeSkillState,
  skillBonuses,
  skillSummary,
  spendSkillPoint,
  ultimatePreview,
} from '../src/skills.js';
import {
  ALL_BOSS_INFO,
  AshenGame,
  FLOOR_Y,
} from '../src/core.js';
import {
  PACK_BOSSES,
  PACK_BOSS_INFO,
  defaultPackProgress,
  packBossUnlocked,
  packProgressSummary,
  recordPackBoss,
  recordPackFinish,
  sanitizePackProgress,
} from '../src/bosspack.js';
import { BOSS_TRACKS, TRACKS, MusicManager, bossTrackFor } from '../src/music.js';

test('skill state starts empty and sanitizes hostile input', () => {
  const fresh = defaultSkillState();
  assert.equal(fresh.points, 0);
  assert.equal(fresh.earned, 0);
  assert.equal(fresh.spent, 0);
  assert.deepEqual(fresh.ranks, {});
  assert.equal(skillBonuses(fresh).ultDamage, 1);
  assert.equal(SKILL_MAX_RANKS, SKILL_NODES.reduce((sum, node) => sum + node.maxRank, 0));

  const dirty = sanitizeSkillState({
    points: -40,
    earned: 900,
    ranks: { ult_damage: 99, ult_cooldown: -3, bogus_node: 4 },
    credited: { warden: 1, '../evil': 2 },
    repeats: { warden: 1e9 },
  });
  assert.equal(dirty.ranks.ult_damage, 5, 'rank clamps to node max');
  assert.equal(dirty.ranks.ult_cooldown, undefined);
  assert.equal(dirty.ranks.bogus_node, undefined);
  assert.equal(dirty.spent, 5);
  assert.ok(dirty.points >= 0);
  assert.equal(dirty.credited['../evil'], undefined, 'unknown ids are dropped');
  assert.ok(dirty.repeats.warden <= 999);
});

test('spending a point raises ultimate damage and cooldown reduction', () => {
  const state = defaultSkillState();
  grantSkillPoints(state, 10, 'test');
  assert.equal(state.points, 10);

  const first = spendSkillPoint(state, 'ult_damage');
  assert.equal(first.ok, true);
  assert.equal(state.points, 9);
  assert.equal(skillBonuses(state).ultDamage, 1.15);

  for (let i = 0; i < 4; i += 1) spendSkillPoint(state, 'ult_damage');
  assert.equal(skillBonuses(state).ultDamage, 1.75);
  assert.equal(spendSkillPoint(state, 'ult_damage').reason, 'max');

  for (let i = 0; i < 5; i += 1) spendSkillPoint(state, 'ult_cooldown');
  assert.equal(Number(skillBonuses(state).ultCooldown.toFixed(2)), 0.7);

  const summary = skillSummary(state);
  assert.equal(summary.used, 10);
  assert.equal(summary.points, 0);
  assert.equal(spendSkillPoint(state, 'ult_crit').reason, 'points');
});

test('respec refunds every spent point', () => {
  const state = defaultSkillState();
  grantSkillPoints(state, 6, 'test');
  spendSkillPoint(state, 'ult_damage');
  spendSkillPoint(state, 'ult_crit');
  const result = resetSkillRanks(state);
  assert.equal(result.refunded, 2);
  assert.equal(state.points, 6);
  assert.equal(state.spent, 0);
  assert.deepEqual(state.ranks, {});
  assert.equal(skillBonuses(state).ultDamage, 1);
});

test('bosses pay skill points once, then every third repeat kill', () => {
  const state = defaultSkillState();
  const first = grantBossSkillPoints(state, 'pack_ashking');
  assert.equal(first.points, 2);
  assert.equal(first.first, true);
  assert.equal(state.points, 2);

  assert.equal(grantBossSkillPoints(state, 'pack_ashking').points, 0);
  assert.equal(grantBossSkillPoints(state, 'pack_ashking').points, 0);
  assert.equal(grantBossSkillPoints(state, 'pack_ashking').points, 1);
  assert.equal(state.points, 3);

  const other = grantBossSkillPoints(state, 'warden');
  assert.equal(other.points, 2);
  assert.equal(state.credited.pack_ashking, 1);
});

test('core applies skill bonuses to HP, flasks, ash and ultimate damage', () => {
  const game = new AshenGame();
  game.applyCharacter('kael');
  const baseHp = game.player.maxHp;
  const baseFlasks = game.player.maxFlasks;

  game.applySkillBonuses({ maxHp: 24, flasks: 1, ash: 1.3, ultDamage: 1, ultCooldown: 1, ultCrit: 0 });
  assert.equal(game.player.maxHp, baseHp + 24);
  assert.equal(game.player.maxFlasks, baseFlasks + 1);
  assert.equal(game.skillBonuses.ash, 1.3);

  // Removing a rank trims the bonus again instead of stacking forever.
  game.applySkillBonuses({ maxHp: 12, flasks: 0, ash: 1.3, ultDamage: 1, ultCooldown: 1, ultCrit: 0 });
  assert.equal(game.player.maxHp, baseHp + 12);
  assert.equal(game.player.maxFlasks, baseFlasks);

  // Ash multiplier feeds enemy rewards.
  game.loadRoom(0, true);
  game.ash = 0;
  const crawler = game.spawnEnemy({ type: 'crawler', x: 400, minX: 40, maxX: 1200 });
  crawler.hp = 1;
  game.hurtEnemy(crawler, { dmg: 999, knock: 0, name: 'slash' }, 1);
  assert.equal(game.ash, Math.round(8 * 1.3));
});

test('skill bonuses re-apply after a reset instead of being lost to stale deltas', () => {
  const game = new AshenGame();
  const bonuses = { maxHp: 24, flasks: 1, ash: 1, ultDamage: 1, ultCooldown: 1, ultCrit: 0 };
  game.applyCharacter('sera');
  game.applySkillBonuses(bonuses);
  assert.equal(game.player.maxHp, 124);
  assert.equal(game.player.maxFlasks, 4);

  game.reset();
  game.applyCharacter('sera');
  game.applySkillBonuses(bonuses);
  assert.equal(game.player.maxHp, 124, 'reset + re-apply must restore the HP bonus');
  assert.equal(game.player.maxFlasks, 4, 'reset + re-apply must restore the flask bonus');
});

test('skill ranks increase ultimate damage and shorten its cooldown in core', () => {
  const damageRun = (bonuses) => {
    const game = new AshenGame();
    game.applyCharacter('kael');
    game.enterRoom(7);
    const boss = game.boss;
    assert.ok(boss, 'Oathbreaker must spawn in room 7');
    game.applySkillBonuses({ ...bonuses, ultCrit: 0 });
    boss.invuln = 0;
    boss.intro = 0;
    boss.x = game.player.x - 20;
    boss.y = game.player.y - 20;
    game.player.facing = 1;
    game.player.aimFacing = 1;
    const before = boss.hp;
    game.useAbility();
    return { dealt: before - boss.hp, cooldown: game.player.abilityCooldown };
  };

  const plain = damageRun({ ultDamage: 1, ultCooldown: 1 });
  const ranked = damageRun({ ultDamage: 1.75, ultCooldown: 0.7 });
  assert.ok(plain.dealt > 0, 'shadow step must hit the boss');
  assert.ok(ranked.dealt > plain.dealt * 1.6, `expected ranked damage, got ${ranked.dealt} vs ${plain.dealt}`);
  assert.ok(ranked.cooldown < plain.cooldown, 'cooldown rank must shorten the timer');
  assert.equal(DEFAULT_SKILL_BONUSES.ultDamage, 1);
});

test('six pack guardians have phases, dialogue, music and real boss metadata', () => {
  assert.equal(PACK_BOSSES.length, 6);
  assert.equal(Object.keys(PACK_BOSS_INFO).length, 6);
  const patterns = new Set(['slam', 'volley', 'ring', 'charge', 'summon', 'rain']);
  const tracks = new Set();
  for (const boss of PACK_BOSSES) {
    const info = PACK_BOSS_INFO[boss.kind];
    assert.ok(info, `${boss.kind} must be registered`);
    assert.equal(ALL_BOSS_INFO[boss.kind], info, 'core must expose pack bosses');
    assert.ok(info.maxPhases >= 3 && info.maxPhases <= 5);
    assert.equal(info.phaseThresholds.length, info.maxPhases - 1);
    for (let i = 1; i < info.phaseThresholds.length; i += 1) {
      assert.ok(info.phaseThresholds[i] < info.phaseThresholds[i - 1], 'thresholds must descend');
    }
    assert.ok(patterns.has(info.pattern), `${boss.kind} uses a known AI pattern`);
    assert.ok(info.dialogue.intro.length > 0);
    assert.ok(info.dialogue.defeat.length > 0);
    for (let phase = 2; phase <= info.maxPhases; phase += 1) {
      assert.ok(info.dialogue[`phase${phase}`]?.length, `${boss.kind} needs phase${phase} lines`);
    }
    assert.ok(Number.isFinite(info.maxHp) && info.maxHp > 0);
    assert.ok(Number.isFinite(info.contact) && info.contact > 0);
    assert.ok(TRACKS[info.music], `${boss.kind} music track must exist`);
    tracks.add(info.music);
    assert.equal(BOSS_TRACKS[boss.kind], info.music);
    assert.equal(bossTrackFor(boss.kind), info.music);
  }
  assert.ok(tracks.size >= 5, 'pack guardians should not share one theme');
});

test('pack progress unlocks sequentially and records clears', () => {
  const state = defaultPackProgress();
  assert.equal(packBossUnlocked(state, 0), true);
  assert.equal(packBossUnlocked(state, 1), false);
  assert.equal(recordPackBoss(state, 0).firstClear, true);
  assert.equal(packBossUnlocked(state, 1), true);
  assert.equal(recordPackBoss(state, 1).firstClear, true);
  assert.equal(recordPackBoss(state, 0).firstClear, false);
  const summary = packProgressSummary(state);
  assert.equal(summary.cleared, 2);
  assert.equal(summary.total, 6);
  assert.equal(summary.percent, 33);

  recordPackFinish(state, 120.5);
  assert.equal(state.gauntletClears, 1);
  assert.equal(state.runs, 1);

  const dirty = sanitizePackProgress({ cleared: { ashking: true, nope: true }, runs: -5, bestRun: 'x' });
  assert.deepEqual(dirty.cleared, { ashking: true });
  assert.equal(dirty.runs, 0);
  assert.equal(dirty.bestRun, 0);
});

test('music manager escalates boss phases without an AudioContext', () => {
  const music = new MusicManager(null);
  assert.equal(Number(music.setBossPhase(2, 4).toFixed(3)), 0.333);
  assert.equal(music.setBossPhase(99, 4), 1);
  music.clearBossPhase();
  assert.equal(music.phaseLevel, 0);
  assert.equal(music.play('pack_ashking'), false);
});

test('ultimate preview scales with ranks', () => {
  const state = defaultSkillState();
  const base = ultimatePreview(100, state);
  grantSkillPoints(state, 10, 'test');
  for (let i = 0; i < 5; i += 1) spendSkillPoint(state, 'ult_damage');
  assert.ok(ultimatePreview(100, state) > base);
});

test('spawned pack bosses fight with their own music and phase count', () => {
  const game = new AshenGame();
  game.enterRoom(7);
  game.boss = null;
  const boss = game.spawnBoss('pack_stormvalkyr');
  assert.equal(boss.kind, 'pack_stormvalkyr');
  assert.equal(boss.maxPhases, 4);
  assert.equal(boss.y, FLOOR_Y - boss.h);
  assert.equal(bossTrackFor(boss.kind), 'bossStorm');
  game.boss = null;
  assert.equal(game.boss, null);
});
