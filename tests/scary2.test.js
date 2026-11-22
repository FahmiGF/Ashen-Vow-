import { test } from 'node:test';
import assert from 'node:assert/strict';

import { defaultExtendedSettings, sanitizeExtendedSettings, SETTING_DEFINITIONS } from '../src/settings2.js';
import {
  HORROR_ACHIEVEMENTS,
  HORROR_DEFAULTS,
  HORROR_EVENT_IDS,
  HORROR_EVENT_LIST,
  HORROR_EVENTS,
  HORROR_REWARDS,
  HORROR_REWARD_IDS,
  HORROR_SAVE_KEY,
  HORROR_SETTING_DEFINITIONS,
  HORROR_TABS,
  HorrorEventDirector,
  HorrorJournal,
  SCARY_DIFFICULTY,
  SCARY_ENEMIES,
  SCARY_ENEMY_IDS,
  ScareLedger,
  horrorSettingsForTab,
  horrorSummary,
  makeScaryEnemy,
  resolveHorrorPresentation,
  sanitizeHorrorProgress,
  sanitizeHorrorSettings,
  scaryDifficultyProfile,
  startlingAllowed,
} from '../src/scary2.js';

const explore = { combat: false, hp: 80, maxHp: 100, paused: false, menu: false, dialogue: false, roomCleared: true, enemyCount: 0 };

test('Scary Mode 2.0 is off by default and never startling by default', () => {
  const defaults = defaultExtendedSettings();
  assert.equal(defaults.scary.enabled, false);
  assert.equal(defaults.scary.antiJumpscare, false);
  assert.equal(defaults.scary.difficulty, 'normal');
  assert.equal(startlingAllowed(defaults.scary), false);
  assert.equal(HORROR_DEFAULTS.jumpscares, true, 'scares are configured, just switched off');
});

test('three horror difficulties exist and change gameplay numbers, not just effects', () => {
  for (const id of ['easy', 'normal', 'hard']) {
    assert.ok(SCARY_DIFFICULTY[id], `${id} exists`);
    assert.equal(scaryDifficultyProfile(id).id, id);
    assert.ok(scaryDifficultyProfile(id).rows.length === 8);
  }
  const easy = SCARY_DIFFICULTY.easy;
  const hard = SCARY_DIFFICULTY.hard;
  assert.ok(hard.detection > easy.detection);
  assert.ok(hard.aggression > easy.aggression);
  assert.ok(hard.surpriseChance > easy.surpriseChance);
  assert.ok(hard.searchTime > easy.searchTime, 'hard searches longer');
  assert.ok(hard.warningLead < easy.warningLead, 'hard warns later');
  assert.ok(hard.speed > easy.speed);
  assert.ok(hard.reaction < easy.reaction, 'hard reacts faster');
  assert.ok(scaryDifficultyProfile('nope').id === 'normal', 'unknown falls back');
});

test('horror difficulty is independent from campaign difficulty in both directions', () => {
  const base = defaultExtendedSettings();
  base.gameplay.difficulty = 'nightmare';
  base.scary.difficulty = 'easy';
  const mode = resolveHorrorPresentation(base.scary);
  assert.equal(mode.difficulty, 'easy');
  assert.equal(mode.gameplay.detection, SCARY_DIFFICULTY.easy.detection);
  assert.equal(base.gameplay.difficulty, 'nightmare', 'campaign untouched');

  const reloaded = sanitizeExtendedSettings({ gameplay: { difficulty: 'story' }, scary: { difficulty: 'hard' } });
  assert.equal(reloaded.gameplay.difficulty, 'story');
  assert.equal(reloaded.scary.difficulty, 'hard');

  const onlyCampaign = sanitizeExtendedSettings({ gameplay: { difficulty: 'abyssal' } });
  assert.equal(onlyCampaign.scary.difficulty, 'normal', 'campaign change never silently changes horror');
});

test('anti-jumpscare removes every startling layer but keeps the atmosphere', () => {
  const settings = {
    ...HORROR_DEFAULTS,
    enabled: true,
    difficulty: 'hard',
    antiJumpscare: true,
    jumpscares: true,
    fogDensity: 70,
    darkness: 60,
    vignette: 50,
    silhouetteVisibility: 80,
    horrorAmbience: true,
    environmentalSurprises: true,
  };
  const mode = resolveHorrorPresentation(settings);
  assert.equal(mode.antiJumpscare, true);
  assert.equal(mode.jumpscares.possible, false, 'no startling scares');
  assert.equal(mode.jumpscares.faceReveal, false, 'no face reveal');
  assert.equal(mode.jumpscares.screenTransitions, false);
  assert.equal(mode.jumpscares.bossIntro, false);
  assert.equal(mode.visual.flash, 0);
  assert.equal(mode.visual.distortion, 0);
  assert.equal(mode.visual.zoom, 0);
  assert.equal(mode.camera.shake, 0);
  assert.equal(mode.camera.suddenMovement, false);
  assert.equal(mode.audio.stingGain, 0);
  assert.equal(mode.audio.stingMuted, true);
  assert.equal(mode.jumpscares.warnings, 'always', 'warnings are forced on');
  // Horror content survives.
  assert.ok(mode.visual.fog > 0, 'fog remains');
  assert.ok(mode.visual.darkness > 0, 'darkness remains');
  assert.ok(mode.visual.vignette > 0);
  assert.ok(mode.visual.silhouette > 0);
  assert.equal(mode.audio.ambience, true, 'ambience remains');
  assert.equal(mode.gameplay.detection, SCARY_DIFFICULTY.hard.detection, 'hard enemies stay hard');
  assert.ok(mode.suppression.includes('anti-jumpscare'));
});

test('anti-jumpscare OFF allows the configured scare presentation', () => {
  const mode = resolveHorrorPresentation({ ...HORROR_DEFAULTS, enabled: true, flashes: 'full' });
  assert.equal(mode.jumpscares.possible, true);
  assert.equal(mode.jumpscares.faceReveal, true);
  assert.ok(mode.visual.flash > 0);
  assert.ok(mode.camera.shake > 0);
  assert.ok(mode.audio.stingGain > 0);
  assert.equal(mode.jumpscares.screenTransitions, true);
});

test('each comfort switch removes only its own layer', () => {
  const base = { ...HORROR_DEFAULTS, enabled: true };
  const noAudio = resolveHorrorPresentation({ ...base, noSuddenAudio: true });
  assert.equal(noAudio.audio.stingGain, 0);
  assert.ok(noAudio.visual.flash > 0, 'visuals untouched');

  const noShake = resolveHorrorPresentation({ ...base, noScreenShake: true });
  assert.equal(noShake.camera.shake, 0);
  assert.ok(noShake.audio.stingGain > 0);

  const noFlash = resolveHorrorPresentation({ ...base, noFlashing: true });
  assert.equal(noFlash.visual.flash, 0);
  assert.equal(noFlash.visual.flicker, false);
  assert.ok(noFlash.visual.distortion > 0);

  const noDistortion = resolveHorrorPresentation({ ...base, noDistortion: true });
  assert.equal(noDistortion.visual.distortion, 0);
  assert.ok(noDistortion.visual.flash > 0);

  const noFlashingLevel = resolveHorrorPresentation({ ...base, flashing: 'off' });
  assert.equal(noFlashingLevel.visual.flash, 0);
});

test('system accessibility overrides can only remove effects', () => {
  const mode = resolveHorrorPresentation(
    { ...HORROR_DEFAULTS, enabled: true, flashing: 'full', cameraShake: 'full', screenDistortion: 'full' },
    { accessibility: { reduceFlashing: true, reduceShake: true, reduceCameraMotion: true, reduceLoudSfx: true } },
  );
  assert.equal(mode.visual.flash, 0);
  assert.equal(mode.camera.shake, 0);
  assert.ok(mode.visual.distortion <= 0.21);
  assert.ok(mode.audio.stingGain <= 0.35);
  assert.equal(mode.visual.shadowMovement, false);
  for (const entry of ['no-flashing', 'no-screen-shake', 'reduced-motion']) {
    assert.ok(mode.suppression.includes(entry));
  }
});

test('the graphics budget scales horror effects without disabling the mode', () => {
  const high = resolveHorrorPresentation({ ...HORROR_DEFAULTS, enabled: true }, { graphics: { preset: 'high', postProcessing: 'high', animationQuality: 'high' } });
  const low = resolveHorrorPresentation({ ...HORROR_DEFAULTS, enabled: true }, { graphics: { preset: 'low', postProcessing: 'off', animationQuality: 'low' } });
  assert.ok(low.visual.fog < high.visual.fog);
  assert.equal(low.visual.particles, false);
  assert.equal(low.visual.post, false);
  assert.equal(low.visual.environmentAnimation, false);
  assert.equal(low.enabled, true);
  assert.ok(low.suppression.includes('graphics-budget'));
});

test('reduced horror effects soften every presentation layer', () => {
  const normal = resolveHorrorPresentation({ ...HORROR_DEFAULTS, enabled: true });
  const reduced = resolveHorrorPresentation({ ...HORROR_DEFAULTS, enabled: true, reducedHorrorEffects: true });
  assert.ok(reduced.visual.fog < normal.visual.fog);
  assert.ok(reduced.visual.darkness < normal.visual.darkness);
  assert.ok(reduced.jumpscares.durationMul < normal.jumpscares.durationMul);
});

test('detection intelligence overrides follow the setting instead of the difficulty', () => {
  const base = { ...HORROR_DEFAULTS, enabled: true, difficulty: 'hard' };
  assert.equal(resolveHorrorPresentation({ ...base, detectionIntelligence: 'auto' }).gameplay.detection, SCARY_DIFFICULTY.hard.detection);
  assert.equal(resolveHorrorPresentation({ ...base, detectionIntelligence: 'forgiving' }).gameplay.detection, 0.8);
  assert.equal(resolveHorrorPresentation({ ...base, detectionIntelligence: 'advanced' }).gameplay.detection, 1.3);
});

test('difficulty, cooldown extension and session ceiling shape scare pacing', () => {
  const easy = resolveHorrorPresentation({ ...HORROR_DEFAULTS, enabled: true, difficulty: 'easy', cooldown: 10 });
  const hard = resolveHorrorPresentation({ ...HORROR_DEFAULTS, enabled: true, difficulty: 'hard', cooldown: 10 });
  assert.ok(hard.jumpscares.maxPerSession > easy.jumpscares.maxPerSession);
  assert.ok(easy.jumpscares.cooldown > hard.jumpscares.cooldown, 'easy leaves longer gaps between scares');
  const extended = resolveHorrorPresentation({ ...HORROR_DEFAULTS, enabled: true, cooldown: 10, cooldownExtension: 100 });
  assert.ok(extended.jumpscares.cooldown > resolveHorrorPresentation({ ...HORROR_DEFAULTS, enabled: true, cooldown: 10 }).jumpscares.cooldown);
});

test('the scare ledger prevents immediate repeats and enforces the ceiling', () => {
  const ledger = new ScareLedger({ maxPerSession: 3, repeatPrevention: true, historyLimit: 2 });
  assert.equal(ledger.choose(['a', 'b'], () => 0), 'a');
  const second = ledger.choose(['a', 'b'], () => 0);
  assert.equal(second, 'b', 'recent scare is skipped');
  assert.equal(ledger.remaining(), 1);
  ledger.choose(['a', 'b']);
  assert.equal(ledger.choose(['a', 'b']), null, 'session ceiling reached');
  assert.equal(ledger.snapshot().suppressed, 1);
  ledger.reset();
  assert.equal(ledger.remaining(), 3);
});

test('all seventeen horror events ship with a complete lifecycle contract', () => {
  assert.equal(HORROR_EVENT_LIST.length, 17);
  assert.deepEqual(new Set(HORROR_EVENT_IDS).size, 17);
  for (const event of HORROR_EVENT_LIST) {
    assert.ok(event.duration > 0, `${event.id} duration`);
    assert.ok(event.cooldown > 0, `${event.id} cooldown`);
    assert.ok(event.start.length > 0, `${event.id} start changes`);
    assert.ok(event.end.length > 0, `${event.id} safe exit`);
    assert.ok(['soften', 'suppress'].includes(event.antiJumpscare), `${event.id} accessibility rule`);
    assert.ok(event.requires.includes('enabled'));
    assert.ok(event.requires.includes('explore'));
    assert.ok(['easy', 'normal', 'hard'].includes(event.minDifficulty));
    assert.ok(event.line.length > 0);
    assert.equal(event.start.length, event.end.length, `${event.id} restores what it changes`);
  }
  for (const id of ['silent_hallway', 'the_watcher', 'forgotten_footsteps', 'haunted_room', 'the_pursuit', 'broken_reflection', 'lost_signal', 'the_locked_door', 'whispering_relic', 'nightmare_rift', 'the_second_shadow', 'the_counting_knocks', 'the_floor_hand', 'the_glass_twin', 'the_hungry_light', 'the_bell_below', 'the_mourning_wake']) {
    assert.ok(HORROR_EVENTS[id], id);
  }
});

test('an event refuses to start when disabled, on cooldown or above its difficulty', () => {
  const off = new HorrorEventDirector({ enabled: false });
  assert.equal(off.tryStart('silent_hallway', explore), 'disabled');

  const easy = new HorrorEventDirector({ enabled: true, difficulty: 'easy' });
  assert.equal(easy.tryStart('nightmare_rift', explore), 'difficulty');
  assert.ok(easy.tryStart('silent_hallway', explore), 'easy event runs');

  assert.equal(easy.tryStart('forgotten_footsteps', explore), 'busy');
});

test('events move through warn, active and done with balanced changes', () => {
  const director = new HorrorEventDirector({ enabled: true, difficulty: 'hard', warningBeforeScares: true, jumpscares: true }, { seed: 9 });
  const started = director.tryStart('silent_hallway', explore);
  assert.equal(started.phase, 'warn');
  const startChanges = director.drain();
  assert.deepEqual(startChanges.map((c) => c.value), ['hush']);

  director.update(2, explore);
  assert.equal(director.snapshot().active.phase, 'active');
  director.update(15, explore);
  assert.equal(director.active, null, 'event ended');
  const endChanges = director.drain();
  assert.deepEqual(endChanges.map((c) => c.value), ['restore']);
  assert.equal(director.snapshot().completed.silent_hallway, 1);
  assert.ok(director.snapshot().cooldowns.silent_hallway > 0);
});

test('room changes, death, menus and cinematics cancel safely and restore state', () => {
  const cases = [
    ['room-change', { ...explore, roomIndex: 3 }, 'room'],
    ['death', { ...explore, hp: 0, dead: true }, 'death'],
    ['menu', { ...explore, menu: true }, 'menu'],
    ['cinematic', { ...explore, cinematic: true }, 'cinematic'],
    ['combat', { ...explore, combat: true }, 'combat'],
  ];
  for (const [reason, ctx] of cases) {
    const director = new HorrorEventDirector({ enabled: true, difficulty: 'hard' }, { seed: 11, roomIndex: 1 });
    assert.ok(director.tryStart('silent_hallway', explore));
    director.drain();
    director.update(0.1, ctx);
    const snap = director.snapshot();
    assert.equal(snap.active, null, `${reason} clears the active event`);
    const changes = director.drain();
    assert.ok(changes.some((change) => change.value === 'restore'), `${reason} applies the safe exit`);
    assert.equal(snap.last.reason, reason);
    assert.ok(snap.cancelled >= 1);
  }
});

test('low health and boss cinematics can disable horror when configured', () => {
  const low = new HorrorEventDirector({ enabled: true, difficulty: 'hard', disableAtLowHealth: true }, { seed: 12 });
  low.tryStart('silent_hallway', explore);
  low.update(0.1, { ...explore, hp: 10, maxHp: 100 });
  assert.equal(low.snapshot().last.reason, 'low-health');

  const cinematic = new HorrorEventDirector({ enabled: true, difficulty: 'hard', disableInBossCinematics: true }, { seed: 13 });
  cinematic.tryStart('the_watcher', explore);
  cinematic.update(0.1, { ...explore, cinematic: true });
  assert.equal(cinematic.snapshot().last.reason, 'cinematic');

  const tolerant = new HorrorEventDirector({ enabled: true, difficulty: 'hard', disableInBossCinematics: false }, { seed: 14 });
  tolerant.tryStart('the_watcher', explore);
  tolerant.update(0.1, { ...explore, cinematic: true });
  assert.ok(tolerant.snapshot().active, 'cinematic does not cancel when disabled');
});

test('a stuck event can never survive its hard timeout', () => {
  const director = new HorrorEventDirector({ enabled: true, difficulty: 'hard', warningBeforeScares: false }, { seed: 15 });
  director.tryStart('haunted_room', explore);
  director.active.duration = 999;
  director.active.hardTimeout = 2;
  director.update(3, explore);
  assert.equal(director.active, null);
  assert.equal(director.snapshot().last.reason, 'timeout');
  assert.ok(director.drain().some((change) => change.value === 'restore'));
});

test('anti-jumpscare suppresses startling events but keeps their atmosphere', () => {
  const director = new HorrorEventDirector({ enabled: true, difficulty: 'hard', antiJumpscare: true, warningBeforeScares: true }, { seed: 16 });
  const started = director.tryStart('broken_reflection', explore);
  assert.equal(started.suppressed, true, 'screen-interruption event is suppressed');
  assert.equal(started.phase, 'active', 'no warning phase while suppressed');
  const changes = director.drain();
  assert.equal(changes.some((change) => change.layer === 'screen'), false, 'no screen interruption applied');

  const audioDirector = new HorrorEventDirector({ enabled: true, difficulty: 'hard', antiJumpscare: true }, { seed: 17 });
  audioDirector.tryStart('forgotten_footsteps', explore);
  assert.ok(audioDirector.drain().some((change) => change.layer === 'audio'), 'non-startling audio event still runs');
});

test('autoStart only chooses events valid for the current context', () => {
  const director = new HorrorEventDirector({ enabled: true, difficulty: 'hard' }, { seed: 21, roomIndex: 0 });
  let started = 0;
  for (let i = 0; i < 40; i += 1) {
    const event = director.autoStart({ ...explore, enemyCount: 2, enemySlots: 2 });
    if (event && event.id) {
      started += 1;
      assert.notEqual(event.id, 'the_pursuit');
      assert.notEqual(event.id, 'nightmare_rift');
      director.cancel('test');
    }
    director.update(400, explore);
  }
  assert.ok(started > 0);
  assert.ok(director.started > 0);
});

test('the eight horror enemies are distinct and scale with difficulty', () => {
  assert.equal(SCARY_ENEMY_IDS.length, 8);
  const tactics = new Set();
  for (const id of SCARY_ENEMY_IDS) {
    const enemy = SCARY_ENEMIES[id];
    assert.ok(enemy.name && enemy.line && enemy.sound.sting);
    assert.ok(enemy.hp > 0 && enemy.damage > 0 && enemy.speed > 0);
    tactics.add(enemy.tactic);
  }
  assert.equal(tactics.size, 8, 'each enemy has its own tactic');

  const easy = makeScaryEnemy('silent_knight', 300, 'easy');
  const hard = makeScaryEnemy('silent_knight', 300, 'hard');
  assert.equal(easy.scaryKind, 'silent_knight');
  assert.ok(hard.dmgScale > easy.dmgScale);
  assert.ok(hard.speedScale > easy.speedScale);
  assert.equal(makeScaryEnemy('nope', 0), null);
});

test('the horror journal records only known content and persists', () => {
  const journal = new HorrorJournal();
  assert.equal(journal.record('enemies', 'silent_knight'), true);
  assert.equal(journal.record('enemies', 'silent_knight'), true, 're-encounter counts');
  assert.equal(journal.counters.encounters, 2);
  assert.equal(journal.record('enemies', 'not_real'), false);
  assert.equal(journal.record('events', 'not_real'), false);
  assert.equal(journal.record('events', 'the_watcher'), true);
  assert.equal(journal.record('areas', 'echoing_crypt'), true);
  assert.equal(journal.record('areas', 'echoing_crypt'), false, 'areas are unique');
  assert.equal(journal.record('relics', 'dark_lantern'), true);
  assert.equal(journal.record('challenges', 'last_light'), true);

  const reloaded = new HorrorJournal(JSON.parse(JSON.stringify(journal.toJSON())));
  assert.deepEqual(reloaded.areas, ['echoing_crypt']);
  assert.equal(reloaded.counters.encounters, 2);
  assert.deepEqual(reloaded.relics, ['dark_lantern']);
});

test('achievements unlock from real journal progress and grant cosmetics only', () => {
  const journal = new HorrorJournal();
  assert.equal(journal.unlockedAchievements().length, 0);
  journal.record('enemies', 'hollow_wraith');
  assert.ok(journal.unlockedAchievements().includes('first_encounter'));
  journal.record('areas', 'echoing_crypt');
  assert.ok(journal.unlockedAchievements().includes('silent_explorer'));
  assert.ok(journal.unlockedAchievements().includes('crypt_keeper'));
  for (let i = 0; i < 3; i += 1) journal.record('events', 'the_watcher');
  assert.ok(journal.unlockedAchievements().includes('night_watcher'));
  journal.recordClear('hard', { area: 'silent_hallway', challenge: 'default_horror' });
  assert.ok(journal.unlockedAchievements().includes('nightmare_survivor'));
  assert.ok(journal.unlockedAchievements().includes('fearless_explorer'));
  journal.record('challenges', 'last_light');
  for (const id of SCARY_ENEMY_IDS) journal.record('enemies', id);
  for (const id of HORROR_EVENT_IDS) journal.record('events', id);
  assert.ok(journal.unlockedAchievements().includes('the_uninvited'));
  assert.ok(journal.unlockedAchievements().includes('every_last_whisper'));
  assert.equal(journal.unlockedAchievements().length, HORROR_ACHIEVEMENTS.length);

  const granted = journal.grantRewards();
  assert.ok(granted.length > 0);
  for (const id of journal.rewards) {
    const reward = HORROR_REWARDS.find((entry) => entry.id === id);
    assert.ok(reward, `${id} is a known reward`);
    assert.equal(reward.cosmetic, true, 'rewards are cosmetic only');
    assert.equal('stats' in reward, false, 'no combat stats on rewards');
  }
  assert.equal(journal.grantRewards().length, 0, 'rewards are granted once');
  assert.equal(journal.rewards.length, HORROR_REWARDS.length);
});

test('journal save data survives corruption and unknown fields', () => {
  const clean = sanitizeHorrorProgress({ enemies: ['hollow_wraith', 'bogus'], events: { the_watcher: 2, bogus: 9 }, areas: ['echoing_crypt', 'x'], clears: { hard: 2 }, counters: { encounters: 5 } });
  assert.deepEqual(clean.enemies, ['hollow_wraith']);
  assert.deepEqual(clean.events, { the_watcher: 2 });
  assert.deepEqual(clean.areas, ['echoing_crypt']);
  assert.equal(clean.clears.hard, 2);
  assert.equal(clean.counters.encounters, 5);
  assert.deepEqual(sanitizeHorrorProgress('nope').enemies, []);
  assert.deepEqual(sanitizeHorrorProgress({ enemies: 'x' }).enemies, []);
});

test('settings sanitize clamps ranges and rejects unknown values', () => {
  const clean = sanitizeHorrorSettings({
    difficulty: 'ultra', antiJumpscare: 'yes', fogDensity: 999, darkness: -5, reverb: 300,
    duration: 99, cooldown: 0, maxScaresPerSession: -3, flashing: 'max', cameraShake: 'huge',
    detectionIntelligence: 'psychic', encounterFrequency: 'sometimes', scareIntensity: 'extreme',
  });
  assert.equal(clean.difficulty, 'normal');
  assert.equal(clean.antiJumpscare, false);
  assert.equal(clean.fogDensity, 100);
  assert.equal(clean.darkness, 0);
  assert.equal(clean.reverb, 100);
  assert.equal(clean.duration, 3);
  assert.equal(clean.cooldown, 2);
  assert.equal(clean.maxScaresPerSession, 0);
  assert.equal(clean.flashing, 'full');
  assert.equal(clean.cameraShake, 'full');
  assert.equal(clean.detectionIntelligence, 'auto');
  assert.equal(clean.encounterFrequency, 'medium');
  assert.equal(clean.scareIntensity, 'standard');
  assert.equal(sanitizeHorrorSettings({ antiJumpscare: true }).antiJumpscare, true);
  assert.equal(sanitizeHorrorSettings(null).enabled, false);
});

test('every horror tab has settings and every setting writes to scary.*', () => {
  assert.equal(HORROR_TABS.length, 5);
  const keys = new Set();
  const paths = new Set();
  for (const tab of HORROR_TABS) {
    const list = horrorSettingsForTab(tab.id);
    assert.ok(list.length >= 10, `${tab.id} has a real settings set`);
    for (const entry of list) {
      assert.ok(entry.path.startsWith('scary.'), entry.path);
      assert.ok(!keys.has(`${tab.id}:${entry.path}`), `${entry.path} appears once in ${tab.id}`);
      keys.add(`${tab.id}:${entry.path}`);
      paths.add(entry.path);
      assert.ok(entry.label && entry.desc);
    }
  }
  assert.ok(paths.size >= 55, `at least 55 horror controls (got ${paths.size})`);
  assert.ok(keys.size >= 60, `at least 60 rendered rows (got ${keys.size})`);
  for (const required of ['scary.antiJumpscare', 'scary.difficulty', 'scary.maxScaresPerSession', 'scary.repeatPrevention', 'scary.horrorAmbience', 'scary.fogDensity', 'scary.stalking', 'scary.disableAtLowHealth']) {
    assert.ok(paths.has(required), required);
  }
  assert.equal(HORROR_SETTING_DEFINITIONS.filter((entry) => entry.type === 'toggle').length >= 30, true);
});

test('settings persist horror difficulty and comfort flags without enabling scares', () => {
  const stored = sanitizeExtendedSettings({ scary: { enabled: true, difficulty: 'hard', antiJumpscare: true, maxScaresPerSession: 4 } });
  assert.equal(stored.scary.difficulty, 'hard');
  assert.equal(stored.scary.antiJumpscare, true);
  assert.equal(stored.scary.maxScaresPerSession, 4);
  assert.equal(stored.scary.enabled, true);
  const blocked = sanitizeExtendedSettings({ scary: { antiJumpscare: true } });
  assert.equal(blocked.scary.enabled, false, 'anti-jumpscare alone does not turn the mode on');
  const legacy = sanitizeExtendedSettings({ scary: { enabled: true, cooldown: 999, intensity: 'insane' } });
  assert.equal(legacy.scary.cooldown, 120);
  assert.equal(legacy.scary.intensity, 'standard');
  assert.ok(SETTING_DEFINITIONS.some((entry) => entry.path === 'scary.enabled'));
});

test('the horror summary reports the active layer without leaking campaign settings', () => {
  const journal = new HorrorJournal();
  journal.record('enemies', 'hollow_wraith');
  const summary = horrorSummary({ enabled: true, difficulty: 'hard', antiJumpscare: true }, journal);
  assert.equal(summary.difficulty, 'hard');
  assert.equal(summary.antiJumpscare, true);
  assert.equal(summary.status, 'comfort');
  assert.equal(summary.enabled, true);
  assert.equal(summary.intensity, 'high');
  assert.ok(summary.journal.enemies.startsWith('1/8'));
  assert.equal(horrorSummary({}).status, 'off');
  assert.equal(HORROR_SAVE_KEY, 'ashen-vow-horror-v1');
  assert.deepEqual(HORROR_REWARD_IDS.length, 9);
});
