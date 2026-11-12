// Ashen Vow v0.3.0 — deterministic 2D combat simulation.
// Pure logic: no DOM, no canvas, no audio. Runs identically in Node and the browser.
import {
  EXPANSION_ROOMS,
  EXPANSION_ENEMY_INFO,
  EXPANSION_BOSS_INFO,
  DIFFICULTY_BY_ID,
  MODIFIER_BY_ID,
  expansionModifierTotals,
  expansionLevelByIndex,
  ENEMY_VARIANTS,
} from './expansion.js';

export const VIEW_W = 960;
export const VIEW_H = 540;
export const WORLD_W = 1400;
export const FLOOR_Y = 470;
export const GRAVITY = 2200;

const ATTACKS = [
  { windup: 0.045, active: 0.115, recover: 0.13, range: 60, height: 46, dmg: 12, knock: 150, name: 'slash' },
  { windup: 0.045, active: 0.115, recover: 0.13, range: 62, height: 46, dmg: 14, knock: 180, name: 'slash' },
  { windup: 0.09, active: 0.16, recover: 0.2, range: 76, height: 56, dmg: 24, knock: 300, name: 'heavy' },
];

const BLESSINGS = [
  { id: 'iron', name: 'Vow of Iron', desc: '+40 Max HP. Sembuh sepenuhnya.' },
  { id: 'ember', name: 'Vow of Embers', desc: 'Kerusakan pedang +30%.' },
  { id: 'wind', name: 'Vow of Wind', desc: 'Cooldown dash -35%, i-frame dash lebih lama.' },
];

export const WEAPONS = {
  sword: { id: 'sword', name: 'Pedang Sumpah', short: 'PEDANG' },
  pike: { id: 'pike', name: 'Pike Penjaga', short: 'PIKE' },
  bow: { id: 'bow', name: 'Busur Abu', short: 'BUSUR' },
};

export const ENEMY_INFO = {
  crawler: {
    name: 'Crawler',
    title: 'Perayap Abu',
    hp: 34,
    dmg: 8,
    speed: 78,
    w: 46,
    h: 30,
    reward: 8,
    danger: 'RENDAH',
    desc: 'Sisa tubuh yang merangkak keluar dari retakan bara. Cepat mendekat, mudah dipatahkan.',
    where: 'Gerbang Abu · Balai Sumpah',
  },
  sentinel: {
    name: 'Sentinel',
    title: 'Penjaga Berkarat',
    hp: 64,
    dmg: 14,
    speed: 88,
    w: 44,
    h: 54,
    reward: 15,
    danger: 'SEDANG',
    desc: 'Penjaga tua yang masih menuruti perintah terakhir. Menandai sasaran sebelum menerjang.',
    where: 'Balai Sumpah · Menara Lonceng',
  },
  wraith: {
    name: 'Hollow Wraith',
    title: 'Arwah Tanpa Nama',
    hp: 48,
    dmg: 10,
    speed: 66,
    w: 40,
    h: 60,
    reward: 16,
    danger: 'SEDANG',
    desc: 'Arwah yang melayang di atas jurang. Menjaga jarak dan melepas serpihan nyala dari kejauhan.',
    where: 'Jembatan Tulang · Menara Lonceng',
  },
  brute: {
    name: 'Cinder Brute',
    title: 'Raksasa Bara',
    hp: 120,
    dmg: 18,
    speed: 64,
    w: 64,
    h: 64,
    reward: 22,
    danger: 'TINGGI',
    desc: 'Gumpalan bara yang dipaksa berdiri. Ayunannya lambat, tetapi setiap hentakan membelah lantai.',
    where: 'Jembatan Tulang · Menara Lonceng',
  },
  sporeling: {
    name: 'Sporeling',
    title: 'Anak Spora',
    hp: 30,
    dmg: 9,
    speed: 96,
    w: 36,
    h: 30,
    reward: 10,
    danger: 'RENDAH',
    desc: 'Tunas miselium yang berjalan dengan kaki akar. Saat mati, tubuhnya pecah menjadi awan spora yang lambat membubarkan diri.',
    where: 'Rongga Miselium',
  },
  stalker: {
    name: 'Mycelial Stalker',
    title: 'Pemburu Miselium',
    hp: 76,
    dmg: 16,
    speed: 110,
    w: 48,
    h: 46,
    reward: 20,
    danger: 'TINGGI',
    desc: 'Pemburu berkulit akar yang menggali ke dalam tanah, lalu muncul kembali tepat di bawah langkahmu.',
    where: 'Taman Spora · Jembatan Gantung',
  },
  broodmother: {
    name: 'Brood Mother',
    title: 'Rahim Spora',
    hp: 150,
    dmg: 15,
    speed: 42,
    w: 70,
    h: 58,
    reward: 32,
    danger: 'TINGGI',
    desc: 'Gumpalan induk yang menetas tanpa henti. Setiap kali ia berdenyut, seekor Sporeling merangkak keluar dari tubuhnya.',
    where: 'Sarang Induk',
  },
};

// ── characters and appearance ─────────────────────────────────────────────
export const RACES = {
  human: {
    id: 'human',
    name: 'Manusia',
    title: 'Human',
    desc: 'Adaptif dan seimbang. Tidak punya kelebihan khusus, tetapi tidak pernah kehilangan akal.',
    skin: '#c98f6a',
    eye: '#ffb060',
  },
  elf: {
    id: 'elf',
    name: 'Elf',
    title: 'High Elf',
    desc: 'Langsing dan lincah. Telinga panjangnya mendengar gema sumpah sebelum sumpah itu diucapkan.',
    skin: '#d8b892',
    eye: '#8fe0c0',
  },
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    title: 'Goblin',
    desc: 'Kecil, licik, dan tahan kelaparan. Bertahan hidup adalah satu-satunya sumpah yang ia kenal.',
    skin: '#8fb06a',
    eye: '#d9f06a',
  },
  orc: {
    id: 'orc',
    name: 'Orc',
    title: 'Orc',
    desc: 'Bertulang tebal dan bergigi taring. Luka yang membunuh manusia hanya membuatnya marah.',
    skin: '#7f8f5c',
    eye: '#ff9a4d',
  },
  devil: {
    id: 'devil',
    name: 'Iblis',
    title: 'Devil',
    desc: 'Keturunan api yang memilih berpihak pada manusia. Tanduknya mengingatkan dari mana ia berasal.',
    skin: '#a8503f',
    eye: '#ff5e3a',
  },
};

export const OUTFITS = {
  medieval: {
    id: 'medieval',
    name: 'Medieval',
    title: 'Baja Ksatria',
    desc: 'Pelat baja dan kain sumpah — pakaian para penjaga Opus.',
    color: '#6d2323',
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    title: 'Jaket Perjalanan',
    desc: 'Jaket gelap berlapis pelat ringan, dibuat untuk bertahan di kota yang tidak lagi punya raja.',
    color: '#2f4a5c',
  },
  tribal: {
    id: 'tribal',
    name: 'Tribal',
    title: 'Buluf & Cat Perang',
    desc: 'Kulit, bulu, dan cat perang dari suku yang menolak tunduk pada mahkota mana pun.',
    color: '#7a4a24',
  },
  royal: {
    id: 'royal',
    name: 'Royal',
    title: 'Jubah Bangsawan',
    desc: 'Sutra dan emas terakhir dari istana Opus, dirawat agar tidak ikut menjadi abu.',
    color: '#8b6a1f',
  },
  ashen: {
    id: 'ashen',
    name: 'Ashen',
    title: 'Kain Abu',
    desc: 'Kain yang pernah terbakar dan menolak hancur. Pakaian mereka yang tidak punya apa-apa lagi.',
    color: '#4a4440',
  },
};

export const SKIN_TONES = ['#f0c9a8', '#d8a97f', '#c98f6a', '#a9714c', '#7d5238', '#8fb06a', '#7f8f5c', '#a8503f'];

export const OUTFIT_COLORS = ['#6d2323', '#2f4a5c', '#7a4a24', '#8b6a1f', '#3b4a2f', '#4a4440', '#5b2f6b', '#2a2a30'];

export const CHARACTERS = {
  sera: {
    id: 'sera',
    name: 'Sera Vayne',
    title: 'The Oathbound',
    className: 'Knight',
    glyph: '⚔',
    desc: 'Ksatria terakhir Opus. Seimbang dalam serangan dan pertahanan, dengan kemampuan tebasan menyapu suci.',
    maxHp: 100,
    speed: 1,
    damage: 1,
    dash: 1,
    build: 1,
    appearance: { race: 'human', skin: '#c98f6a', outfit: '#6d2323', armor: 'medieval' },
    ability: {
      id: 'oath_sweep',
      name: 'Tebasan Sumpah',
      key: 'U / V',
      cooldown: 5.5,
      desc: 'Tebasan busur besar (Sweep) bercahaya emas yang menyapu seluruh musuh di depan dan menangkis proyektil.',
    },
  },
  lyna: {
    id: 'lyna',
    name: 'Lyna Windstrider',
    title: 'The Ashen Ranger',
    className: 'Elf Archer',
    glyph: '🏹',
    desc: 'Pemanah elf berdarah dingin. Bergerak sangat lincah dan membidik celah kelemahan musuh dari kejauhan.',
    maxHp: 88,
    speed: 1.08,
    damage: 1.04,
    dash: 0.85,
    build: 0.95,
    appearance: { race: 'elf', skin: '#d8a97f', outfit: '#3b4a2f', armor: 'modern' },
    ability: {
      id: 'long_shot',
      name: 'Tembakan Badai',
      key: 'U / V',
      cooldown: 5,
      desc: 'Menembakkan panah badai berkecepatan tinggi yang menembus semua musuh dalam satu garis lurus.',
    },
  },
  kael: {
    id: 'kael',
    name: 'Kael Shadowstep',
    title: 'The Nightblade',
    className: 'Assassin',
    glyph: '🗡',
    desc: 'Pembunuh bayaran bayangan Opus. Sangat lincah dan mematikan saat menyelinap menembus pertahanan musuh.',
    maxHp: 82,
    speed: 1.14,
    damage: 1.12,
    dash: 0.75,
    build: 0.92,
    appearance: { race: 'goblin', skin: '#8fb06a', outfit: '#2a2a30', armor: 'modern' },
    ability: {
      id: 'shadow_step',
      name: 'Langkah Bayangan',
      key: 'U / V',
      cooldown: 4.8,
      desc: 'Menerobos bayangan secara instan dengan i-frame, menebas semua musuh di sepanjang jalur lintasan.',
    },
  },
  karn: {
    id: 'karn',
    name: 'Karn of the Ash',
    title: 'The Broken Vow',
    className: 'Brawler',
    glyph: '⛨',
    desc: 'Prajurit bertubuh baja yang bangkit dari tumpukan mayat. Lebih tebal dan keras, dengan hentakan penghancur batu.',
    maxHp: 125,
    speed: 0.93,
    damage: 1.08,
    dash: 0.9,
    build: 1.08,
    appearance: { race: 'orc', skin: '#7f8f5c', outfit: '#7a4a24', armor: 'tribal' },
    ability: {
      id: 'ground_slam',
      name: 'Hentakan Bara',
      key: 'U / V',
      cooldown: 6.5,
      desc: 'Menghantam tanah dengan kekuatan dahsyat, melepaskan gelombang kejut seismik ke kiri dan kanan.',
    },
  },
  ignis: {
    id: 'ignis',
    name: 'Ignis Pyrewalker',
    title: 'The Cinder Weaver',
    className: 'Mage',
    glyph: '🔥',
    desc: 'Penyihir abu keturunan iblis. Mengorbankan pertahanan demi pusaran api magis berdaya rusak tinggi.',
    maxHp: 86,
    speed: 0.98,
    damage: 1.16,
    dash: 0.92,
    build: 0.96,
    appearance: { race: 'devil', skin: '#a8503f', outfit: '#5b2f6b', armor: 'royal' },
    ability: {
      id: 'flame_nova',
      name: 'Ledakan Nova Bara',
      key: 'U / V',
      cooldown: 6,
      desc: 'Memicu pusaran 8 bola api bara melingkar yang membakar musuh di sekitar dan melenyapkan proyektil lawan.',
    },
  },
  gladiator: {
    id: 'gladiator',
    name: 'Varek the Unbroken',
    title: 'The Gladiator',
    className: 'Gladiator',
    glyph: '⚔',
    desc: 'Juara arena yang tidak pernah berhenti menyerang. Menerjang lurus menembus barisan musuh dengan perisai dan bilah.',
    maxHp: 115,
    speed: 1.02,
    damage: 1.06,
    dash: 0.9,
    build: 1.05,
    appearance: { race: 'human', skin: '#a9714c', outfit: '#7a4a24', armor: 'tribal' },
    ability: {
      id: 'arena_charge',
      name: 'Terjangan Arena',
      key: 'U / V',
      cooldown: 6,
      desc: 'Menerjang ke depan sejauh 160 unit, meremukkan semua musuh di lintasan, dan memberi i-frame singkat.',
    },
  },
  retiarius: {
    id: 'retiarius',
    name: 'Neris of the Net',
    title: 'The Retiarius',
    className: 'Netfighter',
    glyph: '⌗',
    desc: 'Pemburu yang bertarung dengan jaring dan trisula. Mengunci langkah musuh sebelum menusuk dari jarak aman.',
    maxHp: 90,
    speed: 1.06,
    damage: 1.02,
    dash: 0.82,
    build: 0.95,
    appearance: { race: 'elf', skin: '#d8a97f', outfit: '#2f4a5c', armor: 'modern' },
    ability: {
      id: 'net_cast',
      name: 'Jaring Penjaga',
      key: 'U / V',
      cooldown: 5.2,
      desc: 'Melempar jaring yang menembus musuh, memberi damage, dan menahan gerak mereka selama 2,4 detik.',
    },
  },
  stormcaller: {
    id: 'stormcaller',
    name: 'Astra Stormcaller',
    title: 'The Stormcaller',
    className: 'Stormcaller',
    glyph: 'ϟ',
    desc: 'Perantara badai yang menyalurkan murka langit. Petirnya melompat dari satu tubuh ke tubuh lain.',
    maxHp: 84,
    speed: 1,
    damage: 1.14,
    dash: 0.94,
    build: 0.94,
    appearance: { race: 'devil', skin: '#a8503f', outfit: '#5b2f6b', armor: 'royal' },
    ability: {
      id: 'chain_lightning',
      name: 'Rantai Badai',
      key: 'U / V',
      cooldown: 6.4,
      desc: 'Menyambar hingga 4 musuh terdekat dengan petir berantai; setiap lompatan berikutnya sedikit melemah.',
    },
  },
  sentinel: {
    id: 'sentinel',
    name: 'Bram Ironward',
    title: 'The Sentinel',
    className: 'Sentinel',
    glyph: '⛨',
    desc: 'Penjaga gerbang terakhir Opus. Berdiri seperti tembok dan menghukum siapa pun yang berani mendekat.',
    maxHp: 120,
    speed: 0.94,
    damage: 1,
    dash: 0.95,
    build: 1.1,
    appearance: { race: 'orc', skin: '#7f8f5c', outfit: '#4a4440', armor: 'ashen' },
    ability: {
      id: 'aegis_pulse',
      name: 'Denyut Aegis',
      key: 'U / V',
      cooldown: 7,
      desc: 'Memancarkan gelombang perisai yang memukul mundur musuh di sekitar dan memberi 3,2 detik kebal.',
    },
  },
  warden: {
    id: 'warden',
    name: 'Maera Thornward',
    title: 'The Warden',
    className: 'Warden',
    glyph: '❧',
    desc: 'Penjaga akar pertama. Duri-duri Opus tumbuh dari tanah untuk membalas setiap langkah musuh.',
    maxHp: 98,
    speed: 1.03,
    damage: 1.03,
    dash: 0.88,
    build: 1,
    appearance: { race: 'goblin', skin: '#8fb06a', outfit: '#3b4a2f', armor: 'tribal' },
    ability: {
      id: 'thorn_volley',
      name: 'Voli Duri',
      key: 'U / V',
      cooldown: 5.5,
      desc: 'Menembakkan lima duri akar dalam kipas ke arah hadap. Setiap duri menusuk dan memperlambat langkah.',
    },
  },
};

export const DEFAULT_APPEARANCE = { race: 'human', skin: '#c98f6a', outfit: '#6d2323', armor: 'medieval' };

const PIKE_ATTACK = {
  windup: 0.24,
  active: 0.15,
  recover: 0.34,
  range: 118,
  height: 48,
  dmg: 29,
  knock: 260,
  name: 'pierce',
};

const BOW_ATTACK = {
  windup: 0.26,
  active: 0.08,
  recover: 0.34,
  range: 0,
  height: 0,
  dmg: 22,
  knock: 120,
  name: 'arrow',
};

export const SHOP_ITEMS = [
  {
    id: 'pike',
    name: 'Pike Penjaga',
    desc: 'Senjata jarak jauh. Jangkauan 118, ayunan lambat, damage besar.',
    cost: 35,
    type: 'weapon',
    glyph: '⟋',
    effect: 'Senjata jarak menengah',
  },
  {
    id: 'bow',
    name: 'Busur Abu',
    desc: 'Senjata jarak jauh. Menembak anak panah; amunisi terbatas.',
    cost: 55,
    type: 'weapon',
    glyph: '➶',
    effect: 'Senjata jarak jauh',
  },
  {
    id: 'sigil_ember',
    name: 'Sigil Bara',
    desc: 'Sigil permanen. Seluruh damage serangan meningkat 18% sampai run berakhir.',
    cost: 45,
    type: 'sigil',
    glyph: '✹',
    effect: '+18% damage',
  },
  {
    id: 'sigil_iron',
    name: 'Sigil Besi',
    desc: 'Sigil permanen. Menambah 25 HP maksimum dan langsung memulihkan 25 HP.',
    cost: 40,
    type: 'sigil',
    glyph: '⛊',
    effect: '+25 HP maksimum',
  },
  {
    id: 'sigil_wind',
    name: 'Sigil Angin',
    desc: 'Sigil permanen. Gerak 8% lebih cepat dan cooldown dash 12% lebih singkat.',
    cost: 40,
    type: 'sigil',
    glyph: '≋',
    effect: '+8% kecepatan',
  },
  {
    id: 'sigil_vow',
    name: 'Sigil Sumpah',
    desc: 'Sigil permanen. Menambah satu charge flask dan mengisi ulang seluruh flask.',
    cost: 60,
    type: 'sigil',
    glyph: '✧',
    effect: '+1 flask maksimum',
  },
  {
    id: 'ritual_purge',
    name: 'Ritus Penyucian',
    desc: 'Item ritual. Memberi 60 damage ke semua musuh dan melenyapkan proyektil lawan di ruangan.',
    cost: 50,
    type: 'ritual',
    glyph: '☼',
    effect: 'Damage area 60',
  },
  {
    id: 'ritual_ward',
    name: 'Ritus Penjagaan',
    desc: 'Item ritual. Memberi kebal selama 6 detik dan memulihkan 15 HP.',
    cost: 40,
    type: 'ritual',
    glyph: '☩',
    effect: 'Kebal 6 detik',
  },
  {
    id: 'ritual_ember',
    name: 'Ritus Bara',
    desc: 'Item ritual. Melepaskan 12 bola api ke segala arah untuk membakar musuh di sekitar.',
    cost: 45,
    type: 'ritual',
    glyph: '✺',
    effect: '12 bola api',
  },
  {
    id: 'ritual_mend',
    name: 'Ritus Pemulihan',
    desc: 'Item ritual. Memulihkan 50 HP dan menambah satu charge flask.',
    cost: 35,
    type: 'ritual',
    glyph: '❈',
    effect: 'Heal 50 + flask',
  },
  {
    id: 'shuriken',
    name: 'Shuriken ×3',
    desc: 'Konsumabel. Tekan C untuk melempar. Damage ringan, cepat.',
    cost: 14,
    type: 'consumable',
    glyph: '✦',
    shortName: 'SHURIKEN',
    effect: 'Lemparan cepat',
  },
  {
    id: 'knives',
    name: 'Pisau Lempar ×5',
    desc: 'Konsumabel. Pisau terbang lebih cepat dan lebih tajam daripada shuriken.',
    cost: 18,
    type: 'consumable',
    glyph: '⌁',
    shortName: 'PISAU',
    effect: '5 lemparan tajam',
  },
  {
    id: 'bomb',
    name: 'Bom Bara ×2',
    desc: 'Konsumabel. Bom meledak saat menghantam musuh atau tanah, membakar area di sekitarnya.',
    cost: 24,
    type: 'consumable',
    glyph: '◉',
    shortName: 'BOM',
    effect: 'Ledakan area',
  },
  {
    id: 'tonic',
    name: 'Tonik Abu',
    desc: 'Konsumabel. Langsung memulihkan 30 HP tanpa memakai charge flask.',
    cost: 16,
    type: 'consumable',
    glyph: '✚',
    shortName: 'TONIK',
    effect: 'Heal 30 instan',
  },
  {
    id: 'smoke',
    name: 'Vial Asap',
    desc: 'Konsumabel. Menyelimuti tubuh dengan asap dan memberi kebal selama 2,5 detik.',
    cost: 20,
    type: 'consumable',
    glyph: '☁',
    shortName: 'ASAP',
    effect: 'Kebal 2,5 detik',
  },
  {
    id: 'whetstone',
    name: 'Batu Asah',
    desc: 'Konsumabel. Menajamkan senjata: damage +30% selama 25 detik.',
    cost: 22,
    type: 'consumable',
    glyph: '▰',
    shortName: 'BATU ASAH',
    effect: '+30% damage 25 dtk',
  },
  {
    id: 'arrows',
    name: 'Anak Panah ×6',
    desc: 'Amunisi Busur Abu. Hanya bisa dibeli setelah memiliki busur.',
    cost: 12,
    type: 'ammo',
    glyph: '➳',
    effect: 'Amunisi busur',
  },
  {
    id: 'flask',
    name: 'Isi Ulang Flask',
    desc: 'Mengembalikan semua charge flask.',
    cost: 10,
    type: 'flask',
    glyph: '✚',
    effect: 'Isi ulang flask',
  },
];

export const ITEM_TYPE_LABEL = {
  weapon: 'Senjata',
  consumable: 'Konsumabel',
  ammo: 'Amunisi',
  flask: 'Bekal',
  sigil: 'Sigil',
  ritual: 'Ritual',
};

export const SHOP_ITEM_BY_ID = Object.fromEntries(SHOP_ITEMS.map((item) => [item.id, item]));

export const ROOMS = [
  {
    id: 0,
    name: 'Gerbang Abu',
    subtitle: 'The Ashen Gate',
    accent: '#d07a35',
    spawn: { x: 90, y: FLOOR_Y - 46 },
    platforms: [
      { x: 0, y: 470, w: 1400, h: 70 },
      { x: 300, y: 378, w: 190, h: 18 },
      { x: 650, y: 328, w: 180, h: 18 },
      { x: 1000, y: 392, w: 160, h: 18 },
    ],
    enemies: [
      { type: 'crawler', x: 470, minX: 380, maxX: 600 },
      { type: 'crawler', x: 1120, minX: 1030, maxX: 1220 },
    ],
    relic: null,
    boss: null,
    gate: { x: 1362, y: 286, w: 34, h: 184, requires: 'clear' },
    hint: 'Bersihkan gerbang dari abu yang hidup.',
  },
  {
    id: 1,
    name: 'Balai Sumpah',
    subtitle: 'Hall of Oaths',
    accent: '#b9562f',
    spawn: { x: 90, y: FLOOR_Y - 46 },
    platforms: [
      { x: 0, y: 470, w: 560, h: 70 },
      { x: 730, y: 470, w: 670, h: 70 },
      { x: 200, y: 368, w: 180, h: 18 },
      { x: 470, y: 306, w: 190, h: 18 },
      { x: 900, y: 382, w: 150, h: 18 },
      { x: 1100, y: 300, w: 210, h: 18 },
    ],
    enemies: [
      { type: 'crawler', x: 330, minX: 200, maxX: 470 },
      { type: 'sentinel', x: 1000, minX: 860, maxX: 1180 },
    ],
    relic: { x: 1194, y: 254, w: 26, h: 26, name: 'Ember Feather' },
    boss: null,
    gate: { x: 1362, y: 286, w: 34, h: 184, requires: 'relic' },
    hint: 'Ambil relik Bulu Bara di ujung balai. Dash melewati jurang.',
  },
  {
    id: 2,
    name: 'Singgasana Bara',
    subtitle: 'Throne of Cinders',
    accent: '#e0913c',
    spawn: { x: 250, y: FLOOR_Y - 46 },
    checkpoint: { x: 88, y: FLOOR_Y - 78, w: 38, h: 78, name: 'Warung Abu' },
    merchant: { x: 168, y: FLOOR_Y - 96, w: 46, h: 96 },
    platforms: [
      { x: 0, y: 470, w: 1400, h: 70 },
      { x: 120, y: 352, w: 190, h: 18 },
      { x: 1090, y: 352, w: 190, h: 18 },
      { x: 600, y: 318, w: 200, h: 18 },
    ],
    enemies: [],
    relic: null,
    boss: 'warden',
    gates: [
      { x: 1362, y: 286, w: 34, h: 184, requires: 'boss', next: 3, name: 'Menara Lonceng' },
      { x: 26, y: 286, w: 34, h: 184, requires: 'boss', next: 8, name: 'Rongga Miselium' },
    ],
    hint: 'Sir Mordrake, Penjaga yang Gugur, menanti di tengah bara. Setelah ia gugur, celah miselium di barat terbuka.',
  },
  {
    id: 3,
    name: 'Sarang Wyrm',
    subtitle: "Wyrm's Roost",
    accent: '#cf5a45',
    spawn: { x: 240, y: FLOOR_Y - 46 },
    checkpoint: { x: 70, y: FLOOR_Y - 78, w: 38, h: 78, name: 'Warung Abu' },
    merchant: { x: 150, y: FLOOR_Y - 96, w: 46, h: 96 },
    platforms: [
      { x: 0, y: 470, w: 430, h: 70 },
      { x: 970, y: 470, w: 430, h: 70 },
      { x: 500, y: 360, w: 200, h: 18 },
      { x: 800, y: 360, w: 200, h: 18 },
      { x: 640, y: 268, w: 190, h: 18 },
    ],
    enemies: [],
    relic: null,
    boss: 'wyrm',
    gate: { x: 1362, y: 286, w: 34, h: 184, requires: 'boss' },
    hint: 'Vhael, Wyrm Abu, bangkit dari dasar jurang.',
  },
  {
    id: 4,
    name: 'Jembatan Tulang',
    subtitle: 'The Bone Bridge',
    accent: '#9b7550',
    spawn: { x: 80, y: FLOOR_Y - 46 },
    checkpoint: { x: 64, y: FLOOR_Y - 78, w: 38, h: 78, name: 'Warung Abu' },
    merchant: { x: 144, y: FLOOR_Y - 96, w: 46, h: 96 },
    platforms: [
      { x: 0, y: 470, w: 420, h: 70 },
      { x: 980, y: 470, w: 420, h: 70 },
      { x: 450, y: 406, w: 130, h: 18 },
      { x: 830, y: 406, w: 130, h: 18 },
      { x: 590, y: 330, w: 180, h: 18 },
      { x: 760, y: 250, w: 170, h: 18 },
    ],
    enemies: [
      { type: 'wraith', x: 620, minX: 440, maxX: 940 },
      { type: 'brute', x: 1140, minX: 1000, maxX: 1320 },
    ],
    relic: null,
    boss: null,
    gate: { x: 1362, y: 286, w: 34, h: 184, requires: 'clear' },
    hint: 'Seberangi jembatan. Wraith menembak dari kejauhan, Brute menghancurkan lantai.',
  },
  {
    id: 5,
    name: 'Katedral Sunyi',
    subtitle: 'The Silent Cathedral',
    accent: '#8d84b8',
    spawn: { x: 250, y: FLOOR_Y - 46 },
    checkpoint: { x: 88, y: FLOOR_Y - 78, w: 38, h: 78, name: 'Warung Abu' },
    merchant: { x: 168, y: FLOOR_Y - 96, w: 46, h: 96 },
    platforms: [
      { x: 0, y: 470, w: 1400, h: 70 },
      { x: 170, y: 356, w: 190, h: 18 },
      { x: 600, y: 320, w: 210, h: 18 },
      { x: 1060, y: 356, w: 190, h: 18 },
      { x: 390, y: 250, w: 150, h: 18 },
      { x: 880, y: 250, w: 150, h: 18 },
    ],
    enemies: [],
    relic: null,
    boss: 'choir',
    gate: { x: 1362, y: 286, w: 34, h: 184, requires: 'boss' },
    hint: 'The Hollow Choir menyanyikan sumpah yang tidak pernah ada.',
  },
  {
    id: 6,
    name: 'Menara Lonceng',
    subtitle: 'The Bell Tower',
    accent: '#c9a25c',
    spawn: { x: 80, y: FLOOR_Y - 46 },
    checkpoint: { x: 64, y: FLOOR_Y - 78, w: 38, h: 78, name: 'Warung Abu' },
    merchant: { x: 144, y: FLOOR_Y - 96, w: 46, h: 96 },
    platforms: [
      { x: 0, y: 470, w: 1400, h: 70 },
      { x: 150, y: 380, w: 180, h: 18 },
      { x: 390, y: 304, w: 180, h: 18 },
      { x: 650, y: 356, w: 180, h: 18 },
      { x: 900, y: 286, w: 180, h: 18 },
      { x: 1160, y: 366, w: 170, h: 18 },
    ],
    enemies: [
      { type: 'sentinel', x: 540, minX: 430, maxX: 760 },
      { type: 'wraith', x: 1010, minX: 860, maxX: 1180 },
      { type: 'brute', x: 1260, minX: 1120, maxX: 1340 },
    ],
    relic: null,
    boss: null,
    gate: { x: 1362, y: 286, w: 34, h: 184, requires: 'clear' },
    hint: 'Panjat menara. Lonceng terakhir berbunyi untuk setiap langkahmu.',
  },
  {
    id: 7,
    name: 'Puncak Sumpah',
    subtitle: 'Summit of the Vow',
    accent: '#e2b46c',
    spawn: { x: 250, y: FLOOR_Y - 46 },
    checkpoint: { x: 88, y: FLOOR_Y - 78, w: 38, h: 78, name: 'Warung Abu' },
    merchant: { x: 168, y: FLOOR_Y - 96, w: 46, h: 96 },
    platforms: [
      { x: 0, y: 470, w: 1400, h: 70 },
      { x: 100, y: 344, w: 180, h: 18 },
      { x: 1120, y: 344, w: 180, h: 18 },
      { x: 560, y: 300, w: 280, h: 18 },
      { x: 330, y: 230, w: 160, h: 18 },
      { x: 910, y: 230, w: 160, h: 18 },
    ],
    enemies: [],
    relic: null,
    boss: 'oathbreaker',
    gate: null,
    hint: 'The Oathbreaker menanti di atas semua sumpah yang pernah kau ucapkan.',
  },
  // ── v0.1.0: Mycelial Hollow ─────────────────────────────────────────────
  {
    id: 8,
    name: 'Lubang Masuk',
    subtitle: 'The Entry Shaft',
    accent: '#a86bd8',
    spawn: { x: 90, y: FLOOR_Y - 46 },
    checkpoint: { x: 64, y: FLOOR_Y - 78, w: 38, h: 78, name: 'Warung Abu' },
    merchant: { x: 144, y: FLOOR_Y - 96, w: 46, h: 96 },
    platforms: [
      { x: 0, y: 470, w: 1400, h: 70 },
      { x: 210, y: 386, w: 190, h: 18 },
      { x: 500, y: 318, w: 170, h: 18 },
      { x: 780, y: 250, w: 190, h: 18 },
      { x: 1080, y: 336, w: 190, h: 18 },
    ],
    enemies: [
      { type: 'sporeling', x: 520, minX: 300, maxX: 700 },
      { type: 'sporeling', x: 1160, minX: 1000, maxX: 1320 },
    ],
    relic: null,
    boss: null,
    bounce: [{ x: 430, y: 462, w: 90, h: 16, power: 980 }],
    climbs: [{ x: 940, y: 230, w: 24, h: 240 }],
    gate: { x: 1362, y: 286, w: 34, h: 184, requires: 'clear', next: 9, name: 'Taman Spora' },
    hint: 'Panjat miselium dan lompat di atas topi spora. Bersihkan lubang masuk.',
  },
  {
    id: 9,
    name: 'Taman Spora',
    subtitle: 'Spore Gardens',
    accent: '#b07be8',
    spawn: { x: 90, y: FLOOR_Y - 46 },
    platforms: [
      { x: 0, y: 470, w: 520, h: 70 },
      { x: 930, y: 470, w: 470, h: 70 },
      { x: 560, y: 392, w: 140, h: 18 },
      { x: 760, y: 392, w: 140, h: 18 },
      { x: 300, y: 360, w: 170, h: 18 },
      { x: 1000, y: 330, w: 180, h: 18 },
    ],
    enemies: [
      { type: 'sporeling', x: 330, minX: 180, maxX: 470 },
      { type: 'sporeling', x: 1020, minX: 960, maxX: 1160 },
      { type: 'sporeling', x: 1240, minX: 1160, maxX: 1330 },
      { type: 'stalker', x: 1140, minX: 960, maxX: 1320 },
    ],
    relic: null,
    boss: null,
    bounce: [{ x: 460, y: 462, w: 86, h: 16, power: 1050 }],
    climbs: [{ x: 900, y: 330, w: 22, h: 140 }],
    gate: { x: 1362, y: 286, w: 34, h: 184, requires: 'clear', next: 10, name: 'Jembatan Gantung' },
    hint: 'Lompat dari topi spora ke jembatan akar. Awan spora melukai perlahan.',
  },
  {
    id: 10,
    name: 'Jembatan Gantung',
    subtitle: 'Hanging Bridges',
    accent: '#9b6ac7',
    spawn: { x: 90, y: FLOOR_Y - 46 },
    checkpoint: { x: 64, y: FLOOR_Y - 78, w: 38, h: 78, name: 'Warung Abu' },
    merchant: { x: 144, y: FLOOR_Y - 96, w: 46, h: 96 },
    platforms: [
      { x: 0, y: 470, w: 380, h: 70 },
      { x: 1040, y: 470, w: 360, h: 70 },
      { x: 420, y: 404, w: 180, h: 18 },
      { x: 650, y: 336, w: 180, h: 18 },
      { x: 860, y: 404, w: 140, h: 18 },
      { x: 1120, y: 340, w: 190, h: 18 },
    ],
    enemies: [
      { type: 'stalker', x: 250, minX: 140, maxX: 340 },
      { type: 'sporeling', x: 1120, minX: 1060, maxX: 1220 },
      { type: 'sporeling', x: 1270, minX: 1220, maxX: 1340 },
      { type: 'stalker', x: 1180, minX: 1060, maxX: 1330 },
    ],
    relic: null,
    boss: null,
    bounce: [{ x: 300, y: 462, w: 86, h: 16, power: 1080 }],
    climbs: [{ x: 1000, y: 340, w: 22, h: 130 }],
    gate: { x: 1362, y: 286, w: 34, h: 184, requires: 'clear', next: 11, name: 'Sarang Induk' },
    hint: 'Jembatan akar rapuh di atas jurang. Stalker menggali dari bawah pijakanmu.',
  },
  {
    id: 11,
    name: 'Sarang Induk',
    subtitle: 'Brood Nest',
    accent: '#c084e0',
    spawn: { x: 120, y: FLOOR_Y - 46 },
    platforms: [
      { x: 0, y: 470, w: 1400, h: 70 },
      { x: 250, y: 372, w: 210, h: 18 },
      { x: 600, y: 292, w: 190, h: 18 },
      { x: 920, y: 342, w: 220, h: 18 },
    ],
    enemies: [
      { type: 'broodmother', x: 980, minX: 820, maxX: 1160 },
      { type: 'sporeling', x: 430, minX: 320, maxX: 560 },
      { type: 'sporeling', x: 1250, minX: 1170, maxX: 1340 },
      { type: 'stalker', x: 720, minX: 600, maxX: 820 },
    ],
    relic: null,
    boss: null,
    secretWall: { x: 10, y: 0, w: 60, h: 470, hp: 120, name: 'Dinding Miselium', next: 12 },
    gates: [
      { x: 1362, y: 286, w: 34, h: 184, requires: 'clear', next: 13, name: 'Altar Spora' },
      { x: 6, y: 286, w: 34, h: 184, requires: 'wall', next: 12, secret: true, name: 'Relung Tersembunyi' },
    ],
    hint: 'Brood Mother menetas tanpa henti. Dinding barat berdenyut seperti jantung.',
  },
  {
    id: 12,
    name: 'Relung Tersembunyi',
    subtitle: 'The Hidden Alcove',
    accent: '#d8a35c',
    spawn: { x: 120, y: FLOOR_Y - 46 },
    platforms: [
      { x: 0, y: 470, w: 1400, h: 70 },
      { x: 180, y: 360, w: 200, h: 18 },
      { x: 560, y: 300, w: 180, h: 18 },
      { x: 1020, y: 356, w: 200, h: 18 },
    ],
    enemies: [],
    relic: null,
    boss: 'root',
    gate: { x: 1362, y: 286, w: 34, h: 184, requires: 'boss', next: 11, name: 'Sarang Induk' },
    hint: 'Root of the First Vow tertanam di relung yang tidak pernah masuk peta. Hadiahnya bertahan sampai akhir run.',
  },
  {
    id: 13,
    name: 'Altar Spora',
    subtitle: 'The Spore Altar',
    accent: '#8f5bcf',
    spawn: { x: 250, y: FLOOR_Y - 46 },
    checkpoint: { x: 88, y: FLOOR_Y - 78, w: 38, h: 78, name: 'Warung Abu' },
    merchant: { x: 168, y: FLOOR_Y - 96, w: 46, h: 96 },
    platforms: [
      { x: 0, y: 470, w: 1400, h: 70 },
      { x: 120, y: 352, w: 190, h: 18 },
      { x: 1090, y: 352, w: 190, h: 18 },
      { x: 600, y: 318, w: 200, h: 18 },
      { x: 340, y: 238, w: 150, h: 18 },
      { x: 930, y: 238, w: 150, h: 18 },
    ],
    enemies: [],
    relic: null,
    boss: 'sporebound',
    bounce: [
      { x: 430, y: 462, w: 84, h: 16, power: 1030 },
      { x: 930, y: 462, w: 84, h: 16, power: 1030 },
    ],
    gate: { x: 1362, y: 286, w: 34, h: 184, requires: 'boss', next: 2, name: 'Singgasana Bara' },
    hint: 'The Sporebound menumbuhkan tubuhnya dari altar. Awan spora menutup setiap arah.',
  },
];

// Legacy rooms stay exactly as they were so old saves, map layout and tests keep
// their meaning. The campaign is a second set of rooms appended at indices 14+.
export const ALL_ROOMS = [...ROOMS, ...EXPANSION_ROOMS];
export const ALL_ENEMY_INFO = { ...ENEMY_INFO, ...EXPANSION_ENEMY_INFO };

const BOSS_INFO = {
  warden: {
    name: 'Sir Mordrake',
    title: 'The Fallen Warden',
    maxHp: 340,
    w: 88,
    h: 112,
    contact: 12,
    ashReward: 60,
    reward: 'blessing',
    spawn: { x: 760, y: FLOOR_Y - 112 },
    dialogue: {
      intro: [
        { speaker: 'Sir Mordrake', text: 'Kau membawa pedang ke singgasana yang sudah mati.' },
        { speaker: 'The Oathbound', text: 'Aku membawa sumpah. Itu cukup.' },
        { speaker: 'Sir Mordrake', text: 'Maka biarkan bara menilai sumpahmu.' },
      ],
      phase2: [
        { speaker: 'Sir Mordrake', text: 'Tidak... aku belum boleh jatuh. Bangkit, abu!' },
      ],
      defeat: [
        { speaker: 'Sir Mordrake', text: 'Akhirnya... rantai ini... putus juga.' },
        { speaker: 'The Oathbound', text: 'Tidurlah, Penjaga. Sumpahmu telah lunas.' },
      ],
    },
  },
  wyrm: {
    name: 'Vhael',
    title: 'The Ashen Wyrm',
    maxHp: 480,
    w: 118,
    h: 74,
    contact: 13,
    ashReward: 90,
    reward: 'blessing',
    flying: true,
    spawn: { x: 700, y: 150 },
    dialogue: {
      intro: [
        { speaker: 'Vhael', text: 'Daging dan sumpah... bau yang sama.' },
        { speaker: 'The Oathbound', text: 'Turun dari sarangmu, cacing.' },
        { speaker: 'Vhael', text: 'Aku akan menguburmu di api yang sama.' },
      ],
      phase2: [
        { speaker: 'Vhael', text: 'Abu tidak mati. Ia hanya menunggu.' },
      ],
      defeat: [
        { speaker: 'Vhael', text: 'Lagi... aku akan bangkit... lagi...' },
        { speaker: 'The Oathbound', text: 'Tidak kali ini.' },
      ],
    },
  },
  choir: {
    name: 'The Hollow Choir',
    title: 'Koor Tanpa Suara',
    maxHp: 560,
    w: 104,
    h: 118,
    contact: 14,
    ashReward: 110,
    reward: 'blessing',
    flying: true,
    spawn: { x: 700, y: 170 },
    dialogue: {
      intro: [
        { speaker: 'The Hollow Choir', text: 'Satu suara hilang. Satu suara tersisa.' },
        { speaker: 'The Oathbound', text: 'Kau bukan dewa. Kau hanya gema.' },
        { speaker: 'The Hollow Choir', text: 'Gema pun bisa memecahkan batu.' },
      ],
      phase2: [
        { speaker: 'The Hollow Choir', text: 'Dengarkan... sumpahmu bernyanyi untuk kami.' },
      ],
      defeat: [
        { speaker: 'The Hollow Choir', text: 'Sunyi... akhirnya... sunyi...' },
        { speaker: 'The Oathbound', text: 'Nyanyimu berakhir di sini.' },
      ],
    },
  },
  oathbreaker: {
    name: 'The Oathbreaker',
    title: 'Pemutus Sumpah',
    maxHp: 720,
    w: 96,
    h: 126,
    contact: 16,
    ashReward: 160,
    reward: 'victory',
    maxPhases: 3,
    phaseThresholds: [0.64, 0.3],
    spawn: { x: 760, y: FLOOR_Y - 126 },
    dialogue: {
      intro: [
        { speaker: 'The Oathbreaker', text: 'Kau datang membawa sumpah yang kau curi.' },
        { speaker: 'The Oathbound', text: 'Aku datang membawanya kembali.' },
        { speaker: 'The Oathbreaker', text: 'Maka aku akan mematahkannya di depan matamu.' },
      ],
      phase2: [
        { speaker: 'The Oathbreaker', text: 'Setengah jalan. Setengah nyawa. Masih berani?' },
        { speaker: 'The Oathbound', text: 'Sumpahku tidak butuh izinmu.' },
      ],
      phase3: [
        { speaker: 'The Oathbreaker', text: 'Lihat! Inilah yang tersisa dari para pahlawan.' },
        { speaker: 'The Oathbound', text: 'Aku tidak akan menjadi salah satunya.' },
      ],
      defeat: [
        { speaker: 'The Oathbreaker', text: 'Kau... mematahkan... sumpahku...' },
        { speaker: 'The Oathbound', text: 'Tidak. Aku menepatinya.' },
      ],
    },
  },
  sporebound: {
    name: 'The Sporebound',
    title: 'Ikatan Spora',
    maxHp: 780,
    w: 110,
    h: 126,
    contact: 15,
    ashReward: 150,
    reward: 'blessing',
    maxPhases: 3,
    phaseThresholds: [0.66, 0.33],
    spawn: { x: 760, y: FLOOR_Y - 126 },
    dialogue: {
      intro: [
        { speaker: 'The Sporebound', text: 'Setiap napas yang kau hirup di sini adalah milikku.' },
        { speaker: 'The Oathbound', text: 'Maka aku akan berhenti bernapas sebentar.' },
        { speaker: 'The Sporebound', text: 'Tidak ada yang berhenti. Semua hanya berubah menjadi tanah.' },
      ],
      phase2: [
        { speaker: 'The Sporebound', text: 'Kau memotong tubuhku? Tubuhku adalah seluruh rongga ini.' },
      ],
      phase3: [
        { speaker: 'The Sporebound', text: 'Lihatlah. Bahkan luka-lukamu mulai berbunga.' },
        { speaker: 'The Oathbound', text: 'Bunga yang tumbuh dari sumpahku tidak akan pernah layu.' },
      ],
      defeat: [
        { speaker: 'The Sporebound', text: 'Akhirnya... tanah ini bisa beristirahat...' },
        { speaker: 'The Oathbound', text: 'Tidurlah. Aku akan menjaga tamanmu.' },
      ],
    },
  },
  root: {
    name: 'Root of the First Vow',
    title: 'Akar Sumpah Pertama',
    maxHp: 360,
    w: 120,
    h: 96,
    contact: 13,
    ashReward: 80,
    reward: 'flask',
    maxPhases: 2,
    phaseThresholds: [0.5],
    spawn: { x: 780, y: FLOOR_Y - 96 },
    dialogue: {
      intro: [
        { speaker: 'Root of the First Vow', text: 'Sebelum kau, sebelum aku, sudah ada janji yang mengikat batu ini.' },
        { speaker: 'The Oathbound', text: 'Aku tidak datang untuk memutusnya.' },
        { speaker: 'Root of the First Vow', text: 'Semua yang membawa pedang mengatakan itu.' },
      ],
      phase2: [
        { speaker: 'Root of the First Vow', text: 'Kau masih berdiri. Baik. Akar ini belum lupa cara berdarah.' },
      ],
      defeat: [
        { speaker: 'Root of the First Vow', text: 'Simpan... satu tegukan lagi... untuk jalan yang lebih panjang.' },
        { speaker: 'The Oathbound', text: 'Aku akan mengingat akarmu.' },
      ],
    },
  },
};

export const ALL_BOSS_INFO = { ...BOSS_INFO, ...EXPANSION_BOSS_INFO };
export const EXPANSION_BOSS_IDS = Object.keys(EXPANSION_BOSS_INFO);

export const CODEX = {
  enemies: Object.entries(ENEMY_INFO).map(([kind, enemy]) => ({
    id: `enemy-${kind}`,
    name: enemy.name,
    subtitle: enemy.title,
    glyph: {
      crawler: '◈',
      sentinel: '⛨',
      wraith: '◌',
      brute: '⬢',
      sporeling: '❋',
      stalker: '⌇',
      broodmother: '♛',
    }[kind] || '◈',
    danger: enemy.danger,
    desc: enemy.desc,
    meta: [
      ['HP', String(enemy.hp)],
      ['DAMAGE', String(enemy.dmg)],
      ['ABU', String(enemy.reward)],
    ],
    where: enemy.where,
  })),
  weapons: [
    {
      id: 'sword',
      name: 'Pedang Sumpah',
      subtitle: 'Senjata awal · combo tiga ayunan',
      glyph: '†',
      danger: 'SEIMBANG',
      desc: 'Pedang yang diwariskan bersama sumpah. Tiga ayunan cepat; ayunan ketiga menghantam lebih keras.',
      meta: [['DAMAGE', '12 · 14 · 24'], ['JANGKAUAN', '60'], ['KECEPATAN', 'CEPAT']],
      where: 'Dimiliki sejak awal',
    },
    {
      id: 'pike',
      name: 'Pike Penjaga',
      subtitle: 'Senjata jarak menengah',
      glyph: '⟋',
      danger: 'BERAT',
      desc: 'Tombak panjang milik penjaga gerbang. Ayunannya lambat, tetapi tusukan lurus menembus jarak aman.',
      meta: [['DAMAGE', '29'], ['JANGKAUAN', '118'], ['KECEPATAN', 'LAMBAT']],
      where: 'Warung Abu · 35 abu',
    },
    {
      id: 'bow',
      name: 'Busur Abu',
      subtitle: 'Senjata jarak jauh · amunisi terbatas',
      glyph: '➶',
      danger: 'RINGAN',
      desc: 'Busur yang dibuat dari tulang dan serat abu. Menembak anak panah lurus; amunisi harus dibeli.',
      meta: [['DAMAGE', '22'], ['JANGKAUAN', 'JAUH'], ['AMUNISI', 'PANAH']],
      where: 'Warung Abu · 55 abu',
    },
  ],
  bosses: Object.entries(BOSS_INFO).map(([kind, boss]) => ({
    id: kind,
    name: boss.name,
    subtitle: boss.title,
    glyph: { warden: '♜', wyrm: 'ϟ', choir: '♱', oathbreaker: '✠', sporebound: '✺', root: '⍋' }[kind] || '♜',
    danger: `${boss.maxPhases || 2} FASE`,
    desc: boss.dialogue?.intro?.[0]?.text || '',
    meta: [
      ['HP', String(boss.maxHp)],
      ['FASE', String(boss.maxPhases || 2)],
      ['ABU', String(boss.ashReward)],
    ],
    where: ROOMS.find((room) => room.boss === kind)?.name || 'Tidak diketahui',
    dialogue: boss.dialogue,
  })),
  items: [
    ...SHOP_ITEMS.map((item) => ({
      id: item.id,
      name: item.name,
      subtitle: ITEM_TYPE_LABEL[item.type] || 'Barang',
      glyph: item.glyph || '✦',
      danger: `✦ ${item.cost}`,
      desc: item.desc,
      meta: [
        ['TIPE', (ITEM_TYPE_LABEL[item.type] || 'BARANG').toUpperCase()],
        ['EFEK', (item.effect || '-').toUpperCase()],
        ['HARGA', `${item.cost} ABU`],
      ],
      where: 'Warung Abu',
    })),
    {
      id: 'ember-feather',
      name: 'Bulu Bara',
      subtitle: 'Relik · lompat ganda',
      glyph: '✦',
      danger: 'RELIK',
      desc: 'Bulu yang tidak pernah menjadi abu. Membuka lompatan kedua dan memperkuat ikatan dengan Warung Abu.',
      meta: [['TIPE', 'RELIK'], ['EFEK', 'LOMPAT GANDA'], ['LOKASI', 'BALAI SUMPAH']],
      where: 'Balai Sumpah',
    },
    {
      id: 'ash',
      name: 'Abu',
      subtitle: 'Mata uang perjalanan',
      glyph: '◌',
      danger: 'MATA UANG',
      desc: 'Sisa dari setiap penjaga yang gugur. Ditukar di Warung Abu untuk senjata, amunisi, dan nyawa tambahan.',
      meta: [['TIPE', 'MATA UANG'], ['SUMBER', 'MUSUH & BOSS'], ['GUNA', 'WARUNG ABU']],
      where: 'Seluruh perjalanan',
    },
    {
      id: 'blessing',
      name: 'Berkah Sumpah',
      subtitle: 'Peningkatan permanen dalam satu run',
      glyph: '✧',
      danger: 'BERKAH',
      desc: 'Hadiah dari penjaga yang gugur. Pilih satu dari tiga janji: besi, bara, atau angin.',
      meta: [['TIPE', 'BERKAH'], ['PILIHAN', '3'], ['DURASI', 'SATU RUN']],
      where: 'Setelah setiap boss',
    },
    {
      id: 'mycelial-flask',
      name: 'Tegukan Akar',
      subtitle: 'Hadiah mini-boss · charge flask permanen',
      glyph: '✚',
      danger: 'HADIAH RAHASIA',
      desc: 'Getah akar pertama yang mengeras menjadi kristal. Menambah satu charge flask untuk sisa perjalanan.',
      meta: [['TIPE', 'BEKAL'], ['EFEK', '+1 FLASK'], ['SUMBER', 'RELUNG TERSEMBUNYI']],
      where: 'Root of the First Vow',
    },
  ],
};

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);
const rand = (a, b) => a + Math.random() * (b - a);

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function rectHitsRect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Rooms may publish one gate (`gate`) or a small set (`gates`). Keeping both
// shapes lets older rooms and saves stay untouched while branch rooms expose a
// main exit and a secret one.
export function roomGateDefs(room) {
  if (!room) return [];
  if (Array.isArray(room.gates) && room.gates.length) return room.gates;
  return room.gate ? [room.gate] : [];
}

export function primaryGateDef(room) {
  const gates = roomGateDefs(room);
  return gates.find((gate) => !gate.secret) || gates[0] || null;
}

export class AshenGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.time = 0;
    this.state = 'playing';
    this.roomIndex = 0;
    this.events = [];
    this.fx = [];
    this.hitstop = 0;
    this.shake = 0;
    this.kills = 0;
    this.ash = 0;
    this.bossDefeated = {};
    this.brokenWalls = {};
    this.wallHp = {};
    this.wallHitFlash = 0;
    this.difficulty = 'normal';
    this.modifiers = [];
    this.ngPlus = 0;
    this.echoes = 0;
    this.collected = {};
    this.knownCollectibles = new Set();
    this.hazardTime = 0;
    this.hazardState = {};
    this.healBonus = 0;
    this.echoBonus = 1;
    this.gainBonus = 1;
    this.noSigils = false;
    this.fog = false;
    this.metaBonus = {};
    this._baseMaxHp = null;
    this._baseMaxFlasks = null;
    this._baseDamageMult = null;
    this.checkpoint = null;
    this.checkpointRoom = null;
    this.awaitingBlessing = false;
    this.blessingChoices = null;
    this.blessings = [];
    this.projectiles = [];
    this.enemies = [];
    this.boss = null;
    this.bossIntro = 0;
    this.deathTimer = 0;
    this.gateLock = 0;
    this.prevInput = {};

    this.player = {
      x: 0,
      y: 0,
      w: 30,
      h: 46,
      vx: 0,
      vy: 0,
      facing: 1,
      hp: 100,
      maxHp: 100,
      onGround: false,
      coyote: 0,
      jumpBuffer: 0,
      jumpsUsed: 0,
      relic: false,
      invuln: 0,
      attack: null,
      comboTimer: 0,
      comboIndex: 0,
      attackCooldown: 0,
      dashTimer: 0,
      dashCooldown: 0,
      dashCooldownMax: 0.78,
      dashIframes: 0.2,
      dashDir: 1,
      flasks: 3,
      maxFlasks: 3,
      healing: 0,
      damageMult: 1,
      speedMult: 1,
      build: 1,
      characterId: 'sera',
      appearance: { ...DEFAULT_APPEARANCE },
      ability: { ...(CHARACTERS.sera.ability || {}) },
      abilityCooldown: 0,
      hitFlash: 0,
      pitGrace: false,
      climbing: false,
      weapon: 'sword',
      weapons: ['sword'],
      arrows: 0,
      shurikens: 0,
      consumeCooldown: 0,
      sigils: [],
      rituals: {},
      consumables: {},
      quickItem: 'shuriken',
      damageBuff: 1,
      damageBuffTimer: 0,
    };

    this.loadRoom(0, true);
  }

  // ── characters ───────────────────────────────────────────────────────────
  applyCharacter(id) {
    const character = CHARACTERS[id] || CHARACTERS.sera;
    const p = this.player;
    this.characterId = character.id;
    p.characterId = character.id;
    p.maxHp = character.maxHp;
    p.hp = character.maxHp;
    p.damageMult = character.damage;
    p.speedMult = character.speed;
    p.dashCooldownMax = 0.78 * (character.dash || 1);
    p.build = character.build || 1;
    p.ability = character.ability ? { ...character.ability } : null;
    p.abilityCooldown = 0;
    p.appearance = { ...(character.appearance || DEFAULT_APPEARANCE) };
    this.appearance = { ...p.appearance };
    return character;
  }

  setAppearance(appearance = {}) {
    const race = RACES[appearance.race] ? appearance.race : 'human';
    const armor = OUTFITS[appearance.armor] ? appearance.armor : 'medieval';
    const isHex = (value) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
    const next = {
      race,
      armor,
      skin: isHex(appearance.skin) ? appearance.skin : RACES[race].skin,
      outfit: isHex(appearance.outfit) ? appearance.outfit : OUTFITS[armor].color,
    };
    this.appearance = { ...next };
    this.player.appearance = { ...next };
    return next;
  }

  // ── setup ────────────────────────────────────────────────────────────────
  setChallenge(options = {}) {
    const difficulty = DIFFICULTY_BY_ID[options.difficulty] ? options.difficulty : 'normal';
    const modifiers = Array.isArray(options.modifiers)
      ? [...new Set(options.modifiers.filter((id) => MODIFIER_BY_ID[id]))]
      : [];
    const ngPlus = clamp(Math.round(Number(options.ngPlus) || 0), 0, 4);
    const bonus = options.bonus && typeof options.bonus === 'object' ? { ...options.bonus } : {};
    const mods = expansionModifierTotals(modifiers);
    const p = this.player;
    if (this._baseMaxHp == null) this._baseMaxHp = p.maxHp;
    if (this._baseMaxFlasks == null) this._baseMaxFlasks = p.maxFlasks;
    if (this._baseDamageMult == null) this._baseDamageMult = p.damageMult;
    this.difficulty = difficulty;
    this.modifiers = modifiers;
    this.ngPlus = ngPlus;
    this.metaBonus = bonus;
    this.healBonus = Number(bonus.heal) || 0;
    this.echoBonus = 1 + (Number(bonus.echo) || 0);
    this.gainBonus = 1 + (Number(bonus.gain) || 0);
    this.noSigils = !!mods.noSigils;
    this.fog = !!mods.fog;
    p.maxHp = Math.max(1, Math.round((this._baseMaxHp + (Number(bonus.maxHp) || 0)) * mods.hp));
    p.hp = p.maxHp;
    p.maxFlasks = Math.max(1, this._baseMaxFlasks + (Number(bonus.flasks) || 0) + mods.flasks);
    p.flasks = p.maxFlasks;
    p.damageMult = this._baseDamageMult * mods.dmg * (1 + (Number(bonus.damage) || 0));
    return { difficulty, modifiers: [...modifiers], ngPlus, bonus };
  }

  setKnownCollectibles(ids) {
    this.knownCollectibles = new Set(Array.isArray(ids) ? ids : []);
    return this.knownCollectibles.size;
  }

  loadRoom(index, initial = false) {
    const room = ALL_ROOMS[index];
    if (!room) return;
    this.roomIndex = index;
    this.room = room;
    this.projectiles = [];
    this.enemies = [];
    this.boss = null;
    this.checkpoint = room.checkpoint ? { ...room.checkpoint, active: true } : null;
    this.checkpointRoom = room.checkpoint ? index : null;
    this.blessingChoices = null;
    this.awaitingBlessing = false;
    this.bossIntro = room.boss ? 1.0 : 0;
    this.hazardState = {};
    this.hazardTime = 0;
    const p = this.player;
    p.x = room.spawn.x;
    p.y = room.spawn.y;
    p.vx = 0;
    p.vy = 0;
    p.onGround = false;
    p.attack = null;
    p.attackCooldown = 0;
    p.comboTimer = 0;
    p.dashTimer = 0;
    p.dashCooldown = 0;
    p.healing = 0;
    p.consumeCooldown = 0;
    p.invuln = Math.max(p.invuln, 0.35);
    p.pitGrace = false;
    p.climbing = false;
    this.shake = 0;

    for (const def of room.enemies) this.spawnEnemy(def);

    if (room.boss && !this.bossDefeated[index]) {
      this.spawnBoss(room.boss);
    }
    this.emit({ type: 'roomEnter', room: index, name: room.name, subtitle: room.subtitle });
    if (room.condition) {
      this.emit({ type: 'roomCondition', room: index, weather: room.weather || '', condition: room.condition });
    }
    if (this.checkpoint) {
      this.emit({ type: 'checkpoint', room: index, name: this.checkpoint.name });
    }
  }

  enterRoom(index) {
    this.state = 'playing';
    this.loadRoom(index);
  }

  spawnEnemy(def) {
    const info = ALL_ENEMY_INFO[def.type] || ALL_ENEMY_INFO.crawler;
    const expansion = !ENEMY_INFO[def.type] && !!info.behavior;
    const difficulty = DIFFICULTY_BY_ID[this.difficulty] || DIFFICULTY_BY_ID.normal;
    const mods = expansionModifierTotals(this.modifiers);
    const ngScale = 1 + (this.ngPlus || 0) * 0.2;
    const variant = ENEMY_VARIANTS.find((v) => v.id === def.variant) || ENEMY_VARIANTS[1];
    const aiMap = {
      chaser: 'crawler',
      lunge: 'sentinel',
      ranged: 'wraith',
      slam: 'brute',
      burrower: 'stalker',
      spawner: 'broodmother',
      hopper: 'sporeling',
    };
    const base = {
      id: `e${this.enemies.length}_${Math.floor(this.time * 1000)}`,
      type: def.type,
      species: def.type,
      ai: expansion ? aiMap[info.behavior] || 'crawler' : def.type,
      expansion,
      variant: variant.id,
      x: def.x,
      y: 0,
      vx: 0,
      vy: 0,
      facing: -1,
      hitFlash: 0,
      dead: false,
      state: 'patrol',
      timer: 0,
      cooldown: 0,
      minX: def.minX,
      maxX: def.maxX,
      patrolDir: -1,
      attackLanded: false,
      onGround: true,
      jumpCooldown: 0,
      homeX: def.x,
      burrowed: false,
      burrowCooldown: 1.6,
      burrowTimer: 0,
      targetX: def.x,
      hopTimer: 0.5 + Math.random() * 0.8,
    };
    const e = {
      ...base,
      w: info.w,
      h: info.h,
      hp: Math.max(1, Math.round(info.hp * variant.hp * difficulty.enemyHp * mods.hp * ngScale)),
      maxHp: Math.max(1, Math.round(info.hp * variant.hp * difficulty.enemyHp * mods.hp * ngScale)),
      dmg: Math.max(1, Math.round(info.dmg * variant.dmg * difficulty.enemyDmg * mods.incoming * ngScale)),
      speed: Math.max(20, Math.round(info.speed * variant.speed * difficulty.enemySpeed)),
      reward: Math.max(1, Math.round(info.reward * variant.reward * difficulty.reward * mods.ash)),
      flying: def.type === 'wraith' || !!info.flying || info.behavior === 'ranged',
      castCooldown: 0.8,
      spawnCooldown: info.behavior === 'spawner' || def.type === 'broodmother' ? 2.4 : 0,
      childType: expansion ? `echo_${info.chapter + 1}_1` : 'sporeling',
    };
    e.y = e.flying ? FLOOR_Y - 148 : FLOOR_Y - e.h;
    this.enemies.push(e);
    return e;
  }

  spawnBoss(kind) {
    const info = ALL_BOSS_INFO[kind];
    if (!info) return null;
    const spawn = info.spawn || { x: 760, y: FLOOR_Y - info.h };
    const difficulty = DIFFICULTY_BY_ID[this.difficulty] || DIFFICULTY_BY_ID.normal;
    const mods = expansionModifierTotals(this.modifiers);
    const ngScale = 1 + (this.ngPlus || 0) * 0.2;
    const expansion = !!info.chapter && !BOSS_INFO[kind];
    const maxPhases = expansion && difficulty.extraPhase && (info.maxPhases || 2) === 2 ? 3 : info.maxPhases || 2;
    const thresholds = maxPhases === 3 && !info.phaseThresholds ? [0.66, 0.33] : info.phaseThresholds || [0.5];
    const maxHp = Math.max(1, Math.round(info.maxHp * difficulty.bossHp * mods.hp * ngScale));
    const b = {
      kind,
      name: info.name,
      title: info.title,
      x: spawn.x,
      y: spawn.y,
      homeX: spawn.x,
      w: info.w,
      h: info.h,
      vx: 0,
      vy: 0,
      maxHp,
      hp: maxHp,
      contact: Math.max(1, Math.round(info.contact * difficulty.bossDmg * mods.incoming * ngScale)),
      facing: -1,
      phase: 1,
      maxPhases,
      phaseThresholds: thresholds,
      flying: !!info.flying,
      state: 'idle',
      timer: 0,
      cooldown: 1.2,
      hitFlash: 0,
      invuln: 0,
      attackLanded: false,
      pattern: 0,
      patternType: info.pattern || null,
      chapter: info.chapter ?? null,
      expansion,
      mini: !!info.mini,
      echoReward: info.echoReward || 0,
      hoverT: 0,
      shotsLeft: 0,
      shotTimer: 0,
      targetX: 700,
      dying: false,
      deathTimer: 0,
      intro: 1.0,
    };
    this.boss = b;
    this.emit({ type: 'bossSpawn', name: info.name, title: info.title, kind });
    this.emitBossDialogue(b, 'intro');
    this.shake = 0.5;
    return b;
  }

  emitBossDialogue(b, phaseKey) {
    const info = ALL_BOSS_INFO[b.kind];
    const lines = info?.dialogue?.[phaseKey];
    if (!lines || !lines.length) return;
    this.emit({
      type: 'bossDialogue',
      kind: b.kind,
      phase: phaseKey,
      name: b.name,
      title: b.title,
      lines: lines.map((line) => ({ ...line })),
    });
  }

  emit(ev) {
    if (this.events.length > 240) this.events.shift();
    this.events.push(ev);
  }

  spawnFx(type, x, y, opts = {}) {
    if (this.fx.length > 260) this.fx.shift();
    this.fx.push({
      type,
      x,
      y,
      vx: opts.vx ?? 0,
      vy: opts.vy ?? 0,
      life: opts.life ?? 0.45,
      maxLife: opts.life ?? 0.45,
      size: opts.size ?? 4,
      color: opts.color ?? '#f0a34c',
      rot: opts.rot ?? 0,
    });
  }

  burst(x, y, count, color = '#f0a34c', power = 160) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(power * 0.25, power);
      this.spawnFx('spark', x, y, {
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 40,
        life: rand(0.2, 0.55),
        size: rand(2, 5),
        color,
      });
    }
  }

  // ── helpers ──────────────────────────────────────────────────────────────
  get playerCenter() {
    return { x: this.player.x + this.player.w / 2, y: this.player.y + this.player.h / 2 };
  }

  get gates() {
    return roomGateDefs(this.room).map((gate) => {
      const requires = gate.requires;
      let open = true;
      let reason = '';
      if (requires === 'clear') {
        open = this.enemies.length === 0;
        reason = open ? '' : `Sisa abu: ${this.enemies.length}. Bersihkan dulu.`;
      } else if (requires === 'relic') {
        open = this.player.relic;
        reason = open ? '' : 'Segel kuno. Butuh Relik Bulu Bara.';
      } else if (requires === 'boss') {
        open = !!this.bossDefeated[this.roomIndex] && !this.awaitingBlessing;
        const bossName = this.room.boss ? ALL_BOSS_INFO[this.room.boss]?.name : 'Penjaga Agung';
        reason = open ? '' : this.awaitingBlessing ? 'Pilih berkahmu dahulu.' : `Kalahkan ${bossName}.`;
      } else if (requires === 'wall') {
        open = !!this.brokenWalls[this.roomIndex];
        reason = open ? '' : 'Dinding Miselium masih utuh. Tebas sampai retak.';
      }
      return {
        ...gate,
        next: Number.isInteger(gate.next) ? gate.next : this.roomIndex + 1,
        open,
        reason,
      };
    });
  }

  get gate() {
    const gates = this.gates;
    if (!gates.length) return null;
    const cx = this.player.x + this.player.w / 2;
    let best = gates[0];
    let bestDist = Math.abs(cx - (best.x + best.w / 2));
    for (const gate of gates.slice(1)) {
      const dist = Math.abs(cx - (gate.x + gate.w / 2));
      if (dist < bestDist) {
        best = gate;
        bestDist = dist;
      }
    }
    return best;
  }

  activeWall(index = this.roomIndex) {
    const wall = ALL_ROOMS[index]?.secretWall;
    if (!wall || this.brokenWalls[index]) return null;
    return {
      ...wall,
      hp: this.wallHp[index] ?? wall.hp,
      maxHp: wall.hp,
      hitFlash: this.wallHitFlash,
    };
  }

  damageWall(amount) {
    const wall = this.activeWall();
    if (!wall || amount <= 0) return false;
    const index = this.roomIndex;
    const hp = Math.max(0, wall.hp - amount);
    this.wallHp[index] = hp;
    this.wallHitFlash = 0.14;
    this.shake = Math.max(this.shake, 0.16);
    this.hitstop = Math.max(this.hitstop, 0.03);
    this.emit({ type: 'wallHit', hp, maxHp: wall.maxHp });
    this.burst(wall.x + wall.w - 8, this.player.y + this.player.h / 2, 8, '#b07be8', 150);
    if (hp <= 0) {
      this.brokenWalls[index] = true;
      this.emit({ type: 'wallBroken', room: index, name: wall.name, next: wall.next });
      this.burst(wall.x + wall.w / 2, wall.y + wall.h / 2, 30, '#c9a0f0', 280);
      this.shake = 0.5;
    }
    return true;
  }

  get bossActive() {
    return this.boss && !this.boss.dying;
  }

  isNearGate() {
    const g = this.gate;
    if (!g) return false;
    const p = this.player;
    return Math.abs(p.x + p.w / 2 - (g.x + g.w / 2)) < 170 && p.y + p.h > g.y;
  }

  // ── main update ──────────────────────────────────────────────────────────
  update(dt, input = {}) {
    if (!dt || dt <= 0) return;
    dt = Math.min(dt, 0.05);
    const pressed = (name) => !!input[name] && !this.prevInput[name];

    if (this.state === 'playing') {
      this.time += dt;
      if (this.hitstop > 0) {
        this.hitstop = Math.max(0, this.hitstop - dt);
      } else {
        this.player.invuln = Math.max(0, this.player.invuln - dt);
        this.player.hitFlash = Math.max(0, this.player.hitFlash - dt);
        this.wallHitFlash = Math.max(0, this.wallHitFlash - dt);
        if (this.gateLock > 0) this.gateLock = Math.max(0, this.gateLock - dt);
        this.shake = Math.max(0, this.shake - dt * 2.2);
        this.updatePlayer(dt, input, pressed);
        this.updateEnemies(dt);
        this.updateBoss(dt);
        this.updateProjectiles(dt);
        this.checkContacts();
        this.updateRelic();
        this.updateHazards(dt);
        this.updateCollectibles();
        this.updateGate();
        this.cleanup();
      }
      this.updateFx(dt);
    } else {
      this.updateFx(dt);
    }

    this.prevInput = { ...input };
  }

  // ── player ───────────────────────────────────────────────────────────────
  updatePlayer(dt, input, pressed) {
    const p = this.player;

    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.comboTimer > 0) p.comboTimer -= dt;
    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (p.jumpBuffer > 0) p.jumpBuffer -= dt;
    if (p.coyote > 0) p.coyote -= dt;
    if (p.consumeCooldown > 0) p.consumeCooldown -= dt;
    if (p.abilityCooldown > 0) p.abilityCooldown = Math.max(0, p.abilityCooldown - dt);
    if (p.damageBuffTimer > 0) {
      p.damageBuffTimer -= dt;
      if (p.damageBuffTimer <= 0) {
        p.damageBuffTimer = 0;
        p.damageBuff = 1;
        this.emit({ type: 'buffEnd', buff: 'damage' });
      }
    }

    if (p.healing > 0) {
      p.healing -= dt;
      p.vx *= Math.pow(0.001, dt);
      if (p.healing <= 0) {
        p.flasks -= 1;
        p.hp = Math.min(p.maxHp, p.hp + 38 + (this.healBonus || 0));
        this.emit({ type: 'heal' });
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 10, '#8fd98a', 110);
      }
    } else if (pressed('heal') && p.flasks > 0 && p.hp < p.maxHp && p.onGround && p.dashTimer <= 0 && !p.attack) {
      p.healing = 0.46;
      this.emit({ type: 'healStart' });
    }

    // dash
    if (pressed('dash') && p.dashCooldown <= 0 && p.dashTimer <= 0 && p.healing <= 0) {
      p.dashTimer = 0.17;
      p.dashCooldown = p.dashCooldownMax;
      p.dashDir = input.left && !input.right ? -1 : input.right && !input.left ? 1 : p.facing;
      p.facing = p.dashDir;
      p.vy = 0;
      this.emit({ type: 'dash' });
      this.spawnFx('dash', p.x + p.w / 2, p.y + p.h / 2, { life: 0.22, size: 22, color: '#9fc4d8' });
    }

    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      p.vx = p.dashDir * 640;
      p.vy = 0;
      if (Math.random() < 0.5) {
        this.spawnFx('dash', p.x + p.w / 2, p.y + p.h / 2, {
          life: 0.25,
          size: 16,
          color: '#8fb6cc',
          vx: -p.dashDir * 40,
        });
      }
      if (p.dashTimer <= 0) {
        p.vx *= 0.4;
        p.dashCooldown = Math.max(p.dashCooldown, 0.05);
      }
    }

    // attack input
    if (pressed('attack') && !p.attack && p.attackCooldown <= 0 && p.dashTimer <= 0 && p.healing <= 0) {
      this.startAttack();
    }

    if (p.attack) this.updatePlayerAttack(dt);

    // weapon swap + consumables
    if (pressed('swap') && !p.attack && p.dashTimer <= 0) this.cycleWeapon();
    if (pressed('cycleItem') && !p.attack && p.dashTimer <= 0) this.cycleItem();
    if (
      pressed('consume') &&
      p.consumeCooldown <= 0 &&
      !p.attack &&
      p.dashTimer <= 0 &&
      p.healing <= 0
    ) {
      this.throwConsumable();
    }
    if (
      pressed('ability') &&
      p.ability &&
      p.abilityCooldown <= 0 &&
      p.healing <= 0 &&
      p.dashTimer <= 0
    ) {
      this.useAbility();
    }

    // horizontal movement
    const moving = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    const control = p.dashTimer > 0 ? 0 : p.attack ? 0.35 : 1;
    if (p.healing > 0) {
      // rooted while drinking
    } else if (moving !== 0) {
      p.facing = moving;
      const speedMult = p.speedMult || 1;
      const target = moving * 255 * speedMult * control;
      const accel = (p.onGround ? 2400 : 1500) * dt;
      p.vx += clamp(target - p.vx, -accel, accel);
      p.vx = clamp(p.vx, -300 * speedMult, 300 * speedMult);
    } else if (p.dashTimer <= 0) {
      const fric = (p.onGround ? 2800 : 900) * dt;
      if (Math.abs(p.vx) <= fric) p.vx = 0;
      else p.vx -= sign(p.vx) * fric;
    }

    // Mycelial climbing: stand inside a vine strip and hold jump to ascend.
    // Letting go drops the player back into normal gravity so they can leave.
    const climbZone = (this.room.climbs || []).find((zone) => rectHitsRect(p, zone));
    const climbing =
      !!climbZone &&
      p.dashTimer <= 0 &&
      p.healing <= 0 &&
      (input.jump || p.vy < -10);
    p.climbing = climbing;

    if (climbing) {
      p.onGround = false;
      p.coyote = 0;
      p.jumpsUsed = 0;
      p.jumpBuffer = 0;
      p.vy = input.jump ? -190 : 0;
    } else {
      // jump
      if (pressed('jump')) p.jumpBuffer = 0.13;
      if (p.jumpBuffer > 0 && p.healing <= 0) {
        if (p.onGround || p.coyote > 0) {
          p.vy = -720;
          p.onGround = false;
          p.coyote = 0;
          p.jumpsUsed = 1;
          p.jumpBuffer = 0;
          this.emit({ type: 'jump' });
          this.spawnFx('dust', p.x + p.w / 2, p.y + p.h, { life: 0.3, size: 9, color: '#8a7a63' });
        } else if (p.relic && p.jumpsUsed < 2) {
          p.vy = -660;
          p.jumpsUsed = 2;
          p.jumpBuffer = 0;
          this.emit({ type: 'doubleJump' });
          this.burst(p.x + p.w / 2, p.y + p.h, 8, '#e8b46a', 90);
        }
      }
      // variable jump height
      if (!input.jump && p.vy < -220) p.vy += GRAVITY * 1.9 * dt;
    }

    // integrate
    const wasGround = p.onGround;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 0, WORLD_W - p.w);
    const wall = this.activeWall();
    if (wall && rectHitsRect(p, wall)) {
      p.x = p.x + p.w / 2 > wall.x + wall.w / 2 ? wall.x + wall.w : wall.x - p.w;
    }
    const prevBottom = p.y + p.h;
    if (!climbing) p.vy += GRAVITY * dt;
    p.y += p.vy * dt;

    p.onGround = false;
    let bounced = false;
    if (!climbing) {
      for (const pad of this.room.bounce || []) {
        if (p.x + p.w <= pad.x || p.x >= pad.x + pad.w) continue;
        if (p.vy >= 0 && prevBottom <= pad.y + 8 && p.y + p.h >= pad.y) {
          p.y = pad.y - p.h;
          p.vy = -pad.power;
          p.onGround = false;
          p.climbing = false;
          p.jumpsUsed = 0;
          p.pitGrace = false;
          bounced = true;
          this.emit({ type: 'bounce', x: pad.x + pad.w / 2, y: pad.y });
          this.burst(pad.x + pad.w / 2, pad.y, 12, '#c9a0f0', 170);
          this.spawnFx('dust', pad.x + pad.w / 2, pad.y, { life: 0.42, size: 16, color: '#a86bd8' });
          break;
        }
      }
    }
    if (!bounced) {
      for (const plat of this.room.platforms) {
        if (p.x + p.w <= plat.x || p.x >= plat.x + plat.w) continue;
        if (p.vy >= 0 && prevBottom <= plat.y + 4 && p.y + p.h >= plat.y) {
          p.y = plat.y - p.h;
          p.vy = 0;
          p.onGround = true;
        }
      }
    }
    if (p.onGround) {
      p.coyote = 0.1;
      p.jumpsUsed = 0;
      p.pitGrace = false;
    } else if (wasGround) {
      p.coyote = Math.max(p.coyote, 0.1);
    }

    // pit hazard
    if (p.y > 640) {
      if (!p.pitGrace) {
        p.pitGrace = true;
        this.damagePlayer(28, p.x + p.w / 2, { knock: false });
        if (this.state === 'playing') {
          p.x = this.room.spawn.x;
          p.y = this.room.spawn.y;
          p.vx = 0;
          p.vy = 0;
          p.invuln = Math.max(p.invuln, 1.0);
          this.emit({ type: 'respawn' });
        }
      }
    }
  }

  currentAttackDef() {
    const p = this.player;
    if (p.attack?.def) return p.attack.def;
    if (p.weapon === 'pike') return PIKE_ATTACK;
    if (p.weapon === 'bow') return BOW_ATTACK;
    return ATTACKS[p.attack ? p.attack.combo : 0];
  }

  useAbility() {
    const p = this.player;
    if (!p.ability || p.abilityCooldown > 0) return false;
    const abilityId = p.ability.id;
    p.abilityCooldown = p.ability.cooldown || 6;

    if (abilityId === 'oath_sweep') {
      // The Knight: Ultimate Sweep
      const def = {
        windup: 0.05,
        active: 0.18,
        recover: 0.2,
        range: 130,
        height: 75,
        dmg: 46,
        knock: 320,
        name: 'sweep',
      };
      p.attack = { weapon: 'ability', def, t: 0, hitIds: [], landed: false };
      p.x += p.facing * 8;
      this.shake = Math.max(this.shake, 0.26);
      this.burst(p.x + p.w / 2 + p.facing * 40, p.y + p.h / 2, 20, '#ffd700', 220);
      this.emit({ type: 'ability', ability: abilityId, name: p.ability.name });
      return true;
    }

    if (abilityId === 'long_shot') {
      // The Elf Archer: Piercing Long Shot
      this.spawnPlayerProjectile('long_shot', {
        x: p.x + p.w / 2 + p.facing * 18,
        y: p.y + p.h * 0.44,
        vx: p.facing * 880,
        vy: 0,
        r: 8,
        dmg: 52,
        life: 1.4,
        pierce: true,
      });
      p.vx = -p.facing * 140;
      this.shake = Math.max(this.shake, 0.18);
      this.burst(p.x + p.w / 2 + p.facing * 18, p.y + p.h * 0.44, 16, '#7df9ff', 180);
      this.emit({ type: 'ability', ability: abilityId, name: p.ability.name });
      return true;
    }

    if (abilityId === 'shadow_step') {
      // The Assassin: Shadow Step
      const oldX = p.x;
      const stepDist = 180;
      const targetX = clamp(p.x + p.facing * stepDist, 10, WORLD_W - p.w - 10);
      const minX = Math.min(oldX, targetX);
      const maxX = Math.max(oldX + p.w, targetX + p.w);
      const slashBox = { x: minX, y: p.y - 12, w: maxX - minX, h: p.h + 24 };

      for (const e of this.enemies) {
        if (e.dead) continue;
        if (rectHitsRect(slashBox, e)) {
          this.hurtEnemy(e, { dmg: 48, knock: 160, name: 'shadow_step' }, p.facing);
          this.burst(e.x + e.w / 2, e.y + e.h / 2, 12, '#9d4edd', 160);
        }
      }
      if (this.boss && !this.boss.dying && rectHitsRect(slashBox, this.boss)) {
        this.hurtBoss(48 * p.damageMult * (p.damageBuff || 1), 140, p.facing, false);
        this.burst(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2, 14, '#9d4edd', 180);
      }

      for (let sx = minX; sx <= maxX; sx += 24) {
        this.spawnFx('dust', sx, p.y + p.h * 0.5, {
          life: 0.35,
          size: 14,
          color: '#3a0ca3',
        });
      }
      p.x = targetX;
      p.invuln = Math.max(p.invuln, 0.32);
      this.shake = Math.max(this.shake, 0.16);
      this.emit({ type: 'ability', ability: abilityId, name: p.ability.name });
      return true;
    }

    if (abilityId === 'ground_slam') {
      // The Brawler: Ground Slam
      p.vy = 260;
      this.shake = Math.max(this.shake, 0.38);
      const slamBox = { x: p.x - 70, y: p.y - 10, w: p.w + 140, h: p.h + 30 };
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (rectHitsRect(slamBox, e)) {
          this.hurtEnemy(e, { dmg: 54, knock: 340, name: 'ground_slam' }, sign(e.x - p.x) || p.facing);
          this.burst(e.x + e.w / 2, e.y + e.h / 2, 12, '#ff6b35', 180);
        }
      }
      if (this.boss && !this.boss.dying && rectHitsRect(slamBox, this.boss)) {
        this.hurtBoss(54 * p.damageMult * (p.damageBuff || 1), 260, p.facing, true);
      }
      this.spawnPlayerProjectile('shockwave', {
        x: p.x - 10,
        y: FLOOR_Y - 24,
        vx: -380,
        vy: 0,
        w: 26,
        h: 24,
        r: 13,
        dmg: 26,
        life: 0.85,
        pierce: true,
      });
      this.spawnPlayerProjectile('shockwave', {
        x: p.x + p.w + 10,
        y: FLOOR_Y - 24,
        vx: 380,
        vy: 0,
        w: 26,
        h: 24,
        r: 13,
        dmg: 26,
        life: 0.85,
        pierce: true,
      });
      this.burst(p.x + p.w / 2, FLOOR_Y - 10, 24, '#e65100', 200);
      this.emit({ type: 'ability', ability: abilityId, name: p.ability.name });
      return true;
    }

    if (abilityId === 'flame_nova') {
      // The Mage: Flame Nova
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      const count = 8;
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        this.spawnPlayerProjectile('flame_orb', {
          x: cx,
          y: cy,
          vx: Math.cos(ang) * 440,
          vy: Math.sin(ang) * 440,
          r: 8,
          dmg: 28,
          life: 0.75,
        });
      }
      this.shake = Math.max(this.shake, 0.22);
      this.burst(cx, cy, 22, '#ff7b00', 200);
      for (const pr of this.projectiles) {
        if (pr.owner === 'boss' && pr.type === 'fireball') {
          const d2 = (pr.x - cx) ** 2 + (pr.y - cy) ** 2;
          if (d2 < 120 ** 2) {
            pr.dead = true;
            this.burst(pr.x, pr.y, 8, '#ffd08a', 120);
          }
        }
      }
      this.emit({ type: 'ability', ability: abilityId, name: p.ability.name });
      return true;
    }

    if (abilityId === 'arena_charge') {
      // The Gladiator: shield-first line charge.
      const oldX = p.x;
      const targetX = clamp(p.x + p.facing * 160, 10, WORLD_W - p.w - 10);
      const minX = Math.min(oldX, targetX);
      const maxX = Math.max(oldX + p.w, targetX + p.w);
      const chargeBox = { x: minX, y: p.y - 8, w: maxX - minX, h: p.h + 16 };
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (rectHitsRect(chargeBox, e)) {
          this.hurtEnemy(e, { dmg: 40, knock: 360, name: 'arena_charge' }, p.facing);
          this.burst(e.x + e.w / 2, e.y + e.h / 2, 12, '#f0b45a', 170);
        }
      }
      if (this.boss && !this.boss.dying && rectHitsRect(chargeBox, this.boss)) {
        this.hurtBoss(40 * p.damageMult * (p.damageBuff || 1), 280, p.facing, false);
        this.burst(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2, 14, '#f0b45a', 190);
      }
      for (let sx = minX; sx <= maxX; sx += 22) {
        this.spawnFx('dust', sx, p.y + p.h * 0.55, {
          life: 0.32,
          size: 12,
          color: '#b57a4a',
        });
      }
      p.x = targetX;
      p.invuln = Math.max(p.invuln, 0.32);
      this.shake = Math.max(this.shake, 0.24);
      this.emit({ type: 'ability', ability: abilityId, name: p.ability.name });
      return true;
    }

    if (abilityId === 'net_cast') {
      // The Retiarius: a piercing net that roots what it touches.
      this.spawnPlayerProjectile('net', {
        x: p.x + p.w / 2 + p.facing * 18,
        y: p.y + p.h * 0.44,
        vx: p.facing * 540,
        vy: -18,
        r: 15,
        dmg: 20,
        life: 0.95,
        pierce: true,
        snare: 2.4,
      });
      this.shake = Math.max(this.shake, 0.12);
      this.burst(p.x + p.w / 2 + p.facing * 18, p.y + p.h * 0.44, 10, '#8fd8d0', 130);
      this.emit({ type: 'ability', ability: abilityId, name: p.ability.name });
      return true;
    }

    if (abilityId === 'chain_lightning') {
      // The Stormcaller: arcing lightning that jumps between nearby targets.
      const targets = this.enemies
        .filter((e) => !e.dead && !e.burrowed)
        .map((e) => ({
          e,
          dist: Math.abs(e.x + e.w / 2 - (p.x + p.w / 2)) + Math.abs(e.y - p.y),
        }))
        .filter(({ dist }) => dist < 620)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 4);
      let damage = 34;
      let lastX = p.x + p.w / 2;
      let lastY = p.y + p.h * 0.42;
      for (const { e } of targets) {
        const ex = e.x + e.w / 2;
        const ey = e.y + e.h / 2;
        this.hurtEnemy(e, { dmg: damage, knock: 70, name: 'chain_lightning' }, sign(ex - lastX) || p.facing);
        for (let i = 0; i < 5; i++) {
          this.spawnFx('spark', lastX + (ex - lastX) * (i / 5), lastY + (ey - lastY) * (i / 5), {
            vx: rand(-30, 30),
            vy: rand(-30, 30),
            life: rand(0.15, 0.3),
            size: rand(2, 4),
            color: '#a8e6ff',
          });
        }
        lastX = ex;
        lastY = ey;
        damage *= 0.82;
      }
      if (this.boss && !this.boss.dying) {
        const b = this.boss;
        const bd = Math.abs(b.x + b.w / 2 - (p.x + p.w / 2)) + Math.abs(b.y - p.y);
        if (bd < 620) {
          this.hurtBoss(damage * p.damageMult * (p.damageBuff || 1), 60, p.facing, false);
          for (let i = 0; i < 6; i++) {
            this.spawnFx('spark', b.x + b.w / 2 + rand(-20, 20), b.y + b.h / 2 + rand(-20, 20), {
              vx: rand(-40, 40),
              vy: rand(-40, 40),
              life: rand(0.2, 0.4),
              size: rand(2, 5),
              color: '#a8e6ff',
            });
          }
        }
      }
      this.shake = Math.max(this.shake, 0.2);
      this.emit({ type: 'ability', ability: abilityId, name: p.ability.name });
      return true;
    }

    if (abilityId === 'aegis_pulse') {
      // The Sentinel: a defensive nova that buys breathing room.
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      const pulseBox = { x: cx - 140, y: cy - 100, w: 280, h: 200 };
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (rectHitsRect(pulseBox, e)) {
          this.hurtEnemy(e, { dmg: 26, knock: 420, name: 'aegis_pulse' }, sign(e.x + e.w / 2 - cx) || p.facing);
          this.burst(e.x + e.w / 2, e.y + e.h / 2, 10, '#c9d8e8', 170);
        }
      }
      if (this.boss && !this.boss.dying && rectHitsRect(pulseBox, this.boss)) {
        this.hurtBoss(26 * p.damageMult * (p.damageBuff || 1), 300, p.facing, false);
      }
      p.invuln = Math.max(p.invuln, 3.2);
      this.spawnFx('dash', cx, cy, { life: 0.4, size: 64, color: '#c9d8e8' });
      this.burst(cx, cy, 26, '#dce8f4', 240);
      this.shake = Math.max(this.shake, 0.28);
      this.emit({ type: 'ability', ability: abilityId, name: p.ability.name });
      return true;
    }

    if (abilityId === 'thorn_volley') {
      // The Warden: a fan of thorn projectiles.
      for (let i = 0; i < 5; i++) {
        const angle = -0.32 + i * 0.16;
        this.spawnPlayerProjectile('thorn', {
          x: p.x + p.w / 2 + p.facing * 16,
          y: p.y + p.h * 0.44,
          vx: p.facing * Math.cos(angle) * 600,
          vy: Math.sin(angle) * 600,
          r: 6,
          dmg: 18,
          life: 1.0,
          snare: 1.1,
        });
      }
      this.shake = Math.max(this.shake, 0.16);
      this.burst(p.x + p.w / 2 + p.facing * 18, p.y + p.h * 0.44, 12, '#8fbf6a', 150);
      this.emit({ type: 'ability', ability: abilityId, name: p.ability.name });
      return true;
    }

    return false;
  }

  startAttack() {
    const p = this.player;
    if (p.weapon === 'bow') {
      if (p.arrows <= 0) {
        this.emit({ type: 'noAmmo', kind: 'arrow' });
        return false;
      }
      p.attack = { weapon: 'bow', def: BOW_ATTACK, t: 0, shot: false, hitIds: [], landed: false };
      this.emit({ type: 'bowDraw' });
      return true;
    }
    if (p.weapon === 'pike') {
      p.attack = { weapon: 'pike', def: PIKE_ATTACK, t: 0, hitIds: [], landed: false };
      p.x += p.facing * 2;
      this.emit({ type: 'swing', combo: 0, weapon: 'pike' });
      return true;
    }
    const idx = p.comboTimer > 0 ? (p.comboIndex + 1) % 3 : 0;
    p.comboIndex = idx;
    p.attack = { weapon: 'sword', def: ATTACKS[idx], t: 0, combo: idx, hitIds: [], landed: false };
    p.x += p.facing * 3;
    this.emit({ type: 'swing', combo: idx });
    if (idx === 2) this.shake = Math.max(this.shake, 0.16);
    return true;
  }

  updatePlayerAttack(dt) {
    const p = this.player;
    const a = p.attack;
    const def = a.def || this.currentAttackDef();
    a.t += dt;
    if (a.t >= def.windup + def.active + def.recover) {
      p.attack = null;
      p.comboTimer = a.weapon === 'sword' ? 0.5 : 0;
      p.attackCooldown = a.weapon === 'sword' ? 0.06 : 0.12;
      return;
    }
    if (a.weapon === 'bow') {
      if (!a.shot && a.t >= def.windup) {
        a.shot = true;
        p.arrows -= 1;
        this.spawnPlayerProjectile('arrow', {
          x: p.x + p.w / 2 + p.facing * 18,
          y: p.y + p.h * 0.44,
          vx: p.facing * 640,
          vy: 0,
          r: 5,
          dmg: def.dmg,
          life: 1.3,
        });
      }
      return;
    }
    if (a.t >= def.windup && a.t < def.windup + def.active) {
      const hb = this.playerHitbox();
      for (const e of this.enemies) {
        if (e.dead || e.burrowed || a.hitIds.includes(e.id)) continue;
        if (rectHitsRect(hb, e)) {
          a.hitIds.push(e.id);
          a.landed = true;
          this.hurtEnemy(e, def, p.facing);
        }
      }
      const b = this.boss;
      if (b && !b.dying && !a.hitIds.includes('boss') && rectHitsRect(hb, b)) {
        a.hitIds.push('boss');
        a.landed = true;
        this.hurtBoss(def.dmg * p.damageMult * (p.damageBuff || 1), def.knock, p.facing, def.name !== 'slash');
      }
      // A blade can also carve the secret mycelial wall.
      const wall = this.activeWall();
      if (wall && !a.hitIds.includes('wall') && rectHitsRect(hb, wall)) {
        a.hitIds.push('wall');
        a.landed = true;
        this.damageWall(def.dmg * p.damageMult * (p.damageBuff || 1));
      }
      // cut down fireballs and spores
      for (const pr of this.projectiles) {
        if (pr.owner !== 'boss' || (pr.type !== 'fireball' && pr.type !== 'spore')) continue;
        if (a.hitIds.includes(pr.id)) continue;
        if (rectHitsRect(hb, { x: pr.x - pr.r, y: pr.y - pr.r, w: pr.r * 2, h: pr.r * 2 })) {
          a.hitIds.push(pr.id);
          pr.dead = true;
          this.burst(pr.x, pr.y, 8, pr.type === 'spore' ? '#b07be8' : '#ffb066', 120);
          this.emit({ type: 'deflect', x: pr.x, y: pr.y });
        }
      }
    }
  }

  playerHitbox() {
    const p = this.player;
    const def = p.attack?.def || this.currentAttackDef();
    const w = def.range;
    const h = def.height;
    const y = p.y + p.h / 2 - h / 2 + 4;
    return {
      x: p.facing > 0 ? p.x + p.w - 6 : p.x - w + 6,
      y,
      w,
      h,
    };
  }

  spawnPlayerProjectile(type, opts) {
    const r = opts.r ?? 5;
    const pr = {
      id: `p_${type}_${this.time.toFixed(4)}_${this.projectiles.length}`,
      owner: 'player',
      type,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r,
      dmg: 10,
      life: 1.2,
      warmup: 0,
      ...opts,
      w: (opts.r ?? r) * 2,
      h: (opts.r ?? r) * 2,
    };
    this.projectiles.push(pr);
    this.emit({ type: type === 'arrow' ? 'arrowShot' : 'shurikenThrow', x: pr.x, y: pr.y });
    return pr;
  }

  cycleWeapon() {
    const p = this.player;
    if (!p.weapons || p.weapons.length < 2) {
      this.emit({ type: 'weaponSwitch', weapon: p.weapon, name: WEAPONS[p.weapon]?.short || p.weapon });
      return;
    }
    const i = p.weapons.indexOf(p.weapon);
    p.weapon = p.weapons[(i + 1) % p.weapons.length];
    p.attack = null;
    this.emit({ type: 'weaponSwitch', weapon: p.weapon, name: WEAPONS[p.weapon]?.short || p.weapon });
  }

  itemCount(id) {
    const p = this.player;
    if (id === 'shuriken') return p.shurikens || 0;
    if (p.consumables && p.consumables[id] != null) return p.consumables[id];
    if (p.rituals && p.rituals[id] != null) return p.rituals[id];
    return 0;
  }

  ownedQuickItems() {
    return ['shuriken', 'knives', 'bomb'].filter((id) => this.itemCount(id) > 0);
  }

  quickItemInfo() {
    const p = this.player;
    const item = SHOP_ITEM_BY_ID[p.quickItem] || SHOP_ITEM_BY_ID.shuriken;
    return {
      id: item.id,
      name: item.shortName || item.name.toUpperCase(),
      count: this.itemCount(item.id),
    };
  }

  cycleItem() {
    const p = this.player;
    const owned = this.ownedQuickItems();
    if (!owned.length) {
      this.emit({ type: 'noAmmo', kind: 'quick' });
      return false;
    }
    const current = owned.includes(p.quickItem) ? owned.indexOf(p.quickItem) : -1;
    p.quickItem = owned[(current + 1) % owned.length];
    const info = this.quickItemInfo();
    this.emit({ type: 'quickItem', id: info.id, name: info.name, count: info.count });
    return true;
  }

  throwConsumable(kind = this.player.quickItem) {
    const p = this.player;
    const id = kind === 'knives' || kind === 'bomb' ? kind : 'shuriken';
    if (this.itemCount(id) <= 0) {
      this.emit({ type: 'noAmmo', kind: id });
      return false;
    }
    p.quickItem = id;
    if (id === 'shuriken') {
      p.shurikens -= 1;
      p.consumeCooldown = 0.28;
      this.spawnPlayerProjectile('shuriken', {
        x: p.x + p.w / 2 + p.facing * 16,
        y: p.y + p.h * 0.42,
        vx: p.facing * 620,
        vy: -35,
        r: 7,
        dmg: 12,
        life: 1.1,
      });
    } else if (id === 'knives') {
      p.consumables.knives -= 1;
      p.consumeCooldown = 0.18;
      this.spawnPlayerProjectile('knife', {
        x: p.x + p.w / 2 + p.facing * 16,
        y: p.y + p.h * 0.42,
        vx: p.facing * 760,
        vy: -18,
        r: 5,
        dmg: 16,
        life: 1.1,
        snare: 0.6,
      });
    } else {
      p.consumables.bomb -= 1;
      p.consumeCooldown = 0.5;
      this.spawnPlayerProjectile('bomb', {
        x: p.x + p.w / 2 + p.facing * 18,
        y: p.y + p.h * 0.36,
        vx: p.facing * 430,
        vy: -120,
        r: 10,
        dmg: 30,
        life: 1.2,
        explode: 76,
      });
    }
    return true;
  }

  explodeBomb(pr) {
    if (!pr || pr.exploded) return;
    pr.exploded = true;
    const radius = pr.explode || 76;
    const box = { x: pr.x - radius, y: pr.y - radius, w: radius * 2, h: radius * 2 };
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (rectHitsRect(box, e)) {
        this.hurtEnemy(e, { dmg: pr.dmg, knock: 280, name: 'bomb' }, sign(e.x + e.w / 2 - pr.x) || 1);
      }
    }
    if (this.boss && !this.boss.dying && rectHitsRect(box, this.boss)) {
      this.hurtBoss(pr.dmg * this.player.damageMult * (this.player.damageBuff || 1), 220, sign(this.boss.x - pr.x) || 1, false);
    }
    this.burst(pr.x, pr.y, 30, '#ff9d55', 310);
    this.shake = Math.max(this.shake, 0.36);
    this.emit({ type: 'explosion', x: pr.x, y: pr.y });
  }

  useItem(id) {
    const item = SHOP_ITEM_BY_ID[id];
    if (!item) return { ok: false, reason: 'Item tidak ditemukan.' };
    const p = this.player;
    if (item.type === 'sigil') return { ok: false, reason: 'Sigil aktif secara pasif.' };
    if (item.type !== 'ritual' && item.type !== 'consumable') {
      return { ok: false, reason: 'Item ini tidak bisa dipakai dari inventaris.' };
    }
    if (id === 'shuriken' || id === 'knives' || id === 'bomb') {
      const ok = this.throwConsumable(id);
      return ok ? { ok: true, item } : { ok: false, reason: 'Item habis.' };
    }
    if (this.itemCount(id) <= 0) return { ok: false, reason: 'Item habis.' };

    if (item.type === 'ritual') p.rituals[id] -= 1;
    else p.consumables[id] -= 1;

    if (id === 'tonic') {
      p.hp = Math.min(p.maxHp, p.hp + 30);
      this.burst(p.x + p.w / 2, p.y + p.h / 2, 14, '#8fd98a', 150);
    } else if (id === 'smoke') {
      p.invuln = Math.max(p.invuln, 2.5);
      this.spawnFx('dash', p.x + p.w / 2, p.y + p.h / 2, { life: 0.5, size: 46, color: '#9fb0c0' });
      this.burst(p.x + p.w / 2, p.y + p.h / 2, 18, '#b8c6d4', 160);
    } else if (id === 'whetstone') {
      p.damageBuff = 1.3;
      p.damageBuffTimer = 25;
      this.burst(p.x + p.w / 2, p.y + p.h / 2, 16, '#e0c58a', 150);
    } else if (id === 'ritual_purge') {
      for (const e of this.enemies) {
        if (e.dead) continue;
        this.hurtEnemy(e, { dmg: 60, knock: 160, name: 'ritual_purge' }, sign(e.x - p.x) || 1);
        this.burst(e.x + e.w / 2, e.y + e.h / 2, 14, '#f4e2a0', 190);
      }
      if (this.boss && !this.boss.dying) {
        this.hurtBoss(60 * p.damageMult * (p.damageBuff || 1), 120, p.facing, false);
      }
      this.projectiles = this.projectiles.filter((pr) => {
        if (pr.owner !== 'boss') return true;
        this.burst(pr.x, pr.y, 6, '#f4e2a0', 100);
        return false;
      });
      this.shake = Math.max(this.shake, 0.34);
    } else if (id === 'ritual_ward') {
      p.invuln = Math.max(p.invuln, 6);
      p.hp = Math.min(p.maxHp, p.hp + 15);
      this.spawnFx('dash', p.x + p.w / 2, p.y + p.h / 2, { life: 0.55, size: 54, color: '#e8d28a' });
      this.burst(p.x + p.w / 2, p.y + p.h / 2, 20, '#f0dc9a', 180);
    } else if (id === 'ritual_ember') {
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        this.spawnPlayerProjectile('flame_orb', {
          x: cx,
          y: cy,
          vx: Math.cos(ang) * 420,
          vy: Math.sin(ang) * 420,
          r: 8,
          dmg: 24,
          life: 0.85,
        });
      }
      this.shake = Math.max(this.shake, 0.26);
    } else if (id === 'ritual_mend') {
      p.hp = Math.min(p.maxHp, p.hp + 50);
      p.flasks = Math.min(p.maxFlasks, p.flasks + 1);
      this.burst(p.x + p.w / 2, p.y + p.h / 2, 22, '#8fd98a', 180);
    }

    this.emit({ type: 'itemUse', id: item.id, name: item.name });
    return { ok: true, item };
  }

  applySigil(id) {
    const p = this.player;
    if (id === 'sigil_ember') {
      p.damageMult *= 1.18;
    } else if (id === 'sigil_iron') {
      p.maxHp += 25;
      p.hp = Math.min(p.maxHp, p.hp + 25);
    } else if (id === 'sigil_wind') {
      p.speedMult *= 1.08;
      p.dashCooldownMax *= 0.88;
    } else if (id === 'sigil_vow') {
      p.maxFlasks += 1;
      p.flasks = p.maxFlasks;
    }
  }

  canShop() {
    if (!this.checkpoint || this.checkpointRoom !== this.roomIndex) return false;
    const m = this.room.merchant;
    if (!m) return false;
    const p = this.player;
    const pcx = p.x + p.w / 2;
    const mcx = m.x + m.w / 2;
    return Math.abs(pcx - mcx) < 110 && Math.abs(p.y + p.h - (m.y + m.h)) < 150;
  }

  buyShopItem(id) {
    const item = SHOP_ITEMS.find((x) => x.id === id);
    if (!item) return { ok: false, reason: 'Barang tidak ditemukan.' };
    const p = this.player;
    if (this.ash < item.cost) return { ok: false, reason: 'Abu tidak cukup.' };
    if (item.type === 'weapon' && p.weapons.includes(item.id)) {
      return { ok: false, reason: 'Sudah dimiliki.' };
    }
    if (item.type === 'sigil' && p.sigils.includes(item.id)) {
      return { ok: false, reason: 'Sigil sudah aktif.' };
    }
    if (item.type === 'ammo' && !p.weapons.includes('bow')) {
      return { ok: false, reason: 'Butuh Busur Abu dulu.' };
    }
    if (item.type === 'flask' && p.flasks >= p.maxFlasks) {
      return { ok: false, reason: 'Flask sudah penuh.' };
    }

    this.ash -= item.cost;
    if (item.type === 'weapon') {
      p.weapons.push(item.id);
      p.weapon = item.id;
      if (item.id === 'bow') p.arrows += 8;
    } else if (item.type === 'sigil') {
      p.sigils.push(item.id);
      this.applySigil(item.id);
    } else if (item.type === 'ritual') {
      p.rituals[item.id] = (p.rituals[item.id] || 0) + 1;
    } else if (item.id === 'shuriken') {
      p.shurikens += 3;
      p.quickItem = 'shuriken';
    } else if (item.id === 'knives') {
      p.consumables.knives = (p.consumables.knives || 0) + 5;
      p.quickItem = 'knives';
    } else if (item.id === 'bomb') {
      p.consumables.bomb = (p.consumables.bomb || 0) + 2;
      p.quickItem = 'bomb';
    } else if (item.type === 'consumable') {
      p.consumables[item.id] = (p.consumables[item.id] || 0) + 1;
    } else if (item.id === 'arrows') {
      p.arrows += 6;
    } else if (item.type === 'flask') {
      p.flasks = p.maxFlasks;
    }
    this.emit({ type: 'shopBuy', id: item.id, name: item.name, cost: item.cost });
    return { ok: true, item };
  }

  respawnAtCheckpoint() {
    if (this.checkpointRoom == null) return false;
    const room = this.checkpointRoom;
    const p = this.player;
    this.state = 'playing';
    this.deathTimer = 0;
    this.bossDefeated[room] = false;
    this.projectiles = [];
    this.hitstop = 0;
    this.shake = 0;
    this.loadRoom(room);
    p.hp = p.maxHp;
    p.flasks = p.maxFlasks;
    p.invuln = 1.2;
    this.emit({ type: 'checkpointRespawn', room });
    return true;
  }

  hurtEnemy(e, def, dir) {
    if (e.burrowed) return;
    const p = this.player;
    e.hp -= def.dmg * p.damageMult * (p.damageBuff || 1);
    e.hitFlash = 0.12;
    e.x = clamp(e.x + dir * def.knock * 0.12, 20, WORLD_W - e.w - 20);
    e.state = 'hurt';
    e.timer = 0.16;
    this.hitstop = Math.max(this.hitstop, 0.035);
    this.shake = Math.max(this.shake, 0.18);
    this.emit({ type: 'hit', crit: def.name === 'heavy', x: e.x + e.w / 2, y: e.y + e.h / 2 });
    this.burst(e.x + e.w / 2, e.y + e.h / 2, def.name === 'heavy' ? 14 : 8, '#d8b06a', 180);
    if (e.hp <= 0) {
      e.dead = true;
      this.kills += 1;
      const reward = Math.round((e.reward ?? ALL_ENEMY_INFO[e.type]?.reward ?? 8) * (this.gainBonus || 1));
      this.ash += reward;
      this.burst(e.x + e.w / 2, e.y + e.h / 2, 16, e.type === 'sporeling' || e.type === 'stalker' || e.type === 'broodmother' ? '#b07be8' : '#c96a3a', 220);
      if (e.type === 'sporeling') {
        for (let i = 0; i < 6; i++) {
          this.spawnFx('spark', e.x + e.w / 2, e.y + e.h / 2, {
            vx: rand(-40, 40),
            vy: rand(-90, -20),
            life: rand(0.5, 1.1),
            size: rand(2, 5),
            color: '#c9a0f0',
          });
        }
      }
      this.emit({ type: 'enemyDown' });
      this.emit({ type: 'ashGain', amount: reward, total: this.ash });
    }
  }

  hurtBoss(amount, knock = 0, dir = 1, crit = false) {
    const b = this.boss;
    if (!b || b.dying || b.invuln > 0) return;
    b.hp = Math.max(0, b.hp - amount);
    b.hitFlash = 0.1;
    b.x = clamp(b.x + dir * knock * 0.03, 40, WORLD_W - b.w - 40);
    this.hitstop = Math.max(this.hitstop, crit ? 0.07 : 0.035);
    this.shake = Math.max(this.shake, crit ? 0.35 : 0.2);
    this.emit({ type: 'bossHit', crit, x: b.x + b.w / 2, y: b.y + b.h * 0.35 });
    this.burst(b.x + b.w / 2, b.y + b.h * 0.4, crit ? 16 : 9, '#e9c46a', 200);
    while (
      b.phase < b.maxPhases &&
      b.hp <= b.maxHp * (b.phaseThresholds[b.phase - 1] ?? 0.5)
    ) {
      b.phase += 1;
      b.invuln = 0.4;
      this.shake = 0.7;
      this.emit({ type: 'bossPhase', name: b.name, phase: b.phase });
      this.emitBossDialogue(b, `phase${b.phase}`);
      this.burst(b.x + b.w / 2, b.y + b.h / 2, 26, '#ff7b3d', 280);
      this.onBossPhase(b);
    }
    if (b.hp <= 0) {
      b.dying = true;
      b.deathTimer = 1.25;
      this.projectiles = [];
      this.shake = 0.8;
      this.emit({ type: 'bossDie', name: b.name });
      this.burst(b.x + b.w / 2, b.y + b.h / 2, 34, '#ffb066', 300);
    }
  }

  damageBoss(n) {
    this.hurtBoss(n, 0, 1, true);
  }

  damagePlayer(amount, sourceX = 0, opts = {}) {
    const p = this.player;
    if (this.state !== 'playing' || p.invuln > 0 || p.dashTimer > 0 || p.hp <= 0) return false;
    p.hp = Math.max(0, p.hp - amount);
    p.invuln = 0.75;
    p.hitFlash = 0.25;
    p.attack = null;
    p.healing = 0;
    if (opts.knock !== false) {
      const dir = p.x + p.w / 2 < sourceX ? -1 : 1;
      p.vx = dir * 230;
      p.vy = -260;
      p.onGround = false;
    }
    this.hitstop = Math.max(this.hitstop, 0.055);
    this.shake = Math.max(this.shake, 0.4);
    this.emit({ type: 'playerHurt' });
    this.burst(p.x + p.w / 2, p.y + p.h / 2, 12, '#b84040', 200);
    if (p.hp <= 0) {
      this.state = 'dead';
      this.deathTimer = 0;
      this.emit({ type: 'death' });
      this.burst(p.x + p.w / 2, p.y + p.h / 2, 24, '#8e2f2f', 260);
    }
    return true;
  }

  // ── enemies ──────────────────────────────────────────────────────────────
  enemyGroundAhead(e, dir) {
    const foot = e.y + e.h;
    const probeX = e.x + e.w / 2 + dir * (e.w / 2 + 20);
    for (const pl of this.room.platforms) {
      if (probeX < pl.x || probeX > pl.x + pl.w) continue;
      if (Math.abs(pl.y - foot) < 16) return true;
    }
    return false;
  }

  integrateEnemy(e, dt) {
    e.x += e.vx * dt;
    e.x = clamp(e.x, 20, WORLD_W - e.w - 20);
    const prevBottom = e.y + e.h;
    e.vy += GRAVITY * dt;
    e.y += e.vy * dt;
    e.onGround = false;
    for (const plat of this.room.platforms) {
      if (e.x + e.w <= plat.x || e.x >= plat.x + plat.w) continue;
      if (e.vy >= 0 && prevBottom <= plat.y + 4 && e.y + e.h >= plat.y) {
        e.y = plat.y - e.h;
        e.vy = 0;
        e.onGround = true;
      }
    }
    if (e.y > 650) {
      e.x = clamp(e.homeX ?? e.minX ?? 80, 20, WORLD_W - e.w - 20);
      e.y = FLOOR_Y - e.h;
      e.vx = 0;
      e.vy = 0;
      e.onGround = true;
    }
  }

  moveEnemy(e, dt, dir, speed, allowJump = true) {
    const p = this.player;
    e.facing = dir || e.facing;
    const targetVx = dir * speed;
    const accel = 1500 * dt;
    e.vx += clamp(targetVx - e.vx, -accel, accel);

    if (allowJump && e.onGround && e.jumpCooldown <= 0) {
      const pcx = p.x + p.w / 2;
      const ecx = e.x + e.w / 2;
      const pFoot = p.y + p.h;
      const eFoot = e.y + e.h;
      const playerAbove = pFoot < eFoot - 28 && Math.abs(pcx - ecx) < 300;
      const gapAhead = dir !== 0 && !this.enemyGroundAhead(e, dir);
      const shouldCrossGap =
        gapAhead && (pFoot < eFoot - 6 || Math.abs(pcx - ecx) > e.w + 70);
      if (playerAbove || shouldCrossGap) {
        if (shouldCrossGap && dir !== 0) e.vx = dir * 300;
        e.vy = -720;
        e.onGround = false;
        e.jumpCooldown = 0.62;
      }
    }
    this.integrateEnemy(e, dt);
  }

  updateEnemies(dt) {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.timer > 0) e.timer -= dt;
      if (e.cooldown > 0) e.cooldown -= dt;
      if (e.jumpCooldown > 0) e.jumpCooldown -= dt;
      if (e.snared > 0) {
        e.snared = Math.max(0, e.snared - dt);
        e.vx *= Math.pow(0.001, dt);
        this.integrateEnemy(e, dt);
        continue;
      }
      const pcx = p.x + p.w / 2;
      const ecx = e.x + e.w / 2;
      const distX = pcx - ecx;
      const dy = p.y + p.h - (e.y + e.h);
      const ai = e.ai || e.type;
      const aggroRange = ai === 'sentinel' || ai === 'wraith' ? 720 : 540;
      const aggro = Math.abs(distX) < aggroRange && Math.abs(dy) < (e.flying ? 420 : 300);

      if (ai === 'wraith') {
        this.updateWraith(e, dt, aggro, distX);
        continue;
      }
      if (ai === 'stalker') {
        this.updateStalker(e, dt, aggro, distX, dy);
        continue;
      }
      if (ai === 'broodmother') {
        this.updateBroodmother(e, dt, aggro, distX);
        continue;
      }

      if (e.state === 'hurt') {
        e.vx = 0;
        this.integrateEnemy(e, dt);
        if (e.timer <= 0) e.state = 'patrol';
        continue;
      }

      if (ai === 'sporeling') {
        if (e.hopTimer > 0) e.hopTimer -= dt;
        if (aggro) {
          e.state = 'chase';
          const dir = Math.abs(distX) > 18 ? sign(distX) : 0;
          e.facing = dir || e.facing;
          if (e.onGround && e.hopTimer <= 0) {
            e.vy = -430;
            e.vx = dir * 175;
            e.onGround = false;
            e.hopTimer = 0.62 + Math.random() * 0.34;
            this.emit({ type: 'enemyHop' });
          } else if (!e.onGround) {
            e.vx += clamp(dir * 150 - e.vx, -260 * dt, 260 * dt);
          } else {
            e.vx *= Math.pow(0.002, dt);
          }
        } else {
          e.state = 'patrol';
          if (e.x <= e.minX) e.patrolDir = 1;
          if (e.x + e.w >= e.maxX) e.patrolDir = -1;
          e.facing = e.patrolDir;
          if (e.onGround && e.hopTimer <= 0) {
            e.vy = -310;
            e.vx = e.patrolDir * 110;
            e.onGround = false;
            e.hopTimer = 1.1 + Math.random() * 0.7;
          }
        }
        this.integrateEnemy(e, dt);
        e.x = clamp(e.x, Math.min(e.minX, e.maxX - e.w), Math.max(e.minX, e.maxX - e.w));
      } else if (ai === 'crawler') {
        if (aggro) {
          e.state = 'chase';
          const dir = Math.abs(distX) > 10 ? sign(distX) : 0;
          this.moveEnemy(e, dt, dir, e.speed * 1.35, true);
        } else {
          e.state = 'patrol';
          if (e.x <= e.minX) e.patrolDir = 1;
          if (e.x + e.w >= e.maxX) e.patrolDir = -1;
          this.moveEnemy(e, dt, e.patrolDir, e.speed, false);
          e.x = clamp(e.x, e.minX, Math.max(e.minX, e.maxX - e.w));
        }
      } else if (ai === 'brute') {
        if (e.state === 'slamWind') {
          e.vx = 0;
          this.integrateEnemy(e, dt);
          if (e.timer <= 0) {
            e.state = 'slam';
            e.timer = 0.24;
            this.spawnBruteShockwaves(e);
            this.shake = Math.max(this.shake, 0.35);
            this.emit({ type: 'bossSlam' });
          }
        } else if (e.state === 'slam') {
          e.vx = 0;
          this.integrateEnemy(e, dt);
          if (e.timer <= 0) {
            e.state = 'recover';
            e.timer = 0.8;
            e.cooldown = 1.5;
          }
        } else if (e.state === 'recover') {
          e.vx = 0;
          this.integrateEnemy(e, dt);
          if (e.timer <= 0) e.state = 'patrol';
        } else if (aggro) {
          if (e.cooldown <= 0 && Math.abs(distX) < 175 && Math.abs(dy) < 90) {
            e.facing = sign(distX) || e.facing;
            e.state = 'slamWind';
            e.timer = 0.68;
            e.vx = 0;
            this.emit({ type: 'enemyTelegraph' });
          } else {
            e.state = 'chase';
            const dir = Math.abs(distX) > 18 ? sign(distX) : 0;
            this.moveEnemy(e, dt, dir, e.speed, true);
          }
        } else {
          e.state = 'patrol';
          if (e.x <= e.minX) e.patrolDir = 1;
          if (e.x + e.w >= e.maxX) e.patrolDir = -1;
          this.moveEnemy(e, dt, e.patrolDir, e.speed * 0.55, false);
          e.x = clamp(e.x, e.minX, Math.max(e.minX, e.maxX - e.w));
        }
      } else if (ai === 'sentinel') {
        if (e.state === 'windup') {
          e.vx = 0;
          this.integrateEnemy(e, dt);
          if (e.timer <= 0) {
            e.state = 'lunge';
            e.timer = 0.3;
            e.vx = e.facing * 430;
            this.emit({ type: 'enemyLunge' });
          }
        } else if (e.state === 'lunge') {
          e.vx = e.facing * 430;
          this.integrateEnemy(e, dt);
          if (e.timer <= 0) {
            e.state = 'recover';
            e.timer = 0.55;
            e.vx = 0;
          }
        } else if (e.state === 'recover') {
          e.vx = 0;
          this.integrateEnemy(e, dt);
          if (e.timer <= 0) {
            e.state = 'patrol';
            e.cooldown = 1.0;
          }
        } else if (aggro) {
          if (e.cooldown <= 0 && Math.abs(distX) < 150 && Math.abs(dy) < 90) {
            e.facing = sign(distX) || e.facing;
            e.state = 'windup';
            e.timer = 0.48;
            e.vx = 0;
            this.emit({ type: 'enemyTelegraph' });
          } else {
            e.state = 'chase';
            const dir = Math.abs(distX) > 12 ? sign(distX) : 0;
            this.moveEnemy(e, dt, dir, e.speed, true);
          }
        } else {
          e.state = 'patrol';
          if (e.x <= e.minX) e.patrolDir = 1;
          if (e.x + e.w >= e.maxX) e.patrolDir = -1;
          this.moveEnemy(e, dt, e.patrolDir, e.speed * 0.6, false);
          e.x = clamp(e.x, e.minX, Math.max(e.minX, e.maxX - e.w));
        }
      }
    }
  }

  updateStalker(e, dt, aggro, distX, dy) {
    const p = this.player;
    if (e.state === 'hurt') {
      e.vx = 0;
      this.integrateEnemy(e, dt);
      if (e.timer <= 0) e.state = 'chase';
      return;
    }
    if (e.burrowCooldown > 0) e.burrowCooldown -= dt;
    if (e.burrowTimer > 0) e.burrowTimer -= dt;
    e.facing = distX < 0 ? -1 : 1;

    if (e.burrowed) {
      // Slither under the arena toward the player's last position, then erupt.
      e.x += clamp(p.x + p.w / 2 - (e.x + e.w / 2), -230 * dt, 230 * dt);
      e.x = clamp(e.x, Math.max(20, e.minX), Math.min(WORLD_W - e.w - 20, e.maxX - e.w));
      e.y = FLOOR_Y + 14;
      e.vx = 0;
      e.vy = 0;
      if (e.burrowTimer <= 0) {
        e.burrowed = false;
        e.y = FLOOR_Y - e.h;
        e.state = 'emergeWind';
        e.timer = 0.3;
        e.attackLanded = false;
        this.emit({ type: 'enemyEmerge', x: e.x + e.w / 2, y: FLOOR_Y });
        this.burst(e.x + e.w / 2, FLOOR_Y - 4, 12, '#9a6ac0', 150);
        this.shake = Math.max(this.shake, 0.18);
      }
      return;
    }

    if (e.state === 'burrowWind') {
      e.vx = 0;
      e.burrowTimer -= dt;
      e.y += 40 * dt;
      if (e.burrowTimer <= 0) {
        e.burrowed = true;
        e.state = 'burrowed';
        e.burrowTimer = 0.72;
      }
      return;
    }
    if (e.state === 'emergeWind') {
      if (e.timer <= 0) {
        e.state = 'lunge';
        e.timer = 0.34;
        e.vx = e.facing * 390;
        this.emit({ type: 'enemyLunge' });
      }
      return;
    }
    if (e.state === 'lunge') {
      this.integrateEnemy(e, dt);
      if (!e.attackLanded && rectHitsRect(e, p)) {
        e.attackLanded = true;
        this.damagePlayer(e.dmg, e.x + e.w / 2);
      }
      if (e.timer <= 0) {
        e.state = 'recover';
        e.timer = 0.6;
        e.vx = 0;
        e.burrowCooldown = 2.8;
      }
      return;
    }
    if (e.state === 'recover') {
      e.vx = 0;
      this.integrateEnemy(e, dt);
      if (e.timer <= 0) e.state = 'chase';
      return;
    }

    if (aggro) {
      e.state = 'chase';
      if (e.burrowCooldown <= 0 && Math.abs(dy) < 120) {
        e.state = 'burrowWind';
        e.burrowTimer = 0.42;
        e.vx = 0;
        this.emit({ type: 'enemyTelegraph' });
        return;
      }
      const dir = Math.abs(distX) > 20 ? sign(distX) : 0;
      this.moveEnemy(e, dt, dir, e.speed, true);
    } else {
      e.state = 'patrol';
      if (e.x <= e.minX) e.patrolDir = 1;
      if (e.x + e.w >= e.maxX) e.patrolDir = -1;
      this.moveEnemy(e, dt, e.patrolDir, e.speed * 0.5, false);
      e.x = clamp(e.x, e.minX, Math.max(e.minX, e.maxX - e.w));
    }
  }

  updateBroodmother(e, dt, aggro, distX) {
    if (e.state === 'hurt') {
      e.vx = 0;
      this.integrateEnemy(e, dt);
      if (e.timer <= 0) e.state = 'chase';
      return;
    }
    if (e.spawnCooldown > 0) e.spawnCooldown -= dt;
    if (!aggro) {
      e.state = 'patrol';
      if (e.x <= e.minX) e.patrolDir = 1;
      if (e.x + e.w >= e.maxX) e.patrolDir = -1;
      this.moveEnemy(e, dt, e.patrolDir, e.speed * 0.5, false);
      e.x = clamp(e.x, e.minX, Math.max(e.minX, e.maxX - e.w));
      return;
    }
    e.state = 'chase';
    e.facing = distX < 0 ? -1 : 1;
    this.moveEnemy(e, dt, Math.abs(distX) > 90 ? sign(distX) : 0, e.speed, true);
    if (e.spawnCooldown <= 0 && this.enemies.filter((x) => !x.dead).length < 11) {
      const spawnX = clamp(e.x + (e.facing > 0 ? -34 : e.w + 10), e.minX, e.maxX - 36);
      const childType = e.childType || 'sporeling';
      const child = this.spawnEnemy({
        type: childType,
        x: spawnX,
        minX: e.minX,
        maxX: e.maxX,
      });
      child.y = e.y + e.h - child.h;
      child.vy = -180;
      child.vx = e.facing * 120;
      e.spawnCooldown = 4.2;
      this.emit({ type: 'enemySpawn', kind: childType });
      this.burst(e.x + e.w / 2, e.y + e.h * 0.7, 12, '#b07be8', 160);
    }
  }

  updateWraith(e, dt, aggro, distX) {
    const p = this.player;
    const targetY = FLOOR_Y - e.h - 76 + Math.sin(this.time * 1.8 + e.homeX * 0.02) * 24;
    e.y += (targetY - e.y) * Math.min(1, dt * 2.4);
    e.x = clamp(e.x, 20, WORLD_W - e.w - 20);
    if (e.castCooldown > 0) e.castCooldown -= dt;
    e.facing = distX < 0 ? -1 : 1;

    if (e.state === 'hurt') {
      e.vx *= 0.9;
      e.x += e.vx * dt;
      if (e.timer <= 0) e.state = 'patrol';
      return;
    }
    if (e.state === 'castWind') {
      e.vx = 0;
      if (e.timer <= 0) {
        const sx = e.x + e.w / 2;
        const sy = e.y + e.h / 2;
        const tx = p.x + p.w / 2;
        const ty = p.y + p.h / 2;
        const angle = Math.atan2(ty - sy, tx - sx);
        this.spawnEnemyProjectile({
          owner: 'boss',
          type: 'wisp',
          x: sx,
          y: sy,
          vx: Math.cos(angle) * 290,
          vy: Math.sin(angle) * 290,
          r: 8,
          dmg: 12,
          life: 3.2,
        });
        e.state = 'cast';
        e.timer = 0.55;
        this.emit({ type: 'fireball' });
      }
      return;
    }
    if (e.state === 'cast') {
      e.vx = 0;
      if (e.timer <= 0) {
        e.state = 'patrol';
        e.castCooldown = 2.4;
      }
      return;
    }
    if (aggro) {
      e.state = 'chase';
      if (e.castCooldown <= 0 && Math.abs(distX) < 620) {
        e.state = 'castWind';
        e.timer = 0.48;
        e.vx = 0;
        this.emit({ type: 'enemyTelegraph' });
      } else {
        const dir = Math.abs(distX) > 12 ? sign(distX) : 0;
        const speed = Math.abs(distX) < 210 ? -dir * e.speed * 0.7 : dir * e.speed;
        e.vx += clamp(speed - e.vx, -420 * dt, 420 * dt);
        e.x += e.vx * dt;
      }
    } else {
      e.state = 'patrol';
      if (e.x <= e.minX) e.patrolDir = 1;
      if (e.x + e.w >= e.maxX) e.patrolDir = -1;
      e.vx += clamp(e.patrolDir * e.speed * 0.55 - e.vx, -300 * dt, 300 * dt);
      e.x += e.vx * dt;
      e.x = clamp(e.x, e.minX, Math.max(e.minX, e.maxX - e.w));
    }
  }

  // ── bosses ───────────────────────────────────────────────────────────────
  updateBoss(dt) {
    const b = this.boss;
    if (!b) return;
    if (b.hitFlash > 0) b.hitFlash -= dt;
    if (b.invuln > 0) b.invuln -= dt;
    if (b.intro > 0) {
      b.intro -= dt;
      return;
    }
    if (b.dying) {
      b.deathTimer -= dt;
      if (Math.random() < 0.4) {
        this.spawnFx('spark', b.x + rand(10, b.w - 10), b.y + rand(10, b.h - 10), {
          vx: rand(-30, 30),
          vy: rand(-140, -30),
          life: rand(0.3, 0.8),
          size: rand(2, 6),
          color: '#ffb066',
        });
      }
      if (b.deathTimer <= 0) this.finishBoss();
      return;
    }
    if (b.kind === 'warden') this.updateWarden(b, dt);
    else if (b.kind === 'wyrm') this.updateWyrm(b, dt);
    else if (b.kind === 'choir') this.updateChoir(b, dt);
    else if (b.kind === 'oathbreaker') this.updateOathbreaker(b, dt);
    else if (b.kind === 'sporebound') this.updateSporebound(b, dt);
    else if (b.kind === 'root') this.updateRoot(b, dt);
    else if (b.patternType) this.updateEchoBoss(b, dt);
  }

  onBossPhase(b) {
    if (b.kind === 'warden') this.spawnShockwaves(b);
    else if (b.kind === 'choir') {
      for (let i = 0; i < 8; i++) this.spawnNote(b, (Math.PI * 2 * i) / 8);
    } else if (b.kind === 'oathbreaker') {
      this.spawnShockwaves(b);
      for (let i = 0; i < 3; i++) {
        this.spawnFireball(b, this.player.x + this.player.w / 2 + (i - 1) * 90, this.player.y + 20);
      }
    } else if (b.kind === 'sporebound') {
      this.spawnSporeRing(b, 8 + b.phase * 2, 235);
      if (b.phase >= 2) {
        for (const dir of [-1, 1]) {
          const child = this.spawnEnemy({
            type: 'sporeling',
            x: clamp(b.x + b.w / 2 + dir * 90, 40, WORLD_W - 80),
            minX: 40,
            maxX: WORLD_W - 80,
          });
          child.y = FLOOR_Y - child.h;
          this.burst(child.x + child.w / 2, FLOOR_Y - 8, 8, '#b07be8', 140);
        }
        this.emit({ type: 'bossSummon', kind: 'sporeling' });
      }
    } else if (b.kind === 'root') {
      this.spawnShockwaves(b);
      this.spawnSporeRing(b, 6, 200);
    } else if (b.patternType) {
      this.spawnShockwaves(b);
      this.spawnEchoRing(b, b.phase >= 3 ? 16 : b.phase >= 2 ? 12 : 9, 210 + b.phase * 18);
      if (b.patternType === 'summon') this.spawnEchoMinions(b, 2);
      this.emit({ type: 'bossPhaseFx', kind: b.patternType });
    }
  }

  updateWarden(b, dt) {
    const p = this.player;
    const pcx = p.x + p.w / 2;
    const bcx = b.x + b.w / 2;
    const dist = Math.abs(pcx - bcx);
    const dir = sign(pcx - bcx) || b.facing;
    if (b.timer > 0) b.timer -= dt;
    if (b.cooldown > 0) b.cooldown -= dt;
    b.y = FLOOR_Y - b.h;

    switch (b.state) {
      case 'chase': {
        b.facing = dir;
        if (b.cooldown <= 0) {
          if (dist < 155) {
            b.state = 'slashWind';
            b.timer = b.phase === 2 ? 0.32 : 0.46;
            b.attackLanded = false;
            this.emit({ type: 'bossTelegraph', kind: 'slash' });
          } else {
            b.state = 'slamWind';
            b.timer = 0.66;
            b.attackLanded = false;
            this.emit({ type: 'bossTelegraph', kind: 'slam' });
          }
        } else {
          const spd = b.phase === 2 ? 118 : 78;
          if (dist > 66) b.x += dir * spd * dt;
        }
        break;
      }
      case 'slashWind': {
        b.facing = dir;
        if (b.timer <= 0) {
          b.state = 'slashActive';
          b.timer = 0.16;
          b.attackLanded = false;
          this.emit({ type: 'bossSlash' });
          this.shake = Math.max(this.shake, 0.18);
        }
        break;
      }
      case 'slashActive': {
        if (!b.attackLanded) {
          const hb = {
            x: b.facing > 0 ? b.x + b.w - 12 : b.x - 118,
            y: b.y + 8,
            w: 130,
            h: b.h - 6,
          };
          if (rectHitsRect(hb, p)) {
            b.attackLanded = true;
            this.damagePlayer(b.phase === 2 ? 26 : 19, bcx);
          }
        }
        if (b.timer <= 0) {
          b.state = 'recover';
          b.timer = 0.5;
          b.cooldown = b.phase === 2 ? 0.9 : 1.45;
          if (b.phase === 2) this.spawnShockwaves(b);
        }
        break;
      }
      case 'slamWind': {
        if (b.timer <= 0) {
          this.spawnShockwaves(b);
          b.state = 'recover';
          b.timer = 0.62;
          b.cooldown = b.phase === 2 ? 1.7 : 2.3;
          this.shake = 0.65;
          this.emit({ type: 'bossSlam' });
          this.burst(b.x + b.w / 2, FLOOR_Y - 8, 20, '#d08a4a', 260);
        }
        break;
      }
      case 'recover': {
        if (b.timer <= 0) b.state = 'chase';
        break;
      }
      default:
        b.state = 'chase';
    }
    b.x = clamp(b.x, 20, WORLD_W - b.w - 20);
  }

  spawnShockwaves(b) {
    const y = FLOOR_Y - 26;
    for (const dir of [-1, 1]) {
      this.projectiles.push({
        id: `shock_${this.time}_${dir}`,
        owner: 'boss',
        type: 'shockwave',
        x: b.x + b.w / 2 - 20,
        y,
        vx: dir * (b.phase === 2 ? 430 : 330),
        vy: 0,
        w: 46,
        h: 26,
        r: 22,
        dmg: 15,
        life: 2.6,
        warmup: 0,
      });
    }
    this.emit({ type: 'shockwave' });
  }

  spawnBruteShockwaves(e) {
    const y = FLOOR_Y - 24;
    for (const dir of [-1, 1]) {
      this.projectiles.push({
        id: `brute_${this.time}_${dir}_${Math.random().toString(36).slice(2, 5)}`,
        owner: 'boss',
        type: 'shockwave',
        x: e.x + e.w / 2 - 20,
        y,
        vx: dir * 260,
        vy: 0,
        w: 40,
        h: 24,
        r: 20,
        dmg: 13,
        life: 2.2,
        warmup: 0,
      });
    }
    this.emit({ type: 'shockwave' });
  }

  updateWyrm(b, dt) {
    const p = this.player;
    const pcx = p.x + p.w / 2;
    const bcx = b.x + b.w / 2;
    b.hoverT += dt;
    if (b.timer > 0) b.timer -= dt;
    if (b.cooldown > 0) b.cooldown -= dt;

    switch (b.state) {
      case 'hover':
      case 'idle': {
        b.state = 'hover';
        const targetY = 160 + Math.sin(b.hoverT * 1.7) * 42;
        b.y += (targetY - b.y) * Math.min(1, dt * 2.2);
        const desiredX = clamp(pcx - b.w / 2 + Math.sin(b.hoverT * 0.9) * 90, 80, WORLD_W - b.w - 80);
        b.x += clamp(desiredX - b.x, -170 * dt, 170 * dt);
        b.facing = pcx < bcx ? -1 : 1;
        if (b.cooldown <= 0) {
          const patterns = b.phase === 2 ? ['volley', 'dive', 'pillars', 'volley'] : ['volley', 'dive'];
          const next = b.pattern % patterns.length;
          b.pattern += 1;
          b.state = patterns[next];
          b.attackLanded = false;
          if (b.state === 'volley') {
            b.timer = 0.5;
            b.shotsLeft = b.phase === 2 ? 5 : 3;
            b.shotTimer = 0;
            this.emit({ type: 'bossTelegraph', kind: 'volley' });
          } else if (b.state === 'dive') {
            b.state = 'diveWind';
            b.timer = 0.52;
            b.targetX = pcx;
            this.emit({ type: 'bossTelegraph', kind: 'dive' });
          } else {
            b.timer = 0.42;
            b.state = 'pillarWind';
            this.emit({ type: 'bossTelegraph', kind: 'pillars' });
          }
        }
        break;
      }
      case 'volley': {
        if (b.timer > 0) break;
        b.shotTimer -= dt;
        if (b.shotTimer <= 0 && b.shotsLeft > 0) {
          b.shotsLeft -= 1;
          b.shotTimer = 0.19;
          this.spawnFireball(b, pcx, p.y + p.h / 2);
        }
        if (b.shotsLeft <= 0) {
          b.state = 'recover';
          b.timer = 0.55;
          b.cooldown = 1.5;
        }
        break;
      }
      case 'diveWind': {
        b.facing = p.x + p.w / 2 < bcx ? -1 : 1;
        if (b.timer <= 0) {
          b.state = 'dive';
          b.targetX = p.x + p.w / 2;
          const frames = 0.42;
          b.vx = clamp((b.targetX - bcx) / frames, -420, 420);
          b.vy = 860;
          this.emit({ type: 'wyrmDive' });
        }
        break;
      }
      case 'dive': {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (!b.attackLanded && rectHitsRect(b, p)) {
          b.attackLanded = true;
          this.damagePlayer(24, bcx);
        }
        if (b.y + b.h >= FLOOR_Y - 12) {
          b.y = FLOOR_Y - 12 - b.h;
          b.state = 'rise';
          b.timer = 0.58;
          b.vy = -560;
          b.vx *= 0.3;
          this.shake = 0.55;
          this.emit({ type: 'bossSlam' });
          this.burst(b.x + b.w / 2, FLOOR_Y - 10, 18, '#d98a58', 240);
        }
        break;
      }
      case 'rise': {
        b.y += b.vy * dt;
        b.x += b.vx * dt;
        if (b.y < 210 || b.timer <= 0) {
          b.state = 'hover';
          b.cooldown = 1.1;
        }
        break;
      }
      case 'pillarWind': {
        if (b.timer <= 0) {
          const base = clamp(pcx, 120, WORLD_W - 120);
          for (const off of [-150, 0, 150]) {
            const x = clamp(base + off, 40, WORLD_W - 90);
            this.projectiles.push({
              id: `pillar_${this.time}_${off}`,
              owner: 'boss',
              type: 'pillar',
              x: x - 25,
              y: FLOOR_Y - 200,
              vx: 0,
              vy: 0,
              w: 50,
              h: 200,
              r: 25,
              dmg: 17,
              life: 1.5,
              warmup: 0.5,
            });
          }
          this.emit({ type: 'pillars' });
          b.state = 'recover';
          b.timer = 0.7;
          b.cooldown = 1.35;
        }
        break;
      }
      case 'recover': {
        const targetY = 170;
        b.y += (targetY - b.y) * Math.min(1, dt * 2);
        if (b.timer <= 0) b.state = 'hover';
        break;
      }
      default:
        b.state = 'hover';
    }
    b.x = clamp(b.x, 20, WORLD_W - b.w - 20);
    b.y = clamp(b.y, 50, FLOOR_Y - b.h);
  }

  updateChoir(b, dt) {
    const p = this.player;
    const pcx = p.x + p.w / 2;
    const bcx = b.x + b.w / 2;
    b.hoverT += dt;
    if (b.timer > 0) b.timer -= dt;
    if (b.cooldown > 0) b.cooldown -= dt;

    switch (b.state) {
      case 'hover':
      case 'idle': {
        b.state = 'hover';
        const targetY = 180 + Math.sin(b.hoverT * 1.5) * 34;
        b.y += (targetY - b.y) * Math.min(1, dt * 2);
        const desiredX = clamp(pcx - b.w / 2 + Math.sin(b.hoverT * 0.75) * 120, 100, WORLD_W - b.w - 100);
        b.x += clamp(desiredX - b.x, -130 * dt, 130 * dt);
        b.facing = pcx < bcx ? -1 : 1;
        if (b.cooldown <= 0) {
          const patterns = b.phase === 2 ? ['chord', 'beam', 'chord', 'echo'] : ['chord', 'beam'];
          const pattern = patterns[b.pattern % patterns.length];
          b.pattern += 1;
          b.attackLanded = false;
          if (pattern === 'chord' || pattern === 'echo') {
            b.state = pattern === 'echo' ? 'echoWind' : 'chordWind';
            b.timer = b.phase === 2 ? 0.34 : 0.48;
            b.shotsLeft = pattern === 'echo' ? 6 : b.phase === 2 ? 6 : 4;
            b.shotTimer = 0;
            this.emit({ type: 'bossTelegraph', kind: pattern });
          } else {
            b.state = 'beamWind';
            b.timer = 0.68;
            b.targetX = pcx;
            this.emit({ type: 'bossTelegraph', kind: 'beam' });
          }
        }
        break;
      }
      case 'chordWind':
      case 'echoWind': {
        if (b.timer > 0) break;
        b.shotTimer -= dt;
        if (b.shotTimer <= 0 && b.shotsLeft > 0) {
          const spiral = (b.shotTimer + b.shotsLeft) * 1.7 + b.hoverT;
          this.spawnNote(b, spiral, b.phase === 2 ? 300 : 230);
          if (b.state === 'echoWind') this.spawnNote(b, -spiral, b.phase === 2 ? 260 : 200);
          b.shotsLeft -= 1;
          b.shotTimer = 0.22;
        }
        if (b.shotsLeft <= 0) {
          b.state = 'recover';
          b.timer = 0.55;
          b.cooldown = b.phase === 2 ? 1.05 : 1.55;
        }
        break;
      }
      case 'beamWind': {
        b.facing = pcx < bcx ? -1 : 1;
        if (b.timer <= 0) {
          this.spawnBeam(b);
          b.state = 'recover';
          b.timer = 0.6;
          b.cooldown = b.phase === 2 ? 1.2 : 1.7;
          this.emit({ type: 'pillars' });
        }
        break;
      }
      case 'recover': {
        const targetY = 180;
        b.y += (targetY - b.y) * Math.min(1, dt * 2.5);
        if (b.timer <= 0) b.state = 'hover';
        break;
      }
      default:
        b.state = 'hover';
    }
    b.x = clamp(b.x, 20, WORLD_W - b.w - 20);
    b.y = clamp(b.y, 50, FLOOR_Y - b.h);
  }

  spawnNote(b, angle, speed = 240) {
    const sx = b.x + b.w / 2;
    const sy = b.y + b.h * 0.48;
    this.projectiles.push({
      id: `note_${this.time}_${Math.random().toString(36).slice(2, 6)}`,
      owner: 'boss',
      type: 'note',
      x: sx,
      y: sy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 10,
      dmg: b.phase === 2 ? 13 : 10,
      life: 3.4,
      warmup: 0,
    });
    this.emit({ type: 'note' });
  }

  spawnBeam(b) {
    this.projectiles.push({
      id: `beam_${this.time}_${Math.random().toString(36).slice(2, 6)}`,
      owner: 'boss',
      type: 'beam',
      x: clamp(b.targetX - 24, 20, WORLD_W - 60),
      y: FLOOR_Y - 270,
      vx: 0,
      vy: 0,
      w: 48,
      h: 270,
      r: 24,
      dmg: b.phase === 2 ? 20 : 16,
      life: 1.25,
      warmup: 0.4,
    });
    this.burst(b.targetX, FLOOR_Y - 10, 12, '#c9b8ff', 180);
  }

  updateOathbreaker(b, dt) {
    const p = this.player;
    const pcx = p.x + p.w / 2;
    const bcx = b.x + b.w / 2;
    const dist = Math.abs(pcx - bcx);
    const dir = sign(pcx - bcx) || b.facing;
    if (b.timer > 0) b.timer -= dt;
    if (b.cooldown > 0) b.cooldown -= dt;
    b.y = FLOOR_Y - b.h;

    switch (b.state) {
      case 'chase': {
        b.facing = dir;
        if (b.cooldown <= 0) {
          if (dist < 165) {
            b.state = 'slashWind';
            b.timer = b.phase >= 3 ? 0.2 : b.phase === 2 ? 0.3 : 0.44;
            b.attackLanded = false;
            this.emit({ type: 'bossTelegraph', kind: 'slash' });
          } else if (b.phase >= 2 && (b.pattern + (b.phase === 3 ? 1 : 0)) % 3 === 0) {
            b.state = 'dashWind';
            b.timer = 0.36;
            b.targetX = pcx;
            this.emit({ type: 'bossTelegraph', kind: 'dash' });
          } else if (b.phase >= 3 && b.pattern % 4 === 2) {
            b.state = 'novaWind';
            b.timer = 0.55;
            this.emit({ type: 'bossTelegraph', kind: 'nova' });
          } else {
            b.state = 'volley';
            b.timer = 0.38;
            b.shotsLeft = b.phase >= 3 ? 4 : b.phase === 2 ? 3 : 2;
            b.shotTimer = 0;
            b.threat = true;
            this.emit({ type: 'bossTelegraph', kind: 'volley' });
          }
          b.pattern += 1;
        } else {
          const speed = b.phase >= 3 ? 150 : b.phase === 2 ? 112 : 82;
          if (dist > 70) b.x += dir * speed * dt;
        }
        break;
      }
      case 'slashWind': {
        b.facing = dir;
        if (b.timer <= 0) {
          b.state = 'slashActive';
          b.timer = 0.16;
          b.attackLanded = false;
          this.emit({ type: 'bossSlash' });
          this.shake = Math.max(this.shake, 0.2);
        }
        break;
      }
      case 'slashActive': {
        if (!b.attackLanded) {
          const hb = {
            x: b.facing > 0 ? b.x + b.w - 10 : b.x - 132,
            y: b.y + 6,
            w: 144,
            h: b.h - 4,
          };
          if (rectHitsRect(hb, p)) {
            b.attackLanded = true;
            this.damagePlayer(b.phase >= 3 ? 30 : b.phase === 2 ? 25 : 20, bcx);
          }
        }
        if (b.timer <= 0) {
          b.state = 'recover';
          b.timer = 0.42;
          b.cooldown = b.phase >= 3 ? 0.65 : b.phase === 2 ? 0.9 : 1.3;
        }
        break;
      }
      case 'dashWind': {
        b.facing = dir;
        if (b.timer <= 0) {
          b.state = 'dash';
          b.timer = 0.3;
          b.vx = dir * (b.phase >= 3 ? 620 : 520);
          b.attackLanded = false;
          this.emit({ type: 'wyrmDive' });
        }
        break;
      }
      case 'dash': {
        b.x += b.vx * dt;
        if (!b.attackLanded && rectHitsRect(b, p)) {
          b.attackLanded = true;
          this.damagePlayer(22, bcx);
        }
        if (b.timer <= 0) {
          b.state = 'recover';
          b.timer = 0.35;
          b.cooldown = 0.9;
          this.shake = 0.25;
        }
        break;
      }
      case 'volley': {
        if (b.timer > 0) break;
        b.shotTimer -= dt;
        if (b.shotTimer <= 0 && b.shotsLeft > 0) {
          this.spawnFireball(b, pcx, p.y + p.h / 2);
          b.shotsLeft -= 1;
          b.shotTimer = b.phase >= 3 ? 0.14 : 0.2;
        }
        if (b.shotsLeft <= 0) {
          b.state = 'recover';
          b.timer = 0.45;
          b.cooldown = b.phase >= 3 ? 0.85 : 1.15;
        }
        break;
      }
      case 'novaWind': {
        if (b.timer <= 0) {
          this.spawnShockwaves(b);
          for (let i = 0; i < 10; i++) {
            this.spawnNote(b, (Math.PI * 2 * i) / 10, 220);
          }
          b.state = 'recover';
          b.timer = 0.7;
          b.cooldown = 1.4;
          this.shake = 0.7;
          this.emit({ type: 'bossSlam' });
        }
        break;
      }
      case 'recover': {
        if (b.timer <= 0) b.state = 'chase';
        break;
      }
      default:
        b.state = 'chase';
    }
    b.x = clamp(b.x, 20, WORLD_W - b.w - 20);
  }

  updateSporebound(b, dt) {
    const p = this.player;
    const pcx = p.x + p.w / 2;
    const bcx = b.x + b.w / 2;
    const dist = Math.abs(pcx - bcx);
    const dir = sign(pcx - bcx) || b.facing;
    if (b.timer > 0) b.timer -= dt;
    if (b.cooldown > 0) b.cooldown -= dt;
    b.y = FLOOR_Y - b.h;

    switch (b.state) {
      case 'chase': {
        b.facing = dir;
        if (b.cooldown <= 0) {
          b.pattern = (b.pattern + 1) % 3;
          if (dist < 190) {
            b.state = 'swipeWind';
            b.timer = b.phase >= 3 ? 0.3 : 0.46;
            b.attackLanded = false;
            this.emit({ type: 'bossTelegraph', kind: 'slash' });
          } else if (b.phase >= 2 && b.pattern === 2) {
            b.state = 'summonWind';
            b.timer = 0.62;
            this.emit({ type: 'bossTelegraph', kind: 'summon' });
          } else {
            b.state = 'volleyWind';
            b.timer = b.phase >= 3 ? 0.4 : 0.58;
            this.emit({ type: 'bossTelegraph', kind: 'volley' });
          }
        } else {
          const spd = 40 + b.phase * 16;
          if (dist > 90) b.x += dir * spd * dt;
        }
        break;
      }
      case 'swipeWind': {
        b.facing = dir;
        if (b.timer <= 0) {
          b.state = 'swipe';
          b.timer = 0.18;
          b.attackLanded = false;
          this.emit({ type: 'bossSlash' });
          this.shake = Math.max(this.shake, 0.22);
        }
        break;
      }
      case 'swipe': {
        if (!b.attackLanded) {
          const hb = {
            x: b.facing > 0 ? b.x + b.w - 10 : b.x - 152,
            y: b.y + 14,
            w: 162,
            h: b.h - 10,
          };
          if (rectHitsRect(hb, p)) {
            b.attackLanded = true;
            this.damagePlayer(18 + b.phase * 4, bcx);
          }
        }
        if (b.timer <= 0) {
          b.state = 'recover';
          b.timer = 0.5;
          b.cooldown = Math.max(0.7, 1.35 - b.phase * 0.14);
        }
        break;
      }
      case 'volleyWind': {
        if (b.timer <= 0) {
          this.spawnSporeVolley(b, b.phase >= 3 ? 7 : 5, 0.9, 220 + b.phase * 30);
          b.state = 'recover';
          b.timer = 0.55;
          b.cooldown = Math.max(0.65, 1.4 - b.phase * 0.16);
        }
        break;
      }
      case 'summonWind': {
        if (b.timer <= 0) {
          for (let i = 0; i < 2; i++) {
            const child = this.spawnEnemy({
              type: 'sporeling',
              x: clamp(b.x + b.w / 2 + (i === 0 ? -110 : 110), 40, WORLD_W - 80),
              minX: 40,
              maxX: WORLD_W - 80,
            });
            child.y = FLOOR_Y - child.h;
            child.vy = -260;
            this.burst(child.x + child.w / 2, FLOOR_Y - 8, 9, '#b07be8', 150);
          }
          this.emit({ type: 'bossSummon', kind: 'sporeling' });
          b.state = 'recover';
          b.timer = 0.6;
          b.cooldown = 1.5;
        }
        break;
      }
      case 'recover': {
        if (b.timer <= 0) b.state = 'chase';
        break;
      }
      default:
        b.state = 'chase';
    }
    b.x = clamp(b.x, 40, WORLD_W - b.w - 40);
  }

  updateRoot(b, dt) {
    const p = this.player;
    const pcx = p.x + p.w / 2;
    const bcx = b.x + b.w / 2;
    const dist = Math.abs(pcx - bcx);
    const dir = sign(pcx - bcx) || b.facing;
    if (b.timer > 0) b.timer -= dt;
    if (b.cooldown > 0) b.cooldown -= dt;
    b.y = FLOOR_Y - b.h;
    b.facing = dir;

    switch (b.state) {
      case 'chase': {
        const sway = Math.sin(this.time * 1.1) * 26;
        b.x += (b.homeX + sway - b.x) * Math.min(1, dt * 1.6);
        if (b.cooldown <= 0) {
          b.pattern = (b.pattern + 1) % 2;
          if (dist < 230 || b.pattern === 0) {
            b.state = 'sweepWind';
            b.timer = b.phase >= 2 ? 0.46 : 0.64;
            b.attackLanded = false;
            this.emit({ type: 'bossTelegraph', kind: 'sweep' });
          } else {
            b.state = 'volleyWind';
            b.timer = 0.55;
            this.emit({ type: 'bossTelegraph', kind: 'volley' });
          }
        }
        break;
      }
      case 'sweepWind': {
        if (b.timer <= 0) {
          b.state = 'sweep';
          b.timer = 0.3;
          b.attackLanded = false;
          this.emit({ type: 'bossSlam' });
          this.shake = Math.max(this.shake, 0.3);
        }
        break;
      }
      case 'sweep': {
        if (!b.attackLanded) {
          const hb = { x: b.x - 210, y: FLOOR_Y - 78, w: b.w + 420, h: 78 };
          if (rectHitsRect(hb, p)) {
            b.attackLanded = true;
            this.damagePlayer(b.phase >= 2 ? 24 : 17, bcx);
          }
        }
        if (b.timer <= 0) {
          b.state = 'recover';
          b.timer = 0.72;
          b.cooldown = b.phase >= 2 ? 1.15 : 1.7;
          if (b.phase >= 2) this.spawnShockwaves(b);
        }
        break;
      }
      case 'volleyWind': {
        if (b.timer <= 0) {
          this.spawnSporeRing(b, b.phase >= 2 ? 10 : 7, 190);
          b.state = 'recover';
          b.timer = 0.62;
          b.cooldown = 1.5;
        }
        break;
      }
      case 'recover': {
        if (b.timer <= 0) b.state = 'chase';
        break;
      }
      default:
        b.state = 'chase';
    }
  }

  updateEchoBoss(b, dt) {
    const p = this.player;
    const pcx = p.x + p.w / 2;
    const bcx = b.x + b.w / 2;
    const dist = Math.abs(pcx - bcx);
    const dir = sign(pcx - bcx) || b.facing;
    const chapter = b.chapter || 0;
    if (b.timer > 0) b.timer -= dt;
    if (b.cooldown > 0) b.cooldown -= dt;
    if (!b.flying) b.y = FLOOR_Y - b.h;
    b.facing = dir;

    switch (b.state) {
      case 'idle':
      case 'chase': {
        if (b.flying) {
          const targetY = 150 + Math.sin(this.time * 1.5) * 36;
          b.y += (targetY - b.y) * Math.min(1, dt * 1.8);
        }
        if (dist > 150) {
          const speed = (82 + chapter * 4) * (b.phase >= 2 ? 1.2 : 1);
          b.x += dir * speed * dt;
        }
        if (b.cooldown <= 0) {
          const pattern = b.patternType || 'slam';
          if (pattern === 'slam') {
            b.state = 'echoSlamWind';
            b.timer = b.phase >= 2 ? 0.5 : 0.68;
            this.emit({ type: 'bossTelegraph', kind: 'slam' });
          } else if (pattern === 'volley') {
            b.state = 'echoVolleyWind';
            b.timer = 0.5;
            this.emit({ type: 'bossTelegraph', kind: 'volley' });
          } else if (pattern === 'ring') {
            b.state = 'echoRingWind';
            b.timer = 0.55;
            this.emit({ type: 'bossTelegraph', kind: 'ring' });
          } else if (pattern === 'charge') {
            b.state = 'echoChargeWind';
            b.timer = 0.58;
            b.targetX = clamp(pcx, 80, WORLD_W - 80);
            this.emit({ type: 'bossTelegraph', kind: 'charge' });
          } else if (pattern === 'summon') {
            b.state = 'echoSummonWind';
            b.timer = 0.72;
            this.emit({ type: 'bossTelegraph', kind: 'summon' });
          } else {
            b.state = 'echoRainWind';
            b.timer = 0.72;
            this.emit({ type: 'bossTelegraph', kind: 'rain' });
          }
          b.attackLanded = false;
        }
        break;
      }
      case 'echoSlamWind': {
        b.vx = 0;
        if (b.timer <= 0) {
          b.state = 'echoSlam';
          b.timer = 0.3;
          this.spawnShockwaves(b);
          this.shake = Math.max(this.shake, 0.45);
          this.emit({ type: 'bossSlam' });
          if (dist < 220 && Math.abs(p.y + p.h - (b.y + b.h)) < 120) {
            this.damagePlayer(16 + chapter * 2 + (b.phase >= 2 ? 6 : 0), bcx);
          }
        }
        break;
      }
      case 'echoSlam': {
        if (b.timer <= 0) {
          b.state = 'recover';
          b.timer = 0.7;
          b.cooldown = Math.max(0.8, 2.2 - b.phase * 0.25 - chapter * 0.04);
        }
        break;
      }
      case 'echoVolleyWind': {
        b.vx = 0;
        if (b.timer <= 0) {
          const count = b.phase >= 3 ? 7 : b.phase >= 2 ? 5 : 3;
          for (let i = 0; i < count; i++) {
            this.spawnFireball(
              b,
              p.x + p.w / 2 + (i - (count - 1) / 2) * 74,
              p.y + p.h * 0.6,
            );
          }
          b.state = 'recover';
          b.timer = 0.65;
          b.cooldown = 1.7;
          this.shake = Math.max(this.shake, 0.2);
        }
        break;
      }
      case 'echoRingWind': {
        b.vx = 0;
        if (b.timer <= 0) {
          this.spawnEchoRing(b, b.phase >= 3 ? 16 : b.phase >= 2 ? 12 : 9, 220);
          b.state = 'recover';
          b.timer = 0.7;
          b.cooldown = 2.0;
        }
        break;
      }
      case 'echoChargeWind': {
        b.vx = 0;
        if (b.timer <= 0) {
          b.state = 'echoCharge';
          b.timer = 0.42;
          b.vx = dir * (420 + chapter * 12);
          this.emit({ type: 'bossCharge' });
        }
        break;
      }
      case 'echoCharge': {
        b.x += b.vx * dt;
        if (!b.attackLanded && Math.abs(pcx - (b.x + b.w / 2)) < b.w * 0.6 && Math.abs(p.y + p.h - (b.y + b.h)) < 120) {
          b.attackLanded = true;
          this.damagePlayer(18 + chapter * 2, bcx);
        }
        if (b.timer <= 0 || b.x < 40 || b.x + b.w > WORLD_W - 40) {
          b.state = 'recover';
          b.timer = 0.8;
          b.cooldown = 1.8;
          b.vx = 0;
          this.shake = Math.max(this.shake, 0.3);
        }
        break;
      }
      case 'echoSummonWind': {
        b.vx = 0;
        if (b.timer <= 0) {
          this.spawnEchoMinions(b, b.phase >= 2 ? 3 : 2);
          b.state = 'recover';
          b.timer = 0.8;
          b.cooldown = 2.4;
        }
        break;
      }
      case 'echoRainWind': {
        b.vx = 0;
        if (b.timer <= 0) {
          const count = b.phase >= 2 ? 7 : 4;
          for (let i = 0; i < count; i++) {
            const x = clamp(pcx + rand(-220, 220), 60, WORLD_W - 60);
            this.spawnEnemyProjectile({
              owner: 'boss',
              type: 'fireball',
              x,
              y: -20 - i * 26,
              vx: rand(-20, 20),
              vy: 260 + i * 16,
              r: 12,
              dmg: 14 + chapter * 2,
              life: 4,
            });
          }
          b.state = 'recover';
          b.timer = 0.75;
          b.cooldown = 2.1;
          this.emit({ type: 'bossRain' });
        }
        break;
      }
      case 'recover': {
        b.vx = 0;
        if (b.timer <= 0) b.state = 'chase';
        break;
      }
      default:
        b.state = 'chase';
    }
    b.x = clamp(b.x, 40, WORLD_W - b.w - 40);
  }

  spawnEchoRing(b, count, speed) {
    const sx = b.x + b.w / 2;
    const sy = b.y + b.h * 0.45;
    const color = b.phase >= 2 ? '#ff9a5c' : '#ffd08a';
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (b.phase >= 2 ? this.time * 0.4 : 0);
      this.spawnEnemyProjectile({
        owner: 'boss',
        type: 'echoBolt',
        color,
        x: sx,
        y: sy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 9,
        dmg: 10 + (b.chapter || 0) * 2,
        life: 4,
      });
    }
    this.shake = Math.max(this.shake, 0.25);
  }

  spawnEchoMinions(b, count) {
    const chapter = b.chapter || 0;
    const baseType = `echo_${chapter + 1}_1`;
    for (let i = 0; i < count; i++) {
      const x = clamp(b.x + (i - (count - 1) / 2) * 90, 60, WORLD_W - 100);
      const child = this.spawnEnemy({ type: baseType, variant: 'young', x, minX: 40, maxX: WORLD_W - 80 });
      child.y = FLOOR_Y - child.h;
      this.burst(x, FLOOR_Y - 10, 10, '#e0b45f', 160);
    }
    this.emit({ type: 'bossSummon', kind: baseType });
  }

  spawnSporeAt(x, y, vx, vy, dmg = 9) {
    this.projectiles.push({
      id: `spore_${this.time}_${Math.random().toString(36).slice(2, 7)}`,
      owner: 'boss',
      type: 'spore',
      x,
      y,
      vx,
      vy,
      r: 7,
      dmg,
      life: 3.6,
      warmup: 0,
      w: 14,
      h: 14,
    });
    this.emit({ type: 'spore' });
  }

  spawnSporeVolley(b, count, spread, speed) {
    const p = this.player;
    const sx = b.x + b.w / 2;
    const sy = b.y + b.h * 0.4;
    const base = Math.atan2(p.y + p.h / 2 - sy, p.x + p.w / 2 - sx);
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1) - 0.5;
      const angle = base + t * spread;
      this.spawnSporeAt(sx, sy, Math.cos(angle) * speed, Math.sin(angle) * speed, 8 + b.phase * 2);
    }
    this.shake = Math.max(this.shake, 0.16);
  }

  spawnSporeRing(b, count, speed) {
    const sx = b.x + b.w / 2;
    const sy = b.y + b.h * 0.45;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      this.spawnSporeAt(sx, sy, Math.cos(angle) * speed, Math.sin(angle) * speed, 7 + b.phase * 2);
    }
    this.shake = Math.max(this.shake, 0.24);
  }

  spawnSporeCloud(x, y, dmg = 6, life = 2.6, drift = 0) {
    const cloud = {
      id: `cloud_${this.time}_${Math.random().toString(36).slice(2, 7)}`,
      owner: 'boss',
      type: 'sporeCloud',
      x,
      y,
      vx: drift,
      vy: -10,
      r: 46,
      dmg,
      life,
      warmup: 0,
      w: 92,
      h: 92,
    };
    this.projectiles.push(cloud);
    return cloud;
  }

  spawnFireball(b, tx, ty) {
    const sx = b.x + b.w / 2 + (b.facing > 0 ? 34 : -34);
    const sy = b.y + b.h * 0.55;
    const ang = Math.atan2(ty - sy, tx - sx);
    const speed = b.phase === 2 ? 340 : 280;
    this.projectiles.push({
      id: `fire_${this.time}_${Math.random().toString(36).slice(2, 6)}`,
      owner: 'boss',
      type: 'fireball',
      x: sx,
      y: sy,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      r: 13,
      dmg: b.phase === 2 ? 18 : 14,
      life: 3.4,
      warmup: 0,
    });
    this.emit({ type: 'fireball' });
  }

  spawnEnemyProjectile(opts) {
    const pr = {
      id: `dbg_${this.time}_${this.projectiles.length}`,
      owner: 'boss',
      type: 'fireball',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 13,
      dmg: 14,
      life: 2,
      warmup: 0,
      ...opts,
      w: (opts.r ?? 13) * 2,
      h: (opts.r ?? 13) * 2,
    };
    this.projectiles.push(pr);
    return pr;
  }

  finishBoss() {
    const b = this.boss;
    if (!b) return;
    const info = ALL_BOSS_INFO[b.kind];
    const room = this.roomIndex;
    const next = primaryGateDef(ALL_ROOMS[room])?.next ?? (room + 1 < ALL_ROOMS.length ? room + 1 : null);
    this.bossDefeated[room] = true;
    this.boss = null;
    this.projectiles = [];
    this.emitBossDialogue(b, 'defeat');
    if (info?.reward === 'victory') {
      this.state = 'victory';
      this.deathTimer = 0;
      this.emit({ type: 'victory' });
      if (room >= 14) this.emit({ type: 'campaignComplete', room, chapter: Math.floor((room - 14) / 10) });
    } else if (info?.reward === 'flask') {
      const p = this.player;
      p.maxFlasks += 1;
      p.flasks = p.maxFlasks;
      this.state = 'playing';
      this.emit({ type: 'flaskReward', charges: p.maxFlasks, item: 'mycelial-flask' });
      this.burst(p.x + p.w / 2, p.y + p.h / 2, 22, '#b07be8', 200);
    } else {
      this.awaitingBlessing = true;
      this.blessingChoices = BLESSINGS.map((x) => ({ ...x }));
      this.state = 'blessing';
      this.emit({ type: 'blessingOpen' });
    }
    const reward = info?.ashReward ?? 60;
    this.ash += reward;
    this.emit({ type: 'ashGain', amount: reward, total: this.ash });
    const echoReward = Math.round((info?.echoReward || 0) * (DIFFICULTY_BY_ID[this.difficulty]?.reward || 1) * expansionModifierTotals(this.modifiers).echo * (this.echoBonus || 1));
    if (echoReward > 0) {
      this.echoes = (this.echoes || 0) + echoReward;
      this.emit({ type: 'echoGain', amount: echoReward, total: this.echoes });
    }
    this.emit({
      type: 'bossDown', room, kind: b.kind, name: b.name, next, reward: info?.reward,
      chapter: info?.chapter ?? null, mini: !!info?.mini, echoes: echoReward,
    });
    this.shake = 0.9;
  }

  chooseBlessing(index) {
    if (this.state !== 'blessing' || !this.blessingChoices) return false;
    const choice = this.blessingChoices[index];
    if (!choice) return false;
    const p = this.player;
    if (choice.id === 'iron') {
      p.maxHp += 40;
      p.hp = p.maxHp;
    } else if (choice.id === 'ember') {
      p.damageMult *= 1.3;
    } else if (choice.id === 'wind') {
      p.dashCooldownMax *= 0.65;
      p.dashIframes += 0.08;
    }
    this.blessings.push(choice.id);
    this.awaitingBlessing = false;
    this.blessingChoices = null;
    this.state = 'playing';
    this.emit({ type: 'blessingChosen', id: choice.id, name: choice.name });
    this.burst(p.x + p.w / 2, p.y + p.h / 2, 18, '#ffe2a8', 180);
    return true;
  }

  // ── projectiles, contacts, relics, gates ─────────────────────────────────
  updateProjectiles(dt) {
    const p = this.player;
    for (const pr of this.projectiles) {
      if (pr.dead) continue;
      pr.life -= dt;
      if (pr.type === 'pillar' || pr.type === 'beam') {
        if (pr.warmup > 0) pr.warmup -= dt;
      } else {
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;
        if (pr.type === 'bomb') {
          pr.vy += 620 * dt;
          if (pr.y >= FLOOR_Y - pr.r * 0.4) {
            pr.y = FLOOR_Y - pr.r * 0.4;
            this.explodeBomb(pr);
            pr.dead = true;
            continue;
          }
        }
        if (pr.type === 'shockwave') {
          if (Math.random() < 0.7) {
            this.spawnFx('dust', pr.x + rand(0, pr.w), FLOOR_Y - 4, {
              vx: -pr.vx * 0.1,
              vy: rand(-70, -20),
              life: 0.3,
              size: rand(2, 5),
              color: '#b57a4a',
            });
          }
        }
        if (pr.type === 'fireball' && Math.random() < 0.6) {
          this.spawnFx('spark', pr.x, pr.y, {
            vx: rand(-30, 30),
            vy: rand(-30, 30),
            life: 0.25,
            size: rand(2, 4),
            color: '#ff9d55',
          });
        }
        if ((pr.type === 'spore' || pr.type === 'sporeCloud') && Math.random() < 0.5) {
          this.spawnFx('spark', pr.x + rand(-pr.r * 0.5, pr.r * 0.5), pr.y + rand(-pr.r * 0.5, pr.r * 0.5), {
            vx: rand(-18, 18),
            vy: rand(-26, -4),
            life: rand(0.4, 0.9),
            size: rand(2, 5),
            color: '#c9a0f0',
          });
        }
      }
      if (pr.x < -80 || pr.x > WORLD_W + 80 || (pr.life <= 0)) {
        if (pr.type === 'bomb') this.explodeBomb(pr);
        pr.dead = true;
        continue;
      }
      if (pr.owner === 'player' && pr.life > 0) {
        const mult = p.damageMult * (p.damageBuff || 1);
        const box = { x: pr.x - pr.r, y: pr.y - pr.r, w: pr.r * 2, h: pr.r * 2 };
        for (const e of this.enemies) {
          if (e.dead || e.burrowed || pr.dead) continue;
          if (rectHitsRect(box, e)) {
            if (pr.pierce) {
              pr.hitIds = pr.hitIds || [];
              if (pr.hitIds.includes(e.id)) continue;
              pr.hitIds.push(e.id);
            } else {
              pr.dead = true;
            }
            this.hurtEnemy(e, { dmg: pr.dmg, knock: 120, name: pr.type }, sign(pr.vx) || p.facing);
            if (pr.snare) e.snared = Math.max(e.snared || 0, pr.snare);
            if (pr.type === 'bomb') this.explodeBomb(pr);
            this.burst(pr.x, pr.y, 7, '#d8c08a', 130);
          }
        }
        const b = this.boss;
        if (!pr.dead && b && !b.dying && rectHitsRect(box, b)) {
          if (pr.pierce) {
            pr.hitIds = pr.hitIds || [];
            if (!pr.hitIds.includes('boss')) {
              pr.hitIds.push('boss');
              this.hurtBoss(pr.dmg * mult, 90, sign(pr.vx) || p.facing, false);
              if (pr.type === 'bomb') this.explodeBomb(pr);
              this.burst(pr.x, pr.y, 8, '#d8c08a', 140);
            }
          } else {
            pr.dead = true;
            this.hurtBoss(pr.dmg * mult, 90, sign(pr.vx) || p.facing, false);
            if (pr.type === 'bomb') this.explodeBomb(pr);
            this.burst(pr.x, pr.y, 8, '#d8c08a', 140);
          }
        }
        const wall = this.activeWall();
        if (!pr.dead && wall && rectHitsRect(box, wall)) {
          if (pr.pierce) {
            pr.hitIds = pr.hitIds || [];
            if (!pr.hitIds.includes('wall')) {
              pr.hitIds.push('wall');
              this.damageWall(pr.dmg * mult);
            }
          } else {
            pr.dead = true;
            this.damageWall(pr.dmg * mult);
          }
          if (pr.type === 'bomb') this.explodeBomb(pr);
        }
      }
      if (pr.owner === 'boss' && pr.life > 0) {
        const box = pr.type === 'pillar' || pr.type === 'beam' || pr.type === 'shockwave'
          ? { x: pr.x, y: pr.y, w: pr.w, h: pr.h }
          : { x: pr.x - pr.r, y: pr.y - pr.r, w: pr.r * 2, h: pr.r * 2 };
        if (pr.warmup > 0) continue;
        if (rectHitsRect(box, p)) {
          if (this.damagePlayer(pr.dmg, pr.x + (pr.w || 0) / 2)) {
            if (pr.type === 'fireball') pr.dead = true;
            this.burst(pr.x, pr.y, 10, '#ff9d55', 170);
          }
        }
      }
    }
    this.projectiles = this.projectiles.filter((pr) => !pr.dead);
  }

  checkContacts() {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead || e.burrowed) continue;
      if (rectHitsRect(e, p)) {
        const dmg = e.type === 'sentinel' && e.state === 'lunge'
          ? 18
          : e.type === 'brute' && e.state === 'slam'
            ? 24
            : e.dmg;
        this.damagePlayer(dmg, e.x + e.w / 2);
      }
    }
    const b = this.boss;
    if (b && !b.dying && b.intro <= 0 && rectHitsRect(b, p)) {
      const heavyHit =
        (b.kind === 'wyrm' && b.state === 'dive') ||
        (b.kind === 'oathbreaker' && b.state === 'dash');
      this.damagePlayer(heavyHit ? 24 : b.contact, b.x + b.w / 2);
    }
  }

  updateRelic() {
    const relic = this.room.relic;
    if (!relic || this.player.relic) return;
    const p = this.player;
    if (rectHitsRect(relic, p)) {
      this.player.relic = true;
      this.player.maxFlasks = 3;
      this.emit({ type: 'relic', name: relic.name });
      this.burst(relic.x + relic.w / 2, relic.y + relic.h / 2, 26, '#ffd98a', 230);
      this.shake = 0.3;
    }
  }

  updateCollectibles() {
    const list = this.room?.collectibles;
    if (!Array.isArray(list) || !list.length) return;
    const p = this.player;
    for (const item of list) {
      if (this.collected[item.id] || this.knownCollectibles.has(item.id)) continue;
      if (!rectHitsRect(item, p)) continue;
      this.collected[item.id] = true;
      this.knownCollectibles.add(item.id);
      const echo = 6 + (this.room.chapterIndex || 0) * 3;
      this.echoes = (this.echoes || 0) + echo;
      this.emit({
        type: 'collectible',
        id: item.id,
        name: item.name,
        category: item.category,
        categoryName: item.categoryName,
        echo,
      });
      this.emit({ type: 'echoGain', amount: echo, total: this.echoes });
      this.burst(item.x + item.w / 2, item.y + item.h / 2, 18, item.color || '#ffe2a8', 190);
      this.shake = Math.max(this.shake, 0.16);
    }
  }

  updateHazards(dt) {
    const hazards = this.room?.hazards;
    if (!Array.isArray(hazards) || !hazards.length) return;
    this.hazardTime = (this.hazardTime || 0) + dt;
    const p = this.player;
    hazards.forEach((hazard, index) => {
      const state = this.hazardState[index] || (this.hazardState[index] = {
        timer: hazard.phase || 0,
        active: false,
        hit: false,
        x: hazard.x || 0,
      });
      if (hazard.type === 'wind') {
        if (rectHitsRect(hazard, p)) {
          p.x = clamp(p.x + (hazard.force || 0) * dt * 0.55, 0, WORLD_W - p.w);
          if (Math.random() < dt * 6) {
            this.spawnFx('spark', p.x + rand(0, p.w), p.y + rand(0, p.h), {
              vx: (hazard.force || 0) * 0.7,
              vy: rand(-20, 20),
              life: rand(0.2, 0.4),
              size: rand(1, 3),
              color: '#d8c8a8',
            });
          }
        }
        return;
      }
      if (hazard.type === 'fog') return;
      if (hazard.type === 'saw') {
        const range = Math.max(80, hazard.range || 320);
        state.x = (hazard.originX ?? hazard.x ?? 500) + Math.sin(this.hazardTime * ((hazard.speed || 120) / 90)) * (range / 2 - 30);
        const blade = { x: state.x, y: hazard.y, w: hazard.w, h: hazard.h };
        if (rectHitsRect(blade, p)) this.damagePlayer(hazard.dmg || 16, state.x + blade.w / 2);
        return;
      }
      state.timer += dt;
      const period = hazard.period || 3.2;
      const cycle = state.timer % period;
      const active = cycle < (hazard.type === 'spore' ? period * 0.62 : 0.62);
      if (active && !state.active) state.hit = false;
      state.active = active;
      if (!active || state.hit) return;
      if (!rectHitsRect(hazard, p)) return;
      state.hit = true;
      this.damagePlayer(hazard.dmg || 12, hazard.x + hazard.w / 2);
      this.shake = Math.max(this.shake, 0.18);
    });
  }

  updateGate() {
    if ((this.gateLock || 0) > 0) return;
    const p = this.player;
    for (const g of this.gates) {
      if (!g.open) continue;
      if (p.x + p.w > g.x + 6 && p.x < g.x + g.w + 20) {
        const next = g.next;
        if (next != null && next !== this.roomIndex && ALL_ROOMS[next]) {
          this.emit({ type: 'gatePass', from: this.roomIndex, to: next, secret: !!g.secret });
          this.loadRoom(next);
          this.gateLock = 0.6;
        }
        return;
      }
    }
  }

  cleanup() {
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.fx = this.fx.filter((f) => f.life > 0);
  }

  updateFx(dt) {
    for (const f of this.fx) {
      f.life -= dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.type === 'spark') f.vy += 900 * dt;
      if (f.type === 'dust') f.vy += 120 * dt;
      if (f.type === 'dash') {
        f.vx *= 0.92;
        f.vy *= 0.92;
      }
    }
    this.fx = this.fx.filter((f) => f.life > 0);
    if (this.state === 'dead' || this.state === 'victory') this.deathTimer += dt;
  }

  // ── HUD helpers ──────────────────────────────────────────────────────────
  get hud() {
    const p = this.player;
    const b = this.boss;
    return {
      hp: Math.max(0, Math.round(p.hp)),
      maxHp: p.maxHp,
      flasks: p.flasks,
      relic: p.relic,
      roomIndex: this.roomIndex,
      roomName: this.room.name,
      boss: b
        ? {
            name: b.name,
            title: b.title,
            hp: Math.max(0, b.hp),
            maxHp: b.maxHp,
            phase: b.phase,
          }
        : null,
      gate: this.gate,
      hint: this.room.hint,
      blessings: [...this.blessings],
      state: this.state,
    };
  }
}

export { ATTACKS, BLESSINGS, BOSS_INFO };
