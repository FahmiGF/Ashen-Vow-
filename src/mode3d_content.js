// Ashen Vow — 3D Mode content pack (Update X).
// Ten playable 3D areas, five optional dungeons, five additional elite types,
// five additional bosses, twenty relics with real stat effects, and ten vaults.
// All data is consumed by src/mode3d.js; nothing here is documentation-only.
import { HORROR3D_SITES } from './mode3d_horror.js';

export const MODE3D_CONTENT_VERSION = '1.1.0';

// ── Areas ─────────────────────────────────────────────────────────────────
export const MODE3D_AREAS = [
  {
    id: 'veilroot_approach', name: 'Veilroot Approach', subtitle: 'Ambang Akar Tabir',
    region: 'thornveil', level: 1, weather: 'spores', hazard: null,
    brief: 'Jalur pendakian menuju desa suku Thornveil, dijaga kawanan Prowler.',
    enemies: ['forest_prowler', 'forest_prowler', 'spore_beetle'], elite: null, boss: null, vault: 'vault_rootcache',
  },
  {
    id: 'thornveil_heart', name: 'Thornveil Heart', subtitle: 'Jantung Hutan Purba',
    region: 'thornveil', level: 2, weather: 'spores', hazard: 'spore_cloud',
    brief: 'Rongga di bawah Pohon Dunia tempat Thornveil Alpha dan Elder Yggvar berjaga.',
    enemies: ['bramble_stalker', 'spore_beetle', 'forest_prowler'], elite: 'thornveil_alpha', boss: 'elder_yggvar_3d', vault: 'vault_heartseed',
  },
  {
    id: 'emberfall_gate', name: 'Emberfall Gate', subtitle: 'Gerbang Bara Jatuh',
    region: 'infernal', level: 3, weather: 'embers', hazard: 'lava_vent',
    brief: 'Gerbang obsidian yang dijaga Ember Knight dan hujan bara.',
    enemies: ['forest_prowler', 'bramble_stalker'], elite: 'ember_knight', boss: null, vault: 'vault_slag',
  },
  {
    id: 'obsidian_forge', name: 'Obsidian Forge', subtitle: 'Tempa Obsidian',
    region: 'infernal', level: 4, weather: 'embers', hazard: 'lava_vent',
    brief: 'Tungku raksasa tempat Ashen Tyrant menempa rantai sumpah.',
    enemies: ['spore_beetle', 'bramble_stalker', 'forest_prowler'], elite: 'ember_knight', boss: 'ashen_tyrant', vault: 'vault_forge',
  },
  {
    id: 'tidewreck_harbor', name: 'Tidewreck Harbor', subtitle: 'Pelabuhan Karam',
    region: 'drowned', level: 5, weather: 'rain', hazard: 'rising_water',
    brief: 'Dermaga tenggelam dengan air pasang yang naik setiap gelombang.',
    enemies: ['forest_prowler', 'spore_beetle'], elite: 'drowned_choir', boss: null, vault: 'vault_tide',
  },
  {
    id: 'pale_court', name: 'Pale Court', subtitle: 'Istana Pucat',
    region: 'drowned', level: 6, weather: 'rain', hazard: 'rising_water',
    brief: 'Aula istana bawah laut; Tide Queen menguasai seluruh koridor.',
    enemies: ['bramble_stalker', 'forest_prowler', 'spore_beetle'], elite: 'drowned_choir', boss: 'tide_queen', vault: 'vault_crown',
  },
  {
    id: 'bellfall_abbey', name: 'Bellfall Abbey', subtitle: 'Biara Lonceng Runtuh',
    region: 'gothic', level: 7, weather: 'ash', hazard: null,
    brief: 'Biara tempat setiap lonceng membangunkan penjaga batu.',
    enemies: ['bramble_stalker', 'spore_beetle'], elite: 'bell_warden', boss: null, vault: 'vault_bell',
  },
  {
    id: 'choral_spire', name: 'Choral Spire', subtitle: 'Menara Koor',
    region: 'gothic', level: 8, weather: 'ash', hazard: 'bell_wave',
    brief: 'Puncak menara; Bell Primarch menyanyikan empat fase penghakiman.',
    enemies: ['forest_prowler', 'bramble_stalker', 'spore_beetle'], elite: 'bell_warden', boss: 'bell_primarch', vault: 'vault_hymn',
  },
  {
    id: 'singing_deep', name: 'Singing Deep', subtitle: 'Kedalaman Bernyanyi',
    region: 'crystal', level: 9, weather: 'spores', hazard: 'crystal_shards',
    brief: 'Gua kristal yang memantulkan setiap langkah menjadi gema tajam.',
    enemies: ['spore_beetle', 'bramble_stalker'], elite: 'crystal_maw', boss: 'shard_seraph', vault: 'vault_shard',
  },
  {
    id: 'veil_edge', name: 'Veil Edge', subtitle: 'Tepi Tabir',
    region: 'astral', level: 10, weather: 'ash', hazard: 'void_rift',
    brief: 'Pulau terakhir sebelum tabir; Veil Warden menutup jalan pulang.',
    enemies: ['forest_prowler', 'bramble_stalker', 'spore_beetle'], elite: 'veil_stalker', boss: 'veil_warden', vault: 'vault_veil',
  },
  // Update XVII — five 3D Scary Mode buildings. These areas are entered through
  // startHorrorSite(), which supplies the horror entity and three-phase layout.
  ...HORROR3D_SITES.map((entry) => ({
    id: entry.areaId,
    name: entry.name,
    subtitle: entry.subtitle,
    region: entry.region,
    level: 10 + entry.level,
    weather: entry.region === 'drowned' ? 'rain' : entry.region === 'infernal' ? 'embers' : 'ash',
    hazard: null,
    brief: entry.brief,
    enemies: [], elite: null, boss: null, vault: null,
    horror: true,
    horrorSite: entry.id,
  })),
];

export const MODE3D_AREA_BY_ID = Object.fromEntries(MODE3D_AREAS.map((area) => [area.id, area]));

// ── Optional dungeons ─────────────────────────────────────────────────────
export const MODE3D_DUNGEONS = [
  { id: 'crypt_of_oaths', name: 'Crypt of Oaths', subtitle: 'Kripta Sumpah', region: 'gothic', rooms: 4, rewardEchoes: 260, elite: 'bell_warden', modifiers: ['iron_hide'], brief: 'Empat ruang kripta dengan patung penjaga yang bangkit.' },
  { id: 'forge_below', name: 'Forge Below', subtitle: 'Tempa Bawah', region: 'infernal', rooms: 5, rewardEchoes: 320, elite: 'ember_knight', modifiers: ['glass_blade'], brief: 'Limakamar tungku; setiap ruang menambah panas dan damage.' },
  { id: 'tide_cavern', name: 'Tide Cavern', subtitle: 'Gua Pasang', region: 'drowned', rooms: 3, rewardEchoes: 210, elite: 'drowned_choir', modifiers: ['famine'], brief: 'Tiga ruang tergenang dengan air yang terus naik.' },
  { id: 'choir_vault', name: 'Choir Vault', subtitle: 'Kubah Koor', region: 'gothic', rooms: 4, rewardEchoes: 280, elite: 'bell_warden', modifiers: ['blind_fog'], brief: 'Kubah gema dengan kabut yang menutupi lantai.' },
  { id: 'root_maze', name: 'Root Maze', subtitle: 'Labirin Akar', region: 'thornveil', rooms: 6, rewardEchoes: 400, elite: 'veil_stalker', modifiers: ['hunt'], brief: 'Enam ruang akar berliku; jalur pulang hanya terbuka setelah elite tumbang.' },
];

// ── Elite types ───────────────────────────────────────────────────────────
// Ranks follow the E1–E7 ladder already used by Infinity Frontiers.
export const MODE3D_ELITES = [
  { id: 'thornveil_alpha', name: 'Thornveil Alpha', rank: 'E3', hp: 680, damage: 32, poise: 160, archetype: 'champion', model: 'alpha', tint: [1.1, 0.95, 0.85], modifier: 'hunt', brief: 'Pemimpin kawanan Thornveil dengan tanduk bercabang.' },
  { id: 'ember_knight', name: 'Ember Knight', rank: 'E4', hp: 820, damage: 34, poise: 190, archetype: 'brute', model: 'alpha', tint: [1.3, 0.7, 0.45], modifier: 'iron_hide', brief: 'Pelat baja menyala; tahan serangan ringan.' },
  { id: 'drowned_choir', name: 'Drowned Choir', rank: 'E5', hp: 940, damage: 38, poise: 150, archetype: 'chorus', model: 'stalker', tint: [0.7, 1.1, 1.2], modifier: 'blind_fog', brief: 'Paduan suara tenggelam yang memanggil gelombang.' },
  { id: 'bell_warden', name: 'Bell Warden', rank: 'E5', hp: 1020, damage: 40, poise: 210, archetype: 'sentinel', model: 'alpha', tint: [0.95, 0.95, 1.1], modifier: 'hunt', brief: 'Penjaga lonceng dengan palu seberat gerbang.' },
  { id: 'crystal_maw', name: 'Crystal Maw', rank: 'E6', hp: 1180, damage: 44, poise: 240, archetype: 'burrower', model: 'stalker', tint: [0.85, 1.25, 1.35], modifier: 'glass_blade', brief: 'Mulut kristal yang menembak pecahan dari bawah tanah.' },
  { id: 'veil_stalker', name: 'Veil Stalker', rank: 'E7', hp: 1360, damage: 48, poise: 260, archetype: 'assassin', model: 'stalker', tint: [1.2, 0.85, 1.3], modifier: 'famine', brief: 'Pemburu tabir; menghilang lalu menyerang dari belakang.' },
];

export const MODE3D_ELITE_BY_ID = Object.fromEntries(MODE3D_ELITES.map((elite) => [elite.id, elite]));

// ── Additional bosses ─────────────────────────────────────────────────────
export const MODE3D_BOSSES = [
  {
    id: 'elder_yggvar_3d', name: 'Elder Yggvar', title: 'Living Heart of the World-Tree',
    hp: 1800, phases: 3, model: 'yggvar', tint: [1, 1, 1], patterns: ['root_slam', 'canopy_sweep', 'spore_burst'],
    phaseLines: [
      'Akar ini telah ada sebelum sumpah pertama.',
      'Kau menusuk jantung dunia.',
      'Biarlah hutan menelan sisa keberanianmu.',
    ],
  },
  {
    id: 'ashen_tyrant', name: 'Ashen Tyrant', title: 'Rantai Sumpah yang Menyala',
    hp: 2400, phases: 3, model: 'yggvar', tint: [1.25, 0.62, 0.4], patterns: ['slam', 'ember_rain', 'chain_sweep'],
    phaseLines: [
      'Kau membawa abu ke dalam tempaanku.',
      'Rantai ini bukan belenggu — ini mahkotaku.',
      'Bara terakhir tidak pernah padam!',
    ],
  },
  {
    id: 'tide_queen', name: 'Tide Queen', title: 'Mahkota Pasang Pucat',
    hp: 2600, phases: 3, model: 'stalker', tint: [0.7, 1.15, 1.25], patterns: ['wave', 'summon', 'maelstrom'],
    phaseLines: [
      'Pasang selalu kembali, Penjaga.',
      'Tenggelamlah bersama sumpahmu.',
      'Air mengingat setiap nama!',
    ],
  },
  {
    id: 'bell_primarch', name: 'Bell Primarch', title: 'Suara Penghakiman',
    hp: 2800, phases: 4, model: 'alpha', tint: [1.05, 1.0, 1.15], patterns: ['bell_wave', 'hymn', 'shatter', 'final_toll'],
    phaseLines: [
      'Lonceng pertama menandai kedatanganmu.',
      'Lonceng kedua menimbang dosamu.',
      'Lonceng ketiga memanggil paduan suara.',
      'Lonceng terakhir tidak akan berbunyi untukmu.',
    ],
  },
  {
    id: 'shard_seraph', name: 'Shard Seraph', title: 'Malaikat Pecahan',
    hp: 2200, phases: 2, model: 'stalker', tint: [0.9, 1.3, 1.4], patterns: ['shard_volley', 'prism_beam'],
    phaseLines: [
      'Setiap pecahan adalah doa yang patah.',
      'Bersinarlah, lalu hancur.',
    ],
  },
  {
    id: 'veil_warden', name: 'Veil Warden', title: 'Penjaga Terakhir Tabir',
    hp: 3200, phases: 3, model: 'yggvar', tint: [1.25, 0.95, 1.35], patterns: ['rift', 'void_grasp', 'unravel'],
    phaseLines: [
      'Tidak ada yang melewati tabir dua kali.',
      'Namamu mulai terurai.',
      'Tabir menutup selamanya.',
    ],
  },
];

export const MODE3D_BOSS_BY_ID = Object.fromEntries(MODE3D_BOSSES.map((boss) => [boss.id, boss]));

// ── Relics (real modifiers) ───────────────────────────────────────────────
// Keys are read by mode3d.recomputeModifiers(): damage, maxHp, speed, stamina,
// crit, lifesteal, dashCost, cooldown, echoGain, thorns.
export const MODE3D_RELICS = [
  { id: 'relic_ember_heart', name: 'Ember Heart', desc: '+15% damage, −8% max HP.', effect: { damage: 0.15, maxHp: -0.08 } },
  { id: 'relic_root_band', name: 'Root Band', desc: '+12% max HP, −4% speed.', effect: { maxHp: 0.12, speed: -0.04 } },
  { id: 'relic_swift_anklet', name: 'Swift Anklet', desc: '+10% movement speed.', effect: { speed: 0.1 } },
  { id: 'relic_whetstone_shard', name: 'Whetstone Shard', desc: '+8% damage, +5% crit.', effect: { damage: 0.08, crit: 0.05 } },
  { id: 'relic_tide_lens', name: 'Tide Lens', desc: '+18% echo gain.', effect: { echoGain: 0.18 } },
  { id: 'relic_bell_clapper', name: 'Bell Clapper', desc: '+10% crit, −6% damage.', effect: { crit: 0.1, damage: -0.06 } },
  { id: 'relic_shard_pin', name: 'Shard Pin', desc: '+12% damage, −10% max HP.', effect: { damage: 0.12, maxHp: -0.1 } },
  { id: 'relic_veil_thread', name: 'Veil Thread', desc: '−25% dash cost.', effect: { dashCost: -0.25 } },
  { id: 'relic_oath_seal', name: 'Oath Seal', desc: '+8% stamina, +8% max HP.', effect: { stamina: 0.08, maxHp: 0.08 } },
  { id: 'relic_ashen_lung', name: 'Ashen Lung', desc: '+20% stamina.', effect: { stamina: 0.2 } },
  { id: 'relic_thorn_coil', name: 'Thorn Coil', desc: 'Reflect 12% damage taken.', effect: { thorns: 0.12 } },
  { id: 'relic_blood_vow', name: 'Blood Vow', desc: 'Heal 6% of damage dealt.', effect: { lifesteal: 0.06 } },
  { id: 'relic_quiet_step', name: 'Quiet Step', desc: '+6% speed, −10% echo gain.', effect: { speed: 0.06, echoGain: -0.1 } },
  { id: 'relic_forge_scale', name: 'Forge Scale', desc: '+18% max HP, −8% speed.', effect: { maxHp: 0.18, speed: -0.08 } },
  { id: 'relic_gale_charm', name: 'Gale Charm', desc: '+14% speed, −6% max HP.', effect: { speed: 0.14, maxHp: -0.06 } },
  { id: 'relic_hymn_book', name: 'Hymn Book', desc: '−20% ability cooldowns.', effect: { cooldown: -0.2 } },
  { id: 'relic_mirror_scale', name: 'Mirror Scale', desc: '+10% crit, +6% thorns.', effect: { crit: 0.1, thorns: 0.06 } },
  { id: 'relic_last_candle', name: 'Last Candle', desc: 'Heal 10% of damage dealt, −12% max HP.', effect: { lifesteal: 0.1, maxHp: -0.12 } },
  { id: 'relic_chain_link', name: 'Chain Link', desc: '+10% damage, +10% max HP, −12% speed.', effect: { damage: 0.1, maxHp: 0.1, speed: -0.12 } },
  { id: 'relic_quiet_grave', name: 'Quiet Grave', desc: '+1.5% life steal per missing HP fraction is not modelled; +5% damage and +5% crit.', effect: { damage: 0.05, crit: 0.05 } },
];

export const MODE3D_RELIC_BY_ID = Object.fromEntries(MODE3D_RELICS.map((relic) => [relic.id, relic]));

export const RELIC_BASELINE = Object.freeze({
  damage: 1, maxHp: 1, speed: 1, stamina: 1, crit: 0, lifesteal: 0, dashCost: 1, cooldown: 1, echoGain: 1, thorns: 0,
});

// Folds relic effects into a live modifier block. Percent values are additive.
export function applyRelics(relicIds = [], baseline = RELIC_BASELINE) {
  const out = { ...baseline };
  for (const id of relicIds) {
    const relic = MODE3D_RELIC_BY_ID[id];
    if (!relic) continue;
    for (const [key, value] of Object.entries(relic.effect)) {
      if (out[key] === undefined) continue;
      if (key === 'crit' || key === 'lifesteal' || key === 'thorns') out[key] += value;
      else out[key] += value;
    }
  }
  out.damage = Math.max(0.25, out.damage);
  out.maxHp = Math.max(0.4, out.maxHp);
  out.speed = Math.max(0.4, out.speed);
  out.stamina = Math.max(0.4, out.stamina);
  out.dashCost = Math.max(0.3, out.dashCost);
  out.cooldown = Math.max(0.3, out.cooldown);
  out.echoGain = Math.max(0.3, out.echoGain);
  out.crit = Math.min(0.75, out.crit);
  out.lifesteal = Math.min(0.5, out.lifesteal);
  out.thorns = Math.min(0.6, out.thorns);
  return out;
}

// ── Vaults ────────────────────────────────────────────────────────────────
export const MODE3D_VAULTS = [
  { id: 'vault_rootcache', name: 'Root Cache', area: 'veilroot_approach', x: -120, z: 240, relic: 'relic_root_band', echoes: 60 },
  { id: 'vault_heartseed', name: 'Heart Seed', area: 'thornveil_heart', x: 150, z: 700, relic: 'relic_oath_seal', echoes: 120 },
  { id: 'vault_slag', name: 'Slag Vault', area: 'emberfall_gate', x: -90, z: 380, relic: 'relic_ember_heart', echoes: 90 },
  { id: 'vault_forge', name: 'Forge Vault', area: 'obsidian_forge', x: 180, z: 520, relic: 'relic_forge_scale', echoes: 140 },
  { id: 'vault_tide', name: 'Tide Vault', area: 'tidewreck_harbor', x: -160, z: 300, relic: 'relic_tide_lens', echoes: 100 },
  { id: 'vault_crown', name: 'Crown Vault', area: 'pale_court', x: 120, z: 620, relic: 'relic_mirror_scale', echoes: 160 },
  { id: 'vault_bell', name: 'Bell Vault', area: 'bellfall_abbey', x: -140, z: 460, relic: 'relic_bell_clapper', echoes: 110 },
  { id: 'vault_hymn', name: 'Hymn Vault', area: 'choral_spire', x: 160, z: 740, relic: 'relic_hymn_book', echoes: 180 },
  { id: 'vault_shard', name: 'Shard Vault', area: 'singing_deep', x: -110, z: 500, relic: 'relic_shard_pin', echoes: 150 },
  { id: 'vault_veil', name: 'Veil Vault', area: 'veil_edge', x: 0, z: 860, relic: 'relic_veil_thread', echoes: 240 },
];

export const MODE3D_VAULT_BY_ID = Object.fromEntries(MODE3D_VAULTS.map((vault) => [vault.id, vault]));

// ── helpers ───────────────────────────────────────────────────────────────
export function areaVault(areaId) {
  return MODE3D_VAULTS.find((vault) => vault.area === areaId) || null;
}

export function areaElite(area) {
  if (!area?.elite) return null;
  return MODE3D_ELITE_BY_ID[area.elite] || null;
}

export function areaBoss(area) {
  if (!area?.boss) return null;
  return MODE3D_BOSS_BY_ID[area.boss] || null;
}

export function dungeonById(id) {
  return MODE3D_DUNGEONS.find((dungeon) => dungeon.id === id) || null;
}

export function contentSummary() {
  return {
    areas: MODE3D_AREAS.length,
    dungeons: MODE3D_DUNGEONS.length,
    elites: MODE3D_ELITES.length,
    bosses: MODE3D_BOSSES.length,
    relics: MODE3D_RELICS.length,
    vaults: MODE3D_VAULTS.length,
    horrorSites: HORROR3D_SITES.length,
  };
}
