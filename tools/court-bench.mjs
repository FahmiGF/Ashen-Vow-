// Micro-benchmark for the Hearthfall hot paths.
// Run with: node tools/court-bench.mjs
//
// These are the lookups the hub performs while rendering: room cards, resident
// cards, and the aggregate house bonus. The indexed/memoized versions are the
// ones shipped in src/court.js; the naive versions exist only to quantify the
// difference on this machine.

import { performance } from 'node:perf_hooks';
import {
  COURT_ROOMS,
  COURT_ROOM_BY_ID,
  COURT_ROOM_START,
  HOUSE_RESIDENTS,
  HOUSE_RESIDENT_BY_ID,
  defaultCourtProgress,
  courtBonuses,
  courtStats,
  resetCourtCaches,
  upgradeHouseRoom,
  buyFurnishing,
} from '../src/court.js';

function measure(fn, iterations) {
  // Warm up the JIT before timing.
  for (let i = 0; i < Math.min(1000, iterations); i++) fn(i);
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn(i);
  const ms = performance.now() - start;
  return { ms, ops: iterations / (ms / 1000) };
}

function row(label, indexed, naive) {
  const speedup = indexed.ops / naive.ops;
  console.log(
    `${label.padEnd(32)} indexed ${Math.round(indexed.ops).toLocaleString().padStart(12)} ops/s` +
    `   naive ${Math.round(naive.ops).toLocaleString().padStart(12)} ops/s` +
    `   ${speedup.toFixed(2)}x`,
  );
  return speedup;
}

const progress = defaultCourtProgress();
progress.marks = 100000;
for (const room of ['hall', 'kitchen', 'forge', 'chapel', 'garden', 'vault']) {
  for (let i = 0; i < 3; i++) upgradeHouseRoom(progress, room);
}
for (const id of ['long_table', 'ash_rug', 'oath_banner', 'portrait', 'music_box', 'altar', 'bell']) {
  buyFurnishing(progress, id);
}

console.log('Hearthfall hot-path benchmark');
console.log('─'.repeat(112));
const roomSpeedup = row(
  'room id -> room object',
  measure((i) => COURT_ROOM_BY_ID[COURT_ROOM_START + (i % 30)], 300000),
  measure((i) => {
    const target = COURT_ROOM_START + (i % 30);
    return COURT_ROOMS.find((room) => room.id === target);
  }, 300000),
);

const residentSpeedup = row(
  'resident id -> resident',
  measure((i) => HOUSE_RESIDENT_BY_ID[HOUSE_RESIDENTS[i % HOUSE_RESIDENTS.length].id], 300000),
  measure((i) => {
    const target = HOUSE_RESIDENTS[i % HOUSE_RESIDENTS.length].id;
    return HOUSE_RESIDENTS.find((resident) => resident.id === target);
  }, 300000),
);

// The cached path is what the UI calls on every build; the uncached path clears
// the memo key first, forcing the full aggregation every time.
const cachedBonus = measure(() => courtBonuses(progress), 200000);
const uncachedBonus = measure(() => {
  resetCourtCaches();
  return courtBonuses(progress);
}, 5000);
const bonusSpeedup = cachedBonus.ops / uncachedBonus.ops;
console.log(
  `${'house bonus aggregate'.padEnd(32)} cached ${Math.round(cachedBonus.ops).toLocaleString().padStart(13)} ops/s` +
  `   cold ${Math.round(uncachedBonus.ops).toLocaleString().padStart(13)} ops/s   ${bonusSpeedup.toFixed(2)}x`,
);

const stats = measure(() => courtStats(progress), 100000);
console.log(`${'court stats (single pass)'.padEnd(32)} ${Math.round(stats.ops).toLocaleString()} ops/s`);

console.log('─'.repeat(112));
console.log(`Room lookup ${roomSpeedup.toFixed(2)}x · resident lookup ${residentSpeedup.toFixed(2)}x · cached bonus ${bonusSpeedup.toFixed(2)}x`);
