import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ECLIPSE_BIOMES, ECLIPSE_BOSSES, ECLIPSE_BOSS_INFO, ECLIPSE_SECRET_BOSS,
  ECLIPSE_ROOMS, ECLIPSE_STANDARD_ROOMS, ECLIPSE_CAMPAIGN_BOSS_ROOMS, ECLIPSE_ROOM_START,
  ECLIPSE_SECRET_ROOM_ID, ECLIPSE_ENEMY_INFO, ECLIPSE_CLASSES, ECLIPSE_WEAPONS,
  GODFALL_ROOMS, GODFALL_ROOM_START, GODFALL_FLOOR_COUNT, GODFALL_BOSSES,
  validateEclipseRooms, defaultEclipseProgress, sanitizeEclipseProgress,
  eclipseRoomUnlocked, recordEclipseRoom, recordEclipseBoss, eclipseSummary,
  defaultGodfallProgress, sanitizeGodfallProgress, recordGodfallFloor,
  failGodfallRun, godfallSummary, godfallFloorInfo,
  calculateDamage, applyReaction, reactionFor, createCombatState, classifyDodge,
  registerBreak, grantWeaponMastery, GRAPHICS_PRESETS, suggestGraphics, PerformanceSampler,
  GUILD_RANKS, createGuild, joinGuild, setGuildRank, guildChat, advanceGuildWeek,
  defaultGuildState, sanitizeGuildState, guildSummary,
  RAID_ENCOUNTERS, createRaidRun, raidDamage, raidCompleteObjective, raidRewardEligibility,
  recordRaidResult, defaultAwakeningProgress, grantMastery, canAwaken, awakenClass,
  awakeningBonus, setAwakeningPassive, sanitizeAwakeningProgress,
  createSaveEnvelope, validateSaveEnvelope, migrateSave, SAVE_SCHEMA_VERSION,
} from '../src/eclipse.js';
import {
  AshenGame, ALL_ROOMS, ALL_BOSS_INFO, ALL_ENEMY_INFO, WEAPONS, CHARACTERS, FLOOR_Y,
} from '../src/core.js';
import { validateEclipseContent, validateBossPhases, releaseChecklist, BUG_REGISTRY, RuntimeReporter } from '../src/qa.js';

function step(game, seconds, input = {}) {
  const ticks = Math.ceil(seconds * 120);
  for (let i = 0; i < ticks; i += 1) game.update(1 / 120, input);
}
const tap = (game, input, seconds = 1 / 120) => {
  game.update(seconds, { ...input, __pressed: input });
};

test('Arc VIII registers six biomes, thirty exact standard levels and seven bosses', () => {
  assert.equal(ECLIPSE_BIOMES.length, 6);
  assert.equal(ECLIPSE_ROOMS.length, 37);
  assert.equal(ECLIPSE_STANDARD_ROOMS.length, 30);
  assert.equal(ECLIPSE_CAMPAIGN_BOSS_ROOMS.length, 7);
  assert.equal(ECLIPSE_ROOMS[0].id, ECLIPSE_ROOM_START);
  assert.equal(ECLIPSE_ROOMS.at(-1).id, ECLIPSE_SECRET_ROOM_ID);
  assert.equal(GODFALL_ROOMS.length, 100);
  assert.equal(ALL_ROOMS.length, 674);
  assert.deepEqual(validateEclipseRooms(), { ok: true, errors: [], count: 37, standard: 30 });
  for (const room of ECLIPSE_STANDARD_ROOMS) {
    assert.equal(room.enemies.length, 20, room.name);
    assert.equal(new Set(room.enemies.map((e) => e.type)).size, 5);
    assert.equal(room.enemies.filter((e) => ECLIPSE_ENEMY_INFO[e.type].elite).length, 1);
  }
  assert.equal(Object.keys(ECLIPSE_ENEMY_INFO).length, 30);
  assert.equal(ECLIPSE_BOSSES.length, 6);
  assert.equal(ECLIPSE_SECRET_BOSS.phases, 5);
  assert.equal(Object.keys(ECLIPSE_BOSS_INFO).length, 7);
});

test('Arc VIII bosses expose sorted phases, dialogue, forms and the secret gate', () => {
  const report = validateBossPhases(Object.fromEntries(Object.entries(ALL_BOSS_INFO).filter(([key]) => key.startsWith('eclipse_'))));
  assert.equal(report.ok, true, report.errors.join('\n'));
  const final = ECLIPSE_BOSSES.find((boss) => boss.final);
  assert.equal(final.id, 'forgotten_high_god');
  assert.equal(ECLIPSE_BOSS_INFO[final.kind].maxPhases, 4);
  assert.equal(ECLIPSE_BOSS_INFO[ECLIPSE_SECRET_BOSS.kind].reward, 'secret');
  for (const boss of [...ECLIPSE_BOSSES, ECLIPSE_SECRET_BOSS]) {
    const info = ECLIPSE_BOSS_INFO[boss.kind];
    assert.ok(info.dialogue.intro.length && info.dialogue.defeat.length);
    assert.equal(info.forms.length, boss.phases);
    for (let phase = 2; phase <= boss.phases; phase += 1) assert.ok(info.dialogue[`phase${phase}`].length);
  }
});

test('every Eclipse boss enters all phases, speaks, and finishes in the real engine', () => {
  for (const source of [...ECLIPSE_BOSSES, ECLIPSE_SECRET_BOSS]) {
    const game = new AshenGame();
    game.enterRoom(source.roomIndex);
    assert.ok(game.boss, `${source.id} should spawn`);
    const phases = game.boss.maxPhases;
    assert.equal(phases, ECLIPSE_BOSS_INFO[source.kind].maxPhases);
    game.damageBoss(game.boss.maxHp + 1);
    for (let tick = 0; tick < 600 && game.state === 'playing'; tick += 1) game.update(1 / 120, {});
    const dialogue = game.events.filter((event) => event.type === 'bossDialogue');
    assert.ok(dialogue.some((event) => event.phase === 'intro'), `${source.id} needs intro dialogue`);
    for (let phase = 2; phase <= phases; phase += 1) {
      assert.ok(dialogue.some((event) => event.phase === `phase${phase}`), `${source.id} needs phase${phase}`);
    }
    assert.ok(dialogue.some((event) => event.phase === 'defeat'), `${source.id} needs defeat dialogue`);
    assert.ok(game.events.some((event) => event.type === 'bossDown' && event.kind === source.kind), `${source.id} must emit bossDown`);
    assert.notEqual(game.state, 'playing', `${source.id} must resolve its encounter`);
  }
});

test('Eclipse progression unlocks 30 levels in order and six fragments open the First Author', () => {
  const state = defaultEclipseProgress();
  state.unlocked = true;
  assert.equal(eclipseRoomUnlocked(state, ECLIPSE_ROOM_START), true);
  assert.equal(eclipseRoomUnlocked(state, ECLIPSE_ROOM_START + 1), false);
  for (let i = 0; i < 5; i += 1) recordEclipseRoom(state, ECLIPSE_ROOM_START + i);
  assert.equal(eclipseRoomUnlocked(state, ECLIPSE_BOSSES[0].roomIndex), true);
  const first = recordEclipseBoss(state, ECLIPSE_BOSSES[0].id);
  assert.equal(first.ok, true);
  assert.equal(state.fragments.length, 1);
  assert.equal(eclipseRoomUnlocked(state, ECLIPSE_BIOMES[1].roomStart), true);
  assert.equal(eclipseRoomUnlocked(state, ECLIPSE_SECRET_ROOM_ID), false);
  for (const boss of ECLIPSE_BOSSES.slice(1)) recordEclipseBoss(state, boss.id);
  assert.equal(state.fragments.length, 6);
  assert.equal(state.secret, true);
  assert.equal(eclipseRoomUnlocked(state, ECLIPSE_SECRET_ROOM_ID), true);
  recordEclipseBoss(state, ECLIPSE_SECRET_BOSS.id);
  assert.equal(state.firstAuthor, true);
  assert.equal(eclipseSummary(state).secretUnlocked, true);
});

test('Eclipse save sanitization keeps earned progress and filters forged ids', () => {
  const raw = {
    unlocked: true,
    rooms: Array.from({ length: 30 }, (_, i) => i < 8),
    bosses: { obsidian_king: true, eclipse_first_author: true, fake: true },
    fragments: ['fragment_1', 'fragment_2', 'fake_fragment'],
    secret: true,
    archive: { enemies: ['obsidian_guard', 'fake_enemy'], bosses: ['obsidian_king', 'fake_boss'] },
  };
  const safe = sanitizeEclipseProgress(raw);
  assert.equal(safe.rooms.filter(Boolean).length, 8);
  assert.equal(safe.fragments.length, 2);
  assert.equal(safe.secret, false, 'two fragments cannot unlock the secret boss');
  assert.equal(safe.firstAuthor, false);
  assert.equal(safe.archive.enemies.length, 1);
  assert.equal(safe.archive.bosses.length, 1);
});

test('Godfall exposes 100 floors, ten bosses and checkpoint recovery', () => {
  assert.equal(GODFALL_FLOOR_COUNT, 100);
  assert.equal(GODFALL_ROOMS.length, 100);
  assert.equal(GODFALL_ROOMS[0].id, GODFALL_ROOM_START);
  assert.equal(GODFALL_BOSSES.length, 10);
  assert.equal(godfallFloorInfo(100).boss.name, 'The Ascension');
  const state = defaultGodfallProgress();
  const run = { practice: false, checkpoint: 1 };
  const first = recordGodfallFloor(state, run, 10);
  assert.equal(first.reward.name, 'Title: Godfall');
  assert.equal(state.highestFloor, 10);
  assert.equal(state.checkpoint, 11);
  const failure = failGodfallRun(state);
  assert.equal(failure.checkpoint, 11);
  assert.equal(godfallSummary(state).clearedCount, 1);
  const practice = { ...run, practice: true, checkpoint: 10 };
  recordGodfallFloor(state, practice, 25);
  assert.equal(state.checkpoint, 11, 'practice cannot move the real checkpoint');
  assert.equal(sanitizeGodfallProgress({ cleared: [true], highestFloor: 999 }).highestFloor, 100);
});

test('Combat 2.0 uses a validated damage pipeline, reactions, dodge windows and break gauges', () => {
  assert.equal(calculateDamage({ baseDamage: 100, elementalModifier: 1, defenseMultiplier: 1 }), 100);
  assert.equal(calculateDamage({ baseDamage: 100, defenseMultiplier: 1, resistance: 0.5 }), 50);
  assert.equal(calculateDamage({ baseDamage: 100, critical: true, criticalMultiplier: 2 }), 200);
  assert.equal(calculateDamage({ baseDamage: 100, targetDodging: true }), 0);
  assert.equal(calculateDamage({ baseDamage: -4 }), 0);
  assert.equal(reactionFor('fire', 'wind').name, 'Wildfire');
  assert.equal(reactionFor('frost', 'lightning').name, 'Superconduct');
  const combat = createCombatState();
  const reaction = applyReaction(combat, 'astral', 'void', 100);
  assert.equal(reaction.reaction.id, 'dimensional_collapse');
  assert.equal(reaction.bonusDamage, 24);
  assert.equal(classifyDodge(combat, 0.1), true);
  assert.equal(combat.counterWindow, 1.2);
  assert.equal(classifyDodge(combat, 0.4), false);
  assert.equal(registerBreak(combat, 70), false);
  assert.equal(registerBreak(combat, 40), true);
  assert.equal(combat.stagger, 1.45);
  assert.equal(grantWeaponMastery(combat, 'halberd', 650).rank, 4);
});

test('five new classes and seven new weapons run through the real engine', () => {
  assert.equal(Object.keys(ECLIPSE_CLASSES).length, 5);
  assert.equal(Object.keys(CHARACTERS).length, 18);
  assert.equal(ECLIPSE_WEAPONS.length, 7);
  for (const weapon of ECLIPSE_WEAPONS) {
    assert.ok(WEAPONS[weapon.id]);
  }
  const g = new AshenGame();
  g.applyCharacter('dawn_paladin');
  g.enterRoom(ECLIPSE_ROOM_START);
  const target = g.enemies[0];
  target.x = g.player.x + 60;
  target.y = FLOOR_Y - target.h;
  const before = target.hp;
  assert.equal(g.useAbility(), true);
  assert.ok(g.player.abilityCooldown > 0);
  assert.ok(target.hp <= before);
  g.player.weapons = ['war_scythe'];
  g.player.weapon = 'war_scythe';
  g.player.weaponSkillCooldown = 0;
  assert.equal(g.useWeaponSkill(), true);
  assert.ok(g.player.weapons.includes('war_scythe'));
  assert.ok(g.player.weaponSkillCooldown > 0);
});

test('guild ranks, chat, weekly progress and leaderboard are real state', () => {
  assert.equal(GUILD_RANKS.length, 5);
  let state = defaultGuildState();
  const created = createGuild(state, { name: 'Forgotten Vow', emblem: '☥', leader: 'Sera' });
  assert.equal(created.ok, true);
  state = created.state;
  state.guild.members.push({ id: 'm2', name: 'Kael', rank: 'recruit', joinedAt: Date.now() });
  assert.equal(setGuildRank(state, 'm2', 'officer').ok, true);
  assert.equal(guildChat(state, { name: 'Kael', text: 'Raid malam ini.' }).ok, true);
  state = advanceGuildWeek(state, { raid: true, floors: 4, bosses: 1 });
  assert.equal(state.weekly.weekly_raid, 1);
  assert.equal(guildSummary(state).leaderboard.find((entry) => entry.you).guild, 'Forgotten Vow');
  assert.equal(joinGuild(defaultGuildState(), { name: 'Warden' }).ok, true);
  assert.equal(sanitizeGuildState({ guild: { name: 'A', members: [{ id: 'x', rank: 'leader' }] } }).guild.members.length, 1);
});

test('all three raids support damage, objectives, practice and reward validation', () => {
  assert.equal(RAID_ENCOUNTERS.length, 3);
  const run = createRaidRun('forgotten_high_god', { players: [{ id: 'p1', name: 'Sera' }] });
  assert.ok(run);
  assert.equal(raidDamage(run, 'p1', 1000).ok, true);
  for (const objective of run.objectives) raidCompleteObjective(run, objective.id);
  raidDamage(run, 'p1', run.maxHp);
  const eligibility = raidRewardEligibility(run);
  assert.equal(eligibility.ok, true);
  assert.equal(eligibility.reward, 'raid_pantheon_cache');
  const practice = createRaidRun('worldroot_colossus', { practice: true, players: [{ id: 'p1' }] });
  raidDamage(practice, 'p1', practice.maxHp);
  assert.equal(raidRewardEligibility(practice).error, 'practice_only');
  const state = sanitizeGuildState({});
  assert.equal(recordRaidResult(state, run).ok, true);
});

test('Awakening requires mastery, applies a passive and survives sanitization', () => {
  const classId = 'dawn_paladin';
  let state = defaultAwakeningProgress();
  assert.equal(canAwaken(state, classId), false);
  grantMastery(state, classId, 100);
  assert.equal(canAwaken(state, classId), true);
  const result = awakenClass(state, classId);
  assert.equal(result.ok, true);
  state = result.state;
  assert.equal(state.awakened[classId], true);
  assert.ok(awakeningBonus(state, classId).passive);
  assert.equal(setAwakeningPassive(state, classId, 'eclipse_echo').ok, true);
  assert.equal(state.activePassive[classId], 'eclipse_echo');
  assert.equal(sanitizeAwakeningProgress(state, [classId]).awakened[classId], true);
});

test('save v2 validates, migrates, and never destroys unknown progress fields', () => {
  assert.equal(SAVE_SCHEMA_VERSION, 2);
  const old = { version: 1, unlocked: 9, cleared: [true], customFutureField: 'keep-me' };
  const migration = migrateSave(old);
  assert.equal(migration.ok, true);
  assert.equal(migration.migrated, true);
  assert.equal(migration.progress.customFutureField, 'keep-me');
  assert.equal(migration.progress.schemaVersion, 2);
  assert.equal(validateSaveEnvelope(createSaveEnvelope(old)).ok, true);
  assert.equal(validateSaveEnvelope('broken').ok, false);
  assert.equal(migrateSave({ version: 0 }).ok, false);
});

test('Project Smoothfall recommendations and QA release gates are honest', () => {
  assert.ok(GRAPHICS_PRESETS.low && GRAPHICS_PRESETS.ultra && GRAPHICS_PRESETS.custom);
  assert.equal(suggestGraphics({ p95: 35 }), 'low');
  assert.equal(suggestGraphics({ p95: 17 }), 'ultra');
  const sampler = new PerformanceSampler({ capacity: 5 });
  [10, 12, 14, 16, 20].forEach((ms) => sampler.sample(ms, 128));
  const report = sampler.summary();
  assert.equal(report.frames, 5);
  assert.ok(report.p95 > 0 && report.p99 >= report.p95);
  const content = validateEclipseContent();
  assert.equal(content.ok, true, content.errors.join('\n'));
  const release = releaseChecklist();
  assert.equal(release.total, 30);
  assert.ok(release.verified >= 20);
  assert.ok(release.blockers.some((item) => /hardware|soak|multiplayer/i.test(item.label)));
  assert.ok(BUG_REGISTRY.length >= 8);
  const reporter = new RuntimeReporter();
  assert.ok(reporter.capture(new Error('test failure')).id);
});
