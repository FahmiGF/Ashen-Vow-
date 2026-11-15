// Ashen Vow v0.10.0 — FAEWOOD: TAMAN PERI.
//
// A self-contained content layer built the same way as the expansion, Atlas
// and Hearthfall layers:
//   • one biome zone (faewood) with 10 sequential stages (global 414-423)
//   • two boss arenas (424-425) locked behind all ten stages
//   • 10 mushroom/fairy mobs, including tiny swarmers and elite guardians
//   • Magma Slime and Spectral Fairy Dragon bosses with their own themes
//   • permanent save data under progress.fairy
//
// Pure data and pure functions: no DOM, no audio, safe to import in Node.

export const FAIRY_VERSION = 1;
export const FAIRY_NAME = 'Faewood';
export const FAIRY_LOCAL_NAME = 'Taman Peri';
export const FAIRY_SUBTITLE = 'Hutan jamur di bawah sayap cahaya';
export const FAIRY_ROOM_START = 414; // immediately after the 60 Hearthfall rooms
export const FAIRY_STAGE_COUNT = 10;
export const FAIRY_BOSS_COUNT = 2;
export const FAIRY_ROOM_COUNT = FAIRY_STAGE_COUNT + FAIRY_BOSS_COUNT;
export const FAIRY_FLOOR_Y = 470;
export const FAIRY_WORLD_W = 1400;

const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);
const asInt = (value, fallback = 0) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
};

// ── zone ───────────────────────────────────────────────────────────────────
export const FAIRY_ZONE = {
  id: 'faewood',
  name: 'Faewood',
  localName: 'Taman Peri',
  subtitle: FAIRY_SUBTITLE,
  hero: 'Jamur raksasa tumbuh dari doa anak-anak yang tersesat. Di antara tudungnya, sayap-sayap kecil membawa cahaya yang tidak pernah sampai ke langit.',
  hazard: 'Spora bercahaya yang menutup jalan.',
  weather: 'Spora peri melayang pelan',
  condition: 'Hutan bernyanyi dengan suara lonceng kecil',
  color: '#9be8c8',
  glow: '#f0c8ff',
  fog: '#1d3a34',
  palette: {
    top: '#040d0b',
    mid: '#0b241f',
    low: '#123a30',
    glow: '#9be8c8',
    fog: '#1d3a34',
  },
  particle: 'spores',
  music: 'faewood',
  bossMusic: 'fairyBoss',
  miniBoss: 'fairy_magma_slime',
  boss: 'fairy_spectral_dragon',
};

// ── enemies ────────────────────────────────────────────────────────────────
const ENEMY_SOURCE = [
  {
    id: 'cap_chaser', name: 'Tiny Cap', localName: 'Topi Kerdil', title: 'Mushroom Sprite',
    behavior: 'chaser', hp: 42, dmg: 8, speed: 96, w: 26, h: 26, reward: 9, color: '#e8c07a',
    tiny: true, desc: 'Tudung jamur sebesar kepalan tangan. Ia mengejar karena mengira kau ibunya.',
  },
  {
    id: 'puff_spore', name: 'Puff Spore', localName: 'Bal Spora', title: 'Spore Puff',
    behavior: 'ranged', hp: 38, dmg: 9, speed: 58, w: 30, h: 30, reward: 10, color: '#c8f0b8',
    tiny: true, desc: 'Bola spora yang melayang. Meletus menjadi awan gatal saat panik.',
  },
  {
    id: 'glow_midge', name: 'Glow Midge', localName: 'Kunang Peri', title: 'Fairy Mote',
    behavior: 'ranged', hp: 34, dmg: 10, speed: 104, w: 22, h: 22, reward: 11, color: '#f0c8ff',
    tiny: true, desc: 'Sepercik cahaya peri yang menembakkan jarum kilau dari jauh.',
  },
  {
    id: 'thorn_pixie', name: 'Thorn Pixie', localName: 'Peri Duri', title: 'Briar Flutter',
    behavior: 'hopper', hp: 78, dmg: 14, speed: 118, w: 34, h: 34, reward: 16, color: '#9be8c8',
    desc: 'Peri bersayap duri. Melompat tinggi lalu menjatuhkan serbuk tajam.',
  },
  {
    id: 'myconid_guard', name: 'Myconid Guard', localName: 'Penjaga Miselium', title: 'Cap of the Watch',
    behavior: 'lunge', hp: 150, dmg: 19, speed: 96, w: 48, h: 58, reward: 26, color: '#8fd8a8',
    elite: true, desc: 'Jamur penjaga berzirah kitin. Tombaknya adalah akar yang mengeras.',
  },
  {
    id: 'shroom_brute', name: 'Shroom Brute', localName: 'Raksasa Jamur', title: 'Tudung Besar',
    behavior: 'slam', hp: 240, dmg: 25, speed: 62, w: 72, h: 76, reward: 34, color: '#d8a878',
    elite: true, desc: 'Tudung sebesar gerbang. Setiap hentakan menaburkan spora yang menidurkan.',
  },
  {
    id: 'fae_duelist', name: 'Fae Duelist', localName: 'Duelis Sayap', title: 'Blade of Courts',
    behavior: 'lunge', hp: 168, dmg: 21, speed: 128, w: 40, h: 52, reward: 28, color: '#a8d8ff',
    desc: 'Peri bangsawan dengan bilah kristal. Ia menuntut duel, bukan perang.',
  },
  {
    id: 'lantern_moth', name: 'Lantern Moth', localName: 'Ngengat Lentera', title: 'Hanging Light',
    behavior: 'ranged', hp: 96, dmg: 16, speed: 74, w: 42, h: 36, reward: 20, color: '#ffe0a0',
    desc: 'Ngengat sebesar kucing dengan lentera di dadanya. Cahayanya membuat silau.',
  },
  {
    id: 'magma_blob', name: 'Magma Blob', localName: 'Gumpalan Magma', title: 'Slime of the Deep',
    behavior: 'chaser', hp: 132, dmg: 23, speed: 84, w: 44, h: 40, reward: 24, color: '#ff7a3c',
    desc: 'Slime bara yang merembes dari akar gunung. Menyentuhnya membakar sepatu bot.',
  },
  {
    id: 'elder_spore', name: 'Elder Spore', localName: 'Sesepuh Spora', title: 'The Old Cap',
    behavior: 'spawner', hp: 300, dmg: 21, speed: 48, w: 82, h: 80, reward: 44, color: '#e0b45f',
    elite: true, childType: 'cap_chaser',
    desc: 'Jamur tertua di Taman Peri. Ia tidak menyerang; ia melahirkan anak-anak kecil yang menyerang.',
  },
];

export const FAIRY_ENEMY_INFO = {};
ENEMY_SOURCE.forEach((source, index) => {
  FAIRY_ENEMY_INFO[source.id] = {
    ...source,
    chapter: 1,
    fairy: true,
    flying: source.behavior === 'ranged',
    danger: source.elite ? 'TINGGI' : source.tiny ? 'RENDAH' : 'SEDANG',
    glyph: source.tiny ? '✧' : source.elite ? '✹' : '❁',
    where: `${FAIRY_NAME} — ${FAIRY_LOCAL_NAME}`,
    childType: source.childType || null,
    index,
  };
});

export const FAIRY_ENEMY_IDS = Object.keys(FAIRY_ENEMY_INFO);

// ── tiny NPCs ──────────────────────────────────────────────────────────────
// Ambient, non-hostile sprites that live in the stage rooms. They are drawn by
// the renderer and speak a single line when the room loads.
export const FAIRY_NPCS = [
  {
    id: 'pipp',
    name: 'Pipp',
    localName: 'Pipp si Spora',
    glyph: '✿',
    color: '#f0c8ff',
    line: 'Pipp menunjuk ke atas: "Jangan injak tudung yang tidur, nanti ia bangun."',
  },
  {
    id: 'nia',
    name: 'Nia',
    localName: 'Nia Lentera',
    glyph: '✧',
    color: '#ffe0a0',
    line: 'Nia berkedip: "Cahayaku kecil, tapi cukup untuk menunjukkan jalan pulang."',
  },
  {
    id: 'moss',
    name: 'Moss',
    localName: 'Moss Tua',
    glyph: '❁',
    color: '#9be8c8',
    line: 'Moss berdesis: "Kami menyebut raja slime itu Gelora. Jangan sebut namanya keras-keras."',
  },
  {
    id: 'wick',
    name: 'Wick',
    localName: 'Wick Sayap Abu',
    glyph: '✦',
    color: '#c8b8ff',
    line: 'Wick berbisik: "Naga spektral itu bukan penjaga. Ia penjaga dari semua yang pernah kami lupakan."',
  },
];

export const FAIRY_NPC_BY_ID = Object.fromEntries(FAIRY_NPCS.map((npc) => [npc.id, npc]));

const npcSpot = (id, x) => {
  const npc = FAIRY_NPC_BY_ID[id];
  return { ...npc, x, y: FAIRY_FLOOR_Y - 30 };
};

// ── stage plan ─────────────────────────────────────────────────────────────
const STAGE_SOURCE = [
  {
    name: 'Gerbang Lumut',
    subtitle: 'Moss Gate',
    template: 'entry',
    hint: 'Api unggun kecil dan seorang peri penunjuk jalan. Tidak ada yang mengejar di sini.',
    tag: 'ENTRY',
    enemies: [],
    npcs: ['pipp'],
  },
  {
    name: 'Lorong Jamur',
    subtitle: 'Cap Corridor',
    template: 'combat',
    hint: 'Topi-topi kecil bergerak di antara akar. Mereka tidak sendiri.',
    tag: 'JAMUR KECIL',
    enemies: ['cap_chaser', 'cap_chaser', 'puff_spore'],
  },
  {
    name: 'Kolam Peri',
    subtitle: 'Pixie Pool',
    template: 'combat',
    hint: 'Air kolam memantulkan sayap-sayap yang tidak terlihat.',
    tag: 'PERI',
    enemies: ['glow_midge', 'thorn_pixie', 'puff_spore'],
  },
  {
    name: 'Kapel Spora',
    subtitle: 'Spore Chapel',
    template: 'elite',
    hint: 'Penjaga Miselium berdiri di depan altar yang tumbuh dari bangkai raksasa.',
    tag: 'ELITE',
    enemies: ['myconid_guard', 'cap_chaser', 'cap_chaser'],
  },
  {
    name: 'Jembatan Akar',
    subtitle: 'Root Span',
    template: 'combat',
    hint: 'Akar-akar tua bersilang di atas jurang spora. Ngengat berjaga di tengah.',
    tag: 'JEMBATAN',
    enemies: ['lantern_moth', 'thorn_pixie', 'fae_duelist'],
  },
  {
    name: 'Taman Cahaya',
    subtitle: 'Garden of Light',
    template: 'puzzle',
    hint: 'Relik peri berdenyut di platform tertinggi. Ambil untuk membuka gerbang.',
    tag: 'RELIK',
    enemies: ['glow_midge', 'glow_midge'],
    npcs: ['nia'],
  },
  {
    name: 'Sarang Kunang',
    subtitle: 'Midge Nest',
    template: 'combat',
    hint: 'Ribuan kunang peri bergantung di langit-langit gua, menunggu satu getaran.',
    tag: 'SARANG',
    enemies: ['lantern_moth', 'lantern_moth', 'glow_midge'],
  },
  {
    name: 'Padang Tanduk',
    subtitle: 'Hornfield',
    template: 'elite',
    hint: 'Raksasa Jamur menumbuk tanah sampai spora menutupi seluruh padang.',
    tag: 'ELITE',
    enemies: ['shroom_brute', 'puff_spore', 'cap_chaser'],
  },
  {
    name: 'Ambang Bara',
    subtitle: 'Ember Threshold',
    template: 'combat',
    hint: 'Batu mulai hangat. Akar gunung merembes di sini, dan slime bara berkeliaran.',
    tag: 'MAGMA',
    enemies: ['magma_blob', 'magma_blob', 'fae_duelist'],
    npcs: ['moss'],
  },
  {
    name: 'Gerbang Singgasana',
    subtitle: 'Throne Threshold',
    template: 'elite',
    hint: 'Sesepuh Spora menghalangi jalan menuju singgasana. Di baliknya, bara dan sayap menanti.',
    tag: 'PENJAGA GERBANG',
    enemies: ['elder_spore', 'magma_blob', 'magma_blob'],
    npcs: ['wick'],
  },
];

export const FAIRY_STAGES = STAGE_SOURCE.map((stage, index) => ({
  index,
  id: `faewood_stage_${index + 1}`,
  roomIndex: FAIRY_ROOM_START + index,
  level: index + 1,
  name: stage.name,
  subtitle: stage.subtitle,
  template: stage.template,
  hint: stage.hint,
  tag: stage.tag,
  enemies: stage.enemies.slice(),
  npc: stage.npcs?.[0] || null,
  glyph: ['❁', '✦', '✧', '✹', '❋', '❃', '✺', '☘', '✸', '♛'][index],
}));

// ── rooms ──────────────────────────────────────────────────────────────────
function platformsFor(index, boss = false) {
  const high = 316 + (index % 3) * 24;
  const list = [
    { x: 0, y: FAIRY_FLOOR_Y, w: FAIRY_WORLD_W, h: 46 },
    { x: 196, y: high, w: 190, h: 18 },
    { x: 584, y: high - 46, w: 210, h: 18 },
    { x: 1004, y: 356 - (index % 4) * 18, w: 236, h: 18 },
  ];
  if (boss) {
    list.push({ x: 286, y: FAIRY_FLOOR_Y - 128, w: 154, h: 16 });
    list.push({ x: 952, y: FAIRY_FLOOR_Y - 128, w: 154, h: 16 });
  }
  return list;
}

function enemiesFor(stage, index) {
  return stage.enemies.map((type, i) => {
    const info = FAIRY_ENEMY_INFO[type];
    return {
      type,
      x: clamp(300 + i * 300 + ((index * 37) % 70), 170, FAIRY_WORLD_W - 180),
      minX: 80,
      maxX: FAIRY_WORLD_W - 100,
      elite: !!info?.elite && i === 0,
      hpScale: 1 + index * 0.05,
      dmgScale: 1 + index * 0.04,
      speedScale: 1 + index * 0.03,
    };
  });
}

function gateTo(next, requires, name) {
  return { x: 1362, y: 286, w: 34, h: 184, requires, next, name };
}

function makeStageRoom(stage, index) {
  const room = {
    id: FAIRY_ROOM_START + index,
    fairy: true,
    fairyStage: index + 1,
    fairyStageId: stage.id,
    name: stage.name,
    subtitle: `${FAIRY_NAME} — ${stage.subtitle}`,
    zone: FAIRY_ZONE.id,
    spawn: { x: 80, y: FAIRY_FLOOR_Y - 46 },
    platforms: platformsFor(index),
    enemies: enemiesFor(stage, index),
    relic: stage.template === 'puzzle'
      ? { x: 1178, y: 232, w: 26, h: 26, name: 'Relik Sayap Peri' }
      : null,
    boss: null,
    hint: stage.hint,
    palette: { ...FAIRY_ZONE.palette },
    particle: FAIRY_ZONE.particle,
    music: FAIRY_ZONE.music,
    condition: FAIRY_ZONE.condition,
    weather: FAIRY_ZONE.weather,
    accent: FAIRY_ZONE.color,
    gate: gateTo(FAIRY_ROOM_START + index + 1, stage.template === 'puzzle' ? 'relic' : 'clear', index === FAIRY_STAGE_COUNT - 1 ? 'Singgasana Magma' : 'Jalan Berikutnya'),
  };
  const npcId = stage.npc;
  if (npcId) room.npcs = [npcSpot(npcId, index === 0 ? 214 : 240)];
  if (stage.template === 'entry') {
    room.checkpoint = { x: 74, y: FAIRY_FLOOR_Y - 78, w: 38, h: 78, name: 'Api Unggun Lumut' };
    room.merchant = { x: 156, y: FAIRY_FLOOR_Y - 96, w: 46, h: 96 };
  }
  return room;
}

const MAGMA_ROOM = FAIRY_ROOM_START + FAIRY_STAGE_COUNT;
const DRAGON_ROOM = MAGMA_ROOM + 1;

function makeBossRoom(global, config) {
  return {
    id: global,
    fairy: true,
    fairyBoss: config.id,
    name: config.roomName,
    subtitle: `${FAIRY_NAME} — ${config.subtitle}`,
    zone: FAIRY_ZONE.id,
    spawn: { x: 80, y: FAIRY_FLOOR_Y - 46 },
    platforms: platformsFor(config.index, true),
    enemies: [],
    relic: null,
    boss: config.boss,
    hint: config.hint,
    palette: { ...FAIRY_ZONE.palette },
    particle: FAIRY_ZONE.particle,
    music: FAIRY_ZONE.music,
    condition: FAIRY_ZONE.condition,
    weather: FAIRY_ZONE.weather,
    accent: config.color,
    gate: config.gate,
  };
}

// ── bosses ─────────────────────────────────────────────────────────────────
const BOSS_SOURCE = [
  {
    id: 'magma',
    kind: 'fairy_magma_slime',
    name: 'Gelora, Slime Magma',
    title: 'The Molten Crown',
    localName: 'Raja Lumut Magma',
    pattern: 'summon',
    maxHp: 1600,
    w: 148,
    h: 130,
    contact: 26,
    phases: 4,
    color: '#ff7a3c',
    music: 'magmaBoss',
    ashReward: 320,
    summonType: 'magma_blob',
    glyph: '☄',
    lines: [
      'Aku menetes dari jantung gunung yang kau sebut takdir. Berlutut, atau meleleh.',
      'Tubuhku pecah, dan setiap pecahannya masih mengingat namamu.',
      'Api ini bukan milikku. Aku hanya wadah yang terlalu panas.',
      'Kau masih berdiri? Aku akan menjadi lautan, bukan gelombang.',
      'Dingin... akhirnya sesuatu yang dingin...',
    ],
  },
  {
    id: 'dragon',
    kind: 'fairy_spectral_dragon',
    name: 'Sylvara, Peri Naga Spektral',
    title: 'Dragon of Woven Light',
    localName: 'Naga Peri Spektral',
    pattern: 'rain',
    maxHp: 2600,
    w: 176,
    h: 132,
    contact: 30,
    phases: 4,
    flying: true,
    color: '#f0c8ff',
    music: 'fairyBoss',
    ashReward: 480,
    summonType: 'glow_midge',
    glyph: '✧',
    lines: [
      'Kau berjalan melewati sepuluh gerbang hanya untuk melihat sayap yang tidak pernah tidur.',
      'Setiap sisikku adalah nama peri yang kau lewati. Jangan sentuh mereka.',
      'Cahaya ini kupinjam dari bintang yang sudah mati. Ia tetap menyala untukku.',
      'Kau membawa abu ke dalam taman. Abu selalu ingin menjadi api.',
      'Akhirnya... sayap ini boleh berhenti mengepak...',
    ],
  },
];

// Phase 3 tears the arena into heaven; phase 4 drops it into hell and the
// dragon sheds its fairy shape for the Demon Lord that was sleeping inside it.
export const DRAGON_FORMS = {
  3: {
    id: 'heaven',
    name: 'Sylvara, Seraph of the Woven Sky',
    title: 'Heaven-Touched Sovereign',
    color: '#ffe6a8',
    music: 'fairyBoss',
    arena: {
      id: 'heaven',
      particle: 'stars',
      palette: {
        top: '#12233f',
        mid: '#496a96',
        low: '#c8b890',
        glow: '#ffe6a8',
        fog: '#8fa8c8',
      },
      weather: 'Bulu cahaya turun dari langit terbuka',
      condition: 'Langit terbelah — Taman Peri menjadi altar surga',
    },
    line: 'Langit membuka gerbangnya. Aku bukan lagi penjaga taman — aku adalah cahaya yang kau datangi.',
  },
  4: {
    id: 'hell',
    name: 'Vharos, Demon Lord of the Last Vow',
    title: 'The Hell That Answers',
    color: '#ff4a3c',
    music: 'magmaBoss',
    arena: {
      id: 'hell',
      particle: 'embers',
      palette: {
        top: '#140404',
        mid: '#3a0a08',
        low: '#6a1408',
        glow: '#ff5a3c',
        fog: '#5a1a10',
      },
      weather: 'Abu membara naik dari retakan bumi',
      condition: 'Gerbang neraka terbuka — Opus menahan napas',
    },
    line: 'Cahaya itu milikku sejak awal. Aku adalah Raja Iblis yang kau kira telah lama mati.',
  },
};

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
      { speaker: 'The Oathbound', text: 'Taman ini menyimpan terlalu banyak nama. Aku hanya ingin lewat.' },
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

export const FAIRY_BOSSES = BOSS_SOURCE.map((source) => ({
  ...source,
  roomIndex: source.id === 'magma' ? MAGMA_ROOM : DRAGON_ROOM,
  phaseThresholds: thresholdsFor(source.phases),
}));

export const FAIRY_BOSS_BY_ID = Object.fromEntries(FAIRY_BOSSES.map((boss) => [boss.id, boss]));
export const FAIRY_BOSS_KINDS = FAIRY_BOSSES.map((boss) => boss.kind);

export const FAIRY_BOSS_INFO = {};
for (const source of BOSS_SOURCE) {
  const dialogue = dialogueFor(source);
  if (source.id === 'dragon') {
    for (const form of Object.values(DRAGON_FORMS)) {
      const phase = Number(Object.keys(DRAGON_FORMS).find((key) => DRAGON_FORMS[key] === form));
      dialogue[`phase${phase}`] = [{ speaker: form.name, text: form.line }];
    }
  }
  FAIRY_BOSS_INFO[source.kind] = {
    id: source.id,
    kind: source.kind,
    name: source.name,
    localName: source.localName,
    title: source.title,
    fairy: true,
    pattern: source.pattern,
    maxHp: source.maxHp,
    w: source.w,
    h: source.h,
    contact: source.contact,
    maxPhases: source.phases,
    phaseThresholds: thresholdsFor(source.phases),
    mini: false,
    major: true,
    flying: !!source.flying,
    reward: source.id === 'dragon' ? 'victory' : 'blessing',
    summonType: source.summonType || null,
    ashReward: source.ashReward,
    echoReward: 0,
    color: source.color,
    music: source.music,
    glyph: source.glyph,
    spawn: { x: 760, y: FAIRY_FLOOR_Y - source.h },
    dialogue,
    forms: source.id === 'dragon' ? DRAGON_FORMS : null,
    desc: source.lines[0],
    where: `${FAIRY_NAME} — ${FAIRY_LOCAL_NAME}`,
  };
}

// ── fairy rooms ────────────────────────────────────────────────────────────
export const FAIRY_ROOMS = STAGE_SOURCE.map((stage, index) => makeStageRoom(FAIRY_STAGES[index], index));
FAIRY_ROOMS.push(makeBossRoom(MAGMA_ROOM, {
  id: 'magma',
  index: FAIRY_STAGE_COUNT,
  roomName: 'Kuali Magma',
  subtitle: 'The Molten Crucible',
  boss: 'fairy_magma_slime',
  color: '#ff7a3c',
  hint: 'Gelora menunggu di tengah kuali. Lantainya masih menggelegak dari letusan terakhir.',
  gate: gateTo(DRAGON_ROOM, 'boss', 'Singgasana Sayap'),
}));
FAIRY_ROOMS.push(makeBossRoom(DRAGON_ROOM, {
  id: 'dragon',
  index: FAIRY_STAGE_COUNT + 1,
  roomName: 'Singgasana Sayap',
  subtitle: 'Throne of Woven Light',
  boss: 'fairy_spectral_dragon',
  color: '#f0c8ff',
  hint: 'Sylvara turun dari cahaya yang tidak berasal dari matahari. Ini gerbang terakhir Taman Peri.',
  gate: null,
}));

export const FAIRY_ROOM_BY_ID = Object.fromEntries(FAIRY_ROOMS.map((room) => [room.id, room]));
export const FAIRY_STAGE_ROOMS = FAIRY_ROOMS.filter((room) => !room.fairyBoss);

export function fairyRoomForStage(index) {
  return FAIRY_STAGE_ROOMS[clamp(asInt(index), 0, FAIRY_STAGE_COUNT - 1)] || null;
}

export function validateFairyRooms(rooms = FAIRY_ROOMS) {
  const errors = [];
  if (!Array.isArray(rooms)) return { ok: false, errors: ['FAIRY_ROOMS is not an array'], count: 0 };
  if (rooms.length !== FAIRY_ROOM_COUNT) errors.push(`Expected ${FAIRY_ROOM_COUNT} rooms, got ${rooms.length}`);
  const ids = new Set();
  for (const room of rooms) {
    if (!room || typeof room !== 'object') { errors.push('Room entry is not an object'); continue; }
    if (ids.has(room.id)) errors.push(`Duplicate room id ${room.id}`);
    ids.add(room.id);
    if (!room.name) errors.push(`Room ${room.id} has no name`);
    if (!room.spawn || !Number.isFinite(room.spawn.x)) errors.push(`Room ${room.id} has an invalid spawn`);
    if (!Array.isArray(room.platforms) || !room.platforms.some((p) => p.y >= FAIRY_FLOOR_Y - 2)) {
      errors.push(`Room ${room.id} has no floor platform`);
    }
    if (room.gate && !FAIRY_ROOM_BY_ID[room.gate.next]) errors.push(`Room ${room.id} gate points to unknown room ${room.gate.next}`);
    if (!room.gate && room.id !== DRAGON_ROOM) errors.push(`Room ${room.id} has no gate`);
    for (const enemy of room.enemies || []) {
      if (!FAIRY_ENEMY_INFO[enemy.type]) errors.push(`Room ${room.id} references unknown enemy ${enemy.type}`);
    }
    if (room.boss && !FAIRY_BOSS_INFO[room.boss]) errors.push(`Room ${room.id} references unknown boss ${room.boss}`);
  }
  for (let i = 0; i < FAIRY_ROOMS.length - 1; i += 1) {
    if (FAIRY_ROOMS[i].gate?.next !== FAIRY_ROOMS[i + 1].id) errors.push(`Room ${FAIRY_ROOMS[i].id} is not chained to the next room`);
  }
  return { ok: errors.length === 0, errors, count: rooms.length };
}

// ── progress ───────────────────────────────────────────────────────────────
export function defaultFairyProgress() {
  return {
    version: FAIRY_VERSION,
    stages: Array.from({ length: FAIRY_STAGE_COUNT }, () => false),
    bosses: Object.fromEntries(FAIRY_BOSSES.map((boss) => [boss.id, false])),
    runs: 0,
    bestTime: 0,
  };
}

export function sanitizeFairyProgress(raw) {
  const base = defaultFairyProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const stages = Array.from({ length: FAIRY_STAGE_COUNT }, (_, i) => raw.stages?.[i] === true);
  // A stage is only reachable if the one before it is cleared; drop impossible
  // states from hand-edited saves so the hub cannot show a stage-9 shortcut.
  for (let i = 1; i < stages.length; i += 1) {
    if (stages[i] && !stages[i - 1]) stages[i] = false;
  }
  const bosses = {};
  for (const boss of FAIRY_BOSSES) bosses[boss.id] = raw.bosses?.[boss.id] === true;
  const allStages = stages.every(Boolean);
  if (!allStages) for (const boss of FAIRY_BOSSES) bosses[boss.id] = false;
  const int = (value, min, max) => {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  };
  return {
    version: FAIRY_VERSION,
    stages,
    bosses,
    runs: int(raw.runs, 0, 99999),
    bestTime: Math.max(0, Math.round((Number(raw.bestTime) || 0) * 10) / 10),
  };
}

export function fairyStageUnlocked(state, index) {
  const safe = sanitizeFairyProgress(state);
  if (index <= 0) return true;
  return safe.stages[index - 1] === true;
}

export function fairyStageCleared(state, index) {
  return sanitizeFairyProgress(state).stages[index] === true;
}

export function fairyBossesUnlocked(state) {
  return sanitizeFairyProgress(state).stages.every(Boolean);
}

export function fairyBossUnlocked(state, bossId) {
  const safe = sanitizeFairyProgress(state);
  if (!safe.stages.every(Boolean)) return false;
  const index = FAIRY_BOSSES.findIndex((boss) => boss.id === bossId);
  if (index <= 0) return index === 0;
  const previous = FAIRY_BOSSES[index - 1];
  return !!safe.bosses[previous.id];
}

export function recordFairyStage(state, index) {
  const safe = state || defaultFairyProgress();
  if (index < 0 || index >= FAIRY_STAGE_COUNT) return { ok: false };
  if (!fairyStageUnlocked(safe, index)) return { ok: false, reason: 'locked' };
  const firstClear = safe.stages[index] !== true;
  safe.stages[index] = true;
  return { ok: true, firstClear, bossesUnlocked: safe.stages.every(Boolean) };
}

export function recordFairyBoss(state, bossId) {
  const safe = state || defaultFairyProgress();
  const boss = FAIRY_BOSS_BY_ID[bossId];
  if (!boss) return { ok: false };
  if (!fairyBossUnlocked(safe, bossId)) return { ok: false, reason: 'locked' };
  const firstClear = safe.bosses[bossId] !== true;
  safe.bosses[bossId] = true;
  return { ok: true, firstClear, complete: FAIRY_BOSSES.every((entry) => safe.bosses[entry.id]) };
}

export function recordFairyRun(state, seconds = 0, { won = false } = {}) {
  const safe = state || defaultFairyProgress();
  safe.runs = (safe.runs || 0) + 1;
  const time = Math.max(0, Math.round((Number(seconds) || 0) * 10) / 10);
  if (won && time > 0 && (!safe.bestTime || time < safe.bestTime)) safe.bestTime = time;
  return { ok: true, runs: safe.runs, bestTime: safe.bestTime };
}

export function fairyProgressSummary(state) {
  const safe = sanitizeFairyProgress(state);
  const stagesCleared = safe.stages.filter(Boolean).length;
  const bossesCleared = FAIRY_BOSSES.filter((boss) => safe.bosses[boss.id]).length;
  const nextStage = stagesCleared < FAIRY_STAGE_COUNT ? stagesCleared : -1;
  return {
    stagesCleared,
    stageTotal: FAIRY_STAGE_COUNT,
    bossesCleared,
    bossTotal: FAIRY_BOSS_COUNT,
    percent: Math.round(((stagesCleared + bossesCleared) / (FAIRY_STAGE_COUNT + FAIRY_BOSS_COUNT)) * 100),
    nextStage,
    bossesUnlocked: stagesCleared >= FAIRY_STAGE_COUNT,
    complete: bossesCleared >= FAIRY_BOSS_COUNT,
    runs: safe.runs,
    bestTime: safe.bestTime,
  };
}

