// Ashen Vow v0.8.0 — Hearthfall: The Hollow Court.
//
// A self-contained content layer that plugs into the existing engine the same
// way the expansion and Atlas layers do:
//   • 6 zones x 10 rooms (global indices 354-413) appended to ALL_ROOMS
//   • 24 enemies, 12 multi-phase bosses with full dialogue
//   • 8 data-driven weapons + 12 equippable tools
//   • a player house with 6 upgradable rooms, 24 furnishings, and 8 NPCs
//   • permanent save data under progress.court
//
// This module is deliberately dependency-free. core.js imports it, never the
// other way around, so Node tests can load it without DOM or browser APIs.

export const COURT_VERSION = '0.8.0';
export const COURT_NAME = 'Hearthfall — The Hollow Court';
export const COURT_ROOM_START = 354; // immediately after the 240 Atlas rooms
export const COURT_ROOM_COUNT = 60;
export const COURT_ZONE_COUNT = 6;
export const COURT_ROOMS_PER_ZONE = 10;
export const FLOOR_Y = 470;
export const WORLD_W = 1400;
export const COURT_PROGRESS_VERSION = 1;

const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);
const asInt = (value, fallback = 0) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
};
const asBool = (value) => value === true;

// ── zones ──────────────────────────────────────────────────────────────────
const ZONE_SOURCE = [
  {
    id: 'hearthfall',
    name: 'Hearthfall',
    localName: 'Pendopo Abu',
    subtitle: 'Rumah yang Menolak Padam',
    color: '#e08a4a',
    glow: '#ffb066',
    fog: '#4a2a18',
    palette: {
      top: '#100806',
      mid: '#241410',
      low: '#3a1f14',
      glow: '#e08a4a',
      fog: '#4a2a18',
    },
    particle: 'embers',
    music: 'hearthfall',
    hero: 'Perapian terakhir Opus masih menyala di sini. Setiap bara mengingat nama pemiliknya.',
    hazard: 'Bara yang bangkit dari lantai.',
    weather: 'Abu hangat turun pelan',
    condition: 'Perapian Agung menyala redup',
    boss: 'court_boss_hearthmother',
    miniBoss: 'court_mini_steward',
    enemies: ['ember_thrall', 'ash_hound', 'kiln_wisp', 'slag_brute'],
    names: {
      entry: 'Serambi Perapian',
      combat: ['Dapur Terbakar', 'Lorong Bara', 'Gudang Arang', 'Aula Tungku', 'Ruang Jelaga'],
      elite: 'Tungku Penjaga',
      puzzle: 'Relung Bara Pertama',
      rest: 'Meja Panjang',
      boss: 'Perapian Agung',
    },
  },
  {
    id: 'glassorchard',
    name: 'Glass Orchard',
    localName: 'Kebun Kaca',
    subtitle: 'Buah yang Tidak Pernah Matang',
    color: '#8fc9a8',
    glow: '#c8f0d8',
    fog: '#243a34',
    palette: {
      top: '#06100d',
      mid: '#0f2420',
      low: '#163a30',
      glow: '#8fc9a8',
      fog: '#243a34',
    },
    particle: 'petals',
    music: 'glassorchard',
    hero: 'Pohon-pohon kaca tumbuh dari doa yang tidak dijawab. Buahnya berkilau, isinya duri.',
    hazard: 'Serpihan kaca yang berjatuhan.',
    weather: 'Kelopak kaca melayang',
    condition: 'Kebun bernyanyi tanpa angin',
    boss: 'court_boss_orchardsaint',
    miniBoss: 'court_mini_prunedchoir',
    enemies: ['glass_hopper', 'thorn_spitter', 'orchard_keeper', 'bloom_mother'],
    names: {
      entry: 'Gerbang Kebun',
      combat: ['Baris Pohon Kaca', 'Rumah Kaca Retak', 'Lorong Duri', 'Kebun Buah Pahit', 'Sumur Kaca'],
      elite: 'Kios Penjaga',
      puzzle: 'Pohon Pertama',
      rest: 'Kursi Pemangkas',
      boss: 'Singgasana Kaca',
    },
  },
  {
    id: 'hollowcourt',
    name: 'The Hollow Court',
    localName: 'Istana Rongga',
    subtitle: 'Tahta yang Menunggu Nama',
    color: '#b28fd8',
    glow: '#e0c8ff',
    fog: '#2e2440',
    palette: {
      top: '#08060f',
      mid: '#171026',
      low: '#261a3c',
      glow: '#b28fd8',
      fog: '#2e2440',
    },
    particle: 'motes',
    music: 'hollowcourt',
    hero: 'Istana tanpa raja, tanpa penonton, tanpa akhir. Setiap kursi kosong menuntut pengisi.',
    hazard: 'Bayangan yang menebas dari lantai.',
    weather: 'Debu istana berputar',
    condition: 'Lonceng kosong bergema',
    boss: 'court_boss_nameless',
    miniBoss: 'court_mini_regent',
    enemies: ['court_shade', 'hollow_duelist', 'echo_priest', 'throne_sentinel'],
    names: {
      entry: 'Gerbang Rongga',
      combat: ['Aula Kursi Kosong', 'Galeri Bayangan', 'Ruang Gema', 'Lorong Mahkota', 'Balkon Sunyi'],
      elite: 'Kursi Wali',
      puzzle: 'Relung Nama Pertama',
      rest: 'Meja Rongga',
      boss: 'Tahta Tanpa Nama',
    },
  },
  {
    id: 'cinderworks',
    name: 'Cinderworks',
    localName: 'Pabrik Abu',
    subtitle: 'Tempa yang Tidak Pernah Tidur',
    color: '#d96a4a',
    glow: '#ffb08a',
    fog: '#3a241c',
    palette: {
      top: '#0d0604',
      mid: '#24110c',
      low: '#3a1a12',
      glow: '#d96a4a',
      fog: '#3a241c',
    },
    particle: 'embers',
    music: 'cinderworks',
    hero: 'Palu-palu raksasa menempa senjata untuk perang yang sudah selesai. Abu para pekerja masih mengepul dari cerobong.',
    hazard: 'Percikan logam cair dari lantai tempa.',
    weather: 'Jelaga tebal turun seperti salju',
    condition: 'Tungku raksasa bekerja tanpa tangan',
    boss: 'court_boss_forgeking',
    miniBoss: 'court_mini_bellows',
    enemies: ['soot_artisan', 'chain_hound', 'bellows_wraith', 'forge_colossus'],
    names: {
      entry: 'Gerbang Pabrik',
      combat: ['Lantai Tempa', 'Lorong Rantai', 'Ruang Ketel', 'Aula Cetakan', 'Sumur Logam'],
      elite: 'Tungku Penjaga',
      puzzle: 'Cetakan Pertama',
      rest: 'Kantin Pekerja',
      boss: 'Jantung Tungku',
    },
  },
  {
    id: 'lastvigil',
    name: 'Last Vigil',
    localName: 'Menara Jaga',
    subtitle: 'Api yang Menunggu Fajar',
    color: '#7fa8d8',
    glow: '#c0dcff',
    fog: '#223448',
    palette: {
      top: '#050a12',
      mid: '#101d2c',
      low: '#1b2e45',
      glow: '#7fa8d8',
      fog: '#223448',
    },
    particle: 'snow',
    music: 'lastvigil',
    hero: 'Menara terakhir yang masih menyalakan api jaga. Setiap penjaga di sini sudah lupa siapa yang mereka tunggu.',
    hazard: 'Panah dari balkon yang tidak terlihat.',
    weather: 'Salju tipis menutupi tangga',
    condition: 'Lonceng jaga berbunyi sekali',
    boss: 'court_boss_lastwatch',
    miniBoss: 'court_mini_vigil',
    enemies: ['vigil_archer', 'oath_sworn', 'lantern_ghost', 'tower_golem'],
    names: {
      entry: 'Kaki Menara',
      combat: ['Tangga Berliku', 'Balkon Jaga', 'Ruang Panah', 'Aula Penjaga', 'Puncak Beku'],
      elite: 'Kapten Jaga',
      puzzle: 'Api Terakhir',
      rest: 'Ruang Obor',
      boss: 'Puncak Fajar',
    },
  },
  {
    id: 'reliquary',
    name: 'The Ashen Reliquary',
    localName: 'Relikui Abu',
    subtitle: 'Sumpah yang Dikubur di Bawah Fajar',
    color: '#d8b45c',
    glow: '#ffe0a0',
    fog: '#3a2c18',
    palette: {
      top: '#0d0903',
      mid: '#231a0d',
      low: '#3a2a12',
      glow: '#d8b45c',
      fog: '#3a2c18',
    },
    particle: 'stars',
    music: 'reliquary',
    hero: 'Di bawah menara, relikui menyimpan sumpah pertama yang tidak pernah selesai. Debu emas menutupi nama para penjaga.',
    hazard: 'Cahaya relik yang membakar bayangan.',
    weather: 'Debu emas melayang tanpa henti',
    condition: 'Relikui bernyanyi dengan suara Opus',
    boss: 'court_boss_firstvow',
    miniBoss: 'court_mini_sexton',
    enemies: ['reliquary_warden', 'ash_seraph', 'vow_echo', 'stone_penitent'],
    names: {
      entry: 'Gerbang Relikui',
      combat: ['Lorong Emas', 'Ruang Nama', 'Aula Peti', 'Lorong Sumpah', 'Sumur Relik'],
      elite: 'Penjaga Peti',
      puzzle: 'Relik Pertama',
      rest: 'Meja Pendeta',
      boss: 'Sumpah Pertama',
    },
  },
];

export const COURT_ZONES = ZONE_SOURCE.map((zone, index) => ({
  ...zone,
  index,
  roomStart: COURT_ROOM_START + index * COURT_ROOMS_PER_ZONE,
  levelStart: 1 + index * COURT_ROOMS_PER_ZONE,
  bossMusic: 'courtBoss',
}));

export const COURT_ZONE_BY_ID = Object.fromEntries(COURT_ZONES.map((zone) => [zone.id, zone]));
export const COURT_ZONE_IDS = COURT_ZONES.map((zone) => zone.id);

// ── enemies ────────────────────────────────────────────────────────────────
const ENEMY_SOURCE = [
  // Hearthfall
  ['ember_thrall', 'Ember Thrall', 'Pelayan Bara', 'chaser', 62, 11, 76, 38, 42, 11, '#e08a4a'],
  ['ash_hound', 'Ash Hound', 'Anjing Jelaga', 'lunge', 84, 14, 104, 46, 30, 14, '#c96a3a'],
  ['kiln_wisp', 'Kiln Wisp', 'Api Tungku', 'ranged', 54, 12, 62, 30, 38, 13, '#ffb066'],
  ['slag_brute', 'Slag Brute', 'Raksasa Terak', 'slam', 168, 20, 54, 58, 66, 20, '#a8502e'],
  // Glass Orchard
  ['glass_hopper', 'Glass Hopper', 'Belalang Kaca', 'hopper', 58, 13, 96, 36, 32, 13, '#8fc9a8'],
  ['thorn_spitter', 'Thorn Spitter', 'Penyembur Duri', 'ranged', 72, 15, 66, 38, 42, 15, '#6fae7f'],
  ['orchard_keeper', 'Orchard Keeper', 'Pemangkas', 'lunge', 118, 18, 92, 44, 54, 18, '#b8d8a0'],
  ['bloom_mother', 'Bloom Mother', 'Induk Kembang', 'spawner', 196, 16, 46, 62, 72, 22, '#c8e8b8'],
  // Hollow Court
  ['court_shade', 'Court Shade', 'Bayangan Istana', 'chaser', 86, 17, 88, 38, 48, 17, '#b28fd8'],
  ['hollow_duelist', 'Hollow Duelist', 'Duelis Kosong', 'lunge', 126, 21, 108, 42, 54, 21, '#9b78c8'],
  ['echo_priest', 'Echo Priest', 'Pendeta Gema', 'ranged', 90, 19, 70, 38, 50, 19, '#d8b8ff'],
  ['throne_sentinel', 'Throne Sentinel', 'Penjaga Tahta', 'slam', 220, 24, 50, 62, 72, 24, '#8060b0'],
  // Cinderworks
  ['soot_artisan', 'Soot Artisan', 'Pandai Jelaga', 'chaser', 96, 18, 80, 44, 44, 18, '#d96a4a'],
  ['chain_hound', 'Chain Hound', 'Anjing Rantai', 'lunge', 124, 22, 116, 50, 36, 20, '#b85838'],
  ['bellows_wraith', 'Bellows Wraith', 'Arwah Ubun-ubun', 'ranged', 88, 20, 68, 40, 52, 19, '#ff9a6a'],
  ['forge_colossus', 'Forge Colossus', 'Raksasa Tempa', 'slam', 260, 28, 48, 68, 78, 28, '#a8442c'],
  // Last Vigil
  ['vigil_archer', 'Vigil Archer', 'Pemanah Jaga', 'ranged', 104, 24, 72, 40, 54, 22, '#7fa8d8'],
  ['oath_sworn', 'Oath-Sworn', 'Penjaga Sumpah', 'lunge', 160, 27, 102, 46, 58, 24, '#9ec4e8'],
  ['lantern_ghost', 'Lantern Ghost', 'Hantu Lentera', 'chaser', 124, 21, 94, 38, 50, 21, '#c0dcff'],
  ['tower_golem', 'Tower Golem', 'Golem Menara', 'slam', 300, 31, 46, 76, 86, 32, '#6888b0'],
  // Ashen Reliquary
  ['reliquary_warden', 'Reliquary Warden', 'Penjaga Relikui', 'lunge', 190, 30, 108, 50, 62, 27, '#d8b45c'],
  ['ash_seraph', 'Ash Seraph', 'Serafim Abu', 'ranged', 150, 27, 74, 44, 58, 26, '#ffe0a0'],
  ['vow_echo', 'Vow Echo', 'Gema Sumpah', 'chaser', 168, 24, 96, 42, 52, 24, '#f0c878'],
  ['stone_penitent', 'Stone Penitent', 'Pertapa Batu', 'slam', 360, 35, 48, 80, 90, 38, '#b89448'],
];

export const COURT_ENEMY_INFO = {};
ENEMY_SOURCE.forEach(([id, name, localName, behavior, hp, dmg, speed, w, h, reward, color], index) => {
  const zone = COURT_ZONES[Math.floor(index / 4)];
  COURT_ENEMY_INFO[id] = {
    id,
    name,
    localName,
    title: localName,
    chapter: zone.index + 1,
    courtZone: zone.id,
    behavior,
    hp,
    dmg,
    speed,
    w,
    h,
    reward,
    flying: behavior === 'ranged',
    color,
    danger: ['RENDAH', 'SEDANG', 'TINGGI', 'EKSTREM'][Math.min(3, Math.floor(index / 4) + 1)],
    desc: `${localName} dari ${zone.localName}. Sisa sumpah yang menolak pergi.`,
    where: `${zone.name} — ${localName}`,
    glyph: ['◆', '✦', '✹'][index % 3],
    childType: id === 'bloom_mother' ? 'glass_hopper' : null,
  };
});

export const COURT_ENEMY_IDS = Object.keys(COURT_ENEMY_INFO);

// ── rooms ──────────────────────────────────────────────────────────────────
const ROOM_TEMPLATES = [
  'entry', 'combat', 'combat', 'combat', 'combat', 'combat',
  'elite', 'puzzle', 'rest', 'boss',
];

function platformsFor(zone, local, isBoss) {
  const high = 300 + ((local + zone.index) % 3) * 26;
  const side = 360 - ((local * 7 + zone.index * 13) % 40);
  const list = [
    { x: 0, y: FLOOR_Y, w: WORLD_W, h: 46 },
    { x: 210, y: high, w: 190, h: 18 },
    { x: 600, y: high - 48, w: 210, h: 18 },
    { x: 1010, y: side, w: 230, h: 18 },
  ];
  if (isBoss) {
    list.push({ x: 300, y: FLOOR_Y - 120, w: 150, h: 16 });
    list.push({ x: 950, y: FLOOR_Y - 120, w: 150, h: 16 });
  }
  return list;
}

function enemiesFor(zone, template, local, global) {
  if (template === 'entry' || template === 'rest') return [];
  const pool = zone.enemies;
  const count = template === 'elite' ? 2 : template === 'puzzle' ? 1 : 2 + (local % 2);
  const enemies = [];
  for (let i = 0; i < count; i++) {
    const type = pool[(local + i) % pool.length];
    const x = 300 + i * 300 + ((local * 29) % 60);
    enemies.push({
      type,
      x: clamp(x, 160, WORLD_W - 180),
      minX: 80,
      maxX: WORLD_W - 100,
      elite: template === 'elite' && i === 0,
      hpScale: 1 + zone.index * 0.08,
      dmgScale: 1 + zone.index * 0.06,
      speedScale: 1 + zone.index * 0.04,
    });
  }
  return enemies;
}

function gateFor(zone, local, global, template) {
  const next = global + 1;
  // Boss rooms still need an exit: the gate stays sealed until the blessing is
  // chosen, then leads into the first room of the next zone. The final arena
  // alone ends the run with victory and has no gate.
  if (local >= COURT_ROOMS_PER_ZONE - 1) {
    if (zone.index >= COURT_ZONES.length - 1) return null;
    return {
      x: 1362,
      y: 286,
      w: 34,
      h: 184,
      requires: 'boss',
      next,
      name: 'Jalan Berikutnya',
    };
  }
  return {
    x: 1362,
    y: 286,
    w: 34,
    h: 184,
    requires: template === 'boss' || template === 'elite' ? 'boss' : template === 'puzzle' ? 'relic' : 'clear',
    next,
    name: 'Jalan Berikutnya',
  };
}

function makeCourtRoom(zone, local) {
  const template = ROOM_TEMPLATES[local];
  const global = zone.roomStart + local;
  const names = zone.names;
  const name = template === 'entry'
    ? names.entry
    : template === 'boss'
      ? names.boss
      : template === 'elite'
        ? names.elite
        : template === 'puzzle'
          ? names.puzzle
          : template === 'rest'
            ? names.rest
            : names.combat[(local - 1) % names.combat.length];
  const isBoss = template === 'boss';
  const isMini = template === 'elite';
  const room = {
    id: global,
    court: true,
    courtZone: zone.id,
    courtZoneIndex: zone.index,
    courtLocal: local,
    courtTemplate: template,
    level: zone.levelStart + local,
    name,
    subtitle: `${zone.name} — ${zone.subtitle}`,
    zone: zone.id,
    spawn: { x: 80, y: FLOOR_Y - 46 },
    platforms: platformsFor(zone, local, isBoss || isMini),
    enemies: enemiesFor(zone, template, local, global),
    relic: template === 'puzzle'
      ? { x: 1170, y: 236, w: 26, h: 26, name: `Relik ${zone.localName}` }
      : null,
    boss: isBoss ? zone.boss : isMini ? zone.miniBoss : null,
    hint: isBoss
      ? `${COURT_BOSS_INFO[zone.boss]?.name || 'Penjaga'} menanti di ujung aula.`
      : isMini
        ? `Penjaga wilayah: ${COURT_BOSS_INFO[zone.miniBoss]?.name || 'Penjaga'}.`
        : template === 'puzzle'
          ? 'Ambil relik di platform tinggi untuk membuka gerbang.'
          : template === 'rest'
            ? 'Perapian kecil dan meja panjang. Tidak ada yang mengejar di sini.'
            : 'Bersihkan ruang dan lanjutkan perjalanan.',
    palette: { ...zone.palette },
    music: zone.music,
    condition: zone.condition,
    weather: zone.weather,
    accent: zone.color,
    gate: gateFor(zone, local, global, template),
  };
  if (template === 'entry' || template === 'rest') {
    room.checkpoint = { x: 74, y: FLOOR_Y - 78, w: 38, h: 78, name: `Perapian ${zone.localName}` };
    room.merchant = { x: 156, y: FLOOR_Y - 96, w: 46, h: 96 };
  }
  return room;
}

// ── bosses ─────────────────────────────────────────────────────────────────
const BOSS_SOURCE = [
  {
    kind: 'court_mini_steward',
    zone: 'hearthfall',
    name: 'Cinder Steward',
    localName: 'Pengurus Bara',
    title: 'The Hearthless',
    pattern: 'slam',
    maxHp: 560,
    w: 108,
    h: 120,
    contact: 15,
    phases: 3,
    mini: true,
    color: '#e08a4a',
    ashReward: 70,
    lines: [
      'Kau masuk tanpa mengetuk. Perapian ini tidak menerima tamu sejak rajanya pergi.',
      'Bara tidak padam. Ia hanya menunggu kayu yang cukup bodoh untuk membakarnya.',
      'Tungku ini bukan milikku. Aku hanya menjaga abunya.',
      'Ambil apinya... aku lelah menjaga...',
    ],
  },
  {
    kind: 'court_boss_hearthmother',
    zone: 'hearthfall',
    name: 'Mother Hearth',
    localName: 'Ibu Perapian',
    title: 'The Last Warmth',
    pattern: 'summon',
    maxHp: 760,
    w: 132,
    h: 142,
    contact: 19,
    phases: 4,
    mini: false,
    color: '#ffb066',
    ashReward: 120,
    lines: [
      'Setiap anak yang pulang dari perang makan di meja ini. Kau tidak pulang ke mana-mana.',
      'Api ini kupelihara dari abu suamiku. Jangan sentuh anak-anakku.',
      'Meja ini sudah terlalu banyak menerima tamu yang tidak pulang.',
      'Kalau kau ingin dapurnya, lewati dulu abuku.',
      'Kau boleh memakai dapurnya. Jangan biarkan ia dingin.',
    ],
  },
  {
    kind: 'court_mini_prunedchoir',
    zone: 'glassorchard',
    name: 'The Pruned Choir',
    localName: 'Koor yang Dipangkas',
    title: 'Garden of Severed Voices',
    pattern: 'volley',
    maxHp: 620,
    w: 112,
    h: 116,
    contact: 16,
    phases: 3,
    mini: true,
    color: '#8fc9a8',
    ashReward: 85,
    lines: [
      'Kami bernyanyi untuk buah yang tidak pernah sampai. Suaramu akan jadi nada baru.',
      'Setiap nada yang kau potong tumbuh kembali lebih tajam.',
      'Dengar... kebun mulai mengikuti nadamu...',
      'Diam... akhirnya diam...',
    ],
  },
  {
    kind: 'court_boss_orchardsaint',
    zone: 'glassorchard',
    name: 'The Orchard Saint',
    localName: 'Santo Kebun',
    title: 'Gilded Rot',
    pattern: 'rain',
    maxHp: 880,
    w: 128,
    h: 138,
    contact: 21,
    phases: 4,
    mini: false,
    color: '#c8f0d8',
    ashReward: 145,
    lines: [
      'Aku menanam doa mereka. Kau menuai durinya.',
      'Buah yang matang harus retak. Biarkan aku memetikmu.',
      'Akar-akar ini tidak pernah meminta tumbuh. Aku yang memaksa mereka.',
      'Kalau kau memetikku, siapa yang akan menjaga kebun?',
      'Akhirnya... kebun bisa membusuk dengan tenang...',
    ],
  },
  {
    kind: 'court_mini_regent',
    zone: 'hollowcourt',
    name: 'The Hollow Regent',
    localName: 'Wali Rongga',
    title: 'Keeper of Empty Seats',
    pattern: 'charge',
    maxHp: 720,
    w: 118,
    h: 124,
    contact: 19,
    phases: 4,
    mini: true,
    color: '#b28fd8',
    ashReward: 100,
    lines: [
      'Setiap kursi di aula ini menunggu raja. Kau bukan raja.',
      'Aku menjaga tahta dari jemari yang belum dicuci darah.',
      'Aula ini mengira kau adalah namanya. Aku tahu kau bukan.',
      'Kalau aku jatuh, kursi-kursi ini akan memilihmu.',
      'Kursi itu... terlalu besar untukku...',
    ],
  },
  {
    kind: 'court_boss_nameless',
    zone: 'hollowcourt',
    name: 'The Nameless Sovereign',
    localName: 'Penguasa Tanpa Nama',
    title: 'The Hollow Court',
    pattern: 'ring',
    maxHp: 1080,
    w: 140,
    h: 150,
    contact: 25,
    phases: 4,
    mini: false,
    final: false,
    color: '#e0c8ff',
    ashReward: 180,
    lines: [
      'Aku sudah lama tidak punya nama. Kau boleh meminjamkan namamu.',
      'Setiap nama yang kuambil membuat tahta ini sedikit lebih hangat.',
      'Tahta ini bukan milikku. Aku hanya nama yang tersisa di atasnya.',
      'Kau akan duduk di sini. Semua penjaga akhirnya duduk.',
      'Sebut namaku... sebut... nama...',
    ],
  },
  {
    kind: 'court_mini_bellows',
    zone: 'cinderworks',
    name: 'The Bellows Captain',
    localName: 'Kapten Penghembus',
    title: 'Breath of the Furnace',
    pattern: 'volley',
    maxHp: 760,
    w: 114,
    h: 120,
    contact: 18,
    phases: 3,
    mini: true,
    color: '#d96a4a',
    ashReward: 95,
    lines: [
      'Setiap tempaan di pabrik ini adalah napas terakhir seseorang. Kau akan jadi napas berikutnya.',
      'Penghembus tidak pernah berhenti. Ia hanya berganti paru-paru.',
      'Api di dadaku kepanasan. Dinginkan...',
      'Akhirnya aku bisa berhenti menghembus...',
    ],
  },
  {
    kind: 'court_boss_forgeking',
    zone: 'cinderworks',
    name: 'The Forge King',
    localName: 'Raja Tempa',
    title: 'Crown of Slag',
    pattern: 'summon',
    maxHp: 1260,
    w: 138,
    h: 146,
    contact: 23,
    phases: 4,
    mini: false,
    color: '#ff9a6a',
    ashReward: 180,
    lines: [
      'Aku menempa senjata untuk raja yang tidak pernah datang. Kau akan menggantikannya.',
      'Palu ini tidak pernah salah memilih logam. Kau terlalu lunak.',
      'Semua prajurit di pabrik ini adalah hadiahku untuk perang yang tak kunjung tiba.',
      'Mahkota ini terbuat dari terak. Rasanya persis seperti kemenangan.',
      'Ambil paluku. Biar tangan lain yang lelah...',
    ],
  },
  {
    kind: 'court_mini_vigil',
    zone: 'lastvigil',
    name: 'The Vigil Captain',
    localName: 'Kapten Jaga',
    title: 'The Watch That Never Sleeps',
    pattern: 'rain',
    maxHp: 820,
    w: 116,
    h: 124,
    contact: 19,
    phases: 3,
    mini: true,
    color: '#7fa8d8',
    ashReward: 110,
    lines: [
      'Api jaga tidak boleh padam. Kau membawa angin yang terlalu kencang.',
      'Aku sudah menjaga menara ini lebih lama dari namaku sendiri.',
      'Satu malam lagi. Aku hanya perlu satu malam lagi.',
      'Fajar... apakah fajar masih ada...',
    ],
  },
  {
    kind: 'court_boss_lastwatch',
    zone: 'lastvigil',
    name: 'The Dawnless Watch',
    localName: 'Penjaga Tanpa Fajar',
    title: 'The Last Light of Opus',
    pattern: 'ring',
    maxHp: 1460,
    w: 142,
    h: 150,
    contact: 26,
    phases: 4,
    mini: false,
    final: false,
    color: '#c0dcff',
    ashReward: 230,
    lines: [
      'Aku menunggu fajar sejak Opus terakhir padam. Kau datang membawa malam yang lain.',
      'Setiap penjaga yang naik ke menara ini meminta agar aku berhenti. Aku tidak pernah berhenti.',
      'Api ini bukan untuk menerangi jalan. Ia untuk memastikan seseorang masih ingat arah pulang.',
      'Kalau kau memadamkannya, aku tidak akan tahu siapa diriku lagi.',
      'Pergilah... dan bawa apinya ke bawah...',
    ],
  },
  {
    kind: 'court_mini_sexton',
    zone: 'reliquary',
    name: 'The Relic Sexton',
    localName: 'Juru Relik',
    title: 'Keeper of the First Vow',
    pattern: 'slam',
    maxHp: 980,
    w: 118,
    h: 126,
    contact: 21,
    phases: 3,
    mini: true,
    color: '#d8b45c',
    ashReward: 125,
    lines: [
      'Relikui ini tidak menyimpan benda. Ia menyimpan janji yang tidak boleh dibuka.',
      'Setiap peti di sini berisi nama penjaga yang gagal. Kau akan menambah satu.',
      'Debu emas ini adalah abu para saksi. Jangan biarkan mereka bangun.',
      'Tutup petiku... biarkan aku tidur...',
    ],
  },
  {
    kind: 'court_boss_firstvow',
    zone: 'reliquary',
    name: 'The First Vow',
    localName: 'Sumpah Pertama',
    title: 'The Oath Beneath Opus',
    pattern: 'ring',
    maxHp: 1680,
    w: 146,
    h: 154,
    contact: 28,
    phases: 4,
    mini: false,
    final: true,
    color: '#ffe0a0',
    ashReward: 300,
    lines: [
      'Sebelum ada raja, ada sumpah. Sebelum ada abu, ada aku.',
      'Setiap penjaga yang kau kalahkan mengucapkan janji yang sama kepadaku.',
      'Kau membawa semua nama mereka. Aku bisa mendengarnya di dalam dirimu.',
      'Sumpah pertama bukan untuk menang. Ia untuk memastikan seseorang kembali.',
      'Kembalilah... dan biarkan relikui ini menjadi kosong...',
    ],
  },
];

function dialogueFor(source) {
  const intro = [
    { speaker: source.name, text: source.lines[0] },
    { speaker: 'The Oathbound', text: 'Aku tidak datang untuk duduk di tahtamu.' },
  ];
  const phaseLine = (phase) => (source.phases >= phase
    ? [{ speaker: source.name, text: source.lines[phase - 1] }]
    : []);
  const defeat = [{ speaker: source.name, text: source.lines[source.lines.length - 1] }];
  return {
    intro,
    phase2: phaseLine(2),
    phase3: phaseLine(3),
    phase4: phaseLine(4),
    defeat,
  };
}

export const COURT_BOSS_INFO = {};
for (const source of BOSS_SOURCE) {
  COURT_BOSS_INFO[source.kind] = {
    id: source.kind,
    kind: source.kind,
    name: source.name,
    localName: source.localName,
    title: source.title,
    court: true,
    chapter: COURT_ZONE_BY_ID[source.zone].index + 1,
    courtZone: source.zone,
    pattern: source.pattern,
    maxHp: source.maxHp,
    w: source.w,
    h: source.h,
    contact: source.contact,
    wPhase: source.phases,
    maxPhases: source.phases,
    phaseThresholds: Array.from(
      { length: source.phases - 1 },
      (_, index) => Math.round((1 - (index + 1) / source.phases) * 1000) / 1000,
    ),
    mini: source.mini,
    major: !source.mini,
    reward: source.final ? 'victory' : 'blessing',
    summonType: source.kind === 'court_boss_hearthmother'
      ? 'ember_thrall'
      : source.kind === 'court_boss_forgeking'
        ? 'soot_artisan'
        : source.kind === 'court_boss_lastwatch'
          ? 'oath_sworn'
          : source.kind === 'court_boss_firstvow'
            ? 'vow_echo'
            : null,
    ashReward: source.ashReward,
    color: source.color,
    spawn: { x: 760, y: FLOOR_Y - source.h },
    dialogue: dialogueFor(source),
    glyph: source.mini ? '✹' : '♛',
    where: `${COURT_ZONE_BY_ID[source.zone].name} — ${source.mini ? 'Elite' : 'Boss'}`,
    desc: source.lines[0],
  };
}

export const COURT_BOSS_IDS = Object.keys(COURT_BOSS_INFO);

// Rooms need the boss table above, so they are generated after it.
export const COURT_ROOMS = [];
for (const zone of COURT_ZONES) {
  for (let local = 0; local < COURT_ROOMS_PER_ZONE; local++) {
    COURT_ROOMS.push(makeCourtRoom(zone, local));
  }
}

export const COURT_ROOM_BY_ID = Object.fromEntries(COURT_ROOMS.map((room) => [room.id, room]));
export const COURT_ROOM_INDEX_BY_ZONE = Object.fromEntries(
  COURT_ZONES.map((zone) => [zone.id, COURT_ROOMS.filter((room) => room.courtZone === zone.id).map((room) => room.id)]),
);

export function courtZoneForRoom(roomIndex) {
  const room = COURT_ROOM_BY_ID[Number(roomIndex)];
  return room ? COURT_ZONE_BY_ID[room.courtZone] : null;
}

export function courtRoomLocalIndex(roomIndex) {
  const room = COURT_ROOM_BY_ID[Number(roomIndex)];
  return room ? room.courtLocal : null;
}

export function courtRoomForZone(zoneId, local = 0) {
  const zone = COURT_ZONE_BY_ID[zoneId];
  if (!zone) return null;
  return COURT_ROOM_BY_ID[zone.roomStart + clamp(asInt(local), 0, COURT_ROOMS_PER_ZONE - 1)] || null;
}

export function validateCourtRooms(rooms = COURT_ROOMS) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  if (!Array.isArray(rooms)) return { ok: false, errors: ['COURT_ROOMS is not an array'], warnings, count: 0 };
  if (rooms.length !== COURT_ROOM_COUNT) errors.push(`Expected ${COURT_ROOM_COUNT} rooms, got ${rooms.length}`);
  for (const room of rooms) {
    if (!room || typeof room !== 'object') {
      errors.push('Room entry is not an object');
      continue;
    }
    if (ids.has(room.id)) errors.push(`Duplicate room id ${room.id}`);
    ids.add(room.id);
    if (!room.name) errors.push(`Room ${room.id} has no name`);
    if (!room.spawn || !Number.isFinite(room.spawn.x) || !Number.isFinite(room.spawn.y)) {
      errors.push(`Room ${room.id} has an invalid spawn`);
    }
    if (!Array.isArray(room.platforms) || !room.platforms.some((p) => p.y >= FLOOR_Y - 2)) {
      errors.push(`Room ${room.id} has no floor platform`);
    }
    if (room.gate) {
      if (!COURT_ROOM_BY_ID[room.gate.next]) errors.push(`Room ${room.id} gate points to unknown room ${room.gate.next}`);
    } else if (room.courtTemplate !== 'boss') {
      errors.push(`Room ${room.id} has no gate`);
    }
    for (const enemy of room.enemies || []) {
      if (!COURT_ENEMY_INFO[enemy.type]) errors.push(`Room ${room.id} references unknown enemy ${enemy.type}`);
      if (!Number.isFinite(enemy.x)) errors.push(`Room ${room.id} enemy ${enemy.type} has no x`);
    }
    if (room.boss && !COURT_BOSS_INFO[room.boss]) errors.push(`Room ${room.id} references unknown boss ${room.boss}`);
    if (room.courtTemplate === 'boss' && !room.boss) errors.push(`Boss room ${room.id} has no boss`);
    if (room.courtTemplate === 'puzzle' && !room.relic) errors.push(`Puzzle room ${room.id} has no relic`);
  }
  for (const zone of COURT_ZONES) {
    const zoneRooms = rooms.filter((room) => room.courtZone === zone.id);
    if (zoneRooms.length !== COURT_ROOMS_PER_ZONE) errors.push(`Zone ${zone.id} has ${zoneRooms.length} rooms`);
    if (!zoneRooms.some((room) => room.courtTemplate === 'boss')) errors.push(`Zone ${zone.id} has no boss room`);
    if (!zoneRooms.some((room) => room.courtTemplate === 'elite')) errors.push(`Zone ${zone.id} has no elite room`);
  }
  return { ok: errors.length === 0, errors, warnings, count: rooms.length };
}

// ── weapons ────────────────────────────────────────────────────────────────
// A weapon is data: 1-4 attack definitions plus an optional projectile and
// on-hit riders. core.js consumes this through COURT_WEAPON_PROFILES.
const WEAPON_SOURCE = [
  {
    id: 'greataxe',
    name: 'Kapak Perapian',
    short: 'KAPAK',
    glyph: '⚒',
    style: 'heavy',
    cost: 90,
    tier: 1,
    desc: 'Kapak pemecah kayu perapian. Dua ayunan lambat dengan damage besar.',
    attacks: [
      { windup: 0.3, active: 0.16, recover: 0.4, range: 82, height: 70, dmg: 34, knock: 300, name: 'heavy' },
      { windup: 0.34, active: 0.18, recover: 0.46, range: 92, height: 76, dmg: 44, knock: 360, name: 'heavy' },
    ],
  },
  {
    id: 'twinblades',
    name: 'Bilah Kembar',
    short: 'KEMBAR',
    glyph: '⚔',
    style: 'light',
    cost: 80,
    tier: 1,
    desc: 'Dua bilah tipis. Empat ayunan cepat; ayunan terakhir menusuk.',
    attacks: [
      { windup: 0.04, active: 0.09, recover: 0.14, range: 58, height: 48, dmg: 9, knock: 120, name: 'slash' },
      { windup: 0.04, active: 0.09, recover: 0.14, range: 60, height: 48, dmg: 10, knock: 120, name: 'slash' },
      { windup: 0.04, active: 0.09, recover: 0.14, range: 62, height: 48, dmg: 12, knock: 140, name: 'slash' },
      { windup: 0.08, active: 0.12, recover: 0.22, range: 76, height: 54, dmg: 20, knock: 240, name: 'pierce' },
    ],
  },
  {
    id: 'spear',
    name: 'Tombak Rongga',
    short: 'TOMBAK',
    glyph: '⟋',
    style: 'reach',
    cost: 85,
    tier: 1,
    desc: 'Tombak panjang dari aula kosong. Jangkauan sangat jauh, satu tusukan.',
    attacks: [
      { windup: 0.22, active: 0.14, recover: 0.32, range: 132, height: 42, dmg: 31, knock: 240, name: 'pierce' },
    ],
  },
  {
    id: 'warhammer',
    name: 'Gada Sumpah',
    short: 'GADA',
    glyph: '⛏',
    style: 'heavy',
    cost: 110,
    tier: 2,
    desc: 'Gada upacara. Setiap hantaman memancarkan gelombang kejut ke dua arah.',
    attacks: [
      { windup: 0.36, active: 0.16, recover: 0.5, range: 88, height: 78, dmg: 42, knock: 380, name: 'heavy' },
    ],
    shockwave: true,
  },
  {
    id: 'crossbow',
    name: 'Busur Ulang',
    short: 'ULANG',
    glyph: '➶',
    style: 'ranged',
    cost: 120,
    tier: 2,
    ammo: 'arrows',
    desc: 'Busur mekanis yang menembak baut. Memakai anak panah yang sama dengan Busur Abu.',
    attacks: [
      { windup: 0.2, active: 0.06, recover: 0.26, range: 0, height: 0, dmg: 26, knock: 140, name: 'bolt' },
    ],
    projectile: { type: 'bolt', speed: 780, r: 4, life: 1.25, ammo: 'arrows' },
  },
  {
    id: 'emberwand',
    name: 'Tongkat Bara',
    short: 'BARAT',
    glyph: '✹',
    style: 'magic',
    cost: 130,
    tier: 2,
    desc: 'Tongkat yang menyalakan bara dari udara. Menembak api tanpa amunisi, damage rendah.',
    attacks: [
      { windup: 0.26, active: 0.06, recover: 0.3, range: 0, height: 0, dmg: 18, knock: 90, name: 'ember' },
    ],
    projectile: { type: 'ember', speed: 560, r: 7, life: 1.4, ammo: null },
  },
  {
    id: 'scythe',
    name: 'Sabit Kabut',
    short: 'SABIT',
    glyph: '☾',
    style: 'reach',
    cost: 140,
    tier: 3,
    desc: 'Sabit panjang yang mencuri sedikit nyawa setiap tebasan.',
    attacks: [
      { windup: 0.2, active: 0.16, recover: 0.34, range: 108, height: 88, dmg: 27, knock: 230, name: 'slash' },
      { windup: 0.22, active: 0.18, recover: 0.38, range: 112, height: 92, dmg: 33, knock: 280, name: 'slash' },
    ],
    lifesteal: 3,
  },
  {
    id: 'oathblade',
    name: 'Bilah Wasiat',
    short: 'WASIAT',
    glyph: '†',
    style: 'balanced',
    cost: 150,
    tier: 3,
    desc: 'Pedang yang ditempa dari sumpah utuh. Kombo seimbang dan memulihkan 2 HP per tebasan.',
    attacks: [
      { windup: 0.05, active: 0.1, recover: 0.18, range: 68, height: 56, dmg: 15, knock: 150, name: 'slash' },
      { windup: 0.06, active: 0.1, recover: 0.18, range: 70, height: 56, dmg: 17, knock: 160, name: 'slash' },
      { windup: 0.08, active: 0.12, recover: 0.24, range: 84, height: 62, dmg: 26, knock: 260, name: 'heavy' },
    ],
    lifesteal: 2,
  },
];

export const COURT_WEAPONS = WEAPON_SOURCE.map((weapon) => ({
  ...weapon,
  attacks: weapon.attacks.map((attack) => ({ ...attack })),
  projectile: weapon.projectile ? { ...weapon.projectile } : null,
}));

export const COURT_WEAPON_BY_ID = Object.fromEntries(COURT_WEAPONS.map((weapon) => [weapon.id, weapon]));
export const COURT_WEAPON_IDS = COURT_WEAPONS.map((weapon) => weapon.id);

// Metadata merged into core's WEAPONS table for HUD labels.
export const COURT_WEAPON_META = Object.fromEntries(
  COURT_WEAPONS.map((weapon) => [weapon.id, {
    id: weapon.id,
    name: weapon.name,
    short: weapon.short,
    court: true,
    ammo: weapon.ammo || null,
  }]),
);

// Attack profiles consumed by core.js.
export const COURT_WEAPON_PROFILES = Object.fromEntries(
  COURT_WEAPONS.map((weapon) => [weapon.id, {
    id: weapon.id,
    attacks: weapon.attacks,
    projectile: weapon.projectile,
    lifesteal: weapon.lifesteal || 0,
    shockwave: !!weapon.shockwave,
  }]),
);

// ── tools ──────────────────────────────────────────────────────────────────
const TOOL_SOURCE = [
  ['lantern', 'Lentera Abu', 'charm', 60, 'Menerangi relung gelap. +5% kecepatan gerak.', { speed: 0.05 }],
  ['iron_ring', 'Cincin Besi Tua', 'charm', 80, 'Logam dari gerbang Opus. +10 HP maksimum.', { maxHp: 10 }],
  ['oath_pebble', 'Kerikil Sumpah', 'charm', 95, 'Kerikil hangat yang tidak pernah dingin. +4% damage.', { damage: 0.04 }],
  ['ember_boots', 'Sepatu Bara', 'boots', 70, 'Sol yang tidak takut api. +4% kecepatan.', { speed: 0.04 }],
  ['glass_greaves', 'Pelindung Kaca', 'boots', 90, 'Ringan dan licin. +6% kecepatan, +5 HP.', { speed: 0.06, maxHp: 5 }],
  ['vow_charm', 'Jimat Wasiat', 'relic', 110, 'Menyimpan satu tegukan cadangan. +1 flask.', { flasks: 1 }],
  ['ash_compass', 'Kompas Jelaga', 'relic', 100, 'Menemukan jalan pulang. +10% abu dari musuh.', { gain: 0.1 }],
  ['hearth_stone', 'Batu Perapian', 'relic', 120, 'Kehangatan rumah. +8 HP dan +4% penyembuhan.', { maxHp: 8, heal: 0.04 }],
  ['duelist_glove', 'Sarung Duelis', 'charm', 135, 'Kulit yang hafal setiap pegangan. +7% kecepatan dan +3% damage.', { speed: 0.07, damage: 0.03 }],
  ['glass_lens', 'Lensa Kaca', 'relic', 145, 'Melihat butir abu di udara. +12% abu dan +4% damage.', { gain: 0.12, damage: 0.04 }],
  ['coal_heart', 'Jantung Bara', 'charm', 155, 'Bara kecil yang berdetak pelan. +16 HP dan +5% penyembuhan.', { maxHp: 16, heal: 0.05 }],
  ['vigil_boots', 'Sepatu Jaga', 'boots', 160, 'Tapak yang tidak berhenti di tangga menara. +8% kecepatan dan +10 HP.', { speed: 0.08, maxHp: 10 }],
];

export const COURT_TOOLS = TOOL_SOURCE.map(([id, name, slot, cost, desc, bonus]) => ({
  id,
  name,
  slot,
  cost,
  desc,
  bonus: { ...bonus },
  glyph: { charm: '◇', boots: '⌁', relic: '✦' }[slot] || '✦',
}));

export const COURT_TOOL_BY_ID = Object.fromEntries(COURT_TOOLS.map((tool) => [tool.id, tool]));
export const COURT_TOOL_IDS = COURT_TOOLS.map((tool) => tool.id);
export const COURT_TOOL_SLOTS = ['charm', 'boots', 'relic'];

// ── trials ─────────────────────────────────────────────────────────────────
// Replayable endgame runs. Both use the real rooms and bosses; the trial layer
// only decides the order, the healing between fights, and the records kept.
const TRIAL_SOURCE = [
  {
    id: 'boss_rush',
    name: 'Ronda Para Penjaga',
    subtitle: 'Dua belas penjaga, satu napas.',
    glyph: '♛',
    color: '#ffb066',
    desc: 'Hadapi kedua belas penjaga court berturut-turut. Darah dipulihkan 35% di antara penjaga, tanpa berkah.',
    requires: 'completion',
    reward: 950,
    heal: 0.35,
    start: 6,
    end: 59,
    order: [6, 9, 16, 19, 26, 29, 36, 39, 46, 49, 56, 59],
  },
  {
    id: 'glass_gauntlet',
    name: 'Jalan Kaca',
    subtitle: 'Sepuluh ruang tanpa perapian.',
    glyph: '❧',
    color: '#8fc9a8',
    desc: 'Tempuh seluruh Kebun Kaca tanpa berhenti di perapian. Setiap ruang memulihkan 10% HP; Singgasana Kaca menutup jalan.',
    requires: 'glassorchard',
    reward: 180,
    heal: 0.1,
    start: 10,
    end: 19,
    order: Array.from({ length: 10 }, (_, i) => 10 + i),
  },
];

export const COURT_TRIALS = TRIAL_SOURCE.map((trial) => ({
  ...trial,
  order: [...trial.order],
}));
export const COURT_TRIAL_BY_ID = Object.fromEntries(COURT_TRIALS.map((trial) => [trial.id, trial]));
export const COURT_TRIAL_IDS = COURT_TRIALS.map((trial) => trial.id);
export const COURT_NG_PLUS_MAX = 4;

// ── house ──────────────────────────────────────────────────────────────────
const HOUSE_SOURCE = [
  ['hall', 'Aula Perapian', '⌂', '#e08a4a', [0, 130, 280, 520], { maxHp: 8 }, 'Tempat semua penghuni berkumpul. Setiap tingkat menambah 8 HP maksimum.'],
  ['kitchen', 'Dapur Panjang', '♨', '#d8a35c', [0, 110, 240, 460], { heal: 0.06 }, 'Sup yang tidak pernah habis. +6% penyembuhan per tingkat.'],
  ['forge', 'Tungku Tempa', '⚒', '#c96a3a', [0, 140, 300, 560], { damage: 0.05 }, 'Tempat senjata court ditempa. +5% damage per tingkat.'],
  ['chapel', 'Kapel Sunyi', '♱', '#b28fd8', [0, 120, 260, 500], { flasks: 1 }, 'Setiap dua tingkat menambah satu flask maksimum.'],
  ['garden', 'Kebun Akar', '❧', '#8fc9a8', [0, 100, 220, 440], { speed: 0.03 }, 'Akar yang tumbuh tenang. +3% kecepatan per tingkat.'],
  ['vault', 'Gudang Abu', '▣', '#d6ac66', [0, 150, 320, 600], { gain: 0.08 }, 'Abu yang disimpan tidak pernah hilang. +8% abu per tingkat.'],
];

export const HOUSE_ROOMS = HOUSE_SOURCE.map(([id, name, glyph, color, costs, bonusPerLevel, desc], index) => ({
  id,
  index,
  name,
  glyph,
  color,
  costs,
  maxLevel: 3,
  bonusPerLevel: { ...bonusPerLevel },
  desc,
}));

export const HOUSE_ROOM_BY_ID = Object.fromEntries(HOUSE_ROOMS.map((room) => [room.id, room]));
export const HOUSE_ROOM_IDS = HOUSE_ROOMS.map((room) => room.id);

const FURNISHING_SOURCE = [
  ['long_table', 'Meja Panjang', 'hall', 40, 2, 'Meja tempat delapan penghuni pernah makan bersama.'],
  ['ash_rug', 'Permadani Abu', 'hall', 30, 1, 'Tenunan tangan dari rambut penjaga yang gugur.'],
  ['oath_banner', 'Panji Sumpah', 'hall', 55, 3, 'Panji lama yang warnanya sudah tak terbaca.'],
  ['hearth_pot', 'Panci Perapian', 'kitchen', 35, 2, 'Panci besar yang selalu berisi sesuatu.'],
  ['spice_rack', 'Rak Rempah', 'kitchen', 45, 2, 'Rempah dari sembilan biome, sebagian beracun.'],
  ['kettle', 'Ketel Tembaga', 'kitchen', 25, 1, 'Bersuara setiap kali ada tamu.'],
  ['anvil', 'Landasan Tua', 'forge', 60, 3, 'Landasan yang mencatat setiap pukulan.'],
  ['weapon_rack', 'Rak Senjata', 'forge', 50, 2, 'Tempat delapan senjata court dipajang.'],
  ['quench_barrel', 'Tong Pendingin', 'forge', 30, 1, 'Airnya tidak pernah hangat.'],
  ['altar', 'Altar Kecil', 'chapel', 70, 3, 'Altar tanpa dewa, hanya janji.'],
  ['candle_row', 'Baris Lilin', 'chapel', 40, 2, 'Lilin yang menyala tanpa sumbu.'],
  ['bell', 'Lonceng Perak', 'chapel', 80, 4, 'Lonceng yang hanya berbunyi untuk nama yang hilang.'],
  ['root_bed', 'Bedeng Akar', 'garden', 45, 2, 'Akar yang tidur di bawah tanah hangat.'],
  ['stone_fountain', 'Mata Air Kecil', 'garden', 65, 3, 'Airnya jernih dan sedikit asin.'],
  ['moth_lantern', 'Lentera Ngengat', 'garden', 35, 1, 'Ngengat kecil menjaga nyalanya.'],
  ['coin_chest', 'Peti Koin', 'vault', 50, 2, 'Peti yang tidak pernah penuh.'],
  ['ledger', 'Buku Catatan', 'vault', 40, 2, 'Catatan setiap abu yang masuk dan keluar.'],
  ['relic_shelf', 'Rak Relik', 'vault', 90, 4, 'Rak berisi relik yang tidak boleh disentuh.'],
  ['portrait', 'Lukisan Pendiri', 'hall', 75, 3, 'Wajahnya berubah setiap kali kau berkedip.'],
  ['music_box', 'Kotak Musik', 'hall', 60, 3, 'Memutar lagu yang tidak pernah selesai.'],
  ['whetstone', 'Batu Asah', 'forge', 35, 2, 'Batu yang selalu basah.'],
  ['herb_bundle', 'Ikatan Herbal', 'kitchen', 30, 1, 'Wanginya menutupi bau abu.'],
  ['stained_glass', 'Kaca Patri', 'chapel', 85, 4, 'Cahaya yang masuk berwarna darah kering.'],
  ['thorn_wreath', 'Karangan Duri', 'garden', 55, 3, 'Duri yang tidak melukai pemiliknya.'],
];

export const HOUSE_FURNISHINGS = FURNISHING_SOURCE.map(([id, name, room, cost, warmth, desc]) => ({
  id,
  name,
  room,
  cost,
  warmth,
  desc,
  glyph: HOUSE_ROOM_BY_ID[room]?.glyph || '✦',
}));

export const HOUSE_FURNISHING_BY_ID = Object.fromEntries(HOUSE_FURNISHINGS.map((item) => [item.id, item]));
export const HOUSE_FURNISHING_IDS = HOUSE_FURNISHINGS.map((item) => item.id);

// ── residents (NPCs) ───────────────────────────────────────────────────────
const RESIDENT_SOURCE = [
  {
    id: 'mara',
    name: 'Mara',
    role: 'Penjaga Perapian',
    room: 'hall',
    glyph: '☼',
    color: '#e08a4a',
    unlock: null,
    likes: 'teh bara',
    lines: {
      low: ['Perapian masih menyala. Kau boleh duduk, tapi jangan tidur.'],
      mid: ['Aku menyimpan abu suamiku di pot ini. Jangan bilang siapa-siapa.'],
      high: ['Kau pulang. Itu sudah cukup untuk hari ini.'],
    },
    quest: {
      id: 'quest_mara',
      name: 'Api yang Menunggu',
      steps: [
        { kind: 'clear', target: 2, label: 'Bersihkan 2 ruang Hearthfall' },
        { kind: 'boss', target: 1, label: 'Kalahkan satu bos Hearthfall' },
        { kind: 'gift', target: 1, label: 'Beri Mara hadiah' },
      ],
      reward: { marks: 80, tool: 'hearth_stone' },
    },
  },
  {
    id: 'tobin',
    name: 'Tobin',
    role: 'Koki Abu',
    room: 'kitchen',
    glyph: '♨',
    color: '#d8a35c',
    unlock: null,
    likes: 'rempah',
    lines: {
      low: ['Jangan sentuh panci. Isinya belum siap.'],
      mid: ['Sup hari ini dari akar kebun. Rasanya seperti tanah, tapi hangat.'],
      high: ['Aku simpan porsi terakhir untukmu. Selalu.'],
    },
    quest: {
      id: 'quest_tobin',
      name: 'Rasa Rumah',
      steps: [
        { kind: 'clear', target: 4, label: 'Bersihkan 4 ruang' },
        { kind: 'furnish', target: 2, label: 'Pasang 2 perabot' },
        { kind: 'gift', target: 1, label: 'Beri Tobin hadiah' },
      ],
      reward: { marks: 90, tool: 'iron_ring' },
    },
  },
  {
    id: 'brenna',
    name: 'Brenna',
    role: 'Pandai Tempa',
    room: 'forge',
    glyph: '⚒',
    color: '#c96a3a',
    unlock: { bosses: 1 },
    likes: 'bijih',
    lines: {
      low: ['Bawa logam, bukan cerita. Aku bisa menempa logam.'],
      mid: ['Bilah wasiat itu bukan buatanku. Tapi aku bisa merawatnya.'],
      high: ['Tungku ini menyala untukmu. Jangan sia-siakan.'],
    },
    quest: {
      id: 'quest_brenna',
      name: 'Baja dan Janji',
      steps: [
        { kind: 'boss', target: 2, label: 'Kalahkan 2 bos' },
        { kind: 'clear', target: 6, label: 'Bersihkan 6 ruang' },
        { kind: 'gift', target: 1, label: 'Beri Brenna hadiah' },
      ],
      reward: { marks: 120, weapon: 'oathblade' },
    },
  },
  {
    id: 'sister_veil',
    name: 'Suster Veil',
    role: 'Penjaga Kapel',
    room: 'chapel',
    glyph: '♱',
    color: '#b28fd8',
    unlock: { bosses: 2 },
    likes: 'lilin',
    lines: {
      low: ['Kapel ini tidak punya dewa. Hanya janji yang belum dibayar.'],
      mid: ['Aku menyalakan lilin untuk nama-nama yang kau lupakan.'],
      high: ['Kau masih berdiri. Itu jawaban yang cukup.'],
    },
    quest: {
      id: 'quest_veil',
      name: 'Nama yang Hilang',
      steps: [
        { kind: 'clear', target: 8, label: 'Bersihkan 8 ruang' },
        { kind: 'boss', target: 3, label: 'Kalahkan 3 bos' },
        { kind: 'gift', target: 1, label: 'Beri Suster Veil hadiah' },
      ],
      reward: { marks: 110, tool: 'vow_charm' },
    },
  },
  {
    id: 'hollis',
    name: 'Hollis',
    role: 'Tukang Kebun',
    room: 'garden',
    glyph: '❧',
    color: '#8fc9a8',
    unlock: { clears: 3 },
    likes: 'bibit',
    lines: {
      low: ['Akar di sini tumbuh malam hari. Jangan injak bedengan.'],
      mid: ['Aku menanam biji dari kebun kaca. Belum tahu apa yang tumbuh.'],
      high: ['Kebun ini mulai mengingat namamu. Itu pertanda baik.'],
    },
    quest: {
      id: 'quest_hollis',
      name: 'Akar Baru',
      steps: [
        { kind: 'furnish', target: 3, label: 'Pasang 3 perabot' },
        { kind: 'clear', target: 10, label: 'Bersihkan 10 ruang' },
        { kind: 'gift', target: 1, label: 'Beri Hollis hadiah' },
      ],
      reward: { marks: 100, tool: 'ember_boots' },
    },
  },
  {
    id: 'kestrel',
    name: 'Kestrel',
    role: 'Juru Kunci Gudang',
    room: 'vault',
    glyph: '▣',
    color: '#d6ac66',
    unlock: { bosses: 3 },
    likes: 'koin',
    lines: {
      low: ['Gudang ini mencatat semua yang masuk. Termasuk kau.'],
      mid: ['Peti ini tidak pernah penuh, tapi tidak pernah kosong.'],
      high: ['Ambil apa yang perlu. Sisanya biar jadi cerita.'],
    },
    quest: {
      id: 'quest_kestrel',
      name: 'Hitungan Terakhir',
      steps: [
        { kind: 'boss', target: 4, label: 'Kalahkan 4 bos' },
        { kind: 'furnish', target: 4, label: 'Pasang 4 perabot' },
        { kind: 'gift', target: 1, label: 'Beri Kestrel hadiah' },
      ],
      reward: { marks: 130, weapon: 'scythe' },
    },
  },
  {
    id: 'saul',
    name: 'Saul',
    role: 'Veteran Opus',
    room: 'hall',
    glyph: '⚔',
    color: '#9b78c8',
    unlock: { clears: 6 },
    likes: 'anggur',
    lines: {
      low: ['Aku sudah mati sekali. Tidak sebagus yang diceritakan.'],
      mid: ['Dinding ini pernah jadi benteng. Sekarang tempatku minum.'],
      high: ['Kau bertarung seperti orang yang masih punya alasan. Bagus.'],
    },
    quest: {
      id: 'quest_saul',
      name: 'Saksi Terakhir',
      steps: [
        { kind: 'boss', target: 5, label: 'Kalahkan 5 bos' },
        { kind: 'clear', target: 15, label: 'Bersihkan 15 ruang' },
        { kind: 'gift', target: 1, label: 'Beri Saul hadiah' },
      ],
      reward: { marks: 150, tool: 'oath_pebble' },
    },
  },
  {
    id: 'little_ash',
    name: 'Ash Kecil',
    role: 'Anak Perapian',
    room: 'hall',
    glyph: '✧',
    color: '#ffcf8a',
    unlock: { clears: 1 },
    likes: 'permen',
    lines: {
      low: ['Kau penjaga baru? Kau terlihat lelah.'],
      mid: ['Aku menemukan batu hangat di kebun. Mau lihat?'],
      high: ['Kalau kau pergi lagi, aku akan jaga apinya sampai kau pulang.'],
    },
    quest: {
      id: 'quest_ash',
      name: 'Batu Hangat',
      steps: [
        { kind: 'gift', target: 1, label: 'Beri Ash Kecil hadiah' },
        { kind: 'clear', target: 3, label: 'Bersihkan 3 ruang' },
        { kind: 'boss', target: 1, label: 'Kalahkan satu bos' },
      ],
      reward: { marks: 70, tool: 'ash_compass' },
    },
  },
];

export const HOUSE_RESIDENTS = RESIDENT_SOURCE.map((resident) => ({
  ...resident,
  lines: { low: [...resident.lines.low], mid: [...resident.lines.mid], high: [...resident.lines.high] },
  quest: { ...resident.quest, steps: resident.quest.steps.map((step) => ({ ...step })), reward: { ...resident.quest.reward } },
}));

export const HOUSE_RESIDENT_BY_ID = Object.fromEntries(HOUSE_RESIDENTS.map((resident) => [resident.id, resident]));
export const HOUSE_RESIDENT_IDS = HOUSE_RESIDENTS.map((resident) => resident.id);

// ── progress ───────────────────────────────────────────────────────────────
export function defaultCourtProgress() {
  return {
    version: COURT_PROGRESS_VERSION,
    marks: 0,
    cleared: Array.from({ length: COURT_ROOM_COUNT }, () => false),
    unlocked: 1,
    zoneUnlocked: [COURT_ZONE_IDS[0]],
    weapons: [],
    tools: [],
    equippedWeapon: 'sword',
    equippedTools: [],
    house: {
      rooms: Object.fromEntries(HOUSE_ROOMS.map((room) => [room.id, 0])),
      furnishings: [],
    },
    residents: Object.fromEntries(HOUSE_RESIDENTS.map((resident) => [resident.id, {
      affinity: 0,
      gifts: 0,
      questStep: 0,
      questCount: 0,
      questDone: false,
      met: false,
    }])),
    bossKills: {},
    trials: Object.fromEntries(COURT_TRIALS.map((trial) => [trial.id, { clears: 0, bestTime: 0 }])),
    ngPlus: 0,
    stats: { runs: 0, clears: 0, bossKills: 0, deaths: 0, marksEarned: 0, furnishingBought: 0, trialClears: 0 },
    flags: {},
    completion: false,
  };
}

function uniqueKnown(list, known) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter((id) => typeof id === 'string' && known.includes(id)))];
}

export function sanitizeCourtProgress(raw) {
  const base = defaultCourtProgress();
  if (!raw || typeof raw !== 'object') return base;
  const source = raw;

  const cleared = base.cleared.map((_, index) => asBool(source.cleared?.[index]));
  const zoneUnlocked = uniqueKnown(source.zoneUnlocked, COURT_ZONE_IDS);
  if (!zoneUnlocked.includes(COURT_ZONE_IDS[0])) zoneUnlocked.unshift(COURT_ZONE_IDS[0]);

  const weapons = uniqueKnown(source.weapons, COURT_WEAPON_IDS);
  const tools = uniqueKnown(source.tools, COURT_TOOL_IDS);
  const equippedWeapon = weapons.includes(source.equippedWeapon) ? source.equippedWeapon : 'sword';

  const equippedTools = [];
  for (const id of uniqueKnown(source.equippedTools, tools)) {
    const tool = COURT_TOOL_BY_ID[id];
    if (!tool) continue;
    if (equippedTools.some((entry) => COURT_TOOL_BY_ID[entry]?.slot === tool.slot)) continue;
    equippedTools.push(id);
  }

  const rooms = {};
  for (const room of HOUSE_ROOMS) {
    rooms[room.id] = clamp(asInt(source.house?.rooms?.[room.id], 0), 0, room.maxLevel);
  }
  const house = {
    rooms,
    furnishings: uniqueKnown(source.house?.furnishings, HOUSE_FURNISHING_IDS),
  };

  const residents = {};
  for (const resident of HOUSE_RESIDENTS) {
    const saved = source.residents?.[resident.id] || {};
    residents[resident.id] = {
      affinity: clamp(asInt(saved.affinity, 0), 0, 100),
      gifts: clamp(asInt(saved.gifts, 0), 0, 9999),
      questStep: clamp(asInt(saved.questStep, 0), 0, resident.quest.steps.length),
      questCount: clamp(asInt(saved.questCount, 0), 0, 9999),
      questDone: asBool(saved.questDone),
      met: asBool(saved.met),
    };
  }

  const bossKills = {};
  for (const [kind, count] of Object.entries(source.bossKills || {})) {
    if (!COURT_BOSS_INFO[kind]) continue;
    bossKills[kind] = clamp(asInt(count, 0), 0, 9999);
  }

  const trials = {};
  for (const trial of COURT_TRIALS) {
    const saved = source.trials?.[trial.id] || {};
    trials[trial.id] = {
      clears: clamp(asInt(saved.clears, 0), 0, 9999),
      bestTime: Math.max(0, Math.round((Number(saved.bestTime) || 0) * 10) / 10),
    };
  }
  const completion = asBool(source.completion);

  return {
    ...base,
    ...source,
    version: COURT_PROGRESS_VERSION,
    marks: Math.max(0, asInt(source.marks, 0)),
    cleared,
    unlocked: clamp(asInt(source.unlocked, 1), 1, COURT_ROOM_COUNT),
    zoneUnlocked,
    weapons,
    tools,
    equippedWeapon,
    equippedTools,
    house,
    residents,
    bossKills,
    trials,
    ngPlus: completion ? clamp(asInt(source.ngPlus, 0), 0, COURT_NG_PLUS_MAX) : 0,
    stats: {
      runs: Math.max(0, asInt(source.stats?.runs, 0)),
      clears: Math.max(0, asInt(source.stats?.clears, 0)),
      bossKills: Math.max(0, asInt(source.stats?.bossKills, 0)),
      deaths: Math.max(0, asInt(source.stats?.deaths, 0)),
      marksEarned: Math.max(0, asInt(source.stats?.marksEarned, 0)),
      furnishingBought: Math.max(0, asInt(source.stats?.furnishingBought, 0)),
      trialClears: Math.max(0, asInt(source.stats?.trialClears, 0)),
    },
    flags: source.flags && typeof source.flags === 'object' ? { ...source.flags } : {},
    completion,
  };
}

export function courtZoneCleared(progress, zoneId) {
  const zone = COURT_ZONE_BY_ID[zoneId];
  if (!zone) return 0;
  const p = progress || defaultCourtProgress();
  let cleared = 0;
  for (let local = 0; local < COURT_ROOMS_PER_ZONE; local++) {
    if (p.cleared[zone.roomStart - COURT_ROOM_START + local]) cleared += 1;
  }
  return cleared;
}

export function courtLevelUnlocked(progress, localIndex) {
  if (!progress) return false;
  const index = asInt(localIndex, -1);
  if (index < 0 || index >= COURT_ROOM_COUNT) return false;
  const zoneIndex = Math.floor(index / COURT_ROOMS_PER_ZONE);
  if (zoneIndex > 0 && !(progress.zoneUnlocked || []).includes(COURT_ZONE_IDS[zoneIndex])) return false;
  const local = index % COURT_ROOMS_PER_ZONE;
  if (local === 0) return true;
  return !!progress.cleared[index - 1] || !!progress.cleared[index];
}

export function syncCourtUnlocks(progress) {
  if (!progress) return progress;
  const zoneUnlocked = new Set(progress.zoneUnlocked || [COURT_ZONE_IDS[0]]);
  zoneUnlocked.add(COURT_ZONE_IDS[0]);
  for (let zoneIndex = 1; zoneIndex < COURT_ZONES.length; zoneIndex++) {
    const previous = COURT_ZONES[zoneIndex - 1];
    const bossLocal = COURT_ROOMS_PER_ZONE - 1;
    if (progress.cleared[previous.roomStart - COURT_ROOM_START + bossLocal]) {
      zoneUnlocked.add(COURT_ZONES[zoneIndex].id);
    }
  }
  progress.zoneUnlocked = COURT_ZONE_IDS.filter((id) => zoneUnlocked.has(id));
  let unlocked = 1;
  for (let index = 0; index < COURT_ROOM_COUNT; index++) {
    const zoneIndex = Math.floor(index / COURT_ROOMS_PER_ZONE);
    if (zoneIndex > 0 && !progress.zoneUnlocked.includes(COURT_ZONE_IDS[zoneIndex])) break;
    if (index === 0 || progress.cleared[index - 1] || progress.cleared[index]) unlocked = index + 1;
    else break;
  }
  progress.unlocked = clamp(unlocked, 1, COURT_ROOM_COUNT);
  return progress;
}

export function residentUnlocked(progress, residentId) {
  const resident = HOUSE_RESIDENT_BY_ID[residentId];
  if (!resident || !resident.unlock) return !!resident;
  const p = progress || defaultCourtProgress();
  const clears = p.stats?.clears || 0;
  const bosses = p.stats?.bossKills || 0;
  if (resident.unlock.clears && clears < resident.unlock.clears) return false;
  if (resident.unlock.bosses && bosses < resident.unlock.bosses) return false;
  return true;
}

export function residentAffinityTier(affinity = 0) {
  if (affinity >= 60) return 'high';
  if (affinity >= 25) return 'mid';
  return 'low';
}

export function residentDialogue(progress, residentId, daySeed = 0) {
  const resident = HOUSE_RESIDENT_BY_ID[residentId];
  if (!resident) return null;
  const state = progress?.residents?.[residentId] || { affinity: 0 };
  const tier = residentAffinityTier(state.affinity);
  const lines = resident.lines[tier];
  const index = Math.abs(asInt(daySeed) + asInt(state.affinity)) % lines.length;
  return { resident, line: lines[index], tier };
}

export function talkToResident(progress, residentId, daySeed = 0) {
  if (!progress || !residentUnlocked(progress, residentId)) return { ok: false, reason: 'locked' };
  const state = progress.residents?.[residentId];
  if (!state) return { ok: false, reason: 'unknown' };
  state.met = true;
  const dialogue = residentDialogue(progress, residentId, daySeed);
  return { ok: true, ...dialogue };
}

// Gift costs are fixed so the economy stays predictable and testable.
export const GIFT_COST = 25;

export function giftResident(progress, residentId) {
  if (!progress) return { ok: false, reason: 'progress' };
  if (!residentUnlocked(progress, residentId)) return { ok: false, reason: 'locked' };
  if (progress.marks < GIFT_COST) return { ok: false, reason: 'marks' };
  const state = progress.residents[residentId];
  progress.marks -= GIFT_COST;
  state.gifts += 1;
  state.affinity = clamp(state.affinity + 10, 0, 100);
  state.met = true;
  const events = [{ kind: 'gift', target: residentId }];
  const quest = advanceResidentQuests(progress, events);
  return {
    ok: true,
    affinity: state.affinity,
    tier: residentAffinityTier(state.affinity),
    quest,
    line: residentDialogue(progress, residentId, state.gifts).line,
  };
}

export function advanceResidentQuests(progress, events = []) {
  if (!progress) return [];
  const completed = [];
  for (const resident of HOUSE_RESIDENTS) {
    const state = progress.residents[resident.id];
    if (!state || state.questDone) continue;
    if (!Number.isFinite(state.questCount)) state.questCount = 0;
    // Count matching events against the current step, then roll forward through
    // as many steps as the accumulated count satisfies. This keeps quest data
    // declarative (target: 3, target: 1) instead of one event per step.
    const step = resident.quest.steps[state.questStep];
    if (step) {
      const gained = events.filter((event) => {
        if (!event || event.kind !== step.kind) return false;
        if (step.kind === 'gift') return event.target === resident.id;
        return true;
      }).length;
      if (gained > 0) {
        state.questCount += gained;
        if (state.questCount >= Math.max(1, asInt(step.target, 1))) {
          state.questCount = 0;
          state.questStep += 1;
        }
      }
    }
    if (state.questStep >= resident.quest.steps.length) {
      state.questDone = true;
      state.questCount = 0;
      const reward = resident.quest.reward || {};
      if (reward.marks) {
        progress.marks += reward.marks;
        progress.stats.marksEarned += reward.marks;
      }
      if (reward.weapon && COURT_WEAPON_BY_ID[reward.weapon] && !progress.weapons.includes(reward.weapon)) {
        progress.weapons.push(reward.weapon);
      }
      if (reward.tool && COURT_TOOL_BY_ID[reward.tool] && !progress.tools.includes(reward.tool)) {
        progress.tools.push(reward.tool);
      }
      completed.push({ residentId: resident.id, questId: resident.quest.id, reward });
    }
  }
  return completed;
}

// ── pacing ─────────────────────────────────────────────────────────────────
// Marks are the only progression currency in Hearthfall. The curve is kept
// explicit so tests can guard against both grind (too few marks per room) and
// sprinting (a boss paying for half the forge).
export const COURT_ECONOMY = Object.freeze({
  roomBase: 18,
  roomGrowth: 1.6,
  miniBossBonus: 70,
  bossBonus: 140,
  zoneClearBonus: 80,
});

export function courtMarksForRoom(localIndex, options = {}) {
  const index = asInt(localIndex, -1);
  if (index < 0 || index >= COURT_ROOM_COUNT) return 0;
  let marks = COURT_ECONOMY.roomBase + Math.floor(index * COURT_ECONOMY.roomGrowth);
  if (options.boss) marks += options.mini ? COURT_ECONOMY.miniBossBonus : COURT_ECONOMY.bossBonus;
  if (options.zoneClear) marks += COURT_ECONOMY.zoneClearBonus;
  return marks;
}

export function recordCourtClear(progress, localIndex, options = {}) {
  if (!progress) return { firstClear: false, marks: 0 };
  const index = asInt(localIndex, -1);
  if (index < 0 || index >= COURT_ROOM_COUNT) return { firstClear: false, marks: 0 };
  const room = COURT_ROOMS[index];
  const firstClear = !progress.cleared[index];
  let marks = 0;
  if (firstClear) {
    progress.cleared[index] = true;
    const beforeZone = courtZoneCleared(progress, room.courtZone);
    const zoneClear = room.courtTemplate === 'boss' && beforeZone === COURT_ROOMS_PER_ZONE - 1;
    marks = courtMarksForRoom(index, { ...options, zoneClear });
    progress.marks += marks;
    progress.stats.clears += 1;
    progress.stats.marksEarned += marks;
    if (options.boss) progress.stats.bossKills += 1;
    if (options.boss && options.kind) {
      progress.bossKills[options.kind] = (progress.bossKills[options.kind] || 0) + 1;
    }
    const events = [{ kind: 'clear', room: index, zone: room.courtZone }];
    if (options.boss) events.push({ kind: 'boss', boss: options.kind || null, mini: !!options.mini, room: index });
    const quests = advanceResidentQuests(progress, events);
    syncCourtUnlocks(progress);
    const finalBoss = room.courtTemplate === 'boss' && room.courtZoneIndex === COURT_ZONES.length - 1;
    if (finalBoss) progress.completion = true;
    return { firstClear, marks, zoneClear, quests, completion: finalBoss };
  }
  syncCourtUnlocks(progress);
  return { firstClear: false, marks: 0, quests: [] };
}

export function upgradeHouseRoom(progress, roomId) {
  const room = HOUSE_ROOM_BY_ID[roomId];
  if (!progress || !room) return { ok: false, reason: 'unknown' };
  const level = progress.house.rooms[roomId] || 0;
  if (level >= room.maxLevel) return { ok: false, reason: 'max' };
  const cost = room.costs[level + 1] || room.costs[room.costs.length - 1];
  if (progress.marks < cost) return { ok: false, reason: 'marks', cost };
  progress.marks -= cost;
  progress.house.rooms[roomId] = level + 1;
  return { ok: true, level: level + 1, cost };
}

export function buyFurnishing(progress, furnishingId) {
  const item = HOUSE_FURNISHING_BY_ID[furnishingId];
  if (!progress || !item) return { ok: false, reason: 'unknown' };
  if (progress.house.furnishings.includes(furnishingId)) return { ok: false, reason: 'owned' };
  const roomLevel = progress.house.rooms[item.room] || 0;
  if (roomLevel < 1) return { ok: false, reason: 'room' };
  if (progress.marks < item.cost) return { ok: false, reason: 'marks', cost: item.cost };
  progress.marks -= item.cost;
  progress.house.furnishings.push(furnishingId);
  progress.stats.furnishingBought += 1;
  const quests = advanceResidentQuests(progress, [{ kind: 'furnish', target: furnishingId }]);
  return { ok: true, item, quests };
}

export function buyCourtWeapon(progress, weaponId) {
  const weapon = COURT_WEAPON_BY_ID[weaponId];
  if (!progress || !weapon) return { ok: false, reason: 'unknown' };
  if (progress.weapons.includes(weaponId)) return { ok: false, reason: 'owned' };
  if (progress.marks < weapon.cost) return { ok: false, reason: 'marks', cost: weapon.cost };
  progress.marks -= weapon.cost;
  progress.weapons.push(weaponId);
  return { ok: true, weapon };
}

export function equipCourtWeapon(progress, weaponId) {
  if (!progress) return { ok: false, reason: 'progress' };
  if (weaponId === 'sword') {
    progress.equippedWeapon = 'sword';
    return { ok: true };
  }
  if (!COURT_WEAPON_BY_ID[weaponId]) return { ok: false, reason: 'unknown' };
  if (!progress.weapons.includes(weaponId)) return { ok: false, reason: 'locked' };
  progress.equippedWeapon = weaponId;
  return { ok: true };
}

export function buyCourtTool(progress, toolId) {
  const tool = COURT_TOOL_BY_ID[toolId];
  if (!progress || !tool) return { ok: false, reason: 'unknown' };
  if (progress.tools.includes(toolId)) return { ok: false, reason: 'owned' };
  if (progress.marks < tool.cost) return { ok: false, reason: 'marks', cost: tool.cost };
  progress.marks -= tool.cost;
  progress.tools.push(toolId);
  return { ok: true, tool };
}

export function equipCourtTool(progress, toolId) {
  const tool = COURT_TOOL_BY_ID[toolId];
  if (!progress || !tool) return { ok: false, reason: 'unknown' };
  if (!progress.tools.includes(toolId)) return { ok: false, reason: 'locked' };
  const index = progress.equippedTools.indexOf(toolId);
  if (index >= 0) {
    progress.equippedTools.splice(index, 1);
    return { ok: true, equipped: false };
  }
  const other = progress.equippedTools.find((id) => COURT_TOOL_BY_ID[id]?.slot === tool.slot);
  if (other) progress.equippedTools = progress.equippedTools.filter((id) => id !== other);
  progress.equippedTools.push(toolId);
  return { ok: true, equipped: true, replaced: other || null };
}

// ── derived bonuses ────────────────────────────────────────────────────────
const BONUS_KEYS = ['maxHp', 'flasks', 'damage', 'speed', 'gain', 'heal'];

function emptyBonus() {
  return Object.fromEntries(BONUS_KEYS.map((key) => [key, 0]));
}

function addBonus(target, source) {
  for (const key of BONUS_KEYS) target[key] += Number(source?.[key]) || 0;
  return target;
}

let bonusCacheKey = null;
let bonusCacheValue = null;

export function houseWarmth(progress) {
  if (!progress) return 0;
  let warmth = 0;
  for (const id of progress.house?.furnishings || []) warmth += HOUSE_FURNISHING_BY_ID[id]?.warmth || 0;
  return warmth;
}

/**
 * Aggregate house + tool bonuses. Results are cached by a compact fingerprint;
 * the UI recomputes this on every hover, so avoiding Object churn here keeps
 * the hub responsive even after dozens of furnishings.
 */
export function courtBonuses(progress = defaultCourtProgress()) {
  const rooms = progress.house?.rooms || {};
  const furnishings = progress.house?.furnishings || [];
  const tools = progress.equippedTools || [];
  const key = `${HOUSE_ROOM_IDS.map((id) => rooms[id] || 0).join(',')}|${furnishings.length}|${houseWarmth(progress)}|${tools.join(',')}`;
  if (key === bonusCacheKey) return bonusCacheValue;

  const bonus = emptyBonus();
  for (const room of HOUSE_ROOMS) {
    const level = clamp(asInt(rooms[room.id], 0), 0, room.maxLevel);
    if (!level) continue;
    addBonus(bonus, Object.fromEntries(
      Object.entries(room.bonusPerLevel).map(([stat, value]) => [stat, value * level]),
    ));
  }
  // Chapel grants a flask only every two levels.
  bonus.flasks = Math.floor((rooms.chapel || 0) / 2);

  for (const toolId of tools) addBonus(bonus, COURT_TOOL_BY_ID[toolId]?.bonus || {});

  const warmth = houseWarmth(progress);
  bonus.maxHp += Math.floor(warmth / 8);
  bonus.damage += Math.floor(warmth / 40) * 0.01;

  for (const stat of Object.keys(bonus)) bonus[stat] = Math.round(bonus[stat] * 1000) / 1000;
  bonusCacheKey = key;
  bonusCacheValue = Object.freeze(bonus);
  return bonusCacheValue;
}

/** Test/debug hook: clear the memoized bonus cache. */
export function resetCourtCaches() {
  bonusCacheKey = null;
  bonusCacheValue = null;
}

export function applyCourtLoadout(progress, game) {
  if (!progress || !game?.player) return null;
  const bonus = courtBonuses(progress);
  game.setChallenge({ difficulty: 'normal', bonus, ngPlus: progress.ngPlus || 0 });
  const p = game.player;
  const owned = [...new Set(['sword', ...progress.weapons.filter((id) => COURT_WEAPON_BY_ID[id])])];
  p.weapons = owned;
  p.weapon = owned.includes(progress.equippedWeapon) ? progress.equippedWeapon : 'sword';
  p.speedMult *= 1 + bonus.speed;
  p.attack = null;
  p.comboIndex = 0;
  return bonus;
}

export function courtTrialUnlocked(progress, trialId) {
  const trial = COURT_TRIAL_BY_ID[trialId];
  if (!progress || !trial) return false;
  if (trial.requires === 'completion') return !!progress.completion;
  if (trial.requires === 'glassorchard') return (progress.zoneUnlocked || []).includes('glassorchard');
  return true;
}

export function setCourtNgPlus(progress, value) {
  if (!progress) return { ok: false, reason: 'progress' };
  if (!progress.completion) return { ok: false, reason: 'locked' };
  progress.ngPlus = clamp(asInt(value, 0), 0, COURT_NG_PLUS_MAX);
  return { ok: true, ngPlus: progress.ngPlus };
}

export function recordCourtTrial(progress, trialId, seconds, options = {}) {
  const trial = COURT_TRIAL_BY_ID[trialId];
  if (!progress || !trial) return { ok: false, reason: 'unknown' };
  if (!courtTrialUnlocked(progress, trialId)) return { ok: false, reason: 'locked' };
  if (!progress.trials) progress.trials = {};
  const state = progress.trials[trialId] || (progress.trials[trialId] = { clears: 0, bestTime: 0 });
  const time = Math.max(0, Math.round((Number(seconds) || 0) * 10) / 10);
  const firstClear = state.clears === 0;
  const isBest = !state.bestTime || time < state.bestTime;
  if (isBest) state.bestTime = time;
  state.clears += 1;
  progress.stats.trialClears = (progress.stats.trialClears || 0) + 1;
  const ngPlus = clamp(asInt(options.ngPlus, progress.ngPlus || 0), 0, COURT_NG_PLUS_MAX);
  const marks = firstClear ? trial.reward + ngPlus * 40 : Math.round(trial.reward * 0.25);
  progress.marks += marks;
  progress.stats.marksEarned += marks;
  return {
    ok: true,
    trial,
    firstClear,
    isBest,
    time,
    bestTime: state.bestTime,
    clears: state.clears,
    marks,
  };
}

export function courtStats(progress = defaultCourtProgress()) {
  const p = progress || defaultCourtProgress();
  let cleared = 0;
  let zonesCleared = 0;
  for (let index = 0; index < COURT_ROOM_COUNT; index++) if (p.cleared[index]) cleared += 1;
  for (const zone of COURT_ZONES) {
    if (courtZoneCleared(p, zone.id) === COURT_ROOMS_PER_ZONE) zonesCleared += 1;
  }
  return {
    cleared,
    total: COURT_ROOM_COUNT,
    percent: Math.round((cleared / COURT_ROOM_COUNT) * 100),
    marks: p.marks,
    zones: p.zoneUnlocked.length,
    totalZones: COURT_ZONES.length,
    zonesCleared,
    weapons: p.weapons.length,
    totalWeapons: COURT_WEAPONS.length,
    tools: p.tools.length,
    totalTools: COURT_TOOLS.length,
    bosses: Object.values(p.bossKills || {}).reduce((sum, value) => sum + value, 0),
    residents: HOUSE_RESIDENTS.filter((resident) => residentUnlocked(p, resident.id)).length,
    totalResidents: HOUSE_RESIDENTS.length,
    warmth: houseWarmth(p),
    completion: !!p.completion,
    ngPlus: p.ngPlus || 0,
    trialClears: p.stats?.trialClears || 0,
    rooms: HOUSE_ROOMS.reduce((sum, room) => sum + (p.house.rooms[room.id] || 0), 0),
    maxRoomLevels: HOUSE_ROOMS.reduce((sum, room) => sum + room.maxLevel, 0),
  };
}

export function courtLevelStatus(progress, localIndex) {
  if (!progress) return 'locked';
  const index = asInt(localIndex, -1);
  if (index < 0 || index >= COURT_ROOM_COUNT) return 'locked';
  if (progress.cleared[index]) return 'cleared';
  if (courtLevelUnlocked(progress, index)) return 'available';
  return 'locked';
}

export function courtZoneSummary(progress) {
  return COURT_ZONES.map((zone) => {
    const cleared = courtZoneCleared(progress, zone.id);
    return {
      zone,
      cleared,
      total: COURT_ROOMS_PER_ZONE,
      unlocked: (progress?.zoneUnlocked || []).includes(zone.id),
      boss: COURT_BOSS_INFO[zone.boss],
      miniBoss: COURT_BOSS_INFO[zone.miniBoss],
    };
  });
}
