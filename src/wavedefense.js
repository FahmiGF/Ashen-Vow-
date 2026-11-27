// Ashen Vow — Wave Defense: The Last Rampart
// Pure, deterministic castle-defense simulation. No DOM, canvas or audio here.
// The browser shell owns rendering and persistence.

export const WAVE_DEFENSE_VERSION = '0.4.0';
export const WAVE_DEFENSE_TOTAL_WAVES = 24;
export const WAVE_DEFENSE_ENDLESS_WAVES = 999;
export const WAVE_DEFENSE_INFINITOWER_TIER_WAVES = 10;
export const WAVE_DEFENSE_WORLD_W = 960;
export const WAVE_DEFENSE_WORLD_H = 540;
export const WAVE_DEFENSE_MAX_TOWER_LEVEL = 3;
export const WAVE_DEFENSE_MAX_ENEMIES = 120;
export const WAVE_DEFENSE_MAX_PROJECTILES = 180;
export const WAVE_DEFENSE_MAX_EFFECTS = 48;

const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const asNumber = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

function makeRng(seed) {
  let state = (Number(seed) >>> 0) || 0x9e3779b9;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Enemy roster ───────────────────────────────────────────────────────────
export const WAVE_DEFENSE_ENEMY_TYPES = [
  { id: 'ashen_ghoul', name: 'Ashen Ghoul', glyph: '☠', hp: 62, speed: 38, bounty: 5, damage: 2, armor: 0, radius: 10, color: '#a8b0a1', desc: 'Pejalan lambat yang bangkit dari parit abu.' },
  { id: 'ash_runner', name: 'Ash Runner', glyph: '➤', hp: 38, speed: 70, bounty: 4, damage: 1, armor: 0, radius: 8, color: '#d5a36a', desc: 'Berlari cepat menuju gerbang tanpa memedulikan menara.' },
  { id: 'bone_shield', name: 'Bone Shield', glyph: '▣', hp: 135, speed: 29, bounty: 8, damage: 3, armor: 0.35, radius: 12, color: '#d8c69b', desc: 'Perisai tulang menahan sebagian besar damage fisik.' },
  { id: 'cinder_brute', name: 'Cinder Brute', glyph: '●', hp: 245, speed: 24, bounty: 12, damage: 6, armor: 0.18, radius: 15, color: '#c56a3d', desc: 'Raksasa bara yang memecah barikade dengan satu pukulan.' },
  { id: 'grave_bat', name: 'Grave Bat', glyph: '⌁', hp: 48, speed: 66, bounty: 5, damage: 2, armor: 0, radius: 8, color: '#8876a8', desc: 'Terbang di atas jalan dan sulit ditangkap menara lambat.' },
  { id: 'plague_cultist', name: 'Plague Cultist', glyph: '✚', hp: 76, speed: 34, bounty: 9, damage: 2, armor: 0, radius: 9, color: '#76a65a', healAura: 10, desc: 'Memulihkan luka pasukan di sekitarnya setiap beberapa detik.' },
  { id: 'iron_ogre', name: 'Iron Ogre', glyph: '♜', hp: 390, speed: 22, bounty: 15, damage: 8, armor: 0.3, radius: 17, color: '#78818f', desc: 'Baju besi tebal dan langkah yang mengguncang tanah.' },
  { id: 'frost_wraith', name: 'Frost Wraith', glyph: '❄', hp: 94, speed: 47, bounty: 8, damage: 3, armor: 0.05, radius: 10, color: '#83c7dc', desc: 'Tubuh beku yang kebal terhadap sebagian sihir.' },
  { id: 'siege_ram', name: 'Siege Ram', glyph: '▰', hp: 540, speed: 18, bounty: 20, damage: 13, armor: 0.42, radius: 19, color: '#9a6c48', desc: 'Mesin pendobrak yang menghancurkan gerbang dengan cepat.' },
  { id: 'shadow_stalker', name: 'Shadow Stalker', glyph: '◈', hp: 88, speed: 74, bounty: 9, damage: 3, armor: 0.08, radius: 9, color: '#735d9b', desc: 'Bergerak di sela bayangan menuju tembok terlemah.' },
  { id: 'ember_hound', name: 'Ember Hound', glyph: '◆', hp: 116, speed: 57, bounty: 7, damage: 3, armor: 0.05, radius: 10, color: '#e08a45', desc: 'Anjing bara yang mengejar celah pertahanan.' },
  { id: 'void_priest', name: 'Void Priest', glyph: '✧', hp: 158, speed: 31, bounty: 12, damage: 4, armor: 0.12, radius: 11, color: '#9b6bd6', desc: 'Memberi perlindungan gelap kepada gerombolan di dekatnya.' },
  { id: 'drowned_reaver', name: 'Drowned Reaver', glyph: '⚔', hp: 96, speed: 61, bounty: 8, damage: 4, armor: 0.16, radius: 10, color: '#6fa3a8', desc: 'Perampas dari jalur karam: cepat dan berlapis karat.' },
  { id: 'bone_herald', name: 'Bone Herald', glyph: '♞', hp: 210, speed: 28, bounty: 13, damage: 5, armor: 0.22, radius: 13, color: '#cbbf96', armorAura: 0.12, desc: 'Membagikan pelat tulang: musuh di dekatnya mendapat +12% armor.' },
  { id: 'mirror_thrall', name: 'Mirror Thrall', glyph: '◫', hp: 74, speed: 52, bounty: 7, damage: 2, armor: 0.04, radius: 9, color: '#9fc8d8', split: 'ash_runner', splitCount: 2, unlockTier: 1, desc: 'Pecah menjadi dua Ash Runner saat gugur; menara area lebih berharga.' },
  { id: 'cinder_wraith', name: 'Cinder Wraith', glyph: '❂', hp: 108, speed: 68, bounty: 9, damage: 3, armor: 0.1, radius: 9, color: '#ff9f6a', slowImmune: true, unlockTier: 2, desc: 'Tubuh bara yang menolak semua efek perlambatan.' },
  { id: 'grave_chorister', name: 'Grave Chorister', glyph: '♫', hp: 132, speed: 30, bounty: 11, damage: 3, armor: 0.06, radius: 10, color: '#b6a6e0', hasteAura: 0.22, unlockTier: 2, desc: 'Nyanyian kubur mempercepat musuh di sekitarnya hingga +22%.' },
  { id: 'tower_breaker', name: 'Tower Breaker', glyph: '⛏', hp: 186, speed: 36, bounty: 14, damage: 5, armor: 0.24, radius: 12, color: '#d98a5a', disabler: { radius: 96, cooldown: 3.6, duration: 2.4 }, unlockTier: 3, desc: 'Melumpuhkan menara terdekat selama 2,4 detik setiap 3,6 detik.' },
  { id: 'obsidian_golem', name: 'Obsidian Golem', glyph: '⛰', hp: 640, speed: 20, bounty: 22, damage: 9, armor: 0.45, radius: 17, color: '#8f8fb0', regen: 16, unlockTier: 4, desc: 'Obsidian hidup: armor tebal dan memulihkan 16 HP setiap dua detik.' },
  { id: 'rift_hopper', name: 'Rift Hopper', glyph: '⤳', hp: 66, speed: 62, bounty: 8, damage: 2, armor: 0, radius: 9, color: '#b39cff', blink: { interval: 3.6, distance: 34 }, unlockTier: 2, desc: 'Melompat ke depan sepanjang jalan setiap 3,6 detik; menara berjangkauan pendek kehilangan target.' },
  { id: 'lantern_moth', name: 'Lantern Moth', glyph: '✺', hp: 58, speed: 74, bounty: 7, damage: 2, armor: 0.04, radius: 8, color: '#ffe19a', deathBlind: { radius: 100, duration: 1.6 }, unlockTier: 3, desc: 'Saat mati, sayapnya membutakan menara di sekitarnya selama 1,6 detik.' },
  { id: 'grave_taxer', name: 'Grave Taxer', glyph: '¤', hp: 152, speed: 47, bounty: 10, damage: 4, armor: 0.12, radius: 11, color: '#c9d18a', toll: 14, unlockTier: 4, desc: 'Jika mencapai gerbang, ia merampas 14 emas selain merusak kastil.' },
  { id: 'bone_colossus', name: 'Bone Colossus', glyph: '♛', hp: 1900, speed: 18, bounty: 60, damage: 16, armor: 0.2, radius: 24, color: '#efe2bb', boss: true, desc: 'BOS · Rangka raksasa yang memimpin gelombang keempat.' },
  { id: 'ember_wyrm', name: 'Ember Wyrm', glyph: '♨', hp: 3100, speed: 20, bounty: 90, damage: 19, armor: 0.15, radius: 25, color: '#ff7a45', boss: true, desc: 'BOS · Sayap bara yang membakar jalan di belakangnya.' },
  { id: 'plague_matriarch', name: 'Plague Matriarch', glyph: '✹', hp: 4400, speed: 18, bounty: 115, damage: 21, armor: 0.12, radius: 26, color: '#8ccf66', boss: true, desc: 'BOS · Induk wabah yang memanggil kultus dari tanah.' },
  { id: 'iron_warden', name: 'Iron Warden', glyph: '⛨', hp: 6500, speed: 16, bounty: 150, damage: 26, armor: 0.38, radius: 27, color: '#aab7c8', boss: true, desc: 'BOS · Penjaga baja dengan perisai yang hampir tak tertembus.' },
  { id: 'frost_titan', name: 'Frost Titan', glyph: '✵', hp: 8800, speed: 15, bounty: 190, damage: 30, armor: 0.25, radius: 29, color: '#a6e6ff', boss: true, desc: 'BOS · Gunung es berjalan yang membekukan menara di sekitarnya.' },
  { id: 'ashen_sovereign', name: 'Ashen Sovereign', glyph: '♚', hp: 12500, speed: 14, bounty: 280, damage: 42, armor: 0.3, radius: 32, color: '#ffd166', boss: true, desc: 'BOS AKHIR · Raja abu yang datang untuk memadamkan sumpah terakhir.' },
  { id: 'spiral_tyrant', name: 'Spiral Tyrant', glyph: '♜', hp: 15800, speed: 16, bounty: 320, damage: 46, armor: 0.32, radius: 30, color: '#c9a9ff', boss: true, hasteAura: 0.18, desc: 'BOS INFINITOWER · Tiran lingkar abadi yang mempercepat seluruh pasukannya.' },
  { id: 'lantern_devourer', name: 'Lantern Devourer', glyph: '☄', hp: 21000, speed: 17, bounty: 380, damage: 52, armor: 0.26, radius: 31, color: '#ffcf7a', boss: true, slowImmune: true, regen: 55, desc: 'BOS INFINITOWER · Pelahap lentera yang pulih 55 HP tiap dua detik dan menolak perlambatan.' },
  { id: 'spiral_choir', name: 'Spiral Choir', glyph: '❈', hp: 18500, speed: 15, bounty: 350, damage: 48, armor: 0.22, radius: 31, color: '#c8d4ff', boss: true, summon: { type: 'mirror_thrall', count: 2, cooldown: 7 }, desc: 'BOS INFINITOWER · Koor lingkar yang memanggil dua Mirror Thrall setiap tujuh detik dan menyanyikan gelombang yang sudah mati.' },
];

export const WAVE_DEFENSE_ENEMY_BY_ID = Object.fromEntries(WAVE_DEFENSE_ENEMY_TYPES.map((enemy) => [enemy.id, enemy]));
export const WAVE_DEFENSE_BOSSES = WAVE_DEFENSE_ENEMY_TYPES.filter((enemy) => enemy.boss);

// ── Tower roster ───────────────────────────────────────────────────────────
export const WAVE_DEFENSE_TOWERS = [
  { id: 'ballista', name: 'Ballista', glyph: '➶', cost: 70, damage: 34, rate: 1.05, range: 154, projectileSpeed: 560, color: '#d6b16f', shape: 'bolt', desc: 'Panah raksasa: damage tunggal tinggi dan jangkauan menengah.' },
  { id: 'catapult', name: 'Catapult', glyph: '◉', cost: 95, damage: 27, rate: 0.68, range: 172, splash: 46, projectileSpeed: 360, color: '#b98a5a', shape: 'lob', desc: 'Batu lambat dengan ledakan area kecil; efektif melawan gerombolan.' },
  { id: 'mage_tower', name: 'Mage Tower', glyph: '✦', cost: 110, damage: 38, rate: 1, range: 148, projectileSpeed: 520, magic: true, color: '#8a86e8', shape: 'orb', desc: 'Bola arkana yang mengabaikan sebagian besar armor.' },
  { id: 'frost_spire', name: 'Frost Spire', glyph: '❄', cost: 90, damage: 15, rate: 0.95, range: 136, projectileSpeed: 500, magic: true, slow: 0.55, slowTime: 2.1, color: '#7ac8e8', shape: 'spire', desc: 'Memperlambat musuh hingga 45% selama dua detik.' },
  { id: 'cannon_tower', name: 'Cannon Tower', glyph: '●', cost: 150, damage: 52, rate: 0.55, range: 158, splash: 42, projectileSpeed: 430, color: '#bb7650', shape: 'cannon', desc: 'Meriam mesiu: damage area dan hentakan yang kuat.' },
  { id: 'trebuchet', name: 'Trebuchet', glyph: '◒', cost: 170, damage: 82, rate: 0.38, range: 238, splash: 66, projectileSpeed: 310, color: '#c9a36a', shape: 'lob', desc: 'Lemparan jarak jauh dengan ledakan besar dan cooldown panjang.' },
  { id: 'flame_keep', name: 'Flame Keep', glyph: '▲', cost: 125, damage: 23, rate: 1.7, range: 108, splash: 34, projectileSpeed: 470, color: '#f0844f', shape: 'flame', desc: 'Semburan api cepat untuk menahan gelombang rapat.' },
  { id: 'poison_grove', name: 'Poison Grove', glyph: '☘', cost: 105, damage: 13, rate: 0.75, range: 142, projectileSpeed: 440, poison: 11, poisonTime: 4, magic: true, color: '#77b95b', shape: 'vine', desc: 'Racun yang terus menggerus musuh selama empat detik.' },
  { id: 'tesla_coil', name: 'Tesla Coil', glyph: 'ϟ', cost: 160, damage: 40, rate: 0.82, range: 146, projectileSpeed: 700, chain: 2, magic: true, color: '#7ed8e7', shape: 'coil', desc: 'Petir yang melompat ke dua musuh terdekat.' },
  { id: 'sniper_nest', name: "Sniper's Nest", glyph: '✜', cost: 180, damage: 98, rate: 0.33, range: 278, projectileSpeed: 850, color: '#d8d2b5', shape: 'sniper', desc: 'Tembakan sangat jauh; setiap tembakan keempat menjadi kritikal.' },
  { id: 'holy_chapel', name: 'Holy Chapel', glyph: '✚', cost: 150, damage: 31, rate: 0.72, range: 154, projectileSpeed: 500, magic: true, healCastle: 0.7, color: '#f0d58a', shape: 'holy', desc: 'Cahaya suci yang memulihkan sedikit HP kastil setiap tembakan.' },
  { id: 'rift_obelisk', name: 'Rift Obelisk', glyph: '◎', cost: 220, damage: 70, rate: 0.6, range: 188, splash: 32, projectileSpeed: 480, magic: true, slow: 0.82, slowTime: 1.1, color: '#b67bdf', shape: 'rift', desc: 'Ledakan dimensi yang memperlambat semua musuh di area.' },
  { id: 'vow_banner', name: 'Panji Sumpah', glyph: '⚑', cost: 190, damage: 0, rate: 0.1, range: 0, projectileSpeed: 0, support: true, aura: { radius: 136, damage: 0.2, rate: 0.12 }, color: '#e3c37c', shape: 'banner', desc: 'Tidak menembak. Menara lain dalam radius mendapat +20% damage dan +12% laju tembak per level.' },
  { id: 'spirit_lantern', name: 'Lentera Roh', glyph: '✶', cost: 165, damage: 18, rate: 0.9, range: 138, projectileSpeed: 640, magic: true, mark: 4, color: '#a9e6d6', shape: 'lantern', desc: 'Menandai musuh selama empat detik; target bertanda menerima 20% damage lebih banyak.' },
  { id: 'echo_monolith', name: 'Monolit Gema', glyph: '◈', cost: 175, damage: 34, rate: 0.62, range: 170, projectileSpeed: 600, chain: 3, magic: true, color: '#b6a4ff', shape: 'monolith', desc: 'Gema melompat ke tiga musuh berurutan; damage sihir dengan jangkauan lebar.' },
  { id: 'grave_bell', name: 'Lonceng Kubur', glyph: '♪', cost: 140, damage: 14, rate: 0.8, range: 132, splash: 34, projectileSpeed: 420, magic: true, stun: 0.9, color: '#d8c48a', shape: 'bell', desc: 'Gelombang bunyi menghentikan gerak musuh di area selama 0,9 detik.' },
  { id: 'ash_forge', name: 'Tempa Abu', glyph: '⚒', cost: 130, damage: 20, rate: 0.9, range: 132, splash: 28, projectileSpeed: 480, shred: 0.2, shredTime: 5, color: '#e58a5c', shape: 'forge', desc: 'Menghancurkan armor target sebesar 20% selama lima detik; musuh berpelat jadi rapuh.' },
  { id: 'watcher_eye', name: 'Mata Pengawas', glyph: '⊙', cost: 205, damage: 46, rate: 0.55, range: 224, projectileSpeed: 780, execute: 0.35, executeBonus: 2.4, color: '#f0a878', shape: 'eye', desc: 'Menembak jauh dan menghabisi musuh di bawah 35% HP dengan damage 2,4 kali.' },
  { id: 'spiral_anchor', name: 'Jangkar Lingkar', glyph: '⚓', cost: 160, damage: 26, rate: 0.9, range: 150, splash: 40, projectileSpeed: 500, magic: true, slow: 0.62, slowTime: 2.4, color: '#8fb6ff', shape: 'anchor', desc: 'Jangkar sihir yang meledak di area dan memperlambat semua yang tertangkap hingga 62% selama 2,4 detik.' },
  { id: 'hourglass', name: 'Jam Pasir Ketiga', glyph: '⧗', cost: 185, damage: 0, rate: 0.1, range: 0, projectileSpeed: 0, support: true, field: { radius: 148, slow: 0.24 }, color: '#d8c0ff', shape: 'hourglass', desc: 'Tidak menembak. Medan waktu di radius 148 memperlambat setiap musuh 24% selama menara ini berdiri.' },
];

export const WAVE_DEFENSE_TOWER_BY_ID = Object.fromEntries(WAVE_DEFENSE_TOWERS.map((tower) => [tower.id, tower]));

export const WAVE_DEFENSE_DIFFICULTIES = [
  { id: 'squire', name: 'SQUIRE', hp: 0.82, speed: 0.92, gold: 320, castle: 140, desc: 'Gelombang lebih ringan dan kas kastil lebih longgar.' },
  { id: 'knight', name: 'KNIGHT', hp: 1, speed: 1, gold: 270, castle: 120, desc: 'Pengalaman standar: setiap gelombang menuntut menara baru.' },
  { id: 'warlord', name: 'WARLORD', hp: 1.35, speed: 1.1, gold: 225, castle: 100, desc: 'Musuh lebih tebal dan cepat; hanya ekonomi presisi yang bertahan.' },
  { id: 'eternal', name: 'ETERNAL', hp: 1.75, speed: 1.22, gold: 195, castle: 80, desc: 'Tingkat terberat: musuh 75% lebih tebal, 22% lebih cepat, dan mahkota hanya 80 HP.' },
];

export const WAVE_DEFENSE_DIFFICULTY_BY_ID = Object.fromEntries(WAVE_DEFENSE_DIFFICULTIES.map((entry) => [entry.id, entry]));

// ── Procedural rigs ────────────────────────────────────────────────────────
// Bodies are no longer single glyphs: each one is drawn from a small
// articulated rig (legs, arms, head, body bob). The rig is pure data so the
// pose can be unit-tested in Node without a canvas.
export const WAVE_DEFENSE_RIGS = {
  humanoid: { legs: 2, arms: 2, bob: 1.6, stride: 0.34, lean: 0.06, head: 0.55 },
  hound: { legs: 4, arms: 0, bob: 1.1, stride: 0.42, lean: 0.12, head: 0.42 },
  wraith: { legs: 0, arms: 2, bob: 2.4, stride: 0.1, lean: 0.04, head: 0.5, float: true },
  brute: { legs: 2, arms: 2, bob: 1.2, stride: 0.2, lean: 0.09, head: 0.46 },
  colossus: { legs: 2, arms: 2, bob: 0.9, stride: 0.16, lean: 0.05, head: 0.4 },
};

const RIG_FAMILY = {
  ashen_ghoul: 'humanoid', ash_runner: 'humanoid', bone_shield: 'humanoid',
  cinder_brute: 'brute', grave_bat: 'wraith', plague_cultist: 'humanoid',
  iron_ogre: 'brute', frost_wraith: 'wraith', siege_ram: 'brute',
  shadow_stalker: 'humanoid', ember_hound: 'hound', void_priest: 'humanoid',
  drowned_reaver: 'humanoid', bone_herald: 'humanoid', mirror_thrall: 'wraith',
  cinder_wraith: 'wraith', grave_chorister: 'humanoid', tower_breaker: 'brute',
  obsidian_golem: 'colossus', rift_hopper: 'humanoid', lantern_moth: 'wraith',
  grave_taxer: 'humanoid',
  bone_colossus: 'colossus', ember_wyrm: 'brute', plague_matriarch: 'brute',
  iron_warden: 'colossus', frost_titan: 'colossus', ashen_sovereign: 'colossus',
  spiral_tyrant: 'colossus', lantern_devourer: 'brute', spiral_choir: 'wraith',
};

export function waveDefenseRigFor(kind) {
  return WAVE_DEFENSE_RIGS[RIG_FAMILY[kind] || 'humanoid'];
}

// Deterministic pose: the same kind and time always returns the same rig frame,
// so a capture or a test never sees a random walk cycle.
export function rigPoseFor(kind, time = 0, { moving = true, boss = false } = {}) {
  const rig = waveDefenseRigFor(kind);
  const t = Math.max(0, Number(time) || 0);
  const cadence = rig.float ? 1.2 : 6.2;
  const phase = t * cadence;
  const swing = moving ? Math.sin(phase) : Math.sin(phase) * 0.12;
  return {
    family: RIG_FAMILY[kind] || 'humanoid',
    bob: Math.sin(phase * 2) * rig.bob * (moving ? 1 : 0.25) - (boss ? 1 : 0),
    stride: swing * rig.stride,
    arm: -swing * rig.stride * 0.8,
    lean: rig.lean * (moving ? 1 : 0.4),
    float: !!rig.float,
    legs: rig.legs,
    arms: rig.arms,
  };
}

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

// ── Maps and build sites ───────────────────────────────────────────────────
function distPointSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1);
  const x = ax + dx * t;
  const y = ay + dy * t;
  return Math.hypot(px - x, py - y);
}

function pathLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  return total;
}

function makeSlots(path, castle, wanted = 24) {
  const candidates = [];
  for (let segment = 0; segment < path.length - 1; segment += 1) {
    const a = path[segment];
    const b = path[segment + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    for (let t = 0.18; t < 0.92; t += 0.17) {
      for (const side of [-1, 1]) {
        const x = a.x + dx * t + nx * 56 * side;
        const y = a.y + dy * t + ny * 56 * side;
        if (x < 44 || x > 912 || y < 70 || y > 482) continue;
        if (Math.hypot(x - castle.x, y - castle.y) < 78) continue;
        let pathGap = Infinity;
        for (let s = 0; s < path.length - 1; s += 1) {
          pathGap = Math.min(pathGap, distPointSegment(x, y, path[s].x, path[s].y, path[s + 1].x, path[s + 1].y));
        }
        if (pathGap < 38) continue;
        if (candidates.some((slot) => Math.hypot(slot.x - x, slot.y - y) < 52)) continue;
        candidates.push({ x: Math.round(x), y: Math.round(y) });
      }
    }
  }
  if (candidates.length > wanted) {
    const stride = candidates.length / wanted;
    return Array.from({ length: wanted }, (_, index) => candidates[Math.floor(index * stride)]);
  }
  return candidates;
}

const MAP_BLUEPRINTS = [
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

export const WAVE_DEFENSE_MAPS = MAP_BLUEPRINTS.map((map) => ({
  ...map,
  pathLength: pathLength(map.path),
  slots: makeSlots(map.path, map.castle),
}));
export const WAVE_DEFENSE_MAP_BY_ID = Object.fromEntries(WAVE_DEFENSE_MAPS.map((map) => [map.id, map]));

// ── 24 hand-authored waves, six bosses ─────────────────────────────────────
export const WAVE_DEFENSE_WAVES = [
  { label: 'Debu di Jalan', groups: [['ashen_ghoul', 6, 0.92]] },
  { label: 'Lari Sebelum Fajar', groups: [['ash_runner', 8, 0.62]] },
  { label: 'Perisai Tulang', groups: [['ashen_ghoul', 8, 0.72], ['bone_shield', 3, 1.15, 3.4]] },
  { label: 'Rangka Raksasa', groups: [['bone_colossus', 1, 1, 1.1], ['ashen_ghoul', 4, 0.9, 3.6]] },
  { label: 'Sayap Malam', groups: [['grave_bat', 10, 0.52]] },
  { label: 'Bara dan Bastion', groups: [['ember_hound', 8, 0.62], ['bone_shield', 4, 1, 2.8], ['drowned_reaver', 6, 0.55, 1.8]] },
  { label: 'Wabah Berjalan', groups: [['plague_cultist', 4, 1.2], ['ashen_ghoul', 10, 0.58, 2]] },
  { label: 'Naga Bara', groups: [['ember_wyrm', 1, 1, 1], ['ash_runner', 6, 0.58, 3.8]] },
  { label: 'Langkah Besi', groups: [['iron_ogre', 4, 1.45], ['bone_shield', 6, 0.82, 3]] },
  { label: 'Kabut Beku', groups: [['frost_wraith', 10, 0.62], ['grave_bat', 8, 0.55, 2.6]] },
  { label: 'Bayangan di Parit', groups: [['shadow_stalker', 10, 0.52], ['ember_hound', 8, 0.68, 2.4]] },
  { label: 'Induk Wabah', groups: [['plague_matriarch', 1, 1, 1], ['plague_cultist', 4, 0.9, 4.2]] },
  { label: 'Pendobrak Gerbang', groups: [['siege_ram', 3, 2.1], ['bone_shield', 8, 0.8, 2.2]] },
  { label: 'Doa Hampa', groups: [['void_priest', 4, 1.3], ['iron_ogre', 5, 1.3, 3]] },
  { label: 'Langit Hitam', groups: [['grave_bat', 14, 0.38], ['frost_wraith', 10, 0.52, 2.5]] },
  { label: 'Warden Baja', groups: [['iron_warden', 1, 1, 1], ['bone_shield', 8, 0.7, 4.2]] },
  { label: 'Perburuan Bara', groups: [['ember_hound', 12, 0.5], ['shadow_stalker', 10, 0.48, 2.3]] },
  { label: 'Gunung Berjalan', groups: [['iron_ogre', 8, 1.1], ['plague_cultist', 6, 0.9, 3.2]] },
  { label: 'Mesin Pengepung', groups: [['siege_ram', 5, 1.6], ['void_priest', 6, 0.9, 2.8], ['bone_herald', 3, 1.2, 2.4]] },
  { label: 'Titan Es', groups: [['frost_titan', 1, 1, 1], ['frost_wraith', 10, 0.52, 4.4]] },
  { label: 'Malam Tanpa Menara', groups: [['shadow_stalker', 16, 0.34], ['grave_bat', 12, 0.4, 2.7]] },
  { label: 'Tembok Retak', groups: [['iron_ogre', 10, 0.9], ['siege_ram', 5, 1.5, 2.2]] },
  { label: 'Pasukan Terakhir', groups: [['bone_shield', 12, 0.55], ['ember_hound', 12, 0.5, 1.8], ['void_priest', 6, 0.9, 4.4]] },
  { label: 'Raja Abu', groups: [['ashen_sovereign', 1, 1, 1], ['iron_ogre', 6, 1.1, 4.4], ['plague_cultist', 4, 0.9, 6]] },
];

// Past wave 24 (or immediately, once the campaign is done) the endless mode
// builds waves from the whole roster with a deterministic composition.
function endlessWaveDef(wave) {
  const pool = WAVE_DEFENSE_ENEMY_TYPES.filter((enemy) => !enemy.boss);
  const groups = [];
  const base = 8 + Math.floor(wave / 3);
  for (let i = 0; i < 3; i += 1) {
    const type = pool[(wave * 3 + i * 7) % pool.length];
    groups.push([type.id, Math.max(3, Math.round(base / (i + 1))), 0.42 + i * 0.09, i * 1.5]);
  }
  if (wave % 5 === 0) {
    groups.unshift([WAVE_DEFENSE_BOSSES[(wave / 5) % WAVE_DEFENSE_BOSSES.length].id, 1, 1, 0.6]);
  }
  return { label: `Tanpa Akhir ${wave}`, groups };
}

// Infinitower: a spiral level with no victory state. Every ten waves is a new
// "tingkat" (tier) that unlocks heavier bodies and scales HP, bounty and speed.
export function infinitowerTierFor(wave) {
  return 1 + Math.floor(Math.max(0, asNumber(wave, 1) - 1) / WAVE_DEFENSE_INFINITOWER_TIER_WAVES);
}

function infinitowerWaveDef(wave) {
  const tier = infinitowerTierFor(wave);
  const pool = WAVE_DEFENSE_ENEMY_TYPES.filter((enemy) => !enemy.boss && (enemy.unlockTier || 1) <= tier);
  const groups = [];
  const base = 9 + tier * 2 + Math.floor(wave / 2);
  for (let i = 0; i < 3; i += 1) {
    const type = pool[(wave * 5 + i * 3) % pool.length];
    groups.push([type.id, Math.max(3, Math.round(base / (i + 1))), Math.max(0.3, 0.46 - tier * 0.02), i * 1.4]);
  }
  if (tier >= 3) {
    const elite = pool[(wave * 7 + 1) % pool.length];
    groups.push([elite.id, 1 + Math.floor(tier / 3), 1.1, 2.2]);
  }
  if (wave % 5 === 0) {
    groups.unshift([WAVE_DEFENSE_BOSSES[(wave / 5) % WAVE_DEFENSE_BOSSES.length].id, 1, 1, 0.6]);
  }
  return { label: `Infinitower ${wave} · Tingkat ${tier}`, groups };
}

function waveDefFor(match) {
  if (match.mode === 'infinitower') return infinitowerWaveDef(match.wave);
  return WAVE_DEFENSE_WAVES[match.wave - 1] || (match.endless ? endlessWaveDef(match.wave) : null);
}

function buildWaveQueue(match) {
  const def = waveDefFor(match);
  const queue = [];
  if (!def) return queue;
  for (const [type, count, gap, delay = 0] of def.groups) {
    for (let i = 0; i < count; i += 1) queue.push({ type, at: delay + i * gap });
  }
  queue.sort((a, b) => a.at - b.at || a.type.localeCompare(b.type));
  return queue;
}

// ── Match lifecycle ────────────────────────────────────────────────────────
export function createWaveDefense({ mapId = 'ashen_keep', difficulty = 'knight', seed = 1, endless = false, infinitower = false } = {}) {
  const mode = infinitower ? 'infinitower' : (endless ? 'endless' : 'campaign');
  const map = mode === 'infinitower'
    ? WAVE_DEFENSE_MAP_BY_ID.eternal_spiral
    : (WAVE_DEFENSE_MAP_BY_ID[mapId] || WAVE_DEFENSE_MAPS[0]);
  const diff = WAVE_DEFENSE_DIFFICULTY_BY_ID[difficulty] || WAVE_DEFENSE_DIFFICULTY_BY_ID.knight;
  const maxHp = Math.round(diff.castle);
  return {
    version: WAVE_DEFENSE_VERSION,
    mapId: map.id,
    map,
    difficulty: diff.id,
    rng: makeRng(seed),
    nextId: 1,
    time: 0,
    speed: 1,
    wave: 0,
    mode,
    endless: mode !== 'campaign',
    infinitower: mode === 'infinitower',
    tier: 1,
    storyTier: 1,
    story: spiralStoryForTier(1),
    storyLog: [],
    totalWaves: mode === 'campaign' ? WAVE_DEFENSE_TOTAL_WAVES : WAVE_DEFENSE_ENDLESS_WAVES,
    auraTimer: 0,
    phase: 'prep',
    prepTimer: 12,
    waveTime: 0,
    spawnCursor: 0,
    spawnQueue: [],
    splitQueue: [],
    castle: { x: map.castle.x, y: map.castle.y, hp: maxHp, maxHp, flash: 0 },
    gold: diff.gold,
    score: 0,
    enemies: [],
    towers: [],
    projectiles: [],
    effects: [],
    slots: map.slots.map((slot, index) => ({ index, x: slot.x, y: slot.y, towerId: null })),
    selectedSlot: -1,
    buildTowerId: 'ballista',
    stats: { kills: 0, leaks: 0, towersBuilt: 0, goldEarned: 0, damage: 0, spawned: 0, bossesDown: 0 },
    result: null,
    endedAt: 0,
    texts: [],
  };
}

function pushText(match, text, color = '#f0d7a4') {
  match.texts.push({ text, color, at: match.time });
  if (match.texts.length > 6) match.texts.shift();
}

function updateScore(match) {
  match.score = Math.round(match.stats.kills * 10 + match.wave * 120 + match.castle.hp * 4 + match.stats.bossesDown * 250);
}

function spawnEnemy(match, typeId, traveled = 0, { summoned = false } = {}) {
  const def = WAVE_DEFENSE_ENEMY_BY_ID[typeId];
  if (!def || match.enemies.length >= WAVE_DEFENSE_MAX_ENEMIES) return null;
  const diff = WAVE_DEFENSE_DIFFICULTY_BY_ID[match.difficulty];
  const tier = match.mode === 'infinitower' ? infinitowerTierFor(match.wave) : 1;
  const tierScale = 1 + (tier - 1) * 0.16;
  const waveScale = 1 + Math.max(0, match.wave - 1) * (def.boss ? 0.035 : 0.085);
  const hp = Math.max(1, Math.round(def.hp * waveScale * diff.hp * tierScale));
  const enemy = {
    id: match.nextId++,
    type: def.id,
    name: def.name,
    glyph: def.glyph,
    boss: !!def.boss,
    x: match.map.path[0].x,
    y: match.map.path[0].y,
    radius: def.radius,
    color: def.color,
    hp,
    maxHp: hp,
    speed: def.speed * diff.speed * (1 + Math.min(0.2, match.wave * 0.004) + Math.min(0.12, (tier - 1) * 0.02)),
    bounty: def.bounty + Math.floor(match.wave / 6) + (tier - 1) * 2,
    damage: def.damage + Math.floor(match.wave / 5) + (tier - 1),
    armor: def.armor || 0,
    armorAura: def.armorAura || 0,
    armorBonus: 0,
    markTimer: 0,
    healAura: def.healAura || 0,
    healTimer: 1.4,
    hasteAura: def.hasteAura || 0,
    hasteBonus: 0,
    slowImmune: !!def.slowImmune,
    slowTimer: 0,
    slowFactor: 1,
    poisonTimer: 0,
    poisonDps: 0,
    stunTimer: 0,
    shred: 0,
    shredTimer: 0,
    regen: def.regen || 0,
    regenTimer: 2,
    disabler: def.disabler
      ? { radius: def.disabler.radius, cooldown: def.disabler.cooldown, duration: def.disabler.duration, timer: def.disabler.cooldown * 0.6 }
      : null,
    fieldSlow: 0,
    blink: def.blink || null,
    blinkTimer: def.blink ? def.blink.interval * 0.6 : 0,
    deathBlind: def.deathBlind || null,
    toll: def.toll || 0,
    summon: def.summon || null,
    summonTimer: def.summon ? def.summon.cooldown : 0,
    summoned: !!summoned,
    pathIndex: 1,
    traveled,
    dead: false,
    leaked: false,
    angle: 0,
  };
  placeEnemyAt(match, enemy, traveled);
  match.enemies.push(enemy);
  match.stats.spawned += 1;
  if (def.boss) pushText(match, `${def.name} memasuki medan!`, def.color);
  return enemy;
}

function placeEnemyAt(match, enemy, traveled) {
  let remaining = Math.max(0, traveled);
  for (let i = 1; i < match.map.path.length; i += 1) {
    const a = match.map.path[i - 1];
    const b = match.map.path[i];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= dist) {
      const t = dist ? remaining / dist : 1;
      enemy.x = a.x + (b.x - a.x) * t;
      enemy.y = a.y + (b.y - a.y) * t;
      enemy.pathIndex = i;
      enemy.angle = Math.atan2(b.y - a.y, b.x - a.x);
      return;
    }
    remaining -= dist;
  }
  const last = match.map.path[match.map.path.length - 1];
  enemy.x = last.x;
  enemy.y = last.y;
  enemy.pathIndex = match.map.path.length;
}

export function waveDefenseNextWave(match) {
  if (!match || match.phase !== 'prep' || match.wave >= match.totalWaves) return false;
  const bonus = Math.max(0, Math.round(match.prepTimer * 2));
  if (bonus > 0) {
    match.gold += bonus;
    match.stats.goldEarned += bonus;
  }
  match.wave += 1;
  match.phase = 'wave';
  match.waveTime = 0;
  match.spawnCursor = 0;
  match.spawnQueue = buildWaveQueue(match);
  match.prepTimer = 0;
  if (match.mode === 'infinitower') {
    match.tier = infinitowerTierFor(match.wave);
    const chapter = spiralStoryForTier(match.tier);
    if (chapter.tier !== match.storyTier) {
      match.storyTier = chapter.tier;
      match.story = chapter;
      match.storyLog.push(chapter.tier);
      pushText(match, `TINGKAT ${chapter.tier} — ${chapter.title}`, '#c8b4ff');
    }
  }
  const def = waveDefFor(match);
  const prefix = match.mode === 'infinitower' ? `INFINITOWER ${match.wave}` : match.endless ? 'TANPA AKHIR' : 'GELOMBANG';
  pushText(match, `${prefix} ${match.wave} — ${def?.label || '?'}`, '#ffd78d');
  return true;
}

export function waveDefenseBuild(match, slotIndex, towerId = match?.buildTowerId) {
  if (!match || match.phase === 'ended') return null;
  const slot = match.slots[Number(slotIndex)];
  const def = WAVE_DEFENSE_TOWER_BY_ID[towerId];
  if (!slot || !def || slot.towerId !== null || match.gold < def.cost) return null;
  const tower = {
    id: match.nextId++,
    towerId: def.id,
    slot: slot.index,
    x: slot.x,
    y: slot.y,
    level: 1,
    cooldown: 0.15,
    disabled: 0,
    invested: def.cost,
    shots: 0,
    angle: -Math.PI / 2,
  };
  slot.towerId = tower.id;
  match.towers.push(tower);
  match.gold -= def.cost;
  match.stats.towersBuilt += 1;
  match.selectedSlot = slot.index;
  pushText(match, `${def.name} dibangun di pos ${slot.index + 1}.`, def.color);
  updateScore(match);
  return tower;
}

function selectedTower(match) {
  const slot = match?.slots[match.selectedSlot];
  if (!slot || slot.towerId === null) return null;
  return match.towers.find((tower) => tower.id === slot.towerId) || null;
}

export function waveDefenseUpgradeCost(tower) {
  const def = WAVE_DEFENSE_TOWER_BY_ID[tower?.towerId];
  if (!def || !tower || tower.level >= WAVE_DEFENSE_MAX_TOWER_LEVEL) return 0;
  return Math.round(def.cost * (tower.level === 1 ? 0.9 : 1.35));
}

export function waveDefenseSellValue(tower) {
  return Math.floor((tower?.invested || 0) * 0.62);
}

export function waveDefenseUpgrade(match) {
  const tower = selectedTower(match);
  if (!tower || tower.level >= WAVE_DEFENSE_MAX_TOWER_LEVEL) return null;
  const cost = waveDefenseUpgradeCost(tower);
  if (match.gold < cost) return null;
  match.gold -= cost;
  tower.invested += cost;
  tower.level += 1;
  pushText(match, `Menara naik ke level ${tower.level}.`, '#f2cf86');
  updateScore(match);
  return tower;
}

export function waveDefenseSell(match) {
  const tower = selectedTower(match);
  if (!tower) return 0;
  const refund = waveDefenseSellValue(tower);
  match.gold += refund;
  const slot = match.slots[tower.slot];
  if (slot) slot.towerId = null;
  match.towers = match.towers.filter((entry) => entry.id !== tower.id);
  match.selectedSlot = -1;
  pushText(match, `Menara dijual: +${refund} emas.`, '#cfcfb4');
  updateScore(match);
  return refund;
}

export function waveDefenseSelect(match, slotIndex) {
  const slot = match?.slots[Number(slotIndex)];
  if (!slot) return false;
  match.selectedSlot = slot.index;
  return true;
}

export function waveDefenseSelectTower(match, towerId) {
  if (!match || !WAVE_DEFENSE_TOWER_BY_ID[towerId]) return false;
  match.buildTowerId = towerId;
  return true;
}

export function waveDefenseSetSpeed(match, speed) {
  if (!match) return false;
  match.speed = clamp(Math.round(asNumber(speed, 1)), 1, 3);
  return true;
}

function towerStats(tower) {
  const def = WAVE_DEFENSE_TOWER_BY_ID[tower.towerId];
  const level = tower.level - 1;
  return {
    ...def,
    damage: def.damage * Math.pow(1.48, level) * (1 + (tower.buffDamage || 0)),
    rate: def.rate * Math.pow(1.1, level) * (1 + (tower.buffRate || 0)),
    range: def.range * (1 + level * 0.055),
    splash: def.splash ? def.splash * (1 + level * 0.08) : 0,
  };
}

// Banners do not shoot; they buff every damage tower inside their radius.
// Recomputed each tick so selling or losing a banner never leaves stale buffs.
export function waveDefenseRefreshAuras(match) {
  if (!match) return match;
  for (const tower of match.towers) {
    tower.buffDamage = 0;
    tower.buffRate = 0;
  }
  for (const banner of match.towers) {
    const aura = WAVE_DEFENSE_TOWER_BY_ID[banner.towerId]?.aura;
    if (!aura) continue;
    const radius2 = aura.radius * aura.radius;
    for (const tower of match.towers) {
      if (tower === banner || !WAVE_DEFENSE_TOWER_BY_ID[tower.towerId]?.damage) continue;
      const dx = tower.x - banner.x;
      const dy = tower.y - banner.y;
      if (dx * dx + dy * dy > radius2) continue;
      tower.buffDamage += aura.damage * banner.level;
      tower.buffRate += aura.rate * banner.level;
    }
  }
  return match;
}

// Hourglass towers project a slow field instead of shooting. Recomputed from
// the live tower list each tick, so selling or silencing one stops it at once.
export function waveDefenseRefreshFields(match) {
  if (!match) return match;
  for (const enemy of match.enemies) enemy.fieldSlow = 0;
  for (const tower of match.towers) {
    if (tower.disabled > 0) continue;
    const field = WAVE_DEFENSE_TOWER_BY_ID[tower.towerId]?.field;
    if (!field) continue;
    const radius2 = field.radius * field.radius;
    const slow = Math.min(0.6, field.slow * tower.level);
    for (const enemy of match.enemies) {
      if (enemy.dead) continue;
      const dx = enemy.x - tower.x;
      const dy = enemy.y - tower.y;
      if (dx * dx + dy * dy > radius2) continue;
      enemy.fieldSlow = Math.max(enemy.fieldSlow, slow);
    }
  }
  return match;
}

// The whole damage pipeline in one pure step: lantern mark bonus, then armour
// (magic ignores three quarters of it, forge shred strips a flat chunk) plus any
// herald armour aura.
export function waveDefenseIncomingDamage(amount, enemy, { magic = false } = {}) {
  if (!enemy) return 0;
  const raw = Math.max(1, Number(amount) || 1) * (enemy.markTimer > 0 ? 1.2 : 1);
  const shred = enemy.shredTimer > 0 ? (enemy.shred || 0) : 0;
  const base = (magic ? (enemy.armor || 0) * 0.25 : (enemy.armor || 0)) - shred;
  const armor = Math.min(0.85, Math.max(0, base) + (enemy.armorBonus || 0) * (magic ? 0.5 : 1));
  return Math.max(1, raw * (1 - armor));
}

export function waveDefenseTowerStats(tower) {
  return tower ? towerStats(tower) : null;
}

// Public wrapper so death-triggered mechanics (split, blind, bounty) can be
// exercised directly in tests without running a whole wave.
export function waveDefenseDamageEnemy(match, enemy, amount, options = {}) {
  return damageEnemy(match, enemy, amount, options);
}

function nearestTarget(match, tower, range) {
  let best = null;
  let bestRemain = Infinity;
  const range2 = range * range;
  for (const enemy of match.enemies) {
    if (enemy.dead) continue;
    const dx = enemy.x - tower.x;
    const dy = enemy.y - tower.y;
    if (dx * dx + dy * dy > range2) continue;
    const remain = match.map.pathLength - enemy.traveled;
    if (remain < bestRemain) {
      bestRemain = remain;
      best = enemy;
    }
  }
  return best;
}

function addEffect(match, x, y, radius, color, life = 0.32) {
  if (match.effects.length >= WAVE_DEFENSE_MAX_EFFECTS) match.effects.shift();
  match.effects.push({ x, y, radius, color, life, maxLife: life });
}

function damageEnemy(match, enemy, amount, { magic = false, source = null } = {}) {
  if (!enemy || enemy.dead) return 0;
  const dealt = waveDefenseIncomingDamage(amount, enemy, { magic });
  enemy.hp -= dealt;
  match.stats.damage += dealt;
  if (enemy.hp <= 0) {
    enemy.dead = true;
    match.gold += enemy.bounty;
    match.stats.goldEarned += enemy.bounty;
    match.stats.kills += 1;
    const def = WAVE_DEFENSE_ENEMY_BY_ID[enemy.type];
    if (def?.split && !enemy.summoned) {
      for (let i = 0; i < (def.splitCount || 2); i += 1) {
        match.splitQueue.push({ type: def.split, traveled: Math.max(0, enemy.traveled - 6 - i * 4) });
      }
    }
    if (enemy.deathBlind) {
      for (const tower of match.towers) {
        if (Math.hypot(tower.x - enemy.x, tower.y - enemy.y) > enemy.deathBlind.radius) continue;
        tower.disabled = Math.max(tower.disabled || 0, enemy.deathBlind.duration);
      }
      addEffect(match, enemy.x, enemy.y, enemy.deathBlind.radius, '#ffe19a', 0.4);
    }
    if (enemy.boss) {
      match.stats.bossesDown += 1;
      pushText(match, `${enemy.name} gugur! +${enemy.bounty} emas`, '#ffd166');
    }
    addEffect(match, enemy.x, enemy.y, enemy.boss ? 55 : 20, enemy.color, 0.45);
    if (source?.healCastle) healCastle(match, source.healCastle);
  }
  return dealt;
}

function healCastle(match, amount) {
  match.castle.hp = Math.min(match.castle.maxHp, match.castle.hp + amount);
}

function fireTower(match, tower, target, stats) {
  tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
  tower.shots += 1;
  tower.recoil = 1;
  let damage = stats.damage;
  if (stats.shape === 'sniper' && tower.shots % 4 === 0) damage *= 2.25;
  if (stats.execute && target.hp / target.maxHp <= stats.execute) damage *= stats.executeBonus || 2;
  if (stats.healCastle) healCastle(match, stats.healCastle);
  if (match.projectiles.length >= WAVE_DEFENSE_MAX_PROJECTILES) {
    impactProjectile(match, { target, damage, splash: stats.splash || 0, magic: stats.magic, slow: stats.slow, slowTime: stats.slowTime, poison: stats.poison, poisonTime: stats.poisonTime, mark: stats.mark || 0, stun: stats.stun || 0, shred: stats.shred || 0, shredTime: stats.shredTime || 0, chain: stats.chain || 0, x: target.x, y: target.y, color: stats.color });
    return;
  }
  match.projectiles.push({
    x: tower.x,
    y: tower.y - 9,
    lastX: tower.x,
    lastY: tower.y - 9,
    target,
    speed: stats.projectileSpeed || 500,
    damage,
    splash: stats.splash || 0,
    magic: !!stats.magic,
    slow: stats.slow || 1,
    slowTime: stats.slowTime || 0,
    poison: stats.poison || 0,
    poisonTime: stats.poisonTime || 0,
    mark: stats.mark || 0,
    stun: stats.stun || 0,
    shred: stats.shred || 0,
    shredTime: stats.shredTime || 0,
    chain: stats.chain || 0,
    color: stats.color,
    shape: stats.shape,
    life: 2.6,
  });
}

function impactProjectile(match, projectile) {
  const { target } = projectile;
  if (projectile.splash > 0) {
    for (const enemy of match.enemies) {
      if (enemy.dead) continue;
      if (Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) <= projectile.splash) {
        damageEnemy(match, enemy, projectile.damage, { magic: projectile.magic });
        applyStatus(match, enemy, projectile);
      }
    }
    addEffect(match, projectile.x, projectile.y, projectile.splash, projectile.color, 0.34);
  } else if (target && !target.dead) {
    damageEnemy(match, target, projectile.damage, { magic: projectile.magic });
    applyStatus(match, target, projectile);
    addEffect(match, target.x, target.y, 10, projectile.color, 0.2);
  }
  if (projectile.chain > 0) {
    let source = target && !target.dead ? target : null;
    const hit = new Set(source ? [source.id] : []);
    for (let jump = 0; jump < projectile.chain; jump += 1) {
      let next = null;
      let nextDist = 120;
      for (const enemy of match.enemies) {
        if (enemy.dead || hit.has(enemy.id) || !source) continue;
        const d = Math.hypot(enemy.x - source.x, enemy.y - source.y);
        if (d < nextDist) { nextDist = d; next = enemy; }
      }
      if (!next) break;
      hit.add(next.id);
      damageEnemy(match, next, projectile.damage * 0.55, { magic: true });
      addEffect(match, next.x, next.y, 12, '#9fe9ff', 0.22);
      source = next;
    }
  }
}

function applyStatus(match, enemy, projectile) {
  if (!enemy || enemy.dead) return;
  if (projectile.slow < 1 && !enemy.slowImmune) {
    enemy.slowTimer = Math.max(enemy.slowTimer, projectile.slowTime || 1.5);
    enemy.slowFactor = Math.min(enemy.slowFactor, projectile.slow);
  }
  if (projectile.poison > 0) {
    enemy.poisonTimer = Math.max(enemy.poisonTimer, projectile.poisonTime || 3);
    enemy.poisonDps = Math.max(enemy.poisonDps, projectile.poison);
  }
  if (projectile.mark > 0) {
    enemy.markTimer = Math.max(enemy.markTimer || 0, projectile.mark);
  }
  if (projectile.stun > 0) {
    enemy.stunTimer = Math.max(enemy.stunTimer || 0, projectile.stun);
  }
  if (projectile.shred > 0) {
    enemy.shred = Math.max(enemy.shred || 0, projectile.shred);
    enemy.shredTimer = Math.max(enemy.shredTimer || 0, projectile.shredTime || 4);
  }
}

function updateTowers(match, dt) {
  for (const tower of match.towers) {
    tower.recoil = Math.max(0, (tower.recoil || 0) - dt * 4.5);
    if (tower.disabled > 0) {
      tower.disabled = Math.max(0, tower.disabled - dt);
      continue;
    }
    tower.cooldown -= dt;
    if (tower.cooldown > 0) continue;
    const def = WAVE_DEFENSE_TOWER_BY_ID[tower.towerId];
    if (def?.support) { tower.cooldown = 0.5; continue; }
    const stats = towerStats(tower);
    const target = nearestTarget(match, tower, stats.range);
    if (!target) { tower.cooldown = 0; continue; }
    fireTower(match, tower, target, stats);
    tower.cooldown = 1 / stats.rate;
  }
}

function updateProjectiles(match, dt) {
  let write = 0;
  for (let read = 0; read < match.projectiles.length; read += 1) {
    const p = match.projectiles[read];
    p.life -= dt;
    if (p.life <= 0) continue;
    p.lastX = p.x;
    p.lastY = p.y;
    let tx = p.x;
    let ty = p.y;
    if (p.target && !p.target.dead) {
      tx = p.target.x;
      ty = p.target.y;
    }
    const dx = tx - p.x;
    const dy = ty - p.y;
    const dist = Math.hypot(dx, dy);
    const step = p.speed * dt;
    if (dist <= step + 10) {
      p.x = tx;
      p.y = ty;
      impactProjectile(match, p);
      continue;
    }
    if (dist > 0) {
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
    }
    match.projectiles[write] = p;
    write += 1;
  }
  match.projectiles.length = write;
}

function completeWave(match) {
  match.projectiles.length = 0;
  const reward = 18 + match.wave * 3;
  match.gold += reward;
  match.stats.goldEarned += reward;
  match.waveTime = 0;
  if (!match.endless && match.wave >= match.totalWaves) {
    match.castle.hp = Math.min(match.castle.maxHp, match.castle.hp + 8);
    endWaveDefense(match, 'victory');
    return;
  }
  match.phase = 'prep';
  match.prepTimer = match.mode === 'infinitower' ? Math.max(4, 8.5 - (match.tier || 1) * 0.4) : 8.5;
  pushText(match, `Gelombang ${match.wave} hancur. +${reward} emas.`, '#cfe8ad');
  updateScore(match);
}

// Herald armour and chorister haste are recomputed on a 0.5 s budget instead of
// every frame.
export function waveDefenseRefreshArmor(match) {
  if (!match) return match;
  let aura = false;
  for (const enemy of match.enemies) {
    enemy.armorBonus = 0;
    enemy.hasteBonus = 0;
    if (!enemy.dead && (enemy.armorAura > 0 || enemy.hasteAura > 0)) aura = true;
  }
  if (!aura) return match;
  for (const source of match.enemies) {
    if (source.dead || (!(source.armorAura > 0) && !(source.hasteAura > 0))) continue;
    for (const other of match.enemies) {
      if (other === source || other.dead) continue;
      if (Math.hypot(other.x - source.x, other.y - source.y) > 96) continue;
      if (source.armorAura > 0) other.armorBonus = Math.max(other.armorBonus, source.armorAura);
      if (source.hasteAura > 0) other.hasteBonus = Math.max(other.hasteBonus, source.hasteAura);
    }
  }
  return match;
}

function refreshArmorAura(match, dt) {
  match.auraTimer = (match.auraTimer || 0) - dt;
  if (match.auraTimer > 0) return;
  match.auraTimer = 0.5;
  waveDefenseRefreshArmor(match);
}

function updateEnemies(match, dt) {
  refreshArmorAura(match, dt);
  waveDefenseRefreshFields(match);
  let write = 0;
  for (let read = 0; read < match.enemies.length; read += 1) {
    const enemy = match.enemies[read];
    if (enemy.dead) continue;
    if (enemy.slowTimer > 0) enemy.slowTimer -= dt;
    else enemy.slowFactor = 1;
    if (enemy.markTimer > 0) enemy.markTimer = Math.max(0, enemy.markTimer - dt);
    if (enemy.shredTimer > 0) {
      enemy.shredTimer -= dt;
      if (enemy.shredTimer <= 0) enemy.shred = 0;
    }
    if (enemy.regen > 0) {
      enemy.regenTimer -= dt;
      if (enemy.regenTimer <= 0) {
        enemy.regenTimer = 2;
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.regen);
      }
    }
    if (enemy.poisonTimer > 0) {
      enemy.poisonTimer -= dt;
      damageEnemy(match, enemy, enemy.poisonDps * dt, { magic: true });
      if (enemy.dead) continue;
    }
    // Tower Breakers pick the closest live turret and silence it for a moment.
    if (enemy.disabler) {
      enemy.disabler.timer -= dt;
      if (enemy.disabler.timer <= 0) {
        enemy.disabler.timer = enemy.disabler.cooldown;
        let victim = null;
        let victimDist = enemy.disabler.radius;
        for (const tower of match.towers) {
          const d = Math.hypot(tower.x - enemy.x, tower.y - enemy.y);
          if (d < victimDist) { victimDist = d; victim = tower; }
        }
        if (victim) {
          victim.disabled = Math.max(victim.disabled || 0, enemy.disabler.duration);
          addEffect(match, victim.x, victim.y, 26, '#ff9b6a', 0.4);
          pushText(match, `${WAVE_DEFENSE_TOWER_BY_ID[victim.towerId]?.name || 'Menara'} dilumpuhkan!`, '#ff9b6a');
        }
      }
    }
    if (enemy.healAura > 0) {
      enemy.healTimer -= dt;
      if (enemy.healTimer <= 0) {
        enemy.healTimer = 2.2;
        for (const other of match.enemies) {
          if (other.dead || other === enemy) continue;
          if (Math.hypot(other.x - enemy.x, other.y - enemy.y) <= 84) {
            other.hp = Math.min(other.maxHp, other.hp + enemy.healAura);
          }
        }
        addEffect(match, enemy.x, enemy.y, 48, '#87c56b', 0.32);
      }
    }
    // The Spiral Choir sings dead bodies back onto the road.
    if (enemy.summon) {
      enemy.summonTimer -= dt;
      if (enemy.summonTimer <= 0) {
        enemy.summonTimer = enemy.summon.cooldown;
        for (let i = 0; i < enemy.summon.count; i += 1) {
          match.splitQueue.push({ type: enemy.summon.type, traveled: Math.max(0, enemy.traveled - 14 - i * 8) });
        }
        addEffect(match, enemy.x, enemy.y, 46, '#c8b4ff', 0.4);
        pushText(match, `${enemy.name} memanggil bala bantuan.`, '#c8b4ff');
      }
    }

    if (enemy.stunTimer > 0) {
      enemy.stunTimer = Math.max(0, enemy.stunTimer - dt);
      if (!enemy.dead) match.enemies[write++] = enemy;
      continue;
    }

    // Rift Hoppers skip a chunk of the road, which punishes short-range nests.
    if (enemy.blink && enemy.pathIndex < match.map.path.length - 1 && enemy.blinkTimer > 0) {
      enemy.blinkTimer -= dt;
      if (enemy.blinkTimer <= 0) {
        enemy.blinkTimer = enemy.blink.interval;
        enemy.traveled += enemy.blink.distance;
        placeEnemyAt(match, enemy, enemy.traveled);
        addEffect(match, enemy.x, enemy.y, 16, '#b39cff', 0.28);
      }
    }

    const fieldFactor = 1 - Math.min(0.7, enemy.fieldSlow || 0);
    let step = enemy.speed * (1 + (enemy.hasteBonus || 0)) * enemy.slowFactor * fieldFactor * dt;
    while (step > 0 && enemy.pathIndex < match.map.path.length) {
      const target = match.map.path[enemy.pathIndex];
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= step) {
        enemy.x = target.x;
        enemy.y = target.y;
        enemy.traveled += dist;
        step -= dist;
        enemy.pathIndex += 1;
        if (enemy.pathIndex < match.map.path.length) {
          const next = match.map.path[enemy.pathIndex];
          enemy.angle = Math.atan2(next.y - target.y, next.x - target.x);
        }
      } else {
        enemy.x += (dx / dist) * step;
        enemy.y += (dy / dist) * step;
        enemy.traveled += step;
        enemy.angle = Math.atan2(dy, dx);
        step = 0;
      }
    }
    if (enemy.pathIndex >= match.map.path.length) {
      enemy.dead = true;
      enemy.leaked = true;
      match.stats.leaks += 1;
      match.castle.hp = Math.max(0, match.castle.hp - enemy.damage);
      match.castle.flash = 0.5;
      addEffect(match, match.castle.x, match.castle.y, 32, '#ff7b62', 0.4);
      if (enemy.toll > 0 && match.gold > 0) {
        const stolen = Math.min(match.gold, enemy.toll);
        match.gold -= stolen;
        pushText(match, `${enemy.name} merampas ${stolen} emas!`, '#c9d18a');
      }
      pushText(match, `${enemy.name} menabrak gerbang — ${enemy.damage} damage!`, '#ff8a72');
      if (match.castle.hp <= 0) endWaveDefense(match, 'defeat');
      continue;
    }
    if (!enemy.dead) match.enemies[write++] = enemy;
  }
  match.enemies.length = write;
}

function updateEffects(match, dt) {
  let write = 0;
  for (let read = 0; read < match.effects.length; read += 1) {
    const effect = match.effects[read];
    effect.life -= dt;
    if (effect.life > 0) match.effects[write++] = effect;
  }
  match.effects.length = write;
}

export function endWaveDefense(match, result = 'defeat') {
  if (!match || match.phase === 'ended') return match;
  match.phase = 'ended';
  match.result = result === 'victory' ? 'victory' : 'defeat';
  match.endedAt = match.time;
  if (match.castle.flash <= 0) match.castle.flash = 0.01;
  updateScore(match);
  return match;
}

export function updateWaveDefense(match, dt, input = {}) {
  if (!match || match.phase === 'ended') return match;
  const scaled = Math.min(0.05, Math.max(0, asNumber(dt))) * match.speed;
  if (scaled <= 0) return match;
  match.time += scaled;
  if (match.castle.flash > 0) match.castle.flash = Math.max(0, match.castle.flash - scaled);
  if (input.pause) return match;

  if (match.phase === 'prep') {
    match.prepTimer -= scaled;
    if (match.prepTimer <= 0) waveDefenseNextWave(match);
  }

  if (match.phase === 'wave') {
    match.waveTime += scaled;
    while (match.spawnCursor < match.spawnQueue.length && match.spawnQueue[match.spawnCursor].at <= match.waveTime) {
      spawnEnemy(match, match.spawnQueue[match.spawnCursor].type);
      match.spawnCursor += 1;
    }
    updateEnemies(match, scaled);
    if (match.phase !== 'ended' && match.splitQueue.length) {
      const pending = match.splitQueue;
      match.splitQueue = [];
      for (const chunk of pending) spawnEnemy(match, chunk.type, chunk.traveled, { summoned: true });
    }
    if (match.phase !== 'ended') {
      waveDefenseRefreshAuras(match);
      waveDefenseRefreshFields(match);
      updateTowers(match, scaled);
    }
    if (match.phase !== 'ended') updateProjectiles(match, scaled);
    if (match.phase !== 'ended' && match.spawnCursor >= match.spawnQueue.length && match.enemies.length === 0) completeWave(match);
  }

  updateEffects(match, scaled);
  updateScore(match);
  return match;
}

// ── Progress and records ───────────────────────────────────────────────────
function freshMapRecord() {
  return { runs: 0, wins: 0, bestWave: 0, bestScore: 0 };
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
    for (const map of WAVE_DEFENSE_MAPS) {
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

export function recordWaveDefense(progress, match) {
  const p = sanitizeWaveDefenseProgress(progress);
  if (!match) return { progress: p, isRecord: false };
  if (match.mode === 'infinitower') {
    const tier = infinitowerTierFor(match.wave);
    const isRecord = match.wave > p.infinitower.bestWave || match.score > p.infinitower.bestScore;
    p.infinitower.runs += 1;
    p.infinitower.bestWave = Math.max(p.infinitower.bestWave, Math.min(WAVE_DEFENSE_ENDLESS_WAVES, match.wave));
    p.infinitower.bestTier = Math.max(p.infinitower.bestTier, tier);
    p.infinitower.bestScore = Math.max(p.infinitower.bestScore, match.score);
    p.infinitower.bestKills = Math.max(p.infinitower.bestKills, match.stats.kills);
    p.infinitower.bestTime = Math.max(p.infinitower.bestTime, Math.round(match.time * 10) / 10);
    p.totalKills += match.stats.kills;
    p.totalLeaks += match.stats.leaks;
    p.towersBuilt += match.stats.towersBuilt;
    return { progress: p, isRecord, win: false, infinitower: true, endless: true, wave: match.wave, tier, score: match.score };
  }
  if (match.endless) {
    const isRecord = match.wave > p.endless.bestWave || match.score > p.endless.bestScore;
    p.endless.runs += 1;
    p.endless.bestWave = Math.max(p.endless.bestWave, Math.min(WAVE_DEFENSE_ENDLESS_WAVES, match.wave));
    p.endless.bestScore = Math.max(p.endless.bestScore, match.score);
    p.endless.bestKills = Math.max(p.endless.bestKills, match.stats.kills);
    p.endless.bestTime = Math.max(p.endless.bestTime, Math.round(match.time * 10) / 10);
    p.totalKills += match.stats.kills;
    p.totalLeaks += match.stats.leaks;
    p.towersBuilt += match.stats.towersBuilt;
    return { progress: p, isRecord, win: false, endless: true, wave: match.wave, score: match.score };
  }
  const win = match.result === 'victory';
  const isRecord = match.score > p.bestScore || match.wave > p.bestWave;
  p.runs += 1;
  if (win) p.wins += 1;
  else p.losses += 1;
  p.bestWave = Math.max(p.bestWave, match.wave);
  p.bestScore = Math.max(p.bestScore, match.score);
  if (win && (!p.bestTime || match.time < p.bestTime)) p.bestTime = match.time;
  p.totalKills += match.stats.kills;
  p.totalLeaks += match.stats.leaks;
  p.towersBuilt += match.stats.towersBuilt;
  const map = p.maps[match.mapId] || freshMapRecord();
  map.runs += 1;
  if (win) map.wins += 1;
  map.bestWave = Math.max(map.bestWave, match.wave);
  map.bestScore = Math.max(map.bestScore, match.score);
  p.maps[match.mapId] = map;
  return {
    progress: p,
    isRecord,
    win,
    wave: match.wave,
    score: match.score,
  };
}

export function waveDefenseSummary(progress) {
  const p = sanitizeWaveDefenseProgress(progress);
  const mapsPlayed = Object.values(p.maps).filter((map) => map.runs > 0).length;
  return {
    ...p,
    winRate: p.runs ? Math.round((p.wins / p.runs) * 100) : 0,
    mapsPlayed,
    mapsTotal: WAVE_DEFENSE_MAPS.length,
    towers: WAVE_DEFENSE_TOWERS.length,
    enemies: WAVE_DEFENSE_ENEMY_TYPES.length,
    bosses: WAVE_DEFENSE_BOSSES.length,
    endlessBest: { ...p.endless },
    infinitowerBest: { ...p.infinitower },
  };
}

export function waveDefenseSnapshot(match) {
  if (!match) return null;
  const selected = selectedTower(match);
  return {
    mapId: match.mapId,
    mapName: match.map.name,
    difficulty: match.difficulty,
    wave: match.wave,
    totalWaves: match.totalWaves,
    mode: match.mode || (match.endless ? 'endless' : 'campaign'),
    endless: !!match.endless,
    infinitower: !!match.infinitower,
    tier: match.mode === 'infinitower' ? infinitowerTierFor(match.wave) : 1,
    story: match.story ? { tier: match.story.tier, title: match.story.title, line: match.story.line } : null,
    phase: match.phase,
    prepTimer: Math.max(0, match.prepTimer),
    time: match.time,
    speed: match.speed,
    gold: match.gold,
    score: match.score,
    castle: { hp: match.castle.hp, maxHp: match.castle.maxHp },
    selectedSlot: match.selectedSlot,
    buildTowerId: match.buildTowerId,
    selectedTower: selected ? {
      towerId: selected.towerId,
      name: WAVE_DEFENSE_TOWER_BY_ID[selected.towerId]?.name,
      slot: selected.slot,
      level: selected.level,
      upgradeCost: waveDefenseUpgradeCost(selected),
      sellValue: waveDefenseSellValue(selected),
    } : null,
    enemies: match.enemies.length,
    enemyList: match.enemies.map((enemy) => ({ id: enemy.id, type: enemy.type, x: enemy.x, y: enemy.y, hp: enemy.hp, boss: enemy.boss })),
    boss: match.enemies.find((enemy) => enemy.boss) || null,
    towers: match.towers.map((tower) => ({ id: tower.id, towerId: tower.towerId, slot: tower.slot, level: tower.level })),
    slots: match.slots.map((slot) => ({ index: slot.index, x: slot.x, y: slot.y, towerId: slot.towerId })),
    stats: { ...match.stats },
    result: match.result,
    texts: match.texts.slice(-4).map((entry) => ({ ...entry })),
  };
}

// ── Canvas renderer ────────────────────────────────────────────────────────
let backgroundCache = null;

function buildBackground(map, width, height) {
  if (typeof document === 'undefined') return null;
  if (backgroundCache && backgroundCache.key === map.id && backgroundCache.width === width && backgroundCache.height === height) {
    return backgroundCache.canvas;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const theme = map.theme;
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, theme.ground);
  grad.addColorStop(1, theme.edge);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Static ruins and tree silhouettes keep the arena readable without assets.
  ctx.fillStyle = 'rgba(255,255,255,0.022)';
  for (let i = 0; i < 22; i += 1) {
    const x = (i * 193 + 67) % width;
    const y = (i * 97 + 43) % height;
    ctx.beginPath();
    ctx.arc(x, y, 12 + (i % 5) * 5, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(210,180,120,0.07)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i += 1) {
    const x = 54 + i * 104;
    const y = i % 2 ? 494 : 52;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 14, y - 20);
    ctx.stroke();
  }

  // Road.
  const drawPath = (lineWidth, color, dash = []) => {
    ctx.beginPath();
    ctx.moveTo(map.path[0].x, map.path[0].y);
    for (let i = 1; i < map.path.length; i += 1) ctx.lineTo(map.path[i].x, map.path[i].y);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash(dash);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  drawPath(52, theme.edge);
  drawPath(42, theme.earth);
  drawPath(32, theme.path);
  drawPath(4, 'rgba(255,235,190,0.14)', [10, 21]);

  for (const slot of map.slots) {
    ctx.fillStyle = 'rgba(5,8,8,0.55)';
    ctx.beginPath(); ctx.arc(slot.x, slot.y, 17, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(220,190,130,0.26)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(220,190,130,0.46)';
    ctx.font = '700 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(map.slots.indexOf(slot) + 1), slot.x, slot.y + 3);
  }

  // Castle silhouette.
  const c = map.castle;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.ellipse(c.x, c.y + 58, 72, 18, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#24262a';
  ctx.fillRect(c.x - 46, c.y - 50, 76, 100);
  ctx.fillStyle = '#30343a';
  ctx.fillRect(c.x - 58, c.y - 36, 20, 86);
  ctx.fillRect(c.x + 20, c.y - 36, 20, 86);
  ctx.fillStyle = theme.accent;
  ctx.fillRect(c.x - 58, c.y - 40, 20, 5);
  ctx.fillRect(c.x + 20, c.y - 40, 20, 5);
  ctx.fillStyle = '#141417';
  ctx.beginPath();
  ctx.moveTo(c.x - 10, c.y + 50);
  ctx.lineTo(c.x - 10, c.y + 14);
  ctx.quadraticCurveTo(c.x + 2, c.y - 2, c.x + 14, c.y + 14);
  ctx.lineTo(c.x + 14, c.y + 50);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,230,180,0.16)';
  ctx.lineWidth = 1;
  ctx.strokeRect(c.x - 46, c.y - 50, 76, 100);
  ctx.fillStyle = theme.accent;
  ctx.fillRect(c.x - 1, c.y - 86, 2, 38);
  ctx.beginPath();
  ctx.moveTo(c.x + 1, c.y - 86);
  ctx.lineTo(c.x + 30, c.y - 76);
  ctx.lineTo(c.x + 1, c.y - 64);
  ctx.closePath();
  ctx.fill();

  const start = map.path[0];
  ctx.fillStyle = 'rgba(255,120,95,0.12)';
  ctx.beginPath(); ctx.arc(start.x + 22, start.y, 34, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,180,155,0.5)';
  ctx.font = '700 8px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('GERBANG MUSUH', 14, start.y - 36);
  ctx.fillStyle = 'rgba(240,210,155,0.35)';
  ctx.font = '700 9px sans-serif';
  ctx.fillText(map.name, 18, height - 18);

  backgroundCache = { key: map.id, width, height, canvas };
  return canvas;
}

function drawTower(ctx, tower, def, selected) {
  const color = def.color;
  ctx.save();
  ctx.translate(tower.x, tower.y);
  if (tower.recoil > 0) ctx.translate(0, tower.recoil * 2.6);
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath(); ctx.ellipse(0, 13, 19, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#22211d';
  ctx.strokeStyle = 'rgba(255,230,185,0.34)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.rotate(tower.angle + Math.PI / 2);
  ctx.fillStyle = color;
  if (def.shape === 'lob' || def.shape === 'cannon') {
    ctx.fillRect(-5, -21, 10, 23);
    ctx.beginPath(); ctx.arc(0, 3, 10, 0, TAU); ctx.fill();
  } else if (def.shape === 'spire' || def.shape === 'coil' || def.shape === 'rift') {
    ctx.beginPath();
    ctx.moveTo(0, -23);
    ctx.lineTo(9, 7);
    ctx.lineTo(-9, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.beginPath(); ctx.arc(0, -8, 4, 0, TAU); ctx.fill();
  } else if (def.shape === 'sniper') {
    ctx.fillRect(-3, -27, 6, 30);
    ctx.beginPath(); ctx.arc(0, 5, 9, 0, TAU); ctx.fill();
  } else if (def.shape === 'holy') {
    ctx.fillRect(-4, -19, 8, 25);
    ctx.fillRect(-13, -8, 26, 7);
  } else if (def.shape === 'flame' || def.shape === 'vine') {
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.quadraticCurveTo(12, -4, 0, 9);
    ctx.quadraticCurveTo(-12, -4, 0, -24);
    ctx.fill();
  } else if (def.shape === 'banner') {
    ctx.fillRect(-2, -30, 4, 38);
    ctx.beginPath();
    ctx.moveTo(2, -29);
    ctx.lineTo(22, -22);
    ctx.lineTo(2, -12);
    ctx.closePath();
    ctx.fill();
  } else if (def.shape === 'lantern') {
    ctx.fillRect(-1.5, -30, 3, 14);
    ctx.beginPath();
    ctx.arc(0, -10, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(0, -10, 3.4, 0, TAU);
    ctx.fill();
  } else if (def.shape === 'monolith') {
    ctx.fillRect(-8, -22, 16, 30);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-8, -22, 16, 4);
    ctx.beginPath(); ctx.arc(0, -6, 4.5, 0, TAU); ctx.fill();
  } else if (def.shape === 'bell') {
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.quadraticCurveTo(13, -12, 11, 4);
    ctx.lineTo(-11, 4);
    ctx.quadraticCurveTo(-13, -12, 0, -26);
    ctx.fill();
    ctx.fillRect(-3, 4, 6, 6);
  } else if (def.shape === 'forge') {
    ctx.fillRect(-10, -12, 20, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(7, -13);
    ctx.lineTo(-7, -13);
    ctx.closePath();
    ctx.fill();
  } else if (def.shape === 'eye') {
    ctx.beginPath();
    ctx.ellipse(0, -8, 14, 9, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#241a13';
    ctx.beginPath(); ctx.arc(0, -8, 4.5, 0, TAU); ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(-2, -30, 4, 12);
  } else if (def.shape === 'anchor') {
    ctx.fillRect(-2.5, -30, 5, 32);
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(0, 2, 12, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.fillRect(-10, -16, 20, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(0, -27, 4, 0, TAU); ctx.fill();
  } else if (def.shape === 'hourglass') {
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.moveTo(-12, -28); ctx.lineTo(12, -28); ctx.lineTo(0, -2); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-12, 8); ctx.lineTo(12, 8); ctx.lineTo(0, -2); ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(0, -2, 3, 0, TAU); ctx.fill();
  } else {
    ctx.fillRect(-4, -24, 8, 28);
    ctx.beginPath(); ctx.arc(0, 4, 9, 0, TAU); ctx.fill();
  }
  ctx.restore();

  if (tower.disabled > 0) {
    ctx.strokeStyle = 'rgba(255,120,90,0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(tower.x, tower.y, 20, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
  }

  if (selected) {
    ctx.strokeStyle = `rgba(255,226,155,0.75)`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(tower.x, tower.y, 24, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
  }
  for (let i = 0; i < tower.level; i += 1) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(tower.x - 8 + i * 8, tower.y + 20, 2, 0, TAU); ctx.fill();
  }
}

function drawEnemy(ctx, enemy, time = 0) {
  const scale = enemy.boss ? 1.35 : 1;
  const r = enemy.radius;
  const pose = rigPoseFor(enemy.type, time + enemy.id * 0.37, { moving: !(enemy.stunTimer > 0), boss: enemy.boss });
  const x = enemy.x;
  const y = enemy.y + pose.bob * 0.5;

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(enemy.x, enemy.y + 8 * scale, 10 * scale, 4 * scale, 0, 0, TAU); ctx.fill();

  // ── rig: legs / wisps, then arms, then the torso ────────────────────────
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = enemy.color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.3, r * 0.22);
  if (pose.legs > 0) {
    for (let i = 0; i < Math.min(4, pose.legs); i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const back = i > 1 ? 0.55 : 1;
      const swing = pose.stride * side * r * 1.7 * back;
      ctx.globalAlpha = i > 1 ? 0.55 : 0.9;
      ctx.beginPath();
      ctx.moveTo(side * r * 0.36, r * 0.4);
      ctx.lineTo(side * r * 0.36 + swing, r * (1.15 + back * 0.1));
      ctx.stroke();
    }
  } else {
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, r * 0.35);
    ctx.quadraticCurveTo(0, r * 1.6 + Math.sin(time * 2) * 2, r * 0.5, r * 0.35);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (pose.arms > 0) {
    for (const side of [-1, 1]) {
      const swing = pose.arm * side * r * 1.2;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.moveTo(side * r * 0.7, -r * 0.15);
      ctx.lineTo(side * r * 0.95 + swing, r * 0.45);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = enemy.color;
  ctx.strokeStyle = enemy.boss ? '#ffe6a0' : 'rgba(16,18,18,0.8)';
  ctx.lineWidth = enemy.boss ? 2.2 : 1;
  ctx.beginPath();
  if (enemy.boss) {
    ctx.moveTo(0, -r - 2);
    ctx.lineTo(r, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r, 0);
    ctx.closePath();
  } else {
    ctx.arc(0, 0, r, 0, TAU);
  }
  ctx.fill();
  ctx.stroke();

  // Head and a single lit eye make the facing direction readable.
  const headX = Math.cos(enemy.angle) * r * 0.34;
  const headY = -r * 0.78 + pose.bob * 0.25;
  ctx.fillStyle = enemy.color;
  ctx.beginPath(); ctx.arc(headX, headY, r * 0.42, 0, TAU); ctx.fill();
  ctx.stroke();
  ctx.fillStyle = enemy.boss ? '#fff4c8' : 'rgba(255,240,214,0.85)';
  ctx.beginPath(); ctx.arc(headX + r * 0.18, headY - r * 0.05, Math.max(1.2, r * 0.12), 0, TAU); ctx.fill();
  ctx.restore();
  if (enemy.slowTimer > 0) {
    ctx.strokeStyle = 'rgba(140,225,255,0.75)';
    ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.radius + 3, 0, TAU); ctx.stroke();
  }
  if (enemy.poisonTimer > 0) {
    ctx.fillStyle = 'rgba(126,210,90,0.75)';
    ctx.beginPath(); ctx.arc(enemy.x + 7, enemy.y - 9, 2.4, 0, TAU); ctx.fill();
  }
  if (enemy.markTimer > 0) {
    ctx.strokeStyle = 'rgba(178,240,222,0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.radius + 5, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
  }
  if (enemy.hp < enemy.maxHp) {
    const width = enemy.boss ? 42 : 22;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 12, width, enemy.boss ? 4 : 3);
    ctx.fillStyle = enemy.boss ? '#ffb45c' : '#d9685f';
    ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 12, width * (enemy.hp / enemy.maxHp), enemy.boss ? 4 : 3);
  }
}

export function renderWaveDefense(ctx, match, { width = WAVE_DEFENSE_WORLD_W, height = WAVE_DEFENSE_WORLD_H, time = 0 } = {}) {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  if (!match) return;
  const map = match.map;
  const background = buildBackground(map, width, height);
  if (background) ctx.drawImage(background, 0, 0, width, height);
  else {
    ctx.fillStyle = map.theme.ground;
    ctx.fillRect(0, 0, width, height);
  }

  const selected = match.slots[match.selectedSlot];
  const selectedTower = selected ? match.towers.find((tower) => tower.id === selected.towerId) : null;
  if (selectedTower) {
    const stats = towerStats(selectedTower);
    ctx.fillStyle = 'rgba(255,224,160,0.035)';
    ctx.beginPath(); ctx.arc(selectedTower.x, selectedTower.y, stats.range, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,224,160,0.34)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(selectedTower.x, selectedTower.y, stats.range, 0, TAU); ctx.stroke();
  }

  for (const slot of match.slots) {
    if (slot.towerId !== null) continue;
    const affordable = match.phase !== 'ended' && match.gold >= (WAVE_DEFENSE_TOWER_BY_ID[match.buildTowerId]?.cost || 0);
    ctx.strokeStyle = affordable ? 'rgba(160,220,150,0.55)' : 'rgba(210,190,150,0.2)';
    ctx.lineWidth = match.selectedSlot === slot.index ? 2 : 1;
    ctx.beginPath(); ctx.arc(slot.x, slot.y, 18, 0, TAU); ctx.stroke();
    if (match.selectedSlot === slot.index) {
      ctx.fillStyle = 'rgba(255,220,150,0.1)';
      ctx.beginPath(); ctx.arc(slot.x, slot.y, 18, 0, TAU); ctx.fill();
    }
  }

  const castle = match.castle;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(castle.x - 52, castle.y - 68, 104, 7);
  ctx.fillStyle = castle.hp / castle.maxHp > 0.35 ? '#d8bc6c' : '#e06158';
  ctx.fillRect(castle.x - 52, castle.y - 68, 104 * Math.max(0, castle.hp / castle.maxHp), 7);
  if (castle.flash > 0) {
    ctx.fillStyle = `rgba(255,90,70,${Math.min(0.45, castle.flash)})`;
    ctx.fillRect(castle.x - 70, castle.y - 70, 140, 140);
  }

  for (const tower of match.towers) {
    const def = WAVE_DEFENSE_TOWER_BY_ID[tower.towerId];
    if (def) drawTower(ctx, tower, def, selectedTower === tower);
  }

  for (const p of match.projectiles) {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.splash ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(p.lastX, p.lastY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.splash ? 3 : 2, 0, TAU); ctx.fill();
  }

  // Hourglass fields are drawn under the bodies so the slow zone is legible.
  for (const tower of match.towers) {
    const field = WAVE_DEFENSE_TOWER_BY_ID[tower.towerId]?.field;
    if (!field || tower.disabled > 0) continue;
    ctx.fillStyle = 'rgba(200,180,255,0.045)';
    ctx.beginPath(); ctx.arc(tower.x, tower.y, field.radius, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(200,180,255,0.28)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.arc(tower.x, tower.y, field.radius, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
  }

  for (const enemy of match.enemies) {
    if (enemy.dead) continue;
    drawEnemy(ctx, enemy, time);
  }

  for (const effect of match.effects) {
    const t = Math.max(0, effect.life / effect.maxLife);
    ctx.strokeStyle = effect.color;
    ctx.globalAlpha = t;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius * (1.15 - t * 0.6), 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (match.phase === 'prep' && match.wave < match.totalWaves) {
    ctx.fillStyle = 'rgba(4,8,8,0.55)';
    ctx.fillRect(width / 2 - 118, 66, 236, 44);
    ctx.strokeStyle = 'rgba(255,220,160,0.24)';
    ctx.strokeRect(width / 2 - 118, 66, 236, 44);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4dfb6';
    ctx.font = '700 10px sans-serif';
    ctx.fillText(match.infinitower
      ? `INFINITOWER · GELOMBANG ${match.wave + 1} · T${infinitowerTierFor(match.wave + 1)}`
      : match.endless ? `TANPA AKHIR · GELOMBANG ${match.wave + 1}` : `GELOMBANG ${match.wave + 1} / ${match.totalWaves}`, width / 2, 83);
    ctx.fillStyle = '#9fc5a3';
    ctx.font = '700 8px sans-serif';
    ctx.fillText(`MULAI DALAM ${Math.max(0, match.prepTimer).toFixed(1)} DETIK`, width / 2, 99);
  }

  if (match.phase === 'wave' && match.enemies.length === 0 && match.spawnCursor < match.spawnQueue.length) {
    ctx.fillStyle = 'rgba(255,220,160,0.5)';
    ctx.font = '700 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PASUKAN BERGERAK MENUJU GERBANG', width / 2, 88);
  }

  // A shared clock keeps waves visibly alive while the DOM HUD updates at 8 Hz.
  if (match.phase === 'wave') {
    const pulse = 0.4 + Math.sin(time * 4) * 0.12;
    ctx.fillStyle = `rgba(255,186,105,${pulse})`;
    ctx.beginPath(); ctx.arc(18, 18, 3, 0, TAU); ctx.fill();
  }
}
