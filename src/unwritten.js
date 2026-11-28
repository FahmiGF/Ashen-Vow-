// Ashen Vow v0.45.0 — THE UNWRITTEN EXPANSE (Phase 4.2).
//
// Beyond both The Astral Dominion and Arc IV's Rift lies the uninked margin
// of the world: 30 expedition rooms (901-930) across 3 chapters, 6 unwritten_*
// enemy archetypes, 4 multi-phase bosses culminating in The Blank Author,
// and Resonance-linked Oath Sigils + Ink Severance [G].
//
// Pure data + deterministic rules: no DOM, no audio, no storage.

export const UNWRITTEN_VERSION = 1;
export const UNWRITTEN_ID = 'unwritten';
export const UNWRITTEN_NAME = 'The Unwritten Expanse';
export const UNWRITTEN_LOCAL_NAME = 'Bentangan Tak Tertulis';
export const UNWRITTEN_SUBTITLE = 'Di tepi perkamen tempat sumpah belum sempat dituliskan.';

export const UNWRITTEN_ROOM_START = 901;
export const UNWRITTEN_CHAPTER_COUNT = 3;
export const UNWRITTEN_STAGES_PER_CHAPTER = 10;
export const UNWRITTEN_ROOM_COUNT = UNWRITTEN_CHAPTER_COUNT * UNWRITTEN_STAGES_PER_CHAPTER; // 30 (901-930)
export const UNWRITTEN_FLOOR_Y = 470;
export const UNWRITTEN_WORLD_W = 1400;
export const INK_SEVERANCE_MIN_RESONANCE = 35; // Rank B+
export const INK_SEVERANCE_COOLDOWN = 4.0;

const asInt = (value, fallback = 0) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
};

export const UNWRITTEN_ZONE = {
  id: 'unwritten',
  name: UNWRITTEN_NAME,
  localName: UNWRITTEN_LOCAL_NAME,
  color: '#e8d7ae',
  glow: '#9fe6ff',
  music: 'unwritten',
  bossMusic: 'unwrittenBoss',
  particle: 'ash',
  palette: {
    top: '#0b0a0e',
    mid: '#1d1924',
    low: '#2e2738',
    glow: '#e8d7ae',
    fog: '#3f354a',
  },
};

export const UNWRITTEN_SIGILS = [
  {
    id: 'scorched_ink',
    name: 'Sigil of Scorched Ink',
    localName: 'Segel Tinta Hangus',
    glyph: '✒',
    minRank: 'C',
    summary: 'Pada Resonance C+, Ink Severance [G] dan serangan berat membakar musuh dengan tinta bara (+18% damage).',
    damageBonus: 0.18,
    severanceScale: 1.15,
  },
  {
    id: 'quicksilver_nib',
    name: 'Sigil of Quicksilver Nib',
    localName: 'Segel Pena Raksa',
    glyph: '⚡',
    minRank: 'B',
    summary: 'Pada Resonance B+, kecepatan gerak +8% dan cooldown Ink Severance [G] berkurang 1,2 detik.',
    speedBonus: 0.08,
    cooldownReduction: 1.2,
  },
  {
    id: 'blank_page',
    name: 'Sigil of the Blank Page',
    localName: 'Segel Halaman Kosong',
    glyph: '▯',
    minRank: 'A',
    summary: 'Pada Resonance A+, tinta kosong menyerap 15% damage yang masuk.',
    incomingReduction: 0.15,
  },
  {
    id: 'authors_vow',
    name: "Sigil of the Author's Vow",
    localName: 'Segel Sumpah Pengarang',
    glyph: '✦',
    minRank: 'B',
    summary: 'Memperluas radius Ink Severance [G] ke 260 px dan memberi +40% daya ledak tinta.',
    severanceScale: 1.4,
    radiusBonus: 70,
  },
];

export const UNWRITTEN_SIGIL_BY_ID = Object.fromEntries(UNWRITTEN_SIGILS.map((s) => [s.id, s]));

const CHAPTER_SOURCE = [
  {
    id: 'blank_cartography',
    name: 'Blank Cartography',
    localName: 'Kartografi Kosong',
    subtitle: 'Uninked cliffs and drifting margin bridges',
    gimmick: 'Anomali Tinta Pasang: kumpulkan Resonance B+ lalu tekan [G] untuk Ink Severance.',
    boss: 'unwritten_scribe',
    sigilReward: 'scorched_ink',
    color: '#e8d7ae',
    glyph: '✒',
    enemies: ['unwritten_inkling', 'unwritten_quill', 'unwritten_eraser'],
    hint: 'Tinta yang belum kering menyimpan sisa tenaga para peziarah terdahulu.',
  },
  {
    id: 'margins_memory',
    name: 'Margins of Memory',
    localName: 'Tepi Ingatan',
    subtitle: 'Palimpsest spires overwritten by forgotten vows',
    gimmick: 'Anomali Palimpsest: musuh lebih agresif, namun Resonance terisi lebih cepat.',
    boss: 'unwritten_palimpsest_warden',
    sigilReward: 'quicksilver_nib',
    color: '#a8d8ff',
    glyph: '▯',
    enemies: ['unwritten_margin_knight', 'unwritten_palimpsest', 'unwritten_quill'],
    hint: 'Setiap coretan yang dihapus tetap meninggalkan bekas di atas panggung.',
  },
  {
    id: 'final_blank',
    name: 'The Final Blank',
    localName: 'Lembar Kosong Terakhir',
    subtitle: 'The white edge beyond every written chapter',
    gimmick: 'Dua bos menjaga ujung perkamen. Segel Pengarang membuka puncak Oath Resonance.',
    boss: 'unwritten_blank_author',
    sigilReward: 'authors_vow',
    color: '#ffd78a',
    glyph: '✦',
    enemies: ['unwritten_void_chorister', 'unwritten_margin_knight', 'unwritten_palimpsest', 'unwritten_eraser'],
    hint: 'Di Lembar Kosong Terakhir, kaulah yang memegang pena.',
  },
];

export const UNWRITTEN_CHAPTERS = CHAPTER_SOURCE.map((ch, idx) => ({
  ...ch,
  order: idx + 1,
  roomStart: UNWRITTEN_ROOM_START + idx * UNWRITTEN_STAGES_PER_CHAPTER,
  roomEnd: UNWRITTEN_ROOM_START + idx * UNWRITTEN_STAGES_PER_CHAPTER + UNWRITTEN_STAGES_PER_CHAPTER - 1,
}));

export const UNWRITTEN_ENEMY_INFO = {
  unwritten_inkling: {
    name: 'Uninked Husk',
    ai: 'chaser',
    hp: 86,
    speed: 152,
    dmg: 18,
    w: 28,
    h: 42,
    color: '#d8ccb0',
    reward: 22,
  },
  unwritten_quill: {
    name: 'Quill Lancer',
    ai: 'ranged',
    hp: 76,
    speed: 108,
    dmg: 19,
    w: 28,
    h: 46,
    color: '#9fe6ff',
    reward: 24,
  },
  unwritten_eraser: {
    name: 'Erasure Hound',
    ai: 'lunge',
    hp: 94,
    speed: 182,
    dmg: 21,
    w: 36,
    h: 36,
    color: '#e08aa8',
    reward: 26,
  },
  unwritten_margin_knight: {
    name: 'Margin Knight',
    ai: 'slam',
    hp: 138,
    speed: 98,
    dmg: 26,
    w: 42,
    h: 58,
    color: '#e8d7ae',
    reward: 32,
  },
  unwritten_palimpsest: {
    name: 'Palimpsest Shade',
    ai: 'chaser',
    hp: 112,
    speed: 160,
    dmg: 23,
    w: 32,
    h: 48,
    color: '#b89cff',
    reward: 30,
    elite: true,
  },
  unwritten_void_chorister: {
    name: 'Unwritten Chorister',
    ai: 'ranged',
    hp: 124,
    speed: 116,
    dmg: 25,
    w: 34,
    h: 50,
    color: '#ffd78a',
    reward: 36,
    elite: true,
  },
};

export const UNWRITTEN_BOSS_INFO = {
  unwritten_scribe: {
    name: 'The Unwritten Scribe',
    title: 'Juru Tulis Halaman Kosong',
    hp: 880,
    w: 60,
    h: 90,
    color: '#e8d7ae',
    maxPhases: 3,
    phaseThresholds: [0.66, 0.33],
    speed: 150,
    dmg: 25,
    contact: 22,
    reward: 160,
    music: 'unwrittenBoss',
    dialogue: {
      intro: [{ speaker: 'The Unwritten Scribe', text: 'Setiap bab yang kau selesaikan menyisakan tepi putih ini. Jangan kotori ia dengan abumu.' }],
      phase2: [{ speaker: 'The Unwritten Scribe', text: 'Pena bergerak lebih cepat daripada sumpahmu!' }],
      phase3: [{ speaker: 'The Unwritten Scribe', text: 'Bila tidak kutulis namamu, kau tak pernah ada!' }],
      defeat: [{ speaker: 'The Unwritten Scribe', text: 'Tinta tumpah... Silakan ambil Segel Tinta Hangus.' }],
    },
  },
  unwritten_palimpsest_warden: {
    name: 'Palimpsest Warden',
    title: 'Penjaga Tepi Ingatan',
    hp: 1040,
    w: 66,
    h: 96,
    color: '#a8d8ff',
    maxPhases: 3,
    phaseThresholds: [0.66, 0.33],
    speed: 158,
    dmg: 28,
    contact: 25,
    reward: 200,
    music: 'unwrittenBoss',
    dialogue: {
      intro: [{ speaker: 'Palimpsest Warden', text: 'Di bawah tulisanmu, seratus naskah lama masih berteriak.' }],
      phase2: [{ speaker: 'Palimpsest Warden', text: 'Lapisan ingatan kubuka—rasakan beratnya!' }],
      phase3: [{ speaker: 'Palimpsest Warden', text: 'Tak ada yang bisa menghapus bekas pedang pertama!' }],
      defeat: [{ speaker: 'Palimpsest Warden', text: 'Halaman terbuka. Lembar Kosong Terakhir menunggumu.' }],
    },
  },
  unwritten_margin_archivist: {
    name: 'Margin Archivist',
    title: 'Penjaga Catatan Tepi',
    hp: 1120,
    w: 64,
    h: 94,
    color: '#c48bff',
    maxPhases: 2,
    phaseThresholds: [0.48],
    speed: 162,
    dmg: 29,
    contact: 26,
    reward: 220,
    music: 'unwrittenBoss',
    dialogue: {
      intro: [{ speaker: 'Margin Archivist', text: 'Semua catatan kaki yang dibuang berkumpul di sini.' }],
      phase2: [{ speaker: 'Margin Archivist', text: 'Kau bukan tokoh utama di luar halaman ini!' }],
      defeat: [{ speaker: 'Margin Archivist', text: 'Catatan ditutup. Temui Sang Pengarang Kosong.' }],
    },
  },
  unwritten_blank_author: {
    name: 'The Blank Author',
    title: 'Pengarang Tanpa Nama · Lembar Terakhir',
    hp: 1420,
    w: 74,
    h: 108,
    color: '#ffd78a',
    maxPhases: 4,
    phaseThresholds: [0.75, 0.5, 0.25],
    speed: 172,
    dmg: 32,
    contact: 30,
    reward: 'victory',
    music: 'unwrittenBoss',
    dialogue: {
      intro: [{ speaker: 'The Blank Author', text: 'Kau melewati Abu, Langit, Celah, dan Bintang—hanya untuk menemukan halaman yang belum kutulis.' }],
      phase2: [{ speaker: 'The Blank Author', text: 'Biarkan tinta dan gema beradu di atas perkamen kosong!' }],
      phase3: [{ speaker: 'The Blank Author', text: 'Satu goresan lagi, dan seluruh dunia ini akan kurevisi!' }],
      phase4: [{ speaker: 'The Blank Author', text: 'Tunjukkan Oath Resonance-mu! Tulis sendiri akhiranmu!' }],
      defeat: [
        { speaker: 'The Blank Author', text: 'Pena terlepas dari tanganku... Mulai sekarang, halaman ini milikmu.' },
        { speaker: 'The Oathbound', text: 'Tak perlu pengarang lain untuk menjaga sumpah kami.' },
      ],
    },
  },
};

const ANOMALIES = ['Ink Tide', 'Half-Drawn Gravity', 'Resonance Surge'];

function makeUnwrittenPlatforms(chIdx, stageIdx) {
  const split = stageIdx % 2 === 1;
  const platforms = [
    { x: 0, y: UNWRITTEN_FLOOR_Y, w: split ? 420 : 1400, h: 100 },
  ];
  if (split) {
    platforms.push({ x: 540, y: UNWRITTEN_FLOOR_Y, w: 330, h: 100 });
    platforms.push({ x: 990, y: UNWRITTEN_FLOOR_Y, w: 410, h: 100 });
  }
  platforms.push({ x: 260, y: 372, w: 190, h: 18 });
  platforms.push({ x: 560, y: 312 + (chIdx % 2) * 18, w: 220, h: 18 });
  platforms.push({ x: 930, y: 364, w: 190, h: 18 });
  return platforms;
}

function makeUnwrittenEnemies(chapter, stageIdx, isBossRoom) {
  if (isBossRoom) return [];
  const pool = chapter.enemies;
  const count = 4 + (stageIdx % 3);
  const out = [];
  for (let i = 0; i < count; i++) {
    const type = pool[(stageIdx + i) % pool.length];
    const x = 320 + i * 185;
    out.push({
      type,
      x,
      y: UNWRITTEN_FLOOR_Y - (UNWRITTEN_ENEMY_INFO[type]?.h || 46),
      minX: Math.max(80, x - 140),
      maxX: Math.min(UNWRITTEN_WORLD_W - 100, x + 140),
    });
  }
  return out;
}

const ROOM_LIST = [];
let globalIdx = UNWRITTEN_ROOM_START;

for (let c = 0; c < UNWRITTEN_CHAPTERS.length; c++) {
  const chapter = UNWRITTEN_CHAPTERS[c];
  for (let s = 0; s < UNWRITTEN_STAGES_PER_CHAPTER; s++) {
    const isChapterBoss = s === UNWRITTEN_STAGES_PER_CHAPTER - 1;
    const isMidBoss = c === 2 && s === 4;
    const bossKind = isChapterBoss ? chapter.boss : isMidBoss ? 'unwritten_margin_archivist' : null;
    const nextIdx = globalIdx < UNWRITTEN_ROOM_START + UNWRITTEN_ROOM_COUNT - 1 ? globalIdx + 1 : null;
    const anomaly = ANOMALIES[(c + s) % ANOMALIES.length];

    ROOM_LIST.push({
      id: globalIdx,
      key: `unwritten_${c * 10 + s}`,
      index: globalIdx,
      name: `${chapter.name} — Lembar ${s + 1}`,
      subtitle: `${chapter.localName} · ${anomaly}`,
      zone: 'unwritten',
      biome: 'unwritten',
      unwritten: true,
      unwrittenChapter: chapter.id,
      unwrittenStage: s + 1,
      anomaly,
      weather: 'ash',
      condition: `${chapter.gimmick} (${anomaly})`,
      worldW: UNWRITTEN_WORLD_W,
      spawn: { x: 80, y: UNWRITTEN_FLOOR_Y - 46 },
      gate: nextIdx
        ? { x: 1318, y: UNWRITTEN_FLOOR_Y - 88, w: 48, h: 88, next: nextIdx, label: `Ke Lembar ${c * 10 + s + 2}` }
        : null,
      platforms: makeUnwrittenPlatforms(c, s),
      enemies: makeUnwrittenEnemies(chapter, s, !!bossKind),
      boss: bossKind || null,
      checkpoint: s === 0 || !!bossKind ? { x: 140, y: UNWRITTEN_FLOOR_Y - 44, w: 36, h: 44, name: `${chapter.localName} ${s + 1}` } : null,
      npcs:
        s === 0
          ? [{ name: 'Uninked Witness', localName: 'Saksi Tinta', x: 195, y: UNWRITTEN_FLOOR_Y - 46, line: chapter.hint }]
          : [],
    });
    globalIdx += 1;
  }
}

export const UNWRITTEN_ROOMS = ROOM_LIST;

// ── progress & sigils ────────────────────────────────────────────────────────
export function defaultUnwrittenProgress() {
  return {
    version: UNWRITTEN_VERSION,
    unlocked: false,
    cleared: false,
    roomsCleared: {},
    bosses: {},
    sigils: ['blank_page'],
    equippedSigil: 'blank_page',
    severances: 0,
  };
}

export function sanitizeUnwrittenProgress(raw) {
  const base = defaultUnwrittenProgress();
  if (!raw || typeof raw !== 'object') return base;
  const roomsCleared = {};
  if (raw.roomsCleared && typeof raw.roomsCleared === 'object') {
    for (const [k, v] of Object.entries(raw.roomsCleared)) {
      const idx = asInt(k, -1);
      if (idx >= UNWRITTEN_ROOM_START && idx < UNWRITTEN_ROOM_START + UNWRITTEN_ROOM_COUNT && v) {
        roomsCleared[idx] = true;
      }
    }
  }
  const bosses = {};
  if (raw.bosses && typeof raw.bosses === 'object') {
    for (const key of Object.keys(UNWRITTEN_BOSS_INFO)) {
      if (raw.bosses[key]) bosses[key] = true;
    }
  }
  const sigilSet = new Set(['blank_page']);
  if (Array.isArray(raw.sigils)) {
    for (const s of raw.sigils) {
      if (UNWRITTEN_SIGIL_BY_ID[s]) sigilSet.add(s);
    }
  }
  if (bosses.unwritten_scribe) sigilSet.add('scorched_ink');
  if (bosses.unwritten_palimpsest_warden) sigilSet.add('quicksilver_nib');
  if (bosses.unwritten_blank_author) sigilSet.add('authors_vow');
  const sigils = [...sigilSet];
  const equippedSigil = UNWRITTEN_SIGIL_BY_ID[raw.equippedSigil] && sigilSet.has(raw.equippedSigil)
    ? raw.equippedSigil
    : 'blank_page';

  return {
    version: UNWRITTEN_VERSION,
    unlocked: !!raw.unlocked || Object.keys(roomsCleared).length > 0 || Object.keys(bosses).length > 0,
    cleared: !!raw.cleared || !!bosses.unwritten_blank_author,
    roomsCleared,
    bosses,
    sigils,
    equippedSigil,
    severances: Math.max(0, asInt(raw.severances, 0)),
  };
}

export function unwrittenUnlocked(progress) {
  if (!progress || typeof progress !== 'object') return false;
  if (progress.unwritten?.unlocked || progress.unwritten?.cleared) return true;
  if (progress.rift?.cleared || progress.rift?.bosses?.rift_devilish_scum) return true;
  if (progress.astral?.bosses?.astral_architect_of_eternity) return true;
  if (progress.victory) return true;
  return false;
}

export function recordUnwrittenRoom(progress, roomIndex) {
  const st = sanitizeUnwrittenProgress(progress?.unwritten);
  if (roomIndex >= UNWRITTEN_ROOM_START && roomIndex < UNWRITTEN_ROOM_START + UNWRITTEN_ROOM_COUNT) {
    st.unlocked = true;
    st.roomsCleared[roomIndex] = true;
  }
  return st;
}

export function recordUnwrittenBoss(progress, bossKind) {
  const st = sanitizeUnwrittenProgress(progress?.unwritten);
  if (UNWRITTEN_BOSS_INFO[bossKind]) {
    st.unlocked = true;
    st.bosses[bossKind] = true;
    if (bossKind === 'unwritten_scribe' && !st.sigils.includes('scorched_ink')) st.sigils.push('scorched_ink');
    if (bossKind === 'unwritten_palimpsest_warden' && !st.sigils.includes('quicksilver_nib')) st.sigils.push('quicksilver_nib');
    if (bossKind === 'unwritten_blank_author') {
      st.cleared = true;
      if (!st.sigils.includes('authors_vow')) st.sigils.push('authors_vow');
    }
  }
  return st;
}

export function equipUnwrittenSigil(progress, sigilId) {
  const st = sanitizeUnwrittenProgress(progress?.unwritten);
  if (UNWRITTEN_SIGIL_BY_ID[sigilId] && st.sigils.includes(sigilId)) {
    st.equippedSigil = sigilId;
  }
  return st;
}

export function unwrittenSummary(progress) {
  const st = sanitizeUnwrittenProgress(progress?.unwritten);
  return {
    unlocked: unwrittenUnlocked(progress),
    cleared: st.cleared,
    rooms: Object.keys(st.roomsCleared).length,
    totalRooms: UNWRITTEN_ROOM_COUNT,
    bosses: Object.keys(st.bosses).length,
    totalBosses: Object.keys(UNWRITTEN_BOSS_INFO).length,
    sigils: st.sigils.length,
    totalSigils: UNWRITTEN_SIGILS.length,
    equippedSigil: st.equippedSigil,
    severances: st.severances,
  };
}

export function validateUnwrittenRooms() {
  const errors = [];
  if (UNWRITTEN_ROOMS.length !== UNWRITTEN_ROOM_COUNT) {
    errors.push(`Expected ${UNWRITTEN_ROOM_COUNT} rooms, got ${UNWRITTEN_ROOMS.length}`);
  }
  for (let i = 0; i < UNWRITTEN_ROOMS.length; i++) {
    const room = UNWRITTEN_ROOMS[i];
    if (room.id !== UNWRITTEN_ROOM_START + i) {
      errors.push(`Room ${room.key} expected id ${UNWRITTEN_ROOM_START + i}, got ${room.id}`);
    }
    for (const e of room.enemies) {
      if (!UNWRITTEN_ENEMY_INFO[e.type]) errors.push(`Unknown enemy ${e.type} in ${room.id}`);
    }
    if (room.boss && !UNWRITTEN_BOSS_INFO[room.boss]) {
      errors.push(`Unknown boss ${room.boss} in ${room.id}`);
    }
  }
  return { ok: errors.length === 0, errors };
}
