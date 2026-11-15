// Simulation throughput benchmark for the 120 Hz fixed step.
// Run with: node tools/sim-bench.mjs
//
// Compares the shipped in-place list compaction against the previous
// Array#filter implementation on the exact same simulation state, so the
// difference is the allocator, not the scene.

import { performance } from 'node:perf_hooks';
import { AshenGame } from '../src/core.js';

function buildGame() {
  const game = new AshenGame();
  game.enterRoom(7);
  game.boss.invuln = 999;
  for (let i = 0; i < 9; i += 1) {
    game.spawnEnemy({ type: 'wraith', x: 120 + i * 110, minX: 60, maxX: 1300 });
  }
  for (let i = 0; i < 160; i += 1) {
    game.spawnPlayerProjectile('flame_orb', {
      x: 100 + (i % 900),
      y: 200 + (i % 180),
      vx: 40,
      vy: 0,
      r: 6,
      dmg: 8,
      life: 30,
      pierce: true,
    });
  }
  for (let i = 0; i < 220; i += 1) {
    game.spawnFx('spark', 200 + (i % 700), 200 + (i % 200), { life: 30, size: 3, vx: 30, vy: 10 });
  }
  game.player.invuln = 999;
  return game;
}

function run(label, compact) {
  const game = buildGame();
  if (!compact) {
    game.compactRemoved = function filterRemoved(list, field) {
      const kept = field === 'life' ? list.filter((f) => f.life > 0) : list.filter((x) => !x.dead);
      list.length = 0;
      list.push(...kept);
      return list;
    };
  }
  const steps = 3000;
  // Warm up the JIT.
  for (let i = 0; i < 400; i += 1) game.update(1 / 120, {});
  const start = performance.now();
  for (let i = 0; i < steps; i += 1) game.update(1 / 120, {});
  const ms = performance.now() - start;
  const ops = steps / (ms / 1000);
  console.log(`${label.padEnd(26)} ${ms.toFixed(1).padStart(8)} ms   ${Math.round(ops).toLocaleString().padStart(9)} steps/s`);
  return ops;
}

console.log('Ashen Vow simulation benchmark (room 7, 10 enemies, 160 projectiles, 220 fx)');
console.log('─'.repeat(76));
const baseline = run('Array#filter (old)', false);
const shipped = run('in-place compaction', true);
console.log('─'.repeat(76));
console.log(`speedup: ${(shipped / baseline).toFixed(2)}x`);
