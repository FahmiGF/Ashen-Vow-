// Ashen Vow v0.14.0 — ARC III: THE RADIANT CRUSADE.
//
// The third arc begins where every Fallen Ones ending leaves heaven leaderless:
// the Order of the Radiant Crusade seizes the Choir and marches on everything
// below. Five levels, four level bosses, one three-phase final boss, and the
// Valor Chain — the aggressive counterweight to Arc II's patient marks.
//
// Pure data + deterministic rules, exactly like fallen.js: no DOM, no audio,
// no timing. The shell owns presentation; this module owns the numbers.
//
//   • 5 levels x 4 rooms (global ids 485-504), each with a banner shrine
//   • 15 mobs + 6 elites, all mapped onto the engine's existing AI archetypes
//   • 5 bosses (Marshal Aurion, Ballista Choir, Vesperine, Ophelion, Paladin)
//   • Valor Chain resource: hits build it, damage breaks it, strikes spend it
//   • progress.crusade under the existing save key, plus the Arc IV rift lock

export const CRUSADE_VERSION = 1;
export const CRUSADE_ARC_ID = 'crusade';
export const CRUSADE_NAME = 'The Radiant Crusade';
export const CRUSADE_LOCAL_NAME = 'Perang Salib Bersinar';
export const CRUSADE_SUBTITLE = 'Surga berhenti menghakimi. Sekarang ia berbaris.';
export const CRUSADE_PITCH = 'Kau mengalahkan cahaya. Sekarang pasukannya datang.';

export const CRUSADE_ROOM_START = 485; // after The Fallen Ones' 426-484
export const CRUSADE_LEVEL_COUNT = 5;
export const CRUSADE_ROOMS_PER_LEVEL = 4;
export const CRUSADE_ROOM_COUNT = CRUSADE_LEVEL_COUNT * CRUSADE_ROOMS_PER_LEVEL; // 20
export const CRUSADE_FLOOR_Y = 470;
export const CRUSADE_WORLD_W = 1400;

export const VALOR_MAX = 10;
export const VALOR_PER_HIT = 1;
export const VALOR_PER_PARRY = 2;
export const VALOR_PER_DAMAGE = 0.06; // extra multiplier per chain step
export const VALOR_STRIKE_MIN = 5;
export const VALOR_STRIKE_COST = 4;
export const PALADIN_CHAIN_MAX = 5;
export const PALADIN_CHAIN_INTERVAL = 3.6;

const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);
const asInt = (value, fallback = 0) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
};
const round1 = (value) => Math.round((Number(value) || 0) * 10) / 10;

// ── levels ─────────────────────────────────────────────────────────────────
const LEVEL_SOURCE = [
  {
    id: 'marching_fields',
    name: 'The Marching Fields',
    localName: 'Padang Barisan',
    subtitle: 'Cloud plains with war camps, banners and catapults',
    theme: 'Awan, tenda perang, panji-panji, dan katapel',
    gimmick: 'Tembakan pengepungan melengkung melintasi layar dan menandai titik jatuhnya.',
    boss: 'marshal_aurion',
    banner: 'banner_of_dawn',
    color: '#e8c46a',
    glow: '#fff4c8',
    particle: 'embers',
    music: 'reliquary',
    glyph: '⚑',
    enemies: ['crusader_recruit', 'banner_bearer', 'catapult_cherub', 'captain_brightspear'],
    hint: 'Barisan pertama tidak berteriak. Mereka hanya mengangkat panji dan mulai berjalan.',
    palette: { top: '#241a08', mid: '#6a4a18', low: '#b08840', glow: '#ffe8b0', fog: '#6a5024' },
  },
  {
    id: 'sky_bastion',
    name: 'Siege of the Sky Bastion',
    localName: 'Pengepungan Benteng Langit',
    subtitle: 'Floating fortress walls',
    theme: 'Dinding benteng terapung dan mesin pengepungan',
    gimmick: 'Daki tembok, hancurkan mesin pengepungan untuk membuka gerbang.',
    boss: 'ballista_choir',
    banner: 'siege_break',
    color: '#c8d8e8',
    glow: '#f0f8ff',
    particle: 'dust',
    music: 'stormexpanse',
    glyph: '⌗',
    enemies: ['siege_ram', 'wall_archer', 'gate_sentinel', 'siege_master'],
    hint: 'Benteng ini dibangun untuk menahan sesuatu dari bawah. Kau datang dari bawah.',
    palette: { top: '#0e1620', mid: '#33485e', low: '#7e98b0', glow: '#e8f4ff', fog: '#4c6278' },
  },
  {
    id: 'sanctified_armory',
    name: 'The Sanctified Armory',
    localName: 'Gudang Senjata Suci',
    subtitle: 'Forges and training halls of the Order',
    theme: 'Tempa dan aula latihan Ordo',
    gimmick: 'Rak senjata dan stand zirah menjadi bahaya sekaligus alat.',
    boss: 'lady_vesperine',
    banner: 'mercy_edge',
    color: '#f0d8b8',
    glow: '#fff4e0',
    particle: 'motes',
    music: 'cinderworks',
    glyph: '⚔',
    enemies: ['blade_acolyte', 'armor_stand_ghost', 'forge_hound', 'twin_blades'],
    hint: 'Setiap bilah di sini punya nama, dan setiap nama adalah sumpah yang belum dibayar.',
    palette: { top: '#1a0e06', mid: '#5a3418', low: '#a87840', glow: '#ffe0b8', fog: '#5e3c1e' },
  },
  {
    id: 'cathedral_of_swords',
    name: 'The Cathedral of Swords',
    localName: 'Katedral Pedang',
    subtitle: 'A cathedral built from giant blades and shields',
    theme: 'Katedral dari bilah dan perisai raksasa',
    gimmick: 'Gravitasi bergeser saat pedang-pedang raksasa berputar.',
    boss: 'warden_ophelion',
    banner: 'wall_breaker',
    color: '#d8d0c8',
    glow: '#ffffff',
    particle: 'glass',
    music: 'glassorchard',
    glyph: '✝',
    enemies: ['sword_bat', 'shield_choir', 'vigil_sister', 'commander_rampart'],
    hint: 'Dinding-dinding ini mengingat setiap pukulan. Mereka akan mengembalikannya semua.',
    palette: { top: '#12100e', mid: '#4a443c', low: '#9e9488', glow: '#fffaf0', fog: '#615a50' },
  },
  {
    id: 'gate_of_judgment',
    name: 'The Gate of Judgment',
    localName: 'Gerbang Penghakiman',
    subtitle: 'The vast final bastion before the infernal rift',
    theme: 'Benteng terakhir di tepi celah neraka',
    gimmick: 'Semua mekanik Perang Salib digabung. Tidak ada jalan mundur.',
    boss: 'giant_paladin',
    banner: 'final_verdict',
    color: '#f0e0b0',
    glow: '#ffffff',
    particle: 'halos',
    music: 'lastvigil',
    glyph: '☩',
    enemies: ['gatekeeper_zealot', 'rift_watcher', 'war_chanter', 'inquisitor_veyra'],
    hint: 'Paladin Agung telah menunggu seribu tahun di gerbang ini. Jangan membuatnya menunggu lebih lama.',
    palette: { top: '#1c1408', mid: '#5c4a20', low: '#c8a850', glow: '#fffbe4', fog: '#6e5824' },
  },
];

export const CRUSADE_LEVELS = LEVEL_SOURCE.map((level, index) => ({
  ...level,
  index,
  roomStart: CRUSADE_ROOM_START + index * CRUSADE_ROOMS_PER_LEVEL,
  bossRoom: CRUSADE_ROOM_START + index * CRUSADE_ROOMS_PER_LEVEL + CRUSADE_ROOMS_PER_LEVEL - 1,
  final: index === CRUSADE_LEVEL_COUNT - 1,
}));

export const CRUSADE_LEVEL_BY_ID = Object.fromEntries(CRUSADE_LEVELS.map((l) => [l.id, l]));

// ── enemies ────────────────────────────────────────────────────────────────
// behaviour stays inside the engine's archetypes:
// chaser | lunge | ranged | slam | burrower | spawner | hopper
const ENEMY_SOURCE = [
  {
    id: 'crusader_recruit', name: 'Crusader Recruit', localName: 'Rekrut Perang Salib', title: 'Dented Shield',
    behavior: 'chaser', hp: 138, dmg: 16, speed: 96, w: 40, h: 56, reward: 20, color: '#e8d8b0',
    level: 'marching_fields', shield: 30, mark: 0,
    desc: 'Prajurit muda dengan perisai penyok. Maju dengan perisai terangkat; rentan dari atas.',
  },
  {
    id: 'banner_bearer', name: 'Banner Bearer', localName: 'Pembawa Panji', title: 'Standard of Dawn',
    behavior: 'spawner', hp: 160, dmg: 12, speed: 62, w: 42, h: 64, reward: 26, color: '#ffd870',
    level: 'marching_fields', shield: 0, mark: 0, childType: 'crusader_recruit',
    desc: 'Membawa panji bercahaya yang mempercepat musuh di sekitarnya. Target utama.',
  },
  {
    id: 'catapult_cherub', name: 'Catapult Cherub', localName: 'Kerub Katapel', title: 'Arcing Fire',
    behavior: 'ranged', hp: 112, dmg: 18, speed: 74, w: 38, h: 44, reward: 22, color: '#f0e0b8',
    level: 'marching_fields', flying: true, shield: 0, mark: 1,
    desc: 'Penembak bersayap di kereta beroda. Melempar api melengkung yang menandai titik jatuh.',
  },
  {
    id: 'siege_ram', name: 'Siege Ram', localName: 'Domba Pengepungan', title: 'Straight Line',
    behavior: 'slam', hp: 280, dmg: 26, speed: 80, w: 64, h: 62, reward: 34, color: '#c8a870',
    level: 'sky_bastion', shield: 60, mark: 0,
    desc: 'Binatang berzirah penarik ram. Menerjang lurus; menabrak dinding membuatnya terhuyung.',
  },
  {
    id: 'wall_archer', name: 'Wall Archer', localName: 'Pemanah Tembok', title: 'Volley Fire',
    behavior: 'ranged', hp: 146, dmg: 19, speed: 92, w: 38, h: 58, reward: 23, color: '#d8d0b8',
    level: 'sky_bastion', shield: 20, mark: 0,
    desc: 'Pemanah bertudung di benteng. Menjatuhkan hujan panah; bersembunyi di balik penutup.',
  },
  {
    id: 'gate_sentinel', name: 'Gate Sentinel', localName: 'Sentinel Gerbang', title: 'Doors Closed',
    behavior: 'slam', hp: 320, dmg: 24, speed: 46, w: 62, h: 76, reward: 36, color: '#c0c8d0',
    level: 'sky_bastion', shield: 90, mark: 0,
    desc: 'Penjaga seperti patung yang memblokir pintu sampai mesin pengepungan dihancurkan.',
  },
  {
    id: 'blade_acolyte', name: 'Blade Acolyte', localName: 'Akolit Bilah', title: 'Third-Hit Parry',
    behavior: 'lunge', hp: 158, dmg: 21, speed: 132, w: 38, h: 58, reward: 24, color: '#f0e0c0',
    level: 'sanctified_armory', shield: 25, mark: 0,
    desc: 'Petarung dua bilah. Kombinasi cepat dengan jendela parry pada pukulan ketiga.',
  },
  {
    id: 'armor_stand_ghost', name: 'Armor Stand Ghost', localName: 'Hantu Stand Zirah', title: 'Assembles Late',
    behavior: 'chaser', hp: 210, dmg: 23, speed: 88, w: 52, h: 68, reward: 28, color: '#d8d0c8',
    level: 'sanctified_armory', shield: 50, mark: 0,
    desc: 'Zirah kosong di stand. Bangun saat kau lewat dan merakit diri menjadi petarung berat.',
  },
  {
    id: 'forge_hound', name: 'Forge Hound', localName: 'Anjing Tempa', title: 'Molten Trail',
    behavior: 'hopper', hp: 120, dmg: 20, speed: 150, w: 44, h: 34, reward: 25, color: '#ffa050',
    level: 'sanctified_armory', shield: 0, mark: 0,
    desc: 'Anjing emas cair. Meninggalkan jejak api dan menyerang berpasangan.',
  },
  {
    id: 'sword_bat', name: 'Sword Bat', localName: 'Kelelawar Pedang', title: 'Spinning Blade',
    behavior: 'lunge', hp: 140, dmg: 22, speed: 146, w: 42, h: 36, reward: 24, color: '#e8e8f0',
    level: 'cathedral_of_swords', flying: true, shield: 30, mark: 0,
    desc: 'Bilah bersayap dengan gagang sebagai tubuh. Berputar dan menembus perubahan gravitasi.',
  },
  {
    id: 'shield_choir', name: 'Shield Choir', localName: 'Paduan Perisai', title: 'Three Behind One',
    behavior: 'slam', hp: 260, dmg: 22, speed: 54, w: 66, h: 72, reward: 32, color: '#d0d8e8',
    level: 'cathedral_of_swords', shield: 80, mark: 0,
    desc: 'Tiga penyanyi di balik satu menara perisai. Saling melindungi; habisi yang tengah dulu.',
  },
  {
    id: 'vigil_sister', name: 'Vigil Sister', localName: 'Suster Vigil', title: 'One Revival',
    behavior: 'spawner', hp: 180, dmg: 14, speed: 64, w: 40, h: 60, reward: 30, color: '#f0e8d8',
    level: 'cathedral_of_swords', shield: 0, mark: 1, childType: 'sword_bat',
    desc: 'Penyembuh yang berdoa. Membangkitkan musuh yang gugur satu kali; ditandai lilin.',
  },
  {
    id: 'gatekeeper_zealot', name: 'Gatekeeper Zealot', localName: 'Zealot Penjaga Gerbang', title: 'Holy Blast',
    behavior: 'chaser', hp: 190, dmg: 30, speed: 118, w: 40, h: 60, reward: 34, color: '#ffe0a0',
    level: 'gate_of_judgment', shield: 40, mark: 1,
    desc: 'Fanatik dengan merek menyala. Meledakkan diri dalam ledakan suci saat mendekat.',
  },
  {
    id: 'rift_watcher', name: 'Rift Watcher', localName: 'Pengawas Celah', title: 'Something Below',
    behavior: 'ranged', hp: 200, dmg: 24, speed: 70, w: 46, h: 46, reward: 36, color: '#f0b0a0',
    level: 'gate_of_judgment', flying: true, shield: 55, mark: 0,
    desc: 'Mata mengapung di atas celah langit. Menembak berkas; menandakan energi neraka bocor.',
  },
  {
    id: 'war_chanter', name: 'War Chanter', localName: 'Penyanyi Perang', title: 'March Tempo',
    behavior: 'spawner', hp: 220, dmg: 16, speed: 58, w: 44, h: 64, reward: 32, color: '#e8d0a0',
    level: 'gate_of_judgment', shield: 35, mark: 0, childType: 'crusader_recruit',
    desc: 'Menyanyikan irama mars yang membuat barisan tetap berdiri. Prioritas pertama.',
  },
  // elites
  {
    id: 'captain_brightspear', name: 'Captain Brightspear', localName: 'Kapten Tombak Cahaya', title: 'Pierce the Line',
    behavior: 'lunge', hp: 620, dmg: 32, speed: 120, w: 58, h: 78, reward: 70, color: '#ffe6a0',
    level: 'marching_fields', elite: true, shield: 120, mark: 0,
    desc: 'Elite yang menusuk dalam garis lurus dan memanggil regu Rekrut.',
  },
  {
    id: 'siege_master', name: 'Siege Master', localName: 'Master Pengepungan', title: 'Fire From Behind',
    behavior: 'ranged', hp: 660, dmg: 34, speed: 66, w: 62, h: 80, reward: 74, color: '#c8b890',
    level: 'sky_bastion', elite: true, shield: 130, mark: 1,
    desc: 'Mengendalikan meriam; kau harus menghancurkannya dari belakang.',
  },
  {
    id: 'twin_blades', name: 'Twin Blades of Mercy', localName: 'Kembar Bilah Rahmat', title: 'Swap Places',
    behavior: 'lunge', hp: 700, dmg: 30, speed: 152, w: 52, h: 72, reward: 78, color: '#f0f0ff',
    level: 'sanctified_armory', elite: true, shield: 115, mark: 0,
    desc: 'Dua duelist yang bertukar tempat saat salah satunya terluka. Jendela parry mereka lebar.',
  },
  {
    id: 'commander_rampart', name: 'Commander Rampart', localName: 'Komandan Benteng', title: 'Breach the Wall',
    behavior: 'slam', hp: 820, dmg: 38, speed: 62, w: 78, h: 92, reward: 86, color: '#b8c0c8',
    level: 'cathedral_of_swords', elite: true, shield: 180, mark: 1,
    desc: 'Perisai menara yang menyerap semua pukulan. Pecahkan dengan Crusader Strike.',
  },
  {
    id: 'inquisitor_veyra', name: 'Inquisitor Veyra', localName: 'Inkuisitor Veyra', title: 'Reads the Chain',
    behavior: 'ranged', hp: 760, dmg: 36, speed: 108, w: 56, h: 80, reward: 88, color: '#e8c8a0',
    level: 'gate_of_judgment', elite: true, shield: 150, mark: 2,
    desc: 'Membaca Valor Chain-mu dan mengutuk chain yang terlalu tinggi.',
  },
  {
    id: 'hollow_crusader', name: 'Hollow Crusader', localName: 'Tentara Salib Kosong', title: 'Infernal Glow',
    behavior: 'chaser', hp: 900, dmg: 40, speed: 112, w: 70, h: 88, reward: 96, color: '#f0b090',
    level: 'gate_of_judgment', elite: true, shield: 140, mark: 1,
    desc: 'Prajurit yang gugur dengan nyala neraka samar di dalam zirahnya. Petunjuk Arc IV.',
  },
];

export const CRUSADE_ENEMY_INFO = {};
ENEMY_SOURCE.forEach((source, index) => {
  CRUSADE_ENEMY_INFO[source.id] = {
    ...source,
    chapter: 2,
    crusade: true,
    flying: !!source.flying,
    elite: !!source.elite,
    purityShield: source.shield || 0,
    markStacks: source.mark || 0,
    danger: source.elite ? 'SANGAT TINGGI' : source.shield >= 60 ? 'TINGGI' : 'SEDANG',
    glyph: source.elite ? '✹' : source.flying ? '✧' : '⚔',
    where: `${CRUSADE_NAME} — Perang Salib`,
    childType: source.childType || null,
    index,
  };
});

export const CRUSADE_ENEMY_IDS = Object.keys(CRUSADE_ENEMY_INFO);
export const CRUSADE_ELITES = ENEMY_SOURCE.filter((e) => e.elite).map((e) => e.id);

// ── bosses ─────────────────────────────────────────────────────────────────
const BOSS_SOURCE = [
  {
    id: 'marshal_aurion',
    kind: 'crusade_marshal_aurion',
    level: 'marching_fields',
    name: 'Marshal Aurion, Banner of Dawn',
    title: 'Banner of Dawn',
    localName: 'Marsekal Aurion, Panji Fajar',
    pattern: 'charge',
    maxHp: 1700,
    w: 150,
    h: 164,
    contact: 28,
    phases: 2,
    color: '#e8c46a',
    music: 'bossJudge',
    ashReward: 240,
    shards: 18,
    sigils: 14,
    glyph: '⚑',
    lines: [
      'Aku telah memimpin barisan ini melintasi seribu fajar. Kau hanya satu bayangan yang salah tempat.',
      'Panji naik! Bila aku jatuh, fajar jatuh bersamaku.',
      'Turunkan panji. Biarkan mereka melihat bahwa bahkan fajar bisa berakhir.',
    ],
  },
  {
    id: 'ballista_choir',
    kind: 'crusade_ballista_choir',
    level: 'sky_bastion',
    name: 'The Ballista Choir',
    title: 'Six Voices, Six Bolts',
    localName: 'Paduan Balista',
    pattern: 'volley',
    maxHp: 1950,
    w: 172,
    h: 150,
    contact: 26,
    phases: 2,
    color: '#c8d8e8',
    music: 'bossJudge',
    ashReward: 280,
    shards: 20,
    sigils: 16,
    glyph: '⌗',
    lines: [
      'Setiap balista bernyanyi dalam nada yang berbeda. Kau akan mendengar semuanya sekaligus.',
      'Satu suara padam. Yang tersisa menyanyi lebih keras dan lebih cepat.',
      'Menara ini berdiri di atas nyanyian. Tanpa kami, ia hanya batu yang jatuh.',
    ],
  },
  {
    id: 'lady_vesperine',
    kind: 'crusade_lady_vesperine',
    level: 'sanctified_armory',
    name: 'Lady Vesperine, Blade of Mercy',
    title: 'Blade of Mercy',
    localName: 'Nyonya Vesperine, Bilah Rahmat',
    pattern: 'ring',
    maxHp: 2100,
    w: 138,
    h: 160,
    contact: 24,
    phases: 3,
    color: '#f0d8b8',
    music: 'bossJudge',
    ashReward: 310,
    shards: 22,
    sigils: 18,
    glyph: '⚔',
    lines: [
      'Rahmat bukan berarti tidak menyakitimu. Rahmat berarti aku memberimu waktu untuk menyesal.',
      'Ambil seranganmu. Aku tidak akan menghentikannya.',
      'Keserakahan. Sungguh mengecewakan.',
      'Kau masih berdiri. Mungkin rahmat memang untukmu, bukan dariku.',
    ],
  },
  {
    id: 'warden_ophelion',
    kind: 'crusade_warden_ophelion',
    level: 'cathedral_of_swords',
    name: 'Warden Ophelion, the Unbroken Wall',
    title: 'The Unbroken Wall',
    localName: 'Warden Ophelion, Dinding Tak Terpatahkan',
    pattern: 'slam',
    maxHp: 2350,
    w: 166,
    h: 176,
    contact: 32,
    phases: 3,
    color: '#d8d0c8',
    music: 'bossJudge',
    ashReward: 340,
    shards: 24,
    sigils: 20,
    glyph: '✝',
    lines: [
      'Dinding mengingat setiap pukulan, dan mengembalikannya semua.',
      'Gravitasi di sini milikku. Kau hanya tamu yang belum diizinkan jatuh.',
      'Retak pertama. Retak kedua. Dinding tetap berdiri sampai pemiliknya berhenti percaya padanya.',
      'Akhirnya... sesuatu yang lebih keras dari batu.',
    ],
  },
  {
    id: 'giant_paladin',
    kind: 'crusade_giant_paladin',
    level: 'gate_of_judgment',
    name: 'The Giant Paladin Templar Knight',
    title: 'The Hollow Armor',
    localName: 'Paladin Templar Raksasa',
    pattern: 'slam',
    maxHp: 3200,
    w: 220,
    h: 210,
    contact: 38,
    phases: 3,
    final: true,
    color: '#f0e0b0',
    music: 'bossJudge',
    ashReward: 600,
    shards: 40,
    sigils: 32,
    glyph: '☩',
    lines: [
      'Aku telah menunggu seribu tahun di gerbang ini. Jangan membuatnya lebih lama.',
      'Maka biarkan Perang Salib menjawabmu. Bangkitlah, saudara-saudaraku!',
      'Tidak ada siapa-siapa di dalam. Tidak pernah ada. Hanya api.',
      'Katakan pada mereka... gerbangnya terbuka. Jangan biarkan menutup di belakangmu.',
    ],
  },
];

function thresholdsFor(phases) {
  if (phases <= 2) return [0.5];
  const list = [];
  for (let i = phases - 1; i >= 1; i -= 1) list.push(Math.round((i / phases) * 100) / 100);
  return list;
}

function dialogueFor(source) {
  const dialogue = {
    intro: [
      { speaker: source.name, text: source.lines[0] },
      { speaker: 'The Oathbound', text: 'Aku sudah membebaskan satu surga. Aku tidak akan berhenti karena panji.' },
    ],
    defeat: [{ speaker: source.name, text: source.lines[source.lines.length - 1] }],
  };
  for (let phase = 2; phase <= source.phases; phase += 1) {
    dialogue[`phase${phase}`] = [
      { speaker: source.name, text: source.lines[phase - 1] || source.lines[source.lines.length - 2] },
    ];
  }
  return dialogue;
}

export const CRUSADE_BOSSES = BOSS_SOURCE.map((source) => {
  const level = CRUSADE_LEVEL_BY_ID[source.level];
  return {
    ...source,
    levelIndex: level.index,
    roomIndex: level.bossRoom,
    phaseThresholds: thresholdsFor(source.phases),
  };
});

export const CRUSADE_BOSS_BY_ID = Object.fromEntries(CRUSADE_BOSSES.map((b) => [b.id, b]));
export const CRUSADE_MAIN_BOSSES = CRUSADE_BOSSES.slice();
export const CRUSADE_BOSS_KINDS = CRUSADE_BOSSES.map((b) => b.kind);
export const CRUSADE_BOSS_COUNT = CRUSADE_BOSSES.length;

export const CRUSADE_BOSS_INFO = {};
for (const source of BOSS_SOURCE) {
  CRUSADE_BOSS_INFO[source.kind] = {
    id: source.id,
    kind: source.kind,
    name: source.name,
    localName: source.localName,
    title: source.title,
    crusade: true,
    pattern: source.pattern,
    maxHp: source.maxHp,
    w: source.w,
    h: source.h,
    contact: source.contact,
    maxPhases: source.phases,
    phaseThresholds: thresholdsFor(source.phases),
    mini: !source.final,
    major: !!source.final,
    final: !!source.final,
    flying: false,
    reward: source.final ? 'victory' : 'blessing',
    purityShield: source.final ? 200 : 140,
    summonType: source.pattern === 'summon' ? 'crusader_recruit' : null,
    ashReward: source.ashReward,
    echoReward: 0,
    shards: source.shards,
    color: source.color,
    music: source.music,
    glyph: source.glyph,
    spawn: { x: 700, y: CRUSADE_FLOOR_Y - source.h },
    dialogue: dialogueFor(source),
    desc: source.lines[0],
    where: `${CRUSADE_NAME} — Perang Salib`,
  };
}

// ── banners (level rewards) ────────────────────────────────────────────────
export const CRUSADE_BANNERS = [
  { id: 'banner_of_dawn', name: 'Crusader Banner', localName: 'Panji Perang Salib', level: 'marshal_aurion', effect: { startValor: 2 }, desc: 'Valor Chain dimulai dari 2, bukan 0.' },
  { id: 'siege_break', name: 'Siege Break', localName: 'Pemecah Pengepungan', level: 'ballista_choir', effect: { strikeShield: 0.5 }, desc: 'Crusader Strike memecah Purity Shield 50% lebih cepat.' },
  { id: 'mercy_edge', name: 'Mercy Edge', localName: 'Mata Rahmat', level: 'lady_vesperine', effect: { parryValor: 2 }, desc: 'Parry menambah 2 Valor, bukan 1.' },
  { id: 'wall_breaker', name: 'Wall-Breaker', localName: 'Penghancur Dinding', level: 'warden_ophelion', effect: { strikeDamage: 0.35 }, desc: 'Crusader Strike +35% damage.' },
  { id: 'final_verdict', name: 'Final Verdict', localName: 'Putusan Akhir', level: 'giant_paladin', effect: { rift: true }, desc: 'Membuka celah di langit — dan sesuatu di bawahnya.' },
];

export const CRUSADE_BANNER_BY_ID = Object.fromEntries(CRUSADE_BANNERS.map((b) => [b.id, b]));

// ── upgrades ───────────────────────────────────────────────────────────────
export const CRUSADE_UPGRADES = [
  {
    id: 'health', name: 'Camp Rations', localName: 'Ransum Kamp', stat: 'maxHp', step: 14,
    tiers: [{ cost: 8, value: 14 }, { cost: 18, value: 28 }, { cost: 32, value: 42 }],
    desc: 'Menambah satu slot nyawa di Kemah Perang.',
  },
  {
    id: 'damage', name: 'Drilled Edge', localName: 'Mata Terlatih', stat: 'damage', step: 0.08,
    tiers: [{ cost: 6, value: 0.08 }, { cost: 14, value: 0.16 }, { cost: 26, value: 0.24 }],
    desc: 'Menambah damage dasar setiap senjata.',
  },
  {
    id: 'valor', name: 'Chain Drill', localName: 'Latihan Rantai', stat: 'valorMax', step: 2,
    tiers: [{ cost: 7, value: 2 }, { cost: 16, value: 4 }, { cost: 28, value: 6 }],
    desc: 'Menaikkan batas Valor Chain.',
  },
];

export const CRUSADE_UPGRADE_BY_ID = Object.fromEntries(CRUSADE_UPGRADES.map((u) => [u.id, u]));

export const CRUSADE_RIFT = {
  id: 'rift',
  label: 'THE RIFT',
  local: 'CELAH',
  note: 'Dua kenyataan berimpit di bawah surga yang runtuh. 27 ruang · 6 bos.',
  locked: false,
};

export const CRUSADE_MENU_OPTIONS = [
  { id: 'continue', label: 'CONTINUE CRUSADE', local: 'LANJUTKAN', note: 'Muat simpanan Perang Salib.' },
  { id: 'levels', label: 'THE FIVE LEVELS', local: 'LIMA TINGKAT', note: 'Pilih tingkat dan bos.' },
  { id: 'camp', label: 'WAR CAMP OF EMBERS', local: 'KEMAH PERANG', note: 'Belanja Sigil, baca arsip.' },
  { id: 'rift', label: CRUSADE_RIFT.label, local: CRUSADE_RIFT.local, note: CRUSADE_RIFT.note, locked: false },
  { id: 'heaven', label: 'RETURN TO HEAVEN', local: 'KEMBALI KE LANGIT', note: 'Buka menu Yang Terjatuh.' },
  { id: 'options', label: 'OPTIONS', local: 'OPSI', note: 'Pengaturan dan tema menu.' },
];

// ── rooms ──────────────────────────────────────────────────────────────────
const HALL_NAMES = [
  { name: 'Tenda Perang', subtitle: 'War Tent' },
  { name: 'Jalan Barisan', subtitle: 'Marching Road' },
  { name: 'Banner Shrine', subtitle: 'Banner Shrine' },
];

function platformsFor(level) {
  const high = 292 + (level.index % 3) * 22;
  const list = [
    { x: 0, y: CRUSADE_FLOOR_Y, w: CRUSADE_WORLD_W, h: 46 },
    { x: 186, y: high, w: 198, h: 18 },
    { x: 552, y: high - 48, w: 210, h: 18 },
    { x: 1000, y: 344 - (level.index % 4) * 16, w: 240, h: 18 },
  ];
  if (level.final) {
    list.push({ x: 250, y: CRUSADE_FLOOR_Y - 128, w: 168, h: 16 });
    list.push({ x: 982, y: CRUSADE_FLOOR_Y - 128, w: 168, h: 16 });
  }
  return list;
}

function enemiesFor(level, slot) {
  const count = slot === 0 ? 0 : slot === 1 ? 2 : 3;
  return level.enemies.slice(0, count).map((type, i) => {
    const info = CRUSADE_ENEMY_INFO[type];
    return {
      type,
      x: clamp(300 + i * 300 + ((level.index * 37 + slot * 29) % 70), 170, CRUSADE_WORLD_W - 180),
      minX: 80,
      maxX: CRUSADE_WORLD_W - 100,
      elite: !!info?.elite,
      hpScale: 1 + level.index * 0.12,
      dmgScale: 1 + level.index * 0.09,
      speedScale: 1 + level.index * 0.04,
    };
  });
}

function gateTo(next, requires, name) {
  return { x: 1362, y: 286, w: 34, h: 184, requires, next, name };
}

function makeHallRoom(level, slot) {
  const global = level.roomStart + slot;
  const room = {
    id: global,
    crusade: true,
    crusadeLevel: level.index + 1,
    crusadeLevelId: level.id,
    crusadeSlot: slot,
    name: `${HALL_NAMES[slot].name} — ${level.localName}`,
    subtitle: `${CRUSADE_NAME} — ${HALL_NAMES[slot].subtitle}`,
    zone: level.id,
    spawn: { x: 80, y: CRUSADE_FLOOR_Y - 46 },
    platforms: platformsFor(level),
    enemies: enemiesFor(level, slot),
    relic: null,
    boss: null,
    hint: level.hint,
    palette: { ...level.palette },
    particle: level.particle,
    music: level.music,
    condition: level.gimmick,
    weather: level.theme,
    accent: level.color,
    gate: gateTo(global + 1, 'clear', slot === 2 ? `Gerbang ${CRUSADE_BOSS_BY_ID[level.boss].name}` : 'Jalan Berikutnya'),
  };
  if (slot === 0) {
    room.checkpoint = { x: 74, y: CRUSADE_FLOOR_Y - 78, w: 38, h: 78, name: 'Kemah Perang' };
    room.merchant = { x: 156, y: CRUSADE_FLOOR_Y - 96, w: 46, h: 96 };
  }
  if (slot === 2) {
    room.checkpoint = { x: 74, y: CRUSADE_FLOOR_Y - 84, w: 40, h: 84, name: 'Banner Shrine' };
  }
  return room;
}

function makeBossRoom(level) {
  const boss = CRUSADE_BOSS_BY_ID[level.boss];
  const nextLevel = CRUSADE_LEVELS[level.index + 1];
  return {
    id: level.bossRoom,
    crusade: true,
    crusadeLevel: level.index + 1,
    crusadeLevelId: level.id,
    crusadeSlot: CRUSADE_ROOMS_PER_LEVEL - 1,
    crusadeBoss: boss.id,
    name: boss.localName,
    subtitle: `${CRUSADE_NAME} — ${boss.title}`,
    zone: level.id,
    spawn: { x: 80, y: CRUSADE_FLOOR_Y - 46 },
    platforms: platformsFor(level),
    enemies: [],
    relic: null,
    boss: boss.kind,
    hint: level.hint,
    palette: { ...level.palette },
    particle: level.particle,
    music: level.music,
    condition: level.gimmick,
    weather: level.theme,
    accent: boss.color,
    gate: nextLevel ? gateTo(nextLevel.roomStart, 'boss', nextLevel.localName) : null,
  };
}

export const CRUSADE_ROOMS = [];
for (const level of CRUSADE_LEVELS) {
  for (let slot = 0; slot < CRUSADE_ROOMS_PER_LEVEL - 1; slot += 1) CRUSADE_ROOMS.push(makeHallRoom(level, slot));
  CRUSADE_ROOMS.push(makeBossRoom(level));
}

export const CRUSADE_ROOM_BY_ID = Object.fromEntries(CRUSADE_ROOMS.map((room) => [room.id, room]));
export const CRUSADE_LEVEL_ROOMS = CRUSADE_LEVELS.map((level) =>
  CRUSADE_ROOMS.filter((room) => room.crusadeLevel === level.index + 1));

export function crusadeRoomFor(levelIndex, slot) {
  const level = CRUSADE_LEVELS[clamp(asInt(levelIndex), 0, CRUSADE_LEVEL_COUNT - 1)];
  return CRUSADE_ROOM_BY_ID[level.roomStart + clamp(asInt(slot), 0, CRUSADE_ROOMS_PER_LEVEL - 1)] || null;
}

export function validateCrusadeRooms(rooms = CRUSADE_ROOMS) {
  const errors = [];
  if (!Array.isArray(rooms)) return { ok: false, errors: ['CRUSADE_ROOMS is not an array'], count: 0 };
  if (rooms.length !== CRUSADE_ROOM_COUNT) errors.push(`Expected ${CRUSADE_ROOM_COUNT} rooms, got ${rooms.length}`);
  const ids = new Set();
  for (const room of rooms) {
    if (!room || typeof room !== 'object') { errors.push('Room entry is not an object'); continue; }
    if (ids.has(room.id)) errors.push(`Duplicate room id ${room.id}`);
    ids.add(room.id);
    if (!room.name) errors.push(`Room ${room.id} has no name`);
    if (!room.spawn || !Number.isFinite(room.spawn.x)) errors.push(`Room ${room.id} has an invalid spawn`);
    if (!Array.isArray(room.platforms) || !room.platforms.some((p) => p.y >= CRUSADE_FLOOR_Y - 2)) {
      errors.push(`Room ${room.id} has no floor platform`);
    }
    if (room.gate && !CRUSADE_ROOM_BY_ID[room.gate.next]) errors.push(`Room ${room.id} gate points to unknown room ${room.gate.next}`);
    for (const enemy of room.enemies || []) {
      if (!CRUSADE_ENEMY_INFO[enemy.type]) errors.push(`Room ${room.id} references unknown enemy ${enemy.type}`);
    }
    if (room.boss && !CRUSADE_BOSS_INFO[room.boss]) errors.push(`Room ${room.id} references unknown boss ${room.boss}`);
  }
  return { ok: errors.length === 0, errors, count: rooms.length };
}

// ── Valor Chain ────────────────────────────────────────────────────────────
export function createCrusadeRun({ upgrades = {}, banners = [], maxHp = 140 } = {}) {
  const up = {
    health: clamp(asInt(upgrades.health), 0, 3),
    damage: clamp(asInt(upgrades.damage), 0, 3),
    valor: clamp(asInt(upgrades.valor), 0, 3),
  };
  const bannerSet = banners.filter((id) => CRUSADE_BANNER_BY_ID[id]);
  const startValor = bannerSet.includes('banner_of_dawn') ? 2 : 0;
  return {
    upgrades: up,
    banners: bannerSet,
    maxHp: maxHp + up.health * 14,
    maxHpBase: maxHp,
    valor: startValor,
    valorMax: VALOR_MAX + up.valor * 2,
    chainBest: startValor,
    strikes: 0,
    breaks: 0,
    damageMul: 1 + up.damage * 0.08,
    parryValor: bannerSet.includes('mercy_edge') ? 2 : VALOR_PER_PARRY,
    strikeDamageBonus: bannerSet.includes('wall_breaker') ? 0.35 : 0,
    strikeShieldBonus: bannerSet.includes('siege_break') ? 0.5 : 0,
    kills: 0,
    cleared: false,
  };
}

export function valorGain(run, amount = VALOR_PER_HIT) {
  if (!run) return { gained: 0, valor: 0, full: false };
  const before = run.valor || 0;
  const gain = Math.max(0, Number(amount) || 0);
  run.valor = Math.min(run.valorMax || VALOR_MAX, before + gain);
  run.chainBest = Math.max(run.chainBest || 0, run.valor);
  return { gained: round1(run.valor - before), valor: run.valor, full: run.valor >= (run.valorMax || VALOR_MAX) - 0.001 };
}

export function valorHit(run, { parry = false, damage = 0 } = {}) {
  if (!run) return { gained: 0, valor: 0, chain: 0 };
  const gain = parry ? (run.parryValor || VALOR_PER_PARRY) : VALOR_PER_HIT + (Number(damage) || 0) * VALOR_PER_DAMAGE;
  const result = valorGain(run, gain);
  return { ...result, chain: run.valor, multiplier: valorMultiplier(run) };
}

export function valorBreak(run) {
  if (!run) return { lost: 0, valor: 0 };
  const lost = run.valor || 0;
  run.valor = 0;
  run.breaks = (run.breaks || 0) + 1;
  return { lost, valor: 0 };
}

export function valorMultiplier(run) {
  if (!run) return 1;
  return 1 + (run.valor || 0) * VALOR_PER_DAMAGE;
}

export function valorStrikeReady(run) {
  return !!run && (run.valor || 0) >= VALOR_STRIKE_MIN;
}

export function crusaderStrike(run) {
  if (!run) return { ok: false, reason: 'no_run' };
  if (!valorStrikeReady(run)) return { ok: false, reason: 'chain_low', need: VALOR_STRIKE_MIN };
  run.valor = Math.max(0, run.valor - VALOR_STRIKE_COST);
  run.strikes = (run.strikes || 0) + 1;
  return {
    ok: true,
    damage: Math.round((80 + run.upgrades.damage * 20) * (1 + (run.strikeDamageBonus || 0))),
    shieldBreak: 60 * (1 + (run.strikeShieldBonus || 0)),
    valor: run.valor,
  };
}

// The Paladin builds his own chain in phase 2; breaking it staggers him.
export function paladinChainTick(boss, dt, active = true) {
  if (!boss) return { chain: 0, gain: 0 };
  if (!active) {
    boss.chainTimer = PALADIN_CHAIN_INTERVAL;
    return { chain: boss.valorChain || 0, gain: 0 };
  }
  boss.valorChain = clamp(asInt(boss.valorChain), 0, PALADIN_CHAIN_MAX);
  boss.chainTimer = (Number(boss.chainTimer) || PALADIN_CHAIN_INTERVAL) - (Number(dt) || 0);
  if (boss.chainTimer > 0) return { chain: boss.valorChain, gain: 0 };
  boss.chainTimer += PALADIN_CHAIN_INTERVAL;
  if (boss.valorChain >= PALADIN_CHAIN_MAX) return { chain: boss.valorChain, gain: 0 };
  boss.valorChain += 1;
  return { chain: boss.valorChain, gain: 1 };
}

export function breakPaladinChain(boss) {
  if (!boss) return { broke: false, stagger: 0 };
  const chain = boss.valorChain || 0;
  boss.valorChain = 0;
  boss.chainTimer = PALADIN_CHAIN_INTERVAL;
  if (chain < 2) return { broke: false, stagger: 0, chain };
  boss.stunTimer = Math.max(boss.stunTimer || 0, 2.4);
  return { broke: true, stagger: 2.4, chain };
}

// ── progress ───────────────────────────────────────────────────────────────
export function defaultCrusadeProgress() {
  return {
    version: CRUSADE_VERSION,
    arcId: null,
    unlocked: false,
    cleared: false,
    rooms: Array.from({ length: CRUSADE_ROOM_COUNT }, () => false),
    levels: Array.from({ length: CRUSADE_LEVEL_COUNT }, () => false),
    bosses: Object.fromEntries(CRUSADE_BOSSES.map((boss) => [boss.id, false])),
    banners: [],
    sigils: 0,
    upgrades: { health: 0, damage: 0, valor: 0 },
    runs: 0,
    deaths: 0,
    bestTime: 0,
    bestChain: 0,
    strikes: 0,
    riftLocked: true,
    teaserSeen: false,
    arc4Hook: false,
    archive: { bestiary: [], bosses: [] },
  };
}

export function crusadeUnlocked(progress) {
  const fallen = progress?.fallen;
  if (!fallen || typeof fallen !== 'object') return false;
  return fallen.ending != null || Object.values(fallen.endings || {}).some(Boolean);
}

export function unlockCrusade(progress) {
  const firstTime = !progress.crusade || progress.crusade.unlocked !== true;
  if (!progress.crusade || typeof progress.crusade !== 'object') progress.crusade = defaultCrusadeProgress();
  const allowed = crusadeUnlocked(progress);
  if (allowed) {
    progress.crusade.unlocked = true;
    progress.crusade.arcId = CRUSADE_ARC_ID;
  }
  return { ok: allowed, firstTime: firstTime && allowed, unlocked: !!progress.crusade.unlocked };
}

export function sanitizeCrusadeProgress(raw) {
  const base = defaultCrusadeProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const rooms = Array.from({ length: CRUSADE_ROOM_COUNT }, (_, i) => raw.rooms?.[i] === true);
  const bosses = {};
  for (const boss of CRUSADE_BOSSES) bosses[boss.id] = raw.bosses?.[boss.id] === true;
  for (const level of CRUSADE_LEVELS) {
    const halls = Array.from({ length: CRUSADE_ROOMS_PER_LEVEL - 1 }, (_, slot) => level.roomStart + slot);
    for (let i = 1; i < halls.length; i += 1) {
      if (rooms[halls[i] - CRUSADE_ROOM_START] && !rooms[halls[i - 1] - CRUSADE_ROOM_START]) {
        rooms[halls[i] - CRUSADE_ROOM_START] = false;
      }
    }
    const bossLocal = level.bossRoom - CRUSADE_ROOM_START;
    const hallsDone = halls.every((id) => rooms[id - CRUSADE_ROOM_START]);
    if ((bosses[level.boss] || rooms[bossLocal]) && !hallsDone) {
      bosses[level.boss] = false;
      rooms[bossLocal] = false;
    }
  }
  const int = (value, min, max) => {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return min;
    return clamp(n, min, max);
  };
  const levels = CRUSADE_LEVELS.map((level) => bosses[level.boss] === true);
  const banners = Array.isArray(raw.banners)
    ? [...new Set(raw.banners.filter((id) => CRUSADE_BANNER_BY_ID[id]))]
    : [];
  // A banner can only exist if its boss fell.
  const cleanBanners = banners.filter((id) => bosses[CRUSADE_BANNER_BY_ID[id].level]);
  const bestiary = Array.isArray(raw.archive?.bestiary)
    ? [...new Set(raw.archive.bestiary.filter((id) => CRUSADE_ENEMY_INFO[id]))]
    : [];
  const seenBosses = Array.isArray(raw.archive?.bosses)
    ? [...new Set(raw.archive.bosses.filter((id) => CRUSADE_BOSS_BY_ID[id]))]
    : [];
  return {
    ...base,
    version: CRUSADE_VERSION,
    arcId: raw.arcId === CRUSADE_ARC_ID ? CRUSADE_ARC_ID : null,
    unlocked: raw.unlocked === true,
    cleared: raw.cleared === true && bosses.giant_paladin === true,
    rooms,
    levels,
    bosses,
    banners: cleanBanners,
    sigils: int(raw.sigils, 0, 9999),
    upgrades: {
      health: int(raw.upgrades?.health, 0, 3),
      damage: int(raw.upgrades?.damage, 0, 3),
      valor: int(raw.upgrades?.valor, 0, 3),
    },
    runs: int(raw.runs, 0, 99999),
    deaths: int(raw.deaths, 0, 99999),
    bestTime: Math.max(0, round1(raw.bestTime)),
    bestChain: int(raw.bestChain, 0, 99),
    strikes: int(raw.strikes, 0, 99999),
    // The rift can never be open before the Paladin falls.
    riftLocked: bosses.giant_paladin !== true ? true : raw.riftLocked !== false,
    teaserSeen: raw.teaserSeen === true,
    arc4Hook: raw.arc4Hook === true && bosses.giant_paladin === true,
    archive: { bestiary, bosses: seenBosses },
  };
}

export function crusadeLevelUnlocked(state, levelIndex) {
  const safe = sanitizeCrusadeProgress(state);
  const index = clamp(asInt(levelIndex), 0, CRUSADE_LEVEL_COUNT - 1);
  if (index === 0) return true;
  const previous = CRUSADE_LEVELS[index - 1];
  return safe.bosses[previous.boss] === true;
}

export function crusadeRoomUnlocked(state, roomId) {
  const safe = sanitizeCrusadeProgress(state);
  const room = CRUSADE_ROOM_BY_ID[roomId];
  if (!room) return false;
  const level = CRUSADE_LEVELS[room.crusadeLevel - 1];
  if (!level || !crusadeLevelUnlocked(safe, level.index)) return false;
  if (room.crusadeSlot <= 0) return true;
  return safe.rooms[level.roomStart + room.crusadeSlot - 1 - CRUSADE_ROOM_START] === true;
}

export function crusadeBossUnlocked(state, bossId) {
  const safe = sanitizeCrusadeProgress(state);
  const boss = CRUSADE_BOSS_BY_ID[bossId];
  if (!boss) return false;
  const level = CRUSADE_LEVELS[boss.levelIndex];
  if (!crusadeLevelUnlocked(safe, level.index)) return false;
  return Array.from({ length: CRUSADE_ROOMS_PER_LEVEL - 1 }, (_, slot) => level.roomStart + slot)
    .every((id) => safe.rooms[id - CRUSADE_ROOM_START] === true);
}

export function recordCrusadeRoom(state, roomId) {
  const safe = state || defaultCrusadeProgress();
  const room = CRUSADE_ROOM_BY_ID[roomId];
  if (!room || room.crusadeBoss) return { ok: false };
  const local = room.id - CRUSADE_ROOM_START;
  const firstClear = safe.rooms[local] !== true;
  safe.rooms[local] = true;
  const level = CRUSADE_LEVELS[room.crusadeLevel - 1];
  const levelDone = Array.from({ length: CRUSADE_ROOMS_PER_LEVEL - 1 }, (_, slot) => level.roomStart + slot)
    .every((id) => safe.rooms[id - CRUSADE_ROOM_START] === true);
  return { ok: true, firstClear, levelDone };
}

export function recordCrusadeBoss(state, bossId) {
  const safe = state || defaultCrusadeProgress();
  const boss = CRUSADE_BOSS_BY_ID[bossId];
  if (!boss) return { ok: false, reason: 'unknown' };
  if (!crusadeBossUnlocked(safe, bossId)) return { ok: false, reason: 'locked' };
  const firstClear = safe.bosses[bossId] !== true;
  safe.bosses[bossId] = true;
  safe.rooms[boss.roomIndex - CRUSADE_ROOM_START] = true;
  safe.levels[boss.levelIndex] = true;
  if (!safe.archive.bosses.includes(bossId)) safe.archive.bosses.push(bossId);
  const banner = CRUSADE_BANNERS.find((b) => b.level === bossId);
  if (banner && !safe.banners.includes(banner.id)) safe.banners.push(banner.id);
  if (firstClear) safe.sigils = (safe.sigils || 0) + (boss.sigils || 0);
  if (boss.final) {
    safe.cleared = true;
    safe.riftLocked = false;
    safe.arc4Hook = true;
  }
  return {
    ok: true,
    firstClear,
    banner: banner ? banner.id : null,
    sigils: firstClear ? boss.sigils : 0,
    complete: CRUSADE_MAIN_BOSSES.every((b) => safe.bosses[b.id]),
    arc4Hook: !!boss.final,
  };
}

export function recordCrusadeRoomClear(state, room) {
  if (!room) return { ok: false };
  if (room.crusadeBoss) return recordCrusadeBoss(state, room.crusadeBoss);
  return recordCrusadeRoom(state, room.id);
}

export function recordCrusadeDeath(state) {
  const safe = state || defaultCrusadeProgress();
  safe.deaths = (safe.deaths || 0) + 1;
  return { ok: true, deaths: safe.deaths };
}

export function recordCrusadeRun(state, seconds = 0, { won = false } = {}) {
  const safe = state || defaultCrusadeProgress();
  safe.runs = (safe.runs || 0) + 1;
  const time = Math.max(0, Number(seconds) || 0);
  if (won && time > 0 && (!safe.bestTime || time < safe.bestTime)) safe.bestTime = round1(time);
  return { ok: true, runs: safe.runs, bestTime: safe.bestTime };
}

export function buyCrusadeUpgrade(state, id) {
  const safe = state || defaultCrusadeProgress();
  const upgrade = CRUSADE_UPGRADE_BY_ID[id];
  if (!upgrade) return { ok: false, reason: 'unknown' };
  const tier = safe.upgrades[id] || 0;
  if (tier >= upgrade.tiers.length) return { ok: false, reason: 'maxed' };
  const cost = upgrade.tiers[tier].cost;
  if (safe.sigils < cost) return { ok: false, reason: 'sigils', cost, sigils: safe.sigils };
  safe.sigils -= cost;
  safe.upgrades[id] = tier + 1;
  return { ok: true, tier: tier + 1, cost, sigils: safe.sigils, value: upgrade.tiers[tier].value };
}

export function addCrusadeSigils(state, amount) {
  const safe = state || defaultCrusadeProgress();
  const gain = Math.max(0, Math.floor(Number(amount) || 0));
  safe.sigils = (safe.sigils || 0) + gain;
  return { ok: true, gained: gain, sigils: safe.sigils };
}

export function crusadeRunConfig(state, levelIndex) {
  const safe = sanitizeCrusadeProgress(state);
  const level = CRUSADE_LEVELS[clamp(asInt(levelIndex), 0, CRUSADE_LEVEL_COUNT - 1)];
  const run = createCrusadeRun({
    upgrades: safe.upgrades,
    banners: safe.banners,
    maxHp: 140,
  });
  return { level, run };
}

export function crusadeSummary(state) {
  const safe = sanitizeCrusadeProgress(state);
  const roomsCleared = safe.rooms.filter(Boolean).length;
  const bossesCleared = CRUSADE_BOSSES.filter((boss) => safe.bosses[boss.id]).length;
  const levelsCleared = CRUSADE_LEVELS.filter((level) => safe.bosses[level.boss]).length;
  return {
    unlocked: safe.unlocked,
    cleared: safe.cleared,
    roomsCleared,
    roomTotal: CRUSADE_ROOM_COUNT,
    bossesCleared,
    bossTotal: CRUSADE_BOSS_COUNT,
    levelsCleared,
    levelTotal: CRUSADE_LEVEL_COUNT,
    banners: safe.banners.length,
    bannerTotal: CRUSADE_BANNERS.length,
    sigils: safe.sigils,
    bestChain: safe.bestChain,
    strikes: safe.strikes,
    runs: safe.runs,
    deaths: safe.deaths,
    bestTime: safe.bestTime,
    percent: Math.round((bossesCleared / CRUSADE_BOSS_COUNT) * 100),
    arc4Hook: safe.arc4Hook,
    riftLocked: safe.riftLocked,
  };
}

export function crusadeArchive(state) {
  const safe = sanitizeCrusadeProgress(state);
  return {
    bestiary: CRUSADE_ENEMY_IDS.map((id) => ({ ...CRUSADE_ENEMY_INFO[id], seen: safe.archive.bestiary.includes(id) })),
    bosses: CRUSADE_BOSSES.map((boss) => ({ ...boss, cleared: safe.bosses[boss.id] === true })),
    banners: CRUSADE_BANNERS.map((banner) => ({ ...banner, earned: safe.banners.includes(banner.id) })),
    upgrades: CRUSADE_UPGRADES.map((upgrade) => ({ ...upgrade, tier: safe.upgrades[upgrade.id] || 0 })),
  };
}

// The war camp grows more crowded as the crusade advances.
export function crusadeCampFigure(state) {
  const safe = sanitizeCrusadeProgress(state);
  const levels = CRUSADE_LEVELS.filter((level) => safe.bosses[level.boss]).length;
  if (safe.cleared) return { pose: 'rift', color: '#8a2020', levels, banner: true };
  if (levels >= 3) return { pose: 'marching', color: '#e8c46a', levels, banner: true };
  if (levels >= 1) return { pose: 'camp', color: '#b08840', levels, banner: true };
  return { pose: 'empty', color: '#5c4a30', levels, banner: false };
}
