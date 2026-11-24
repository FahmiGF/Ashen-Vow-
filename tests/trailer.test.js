// Tests for the in-engine trailer (cut 2): the edit list must stay monotonic,
// every scene must point at a real room in ALL_ROOMS (and real bosses where it
// says so), the speed ramps must be seekable, and the renderer must stay
// deterministic and canvas-only.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TRAILER_SCHEMA_VERSION,
  TRAILER_IDENTITY,
  TRAILER_SHOTS,
  TRAILER_SHOT_BY_ID,
  TRAILER_GRADES,
  trailerDuration,
  trailerShotIndexAt,
  trailerShotAt,
  trailerCutAt,
  trailerSimTime,
  trailerCamera,
  trailerRooms,
  trailerNarrationAt,
  trailerSummary,
  drawTrailerFrame,
} from '../src/trailer.js';
import { VOICE_CAST_BY_ID } from '../src/voice.js';
import { TRACKS } from '../src/music.js';
import { AshenGame, ALL_ROOMS } from '../src/core.js';

function mockContext() {
  const calls = [];
  const gradient = { addColorStop: (stop, color) => calls.push(['stop', stop, color]) };
  const ctx = {
    calls,
    canvas: { width: 1280, height: 720 },
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    measureText: (text) => ({ width: String(text).length * 9 }),
    fillText: (text, x, y) => calls.push(['fillText', text, Math.round(x), Math.round(y)]),
    fillRect: (...args) => calls.push(['fillRect', ...args.map(Math.round)]),
    strokeRect: (...args) => calls.push(['strokeRect', ...args.map(Math.round)]),
    beginPath: () => calls.push(['beginPath']),
    closePath: () => calls.push(['closePath']),
    moveTo: () => calls.push(['moveTo']),
    lineTo: () => calls.push(['lineTo']),
    arc: () => calls.push(['arc']),
    ellipse: () => calls.push(['ellipse']),
    fill: () => calls.push(['fill']),
    stroke: () => calls.push(['stroke']),
    clearRect: () => calls.push(['clearRect']),
    save: () => calls.push(['save']),
    restore: () => calls.push(['restore']),
    translate: (x, y) => calls.push(['translate', Math.round(x), Math.round(y)]),
    scale: (x, y) => calls.push(['scale', x.toFixed(4), y.toFixed(4)]),
  };
  for (const prop of ['font', 'fillStyle', 'strokeStyle', 'lineWidth', 'globalAlpha', 'textAlign', 'textBaseline', 'shadowColor', 'shadowBlur', 'globalCompositeOperation']) {
    Object.defineProperty(ctx, prop, {
      set(value) { calls.push([prop, typeof value === 'object' ? 'gradient' : value]); },
    });
  }
  return ctx;
}

test('the trailer ships a monotonic edit list with real cast and score', () => {
  assert.equal(TRAILER_SCHEMA_VERSION, 2);
  assert.ok(TRAILER_SHOTS.length >= 14, `expected a full cut, got ${TRAILER_SHOTS.length} shots`);
  assert.equal(new Set(TRAILER_SHOTS.map((shot) => shot.id)).size, TRAILER_SHOTS.length);
  let cursor = 0;
  for (const shot of TRAILER_SHOTS) {
    assert.ok(Math.abs(shot.at - cursor) < 1e-9, `${shot.id} starts where the previous shot ends`);
    assert.ok(shot.duration >= 3 && shot.duration <= 8, `${shot.id} keeps the cut moving`);
    assert.ok(['scene', 'card'].includes(shot.kind), shot.id);
    assert.ok(shot.title && shot.narration, `${shot.id} is fully authored`);
    assert.equal(shot.accent.length, 3);
    assert.ok(VOICE_CAST_BY_ID[shot.cast], `${shot.id} uses a real cast member (${shot.cast})`);
    if (shot.music !== null) assert.ok(TRACKS[shot.music], `${shot.id} cues a real track (${shot.music})`);
    assert.equal(TRAILER_SHOT_BY_ID[shot.id], shot);
    cursor += shot.duration;
  }
  assert.equal(trailerDuration(), cursor);
  assert.ok(trailerDuration() >= 75 && trailerDuration() <= 95);
});

test('scene shots are live footage: real rooms, cuts that fill the shot, real grades', () => {
  const scenes = TRAILER_SHOTS.filter((shot) => shot.kind === 'scene');
  assert.ok(scenes.length >= 7, 'most of the cut is engine footage');
  for (const shot of scenes) {
    const total = shot.cuts.reduce((sum, cut) => sum + cut.hold, 0);
    assert.ok(Math.abs(total - shot.duration) < 1e-9, `${shot.id} cuts fill the shot`);
    for (const cut of shot.cuts) {
      assert.ok(ALL_ROOMS[cut.room], `${shot.id} room ${cut.room} exists`);
      assert.ok(['fight', 'advance', 'stand'].includes(cut.actor), `${shot.id} actor`);
      const grade = cut.grade || shot.grade;
      assert.ok(TRAILER_GRADES[grade], `${shot.id} grade ${grade}`);
      assert.equal(cut.camera.zoom.length, 2);
      for (const z of cut.camera.zoom) assert.ok(z >= 1 && z <= 2.2, `${shot.id} zoom stays in frame`);
    }
  }
  assert.ok(trailerRooms().length >= 12, 'the cut visits many rooms');
  // The boss shots really show those bosses.
  const bossRooms = { warden: 'warden', oathbreaker: 'oathbreaker' };
  for (const [shotId, kind] of Object.entries(bossRooms)) {
    for (const cut of TRAILER_SHOT_BY_ID[shotId].cuts) assert.equal(ALL_ROOMS[cut.room].boss, kind);
  }
  for (const cut of TRAILER_SHOT_BY_ID.montage_bosses.cuts) assert.ok(ALL_ROOMS[cut.room].boss, `montage room ${cut.room} has a boss`);
  for (const cut of TRAILER_SHOT_BY_ID.montage_arcs.cuts) assert.ok(ALL_ROOMS[cut.room].boss, `montage room ${cut.room} has a boss`);
});

test('the cut covers campaign, branches, chapters, side modes and horror', () => {
  const covered = new Set(TRAILER_SHOTS.flatMap((shot) => [shot.id, ...(shot.covers || [])]));
  for (const required of [
    'ashen_gate', 'warden', 'mycelial', 'cistern', 'lanternwake', 'faewood',
    'fallen', 'crusade', 'pirates', 'wave', 'moba', 'scary', 'blackveil', 'oathbreaker',
  ]) {
    assert.ok(covered.has(required), `the cut covers ${required}`);
  }
  const summary = trailerSummary();
  assert.equal(summary.shots, TRAILER_SHOTS.length);
  assert.equal(summary.duration, trailerDuration());
  assert.equal(summary.schema, 2);
  assert.ok(summary.cuts >= 15);
  assert.ok(summary.cast >= 3);
});

test('cut lookup and speed ramps are seekable and monotonic', () => {
  const shot = TRAILER_SHOT_BY_ID.montage_bosses;
  assert.equal(trailerCutAt(shot, 0).index, 0);
  assert.equal(trailerCutAt(shot, 1.49).index, 0);
  assert.equal(trailerCutAt(shot, 1.5).index, 1);
  assert.equal(trailerCutAt(shot, 99).index, shot.cuts.length - 1);
  assert.equal(trailerCutAt(TRAILER_SHOT_BY_ID.title, 1), null);

  const cut = TRAILER_SHOT_BY_ID.warden.cuts[0];
  assert.equal(trailerSimTime(cut, 0), 0);
  assert.ok(Math.abs(trailerSimTime(cut, 1) - 0.3) < 1e-9, 'slow motion during the ramp');
  assert.ok(Math.abs(trailerSimTime(cut, 3) - (0.6 + 1)) < 1e-9, 'real time after the ramp');
  let prev = -1;
  for (let t = 0; t <= 6; t += 0.05) {
    const sim = trailerSimTime(cut, t);
    assert.ok(sim >= prev, 'simulated time never runs backwards');
    prev = sim;
  }
  assert.equal(trailerSimTime({}, 2), 2, 'cuts without a ramp run in real time');

  const cam0 = trailerCamera(cut, 0);
  const cam1 = trailerCamera(cut, 1);
  assert.equal(cam0.zoom, cut.camera.zoom[0]);
  assert.equal(cam1.zoom, cut.camera.zoom[1]);
  assert.equal(cam0.focus, 'boss');
});

test('every scene cut loads in the real engine and survives its own footage', () => {
  for (const shot of TRAILER_SHOTS.filter((s) => s.kind === 'scene')) {
    for (const cut of shot.cuts) {
      const game = new AshenGame();
      game.enterRoom(cut.room);
      assert.equal(game.roomIndex, cut.room, `${shot.id} enters room ${cut.room}`);
      if (Number.isFinite(cut.bossHp)) {
        const b = game.boss;
        game.hurtBoss(b.hp - Math.round(b.maxHp * cut.bossHp), 0, 1);
        assert.ok(b.phase >= 2, `${shot.id} pushes the boss into a later phase`);
      }
      // A short burst of simulation must not throw or leave the room.
      for (let i = 0; i < 120; i += 1) {
        game.player.hp = game.player.maxHp;
        game.gateLock = 999;
        game.update(1 / 120, { right: i % 40 < 20, attack: i % 12 === 0 });
      }
      assert.equal(game.roomIndex, cut.room);
    }
  }
});

test('shot lookup clamps at both ends and reports local progress', () => {
  assert.equal(trailerShotIndexAt(-50), 0);
  assert.equal(trailerShotIndexAt(trailerDuration()), TRAILER_SHOTS.length - 1);
  assert.equal(trailerShotIndexAt(1e6), TRAILER_SHOTS.length - 1);
  const second = TRAILER_SHOTS[1];
  const inside = trailerShotAt(second.at + second.duration / 2);
  assert.equal(inside.index, 1);
  assert.ok(Math.abs(inside.progress - 0.5) < 1e-9);
  assert.equal(trailerShotAt(second.at).index, 1, 'a shot starts exactly on its timestamp');
  assert.equal(trailerShotAt(second.at - 1e-4).index, 0, 'and the previous shot owns the frame before');
  assert.ok(inside.cut, 'scene shots report their active cut');
});

test('narration follows the active shot', () => {
  for (const shot of TRAILER_SHOTS) assert.equal(trailerNarrationAt(shot.at + 0.01), shot.narration);
});

test('identity keeps the required credit sentence exact and the end card draws it', () => {
  assert.equal(TRAILER_IDENTITY.footer, 'Made by SealiusHQ with a lot of support from Contributors');
  const end = TRAILER_SHOT_BY_ID.endcard;
  const ctx = mockContext();
  drawTrailerFrame(ctx, 1280, 720, end.at + end.duration * 0.6);
  const drawn = ctx.calls.filter((c) => c[0] === 'fillText').map((c) => c[1]).join('');
  assert.ok(drawn.replace(/\s/g, '').includes(TRAILER_IDENTITY.footer.replace(/\s/g, '')));
});

test('the renderer is deterministic, canvas-only and draws every shot', () => {
  for (const shot of TRAILER_SHOTS) {
    const t = shot.at + shot.duration / 2;
    const a = mockContext();
    const b = mockContext();
    const result = drawTrailerFrame(a, 1280, 720, t);
    drawTrailerFrame(b, 1280, 720, t);
    assert.equal(result.shot.id, shot.id);
    assert.ok(a.calls.length > 20, `${shot.id} draws a real frame (${a.calls.length} calls)`);
    assert.deepEqual(a.calls, b.calls, `${shot.id} renders identically on replay`);
  }
  // Scene shots hand the frame to the live-footage painter when one exists.
  const scene = TRAILER_SHOT_BY_ID.warden;
  let painted = null;
  drawTrailerFrame(mockContext(), 1280, 720, scene.at + 1, { scene: (ctx, w, h, info) => { painted = info; return true; } });
  assert.equal(painted?.shot.id, 'warden');
  assert.equal(painted.cut.cut.room, 2);
  // A painter that throws falls back to the plate instead of breaking playback.
  assert.doesNotThrow(() => drawTrailerFrame(mockContext(), 1280, 720, scene.at + 1, { scene: () => { throw new Error('boom'); } }));
});
