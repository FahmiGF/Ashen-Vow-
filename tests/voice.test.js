// Tests for the voice-acting layer: cast catalogue, saved preferences, the
// request contract sent to the ElevenLabs proxy, and provider resolution.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  VOICE_SAVE_KEY,
  VOICE_SCHEMA_VERSION,
  VOICE_MODEL,
  VOICE_MAX_CHARS,
  VOICE_CAST,
  VOICE_CAST_BY_ID,
  castFor,
  defaultVoiceSave,
  sanitizeVoiceSave,
  voiceIdFor,
  voiceRequestFor,
  resolveVoiceProvider,
  voiceSummary,
  voiceBadge,
} from '../src/voice.js';

test('voice save key and cast catalogue are stable', () => {
  assert.equal(VOICE_SAVE_KEY, 'ashen-vow-voice-v1');
  assert.equal(VOICE_SCHEMA_VERSION, 1);
  assert.equal(VOICE_MODEL, 'eleven_multilingual_v2');
  assert.equal(VOICE_CAST.length, 8);
  assert.equal(new Set(VOICE_CAST.map((member) => member.id)).size, 8);
  assert.equal(new Set(VOICE_CAST.map((member) => member.elevenVoiceId)).size, 8);
  for (const member of VOICE_CAST) {
    assert.ok(member.name && member.role && member.description, `${member.id} is documented`);
    assert.match(member.elevenVoiceId, /^[A-Za-z0-9]{8,64}$/);
    assert.ok(member.fallback.rate > 0 && member.fallback.rate <= 2);
    assert.ok(member.fallback.pitch >= 0 && member.fallback.pitch <= 2);
  }
  assert.equal(castFor('missing').id, 'narrator');
  assert.equal(castFor('wickbearer').name, 'Orsella');
  assert.equal(VOICE_CAST_BY_ID.ghost.role, 'horror');
});

test('a fresh save enables acting and prefers ElevenLabs', () => {
  const save = defaultVoiceSave();
  assert.equal(save.enabled, true);
  assert.equal(save.preferElevenLabs, true);
  assert.equal(save.volume, 85);
  assert.equal(save.linesPlayed, 0);
  assert.deepEqual(save.castOverrides, {});
});

test('the sanitizer repairs junk without losing valid preferences', () => {
  const repaired = sanitizeVoiceSave({
    enabled: 'yes',
    preferElevenLabs: false,
    volume: 480,
    autoplayInTrailer: false,
    linesPlayed: -12,
    providerUsed: 'smoke-signal',
    castOverrides: {
      narrator: '  abcdefgh12345678  ',
      wyrm: 'not a voice id!',
      impostor: 'abcdefgh12345678',
      ghost: 42,
    },
  });
  assert.equal(repaired.enabled, true, 'non-boolean falls back to the default');
  assert.equal(repaired.preferElevenLabs, false);
  assert.equal(repaired.volume, 100, 'volume clamps');
  assert.equal(repaired.autoplayInTrailer, false);
  assert.equal(repaired.linesPlayed, 0, 'negative counters clamp');
  assert.equal(repaired.providerUsed, 'unknown');
  assert.deepEqual(repaired.castOverrides, { narrator: 'abcdefgh12345678' });
  assert.deepEqual(sanitizeVoiceSave(null), defaultVoiceSave());
});

test('cast overrides are applied per member and never leak across cast ids', () => {
  const save = sanitizeVoiceSave({ castOverrides: { narrator: 'zzzzzzzz11111111' } });
  assert.equal(voiceIdFor(save, 'narrator'), 'zzzzzzzz11111111');
  assert.equal(voiceIdFor(save, 'trailer'), castFor('trailer').elevenVoiceId);
  assert.equal(voiceIdFor(defaultVoiceSave(), 'ghost'), castFor('ghost').elevenVoiceId);
});

test('the request contract validates text and carries delivery settings', () => {
  const empty = voiceRequestFor({ text: '   ' });
  assert.equal(empty.ok, false);
  assert.equal(empty.reason, 'empty');

  const long = voiceRequestFor({ text: 'a'.repeat(VOICE_MAX_CHARS + 1) });
  assert.equal(long.ok, false);
  assert.equal(long.reason, 'too-long');

  const request = voiceRequestFor({ text: '  Sumpah   ini  tidak bisa ditarik. ', cast: 'oathbreaker' });
  assert.equal(request.ok, true);
  assert.equal(request.body.text, 'Sumpah ini tidak bisa ditarik.', 'whitespace collapses');
  assert.equal(request.body.cast, 'oathbreaker');
  assert.equal(request.body.modelId, VOICE_MODEL);
  assert.equal(request.body.voiceId, castFor('oathbreaker').elevenVoiceId);
  assert.ok(request.body.delivery.stability > 0 && request.body.delivery.stability < 1);
  assert.equal(request.body.delivery.use_speaker_boost, true);
});

test('provider resolution only chooses ElevenLabs when it can actually speak', () => {
  const save = defaultVoiceSave();
  assert.equal(resolveVoiceProvider({ save, configured: true }), 'elevenlabs');
  assert.equal(resolveVoiceProvider({ save, configured: false }), 'browser');
  assert.equal(resolveVoiceProvider({ save, configured: true, online: false }), 'browser');
  assert.equal(resolveVoiceProvider({ save, configured: true, browserAvailable: false }), 'elevenlabs');
  assert.equal(resolveVoiceProvider({ save, configured: false, browserAvailable: false }), 'none');
  assert.equal(resolveVoiceProvider({ save: { ...save, enabled: false }, configured: true }), 'none');
  assert.equal(resolveVoiceProvider({ save: { ...save, preferElevenLabs: false }, configured: true }), 'browser');
});

test('summary and badge expose the missing key instead of hiding it', () => {
  const base = { cast: 8, enabled: true, overrides: 0, volume: 85, linesPlayed: 4, maxChars: VOICE_MAX_CHARS };
  const ready = voiceSummary(defaultVoiceSave(), { configured: true });
  assert.equal(ready.provider, 'elevenlabs');
  assert.equal(ready.model, VOICE_MODEL);
  assert.ok(ready.cast >= base.cast);
  assert.equal(voiceBadge(ready), 'SUARA: ELEVENLABS');

  const fallback = voiceSummary(defaultVoiceSave(), { configured: false });
  assert.equal(fallback.provider, 'browser');
  assert.equal(voiceBadge(fallback), 'SUARA: BROWSER');

  const silent = voiceSummary(sanitizeVoiceSave({ enabled: false }), { configured: true });
  assert.equal(silent.provider, 'none');
  assert.equal(voiceBadge(silent), 'SUARA: MATI');

  const offline = voiceSummary(defaultVoiceSave(), { configured: false, browserAvailable: false });
  assert.equal(voiceBadge(offline), 'SUARA: TIDAK TERSEDIA');
});
