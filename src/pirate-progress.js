const num = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

// ── Stages: one continuous sea, ten captain hunts over two acts ────────────
export const PIRATE_STAGES = [
  {
    id: 'first_tide', index: 0, name: 'Pasang Pertama', subtitle: 'PELABUHAN ABU',
    desc: 'Cari empat perompak di perairan pelabuhan, lalu tenggelamkan Kapten Morrow.',
    targetKills: 4, bossId: 'captain_morrow', gold: 120, score: 900,
    start: { x: 690, y: 1320, angle: -Math.PI / 2 },
  },
  {
    id: 'bell_below', index: 1, name: 'Lonceng di Bawah', subtitle: 'KARANG LENTERA',
    desc: 'Lonceng kapal hantu memanggil armada. Sunyi lima kapal sebelum ia menjawab.',
    targetKills: 5, bossId: 'the_tolling_bell', gold: 170, score: 1400,
    start: { x: 1560, y: 550, angle: -Math.PI / 2 },
  },
  {
    id: 'widow_wake', index: 2, name: 'Bangun Janda', subtitle: 'KARANG JANDA',
    desc: 'Karang Janda menguasai jalur dagang. Hancurkan enam pengawal dan ratunya.',
    targetKills: 6, bossId: 'widow_reef', gold: 230, score: 2000,
    start: { x: 1990, y: 1040, angle: -Math.PI / 2 },
  },
  {
    id: 'iron_tide', index: 3, name: 'Pasang Baja', subtitle: 'TANGGA TENGGELAM',
    desc: 'Laksamana Vane mengirim fregat pemburu. Tujuh kapal harus jatuh sebelum benderanya.',
    targetKills: 7, bossId: 'admiral_vane', gold: 310, score: 2800,
    start: { x: 2600, y: 680, angle: -Math.PI / 2 },
  },
  {
    id: 'drowned_crown', index: 4, name: 'Mahkota Tenggelam', subtitle: 'LENTERA TERAKHIR',
    desc: 'Raja Tenggelam bangkit di bawah lentera terakhir. Delapan kapal, satu mahkota.',
    targetKills: 8, bossId: 'the_drowned_king', gold: 420, score: 3800,
    start: { x: 2350, y: 1450, angle: -Math.PI / 2 },
  },
  {
    id: 'mist_hunt', index: 5, name: 'Perburuan Kabut', subtitle: 'GOSONG BARA',
    desc: 'Heron mengintai dari kabut gosong. Sembilan kapal harus jatuh sebelum pemburu itu sendiri.',
    targetKills: 9, bossId: 'captain_heron', gold: 510, score: 4600,
    start: { x: 760, y: 760, angle: -Math.PI / 2 },
  },
  {
    id: 'hollow_tide', index: 6, name: 'Pasang Kosong', subtitle: 'PULAU DUKA',
    desc: 'Armada tanpa pelaut berlayar menuju Pulau Duka. Sepuluh lambung, satu paduan suara.',
    targetKills: 10, bossId: 'the_hollow_tide', gold: 600, score: 5400,
    start: { x: 2000, y: 1250, angle: -Math.PI / 2 },
  },
  {
    id: 'salt_throne', index: 7, name: 'Takhta Garam', subtitle: 'KARANG BINTANG JATUH',
    desc: 'Ratu Garam menagih takhta karang. Sebelas kapal dan satu mahkota asin.',
    targetKills: 11, bossId: 'salt_queen', gold: 700, score: 6300,
    start: { x: 2680, y: 1250, angle: -Math.PI / 2 },
  },
  {
    id: 'iron_escort', index: 8, name: 'Kawal Baja', subtitle: 'TANGGA TENGGELAM',
    desc: 'Marsekal Kade mengawal konvoi terakhir. Dua belas lambung harus pecah.',
    targetKills: 12, bossId: 'marshal_kade', gold: 810, score: 7300,
    start: { x: 1800, y: 1850, angle: -Math.PI / 2 },
  },
  {
    id: 'first_vow', index: 9, name: 'Sumpah Pertama', subtitle: 'PUSARAN LAUT',
    desc: 'Kapten Pertama bangkit dari pusaran. Tiga belas kapal, lalu sumpah laut berakhir.',
    targetKills: 13, bossId: 'the_first_captain', gold: 950, score: 8600,
    start: { x: 1500, y: 900, angle: -Math.PI / 2 },
  },
];

export const PIRATE_STAGE_BY_ID = Object.fromEntries(PIRATE_STAGES.map((stage) => [stage.id, stage]));

// ── Progress ───────────────────────────────────────────────────────────────
export function defaultPirateProgress() {
  return {
    version: 1,
    voyages: 0,
    wins: 0,
    losses: 0,
    totalKills: 0,
    totalGold: 0,
    totalShots: 0,
    totalHits: 0,
    bestScore: 0,
    stages: {},
    endless: { runs: 0, bestScore: 0, bestSurge: 0, bestKills: 0, bestTime: 0, totalKills: 0 },
  };
}

export function sanitizePirateProgress(raw) {
  const base = defaultPirateProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const safe = (value, cap = 1e9) => Math.max(0, Math.min(cap, Math.floor(num(value))));
  const stages = {};
  for (const stage of PIRATE_STAGES) {
    const entry = raw.stages?.[stage.id];
    if (!entry || typeof entry !== 'object') continue;
    stages[stage.id] = {
      runs: safe(entry.runs),
      cleared: !!entry.cleared,
      bestScore: safe(entry.bestScore),
      bestTime: Math.max(0, Math.min(86400, num(entry.bestTime))),
    };
  }
  // A later stage cannot be cleared while its predecessor is not.
  for (let i = 1; i < PIRATE_STAGES.length; i += 1) {
    if (stages[PIRATE_STAGES[i].id]?.cleared && !stages[PIRATE_STAGES[i - 1].id]?.cleared) {
      stages[PIRATE_STAGES[i].id].cleared = false;
    }
  }
  const totalShots = safe(raw.totalShots);
  const endlessRaw = raw.endless && typeof raw.endless === 'object' && !Array.isArray(raw.endless) ? raw.endless : {};
  const endless = {
    runs: safe(endlessRaw.runs),
    bestScore: safe(endlessRaw.bestScore),
    bestSurge: Math.min(999, safe(endlessRaw.bestSurge)),
    bestKills: safe(endlessRaw.bestKills),
    bestTime: Math.max(0, Math.min(86400, num(endlessRaw.bestTime))),
    totalKills: safe(endlessRaw.totalKills),
  };
  return {
    ...base,
    ...raw,
    version: 1,
    voyages: safe(raw.voyages),
    wins: safe(raw.wins),
    losses: safe(raw.losses),
    totalKills: safe(raw.totalKills),
    totalGold: safe(raw.totalGold),
    totalShots,
    totalHits: Math.min(totalShots, safe(raw.totalHits)),
    bestScore: safe(raw.bestScore),
    stages,
    endless,
  };
}
