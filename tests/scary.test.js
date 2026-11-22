import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SETTING_DEFINITIONS, defaultExtendedSettings, sanitizeExtendedSettings } from '../src/settings2.js';
import {
  SCARE_DEFAULTS,
  SCARE_PROFILES,
  ScareDirector,
  scareProfileFor,
  sanitizeScarySettings,
  scaryModeActive,
} from '../src/scary.js';

const hit = { source: { type: 'sentinel', name: 'Sentinel' }, x: 100, y: 400, damage: 14 };
const clean = { hp: 80, menu: false, paused: false, loading: false, cinematic: false, dialogue: false };

test('Scary Mode is disabled by default and produces no effect', () => {
  assert.equal(SCARE_DEFAULTS.enabled, false);
  assert.equal(scaryModeActive({}), false);
  const director = new ScareDirector({}, { seed: 1 });
  assert.equal(director.onPlayerHit(hit, clean), null);
  assert.equal(director.snapshot().eligibility, 'disabled');
});

test('an enabled, eligible hit produces a presentation effect with zero damage', () => {
  const director = new ScareDirector({ enabled: true, frequency: 'high' }, { seed: 2 });
  const effect = director.onPlayerHit(hit, clean);
  assert.ok(effect, 'scare triggered');
  assert.equal(effect.damage, 0, 'a scare never carries damage');
  assert.equal(effect.blocksInput, false);
  assert.equal(effect.kind, 'jumpscare');
  assert.ok(effect.duration > 0);
  assert.equal(effect.profile.portrait, 'helmet');
  assert.ok(effect.audio.gain > 0);
});

test('the cooldown prevents repeated scares and then expires', () => {
  const director = new ScareDirector({ enabled: true, frequency: 'high', cooldown: 5 }, { seed: 3 });
  assert.ok(director.onPlayerHit(hit, clean));
  assert.equal(director.onPlayerHit(hit, clean), null);
  assert.equal(director.snapshot().eligibility, 'cooldown');
  director.tick(5.2);
  assert.ok(director.onPlayerHit(hit, clean), 'cooldown elapsed');
});

test('menus, loading screens, cutscenes and dialogue never trigger scares', () => {
  const director = new ScareDirector({ enabled: true, frequency: 'high' }, { seed: 4 });
  for (const context of [{ menu: true }, { paused: true }, { uiOpen: true }, { loading: true }, { cinematic: true }, { dialogue: true }]) {
    assert.equal(director.onPlayerHit(hit, { ...clean, ...context }), null, JSON.stringify(context));
  }
  assert.ok(director.onPlayerHit(hit, clean), 'normal combat still allows a scare');
});

test('the frequency setting scales how often eligible hits trigger', () => {
  const low = new ScareDirector({ enabled: true, frequency: 'low' }, { seed: 5 });
  const high = new ScareDirector({ enabled: true, frequency: 'high' }, { seed: 5 });
  let lowCount = 0;
  let highCount = 0;
  for (let i = 0; i < 200; i += 1) {
    low.tick(30);
    high.tick(30);
    if (low.onPlayerHit(hit, clean)) lowCount += 1;
    if (high.onPlayerHit(hit, clean)) highCount += 1;
  }
  assert.ok(highCount > lowCount, `high (${highCount}) should out-trigger low (${lowCount})`);
  assert.ok(lowCount > 0);
});

test('accessibility overrides remove flashing, shake and motion', () => {
  const director = new ScareDirector({ enabled: true, intensity: 'intense', frequency: 'high' });
  director.setAccessibility({ reduceFlashing: true, reduceCameraMotion: true, reduceShake: true, reduceLoudSfx: true });
  const effect = director.onPlayerHit(hit, { ...clean, force: true });
  assert.equal(effect.flash, 0, 'no flashing');
  assert.ok(effect.shake < 0.2, 'camera motion suppressed');
  assert.equal(effect.motion, 'still');
  assert.ok(effect.audio.gain <= 0.08, 'loud sting capped');
  assert.equal(effect.accessibility.reducedMotion, true);
});

test('turning screen effects and audio off keeps the scare silent', () => {
  const director = new ScareDirector({
    enabled: true, frequency: 'high', screenEffects: 'off', suddenAudio: 'off', cameraShake: 'off',
  });
  const effect = director.onPlayerHit(hit, { ...clean, force: true });
  assert.equal(effect.audio.muted, true);
  assert.equal(effect.audio.gain, 0);
  assert.equal(effect.flash, 0);
  assert.equal(effect.distortion, 0);
  assert.equal(effect.shake, 0);
  assert.equal(effect.accessibility.silent, true);
});

test('effects expire on their own and the camera returns to rest', () => {
  const director = new ScareDirector({ enabled: true, frequency: 'high' }, { seed: 6 });
  director.onPlayerHit(hit, { ...clean, force: true });
  assert.ok(director.cameraKick().zoom >= 1);
  for (let i = 0; i < 240; i += 1) director.tick(1 / 60);
  assert.equal(director.active, null);
  assert.deepEqual(director.cameraKick(), { x: 0, y: 0, zoom: 1 });
  assert.equal(director.snapshot().activeState, 'idle');
});

test('the preview button demonstrates effects while the mode is off', () => {
  const director = new ScareDirector({ enabled: false }, { seed: 7 });
  const effect = director.preview({ type: 'brute' });
  assert.ok(effect);
  assert.equal(effect.preview, true);
  assert.equal(effect.profile.portrait, 'golem');
  assert.equal(director.snapshot().enabled, false);
  assert.equal(director.previewCount, 1);
});

test('every enemy family has its own scare presentation', () => {
  const families = ['crawler', 'sentinel', 'wraith', 'brute', 'sporeling', 'stalker', 'broodmother'];
  const portraits = new Set();
  const stingTypes = new Set();
  for (const family of families) {
    const profile = scareProfileFor({ type: family });
    assert.ok(profile, `${family} has a profile`);
    portraits.add(profile.portrait);
    stingTypes.add(profile.sting.type);
  }
  assert.equal(portraits.size, families.length, 'each family looks different');
  assert.ok(stingTypes.size >= 3, 'stings vary');
  assert.equal(scareProfileFor({ bossKind: 'wyrm' }).portrait, 'dragon');
  assert.equal(scareProfileFor({ type: 'wyrm', boss: true }).portrait, 'dragon');
  assert.equal(scareProfileFor({}).label, SCARE_PROFILES.unknown.label);
});

test('settings sanitize unknown values and clamp the cooldown', () => {
  const cleaned = sanitizeScarySettings({
    enabled: 'yes', intensity: 'insane', frequency: 'always', screenEffects: 'max',
    suddenAudio: 'lots', cameraShake: 'huge', cooldown: 9999,
  });
  assert.equal(cleaned.enabled, true);
  assert.equal(cleaned.intensity, 'standard');
  assert.equal(cleaned.frequency, 'medium');
  assert.equal(cleaned.screenEffects, 'full');
  assert.equal(cleaned.suddenAudio, 'full');
  assert.equal(cleaned.cooldown, 120);
  assert.equal(sanitizeScarySettings({ cooldown: -5 }).cooldown, 2);
  assert.equal(sanitizeScarySettings({ cooldown: 'abc' }).cooldown, SCARE_DEFAULTS.cooldown);
});

test('the console settings change intensity without changing eligibility', () => {
  const mild = new ScareDirector({ enabled: true, intensity: 'mild', frequency: 'high' }, { seed: 8 });
  const intense = new ScareDirector({ enabled: true, intensity: 'intense', frequency: 'high' }, { seed: 8 });
  const a = mild.onPlayerHit(hit, { ...clean, force: true });
  const b = intense.onPlayerHit(hit, { ...clean, force: true });
  assert.ok(b.duration > a.duration);
  assert.ok(b.shake > a.shake);
  assert.ok(b.audio.gain > a.audio.gain);
});

test('the settings schema ships Scary Mode off by default with every control', () => {
  const defaults = defaultExtendedSettings();
  assert.equal(defaults.scary.enabled, false, 'stored settings default to off');
  const paths = SETTING_DEFINITIONS.filter((entry) => entry.path.startsWith('scary.')).map((entry) => entry.path);
  for (const path of [
    'scary.enabled', 'scary.intensity', 'scary.frequency', 'scary.screenEffects',
    'scary.suddenAudio', 'scary.cameraShake', 'scary.surpriseEvents', 'scary.ambience',
    'scary.warnings', 'scary.cooldown', 'scary.notifications',
  ]) {
    assert.ok(paths.includes(path), `${path} missing from the settings schema`);
  }
  assert.ok(paths.length >= 11);
});

test('reloaded settings sanitize Scary Mode without enabling it by accident', () => {
  const clean = sanitizeExtendedSettings({ scary: { enabled: true, cooldown: 999, intensity: 'insane' } });
  assert.equal(clean.scary.enabled, true, 'an explicit opt-in survives');
  assert.equal(clean.scary.cooldown, 120, 'cooldown is clamped');
  assert.equal(clean.scary.intensity, SCARE_DEFAULTS.intensity, 'unknown intensity falls back');
  const corrupted = sanitizeExtendedSettings({ scary: 'yes' });
  assert.equal(corrupted.scary.enabled, false, 'corrupt payload never turns scares on');
  const disabled = sanitizeExtendedSettings({ scary: { enabled: false, ambience: true } });
  assert.equal(disabled.scary.ambience, true, 'ambience is independent of jumpscares');
});

test('the debug snapshot reports trigger source, cooldown and overrides', () => {
  const director = new ScareDirector({ enabled: true, frequency: 'high' }, { seed: 10 });
  director.setAccessibility({ reduceFlashing: true });
  director.onPlayerHit(hit, { ...clean, force: true });
  const snap = director.snapshot();
  assert.equal(snap.enabled, true);
  assert.equal(snap.triggerSource, 'sentinel');
  assert.equal(snap.activeState, 'playing');
  assert.equal(snap.presentation, 'helmet-reveal');
  assert.ok(snap.cooldown > 0);
  assert.equal(snap.accessibility.reducedFlashing, true);
  assert.ok(Array.isArray(snap.history));
});
