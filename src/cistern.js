// Ashen Vow — BAB IX: Tidewrought Cistern (Sistem Air Pasang).
// Pure data and progression: no DOM, no canvas, no audio. The rooms are
// appended to ALL_ROOMS at ids 662+ so no legacy or arc room is renumbered.
//
// Chapter shape: five playable stages (four halls + one boss altar) and two
// hidden rooms that only open through a breakable wall. Secret rooms are not
// part of the normal unlock chain; the level select shows them as ??? until
// they are discovered.

export const CISTERN_VERSION = 1;
export const CISTERN_NAME = 'Tidewrought Cistern';
export const CISTERN_LOCAL_NAME = 'Sistem Air Pasang';
export const CISTERN_ROOM_START = 662;
export const CISTERN_STAGE_COUNT = 5;
export const CISTERN_FLOOR_Y = 470;
export const CISTERN_WORLD_W = 1400;
export const CISTERN_ZONE_ID = 'cistern';
// Mirrors ZONES.cistern so the renderer can tint rooms beyond the legacy
// PALETTES table without special-casing the chapter there.
export const CISTERN_PALETTE = {
  top: '#04100f',
  mid: '#0b2624',
  low: '#143a35',
  glow: '#5fd3c2',
  fog: '#1d4b47',
};

const FLOOR = CISTERN_FLOOR_Y;

function gateTo(next, requires, name, extra = {}) {
  return { x: 1362, y: 286, w: 34, h: 184, requires, next, name, ...extra };
}

function westGateTo(next, requires, name, extra = {}) {
  return { x: 6, y: 286, w: 34, h: 184, requires, next, name, ...extra };
}

function floor(x, y, w, h) {
  return { x, y, w, h };
}

// ── enemies ────────────────────────────────────────────────────────────────
// Behaviours ride the seven engine archetypes, so every new body gets real
// chase / burrow / ranged / lunge logic instead of a reskinned crawler.
export const CISTERN_ENEMY_INFO = {
  drowned_thrall: {
    name: 'Drowned Thrall',
    title: 'Pelayan Karam',
    hp: 56,
    dmg: 11,
    speed: 84,
    w: 44,
    h: 36,
    reward: 13,
    behavior: 'chaser',
    danger: 'RENDAH',
    desc: 'Tubuh yang tenggelam bersama sumpahnya lalu berdiri lagi. Merangkak cepat di lantai basah.',
    where: 'Ambang Pasang · Galeri Bocor',
  },
  silt_lurker: {
    name: 'Silt Lurker',
    title: 'Penyelam Lumpur',
    hp: 88,
    dmg: 15,
    speed: 104,
    w: 48,
    h: 44,
    reward: 22,
    behavior: 'burrower',
    danger: 'SEDANG',
    desc: 'Bersembunyi di bawah air keruh, lalu muncul tepat di bawah tumitmu dengan cakar berlumpur.',
    where: 'Galeri Bocor · Ambang Karam',
  },
  tide_ember: {
    name: 'Tide Ember',
    title: 'Nyala Air Pasang',
    hp: 46,
    dmg: 12,
    speed: 66,
    w: 38,
    h: 54,
    reward: 18,
    behavior: 'ranged',
    danger: 'SEDANG',
    desc: 'Api yang tetap menyala di dalam air. Menjaga jarak dan melepas bara biru dari celah katup.',
    where: 'Ambang Pasang · Ruang Katup',
  },
  valve_sentinel: {
    name: 'Valve Sentinel',
    title: 'Penjaga Katup',
    hp: 102,
    dmg: 17,
    speed: 90,
    w: 46,
    h: 58,
    reward: 27,
    behavior: 'lunge',
    danger: 'TINGGI',
    desc: 'Baju besi yang masih menutup katup terakhir. Menandai sasaran sebelum menerjang dengan bahu berkarat.',
    where: 'Ruang Katup · Ambang Karam',
  },
};

// ── boss ───────────────────────────────────────────────────────────────────
export const CISTERN_BOSS_INFO = {
  tidebound: {
    name: 'Vasska',
    title: 'The Tidebound Regent',
    maxHp: 860,
    w: 98,
    h: 118,
    contact: 15,
    ashReward: 210,
    reward: 'victory',
    music: 'cisternBoss',
    color: '#5fd3c2',
    maxPhases: 3,
    phaseThresholds: [0.66, 0.33],
    spawn: { x: 700, y: FLOOR - 118 },
    dialogue: {
      intro: [
        { speaker: 'Vasska', text: 'Kau berjalan melewati air yang sudah lama berhenti menghakimi.' },
        { speaker: 'Vasska', text: 'Sistem ini menampung setiap sumpah yang gagal. Termasuk sumpahmu.' },
      ],
      phase2: [
        { speaker: 'Vasska', text: 'Pasang tidak perlu amarah. Ia hanya perlu naik lebih tinggi darimu.' },
      ],
      phase3: [
        { speaker: 'Vasska', text: 'Aku sudah tenggelam seratus tahun dan belum pernah merasa sebasah ini.' },
        { speaker: 'Vasska', text: 'Bawa nama itu ke permukaan — atau tinggal di sini bersamaku.' },
      ],
      defeat: [
        { speaker: 'Vasska', text: 'Airnya surut... dan untuk pertama kalinya, aku bisa melihat langit-langit.' },
        { speaker: 'Vasska', text: 'Jangan biarkan penjaga berikutnya menungguku di dasar.' },
      ],
    },
  },
};

// ── rooms ──────────────────────────────────────────────────────────────────
const ROOM_SOURCE = [
  {
    key: 'floodgate',
    name: 'Ambang Pasang',
    subtitle: 'The Floodgate',
    accent: '#3fa89a',
    glyph: '≋',
    desc: 'Gerbang bawah yang bocor sejak sumpah terakhir. Airnya naik satu jari setiap kali kau berhenti.',
    tags: ['4 MUSUH', 'GERBANG'],
    platforms: [
      floor(0, FLOOR, 1400, 70),
      floor(300, 372, 190, 18),
      floor(640, 318, 180, 18),
      floor(1000, 380, 170, 18),
    ],
    enemies: [
      { type: 'drowned_thrall', x: 470, minX: 360, maxX: 610 },
      { type: 'drowned_thrall', x: 1120, minX: 1020, maxX: 1230 },
      { type: 'tide_ember', x: 760, minX: 650, maxX: 900 },
      { type: 'tide_ember', x: 1246, minX: 1150, maxX: 1330 },
    ],
    hint: 'Bersihkan ambang sebelum air menutup jalur mundur. Dinding barat berdenyut setiap kali air surut.',
    secretWall: { x: 10, y: 0, w: 60, h: FLOOR, hp: 130, name: 'Dinding Pasang', next: CISTERN_ROOM_START + 6 },
    gates: [
      gateTo(CISTERN_ROOM_START + 1, 'clear', 'Galeri Bocor'),
      westGateTo(CISTERN_ROOM_START + 6, 'wall', 'Gua Surut', { secret: true }),
    ],
  },
  {
    key: 'gallery',
    name: 'Galeri Bocor',
    subtitle: 'The Leaking Gallery',
    accent: '#4bb3a4',
    glyph: '⌘',
    desc: 'Lorong melengkung dengan jembatan batu yang terus menetes. Dinding baratnya berlumut tebal.',
    tags: ['LURKER', 'JURANG', 'DINDING RAHASIA'],
    platforms: [
      floor(0, FLOOR, 520, 70),
      floor(760, FLOOR, 640, 70),
      floor(560, 392, 170, 18),
      floor(430, 322, 150, 18),
      floor(940, 344, 190, 18),
    ],
    enemies: [
      { type: 'silt_lurker', x: 300, minX: 150, maxX: 480 },
      { type: 'drowned_thrall', x: 860, minX: 800, maxX: 1020 },
      { type: 'drowned_thrall', x: 1230, minX: 1140, maxX: 1330 },
      { type: 'tide_ember', x: 1020, minX: 930, maxX: 1160 },
    ],
    bounce: [{ x: 470, y: FLOOR - 8, w: 86, h: 16, power: 1020 }],
    climbs: [{ x: 726, y: 330, w: 22, h: 140 }],
    secretWall: { x: 10, y: 0, w: 60, h: FLOOR, hp: 150, name: 'Dinding Lumut', next: CISTERN_ROOM_START + 5 },
    gates: [
      gateTo(CISTERN_ROOM_START + 2, 'clear', 'Ruang Katup'),
      westGateTo(CISTERN_ROOM_START + 5, 'wall', 'Relung Karam', { secret: true }),
    ],
    hint: 'Lompat dari batu ke batu. Dinding barat berlumut terlalu tebal untuk dilewati begitu saja.',
  },
  {
    key: 'valves',
    name: 'Ruang Katup',
    subtitle: 'The Valve Chamber',
    accent: '#58c4b4',
    glyph: '⚙',
    desc: 'Enam katup raksasa berderit menahan seluruh sistem. Setiap katup dijaga sesuatu yang dulu manusia.',
    tags: ['SENTINEL', 'MERCHANT', 'KATUP'],
    platforms: [
      floor(0, FLOOR, 1400, 70),
      floor(180, 352, 200, 18),
      floor(560, 292, 200, 18),
      floor(960, 352, 200, 18),
    ],
    checkpoint: { x: 88, y: FLOOR - 78, w: 38, h: 78, name: 'Warung Abu' },
    merchant: { x: 168, y: FLOOR - 96, w: 46, h: 96 },
    enemies: [
      { type: 'valve_sentinel', x: 620, minX: 520, maxX: 780 },
      { type: 'tide_ember', x: 1000, minX: 900, maxX: 1120 },
      { type: 'drowned_thrall', x: 1180, minX: 1100, maxX: 1330 },
      { type: 'drowned_thrall', x: 360, minX: 280, maxX: 470 },
    ],
    hint: 'Katup terakhir dipegang baju besi yang menolak berkarat. Warung Abu menunggu di depan.',
    gate: gateTo(CISTERN_ROOM_START + 3, 'clear', 'Ambang Karam'),
  },
  {
    key: 'brink',
    name: 'Ambang Karam',
    subtitle: 'The Sunken Brink',
    accent: '#6fd6c5',
    glyph: '☵',
    desc: 'Lantai terakhir sebelum altar. Air setinggi lutut bergerak melawan arus yang seharusnya.',
    tags: ['5 MUSUH', 'ELITE', 'PASANG'],
    platforms: [
      floor(0, FLOOR, 420, 70),
      floor(600, FLOOR, 800, 70),
      floor(450, 388, 130, 18),
      floor(880, 318, 200, 18),
      floor(1160, 372, 170, 18),
    ],
    checkpoint: { x: 60, y: FLOOR - 78, w: 38, h: 78, name: 'Warung Abu' },
    merchant: { x: 138, y: FLOOR - 96, w: 46, h: 96 },
    enemies: [
      { type: 'valve_sentinel', x: 760, minX: 640, maxX: 920 },
      { type: 'silt_lurker', x: 1100, minX: 980, maxX: 1240 },
      { type: 'tide_ember', x: 900, minX: 820, maxX: 1040 },
      { type: 'drowned_thrall', x: 1260, minX: 1180, maxX: 1340 },
      { type: 'drowned_thrall', x: 660, minX: 610, maxX: 760 },
    ],
    hint: 'Arus bergerak ke hulu. Jangan biarkan ia menyeretmu ke altar sebelum kau siap.',
    gate: gateTo(CISTERN_ROOM_START + 4, 'clear', 'Altar Air Pasang'),
  },
  {
    key: 'altar',
    name: 'Altar Air Pasang',
    subtitle: 'The Tide Altar',
    accent: '#7fe6d4',
    glyph: '♆',
    desc: 'Altar tempat setiap sumpah yang gagal dikumpulkan. Vasska berdiri di tengahnya, setengah tenggelam.',
    tags: ['3 FASE', 'BOSS'],
    checkpoint: { x: 88, y: FLOOR - 78, w: 38, h: 78, name: 'Warung Abu' },
    merchant: { x: 168, y: FLOOR - 96, w: 46, h: 96 },
    platforms: [
      floor(0, FLOOR, 1400, 70),
      floor(120, 352, 190, 18),
      floor(1090, 352, 190, 18),
      floor(600, 306, 200, 18),
      floor(330, 236, 150, 18),
      floor(930, 236, 150, 18),
    ],
    enemies: [],
    boss: 'tidebound',
    hint: 'Vasska, Bupati Karam, menahan pasang dengan tubuhnya sendiri. Tiga fase, satu surut.',
    gate: null,
  },
  {
    key: 'alcove',
    name: 'Relung Karam',
    subtitle: 'The Sunken Alcove',
    accent: '#9ff0e2',
    glyph: '❖',
    desc: 'Ruang yang tidak pernah masuk peta sistem. Airnya tenang dan reliknya masih hangat.',
    tags: ['RAHASIA', 'RELIK'],
    secret: true,
    platforms: [
      floor(0, FLOOR, 1400, 70),
      floor(200, 360, 200, 18),
      floor(580, 300, 180, 18),
      floor(1010, 356, 200, 18),
    ],
    enemies: [{ type: 'tide_ember', x: 780, minX: 640, maxX: 900 }],
    relic: { x: 1064, y: 306, w: 26, h: 26, name: 'Relik Pasang' },
    collectibles: [
      { id: 'cistern_alcove_coin', name: 'Koin Karam', category: 'relics', categoryName: 'Relik', x: 632, y: 268, w: 18, h: 18, color: '#9ff0e2' },
    ],
    hint: 'Relik Pasang masih menyala di relung yang hanya terbuka lewat dinding berlumut.',
    gate: gateTo(CISTERN_ROOM_START + 1, 'clear', 'Galeri Bocor'),
  },
  {
    key: 'lowcave',
    name: 'Gua Surut',
    subtitle: 'The Low Cave',
    accent: '#8fe0d0',
    glyph: '✦',
    desc: 'Gua di bawah ambang. Saat air surut, dasar sistem terlihat — dan sesuatu tertinggal di sana.',
    tags: ['RAHASIA', 'GEMA'],
    secret: true,
    platforms: [
      floor(0, FLOOR, 1400, 70),
      floor(240, 344, 190, 18),
      floor(700, 286, 210, 18),
      floor(1080, 350, 190, 18),
    ],
    enemies: [
      { type: 'silt_lurker', x: 520, minX: 320, maxX: 720 },
      { type: 'drowned_thrall', x: 1120, minX: 1000, maxX: 1300 },
    ],
    collectibles: [
      { id: 'cistern_lowcave_lens', name: 'Lensa Surut', category: 'relics', categoryName: 'Relik', x: 764, y: 254, w: 18, h: 18, color: '#8fe0d0' },
      { id: 'cistern_lowcave_seal', name: 'Segel Dasar', category: 'secrets', categoryName: 'Rahasia', x: 1146, y: 318, w: 18, h: 18, color: '#c8fff4' },
    ],
    hint: 'Dasar sistem menyimpan dua benda yang tidak pernah dicatat.',
    gate: westGateTo(CISTERN_ROOM_START, 'clear', 'Ambang Pasang'),
  },
];

export const CISTERN_ROOMS = ROOM_SOURCE.map((source, index) => {
  const room = {
    id: CISTERN_ROOM_START + index,
    cistern: true,
    cisternStage: index + 1,
    cisternKey: source.key,
    name: source.name,
    subtitle: `${CISTERN_NAME} — ${source.subtitle}`,
    zone: CISTERN_ZONE_ID,
    accent: source.accent,
    palette: { ...CISTERN_PALETTE },
    particle: 'bubbles',
    music: 'cistern',
    spawn: { x: source.secret ? 90 : 70, y: FLOOR - 46 },
    platforms: source.platforms.map((p) => ({ ...p })),
    enemies: source.enemies.map((e) => ({ ...e })),
    relic: source.relic ? { ...source.relic } : null,
    boss: source.boss || null,
    hint: source.hint,
    secret: !!source.secret,
    gate: source.gate ? { ...source.gate } : null,
  };
  if (source.checkpoint) room.checkpoint = { ...source.checkpoint };
  if (source.merchant) room.merchant = { ...source.merchant };
  if (source.bounce) room.bounce = source.bounce.map((b) => ({ ...b }));
  if (source.climbs) room.climbs = source.climbs.map((c) => ({ ...c }));
  if (source.secretWall) room.secretWall = { ...source.secretWall };
  if (source.gates) room.gates = source.gates.map((g) => ({ ...g }));
  if (source.collectibles) room.collectibles = source.collectibles.map((c) => ({ ...c }));
  return room;
});

export const CISTERN_ROOM_BY_ID = Object.fromEntries(CISTERN_ROOMS.map((room) => [room.id, room]));

/** Level-select metadata, one entry per room, in room order. */
export const CISTERN_STAGE_META = CISTERN_ROOMS.map((room, index) => ({
  local: index,
  roomId: room.id,
  secret: !!room.secret,
  glyph: ROOM_SOURCE[index].glyph,
  chapter: room.secret
    ? `BAB IX · RAHASIA`
    : index === CISTERN_STAGE_COUNT - 1
      ? 'BAB IX · V · BOSS'
      : `BAB IX · ${['I', 'II', 'III', 'IV'][index] || index + 1}`,
  desc: ROOM_SOURCE[index].desc,
  tags: ROOM_SOURCE[index].tags.slice(),
}));

export const CISTERN_STAGE_BY_ROOM = Object.fromEntries(
  CISTERN_STAGE_META.map((stage) => [stage.roomId, stage]),
);

export function cisternRoomForStage(local) {
  const index = Math.trunc(Number(local));
  if (!Number.isFinite(index)) return null;
  return CISTERN_ROOMS[index] || null;
}

export function cisternStageForRoom(roomId) {
  if (!Number.isInteger(roomId)) return null;
  const stage = CISTERN_STAGE_BY_ROOM[roomId];
  return stage ? { ...stage, room: CISTERN_ROOM_BY_ID[roomId] } : null;
}

export const CISTERN_SECRET_IDS = CISTERN_ROOMS.filter((room) => room.secret).map((room) => room.cisternKey);

// ── progression ────────────────────────────────────────────────────────────
export const CISTERN_HALL_COUNT = CISTERN_STAGE_COUNT - 1;

export function defaultCisternProgress() {
  return {
    version: CISTERN_VERSION,
    halls: Array.from({ length: CISTERN_HALL_COUNT }, () => false),
    boss: false,
    secrets: Object.fromEntries(CISTERN_SECRET_IDS.map((id) => [id, false])),
    discovered: Array.from({ length: CISTERN_ROOMS.length }, () => false),
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

export function sanitizeCisternProgress(raw) {
  const base = defaultCisternProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const halls = Array.from({ length: CISTERN_HALL_COUNT }, (_, i) => raw.halls?.[i] === true);
  // A hall is only reachable if the one before it is cleared.
  for (let i = 1; i < halls.length; i += 1) {
    if (halls[i] && !halls[i - 1]) halls[i] = false;
  }
  const boss = raw.boss === true && halls.every(Boolean);
  const secrets = {};
  for (const id of CISTERN_SECRET_IDS) secrets[id] = raw.secrets?.[id] === true;
  // Entering a room is what discovers it. A secret room is only ever revealed
  // by actually finding it, so a hand-edited save cannot leak its name.
  const discovered = Array.from({ length: CISTERN_ROOMS.length }, (_, i) => {
    const room = CISTERN_ROOMS[i];
    if (room.secret) return secrets[room.cisternKey] === true;
    if (i === 0) return true;
    return raw.discovered?.[i] === true;
  });
  const bestTime = toSeconds(raw.bestTime);
  return {
    version: CISTERN_VERSION,
    halls,
    boss,
    secrets,
    discovered,
    runs: toInt(raw.runs, 0, 999999),
    bossClears: toInt(raw.bossClears, 0, 999999),
    bestTime,
    lastTime: toSeconds(raw.lastTime),
  };
}

/** The cistern unlocks once The Oathbreaker has fallen in the main campaign. */
export function cisternUnlocked(progress) {
  const cleared = progress?.cleared;
  if (!Array.isArray(cleared)) return false;
  return cleared[7] === true;
}

export function cisternStageUnlocked(state, local) {
  const safe = sanitizeCisternProgress(state);
  const index = Math.trunc(Number(local));
  if (!Number.isInteger(index) || index < 0 || index >= CISTERN_ROOMS.length) return false;
  const room = CISTERN_ROOMS[index];
  if (room.secret) return safe.secrets[room.cisternKey] === true;
  if (index === 0) return true;
  if (index === CISTERN_HALL_COUNT) return safe.halls.every(Boolean);
  return safe.halls[index - 1] === true;
}

export function cisternStageCleared(state, local) {
  const safe = sanitizeCisternProgress(state);
  const index = Math.trunc(Number(local));
  if (!Number.isInteger(index) || index < 0 || index >= CISTERN_STAGE_COUNT) return false;
  if (index === CISTERN_HALL_COUNT) return safe.boss === true;
  return safe.halls[index] === true;
}

export function cisternSecretCount(state) {
  const safe = sanitizeCisternProgress(state);
  return CISTERN_SECRET_IDS.filter((id) => safe.secrets[id]).length;
}

/**
 * Records a cleared hall. The boss altar is not a hall; it records its own
 * clear on bossDown, so walking into the altar cannot unlock stage V.
 */
export function recordCisternStage(state, local) {
  const safe = state || defaultCisternProgress();
  const index = Math.trunc(Number(local));
  if (!Number.isInteger(index) || index < 0 || index >= CISTERN_HALL_COUNT) return { ok: false };
  if (!cisternStageUnlocked(safe, index)) return { ok: false, reason: 'locked' };
  const firstClear = safe.halls[index] !== true;
  safe.halls[index] = true;
  safe.discovered[index] = true;
  return { ok: true, firstClear, bossUnlocked: safe.halls.every(Boolean) };
}

export function recordCisternSecret(state, key) {
  const safe = state || defaultCisternProgress();
  if (!CISTERN_SECRET_IDS.includes(key)) return { ok: false };
  const firstFind = safe.secrets[key] !== true;
  safe.secrets[key] = true;
  const local = CISTERN_ROOMS.findIndex((room) => room.cisternKey === key);
  if (local >= 0) safe.discovered[local] = true;
  return { ok: true, firstFind, allFound: CISTERN_SECRET_IDS.every((id) => safe.secrets[id]) };
}

export function recordCisternBoss(state) {
  const safe = state || defaultCisternProgress();
  if (!safe.halls.every(Boolean)) return { ok: false, reason: 'locked' };
  const firstClear = safe.boss !== true;
  safe.boss = true;
  safe.bossClears += 1;
  return { ok: true, firstClear };
}

export function recordCisternRun(state, seconds = 0) {
  const safe = state || defaultCisternProgress();
  safe.runs += 1;
  safe.lastTime = toSeconds(seconds);
  if (safe.lastTime > 0 && (safe.bestTime === 0 || safe.lastTime < safe.bestTime)) {
    safe.bestTime = safe.lastTime;
  }
  return safe;
}

export function cisternSummary(state) {
  const safe = sanitizeCisternProgress(state);
  const hallsCleared = safe.halls.filter(Boolean).length;
  const stagesCleared = hallsCleared + (safe.boss ? 1 : 0);
  const secretsFound = cisternSecretCount(safe);
  const total = CISTERN_STAGE_COUNT + CISTERN_SECRET_IDS.length;
  const done = stagesCleared + secretsFound;
  return {
    name: CISTERN_NAME,
    localName: CISTERN_LOCAL_NAME,
    stagesCleared,
    stageTotal: CISTERN_STAGE_COUNT,
    bossCleared: safe.boss,
    secretsFound,
    secretTotal: CISTERN_SECRET_IDS.length,
    discovered: safe.discovered.map(Boolean),
    complete: safe.boss && secretsFound === CISTERN_SECRET_IDS.length,
    percent: Math.round((done / total) * 100),
    runs: safe.runs,
    bestTime: safe.bestTime,
  };
}

/** Structural validation used by tests and by the admin content checker. */
export function validateCisternRooms(rooms = CISTERN_ROOMS) {
  const errors = [];
  const ids = new Set(rooms.map((room) => room.id));
  for (let i = 0; i < rooms.length; i += 1) {
    const room = rooms[i];
    if (room.id !== CISTERN_ROOM_START + i) errors.push(`room ${i} id ${room.id} is not contiguous`);
    const gates = room.gates || (room.gate ? [room.gate] : []);
    for (const gate of gates) {
      if (gate.next != null && !ids.has(gate.next)) errors.push(`room ${room.id} gate -> ${gate.next} is missing`);
      if (gate.requires === 'wall' && !room.secretWall) errors.push(`room ${room.id} wall gate without a wall`);
      if (gate.secret && !gate.requires) errors.push(`room ${room.id} secret gate without a lock`);
    }
    for (const enemy of room.enemies) {
      if (!CISTERN_ENEMY_INFO[enemy.type]) errors.push(`room ${room.id} enemy ${enemy.type} is unknown`);
      if (!(enemy.minX < enemy.x && enemy.x < enemy.maxX)) errors.push(`room ${room.id} enemy ${enemy.type} patrol is invalid`);
    }
    if (room.boss && !CISTERN_BOSS_INFO[room.boss]) errors.push(`room ${room.id} boss ${room.boss} is unknown`);
    if (room.boss && CISTERN_BOSS_INFO[room.boss].reward === 'victory' && gates.length) {
      errors.push(`room ${room.id} victory boss must not open a gate`);
    }
    if (!room.boss && !gates.length) errors.push(`room ${room.id} needs an exit`);
    if (room.secret && !rooms.some((other) => other.secretWall)) {
      errors.push('secret rooms need at least one breakable wall');
    }
  }
  return errors;
}
