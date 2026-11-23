// Pirate Tide benchmark: measures fixed-step simulation throughput and the
// renderer's draw-call cost at a full combat load. Run with:
//   node tools/pirates-bench.mjs
import { performance } from 'node:perf_hooks';
import {
  PIRATE_STAGES,
  PIRATE_ISLANDS,
  PIRATE_MAX_BALLS,
  PIRATE_MAX_ENEMIES,
  createPirateVoyage,
  updatePirateVoyage,
  setPirateControls,
  pirateFire,
  renderPirateVoyage,
  pirateVisibleIslands,
} from '../src/pirates.js';

function cloneHull(source, index) {
  return {
    ...source,
    id: `bench_${index}`,
    x: source.x + Math.cos(index * 1.7) * (120 + index * 24),
    y: source.y + Math.sin(index * 1.7) * (120 + index * 24),
    speed: 40,
    hp: source.maxHp,
    dead: false,
    wake: [],
    hitFlash: 0,
    contactCooldown: 0,
  };
}

function loadCombat(match) {
  const base = match.enemies[0];
  while (match.enemies.length < PIRATE_MAX_ENEMIES) {
    match.enemies.push(cloneHull(base, match.enemies.length));
  }
  // The benchmark measures throughput, not survival: keep the bench hull afloat.
  match.player.maxHp = 1e9;
  match.player.hp = 1e9;
  match.player.reloadPort = 0;
  match.player.reloadStarboard = 0;
  let guard = 0;
  while (match.cannonballs.length < PIRATE_MAX_BALLS - 8 && guard < 200) {
    match.player.reloadPort = 0;
    match.player.reloadStarboard = 0;
    pirateFire(match, guard % 2 === 0 ? 1 : -1);
    guard += 1;
  }
}

function benchSimulation(stageId, steps = 2400) {
  const match = createPirateVoyage({ stageId, seed: 909 });
  loadCombat(match);
  setPirateControls(match, { throttle: 1, turn: 0.35 });
  const started = performance.now();
  for (let i = 0; i < steps; i += 1) {
    updatePirateVoyage(match, 1 / 60);
    if (i % 180 === 0 && match.phase === 'sailing') {
      match.enemies = match.enemies.filter((enemy) => !enemy.dead);
      loadCombat(match);
    }
  }
  const ms = performance.now() - started;
  return { ms, steps, stepsPerSecond: (steps / ms) * 1000, enemies: match.enemies.length, balls: match.cannonballs.length };
}

function benchRender(frames = 240) {
  const match = createPirateVoyage({ stageId: PIRATE_STAGES[0].id, seed: 404 });
  loadCombat(match);
  let calls = 0;
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, {
    get(target, key) {
      if (key === 'createLinearGradient' || key === 'createRadialGradient') {
        return () => {
          calls += 1;
          return gradient;
        };
      }
      if (key === 'measureText') return () => ({ width: 12 });
      if (key in target) return target[key];
      return () => { calls += 1; };
    },
    set(target, key, value) {
      target[key] = value;
      return true;
    },
  });
  const started = performance.now();
  for (let i = 0; i < frames; i += 1) {
    renderPirateVoyage(ctx, match, { width: 960, height: 540, zoom: 0.9, time: i / 60 });
  }
  const ms = performance.now() - started;
  return { frames, ms, callsPerFrame: Math.round(calls / frames), frameMs: ms / frames };
}

// The pre-optimization predicate and the shipped one, same data, same points.
function naiveBlocked(x, y, pad = 0) {
  for (const island of PIRATE_ISLANDS) {
    if (Math.hypot(x - island.x, y - island.y) < island.r + pad) return true;
  }
  return false;
}

function fastBlocked(x, y, pad = 0) {
  for (const island of PIRATE_ISLANDS) {
    const limit = island.r + pad;
    const dx = x - island.x;
    if (dx > limit || dx < -limit) continue;
    const dy = y - island.y;
    if (dy > limit || dy < -limit) continue;
    if (dx * dx + dy * dy < limit * limit) return true;
  }
  return false;
}

function benchPredicate(fn, points) {
  let hits = 0;
  for (let round = 0; round < 8; round += 1) {
    for (const [x, y] of points) if (fn(x, y, 24)) hits += 1;
  }
  const started = performance.now();
  for (let round = 0; round < 40; round += 1) {
    for (const [x, y] of points) if (fn(x, y, 24)) hits += 1;
  }
  const ms = performance.now() - started;
  return { nsPerCall: (ms * 1e6) / (points.length * 40), hits };
}

function benchCulling() {
  const match = createPirateVoyage({ stageId: PIRATE_STAGES[0].id, seed: 404 });
  return { visible: pirateVisibleIslands(match, 960, 540, 0.9).length, total: PIRATE_ISLANDS.length };
}

let seed = 1337;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const points = Array.from({ length: 2000 }, () => [rand() * 3600 - 200, rand() * 2600 - 200]);
const naive = benchPredicate(naiveBlocked, points);
const fast = benchPredicate(fastBlocked, points);
const cull = benchCulling();

const sim = benchSimulation(PIRATE_STAGES[0].id);
const late = benchSimulation(PIRATE_STAGES[PIRATE_STAGES.length - 1].id);
const render = benchRender();

console.log(`pirate sim · ${PIRATE_STAGES[0].id} · ${sim.enemies} hulls / ${sim.balls} balls · ${Math.round(sim.stepsPerSecond)} steps/s (${sim.ms.toFixed(1)} ms)`);
console.log(`pirate sim · ${PIRATE_STAGES[PIRATE_STAGES.length - 1].id} · ${late.enemies} hulls / ${late.balls} balls · ${Math.round(late.stepsPerSecond)} steps/s (${late.ms.toFixed(1)} ms)`);
console.log(`pirate render · ${render.callsPerFrame} canvas calls/frame · ${render.frameMs.toFixed(3)} ms/frame on a mock context (${render.frames} frames)`);
console.log(`pirate cull · ${cull.visible}/${cull.total} islands drawn at route-one camera`);
console.log(`island predicate · old ${naive.nsPerCall.toFixed(1)} ns/call vs new ${fast.nsPerCall.toFixed(1)} ns/call · ${(naive.nsPerCall / fast.nsPerCall).toFixed(2)}× faster (same hits: ${naive.hits === fast.hits})`);
