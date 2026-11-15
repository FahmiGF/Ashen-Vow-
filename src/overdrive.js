// src/overdrive.js — Ashen Vow: Overdrive Update (The Eternal Realm)
// Expansion content: Chapters 21–30 (Levels 201–300), 8 Spell Schools (32 spells),
// 16 Weapon Categories, 8 Legendaries, 50 Enemies, 12 Game Modes, 30 NPCs, 10 Quests, 18-point Checklist.
// Pure logic: zero DOM / audio dependencies. Safe in Node and browser.

'use strict';

export const OVERDRIVE_VERSION = '0.5.0';

// ═════════════════════════════════════════════════════════════════════════════
// 1. CHAPTERS 21–30 (Levels 201–300)
// ═════════════════════════════════════════════════════════════════════════════

export const OVERDRIVE_CHAPTERS = Object.freeze([
  {
    number: 21,
    id: 'ch21_drowned_capital',
    name: 'The Drowned Capital',
    levelStart: 201,
    levelEnd: 210,
    bossId: 'sunken_emperor',
    bossName: 'The Sunken Emperor',
    biome: 'Sunken Ruins & Abyssal Waterways',
    hazards: ['Rising Tides', 'Water Pressure', 'Submerged Spikes'],
    lore: 'Once the majestic crown of the primordial seas, now submerged beneath cursed tidal currents.',
  },
  {
    number: 22,
    id: 'ch22_crystalheart_depths',
    name: 'Crystalheart Depths',
    levelStart: 211,
    levelEnd: 220,
    bossId: 'prism_devourer',
    bossName: 'The Prism Devourer',
    biome: 'Crystalline Caverns & Prismatic Chasms',
    hazards: ['Refracting Lasers', 'Resonance Crystals', 'Falling Stalactites'],
    lore: 'Living prisms hum with resonant energy, consuming physical matter and reflecting pure lethal light.',
  },
  {
    number: 23,
    id: 'ch23_infernal_foundry',
    name: 'The Infernal Foundry',
    levelStart: 221,
    levelEnd: 230,
    bossId: 'forge_titan',
    bossName: 'The Forge Titan',
    biome: 'Molten Basins & Steam Furnaces',
    hazards: ['Lava Vents', 'Conveyor Belts', 'Crushing Presses'],
    lore: 'Giant steam hammers forge warmachines continuously in an endless cycle fueled by molten volcanic core.',
  },
  {
    number: 24,
    id: 'ch24_verdant_grave',
    name: 'The Verdant Grave',
    levelStart: 231,
    levelEnd: 240,
    bossId: 'mother_of_thorns',
    bossName: 'The Mother of Thorns',
    biome: 'Overgrown Sepulcher & Thorny Brambles',
    hazards: ['Poison Mist', 'Constricting Vines', 'Spore Pods'],
    lore: 'Nature has reclaimed the tombs of the forgotten gods, wrapping bones in toxic brambles and blooms.',
  },
  {
    number: 25,
    id: 'ch25_astral_citadel',
    name: 'The Astral Citadel',
    levelStart: 241,
    levelEnd: 250,
    bossId: 'starbound_regent',
    bossName: 'The Starbound Regent',
    biome: 'Celestial Spires & Void Bridges',
    hazards: ['Gravity Wells', 'Comet Shards', 'Collapsing Void Paths'],
    lore: 'A fortress drifting between constellations, guarded by clockwork astrologers and cosmic sentinels.',
  },
  {
    number: 26,
    id: 'ch26_frozen_dominion',
    name: 'The Frozen Dominion',
    levelStart: 251,
    levelEnd: 260,
    bossId: 'pale_frost_monarch',
    bossName: 'The Pale Frost Monarch',
    biome: 'Glacial Pinnacles & Permafrost Wastes',
    hazards: ['Hypothermia Storms', 'Slippery Ice', 'Glacial Fissures'],
    lore: 'An endless winter kingdom where cold is not merely absence of heat, but an active predatory force.',
  },
  {
    number: 27,
    id: 'ch27_clockwork_expanse',
    name: 'The Clockwork Expanse',
    levelStart: 261,
    levelEnd: 270,
    bossId: 'grand_horologist',
    bossName: 'The Grand Horologist',
    biome: 'Interlocking Brass Gears & Pendulum Towers',
    hazards: ['Rotating Cogs', 'Pendulum Blades', 'Temporal Rewind Traps'],
    lore: 'Massive brass gears grind reality into precise seconds, ticking toward an inevitable temporal collapse.',
  },
  {
    number: 28,
    id: 'ch28_shattered_void',
    name: 'The Shattered Void',
    levelStart: 271,
    levelEnd: 280,
    bossId: 'the_unmade',
    bossName: 'The Unmade',
    biome: 'Non-Euclidean Rifts & Anti-Matter Shards',
    hazards: ['Reality Warps', 'Null Fields', 'Disintegration Beams'],
    lore: 'Where space and laws of physics dissolve into meaningless chaos; what enters is broken down to raw concepts.',
  },
  {
    number: 29,
    id: 'ch29_sunken_sands',
    name: 'The Sunken Sands',
    levelStart: 281,
    levelEnd: 290,
    bossId: 'sandstorm_sovereign',
    bossName: 'The Sandstorm Sovereign',
    biome: 'Subterranean Dunes & Sunken Pyramids',
    hazards: ['Quicksand Pits', 'Sand Blizzards', 'Mirage Phantoms'],
    lore: 'Ancient deserts buried beneath bedrock, where phantom dynasties wage eternal wars across glass dunes.',
  },
  {
    number: 30,
    id: 'ch30_final_pantheon',
    name: 'The Final Pantheon',
    levelStart: 291,
    levelEnd: 300,
    bossId: 'the_first_god',
    bossName: 'The First God',
    biome: 'The Seat of Creation & Throne of Ash',
    hazards: ['Divine Judgments', 'Omnipresent Erasure', 'Genesis Shockwaves'],
    lore: 'The apex of reality where the first spark of existence was struck, waiting for the final worthy successor.',
  },
]);

export const OVERDRIVE_CHAPTER_BY_ID = Object.freeze(
  Object.fromEntries(OVERDRIVE_CHAPTERS.map(ch => [ch.id, ch]))
);

export function overdriveChapterForLevel(level) {
  const lvl = Math.max(201, Math.min(300, level));
  return OVERDRIVE_CHAPTERS.find(ch => lvl >= ch.levelStart && lvl <= ch.levelEnd) || OVERDRIVE_CHAPTERS[0];
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. LEVEL SPECIFICATIONS (201–300)
// ═════════════════════════════════════════════════════════════════════════════

export const OVERDRIVE_LEVEL_SPECS = Object.freeze(
  Array.from({ length: 100 }, (_, i) => {
    const level = 201 + i;
    const chapterNum = Math.floor(i / 10) + 21;
    const indexInChapter = i % 10;
    const chapter = OVERDRIVE_CHAPTERS[chapterNum - 21];
    const isBoss = indexInChapter === 9;

    return {
      level,
      chapter: chapterNum,
      name: isBoss ? `Seat of ${chapter.bossName}` : `${chapter.name} — Chamber ${indexInChapter + 1}`,
      boss: isBoss ? { id: chapter.bossId, name: chapter.bossName } : null,
      hazards: chapter.hazards,
      rewardTier: Math.floor(level / 10),
      difficultyMult: +(1.0 + (level - 200) * 0.05).toFixed(2),
    };
  })
);

// ═════════════════════════════════════════════════════════════════════════════
// 3. SPECIAL LEVEL TYPES (6 Types)
// ═════════════════════════════════════════════════════════════════════════════

export const OVERDRIVE_SPECIAL_LEVEL_TYPES = Object.freeze([
  {
    id: 'endless_dungeon',
    name: 'Endless Dungeon',
    desc: 'Infinite procedurally deepening descent with escalating mob modifiers and relentless scaling.',
    icon: 'spiral_staircase',
    mechanic: 'Infinite waves, checkpoints every 10 floors',
  },
  {
    id: 'colossus_trial',
    name: 'Colossus Trial',
    desc: 'Multi-screen arena pitted against gigantic Titans with climbable weak points.',
    icon: 'colossus_fist',
    mechanic: 'Weak point targeting and arena climbing',
  },
  {
    id: 'time_trial',
    name: 'Time Trial',
    desc: 'High-speed gauntlet through hazards and enemies against a strict countdown timer.',
    icon: 'hourglass_wings',
    mechanic: 'Clock extensions on elite takedowns and parries',
  },
  {
    id: 'treasure_vault',
    name: 'Treasure Vault',
    desc: 'Puzzle-locked labyrinths packed with mimic chests, traps, and lavish relic caches.',
    icon: 'gilded_chest',
    mechanic: 'Lock puzzle deciphering with limited lockpicks',
  },
  {
    id: 'cursed_expedition',
    name: 'Cursed Expedition',
    desc: 'High-stakes expedition applying permanent run debuffs in exchange for god-tier affixes.',
    icon: 'skull_amulet',
    mechanic: 'Curse stacking with 3x legendary loot drops',
  },
  {
    id: 'gauntlet_tower',
    name: 'Gauntlet Tower',
    desc: 'Ascension tower requiring defeat of successive boss encounters without healing flasks.',
    icon: 'tower_spire',
    mechanic: 'No potion refills between consecutive boss fights',
  },
]);

// ═════════════════════════════════════════════════════════════════════════════
// 4. ELEMENTAL SPELL SCHOOLS (8 Schools, 4 Spells each = 32 Spells)
// ═════════════════════════════════════════════════════════════════════════════

export const SPELL_SCHOOLS = Object.freeze([
  {
    id: 'storm',
    name: 'Storm',
    color: '#38bdf8',
    description: 'Electric burst and high-frequency chain attacks that stun and shock.',
    spells: [
      { id: 'storm_lightning_chain', name: 'Lightning Chain', damage: 75, cost: 20, cooldown: 1.5, desc: 'Arcs between up to 4 enemies.', modifier: 'chain' },
      { id: 'storm_thunder_lance',   name: 'Thunder Lance',   damage: 120, cost: 35, cooldown: 3.0, desc: 'Piercing bolt that electrifies.', modifier: 'pierce' },
      { id: 'storm_cage',            name: 'Storm Cage',      damage: 160, cost: 50, cooldown: 6.0, desc: 'Electrified barrier that traps.', modifier: 'trap' },
      { id: 'storm_tempest_nova',    name: 'Tempest Nova',    damage: 280, cost: 85, cooldown: 12.0, desc: 'Room-wide thunder burst.', modifier: 'aoe_burst' },
    ],
  },
  {
    id: 'void',
    name: 'Void',
    color: '#c084fc',
    description: 'Gravitational distortions that bypass physical armor and collapse space.',
    spells: [
      { id: 'void_rift_orb',        name: 'Rift Orb',         damage: 85, cost: 25, cooldown: 2.0, desc: 'Singularity projectile ignoring armor.', modifier: 'armor_pierce' },
      { id: 'void_step',            name: 'Void Step',        damage: 110, cost: 40, cooldown: 4.0, desc: 'Short teleport dealing path damage.', modifier: 'teleport' },
      { id: 'void_gravity_well',    name: 'Gravity Well',     damage: 180, cost: 60, cooldown: 8.0, desc: 'Pulls nearby enemies inward.', modifier: 'pull' },
      { id: 'void_oblivion_burst',  name: 'Oblivion Burst',   damage: 350, cost: 100, cooldown: 15.0, desc: 'Collapses space dealing massive damage.', modifier: 'black_hole' },
    ],
  },
  {
    id: 'nature',
    name: 'Nature',
    color: '#4ade80',
    description: 'Bramble entanglements, toxic spores, and continuous self-rejuvenation.',
    spells: [
      { id: 'nature_thorn_prison',  name: 'Thorn Prison',     damage: 60, cost: 18, cooldown: 1.8, desc: 'Sprouts briars that root enemies.', modifier: 'root' },
      { id: 'nature_root_snare',    name: 'Root Snare',       damage: 95, cost: 30, cooldown: 3.5, desc: 'Creeping roots dealing poison DOT.', modifier: 'poison' },
      { id: 'nature_verdant_shield',name: 'Verdant Shield',   damage: 40, cost: 45, cooldown: 7.0, desc: 'Protective foliage barrier that heals.', modifier: 'shield_heal' },
      { id: 'nature_ancient_bloom', name: 'Ancient Bloom',    damage: 220, cost: 75, cooldown: 11.0, desc: 'Massive floral detonation clearing toxins.', modifier: 'cleanse_bloom' },
    ],
  },
  {
    id: 'infernal',
    name: 'Infernal',
    color: '#f87171',
    description: 'Raw fiery devastation leaving blazing persistent craters in its wake.',
    spells: [
      { id: 'infernal_flame_wave',  name: 'Flame Wave',       damage: 90, cost: 25, cooldown: 2.2, desc: 'Horizontal rushing wall of flame.', modifier: 'fire_wave' },
      { id: 'infernal_ember_rain',  name: 'Ember Rain',       damage: 140, cost: 45, cooldown: 5.0, desc: 'Showers fire droplets over an area.', modifier: 'shower' },
      { id: 'infernal_magma_lance', name: 'Magma Lance',      damage: 210, cost: 65, cooldown: 8.0, desc: 'Concentrated molten jet with melt DOT.', modifier: 'melt' },
      { id: 'infernal_crown',       name: 'Inferno Crown',    damage: 320, cost: 90, cooldown: 14.0, desc: 'Explosive radial eruptions around caster.', modifier: 'eruption' },
    ],
  },
  {
    id: 'frost',
    name: 'Frost',
    color: '#67e8f9',
    description: 'Glacial crystals that slow movement attack speeds and freeze enemies solid.',
    spells: [
      { id: 'frost_ice_spear',      name: 'Ice Spear',        damage: 65, cost: 18, cooldown: 1.2, desc: 'Sharp icicle that slows by 30%.', modifier: 'slow' },
      { id: 'frost_frozen_wall',    name: 'Frozen Wall',      damage: 80, cost: 35, cooldown: 5.0, desc: 'Constructs temporary ice barrier.', modifier: 'barrier' },
      { id: 'frost_blizzard_field', name: 'Blizzard Field',   damage: 150, cost: 55, cooldown: 8.0, desc: 'Freezing snowstorm reducing visibility.', modifier: 'blizzard' },
      { id: 'frost_absolute_zero',  name: 'Absolute Zero',    damage: 260, cost: 85, cooldown: 13.0, desc: 'Instantly freezes targets solid for 3s.', modifier: 'freeze_solid' },
    ],
  },
  {
    id: 'celestial',
    name: 'Celestial',
    color: '#fbbf24',
    description: 'Radiant holy light that incinerates corrupted matter and shields allies.',
    spells: [
      { id: 'celestial_radiant_beam', name: 'Radiant Beam',   damage: 100, cost: 30, cooldown: 2.5, desc: 'Focused sunbeam piercing shadows.', modifier: 'sunbeam' },
      { id: 'celestial_sacred_barrier',name:'Sacred Barrier', damage: 30, cost: 40, cooldown: 6.0, desc: 'Deflective holy ward granting i-frames.', modifier: 'ward' },
      { id: 'celestial_starfall',     name: 'Starfall',       damage: 190, cost: 65, cooldown: 9.0, desc: 'Meteoric astral fragments descending.', modifier: 'meteor' },
      { id: 'celestial_judgment',     name: 'Divine Judgment',damage: 340, cost: 95, cooldown: 15.0, desc: 'Pillar of pure sanctified judgment.', modifier: 'smite' },
    ],
  },
  {
    id: 'blood',
    name: 'Blood',
    color: '#e11d48',
    description: 'Sanguine arts draining vitality from foes to empower caster attacks.',
    spells: [
      { id: 'blood_crimson_bolt',   name: 'Crimson Bolt',     damage: 80, cost: 22, cooldown: 1.8, desc: 'Life-draining shard restoring 20% dmg.', modifier: 'lifesteal' },
      { id: 'blood_pact',           name: 'Blood Pact',       damage: 130, cost: 35, cooldown: 4.5, desc: 'Sacrifices minor HP for double damage.', modifier: 'sacrifice' },
      { id: 'blood_sanguine_nova',  name: 'Sanguine Nova',    damage: 175, cost: 60, cooldown: 7.5, desc: 'Explosion of coagulated blood spikes.', modifier: 'blood_burst' },
      { id: 'blood_dominion',       name: 'Scarlet Dominion', damage: 290, cost: 85, cooldown: 12.5, desc: 'Field that inflicts massive bleed DOT.', modifier: 'bleed_field' },
    ],
  },
  {
    id: 'chronomancy',
    name: 'Chronomancy',
    color: '#a78bfa',
    description: 'Temporal distortion, rewinding positioning and warping the flow of time.',
    spells: [
      { id: 'chrono_temporal_echo', name: 'Temporal Echo',    damage: 55, cost: 20, cooldown: 2.0, desc: 'Repeats last attack after a 1s delay.', modifier: 'echo' },
      { id: 'chrono_time_bubble',   name: 'Time Bubble',      damage: 70, cost: 45, cooldown: 6.5, desc: 'Slows incoming enemy projectiles by 80%.', modifier: 'slow_proj' },
      { id: 'chrono_rewind_mark',   name: 'Rewind Mark',      damage: 115, cost: 55, cooldown: 9.0, desc: 'Teleports caster back 3 seconds.', modifier: 'rewind' },
      { id: 'chrono_hourglass',     name: 'Hourglass Collapse',damage: 250, cost: 80, cooldown: 14.0, desc: 'Stops enemy movements completely for 2.5s.', modifier: 'timestop' },
    ],
  },
]);

export const SPELL_BY_ID = Object.freeze(
  Object.fromEntries(SPELL_SCHOOLS.flatMap(s => s.spells.map(spell => [spell.id, spell])))
);

// ═════════════════════════════════════════════════════════════════════════════
// 5. WEAPON CATEGORIES (16) & LEGENDARY WEAPONS (8)
// ═════════════════════════════════════════════════════════════════════════════

export const OVERDRIVE_WEAPON_CATEGORIES = Object.freeze([
  { id: 'greatsword',   name: 'Greatsword',      scaling: 'STR', desc: 'Heavy sweeping arcs with high stagger.' },
  { id: 'twin_blades',  name: 'Twin Blades',     scaling: 'DEX', desc: 'Rapid dual strikes with critical bleed.' },
  { id: 'warhammer',    name: 'Warhammer',       scaling: 'STR', desc: 'Armor-crushing impact with tremor waves.' },
  { id: 'halberd',      name: 'Halberd',         scaling: 'STR/DEX', desc: 'Long range thrust and sweeping cleave.' },
  { id: 'scythe',       name: 'Scythe',          scaling: 'DEX/INT', desc: 'Sweeping reaps that harvest soul fragments.' },
  { id: 'katana',       name: 'Katana',          scaling: 'DEX', desc: 'Quick-draw iaido slashes with deflect parry.' },
  { id: 'rapier',       name: 'Rapier',          scaling: 'DEX', desc: 'Precision thrusts with high counter bonus.' },
  { id: 'flail',        name: 'Flail',           scaling: 'STR', desc: 'Shield-bypassing erratic overhead strikes.' },
  { id: 'longbow',      name: 'Longbow',         scaling: 'DEX', desc: 'High-draw range arrows piercing armor.' },
  { id: 'crossbow',     name: 'Repeating Crossbow', scaling: 'DEX', desc: 'Three-bolt rapid burst fire.' },
  { id: 'elemental_staff', name: 'Elemental Staff', scaling: 'INT', desc: 'Catalyst boosting elemental spell damage.' },
  { id: 'magic_wand',   name: 'Arcane Wand',     scaling: 'INT', desc: 'Rapid homing arcane dart projector.' },
  { id: 'daggers',      name: 'Assassin Daggers', scaling: 'DEX', desc: 'Backstab lethal multipliers and poison.' },
  { id: 'claws',        name: 'Beast Claws',     scaling: 'STR/DEX', desc: 'Feral lunges and shredding combos.' },
  { id: 'glaive',       name: 'Glaive',          scaling: 'DEX', desc: 'Aerodynamic spinning polearm strikes.' },
  { id: 'greatshield',  name: 'Spiked Greatshield', scaling: 'STR', desc: 'Impenetrable fortress guard and bash.' },
]);

export const LEGENDARY_WEAPONS = Object.freeze([
  {
    id: 'worldbreaker',
    name: 'Worldbreaker',
    category: 'warhammer',
    rarity: 'Legendary',
    baseAtk: 240,
    perk: 'Shatters ground into shockwaves dealing 50% bonus earthquake damage.',
    lore: 'Forged from the spine of a fallen primordial colossus.',
  },
  {
    id: 'starfall_edge',
    name: 'Starfall Edge',
    category: 'katana',
    rarity: 'Legendary',
    baseAtk: 215,
    perk: 'Critical hits rain falling star meteors from above.',
    lore: 'Quenched in the blood of celestial monarchs.',
  },
  {
    id: 'void_reaper',
    name: 'Void Reaper',
    category: 'scythe',
    rarity: 'Legendary',
    baseAtk: 225,
    perk: 'Slashes tear open mini gravity singularities that pull enemies.',
    lore: 'Carved from non-matter found in the heart of the void abyss.',
  },
  {
    id: 'frostmourne_relic',
    name: 'Frostmourne Relic',
    category: 'greatsword',
    rarity: 'Legendary',
    baseAtk: 230,
    perk: 'Freezes killed enemies into ice statues that shatter on impact.',
    lore: 'An ancient relic excavated from the deepest glacial tombs.',
  },
  {
    id: 'thorncaller',
    name: 'Thorncaller',
    category: 'longbow',
    rarity: 'Legendary',
    baseAtk: 195,
    perk: 'Arrows spawn blooming briars that snare and poison targets.',
    lore: 'Grown from the seed of the Mother of Thorns.',
  },
  {
    id: 'sunforged_spear',
    name: 'Sunforged Spear',
    category: 'halberd',
    rarity: 'Legendary',
    baseAtk: 220,
    perk: 'Thrusts unleash piercing solar flares that blind and ignite.',
    lore: 'Blessed by the First God during the dawn of the realms.',
  },
  {
    id: 'chrono_staff',
    name: 'Chrono Staff',
    category: 'elemental_staff',
    rarity: 'Legendary',
    baseAtk: 180,
    perk: 'Reduces all spell cooldowns by 35% and extends status durations.',
    lore: 'The pendulum shaft from the Grand Horologist clockwork core.',
  },
  {
    id: 'abyssal_harvester',
    name: 'Abyssal Harvester',
    category: 'twin_blades',
    rarity: 'Legendary',
    baseAtk: 205,
    perk: 'Rapid hits grant stacking 2% lifesteal up to a maximum of 30%.',
    lore: 'Reaped from the sunken trenches of the Drowned Capital.',
  },
]);

// ═════════════════════════════════════════════════════════════════════════════
// 6. OVERDRIVE ENEMIES (50) & ELITE MODIFIERS (10)
// ═════════════════════════════════════════════════════════════════════════════

const ENEMY_FAMILIES = [
  'Drowned', 'Crystalline', 'Forge', 'Briar', 'Astral',
  'Frost', 'Clockwork', 'Void', 'Dune', 'Pantheon'
];

export const OVERDRIVE_ENEMIES = Object.freeze(
  Array.from({ length: 50 }, (_, i) => {
    const familyIndex = Math.floor(i / 5);
    const family = ENEMY_FAMILIES[familyIndex];
    const subTypes = ['Scout', 'Brute', 'Sorcerer', 'Assassin', 'Guardian'];
    const subType = subTypes[i % 5];
    const id = `${family.toLowerCase()}_${subType.toLowerCase()}`;
    const name = `${family} ${subType}`;

    return {
      id,
      name,
      family,
      type: subType,
      hp: 350 + (i * 25),
      dmg: 25 + Math.floor(i * 1.5),
      speed: 80 + (i % 5) * 15,
      xp: 50 + (i * 15),
    };
  })
);

export const ELITE_MODIFIERS_OVERDRIVE = Object.freeze([
  { id: 'armored',     name: 'Armored',     effect: 'Gains a 50% physical damage reduction barrier.', color: '#94a3b8' },
  { id: 'enraged',     name: 'Enraged',     effect: 'Attacks and moves 40% faster when below 50% HP.', color: '#ef4444' },
  { id: 'frozen',      name: 'Frozen Aura', effect: 'Chills nearby player, reducing move speed by 25%.', color: '#38bdf8' },
  { id: 'electrified', name: 'Electrified', effect: 'Emits chain lightning bolts when struck.', color: '#facc15' },
  { id: 'regenerating',name: 'Regenerating',effect: 'Restores 3% max HP every 2 seconds.', color: '#22c55e' },
  { id: 'phantom',     name: 'Phantom',     effect: 'Periodic intangible blinks avoiding attacks.', color: '#c084fc' },
  { id: 'explosive',   name: 'Explosive',   effect: 'Detonates into shrapnel upon death.', color: '#f97316' },
  { id: 'cursed',      name: 'Cursed',      effect: 'Inflicts stamina drain and reduced healing.', color: '#a855f7' },
  { id: 'arcane',      name: 'Arcane Ward', effect: 'Surrounded by rotating protective arcane orbs.', color: '#818cf8' },
  { id: 'summoner',    name: 'Summoner',    effect: 'Spawns supporting minions periodically.', color: '#ec4899' },
]);

// ═════════════════════════════════════════════════════════════════════════════
// 7. BACKGROUND BOSSES (6 World Bosses)
// ═════════════════════════════════════════════════════════════════════════════

export const BACKGROUND_BOSSES = Object.freeze([
  {
    id: 'world_colossus',
    name: 'The World Colossus',
    type: 'World Colossus',
    encounterChance: 0.15,
    encounterInterval: 'Every 15 rooms',
    desc: 'Towering mountain-sized titan visible walking in distant background before engaging.',
  },
  {
    id: 'roaming_nemesis',
    name: 'The Roaming Nemesis',
    type: 'Roaming Nemesis',
    encounterChance: 0.20,
    encounterInterval: 'Dynamic stalker timer',
    desc: 'An unrelenting hunter that tracks the player across multiple connected chambers.',
  },
  {
    id: 'sky_behemoth',
    name: 'The Sky Behemoth',
    type: 'Sky Behemoth',
    encounterChance: 0.12,
    encounterInterval: 'Open-sky levels',
    desc: 'Winged leviathan swooping down from storm clouds to unleash aerial carpet bombardments.',
  },
  {
    id: 'abyssal_creature',
    name: 'The Abyssal Creature',
    type: 'Abyssal Creature',
    encounterChance: 0.18,
    encounterInterval: 'Flooded zones',
    desc: 'Deep-sea kraken whose tentacles emerge through fissures in the arena floor.',
  },
  {
    id: 'ancient_guardian',
    name: 'The Ancient Guardian',
    type: 'Ancient Guardian',
    encounterChance: 0.10,
    encounterInterval: 'Sanctuary borders',
    desc: 'Stationary stone construct guarding forgotten vaults, wielding solar laser beams.',
  },
  {
    id: 'rival_boss',
    name: 'The Rival Champion',
    type: 'Rival Boss',
    encounterChance: 0.25,
    encounterInterval: 'Checkpoints',
    desc: 'A mirrored oathkeeper with player-like mobility, dash cancels, and weapon swapping.',
  },
]);

// ═════════════════════════════════════════════════════════════════════════════
// 8. OVERDRIVE GAME MODES (12)
// ═════════════════════════════════════════════════════════════════════════════

export const OVERDRIVE_MODES = Object.freeze([
  { id: 'world_boss_hunt',   name: 'World Boss Hunt',   desc: 'Track down and slay roaming behemoths across dynamic landscapes.' },
  { id: 'endless_descent',   name: 'Endless Descent',   desc: 'Infinite dungeon dive with increasing difficulty floors.' },
  { id: 'ancient_trials',    name: 'Ancient Trials',    desc: 'Puzzles and platforming tests set by the forgotten architects.' },
  { id: 'survival_nightmare',name: 'Survival Nightmare',desc: 'Continuous enemy onslaught with scarce resource drops.' },
  { id: 'legendary_hunt',    name: 'Legendary Hunt',    desc: 'Targeted bounty quests rewarding legendary weapon fragments.' },
  { id: 'colossus_arena',    name: 'Colossus Arena',    desc: 'Dedicated boss-rush arena against oversized titans.' },
  { id: 'spell_mastery',     name: 'Spell Mastery',     desc: 'Magic-only challenges testing elemental combos.' },
  { id: 'weapon_mastery',    name: 'Weapon Mastery',    desc: 'Melee weapon specific trials unlocking unique weapon skins.' },
  { id: 'cursed_kingdom',    name: 'Cursed Kingdom',    desc: 'Permanent environmental debuffs for multiplied rewards.' },
  { id: 'relic_expedition',  name: 'Relic Expedition',  desc: 'High-speed treasure hunting with trap disarming.' },
  { id: '3d_realm_expedition', name: '3D Realm Expedition', desc: 'Full 3D Metroidvania exploration mode across new dimensions.' },
  { id: 'daily_challenge',   name: 'Daily Challenge',   desc: 'Daily seeded modifier runs with global leaderboards.' },
]);

// ═════════════════════════════════════════════════════════════════════════════
// 9. NPCS (30) & STORY QUESTLINES (10)
// ═════════════════════════════════════════════════════════════════════════════

export const OVERDRIVE_NPCS = Object.freeze(
  Array.from({ length: 30 }, (_, i) => {
    const roles = ['Blacksmith', 'Archmage', 'Scholar', 'Cartographer', 'Nomad', 'Oracle'];
    const names = [
      'Althea the Astrologer', 'Balthazar the Forgeborn', 'Corin the Wandering Blade',
      'Dahlia of the Bramble', 'Elion the Tidecaller', 'Farah the Sandwalker',
      'Galen the Clockmaker', 'Helena the Voidbound', 'Ignis the Emberguard',
      'Jarek the Runesmith', 'Kaelen the Silent', 'Lyra the Starlight Bard',
      'Marius the Paladin', 'Nadia the Herbologist', 'Orion the Huntmaster',
      'Phaedra the Seer', 'Quentin the Archivist', 'Rhea the Frostborn',
      'Silas the Relic Hunter', 'Talia the Shadow Weaver', 'Urien the Hermit',
      'Valeria the Just', 'Willem the Provisioner', 'Xanthe the Alchemist',
      'Yvaine the Moon Priestess', 'Zane the Clockwork Tinkerer', 'Aurelius the Fallen',
      'Bran the Miner', 'Cerys the Keeper', 'Dauren the Last Scholar'
    ];
    return {
      id: `npc_${i + 1}`,
      name: names[i] || `Wanderer ${i + 1}`,
      role: roles[i % roles.length],
      location: OVERDRIVE_CHAPTERS[Math.floor(i / 3)]?.name || 'Overdrive Hub',
      dialogue: 'The veil has shattered, wanderer. Tread carefully among the ruins of eternity.',
    };
  })
);

export const OVERDRIVE_QUESTLINES = Object.freeze([
  { id: 'q1_sunkencrown',      title: 'Crown of the Sunken King',    description: 'Retrieve the 3 royal seal fragments from Drowned Capital waterways.', rewards: ['Abyssal Crest', '3000 Ash'] },
  { id: 'q2_prismatic_echo',   title: 'Echoes of the Living Prism',  description: 'Align the resonance crystals across the Crystalheart depths.', rewards: ['Prism Gem', '4000 Ash'] },
  { id: 'q3_titan_forge',      title: 'Rekindling the Great Hearth', description: 'Extinguish the runaway steam pressure valves in the Infernal Foundry.', rewards: ['Titan Ingot', '5000 Ash'] },
  { id: 'q4_mother_seed',      title: 'The Uncorrupted Seed',        description: 'Purify the central root tomb within the Verdant Grave.', rewards: ['Verdant Bloom', '6000 Ash'] },
  { id: 'q5_astral_observatory',title: 'Cartography of Constellations', description: 'Chart the falling comet trajectories from Astral Citadel spires.', rewards: ['Astral Sextant', '7500 Ash'] },
  { id: 'q6_permafrost_thaw',  title: 'Warmth of the Ancient Flame', description: 'Carry the eternal hearth flame across the Frozen Dominion wastes.', rewards: ['Glacial Core', '9000 Ash'] },
  { id: 'q7_broken_escapement',title: 'The Stopped Pendulum',        description: 'Realign the broken master gear inside the Clockwork Expanse.', rewards: ['Chrono Gear', '10000 Ash'] },
  { id: 'q8_void_stabilizer',  title: 'Anchors of Reality',          description: 'Deploy 4 dimensional anchors across the Shattered Void fissures.', rewards: ['Void Shard', '12000 Ash'] },
  { id: 'q9_sand_dynasty',     title: 'Scepter of the Sand Sovereign', description: 'Uncover the buried tomb entrance in the Sunken Sands dunes.', rewards: ['Solar Relic', '15000 Ash'] },
  { id: 'q10_apotheosis',      title: 'The First Spark of Ash',      description: 'Face the First God at the apex of the Final Pantheon.', rewards: ['Godslayer Sigil', '25000 Ash'] },
]);

// ═════════════════════════════════════════════════════════════════════════════
// 10. ACCEPTANCE CHECKLIST (18 Items)
// ═════════════════════════════════════════════════════════════════════════════

export const OVERDRIVE_CHECKLIST = Object.freeze([
  // Performance & Stability (6)
  { id: 'chk_p01_profiler',     label: 'Diagnostic profiler tracks 60 FPS, frame time ms, and spike detection.', ready: true, category: 'Performance' },
  { id: 'chk_p02_culling',      label: '2D & 3D frustum culling avoids rendering offscreen entities.', ready: true, category: 'Performance' },
  { id: 'chk_p03_pooling',      label: 'Object pools recycle projectiles, particles, numbers, and enemies.', ready: true, category: 'Performance' },
  { id: 'chk_p04_ai_scheduler', label: '5-tier AI scheduler regulates CPU budgets based on distance.', ready: true, category: 'Performance' },
  { id: 'chk_p05_save_safety',  label: 'Save migration validates fields, provides backup store, and logs ISO errors.', ready: true, category: 'Performance' },
  { id: 'chk_p06_benchmarks',   label: 'Automated benchmark scenarios validate 60 FPS targets across stress loads.', ready: true, category: 'Performance' },

  // Content Expansion (6)
  { id: 'chk_c01_chapters300',  label: 'Chapters 21–30 define 100 new campaign levels (201–300).', ready: true, category: 'Content' },
  { id: 'chk_c02_spells32',     label: '8 elemental schools define 32 spells with unique scaling & modifiers.', ready: true, category: 'Content' },
  { id: 'chk_c03_weapons16',    label: '16 weapon categories and 8 legendary weapons with unique perks.', ready: true, category: 'Content' },
  { id: 'chk_c04_enemies50',    label: '50 new enemies across 10 families and 10 elite modifiers.', ready: true, category: 'Content' },
  { id: 'chk_c05_world_bosses', label: '6 background world bosses with dynamic encounter loops.', ready: true, category: 'Content' },
  { id: 'chk_c06_modes12',      label: '12 new game modes and special level archetypes operational.', ready: true, category: 'Content' },

  // Combat & Interface (6)
  { id: 'chk_b01_multibar_hp',  label: 'Multi-stage boss health handles Main, Armor, Shield, and Stagger layers.', ready: true, category: 'Boss Combat' },
  { id: 'chk_b02_multiphase',   label: 'Multi-phase boss controller executes transitions, i-frames, and hazards.', ready: true, category: 'Boss Combat' },
  { id: 'chk_b03_spell_engine', label: 'Spell casting engine manages mana pool, cooldowns, and elemental damage.', ready: true, category: 'Boss Combat' },
  { id: 'chk_u01_overdrive_hub',label: 'Overdrive Hub UI allows tab navigation across all new expansion content.', ready: true, category: 'Interface' },
  { id: 'chk_u02_profiler_hud', label: 'Real-time diagnostic profiler HUD overlay displays live performance.', ready: true, category: 'Interface' },
  { id: 'chk_u03_compat_tests', label: 'Zero-regression test suite verifies all new and legacy campaign modules.', ready: true, category: 'Interface' },
]);

// ═════════════════════════════════════════════════════════════════════════════
// 11. PROGRESSION & SANITIZATION
// ═════════════════════════════════════════════════════════════════════════════

export function defaultOverdriveProgress() {
  return {
    highestLevel: 201,
    clearedLevels: [],
    unlockedModes: ['world_boss_hunt', 'endless_descent'],
    spellAffinity: {
      storm: 1,
      void: 1,
      nature: 1,
      infernal: 1,
      frost: 1,
      celestial: 1,
      blood: 1,
      chronomancy: 1,
    },
    ownedSpells: ['storm_lightning_chain', 'infernal_flame_wave', 'frost_ice_spear'],
    completedQuests: [],
    activeQuests: ['q1_sunkencrown'],
    bossesDefeated: [],
    legendaryWeaponsFound: [],
  };
}

export function sanitizeOverdriveProgress(saved) {
  const def = defaultOverdriveProgress();
  if (!saved || typeof saved !== 'object') return def;

  return {
    ...def,
    ...saved,
    highestLevel: typeof saved.highestLevel === 'number' ? Math.max(201, Math.min(300, saved.highestLevel)) : def.highestLevel,
    clearedLevels: Array.isArray(saved.clearedLevels) ? saved.clearedLevels : def.clearedLevels,
    unlockedModes: Array.isArray(saved.unlockedModes) ? saved.unlockedModes : def.unlockedModes,
    completedQuests: Array.isArray(saved.completedQuests) ? saved.completedQuests : def.completedQuests,
    activeQuests: Array.isArray(saved.activeQuests) ? saved.activeQuests : def.activeQuests,
    bossesDefeated: Array.isArray(saved.bossesDefeated) ? saved.bossesDefeated : def.bossesDefeated,
    legendaryWeaponsFound: Array.isArray(saved.legendaryWeaponsFound) ? saved.legendaryWeaponsFound : def.legendaryWeaponsFound,
  };
}
