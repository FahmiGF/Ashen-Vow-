import test from 'node:test';
import assert from 'node:assert/strict';
import { UPDATE_LOG, GAME_VERSION, LATEST_UPDATE } from '../src/updates.js';

test('update log is complete and ordered newest first', () => {
  assert.ok(UPDATE_LOG.length >= 5, 'the update log should keep the full release history');
  assert.equal(LATEST_UPDATE, UPDATE_LOG[0]);
  assert.equal(UPDATE_LOG[0].version, GAME_VERSION);

  const seen = new Set();
  let previous = null;
  for (const entry of UPDATE_LOG) {
    assert.match(entry.version, /^\d+\.\d+\.\d+$/);
    assert.ok(!seen.has(entry.version), `duplicate version ${entry.version}`);
    seen.add(entry.version);
    assert.ok(entry.date && entry.title && entry.tag && entry.summary);
    assert.ok(Array.isArray(entry.highlights) && entry.highlights.length > 0);
    assert.ok(entry.highlights.every((line) => typeof line === 'string' && line.length > 0));
    assert.ok(!entry.fixes || entry.fixes.every((line) => typeof line === 'string' && line.length > 0));

    if (previous) {
      const [a, b, c] = previous.version.split('.').map(Number);
      const [x, y, z] = entry.version.split('.').map(Number);
      const newer = a > x || (a === x && (b > y || (b === y && c > z)));
      assert.ok(newer, `${previous.version} should come before ${entry.version}`);
    }
    previous = entry;
  }
});

test('the latest update documents the Fivefold Trials and Puzzle Adventure', () => {
  const latest = LATEST_UPDATE;
  assert.equal(latest.version, '0.15.0');
  const text = [latest.title, latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  assert.match(text, /Fivefold Trials/i);
  assert.match(text, /Puzzle Adventure/i);
  assert.match(text, /20 musuh/i);
  assert.match(text, /1 elite/i);
  assert.match(text, /23 kategori/i);
  assert.match(text, /10 tahap/i);
  assert.match(text, /progress\.trials/);
  assert.match(text, /progress\.puzzle/i);
});

test('the Radiant Crusade release remains documented in the log', () => {
  const latest = UPDATE_LOG.find((entry) => entry.version === '0.14.0');
  assert.ok(latest);
  const text = [latest.title, latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  assert.match(text, /The Radiant Crusade/i);
  assert.match(text, /Valor Chain/i);
  assert.match(text, /Purity Shield/i);
  assert.match(text, /Paladin Templar/i);
  assert.match(text, /Crusader Strike/i);
  assert.match(text, /The Rift/i);
  assert.match(text, /sebelas wilayah|11 wilayah/i);
  assert.match(text, /59 ruang/i);
  assert.match(text, /progress\.crusade/i);
  assert.match(text, /345 test/i);
});

test('the Fallen Ones release remains documented in the log', () => {
  const latest = UPDATE_LOG.find((entry) => entry.version === '0.13.0');
  assert.ok(latest);
  const text = [latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  assert.match(text, /The Fallen Ones/i);
  assert.match(text, /tujuh wilayah|7 wilayah/i);
  assert.match(text, /sebelas bos|11 bos/i);
  assert.match(text, /39 ruang|tiga puluh sembilan/i);
  assert.match(text, /Radiance/i);
  assert.match(text, /Judgment Mark/i);
  assert.match(text, /Purity Shield/i);
  assert.match(text, /Shadow Stance/i);
  assert.match(text, /Eclipse/i);
  assert.match(text, /progress\.fallen/i);
  assert.match(text, /322 test/i);
});

test('the update log still documents fishing, bait tiers and the fish index', () => {
  const latest = UPDATE_LOG.find((entry) => entry.version === '0.12.0');
  assert.ok(latest);
  const text = [latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  assert.match(text, /umpan/i);
  assert.match(text, /25 ikan|dua puluh lima ikan/i);
  assert.match(text, /indeks/i);
  assert.match(text, /25 koin/i);
  assert.match(text, /50 koin/i);
  assert.match(text, /100 koin/i);
  assert.match(text, /Cacing Tanah/i);
  assert.match(text, /progress\.fishing/i);
  assert.match(text, /peluang/i);
  assert.match(text, /Speedrun/i);
  assert.match(text, /290 test/i);
});

test('the update log still documents Speedrun and its one-life escalation', () => {
  const latest = UPDATE_LOG.find((entry) => entry.version === '0.11.0');
  assert.ok(latest);
  const text = [latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  assert.match(text, /Speedrun/i);
  assert.match(text, /satu nyawa/i);
  assert.match(text, /tanpa checkpoint/i);
  assert.match(text, /2×/);
  assert.match(text, /3×/);
  assert.match(text, /Oathbreaker/i);
  assert.match(text, /progress\.speedrun/i);
  assert.match(text, /oneLife/);
});

test('the update log still documents the Faewood stages and its two bosses', () => {
  const latest = UPDATE_LOG.find((entry) => entry.version === '0.10.0');
  assert.ok(latest);
  const text = [latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  assert.match(text, /Faewood|Taman Peri/i);
  assert.match(text, /sepuluh tahap|10 tahap/i);
  assert.match(text, /Slime Magma/i);
  assert.match(text, /Naga Peri Spektral/i);
  assert.match(text, /NPC/i);
  assert.match(text, /progress\.fairy/i);
  assert.match(text, /4 fase/i);
  assert.match(text, /HP 2600/i);
  assert.match(text, /Seraph of the Woven Sky/i);
  assert.match(text, /Demon Lord of the Last Vow/i);
  assert.match(text, /20 detik/i);
  assert.match(text, /30 detik/i);
  assert.match(text, /celebration/i);
  assert.match(text, /264 test/i);
});

test('the update log still documents Skill Points and the Eternal Stage bosses', () => {
  const latest = UPDATE_LOG.find((entry) => entry.version === '0.9.0');
  assert.ok(latest);
  const text = [latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  assert.match(text, /Skill Point/i);
  assert.match(text, /ultimate/i);
  assert.match(text, /enam bos baru|6 bos baru/i);
  assert.match(text, /Panggung Abadi/i);
  assert.match(text, /musik bos/i);
  assert.match(text, /sim-bench|benchmark/i);
  assert.match(text, /progress\.skills/i);
});

test('the update log still documents Hearthfall and the player house', () => {
  const latest = UPDATE_LOG.find((entry) => entry.version === '0.8.0');
  assert.ok(latest);
  const text = [latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  assert.match(text, /6 zona/i);
  assert.match(text, /60 level/i);
  assert.match(text, /12 bos/i);
  assert.match(text, /rumah/i);
  assert.match(text, /8 penghuni/i);
  assert.match(text, /8 senjata/i);
  assert.match(text, /12 alat/i);
  assert.match(text, /13 kelas/i);
  assert.match(text, /benchmark|terukur/i);
  assert.match(text, /progress\.court/i);
});

test('the update log still documents Infinite Labyrinth and co-op', () => {
  const entry = UPDATE_LOG.find((u) => u.version === '0.7.0');
  assert.ok(entry);
  const text = [entry.summary, ...entry.highlights, ...(entry.fixes || [])].join(' ');
  assert.match(text, /20 zona/i);
  assert.match(text, /30 bos/i);
  assert.match(text, /barang terkutuk/i);
  assert.match(text, /Forbidden Synergy/i);
  assert.match(text, /co-op 2–4 pemain/i);
  assert.match(text, /snapshot/i);
  assert.match(text, /revive/i);
  assert.match(text, /checkpoint/i);
  assert.match(text, /WebSocket/i);
});

test('the update log still documents The Sundered Atlas expansion', () => {
  const entry = UPDATE_LOG.find((u) => u.version === '0.6.0');
  assert.ok(entry);
  const text = [entry.summary, ...entry.highlights, ...(entry.fixes || [])].join(' ');
  assert.match(text, /240 ruang/i);
  assert.match(text, /8 zona/i);
  assert.match(text, /Indeks Sumpah/i);
  assert.match(text, /A\*/i);
  assert.match(text, /55 konsumabel/i);
  assert.match(text, /40 senjata/i);
  assert.match(text, /15 fase/i);
});

test('the update log documents the Infinite Frontiers expansion', () => {
  const entry = UPDATE_LOG.find((u) => u.version === '0.4.0');
  assert.ok(entry);
  const text = [entry.summary, ...entry.highlights, ...(entry.fixes || [])].join(' ');
  assert.match(text, /Mode 3D/i);
  assert.match(text, /Thornveil Forest/i);
  assert.match(text, /15 Kelas/i);
  assert.match(text, /Elite Mobs/i);
  assert.match(text, /Map Editor/i);
});

test('the update log documents the Overdrive foundations', () => {
  const entry = UPDATE_LOG.find((u) => u.version === '0.5.0');
  assert.ok(entry);
  const text = [entry.summary, ...entry.highlights, ...(entry.fixes || [])].join(' ');
  assert.match(text, /32 mantra/i);
  assert.match(text, /BossHealthSystem/i);
  assert.match(text, /DiagnosticProfiler/i);
});

test('the update log documents the Echoes of the Forgotten World expansion', () => {
  const entry = UPDATE_LOG.find((u) => u.version === '0.3.0');
  assert.ok(entry);
  const text = [entry.summary, ...entry.highlights, ...(entry.fixes || [])].join(' ');
  assert.match(text, /100 level/i);
  assert.match(text, /Thornveil Haven/i);
  assert.match(text, /Ashen Chronicle/i);
  assert.match(text, /Jurnal Koleksi/i);
  assert.match(text, /New Game Plus/i);
});
