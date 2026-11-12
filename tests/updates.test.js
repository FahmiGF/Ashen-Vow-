import test from 'node:test';
import assert from 'node:assert/strict';
import { UPDATE_LOG, GAME_VERSION, LATEST_UPDATE } from '../src/updates.js';

test('update log is complete and ordered newest first', () => {
  assert.ok(UPDATE_LOG.length >= 5, 'the update log should keep the full release history');
  assert.equal(LATEST_UPDATE, UPDATE_LOG[0]);
  assert.equal(UPDATE_LOG[0].version, GAME_VERSION);

  const seen = new Set();
  let previous = null;
  for (const entry of UPDATE_LOG) {
    assert.match(entry.version, /^\d+\.\d+\.\d+$/);
    assert.ok(!seen.has(entry.version), `duplicate version ${entry.version}`);
    seen.add(entry.version);
    assert.ok(entry.date && entry.title && entry.tag && entry.summary);
    assert.ok(Array.isArray(entry.highlights) && entry.highlights.length > 0);
    assert.ok(entry.highlights.every((line) => typeof line === 'string' && line.length > 0));
    assert.ok(!entry.fixes || entry.fixes.every((line) => typeof line === 'string' && line.length > 0));

    if (previous) {
      const [a, b, c] = previous.version.split('.').map(Number);
      const [x, y, z] = entry.version.split('.').map(Number);
      const newer = a > x || (a === x && (b > y || (b === y && c > z)));
      assert.ok(newer, `${previous.version} should come before ${entry.version}`);
    }
    previous = entry;
  }
});

test('the latest update documents the Sigil & Ritual content', () => {
  const latest = LATEST_UPDATE;
  const text = [latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  assert.match(text, /Sigil/i);
  assert.match(text, /Ritual/i);
  assert.match(text, /Inventaris/i);
  assert.match(text, /Gladiator/i);
});
