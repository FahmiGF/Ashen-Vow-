// Ashen Vow v0.3.0 — Echoes of the Forgotten World.
// Pure data + deterministic generators. This module imports nothing so core.js,
// main.js and render.js can all consume it without creating import cycles.

export const EXPANSION_VERSION = '0.3.0';
export const EXPANSION_ROOM_START = 14;
export const LEVELS_PER_CHAPTER = 10;
export const TOTAL_LEVELS = 100;
export const EXPANSION_NAME = 'Echoes of the Forgotten World';

const FLOOR_Y = 470;
const WORLD_W = 1400;

// ── difficulty & challenge modifiers ────────────────────────────────────────
export const DIFFICULTIES = [
  {
    id: 'story',
    name: 'Cerita',
    subtitle: 'Story',
    desc: 'Musuh lebih lambat dan memaafkan. Fokus pada cerita dan eksplorasi.',
    enemyHp: 0.72,
    enemyDmg: 0.68,
    enemySpeed: 0.9,
    bossHp: 0.78,
    bossDmg: 0.8,
    extraPhase: false,
    reward: 0.85,
  },
  {
    id: 'normal',
    name: 'Normal',
    subtitle: 'Normal',
    desc: 'Pengalaman yang disarankan. Kurva kesulitan asli kampanye.',
    enemyHp: 1,
    enemyDmg: 1,
    enemySpeed: 1,
    bossHp: 1,
    bossDmg: 1,
    extraPhase: false,
    reward: 1,
  },
  {
    id: 'veteran',
    name: 'Veteran',
    subtitle: 'Veteran',
    desc: 'Musuh lebih agresif dan tahan lama. Timing dan posisi menjadi penting.',
    enemyHp: 1.28,
    enemyDmg: 1.16,
    enemySpeed: 1.05,
    bossHp: 1.16,
    bossDmg: 1.12,
    extraPhase: false,
    reward: 1.2,
  },
  {
    id: 'nightmare',
    name: 'Mimpi Buruk',
    subtitle: 'Nightmare',
    desc: 'Elite bermunculan, boss mendapat pola tambahan, dan kesalahan dihukum berat.',
    enemyHp: 1.62,
    enemyDmg: 1.38,
    enemySpeed: 1.12,
    bossHp: 1.42,
    bossDmg: 1.3,
    extraPhase: true,
    reward: 1.5,
  },
  {
    id: 'ashen_master',
    name: 'Master Abu',
    subtitle: 'Ashen Master',
    desc: 'Tantangan puncak. Semua sistem menuntut penguasaan penuh.',
    enemyHp: 2,
    enemyDmg: 1.62,
    enemySpeed: 1.2,
    bossHp: 1.8,
    bossDmg: 1.55,
    extraPhase: true,
    reward: 2,
  },
];

export const DIFFICULTY_BY_ID = Object.fromEntries(DIFFICULTIES.map((d) => [d.id, d]));

export const CHALLENGE_MODIFIERS = [
  {
    id: 'iron_skin',
    name: 'Kulit Besi',
    desc: 'Max HP -25%, tetapi setiap boss memberi +1 Gema.',
    glyph: '⛨',
    hp: 0.75,
    echo: 1.2,
  },
  {
    id: 'glass_blade',
    name: 'Bilah Kaca',
    desc: 'Damage +35%, tetapi satu pukulan berat bisa mematikan.',
    glyph: '⚔',
    dmg: 1.35,
    incoming: 1.35,
    echo: 1.25,
  },
  {
    id: 'famine',
    name: 'Paceklik',
    desc: 'Flask berkurang satu. Tidak ada penyembuhan di checkpoint.',
    glyph: '◒',
    flasks: -1,
    echo: 1.3,
  },
  {
    id: 'hunter',
    name: 'Buruan',
    desc: 'Musuh tambahan berpatroli, tetapi hadiah Abu +25%.',
    glyph: '➶',
    extraEnemies: 2,
    ash: 1.25,
    echo: 1.15,
  },
  {
    id: 'fragile',
    name: 'Rapuh',
    desc: 'Tidak bisa memakai Sigil. Damage +20%.',
    glyph: '◇',
    noSigils: true,
    dmg: 1.2,
    echo: 1.4,
  },
  {
    id: 'blind',
    name: 'Buta Kabut',
    desc: 'Pandangan terbatas oleh kabut. Gema +50%.',
    glyph: '☁',
    fog: true,
    echo: 1.5,
  },
];

export const MODIFIER_BY_ID = Object.fromEntries(CHALLENGE_MODIFIERS.map((m) => [m.id, m]));

// ── biomes ──────────────────────────────────────────────────────────────────
export const BIOMES = {
  ashenwood: {
    id: 'ashenwood',
    name: 'Hutan Abu',
    subtitle: 'Ashen Woods',
    accent: '#d07a35',
    music: 'ashenwood',
    particle: 'ash',
    weather: 'Hujan abu hangat',
    condition: 'Angin membawa abu dari utara.',
    palette: { top: '#0c0907', mid: '#1e140d', low: '#2e1c11', glow: '#d07a35', fog: '#3a2617' },
    parallax: 'forest',
  },
  bonemarsh: {
    id: 'bonemarsh',
    name: 'Rawa Tulang',
    subtitle: 'Bone Marsh',
    accent: '#8fae6a',
    music: 'bonemarsh',
    particle: 'mist',
    weather: 'Kabut rawa',
    condition: 'Air rawa naik perlahan.',
    palette: { top: '#070b08', mid: '#111b12', low: '#1b2a1a', glow: '#8fae6a', fog: '#263b26' },
    parallax: 'marsh',
  },
  echocrater: {
    id: 'echocrater',
    name: 'Kawah Gema',
    subtitle: 'Echo Crater',
    accent: '#e0553b',
    music: 'echocrater',
    particle: 'embers',
    weather: 'Hujan bara',
    condition: 'Tanah bergetar setiap sepuluh detik.',
    palette: { top: '#120503', mid: '#2a0b05', low: '#41130a', glow: '#ff7a3c', fog: '#5a1f0e' },
    parallax: 'crater',
  },
  buriedcity: {
    id: 'buriedcity',
    name: 'Kota Terkubur',
    subtitle: 'Buried City',
    accent: '#c9a25c',
    music: 'buriedcity',
    particle: 'dust',
    weather: 'Debu reruntuhan',
    condition: 'Lonceng tua berbunyi tanpa penabuh.',
    palette: { top: '#0b0906', mid: '#1c1710', low: '#2c2418', glow: '#c9a25c', fog: '#3c3222' },
    parallax: 'city',
  },
  crystalcave: {
    id: 'crystalcave',
    name: 'Gua Kristal',
    subtitle: 'Crystal Caverns',
    accent: '#7fc9e8',
    music: 'crystalcave',
    particle: 'shards',
    weather: 'Cahaya berdenyut',
    condition: 'Kristal bernyanyi saat kau mendekat.',
    palette: { top: '#050b12', mid: '#0c1b29', low: '#142d40', glow: '#9fdcff', fog: '#1d4058' },
    parallax: 'crystal',
  },
  stormexpanse: {
    id: 'stormexpanse',
    name: 'Padang Badai',
    subtitle: 'Storm Expanse',
    accent: '#6fa8dc',
    music: 'stormexpanse',
    particle: 'rain',
    weather: 'Badai petir',
    condition: 'Petir menyambar setiap puncak menara.',
    palette: { top: '#050810', mid: '#0d1524', low: '#172238', glow: '#6fa8dc', fog: '#22334d' },
    parallax: 'storm',
  },
  roottemple: {
    id: 'roottemple',
    name: 'Kuil Akar',
    subtitle: 'Root Temple',
    accent: '#a86bd8',
    music: 'roottemple',
    particle: 'spores',
    weather: 'Hujan spora',
    condition: 'Akar bernapas bersama tanah.',
    palette: { top: '#0d0614', mid: '#1d0f2b', low: '#2a1640', glow: '#b07be8', fog: '#38224f' },
    parallax: 'roots',
  },
  mistsea: {
    id: 'mistsea',
    name: 'Lautan Kabut',
    subtitle: 'Mist Sea',
    accent: '#8ba8a0',
    music: 'mistsea',
    particle: 'mist',
    weather: 'Kabut asin',
    condition: 'Ombak menghapus jejak di pasir.',
    palette: { top: '#070b0b', mid: '#111a1a', low: '#1c2928', glow: '#8ba8a0', fog: '#2a3b39' },
    parallax: 'sea',
  },
  clockwork: {
    id: 'clockwork',
    name: 'Menara Waktu',
    subtitle: 'Clockwork Spire',
    accent: '#d6ac66',
    music: 'clockwork',
    particle: 'gears',
    weather: 'Debu waktu',
    condition: 'Detik terasa lebih panjang di sini.',
    palette: { top: '#0c0906', mid: '#1f180d', low: '#332714', glow: '#d6ac66', fog: '#44361e' },
    parallax: 'clockwork',
  },
  forgotten: {
    id: 'forgotten',
    name: 'Singgasana Terlupakan',
    subtitle: 'Forgotten Throne',
    accent: '#e8b46a',
    music: 'forgotten',
    particle: 'stars',
    weather: 'Cahaya tanpa matahari',
    condition: 'Nama-nama berbisik dari dinding.',
    palette: { top: '#0b0704', mid: '#1d130b', low: '#2f1e0f', glow: '#e8b46a', fog: '#432c16' },
    parallax: 'throne',
  },
};

export const BIOME_LIST = Object.values(BIOMES);

// ── chapters ────────────────────────────────────────────────────────────────
export const CHAPTERS = [
  {
    id: 'ch1', index: 0, numeral: 'I', name: 'Hutan Abu', subtitle: 'Ashen Woods', biome: 'ashenwood',
    accent: '#d07a35', glyph: '✠', unlockAfter: null,
    tagline: 'Akar yang terbakar masih mengingat nama para pemburu.',
    desc: 'Kampanye dimulai di hutan yang tidak pernah benar-benar mati. Abu menutupi jalan, dan sesuatu di bawah akar mulai bergerak.',
  },
  {
    id: 'ch2', index: 1, numeral: 'II', name: 'Rawa Tulang', subtitle: 'Bone Marsh', biome: 'bonemarsh',
    accent: '#8fae6a', glyph: '☠', unlockAfter: 0,
    tagline: 'Air mengenang setiap tubuh yang pernah tenggelam.',
    desc: 'Rawa menelan kota-kota lama. Tulang-tulangnya bangkit, dan kabut menyimpan suara mereka yang tidak sempat pulang.',
  },
  {
    id: 'ch3', index: 2, numeral: 'III', name: 'Kawah Gema', subtitle: 'Echo Crater', biome: 'echocrater',
    accent: '#e0553b', glyph: '✹', unlockAfter: 1,
    tagline: 'Setiap pukulan membangunkan sesuatu yang lebih tua dari api.',
    desc: 'Kawah pertama tempat sumpah ditempa. Panasnya masih hidup, dan gema palu para penempa terdengar di setiap lorong.',
  },
  {
    id: 'ch4', index: 3, numeral: 'IV', name: 'Kota Terkubur', subtitle: 'Buried City', biome: 'buriedcity',
    accent: '#c9a25c', glyph: '♜', unlockAfter: 2,
    tagline: 'Kota yang tidak pernah menyerah pada malam.',
    desc: 'Di bawah lapisan abu berdiri kota dengan menara yang masih utuh. Penduduknya telah lama pergi, tetapi upacara mereka belum berakhir.',
  },
  {
    id: 'ch5', index: 4, numeral: 'V', name: 'Gua Kristal', subtitle: 'Crystal Caverns', biome: 'crystalcave',
    accent: '#7fc9e8', glyph: '◈', unlockAfter: 3,
    tagline: 'Cahaya di bawah tanah menyimpan wajah yang kau kenal.',
    desc: 'Kristal-kristal ini tidak memantulkan cahaya. Mereka memantulkan kenangan. Setiap pecahan menunjukkan jalan yang tidak pernah kau ambil.',
  },
  {
    id: 'ch6', index: 5, numeral: 'VI', name: 'Padang Badai', subtitle: 'Storm Expanse', biome: 'stormexpanse',
    accent: '#6fa8dc', glyph: '⚡', unlockAfter: 4,
    tagline: 'Langit memilih siapa yang boleh lewat.',
    desc: 'Badai abadi mengelilingi menara penangkal petir. Di antara kilat, pasukan yang telah lama hilang masih berbaris menuju perang yang sudah usai.',
  },
  {
    id: 'ch7', index: 6, numeral: 'VII', name: 'Kuil Akar', subtitle: 'Root Temple', biome: 'roottemple',
    accent: '#a86bd8', glyph: '❋', unlockAfter: 5,
    tagline: 'Akar pertama tidak tumbuh dari tanah. Ia tumbuh dari sumpah.',
    desc: 'Kuil yang menopang dunia dari bawah. Setiap akar adalah janji, dan setiap janji menuntut sesuatu untuk tetap hidup.',
  },
  {
    id: 'ch8', index: 7, numeral: 'VIII', name: 'Lautan Kabut', subtitle: 'Mist Sea', biome: 'mistsea',
    accent: '#8ba8a0', glyph: '≋', unlockAfter: 6,
    tagline: 'Laut menyimpan kapal-kapal yang tidak pernah berlabuh.',
    desc: 'Kabut menutupi lautan tanpa horizon. Di bawahnya, kota-kota tenggelam masih menyala, dan sesuatu memanggil dari palung.',
  },
  {
    id: 'ch9', index: 8, numeral: 'IX', name: 'Menara Waktu', subtitle: 'Clockwork Spire', biome: 'clockwork',
    accent: '#d6ac66', glyph: '⌛', unlockAfter: 7,
    tagline: 'Setiap detik yang kau habiskan di sini adalah pinjaman.',
    desc: 'Menara jam raksasa yang menghitung mundur menuju akhir dunia. Para penjaga waktunya tidak ingin jam berhenti.',
  },
  {
    id: 'ch10', index: 9, numeral: 'X', name: 'Singgasana Terlupakan', subtitle: 'Forgotten Throne', biome: 'forgotten',
    accent: '#e8b46a', glyph: '✺', unlockAfter: 8,
    tagline: 'Di ujung semua jalan, hanya nama yang tersisa.',
    desc: 'Singgasana tempat sumpah pertama diucapkan. Di sini, dunia yang terlupakan menunggu untuk mengingat dirinya sendiri.',
  },
];

export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));

// ── 100 level names ─────────────────────────────────────────────────────────
export const CHAPTER_LEVELS = [
  [
    ['Gerbang Hutan', 'Woodland Gate'],
    ['Jalur Pemburu', "Hunter's Trail"],
    ['Bukit Tanduk', 'Antler Ridge'],
    ['Kemah Terbakar', 'Burnt Camp'],
    ['Lembah Bisikan', 'Whispering Vale'],
    ['Kuil Tumbang', 'Fallen Shrine'],
    ['Jantung Hutan', 'Heart of the Wood'],
    ['Rawa Cermin', 'Mirror Fen'],
    ['Penjaga Tanduk', 'The Antler Warden'],
    ['Raja Ranting', 'The Branch King'],
  ],
  [
    ['Tepi Rawa', "Marsh's Edge"],
    ['Jembatan Bangkai', 'Carrion Bridge'],
    ['Kuburan Tergenang', 'Sunken Graveyard'],
    ['Sarang Lintah', 'Leech Nest'],
    ['Api Rawa', 'Marshfire'],
    ['Menara Tulang', 'Ossuary Spire'],
    ['Rahim Lumpur', 'Mire Womb'],
    ['Kabut Berbisik', 'Whispering Fog'],
    ['Ibu Lintah', 'The Leech Mother'],
    ['Penguasa Rawa', 'The Bog Sovereign'],
  ],
  [
    ['Bibir Kawah', "Crater's Lip"],
    ['Lembah Belerang', 'Sulphur Valley'],
    ['Terowongan Panas', 'Heat Tunnels'],
    ['Pabrik Terkubur', 'Buried Foundry'],
    ['Danau Lava', 'Lake of Embers'],
    ['Menara Asap', 'Smoke Spire'],
    ['Jantung Kawah', 'Crater Heart'],
    ['Angin Membara', 'Burning Winds'],
    ['Penempa Gila', 'The Mad Smith'],
    ['Gema Pertama', 'The First Echo'],
  ],
  [
    ['Gerbang Kota', 'City Gates'],
    ['Pasar Sunyi', 'Silent Market'],
    ['Menara Lonceng Tua', 'Old Bell Tower'],
    ['Saluran Bawah', 'Undercity'],
    ['Balai Dewan', 'Council Hall'],
    ['Penjara Batu', 'Stone Gaol'],
    ['Taman Raja', "King's Garden"],
    ['Lorong Cermin', 'Mirror Hall'],
    ['Wali Kota', 'The Burgomaster'],
    ['Mahkota Terkubur', 'The Buried Crown'],
  ],
  [
    ['Mulut Kristal', 'Crystal Mouth'],
    ['Aula Kilau', 'Hall of Glimmer'],
    ['Sumur Gema', 'Echo Well'],
    ['Jembatan Prisma', 'Prism Bridge'],
    ['Sarang Kelelawar', 'Bat Roost'],
    ['Kuil Bening', 'Glass Temple'],
    ['Jantung Kristal', 'Crystal Heart'],
    ['Labirin Cahaya', 'Light Maze'],
    ['Penjaga Prisma', 'The Prism Sentinel'],
    ['Ratu Bening', 'The Glass Queen'],
  ],
  [
    ['Perbatasan Badai', 'Storm Frontier'],
    ['Padang Petir', 'Lightning Fields'],
    ['Menara Penangkal', 'Lightning Rod'],
    ['Kamp Pengungsi', 'Refugee Camp'],
    ['Awan Hitam', 'Black Clouds'],
    ['Reruntuhan Langit', 'Sky Ruins'],
    ['Mata Badai', 'Eye of the Storm'],
    ['Angin Kencang', 'Gale Crossing'],
    ['Pemburu Petir', 'The Storm Hunter'],
    ['Penguasa Badai', 'The Tempest Lord'],
  ],
  [
    ['Tangga Akar', 'Root Stair'],
    ['Aula Sulur', 'Hall of Vines'],
    ['Sumur Getah', 'Sap Well'],
    ['Penjara Hijau', 'Green Prison'],
    ['Taman Beracun', 'Poison Garden'],
    ['Altar Tumbuh', 'Growing Altar'],
    ['Jantung Akar', 'Root Heart'],
    ['Siklus Hidup', 'Life Cycle'],
    ['Penjaga Sulur', 'The Vine Warden'],
    ['Ibu Akar', 'The Root Mother'],
  ],
  [
    ['Dermaga Hilang', 'Lost Docks'],
    ['Kapal Hantu', 'Ghost Ship'],
    ['Pulau Tulang', 'Bone Isle'],
    ['Mercusuar Mati', 'Dead Lighthouse'],
    ['Palung Sunyi', 'Silent Trench'],
    ['Kota Bawah Laut', 'Sunken City'],
    ['Pusaran Abadi', 'Eternal Maelstrom'],
    ['Kabut Pekat', 'Deep Fog'],
    ['Laksamana Bangkai', 'The Wreck Admiral'],
    ['Penguasa Kabut', 'The Mist Sovereign'],
  ],
  [
    ['Gerbang Roda Gigi', 'Gear Gate'],
    ['Lorong Jam', 'Hour Corridor'],
    ['Bengkel Waktu', 'Time Workshop'],
    ['Pendulum Raksasa', 'Giant Pendulum'],
    ['Arsip Tak Berujung', 'Endless Archive'],
    ['Menara Detik', 'Spire of Seconds'],
    ['Jantung Mesin', 'Machine Heart'],
    ['Paradoks', 'Paradox'],
    ['Penjaga Jam', 'The Clockwarden'],
    ['Dewa Waktu', 'The Time God'],
  ],
  [
    ['Jalan Terakhir', 'The Last Road'],
    ['Gerbang Terlupakan', 'Forgotten Gate'],
    ['Aula Nama', 'Hall of Names'],
    ['Api Pertama', 'The First Flame'],
    ['Bayangan Sumpah', 'Shadow of the Vow'],
    ['Tahta Kosong', 'The Empty Throne'],
    ['Ruang Tanpa Waktu', 'Timeless Chamber'],
    ['Cermin Jiwa', 'Soul Mirror'],
    ['Penjaga Terakhir', 'The Last Keeper'],
    ['Yang Terlupakan', 'The Forgotten One'],
  ],
];

// ── enemy archetypes and 100 base types ─────────────────────────────────────
export const ENEMY_BEHAVIORS = {
  chaser: {
    name: 'Pemburu',
    desc: 'Mendekat tanpa henti dan menyerang dari jarak dekat.',
    hp: 34, dmg: 1, speed: 82, w: 46, h: 34, reward: 1,
  },
  lunge: {
    name: 'Penerjang',
    desc: 'Menandai sasaran lalu melesat dengan serangan lurus.',
    hp: 54, dmg: 1.35, speed: 86, w: 44, h: 52, reward: 1.25,
  },
  ranged: {
    name: 'Penyihir',
    desc: 'Menjaga jarak dan melepas proyektil dari udara.',
    hp: 42, dmg: 1.1, speed: 68, w: 40, h: 56, reward: 1.3,
  },
  slam: {
    name: 'Penghancur',
    desc: 'Lambat tetapi setiap hentakan mengguncang tanah.',
    hp: 96, dmg: 1.6, speed: 62, w: 64, h: 62, reward: 1.6,
  },
  burrower: {
    name: 'Penggali',
    desc: 'Menyelam ke tanah dan muncul tepat di bawah kaki.',
    hp: 64, dmg: 1.3, speed: 104, w: 48, h: 44, reward: 1.45,
  },
  spawner: {
    name: 'Induk',
    desc: 'Menetas tanpa henti selama masih bernapas.',
    hp: 124, dmg: 1.1, speed: 42, w: 70, h: 58, reward: 1.7,
  },
  hopper: {
    name: 'Pelompat',
    desc: 'Bergerak dengan lompatan cepat dan sulit ditebak.',
    hp: 30, dmg: 0.9, speed: 94, w: 36, h: 30, reward: 0.9,
  },
};

const BEHAVIOR_CYCLE = ['chaser', 'lunge', 'ranged', 'slam', 'burrower', 'spawner', 'hopper', 'chaser', 'slam', 'ranged'];

const CHAPTER_ENEMY_NAMES = [
  ['Perayap Lumut', 'Anjing Abu', 'Pengintai Tanduk', 'Pemukul Ranting', 'Kupu Belati', 'Penggali Akar', 'Ratu Sarang', 'Pelompat Daun', 'Lembu Hutan', 'Bisikan Ranting'],
  ['Lintah Rawa', 'Bangkai Berjalan', 'Penyihir Lumpur', 'Penjaga Kubur', 'Lalat Busuk', 'Cacing Penggali', 'Induk Sarang', 'Katak Raksasa', 'Kadal Tiris', 'Bisikan Air'],
  ['Hound Bara', 'Tukang Ketuk', 'Golem Terak', 'Peniup Asap', 'Kelelawar Api', 'Penggali Magma', 'Induk Slag', 'Pelompat Bara', 'Raksasa Tungku', 'Bisikan Panas'],
  ['Warga Sunyi', 'Penjaga Gerbang', 'Lonceng Berjalan', 'Tikus Got', 'Pemangsa Pasar', 'Penggali Kubur', 'Induk Kanal', 'Pelompat Atap', 'Golem Batu', 'Bisikan Kota'],
  ['Kelelawar Prisma', 'Penjaga Kilau', 'Golem Kristal', 'Penyanyi Kaca', 'Serpihan Hidup', 'Penggali Bening', 'Induk Prisma', 'Pelompat Kilau', 'Raksasa Kristal', 'Bisikan Cermin'],
  ['Anjing Petir', 'Penjaga Badai', 'Golem Awan', 'Peniup Angin', 'Burung Petir', 'Penggali Langit', 'Induk Awan', 'Pelompat Kilat', 'Raksasa Guntur', 'Bisikan Badai'],
  ['Sulur Hidup', 'Penjaga Akar', 'Golem Getah', 'Peniup Spora', 'Kupu Racun', 'Penggali Akar', 'Induk Sulur', 'Pelompat Daun', 'Raksasa Akar', 'Bisikan Hijau'],
  ['Bangkai Pelaut', 'Penjaga Dermaga', 'Golem Karang', 'Penyanyi Kabut', 'Ubur Hantu', 'Penggali Palung', 'Induk Kabut', 'Pelompat Ombak', 'Raksasa Laut', 'Bisikan Ombak'],
  ['Roda Hidup', 'Penjaga Jam', 'Golem Gigi', 'Penyanyi Detik', 'Serpihan Waktu', 'Penggali Lorong', 'Induk Mesin', 'Pelompat Detik', 'Raksasa Jam', 'Bisikan Waktu'],
  ['Bayangan Sumpah', 'Penjaga Nama', 'Golem Terlupakan', 'Penyanyi Terakhir', 'Serpihan Jiwa', 'Penggali Kenangan', 'Induk Bayangan', 'Pelompat Abu', 'Raksasa Terakhir', 'Bisikan Kekosongan'],
];

const hashString = (value) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const titleCase = (value) => value.replace(/\b\w/g, (c) => c.toUpperCase());

export const EXPANSION_ENEMY_TYPES = [];
for (let chapter = 0; chapter < CHAPTERS.length; chapter++) {
  const names = CHAPTER_ENEMY_NAMES[chapter];
  for (let i = 0; i < names.length; i++) {
    const behavior = BEHAVIOR_CYCLE[i];
    const arch = ENEMY_BEHAVIORS[behavior];
    const typeId = `echo_${chapter + 1}_${i + 1}`;
    const hpScale = 1 + chapter * 0.3;
    const dmgScale = 1 + chapter * 0.26;
    EXPANSION_ENEMY_TYPES.push({
      id: typeId,
      name: names[i],
      title: `${titleCase(behavior)} · Bab ${chapter + 1}`,
      chapter,
      chapterIndex: chapter,
      biome: CHAPTERS[chapter].biome,
      behavior,
      hp: Math.round(arch.hp * hpScale),
      dmg: Math.round((6 + chapter * 2.2) * arch.dmg),
      speed: Math.round(arch.speed * (1 + chapter * 0.018)),
      w: arch.w,
      h: arch.h,
      reward: Math.round((7 + chapter * 3.2) * arch.reward),
      flying: behavior === 'ranged',
      danger: chapter < 3 ? 'RENDAH' : chapter < 6 ? 'SEDANG' : chapter < 8 ? 'TINGGI' : 'EKSTREM',
      desc: `${arch.desc} Makhluk dari ${CHAPTERS[chapter].name}, diperkuat oleh gema yang bocor dari Singgasana.`,
      where: `${CHAPTERS[chapter].name} · Bab ${chapter + 1}`,
      glyph: ['◈', '➶', '◌', '⬢', '⌇', '♛', '❋'][BEHAVIOR_CYCLE.indexOf(behavior)] || '◈',
    });
  }
}

export const EXPANSION_ENEMY_INFO = Object.fromEntries(
  EXPANSION_ENEMY_TYPES.map((type) => [type.id, type]),
);

export const ENEMY_VARIANTS = [
  { id: 'young', name: 'Muda', hp: 0.8, dmg: 0.8, speed: 0.92, reward: 0.8 },
  { id: 'mature', name: 'Dewasa', hp: 1, dmg: 1, speed: 1, reward: 1 },
  { id: 'elder', name: 'Tua', hp: 1.45, dmg: 1.3, speed: 1.06, reward: 1.65 },
];

export const EXPANSION_ENEMY_VARIANTS = EXPANSION_ENEMY_TYPES.flatMap((type) =>
  ENEMY_VARIANTS.map((variant) => ({
    id: `${type.id}_${variant.id}`,
    baseId: type.id,
    baseName: type.name,
    name: `${type.name} ${variant.name}`,
    chapter: type.chapter,
    behavior: type.behavior,
    hp: Math.round(type.hp * variant.hp),
    dmg: Math.round(type.dmg * variant.dmg),
    speed: Math.round(type.speed * variant.speed),
    reward: Math.round(type.reward * variant.reward),
    variant: variant.id,
  })),
);

// ── 20 mini-bosses ──────────────────────────────────────────────────────────
const MINI_BOSS_SOURCE = [
  ['Penjaga Tanduk', 'The Antler Warden', 'slam', 'Kau menebang hutan ini dengan langkahmu sendiri.', 'Tandukku tumbuh kembali dari setiap pohon yang kau tebang.', 'Akhirnya... hutan bisa bernapas...'],
  ['Sesepuh Ranting', 'The Elder Branch', 'ring', 'Ranting tua tidak patah. Ia menunggu.', 'Setiap akar di hutan ini adalah lenganku.', 'Patah... tetapi tidak tumbang...'],
  ['Ibu Lintah', 'The Leech Mother', 'summon', 'Darahmu hangat. Rawa sudah lama kedinginan.', 'Anak-anakku lapar. Beri mereka satu tegukan.', 'Rawa... akan mengingatmu...'],
  ['Penguasa Lumpur', 'The Mire Tyrant', 'slam', 'Tanah ini milik yang bertahan lebih lama darimu.', 'Tenggelamlah bersama kota-kota yang lupa.', 'Lumpur... menutup mataku...'],
  ['Penempa Gila', 'The Mad Smith', 'charge', 'Aku menempa senjata dari tulang dewa. Kau hanya besi bekas.', 'Palu ini belum pernah berhenti. Jangan harap sekarang.', 'Ah... akhirnya... istirahat...'],
  ['Roh Tungku', 'The Furnace Spirit', 'rain', 'Api pertama tidak pernah padam. Ia hanya berpindah.', 'Tubuhmu akan menjadi bahan bakar yang baik.', 'Bara... kembali ke bara...'],
  ['Wali Kota', 'The Burgomaster', 'summon', 'Kota ini masih hidup. Kau hanya tidak diundang.', 'Para warga, bangkitlah! Kita punya tamu.', 'Kota... tidak boleh melihatku kalah...'],
  ['Lonceng Berjalan', 'The Walking Bell', 'ring', 'Setiap dentang adalah nama yang kau lupakan.', 'Dengarkan. Mereka memanggilmu dari bawah tanah.', 'Sunyi... akhirnya sunyi...'],
  ['Penjaga Prisma', 'The Prism Sentinel', 'volley', 'Cahaya tidak berbohong. Kau yang menyembunyikan bayangan.', 'Setiap pecahanku menunjukkan satu kematianmu.', 'Cahaya... memudar...'],
  ['Penyanyi Kaca', 'The Glass Cantor', 'ring', 'Suaraku memecahkan yang tidak mau mendengar.', 'Kaca di dadamu retak sejak lama. Aku hanya mempercepatnya.', 'Nada terakhir... milikku...'],
  ['Pemburu Petir', 'The Storm Hunter', 'charge', 'Badai menunjuk sasaran. Aku hanya mengeksekusi.', 'Kilat tidak pernah meleset. Aku juga.', 'Langit... memanggilku pulang...'],
  ['Kapten Awan', 'The Cloud Captain', 'volley', 'Pasukan badai tidak mengenal kata mundur.', 'Kau akan hanyut bersama awan hitam.', 'Formasi... bubar...'],
  ['Penjaga Sulur', 'The Vine Warden', 'slam', 'Akar pertama menopang dunia. Kau tidak akan memotongnya.', 'Setiap luka menumbuhkan sulur baru.', 'Tanah... berterima kasih...'],
  ['Ratu Racun', 'The Poison Queen', 'rain', 'Taman ini cantik. Itu yang membuatnya berbahaya.', 'Satu kelopak di darahmu sudah cukup.', 'Bunga... bermekaran...'],
  ['Laksamana Bangkai', 'The Wreck Admiral', 'volley', 'Laut tidak pernah kehilangan awaknya. Ia hanya menunggu.', 'Kapal-kapalku bangkit dari palung.', 'Pelabuhan... akhirnya...'],
  ['Pendeta Palung', 'The Trench Priest', 'summon', 'Di bawah ombak, semua dosa dicuci.', 'Naiklah, anak-anak palung. Sambut tamu kita.', 'Ombak... menutup mataku...'],
  ['Penjaga Jam', 'The Clockwarden', 'charge', 'Setiap detikmu sudah dihitung. Tidak ada sisa.', 'Aku mempercepat jarum. Kau memperlambat langkah.', 'Waktu... berhenti...'],
  ['Arsiparis', 'The Archivist', 'rain', 'Namamu tidak ada di arsip. Itu membuatmu berbahaya.', 'Aku mencatat setiap kemungkinan kematianmu.', 'Halaman... terakhir...'],
  ['Penjaga Terakhir', 'The Last Keeper', 'slam', 'Aku menjaga pintu ini sejak sebelum namamu ada.', 'Tidak ada yang lewat. Tidak ada yang pulang.', 'Pintu... terbuka...'],
  ['Cermin Sumpah', 'The Vow Mirror', 'ring', 'Kau melihat dirimu di mataku. Itu bukan dirimu.', 'Setiap janji yang kau ingkar, kupakai sebagai senjata.', 'Cermin... retak...'],
];

export const MINI_BOSSES = MINI_BOSS_SOURCE.map(([name, title, pattern, taunt, phaseLine, defeatLine], i) => {
  const chapter = Math.floor(i / 2);
  const hp = 260 + chapter * 72 + (i % 2) * 60;
  return {
    id: `mini_${chapter + 1}_${i % 2 === 0 ? 'a' : 'b'}`,
    kind: `mini_${chapter + 1}_${i % 2 === 0 ? 'a' : 'b'}`,
    name,
    title,
    chapter,
    pattern,
    maxHp: hp,
    w: 72 + (i % 3) * 8,
    h: 88 + (i % 2) * 14,
    contact: 10 + chapter,
    ashReward: 38 + chapter * 10,
    echoReward: 18 + chapter * 6,
    reward: 'blessing',
    maxPhases: 2,
    phaseThresholds: [0.5],
    spawn: { x: 760, y: FLOOR_Y - (88 + (i % 2) * 14) },
    dialogue: {
      intro: [
        { speaker: name, text: taunt },
        { speaker: 'The Oathbound', text: 'Aku sudah mendengar janji seperti itu.' },
      ],
      phase2: [{ speaker: name, text: phaseLine }],
      defeat: [
        { speaker: name, text: defeatLine },
        { speaker: 'The Oathbound', text: 'Jalanmu berakhir di sini.' },
      ],
    },
    mini: true,
    glyph: ['⛨', '✹', '◈', '♛', '⌛', '☠'][chapter % 6],
  };
});

// ── 10 major chapter bosses ─────────────────────────────────────────────────
const CHAPTER_BOSS_SOURCE = [
  ['Raja Ranting', 'The Branch King', 'slam', 'Aku adalah mahkota yang tumbuh dari setiap kapak.', 'Rantingku menembus tanah. Kau tidak punya tempat berpijak.', 'Hutan... akan tumbuh... tanpa kita...', 'Aku menebang jalan menuju singgasanamu.'],
  ['Penguasa Rawa', 'The Bog Sovereign', 'summon', 'Rawa tidak menelan. Ia mengingat.', 'Bangkitlah, semua yang pernah kubawa.', 'Air... akhirnya... tenang...', 'Kau bukan raja pertama yang tenggelam di sini.'],
  ['Gema Pertama', 'The First Echo', 'ring', 'Sebelum api, sebelum sumpah, ada suaraku.', 'Dengarkan dirimu sendiri. Itu yang akan membunuhmu.', 'Gema... kembali... sunyi...', 'Aku datang untuk mengakhiri gema.'],
  ['Mahkota Terkubur', 'The Buried Crown', 'volley', 'Kota ini mengubur rajanya, bukan mahkotanya.', 'Setiap lonceng memanggil satu pasukan.', 'Mahkota... lepas... akhirnya...', 'Kekuasaanmu sudah lama mati.'],
  ['Ratu Bening', 'The Glass Queen', 'rain', 'Kau memantul di mataku. Apakah kau nyata?', 'Pecahan ini adalah semua versi dirimu yang gagal.', 'Kaca... tidak bisa... menangis...', 'Aku memilih diriku sendiri.'],
  ['Penguasa Badai', 'The Tempest Lord', 'charge', 'Langit adalah tahtaku. Kau hanya debu yang terbang.', 'Badai tidak pernah tidur. Aku juga.', 'Kilat... padam...', 'Badai ini berakhir di sini.'],
  ['Ibu Akar', 'The Root Mother', 'summon', 'Setiap pohon adalah anakku. Setiap kapak adalah luka.', 'Akar-akarku akan menumbuhkan kembali dunia.', 'Tanah... berterima kasih...', 'Aku tidak akan membiarkan akar menelan dunia.'],
  ['Penguasa Kabut', 'The Mist Sovereign', 'ring', 'Kabut tidak menyembunyikan apa pun. Kau yang menutup mata.', 'Tenggelamlah. Laut sudah lama menunggumu.', 'Kabut... menipis...', 'Aku akan menjadi mercusuar.'],
  ['Dewa Waktu', 'The Time God', 'rain', 'Aku melihat akhirmu. Kau datang terlambat.', 'Setiap detik yang kau pakai adalah milikku.', 'Waktu... tidak bisa... berhenti...', 'Masa depan bukan milikmu.'],
  ['Yang Terlupakan', 'The Forgotten One', 'ring', 'Aku adalah nama yang kau hapus dari doamu.', 'Ingatlah semua yang kau korbankan. Mereka menunggumu.', 'Akhirnya... aku... diingat...', 'Aku mengingatmu. Itu cukup.'],
];

export const CHAPTER_BOSSES = CHAPTER_BOSS_SOURCE.map(([name, title, pattern, taunt, phaseLine, defeatLine, oathLine], i) => {
  const final = i === CHAPTER_BOSS_SOURCE.length - 1;
  const hp = 520 + i * 95;
  return {
    id: `echo_boss_${i + 1}`,
    kind: `echo_boss_${i + 1}`,
    name,
    title,
    chapter: i,
    pattern,
    maxHp: hp,
    w: 92 + (i % 3) * 10,
    h: 112 + (i % 2) * 16,
    contact: 12 + i,
    ashReward: 80 + i * 22,
    echoReward: 40 + i * 12,
    reward: final ? 'victory' : 'blessing',
    maxPhases: final ? 3 : 2,
    phaseThresholds: final ? [0.64, 0.3] : [0.5],
    spawn: { x: 760, y: FLOOR_Y - (112 + (i % 2) * 16) },
    dialogue: {
      intro: [
        { speaker: name, text: taunt },
        { speaker: 'The Oathbound', text: oathLine },
      ],
      phase2: [{ speaker: name, text: phaseLine }],
      phase3: final
        ? [{ speaker: name, text: 'Kau masih berdiri. Maka aku akan menunjukkan semua yang kau lupakan.' }]
        : [],
      defeat: [
        { speaker: name, text: defeatLine },
        { speaker: 'The Oathbound', text: final ? 'Aku mengingatmu. Itu cukup.' : 'Aku akan membawa namamu pulang.' },
      ],
    },
    major: true,
    glyph: ['♛', '☠', '✹', '♜', '◈', '⚡', '❋', '≋', '⌛', '✺'][i],
  };
});

export const EXPANSION_BOSS_INFO = Object.fromEntries(
  [...MINI_BOSSES, ...CHAPTER_BOSSES].map((boss) => [boss.kind, boss]),
);

export const ALL_BOSS_IDS = [...MINI_BOSSES.map((b) => b.kind), ...CHAPTER_BOSSES.map((b) => b.kind)];

// ── 12 collectible categories ───────────────────────────────────────────────
export const COLLECTIBLE_CATEGORIES = [
  { id: 'relics', name: 'Relik Lembah', glyph: '✦', color: '#d07a35', items: ['Pecahan Altar', 'Cincin Pemburu', 'Gigi Pertama', 'Bulu Kepala', 'Lempeng Sumpah', 'Palu Kecil', 'Cermin Retak', 'Benang Merah', 'Tulang Belikat', 'Mahkota Duri'] },
  { id: 'songs', name: 'Nyanyian Batu', glyph: '♪', color: '#c9a25c', items: ['Nyanyian Fajar', 'Ratapan Hujan', 'Lagu Perang', 'Bisikan Akar', 'Kidung Ombak', 'Nyanyian Bayi', 'Seruan Badai', 'Lagu Tidur', 'Ratapan Raja', 'Nyanyian Terakhir'] },
  { id: 'pelts', name: 'Kulit Binatang', glyph: '❧', color: '#8fae6a', items: ['Kulit Serigala', 'Bulu Burung Petir', 'Sisik Rawa', 'Cangkang Kristal', 'Kulit Lintah', 'Bulu Awan', 'Kulit Ular', 'Sirip Palung', 'Kulit Rusa', 'Bulu Malam'] },
  { id: 'tablets', name: 'Prasasti Kuno', glyph: '▤', color: '#b7a486', items: ['Prasasti Gerbang', 'Batu Sumpah', 'Catatan Penempa', 'Surat Kota', 'Lempeng Jam', 'Prasasti Laut', 'Batu Nama', 'Catatan Akar', 'Prasasti Bintang', 'Batu Terakhir'] },
  { id: 'seeds', name: 'Benih Ajaib', glyph: '❋', color: '#a86bd8', items: ['Benih Api', 'Benih Rawa', 'Benih Kristal', 'Benih Badai', 'Benih Akar', 'Benih Kabut', 'Benih Waktu', 'Benih Bintang', 'Benih Abu', 'Benih Terakhir'] },
  { id: 'crystals', name: 'Kristal Gema', glyph: '◈', color: '#7fc9e8', items: ['Gema Merah', 'Gema Hijau', 'Gema Biru', 'Gema Ungu', 'Gema Putih', 'Gema Hitam', 'Gema Emas', 'Gema Perak', 'Gema Kosong', 'Gema Pertama'] },
  { id: 'letters', name: 'Surat Hilang', glyph: '✉', color: '#e9dcc2', items: ['Surat Ibu', 'Surat Kekasih', 'Surat Raja', 'Surat Anak', 'Surat Nelayan', 'Surat Penjaga', 'Surat Penempa', 'Surat Terakhir', 'Surat Tanpa Nama', 'Surat Untukmu'] },
  { id: 'masks', name: 'Topeng Upacara', glyph: '◒', color: '#c084e0', items: ['Topeng Rusa', 'Topeng Lintah', 'Topeng Api', 'Topeng Lonceng', 'Topeng Kaca', 'Topeng Badai', 'Topeng Akar', 'Topeng Ombak', 'Topeng Jam', 'Topeng Kosong'] },
  { id: 'shards', name: 'Senjata Patah', glyph: '⚔', color: '#9fb0bd', items: ['Bilah Ranting', 'Tombak Rawa', 'Palu Tungku', 'Pedang Kota', 'Belati Prisma', 'Tombak Petir', 'Sabit Akar', 'Trisula Laut', 'Jarum Jam', 'Bilah Terakhir'] },
  { id: 'toys', name: 'Permainan Anak', glyph: '◍', color: '#e0b45f', items: ['Bola Kayu', 'Boneka Jerami', 'Kelereng Kaca', 'Layang Abu', 'Gasing Tembaga', 'Kubus Kristal', 'Perahu Kertas', 'Lonceng Kecil', 'Roda Gigi Mainan', 'Bintang Kertas'] },
  { id: 'recipes', name: 'Resep Hilang', glyph: '♨', color: '#d08a45', items: ['Resep Tonik', 'Resep Bom', 'Resep Roti', 'Resep Teh Akar', 'Resep Salep', 'Resep Panah', 'Resep Peluru', 'Resep Kue', 'Resep Obat', 'Resep Terakhir'] },
  { id: 'starlight', name: 'Cahaya Bintang', glyph: '✧', color: '#ffe2a8', items: ['Debu Bintang', 'Percikan Fajar', 'Nyala Senja', 'Bara Utara', 'Cahaya Selatan', 'Kilau Timur', 'Redup Barat', 'Bintang Jatuh', 'Konstelasi Hilang', 'Cahaya Terakhir'] },
];

export const COLLECTIBLE_BY_ID = Object.fromEntries(
  COLLECTIBLE_CATEGORIES.flatMap((category) =>
    category.items.map((name, index) => [
      `${category.id}_${index + 1}`,
      { id: `${category.id}_${index + 1}`, name, category: category.id, categoryName: category.name, glyph: category.glyph, color: category.color, index },
    ]),
  ),
);

// ── special-level environments ──────────────────────────────────────────────
const CHAPTER_HAZARDS = [
  { type: 'wind', name: 'Angin Hutan', force: -105, glyph: '≋' },
  { type: 'fog', name: 'Kabut Rawa', density: 0.5, glyph: '☁' },
  { type: 'geyser', name: 'Semburan Bara', period: 3.1, dmg: 16, glyph: '✹' },
  { type: 'saw', name: 'Lonceng Berputar', range: 420, speed: 130, dmg: 18, glyph: '⚙' },
  { type: 'beam', name: 'Berkas Prisma', period: 3.6, dmg: 20, glyph: '◈' },
  { type: 'wind', name: 'Angin Badai', force: 145, glyph: '⚡' },
  { type: 'spore', name: 'Awan Racun', period: 4.2, dmg: 10, glyph: '❋' },
  { type: 'fog', name: 'Kabut Pekat', density: 0.72, glyph: '☁' },
  { type: 'saw', name: 'Pendulum Waktu', range: 520, speed: 180, dmg: 22, glyph: '⌛' },
  { type: 'void', name: 'Kekosongan', period: 4.8, dmg: 14, glyph: '✺' },
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function floorLayout(pattern) {
  if (pattern === 1) {
    return {
      platforms: [
        { x: 0, y: 470, w: 500, h: 70 },
        { x: 760, y: 470, w: 640, h: 70 },
        { x: 520, y: 402, w: 210, h: 18 },
        { x: 300, y: 330, w: 170, h: 18 },
        { x: 950, y: 342, w: 190, h: 18 },
      ],
      ground: [{ min: 40, max: 470 }, { min: 800, max: 1350 }],
    };
  }
  if (pattern === 2) {
    return {
      platforms: [
        { x: 0, y: 470, w: 620, h: 70 },
        { x: 860, y: 470, w: 540, h: 70 },
        { x: 640, y: 400, w: 200, h: 18 },
        { x: 430, y: 314, w: 180, h: 18 },
        { x: 1080, y: 348, w: 180, h: 18 },
      ],
      ground: [{ min: 40, max: 590 }, { min: 900, max: 1350 }],
    };
  }
  if (pattern === 3) {
    return {
      platforms: [
        { x: 0, y: 470, w: 1400, h: 70 },
        { x: 220, y: 372, w: 200, h: 18 },
        { x: 560, y: 286, w: 210, h: 18 },
        { x: 930, y: 350, w: 220, h: 18 },
      ],
      ground: [{ min: 40, max: 1350 }],
    };
  }
  return {
    platforms: [
      { x: 0, y: 470, w: 1400, h: 70 },
      { x: 300, y: 378, w: 190, h: 18 },
      { x: 650, y: 318, w: 190, h: 18 },
      { x: 1000, y: 386, w: 180, h: 18 },
    ],
    ground: [{ min: 40, max: 1350 }],
  };
}

function buildHazards(chapter, levelIndex, kind) {
  if (kind !== 'special' && kind !== 'elite' && !(kind === 'boss' && chapter.index >= 5)) return [];
  const source = CHAPTER_HAZARDS[chapter.index];
  const hazards = [];
  if (source.type === 'wind') {
    hazards.push({ ...source, x: 260, y: 150, w: 760, h: 330 });
  } else if (source.type === 'fog') {
    hazards.push({ ...source, x: 0, y: 0, w: WORLD_W, h: 540 });
  } else if (source.type === 'geyser') {
    hazards.push({ ...source, x: 420, y: 360, w: 70, h: 110, phase: 0.4 });
    hazards.push({ ...source, x: 880, y: 360, w: 70, h: 110, phase: 2.1 });
  } else if (source.type === 'saw') {
    hazards.push({ ...source, x: 560, y: 410, w: 48, h: 48, originX: 560 });
  } else if (source.type === 'beam') {
    hazards.push({ ...source, x: 680, y: 0, w: 34, h: 470, phase: 0.6 });
    hazards.push({ ...source, x: 1040, y: 0, w: 34, h: 470, phase: 2.2 });
  } else if (source.type === 'spore') {
    hazards.push({ ...source, x: 520, y: 340, w: 360, h: 120, phase: 0.8 });
  } else if (source.type === 'void') {
    hazards.push({ ...source, x: 480, y: 0, w: 420, h: 470, phase: 1.2 });
  }
  if (kind === 'boss' && chapter.index >= 5) {
    hazards.push({ type: 'void', name: 'Retakan Kosong', x: 120, y: 400, w: 80, h: 70, period: 5.4, dmg: 10, glyph: '✺' });
  }
  return hazards;
}

function buildEnemies(chapter, levelIndex, kind, layout, rand) {
  if (kind === 'boss') return [];
  const types = EXPANSION_ENEMY_TYPES.filter((type) => type.chapter === chapter.index);
  const count = kind === 'elite' ? 2 : kind === 'special' ? 3 : 3 + Math.min(3, Math.floor(chapter.index / 3)) + (levelIndex % 2);
  const enemies = [];
  for (let i = 0; i < count; i++) {
    const ground = layout.ground[i % layout.ground.length];
    const span = ground.max - ground.min;
    const x = Math.round(ground.min + 60 + ((i * 173 + levelIndex * 97 + chapter.index * 53) % Math.max(120, span - 120)));
    const type = types[(i + levelIndex + chapter.index) % types.length];
    const variant = chapter.index >= 6 && i === 0 ? 'elder' : chapter.index >= 3 && i === 1 ? 'mature' : 'young';
    enemies.push({
      type: type.id,
      variant,
      x,
      minX: ground.min,
      maxX: ground.max,
    });
  }
  return enemies;
}

function buildCollectible(chapter, levelIndex, globalIndex, layout) {
  const category = COLLECTIBLE_CATEGORIES[(chapter.index * 2 + (levelIndex >= 5 ? 1 : 0)) % COLLECTIBLE_CATEGORIES.length];
  const itemIndex = (levelIndex + chapter.index) % category.items.length;
  const id = `${category.id}_${itemIndex + 1}`;
  const platform = layout.platforms[1 + (levelIndex % Math.max(1, layout.platforms.length - 1))];
  return {
    id,
    name: category.items[itemIndex],
    category: category.id,
    categoryName: category.name,
    glyph: category.glyph,
    color: category.color,
    x: (platform?.x || 500) + (platform?.w || 160) / 2 - 14,
    y: (platform?.y || 330) - 46,
    w: 28,
    h: 28,
  };
}

export const EXPANSION_LEVELS = [];
for (let chapterIndex = 0; chapterIndex < CHAPTERS.length; chapterIndex++) {
  const chapter = CHAPTERS[chapterIndex];
  const biome = BIOMES[chapter.biome];
  for (let levelIndex = 0; levelIndex < LEVELS_PER_CHAPTER; levelIndex++) {
    const [name, subtitle] = CHAPTER_LEVELS[chapterIndex][levelIndex];
    const kind = levelIndex === 9 ? 'boss' : levelIndex === 8 ? 'elite' : levelIndex === 7 ? 'special' : 'standard';
    const globalIndex = EXPANSION_ROOM_START + chapterIndex * LEVELS_PER_CHAPTER + levelIndex;
    const rand = seeded(hashString(`echo-${chapterIndex}-${levelIndex}`));
    const layout = floorLayout((chapterIndex + levelIndex) % 4);
    const nextGlobal = globalIndex + 1 < EXPANSION_ROOM_START + TOTAL_LEVELS ? globalIndex + 1 : null;
    const nextName = nextGlobal == null ? null : CHAPTER_LEVELS[Math.floor((nextGlobal - EXPANSION_ROOM_START) / 10)][(nextGlobal - EXPANSION_ROOM_START) % 10][0];
    const miniIndex = chapterIndex * 2 + (kind === 'elite' ? 1 : 0);
    const boss = kind === 'special' || kind === 'elite'
      ? MINI_BOSSES[miniIndex].kind
      : kind === 'boss'
        ? CHAPTER_BOSSES[chapterIndex].kind
        : null;
    const gate = globalIndex === EXPANSION_ROOM_START + TOTAL_LEVELS - 1
      ? null
      : {
          x: 1362, y: 286, w: 34, h: 184,
          requires: boss ? 'boss' : 'clear',
          next: nextGlobal,
          name: nextName,
        };
    const hazards = buildHazards(chapter, levelIndex, kind);
    const collectible = buildCollectible(chapter, levelIndex, globalIndex, layout);
    const hintBase = kind === 'boss'
      ? `${CHAPTER_BOSSES[chapterIndex].name} menunggu di ujung ${name}.`
      : kind === 'elite'
        ? `${MINI_BOSSES[miniIndex].name} menjaga jalan. Lingkungan ${biome.name.toLowerCase()} memperburuk pertarungan.`
        : kind === 'special'
          ? `${hazards[0]?.name || 'Gema'} mengubah medan. Kumpulkan ${collectible.name} sebelum melanjutkan.`
          : `${biome.condition} Jalan menuju ${nextName || 'ujung dunia'} terbuka setelah ruang dibersihkan.`;
    EXPANSION_LEVELS.push({
      id: globalIndex,
      globalIndex,
      localIndex: chapterIndex * LEVELS_PER_CHAPTER + levelIndex,
      chapterIndex,
      chapterLevel: levelIndex + 1,
      chapter: chapter.id,
      chapterName: chapter.name,
      kind,
      name,
      subtitle,
      accent: chapter.accent,
      biome: biome.id,
      biomeName: biome.name,
      zone: biome.id,
      music: biome.music,
      bossMusic: 'boss',
      palette: { ...biome.palette },
      weather: biome.weather,
      condition: biome.condition,
      parallax: biome.parallax,
      particle: biome.particle,
      spawn: { x: 90, y: FLOOR_Y - 46 },
      checkpoint: levelIndex === 0 || levelIndex === 5 || kind === 'boss'
        ? { x: 64, y: FLOOR_Y - 78, w: 38, h: 78, name: `Api Unggun ${chapter.name}` }
        : null,
      merchant: levelIndex === 0
        ? { x: 154, y: FLOOR_Y - 96, w: 46, h: 96 }
        : null,
      platforms: layout.platforms,
      enemies: buildEnemies(chapter, levelIndex, kind, layout, rand),
      relic: null,
      boss,
      gate,
      hazards,
      collectibles: [collectible],
      hint: hintBase,
      echoReward: 8 + chapterIndex * 4 + (kind === 'boss' ? 30 : kind === 'elite' ? 14 : kind === 'special' ? 10 : 0),
      ashReward: 12 + chapterIndex * 8,
      environment: kind === 'special' ? hazards[0]?.name || 'Gema Lingkungan' : null,
      chapterNumeral: ROMAN[chapterIndex],
    });
  }
}

export const EXPANSION_ROOMS = EXPANSION_LEVELS;

export function expansionLevelByIndex(index) {
  return EXPANSION_LEVELS.find((level) => level.globalIndex === index) || null;
}

export function expansionLevelsForChapter(chapterIndex) {
  return EXPANSION_LEVELS.filter((level) => level.chapterIndex === chapterIndex);
}

// ── settlements and 52 NPCs ─────────────────────────────────────────────────
export const HAVEN_UPGRADES = [
  { id: 'forge', name: 'Pandai Besi', glyph: '⚒', npc: 'bram', maxTier: 3, costs: [40, 90, 160], desc: 'Menajamkan bilah dan pelat. Damage +8% per tingkat.', effects: ['Damage +8%', 'Damage +16%', 'Damage +28%'], stat: 'damage', values: [0.08, 0.16, 0.28] },
  { id: 'infirmary', name: 'Rumah Penyembuh', glyph: '✚', npc: 'wulan', maxTier: 3, costs: [40, 90, 160], desc: 'Merawat luka di antara perjalanan. Max HP +15 per tingkat.', effects: ['Max HP +15', 'Max HP +30', 'Max HP +45'], stat: 'maxHp', values: [15, 30, 45] },
  { id: 'shrine', name: 'Kuil Api', glyph: '✹', npc: 'wulan', maxTier: 3, costs: [55, 120, 210], desc: 'Menambah charge flask permanen untuk setiap run.', effects: ['+1 Flask', '+2 Flask', '+3 Flask'], stat: 'flasks', values: [1, 2, 3] },
  { id: 'watchtower', name: 'Menara Pengawas', glyph: '⌖', npc: 'bayu', maxTier: 3, costs: [45, 100, 180], desc: 'Menandai jalur aman. Abu dan Gema +10% per tingkat.', effects: ['Abu +10%', 'Abu +20%', 'Abu +30%'], stat: 'gain', values: [0.1, 0.2, 0.3] },
  { id: 'garden', name: 'Taman Obat', glyph: '❋', npc: 'sinta', maxTier: 3, costs: [35, 80, 150], desc: 'Menumbuhkan ramuan. Penyembuhan flask +8 per tingkat.', effects: ['Heal +8', 'Heal +16', 'Heal +24'], stat: 'heal', values: [8, 16, 24] },
  { id: 'hall', name: 'Balai Cerita', glyph: '▤', npc: 'rani', maxTier: 3, costs: [50, 110, 190], desc: 'Menyimpan kisah dan hadiah. Gema +10% per tingkat.', effects: ['Gema +10%', 'Gema +20%', 'Gema +30%'], stat: 'echo', values: [0.1, 0.2, 0.3] },
  { id: 'gate', name: 'Gerbang Duri', glyph: '⛩', npc: 'nara', maxTier: 3, costs: [60, 130, 220], desc: 'Membuka jalan pintas ke bab yang sudah kau tuntaskan.', effects: ['Buka Bab II', 'Buka Bab IV', 'Buka Bab VI'], stat: 'travel', values: [1, 3, 5] },
  { id: 'totem', name: 'Totem Leluhur', glyph: '⍟', npc: 'sari', maxTier: 3, costs: [70, 150, 260], desc: 'Memanggil berkah leluhur di New Game Plus.', effects: ['NG+ +1 Berkah', 'NG+ +2 Berkah', 'NG+ +3 Berkah'], stat: 'ng', values: [1, 2, 3] },
];

export const UPGRADE_BY_ID = Object.fromEntries(HAVEN_UPGRADES.map((u) => [u.id, u]));

export const HAVEN_NPCS = [
  {
    id: 'sari', name: 'Nyai Sari', role: 'Kepala Suku Thornveil', glyph: '☾', chapterReq: 0,
    desc: 'Pemimpin suku yang menolak tunduk pada mahkota. Ia melihat gema di matamu sebelum kau menyebutnya.',
    lines: [
      'Thornveil berdiri karena tidak ada yang sudi menunduk. Kau boleh tinggal, tetapi jangan bawa perang ke sini.',
      'Setiap bab yang kau tuntaskan menumbuhkan satu duri baru di gerbang kami. Itu tanda kau masih hidup.',
      'Yang Terlupakan bukan dewa. Ia hanya nama yang terlalu lama tidak diucapkan.',
    ],
    questId: 'q_first_vow', upgradeId: 'totem',
  },
  {
    id: 'bram', name: 'Bram', role: 'Pandai Besi', glyph: '⚒', chapterReq: 0,
    desc: 'Mantan penempa pasukan Opus. Ia meninggalkan kota karena tidak tahan menempa pedang untuk raja yang sudah mati.',
    lines: [
      'Bawa pulang besi dari kota terkubur, dan aku akan membuat bilah yang tidak akan kau sesali.',
      'Dapur tempa ini bukan untuk hiasan. Setiap tingkat membuat pukulanmu lebih berat.',
      'Aku pernah menempa mahkota. Sekarang aku lebih suka menempa mata bajak.',
    ],
    questId: 'q_forge', upgradeId: 'forge',
  },
  {
    id: 'wulan', name: 'Ibu Wulan', role: 'Penjaga Api', glyph: '✚', chapterReq: 0,
    desc: 'Perempuan tua yang menjaga api suku tetap hidup selama tiga puluh tahun. Tangannya tahu cara menutup luka.',
    lines: [
      'Api tidak menyembuhkan. Ia hanya memberi waktu untuk sembuh.',
      'Kau membawa terlalu banyak luka untuk seseorang yang baru pulang. Duduklah.',
      'Jika flask-mu habis, jangan malu kembali. Malu adalah luka yang tidak bisa kujahit.',
    ],
    questId: null, upgradeId: 'infirmary',
  },
  {
    id: 'jaka', name: 'Jaka', role: 'Pemburu', glyph: '➶', chapterReq: 0,
    desc: 'Pemburu muda yang mengenal setiap jejak di Hutan Abu. Ia percaya setiap mini-boss menyimpan nama yang hilang.',
    lines: [
      'Jejak di rawa itu bukan milik hewan. Terlalu banyak kaki.',
      'Bunuh penjaga-penjaga kecil itu. Mereka menyimpan nama yang dicuri dari desa kami.',
      'Kalau kau menemukan kulit aneh, bawa ke Rani. Ia bisa membaca cerita dari bulu.',
    ],
    questId: 'q_hunt', upgradeId: null,
  },
  {
    id: 'rani', name: 'Rani', role: 'Penenun', glyph: '✧', chapterReq: 0,
    desc: 'Penenun yang merawat pakaian dan topeng upacara. Setiap kain di balainya adalah kenangan seseorang.',
    lines: [
      'Warna tidak pernah bohong. Kau memakai abu karena kau belum memilih warna lain.',
      'Kain ini ditenun dari rambut para leluhur. Jangan tanya bagaimana caranya.',
      'Bawa kulit dan benang dari perjalananmu. Aku akan membuat sesuatu yang layak dikenang.',
    ],
    questId: 'q_weave', upgradeId: 'hall',
  },
  {
    id: 'kakek', name: 'Kakek Tua', role: 'Penjaga Cerita', glyph: '▤', chapterReq: 0,
    desc: 'Tidak ada yang tahu namanya. Ia duduk di dekat api dan mencatat semua yang didengar dari para pelancong.',
    lines: [
      'Kau ingin tahu kenapa dunia terlupakan? Duduk. Ceritanya lebih panjang dari umurmu.',
      'Setiap prasasti yang kau bawa adalah satu halaman dari buku yang hilang.',
      'Jangan percaya semua yang tertulis. Batu juga bisa berbohong jika dipahat oleh pemenang.',
    ],
    questId: 'q_names', upgradeId: null,
  },
  {
    id: 'sinta', name: 'Sinta', role: 'Pedagang', glyph: '◈', chapterReq: 0,
    desc: 'Pedagang yang menjual apa saja, dari panah sampai cerita palsu. Ia tidak pernah menanyakan asal barang.',
    lines: [
      'Abu tidak cukup untuk membeli masa depan. Tapi cukup untuk membeli satu malam lagi.',
      'Aku punya ramuan, panah, dan beberapa kebenaran yang mungkin palsu. Pilih sendiri.',
      'Kalau kau menemukan resep hilang, bawa ke sini. Aku akan menukarnya dengan sesuatu yang berguna.',
    ],
    questId: 'q_garden', upgradeId: 'garden',
  },
  {
    id: 'bayu', name: 'Bayu', role: 'Pelatih', glyph: '⚔', chapterReq: 0,
    desc: 'Pelatih tempur yang kehilangan tangan kirinya di Puncak Sumpah. Ia mengajar dengan satu tangan dan satu sumpah.',
    lines: [
      'Kau boleh menang melawan boss. Tapi bisakah kau menang tanpa flask?',
      'Tantangan berulang bukan hukuman. Itu cara tubuh mengingat apa yang pikiran lupakan.',
      'Kembalilah dengan luka baru. Aku akan mengajarimu cara tidak mengulanginya.',
    ],
    questId: 'q_trials', upgradeId: 'watchtower',
  },
  {
    id: 'nara', name: 'Nara', role: 'Penjaga Gerbang', glyph: '⛩', chapterReq: 0,
    desc: 'Penjaga gerbang Thornveil. Ia mencatat setiap orang yang masuk dan tidak pernah mencatat siapa yang keluar.',
    lines: [
      'Gerbang ini tidak menahan musuh. Ia menahan mereka yang ingin melupakan.',
      'Bab yang sudah kau tuntaskan tidak akan hilang. Aku bisa membukakan jalan kembali.',
      'Jika kau membawa nama Yang Terlupakan, jangan ucapkan di depan gerbang. Dinding punya telinga.',
    ],
    questId: 'q_gate', upgradeId: 'gate',
  },
  {
    id: 'asih', name: 'Asih', role: 'Anak Hilang', glyph: '◍', chapterReq: 0,
    desc: 'Anak yang ditemukan di reruntuhan kota. Ia tidak bicara banyak, tetapi menggambar semua yang ia lihat.',
    lines: [
      'Aku menggambar kota yang selalu terbakar. Apakah itu kenangan atau mimpi?',
      'Kau menemukan mainan? Aku pernah punya boneka jerami. Ayah membuatnya.',
      'Kalau kau menemukan jalan pulang, jangan pergi tanpa bilang.',
    ],
    questId: 'q_lost', upgradeId: null,
  },
];

const OUTPOST_NPC_SOURCE = [
  ['emberwatch', [
    ['Kapten Bara', 'Kapten Pos', '⚔', 'Penjaga terakhir jalur kawah. Ia tidak pernah melepas pelatnya.'],
    ['Mira', 'Tabib Pos', '✚', 'Menyembuhkan luka bakar dengan ramuan bau getah.'],
    ['Tomo', 'Pengintai', '➶', 'Mengawasi semburan bara dari menara kayu.'],
    ['Sari Kecil', 'Kurir', '✉', 'Membawa pesan antara pos dan Thornveil.'],
    ['Guru Eka', 'Penempa Magma', '⚒', 'Membuat pelat tahan panas dari terak kawah.'],
    ['Pak Darto', 'Juru Masak', '♨', 'Menyajikan sup yang konon bisa menahan panas.'],
  ]],
  ['marshroot', [
    ['Dukun Lestari', 'Penjaga Rawa', '❋', 'Membaca arah angin dari bau lumpur.'],
    ['Bram Kecil', 'Pemburu Lintah', '➶', 'Ahli melacak lintah raksasa di air keruh.'],
    ['Ibu Ratna', 'Penjual Ramuan', '◈', 'Menjual penawar racun dengan harga yang tidak masuk akal.'],
    ['Joko', 'Pengangkut', '▤', 'Mengangkut barang lewat jalur perahu yang hampir tenggelam.'],
    ['Sari', 'Penjaga Kubur', '☠', 'Menjaga agar tulang-tulang tidak bangkit lagi.'],
    ['Anak Kembar', 'Penggali', '⌇', 'Dua anak yang selalu menggali di tempat yang salah.'],
  ]],
  ['sunkenmarket', [
    ['Bangsawan Tua', 'Wali Pasar', '♜', 'Mengklaim masih memiliki kota, meski kota sudah terkubur.'],
    ['Lina', 'Penjual Topeng', '◒', 'Menjual topeng upacara yang katanya membawa keberuntungan.'],
    ['Pak Hasan', 'Pembuat Roti', '♨', 'Roti batu yang bisa dimakan jika direndam air.'],
    ['Raka', 'Pemandu', '⌖', 'Mengetahui lorong bawah kota yang tidak ada di peta.'],
    ['Nenek Iri', 'Penjaga Lonceng', '♪', 'Menabuh lonceng untuk memanggil orang yang sudah pergi.'],
    ['Bocah Tanpa Nama', 'Pencari Koin', '◍', 'Mengaku menemukan koin dari masa depan.'],
  ]],
  ['crystalenclave', [
    ['Pengrajin Kaca', 'Pemotong Kristal', '◈', 'Memotong kristal menjadi lensa dan jendela.'],
    ['Ibu Bening', 'Penyanyi Gua', '♪', 'Suaranya membuat kristal bergetar dan bercahaya.'],
    ['Penjaga Prisma', 'Penjaga Enklave', '⛨', 'Tidak bicara, hanya menunjuk jalan.'],
    ['Kiki', 'Penambang', '⌇', 'Menambang kristal dengan palu yang terlalu besar.'],
    ['Dokter Sela', 'Tabib Kristal', '✚', 'Mengobati luka dengan pecahan kristal yang dipanaskan.'],
    ['Tuan Opa', 'Kolektor', '✦', 'Mengumpulkan pecahan cermin yang memantulkan masa lalu.'],
  ]],
  ['stormbreak', [
    ['Kapten Awan', 'Pemimpin Suaka', '⚡', 'Mantan perwira badai yang memilih melindungi pengungsi.'],
    ['Nisa', 'Penangkal Petir', '⌖', 'Memasang batang tembaga di setiap atap.'],
    ['Pak Tani', 'Petani Awan', '❋', 'Menanam gandum di tanah yang tidak pernah kering.'],
    ['Rudi', 'Pemburu Petir', '➶', 'Mengumpulkan energi kilat untuk lampu suaka.'],
    ['Ibu Hujan', 'Penjaga Api', '✹', 'Menjaga api tetap menyala di tengah badai.'],
    ['Anak Petir', 'Pengintai', '◍', 'Berlari lebih cepat dari guntur, katanya.'],
  ]],
  ['rootsanctum', [
    ['Pendeta Akar', 'Penjaga Kuil', '❋', 'Merawat akar yang menopang dunia.'],
    ['Guru Getah', 'Pembuat Ramuan', '♨', 'Mengolah getah menjadi obat dan racun.'],
    ['Sulur Muda', 'Pengintai', '➶', 'Bergerak di antara akar tanpa suara.'],
    ['Ibu Tunas', 'Penjaga Benih', '◍', 'Menyimpan benih dari dunia yang belum lahir.'],
    ['Penggali', 'Penjaga Lorong', '⌇', 'Menggali terowongan baru setiap bulan.'],
    ['Kakak Pohon', 'Penenun Akar', '✧', 'Menenun kain dari serat akar paling tua.'],
  ]],
  ['lastharbor', [
    ['Laksamana Muda', 'Pemimpin Pelabuhan', '⚓', 'Menjaga pelabuhan terakhir sebelum lautan kabut.'],
    ['Nelayan Tua', 'Pemandu Ombak', '≋', 'Mengenal arus yang tidak ada di peta.'],
    ['Mira Laut', 'Penjual Ikan', '◈', 'Menjual ikan yang katanya berasal dari bawah bulan.'],
    ['Penjaga Mercusuar', 'Penjaga Cahaya', '✧', 'Menyalakan mercusuar setiap malam tanpa gagal.'],
    ['Anak Kapal', 'Pengangkut', '✉', 'Membawa barang dari kapal ke dermaga.'],
    ['Dokter Ombak', 'Tabib Laut', '✚', 'Mengobati luka akibat air asin dan gigitan palung.'],
  ]],
];

const NPC_ROLE_LINES = {
  'Kapten Pos': ['Jaga baris. Kawah tidak memberi ampun pada yang lengah.'],
  'Tabib Pos': ['Bakar? Minum ini. Kalau kau masih panas besok, kita bicara lagi.'],
  'Pengintai': ['Ada gerakan di bibir kawah. Bukan hewan.'],
  'Kurir': ['Surat dari Thornveil. Nyai Sari ingin kau kembali hidup-hidup.'],
  'Penempa Magma': ['Pelat ini ditempa di dalam aliran lava. Jangan tanya harganya.'],
  'Juru Masak': ['Sup ini bisa melelehkan sendok. Itu tandanya sudah matang.'],
  'Penjaga Rawa': ['Jangan minum air yang beriak tanpa angin.'],
  'Pemburu Lintah': ['Lintah sebesar lengan itu bukan yang paling berbahaya. Yang kecil lebih cepat.'],
  'Penjual Ramuan': ['Penawar racun? Tergantung racunnya. Kalau ragu, beli dua.'],
  'Pengangkut': ['Perahu ini sudah tenggelam tiga kali. Masih bisa jalan.'],
  'Penjaga Kubur': ['Tulang yang kubur tidak selalu diam. Aku jaga yang diam.'],
  'Penggali': ['Kami menggali karena di bawah ada suara.'],
  'Wali Pasar': ['Kota ini masih hidup selama masih ada yang membayar pajak.'],
  'Penjual Topeng': ['Topeng ini membuat kau terlihat seperti orang penting. Atau orang mati.'],
  'Pembuat Roti': ['Rendam dulu. Gigimu bukan batu.'],
  'Pemandu': ['Lorong ini tidak ada di peta karena peta dibuat oleh orang yang takut.'],
  'Penjaga Lonceng': ['Setiap dentang memanggil satu nama. Jangan tanya nama siapa.'],
  'Pencari Koin': ['Koin ini dari besok. Aku menemukannya di bawah jendela.'],
  'Pemotong Kristal': ['Kristal ini memantulkan hal yang belum terjadi. Hati-hati memotongnya.'],
  'Penyanyi Gua': ['Dengarkan. Gua menjawab setiap nyanyian dengan kenangan.'],
  'Penjaga Enklave': ['...'],
  'Penambang': ['Palu ini terlalu besar? Tidak ada palu yang terlalu besar.'],
  'Tabib Kristal': ['Pecahan ini dingin. Rasakan. Dinginnya menyembuhkan.'],
  'Kolektor': ['Cermin ini menunjukkan wajahmu sepuluh tahun lalu. Kau terlihat lebih tua sekarang.'],
  'Pemimpin Suaka': ['Badai tidak pernah berhenti. Kita hanya belajar menari di dalamnya.'],
  'Penangkal Petir': ['Tembaga di atap menarik kilat. Jangan tidur di lantai atas.'],
  'Petani Awan': ['Gandum ini tumbuh dari air hujan. Rasanya seperti langit.'],
  'Pemburu Petir': ['Aku menangkap kilat di botol. Sekali pakai, langsung habis.'],
  'Penjaga Api': ['Api ini tidak boleh mati. Badai akan masuk lewat cerobong.'],
  'Pengintai': ['Awan hitam itu bergerak melawan angin.'],
  'Pendeta Akar': ['Akar tidak meminta iman. Ia hanya meminta kesabaran.'],
  'Pembuat Ramuan': ['Getah ini bisa menyembuhkan atau membunuh. Tergantung dosis.'],
  'Pengintai': ['Sulur di lorong barat bergerak saat kau tidak melihat.'],
  'Penjaga Benih': ['Setiap benih adalah janji pada musim yang belum datang.'],
  'Penjaga Lorong': ['Lorong ini baru. Kemarin masih akar.'],
  'Penenun Akar': ['Kain ini tidak pernah basah. Akar menolak air.'],
  'Pemimpin Pelabuhan': ['Pelabuhan ini terakhir. Setelah ini, hanya kabut.'],
  'Pemandu Ombak': ['Arus di sini berputar ke bawah. Jangan bertanya ke mana.'],
  'Penjual Ikan': ['Ikan ini masih segar. Matanya mengikuti bulan.'],
  'Penjaga Cahaya': ['Mercusuar harus menyala setiap malam. Kalau tidak, sesuatu datang.'],
  'Pengangkut': ['Kapal itu kosong saat berangkat. Saat kembali, penuh.'],
  'Tabib Laut': ['Air asin memperlambat luka. Kadang terlalu lambat.'],
};

export const SETTLEMENTS = [
  {
    id: 'thornveil', name: 'Thornveil Haven', subtitle: 'Duri Tersembunyi', chapter: 0, accent: '#d07a35', glyph: '⌂',
    desc: 'Permukiman suku yang tumbuh di antara duri raksasa. Satu-satunya tempat di dunia yang masih menyebut namamu tanpa takut.',
    services: ['forge', 'infirmary', 'shrine', 'shop', 'crafting', 'quests', 'wardrobe', 'chronicle', 'trials', 'travel'],
    npcs: HAVEN_NPCS.map((npc) => npc.id),
    visual: ['Api unggun kecil', 'Balai anyaman', 'Menara duri', 'Gerbang batu', 'Taman obat'],
  },
  {
    id: 'emberwatch', name: 'Pos Jaga Bara', subtitle: 'Emberwatch Outpost', chapter: 2, accent: '#e0553b', glyph: '⌖',
    desc: 'Pos militer yang dibangun di bibir kawah. Penjaganya bertahan karena tidak ada tempat lain untuk pulang.',
    services: ['shop', 'infirmary', 'quests'], npcs: [], visual: ['Menara kayu', 'Parit bara', 'Tenda pelat'],
  },
  {
    id: 'marshroot', name: 'Kemah Akar Rawa', subtitle: 'Marshroot Camp', chapter: 1, accent: '#8fae6a', glyph: '❋',
    desc: 'Kamp terapung di atas rawa. Setiap malam penduduknya memindahkan rumah agar tidak ditelan lumpur.',
    services: ['shop', 'alchemy', 'quests'], npcs: [], visual: ['Rumah panggung', 'Perahu kecil', 'Api unggun'],
  },
  {
    id: 'sunkenmarket', name: 'Pasar Terkubur', subtitle: 'Sunken Market', chapter: 3, accent: '#c9a25c', glyph: '♜',
    desc: 'Pasar yang masih berdagang di bawah reruntuhan kota. Para pedagangnya menjual barang dari masa yang sudah mati.',
    services: ['shop', 'crafting', 'quests'], npcs: [], visual: ['Lonceng tua', 'Kios batu', 'Lentera'],
  },
  {
    id: 'crystalenclave', name: 'Enklave Kristal', subtitle: 'Crystal Enclave', chapter: 4, accent: '#7fc9e8', glyph: '◈',
    desc: 'Permukiman para pemotong kristal. Cahaya gua menggantikan matahari, dan kenangan menggantikan berita.',
    services: ['shop', 'crafting', 'quests'], npcs: [], visual: ['Kubah kristal', 'Sumur cahaya', 'Lensa raksasa'],
  },
  {
    id: 'stormbreak', name: 'Suaka Badai', subtitle: 'Stormbreak Refuge', chapter: 5, accent: '#6fa8dc', glyph: '⚡',
    desc: 'Tempat berlindung bagi mereka yang kehilangan rumah karena badai. Setiap atapnya ditambatkan dengan rantai.',
    services: ['shop', 'infirmary', 'quests'], npcs: [], visual: ['Benteng rantai', 'Penangkal petir', 'Lampu tembaga'],
  },
  {
    id: 'rootsanctum', name: 'Sanctum Akar', subtitle: 'Root Sanctum', chapter: 6, accent: '#a86bd8', glyph: '❋',
    desc: 'Kuil hidup yang berdenyut bersama akar dunia. Para pendetanya tidak pernah tidur, hanya berganti napas.',
    services: ['shop', 'alchemy', 'quests'], npcs: [], visual: ['Altar akar', 'Taman spora', 'Jembatan sulur'],
  },
  {
    id: 'lastharbor', name: 'Pelabuhan Terakhir', subtitle: 'Last Harbor', chapter: 7, accent: '#8ba8a0', glyph: '≋',
    desc: 'Dermaga terakhir sebelum lautan kabut. Kapal-kapal berangkat dari sini dan tidak pernah kembali.',
    services: ['shop', 'infirmary', 'quests'], npcs: [], visual: ['Mercusuar', 'Dermaga kayu', 'Kapal hantu'],
  },
];

const OUTPOST_NPCS = [];
for (const [settlementId, entries] of OUTPOST_NPC_SOURCE) {
  const settlement = SETTLEMENTS.find((s) => s.id === settlementId);
  entries.forEach(([name, role, glyph, desc], index) => {
    const id = `${settlementId}_${index + 1}`;
    const lines = NPC_ROLE_LINES[role] || ['Jalan ini tidak pernah aman. Hati-hati.'];
    OUTPOST_NPCS.push({
      id, settlement: settlementId, name, role, glyph, chapterReq: settlement.chapter,
      desc, lines: [...lines, settlement.desc], questId: null, upgradeId: null,
    });
    settlement.npcs.push(id);
  });
}

export const ALL_NPCS = [...HAVEN_NPCS, ...OUTPOST_NPCS];
export const NPC_BY_ID = Object.fromEntries(ALL_NPCS.map((npc) => [npc.id, npc]));
export const SETTLEMENT_BY_ID = Object.fromEntries(SETTLEMENTS.map((s) => [s.id, s]));

export const QUESTS = [
  { id: 'q_first_vow', npc: 'sari', title: 'Duri Pertama', desc: 'Tuntaskan tiga level pertama kampanye untuk membuktikan sumpahmu pada Thornveil.', objective: { type: 'levels', amount: 3 }, reward: { echoes: 60 }, flag: 'thornveil_welcome' },
  { id: 'q_forge', npc: 'bram', title: 'Bara yang Menolak Mati', desc: 'Tingkatkan Pandai Besi ke tingkat 2. Bram ingin tahu apakah kau serius.', objective: { type: 'upgrade', id: 'forge', tier: 2 }, reward: { echoes: 80 }, flag: 'forge_mastered' },
  { id: 'q_hunt', npc: 'jaka', title: 'Nama yang Dicuri', desc: 'Kalahkan lima mini-boss. Setiap kemenangan mengembalikan satu nama.', objective: { type: 'miniBosses', amount: 5 }, reward: { echoes: 120 }, flag: 'names_returned' },
  { id: 'q_weave', npc: 'rani', title: 'Benang dari Perjalanan', desc: 'Kumpulkan enam kulit binatang dari berbagai biome.', objective: { type: 'category', category: 'pelts', amount: 6 }, reward: { echoes: 100, skin: 'skin_thornweave' }, flag: 'thornweave_woven' },
  { id: 'q_names', npc: 'kakek', title: 'Buku yang Hilang', desc: 'Bawa sepuluh prasasti kuno ke Kakek Tua. Ia akan menyusun kembali halaman yang hilang.', objective: { type: 'category', category: 'tablets', amount: 10 }, reward: { echoes: 140 }, flag: 'book_restored' },
  { id: 'q_gate', npc: 'nara', title: 'Gerbang yang Terbuka', desc: 'Tuntaskan Bab II. Nara ingin melihat apakah gerbang masih mengenalimu.', objective: { type: 'chapter', chapter: 1 }, reward: { echoes: 150 }, flag: 'gate_ii_open' },
  { id: 'q_garden', npc: 'sinta', title: 'Ramuan untuk Besok', desc: 'Tingkatkan Taman Obat ke tingkat 2. Sinta butuh lebih banyak ramuan untuk pengungsi.', objective: { type: 'upgrade', id: 'garden', tier: 2 }, reward: { echoes: 90 }, flag: 'garden_bloom' },
  { id: 'q_trials', npc: 'bayu', title: 'Tangan yang Hilang', desc: 'Selesaikan tiga mode tantangan berulang. Bayu tidak akan memuji, tapi ia akan mengangguk.', objective: { type: 'modes', amount: 3 }, reward: { echoes: 120 }, flag: 'trials_passed' },
  { id: 'q_lost', npc: 'asih', title: 'Jalan Pulang', desc: 'Kumpulkan dua belas koleksi dari kategori apa pun. Asih ingin melihat semuanya.', objective: { type: 'collectibles', amount: 12 }, reward: { echoes: 110, skin: 'skin_lost_child' }, flag: 'asih_smiles' },
  { id: 'q_bog', npc: 'marshroot_1', title: 'Rawa yang Berbicara', desc: 'Kalahkan Penguasa Rawa di Bab II.', objective: { type: 'boss', chapter: 1 }, reward: { echoes: 160 }, flag: 'bog_silenced' },
  { id: 'q_storm', npc: 'stormbreak_1', title: 'Mata Badai', desc: 'Tuntaskan Bab VI dan temukan mata badai yang tenang.', objective: { type: 'chapter', chapter: 5 }, reward: { echoes: 200 }, flag: 'storm_eye_found' },
  { id: 'q_last', npc: 'lastharbor_1', title: 'Cahaya Terakhir', desc: 'Tuntaskan Bab VIII. Pelabuhan Terakhir ingin melihat mercusuar menyala untukmu.', objective: { type: 'chapter', chapter: 7 }, reward: { echoes: 240 }, flag: 'last_light' },
];

export const QUEST_BY_ID = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

export function dialogueForNpc(npc, context = {}) {
  if (!npc) return [];
  const chapter = Number(context.chapter) || 0;
  const lines = [...(npc.lines || [])];
  if (npc.chapterReq > chapter) {
    lines.unshift('Kau belum cukup jauh untuk mendengar cerita ini. Kembalilah setelah bab ini terbuka.');
  }
  if (context.questDone) lines.push('Kau sudah menepati janji itu. Thornveil tidak melupakan.');
  if (context.flag) lines.push('Aku melihat tanda di lenganmu. Kau bukan lagi orang asing di sini.');
  return lines;
}

// ── events, skins, repeatable modes, endgame ────────────────────────────────
const EVENT_SOURCE = [
  {
    id: 'ashen_festival', name: 'Festival Abu', subtitle: 'Ashen Festival', glyph: '✹', accent: '#e0913c',
    months: [10, 11], theme: 'Api, topeng, dan nyanyian untuk mereka yang telah pergi.',
    desc: 'Setahun sekali Thornveil menyalakan api besar untuk memanggil nama-nama yang hilang. Anggota suku mengenakan topeng dan menari sampai fajar.',
    skins: [
      ['skin_festival_ember', 'Topeng Bara', 'Mask of Embers', '#ff8a45', '#d07a35', 'Topeng kayu yang dibakar hingga hitam, dengan celah mata menyala.'],
      ['skin_festival_pyre', 'Jubah Pemuja Api', 'Pyre Robe', '#c94f2f', '#e8b46a', 'Jubah merah tua yang dihiasi abu para leluhur.'],
      ['skin_festival_gilded', 'Kulit Abu Emas', 'Gilded Ash', '#e0b45f', '#c9a25c', 'Pelat upacara berlapis emas dan abu suci.'],
      ['skin_festival_wing', 'Sayap Bara', 'Ember Wings', '#ff6a35', '#ffe2a8', 'Sayap kain yang berkilau seperti bara tertiup angin.'],
    ],
    missions: [
      ['fest_clear', 'Jaga Api Tetap Hidup', 'Tuntaskan 5 level kampanye selama festival.', 'levels', 5, 20],
      ['fest_boss', 'Beri Makan Bara', 'Kalahkan 2 boss atau mini-boss.', 'bosses', 2, 30],
      ['fest_collect', 'Kumpulkan Abu', 'Kumpulkan 4 koleksi dari kategori apa pun.', 'collectibles', 4, 20],
      ['fest_modes', 'Tarian Upacara', 'Selesaikan 1 mode tantangan berulang.', 'modes', 1, 25],
      ['fest_chapter', 'Nyanyian untuk Leluhur', 'Tuntaskan satu bab penuh.', 'chapter', 1, 40],
    ],
  },
  {
    id: 'bell_moon', name: 'Bulan Lonceng', subtitle: 'Bell Moon', glyph: '♪', accent: '#c9a25c',
    months: [1, 2], theme: 'Satu dentang untuk setiap nama yang berani disebut.',
    desc: 'Bulan ketika bulan tampak seperti lonceng perak. Penduduk Thornveil menggantung lonceng kecil di setiap pintu agar arwah menemukan jalan pulang.',
    skins: [
      ['skin_bell_silent', 'Topeng Sunyi', 'Silent Mask', '#b7a486', '#9fb0bd', 'Topeng tanpa mulut. Hanya mereka yang mendengar yang bisa memakainya.'],
      ['skin_bell_night', 'Mantel Malam', 'Night Mantle', '#2f4a5c', '#7fc9e8', 'Mantel biru malam dengan benang perak yang berkilau.'],
      ['skin_bell_silver', 'Mahkota Perak', 'Silver Crown', '#d8d8d8', '#c9a25c', 'Mahkota tipis yang berdenting setiap kali kau melangkah.'],
      ['skin_bell_robe', 'Jubah Lonceng', 'Bell Robe', '#8b6a1f', '#e0b45f', 'Jubah upacara dengan lonceng kecil di setiap ujungnya.'],
    ],
    missions: [
      ['bell_clear', 'Dentang Pertama', 'Tuntaskan 4 level kampanye.', 'levels', 4, 20],
      ['bell_mini', 'Dentang Kecil', 'Kalahkan 3 mini-boss.', 'miniBosses', 3, 30],
      ['bell_category', 'Suara dari Batu', 'Kumpulkan 3 prasasti kuno.', 'category:tablets', 3, 25],
      ['bell_boss', 'Dentang Besar', 'Kalahkan 1 boss bab.', 'bosses', 1, 30],
      ['bell_modes', 'Gema Lonceng', 'Selesaikan 2 mode tantangan berulang.', 'modes', 2, 35],
    ],
  },
  {
    id: 'spore_season', name: 'Musim Spora', subtitle: 'Spore Season', glyph: '❋', accent: '#a86bd8',
    months: [3, 4], theme: 'Hutan bernapas, dan setiap napas membawa mimpi.',
    desc: 'Spora dari Kuil Akar terbawa angin ke seluruh negeri. Penduduk Thornveil memakai topeng dan menanam benih ajaib agar mimpi tidak mengambil mereka.',
    skins: [
      ['skin_spore_mantle', 'Mantel Spora', 'Spore Mantle', '#7a5596', '#c9a0f0', 'Mantel yang ditumbuhi jamur bercahaya.'],
      ['skin_spore_mask', 'Topeng Miselium', 'Mycelial Mask', '#432a58', '#b07be8', 'Topeng dari miselium hidup yang berdenyut pelan.'],
      ['skin_spore_tunic', 'Jubah Tunas', 'Tunic of Shoots', '#5a7a3a', '#a8d86a', 'Jubah hijau muda dengan sulur yang bergerak sendiri.'],
      ['skin_spore_aura', 'Aura Spora', 'Spore Aura', '#a86bd8', '#e0b45f', 'Awan spora keemasan yang mengikuti langkahmu.'],
    ],
    missions: [
      ['spore_clear', 'Bernapas Bersama Hutan', 'Tuntaskan 6 level kampanye.', 'levels', 6, 20],
      ['spore_collect', 'Panen Spora', 'Kumpulkan 5 benih ajaib.', 'category:seeds', 5, 30],
      ['spore_mini', 'Akar yang Melawan', 'Kalahkan 3 mini-boss.', 'miniBosses', 3, 30],
      ['spore_chapter', 'Musim yang Panjang', 'Tuntaskan satu bab penuh.', 'chapter', 1, 40],
      ['spore_modes', 'Mimpi Berulang', 'Selesaikan 1 mode tantangan berulang.', 'modes', 1, 25],
    ],
  },
  {
    id: 'storm_night', name: 'Malam Badai', subtitle: 'Storm Night', glyph: '⚡', accent: '#6fa8dc',
    months: [5, 6], theme: 'Langit membuka matanya, dan semua yang bersembunyi terlihat.',
    desc: 'Badai terbesar datang setiap tahun. Thornveil memadamkan api dan berlindung di bawah akar, sementara para pemberani menantang kilat untuk mendapatkan berkah.',
    skins: [
      ['skin_storm_bolt', 'Jubah Petir', 'Bolt Robe', '#2f4a5c', '#9fdcff', 'Jubah biru dengan pola kilat yang menyala saat berlari.'],
      ['skin_storm_cloud', 'Topeng Awan', 'Cloud Mask', '#6fa8dc', '#d8e8f0', 'Topeng dari awan yang dipadatkan. Terasa dingin dan basah.'],
      ['skin_storm_mantle', 'Mantel Badai', 'Tempest Mantle', '#172238', '#6fa8dc', 'Mantel tebal yang menolak air dan angin.'],
      ['skin_storm_hand', 'Kilat di Tangan', 'Lightning Hand', '#9fdcff', '#e8c184', 'Sarung tangan tembaga yang menyimpan satu kilat.'],
    ],
    missions: [
      ['storm_clear', 'Menantang Kilat', 'Tuntaskan 5 level kampanye.', 'levels', 5, 20],
      ['storm_boss', 'Guntur Pertama', 'Kalahkan 2 boss bab.', 'bosses', 2, 35],
      ['storm_mini', 'Penangkal Petir', 'Kalahkan 2 mini-boss.', 'miniBosses', 2, 25],
      ['storm_modes', 'Berlari di Badai', 'Selesaikan 2 mode tantangan berulang.', 'modes', 2, 30],
      ['storm_collect', 'Cahaya di Awan', 'Kumpulkan 3 cahaya bintang.', 'category:starlight', 3, 30],
    ],
  },
  {
    id: 'harvest_feast', name: 'Pesta Panen', subtitle: 'Harvest Feast', glyph: '♨', accent: '#d08a45',
    months: [8, 9], theme: 'Tanah memberi, dan kita berbagi sebelum musim dingin.',
    desc: 'Thornveil merayakan panen dari taman obat dan hutan. Meja panjang dibentangkan di antara duri, dan setiap pengelana diundang makan.',
    skins: [
      ['skin_harvest_robe', 'Jubah Panen', 'Harvest Robe', '#7a4a24', '#e0b45f', 'Jubah cokelat dengan sulaman gandum emas.'],
      ['skin_harvest_mask', 'Topeng Jerami', 'Straw Mask', '#c9a25c', '#8fae6a', 'Topeng anyaman jerami yang berbau matahari.'],
      ['skin_harvest_leaf', 'Mantel Daun', 'Leaf Mantle', '#5a7a3a', '#a8d86a', 'Mantel dari daun yang tidak pernah layu.'],
      ['skin_harvest_aura', 'Aura Bintang', 'Starlight Aura', '#ffe2a8', '#e0b45f', 'Butir cahaya yang berputar seperti debu panen.'],
    ],
    missions: [
      ['harvest_clear', 'Membuka Ladang', 'Tuntaskan 4 level kampanye.', 'levels', 4, 20],
      ['harvest_collect', 'Panen Berlimpah', 'Kumpulkan 6 koleksi dari kategori apa pun.', 'collectibles', 6, 25],
      ['harvest_upgrade', 'Menyiapkan Musim Dingin', 'Tingkatkan satu fasilitas Thornveil.', 'upgrade', 1, 30],
      ['harvest_chapter', 'Perayaan Desa', 'Tuntaskan satu bab penuh.', 'chapter', 1, 40],
      ['harvest_modes', 'Lomba Desa', 'Selesaikan 2 mode tantangan berulang.', 'modes', 2, 30],
    ],
  },
  {
    id: 'last_eclipse', name: 'Gerhana Terakhir', subtitle: 'Last Eclipse', glyph: '✺', accent: '#e8b46a',
    months: [7, 12], theme: 'Matahari pergi, dan yang terlupakan mendekat.',
    desc: 'Gerhana yang hanya terjadi sekali dalam satu generasi. Thornveil menutup gerbang dan menyalakan semua api, menunggu apakah dunia akan kembali pagi.',
    skins: [
      ['skin_eclipse_robe', 'Jubah Gerhana', 'Eclipse Robe', '#1d130b', '#e8b46a', 'Jubah hitam dengan tepi emas yang menyerap cahaya.'],
      ['skin_eclipse_mask', 'Topeng Kosong', 'Hollow Mask', '#0b0704', '#b7a486', 'Topeng tanpa wajah. Siapa pun yang memakainya terlihat seperti kau.'],
      ['skin_eclipse_mantle', 'Mantel Terlupakan', 'Forgotten Mantle', '#2f1e0f', '#c9a25c', 'Mantel dari kain yang tidak diingat oleh penenunnya.'],
      ['skin_eclipse_aura', 'Aura Terakhir', 'Final Aura', '#ffe2a8', '#e8b46a', 'Cincin cahaya tipis yang menandai akhir sebuah zaman.'],
    ],
    missions: [
      ['eclipse_clear', 'Menunggu Fajar', 'Tuntaskan 8 level kampanye.', 'levels', 8, 25],
      ['eclipse_boss', 'Matahari di Tangan', 'Kalahkan 3 boss bab.', 'bosses', 3, 40],
      ['eclipse_mini', 'Bayangan Kecil', 'Kalahkan 4 mini-boss.', 'miniBosses', 4, 35],
      ['eclipse_collect', 'Cahaya Terakhir', 'Kumpulkan 5 cahaya bintang.', 'category:starlight', 5, 30],
      ['eclipse_chapter', 'Dunia yang Kembali', 'Tuntaskan dua bab penuh.', 'chapter', 2, 50],
    ],
  },
];

export const EVENT_THEMES = EVENT_SOURCE.map((source) => {
  const rewardTrack = [
    { points: 20, name: 'Gema Festival', reward: { echoes: 40 }, glyph: '✦' },
    { points: 45, name: 'Peti Perunggu', reward: { echoes: 80, item: 'tonic' }, glyph: '▣' },
    { points: 70, name: 'Peti Perak', reward: { echoes: 120, item: 'whetstone' }, glyph: '▤' },
    { points: 100, name: 'Kulit Eksklusif', reward: { skin: source.skins[0][0] }, glyph: '✧' },
    { points: 130, name: 'Peti Emas', reward: { echoes: 220, item: 'bomb' }, glyph: '▥' },
    { points: 160, name: 'Kulit Legendaris', reward: { skin: source.skins[3][0], echoes: 300 }, glyph: '✺' },
  ];
  const shop = [
    { id: `${source.id}_skin_1`, name: source.skins[1][1], cost: 60, skin: source.skins[1][0], desc: 'Kulit eksklusif event. Hanya visual.' },
    { id: `${source.id}_skin_2`, name: source.skins[2][1], cost: 90, skin: source.skins[2][0], desc: 'Kulit eksklusif event. Hanya visual.' },
    { id: `${source.id}_echo`, name: 'Gema Festival ×80', cost: 40, echoes: 80, desc: 'Tukar Gema Festival menjadi Gema abadi.' },
    { id: `${source.id}_skin_3`, name: source.skins[0][1], cost: 120, skin: source.skins[0][0], desc: 'Kulit eksklusif event. Hanya visual.' },
  ];
  const missions = source.missions.map(([id, name, desc, objective, amount, points]) => ({
    id, name, desc, objective, amount, points,
    claimed: false,
  }));
  return {
    id: source.id,
    name: source.name,
    subtitle: source.subtitle,
    glyph: source.glyph,
    accent: source.accent,
    months: [...source.months],
    theme: source.theme,
    desc: source.desc,
    currency: 'Gema Festival',
    missions,
    rewardTrack,
    shop,
    skins: source.skins.map(([id, name, subtitle, outfit, skin, desc]) => ({
      id, name, subtitle, eventId: source.id, desc, source: `Event ${source.name}`,
      outfit, skin, aura: outfit, glyph: source.glyph,
    })),
  };
});

export const EVENT_BY_ID = Object.fromEntries(EVENT_THEMES.map((event) => [event.id, event]));

export function isEventActive(event, date = new Date()) {
  if (!event || !Array.isArray(event.months)) return false;
  const month = date.getMonth() + 1;
  return event.months.includes(month);
}

export function activeEventIds(date = new Date()) {
  return EVENT_THEMES.filter((event) => isEventActive(event, date)).map((event) => event.id);
}

const MILESTONE_SKINS = [
  { id: 'skin_thornweave', name: 'Tenun Duri', subtitle: 'Thornweave', outfit: '#7a4a24', skin: '#c98f6a', aura: '#d07a35', glyph: '✧', source: 'Quest: Benang dari Perjalanan', desc: 'Kain tenunan Rani dari duri dan bulu. Hanya visual.' },
  { id: 'skin_lost_child', name: 'Jubah Asih', subtitle: 'Lost Child', outfit: '#8b6a1f', skin: '#d8b892', aura: '#ffe2a8', glyph: '◍', source: 'Quest: Jalan Pulang', desc: 'Jubah kecil yang dijahit Asih dari sobekan bendera lama. Hanya visual.' },
  { id: 'skin_first_echo', name: 'Gema Pertama', subtitle: 'First Echo', outfit: '#a83232', skin: '#a8503f', aura: '#e0553b', glyph: '✹', source: 'Bab III selesai', desc: 'Warna gema yang tertinggal di kulit setelah kawah pertama. Hanya visual.' },
  { id: 'skin_glass_queen', name: 'Mahkota Bening', subtitle: 'Glass Crown', outfit: '#2f4a5c', skin: '#d8b892', aura: '#9fdcff', glyph: '◈', source: 'Bab V selesai', desc: 'Pecahan mahkota Ratu Bening yang tidak pernah padam. Hanya visual.' },
  { id: 'skin_storm_sovereign', name: 'Jubah Badai', subtitle: 'Storm Sovereign', outfit: '#172238', skin: '#c98f6a', aura: '#6fa8dc', glyph: '⚡', source: 'Bab VI selesai', desc: 'Kain yang tidak pernah basah oleh hujan. Hanya visual.' },
  { id: 'skin_root_mother', name: 'Mantel Akar', subtitle: 'Root Mother', outfit: '#2a1640', skin: '#8fb06a', aura: '#b07be8', glyph: '❋', source: 'Bab VII selesai', desc: 'Akar hidup yang memeluk bahu tanpa melukai. Hanya visual.' },
  { id: 'skin_mist_sovereign', name: 'Selubung Kabut', subtitle: 'Mist Veil', outfit: '#1c2928', skin: '#d8b892', aura: '#8ba8a0', glyph: '≋', source: 'Bab VIII selesai', desc: 'Kabut yang menempel seperti kain dan tidak pernah hilang. Hanya visual.' },
  { id: 'skin_forgotten', name: 'Yang Terlupakan', subtitle: 'The Forgotten', outfit: '#2f1e0f', skin: '#a8503f', aura: '#e8b46a', glyph: '✺', source: 'Kampanye selesai', desc: 'Nama yang diucapkan sekali, lalu diingat selamanya. Hanya visual.' },
];

export const COSMETIC_SKINS = [
  ...EVENT_THEMES.flatMap((event) => event.skins),
  ...MILESTONE_SKINS,
];

export const SKIN_BY_ID = Object.fromEntries(COSMETIC_SKINS.map((skin) => [skin.id, skin]));

// ── repeatable challenge modes ──────────────────────────────────────────────
export const REPEATABLE_MODES = [
  { id: 'echo_trials', name: 'Ujian Gema', subtitle: 'Echo Trials', glyph: '✦', unlockChapter: 0, desc: 'Tiga ruang acak dengan modifier aktif. Setiap ruang memberi Gema.', reward: { echoes: 45 }, modifiers: ['glass_blade'], duration: '3 ruang' },
  { id: 'boss_rush', name: 'Boss Rush', subtitle: 'Boss Rush', glyph: '♛', unlockChapter: 1, desc: 'Hadapi lima boss berurutan tanpa checkpoint. Flask diisi ulang di antara boss.', reward: { echoes: 80, skin: 'skin_first_echo' }, modifiers: [], duration: '5 boss' },
  { id: 'horde', name: 'Gelombang Abu', subtitle: 'Ashen Horde', glyph: '◈', unlockChapter: 2, desc: 'Bertahan dari gelombang musuh yang terus meningkat selama tiga menit.', reward: { echoes: 55 }, modifiers: ['hunter'], duration: '3 menit' },
  { id: 'gauntlet', name: 'Gauntlet', subtitle: 'The Gauntlet', glyph: '⚔', unlockChapter: 3, desc: 'Lima ruang berurutan tanpa mengisi flask. Hanya satu berkah di akhir.', reward: { echoes: 70 }, modifiers: ['famine'], duration: '5 ruang' },
  { id: 'hunt', name: 'Buruan Besar', subtitle: 'Great Hunt', glyph: '➶', unlockChapter: 4, desc: 'Lacak dan kalahkan tiga mini-boss dalam satu perjalanan.', reward: { echoes: 65 }, modifiers: [], duration: '3 mini-boss' },
  { id: 'relic_hunt', name: 'Perburuan Relik', subtitle: 'Relic Hunt', glyph: '✧', unlockChapter: 5, desc: 'Kumpulkan lima koleksi langka sebelum waktu habis.', reward: { echoes: 60 }, modifiers: ['blind'], duration: '5 koleksi' },
  { id: 'mirror', name: 'Cermin Sumpah', subtitle: 'Vow Mirror', glyph: '◒', unlockChapter: 6, desc: 'Hadapi salinan dirimu sendiri. Ia memakai semua berkah dan senjatamu.', reward: { echoes: 100, skin: 'skin_eclipse_mask' }, modifiers: [], duration: '1 duel' },
  { id: 'endless', name: 'Tanpa Akhir', subtitle: 'Endless Echo', glyph: '∞', unlockChapter: 8, desc: 'Tidak ada akhir. Setiap ruang memperkuat musuh. Seberapa jauh kau bisa bertahan?', reward: { echoes: 120 }, modifiers: ['iron_skin', 'glass_blade'], duration: 'tanpa batas' },
];

export const MODE_BY_ID = Object.fromEntries(REPEATABLE_MODES.map((mode) => [mode.id, mode]));

export const NG_PLUS_TIERS = [
  { tier: 0, name: 'Perjalanan Pertama', desc: 'Kampanye standar.', enemy: 1, reward: 1, unlock: null },
  { tier: 1, name: 'NG+ I · Gema Pertama', desc: 'Musuh +20% HP, Gema +25%.', enemy: 1.2, reward: 1.25, unlock: 'Selesaikan kampanye' },
  { tier: 2, name: 'NG+ II · Duri Berlipat', desc: 'Musuh +40% HP, Gema +50%.', enemy: 1.4, reward: 1.5, unlock: 'Selesaikan NG+ I' },
  { tier: 3, name: 'NG+ III · Abu Tak Berujung', desc: 'Musuh +65% HP, boss +1 fase, Gema +80%.', enemy: 1.65, reward: 1.8, unlock: 'Selesaikan NG+ II' },
  { tier: 4, name: 'NG+ IV · Nama Terakhir', desc: 'Musuh +100% HP, Gema +120%, semua modifier terbuka.', enemy: 2, reward: 2.2, unlock: 'Selesaikan NG+ III' },
];

export const ENDGAME_TRIALS = [
  { id: 'trial_echo', name: 'Gema Tanpa Akhir', desc: 'Hadapi tiga boss bab sekaligus di ruang tanpa lantai.', glyph: '∞', reward: { echoes: 300, skin: 'skin_forgotten' } },
  { id: 'trial_memory', name: 'Ruang Kenangan', desc: 'Semua mini-boss muncul kembali dengan statistik gabungan.', glyph: '◒', reward: { echoes: 260 } },
  { id: 'trial_name', name: 'Nama Terakhir', desc: 'Duel melawan Yang Terlupakan di bawah semua modifier aktif.', glyph: '✺', reward: { echoes: 400 } },
  { id: 'trial_thornveil', name: 'Pertahanan Thornveil', desc: 'Lindungi permukiman dari gelombang abu tanpa henti.', glyph: '⌂', reward: { echoes: 320, skin: 'skin_thornweave' } },
];

// ── progress helpers and migration ──────────────────────────────────────────
const EVENT_ITEM_IDS = new Set(
  EVENT_THEMES.flatMap((event) => event.rewardTrack.map((tier) => tier.reward.item).filter(Boolean)),
);

export function defaultExpansionProgress() {
  return {
    version: 1,
    unlockedChapter: 0,
    cleared: Array(TOTAL_LEVELS).fill(false),
    chapterCleared: Array(CHAPTERS.length).fill(false),
    echoes: 0,
    difficulty: 'normal',
    modifiers: [],
    ngPlus: 0,
    cosmetics: [],
    selectedSkin: null,
    collectibles: [],
    stash: {},
    settlements: Object.fromEntries(SETTLEMENTS.map((s) => [s.id, { unlocked: s.chapter === 0, tier: 0, upgrades: Object.fromEntries(HAVEN_UPGRADES.map((u) => [u.id, 0])), visited: false }])),
    quests: Object.fromEntries(QUESTS.map((q) => [q.id, { status: 'locked', progress: 0 }])),
    events: Object.fromEntries(EVENT_THEMES.map((e) => [e.id, { points: 0, missionsClaimed: [], tiersClaimed: [], shopPurchased: [], spent: 0 }])),
    modes: Object.fromEntries(REPEATABLE_MODES.map((m) => [m.id, { completions: 0, best: 0 }])),
    flags: {},
    stats: { levels: 0, bosses: 0, miniBosses: 0, deaths: 0, collectibles: 0 },
  };
}

export function sanitizeExpansionProgress(raw) {
  const base = defaultExpansionProgress();
  if (!raw || typeof raw !== 'object') return base;
  const source = raw;
  const next = { ...base, ...source };
  next.version = 1;
  next.unlockedChapter = Math.max(0, Math.min(CHAPTERS.length - 1, Number(source.unlockedChapter) || 0));
  next.echoes = Math.max(0, Number(source.echoes) || 0);
  next.difficulty = DIFFICULTY_BY_ID[source.difficulty] ? source.difficulty : 'normal';
  next.modifiers = Array.isArray(source.modifiers)
    ? [...new Set(source.modifiers.filter((id) => MODIFIER_BY_ID[id]))]
    : [];
  next.ngPlus = Math.max(0, Math.min(NG_PLUS_TIERS.length - 1, Number(source.ngPlus) || 0));
  next.cleared = Array.from({ length: TOTAL_LEVELS }, (_, i) => {
    if (Array.isArray(source.cleared)) return !!source.cleared[i];
    if (source.cleared && typeof source.cleared === 'object') return !!source.cleared[i] || !!source.cleared[String(i)];
    return false;
  });
  next.chapterCleared = Array.from({ length: CHAPTERS.length }, (_, i) => !!source.chapterCleared?.[i]);
  next.cosmetics = Array.isArray(source.cosmetics) ? [...new Set(source.cosmetics.filter((id) => SKIN_BY_ID[id]))] : [];
  next.selectedSkin = SKIN_BY_ID[source.selectedSkin] ? source.selectedSkin : null;
  next.collectibles = Array.isArray(source.collectibles) ? [...new Set(source.collectibles.filter((id) => COLLECTIBLE_BY_ID[id]))] : [];
  next.settlements = { ...base.settlements };
  for (const settlement of SETTLEMENTS) {
    const saved = source.settlements?.[settlement.id] || {};
    const upgrades = {};
    for (const upgrade of HAVEN_UPGRADES) {
      upgrades[upgrade.id] = Math.max(0, Math.min(upgrade.maxTier, Number(saved.upgrades?.[upgrade.id]) || 0));
    }
    next.settlements[settlement.id] = {
      unlocked: saved.unlocked ?? settlement.chapter === 0,
      tier: Math.max(0, Math.min(3, Number(saved.tier) || 0)),
      upgrades,
      visited: !!saved.visited,
    };
  }
  next.quests = { ...base.quests };
  for (const quest of QUESTS) {
    const saved = source.quests?.[quest.id] || {};
    next.quests[quest.id] = {
      status: ['locked', 'active', 'ready', 'done'].includes(saved.status) ? saved.status : 'locked',
      progress: Math.max(0, Number(saved.progress) || 0),
    };
  }
  next.events = { ...base.events };
  for (const event of EVENT_THEMES) {
    const saved = source.events?.[event.id] || {};
    const state = {
      points: Math.max(0, Number(saved.points) || 0),
      missionsClaimed: Array.isArray(saved.missionsClaimed) ? [...new Set(saved.missionsClaimed)] : [],
      tiersClaimed: Array.isArray(saved.tiersClaimed) ? [...new Set(saved.tiersClaimed)] : [],
      shopPurchased: Array.isArray(saved.shopPurchased) ? [...new Set(saved.shopPurchased)] : [],
      spent: Math.max(0, Number(saved.spent) || 0),
    };
    for (const key of Object.keys(saved)) {
      if (key.startsWith('__mission_')) state[key] = Math.max(0, Number(saved[key]) || 0);
    }
    next.events[event.id] = state;
  }
  next.stash = {};
  if (source.stash && typeof source.stash === 'object') {
    for (const id of EVENT_ITEM_IDS) {
      const count = Math.max(0, Math.floor(Number(source.stash[id]) || 0));
      if (count > 0) next.stash[id] = count;
    }
  }
  next.modes = { ...base.modes };
  for (const mode of REPEATABLE_MODES) {
    const saved = source.modes?.[mode.id] || {};
    next.modes[mode.id] = { completions: Math.max(0, Number(saved.completions) || 0), best: Math.max(0, Number(saved.best) || 0) };
  }
  next.flags = source.flags && typeof source.flags === 'object' ? { ...source.flags } : {};
  next.stats = { ...base.stats, ...(source.stats && typeof source.stats === 'object' ? source.stats : {}) };
  return next;
}

export function expansionLevelUnlocked(expansion, localIndex) {
  if (!expansion || !Number.isInteger(localIndex) || localIndex < 0 || localIndex >= TOTAL_LEVELS) return false;
  const chapter = Math.floor(localIndex / LEVELS_PER_CHAPTER);
  const within = localIndex % LEVELS_PER_CHAPTER;
  if (chapter > expansion.unlockedChapter) return false;
  if (within === 0) return true;
  return !!expansion.cleared[localIndex - 1];
}

export function expansionChapterProgress(expansion, chapterIndex) {
  const start = chapterIndex * LEVELS_PER_CHAPTER;
  const cleared = expansion?.cleared?.slice(start, start + LEVELS_PER_CHAPTER).filter(Boolean).length || 0;
  return { cleared, total: LEVELS_PER_CHAPTER, pct: Math.round((cleared / LEVELS_PER_CHAPTER) * 100) };
}

export function expansionCompletion(expansion) {
  const cleared = expansion?.cleared?.filter(Boolean).length || 0;
  return { cleared, total: TOTAL_LEVELS, pct: Math.round((cleared / TOTAL_LEVELS) * 100) };
}

export function expansionCollectibleCounts(expansion) {
  const counts = {};
  for (const category of COLLECTIBLE_CATEGORIES) counts[category.id] = 0;
  for (const id of expansion?.collectibles || []) {
    const entry = COLLECTIBLE_BY_ID[id];
    if (entry) counts[entry.category] = (counts[entry.category] || 0) + 1;
  }
  return counts;
}

export function expansionModifierTotals(modifierIds) {
  const totals = { hp: 1, dmg: 1, incoming: 1, flasks: 0, extraEnemies: 0, ash: 1, echo: 1, noSigils: false, fog: false };
  for (const id of modifierIds || []) {
    const mod = MODIFIER_BY_ID[id];
    if (!mod) continue;
    totals.hp *= mod.hp ?? 1;
    totals.dmg *= mod.dmg ?? 1;
    totals.incoming *= mod.incoming ?? 1;
    totals.flasks += mod.flasks ?? 0;
    totals.extraEnemies += mod.extraEnemies ?? 0;
    totals.ash *= mod.ash ?? 1;
    totals.echo *= mod.echo ?? 1;
    totals.noSigils = totals.noSigils || !!mod.noSigils;
    totals.fog = totals.fog || !!mod.fog;
  }
  return totals;
}

export function applyQuestProgress(expansion, eventType, payload = {}) {
  if (!expansion) return [];
  const ready = [];
  for (const quest of QUESTS) {
    const state = expansion.quests[quest.id];
    if (!state || state.status === 'done') continue;
    let matched = false;
    const objective = quest.objective;
    if (objective.type === 'levels' && eventType === 'level') matched = true;
    else if (objective.type === 'miniBosses' && eventType === 'miniBoss') matched = true;
    else if (objective.type === 'boss' && eventType === 'boss' && payload.chapter === objective.chapter) matched = true;
    else if (objective.type === 'chapter' && eventType === 'chapter' && payload.chapter === objective.chapter) matched = true;
    else if (objective.type === 'collectibles' && eventType === 'collectible') matched = true;
    else if (objective.type === 'category' && eventType === 'collectible' && payload.category === objective.category) matched = true;
    else if (objective.type === 'modes' && eventType === 'mode') matched = true;
    else if (objective.type === 'upgrade' && eventType === 'upgrade' && payload.upgrade === objective.id) matched = true;
    if (!matched) continue;
    if (state.status === 'locked') state.status = 'active';
    if (objective.type === 'upgrade') {
      state.progress = Math.max(state.progress, Number(payload.tier) || 0);
      if (state.progress >= objective.tier) state.status = 'ready';
    } else {
      state.progress += 1;
      const target = Number(objective.amount) || 1;
      if (state.progress >= target) state.status = 'ready';
    }
    if (state.status === 'ready') ready.push(quest.id);
  }
  return ready;
}

export function applyEventProgress(expansion, eventType, payload = {}, date = new Date()) {
  if (!expansion) return [];
  const completed = [];
  for (const event of EVENT_THEMES) {
    const state = expansion.events[event.id];
    if (!state || !isEventActive(event, date)) continue;
    for (const mission of event.missions) {
      if (state.missionsClaimed.includes(mission.id)) continue;
      const [type, category] = mission.objective.split(':');
      let matched = false;
      if (type === 'levels' && eventType === 'level') matched = true;
      else if (type === 'bosses' && (eventType === 'boss' || eventType === 'miniBoss')) matched = true;
      else if (type === 'miniBosses' && eventType === 'miniBoss') matched = true;
      else if (type === 'collectibles' && eventType === 'collectible') matched = true;
      else if (type === 'category' && eventType === 'collectible' && payload.category === category) matched = true;
      else if (type === 'modes' && eventType === 'mode') matched = true;
      else if (type === 'chapter' && eventType === 'chapter') matched = true;
      else if (type === 'upgrade' && eventType === 'upgrade') matched = true;
      if (!matched) continue;
      const key = `__mission_${mission.id}`;
      state[key] = (state[key] || 0) + 1;
      if (state[key] >= mission.amount && !completed.includes(event.id)) completed.push(event.id);
    }
  }
  return completed;
}

export function eventMissionProgress(state, mission) {
  return Math.min(mission.amount, state?.[`__mission_${mission.id}`] || 0);
}

export function eventMissionReady(state, mission) {
  return eventMissionProgress(state, mission) >= mission.amount;
}

export function eventPoints(state, event) {
  let points = 0;
  for (const mission of event.missions) {
    if (state?.missionsClaimed?.includes(mission.id)) points += mission.points;
  }
  return points;
}

export function eventTierUnlocked(state, event, tier) {
  return eventPoints(state, event) >= tier.points;
}

export function defaultHavenState() {
  return {
    tier: 0,
    upgrades: Object.fromEntries(HAVEN_UPGRADES.map((u) => [u.id, 0])),
    visited: false,
    unlocked: true,
  };
}

export function havenBonus(expansion) {
  const haven = expansion?.settlements?.thornveil || defaultHavenState();
  const result = { damage: 0, maxHp: 0, flasks: 0, gain: 0, heal: 0, echo: 0, travel: 0, ng: 0 };
  for (const upgrade of HAVEN_UPGRADES) {
    const tier = haven.upgrades?.[upgrade.id] || 0;
    if (tier > 0) result[upgrade.stat] += upgrade.values[tier - 1] || 0;
  }
  return result;
}

export function expansionSaveSummary(expansion) {
  const completion = expansionCompletion(expansion);
  return {
    levels: completion.cleared,
    total: completion.total,
    pct: completion.pct,
    echoes: expansion?.echoes || 0,
    chapter: (expansion?.unlockedChapter || 0) + 1,
    ngPlus: expansion?.ngPlus || 0,
    cosmetics: expansion?.cosmetics?.length || 0,
    collectibles: expansion?.collectibles?.length || 0,
  };
}



