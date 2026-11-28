// Ashen Vow — Phase 2: Infinite Frontiers, Lv 101–200 playable.
//
// `src/frontier.js` has described these 100 levels since v0.5.0 as data only:
// chapters, level specs, elite ranks and mobs, but no room in `ALL_ROOMS`.
// This module turns that table into a real, save-backed ladder.
//
// Layout: 10 chapters × 10 levels, appended at ids 674–773 so no existing room
// index moves. Levels 101–200 map one-to-one onto ids 674–773. Every standard
// level keeps the campaign contract (20 bodies, 4 archetypes, 19 normal + 1
// guaranteed elite); every tenth level is a boss arena with its own gate.
//
// Pure: no DOM, no storage, no canvas. `src/core.js` only appends the rooms and
// merges the enemy/boss tables.

import {
  FRONTIER_CHAPTERS,
  FRONTIER_LEVEL_SPECS,
  ELITE_MOBS,
  ELITE_RANKS,
} from './frontier.js';

export const FRONTIERS_VERSION = 1;
export const FRONTIERS_NAME = 'Infinite Frontiers';
export const FRONTIERS_LOCAL_NAME = 'Batas Tak Berujung';
export const FRONTIER_GLOBAL_START = 674;
export const FRONTIER_LEVEL_COUNT = 100;
export const FRONTIER_CHAPTER_COUNT = 10;
export const FRONTIER_ROOMS_PER_CHAPTER = 10;
export const FRONTIER_ENEMIES_PER_ROOM = 20;
export const FRONTIER_ELITE_COUNT = 1;
export const FRONTIER_FLOOR_Y = 470;
export const FRONTIER_WORLD_W = 1400;
export const FRONTIER_ZONE_ID = 'frontier';
export const FRONTIER_FIRST_LEVEL = 101;
export const FRONTIER_LAST_LEVEL = 200;
export const FRONTIER_LAST_BOSS = 'aethron_origin';

// ── palettes ───────────────────────────────────────────────────────────────
// One authored palette per chapter. The renderer already accepts `room.palette`
// and `room.particle`, so a Frontier room needs no art code of its own.
const PALETTES = {
  11: { top: '#08121f', mid: '#102236', low: '#1b3550', glow: '#8ec5fc', fog: '#2b4a6b' },
  12: { top: '#100c06', mid: '#241b12', low: '#3b2b19', glow: '#ffd166', fog: '#4a3722' },
  13: { top: '#03141a', mid: '#052430', low: '#083746', glow: '#06d6a0', fog: '#0c4a55' },
  14: { top: '#1a1008', mid: '#2b1d0c', low: '#3f2c12', glow: '#f4a261', fog: '#5a3f1c' },
  15: { top: '#061009', mid: '#0d2818', low: '#144023', glow: '#70e000', fog: '#1d4d2b' },
  16: { top: '#0d0518', mid: '#140826', low: '#21103d', glow: '#b5179e', fog: '#2f1a52' },
  17: { top: '#08060c', mid: '#131019', low: '#1d1727', glow: '#7f5af0', fog: '#2a2140' },
  18: { top: '#100c05', mid: '#241b0a', low: '#3a2b12', glow: '#ffb703', fog: '#4c3a18' },
  19: { top: '#120a06', mid: '#2a1a10', low: '#3f2818', glow: '#e76f51', fog: '#553322' },
  20: { top: '#0f0410', mid: '#1b0719', low: '#2c0c2a', glow: '#f72585', fog: '#3d1238' },
};

const PARTICLES = {
  11: 'rain',
  12: 'embers',
  13: 'bubbles',
  14: 'mist',
  15: 'spores',
  16: 'stars',
  17: 'shards',
  18: 'gears',
  19: 'mist',
  20: 'stars',
};

// ── normal bodies ──────────────────────────────────────────────────────────
// Four per chapter on the four required archetypes. Stats climb chapter by
// chapter; the per-level scale in `frontierLevelScale` multiplies on top.
const BODY_SPECS = [
  // Chapter 11 — The Shattered Continent
  ['sky_husk', 'Sky Husk', 'Sisa Langit', 70, 15, 118, 40, 40, 18, 'chaser', 'RENDAH', 'Mayat yang masih menempel di pecahan benua. Ia mengejar karena tidak tahu cara berhenti melayang.', 'Benua Hancur · Reruntuhan Melayang'],
  ['wind_acolyte', 'Wind Acolyte', 'Akolit Angin', 62, 14, 70, 36, 46, 17, 'ranged', 'SEDANG', 'Penyihir yang menunggang arus udara dan melepas bilah angin dari kejauhan.', 'Benua Hancur · Menara Observatorium'],
  ['ruin_diver', 'Ruin Diver', 'Penyelam Reruntuhan', 88, 19, 104, 46, 44, 22, 'lunge', 'SEDANG', 'Pelompat yang menandai sasaran lalu menukik menembus platform.', 'Benua Hancur · Dermaga Langit'],
  ['gravity_golem', 'Gravity Golem', 'Golem Gravitasi', 132, 21, 66, 58, 60, 30, 'slam', 'TINGGI', 'Bongkahan batu yang menekan lantai, lalu menghentakkannya menjadi gelombang.', 'Benua Hancur · Katedral Retak'],
  // Chapter 12 — The Forgotten Empire
  ['imperial_guard', 'Imperial Guard', 'Pengawal Kekaisaran', 82, 17, 112, 42, 46, 20, 'chaser', 'RENDAH', 'Penjaga yang masih berdiri di barisan upacara meski kerajaannya sudah abu.', 'Kekaisaran Terlupakan · Jalan Imperial'],
  ['ash_priest', 'Ash Priest', 'Pendeta Abu', 74, 16, 68, 38, 48, 19, 'ranged', 'SEDANG', 'Menyemburkan doa yang terbakar dari balik jubah emas pudar.', 'Kekaisaran Terlupakan · Arsip Agung'],
  ['phalanx_lancer', 'Phalanx Lancer', 'Tombak Falangs', 100, 21, 100, 48, 46, 24, 'lunge', 'SEDANG', 'Tombak panjang yang menandai satu garis lurus dan tidak pernah meleset dua kali.', 'Kekaisaran Terlupakan · Akuaduk'],
  ['gilded_colossus', 'Gilded Colossus', 'Kolosus Berlapis Emas', 148, 23, 60, 62, 66, 33, 'slam', 'TINGGI', 'Patung penjaga seukuran gerbang yang bergerak hanya ketika lantai disentuh.', 'Kekaisaran Terlupakan · Makam Kaisar'],
  // Chapter 13 — The Abyssal Kingdom
  ['reef_stalker', 'Reef Stalker', 'Pemburu Karang', 94, 19, 120, 44, 40, 22, 'chaser', 'RENDAH', 'Predator bioluminesen yang berkedip tepat sebelum menyerang.', 'Kerajaan Palung · Hutan Lentera'],
  ['lantern_jelly', 'Lantern Jelly', 'Ubur Lentera', 84, 18, 56, 40, 50, 21, 'ranged', 'SEDANG', 'Ubur-ubur raksasa yang melepas sengatan listrik pelan dari kedalaman.', 'Kerajaan Palung · Katedral Mutiara'],
  ['trench_hunter', 'Trench Hunter', 'Pemburu Palung', 112, 23, 108, 50, 46, 26, 'lunge', 'SEDANG', 'Menyelam ke arus lalu melesat ke arah cahaya terakhir.', 'Kerajaan Palung · Penjara Dalam'],
  ['coral_behemoth', 'Coral Behemoth', 'Behemot Karang', 160, 25, 64, 66, 68, 36, 'slam', 'TINGGI', 'Karang hidup yang memadatkan air di sekitarnya menjadi hantaman.', 'Kerajaan Palung · Kuburan Leviathan'],
  // Chapter 14 — The Eternal Desert
  ['dune_scarab', 'Dune Scarab', 'Kumbang Dune', 104, 21, 116, 42, 38, 24, 'chaser', 'RENDAH', 'Kumbang sebesar anjing yang berlari di atas pasir tanpa tenggelam.', 'Gurun Abadi · Pasir Berpindah'],
  ['mirage_archer', 'Mirage Archer', 'Pemanah Mirage', 92, 20, 66, 38, 48, 23, 'ranged', 'SEDANG', 'Memanah dari bayangan yang tidak ada, dan panahnya tetap sampai.', 'Gurun Abadi · Oase Berbisik'],
  ['sand_reaver', 'Sand Reaver', 'Perampas Pasir', 122, 25, 102, 48, 46, 28, 'lunge', 'SEDANG', 'Menandai lalu melesat di bawah permukaan pasir sebelum menerjang.', 'Gurun Abadi · Nekropolis Terkubur'],
  ['pyramid_golem', 'Pyramid Golem', 'Golem Piramida', 172, 27, 58, 64, 70, 38, 'slam', 'TINGGI', 'Bongkahan batu bertuliskan nama raja yang tidak boleh disebut.', 'Gurun Abadi · Obelisk Tenggelam'],
  // Chapter 15 — The Verdant Colossus
  ['bark_crawler', 'Bark Crawler', 'Perayap Kulit Kayu', 114, 23, 114, 42, 42, 26, 'chaser', 'RENDAH', 'Serangga berkulit kayu yang mengikuti getaran langkah.', 'Raksasa Hijau · Kanopi Akar Dunia'],
  ['spore_chorister', 'Spore Chorister', 'Koor Spora', 100, 21, 62, 40, 50, 24, 'ranged', 'SEDANG', 'Melepas gumpalan spora bernada yang pecah menjadi serpihan.', 'Raksasa Hijau · Hive Arboreal'],
  ['thorn_pouncer', 'Thorn Pouncer', 'Pelompat Duri', 132, 27, 106, 48, 46, 30, 'lunge', 'SEDANG', 'Menandai, lalu melompat dari dahan setinggi tiga badan.', 'Raksasa Hijau · Bough Berputar'],
  ['root_brute', 'Root Brute', 'Brute Akar', 186, 29, 62, 66, 68, 40, 'slam', 'TINGGI', 'Akar yang mengepal seperti tinju dan menghantam lantai.', 'Raksasa Hijau · Inti Kolosus'],
  // Chapter 16 — The Astral Frontier
  ['star_wisp', 'Star Wisp', 'Nyala Bintang', 124, 25, 122, 38, 40, 28, 'chaser', 'RENDAH', 'Serpihan bintang yang mengejar kehangatan apa pun.', 'Garis Batas Astral · Ambang Berbintang'],
  ['void_seer', 'Void Seer', 'Pelita Hampa', 110, 23, 60, 40, 52, 26, 'ranged', 'SEDANG', 'Mata tunggal yang menatap dari kehampaan dan melepas garis cahaya.', 'Garis Batas Astral · Observatorium Prisma'],
  ['comet_lancer', 'Comet Lancer', 'Tombak Komet', 144, 29, 110, 50, 48, 32, 'lunge', 'SEDANG', 'Meluncur seperti komet pendek dengan ekor yang membakar lantai.', 'Garis Batas Astral · Jejak Komet'],
  ['gravity_seraph', 'Gravity Seraph', 'Seraf Gravitasi', 200, 31, 58, 64, 74, 43, 'slam', 'TINGGI', 'Sayap yang menekan ruang, lalu melepaskannya sekaligus.', 'Garis Batas Astral · Sumur Gravitasi'],
  // Chapter 17 — Hollow Dimension
  ['mirror_shade', 'Mirror Shade', 'Bayangan Cermin', 134, 27, 118, 42, 44, 30, 'chaser', 'RENDAH', 'Bayangan yang bergerak setengah detik setelah kau bergerak.', 'Dimensi Rongga · Cermin Bergema'],
  ['echo_weaver', 'Echo Weaver', 'Penemu Gema', 118, 25, 64, 40, 52, 28, 'ranged', 'SEDANG', 'Menenun gema menjadi proyektil yang menyalin gerak terakhirmu.', 'Dimensi Rongga · Aula Non-Euclid'],
  ['null_stalker', 'Null Stalker', 'Pemburu Nihil', 156, 31, 112, 48, 48, 34, 'lunge', 'SEDANG', 'Menghilang dari pandangan lalu muncul di sisi yang salah.', 'Dimensi Rongga · Koridor Null'],
  ['folded_warden', 'Folded Warden', 'Penjaga Terlipat', 214, 33, 60, 66, 72, 46, 'slam', 'TINGGI', 'Tubuh yang terlipat di dua tempat dan memukul dari keduanya.', 'Dimensi Rongga · Ruang Terlipat'],
  // Chapter 18 — Celestial Machine
  ['clock_drone', 'Clock Drone', 'Drone Jam', 146, 29, 116, 40, 42, 32, 'chaser', 'RENDAH', 'Roda gigi kecil yang berputar mengejar satu target sampai berhenti.', 'Mesin Surgawi · Gerbang Roda Gigi'],
  ['steam_oracle', 'Steam Oracle', 'Peramal Uap', 128, 27, 62, 42, 54, 30, 'ranged', 'SEDANG', 'Melepas semburan uap panas yang menandai arah sebelum menyala.', 'Mesin Surgawi · Penempaan Piston'],
  ['piston_lancer', 'Piston Lancer', 'Lansir Piston', 168, 33, 108, 50, 48, 36, 'lunge', 'SEDANG', 'Diluncurkan oleh piston di belakangnya, sekali per tarikan.', 'Mesin Surgawi · Menara Roda'],
  ['gear_titan', 'Gear Titan', 'Titan Roda Gigi', 228, 35, 56, 68, 76, 49, 'slam', 'TINGGI', 'Merangkai dirinya dari roda gigi di lantai lalu menjatuhkan diri.', 'Mesin Surgawi · Siklus Waktu'],
  // Chapter 19 — Primordial Lands
  ['tar_crawler', 'Tar Crawler', 'Perayap Tar', 158, 31, 112, 44, 42, 34, 'chaser', 'RENDAH', 'Bergerak lambat di permukaan tar dan cepat begitu menyentuh batu.', 'Tanah Purba · Cekungan Liar'],
  ['bone_shaman', 'Bone Shaman', 'Dukun Tulang', 138, 29, 60, 42, 54, 32, 'ranged', 'SEDANG', 'Membaca tulang lalu melempar serpihannya sebagai kutukan.', 'Tanah Purba · Rawa Tar Leluhur'],
  ['raptor_alpha', 'Raptor Alpha', 'Raptor Alpha', 180, 35, 118, 52, 48, 38, 'lunge', 'SEDANG', 'Pemimpin kawanan yang menandai sasaran untuk seluruh kawanannya.', 'Tanah Purba · Jejak Megafauna'],
  ['megafauna_bull', 'Megafauna Bull', 'Banteng Megafauna', 244, 37, 54, 70, 74, 52, 'slam', 'TINGGI', 'Menunduk, lalu menjatuhkan seluruh berat tubuhnya ke lantai.', 'Tanah Purba · Kaldera Membatu'],
  // Chapter 20 — The Last Beyond
  ['origin_wisp', 'Origin Wisp', 'Nyala Asal', 172, 33, 120, 42, 44, 36, 'chaser', 'RENDAH', 'Nyala pertama yang menempel pada siapa pun yang berani mendekat.', 'Batas Terakhir · Tepi Keberadaan'],
  ['flame_scribe', 'Flame Scribe', 'Juru Tulis Api', 150, 31, 64, 42, 56, 34, 'ranged', 'SEDANG', 'Menulis namamu dengan api di udara sebelum melepasnya.', 'Batas Terakhir · Permulaan Terlupakan'],
  ['dimension_lancer', 'Dimension Lancer', 'Tombak Dimensi', 194, 37, 114, 52, 50, 40, 'lunge', 'SEDANG', 'Menusuk melalui celah ruang dan keluar di sisi lain.', 'Batas Terakhir · Kenyataan Retak'],
  ['genesis_colossus', 'Genesis Colossus', 'Kolosus Genesis', 262, 39, 58, 70, 80, 55, 'slam', 'TINGGI', 'Bentuk terakhir dari sesuatu yang dulu menciptakan lantai ini.', 'Batas Terakhir · Mesin Dunia'],
];

const BODY_INFO = Object.fromEntries(
  BODY_SPECS.map(([type, name, title, hp, dmg, speed, w, h, reward, behavior, danger, desc, where]) => [
    type,
    { name, title, hp, dmg, speed, w, h, reward, behavior, danger, desc, where },
  ]),
);

export const FRONTIER_ENEMY_INFO = BODY_INFO;

// ── elites (E1–E7) ─────────────────────────────────────────────────────────
// The 15 authored elite mobs become real spawns. Their rank multiplier from
// `ELITE_RANKS` decides the body scale, so an E7 is visibly a different fight
// from an E1 while both ride the engine's ordinary elite path.
const ELITE_BEHAVIOURS = {
  ashen_executioner: 'slam',
  thornveil_alpha: 'lunge',
  abyssal_leviathan_spawn: 'slam',
  ironbound_juggernaut: 'slam',
  frostbound_duelist: 'lunge',
  magma_overlord: 'ranged',
  astral_inquisitor: 'ranged',
  blight_architect: 'spawner',
  neural_commander: 'ranged',
  rift_champion: 'chaser',
  sandstorm_tyrant: 'burrower',
  worldroot_guardian: 'slam',
  chrono_sentinel: 'ranged',
  primordial_behemoth: 'slam',
  beyond_warden: 'slam',
};

const RANK_INDEX = Object.fromEntries(ELITE_RANKS.map((rank, index) => [rank.id, index]));

export const FRONTIER_ELITE_INFO = Object.fromEntries(
  ELITE_MOBS.map((mob) => {
    const rankIndex = RANK_INDEX[mob.rank] ?? 0;
    const rank = ELITE_RANKS[rankIndex];
    return [
      mob.id,
      {
        name: mob.name,
        title: `${rank.name} · ${mob.rank}`,
        hp: mob.hp,
        dmg: mob.dmg,
        speed: 76 + rankIndex * 7,
        w: 56 + rankIndex * 3,
        h: 62 + rankIndex * 4,
        reward: Math.round(mob.hp * 0.09),
        behavior: ELITE_BEHAVIOURS[mob.id] || 'chaser',
        elite: true,
        eliteRank: mob.rank,
        danger: 'ELITE',
        desc: mob.ability,
        where: mob.biome,
        drop: mob.dropLore,
      },
    ];
  }),
);

// Each chapter draws its guaranteed elite from this pool. Every authored elite
// appears at least once across the ladder.
const CHAPTER_ELITES = {
  11: ['ashen_executioner'],
  12: ['ironbound_juggernaut'],
  13: ['abyssal_leviathan_spawn', 'neural_commander'],
  14: ['sandstorm_tyrant'],
  15: ['worldroot_guardian', 'thornveil_alpha', 'blight_architect'],
  16: ['astral_inquisitor', 'frostbound_duelist'],
  17: ['rift_champion', 'chrono_sentinel'],
  18: ['magma_overlord'],
  19: ['primordial_behemoth'],
  20: ['beyond_warden'],
};

export const FRONTIER_CHAPTER_ELITES = CHAPTER_ELITES;

// ── bosses ─────────────────────────────────────────────────────────────────
// Ten chapter bosses, three to five phases each. Each one owns a distinct name,
// title, colour, phase table, summon body and attack family. Phase 3 of the
// roadmap replaces the shared machine with a per-boss script; until then the
// patterns below are deliberately different from each other.
export const FRONTIER_BOSS_INFO = {
  skybreaker: {
    name: 'The Skybreaker',
    title: 'Ancient Flying Construct',
    maxHp: 1400,
    w: 120,
    h: 96,
    contact: 15,
    ashReward: 320,
    reward: 'boss',
    music: 'bossStorm',
    color: '#8ec5fc',
    maxPhases: 3,
    phaseThresholds: [0.66, 0.33],
    pattern: 'charge',
    flying: true,
    spawn: { x: 700, y: 170 },
    dialogue: {
      intro: [
        { speaker: 'Skybreaker', text: 'Tidak ada benua yang utuh. Tidak ada langit yang tinggal. Aku yang merobeknya, dan aku masih di sini.' },
        { speaker: 'Skybreaker', text: 'Kau berdiri di atas serpihanku. Itu satu-satunya alasan kau masih bisa berdiri.' },
      ],
      phase2: [
        { speaker: 'Skybreaker', text: 'Reaktornya menyala lagi. Kalau kau ingin jatuh bersama benua ini, jangan katakan aku tidak menawarkan.' },
      ],
      phase3: [
        { speaker: 'Skybreaker', text: 'Arus angin di atas sudah lama tidak punya penonton. Tunjukkan kalau kau masih bisa terbang.' },
      ],
      defeat: [
        { speaker: 'Skybreaker', text: 'Runtuh... akhirnya. Bawa serpihan ini ke bawah, dan biarkan orang-orang tahu langit pernah punya raja.' },
      ],
    },
  },
  emperor_solvar: {
    name: 'Emperor Solvar',
    title: 'Wielder of the First Flame',
    maxHp: 1600,
    w: 108,
    h: 128,
    contact: 17,
    ashReward: 360,
    reward: 'boss',
    music: 'bossAsh',
    color: '#ffd166',
    maxPhases: 4,
    phaseThresholds: [0.75, 0.5, 0.25],
    pattern: 'volley',
    spawn: { x: 720, y: FRONTIER_FLOOR_Y - 128 },
    dialogue: {
      intro: [
        { speaker: 'Solvar', text: 'Kekaisaran ini tidak runtuh. Ia hanya berhenti diperintah.' },
        { speaker: 'Solvar', text: 'Api pertama tidak diberikan kepada rakyat. Ia dipinjamkan, dan pinjaman itu sudah jatuh tempo.' },
      ],
      phase2: [
        { speaker: 'Solvar', text: 'Kau membakar arsipku. Bagus. Sejarah memang harus dibakar sebelum ditulis ulang.' },
      ],
      phase3: [
        { speaker: 'Solvar', text: 'Setiap penjaga yang kau lewati masih menyebut namaku. Itu bukan kesetiaan — itu kebiasaan.' },
      ],
      phase4: [
        { speaker: 'Solvar', text: 'Ambil mahkotanya. Kau akan merasakan hal yang sama: lantai yang tidak pernah cukup luas.' },
      ],
      defeat: [
        { speaker: 'Solvar', text: 'Padam... api pertama memilih diam. Mungkin itu yang kutunggu selama seribu tahun.' },
      ],
    },
  },
  primordial_leviathan: {
    name: 'The Primordial Leviathan',
    title: 'Ancient Deepwater Behemoth',
    maxHp: 1800,
    w: 150,
    h: 110,
    contact: 19,
    ashReward: 400,
    reward: 'boss',
    music: 'cisternBoss',
    color: '#06d6a0',
    maxPhases: 4,
    phaseThresholds: [0.75, 0.5, 0.25],
    pattern: 'ring',
    summonType: 'trench_hunter',
    spawn: { x: 700, y: FRONTIER_FLOOR_Y - 110 },
    dialogue: {
      intro: [
        { speaker: 'Leviathan', text: 'Kau berjalan di dasar laut yang tidak pernah melihat matahari. Napasmu terlalu berisik.' },
        { speaker: 'Leviathan', text: 'Kerajaan di atasku tenggelam karena aku berputar satu kali. Jangan buat aku berputar dua kali.' },
      ],
      phase2: [
        { speaker: 'Leviathan', text: 'Arusnya naik. Setiap mutiara di aula ini pernah menjadi mata.' },
      ],
      phase3: [
        { speaker: 'Leviathan', text: 'Kau membawa cahaya ke tempat yang seharusnya gelap. Itu bukan keberanian, itu kesombongan.' },
      ],
      phase4: [
        { speaker: 'Leviathan', text: 'Satu putaran lagi. Kalau kau masih bisa berdiri setelahnya, kerajaan ini milikmu.' },
      ],
      defeat: [
        { speaker: 'Leviathan', text: 'Dasar laut... akhirnya sunyi. Jangan menyalakan lentera saat kau pergi.' },
      ],
    },
  },
  zarakh_sovereign: {
    name: 'Zarakh, the Sandbound Sovereign',
    title: 'Monarch of the Sunken Pyramids',
    maxHp: 2000,
    w: 126,
    h: 136,
    contact: 21,
    ashReward: 440,
    reward: 'boss',
    music: 'magmaBoss',
    color: '#f4a261',
    maxPhases: 3,
    phaseThresholds: [0.66, 0.33],
    pattern: 'charge',
    spawn: { x: 710, y: FRONTIER_FLOOR_Y - 136 },
    dialogue: {
      intro: [
        { speaker: 'Zarakh', text: 'Pasir mengubur segalanya dengan sabar. Kau datang terlalu cepat.' },
        { speaker: 'Zarakh', text: 'Piramida ini bukan makam. Ini takhta yang tenggelam karena aku bosan berdiri.' },
      ],
      phase2: [
        { speaker: 'Zarakh', text: 'Badai pasir mengenal namamu sekarang. Ia akan mengikuti ke mana pun kau melangkah.' },
      ],
      phase3: [
        { speaker: 'Zarakh', text: 'Kau menghancurkan segel yang menjaga gurun tetap tidur. Bangunkan aku sepenuhnya, kalau berani.' },
      ],
      defeat: [
        { speaker: 'Zarakh', text: 'Pasir kembali tenang... dan takhta ini akhirnya bisa jadi makam yang pantas.' },
      ],
    },
  },
  elder_yggvar: {
    name: 'Elder Yggvar',
    title: 'Living Heart of the World-Tree',
    maxHp: 2200,
    w: 160,
    h: 150,
    contact: 22,
    ashReward: 480,
    reward: 'boss',
    music: 'courtBoss',
    color: '#70e000',
    maxPhases: 4,
    phaseThresholds: [0.75, 0.5, 0.25],
    pattern: 'summon',
    summonType: 'bark_crawler',
    spawn: { x: 700, y: FRONTIER_FLOOR_Y - 150 },
    dialogue: {
      intro: [
        { speaker: 'Yggvar', text: 'Akar-akarku memegang benua yang kau injak. Jangan salah kira: kau yang berjalan di atasku.' },
        { speaker: 'Yggvar', text: 'Pohon dunia tidak tumbuh untuk menyenangkan siapa pun. Ia tumbuh karena ada yang harus ditahan.' },
      ],
      phase2: [
        { speaker: 'Yggvar', text: 'Getahku panas. Kulitmu akan mengingatnya lebih lama daripada luka ini.' },
      ],
      phase3: [
        { speaker: 'Yggvar', text: 'Serangga-serangga kecil ini dulu penghuniku. Sekarang mereka memilih kau. Aneh.' },
      ],
      phase4: [
        { speaker: 'Yggvar', text: 'Inti kayuku berdetak sekali setiap seratus tahun. Kau kebetulan datang tepat waktu.' },
      ],
      defeat: [
        { speaker: 'Yggvar', text: 'Tumbang... dan benua ini masih bisa berdiri. Mungkin memang sudah waktunya.' },
      ],
    },
  },
  astral_devourer: {
    name: 'The Astral Devourer',
    title: 'Cosmic Singularity Beast',
    maxHp: 2400,
    w: 128,
    h: 118,
    contact: 23,
    ashReward: 520,
    reward: 'boss',
    music: 'bossGlass',
    color: '#b5179e',
    maxPhases: 5,
    phaseThresholds: [0.8, 0.6, 0.4, 0.2],
    pattern: 'rain',
    flying: true,
    spawn: { x: 700, y: 168 },
    dialogue: {
      intro: [
        { speaker: 'Devourer', text: 'Bintang-bintang ini bukan lampu. Mereka sisa-sisa yang belum sempat kumakan.' },
        { speaker: 'Devourer', text: 'Kau datang dari dunia yang masih punya gravitasi. Manis.' },
      ],
      phase2: [
        { speaker: 'Devourer', text: 'Rasi bintang berubah setiap kali kau berkedip. Jangan berkedip.' },
      ],
      phase3: [
        { speaker: 'Devourer', text: 'Aku menelan cahaya karena tidak ada yang lain untuk dimakan. Itu bukan kejahatan, itu kebiasaan.' },
      ],
      phase4: [
        { speaker: 'Devourer', text: 'Setengah dari diriku sudah di luar ruangan ini. Kau hanya melawan bagian yang kebetulan terlihat.' },
      ],
      phase5: [
        { speaker: 'Devourer', text: 'Baiklah. Kau ingin melihat pusatnya? Lihat baik-baik. Tidak ada yang indah di sana.' },
      ],
      defeat: [
        { speaker: 'Devourer', text: 'Akhirnya ada sesuatu yang tidak bisa kumakan. Aneh rasanya... lega.' },
      ],
    },
  },
  architect_of_nothing: {
    name: 'The Architect of Nothing',
    title: 'Builder of the Hollow Dimension',
    maxHp: 2600,
    w: 116,
    h: 132,
    contact: 24,
    ashReward: 560,
    reward: 'boss',
    music: 'bossAbbot',
    color: '#7f5af0',
    maxPhases: 4,
    phaseThresholds: [0.75, 0.5, 0.25],
    pattern: 'ring',
    spawn: { x: 720, y: FRONTIER_FLOOR_Y - 132 },
    dialogue: {
      intro: [
        { speaker: 'Architect', text: 'Kau menyebut tempat ini dimensi rongga. Aku menyebutnya ruangan yang sudah selesai dibersihkan.' },
        { speaker: 'Architect', text: 'Setiap pintu di sini kubangun supaya tidak ada yang bisa kembali.' },
      ],
      phase2: [
        { speaker: 'Architect', text: 'Kau menghancurkan satu dinding. Aku punya seratus yang belum kau lihat.' },
      ],
      phase3: [
        { speaker: 'Architect', text: 'Ruangan ini punya lima sudut. Kau baru menemukan tiga.' },
      ],
      phase4: [
        { speaker: 'Architect', text: 'Kalau kau menghapusku, ruangan ini akan tetap ada. Itu bagian yang tidak kau mengerti.' },
      ],
      defeat: [
        { speaker: 'Architect', text: 'Ruang kosong yang kubangun... sekarang punya satu penghuni yang tidak kupilih.' },
      ],
    },
  },
  chronos_mechanism: {
    name: 'Chronos, the Eternal Mechanism',
    title: 'Heart of the Celestial Machine',
    maxHp: 2800,
    w: 132,
    h: 138,
    contact: 25,
    ashReward: 600,
    reward: 'boss',
    music: 'reliquaryBoss',
    color: '#ffb703',
    maxPhases: 4,
    phaseThresholds: [0.75, 0.5, 0.25],
    pattern: 'volley',
    spawn: { x: 710, y: FRONTIER_FLOOR_Y - 138 },
    dialogue: {
      intro: [
        { speaker: 'Chronos', text: 'Detik kesembilan puluh sembilan. Aku sudah menghitung kedatanganmu sejak roda pertama berputar.' },
        { speaker: 'Chronos', text: 'Kau terlambat tiga detik. Tidak masalah. Aku punya seluruh sisa waktu.' },
      ],
      phase2: [
        { speaker: 'Chronos', text: 'Roda gigi ini mengatur napasmu. Perhatikan: sekarang lebih lambat.' },
      ],
      phase3: [
        { speaker: 'Chronos', text: 'Kau mengulang gerakan yang sama empat kali. Aku mencatat semuanya.' },
      ],
      phase4: [
        { speaker: 'Chronos', text: 'Jam ini tidak punya jarum mundur. Kalau kau ingin berhenti, kau harus mematahkannya.' },
      ],
      defeat: [
        { speaker: 'Chronos', text: 'Berhenti... untuk pertama kalinya dalam tiga ribu tahun, aku tidak tahu detik berikutnya.' },
      ],
    },
  },
  gorath_first_colossus: {
    name: 'Gorath, the First Colossus',
    title: 'First Beast of the Primordial Lands',
    maxHp: 3200,
    w: 168,
    h: 156,
    contact: 27,
    ashReward: 680,
    reward: 'boss',
    music: 'mycelialBoss',
    color: '#e76f51',
    maxPhases: 4,
    phaseThresholds: [0.75, 0.5, 0.25],
    pattern: 'slam',
    spawn: { x: 700, y: FRONTIER_FLOOR_Y - 156 },
    dialogue: {
      intro: [
        { speaker: 'Gorath', text: 'Sebelum ada sumpah, ada aku. Sebelum ada abu, ada aku.' },
        { speaker: 'Gorath', text: 'Kau kecil. Tapi kau berani datang. Itu sudah cukup untuk membuatku bangun.' },
      ],
      phase2: [
        { speaker: 'Gorath', text: 'Lantai ini bukan batu. Ini tulang leluhurku. Hentakanmu menghina mereka.' },
      ],
      phase3: [
        { speaker: 'Gorath', text: 'Kawanan di luar sudah mendengar aumanku. Mereka akan datang setelah ini selesai.' },
      ],
      phase4: [
        { speaker: 'Gorath', text: 'Satu hentakan terakhir. Kalau kau masih berdiri, tanah ini milikmu.' },
      ],
      defeat: [
        { speaker: 'Gorath', text: 'Aum pertama... dan aum terakhir. Jangan lupakan suaranya.' },
      ],
    },
  },
  aethron_origin: {
    name: 'Aethron, the Origin Beyond',
    title: 'Ultimate Architect of the First Flame',
    maxHp: 4200,
    w: 150,
    h: 160,
    contact: 30,
    ashReward: 1200,
    reward: 'victory',
    music: 'frontierBoss',
    color: '#f72585',
    maxPhases: 5,
    phaseThresholds: [0.8, 0.6, 0.4, 0.2],
    pattern: 'summon',
    summonType: 'origin_wisp',
    spawn: { x: 700, y: FRONTIER_FLOOR_Y - 160 },
    dialogue: {
      intro: [
        { speaker: 'Aethron', text: 'Aku menyalakan api pertama, lalu mundur ke sini untuk melihat apa yang dilakukan dunia dengan pinjaman itu.' },
        { speaker: 'Aethron', text: 'Seratus tingkat, sepuluh penjaga, dan kau masih memegang pedang yang sama. Aku suka itu.' },
      ],
      phase2: [
        { speaker: 'Aethron', text: 'Kau belajar dari setiap penjaga. Sayangnya, mereka semua belajar dariku.' },
      ],
      phase3: [
        { speaker: 'Aethron', text: 'Dimensi ini menahan benua, laut, gurun, mesin, dan mayat. Kalau kau merobohkannya, semuanya ikut jatuh.' },
      ],
      phase4: [
        { speaker: 'Aethron', text: 'Kau sudah sampai sejauh ini tanpa meminta apa pun. Itu membuat bagian ini terasa tidak adil.' },
      ],
      phase5: [
        { speaker: 'Aethron', text: 'Baiklah. Api terakhir ini bukan untuk menghanguskanmu. Ini untuk melihat apakah kau bisa memegangnya.' },
      ],
      defeat: [
        { speaker: 'Aethron', text: 'Api pertama... sekarang punya dua tangan yang menjaganya. Itu lebih baik daripada satu.' },
        { speaker: 'Aethron', text: 'Pulanglah. Dan kalau kau lupa, ingat: dunia ini tidak diselamatkan oleh sumpah, tapi oleh yang menepatinya.' },
      ],
    },
  },
};

export const FRONTIER_BOSS_BY_CHAPTER = Object.fromEntries(
  FRONTIER_CHAPTERS.map((chapter) => [chapter.number, chapter.bossId]),
);

// ── difficulty ─────────────────────────────────────────────────────────────
export function frontierLevelScale(index) {
  const i = Math.max(0, Math.min(FRONTIER_LEVEL_COUNT - 1, Math.trunc(Number(index)) || 0));
  return 1 + i * 0.012;
}

export function frontierDamageScale(index) {
  const i = Math.max(0, Math.min(FRONTIER_LEVEL_COUNT - 1, Math.trunc(Number(index)) || 0));
  return 1 + i * 0.006;
}

/**
 * The ladder has no character levels, so the run itself carries the growth:
 * a Frontier entry multiplies the player's damage and vitality by the level
 * index. It is run-scoped (re-applied on every entry) and never touches the
 * saved character or the global difficulty.
 */
export function frontierPlayerScale(index) {
  const i = Math.max(0, Math.min(FRONTIER_LEVEL_COUNT - 1, Math.trunc(Number(index)) || 0));
  return 1 + i * 0.018;
}

export function frontierVitalityScale(index) {
  const i = Math.max(0, Math.min(FRONTIER_LEVEL_COUNT - 1, Math.trunc(Number(index)) || 0));
  return 1 + i * 0.01;
}

export function frontierFlaskBonus(index) {
  const i = Math.max(0, Math.min(FRONTIER_LEVEL_COUNT - 1, Math.trunc(Number(index)) || 0));
  return Math.floor(i / 25);
}

export function frontierSpeedScale(index) {
  const i = Math.max(0, Math.min(FRONTIER_LEVEL_COUNT - 1, Math.trunc(Number(index)) || 0));
  return 1 + Math.floor(i / 25) * 0.06;
}

export function frontierAshStipend(index) {
  const i = Math.max(0, Math.min(FRONTIER_LEVEL_COUNT - 1, Math.trunc(Number(index)) || 0));
  return 120 + i * 4;
}

// ── layouts ────────────────────────────────────────────────────────────────
function floor(x, y, w, h) {
  return { x, y, w, h };
}

const LAYOUTS = [
  // 0 — terraces
  (boss) => (boss
    ? [floor(0, FRONTIER_FLOOR_Y, FRONTIER_WORLD_W, 70), floor(150, 350, 190, 18), floor(1070, 350, 190, 18), floor(590, 300, 220, 18), floor(320, 232, 170, 18), floor(910, 232, 170, 18)]
    : [floor(0, FRONTIER_FLOOR_Y, FRONTIER_WORLD_W, 70), floor(240, 372, 200, 18), floor(600, 318, 210, 18), floor(980, 372, 190, 18)]),
  // 1 — split floor with a bridge
  (boss) => (boss
    ? [floor(0, FRONTIER_FLOOR_Y, FRONTIER_WORLD_W, 70), floor(110, 330, 210, 18), floor(1080, 330, 210, 18), floor(560, 268, 280, 18)]
    : [floor(0, FRONTIER_FLOOR_Y, 500, 70), floor(660, FRONTIER_FLOOR_Y, 740, 70), floor(520, 388, 120, 18), floor(820, 330, 200, 18), floor(1140, 392, 150, 18)]),
  // 2 — towers
  (boss) => (boss
    ? [floor(0, FRONTIER_FLOOR_Y, FRONTIER_WORLD_W, 70), floor(300, 340, 170, 18), floor(930, 340, 170, 18), floor(640, 260, 180, 18)]
    : [floor(0, FRONTIER_FLOOR_Y, FRONTIER_WORLD_W, 70), floor(180, 340, 150, 18), floor(430, 272, 150, 18), floor(760, 320, 160, 18), floor(1080, 268, 160, 18)]),
  // 3 — long hall with side ledges
  (boss) => (boss
    ? [floor(0, FRONTIER_FLOOR_Y, FRONTIER_WORLD_W, 70), floor(150, 320, 150, 18), floor(1100, 320, 150, 18), floor(480, 262, 200, 18), floor(760, 262, 200, 18)]
    : [floor(0, FRONTIER_FLOOR_Y, FRONTIER_WORLD_W, 70), floor(160, 360, 240, 18), floor(700, 300, 240, 18), floor(1030, 372, 220, 18)]),
];

function platformsFor(index, boss) {
  return LAYOUTS[index % LAYOUTS.length](boss).map((p) => ({ ...p }));
}

// ── deterministic rosters ─────────────────────────────────────────────────
const ROOM_PATTERN = [6, 5, 4, 4]; // 19 normal bodies, four archetypes

function rosterFor(spec, index) {
  const chapterOffset = (spec.chapter - 11) * 4;
  const normals = BODY_SPECS.slice(chapterOffset, chapterOffset + 4).map((body) => body[0]);
  const hpScale = frontierLevelScale(index);
  const dmgScale = frontierDamageScale(index);
  const speedScale = frontierSpeedScale(index);
  const out = [];
  let cursor = 0;
  ROOM_PATTERN.forEach((count, groupIndex) => {
    for (let i = 0; i < count; i += 1) {
      const step = (cursor * 137 + index * 211 + i * 53) % 1000;
      const x = 180 + step;
      out.push({
        type: normals[groupIndex],
        x,
        minX: Math.max(120, x - 170),
        maxX: Math.min(FRONTIER_WORLD_W - 120, x + 170),
        hpScale: Math.round(hpScale * 100) / 100,
        dmgScale: Math.round(dmgScale * 100) / 100,
        speedScale: Math.round(speedScale * 100) / 100,
      });
      cursor += 1;
    }
  });
  const pool = CHAPTER_ELITES[spec.chapter] || [ELITE_MOBS[0].id];
  const elite = pool[index % pool.length];
  const eliteX = 520 + ((index * 173) % 460);
  out.push({
    type: elite,
    x: eliteX,
    minX: Math.max(300, eliteX - 240),
    maxX: Math.min(FRONTIER_WORLD_W - 120, eliteX + 240),
    elite: true,
    eliteRank: BODY_INFO[elite]?.eliteRank || FRONTIER_ELITE_INFO[elite]?.eliteRank || 'E1',
    hpScale: Math.round((1 + index * 0.004) * 100) / 100,
    dmgScale: Math.round((1 + index * 0.002) * 100) / 100,
  });
  return out;
}

function gateTo(id, requires, name) {
  return { x: 1362, y: 286, w: 34, h: 184, requires, next: id + 1, name };
}

// ── rooms ──────────────────────────────────────────────────────────────────
export const FRONTIER_ROOMS = FRONTIER_LEVEL_SPECS.map((spec, index) => {
  const chapter = FRONTIER_CHAPTERS[spec.chapter - 11];
  const id = FRONTIER_GLOBAL_START + index;
  const isBoss = !!spec.boss;
  const last = spec.level === FRONTIER_LAST_LEVEL;
  const room = {
    id,
    frontier: true,
    frontierIndex: index,
    frontierLevel: spec.level,
    frontierChapter: spec.chapter,
    name: spec.name,
    subtitle: `${chapter.english} · Lv ${spec.level}`,
    zone: FRONTIER_ZONE_ID,
    accent: chapter.color,
    palette: { ...PALETTES[spec.chapter] },
    particle: PARTICLES[spec.chapter],
    music: 'frontier',
    spawn: { x: 70, y: FRONTIER_FLOOR_Y - 46 },
    platforms: platformsFor(index, isBoss),
    enemies: isBoss ? [] : rosterFor(spec, index),
    boss: isBoss ? chapter.bossId : null,
    hint: `${spec.feature}. ${chapter.mechanic}`,
    gate: last ? null : gateTo(id, isBoss ? 'boss' : 'clear', FRONTIER_LEVEL_SPECS[index + 1]?.name || 'Batas Tak Berujung'),
  };
  // Every boss seat and every fifth room gets a Warung Abu (CLAUDE.md rule 11).
  if (index % 5 === 0 || isBoss) {
    room.checkpoint = { x: 74, y: FRONTIER_FLOOR_Y - 78, w: 38, h: 78, name: 'Warung Abu' };
    room.merchant = { x: 152, y: FRONTIER_FLOOR_Y - 96, w: 46, h: 96 };
  }
  return room;
});

export const FRONTIER_ROOM_BY_ID = Object.fromEntries(FRONTIER_ROOMS.map((room) => [room.id, room]));

export const FRONTIER_CHAPTER_META = FRONTIER_CHAPTERS.map((chapter, chapterIndex) => {
  const rooms = FRONTIER_ROOMS.filter((room) => room.frontierChapter === chapter.number);
  return {
    number: chapter.number,
    id: chapter.id,
    name: chapter.name,
    english: chapter.english,
    color: chapter.color,
    biome: chapter.biome,
    mechanic: chapter.mechanic,
    bossId: chapter.bossId,
    bossName: FRONTIER_BOSS_INFO[chapter.bossId]?.name || chapter.bossName,
    bossPhases: FRONTIER_BOSS_INFO[chapter.bossId]?.maxPhases || 3,
    firstIndex: chapterIndex * FRONTIER_ROOMS_PER_CHAPTER,
    firstLevel: chapter.levelStart,
    lastLevel: chapter.levelEnd,
    firstRoom: rooms[0]?.id ?? null,
    lastRoom: rooms.at(-1)?.id ?? null,
    rooms: rooms.length,
    elites: CHAPTER_ELITES[chapter.number] || [],
  };
});

export const FRONTIER_CHAPTER_BY_LEVEL = Object.fromEntries(
  FRONTIER_ROOMS.map((room) => [room.frontierLevel, room.frontierChapter]),
);

// ── lookups ────────────────────────────────────────────────────────────────
const toIndex = (value) => {
  const n = Math.trunc(Number(value));
  if (!Number.isInteger(n) || n < 0 || n >= FRONTIER_LEVEL_COUNT) return -1;
  return n;
};

export function frontierRoomForIndex(index) {
  const i = toIndex(index);
  return i < 0 ? null : FRONTIER_ROOMS[i];
}

export function frontierIndexForRoom(roomId) {
  if (!Number.isInteger(roomId)) return -1;
  return roomId - FRONTIER_GLOBAL_START;
}

export function frontierRoomForLevel(level) {
  const n = Math.trunc(Number(level));
  if (!Number.isInteger(n) || n < FRONTIER_FIRST_LEVEL || n > FRONTIER_LAST_LEVEL) return null;
  return FRONTIER_ROOMS[n - FRONTIER_FIRST_LEVEL] || null;
}

export function frontierChapterForLevel(level) {
  const room = frontierRoomForLevel(level);
  return room ? FRONTIER_CHAPTER_META[room.frontierChapter - 11] : null;
}

export function frontierRoomIsBoss(index) {
  const room = frontierRoomForIndex(index);
  return !!room?.boss;
}

// ── progression ────────────────────────────────────────────────────────────
export function defaultFrontierCampaignProgress() {
  return {
    version: FRONTIERS_VERSION,
    levels: Array.from({ length: FRONTIER_LEVEL_COUNT }, () => false),
    bosses: Array.from({ length: FRONTIER_CHAPTER_COUNT }, () => false),
    discovered: Array.from({ length: FRONTIER_LEVEL_COUNT }, (_, i) => i === 0),
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

export function sanitizeFrontierCampaignProgress(raw) {
  const base = defaultFrontierCampaignProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const levels = Array.from({ length: FRONTIER_LEVEL_COUNT }, (_, i) => raw.levels?.[i] === true);
  // Clear order is strict: a level can only be cleared when the one before it is.
  for (let i = 1; i < levels.length; i += 1) {
    if (levels[i] && !levels[i - 1]) levels[i] = false;
  }
  const bosses = Array.from({ length: FRONTIER_CHAPTER_COUNT }, (_, chapter) => {
    const seat = chapter * FRONTIER_ROOMS_PER_CHAPTER + FRONTIER_ROOMS_PER_CHAPTER - 1;
    return raw.bosses?.[chapter] === true && levels[seat];
  });
  const discovered = Array.from({ length: FRONTIER_LEVEL_COUNT }, (_, i) => (
    i === 0 ? true : raw.discovered?.[i] === true || levels[i] || levels[i - 1]
  ));
  return {
    version: FRONTIERS_VERSION,
    levels,
    bosses,
    discovered,
    runs: toInt(raw.runs, 0, 999999),
    deaths: toInt(raw.deaths, 0, 999999),
    bossClears: toInt(raw.bossClears, 0, 999999),
    bestTime: toSeconds(raw.bestTime),
    lastTime: toSeconds(raw.lastTime),
  };
}

/** Infinite Frontiers opens once The Oathbreaker falls. */
export function frontierCampaignUnlocked(progress) {
  if (!progress || typeof progress !== 'object') return false;
  const cleared = Array.isArray(progress.cleared) ? progress.cleared : [];
  return cleared[7] === true;
}

export function frontierLevelUnlocked(state, index) {
  const safe = sanitizeFrontierCampaignProgress(state);
  const i = toIndex(index);
  if (i < 0) return false;
  if (i === 0) return true;
  return safe.levels[i - 1] === true;
}

export function frontierLevelCleared(state, index) {
  const safe = sanitizeFrontierCampaignProgress(state);
  const i = toIndex(index);
  return i >= 0 ? safe.levels[i] === true : false;
}

export function recordFrontierLevel(state, index) {
  const safe = state || defaultFrontierCampaignProgress();
  const i = toIndex(index);
  if (i < 0) return { ok: false };
  if (!frontierLevelUnlocked(safe, i)) return { ok: false, reason: 'locked' };
  const firstClear = safe.levels[i] !== true;
  safe.levels[i] = true;
  safe.discovered[i] = true;
  if (safe.discovered[i + 1] !== undefined) safe.discovered[i + 1] = true;
  const chapterIndex = Math.floor(i / FRONTIER_ROOMS_PER_CHAPTER);
  const isSeat = i % FRONTIER_ROOMS_PER_CHAPTER === FRONTIER_ROOMS_PER_CHAPTER - 1;
  let bossFirstClear = false;
  if (isSeat) {
    bossFirstClear = safe.bosses[chapterIndex] !== true;
    safe.bosses[chapterIndex] = true;
    if (bossFirstClear) safe.bossClears += 1;
  }
  return {
    ok: true,
    firstClear,
    bossFirstClear,
    chapter: chapterIndex + 11,
    bossUnlocked: isSeat,
    complete: safe.levels.every(Boolean),
  };
}

export function recordFrontierRun(state, seconds = 0, died = false) {
  const safe = state || defaultFrontierCampaignProgress();
  safe.runs += 1;
  if (died) safe.deaths += 1;
  const time = toSeconds(seconds);
  if (time > 0) {
    safe.lastTime = time;
    if (safe.bestTime === 0 || time < safe.bestTime) safe.bestTime = time;
  }
  return safe;
}

export function frontierCampaignSummary(state) {
  const safe = sanitizeFrontierCampaignProgress(state);
  const cleared = safe.levels.filter(Boolean).length;
  const bosses = safe.bosses.filter(Boolean).length;
  return {
    name: FRONTIERS_NAME,
    localName: FRONTIERS_LOCAL_NAME,
    levelsCleared: cleared,
    levelTotal: FRONTIER_LEVEL_COUNT,
    bossesCleared: bosses,
    bossTotal: FRONTIER_CHAPTER_COUNT,
    percent: Math.round((cleared / FRONTIER_LEVEL_COUNT) * 100),
    complete: cleared === FRONTIER_LEVEL_COUNT,
    runs: safe.runs,
    deaths: safe.deaths,
    bestTime: safe.bestTime,
    discovered: safe.discovered.map(Boolean),
    levels: safe.levels.slice(),
    bosses: safe.bosses.slice(),
  };
}

export function frontierChapterProgress(state, chapterNumber) {
  const safe = sanitizeFrontierCampaignProgress(state);
  const chapterIndex = Math.trunc(Number(chapterNumber)) - 11;
  if (chapterIndex < 0 || chapterIndex >= FRONTIER_CHAPTER_COUNT) return null;
  const start = chapterIndex * FRONTIER_ROOMS_PER_CHAPTER;
  const levels = safe.levels.slice(start, start + FRONTIER_ROOMS_PER_CHAPTER);
  return {
    chapter: chapterIndex + 11,
    cleared: levels.filter(Boolean).length,
    total: FRONTIER_ROOMS_PER_CHAPTER,
    bossCleared: safe.bosses[chapterIndex],
    clearedLevels: levels,
  };
}

/** Structural validation used by tests and the content checker. */
export function validateFrontierRooms(rooms = FRONTIER_ROOMS) {
  const errors = [];
  const ids = new Set(rooms.map((room) => room.id));
  for (let i = 0; i < rooms.length; i += 1) {
    const room = rooms[i];
    if (room.id !== FRONTIER_GLOBAL_START + i) errors.push(`room ${i} id ${room.id} is not contiguous`);
    if (room.frontierLevel !== FRONTIER_FIRST_LEVEL + i) errors.push(`room ${room.id} level ${room.frontierLevel} is out of order`);
    const gates = room.gates || (room.gate ? [room.gate] : []);
    for (const gate of gates) {
      if (gate.next != null && !ids.has(gate.next)) errors.push(`room ${room.id} gate -> ${gate.next} is missing`);
    }
    if (!room.boss && !gates.length) errors.push(`room ${room.id} needs an exit`);
    if (room.boss && FRONTIER_BOSS_INFO[room.boss]?.reward === 'victory' && gates.length) {
      errors.push(`room ${room.id} victory boss must not open a gate`);
    }
    for (const enemy of room.enemies) {
      if (!FRONTIER_ENEMY_INFO[enemy.type] && !FRONTIER_ELITE_INFO[enemy.type]) {
        errors.push(`room ${room.id} enemy ${enemy.type} is unknown`);
      }
      if (!(enemy.minX < enemy.x && enemy.x < enemy.maxX)) errors.push(`room ${room.id} ${enemy.type} patrol is invalid`);
    }
  }
  for (const room of rooms.filter((entry) => !entry.boss)) {
    if (room.enemies.length !== FRONTIER_ENEMIES_PER_ROOM) {
      errors.push(`room ${room.id} has ${room.enemies.length} enemies, expected ${FRONTIER_ENEMIES_PER_ROOM}`);
    }
    const elites = room.enemies.filter((enemy) => enemy.elite || FRONTIER_ELITE_INFO[enemy.type]?.elite);
    if (elites.length !== FRONTIER_ELITE_COUNT) errors.push(`room ${room.id} has ${elites.length} elites, expected ${FRONTIER_ELITE_COUNT}`);
    // The contract counts the four standard archetypes; the guaranteed elite
    // brings its own behaviour on top and must not inflate the number.
    const archetypes = new Set(room.enemies
      .filter((enemy) => !(enemy.elite || FRONTIER_ELITE_INFO[enemy.type]?.elite))
      .map((enemy) => FRONTIER_ENEMY_INFO[enemy.type]?.behavior || FRONTIER_ELITE_INFO[enemy.type]?.behavior));
    if (archetypes.size !== 4) errors.push(`room ${room.id} uses ${archetypes.size} archetypes, expected 4`);
  }
  for (const [kind, boss] of Object.entries(FRONTIER_BOSS_INFO)) {
    const thresholds = boss.phaseThresholds || [];
    if (boss.maxPhases < 3 || boss.maxPhases > 5) errors.push(`boss ${kind} has ${boss.maxPhases} phases`);
    if (thresholds.length !== boss.maxPhases - 1) errors.push(`boss ${kind} threshold count does not match phases`);
    for (let i = 1; i < thresholds.length; i += 1) {
      if (thresholds[i] >= thresholds[i - 1]) errors.push(`boss ${kind} thresholds are not descending`);
    }
    for (const key of ['intro', 'defeat', ...Array.from({ length: boss.maxPhases - 1 }, (_, i) => `phase${i + 2}`)]) {
      if (!Array.isArray(boss.dialogue?.[key]) || !boss.dialogue[key].length) errors.push(`boss ${kind} missing ${key} dialogue`);
    }
  }
  return errors;
}
