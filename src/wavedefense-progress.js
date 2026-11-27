export const WAVE_DEFENSE_TOTAL_WAVES = 24;
export const WAVE_DEFENSE_ENDLESS_WAVES = 999;
export const WAVE_DEFENSE_INFINITOWER_TIER_WAVES = 10;

const asNumber = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

export const WAVE_DEFENSE_MAP_BLUEPRINTS = [
  {
    id: 'ashen_keep',
    name: 'ASHEN KEEP',
    subtitle: 'Benteng Terakhir',
    lore: 'Jalan batu tua berkelok menuju gerbang utama. Dua belas menara pertama menemukan rumahnya di sini.',
    theme: { ground: '#101412', earth: '#31291e', path: '#52402b', edge: '#0b0d0c', accent: '#d8ac67', mist: '#6b7b6a' },
    castle: { x: 895, y: 270 },
    path: [
      { x: -30, y: 270 }, { x: 126, y: 270 }, { x: 126, y: 112 }, { x: 306, y: 112 },
      { x: 306, y: 426 }, { x: 522, y: 426 }, { x: 522, y: 184 }, { x: 714, y: 184 },
      { x: 714, y: 334 }, { x: 846, y: 334 },
    ],
  },
  {
    id: 'ember_bastion',
    name: 'EMBER BASTION',
    subtitle: 'Benteng Api',
    lore: 'Parit bara dan jalan sempit memaksa musuh melewati setiap menara dua kali.',
    theme: { ground: '#17100d', earth: '#3e2418', path: '#65402a', edge: '#100907', accent: '#f09a55', mist: '#8f5b38' },
    castle: { x: 892, y: 250 },
    path: [
      { x: -30, y: 118 }, { x: 186, y: 118 }, { x: 186, y: 430 }, { x: 388, y: 430 },
      { x: 388, y: 164 }, { x: 590, y: 164 }, { x: 590, y: 446 }, { x: 786, y: 446 },
      { x: 786, y: 250 }, { x: 846, y: 250 },
    ],
  },
  {
    id: 'sunken_causeway',
    name: 'SUNKEN CAUSEWAY',
    subtitle: 'Jalan Karam',
    lore: 'Jalan tenggelam berkelok di antara menara tua; setiap tikungan menutup satu jalur pelarian.',
    theme: { ground: '#0c1416', earth: '#1e3336', path: '#3d5a5c', edge: '#070f11', accent: '#b6d9c4', mist: '#5f8a86' },
    castle: { x: 884, y: 300 },
    path: [
      { x: -30, y: 470 }, { x: 150, y: 470 }, { x: 150, y: 96 }, { x: 348, y: 96 },
      { x: 348, y: 300 }, { x: 520, y: 300 }, { x: 520, y: 470 }, { x: 704, y: 470 },
      { x: 704, y: 150 }, { x: 842, y: 150 }, { x: 842, y: 300 }, { x: 878, y: 300 },
    ],
  },
  {
    id: 'frostgate',
    name: 'FROSTGATE CITADEL',
    subtitle: 'Benteng Beku',
    lore: 'Tembok es menahan laju musuh, tetapi setiap lorong membuka jalan baru menuju mahkota.',
    theme: { ground: '#0b1318', earth: '#1d3038', path: '#36535d', edge: '#071014', accent: '#9fdef0', mist: '#6f9bae' },
    castle: { x: 890, y: 270 },
    path: [
      { x: -30, y: 432 }, { x: 148, y: 432 }, { x: 148, y: 162 }, { x: 326, y: 162 },
      { x: 326, y: 334 }, { x: 508, y: 334 }, { x: 508, y: 120 }, { x: 686, y: 120 },
      { x: 686, y: 402 }, { x: 826, y: 402 }, { x: 826, y: 270 }, { x: 852, y: 270 },
    ],
  },
  {
    id: 'eternal_spiral',
    name: 'ETERNAL SPIRAL',
    subtitle: 'Lingkar Tanpa Ujung',
    lore: 'Jalan memutar ke dalam tanpa ujung. Setiap sepuluh gelombang lingkar menebal; tidak ada kemenangan, hanya seberapa lama mahkota bertahan.',
    theme: { ground: '#0d0c15', earth: '#2a2340', path: '#4b3d66', edge: '#07060d', accent: '#c8a9ff', mist: '#77679f' },
    castle: { x: 620, y: 260 },
    path: [
      { x: -30, y: 80 }, { x: 840, y: 80 }, { x: 840, y: 460 }, { x: 110, y: 460 },
      { x: 110, y: 175 }, { x: 700, y: 175 }, { x: 700, y: 365 }, { x: 255, y: 365 },
      { x: 255, y: 260 }, { x: 620, y: 260 },
    ],
  },
];

// ── The Spiral Chronicle ───────────────────────────────────────────────────
// Infinitower is the only mode without a victory, so the story is told in
// tiers instead of chapters: every new tier opens one line of the chronicle.
export const SPIRAL_STORY = [
  { tier: 1, title: 'Lingkar Pertama', line: 'Setiap menara yang kau dirikan menulis satu baris di dinding lingkar.', boss: null },
  { tier: 2, title: 'Nyanyian di Bawah Lantai', line: 'Koor mulai bernyanyi, dan tubuh yang kau bunuh meminjam tubuh baru.', boss: 'spiral_tyrant' },
  { tier: 3, title: 'Ngengat Membawa Lentera', line: 'Cahaya kecil membutakan penjaga; lingkar belajar memadamkan matamu.', boss: 'spiral_choir' },
  { tier: 4, title: 'Pemungut dari Kubur', line: 'Mereka tidak hanya merusak gerbang — mereka menagih upah dari emasmu.', boss: 'lantern_devourer' },
  { tier: 5, title: 'Tingkat Tanpa Nama', line: 'Peta berhenti berarti. Hanya jalan, menara, dan napas yang tersisa.', boss: 'spiral_tyrant' },
  { tier: 6, title: 'Lingkar yang Menutup', line: 'Tidak ada puncak. Hanya kamu, malam, dan satu gelombang lagi.', boss: null },
];

export function spiralStoryForTier(tier) {
  const index = Math.min(SPIRAL_STORY.length - 1, Math.max(0, Math.floor(Number(tier) || 1) - 1));
  return SPIRAL_STORY[index];
}

export function defaultWaveDefenseProgress() {
  return {
    version: 1,
    runs: 0,
    wins: 0,
    losses: 0,
    bestWave: 0,
    bestScore: 0,
    bestTime: 0,
    totalKills: 0,
    totalLeaks: 0,
    towersBuilt: 0,
    maps: {},
    endless: { runs: 0, bestWave: 0, bestScore: 0, bestKills: 0, bestTime: 0 },
    infinitower: { runs: 0, bestWave: 0, bestTier: 0, bestScore: 0, bestKills: 0, bestTime: 0 },
  };
}

export function sanitizeWaveDefenseProgress(raw) {
  const base = defaultWaveDefenseProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const safe = (value, cap = 1e9) => Math.max(0, Math.min(cap, Math.floor(asNumber(value, 0))));
  const endlessRaw = raw.endless && typeof raw.endless === 'object' && !Array.isArray(raw.endless) ? raw.endless : {};
  const endless = {
    runs: safe(endlessRaw.runs),
    bestWave: Math.min(WAVE_DEFENSE_ENDLESS_WAVES, safe(endlessRaw.bestWave)),
    bestScore: safe(endlessRaw.bestScore),
    bestKills: safe(endlessRaw.bestKills),
    bestTime: Math.max(0, Math.min(86400, asNumber(endlessRaw.bestTime, 0))),
  };
  const towerRaw = raw.infinitower && typeof raw.infinitower === 'object' && !Array.isArray(raw.infinitower) ? raw.infinitower : {};
  const infinitower = {
    runs: safe(towerRaw.runs),
    bestWave: Math.min(WAVE_DEFENSE_ENDLESS_WAVES, safe(towerRaw.bestWave)),
    bestTier: Math.min(Math.ceil(WAVE_DEFENSE_ENDLESS_WAVES / WAVE_DEFENSE_INFINITOWER_TIER_WAVES), safe(towerRaw.bestTier)),
    bestScore: safe(towerRaw.bestScore),
    bestKills: safe(towerRaw.bestKills),
    bestTime: Math.max(0, Math.min(86400, asNumber(towerRaw.bestTime, 0))),
  };
  const maps = {};
  if (raw.maps && typeof raw.maps === 'object') {
    for (const map of WAVE_DEFENSE_MAP_BLUEPRINTS) {
      const entry = raw.maps[map.id];
      if (!entry || typeof entry !== 'object') continue;
      maps[map.id] = {
        runs: safe(entry.runs),
        wins: safe(entry.wins),
        bestWave: Math.min(WAVE_DEFENSE_TOTAL_WAVES, safe(entry.bestWave)),
        bestScore: safe(entry.bestScore),
      };
    }
  }
  return {
    ...base,
    ...raw,
    version: 1,
    runs: safe(raw.runs),
    wins: safe(raw.wins),
    losses: safe(raw.losses),
    bestWave: Math.min(WAVE_DEFENSE_TOTAL_WAVES, safe(raw.bestWave)),
    bestScore: safe(raw.bestScore),
    bestTime: Math.max(0, Math.min(86400, asNumber(raw.bestTime, 0))),
    totalKills: safe(raw.totalKills),
    totalLeaks: safe(raw.totalLeaks),
    towersBuilt: safe(raw.towersBuilt),
    maps,
    endless,
    infinitower,
  };
}
