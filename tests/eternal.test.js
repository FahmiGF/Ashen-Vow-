// Update XIV — The Eternal Night: pure model coverage.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../src/eternal.js';
import {
  GHOSTS, GHOST_CLASSIFICATIONS, SanityMeter, GhostIndex, VeilController, indexRank,
  SANITY_CONSUMABLES, VEIL_SANITY_MAX as SANITY_MAX,
} from '../src/veil.js';
const {
  ETERNAL_CHAPTERS, ETERNAL_STAGES, ETERNAL_BOSSES, ETERNAL_EQUIPMENT,
  HUNT_VARIANTS, WORLD_EVENTS, INDEX_RANK_MILESTONES,
} = E;

test('Arc X shape: 8 chapters, 40 stages, 8 chapter bosses and a five-phase finale', () => {
  assert.equal(ETERNAL_CHAPTERS.length, 8);
  assert.equal(ETERNAL_STAGES.length, 40);
  for (const chapter of ETERNAL_CHAPTERS) {
    assert.equal(E.eternalStagesForChapter(chapter.id).length, 5, chapter.id);
  }
  assert.equal(new Set(ETERNAL_STAGES.map((s) => s.id)).size, 40);
  assert.equal(new Set(ETERNAL_STAGES.map((s) => s.room)).size, 40);
  assert.equal(ETERNAL_BOSSES.length, 9);
  const final = E.eternalBoss('first_forgotten');
  assert.equal(final.maxPhases, 5);
  assert.deepEqual(final.phaseThresholds, [0.84, 0.66, 0.48, 0.26]);
  for (const boss of ETERNAL_BOSSES) {
    assert.ok(boss.dialogueData.intro && boss.dialogueData.defeat, boss.id);
    for (let phase = 2; phase <= boss.maxPhases; phase += 1) {
      assert.ok(Array.isArray(boss.dialogueData[`phase${phase}`]), `${boss.id} phase ${phase}`);
    }
  }
});

test('every standard stage keeps 20 enemies, four archetypes and exactly one elite', () => {
  for (const stage of ETERNAL_STAGES) {
    const rows = E.eternalStageEnemies(stage.id, { worldW: 2400 });
    assert.equal(rows.length, 20, stage.id);
    assert.equal(rows.filter((r) => r.elite).length, 1, stage.id);
    assert.equal(rows.filter((r) => !r.elite).length, 19, stage.id);
    assert.deepEqual([...new Set(rows.map((r) => r.type))].sort(), [...stage.archetypes].sort(), stage.id);
  }
});

test('Arc X gates are sequential and bosses need five cleared stages', () => {
  const progress = { unlocked: true, completedStages: [], bossClears: [], finalBoss: false };
  assert.equal(E.eternalStageUnlocked('midnight_city_1', progress), true);
  assert.equal(E.eternalStageUnlocked('midnight_city_2', progress), false);
  assert.equal(E.eternalChapterUnlocked('carnival_lost_souls', progress), false);
  progress.completedStages.push('midnight_city_1');
  assert.equal(E.eternalStageUnlocked('midnight_city_2', progress), true);
  assert.equal(E.eternalBossUnlocked('clockless_mayor', progress), false);
  for (const stage of E.eternalStagesForChapter('midnight_city')) {
    if (!progress.completedStages.includes(stage.id)) progress.completedStages.push(stage.id);
  }
  assert.equal(E.eternalBossUnlocked('clockless_mayor', progress), true);
  assert.equal(E.eternalChapterUnlocked('carnival_lost_souls', progress), false);
  progress.bossClears.push('clockless_mayor');
  assert.equal(E.eternalChapterUnlocked('carnival_lost_souls', progress), true);
  assert.equal(E.eternalFinalUnlocked(progress), false);
});

test('controller clears all seven chapters and unlocks the final encounter', () => {
  const veil = new VeilController({ save: {} });
  const controller = new E.EternalController({ save: {}, veil });
  assert.equal(controller.startStage('midnight_city_1').reason, 'arc-locked');
  controller.unlock();
  for (const chapter of ETERNAL_CHAPTERS) {
    for (const stage of E.eternalStagesForChapter(chapter.id)) {
      const start = controller.startStage(stage.id);
      assert.equal(start.ok, true, stage.id);
      assert.equal(start.enemies.length, 20, stage.id);
      const result = controller.completeStage(stage.id, { clean: true });
      assert.equal(result.ok, true, stage.id);
    }
    assert.equal(controller.save.campaign.chapterClears.includes(chapter.id), true, chapter.id);
    assert.equal(controller.defeatBoss(chapter.boss).ok, true, chapter.boss);
  }
  assert.equal(controller.save.campaign.finalBoss, false);
  assert.equal(E.eternalFinalUnlocked(controller.save.campaign), true);
  assert.equal(controller.startBoss('first_forgotten').ok, true);
  assert.equal(controller.defeatBoss('first_forgotten').ok, true);
  assert.equal(controller.save.campaign.finalBoss, true);
  assert.ok(controller.save.achievements.includes('eternal_final'));
});

test('Ghost Index grows to 80 entries with 12 classifications and advanced fields', () => {
  assert.equal(GHOSTS.length, 80);
  assert.equal(GHOST_CLASSIFICATIONS.length, 12);
  const newClasses = ['revenant', 'wisp', 'aberration', 'spectral_beast', 'mimic', 'primordial'];
  for (const id of newClasses) {
    assert.ok(GHOSTS.filter((g) => g.classification === id).length >= 5, id);
  }
  for (const ghost of GHOSTS) {
    assert.ok(ghost.subclassification, ghost.id);
    assert.ok(ghost.threat >= 1 && ghost.threat <= 5, ghost.id);
    assert.ok(ghost.sanityInfluence > 0, ghost.id);
    assert.ok(ghost.preferredEnvironment, ghost.id);
    assert.ok(Array.isArray(ghost.activeConditions) && ghost.activeConditions.length, ghost.id);
    assert.ok(Array.isArray(ghost.abilities) && ghost.abilities.length, ghost.id);
    assert.ok(Array.isArray(ghost.weaknesses) && ghost.weaknesses.length, ghost.id);
    assert.ok(Array.isArray(ghost.variants) && ghost.variants.length, ghost.id);
    assert.ok(Array.isArray(ghost.masteryChallenges) && ghost.masteryChallenges.length === 3, ghost.id);
  }
});

test('Index Rank 1–100 and its ten milestones are reachable and dedupe-safe', () => {
  assert.equal(indexRank(0), 1);
  assert.equal(indexRank(80), 100);
  assert.equal(INDEX_RANK_MILESTONES.length, 10);
  const index = new GhostIndex({});
  for (const ghost of GHOSTS) {
    index.discover(ghost.id, 1);
    for (const type of ghost.requiredEvidence) index.addEvidence(ghost.id, type);
    index.document(ghost.id);
  }
  assert.equal(index.completion().documented, 80);
  assert.equal(index.completion().total, 80);
  const rewards = index.rewards();
  const rankRewards = rewards.filter((reward) => reward.rank);
  assert.equal(rankRewards.length, 10);
  assert.deepEqual(rankRewards.map((r) => r.rank), [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  for (const reward of rewards) assert.equal(index.claim(reward.id).ok, true);
  assert.deepEqual(index.rewards(), []);
  assert.equal(index.query({ pageSize: 24 }).total, 80);
});

test('Sanity 3.0 keeps Sanity, Exposure and Focus independent and non-lethal', () => {
  const meter = new SanityMeter({ value: 60, settings: { exposureEnabled: true } });
  meter.beginRun();
  assert.equal(meter.exposure, 0);
  assert.equal(meter.focus, SANITY_MAX);
  meter.setZone('veil');
  for (let i = 0; i < 8; i += 1) meter.tick(0.25);
  assert.ok(meter.exposure > 0, 'exposure rises in supernatural zones');
  const exposure = meter.exposure;
  meter.setZone('safe');
  for (let i = 0; i < 8; i += 1) meter.tick(0.25);
  assert.ok(meter.exposure < exposure, 'exposure decays in safe zones');
  assert.ok(meter.focus > 0);
  const spent = meter.spendFocus(10);
  assert.equal(spent.ok, true);
  assert.equal(spent.focus, 90);
  const denied = meter.spendFocus(1000);
  assert.equal(denied.ok, false);
  assert.equal(denied.focus, 90);
  meter.setValue(0);
  const rescue = meter.rescue();
  assert.equal(rescue.nonLethal, true);
  assert.equal(meter.value, 24);
  assert.ok(meter.value > 0 && meter.value < 100);
  assert.equal(meter.snapshot().exposure, Math.round(meter.exposure * 10) / 10);
  assert.equal(meter.snapshot().focus, Math.round(meter.focus * 10) / 10);
});

test('disabled exposure never accumulates and disabled sanity never drains', () => {
  const meter = new SanityMeter({ value: 60, settings: { exposureEnabled: false, enabled: false } });
  meter.beginRun();
  meter.setZone('veil');
  for (let i = 0; i < 12; i += 1) meter.tick(0.25);
  assert.equal(meter.exposure, 0);
  assert.equal(meter.value, 60);
  assert.equal(meter.rescue(), null);
  assert.equal(SANITY_CONSUMABLES.length, 6);
});

test('procedural investigations are deterministic, validated and always completable', () => {
  const generator = new E.InvestigationGenerator();
  const a = generator.generate('stable-seed', 12, { difficulty: 'hard' });
  const b = generator.generate('stable-seed', 12, { difficulty: 'hard' });
  assert.equal(a.ok, true);
  assert.deepEqual(a.mission, b.mission);
  assert.equal(generator.validate(a.mission).ok, true);
  assert.ok(a.mission.ghostPool.every((id) => GHOSTS.some((g) => g.id === id)));
  assert.ok(E.eternalStage(a.mission.stage));
  assert.equal(a.mission.generated, true);
  assert.ok(a.mission.id.startsWith('gen:'));
  for (let level = 1; level <= 25; level += 1) {
    const result = generator.generate(`seed-${level}`, level, { difficulty: level % 2 ? 'normal' : 'nightmare' });
    assert.equal(result.ok, true, `level ${level}`);
    assert.equal(generator.validate(result.mission).ok, true, `level ${level}`);
    assert.ok(result.mission.evidenceGoal >= 1);
    assert.ok(result.mission.reward.spiritShards > 0);
  }
  const fallback = generator.fallback();
  assert.equal(generator.validate(fallback).ok, true);
  assert.equal(fallback.fallback, true);
  const bogus = generator.generate('bogus', 1, { classification: 'not-a-class' });
  assert.equal(bogus.ok, true);
});

test('controller closes generated cases once and pays exactly once', () => {
  const veil = new VeilController({ save: {} });
  const controller = new E.EternalController({ save: {}, veil });
  controller.unlock();
  const generated = controller.generateCase({ seed: 'case-one' });
  assert.equal(generated.ok, true);
  const mission = generated.mission;
  assert.equal(controller.save.investigations.activeCase, mission.id);
  const incomplete = controller.completeCase(mission.id, { steps: mission.steps.slice(0, 1), evidence: 1 });
  assert.equal(incomplete.reason, 'incomplete');
  const done = controller.completeCase(mission.id, { steps: mission.steps, evidence: mission.evidenceGoal });
  assert.equal(done.ok, true);
  assert.equal(controller.completeCase(mission.id, { steps: mission.steps, evidence: mission.evidenceGoal }).reason, 'duplicate');
  assert.equal(controller.save.investigations.completed.length, 1);
  assert.equal(controller.save.stats.completedCases, 1);
});

test('Spectral Pursuit supports seven variants, objectives and one reward', () => {
  assert.equal(HUNT_VARIANTS.length, 7);
  for (const variant of HUNT_VARIANTS) {
    const hunt = E.createHunt({ variant: variant.id }, 10, { seed: `hunt-${variant.id}` });
    assert.equal(hunt.variant, variant.id);
    assert.ok(hunt.entities.length >= 1);
    assert.equal(hunt.objectives.length, 6);
    for (const objective of hunt.objectives) E.advanceHunt(hunt, objective.id, true);
    const completed = E.completeHunt(hunt, { timeMs: 1000 });
    assert.equal(completed.ok, true);
  }
  const config = E.sanitizeHuntConfig({ duration: 99999, difficulty: 'nope', variant: 'nope', antiJumpscare: false });
  assert.equal(config.duration, 900);
  assert.equal(config.variant, 'standard');
  assert.equal(config.difficulty, 'normal');
  assert.equal(config.antiJumpscare, false);

  const controller = new E.EternalController({ save: {}, veil: new VeilController({ save: {} }) });
  controller.unlock();
  const started = controller.startHunt({ variant: 'advanced', chapter: 'midnight_city' });
  assert.equal(started.ok, true);
  started.hunt.objectives.forEach((objective) => { objective.done = true; });
  const result = controller.completeHunt({ timeMs: 5000 });
  assert.equal(result.ok, true);
  assert.equal(controller.save.hunts.history.length, 1);
  assert.equal(controller.completeHunt({ timeMs: 5000 }).ok, false);
});

test('workshop has 12 items in 6 categories, five tiers and measured costs', () => {
  assert.equal(ETERNAL_EQUIPMENT.length, 12);
  assert.equal(E.EQUIPMENT_CATEGORIES.length, 6);
  for (const item of ETERNAL_EQUIPMENT) {
    assert.equal(item.tiers.length, 5);
    const cost = E.equipmentCost(item.id, 2);
    assert.ok(cost.spiritShards > 0);
    assert.equal(cost.tier, 2);
    assert.equal(E.equipmentCost(item.id, 1), null);
  }
  const veil = new VeilController({ save: {} });
  const controller = new E.EternalController({ save: {}, veil });
  assert.equal(controller.upgradeEquipment('resonance_scanner').reason, 'funds');
  veil.progression.currencies.spiritShards = 100000;
  const upgraded = controller.upgradeEquipment('resonance_scanner');
  assert.equal(upgraded.ok, true);
  assert.equal(upgraded.tier, 2);
  assert.equal(controller.save.workshop.tiers.resonance_scanner, 2);
  const before = veil.progression.currencies.spiritShards;
  assert.equal(controller.upgradeEquipment('resonance_scanner').ok, true);
  assert.ok(veil.progression.currencies.spiritShards < before, 'each tier is paid once');
  for (let i = 0; i < 4; i += 1) controller.upgradeEquipment('resonance_scanner');
  assert.equal(controller.upgradeEquipment('resonance_scanner').reason, 'maxed');
});

test('world event director activates, completes, journals and replays without double rewards', () => {
  const controller = new E.EternalController({ save: {}, veil: new VeilController({ save: {} }) });
  controller.unlock();
  const event = WORLD_EVENTS[0];
  assert.equal(controller.activateEvent(event.id, 1000).event.id, event.id);
  assert.equal(controller.activateEvent(WORLD_EVENTS[1].id).ok, false);
  const def = E.WORLD_EVENTS_BY_ID[event.id];
  def.objectives.forEach((_, index) => controller.contributeEvent(index));
  const result = controller.completeEvent();
  assert.equal(result.ok, true);
  assert.equal(controller.save.events.journal.includes(event.id), true);
  assert.equal(controller.save.events.completed.includes(event.id), true);
  const reward = controller.veil.progression.currencies.spiritShards;
  assert.ok(reward > 0);
  controller.activateEvent(event.id, 2000);
  def.objectives.forEach((_, index) => controller.contributeEvent(index));
  const replay = controller.completeEvent();
  assert.equal(replay.ok, false);
  assert.equal(replay.reason, 'duplicate');
  assert.equal(controller.veil.progression.currencies.spiritShards, reward);
});

test('expedition roles, reconnect, votes, team sanity and once-only rewards work', () => {
  const model = new E.GhostResearchExpedition({});
  assert.equal(E.EXPEDITION_ROLES.length, 5);
  const session = model.create({ seed: 'coop-one', difficulty: 'hard' });
  assert.equal(session.members.length, 1);
  const joined = model.join(session.id, 'guest', 'archivist');
  assert.equal(joined.ok, true);
  assert.ok(joined.token);
  assert.equal(model.join(session.id, 'third', 'guardian').ok, true);
  assert.equal(model.join(session.id, 'fourth', 'tech').ok, true);
  assert.equal(model.join(session.id, 'fifth', 'medium').reason, 'full');
  assert.equal(model.reconnect(session.id, 'guest', joined.token).ok, true);
  assert.equal(model.reconnect(session.id, 'guest', 'bad-token').reason, 'token');
  const vote = model.vote(session.id, 'guest', 'midnight_city');
  assert.equal(vote.winner, 'midnight_city');
  const team = model.teamSanity(session.id);
  assert.equal(team.length, 4);
  assert.ok(team.every((member) => member.sanity === 100), 'team display never merges individual sanity');
  assert.equal(model.completeTask(session.id, 'mechanisms').ok, true);
  const completed = model.complete(session.id);
  assert.equal(completed.ok, true);
  assert.equal(model.complete(session.id).reason, 'duplicate');
});

test('performance monitor records real samples and emits threshold warnings', () => {
  const monitor = new E.EternalPerfMonitor({ enabled: true });
  const good = monitor.sample({ frameMs: 16.6, fps: 60, ghosts: 2, aiUpdates: 4, pathRequests: 1, particles: 30, audioEmitters: 4, sections: 2, heapMb: 120, latencyMs: 30, replicationKb: 4, saveMs: 5 });
  assert.equal(good.warnings.length, 0);
  const bad = monitor.sample({ frameMs: 48, fps: 20, ghosts: 12, aiUpdates: 40, pathRequests: 12, particles: 900, audioEmitters: 60, sections: 14, heapMb: 900, latencyMs: 400, replicationKb: 200, saveMs: 120 });
  assert.ok(bad.warnings.length >= 8);
  const snap = monitor.snapshot();
  assert.equal(snap.samples, undefined);
  assert.equal(snap.last.fps, 20);
  assert.equal(snap.enabled, true);
  monitor.recordPath(3);
  monitor.recordAi(5);
  monitor.recordSave(12);
  assert.equal(monitor.snapshot().counters.pathRequests, 3);
});

test('Eternal save sanitizer repairs junk, keeps valid data and stays separate from Arc IX', () => {
  const raw = {
    schemaVersion: 1,
    campaign: {
      unlocked: true,
      completedStages: ['midnight_city_1', 'bogus_stage'],
      bossClears: ['clockless_mayor', 'bogus_boss'],
      chapterClears: ['midnight_city', 'bogus_chapter'],
      finalBoss: false,
      deaths: -4, runs: '9',
    },
    hunts: { config: { variant: 'ancient', duration: 9999 }, history: [{ id: 'hunt:x', variant: 'ancient', entities: ['ash_guardian'] }], runs: 2 },
    workshop: { tiers: { resonance_scanner: 12, veil_compass: 3, bogus: 5 }, loadout: ['resonance_scanner', 'bogus'] },
    investigations: { generated: [{ id: 'bad' }], completed: ['bad'] },
    events: { completed: ['midnight_disturbance', 'bogus'], journal: ['midnight_disturbance'], claimed: ['x'] },
    rankRewards: ['rank_10', 'bogus'],
    achievements: ['eternal_first', 'bogus'],
  };
  const save = E.sanitizeEternalSave(raw);
  assert.equal(save.schemaVersion, 1);
  assert.deepEqual(save.campaign.completedStages, ['midnight_city_1']);
  assert.deepEqual(save.campaign.bossClears, ['clockless_mayor']);
  assert.deepEqual(save.campaign.chapterClears, ['midnight_city']);
  assert.equal(save.campaign.deaths, 0);
  assert.equal(save.campaign.runs, 9);
  assert.equal(save.hunts.config.duration, 900);
  assert.equal(save.workshop.tiers.resonance_scanner, 5);
  assert.equal(save.workshop.tiers.bogus, undefined);
  assert.deepEqual(save.workshop.loadout, ['resonance_scanner']);
  assert.deepEqual(save.investigations.generated, []);
  assert.deepEqual(save.rankRewards, ['rank_10']);
  assert.deepEqual(save.achievements, ['eternal_first']);
  assert.equal(Object.hasOwn(save, 'ghostIndex'), false, 'Arc X never writes Arc IX index fields');
  assert.equal(Object.hasOwn(save, 'sanity'), false, 'Arc X never writes Arc IX sanity fields');
});

test('dashboard exposes twelve real sections and Arc X settings clamp', () => {
  const veil = new VeilController({ save: {} });
  const controller = new E.EternalController({ save: {}, veil });
  const board = controller.dashboard();
  for (const key of ['overview', 'campaign', 'index', 'sanity', 'investigations', 'equipment', 'missions', 'achievements', 'leaderboards', 'multiplayer', 'settings', 'rewards']) {
    assert.ok(board[key] !== undefined, key);
  }
  assert.equal(board.overview.chapters, 0);
  assert.equal(board.overview.totalGhosts, 80);
  const settings = E.sanitizeEternalSettings({ hunts: { duration: '9999' }, performance: { overlay: 'yes' }, sanity: { exposureGain: 9 } });
  assert.equal(settings['hunts.duration'], '300');
  assert.equal(settings['performance.overlay'], false);
  assert.equal(settings['sanity.exposureGain'], 2);
  const changed = E.setEternalSetting(settings, 'eternal.performance.overlay', true);
  assert.equal(changed['performance.overlay'], true);
  const presentation = E.resolveEternalPresentation(settings, { reducedMotion: true });
  assert.equal(presentation.motion, 'reduced');
  assert.equal(presentation.sanity.exposureGain, 2);
});
