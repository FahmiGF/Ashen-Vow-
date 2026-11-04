// Ashen Vow v0.0.6 — deterministic 2D combat simulation.
// Pure logic: no DOM, no canvas, no audio. Runs identically in Node and the browser.

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
    glyph: '⚔',
    desc: 'Ksatria terakhir Opus. Seimbang dalam serangan dan pertahanan, dengan dash yang paling ringan.',
    maxHp: 100,
    speed: 1,
    damage: 1,
    dash: 1,
    build: 1,
    appearance: { race: 'human', skin: '#c98f6a', outfit: '#6d2323', armor: 'medieval' },
  },
  karn: {
    id: 'karn',
    name: 'Karn of the Ash',
    title: 'The Broken Vow',
    glyph: '⛨',
    desc: 'Prajurit yang bangkit dari tumpukan mayat. Lebih tebal dan keras, tetapi sedikit lebih lambat.',
    maxHp: 125,
    speed: 0.93,
    damage: 1.08,
    dash: 0.9,
    build: 1.08,
    appearance: { race: 'orc', skin: '#7f8f5c', outfit: '#3b4a2f', armor: 'tribal' },
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
  },
  {
    id: 'bow',
    name: 'Busur Abu',
    desc: 'Senjata jarak jauh. Menembak anak panah; amunisi terbatas.',
    cost: 55,
    type: 'weapon',
  },
  {
    id: 'shuriken',
    name: 'Shuriken ×3',
    desc: 'Konsumabel. Tekan C untuk melempar. Damage ringan, cepat.',
    cost: 14,
    type: 'consumable',
  },
  {
    id: 'arrows',
    name: 'Anak Panah ×6',
    desc: 'Amunisi Busur Abu. Hanya bisa dibeli setelah memiliki busur.',
    cost: 12,
    type: 'ammo',
  },
  {
    id: 'flask',
    name: 'Isi Ulang Flask',
    desc: 'Mengembalikan semua charge flask.',
    cost: 10,
    type: 'flask',
  },
];

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
    gate: { x: 1362, y: 286, w: 34, h: 184, requires: 'boss' },
    hint: 'Sir Mordrake, Penjaga yang Gugur, menanti di tengah bara.',
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
];

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
};

export const CODEX = {
  enemies: Object.values(ENEMY_INFO).map((enemy, i) => ({
    id: `enemy-${i}`,
    name: enemy.name,
    subtitle: enemy.title,
    glyph: ['◈', '⛨', '◌', '⬢'][i] || '◈',
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
    glyph: { warden: '♜', wyrm: 'ϟ', choir: '♱', oathbreaker: '✠' }[kind] || '♜',
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
      subtitle: { weapon: 'Senjata', consumable: 'Konsumabel', ammo: 'Amunisi', flask: 'Bekal' }[item.type] || 'Barang',
      glyph: { pike: '⟋', bow: '➶', shuriken: '✦', arrows: '➳', flask: '✚' }[item.id] || '✦',
      danger: `✦ ${item.cost}`,
      desc: item.desc,
      meta: [['TIPE', item.type.toUpperCase()], ['HARGA', `${item.cost} ABU`], ['SUMBER', 'WARUNG ABU']],
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
      hitFlash: 0,
      pitGrace: false,
      weapon: 'sword',
      weapons: ['sword'],
      arrows: 0,
      shurikens: 0,
      consumeCooldown: 0,
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
  loadRoom(index, initial = false) {
    const room = ROOMS[index];
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
    this.shake = 0;

    for (const def of room.enemies) this.spawnEnemy(def);

    if (room.boss && !this.bossDefeated[index]) {
      this.spawnBoss(room.boss);
    }
    this.emit({ type: 'roomEnter', room: index, name: room.name, subtitle: room.subtitle });
    if (this.checkpoint) {
      this.emit({ type: 'checkpoint', room: index, name: this.checkpoint.name });
    }
  }

  enterRoom(index) {
    this.state = 'playing';
    this.loadRoom(index);
  }

  spawnEnemy(def) {
    const base = {
      id: `e${this.enemies.length}_${Math.floor(this.time * 1000)}`,
      type: def.type,
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
    };
    const info = ENEMY_INFO[def.type] || ENEMY_INFO.crawler;
    const e = {
      ...base,
      w: info.w,
      h: info.h,
      hp: info.hp,
      maxHp: info.hp,
      dmg: info.dmg,
      speed: info.speed,
      flying: def.type === 'wraith',
      castCooldown: 0.8,
    };
    e.y = e.flying ? FLOOR_Y - 148 : FLOOR_Y - e.h;
    this.enemies.push(e);
  }

  spawnBoss(kind) {
    const info = BOSS_INFO[kind];
    const spawn = info.spawn || { x: 760, y: FLOOR_Y - info.h };
    const b = {
      kind,
      name: info.name,
      title: info.title,
      x: spawn.x,
      y: spawn.y,
      w: info.w,
      h: info.h,
      vx: 0,
      vy: 0,
      maxHp: info.maxHp,
      hp: info.maxHp,
      contact: info.contact,
      facing: -1,
      phase: 1,
      maxPhases: info.maxPhases || 2,
      phaseThresholds: info.phaseThresholds || [0.5],
      flying: !!info.flying,
      state: 'idle',
      timer: 0,
      cooldown: 1.2,
      hitFlash: 0,
      invuln: 0,
      attackLanded: false,
      pattern: 0,
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
  }

  emitBossDialogue(b, phaseKey) {
    const info = BOSS_INFO[b.kind];
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

  get gate() {
    const g = this.room.gate;
    if (!g) return null;
    const requires = g.requires;
    let open = false;
    let reason = '';
    if (requires === 'clear') {
      open = this.enemies.length === 0;
      reason = open ? '' : `Sisa abu: ${this.enemies.length}. Bersihkan dulu.`;
    } else if (requires === 'relic') {
      open = this.player.relic;
      reason = open ? '' : 'Segel kuno. Butuh Relik Bulu Bara.';
    } else if (requires === 'boss') {
      open = !!this.bossDefeated[this.roomIndex] && !this.awaitingBlessing;
      const bossName = this.room.boss ? BOSS_INFO[this.room.boss]?.name : 'Penjaga Agung';
      reason = open ? '' : this.awaitingBlessing ? 'Pilih berkahmu dahulu.' : `Kalahkan ${bossName}.`;
    }
    return { ...g, open, reason };
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
        this.shake = Math.max(0, this.shake - dt * 2.2);
        this.updatePlayer(dt, input, pressed);
        this.updateEnemies(dt);
        this.updateBoss(dt);
        this.updateProjectiles(dt);
        this.checkContacts();
        this.updateRelic();
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

    if (p.healing > 0) {
      p.healing -= dt;
      p.vx *= Math.pow(0.001, dt);
      if (p.healing <= 0) {
        p.flasks -= 1;
        p.hp = Math.min(p.maxHp, p.hp + 38);
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
    if (
      pressed('consume') &&
      p.consumeCooldown <= 0 &&
      !p.attack &&
      p.dashTimer <= 0 &&
      p.healing <= 0
    ) {
      this.throwConsumable();
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

    // integrate
    const wasGround = p.onGround;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 0, WORLD_W - p.w);
    const prevBottom = p.y + p.h;
    p.vy += GRAVITY * dt;
    p.y += p.vy * dt;

    p.onGround = false;
    for (const plat of this.room.platforms) {
      if (p.x + p.w <= plat.x || p.x >= plat.x + plat.w) continue;
      if (p.vy >= 0 && prevBottom <= plat.y + 4 && p.y + p.h >= plat.y) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.onGround = true;
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
    if (p.weapon === 'pike') return PIKE_ATTACK;
    if (p.weapon === 'bow') return BOW_ATTACK;
    return ATTACKS[p.attack ? p.attack.combo : 0];
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
        if (e.dead || a.hitIds.includes(e.id)) continue;
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
        this.hurtBoss(def.dmg * p.damageMult, def.knock, p.facing, def.name !== 'slash');
      }
      // cut down fireballs
      for (const pr of this.projectiles) {
        if (pr.owner !== 'boss' || pr.type !== 'fireball') continue;
        if (a.hitIds.includes(pr.id)) continue;
        if (rectHitsRect(hb, { x: pr.x - pr.r, y: pr.y - pr.r, w: pr.r * 2, h: pr.r * 2 })) {
          a.hitIds.push(pr.id);
          pr.dead = true;
          this.burst(pr.x, pr.y, 8, '#ffb066', 120);
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

  throwConsumable() {
    const p = this.player;
    if (p.shurikens <= 0) {
      this.emit({ type: 'noAmmo', kind: 'shuriken' });
      return false;
    }
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
    return true;
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
    } else if (item.id === 'shuriken') {
      p.shurikens += 3;
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
    const p = this.player;
    e.hp -= def.dmg * p.damageMult;
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
      const reward = ENEMY_INFO[e.type]?.reward ?? 8;
      this.ash += reward;
      this.burst(e.x + e.w / 2, e.y + e.h / 2, 16, '#c96a3a', 220);
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
      const pcx = p.x + p.w / 2;
      const ecx = e.x + e.w / 2;
      const distX = pcx - ecx;
      const dy = p.y + p.h - (e.y + e.h);
      const aggroRange = e.type === 'sentinel' || e.type === 'wraith' ? 720 : 540;
      const aggro = Math.abs(distX) < aggroRange && Math.abs(dy) < (e.flying ? 420 : 300);

      if (e.type === 'wraith') {
        this.updateWraith(e, dt, aggro, distX);
        continue;
      }

      if (e.state === 'hurt') {
        e.vx = 0;
        this.integrateEnemy(e, dt);
        if (e.timer <= 0) e.state = 'patrol';
        continue;
      }

      if (e.type === 'crawler') {
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
      } else if (e.type === 'brute') {
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
      } else if (e.type === 'sentinel') {
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
    const info = BOSS_INFO[b.kind];
    const room = this.roomIndex;
    this.bossDefeated[room] = true;
    this.boss = null;
    this.projectiles = [];
    this.emitBossDialogue(b, 'defeat');
    if (info?.reward === 'victory') {
      this.state = 'victory';
      this.deathTimer = 0;
      this.emit({ type: 'victory' });
    } else {
      this.awaitingBlessing = true;
      this.blessingChoices = BLESSINGS.map((x) => ({ ...x }));
      this.state = 'blessing';
      this.emit({ type: 'blessingOpen' });
    }
    const reward = info?.ashReward ?? 60;
    this.ash += reward;
    this.emit({ type: 'ashGain', amount: reward, total: this.ash });
    this.emit({ type: 'bossDown', room, kind: b.kind, name: b.name });
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
      }
      if (pr.x < -80 || pr.x > WORLD_W + 80 || (pr.life <= 0)) {
        pr.dead = true;
        continue;
      }
      if (pr.owner === 'player' && pr.life > 0) {
        const box = { x: pr.x - pr.r, y: pr.y - pr.r, w: pr.r * 2, h: pr.r * 2 };
        for (const e of this.enemies) {
          if (e.dead || pr.dead) continue;
          if (rectHitsRect(box, e)) {
            pr.dead = true;
            this.hurtEnemy(e, { dmg: pr.dmg, knock: 110, name: pr.type }, sign(pr.vx));
            this.burst(pr.x, pr.y, 7, '#d8c08a', 130);
          }
        }
        const b = this.boss;
        if (!pr.dead && b && !b.dying && rectHitsRect(box, b)) {
          pr.dead = true;
          this.hurtBoss(pr.dmg * p.damageMult, 90, sign(pr.vx), false);
          this.burst(pr.x, pr.y, 8, '#d8c08a', 140);
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
      if (e.dead) continue;
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

  updateGate() {
    const g = this.gate;
    if (!g || !g.open) return;
    const p = this.player;
    if (p.x + p.w > g.x + 6 && p.x < g.x + g.w + 20) {
      const next = this.roomIndex + 1;
      if (next < ROOMS.length) {
        this.emit({ type: 'gatePass', from: this.roomIndex, to: next });
        this.loadRoom(next);
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
