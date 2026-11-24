// Ashen Vow — BAB X: The Lanternwake (Api Sembilan Sumbu).
//
// A tenth campaign chapter, appended after the Tidewrought Cistern so no
// existing room index moves. Pure data and progression: no DOM, no canvas.
//
// Chapter shape: four halls and one boss altar, at ids 670-674. Every hall
// keeps the campaign contract used by Arc IX/X: exactly 20 enemies, four
// standard archetypes, 19 normal bodies and exactly one guaranteed elite.
//
// The chapter's identity (inspired by light-as-resource horror games) is the
// wake itself: each hall is a stretch of a funeral procession where nine
// lanterns were carried and dropped. The rooms are authored around pools of
// lantern light, and the boss is the keeper who wants the last wick back.

export const LANTERN_VERSION = 1;
export const LANTERN_NAME = 'The Lanternwake';
export const LANTERN_LOCAL_NAME = 'Api Sembilan Sumbu';
export const LANTERN_ROOM_START = 669;
export const LANTERN_STAGE_COUNT = 5;
export const LANTERN_HALL_COUNT = 4;
export const LANTERN_FLOOR_Y = 470;
export const LANTERN_ZONE_ID = 'lanternwake';
export const LANTERN_ELITE_COUNT = 1;
export const LANTERN_ENEMIES_PER_HALL = 20;

export const LANTERN_PALETTE = {
  top: '#0c0804',
  mid: '#241708',
  low: '#3a2610',
  glow: '#ffb85c',
  fog: '#4a3216',
};

const FLOOR = LANTERN_FLOOR_Y;
const W = 1400;

function floor(x, y, w, h) {
  return { x, y, w, h };
}

function gateTo(next, requires, name) {
  return { x: 1362, y: 286, w: 34, h: 184, requires, next, name };
}

// ── enemies ────────────────────────────────────────────────────────────────
// Four normal bodies on four engine archetypes plus one elite that lunges.
export const LANTERN_ENEMY_INFO = {
  wick_moth: {
    name: 'Wick Moth',
    title: 'Ngengat Sumbu',
    hp: 44,
    dmg: 10,
    speed: 112,
    w: 36,
    h: 30,
    reward: 12,
    behavior: 'chaser',
    danger: 'RENDAH',
    desc: 'Ngengat sebesar telapak tangan yang mengejar nyala terakhir. Cepat, rapuh, dan tidak pernah sendirian.',
    where: 'Prosesi Pertama · Lorong Lilin',
  },
  taper_hound: {
    name: 'Taper Hound',
    title: 'Anjing Suluh',
    hp: 86,
    dmg: 16,
    speed: 98,
    w: 50,
    h: 42,
    reward: 21,
    behavior: 'lunge',
    danger: 'SEDANG',
    desc: 'Bangkai anjing yang membawa suluh di rahangnya. Menandai lalu menerjang lurus seperti anak panah.',
    where: 'Prosesi Pertama · Aula Abu',
  },
  lantern_wisp: {
    name: 'Lantern Wisp',
    title: 'Nyala Pengiring',
    hp: 52,
    dmg: 13,
    speed: 62,
    w: 34,
    h: 48,
    reward: 17,
    behavior: 'ranged',
    danger: 'SEDANG',
    desc: 'Nyala yang lepas dari lantern dan belajar menjaga jarak. Melepas percikan panas dari luar jangkauan pedang.',
    where: 'Lorong Lilin · Ruang Nyala',
  },
  ash_bearer: {
    name: 'Ash Bearer',
    title: 'Pembawa Abu',
    hp: 124,
    dmg: 19,
    speed: 72,
    w: 54,
    h: 58,
    reward: 28,
    behavior: 'slam',
    danger: 'TINGGI',
    desc: 'Tubuh berjubah yang mengangkut abu prosesi. Menghentak lantai dan mengirim gelombang abu ke kedua sisi.',
    where: 'Aula Abu · Ambang Sumbu',
  },
  wickbearer_acolyte: {
    name: 'Wickbearer Acolyte',
    title: 'Akolit Sumbu',
    hp: 168,
    dmg: 23,
    speed: 104,
    w: 52,
    h: 66,
    reward: 55,
    behavior: 'lunge',
    elite: true,
    danger: 'ELITE',
    desc: 'Satu-satunya pembawa yang masih memegang sumbu utuh. Setiap aula dijaga tepat satu, dan ia tidak pernah mundur.',
    where: 'Setiap aula (1 elite dijamin)',
  },
};

// ── boss ───────────────────────────────────────────────────────────────────
export const LANTERN_BOSS_INFO = {
  wickbearer: {
    name: 'Orsella',
    title: 'The Wickbearer',
    maxHp: 1180,
    w: 96,
    h: 122,
    contact: 17,
    ashReward: 240,
    reward: 'victory',
    music: 'lanternBoss',
    color: '#ffb85c',
    maxPhases: 4,
    phaseThresholds: [0.75, 0.5, 0.25],
    spawn: { x: 700, y: FLOOR - 122 },
    // The tide-regent pattern is the closest real engine behaviour: a sweep,
    // a fan, a ground surge and summons. The chapter only changes the data and
    // the summon body, never the simulation.
    behaviorKind: 'tidebound',
    summonType: 'wick_moth',
    dialogue: {
      intro: [
        { speaker: 'Orsella', text: 'Sembilan sumbu. Sembilan nama. Kau hanya membawa satu nyala, dan itu pun pinjaman.' },
        { speaker: 'Orsella', text: 'Prosesi ini belum selesai sejak aku masih punya wajah.' },
      ],
      phase2: [
        { speaker: 'Orsella', text: 'Api pertama padam karena angin. Yang kedua karena tangan manusia. Tebak yang mana kau.' },
      ],
      phase3: [
        { speaker: 'Orsella', text: 'Kau menyalakan kembali setiap lantern yang kulewati. Itu bukan belas kasih — itu penghinaan.' },
      ],
      phase4: [
        { speaker: 'Orsella', text: 'Sumbu terakhir ada di dalam dadaku. Ambil, kalau kau masih tahu bedanya api dan luka.' },
        { speaker: 'Orsella', text: 'Aku akan tetap berjalan meski kau memadamkanku. Itu janji seorang pembawa.' },
      ],
      defeat: [
        { speaker: 'Orsella', text: 'Sembilan api... dan untuk pertama kalinya prosesi ini terlihat seperti pemakaman.' },
        { speaker: 'Orsella', text: 'Bawa sumbu ini ke ujung jalan. Jangan menoleh ke belakang saat ia menyala.' },
      ],
    },
  },
};

// ── deterministic 20-enemy halls ──────────────────────────────────────────
// 6 chasers, 5 ranged, 4 lungers, 4 slammers, 1 elite = 19 normal + 1 elite.
const HALL_PATTERN = [
  { type: 'wick_moth', count: 6 },
  { type: 'lantern_wisp', count: 5 },
  { type: 'taper_hound', count: 4 },
  { type: 'ash_bearer', count: 4 },
];

function hallEnemies(seed = 0) {
  const out = [];
  let cursor = 0;
  for (const group of HALL_PATTERN) {
    for (let i = 0; i < group.count; i += 1) {
      // Spread bodies across the full hall in a repeating 7-step fan so no two
      // halls share the same silhouette.
      const step = (cursor * 137 + seed * 211 + i * 47) % 1090;
      const x = 180 + step;
      const span = group.type === 'lantern_wisp' ? 150 : 190;
      out.push({
        type: group.type,
        x,
        minX: Math.max(120, x - span),
        maxX: Math.min(W - 120, x + span),
      });
      cursor += 1;
    }
  }
  // Exactly one guaranteed elite, placed away from the spawn point.
  out.push({
    type: 'wickbearer_acolyte',
    x: 560 + (seed * 173) % 420,
    minX: 420,
    maxX: 1180,
    elite: true,
  });
  return out;
}

// ── rooms ──────────────────────────────────────────────────────────────────
const ROOM_SOURCE = [
  {
    key: 'procession',
    name: 'Prosesi Pertama',
    subtitle: 'The First Procession',
    accent: '#d99a4e',
    glyph: '⟡',
    desc: 'Jalan masuk prosesi yang berhenti di tengah langkah. Sembilan tiang lantern berdiri tanpa api.',
    tags: ['20 MUSUH', '1 ELITE', 'SUMbu'],
    platforms: [
      floor(0, FLOOR, W, 70),
      floor(280, 372, 200, 18),
      floor(620, 316, 220, 18),
      floor(1000, 376, 180, 18),
    ],
    checkpoint: { x: 70, y: FLOOR - 78, w: 38, h: 78, name: 'Warung Abu' },
    merchant: { x: 148, y: FLOOR - 96, w: 46, h: 96 },
    hint: 'Setiap tiang di sini dulu membawa satu nama. Nyalakan jalanmu sebelum mereka menyalakan yang lain.',
    gate: gateTo(LANTERN_ROOM_START + 1, 'clear', 'Lorong Lilin'),
  },
  {
    key: 'candlecorridor',
    name: 'Lorong Lilin',
    subtitle: 'The Candle Corridor',
    accent: '#e8ad62',
    glyph: '⌇',
    desc: 'Lorong sempit dengan lilin yang menyala hanya saat kau membelakanginya. Lantainya licin oleh lilin cair.',
    tags: ['JURANG', 'NYALA', '20 MUSUH'],
    platforms: [
      floor(0, FLOOR, 470, 70),
      floor(700, FLOOR, 700, 70),
      floor(520, 396, 150, 18),
      floor(380, 326, 150, 18),
      floor(900, 344, 190, 18),
    ],
    bounce: [{ x: 494, y: FLOOR - 8, w: 86, h: 16, power: 1040 }],
    climbs: [{ x: 668, y: 322, w: 22, h: 148 }],
    hint: 'Lilin di lorong ini tidak suka ditatap. Lompati celah dan jangan berhenti di tengah.',
    gate: gateTo(LANTERN_ROOM_START + 2, 'clear', 'Aula Abu'),
  },
  {
    key: 'ashhall',
    name: 'Aula Abu',
    subtitle: 'The Ash Hall',
    accent: '#f0bd78',
    glyph: '◍',
    desc: 'Aula besar tempat abu prosesi ditumpuk setinggi pinggang. Setiap langkah membangkitkan sesuatu.',
    tags: ['PEMBAWA ABU', 'MERCHANT', '20 MUSUH'],
    platforms: [
      floor(0, FLOOR, W, 70),
      floor(180, 352, 210, 18),
      floor(560, 292, 220, 18),
      floor(920, 352, 210, 18),
    ],
    checkpoint: { x: 80, y: FLOOR - 78, w: 38, h: 78, name: 'Warung Abu' },
    merchant: { x: 160, y: FLOOR - 96, w: 46, h: 96 },
    hint: 'Abu di sini masih hangat. Warung Abu berdiri di ambang, dan pembawa abu tidak suka tamu.',
    gate: gateTo(LANTERN_ROOM_START + 3, 'clear', 'Ruang Nyala'),
  },
  {
    key: 'flamechamber',
    name: 'Ruang Nyala',
    subtitle: 'The Flame Chamber',
    accent: '#ffcf8e',
    glyph: '✹',
    desc: 'Ruang terakhir sebelum altar. Sembilan nyala berputar di langit-langit, menunggu satu sumbu yang hilang.',
    tags: ['9 NYALA', 'ELITE', 'GAP'],
    platforms: [
      floor(0, FLOOR, 430, 70),
      floor(620, FLOOR, 780, 70),
      floor(460, 386, 120, 18),
      floor(860, 312, 210, 18),
      floor(1160, 366, 170, 18),
    ],
    checkpoint: { x: 56, y: FLOOR - 78, w: 38, h: 78, name: 'Warung Abu' },
    merchant: { x: 132, y: FLOOR - 96, w: 46, h: 96 },
    hint: 'Sembilan nyala itu bukan hiasan. Salah satu dari mereka adalah sumbu yang kau cari.',
    gate: gateTo(LANTERN_ROOM_START + 4, 'clear', 'Ambang Sumbu'),
  },
  {
    key: 'wickaltar',
    name: 'Ambang Sumbu',
    subtitle: 'The Wick Threshold',
    accent: '#ffe0ae',
    glyph: '☼',
    desc: 'Altar tempat prosesi dimulai dan berakhir. Orsella menunggu dengan sembilan lantern kosong di punggungnya.',
    tags: ['4 FASE', 'BOSS'],
    checkpoint: { x: 88, y: FLOOR - 78, w: 38, h: 78, name: 'Warung Abu' },
    merchant: { x: 168, y: FLOOR - 96, w: 46, h: 96 },
    platforms: [
      floor(0, FLOOR, W, 70),
      floor(130, 348, 200, 18),
      floor(1070, 348, 200, 18),
      floor(590, 300, 220, 18),
      floor(320, 230, 160, 18),
      floor(920, 230, 160, 18),
    ],
    enemies: [],
    boss: 'wickbearer',
    hint: 'Orsella, Pembawa Sumbu, memegang janji sembilan nyala. Empat fase, satu jalan keluar.',
    gate: null,
  },
];

export const LANTERN_ROOMS = ROOM_SOURCE.map((source, index) => {
  const room = {
    id: LANTERN_ROOM_START + index,
    lanternwake: true,
    lanternStage: index + 1,
    lanternKey: source.key,
    name: source.name,
    subtitle: `${LANTERN_NAME} — ${source.subtitle}`,
    zone: LANTERN_ZONE_ID,
    accent: source.accent,
    palette: { ...LANTERN_PALETTE },
    particle: 'embers',
    music: 'lanternwake',
    spawn: { x: 70, y: FLOOR - 46 },
    platforms: source.platforms.map((p) => ({ ...p })),
    enemies: source.enemies ? source.enemies.map((e) => ({ ...e })) : hallEnemies(index),
    boss: source.boss || null,
    hint: source.hint,
    gate: source.gate ? { ...source.gate } : null,
  };
  if (source.checkpoint) room.checkpoint = { ...source.checkpoint };
  if (source.merchant) room.merchant = { ...source.merchant };
  if (source.bounce) room.bounce = source.bounce.map((b) => ({ ...b }));
  if (source.climbs) room.climbs = source.climbs.map((c) => ({ ...c }));
  return room;
});

export const LANTERN_ROOM_BY_ID = Object.fromEntries(LANTERN_ROOMS.map((room) => [room.id, room]));

export const LANTERN_STAGE_META = LANTERN_ROOMS.map((room, index) => ({
  local: index,
  roomId: room.id,
  glyph: ROOM_SOURCE[index].glyph,
  chapter: index === LANTERN_HALL_COUNT ? 'BAB X · V · BOSS' : `BAB X · ${['I', 'II', 'III', 'IV'][index]}`,
  desc: ROOM_SOURCE[index].desc,
  tags: ROOM_SOURCE[index].tags.slice(),
  enemies: room.enemies.length,
  elites: room.enemies.filter((enemy) => enemy.elite || LANTERN_ENEMY_INFO[enemy.type]?.elite).length,
}));

export const LANTERN_STAGE_BY_ROOM = Object.fromEntries(
  LANTERN_STAGE_META.map((stage) => [stage.roomId, stage]),
);

export function lanternRoomForStage(local) {
  const index = Math.trunc(Number(local));
  if (!Number.isFinite(index)) return null;
  return LANTERN_ROOMS[index] || null;
}

export function lanternStageForRoom(roomId) {
  if (!Number.isInteger(roomId)) return null;
  const stage = LANTERN_STAGE_BY_ROOM[roomId];
  return stage ? { ...stage, room: LANTERN_ROOM_BY_ID[roomId] } : null;
}

// ── progression ────────────────────────────────────────────────────────────
export function defaultLanternProgress() {
  return {
    version: LANTERN_VERSION,
    halls: Array.from({ length: LANTERN_HALL_COUNT }, () => false),
    boss: false,
    discovered: Array.from({ length: LANTERN_ROOMS.length }, () => false),
    runs: 0,
    bossClears: 0,
    bestTime: 0,
    lastTime: 0,
  };
}

const toInt = (value, min, max) => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

const toSeconds = (value) => Math.max(0, Math.round((Number(value) || 0) * 10) / 10);

export function sanitizeLanternProgress(raw) {
  const base = defaultLanternProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const halls = Array.from({ length: LANTERN_HALL_COUNT }, (_, i) => raw.halls?.[i] === true);
  for (let i = 1; i < halls.length; i += 1) {
    if (halls[i] && !halls[i - 1]) halls[i] = false;
  }
  const boss = raw.boss === true && halls.every(Boolean);
  const discovered = Array.from({ length: LANTERN_ROOMS.length }, (_, i) => (i === 0 ? true : raw.discovered?.[i] === true));
  const bestTime = toSeconds(raw.bestTime);
  return {
    version: LANTERN_VERSION,
    halls,
    boss,
    discovered,
    runs: toInt(raw.runs, 0, 999999),
    bossClears: toInt(raw.bossClears, 0, 999999),
    bestTime,
    lastTime: toSeconds(raw.lastTime),
  };
}

/** The wake opens only after the Tidewrought Cistern's regent falls. */
export function lanternwakeUnlocked(progress) {
  if (!progress || typeof progress !== 'object') return false;
  const cleared = Array.isArray(progress.cleared) ? progress.cleared : [];
  if (cleared[7] !== true) return false;
  return progress.cistern?.boss === true;
}

export function lanternStageUnlocked(state, local) {
  const safe = sanitizeLanternProgress(state);
  const index = Math.trunc(Number(local));
  if (!Number.isInteger(index) || index < 0 || index >= LANTERN_ROOMS.length) return false;
  if (index === 0) return true;
  if (index === LANTERN_HALL_COUNT) return safe.halls.every(Boolean);
  return safe.halls[index - 1] === true;
}

export function lanternStageCleared(state, local) {
  const safe = sanitizeLanternProgress(state);
  const index = Math.trunc(Number(local));
  if (!Number.isInteger(index) || index < 0 || index >= LANTERN_ROOMS.length) return false;
  if (index === LANTERN_HALL_COUNT) return safe.boss === true;
  return safe.halls[index] === true;
}

export function recordLanternStage(state, local) {
  const safe = state || defaultLanternProgress();
  const index = Math.trunc(Number(local));
  if (!Number.isInteger(index) || index < 0 || index >= LANTERN_HALL_COUNT) return { ok: false };
  if (!lanternStageUnlocked(safe, index)) return { ok: false, reason: 'locked' };
  const firstClear = safe.halls[index] !== true;
  safe.halls[index] = true;
  safe.discovered[index] = true;
  return { ok: true, firstClear, bossUnlocked: safe.halls.every(Boolean) };
}

export function recordLanternBoss(state) {
  const safe = state || defaultLanternProgress();
  if (!safe.halls.every(Boolean)) return { ok: false, reason: 'locked' };
  const firstClear = safe.boss !== true;
  safe.boss = true;
  safe.bossClears += 1;
  return { ok: true, firstClear };
}

export function recordLanternRun(state, seconds = 0) {
  const safe = state || defaultLanternProgress();
  safe.runs += 1;
  safe.lastTime = toSeconds(seconds);
  if (safe.lastTime > 0 && (safe.bestTime === 0 || safe.lastTime < safe.bestTime)) {
    safe.bestTime = safe.lastTime;
  }
  return safe;
}

export function lanternSummary(state) {
  const safe = sanitizeLanternProgress(state);
  const hallsCleared = safe.halls.filter(Boolean).length;
  const stagesCleared = hallsCleared + (safe.boss ? 1 : 0);
  return {
    name: LANTERN_NAME,
    localName: LANTERN_LOCAL_NAME,
    stagesCleared,
    stageTotal: LANTERN_STAGE_COUNT,
    bossCleared: safe.boss,
    discovered: safe.discovered.map(Boolean),
    complete: safe.boss,
    percent: Math.round((stagesCleared / LANTERN_STAGE_COUNT) * 100),
    runs: safe.runs,
    bestTime: safe.bestTime,
  };
}

/** Structural validation used by tests and the content checker. */
export function validateLanternRooms(rooms = LANTERN_ROOMS) {
  const errors = [];
  const ids = new Set(rooms.map((room) => room.id));
  for (let i = 0; i < rooms.length; i += 1) {
    const room = rooms[i];
    if (room.id !== LANTERN_ROOM_START + i) errors.push(`room ${i} id ${room.id} is not contiguous`);
    const gates = room.gates || (room.gate ? [room.gate] : []);
    for (const gate of gates) {
      if (gate.next != null && !ids.has(gate.next)) errors.push(`room ${room.id} gate -> ${gate.next} is missing`);
    }
    if (!room.boss && !gates.length) errors.push(`room ${room.id} needs an exit`);
    if (room.boss && LANTERN_BOSS_INFO[room.boss]?.reward === 'victory' && gates.length) {
      errors.push(`room ${room.id} victory boss must not open a gate`);
    }
    for (const enemy of room.enemies) {
      if (!LANTERN_ENEMY_INFO[enemy.type]) errors.push(`room ${room.id} enemy ${enemy.type} is unknown`);
      if (!(enemy.minX < enemy.x && enemy.x < enemy.maxX)) errors.push(`room ${room.id} ${enemy.type} patrol is invalid`);
    }
  }
  // Campaign contract: every hall is exactly 20 bodies, 19 normal + 1 elite.
  for (const room of rooms.filter((entry) => !entry.boss)) {
    if (room.enemies.length !== LANTERN_ENEMIES_PER_HALL) {
      errors.push(`hall ${room.id} has ${room.enemies.length} enemies, expected ${LANTERN_ENEMIES_PER_HALL}`);
    }
    const elites = room.enemies.filter((enemy) => enemy.elite || LANTERN_ENEMY_INFO[enemy.type]?.elite).length;
    if (elites !== LANTERN_ELITE_COUNT) errors.push(`hall ${room.id} has ${elites} elites, expected ${LANTERN_ELITE_COUNT}`);
    const archetypes = new Set(room.enemies.map((enemy) => LANTERN_ENEMY_INFO[enemy.type]?.behavior));
    if (archetypes.size !== 4) errors.push(`hall ${room.id} uses ${archetypes.size} archetypes, expected 4`);
  }
  return errors;
}
