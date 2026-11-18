// Ashen Vow — Puzzle Adventure: The Lost Mechanism
// Pure, deterministic puzzle framework. Every generated puzzle is created from
// a known solution and then scrambled with invertible moves, so solvability is
// guaranteed by construction and can be replayed by validatePuzzle().

export const PUZZLE_VERSION = '1.0.0';
export const PUZZLE_NAME = 'Puzzle Adventure — The Lost Mechanism';
export const PUZZLE_PROGRESS_VERSION = 1;
export const PUZZLE_ARC1_STAGES = 10;
export const PUZZLE_HINT_COST = 100;
export const PUZZLE_BOSS_TIME_LIMIT = 90;
export const PUZZLE_ARC_COUNT = 10;

export function puzzleHash(text) {
  let hash = 2166136261;
  const input = String(text ?? '');
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function puzzleRng(seed) {
  let state = (Number(seed) >>> 0) || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clone = (value) => JSON.parse(JSON.stringify(value));
const pickIndex = (rng, length) => Math.floor(rng() * length) % Math.max(1, length);

// ── twenty-three puzzle categories ─────────────────────────────────────────
// Each category maps onto one reusable engine, so all of them are real and
// testable instead of menu-only entries.
const PUZZLE_SOURCE = [
  ['connect_dots', 'Connect the Dots', 'path', 'Hubungkan titik hijau ke kotak tujuan melalui petak yang bersebelahan.'],
  ['pipe_connections', 'Pipe Connections', 'pipes', 'Putar pipa sampai aliran air menyambung dari sumber ke tujuan.'],
  ['image_restoration', 'Unscrambled Image', 'image', 'Susun kembali gambar kuno yang teracak.'],
  ['gear_rotation', 'Gear Rotation', 'gear', 'Putar roda gigi yang saling terhubung sampai semuanya selaras.'],
  ['mirror_reflection', 'Mirror Reflection', 'beam', 'Arahkan cahaya lewat cermin ke kristal penerima.'],
  ['rune_matching', 'Rune Matching', 'sequence', 'Cocokkan urutan rune untuk membuka segel.'],
  ['energy_circuit', 'Energy Circuit', 'pipes', 'Hubungkan sirkuit energi dengan konduktor yang tepat.'],
  ['pressure_plates', 'Pressure Plates', 'sequence', 'Aktifkan lempeng tekanan dalam urutan yang benar.'],
  ['shadow_matching', 'Shadow Matching', 'image', 'Susun potongan bayangan hingga membentuk siluet.'],
  ['musical_sequence', 'Musical Sequence', 'sequence', 'Ulangi melodi lonceng kuno tanpa salah nada.'],
  ['crystal_colors', 'Crystal Colors', 'pipes', 'Salurkan setiap warna kristal ke penerima yang sesuai.'],
  ['sliding_blocks', 'Sliding Blocks', 'swap', 'Geser balok ke posisi yang ditandai.'],
  ['ancient_maze', 'Ancient Maze', 'path', 'Telusuri koridor yang berubah tanpa menyentuh dinding.'],
  ['clock_alignment', 'Clock Alignment', 'sequence', 'Selaraskan jarum jam dalam urutan waktu yang benar.'],
  ['statue_placement', 'Statue Placement', 'sequence', 'Hadapkan patung ke arah yang diminta.'],
  ['portal_sequence', 'Portal Sequence', 'sequence', 'Aktifkan portal sesuai urutan perjalanan.'],
  ['number_sequence', 'Number Sequence', 'sequence', 'Lengkapi pola angka yang hilang.'],
  ['bridge_construction', 'Bridge Construction', 'sequence', 'Susun platform agar jalur bisa dilalui.'],
  ['laser_routing', 'Laser Routing', 'beam', 'Belokkan berkas laser melewati cermin dan pemecah.'],
  ['memory_tiles', 'Memory Tiles', 'sequence', 'Ingat dan ulangi urutan petak yang menyala.'],
  ['water_control', 'Water Control', 'toggle', 'Atur katup untuk menaikkan dan menurunkan air.'],
  ['combination_lock', 'Combination Lock', 'sequence', 'Temukan kombinasi simbol yang tersembunyi.'],
  ['grand_mechanism', 'Grand Mechanism', 'pipes', 'Gabungkan beberapa sistem dalam satu mekanisme besar.'],
];

export const PUZZLE_ENGINE_IDS = ['path', 'pipes', 'image', 'sequence', 'beam', 'gear', 'toggle', 'swap'];
export const PUZZLE_TYPES = PUZZLE_SOURCE.map(([id, name, engine, desc], index) => ({ id, name, engine, desc, index }));
export const PUZZLE_TYPE_BY_ID = Object.fromEntries(PUZZLE_TYPES.map((type) => [type.id, type]));

export const PUZZLE_ABILITIES = [
  { id: 'rune_scanner', name: 'Rune Scanner', stage: 1, use: 'Membuka simbol tersembunyi di dinding.' },
  { id: 'mechanists_hand', name: "Mechanist's Hand", stage: 2, use: 'Memutar mekanisme berat dari jarak dekat.' },
  { id: 'water_control', name: 'Water Control', stage: 3, use: 'Menaikkan dan menurunkan permukaan air.' },
  { id: 'prism_lens', name: 'Prism Lens', stage: 4, use: 'Menampilkan jalur cahaya yang tak terlihat.' },
  { id: 'echo_pulse', name: 'Echo Pulse', stage: 5, use: 'Mengaktifkan perangkat peka suara.' },
  { id: 'gravity_anchor', name: 'Gravity Anchor', stage: 6, use: 'Mengubah arah mekanisme gravitasi.' },
  { id: 'temporal_dial', name: 'Temporal Dial', stage: 7, use: 'Memperlambat elemen yang bergerak.' },
  { id: 'crystal_key', name: 'Crystal Key', stage: 8, use: 'Membuka kunci kristal kuno.' },
  { id: 'shadow_lantern', name: 'Shadow Lantern', stage: 9, use: 'Menampilkan siluet yang tersembunyi.' },
  { id: 'ancient_compass', name: 'Ancient Compass', stage: 10, use: 'Menemukan ruang teka-teki rahasia.' },
];
export const PUZZLE_ABILITY_BY_ID = Object.fromEntries(PUZZLE_ABILITIES.map((ability) => [ability.id, ability]));

const ARC1_STAGES = [
  { id: 'arc1_1', index: 0, location: 'Forgotten Entrance', name: 'Gerbang Terlupakan', typeId: 'connect_dots', difficulty: 1, ability: 'rune_scanner' },
  { id: 'arc1_2', index: 1, location: 'Flooded Corridor', name: 'Koridor Tergenang', typeId: 'pipe_connections', difficulty: 1, ability: 'mechanists_hand' },
  { id: 'arc1_3', index: 2, location: 'Broken Gallery', name: 'Galeri yang Retak', typeId: 'image_restoration', difficulty: 2, ability: 'water_control' },
  { id: 'arc1_4', index: 3, location: 'Ancient Workshop', name: 'Bengkel Kuno', typeId: 'gear_rotation', difficulty: 2, ability: 'prism_lens' },
  { id: 'arc1_5', index: 4, location: 'Rune Chamber', name: 'Ruang Rune', typeId: 'rune_matching', difficulty: 3, ability: 'echo_pulse' },
  { id: 'arc1_6', index: 5, location: 'Mirror Sanctuary', name: 'Sanctuary Cermin', typeId: 'mirror_reflection', difficulty: 3, ability: 'gravity_anchor' },
  { id: 'arc1_7', index: 6, location: 'Forgotten Library', name: 'Perpustakaan Terlupakan', typeId: 'memory_tiles', difficulty: 3, ability: 'temporal_dial' },
  { id: 'arc1_8', index: 7, location: 'Crystal Laboratory', name: 'Laboratorium Kristal', typeId: 'crystal_colors', difficulty: 4, ability: 'crystal_key' },
  { id: 'arc1_9', index: 8, location: 'Mechanism Core', name: 'Inti Mekanisme', typeId: 'grand_mechanism', difficulty: 4, ability: 'shadow_lantern' },
  { id: 'arc1_10', index: 9, location: 'Ancient Heart', name: 'Jantung Kuno', typeId: 'grand_mechanism', difficulty: 5, boss: 'ancient_heart', ability: 'ancient_compass' },
].map((stage) => ({ ...stage, arc: 1, arcTitle: 'The Lost Mechanism' }));

// Nine more playable arcs continue the mechanism after Ancient Heart. Every
// arc ends in a boss-timed puzzle, and all 23 puzzle categories appear
// repeatedly across the hundred-stage campaign.
const EXTRA_ARCS = [
  {
    title: 'The Sunken Archive', boss: 'flooded_architect',
    story: 'Air yang tidak pernah surut menyimpan catatan pertama para mekanik. Setiap pipa di sini adalah urat yang mengingat nama pemiliknya.',
    secret: 'Lambung arkib masih berdenyut; airnya bukan air, melainkan memori yang mengembun.',
    locations: ['Tideworn Stair', 'Drowned Scriptorium', 'Coral Lock', 'Flooded Vault', 'Silt Garden', 'Broken Aqueduct', 'Pearl Mechanism', 'Deep Current', 'Pressure Hall', 'The Drowned Architect'],
  },
  {
    title: 'The Glass Foundry', boss: 'prism_sphinx',
    story: 'Para pengrajin mencairkan cermin untuk melihat masa depan, lalu lupa bahwa bayangan pun bisa memilih jalan pulang.',
    secret: 'Setiap pecahan kaca memantulkan satu kemungkinan yang tidak pernah terjadi.',
    locations: ['Cracked Furnace', 'Molten Lattice', 'Prism Assembly', 'Ash Conveyor', 'Mirror Kiln', 'Crystal Bellows', 'Glass Labyrinth', 'Shard Garden', 'White Heat', 'The Prism Sphinx'],
  },
  {
    title: 'The Clockwork Garden', boss: 'eternal_clock',
    story: 'Taman ini tidak ditanam; ia dijadwalkan. Daun tumbuh tepat saat lonceng berbunyi, dan setiap kelopak menyimpan satu detik yang hilang.',
    secret: 'Jam terbesar tidak menunjukkan waktu sekarang, tetapi waktu ketika mekanisme pertama kali berjanji.',
    locations: ['Bronze Gate', 'Ticking Grove', 'Pendulum Walk', 'Gear Orchard', 'Minute Maze', 'Hourglass Pond', 'Spring Mechanism', 'Midnight Arbor', 'The Long Second', 'The Eternal Clock'],
  },
  {
    title: 'The First Vow', boss: 'mechanized_guardian',
    story: 'Sebelum kerajaan, sebelum abu, ada satu sumpah yang diucapkan pada roda gigi pertama. Penjaganya masih menagih janji itu.',
    secret: 'Sumpah pertama bukan untuk menjaga dunia, melainkan untuk menjaga pintu agar tidak pernah dibuka dari dalam.',
    locations: ['Vowstone Path', 'Oath Bell', 'Sealed Workshop', 'Mechanism Altar', 'Broken Promise', 'First Gear', 'Last Lock', 'The Quiet Core', 'Heart Engine', 'The Mechanized Guardian'],
  },
  {
    title: 'The Ember Loom', boss: 'ember_weaver',
    story: 'Di bawah bengkel, benang bara menenun ulang setiap mesin yang pernah mati. Penenunnya meminta satu nama sebagai upah.',
    secret: 'Setiap benang bara adalah nyawa yang pernah dilebur menjadi bahan bakar.',
    locations: ['Cinder Loom', 'Threadbare Hall', 'Ember Spindle', 'Scorched Pattern', 'Weaver’s Landing', 'Coal Garden', 'Burning Knot', 'Ash Tapestry', 'The Red Loom', 'The Ember Weaver'],
  },
  {
    title: 'The Hollow Observatory', boss: 'hollow_star',
    story: 'Sebuah observatorium tanpa langit. Bintang-bintang di lantainya adalah lubang yang menatap balik ke arah pengamat.',
    secret: 'Tidak ada bintang di atas sana; yang mereka lihat adalah mata sesuatu yang tidur di bawah lensa.',
    locations: ['Lensless Dome', 'Orbit Stair', 'Fallen Constellation', 'Null Meridian', 'Comet Well', 'Starless Gallery', 'Gravity Cradle', 'Black Sun Dial', 'The Last Orbit', 'The Hollow Star'],
  },
  {
    title: 'The Abyssal Choir', boss: 'abyssal_cantor',
    story: 'Nyanyian di kedalaman bukan pujian. Ia adalah perintah yang diulang sampai dinding lupa cara berdiri.',
    secret: 'Kantor abyssal tidak menyanyi untuk dewa; ia menyanyi agar sesuatu di bawah tetap tertidur.',
    locations: ['Drowned Nave', 'Hymnless Vault', 'Coral Throat', 'Tide Bell', 'Choir of Salt', 'Pressure Psalm', 'The Silent Verse', 'Deep Antiphon', 'Last Hallelujah', 'The Abyssal Cantor'],
  },
  {
    title: 'The Forgotten Throne', boss: 'forgotten_sovereign',
    story: 'Tahta ini tidak pernah kosong. Ia hanya lupa siapa yang duduk di atasnya, dan memanggil setiap pengunjung dengan nama raja lama.',
    secret: 'Raja yang terlupakan masih di sana, terkunci di dalam patung yang tidak pernah selesai dipahat.',
    locations: ['Empty Court', 'Crownless Hall', 'Statue Procession', 'The Pale Throne', 'Regent’s Maze', 'Scepter Vault', 'Dust Coronation', 'The Last Subject', 'Throne Room', 'The Forgotten Sovereign'],
  },
  {
    title: 'The Last Mechanism', boss: 'last_machinist',
    story: 'Di ujung semua mesin, seorang machinist duduk di depan roda yang tidak berputar. Ia menunggu seseorang menyelesaikan pekerjaannya.',
    secret: 'Mekanisme terakhir bukan mesin penghancur. Ia adalah mesin yang menyimpan semua janji yang tidak sempat ditepati.',
    locations: ['Final Bench', 'Unfinished Gear', 'The Last Blueprint', 'Machinist’s Rest', 'Broken Oath Engine', 'Zero Turn', 'The Quiet Workshop', 'Inheritance Lock', 'Vow Engine', 'The Last Machinist'],
  },
];

function buildArcStages() {
  const stages = [];
  EXTRA_ARCS.forEach((arc, arcOffset) => {
    const arcNumber = arcOffset + 2;
    arc.locations.forEach((name, localIndex) => {
      const index = (arcNumber - 1) * 10 + localIndex;
      const type = PUZZLE_TYPES[(index * 7) % PUZZLE_TYPES.length];
      stages.push({
        id: `arc${arcNumber}_${localIndex + 1}`,
        index,
        location: `${arc.title} · Lapis ${localIndex + 1}`,
        name,
        typeId: type.id,
        difficulty: Math.min(5, arcNumber),
        arc: arcNumber,
        arcTitle: arc.title,
        ...(localIndex === 9 ? {
          boss: arc.boss,
          timed: true,
          timeLimit: PUZZLE_BOSS_TIME_LIMIT,
        } : {}),
      });
    });
  });
  return stages;
}

export const PUZZLE_STAGES = [...ARC1_STAGES.map((stage) => (stage.boss
  ? { ...stage, timed: true, timeLimit: PUZZLE_BOSS_TIME_LIMIT }
  : stage)), ...buildArcStages()];
/** Legacy Arc 1 slice; progression APIs use the full PUZZLE_STAGES list. */
export const PUZZLE_ARC1 = PUZZLE_STAGES.slice(0, PUZZLE_ARC1_STAGES);
export const PUZZLE_STAGE_COUNT = PUZZLE_STAGES.length;
export const PUZZLE_ARC1_STAGE_BY_ID = Object.fromEntries(PUZZLE_ARC1.map((stage) => [stage.id, stage]));
export const PUZZLE_STAGE_BY_ID = Object.fromEntries(PUZZLE_STAGES.map((stage) => [stage.id, stage]));

export const PUZZLE_BOSSES = [
  { id: 'mechanized_guardian', name: 'The Mechanized Guardian', phases: ['gear_rotation', 'pressure_plates', 'grand_mechanism'], desc: 'Aktifkan tiga mekanisme sambil menghindari serangannya.', lore: 'Penjaga pertama ditempa dari roda gigi yang belum pernah berhenti. Ia tidak tidur; ia hanya menunggu sumpah berikutnya.' },
  { id: 'prism_sphinx', name: 'The Prism Sphinx', phases: ['mirror_reflection', 'crystal_colors', 'laser_routing'], desc: 'Pecahkan pantulan cahaya untuk membuka kelemahannya.', lore: 'Sphinx ini tidak menjaga pintu. Ia menjaga jawaban yang akan mengubah siapa pun yang berhasil melewatinya.' },
  { id: 'flooded_architect', name: 'The Flooded Architect', phases: ['pipe_connections', 'water_control', 'bridge_construction'], desc: 'Alihkan saluran air untuk mengubah arena.', lore: 'Ia membangun arkib untuk menyelamatkan kenangan, lalu menenggelamkannya agar tidak ada yang membaca terlalu jauh.' },
  { id: 'eternal_clock', name: 'The Eternal Clock', phases: ['clock_alignment', 'gear_rotation', 'number_sequence'], desc: 'Selesaikan teka-teki waktu di sela fase tempurnya.', lore: 'Setiap detik yang kau habiskan di sini disimpan di dalamnya. Ia tidak membunuh; ia hanya menagih waktu.' },
  { id: 'ancient_heart', name: 'The Ancient Heart', phases: ['gear_rotation', 'mirror_reflection', 'grand_mechanism'], desc: 'Tiga sistem kuno harus hidup kembali sebelum jantung berhenti.', lore: 'Jantung ini tidak memompa darah. Ia memompa tujuan, dan telah berdetak lebih lama daripada nama-nama yang menyalakannya.' },
  { id: 'ember_weaver', name: 'The Ember Weaver', phases: ['energy_circuit', 'gear_rotation', 'grand_mechanism'], desc: 'Hubungkan tenun bara sebelum benangnya membakar seluruh papan.', lore: 'Penenun memakai nyawa yang telah selesai sebagai benang. Ia percaya setiap mesin berhak dilahirkan kembali.' },
  { id: 'hollow_star', name: 'The Hollow Star', phases: ['shadow_matching', 'mirror_reflection', 'portal_sequence'], desc: 'Susun bayangan di sekitar bintang kosong tanpa menatapnya terlalu lama.', lore: 'Bintang ini bukan cahaya, melainkan tempat cahaya pernah tinggal. Siapa pun yang menatapnya akan melihat dirinya yang tidak pernah kembali.' },
  { id: 'abyssal_cantor', name: 'The Abyssal Cantor', phases: ['musical_sequence', 'rune_matching', 'memory_tiles'], desc: 'Ulangi kidung dasar laut untuk menidurkan kembali sesuatu di bawahnya.', lore: 'Kantor tidak ingin dibebaskan. Ia ingin nyanyiannya berhenti, tetapi sesuatu di bawah tidak mengizinkannya.' },
  { id: 'forgotten_sovereign', name: 'The Forgotten Sovereign', phases: ['statue_placement', 'combination_lock', 'pressure_plates'], desc: 'Kembalikan patung-patung ke posisi yang diingat tahta.', lore: 'Raja ini lupa namanya sendiri, tetapi ia masih ingat setiap wajah yang pernah berjanji setia kepadanya.' },
  { id: 'last_machinist', name: 'The Last Machinist', phases: ['number_sequence', 'bridge_construction', 'grand_mechanism'], desc: 'Selesaikan blueprint terakhir sebelum mekanisme menutup selamanya.', lore: 'Machinist terakhir tidak menginginkan mahkota. Ia hanya ingin seseorang menyelesaikan pekerjaan yang ia mulai sebelum dunia kehilangan nama-namanya.' },
];
export const PUZZLE_BOSS_BY_ID = Object.fromEntries(PUZZLE_BOSSES.map((boss) => [boss.id, boss]));

/** Story index shown by the LORE tab. */
export const PUZZLE_ARCS = [
  { arc: 1, title: 'The Lost Mechanism', boss: 'ancient_heart', story: 'Mekanisme yang menahan dunia telah kehilangan urutannya. Gerbang, pipa, cermin, dan roda gigi menunggu seseorang yang mau mendengarkan bunyi lamanya.', secret: 'Tidak ada yang membangun mekanisme ini untuk menahan dunia. Ia dibangun agar dunia tidak bangun.' },
  ...EXTRA_ARCS.map((arc, index) => ({ arc: index + 2, title: arc.title, boss: arc.boss, story: arc.story, secret: arc.secret })),
];
export const PUZZLE_LORE = {
  intro: 'Catatan Mekanisme Hilang. Setiap arc adalah lapisan ingatan yang sama: para penjaga mencoba menghentikan sesuatu yang tidak punya nama, dan setiap teka-teki adalah kunci yang mereka tinggalkan.',
  epilogue: 'Jika kau sampai di roda terakhir, kau akan menemukan bahwa mekanisme itu tidak pernah rusak. Ia hanya menunggu seseorang memilih untuk memutarnya lagi.',
  arcs: PUZZLE_ARCS,
};
export const PUZZLE_TYPE_LORE = {
  connect_dots: 'Jalur pertama dibuat oleh seorang anak yang menandai jalan pulang dengan batu.' ,
  pipe_connections: 'Pipa-pipa ini mengalirkan memori, bukan air; setiap sambungan adalah janji yang disambung ulang.',
  image_restoration: 'Gambar-gambar ini adalah potret para mekanik. Wajah mereka terhapus setiap kali mekanisme lupa.',
  gear_rotation: 'Roda gigi pertama diputar oleh sumpah, bukan tangan. Ia masih menghitung siapa yang berutang.',
  mirror_reflection: 'Cermin di sini tidak memantulkan cahaya. Ia memantulkan pilihan yang belum diambil.',
  rune_matching: 'Rune adalah nama lama untuk perintah. Menyusunnya berarti memerintahkan sesuatu untuk bangun.',
  energy_circuit: 'Sirkuit ini pernah menjadi urat nadi kota yang kini tidak ada lagi di peta.',
  pressure_plates: 'Lempeng tekanan menimbang niat, bukan berat badan. Hanya langkah yang yakin yang dihitung.',
  shadow_matching: 'Bayangan-bayangan ini milik orang yang pernah mencoba mekanisme sebelum kau.',
  musical_sequence: 'Lonceng kuno menyimpan suara terakhir setiap penjaga. Nada yang salah akan memanggil mereka.',
  crystal_colors: 'Setiap warna kristal adalah emosi yang dikristalkan agar tidak hilang bersama pemiliknya.',
  sliding_blocks: 'Balok-balok ini dulunya adalah bagian dari tahta. Mereka masih ingat urutan duduk para raja.',
  ancient_maze: 'Labirin berubah mengikuti ingatan pengunjung. Dinding yang kau lupakan akan menghilang.',
  clock_alignment: 'Jam ini tidak terlambat. Dunia yang datang terlalu cepat.',
  statue_placement: 'Patung-patung menghadap arah yang hanya masuk akal bagi seseorang yang sudah mati.',
  portal_sequence: 'Portal tidak membawa kau ke tempat lain; ia membawa kau ke waktu ketika kau masih bisa memilih.',
  number_sequence: 'Angka-angka ini adalah jumlah sumpah yang diucapkan di setiap arc. Polanya tidak pernah selesai.',
  bridge_construction: 'Jembatan ini dibangun dari janji yang tidak ditepati. Setiap papan adalah nama.',
  laser_routing: 'Laser adalah benang yang menghubungkan dua penyesalan. Cermin menentukan mana yang dipotong.',
  memory_tiles: 'Petak-petak ini menyala sesuai urutan kematian para penjaga. Mengulanginya berarti mengingat mereka.',
  water_control: 'Katup air mengatur seberapa dalam kau ingin mengingat. Semakin tinggi, semakin banyak yang naik.',
  combination_lock: 'Kombinasi ini tidak membuka pintu. Ia membuka ingatan yang sengaja dikunci.',
  grand_mechanism: 'Mekanisme agung adalah gabungan semua kesalahan kecil yang akhirnya bergerak bersama.',
};

const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // E S W N
const adjacentCells = (x, y, w, h) => DIRS
  .map(([dx, dy]) => [x + dx, y + dy])
  .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < w && ny < h);
const cellKey = (x, y) => `${x},${y}`;
const pairsEqual = (a, b) => a[0] === b[0] && a[1] === b[1];

function shuffle(list, rng) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = pickIndex(rng, i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── generators ─────────────────────────────────────────────────────────────
function generatePath(difficulty, rng) {
  const w = 5 + difficulty;
  const h = 5 + Math.min(2, difficulty);
  const blocked = new Set();
  const path = [[0, 0]];
  let x = 0;
  let y = 0;
  // Monotonic right/down walk: always adjacent, never revisits a cell, always
  // reaches the goal. Randomness only chooses the order of the two moves.
  while (x !== w - 1 || y !== h - 1) {
    const canRight = x < w - 1;
    const canDown = y < h - 1;
    const goRight = canRight && (!canDown || rng() < 0.5);
    x = goRight ? x + 1 : x;
    y = goRight ? y : y + 1;
    path.push([x, y]);
  }
  const pathKeys = new Set(path.map(([px, py]) => cellKey(px, py)));
  for (let cy = 0; cy < h; cy += 1) {
    for (let cx = 0; cx < w; cx += 1) {
      const key = cellKey(cx, cy);
      if (!pathKeys.has(key) && rng() < 0.24) blocked.add(key);
    }
  }
  return {
    w, h, blocked: [...blocked], start: [0, 0], goal: [w - 1, h - 1],
    initial: { path: [[0, 0]] },
    solution: path.slice(1).map((cell) => ({ cell })),
  };
}

function applyPath(puzzle, move) {
  if (!move?.cell) return { ok: false };
  const [cx, cy] = move.cell;
  const path = puzzle.state.path;
  const last = path[path.length - 1];
  if (!last) return { ok: false };
  if (puzzle.blocked.includes(cellKey(cx, cy))) return { ok: false };
  if (path.length > 1 && pairsEqual(move.cell, path[path.length - 2])) {
    return { ok: true, state: { path: path.slice(0, -1) } };
  }
  if (!pairsEqual(last, move.cell)
    && Math.abs(last[0] - cx) + Math.abs(last[1] - cy) !== 1) return { ok: false };
  if (path.some((cell) => pairsEqual(cell, move.cell))) return { ok: false };
  return { ok: true, state: { path: [...path, move.cell] } };
}

function pathSolved(puzzle) {
  const path = puzzle.state.path;
  return path.length > 0 && pairsEqual(path[path.length - 1], puzzle.goal);
}

function pipeConnections(kind, rotation) {
  const base = {
    straight: [1, 0, 1, 0], // E W
    elbow: [1, 0, 0, 1], // E N
    tee: [1, 1, 0, 1], // E S N
    cross: [1, 1, 1, 1],
    deadend: [1, 0, 0, 0],
  }[kind] || [1, 1, 1, 1];
  const shift = ((Number(rotation) || 0) % 4 + 4) % 4;
  return base.map((_, index) => base[(index - shift + 4) % 4]);
}

function generatePipes(difficulty, rng) {
  const w = 4 + Math.min(2, Math.floor(difficulty / 2));
  const h = 4 + Math.min(1, Math.floor(difficulty / 3));
  // A snake covering every cell gives each piece a canonical connection set.
  const base = Array.from({ length: w * h }, () => [0, 0, 0, 0]);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const index = y * w + x;
      const right = y % 2 === 0 ? x + 1 : x - 1;
      if (right >= 0 && right < w) {
        base[index][0] = 1;
        base[y * w + right][2] = 1;
      }
      if (y < h - 1) {
        base[index][1] = 1;
        base[(y + 1) * w + x][3] = 1;
      }
    }
  }
  const pieces = base.map((connections) => {
    const total = connections.reduce((sum, value) => sum + value, 0);
    if (total === 1) return 'deadend';
    if (connections[0] && connections[2] || connections[1] && connections[3]) return 'straight';
    if (total === 3) return 'tee';
    return 'elbow';
  });
  let rotations = [];
  // Some pieces are rotationally symmetric, so a random scramble can still be
  // connected. Retry until the visible layout genuinely starts open.
  for (let attempt = 0; attempt < 40; attempt += 1) {
    rotations = base.map(() => pickIndex(rng, 3) + 1);
    const probe = { w, h, base, source: [0, 0], sink: [w - 1, h - 1], state: { rotations } };
    if (!gridConnected(probe)) break;
  }
  const solution = rotations.map((turns, index) => ({ rotate: index, turns: (4 - turns) % 4 }));
  return {
    w, h, pieces, base, source: [0, 0], sink: [w - 1, h - 1],
    initial: { rotations },
    solution,
  };
}

function rotateConnections(base, turns) {
  const shift = ((Number(turns) || 0) % 4 + 4) % 4;
  return base.map((_, index) => base[(index - shift + 4) % 4]);
}

function gridConnected(puzzle) {
  const { w, h, base, source, sink } = puzzle;
  const seen = new Set([`${source[0]},${source[1]}`]);
  const queue = [source];
  while (queue.length) {
    const [x, y] = queue.shift();
    const index = y * w + x;
    if (!puzzle.base?.[index]) continue;
    const connections = rotateConnections(puzzle.base[index], puzzle.state.rotations[index]);
    for (let dir = 0; dir < 4; dir += 1) {
      if (!connections[dir]) continue;
      const nx = x + DIRS[dir][0];
      const ny = y + DIRS[dir][1];
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const neighbor = ny * w + nx;
      const back = rotateConnections(puzzle.base[neighbor] || [0, 0, 0, 0], puzzle.state.rotations[neighbor]);
      if (!back[(dir + 2) % 4]) continue;
      const key = `${nx},${ny}`;
      if (!seen.has(key)) {
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
  }
  return seen.has(`${sink[0]},${sink[1]}`);
}

function generateImage(difficulty, rng) {
  const size = difficulty <= 1 ? 2 : difficulty <= 2 ? 3 : difficulty <= 4 ? 4 : 5;
  const count = size * size;
  const solvedOrder = Array.from({ length: count }, (_, index) => index);
  let order = solvedOrder.slice();
  const scramble = [];
  const moves = 4 + difficulty * 3;
  for (let i = 0; i < moves; i += 1) {
    const a = pickIndex(rng, count);
    let b = pickIndex(rng, count);
    if (b === a) b = (b + 1) % count;
    [order[a], order[b]] = [order[b], order[a]];
    scramble.push({ a, b });
  }
  if (order.every((value, index) => value === index)) {
    [order[0], order[1]] = [order[1], order[0]];
    scramble.push({ a: 0, b: 1 });
  }
  return {
    size, goalOrder: solvedOrder,
    initial: { order },
    solution: scramble.slice().reverse().map(({ a, b }) => ({ a, b })),
  };
}

function generateSequence(difficulty, rng) {
  const count = 4 + difficulty;
  const goal = shuffle(Array.from({ length: count }, (_, index) => `rune_${index + 1}`), rng);
  let order = goal.slice();
  const scramble = [];
  for (let i = 0; i < count; i += 1) {
    const a = pickIndex(rng, count);
    let b = pickIndex(rng, count);
    if (a === b) b = (b + 1) % count;
    [order[a], order[b]] = [order[b], order[a]];
    scramble.push({ a, b });
  }
  if (order.every((value, index) => value === goal[index])) {
    [order[0], order[1]] = [order[1], order[0]];
    scramble.push({ a: 0, b: 1 });
  }
  return { count, goal, initial: { order }, solution: scramble.slice().reverse().map(({ a, b }) => ({ a, b })) };
}

function generateBeam(difficulty, rng) {
  const w = 5 + difficulty;
  const h = 4 + Math.min(2, difficulty);
  const sourceRow = Math.floor(h / 2);
  const targetRow = Math.max(0, Math.min(h - 1, sourceRow - 1));
  const targetCol = w - 1;
  const positions = [];
  const kinds = [];
  // East to the last column, then turn vertically, then east into the target.
  if (targetRow !== sourceRow) {
    positions.push([targetCol - 1, sourceRow]);
    kinds.push(targetRow < sourceRow ? '/' : '\\');
    positions.push([targetCol - 1, targetRow]);
    kinds.push(targetRow < sourceRow ? '/' : '\\');
  }
  const canonical = kinds.map((kind) => (kind === '/' ? 0 : 1));
  const rotations = kinds.map(() => pickIndex(rng, 4));
  // Keep at least one mirror out of alignment so the puzzle never starts solved.
  if (kinds.length) rotations[0] = rotations[0] % 2 === 0 ? 1 : 3;
  const solution = rotations.map((turns, index) => ({ rotate: index, turns: (4 - turns) % 4 }));
  return {
    w, h, source: [0, sourceRow], target: [targetCol, targetRow],
    mirrors: kinds, mirrorPositions: positions, canonical,
    initial: { rotations },
    solution,
  };
}

function generateGear(difficulty, rng, kind = 'gear') {
  const count = 4 + difficulty;
  const neighbors = Array.from({ length: count }, (_, index) => {
    const next = [index];
    if (index > 0) next.push(index - 1);
    if (index < count - 1) next.push(index + 1);
    return next;
  });
  const scramble = [];
  const steps = 3 + difficulty;
  const state = Array.from({ length: count }, () => 0);
  const applyScramble = (index) => {
    scramble.push({ index });
    for (const target of neighbors[index]) state[target] ^= 1;
  };
  for (let i = 0; i < steps; i += 1) applyScramble(pickIndex(rng, count));
  // An all-zero scramble would already be solved; one more real move keeps the
  // recorded solution consistent with the visible state.
  let guard = 0;
  while (state.every((value) => value === 0) && guard < 8) {
    applyScramble(0);
    guard += 1;
  }
  return {
    count, kind, neighbors,
    initial: { state },
    solution: scramble.slice().reverse().map(({ index }) => ({ index })),
  };
}

function applyToggle(puzzle, move) {
  const index = Number(move?.index);
  if (!Number.isInteger(index) || !puzzle.neighbors[index]) return { ok: false };
  const state = puzzle.state.state.slice();
  for (const target of puzzle.neighbors[index]) state[target] ^= 1;
  return { ok: true, state: { state } };
}

function toggleSolved(puzzle) {
  return puzzle.state.state.every((value) => value === 0);
}

function generateSwap(difficulty, rng) {
  const size = Math.min(6, 3 + difficulty);
  const count = size * size;
  const order = Array.from({ length: count }, (_, index) => index);
  const scramble = [];
  for (let i = 0; i < 5 + difficulty * 2; i += 1) {
    const a = pickIndex(rng, count);
    const b = (a + 1) % count;
    [order[a], order[b]] = [order[b], order[a]];
    scramble.push({ a, b });
  }
  if (order.every((value, index) => value === index)) {
    [order[0], order[1]] = [order[1], order[0]];
    scramble.push({ a: 0, b: 1 });
  }
  return { size, initial: { order }, solution: scramble.slice().reverse().map(({ a, b }) => ({ a, b })) };
}

// ── public generation ──────────────────────────────────────────────────────
export function generatePuzzle(typeId, difficulty = 1, seed = 'ashen') {
  const type = PUZZLE_TYPE_BY_ID[typeId] || PUZZLE_TYPES[0];
  const level = Math.max(1, Math.min(5, Math.round(Number(difficulty) || 1)));
  const rng = puzzleRng(puzzleHash(`${type.id}|${level}|${seed}`));
  let data;
  switch (type.engine) {
    case 'path': data = generatePath(level, rng); break;
    case 'pipes': data = generatePipes(level, rng); break;
    case 'image': data = generateImage(level, rng); break;
    case 'sequence': data = generateSequence(level, rng); break;
    case 'beam': data = generateBeam(level, rng); break;
    case 'gear': data = generateGear(level, rng, 'gear'); break;
    case 'toggle': data = generateGear(level, rng, 'toggle'); break;
    case 'swap': data = generateSwap(level, rng); break;
    default: data = generatePath(level, rng);
  }
  const state = clone(data.initial);
  const puzzle = {
    id: `${type.id}_${level}_${puzzleHash(seed).toString(36)}`,
    typeId: type.id,
    typeName: type.name,
    engine: type.engine,
    difficulty: level,
    seed: String(seed),
    ...data,
    state,
    initial: clone(data.initial),
    moves: 0,
  };
  return puzzle;
}

export function puzzleIsSolved(puzzle) {
  switch (puzzle?.engine) {
    case 'path': return pathSolved(puzzle);
    case 'pipes': return gridConnected(puzzle);
    case 'image':
    case 'sequence':
      return puzzle.state.order.every((value, index) => value === (puzzle.engine === 'image' ? puzzle.goalOrder[index] : puzzle.goal[index]));
    case 'swap': return puzzle.state.order.every((value, index) => value === index);
    case 'beam': return beamHitsTarget(puzzle);
    case 'gear':
    case 'toggle': return toggleSolved(puzzle);
    default: return false;
  }
}

function beamHitsTarget(puzzle) {
  let x = puzzle.source[0];
  let y = puzzle.source[1];
  let dir = 0;
  const seen = new Set();
  const mirrorAt = (mx, my) => (puzzle.mirrorPositions || []).findIndex(([px, py]) => px === mx && py === my);
  for (let step = 0; step < 200; step += 1) {
    const key = `${x},${y},${dir}`;
    if (seen.has(key)) return false;
    seen.add(key);
    x += DIRS[dir][0];
    y += DIRS[dir][1];
    if (x < 0 || y < 0 || x >= puzzle.w || y >= puzzle.h) return false;
    if (x === puzzle.target[0] && y === puzzle.target[1]) return true;
    const index = mirrorAt(x, y);
    if (index < 0) continue;
    const rotation = puzzle.state.rotations[index] || 0;
    const effective = ((puzzle.canonical?.[index] || 0) + rotation) % 2;
    // '/' turns E->N and S->W; '\\' turns E->S and N->W.
    dir = effective === 0 ? [3, 2, 1, 0][dir] : [1, 0, 3, 2][dir];
  }
  return false;
}

/** Applies one player interaction. Returns a new puzzle plus result flags. */
export function applyPuzzleMove(puzzle, move) {
  if (!puzzle || !move) return { ok: false, puzzle };
  let next = null;
  if (puzzle.engine === 'path') {
    const result = applyPath(puzzle, move);
    if (result.ok) next = { ...puzzle, state: result.state, moves: puzzle.moves + 1 };
  } else if (puzzle.engine === 'pipes') {
    const index = Number(move.rotate);
    if (Number.isInteger(index) && puzzle.pieces[index]) {
      const rotations = puzzle.state.rotations.slice();
      const turns = Number.isFinite(Number(move.turns)) ? Number(move.turns) : 1;
      rotations[index] = (rotations[index] + turns) % 4;
      next = { ...puzzle, state: { rotations }, moves: puzzle.moves + 1 };
    }
  } else if (puzzle.engine === 'beam') {
    const index = Number(move.rotate);
    if (Number.isInteger(index) && puzzle.mirrors[index] !== undefined) {
      const rotations = puzzle.state.rotations.slice();
      const turns = Number.isFinite(Number(move.turns)) ? Number(move.turns) : 1;
      rotations[index] = (rotations[index] + turns) % 4;
      next = { ...puzzle, state: { rotations }, moves: puzzle.moves + 1 };
    }
  } else if (puzzle.engine === 'image' || puzzle.engine === 'sequence' || puzzle.engine === 'swap') {
    const a = Number(move.a);
    const b = Number(move.b);
    if (Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= 0 && a < puzzle.state.order.length && b < puzzle.state.order.length) {
      const order = puzzle.state.order.slice();
      [order[a], order[b]] = [order[b], order[a]];
      next = { ...puzzle, state: { order }, moves: puzzle.moves + 1 };
    }
  } else if (puzzle.engine === 'gear' || puzzle.engine === 'toggle') {
    const result = applyToggle(puzzle, move);
    if (result.ok) next = { ...puzzle, state: result.state, moves: puzzle.moves + 1 };
  }
  if (!next) return { ok: false, puzzle };
  return { ok: true, puzzle: next, solved: puzzleIsSolved(next) };
}

export function puzzleSolutionMoves(puzzle) {
  return Array.isArray(puzzle?.solution) ? clone(puzzle.solution) : [];
}

/**
 * Replays the recorded solution from the initial state. This is the automatic
 * solvability gate used by the editor, co-op and tests.
 */
export function validatePuzzle(puzzle) {
  const errors = [];
  if (!puzzle || !puzzle.engine) return { ok: false, errors: ['puzzle missing'] };
  if (!Array.isArray(puzzle.solution) || puzzle.solution.length === 0) errors.push('puzzle has no recorded solution');
  let current = { ...clone(puzzle), state: clone(puzzle.initial), moves: 0 };
  for (const move of puzzle.solution || []) {
    const result = applyPuzzleMove(current, move);
    if (!result.ok) {
      errors.push(`solution move rejected: ${JSON.stringify(move)}`);
      break;
    }
    current = result.puzzle;
  }
  if (!errors.length && !puzzleIsSolved(current)) errors.push('recorded solution does not solve the puzzle');
  const replay = generatePuzzle(puzzle.typeId, puzzle.difficulty, puzzle.seed);
  if (!replay || replay.typeId !== puzzle.typeId) errors.push('generator cannot reproduce this puzzle');
  return { ok: errors.length === 0, errors, solutionMoves: puzzle.solution?.length || 0 };
}

/** Editor publish gate: a broken/unsolvable layout is rejected outright. */
export function publishPuzzle(puzzle) {
  const validation = validatePuzzle(puzzle);
  if (!validation.ok) return { ok: false, errors: validation.errors };
  const { w, h } = puzzle;
  if ((w !== undefined && (!Number.isInteger(w) || w < 2)) || (h !== undefined && (!Number.isInteger(h) || h < 2))) {
    return { ok: false, errors: ['grid must be at least 2x2'] };
  }
  return { ok: true, errors: [], puzzle };
}

export function puzzleSnapshot(puzzle) {
  if (!puzzle) return null;
  return {
    id: puzzle.id, typeId: puzzle.typeId, engine: puzzle.engine, difficulty: puzzle.difficulty,
    seed: puzzle.seed, moves: puzzle.moves, state: clone(puzzle.state),
  };
}

export function applyPuzzleSnapshot(puzzle, snapshot) {
  if (!puzzle || !snapshot || snapshot.id !== puzzle.id) return puzzle;
  return { ...puzzle, state: clone(snapshot.state), moves: Number(snapshot.moves) || puzzle.moves };
}

export function encodePuzzleState(puzzle) {
  try { return JSON.stringify(puzzleSnapshot(puzzle)); } catch { return ''; }
}

export function decodePuzzleState(text) {
  try {
    const parsed = JSON.parse(text);
    return parsed && parsed.id && parsed.state ? parsed : null;
  } catch { return null; }
}

/** Co-op: deterministic reducer shared by host and guest. */
export function applyRemotePuzzleMove(puzzle, move) {
  return applyPuzzleMove(puzzle, move);
}

/** The next move in the recorded solution, from the current move count. */
export function puzzleBossTimer(stage) {
  if (!stage?.boss) return 0;
  return Math.max(1, Math.round(Number(stage.timeLimit) || PUZZLE_BOSS_TIME_LIMIT));
}

export function formatPuzzleTime(seconds) {
  const safe = Math.max(0, Math.ceil(Number(seconds) || 0));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

export function puzzleNextMove(puzzle) {
  const solution = Array.isArray(puzzle?.solution) ? puzzle.solution : [];
  if (!solution.length) return null;
  const index = Math.max(0, Math.min(solution.length - 1, Math.round(Number(puzzle.moves) || 0)));
  return solution[index];
}

/** Human-readable hint that costs currency in the UI. */
export function puzzleHintText(puzzle) {
  const move = puzzleNextMove(puzzle);
  if (!move) return 'Tidak ada langkah tersisa — mekanisme ini sudah selaras.';
  if (puzzle.engine === 'path') {
    return `Langkah berikutnya: petak (${Number(move.cell?.[0]) + 1}, ${Number(move.cell?.[1]) + 1}).`;
  }
  if (puzzle.engine === 'pipes') {
    return `Putar pipa #${Number(move.rotate) + 1} sebanyak ${((Number(move.turns) || 1) + 4) % 4 || 1} kali.`;
  }
  if (puzzle.engine === 'beam') {
    return `Putar cermin #${Number(move.rotate) + 1} sebanyak ${((Number(move.turns) || 1) + 4) % 4 || 1} kali.`;
  }
  if (puzzle.engine === 'image') {
    return `Tukar petak ${Number(move.a) + 1} dengan petak ${Number(move.b) + 1}.`;
  }
  if (puzzle.engine === 'swap') {
    return `Geser balok di posisi ${Number(move.a) + 1} ke posisi ${Number(move.b) + 1}.`;
  }
  if (puzzle.engine === 'sequence') {
    return `Tukar rune posisi ${Number(move.a) + 1} dengan posisi ${Number(move.b) + 1}.`;
  }
  if (puzzle.engine === 'gear') return `Putar roda gigi #${Number(move.index) + 1}.`;
  if (puzzle.engine === 'toggle') return `Tekan sakelar #${Number(move.index) + 1}.`;
  return 'Ikuti jalur solusi kuno satu langkah lagi.';
}

/**
 * Spends campaign currency for one hint. Pure: returns the new balance and
 * progress; the caller persists both. Insufficient funds never mutate state.
 */
export function payPuzzleHint(rawProgress, echoes, stageId, cost = PUZZLE_HINT_COST) {
  const price = Math.max(1, Math.round(Number(cost) || PUZZLE_HINT_COST));
  const balance = Math.max(0, Math.floor(Number(echoes) || 0));
  const progress = sanitizePuzzleProgress(rawProgress);
  if (balance < price) {
    return { ok: false, reason: 'insufficient', cost: price, echoes: balance, progress };
  }
  progress.stats.hints += 1;
  if (stageId && PUZZLE_STAGE_BY_ID[stageId]) {
    progress.hints[stageId] = Math.min(20, (progress.hints[stageId] || 0) + 1);
  }
  return { ok: true, reason: 'paid', cost: price, echoes: balance - price, progress };
}

export function defaultPuzzleProgress() {
  return {
    version: PUZZLE_PROGRESS_VERSION,
    stage: 0,
    solved: [],
    abilities: [],
    bosses: [],
    hints: {},
    best: { moves: {}, time: 0 },
    stats: { attempts: 0, solved: 0, hints: 0, bosses: 0, deaths: 0, timeouts: 0 },
  };
}

export function sanitizePuzzleProgress(raw) {
  const base = defaultPuzzleProgress();
  if (!raw || typeof raw !== 'object') return base;
  const stageIds = new Set(PUZZLE_STAGES.map((stage) => stage.id));
  const claimed = new Set(Array.isArray(raw.solved) ? raw.solved.filter((id) => stageIds.has(id)) : []);
  // Only a contiguous chain counts, so forged saves cannot skip puzzles.
  base.solved = [];
  for (const stage of PUZZLE_STAGES) {
    if (!claimed.has(stage.id)) break;
    base.solved.push(stage.id);
  }
  base.stage = Math.min(PUZZLE_STAGES.length, base.solved.length);
  base.abilities = PUZZLE_ABILITIES
    .filter((ability) => base.solved.includes(PUZZLE_STAGES[ability.stage - 1]?.id))
    .map((ability) => ability.id);
  const bossStages = Object.fromEntries(PUZZLE_STAGES.filter((stage) => stage.boss).map((stage) => [stage.boss, stage.id]));
  base.bosses = Array.isArray(raw.bosses)
    ? [...new Set(raw.bosses.filter((id) => PUZZLE_BOSS_BY_ID[id] && base.solved.includes(bossStages[id])))]
    : [];
  base.hints = {};
  if (raw.hints && typeof raw.hints === 'object') {
    for (const stage of PUZZLE_STAGES) {
      const value = Number(raw.hints[stage.id]);
      if (Number.isFinite(value) && value > 0) base.hints[stage.id] = Math.min(20, Math.round(value));
    }
  }
  const best = raw.best && typeof raw.best === 'object' ? raw.best : {};
  base.best = {
    moves: best.moves && typeof best.moves === 'object' ? { ...best.moves } : {},
    time: Math.max(0, Math.round(Number(best.time) || 0)),
  };
  for (const key of Object.keys(base.stats)) {
    const value = Number(raw.stats?.[key]);
    base.stats[key] = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }
  for (const [key, value] of Object.entries(raw)) if (!(key in base)) base[key] = value;
  return base;
}

export function puzzleStageUnlocked(progress, index) {
  if (!Number.isInteger(index) || index < 0 || index >= PUZZLE_STAGES.length) return false;
  if (index === 0) return true;
  return (progress?.solved || []).includes(PUZZLE_STAGES[index - 1].id);
}

export function recordPuzzleSolve(rawProgress, stageId, summary = {}) {
  const progress = sanitizePuzzleProgress(rawProgress);
  const stage = PUZZLE_STAGE_BY_ID[stageId];
  if (!stage || !puzzleStageUnlocked(progress, stage.index)) return { progress, firstClear: false, stage };
  const firstClear = !progress.solved.includes(stageId);
  if (firstClear) {
    progress.solved.push(stageId);
    progress.solved.sort((a, b) => PUZZLE_STAGE_BY_ID[a].index - PUZZLE_STAGE_BY_ID[b].index);
    progress.stage = Math.min(PUZZLE_STAGES.length, progress.solved.length);
    progress.stats.solved += 1;
    if (stage.ability && !progress.abilities.includes(stage.ability)) progress.abilities.push(stage.ability);
  }
  const moves = Math.max(0, Math.round(Number(summary.moves) || 0));
  if (moves) progress.best.moves[stageId] = progress.best.moves[stageId] ? Math.min(progress.best.moves[stageId], moves) : moves;
  return { progress, firstClear, stage, ability: stage.ability ? PUZZLE_ABILITY_BY_ID[stage.ability] : null };
}

export function recordPuzzleBoss(rawProgress, bossId) {
  const progress = sanitizePuzzleProgress(rawProgress);
  const stage = PUZZLE_STAGES.find((entry) => entry.boss === bossId);
  const boss = PUZZLE_BOSS_BY_ID[bossId];
  if (!stage || !progress.solved.includes(stage.id)) return { progress, firstClear: false };
  if (!boss || progress.bosses.includes(bossId)) return { progress, firstClear: false };
  progress.bosses.push(bossId);
  progress.stats.bosses += 1;
  return { progress, firstClear: true, boss };
}

export function generateStagePuzzle(stageIndex, seed = 'ashen') {
  const stage = PUZZLE_STAGES[Math.max(0, Math.min(PUZZLE_STAGES.length - 1, Math.round(Number(stageIndex) || 0)))];
  if (!stage) return null;
  const puzzle = generatePuzzle(stage.typeId, stage.difficulty, `${seed}|${stage.id}`);
  return { ...puzzle, stageId: stage.id, stageName: stage.name, location: stage.location };
}

export function puzzleSummary(progress) {
  return {
    stages: PUZZLE_STAGES.length,
    arcs: PUZZLE_ARC_COUNT,
    solved: progress.solved.length,
    percent: Math.round((progress.solved.length / PUZZLE_STAGES.length) * 100),
    abilities: progress.abilities.length,
    abilityTotal: PUZZLE_ABILITIES.length,
    bosses: progress.bosses.length,
    next: PUZZLE_STAGES.find((stage) => !progress.solved.includes(stage.id)) || null,
    types: PUZZLE_TYPES.length,
  };
}
