// Ashen Vow — ARC VI: THE ASTRAL DOMINION
// Pure campaign data and progression. The engine appends these rooms after
// The Radiant Crusade (global ids 505-524); no legacy room is renumbered.
//
//   • 5 regions x (3 halls + 1 boss) = 20 rooms
//   • exactly 20 enemies per standard hall: 4 archetypes + 1 guaranteed elite
//   • 5 bosses, including the four-phase Architect of Eternity
//   • progress.astral in the existing save, plus the locked Unwritten Expanse

export const ASTRAL_VERSION = 1;
export const ASTRAL_ARC_ID = 'astral';
export const ASTRAL_ARC_NUMBER = 6;
export const ASTRAL_NAME = 'The Astral Dominion';
export const ASTRAL_LOCAL_NAME = 'Dominion Astral';
export const ASTRAL_SUBTITLE = 'Di atas langit, jaringan bintang mengingat namamu.';
export const ASTRAL_PITCH = 'Surga hanyalah kulit terluar. Di baliknya, sesuatu menghitung takdir.';

export const ASTRAL_ROOM_START = 505;
export const ASTRAL_REGION_COUNT = 5;
export const ASTRAL_ROOMS_PER_REGION = 4;
export const ASTRAL_ROOM_COUNT = ASTRAL_REGION_COUNT * ASTRAL_ROOMS_PER_REGION; // 20
export const ASTRAL_FLOOR_Y = 470;
export const ASTRAL_WORLD_W = 1400;
export const ASTRAL_STANDARD_ENEMIES = 20;
export const ASTRAL_ARCHETYPE_COUNT = 4;
export const ASTRAL_ELITES_PER_STAGE = 1;

const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);
const asInt = (value, fallback = 0) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
};

// ── regions ────────────────────────────────────────────────────────────────
const REGION_SOURCE = [
  {
    id: 'starfall_passage',
    name: 'Starfall Passage',
    localName: 'Jalur Bintang Jatuh',
    subtitle: 'Broken celestial pathways',
    theme: 'Jalur langit yang patah dan jembatan bintang',
    gimmick: 'Star bridges menyala saat tiga bintang kecil disentuh; gravity distortion menarik lompatan ke bawah.',
    boss: 'star_eaten_sentinel',
    reward: 'Astral Ward armor',
    glyph: '✧',
    color: '#9fc8ff',
    music: 'stormexpanse',
    particle: 'stars',
    palette: { top: '#050814', mid: '#14223f', low: '#385e92', glow: '#cfe6ff', fog: '#223b60' },
    hint: 'Jembatan pertama tidak menunggu langkahmu. Ia menunggu cahaya yang tepat.',
  },
  {
    id: 'nebula_gardens',
    name: 'Nebula Gardens',
    localName: 'Taman Nebula',
    subtitle: 'Living cosmic plants',
    theme: 'Taman kosmik yang bernapas dan menutup jalan',
    gimmick: 'Nebula vines membuka dan menutup lorong setiap beberapa detik; astral energy memicu pertumbuhan.',
    boss: 'nebula_harvester',
    reward: 'Nebula Bloom cosmetic',
    glyph: '❋',
    color: '#c7a4ff',
    music: 'glassorchard',
    particle: 'motes',
    palette: { top: '#0b0618', mid: '#2b1748', low: '#6f4a9e', glow: '#f0dcff', fog: '#3f2a60' },
    hint: 'Taman ini tidak mengenal musim. Ia hanya mengenal siapa yang berani menyentuh akarnya.',
  },
  {
    id: 'astral_observatory',
    name: 'The Astral Observatory',
    localName: 'Observatorium Astral',
    subtitle: 'Ancient star machinery',
    theme: 'Mesin bintang kuno dan lensa tak berujung',
    gimmick: 'Cosmic gates memindahkanmu antar platform; celestial memory fragments membuka lore tersembunyi.',
    boss: 'clockwork_oracle',
    reward: "Oracle's Lens weapon set",
    glyph: '◎',
    color: '#ffd88a',
    music: 'reliquary',
    particle: 'glass',
    palette: { top: '#0c0a08', mid: '#3d3220', low: '#8b7444', glow: '#fff4c8', fog: '#5e4c2e' },
    hint: 'Lensa itu melihat semua kemungkinan. Sayangnya, kau hanya bisa memilih satu.',
  },
  {
    id: 'voidbound_citadel',
    name: 'Voidbound Citadel',
    localName: 'Benteng Ikatan Void',
    subtitle: 'Distorted gravity and space',
    theme: 'Benteng dengan gravitasi terbalik dan lorong yang salah arah',
    gimmick: 'Dimensional anomalies menukar platform dan musuh; gravitasi berubah setiap fase bos.',
    boss: 'gravity_tyrant',
    reward: 'Voidbound armor and effects',
    glyph: '◈',
    color: '#b78cff',
    music: 'lastvigil',
    particle: 'void',
    palette: { top: '#05040c', mid: '#211638', low: '#4f3478', glow: '#e0c8ff', fog: '#342452' },
    hint: 'Di sini, jatuh belum tentu ke bawah. Tapi kau tetap bisa jatuh.',
  },
  {
    id: 'eternal_throne',
    name: 'The Eternal Throne',
    localName: 'Takhta Abadi',
    subtitle: 'The final celestial fortress',
    theme: 'Takhta bintang dan inti Dominion',
    gimmick: 'Semua mekanik Astral bergabung; The Architect mengubah arena di setiap fase.',
    boss: 'architect_of_eternity',
    reward: "Architect's Core + Astral Sovereign set",
    glyph: '♛',
    color: '#ffe7a3',
    music: 'bossJudge',
    particle: 'halos',
    palette: { top: '#100c05', mid: '#4b3814', low: '#a88a42', glow: '#fffbe0', fog: '#6c5222' },
    hint: 'Takhta itu kosong karena tidak ada yang cukup besar untuk duduk di sana.',
  },
];

export const ASTRAL_REGIONS = REGION_SOURCE.map((region, index) => ({
  ...region,
  index,
  roomStart: ASTRAL_ROOM_START + index * ASTRAL_ROOMS_PER_REGION,
  bossRoom: ASTRAL_ROOM_START + index * ASTRAL_ROOMS_PER_REGION + ASTRAL_ROOMS_PER_REGION - 1,
  final: index === ASTRAL_REGION_COUNT - 1,
}));

export const ASTRAL_REGION_BY_ID = Object.fromEntries(ASTRAL_REGIONS.map((region) => [region.id, region]));

// ── enemies ────────────────────────────────────────────────────────────────
const ENEMY_SOURCE = [
  {
    id: 'starbound_wraith',
    name: 'Starbound Wraith',
    localName: 'Hantu Terikat Bintang',
    title: 'Fast Melee',
    behavior: 'chaser',
    hp: 180, dmg: 22, speed: 128, w: 42, h: 64, reward: 24,
    color: '#b9d8ff', glyph: '✦', desc: 'Mengejar cepat sambil meninggalkan jejak cahaya dingin.',
  },
  {
    id: 'nebula_caster',
    name: 'Nebula Caster',
    localName: 'Penyihir Nebula',
    title: 'Ranged Energy',
    behavior: 'ranged',
    hp: 150, dmg: 26, speed: 88, w: 40, h: 60, reward: 26,
    color: '#d6b6ff', glyph: '✧', flying: true, desc: 'Menembak bola nebula yang meledak menjadi debu bintang.',
  },
  {
    id: 'astral_guardian',
    name: 'Astral Guardian',
    localName: 'Penjaga Astral',
    title: 'Defensive',
    behavior: 'slam',
    hp: 360, dmg: 30, speed: 70, w: 72, h: 88, reward: 36,
    color: '#e8d8a8', glyph: '⛨', desc: 'Perisai bintang menahan damage dari depan; pukul saat ia berputar.',
  },
  {
    id: 'void_stalker',
    name: 'Void Stalker',
    localName: 'Pengintai Void',
    title: 'Ambush',
    behavior: 'burrower',
    hp: 220, dmg: 34, speed: 116, w: 48, h: 58, reward: 32,
    color: '#a98cff', glyph: '◈', desc: 'Menghilang ke celah dimensi dan muncul di belakangmu.',
  },
  {
    id: 'astral_executioner',
    name: 'Astral Executioner',
    localName: 'Algojo Astral',
    title: 'Elite Guaranteed',
    behavior: 'lunge',
    hp: 760, dmg: 46, speed: 104, w: 82, h: 104, reward: 82,
    color: '#ffd36e', glyph: '✹', elite: true, desc: 'Elite yang dijamin muncul di setiap stage. Tebasan vertikalnya membelah platform.',
  },
];

export const ASTRAL_ENEMY_INFO = {};
ENEMY_SOURCE.forEach((source, index) => {
  ASTRAL_ENEMY_INFO[source.id] = {
    ...source,
    astral: true,
    chapter: 6,
    elite: !!source.elite,
    flying: !!source.flying,
    danger: source.elite ? 'SANGAT TINGGI' : 'TINGGI',
    where: ASTRAL_NAME,
    index,
    childType: null,
  };
});

export const ASTRAL_ENEMY_IDS = Object.keys(ASTRAL_ENEMY_INFO);
export const ASTRAL_ELITES = ENEMY_SOURCE.filter((enemy) => enemy.elite).map((enemy) => enemy.id);
export const ASTRAL_BASE_ARCHETYPES = ENEMY_SOURCE.filter((enemy) => !enemy.elite).map((enemy) => enemy.id);

// 19 normal spawns + one elite replacing a spawn = exactly 20 per stage.
const STAGE_FORMATION = [
  { counts: [8, 6, 4, 2], eliteAt: 9 },
  { counts: [6, 7, 5, 2], eliteAt: 14 },
  { counts: [7, 5, 6, 2], eliteAt: 3 },
];

export function astralStageEnemies(regionIndex, slot) {
  const region = ASTRAL_REGIONS[clamp(asInt(regionIndex), 0, ASTRAL_REGION_COUNT - 1)];
  if (!region) return [];
  const formation = STAGE_FORMATION[(region.index + clamp(asInt(slot), 0, 2)) % STAGE_FORMATION.length];
  const types = [...ASTRAL_BASE_ARCHETYPES];
  const list = [];
  formation.counts.forEach((count, typeIndex) => {
    for (let i = 0; i < count; i += 1) list.push(types[typeIndex]);
  });
  list[formation.eliteAt] = 'astral_executioner';
  return list;
}

// ── bosses ─────────────────────────────────────────────────────────────────
const BOSS_SOURCE = [
  {
    id: 'star_eaten_sentinel', kind: 'astral_star_eaten_sentinel', region: 'starfall_passage',
    name: 'The Star-Eaten Sentinel', localName: 'Sang Penjaga Dimakan Bintang',
    title: 'The Broken Constellation', pattern: 'volley', maxHp: 2100, w: 156, h: 178, contact: 26, phases: 2,
    color: '#9fc8ff', glyph: '✧', lines: [
      'Aku pernah menjaga tujuh bintang. Kini hanya satu yang masih menyala, dan itu pun bukan milikku.',
      'Jangan menatap jalur yang patah terlalu lama. Kau akan ikut jatuh.',
      'Akhirnya... langit boleh gelap tanpa aku.',
    ],
  },
  {
    id: 'nebula_harvester', kind: 'astral_nebula_harvester', region: 'nebula_gardens',
    name: 'The Nebula Harvester', localName: 'Pemanen Nebula',
    title: 'Root of the Living Sky', pattern: 'summon', maxHp: 2600, w: 170, h: 180, contact: 24, phases: 3,
    color: '#c7a4ff', glyph: '❋', lines: [
      'Taman ini lapar. Aku hanya tangan yang memberinya makan.',
      'Setiap bunga di sini tumbuh dari nama seseorang. Kau akan menjadi bunga yang indah.',
      'Akar terakhir... tetap mencari cahaya.',
      'Potonglah. Taman akan tumbuh lagi, tapi tidak dengan suaraku.',
    ],
  },
  {
    id: 'clockwork_oracle', kind: 'astral_clockwork_oracle', region: 'astral_observatory',
    name: 'The Clockwork Oracle', localName: 'Oracle Jam Bintang',
    title: 'The Machine That Saw Tomorrow', pattern: 'ring', maxHp: 3200, w: 166, h: 172, contact: 28, phases: 3,
    color: '#ffd88a', glyph: '◎', lines: [
      'Aku melihat seribu akhir untukmu. Semuanya berakhir di ruangan ini.',
      'Kau mengubah satu variabel. Menarik. Aku menghitung ulang.',
      'Ramalan tidak salah. Pembacanya yang terlalu kecil.',
      'Maka biarkan masa depan menulis dirinya sendiri.',
    ],
  },
  {
    id: 'gravity_tyrant', kind: 'astral_gravity_tyrant', region: 'voidbound_citadel',
    name: 'The Gravity Tyrant', localName: 'Tiran Gravitasi',
    title: 'The Weight of a Fallen Star', pattern: 'slam', maxHp: 3900, w: 190, h: 198, contact: 34, phases: 3,
    color: '#b78cff', glyph: '◈', lines: [
      'Aku menahan benteng ini agar tidak jatuh ke dalam void. Kau ingin membukanya?',
      'Gravitasi adalah sumpah yang paling jujur. Semua akhirnya tunduk.',
      'Bahkan bintang pun jatuh. Kau hanya belum cukup tinggi.',
      'Akhirnya... sesuatu yang lebih berat dari kesepianku.',
    ],
  },
  {
    id: 'architect_of_eternity', kind: 'astral_architect_of_eternity', region: 'eternal_throne',
    name: 'The Architect of Eternity', localName: 'Arsitek Keabadian',
    title: 'The Observer, The Fractured, The Dominion', pattern: 'nova', maxHp: 6200, w: 230, h: 220, contact: 40, phases: 4, final: true,
    color: '#ffe7a3', glyph: '♛', lines: [
      'Aku mengamati setiap dunia yang lahir dan mati. Kau adalah kesalahan pembulatan yang menarik.',
      'Baiklah. Aku akan mengubah geometri ruangan ini sampai kau memahami tempatmu.',
      'Kau mematahkan satu proyeksiku. Masih ada yang lain. Masih ada aku.',
      'Dominion tidak berakhir. Ia hanya berpindah tangan. Tunjukkan padaku... apakah kau bisa memegangnya.',
    ],
  },
];

function thresholdsFor(phases) {
  if (phases === 4) return [0.75, 0.5, 0.25];
  if (phases === 3) return [0.66, 0.33];
  return [0.5];
}

function dialogueFor(source) {
  const dialogue = {
    intro: [
      { speaker: source.name, text: source.lines[0] },
      { speaker: 'The Oathbound', text: 'Langit sudah kupatahkan sekali. Aku bisa melakukannya lagi.' },
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

export const ASTRAL_BOSSES = BOSS_SOURCE.map((source) => {
  const region = ASTRAL_REGION_BY_ID[source.region];
  return {
    ...source,
    regionIndex: region.index,
    roomIndex: region.bossRoom,
    phaseThresholds: thresholdsFor(source.phases),
  };
});

export const ASTRAL_BOSS_BY_ID = Object.fromEntries(ASTRAL_BOSSES.map((boss) => [boss.id, boss]));
export const ASTRAL_BOSS_KINDS = ASTRAL_BOSSES.map((boss) => boss.kind);
export const ASTRAL_BOSS_COUNT = ASTRAL_BOSSES.length;

export const ASTRAL_BOSS_INFO = {};
for (const source of BOSS_SOURCE) {
  ASTRAL_BOSS_INFO[source.kind] = {
    id: source.id,
    kind: source.kind,
    name: source.name,
    localName: source.localName,
    title: source.title,
    astral: true,
    chapter: 6,
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
    summonType: source.pattern === 'summon' ? 'nebula_caster' : null,
    ashReward: source.final ? 900 : 300 + source.phases * 40,
    echoReward: 0,
    shards: source.final ? 60 : 22,
    color: source.color,
    music: source.music,
    glyph: source.glyph,
    spawn: { x: 720, y: ASTRAL_FLOOR_Y - source.h },
    dialogue: dialogueFor(source),
    desc: source.lines[0],
    where: `${ASTRAL_NAME} — Arc VI`,
  };
}

// ── rooms ──────────────────────────────────────────────────────────────────
const HALL_NAMES = [
  { name: 'Ambang Bintang', subtitle: 'Threshold of Stars' },
  { name: 'Jembatan Astral', subtitle: 'Astral Span' },
  { name: 'Inti Jaringan', subtitle: 'Network Core' },
];

function platformsFor(region) {
  const high = 300 + (region.index % 3) * 20;
  const list = [
    { x: 0, y: ASTRAL_FLOOR_Y, w: ASTRAL_WORLD_W, h: 46 },
    { x: 148, y: high, w: 210, h: 18 },
    { x: 492, y: high - 52, w: 220, h: 18 },
    { x: 936, y: 356 - (region.index % 4) * 14, w: 230, h: 18 },
  ];
  if (region.index >= 2) list.push({ x: 760, y: 248, w: 150, h: 16 });
  if (region.final) {
    list.push({ x: 240, y: ASTRAL_FLOOR_Y - 142, w: 176, h: 16 });
    list.push({ x: 986, y: ASTRAL_FLOOR_Y - 142, w: 176, h: 16 });
  }
  return list;
}

function gateTo(next, requires, name) {
  return { x: 1362, y: 286, w: 34, h: 184, requires, next, name };
}

function spawnListFor(region, slot) {
  return astralStageEnemies(region.index, slot).map((type, index) => {
    const info = ASTRAL_ENEMY_INFO[type];
    const lane = index % 4;
    return {
      type,
      x: clamp(240 + lane * 260 + ((region.index * 47 + slot * 31 + index * 17) % 110), 140, ASTRAL_WORLD_W - 160),
      minX: 70,
      maxX: ASTRAL_WORLD_W - 90,
      elite: !!info?.elite,
      hpScale: 1 + region.index * 0.12,
      dmgScale: 1 + region.index * 0.09,
      speedScale: 1 + region.index * 0.04,
    };
  });
}

function makeHallRoom(region, slot) {
  const global = region.roomStart + slot;
  const room = {
    id: global,
    astral: true,
    astralRegion: region.index + 1,
    astralRegionId: region.id,
    astralSlot: slot,
    name: `${HALL_NAMES[slot].name} — ${region.localName}`,
    subtitle: `${ASTRAL_NAME} — ${HALL_NAMES[slot].subtitle}`,
    zone: region.id,
    spawn: { x: 78, y: ASTRAL_FLOOR_Y - 46 },
    platforms: platformsFor(region),
    enemies: spawnListFor(region, slot),
    relic: null,
    boss: null,
    hint: region.hint,
    palette: { ...region.palette },
    particle: region.particle,
    music: region.music,
    condition: region.gimmick,
    weather: region.theme,
    accent: region.color,
    gravityScale: region.id === 'voidbound_citadel' ? 0.82 : 1,
    gate: gateTo(
      slot === 2 ? region.bossRoom : global + 1,
      'clear',
      slot === 2 ? ASTRAL_BOSS_BY_ID[region.boss].name : HALL_NAMES[slot + 1]?.name || 'Jalan Berikutnya',
    ),
  };
  if (slot === 0) {
    room.checkpoint = { x: 74, y: ASTRAL_FLOOR_Y - 78, w: 38, h: 78, name: 'Astral Anchor' };
    room.merchant = { x: 156, y: ASTRAL_FLOOR_Y - 96, w: 46, h: 96 };
  }
  if (slot === 2) {
    room.checkpoint = { x: 74, y: ASTRAL_FLOOR_Y - 84, w: 40, h: 84, name: 'Star Bridge' };
  }
  return room;
}

function makeBossRoom(region) {
  const boss = ASTRAL_BOSS_BY_ID[region.boss];
  const nextRegion = ASTRAL_REGIONS[region.index + 1];
  return {
    id: region.bossRoom,
    astral: true,
    astralRegion: region.index + 1,
    astralRegionId: region.id,
    astralSlot: ASTRAL_ROOMS_PER_REGION - 1,
    astralBoss: boss.id,
    name: boss.localName,
    subtitle: `${ASTRAL_NAME} — ${boss.title}`,
    zone: region.id,
    spawn: { x: 78, y: ASTRAL_FLOOR_Y - 46 },
    platforms: platformsFor(region),
    enemies: [],
    relic: null,
    boss: boss.kind,
    hint: region.hint,
    palette: { ...region.palette },
    particle: region.particle,
    music: region.music,
    condition: region.gimmick,
    weather: region.theme,
    accent: boss.color,
    gate: nextRegion ? gateTo(nextRegion.roomStart, 'boss', nextRegion.localName) : null,
  };
}

export const ASTRAL_ROOMS = [];
for (const region of ASTRAL_REGIONS) {
  for (let slot = 0; slot < ASTRAL_ROOMS_PER_REGION - 1; slot += 1) ASTRAL_ROOMS.push(makeHallRoom(region, slot));
  ASTRAL_ROOMS.push(makeBossRoom(region));
}

export const ASTRAL_ROOM_BY_ID = Object.fromEntries(ASTRAL_ROOMS.map((room) => [room.id, room]));
export const ASTRAL_REGION_ROOMS = ASTRAL_REGIONS.map((region) =>
  ASTRAL_ROOMS.filter((room) => room.astralRegion === region.index + 1));

export function astralRoomFor(regionIndex, slot) {
  const region = ASTRAL_REGIONS[clamp(asInt(regionIndex), 0, ASTRAL_REGION_COUNT - 1)];
  return ASTRAL_ROOM_BY_ID[region.roomStart + clamp(asInt(slot), 0, ASTRAL_ROOMS_PER_REGION - 1)] || null;
}

export function validateAstralRooms(rooms = ASTRAL_ROOMS) {
  const errors = [];
  if (!Array.isArray(rooms)) return { ok: false, errors: ['ASTRAL_ROOMS is not an array'], count: 0 };
  if (rooms.length !== ASTRAL_ROOM_COUNT) errors.push(`Expected ${ASTRAL_ROOM_COUNT} rooms, got ${rooms.length}`);
  const ids = new Set();
  for (const room of rooms) {
    if (!room || typeof room !== 'object') { errors.push('Room entry is not an object'); continue; }
    if (ids.has(room.id)) errors.push(`Duplicate room id ${room.id}`);
    ids.add(room.id);
    if (!room.name) errors.push(`Room ${room.id} has no name`);
    if (!room.spawn || !Number.isFinite(room.spawn.x)) errors.push(`Room ${room.id} has an invalid spawn`);
    if (!Array.isArray(room.platforms) || !room.platforms.some((p) => p.y >= ASTRAL_FLOOR_Y - 2)) {
      errors.push(`Room ${room.id} has no floor platform`);
    }
    if (room.gate && !ASTRAL_ROOM_BY_ID[room.gate.next]) errors.push(`Room ${room.id} gate points to unknown room ${room.gate.next}`);
    for (const enemy of room.enemies || []) {
      if (!ASTRAL_ENEMY_INFO[enemy.type]) errors.push(`Room ${room.id} references unknown enemy ${enemy.type}`);
    }
    if (room.boss && !ASTRAL_BOSS_INFO[room.boss]) errors.push(`Room ${room.id} references unknown boss ${room.boss}`);
    if (!room.astralBoss) {
      const types = new Set((room.enemies || []).map((enemy) => enemy.type));
      const elite = (room.enemies || []).filter((enemy) => ASTRAL_ENEMY_INFO[enemy.type]?.elite).length;
      if ((room.enemies || []).length !== ASTRAL_STANDARD_ENEMIES) {
        errors.push(`Room ${room.id} must have ${ASTRAL_STANDARD_ENEMIES} enemies`);
      }
      if (types.size !== ASTRAL_ARCHETYPE_COUNT + 1) errors.push(`Room ${room.id} must use exactly four archetypes plus the elite`);
      if (elite !== ASTRAL_ELITES_PER_STAGE) errors.push(`Room ${room.id} must have exactly one elite`);
    }
  }
  return { ok: errors.length === 0, errors, count: rooms.length };
}

// ── progression ────────────────────────────────────────────────────────────
export function defaultAstralProgress() {
  return {
    version: ASTRAL_VERSION,
    arcId: null,
    unlocked: false,
    cleared: false,
    rooms: Array.from({ length: ASTRAL_ROOM_COUNT }, () => false),
    regions: Array.from({ length: ASTRAL_REGION_COUNT }, () => false),
    bosses: Object.fromEntries(ASTRAL_BOSSES.map((boss) => [boss.id, false])),
    core: false,
    sovereign: false,
    title: null,
    runs: 0,
    deaths: 0,
    bestTime: 0,
    unwrittenExpanse: { locked: true, discovered: false },
    archive: { enemies: [], bosses: [] },
  };
}

export function astralUnlocked(progress) {
  if (progress?.astral?.unlocked === true) return true;
  const crusade = progress?.crusade;
  if (crusade?.cleared === true) return true;
  const fallen = progress?.fallen;
  return !!(fallen?.ascended && (fallen.ending || Object.values(fallen.endings || {}).some(Boolean)));
}

export function unlockAstral(progress) {
  if (!progress.astral || typeof progress.astral !== 'object') progress.astral = defaultAstralProgress();
  const firstTime = progress.astral.unlocked !== true;
  const allowed = astralUnlocked(progress);
  if (allowed) {
    progress.astral.unlocked = true;
    progress.astral.arcId = ASTRAL_ARC_ID;
  }
  return { ok: allowed, firstTime: firstTime && allowed, unlocked: !!progress.astral.unlocked };
}

export function sanitizeAstralProgress(raw) {
  const base = defaultAstralProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const rooms = Array.from({ length: ASTRAL_ROOM_COUNT }, (_, i) => raw.rooms?.[i] === true);
  const bosses = {};
  for (const boss of ASTRAL_BOSSES) bosses[boss.id] = raw.bosses?.[boss.id] === true;
  for (const region of ASTRAL_REGIONS) {
    const halls = Array.from({ length: ASTRAL_ROOMS_PER_REGION - 1 }, (_, slot) => region.roomStart + slot);
    for (let i = 1; i < halls.length; i += 1) {
      if (rooms[halls[i] - ASTRAL_ROOM_START] && !rooms[halls[i - 1] - ASTRAL_ROOM_START]) {
        rooms[halls[i] - ASTRAL_ROOM_START] = false;
      }
    }
    const bossLocal = region.bossRoom - ASTRAL_ROOM_START;
    const hallsDone = halls.every((id) => rooms[id - ASTRAL_ROOM_START]);
    if ((bosses[region.boss] || rooms[bossLocal]) && !hallsDone) {
      bosses[region.boss] = false;
      rooms[bossLocal] = false;
    }
  }
  const int = (value, min, max) => clamp(asInt(value, min), min, max);
  const regions = ASTRAL_REGIONS.map((region) => bosses[region.boss] === true);
  const archiveEnemies = Array.isArray(raw.archive?.enemies)
    ? [...new Set(raw.archive.enemies.filter((id) => ASTRAL_ENEMY_INFO[id]))]
    : [];
  const archiveBosses = Array.isArray(raw.archive?.bosses)
    ? [...new Set(raw.archive.bosses.filter((id) => ASTRAL_BOSS_BY_ID[id]))]
    : [];
  const final = bosses.architect_of_eternity === true;
  return {
    ...base,
    version: ASTRAL_VERSION,
    arcId: raw.arcId === ASTRAL_ARC_ID ? ASTRAL_ARC_ID : null,
    unlocked: raw.unlocked === true,
    cleared: final && raw.cleared === true,
    rooms,
    regions,
    bosses,
    core: final && raw.core === true,
    sovereign: final && raw.sovereign === true,
    title: final && typeof raw.title === 'string' ? raw.title.slice(0, 80) : null,
    runs: int(raw.runs, 0, 99999),
    deaths: int(raw.deaths, 0, 99999),
    bestTime: Math.max(0, Math.min(86400, Number(raw.bestTime) || 0)),
    unwrittenExpanse: {
      locked: true,
      discovered: raw.unwrittenExpanse?.discovered === true && final,
    },
    archive: { enemies: archiveEnemies, bosses: archiveBosses },
  };
}

export function astralRegionUnlocked(state, regionIndex) {
  const safe = sanitizeAstralProgress(state);
  const index = clamp(asInt(regionIndex), 0, ASTRAL_REGION_COUNT - 1);
  if (index === 0) return safe.unlocked;
  return safe.bosses[ASTRAL_REGIONS[index - 1].boss] === true;
}

export function astralRoomUnlocked(state, roomId) {
  const safe = sanitizeAstralProgress(state);
  const room = ASTRAL_ROOM_BY_ID[roomId];
  if (!room) return false;
  const region = ASTRAL_REGIONS[room.astralRegion - 1];
  if (!astralRegionUnlocked(safe, region.index)) return false;
  if (room.astralSlot <= 0) return true;
  return safe.rooms[region.roomStart + room.astralSlot - 1 - ASTRAL_ROOM_START] === true;
}

export function astralBossUnlocked(state, bossId) {
  const safe = sanitizeAstralProgress(state);
  const boss = ASTRAL_BOSS_BY_ID[bossId];
  if (!boss) return false;
  const region = ASTRAL_REGIONS[boss.regionIndex];
  if (!astralRegionUnlocked(safe, region.index)) return false;
  return Array.from({ length: ASTRAL_ROOMS_PER_REGION - 1 }, (_, slot) => region.roomStart + slot)
    .every((id) => safe.rooms[id - ASTRAL_ROOM_START] === true);
}

export function recordAstralRoom(state, roomId) {
  const safe = state || defaultAstralProgress();
  const room = ASTRAL_ROOM_BY_ID[roomId];
  if (!room || room.astralBoss) return { ok: false };
  const local = room.id - ASTRAL_ROOM_START;
  const firstClear = safe.rooms[local] !== true;
  safe.rooms[local] = true;
  for (const type of new Set(room.enemies.map((enemy) => enemy.type))) {
    if (!safe.archive.enemies.includes(type)) safe.archive.enemies.push(type);
  }
  const region = ASTRAL_REGIONS[room.astralRegion - 1];
  const regionDone = Array.from({ length: ASTRAL_ROOMS_PER_REGION - 1 }, (_, slot) => region.roomStart + slot)
    .every((id) => safe.rooms[id - ASTRAL_ROOM_START] === true);
  return { ok: true, firstClear, regionDone };
}

export function recordAstralBoss(state, bossId) {
  const safe = state || defaultAstralProgress();
  const boss = ASTRAL_BOSS_BY_ID[bossId];
  if (!boss) return { ok: false, reason: 'unknown' };
  if (!astralBossUnlocked(safe, bossId)) return { ok: false, reason: 'locked' };
  const firstClear = safe.bosses[bossId] !== true;
  safe.bosses[bossId] = true;
  safe.rooms[boss.roomIndex - ASTRAL_ROOM_START] = true;
  safe.regions[boss.regionIndex] = true;
  if (!safe.archive.bosses.includes(bossId)) safe.archive.bosses.push(bossId);
  if (boss.final) {
    safe.cleared = true;
    safe.core = true;
    safe.sovereign = true;
    safe.title = 'Astral Sovereign';
    safe.unwrittenExpanse.locked = true;
    safe.unwrittenExpanse.discovered = true;
  }
  return {
    ok: true,
    firstClear,
    complete: ASTRAL_BOSSES.every((entry) => safe.bosses[entry.id]),
    final: !!boss.final,
  };
}

export function recordAstralRoomClear(state, room) {
  if (!room) return { ok: false };
  if (room.astralBoss) return recordAstralBoss(state, room.astralBoss);
  return recordAstralRoom(state, room.id);
}

export function recordAstralDeath(state) {
  const safe = state || defaultAstralProgress();
  safe.deaths += 1;
  return safe.deaths;
}

export function recordAstralRun(state, seconds, { won = false } = {}) {
  const safe = state || defaultAstralProgress();
  safe.runs += 1;
  if (won) {
    safe.bestTime = safe.bestTime ? Math.min(safe.bestTime, Math.max(0, Number(seconds) || 0)) : Math.max(0, Number(seconds) || 0);
  }
  return safe;
}

export function astralSummary(state) {
  const safe = sanitizeAstralProgress(state);
  return {
    regionsCleared: safe.regions.filter(Boolean).length,
    regionTotal: ASTRAL_REGION_COUNT,
    bossesCleared: Object.values(safe.bosses).filter(Boolean).length,
    bossTotal: ASTRAL_BOSS_COUNT,
    roomsCleared: safe.rooms.filter(Boolean).length,
    roomTotal: ASTRAL_ROOM_COUNT,
    cleared: safe.cleared,
    core: safe.core,
    sovereign: safe.sovereign,
    title: safe.title,
    bestTime: safe.bestTime,
    unwrittenExpanse: { ...safe.unwrittenExpanse },
    progress: Math.round((safe.rooms.filter(Boolean).length / ASTRAL_ROOM_COUNT) * 100),
  };
}

export function astralArchive(state) {
  const safe = sanitizeAstralProgress(state);
  return {
    enemies: ASTRAL_ENEMY_IDS.map((id) => ({ ...ASTRAL_ENEMY_INFO[id], seen: safe.archive.enemies.includes(id) })),
    bosses: ASTRAL_BOSSES.map((boss) => ({ ...boss, cleared: safe.bosses[boss.id] === true })),
    rewards: [
      { id: 'architects_core', name: "Architect's Core", owned: safe.core },
      { id: 'astral_sovereign', name: 'Astral Sovereign Set', owned: safe.sovereign },
      { id: 'astral_title', name: 'Title: Astral Sovereign', owned: !!safe.title },
    ],
    unwrittenExpanse: {
      name: 'The Unwritten Expanse',
      locked: true,
      discovered: safe.unwrittenExpanse.discovered,
      note: 'Wilayah ini belum ditulis. Ia menunggu ekspansi berikutnya.',
    },
  };
}

export function astralRoomCatalog() {
  return ASTRAL_ROOMS.map((room) => ({
    id: room.id,
    name: room.name,
    subtitle: room.subtitle,
    region: room.astralRegion,
    regionId: room.astralRegionId,
    slot: room.astralSlot,
    boss: room.astralBoss || null,
    enemies: room.astralBoss ? [] : room.enemies.map((enemy) => enemy.type),
    elite: room.astralBoss ? null : 'astral_executioner',
    condition: room.condition,
    rewards: room.astralBoss ? ASTRAL_BOSS_BY_ID[room.astralBoss]?.reward : null,
  }));
}
