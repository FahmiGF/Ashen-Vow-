// Wave Defense simulation benchmark: a fully built, max-level defense in a
// dense late wave. Measures pure update cost only; rendering is covered by the
// browser smoke. Exits non-zero if the frame budget regresses badly.
import assert from 'node:assert/strict';
import {
  WAVE_DEFENSE_TOWERS,
  createWaveDefense,
  updateWaveDefense,
  waveDefenseBuild,
  waveDefenseNextWave,
  waveDefenseSelect,
  waveDefenseSetSpeed,
  waveDefenseUpgrade,
} from '../src/wavedefense.js';

const match = createWaveDefense({ mapId: 'ember_bastion', difficulty: 'knight', seed: 42 });
match.gold = 1_000_000;
for (let i = 0; i < match.slots.length; i += 1) {
  waveDefenseBuild(match, i, WAVE_DEFENSE_TOWERS[i % WAVE_DEFENSE_TOWERS.length].id);
}
for (const tower of [...match.towers]) {
  waveDefenseSelect(match, tower.slot);
  waveDefenseUpgrade(match);
  waveDefenseUpgrade(match);
}
assert.equal(match.towers.length, match.slots.length);
assert.ok(match.towers.every((tower) => tower.level === 3));
waveDefenseSetSpeed(match, 1);
match.wave = 22;
match.phase = 'wave';
match.waveTime = 0;
match.spawnCursor = 0;
match.castle.hp = 1_000_000;
match.castle.maxHp = 1_000_000;
const types = ['ashen_ghoul', 'ash_runner', 'bone_shield', 'cinder_brute', 'grave_bat', 'plague_cultist', 'iron_ogre', 'frost_wraith'];
match.spawnQueue = Array.from({ length: 120 }, (_, index) => ({ at: 0, type: types[index % types.length] }));

const dt = 1 / 60;
updateWaveDefense(match, dt);
// Keep every enemy alive so the benchmark measures the 120-enemy ceiling,
// including tower targeting and projectile pressure, rather than a cleared wave.
for (const enemy of match.enemies) enemy.hp = enemy.maxHp = 1_000_000;
for (let i = 0; i < 120; i += 1) updateWaveDefense(match, dt);
let elapsed = 0;
let peak = 0;
let maxEnemies = match.enemies.length;
const frames = 600;
const started = performance.now();
for (let i = 0; i < frames; i += 1) {
  const before = performance.now();
  updateWaveDefense(match, dt);
  const cost = performance.now() - before;
  elapsed += cost;
  if (cost > peak) peak = cost;
  if (match.enemies.length > maxEnemies) maxEnemies = match.enemies.length;
}
const wall = performance.now() - started;
const average = elapsed / frames;
assert.equal(maxEnemies, 120);
console.log(`towers=${match.towers.length} enemies=${maxEnemies} phase=${match.phase} wave=${match.wave}`);
console.log(`sim: avg ${average.toFixed(3)} ms/frame · peak ${peak.toFixed(3)} ms · wall ${wall.toFixed(0)} ms for ${frames} frames`);
assert.ok(average < 2, `average frame cost ${average.toFixed(3)} ms exceeds 2 ms`);
assert.ok(peak < 16, `peak frame cost ${peak.toFixed(3)} ms exceeds a 60 Hz frame`);
console.log('✔ wave-defense benchmark within budget');
