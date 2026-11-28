// Ashen Vow — Peta Kisah model tests.
// The story map is read-only: it must never touch progress, DOM or storage.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_ARCS,
  STORY_ARC_BY_ID,
  STORY_CURRENT_ID,
  STORY_KIND_LABELS,
  adjacentStoryArc,
  sanitizeStoryArcId,
  storyArcFor,
  storyArcIndex,
  storyKindLabel,
  storyMapSummary,
  storyStatusLabel,
} from '../src/storymap.js';
import { CREDIT_ARCS } from '../src/credits.js';
import { ALL_ROOMS } from '../src/core.js';

test('every story arc has a unique id and readable copy', () => {
  assert.ok(STORY_ARCS.length >= 12, 'the map covers the whole campaign');

  const ids = new Set();
  for (const arc of STORY_ARCS) {
    assert.ok(arc.id && !ids.has(arc.id), `duplicate or missing id: ${arc.id}`);
    ids.add(arc.id);

    assert.ok(arc.numeral, `${arc.id} needs a numeral badge`);
    assert.ok(arc.title && arc.title.length > 2, `${arc.id} needs a title`);
    assert.ok(arc.subtitle && arc.subtitle.length > 8, `${arc.id} needs a subtitle`);
    assert.ok(arc.summary && arc.summary.length > 80, `${arc.id} needs a real summary`);
    assert.ok(Array.isArray(arc.beats) && arc.beats.length >= 3, `${arc.id} needs at least three beats`);
    assert.ok(Array.isArray(arc.cast) && arc.cast.length >= 1, `${arc.id} needs a cast`);
    assert.ok(KIND_LABELS_HAS(arc.kind), `${arc.id} has an unknown kind: ${arc.kind}`);
    assert.match(arc.color, /^#[0-9a-f]{6}$/i, `${arc.id} needs a hex colour`);
  }
});

test('the current arc is last and flagged as the newest', () => {
  const current = storyArcFor(STORY_CURRENT_ID);
  assert.ok(current, 'current arc resolves');
  assert.equal(STORY_ARCS[STORY_ARCS.length - 1].id, STORY_CURRENT_ID);
  assert.equal(storyStatusLabel(current), 'TERBARU');
  assert.equal(storyArcIndex(STORY_CURRENT_ID), STORY_ARCS.length - 1);
});

test('arc numerals follow the canonical campaign numbering', () => {
  const numeral = (id) => storyArcFor(id).numeral;
  assert.equal(numeral('arc1'), 'ARC I');
  assert.equal(numeral('fallen'), 'ARC II');
  assert.equal(numeral('crusade'), 'ARC III');
  assert.equal(numeral('rift'), 'ARC IV');
  assert.equal(numeral('astral'), 'ARC VI');
  assert.equal(numeral('eclipse'), 'ARC VIII');
  assert.equal(numeral('veil'), 'ARC IX');
  assert.equal(numeral('eternal'), 'ARC X');
  assert.equal(numeral('arc11'), 'ARC XI');
});

test('the canonical credits arcs are all represented in the story map', () => {
  for (const credit of CREDIT_ARCS) {
    const arc = STORY_ARC_BY_ID[credit.id];
    assert.ok(arc, `credits arc "${credit.id}" is missing from the story map`);
    // Numbered arcs must use the exact campaign numeral; side sagas carry
    // their own badge on purpose ("GEMA", "ATLAS", "TAMAN PERI", "PROLOG").
    if (/^ARC [IVX]+$/.test(credit.numeral)) {
      assert.equal(arc.numeral, credit.numeral, `${credit.id} numeral must match the credits`);
    }
  }
});

test('Arc IV The Rift is now unlocked and playable alongside the other arcs', () => {
  const locked = STORY_ARCS.filter((arc) => arc.kind === 'locked');
  assert.equal(locked.length, 0);
  const rift = storyArcFor('rift');
  assert.ok(rift);
  assert.equal(rift.kind, 'main');
  assert.equal(rift.bosses, 6);
  assert.equal(rift.chapters, 5);
  assert.equal(storyStatusLabel(rift), 'RILIS');
});

test('shipped arcs claim rooms that exist in ALL_ROOMS', () => {
  const roomCount = ALL_ROOMS.length;
  assert.equal(roomCount, 931, 'the room table is the reference count');

  const claims = STORY_ARCS.filter((arc) => /\d+ ruang/.test(arc.scope));
  assert.ok(claims.length >= 10);

  let total = 0;
  for (const arc of claims) {
    const count = Number(arc.scope.match(/(\d+)\s+ruang/)[1]);
    assert.ok(Number.isFinite(count) && count > 0, `${arc.id} room count is broken`);
    total += count;
  }

  // 474 authored arc rooms + 27 Arc IV Rift rooms (874-900) + 30 Unwritten Expanse rooms (901-930) + 100 Echoes levels (14–113) + 100 Godfall floors
  // (562–661) + 100 Infinite Frontiers (674–773) + 100 Overdrive (774–873) = 931.
  assert.equal(total, 531);
  const echoes = storyArcFor('echoes');
  assert.match(echoes.scope, /100 level/);
  assert.equal(total + 100 + 100 + 100 + 100, roomCount);
});

test('the summary counts the campaign without mutating it', () => {
  const summary = storyMapSummary();
  assert.equal(summary.total, STORY_ARCS.length);
  assert.equal(summary.locked, 0);
  assert.equal(summary.shipped, STORY_ARCS.length);
  assert.ok(summary.main >= 8);
  assert.ok(summary.bosses >= 100, 'the map totals every boss in the game');
  assert.equal(summary.current, STORY_CURRENT_ID);
  assert.equal(summary.currentIndex, STORY_ARCS.length - 1);
});

test('navigation helpers clamp instead of throwing', () => {
  assert.equal(storyArcFor('nope'), null);
  assert.equal(sanitizeStoryArcId('nope'), STORY_ARCS[0].id);
  assert.equal(sanitizeStoryArcId('fallen'), 'fallen');

  assert.equal(adjacentStoryArc('nope', 1), null);
  assert.equal(adjacentStoryArc(STORY_ARCS[0].id, -1), null);
  assert.equal(adjacentStoryArc(STORY_CURRENT_ID, 1), null);
  assert.equal(adjacentStoryArc('arc1', 1).id, 'echoes');

  assert.equal(storyKindLabel(null), '');
  assert.equal(storyStatusLabel(null), '');
});

function KIND_LABELS_HAS(kind) {
  return Object.hasOwn(STORY_KIND_LABELS, kind);
}
