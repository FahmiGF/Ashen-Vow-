// Ashen Vow — boss_overdrive.js
// Multi-Stage Boss Health & Phase Revamp + Spell Casting Engine
// Pure logic: zero DOM / audio dependencies. Runs in Node and browser.

'use strict';

import { SPELL_BY_ID as OVERDRIVE_SPELL_BY_ID } from './overdrive.js';

// ═══════════════════════════════════════════════════════════════════════════════
// §1  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const BOSS_OVERDRIVE_VERSION = '1.0.0';

/** Damage types */
export const DMG_TYPE = Object.freeze({
  PHYSICAL: 'physical',
  FIRE:     'fire',
  ICE:      'ice',
  LIGHTNING:'lightning',
  VOID:     'void',
  NATURE:   'nature',
  BLOOD:    'blood',
  CHRONO:   'chrono',
  CELESTIAL:'celestial',
  INFERNAL: 'infernal',
  TRUE:     'true',   // bypasses all resistance / armor
});

/** Status effects */
export const STATUS = Object.freeze({
  STUNNED:    'stunned',
  BURNING:    'burning',
  FROZEN:     'frozen',
  POISONED:   'poisoned',
  WEAKENED:   'weakened',
  ENRAGED:    'enraged',
  INVULNERABLE:'invulnerable',
  SHIELDED:   'shielded',
});

// ═══════════════════════════════════════════════════════════════════════════════
// §2  ELEMENTAL SPELL SCHOOLS — 8 schools × 4 spells each = 32 spells
// ═══════════════════════════════════════════════════════════════════════════════

export const SPELL_SCHOOLS = Object.freeze({
  STORM: 'storm',
  VOID:  'void',
  NATURE:'nature',
  INFERNAL:'infernal',
  FROST: 'frost',
  CELESTIAL:'celestial',
  BLOOD: 'blood',
  CHRONOMANCY:'chronomancy',
});

/** Base elemental damage multipliers applied to all spells of that school */
export const ELEMENTAL_MULTIPLIER = Object.freeze({
  [SPELL_SCHOOLS.STORM]:       1.10,
  [SPELL_SCHOOLS.VOID]:        1.25,
  [SPELL_SCHOOLS.NATURE]:      0.95,
  [SPELL_SCHOOLS.INFERNAL]:    1.15,
  [SPELL_SCHOOLS.FROST]:       1.05,
  [SPELL_SCHOOLS.CELESTIAL]:   1.20,
  [SPELL_SCHOOLS.BLOOD]:       1.00,
  [SPELL_SCHOOLS.CHRONOMANCY]: 0.85,
});

/**
 * Full spell catalogue.
 * Each entry: { id, name, school, manaCost, cooldown, baseDamage, modifier, desc }
 * modifier is a plain descriptor string; actual logic lives in SpellCastingEngine.
 */
export const SPELL_CATALOGUE = Object.freeze([
  // ── STORM ──────────────────────────────────────────────────────────────────
  { id:'storm_bolt',      name:'Thunderbolt',       school:SPELL_SCHOOLS.STORM,       manaCost:20, cooldown:1.5, baseDamage:55,  modifier:'chain_lightning', desc:'Strikes and chains to 2 nearby targets for 50% damage.' },
  { id:'storm_gale',      name:'Gale Slash',         school:SPELL_SCHOOLS.STORM,       manaCost:30, cooldown:2.5, baseDamage:70,  modifier:'knockback',        desc:'Wind blade that launches enemies.' },
  { id:'storm_tempest',   name:'Tempest Surge',      school:SPELL_SCHOOLS.STORM,       manaCost:50, cooldown:6.0, baseDamage:120, modifier:'aoe_field',        desc:'Persistent storm field, damages 3s.' },
  { id:'storm_maelstrom', name:'Maelstrom',          school:SPELL_SCHOOLS.STORM,       manaCost:80, cooldown:12.0,baseDamage:200, modifier:'pull_and_burst',   desc:'Pulls enemies inward then detonates.' },
  // ── VOID ───────────────────────────────────────────────────────────────────
  { id:'void_tear',       name:'Void Tear',          school:SPELL_SCHOOLS.VOID,        manaCost:25, cooldown:2.0, baseDamage:60,  modifier:'armor_pierce',     desc:'Ignores armor rating.' },
  { id:'void_collapse',   name:'Gravity Well',       school:SPELL_SCHOOLS.VOID,        manaCost:40, cooldown:5.0, baseDamage:80,  modifier:'gravity_well',     desc:'Singularity that traps enemies for 2s.' },
  { id:'void_rift',       name:'Void Rift',          school:SPELL_SCHOOLS.VOID,        manaCost:60, cooldown:8.0, baseDamage:150, modifier:'dimensional_tear', desc:'Opens rift, fires void lances for 4s.' },
  { id:'void_annihilate', name:'Annihilation',       school:SPELL_SCHOOLS.VOID,        manaCost:100,cooldown:15.0,baseDamage:350, modifier:'instant_kill_threshold', desc:'Kills enemies below 20% HP instantly.' },
  // ── NATURE ─────────────────────────────────────────────────────────────────
  { id:'nature_thorn',    name:'Thorn Spike',        school:SPELL_SCHOOLS.NATURE,      manaCost:15, cooldown:1.0, baseDamage:40,  modifier:'bleed',            desc:'Applies bleed (10 dmg/s, 3s).' },
  { id:'nature_entangle', name:'Root Entangle',      school:SPELL_SCHOOLS.NATURE,      manaCost:35, cooldown:5.0, baseDamage:30,  modifier:'root_2s',          desc:'Roots target for 2 seconds.' },
  { id:'nature_spore',    name:'Toxic Spore Cloud',  school:SPELL_SCHOOLS.NATURE,      manaCost:45, cooldown:7.0, baseDamage:60,  modifier:'poison_field',     desc:'Poison cloud 3s duration.' },
  { id:'nature_regrowth', name:'Regrowth',           school:SPELL_SCHOOLS.NATURE,      manaCost:50, cooldown:10.0,baseDamage:0,   modifier:'heal_over_time',   desc:'Heals caster 15 HP/s for 5s.' },
  // ── INFERNAL ───────────────────────────────────────────────────────────────
  { id:'infernal_ball',   name:'Splitting Fireball', school:SPELL_SCHOOLS.INFERNAL,    manaCost:30, cooldown:2.5, baseDamage:85,  modifier:'split_projectile', desc:'Splits into 3 mini-fireballs on impact.' },
  { id:'infernal_nova',   name:'Inferno Nova',       school:SPELL_SCHOOLS.INFERNAL,    manaCost:50, cooldown:6.0, baseDamage:110, modifier:'burn_aoe',         desc:'AoE burst, burning debuff 2s.' },
  { id:'infernal_pillar', name:'Hell Pillar',        school:SPELL_SCHOOLS.INFERNAL,    manaCost:65, cooldown:8.0, baseDamage:140, modifier:'persistent_fire',  desc:'Fire column lasts 3s.' },
  { id:'infernal_meteor', name:'Meteor Strike',      school:SPELL_SCHOOLS.INFERNAL,    manaCost:90, cooldown:14.0,baseDamage:280, modifier:'crater_fire',      desc:'Leaves burning crater for 5s.' },
  // ── FROST ──────────────────────────────────────────────────────────────────
  { id:'frost_shard',     name:'Frost Shard',        school:SPELL_SCHOOLS.FROST,       manaCost:18, cooldown:1.2, baseDamage:45,  modifier:'slow_30pct',       desc:'Slows target movement 30% for 2s.' },
  { id:'frost_wall',      name:'Frost Wall',         school:SPELL_SCHOOLS.FROST,       manaCost:40, cooldown:6.0, baseDamage:50,  modifier:'frost_wall',       desc:'Barrier of ice blocks movement 4s.' },
  { id:'frost_blizzard',  name:'Blizzard',           school:SPELL_SCHOOLS.FROST,       manaCost:60, cooldown:9.0, baseDamage:90,  modifier:'freeze_field',     desc:'Blizzard field, 4s duration.' },
  { id:'frost_absolute',  name:'Absolute Zero',      school:SPELL_SCHOOLS.FROST,       manaCost:95, cooldown:16.0,baseDamage:200, modifier:'freeze_solid',     desc:'Freezes target solid for 3s.' },
  // ── CELESTIAL ──────────────────────────────────────────────────────────────
  { id:'celestial_beam',  name:'Starfall Beam',      school:SPELL_SCHOOLS.CELESTIAL,   manaCost:35, cooldown:3.0, baseDamage:90,  modifier:'holy_burn',        desc:'Deals bonus damage to undead.' },
  { id:'celestial_aegis', name:'Celestial Aegis',    school:SPELL_SCHOOLS.CELESTIAL,   manaCost:45, cooldown:8.0, baseDamage:0,   modifier:'shield_buff',      desc:'Grants caster shield 50 HP for 6s.' },
  { id:'celestial_smite', name:'Divine Smite',       school:SPELL_SCHOOLS.CELESTIAL,   manaCost:60, cooldown:7.0, baseDamage:160, modifier:'stagger_heavy',    desc:'Heavy stagger on hit.' },
  { id:'celestial_nova',  name:'Supernova',          school:SPELL_SCHOOLS.CELESTIAL,   manaCost:110,cooldown:18.0,baseDamage:400, modifier:'full_screen_blast', desc:'Massive burst that fills the arena.' },
  // ── BLOOD ──────────────────────────────────────────────────────────────────
  { id:'blood_drain',     name:'Life Drain',         school:SPELL_SCHOOLS.BLOOD,       manaCost:20, cooldown:2.0, baseDamage:50,  modifier:'lifesteal_50pct',  desc:'Returns 50% of damage as HP.' },
  { id:'blood_lance',     name:'Crimson Lance',      school:SPELL_SCHOOLS.BLOOD,       manaCost:30, cooldown:3.0, baseDamage:75,  modifier:'penetrate',        desc:'Pierces through all enemies in line.' },
  { id:'blood_sacrifice', name:'Blood Sacrifice',    school:SPELL_SCHOOLS.BLOOD,       manaCost:0,  cooldown:12.0,baseDamage:200, modifier:'hp_cost_25pct',    desc:'Costs 25% current HP, no mana cost.' },
  { id:'blood_frenzy',    name:'Bloodlust Frenzy',   school:SPELL_SCHOOLS.BLOOD,       manaCost:70, cooldown:15.0,baseDamage:120, modifier:'aoe_lifesteal',    desc:'AoE, all hits restore HP.' },
  // ── CHRONOMANCY ────────────────────────────────────────────────────────────
  { id:'chrono_slow',     name:'Time Crawl',         school:SPELL_SCHOOLS.CHRONOMANCY, manaCost:30, cooldown:5.0, baseDamage:20,  modifier:'slow_field_50pct', desc:'Slows all enemies in zone by 50% for 3s.' },
  { id:'chrono_rewind',   name:'Temporal Rewind',    school:SPELL_SCHOOLS.CHRONOMANCY, manaCost:60, cooldown:12.0,baseDamage:0,   modifier:'rewind_self_2s',   desc:'Reverts caster state 2 seconds back.' },
  { id:'chrono_freeze',   name:'Timestop',           school:SPELL_SCHOOLS.CHRONOMANCY, manaCost:80, cooldown:14.0,baseDamage:0,   modifier:'freeze_time_2s',   desc:'Halts all enemies for 2 seconds.' },
  { id:'chrono_rupture',  name:'Chrono Rupture',     school:SPELL_SCHOOLS.CHRONOMANCY, manaCost:100,cooldown:18.0,baseDamage:300, modifier:'delay_burst',      desc:'Deals damage after 1s delay, ignores dodge.' },
]);

/** Map spell id → spell definition */
export const SPELL_BY_ID = Object.freeze(
  Object.fromEntries(SPELL_CATALOGUE.map(s => [s.id, s]))
);

// ═══════════════════════════════════════════════════════════════════════════════
// §3  BOSS DEFINITIONS — 8 major bosses
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Phase definition:
 *   { phaseIndex, hpThreshold, label, invulnFrames, arenaHazards,
 *     enrageMultiplier, abilities, summonType, summonCount }
 *
 * hpThreshold: 0–1 (fraction of MAIN HP at which this phase activates).
 *   Phase 0 starts at full HP.  Phases are listed in descending threshold order.
 */

export const BOSS_DEFINITIONS = Object.freeze({

  // ── Ashen Dragon (5 phases) ────────────────────────────────────────────────
  ashen_dragon: {
    id: 'ashen_dragon',
    name: 'Ashen Dragon',
    mainHp: 8000,
    armorHp: 1200,
    shieldHp: 0,
    staggerMax: 400,
    weaknessMeter: 300,
    enrageMax: 500,
    summonHp: 0,
    phases: [
      { phaseIndex:0, hpThreshold:1.00, label:'Dormant Flame',    invulnFrames:0,   arenaHazards:[],                           enrageMultiplier:1.00, abilities:['wing_buffet','fire_breath'],           summonType:null,       summonCount:0 },
      { phaseIndex:1, hpThreshold:0.80, label:'Rising Fury',      invulnFrames:90,  arenaHazards:['falling_ash'],               enrageMultiplier:1.10, abilities:['wing_buffet','fire_breath','tail_slam'], summonType:null,       summonCount:0 },
      { phaseIndex:2, hpThreshold:0.55, label:'Scorched Earth',   invulnFrames:120, arenaHazards:['falling_ash','lava_pools'],  enrageMultiplier:1.25, abilities:['fire_breath','cinder_rain','dive_bomb'], summonType:'cinder_minion', summonCount:3 },
      { phaseIndex:3, hpThreshold:0.30, label:'Infernal Ascent',  invulnFrames:150, arenaHazards:['lava_pools','fire_walls'],   enrageMultiplier:1.50, abilities:['nova_breath','cinder_rain','dive_bomb'], summonType:'cinder_minion', summonCount:5 },
      { phaseIndex:4, hpThreshold:0.10, label:'Final Conflagration',invulnFrames:180,arenaHazards:['lava_pools','fire_walls','meteor_rain'],enrageMultiplier:2.00,abilities:['nova_breath','mega_dive','fire_nova'],summonType:'elder_cinder',summonCount:2 },
    ],
  },

  // ── The Iron Colossus (4 phases) ──────────────────────────────────────────
  iron_colossus: {
    id: 'iron_colossus',
    name: 'The Iron Colossus',
    mainHp: 10000,
    armorHp: 3000,
    shieldHp: 0,
    staggerMax: 600,
    weaknessMeter: 500,
    enrageMax: 400,
    summonHp: 0,
    phases: [
      { phaseIndex:0, hpThreshold:1.00, label:'Iron Bastion',    invulnFrames:0,   arenaHazards:[],                                    enrageMultiplier:1.00, abilities:['ground_slam','cannon_volley'],          summonType:null,     summonCount:0 },
      { phaseIndex:1, hpThreshold:0.75, label:'Cracked Plating', invulnFrames:100, arenaHazards:['gear_spikes'],                        enrageMultiplier:1.15, abilities:['ground_slam','cannon_volley','shockwave'], summonType:'iron_drone', summonCount:4 },
      { phaseIndex:2, hpThreshold:0.45, label:'Molten Core',     invulnFrames:140, arenaHazards:['gear_spikes','steam_vents'],          enrageMultiplier:1.40, abilities:['overcharge_beam','shockwave','pile_drive'], summonType:'iron_drone', summonCount:6 },
      { phaseIndex:3, hpThreshold:0.15, label:'Overclock Surge', invulnFrames:180, arenaHazards:['gear_spikes','steam_vents','rail_gun'],enrageMultiplier:2.00, abilities:['overcharge_beam','pile_drive','rail_charge'],summonType:'siege_turret',summonCount:3 },
    ],
  },

  // ── The Hollow Broodmother (4 phases) ─────────────────────────────────────
  hollow_broodmother: {
    id: 'hollow_broodmother',
    name: 'The Hollow Broodmother',
    mainHp: 7500,
    armorHp: 500,
    shieldHp: 1000,
    staggerMax: 350,
    weaknessMeter: 250,
    enrageMax: 450,
    summonHp: 200,
    phases: [
      { phaseIndex:0, hpThreshold:1.00, label:'Brood Nesting',   invulnFrames:0,   arenaHazards:[],                                enrageMultiplier:1.00, abilities:['spit_acid','cocoon_web'],            summonType:'broodling',    summonCount:4 },
      { phaseIndex:1, hpThreshold:0.70, label:'Nesting Frenzy',  invulnFrames:90,  arenaHazards:['acid_pools'],                    enrageMultiplier:1.20, abilities:['spit_acid','cocoon_web','egg_burst'], summonType:'broodling',    summonCount:8 },
      { phaseIndex:2, hpThreshold:0.40, label:'Swarm Eruption',  invulnFrames:120, arenaHazards:['acid_pools','web_walls'],        enrageMultiplier:1.50, abilities:['venom_rain','egg_burst','lunge'],    summonType:'spider_guard',  summonCount:3 },
      { phaseIndex:3, hpThreshold:0.15, label:'Mother\'s Wrath', invulnFrames:160, arenaHazards:['acid_pools','web_walls','spore_cloud'],enrageMultiplier:2.00,abilities:['venom_rain','lunge','death_throes'],summonType:'spider_guard', summonCount:5 },
    ],
  },

  // ── The Watching Void (5 phases) ──────────────────────────────────────────
  watching_void: {
    id: 'watching_void',
    name: 'The Watching Void',
    mainHp: 9000,
    armorHp: 0,
    shieldHp: 2000,
    staggerMax: 300,
    weaknessMeter: 400,
    enrageMax: 600,
    summonHp: 350,
    phases: [
      { phaseIndex:0, hpThreshold:1.00, label:'Awakening Gaze',  invulnFrames:0,   arenaHazards:[],                                     enrageMultiplier:1.00, abilities:['void_lance','eye_beam'],              summonType:null,       summonCount:0 },
      { phaseIndex:1, hpThreshold:0.80, label:'Fracturing Mind',  invulnFrames:100, arenaHazards:['void_zones'],                          enrageMultiplier:1.15, abilities:['void_lance','eye_beam','mind_shatter'],summonType:'void_spawn',summonCount:3 },
      { phaseIndex:2, hpThreshold:0.60, label:'Reality Warp',     invulnFrames:120, arenaHazards:['void_zones','rift_tears'],              enrageMultiplier:1.35, abilities:['reality_warp','mind_shatter','gravity_crush'],summonType:'void_spawn',summonCount:5 },
      { phaseIndex:3, hpThreshold:0.35, label:'Oblivion\'s Edge',  invulnFrames:150, arenaHazards:['void_zones','rift_tears','null_field'], enrageMultiplier:1.70, abilities:['oblivion_pulse','gravity_crush','rift_storm'],summonType:'void_elder',summonCount:2 },
      { phaseIndex:4, hpThreshold:0.10, label:'Absolute Erasure', invulnFrames:200, arenaHazards:['void_zones','rift_tears','null_field','annihilation_beam'],enrageMultiplier:2.50,abilities:['erasure_beam','rift_storm','void_collapse'],summonType:'void_elder',summonCount:3 },
    ],
  },

  // ── The Black Paladin (3 phases) ──────────────────────────────────────────
  black_paladin: {
    id: 'black_paladin',
    name: 'The Black Paladin',
    mainHp: 6000,
    armorHp: 2000,
    shieldHp: 1500,
    staggerMax: 500,
    weaknessMeter: 350,
    enrageMax: 300,
    summonHp: 0,
    phases: [
      { phaseIndex:0, hpThreshold:1.00, label:'Knight\'s Vow',   invulnFrames:0,   arenaHazards:[],                              enrageMultiplier:1.00, abilities:['shield_bash','holy_strike'],            summonType:null,         summonCount:0 },
      { phaseIndex:1, hpThreshold:0.60, label:'Fallen Crusade',  invulnFrames:120, arenaHazards:['dark_consecration'],           enrageMultiplier:1.40, abilities:['shield_bash','dark_wave','judgment'],  summonType:'dark_knight',summonCount:2 },
      { phaseIndex:2, hpThreshold:0.25, label:'Cursed Apotheosis',invulnFrames:180,arenaHazards:['dark_consecration','soul_pillars'],enrageMultiplier:2.20,abilities:['dark_wave','judgment','apocalypse'],  summonType:'dark_knight', summonCount:4 },
    ],
  },

  // ── Glacier Wyrm (4 phases) ───────────────────────────────────────────────
  glacier_wyrm: {
    id: 'glacier_wyrm',
    name: 'Glacier Wyrm',
    mainHp: 7000,
    armorHp: 1800,
    shieldHp: 500,
    staggerMax: 450,
    weaknessMeter: 300,
    enrageMax: 350,
    summonHp: 150,
    phases: [
      { phaseIndex:0, hpThreshold:1.00, label:'Frozen Slumber',  invulnFrames:0,   arenaHazards:[],                                     enrageMultiplier:1.00, abilities:['ice_bite','blizzard_breath'],           summonType:null,          summonCount:0 },
      { phaseIndex:1, hpThreshold:0.72, label:'Glacial Advance', invulnFrames:90,  arenaHazards:['ice_spikes'],                          enrageMultiplier:1.18, abilities:['ice_bite','blizzard_breath','tail_whip'],summonType:'frost_serpent',summonCount:2 },
      { phaseIndex:2, hpThreshold:0.42, label:'Permafrost Surge',invulnFrames:130, arenaHazards:['ice_spikes','avalanche_zones'],        enrageMultiplier:1.55, abilities:['absolute_freeze','tail_whip','crystal_rain'],summonType:'frost_serpent',summonCount:4 },
      { phaseIndex:3, hpThreshold:0.15, label:'Extinction Ice',  invulnFrames:170, arenaHazards:['ice_spikes','avalanche_zones','cryo_field'],enrageMultiplier:2.10,abilities:['absolute_freeze','crystal_rain','glacial_comet'],summonType:'ice_golem',summonCount:2 },
    ],
  },

  // ── Worldroot Ancient (4 phases) ──────────────────────────────────────────
  worldroot_ancient: {
    id: 'worldroot_ancient',
    name: 'Worldroot Ancient',
    mainHp: 8500,
    armorHp: 1000,
    shieldHp: 0,
    staggerMax: 400,
    weaknessMeter: 400,
    enrageMax: 500,
    summonHp: 300,
    phases: [
      { phaseIndex:0, hpThreshold:1.00, label:'Dormant Growth',  invulnFrames:0,   arenaHazards:[],                                      enrageMultiplier:1.00, abilities:['root_slam','thorn_volley'],           summonType:null,          summonCount:0 },
      { phaseIndex:1, hpThreshold:0.75, label:'Awakened Forest', invulnFrames:100, arenaHazards:['thorn_walls'],                          enrageMultiplier:1.15, abilities:['root_slam','spore_burst','entangle'], summonType:'thorn_walker',summonCount:3 },
      { phaseIndex:2, hpThreshold:0.45, label:'Ancient Wrath',   invulnFrames:140, arenaHazards:['thorn_walls','poison_mist'],            enrageMultiplier:1.45, abilities:['nature_pulse','entangle','spore_burst'],summonType:'thorn_walker',summonCount:5 },
      { phaseIndex:3, hpThreshold:0.15, label:'World\'s End',    invulnFrames:180, arenaHazards:['thorn_walls','poison_mist','vine_storm'],enrageMultiplier:2.00,abilities:['nature_pulse','vine_storm','world_shatter'],summonType:'elder_tree', summonCount:2 },
    ],
  },

  // ── The Fallen Seraph (5 phases) ──────────────────────────────────────────
  fallen_seraph: {
    id: 'fallen_seraph',
    name: 'The Fallen Seraph',
    mainHp: 9500,
    armorHp: 500,
    shieldHp: 2500,
    staggerMax: 350,
    weaknessMeter: 450,
    enrageMax: 700,
    summonHp: 400,
    phases: [
      { phaseIndex:0, hpThreshold:1.00, label:'Celestial Grace',  invulnFrames:0,   arenaHazards:[],                                          enrageMultiplier:1.00, abilities:['holy_arrow','radiant_burst'],              summonType:null,            summonCount:0 },
      { phaseIndex:1, hpThreshold:0.80, label:'Corrupted Wings',  invulnFrames:90,  arenaHazards:['light_pillars'],                            enrageMultiplier:1.12, abilities:['holy_arrow','smite','feather_storm'],      summonType:'seraph_herald', summonCount:2 },
      { phaseIndex:2, hpThreshold:0.58, label:'Divine Reckoning', invulnFrames:120, arenaHazards:['light_pillars','judgement_zones'],           enrageMultiplier:1.30, abilities:['smite','feather_storm','divine_wrath'],   summonType:'seraph_herald', summonCount:3 },
      { phaseIndex:3, hpThreshold:0.32, label:'Fallen From Grace',invulnFrames:160, arenaHazards:['light_pillars','judgement_zones','dark_halos'],enrageMultiplier:1.70,abilities:['divine_wrath','dark_crusade','holy_nova'],summonType:'fallen_angel', summonCount:2 },
      { phaseIndex:4, hpThreshold:0.08, label:'Apocalypse Herald',invulnFrames:200, arenaHazards:['light_pillars','judgement_zones','dark_halos','apocalypse_field'],enrageMultiplier:2.50,abilities:['holy_nova','dark_crusade','final_judgement'],summonType:'fallen_angel',summonCount:4 },
    ],
  },
});

/** Convenience array of all boss IDs */
export const BOSS_IDS = Object.freeze(Object.keys(BOSS_DEFINITIONS));

/** Array of all 8 major overdrive boss definitions */
export const OVERDRIVE_BOSSES = Object.freeze(Object.values(BOSS_DEFINITIONS));

// ═══════════════════════════════════════════════════════════════════════════════
// §4  BossHealthSystem
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tracks all health layers for a single boss instance.
 */
export class BossHealthSystem {
  /**
   * @param {object} def  - Boss definition or config object
   * @param {number} [difficultyMult=1] - Applies to all HP pools
   */
  constructor(def = {}, difficultyMult = 1) {
    this.id          = def.id || 'boss';
    this.name        = def.name || 'Boss';
    this.maxMainHp   = Math.round((def.mainHp ?? 1000) * difficultyMult);
    this.maxArmorHp  = Math.round((def.armorHp ?? 0) * difficultyMult);
    this.maxShieldHp = Math.round((def.shieldHp ?? 0) * difficultyMult);
    this.staggerMax  = def.staggerMax ?? 100;
    this.weaknessMax = def.weaknessMax ?? def.weaknessMeter ?? 100;
    this.enrageMax   = def.enrageMax ?? 100;
    this.maxSummonHp = Math.round((def.summonHp ?? 0) * difficultyMult);

    this.mainHp    = this.maxMainHp;
    this.armorHp   = this.maxArmorHp;
    this.shieldHp  = this.maxShieldHp;
    this.stagger   = 0;
    this.weakness  = 0;
    this.enrage    = 0;
    this.phaseHp   = def.phaseHp ?? 0;
    this.summonHp  = def.summonHp ?? 0;

    this.statuses  = new Set();
    this.isAlive   = true;
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  get mainHpFraction()   { return this.maxMainHp   > 0 ? this.mainHp   / this.maxMainHp   : 0; }
  get armorHpFraction()  { return this.maxArmorHp  > 0 ? this.armorHp  / this.maxArmorHp  : 0; }
  get shieldHpFraction() { return this.maxShieldHp > 0 ? this.shieldHp / this.maxShieldHp : 0; }
  get staggerFraction()  { return this.staggerMax   > 0 ? this.stagger  / this.staggerMax  : 0; }
  get weaknessFraction() { return this.weaknessMax  > 0 ? this.weakness / this.weaknessMax : 0; }
  get enrageFraction()   { return this.enrageMax    > 0 ? this.enrage   / this.enrageMax   : 0; }
  get staggerMeter()     { return this.stagger; }
  get enrageMeter()      { return this.enrage; }
  get isStunned()        { return this.statuses.has(STATUS.STUNNED); }
  get isStaggered()      { return this.statuses.has(STATUS.STUNNED) || this.stagger >= this.staggerMax; }
  get isInvulnerable()   { return this.statuses.has(STATUS.INVULNERABLE); }
  get isEnraged()        { return this.statuses.has(STATUS.ENRAGED) || this.enrage >= this.enrageMax; }

  fillEnrage(amount) {
    this.enrage = Math.min(this.enrageMax, this.enrage + amount);
    if (this.enrage >= this.enrageMax) {
      this.statuses.add(STATUS.ENRAGED);
    }
  }

  // ── Core damage application ────────────────────────────────────────────────

  /**
   * Apply a hit to the boss, returning a detailed result object.
   */
  applyDamage(rawDamage, dmgType = DMG_TYPE.PHYSICAL, staggerVal = 0) {
    let dmg = 0;
    let type = dmgType;
    let stg = staggerVal;

    if (typeof rawDamage === 'object' && rawDamage !== null) {
      dmg = rawDamage.amount ?? rawDamage.damage ?? 0;
      type = rawDamage.type ?? DMG_TYPE.PHYSICAL;
      stg = rawDamage.stagger ?? Math.max(10, Math.round(dmg * 0.5));
    } else {
      dmg = rawDamage;
      stg = staggerVal || Math.max(10, Math.round(dmg * 0.5));
    }

    if (!this.isAlive || this.isInvulnerable) return _noHit();

    let absorbed  = 0;
    let shielded  = 0;
    let shieldBroken = false;

    // TRUE damage bypasses everything
    if (type !== DMG_TYPE.TRUE) {
      // 1) Shield absorbs first (all damage types)
      if (this.shieldHp > 0) {
        const shieldTake = Math.min(dmg, this.shieldHp);
        this.shieldHp -= shieldTake;
        shielded = shieldTake;
        dmg -= shieldTake;
        if (this.shieldHp <= 0) {
          shieldBroken = true;
          this.statuses.delete(STATUS.SHIELDED);
        }
      }

      // 2) Armor absorbs physical damage before main HP
      if (type === DMG_TYPE.PHYSICAL && this.armorHp > 0 && dmg > 0) {
        const armorTake = Math.min(dmg, this.armorHp);
        this.armorHp = Math.max(0, this.armorHp - armorTake);
        absorbed = armorTake;
        dmg -= armorTake;
      }
    }

    // 3) Apply to main HP
    const effective = Math.max(0, Math.round(dmg));
    this.mainHp = Math.max(0, this.mainHp - effective);

    // 4) Stagger
    let staggered = false;
    let staggerAdded = 0;
    if (stg > 0 && !this.isStunned) {
      staggerAdded = stg;
      this.stagger = Math.min(this.staggerMax, this.stagger + staggerAdded);
      if (this.stagger >= this.staggerMax) {
        staggered = true;
        this.statuses.add(STATUS.STUNNED);
      }
    }

    // 5) Weakness meter (non-physical hits build it)
    let weakened = false;
    if (type !== DMG_TYPE.PHYSICAL && effective > 0) {
      this.weakness = Math.min(this.weaknessMax, this.weakness + Math.round(effective * 0.3));
      if (this.weakness >= this.weaknessMax) {
        weakened = true;
        this.weakness = 0;
      }
    }

    const killed = this.mainHp <= 0;
    if (killed) this.isAlive = false;

    return { absorbed, shielded, effective, staggerAdded, shieldBroken, staggered, weakened, killed };
  }

  /**
   * Calculate armor's flat damage-reduction fraction based on remaining armor.
   * Full armor → 40% reduction.  Zero armor → 0%.
   */
  _physicalArmorReduction() {
    if (this.maxArmorHp <= 0) return 0;
    return 0.40 * (this.armorHp / this.maxArmorHp);
  }

  /** Restore shield (e.g. after phase transition) */
  restoreShield(amount) {
    this.shieldHp = Math.min(this.maxShieldHp, this.shieldHp + amount);
    if (this.shieldHp > 0) this.statuses.add(STATUS.SHIELDED);
  }

  /** Add status; returns true if newly added */
  addStatus(status) {
    const had = this.statuses.has(status);
    this.statuses.add(status);
    return !had;
  }

  /** Remove status; returns true if it was present */
  removeStatus(status) {
    return this.statuses.delete(status);
  }

  /** Tick enrage meter by delta */
  tickEnrage(delta) {
    this.enrage = Math.min(this.enrageMax, this.enrage + delta);
    if (this.enrage >= this.enrageMax && !this.isEnraged) {
      this.statuses.add(STATUS.ENRAGED);
    }
  }

  /** Serialisable snapshot */
  snapshot() {
    return {
      id:           this.id,
      name:         this.name,
      mainHp:       this.mainHp,
      maxMainHp:    this.maxMainHp,
      armorHp:      this.armorHp,
      maxArmorHp:   this.maxArmorHp,
      shieldHp:     this.shieldHp,
      maxShieldHp:  this.maxShieldHp,
      stagger:      this.stagger,
      staggerMax:   this.staggerMax,
      weakness:     this.weakness,
      weaknessMax:  this.weaknessMax,
      enrage:       this.enrage,
      enrageMax:    this.enrageMax,
      summonHp:     this.summonHp,
      phaseHp:      this.phaseHp,
      statuses:     [...this.statuses],
      isAlive:      this.isAlive,
    };
  }
}

function _noHit() {
  return { absorbed:0, shielded:0, effective:0, staggerAdded:0, shieldBroken:false, staggered:false, weakened:false, killed:false };
}

// ═══════════════════════════════════════════════════════════════════════════════
// §5  BossPhaseController
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Drives phase transitions for one boss.  Consumes a BossHealthSystem.
 * No DOM/timer dependencies — caller ticks `update(dt)` every game frame.
 */
export class BossPhaseController {
  /**
   * @param {string|object}   bossDefOrId - boss id string or boss config object
   * @param {BossHealthSystem} [healthSystem]
   * @param {object}          [opts]
   * @param {number}          [opts.difficultyMult=1]
   * @param {boolean}         [opts.extraPhase=false]  - add nightmare +5% enrage tick
   */
  constructor(bossDefOrId, healthSystem, opts = {}) {
    let def;
    if (typeof bossDefOrId === 'string') {
      def = BOSS_DEFINITIONS[bossDefOrId];
      if (!def) throw new Error(`Unknown boss id: "${bossDefOrId}"`);
    } else {
      def = bossDefOrId || {};
    }

    const hs = healthSystem || new BossHealthSystem(def);

    this.def          = def;
    this.hs           = hs;
    this.phases       = (def.phases || []).slice().sort((a,b) => b.hpThreshold - a.hpThreshold);
    this.currentPhase = 1;
    this.phaseIndex   = 0;
    this.totalPhases  = this.phases.length || 1;

    this.invulnTimer  = 0;
    this.invulnerabilityFrames = 0;
    this.transitionPending = false;
    this.activeHazards     = [];
    this.enrageTickRate    = opts.extraPhase ? 1.5 : 1.0;
    this.difficultyMult    = opts.difficultyMult ?? 1;
    this.eventLog          = [];
    this.frameCount        = 0;

    this.onHazardActivated = null;
    this.onEnrageEscalation = null;

    if (this.phases.length > 0) {
      this._setPhaseHp();
    }
  }

  get isInvulnerable() {
    return this.invulnTimer > 0 || this.invulnerabilityFrames > 0 || this.hs.isInvulnerable;
  }

  getPhaseConfig(phaseNum) {
    const idx = Math.max(0, phaseNum - 1);
    const p = this.phases[idx] || this.phases[0] || {};
    return {
      ...p,
      healthThreshold: p.hpThreshold ?? (1 - (idx * 0.2)),
      triggers: ['health_threshold', 'enrage'],
    };
  }

  triggerPhaseTransition(targetPhase) {
    this.currentPhase = targetPhase;
    this.phaseIndex = Math.max(0, targetPhase - 1);
    const p = this.phases[this.phaseIndex] || this.phases[0] || {};

    const frames = p.invulnFrames || 120;
    this.invulnerabilityFrames = frames;
    this.invulnTimer = frames;
    this.hs.addStatus(STATUS.INVULNERABLE);

    const hazards = p.arenaHazards || ['phase_hazard'];
    for (const h of hazards) {
      if (!this.activeHazards.includes(h)) this.activeHazards.push(h);
    }

    if (this.onHazardActivated) {
      this.onHazardActivated(hazards[0] || 'phase_hazard');
    }
    if (this.onEnrageEscalation) {
      this.onEnrageEscalation(targetPhase);
    }

    return this._event('phase_transition', {
      fromPhase: this.phaseIndex,
      toPhase: targetPhase,
      label: p.label || `Phase ${targetPhase}`,
      invulnFrames: frames,
      hazards: [...this.activeHazards],
      abilities: p.abilities ? [...p.abilities] : [],
      summonType: p.summonType,
      summonCount: p.summonCount,
    });
  }

  // ── Per-frame update ───────────────────────────────────────────────────────

  /**
   * @param {number} dt - seconds since last frame
   * @returns {object[]} events emitted this tick
   */
  update(dt) {
    this.frameCount++;
    const events = [];

    // Invulnerability countdown
    if (this.invulnTimer > 0) {
      this.invulnTimer = Math.max(0, this.invulnTimer - 1);
      this.invulnerabilityFrames = this.invulnTimer;
      if (this.invulnTimer === 0) {
        this.hs.removeStatus(STATUS.INVULNERABLE);
        events.push(this._event('invuln_end', {}));
      }
    }

    // Stun cooldown
    if (this.hs.isStunned) {
      this._stunTimer = (this._stunTimer ?? 0) + 1;
      if (this._stunTimer >= 180) {
        this.hs.removeStatus(STATUS.STUNNED);
        this._stunTimer = 0;
        events.push(this._event('stun_end', {}));
      }
    } else {
      this._stunTimer = 0;
    }

    // Enrage tick
    if (!this.hs.isEnraged) {
      this.hs.tickEnrage(this.enrageTickRate * dt);
      if (this.hs.isEnraged) events.push(this._event('enrage', { phase: this.phaseIndex }));
    }

    // Phase check
    const phaseEvt = this._checkPhaseTransition();
    if (phaseEvt) events.push(phaseEvt);

    return events;
  }

  // ── Phase transition ───────────────────────────────────────────────────────

  _checkPhaseTransition() {
    if (!this.hs.isAlive) return null;
    if (this.invulnTimer > 0) return null;

    const hpFrac = this.hs.mainHpFraction;
    for (let i = this.phaseIndex + 1; i < this.phases.length; i++) {
      const nextPhase = this.phases[i];
      if (hpFrac <= nextPhase.hpThreshold) {
        return this.triggerPhaseTransition(i + 1);
      }
    }
    return null;
  }

  _setPhaseHp() {
    const p = this.phases[this.phaseIndex] || this.phases[0];
    const next = this.phases[this.phaseIndex + 1];
    const lo = next ? next.hpThreshold : 0;
    const hi = p ? p.hpThreshold : 1;
    this.hs.phaseHp = Math.round((hi - lo) * this.hs.maxMainHp);
  }

  _event(type, data) {
    const e = { type, data, frame: this.frameCount };
    this.eventLog.push(e);
    return e;
  }

  // ── Convenience getters ────────────────────────────────────────────────────

  get phaseName()       { return (this.phases[this.phaseIndex] || {}).label || 'Phase 1'; }
  get currentHazards()  { return this.activeHazards; }
  get currentAbilities(){ return (this.phases[this.phaseIndex] || {}).abilities || []; }

  /** Serialisable snapshot */
  snapshot() {
    return {
      bossId:       this.def.id,
      phaseIndex:   this.phaseIndex,
      phaseName:    this.phaseName,
      totalPhases:  this.totalPhases,
      invulnTimer:  this.invulnTimer,
      activeHazards:[...this.activeHazards],
      enrageTickRate: this.enrageTickRate,
      frameCount:   this.frameCount,
      health:       this.hs.snapshot(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// §6  SpellCastingEngine
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Manages a caster's mana, spell cooldowns, and resolves spell execution.
 * No DOM / audio dependencies.
 */
export class SpellCastingEngine {
  /**
   * @param {object} [opts]
   * @param {number} [opts.maxMana=200]
   * @param {number} [opts.manaRegenRate=5]  - mana/second
   * @param {number} [opts.manaRegen=5]      - mana/second
   * @param {number} [opts.spellPower=1.0]   - global spell damage multiplier
   * @param {string[]} [opts.knownSpells]    - array of spell IDs; defaults to all
   */
  constructor(opts = {}) {
    this.maxMana       = opts.maxMana    ?? 200;
    this.mana          = this.maxMana;
    this.manaRegenRate = opts.manaRegenRate ?? opts.manaRegen ?? 5;
    this.spellPower    = opts.spellPower ?? 1.0;
    this.knownSpells   = new Set(opts.knownSpells ?? SPELL_CATALOGUE.map(s => s.id));

    /** Map spellId → remaining cooldown (seconds) */
    this.cooldowns     = new Map();
    this.castLog       = [];
    this.frameCount    = 0;
    this.maxHp         = opts.maxHp ?? 100;
    this.hp            = this.maxHp;
  }

  // ── Per-frame tick ─────────────────────────────────────────────────────────

  tick(dt) {
    this.frameCount++;
    this.mana = Math.min(this.maxMana, this.mana + this.manaRegenRate * dt);

    const ready = [];
    for (const [id, remaining] of this.cooldowns) {
      const next = remaining - dt;
      if (next <= 0) {
        this.cooldowns.delete(id);
        ready.push(id);
      } else {
        this.cooldowns.set(id, next);
      }
    }
    return ready;
  }

  clearCooldowns() {
    this.cooldowns.clear();
  }

  // ── Spell resolution ───────────────────────────────────────────────────────

  cast(spellId, ctx = {}) {
    const spell = SPELL_BY_ID[spellId]
      || OVERDRIVE_SPELL_BY_ID[spellId]
      || SPELL_CATALOGUE.find(s => s.id === spellId);
    if (!spell) {
      return { success: false, failed: true, reason: 'unknown_spell', damage: 0, cdSet: 0 };
    }

    if (this.isOnCooldown(spellId)) {
      return { success: false, failed: true, reason: 'on_cooldown', damage: 0, cdSet: this.cooldownRemaining(spellId) };
    }

    const cost = spell.cost ?? spell.manaCost ?? 0;
    if (this.mana < cost) {
      return { success: false, failed: true, reason: 'insufficient_mana', damage: 0, cdSet: 0 };
    }

    this.mana -= cost;
    const cd = spell.cooldown ?? 1.0;
    this.cooldowns.set(spellId, cd);

    const schoolKey = (spell.school || '').toLowerCase();
    const mult = ELEMENTAL_MULTIPLIER[schoolKey] ?? 1.0;
    const baseDmg = spell.damage ?? spell.baseDamage ?? 50;
    const damage = Math.round(baseDmg * mult * this.spellPower);

    const result = {
      success: true,
      failed: false,
      reason: null,
      spellId,
      school: spell.school,
      damage,
      manaLeft: Math.round(this.mana),
      cdSet: cd,
    };

    this.castLog.push({ spellId, result, frame: this.frameCount });
    return result;
  }

  isOnCooldown(spellId)      { return this.cooldowns.has(spellId); }
  cooldownRemaining(spellId) { return this.cooldowns.get(spellId) ?? 0; }
  setMana(val)               { this.mana = Math.max(0, Math.min(this.maxMana, val)); }

  snapshot() {
    return {
      mana:       Math.round(this.mana),
      maxMana:    this.maxMana,
      hp:         this.hp,
      spellPower: this.spellPower,
      cooldowns:  Object.fromEntries(this.cooldowns),
      knownSpells:[...this.knownSpells],
    };
  }
}

function _castFail(spellId, reason) {
  return { success: false, reason, spellId, damage: 0, modifierEffects: null, manaLeft: null, cdSet: 0 };
}

// ═══════════════════════════════════════════════════════════════════════════════
// §7  Factory helpers
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a fully initialised boss (health + phase controller) in one call.
 * @param {string} bossId
 * @param {object} [opts]  { difficultyMult, extraPhase }
 * @returns {{ health: BossHealthSystem, phase: BossPhaseController }}
 */
export function createBoss(bossId, opts = {}) {
  const def = BOSS_DEFINITIONS[bossId];
  if (!def) throw new Error(`Unknown boss: "${bossId}"`);
  const diff = opts.difficultyMult ?? 1;
  const hs = new BossHealthSystem(def, diff);
  const pc = new BossPhaseController(bossId, hs, { difficultyMult: diff, extraPhase: opts.extraPhase ?? false });
  return { health: hs, phase: pc };
}

/**
 * Create a spell caster pre-loaded with all 32 spells.
 * @param {object} [opts]  passed to SpellCastingEngine
 */
export function createSpellCaster(opts = {}) {
  return new SpellCastingEngine({
    ...opts,
    knownSpells: opts.knownSpells ?? SPELL_CATALOGUE.map(s => s.id),
  });
}
