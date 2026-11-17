// Ashen Vow — The Fivefold Trials
// Pure, deterministic biome-combat layer: every labyrinth biome gets five
// standard levels (20 enemies / 4 archetypes / exactly 1 elite) before its boss.
// No DOM, no timers, no randomness outside the seeded helpers.

export const TRIALS_VERSION = '1.0.0';
export const TRIALS_NAME = 'The Fivefold Trials — Puzzlebound Realms';
export const TRIALS_PROGRESS_VERSION = 1;
export const TRIAL_LEVELS_PER_BIOME = 5;
export const TRIAL_ENEMIES_PER_LEVEL = 20;
export const TRIAL_ARCHETYPES_PER_LEVEL = 4;
export const TRIAL_WAVE_SIZE = 5;

const ARCHETYPE_SET = ['crawler', 'sentinel', 'brute', 'wraith', 'stalker', 'sporeling'];

// Compact, data-driven biome table. `roster` names the four archetypes used by
// every level in the biome; `elites` supplies the one guaranteed elite per level.
const BIOME_SOURCE = [
  {
    id: 'forgotten_crypt', name: 'The Forgotten Crypt', localName: 'Kripta Terlupakan',
    levels: ['Broken Tombs', 'Hall of Coffins', 'Forgotten Chapel', 'Royal Catacombs', "King's Passage"],
    roster: ['Bone Dagger', 'Tomb Archer', 'Crypt Crawler', 'Grave Guard'],
    elites: ['Royal Bone Reaper', 'Cursed Coffin Knight', 'Hollow Archbishop', 'Fallen Royal Executioner', 'Gravebound Champion'],
    boss: { id: 'gravebound_king', name: 'Gravebound King', title: 'The Crown Beneath the Stone', hp: 2600, phases: 3 },
  },
  {
    id: 'ember_maw', name: 'Ember Maw', localName: 'Mulut Bara',
    levels: ['Ashen Entrance', 'Molten Crossing', 'Furnace Chambers', 'Scorched Cathedral', "Devourer's Trail"],
    roster: ['Ember Imp', 'Ash Crawler', 'Coal Bat', 'Flame Gnawer'],
    elites: ['Infernal Stalker', 'Magma Berserker', 'Ironfire Executioner', 'Cathedral Pyromancer', 'Ancient Flame Tyrant'],
    boss: { id: 'magma_devourer', name: 'Magma Devourer', title: 'The Throat of the World', hp: 2900, phases: 3 },
  },
  {
    id: 'drowned_sanctuary', name: 'The Drowned Sanctuary', localName: 'Tempat Suci Tenggelam',
    levels: ['Flooded Entrance', 'Sunken Halls', 'Broken Aquarium', "Oracle's Garden", 'Temple of Tides'],
    roster: ['Drowned Walker', 'Bubble Crawler', 'Reef Dagger', 'Water Sprite'],
    elites: ['Drowned Assassin', 'Deepwater Champion', 'Abyssal Harpooner', "Oracle's Chosen", 'Tidal Executioner'],
    boss: { id: 'drowned_oracle', name: 'The Drowned Oracle', title: 'Voice Beneath the Tide', hp: 3000, phases: 4 },
  },
  {
    id: 'broken_clock', name: 'The Broken Clock', localName: 'Jam yang Rusak',
    levels: ['Gearworks', 'Pendulum Hall', 'Frozen Seconds', "The Mechanist's Lab", 'Final Countdown'],
    roster: ['Gearling', 'Clockwork Rat', 'Brass Drone', 'Spring Knight'],
    elites: ['Iron Gear Reaper', 'Chrono Duelist', 'Stasis Warden', 'Grand Automaton', 'Eternal Mechanist'],
    boss: { id: 'last_clockmaker', name: 'The Last Clockmaker', title: 'Keeper of the Final Second', hp: 3100, phases: 4 },
  },
  {
    id: 'rootbound_prison', name: 'Rootbound Prison', localName: 'Penjara Akar',
    levels: ['Root Tunnel', 'Spore Garden', 'The Poison Grove', 'Ancient Canopy', "Mother's Domain"],
    roster: ['Thornling', 'Root Crawler', 'Mushroom Dagger', 'Vine Bat'],
    elites: ['Thornblade Stalker', 'Giant Mushroom Dark Blade', 'Blightroot Assassin', 'Ancient Treant Knight', 'Corrupted Grove Champion'],
    boss: { id: 'rootbound_mother', name: 'The Rootbound Mother', title: 'Root of All Cages', hp: 3200, phases: 3 },
  },
  {
    id: 'crystal_exile', name: 'Crystal Exile', localName: 'Pengasingan Kristal',
    levels: ['Crystal Entry', 'Mirror Chambers', 'Resonance Vault', 'Broken Crown', "Monarch's Stair"],
    roster: ['Crystal Mite', 'Shard Dagger', 'Prism Bat', 'Crystal Crawler'],
    elites: ['Shard Reaper', 'Mirror Executioner', 'Resonance Colossus', 'Royal Shard Knight', 'Shattered Champion'],
    boss: { id: 'shattered_monarch', name: 'The Shattered Monarch', title: 'Crown of a Thousand Shards', hp: 3300, phases: 4 },
  },
  {
    id: 'frozen_sepulcher', name: 'The Frozen Sepulcher', localName: 'Makam Beku',
    levels: ['Snowbound Gate', 'Icebound Halls', 'Frozen Gardens', 'Winter Throne', 'Eternal Winter'],
    roster: ['Frostling', 'Ice Bat', 'Snow Crawler', 'Frozen Soldier'],
    elites: ['Frost Reaper', 'Glacier Duelist', 'Pale Garden Keeper', 'Frozen Royal Champion', 'Eternal Frostblade'],
    boss: { id: 'winter_revenant', name: 'The Winter Revenant', title: 'What the Cold Kept', hp: 3400, phases: 3 },
  },
  {
    id: 'buried_sun', name: 'The Buried Sun', localName: 'Matahari Terkubur',
    levels: ['Sand Tombs', 'Sunken Palace', 'Temple of Mirrors', 'Burning Oasis', "Pharaoh's Ascent"],
    roster: ['Sandling', 'Scarab', 'Dust Archer', 'Tomb Crawler'],
    elites: ['Golden Scarab Knight', 'Royal Sun Executioner', 'Prism Pharaoh Knight', 'Burning Sun Champion', 'Eternal Sand Warden'],
    boss: { id: 'solar_pharaoh', name: 'The Solar Pharaoh', title: 'The Sun That Would Not Set', hp: 3500, phases: 4 },
  },
  {
    id: 'fractured_void', name: 'The Fractured Void', localName: 'Kekosongan Terbelah',
    levels: ['Rift Entrance', 'Broken Reality', 'Lost Dimensions', 'Shattered Memory', 'The Unwritten Gate'],
    roster: ['Voidling', 'Rift Bat', 'Shadow Dagger', 'Rift Crawler'],
    elites: ['Riftblade', 'Phase Executioner', 'Dimension Reaver', 'Memory Devourer', 'Paradox Champion'],
    boss: { id: 'unwritten_one', name: 'The Unwritten One', title: 'The Name Erased From Ash', hp: 3600, phases: 4 },
  },
  {
    id: 'cathedral_ash', name: 'Cathedral of Ash', localName: 'Katedral Abu',
    levels: ['Fallen Nave', 'Bell Tower', 'Relic Chambers', 'Broken Sanctuary', "Archbishop's Road"],
    roster: ['Fallen Acolyte', 'Ash Bat', 'Chapel Guard', 'Ember Wraith'],
    elites: ['Ashen Inquisitor', 'Bell Executioner', 'Relic Warden', 'Hollow Templar', 'Cathedral Champion'],
    boss: { id: 'ashen_archbishop', name: 'The Ashen Archbishop', title: 'Shepherd of the Burned Flock', hp: 3700, phases: 4 },
  },
  {
    id: 'mycelium_depths', name: 'Mycelium Depths', localName: 'Kedalaman Miselium',
    levels: ['Spore Nursery', 'Fungal Bridge', 'Rotting Gallery', 'Mushroom Citadel', 'Heart of Spores'],
    roster: ['Sporeling Dagger', 'Mycelial Caster', 'Fungal Crawler', 'Mushroom Guard'],
    elites: ['Giant Spore Reaper', 'Rotcap Champion', 'Citadel Warden', 'Mycelial Executioner', 'Heart of Spores'],
    boss: { id: 'spore_sovereign', name: 'Spore Sovereign', title: 'The First Bloom', hp: 3800, phases: 4 },
  },
  {
    id: 'abyssal_trench', name: 'Abyssal Trench', localName: 'Palung Abyssal',
    levels: ['Sunken Passage', 'Eel Caverns', 'Blackwater Garden', "Leviathan's Bones", 'Deepest Descent'],
    roster: ['Trench Walker', 'Spectral Eel', 'Blackwater Crawler', 'Deep Guard'],
    elites: ['Abyssal Reaper', 'Eel Cavern Champion', 'Leviathan Executioner', 'Trench Warden', 'Deepest One'],
    boss: { id: 'trench_leviathan', name: 'Trench Leviathan', title: 'The Pressure Made Flesh', hp: 3900, phases: 4 },
  },
  {
    id: 'endless_archive', name: 'The Endless Archive', localName: 'Arsip Tanpa Akhir',
    levels: ['Dusty Entrance', 'Living Shelves', 'Ink Workshop', 'Forgotten Manuscripts', 'Grand Reading Hall'],
    roster: ['Ink Spider', 'Living Book', 'Dust Scholar', 'Shelf Warden'],
    elites: ['Ink Reaper', 'Shelf Executioner', 'Manuscript Champion', 'Reading Hall Warden', 'Librarian Eternal'],
    boss: { id: 'librarian_eternal', name: 'Librarian Eternal', title: 'The Last Page Never Ends', hp: 4000, phases: 3 },
  },
  {
    id: 'battlefield_echoes', name: 'Battlefield of Echoes', localName: 'Medan Gema',
    levels: ['Broken Frontline', 'Phantom Camp', 'War Machine Yard', 'Fallen Command', 'Last Battlefield'],
    roster: ['Echo Soldier', 'Phantom Rider', 'War Hound', 'Broken Standard'],
    elites: ['Frontline Reaper', 'Phantom Champion', 'War Machine Executioner', 'Fallen Commander', 'Nameless General'],
    boss: { id: 'nameless_general', name: 'Nameless General', title: 'The Order Nobody Gave', hp: 4100, phases: 4 },
  },
  {
    id: 'iron_gaol', name: 'The Iron Gaol', localName: 'Penjara Besi',
    levels: ['Prison Gate', 'Chain Halls', 'Torture Chambers', "Warden's Quarters", 'Execution Grounds'],
    roster: ['Gaol Crawler', 'Chainsworn', 'Iron Archer', 'Prison Guard'],
    elites: ['Gate Reaper', 'Chain Executioner', 'Torture Warden', 'Warden Champion', 'Unbroken Jailer'],
    boss: { id: 'unbroken_jailer', name: 'Unbroken Jailer', title: 'The Lock That Learned', hp: 4200, phases: 4 },
  },
  {
    id: 'astral_observatory', name: 'Astral Observatory', localName: 'Observatorium Astral',
    levels: ['Star Entrance', 'Orbital Gallery', 'Celestial Library', 'Gravity Chamber', 'Observatory Core'],
    roster: ['Star Hunter', 'Orbit Wisp', 'Celestial Scribe', 'Gravity Mite'],
    elites: ['Star Reaper', 'Orbital Champion', 'Celestial Executioner', 'Gravity Warden', 'Star Eater'],
    boss: { id: 'star_eater', name: 'Star Eater', title: 'The Hunger Between Suns', hp: 4300, phases: 4 },
  },
  {
    id: 'hollow_ballroom', name: 'The Hollow Ballroom', localName: 'Balai Rongga',
    levels: ['Abandoned Foyer', 'Dance Hall', 'Mirror Gallery', 'Royal Banquet', "Queen's Chamber"],
    roster: ['Possessed Noble', 'Phantom Dancer', 'Mirror Servant', 'Hollow Musician'],
    elites: ['Foyer Reaper', 'Dance Champion', 'Mirror Executioner', 'Banquet Warden', 'Masked Queen'],
    boss: { id: 'masked_queen', name: 'Masked Queen', title: 'The Last Dance Without Music', hp: 4400, phases: 3 },
  },
  {
    id: 'heart_colossus', name: 'Heart of the Colossus', localName: 'Jantung Raksasa',
    levels: ['Stone Entrance', "Giant's Veins", 'Ancient Ribs', 'Living Core', 'Colossus Crown'],
    roster: ['Stone Crawler', 'Vein Warden', 'Rib Archer', 'Living Statue'],
    elites: ['Stone Reaper', 'Vein Champion', 'Rib Executioner', 'Living Core Warden', 'Walking Mountain'],
    boss: { id: 'walking_mountain', name: 'Walking Mountain', title: 'The Heart That Refused', hp: 4500, phases: 4 },
  },
  {
    id: 'demon_foundry', name: 'The Demon Foundry', localName: 'Peleburan Iblis',
    levels: ['Furnace Gate', 'Weapon Workshop', 'Demon Barracks', 'Infernal Assembly', "Sovereign's Forge"],
    roster: ['Forge Imp', 'Molten Smith', 'Cursed Blade', 'Demon Guard'],
    elites: ['Furnace Reaper', 'Workshop Champion', 'Barracks Executioner', 'Assembly Warden', 'Forge Sovereign'],
    boss: { id: 'forge_sovereign', name: 'Forge Sovereign', title: 'The Hammer That Dreams', hp: 4600, phases: 4 },
  },
  {
    id: 'last_labyrinth', name: 'The Last Labyrinth', localName: 'Labirin Terakhir',
    levels: ['Shifting Entrance', 'Trial Corridor', 'Forgotten Arena', "Architect's Workshop", 'Eternal Threshold'],
    roster: ['Labyrinth Shade', 'Trial Warden', 'Forgotten Duelist', 'Threshold Guard'],
    elites: ['Shifting Reaper', 'Trial Champion', 'Forgotten Executioner', 'Architect Warden', 'Labyrinth Architect'],
    boss: { id: 'labyrinth_architect', name: 'Labyrinth Architect', title: 'The Door With No Other Side', hp: 4800, phases: 5 },
  },
];

const LEVEL_ADJECTIVES = ['Risen', 'Cursed', 'Shattered', 'Ancient', 'Eternal'];

export const TRIAL_BIOMES = BIOME_SOURCE.map((biome, index) => {
  const archetypes = ARCHETYPE_SET.slice(index % 2, (index % 2) + 4);
  const levels = biome.levels.map((name, levelIndex) => ({
    id: `${biome.id}_${levelIndex + 1}`,
    index: levelIndex,
    name,
    localName: name,
    theme: name,
    adjective: LEVEL_ADJECTIVES[levelIndex],
    archetypes: archetypes.map((type, slot) => ({
      type,
      name: slot === 0 ? biome.roster[0] : biome.roster[slot] || `${biome.name} ${type}`,
      label: `${LEVEL_ADJECTIVES[levelIndex]} ${biome.roster[slot] || type}`,
    })),
    elite: {
      name: biome.elites[levelIndex],
      type: archetypes[0],
      rank: ['E2', 'E3', 'E4', 'E5', 'E6'][levelIndex],
      hpScale: 1.9 + levelIndex * 0.35,
      dmgScale: 1.35 + levelIndex * 0.15,
    },
    boss: null,
    biomeId: biome.id,
  }));
  return {
    id: biome.id,
    index,
    name: biome.name,
    localName: biome.localName,
    boss: { ...biome.boss, biomeId: biome.id, phases: biome.boss.phases },
    levels,
    archetypes,
    stages: levels.length,
  };
});

export const TRIAL_BIOME_BY_ID = Object.fromEntries(TRIAL_BIOMES.map((biome) => [biome.id, biome]));
export const TRIAL_LEVELS = TRIAL_BIOMES.flatMap((biome) => biome.levels);
export const TRIAL_BOSSES = TRIAL_BIOMES.map((biome) => biome.boss);
export const TRIAL_BOSS_BY_ID = Object.fromEntries(TRIAL_BOSSES.map((boss) => [boss.id, boss]));

export function trialBiomeForLevel(levelId) {
  return TRIAL_BIOMES.find((biome) => biome.levels.some((level) => level.id === levelId)) || null;
}

/**
 * Build the 20-enemy encounter for one standard level. Four archetypes receive
 * five slots each; the fifth slot of the first archetype is replaced by the
 * guaranteed elite, so the elite is one of the twenty, never an extra spawn.
 */
export function buildEncounter(level) {
  if (!level) return null;
  const types = level.archetypes.map((entry) => entry.type);
  const units = [];
  for (let slot = 0; slot < TRIAL_ENEMIES_PER_LEVEL; slot += 1) {
    const archetype = level.archetypes[slot % TRIAL_ARCHETYPES_PER_LEVEL];
    const isElite = slot === TRIAL_ENEMIES_PER_LEVEL - 1;
    units.push({
      id: `${level.id}_${slot}`,
      type: archetype.type,
      name: isElite ? level.elite.name : `${level.adjective} ${archetype.name}`,
      archetype: archetype.type,
      elite: isElite,
      eliteRank: isElite ? level.elite.rank : null,
      hpScale: isElite ? level.elite.hpScale : 1 + level.index * 0.08,
      dmgScale: isElite ? level.elite.dmgScale : 1 + level.index * 0.06,
      wave: Math.floor(slot / TRIAL_WAVE_SIZE),
      slot: slot % TRIAL_WAVE_SIZE,
    });
  }
  return {
    levelId: level.id,
    biomeId: level.biomeId,
    total: units.length,
    archetypes: [...new Set(units.map((unit) => unit.archetype))],
    units,
    waves: Array.from({ length: Math.ceil(units.length / TRIAL_WAVE_SIZE) }, (_, wave) =>
      units.filter((unit) => unit.wave === wave)),
  };
}

/** Structural validator used by tests, the hub and the level generator. */
export function validateEncounter(encounter) {
  const errors = [];
  if (!encounter || !Array.isArray(encounter.units)) return { ok: false, errors: ['encounter missing'] };
  const units = encounter.units;
  if (units.length !== TRIAL_ENEMIES_PER_LEVEL) errors.push(`expected 20 enemies, got ${units.length}`);
  const archetypes = new Set(units.map((unit) => unit.archetype));
  if (archetypes.size !== TRIAL_ARCHETYPES_PER_LEVEL) errors.push(`expected 4 archetypes, got ${archetypes.size}`);
  const elites = units.filter((unit) => unit.elite).length;
  if (elites !== 1) errors.push(`expected exactly 1 elite, got ${elites}`);
  if (units.filter((unit) => !unit.elite).length !== TRIAL_ENEMIES_PER_LEVEL - 1) errors.push('normal enemy count must be 19');
  if (units.some((unit) => unit.boss)) errors.push('standard levels cannot contain bosses');
  for (const unit of units) {
    if (!ARCHETYPE_SET.includes(unit.archetype)) errors.push(`unknown archetype ${unit.archetype}`);
    if (!unit.name) errors.push('enemy without a name');
    if (unit.elite && !unit.eliteRank) errors.push('elite without a rank');
  }
  return { ok: errors.length === 0, errors };
}

/** The boss only opens after all five levels of that biome are cleared. */
export function trialBossUnlocked(progress, biomeId) {
  const biome = TRIAL_BIOME_BY_ID[biomeId];
  if (!biome) return false;
  const cleared = progress?.cleared?.[biomeId] || [];
  return biome.levels.every((_, index) => !!cleared[index]);
}

export function trialLevelUnlocked(progress, biomeId, levelIndex) {
  const biome = TRIAL_BIOME_BY_ID[biomeId];
  if (!biome || levelIndex < 0 || levelIndex >= biome.levels.length) return false;
  if (levelIndex === 0) return true;
  const cleared = progress?.cleared?.[biomeId] || [];
  return !!cleared[levelIndex - 1];
}

export function trialArena(biome, level) {
  const palette = {
    top: '#171611', mid: biome?.color || '#8a8f7a', low: '#08070a',
    fog: biome?.color || '#8a8f7a', glow: biome?.color || '#8a8f7a', accent: biome?.color || '#8a8f7a',
  };
  const offset = (level?.index || 0) * 26;
  return {
    id: `trial_${level?.id || 'arena'}`,
    index: 900000 + (biome?.index || 0) * 10 + (level?.index || 0),
    name: `${biome?.localName || biome?.name} · ${level?.name || 'Trial'}`,
    subtitle: `${level?.adjective || ''} ${biome?.name || ''}`.trim(),
    spawn: { x: 120, y: 470 - 46 },
    platforms: [
      { x: 0, y: 470, w: 1500, h: 70 },
      { x: 190 + offset, y: 372, w: 160, h: 18 },
      { x: 520, y: 320, w: 180, h: 18 },
      { x: 860 - offset, y: 300, w: 150, h: 18 },
      { x: 1160, y: 360, w: 180, h: 18 },
    ],
    gates: [],
    enemies: [],
    hazards: level?.index >= 3 ? [{ type: 'saw', x: 700, y: 414, w: 48, h: 48, dmg: 12 + level.index * 2, range: 320, originX: 700, speed: 110 }] : [],
    palette,
    biome: 'labyrinth',
    labyrinth: true,
    zoneId: biome?.id,
    music: 'ashen',
    lore: biome ? `${biome.name} · ${level?.name}` : '',
    secret: false,
    collectibles: [],
  };
}

export function trialBossOverrides(boss, options = {}) {
  const hp = Math.round((boss?.hp || 2600) * (Number(options.difficulty) || 1));
  return {
    name: boss?.name || 'Trial Warden',
    title: boss?.title || 'Keeper of the Fivefold Gate',
    maxHp: hp,
    maxPhases: boss?.phases || 3,
    phaseThresholds: boss?.phases >= 5 ? [0.8, 0.6, 0.4, 0.2] : boss?.phases === 4 ? [0.75, 0.5, 0.25] : boss?.phases === 3 ? [0.66, 0.33] : [0.5],
    w: 132,
    h: 140,
    contact: 18,
    pattern: ['slam', 'volley', 'ring', 'charge', 'summon'][(boss?.index || 0) % 5],
    color: null,
    spawn: { x: 760, y: 470 - 140 },
    reward: 'trial',
  };
}

export function defaultTrialProgress() {
  const cleared = {};
  for (const biome of TRIAL_BIOMES) cleared[biome.id] = biome.levels.map(() => false);
  return {
    version: TRIALS_PROGRESS_VERSION,
    cleared,
    bosses: [],
    rewards: {},
    best: { level: '', time: 0, noHit: [] },
    stats: { levels: 0, bosses: 0, enemies: 0, deaths: 0, elites: 0 },
  };
}

export function sanitizeTrialProgress(raw) {
  const base = defaultTrialProgress();
  if (!raw || typeof raw !== 'object') return base;
  const count = (value) => (Number.isFinite(Number(value)) ? Math.max(0, Math.round(Number(value))) : 0);
  for (const biome of TRIAL_BIOMES) {
    const source = Array.isArray(raw.cleared?.[biome.id]) ? raw.cleared[biome.id] : [];
    // A level can only be cleared if every previous level is cleared too.
    let open = true;
    base.cleared[biome.id] = biome.levels.map((_, index) => {
      const cleared = open && !!source[index];
      if (!cleared) open = false;
      return cleared;
    });
  }
  base.bosses = Array.isArray(raw.bosses)
    ? [...new Set(raw.bosses.filter((id) => TRIAL_BIOME_BY_ID[id] && trialBossUnlocked(base, id)))]
    : [];
  base.rewards = {};
  if (raw.rewards && typeof raw.rewards === 'object') {
    for (const id of Object.keys(raw.rewards)) {
      if (TRIAL_BIOME_BY_ID[id]) base.rewards[id] = raw.rewards[id] === true;
    }
  }
  const best = raw.best && typeof raw.best === 'object' ? raw.best : {};
  base.best = {
    level: typeof best.level === 'string' ? best.level : '',
    time: count(best.time),
    noHit: Array.isArray(best.noHit) ? [...new Set(best.noHit.filter((id) => TRIAL_LEVELS.some((level) => level.id === id)))] : [],
  };
  for (const key of Object.keys(base.stats)) base.stats[key] = count(raw.stats?.[key]);
  for (const [key, value] of Object.entries(raw)) if (!(key in base)) base[key] = value;
  return base;
}

export function recordTrialClear(rawProgress, levelId, summary = {}) {
  const progress = sanitizeTrialProgress(rawProgress);
  const biome = trialBiomeForLevel(levelId);
  const level = biome?.levels.find((entry) => entry.id === levelId);
  if (!biome || !level) return { progress, firstClear: false, biome, level };
  const firstClear = !progress.cleared[biome.id][level.index];
  // Ignore out-of-order clears rather than corrupting the chain.
  if (!trialLevelUnlocked(progress, biome.id, level.index)) return { progress, firstClear: false, biome, level, blocked: true };
  progress.cleared[biome.id][level.index] = true;
  if (firstClear) {
    progress.stats.levels += 1;
    progress.stats.enemies += TRIAL_ENEMIES_PER_LEVEL;
    progress.stats.elites += 1;
  }
  const time = Math.max(0, Math.round(Number(summary.time) || 0));
  if (time && (!progress.best.time || time < progress.best.time)) {
    progress.best.time = time;
    progress.best.level = levelId;
  }
  if (summary.noHit && !progress.best.noHit.includes(levelId)) progress.best.noHit.push(levelId);
  return { progress, firstClear, biome, level, bossUnlocked: trialBossUnlocked(progress, biome.id) };
}

/** Boss rewards are one-shot; replaying a cleared boss never pays twice. */
export function recordTrialBoss(rawProgress, biomeId) {
  const progress = sanitizeTrialProgress(rawProgress);
  if (!trialBossUnlocked(progress, biomeId)) return { progress, firstClear: false, reward: null };
  const firstClear = !progress.bosses.includes(biomeId) && !progress.rewards[biomeId];
  if (!firstClear) return { progress, firstClear: false, reward: null };
  progress.bosses.push(biomeId);
  progress.rewards[biomeId] = true;
  progress.stats.bosses += 1;
  return {
    progress,
    firstClear: true,
    reward: {
      id: `trial_reward_${biomeId}`,
      biomeId,
      ash: 400 + (TRIAL_BIOME_BY_ID[biomeId]?.index || 0) * 40,
      shards: 6 + Math.floor((TRIAL_BIOME_BY_ID[biomeId]?.index || 0) / 2),
      name: `${TRIAL_BIOME_BY_ID[biomeId]?.name} Sigil`,
    },
  };
}

export function trialSummary(progress) {
  const clearedLevels = TRIAL_BIOMES.reduce((total, biome) => total + (progress.cleared[biome.id] || []).filter(Boolean).length, 0);
  return {
    biomes: TRIAL_BIOMES.length,
    levels: TRIAL_LEVELS.length,
    clearedLevels,
    bosses: progress.bosses.length,
    levelsPerBiome: TRIAL_LEVELS_PER_BIOME,
    enemies: TRIAL_LEVELS.length * TRIAL_ENEMIES_PER_LEVEL,
    elites: TRIAL_LEVELS.length,
    completion: Math.round((clearedLevels / TRIAL_LEVELS.length) * 100),
  };
}

export function biomeProgress(progress, biomeId) {
  const biome = TRIAL_BIOME_BY_ID[biomeId];
  if (!biome) return null;
  const cleared = (progress?.cleared?.[biomeId] || []).filter(Boolean).length;
  return {
    biome,
    cleared,
    total: biome.levels.length,
    bossUnlocked: trialBossUnlocked(progress, biomeId),
    bossCleared: (progress?.bosses || []).includes(biomeId),
    percent: Math.round((cleared / biome.levels.length) * 100),
  };
}

/** Builds the next wave on demand; enemies never exceed twenty per level. */
export function waveForEncounter(encounter, waveIndex) {
  if (!encounter || waveIndex < 0 || waveIndex >= encounter.waves.length) return [];
  return encounter.waves[waveIndex];
}
