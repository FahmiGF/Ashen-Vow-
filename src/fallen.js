// Ashen Vow v0.13.0 — THE FALLEN ONES (Arc II: Heavenly Descent).
//
// The second arc: after The Oathbreaker falls, the sky opens. This module owns
// the whole arc as data plus deterministic rules, the same way fairy.js and
// fishing.js do, so the Node suite can prove every number without a browser.
//
//   • seven ascending regions (global rooms 426-460) with 20 heavenly mobs,
//     six elites and eleven bosses (seven main, four optional)
//   • six gate abilities, four weapons, three relic sets, twelve boons,
//     six curses of grace, four upgrade tracks and three endings
//   • the arc's combat resources: Radiance meter, Judgment Marks, Shadow
//     Stance and Purity Shields — all pure functions over a run object
//   • the ascended save model under progress.fallen, with Echoes read from the
//     base-game save and a hard cap so the arc never trivialises itself
//
// No DOM, no audio, no timing: the shell decides when to call these.

export const FALLEN_VERSION = 1;
export const FALLEN_ARC_ID = 'fallen';
export const FALLEN_NAME = 'The Fallen Ones';
export const FALLEN_LOCAL_NAME = 'Yang Terjatuh';
export const FALLEN_SUBTITLE = 'Langit membuka gerbangnya. Cahaya datang untuk menghakimi.';
export const FALLEN_PITCH = 'Kau mengalahkan kegelapan. Sekarang cahaya datang untuk menghakimimu.';

export const FALLEN_ROOM_START = 426; // immediately after Faewood's 414-425
export const FALLEN_REGION_COUNT = 7;
export const FALLEN_ROOMS_PER_REGION = 5; // four halls, then the region boss
export const FALLEN_OPTIONAL_COUNT = 4;
export const FALLEN_ROOM_COUNT = FALLEN_REGION_COUNT * FALLEN_ROOMS_PER_REGION + FALLEN_OPTIONAL_COUNT; // 39
export const FALLEN_FLOOR_Y = 470;
export const FALLEN_WORLD_W = 1400;

export const RADIANCE_MAX = 100;
export const RADIANCE_PER_DAMAGE = 0.55;
export const BURST_STUN = 1.8;
export const MARK_WINDOW = 1.4; // seconds of standing still before a mark detonates
export const MARK_MAX = 5;
export const MARK_DAMAGE = 9; // per stack
export const SHADOW_DRAIN = 0.045; // fraction of max HP per second
export const SHADOW_DAMAGE_MUL = 1.35;
export const ECHO_CAP = 5;

const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);
const asInt = (value, fallback = 0) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
};
const round1 = (value) => Math.round((Number(value) || 0) * 10) / 10;

// ── movements ──────────────────────────────────────────────────────────────
// The five story movements. The hub shows the current one and the archive
// records which ones the player has reached.
export const FALLEN_MOVEMENTS = [
  {
    id: 'descent',
    name: 'I. The Descent',
    localName: 'I. Kejatuhan',
    blurb: 'Langit terbuka. Kau ditarik ke atas dan terbangun di pinggiran surga.',
  },
  {
    id: 'gilded',
    name: 'II. The Gilded Ruins',
    localName: 'II. Reruntuhan Berlapis Emas',
    blurb: 'Kontak pertama dengan Paduan Suara, dan Fallen One pertama yang mau berbicara.',
  },
  {
    id: 'choir',
    name: 'III. The Hollow Choir',
    localName: 'III. Paduan Suara Kosong',
    blurb: 'Sejarah terbuka. Faksi terpecah. Kau harus memilih siapa yang kau percaya.',
  },
  {
    id: 'judgment',
    name: 'IV. The Judgment',
    localName: 'IV. Penghakiman',
    blurb: 'Tuan rumah bergerak. Dunia berubah menjadi medan perang.',
  },
  {
    id: 'last_light',
    name: 'V. The Last Light',
    localName: 'V. Cahaya Terakhir',
    blurb: 'Seraphiel menunggumu di Langit Terakhir, dengan topeng yang mulai retak.',
  },
];

// ── abilities ──────────────────────────────────────────────────────────────
export const FALLEN_ABILITIES = [
  {
    id: 'halo_dash',
    name: 'Halo Dash',
    localName: 'Lontar Halo',
    glyph: '◐',
    region: 'gilded_ruins',
    desc: 'Dash yang membelah cahaya. Melewati berkas cahaya tanpa terluka dan memecah Purity Shield.',
    action: 'dash',
  },
  {
    id: 'feather_glide',
    name: 'Feather Glide',
    localName: 'Melayang Bulu',
    glyph: '⌁',
    region: 'cloudspire',
    desc: 'Tahan lompat di udara untuk melayang. Arus angin membawamu, bukan menjatuhkanmu.',
    action: 'glide',
  },
  {
    id: 'resonance_strike',
    name: 'Resonance Strike',
    localName: 'Pukulan Gema',
    glyph: '♪',
    region: 'choir_hollow',
    desc: 'Serangan yang bergetar. Memecah gema musuh dan membungkam Chorister.',
    action: 'attack',
  },
  {
    id: 'gilded_guard',
    name: 'Gilded Guard',
    localName: 'Perisai Emas',
    glyph: '❖',
    region: 'seraph_foundry',
    desc: 'Tahan untuk menyerap panas dan percikan emas cair. Parry membalikkan kerusakan.',
    action: 'parry',
  },
  {
    id: 'reflect_step',
    name: 'Reflect Step',
    localName: 'Langkah Pantul',
    glyph: '◇',
    region: 'mirror_aviary',
    desc: 'Langkah pendek yang memantulkan proyektil kembali ke pemiliknya.',
    action: 'dash',
  },
  {
    id: 'absolution',
    name: 'Absolution',
    localName: 'Pelepasan',
    glyph: '✧',
    region: 'pale_cathedral',
    desc: 'Membersihkan semua Judgment Mark dan memberi satu detik kebal hukum.',
    action: 'cleanse',
  },
];

export const FALLEN_ABILITY_BY_ID = Object.fromEntries(FALLEN_ABILITIES.map((a) => [a.id, a]));

// ── regions ────────────────────────────────────────────────────────────────
const REGION_SOURCE = [
  {
    id: 'gilded_ruins',
    name: 'The Gilded Ruins',
    localName: 'Reruntuhan Berlapis Emas',
    subtitle: 'Shattered golden temples and fallen colonnades',
    theme: 'Kuil emas yang runtuh, sinar cahaya yang membakar atau menyingkap',
    gimmick: 'Berkas cahaya: menghindar di bayangan, atau gunakan untuk melihat jalan.',
    ability: 'halo_dash',
    boss: 'aurelian',
    color: '#e8c46a',
    glow: '#fff4c8',
    fog: '#3a3020',
    particle: 'motes',
    music: 'reliquary',
    glyph: '☼',
    enemies: ['lesser_cherub', 'gilded_husk', 'pale_acolyte', 'radiant_sentinel'],
    hint: 'Pilar-pilar emas menahan langit yang tidak lagi utuh. Setiap bayangan adalah perlindungan.',
    palette: { top: '#1a1408', mid: '#4a3a1c', low: '#8a7038', glow: '#ffe6a0', fog: '#5c4a24' },
  },
  {
    id: 'cloudspire',
    name: 'Cloudspire Steppes',
    localName: 'Padang Menara Awan',
    subtitle: 'Open sky bridges, wind and floating isles',
    theme: 'Jembatan langit terbuka dan pulau-pulau yang mengapung',
    gimmick: 'Arus angin mendorong dan mengangkat. Gunakan untuk melintasi jurang.',
    ability: 'feather_glide',
    boss: 'zephyria',
    color: '#a8d8f0',
    glow: '#f0fbff',
    fog: '#48627a',
    particle: 'wind',
    music: 'stormexpanse',
    glyph: '☁',
    enemies: ['wind_sprite', 'halo_disc', 'lesser_cherub', 'gale_archon'],
    hint: 'Tidak ada tanah di bawah. Hanya awan yang bergerak seperti ombak yang lambat.',
    palette: { top: '#0a1624', mid: '#2f5878', low: '#9cc8e0', glow: '#eafaff', fog: '#5c84a0' },
  },
  {
    id: 'choir_hollow',
    name: 'The Choir Hollow',
    localName: 'Cekungan Paduan Suara',
    subtitle: 'Colossal organ halls and resonant caverns',
    theme: 'Aula organ raksasa; suara adalah senjata',
    gimmick: 'Gelombang suara membuka jalan, memecahkan kristal, dan membungkam musuh.',
    ability: 'resonance_strike',
    boss: 'choir_seven',
    color: '#d8b8ff',
    glow: '#f4e8ff',
    fog: '#3c2a52',
    particle: 'notes',
    music: 'hollowcourt',
    glyph: '♪',
    enemies: ['chorister', 'echo_bell', 'lesser_cherub', 'cantor_of_silence'],
    hint: 'Pipa-pipa organ setinggi menara. Setiap nada punya gigi.',
    palette: { top: '#120a1c', mid: '#33204a', low: '#6a4a8a', glow: '#e8ccff', fog: '#4a3266' },
  },
  {
    id: 'seraph_foundry',
    name: 'Seraph Foundry',
    localName: 'Pengecoran Serafim',
    subtitle: 'Divine forges where holy constructs are built',
    theme: 'Tungku ilahi, emas cair, konveyor',
    gimmick: 'Panas merusak. Berdiri di atas konveyor dan gunakan penutup untuk mendingin.',
    ability: 'gilded_guard',
    boss: 'ophanim_prime',
    color: '#ffb45c',
    glow: '#fff0c0',
    fog: '#4a2a10',
    particle: 'embers',
    music: 'cinderworks',
    glyph: '⚒',
    enemies: ['forge_seraphim', 'lantern_warden', 'gilded_husk', 'gilded_executioner'],
    hint: 'Roda-roda bercahaya dicetak di sini, satu mata pada satu waktu.',
    palette: { top: '#1a0c04', mid: '#4a2410', low: '#8a4a18', glow: '#ffbe6a', fog: '#5c3414' },
  },
  {
    id: 'mirror_aviary',
    name: 'The Mirror Aviary',
    localName: 'Aviari Cermin',
    subtitle: 'Glass gardens, reflective surfaces',
    theme: 'Taman kaca dan pantulan yang hidup',
    gimmick: 'Pantulan melahirkan musuh dan jalan kembar. Hanya tubuh asli punya bayangan.',
    ability: 'reflect_step',
    boss: 'glass_archangel',
    color: '#b8f0e8',
    glow: '#ffffff',
    fog: '#2a4a48',
    particle: 'glass',
    music: 'glassorchard',
    glyph: '◇',
    enemies: ['mirror_twin', 'halo_disc', 'wind_sprite', 'reflecting_judge'],
    hint: 'Setiap cermin menunjukkan kau yang berdiri sedikit terlalu tegak.',
    palette: { top: '#06120f', mid: '#1f4a44', low: '#7ab8b0', glow: '#e8fffb', fog: '#356a64' },
  },
  {
    id: 'pale_cathedral',
    name: 'The Pale Cathedral',
    localName: 'Katedral Pucat',
    subtitle: 'The centre of the host\u2019s authority',
    theme: 'Kursi penghakiman; tanda dan hukuman',
    gimmick: 'Zona penghakiman menandai pemain. Bergerak dan bertindak untuk membatalkan.',
    ability: 'absolution',
    boss: 'sanctus_verdict',
    color: '#f0e8e0',
    glow: '#ffffff',
    fog: '#4a4240',
    particle: 'feathers',
    music: 'lastvigil',
    glyph: '✧',
    enemies: ['pale_acolyte', 'penitent_knight', 'chorister', 'hollow_seraph'],
    hint: 'Bangku-bangku kosong menghadap altar yang mengadili, bukan memberkati.',
    palette: { top: '#141010', mid: '#4a4040', low: '#a89890', glow: '#fff8f0', fog: '#665a54' },
  },
  {
    id: 'last_heaven',
    name: 'The Last Heaven',
    localName: 'Langit Terakhir',
    subtitle: 'Hidden realm above the sky',
    theme: 'Di atas langit, semua mekanik bertemu',
    gimmick: 'Semua mekanik sebelumnya digabung. Tidak ada kemampuan baru — hanya penguasaan.',
    ability: null,
    boss: 'seraphiel',
    color: '#ffe8a8',
    glow: '#ffffff',
    fog: '#5a4a2a',
    particle: 'halos',
    music: 'forgotten',
    glyph: '✵',
    enemies: ['radiant_sentinel', 'hollow_seraph', 'penitent_knight', 'reflecting_judge'],
    hint: 'Tidak ada tangga lagi. Hanya cahaya yang menunggu untuk memutuskan.',
    palette: { top: '#1c1608', mid: '#6a5424', low: '#d8b860', glow: '#fffbe0', fog: '#7a6428' },
  },
];

export const FALLEN_REGIONS = REGION_SOURCE.map((region, index) => ({
  ...region,
  index,
  roomStart: FALLEN_ROOM_START + index * FALLEN_ROOMS_PER_REGION,
  bossRoom: FALLEN_ROOM_START + index * FALLEN_ROOMS_PER_REGION + FALLEN_ROOMS_PER_REGION - 1,
  final: index === FALLEN_REGION_COUNT - 1,
}));

export const FALLEN_REGION_BY_ID = Object.fromEntries(FALLEN_REGIONS.map((r) => [r.id, r]));

// ── enemies ────────────────────────────────────────────────────────────────
// Behaviour strings must stay inside the engine's six known archetypes:
// chaser | lunge | ranged | slam | spawner | hopper.
const ENEMY_SOURCE = [
  {
    id: 'lesser_cherub', name: 'Lesser Cherub', localName: 'Kerub Kecil', title: 'Cracked Halo',
    behavior: 'hopper', hp: 52, dmg: 10, speed: 118, w: 30, h: 34, reward: 12, color: '#ffe8b8',
    region: 'gilded_ruins', flying: true, shield: 0, mark: 0,
    desc: 'Anak bersayap dengan halo retak. Terbang melingkar lalu menyelam; bulunya membuat silau.',
  },
  {
    id: 'gilded_husk', name: 'Gilded Husk', localName: 'Cangkang Emas', title: 'Armour Without a Body',
    behavior: 'slam', hp: 168, dmg: 20, speed: 62, w: 54, h: 66, reward: 24, color: '#d8b060',
    region: 'gilded_ruins', shield: 40, mark: 0,
    desc: 'Zirah emas kosong yang digerakkan cahaya. Berhenti menyerang bila dipukul dari belakang.',
  },
  {
    id: 'wind_sprite', name: 'Wind Sprite', localName: 'Peri Angin', title: 'Ribbon of Air',
    behavior: 'ranged', hp: 72, dmg: 13, speed: 132, w: 28, h: 30, reward: 18, color: '#c8ecff',
    region: 'cloudspire', flying: true, shield: 0, mark: 0,
    desc: 'Roh seperti pita yang menunggang arus udara. Berpindah jarak pendek dan mendorongmu.',
  },
  {
    id: 'halo_disc', name: 'Halo Disc', localName: 'Cakram Halo', title: 'Rolling Ring',
    behavior: 'lunge', hp: 96, dmg: 16, speed: 148, w: 38, h: 38, reward: 20, color: '#ffe08a',
    region: 'cloudspire', flying: true, shield: 25, mark: 0,
    desc: 'Cincin berputar yang berpatroli di dinding dan langit-langit. Memantul bila diparry.',
  },
  {
    id: 'chorister', name: 'Chorister', localName: 'Penyanyi Paduan', title: 'The Faceless Note',
    behavior: 'spawner', hp: 156, dmg: 14, speed: 46, w: 44, h: 62, reward: 26, color: '#d8b8ff',
    region: 'choir_hollow', shield: 0, mark: 0, childType: 'lesser_cherub',
    desc: 'Penyanyi berjubah tanpa wajah. Nadanya menyembuhkan musuh di sekitarnya — target utama.',
  },
  {
    id: 'echo_bell', name: 'Echo Bell', localName: 'Lonceng Gema', title: 'Sounding Iron',
    behavior: 'ranged', hp: 88, dmg: 15, speed: 52, w: 40, h: 46, reward: 17, color: '#f0d088',
    region: 'choir_hollow', shield: 30, mark: 0,
    desc: 'Lonceng yang berbunyi saat dipukul. Gelombangnya memanggil semua musuh di ruangan.',
  },
  {
    id: 'forge_seraphim', name: 'Forge Seraphim', localName: 'Serafim Tempa', title: 'Molten Limb',
    behavior: 'chaser', hp: 142, dmg: 22, speed: 108, w: 46, h: 52, reward: 25, color: '#ffa04c',
    region: 'seraph_foundry', shield: 35, mark: 0,
    desc: 'Konstruk kecil dengan tungkai emas cair. Menyerbu dan meninggalkan jejak terbakar.',
  },
  {
    id: 'lantern_warden', name: 'Lantern Warden', localName: 'Penjaga Lentera', title: 'Guard Soul',
    behavior: 'ranged', hp: 178, dmg: 19, speed: 64, w: 40, h: 54, reward: 28, color: '#ffe6a0',
    region: 'seraph_foundry', flying: true, shield: 55, mark: 0,
    desc: 'Lentera yang membawa jiwa penjaga. Menembak berkas cahaya; perisainya pecah dari bawah.',
  },
  {
    id: 'mirror_twin', name: 'Mirror Twin', localName: 'Kembar Cermin', title: 'Glass Doppel',
    behavior: 'lunge', hp: 116, dmg: 18, speed: 126, w: 34, h: 50, reward: 22, color: '#b8f0e8',
    region: 'mirror_aviary', shield: 20, mark: 0,
    desc: 'Doppelganger kaca. Mengulang gerakan terakhirmu dengan jeda setengah detik.',
  },
  {
    id: 'pale_acolyte', name: 'Pale Acolyte', localName: 'Akolit Pucat', title: 'Hooded Zealot',
    behavior: 'lunge', hp: 128, dmg: 20, speed: 104, w: 34, h: 54, reward: 23, color: '#f0e8e0',
    region: 'pale_cathedral', shield: 0, mark: 1,
    desc: 'Zealot bertudung putih. Setiap tebasan jarak dekat menempelkan Judgment Mark.',
  },
  {
    id: 'penitent_knight', name: 'Penitent Knight', localName: 'Ksatria Tobat', title: 'Kneeling Armour',
    behavior: 'slam', hp: 236, dmg: 26, speed: 54, w: 58, h: 70, reward: 34, color: '#d8ccc0',
    region: 'pale_cathedral', shield: 60, mark: 0,
    desc: 'Zirah berlutut yang bangkit saat didekati. Kebal dari depan selama berdoa.',
  },
  {
    id: 'radiant_sentinel', name: 'Radiant Sentinel', localName: 'Sentinel Bersinar', title: 'Six-Winged Lance',
    behavior: 'lunge', hp: 420, dmg: 30, speed: 110, w: 66, h: 84, reward: 60, color: '#ffe6a0',
    region: 'gilded_ruins', elite: true, shield: 120, mark: 0,
    desc: 'Penjaga bersayap enam dengan tombak cahaya. Menyapu berkas dan memanggil Kerub.',
  },
  {
    id: 'gale_archon', name: 'Gale Archon', localName: 'Arkon Angin', title: 'Armoured Storm',
    behavior: 'ranged', hp: 380, dmg: 28, speed: 128, w: 56, h: 70, reward: 55, color: '#a8d8f0',
    region: 'cloudspire', elite: true, flying: true, shield: 90, mark: 0,
    desc: 'Roh badai berzirah. Menciptakan zona angin yang bergeser di tengah pertarungan.',
  },
  {
    id: 'cantor_of_silence', name: 'Cantor of Silence', localName: 'Kantor Keheningan', title: 'Mute the Arena',
    behavior: 'slam', hp: 460, dmg: 30, speed: 58, w: 72, h: 92, reward: 62, color: '#c8a8f0',
    region: 'choir_hollow', elite: true, shield: 110, mark: 0,
    desc: 'Chorister menjulang yang membungkam arena. Dash dan parry mati di zonanya.',
  },
  {
    id: 'gilded_executioner', name: 'Gilded Executioner', localName: 'Algojo Emas', title: 'The Delayed Swing',
    behavior: 'slam', hp: 520, dmg: 34, speed: 66, w: 78, h: 88, reward: 68, color: '#e8b850',
    region: 'seraph_foundry', elite: true, shield: 130, mark: 2,
    desc: 'Algojo emas raksasa. Menandaimu, lalu mengayun setelah jeda — menghukum yang diam.',
  },
  {
    id: 'reflecting_judge', name: 'The Reflecting Judge', localName: 'Hakim Pemantul', title: 'Mirror-Masked',
    behavior: 'ranged', hp: 440, dmg: 29, speed: 96, w: 52, h: 76, reward: 58, color: '#b8f0e8',
    region: 'mirror_aviary', elite: true, shield: 100, mark: 1,
    desc: 'Hakim bertopeng cermin. Memantulkan proyektil dan terbelah dua saat terluka.',
  },
  {
    id: 'hollow_seraph', name: 'Hollow Seraph', localName: 'Seraf Kosong', title: 'Wingless Fallen',
    behavior: 'chaser', hp: 600, dmg: 36, speed: 118, w: 70, h: 96, reward: 80, color: '#f0c8a0',
    region: 'last_heaven', elite: true, shield: 150, mark: 2,
    desc: 'Malaikat tanpa sayap yang mengabdi pada tuan rumah. Mencampur serangan gelap dan terang.',
  },
];

export const FALLEN_ENEMY_INFO = {};
ENEMY_SOURCE.forEach((source, index) => {
  FALLEN_ENEMY_INFO[source.id] = {
    ...source,
    chapter: 1,
    fallen: true,
    flying: !!source.flying,
    elite: !!source.elite,
    purityShield: source.shield || 0,
    markStacks: source.mark || 0,
    danger: source.elite ? 'SANGAT TINGGI' : source.shield >= 50 ? 'TINGGI' : 'SEDANG',
    glyph: source.elite ? '✹' : source.flying ? '✧' : '❉',
    where: `${FALLEN_NAME} — Yang Terjatuh`,
    childType: source.childType || null,
    index,
  };
});

export const FALLEN_ENEMY_IDS = Object.keys(FALLEN_ENEMY_INFO);
export const FALLEN_ELITES = ENEMY_SOURCE.filter((e) => e.elite).map((e) => e.id);

// Ambient hazards are real room dressing, not spawns.
export const FALLEN_AMBIENT = [
  {
    id: 'feather_swarm', name: 'Feather Swarm', localName: 'Kawanan Bulu', glyph: '⁂',
    color: '#fff4d8', hazard: true,
    desc: 'Bukan musuh, tapi menutupi pandangan dan menutup platform. Bakar dengan Blinding Burst.',
  },
  {
    id: 'truth_eye', name: 'Truth Eye', localName: 'Mata Kebenaran', glyph: '◉',
    color: '#ffe6a0', hazard: true,
    desc: 'Mata mengapung yang melaporkan posisimu ke seluruh wilayah. Hancurkan sebelum ia berkedip dua kali.',
  },
  {
    id: 'mimic_relic', name: 'Mimic Relic', localName: 'Relik Tiruan', glyph: '▣',
    color: '#e8c46a', hazard: true,
    desc: 'Peti yang terbuka menjadi konstruk malaikat. Jangan percaya pada emas yang berdenyut.',
  },
];

// ── weapons and relic sets ─────────────────────────────────────────────────
export const FALLEN_WEAPONS = [
  {
    id: 'blade', name: 'Fallen Blade', localName: 'Bilah Terjatuh', glyph: '🗡',
    damage: 16, speed: 1.0, range: 70, cost: 0,
    desc: 'Pedang retak yang tumbuh kuat setiap wilayah. Senjata awal arc.',
  },
  {
    id: 'chakram', name: 'Halo Chakram', localName: 'Cakram Halo', glyph: '◎',
    damage: 13, speed: 1.25, range: 150, cost: 40,
    desc: 'Cincin yang kembali setelah dilempar. Bagus untuk memecah Purity Shield dari jauh.',
  },
  {
    id: 'lantern_staff', name: 'Lantern Staff', localName: 'Tongkat Lentera', glyph: '⚚',
    damage: 19, speed: 0.85, range: 110, cost: 60,
    desc: 'Tongkat cahaya dan bayangan jarak menengah. Mengisi Radiance lebih cepat.',
  },
  {
    id: 'gauntlets', name: 'Gilded Gauntlets', localName: 'Sarung Tangan Emas', glyph: '✊',
    damage: 11, speed: 1.45, range: 54, cost: 75,
    desc: 'Kombinasi cepat jarak dekat untuk build parry. Setiap pukulan menambah satu mark pada musuh.',
  },
];

export const FALLEN_WEAPON_BY_ID = Object.fromEntries(FALLEN_WEAPONS.map((w) => [w.id, w]));

export const FALLEN_RELIC_SETS = [
  {
    id: 'choir', name: 'Choir Set', localName: 'Set Paduan Suara', color: '#d8b8ff',
    bonus: 'Set lengkap: Blinding Burst juga membungkam musuh selama 3 detik.',
    pieces: ['Choir Bell', 'Throat of Glass', 'Hymn Fragment'],
  },
  {
    id: 'gale', name: 'Gale Set', localName: 'Set Angin', color: '#a8d8f0',
    bonus: 'Set lengkap: Feather Glide tidak memakai stamina dan dash memantul sekali.',
    pieces: ['Wind Ribbon', 'Storm Feather', 'Archon Sigil'],
  },
  {
    id: 'judge', name: 'Judge Set', localName: 'Set Hakim', color: '#f0e8e0',
    bonus: 'Set lengkap: Judgment Mark yang kau bersihkan meledak menjadi damage area.',
    pieces: ['Scales Shard', 'Gavel Core', 'Verdict Seal'],
  },
];

// ── boons and curses ───────────────────────────────────────────────────────
export const FALLEN_BOONS = [
  { id: 'gilded_heart', name: 'Gilded Heart', localName: 'Jantung Emas', rarity: 'common', effect: { maxHp: 12 }, desc: '+12 HP maksimum.' },
  { id: 'radiant_vein', name: 'Radiant Vein', localName: 'Urat Bersinar', rarity: 'common', effect: { radianceMax: 12 }, desc: '+12 kapasitas Radiance.' },
  { id: 'keen_light', name: 'Keen Light', localName: 'Cahaya Tajam', rarity: 'common', effect: { damage: 0.08 }, desc: '+8% damage.' },
  { id: 'feather_heel', name: 'Feather Heel', localName: 'Tumit Bulu', rarity: 'common', effect: { speed: 0.06 }, desc: '+6% kecepatan gerak.' },
  { id: 'burden_light', name: 'Burden of Light', localName: 'Beban Cahaya', rarity: 'rare', effect: { shieldBreak: 0.25 }, desc: 'Purity Shield pecah 25% lebih cepat.' },
  { id: 'hollow_lung', name: 'Hollow Lung', localName: 'Paru Kosong', rarity: 'rare', effect: { markResist: 0.3 }, desc: 'Judgment Mark 30% lebih lambat meledak.' },
  { id: 'cracked_halo', name: 'Cracked Halo', localName: 'Halo Retak', rarity: 'rare', effect: { burstDamage: 0.3 }, desc: 'Blinding Burst +30% damage.' },
  { id: 'fallen_grace', name: 'Fallen Grace', localName: 'Rahmat Terjatuh', rarity: 'rare', effect: { shadowDrain: 0.3 }, desc: 'Shadow Stance memakai 30% lebih sedikit HP.' },
  { id: 'choir_ear', name: 'Choir Ear', localName: 'Telinga Paduan', rarity: 'epic', effect: { shards: 0.25 }, desc: '+25% Shard of Halo dari run ini.' },
  { id: 'vow_of_silence', name: 'Vow of Silence', localName: 'Sumpah Sunyi', rarity: 'epic', effect: { burstStun: 0.6 }, desc: 'Blinding Burst membekukan musuh 60% lebih lama.' },
  { id: 'second_shadow', name: 'Second Shadow', localName: 'Bayangan Kedua', rarity: 'epic', effect: { shadowDamage: 0.25 }, desc: 'Shadow Stance +25% damage.' },
  { id: 'dawn_seed', name: 'Dawn Seed', localName: 'Benih Fajar', rarity: 'legendary', effect: { revive: 1 }, desc: 'Sekali per run: bangkit dengan 35% HP.' },
];

export const FALLEN_BOON_BY_ID = Object.fromEntries(FALLEN_BOONS.map((b) => [b.id, b]));

export const FALLEN_CURSES = [
  { id: 'blinding_grace', name: 'Blinding Grace', localName: 'Rahmat Menyilaukan', reward: 0.2, desc: 'Silau periodik menutup layar. +20% shard.' },
  { id: 'righteous_wrath', name: 'Righteous Wrath', localName: 'Murka Benar', reward: 0.2, desc: 'Musuh mengamuk saat sekarat. +20% shard.' },
  { id: 'hollow_hymn', name: 'Hollow Hymn', localName: 'Himne Kosong', reward: 0.15, desc: 'Musik bertambah satu lapisan suara. +15% shard.' },
  { id: 'heavy_halo', name: 'Heavy Halo', localName: 'Halo Berat', reward: 0.25, desc: 'Lompat lebih rendah. +25% shard.' },
  { id: 'gilded_chain', name: 'Gilded Chain', localName: 'Rantai Emas', reward: 0.25, desc: 'Tidak bisa memakai flask selama 6 detik setelah terkena. +25% shard.' },
  { id: 'final_judgment', name: 'Final Judgment', localName: 'Penghakiman Akhir', reward: 0.35, desc: 'Satu mark langsung meledak. +35% shard.' },
];

export const FALLEN_CURSE_BY_ID = Object.fromEntries(FALLEN_CURSES.map((c) => [c.id, c]));

// ── upgrades and echoes ────────────────────────────────────────────────────
export const FALLEN_UPGRADES = [
  {
    id: 'health', name: 'Cracked Halo', localName: 'Halo Retak', stat: 'maxHp', step: 12,
    tiers: [{ cost: 6, value: 12 }, { cost: 14, value: 24 }, { cost: 26, value: 36 }],
    desc: 'Setiap tingkat menambah satu slot nyawa.',
  },
  {
    id: 'radiance', name: 'Radiance Vessel', localName: 'Wadah Cahaya', stat: 'radianceMax', step: 15,
    tiers: [{ cost: 5, value: 15 }, { cost: 12, value: 30 }, { cost: 22, value: 45 }],
    desc: 'Menaikkan kapasitas Radiance Meter.',
  },
  {
    id: 'damage', name: 'Fallen Edge', localName: 'Mata Terjatuh', stat: 'damage', step: 0.08,
    tiers: [{ cost: 4, value: 0.08 }, { cost: 10, value: 0.16 }, { cost: 20, value: 0.24 }],
    desc: 'Menambah damage dasar setiap senjata.',
  },
  {
    id: 'weapon', name: 'Relic Forging', localName: 'Tempa Relik', stat: 'weaponTier', step: 1,
    tiers: [{ cost: 8, value: 1 }, { cost: 18, value: 2 }, { cost: 32, value: 3 }],
    desc: 'Menaikkan tingkat senjata dan membuka bentuk yang lebih terang.',
  },
];

export const FALLEN_UPGRADE_BY_ID = Object.fromEntries(FALLEN_UPGRADES.map((u) => [u.id, u]));

export const FALLEN_ECHOES = [
  {
    id: 'echo_resolve', name: 'Echo of Resolve', localName: 'Gema Tekad', glyph: '✚',
    hint: 'Tuntaskan kampanye dasar.', perk: '+1 slot nyawa di awal arc.',
    test: (base) => !!base?.cleared?.[7],
  },
  {
    id: 'echo_hunters', name: 'Echo of Hunters', localName: 'Gema Pemburu', glyph: '⚔',
    hint: 'Kalahkan bos opsional Root of the First Vow.',
    perk: 'Damage bonus terhadap elite.',
    test: (base) => !!base?.cleared?.[12],
  },
  {
    id: 'echo_memory', name: 'Echo of Memory', localName: 'Gema Ingatan', glyph: '◈',
    hint: 'Singkap seluruh 14 ruang di peta.',
    perk: 'NPC hub mengenali mu; satu baris dialog rahasia.',
    test: (base) => Array.isArray(base?.map?.discovered) && base.map.discovered.filter(Boolean).length >= 14,
  },
  {
    id: 'echo_ash', name: 'Echo of Ash', localName: 'Gema Abu', glyph: '✦',
    hint: 'Kumpulkan 20 koleksi ekspansi.',
    perk: '+8 Shard of Halo di awal.',
    test: (base) => (base?.expansion?.collectibles?.length || 0) >= 20,
  },
  {
    id: 'echo_below', name: 'Echo of the Below', localName: 'Gema Bawah', glyph: '☾',
    hint: 'Selesaikan satu ujian Panggung Abadi.',
    perk: 'Membuka The Below Echo lebih awal.',
    test: (base) => (base?.court?.trials ? Object.values(base.court.trials).some(Boolean) : false),
  },
];

export const FALLEN_ECHO_BY_ID = Object.fromEntries(FALLEN_ECHOES.map((e) => [e.id, e]));

export function fallenEchoesFor(baseProgress) {
  const ids = [];
  for (const echo of FALLEN_ECHOES) {
    let ok = false;
    try {
      ok = !!echo.test(baseProgress);
    } catch {
      ok = false;
    }
    if (ok) ids.push(echo.id);
  }
  return ids.slice(0, ECHO_CAP);
}

// ── endings ────────────────────────────────────────────────────────────────
export const FALLEN_ENDINGS = [
  {
    id: 'dawn',
    name: 'Dawn',
    localName: 'Fajar',
    glyph: '☀',
    condition: 'Kalahkan Seraphiel dan berpihak pada tuan rumah.',
    result: 'Surga dipulihkan; Yang Terjatuh hilang selamanya.',
    figure: 'kneeling',
    color: '#ffe6a0',
  },
  {
    id: 'dusk',
    name: 'Dusk',
    localName: 'Senja',
    glyph: '☾',
    condition: 'Lepaskan Seraphiel dan bebaskan Yang Terjatuh.',
    result: 'Surga dan dunia bawah menyatu dalam damai yang gelisah.',
    figure: 'rising',
    color: '#c8a8f0',
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    localName: 'Gerhana',
    glyph: '◑',
    condition: 'Serap kekuatan Seraphiel. Butuh keempat bos opsional.',
    result: 'Kau menjadi dewa baru yang ambigu. Arc III menunggu.',
    figure: 'crowned',
    color: '#ff8a6a',
    secret: true,
  },
];

export const FALLEN_ENDING_BY_ID = Object.fromEntries(FALLEN_ENDINGS.map((e) => [e.id, e]));

export const FALLEN_MENU_OPTIONS = [
  { id: 'descent', label: 'NEW DESCENT', local: 'TURUN BARU', note: 'Mulai arc sebagai game baru.' },
  { id: 'continue', label: 'CONTINUE', local: 'LANJUTKAN', note: 'Muat simpanan Yang Terjatuh.' },
  { id: 'archive', label: 'THE ARCHIVE', local: 'ARSIP', note: 'Catatan run dasar, bos, bestiary, pencapaian.' },
  { id: 'below', label: 'THE BELOW', local: 'DUNIA BAWAH', note: 'Jalankan game asli dengan slot terpisah.' },
  { id: 'options', label: 'OPTIONS', local: 'OPSI', note: 'Pengaturan, plus tema menu.' },
  { id: 'quit', label: 'QUIT', local: 'KELUAR', note: 'Tutup permainan.' },
];

// ── bosses ─────────────────────────────────────────────────────────────────
const BOSS_SOURCE = [
  {
    id: 'aurelian',
    kind: 'fallen_aurelian',
    region: 'gilded_ruins',
    name: 'Aurelian, the First Lantern',
    title: 'The First Lantern',
    localName: 'Aurelian, Lentera Pertama',
    pattern: 'ring',
    maxHp: 900,
    w: 128,
    h: 150,
    contact: 24,
    phases: 2,
    color: '#e8c46a',
    music: 'bossDawn',
    ashReward: 180,
    shards: 12,
    ability: 'halo_dash',
    glyph: '☼',
    lines: [
      'Aku menyalakan lentera pertama sebelum dunia punya nama. Kau datang membawa abu ke dalam cahaya.',
      'Naunganku kubuka. Sekarang tidak ada tempat yang tidak kuhakimi.',
      'Lentera padam. Untuk pertama kalinya dalam seribu tahun, aku melihat bayangan sendiri.',
    ],
  },
  {
    id: 'zephyria',
    kind: 'fallen_zephyria',
    region: 'cloudspire',
    name: 'Zephyria, Mother of Gales',
    title: 'Mother of Gales',
    localName: 'Zephyria, Ibu Badai',
    pattern: 'charge',
    maxHp: 1200,
    w: 190,
    h: 132,
    contact: 26,
    phases: 3,
    flying: true,
    color: '#a8d8f0',
    music: 'bossDawn',
    ashReward: 230,
    shards: 16,
    ability: 'feather_glide',
    glyph: '☁',
    lines: [
      'Kau berdiri di jembatanku. Jembatan ini terbuat dari napas anak-anak yang kulepas.',
      'Badai tidak menyerang. Badai hanya mengingatkan siapa yang pernah terbang.',
      'Anginku mulai lelah. Kau masih di sini.',
      'Jatuhlah dengan anggun. Itu satu-satunya hadiah yang bisa kuberikan.',
    ],
  },
  {
    id: 'choir_seven',
    kind: 'fallen_choir_seven',
    region: 'choir_hollow',
    name: 'The Choir of Seven',
    title: 'Seven Voices, One Verdict',
    localName: 'Paduan Suara Tujuh',
    pattern: 'volley',
    maxHp: 1500,
    w: 170,
    h: 140,
    contact: 22,
    phases: 3,
    color: '#d8b8ff',
    music: 'bossDawn',
    ashReward: 260,
    shards: 18,
    ability: 'resonance_strike',
    glyph: '♪',
    lines: [
      'Tujuh suara menyanyikan satu kalimat: tidak ada yang boleh tinggal di bawah.',
      'Satu suara berhenti. Harmoni berubah, dan kami menyesuaikan diri.',
      'Kau menyanyikan nada yang tidak ada dalam partitur kami.',
      'Terakhir kali kami diam, langit runtuh. Mungkin kali ini juga.',
    ],
  },
  {
    id: 'ophanim_prime',
    kind: 'fallen_ophanim_prime',
    region: 'seraph_foundry',
    name: 'Ophanim Prime',
    title: 'The Interlocking Wheels',
    localName: 'Ophanim Prima',
    pattern: 'slam',
    maxHp: 1800,
    w: 176,
    h: 152,
    contact: 28,
    phases: 3,
    color: '#ffb45c',
    music: 'bossDawn',
    ashReward: 300,
    shards: 20,
    ability: 'gilded_guard',
    glyph: '⚙',
    lines: [
      'Roda di dalam roda. Mata di dalam mata. Semua berputar untuk satu tujuan.',
      'Kami menempa penjaga dari emas dan doa. Kau akan menjadi bahan berikutnya.',
      'Mata kami terbuka satu per satu. Kau masih belum memahami urutannya.',
      'Roda berhenti. Untuk pertama kalinya, kami melihat ke dalam, bukan keluar.',
    ],
  },
  {
    id: 'glass_archangel',
    kind: 'fallen_glass_archangel',
    region: 'mirror_aviary',
    name: 'The Glass Archangel',
    title: 'Shatter and Reform',
    localName: 'Archangel Kaca',
    pattern: 'summon',
    maxHp: 2100,
    w: 160,
    h: 156,
    contact: 26,
    phases: 3,
    flying: true,
    color: '#b8f0e8',
    music: 'bossDawn',
    ashReward: 340,
    shards: 22,
    ability: 'reflect_step',
    glyph: '◇',
    lines: [
      'Setiap pecahan kacaku adalah kau yang memilih jalan lain.',
      'Hanya tubuh asli yang punya bayangan. Perhatikan baik-baik.',
      'Kau memakai kegelapan. Aku bisa memantulkannya kembali.',
      'Akhirnya... satu permukaan yang tidak memantulkan apa pun.',
    ],
  },
  {
    id: 'sanctus_verdict',
    kind: 'fallen_sanctus_verdict',
    region: 'pale_cathedral',
    name: 'Sanctus Verdict, the High Judge',
    title: 'The High Judge',
    localName: 'Sanctus Verdict, Hakim Agung',
    pattern: 'rain',
    maxHp: 2400,
    w: 150,
    h: 168,
    contact: 30,
    phases: 3,
    color: '#f0e8e0',
    music: 'bossDawn',
    ashReward: 380,
    shards: 26,
    ability: 'absolution',
    glyph: '⚖',
    lines: [
      'Berkasmu tebal. Setiap kematian di dunia bawah tercatat dengan tinta emas.',
      'Hukuman pertama: kakimu tidak lagi menyentuh tanah.',
      'Hukuman kedua: gravitasi berpihak padaku.',
      'Hukuman ketiga: kau harus menghakimi dirimu sendiri.',
      'Timbangan itu tidak pernah seimbang. Mungkin memang tidak seharusnya.',
    ],
  },
  {
    id: 'seraphiel',
    kind: 'fallen_seraphiel',
    region: 'last_heaven',
    name: 'Seraphiel, the Dawn That Breaks',
    title: 'The Dawn That Breaks',
    localName: 'Seraphiel, Fajar yang Pecah',
    pattern: 'volley',
    maxHp: 3200,
    w: 200,
    h: 180,
    contact: 34,
    phases: 3,
    flying: true,
    final: true,
    color: '#ffe8a8',
    music: 'bossDawn',
    ashReward: 500,
    shards: 40,
    ability: null,
    glyph: '✵',
    lines: [
      'Aku menunggu di puncak semua tangga. Tidak ada yang sampai sejauh ini tanpa alasan.',
      'Topengku retak. Kau mulai melihat wajah yang seharusnya tidak kaulihat.',
      'Aku juga salah satu dari Yang Terjatuh. Aku hanya memilih untuk tidak mengakuinya.',
      'Sekarang pilih: pukul, ampuni, atau ambil. Ketiganya punya harga.',
    ],
  },
  {
    id: 'weeping_cherub',
    kind: 'fallen_weeping_cherub',
    region: 'optional',
    name: 'The Weeping Cherub',
    title: 'A Sorrow With Wings',
    localName: 'Kerub yang Menangis',
    pattern: 'summon',
    maxHp: 1100,
    w: 140,
    h: 140,
    contact: 22,
    phases: 2,
    optional: true,
    color: '#ffe0c8',
    music: 'bossJudge',
    ashReward: 220,
    shards: 18,
    ability: null,
    glyph: '☹',
    lines: [
      'Aku menangis karena kau mengingatkanku pada seseorang yang tidak pernah kembali.',
      'Air mataku menutup lantai. Berenanglah, kalau bisa.',
      'Tidak ada yang perlu dimaafkan. Itu bagian yang paling menyakitkan.',
    ],
  },
  {
    id: 'throne_of_thorns',
    kind: 'fallen_throne_of_thorns',
    region: 'optional',
    name: 'Throne of Thorns',
    title: 'A Crown Left Behind',
    localName: 'Singgasana Duri',
    pattern: 'slam',
    maxHp: 1400,
    w: 170,
    h: 150,
    contact: 28,
    phases: 3,
    optional: true,
    color: '#d8b060',
    music: 'bossJudge',
    ashReward: 260,
    shards: 22,
    ability: null,
    glyph: '♛',
    lines: [
      'Singgasana ini tidak pernah kosong. Ia hanya menunggu pemilik yang tepat.',
      'Duri-duri ini tumbuh dari mahkota yang dilepas, bukan dari kepala yang diambil.',
      'Duduklah. Hanya sebentar. Itu semua yang kuminta.',
      'Kau lebih berat dari yang kuduga. Terima kasih sudah mencoba.',
    ],
  },
  {
    id: 'auditor_vael',
    kind: 'fallen_auditor_vael',
    region: 'optional',
    name: 'Auditor Vael',
    title: 'The Bureaucrat of Sins',
    localName: 'Auditor Vael',
    pattern: 'rain',
    maxHp: 1600,
    w: 110,
    h: 110,
    contact: 20,
    phases: 3,
    optional: true,
    color: '#e8e0d0',
    music: 'bossJudge',
    ashReward: 280,
    shards: 24,
    ability: null,
    glyph: '📜',
    lines: [
      'Aku sudah membaca berkasmu. Tiga puluh tujuh pelanggaran, semuanya kecil.',
      'Yang kecil menumpuk. Itu seluruh isi pekerjaanku.',
      'Kau tidak bisa mengajukan banding di tengah pertarungan.',
      'Berkas ditutup. Aku tidak tahu apakah itu berarti kau menang.',
    ],
  },
  {
    id: 'fallen_mirror',
    kind: 'fallen_mirror',
    region: 'optional',
    name: 'The Fallen Mirror',
    title: 'A Nostalgia Fight',
    localName: 'Cermin Terjatuh',
    pattern: 'charge',
    maxHp: 2000,
    w: 150,
    h: 160,
    contact: 30,
    phases: 3,
    optional: true,
    color: '#8a7a9a',
    music: 'bossJudge',
    ashReward: 340,
    shards: 30,
    ability: null,
    glyph: '◑',
    lines: [
      'Kau pernah mengalahkanku di dunia yang gelap. Di sini aku lebih terang, dan lebih jujur.',
      'Setiap pola ini kau hafal. Itu yang membuatnya berbahaya.',
      'Ingatanmu adalah senjata yang kuberikan padamu.',
      'Kalah lagi rasanya seperti pulang.',
    ],
  },
];

function thresholdsFor(phases) {
  if (phases <= 2) return [0.5];
  const list = [];
  for (let i = phases - 1; i >= 1; i -= 1) list.push(Math.round((i / phases) * 100) / 100);
  return list;
}

function dialogueFor(source) {
  const dialogue = {
    intro: [
      { speaker: source.name, text: source.lines[0] },
      { speaker: 'The Oathbound', text: 'Aku sudah mengalahkan satu kegelapan. Aku tidak datang untuk berlutut pada cahaya.' },
    ],
    defeat: [{ speaker: source.name, text: source.lines[source.lines.length - 1] }],
  };
  for (let phase = 2; phase <= source.phases; phase += 1) {
    dialogue[`phase${phase}`] = [
      { speaker: source.name, text: source.lines[phase - 1] || source.lines[source.lines.length - 2] },
    ];
  }
  return dialogue;
}

export const FALLEN_BOSSES = BOSS_SOURCE.map((source) => {
  const region = FALLEN_REGION_BY_ID[source.region] || FALLEN_REGIONS[0];
  const optionalIndex = BOSS_SOURCE.filter((b) => b.optional).findIndex((b) => b.id === source.id);
  return {
    ...source,
    roomIndex: source.optional
      ? FALLEN_ROOM_START + FALLEN_REGION_COUNT * FALLEN_ROOMS_PER_REGION + optionalIndex
      : region.bossRoom,
    phaseThresholds: thresholdsFor(source.phases),
  };
});

export const FALLEN_BOSS_BY_ID = Object.fromEntries(FALLEN_BOSSES.map((b) => [b.id, b]));
export const FALLEN_MAIN_BOSSES = FALLEN_BOSSES.filter((b) => !b.optional);
export const FALLEN_OPTIONAL_BOSSES = FALLEN_BOSSES.filter((b) => b.optional);
export const FALLEN_BOSS_KINDS = FALLEN_BOSSES.map((b) => b.kind);
export const FALLEN_BOSS_COUNT = FALLEN_BOSSES.length;

export const FALLEN_BOSS_INFO = {};
for (const source of BOSS_SOURCE) {
  FALLEN_BOSS_INFO[source.kind] = {
    id: source.id,
    kind: source.kind,
    name: source.name,
    localName: source.localName,
    title: source.title,
    fallen: true,
    pattern: source.pattern,
    maxHp: source.maxHp,
    w: source.w,
    h: source.h,
    contact: source.contact,
    maxPhases: source.phases,
    phaseThresholds: thresholdsFor(source.phases),
    mini: !!source.optional,
    major: !source.optional,
    optional: !!source.optional,
    final: !!source.final,
    flying: !!source.flying,
    reward: source.final ? 'victory' : 'blessing',
    purityShield: source.optional ? 160 : 120,
    summonType: source.pattern === 'summon' ? 'lesser_cherub' : null,
    ashReward: source.ashReward,
    echoReward: 0,
    shards: source.shards,
    color: source.color,
    music: source.music,
    glyph: source.glyph,
    spawn: { x: 700, y: FALLEN_FLOOR_Y - source.h },
    dialogue: dialogueFor(source),
    desc: source.lines[0],
    where: `${FALLEN_NAME} — Yang Terjatuh`,
  };
}

// ── rooms ──────────────────────────────────────────────────────────────────
function platformsFor(regionIndex, boss = false) {
  const high = 300 + (regionIndex % 3) * 26;
  const list = [
    { x: 0, y: FALLEN_FLOOR_Y, w: FALLEN_WORLD_W, h: 46 },
    { x: 178, y: high, w: 196, h: 18 },
    { x: 560, y: high - 52, w: 214, h: 18 },
    { x: 1002, y: 348 - (regionIndex % 4) * 18, w: 244, h: 18 },
  ];
  if (boss) {
    list.push({ x: 262, y: FALLEN_FLOOR_Y - 132, w: 160, h: 16 });
    list.push({ x: 976, y: FALLEN_FLOOR_Y - 132, w: 160, h: 16 });
  }
  return list;
}

function enemiesFor(region, slot, types) {
  return types.map((type, i) => {
    const info = FALLEN_ENEMY_INFO[type];
    return {
      type,
      x: clamp(300 + i * 300 + ((region.index * 41 + slot * 23) % 70), 170, FALLEN_WORLD_W - 180),
      minX: 80,
      maxX: FALLEN_WORLD_W - 100,
      elite: !!info?.elite,
      hpScale: 1 + region.index * 0.14,
      dmgScale: 1 + region.index * 0.1,
      speedScale: 1 + region.index * 0.05,
    };
  });
}

function gateTo(next, requires, name) {
  return { x: 1362, y: 286, w: 34, h: 184, requires, next, name };
}

const HALL_NAMES = [
  { name: 'Ambang Terang', subtitle: 'Threshold of Light' },
  { name: 'Aula Nyanyi', subtitle: 'Singing Hall' },
  { name: 'Galeri Retak', subtitle: 'Cracked Gallery' },
  { name: 'Tangga Cahaya', subtitle: 'Stair of Light' },
];

function makeHallRoom(region, slot) {
  const types = region.enemies.slice(0, slot === 0 ? 0 : slot === 1 ? 2 : 3);
  const global = region.roomStart + slot;
  const room = {
    id: global,
    fallen: true,
    fallenRegion: region.index + 1,
    fallenRegionId: region.id,
    fallenSlot: slot,
    name: `${HALL_NAMES[slot].name} — ${region.localName}`,
    subtitle: `${FALLEN_NAME} — ${HALL_NAMES[slot].subtitle}`,
    zone: region.id,
    spawn: { x: 80, y: FALLEN_FLOOR_Y - 46 },
    platforms: platformsFor(region.index),
    enemies: enemiesFor(region, slot, types),
    relic: null,
    boss: null,
    hint: region.hint,
    palette: { ...region.palette },
    particle: region.particle,
    music: region.music,
    condition: region.gimmick,
    weather: region.theme,
    accent: region.color,
    gate: gateTo(global + 1, 'clear', slot === 3 ? `Gerbang ${region.boss}` : 'Jalan Berikutnya'),
  };
  if (slot === 0) {
    room.checkpoint = { x: 74, y: FALLEN_FLOOR_Y - 78, w: 38, h: 78, name: 'Ambang Bulu' };
    room.merchant = { x: 156, y: FALLEN_FLOOR_Y - 96, w: 46, h: 96 };
  }
  return room;
}

function makeBossRoom(region) {
  const boss = FALLEN_BOSS_BY_ID[region.boss];
  const nextRegion = region.final ? null : FALLEN_REGIONS[region.index + 1];
  return {
    id: region.bossRoom,
    fallen: true,
    fallenRegion: region.index + 1,
    fallenRegionId: region.id,
    fallenSlot: FALLEN_ROOMS_PER_REGION - 1,
    fallenBoss: boss.id,
    name: boss.localName,
    subtitle: `${FALLEN_NAME} — ${boss.title}`,
    zone: region.id,
    spawn: { x: 80, y: FALLEN_FLOOR_Y - 46 },
    platforms: platformsFor(region.index, true),
    enemies: [],
    relic: null,
    boss: boss.kind,
    hint: region.hint,
    palette: { ...region.palette },
    particle: region.particle,
    music: region.music,
    condition: region.gimmick,
    weather: region.theme,
    accent: boss.color,
    gate: nextRegion ? gateTo(nextRegion.roomStart, 'boss', nextRegion.localName) : null,
  };
}

function makeOptionalRoom(boss) {
  return {
    id: boss.roomIndex,
    fallen: true,
    fallenOptional: boss.id,
    fallenSlot: -1,
    name: boss.localName,
    subtitle: `${FALLEN_NAME} — ${boss.title}`,
    zone: 'last_heaven',
    spawn: { x: 80, y: FALLEN_FLOOR_Y - 46 },
    platforms: platformsFor(6, true),
    enemies: [],
    relic: null,
    boss: boss.kind,
    hint: 'Bos opsional. Tidak ada gerbang keluar — kau kembali lewat hub.',
    palette: { ...FALLEN_REGIONS[6].palette },
    particle: FALLEN_REGIONS[6].particle,
    music: FALLEN_REGIONS[6].music,
    condition: 'Ruang ingatan yang tidak tercatat di peta mana pun.',
    weather: 'Cahaya diam',
    accent: boss.color,
    gate: null,
  };
}

export const FALLEN_ROOMS = [];
for (const region of FALLEN_REGIONS) {
  for (let slot = 0; slot < FALLEN_ROOMS_PER_REGION - 1; slot += 1) {
    FALLEN_ROOMS.push(makeHallRoom(region, slot));
  }
  FALLEN_ROOMS.push(makeBossRoom(region));
}
for (const boss of FALLEN_OPTIONAL_BOSSES) FALLEN_ROOMS.push(makeOptionalRoom(boss));

export const FALLEN_ROOM_BY_ID = Object.fromEntries(FALLEN_ROOMS.map((room) => [room.id, room]));
export const FALLEN_REGION_ROOMS = FALLEN_REGIONS.map((region) =>
  FALLEN_ROOMS.filter((room) => room.fallenRegion === region.index + 1));

export function fallenRoomFor(regionIndex, slot) {
  const region = FALLEN_REGIONS[clamp(asInt(regionIndex), 0, FALLEN_REGION_COUNT - 1)];
  return FALLEN_ROOM_BY_ID[region.roomStart + clamp(asInt(slot), 0, FALLEN_ROOMS_PER_REGION - 1)] || null;
}

export function validateFallenRooms(rooms = FALLEN_ROOMS) {
  const errors = [];
  if (!Array.isArray(rooms)) return { ok: false, errors: ['FALLEN_ROOMS is not an array'], count: 0 };
  if (rooms.length !== FALLEN_ROOM_COUNT) errors.push(`Expected ${FALLEN_ROOM_COUNT} rooms, got ${rooms.length}`);
  const ids = new Set();
  for (const room of rooms) {
    if (!room || typeof room !== 'object') { errors.push('Room entry is not an object'); continue; }
    if (ids.has(room.id)) errors.push(`Duplicate room id ${room.id}`);
    ids.add(room.id);
    if (!room.name) errors.push(`Room ${room.id} has no name`);
    if (!room.spawn || !Number.isFinite(room.spawn.x)) errors.push(`Room ${room.id} has an invalid spawn`);
    if (!Array.isArray(room.platforms) || !room.platforms.some((p) => p.y >= FALLEN_FLOOR_Y - 2)) {
      errors.push(`Room ${room.id} has no floor platform`);
    }
    if (room.gate && !FALLEN_ROOM_BY_ID[room.gate.next]) errors.push(`Room ${room.id} gate points to unknown room ${room.gate.next}`);
    for (const enemy of room.enemies || []) {
      if (!FALLEN_ENEMY_INFO[enemy.type]) errors.push(`Room ${room.id} references unknown enemy ${enemy.type}`);
    }
    if (room.boss && !FALLEN_BOSS_INFO[room.boss]) errors.push(`Room ${room.id} references unknown boss ${room.boss}`);
  }
  return { ok: errors.length === 0, errors, count: rooms.length };
}

// ── combat resources ───────────────────────────────────────────────────────
export function createFallenRun({ abilities = [], echoes = [], upgrades = {}, weapon = 'blade', curses = [] } = {}) {
  const up = {
    health: clamp(asInt(upgrades.health), 0, 3),
    radiance: clamp(asInt(upgrades.radiance), 0, 3),
    damage: clamp(asInt(upgrades.damage), 0, 3),
    weapon: clamp(asInt(upgrades.weapon), 0, 3),
  };
  const echoSet = new Set(echoes.filter((id) => FALLEN_ECHO_BY_ID[id]).slice(0, ECHO_CAP));
  return {
    abilitySet: abilities.filter((id) => FALLEN_ABILITY_BY_ID[id]),
    echoes: [...echoSet],
    upgrades: up,
    weapon: FALLEN_WEAPON_BY_ID[weapon] ? weapon : 'blade',
    maxHp: 120 + up.health * 12 + (echoSet.has('echo_resolve') ? 18 : 0),
    radianceMax: RADIANCE_MAX + up.radiance * 15,
    damageMul: 1 + up.damage * 0.08,
    radiance: 0,
    marks: 0,
    markTimer: MARK_WINDOW,
    markDamage: 0,
    shadow: false,
    shadowUnlocked: abilities.includes('absolution') || abilities.length >= 5,
    shadowDrained: 0,
    bursts: 0,
    stun: 0,
    shards: echoSet.has('echo_ash') ? 8 : 0,
    boons: [],
    curses: curses.filter((id) => FALLEN_CURSE_BY_ID[id]),
    kills: 0,
    revives: 0,
  };
}

export function radianceGain(run, damage) {
  if (!run) return { gained: 0, full: false };
  const gain = Math.max(0, Number(damage) || 0) * RADIANCE_PER_DAMAGE;
  const before = run.radiance;
  run.radiance = Math.min(run.radianceMax, run.radiance + gain);
  return { gained: round1(run.radiance - before), full: run.radiance >= run.radianceMax - 0.001 };
}

export function radianceFull(run) {
  return !!run && run.radiance >= (run.radianceMax || RADIANCE_MAX) - 0.001;
}

export function blindingBurst(run) {
  if (!run) return { ok: false, reason: 'no_run' };
  if (!radianceFull(run)) return { ok: false, reason: 'not_full' };
  run.radiance = 0;
  run.bursts = (run.bursts || 0) + 1;
  run.stun = Math.max(run.stun || 0, BURST_STUN);
  return { ok: true, damage: 70 + (run.upgrades?.damage || 0) * 15, stun: BURST_STUN };
}

export function applyJudgment(run, stacks = 1) {
  if (!run) return 0;
  run.marks = clamp((run.marks || 0) + Math.max(0, asInt(stacks)), 0, MARK_MAX);
  run.markTimer = MARK_WINDOW;
  return run.marks;
}

export function judgmentTick(run, dt, { moved = false, acted = false } = {}) {
  if (!run || !run.marks) return { detonated: false, cleared: false, marks: 0 };
  if (acted) {
    run.marks = 0;
    run.markTimer = MARK_WINDOW;
    return { detonated: false, cleared: true, marks: 0 };
  }
  if (moved) {
    run.markTimer = Math.min(MARK_WINDOW, run.markTimer + dt * 0.5);
    return { detonated: false, cleared: false, marks: run.marks };
  }
  run.markTimer -= dt;
  if (run.markTimer <= 0) {
    const damage = run.marks * MARK_DAMAGE;
    run.marks = 0;
    run.markTimer = MARK_WINDOW;
    run.markDamage = (run.markDamage || 0) + damage;
    return { detonated: true, cleared: false, damage, marks: 0 };
  }
  return { detonated: false, cleared: false, marks: run.marks };
}

export function toggleShadow(run, maxHp = run?.maxHp || 120) {
  if (!run) return { ok: false, reason: 'no_run' };
  if (!run.shadowUnlocked) return { ok: false, reason: 'locked' };
  run.shadow = !run.shadow;
  if (run.shadow && maxHp > 0) run.hpFloor = Math.max(1, maxHp * 0.15);
  return { ok: true, shadow: run.shadow };
}

export function shadowTick(run, dt, maxHp = run?.maxHp || 120) {
  if (!run || !run.shadow) return { drain: 0, ended: false };
  const drain = maxHp * SHADOW_DRAIN * dt;
  run.shadowDrained = (run.shadowDrained || 0) + drain;
  return { drain, ended: false };
}

export function shadowDamageMul(run) {
  return run?.shadow ? SHADOW_DAMAGE_MUL : 1;
}

export const PURITY_BREAK_ACTIONS = ['burst', 'parry', 'shadow'];

export function purityDamage(shield, amount, action = 'normal') {
  const s = Math.max(0, Number(shield) || 0);
  const a = Math.max(0, Number(amount) || 0);
  if (s <= 0) return { shield: 0, damage: a, broke: false };
  const factor = PURITY_BREAK_ACTIONS.includes(action) ? 1 : 0.15;
  const applied = a * factor;
  const left = Math.max(0, s - applied);
  return { shield: left, damage: left > 0 ? a * 0.15 : a, broke: left <= 0 };
}

// ── progress ───────────────────────────────────────────────────────────────
export function defaultFallenProgress() {
  return {
    version: FALLEN_VERSION,
    ascended: false,
    arcId: null,
    menuTheme: 'heavenly',
    rooms: Array.from({ length: FALLEN_ROOM_COUNT }, () => false),
    bosses: Object.fromEntries(FALLEN_BOSSES.map((boss) => [boss.id, false])),
    endings: Object.fromEntries(FALLEN_ENDINGS.map((ending) => [ending.id, false])),
    ending: null,
    abilities: [],
    echoes: [],
    shards: 0,
    upgrades: { health: 0, radiance: 0, damage: 0, weapon: 0 },
    weapon: 'blade',
    boons: [],
    curses: [],
    runs: 0,
    deaths: 0,
    bestTime: 0,
    movement: 0,
    choices: { struck: 0, spared: 0 },
    archive: { bestiary: [], bosses: [] },
  };
}

export function sanitizeFallenProgress(raw) {
  const base = defaultFallenProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const rooms = Array.from({ length: FALLEN_ROOM_COUNT }, (_, i) => raw.rooms?.[i] === true);
  const bosses = {};
  for (const boss of FALLEN_BOSSES) bosses[boss.id] = raw.bosses?.[boss.id] === true;
  // Region bosses only exist after their four halls; drop impossible states.
  for (let region = 0; region < FALLEN_REGION_COUNT; region += 1) {
    const start = region * FALLEN_ROOMS_PER_REGION;
    for (let slot = 1; slot < FALLEN_ROOMS_PER_REGION; slot += 1) {
      if (rooms[start + slot] && !rooms[start + slot - 1]) rooms[start + slot] = false;
    }
    const boss = FALLEN_REGIONS[region].boss;
    if ((bosses[boss] || rooms[start + FALLEN_ROOMS_PER_REGION - 1]) && !rooms.slice(start, start + FALLEN_ROOMS_PER_REGION - 1).every(Boolean)) {
      bosses[boss] = false;
      rooms[start + FALLEN_ROOMS_PER_REGION - 1] = false;
    }
  }
  const optionalIds = new Set(FALLEN_OPTIONAL_BOSSES.map((b) => b.id));
  const abilities = Array.isArray(raw.abilities)
    ? [...new Set(raw.abilities.filter((id) => FALLEN_ABILITY_BY_ID[id]))]
    : [];
  // An ability is only earned by its boss.
  const earned = new Set();
  for (const boss of FALLEN_BOSSES) if (bosses[boss.id] && boss.ability) earned.add(boss.ability);
  const cleanAbilities = abilities.filter((id) => earned.has(id) || id === 'absolution');
  const echoes = Array.isArray(raw.echoes)
    ? [...new Set(raw.echoes.filter((id) => FALLEN_ECHO_BY_ID[id]))].slice(0, ECHO_CAP)
    : [];
  const endings = {};
  for (const ending of FALLEN_ENDINGS) endings[ending.id] = raw.endings?.[ending.id] === true;
  // The secret ending needs all four optional bosses.
  if (endings.eclipse && !FALLEN_OPTIONAL_BOSSES.every((b) => bosses[b.id])) endings.eclipse = false;
  const int = (value, min, max) => {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return min;
    return clamp(n, min, max);
  };
  const upgrades = {
    health: int(raw.upgrades?.health, 0, 3),
    radiance: int(raw.upgrades?.radiance, 0, 3),
    damage: int(raw.upgrades?.damage, 0, 3),
    weapon: int(raw.upgrades?.weapon, 0, 3),
  };
  const weapon = FALLEN_WEAPON_BY_ID[raw.weapon] ? raw.weapon : 'blade';
  const ending = FALLEN_ENDING_BY_ID[raw.ending] && endings[raw.ending] ? raw.ending : null;
  const bestiary = Array.isArray(raw.archive?.bestiary)
    ? [...new Set(raw.archive.bestiary.filter((id) => FALLEN_ENEMY_INFO[id]))]
    : [];
  const seenBosses = Array.isArray(raw.archive?.bosses)
    ? [...new Set(raw.archive.bosses.filter((id) => FALLEN_BOSS_BY_ID[id]))]
    : [];
  return {
    ...base,
    version: FALLEN_VERSION,
    ascended: raw.ascended === true,
    arcId: raw.arcId === FALLEN_ARC_ID ? FALLEN_ARC_ID : null,
    menuTheme: raw.menuTheme === 'base' ? 'base' : 'heavenly',
    rooms,
    bosses,
    endings,
    ending,
    abilities: cleanAbilities,
    echoes,
    shards: int(raw.shards, 0, 9999),
    upgrades,
    weapon,
    boons: Array.isArray(raw.boons) ? raw.boons.filter((id) => FALLEN_BOON_BY_ID[id]) : [],
    curses: Array.isArray(raw.curses) ? raw.curses.filter((id) => FALLEN_CURSE_BY_ID[id]) : [],
    runs: int(raw.runs, 0, 99999),
    deaths: int(raw.deaths, 0, 99999),
    bestTime: Math.max(0, round1(raw.bestTime)),
    movement: int(raw.movement, 0, FALLEN_MOVEMENTS.length - 1),
    choices: { struck: int(raw.choices?.struck, 0, 9999), spared: int(raw.choices?.spared, 0, 9999) },
    archive: { bestiary, bosses: seenBosses },
  };
}

export function ascendProgress(progress, { baseComplete = null } = {}) {
  if (!progress || typeof progress !== 'object') return { ok: false, firstTime: false };
  const complete = baseComplete == null ? !!progress.cleared?.[7] : !!baseComplete;
  if (!complete) return { ok: false, firstTime: false, reason: 'base_incomplete' };
  if (!progress.fallen || typeof progress.fallen !== 'object') progress.fallen = defaultFallenProgress();
  const firstTime = progress.fallen.ascended !== true;
  progress.fallen.ascended = true;
  progress.fallen.arcId = FALLEN_ARC_ID;
  if (firstTime) progress.fallen.movement = Math.max(progress.fallen.movement || 0, 1);
  return { ok: true, firstTime, ascended: true };
}

export function fallenIsAscended(progress) {
  return progress?.fallen?.ascended === true;
}

export function fallenRegionUnlocked(state, regionIndex) {
  const safe = sanitizeFallenProgress(state);
  const index = clamp(asInt(regionIndex), 0, FALLEN_REGION_COUNT - 1);
  if (index === 0) return true;
  const previous = FALLEN_REGIONS[index - 1];
  return safe.bosses[previous.boss] === true;
}

export function fallenRoomUnlocked(state, roomId) {
  const safe = sanitizeFallenProgress(state);
  const room = FALLEN_ROOM_BY_ID[roomId];
  if (!room) return false;
  if (room.fallenOptional) return fallenRegionUnlocked(safe, FALLEN_REGION_COUNT - 1);
  if (!fallenRegionUnlocked(safe, room.fallenRegion - 1)) return false;
  if (room.fallenSlot <= 0) return true;
  return safe.rooms[room.id - FALLEN_ROOM_START - 1] === true;
}

export function fallenBossUnlocked(state, bossId) {
  const safe = sanitizeFallenProgress(state);
  const boss = FALLEN_BOSS_BY_ID[bossId];
  if (!boss) return false;
  if (boss.optional) return fallenRegionUnlocked(safe, FALLEN_REGION_COUNT - 1);
  return safe.rooms[boss.roomIndex - FALLEN_ROOM_START - 1] === true;
}

export function recordFallenRoom(state, roomId) {
  const safe = state || defaultFallenProgress();
  const room = FALLEN_ROOM_BY_ID[roomId];
  if (!room || room.fallenBoss || room.fallenOptional) return { ok: false };
  const local = room.id - FALLEN_ROOM_START;
  const firstClear = safe.rooms[local] !== true;
  safe.rooms[local] = true;
  const region = FALLEN_REGIONS[room.fallenRegion - 1];
  const regionDone = safe.rooms
    .slice(region.index * FALLEN_ROOMS_PER_REGION, region.index * FALLEN_ROOMS_PER_REGION + FALLEN_ROOMS_PER_REGION - 1)
    .every(Boolean);
  if (regionDone) safe.movement = Math.max(safe.movement || 0, Math.min(FALLEN_MOVEMENTS.length - 1, region.index + 2));
  return { ok: true, firstClear, regionDone };
}

export function recordFallenBoss(state, bossId) {
  const safe = state || defaultFallenProgress();
  const boss = FALLEN_BOSS_BY_ID[bossId];
  if (!boss) return { ok: false };
  if (!fallenBossUnlocked(safe, bossId)) return { ok: false, reason: 'locked' };
  const firstClear = safe.bosses[bossId] !== true;
  safe.bosses[bossId] = true;
  safe.rooms[boss.roomIndex - FALLEN_ROOM_START] = true;
  if (boss.ability && !safe.abilities.includes(boss.ability)) safe.abilities.push(boss.ability);
  if (!safe.archive.bosses.includes(bossId)) safe.archive.bosses.push(bossId);
  if (firstClear) safe.shards = (safe.shards || 0) + (boss.shards || 0);
  if (!boss.optional) {
    const regionIndex = FALLEN_REGIONS.findIndex((r) => r.boss === bossId);
    if (regionIndex >= 0) safe.movement = Math.max(safe.movement || 0, Math.min(FALLEN_MOVEMENTS.length - 1, regionIndex + 2));
  }
  return {
    ok: true,
    firstClear,
    ability: boss.ability,
    shards: firstClear ? boss.shards : 0,
    complete: FALLEN_MAIN_BOSSES.every((b) => safe.bosses[b.id]),
  };
}

export function recordFallenRoomClear(state, room) {
  if (!room) return { ok: false };
  if (room.fallenBoss) return recordFallenBoss(state, room.fallenBoss);
  return recordFallenRoom(state, room.id);
}

export function recordFallenEnding(state, endingId, { optionalCleared = null } = {}) {
  const safe = state || defaultFallenProgress();
  const ending = FALLEN_ENDING_BY_ID[endingId];
  if (!ending) return { ok: false, reason: 'unknown' };
  if (!safe.bosses.seraphiel) return { ok: false, reason: 'locked' };
  const clearedOptional = optionalCleared == null
    ? FALLEN_OPTIONAL_BOSSES.every((b) => safe.bosses[b.id])
    : !!optionalCleared;
  if (ending.id === 'eclipse' && !clearedOptional) return { ok: false, reason: 'optional_required' };
  const firstTime = safe.endings[endingId] !== true;
  safe.endings[endingId] = true;
  safe.ending = endingId;
  if (endingId === 'dusk') safe.choices.spared += 1;
  else if (endingId === 'dawn') safe.choices.struck += 1;
  safe.movement = FALLEN_MOVEMENTS.length - 1;
  return { ok: true, firstTime, ending };
}

export function recordFallenDeath(state) {
  const safe = state || defaultFallenProgress();
  safe.deaths = (safe.deaths || 0) + 1;
  return { ok: true, deaths: safe.deaths };
}

export function recordFallenRun(state, seconds = 0, { won = false } = {}) {
  const safe = state || defaultFallenProgress();
  safe.runs = (safe.runs || 0) + 1;
  const time = Math.max(0, Number(seconds) || 0);
  if (won && time > 0 && (!safe.bestTime || time < safe.bestTime)) safe.bestTime = round1(time);
  return { ok: true, runs: safe.runs, bestTime: safe.bestTime };
}

export function buyFallenUpgrade(state, id) {
  const safe = state || defaultFallenProgress();
  const upgrade = FALLEN_UPGRADE_BY_ID[id];
  if (!upgrade) return { ok: false, reason: 'unknown' };
  const tier = safe.upgrades[id] || 0;
  if (tier >= upgrade.tiers.length) return { ok: false, reason: 'maxed' };
  const cost = upgrade.tiers[tier].cost;
  if (safe.shards < cost) return { ok: false, reason: 'shards', cost, shards: safe.shards };
  safe.shards -= cost;
  safe.upgrades[id] = tier + 1;
  return { ok: true, tier: tier + 1, cost, shards: safe.shards, value: upgrade.tiers[tier].value };
}

export function equipFallenWeapon(state, weaponId) {
  const safe = state || defaultFallenProgress();
  if (!FALLEN_WEAPON_BY_ID[weaponId]) return { ok: false };
  const cost = FALLEN_WEAPON_BY_ID[weaponId].cost;
  if (cost > 0 && safe.shards < cost) return { ok: false, reason: 'shards' };
  if (cost > 0 && safe.weapon !== weaponId) safe.shards -= cost;
  safe.weapon = weaponId;
  return { ok: true, weapon: weaponId, shards: safe.shards };
}

export function chooseFallenBoon(state, boonId) {
  const safe = state || defaultFallenProgress();
  if (!FALLEN_BOON_BY_ID[boonId]) return { ok: false };
  if (safe.boons.includes(boonId)) return { ok: false, reason: 'owned' };
  safe.boons.push(boonId);
  return { ok: true, boon: FALLEN_BOON_BY_ID[boonId] };
}

export function addFallenShards(state, amount) {
  const safe = state || defaultFallenProgress();
  const gain = Math.max(0, Math.floor(Number(amount) || 0));
  safe.shards = (safe.shards || 0) + gain;
  return { ok: true, gained: gain, shards: safe.shards };
}

export function setFallenMenuTheme(state, theme) {
  const safe = state || defaultFallenProgress();
  safe.menuTheme = theme === 'base' ? 'base' : 'heavenly';
  return { ok: true, theme: safe.menuTheme };
}

export function fallenSummary(state) {
  const safe = sanitizeFallenProgress(state);
  const roomsCleared = safe.rooms.filter(Boolean).length;
  const bossesCleared = FALLEN_BOSSES.filter((boss) => safe.bosses[boss.id]).length;
  const mainCleared = FALLEN_MAIN_BOSSES.filter((boss) => safe.bosses[boss.id]).length;
  const optionalCleared = FALLEN_OPTIONAL_BOSSES.filter((boss) => safe.bosses[boss.id]).length;
  const regionsCleared = FALLEN_REGIONS.filter((region) => safe.bosses[region.boss]).length;
  const endingsFound = FALLEN_ENDINGS.filter((ending) => safe.endings[ending.id]).length;
  return {
    ascended: safe.ascended,
    roomsCleared,
    roomTotal: FALLEN_ROOM_COUNT,
    bossesCleared,
    bossTotal: FALLEN_BOSS_COUNT,
    mainCleared,
    mainTotal: FALLEN_MAIN_BOSSES.length,
    optionalCleared,
    optionalTotal: FALLEN_OPTIONAL_BOSSES.length,
    regionsCleared,
    regionTotal: FALLEN_REGION_COUNT,
    endingsFound,
    endingTotal: FALLEN_ENDINGS.length,
    ending: safe.ending,
    shards: safe.shards,
    echoes: safe.echoes,
    abilities: safe.abilities,
    percent: Math.round(((regionsCleared + endingsFound) / (FALLEN_REGION_COUNT + FALLEN_ENDINGS.length)) * 100),
    movement: safe.movement,
    runs: safe.runs,
    deaths: safe.deaths,
    bestTime: safe.bestTime,
    complete: mainCleared >= FALLEN_MAIN_BOSSES.length,
  };
}

// The kneeling figure on the second menu rises as the arc advances.
export function fallenMenuFigure(state) {
  const safe = sanitizeFallenProgress(state);
  if (safe.ending && FALLEN_ENDING_BY_ID[safe.ending]) {
    return { pose: FALLEN_ENDING_BY_ID[safe.ending].figure, color: FALLEN_ENDING_BY_ID[safe.ending].color, ending: safe.ending };
  }
  const regions = FALLEN_REGIONS.filter((region) => safe.bosses[region.boss]).length;
  const pose = regions >= 5 ? 'rising' : regions >= 2 ? 'kneeling_alert' : 'kneeling';
  return { pose, color: '#3a1c1c', ending: null, regions };
}

export function fallenArchive(state) {
  const safe = sanitizeFallenProgress(state);
  return {
    bestiary: FALLEN_ENEMY_IDS.map((id) => ({ ...FALLEN_ENEMY_INFO[id], seen: safe.archive.bestiary.includes(id) })),
    bosses: FALLEN_BOSSES.map((boss) => ({ ...boss, cleared: safe.bosses[boss.id] === true })),
    endings: FALLEN_ENDINGS.map((ending) => ({ ...ending, found: safe.endings[ending.id] === true })),
    abilities: FALLEN_ABILITIES.map((ability) => ({ ...ability, earned: safe.abilities.includes(ability.id) })),
    echoes: FALLEN_ECHOES.map((echo) => ({ ...echo, earned: safe.echoes.includes(echo.id) })),
  };
}

export function fallenRunConfig(state, regionIndex) {
  const safe = sanitizeFallenProgress(state);
  const region = FALLEN_REGIONS[clamp(asInt(regionIndex), 0, FALLEN_REGION_COUNT - 1)];
  const echoes = safe.echoes.slice(0, ECHO_CAP);
  const run = createFallenRun({
    abilities: safe.abilities,
    echoes,
    upgrades: safe.upgrades,
    weapon: safe.weapon,
    curses: safe.curses,
  });
  return { region, run, shardBonus: 1 + run.curses.reduce((sum, id) => sum + (FALLEN_CURSE_BY_ID[id]?.reward || 0), 0) };
}

// Deterministic boon roll for reward chambers: seeded by run + room so the
// same descent always offers the same three relics.
export function fallenBoonChoices(seed, count = 3) {
  const pool = FALLEN_BOONS.slice();
  const out = [];
  let s = Math.abs(Math.floor(Number(seed) || 1)) % 2147483647 || 1;
  const take = Math.min(count, pool.length);
  for (let i = 0; i < take; i += 1) {
    s = (s * 48271) % 2147483647;
    const index = s % pool.length;
    out.push(pool[index].id);
    pool.splice(index, 1);
  }
  return out;
}
