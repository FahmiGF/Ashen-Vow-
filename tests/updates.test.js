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

test('the Settings 2.0 and 3D visual overhaul release remains documented', () => {
  const latest = UPDATE_LOG.find((entry) => entry.version === '0.19.0');
  assert.ok(latest, 'the v0.19.0 entry is retained');
  const text = [latest.title, latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  assert.match(text, /Settings 2\.0/i);
  assert.match(text, /14 kategori/i);
  assert.match(text, /Story, Easy, Normal, Hard, Nightmare, Abyssal/i);
  assert.match(text, /Audio 2\.0/i);
  assert.match(text, /HUD Layout Editor/i);
  assert.match(text, /Thornveil Forest/i);
  assert.match(text, /Elder Yggvar/i);
  assert.match(text, /420 test/i);
  assert.match(text, /ashen-vow-settings-v1/i);
});

test('the Fivefold Trials, Puzzle Adventure and Riftwar release remains documented', () => {
  const latest = UPDATE_LOG.find((entry) => entry.version === '0.15.0');
  assert.ok(latest);
  const text = [latest.title, latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  assert.match(text, /Fivefold Trials/i);
  assert.match(text, /Puzzle Adventure/i);
  assert.match(text, /Riftwar/i);
  assert.match(text, /MOBA/i);
  assert.match(text, /28 hero/i);
  assert.match(text, /20 musuh/i);
  assert.match(text, /1 elite/i);
  assert.match(text, /23 kategori|23 jenis/i);
  assert.match(text, /100 tahap/i);
  assert.match(text, /sepuluh arc|10 arc/i);
  assert.match(text, /boss-timed/i);
  assert.match(text, /INDEKS/i);
  assert.match(text, /LORE/i);
  assert.match(text, /100 Gema/i);
  assert.match(text, /petunjuk/i);
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

test('Update XIV remains documented after the archive update', () => {
  const latest = UPDATE_LOG.find((item) => item.version === '0.25.0');
  assert.ok(latest);
  const text = [latest.title, latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  for (const pattern of [/Eternal Night/i, /tujuh bab|7 bab/i, /35 tahap|tiga puluh lima/i, /8 bos|delapan bos/i, /First Forgotten/i, /Sanity 3\.0/i, /Veil Exposure/i, /Mental Focus/i, /72 entri|72 entitas/i, /Ravenant|Revenant/i, /procedural|prosedural/i, /Spectral Pursuit/i, /Workshop 2\.0/i, /world event/i, /ekspedisi|expedition/i, /ashen-vow-eternal-v1/, /20 musuh/i, /1 elite/i]) {
    assert.match(text, pattern);
  }
});

test('Update XV remains documented after the Unwritten Wing expansion', () => {
  const latest = UPDATE_LOG.find((item) => item.version === '0.26.0');
  assert.ok(latest);
  const text = [latest.title, latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  for (const pattern of [/Stage Archive/i, /65 tahap/i, /Level Checker/i, /Sneak Peek/i, /Ghost Index 3\.0/i, /72 entri/i, /Jumpscare Index/i, /27 tool/i, /30 event|30 peristiwa/i, /ashen-vow-archive-v1/i, /Anti-Jumpscare/i, /Missing Entries/i]) {
    assert.match(text, pattern);
  }
});

test('the latest update documents the Lighter Ash optimization release', () => {
  const latest = LATEST_UPDATE;
  assert.equal(latest.version, '0.39.0');
  const text = [latest.title, latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  for (const pattern of [/LIGHTER ASH/i, /filter gamma/i, /29 ke 60 fps/, /45%/, /content-visibility/, /3,57 MB menjadi 2,83 MB/, /tiga profil/i, /Profil 1/, /checksum/i, /PROFIL N/, /24 jam/, /tujuh hub/i, /Lanjutkan/]) {
    assert.match(text, pattern);
  }
});

test('the Lanternwake, Vigil Tree and voice release stays documented', () => {
  const latest = UPDATE_LOG.find((entry) => entry.version === '0.36.0');
  assert.ok(latest);
  const text = [latest.title, latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  for (const pattern of [/Lanternwake/i, /669-673/, /ALL_ROOMS kini 674/i, /Orsella/i, /empat fase/i, /progress\.lanternwake/, /Pohon Vigil/i, /21 rank/i, /ElevenLabs/i, /ashen-vow-voice-v1/, /Trailer/i, /80 detik/i, /BOOT-01/, /asset-inventory/i, /Master Plan 3\.0/]) {
    assert.match(text, pattern);
  }
});

test('the Tidewrought Cistern chapter remains documented after the Lanternwake release', () => {
  const latest = UPDATE_LOG.find((entry) => entry.version === '0.35.0');
  assert.ok(latest);
  const text = [latest.title, latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  for (const pattern of [/Sistem Air Pasang/i, /Tidewrought Cistern/i, /662-668/, /ALL_ROOMS kini 669/i, /Drowned Thrall/i, /Silt Lurker/i, /Tide Ember/i, /Valve Sentinel/i, /Vasska/i, /tiga fase|3 fase/i, /Dinding Pasang/i, /Dinding Lumut/i, /\?\?\?/, /progress\.cistern/i, /ashen-vow-progress-v1/, /glow/i, /gelembung|bubbles/i, /render-probe|per lapisan/i, /raster software/i]) {
    assert.match(text, pattern);
  }
});

test('the endless-mode release remains documented after the cistern chapter', () => {
  const entry = UPDATE_LOG.find((item) => item.version === '0.34.0');
  assert.ok(entry);
  const text = [entry.title, entry.summary, ...entry.highlights, ...(entry.fixes || [])].join(' ');
  for (const pattern of [/Pasang Tak Berujung/i, /Sunken Causeway/i, /999/, /progress\.pirates\.endless/i, /frame-profile/i]) {
    assert.match(text, pattern);
  }
});

test('the first open-world pirate release remains documented', () => {
  const latest = UPDATE_LOG.find((entry) => entry.version === '0.32.0');
  assert.ok(latest, 'the v0.32.0 Pirate Tide entry must stay in the log');
  const text = [latest.title, latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  for (const pattern of [/Pirate Tide/i, /laut terbuka|open sea/i, /3\.200/i, /7 pulau|tujuh pulau/i, /5 pelabuhan|lima pelabuhan/i, /meriam|broadside/i, /5 kapten|lima rute/i, /progress\.pirates/i, /tanpa key baru/i]) {
    assert.match(text, pattern);
  }
});

test('the Mourning Choir release remains documented', () => {
  const latest = UPDATE_LOG.find((entry) => entry.version === '0.31.0');
  assert.ok(latest);
  const text = [latest.title, latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  for (const pattern of [/Mourning Choir/i, /Weeping Mother/i, /Mirror Double/i, /Lantern Eater/i, /Drowned Bell/i, /17 peristiwa|tujuh belas/i, /Anti-Jumpscare/i, /ashen-vow-horror-v1/i]) {
    assert.match(text, pattern);
  }
});

test('the hunter kit release remains documented', () => {
  const latest = UPDATE_LOG.find((entry) => entry.version === '0.30.0');
  assert.ok(latest);
  const text = [latest.title, latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  for (const pattern of [/Hunter's Kit/i, /lima alat|5 alat|Lima alat/i, /Toko Pemburu/i, /Tanda Pemburu/i, /stun/i, /Granat Asap|smoke/i, /Peluru Roh|spirit/i, /Jimat Penjaga|ward/i, /ashen-vow-hunter-v1/i, /Scary Mode/i, /Dread/i, /Veil/i, /Eternal/i, /item cepat/i]) {
    assert.match(text, pattern);
  }
});

test('the credit scene and hidden secret release remains documented', () => {
  const latest = UPDATE_LOG.find((entry) => entry.version === '0.29.0');
  assert.ok(latest);
  const text = [latest.title, latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  for (const pattern of [/Credit Scene/i, /11 arc|sebelas arc/i, /Sealius/i, /Technical Lead/i, /Artist & Designer/i, /ashen-vow-secrets-v1/i, /easter egg|rahasia/i, /tidak ada marker|tidak diberi petunjuk/i, /Speedrun/i, /3D Scary/i, /setiap mode/i, /bossDown/i]) {
    assert.match(text, pattern);
  }
});

test('the 3D Scary Mode release remains documented after the credit update', () => {
  const latest = UPDATE_LOG.find((item) => item.version === '0.28.0');
  assert.ok(latest);
  const text = [latest.title, latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  for (const pattern of [/3D Scary Mode/i, /Blackveil/i, /lima bangunan|5 bangunan/i, /15 fase|lima belas fase/i, /WebGL2/i, /GLB/i, /jumpscare/i, /Anti-Jumpscare/i, /ashen-vow-3dhorror-v1/i, /The Unlit|pemburu/i, /\.glb|horror_manor|horror_lighthouse/i]) {
    assert.match(text, pattern);
  }
});

test('the Unwritten Wing release remains documented after 3D Scary Mode', () => {
  const latest = UPDATE_LOG.find((item) => item.version === '0.27.0');
  assert.ok(latest);
  assert.equal(latest.version, '0.27.0');
  const text = [latest.title, latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  for (const pattern of [/Unwritten Wing/i, /8 bab|delapan bab/i, /40 tahap/i, /the_unwritten|The Unwritten/i, /4 fase|empat fase/i, /anomaly/i, /80 entitas/i, /13 kategori/i, /38 event|38 peristiwa/i, /30 tool/i, /Visual Distortion/i, /Spatial Shift/i, /Psychic/i, /Resonance Anchor/i, /Memory Loom/i, /Veil Divider/i, /Anti-Jumpscare/i]) {
    assert.match(text, pattern);
  }
});

test('the Veil of the Forgotten release remains documented after Update XV', () => {
  const entry = UPDATE_LOG.find((item) => item.version === '0.24.0');
  assert.ok(entry);
  const text = [entry.title, entry.summary, ...entry.highlights, ...(entry.fixes || [])].join(' ');
  for (const pattern of [/Veil of the Forgotten/i, /30 tahap/i, /Sanity 2\.0/i, /Ghost Index/i, /ashen-vow-veil-v1/, /Arsitek Tabir/i]) {
    assert.match(text, pattern);
  }
});

test('the v0.23.0 release still documents The Dread Beyond environments, Unnatural enemies and bosses', () => {
  const entry = UPDATE_LOG.find((item) => item.version === '0.23.0');
  assert.ok(entry, 'the Update XII release must stay in the log');
  const text = [entry.title, entry.summary, ...entry.highlights, ...(entry.fixes || [])].join(' ');
  for (const pattern of [/Dread Beyond/i, /lima lingkungan|5 lingkungan/i, /Unnatural/i, /persepsi/i, /peristiwa/i, /bos horor/i, /Awareness/i, /jurnal/i, /mode/i, /kosmetik/i, /ashen-vow-dread-v1/]) {
    assert.match(text, pattern);
  }
});

test('the Scary Mode 2.0 release still documents difficulty, anti-jumpscare, events and journal', () => {
  const latest = UPDATE_LOG.find((entry) => entry.version === '0.22.0');
  assert.ok(latest, 'the Update XI release must stay in the log');
  assert.equal(latest.version, '0.22.0');
  const text = [latest.title, latest.summary, ...latest.highlights, ...(latest.fixes || [])].join(' ');
  for (const pattern of [/Scary Mode/i, /Anti-Jumpscare/i, /kesulitan/i, /peristiwa|event/i, /achievement/i, /jurnal/i, /kabar|kabut/i, /navigasi/i]) {
    assert.match(text, pattern);
  }
});

test('the v0.21.0 release still documents navigation, boss core and Scary Mode v1', () => {
  const entry = UPDATE_LOG.find((item) => item.version === '0.21.0');
  assert.ok(entry, 'the Update X release must stay in the log');
  const text = [entry.title, entry.summary, ...entry.highlights, ...(entry.fixes || [])].join(' ');
  for (const pattern of [/A\*/i, /state machine/i, /hitbox/i, /fase/i, /Scary Mode/i, /line of sight/i, /cooldown/i, /debug/i]) {
    assert.match(text, pattern);
  }
});

test('the v0.20.0 release still documents the GLB pipeline and the WebGL2 renderer', () => {
  const entry = UPDATE_LOG.find((item) => item.version === '0.20.0');
  assert.ok(entry, 'the GLB release must stay in the log');
  const text = [entry.title, entry.summary, ...entry.highlights, ...(entry.fixes || [])].join(' ');
  for (const pattern of [/GLB/i, /WebGL2/i, /skin/i, /HDR/i, /anisotropic/i, /HRTF/i, /relik/i, /vault/i, /LOD/i]) {
    assert.match(text, pattern);
  }
});
