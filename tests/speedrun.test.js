import test from 'node:test';
import assert from 'node:assert/strict';
import { AshenGame } from '../src/core.js';
import {
  SPEEDRUN_HISTORY_LIMIT,
  SPEEDRUN_LIVES,
  SPEEDRUN_MAX_MULTIPLIER,
  SPEEDRUN_RULES,
  SPEEDRUN_START_MULTIPLIER,
  defaultSpeedrunProgress,
  recordSpeedrun,
  sanitizeSpeedrunHistory,
  sanitizeSpeedrunProgress,
  speedrunMaxSubsteps,
  speedrunMultiplier,
  speedrunSummary,
} from '../src/speedrun.js';

test('speedrun starts at 2x and climbs one step per cleared cycle', () => {
  assert.equal(SPEEDRUN_START_MULTIPLIER, 2);
  assert.equal(SPEEDRUN_LIVES, 1);
  assert.equal(speedrunMultiplier(0), 2);
  assert.equal(speedrunMultiplier(1), 3);
  assert.equal(speedrunMultiplier(7), 9);
  assert.equal(speedrunMultiplier(-5), 2);
  assert.equal(speedrunMultiplier(9999), SPEEDRUN_MAX_MULTIPLIER);
  const rules = SPEEDRUN_RULES.join(' ');
  assert.ok(SPEEDRUN_RULES.length >= 4);
  assert.match(rules, /Satu nyawa/);
  assert.match(rules, /Oathbreaker/);
  assert.match(rules, /checkpoint/i);
});

test('speedrun progress defaults, sanitizes and keeps unknown fields', () => {
  const base = defaultSpeedrunProgress();
  assert.equal(base.bestMultiplier, 0);
  assert.equal(base.version, 1);
  const cooked = sanitizeSpeedrunProgress({
    runs: 4.9,
    deaths: -3,
    clears: '2',
    bestMultiplier: 999,
    bestCycles: 2.6,
    bestTime: 'abc',
    bestRooms: 12,
    lastMultiplier: 3,
    lastTime: 99.44,
    future: { a: 1 },
  });
  assert.equal(cooked.runs, 4);
  assert.equal(cooked.deaths, 0);
  assert.equal(cooked.clears, 2);
  assert.equal(cooked.bestMultiplier, SPEEDRUN_MAX_MULTIPLIER);
  assert.equal(cooked.bestCycles, 2);
  assert.equal(cooked.bestTime, 0);
  assert.equal(cooked.bestRooms, 12);
  assert.equal(cooked.lastMultiplier, 3);
  assert.equal(cooked.lastTime, 99.4);
  assert.deepEqual(cooked.future, { a: 1 });
  assert.deepEqual(sanitizeSpeedrunProgress(null), base);
  assert.deepEqual(sanitizeSpeedrunProgress('nope'), base);
});

test('recording a cleared cycle and then a death keeps the records that matter', () => {
  const p = defaultSpeedrunProgress();
  const clear = recordSpeedrun(p, { multiplier: 2, clears: 1, rooms: 8, time: 240, died: false });
  assert.equal(clear.isRecord, true);
  assert.equal(p.clears, 1);
  assert.equal(p.runs, 0);
  assert.equal(p.bestMultiplier, 2);
  assert.equal(p.bestCycles, 1);
  p.bestTime = 240;

  const death = recordSpeedrun(p, { multiplier: 4, clears: 3, rooms: 30, time: 610, died: true });
  assert.equal(death.isRecord, true);
  assert.equal(p.runs, 1);
  assert.equal(p.deaths, 1);
  assert.equal(p.bestMultiplier, 4);
  assert.equal(p.bestCycles, 3);
  assert.equal(p.bestRooms, 30);
  assert.equal(speedrunSummary(p).hasRecord, true);

  const worse = recordSpeedrun(p, { multiplier: 2, clears: 1, rooms: 5, time: 60, died: true });
  assert.equal(worse.isRecord, false);
  assert.equal(p.bestMultiplier, 4);
  assert.equal(p.runs, 2);
});

test('substep budget scales with the multiplier but stays bounded', () => {
  assert.equal(speedrunMaxSubsteps(0), 14);
  assert.ok(speedrunMaxSubsteps(2) > 10);
  assert.ok(speedrunMaxSubsteps(8) > speedrunMaxSubsteps(2));
  assert.equal(speedrunMaxSubsteps(40), 170);
  assert.equal(speedrunMaxSubsteps(9999), 240);
});

test('one life refuses checkpoint revival', () => {
  const game = new AshenGame();
  assert.equal(game.oneLife, false);
  game.oneLife = true;
  game.checkpointRoom = 2;
  assert.equal(game.respawnAtCheckpoint(), false);
  assert.equal(game.state, 'playing');
  assert.equal(game.roomIndex, 0);
});

test('a speedrun pit fall ends the run instead of resetting the room', () => {
  const game = new AshenGame();
  game.oneLife = true;
  game.player.x = 400;
  game.player.y = 700;
  game.player.vy = 200;
  for (let i = 0; i < 6 && game.state === 'playing'; i += 1) game.update(1 / 120, {});
  assert.equal(game.state, 'dead');
  assert.equal(game.player.hp, 0);
  assert.ok(game.events.some((ev) => ev.type === 'death'));
});

test('the same pit stays survivable outside the speedrun', () => {
  const game = new AshenGame();
  game.player.x = 400;
  game.player.y = 700;
  game.player.vy = 200;
  for (let i = 0; i < 6 && game.state === 'playing'; i += 1) game.update(1 / 120, {});
  assert.equal(game.state, 'playing');
  assert.ok(game.player.hp > 0);
  assert.ok(game.events.some((ev) => ev.type === 'respawn'));
});

test('run history keeps the newest attempts first and caps the list', () => {
  const p = defaultSpeedrunProgress();
  assert.deepEqual(p.history, []);
  for (let i = 0; i < 14; i += 1) {
    recordSpeedrun(p, {
      multiplier: 2 + (i % 5),
      clears: i,
      rooms: i * 2,
      time: 10 + i,
      died: i % 2 === 0,
      at: 1700000000000 + i,
    });
  }
  assert.equal(p.runs, 7);
  assert.equal(p.clears, 7);
  assert.equal(p.history.length, SPEEDRUN_HISTORY_LIMIT);
  assert.equal(p.history[0].at, 1700000000013);
  assert.equal(p.history[0].clears, 13);
  assert.equal(p.history[0].died, false);
  assert.equal(p.history[SPEEDRUN_HISTORY_LIMIT - 1].clears, 4);
  assert.equal(speedrunSummary(p).history.length, SPEEDRUN_HISTORY_LIMIT);
  // The summary is a copy-safe view, not a live window into the save.
  const view = speedrunSummary(p);
  view.history[0].clears = -1;
  assert.equal(p.history[0].clears, 13);
});

test('history entries are clamped and junk is dropped', () => {
  const cooked = sanitizeSpeedrunProgress({
    history: [
      { multiplier: '3', clears: 1.8, rooms: -2, time: '12.34', died: false, at: 1234, extra: 'keep' },
      null,
      'nope',
      [],
      { multiplier: 99, died: true, at: 'x' },
    ],
  });
  assert.equal(cooked.history.length, 2);
  assert.equal(cooked.history[0].multiplier, 3);
  assert.equal(cooked.history[0].clears, 1);
  assert.equal(cooked.history[0].rooms, 0);
  assert.equal(cooked.history[0].time, 12.3);
  assert.equal(cooked.history[0].died, false);
  assert.equal(cooked.history[0].extra, 'keep');
  assert.equal(cooked.history[1].multiplier, SPEEDRUN_MAX_MULTIPLIER);
  assert.equal(cooked.history[1].at, 0);
  assert.deepEqual(sanitizeSpeedrunProgress({ history: 'x' }).history, []);
  assert.deepEqual(sanitizeSpeedrunHistory(null), []);
  assert.equal(sanitizeSpeedrunHistory([{ multiplier: 2 }], 1).length, 1);
});
