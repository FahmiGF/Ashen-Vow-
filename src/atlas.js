// Ashen Vow - The Sundered Atlas (v0.6.0)
// Parts V-VII of the world expansion: 8 zones, 240 rooms, story/lore,
// boss navigation data, consumables, shops, armor, charms, and 40 weapons.
// Every number in this module is a starting value meant to be balanced.

export const ATLAS_VERSION = '0.6.0';
export const ATLAS_NAME = 'Ashen Vow - The Sundered Atlas';
export const ATLAS_ROOM_START = 114;
export const ATLAS_ROOM_COUNT = 240;
export const ATLAS_ZONE_COUNT = 8;
export const ATLAS_ROOMS_PER_ZONE = 30;
export const ATLAS_LEVEL_START = 301;
export const ATLAS_LEVEL_END = 540;
export const FLOOR_Y = 470;
export const WORLD_W = 1400;

const clamp = (value, lo, hi) => (value < lo ? lo : value > hi ? hi : value);
const round = (value) => Math.round(Number(value) || 0);

// ── world tiers and ability gates ──────────────────────────────────────────
export const ATLAS_WORLD_TIERS = [
  { id: 'verdant', name: 'Verdant Reaches', localName: 'Jangkauan Hijau', level: 1, color: '#7fae5a' },
  { id: 'celestial', name: 'Celestial Reach', localName: 'Jangkauan Langit', level: 2, color: '#8f9fe8' },
  { id: 'sunken', name: 'Sunken Dominions', localName: 'Wilayah Tenggelam', level: 3, color: '#d0a45a' },
  { id: 'machine', name: 'Deep Machine', localName: 'Mesin Purba', level: 4, color: '#c47a3a' },
];

export const ATLAS_ABILITY_GATES = [
  {
    id: 'vow_dash',
    name: 'Vow of the Wind',
    localName: 'Sumpah Angin',
    desc: 'Dash menembus celah energi dan mencapai platform yang lebih tinggi.',
    source: 'vael',
  },
  {
    id: 'echo_sight',
    name: 'Echo Sight',
    localName: 'Penglihatan Gema',
    desc: 'Melihat jembatan gaib dan jejak musuh yang tak terlihat.',
    source: 'aviary',
  },
  {
    id: 'time_slow',
    name: 'Time Slow',
    localName: 'Waktu Melambat',
    desc: 'Memperlambat jebakan dan proyektil selama dua detik.',
    source: 'starfall',
  },
  {
    id: 'grave_step',
    name: 'Grave Step',
    localName: 'Langkah Kubur',
    desc: 'Berjalan di atas kabut kematian tanpa tenggelam.',
    source: 'witherwood',
  },
  {
    id: 'abyssal_breath',
    name: 'Abyssal Breath',
    localName: 'Nafas Palung',
    desc: 'Bernapas di bawah tekanan palung dan berenang melawan arus.',
    source: 'sandglass',
  },
  {
    id: 'overclock',
    name: 'Overclock',
    localName: 'Pacu Mesin',
    desc: 'Mempercepat gerbang, lift, dan mekanisme kuno.',
    source: 'catacombs',
  },
];

export const ATLAS_ABILITY_BY_ID = Object.fromEntries(
  ATLAS_ABILITY_GATES.map((ability) => [ability.id, ability]),
);

// ── zones ──────────────────────────────────────────────────────────────────
const ZONE_SOURCE = [
  {
    id: 'vael',
    name: 'Vael Gardens',
    localName: 'Taman Vael',
    tier: 'verdant',
    subtitle: 'Taman Sumpah yang Bernapas',
    color: '#7fae5a',
    accent: '#e0c46a',
    glow: '#b8e07a',
    fog: '#2f4a2a',
    hazard: { type: 'spore', name: 'Spora Duri', dmg: 12, period: 3.4 },
    hero: 'Pohon Sumpah raksasa dengan akar menjulang dan lonceng kaca yang bergantung di dahannya.',
    musicMood: 'string pastoral, choir rendah, dan gemerisik daun',
    requires: [],
    gateReward: 'vow_dash',
    enemies: ['vael_thorn_stalker', 'vael_pollen_wisp', 'vael_rootback'],
    boss: 'atlas_boss_vael',
    miniBoss: 'atlas_mini_vael',
    palette: { top: '#07140b', mid: '#12281a', low: '#1d3a24' },
  },
  {
    id: 'aviary',
    name: 'Gilded Aviary',
    localName: 'Kandang Emas',
    tier: 'verdant',
    subtitle: 'Katedral Burung di Atas Awan',
    color: '#d0b45a',
    accent: '#7fc9e8',
    glow: '#ffe2a8',
    fog: '#4a4028',
    hazard: { type: 'wind', name: 'Hembusan Sayap', dmg: 10, period: 4.2 },
    hero: 'Sangkar katedral raksasa yang melayang, dihuni burung-burung bersayap emas.',
    musicMood: 'harpsichord, paduan suara tinggi, dan kepakan sayap',
    requires: [],
    gateReward: 'echo_sight',
    enemies: ['aviary_gilded_harpy', 'aviary_cage_warden', 'aviary_songkeeper'],
    boss: 'atlas_boss_aviary',
    miniBoss: 'atlas_mini_aviary',
    palette: { top: '#141007', mid: '#2a2110', low: '#3a2d16' },
  },
  {
    id: 'starfall',
    name: 'Starfall Observatory',
    localName: 'Observatorium Bintang Jatuh',
    tier: 'celestial',
    subtitle: 'Orrery yang Retak',
    color: '#8f9fe8',
    accent: '#7fe8ff',
    glow: '#b8c8ff',
    fog: '#202a4a',
    hazard: { type: 'saw', name: 'Serpihan Meteor', dmg: 16, period: 3.0 },
    hero: 'Orrery raksasa yang retak, dengan bola-bola bintang berputar di ruang tanpa gravitasi.',
    musicMood: 'synth ethereal, lonceng kaca, dan drone bintang',
    requires: ['vow_dash', 'echo_sight'],
    gateReward: 'time_slow',
    enemies: ['starfall_astral_seer', 'starfall_comet_hound', 'starfall_void_acolyte'],
    boss: 'atlas_boss_starfall',
    miniBoss: 'atlas_mini_starfall',
    palette: { top: '#060818', mid: '#101a3a', low: '#1a2850' },
  },
  {
    id: 'witherwood',
    name: 'Witherwood',
    localName: 'Hutan Layu',
    tier: 'celestial',
    subtitle: 'Hutan yang Tidak Mau Mati',
    color: '#8a6a3a',
    accent: '#b86a4a',
    glow: '#d09a5a',
    fog: '#2a2018',
    hazard: { type: 'fog', name: 'Kabut Pembusukan', dmg: 9, period: 5.0 },
    hero: 'Pohon kolosal yang telah mati, dengan akar seperti tulang dan daun yang jatuh ke atas.',
    musicMood: 'cello rendah, bisikan, dan ketukan kayu',
    requires: ['vow_dash', 'echo_sight'],
    gateReward: 'grave_step',
    enemies: ['witherwood_blight_wraith', 'witherwood_hollow_stag', 'witherwood_fungal_pilgrim'],
    boss: 'atlas_boss_witherwood',
    miniBoss: 'atlas_mini_witherwood',
    palette: { top: '#0d0906', mid: '#1f1610', low: '#302218' },
  },
  {
    id: 'sandglass',
    name: 'Sandglass Wastes',
    localName: 'Gurun Jam Pasir',
    tier: 'sunken',
    subtitle: 'Gurun yang Menghitung Mundur',
    color: '#d0a45a',
    accent: '#5fc9b8',
    glow: '#ffe2a8',
    fog: '#4a3a20',
    hazard: { type: 'wind', name: 'Badai Pasir Waktu', dmg: 14, period: 3.8 },
    hero: 'Jam pasir raksasa terbalik, mengalirkan pasir ke atas menuju langit.',
    musicMood: 'perkusi gurun, suling, dan detak jam',
    requires: ['time_slow', 'grave_step'],
    gateReward: 'abyssal_breath',
    enemies: ['sandglass_chrono_jackal', 'sandglass_revenant', 'sandglass_mirage_archer'],
    boss: 'atlas_boss_sandglass',
    miniBoss: 'atlas_mini_sandglass',
    palette: { top: '#1a1206', mid: '#33240e', low: '#4a3414' },
  },
  {
    id: 'catacombs',
    name: 'Catacombs of the Faithless',
    localName: 'Katakombe Tanpa Iman',
    tier: 'sunken',
    subtitle: 'Katedral Terbalik di Bawah Tanah',
    color: '#b8a486',
    accent: '#e0c46a',
    glow: '#ffe2a8',
    fog: '#2a2418',
    hazard: { type: 'saw', name: 'Lonceng Penebusan', dmg: 18, period: 2.8 },
    hero: 'Katedral terbalik yang menggantung dari langit-langit gua, dengan lonceng tulang.',
    musicMood: 'organ rendah, paduan suara tanpa kata, dan dentang tulang',
    requires: ['time_slow', 'grave_step'],
    gateReward: 'overclock',
    enemies: ['catacombs_faithless_choir', 'catacombs_bone_collector', 'catacombs_penitent_knight'],
    boss: 'atlas_boss_catacombs',
    miniBoss: 'atlas_mini_catacombs',
    palette: { top: '#0b0906', mid: '#1d1810', low: '#2e2618' },
  },
  {
    id: 'abyss',
    name: 'Abyssal Deep',
    localName: 'Palung Abyssal',
    tier: 'machine',
    subtitle: 'Kerangka Leviathan di Dasar Dunia',
    color: '#3f8fa8',
    accent: '#62e8d8',
    glow: '#8fe8ff',
    fog: '#0a2a3a',
    hazard: { type: 'fog', name: 'Tekanan Palung', dmg: 20, period: 4.6 },
    hero: 'Kerangka leviathan raksasa yang tenggelam, dikelilingi ubur-ubur bercahaya.',
    musicMood: 'drone dalam, nyanyian paus, dan gelembung',
    requires: ['abyssal_breath', 'overclock'],
    gateReward: null,
    enemies: ['abyss_lurker', 'abyss_lantern_jelly', 'abyss_trench_priest'],
    boss: 'atlas_boss_abyss',
    miniBoss: 'atlas_mini_abyss',
    palette: { top: '#02080e', mid: '#061a26', low: '#0a2a3a' },
  },
  {
    id: 'foundry',
    name: 'Clockwork Foundry',
    localName: 'Pengecoran Mesin',
    tier: 'machine',
    subtitle: 'Tungku yang Menempa Waktu',
    color: '#c47a3a',
    accent: '#e0c46a',
    glow: '#ffb066',
    fog: '#3a2414',
    hazard: { type: 'saw', name: 'Piston Raksasa', dmg: 22, period: 2.4 },
    hero: 'Roda gigi planet raksasa dan lengan piston yang menempa bintang-bintang kecil.',
    musicMood: 'perkusi industri, paduan suara tembaga, dan detak mesin',
    requires: ['abyssal_breath', 'overclock'],
    gateReward: null,
    enemies: ['foundry_gear_sentinel', 'foundry_forge_automaton', 'foundry_chrono_smith'],
    boss: 'atlas_boss_foundry',
    miniBoss: 'atlas_mini_foundry',
    palette: { top: '#140b04', mid: '#2a1808', low: '#3a2410' },
  },
];

export const ATLAS_ZONES = ZONE_SOURCE.map((zone, index) => ({
  ...zone,
  index,
  levelStart: ATLAS_LEVEL_START + index * ATLAS_ROOMS_PER_ZONE,
  levelEnd: ATLAS_LEVEL_START + (index + 1) * ATLAS_ROOMS_PER_ZONE - 1,
  roomStart: ATLAS_ROOM_START + index * ATLAS_ROOMS_PER_ZONE,
  roomEnd: ATLAS_ROOM_START + (index + 1) * ATLAS_ROOMS_PER_ZONE - 1,
}));

export const ATLAS_ZONE_BY_ID = Object.fromEntries(ATLAS_ZONES.map((zone) => [zone.id, zone]));

// ── enemies ────────────────────────────────────────────────────────────────
const ENEMY_NAMES = {
  vael: [
    ['thorn_stalker', 'Thornbound Stalker', 'Pemburu Duri', 'chaser', '#8fae5a'],
    ['pollen_wisp', 'Pollen Wisp', 'Api Spora', 'ranged', '#e0e07a'],
    ['rootback', 'Rootback Brute', 'Raksasa Akar', 'slam', '#6a8a4a'],
  ],
  aviary: [
    ['gilded_harpy', 'Gilded Harpy', 'Harpy Emas', 'chaser', '#e0c46a'],
    ['cage_warden', 'Cage Warden', 'Penjaga Sangkar', 'lunge', '#c4a45a'],
    ['songkeeper', 'Songkeeper', 'Penyimpan Nyanyi', 'ranged', '#7fc9e8'],
  ],
  starfall: [
    ['astral_seer', 'Astral Seer', 'Pelihat Bintang', 'ranged', '#8f9fe8'],
    ['comet_hound', 'Comet Hound', 'Anjing Komet', 'chaser', '#7fe8ff'],
    ['void_acolyte', 'Void Acolyte', 'Akolat Void', 'lunge', '#b08ae0'],
  ],
  witherwood: [
    ['blight_wraith', 'Blight Wraith', 'Arwah Busuk', 'ranged', '#8a6a3a'],
    ['hollow_stag', 'Hollow Stag', 'Rusa Berongga', 'charge', '#b86a4a'],
    ['fungal_pilgrim', 'Fungal Pilgrim', 'Peziarah Jamur', 'slam', '#7a8a4a'],
  ],
  sandglass: [
    ['chrono_jackal', 'Chrono Jackal', 'Jakal Waktu', 'chaser', '#d0a45a'],
    ['revenant', 'Sand Revenant', 'Revenan Pasir', 'slam', '#b88a4a'],
    ['mirage_archer', 'Mirage Archer', 'Pemanah Fatamorgana', 'ranged', '#5fc9b8'],
  ],
  catacombs: [
    ['faithless_choir', 'Faithless Choir', 'Paduan Tanpa Iman', 'ranged', '#b8a486'],
    ['bone_collector', 'Bone Collector', 'Pengumpul Tulang', 'lunge', '#e0c46a'],
    ['penitent_knight', 'Penitent Knight', 'Ksatria Penebus', 'slam', '#c4b49a'],
  ],
  abyss: [
    ['lurker', 'Abyss Lurker', 'Pengintai Palung', 'chaser', '#3f8fa8'],
    ['lantern_jelly', 'Lantern Jelly', 'Ubur Lentera', 'ranged', '#62e8d8'],
    ['trench_priest', 'Trench Priest', 'Pendeta Palung', 'spawner', '#8fe8ff'],
  ],
  foundry: [
    ['gear_sentinel', 'Gear Sentinel', 'Sentinel Roda Gigi', 'lunge', '#c47a3a'],
    ['forge_automaton', 'Forge Automaton', 'Automaton Tungku', 'slam', '#e0a45a'],
    ['chrono_smith', 'Chrono Smith', 'Penempa Waktu', 'ranged', '#e0c46a'],
  ],
};

const ENEMY_BEHAVIOR = {
  chaser: 'chaser',
  lunge: 'lunge',
  ranged: 'ranged',
  slam: 'slam',
  charge: 'lunge',
  spawner: 'spawner',
};

export const ATLAS_ENEMY_INFO = {};
ZONE_SOURCE.forEach((zone, zoneIndex) => {
  ENEMY_NAMES[zone.id].forEach(([key, name, localName, behavior, color], index) => {
    const id = `${zone.id}_${key}`;
    const tier = ATLAS_WORLD_TIERS.find((entry) => entry.id === zone.tier)?.level || 1;
    ATLAS_ENEMY_INFO[id] = {
      id,
      name,
      localName,
      title: localName,
      chapter: zoneIndex + 1,
      atlasZone: zone.id,
      behavior: ENEMY_BEHAVIOR[behavior] || 'chaser',
      hp: 48 + zoneIndex * 22 + index * 16,
      dmg: 7 + zoneIndex * 2 + index * 2,
      speed: 66 + zoneIndex * 4 + index * 6,
      w: 42 + (index % 2) * 8,
      h: 34 + index * 8,
      reward: 10 + zoneIndex * 4 + index * 3,
      flying: behavior === 'ranged',
      danger: ['RENDAH', 'SEDANG', 'TINGGI', 'EKSTREM'][Math.min(3, Math.floor(zoneIndex / 2))],
      color,
      desc: `${localName} dari ${zone.localName}, diperkuat oleh sisa-sisa Sumpah yang retak.`,
      where: `${zone.name} - Tier ${tier}`,
      glyph: ['◆', '✦', '✹'][index % 3],
    };
  });
});

// ── bosses ─────────────────────────────────────────────────────────────────
const BOSS_SOURCE = [
  ['atlas_boss_vael', 'Sylva Vael', 'The Verdant Matriarch', 'summon', 'walker', 640, 132, '#7fae5a', 2],
  ['atlas_boss_aviary', 'Caelum', 'The Gilded Regent', 'volley', 'flyer', 720, 110, '#d0b45a', 3],
  ['atlas_boss_starfall', 'Orrery of Nul', 'The Fallen Constellation', 'rain', 'flyer', 760, 118, '#8f9fe8', 3],
  ['atlas_boss_witherwood', 'Corvus', 'The Withering King', 'slam', 'walker', 820, 140, '#8a6a3a', 2],
  ['atlas_boss_sandglass', 'Sahra', 'The Hourglass Tyrant', 'charge', 'dasher', 700, 124, '#d0a45a', 3],
  ['atlas_boss_catacombs', 'Malachai', 'The Unfaithful Cardinal', 'ring', 'walker', 780, 136, '#b8a486', 3],
  ['atlas_boss_abyss', 'Nyx', 'The Leviathan Below', 'volley', 'swimmer', 900, 128, '#3f8fa8', 3],
  ['atlas_boss_foundry', 'Aureus', 'The Prime Engine', 'summon', 'walker', 960, 150, '#c47a3a', 3],
];

const BOSS_LINES = {
  vael: ['Taman ini bernapas karena janjimu. Jangan berhenti sekarang.', 'Akar-akarku mengingat setiap nama yang kau lupakan.', 'Akhirnya... taman bisa tidur...'],
  aviary: ['Setiap burung di sini pernah bebas. Aku hanya memberi mereka sangkar yang lebih indah.', 'Sayapku memotong angin. Sayapmu hanya mengikuti.', 'Langit... milik semua...'],
  starfall: ['Aku melihat setiap kemungkinan. Kau hanya satu di antaranya.', 'Bintang-bintang jatuh karena aku memintanya.', 'Konstelasi... padam...'],
  witherwood: ['Hutan ini tidak mati. Ia hanya berhenti menunggu.', 'Setiap akar adalah tangan yang menarikmu ke bawah.', 'Akhirnya... diam...'],
  sandglass: ['Waktumu sudah habis sejak kau lahir.', 'Pasir ini menghitung setiap langkahmu.', 'Jam... berhenti...'],
  catacombs: ['Iman tanpa keraguan adalah ruang kosong. Aku mengisinya.', 'Lonceng ini memanggil semua yang pernah kau korbankan.', 'Aku... percaya... akhirnya...'],
  abyss: ['Palung tidak pernah tidur. Ia hanya menunggu tamu.', 'Tekanan ini akan meremukkan namamu.', 'Ombak... membawaku...'],
  foundry: ['Aku menempa waktu menjadi jarum. Kau hanya bahan bakar.', 'Setiap roda gigi di sini adalah detak jantung seorang raja.', 'Mesin... berhenti...'],
};

export const ATLAS_BOSS_INFO = {};
ZONE_SOURCE.forEach((zone, zoneIndex) => {
  const [kind, name, title, pattern, movement, maxHp, contact, color, maxPhases] = BOSS_SOURCE[zoneIndex];
  const miniKind = `atlas_mini_${zone.id}`;
  const miniName = `${zone.localName} Guardian`;
  const miniTitle = `Penjaga ${zone.name}`;
  const lines = BOSS_LINES[zone.id] || ['Kau berani masuk ke wilayahku.', 'Aku akan mengingat namamu.', 'Akhirnya...'];
  const base = {
    atlas: true,
    atlasZone: zone.id,
    chapter: zoneIndex + 1,
    color,
    pattern,
    movement,
    spawn: { x: 760, y: FLOOR_Y - 128 },
    dialogue: {
      intro: [
        { speaker: name, text: lines[0] },
        { speaker: 'The Oathbound', text: 'Aku datang untuk menutup luka yang kau buka.' },
      ],
      phase2: [{ speaker: name, text: lines[1] }],
      phase3: maxPhases >= 3 ? [{ speaker: name, text: 'Kau masih berdiri. Baik. Aku akan menunjukkan wujud sebenarnya.' }] : [],
      defeat: [
        { speaker: name, text: lines[2] },
        { speaker: 'The Oathbound', text: 'Atlas mencatat namamu.' },
      ],
    },
    glyph: ['✹', '✦', '◆', '⛧', '⌛', '♱', '≋', '⚙'][zoneIndex],
  };
  ATLAS_BOSS_INFO[kind] = {
    ...base,
    kind,
    name,
    title,
    maxHp,
    w: 104 + (zoneIndex % 3) * 10,
    h: 124 + (zoneIndex % 2) * 16,
    contact,
    ashReward: 120 + zoneIndex * 40,
    echoReward: 60 + zoneIndex * 22,
    reward: zoneIndex === 7 ? 'victory' : 'blessing',
    maxPhases,
    phaseThresholds: maxPhases >= 3 ? [0.66, 0.33] : [0.5],
    abilities: zone.gateReward ? [zone.gateReward] : [],
    atlasFinal: zoneIndex === 7,
  };
  ATLAS_BOSS_INFO[miniKind] = {
    ...base,
    kind: miniKind,
    name: miniName,
    title: miniTitle,
    maxHp: Math.round(maxHp * 0.42),
    w: 82,
    h: 96,
    contact: Math.max(8, contact - 3),
    ashReward: 45 + zoneIndex * 16,
    echoReward: 22 + zoneIndex * 8,
    reward: 'blessing',
    maxPhases: 2,
    phaseThresholds: [0.5],
    mini: true,
    abilities: [],
    atlasFinal: false,
  };
});

// ── rooms ──────────────────────────────────────────────────────────────────
const ROOM_TEMPLATES = [
  'entry', 'combat', 'traversal', 'combat', 'puzzle', 'elite', 'combat', 'traversal', 'tower', 'combat',
  'rest', 'combat', 'traversal', 'elite', 'combat', 'puzzle', 'tower', 'combat', 'traversal', 'combat',
  'rest', 'combat', 'elite', 'secret', 'miniBoss', 'tower', 'tower', 'combat', 'traversal', 'boss',
];

const ROOM_NAMES = {
  entry: ['Gerbang', 'Ambang', 'Pintu Masuk'],
  combat: ['Aula Tempur', 'Lorong Abu', 'Ruang Terbuka', 'Panggung', 'Jalan Sempit'],
  traversal: ['Jembatan', 'Tangga Gantung', 'Celah', 'Lintasan', 'Reruntuhan'],
  puzzle: ['Segel', 'Teka-Teki', 'Altar Terkunci', 'Ruang Relik'],
  elite: ['Arena Elite', 'Penjaga', 'Ruang Berdarah'],
  rest: ['Tempat Peristirahatan', 'Warung', 'Kemah'],
  tower: ['Menara', 'Lantai Menara', 'Puncak Menara'],
  secret: ['Relung Rahasia', 'Ruang Tersembunyi', 'Arsip Terkubur'],
  miniBoss: ['Penjaga Wilayah', 'Arena Mini', 'Gerbang Bos'],
  boss: ['Singgasana', 'Arena Bos', 'Puncak Wilayah'],
};

function platformsFor(template, seed) {
  const wobble = (seed % 3) * 10;
  if (template === 'entry' || template === 'rest') {
    return [
      { x: 0, y: FLOOR_Y, w: 1400, h: 70 },
      { x: 260, y: 360, w: 180, h: 18 },
      { x: 980, y: 340, w: 190, h: 18 },
    ];
  }
  if (template === 'boss' || template === 'miniBoss') {
    return [
      { x: 0, y: FLOOR_Y, w: 1400, h: 70 },
      { x: 160, y: 360 - wobble, w: 210, h: 18 },
      { x: 590, y: 310, w: 230, h: 18 },
      { x: 1040, y: 360 + wobble, w: 200, h: 18 },
      { x: 430, y: 240, w: 160, h: 18 },
    ];
  }
  if (template === 'traversal' || template === 'tower') {
    return [
      { x: 0, y: FLOOR_Y, w: 320, h: 70 },
      { x: 400, y: 410 - wobble, w: 170, h: 18 },
      { x: 650, y: 330, w: 160, h: 18 },
      { x: 890, y: 400 + wobble, w: 170, h: 18 },
      { x: 1140, y: 330, w: 260, h: 70 },
      { x: 520, y: 240, w: 150, h: 18 },
    ];
  }
  if (template === 'puzzle') {
    return [
      { x: 0, y: FLOOR_Y, w: 1400, h: 70 },
      { x: 260, y: 380, w: 150, h: 18 },
      { x: 500, y: 300, w: 150, h: 18 },
      { x: 760, y: 220, w: 160, h: 18 },
      { x: 1060, y: 300, w: 180, h: 18 },
    ];
  }
  if (template === 'secret') {
    return [
      { x: 0, y: FLOOR_Y, w: 1400, h: 70 },
      { x: 360, y: 350, w: 170, h: 18 },
      { x: 820, y: 320, w: 180, h: 18 },
    ];
  }
  return [
    { x: 0, y: FLOOR_Y, w: 560, h: 70 },
    { x: 730, y: FLOOR_Y, w: 670, h: 70 },
    { x: 180, y: 360 - wobble, w: 180, h: 18 },
    { x: 470, y: 300, w: 180, h: 18 },
    { x: 900, y: 370 + wobble, w: 170, h: 18 },
    { x: 1130, y: 300, w: 180, h: 18 },
  ];
}

function enemiesFor(zone, template, local, global) {
  if (template === 'entry' || template === 'rest' || template === 'secret') return [];
  const list = [];
  const count = template === 'elite' ? 1 : template === 'boss' || template === 'miniBoss' ? 0 : 2 + (local % 2);
  for (let i = 0; i < count; i++) {
    const type = zone.enemies[(local + i) % zone.enemies.length];
    const x = 380 + i * 300 + ((global * 37) % 90);
    list.push({
      type,
      x: clamp(x, 300, 1180),
      minX: clamp(x - 140, 220, 1160),
      maxX: clamp(x + 150, 360, 1320),
      variant: template === 'elite' ? 'elder' : i === 0 ? 'young' : 'mature',
    });
  }
  return list;
}

function roomGate(zone, local, global) {
  if (templateIsBoss(local)) {
    const nextZone = ATLAS_ZONES[zone.index + 1];
    return {
      x: 1362,
      y: 286,
      w: 34,
      h: 184,
      requires: 'boss',
      next: nextZone ? nextZone.roomStart : null,
      name: nextZone ? nextZone.name : 'Akhir Atlas',
      abilities: nextZone ? [...nextZone.requires] : [],
    };
  }
  if (local === 22) {
    return {
      x: 1362,
      y: 286,
      w: 34,
      h: 184,
      requires: 'clear',
      next: global + 2,
      name: 'Arena Mini',
    };
  }
  return {
    x: 1362,
    y: 286,
    w: 34,
    h: 184,
    requires: local === 4 || local === 15 ? 'relic' : 'clear',
    next: global + 1,
    name: 'Jalan Berikutnya',
  };
}

function templateIsBoss(local) {
  return local === 29;
}

function makeRoom(zone, local) {
  const template = ROOM_TEMPLATES[local];
  const global = zone.roomStart + local;
  const namePool = ROOM_NAMES[template] || ROOM_NAMES.combat;
  const name = `${namePool[local % namePool.length]} ${zone.localName}`;
  const platforms = platformsFor(template, local + zone.index);
  const isBoss = template === 'boss';
  const isMini = template === 'miniBoss';
  const relic = template === 'puzzle' || template === 'secret'
    ? { x: 1160, y: 240, w: 26, h: 26, name: `Relik ${zone.localName}` }
    : null;
  const room = {
    id: global,
    atlas: true,
    atlasZone: zone.id,
    atlasZoneIndex: zone.index,
    atlasLocal: local,
    atlasTemplate: template,
    level: zone.levelStart + local,
    name,
    subtitle: `${zone.name} - ${template.toUpperCase()}`,
    accent: zone.accent,
    spawn: { x: 80, y: FLOOR_Y - 46 },
    platforms,
    enemies: enemiesFor(zone, template, local, global),
    relic,
    boss: isBoss ? zone.boss : isMini ? zone.miniBoss : null,
    hint: isBoss
      ? `${ATLAS_BOSS_INFO[zone.boss].name} menanti. Manfaatkan platform dan celah serangannya.`
      : isMini
        ? `Penjaga wilayah: ${ATLAS_BOSS_INFO[zone.miniBoss].name}.`
        : template === 'puzzle'
          ? 'Ambil relik di platform tertinggi untuk membuka segel.'
          : 'Bersihkan ruang dan lanjutkan perjalanan.',
    hazards: template === 'combat' || template === 'traversal' || template === 'tower'
      ? [{ ...zone.hazard, x: 520 + (local % 3) * 120, y: 380, w: 120, h: 90, originX: 640, range: 300, speed: 130 }]
      : [],
    palette: { ...zone.palette, glow: zone.glow, fog: zone.fog },
    music: `atlas_${zone.id}`,
    condition: zone.subtitle,
    weather: zone.musicMood,
    gate: roomGate(zone, local, global),
  };
  if (template === 'entry' || template === 'rest' || local === 10 || local === 20) {
    room.checkpoint = { x: 70, y: FLOOR_Y - 78, w: 38, h: 78, name: `Warung ${zone.localName}` };
    room.merchant = { x: 150, y: FLOOR_Y - 96, w: 46, h: 96 };
  }
  if (local === 22) {
    room.gates = [
      { x: 1362, y: 286, w: 34, h: 184, requires: 'clear', next: global + 2, name: 'Arena Mini' },
      { x: 24, y: 286, w: 34, h: 184, requires: 'clear', next: global + 1, name: 'Relung Rahasia', secret: true },
    ];
  }
  return room;
}

export const ATLAS_ROOMS = ATLAS_ZONES.flatMap((zone) =>
  Array.from({ length: ATLAS_ROOMS_PER_ZONE }, (_, local) => makeRoom(zone, local)),
);

export const ATLAS_ROOM_BY_ID = Object.fromEntries(ATLAS_ROOMS.map((room) => [room.id, room]));

export function atlasZoneForRoom(roomIndex) {
  const local = Number(roomIndex) - ATLAS_ROOM_START;
  if (!Number.isInteger(local) || local < 0 || local >= ATLAS_ROOM_COUNT) return null;
  return ATLAS_ZONES[Math.floor(local / ATLAS_ROOMS_PER_ZONE)] || null;
}

export function atlasRoomLocalIndex(roomIndex) {
  const local = Number(roomIndex) - ATLAS_ROOM_START;
  return Number.isInteger(local) && local >= 0 && local < ATLAS_ROOM_COUNT ? local : null;
}

export function atlasRoomForZone(zoneId, local = 0) {
  const zone = ATLAS_ZONE_BY_ID[zoneId];
  if (!zone) return null;
  return ATLAS_ROOM_BY_ID[zone.roomStart + clamp(Math.floor(local), 0, ATLAS_ROOMS_PER_ZONE - 1)] || null;
}

/**
 * Validate room standards. Returns structured errors and warnings instead of
 * throwing so the editor and CI can show every problem at once.
 */
export function validateAtlasRooms(rooms = ATLAS_ROOMS) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  if (!Array.isArray(rooms)) {
    return { ok: false, errors: ['ATLAS_ROOMS is not an array'], warnings, count: 0 };
  }
  if (rooms.length !== ATLAS_ROOM_COUNT) {
    errors.push(`Expected ${ATLAS_ROOM_COUNT} rooms, got ${rooms.length}`);
  }
  for (const room of rooms) {
    if (!room || typeof room !== 'object') {
      errors.push('Room entry is not an object');
      continue;
    }
    if (ids.has(room.id)) errors.push(`Duplicate room id ${room.id}`);
    ids.add(room.id);
    if (!room.name) errors.push(`Room ${room.id} has no name`);
    if (!room.spawn || !Number.isFinite(room.spawn.x) || !Number.isFinite(room.spawn.y)) {
      errors.push(`Room ${room.id} has an invalid spawn`);
    }
    if (!Array.isArray(room.platforms) || room.platforms.length === 0) {
      errors.push(`Room ${room.id} has no platforms`);
    } else {
      const floor = room.platforms.some((platform) => platform.y >= FLOOR_Y - 2);
      if (!floor) warnings.push(`Room ${room.id} has no floor-level platform`);
    }
    if (!room.gate && !Array.isArray(room.gates)) errors.push(`Room ${room.id} has no gate`);
    for (const enemy of room.enemies || []) {
      if (!ATLAS_ENEMY_INFO[enemy.type]) errors.push(`Room ${room.id} references unknown enemy ${enemy.type}`);
      if (!Number.isFinite(enemy.x)) errors.push(`Room ${room.id} enemy ${enemy.type} has no x`);
    }
    if (room.boss && !ATLAS_BOSS_INFO[room.boss]) errors.push(`Room ${room.id} references unknown boss ${room.boss}`);
    if (room.atlasTemplate === 'boss' && !room.boss) errors.push(`Boss room ${room.id} has no boss`);
    if (room.atlasTemplate === 'puzzle' && !room.relic) errors.push(`Puzzle room ${room.id} has no relic`);
    const gates = room.gates || (room.gate ? [room.gate] : []);
    for (const gate of gates) {
      if (gate.next != null) {
        const target = ATLAS_ROOM_BY_ID[gate.next];
        if (!target) errors.push(`Room ${room.id} gate points to unknown room ${gate.next}`);
      }
    }
  }
  for (const zone of ATLAS_ZONES) {
    const zoneRooms = rooms.filter((room) => room.atlasZone === zone.id);
    if (zoneRooms.length !== ATLAS_ROOMS_PER_ZONE) {
      errors.push(`Zone ${zone.id} has ${zoneRooms.length} rooms, expected ${ATLAS_ROOMS_PER_ZONE}`);
    }
    if (!zoneRooms.some((room) => room.atlasTemplate === 'boss')) {
      errors.push(`Zone ${zone.id} has no boss room`);
    }
  }
  return { ok: errors.length === 0, errors, warnings, count: rooms.length };
}

// ── story ──────────────────────────────────────────────────────────────────
export const ATLAS_TIMELINE = [
  { id: 'timeline_1', year: 'Sebelum Sumpah', title: 'Langit Pertama', text: 'Dunia belum punya nama. Atlas pertama mencatat semua yang hidup di satu halaman.' },
  { id: 'timeline_2', year: 'Tahun 0', title: 'Sumpah Pertama', text: 'Tujuh penjaga bersumpah menjaga Atlas. Salah satu dari mereka menulis nama sendiri di halaman kosong.' },
  { id: 'timeline_3', year: 'Tahun 212', title: 'Perang Taman', text: 'Vael Gardens tumbuh dari darah penjaga yang gugur. Akar pertama belajar mengingat.' },
  { id: 'timeline_4', year: 'Tahun 480', title: 'Kandang Emas', text: 'Aviary dibangun untuk menyimpan burung-burung yang tidak boleh lagi terbang.' },
  { id: 'timeline_5', year: 'Tahun 803', title: 'Bintang Jatuh', text: 'Observatorium retak. Satu konstelasi jatuh ke dunia dan menjadi pintu ke Witherwood.' },
  { id: 'timeline_6', year: 'Tahun 1104', title: 'Waktu Terbalik', text: 'Jam pasir Sandglass dibalik oleh tangan yang tidak terlihat. Waktu mulai berjalan mundur di perbatasan.' },
  { id: 'timeline_7', year: 'Tahun 1450', title: 'Iman Terakhir', text: 'Katakombe dibangun untuk mengubur keyakinan yang tidak lagi ingin didengar.' },
  { id: 'timeline_8', year: 'Sekarang', title: 'Atlas Terbelah', text: 'Halaman-halaman Atlas lepas dari jilidnya. Setiap zona menjadi dunia yang menolak dibaca.' },
];

export const ATLAS_CHARACTERS = [
  { id: 'char_sera', name: 'Sera', role: 'The Oathbound', desc: 'Pemegang Sumpah yang menolak menjadi halaman terakhir.', color: '#d07a35' },
  { id: 'char_vael', name: 'Sylva Vael', role: 'The Verdant Matriarch', desc: 'Penjaga taman yang tumbuh dari kenangan para pemberontak.', color: '#7fae5a' },
  { id: 'char_caelum', name: 'Caelum', role: 'The Gilded Regent', desc: 'Raja burung yang percaya sangkar adalah bentuk kasih sayang.', color: '#d0b45a' },
  { id: 'char_nul', name: 'Orrery of Nul', role: 'The Fallen Constellation', desc: 'Mesin ramalan yang menghitung semua kemungkinan kecuali harapan.', color: '#8f9fe8' },
  { id: 'char_corvus', name: 'Corvus', role: 'The Withering King', desc: 'Raja hutan yang menolak mati karena belum ada yang memaafkannya.', color: '#8a6a3a' },
  { id: 'char_sahra', name: 'Sahra', role: 'The Hourglass Tyrant', desc: 'Ratu gurun yang memperdagangkan detik-detik yang tersisa.', color: '#d0a45a' },
  { id: 'char_malachai', name: 'Malachai', role: 'The Unfaithful Cardinal', desc: 'Pendeta yang mengubur imannya sendiri di katakombe.', color: '#b8a486' },
  { id: 'char_aureus', name: 'Aureus', role: 'The Prime Engine', desc: 'Mesin pertama yang menempa waktu menjadi roda gigi.', color: '#c47a3a' },
];

export const ATLAS_CHAPTERS = ATLAS_ZONES.map((zone, index) => ({
  id: `chapter_${index + 1}`,
  number: index + 1,
  zone: zone.id,
  title: zone.name,
  localTitle: zone.localName,
  levelStart: zone.levelStart,
  levelEnd: zone.levelEnd,
  boss: zone.boss,
  summary: `${zone.subtitle}. ${zone.hero}`,
  hook: index === 0
    ? 'Atlas retak dan halaman pertama menolak ditutup.'
    : `Jejak ${ATLAS_ZONES[index - 1].name} membuka jalan menuju ${zone.name}.`,
}));

export const ATLAS_ENDINGS = [
  {
    id: 'ending_mend',
    name: 'The Mended Vow',
    localName: 'Sumpah yang Dipulihkan',
    requirement: 'Kalahkan Prime Engine dan kumpulkan semua 11 kategori lore.',
    desc: 'Atlas dijahit kembali, tetapi setiap nama yang pernah kau tulis tetap hidup di dalamnya.',
    color: '#e0c46a',
  },
  {
    id: 'ending_erase',
    name: 'The Blank Page',
    localName: 'Halaman Kosong',
    requirement: 'Kalahkan Prime Engine tanpa menyelesaikan satu pun kategori lore.',
    desc: 'Kau menghapus Atlas dan membebaskan dunia dari catatan. Tidak ada yang mengingatmu.',
    color: '#b8c8ff',
  },
  {
    id: 'ending_rule',
    name: 'The New Cartographer',
    localName: 'Pembuat Peta Baru',
    requirement: 'Kalahkan Prime Engine dengan semua ability gate terbuka.',
    desc: 'Kau mengambil pena Atlas dan menulis ulang dunia menurut versimu sendiri.',
    color: '#d07a35',
  },
  {
    id: 'ending_break',
    name: 'The Broken Compass',
    localName: 'Kompas yang Retak',
    requirement: 'Kalahkan Prime Engine setelah mengalahkan semua bos opsional.',
    desc: 'Atlas pecah menjadi seribu dunia kecil. Kau memilih satu dan berjalan pulang.',
    color: '#62e8d8',
  },
];

// ── lore encyclopedia (Indeks Sumpah) ─────────────────────────────────────
export const LORE_CATEGORIES = [
  { id: 'sejarah', name: 'Sejarah Sumpah', glyph: '⌛', color: '#d0b45a' },
  { id: 'dewa', name: 'Dewa & Penjaga', glyph: '✦', color: '#e0c46a' },
  { id: 'zona', name: 'Wilayah Atlas', glyph: '◆', color: '#7fae5a' },
  { id: 'bos', name: 'Bos & Legenda', glyph: '✹', color: '#c45a3a' },
  { id: 'rakyat', name: 'Rakyat & Faksi', glyph: '♟', color: '#b8a486' },
  { id: 'sihir', name: 'Sihir & Relik', glyph: '✧', color: '#8f9fe8' },
  { id: 'mesin', name: 'Mesin & Penempaan', glyph: '⚙', color: '#c47a3a' },
  { id: 'laut', name: 'Laut & Palung', glyph: '≋', color: '#3f8fa8' },
  { id: 'waktu', name: 'Waktu & Takdir', glyph: '⌛', color: '#d0a45a' },
  { id: 'kematian', name: 'Kematian & Iman', glyph: '♱', color: '#b8a486' },
  { id: 'rahasia', name: 'Rahasia & Akhir', glyph: '◈', color: '#62e8d8' },
];

const LORE_SOURCE = [
  ['sejarah', 'Halaman Pertama', 'Atlas pertama tidak ditulis; ia tumbuh dari akar pohon yang mendengar sumpah pertama.', 'Tujuh penjaga menulis nama mereka di halaman kosong, dan dunia mulai punya batas.', 'Halaman pertama masih ada di bawah Vael Gardens. Ia berdenyut seperti jantung.'],
  ['sejarah', 'Perang Taman', 'Vael Gardens tumbuh dari darah penjaga yang gugur dalam perang pertama.', 'Akar-akar taman menyimpan nama setiap prajurit yang tidak sempat pulang.', 'Sylva Vael adalah nama penjaga terakhir yang menolak menyerahkan tamannya.'],
  ['sejarah', 'Atlas Terbelah', 'Ketika Atlas retak, setiap halaman menjadi dunia yang menolak dibaca.', 'Delapan halaman utama lepas dan membentuk delapan zona.', 'Halaman kesembilan tidak pernah ditemukan. Ia mungkin sedang membaca kita.'],
  ['dewa', 'Tujuh Penjaga', 'Tujuh penjaga bersumpah menjaga Atlas: Akar, Sayap, Bintang, Layu, Pasir, Tulang, dan Mesin.', 'Mereka bukan dewa. Mereka hanya nama yang terlalu lama diingat.', 'Penjaga kedelapan tidak pernah bersumpah. Ia menulis sumpah untuk dirinya sendiri.'],
  ['dewa', 'Sumpah Pertama', 'Sumpah pertama bukan janji kepada dewa, melainkan janji kepada dunia agar tetap punya bentuk.', 'Setiap kata dalam sumpah menjadi hukum fisika di wilayahnya.', 'Sumpah itu masih aktif. Itu sebabnya luka di Atlas menular ke dunia.'],
  ['dewa', 'Yang Tidak Disebut', 'Ada nama yang sengaja dihapus dari semua doa.', 'Nama itu muncul di setiap prasasti sebagai ruang kosong.', 'Jika kau mengucapkannya, Atlas akan mengingatmu.'],
  ['zona', 'Vael Gardens', 'Taman yang bernapas dan mengingat setiap langkah.', 'Akar-akarnya bisa menumbuhkan jembatan jika kau menanam janji.', 'Di bawah pohon tertua ada pintu menuju halaman pertama.'],
  ['zona', 'Gilded Aviary', 'Kandang katedral yang melayang di atas awan.', 'Setiap sangkar menyimpan burung yang pernah mencoba terbang.', 'Lonceng di puncak menara bukan memanggil burung, melainkan mengunci langit.'],
  ['zona', 'Starfall Observatory', 'Orrery raksasa yang menghitung semua kemungkinan.', 'Bintang-bintang di langitnya adalah nama-nama yang belum terjadi.', 'Salah satu bola bintang berisi ruangan yang tidak ada di peta.'],
  ['bos', 'Sylva Vael', 'Ibu dari semua akar yang menolak ditebang.', 'Ia menumbuhkan taman dari kenangan para pemberontak.', 'Kemenangannya bukan kematian, melainkan tidur yang tenang.'],
  ['bos', 'Caelum', 'Raja burung yang percaya sangkar adalah kasih sayang.', 'Ia memotong sayap tamunya agar tidak pergi.', 'Di balik sayap emasnya ada rantai yang ia pasang sendiri.'],
  ['bos', 'Aureus', 'Mesin pertama yang menempa waktu menjadi roda gigi.', 'Ia membangun menara untuk mengukur jarak antara dua detik.', 'Ia menunggu seseorang yang cukup gila untuk memperbaiki jamnya.'],
  ['rakyat', 'Para Tanpa Nama', 'Mereka yang namanya dihapus dari Atlas.', 'Mereka hidup di celah antarhalaman dan meminjam nama dari orang lain.', 'Salah satu dari mereka mungkin adalah kau, sebelum kau mendapat nama.'],
  ['rakyat', 'Kolektor Tulang', 'Faksi yang mengumpulkan tulang untuk menulis ulang sejarah.', 'Mereka percaya setiap tulang menyimpan satu kebenaran.', 'Katakombe adalah perpustakaan mereka.'],
  ['rakyat', 'Penempa Waktu', 'Guild mesin yang menjual detik tambahan kepada raja-raja.', 'Harga satu detik adalah satu kenangan.', 'Mereka tidak pernah menjual detik terakhir.'],
  ['sihir', 'Sihir Sumpah', 'Sihir di Atlas bukan energi, melainkan pinjaman dari halaman lain.', 'Setiap mantra meminjam satu kata dari masa depan.', 'Semakin banyak kau meminjam, semakin tipis halamanmu.'],
  ['sihir', 'Relik Halaman', 'Relik adalah potongan halaman Atlas yang membeku dalam bentuk benda.', 'Setiap relik mengingat pemilik sebelumnya.', 'Relik terkuat adalah halaman yang belum ditulis.'],
  ['sihir', 'Infusi Unsur', 'Infusi menempelkan unsur ke senjata dengan harga kenangan.', 'Unsur tidak menambah kekuatan; ia mengubah cara dunia melihat senjata itu.', 'Infusi terlarang menggunakan nama pemilik senjata sebagai bahan.'],
  ['mesin', 'Roda Gigi Prime', 'Roda gigi Prime Engine adalah jantung waktu dunia.', 'Setiap gigi mewakili satu kemungkinan yang dipilih.', 'Jika satu gigi dicabut, satu masa depan hilang.'],
  ['mesin', 'Automaton Tungku', 'Automaton ditempa dari abu raja-raja yang gagal.', 'Mereka mengingat perintah terakhir dan tidak pernah berhenti.', 'Salah satu automaton masih menunggu raja yang sudah lama mati.'],
  ['mesin', 'Piston Raksasa', 'Piston di Clockwork Foundry menempa bintang-bintang kecil.', 'Setiap bintang yang gagal menjadi pasir di Sandglass Wastes.', 'Suara piston adalah detak jantung Atlas yang sesungguhnya.'],
  ['laut', 'Palung Abyssal', 'Palung adalah tempat Atlas membuang halaman yang terlalu berat.', 'Tekanannya menghapus nama dan menyisakan bentuk.', 'Leviathan di dasarnya adalah halaman yang menolak tenggelam.'],
  ['laut', 'Ubur Lentera', 'Mereka menerangi jalan bagi yang tersesat di palung.', 'Cahaya mereka adalah kenangan yang belum siap pergi.', 'Menangkap satu ubur berarti menyimpan satu kenangan orang lain.'],
  ['laut', 'Pendeta Palung', 'Mereka menyanyikan nama-nama yang hilang ke dalam air.', 'Nyanyian mereka membuat palung tetap tenang.', 'Jika nyanyian berhenti, tekanan akan naik ke permukaan.'],
  ['waktu', 'Jam Pasir Terbalik', 'Sandglass Wastes adalah jam pasir yang mengalir ke atas.', 'Pasirnya adalah detik-detik yang belum dipakai.', 'Sahra menjual detik itu kepada siapa pun yang cukup putus asa.'],
  ['waktu', 'Detik Terakhir', 'Setiap orang punya satu detik terakhir yang tidak bisa dijual.', 'Aureus mencoba menempa detik itu menjadi kunci.', 'Kunci itu masih belum selesai.'],
  ['waktu', 'Paradoks Kecil', 'Sihir waktu tidak mengubah masa lalu; ia hanya membuat masa lalu mengingat hal lain.', 'Setiap paradoks meninggalkan bekas di halaman Atlas.', 'Bekas paling besar adalah bulan yang tidak pernah ada.'],
  ['kematian', 'Katakombe Tanpa Iman', 'Katakombe dibangun untuk mengubur keyakinan yang tidak lagi ingin didengar.', 'Loncengnya memanggil orang hidup, bukan orang mati.', 'Malachai adalah satu-satunya yang masih percaya pada sesuatu.'],
  ['kematian', 'Paduan Tanpa Iman', 'Mereka menyanyikan doa yang tidak ditujukan kepada siapa pun.', 'Nyanyian mereka menjaga pintu antara hidup dan mati tetap tertutup.', 'Salah satu suara dalam paduan itu adalah suara pemain.'],
  ['kematian', 'Penebus Terakhir', 'Setiap ksatria di katakombe mencari satu dosa yang tidak bisa ditebus.', 'Mereka bertarung bukan untuk menang, melainkan untuk diingat.', 'Yang terakhir menunggu seseorang yang mau mendengarkan namanya.'],
  ['rahasia', 'Halaman Kesembilan', 'Ada halaman kesembilan yang tidak pernah menjadi zona.', 'Ia berisi semua hal yang tidak masuk ke delapan halaman lainnya.', 'Halaman itu sedang membaca siapa pun yang membuka Atlas.'],
  ['rahasia', 'Nama Pemain', 'Nama pemain tidak ada di Atlas sampai ia menulisnya sendiri.', 'Setiap kemenangan menambahkan satu huruf ke halaman kosong.', 'Jika nama selesai, pemain menjadi penjaga berikutnya.'],
  ['rahasia', 'Akhir yang Tidak Ditulis', 'Ada akhir yang tidak bisa dicapai karena tidak pernah ditulis.', 'Empat akhir yang diketahui hanyalah empat cara membaca halaman yang sama.', 'Akhir kelima adalah ketika Atlas menutup dirinya sendiri.'],
];

export const LORE_ENTRIES = LORE_SOURCE.map(([category, title, tier1, tier2, tier3], index) => ({
  id: `lore_${index + 1}`,
  category,
  title,
  glyph: LORE_CATEGORIES.find((entry) => entry.id === category)?.glyph || '◇',
  tiers: [tier1, tier2, tier3],
  tierCosts: [0, 1, 2],
  order: index,
}));

export const LORE_ENTRY_BY_ID = Object.fromEntries(LORE_ENTRIES.map((entry) => [entry.id, entry]));

export const LORE_COMPLETION_REWARDS = [
  { category: 'sejarah', marks: 120, fragment: 3 },
  { category: 'dewa', marks: 120, fragment: 3 },
  { category: 'zona', marks: 160, fragment: 4 },
  { category: 'bos', marks: 180, fragment: 4 },
  { category: 'rakyat', marks: 100, fragment: 2 },
  { category: 'sihir', marks: 120, fragment: 3 },
  { category: 'mesin', marks: 140, fragment: 3 },
  { category: 'laut', marks: 120, fragment: 3 },
  { category: 'waktu', marks: 140, fragment: 3 },
  { category: 'kematian', marks: 140, fragment: 3 },
  { category: 'rahasia', marks: 240, fragment: 6 },
];

export function revealLore(progress, entryId, tier = 1) {
  const entry = LORE_ENTRY_BY_ID[entryId];
  const targetTier = clamp(Math.floor(Number(tier) || 1), 1, 3);
  if (!entry) return { ok: false, reason: 'unknown_entry' };
  const current = progress.lore?.[entryId] || 0;
  if (targetTier <= current) return { ok: true, changed: false, tier: current };
  const nextTier = current + 1;
  if (targetTier !== nextTier) return { ok: false, reason: 'tier_order' };
  const cost = entry.tierCosts[nextTier - 1] || 0;
  if ((progress.loreFragments || 0) < cost) return { ok: false, reason: 'insufficient_fragments', cost };
  if (!progress.lore) progress.lore = {};
  progress.lore[entryId] = nextTier;
  progress.loreFragments = Math.max(0, (progress.loreFragments || 0) - cost);
  const categoryComplete = LORE_ENTRIES
    .filter((candidate) => candidate.category === entry.category)
    .every((candidate) => (progress.lore?.[candidate.id] || 0) >= 3);
  let reward = null;
  if (categoryComplete && !progress.flags?.[`lore_${entry.category}`]) {
    if (!progress.flags) progress.flags = {};
    progress.flags[`lore_${entry.category}`] = true;
    reward = LORE_COMPLETION_REWARDS.find((item) => item.category === entry.category) || null;
    if (reward) {
      progress.marks = Math.max(0, (progress.marks || 0) + reward.marks);
      progress.loreFragments = Math.max(0, (progress.loreFragments || 0) + reward.fragment);
    }
  }
  return { ok: true, changed: true, tier: nextTier, cost, reward };
}

export function loreCompletion(progress) {
  const total = LORE_ENTRIES.length * 3;
  let revealed = 0;
  for (const entry of LORE_ENTRIES) revealed += clamp(progress.lore?.[entry.id] || 0, 0, 3);
  const categories = LORE_CATEGORIES.map((category) => {
    const entries = LORE_ENTRIES.filter((entry) => entry.category === category.id);
    const done = entries.filter((entry) => (progress.lore?.[entry.id] || 0) >= 3).length;
    return { ...category, total: entries.length, complete: done, done: done === entries.length };
  });
  return {
    revealed,
    total,
    percent: total ? revealed / total : 0,
    categories,
    complete: revealed >= total,
  };
}

export function searchLore(query, progress = {}, options = {}) {
  const text = String(query || '').trim().toLowerCase();
  const category = options.category || null;
  const onlyRevealed = !!options.onlyRevealed;
  return LORE_ENTRIES.filter((entry) => {
    if (category && entry.category !== category) return false;
    const tier = progress.lore?.[entry.id] || 0;
    if (onlyRevealed && tier <= 0) return false;
    if (!text) return true;
    const visible = entry.tiers.slice(0, Math.max(1, tier)).join(' ');
    return `${entry.title} ${visible} ${entry.category}`.toLowerCase().includes(text);
  });
}

// ── consumables, quick slots, cooking ─────────────────────────────────────
const CONSUMABLE_GROUPS = [
  { type: 'heal', label: 'Ramuan Penyembuh', prefix: 'Ramuan', effect: 'heal' },
  { type: 'cure', label: 'Obat Penawar', prefix: 'Penawar', effect: 'cure' },
  { type: 'elixir', label: 'Eliksir', prefix: 'Eliksir', effect: 'buff' },
  { type: 'food', label: 'Makanan', prefix: 'Masakan', effect: 'regen' },
  { type: 'throwable', label: 'Lemparan', prefix: 'Bom', effect: 'damage' },
  { type: 'utility', label: 'Utilitas', prefix: 'Alat', effect: 'utility' },
];

const CONSUMABLE_FLAVOR = [
  'Vael', 'Aviary', 'Starfall', 'Wither', 'Sandglass', 'Catacomb', 'Abyss', 'Foundry',
  'Fajar', 'Senja', 'Badai', 'Gema', 'Akar', 'Tulang', 'Mesin', 'Pasir',
];

export const ATLAS_CONSUMABLES = [];
let consumableIndex = 0;
for (const group of CONSUMABLE_GROUPS) {
  const count = group.type === 'heal' || group.type === 'food' ? 10 : 9;
  for (let i = 0; i < count && ATLAS_CONSUMABLES.length < 55; i++) {
    const flavor = CONSUMABLE_FLAVOR[(consumableIndex + i) % CONSUMABLE_FLAVOR.length];
    const tier = 1 + Math.floor(i / 3);
    const id = `atlas_${group.type}_${i + 1}`;
    const base = {
      id,
      name: `${group.prefix} ${flavor} ${i + 1}`,
      desc: `${group.label} dari ${flavor}. Efek samping minimal; harga naik sesuai tier.`,
      type: group.type,
      effect: group.effect,
      tier,
      price: 18 + tier * 14 + i * 3,
      stack: 9,
      quickSlot: group.type !== 'food',
      color: ['#d07a35', '#7fae5a', '#8f9fe8', '#d0a45a', '#c45a3a', '#62e8d8'][consumableIndex % 6],
    };
    if (group.type === 'heal') {
      base.heal = 20 + tier * 12;
      base.duration = 0;
    } else if (group.type === 'cure') {
      base.cure = ['racun', 'luka', 'kutukan'][i % 3];
      base.heal = 6 + tier * 3;
    } else if (group.type === 'elixir') {
      base.buff = { damage: 0.08 + tier * 0.04, speed: 0.04 + tier * 0.02, duration: 12 + tier * 4 };
    } else if (group.type === 'food') {
      base.regen = { hp: 4 + tier * 2, duration: 8 + tier * 2 };
    } else if (group.type === 'throwable') {
      base.damage = 24 + tier * 14;
      base.radius = 70 + tier * 10;
    } else {
      base.utility = ['reveal', 'shield', 'haste', 'purify'][i % 4];
      base.duration = 6 + tier * 2;
    }
    ATLAS_CONSUMABLES.push(base);
    consumableIndex++;
  }
}

export const ATLAS_CONSUMABLE_BY_ID = Object.fromEntries(
  ATLAS_CONSUMABLES.map((item) => [item.id, item]),
);

export const ATLAS_QUICK_SLOTS = [0, 1, 2, 3].map((index) => ({
  index,
  label: `Slot Cepat ${index + 1}`,
  defaultItem: ATLAS_CONSUMABLES[index]?.id || null,
}));

export const ATLAS_ITEM_WHEEL = Array.from({ length: 8 }, (_, index) => ({
  index,
  angle: (Math.PI * 2 * index) / 8,
  label: `Roda ${index + 1}`,
}));

export const ATLAS_RECIPES = [
  ['cook', 'Sup Akar Vael', ['atlas_food_1', 'atlas_heal_1'], 'atlas_food_3', 2],
  ['cook', 'Panggang Bintang', ['atlas_food_2', 'atlas_elixir_1'], 'atlas_food_5', 3],
  ['cook', 'Teh Palung', ['atlas_food_3', 'atlas_cure_1'], 'atlas_food_7', 3],
  ['cook', 'Roti Mesin', ['atlas_food_4', 'atlas_utility_1'], 'atlas_food_9', 4],
  ['cook', 'Kue Jam Pasir', ['atlas_food_5', 'atlas_elixir_3'], 'atlas_food_10', 5],
  ['cook', 'Perjamuan Atlas', ['atlas_food_8', 'atlas_food_9'], 'atlas_elixir_5', 6],
  ['craft', 'Bom Duri', ['atlas_throwable_1', 'atlas_heal_2'], 'atlas_throwable_3', 2],
  ['craft', 'Eliksir Badai', ['atlas_elixir_2', 'atlas_cure_2'], 'atlas_elixir_4', 3],
  ['craft', 'Penawar Tulang', ['atlas_cure_3', 'atlas_food_4'], 'atlas_cure_5', 3],
  ['craft', 'Bom Waktu', ['atlas_throwable_4', 'atlas_utility_2'], 'atlas_throwable_6', 4],
  ['craft', 'Alat Penglihatan', ['atlas_utility_3', 'atlas_elixir_4'], 'atlas_utility_5', 5],
  ['craft', 'Ramuan Prime', ['atlas_heal_8', 'atlas_elixir_6'], 'atlas_heal_10', 6],
].map(([kind, name, inputs, output, tier], index) => ({
  id: `atlas_recipe_${index + 1}`,
  kind,
  name,
  inputs,
  output,
  tier,
  time: 4 + tier * 2,
}));

// ── shops, armor, charms, economy ─────────────────────────────────────────
export const ATLAS_SHOPS = [
  { id: 'shop_vael', name: 'Warung Akar', npc: 'Mira, Penjual Akar', zone: 'vael', specialty: 'heal', multiplier: 0.95, dialogue: 'Ramuan segar dari akar pertama. Jangan tanya dari siapa.' },
  { id: 'shop_aviary', name: 'Kandang Barang', npc: 'Pip, Penjual Sangkar', zone: 'aviary', specialty: 'utility', multiplier: 1.0, dialogue: 'Semua barang di sini pernah terbang. Sekarang mereka murah.' },
  { id: 'shop_starfall', name: 'Kedai Konstelasi', npc: 'Nima, Peramal', zone: 'starfall', specialty: 'elixir', multiplier: 1.1, dialogue: 'Aku sudah melihat kau membeli ini. Dua kali.' },
  { id: 'shop_witherwood', name: 'Pasar Layu', npc: 'Corin, Pengumpul', zone: 'witherwood', specialty: 'cure', multiplier: 0.92, dialogue: 'Yang busuk bisa menyembuhkan. Kadang.' },
  { id: 'shop_sandglass', name: 'Kios Detik', npc: 'Sahra Muda', zone: 'sandglass', specialty: 'food', multiplier: 1.05, dialogue: 'Bayar dengan detik, bukan dengan abu.' },
  { id: 'shop_foundry', name: 'Toko Roda Gigi', npc: 'Aureus Kecil', zone: 'foundry', specialty: 'throwable', multiplier: 1.15, dialogue: 'Setiap bom dirakit dari satu kemungkinan yang gagal.' },
];

export const ATLAS_ARMOR_SETS = [
  ['Barkweave', 'Tenunan Kulit Kayu', 'vael', 24, 0.06, 0.02, 2],
  ['Feathermail', 'Zirah Bulu', 'aviary', 18, 0.04, 0.08, 2],
  ['Starglass', 'Kaca Bintang', 'starfall', 20, 0.10, 0.03, 3],
  ['Witherplate', 'Pelat Layu', 'witherwood', 30, 0.05, 0.0, 3],
  ['Sandscale', 'Sisik Pasir', 'sandglass', 26, 0.07, 0.04, 4],
  ['Bonevestment', 'Jubah Tulang', 'catacombs', 22, 0.08, 0.02, 4],
  ['Abyssal Carapace', 'Karapas Palung', 'abyss', 34, 0.09, 0.01, 5],
  ['Gearforged', 'Tempaan Gigi', 'foundry', 38, 0.11, 0.0, 5],
  ['Vowbound', 'Terikat Sumpah', 'atlas', 28, 0.12, 0.05, 6],
  ['Atlas Regalia', 'Regalia Atlas', 'atlas', 32, 0.14, 0.06, 6],
  ['Nightglass', 'Kaca Malam', 'atlas', 24, 0.16, 0.10, 7],
  ['Prime Aegis', 'Aegis Prime', 'atlas', 44, 0.15, 0.02, 8],
].map(([name, localName, zone, hp, damage, speed, tier], index) => ({
  id: `armor_${index + 1}`,
  name,
  localName,
  zone,
  tier,
  hp,
  damage,
  speed,
  price: 180 + tier * 120 + index * 25,
  pieces: 4,
  setBonus: tier >= 6 ? 'Semua damage +4% dan flask +1.' : 'Damage +2%.',
  color: ['#7fae5a', '#d0b45a', '#8f9fe8', '#8a6a3a', '#d0a45a', '#b8a486', '#3f8fa8', '#c47a3a', '#d07a35', '#e0c46a', '#8f9fe8', '#c47a3a'][index],
}));

export const ATLAS_CHARMS = [
  ['Charm of Roots', 'Jimat Akar', 'hp', 18, 120],
  ['Charm of Feathers', 'Jimat Bulu', 'dash', 0.12, 140],
  ['Charm of Falling Stars', 'Jimat Bintang Jatuh', 'damage', 0.08, 180],
  ['Charm of Rot', 'Jimat Pembusukan', 'lifesteal', 0.04, 160],
  ['Charm of Sand', 'Jimat Pasir', 'speed', 0.06, 150],
  ['Charm of Bones', 'Jimat Tulang', 'defense', 0.06, 170],
  ['Charm of Tides', 'Jimat Ombak', 'flask', 1, 220],
  ['Charm of Gears', 'Jimat Gigi', 'cooldown', 0.10, 210],
  ['Charm of the Vow', 'Jimat Sumpah', 'ash', 0.15, 200],
  ['Charm of Echoes', 'Jimat Gema', 'echo', 0.12, 190],
  ['Charm of the Ninth Page', 'Jimat Halaman Kesembilan', 'lore', 0.10, 260],
  ['Charm of the Broken Compass', 'Jimat Kompas Retak', 'explore', 0.08, 240],
  ['Charm of the Prime', 'Jimat Prime', 'damage', 0.12, 320],
  ['Charm of the Abyss', 'Jimat Palung', 'hp', 28, 300],
  ['Charm of the Last Oath', 'Jimat Sumpah Terakhir', 'all', 0.05, 400],
].map(([name, localName, effect, value, price], index) => ({
  id: `charm_${index + 1}`,
  name,
  localName,
  effect,
  value,
  price,
  color: ['#7fae5a', '#d0b45a', '#8f9fe8', '#8a6a3a', '#d0a45a', '#b8a486', '#3f8fa8', '#c47a3a', '#d07a35', '#e0c46a', '#62e8d8', '#8f9fe8', '#e0c46a', '#3f8fa8', '#ffffff'][index],
}));

export function priceForItem(basePrice, options = {}) {
  const base = Math.max(1, Number(basePrice) || 1);
  const multiplier = clamp(Number(options.shopMultiplier) || 1, 0.5, 2);
  const reputation = clamp(Number(options.reputation) || 0, 0, 50);
  const demand = clamp(Number(options.demand) || 1, 0.75, 1.5);
  const discount = 1 - reputation * 0.01;
  return Math.max(1, Math.round(base * multiplier * demand * discount));
}

export function sellPrice(basePrice, options = {}) {
  const buy = priceForItem(basePrice, options);
  return Math.max(1, Math.min(buy - 1, Math.floor(buy * 0.35)));
}

export function shopStock(shopId, progress = {}) {
  const shop = ATLAS_SHOPS.find((entry) => entry.id === shopId);
  if (!shop) return [];
  const consumables = ATLAS_CONSUMABLES
    .filter((item) => item.type === shop.specialty || item.tier <= 3)
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      kind: 'consumable',
      name: item.name,
      price: priceForItem(item.price, { shopMultiplier: shop.multiplier, reputation: progress.shopReputation?.[shopId] }),
      data: item,
    }));
  const armor = ATLAS_ARMOR_SETS
    .filter((item) => item.zone === shop.zone || item.tier <= 2)
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      kind: 'armor',
      name: item.localName,
      price: priceForItem(item.price, { shopMultiplier: shop.multiplier }),
      data: item,
    }));
  const charms = ATLAS_CHARMS
    .slice(shop.zone === 'foundry' ? 8 : shop.zone === 'abyss' ? 6 : 0, shop.zone === 'foundry' ? 15 : shop.zone === 'abyss' ? 12 : 3)
    .map((item) => ({
      id: item.id,
      kind: 'charm',
      name: item.localName,
      price: priceForItem(item.price, { shopMultiplier: shop.multiplier }),
      data: item,
    }));
  return [...consumables, ...armor, ...charms];
}

export function buyAtlasItem(progress, shopId, itemId) {
  const stock = shopStock(shopId, progress);
  const entry = stock.find((item) => item.id === itemId);
  if (!entry) return { ok: false, reason: 'not_stocked' };
  if ((progress.marks || 0) < entry.price) return { ok: false, reason: 'insufficient_marks', price: entry.price };
  progress.marks = Math.max(0, (progress.marks || 0) - entry.price);
  if (entry.kind === 'consumable') {
    if (!progress.consumables) progress.consumables = {};
    progress.consumables[itemId] = (progress.consumables[itemId] || 0) + 1;
  } else if (entry.kind === 'armor') {
    if (!progress.ownedArmor) progress.ownedArmor = [];
    if (!progress.ownedArmor.includes(itemId)) progress.ownedArmor.push(itemId);
  } else if (entry.kind === 'charm') {
    if (!progress.ownedCharms) progress.ownedCharms = [];
    if (!progress.ownedCharms.includes(itemId)) progress.ownedCharms.push(itemId);
  }
  if (!progress.shopReputation) progress.shopReputation = {};
  progress.shopReputation[shopId] = clamp((progress.shopReputation[shopId] || 0) + 1, 0, 50);
  return { ok: true, entry, marks: progress.marks };
}

export function useAtlasConsumable(progress, itemId) {
  const item = ATLAS_CONSUMABLE_BY_ID[itemId];
  if (!item) return { ok: false, reason: 'unknown_item' };
  const count = progress.consumables?.[itemId] || 0;
  if (count <= 0) return { ok: false, reason: 'empty' };
  progress.consumables[itemId] = count - 1;
  return { ok: true, item, remaining: count - 1 };
}

// ── weapons, mastery, infusions ───────────────────────────────────────────
const WEAPON_CATEGORIES = [
  'greatsword', 'twin_daggers', 'warhammer', 'spear', 'scythe', 'longbow', 'crossbow', 'arcane_staff',
  'rune_blade', 'storm_spear', 'arcane_pistol', 'repeater', 'spirit_blade', 'chain_whip', 'battle_gauntlets', 'vow_censer',
];

const WEAPON_BASES = {
  greatsword: 'sword', twin_daggers: 'sword', warhammer: 'sword', spear: 'pike', scythe: 'sword',
  longbow: 'bow', crossbow: 'bow', arcane_staff: 'pike', rune_blade: 'sword', storm_spear: 'pike',
  arcane_pistol: 'bow', repeater: 'bow', spirit_blade: 'sword', chain_whip: 'pike', battle_gauntlets: 'sword',
  vow_censer: 'pike',
};

const WEAPON_ZONE_NAMES = [
  ['Thornreaver', 'Rootfang', 'Petalstorm', 'Briarheart', 'Vaelbloom'],
  ['Goldtalon', 'Cagebreaker', 'Skyward', 'Featherfall', 'Regent\'s Edge'],
  ['Starcleaver', 'Cometfall', 'Orrery', 'Nebula', 'Nul\'s Last Light'],
  ['Rotbringer', 'Hollowbranch', 'Blightfang', 'Corvus\'s Sorrow', 'Witherwake'],
  ['Sandstorm', 'Hourglass', 'Mirage', 'Dune', 'Sahra\'s Debt'],
  ['Bonebell', 'Faithbreaker', 'Catacomb', 'Penitent', 'Malachai\'s Hymn'],
  ['Tidecaller', 'Abyssfang', 'Leviathan', 'Lantern', 'Nyx\'s Deep'],
  ['Gearstorm', 'Primehammer', 'Clockwork', 'Furnace', 'Aureus\'s Engine'],
];

export const ATLAS_WEAPONS = [];
for (let zoneIndex = 0; zoneIndex < ATLAS_ZONES.length; zoneIndex++) {
  const zone = ATLAS_ZONES[zoneIndex];
  for (let i = 0; i < 5; i++) {
    const category = WEAPON_CATEGORIES[(zoneIndex * 5 + i) % WEAPON_CATEGORIES.length];
    const base = WEAPON_BASES[category];
    const tier = Math.min(8, 1 + Math.floor(zoneIndex / 2));
    const damage = 1 + tier * 0.08 + (base === 'sword' ? 0.08 : base === 'pike' ? 0.04 : 0.02);
    const speed = 1 + (base === 'bow' ? 0.06 : base === 'pike' ? 0.02 : 0);
    ATLAS_WEAPONS.push({
      id: `atlas_weapon_${ATLAS_WEAPONS.length + 1}`,
      name: WEAPON_ZONE_NAMES[zoneIndex][i],
      localName: `${WEAPON_ZONE_NAMES[zoneIndex][i]} ${zone.localName}`,
      zone: zone.id,
      tier,
      category,
      base,
      damage: round(damage * 100) / 100,
      speed: round(speed * 100) / 100,
      element: ['nature', 'celestial', 'void', 'nature', 'time', 'death', 'water', 'fire'][zoneIndex],
      price: 260 + tier * 160 + i * 30,
      masteryMax: 10,
      infusions: ['none', 'ember', 'frost', 'storm', 'void', 'root'],
      color: zone.accent,
    });
  }
}

export const ATLAS_WEAPON_BY_ID = Object.fromEntries(ATLAS_WEAPONS.map((weapon) => [weapon.id, weapon]));

export const ATLAS_INFUSIONS = [
  { id: 'none', name: 'Tanpa Infusi', damage: 1, element: null, cost: 0 },
  { id: 'ember', name: 'Infusi Bara', damage: 1.08, element: 'fire', cost: 2 },
  { id: 'frost', name: 'Infusi Beku', damage: 1.06, element: 'frost', cost: 2 },
  { id: 'storm', name: 'Infusi Badai', damage: 1.10, element: 'storm', cost: 3 },
  { id: 'void', name: 'Infusi Void', damage: 1.12, element: 'void', cost: 3 },
  { id: 'root', name: 'Infusi Akar', damage: 1.05, element: 'nature', cost: 2 },
];

export const ATLAS_INFUSION_BY_ID = Object.fromEntries(ATLAS_INFUSIONS.map((entry) => [entry.id, entry]));

export function applyInfusion(weapon, infusionId) {
  const infusion = ATLAS_INFUSION_BY_ID[infusionId] || ATLAS_INFUSION_BY_ID.none;
  if (!weapon) return null;
  return {
    ...weapon,
    infusion: infusion.id,
    element: infusion.element || weapon.element,
    damage: round(weapon.damage * infusion.damage * 100) / 100,
    infusionCost: infusion.cost,
  };
}

export function weaponMasteryFor(progress, weaponId) {
  const state = progress.weaponMastery?.[weaponId] || { xp: 0, level: 0 };
  const level = clamp(Math.floor(Number(state.level) || 0), 0, 10);
  const xp = Math.max(0, Number(state.xp) || 0);
  const next = level >= 10 ? 0 : (level + 1) * 120;
  return { level, xp, next, bonus: 1 + level * 0.03 };
}

export function grantWeaponXp(progress, weaponId, amount) {
  if (!progress.weaponMastery) progress.weaponMastery = {};
  const state = progress.weaponMastery[weaponId] || { xp: 0, level: 0 };
  const gain = Math.max(0, Math.floor(Number(amount) || 0));
  state.xp += gain;
  while (state.level < 10 && state.xp >= (state.level + 1) * 120) {
    state.xp -= (state.level + 1) * 120;
    state.level++;
  }
  progress.weaponMastery[weaponId] = state;
  return weaponMasteryFor(progress, weaponId);
}

// ── AI handoff / performance plan ─────────────────────────────────────────
export const ATLAS_PHASES = [
  { id: 'phase_0', title: 'Fondasi & Audit', doneWhen: 'Semua tes lama hijau; save lama termigrasi tanpa kehilangan data.' },
  { id: 'phase_1', title: 'Data 8 Zona', doneWhen: '8 zona, 4 tier, dan ability gate tervalidasi.' },
  { id: 'phase_2', title: '240 Ruang', doneWhen: 'Validator ruang lulus; setiap zona punya 30 ruang dan 1 bos.' },
  { id: 'phase_3', title: 'Kurva Kesulitan', doneWhen: 'Level 301-540 punya scaling musuh dan hadiah yang monoton naik.' },
  { id: 'phase_4', title: 'Latar & Parallax', doneWhen: 'Setiap zona punya 3 layer latar, light map, dan preset kualitas.' },
  { id: 'phase_5', title: 'Cerita & 4 Akhiran', doneWhen: '8 bab, timeline, karakter, dan 4 ending dapat dibuka.' },
  { id: 'phase_6', title: 'Indeks Sumpah', doneWhen: '11 kategori, 3 tier reveal, pencarian, dan hadiah selesai berfungsi.' },
  { id: 'phase_7', title: 'Pathfinding Bos', doneWhen: 'A* platform graph lulus tes dan dipakai minimal 8 bos.' },
  { id: 'phase_8', title: 'Bot Bos 100x', doneWhen: 'Bot menjalankan 100 iterasi per bos tanpa error.' },
  { id: 'phase_9', title: 'Performa', doneWhen: 'Frame budget, pooling, culling, dan auto-quality lulus target.' },
  { id: 'phase_10', title: '55 Konsumabel', doneWhen: 'Semua item bisa dipakai, quick slot tersimpan, tanpa duplikasi.' },
  { id: 'phase_11', title: '6 Warung', doneWhen: 'Harga, stok, reputasi, dan anti-eksploit lulus tes.' },
  { id: 'phase_12', title: '12 Zirah & 15 Jimat', doneWhen: 'Semua bisa dibeli, dipasang, dan memberi bonus.' },
  { id: 'phase_13', title: '40 Senjata', doneWhen: 'Semua senjata punya stat, mastery, dan infusi.' },
  { id: 'phase_14', title: 'Rilis v0.6.0', doneWhen: 'Update log, dokumentasi, tes penuh, dan smoke test browser hijau.' },
];

export const ATLAS_CHECKLIST = [
  '8 zona + 4 tier', '240 ruang tervalidasi', 'Validator ruang', 'Level 301-540',
  '8 bab cerita', '4 akhiran', '11 kategori lore', '33 entri lore 3 tier',
  'Pencarian lore', 'Hadiah completion', '55 konsumabel', 'Quick slot + item wheel',
  '12 resep crafting/cooking', '6 warung NPC', '12 set zirah', '15 jimat',
  '40 senjata', 'Mastery senjata', '6 infusi', 'A* platform graph',
  'Boss navigator + stuck recovery', 'Bot bos 100 iterasi', 'Quality presets', 'Frame budget',
  'Save migration', 'Tes atlas hijau', 'Update log v0.6.0', 'Smoke test browser',
].map((label, index) => ({ id: `atlas_check_${index + 1}`, label, ready: true }));

export const ATLAS_QUALITY_PRESETS = [
  { id: 'low', name: 'Low', layers: 1, particles: 80, shadows: false, lighting: false, targetFps: 30 },
  { id: 'medium', name: 'Medium', layers: 2, particles: 180, shadows: false, lighting: true, targetFps: 45 },
  { id: 'high', name: 'High', layers: 3, particles: 320, shadows: true, lighting: true, targetFps: 60 },
  { id: 'ultra', name: 'Ultra', layers: 4, particles: 520, shadows: true, lighting: true, targetFps: 60 },
  { id: 'auto', name: 'Auto', layers: 3, particles: 260, shadows: true, lighting: true, targetFps: 60 },
];

// ── progress ──────────────────────────────────────────────────────────────
export function defaultAtlasProgress() {
  return {
    version: 1,
    unlockedZones: ['vael', 'aviary'],
    clearedRooms: {},
    zoneBosses: {},
    abilities: [],
    marks: 0,
    loreFragments: 3,
    lore: {},
    consumables: {},
    ownedArmor: [],
    ownedCharms: [],
    ownedWeapons: ATLAS_WEAPONS.slice(0, 3).map((weapon) => weapon.id),
    equippedArmor: null,
    equippedCharms: [],
    equippedWeapon: ATLAS_WEAPONS[0]?.id || null,
    quickSlots: ATLAS_QUICK_SLOTS.map((slot) => slot.defaultItem),
    shopReputation: {},
    weaponMastery: {},
    weaponInfusions: {},
    stats: { rooms: 0, bosses: 0, deaths: 0, marksEarned: 0 },
    endings: [],
    flags: {},
  };
}

export function sanitizeAtlasProgress(raw = {}) {
  const base = defaultAtlasProgress();
  if (!raw || typeof raw !== 'object') return base;
  const unlocked = Array.isArray(raw.unlockedZones)
    ? [...new Set(raw.unlockedZones.filter((id) => ATLAS_ZONE_BY_ID[id]))]
    : [...base.unlockedZones];
  const clearedRooms = {};
  if (raw.clearedRooms && typeof raw.clearedRooms === 'object') {
    for (const [key, value] of Object.entries(raw.clearedRooms)) {
      const id = Number(key);
      if (ATLAS_ROOM_BY_ID[id] && value) clearedRooms[id] = true;
    }
  }
  const abilities = Array.isArray(raw.abilities)
    ? [...new Set(raw.abilities.filter((id) => ATLAS_ABILITY_BY_ID[id]))]
    : [];
  const lore = {};
  if (raw.lore && typeof raw.lore === 'object') {
    for (const [id, tier] of Object.entries(raw.lore)) {
      if (LORE_ENTRY_BY_ID[id]) lore[id] = clamp(Math.floor(Number(tier) || 0), 0, 3);
    }
  }
  const consumables = {};
  if (raw.consumables && typeof raw.consumables === 'object') {
    for (const [id, count] of Object.entries(raw.consumables)) {
      if (ATLAS_CONSUMABLE_BY_ID[id]) consumables[id] = clamp(Math.floor(Number(count) || 0), 0, 99);
    }
  }
  const ownedArmor = Array.isArray(raw.ownedArmor)
    ? [...new Set(raw.ownedArmor.filter((id) => ATLAS_ARMOR_SETS.some((item) => item.id === id)))]
    : [];
  const ownedCharms = Array.isArray(raw.ownedCharms)
    ? [...new Set(raw.ownedCharms.filter((id) => ATLAS_CHARMS.some((item) => item.id === id)))]
    : [];
  const ownedWeapons = Array.isArray(raw.ownedWeapons)
    ? [...new Set(raw.ownedWeapons.filter((id) => ATLAS_WEAPON_BY_ID[id]))]
    : base.ownedWeapons;
  const equippedArmor = ownedArmor.includes(raw.equippedArmor) ? raw.equippedArmor : null;
  const equippedCharms = Array.isArray(raw.equippedCharms)
    ? [...new Set(raw.equippedCharms.filter((id) => ownedCharms.includes(id)))].slice(0, 3)
    : [];
  const equippedWeapon = ownedWeapons.includes(raw.equippedWeapon) ? raw.equippedWeapon : ownedWeapons[0] || null;
  const quickSlots = Array.from({ length: 4 }, (_, index) => {
    const id = raw.quickSlots?.[index];
    return ATLAS_CONSUMABLE_BY_ID[id] ? id : base.quickSlots[index];
  });
  const zoneBosses = {};
  if (raw.zoneBosses && typeof raw.zoneBosses === 'object') {
    for (const [id, value] of Object.entries(raw.zoneBosses)) {
      if (ATLAS_ZONE_BY_ID[id] && value) zoneBosses[id] = true;
    }
  }
  const endings = Array.isArray(raw.endings)
    ? [...new Set(raw.endings.filter((id) => ATLAS_ENDINGS.some((entry) => entry.id === id)))]
    : [];
  const weaponInfusions = {};
  if (raw.weaponInfusions && typeof raw.weaponInfusions === 'object') {
    for (const [weaponId, infusionId] of Object.entries(raw.weaponInfusions)) {
      if (ownedWeapons.includes(weaponId) && ATLAS_INFUSION_BY_ID[infusionId]) {
        weaponInfusions[weaponId] = infusionId;
      }
    }
  }
  return {
    ...base,
    ...raw,
    version: 1,
    unlockedZones: unlocked.length ? unlocked : [...base.unlockedZones],
    clearedRooms,
    zoneBosses,
    abilities,
    marks: Math.max(0, Math.floor(Number(raw.marks) || 0)),
    loreFragments: Math.max(0, Math.floor(Number(raw.loreFragments) || 0)),
    lore,
    consumables,
    ownedArmor,
    ownedCharms,
    ownedWeapons,
    equippedArmor,
    equippedCharms,
    equippedWeapon,
    quickSlots,
    shopReputation: raw.shopReputation && typeof raw.shopReputation === 'object' ? { ...raw.shopReputation } : {},
    weaponMastery: raw.weaponMastery && typeof raw.weaponMastery === 'object' ? { ...raw.weaponMastery } : {},
    weaponInfusions,
    stats: {
      rooms: Math.max(0, Math.floor(Number(raw.stats?.rooms) || 0)),
      bosses: Math.max(0, Math.floor(Number(raw.stats?.bosses) || 0)),
      deaths: Math.max(0, Math.floor(Number(raw.stats?.deaths) || 0)),
      marksEarned: Math.max(0, Math.floor(Number(raw.stats?.marksEarned) || 0)),
    },
    endings,
    flags: raw.flags && typeof raw.flags === 'object' ? { ...raw.flags } : {},
  };
}

export function canUnlockAtlasZone(progress, zoneId) {
  const zone = ATLAS_ZONE_BY_ID[zoneId];
  if (!zone) return false;
  return zone.requires.every((ability) => (progress.abilities || []).includes(ability));
}

export function unlockAtlasZones(progress) {
  const unlocked = new Set(progress.unlockedZones || []);
  for (const zone of ATLAS_ZONES) {
    if (canUnlockAtlasZone(progress, zone.id)) unlocked.add(zone.id);
  }
  progress.unlockedZones = [...unlocked];
  return progress.unlockedZones;
}

/**
 * Complete an Atlas room. Idempotent for repeated clears, but the first clear
 * pays marks, lore fragments, and progression. Boss rooms grant abilities and
 * unlock the next zones whose gates are satisfied.
 */
export function completeAtlasRoom(progress, roomIndex, options = {}) {
  const room = ATLAS_ROOM_BY_ID[roomIndex];
  if (!room) return { ok: false, reason: 'unknown_room' };
  const firstClear = !progress.clearedRooms[roomIndex];
  const result = {
    ok: true,
    firstClear,
    marks: 0,
    fragments: 0,
    ability: null,
    unlocked: [],
    ending: null,
  };
  if (firstClear) {
    progress.clearedRooms[roomIndex] = true;
    progress.stats.rooms = (progress.stats.rooms || 0) + 1;
    result.marks = room.atlasTemplate === 'boss' ? 180 : room.atlasTemplate === 'miniBoss' ? 90 : room.atlasTemplate === 'secret' ? 70 : 24;
    result.fragments = room.atlasTemplate === 'boss' ? 4 : room.atlasTemplate === 'miniBoss' ? 2 : 1;
    progress.marks += result.marks;
    progress.loreFragments += result.fragments;
    progress.stats.marksEarned = (progress.stats.marksEarned || 0) + result.marks;
  }
  if (room.boss) {
    const boss = ATLAS_BOSS_INFO[room.boss];
    const zoneId = room.atlasZone;
    const zoneBoss = room.atlasTemplate === 'boss';
    if (zoneBoss) {
      const firstBoss = !progress.zoneBosses[zoneId];
      progress.zoneBosses[zoneId] = true;
      if (firstBoss) {
        progress.stats.bosses = (progress.stats.bosses || 0) + 1;
        result.marks += 80;
        progress.marks += 80;
      }
    }
    if (zoneBoss && boss?.abilities?.length) {
      for (const ability of boss.abilities) {
        if (!progress.abilities.includes(ability)) {
          progress.abilities.push(ability);
          result.ability = ability;
        }
      }
    }
    const before = new Set(progress.unlockedZones);
    unlockAtlasZones(progress);
    result.unlocked = progress.unlockedZones.filter((id) => !before.has(id));
    if (boss?.atlasFinal) {
      const ending = options.ending || 'ending_mend';
      if (!progress.endings.includes(ending)) progress.endings.push(ending);
      result.ending = ending;
    }
  }
  return result;
}

export function atlasStats(progress) {
  const totalRooms = ATLAS_ROOM_COUNT;
  const cleared = Object.keys(progress.clearedRooms || {}).length;
  const bosses = Object.keys(progress.zoneBosses || {}).length;
  return {
    cleared,
    totalRooms,
    percent: totalRooms ? cleared / totalRooms : 0,
    bosses,
    totalBosses: ATLAS_ZONES.length,
    zones: progress.unlockedZones?.length || 0,
    abilities: progress.abilities?.length || 0,
    marks: progress.marks || 0,
    fragments: progress.loreFragments || 0,
  };
}

/**
 * Apply owned gear to a live game instance. This is intentionally called only
 * for Atlas runs so the legacy campaign keeps its original balance.
 */
export function applyAtlasLoadout(game, progress) {
  if (!game || !game.player) return null;
  const p = game.player;
  const armor = ATLAS_ARMOR_SETS.find((item) => item.id === progress.equippedArmor) || null;
  const rawWeapon = ATLAS_WEAPON_BY_ID[progress.equippedWeapon] || null;
  const weapon = rawWeapon
    ? applyInfusion(rawWeapon, progress.weaponInfusions?.[rawWeapon.id] || 'none')
    : null;
  const charms = (progress.equippedCharms || [])
    .map((id) => ATLAS_CHARMS.find((item) => item.id === id))
    .filter(Boolean);
  const bonus = { hp: 0, damage: 0, speed: 0, dash: 0, flask: 0, defense: 0, ash: 0, echo: 0 };
  if (armor) {
    bonus.hp += armor.hp;
    bonus.damage += armor.damage;
    bonus.speed += armor.speed;
  }
  for (const charm of charms) {
    if (charm.effect === 'hp') bonus.hp += charm.value;
    else if (charm.effect === 'damage') bonus.damage += charm.value;
    else if (charm.effect === 'speed') bonus.speed += charm.value;
    else if (charm.effect === 'dash') bonus.dash += charm.value;
    else if (charm.effect === 'flask') bonus.flask += charm.value;
    else if (charm.effect === 'defense') bonus.defense += charm.value;
    else if (charm.effect === 'ash') bonus.ash += charm.value;
    else if (charm.effect === 'echo') bonus.echo += charm.value;
    else if (charm.effect === 'all') {
      bonus.hp += 8;
      bonus.damage += charm.value;
      bonus.speed += charm.value;
    }
  }
  const mastery = weapon ? weaponMasteryFor(progress, weapon.id) : { bonus: 1 };
  if (weapon) {
    bonus.damage += weapon.damage - 1;
    bonus.speed += weapon.speed - 1;
    p.weapon = weapon.base;
    if (!p.weapons.includes(weapon.base)) p.weapons.push(weapon.base);
  }
  p.maxHp = Math.max(1, Math.round(p.maxHp + bonus.hp));
  p.hp = p.maxHp;
  p.damageMult *= (1 + bonus.damage) * mastery.bonus;
  p.speedMult *= 1 + bonus.speed;
  p.dashCooldownMax *= Math.max(0.5, 1 - bonus.dash);
  p.maxFlasks = Math.max(1, p.maxFlasks + bonus.flask);
  p.flasks = p.maxFlasks;
  game.atlasBonus = bonus;
  game.atlasWeapon = weapon;
  return bonus;
}
