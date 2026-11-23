import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SECRETS_SAVE_KEY,
  SECRET_SEQUENCE,
  SECRET_MODE_KEYS,
  SECRET_LEVEL_RUNES,
  advanceSecretSequence,
  createSecretBuffer,
  defaultSecretsSave,
  hasSecret,
  recordSecret,
  sanitizeSecretsSave,
  secretForMode,
  secretSpotFor,
  secretSummary,
} from '../src/secrets.js';

test('the hidden ledger uses its own save key and stores no combat values', () => {
  assert.equal(SECRETS_SAVE_KEY, 'ashen-vow-secrets-v1');
  const state = defaultSecretsSave();
  assert.equal(state.schemaVersion, 1);
  assert.deepEqual(state.found, []);
  for (const key of Object.keys(state)) {
    assert.ok(!/damage|hp|speed|ash|reward|multiplier/i.test(key), `ledger must not contain ${key}`);
  }
});

test('every game mode has a quiet mark and none of them advertise themselves', () => {
  assert.ok(SECRET_MODE_KEYS.length >= 30);
  for (const mode of SECRET_MODE_KEYS) {
    const mark = secretForMode(mode);
    assert.ok(mark, `${mode} needs a mark`);
    assert.equal(mark.mode, mode);
    assert.match(mark.id, /^mode:/);
    assert.ok(mark.whisper.length > 20);
    assert.ok(!/easter egg|secret|rahasia|konami/i.test(mark.whisper), 'the whisper must stay unexplained');
  }
});

test('campaign runes exist in a handful of real rooms and are not signposted', () => {
  assert.equal(SECRET_LEVEL_RUNES.length, 7);
  const rooms = new Set();
  for (const rune of SECRET_LEVEL_RUNES) {
    // Legacy campaign rooms plus the Tidewrought Cistern secrets (662+).
    assert.ok(Number.isInteger(rune.room) && ((rune.room >= 0 && rune.room < 14) || rune.room >= 662));
    assert.ok(Number.isFinite(rune.x) && Number.isFinite(rune.y));
    assert.ok(rune.glyph.length >= 1);
    assert.ok(!rooms.has(rune.room), 'only one rune per room');
    rooms.add(rune.room);
  }
  assert.equal(secretSpotFor('legacy', 0).id, 'level:ash_gate_whisper');
  assert.equal(secretSpotFor('legacy', 4).id, 'level:bone_bridge_whisper');
  assert.equal(secretSpotFor('speedrun', 7).id, 'level:summit_whisper');
  assert.equal(secretSpotFor('legacy', 1), null);
});

test('the sequence only triggers on the exact final key and resets on noise', () => {
  const buffer = createSecretBuffer();
  let fired = 0;
  for (const key of SECRET_SEQUENCE) {
    if (advanceSecretSequence(buffer, key, 1000)) fired += 1;
  }
  assert.equal(fired, 1);
  assert.equal(buffer.buffer.length, 0);

  const noisy = createSecretBuffer();
  advanceSecretSequence(noisy, 'ArrowUp', 1000);
  advanceSecretSequence(noisy, 'ArrowDown', 1010);
  assert.equal(noisy.buffer.length, 0);
  assert.equal(advanceSecretSequence(noisy, 'KeyA', 1020), false);
});

test('the sequence expires if the player takes too long', () => {
  const buffer = createSecretBuffer();
  for (const key of SECRET_SEQUENCE.slice(0, 5)) advanceSecretSequence(buffer, key, 1000);
  assert.equal(buffer.buffer.length, 5);
  advanceSecretSequence(buffer, SECRET_SEQUENCE[5], 9000);
  assert.equal(buffer.buffer.length, 0, 'the old prefix is discarded after the window');
  assert.equal(advanceSecretSequence(buffer, SECRET_SEQUENCE[6], 9001), false);
  const fresh = createSecretBuffer();
  let fired = 0;
  for (const key of SECRET_SEQUENCE) if (advanceSecretSequence(fresh, key, 9500)) fired += 1;
  assert.equal(fired, 1, 'a fresh sequence still works after expiry');
});

test('a found secret is recorded once, persisted once and counted by kind', () => {
  let state = defaultSecretsSave();
  const level = recordSecret(state, 'level:ash_gate_whisper', { at: 111 });
  assert.equal(level.ok, true);
  assert.equal(level.firstTime, true);
  assert.equal(level.state.levelFinds, 1);
  assert.equal(level.state.modeFinds, 0);
  assert.equal(level.state.lastAt, 111);

  const repeat = recordSecret(level.state, 'level:ash_gate_whisper', { at: 222 });
  assert.equal(repeat.firstTime, false);
  assert.equal(repeat.state.found.length, 1);

  const mode = recordSecret(repeat.state, 'mode:legacy', { at: 333 });
  assert.equal(mode.state.modeFinds, 1);
  assert.equal(mode.state.sequenceTriggers, 1);
  assert.equal(hasSecret(mode.state, 'mode:legacy'), true);
  assert.equal(hasSecret(mode.state, 'mode:eternal'), false);
});

test('unknown ids are refused without touching the ledger', () => {
  const state = defaultSecretsSave();
  const result = recordSecret(state, 'mode:not-a-real-mode');
  assert.equal(result.ok, false);
  assert.equal(result.firstTime, false);
  assert.equal(result.state.found.length, 0);
});

test('the sanitizer keeps valid finds, repairs counters and drops junk', () => {
  const state = sanitizeSecretsSave({
    found: ['level:ash_gate_whisper', 'mode:legacy', 'mode:legacy', 'nonsense', 42],
    sequenceTriggers: -8,
    levelFinds: 99,
    modeFinds: 99,
    lastAt: 'nope',
  });
  assert.deepEqual(state.found, ['level:ash_gate_whisper', 'mode:legacy']);
  assert.equal(state.sequenceTriggers, 0);
  assert.equal(state.levelFinds, 1);
  assert.equal(state.modeFinds, 1);
  assert.equal(state.lastAt, 0);
  assert.deepEqual(sanitizeSecretsSave(null), defaultSecretsSave());
});

test('the summary reports level and mode totals without exposing locations', () => {
  const state = sanitizeSecretsSave({ found: ['level:ash_gate_whisper', 'mode:legacy'] });
  const summary = secretSummary(state);
  assert.equal(summary.levels, 1);
  assert.equal(summary.levelTotal, SECRET_LEVEL_RUNES.length);
  assert.equal(summary.modes, 1);
  assert.equal(summary.modeTotal, SECRET_MODE_KEYS.length);
  assert.equal(summary.complete, false);
  assert.ok(!('spots' in summary));
});
