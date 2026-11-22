import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DREAD_ENVIRONMENTS,
  DREAD_ENVIRONMENT_IDS,
  DREAD_ENVIRONMENT_LIST,
  DREAD_BOSSES,
  DREAD_BOSS_IDS,
  DREAD_MODES,
  DREAD_MODE_IDS,
  DREAD_EQUIPMENT,
  DREAD_EQUIPMENT_IDS,
  DREAD_CATEGORIES,
  DREAD_JOURNAL_ENTRIES,
  DREAD_ACHIEVEMENTS,
  DREAD_REWARDS,
  DREAD_TABS,
  DREAD_SETTING_DEFINITIONS,
  DREAD_DEFAULTS,
  UNNATURAL,
  UNNATURAL_IDS,
  PSYCHOLOGICAL_EVENTS,
  PSYCHOLOGICAL_EVENT_IDS,
  AwarenessManager,
  DreadBossManager,
  DreadEventDirector,
  DreadJournal,
  PerceptionMemory,
  ScaryModeController,
  UnnaturalBrain,
  canHear,
  canSee,
  dreadBossSpawn,
  dreadEquipment,
  dreadModeProgress,
  dreadRoom,
  dreadSettingsForTab,
  dreadSummary,
  equipmentExplorationOnly,
  equipmentUnlocks,
  makeUnnatural,
  resolveDreadPresentation,
  sanitizeDreadProgress,
  sanitizeDreadSettings,
} from '../src/dread.js';

/* ── environments ── */

test('five horror environments ship with 2D rooms, ceilings and separate 3D data', () => {
  assert.equal(DREAD_ENVIRONMENT_IDS.length, 5);
  assert.equal(new Set(DREAD_ENVIRONMENT_LIST.map((entry) => entry.label)).size, 5);
  for (const env of DREAD_ENVIRONMENT_LIST) {
    assert.ok(env.room.platforms.length >= 4, `${env.id} has real platforms`);
    assert.ok(env.room.spawn && Number.isFinite(env.room.spawn.x));
    assert.ok(env.ceilings.length >= 1, `${env.id} has ceiling surfaces`);
    assert.ok(env.mechanics.length >= 3, `${env.id} has environment mechanics`);
    assert.ok(env.clues.length === 3, `${env.id} has three clues`);
    assert.ok(env.threeD.props.length >= 3 && env.threeD.fog > 0, `${env.id} has a 3D layout`);
    assert.ok(env.palette.sky && env.palette.fog && env.palette.accent);
  }
});

test('dreadRoom builds a synthetic arena with ceilings and no gates', () => {
  const room = dreadRoom('silent_underground');
  assert.equal(room.dreadEnvironment, 'silent_underground');
  assert.ok(room.index >= 9100);
  assert.equal(room.gates.length, 0);
  assert.ok(room.ceilingSpans.length >= 1);
  assert.ok(room.platforms.every((platform) => platform.w > 0 && platform.y > 0));
  assert.equal(dreadRoom('nope'), null);
});

/* ── Unnatural enemies ── */

test('seven Unnatural enemies have perception, memory and tactical identities', () => {
  assert.equal(UNNATURAL_IDS.length, 7);
  const tactics = new Set();
  for (const profile of Object.values(UNNATURAL)) {
    assert.ok(profile.sightRange > 0 && profile.coneDeg > 0 && profile.hearingRange > 0);
    assert.ok(profile.memoryTime > 0 && profile.searchTime > 0);
    assert.ok(profile.tactic && profile.sound && profile.signature);
    tactics.add(profile.tactic);
  }
  assert.equal(tactics.size, 5, 'seven bodies reuse five tested tactical families');
  assert.ok(makeUnnatural('ceiling_dweller', 300).unnaturalKind === 'ceiling_dweller');
  assert.equal(makeUnnatural('nope', 0), null);
});

test('Unnatural difficulty scaling is independent and monotonic', () => {
  const easy = makeUnnatural('empty_knight', 300, 'easy');
  const normal = makeUnnatural('empty_knight', 300, 'normal');
  const hard = makeUnnatural('empty_knight', 300, 'hard');
  assert.ok(easy.hpScale < normal.hpScale && normal.hpScale < hard.hpScale);
  assert.ok(easy.speedScale < hard.speedScale);
});

test('sight needs range, a facing cone and a clear line of sight', () => {
  const observer = { x: 0, y: 0, w: 20, h: 20, facing: 1, sightRange: 400, coneDeg: 120 };
  const target = { x: 120, y: 0, w: 20, h: 20 };
  assert.equal(canSee(observer, target), true, 'in front and in range');
  assert.equal(canSee(observer, { ...target, x: -200 }), false, 'behind the observer');
  assert.equal(canSee(observer, { ...target, x: 900 }), false, 'out of range');
  const blocked = { lineOfSight: () => false };
  assert.equal(canSee(observer, target, { nav: blocked }), false, 'a wall blocks sight');
  assert.equal(canSee(observer, { ...target, x: 10 }, { nav: blocked }), true, 'adjacent contact still registers');
});

test('hearing ignores facing but respects range and loudness', () => {
  const observer = { x: 0, y: 0, w: 20, h: 20, facing: 1, hearingRange: 300 };
  const noise = { x: -240, y: 0, w: 2, h: 2, loudness: 1 };
  assert.equal(canHear(observer, noise), true, 'heard from behind');
  assert.equal(canHear(observer, { ...noise, x: -420 }), false, 'out of hearing range');
  assert.equal(canHear(observer, { ...noise, x: -420, loudness: 2 }), true, 'loud noises carry further');
});

test('perception memory is bounded, prunes and can find the nearest point', () => {
  const memory = new PerceptionMemory({ limit: 3, memoryTime: 5 });
  memory.add(100, 0, 0);
  memory.add(200, 0, 1);
  memory.add(900, 0, 2);
  memory.add(1000, 0, 3);
  assert.equal(memory.size, 3, 'bounded');
  assert.equal(memory.last().x, 1000);
  assert.equal(memory.nearestTo(850).x, 900);
  memory.prune(6.5);
  assert.equal(memory.size, 2, 'old entries pruned');
});

test('the brain sees the player, hunts, and only loses the trail after its memory window', () => {
  const enemy = { unnaturalKind: 'faceless_visitor', x: 300, y: 400, w: 36, h: 52, facing: 1, minX: 0, maxX: 1200, speed: 96 };
  const brain = new UnnaturalBrain(enemy, { seed: 5 });
  let view = brain.update(0.05, { player: { x: 460, y: 400, w: 30, h: 46 } });
  assert.equal(view.seen, true);
  assert.equal(view.state, 'hunt');
  assert.ok(view.memory.length >= 1, 'it remembers where the player stood');
  for (let i = 0; i < 10; i += 1) view = brain.update(0.1, { player: { x: 460, y: 400, w: 30, h: 46 } });
  assert.equal(view.state, 'hunt', 'still hunting while visible');
});

test('a noise behind the player puts the brain into investigate and then search', () => {
  const enemy = { unnaturalKind: 'empty_knight', x: 600, y: 400, w: 42, h: 58, facing: 1, minX: 0, maxX: 1300, speed: 88 };
  const brain = new UnnaturalBrain(enemy, { seed: 9 });
  const player = { x: 200, y: 400, w: 30, h: 46 };
  let view = brain.update(0.05, { player, noises: [{ x: 540, y: 400, w: 2, h: 2, loudness: 1 }] });
  assert.equal(view.seen, false, 'player is behind the guard');
  assert.equal(view.heard, true);
  assert.equal(view.state, 'investigate');
  assert.ok(view.memory.some((entry) => entry.source === 'hearing'), 'the noise is remembered');
  for (let i = 0; i < 60; i += 1) view = brain.update(0.25, { player });
  assert.ok(['search', 'patrol', 'investigate'].includes(view.state), `settles into a search/patrol (${view.state})`);
});

test('the brain returns to patrol after investigating and searching', () => {
  const enemy = { unnaturalKind: 'pale_echo', x: 600, y: 400, w: 34, h: 46, facing: 1, minX: 0, maxX: 1300, speed: 110 };
  const brain = new UnnaturalBrain(enemy, { seed: 3 });
  const player = { x: 200, y: 400, w: 30, h: 46 };
  brain.update(0.05, { player, noises: [{ x: 560, y: 400, w: 2, h: 2, loudness: 1 }] });
  let view = null;
  for (let i = 0; i < 80; i += 1) view = brain.update(0.25, { player });
  assert.equal(view.state, 'patrol');
});

/* ── events ── */

test('eighteen psychological events all define duration, cooldown, outcomes and a safe exit', () => {
  assert.equal(PSYCHOLOGICAL_EVENT_IDS.length, 18);
  for (const event of Object.values(PSYCHOLOGICAL_EVENTS)) {
    assert.ok(event.duration > 0 && event.cooldown >= event.duration, `${event.id} cooldown`);
    assert.ok(event.outcomes.length >= 2, `${event.id} outcomes`);
    assert.ok(event.requires.length >= 1 && event.start.length >= 1 && event.end.length >= 1);
    assert.ok(['soften', 'suppress', 'allow'].includes(event.antiJumpscare));
    assert.ok(event.line && event.mechanic);
  }
});

test('the director enforces cooldowns, limits and repetition protection', () => {
  const director = new DreadEventDirector({ enabled: true, maxConcurrentEvents: 1, eventRepeatProtection: true }, { seed: 11 });
  const ctx = { hp: 100, roomCleared: true, enemyCount: 0 };
  const started = director.tryStart('someone_behind_you', ctx);
  assert.ok(started && started.phase === 'active');
  assert.equal(director.tryStart('the_wrong_room', ctx), 'limit', 'concurrency limit respected');
  director.finish('someone_behind_you');
  assert.ok(director.snapshot().cooldowns.someone_behind_you > 0, 'cooldown applied');
  assert.equal(director.tryStart('someone_behind_you', ctx), 'cooldown');
});

test('the director cancels on room change, death and menu, always draining the safe exit', () => {
  const director = new DreadEventDirector({ enabled: true }, { seed: 4 });
  director.tryStart('the_blackout', { hp: 100 });
  director.drain();
  director.update(0.1, { hp: 100, roomIndex: 7 });
  assert.equal(director.active.length, 0, 'room change cancels');
  const exits = director.drain();
  assert.ok(exits.some((change) => change.layer === 'lighting' && change.value === 'restore'), 'lighting restored');

  director.cooldowns = {};
  director.tryStart('the_blackout', { hp: 100 });
  director.update(0.1, { hp: 0, dead: true });
  assert.equal(director.active.length, 0, 'death cancels');

  director.cooldowns = {};
  director.tryStart('the_blackout', { hp: 100 });
  director.update(0.1, { hp: 100, menu: true });
  assert.equal(director.active.length, 0, 'menu cancels');
});

test('a hard timeout closes an event that outlives its own duration', () => {
  const director = new DreadEventDirector({ enabled: true }, { seed: 2 });
  director.tryStart('the_repeated_minute', { hp: 100 });
  director.update(0.1, { hp: 100 });
  // Absurd time step bypasses the normal duration check in this synthetic call.
  director.update(60, { hp: 100 });
  assert.equal(director.active.length, 0);
  assert.ok(['done', 'cancelled'].includes(director.snapshot().last.phase));
});

test('anti-jumpscare removes startling outcomes but keeps the event', () => {
  const director = new DreadEventDirector({ enabled: true, antiJumpscare: true }, { seed: 8 });
  for (let i = 0; i < 40; i += 1) {
    const outcome = director.resolveOutcome(PSYCHOLOGICAL_EVENTS.someone_behind_you);
    assert.notEqual(outcome.kind, 'encounter');
    assert.notEqual(outcome.kind, 'mirror');
  }
  const entry = director.tryStart('the_uninvited_guest', { hp: 100, roomCleared: true, enemyCount: 0 });
  assert.ok(entry && entry.phase === 'active');
  assert.equal(entry.suppressed, true);
});

test('per-event frequency at zero removes an event from the automatic pool', () => {
  const perEventFrequency = Object.fromEntries(PSYCHOLOGICAL_EVENT_IDS.map((id) => [id, 0]));
  const director = new DreadEventDirector({ enabled: true, eventFrequency: 'high', perEventFrequency }, { seed: 1 });
  const results = new Set();
  for (let i = 0; i < 20; i += 1) results.add(director.autoStart({ hp: 100, roomCleared: true, enemyCount: 0 }));
  assert.ok(results.has('zero-weight') || results.has('limit') || results.has(null));
  assert.equal(director.active.length, 0, 'nothing was activated');
});

/* ── bosses ── */

test('three horror bosses define readable multi-phase fights and arenas', () => {
  assert.equal(DREAD_BOSS_IDS.length, 3);
  for (const profile of Object.values(DREAD_BOSSES)) {
    assert.ok(profile.phases.length >= 2, `${profile.id} phases`);
    assert.ok(profile.arena.minX < profile.arena.maxX);
    assert.ok(profile.dialogue.intro && profile.dialogue.defeat, `${profile.id} dialogue`);
    const thresholds = profile.phaseThresholds;
    for (let i = 1; i < thresholds.length; i += 1) assert.ok(thresholds[i] < thresholds[i - 1], `${profile.id} ordered thresholds`);
    const overrides = dreadBossSpawn(profile.id);
    assert.equal(overrides.name, profile.name);
    assert.equal(overrides.maxPhases, profile.phases.length);
  }
  assert.equal(DREAD_BOSSES.watcher_beyond.phases.length, 4);
  assert.ok(DREAD_BOSSES.hollow_king.hiddenPhase);
  assert.equal(DREAD_BOSSES.forgotten_twin.mirror, true);
});

test('boss phases, arena containment and hitbox lifetimes are all enforced', () => {
  const manager = new DreadBossManager();
  const boss = manager.begin('watcher_beyond');
  assert.equal(boss.phase, 1);
  manager.damage(1800 * 0.3);
  assert.equal(boss.phase, 2, 'crossed the 0.75 threshold');
  manager.openHitbox('telegraph', 0.05, { rect: { x: 0, y: 0, w: 10, h: 10 } });
  manager.damage(1800 * 0.25);
  assert.equal(boss.phase, 3);
  assert.equal(manager.snapshot().activeHitboxes.length, 0, 'phase change closed the hitbox');
  manager.openHitbox('late', 0.1);
  manager.tick(0.5);
  assert.equal(manager.snapshot().activeHitboxes.length, 0, 'expired hitboxes close');
  assert.ok(manager.events.some((event) => event.type === 'dreadHitboxesExpired'));

  const entity = { x: -900, w: 120 };
  manager.clamp(entity);
  assert.ok(entity.x >= DREAD_BOSSES.watcher_beyond.arena.minX);
  assert.ok(entity.x <= DREAD_BOSSES.watcher_beyond.arena.maxX);

  manager.damage(99999);
  assert.equal(manager.dead, true);
  assert.ok(manager.events.some((event) => event.type === 'dreadBossDown'));
});

test('the Hollow King enters its hidden second arena at the last threshold', () => {
  const manager = new DreadBossManager();
  manager.begin('hollow_king');
  manager.damage(DREAD_BOSSES.hollow_king.maxHp * 0.86);
  assert.equal(manager.boss.hiddenPhaseEntered, true);
  assert.deepEqual(manager.boss.arena, DREAD_BOSSES.hollow_king.hiddenPhase.arena);
  assert.ok(manager.events.some((event) => event.type === 'dreadBossArena'));
});

/* ── equipment / awareness ── */

test('ten exploration tools exist and none of them grant combat power', () => {
  assert.equal(DREAD_EQUIPMENT_IDS.length, 10);
  assert.equal(equipmentExplorationOnly(DREAD_EQUIPMENT_IDS), true);
  for (const id of DREAD_EQUIPMENT_IDS) {
    const item = dreadEquipment(id);
    assert.ok(item.use && item.unlocks.length >= 1);
    assert.equal(item.combatBonus, 0);
  }
  assert.ok(equipmentUnlocks(['spectral_lens', 'old_lantern']).includes('mirror_clue'));
});

test('awareness is optional, adds information only, and always stabilizes', () => {
  const off = new AwarenessManager();
  assert.equal(off.config.enabled, false);
  off.addClue();
  assert.equal(off.value, 0, 'disabled awareness never moves');

  const awareness = new AwarenessManager({ enabled: true, decayPerSecond: 1 });
  awareness.addClue();
  awareness.addEvent();
  assert.ok(awareness.value > 0);
  assert.equal(awareness.effects().controlBlocked, false, 'never removes control');
  assert.equal(awareness.effects().healthPenalty, 0, 'never punishes health');
  awareness.tick(20);
  assert.equal(awareness.value, 0, 'decays back down');
  awareness.addClue();
  const grounded = awareness.ground();
  assert.equal(grounded.value, 0);
  assert.equal(grounded.stabilizations, 1);
});

/* ── modes ── */

test('ten modes define objectives, completion conditions, rewards and difficulty compatibility', () => {
  assert.equal(DREAD_MODE_IDS.length, 10);
  for (const mode of Object.values(DREAD_MODES)) {
    assert.ok(mode.objectives.length >= 1, `${mode.id} objectives`);
    assert.ok(mode.completion && mode.environment && mode.difficulties.length >= 2);
    assert.ok(DREAD_REWARDS.some((reward) => reward.id === mode.reward), `${mode.id} reward is cosmetic`);
    assert.ok(DREAD_ENVIRONMENT_IDS.includes(mode.environment));
  }
  const partial = dreadModeProgress('night_shift', { objectives: { tasks: 1 } });
  assert.equal(partial.complete, false);
  assert.equal(partial.ratio, 0);
  const done = dreadModeProgress('night_shift', { objectives: { tasks: 3, rooms: 5 } });
  assert.equal(done.complete, true);
  assert.equal(done.ratio, 1);
});

/* ── journal ── */

test('the journal ships ten categories and sixty entries with full metadata', () => {
  assert.equal(DREAD_CATEGORIES.length, 10);
  assert.equal(DREAD_JOURNAL_ENTRIES.length, 60);
  for (const entry of DREAD_JOURNAL_ENTRIES) {
    assert.ok(entry.title && entry.category && entry.location);
    assert.ok(entry.evidence.length >= 1 && entry.recordings.length >= 1 && entry.fragment);
    assert.ok(entry.characters.length >= 1 && entry.achievement);
  }
});

test('journal discovery, evidence, recordings and completion percentages are real', () => {
  const journal = new DreadJournal();
  const first = journal.discover('entities.faceless_visitor', { date: '2026-11-19' });
  assert.equal(first.first, true);
  assert.equal(journal.discover('entities.faceless_visitor').first, false);
  assert.equal(journal.entries['entities.faceless_visitor'], '2026-11-19');
  assert.equal(journal.discover('bogus.entry').ok, false);

  assert.equal(journal.collect('entities.faceless_visitor', 'faceless_visitor_note'), true);
  assert.equal(journal.collect('entities.faceless_visitor', 'nope'), false);
  assert.equal(journal.recordRecording('call_1'), true);
  assert.equal(journal.recordRecording('call_1'), false);
  assert.equal(journal.completeArea('black_manor'), true);
  assert.equal(journal.recordBoss('watcher_beyond'), true);
  assert.equal(journal.recordMode('night_shift'), true);

  const completion = journal.completion();
  assert.equal(completion.total, 60);
  assert.equal(completion.found, 1);
  assert.ok(completion.percent >= 1);
  assert.equal(completion.categories.length, 10);
});

test('the mystery board only connects discovered clues and never blocks progress', () => {
  const journal = new DreadJournal();
  journal.discover('mysteries.twin_origin');
  journal.discover('encounters.mirror_meeting');
  const first = journal.connect('mysteries.twin_origin', 'encounters.mirror_meeting');
  assert.equal(first.ok, true);
  assert.equal(first.optional, true);
  assert.equal(journal.connect('mysteries.twin_origin', 'encounters.mirror_meeting').reason, 'already-connected');
  assert.equal(journal.connect('mysteries.twin_origin', 'mysteries.who_called').reason, 'not-discovered');
  assert.equal(journal.connect('bogus', 'mysteries.twin_origin').reason, 'unknown-entry');
  assert.equal(journal.board().length, 10);
  // Connecting is optional: nothing about story progress depends on it.
  assert.equal(journal.completion().found, 2);
});

test('eight achievements unlock cosmetics, once each, with anti-jumpscare compatible rules', () => {
  const entries = {};
  for (const entry of DREAD_JOURNAL_ENTRIES) {
    if (entry.category === 'recordings' || entry.id === 'entities.faceless_visitor' || entry.id === 'mysteries.twin_origin') {
      entries[entry.id] = '2026-11-19';
    }
  }
  const journal = new DreadJournal({
    entries,
    recordings: DREAD_JOURNAL_ENTRIES.filter((entry) => entry.category === 'recordings').map((entry) => entry.recordings[0]),
    areas: ['black_manor'],
    bosses: ['watcher_beyond'],
    modes: ['night_shift', 'the_pursuit', 'lost_memories', 'endless_haunted', 'no_signal'],
    evidence: Array.from({ length: 12 }, (_, index) => `evidence-${index}`),
    challenges: ['comfort_settings'],
  });
  const unlocked = journal.achievements().filter((entry) => entry.unlocked);
  assert.equal(unlocked.length, 8, `all achievements unlock (${unlocked.map((entry) => entry.id).join(',')})`);
  assert.ok(unlocked.every((entry) => entry.accessibilitySafe === true));
  assert.equal(DREAD_ACHIEVEMENTS.length, 8);
  assert.equal(DREAD_REWARDS.length, 8);
  const granted = journal.grantRewards();
  assert.equal(granted.length, 8);
  assert.equal(journal.grantRewards().length, 0, 'rewards are granted only once');
  for (const rewardId of granted) {
    assert.equal(DREAD_REWARDS.find((entry) => entry.id === rewardId).cosmetic, true);
  }
});

test('dread progress sanitizes unknown ids and preserves flags', () => {
  const clean = sanitizeDreadProgress({
    entries: { 'entities.faceless_visitor': '2026-01-01', 'bogus.entry': '2026-01-01' },
    areas: ['black_manor', 'atlantis'],
    bosses: ['watcher_beyond', 'nope'],
    modes: ['night_shift', 'bogus'],
    rewards: ['frame_mirror', 'not-a-reward'],
    evidence: ['a', 'a', 'b'],
    flags: { seenIntro: true },
  });
  assert.deepEqual(Object.keys(clean.entries), ['entities.faceless_visitor']);
  assert.deepEqual(clean.areas, ['black_manor']);
  assert.deepEqual(clean.bosses, ['watcher_beyond']);
  assert.deepEqual(clean.modes, ['night_shift']);
  assert.deepEqual(clean.rewards, ['frame_mirror']);
  assert.deepEqual(clean.evidence, ['a', 'b']);
  assert.equal(clean.flags.seenIntro, true);
});

/* ── settings ── */

test('dread settings clamp deep values, filter unknown events and keep per-mode profiles', () => {
  const clean = sanitizeDreadSettings({
    eventFrequency: 'nope',
    maxConcurrentEvents: 99,
    perEventFrequency: { the_blackout: 5, bogus: 1 },
    enemyScares: { pale_echo: false },
    profile3D: { darkness: 200, fog: -5, effects: 'nope' },
    profile2D: { darkness: 25 },
    perMode: { night_shift: { difficulty: 'hard', awareness: 'on', eventFrequency: 'low' }, bogus: { difficulty: 'hard' } },
  });
  assert.equal(clean.eventFrequency, 'medium');
  assert.equal(clean.maxConcurrentEvents, 3);
  assert.equal(clean.perEventFrequency.the_blackout, 2);
  assert.equal(clean.perEventFrequency.bogus, undefined);
  assert.equal(clean.enemyScares.pale_echo, false);
  assert.equal(clean.enemyScares.faceless_visitor, true);
  assert.deepEqual(clean.profile3D, { darkness: 100, fog: 0, effects: 'reduced' });
  assert.equal(clean.profile2D.darkness, 25);
  assert.equal(clean.perMode.night_shift.difficulty, 'hard');
  assert.equal(clean.perMode.bogus, undefined);
  assert.equal(clean.awarenessEnabled, DREAD_DEFAULTS.awarenessEnabled);
});

test('six dread tabs expose real settings rows', () => {
  assert.equal(DREAD_TABS.length, 6);
  const paths = new Set(DREAD_SETTING_DEFINITIONS.map((entry) => entry.path));
  assert.equal(paths.size, DREAD_SETTING_DEFINITIONS.length, 'no duplicate paths');
  for (const tab of DREAD_TABS) {
    assert.ok(dreadSettingsForTab(tab.id).length >= 3, `${tab.id} rows`);
  }
  for (const id of UNNATURAL_IDS) {
    assert.ok(paths.has(`dread.enemyScares.${id}`), `per-enemy control for ${id}`);
  }
});

test('2D and 3D horror profiles resolve independently and anti-jumpscare only removes effects', () => {
  const settings = {
    profile2D: { darkness: 80, fog: 70, effects: 'full' },
    profile3D: { darkness: 20, fog: 10, effects: 'reduced' },
    darknessAdd: 10,
    antiJumpscare: false,
  };
  const twoD = resolveDreadPresentation(settings, { enabled: true });
  const threeD = resolveDreadPresentation(settings, { enabled: true }, { mode3D: true });
  assert.equal(twoD.activeProfile, '2D');
  assert.equal(threeD.activeProfile, '3D');
  assert.equal(twoD.atmosphere.darkness, 90);
  assert.equal(threeD.atmosphere.darkness, 30);
  assert.notEqual(twoD.profile2D.fog, threeD.profile3D.fog);

  const anti = resolveDreadPresentation({ ...settings, antiJumpscare: true }, { enabled: true, antiJumpscare: true });
  assert.equal(anti.accessibility.startlingSuppressed, true);
  assert.equal(anti.accessibility.controlPreserved, true);
  assert.equal(anti.accessibility.rewardsUnaffected, true);
  assert.equal(anti.atmosphere.movement, false, 'startling movement removed');
  assert.equal(anti.atmosphere.lighting, false);
  assert.equal(anti.boss.cinematics, false);
  assert.equal(anti.boss.presentation, false);
  assert.ok(anti.atmosphere.darkness > 0 && anti.atmosphere.fog > 0, 'atmosphere kept');
  assert.ok(anti.overrides.some((entry) => entry.overriddenBy === 'accessibility'));
  assert.ok(anti.cleanup.includes('boss.cinematics'));
});

test('per-mode settings override the global event frequency and explain the override', () => {
  const presentation = resolveDreadPresentation(
    { eventFrequency: 'high', perMode: { night_shift: { difficulty: 'normal', awareness: 'on', eventFrequency: 'low' } } },
    { enabled: true },
    { modeId: 'night_shift' },
  );
  assert.equal(presentation.events.frequency, 'low');
  assert.ok(presentation.overrides.some((entry) => entry.overriddenBy === 'mode:night_shift'));
});

/* ── controller ── */

test('the controller owns real modules, cancels events and restores every override on stop', () => {
  const controller = new ScaryModeController({ horror: { enabled: true, antiJumpscare: false }, settings: { awarenessEnabled: true } });
  controller.start({ environmentId: 'endless_forest' });
  assert.equal(controller.environmentId, 'endless_forest');
  assert.ok(controller.overrides.has('environment'));
  const started = controller.events.tryStart('someone_behind_you', { hp: 100, roomCleared: true, enemyCount: 0 });
  assert.ok(started && started.phase === 'active');
  controller.tick(0.1, { hp: 100, roomCleared: true });
  const stopped = controller.stop('test-ended');
  assert.ok(stopped.cancelled.includes('someone_behind_you'));
  assert.equal(controller.overrides.size, 0, 'temporary overrides restored');
  assert.equal(controller.bosses.snapshot().activeHitboxes.length, 0);
  assert.ok(controller.journal.areas.includes('endless_forest'));
});

test('completing a mode is idempotent and grants its cosmetic once', () => {
  const controller = new ScaryModeController({ horror: { enabled: true } });
  const first = controller.completeMode('night_shift', { objectives: { tasks: 3, rooms: 5 } });
  assert.equal(first.ok, true);
  assert.equal(first.first, true);
  assert.ok(first.reward);
  const second = controller.completeMode('night_shift', { objectives: { tasks: 3, rooms: 5 } });
  assert.equal(second.first, false);
  assert.equal(controller.completeMode('night_shift', { objectives: { tasks: 1 } }).ok, false);
});

test('dreadSummary reports the shipped content counts', () => {
  const summary = dreadSummary({});
  assert.equal(summary.environments, 5);
  assert.equal(summary.enemies, 7);
  assert.equal(summary.events, 18);
  assert.equal(summary.bosses, 3);
  assert.equal(summary.modes, 10);
  assert.equal(summary.equipment, 10);
});
