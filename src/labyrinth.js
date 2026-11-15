// Ashen Vow — Cursed Realms: The Eternal Descent (v0.7.0)
// Infinite Labyrinth: endless cycles, 20 zones, 30 bosses, cursed/ritual items,
// encounter director, difficulty scaling, run statistics and persistent mastery.
// Pure data + deterministic logic. No DOM, no canvas, no audio, no timers.
//
// The runtime shell (src/main.js) turns these descriptors into real AshenGame
// enemy/boss spawns. Every number in a descriptor is derived from the run seed,
// so a plan can be regenerated exactly and pre-computed ahead of the live wave.

export const LABYRINTH_VERSION = '0.7.0';
export const LABYRINTH_NAME = 'Cursed Realms — The Eternal Descent';
export const LABYRINTH_PROGRESS_VERSION = 1;

// ── deterministic RNG ───────────────────────────────────────────────────────
export function hashSeed(input) {
  const text = String(input ?? 'ashen');
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0 || 1;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draw a seeded random number and advance the run's RNG state. */
export function rand(run) {
  if (!run || typeof run.rng !== 'number') return 0.5;
  run.rng = (run.rng + 0x6d2b79f5) >>> 0;
  let t = run.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randInt(run, min, max) {
  return min + Math.floor(rand(run) * (max - min + 1));
}

export function pick(run, list) {
  if (!Array.isArray(list) || !list.length) return null;
  return list[Math.floor(rand(run) * list.length) % list.length];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

// ── modes ───────────────────────────────────────────────────────────────────
export const LABYRINTH_MODES = [
  {
    id: 'standard',
    name: 'Infinite Labyrinth',
    subtitle: 'Progresi tanpa akhir',
    desc: 'Alur standar: gelombang musuh, elite, lalu bos setiap siklus.',
    rules: { cursePerCycle: 0 },
    color: '#d0a45a',
  },
  {
    id: 'cursed',
    name: 'Cursed Labyrinth',
    subtitle: 'Setiap siklus menambah kutukan',
    desc: 'Setiap siklus memaksa satu kutukan acak. Hadiah langka lebih sering.',
    rules: { cursePerCycle: 1, rewardLuck: 0.2 },
    color: '#b07be8',
  },
  {
    id: 'blood',
    name: 'Blood Labyrinth',
    subtitle: 'Darah adalah mata uang',
    desc: 'Flask tidak diisi ulang antar-siklus. Kesembuhan dari hadiah berkurang 50%.',
    rules: { noFlaskRefill: true, healScale: 0.5 },
    color: '#c44a5a',
  },
  {
    id: 'arcane',
    name: 'Arcane Labyrinth',
    subtitle: 'Perang mantranya',
    desc: 'Musuh ranged lebih sering; hadiah ritual dan tomes meningkat.',
    rules: { rangedBias: true, ritualBias: true },
    color: '#8f6fc4',
  },
  {
    id: 'colossus',
    name: 'Colossus Labyrinth',
    subtitle: 'Bos lebih sering',
    desc: 'Bos muncul setiap dua gelombang, dengan kesehatan bos 25% lebih rendah.',
    rules: { bossEveryTwoWaves: true, bossHp: 0.75 },
    color: '#c46a32',
  },
  {
    id: 'nightmare',
    name: 'Nightmare Labyrinth',
    subtitle: 'Perilaku musuh lanjutan',
    desc: 'Musuh bergerak lebih cepat, elite lebih sering, dan modifier negatif menumpuk.',
    rules: { speed: 1.18, eliteChance: 0.16, extraNegative: 1 },
    color: '#9d0208',
  },
  {
    id: 'frozen',
    name: 'Frozen Labyrinth',
    subtitle: 'Bahaya beku',
    desc: 'Arena memiliki bahaya es; gerakan sedikit lebih licin dan damage beku tambahan.',
    rules: { hazardBias: true, ice: true },
    color: '#8fdcff',
  },
  {
    id: 'chaos',
    name: 'Chaos Labyrinth',
    subtitle: 'Modifier acak',
    desc: 'Dua modifier acak aktif setiap siklus, baik maupun buruk.',
    rules: { randomModifiers: 2 },
    color: '#e76f51',
  },
  {
    id: 'ritual',
    name: 'Ritual Labyrinth',
    subtitle: 'Korban untuk kekuatan',
    desc: 'Ritual aktif lebih cepat dan hadiah ritual dijamin di setiap chamber.',
    rules: { ritualBias: true, ritualSpeed: 1.5 },
    color: '#55a630',
  },
  {
    id: 'multiplayer',
    name: 'Multiplayer Labyrinth',
    subtitle: 'Kelangsungan hidup kooperatif',
    desc: 'Dua sampai empat penjaga. Musuh diskalakan untuk party, nyawa bersama.',
    rules: { coop: true, partyScaling: true },
    color: '#00b4d8',
  },
];

export const LABYRINTH_MODE_BY_ID = Object.fromEntries(LABYRINTH_MODES.map((m) => [m.id, m]));

// ── cycles and scaling ──────────────────────────────────────────────────────
export const CYCLE_STAGES = [
  { from: 1, to: 5, label: 'Reruntuhan Awal', desc: 'Musuh dasar dan bos pengantar.', color: '#8a8f7a' },
  { from: 6, to: 10, label: 'Pergeseran', desc: 'Elite dan bahaya lingkungan.', color: '#7fae5a' },
  { from: 11, to: 20, label: 'Kombinasi Lanjut', desc: 'Kombinasi musuh tingkat lanjut.', color: '#4f9fc4' },
  { from: 21, to: 30, label: 'Arena Terkutuk', desc: 'Mutasi bos dan arena terkutuk.', color: '#9b6fd0' },
  { from: 31, to: 50, label: 'Legenda', desc: 'Musuh legendaris dan modifier ganda.', color: '#d0a45a' },
  { from: 51, to: 100, label: 'Bos Purba', desc: 'Bos purba dan pertemuan ekstrem.', color: '#e0763a' },
  { from: 101, to: 200, label: 'Mimpi Buruk', desc: 'Musuh mimpi buruk dan mekanik khusus.', color: '#c44a5a' },
  { from: 201, to: Infinity, label: 'Tanpa Batas', desc: 'Penskalaan tanpa akhir dan acak.', color: '#e0e0e0' },
];

export function stageForCycle(cycle) {
  const c = Math.max(1, Math.floor(Number(cycle) || 1));
  return CYCLE_STAGES.find((stage) => c >= stage.from && c <= stage.to) || CYCLE_STAGES[CYCLE_STAGES.length - 1];
}

/**
 * Non-linear difficulty curve. Health grows steadily at first and accelerates
 * after cycle 25, while damage grows slower so deep runs stay readable rather
 * than one-shot. Encounter variety (phases, elites, hazards) carries the rest.
 */
export function cycleScaling(cycle) {
  const c = Math.max(1, Math.floor(Number(cycle) || 1));
  const early = Math.min(c - 1, 24);
  const late = Math.max(0, c - 25);
  const deep = Math.max(0, c - 100);
  return {
    cycle: c,
    hp: 1 + early * 0.135 + late * 0.21 + deep * 0.16,
    dmg: 1 + early * 0.055 + late * 0.075 + deep * 0.06,
    speed: Math.min(1.55, 1 + early * 0.008 + late * 0.006),
    eliteChance: clamp(0.05 + c * 0.011, 0, 0.85),
    extraPhases: Math.min(4, Math.floor((c - 1) / 18)),
    modifierCount: c >= 41 ? 3 : c >= 21 ? 2 : c >= 11 ? 1 : 0,
    hazardChance: clamp((c - 5) * 0.03, 0, 0.85),
    rewardMult: 1 + c * 0.07,
    echoMult: 1 + c * 0.09,
  };
}

// ── 20 labyrinth zones ──────────────────────────────────────────────────────
// `enemyFamilies` reference archetypes in src/core.js so encounters reuse the
// proven AI instead of shipping twenty near-duplicate controllers.
const ZONE_SOURCE = [
  ['forgotten_crypt', 'The Forgotten Crypt', 'Kripta Terlupakan', '#8a8f7a', '#171611', 'skeleton knights, tomb guardians, cursed priests', 'gravebound_king', ['crawler', 'sentinel', 'brute'], 'Tulang berdebu dan lilin yang tidak pernah padam.'],
  ['ember_maw', 'Ember Maw', 'Mulut Bara', '#e0763a', '#241009', 'fire demons, magma creatures, molten knights', 'magma_devourer', ['crawler', 'brute', 'wraith'], 'Lava mengalir ke atas, menantang gravitasi.'],
  ['drowned_sanctuary', 'The Drowned Sanctuary', 'Tempat Suci Tenggelam', '#3fa89a', '#071c1e', 'drowned warriors, abyssal creatures, water spirits', 'drowned_oracle', ['sentinel', 'wraith', 'stalker'], 'Air asin setinggi lutut, memantulkan cahaya yang salah.'],
  ['broken_clock', 'The Broken Clock', 'Jam yang Rusak', '#b08a4a', '#1d1710', 'clockwork soldiers, time phantoms, mechanical beasts', 'last_clockmaker', ['sentinel', 'brute', 'wraith'], 'Detik berhenti di tengah udara seperti serangga.'],
  ['rootbound_prison', 'Rootbound Prison', 'Penjara Akar', '#6f9a45', '#101a0d', 'thorn beasts, corrupted druids, giant insects', 'rootbound_mother', ['crawler', 'sporeling', 'stalker'], 'Akar menembus dinding dan menahan sesuatu di dalamnya.'],
  ['crystal_exile', 'Crystal Exile', 'Pengasingan Kristal', '#8f6fc4', '#150f22', 'crystal sentinels, prism mages, crystal beasts', 'shattered_monarch', ['sentinel', 'wraith', 'brute'], 'Setiap permukaan kristal menampilkan bayangan yang salah.'],
  ['frozen_sepulcher', 'The Frozen Sepulcher', 'Makam Beku', '#8fc9e8', '#0c1820', 'frost undead, ice archers, frozen giants', 'winter_revenant', ['crawler', 'wraith', 'brute'], 'Napas membeku sebelum sempat keluar.'],
  ['buried_sun', 'The Buried Sun', 'Matahari Terkubur', '#e0b45f', '#241c0c', 'sand spirits, ancient guardians, scarab swarms', 'solar_pharaoh', ['crawler', 'sporeling', 'sentinel'], 'Matahari terkubur menerangi pasir dari bawah.'],
  ['fractured_void', 'The Fractured Void', 'Kekosongan Terbelah', '#9b6fd0', '#100a18', 'rift creatures, void knights, dimensional hunters', 'unwritten_one', ['wraith', 'sentinel', 'stalker'], 'Jarak tidak konsisten; lantai berakhir di tempat lain.'],
  ['cathedral_ash', 'Cathedral of Ash', 'Katedral Abu', '#d8b06a', '#1c1713', 'fallen templars, corrupted angels, sacred constructs', 'ashen_archbishop', ['sentinel', 'brute', 'wraith'], 'Abu jatuh ke atas dari langit yang runtuh.'],
  ['mycelium_depths', 'Mycelium Depths', 'Kedalaman Miselium', '#a86bd8', '#14101d', 'fungal beasts, spore creatures, infected guardians', 'spore_sovereign', ['sporeling', 'stalker', 'broodmother'], 'Spora bernyanyi dalam nada yang tidak bisa diingat.'],
  ['abyssal_trench', 'Abyssal Trench', 'Palung Abyssal', '#06d6a0', '#041614', 'deep-sea hunters, spectral eels, abyssal knights', 'trench_leviathan', ['wraith', 'stalker', 'sentinel'], 'Tekanan menghapus suara dan menekan tulang.'],
  ['endless_archive', 'The Endless Archive', 'Arsip Tanpa Akhir', '#c4a87a', '#1a1610', 'living books, ink creatures, forgotten scholars', 'librarian_eternal', ['wraith', 'sentinel', 'sporeling'], 'Rak buku terus bertambah setiap kali kau berpaling.'],
  ['battlefield_echoes', 'Battlefield of Echoes', 'Medan Gema', '#8a5a5a', '#1c1212', 'spectral soldiers, phantom cavalry, war machines', 'nameless_general', ['sentinel', 'brute', 'crawler'], 'Teriakan perang berulang tanpa pasukan.'],
  ['iron_gaol', 'The Iron Gaol', 'Penjara Besi', '#7d8a99', '#121619', 'prison wardens, chainsworn, armored executioners', 'unbroken_jailer', ['brute', 'sentinel', 'stalker'], 'Rantai bergerak sendiri di sepanjang koridor.'],
  ['astral_observatory', 'Astral Observatory', 'Observatorium Astral', '#4f6fc4', '#0b1026', 'star hunters, cosmic guardians, astral constructs', 'star_eater', ['wraith', 'sentinel', 'brute'], 'Bintang-bintang berputar terlalu cepat untuk dilihat.'],
  ['hollow_ballroom', 'The Hollow Ballroom', 'Balai Rongga', '#c47aa8', '#1d111a', 'possessed nobles, phantom dancers, royal specters', 'masked_queen', ['wraith', 'crawler', 'sentinel'], 'Musik tanpa pemusik mengatur langkahmu.'],
  ['heart_colossus', 'Heart of the Colossus', 'Jantung Raksasa', '#b0714a', '#1c120c', 'stone creatures, ancient roots, living statues', 'walking_mountain', ['brute', 'sentinel', 'sporeling'], 'Dinding berdenyut seperti daging yang mengeras.'],
  ['demon_foundry', 'The Demon Foundry', 'Peleburan Iblis', '#d05a32', '#22100a', 'forged demons, molten sentinels, cursed weapons', 'forge_sovereign', ['sentinel', 'brute', 'crawler'], 'Palu raksasa menempa sesuatu yang belum bernama.'],
  ['last_labyrinth', 'The Last Labyrinth', 'Labirin Terakhir', '#e0e0e0', '#101014', 'mixed elite families and ancient entities', 'labyrinth_architect', ['sentinel', 'wraith', 'brute', 'stalker'], 'Labirin ini tidak punya pusat, hanya pintu berikutnya.'],
];

export const LABYRINTH_ZONES = ZONE_SOURCE.map(([id, name, localName, color, bg, families, bossId, archetypes, lore], index) => ({
  id,
  index,
  name,
  localName,
  color,
  bg,
  families,
  bossId,
  archetypes,
  lore,
  secret: id === 'last_labyrinth',
  unlockCycle: id === 'last_labyrinth' ? 20 : 1,
  palette: {
    top: bg,
    mid: color,
    low: '#08070a',
    fog: color,
    glow: color,
    accent: color,
  },
  music: ['ashen', 'mycelial', 'cistern', 'frostglass', 'cinder'][index % 5],
}));

export const LABYRINTH_ZONE_BY_ID = Object.fromEntries(LABYRINTH_ZONES.map((z) => [z.id, z]));

/** Zones eligible for a cycle; secret zones appear through discovery, not order. */
export function zonePoolForCycle(run) {
  const cycle = Math.max(1, run?.cycle || 1);
  const seen = new Set(run?.history?.zones || []);
  const pool = LABYRINTH_ZONES.filter((zone) => !zone.secret && zone.unlockCycle <= cycle);
  const fresh = pool.filter((zone) => !seen.has(zone.id));
  return fresh.length ? fresh : pool;
}

// ── 40 named labyrinth enemies ─────────────────────────────────────────────
const ENEMY_SOURCE = [
  ['crypt_skeleton', 'Skeleton Knight', 'forgotten_crypt', 'sentinel'],
  ['crypt_guardian', 'Tomb Guardian', 'forgotten_crypt', 'brute'],
  ['ember_imp', 'Ember Imp', 'ember_maw', 'crawler'],
  ['molten_knight', 'Molten Knight', 'ember_maw', 'brute'],
  ['drowned_warrior', 'Drowned Warrior', 'drowned_sanctuary', 'sentinel'],
  ['water_spirit', 'Water Spirit', 'drowned_sanctuary', 'wraith'],
  ['clockwork_soldier', 'Clockwork Soldier', 'broken_clock', 'sentinel'],
  ['time_phantom', 'Time Phantom', 'broken_clock', 'wraith'],
  ['thorn_beast', 'Thorn Beast', 'rootbound_prison', 'crawler'],
  ['corrupted_druid', 'Corrupted Druid', 'rootbound_prison', 'sporeling'],
  ['prism_mage', 'Prism Mage', 'crystal_exile', 'wraith'],
  ['crystal_beast', 'Crystal Beast', 'crystal_exile', 'brute'],
  ['frost_undead', 'Frost Undead', 'frozen_sepulcher', 'crawler'],
  ['ice_archer', 'Ice Archer', 'frozen_sepulcher', 'wraith'],
  ['sand_spirit', 'Sand Spirit', 'buried_sun', 'wraith'],
  ['scarab_swarm', 'Scarab Swarm', 'buried_sun', 'sporeling'],
  ['rift_hunter', 'Rift Hunter', 'fractured_void', 'stalker'],
  ['void_knight', 'Void Knight', 'fractured_void', 'sentinel'],
  ['fallen_templar', 'Fallen Templar', 'cathedral_ash', 'sentinel'],
  ['sacred_construct', 'Sacred Construct', 'cathedral_ash', 'brute'],
  ['fungal_beast', 'Fungal Beast', 'mycelium_depths', 'sporeling'],
  ['infected_guardian', 'Infected Guardian', 'mycelium_depths', 'stalker'],
  ['spectral_eel', 'Spectral Eel', 'abyssal_trench', 'wraith'],
  ['abyssal_knight', 'Abyssal Knight', 'abyssal_trench', 'sentinel'],
  ['ink_creature', 'Ink Creature', 'endless_archive', 'crawler'],
  ['forgotten_scholar', 'Forgotten Scholar', 'endless_archive', 'wraith'],
  ['phantom_cavalry', 'Phantom Cavalry', 'battlefield_echoes', 'sentinel'],
  ['war_machine', 'War Machine', 'battlefield_echoes', 'brute'],
  ['chainsworn', 'Chainsworn', 'iron_gaol', 'stalker'],
  ['armored_executioner', 'Armored Executioner', 'iron_gaol', 'brute'],
  ['star_hunter', 'Star Hunter', 'astral_observatory', 'wraith'],
  ['astral_construct', 'Astral Construct', 'astral_observatory', 'sentinel'],
  ['possessed_noble', 'Possessed Noble', 'hollow_ballroom', 'crawler'],
  ['phantom_dancer', 'Phantom Dancer', 'hollow_ballroom', 'wraith'],
  ['living_statue', 'Living Statue', 'heart_colossus', 'brute'],
  ['ancient_root', 'Ancient Root', 'heart_colossus', 'stalker'],
  ['forged_demon', 'Forged Demon', 'demon_foundry', 'sentinel'],
  ['cursed_weapon', 'Cursed Weapon', 'demon_foundry', 'crawler'],
  ['labyrinth_wraith', 'Labyrinth Wraith', 'last_labyrinth', 'wraith'],
  ['ancient_entity', 'Ancient Entity', 'last_labyrinth', 'brute'],
];

export const LABYRINTH_ENEMIES = ENEMY_SOURCE.map(([id, name, zone, archetype], index) => ({
  id,
  name,
  zone,
  archetype,
  variant: index % 3 === 0 ? 'elder' : index % 3 === 2 ? 'young' : 'normal',
  eliteEligible: archetype !== 'broodmother',
}));

export const LABYRINTH_ENEMY_BY_ID = Object.fromEntries(LABYRINTH_ENEMIES.map((e) => [e.id, e]));

export function enemiesForZone(zoneId, cycle = 1) {
  const pool = LABYRINTH_ENEMIES.filter((enemy) => enemy.zone === zoneId);
  if (pool.length) return pool;
  return LABYRINTH_ENEMIES.filter((enemy) => enemy.zone === 'last_labyrinth' || enemy.zone === 'forgotten_crypt');
}

export const ELITE_TIERS = [
  { rank: 'E1', name: 'Veteran', hp: 1.5, dmg: 1.2, minCycle: 1, color: '#4a90e2' },
  { rank: 'E2', name: 'Hardened', hp: 2.0, dmg: 1.4, minCycle: 6, color: '#52b788' },
  { rank: 'E3', name: 'Champion', hp: 2.7, dmg: 1.65, minCycle: 12, color: '#f77f00' },
  { rank: 'E4', name: 'Corrupted', hp: 3.5, dmg: 1.95, minCycle: 21, color: '#d62828' },
  { rank: 'E5', name: 'Ancient', hp: 4.6, dmg: 2.3, minCycle: 36, color: '#9d4edd' },
  { rank: 'E6', name: 'Mythic', hp: 6.2, dmg: 2.75, minCycle: 61, color: '#ffd166' },
  { rank: 'E7', name: 'Worldbreaker', hp: 8.5, dmg: 3.4, minCycle: 101, color: '#ff0054' },
];

export function eliteTierForCycle(cycle) {
  const c = Math.max(1, Number(cycle) || 1);
  const tiers = ELITE_TIERS.filter((tier) => tier.minCycle <= c);
  return tiers[tiers.length - 1] || ELITE_TIERS[0];
}

// ── 30 labyrinth bosses ─────────────────────────────────────────────────────
export const BOSS_RARITY = {
  common: { id: 'common', name: 'Common', weight: 100, color: '#b8b8a8' },
  uncommon: { id: 'uncommon', name: 'Uncommon', weight: 46, color: '#52b788' },
  rare: { id: 'rare', name: 'Rare', weight: 18, color: '#4f9fc4', minCycle: 8 },
  legendary: { id: 'legendary', name: 'Legendary', weight: 6, color: '#d0a45a', minCycle: 20 },
  mythic: { id: 'mythic', name: 'Mythic', weight: 2, color: '#ff0054', minCycle: 40 },
};

export const PHASE_TYPES = [
  { id: 'armor_break', name: 'Armor Break', desc: 'Komponen tubuh terbuka dan menerima damage ekstra.' },
  { id: 'summoner', name: 'Summoner', desc: 'Memanggil pengawal tambahan.' },
  { id: 'arena_transform', name: 'Arena Transformation', desc: 'Platform dan bahaya arena berubah.' },
  { id: 'enrage', name: 'Enrage', desc: 'Kombinasi serangan baru dan lebih cepat.' },
  { id: 'duel', name: 'Duel', desc: 'Moveset cepat satu-lawan-satu.' },
  { id: 'survival', name: 'Survival', desc: 'Pemain harus bertahan dari mekanik khusus.' },
  { id: 'final_stand', name: 'Final Stand', desc: 'Fase penutup dengan kerusakan tertinggi.' },
];

const BOSS_SOURCE = [
  ['gravebound_king', 'The Gravebound King', 'forgotten_crypt', 'common', 4, 'summon', 520, 'Summons royal guardians', ['summoner', 'armor_break', 'enrage', 'final_stand']],
  ['magma_devourer', 'Magma Devourer', 'ember_maw', 'common', 5, 'slam', 620, 'Changes the arena with lava', ['arena_transform', 'enrage', 'armor_break', 'summoner', 'final_stand']],
  ['drowned_oracle', 'The Drowned Oracle', 'drowned_sanctuary', 'common', 3, 'volley', 560, 'Water illusions', ['armor_break', 'enrage', 'final_stand']],
  ['last_clockmaker', 'The Last Clockmaker', 'broken_clock', 'common', 4, 'ring', 590, 'Time manipulation', ['duel', 'enrage', 'arena_transform', 'final_stand']],
  ['rootbound_mother', 'The Rootbound Mother', 'rootbound_prison', 'common', 4, 'summon', 610, 'Living roots', ['summoner', 'armor_break', 'arena_transform', 'final_stand']],
  ['shattered_monarch', 'The Shattered Monarch', 'crystal_exile', 'uncommon', 5, 'charge', 680, 'Crystal clones', ['duel', 'summoner', 'armor_break', 'enrage', 'final_stand']],
  ['winter_revenant', 'The Winter Revenant', 'frozen_sepulcher', 'uncommon', 4, 'rain', 700, 'Freezing arena', ['arena_transform', 'enrage', 'survival', 'final_stand']],
  ['solar_pharaoh', 'The Solar Pharaoh', 'buried_sun', 'uncommon', 4, 'volley', 720, 'Sun-powered attacks', ['armor_break', 'enrage', 'arena_transform', 'final_stand']],
  ['unwritten_one', 'The Unwritten One', 'fractured_void', 'rare', 5, 'ring', 780, 'Dimensional shifts', ['arena_transform', 'duel', 'summoner', 'enrage', 'final_stand']],
  ['ashen_archbishop', 'The Ashen Archbishop', 'cathedral_ash', 'uncommon', 4, 'summon', 760, 'Celestial barriers', ['survival', 'summoner', 'armor_break', 'final_stand']],
  ['spore_sovereign', 'The Spore Sovereign', 'mycelium_depths', 'common', 3, 'rain', 600, 'Spore clouds', ['summoner', 'enrage', 'final_stand']],
  ['trench_leviathan', 'The Trench Leviathan', 'abyssal_trench', 'rare', 5, 'charge', 840, 'Changing water levels', ['arena_transform', 'survival', 'duel', 'enrage', 'final_stand']],
  ['librarian_eternal', 'The Librarian Eternal', 'endless_archive', 'uncommon', 4, 'summon', 740, 'Summons living books', ['summoner', 'armor_break', 'arena_transform', 'final_stand']],
  ['nameless_general', 'The Nameless General', 'battlefield_echoes', 'uncommon', 4, 'charge', 760, 'Phantom armies', ['summoner', 'duel', 'enrage', 'final_stand']],
  ['unbroken_jailer', 'The Unbroken Jailer', 'iron_gaol', 'common', 3, 'slam', 640, 'Arena restraints', ['arena_transform', 'armor_break', 'final_stand']],
  ['star_eater', 'The Star Eater', 'astral_observatory', 'rare', 5, 'ring', 860, 'Cosmic gravity', ['arena_transform', 'survival', 'enrage', 'armor_break', 'final_stand']],
  ['masked_queen', 'The Masked Queen', 'hollow_ballroom', 'uncommon', 4, 'summon', 750, 'Illusionary duplicates', ['summoner', 'duel', 'enrage', 'final_stand']],
  ['walking_mountain', 'The Walking Mountain', 'heart_colossus', 'rare', 5, 'slam', 900, 'Destructible terrain', ['arena_transform', 'armor_break', 'enrage', 'survival', 'final_stand']],
  ['forge_sovereign', 'The Forge Sovereign', 'demon_foundry', 'uncommon', 4, 'rain', 790, 'Mechanical reinforcements', ['summoner', 'armor_break', 'enrage', 'final_stand']],
  ['labyrinth_architect', 'The Labyrinth Architect', 'last_labyrinth', 'legendary', 6, 'ring', 1100, 'Reconstructs the arena', ['arena_transform', 'summoner', 'duel', 'enrage', 'survival', 'final_stand']],
  ['bloodmoon_hunter', 'The Bloodmoon Hunter', 'battlefield_echoes', 'rare', 3, 'charge', 820, 'Tracks players', ['duel', 'enrage', 'final_stand']],
  ['pale_executioner', 'The Pale Executioner', 'iron_gaol', 'uncommon', 4, 'slam', 800, 'Counterattack windows', ['armor_break', 'duel', 'enrage', 'final_stand']],
  ['hollow_saint', 'The Hollow Saint', 'cathedral_ash', 'rare', 5, 'ring', 880, 'Rotating sacred shields', ['survival', 'armor_break', 'summoner', 'enrage', 'final_stand']],
  ['wyrm_forgotten_kings', 'Wyrm of Forgotten Kings', 'frozen_sepulcher', 'legendary', 5, 'volley', 980, 'Aerial and ground combat', ['arena_transform', 'enrage', 'armor_break', 'duel', 'final_stand']],
  ['twin_calamities', 'The Twin Calamities', 'fractured_void', 'legendary', 4, 'volley', 1040, 'Two coordinated bosses', ['duel', 'summoner', 'enrage', 'final_stand']],
  ['glass_prophet', 'The Glass Prophet', 'crystal_exile', 'rare', 4, 'rain', 840, 'Reflective projectiles', ['survival', 'armor_break', 'enrage', 'final_stand']],
  ['silent_colossus', 'The Silent Colossus', 'heart_colossus', 'uncommon', 3, 'slam', 780, 'Sound and visibility mechanics', ['arena_transform', 'armor_break', 'final_stand']],
  ['crimson_architect', 'The Crimson Architect', 'demon_foundry', 'legendary', 5, 'summon', 1000, 'Constructs arena traps', ['arena_transform', 'summoner', 'enrage', 'survival', 'final_stand']],
  ['eternal_witness', 'The Eternal Witness', 'endless_archive', 'mythic', 6, 'ring', 1180, 'Revisits previous boss mechanics', ['arena_transform', 'summoner', 'duel', 'enrage', 'survival', 'final_stand']],
  ['final_paradox', 'The Final Paradox', 'last_labyrinth', 'mythic', 7, 'rain', 1500, 'Multiple reality phases', ['armor_break', 'arena_transform', 'summoner', 'duel', 'enrage', 'survival', 'final_stand']],
];

function dialogueForBoss(name, signature, phases) {
  const intro = [
    { speaker: name, text: `Labirin mengingat namamu. ${signature}.` },
    { speaker: 'The Oathbound', text: 'Maka biarkan ia mengingat apa yang terjadi setelah ini.' },
  ];
  const dialogue = { intro };
  for (let phase = 2; phase <= phases; phase += 1) {
    dialogue[`phase${phase}`] = [
      { speaker: name, text: `Fase ${phase}. ${signature} — dan kau masih berdiri.` },
      { speaker: 'The Oathbound', text: 'Aku belum selesai.' },
    ];
  }
  dialogue.defeat = [
    { speaker: name, text: 'Labirin akan membangunku kembali... lebih dalam...' },
    { speaker: 'The Oathbound', text: 'Kalau begitu aku akan turun lebih dalam.' },
  ];
  return dialogue;
}

function thresholdsFor(phases) {
  return Array.from({ length: Math.max(0, phases - 1) }, (_, i) => 1 - (i + 1) / phases);
}

export const LABYRINTH_BOSSES = BOSS_SOURCE.map(([id, name, zone, rarity, phases, pattern, maxHp, signature, phaseTypes], index) => {
  const boss = {
    id,
    kind: `lab_${id}`,
    name,
    title: signature,
    zone,
    rarity,
    phases,
    phaseTypes,
    pattern,
    signature,
    maxHp,
    contact: 16 + phases * 3,
    w: pattern === 'charge' ? 132 : 118,
    h: pattern === 'ring' ? 122 : 136,
    flying: pattern === 'volley' || pattern === 'rain',
    flyingBias: pattern === 'ring' || pattern === 'volley',
    ashReward: 40 + Math.round(maxHp / 12),
    echoReward: 18 + index * 2,
    dialogue: dialogueForBoss(name, signature, phases),
    phaseThresholds: thresholdsFor(phases),
    mini: rarity === 'common' && phases <= 3,
    spawn: { x: 860, y: 470 - (pattern === 'ring' ? 122 : 136) },
    rarityData: BOSS_RARITY[rarity],
  };
  return boss;
});

export const LABYRINTH_BOSS_BY_ID = Object.fromEntries(LABYRINTH_BOSSES.map((b) => [b.id, b]));

export function bossPoolForCycle(run) {
  const cycle = Math.max(1, run?.cycle || 1);
  const zone = LABYRINTH_ZONE_BY_ID[run?.zoneId] || LABYRINTH_ZONES[0];
  const seen = new Set(run?.history?.bosses || []);
  const eligible = LABYRINTH_BOSSES.filter((boss) => {
    const rarity = BOSS_RARITY[boss.rarity];
    if (rarity.minCycle && cycle < rarity.minCycle) return false;
    return true;
  });
  const local = eligible.filter((boss) => boss.zone === zone.id);
  const freshLocal = local.filter((boss) => !seen.has(boss.id));
  if (freshLocal.length) return freshLocal;
  const fresh = eligible.filter((boss) => !seen.has(boss.id));
  return fresh.length ? fresh : eligible;
}

export function pickBoss(run) {
  const pool = bossPoolForCycle(run);
  if (!pool.length) return LABYRINTH_BOSSES[0];
  const weighted = [];
  for (const boss of pool) {
    const rarity = BOSS_RARITY[boss.rarity];
    if (rarity.minCycle && (run.cycle || 1) < rarity.minCycle) continue;
    const weight = rarity.weight;
    for (let i = 0; i < weight; i += 1) weighted.push(boss);
  }
  const list = weighted.length ? weighted : pool;
  return list[Math.floor(rand(run) * list.length) % list.length];
}

/** Boss runtime overrides for AshenGame.spawnBoss(kind, overrides). */
export function bossOverrides(boss, cycle, scaling, mode = null) {
  const extraPhases = Math.min(3, scaling?.extraPhases || 0);
  const maxPhases = Math.min(7, boss.phases + extraPhases);
  const bossHp = mode?.rules?.bossHp || 1;
  const maxHp = Math.round(boss.maxHp * (scaling?.hp || 1) * bossHp);
  const overrides = {
    name: boss.name,
    title: boss.title,
    maxHp,
    contact: Math.round(boss.contact * (scaling?.dmg || 1)),
    w: boss.w,
    h: boss.h,
    flying: boss.flying,
    pattern: boss.pattern,
    patternType: boss.pattern,
    maxPhases,
    phaseThresholds: thresholdsFor(maxPhases),
    dialogueData: JSON.parse(JSON.stringify(boss.dialogue)),
    ashReward: Math.round(boss.ashReward * (scaling?.rewardMult || 1)),
    echoReward: Math.round(boss.echoReward * (scaling?.echoMult || 1)),
    spawn: boss.spawn,
    labBossId: boss.id,
    labRarity: boss.rarity,
    phaseTypes: boss.phaseTypes,
  };
  if (maxPhases > boss.phases) {
    for (let phase = boss.phases + 1; phase <= maxPhases; phase += 1) {
      overrides.dialogueData[`phase${phase}`] = [
        { speaker: boss.name, text: `Fase ${phase}. Labirin memperpanjang hidupku, bukan akhirku.` },
        { speaker: 'The Oathbound', text: 'Maka aku akan memperpanjang pedangku.' },
      ];
    }
  }
  return overrides;
}

// ── 40 cursed / ritual / corrupted items ────────────────────────────────────
export const ITEM_CATEGORIES = [
  { id: 'cursed', name: 'Cursed Relics', localName: 'Relik Terkutuk', color: '#b07be8', desc: 'Bonus seimbang dengan kutukan.' },
  { id: 'ritual', name: 'Ritual Items', localName: 'Barang Ritual', color: '#55a630', desc: 'Aktif saat syarat terpenuhi.' },
  { id: 'corrupted', name: 'Corrupted Equipment', localName: 'Perlengkapan Korup', color: '#c44a5a', desc: 'Efek kuat dengan harga.' },
  { id: 'bloodbound', name: 'Bloodbound Artifacts', localName: 'Artefak Darah', color: '#9d0208', desc: 'Menukar darah dengan kekuatan.' },
  { id: 'void', name: 'Void Relics', localName: 'Relik Void', color: '#7209b7', desc: 'Mengubah gerak dan sihir.' },
  { id: 'ancient', name: 'Ancient Charms', localName: 'Jimat Purba', color: '#d0a45a', desc: 'Bonus tempur pasif.' },
  { id: 'tome', name: 'Forbidden Tomes', localName: 'Tome Terlarang', color: '#4f9fc4', desc: 'Mengubah perilaku sihir.' },
  { id: 'soulbound', name: 'Soulbound Items', localName: 'Barang Terikat Jiwa', color: '#06d6a0', desc: 'Tumbuh melalui penggunaan.' },
];

export const ITEM_CATEGORY_BY_ID = Object.fromEntries(ITEM_CATEGORIES.map((c) => [c.id, c]));

const ITEM_SOURCE = [
  // id, name, category, rarity, mods, curse text, lore
  ['ring_hollow_king', 'Ring of the Hollow King', 'cursed', 'rare', { damage: 0.12, crit: 0.08, maxHp: -0.1 }, 'Kesehatan maksimum -10%.', 'Berkah kerajaan yang menuntut harga.'],
  ['tome_fractured_souls', 'Tome of Fractured Souls', 'tome', 'rare', { spellPower: 0.15, manaRegen: 0.1, manaCost: 0.15 }, 'Biaya sihir +15%.', 'Sihir menjadi lebih kuat, tetapi lebih jarang.'],
  ['crimson_covenant', 'Crimson Covenant', 'bloodbound', 'rare', { attackSpeed: 0.1, lifesteal: 0.1, heal: -0.12 }, 'Penyembuhan diterima -12%.', 'Setiap kemenangan memperkuat perjanjian.'],
  ['hourglass_lost_time', 'Hourglass of Lost Time', 'ancient', 'uncommon', { speed: 0.15, dodge: 0.1, armor: -0.15 }, 'Armor -15%.', 'Waktu memihak yang cepat, bukan yang terlindungi.'],
  ['feather_fallen', 'Feather of the Fallen', 'corrupted', 'uncommon', { aerial: 0.15, jump: 0.1, ground: -0.1 }, 'Damage serangan darat -10%.', 'Hadiah dari sesuatu yang pernah terbang.'],
  ['void_relic_rift', 'Void Relic of the Rift', 'void', 'rare', { speed: 0.1, dodge: 0.15, maxHp: -0.08 }, 'Tekanan void mengurangi kesehatan 8%.', 'Ruang di sekitarnya tidak yakin harus berada di mana.'],
  ['ancient_skull_1', 'Skull of the First Vow', 'ancient', 'rare', { damage: 0.06, crit: 0.03 }, '', 'Tengkorak yang masih mengingat janji pertama.'],
  ['ancient_skull_2', 'Skull of the Last King', 'ancient', 'rare', { damage: 0.06, crit: 0.03 }, '', 'Mahkota sudah hilang, sumpah belum.'],
  ['ancient_skull_3', 'Skull of the Nameless', 'ancient', 'rare', { damage: 0.06, crit: 0.03 }, '', 'Tidak ada nama yang tersisa untuk diukir.'],
  ['elemental_ember_heart', 'Ember Heart', 'ritual', 'rare', { spellPower: 0.08 }, '', 'Bara yang tidak membutuhkan bahan bakar.'],
  ['elemental_frost_core', 'Frost Core', 'ritual', 'rare', { spellPower: 0.08 }, '', 'Dingin yang tidak pernah kehilangan bentuk.'],
  ['elemental_storm_sigil', 'Storm Sigil', 'ritual', 'rare', { spellPower: 0.08 }, '', 'Petir yang tersimpan dalam lingkaran.'],
  ['bloodmoon_edge', 'Bloodmoon Edge', 'bloodbound', 'legendary', { damage: 0.18, lifesteal: 0.08, heal: -0.2 }, 'Penyembuhan -20%.', 'Bilah yang tumbuh setiap kali meminum darah.'],
  ['armor_graveplate', 'Graveplate', 'corrupted', 'uncommon', { armor: 0.22, speed: -0.08 }, 'Kecepatan gerak -8%.', 'Pelat yang ditempa dari penutup peti.'],
  ['charm_hunter', 'Hunter\'s Charm', 'ancient', 'common', { crit: 0.06, damage: 0.04 }, '', 'Gigi serigala yang tidak pernah tumpul.'],
  ['charm_ward', 'Ward Charm', 'ancient', 'common', { armor: 0.1, heal: 0.08 }, '', 'Ukiran perlindungan dari kayu tua.'],
  ['void_cloak', 'Void Cloak', 'void', 'uncommon', { dodge: 0.18, speed: 0.06, armor: -0.1 }, 'Armor -10%.', 'Kain yang menyerap cahaya dan keberanian.'],
  ['tome_blood_script', 'Tome of Blood Script', 'tome', 'rare', { spellPower: 0.18, lifesteal: 0.05, maxHp: -0.08 }, 'Kesehatan maksimum -8%.', 'Setiap mantra ditulis dengan tinta yang hangat.'],
  ['ritual_mask_echo', 'Mask of Echoes', 'ritual', 'uncommon', { crit: 0.05, spellPower: 0.05 }, '', 'Mendengar jawaban sebelum pertanyaan diajukan.'],
  ['soulbound_blade', 'Soulbound Blade', 'soulbound', 'rare', { damage: 0.05, attackSpeed: 0.05 }, '', 'Tumbuh lebih tajam setiap kali diangkat.'],
  ['soulbound_ring', 'Soulbound Ring', 'soulbound', 'uncommon', { maxHp: 0.06, heal: 0.06 }, '', 'Mengingat setiap pemakainya.'],
  ['cursed_crown_thorns', 'Crown of Thorns', 'cursed', 'legendary', { damage: 0.2, crit: 0.1, maxHp: -0.15 }, 'Kesehatan maksimum -15%.', 'Mahkota yang menanam durinya ke dalam pemakainya.'],
  ['cursed_gallows_rope', 'Gallows Rope', 'cursed', 'uncommon', { damage: 0.1, speed: 0.08, heal: -0.15 }, 'Penyembuhan -15%.', 'Tali yang tidak pernah cukup panjang.'],
  ['cursed_mirror_shard', 'Mirror Shard', 'cursed', 'rare', { crit: 0.12, armor: -0.12 }, 'Armor -12%.', 'Memantulkan serangan yang belum datang.'],
  ['corrupted_gauntlet', 'Corrupted Gauntlet', 'corrupted', 'rare', { attackSpeed: 0.16, maxHp: -0.1 }, 'Kesehatan maksimum -10%.', 'Tangan yang tidak lagi sepenuhnya milikmu.'],
  ['corrupted_visor', 'Corrupted Visor', 'corrupted', 'uncommon', { crit: 0.1, heal: -0.1 }, 'Penyembuhan -10%.', 'Kaca yang menunjukkan musuh sebagai dirimu.'],
  ['bloodbound_heart', 'Bloodbound Heart', 'bloodbound', 'legendary', { damage: 0.15, lifesteal: 0.15, maxHp: -0.12 }, 'Kesehatan maksimum -12%.', 'Berdenyut dua kali untuk setiap denyutmu.'],
  ['bloodbound_sigil', 'Bloodbound Sigil', 'bloodbound', 'rare', { spellPower: 0.12, lifesteal: 0.08, heal: -0.1 }, 'Penyembuhan -10%.', 'Segel yang ditulis dengan darah pemilik sebelumnya.'],
  ['void_eye', 'Void Eye', 'void', 'legendary', { crit: 0.16, spellPower: 0.12, maxHp: -0.12 }, 'Kesehatan maksimum -12%.', 'Melihat tempat yang seharusnya tidak ada.'],
  ['void_boots', 'Void Boots', 'void', 'rare', { speed: 0.16, dodge: 0.12, armor: -0.12 }, 'Armor -12%.', 'Langkah yang tidak selalu menyentuh lantai.'],
  ['tome_unmaking', 'Tome of Unmaking', 'tome', 'legendary', { spellPower: 0.22, manaCost: 0.2, maxHp: -0.1 }, 'Biaya sihir +20%, kesehatan -10%.', 'Halaman yang menghapus dirinya sendiri saat dibaca.'],
  ['tome_winter_words', 'Tome of Winter Words', 'tome', 'rare', { spellPower: 0.14, manaRegen: 0.12, speed: -0.06 }, 'Kecepatan -6%.', 'Kata-kata yang membeku di udara.'],
  ['ancient_sun_medal', 'Sun Medal', 'ancient', 'uncommon', { damage: 0.08, heal: 0.1 }, '', 'Logam yang tetap hangat setelah seribu tahun.'],
  ['ancient_moon_coin', 'Moon Coin', 'ancient', 'uncommon', { crit: 0.07, dodge: 0.06 }, '', 'Sisi yang terlihat selalu berubah.'],
  ['ritual_bone_dice', 'Bone Dice', 'ritual', 'common', { crit: 0.05, damage: 0.05, armor: -0.05 }, 'Armor -5%.', 'Setiap lemparan adalah janji kecil.'],
  ['ritual_ash_censer', 'Ash Censer', 'ritual', 'uncommon', { spellPower: 0.08, heal: 0.06 }, '', 'Asapnya membentuk wajah yang sudah pergi.'],
  ['soulbound_armor', 'Soulbound Armor', 'soulbound', 'legendary', { armor: 0.18, maxHp: 0.08, speed: -0.06 }, 'Kecepatan -6%.', 'Pelat yang mengingat semua luka.'],
  ['soulbound_tome', 'Soulbound Tome', 'soulbound', 'rare', { spellPower: 0.1, manaRegen: 0.1, crit: 0.04 }, '', 'Setiap halaman baru muncul setelah pertempuran.'],
  ['cursed_bell', 'Bell of the Deep', 'cursed', 'rare', { damage: 0.14, speed: -0.1 }, 'Kecepatan -10%.', 'Berdering sekali untuk setiap nama yang hilang.'],
  ['cursed_shroud', 'Shroud of the Unnamed', 'cursed', 'uncommon', { armor: 0.16, heal: -0.12 }, 'Penyembuhan -12%.', 'Kain yang tidak memiliki pemilik.'],
];

export const LABYRINTH_ITEMS = ITEM_SOURCE.map(([id, name, category, rarity, mods, curse, lore]) => ({
  id,
  name,
  category,
  categoryName: ITEM_CATEGORY_BY_ID[category]?.localName || category,
  color: ITEM_CATEGORY_BY_ID[category]?.color || '#d0a45a',
  rarity,
  mods,
  curse,
  lore,
  ritual: category === 'ritual',
}));

export const LABYRINTH_ITEM_BY_ID = Object.fromEntries(LABYRINTH_ITEMS.map((item) => [item.id, item]));

const MOD_KEYS = ['damage', 'maxHp', 'speed', 'crit', 'armor', 'heal', 'flasks', 'lifesteal', 'spellPower', 'manaRegen', 'manaCost', 'attackSpeed', 'dodge', 'aerial', 'ground', 'jump'];

/** Aggregate item modifiers. Synergies are additive on top of individual rolls. */
export function itemTotals(itemIds = [], synergyIds = []) {
  const totals = Object.fromEntries(MOD_KEYS.map((key) => [key, 0]));
  for (const id of itemIds) {
    const item = LABYRINTH_ITEM_BY_ID[id];
    if (!item) continue;
    for (const [key, value] of Object.entries(item.mods)) {
      if (key in totals) totals[key] += Number(value) || 0;
    }
  }
  for (const id of synergyIds) {
    const synergy = SYNERGY_BY_ID[id];
    if (!synergy) continue;
    for (const [key, value] of Object.entries(synergy.mods || {})) {
      if (key in totals) totals[key] += Number(value) || 0;
    }
  }
  totals.damage = clamp(totals.damage, -0.75, 3);
  totals.maxHp = clamp(totals.maxHp, -0.6, 2);
  totals.speed = clamp(totals.speed, -0.4, 1);
  totals.armor = clamp(totals.armor, -0.5, 0.7);
  totals.heal = clamp(totals.heal, -0.8, 2);
  totals.crit = clamp(totals.crit, 0, 0.9);
  return totals;
}

export function itemDescription(item) {
  if (!item) return '';
  const labels = {
    damage: 'Damage',
    maxHp: 'Max HP',
    speed: 'Kecepatan',
    crit: 'Kritikal',
    armor: 'Armor',
    heal: 'Penyembuhan',
    flasks: 'Flask',
    lifesteal: 'Lifesteal',
    spellPower: 'Kekuatan Sihir',
    manaRegen: 'Regen Mana',
    manaCost: 'Biaya Mana',
    attackSpeed: 'Kecepatan Serang',
    dodge: 'Dodge',
    aerial: 'Damage Udara',
    ground: 'Damage Darat',
    jump: 'Lompat',
  };
  return Object.entries(item.mods)
    .map(([key, value]) => `${value > 0 ? '+' : ''}${Math.round(value * 100)}% ${labels[key] || key}`)
    .join(' · ');
}

// ── forbidden synergies ─────────────────────────────────────────────────────
const SYNERGY_SOURCE = [
  ['blood_monarch', 'Blood Monarch', ['ring_hollow_king', 'crimson_covenant'], { damage: 0.1, lifesteal: 0.05 }, '+10% damage dan +5% lifesteal.', true],
  ['temporal_sorcerer', 'Temporal Sorcerer', ['tome_fractured_souls', 'hourglass_lost_time'], { spellPower: 0.12, speed: 0.05 }, '+12% kekuatan sihir dan +5% kecepatan.', true],
  ['riftwing', 'Riftwing', ['feather_fallen', 'void_relic_rift'], { damage: 0.1, dodge: 0.08 }, '+10% damage dan +8% dodge.', true],
  ['gravebound_ascension', 'Gravebound Ascension', ['ancient_skull_1', 'ancient_skull_2', 'ancient_skull_3'], { damage: 0.15, maxHp: -0.1 }, '+15% damage, -10% Max HP. Tiga tengkorak menuntut takhta.', true],
  ['primal_convergence', 'Primal Convergence', ['elemental_ember_heart', 'elemental_frost_core', 'elemental_storm_sigil'], { spellPower: 0.18, manaCost: 0.1 }, '+18% kekuatan sihir, +10% biaya mana.', true],
  ['hollow_covenant', 'Hollow Covenant', ['cursed_crown_thorns', 'bloodbound_heart'], { damage: 0.12, maxHp: -0.08, heal: -0.1 }, '+12% damage, -8% Max HP, -10% penyembuhan. Kutukan bergabung.', false],
];

export const SYNERGIES = SYNERGY_SOURCE.map(([id, name, requires, mods, desc, beneficial]) => ({
  id,
  name,
  requires,
  mods,
  desc,
  beneficial,
}));

export const SYNERGY_BY_ID = Object.fromEntries(SYNERGIES.map((s) => [s.id, s]));

export function synergyIdsFor(itemIds = []) {
  const owned = new Set(itemIds);
  return SYNERGIES.filter((synergy) => synergy.requires.every((id) => owned.has(id))).map((s) => s.id);
}

// ── rituals ─────────────────────────────────────────────────────────────────
export const RITUALS = [
  {
    id: 'ritual_untouched',
    name: 'Ritual of the Untouched Vow',
    itemId: 'ritual_bone_dice',
    requirement: { type: 'kills_no_damage', target: 10 },
    desc: 'Bunuh 10 musuh tanpa menerima damage. Aktif selama 30 detik.',
    duration: 30,
    effect: { damage: 0.2, crit: 0.1 },
    effectText: '+20% damage, +10% kritikal',
  },
  {
    id: 'ritual_elite_charge',
    name: 'Ritual of the Elite Hunt',
    itemId: 'ritual_mask_echo',
    requirement: { type: 'elite_down', target: 2 },
    desc: 'Kalahkan 2 elite. Aktif selama 45 detik.',
    duration: 45,
    effect: { damage: 0.15, speed: 0.1 },
    effectText: '+15% damage, +10% kecepatan',
  },
  {
    id: 'ritual_boss_oath',
    name: 'Ritual of the Broken Crown',
    itemId: 'ritual_ash_censer',
    requirement: { type: 'boss_down', target: 1 },
    desc: 'Kalahkan bos. Aktif hingga siklus berakhir.',
    duration: 9999,
    effect: { damage: 0.18, armor: 0.08 },
    effectText: '+18% damage, +8% armor',
  },
  {
    id: 'ritual_elemental',
    name: 'Ritual of Three Elements',
    itemId: 'elemental_ember_heart',
    requirement: { type: 'spell_cast', target: 3 },
    desc: 'Gunakan 3 kemampuan sihir. Aktif selama 25 detik.',
    duration: 25,
    effect: { spellPower: 0.25 },
    effectText: '+25% kekuatan sihir',
  },
  {
    id: 'ritual_cursed_ground',
    name: 'Ritual of Cursed Ground',
    itemId: 'void_relic_rift',
    requirement: { type: 'cursed_zone', target: 1 },
    desc: 'Masuki zona terkutuk. Aktif selama siklus ini.',
    duration: 9999,
    effect: { speed: 0.12, dodge: 0.1 },
    effectText: '+12% kecepatan, +10% dodge',
  },
  {
    id: 'ritual_survivor',
    name: 'Ritual of the Last Breath',
    itemId: 'soulbound_ring',
    requirement: { type: 'low_hp_survive', target: 1 },
    desc: 'Bertahan di bawah 20% HP selama 5 detik. Aktif 20 detik.',
    duration: 20,
    effect: { armor: 0.2, heal: 0.2 },
    effectText: '+20% armor, +20% penyembuhan',
  },
  {
    id: 'ritual_executioner',
    name: 'Ritual of Execution',
    itemId: 'bloodbound_sigil',
    requirement: { type: 'kills_total', target: 25 },
    desc: 'Bunuh 25 musuh. Aktif selama 40 detik.',
    duration: 40,
    effect: { damage: 0.12, lifesteal: 0.06 },
    effectText: '+12% damage, +6% lifesteal',
  },
  {
    id: 'ritual_coward',
    name: 'Ritual of the Coward\'s Step',
    itemId: 'void_boots',
    requirement: { type: 'dodge_damage', target: 3 },
    desc: 'Hindari 3 serangan dengan dash. Aktif selama 30 detik.',
    duration: 30,
    effect: { dodge: 0.15, speed: 0.1 },
    effectText: '+15% dodge, +10% kecepatan',
  },
];

export const RITUAL_BY_ID = Object.fromEntries(RITUALS.map((r) => [r.id, r]));

/** Advance every owned ritual with one gameplay event. */
export function advanceRituals(run, event = {}) {
  if (!run?.rituals) return [];
  const completed = [];
  for (const ritual of RITUALS) {
    const state = run.rituals[ritual.id];
    if (!state || state.completed) continue;
    const req = ritual.requirement;
    let value = 0;
    if (req.type === 'kills_no_damage' && event.type === 'enemyDown') value = 1;
    else if (req.type === 'elite_down' && event.type === 'eliteDown') value = 1;
    else if (req.type === 'boss_down' && event.type === 'bossDown') value = 1;
    else if (req.type === 'spell_cast' && event.type === 'spellCast') value = 1;
    else if (req.type === 'cursed_zone' && event.type === 'zoneEnter' && event.cursed) value = 1;
    else if (req.type === 'low_hp_survive' && event.type === 'lowHpWake') value = 1;
    else if (req.type === 'kills_total' && event.type === 'enemyDown') value = 1;
    else if (req.type === 'dodge_damage' && event.type === 'dodge') value = 1;
    if (event.type === 'damageTaken' && req.type === 'kills_no_damage') {
      state.progress = 0;
      continue;
    }
    if (!value) continue;
    state.progress = (state.progress || 0) + value;
    if (state.progress >= req.target) {
      state.completed = true;
      state.timer = ritual.duration;
      completed.push(ritual.id);
    }
  }
  return completed;
}

export function ritualTotals(run) {
  const totals = Object.fromEntries(MOD_KEYS.map((key) => [key, 0]));
  if (!run?.rituals) return totals;
  for (const [id, state] of Object.entries(run.rituals)) {
    if (!state?.completed || (state.timer ?? 0) <= 0) continue;
    const ritual = RITUAL_BY_ID[id];
    if (!ritual) continue;
    for (const [key, value] of Object.entries(ritual.effect || {})) {
      if (key in totals) totals[key] += Number(value) || 0;
    }
  }
  return totals;
}

export function tickRituals(run, dt) {
  if (!run?.rituals) return;
  for (const state of Object.values(run.rituals)) {
    if (state.completed && state.timer > 0) state.timer = Math.max(0, state.timer - dt);
  }
}

// ── cycle modifiers ─────────────────────────────────────────────────────────
export const LABYRINTH_MODIFIERS = [
  { id: 'blessed_weapons', name: 'Blessed Weapons', kind: 'positive', desc: 'Damage senjata +18%.', mods: { damage: 0.18 } },
  { id: 'arcane_flow', name: 'Arcane Flow', kind: 'positive', desc: 'Regen mana +30% dan biaya mantra -10%.', mods: { manaRegen: 0.3, manaCost: -0.1 } },
  { id: 'guardian_spirit', name: 'Guardian Spirit', kind: 'positive', desc: 'Armor +15%.', mods: { armor: 0.15 } },
  { id: 'fortunes_favor', name: 'Fortune\'s Favor', kind: 'positive', desc: 'Pilihan hadiah ekstra di chamber.', mods: { rewardExtra: 1 } },
  { id: 'swift_steps', name: 'Swift Steps', kind: 'positive', desc: 'Kecepatan gerak +15%.', mods: { speed: 0.15 } },
  { id: 'broken_armor', name: 'Broken Armor', kind: 'negative', desc: 'Armor -20%.', mods: { armor: -0.2 } },
  { id: 'mana_scarcity', name: 'Mana Scarcity', kind: 'negative', desc: 'Biaya mantra +25%.', mods: { manaCost: 0.25 } },
  { id: 'cursed_ground', name: 'Cursed Ground', kind: 'negative', desc: 'Arena dipenuhi bahaya tambahan.', mods: { hazards: 1 } },
  { id: 'blood_tax', name: 'Blood Tax', kind: 'negative', desc: 'Penyembuhan -25%.', mods: { heal: -0.25 } },
  { id: 'relentless_hunt', name: 'Relentless Hunt', kind: 'negative', desc: 'Musuh 12% lebih cepat dan agresif.', mods: { enemySpeed: 0.12 } },
  { id: 'unstable_reality', name: 'Unstable Reality', kind: 'negative', desc: 'Bahaya arena bergerak acak.', mods: { hazards: 2 } },
];

export const LABYRINTH_MODIFIER_BY_ID = Object.fromEntries(LABYRINTH_MODIFIERS.map((m) => [m.id, m]));

export function rollModifiers(run, count) {
  const n = Math.max(0, count | 0);
  if (!n) return [];
  const positive = LABYRINTH_MODIFIERS.filter((m) => m.kind === 'positive');
  const negative = LABYRINTH_MODIFIERS.filter((m) => m.kind === 'negative');
  const chosen = [];
  for (let i = 0; i < n; i += 1) {
    const source = i % 2 === 0 ? positive : negative;
    const candidates = source.filter((m) => !chosen.includes(m.id));
    if (!candidates.length) continue;
    chosen.push(candidates[Math.floor(rand(run) * candidates.length) % candidates.length].id);
  }
  return chosen;
}

// ── arenas ─────────────────────────────────────────────────────────────────
const ARENA_VARIANTS = [
  {
    name: 'Ruang Terbuka',
    platforms: [
      { x: 0, y: 470, w: 1400, h: 70, kind: 'floor' },
      { x: 220, y: 366, w: 210, h: 22 },
      { x: 760, y: 330, w: 200, h: 22 },
    ],
  },
  {
    name: 'Tiang Ganda',
    platforms: [
      { x: 0, y: 470, w: 1400, h: 70, kind: 'floor' },
      { x: 160, y: 352, w: 180, h: 22 },
      { x: 600, y: 300, w: 200, h: 22 },
      { x: 1040, y: 360, w: 180, h: 22 },
    ],
  },
  {
    name: 'Jurang Tengah',
    platforms: [
      { x: 0, y: 470, w: 470, h: 70, kind: 'floor' },
      { x: 930, y: 470, w: 470, h: 70, kind: 'floor' },
      { x: 470, y: 448, w: 460, h: 22 },
      { x: 300, y: 330, w: 190, h: 22 },
      { x: 910, y: 330, w: 190, h: 22 },
    ],
  },
  {
    name: 'Tangga Tulang',
    platforms: [
      { x: 0, y: 470, w: 1400, h: 70, kind: 'floor' },
      { x: 120, y: 396, w: 170, h: 22 },
      { x: 380, y: 330, w: 170, h: 22 },
      { x: 660, y: 270, w: 170, h: 22 },
      { x: 960, y: 330, w: 170, h: 22 },
    ],
  },
];

export function arenaForRun(run) {
  const zone = LABYRINTH_ZONE_BY_ID[run?.zoneId] || LABYRINTH_ZONES[0];
  const variant = ARENA_VARIANTS[((Number(run?.cycle) || 1) + (Number(run?.arenaVariant) || 0)) % ARENA_VARIANTS.length];
  const scaling = cycleScaling(run?.cycle || 1);
  const hazards = [];
  if (scaling.hazardChance > 0 && (run.modeId === 'frozen' || run.modeId === 'chaos' || (run.cycle || 1) >= 6)) {
    hazards.push({
      type: 'saw',
      x: 640,
      y: 414,
      w: 56,
      h: 56,
      dmg: Math.round(10 + (run.cycle || 1) * 0.6),
      range: 380,
      originX: 640,
      speed: 100 + (run.cycle || 1) * 2,
    });
    if ((run.cycle || 1) >= 12) {
      hazards.push({
        type: 'wind',
        x: 0,
        y: 220,
        w: 1400,
        h: 120,
        force: (run.cycle || 1) % 2 === 0 ? -260 : 260,
      });
    }
  }
  return {
    id: `lab_${run?.cycle || 1}`,
    index: 0,
    name: `${zone.localName} · Siklus ${run?.cycle || 1}`,
    subtitle: `${variant.name} · ${zone.families}`,
    spawn: { x: 120, y: 470 - 46 },
    platforms: variant.platforms.map((platform) => ({ ...platform })),
    gates: [],
    enemies: [],
    hazards,
    palette: { ...zone.palette },
    biome: 'labyrinth',
    labyrinth: true,
    zoneId: zone.id,
    lore: zone.lore,
    music: zone.music,
    secret: false,
    collectibles: [],
  };
}

// ── encounters (pre-computed, deterministic) ───────────────────────────────
export function buildWavePlan(run) {
  const cycle = Math.max(1, run?.cycle || 1);
  const mode = LABYRINTH_MODE_BY_ID[run?.modeId] || LABYRINTH_MODES[0];
  const scaling = cycleScaling(cycle);
  const zone = LABYRINTH_ZONE_BY_ID[run.zoneId] || LABYRINTH_ZONES[0];
  const roster = enemiesForZone(zone.id, cycle);
  const combatWaves = 3 + Math.min(3, Math.floor((cycle - 1) / 10));
  const waves = [];
  for (let i = 0; i < combatWaves; i += 1) {
    const isEliteWave = i === combatWaves - 1 || (mode.rules.bossEveryTwoWaves && i === 1);
    const eliteCount = cycle >= 31 && i > 0 ? 2 : 1;
    const count = i === 0 ? 2 : i === 1 ? 2 + (cycle >= 16 ? 1 : 0) : 2;
    const enemies = [];
    for (let n = 0; n < count; n += 1) {
      const source = roster[(Math.floor(rand(run) * roster.length) + n) % roster.length];
      const elite = isEliteWave && n < eliteCount && source.eliteEligible;
      const tier = elite ? eliteTierForCycle(cycle) : null;
      enemies.push({
        enemyId: source.id,
        name: source.name,
        type: source.archetype,
        variant: source.variant,
        elite: !!elite,
        eliteRank: tier?.rank || null,
        hpScale: (tier?.hp || 1) * scaling.hp * (mode.rules.partyScaling && run.partySize > 1 ? 1 : 1),
        dmgScale: (tier?.dmg || 1) * scaling.dmg,
        speedScale: scaling.speed * (mode.rules.speed || 1),
      });
    }
    waves.push({
      index: i + 1,
      kind: isEliteWave ? 'elite' : 'combat',
      label: isEliteWave ? 'Elite encounter' : `Wave ${i + 1}`,
      enemies,
    });
  }
  // The boss wave is always last so wave numbering never shifts mid-run.
  const boss = pickBoss(run);
  waves.push({
    index: waves.length + 1,
    kind: 'boss',
    label: 'Boss encounter',
    enemies: [],
    boss,
  });
  return {
    cycle,
    zoneId: zone.id,
    zoneName: zone.localName,
    waves,
    boss,
    scaling,
    modifiers: run.modifiers || [],
    generatedAt: cycle,
  };
}

/** Ensure the next two cycle plans exist so wave starts never compute mid-fight. */
export function ensurePlans(run, depth = 2) {
  if (!Array.isArray(run.planQueue)) run.planQueue = [];
  const restoreCycle = run.cycle || 1;
  while (run.planQueue.length < depth) {
    const targetCycle = (run.planCycle || restoreCycle) + run.planQueue.length;
    run.cycle = targetCycle;
    const zonePool = zonePoolForCycle(run);
    run.zoneId = pick(run, zonePool)?.id || LABYRINTH_ZONES[0].id;
    const baseCount = cycleScaling(targetCycle).modifierCount + (run.modeId === 'nightmare' ? 1 : 0);
    run.modifiers = rollModifiers(run, baseCount);
    run.planQueue.push(buildWavePlan(run));
  }
  run.cycle = restoreCycle;
  run.zoneId = run.planQueue[0]?.zoneId || run.zoneId;
  run.modifiers = run.planQueue[0]?.modifiers || run.modifiers || [];
  return run.planQueue;
}

// ── Wave Director ───────────────────────────────────────────────────────────
export class WaveDirector {
  constructor(run) {
    this.run = run;
    this.waveIndex = -1;
    this.engaged = false;
    this.cycleCleared = false;
  }

  get plan() {
    return this.run?.planQueue?.[0] || null;
  }

  get wave() {
    const plan = this.plan;
    return plan?.waves?.[this.waveIndex] || null;
  }

  get totalWaves() {
    return this.plan?.waves?.length || 0;
  }

  begin() {
    if (!this.run.planQueue?.length) ensurePlans(this.run, 1);
    this.waveIndex = -1;
    this.cycleCleared = false;
    return this.plan;
  }

  /** Spawn descriptors for the current wave. Never mutates the plan. */
  spawnWave() {
    const plan = this.plan;
    if (!plan) return { enemies: [], boss: null };
    if (this.waveIndex < 0) this.waveIndex = 0;
    const wave = plan.waves[this.waveIndex];
    if (!wave) return { enemies: [], boss: null };
    this.engaged = true;
    return {
      cycle: plan.cycle,
      index: wave.index,
      total: plan.waves.length,
      kind: wave.kind,
      label: wave.label,
      enemies: wave.enemies.map((enemy) => ({ ...enemy })),
      boss: wave.boss ? { kind: wave.boss.kind, boss: wave.boss, overrides: bossOverrides(wave.boss, plan.cycle, plan.scaling, LABYRINTH_MODE_BY_ID[this.run.modeId]) } : null,
    };
  }

  /** Returns 'wave' when more waves remain, 'cycle' when the boss is down. */
  completeWave() {
    const plan = this.plan;
    if (!plan) return 'cycle';
    const wave = plan.waves[this.waveIndex];
    this.engaged = false;
    if (wave?.kind === 'boss') {
      this.cycleCleared = true;
      return 'cycle';
    }
    this.waveIndex += 1;
    if (this.waveIndex >= plan.waves.length) {
      this.cycleCleared = true;
      return 'cycle';
    }
    return 'wave';
  }

  /** Move to the next pre-computed cycle and discard the finished plan. */
  advanceCycle() {
    if (!this.run.planQueue?.length) return null;
    this.run.planQueue.shift();
    this.run.planCycle = (this.run.planCycle || this.run.cycle) + 1;
    this.run.cycle = this.run.planCycle;
    ensurePlans(this.run, 2);
    this.waveIndex = -1;
    this.cycleCleared = false;
    return this.plan;
  }

  toJSON() {
    return { waveIndex: this.waveIndex, engaged: this.engaged, cycleCleared: this.cycleCleared };
  }
}

// ── rewards ────────────────────────────────────────────────────────────────
const REWARD_KINDS = ['item', 'weapon', 'armor', 'ritual', 'relic', 'consumable', 'currency', 'material', 'blessing'];

export function rewardChoices(run, count = 3) {
  const plan = run?.planQueue?.[0];
  const luck = (LABYRINTH_MODE_BY_ID[run?.modeId]?.rules?.rewardLuck || 0) + (run?.luck || 0);
  const extra = (run?.modifierMods?.rewardExtra || 0);
  const n = Math.max(1, count + extra);
  const used = new Set();
  const choices = [];
  const sourceItems = LABYRINTH_ITEMS.filter((item) => !run.items?.includes(item.id));
  for (let i = 0; i < n; i += 1) {
    let attempts = 0;
    let reward = null;
    while (!reward && attempts < 24) {
      attempts += 1;
      const roll = rand(run) + luck * 0.35;
      const kind = roll > 0.86 ? 'ritual' : roll > 0.72 ? 'relic' : roll > 0.5 ? (rand(run) > 0.5 ? 'weapon' : 'armor') : REWARD_KINDS[Math.floor(rand(run) * REWARD_KINDS.length)];
      if (kind === 'item' || kind === 'relic' || kind === 'ritual') {
        const pool = sourceItems.filter((item) => !used.has(item.id));
        if (!pool.length) continue;
        const item = pool[Math.floor(rand(run) * pool.length) % pool.length];
        used.add(item.id);
        reward = {
          id: `reward_${i}_${item.id}`,
          type: 'item',
          itemId: item.id,
          name: item.name,
          desc: itemDescription(item),
          lore: item.lore,
          curse: item.curse,
          rarity: item.rarity,
          color: item.color,
          category: item.category,
        };
      } else if (kind === 'weapon') {
        reward = { id: `reward_${i}_ash`, type: 'currency', value: 28 + (plan?.cycle || 1) * 4, name: 'Abu Labyrinth', desc: 'Abu untuk Warung Abu dan upgrade.' };
      } else if (kind === 'armor') {
        reward = { id: `reward_${i}_heal`, type: 'heal', value: 0.35, name: 'Perapian Tersembunyi', desc: 'Pulihkan 35% HP maksimum dan isi ulang 1 flask.' };
      } else if (kind === 'consumable') {
        reward = { id: `reward_${i}_flask`, type: 'flask', value: 1, name: 'Tegukan Cadangan', desc: '+1 muatan flask untuk run ini.' };
      } else if (kind === 'blessing') {
        reward = { id: `reward_${i}_blessing`, type: 'blessing', value: 1, name: 'Berkah Siklus', desc: 'Berkah acak permanen untuk run ini.' };
      } else if (kind === 'material') {
        reward = { id: `reward_${i}_material`, type: 'material', value: 2, name: 'Pecahan Ritual', desc: 'Mata uang untuk koleksi dan mastery.' };
      } else {
        reward = { id: `reward_${i}_echo`, type: 'currency', value: 18 + (plan?.cycle || 1) * 3, name: 'Debu Astral', desc: 'Debu untuk hadiah dan mastery.' };
      }
    }
    if (reward) choices.push(reward);
  }
  if (rand(run) < 0.45 || run.modeId === 'cursed') {
    choices.push(cursedBargain(run));
  }
  return choices;
}

export function cursedBargain(run) {
  const options = [
    { id: 'bargain_damage', name: 'Bargain: Blood Edge', gain: { damage: 0.2 }, loss: { maxHp: -0.1 }, desc: '+20% damage, -10% Max HP.' },
    { id: 'bargain_spell', name: 'Bargain: Hollow Word', gain: { spellPower: 0.18 }, loss: { manaCost: 0.2 }, desc: '+18% kekuatan sihir, +20% biaya mana.' },
    { id: 'bargain_crit', name: 'Bargain: Gambler\'s Eye', gain: { crit: 0.2 }, loss: { heal: -0.2 }, desc: '+20% kritikal, -20% penyembuhan.' },
    { id: 'bargain_speed', name: 'Bargain: Ash Step', gain: { speed: 0.25 }, loss: { armor: -0.2 }, desc: '+25% kecepatan, -20% armor.' },
  ];
  return { ...options[Math.floor(rand(run) * options.length) % options.length], type: 'bargain', cursed: true, color: '#b07be8' };
}

/** True when a reward is an item the player can take. */
export function isItemReward(reward) {
  return reward?.type === 'item' && !!LABYRINTH_ITEM_BY_ID[reward.itemId];
}

// ── run state ──────────────────────────────────────────────────────────────
export function createLabyrinthRun(options = {}) {
  const seed = typeof options.seed === 'number' ? options.seed >>> 0 : hashSeed(options.seedText || Date.now());
  const modeId = LABYRINTH_MODE_BY_ID[options.modeId] ? options.modeId : 'standard';
  const run = {
    version: 1,
    seed,
    rng: seed,
    modeId,
    difficulty: options.difficulty || 'normal',
    partySize: clamp(options.partySize || 1, 1, 4),
    cycle: 1,
    planCycle: 1,
    planQueue: [],
    zoneId: null,
    forceBoss: true,
    items: [],
    curses: [],
    rituals: {},
    synergies: [],
    blessings: [],
    stats: {
      startedAt: Date.now(),
      timeSurvived: 0,
      damageDealt: 0,
      damageReceived: 0,
      enemiesDefeated: 0,
      elitesDefeated: 0,
      bossesDefeated: 0,
      itemsCollected: 0,
      cursesAccepted: 0,
      revives: 0,
      highestCycle: 1,
      zonesVisited: [],
      bans: 0,
    },
    history: { zones: [], bosses: [], items: [] },
    modifiers: [],
    modifierMods: {},
    checkpointed: false,
    eligible: true,
    checkpointCycle: 0,
    ended: false,
    victory: false,
    context: {},
  };
  if (modeId === 'cursed') run.cursesAcceptedByMode = 0;
  run.rng = (seed ^ hashSeed(modeId)) >>> 0 || seed;
  ensurePlans(run, 2);
  run.cycle = 1;
  run.planCycle = 1;
  run.zoneId = run.planQueue[0].zoneId;
  run.modifiers = run.planQueue[0].modifiers;
  return run;
}

export function applyItemToRun(run, reward) {
  if (!run || !reward) return false;
  if (isItemReward(reward)) {
    if (run.items.includes(reward.itemId)) return false;
    run.items.push(reward.itemId);
    run.stats.itemsCollected += 1;
    if (!run.history.items.includes(reward.itemId)) run.history.items.push(reward.itemId);
    const item = LABYRINTH_ITEM_BY_ID[reward.itemId];
    if (item?.ritual && !run.rituals[item.id]) {
      // Ritual items do not auto-activate; the player must meet the condition.
      const ritual = RITUALS.find((entry) => entry.id === `ritual_${item.id.replace('ritual_', '')}`)
        || RITUALS.find((entry) => entry.itemId === item.id);
      if (ritual) run.rituals[ritual.id] = { progress: 0, completed: false, timer: 0 };
    }
    run.synergies = synergyIdsFor(run.items);
    return true;
  }
  if (reward.type === 'bargain') {
    run.curses.push(reward.id);
    run.cursesAcceptedByMode = (run.cursesAcceptedByMode || 0) + 1;
    run.stats.cursesAccepted += 1;
    run.bargainMods = run.bargainMods || {};
    for (const [key, value] of Object.entries(reward.gain || {})) {
      run.bargainMods[key] = (run.bargainMods[key] || 0) + value;
    }
    for (const [key, value] of Object.entries(reward.loss || {})) {
      run.bargainMods[key] = (run.bargainMods[key] || 0) + value;
    }
    return true;
  }
  return false;
}

export function combineTotals(run) {
  const item = itemTotals(run?.items || [], run?.synergies || []);
  const ritual = ritualTotals(run);
  const mods = {};
  for (const source of [item, ritual, run?.bargainMods || {}]) {
    for (const [key, value] of Object.entries(source)) {
      if (typeof value !== 'number') continue;
      mods[key] = (mods[key] || 0) + value;
    }
  }
  for (const id of run?.modifiers || []) {
    const modifier = LABYRINTH_MODIFIER_BY_ID[id];
    if (!modifier) continue;
    for (const [key, value] of Object.entries(modifier.mods || {})) {
      if (typeof value !== 'number') continue;
      mods[key] = (mods[key] || 0) + value;
    }
  }
  mods.damage = clamp(mods.damage, -0.75, 4);
  mods.maxHp = clamp(mods.maxHp, -0.6, 3);
  mods.speed = clamp(mods.speed, -0.4, 1.5);
  mods.armor = clamp(mods.armor, -0.6, 0.8);
  mods.heal = clamp(mods.heal, -0.8, 3);
  mods.crit = clamp(mods.crit, 0, 0.95);
  return mods;
}

/** Snapshot the player's base stats once so loadouts can recompute cleanly. */
export function captureBaseStats(game) {
  const p = game.player;
  return {
    maxHp: p.maxHp,
    maxFlasks: p.maxFlasks,
    damageMult: p.damageMult,
    speedMult: p.speedMult,
    critChance: p.critChance || 0,
    incomingMult: p.incomingMult || 1,
    healMult: p.healMult || 1,
  };
}

/**
 * Apply the aggregate loadout to a live AshenGame. Damage/heal/armor/crit are
 * consumed by core.js; spells and mana are tracked for the HUD and future
 * casters, but never change campaign balance because they only exist in runs.
 */
export function applyLoadoutToGame(run, game, base) {
  if (!run || !game) return null;
  const totals = combineTotals(run);
  const p = game.player;
  const origin = base || captureBaseStats(game);
  p.maxHp = Math.max(1, Math.round(origin.maxHp * (1 + totals.maxHp)));
  p.hp = Math.min(p.hp, p.maxHp);
  p.maxFlasks = Math.max(1, Math.round(origin.maxFlasks + (totals.flasks || 0)));
  p.flasks = Math.min(p.flasks, p.maxFlasks);
  p.damageMult = origin.damageMult * (1 + totals.damage + (totals.spellPower || 0) * 0.5);
  p.speedMult = origin.speedMult * (1 + totals.speed);
  p.critChance = clamp((origin.critChance || 0) + totals.crit, 0, 0.95);
  p.incomingMult = Math.max(0.15, (origin.incomingMult || 1) * (1 - totals.armor));
  p.healMult = Math.max(0.1, (origin.healMult || 1) * (1 + totals.heal));
  p.labTotals = totals;
  return totals;
}

// ── statistics, mastery, and durable progress ──────────────────────────────
export const LABYRINTH_CURRENCIES = [
  { id: 'shards', name: 'Labyrinth Shards', localName: 'Pecahan Labyrinth', color: '#d0a45a' },
  { id: 'cursedEssence', name: 'Cursed Essence', localName: 'Esensi Terkutuk', color: '#b07be8' },
  { id: 'ancientSigils', name: 'Ancient Sigils', localName: 'Sigil Purba', color: '#e0b45f' },
  { id: 'ritualFragments', name: 'Ritual Fragments', localName: 'Pecahan Ritual', color: '#55a630' },
  { id: 'bossSouls', name: 'Boss Souls', localName: 'Jiwa Bos', color: '#c44a5a' },
  { id: 'astralDust', name: 'Astral Dust', localName: 'Debu Astral', color: '#4f9fc4' },
];

export const MASTERY_TRACKS = [
  { id: 'rank', name: 'Labyrinth Rank', desc: 'Naik dari total siklus dan bos.' },
  { id: 'bossMastery', name: 'Boss Mastery', desc: 'Setiap bos yang dikalahkan tercatat.' },
  { id: 'eliteHunter', name: 'Elite Hunter', desc: 'Bunuh elite di semua peringkat.' },
  { id: 'ritualCollector', name: 'Ritual Collector', desc: 'Aktifkan setiap jenis ritual.' },
  { id: 'endlessSurvivor', name: 'Endless Survivor', desc: 'Capai siklus terdalam.' },
  { id: 'cursedIndex', name: 'Cursed Artifact Index', desc: 'Temukan semua barang terkutuk.' },
  { id: 'zoneDiscovery', name: 'Zone Discovery', desc: 'Jelajahi 20 zona labyrinth.' },
  { id: 'multiplayerChampion', name: 'Multiplayer Champion', desc: 'Selesaikan siklus dalam co-op.' },
];

export const LABYRINTH_RANKS = [
  { rank: 1, name: 'Ashwalker', xp: 0 },
  { rank: 2, name: 'Crypt Runner', xp: 250 },
  { rank: 3, name: 'Vow Seeker', xp: 700 },
  { rank: 4, name: 'Cycle Breaker', xp: 1500 },
  { rank: 5, name: 'Hollow Survivor', xp: 3000 },
  { rank: 6, name: 'Curse Bearer', xp: 5500 },
  { rank: 7, name: 'Ancient Delver', xp: 9000 },
  { rank: 8, name: 'Labyrinth Lord', xp: 14000 },
  { rank: 9, name: 'Eternal Witness', xp: 22000 },
  { rank: 10, name: 'Beyond the Veil', xp: 35000 },
];

export function rankForXp(xp) {
  const value = Math.max(0, Number(xp) || 0);
  let rank = LABYRINTH_RANKS[0];
  for (const entry of LABYRINTH_RANKS) if (value >= entry.xp) rank = entry;
  return rank;
}

export function defaultLabyrinthProgress() {
  return {
    version: LABYRINTH_PROGRESS_VERSION,
    best: { cycle: 0, bosses: 0, enemies: 0, time: 0, damage: 0, partySize: 1 },
    totals: { runs: 0, bosses: 0, enemies: 0, elites: 0, time: 0, damage: 0, items: 0, curses: 0, revives: 0, cycles: 0 },
    history: [],
    discovery: { zones: [], bosses: [], items: [], synergies: [], rituals: [] },
    mastery: { xp: 0, bossMastery: {}, eliteHunter: 0, ritualCollector: 0, lowHpSaves: 0 },
    currencies: { shards: 0, cursedEssence: 0, ancientSigils: 0, ritualFragments: 0, bossSouls: 0, astralDust: 0 },
    unlocks: { modes: ['standard', 'cursed', 'blood', 'arcane', 'colossus', 'nightmare', 'frozen', 'chaos', 'ritual', 'multiplayer'] },
    checkpoint: { runs: 0, resumed: 0 },
    coop: { sessions: 0, wins: 0, revives: 0, contribution: 0 },
  };
}

export function sanitizeLabyrinthProgress(raw) {
  const base = defaultLabyrinthProgress();
  if (!raw || typeof raw !== 'object') return base;
  const number = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Math.max(0, Math.round(Number(value))) : fallback);
  const strings = (value) => (Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === 'string'))] : []);
  const best = raw.best && typeof raw.best === 'object' ? raw.best : {};
  base.best = {
    cycle: number(best.cycle),
    bosses: number(best.bosses),
    enemies: number(best.enemies),
    time: number(best.time),
    damage: number(best.damage),
    partySize: clamp(number(best.partySize, 1), 1, 4),
  };
  const totals = raw.totals && typeof raw.totals === 'object' ? raw.totals : {};
  for (const key of Object.keys(base.totals)) base.totals[key] = number(totals[key]);
  base.history = Array.isArray(raw.history)
    ? raw.history
        .filter((entry) => entry && typeof entry === 'object' && Number(entry.cycle) > 0)
        .slice(0, 20)
        .map((entry) => ({
          cycle: number(entry.cycle),
          bosses: number(entry.bosses),
          enemies: number(entry.enemies),
          time: number(entry.time),
          partySize: clamp(number(entry.partySize, 1), 1, 4),
          modeId: typeof entry.modeId === 'string' ? entry.modeId : 'standard',
          zoneId: typeof entry.zoneId === 'string' ? entry.zoneId : '',
          endedAt: number(entry.endedAt),
          checkpointed: !!entry.checkpointed,
        }))
    : [];
  base.discovery = {
    zones: strings(raw.discovery?.zones).filter((id) => LABYRINTH_ZONE_BY_ID[id]),
    bosses: strings(raw.discovery?.bosses).filter((id) => LABYRINTH_BOSS_BY_ID[id]),
    items: strings(raw.discovery?.items).filter((id) => LABYRINTH_ITEM_BY_ID[id]),
    synergies: strings(raw.discovery?.synergies).filter((id) => SYNERGY_BY_ID[id]),
    rituals: strings(raw.discovery?.rituals).filter((id) => RITUAL_BY_ID[id]),
  };
  const mastery = raw.mastery && typeof raw.mastery === 'object' ? raw.mastery : {};
  base.mastery.xp = number(mastery.xp);
  base.mastery.eliteHunter = number(mastery.eliteHunter);
  base.mastery.ritualCollector = number(mastery.ritualCollector);
  base.mastery.lowHpSaves = number(mastery.lowHpSaves);
  base.mastery.bossMastery = {};
  if (mastery.bossMastery && typeof mastery.bossMastery === 'object') {
    for (const [id, value] of Object.entries(mastery.bossMastery)) {
      if (LABYRINTH_BOSS_BY_ID[id]) base.mastery.bossMastery[id] = number(value);
    }
  }
  const currencies = raw.currencies && typeof raw.currencies === 'object' ? raw.currencies : {};
  for (const key of Object.keys(base.currencies)) base.currencies[key] = number(currencies[key]);
  base.unlocks.modes = strings(raw.unlocks?.modes).filter((id) => LABYRINTH_MODE_BY_ID[id]);
  if (!base.unlocks.modes.includes('standard')) base.unlocks.modes.unshift('standard');
  base.checkpoint = {
    runs: number(raw.checkpoint?.runs),
    resumed: number(raw.checkpoint?.resumed),
  };
  base.coop = {
    sessions: number(raw.coop?.sessions),
    wins: number(raw.coop?.wins),
    revives: number(raw.coop?.revives),
    contribution: number(raw.coop?.contribution),
  };
  // Preserve unknown top-level fields so older builds never lose data.
  for (const [key, value] of Object.entries(raw)) {
    if (!(key in base)) base[key] = value;
  }
  return base;
}

export function runSummary(run) {
  if (!run) return null;
  const xp = Math.round((run.stats.bossesDefeated || 0) * 120 + (run.stats.elitesDefeated || 0) * 25 + (run.cycle || 1) * 40 + (run.stats.enemiesDefeated || 0) * 2);
  return {
    cycle: run.cycle,
    zoneId: run.zoneId,
    modeId: run.modeId,
    time: Math.round(run.stats.timeSurvived),
    bosses: run.stats.bossesDefeated,
    elites: run.stats.elitesDefeated,
    enemies: run.stats.enemiesDefeated,
    damageDealt: Math.round(run.stats.damageDealt),
    damageReceived: Math.round(run.stats.damageReceived),
    items: run.stats.itemsCollected,
    curses: run.stats.cursesAccepted,
    synergies: run.synergies.length,
    partySize: run.partySize,
    checkpointed: !!run.checkpointed,
    eligible: run.eligible !== false,
    xp,
  };
}

/** Fold a finished run into durable progress (pure return, caller saves it). */
export function recordLabyrinthRun(rawProgress, run) {
  const progress = sanitizeLabyrinthProgress(rawProgress);
  if (!run) return progress;
  const summary = runSummary(run);
  progress.totals.runs += 1;
  progress.totals.bosses += summary.bosses;
  progress.totals.elites += summary.elites;
  progress.totals.enemies += summary.enemies;
  progress.totals.time += summary.time;
  progress.totals.damage += summary.damageDealt;
  progress.totals.items += summary.items;
  progress.totals.curses += summary.curses;
  progress.totals.cycles += Math.max(1, summary.cycle - 1);
  progress.mastery.xp += summary.xp;
  progress.best.cycle = Math.max(progress.best.cycle, summary.cycle);
  progress.best.bosses = Math.max(progress.best.bosses, summary.bosses);
  progress.best.enemies = Math.max(progress.best.enemies, summary.enemies);
  progress.best.time = Math.max(progress.best.time, summary.time);
  progress.best.damage = Math.max(progress.best.damage, summary.damageDealt);
  progress.best.partySize = Math.max(progress.best.partySize, summary.partySize);
  progress.history.unshift({
    cycle: summary.cycle,
    bosses: summary.bosses,
    enemies: summary.enemies,
    time: summary.time,
    partySize: summary.partySize,
    modeId: summary.modeId,
    zoneId: summary.zoneId,
    endedAt: Date.now(),
    checkpointed: summary.checkpointed,
  });
  progress.history = progress.history.slice(0, 20);
  const discover = (list, id) => {
    if (id && !list.includes(id)) list.push(id);
  };
  discover(progress.discovery.zones, run.zoneId);
  for (const id of run.history?.zones || []) discover(progress.discovery.zones, id);
  for (const id of run.history?.bosses || []) {
    discover(progress.discovery.bosses, id);
    progress.mastery.bossMastery[id] = (progress.mastery.bossMastery[id] || 0) + 1;
  }
  for (const id of run.items || []) discover(progress.discovery.items, id);
  for (const id of run.synergies || []) discover(progress.discovery.synergies, id);
  for (const id of Object.keys(run.rituals || {})) discover(progress.discovery.rituals, id);
  progress.currencies.shards += Math.round(summary.cycle * 6 + summary.bosses * 20);
  progress.currencies.cursedEssence += summary.curses * 8;
  progress.currencies.ancientSigils += Math.round(summary.bosses * 1.5);
  progress.currencies.ritualFragments += summary.items;
  progress.currencies.bossSouls += summary.bosses;
  progress.currencies.astralDust += Math.round(summary.enemies * 0.4);
  progress.coop.sessions += summary.partySize > 1 ? 1 : 0;
  progress.coop.wins += summary.partySize > 1 && summary.cycle > 1 ? 1 : 0;
  progress.coop.revives += run.stats.revives || 0;
  return progress;
}

// ── checkpoints and resumable runs ─────────────────────────────────────────
export const CHECKPOINT_EVERY = 5;

export function canCheckpoint(cycle) {
  return Math.max(0, Number(cycle) || 0) % CHECKPOINT_EVERY === 0;
}

/** Serialize only the durable parts of a run; the wave is rebuilt on resume. */
export function serializeLabyrinthRun(run) {
  if (!run) return null;
  return {
    version: run.version,
    seed: run.seed,
    rng: run.rng,
    modeId: run.modeId,
    difficulty: run.difficulty,
    partySize: run.partySize,
    cycle: run.cycle,
    planCycle: run.planCycle,
    planQueue: run.planQueue,
    zoneId: run.zoneId,
    items: [...run.items],
    curses: [...run.curses],
    synergies: [...run.synergies],
    rituals: JSON.parse(JSON.stringify(run.rituals)),
    bargainMods: { ...(run.bargainMods || {}) },
    stats: { ...run.stats },
    history: JSON.parse(JSON.stringify(run.history)),
    modifiers: [...run.modifiers],
    checkpointed: true,
    eligible: false,
    checkpointCycle: run.cycle,
  };
}

export function resumeLabyrinthRun(saved) {
  if (!saved || typeof saved !== 'object') return null;
  const run = createLabyrinthRun({ seed: saved.seed, modeId: saved.modeId, difficulty: saved.difficulty, partySize: saved.partySize });
  run.items = Array.isArray(saved.items) ? saved.items.filter((id) => LABYRINTH_ITEM_BY_ID[id]) : [];
  run.curses = Array.isArray(saved.curses) ? saved.curses : [];
  run.synergies = synergyIdsFor(run.items);
  run.rituals = saved.rituals && typeof saved.rituals === 'object' ? saved.rituals : {};
  run.bargainMods = saved.bargainMods && typeof saved.bargainMods === 'object' ? { ...saved.bargainMods } : {};
  run.stats = { ...run.stats, ...(saved.stats || {}) };
  run.history = saved.history || run.history;
  run.modifiers = Array.isArray(saved.modifiers) ? saved.modifiers : [];
  run.checkpointed = true;
  run.eligible = false;
  run.checkpointCycle = Number(saved.checkpointCycle) || run.cycle;
  // Rebuild the encounter plan with the saved RNG so the resumed wave matches
  // the plan that was on screen when the checkpoint was taken.
  run.cycle = Number(saved.cycle) || 1;
  run.planCycle = Number(saved.planCycle) || run.cycle;
  run.planQueue = Array.isArray(saved.planQueue) && saved.planQueue.length ? saved.planQueue : [];
  if (run.planQueue.length) {
    run.zoneId = run.planQueue[0].zoneId || run.zoneId || LABYRINTH_ZONES[0].id;
    ensurePlans(run, 2);
  }
  return run;
}

// ── leaderboard helpers (local, deterministic) ─────────────────────────────
export function leaderboardRows(progress, limit = 10) {
  const safe = sanitizeLabyrinthProgress(progress);
  return safe.history
    .slice()
    .sort((a, b) => b.cycle - a.cycle || b.bosses - a.bosses || a.time - b.time)
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, position: index + 1 }));
}

export function discoverySummary(progress) {
  const safe = sanitizeLabyrinthProgress(progress);
  return {
    zones: `${safe.discovery.zones.length}/${LABYRINTH_ZONES.length}`,
    bosses: `${safe.discovery.bosses.length}/${LABYRINTH_BOSSES.length}`,
    items: `${safe.discovery.items.length}/${LABYRINTH_ITEMS.length}`,
    synergies: `${safe.discovery.synergies.length}/${SYNERGIES.length}`,
    rituals: `${safe.discovery.rituals.length}/${RITUALS.length}`,
  };
}

/** Compact HUD model shared by single-player and co-op screens. */
export function labyrinthHudModel(run, director) {
  const plan = director?.plan || run?.planQueue?.[0];
  const wave = director?.wave;
  return {
    cycle: run?.cycle || 1,
    stage: stageForCycle(run?.cycle || 1),
    zone: LABYRINTH_ZONE_BY_ID[run?.zoneId] || LABYRINTH_ZONES[0],
    wave: director?.waveIndex >= 0 ? director.waveIndex + 1 : 1,
    totalWaves: plan?.waves?.length || 4,
    waveLabel: wave?.label || 'Persiapan',
    boss: plan?.boss ? { name: plan.boss.name, rarity: plan.boss.rarity, phases: plan.boss.phases } : null,
    modifiers: (run?.modifiers || []).map((id) => LABYRINTH_MODIFIER_BY_ID[id]).filter(Boolean),
    items: (run?.items || []).map((id) => LABYRINTH_ITEM_BY_ID[id]).filter(Boolean),
    synergies: (run?.synergies || []).map((id) => SYNERGY_BY_ID[id]).filter(Boolean),
    rituals: Object.entries(run?.rituals || {})
      .map(([id, state]) => ({ ritual: RITUAL_BY_ID[id], state }))
      .filter((entry) => entry.ritual),
    curses: (run?.curses || []).length,
    score: run ? Math.round((run.stats.bossesDefeated || 0) * 100 + (run.cycle || 1) * 10 + (run.stats.enemiesDefeated || 0)) : 0,
  };
}
