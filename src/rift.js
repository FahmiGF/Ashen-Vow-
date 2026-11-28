// Ashen Vow v0.44.0 — ARC IV: THE RIFT.
//
// Below the fallen Choir and the marching Crusade, two overlapping realities
// grind against one another. Five regions x five stages plus two secret vaults
// (global rooms 874-900, 27 rooms total), eight Rift enemy archetypes, six
// multi-phase bosses culminating in The Devilish Scum, and the Dual-Reality
// Fracture + Phase-Shift [F] mechanic.
//
// Pure data + deterministic rules: no DOM, no audio, no storage.

export const RIFT_VERSION = 1;
export const RIFT_ARC_ID = 'rift';
export const RIFT_NAME = 'The Rift';
export const RIFT_LOCAL_NAME = 'Celah';
export const RIFT_SUBTITLE = 'Di bawah surga yang runtuh, dua kenyataan saling mengiris.';
export const RIFT_PITCH = 'Dua kenyataan berimpit. Geser fasa sebelum lantai menghilang di bawah kakimu.';

export const RIFT_ROOM_START = 874;
export const RIFT_REGION_COUNT = 5;
export const RIFT_STAGES_PER_REGION = 5;
export const RIFT_SECRET_COUNT = 2;
export const RIFT_ROOM_COUNT = RIFT_REGION_COUNT * RIFT_STAGES_PER_REGION + RIFT_SECRET_COUNT; // 27 (874-900)
export const RIFT_FLOOR_Y = 470;
export const RIFT_WORLD_W = 1400;
export const RIFT_FRACTURE_INTERVAL = 8.0;
export const RIFT_PHASE_SHIFT_COOLDOWN = 2.2;

const asInt = (value, fallback = 0) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);

export const RIFT_ZONE = {
  id: 'rift',
  name: 'The Rift',
  localName: 'Celah Dua Kenyataan',
  color: '#c94a6a',
  glow: '#7de8ff',
  music: 'rift',
  bossMusic: 'riftBoss',
  particle: 'rift',
  palette: {
    top: '#0c0512',
    mid: '#220d26',
    low: '#3a1432',
    glow: '#e05a7a',
    fog: '#4e1f45',
  },
};

const REGION_SOURCE = [
  {
    id: 'rift_mouth',
    name: 'Rift Mouth',
    localName: 'Mulut Celah',
    subtitle: 'Shattered threshold where gravity splits between Phase A and Phase B',
    gimmick: 'Pelat fasa A dan B bergantian tiap 8 detik. Tekan [F] untuk membalik kenyataan.',
    boss: 'rift_maw_herald',
    color: '#d95b72',
    glow: '#ff9eb5',
    particle: 'rift',
    music: 'rift',
    glyph: '◈',
    enemies: ['rift_shardling', 'rift_watcher'],
    hint: 'Jangan berdiri di atas pelat hantu tanpa menggeser fasa.',
    palette: { top: '#100612', mid: '#291028', low: '#43193b', glow: '#f06b88', fog: '#522248' },
  },
  {
    id: 'inverted_bastion',
    name: 'Inverted Bastion',
    localName: 'Benteng Terbalik',
    subtitle: 'Upside-down ramparts suspended inside the fracture seam',
    gimmick: 'Jembatan bertingkat hanya utuh di satu fasa; lompat dan geser fasa di udara.',
    boss: 'rift_inverted_castellan',
    color: '#7ab8ff',
    glow: '#bce4ff',
    particle: 'rift',
    music: 'rift',
    glyph: '⛨',
    enemies: ['rift_skitter', 'rift_anchor_brute', 'rift_veil'],
    hint: 'Selubung Fasa pecah saat terkena ledakan Phase-Shift [F] atau Peringkat A+.',
    palette: { top: '#070e1a', mid: '#14233b', low: '#213a5e', glow: '#7ec8ff', fog: '#2a476e' },
  },
  {
    id: 'glass_sea',
    name: 'Sea of Glass Knives',
    localName: 'Lautan Pisau Kaca',
    subtitle: 'Razor shards suspended over an abyss of frozen reflections',
    gimmick: 'Lantai terputus-putus; gunakan pijakan A/B sebagai batu loncatan.',
    boss: 'rift_glass_seraph',
    color: '#9ee6ff',
    glow: '#e4f8ff',
    particle: 'snow',
    music: 'rift',
    glyph: '✦',
    enemies: ['rift_glass_weaver', 'rift_shardling', 'rift_veil'],
    hint: 'Serangan beruntun menaikkan Oath Resonance hingga ASHEN.',
    palette: { top: '#061218', mid: '#102935', low: '#1d4454', glow: '#9ee6ff', fog: '#28586b' },
  },
  {
    id: 'hollow_orchard',
    name: 'Hollow Orchard of Echoes',
    localName: 'Kebun Gema Hampa',
    subtitle: 'Pale crystal boughs repeating oaths sworn in dead timelines',
    gimmick: 'Gema musuh menyerang dari dua sisi; pecahkan pelindung mereka dengan [F].',
    boss: 'rift_echo_matriarch',
    color: '#c48bff',
    glow: '#ead6ff',
    particle: 'spores',
    music: 'rift',
    glyph: '❀',
    enemies: ['rift_echo_hound', 'rift_glass_weaver', 'rift_veil'],
    hint: 'Setiap Phase-Shift [F] melepaskan gelombang kejut yang mematahkan posisi musuh.',
    palette: { top: '#0e0718', mid: '#211238', low: '#341e54', glow: '#c48bff', fog: '#422866' },
  },
  {
    id: 'the_seam',
    name: 'The Seam',
    localName: 'Jahitan Akhir',
    subtitle: 'Where the Devilish Scum stitches stolen worlds together',
    gimmick: 'Dua bos beruntun menjaga inti Celah; pertahankan ritme Resonance.',
    boss: 'rift_devilish_scum',
    color: '#ff5268',
    glow: '#ffd0d8',
    particle: 'embers',
    music: 'riftBoss',
    glyph: '❖',
    enemies: ['rift_seam_warden', 'rift_anchor_brute', 'rift_echo_hound', 'rift_veil'],
    hint: 'Di Jahitan Akhir, bahkan kesalahan kecil memicu fasa baru.',
    palette: { top: '#14040a', mid: '#2e0a16', low: '#4a1224', glow: '#ff5c74', fog: '#5c182c' },
  },
];

export const RIFT_REGIONS = REGION_SOURCE.map((region, idx) => ({
  ...region,
  order: idx + 1,
  roomStart: RIFT_ROOM_START + idx * RIFT_STAGES_PER_REGION,
  roomEnd: RIFT_ROOM_START + idx * RIFT_STAGES_PER_REGION + RIFT_STAGES_PER_REGION - 1,
}));

export const RIFT_ENEMY_INFO = {
  rift_shardling: {
    name: 'Rift Shardling',
    ai: 'chaser',
    hp: 68,
    speed: 148,
    dmg: 14,
    w: 28,
    h: 40,
    color: '#d95b72',
    reward: 18,
  },
  rift_watcher: {
    name: 'Rift Watcher',
    ai: 'ranged',
    hp: 60,
    speed: 96,
    dmg: 15,
    w: 28,
    h: 44,
    color: '#7ec8ff',
    reward: 20,
  },
  rift_skitter: {
    name: 'Phase Skitter',
    ai: 'lunge',
    hp: 76,
    speed: 162,
    dmg: 17,
    w: 32,
    h: 36,
    color: '#9ee6ff',
    reward: 22,
  },
  rift_anchor_brute: {
    name: 'Anchor Brute',
    ai: 'slam',
    hp: 118,
    speed: 92,
    dmg: 22,
    w: 42,
    h: 56,
    color: '#8f6bd8',
    reward: 28,
  },
  rift_glass_weaver: {
    name: 'Glass Weaver',
    ai: 'ranged',
    hp: 74,
    speed: 108,
    dmg: 18,
    w: 30,
    h: 46,
    color: '#b8f0ff',
    reward: 24,
  },
  rift_echo_hound: {
    name: 'Echo Hound',
    ai: 'lunge',
    hp: 84,
    speed: 175,
    dmg: 19,
    w: 36,
    h: 36,
    color: '#c48bff',
    reward: 25,
  },
  rift_veil: {
    name: 'Veilbound Stalker',
    ai: 'chaser',
    hp: 96,
    speed: 142,
    dmg: 18,
    w: 32,
    h: 48,
    color: '#ff8aa8',
    reward: 32,
    veil: true,
    elite: true,
  },
  rift_seam_warden: {
    name: 'Seam Warden',
    ai: 'slam',
    hp: 142,
    speed: 100,
    dmg: 24,
    w: 44,
    h: 58,
    color: '#ff5268',
    reward: 38,
    veil: true,
    elite: true,
  },
};

export const RIFT_BOSS_INFO = {
  rift_maw_herald: {
    name: 'Herald of the Maw',
    title: 'Penjaga Mulut Celah',
    hp: 560,
    w: 58,
    h: 82,
    color: '#e05a7a',
    maxPhases: 2,
    phaseThresholds: [0.52],
    speed: 138,
    dmg: 20,
    contact: 18,
    reward: 90,
    music: 'riftBoss',
    dialogue: {
      intro: [{ speaker: 'Herald of the Maw', text: 'Kau melangkah ke celah di antara dua sumpah. Di sini tak ada langit yang memaafkan.' }],
      phase2: [{ speaker: 'Herald of the Maw', text: 'Dua kenyataan beradu—pilih pijakanmu atau jatuh bersama gema!' }],
      defeat: [{ speaker: 'Herald of the Maw', text: 'Mulut Celah terbuka lebih lebar. Yang di bawah telah mendengar langkahmu.' }],
    },
  },
  rift_inverted_castellan: {
    name: 'Inverted Castellan',
    title: 'Panglima Benteng Terbalik',
    hp: 660,
    w: 62,
    h: 88,
    color: '#7ec8ff',
    maxPhases: 2,
    phaseThresholds: [0.5],
    speed: 146,
    dmg: 22,
    contact: 20,
    reward: 110,
    music: 'riftBoss',
    dialogue: {
      intro: [{ speaker: 'Inverted Castellan', text: 'Benteng ini dibangun terbalik agar surga tak pernah menemukan pondasinya.' }],
      phase2: [{ speaker: 'Inverted Castellan', text: 'Fasa dibalik! Tembok yang kau pijak kini milik bayangan.' }],
      defeat: [{ speaker: 'Inverted Castellan', text: 'Batu terbalik runtuh ke atas. Teruskan ke lautan kaca.' }],
    },
  },
  rift_glass_seraph: {
    name: 'Shattered Glass Seraph',
    title: 'Serafim Pecahan Kaca',
    hp: 740,
    w: 60,
    h: 92,
    color: '#9ee6ff',
    maxPhases: 2,
    phaseThresholds: [0.48],
    speed: 156,
    dmg: 24,
    contact: 22,
    reward: 130,
    music: 'riftBoss',
    dialogue: {
      intro: [{ speaker: 'Shattered Glass Seraph', text: 'Setiap sayapku adalah cermin dari dunia yang pernah kau bakar.' }],
      phase2: [{ speaker: 'Shattered Glass Seraph', text: 'Lihat pantulanmu di seribu bilah kaca—tak satu pun yang utuh!' }],
      defeat: [{ speaker: 'Shattered Glass Seraph', text: 'Cerminnya retak, tetapi suara di balik jahitan masih bernyanyi.' }],
    },
  },
  rift_echo_matriarch: {
    name: 'Orchard Echo Matriarch',
    title: 'Ibu Gema Kebun Kristal',
    hp: 820,
    w: 66,
    h: 94,
    color: '#c48bff',
    maxPhases: 2,
    phaseThresholds: [0.48],
    speed: 152,
    dmg: 25,
    contact: 24,
    reward: 150,
    music: 'riftBoss',
    dialogue: {
      intro: [{ speaker: 'Orchard Echo Matriarch', text: 'Di kebun ini, setiap janji yang diingkari tumbuh menjadi akar berduri.' }],
      phase2: [{ speaker: 'Orchard Echo Matriarch', text: 'Dengarkan gema semua kesatria sebelum dirimu!' }],
      defeat: [{ speaker: 'Orchard Echo Matriarch', text: 'Gema-gema itu terdiam. Hanya Jahitan Akhir yang tersisa.' }],
    },
  },
  rift_seam_arbiter: {
    name: 'Arbiter of the Seam',
    title: 'Hakim Jahitan Pertama',
    hp: 900,
    w: 64,
    h: 96,
    color: '#ff7090',
    maxPhases: 2,
    phaseThresholds: [0.45],
    speed: 160,
    dmg: 27,
    contact: 25,
    reward: 175,
    music: 'riftBoss',
    dialogue: {
      intro: [{ speaker: 'Arbiter of the Seam', text: 'Tak ada peziarah yang melewati Jahitan tanpa menimbang berat abunya.' }],
      phase2: [{ speaker: 'Arbiter of the Seam', text: 'Fasa A dan Fasa B kuikat menjadi satu tebasan!' }],
      defeat: [{ speaker: 'Arbiter of the Seam', text: 'Hakim tumbang. Kini Penguasa Celah menunggumu di ruang sebelah.' }],
    },
  },
  rift_devilish_scum: {
    name: 'The Devilish Scum',
    title: 'Penguasa Celah · Jahitan Terakhir',
    hp: 1180,
    w: 72,
    h: 104,
    color: '#ff3b5c',
    maxPhases: 3,
    phaseThresholds: [0.66, 0.33],
    speed: 168,
    dmg: 30,
    contact: 28,
    reward: 'victory',
    music: 'riftBoss',
    dialogue: {
      intro: [{ speaker: 'The Devilish Scum', text: 'Akhirnya datang juga. Aku adalah sisa dari setiap dunia yang tak pernah kau selamatkan.' }],
      phase2: [{ speaker: 'The Devilish Scum', text: 'Celah tidak memilih sisi—aku merobek keduanya sekaligus!' }],
      phase3: [{ speaker: 'The Devilish Scum', text: 'Habiskan semua Oath Resonance-mu! Tunjukkan apa arti sumpah di ujung kehampaan!' }],
      defeat: [
        { speaker: 'The Devilish Scum', text: 'Jahitan terlepas... Dua kenyataan kembali bernapas. Celah bukan lagi penjara.' },
        { speaker: 'The Oathbound', text: 'Sumpah di balik celah pun kini selesai.' },
      ],
    },
  },
};

function makeRiftPlatforms(regionIdx, stageIdx) {
  const gap = stageIdx % 2 === 1;
  const platforms = [
    // Anchor floors (always solid in both realities)
    { x: 0, y: RIFT_FLOOR_Y, w: gap ? 380 : 1400, h: 100 },
  ];
  if (gap) {
    platforms.push({ x: 520, y: RIFT_FLOOR_Y, w: 320, h: 100 });
    platforms.push({ x: 980, y: RIFT_FLOOR_Y, w: 420, h: 100 });
  }
  // Dual-reality traversal platforms
  platforms.push({ x: 240, y: 378, w: 180, h: 18, reality: 'a' });
  platforms.push({ x: 420, y: 334, w: 170, h: 18, reality: 'b' });
  platforms.push({ x: 650, y: 294, w: 190, h: 18, reality: 'a' });
  platforms.push({ x: 890, y: 342, w: 180, h: 18, reality: 'b' });
  platforms.push({ x: 1110, y: 382, w: 150, h: 18, reality: 'a' });
  // Secret-route high bridge on stage 4 of Region 1 (877 -> secret 899) and stage 4 of Region 5 (896 -> secret 900)
  if (regionIdx === 0 && stageIdx === 3) {
    platforms.push({ x: 760, y: 220, w: 200, h: 16, reality: 'b' });
  }
  if (regionIdx === 4 && stageIdx === 2) {
    platforms.push({ x: 740, y: 215, w: 220, h: 16, reality: 'b' });
  }
  return platforms;
}

function makeRiftEnemies(region, stageIdx, isBossRoom) {
  if (isBossRoom) return [];
  const pool = region.enemies;
  const count = 3 + (stageIdx % 3);
  const out = [];
  for (let i = 0; i < count; i++) {
    const type = pool[(stageIdx + i) % pool.length];
    const x = 360 + i * 210;
    const onHigh = i % 2 === 1;
    const y = onHigh ? 330 - 48 : RIFT_FLOOR_Y - (RIFT_ENEMY_INFO[type]?.h || 44);
    out.push({
      type,
      x,
      y,
      minX: Math.max(80, x - 140),
      maxX: Math.min(RIFT_WORLD_W - 100, x + 140),
    });
  }
  return out;
}

const REGION_STAGES = [
  ['Ambang Retak', 'Jembatan Gema', 'Tangga Fasa', 'Menara Pecah', 'Tahta Mulut Celah'],
  ['Gerbang Terbalik', 'Parit Menggantung', 'Balkon Bayangan', 'Menara Sungsang', 'Balairung Castellan'],
  ['Pantai Beling', 'Arus Beku', 'Cermin Terapung', 'Katedral Kaca', 'Altar Serafim Kaca'],
  ['Gerbang Akar', 'Lorong Gema', 'Kebun Kristal', 'Pohon Sumpah Mati', 'Sarang Ibu Gema'],
  ['Benang Pertama', 'Simpul Retak', 'Persimpangan Jahitan', 'Singgasana Hakim', 'Inti Celah'],
];

const ROOM_LIST = [];
let globalIdx = RIFT_ROOM_START;

for (let r = 0; r < RIFT_REGIONS.length; r++) {
  const region = RIFT_REGIONS[r];
  const titles = REGION_STAGES[r];
  for (let s = 0; s < RIFT_STAGES_PER_REGION; s++) {
    const localNum = r * RIFT_STAGES_PER_REGION + s;
    const isRegionBoss = s === RIFT_STAGES_PER_REGION - 1;
    const isMidArbiter = r === 4 && s === 3;
    const bossKind = isRegionBoss ? region.boss : isMidArbiter ? 'rift_seam_arbiter' : null;
    const nextIdx = globalIdx < RIFT_ROOM_START + 24 ? globalIdx + 1 : null;
    const secretGate =
      globalIdx === 877
        ? { x: 840, y: 132, w: 46, h: 88, next: 899, label: 'Celah Rahasia: Relikuari Retak' }
        : globalIdx === 896
          ? { x: 820, y: 127, w: 46, h: 88, next: 900, label: 'Celah Rahasia: Ruang Tanpa Jahitan' }
          : null;

    ROOM_LIST.push({
      id: globalIdx,
      key: `rift_${localNum}`,
      index: globalIdx,
      name: `${region.name} — ${titles[s]}`,
      subtitle: `${region.localName} · Tahap ${s + 1}/5`,
      zone: 'rift',
      biome: 'rift',
      rift: true,
      riftRegion: region.id,
      riftStage: s + 1,
      fractureInterval: RIFT_FRACTURE_INTERVAL,
      weather: region.particle,
      condition: region.gimmick,
      worldW: RIFT_WORLD_W,
      spawn: { x: 80, y: RIFT_FLOOR_Y - 46 },
      gate: nextIdx
        ? { x: 1318, y: RIFT_FLOOR_Y - 88, w: 48, h: 88, next: nextIdx, label: `Ke Tahap ${localNum + 2}` }
        : null,
      secretGate,
      platforms: makeRiftPlatforms(r, s),
      enemies: makeRiftEnemies(region, s, !!bossKind),
      boss: bossKind || null,
      checkpoint: s === 0 || !!bossKind ? { x: 140, y: RIFT_FLOOR_Y - 44, w: 36, h: 44, name: titles[s] } : null,
      npcs:
        s === 0
          ? [{ name: 'Rift Anchor', localName: 'Jangkar Celah', x: 190, y: RIFT_FLOOR_Y - 46, line: region.hint }]
          : [],
    });
    globalIdx += 1;
  }
}

// 2 Secret Rooms (899, 900)
ROOM_LIST.push({
  id: 899,
  key: 'rift_25',
  index: 899,
  name: 'Fractured Reliquary (Secret)',
  subtitle: 'Relikuari Retak · Ruang Rahasia I',
  zone: 'rift',
  biome: 'rift',
  rift: true,
  secret: true,
  riftRegion: 'rift_mouth',
  fractureInterval: RIFT_FRACTURE_INTERVAL,
  weather: 'rift',
  condition: 'Ruang rahasia Fasa B — kalahkan penjaga untuk mengklaim Abu Celah.',
  worldW: RIFT_WORLD_W,
  spawn: { x: 80, y: RIFT_FLOOR_Y - 46 },
  gate: { x: 1318, y: RIFT_FLOOR_Y - 88, w: 48, h: 88, next: 878, label: 'Kembali ke Tahta Mulut Celah' },
  platforms: [
    { x: 0, y: RIFT_FLOOR_Y, w: 1400, h: 100 },
    { x: 280, y: 360, w: 220, h: 18, reality: 'b' },
    { x: 600, y: 300, w: 220, h: 18, reality: 'a' },
    { x: 920, y: 360, w: 220, h: 18, reality: 'b' },
  ],
  enemies: [
    { type: 'rift_veil', x: 520, y: RIFT_FLOOR_Y - 48, minX: 340, maxX: 780 },
    { type: 'rift_glass_weaver', x: 860, y: RIFT_FLOOR_Y - 46, minX: 680, maxX: 1100 },
  ],
  boss: null,
  checkpoint: { x: 140, y: RIFT_FLOOR_Y - 44, w: 36, h: 44, name: 'Relikuari Retak' },
  npcs: [{ name: 'Echo of Sera', localName: 'Gema Fasa', x: 210, y: RIFT_FLOOR_Y - 46, line: 'Rahasia pertama tersembunyi di antara dua detak Celah.' }],
});

ROOM_LIST.push({
  id: 900,
  key: 'rift_26',
  index: 900,
  name: 'Unseamed Vault (Secret)',
  subtitle: 'Ruang Tanpa Jahitan · Ruang Rahasia II',
  zone: 'rift',
  biome: 'rift',
  rift: true,
  secret: true,
  riftRegion: 'the_seam',
  fractureInterval: RIFT_FRACTURE_INTERVAL,
  weather: 'embers',
  condition: 'Ruang rahasia Fasa B — para Warden menjaga peninggalan terakhir.',
  worldW: RIFT_WORLD_W,
  spawn: { x: 80, y: RIFT_FLOOR_Y - 46 },
  gate: { x: 1318, y: RIFT_FLOOR_Y - 88, w: 48, h: 88, next: 897, label: 'Kembali ke Singgasana Hakim' },
  platforms: [
    { x: 0, y: RIFT_FLOOR_Y, w: 1400, h: 100 },
    { x: 260, y: 350, w: 210, h: 18, reality: 'a' },
    { x: 580, y: 290, w: 240, h: 18, reality: 'b' },
    { x: 920, y: 350, w: 210, h: 18, reality: 'a' },
  ],
  enemies: [
    { type: 'rift_seam_warden', x: 560, y: RIFT_FLOOR_Y - 58, minX: 360, maxX: 820 },
    { type: 'rift_veil', x: 920, y: RIFT_FLOOR_Y - 48, minX: 760, maxX: 1180 },
  ],
  boss: null,
  checkpoint: { x: 140, y: RIFT_FLOOR_Y - 44, w: 36, h: 44, name: 'Ruang Tanpa Jahitan' },
  npcs: [{ name: 'Unseamed Witness', localName: 'Saksi Tanpa Jahitan', x: 210, y: RIFT_FLOOR_Y - 46, line: 'Tak ada benang yang bisa menjahit ulang sumpah yang sudah tergenapi.' }],
});

export const RIFT_ROOMS = ROOM_LIST;

// ── progress & unlock ────────────────────────────────────────────────────────
export function defaultRiftProgress() {
  return {
    version: RIFT_VERSION,
    unlocked: false,
    cleared: false,
    roomsCleared: {},
    bosses: {},
    secretsFound: {},
    bestResonance: 'D',
    phaseShifts: 0,
  };
}

export function sanitizeRiftProgress(raw) {
  const base = defaultRiftProgress();
  if (!raw || typeof raw !== 'object') return base;
  const roomsCleared = {};
  if (raw.roomsCleared && typeof raw.roomsCleared === 'object') {
    for (const [k, v] of Object.entries(raw.roomsCleared)) {
      const idx = asInt(k, -1);
      if (idx >= RIFT_ROOM_START && idx < RIFT_ROOM_START + RIFT_ROOM_COUNT && v) {
        roomsCleared[idx] = true;
      }
    }
  }
  const bosses = {};
  if (raw.bosses && typeof raw.bosses === 'object') {
    for (const key of Object.keys(RIFT_BOSS_INFO)) {
      if (raw.bosses[key]) bosses[key] = true;
    }
  }
  const secretsFound = {};
  if (raw.secretsFound && typeof raw.secretsFound === 'object') {
    if (raw.secretsFound[899]) secretsFound[899] = true;
    if (raw.secretsFound[900]) secretsFound[900] = true;
  }
  const validRanks = ['D', 'C', 'B', 'A', 'S', 'ASHEN'];
  const bestResonance = validRanks.includes(raw.bestResonance) ? raw.bestResonance : 'D';
  return {
    version: RIFT_VERSION,
    unlocked: !!raw.unlocked || Object.keys(roomsCleared).length > 0 || Object.keys(bosses).length > 0,
    cleared: !!raw.cleared || !!bosses.rift_devilish_scum,
    roomsCleared,
    bosses,
    secretsFound,
    bestResonance,
    phaseShifts: Math.max(0, asInt(raw.phaseShifts, 0)),
  };
}

export function riftUnlocked(progress) {
  if (!progress || typeof progress !== 'object') return false;
  if (progress.rift?.unlocked || progress.rift?.cleared) return true;
  if (progress.crusade?.bosses?.paladin || progress.crusade?.cleared) return true;
  if (progress.victory || (Array.isArray(progress.endingsUnlocked) && progress.endingsUnlocked.length > 0)) return true;
  return false;
}

export function recordRiftRoom(progress, roomIndex) {
  const rift = sanitizeRiftProgress(progress?.rift);
  if (roomIndex >= RIFT_ROOM_START && roomIndex < RIFT_ROOM_START + RIFT_ROOM_COUNT) {
    rift.unlocked = true;
    rift.roomsCleared[roomIndex] = true;
    if (roomIndex === 899 || roomIndex === 900) rift.secretsFound[roomIndex] = true;
  }
  return rift;
}

export function recordRiftBoss(progress, bossKind) {
  const rift = sanitizeRiftProgress(progress?.rift);
  if (RIFT_BOSS_INFO[bossKind]) {
    rift.unlocked = true;
    rift.bosses[bossKind] = true;
    if (bossKind === 'rift_devilish_scum') rift.cleared = true;
  }
  return rift;
}

export function riftSummary(progress) {
  const rift = sanitizeRiftProgress(progress?.rift);
  const rooms = Object.keys(rift.roomsCleared).length;
  const bosses = Object.keys(rift.bosses).length;
  const secrets = Object.keys(rift.secretsFound).length;
  return {
    unlocked: riftUnlocked(progress),
    cleared: rift.cleared,
    rooms,
    totalRooms: RIFT_ROOM_COUNT,
    bosses,
    totalBosses: Object.keys(RIFT_BOSS_INFO).length,
    secrets,
    totalSecrets: RIFT_SECRET_COUNT,
    bestResonance: rift.bestResonance,
    phaseShifts: rift.phaseShifts,
  };
}

export function validateRiftRooms() {
  const errors = [];
  if (RIFT_ROOMS.length !== RIFT_ROOM_COUNT) {
    errors.push(`Expected ${RIFT_ROOM_COUNT} Rift rooms, got ${RIFT_ROOMS.length}`);
  }
  for (let i = 0; i < RIFT_ROOMS.length; i++) {
    const room = RIFT_ROOMS[i];
    if (room.index !== RIFT_ROOM_START + i) {
      errors.push(`Room ${room.id} expected index ${RIFT_ROOM_START + i}, got ${room.index}`);
    }
    const hasA = room.platforms.some((p) => p.reality === 'a');
    const hasB = room.platforms.some((p) => p.reality === 'b');
    if (!hasA || !hasB) {
      errors.push(`Room ${room.id} missing dual-reality platforms`);
    }
    for (const e of room.enemies) {
      if (!RIFT_ENEMY_INFO[e.type]) errors.push(`Unknown enemy ${e.type} in ${room.id}`);
    }
    if (room.boss && !RIFT_BOSS_INFO[room.boss]) {
      errors.push(`Unknown boss ${room.boss} in ${room.id}`);
    }
  }
  return { ok: errors.length === 0, errors };
}
