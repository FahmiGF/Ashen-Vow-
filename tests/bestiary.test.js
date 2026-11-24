import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_ENEMY_INFO, ALL_BOSS_INFO, CODEX } from '../src/core.js';
import {
  BESTIARY_SOURCES,
  bestiaryIndex,
  bestiaryEntries,
  bestiarySources,
  bestiaryEntry,
} from '../src/bestiary.js';
import { CLASS_WEAPON } from '../src/portraits.js';
import { CLASS_ACCENTS, classAccent } from '../src/render.js';
import { CHARACTERS } from '../src/core.js';

test('the illustrated Index covers every enemy and boss the game can spawn, once', () => {
  const { enemies, bosses } = bestiaryIndex();
  assert.equal(enemies.length, Object.keys(ALL_ENEMY_INFO).length);
  assert.equal(bosses.length, Object.keys(ALL_BOSS_INFO).length);
  assert.deepEqual(new Set(enemies.map((e) => e.id)), new Set(Object.keys(ALL_ENEMY_INFO)));
  assert.deepEqual(new Set(bosses.map((b) => b.id)), new Set(Object.keys(ALL_BOSS_INFO)));
  // The legacy codex contract is untouched.
  assert.equal(CODEX.enemies.length, 7);
  assert.equal(CODEX.bosses.length, 6);
});

test('every Index entry has readable text, an accent colour and three stats', () => {
  const { enemies, bosses } = bestiaryIndex();
  for (const entry of [...enemies, ...bosses]) {
    assert.ok(entry.name.length > 0, entry.id);
    assert.match(entry.accent, /^#[0-9a-f]{3,8}$/i, entry.id);
    assert.equal(entry.stats.length, 3, entry.id);
    for (const [, value] of entry.stats) assert.ok(Number.isFinite(Number(value)), entry.id);
    assert.ok(BESTIARY_SOURCES.some((s) => s.id === entry.source), entry.id);
  }
  for (const boss of bosses) {
    assert.ok(boss.phases >= 1, boss.id);
    assert.ok(boss.quote.length > 0, `${boss.id} has an intro line`);
  }
});

test('arc filters partition the Index and report accurate counts', () => {
  for (const category of ['enemies', 'bosses']) {
    const sources = bestiarySources(category);
    const total = sources.reduce((sum, s) => sum + s.count, 0);
    assert.equal(total, bestiaryIndex()[category].length);
    for (const s of sources) assert.equal(bestiaryEntries(category, { source: s.id }).length, s.count);
  }
  assert.equal(bestiaryEntries('bosses', { source: 'court' }).length, 12);
  assert.equal(bestiaryEntries('bosses', { source: 'ashen' }).length, 6);
});

test('Index search is case- and accent-insensitive and matches place names', () => {
  assert.deepEqual(bestiaryEntries('bosses', { query: 'MORDRAKE' }).map((e) => e.id), ['warden']);
  assert.ok(bestiaryEntries('enemies', { query: 'kaca' }).length >= 1);
  assert.equal(bestiaryEntries('enemies', { query: 'zzzz-no-such-thing' }).length, 0);
  assert.equal(bestiaryEntry('bosses', 'wickbearer')?.source, 'lanternwake');
  assert.equal(bestiaryEntry('bosses', 'nope'), null);
});

test('every playable class has a roster accent and a known portrait weapon', () => {
  for (const id of Object.keys(CHARACTERS)) {
    assert.ok(CLASS_ACCENTS[id], `${id} accent`);
    assert.match(classAccent(id), /^#[0-9a-f]{6}$/i);
  }
  for (const weapon of Object.values(CLASS_WEAPON)) assert.ok(['sword', 'pike', 'bow'].includes(weapon));
});
