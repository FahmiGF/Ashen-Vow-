// Tests for the in-engine trailer: the shot list must stay monotonic, every
// shot must name real content, and the renderer must be deterministic and
// canvas-only (no DOM, no randomness).
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TRAILER_SCHEMA_VERSION,
  TRAILER_IDENTITY,
  TRAILER_SHOTS,
  TRAILER_SHOT_BY_ID,
  trailerDuration,
  trailerShotIndexAt,
  trailerShotAt,
  trailerNarrationAt,
  trailerSummary,
  drawTrailerFrame,
} from '../src/trailer.js';
import { VOICE_CAST_BY_ID } from '../src/voice.js';

function mockContext() {
  const calls = [];
  const gradient = { addColorStop: (stop, color) => calls.push(['stop', stop, color]) };
  return {
    calls,
    canvas: { width: 1280, height: 720 },
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    measureText: (text) => ({ width: String(text).length * 9 }),
    fillText: (text, x, y) => calls.push(['fillText', text, x, y]),
    fillRect: (...args) => calls.push(['fillRect', ...args]),
    strokeRect: (...args) => calls.push(['strokeRect', ...args]),
    beginPath: () => calls.push(['beginPath']),
    closePath: () => calls.push(['closePath']),
    moveTo: () => calls.push(['moveTo']),
    lineTo: () => calls.push(['lineTo']),
    quadraticCurveTo: () => calls.push(['quadraticCurveTo']),
    arc: () => calls.push(['arc']),
    fill: () => calls.push(['fill']),
    stroke: () => calls.push(['stroke']),
    clearRect: () => calls.push(['clearRect']),
    save: () => calls.push(['save']),
    restore: () => calls.push(['restore']),
    set font(value) { calls.push(['font', value]); },
    // Gradients are objects; record a stable marker so two mocks stay equal.
    set fillStyle(value) { calls.push(['fillStyle', typeof value === 'string' ? value : 'gradient']); },
    set strokeStyle(value) { calls.push(['strokeStyle', typeof value === 'string' ? value : 'gradient']); },
    set lineWidth(value) { calls.push(['lineWidth', value]); },
    set globalAlpha(value) { calls.push(['globalAlpha', value]); },
    set textAlign(value) { calls.push(['textAlign', value]); },
    set textBaseline(value) { calls.push(['textBaseline', value]); },
  };
}

test('the trailer ships a monotonic shot list', () => {
  assert.equal(TRAILER_SCHEMA_VERSION, 1);
  assert.ok(TRAILER_SHOTS.length >= 15, `expected a full cut, got ${TRAILER_SHOTS.length} shots`);
  assert.equal(new Set(TRAILER_SHOTS.map((shot) => shot.id)).size, TRAILER_SHOTS.length);
  let cursor = 0;
  for (const shot of TRAILER_SHOTS) {
    assert.equal(shot.at, cursor, `${shot.id} starts where the previous shot ends`);
    assert.ok(shot.duration > 3 && shot.duration <= 7, `${shot.id} keeps the cut moving`);
    assert.ok(shot.eyebrow && shot.title && shot.narration, `${shot.id} is fully authored`);
    assert.equal(shot.accent.length, 3);
    assert.ok(VOICE_CAST_BY_ID[shot.cast], `${shot.id} uses a real cast member (${shot.cast})`);
    assert.equal(TRAILER_SHOT_BY_ID[shot.id], shot);
    cursor += shot.duration;
  }
  assert.equal(trailerDuration(), cursor);
  assert.ok(trailerDuration() >= 70 && trailerDuration() <= 95);
});

test('the cut covers campaign, branches, side modes and 3D modes', () => {
  const ids = new Set(TRAILER_SHOTS.map((shot) => shot.id));
  for (const required of [
    'ashen_gate', 'warden', 'mycelial', 'cistern', 'lanternwake', 'faewood',
    'fallen', 'crusade', 'pirates', 'wave', 'moba', 'scary', 'blackveil',
  ]) {
    assert.ok(ids.has(required), `the cut shows ${required}`);
  }
  const summary = trailerSummary();
  assert.equal(summary.shots, TRAILER_SHOTS.length);
  assert.equal(summary.duration, trailerDuration());
  assert.equal(summary.schema, 1);
  assert.ok(summary.cast >= 4);
});

test('shot lookup clamps at both ends and reports local progress', () => {
  assert.equal(trailerShotIndexAt(-50), 0);
  assert.equal(trailerShotIndexAt(0), 0);
  assert.equal(trailerShotIndexAt(trailerDuration()), TRAILER_SHOTS.length - 1);
  assert.equal(trailerShotIndexAt(1e6), TRAILER_SHOTS.length - 1);

  const first = TRAILER_SHOTS[0];
  const atStart = trailerShotAt(0);
  assert.equal(atStart.index, 0);
  assert.equal(atStart.shot, first);
  assert.equal(atStart.local, 0);
  assert.equal(atStart.progress, 0);

  const second = TRAILER_SHOTS[1];
  const inside = trailerShotAt(second.at + second.duration / 2);
  assert.equal(inside.index, 1);
  assert.equal(inside.shot, second);
  assert.ok(Math.abs(inside.progress - 0.5) < 1e-9);
  assert.equal(trailerShotAt(second.at).index, 1, 'a shot starts exactly on its timestamp');
  assert.equal(trailerShotAt(second.at - 1e-4).index, 0, 'and the previous shot owns the frame before');
  assert.ok(inside.overall > 0 && inside.overall < 1);
});

test('narration follows the active shot', () => {
  assert.equal(trailerNarrationAt(0), TRAILER_SHOTS[0].narration);
  assert.equal(trailerNarrationAt(1000), TRAILER_SHOTS[TRAILER_SHOTS.length - 1].narration);
  for (const shot of TRAILER_SHOTS) {
    assert.equal(trailerNarrationAt(shot.at + 0.01), shot.narration);
  }
});

test('identity keeps the required credit sentence exact', () => {
  assert.equal(
    TRAILER_IDENTITY.footer,
    'Made by SealiusHQ with a lot of support from Contributors',
  );
  assert.equal(TRAILER_IDENTITY.studio, 'SEALIUSHQ');
  assert.ok(TRAILER_IDENTITY.endCard.cta.length > 0);
});

test('the renderer is deterministic, canvas-only and covers every shot', () => {
  for (const shot of TRAILER_SHOTS) {
    const a = mockContext();
    const b = mockContext();
    const result = drawTrailerFrame(a, 1280, 720, shot.at + shot.duration / 2);
    drawTrailerFrame(b, 1280, 720, shot.at + shot.duration / 2);
    assert.equal(result.shot.id, shot.id);
    assert.equal(result.count, TRAILER_SHOTS.length);
    assert.ok(a.calls.length > 20, `${shot.id} draws a real frame (${a.calls.length} calls)`);
    assert.deepEqual(a.calls, b.calls, `${shot.id} renders identically on replay`);
    const texts = a.calls.filter((call) => call[0] === 'fillText').map((call) => call[1]);
    const drawn = texts.join('').replace(/\s/g, '');
    assert.ok(drawn.includes(shot.eyebrow.replace(/\s/g, '')), `${shot.id} draws its eyebrow`);
  }
  // The title of the current shot must reach the canvas.
  const ctx = mockContext();
  drawTrailerFrame(ctx, 1280, 720, TRAILER_SHOTS[1].at + 1);
  const drawn = ctx.calls.filter((call) => call[0] === 'fillText').map((call) => call[1]).join('').replace(/\s/g, '');
  assert.ok(drawn.includes(TRAILER_SHOTS[1].title.replace(/\s/g, '')));
});
