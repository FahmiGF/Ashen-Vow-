// Update XIII — The Veil of the Forgotten: pure model coverage.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VEIL_CHAPTERS, VEIL_STAGES, VEIL_BOSSES, GHOSTS, GHOST_CLASSIFICATIONS, SANITY_CONDITIONS,
  SANITY_CONSUMABLES, SANITY_EVENTS, MIND_UPGRADES, EVIDENCE_TYPES, VEIL_CURRENCIES,
  VEIL_SETTING_DEFINITIONS, VEIL_FACILITIES,
} from '../src/veil.js';
import * as V from '../src/veil.js';

test('campaign shape: 6 chapters, 30 stages, 7 bosses with a five-phase finale', () => {
  assert.equal(VEIL_CHAPTERS.length, 6);
  assert.equal(VEIL_STAGES.length, 30);
  for (const chapter of VEIL_CHAPTERS) {
    assert.equal(V.stagesForChapter(chapter.id).length, 5, chapter.id);
  }
  assert.equal(new Set(VEIL_STAGES.map((s) => s.id)).size, 30);
  assert.equal(new Set(VEIL_STAGES.map((s) => s.room)).size, 30);
  assert.equal(VEIL_BOSSES.length, 7);
  const final = V.veilBoss('veil_architect');
  assert.equal(final.maxPhases, 5);
  assert.deepEqual(final.phaseThresholds, [0.8, 0.6, 0.4, 0.2]);
  for (const boss of VEIL_BOSSES) {
    for (let phase = 2; phase <= boss.maxPhases; phase += 1) {
      assert.ok(boss.dialogueData[`phase${phase}`], `${boss.id} phase ${phase}`);
    }
    assert.ok(boss.dialogueData.intro && boss.dialogueData.defeat, boss.id);
  }
});

test('campaign gates are sequential and chapter bosses need all five stages', () => {
  const progress = { completedStages: [], bossClears: [], finalBoss: false };
  assert.equal(V.stageUnlocked('vesper_hollow_1', progress), true);
  assert.equal(V.stageUnlocked('vesper_hollow_2', progress), false);
  assert.equal(V.stageUnlocked('mourning_hospital_1', progress), false);
  progress.completedStages.push('vesper_hollow_1');
  assert.equal(V.stageUnlocked('vesper_hollow_2', progress), true);
  assert.equal(V.bossUnlocked('pale_mayor', progress), false);
  for (const stage of V.stagesForChapter('vesper_hollow')) progress.completedStages.push(stage.id);
  assert.equal(V.bossUnlocked('pale_mayor', progress), true);
  progress.bossClears.push('pale_mayor');
  assert.equal(V.chapterUnlocked('mourning_hospital', progress), true);
  assert.equal(V.chapterUnlocked('veil_citadel', progress), false);
});

test('every stage spawns exactly 20 enemies: 19 normal + 1 guaranteed elite, 4 archetypes', () => {
  for (const stage of VEIL_STAGES) {
    const plan = V.veilStageEnemies(stage.id);
    assert.equal(plan.length, 20, stage.id);
    assert.equal(plan.filter((d) => d.elite).length, 1, stage.id);
    assert.equal(plan.filter((d) => !d.elite).length, 19, stage.id);
    assert.deepEqual(new Set(plan.map((d) => d.type)), new Set(stage.archetypes));
    assert.equal(stage.archetypes.length, 4);
  }
  const room = V.veilRoom('vesper_hollow_1');
  assert.equal(room.index, 9400);
  assert.ok(room.platforms.length >= 4);
  assert.deepEqual(room.spawn, { x: 120, y: 548 });
});

test('sanity has seven conditions, all bands covered, and can never kill', () => {
  assert.equal(SANITY_CONDITIONS.length, 7);
  assert.deepEqual(SANITY_CONDITIONS.map((c) => c.id), ['veil_touched', 'critical', 'unsettled', 'disturbed', 'uneasy', 'stable', 'clear']);
  for (let value = 0; value <= 100; value += 1) {
    const condition = V.sanityCondition(value);
    assert.ok(condition && value >= condition.min && value <= condition.max, String(value));
    assert.notEqual(condition.effects?.lethal, true);
  }
  const meter = new V.SanityMeter({});
  meter.setValue(0);
  assert.equal(meter.veilTouched, true);
  assert.equal(meter.condition.id, 'veil_touched');
  const rescue = meter.rescue();
  assert.ok(rescue && rescue.nonLethal === true);
  assert.ok(meter.value > 0);
  assert.notEqual(meter.value, 0);
});

test('sanity zones drain batched, safe zones recover, and disabled drains nothing', () => {
  const meter = new V.SanityMeter({ value: 50, zone: 'haunted' });
  const before = meter.value;
  for (let i = 0; i < 8; i += 1) meter.tick(0.25);
  assert.ok(meter.value < before);
  const safe = new V.SanityMeter({ value: 50, zone: 'safe' });
  safe.tick(1);
  assert.ok(safe.value > 50);
  const off = new V.SanityMeter({ value: 50, zone: 'veil', settings: { enabled: false } });
  off.tick(4);
  assert.equal(off.value, 50);
  off.setValue(0);
  assert.equal(off.rescue(), null, 'disabled sanity never forces a rescue state');
});

test('sanity events respect cooldowns and never repeat per frame', () => {
  const meter = new V.SanityMeter({ value: 60 });
  const first = meter.applyEvent('haunted_room');
  assert.equal(first.ok, true);
  const second = meter.applyEvent('haunted_room');
  assert.equal(second.ok, false);
  assert.equal(second.reason, 'cooldown');
  meter.clock += 13;
  assert.equal(meter.applyEvent('haunted_room').ok, true);
  assert.ok(SANITY_EVENTS.haunted_room.delta < 0);
});

test('sanity consumables consume, heal, respect cooldown and empty inventory', () => {
  const meter = new V.SanityMeter({ value: 30 });
  const inventory = { breathing_tonic: 2 };
  const used = meter.useConsumable('breathing_tonic', inventory);
  assert.equal(used.ok, true);
  assert.equal(inventory.breathing_tonic, 1);
  assert.ok(meter.value > 30);
  const again = meter.useConsumable('breathing_tonic', inventory);
  assert.equal(again.ok, false);
  assert.equal(again.reason, 'cooldown');
  const none = meter.useConsumable('veil_anchor', {});
  assert.equal(none.reason, 'empty');
  assert.equal(SANITY_CONSUMABLES.length, 6);
});

test('temporary conditions stack, cap and expire', () => {
  const meter = new V.SanityMeter({ value: 60 });
  assert.equal(meter.addCondition('chill').ok, true);
  assert.equal(meter.addCondition('chill').stacks, 2);
  assert.equal(meter.addCondition('chill').stacks, 3);
  assert.equal(meter.addCondition('chill').reason, 'max-stacks');
  assert.equal(meter.addCondition('whisper').ok, true);
  assert.equal(meter.addCondition('whisper').reason, 'already');
  for (let i = 0; i < 30; i += 1) meter.tickConditions(1);
  assert.equal(meter.conditions.size, 0);
});

test('Mind & Spirit ranks gate prerequisites, refund correctly and feed sanity', () => {
  const state = { points: 2, spent: 0, ranks: {} };
  assert.equal(V.spendMindPoint(state, 'ghost_scholar').reason, 'requires');
  assert.equal(V.spendMindPoint(state, 'mental_anchor').ok, true);
  assert.equal(state.points, 1);
  const low = { points: 0, spent: 0, ranks: { mental_anchor: 1 } };
  assert.equal(V.spendMindPoint(low, 'calm_presence').reason, 'points');
  const respec = V.respecMind({ points: 0, spent: 3, ranks: { mental_anchor: 2 } });
  assert.equal(respec.refunded, 3);
  assert.equal(respec.points, 3);
  assert.equal(MIND_UPGRADES.length, 8);
  const bonuses = V.mindBonuses({ mental_anchor: 3, calm_presence: 2 });
  assert.ok(bonuses.sanityDrain < 1 && bonuses.sanityRecovery > 1);
});

test('Ghost Index ships 74 standard + 6 secret records, every classification filled', () => {
  assert.equal(GHOSTS.length, 80);
  assert.equal(GHOSTS.filter((g) => !g.secret).length, 74);
  assert.equal(GHOSTS.filter((g) => g.secret).length, 6);
  for (const classification of GHOST_CLASSIFICATIONS) {
    assert.ok(GHOSTS.filter((g) => g.classification === classification.id).length >= 5, classification.id);
  }
  assert.equal(EVIDENCE_TYPES.length, 8);
  for (const ghost of GHOSTS) {
    assert.ok(ghost.requiredEvidence.length >= 3, ghost.id);
    assert.equal(ghost.lore.length, 4);
  }
});

test('research progresses rumored → encountered → identified → investigated → documented → mastered', () => {
  const index = new V.GhostIndex({});
  const ghost = GHOSTS.find((g) => !g.secret);
  assert.equal(index.stageOf(ghost.id), 'rumored');
  assert.equal(index.identify(ghost.id).reason, 'not-encountered');
  assert.equal(index.discover(ghost.id, 12).ok, true);
  assert.equal(index.stageOf(ghost.id), 'encountered');
  assert.equal(index.addEvidence(ghost.id, 'boss_record').reason, 'wrong-evidence');
  assert.equal(index.addEvidence(ghost.id, ghost.requiredEvidence[0]).ok, true);
  assert.equal(index.addEvidence(ghost.id, ghost.requiredEvidence[0]).reason, 'duplicate');
  assert.equal(index.document(ghost.id).reason, 'missing-evidence');
  for (const type of ghost.requiredEvidence.slice(1)) assert.equal(index.addEvidence(ghost.id, type).ok, true);
  assert.equal(index.identify(ghost.id).ok, true);
  assert.equal(index.document(ghost.id).ok, true);
  assert.equal(index.master(ghost.id).ok, true);
  assert.equal(index.document(ghost.id).ok, true);
  assert.equal(index.stageOf(ghost.id), 'mastered');
});

test('Ghost Index query filters, sorts, hides undiscovered names and paginates', () => {
  const index = new V.GhostIndex({});
  const page = index.query({ page: 1, pageSize: 12 });
  assert.equal(page.total, 80);
  assert.equal(page.pages, 7);
  assert.equal(page.rows.length, 12);
  assert.equal(page.rows[0].name, '???');
  const wraiths = index.query({ classification: 'wraith', pageSize: 48 });
  assert.ok(wraiths.rows.length >= 5);
  assert.ok(wraiths.rows.every((row) => row.classification === 'wraith'));
  const search = index.query({ search: 'lonceng', pageSize: 48 });
  assert.ok(search.rows.length >= 1);
  const hidden = index.query({ search: 'lonceng', spoilers: true, pageSize: 48 });
  assert.ok(hidden.rows.every((row) => row.name !== '???'));
  index.discover(GHOSTS[0].id, 1);
  const seen = index.query({ research: 'encountered', pageSize: 48 });
  assert.equal(seen.rows.length, 1);
});

test('Ghost Index completion and rewards are dedupe-safe', () => {
  const index = new V.GhostIndex({});
  const counts = index.counts();
  assert.equal(counts.standard, 74);
  assert.equal(counts.secret, 6);
  assert.equal(index.completion().percent, 0);
  assert.deepEqual(index.rewards(), []);
  for (const ghost of GHOSTS.filter((g) => !g.secret).slice(0, 10)) {
    index.discover(ghost.id, 1);
    for (const type of ghost.requiredEvidence) index.addEvidence(ghost.id, type);
    index.document(ghost.id);
  }
  const rewards = index.rewards();
  assert.equal(rewards.length, 2);
  assert.deepEqual(rewards.map((r) => r.id), ['index_ten', 'rank_10']);
  assert.equal(index.claim('index_ten').ok, true);
  assert.equal(index.claim('rank_10').ok, true);
  assert.equal(index.claim('rank_10').reason, 'duplicate');
  assert.equal(index.rewards().length, 0);
  assert.equal(index.completion().standardPercent > 0, true);
});

test('investigation cases require every step and pay exactly once', () => {
  const def = V.INVESTIGATION_CASES[0];
  const progression = new V.VeilProgression({});
  assert.equal(V.resolveInvestigation(def, { steps: ['detect'], evidence: 1 }, progression).reason, 'incomplete');
  const result = V.resolveInvestigation(def, { steps: def.steps, evidence: def.evidenceGoal }, progression);
  assert.equal(result.ok, true);
  const before = progression.currencies.spiritShards;
  assert.ok(before > 0);
  const again = V.resolveInvestigation(def, { steps: def.steps, evidence: def.evidenceGoal }, progression);
  assert.equal(again.ok, false);
  assert.equal(again.reason, 'duplicate');
  assert.equal(progression.currencies.spiritShards, before);
});

test('daily and weekly mission rotation is deterministic and progress clamps', () => {
  const a = V.dailyRotation('2026-11-20');
  const b = V.dailyRotation('2026-11-20');
  assert.deepEqual(a.map((m) => m.id), b.map((m) => m.id));
  assert.equal(a.length, 3);
  assert.notDeepEqual(a.map((m) => m.id), V.dailyRotation('2026-11-21').map((m) => m.id));
  assert.equal(V.weeklyRotation('W47').length, 2);
  const progress = V.missionProgress(V.DAILY_MISSIONS[0], { evidence: 99 });
  assert.deepEqual(progress, { current: 3, target: 3, complete: true, percent: 100 });
});

test('currency awards clamp, dedupe transactions and unlock achievements once', () => {
  const progression = new V.VeilProgression({});
  const first = progression.award('spiritShards', 50, 'tx:one');
  assert.equal(first.ok, true);
  assert.equal(first.total, 50);
  assert.equal(progression.award('spiritShards', 50, 'tx:one').reason, 'duplicate');
  assert.equal(progression.award('unknown', 50).reason, 'unknown-currency');
  progression.addMetric('encounters', 1);
  const unlocked = progression.checkAchievements();
  assert.equal(unlocked.length, 1);
  assert.equal(progression.achievements.includes('first_contact'), true);
  assert.ok(progression.currencies.spiritShards > 50);
  const before = progression.currencies.spiritShards;
  progression.checkAchievements();
  assert.equal(progression.currencies.spiritShards, before);
  assert.equal(progression.level().level, 1);
});

test('leaderboards reject unverified and duplicate submissions and split difficulties', () => {
  const boards = new V.VeilLeaderboards({});
  const raw = { boardId: 'fastest_clear', difficulty: 'hard', submissionId: 's1', timeMs: 120000, player: 'Ilse', serverValidated: false, submittedAt: 0 };
  assert.equal(boards.submit(raw).reason, 'unverified');
  raw.serverValidated = true;
  assert.equal(boards.submit(raw).ok, true);
  assert.equal(boards.submit(raw).reason, 'duplicate');
  boards.submit({ ...raw, submissionId: 's2', timeMs: 90000 });
  boards.submit({ ...raw, submissionId: 's3', timeMs: 60000 });
  boards.submit({ ...raw, submissionId: 's4', difficulty: 'normal', timeMs: 5000 });
  const hard = boards.board('fastest_clear', 'hard');
  assert.equal(hard.length, 3);
  assert.equal(hard[0].metric, 60000);
  assert.equal(hard[0].rank, 1);
  assert.equal(boards.board('fastest_clear', 'normal').length, 1);
  assert.equal(V.sanitizeSubmission({ boardId: 'nope' }).reason, 'unknown-board');
});

test('save sanitizer strips junk, keeps progress, and never touches the campaign key', () => {
  const save = V.sanitizeVeilSave({
    schemaVersion: 99,
    campaign: { completedStages: ['vesper_hollow_1', 'bogus'], bossClears: ['pale_mayor', 'bogus'], finalBoss: false, deaths: -4 },
    sanity: { value: 900, settings: { drainMultiplier: 99 } },
    progression: { currencies: { spiritShards: -10, veilFragments: 5 } },
    ghostIndex: { records: { bogus: { stage: 'mastered' }, pale_resident: { stage: 'documented', evidence: ['visual', 'hacked'] } } },
    investigation: { completedCases: ['vesper_hollow_case_1', 'fake'] },
    secrets: ['the_seventh_bell', 'nope'],
  });
  assert.equal(save.campaign.completedStages.length, 1);
  assert.equal(save.campaign.bossClears.length, 1);
  assert.equal(save.campaign.deaths, 0);
  assert.equal(save.sanity.value, 100);
  assert.equal(save.sanity.settings.drainMultiplier, 2);
  assert.equal(save.progression.currencies.spiritShards, 0);
  assert.equal(save.progression.currencies.veilFragments, 5);
  assert.equal(Object.keys(save.ghostIndex.records).length, 1);
  assert.deepEqual(save.ghostIndex.records.pale_resident.evidence, ['visual']);
  assert.deepEqual(save.investigation.completedCases, ['vesper_hollow_case_1']);
  assert.deepEqual(save.secrets, ['the_seventh_bell']);
  assert.equal(V.VEIL_SAVE_KEY, 'ashen-vow-veil-v1');
});

test('save migration upgrades v1 without deleting earned progress', () => {
  const result = V.migrateVeilSave({
    schemaVersion: 1,
    campaign: { completedStages: ['vesper_hollow_1'], bossClears: [] },
    ghostIndex: { records: { pale_resident: { stage: 'documented', evidence: ['visual'] } } },
    progression: { currencies: { spiritShards: 120 } },
  });
  assert.equal(result.migrated, true);
  assert.equal(result.save.schemaVersion, V.VEIL_SAVE_VERSION);
  assert.deepEqual(result.save.campaign.completedStages, ['vesper_hollow_1']);
  assert.equal(result.save.progression.currencies.spiritShards, 120);
  assert.equal(result.save.ghostIndex.records.pale_resident.stage, 'documented');
  assert.equal(result.save.flags.migratedV1, true);
  assert.ok(result.log.length >= 1);
});

test('veil settings clamp, persist by path and respect accessibility overrides', () => {
  assert.equal(VEIL_SETTING_DEFINITIONS.length >= 28, true);
  const settings = V.sanitizeVeilSettings({ sanity: { drainMultiplier: 99, enabled: false }, 'ghosts.maxConcurrent': 9, 'index.pageSize': '999' });
  assert.equal(settings.sanity.drainMultiplier, 2);
  assert.equal(settings.sanity.enabled, false);
  assert.equal(settings['ghosts.maxConcurrent'], 5);
  assert.equal(settings['index.pageSize'], '24');
  assert.equal(V.setVeilSetting(settings, 'veil.sanity.warningThreshold', 999), settings);
  assert.equal(settings.sanity.warningThreshold, 60);
  assert.equal(V.setVeilSetting(settings, 'veil.nope', 1), null);
  const presentation = V.resolveVeilPresentation({ 'antiJumpscare.enabled': true }, {
    accessibility: { reducedMotion: true }, graphicsPreset: 'low',
  });
  assert.equal(presentation.visual.distortion, false);
  assert.equal(presentation.visual.cameraKick, false);
  assert.equal(presentation.audio.unexpected, false);
  assert.equal(presentation.visual.particles, 0.4);
  assert.equal(presentation.antiJumpscare, true);
});

test('ghost AI attacks once per window, refuses walls and never clips out of bounds', () => {
  const nav = { groundAt: () => ({ y: 600 }), lineOfSight: () => true };
  const entity = {
    x: 400, y: 540, w: 38, h: 52, minX: 100, maxX: 900, speed: 90, hp: 60, maxHp: 60,
    attackRange: 44, sightRange: 300, hearingRange: 200, attackCooldown: 2.2, hostile: true,
    ghostVisible: true,
  };
  const brain = new V.GhostBrain({ classification: 'wraith', behavior: 'pursuit' }, { nav, id: 'test' });
  const player = { x: 405, y: 540, w: 30, h: 46 };
  let attacks = 0;
  for (let i = 0; i < 10; i += 1) {
    const view = brain.update(1 / 60, { entity, player, nav, los: true });
    if (view.attack) attacks += 1;
  }
  assert.equal(attacks, 1);
  assert.equal(brain.attacks, 1);
  assert.equal(entity.x <= entity.maxX, true);
  assert.equal(entity.x >= entity.minX, true);

  const wallNav = { groundAt: () => null, lineOfSight: () => false };
  const blocked = new V.GhostBrain({ classification: 'shade', behavior: 'roaming' }, { nav: wallNav, id: 'wall' });
  const wallEntity = { ...entity, x: 300, minX: 100, maxX: 900, aiState: 'idle' };
  for (let i = 0; i < 120; i += 1) blocked.update(1 / 60, { entity: wallEntity, player: { x: 800, y: 540, w: 30, h: 46 }, nav: wallNav, los: false });
  assert.equal(wallEntity.x, 300, 'blocked navigation never teleports through geometry');
  assert.equal(blocked.state.length > 0, true);
});

test('manifestation pool, encounter director and replication dedupe work', () => {
  const pool = new V.GhostManifestation(4);
  const a = pool.acquire('ghost_a', 'wraith');
  pool.acquire('ghost_b', 'shade');
  assert.equal(pool.acquire('ghost_a', 'wraith').id, a.id);
  assert.equal(pool.reuseCount, 1);
  assert.equal(pool.stats().active, 2);
  pool.release('ghost_a');
  assert.equal(pool.stats().active, 1);

  const director = new V.GhostEncounterDirector({ maxConcurrent: 1, encounterCooldown: 10 });
  assert.equal(director.request('a').ok, true);
  assert.equal(director.request('b').reason, 'concurrent');
  assert.equal(director.request('a').reason, 'duplicate');
  director.tick(1);
  assert.deepEqual(director.snapshot().active, ['a']);
  director.tick(30);
  assert.equal(director.count, 0);

  const replication = new V.GhostReplication();
  const snapshot = { session: 's1', ghosts: [{ uid: 'g1', kind: 'wraith', x: 1, y: 2, hp: 10, state: 'pursuing' }] };
  assert.equal(replication.apply(snapshot).applied.length, 1);
  assert.equal(replication.apply(snapshot).duplicate.length, 1);
  assert.deepEqual(replication.reconnect().existing, ['s1:g1']);
});

test('controller completes stages and bosses once and records the finale', () => {
  const controller = new V.VeilController({});
  const started = controller.startStage('vesper_hollow_1');
  assert.equal(started.ok, true);
  const first = controller.completeStage('vesper_hollow_1', { clean: true, antiJumpscare: true });
  assert.equal(first.first, true);
  const second = controller.completeStage('vesper_hollow_1', {});
  assert.equal(second.first, false);
  assert.equal(controller.save.campaign.completedStages.filter((id) => id === 'vesper_hollow_1').length, 1);
  assert.ok(controller.progression.currencies.spiritShards > 0);
  assert.equal(controller.progression.metrics.cleanStages, 1);

  const locked = controller.startBoss('veil_architect');
  assert.equal(locked.reason, 'locked');
  controller.save.campaign.completedStages = V.VEIL_STAGES.filter((s) => s.chapter === 'veil_citadel').map((s) => s.id);
  controller.save.campaign.bossClears = ['pale_mayor', 'silent_surgeon', 'forest_widow', 'drowned_saint', 'unremembered', 'veil_guardian'];
  const boss = controller.startBoss('veil_architect');
  assert.equal(boss.ok, true);
  assert.equal(boss.spawn.maxPhases, 5);
  assert.equal(controller.defeatBoss('veil_architect', { timeMs: 1000 }).ok, true);
  assert.equal(controller.save.campaign.finalBoss, true);
  assert.equal(controller.progression.metrics.finalBoss, 1);
});

test('controller tick keeps sanity in the save and witnesses ghosts', () => {
  const controller = new V.VeilController({});
  controller.startStage('vesper_hollow_1');
  controller.sanity.setZone('veil');
  const before = controller.sanity.value;
  controller.tick(2);
  assert.ok(controller.sanity.value < before);
  assert.equal(controller.save.sanity.zone, 'veil');
  const ghost = GHOSTS.find((g) => !g.secret);
  assert.equal(controller.witness(ghost.id).ok, true);
  assert.equal(controller.index.stageOf(ghost.id), 'encountered');
  assert.equal(controller.snapshot().summary.totalGhosts, 80);
});

test('summary, hub, secrets, collectibles and performance helpers stay data-driven', () => {
  const summary = V.veilSummary();
  assert.equal(summary.totalStages, 30);
  assert.equal(summary.totalBosses, 7);
  assert.equal(V.VEIL_FACILITIES.length, 10);
  assert.equal(V.VEIL_NPCS.length, 4);
  assert.equal(V.SECRET_LOCATIONS.length, 8);
  assert.equal(V.VEIL_COLLECTIBLES.length, 8);
  assert.equal(V.veilFacilityState({}).length, 10);
  assert.equal(V.veilNpcDialogue('ilse').name, 'Keeper Ilse');
  assert.equal(V.veilSecretForStage('vesper_hollow_5').id, 'the_seventh_bell');
  const totals = V.veilCollectibleTotals({ relics: 5 });
  assert.equal(totals[0].percent, 50);
  const page = V.paginate(Array.from({ length: 25 }, (_, i) => i), 2, 10);
  assert.equal(page.rows.length, 10);
  assert.equal(page.page, 2);
  assert.equal(page.pages, 3);
  assert.deepEqual(V.staggerSchedule(['a', 'b', 'c'], 0, 3), ['a']);
  const pool = V.createPool((i) => ({ id: i, active: false }), 2);
  const first = pool.acquire();
  pool.acquire();
  assert.equal(pool.acquire().id, first.id, 'exhausted pools reuse rather than allocate');
  assert.equal(pool.active, 2);
  assert.equal(VEIL_CURRENCIES.length, 5);
  assert.equal(V.VEIL_SAVE_SCHEMA, 2);
});
