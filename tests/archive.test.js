// Update XV — Stage Archive, Level Checker, Sneak Peek, Ghost/Jumpscare Index.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARCHIVE_STAGES, ARCHIVE_STAGES_BY_ID, ARCHIVE_CHAPTERS, ARCHIVE_BOSSES,
  JUMPSCARE_EVENTS, JUMPSCARE_CATEGORIES, ARCHIVE_TOOLS, GHOST_TOOL_REQUIREMENTS, ARCHIVE_ACHIEVEMENTS,
  ARCHIVE_STAGE_IDS, ARCHIVE_TOOL_IDS, ARCHIVE_BOSS_IDS, JUMPSCARE_EVENT_IDS,
} from '../src/archive_data.js';
import {
  ArchiveController, defaultArchiveSave, sanitizeArchiveSave, StageArchiveManager,
  LevelCheckerService, GhostArchiveManager, JumpscareIndexManager,
  InvestigationEquipmentManager,
} from '../src/archive.js';
import { GhostIndex, defaultVeilSave } from '../src/veil.js';
import { GHOSTS, GHOSTS_BY_ID } from '../src/veil_data.js';
import { ETERNAL_CHAPTERS, ETERNAL_STAGES } from '../src/eternal_data.js';

const veilSave = (overrides = {}) => ({
  ...defaultVeilSave(),
  campaign: { completedStages: [], bossClears: [], chapterClears: [], finalBoss: false, ...(overrides.campaign || {}) },
  equipment: { owned: ['spectral_detector', 'spirit_camera', 'investigator_journal'], mastery: {}, loadout: [] },
});
const eternalSave = (overrides = {}) => ({
  campaign: { unlocked: false, completedStages: [], bossClears: [], chapterClears: [], finalBoss: false, ...(overrides.campaign || {}) },
  workshop: { tiers: {}, purchased: [], loadout: [] },
});

function make({
  veil = veilSave(),
  eternal = eternalSave({ campaign: { unlocked: true } }),
  archive = defaultArchiveSave(),
  index = new GhostIndex({}),
} = {}) {
  const controller = new ArchiveController({
    save: archive,
    veil: { save: veil, index },
    eternal: { save: eternal },
    index,
  });
  // sanitizeArchiveSave() returns a fresh object; tests must inspect the live save.
  return { controller, veil, eternal, archive: controller.save, index };
}

test('the archive derives all 70 Arc IX/X stages, 16 bosses, 80 ghosts and 38 scares', () => {
  assert.equal(ARCHIVE_STAGES.length, 70);
  assert.equal(ARCHIVE_STAGES.filter((s) => s.arcId === 'arc9').length, 30);
  assert.equal(ARCHIVE_STAGES.filter((s) => s.arcId === 'arc10').length, 40);
  assert.equal(ARCHIVE_CHAPTERS.length, 14);
  assert.equal(ARCHIVE_BOSSES.length, 16);
  assert.equal(GHOSTS.length, 80);
  assert.equal(JUMPSCARE_EVENTS.length, 38);
  assert.equal(JUMPSCARE_CATEGORIES.length, 13);
  assert.equal(ARCHIVE_TOOLS.length, 30);
  assert.equal(ARCHIVE_ACHIEVEMENTS.length, 10);
});

test('every published stage, boss, ghost, event and tool reference is valid and unique', () => {
  assert.equal(new Set(ARCHIVE_STAGE_IDS).size, ARCHIVE_STAGE_IDS.length);
  assert.equal(new Set(ARCHIVE_BOSS_IDS).size, ARCHIVE_BOSS_IDS.length);
  assert.equal(new Set(ARCHIVE_TOOL_IDS).size, ARCHIVE_TOOL_IDS.length);
  assert.equal(new Set(JUMPSCARE_EVENT_IDS).size, JUMPSCARE_EVENT_IDS.length);
  for (const stage of ARCHIVE_STAGES) {
    assert.ok(ARCHIVE_STAGES_BY_ID[stage.id]);
    if (stage.bossId) assert.ok(ARCHIVE_BOSS_IDS.includes(stage.bossId));
    for (const id of stage.ghostIds) assert.ok(GHOSTS_BY_ID[id], `${stage.id} → ${id}`);
    for (const id of stage.jumpscareEventIds) assert.ok(JUMPSCARE_EVENT_IDS.includes(id));
    assert.equal(stage.enemyCount, 20);
    assert.equal(stage.eliteCount, 1);
  }
  for (const event of JUMPSCARE_EVENTS) {
    assert.ok(ARCHIVE_STAGES_BY_ID[event.stageId], event.id);
    assert.ok(GHOSTS_BY_ID[event.ghostId], event.id);
    for (const id of event.requiredTools) assert.ok(ARCHIVE_TOOL_IDS.includes(id), `${event.id} → ${id}`);
  }
  for (const ghost of GHOSTS) {
    const req = GHOST_TOOL_REQUIREMENTS[ghost.id];
    assert.ok(req && req.required.length > 0, ghost.id);
    for (const id of [...req.required, ...req.optional]) assert.ok(ARCHIVE_TOOL_IDS.includes(id), `${ghost.id} → ${id}`);
  }
});

test('Arc X has eight chapters with five stages each and a five-phase final boss', () => {
  const arc10 = ARCHIVE_STAGES.filter((s) => s.arcId === 'arc10');
  assert.equal(arc10.length, 40);
  assert.equal(new Set(arc10.map((s) => s.chapterId)).size, 8);
  assert.equal(arc10.filter((s) => s.stageType === 'anomaly').length, 5);
  for (const chapter of ETERNAL_CHAPTERS) {
    assert.equal(arc10.filter((s) => s.chapterId === chapter.id).length, 5);
  }
  assert.equal(ARCHIVE_BOSSES.find((b) => b.id === 'first_forgotten').maxPhases, 5);
});

test('stage statuses distinguish cleared, perfect, unlocked, uncleared and locked', () => {
  const { controller } = make({
    veil: veilSave({ campaign: { completedStages: ['vesper_hollow_1'] } }),
    eternal: eternalSave(),
  });
  assert.equal(controller.stageStatus('vesper_hollow_1'), 'cleared');
  assert.equal(controller.stageStatus('vesper_hollow_2'), 'unlocked');
  assert.equal(controller.stageStatus('vesper_hollow_5'), 'uncleared');
  assert.equal(controller.stageStatus('midnight_city_1'), 'locked');
  assert.equal(controller.statistics().cleared, 1);
});

test('Sneak Peek is pure, preserves locked status and never touches progression or rewards', () => {
  const { controller, veil, eternal, archive } = make();
  const before = JSON.stringify({ veil, eternal, archive });
  const preview = controller.preview('vesper_hollow_3');
  assert.equal(preview.ok, true);
  assert.equal(preview.type, 'archive');
  assert.equal(preview.accessibility.noGameplay, true);
  assert.equal(preview.accessibility.isolated, true);
  assert.equal(controller.stageStatus('vesper_hollow_3'), 'uncleared');
  assert.equal(JSON.stringify({ veil, eternal, archive }), before);
  const opened = controller.openPreview('vesper_hollow_3', { now: 1234 });
  assert.equal(opened.ok, true);
  assert.equal(archive.previews.vesper_hollow_3.count, 1);
  assert.equal(controller.stageStatus('vesper_hollow_3'), 'uncleared');
  assert.equal(archive.stats.previews, 1);
  assert.deepEqual(veil.campaign.completedStages, []);
  assert.deepEqual(eternal.campaign.completedStages, []);
});

test('a locked stage can be previewed but stays locked', () => {
  const { controller, eternal, archive } = make({ eternal: eternalSave() });
  const preview = controller.preview('midnight_city_1');
  assert.equal(preview.ok, true);
  assert.equal(preview.stage.status, 'locked');
  controller.openPreview('midnight_city_1');
  assert.equal(eternal.campaign.unlocked, false);
  assert.equal(controller.stageStatus('midnight_city_1'), 'locked');
  assert.equal(archive.previews.midnight_city_1.count, 1);
});

test('developer preview is authorized separately and never records an archive preview', () => {
  const { controller, archive } = make();
  assert.equal(controller.preview('vesper_hollow_1', { developer: true }).reason, 'developer-only');
  const dev = controller.preview('vesper_hollow_1', { developer: true, authorized: true });
  assert.equal(dev.ok, true);
  assert.equal(dev.type, 'developer');
  assert.equal(dev.unknownPresence, 0);
  assert.equal(Object.keys(archive.previews).length, 0);
});

test('preview hides undocumented ghosts and an undiscovered boss', () => {
  const { controller } = make();
  const preview = controller.preview('vesper_hollow_1');
  assert.equal(preview.knownGhosts.length, 0);
  assert.ok(preview.unknownPresence > 0);
  assert.equal(preview.boss.unknown, true);
  assert.equal(preview.tools.length, 0);
});

test('clearing a stage does not document its ghosts', () => {
  const { controller, index, veil } = make({ veil: veilSave({ campaign: { completedStages: ['vesper_hollow_1'] } }) });
  assert.equal(controller.stageStatus('vesper_hollow_1'), 'cleared');
  assert.equal(controller.ghosts.counts().documented, 0);
  assert.equal(controller.ghosts.state('pale_resident'), 'undiscovered');
  assert.ok(veil.campaign.completedStages.includes('vesper_hollow_1'));
  assert.equal(index.stageOf('pale_resident'), 'rumored');
});

test('Level Checker separates main, ghost, collectible, secret and overall completion', () => {
  const { controller } = make({ veil: veilSave({ campaign: { completedStages: ['vesper_hollow_1'] } }) });
  const check = controller.checkStage('vesper_hollow_1');
  assert.equal(check.ok, true);
  assert.equal(check.percentages.main, 100);
  assert.equal(check.percentages.ghosts, 0);
  assert.equal(check.percentages.collectibles, 0);
  assert.equal(check.percentages.secrets, 0);
  assert.ok(check.percentages.overall < 100);
  assert.equal(check.categories.find((c) => c.id === 'secrets').status, 'not-available');
  assert.ok(check.missing.includes('Ghost Documentation'));
});

test('Level Checker reports an incomplete stage and chapter, and never awards rewards', () => {
  const { controller, veil, archive } = make();
  const check = controller.checkStage('vesper_hollow_1');
  assert.equal(check.cleared, false);
  assert.equal(check.percentages.main, 0);
  const chapter = controller.checkChapter('vesper_hollow');
  assert.equal(chapter.ok, true);
  assert.equal(chapter.stages.length, 5);
  assert.equal(chapter.completeStages, 0);
  assert.deepEqual(veil.campaign.completedStages, []);
  assert.deepEqual(archive.stageRecords, {});
});

test('ghost documentation comes from real evidence and is deduplicated', () => {
  const { controller, index } = make();
  index.discover('pale_resident');
  const ghost = GHOSTS_BY_ID.pale_resident;
  for (const type of ghost.requiredEvidence) assert.equal(index.addEvidence('pale_resident', type).ok, true);
  assert.equal(index.addEvidence('pale_resident', ghost.requiredEvidence[0]).reason, 'duplicate');
  assert.equal(controller.documentGhost('pale_resident').ok, true);
  assert.equal(controller.ghosts.state('pale_resident'), 'documented');
  assert.equal(controller.ghostEntry('pale_resident').loreUnlocked, true);
  assert.equal(controller.documentGhost('pale_resident').ok, true);
  assert.equal(controller.ghosts.counts().documented, 1);
});

test('Ghost Index 3.0 filters missing, classification, tool and arc', () => {
  const { controller } = make();
  assert.equal(controller.ghostQuery({ missing: true }).length, 80);
  assert.ok(controller.ghostQuery({ arc: 'arc10' }).length >= 25);
  assert.equal(controller.ghostQuery({ classification: 'primordial' }).length, 6);
  assert.ok(controller.ghostQuery({ tool: 'ancient_seal', arc: 'arc9' }).length > 0);
  assert.ok(controller.ghostQuery({ tool: 'spectral_detector' }).length > 0);
  assert.equal(controller.ghostQuery({ search: 'pale_resident' }).length, 1);
  assert.equal(controller.ghostQuery({ jumpscare: true }).length > 0, true);
  assert.equal(controller.ghostQuery({ multiplayer: true }).length > 0, true);
});

test('the Jumpscare Index is separate, evidence-gated and deduplicated', () => {
  const { controller, index, archive } = make();
  assert.equal(controller.jumpscares.counts().total, 38);
  const event = JUMPSCARE_EVENTS.find((e) => e.ghostId === 'pale_resident') || JUMPSCARE_EVENTS[0];
  index.discover(event.ghostId);
  index.addEvidence(event.ghostId, GHOSTS_BY_ID[event.ghostId].requiredEvidence[0]);
  assert.equal(controller.documentJumpscare(event.id, { evidenceType: event.evidenceType }).ok, true);
  assert.equal(controller.documentJumpscare(event.id, { evidenceType: event.evidenceType }).reason, 'duplicate');
  assert.equal(controller.jumpscares.counts().documented, 1);
  assert.equal(controller.ghosts.counts().documented, 0);
  assert.equal(archive.stats.eventsDocumented, 1);
});

test('Anti-Jumpscare does not block jumpscare documentation from evidence', () => {
  const { controller, index } = make();
  const event = JUMPSCARE_EVENTS.find((e) => e.ghostId === 'corridor_shade');
  index.discover('corridor_shade');
  index.addEvidence('corridor_shade', GHOSTS_BY_ID.corridor_shade.requiredEvidence[0]);
  const result = controller.documentJumpscare(event.id, { evidenceType: event.evidenceType, antiJumpscare: true });
  assert.equal(result.ok, true);
  assert.equal(result.event.antiJumpscare, 'atmospheric-alternative');
});

test('equipment ownership reflects the live Arc IX and Arc X inventories', () => {
  const { controller } = make({ eternal: eternalSave({ campaign: { unlocked: true }, workshop: { tiers: { resonance_scanner: 2 }, purchased: ['resonance_scanner'] } }) });
  assert.equal(controller.equipment.status('spirit_camera'), 'owned');
  assert.equal(controller.equipment.status('resonance_scanner'), 'owned');
  assert.equal(controller.equipment.status('spectral_trap'), 'missing');
  const prep = controller.prepare('pale_resident');
  assert.equal(prep.ok, true);
  assert.equal(prep.ready, false);
  assert.ok(prep.highlight.includes('echo_recorder'));
  assert.equal(controller.equipment.status('investigator_journal'), 'owned');
  assert.ok(controller.equipment.owned().size >= 4);
});

test('prepare investigation highlights missing required tools and upgrades are deduped', () => {
  const { controller, archive } = make({ archive: { ...defaultArchiveSave(), equipment: { owned: [], upgrades: {}, loadout: [] } } });
  const prep = controller.prepare('first_veil_walker');
  assert.equal(prep.ready, false);
  assert.ok(prep.highlight.includes('ancient_seal'));
  assert.equal(controller.equipment.upgrade('ancient_seal').reason, 'missing-tool');
  controller.equipment.own('ancient_seal');
  assert.equal(controller.equipment.upgrade('ancient_seal').level, 2);
  assert.equal(controller.equipment.upgrade('ancient_seal').level, 3);
  assert.equal(archive.equipment.upgrades.ancient_seal, 3);
});

test('archive save sanitizes junk and migrates an early payload without deleting progress', () => {
  const raw = {
    previews: { vesper_hollow_1: { count: 3, firstAt: 1, lastAt: 2 }, nope: { count: 1 } },
    jumpscares: { js_distant_hallway: { state: 'documented', evidence: ['visual'], documentedAt: 9 }, nope: {} },
    equipment: { owned: ['spirit_camera', 'nope'], upgrades: { spirit_camera: 9 } },
    stageRecords: { vesper_hollow_1: { collectibles: ['pale_resident:lore:1'], rewardClaims: ['a', 'a'] }, nope: {} },
    achievements: ['first_encounter', 'nope'],
    stats: { previews: 3, eventsDocumented: 1, bad: 'x' },
  };
  const save = sanitizeArchiveSave(raw);
  assert.equal(save.previews.vesper_hollow_1.count, 3);
  assert.equal(save.previews.nope, undefined);
  assert.equal(save.jumpscares.js_distant_hallway.state, 'documented');
  assert.deepEqual(save.equipment.owned, ['spirit_camera']);
  assert.equal(save.equipment.upgrades.spirit_camera, 5);
  assert.deepEqual(save.stageRecords.vesper_hollow_1.rewardClaims, ['a']);
  assert.deepEqual(save.achievements, ['first_encounter']);
  assert.equal(save.stats.preview, undefined);
});

test('achievements are derived from real archive stats and granted once', () => {
  const { controller, archive, index } = make();
  index.discover('pale_resident');
  archive.stats.uniquePreviews = 20;
  const first = controller.evaluateAchievements(100);
  assert.ok(first.unlocked.some((a) => a.id === 'first_encounter'));
  assert.ok(first.unlocked.some((a) => a.id === 'stage_explorer'));
  const second = controller.evaluateAchievements(101);
  assert.equal(second.unlocked.some((a) => a.id === 'first_encounter'), false);
  assert.ok(archive.achievements.includes('stage_explorer'));
});

test('observeGhost records a scare rumor without documenting the scare', () => {
  const { controller, archive } = make();
  const first = controller.observeGhost('pale_resident');
  assert.ok(first.changed > 0);
  assert.equal(controller.jumpscares.state(first.events[0]), 'rumored');
  assert.equal(controller.jumpscares.isDocumented(first.events[0]), false);
  assert.equal(archive.stats.eventsDiscovered, 1);
});

test('a perfect stage requires clear, all ghost documentation, lore and scare records', () => {
  const { controller, index, veil, archive } = make({ veil: veilSave({ campaign: { completedStages: ['vesper_hollow_1'] } }) });
  const stage = ARCHIVE_STAGES_BY_ID.vesper_hollow_1;
  for (const id of stage.ghostIds) {
    index.discover(id);
    for (const type of GHOSTS_BY_ID[id].requiredEvidence) index.addEvidence(id, type);
    index.document(id);
    for (let lore = 1; lore <= 4; lore += 1) archive.stageRecords[stage.id] = { ...(archive.stageRecords[stage.id] || {}), collectibles: [...(archive.stageRecords[stage.id]?.collectibles || []), `${id}:lore:${lore}`] };
  }
  for (const id of stage.jumpscareEventIds) archive.jumpscares[id] = { state: 'documented', evidence: [], documentedAt: 1, source: 'evidence', rewardClaimed: true };
  assert.equal(controller.stageStatus(stage.id), 'perfect');
  assert.equal(controller.statistics().perfect, 1);
});
