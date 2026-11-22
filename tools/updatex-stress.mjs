// Update X — performance and stress harness (headless simulation).
// Measures the AI navigation layer and boss core under load. Numbers are CPU
// time for the pure simulation on this machine; no GPU claims are made.
import { performance } from 'node:perf_hooks';

import { AshenGame, ALL_ROOMS, BOSS_INFO } from '../src/core.js';
import { buildRoomNav, EnemyBrain } from '../src/ai_nav.js';
import { simulateBossCombat } from '../src/boss_core.js';

const FIXED = 1 / 120;
const results = [];

function timed(fn) {
  const start = performance.now();
  const value = fn();
  return { value, ms: performance.now() - start };
}

function newGame() {
  const game = new AshenGame();
  game.enterRoom(0);
  return game;
}

// 1. Navigation graph build cost per room.
{
  const samples = [];
  for (const room of ALL_ROOMS.slice(0, 24)) {
    const { ms } = timed(() => buildRoomNav(room));
    samples.push(ms);
  }
  samples.sort((a, b) => a - b);
  results.push({
    name: 'nav graph build (24 rooms)',
    mean: samples.reduce((a, b) => a + b, 0) / samples.length,
    p95: samples[Math.floor(samples.length * 0.95)],
    worst: samples[samples.length - 1],
  });
}

// 2. A* query cost on a real room, 2000 queries.
{
  const room = ALL_ROOMS[0];
  const nav = buildRoomNav(room);
  const a = nav.nodes[0];
  const b = nav.nodes[nav.nodes.length - 1];
  const { ms, value } = timed(() => {
    let found = 0;
    for (let i = 0; i < 2000; i += 1) if (nav.path(a.id, b.id)) found += 1;
    return found;
  });
  results.push({ name: `A* queries (${value}/2000 found)`, mean: ms / 2000, p95: 0, worst: 0, unit: 'per query' });
}

// 3. 20 enemies with brains, 10 simulated seconds.
{
  const game = newGame();
  game.enterRoom(1);
  for (let i = 0; i < 20; i += 1) {
    game.spawnEnemy({ type: i % 4 === 0 ? 'sentinel' : 'crawler', x: 120 + i * 40, minX: 40, maxX: 1200 });
  }
  const enemies = game.enemies.filter((e) => !e.dead);
  const { ms } = timed(() => {
    for (let step = 0; step < 1200; step += 1) game.update(FIXED, {});
  });
  const stuck = enemies.reduce((sum, e) => sum + (e.brain?.stuckEvents || 0), 0);
  const repaths = enemies.reduce((sum, e) => sum + (e.brain?.repaths || 0), 0);
  const fallouts = enemies.filter((e) => e.y > 640).length;
  results.push({
    name: `20 enemies × 10s (${enemies.length} alive)`,
    mean: ms / 1200,
    p95: 0,
    worst: 0,
    unit: 'ms/step',
    note: `stuck ${stuck}, repaths ${repaths}, fell out ${fallouts}`,
  });
}

// 4. Stuck recovery under a wall that blocks the direct route.
{
  const game = newGame();
  game.enterRoom(0);
  const enemy = game.enemies.find((e) => !e.dead) || game.spawnEnemy({ type: 'crawler', x: 200, minX: 40, maxX: 1200 });
  enemy.x = 60;
  game.player.x = 60;
  let transitions = 0;
  for (let step = 0; step < 2400; step += 1) {
    game.update(FIXED, {});
    transitions = enemy.brain ? enemy.brain.transitions.length : 0;
  }
  results.push({
    name: 'stuck recovery (20s pinned enemy)',
    mean: enemy.brain?.stuckEvents || 0,
    p95: transitions,
    worst: enemy.brain?.repaths || 0,
    unit: 'events',
    note: `state ${enemy.aiState}`,
  });
}

// 5. Boss core across the whole roster.
{
  const rows = [];
  for (const [kind, info] of Object.entries(BOSS_INFO)) {
    const { ms, value } = timed(() => simulateBossCombat(info, { dps: Math.max(80, info.maxHp / 5) }));
    rows.push({ kind, ms, passed: value.passed, phases: value.finalPhase, transitions: value.phaseTransitions, hits: value.doubleHits });
  }
  const failures = rows.filter((row) => !row.passed);
  results.push({
    name: `boss roster (${rows.length} bosses)`,
    mean: rows.reduce((a, r) => a + r.ms, 0) / rows.length,
    p95: 0,
    worst: Math.max(...rows.map((r) => r.ms)),
    unit: 'ms/fight',
    note: failures.length ? `FAILED: ${failures.map((f) => f.kind).join(', ')}` : 'all invariants held',
  });
}

// 6. Rapid scene changes: 120 room loads with fresh brains.
{
  const game = newGame();
  const { ms } = timed(() => {
    for (let i = 0; i < 120; i += 1) {
      game.enterRoom(i % 8);
      for (let step = 0; step < 10; step += 1) game.update(FIXED, {});
    }
  });
  const heap = process.memoryUsage().heapUsed / 1048576;
  results.push({
    name: '120 room transitions',
    mean: ms / 120,
    p95: 0,
    worst: 0,
    unit: 'ms per transition',
    note: `heap ${heap.toFixed(1)} MB`,
  });
}

console.log('Update X stress harness (headless CPU simulation, this machine)');
for (const row of results) {
  const unit = row.unit || 'ms';
  console.log(`  ${row.name}`);
  console.log(`    mean ${Number(row.mean).toFixed(3)} ${unit}${row.p95 ? `, p95 ${Number(row.p95).toFixed(3)}, worst ${Number(row.worst).toFixed(3)}` : ''}${row.note ? ` · ${row.note}` : ''}`);
}
const failed = results.filter((row) => /FAILED/.test(row.note || ''));
console.log(`\nbudget check: ${failed.length === 0 ? 'no invariant failures' : `${failed.length} failing areas`}`);
if (failed.length) process.exitCode = 1;
