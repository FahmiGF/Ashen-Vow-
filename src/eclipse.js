// Ashen Vow — UPDATE VIII: ECLIPSE OF THE FORGOTTEN GODS
// Arc VIII campaign data, Combat Evolution 2.0, new classes/weapons,
// Godfall Ascension, guilds/raids, Awakening, save integrity and performance
// policy. This module is pure: no DOM, canvas, audio or browser storage.
//
// Arc VIII global room ids continue after Arc VI:
//   525–560  30 standard halls + 6 separate boss chambers
//   561      The First Author (secret, six fragments)
//   562–661  Godfall Ascension floors 1–100
// No legacy room is renumbered.

export const ECLIPSE_VERSION = 1;
export const ECLIPSE_GAME_VERSION = '0.18.0';
export const ECLIPSE_ARC_ID = 'eclipse';
export const ECLIPSE_ARC_NUMBER = 8;
export const ECLIPSE_NAME = 'Eclipse of the Forgotten Gods';
export const ECLIPSE_LOCAL_NAME = 'Gerhana Dewa yang Terlupakan';
export const ECLIPSE_SUBTITLE = 'Peradaban yang lebih tua dari para dewa bangkit di bawah gerhana yang tidak pernah berakhir.';
export const ECLIPSE_PITCH = 'Di bawah Heart of Creation, tulisan kuno menyebut tujuh dewa yang dihapus dari sejarah. Segel mereka retak.';

export const ECLIPSE_ROOM_START = 525;
export const ECLIPSE_BIOME_COUNT = 6;
export const ECLIPSE_LEVELS_PER_BIOME = 5;
export const ECLIPSE_STANDARD_LEVEL_COUNT = 30;
export const ECLIPSE_BOSS_ROOM_COUNT = 6;
export const ECLIPSE_SECRET_ROOM_ID = 561;
export const ECLIPSE_CAMPAIGN_ROOM_COUNT = 37;
export const ECLIPSE_STANDARD_ENEMIES = 20;
export const ECLIPSE_ARCHETYPE_COUNT = 4;
export const ECLIPSE_ELITES_PER_STAGE = 1;
export const ECLIPSE_FRAGMENT_COUNT = 6;
export const ECLIPSE_WORLD_W = 1400;
export const ECLIPSE_FLOOR_Y = 470;

export const GODFALL_ROOM_START = 562;
export const GODFALL_FLOOR_COUNT = 100;
export const GODFALL_ROOM_COUNT = 100;
export const GODFALL_MILESTONE_STEP = 25;

const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);
const asInt = (value, fallback = 0) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
};
const round = (value, places = 2) => {
  const f = 10 ** places;
  return Math.round((Number(value) || 0) * f) / f;
};

// ── six forgotten biomes ───────────────────────────────────────────────────
const BIOME_SOURCE = [
  {
    id: 'obsidian_kingdom',
    name: 'The Obsidian Kingdom',
    localName: 'Kerajaan Obsidian',
    subtitle: 'A black-stone court beneath an ancient eclipse',
    theme: 'Kota batu hitam yang tertimbun di bawah gerhana pertama.',
    gimmick: 'Royal shadows repeat every third attack; arena barriers close one lane during the king fight.',
    glyph: '♜',
    color: '#b7a6d9',
    music: 'forgotten',
    particle: 'ash',
    palette: { top: '#060508', mid: '#1b1424', low: '#46354f', glow: '#d8c6ff', fog: '#2b2135' },
    levels: ['Forgotten Gates', 'Obsidian Market', 'Blackstone District', 'The Royal Crypt', 'Eclipse Palace'],
    enemies: [
      ['obsidian_guard', 'Obsidian Guard', 'Tomb Sentinel', 'chaser', 150, 19, 112, '#a99ac4', 'Pedang batu hitam yang bergerak tanpa bayangan.'],
      ['eclipse_archer', 'Eclipse Archer', 'Veiled Marksman', 'ranged', 118, 22, 88, '#cbb8e8', 'Memanah dari balik gerhana, memaksa pemain berpindah.'],
      ['shadow_caster', 'Shadow Caster', 'Court Sorcerer', 'ranged', 132, 25, 78, '#8f78b8', 'Mengubah bayangan aula menjadi proyektil.'],
      ['blackstone_sentinel', 'Blackstone Sentinel', 'Royal Bulwark', 'slam', 310, 29, 64, '#80708f', 'Perisai batu yang menghukum serangan tanpa jeda.'],
      ['royal_eclipse_executioner', 'Royal Eclipse Executioner', 'Elite Guaranteed', 'lunge', 620, 42, 102, '#e3c07a', 'Algojo kerajaan; tebasan vertikalnya membelah lantai.'],
    ],
    boss: {
      id: 'obsidian_king', name: 'The Obsidian King', localName: 'Raja Obsidian', title: 'The Crown Beneath the Eclipse',
      pattern: 'summon', maxHp: 4300, w: 188, h: 196, contact: 30, phases: 3, color: '#c4addd', glyph: '♛',
      summonType: 'obsidian_guard',
      mechanics: ['Shadow projections', 'Arena barriers', 'Summoned guards', 'Changing royal arena'],
      forms: [
        { id: 'throne', name: 'The Obsidian King', title: 'The Crown Beneath the Eclipse', arena: { id: 'royal_court', condition: 'Royal shadows divide the hall.', weather: 'Eclipse' } },
        { id: 'crypt', name: 'The Obsidian King, Unsealed', title: 'The Crypt Remembers', arena: { id: 'royal_crypt', condition: 'The floor opens into the royal crypt.', weather: 'Black rain' } },
        { id: 'crown', name: 'The Obsidian King, Crownless', title: 'The Last Black Stone', arena: { id: 'broken_throne', condition: 'The throne falls; only the crown remains.', weather: 'Collapsed sky' } },
      ],
      lines: [
        'Kerajaanku tidak pernah jatuh. Ia hanya menunggu di bawah cahaya yang salah.',
        'Bayangan adalah rakyatku yang paling setia. Mereka tidak pernah bertanya siapa yang duduk di takhta.',
        'Mahkota ini terlalu berat untuk dewa. Mungkin cukup berat untukmu.',
        'Akhirnya... aula ini boleh kosong.',
      ],
    },
  },
  {
    id: 'celestial_graveyard',
    name: 'The Celestial Graveyard',
    localName: 'Pemakaman Celestial',
    subtitle: 'Where forgotten celestial beings were sealed',
    theme: 'Makam bintang-bintang yang dikubur sebelum fajar pertama.',
    gimmick: 'Grave platforms fade every few seconds; celestial hazards mark the floor with falling starlight.',
    glyph: '✶',
    color: '#a9c7e8',
    music: 'lastvigil',
    particle: 'stars',
    palette: { top: '#050812', mid: '#17243a', low: '#3f5e78', glow: '#d7ecff', fog: '#263e55' },
    levels: ['Fallen Starfield', 'Grave of the First Light', 'Shattered Tombs', 'The Silent Cathedral', 'Eternal Burial Ground'],
    enemies: [
      ['starless_wraith', 'Starless Wraith', 'The Unlit', 'ranged', 138, 23, 94, '#9ebbe0', 'Hantu tanpa bintang yang menembak cahaya dingin.'],
      ['gravebound_archer', 'Gravebound Archer', 'Tomb Watch', 'lunge', 160, 20, 104, '#b9cfe6', 'Pemanah yang bangkit setiap kali makam bergetar.'],
      ['astral_tombkeeper', 'Astral Tombkeeper', 'Keeper of Names', 'slam', 290, 28, 68, '#7f9bb5', 'Menjaga nama-nama yang tidak boleh diingat.'],
      ['fallen_celestial', 'Fallen Celestial', 'Broken Halo', 'hopper', 220, 31, 118, '#d9e8ff', 'Melompat dari platform yang memudar.'],
      ['starless_grave_knight', 'Starless Grave Knight', 'Elite Guaranteed', 'lunge', 650, 41, 96, '#e8d08a', 'Ksatria makam dengan tombak bintang yang padam.'],
    ],
    boss: {
      id: 'gravekeeper_of_eternity', name: 'The Gravekeeper of Eternity', localName: 'Penjaga Makam Keabadian', title: 'The Hand That Buried Light',
      pattern: 'ring', maxHp: 4700, w: 178, h: 188, contact: 28, phases: 3, color: '#b6d4ef', glyph: '✟',
      summonType: 'starless_wraith',
      mechanics: ['Summoned spectral guardians', 'Changing platforms', 'Celestial arena hazards'],
      forms: [
        { id: 'starfield', name: 'The Gravekeeper of Eternity', title: 'The Hand That Buried Light', arena: { id: 'falling_stars', condition: 'Starlight falls in timed columns.', weather: 'Starfall' } },
        { id: 'tombs', name: 'The Gravekeeper, Risen', title: 'Every Grave Opens', arena: { id: 'open_tombs', condition: 'The tombs open; platforms drift apart.', weather: 'Grave mist' } },
        { id: 'burial', name: 'The Gravekeeper, Nameless', title: 'The Last Burial', arena: { id: 'eternal_burial', condition: 'The arena becomes a single burial ground.', weather: 'Silent sky' } },
      ],
      lines: [
        'Aku mengubur cahaya pertama supaya dunia punya malam. Kau datang menggalinya kembali.',
        'Setiap bintang yang kau lihat adalah lampu makam yang lupa kumatikan.',
        'Nama-nama mereka sudah hilang. Mengapa kau masih membawa namamu?',
        'Tutup pintunya... aku lelah menjaga yang tidak ingin diingat.',
      ],
    },
  },
  {
    id: 'shattered_clockwork',
    name: 'The Shattered Clockwork',
    localName: 'Jam Raksasa yang Pecah',
    subtitle: 'A civilization that tried to rule time',
    theme: 'Kota mesin yang mencoba mengunci waktu dan gagal.',
    gimmick: 'Temporary arena slowdowns, repeating attack patterns, moving platforms and time switches.',
    glyph: '⚙',
    color: '#d8b77b',
    music: 'clockwork',
    particle: 'glass',
    palette: { top: '#0c0905', mid: '#302619', low: '#75603d', glow: '#ffe6ad', fog: '#4c3d28' },
    levels: ['Rusted Clockworks', 'The Gear District', 'Broken Time Bridge', 'Eternal Machinery', 'The Clockwork Throne'],
    enemies: [
      ['gearbound_soldier', 'Gearbound Soldier', 'Minute Guard', 'chaser', 170, 22, 106, '#d2b27c', 'Tentara yang berbaris mengikuti detak mesin.'],
      ['clockwork_archer', 'Clockwork Archer', 'Second Hand', 'ranged', 140, 24, 92, '#e4c892', 'Memanah tepat pada interval yang bisa diprediksi.'],
      ['timekeeper_mage', 'Timekeeper Mage', 'The Interval', 'ranged', 155, 27, 82, '#c6a26a', 'Memperlambat ruang di sekitar proyektilnya.'],
      ['mechanical_guardian', 'Mechanical Guardian', 'Mainspring', 'slam', 340, 31, 64, '#96794d', 'Menghentak lantai dan memutar ulang pola serangan.'],
      ['chrono_colossus', 'Chrono Colossus', 'Elite Guaranteed', 'slam', 760, 44, 72, '#ffd98a', 'Raksasa jam yang menghitung setiap kesalahanmu.'],
    ],
    boss: {
      id: 'first_chronomancer', name: 'The First Chronomancer', localName: 'Kronomancer Pertama', title: 'The Hand on the First Second',
      pattern: 'charge', maxHp: 5200, w: 176, h: 190, contact: 30, phases: 4, color: '#ffd88a', glyph: '◷',
      mechanics: ['Arena slowdowns', 'Repeating attack patterns', 'Moving platforms', 'Time switches', 'Multiple phases'],
      forms: [
        { id: 'gears', name: 'The First Chronomancer', title: 'The Hand on the First Second', arena: { id: 'gear_district', condition: 'The gears speed up every ten seconds.', weather: 'Brass dust' } },
        { id: 'bridge', name: 'The First Chronomancer, Rewound', title: 'The Bridge That Never Was', arena: { id: 'broken_bridge', condition: 'Platforms move between the past and present.', weather: 'Time fracture' } },
        { id: 'machinery', name: 'The First Chronomancer, Stopped', title: 'The Machine Without a Second', arena: { id: 'eternal_machinery', condition: 'The arena stops; only the boss moves.', weather: 'Frozen second' } },
        { id: 'throne', name: 'The First Chronomancer, Unmade', title: 'The Clockwork Throne', arena: { id: 'clockwork_throne', condition: 'Every gear turns backward.', weather: 'Collapsing time' } },
      ],
      lines: [
        'Aku memberi dunia detik pertama. Kau menghabiskannya untuk menaiki tangga ini.',
        'Setiap seranganmu sudah terjadi. Aku hanya belum memutuskan kapan kau boleh merasakannya.',
        'Waktu tidak menyembuhkan. Ia hanya mengulang luka sampai kau hafal bentuknya.',
        'Jika aku berhenti, apakah dunia ikut berhenti... atau akhirnya mulai?',
        'Detik terakhir ini milikku. Ambillah, kalau kau bisa menahannya.',
      ],
    },
  },
  {
    id: 'hollow_divinity',
    name: 'The Hollow Divinity',
    localName: 'Ketuhanan Kosong',
    subtitle: 'The remains of a temple to gods who were erased',
    theme: 'Kuil tanpa dewa, penuh idola yang menunggu nama.',
    gimmick: 'Ability restrictions are telegraphed, idol puzzles open paths, and the sanctum changes during the fight.',
    glyph: '☥',
    color: '#cbb3a0',
    music: 'reliquary',
    particle: 'motes',
    palette: { top: '#0a0807', mid: '#2b2420', low: '#67584d', glow: '#f2ddc8', fog: '#423932' },
    levels: ['Temple Entrance', 'Hall of Idols', 'Forgotten Sacrarium', 'The Broken Altar', 'Sanctum of Silence'],
    enemies: [
      ['hollow_disciple', 'Hollow Disciple', 'The Unnamed', 'chaser', 165, 22, 110, '#c6b19d', 'Murid yang berdoa kepada ruang kosong.'],
      ['idol_guardian', 'Idol Guardian', 'Stone Prayer', 'slam', 330, 30, 62, '#a9937d', 'Patung yang bergerak ketika doanya dijawab.'],
      ['sacred_flame_caster', 'Sacred Flame Caster', 'Votive Fire', 'ranged', 145, 27, 84, '#e7b982', 'Api altar yang tidak membakar, hanya menghapus.'],
      ['forgotten_knight', 'Forgotten Knight', 'The Empty Oath', 'lunge', 260, 30, 102, '#b5a18d', 'Ksatria yang lupa untuk siapa ia berlutut.'],
      ['hollow_archon', 'Hollow Archon', 'Elite Guaranteed', 'ranged', 680, 45, 90, '#f0d7a8', 'Archon tanpa wajah; serangannya membisikkan nama kosong.'],
    ],
    boss: {
      id: 'silent_divinity', name: 'The Silent Divinity', localName: 'Dewa yang Bisu', title: 'The Answer That Never Came',
      pattern: 'nova', maxHp: 5500, w: 184, h: 194, contact: 28, phases: 3, color: '#e4ccb4', glyph: '☥',
      summonType: 'idol_guardian',
      mechanics: ['Temporary ability restrictions with warnings', 'Environmental puzzles', 'Summoned idols', 'Changing arena'],
      forms: [
        { id: 'idols', name: 'The Silent Divinity', title: 'The Answer That Never Came', arena: { id: 'hall_of_idols', condition: 'Idols block one ability at a time.', weather: 'Candle smoke' } },
        { id: 'altar', name: 'The Silent Divinity, Broken', title: 'The Altar Without a Name', arena: { id: 'broken_altar', condition: 'The altar splits; idols rearrange.', weather: 'Ash of prayers' } },
        { id: 'silence', name: 'The Silent Divinity, Listening', title: 'Sanctum of Silence', arena: { id: 'sanctum_silence', condition: 'No sound; warnings become visual only.', weather: 'Perfect silence' } },
      ],
      lines: [
        'Mereka berdoa, dan aku tidak menjawab. Itu satu-satunya keajaiban yang tersisa.',
        'Kau membawa suara ke rumahku. Apakah kau tahu berapa lama aku tidak mendengar namaku?',
        'Jangan minta jawaban. Minta saja hening yang lebih panjang.',
        'Bisu ini bukan hukuman. Ia adalah satu-satunya hal yang tidak bisa mereka ambil.',
      ],
    },
  },
  {
    id: 'eternal_eclipse',
    name: 'The Eternal Eclipse',
    localName: 'Gerhana Abadi',
    subtitle: 'A region where daylight and darkness are locked together',
    theme: 'Medan pertempuran yang terjebak di antara siang dan malam.',
    gimmick: 'Light and shadow zones change attack patterns; the arena layout shifts with the active eclipse.',
    glyph: '◐',
    color: '#e0b36d',
    music: 'lastvigil',
    particle: 'ash',
    palette: { top: '#0b0804', mid: '#352718', low: '#82642f', glow: '#ffe1a1', fog: '#574329' },
    levels: ['Duskbound Fields', 'Twilight Fortress', 'Black Sun Observatory', 'The Eclipse Corridor', 'Throne of Dusk'],
    enemies: [
      ['dusk_hunter', 'Dusk Hunter', 'The Long Shadow', 'chaser', 180, 24, 118, '#d2ad72', 'Berburu di garis antara petang dan malam.'],
      ['eclipse_knight', 'Eclipse Knight', 'Half-Light', 'lunge', 290, 31, 102, '#e0c18a', 'Ksatria yang berganti sisi setiap kali gerhana berdenyut.'],
      ['solar_shade', 'Solar Shade', 'Black Sun', 'ranged', 150, 28, 88, '#d6b47b', 'Bayangan matahari yang menembak panas gelap.'],
      ['twilight_guardian', 'Twilight Guardian', 'The Border', 'slam', 350, 33, 66, '#a98755', 'Menjaga perbatasan yang seharusnya tidak ada.'],
      ['eclipse_sovereign', 'Eclipse Sovereign', 'Elite Guaranteed', 'lunge', 720, 46, 108, '#ffd88a', 'Penguasa gerhana; kecepatannya berubah saat cahaya berganti.'],
    ],
    boss: {
      id: 'eclipse_monarch', name: 'The Eclipse Monarch', localName: 'Monark Gerhana', title: 'The Crown of Two Skies',
      pattern: 'rain', maxHp: 5900, w: 192, h: 198, contact: 32, phases: 4, color: '#ffd58a', glyph: '◑',
      summonType: 'solar_shade',
      mechanics: ['Light and shadow zones', 'Changing arena layouts', 'Eclipse-state attack patterns'],
      forms: [
        { id: 'dusk', name: 'The Eclipse Monarch', title: 'The Crown of Two Skies', arena: { id: 'dusk_fields', condition: 'Day and night split the arena.', weather: 'Eternal dusk' } },
        { id: 'twilight', name: 'The Eclipse Monarch, Veiled', title: 'Twilight Fortress', arena: { id: 'twilight_fortress', condition: 'The fortress rotates; shadow lanes move.', weather: 'Twilight' } },
        { id: 'black_sun', name: 'The Eclipse Monarch, Unmasked', title: 'The Black Sun', arena: { id: 'black_sun', condition: 'The sun goes dark; only silhouettes remain.', weather: 'Black sun' } },
        { id: 'dusk_throne', name: 'The Eclipse Monarch, Crowned', title: 'Throne of Dusk', arena: { id: 'throne_of_dusk', condition: 'Light and shadow swap continuously.', weather: 'Eclipse eternal' } },
      ],
      lines: [
        'Rakyatku meminta matahari dan bulan sekaligus. Aku memberi mereka gerhana.',
        'Kau tidak bisa melawan cahaya dan bayangan pada saat yang sama. Aku sudah mencoba.',
        'Setiap sisi takhta ini punya wajahnya sendiri. Yang mana yang ingin kau bunuh?',
        'Jika gerhana berakhir, rakyatku akan melihat apa yang mereka sembah. Jangan lakukan itu.',
        'Biarkan malam menang sebentar. Hanya sebentar.',
      ],
    },
  },
  {
    id: 'throne_beyond_creation',
    name: 'The Throne Beyond Creation',
    localName: 'Takhta di Luar Penciptaan',
    subtitle: 'The final domain of the forgotten pantheon',
    theme: 'Ruang di luar hukum penciptaan, tempat nama dewa disimpan.',
    gimmick: 'Memory sequences reorder the arena; every phase combines earlier bosses and strips one law of combat.',
    glyph: '♾',
    color: '#dfc17c',
    music: 'bossJudge',
    particle: 'halos',
    palette: { top: '#0a0804', mid: '#302815', low: '#7a6738', glow: '#fff0b8', fog: '#514428' },
    levels: ['Beyond the Seal', 'Hall of Forgotten Gods', 'The First Creation', 'Divine Memory Chamber', 'Throne Beyond Creation'],
    enemies: [
      ['ancient_godling', 'Ancient Godling', 'The First Draft', 'chaser', 240, 29, 112, '#e1cb98', 'Dewa kecil yang belum sempat diberi nama.'],
      ['pantheon_warden', 'Pantheon Warden', 'Keeper of the Seven', 'slam', 430, 38, 68, '#c8b487', 'Penjaga yang menghitung dewa yang tersisa.'],
      ['forgotten_herald', 'Forgotten Herald', 'The Missing Name', 'ranged', 195, 32, 92, '#e0cfaa', 'Membawa titah dari dewa yang tidak ada.'],
      ['primordial_knight', 'Primordial Knight', 'Before Oaths', 'lunge', 330, 36, 108, '#bca77a', 'Ksatria dari sebelum sumpah ditemukan.'],
      ['godslayer_sentinel', 'Godslayer Sentinel', 'Elite Guaranteed', 'lunge', 820, 52, 100, '#fff0b8', 'Elite terakhir; pedangnya pernah membunuh dewa.'],
    ],
    boss: {
      id: 'forgotten_high_god', name: 'The Forgotten High God', localName: 'Dewa Tinggi yang Terlupakan', title: 'The Name Behind the Seal',
      pattern: 'nova', maxHp: 7600, w: 220, h: 216, contact: 38, phases: 4, color: '#ffe8ac', glyph: '♾',
      summonType: 'ancient_godling',
      mechanics: ['Four distinct phases', 'Law-breaking arena', 'Summoned godlings', 'Memory sequences'],
      forms: [
        { id: 'seal', name: 'The Forgotten High God', title: 'The Name Behind the Seal', arena: { id: 'beyond_seal', condition: 'The seal has no floor except memory.', weather: 'Unwritten' } },
        { id: 'pantheon', name: 'The High God, Remembered', title: 'Hall of Forgotten Gods', arena: { id: 'pantheon_hall', condition: 'Statues of six gods judge every hit.', weather: 'Divine ash' } },
        { id: 'creation', name: 'The High God, First Draft', title: 'The First Creation', arena: { id: 'first_creation', condition: 'The arena is rewritten between phases.', weather: 'Genesis' } },
        { id: 'throne', name: 'The High God, Unsealed', title: 'Throne Beyond Creation', arena: { id: 'beyond_creation', condition: 'No laws bind either combatant.', weather: 'Creation collapses' } },
      ],
      lines: [
        'Tujuh dewa menulis hukum. Aku menulis nama mereka, lalu menghapusnya.',
        'Kau memanggilku terlupakan. Aku yang memilih dilupakan.',
        'Setiap fase yang kau lihat adalah versi dunia yang aku tolak.',
        'Bahkan dewa bisa lelah menjadi alasan. Apakah kau akan menjadi alasan berikutnya?',
        'Kalau kau menang, jangan menulis namaku. Biarkan aku tetap hilang.',
      ],
    },
  },
];

export const ECLIPSE_BIOMES = BIOME_SOURCE.map((biome, index) => ({
  ...biome,
  index,
  roomStart: ECLIPSE_ROOM_START + index * 6,
  bossRoom: ECLIPSE_ROOM_START + index * 6 + 5,
  final: index === BIOME_SOURCE.length - 1,
  fragment: `fragment_${index + 1}`,
}));

export const ECLIPSE_BIOME_BY_ID = Object.fromEntries(ECLIPSE_BIOMES.map((biome) => [biome.id, biome]));

// ── enemies ────────────────────────────────────────────────────────────────
export const ECLIPSE_ENEMY_INFO = {};
const ECLIPSE_ENEMY_IDS = [];
for (const biome of ECLIPSE_BIOMES) {
  for (const [id, name, localName, behavior, hp, dmg, speed, color, desc] of biome.enemies) {
    const elite = id === biome.enemies.at(-1)[0];
    ECLIPSE_ENEMY_INFO[id] = {
      id, name, localName, title: elite ? 'Elite Guaranteed' : behavior, behavior, hp, dmg, speed,
      w: elite ? 84 : behavior === 'slam' ? 70 : 46,
      h: elite ? 106 : behavior === 'slam' ? 86 : 62,
      reward: elite ? 95 : 28 + biome.index * 4,
      color, glyph: elite ? '✹' : biome.glyph,
      elite, flying: behavior === 'ranged' && (biome.id === 'celestial_graveyard' || biome.id === 'hollow_divinity'),
      eclipse: true, chapter: 8, danger: elite ? 'SANGAT TINGGI' : 'TINGGI',
      desc, where: ECLIPSE_NAME, biome: biome.id, childType: null,
    };
    ECLIPSE_ENEMY_IDS.push(id);
  }
}
export { ECLIPSE_ENEMY_IDS };

const FORMATION = [
  [7, 5, 5, 3],
  [6, 6, 4, 4],
  [7, 4, 5, 4],
];

export function eclipseStageEnemies(biomeIndex, slot) {
  const biome = ECLIPSE_BIOMES[clamp(asInt(biomeIndex), 0, ECLIPSE_BIOME_COUNT - 1)];
  if (!biome) return [];
  const base = biome.enemies.slice(0, 4).map((enemy) => enemy[0]);
  const elite = biome.enemies[4][0];
  const counts = FORMATION[(biome.index + clamp(asInt(slot), 0, 4)) % FORMATION.length];
  const list = [];
  counts.forEach((count, index) => {
    for (let i = 0; i < count; i += 1) list.push(base[index]);
  });
  list[(biome.index * 3 + slot * 5) % 9] = elite;
  return list;
}

// ── bosses ─────────────────────────────────────────────────────────────────
function thresholdsFor(phases) {
  if (phases === 5) return [0.8, 0.6, 0.4, 0.2];
  if (phases === 4) return [0.75, 0.5, 0.25];
  if (phases === 3) return [0.66, 0.33];
  return [0.5];
}

function dialogueFor(source) {
  const dialogue = {
    intro: [
      { speaker: source.name, text: source.lines[0] },
      { speaker: 'The Oathbound', text: 'Sejarah boleh menghapus namamu. Aku hanya perlu menghapus mahkotamu.' },
    ],
    defeat: [{ speaker: source.name, text: source.lines.at(-1) }],
  };
  for (let phase = 2; phase <= source.phases; phase += 1) {
    dialogue[`phase${phase}`] = [{ speaker: source.name, text: source.lines[phase - 1] || source.lines.at(-2) }];
  }
  return dialogue;
}

export const ECLIPSE_BOSSES = ECLIPSE_BIOMES.map((biome) => {
  const source = biome.boss;
  return {
    ...source,
    kind: `eclipse_${source.id}`,
    biome: biome.id,
    biomeIndex: biome.index,
    roomIndex: biome.bossRoom,
    phaseThresholds: thresholdsFor(source.phases),
    final: biome.final,
  };
});

export const ECLIPSE_BOSS_BY_ID = Object.fromEntries(ECLIPSE_BOSSES.map((boss) => [boss.id, boss]));
export const ECLIPSE_BOSS_KINDS = ECLIPSE_BOSSES.map((boss) => boss.kind);
export const ECLIPSE_BOSS_COUNT = ECLIPSE_BOSSES.length;

const SECRET_BOSS_SOURCE = {
  id: 'first_author', kind: 'eclipse_first_author', name: 'The First Author', localName: 'Penulis Pertama',
  title: 'The Hand That Wrote the Laws', pattern: 'nova', maxHp: 9800, w: 236, h: 226, contact: 42, phases: 5,
  color: '#fff3c8', glyph: '✒', biome: 'throne_beyond_creation', final: false, secret: true,
  mechanics: ['Changing arena layouts', 'Every previous boss pattern', 'Memory-based sequences', 'Summoned constructs', 'Combined final challenge'],
  lines: [
    'Aku tidak menciptakan dunia. Aku hanya menulis aturan yang membuatnya bisa disebut dunia.',
    'Kau sudah mengalahkan dewa, mesin waktu, dan makam cahaya. Itu hanya bab yang aku coret.',
    'Ingatlah ruangan pertama. Ingatlah setiap lantai yang kau pijak. Aku menulis semuanya.',
    'Sekarang aku menulis ulang kau. Satu kata per serangan.',
    'Kalau kau tetap ada setelah halaman terakhir... mungkin kau memang bukan tulisanku.',
  ],
};
for (const bonus of [
  { id: 'author_constructs', name: 'The First Author, Rewritten', title: 'The Laws Bend', at: 2 },
  { id: 'author_memory', name: 'The First Author, Remembered', title: 'Every Room Returns', at: 3 },
  { id: 'author_final', name: 'The First Author, Unwritten', title: 'The Last Page', at: 4 },
]) {
  SECRET_BOSS_SOURCE.lines.splice(bonus.at, 0, `${bonus.name}: ${bonus.title}.`);
}

export const ECLIPSE_SECRET_BOSS = {
  ...SECRET_BOSS_SOURCE,
  roomIndex: ECLIPSE_SECRET_ROOM_ID,
  phaseThresholds: thresholdsFor(5),
};

export const ECLIPSE_BOSS_INFO = {};
for (const source of [...ECLIPSE_BOSSES, ECLIPSE_SECRET_BOSS]) {
  const rest = ECLIPSE_BOSSES.filter((boss) => boss.id !== source.id);
  const forms = source.forms || Array.from({ length: source.phases }, (_, index) => ({
    id: `${source.id}_form_${index + 1}`,
    name: index === 0 ? source.name : `${source.name}, Phase ${index + 1}`,
    title: source.title,
    arena: { id: `${source.biome}_arena_${index + 1}`, condition: source.mechanics[index % source.mechanics.length], weather: ECLIPSE_BIOME_BY_ID[source.biome]?.name || ECLIPSE_NAME },
  }));
  ECLIPSE_BOSS_INFO[source.kind] = {
    id: source.id, kind: source.kind, name: source.name, localName: source.localName, title: source.title,
    eclipse: true, chapter: 8, biome: source.biome, pattern: source.pattern, maxHp: source.maxHp,
    w: source.w, h: source.h, contact: source.contact, maxPhases: source.phases,
    phaseThresholds: thresholdsFor(source.phases), mini: !source.final && !source.secret,
    major: !!source.final, final: !!source.final, secret: !!source.secret, flying: false,
    reward: source.secret ? 'secret' : source.final ? 'victory' : 'blessing',
    summonType: source.summonType || rest[0]?.biome || null,
    ashReward: source.secret ? 1500 : source.final ? 800 : 260 + source.phases * 60,
    echoReward: 0, shards: source.secret ? 100 : source.final ? 50 : 18,
    color: source.color, glyph: source.glyph, music: source.secret ? 'bossJudge' : 'bossJudge',
    spawn: { x: 760, y: ECLIPSE_FLOOR_Y - source.h },
    dialogue: dialogueFor(source), forms, mechanics: [...source.mechanics],
    desc: source.lines[0], where: `${ECLIPSE_NAME} — Arc VIII`,
  };
}

// ── campaign rooms ──────────────────────────────────────────────────────────
function gateTo(next, requires, name, secret = false) {
  return { x: 1362, y: 286, w: 34, h: 184, requires, next, name, secret };
}

function platformsFor(biome, boss = false) {
  const high = 294 + (biome.index % 3) * 22;
  const list = [
    { x: 0, y: ECLIPSE_FLOOR_Y, w: ECLIPSE_WORLD_W, h: 46 },
    { x: 148, y: high, w: 210, h: 18 },
    { x: 492, y: high - 50, w: 220, h: 18 },
    { x: 936, y: 354 - (biome.index % 4) * 14, w: 230, h: 18 },
  ];
  if (biome.index >= 2) list.push({ x: 760, y: 244, w: 150, h: 16 });
  if (boss) {
    list.push({ x: 238, y: ECLIPSE_FLOOR_Y - 138, w: 176, h: 16 });
    list.push({ x: 988, y: ECLIPSE_FLOOR_Y - 138, w: 176, h: 16 });
  }
  return list;
}

function spawnListFor(biome, slot) {
  return eclipseStageEnemies(biome.index, slot).map((type, index) => {
    const info = ECLIPSE_ENEMY_INFO[type];
    const lane = index % 4;
    return {
      type,
      x: clamp(230 + lane * 260 + ((biome.index * 43 + slot * 37 + index * 19) % 120), 130, ECLIPSE_WORLD_W - 160),
      minX: 60, maxX: ECLIPSE_WORLD_W - 90,
      elite: !!info?.elite,
      hpScale: 1 + biome.index * 0.13 + slot * 0.035,
      dmgScale: 1 + biome.index * 0.09 + slot * 0.025,
      speedScale: 1 + biome.index * 0.035,
    };
  });
}

const ECLIPSE_ROOMS = [];
for (const biome of ECLIPSE_BIOMES) {
  for (let slot = 0; slot < ECLIPSE_LEVELS_PER_BIOME; slot += 1) {
    const global = biome.roomStart + slot;
    const isFinalStage = slot === ECLIPSE_LEVELS_PER_BIOME - 1;
    const next = isFinalStage ? biome.bossRoom : global + 1;
    const room = {
      id: global, eclipse: true, eclipseBiome: biome.index + 1, eclipseBiomeId: biome.id,
      eclipseSlot: slot, eclipseStandard: true,
      name: `${biome.levels[slot]} — ${biome.localName}`,
      subtitle: `${ECLIPSE_NAME} — ${biome.name}`,
      zone: biome.id, spawn: { x: 78, y: ECLIPSE_FLOOR_Y - 46 },
      platforms: platformsFor(biome), enemies: spawnListFor(biome, slot),
      relic: null, boss: null, hint: biome.gimmick, palette: { ...biome.palette },
      particle: biome.particle, music: biome.music, condition: biome.gimmick, weather: biome.theme,
      accent: biome.color, gravityScale: 1,
      gate: gateTo(next, isFinalStage ? 'clear' : 'clear', isFinalStage ? ECLIPSE_BOSS_BY_ID[biome.boss.id]?.name || 'Boss' : biome.levels[slot + 1]),
    };
    if (slot === 0) {
      room.checkpoint = { x: 74, y: ECLIPSE_FLOOR_Y - 78, w: 38, h: 78, name: 'Forgotten Anchor' };
      room.merchant = { x: 156, y: ECLIPSE_FLOOR_Y - 96, w: 46, h: 96 };
    }
    if (slot === 3) room.checkpoint = { x: 74, y: ECLIPSE_FLOOR_Y - 84, w: 40, h: 84, name: 'Eclipse Seal' };
    ECLIPSE_ROOMS.push(room);
  }

  const boss = ECLIPSE_BOSS_BY_ID[biome.boss.id];
  const nextBiome = ECLIPSE_BIOMES[biome.index + 1];
  ECLIPSE_ROOMS.push({
    id: biome.bossRoom, eclipse: true, eclipseBiome: biome.index + 1, eclipseBiomeId: biome.id,
    eclipseSlot: ECLIPSE_LEVELS_PER_BIOME, eclipseBoss: boss.id,
    name: boss.localName, subtitle: `${ECLIPSE_NAME} — ${boss.title}`, zone: biome.id,
    spawn: { x: 78, y: ECLIPSE_FLOOR_Y - 46 }, platforms: platformsFor(biome, true),
    enemies: [], relic: null, boss: boss.kind, hint: biome.gimmick,
    palette: { ...biome.palette }, particle: biome.particle, music: biome.music,
    condition: biome.gimmick, weather: biome.theme, accent: boss.color,
    gate: nextBiome ? gateTo(nextBiome.roomStart, 'boss', nextBiome.localName) : null,
  });
}

const secretBoss = ECLIPSE_SECRET_BOSS;
ECLIPSE_ROOMS.push({
  id: ECLIPSE_SECRET_ROOM_ID, eclipse: true, eclipseSecret: true,
  eclipseBiome: ECLIPSE_BIOME_COUNT, eclipseBiomeId: 'throne_beyond_creation', eclipseBoss: secretBoss.id,
  name: secretBoss.localName, subtitle: `${ECLIPSE_NAME} — ${secretBoss.title}`, zone: 'throne_beyond_creation',
  spawn: { x: 78, y: ECLIPSE_FLOOR_Y - 46 }, platforms: platformsFor(ECLIPSE_BIOMES.at(-1), true),
  enemies: [], relic: null, boss: secretBoss.kind, hint: 'Enam pecahan membuka halaman yang tidak pernah ditulis.',
  palette: { ...ECLIPSE_BIOMES.at(-1).palette }, particle: 'halos', music: 'bossJudge',
  condition: 'The First Author menulis ulang setiap hukum pertempuran.',
  weather: 'Halaman kosong', accent: secretBoss.color, gate: null,
});

export { ECLIPSE_ROOMS };
export const ECLIPSE_ROOM_BY_ID = Object.fromEntries(ECLIPSE_ROOMS.map((room) => [room.id, room]));
export const ECLIPSE_STANDARD_ROOMS = ECLIPSE_ROOMS.filter((room) => room.eclipseStandard);
export const ECLIPSE_CAMPAIGN_BOSS_ROOMS = ECLIPSE_ROOMS.filter((room) => room.eclipseBoss);
export const ECLIPSE_ROOM_IDS = ECLIPSE_ROOMS.map((room) => room.id);

export const ECLIPSE_FRAGMENTS = ECLIPSE_BIOMES.map((biome) => ({
  id: biome.fragment, name: `Fragment ${biome.index + 1} — ${biome.name}`,
  biome: biome.id, boss: biome.boss.id, hint: biome.gimmick,
}));
export const ECLIPSE_FRAGMENT_BY_BIOME = Object.fromEntries(ECLIPSE_FRAGMENTS.map((fragment) => [fragment.biome, fragment]));

export function validateEclipseRooms(rooms = ECLIPSE_ROOMS) {
  const errors = [];
  if (rooms.length !== ECLIPSE_CAMPAIGN_ROOM_COUNT) errors.push(`Expected ${ECLIPSE_CAMPAIGN_ROOM_COUNT} rooms, got ${rooms.length}`);
  const ids = new Set();
  for (const room of rooms) {
    if (ids.has(room.id)) errors.push(`Duplicate room id ${room.id}`);
    ids.add(room.id);
    if (!room.name || !room.spawn) errors.push(`Room ${room.id} is incomplete`);
    if (room.eclipseStandard) {
      if (room.enemies.length !== ECLIPSE_STANDARD_ENEMIES) errors.push(`Room ${room.id} has ${room.enemies.length} enemies`);
      const types = new Set(room.enemies.map((enemy) => enemy.type));
      if (types.size !== ECLIPSE_ARCHETYPE_COUNT + 1) errors.push(`Room ${room.id} has ${types.size} types`);
      if (room.enemies.filter((enemy) => ECLIPSE_ENEMY_INFO[enemy.type]?.elite).length !== ECLIPSE_ELITES_PER_STAGE) {
        errors.push(`Room ${room.id} needs exactly one elite`);
      }
    }
  }
  if (ECLIPSE_STANDARD_ROOMS.length !== ECLIPSE_STANDARD_LEVEL_COUNT) errors.push('Standard level count mismatch');
  if (ECLIPSE_CAMPAIGN_BOSS_ROOMS.length !== 7) errors.push('Boss room count mismatch');
  return { ok: errors.length === 0, errors, count: rooms.length, standard: ECLIPSE_STANDARD_ROOMS.length };
}

// ── Godfall Ascension ──────────────────────────────────────────────────────
export const GODFALL_FLOOR_TYPES = ['combat', 'puzzle', 'elite', 'survival', 'treasure', 'miniboss', 'boss'];
export const GODFALL_MODIFIERS = [
  { id: 'aggression', name: 'Blood Hunt', desc: 'Enemies detect and pursue from farther away.' },
  { id: 'weather', name: 'Broken Sky', desc: 'Environmental hazard pulses every few seconds.' },
  { id: 'scarcity', name: 'Dry Vials', desc: 'Only one flask refill per floor.' },
  { id: 'formation', name: 'Closed Ranks', desc: 'Enemy formations start closer together.' },
  { id: 'arena', name: 'Shifting Ground', desc: 'Arena mechanics change at half health.' },
];
export const GODFALL_REWARDS = [
  { floor: 5, id: 'ascendant_edge', name: 'Ascendant Edge skin', type: 'weapon_skin' },
  { floor: 10, id: 'godfall_title', name: 'Title: Godfall', type: 'title' },
  { floor: 25, id: 'ascendant_relic', name: 'Relic: First Rung', type: 'relic' },
  { floor: 50, id: 'ascendant_aura', name: 'Ascendant aura', type: 'effect' },
  { floor: 75, id: 'trophy_throne', name: 'Trophy Room: Broken Throne', type: 'decoration' },
  { floor: 100, id: 'ascension_crown', name: 'Ascension Crown', type: 'armor' },
];

export const GODFALL_BOSSES = Array.from({ length: 10 }, (_, index) => {
  const floor = (index + 1) * 10;
  const source = ECLIPSE_BOSSES[index % ECLIPSE_BOSSES.length];
  const final = floor === 100;
  return {
    id: `ascension_${floor}`, kind: `godfall_${floor}`, floor,
    name: final ? 'The Ascension' : `Ascendant ${source.name.replace(/^The /, '')}`,
    localName: final ? 'Puncak Kenaikan' : `Penjaga Lantai ${floor}`,
    title: final ? 'The Final Rung' : `Floor ${floor} Guardian`,
    pattern: final ? 'nova' : source.pattern, phases: final ? 5 : 2 + (index % 3),
    maxHp: 2400 + floor * 46, w: final ? 240 : 180, h: final ? 230 : 190,
    color: final ? '#fff1b8' : source.color, glyph: final ? '♛' : source.glyph,
    biome: 'godfall', final,
  };
});

function godfallBossInfo(source) {
  const forms = Array.from({ length: source.phases }, (_, index) => ({
    id: `godfall_${source.floor}_form_${index + 1}`,
    name: index === 0 ? source.name : `${source.name}, Ascendant ${index + 1}`,
    title: source.title,
    arena: { id: `godfall_${source.floor}_arena_${index + 1}`, condition: `Floor ${source.floor} arena law ${index + 1}.`, weather: 'Ascension' },
  }));
  return {
    id: source.id, kind: source.kind, name: source.name, localName: source.localName, title: source.title,
    godfall: true, chapter: 8, biome: 'godfall', pattern: source.pattern, maxHp: source.maxHp,
    w: source.w, h: source.h, contact: 32, maxPhases: source.phases,
    phaseThresholds: thresholdsFor(source.phases), mini: !source.final, major: source.final,
    final: source.final, flying: false, reward: source.final ? 'victory' : 'blessing',
    summonType: 'ancient_godling', ashReward: 300 + source.floor * 8, echoReward: 0,
    shards: 10 + source.floor, color: source.color, glyph: source.glyph, music: 'bossJudge',
    spawn: { x: 760, y: ECLIPSE_FLOOR_Y - source.h },
    dialogue: {
      intro: [{ speaker: source.name, text: `Lantai ${source.floor} menguji siapa yang pantas naik.` }],
      defeat: [{ speaker: source.name, text: 'Satu langkah lagi menuju puncak.' }],
      ...Object.fromEntries(Array.from({ length: source.phases - 1 }, (_, i) => [`phase${i + 2}`, [{ speaker: source.name, text: `Ascension ${i + 2}. The floor remembers.` }]])),
    },
    forms, mechanics: ['Escalating encounters', 'Floor modifiers', 'Checkpoint recovery'],
    desc: `Godfall Ascension floor ${source.floor} guardian.`, where: 'Godfall Ascension',
  };
}

export const GODFALL_BOSS_INFO = Object.fromEntries(GODFALL_BOSSES.map((boss) => [boss.kind, godfallBossInfo(boss)]));

function godfallEnemies(floor) {
  const biome = ECLIPSE_BIOMES[(floor - 1) % ECLIPSE_BIOMES.length];
  const base = biome.enemies.slice(0, 4).map((enemy) => enemy[0]);
  const elite = biome.enemies[4][0];
  const count = 12 + Math.floor(floor / 5);
  const list = [];
  for (let i = 0; i < count; i += 1) list.push(base[i % 4]);
  if (floor % 5 === 0) list[0] = elite;
  return list;
}

function godfallFloorType(floor) {
  if (floor === 100 || floor % 10 === 0) return 'boss';
  if (floor % 25 === 0) return 'treasure';
  if (floor % 5 === 0) return 'elite';
  if (floor % 7 === 0) return 'survival';
  if (floor % 6 === 0) return 'puzzle';
  return 'combat';
}

export const GODFALL_ROOMS = Array.from({ length: GODFALL_FLOOR_COUNT }, (_, index) => {
  const floor = index + 1;
  const biome = ECLIPSE_BIOMES[(floor - 1) % ECLIPSE_BIOMES.length];
  const type = godfallFloorType(floor);
  const boss = GODFALL_BOSSES.find((entry) => entry.floor === floor);
  const next = floor < GODFALL_FLOOR_COUNT ? GODFALL_ROOM_START + floor : null;
  return {
    id: GODFALL_ROOM_START + index, godfall: true, godfallFloor: floor, godfallType: type,
    name: `Godfall — Floor ${floor}`, subtitle: `${type.toUpperCase()} · ${biome.name}`,
    zone: biome.id, spawn: { x: 78, y: ECLIPSE_FLOOR_Y - 46 },
    platforms: platformsFor(biome, type === 'boss'), enemies: type === 'boss' ? [] : godfallEnemies(floor),
    relic: null, boss: boss?.kind || null, hint: GODFALL_MODIFIERS[(floor - 1) % GODFALL_MODIFIERS.length].desc,
    palette: { ...biome.palette }, particle: biome.particle, music: biome.music,
    condition: `Floor ${floor}: ${type}.`, weather: 'Ascension', accent: boss?.color || biome.color,
    gate: next ? gateTo(next, type === 'boss' ? 'boss' : 'clear', `Floor ${floor + 1}`) : null,
    checkpoint: type === 'treasure' || floor % 25 === 0 ? { x: 74, y: ECLIPSE_FLOOR_Y - 78, w: 38, h: 78, name: `Floor ${floor} Anchor` } : undefined,
  };
});

export const GODFALL_ROOM_BY_ID = Object.fromEntries(GODFALL_ROOMS.map((room) => [room.id, room]));

export function godfallFloorInfo(floor) {
  const safeFloor = clamp(asInt(floor, 1), 1, GODFALL_FLOOR_COUNT);
  const room = GODFALL_ROOM_BY_ID[GODFALL_ROOM_START + safeFloor - 1];
  return {
    floor: safeFloor, roomId: room.id, type: godfallFloorType(safeFloor),
    boss: GODFALL_BOSSES.find((boss) => boss.floor === safeFloor) || null,
    reward: GODFALL_REWARDS.find((reward) => reward.floor === safeFloor) || null,
    modifier: GODFALL_MODIFIERS[(safeFloor - 1) % GODFALL_MODIFIERS.length],
    enemies: room.enemies.length, checkpoint: !!room.checkpoint,
  };
}

export function defaultGodfallProgress() {
  return {
    unlocked: false, highestFloor: 0, cleared: Array.from({ length: GODFALL_FLOOR_COUNT }, () => false),
    bestFloor: 0, runs: 0, deaths: 0, checkpoint: 0, rewards: [], titles: [], lastRun: null,
  };
}

export function sanitizeGodfallProgress(raw) {
  const defaults = defaultGodfallProgress();
  const source = raw && typeof raw === 'object' ? raw : {};
  const cleared = Array.from({ length: GODFALL_FLOOR_COUNT }, (_, i) => Boolean(source.cleared?.[i]));
  const highestFloor = clamp(asInt(source.highestFloor), 0, GODFALL_FLOOR_COUNT);
  return {
    unlocked: Boolean(source.unlocked || highestFloor > 0),
    highestFloor: Math.max(highestFloor, cleared.filter(Boolean).length),
    cleared,
    bestFloor: clamp(Math.max(asInt(source.bestFloor), highestFloor), 0, GODFALL_FLOOR_COUNT),
    runs: Math.max(0, asInt(source.runs)),
    deaths: Math.max(0, asInt(source.deaths)),
    checkpoint: clamp(asInt(source.checkpoint), 0, GODFALL_FLOOR_COUNT),
    rewards: [...new Set((Array.isArray(source.rewards) ? source.rewards : []).filter((id) => GODFALL_REWARDS.some((r) => r.id === id)))],
    titles: [...new Set((Array.isArray(source.titles) ? source.titles : []).filter((id) => typeof id === 'string'))],
    lastRun: source.lastRun && typeof source.lastRun === 'object' ? { ...source.lastRun } : null,
  };
}

export function createGodfallRun({ startFloor = 1, seed = 1, practice = false } = {}) {
  const start = clamp(asInt(startFloor, 1), 1, GODFALL_FLOOR_COUNT);
  return {
    startFloor: start, floor: start, seed: asInt(seed, 1), practice: !!practice,
    state: 'active', checkpoint: start, cleared: [], startedAt: Date.now(), perfects: 0,
  };
}

export function recordGodfallFloor(state, run, floor) {
  const safe = state || defaultGodfallProgress();
  const safeRun = run || {};
  const safeFloor = clamp(asInt(floor), 1, GODFALL_FLOOR_COUNT);
  const first = !safe.cleared[safeFloor - 1];
  safe.cleared[safeFloor - 1] = true;
  safe.highestFloor = Math.max(safe.highestFloor, safeFloor);
  safe.bestFloor = Math.max(safe.bestFloor, safeFloor);
  if (!safeRun.practice) safeRun.checkpoint = Math.min(GODFALL_FLOOR_COUNT, safeFloor + 1);
  safe.checkpoint = safeRun.practice ? safe.checkpoint : Math.max(safe.checkpoint, safeRun.checkpoint || 0);
  for (const reward of GODFALL_REWARDS) {
    if (safeFloor >= reward.floor && !safe.rewards.includes(reward.id)) safe.rewards.push(reward.id);
  }
  if (first) safe.runs = safe.runs;
  safe.lastRun = { floor: safeFloor, practice: !!safeRun.practice, at: Date.now() };
  return { first, reward: GODFALL_REWARDS.find((reward) => reward.floor === safeFloor) || null };
}

export function failGodfallRun(state) {
  const safe = state || defaultGodfallProgress();
  safe.deaths += 1;
  if (safe.lastRun) safe.lastRun.state = 'failed';
  return { checkpoint: safe.checkpoint, message: safe.checkpoint > 0 ? `Kembali ke lantai ${safe.checkpoint}.` : 'Ascension berakhir sebelum lantai pertama.' };
}

export function godfallSummary(state) {
  const safe = sanitizeGodfallProgress(state);
  return {
    ...safe, clearedCount: safe.cleared.filter(Boolean).length, total: GODFALL_FLOOR_COUNT,
    progress: Math.round((safe.cleared.filter(Boolean).length / GODFALL_FLOOR_COUNT) * 100),
    milestones: GODFALL_REWARDS.map((reward) => ({ ...reward, earned: safe.rewards.includes(reward.id) })),
  };
}

// ── guilds and raids ───────────────────────────────────────────────────────
export const GUILD_RANKS = [
  { id: 'leader', name: 'Guild Leader', level: 5, permission: 'Full guild management' },
  { id: 'officer', name: 'Officer', level: 4, permission: 'Manage members and activities' },
  { id: 'veteran', name: 'Veteran', level: 3, permission: 'Access selected guild features' },
  { id: 'member', name: 'Member', level: 2, permission: 'Participate in guild activities' },
  { id: 'recruit', name: 'Recruit', level: 1, permission: 'New member permissions' },
];
export const GUILD_RANK_BY_ID = Object.fromEntries(GUILD_RANKS.map((rank) => [rank.id, rank]));
export const GUILD_PERMISSIONS = {
  leader: ['manage', 'invite', 'kick', 'promote', 'chat', 'raid', 'weekly'],
  officer: ['invite', 'kick', 'chat', 'raid', 'weekly'],
  veteran: ['invite', 'chat', 'raid', 'weekly'],
  member: ['chat', 'raid', 'weekly'],
  recruit: ['chat'],
};

export const GUILD_WEEKLY = [
  { id: 'weekly_raid', name: 'Three Raid Attempts', target: 3 },
  { id: 'weekly_floors', name: 'Ascend 10 Floors', target: 10 },
  { id: 'weekly_bosses', name: 'Defeat 5 Pantheon Guardians', target: 5 },
];

export const RAID_ENCOUNTERS = [
  {
    id: 'worldroot_colossus', name: 'Worldroot Colossus', localName: 'Kolosus Akar Dunia', players: 4, phases: 3,
    maxHp: 22000, mechanics: ['Root lanes', 'Synchronized stomp', 'Split healing'], reward: 'raid_worldroot_cache',
    desc: 'Raid pertama: pecahkan tiga akar raksasa secara bersamaan sebelum kolosus menghancurkan arena.',
  },
  {
    id: 'astral_devourer', name: 'Astral Devourer', localName: 'Pemangsa Astral', players: 4, phases: 4,
    maxHp: 28000, mechanics: ['Star pulls', 'Portal assignments', 'Gravity collapse'], reward: 'raid_astral_cache',
    desc: 'Raid kedua: setiap pemain harus menjaga portal bintang sambil menghindari tarikan gravitasi.',
  },
  {
    id: 'forgotten_high_god', name: 'The Forgotten High God', localName: 'Dewa Tinggi yang Terlupakan', players: 4, phases: 4,
    maxHp: 36000, mechanics: ['Shared memory', 'Role rotations', 'Law breaks'], reward: 'raid_pantheon_cache',
    desc: 'Raid ketiga: empat peran bergiliran memegang memori dewa yang berbeda.',
  },
];
export const RAID_BY_ID = Object.fromEntries(RAID_ENCOUNTERS.map((raid) => [raid.id, raid]));

export function createRaidRun(encounterId, { practice = false, players = [] } = {}) {
  const raid = RAID_BY_ID[encounterId];
  if (!raid) return null;
  return {
    id: `raid_${encounterId}_${Date.now().toString(36)}`, encounterId, practice: !!practice,
    players: players.slice(0, 4).map((player, index) => ({ id: player.id || `p${index}`, name: player.name || `Warden ${index + 1}`, role: player.role || 'dps', alive: true, damage: 0 })),
    hp: raid.maxHp, maxHp: raid.maxHp, phase: 1, maxPhases: raid.phases, state: 'active',
    objectives: raid.mechanics.map((mechanic, index) => ({ id: `${raid.id}_obj_${index}`, name: mechanic, done: false })),
    startedAt: Date.now(), reconnectToken: `reconnect_${Math.random().toString(36).slice(2, 10)}`,
  };
}

export function raidDamage(run, playerId, amount) {
  if (!run || run.state !== 'active') return { ok: false, reason: 'raid_inactive' };
  const player = run.players.find((entry) => entry.id === playerId);
  if (!player) return { ok: false, reason: 'unknown_player' };
  if (!player.alive) player.alive = true;
  const dealt = Math.max(0, Math.min(Number(amount) || 0, run.hp));
  run.hp = Math.max(0, run.hp - dealt);
  player.damage += dealt;
  run.phase = Math.min(run.maxPhases, 1 + Math.floor((1 - run.hp / run.maxHp) * run.maxPhases));
  if (run.hp <= 0) run.state = 'victory';
  return { ok: true, dealt, hp: run.hp, phase: run.phase, state: run.state };
}

export function raidCompleteObjective(run, objectiveId) {
  if (!run || run.state !== 'active') return false;
  const objective = run.objectives.find((entry) => entry.id === objectiveId);
  if (!objective) return false;
  objective.done = true;
  run.objectivesDone = run.objectives.filter((entry) => entry.done).length;
  return true;
}

export function raidRewardEligibility(run) {
  if (!run || run.state !== 'victory') return { ok: false, error: 'not_victory' };
  if (run.practice) return { ok: false, error: 'practice_only' };
  if (!run.objectives.every((entry) => entry.done)) return { ok: false, error: 'objectives_incomplete' };
  if (run.players.length < 1) return { ok: false, error: 'no_players' };
  return { ok: true, encounterId: run.encounterId, reward: RAID_BY_ID[run.encounterId]?.reward, runId: run.id };
}

export function defaultGuildState() {
  return {
    version: 1, guild: null, activity: [], achievements: [], weekly: Object.fromEntries(GUILD_WEEKLY.map((entry) => [entry.id, 0])),
    weeklyClaimed: [], raids: {}, lastSync: null,
  };
}

export function sanitizeGuildState(raw) {
  const defaults = defaultGuildState();
  const source = raw && typeof raw === 'object' ? raw : {};
  const guild = source.guild && typeof source.guild === 'object' ? source.guild : null;
  const safeGuild = guild ? {
    id: String(guild.id || `guild_${Date.now()}`),
    name: String(guild.name || 'Unnamed Guild').slice(0, 32),
    emblem: String(guild.emblem || '⚔').slice(0, 8),
    rank: GUILD_RANK_BY_ID[guild.rank] ? guild.rank : 'leader',
    members: (Array.isArray(guild.members) ? guild.members : []).filter((m) => m && m.id).slice(0, 50).map((m) => ({
      id: String(m.id), name: String(m.name || 'Warden').slice(0, 24),
      rank: GUILD_RANK_BY_ID[m.rank] ? m.rank : 'recruit', joinedAt: Number(m.joinedAt) || Date.now(),
    })),
    createdAt: Number(guild.createdAt) || Date.now(),
    description: String(guild.description || '').slice(0, 160),
    level: Math.max(1, asInt(guild.level, 1)),
    xp: Math.max(0, asInt(guild.xp, 0)),
  } : null;
  if (safeGuild && !safeGuild.members.some((m) => m.rank === 'leader')) safeGuild.members.unshift({ id: 'local', name: 'Guild Leader', rank: 'leader', joinedAt: Date.now() });
  return {
    ...defaults,
    guild: safeGuild,
    activity: (Array.isArray(source.activity) ? source.activity : []).slice(-80).map((entry) => ({ ...entry })),
    achievements: [...new Set((Array.isArray(source.achievements) ? source.achievements : []).filter((id) => typeof id === 'string'))],
    weekly: Object.fromEntries(GUILD_WEEKLY.map((entry) => [entry.id, Math.max(0, Math.min(entry.target, asInt(source.weekly?.[entry.id])))])),
    weeklyClaimed: [...new Set((Array.isArray(source.weeklyClaimed) ? source.weeklyClaimed : []).filter((id) => GUILD_WEEKLY.some((w) => w.id === id)))],
    raids: Object.fromEntries(Object.entries(source.raids && typeof source.raids === 'object' ? source.raids : {}).filter(([id]) => RAID_BY_ID[id]).map(([id, value]) => [id, {
      clears: Math.max(0, asInt(value?.clears)), practiceClears: Math.max(0, asInt(value?.practiceClears)),
      bestPhase: Math.max(0, asInt(value?.bestPhase)), lastRun: value?.lastRun || null,
    }])),
    lastSync: source.lastSync ? String(source.lastSync) : null,
  };
}

export function createGuild(state, { name, emblem = '⚔', leader = 'Warden', description = '' } = {}) {
  const safe = sanitizeGuildState(state);
  if (safe.guild) return { ok: false, error: 'already_in_guild' };
  const cleanName = String(name || '').trim().slice(0, 32);
  if (cleanName.length < 3) return { ok: false, error: 'name_too_short' };
  safe.guild = {
    id: `guild_${Date.now().toString(36)}`, name: cleanName, emblem: String(emblem).slice(0, 8),
    rank: 'leader', description: String(description).slice(0, 160), createdAt: Date.now(), level: 1, xp: 0,
    members: [{ id: 'local', name: String(leader || 'Warden').slice(0, 24), rank: 'leader', joinedAt: Date.now() }],
  };
  safe.activity.push({ at: Date.now(), type: 'guild_created', text: `${cleanName} didirikan.` });
  return { ok: true, guild: safe.guild, state: safe };
}

export function joinGuild(state, { guildId, name = 'Warden', rank = 'recruit' } = {}) {
  const safe = sanitizeGuildState(state);
  if (safe.guild) return { ok: false, error: 'already_in_guild' };
  safe.guild = {
    id: String(guildId || `guild_${Date.now().toString(36)}`), name: 'Forgotten Pantheon', emblem: '☥',
    rank: GUILD_RANK_BY_ID[rank] ? rank : 'recruit', description: 'Guild yang bertahan melewati gerhana.',
    createdAt: Date.now(), level: 1, xp: 0,
    members: [{ id: 'local', name: String(name).slice(0, 24), rank: GUILD_RANK_BY_ID[rank] ? rank : 'recruit', joinedAt: Date.now() }],
  };
  safe.activity.push({ at: Date.now(), type: 'guild_joined', text: `${name} bergabung dengan guild.` });
  return { ok: true, guild: safe.guild, state: safe };
}

export function setGuildRank(state, memberId, rank) {
  const safe = sanitizeGuildState(state);
  if (!safe.guild || !GUILD_RANK_BY_ID[rank]) return { ok: false, error: 'invalid_rank' };
  const member = safe.guild.members.find((entry) => entry.id === memberId);
  if (!member) return { ok: false, error: 'unknown_member' };
  if (member.rank === 'leader' && rank !== 'leader' && safe.guild.members.filter((m) => m.rank === 'leader').length === 1) {
    return { ok: false, error: 'last_leader' };
  }
  member.rank = rank;
  safe.activity.push({ at: Date.now(), type: 'rank_changed', text: `${member.name} menjadi ${GUILD_RANK_BY_ID[rank].name}.` });
  return { ok: true, guild: safe.guild };
}

export function guildChat(state, { name = 'Warden', text = '' } = {}) {
  const safe = sanitizeGuildState(state);
  if (!safe.guild) return { ok: false, error: 'no_guild' };
  const clean = String(text).trim().slice(0, 240);
  if (!clean) return { ok: false, error: 'empty_message' };
  safe.activity.push({ at: Date.now(), type: 'chat', name: String(name).slice(0, 24), text: clean });
  if (safe.activity.length > 80) safe.activity.splice(0, safe.activity.length - 80);
  return { ok: true, state: safe };
}

export function advanceGuildWeek(state, { raid = false, floors = 0, bosses = 0 } = {}) {
  const safe = sanitizeGuildState(state);
  if (raid) safe.weekly.weekly_raid = Math.min(3, safe.weekly.weekly_raid + 1);
  if (floors) safe.weekly.weekly_floors = Math.min(10, safe.weekly.weekly_floors + floors);
  if (bosses) safe.weekly.weekly_bosses = Math.min(5, safe.weekly.weekly_bosses + bosses);
  for (const entry of GUILD_WEEKLY) {
    if (safe.weekly[entry.id] >= entry.target && !safe.achievements.includes(entry.id)) {
      safe.achievements.push(entry.id);
      safe.activity.push({ at: Date.now(), type: 'achievement', text: `Guild achievement: ${entry.name}.` });
    }
  }
  return safe;
}

export function guildLeaderboard(state) {
  const safe = sanitizeGuildState(state);
  return [
    { guild: safe.guild?.name || 'Tanpa Guild', xp: safe.guild?.xp || 0, level: safe.guild?.level || 1, members: safe.guild?.members.length || 0, you: !!safe.guild },
    { guild: 'Obsidian Choir', xp: 8200, level: 9, members: 24, you: false },
    { guild: 'Clockwork Vow', xp: 6900, level: 8, members: 18, you: false },
    { guild: 'Gravebound', xp: 5400, level: 6, members: 12, you: false },
  ].sort((a, b) => b.xp - a.xp);
}

export function recordRaidResult(state, run) {
  const safe = sanitizeGuildState(state);
  if (!run?.encounterId) return { ok: false };
  const current = safe.raids[run.encounterId] || { clears: 0, practiceClears: 0, bestPhase: 0, lastRun: null };
  if (run.state === 'victory') {
    if (run.practice) current.practiceClears += 1; else current.clears += 1;
  }
  current.bestPhase = Math.max(current.bestPhase, run.phase || 0);
  current.lastRun = { at: Date.now(), practice: !!run.practice, phase: run.phase, state: run.state };
  safe.raids[run.encounterId] = current;
  return { ok: true, state: safe, reward: run.state === 'victory' && !run.practice ? RAID_BY_ID[run.encounterId]?.reward : null };
}

export function guildSummary(state) {
  const safe = sanitizeGuildState(state);
  return {
    guild: safe.guild, guildCount: safe.guild ? 1 : 0,
    members: safe.guild?.members.length || 0,
    weekly: GUILD_WEEKLY.map((entry) => ({ ...entry, value: safe.weekly[entry.id] || 0, complete: (safe.weekly[entry.id] || 0) >= entry.target })),
    achievements: [...safe.achievements], activity: safe.activity.slice(-20), leaderboard: guildLeaderboard(safe),
  };
}

// ── Character Awakening ────────────────────────────────────────────────────
export const AWAKENING_MASTERY = 100;
export const AWAKENING_MAX_LEVEL = 5;
export const AWAKENING_PASSIVES = [
  { id: 'radiant_bulwark', name: 'Radiant Bulwark', desc: '+12% defense while at full health.' },
  { id: 'rift_momentum', name: 'Rift Momentum', desc: 'Perfect dodge reduces ability cooldown by 1.5s.' },
  { id: 'rooted_cycle', name: 'Rooted Cycle', desc: 'Skills leave a healing root for 2 seconds.' },
  { id: 'second_hand', name: 'Second Hand', desc: 'Every third weapon skill costs no cooldown.' },
  { id: 'void_tithe', name: 'Void Tithe', desc: 'Summons explode for 30% of their max HP.' },
  { id: 'eclipse_echo', name: 'Eclipse Echo', desc: 'Elemental reactions deal 15% more damage.' },
];

const AWAKENING_CLASS_SOURCE = {
  dawn_paladin: {
    name: 'Dawn Paladin', title: 'The First Light', glyph: '☀', maxHp: 128, speed: 0.95, damage: 1.02, dash: 0.9, build: 1.12,
    appearance: { race: 'human', skin: '#c98f6a', outfit: '#8b6a1f', armor: 'royal' },
    ability: { id: 'dawn_aegis', name: 'Dawn Aegis', cooldown: 7.2, desc: 'Radiant barrier: heal 24%, gain 2.4s invulnerability, and burn nearby shadows.' },
    awakening: { name: 'Dawn Incarnate', appearance: 'White-gold armor with a halo of broken suns.', ability: 'Dawnbreak Verdict', passive: 'radiant_bulwark', quest: 'Light the three extinguished suns beneath the Obsidian Kingdom.' },
  },
  rift_assassin: {
    name: 'Rift Assassin', title: 'The Between Step', glyph: '◈', maxHp: 84, speed: 1.16, damage: 1.14, dash: 0.72, build: 0.9,
    appearance: { race: 'elf', skin: '#c98f6a', outfit: '#2a2a30', armor: 'modern' },
    ability: { id: 'rift_lance', name: 'Rift Lance', cooldown: 5.0, desc: 'Blink through a dimensional seam and pierce every enemy along the line.' },
    awakening: { name: 'Rift Sovereign', appearance: 'A fractured silhouette with violet seams.', ability: 'Unmade Step', passive: 'rift_momentum', quest: 'Walk the seam between the Clockwork and the Void.' },
  },
  worldroot_druid: {
    name: 'Worldroot Druid', title: 'The Green Memory', glyph: '☘', maxHp: 108, speed: 1.0, damage: 1.0, dash: 0.94, build: 1.06,
    appearance: { race: 'goblin', skin: '#8fb06a', outfit: '#3b4a2f', armor: 'tribal' },
    ability: { id: 'root_circle', name: 'Root Circle', cooldown: 6.4, desc: 'Summon roots that snare enemies and bloom into a healing grove.' },
    awakening: { name: 'Worldroot Eternal', appearance: 'Bark armor threaded with living constellations.', ability: 'First Forest', passive: 'rooted_cycle', quest: 'Return a seed to the grave of the first tree.' },
  },
  chrono_weaver: {
    name: 'Chrono Weaver', title: 'The Loose Thread', glyph: '◷', maxHp: 92, speed: 1.04, damage: 1.08, dash: 0.8, build: 0.96,
    appearance: { race: 'human', skin: '#a9714c', outfit: '#7a4a24', armor: 'modern' },
    ability: { id: 'time_field', name: 'Time Field', cooldown: 6.8, desc: 'Create a field that slows hostile projectiles and accelerates the player.' },
    awakening: { name: 'The Unwritten Hour', appearance: 'A clockwork halo with hands that point nowhere.', ability: 'Second First', passive: 'second_hand', quest: 'Find the second that was removed from the Clockwork Throne.' },
  },
  void_herald: {
    name: 'Void Herald', title: 'The Empty Messenger', glyph: '◉', maxHp: 96, speed: 1.02, damage: 1.12, dash: 0.86, build: 1.0,
    appearance: { race: 'devil', skin: '#a8503f', outfit: '#5b2f6b', armor: 'royal' },
    ability: { id: 'void_construct', name: 'Void Construct', cooldown: 7.0, desc: 'Summon a void sentinel that taunts enemies and detonates when destroyed.' },
    awakening: { name: 'Herald of the Last Void', appearance: 'A black star crown over an empty hood.', ability: 'Final Summons', passive: 'void_tithe', quest: 'Deliver an unwritten name to the First Author.' },
  },
};

export const ECLIPSE_CLASSES = {};
for (const [id, source] of Object.entries(AWAKENING_CLASS_SOURCE)) {
  ECLIPSE_CLASSES[id] = {
    id, name: source.name, title: source.title, className: source.name.replace(/^(Dawn|Rift|Worldroot|Chrono|Void)\s/, ''),
    glyph: source.glyph, desc: source.awakening?.quest || source.name,
    maxHp: source.maxHp, speed: source.speed, damage: source.damage, dash: source.dash, build: source.build,
    appearance: source.appearance, ability: { ...source.ability, key: 'U / V' }, eclipse: true,
  };
}

export function awakeningFor(classId) {
  const source = AWAKENING_CLASS_SOURCE[classId];
  const base = ECLIPSE_CLASSES[classId];
  if (source) {
    return {
      classId, name: source.awakening.name, appearance: source.awakening.appearance,
      ability: { name: source.awakening.ability, desc: `Awakened ability for ${source.name}.` },
      passive: AWAKENING_PASSIVES.find((passive) => passive.id === source.awakening.passive),
      quest: source.awakening.quest, mastery: AWAKENING_MASTERY, maxLevel: AWAKENING_MAX_LEVEL,
    };
  }
  return {
    classId, name: `${classId.replace(/_/g, ' ')} Awakened`,
    appearance: 'A darker, star-threaded variation of the original class silhouette.',
    ability: { name: 'Eclipse Verdict', desc: 'An awakened version of the class ability that inherits its element.' },
    passive: AWAKENING_PASSIVES[Math.abs(classId.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)) % AWAKENING_PASSIVES.length],
    quest: `Complete the forgotten memory trial for ${classId}.`, mastery: AWAKENING_MASTERY, maxLevel: AWAKENING_MAX_LEVEL,
  };
}

export function defaultAwakeningProgress() {
  return { mastery: {}, awakened: {}, levels: {}, passives: {}, quests: {}, activePassive: {} };
}

export function sanitizeAwakeningProgress(raw, classIds = []) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const known = new Set(classIds);
  const keep = (object) => Object.fromEntries(Object.entries(object && typeof object === 'object' ? object : {}).filter(([id]) => !known.size || known.has(id)));
  return {
    mastery: Object.fromEntries(Object.entries(source.mastery || {}).map(([id, value]) => [id, clamp(asInt(value), 0, 9999)])),
    awakened: Object.fromEntries(Object.entries(keep(source.awakened)).map(([id, value]) => [id, !!value])),
    levels: Object.fromEntries(Object.entries(keep(source.levels)).map(([id, value]) => [id, clamp(asInt(value), 1, AWAKENING_MAX_LEVEL)])),
    passives: Object.fromEntries(Object.entries(keep(source.passives)).map(([id, value]) => [id, Array.isArray(value) ? [...new Set(value.filter((passive) => AWAKENING_PASSIVES.some((entry) => entry.id === passive)))] : []])),
    quests: Object.fromEntries(Object.entries(keep(source.quests)).map(([id, value]) => [id, !!value])),
    activePassive: Object.fromEntries(Object.entries(keep(source.activePassive)).map(([id, value]) => [id, AWAKENING_PASSIVES.some((entry) => entry.id === value) ? value : null])),
  };
}

export function grantMastery(state, classId, amount) {
  const safe = state || defaultAwakeningProgress();
  safe.mastery[classId] = clamp(asInt(safe.mastery[classId]) + Math.max(0, asInt(amount)), 0, 9999);
  return safe.mastery[classId];
}

export function canAwaken(state, classId) {
  const safe = state || defaultAwakeningProgress();
  return !safe.awakened[classId] && (safe.mastery[classId] || 0) >= AWAKENING_MASTERY;
}

export function awakenClass(state, classId) {
  const safe = state || defaultAwakeningProgress();
  if (!canAwaken(safe, classId)) return { ok: false, error: 'mastery_locked' };
  safe.awakened[classId] = true;
  safe.levels[classId] = Math.max(1, safe.levels[classId] || 1);
  safe.quests[classId] = false;
  const awakening = awakeningFor(classId);
  safe.passives[classId] = [awakening.passive.id];
  safe.activePassive[classId] = awakening.passive.id;
  return { ok: true, awakening, state: safe };
}

export function setAwakeningPassive(state, classId, passiveId) {
  const safe = state || defaultAwakeningProgress();
  if (!safe.awakened[classId] || !AWAKENING_PASSIVES.some((entry) => entry.id === passiveId)) return { ok: false };
  safe.activePassive[classId] = passiveId;
  return { ok: true, state: safe };
}

export function awakeningBonus(state, classId) {
  const safe = state || defaultAwakeningProgress();
  if (!safe.awakened[classId]) return { maxHp: 0, damage: 0, speed: 0, cooldown: 0, passive: null };
  const level = safe.levels[classId] || 1;
  const passive = AWAKENING_PASSIVES.find((entry) => entry.id === safe.activePassive[classId]) || null;
  return { maxHp: 8 * level, damage: 0.04 * level, speed: 0.015 * level, cooldown: 0.025 * level, passive };
}

// ── Combat Evolution 2.0 ──────────────────────────────────────────────────
export const DAMAGE_TYPES = ['physical', 'fire', 'frost', 'lightning', 'wind', 'water', 'nature', 'astral', 'void'];
export const ELEMENTAL_REACTIONS = [
  { id: 'wildfire', a: 'fire', b: 'wind', name: 'Wildfire', desc: 'Expanding flame effect and 24% bonus area damage.' },
  { id: 'superconduct', a: 'frost', b: 'lightning', name: 'Superconduct', desc: 'Temporary disruption: enemy defense drops for 3s.' },
  { id: 'electrocharge', a: 'water', b: 'lightning', name: 'Electrocharge', desc: 'Electrical area effect chains to a second target.' },
  { id: 'growth', a: 'nature', b: 'fire', name: 'Growth', desc: 'Environmental reaction: roots bloom and heal the attacker.' },
  { id: 'dimensional_collapse', a: 'astral', b: 'void', name: 'Dimensional Collapse', desc: 'Unstable dimensional effect pulls nearby enemies inward.' },
];
export const ELEMENTAL_REACTION_BY_PAIR = Object.fromEntries(ELEMENTAL_REACTIONS.flatMap((reaction) => [
  [`${reaction.a}+${reaction.b}`, reaction], [`${reaction.b}+${reaction.a}`, reaction],
]));
export const PERFECT_DODGE_WINDOW = 0.16;
export const COUNTER_WINDOW = 1.2;
export const BREAK_THRESHOLD = 100;
export const BREAK_STAGGER = 1.45;

export function calculateDamage(context = {}) {
  const base = Number(context.baseDamage);
  if (!Number.isFinite(base) || base <= 0) return 0;
  if (context.sourceValid === false || context.targetValid === false) return 0;
  if (context.targetInvulnerable || context.targetDodging) return 0;
  const elementalModifier = clamp(Number(context.elementalModifier ?? 1) || 0, 0, 5);
  const defenseMultiplier = clamp(Number(context.defenseMultiplier ?? 1) || 0, 0.1, 3);
  const resistance = clamp(Number(context.resistance ?? 0) || 0, 0, 0.9);
  const critical = context.critical ? clamp(Number(context.criticalMultiplier ?? 1.5) || 1, 1, 4) : 1;
  const status = context.statusMultiplier && Number.isFinite(Number(context.statusMultiplier)) ? clamp(Number(context.statusMultiplier), 0, 3) : 1;
  const raw = base * elementalModifier * defenseMultiplier * (1 - resistance) * critical * status;
  return Math.max(0, Math.round(raw * 100) / 100);
}

export function reactionFor(first, second) {
  if (!first || !second || first === second) return null;
  return ELEMENTAL_REACTION_BY_PAIR[`${first}+${second}`] || null;
}

export function applyReaction(state, first, second, damage) {
  const safe = state || { lastElement: null, lastReaction: null, reactionCount: 0 };
  const reaction = reactionFor(first, second);
  if (!reaction) {
    safe.lastElement = second || first || null;
    return { reaction: null, bonusDamage: 0, state: safe };
  }
  safe.lastReaction = reaction.id;
  safe.lastElement = null;
  safe.reactionCount += 1;
  const bonusDamage = Math.max(0, Number(damage) || 0) * 0.24;
  return { reaction, bonusDamage, state: safe };
}

export function createCombatState() {
  return {
    lastElement: null, lastReaction: null, reactionCount: 0, perfectDodges: 0,
    counters: 0, breaks: 0, hits: 0, lastHitAt: -99, breakGauge: 0, stagger: 0,
    counterWindow: 0, weaponMastery: {}, comboMastery: {},
  };
}

export function classifyDodge(combat, sinceDashStart) {
  if (!combat) return false;
  if ((Number(sinceDashStart) || 99) <= PERFECT_DODGE_WINDOW) {
    combat.perfectDodges += 1;
    combat.counterWindow = COUNTER_WINDOW;
    return true;
  }
  return false;
}

export function registerBreak(combat, power = 20) {
  const safe = combat || createCombatState();
  safe.breakGauge = Math.min(BREAK_THRESHOLD, (safe.breakGauge || 0) + Math.max(0, Number(power) || 0));
  if (safe.breakGauge >= BREAK_THRESHOLD) {
    safe.breakGauge = 0;
    safe.stagger = BREAK_STAGGER;
    safe.breaks += 1;
    return true;
  }
  return false;
}

export const WEAPON_MASTERY_XP = [0, 120, 300, 620, 1000, 1500];
export function grantWeaponMastery(combat, weapon, amount) {
  const safe = combat || createCombatState();
  const current = safe.weaponMastery[weapon] || { xp: 0, rank: 1 };
  current.xp += Math.max(0, Number(amount) || 0);
  while (current.rank < WEAPON_MASTERY_XP.length && current.xp >= WEAPON_MASTERY_XP[current.rank]) current.rank += 1;
  safe.weaponMastery[weapon] = current;
  return current;
}

export const COMBO_MASTERY = {
  sword: ['Oath Slash', 'Rising Ash', 'Gravebreaker'],
  twin_blades: ['Crosscut', 'Hollow Fang', 'Thousand Needles'],
  war_scythe: ['Wide Reap', 'Moon Harvest', 'Last Circumference'],
  war_gauntlets: ['Iron Knuckle', 'Fault Line', 'Worldbreaker'],
  rune_cannon: ['Rune Shot', 'Sigil Burst', 'Starfall Chamber'],
  chain_whip: ['Long Lash', 'Spiral Bind', 'Eclipse Coil'],
  halberd: ['Guard Break', 'Sunset Hook', 'Crown Splitter'],
  spellbook: ['First Word', 'Borrowed Page', 'Unwritten Verse'],
};

export function comboMasteryFor(weapon) {
  return [...(COMBO_MASTERY[weapon] || [])];
}

export const BOSS_WEAKNESSES = {
  obsidian_king: { element: 'astral', window: 'after shadow projection', bonus: 0.2 },
  gravekeeper_of_eternity: { element: 'nature', window: 'when celestial platforms fade', bonus: 0.2 },
  first_chronomancer: { element: 'lightning', window: 'during arena slowdown', bonus: 0.22 },
  silent_divinity: { element: 'fire', window: 'after ability restriction expires', bonus: 0.2 },
  eclipse_monarch: { element: 'void', window: 'when light and shadow swap', bonus: 0.25 },
  forgotten_high_god: { element: 'astral', window: 'after each law break', bonus: 0.18 },
  first_author: { element: 'void', window: 'after a memory sequence', bonus: 0.3 },
};

// New weapons. They use the same profile contract as Court weapons, so core can
// mix them into the existing weapon table without a parallel combat path.
const WEAPON_SOURCE = [
  {
    id: 'war_scythe', name: 'Sabit Perang Gerhana', short: 'SABIT', glyph: '☾', style: 'reach', cost: 180,
    desc: 'Cakupan lebar; setiap tebasan ketiga menarik musuh ke dalam busur.',
    attacks: [
      { windup: 0.18, active: 0.16, recover: 0.34, range: 116, height: 84, dmg: 25, knock: 220, name: 'slash' },
      { windup: 0.2, active: 0.18, recover: 0.38, range: 122, height: 90, dmg: 30, knock: 260, name: 'slash' },
      { windup: 0.26, active: 0.2, recover: 0.46, range: 142, height: 100, dmg: 42, knock: 380, name: 'heavy' },
    ],
  },
  {
    id: 'twin_blades', name: 'Bilah Kembar Gerhana', short: 'KEMBAR', glyph: '⚔', style: 'light', cost: 175,
    desc: 'Empat tebasan cepat; serangan terakhir menusuk dan memperpanjang combo.',
    attacks: [
      { windup: 0.035, active: 0.08, recover: 0.12, range: 56, height: 46, dmg: 8, knock: 100, name: 'slash' },
      { windup: 0.035, active: 0.08, recover: 0.12, range: 58, height: 46, dmg: 9, knock: 110, name: 'slash' },
      { windup: 0.04, active: 0.09, recover: 0.14, range: 60, height: 48, dmg: 10, knock: 120, name: 'slash' },
      { windup: 0.07, active: 0.11, recover: 0.2, range: 76, height: 52, dmg: 18, knock: 220, name: 'pierce' },
    ],
  },
  {
    id: 'war_gauntlets', name: 'Gauntlet Perang', short: 'GAUNTLET', glyph: '✊', style: 'impact', cost: 190,
    desc: 'Jarak pendek, hentakan berat; setiap pukulan menambah break gauge ekstra.',
    attacks: [
      { windup: 0.1, active: 0.1, recover: 0.2, range: 52, height: 46, dmg: 18, knock: 250, name: 'heavy' },
      { windup: 0.12, active: 0.12, recover: 0.24, range: 58, height: 50, dmg: 24, knock: 320, name: 'heavy' },
    ],
    breakPower: 36,
  },
  {
    id: 'rune_cannon', name: 'Meriam Rune', short: 'RUNE', glyph: '◎', style: 'ranged', cost: 210,
    desc: 'Meriam magis tanpa amunisi; proyektil meledak menjadi pecahan rune.',
    attacks: [
      { windup: 0.3, active: 0.06, recover: 0.36, range: 0, height: 0, dmg: 34, knock: 120, name: 'rune' },
    ],
    projectile: { type: 'rune_bolt', speed: 520, r: 8, life: 1.35, ammo: null },
  },
  {
    id: 'chain_whip', name: 'Cambuk Rantai', short: 'RANTAI', glyph: '⌁', style: 'flexible', cost: 185,
    desc: 'Jangkauan fleksibel; serangan kedua menarik musuh ringan ke depan.',
    attacks: [
      { windup: 0.16, active: 0.15, recover: 0.28, range: 128, height: 40, dmg: 20, knock: 140, name: 'slash' },
      { windup: 0.2, active: 0.16, recover: 0.32, range: 138, height: 42, dmg: 26, knock: 180, name: 'slash' },
    ],
  },
  {
    id: 'halberd', name: 'Halberd Sumpah', short: 'HALBERD', glyph: '⟋', style: 'balanced', cost: 200,
    desc: 'Jangkauan dan tenaga seimbang; tusukan terakhir menembus perisai.',
    attacks: [
      { windup: 0.2, active: 0.14, recover: 0.3, range: 126, height: 50, dmg: 28, knock: 230, name: 'pierce' },
      { windup: 0.24, active: 0.16, recover: 0.34, range: 132, height: 56, dmg: 36, knock: 300, name: 'heavy' },
    ],
  },
  {
    id: 'spellbook', name: 'Kitab Mantra Hilang', short: 'KITAB', glyph: '✦', style: 'magic', cost: 220,
    desc: 'Pola mantra yang berganti setiap kombo; proyektilnya melacak musuh terdekat.',
    attacks: [
      { windup: 0.24, active: 0.06, recover: 0.28, range: 0, height: 0, dmg: 20, knock: 80, name: 'spell' },
      { windup: 0.26, active: 0.06, recover: 0.3, range: 0, height: 0, dmg: 24, knock: 80, name: 'spell' },
      { windup: 0.3, active: 0.08, recover: 0.36, range: 0, height: 0, dmg: 32, knock: 110, name: 'spell' },
    ],
    projectile: { type: 'spell_seek', speed: 460, r: 8, life: 1.4, ammo: null },
  },
];

export const ECLIPSE_WEAPONS = WEAPON_SOURCE.map((source) => ({
  ...source, eclipse: true, tier: 3, mastery: WEAPON_MASTERY_XP,
}));
export const ECLIPSE_WEAPON_META = Object.fromEntries(ECLIPSE_WEAPONS.map((weapon) => [weapon.id, {
  id: weapon.id, name: weapon.name, short: weapon.short, glyph: weapon.glyph, eclipse: true,
  ammo: weapon.projectile?.ammo || null, style: weapon.style,
}]));
export const ECLIPSE_WEAPON_PROFILES = Object.fromEntries(ECLIPSE_WEAPONS.map((weapon) => [weapon.id, {
  id: weapon.id, attacks: weapon.attacks, projectile: weapon.projectile,
  lifesteal: weapon.lifesteal || 0, shockwave: !!weapon.shockwave, breakPower: weapon.breakPower || 0,
}]));
export const ECLIPSE_SHOP_ITEMS = ECLIPSE_WEAPONS.map((weapon) => ({
  id: weapon.id, name: weapon.name, cost: weapon.cost, type: 'weapon', glyph: weapon.glyph,
  desc: weapon.desc, effect: `${weapon.style} · mastery 1–5`, eclipse: true,
}));

// ── enemy/combat balance policy ────────────────────────────────────────────
export const ENEMY_AGGRO_RADIUS = 620;
export const ENEMY_DETAIL_RADIUS = 900;
export const ENEMY_SLOW_TICK = 0.24;
export const AI_UPDATE_BUDGET = 48;
export const PARTICLE_BUDGET = 220;
export const MAX_PROJECTILES = 180;
export const MAX_FX = 260;

export function aiUpdateInterval(distance) {
  const d = Math.abs(Number(distance) || 0);
  if (d <= ENEMY_DETAIL_RADIUS) return 1 / 120;
  if (d <= 1600) return ENEMY_SLOW_TICK;
  return 0.5;
}

// ── graphics + performance ─────────────────────────────────────────────────
export const GRAPHICS_PRESETS = {
  low: { label: 'Low', resolutionScale: 0.65, frameCap: 30, shadowQuality: 'off', particleDensity: 0.35, lightingQuality: 'low', textureQuality: 'low', antiAliasing: false, vfxQuality: 'low', animationQuality: 'low', backgroundEffects: false, renderDistance: 60 },
  medium: { label: 'Medium', resolutionScale: 0.85, frameCap: 60, shadowQuality: 'low', particleDensity: 0.65, lightingQuality: 'medium', textureQuality: 'medium', antiAliasing: false, vfxQuality: 'medium', animationQuality: 'medium', backgroundEffects: true, renderDistance: 78 },
  high: { label: 'High', resolutionScale: 1, frameCap: 60, shadowQuality: 'medium', particleDensity: 1, lightingQuality: 'high', textureQuality: 'high', antiAliasing: true, vfxQuality: 'high', animationQuality: 'high', backgroundEffects: true, renderDistance: 100 },
  ultra: { label: 'Ultra', resolutionScale: 1.15, frameCap: 120, shadowQuality: 'high', particleDensity: 1.3, lightingQuality: 'ultra', textureQuality: 'ultra', antiAliasing: true, vfxQuality: 'ultra', animationQuality: 'ultra', backgroundEffects: true, renderDistance: 100 },
  custom: { label: 'Custom', resolutionScale: 1, frameCap: 60, shadowQuality: 'medium', particleDensity: 1, lightingQuality: 'high', textureQuality: 'high', antiAliasing: true, vfxQuality: 'high', animationQuality: 'high', backgroundEffects: true, renderDistance: 100 },
};

export const GRAPHICS_OPTIONS = {
  shadowQuality: ['off', 'low', 'medium', 'high'],
  particleDensity: ['off', 'low', 'full'],
  lightingQuality: ['low', 'medium', 'high', 'ultra'],
  textureQuality: ['low', 'medium', 'high', 'ultra'],
  antiAliasing: [false, true],
  vfxQuality: ['low', 'medium', 'high', 'ultra'],
  animationQuality: ['low', 'medium', 'high', 'ultra'],
  resolutionScale: [0.5, 0.65, 0.75, 0.85, 1, 1.15],
  frameCap: [30, 60, 90, 120, 0],
  backgroundEffects: [false, true],
  renderDistance: [50, 60, 75, 90, 100],
};

export function graphicsPreset(id) {
  return { ...(GRAPHICS_PRESETS[id] || GRAPHICS_PRESETS.high) };
}

export function suggestGraphics(sample = {}) {
  const p95 = Number(sample.p95) || 16.67;
  const memory = Number(sample.peakMemoryMb) || 0;
  if (p95 > 33 || memory > 900) return 'low';
  if (p95 > 22 || memory > 650) return 'medium';
  if (p95 > 17.5) return 'high';
  return 'ultra';
}

export class PerformanceSampler {
  constructor({ capacity = 240 } = {}) {
    this.capacity = capacity;
    this.frames = [];
    this.startedAt = 0;
    this.peakMemoryMb = 0;
  }
  reset() { this.frames.length = 0; this.startedAt = 0; this.peakMemoryMb = 0; }
  sample(frameMs, memoryMb = 0) {
    const ms = Number(frameMs);
    if (!Number.isFinite(ms) || ms < 0) return;
    this.frames.push(ms);
    if (this.frames.length > this.capacity) this.frames.shift();
    this.peakMemoryMb = Math.max(this.peakMemoryMb, Number(memoryMb) || 0);
  }
  summary() {
    if (!this.frames.length) return { frames: 0, average: 0, p95: 0, p99: 0, fps: 0, peakMemoryMb: this.peakMemoryMb, budget: { average: 16.67, p95: 20, p99: 33.33 } };
    const sorted = [...this.frames].sort((a, b) => a - b);
    const pick = (p) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
    const average = this.frames.reduce((sum, value) => sum + value, 0) / this.frames.length;
    return {
      frames: this.frames.length, average: round(average, 2), p95: round(pick(0.95), 2), p99: round(pick(0.99), 2),
      fps: round(1000 / average, 1), peakMemoryMb: round(this.peakMemoryMb, 1),
      withinBudget: average <= 16.67 && pick(0.95) <= 20 && pick(0.99) <= 33.33,
    };
  }
}

// ── progress + save integrity ──────────────────────────────────────────────
function blankBosses() {
  return Object.fromEntries([...ECLIPSE_BOSSES, ECLIPSE_SECRET_BOSS].map((boss) => [boss.id, false]));
}

export function defaultEclipseProgress() {
  return {
    version: 1, arcId: 'eclipse', unlocked: false, rooms: Array.from({ length: ECLIPSE_STANDARD_LEVEL_COUNT }, () => false),
    bosses: blankBosses(), fragments: [], secret: false, firstAuthor: false, completed: false,
    archive: { enemies: [], bosses: [] }, deaths: 0, runs: 0, bestTime: 0, title: false,
  };
}

export function sanitizeEclipseProgress(raw) {
  const defaults = defaultEclipseProgress();
  const source = raw && typeof raw === 'object' ? raw : {};
  const rooms = Array.from({ length: ECLIPSE_STANDARD_LEVEL_COUNT }, (_, index) => Boolean(source.rooms?.[index]));
  const bosses = Object.fromEntries(Object.entries(defaults.bosses).map(([id]) => [id, Boolean(source.bosses?.[id])]));
  const fragments = [...new Set((Array.isArray(source.fragments) ? source.fragments : []).filter((id) => ECLIPSE_FRAGMENTS.some((f) => f.id === id)))];
  const secret = fragments.length >= ECLIPSE_FRAGMENT_COUNT && Boolean(source.secret);
  return {
    version: 1, arcId: 'eclipse', unlocked: Boolean(source.unlocked || bosses.obsidian_king),
    rooms, bosses, fragments, secret,
    firstAuthor: secret && Boolean(source.firstAuthor),
    completed: Boolean(source.completed && bosses.forgotten_high_god),
    archive: {
      enemies: [...new Set((Array.isArray(source.archive?.enemies) ? source.archive.enemies : []).filter((id) => ECLIPSE_ENEMY_INFO[id]))],
      bosses: [...new Set((Array.isArray(source.archive?.bosses) ? source.archive.bosses : []).filter((id) => defaults.bosses[id] !== undefined))],
    },
    deaths: Math.max(0, asInt(source.deaths)), runs: Math.max(0, asInt(source.runs)),
    bestTime: Math.max(0, Number(source.bestTime) || 0), title: Boolean(source.title),
  };
}

export function eclipseRoomUnlocked(state, roomId) {
  const safe = sanitizeEclipseProgress(state);
  if (!safe.unlocked) return false;
  if (roomId === ECLIPSE_SECRET_ROOM_ID) return safe.secret;
  const room = ECLIPSE_ROOM_BY_ID[roomId];
  if (!room) return false;
  const biomeIndex = room.eclipseBiome - 1;
  const flat = biomeIndex * ECLIPSE_LEVELS_PER_BIOME + Math.max(0, room.eclipseSlot || 0);
  if (room.eclipseBoss) {
    const biomeCleared = safe.rooms.slice(biomeIndex * ECLIPSE_LEVELS_PER_BIOME, (biomeIndex + 1) * ECLIPSE_LEVELS_PER_BIOME).every(Boolean);
    const previousBoss = biomeIndex > 0 ? ECLIPSE_BOSSES[biomeIndex - 1] : null;
    return biomeCleared && (!previousBoss || !!safe.bosses[previousBoss.id]);
  }
  if (flat === 0) return true;
  if (room.eclipseSlot === 0) {
    const previousBoss = ECLIPSE_BOSSES[biomeIndex - 1];
    return !!previousBoss && !!safe.bosses[previousBoss.id];
  }
  return !!safe.rooms[flat - 1];
}

export function recordEclipseRoom(state, roomId) {
  const safe = state && typeof state === 'object' ? state : defaultEclipseProgress();
  Object.assign(safe, sanitizeEclipseProgress(safe));
  const room = ECLIPSE_ROOM_BY_ID[roomId];
  if (!room || !room.eclipseStandard) return { ok: false };
  const local = roomId - ECLIPSE_ROOM_START;
  const slot = local % 6;
  const index = room.eclipseBiome - 1;
  if (slot >= ECLIPSE_LEVELS_PER_BIOME) return { ok: false };
  const flat = index * ECLIPSE_LEVELS_PER_BIOME + slot;
  const first = !safe.rooms[flat];
  safe.rooms[flat] = true;
  safe.unlocked = true;
  if (first) safe.runs += 1;
  return { ok: true, first, index: flat };
}

export function recordEclipseBoss(state, bossId) {
  const safe = state && typeof state === 'object' ? state : defaultEclipseProgress();
  Object.assign(safe, sanitizeEclipseProgress(safe));
  const boss = [...ECLIPSE_BOSSES, ECLIPSE_SECRET_BOSS].find((entry) => entry.id === bossId);
  if (!boss) return { ok: false };
  const first = !safe.bosses[bossId];
  safe.bosses[bossId] = true;
  safe.unlocked = true;
  if (boss.secret) {
    safe.secret = true;
    safe.firstAuthor = true;
    safe.title = true;
  } else {
    const fragment = ECLIPSE_FRAGMENTS.find((entry) => entry.biome === boss.biome);
    if (fragment && !safe.fragments.includes(fragment.id)) safe.fragments.push(fragment.id);
    if (safe.fragments.length >= ECLIPSE_FRAGMENT_COUNT) safe.secret = true;
  }
  if (boss.id === 'forgotten_high_god') safe.completed = true;
  return { ok: true, first, fragment: ECLIPSE_FRAGMENTS.find((entry) => entry.biome === boss.biome) || null, secret: safe.secret };
}

export function eclipseSummary(state) {
  const safe = sanitizeEclipseProgress(state);
  return {
    ...safe, roomsCleared: safe.rooms.filter(Boolean).length, roomTotal: ECLIPSE_STANDARD_LEVEL_COUNT,
    bossesCleared: Object.values(safe.bosses).filter(Boolean).length, bossTotal: 7,
    fragments: safe.fragments.length, fragmentTotal: ECLIPSE_FRAGMENT_COUNT,
    progress: Math.round((safe.rooms.filter(Boolean).length / ECLIPSE_STANDARD_LEVEL_COUNT) * 100),
    secretBoss: ECLIPSE_SECRET_BOSS.id, secretUnlocked: safe.fragments.length >= ECLIPSE_FRAGMENT_COUNT,
  };
}

export function unlockEclipse(state) {
  const safe = sanitizeEclipseProgress(state);
  safe.unlocked = true;
  safe.arcId = 'eclipse';
  return safe;
}

export function recordEclipseDeath(state) {
  const safe = state && typeof state === 'object' ? state : defaultEclipseProgress();
  safe.deaths = Math.max(0, asInt(safe.deaths)) + 1;
  return safe.deaths;
}

// Versioned save envelope and non-destructive migration. The browser layer is
// responsible for writing the backup before replacing the old key.
export const SAVE_SCHEMA_VERSION = 2;
export const SAVE_KEYS = {
  progress: 'ashen-vow-progress-v1',
  backup: 'ashen-vow-progress-v1-backup',
  quarantine: 'ashen-vow-progress-v1-quarantine',
};

export function createSaveEnvelope(progress) {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION, savedAt: Date.now(),
    progress: progress && typeof progress === 'object' ? progress : {},
  };
}

export function validateSaveEnvelope(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'not_object' };
  const progress = raw.progress && typeof raw.progress === 'object' ? raw.progress : raw;
  if (!progress || typeof progress !== 'object') return { ok: false, error: 'missing_progress' };
  if (progress.version != null && (!Number.isInteger(Number(progress.version)) || Number(progress.version) < 1)) return { ok: false, error: 'bad_version' };
  return { ok: true, schemaVersion: asInt(raw.schemaVersion, 1), progress };
}

export function migrateSave(raw) {
  const validation = validateSaveEnvelope(raw);
  if (!validation.ok) return { ok: false, error: validation.error, backupRequired: true };
  const progress = { ...validation.progress };
  const from = validation.schemaVersion;
  progress.eclipse = sanitizeEclipseProgress(progress.eclipse);
  progress.godfall = sanitizeGodfallProgress(progress.godfall);
  progress.guild = sanitizeGuildState(progress.guild);
  progress.awakening = sanitizeAwakeningProgress(progress.awakening);
  progress.schemaVersion = SAVE_SCHEMA_VERSION;
  return { ok: true, from, to: SAVE_SCHEMA_VERSION, progress, migrated: from < SAVE_SCHEMA_VERSION, backupRequired: from < SAVE_SCHEMA_VERSION };
}

export function eclipseCatalog() {
  return ECLIPSE_ROOMS.map((room) => ({
    id: room.id, name: room.name, subtitle: room.subtitle, biome: room.eclipseBiome,
    biomeId: room.eclipseBiomeId, slot: room.eclipseSlot, boss: room.eclipseBoss || null,
    standard: !!room.eclipseStandard, enemies: room.enemies.length,
    elite: room.enemies.some((enemy) => ECLIPSE_ENEMY_INFO[enemy.type]?.elite),
    fragment: ECLIPSE_FRAGMENTS[room.eclipseBiome - 1] || null,
  }));
}
