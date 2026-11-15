// Ashen Vow — PANGGUNG ABADI (Eternal Stage) boss pack.
// Six new multi-phase bosses that reuse the echo-boss pattern family
// (slam / volley / ring / charge / summon / rain) and each carry their own
// procedural music track. Pure data; safe in Node and the browser.

export const PACK_VERSION = 1;
export const PACK_NAME = 'Panggung Abadi';
export const PACK_SUBTITLE = 'Enam Penjaga Agung · satu napas';

const SOURCE = [
  {
    id: 'ashking',
    kind: 'pack_ashking',
    name: 'Malveth, The Ash King',
    title: 'Crown of Cinders',
    pattern: 'slam',
    chapter: 20,
    hp: 900,
    w: 132,
    h: 146,
    contact: 20,
    phases: 3,
    color: '#e0553b',
    music: 'bossAsh',
    ashReward: 190,
    echoReward: 26,
    glyph: '♛',
    lines: [
      'Mahkota ini ditempa dari tulang semua raja yang kau bunuh. Berlutut.',
      'Abu tidak pernah lupa nama rajanya!',
      'Kau hanya tamu lain di pemakaman ini...',
    ],
    defeat: 'Mahkota... terlalu berat untuk kepala yang sudah mati...',
  },
  {
    id: 'glasswarden',
    kind: 'pack_glasswarden',
    name: 'Ilyra, The Glass Warden',
    title: 'Shattered Oath',
    pattern: 'ring',
    chapter: 21,
    hp: 980,
    w: 124,
    h: 138,
    contact: 21,
    phases: 3,
    color: '#8fc9a8',
    music: 'bossGlass',
    ashReward: 210,
    echoReward: 28,
    glyph: '❧',
    lines: [
      'Setiap serpihan di lantai ini pernah bersumpah melindungimu. Kau memecahkannya.',
      'Kaca mengingat setiap pukulan. Aku juga.',
      'Pecahkan aku, dan kau akan berjalan di atas semua janji yang kau ingkari.',
    ],
    defeat: 'Akhirnya... sesuatu yang lebih tajam dari sumpahku...',
  },
  {
    id: 'hollowabbot',
    kind: 'pack_hollowabbot',
    name: 'Abbot Vurn, The Hollow',
    title: 'Sermon of Empty Hands',
    pattern: 'summon',
    chapter: 22,
    hp: 1080,
    w: 128,
    h: 142,
    contact: 22,
    phases: 3,
    color: '#a86bd8',
    music: 'bossAbbot',
    ashReward: 230,
    echoReward: 30,
    glyph: '✠',
    lines: [
      'Kosongkan dirimu. Lalu kosongkan juga duniamu.',
      'Kami berdoa pada lubang di dada kami, dan lubang itu menjawab.',
      'Jangan menangis. Rongga ini adalah rahmat.',
    ],
    defeat: 'Kekosongan... rupanya bisa dipenuhi juga...',
  },
  {
    id: 'stormvalkyr',
    kind: 'pack_stormvalkyr',
    name: 'Valkyr of the Ninth Storm',
    title: 'Spear of the Last Sky',
    pattern: 'volley',
    chapter: 23,
    hp: 1180,
    w: 120,
    h: 136,
    contact: 23,
    phases: 4,
    color: '#7fc9e8',
    music: 'bossStorm',
    ashReward: 250,
    echoReward: 33,
    glyph: '⚡',
    lines: [
      'Sembilan badai kulewati untuk sampai ke sini. Kau hanya satu badai kecil.',
      'Petir tidak menanyakan siapa yang benar. Ia hanya memilih yang berdiri.',
      'Langit terakhir ini milikku. Kau boleh meminjam kematiannya.',
      'Berdirilah sedikit lebih lama. Aku ingin melihatmu jatuh dengan bangga.',
    ],
    defeat: 'Bagus. Langit... akhirnya punya tuan baru...',
  },
  {
    id: 'dawnseraph',
    kind: 'pack_dawnseraph',
    name: 'Seraph of the Last Dawn',
    title: 'Wings Over Ashen Morning',
    pattern: 'rain',
    chapter: 24,
    hp: 1300,
    w: 130,
    h: 148,
    contact: 24,
    phases: 4,
    color: '#e8b46a',
    music: 'bossDawn',
    ashReward: 280,
    echoReward: 36,
    glyph: '☀',
    lines: [
      'Fajar ini kupinjam dari pagi yang tidak pernah datang. Aku tidak akan meminjamnya sia-sia.',
      'Setiap bulu di sayapku adalah doa seorang yang mati muda.',
      'Aku menjaga pagi terakhir. Kau menjaga apa?',
      'Cahaya tidak butuh pemenang. Ia butuh saksi.',
    ],
    defeat: 'Kau telah melihat fajar terakhir. Jangan lupakan matahari.',
  },
  {
    id: 'oatheater',
    kind: 'pack_oatheater',
    name: 'The Oath Eater, Final Judge',
    title: 'The Mouth That Swallowed Vows',
    pattern: 'charge',
    chapter: 25,
    hp: 1500,
    w: 142,
    h: 156,
    contact: 26,
    phases: 5,
    color: '#d6ac66',
    music: 'bossJudge',
    ashReward: 380,
    echoReward: 52,
    glyph: '☩',
    lines: [
      'Aku memakan sumpah. Beri aku sumpahmu, dan aku akan memakan nama itu dari mulutmu.',
      'Kau bersumpah untuk membalas. Kau bersumpah untuk melindungi. Semua sumpah berakhir di sini.',
      'Kau masih berdiri? Rasa lapar ini tidak pernah puas.',
      'Sebutkan satu janji yang belum kau ingkari. Hanya satu.',
      'Tidak ada. Tidak ada. Tidak ada.',
    ],
    defeat: 'Kenyang... untuk pertama kalinya... aku kenyang...',
  },
];

const thresholdsFor = (phases) =>
  Array.from({ length: Math.max(1, phases - 1) }, (_, index) =>
    Math.round((1 - (index + 1) / phases) * 1000) / 1000,
  );

export const PACK_BOSSES = SOURCE.map((source, index) => ({
  index,
  id: source.id,
  kind: source.kind,
  name: source.name,
  title: source.title,
  subtitle: source.lines[0],
  pattern: source.pattern,
  chapter: source.chapter,
  phases: source.phases,
  color: source.color,
  glyph: source.glyph,
  music: source.music,
  maxHp: source.hp,
}));

export const PACK_BOSS_IDS = PACK_BOSSES.map((boss) => boss.kind);
export const PACK_BOSS_BY_ID = Object.fromEntries(PACK_BOSSES.map((boss) => [boss.id, boss]));
export const PACK_BOSS_AT = (index) => PACK_BOSSES[index] || null;

export const PACK_BOSS_INFO = {};
for (const source of SOURCE) {
  const thresholds = thresholdsFor(source.phases);
  const dialogue = {
    intro: [
      { speaker: source.name, text: source.lines[0] },
      { speaker: 'The Oathbound', text: 'Panggung ini akan meruntuhkan salah satu dari kita.' },
    ],
    defeat: [{ speaker: source.name, text: source.defeat }],
  };
  for (let phase = 2; phase <= source.phases; phase += 1) {
    dialogue[`phase${phase}`] = [
      { speaker: source.name, text: source.lines[phase - 1] || source.lines[source.lines.length - 1] },
    ];
  }
  PACK_BOSS_INFO[source.kind] = {
    id: source.id,
    kind: source.kind,
    name: source.name,
    localName: source.name,
    title: source.title,
    pack: true,
    stage: 'pack',
    pattern: source.pattern,
    chapter: source.chapter,
    maxHp: source.hp,
    w: source.w,
    h: source.h,
    contact: source.contact,
    maxPhases: source.phases,
    phaseThresholds: thresholds,
    mini: false,
    major: true,
    reward: 'blessing',
    summonType: source.pattern === 'summon' ? 'sporeling' : null,
    ashReward: source.ashReward,
    echoReward: source.echoReward,
    color: source.color,
    music: source.music,
    glyph: source.glyph,
    spawn: { x: 760, y: 470 - source.h },
    dialogue,
    desc: source.lines[0],
    where: 'Panggung Abadi'
  };
}

// ── progress ────────────────────────────────────────────────────────────────
export function defaultPackProgress() {
  return {
    version: PACK_VERSION,
    cleared: {},
    runs: 0,
    gauntletClears: 0,
    bestRun: 0,
    lastIndex: 0,
  };
}

export function sanitizePackProgress(raw) {
  const base = defaultPackProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const cleared = {};
  for (const boss of PACK_BOSSES) {
    if (raw.cleared?.[boss.id] === true) cleared[boss.id] = true;
  }
  const int = (value, min, max) => {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  };
  return {
    version: PACK_VERSION,
    cleared,
    runs: int(raw.runs, 0, 99999),
    gauntletClears: int(raw.gauntletClears, 0, 99999),
    bestRun: Math.max(0, Math.round((Number(raw.bestRun) || 0) * 10) / 10),
    lastIndex: int(raw.lastIndex, 0, PACK_BOSSES.length - 1),
  };
}

export function packBossUnlocked(state, index) {
  if (index <= 0) return true;
  const previous = PACK_BOSSES[index - 1];
  return !previous || state?.cleared?.[previous.id] === true;
}

export function packProgressSummary(state) {
  const safe = sanitizePackProgress(state);
  const cleared = PACK_BOSSES.filter((boss) => safe.cleared[boss.id]).length;
  return {
    cleared,
    total: PACK_BOSSES.length,
    percent: Math.round((cleared / PACK_BOSSES.length) * 100),
    runs: safe.runs,
    gauntletClears: safe.gauntletClears,
    bestRun: safe.bestRun,
    complete: cleared >= PACK_BOSSES.length,
  };
}

export function recordPackBoss(state, index, seconds = 0) {
  const safe = state || defaultPackProgress();
  const boss = PACK_BOSSES[index];
  if (!boss) return { ok: false };
  const firstClear = safe.cleared[boss.id] !== true;
  safe.cleared[boss.id] = true;
  safe.lastIndex = Math.min(PACK_BOSSES.length - 1, index + 1);
  void seconds;
  return { ok: true, firstClear };
}

export function recordPackFinish(state, seconds = 0) {
  const safe = state || defaultPackProgress();
  safe.runs = (safe.runs || 0) + 1;
  safe.gauntletClears = (safe.gauntletClears || 0) + 1;
  const time = Math.max(0, Math.round((Number(seconds) || 0) * 10) / 10);
  if (time > 0 && (!safe.bestRun || time < safe.bestRun)) safe.bestRun = time;
  return { ok: true, runs: safe.runs, gauntletClears: safe.gauntletClears };
}
