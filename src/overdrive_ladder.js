// Ashen Vow — Phase 2 Release 2: Overdrive (The Eternal Realm), Lv 201–300 playable.
//
// `src/overdrive.js` defines the 10 chapters (21–30), 100 level specs, 8 spell
// schools, 8 legendary weapons, 50 enemies, 6 special level types and 6 roaming
// bosses. This module turns those tables into 100 real playable rooms appended
// at ids 774–873 without renumbering any existing room (0–773).
//
// Pure: no DOM, no storage, no canvas.

import {
  OVERDRIVE_CHAPTERS,
  OVERDRIVE_LEVEL_SPECS,
  OVERDRIVE_SPECIAL_LEVEL_TYPES,
  OVERDRIVE_ENEMIES,
  LEGENDARY_WEAPONS,
  SPELL_SCHOOLS,
  BACKGROUND_BOSSES,
  defaultOverdriveProgress,
  sanitizeOverdriveProgress,
} from './overdrive.js';

export const OVERDRIVE_LADDER_VERSION = 1;
export const OVERDRIVE_NAME = 'Overdrive: The Eternal Realm';
export const OVERDRIVE_LOCAL_NAME = 'Overdrive · Alam Abadi';
export const OVERDRIVE_GLOBAL_START = 774;
export const OVERDRIVE_LEVEL_COUNT = 100;
export const OVERDRIVE_CHAPTER_COUNT = 10;
export const OVERDRIVE_ROOMS_PER_CHAPTER = 10;
export const OVERDRIVE_ENEMIES_PER_ROOM = 20;
export const OVERDRIVE_ELITE_COUNT = 1;
export const OVERDRIVE_FLOOR_Y = 470;
export const OVERDRIVE_WORLD_W = 1400;
export const OVERDRIVE_ZONE_ID = 'overdrive';
export const OVERDRIVE_FIRST_LEVEL = 201;
export const OVERDRIVE_LAST_LEVEL = 300;
export const OVERDRIVE_LAST_BOSS = 'the_first_god';

const PALETTES = {
  21: { top: '#04121b', mid: '#092435', low: '#0e374e', glow: '#38bdf8', fog: '#144963' },
  22: { top: '#12081f', mid: '#21103a', low: '#341a59', glow: '#c084fc', fog: '#482475' },
  23: { top: '#180705', mid: '#32100a', low: '#4c1a0e', glow: '#f87171', fog: '#662414' },
  24: { top: '#06140c', mid: '#0e2b19', low: '#154226', glow: '#4ade80', fog: '#1e5734' },
  25: { top: '#0a081a', mid: '#151238', low: '#211c56', glow: '#818cf8', fog: '#2d2670' },
  26: { top: '#06131c', mid: '#0e2738', low: '#163d56', glow: '#67e8f9', fog: '#1f506e' },
  27: { top: '#171106', mid: '#2d210b', low: '#453212', glow: '#fbbf24', fog: '#5c4319' },
  28: { top: '#0b0512', mid: '#180c28', low: '#27123f', glow: '#a855f7', fog: '#371b57' },
  29: { top: '#1a1107', mid: '#32220d', low: '#4b3314', glow: '#f59e0b', fog: '#63441d' },
  30: { top: '#170712', mid: '#2d0c23', low: '#461237', glow: '#fb7185', fog: '#5e1a4a' },
};

const PARTICLES = {
  21: 'bubbles',
  22: 'shards',
  23: 'embers',
  24: 'spores',
  25: 'stars',
  26: 'snow',
  27: 'gears',
  28: 'stars',
  29: 'mist',
  30: 'embers',
};

const SUBTYPE_BEHAVIOR = {
  Scout: 'chaser',
  Sorcerer: 'ranged',
  Assassin: 'lunge',
  Brute: 'slam',
  Guardian: 'slam',
};

// ── 50 Overdrive normal & guardian enemy bodies ────────────────────────────
export const OVERDRIVE_ENEMY_INFO = Object.fromEntries(
  OVERDRIVE_ENEMIES.map((enemy, idx) => {
    const chapter = OVERDRIVE_CHAPTERS[Math.floor(idx / 5)] || OVERDRIVE_CHAPTERS[0];
    const isGuardian = enemy.type === 'Guardian';
    return [
      `ovd_${enemy.id}`,
      {
        baseId: enemy.id,
        name: enemy.name,
        title: `${chapter.name} · ${enemy.type}`,
        hp: enemy.hp,
        dmg: enemy.dmg,
        speed: isGuardian ? 74 : Math.max(66, enemy.speed),
        w: isGuardian ? 58 : enemy.type === 'Brute' ? 54 : 42,
        h: isGuardian ? 68 : enemy.type === 'Brute' ? 58 : 46,
        reward: Math.max(22, Math.round(enemy.xp * 0.25)),
        behavior: SUBTYPE_BEHAVIOR[enemy.type] || 'chaser',
        danger: isGuardian ? 'ELITE' : enemy.type === 'Brute' ? 'TINGGI' : 'SEDANG',
        desc: `${enemy.name} menjaga ${chapter.name}: ancaman ${chapter.biome}.`,
        where: `${chapter.name} · ${chapter.biome}`,
        overdrive: true,
        chapter: chapter.number,
      },
    ];
  }),
);

// ── 10 playable chapter bosses (Ch. 21–30) ─────────────────────────────────
export const OVERDRIVE_BOSS_INFO = {
  sunken_emperor: {
    name: 'The Sunken Emperor',
    title: 'Monarch of the Drowned Capital',
    maxHp: 4600,
    w: 132,
    h: 138,
    contact: 32,
    ashReward: 820,
    reward: 'boss',
    music: 'overdriveBoss',
    color: '#38bdf8',
    maxPhases: 3,
    phaseThresholds: [0.66, 0.33],
    pattern: 'charge',
    spawn: { x: 720, y: OVERDRIVE_FLOOR_Y - 138 },
    dialogue: {
      intro: [
        { speaker: 'Sunken Emperor', text: 'Ibu kota tidak tenggelam karena kalah perang. Ia memilih menutup pintu dari daratan.' },
        { speaker: 'Sunken Emperor', text: 'Bawa pedang keringmu kemari, Penjaga. Di bawah air semua api berkarat.' },
      ],
      phase2: [
        { speaker: 'Sunken Emperor', text: 'Arus pasang naik. Setiap pijakan yang kau kenal baru saja pindah kedalaman.' },
      ],
      phase3: [
        { speaker: 'Sunken Emperor', text: 'Mahkota ini lebih berat dari lautnya sendiri. Bertahanlah jika lututmu masih sanggup.' },
      ],
      defeat: [
        { speaker: 'Sunken Emperor', text: 'Air surut untuk pertama kalinya... jalan menuju kristal di bawah terbuka.' },
      ],
    },
  },
  prism_devourer: {
    name: 'The Prism Devourer',
    title: 'Swallower of Crystalheart Light',
    maxHp: 5100,
    w: 126,
    h: 126,
    contact: 34,
    ashReward: 880,
    reward: 'boss',
    music: 'overdriveBoss',
    color: '#c084fc',
    maxPhases: 4,
    phaseThresholds: [0.75, 0.5, 0.25],
    pattern: 'ring',
    flying: true,
    spawn: { x: 700, y: 168 },
    dialogue: {
      intro: [
        { speaker: 'Prism Devourer', text: 'Setiap sinar yang jatuh di gua ini terpecah menjadi tujuh ujung tajam.' },
        { speaker: 'Prism Devourer', text: 'Bayanganmu baru saja masuk ke dalam permukaan kacaku.' },
      ],
      phase2: [
        { speaker: 'Prism Devourer', text: 'Lihat tujuh cermin itu? Hanya satu yang berdarah ketika kau tebas.' },
      ],
      phase3: [
        { speaker: 'Prism Devourer', text: 'Resonansi meningkat. Dinding kristal ikut bergetar membawa namamu.' },
      ],
      phase4: [
        { speaker: 'Prism Devourer', text: 'Serpihan terakhir adalah yang paling menyilaukan. Tutup matamu atau pecah bersamaku.' },
      ],
      defeat: [
        { speaker: 'Prism Devourer', text: 'Cahaya menyatu kembali... ruang penempaan menyala di bawah kakimu.' },
      ],
    },
  },
  forge_titan: {
    name: 'The Forge Titan',
    title: 'Heart of the Infernal Foundry',
    maxHp: 5600,
    w: 160,
    h: 152,
    contact: 36,
    ashReward: 940,
    reward: 'boss',
    music: 'overdriveBoss',
    color: '#f87171',
    maxPhases: 4,
    phaseThresholds: [0.75, 0.5, 0.25],
    pattern: 'slam',
    spawn: { x: 700, y: OVERDRIVE_FLOOR_Y - 152 },
    dialogue: {
      intro: [
        { speaker: 'Forge Titan', text: 'Tungku ini belum padam selama empat abad. Besi tua dan baja baru sama-sama cair di tanganku.' },
      ],
      phase2: [
        { speaker: 'Forge Titan', text: 'Tekanan uap dibuka! Lantai sekarang ikut menimbang berat zirahmu.' },
      ],
      phase3: [
        { speaker: 'Forge Titan', text: 'Palu ketiga tidak pernah meleset dari paron. Berlari hanya menunda bunyinya.' },
      ],
      phase4: [
        { speaker: 'Forge Titan', text: 'Inti tungku retak—baiklah, mari kita tempa ulang siapa pun yang tersisa!' },
      ],
      defeat: [
        { speaker: 'Forge Titan', text: 'Bara mendingin... hanya abu tempaan sejati yang lolos dari tungku.' },
      ],
    },
  },
  mother_of_thorns: {
    name: 'The Mother of Thorns',
    title: 'Warden of the Verdant Grave',
    maxHp: 6000,
    w: 138,
    h: 146,
    contact: 36,
    ashReward: 1020,
    reward: 'boss',
    music: 'overdriveBoss',
    color: '#4ade80',
    maxPhases: 4,
    phaseThresholds: [0.75, 0.5, 0.25],
    pattern: 'summon',
    summonType: 'ovd_briar_scout',
    spawn: { x: 710, y: OVERDRIVE_FLOOR_Y - 146 },
    dialogue: {
      intro: [
        { speaker: 'Mother of Thorns', text: 'Akar tidak membenci tulang; ia hanya memberinya guna baru di bawah tanah.' },
      ],
      phase2: [
        { speaker: 'Mother of Thorns', text: 'Spora pertama mekar. Hirup dalam-dalam dan biarkan langkahmu melambat.' },
      ],
      phase3: [
        { speaker: 'Mother of Thorns', text: 'Anak-anak duri mendengar getaran bajamu dari balik nisan.' },
      ],
      phase4: [
        { speaker: 'Mother of Thorns', text: 'Bunga terakhir hanya mekar sekali—tepat di atas jantung yang menolak tunduk.' },
      ],
      defeat: [
        { speaker: 'Mother of Thorns', text: 'Duri mengering... bawa benih bersih itu ke menara bintang.' },
      ],
    },
  },
  starbound_regent: {
    name: 'The Starbound Regent',
    title: 'Navigator of the Astral Citadel',
    maxHp: 6500,
    w: 128,
    h: 138,
    contact: 38,
    ashReward: 1100,
    reward: 'boss',
    music: 'overdriveBoss',
    color: '#818cf8',
    maxPhases: 4,
    phaseThresholds: [0.75, 0.5, 0.25],
    pattern: 'volley',
    flying: true,
    spawn: { x: 700, y: 165 },
    dialogue: {
      intro: [
        { speaker: 'Starbound Regent', text: 'Di ketinggian ini tidak ada utara atau selatan; hanya garis orbit yang memotongmu.' },
      ],
      phase2: [
        { speaker: 'Starbound Regent', text: 'Komet kedua masuk lintasan. Perhatikan langit sebelum memandang kakiku.' },
      ],
      phase3: [
        { speaker: 'Starbound Regent', text: 'Gravitasi benteng dibalik. Lompatmu baru saja berubah arah.' },
      ],
      phase4: [
        { speaker: 'Starbound Regent', text: 'Konstelasi penuh menuntut satu sumpah bintang terakhir.' },
      ],
      defeat: [
        { speaker: 'Starbound Regent', text: 'Orbitku berhenti... embun beku kerajaan utara sudah menunggumu.' },
      ],
    },
  },
  pale_frost_monarch: {
    name: 'The Pale Frost Monarch',
    title: 'Sovereign of the Frozen Dominion',
    maxHp: 7000,
    w: 142,
    h: 148,
    contact: 40,
    ashReward: 1180,
    reward: 'boss',
    music: 'overdriveBoss',
    color: '#67e8f9',
    maxPhases: 4,
    phaseThresholds: [0.75, 0.5, 0.25],
    pattern: 'rain',
    spawn: { x: 710, y: OVERDRIVE_FLOOR_Y - 148 },
    dialogue: {
      intro: [
        { speaker: 'Frost Monarch', text: 'Dingin ini tidak membunuh dengan cepat. Ia hanya membuatmu lupa alasanmu membawa api.' },
      ],
      phase2: [
        { speaker: 'Frost Monarch', text: 'Badai salju menutup gerbang pulang. Hanya pertarungan ini yang tetap hangat.' },
      ],
      phase3: [
        { speaker: 'Frost Monarch', text: 'Es purba retak menjadi tombak. Melangkah berarti memilih luka.' },
      ],
      phase4: [
        { speaker: 'Frost Monarch', text: 'Musim dingin abadi menuntut satu saksi yang tidak membeku.' },
      ],
      defeat: [
        { speaker: 'Frost Monarch', text: 'Es mencair di sekitar pedangmu... roda jam kuningan terdengar berputar lagi.' },
      ],
    },
  },
  grand_horologist: {
    name: 'The Grand Horologist',
    title: 'Keeper of the Clockwork Expanse',
    maxHp: 7500,
    w: 140,
    h: 146,
    contact: 42,
    ashReward: 1260,
    reward: 'boss',
    music: 'overdriveBoss',
    color: '#fbbf24',
    maxPhases: 4,
    phaseThresholds: [0.75, 0.5, 0.25],
    pattern: 'ring',
    spawn: { x: 700, y: OVERDRIVE_FLOOR_Y - 146 },
    dialogue: {
      intro: [
        { speaker: 'Grand Horologist', text: 'Setiap ayunan pendulum adalah satu kesempatan yang sudah lewat sebelum kau menyadarinya.' },
      ],
      phase2: [
        { speaker: 'Grand Horologist', text: 'Roda gigi kedua dipercepat. Hitungan mundur tidak menunggu kesembuhanmu.' },
      ],
      phase3: [
        { speaker: 'Grand Horologist', text: 'Kita baru saja mengulang detik yang sama—kali ini aku yang memukul duluan.' },
      ],
      phase4: [
        { speaker: 'Grand Horologist', text: 'Detik terakhir sebelum waktu patah. Patahkan pegas utamaku jika berani.' },
      ],
      defeat: [
        { speaker: 'Grand Horologist', text: 'Pendulum berhenti tepat di tengah... hanya kekosongan yang menanti di balik pintu.' },
      ],
    },
  },
  the_unmade: {
    name: 'The Unmade',
    title: 'Echo of the Shattered Void',
    maxHp: 8100,
    w: 144,
    h: 152,
    contact: 44,
    ashReward: 1380,
    reward: 'boss',
    music: 'overdriveBoss',
    color: '#a855f7',
    maxPhases: 5,
    phaseThresholds: [0.8, 0.6, 0.4, 0.2],
    pattern: 'summon',
    summonType: 'ovd_void_assassin',
    spawn: { x: 700, y: OVERDRIVE_FLOOR_Y - 152 },
    dialogue: {
      intro: [
        { speaker: 'The Unmade', text: 'Namaku dihapus dari prasasti sebelum raja pertamamu dilahirkan.' },
      ],
      phase2: [
        { speaker: 'The Unmade', text: 'Hukum ruang terlipat. Panah dan tebasan melewati tempat yang tidak ada.' },
      ],
      phase3: [
        { speaker: 'The Unmade', text: 'Setiap bayanganmu yang mati melahirkan bentuk baru dari ketiadaan.' },
      ],
      phase4: [
        { speaker: 'The Unmade', text: 'Celah anti-materi melebar. Kau berdiri di garis tipis antara ada dan dilupakan.' },
      ],
      phase5: [
        { speaker: 'The Unmade', text: 'Buktikan bahwa sumpah tetap punya bentuk ketika segala nama dihancurkan!' },
      ],
      defeat: [
        { speaker: 'The Unmade', text: 'Ketiadaan retak oleh langkah manusia... gurun kaca kuno membuka gerbangnya.' },
      ],
    },
  },
  sandstorm_sovereign: {
    name: 'The Sandstorm Sovereign',
    title: 'Pharaoh of the Sunken Sands',
    maxHp: 8600,
    w: 146,
    h: 150,
    contact: 46,
    ashReward: 1500,
    reward: 'boss',
    music: 'overdriveBoss',
    color: '#f59e0b',
    maxPhases: 5,
    phaseThresholds: [0.8, 0.6, 0.4, 0.2],
    pattern: 'charge',
    spawn: { x: 710, y: OVERDRIVE_FLOOR_Y - 150 },
    dialogue: {
      intro: [
        { speaker: 'Sandstorm Sovereign', text: 'Piramida ini tidak dibangun untuk melindungi mayat; ia mengunci badai di dalamnya.' },
      ],
      phase2: [
        { speaker: 'Sandstorm Sovereign', text: 'Pasir isap bangkit di bawah sepatu bajamu.' },
      ],
      phase3: [
        { speaker: 'Sandstorm Sovereign', text: 'Fatamorgana menjadi nyata. Dua tombak datang dari arah yang sama sekali berbeda.' },
      ],
      phase4: [
        { speaker: 'Sandstorm Sovereign', text: 'Badai pasir memuncak! Tidak ada tempat berteduh di ruang batu ini.' },
      ],
      phase5: [
        { speaker: 'Sandstorm Sovereign', text: 'Satu hantaman terakhir dari dinasti kaca—lewati aku menuju Panteon Pertama!' },
      ],
      defeat: [
        { speaker: 'Sandstorm Sovereign', text: 'Badai mereda menjadi kaca bening... takhta Sang Dewa Pertama terlihat di cakrawala.' },
      ],
    },
  },
  the_first_god: {
    name: 'The First God',
    title: 'Apex of the Final Pantheon',
    maxHp: 9600,
    w: 156,
    h: 168,
    contact: 50,
    ashReward: 2500,
    reward: 'victory',
    music: 'overdriveBoss',
    color: '#fb7185',
    maxPhases: 5,
    phaseThresholds: [0.8, 0.6, 0.4, 0.2],
    pattern: 'summon',
    summonType: 'ovd_pantheon_scout',
    spawn: { x: 700, y: OVERDRIVE_FLOOR_Y - 168 },
    dialogue: {
      intro: [
        { speaker: 'The First God', text: 'Dari lantai pertama sampai puncak ke-tiga ratus, kau menolak tunduk kepada penciptaan maupun abu.' },
        { speaker: 'The First God', text: 'Akulah percikan awal yang melahirkan setiap sumpah. Hadapi penghakiman terakhir.' },
      ],
      phase2: [
        { speaker: 'The First God', text: 'Bentuk kedua: cahaya yang menghukum setiap keraguan di langkahmu.' },
      ],
      phase3: [
        { speaker: 'The First God', text: 'Para pengawal Panteon turun menyertai penghakiman.' },
      ],
      phase4: [
        { speaker: 'The First God', text: 'Dinding kenyataan retak—hanya kehendakmu dan senjatamu yang tersisa di dunia ini.' },
      ],
      phase5: [
        { speaker: 'The First God', text: 'Tunjukkan apakah manusia sanggup mewarisi api penciptaan tanpa menjadi tiran baru!' },
      ],
      defeat: [
        { speaker: 'The First God', text: 'Percikan pertama beralih tangan. Overdrive selesai—dunia kini menulis babnya sendiri.' },
      ],
    },
  },
};

export function overdriveLevelScale(index) {
  const i = Math.max(0, Math.min(OVERDRIVE_LEVEL_COUNT - 1, Math.trunc(Number(index)) || 0));
  return 1 + i * 0.015;
}

export function overdriveDamageScale(index) {
  const i = Math.max(0, Math.min(OVERDRIVE_LEVEL_COUNT - 1, Math.trunc(Number(index)) || 0));
  return 1 + i * 0.008;
}

export function overdriveSpeedScale(index) {
  const i = Math.max(0, Math.min(OVERDRIVE_LEVEL_COUNT - 1, Math.trunc(Number(index)) || 0));
  return 1 + Math.floor(i / 20) * 0.06;
}

export function overdrivePlayerScale(index) {
  const i = Math.max(0, Math.min(OVERDRIVE_LEVEL_COUNT - 1, Math.trunc(Number(index)) || 0));
  return 2.6 + i * 0.025;
}

export function overdriveVitalityScale(index) {
  const i = Math.max(0, Math.min(OVERDRIVE_LEVEL_COUNT - 1, Math.trunc(Number(index)) || 0));
  return 1.9 + i * 0.015;
}

export function overdriveFlaskBonus(index) {
  const i = Math.max(0, Math.min(OVERDRIVE_LEVEL_COUNT - 1, Math.trunc(Number(index)) || 0));
  return 3 + Math.floor(i / 25);
}

export function overdriveAshStipend(index) {
  const i = Math.max(0, Math.min(OVERDRIVE_LEVEL_COUNT - 1, Math.trunc(Number(index)) || 0));
  return 520 + i * 8;
}

function floor(x, y, w, h) {
  return { x, y, w, h };
}

const LAYOUTS = [
  (boss) => (boss
    ? [floor(0, OVERDRIVE_FLOOR_Y, OVERDRIVE_WORLD_W, 70), floor(140, 344, 190, 18), floor(1070, 344, 190, 18), floor(580, 290, 240, 18)]
    : [floor(0, OVERDRIVE_FLOOR_Y, OVERDRIVE_WORLD_W, 70), floor(220, 366, 200, 18), floor(590, 310, 220, 18), floor(980, 366, 190, 18)]),
  (boss) => (boss
    ? [floor(0, OVERDRIVE_FLOOR_Y, OVERDRIVE_WORLD_W, 70), floor(110, 326, 210, 18), floor(1080, 326, 210, 18), floor(540, 260, 300, 18)]
    : [floor(0, OVERDRIVE_FLOOR_Y, 520, 70), floor(680, OVERDRIVE_FLOOR_Y, 720, 70), floor(530, 384, 130, 18), floor(830, 324, 210, 18), floor(1130, 386, 160, 18)]),
  (boss) => (boss
    ? [floor(0, OVERDRIVE_FLOOR_Y, OVERDRIVE_WORLD_W, 70), floor(290, 336, 180, 18), floor(930, 336, 180, 18), floor(620, 252, 180, 18)]
    : [floor(0, OVERDRIVE_FLOOR_Y, OVERDRIVE_WORLD_W, 70), floor(170, 336, 160, 18), floor(430, 268, 160, 18), floor(760, 318, 160, 18), floor(1080, 264, 160, 18)]),
];

function rosterFor(spec, index) {
  const familyIdx = spec.chapter - 21;
  const start = familyIdx * 5;
  const bodies = OVERDRIVE_ENEMIES.slice(start, start + 5).map((e) => `ovd_${e.id}`);
  const normals = bodies.slice(0, 4); // Scout (chaser), Brute (slam), Sorcerer (ranged), Assassin (lunge)
  const guardian = bodies[4];
  const counts = [6, 4, 5, 4]; // 19 normals + 1 Guardian elite = 20
  const hpScale = overdriveLevelScale(index);
  const dmgScale = overdriveDamageScale(index);
  const speedScale = overdriveSpeedScale(index);
  const out = [];
  let cursor = 0;
  counts.forEach((count, g) => {
    for (let i = 0; i < count; i += 1) {
      const step = (cursor * 149 + index * 197 + i * 59) % 980;
      const x = 190 + step;
      out.push({
        type: normals[g],
        x,
        minX: Math.max(120, x - 170),
        maxX: Math.min(OVERDRIVE_WORLD_W - 120, x + 170),
        hpScale: Math.round(hpScale * 100) / 100,
        dmgScale: Math.round(dmgScale * 100) / 100,
        speedScale: Math.round(speedScale * 100) / 100,
      });
      cursor += 1;
    }
  });
  const eliteX = 520 + ((index * 167) % 480);
  out.push({
    type: guardian,
    x: eliteX,
    minX: Math.max(300, eliteX - 240),
    maxX: Math.min(OVERDRIVE_WORLD_W - 120, eliteX + 240),
    elite: true,
    eliteRank: 'E7',
    hpScale: Math.round((1.35 + index * 0.008) * 100) / 100,
    dmgScale: Math.round((1.1 + index * 0.004) * 100) / 100,
  });
  return out;
}

export const OVERDRIVE_ROOMS = OVERDRIVE_LEVEL_SPECS.map((spec, index) => {
  const chapter = OVERDRIVE_CHAPTERS[spec.chapter - 21];
  const id = OVERDRIVE_GLOBAL_START + index;
  const isBoss = !!spec.boss;
  const last = spec.level === OVERDRIVE_LAST_LEVEL;
  const variant = isBoss ? null : OVERDRIVE_SPECIAL_LEVEL_TYPES[index % OVERDRIVE_SPECIAL_LEVEL_TYPES.length];
  const roaming = !isBoss && index % 15 === 7
    ? BACKGROUND_BOSSES[Math.floor(index / 15) % BACKGROUND_BOSSES.length]
    : null;
  const palette = PALETTES[spec.chapter] || PALETTES[21];
  const room = {
    id,
    overdrive: true,
    overdriveIndex: index,
    overdriveLevel: spec.level,
    overdriveChapter: spec.chapter,
    variant: variant?.id || null,
    variantName: variant?.name || null,
    roamingBoss: roaming?.id || null,
    name: spec.name,
    subtitle: `${chapter.name} · Lv ${spec.level}`,
    zone: OVERDRIVE_ZONE_ID,
    accent: palette.glow,
    palette: { ...palette },
    particle: PARTICLES[spec.chapter] || 'stars',
    music: 'overdrive',
    spawn: { x: 70, y: OVERDRIVE_FLOOR_Y - 46 },
    platforms: LAYOUTS[index % LAYOUTS.length](isBoss).map((p) => ({ ...p })),
    enemies: isBoss ? [] : rosterFor(spec, index),
    boss: isBoss ? chapter.bossId : null,
    hint: variant
      ? `[${variant.name}] ${variant.mechanic}. Tekan [Q] untuk melepas mantra!`
      : `Penjaga Bab ${chapter.number}: ${chapter.bossName}. Tekan [Q] untuk melepas mantra!`,
    gate: last ? null : {
      x: 1362,
      y: 286,
      w: 34,
      h: 184,
      requires: isBoss ? 'boss' : 'clear',
      next: id + 1,
      name: OVERDRIVE_LEVEL_SPECS[index + 1]?.name || 'The Eternal Realm',
    },
  };
  if (index % 5 === 0 || isBoss) {
    room.checkpoint = { x: 74, y: OVERDRIVE_FLOOR_Y - 78, w: 38, h: 78, name: 'Warung Abu' };
    room.merchant = { x: 152, y: OVERDRIVE_FLOOR_Y - 96, w: 46, h: 96 };
  }
  return room;
});

export const OVERDRIVE_ROOM_BY_ID = Object.fromEntries(OVERDRIVE_ROOMS.map((room) => [room.id, room]));

export const OVERDRIVE_CHAPTER_META = OVERDRIVE_CHAPTERS.map((chapter, chapterIndex) => {
  const rooms = OVERDRIVE_ROOMS.filter((room) => room.overdriveChapter === chapter.number);
  const palette = PALETTES[chapter.number] || PALETTES[21];
  return {
    number: chapter.number,
    id: chapter.id,
    name: chapter.name,
    color: palette.glow,
    biome: chapter.biome,
    hazards: chapter.hazards,
    lore: chapter.lore,
    bossId: chapter.bossId,
    bossName: OVERDRIVE_BOSS_INFO[chapter.bossId]?.name || chapter.bossName,
    bossPhases: OVERDRIVE_BOSS_INFO[chapter.bossId]?.maxPhases || 4,
    firstIndex: chapterIndex * OVERDRIVE_ROOMS_PER_CHAPTER,
    firstLevel: chapter.levelStart,
    lastLevel: chapter.levelEnd,
    firstRoom: rooms[0]?.id ?? null,
    lastRoom: rooms.at(-1)?.id ?? null,
    rooms: rooms.length,
    legendary: LEGENDARY_WEAPONS[chapterIndex % LEGENDARY_WEAPONS.length] || null,
  };
});

const toIndex = (value) => {
  const n = Math.trunc(Number(value));
  if (!Number.isInteger(n) || n < 0 || n >= OVERDRIVE_LEVEL_COUNT) return -1;
  return n;
};

export function overdriveRoomForIndex(index) {
  const i = toIndex(index);
  return i < 0 ? null : OVERDRIVE_ROOMS[i];
}

export function overdriveIndexForRoom(roomId) {
  if (!Number.isInteger(roomId)) return -1;
  const i = roomId - OVERDRIVE_GLOBAL_START;
  return i >= 0 && i < OVERDRIVE_LEVEL_COUNT ? i : -1;
}

export function overdriveRoomForLevel(level) {
  const n = Math.trunc(Number(level));
  if (!Number.isInteger(n) || n < OVERDRIVE_FIRST_LEVEL || n > OVERDRIVE_LAST_LEVEL) return null;
  return OVERDRIVE_ROOMS[n - OVERDRIVE_FIRST_LEVEL] || null;
}

// ── Progression & sanitizer (extends overdrive.js base contract) ───────────
export function defaultOverdriveLadderState() {
  return {
    ...defaultOverdriveProgress(),
    version: OVERDRIVE_LADDER_VERSION,
    levels: Array.from({ length: OVERDRIVE_LEVEL_COUNT }, () => false),
    bosses: Array.from({ length: OVERDRIVE_CHAPTER_COUNT }, () => false),
    discovered: Array.from({ length: OVERDRIVE_LEVEL_COUNT }, (_, i) => i === 0),
    activeSchool: SPELL_SCHOOLS[0].id,
    activeSpellIndex: 0,
    equippedLegendary: null,
    runs: 0,
    deaths: 0,
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

export function sanitizeOverdriveLadderProgress(raw) {
  const base = defaultOverdriveLadderState();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const inner = sanitizeOverdriveProgress(raw);
  const levels = Array.from({ length: OVERDRIVE_LEVEL_COUNT }, (_, i) => raw.levels?.[i] === true);
  for (let i = 1; i < levels.length; i += 1) {
    if (levels[i] && !levels[i - 1]) levels[i] = false;
  }
  const bosses = Array.from({ length: OVERDRIVE_CHAPTER_COUNT }, (_, ch) => {
    const seat = ch * OVERDRIVE_ROOMS_PER_CHAPTER + OVERDRIVE_ROOMS_PER_CHAPTER - 1;
    return raw.bosses?.[ch] === true && levels[seat];
  });
  const discovered = Array.from({ length: OVERDRIVE_LEVEL_COUNT }, (_, i) => (
    i === 0 ? true : raw.discovered?.[i] === true || levels[i] || levels[i - 1]
  ));
  const schoolIds = new Set(SPELL_SCHOOLS.map((s) => s.id));
  const activeSchool = schoolIds.has(raw.activeSchool) ? raw.activeSchool : SPELL_SCHOOLS[0].id;
  const legendaryIds = new Set(LEGENDARY_WEAPONS.map((w) => w.id));
  const found = Array.isArray(inner.legendaryWeaponsFound)
    ? inner.legendaryWeaponsFound.filter((id) => legendaryIds.has(id))
    : [];
  const equippedLegendary = legendaryIds.has(raw.equippedLegendary) && found.includes(raw.equippedLegendary)
    ? raw.equippedLegendary
    : null;
  const clearedCount = levels.filter(Boolean).length;
  return {
    ...base,
    ...inner,
    version: OVERDRIVE_LADDER_VERSION,
    highestLevel: Math.min(OVERDRIVE_LAST_LEVEL, OVERDRIVE_FIRST_LEVEL + clearedCount),
    levels,
    bosses,
    discovered,
    activeSchool,
    activeSpellIndex: toInt(raw.activeSpellIndex, 0, 3),
    equippedLegendary,
    legendaryWeaponsFound: [...new Set(found)],
    runs: toInt(raw.runs, 0, 999999),
    deaths: toInt(raw.deaths, 0, 999999),
    bossClears: bosses.filter(Boolean).length,
    bestTime: toSeconds(raw.bestTime),
    lastTime: toSeconds(raw.lastTime),
  };
}

/** Overdrive unlocks once Infinite Frontiers (Lv 200 / Aethron) is conquered, or any Overdrive save exists. */
export function overdriveCampaignUnlocked(progress) {
  if (!progress || typeof progress !== 'object') return false;
  if (progress.frontiers?.bosses?.[9] === true || progress.frontiers?.levels?.[99] === true) return true;
  return Array.isArray(progress.overdrive?.levels) && progress.overdrive.levels.some(Boolean);
}

export function overdriveLevelUnlocked(state, index) {
  const safe = sanitizeOverdriveLadderProgress(state);
  const i = toIndex(index);
  if (i < 0) return false;
  if (i === 0) return true;
  return safe.levels[i - 1] === true;
}

export function overdriveLevelCleared(state, index) {
  const safe = sanitizeOverdriveLadderProgress(state);
  const i = toIndex(index);
  return i >= 0 ? safe.levels[i] === true : false;
}

export function recordOverdriveLevel(state, index) {
  const safe = state || defaultOverdriveLadderState();
  if (!Array.isArray(safe.levels)) Object.assign(safe, sanitizeOverdriveLadderProgress(safe));
  const i = toIndex(index);
  if (i < 0) return { ok: false };
  if (!overdriveLevelUnlocked(safe, i)) return { ok: false, reason: 'locked' };
  const firstClear = safe.levels[i] !== true;
  safe.levels[i] = true;
  safe.discovered[i] = true;
  if (safe.discovered[i + 1] !== undefined) safe.discovered[i + 1] = true;
  const levelNum = OVERDRIVE_FIRST_LEVEL + i;
  if (!safe.clearedLevels.includes(levelNum)) safe.clearedLevels.push(levelNum);
  safe.highestLevel = Math.max(safe.highestLevel || OVERDRIVE_FIRST_LEVEL, Math.min(OVERDRIVE_LAST_LEVEL, levelNum + 1));

  const chapterIndex = Math.floor(i / OVERDRIVE_ROOMS_PER_CHAPTER);
  const isSeat = i % OVERDRIVE_ROOMS_PER_CHAPTER === OVERDRIVE_ROOMS_PER_CHAPTER - 1;
  let bossFirstClear = false;
  let unlockedLegendary = null;
  if (isSeat) {
    bossFirstClear = safe.bosses[chapterIndex] !== true;
    safe.bosses[chapterIndex] = true;
    safe.bossClears = safe.bosses.filter(Boolean).length;
    const bossId = OVERDRIVE_CHAPTERS[chapterIndex]?.bossId;
    if (bossId && !safe.bossesDefeated.includes(bossId)) safe.bossesDefeated.push(bossId);
    const rewardWeapon = LEGENDARY_WEAPONS[chapterIndex];
    if (rewardWeapon && !safe.legendaryWeaponsFound.includes(rewardWeapon.id)) {
      safe.legendaryWeaponsFound.push(rewardWeapon.id);
      unlockedLegendary = rewardWeapon;
      if (!safe.equippedLegendary) safe.equippedLegendary = rewardWeapon.id;
    }
  }
  return {
    ok: true,
    firstClear,
    bossFirstClear,
    unlockedLegendary,
    chapter: chapterIndex + 21,
    complete: safe.levels.every(Boolean),
  };
}

export function recordOverdriveRun(state, seconds = 0, died = false) {
  const safe = state || defaultOverdriveLadderState();
  safe.runs = (safe.runs || 0) + 1;
  if (died) safe.deaths = (safe.deaths || 0) + 1;
  const time = toSeconds(seconds);
  if (time > 0) {
    safe.lastTime = time;
    if (!safe.bestTime || time < safe.bestTime) safe.bestTime = time;
  }
  return safe;
}

export function overdriveChapterProgress(state, chapterNumber) {
  const safe = sanitizeOverdriveLadderProgress(state);
  const chapterIndex = Math.trunc(Number(chapterNumber)) - 21;
  if (chapterIndex < 0 || chapterIndex >= OVERDRIVE_CHAPTER_COUNT) return null;
  const start = chapterIndex * OVERDRIVE_ROOMS_PER_CHAPTER;
  const levels = safe.levels.slice(start, start + OVERDRIVE_ROOMS_PER_CHAPTER);
  return {
    chapter: chapterIndex + 21,
    cleared: levels.filter(Boolean).length,
    total: OVERDRIVE_ROOMS_PER_CHAPTER,
    bossCleared: safe.bosses[chapterIndex],
    clearedLevels: levels,
  };
}

export function overdriveCampaignSummary(state) {
  const safe = sanitizeOverdriveLadderProgress(state);
  const cleared = safe.levels.filter(Boolean).length;
  const bosses = safe.bosses.filter(Boolean).length;
  return {
    name: OVERDRIVE_NAME,
    localName: OVERDRIVE_LOCAL_NAME,
    levelsCleared: cleared,
    levelTotal: OVERDRIVE_LEVEL_COUNT,
    bossesCleared: bosses,
    bossTotal: OVERDRIVE_CHAPTER_COUNT,
    percent: Math.round((cleared / OVERDRIVE_LEVEL_COUNT) * 100),
    complete: cleared === OVERDRIVE_LEVEL_COUNT,
    runs: safe.runs,
    deaths: safe.deaths,
    bestTime: safe.bestTime,
    activeSchool: safe.activeSchool,
    activeSpellIndex: safe.activeSpellIndex,
    equippedLegendary: safe.equippedLegendary,
    legendariesCount: safe.legendaryWeaponsFound.length,
    levels: safe.levels.slice(),
    bosses: safe.bosses.slice(),
  };
}

export function overdriveSpellFor(schoolId, spellIndex = 0) {
  const school = SPELL_SCHOOLS.find((s) => s.id === schoolId) || SPELL_SCHOOLS[0];
  const idx = Math.max(0, Math.min(school.spells.length - 1, Math.trunc(Number(spellIndex)) || 0));
  return { school, spell: school.spells[idx], index: idx };
}

export function validateOverdriveRooms(rooms = OVERDRIVE_ROOMS) {
  const errors = [];
  const ids = new Set(rooms.map((room) => room.id));
  for (let i = 0; i < rooms.length; i += 1) {
    const room = rooms[i];
    if (room.id !== OVERDRIVE_GLOBAL_START + i) errors.push(`room ${i} id ${room.id} is not contiguous`);
    if (room.overdriveLevel !== OVERDRIVE_FIRST_LEVEL + i) errors.push(`room ${room.id} level ${room.overdriveLevel} out of order`);
    const gates = room.gates || (room.gate ? [room.gate] : []);
    for (const gate of gates) {
      if (gate.next != null && !ids.has(gate.next)) errors.push(`room ${room.id} gate -> ${gate.next} is missing`);
    }
    if (!room.boss && !gates.length) errors.push(`room ${room.id} needs an exit`);
    if (room.boss && OVERDRIVE_BOSS_INFO[room.boss]?.reward === 'victory' && gates.length) {
      errors.push(`room ${room.id} victory boss must not open a gate`);
    }
    for (const enemy of room.enemies) {
      if (!OVERDRIVE_ENEMY_INFO[enemy.type]) errors.push(`room ${room.id} enemy ${enemy.type} unknown`);
      if (!(enemy.minX < enemy.x && enemy.x < enemy.maxX)) errors.push(`room ${room.id} patrol invalid`);
    }
  }
  for (const room of rooms.filter((entry) => !entry.boss)) {
    if (room.enemies.length !== OVERDRIVE_ENEMIES_PER_ROOM) {
      errors.push(`room ${room.id} has ${room.enemies.length} enemies, expected ${OVERDRIVE_ENEMIES_PER_ROOM}`);
    }
    const elites = room.enemies.filter((enemy) => enemy.elite);
    if (elites.length !== OVERDRIVE_ELITE_COUNT) errors.push(`room ${room.id} has ${elites.length} elites`);
    const archetypes = new Set(
      room.enemies
        .filter((enemy) => !enemy.elite)
        .map((enemy) => OVERDRIVE_ENEMY_INFO[enemy.type]?.behavior),
    );
    if (archetypes.size !== 4) errors.push(`room ${room.id} uses ${archetypes.size} archetypes`);
  }
  for (const [kind, boss] of Object.entries(OVERDRIVE_BOSS_INFO)) {
    const thresholds = boss.phaseThresholds || [];
    if (boss.maxPhases < 3 || boss.maxPhases > 5) errors.push(`boss ${kind} has ${boss.maxPhases} phases`);
    if (thresholds.length !== boss.maxPhases - 1) errors.push(`boss ${kind} threshold mismatch`);
    for (let i = 1; i < thresholds.length; i += 1) {
      if (thresholds[i] >= thresholds[i - 1]) errors.push(`boss ${kind} thresholds not descending`);
    }
    for (const key of ['intro', 'defeat', ...Array.from({ length: boss.maxPhases - 1 }, (_, i) => `phase${i + 2}`)]) {
      if (!Array.isArray(boss.dialogue?.[key]) || !boss.dialogue[key].length) errors.push(`boss ${kind} missing ${key}`);
    }
  }
  return errors;
}
