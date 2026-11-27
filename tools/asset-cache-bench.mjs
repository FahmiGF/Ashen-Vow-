// Run with ASHEN_URL pointing at a locally running Ashen Vow server.
import { readdir } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

const base = new URL(process.env.ASHEN_URL || 'http://127.0.0.1:4300/');
const paths = ['index.html'];
for (const [directory, extension] of [['src/', '.js'], ['', '.css'], ['assets/3d/', '.glb']]) {
  const folder = new URL(`../${directory}`, import.meta.url);
  const names = await readdir(folder);
  paths.push(...names.filter((name) => name.endsWith(extension)).sort().map((name) => directory + name));
}

async function sweep() {
  const start = performance.now();
  const times = [];
  for (let offset = 0; offset < paths.length; offset += 8) {
    const batch = paths.slice(offset, offset + 8);
    await Promise.all(batch.map(async (path) => {
      const since = performance.now();
      const response = await fetch(new URL(path, base));
      if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
      await response.arrayBuffer();
      times.push(performance.now() - since);
    }));
  }
  times.sort((a, b) => a - b);
  return { totalMs: performance.now() - start, assetP95Ms: times[Math.ceil(times.length * 0.95) - 1] };
}

const results = [];
for (let run = 0; run < 6; run += 1) results.push(await sweep());
const median = (key) => results.slice(1).map((result) => result[key]).sort((a, b) => a - b)[2];
console.log(JSON.stringify({
  assets: paths.length,
  firstSweepMs: +results[0].totalMs.toFixed(2),
  repeatSweepMedianMs: +median('totalMs').toFixed(2),
  repeatedAssetP95Ms: +median('assetP95Ms').toFixed(2),
}, null, 2));
