// Ashen Vow — arc credit scenes.
//
// A credit scene is opened after the final boss of each campaign arc dies.
// The static Credits screen remains the canonical record; this module only
// drives the in-run scene and its exact role list.

export const CREDIT_SCENE_DELAY_MS = 2400;
export const CREDIT_SCENE_AUTO_CLOSE_MS = 22000;
export const CREDIT_SCENE_FOOTER = 'Made by SealiusHQ with a lot of support from Contributors';

export const CREDIT_ROLES = [
  { role: 'Technical Lead', name: 'Sealius' },
  { role: 'Artist & Designer', name: 'Sealius' },
  { role: 'Game Design', name: 'Sealius' },
  { role: 'Systems & Engineering', name: 'Sealius' },
  { role: 'World & Narrative', name: 'Sealius' },
  { role: 'UI & UX Design', name: 'Sealius' },
  { role: 'QA & Verification', name: 'Sealius' },
  { role: 'Release & Support', name: 'Sealius' },
];

export const CREDIT_ARCS = [
  {
    id: 'arc1',
    numeral: 'ARC I',
    title: 'THE ASHEN VOW',
    subtitle: 'Sumpah yang dibawa pulang dari puncak.',
    bosses: { legacy: ['oathbreaker'], speedrun: ['oathbreaker'] },
    line: 'The Oathbreaker gugur. Abu pertama akhirnya punya nama.',
  },
  {
    id: 'echoes',
    numeral: 'ARC ECHOES',
    title: 'ECHOES OF THE FORGOTTEN WORLD',
    subtitle: 'Seratus level, sepuluh bab, satu nama yang diingat.',
    bosses: { expansion: ['echo_boss_10'] },
    line: 'Yang Terlupakan gugur. Gema terakhir tidak lagi sendirian.',
  },
  {
    id: 'faewood',
    numeral: 'TAMAN PERI',
    title: 'FAEWOOD',
    subtitle: 'Sayap spektral, langit yang retak, dan raja iblis yang jatuh.',
    bosses: { fairy: ['dragon'] },
    line: 'Sylvara dan Vharos gugur. Kerajaan Opus bebas.',
  },
  {
    id: 'fallen',
    numeral: 'ARC II',
    title: 'THE FALLEN ONES',
    subtitle: 'Langit yang tidak pernah berhenti memanggil.',
    bosses: { fallen: ['fallen_seraphiel'] },
    line: 'Seraphiel jatuh dari singgasananya. Tiga jalan menunggu.',
  },
  {
    id: 'crusade',
    numeral: 'ARC III',
    title: 'THE RADIANT CRUSADE',
    subtitle: 'Zirah kosong di Gerbang Penghakiman.',
    bosses: { crusade: ['crusade_giant_paladin'] },
    line: 'Paladin Templar gugur. Celah di langit terbuka.',
  },
  {
    id: 'rift',
    numeral: 'ARC IV',
    title: 'THE RIFT',
    subtitle: 'Jahitan di antara dua kenyataan.',
    bosses: { rift: ['rift_devilish_scum'] },
    line: 'The Devilish Scum tumbang. Kedua kenyataan kembali bernapas.',
  },
  {
    id: 'astral',
    numeral: 'ARC VI',
    title: 'THE ASTRAL DOMINION',
    subtitle: 'Tahta di antara bintang dan kehampaan.',
    bosses: { astral: ['astral_architect_of_eternity'] },
    line: 'The Architect of Eternity gugur. Dominion berpindah tangan.',
  },
  {
    id: 'eclipse',
    numeral: 'ARC VIII',
    title: 'ECLIPSE OF THE FORGOTTEN GODS',
    subtitle: 'Nama di balik segel, dan tangan yang menulis hukum.',
    bosses: { eclipse: ['eclipse_forgotten_high_god', 'eclipse_first_author'] },
    line: 'Dewa Tinggi yang Terlupakan gugur. Gerhana akhirnya punya saksi.',
  },
  {
    id: 'veil',
    numeral: 'ARC IX',
    title: 'THE VEIL OF THE FORGOTTEN',
    subtitle: 'Arsip yang menulis ulang dirinya sendiri.',
    bosses: { veil: ['veil_architect'] },
    line: 'Arsitek Tabir gugur. Halaman terakhir akhirnya ditulis.',
  },
  {
    id: 'eternal',
    numeral: 'ARC X',
    title: 'THE ETERNAL NIGHT',
    subtitle: 'Malam pertama, dan nama yang tidak boleh dilupakan.',
    bosses: { eternal: ['first_forgotten'] },
    line: 'The First Forgotten gugur. Fajar tidak lagi meminta izin.',
  },
  {
    id: 'atlas',
    numeral: 'THE SUNDERED ATLAS',
    title: 'ATLAS YANG TERBELAH',
    subtitle: 'Delapan wilayah, satu halaman terakhir.',
    bosses: { atlas: ['atlas_boss_foundry'] },
    line: 'The Prime Engine padam. Atlas menutup halaman terakhirnya.',
  },
  {
    id: 'hearthfall',
    numeral: 'HEARTHFALL',
    title: 'THE HOLLOW COURT',
    subtitle: 'Sumpah pertama di bawah Opus.',
    bosses: { court: ['court_boss_firstvow'] },
    line: 'The First Vow gugur. Perapian Agung menyala kembali.',
  },
];

export const CREDIT_ARC_BY_ID = Object.fromEntries(CREDIT_ARCS.map((arc) => [arc.id, arc]));

export function creditArcFor(runKind, bossKind) {
  if (!runKind || !bossKind) return null;
  return CREDIT_ARCS.find((arc) => (arc.bosses[runKind] || []).includes(bossKind)) || null;
}

export function creditSceneFor(arcId) {
  const arc = CREDIT_ARC_BY_ID[arcId];
  if (!arc) return null;
  return {
    ...arc,
    roles: CREDIT_ROLES.map((entry) => ({ ...entry })),
    footer: CREDIT_SCENE_FOOTER,
  };
}

export function isArcFinalBoss(runKind, bossKind) {
  return !!creditArcFor(runKind, bossKind);
}
