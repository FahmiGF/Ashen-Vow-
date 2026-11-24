// Update XVII — 3D Scary Mode: Blackveil Nightfall.
// Pure data and progression. No DOM, no renderer state. Every site below is a
// real playable 3D stage handled by Ashen3DGame.startHorrorSite().

export const HORROR3D_SAVE_KEY = 'ashen-vow-3dhorror-v1';
export const HORROR3D_SCHEMA_VERSION = 1;

export const HORROR3D_SCARE_SHAPES = ['figure', 'face', 'hand', 'mirror', 'static', 'atmospheric'];

const site = (def) => {
  const entry = {
  phases: [
    { id: 'threshold', title: 'Ambang', objective: 'Ambil gema pertama di ambang bangunan.' },
    { id: 'descent', title: 'Turun', objective: 'Kumpulkan dua gema terakhir saat sesuatu mulai mengikuti.' },
    { id: 'escape', title: 'Keluar', objective: 'Capai gerbang keluar sebelum The Unlit menyentuhmu.' },
  ],
  scares: [
    { id: `${def.id}_arrival`, trigger: 'start', shape: 'figure', line: 'Sesuatu berdiri di ujung lorong.' },
    { id: `${def.id}_first`, trigger: 'echo1', shape: 'hand', line: 'Jangan menoleh. Jangan menghitung jari.' },
    { id: `${def.id}_second`, trigger: 'echo2', shape: 'mirror', line: 'Pantulanmu terlambat satu langkah.' },
    { id: `${def.id}_hunt`, trigger: 'hunt', shape: 'face', line: 'Ia sudah tidak berjalan. Ia sudah di sini.' },
  ],
  ...def,
  };
  entry.echoes = (def.echoes || []).map((echo) => ({ y: 20, ...echo }));
  entry.exit = { y: 0, ...(def.exit || {}) };
  return entry;
};

export const HORROR3D_SITES = [
  site({
    id: 'blackveil_manor',
    name: 'Blackveil Manor',
    subtitle: 'Rumah yang Menghitung Penghuninya',
    region: 'gothic',
    areaId: 'horror_blackveil_manor',
    building: 'manor',
    level: 1,
    difficulty: 'Haunted',
    brief: 'Mansion keluarga Blackveil. Setiap cermin menampilkan jumlah penghuni yang berbeda.',
    mechanic: 'Cermin menyimpan posisi pemain sebelumnya.',
    palette: { fog: '#121016', glow: '#d8c38d', stone: '#6d675f', danger: '#b34b4b' },
    buildingScale: 26,
    entity: { name: 'The Governess', title: 'Pengasuh Tanpa Wajah', model: 'ghost_weeping_mother', speed: 76, damage: 18, tint: [0.72, 0.62, 0.74] },
    echoes: [
      { id: 'manor_echo_1', label: 'Gema Cermin', x: -120, z: 230 },
      { id: 'manor_echo_2', label: 'Gema Jam', x: 150, z: 465 },
      { id: 'manor_echo_3', label: 'Gema Nama', x: -40, z: 690 },
    ],
    exit: { x: 0, z: 1000 },
    props: [
      { type: 'worldtree', x: -250, z: 250, height: 170, radius: 34, color: '#3f3b35' },
      { type: 'ruin', x: 255, z: 390, scale: 1.9, color: '#5f5a53' },
      { type: 'totem', x: 220, z: 610, height: 80, color: '#7d6b4f' },
      { type: 'ruin', x: -235, z: 800, scale: 2.1, color: '#5f5a53' },
    ],
  }),
  site({
    id: 'saint_orra',
    name: 'Saint Orra Sanatorium',
    subtitle: 'Bangsal yang Tidak Pernah Kosong',
    region: 'gothic',
    areaId: 'horror_saint_orra',
    building: 'asylum',
    level: 2,
    difficulty: 'Nightmare',
    brief: 'Sanatorium yang ditutup setelah semua pasien tercatat pulang pada hari yang sama.',
    mechanic: 'Lampu darurat mati setiap gema diambil.',
    palette: { fog: '#0e1515', glow: '#b8d7c5', stone: '#596a66', danger: '#c25a4b' },
    buildingScale: 25,
    entity: { name: 'Nurse Orra', title: 'Perawat Ronde Terakhir', model: 'ghost_hollow_wraith', speed: 84, damage: 20, tint: [0.72, 0.84, 0.79] },
    echoes: [
      { id: 'orra_echo_1', label: 'Gema Rekam Medis', x: 130, z: 250 },
      { id: 'orra_echo_2', label: 'Gema Lonceng', x: -160, z: 500 },
      { id: 'orra_echo_3', label: 'Gema Kamar 13', x: 60, z: 705 },
    ],
    exit: { x: -10, z: 1005 },
    props: [
      { type: 'ruin', x: -245, z: 300, scale: 2.4, color: '#52635f' },
      { type: 'ruin', x: 250, z: 460, scale: 1.8, color: '#52635f' },
      { type: 'worldtree', x: -245, z: 720, height: 150, radius: 30, color: '#314943' },
      { type: 'totem', x: 230, z: 850, height: 84, color: '#7c8b82' },
    ],
  }),
  site({
    id: 'drowned_chapel',
    name: 'The Drowned Chapel',
    subtitle: 'Doa di Bawah Air Pasang',
    region: 'drowned',
    areaId: 'horror_drowned_chapel',
    building: 'chapel',
    level: 3,
    difficulty: 'Abyssal',
    brief: 'Kapel yang tenggelam setiap malam dan muncul kembali dengan jemaat yang sama.',
    mechanic: 'Air naik setiap fase; gema hanya terlihat lewat pantulan.',
    palette: { fog: '#07151b', glow: '#8bd6cf', stone: '#496d6a', danger: '#b45c5c' },
    buildingScale: 24,
    entity: { name: 'The Drowned Cantor', title: 'Pemimpin Koor Tenggelam', model: 'ghost_drowned_bell', speed: 88, damage: 22, tint: [0.58, 0.88, 0.9] },
    echoes: [
      { id: 'chapel_echo_1', label: 'Gema Lonceng Karam', x: -150, z: 220 },
      { id: 'chapel_echo_2', label: 'Gema Mazmur', x: 150, z: 455 },
      { id: 'chapel_echo_3', label: 'Gema Nama Suci', x: 0, z: 680 },
    ],
    exit: { x: 10, z: 1010 },
    props: [
      { type: 'crystal', x: -245, z: 280, scale: 1.9, color: '#8bd6cf' },
      { type: 'ruin', x: 250, z: 380, scale: 2.2, color: '#41615f' },
      { type: 'crystal', x: 240, z: 660, scale: 1.6, color: '#8bd6cf' },
      { type: 'ruin', x: -240, z: 820, scale: 2.4, color: '#41615f' },
    ],
  }),
  site({
    id: 'cinder_mill',
    name: 'Cinder Mill',
    subtitle: 'Penggilingan yang Menyala Tanpa Api',
    region: 'infernal',
    areaId: 'horror_cinder_mill',
    building: 'mill',
    level: 4,
    difficulty: 'Infernal',
    brief: 'Penggilingan tua yang menggiling sesuatu yang tidak pernah menjadi tepung.',
    mechanic: 'Bilah kincir berputar setiap kali pemain berhenti bergerak.',
    palette: { fog: '#160b09', glow: '#f0a05a', stone: '#5e4037', danger: '#d05a38' },
    buildingScale: 27,
    entity: { name: 'The Miller', title: 'Penggiling Tanpa Tangan', model: 'ghost_forgotten_one', speed: 72, damage: 24, tint: [1.05, 0.68, 0.48] },
    echoes: [
      { id: 'mill_echo_1', label: 'Gema Gandum Hitam', x: 140, z: 240 },
      { id: 'mill_echo_2', label: 'Gema Roda', x: -155, z: 475 },
      { id: 'mill_echo_3', label: 'Gema Nama Penggiling', x: 30, z: 690 },
    ],
    exit: { x: 0, z: 1000 },
    props: [
      { type: 'ruin', x: -250, z: 260, scale: 2.6, color: '#503a34' },
      { type: 'crystal', x: 245, z: 410, scale: 1.7, color: '#e08c50' },
      { type: 'ruin', x: -235, z: 650, scale: 1.9, color: '#503a34' },
      { type: 'totem', x: 230, z: 820, height: 90, color: '#8f5b42' },
    ],
  }),
  site({
    id: 'hollow_lighthouse',
    name: 'The Hollow Lighthouse',
    subtitle: 'Cahaya yang Memanggil ke Bawah',
    region: 'astral',
    areaId: 'horror_hollow_lighthouse',
    building: 'lighthouse',
    level: 5,
    difficulty: 'Unwritten',
    brief: 'Menara mercusuar yang memutar cahayanya ke dalam bumi, bukan ke laut.',
    mechanic: 'Cahaya mercusuar membekukan pemain jika terkena sorotannya.',
    palette: { fog: '#0c0b1a', glow: '#d9c6ff', stone: '#56536c', danger: '#9b59b6' },
    buildingScale: 28,
    entity: { name: 'The Keeper Below', title: 'Penjaga yang Menatap ke Dalam', model: 'ghost_lantern_eater', speed: 94, damage: 24, tint: [0.86, 0.72, 1.05] },
    echoes: [
      { id: 'light_echo_1', label: 'Gema Lensa', x: -140, z: 225 },
      { id: 'light_echo_2', label: 'Gema Ombak', x: 160, z: 465 },
      { id: 'light_echo_3', label: 'Gema Nama Kapal', x: -20, z: 680 },
    ],
    exit: { x: 0, z: 1010 },
    props: [
      { type: 'crystal', x: -250, z: 300, scale: 2.2, color: '#d9c6ff' },
      { type: 'crystal', x: 245, z: 420, scale: 1.8, color: '#d9c6ff' },
      { type: 'ruin', x: -235, z: 760, scale: 2.1, color: '#49465c' },
      { type: 'worldtree', x: 245, z: 850, height: 145, radius: 26, color: '#302e43' },
    ],
  }),
];

export const HORROR3D_SITE_BY_ID = Object.fromEntries(HORROR3D_SITES.map((entry) => [entry.id, entry]));

export const horror3DSite = (id) => HORROR3D_SITE_BY_ID[id] || null;

// Builds the 3D scenery list consumed by both WebGL and the Canvas fallback.
export function horror3DScenery(siteId) {
  const entry = horror3DSite(siteId);
  if (!entry) return [];
  return [
    {
      type: entry.building,
      x: 0,
      y: 0,
      z: 790,
      scale: entry.buildingScale,
      radius: 125,
      height: 240,
      color: entry.palette.stone,
      horrorSite: entry.id,
    },
    ...entry.echoes.map((echo) => ({
      type: 'echo_rune',
      x: echo.x,
      y: echo.y,
      z: echo.z,
      scale: 2.2,
      color: entry.palette.glow,
      echoId: echo.id,
      horrorSite: entry.id,
    })),
    {
      type: 'exitgate',
      x: entry.exit.x,
      y: entry.exit.y,
      z: entry.exit.z,
      scale: 1.6,
      color: entry.palette.glow,
      horrorSite: entry.id,
    },
    ...entry.props.map((prop) => ({ ...prop, horrorSite: entry.id })),
  ];
}

export function default3DHorrorSave() {
  return {
    schemaVersion: HORROR3D_SCHEMA_VERSION,
    sites: {},
    runs: 0,
    clears: 0,
    deaths: 0,
    scares: 0,
    bestTime: null,
    lastSite: null,
    lastResult: null,
    achievements: [],
    settings: { intensity: 'full', antiJumpscare: false, firstPerson: true },
  };
}

const number = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const clampInt = (value, lo, hi, fallback = 0) => Math.max(lo, Math.min(hi, Math.round(number(value, fallback))));
const uniqueStrings = (value, allowed = null) => [...new Set(
  (Array.isArray(value) ? value : []).filter((item) => typeof item === 'string' && (!allowed || allowed.includes(item))),
)];

export function sanitize3DHorrorSave(raw = {}) {
  const save = default3DHorrorSave();
  if (!raw || typeof raw !== 'object') return save;
  save.runs = clampInt(raw.runs, 0, 100000);
  save.clears = clampInt(raw.clears, 0, 100000);
  save.deaths = clampInt(raw.deaths, 0, 100000);
  save.scares = clampInt(raw.scares, 0, 1000000);
  save.bestTime = Number.isFinite(Number(raw.bestTime)) && Number(raw.bestTime) > 0 ? Number(raw.bestTime) : null;
  save.lastSite = HORROR3D_SITE_BY_ID[raw.lastSite] ? raw.lastSite : null;
  save.lastResult = raw.lastResult === 'cleared' || raw.lastResult === 'dead' ? raw.lastResult : null;
  save.achievements = uniqueStrings(raw.achievements, HORROR3D_ACHIEVEMENTS.map((achievement) => achievement.id));
  if (raw.settings && typeof raw.settings === 'object') {
    save.settings.intensity = ['reduced', 'full', 'nightmare'].includes(raw.settings.intensity) ? raw.settings.intensity : 'full';
    save.settings.antiJumpscare = raw.settings.antiJumpscare === true;
    save.settings.firstPerson = raw.settings.firstPerson !== false;
  }
  if (raw.sites && typeof raw.sites === 'object') {
    for (const [id, record] of Object.entries(raw.sites)) {
      if (!HORROR3D_SITE_BY_ID[id] || !record || typeof record !== 'object') continue;
      save.sites[id] = {
        attempts: clampInt(record.attempts, 0, 100000),
        clears: clampInt(record.clears, 0, 100000),
        deaths: clampInt(record.deaths, 0, 100000),
        scares: clampInt(record.scares, 0, 100000),
        bestTime: Number.isFinite(Number(record.bestTime)) && Number(record.bestTime) > 0 ? Number(record.bestTime) : null,
        lastTime: Number.isFinite(Number(record.lastTime)) && Number(record.lastTime) > 0 ? Number(record.lastTime) : null,
        lastResult: record.lastResult === 'cleared' || record.lastResult === 'dead' ? record.lastResult : null,
      };
    }
  }
  return save;
}

export const HORROR3D_ACHIEVEMENTS = [
  { id: 'nightfall_first', name: 'Malam Pertama', description: 'Masuki satu situs 3D Scary Mode.', test: (save) => save.runs >= 1 },
  { id: 'nightfall_clear', name: 'Keluar Hidup', description: 'Selesaikan satu situs.', test: (save) => save.clears >= 1 },
  { id: 'nightfall_all', name: 'Lima Pintu', description: 'Selesaikan kelima situs.', test: (save) => save.clears >= HORROR3D_SITES.length },
  { id: 'nightfall_survivor', name: 'Tanpa Menoleh', description: 'Selesaikan situs tanpa memicu jumpscare.', test: (save) => Object.values(save.sites).some((entry) => entry.clears > 0 && entry.scares === 0) },
  { id: 'nightfall_archivist', name: 'Kolektor Teror', description: 'Alami 20 jumpscare 3D.', test: (save) => save.scares >= 20 },
  { id: 'nightfall_speed', name: 'Tiga Menit', description: 'Selesaikan situs dalam 180 detik atau kurang.', test: (save) => save.bestTime !== null && save.bestTime <= 180 },
];

export function award3DHorrorAchievements(save) {
  const unlocked = [];
  for (const achievement of HORROR3D_ACHIEVEMENTS) {
    if (save.achievements.includes(achievement.id)) continue;
    if (achievement.test(save)) {
      save.achievements.push(achievement.id);
      unlocked.push(achievement.id);
    }
  }
  return unlocked;
}

export function record3DHorrorResult(save, result = {}) {
  if (!save || !HORROR3D_SITE_BY_ID[result.siteId]) return { ok: false, reason: 'site' };
  if (result.result !== 'cleared' && result.result !== 'dead') return { ok: false, reason: 'result' };
  const siteId = result.siteId;
  const time = number(result.time, 0);
  const scares = clampInt(result.scares, 0, 10000);
  const phase = clampInt(result.phase, 0, 2);
  const previous = save.sites[siteId] || { attempts: 0, clears: 0, deaths: 0, scares: 0, bestTime: null, lastTime: null, lastResult: null };
  const record = {
    ...previous,
    attempts: previous.attempts + 1,
    scares: previous.scares + scares,
    lastTime: time > 0 ? time : null,
    lastResult: result.result,
  };
  save.runs += 1;
  save.scares += scares;
  save.lastSite = siteId;
  save.lastResult = result.result;
  if (result.result === 'cleared') {
    record.clears += 1;
    save.clears += 1;
    if (Number.isFinite(time) && time > 0 && (record.bestTime === null || time < record.bestTime)) record.bestTime = time;
    if (Number.isFinite(time) && time > 0 && (save.bestTime === null || time < save.bestTime)) save.bestTime = time;
  } else {
    record.deaths += 1;
    save.deaths += 1;
  }
  save.sites[siteId] = record;
  const unlocked = award3DHorrorAchievements(save);
  return { ok: true, record: { ...record }, unlocked, phase };
}

export function horror3DSummary(save = default3DHorrorSave()) {
  const sites = HORROR3D_SITES.map((entry) => {
    const record = save.sites[entry.id] || null;
    return {
      id: entry.id,
      name: entry.name,
      level: entry.level,
      difficulty: entry.difficulty,
      attempts: record?.attempts || 0,
      clears: record?.clears || 0,
      deaths: record?.deaths || 0,
      scares: record?.scares || 0,
      bestTime: record?.bestTime ?? null,
      cleared: (record?.clears || 0) > 0,
    };
  });
  return {
    sites,
    totalSites: sites.length,
    clearedSites: sites.filter((entry) => entry.cleared).length,
    runs: save.runs,
    clears: save.clears,
    deaths: save.deaths,
    scares: save.scares,
    bestTime: save.bestTime,
    achievements: save.achievements.length,
    totalAchievements: HORROR3D_ACHIEVEMENTS.length,
  };
}
