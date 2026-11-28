import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_BOSS_INFO } from '../src/core.js';
import {
  VOICE_ARCHETYPES,
  BOSS_VOICE_ROOT,
  archetypeForBoss,
  bossVoiceScript,
  bossVoiceLine,
  bossVoiceSummary,
  sanitizeVoiceManifest,
  sanitizeBossVoiceSettings,
  defaultBossVoiceSettings,
  resolveBossVoiceSource,
  voiceLineId,
} from '../src/boss_voice.js';

test('every boss line in the game is in the voice script, once, with a stable id and file', () => {
  let expected = 0;
  for (const info of Object.values(ALL_BOSS_INFO)) {
    for (const lines of Object.values(info.dialogue || {})) expected += lines.length;
  }
  const rows = bossVoiceScript();
  assert.equal(rows.length, expected);
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length);
  assert.equal(new Set(rows.map((r) => r.file)).size, rows.length);
  const summary = bossVoiceSummary();
  assert.equal(summary.bosses, Object.keys(ALL_BOSS_INFO).length, 'all bosses are voiced');
  for (const r of rows) {
    assert.ok(r.text.length > 0, r.id);
    assert.ok(VOICE_ARCHETYPES[r.archetype], r.id);
    assert.ok(r.file.startsWith(`${BOSS_VOICE_ROOT}/${r.kind}/${r.key}-`), r.id);
  }
});

test('every boss speaks at its intro, every phase it has, and its defeat', () => {
  for (const [kind, info] of Object.entries(ALL_BOSS_INFO)) {
    const keys = new Set(bossVoiceScript().filter((r) => r.kind === kind).map((r) => r.key));
    assert.ok(keys.has('intro'), `${kind} intro`);
    assert.ok(keys.has('defeat'), `${kind} defeat`);
    const phases = Math.max(2, Number(info.maxPhases) || 2);
    for (let p = 2; p <= phases; p += 1) {
      if (info.dialogue?.[`phase${p}`]) assert.ok(keys.has(`phase${p}`), `${kind} phase${p}`);
    }
  }
});

test('archetypes: named bosses keep their voice, the player is the hero, every archetype is well-formed', () => {
  assert.equal(archetypeForBoss('warden'), 'titan');
  assert.equal(archetypeForBoss('wyrm'), 'wyrm');
  assert.equal(archetypeForBoss('choir'), 'choir');
  assert.equal(archetypeForBoss('tidebound'), 'drowned');
  assert.equal(bossVoiceLine('warden', 'intro', 1).archetype, 'hero', 'The Oathbound line uses the hero voice');
  assert.equal(bossVoiceLine('warden', 'intro', 0).archetype, 'titan');
  for (const [id, a] of Object.entries(VOICE_ARCHETYPES)) {
    assert.ok(a.pitch > 0.5 && a.pitch < 1.5, id);
    assert.ok(a.reverb > 0 && a.wet >= 0 && a.wet <= 1, id);
    assert.ok(a.direction.length > 20, `${id} has direction for the actor`);
    if (id !== 'hero') assert.ok(a.sting && a.sting.base > 20 && a.sting.voices >= 2, `${id} sting`);
  }
});

test('manifest sanitizer keeps only known lines and safe paths', () => {
  const m = sanitizeVoiceManifest({
    files: ['warden.intro.1', 'warden.intro.1', 'nope.intro.1', 42],
    paths: { 'warden.intro.1': `${BOSS_VOICE_ROOT}/warden/intro-1.ogg`, 'nope.intro.1': 'x.mp3' },
  });
  assert.deepEqual(m.files, ['warden.intro.1']);
  assert.equal(m.paths['warden.intro.1'], `${BOSS_VOICE_ROOT}/warden/intro-1.ogg`);
  assert.deepEqual(sanitizeVoiceManifest({ files: ['warden.intro.1'], paths: { 'warden.intro.1': '../../etc/passwd.mp3' } }).paths, {});
  assert.deepEqual(sanitizeVoiceManifest({ files: ['warden.intro.1'], paths: { 'warden.intro.1': 'https://evil/x.mp3' } }).paths, {});
  assert.deepEqual(sanitizeVoiceManifest(null).files, []);
});

test('settings default to no AI voice, and AI is always processed', () => {
  const d = defaultBossVoiceSettings();
  assert.equal(d.allowAi, false);
  assert.equal(d.mode, 'recorded-first');
  assert.deepEqual(sanitizeBossVoiceSettings({ mode: 'weird', allowAi: 'yes' }), d);
  assert.equal(sanitizeBossVoiceSettings({ allowAi: true, processing: false }).processing, true);
});

test('source resolution: recording, then opted-in AI, then sting; never plain TTS', () => {
  const recorded = new Set([voiceLineId('warden', 'intro', 0)]);
  const base = { kind: 'warden', key: 'intro', index: 0, recorded, aiConfigured: true, online: true };
  assert.equal(resolveBossVoiceSource({ ...base, settings: null }), 'recorded');
  assert.equal(resolveBossVoiceSource({ ...base, index: 2, settings: null }), 'sting', 'no recording, AI not allowed');
  assert.equal(resolveBossVoiceSource({ ...base, index: 2, settings: { allowAi: true } }), 'ai');
  assert.equal(resolveBossVoiceSource({ ...base, index: 2, aiConfigured: false, settings: { allowAi: true } }), 'sting');
  assert.equal(resolveBossVoiceSource({ ...base, settings: { mode: 'stings-only' } }), 'sting');
  assert.equal(resolveBossVoiceSource({ ...base, settings: { mode: 'off' } }), 'none');
  assert.equal(resolveBossVoiceSource({ ...base, voiceEnabled: false, settings: null }), 'none');
  assert.equal(resolveBossVoiceSource({ ...base, text: 'kata lain', settings: null }), 'sting', 'overridden words skip the recording');
  for (const r of ['recorded', 'ai', 'sting', 'none']) assert.notEqual(r, 'browser');
});
