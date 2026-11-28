// Ashen Vow v0.6.0 — browser shell: menus, level select, spectate, fixed-step loop.
import {
  AshenGame,
  ROOMS,
  ALL_ROOMS,
  ALL_ENEMY_INFO,
  ALL_BOSS_INFO,
  WORLD_W,
  FLOOR_Y,
  VIEW_W,
  WEAPONS,
  SHOP_ITEMS,
  BOSS_INFO,
  CODEX,
  CHARACTERS,
  RACES,
  OUTFITS,
  SKIN_TONES,
  OUTFIT_COLORS,
  DEFAULT_APPEARANCE,
} from './core.js';
import { Renderer } from './render.js';
import {
  bossVoiceLine,
  bossVoiceSummary,
  archetypeForBoss,
  sanitizeBossVoiceSettings,
  sanitizeVoiceManifest,
  resolveBossVoiceSource,
  BOSS_VOICE_SOURCE_LABEL,
  PLAYER_SPEAKER,
} from './boss_voice.js';
import { VoiceFX } from './voice_fx.js';
import { SoundKit } from './audio.js';
import { MusicManager, bossTrackFor } from './music.js';
import {
  SKILL_NODES,
  SKILL_MAX_RANKS,
  SKILL_POINTS_PACK_CLEAR,
  SKILL_POINTS_CAMPAIGN,
  defaultSkillState,
  sanitizeSkillState,
  skillBonuses,
  skillSummary,
  spendSkillPoint,
  resetSkillRanks,
  grantSkillPoints,
  grantBossSkillPoints,
} from './skills.js';
import {
  PACK_NAME,
  PACK_SUBTITLE,
  PACK_BOSSES,
  defaultPackProgress,
  sanitizePackProgress,
  packProgressSummary,
  packBossUnlocked,
  recordPackBoss,
  recordPackFinish,
} from './bosspack.js';
import {
  loadSettings,
  saveSettings,
  ACTIONS,
  actionForCode,
  applyBinding,
  findConflict,
  resetActionBindings,
  resetAllBindings,
  defaultSettings,
  formatCode,
  gamepadActions,
} from './settings.js';
import { ZONE_LIST, ZONES, zoneForRoom } from './zones.js';
import {
  MapView,
  LEGEND,
  PIN_TYPES,
  MAX_PINS,
  defaultMapState,
  sanitizeMapState,
  discoverRoom,
  addPin,
  removePin,
  mapNodes,
  mapStats,
} from './map.js';
import { PROLOGUE_BEATS, PROLOGUE_TOTAL, drawPrologue } from './prologue.js';
import {
  BOSS_CUTSCENE,
  POST_CREDIT,
  drawCutscene,
  cutsceneFor,
  cutsceneBeatAt,
  SPIRAL_INTRO_CUTSCENE,
  SPIRAL_BOSS_CUTSCENE,
} from './cutscene.js';
import {
  VOICE_SAVE_KEY,
  VOICE_MODEL,
  castFor,
  sanitizeVoiceSave,
  voiceRequestFor,
  resolveVoiceProvider,
  voiceSummary,
  voiceBadge,
} from './voice.js';
import {
  TRAILER_IDENTITY,
  TRAILER_SHOTS,
  trailerDuration,
  trailerShotAt,
  trailerSummary,
  drawTrailerFrame,
} from './trailer.js';
import {
  SECRETS_SAVE_KEY,
  SECRET_MODE_KEYS,
  SECRET_LEVEL_RUNES,
  SECRET_SEQUENCE,
  advanceSecretSequence,
  createSecretBuffer,
  defaultSecretsSave,
  hasSecret,
  recordSecret,
  sanitizeSecretsSave,
  secretForMode,
  secretSpotFor,
  secretSummary,
} from './secrets.js';
import {
  CREDIT_ARCS,
  CREDIT_SCENE_DELAY_MS,
  CREDIT_SCENE_AUTO_CLOSE_MS,
  creditArcFor,
  creditSceneFor,
  isArcFinalBoss,
} from './credits.js';

import {
  SPEEDRUN_LIVES,
  SPEEDRUN_RULES,
  SPEEDRUN_START_MULTIPLIER,
  defaultSpeedrunProgress,
  recordSpeedrun,
  sanitizeSpeedrunProgress,
  speedrunLadder,
  speedrunMaxSubsteps,
  speedrunMultiplier,
  speedrunStats,
  speedrunSummary,
} from './speedrun.js';
import {
  FISHING_BAITS,
  FISHING_BAIT_TIERS,
  FISHING_LOCATION,
  FISHING_SUBTITLE,
  FISH_TOTAL,
  baitHighTierChance,
  defaultFishingProgress,
  drawFishingIcon,
  fishRarity,
  fishingBaitById,
  fishingBuyBait,
  fishingCast,
  fishingEscape,
  fishingFishById,
  fishingIndex,
  fishingLandCatch,
  fishingSelectBait,
  fishingShopItems,
  fishingSummary,
  reelHit,
  reelZone,
  sanitizeFishingProgress,
} from './fishing.js';
import { GAME_VERSION } from './version.js';
import {
  EXPANSION_NAME,
  EXPANSION_ROOM_START,
  TOTAL_LEVELS,
  LEVELS_PER_CHAPTER,
  CHAPTERS,
  BIOMES,
  DIFFICULTIES,
  DIFFICULTY_BY_ID,
  CHALLENGE_MODIFIERS,
  MODIFIER_BY_ID,
  EXPANSION_LEVELS,
  EXPANSION_BOSS_INFO,
  expansionLevelUnlocked,
  expansionChapterProgress,
  expansionCompletion,
  expansionCollectibleCounts,
  defaultExpansionProgress,
  sanitizeExpansionProgress,
  HAVEN_UPGRADES,
  UPGRADE_BY_ID,
  HAVEN_NPCS,
  ALL_NPCS,
  NPC_BY_ID,
  SETTLEMENTS,
  SETTLEMENT_BY_ID,
  QUESTS,
  QUEST_BY_ID,
  dialogueForNpc,
  EVENT_THEMES,
  EVENT_BY_ID,
  activeEventIds,
  isEventActive,
  COSMETIC_SKINS,
  SKIN_BY_ID,
  REPEATABLE_MODES,
  MODE_BY_ID,
  NG_PLUS_TIERS,
  ENDGAME_TRIALS,
  COLLECTIBLE_CATEGORIES,
  COLLECTIBLE_BY_ID,
  havenBonus,
  applyQuestProgress,
  applyEventProgress,
  eventMissionProgress,
  eventMissionReady,
  eventPoints,
  eventTierUnlocked,
} from './expansion.js';
import {
  FRONTIER_VERSION,
  FRONTIER_CHAPTERS,
  FRONTIER_LEVEL_SPECS,
  FRONTIER_CLASSES,
  FRONTIER_CLASS_BY_ID,
  ELITE_RANKS,
  ELITE_MOBS,
  ELITE_MODIFIERS,
  FRONTIER_WEAPON_CATEGORIES,
  REGIONAL_MATERIALS,
  CRAFTING_RECIPES,
  CUSTOMIZATION_LAYERS,
  DYE_PALETTE,
  MOUNT_ROSTER,
  COMPANION_ROSTER,
  CORE_ATTRIBUTES,
  KINGDOM_DEFENSE_TOWERS,
  FRONTIER_EXTRA_MODES,
  SCRIPTING_NODE_WHITELIST,
  MAP_VALIDATION_RULES,
  ACCEPTANCE_CHECKLIST_ITEMS,
  defaultFrontierProgress,
  sanitizeFrontierProgress,
} from './frontier.js';
import { Ashen3DGame, render3D, MODE3D_REGIONS, MODE3D_REGION_LIST, configure3D, gfx3DStatus, content3DSummary } from './mode3d.js';
import {
  HORROR3D_SAVE_KEY,
  HORROR3D_SITES,
  default3DHorrorSave,
  sanitize3DHorrorSave,
  record3DHorrorResult,
  horror3DSummary,
  horror3DSite,
} from './mode3d_horror.js';
import { probeCapabilities } from './gpu.js';
import {
  SETTINGS_CATEGORIES,
  SETTING_DEFINITIONS,
  SETTING_BY_PATH,
  AUDIO_CHANNELS,
  GRAPHICS_PRESETS,
  LANGUAGES,
  LANGUAGE_BY_ID,
  getSettingsValue,
  setSettingsValue,
  applyGraphicsPreset,
  markGraphicsCustom,
  searchSettings,
  settingsForCategory,
} from './settings2.js';
import { ScareDirector } from './scary.js';
import {
  HORROR_EVENTS,
  HORROR_EVENT_LIST,
  HORROR_REWARDS,
  HORROR_SAVE_KEY,
  HORROR_SETTING_BY_PATH,
  HORROR_TABS,
  HorrorEventDirector,
  HorrorJournal,
  SCARY_DIFFICULTY,
  SCARY_ENEMIES,
  ScareLedger,
  horrorSettingsForTab,
  resolveHorrorPresentation,
  sanitizeHorrorSettings,
} from './scary2.js';
import {
  applyHorrorTree,
  horrorRankUp,
  horrorResetSkills,
  horrorTreeBonuses,
  horrorTreeSnapshot,
} from './horror_tree.js';
import {
  HUNTER_ITEMS,
  HUNTER_SAVE_KEY,
  HUNTER_START_MARKS,
  HUNTER_ITEM_BY_ID,
  defaultHunterSave,
  hunterBuy,
  hunterCanBuy,
  hunterReward,
  hunterSummary,
  sanitizeHunterSave,
} from './hunter.js';
import {
  DREAD_ENVIRONMENTS,
  DREAD_ENVIRONMENT_LIST,
  DREAD_BOSSES,
  DREAD_BOSS_LIST,
  DREAD_MODES,
  DREAD_MODE_LIST,
  DREAD_EQUIPMENT,
  DREAD_JOURNAL_ENTRIES,
  DREAD_CATEGORIES,
  DREAD_TABS,
  DREAD_SAVE_KEY,
  DREAD_SETTING_DEFINITIONS,
  UNNATURAL_LIST,
  AwarenessManager,
  DreadEventDirector,
  DreadJournal,
  dreadModeProgress,
  dreadSettingsForTab,
  resolveDreadPresentation,
  sanitizeDreadSettings,
} from './dread.js';
import {
  VEIL_TABS,
  VEIL_CHAPTERS,
  VEIL_STAGES,
  VEIL_BOSSES,
  GHOSTS,
  GHOST_CLASSIFICATIONS,
  GHOST_RARITIES,
  GHOST_RESEARCH_STAGES,
  EVIDENCE_TYPES,
  SANITY_CONSUMABLES,
  SANITY_CONDITIONS,
  MIND_UPGRADES,
  INVESTIGATION_TOOLS,
  INVESTIGATION_CASES,
  INVESTIGATION_STEPS,
  MISSION_LIBRARY,
  VEIL_CURRENCIES,
  VEIL_ACHIEVEMENTS,
  LEADERBOARDS,
  VEIL_FACILITIES,
  VEIL_NPCS,
  SECRET_LOCATIONS,
  VEIL_COLLECTIBLES,
  VEIL_SETTING_DEFINITIONS,
  VEIL_SAVE_KEY,
  VeilController,
  veilStage,
  veilBoss,
  stagesForChapter,
  stageUnlocked,
  bossUnlocked,
  chapterUnlocked,
  veilSummary,
  veilSettingValue,
  sanitizeVeilSettings,
  resolveVeilPresentation,
  dailyRotation,
  weeklyRotation,
  missionProgress,
  veilFacilityState,
  veilNpcDialogue,
  veilCollectibleTotals,
  veilEquipmentEffects,
} from './veil.js';
import {
  ETERNAL_TABS,
  ETERNAL_CHAPTERS,
  ETERNAL_STAGES,
  ETERNAL_BOSSES,
  ETERNAL_SAVE_KEY,
  ETERNAL_SETTING_DEFINITIONS,
  ETERNAL_EQUIPMENT,
  EQUIPMENT_CATEGORIES,
  HUNT_VARIANTS,
  WORLD_EVENTS,
  INDEX_RANK_MILESTONES,
  ETERNAL_ACHIEVEMENTS,
  EXPEDITION_ROLES,
  EternalController,
  eternalStage,
  eternalBoss,
  eternalStageUnlocked,
  eternalBossUnlocked,
  eternalChapterUnlocked,
  eternalChapterClear,
  eternalFinalUnlocked,
  eternalStagesForChapter,
  eternalSummary,
  sanitizeEternalSettings,
  eternalSettingValue,
  setEternalSetting,
  resolveEternalPresentation,
  equipmentCost,
} from './eternal.js';
import {
  ARCHIVE_ARCS, ARCHIVE_CHAPTERS, ARCHIVE_CHAPTERS_BY_ID, ARCHIVE_STAGES,
  ARCHIVE_STAGES_BY_ID, ARCHIVE_BOSSES, ARCHIVE_TOOLS, ARCHIVE_TOOLS_BY_ID,
  ARCHIVE_TOOL_IDS, ARCHIVE_TOOL_CATEGORIES, ARCHIVE_ACHIEVEMENTS,
  GHOST_TOOL_REQUIREMENTS, JUMPSCARE_EVENTS, JUMPSCARE_EVENTS_BY_ID,
  JUMPSCARE_CATEGORIES, ARCHIVE_DISCOVERY_STATES, ARCHIVE_SAVE_KEY,
} from './archive_data.js';
import { ArchiveController, defaultArchiveSave, sanitizeArchiveSave } from './archive.js';
import { drawVeilAtmosphere } from './render.js';
import { bossDebugSnapshot } from './boss_core.js';
import {
  DIFFICULTIES as CAMPAIGN_DIFFICULTIES,
  DIFFICULTY_BY_ID as CAMPAIGN_DIFFICULTY_BY_ID,
  difficultyWarning,
  difficultyUnlocked,
} from './difficulty.js';
import {
  ATLAS_VERSION,
  ATLAS_NAME,
  ATLAS_ROOM_START,
  ATLAS_ROOM_COUNT,
  ATLAS_ZONES,
  ATLAS_ZONE_BY_ID,
  ATLAS_WORLD_TIERS,
  ATLAS_ABILITY_GATES,
  ATLAS_ABILITY_BY_ID,
  ATLAS_ROOMS,
  ATLAS_ROOM_BY_ID,
  ATLAS_ENEMY_INFO,
  ATLAS_BOSS_INFO,
  ATLAS_TIMELINE,
  ATLAS_CHARACTERS,
  ATLAS_CHAPTERS,
  ATLAS_ENDINGS,
  LORE_CATEGORIES,
  LORE_ENTRIES,
  LORE_ENTRY_BY_ID,
  LORE_COMPLETION_REWARDS,
  ATLAS_CONSUMABLES,
  ATLAS_CONSUMABLE_BY_ID,
  ATLAS_QUICK_SLOTS,
  ATLAS_RECIPES,
  ATLAS_SHOPS,
  ATLAS_ARMOR_SETS,
  ATLAS_CHARMS,
  ATLAS_WEAPONS,
  ATLAS_WEAPON_BY_ID,
  ATLAS_INFUSIONS,
  ATLAS_INFUSION_BY_ID,
  ATLAS_PHASES,
  ATLAS_CHECKLIST,
  ATLAS_QUALITY_PRESETS,
  validateAtlasRooms,
  atlasZoneForRoom,
  atlasRoomLocalIndex,
  atlasRoomForZone,
  revealLore,
  loreCompletion,
  searchLore,
  sellPrice,
  shopStock,
  buyAtlasItem,
  useAtlasConsumable,
  applyInfusion,
  weaponMasteryFor,
  grantWeaponXp,
  defaultAtlasProgress,
  sanitizeAtlasProgress,
  canUnlockAtlasZone,
  unlockAtlasZones,
  completeAtlasRoom,
  atlasStats,
  applyAtlasLoadout,
} from './atlas.js';
import { runBossBot } from './boss_pathfinding.js';
import {
  COURT_ROOM_START,
  COURT_ROOMS_PER_ZONE,
  COURT_ZONES,
  COURT_ZONE_IDS,
  COURT_ROOMS,
  COURT_ROOM_BY_ID,
  COURT_BOSS_INFO,
  COURT_WEAPONS,
  COURT_WEAPON_BY_ID,
  COURT_WEAPON_PROFILES,
  COURT_TOOLS,
  COURT_TOOL_BY_ID,
  COURT_TOOL_SLOTS,
  COURT_TRIALS,
  COURT_TRIAL_BY_ID,
  COURT_NG_PLUS_MAX,
  courtTrialUnlocked,
  setCourtNgPlus,
  recordCourtTrial,
  HOUSE_ROOMS,
  HOUSE_ROOM_BY_ID,
  HOUSE_FURNISHINGS,
  HOUSE_FURNISHING_BY_ID,
  HOUSE_RESIDENTS,
  HOUSE_RESIDENT_BY_ID,
  GIFT_COST,
  defaultCourtProgress,
  sanitizeCourtProgress,
  courtStats,
  courtZoneSummary,
  courtZoneCleared,
  courtLevelUnlocked,
  courtLevelStatus,
  syncCourtUnlocks,
  recordCourtClear,
  applyCourtLoadout,
  courtBonuses,
  houseWarmth,
  residentUnlocked,
  residentDialogue,
  residentAffinityTier,
  talkToResident,
  giftResident,
  upgradeHouseRoom,
  buyFurnishing,
  buyCourtWeapon,
  equipCourtWeapon,
  buyCourtTool,
  equipCourtTool,
} from './court.js';
import {
  FAIRY_NAME,
  FAIRY_LOCAL_NAME,
  FAIRY_SUBTITLE,
  FAIRY_ROOM_START,
  FAIRY_STAGE_COUNT,
  FAIRY_STAGE_ROOMS,
  FAIRY_ROOMS,
  FAIRY_ROOM_BY_ID,
  FAIRY_STAGES,
  FAIRY_BOSSES,
  FAIRY_BOSS_INFO,
  FAIRY_ZONE,
  defaultFairyProgress,
  sanitizeFairyProgress,
  fairyStageUnlocked,
  fairyStageCleared,
  fairyBossesUnlocked,
  fairyBossUnlocked,
  recordFairyStage,
  recordFairyBoss,
  recordFairyRun,
  fairyProgressSummary,
} from './fairy.js';
import {
  CISTERN_NAME,
  CISTERN_LOCAL_NAME,
  CISTERN_ROOMS,
  CISTERN_ROOM_BY_ID,
  CISTERN_STAGE_META,
  CISTERN_STAGE_COUNT,
  defaultCisternProgress,
  sanitizeCisternProgress,
  cisternUnlocked,
  cisternStageUnlocked,
  cisternStageCleared,
  cisternStageForRoom,
  recordCisternStage,
  recordCisternSecret,
  recordCisternBoss,
  recordCisternRun,
  cisternSummary,
} from './cistern.js';
import {
  LANTERN_NAME,
  LANTERN_LOCAL_NAME,
  LANTERN_ROOMS,
  LANTERN_ROOM_BY_ID,
  LANTERN_STAGE_META,
  LANTERN_STAGE_COUNT,
  defaultLanternProgress,
  sanitizeLanternProgress,
  lanternwakeUnlocked,
  lanternStageUnlocked,
  lanternStageCleared,
  lanternStageForRoom,
  lanternSummary,
  recordLanternStage,
  recordLanternBoss,
  recordLanternRun,
} from './lanternwake.js';
import {
  FRONTIERS_NAME,
  FRONTIERS_LOCAL_NAME,
  FRONTIER_ROOMS,
  FRONTIER_CHAPTER_META,
  FRONTIER_LEVEL_COUNT,
  FRONTIER_ROOMS_PER_CHAPTER,
  defaultFrontierCampaignProgress,
  sanitizeFrontierCampaignProgress,
  frontierCampaignUnlocked,
  frontierCampaignSummary,
  frontierChapterProgress,
  frontierLevelUnlocked,
  frontierLevelCleared,
  frontierIndexForRoom,
  frontierRoomForIndex,
  frontierAshStipend,
  frontierPlayerScale,
  frontierVitalityScale,
  frontierFlaskBonus,
  recordFrontierLevel,
  recordFrontierRun,
} from './frontiers.js';
import {
  FALLEN_NAME,
  FALLEN_LOCAL_NAME,
  FALLEN_SUBTITLE,
  FALLEN_ROOM_START,
  FALLEN_ROOMS_PER_REGION,
  FALLEN_REGION_COUNT,
  FALLEN_REGIONS,
  FALLEN_ROOM_BY_ID,
  FALLEN_ENEMY_INFO,
  FALLEN_ENEMY_IDS,
  FALLEN_BOSSES,
  FALLEN_BOSS_BY_ID,
  FALLEN_OPTIONAL_BOSSES,
  FALLEN_ABILITIES,
  FALLEN_ENDINGS,
  FALLEN_UPGRADES,
  FALLEN_WEAPONS,
  FALLEN_MOVEMENTS,
  FALLEN_MENU_OPTIONS,
  defaultFallenProgress,
  sanitizeFallenProgress,
  ascendProgress,
  fallenIsAscended,
  fallenRegionUnlocked,
  fallenRoomUnlocked,
  fallenBossUnlocked,
  recordFallenRoom,
  recordFallenBoss,
  recordFallenEnding,
  recordFallenDeath,
  recordFallenRun,
  buyFallenUpgrade,
  equipFallenWeapon,
  addFallenShards,
  setFallenMenuTheme,
  fallenSummary,
  fallenMenuFigure,
  fallenArchive,
  fallenEchoesFor,
  fallenRunConfig,
  radianceGain,
  radianceFull,
  blindingBurst,
  applyJudgment,
  judgmentTick,
  toggleShadow,
  shadowTick,
  shadowDamageMul,
} from './fallen.js';
import {
  CRUSADE_NAME,
  CRUSADE_LOCAL_NAME,
  CRUSADE_SUBTITLE,
  CRUSADE_ROOM_START,
  CRUSADE_ROOMS_PER_LEVEL,
  CRUSADE_LEVEL_COUNT,
  CRUSADE_LEVELS,
  CRUSADE_ROOM_BY_ID,
  CRUSADE_ENEMY_INFO,
  CRUSADE_ENEMY_IDS,
  CRUSADE_BOSSES,
  CRUSADE_BOSS_BY_ID,
  CRUSADE_BANNERS,
  CRUSADE_UPGRADES,
  CRUSADE_MENU_OPTIONS,
  CRUSADE_RIFT,
  defaultCrusadeProgress,
  sanitizeCrusadeProgress,
  crusadeUnlocked,
  unlockCrusade,
  crusadeLevelUnlocked,
  crusadeRoomUnlocked,
  crusadeBossUnlocked,
  recordCrusadeRoom,
  recordCrusadeBoss,
  recordCrusadeDeath,
  recordCrusadeRun,
  buyCrusadeUpgrade,
  addCrusadeSigils,
  crusadeSummary,
  crusadeArchive,
  crusadeCampFigure,
  crusadeRunConfig,
  valorHit,
  valorBreak,
  valorStrikeReady,
  crusaderStrike,
  paladinChainTick,
  breakPaladinChain,
  valorMultiplier,
} from './crusade.js';
import {
  RIFT_ROOM_START,
  RIFT_ROOM_COUNT,
  RIFT_REGIONS,
  RIFT_ROOMS,
  RIFT_BOSS_INFO,
  defaultRiftProgress,
  sanitizeRiftProgress,
  riftUnlocked,
  recordRiftRoom,
  recordRiftBoss,
  riftSummary,
} from './rift.js';
import {
  LABYRINTH_VERSION,
  LABYRINTH_NAME,
  LABYRINTH_MODES,
  LABYRINTH_MODE_BY_ID,
  LABYRINTH_ZONES,
  LABYRINTH_ZONE_BY_ID,
  LABYRINTH_BOSSES,
  LABYRINTH_BOSS_BY_ID,
  LABYRINTH_ITEMS,
  LABYRINTH_ITEM_BY_ID,
  LABYRINTH_MODIFIERS,
  LABYRINTH_MODIFIER_BY_ID,
  ITEM_CATEGORIES,
  ELITE_TIERS,
  SYNERGIES,
  RITUALS,
  createLabyrinthRun,
  ensurePlans,
  WaveDirector,
  arenaForRun,
  cycleScaling,
  stageForCycle,
  rewardChoices,
  applyItemToRun,
  applyLoadoutToGame,
  captureBaseStats,
  combineTotals,
  itemDescription,
  advanceRituals,
  tickRituals,
  runSummary,
  recordLabyrinthRun,
  sanitizeLabyrinthProgress,
  defaultLabyrinthProgress,
  leaderboardRows,
  discoverySummary,
  canCheckpoint,
  serializeLabyrinthRun,
  resumeLabyrinthRun,
  labyrinthHudModel,
  rankForXp,
  LABYRINTH_CURRENCIES,
  MASTERY_TRACKS,
} from './labyrinth.js';
import {
  TRIAL_BIOMES,
  TRIAL_BIOME_BY_ID,
  TRIAL_BOSS_BY_ID,
  TRIAL_LEVELS_PER_BIOME,
  trialSummary,
  biomeProgress,
  trialLevelUnlocked,
  trialBossUnlocked,
  buildEncounter,
  waveForEncounter,
  trialArena,
  trialBossOverrides,
  defaultTrialProgress,
  sanitizeTrialProgress,
  recordTrialClear,
  recordTrialBoss,
} from './trials.js';
import {
  PUZZLE_STAGES,
  PUZZLE_ARCS,
  PUZZLE_LORE,
  PUZZLE_TYPE_LORE,
  PUZZLE_BOSSES,
  PUZZLE_ABILITIES,
  PUZZLE_TYPES,
  PUZZLE_TYPE_BY_ID,
  PUZZLE_BOSS_BY_ID,
  generateStagePuzzle,
  generatePuzzle,
  applyPuzzleMove,
  puzzleIsSolved,
  puzzleStageUnlocked,
  puzzleSummary,
  defaultPuzzleProgress,
  sanitizePuzzleProgress,
  recordPuzzleSolve,
  recordPuzzleBoss,
  PUZZLE_HINT_COST,
  puzzleHintText,
  payPuzzleHint,
  puzzleBossTimer,
  formatPuzzleTime,
} from './puzzle.js';
import {
  MOBA_HEROES,
  MOBA_HERO_BY_ID,
  MOBA_HERO_COUNT,
  MOBA_MAPS,
  MOBA_MAP_BY_ID,
  MOBA_MINION_TYPES,
  MOBA_JUNGLE_MOBS,
  MOBA_EPIC_BOSSES,
  MOBA_EPIC_BY_ID,
  MOBA_DIFFICULTIES,
  MOBA_LANES,
  MOBA_ROLES,
  createMobaMatch,
  updateMobaMatch,
  mobaCast,
  mobaSetOrder,
  mobaSnapshot,
  mobaHeroStats,
  mobaScreenToWorld,
  renderMoba,
  endMobaMatch,
  mobaSummary,
  defaultMobaProgress,
  sanitizeMobaProgress,
  recordMobaMatch,
} from './moba.js';
import {
  WAVE_DEFENSE_MAPS,
  WAVE_DEFENSE_MAP_BY_ID,
  WAVE_DEFENSE_TOWERS,
  WAVE_DEFENSE_TOWER_BY_ID,
  WAVE_DEFENSE_DIFFICULTIES,
  WAVE_DEFENSE_PARTICLE_LEVELS,
  WAVE_DEFENSE_ENEMY_TYPES,
  WAVE_DEFENSE_BOSSES,
  WAVE_DEFENSE_TOTAL_WAVES,
  WAVE_DEFENSE_INFINITOWER_TIER_WAVES,
  waveDefenseTowerIconDataUrl,
  SPIRAL_STORY,
  spiralStoryForTier,
  infinitowerTierFor,
  createWaveDefense,
  updateWaveDefense,
  waveDefenseBuild,
  waveDefenseUpgrade,
  waveDefenseUpgradeCost,
  waveDefenseSell,
  waveDefenseSellValue,
  waveDefenseSelect,
  waveDefenseSelectTower,
  waveDefenseNextWave,
  waveDefenseSetSpeed,
  waveDefenseSetParticleScale,
  waveDefenseSnapshot,
  waveDefenseSummary,
  defaultWaveDefenseProgress,
  sanitizeWaveDefenseProgress,
  recordWaveDefense,
  endWaveDefense,
  renderWaveDefense,
} from './wavedefense.js';
import {
  OVERDRIVE_CHAPTERS as OVERDRIVE_DATA_CHAPTERS,
  OVERDRIVE_SPECIAL_LEVEL_TYPES,
  SPELL_SCHOOLS as OVERDRIVE_DATA_SCHOOLS,
  LEGENDARY_WEAPONS as OVERDRIVE_LEGENDARY_WEAPONS,
} from './overdrive.js';
import {
  OVERDRIVE_ROOMS,
  OVERDRIVE_LEVEL_COUNT,
  OVERDRIVE_ROOMS_PER_CHAPTER,
  OVERDRIVE_CHAPTER_META,
  OVERDRIVE_LOCAL_NAME,
  overdriveRoomForIndex,
  overdriveIndexForRoom,
  overdriveCampaignUnlocked,
  overdriveLevelUnlocked,
  overdriveLevelCleared,
  overdriveChapterProgress,
  overdriveCampaignSummary,
  overdrivePlayerScale,
  overdriveVitalityScale,
  overdriveFlaskBonus,
  overdriveAshStipend,
  overdriveSpellFor,
  defaultOverdriveLadderState,
  sanitizeOverdriveLadderProgress,
  recordOverdriveLevel,
  recordOverdriveRun,
} from './overdrive_ladder.js';
import {
  PIRATE_STAGES,
  PIRATE_STAGE_BY_ID,
  PIRATE_ISLANDS,
  PIRATE_PORTS,
  PIRATE_SHIP_TYPES,
  PIRATE_BOSS_TYPES,
  PIRATE_DOCK_COST,
  createPirateVoyage,
  updatePirateVoyage,
  setPirateControls,
  pirateFire,
  pirateFireAt,
  pirateDamageShip,
  pirateDock,
  pirateNearPort,
  pirateSnapshot,
  pirateScreenToWorld,
  pirateStageUnlocked,
  pirateSummary,
  defaultPirateProgress,
  sanitizePirateProgress,
  recordPirateVoyage,
  recordPirateEndless,
  createPirateEndless,
  pirateEndlessSurge,
  PIRATE_ENDLESS_STAGE,
  renderPirateVoyage,
} from './pirates.js';
import { RealmsUI } from './realms_ui.js';
import { EclipseUI } from './eclipse_ui.js';
import {
  ECLIPSE_NAME, ECLIPSE_LOCAL_NAME, ECLIPSE_PITCH, ECLIPSE_ROOM_START,
  ECLIPSE_ROOMS, ECLIPSE_ROOM_BY_ID, ECLIPSE_ENEMY_INFO, ECLIPSE_BOSSES, ECLIPSE_BOSS_BY_ID,
  ECLIPSE_SECRET_BOSS, ECLIPSE_SECRET_ROOM_ID, ECLIPSE_FRAGMENTS,
  GODFALL_ROOM_START, GODFALL_FLOOR_COUNT, GODFALL_BOSSES,
  defaultEclipseProgress, sanitizeEclipseProgress, unlockEclipse, recordEclipseRoom, recordEclipseBoss,
  eclipseSummary, createGodfallRun, recordGodfallFloor, failGodfallRun,
  defaultGodfallProgress, sanitizeGodfallProgress, godfallSummary,
  defaultGuildState, sanitizeGuildState, advanceGuildWeek, recordRaidResult,
  createRaidRun, RAID_BY_ID,
  defaultAwakeningProgress, sanitizeAwakeningProgress, awakeningBonus, grantMastery,
  createSaveEnvelope, migrateSave, SAVE_KEYS,
  ECLIPSE_WEAPONS, ECLIPSE_CLASSES,
  PerformanceSampler,
} from './eclipse.js';
import { RuntimeReporter, releaseChecklist, validateEclipseContent } from './qa.js';
import {
  ASTRAL_ROOM_START,
  ASTRAL_LOCAL_NAME,
  ASTRAL_NAME,
  defaultAstralProgress,
  sanitizeAstralProgress,
  recordAstralRoomClear,
  astralSummary,
} from './astral.js';
import { defaultRealmsProgress, sanitizeRealmsProgress } from './realms.js';
import {
  COOP_MODES,
  COOP_MAX_PLAYERS,
  createLobby,
  joinLobby,
  canStartLobby,
  startLobby,
  createWebSocketTransport,
  coopSocketUrl,
  roomCodeFromSeed,
  encodeSnapshot,
  decodeSnapshot,
  SnapshotInterpolator,
  partyScaling,
} from './coop.js';

const $ = (id) => document.getElementById(id);
const FIXED = 1 / 120;
const PROGRESS_KEY = 'ashen-vow-progress-v1';
const CHARACTER_KEY = 'ashen-vow-character-v1';
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

// ── Overdrive Hub state ───────────────────────────────────────────
let overdriveTab = 'campaign301';
let profilerVisible = false;
let profilerFrameMs = 16.7;
let profilerStutterTimer = 0;

const canvas = $('game');
const renderer = new Renderer(canvas);
const audio = new SoundKit();
const music = new MusicManager(audio);
const game = new AshenGame();
const settingsStore = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();
let settings = loadSettings(settingsStore);
const mapView = new MapView($('map-canvas'));

let started = false;
let paused = false;
let menuView = 'title'; // title | fallenMenu | fallen | levels | credits | updates | storymap | character | expansion | frontier | overdrive | mode3d | court | labyrinth | fairy | speedrun | fishing | baitShop | fishIndex | none
const loadedStylesheets = new Map();
function ensureStylesheet(href) {
  if (typeof document === 'undefined') return Promise.resolve();
  if (loadedStylesheets.has(href)) return loadedStylesheets.get(href);
  const existing = [...document.querySelectorAll('link[rel="stylesheet"]')].find((el) => el.getAttribute('href') === href);
  if (existing) {
    const p = Promise.resolve(existing);
    loadedStylesheets.set(href, p);
    return p;
  }
  const promise = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve(link);
    link.onerror = () => {
      loadedStylesheets.delete(href);
      link.remove();
      reject(new Error(`Gagal memuat stylesheet: ${href}`));
    };
    document.head.appendChild(link);
  });
  loadedStylesheets.set(href, promise);
  return promise;
}
let fishingReel = null;
let fishingReelFrame = 0;
let fishIndexTab = 0;
let expansionTab = 'campaign';
let expansionChapter = 0;
let havenNpcId = 'sari';
let chronicleEventId = null;
let wardrobeFilter = 'all';
let activeRunKind = 'legacy';
let activeEclipseRoom = null;
let activeGodfallFloor = 0;
let godfallRun = null;
let activeRaid = null;
let eclipseRunStartedAt = 0;
const framePerf = new PerformanceSampler({ capacity: 240 });
const runtimeReporter = new RuntimeReporter();
runtimeReporter.install();
let activeFairyStage = -1;
let activeFairyBoss = null;
let fairyRunStartedAt = 0;
let frontierTab = 'campaign200';
let frontierProgress = defaultFrontierProgress();
let atlasTab = 'zones';
let atlasZoneId = 'vael';
let activeAtlasRoom = null;
let atlasLoreQuery = '';
let atlasLoreCategory = 'all';
let atlasShopId = 'shop_vael';
let atlasGearTab = 'armor';
let atlasCraftTab = 'cook';
let atlasDiagnostic = null;
let atlasBotResult = null;
let atlasQuickCooldown = 0;
let atlasQuickCache = '';
let atlasSearchTimer = 0;
let atlasSpeedTimer = 0;
let atlasSpeedBonus = 0;
let atlasBuffBase = null;
let atlasBuffTimer = 0;
let atlasRegenTimer = 0;
let atlasRegenAmount = 0;
// ── Hearthfall: The Hollow Court ──────────────────────────────────────────
let courtTab = 'journey';
let courtZoneId = 'hearthfall';
let courtResidentId = 'mara';
let activeCourtRoom = null;
let activeCourtTrial = null;
let activePackIndex = -1;
let packRunActive = false;
let packRunStartedAt = 0;
let courtTrialResult = null;
let courtTalkLine = '';
// ── Infinite Labyrinth state ──────────────────────────────────────────────
let labTab = 'run';
let labRun = null;
let trialRun = null;
let puzzleRun = null;
let puzzleSelected = -1;
let puzzleTab = 'stages';
let puzzleTimerInterval = null;
// ── Riftwar (MOBA 5v5) state ────────────────────────────────────────────
let mobaActive = false;
let mobaPaused = false;
let mobaMatch = null;
let mobaResult = null;
let mobaRecorded = false;
let mobaHeroId = 'core_sera';
let mobaMapId = 'ashen_rift';
let mobaLane = 'mid';
let mobaDifficulty = 'knight';
let mobaRoleFilter = 'all';
let mobaUiTimer = 0;
let mobaAim = { x: 0, y: 0 };
const mobaInput = { moveX: 0, moveY: 0, moveTarget: null, castSlot: -1, aimX: 0, aimY: 0, recall: false };
const mobaHeld = new Set();
let wdActive = false;
let wdPaused = false;
let wdMatch = null;
let wdResult = null;
let wdRecorded = false;
let wdMapId = 'ashen_keep';
let wdDifficulty = 'knight';
let wdParticleId = 'normal';
let wdEndless = false;
let wdInfinitower = false;
let wdIntroSeen = false;
let wdBossCutsceneSeen = false;
let wdSelectedTowerId = 'ballista';
let wdUiTimer = 0;
let wdRenderDirty = true;
let wdSelectionKey = '';
let wdFeedKey = '';
// ── Pirate Tide: open-world naval combat ─────────────────────────────────
let pirateActive = false;
let piratePaused = false;
let pirateMatch = null;
let pirateResult = null;
let pirateRecorded = false;
let pirateStageId = 'first_tide';
let pirateUiTimer = 0;
let pirateLastSnapshot = null;
let labDirector = null;
let labBaseStats = null;
let labWaveTimer = 0;
let labWaveEngaged = false;
let labTicks = 0;
let labRewardsOpen = false;
let labRewards = [];
let labSummaryOpen = false;
let labSummary = null;
let labGuestMode = false;
let coopGuestMode = false;
let coopSelfId = '';
let coopRunMode = 'labyrinth';
let coopGuestRoom = -1;
let labCoop = {
  role: null,
  transport: null,
  lobby: null,
  code: '',
  status: '',
  error: false,
  snapshotAt: 0,
  inputAt: 0,
  seq: 0,
  joined: false,
  runMode: 'labyrinth',
  selfId: '',
  interpolator: new SnapshotInterpolator({ delay: 0.12 }),
  peers: {},
};
const LAB_CHECKPOINT_KEY = 'ashen-vow-labyrinth-checkpoint-v1';
let game3D = null;
const input3D = {
  up: false, down: false, left: false, right: false,
  jump: false, jumpJustPressed: false,
  attackJustPressed: false, dashJustPressed: false,
  interactJustPressed: false, lockOnJustPressed: false,
  sprint: false, lookX: 0, lookY: 0,
};
let activeExpansionIndex = null;
let activeModeId = null;
let activeTrialId = null;
let modeRunRewarded = false;
let spectating = false;
let shopOpen = false;
let mapOpen = false;
let codexOpen = false;
let inventoryOpen = false;
let codexTab = 'enemies';
let settingsOpen = false;
let settingsTab = 'graphics';
let settingsSearch = '';
let settingsBaseline = null;
let settingsDiagnosticsOpen = false;
let settingsApplyState = 'saved';
let hudLayoutOpen = false;
let capabilityCache = null;
let settingsCapture = null; // { action, slot }
let settingsConflict = null; // { action, other, slot, code }
let desiredMusic = null;
let musicTick = 0;
let fpsValue = 60;
let fpsAccum = 0;
let fpsFrames = 0;
let audioUnlocked = false;
let padHeld = new Set();
let renderGate = 0;
let spectateGame = null;
let spectateRoom = 0;
let peekOffset = 0;
let peekDir = 0;
let attempts = 0;
let lastGameState = game.state;
let bannerTimer = 0;
let toastTimer = 0;
let dialogueOpen = false;
let dialogueLines = [];
let dialogueIndex = 0;
let dialogueMeta = null;
let prologueActive = false;
let prologueIndex = -1;
let prologueTimer = 0;
let prologueTotal = 0;
let prologueVoice = true;
let cutsceneActive = false;
let cutsceneScene = null;
let cutsceneTime = 0;
let cutsceneDone = null;
let cutsceneSeen = new Set();
let cutsceneBeatIndex = -1;
let postCreditTimer = -1;
let accumulator = 0;
let lastTime = performance.now();
let speedrunRun = null;
let speedrunSummaryOpen = false;
let speedrunCleared = false;
let speedrunRoomCount = 0;
let speedrunLastSummary = null;

const keys = Object.create(null);
const touchInput = Object.create(null);
const touchEnabled =
  window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

const ICONS = { iron: '⛊', ember: '✹', wind: '≋' };
const BLESSING_NAMES = {
  iron: 'Vow of Iron',
  ember: 'Vow of Embers',
  wind: 'Vow of Wind',
};

const LEVEL_META = [
  {
    glyph: '✠',
    chapter: 'CHAPTER I',
    desc: 'Gerbang retak tempat abu pertama bangkit. Bersihkan jalan dan buka segel.',
    tags: ['2 MUSUH', 'GERBANG'],
  },
  {
    glyph: '✦',
    chapter: 'CHAPTER II',
    desc: 'Balai sunyi dengan jurang dalam. Relik Bulu Bara menanti di ujung.',
    tags: ['RELIK', 'JURANG', 'SENTINEL'],
  },
  {
    glyph: '⚔',
    chapter: 'CHAPTER III',
    desc: 'Sir Mordrake menjaga singgasana. Setengah darahnya membuka fase kedua.',
    tags: ['2 FASE', 'DIALOG'],
  },
  {
    glyph: '⛧',
    chapter: 'CHAPTER IV',
    desc: 'Vhael terbangun di sarang abu. Langit runtuh, api turun, jalan terus menanjak.',
    tags: ['2 FASE', 'PILAR API'],
  },
  {
    glyph: '☩',
    chapter: 'CHAPTER V',
    desc: 'Jembatan tulang membentang di atas jurang. Wraith dan Brute menjaga setiap pijakan.',
    tags: ['WRAITH', 'BRUTE', 'JURANG'],
  },
  {
    glyph: '♱',
    chapter: 'CHAPTER VI',
    desc: 'Katedral sunyi tempat The Hollow Choir menyanyikan kematian.',
    tags: ['2 FASE', 'GEMA'],
  },
  {
    glyph: '♜',
    chapter: 'CHAPTER VII',
    desc: 'Menara Lonceng berdiri di antara dua dunia. Setiap langkah memanggil penjaga.',
    tags: ['3 MUSUH', 'LONCENG'],
  },
  {
    glyph: '✠',
    chapter: 'CHAPTER VIII',
    desc: 'Puncak Sumpah. The Oathbreaker menanti dengan tiga fase dan satu akhir.',
    tags: ['3 FASE', 'FINALE'],
  },
  {
    glyph: '⌇',
    chapter: 'MYCELIAL I',
    desc: 'Celah di balik singgasana Mordrake. Akar menggantung dan topi spora memantulkan langkah.',
    tags: ['SPORELING', 'TRAMPOLIN'],
  },
  {
    glyph: '❋',
    chapter: 'MYCELIAL II',
    desc: 'Taman spora yang bernapas. Lompat dari topi ke topi di atas jurang yang dalam.',
    tags: ['SPORELING', 'JURANG', 'AWAN SPORA'],
  },
  {
    glyph: '≋',
    chapter: 'MYCELIAL III',
    desc: 'Jembatan akar rapuh di atas kegelapan. Stalker menggali tepat di bawah kakimu.',
    tags: ['STALKER', 'JEMBATAN'],
  },
  {
    glyph: '♛',
    chapter: 'MYCELIAL IV',
    desc: 'Sarang induk tempat Brood Mother menetas tanpa henti. Dinding barat berdenyut seperti jantung.',
    tags: ['BROOD MOTHER', 'DINDING RAHASIA'],
  },
  {
    glyph: '⍋',
    chapter: 'MYCELIAL V · RAHASIA',
    desc: 'Relung yang tidak pernah masuk peta. Root of the First Vow menyimpan satu tegukan terakhir.',
    tags: ['MINI-BOSS', '+1 FLASK'],
    secret: true,
  },
  {
    glyph: '✺',
    chapter: 'MYCELIAL VI',
    desc: 'Altar Spora. The Sporebound menumbuhkan tiga fase dari akar pertama.',
    tags: ['3 FASE', 'BOSS'],
  },
];

// ── progress ─────────────────────────────────────────────────────────────
function defaultProgress() {
  return {
    version: 1,
    schemaVersion: 2,
    unlocked: 1,
    cleared: ROOMS.map(() => false),
    map: defaultMapState(ROOMS.length),
    expansion: defaultExpansionProgress(),
    atlas: defaultAtlasProgress(),
    labyrinth: defaultLabyrinthProgress(),
    court: defaultCourtProgress(),
    skills: defaultSkillState(),
    pack: defaultPackProgress(),
    fairy: defaultFairyProgress(),
    cistern: defaultCisternProgress(),
    lanternwake: defaultLanternProgress(),
    frontiers: defaultFrontierCampaignProgress(),
    overdrive: defaultOverdriveLadderState(),
    speedrun: defaultSpeedrunProgress(),
    fishing: defaultFishingProgress(),
    fallen: defaultFallenProgress(),
    crusade: defaultCrusadeProgress(),
    trials: defaultTrialProgress(),
    puzzle: defaultPuzzleProgress(),
    moba: defaultMobaProgress(),
    wavedefense: defaultWaveDefenseProgress(),
    pirates: defaultPirateProgress(),
    astral: defaultAstralProgress(),
    realms: defaultRealmsProgress(),
    eclipse: defaultEclipseProgress(),
    godfall: defaultGodfallProgress(),
    guild: defaultGuildState(),
    awakening: defaultAwakeningProgress(),
    stageTimes: {},
  };
}

function sanitizeStageTimes(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!/^(legacy|court|expansion|atlas|cistern|lanternwake|frontiers|overdrive):\d+$/.test(key) || !value || typeof value !== 'object') continue;
    result[key] = {
      label: typeof value.label === 'string' ? value.label.slice(0, 80) : key,
      best: Math.max(0, Math.round((Number(value.best) || 0) * 10) / 10),
      last: Math.max(0, Math.round((Number(value.last) || 0) * 10) / 10),
      clears: Math.max(0, Math.floor(Number(value.clears) || 0)),
    };
  }
  return result;
}

function readProgressPayload(raw) {
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === 'object' ? parsed : null;
}

function loadProgress() {
  let parsed = null;
  try {
    parsed = readProgressPayload(localStorage.getItem(PROGRESS_KEY));
  } catch {
    parsed = null;
  }
  if (!parsed) {
    try {
      parsed = readProgressPayload(localStorage.getItem(SAVE_KEYS.backup));
      if (parsed) localStorage.setItem(SAVE_KEYS.backup, JSON.stringify(parsed));
    } catch { /* storage unavailable */ }
  }
  const migration = parsed ? migrateSave(parsed) : null;
  if (migration?.ok) parsed = migration.progress;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw && (!migration || !migration.ok)) localStorage.setItem(SAVE_KEYS.quarantine, raw.slice(0, 200000));
  } catch { /* storage unavailable */ }
  try {
    if (!parsed || typeof parsed !== 'object') return defaultProgress();
    const cleared = ROOMS.map((_, i) => !!parsed.cleared?.[i]);
    const unlocked = clamp(Number(parsed.unlocked) || 1, 1, ROOMS.length);
    // v0.0.7 saves have no map state. Migrate by revealing cleared rooms and
    // the starting room instead of wiping hard-earned exploration.
    const map = parsed.map
      ? sanitizeMapState(parsed.map, ROOMS.length)
      : {
          discovered: ROOMS.map((_, i) => cleared[i] || i === 0),
          pins: [],
        };
    // Keep every unknown top-level field. v0.3.0 adds `expansion` without
    // changing the storage key or discarding future/legacy save data.
    const { version, schemaVersion: _schemaVersion, unlocked: _unlocked, cleared: _cleared, map: _map, expansion: _expansion, atlas: _atlas, labyrinth: _labyrinth, court: _court, skills: _skills, pack: _pack, fairy: _fairy, speedrun: _speedrun, fishing: _fishing, fallen: _fallen, crusade: _crusade, trials: _trials, puzzle: _puzzle, moba: _moba, wavedefense: _wavedefense, pirates: _pirates, astral: _astral, realms: _realms, eclipse: _eclipse, godfall: _godfall, guild: _guild, awakening: _awakening, cistern: _cistern, lanternwake: _lanternwake, frontiers: _frontiers, overdrive: _overdrive, stageTimes: _stageTimes, ...extras } = parsed;
    return {
      ...extras,
      version: 1,
      schemaVersion: 2,
      unlocked,
      cleared,
      map,
      expansion: sanitizeExpansionProgress(parsed.expansion),
      atlas: sanitizeAtlasProgress(parsed.atlas),
      labyrinth: sanitizeLabyrinthProgress(parsed.labyrinth),
      court: sanitizeCourtProgress(parsed.court),
      skills: sanitizeSkillState(parsed.skills),
      pack: sanitizePackProgress(parsed.pack),
      fairy: sanitizeFairyProgress(parsed.fairy),
      cistern: sanitizeCisternProgress(parsed.cistern),
      lanternwake: sanitizeLanternProgress(parsed.lanternwake),
      frontiers: sanitizeFrontierCampaignProgress(parsed.frontiers),
      overdrive: sanitizeOverdriveLadderProgress(parsed.overdrive),
      speedrun: sanitizeSpeedrunProgress(parsed.speedrun),
      fishing: sanitizeFishingProgress(parsed.fishing),
      fallen: sanitizeFallenProgress(parsed.fallen),
      crusade: sanitizeCrusadeProgress(parsed.crusade),
      trials: sanitizeTrialProgress(parsed.trials),
      puzzle: sanitizePuzzleProgress(parsed.puzzle),
      moba: sanitizeMobaProgress(parsed.moba),
      wavedefense: sanitizeWaveDefenseProgress(parsed.wavedefense),
      pirates: sanitizePirateProgress(parsed.pirates),
      astral: sanitizeAstralProgress(parsed.astral),
      realms: sanitizeRealmsProgress(parsed.realms),
      eclipse: sanitizeEclipseProgress(parsed.eclipse),
      godfall: sanitizeGodfallProgress(parsed.godfall),
      guild: sanitizeGuildState(parsed.guild),
      awakening: sanitizeAwakeningProgress(parsed.awakening, Object.keys(CHARACTERS)),
      stageTimes: sanitizeStageTimes(parsed.stageTimes),
    };
  } catch {
    return defaultProgress();
  }
}

let _saveProgressTimer = 0;
let _saveProgressLastMs = 0;
function flushSaveProgress() {
  if (_saveProgressTimer) {
    clearTimeout(_saveProgressTimer);
    _saveProgressTimer = 0;
  }
  if (activeRunKind === 'hack' && hackSnapshot) return;
  try {
    const previous = localStorage.getItem(PROGRESS_KEY);
    if (previous) localStorage.setItem(SAVE_KEYS.backup, previous);
    progress.version = 1;
    progress.schemaVersion = 2;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    _saveProgressLastMs = Date.now();
  } catch {
    /* storage unavailable — keep in memory */
  }
}

function saveProgress({ immediate = false } = {}) {
  if (activeRunKind === 'hack' && hackSnapshot) return;
  const now = Date.now();
  if (immediate || now - _saveProgressLastMs >= 1200) {
    flushSaveProgress();
    return;
  }
  if (!_saveProgressTimer) {
    _saveProgressTimer = setTimeout(() => flushSaveProgress(), 1200 - (now - _saveProgressLastMs));
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (_saveProgressTimer) flushSaveProgress();
  });
}

let progress = loadProgress();

// ── Hidden secrets ───────────────────────────────────────────────────────
function loadSecretsSave() {
  try {
    const raw = localStorage.getItem(SECRETS_SAVE_KEY);
    return sanitizeSecretsSave(raw ? JSON.parse(raw) : defaultSecretsSave());
  } catch {
    return sanitizeSecretsSave(defaultSecretsSave());
  }
}

let secretsState = loadSecretsSave();
const secretBuffer = createSecretBuffer();
let creditSceneOpen = false;
let creditSceneCurrent = null;
let creditSceneTimer = 0;
let creditSceneDelayTimer = 0;
let lastCreditEvent = null;
let lastCreditAttempt = null;
const creditArcLastAt = {};

function saveSecretsState() {
  try { localStorage.setItem(SECRETS_SAVE_KEY, JSON.stringify(secretsState)); } catch { /* storage unavailable */ }
}

function currentSecretMode() {
  if (mobaActive) return 'moba';
  if (wdActive) return 'wavedefense';
  if (menuView === 'puzzlePlay') return 'puzzle';
  if (menuView === 'realmsRun') return 'realms';
  if (menuView === 'mode3d') return game3D?.horror ? 'horror3d' : 'mode3d';
  if (menuView !== 'none' && SECRET_MODE_KEYS.includes(menuView)) return menuView;
  if (started && menuView === 'none') return activeRunKind;
  return menuView === 'title' ? 'title' : (started ? activeRunKind : null);
}

function claimModeSecret() {
  const mode = currentSecretMode();
  const mark = secretForMode(mode);
  if (!mark) return false;
  const result = recordSecret(secretsState, mark.id);
  if (!result.firstTime) return false;
  secretsState = result.state;
  saveSecretsState();
  showToast(mark.whisper, 4200);
  audio.play({ type: 'relic' });
  return true;
}

function tryCollectSecretRune() {
  const rune = game.secretRune;
  if (!rune || rune.found || !game.player) return false;
  const px = game.player.x + game.player.w / 2;
  const py = game.player.y + game.player.h / 2;
  if (Math.hypot(px - rune.x, py - rune.y) > 86) return false;
  const result = recordSecret(secretsState, rune.id);
  if (!result.ok) return false;
  secretsState = result.state;
  rune.found = true;
  game.secretRune = null;
  saveSecretsState();
  showToast(rune.whisper, 5000);
  audio.play({ type: 'relic' });
  return true;
}

function maybeCreditScene(ev) {
  if (ev.type !== 'bossDown') return false;
  const arc = isArcFinalBoss(activeRunKind, ev.kind) ? creditArcFor(activeRunKind, ev.kind) : null;
  lastCreditEvent = { kind: ev.kind, runKind: activeRunKind, arc: arc?.id || null, at: performance.now() };
  if (!arc) return false;
  lastCreditAttempt = { arc: arc.id, at: performance.now(), opened: false };
  const now = performance.now();
  if (now - (creditArcLastAt[arc.id] || -Infinity) < 6000) return false;
  creditArcLastAt[arc.id] = now;
  clearTimeout(creditSceneDelayTimer);
  creditSceneDelayTimer = window.setTimeout(() => {
    if (started) openCreditScene(arc.id);
  }, CREDIT_SCENE_DELAY_MS);
  return true;
}

function buildCreditScene(arcId) {
  const scene = creditSceneFor(arcId);
  if (!scene) return null;
  $('credit-scene-eyebrow').textContent = `${scene.numeral} · CREDIT SCENE`;
  $('credit-scene-title').textContent = scene.title;
  $('credit-scene-sub').textContent = scene.subtitle;
  $('credit-scene-line').textContent = scene.line;
  $('credit-scene-roll').innerHTML = `
    ${scene.roles.map((entry) => `
      <div class="credit-scene-role">
        <span>${esc(entry.role)}</span>
        <strong>${esc(entry.name)}</strong>
      </div>`).join('')}
    <div class="credit-scene-footer">
      <span>ASHEN VOW · ${esc(scene.numeral)}</span>
      <strong>${esc(scene.footer)}</strong>
      <em>for every soul who playtested the vow</em>
    </div>`;
  return scene;
}

function openCreditScene(arcId) {
  const scene = buildCreditScene(arcId);
  if (!scene) return false;
  clearTimeout(creditSceneTimer);
  creditSceneCurrent = scene;
  creditSceneOpen = true;
  syncScreens();
  const roll = $('credit-scene-roll');
  if (roll) {
    roll.style.animation = 'none';
    void roll.offsetWidth;
    roll.style.animation = '';
  }
  creditSceneTimer = window.setTimeout(() => closeCreditScene(), CREDIT_SCENE_AUTO_CLOSE_MS);
  if (lastCreditAttempt?.arc === arcId) lastCreditAttempt.opened = true;
  return true;
}

function closeCreditScene() {
  if (!creditSceneOpen) return;
  creditSceneOpen = false;
  creditSceneCurrent = null;
  clearTimeout(creditSceneTimer);
  creditSceneTimer = 0;
  syncScreens();
}

// ── Update XVII: 3D Scary Mode save ──────────────────────────────────────
function load3DHorrorSave() {
  try {
    const raw = localStorage.getItem(HORROR3D_SAVE_KEY);
    return sanitize3DHorrorSave(raw ? JSON.parse(raw) : {});
  } catch {
    return default3DHorrorSave();
  }
}

let horror3D = load3DHorrorSave();
let horror3DSiteId = horror3D.lastSite || HORROR3D_SITES[0].id;

function save3DHorrorState() {
  try { localStorage.setItem(HORROR3D_SAVE_KEY, JSON.stringify(horror3D)); } catch { /* storage unavailable */ }
}

// ── Scary Mode 2.0 — The Nightmare Protocol (Update XI) ───────────────────
// Three separate layers live in one settings object but stay independent:
// horror difficulty (enemy behaviour), scare presentation, and anti-jumpscare.
function loadHorrorJournalState() {
  try {
    const raw = localStorage.getItem(HORROR_SAVE_KEY);
    return new HorrorJournal(raw ? JSON.parse(raw) : {});
  } catch {
    return new HorrorJournal({});
  }
}

let horrorJournal = loadHorrorJournalState();
let horrorDirector = null;
let horrorPresentation = null;
let horrorLedger = new ScareLedger({ maxPerSession: 25, repeatPrevention: true });
let scaryTab = 'jumpscare';
let horrorPresence = null;
let horrorEventLayer = {};
let horrorLastDone = null;
let horrorSignature = '';
let horrorAutoTimer = 6;

function horrorSettings() {
  return sanitizeHorrorSettings(settings.scary || {});
}

function saveHorrorState() {
  try {
    localStorage.setItem(HORROR_SAVE_KEY, JSON.stringify(horrorJournal.toJSON()));
  } catch { /* storage unavailable */ }
}

// ── Update XIX: The Hunter's Kit ─────────────────────────────────────────
function loadHunterState() {
  try {
    const raw = localStorage.getItem(HUNTER_SAVE_KEY);
    return sanitizeHunterSave(raw ? JSON.parse(raw) : defaultHunterSave());
  } catch {
    return sanitizeHunterSave(defaultHunterSave());
  }
}

let hunterState = loadHunterState();
let hunterShopOpen = false;

function saveHunterState() {
  try { localStorage.setItem(HUNTER_SAVE_KEY, JSON.stringify(hunterState)); } catch { /* storage unavailable */ }
}

/** Persistent stock is copied into a run; spent stock is copied back out. */
function syncHunterStockToRun() {
  game.setHunterItems(hunterState.items);
}

function syncHunterFromGame() {
  if (!started) return hunterState;
  hunterState.items = { ...game.player.hunterItems };
  saveHunterState();
  return hunterState;
}

function horrorContext() {
  const enemies = game.enemies ? game.enemies.filter((e) => !e.dead) : [];
  return {
    roomIndex: game.roomIndex,
    hp: game.player ? game.player.hp : 1,
    maxHp: game.player ? game.player.maxHp : 100,
    dead: game.state === 'dead',
    menu: menuView !== 'none',
    paused: !!paused,
    dialogue: !!dialogueOpen,
    cinematic: !!dialogueOpen || game.state === 'blessing',
    combat: enemies.some((e) => e.aiState === 'chase' || e.aiState === 'attack'),
    roomCleared: true,
    enemyCount: enemies.length,
    enemySlots: 6,
    collectiblePresent: false,
    optionalRoute: true,
  };
}

function ensureHorrorDirector() {
  const next = horrorSettings();
  if (!horrorDirector) horrorDirector = new HorrorEventDirector(next, { seed: 20261119, roomIndex: game.roomIndex });
  else horrorDirector.configure(next);
  horrorPresentation = resolveHorrorPresentation(next, {
    accessibility: settings.accessibility || {},
    graphics: settings.graphics || {},
  });
  horrorLedger.maxPerSession = horrorPresentation.jumpscares.maxPerSession;
  horrorLedger.repeatPrevention = horrorPresentation.jumpscares.repeatPrevention;
  return horrorPresentation;
}

/** Push the resolved layers into the simulation, the director and the HUD. */
function syncHorror() {
  const presentation = ensureHorrorDirector();
  if (game && typeof game.setScaryMode === 'function') {
    game.setScaryMode({ enabled: presentation.enabled, difficulty: presentation.difficulty });
  }
  if (game3D && typeof game3D.setScaryMode === 'function') game3D.setScaryMode(presentation);
  if (scareDirector) {
    scareDirector.configure({
      ...settings.scary,
      enabled: presentation.jumpscares.possible,
      intensity: presentation.jumpscares.intensity,
      maxScaresPerSession: presentation.jumpscares.maxPerSession,
    }, settings.accessibility);
  }
  const antiBtn = document.getElementById('btn-pause-anti');
  if (antiBtn) {
    antiBtn.textContent = `ANTI-JUMPSCARE: ${presentation.antiJumpscare ? 'AKTIF' : 'MATI'}`;
    antiBtn.classList.toggle('armed', presentation.antiJumpscare);
  }
  horrorSignature = JSON.stringify([settings.scary, settings.accessibility, settings.graphics?.preset, settings.graphics?.postProcessing]);
  return presentation;
}

function syncHorrorIfChanged() {
  if (!horrorPresentation) return syncHorror();
  const sig = JSON.stringify([settings.scary, settings.accessibility, settings.graphics?.preset, settings.graphics?.postProcessing]);
  return sig === horrorSignature ? horrorPresentation : syncHorror();
}

function horrorRowHTML(def) {
  const value = getSettingsValue(settings, def.path);
  const id = `horror-${def.tab}-${def.path.replace(/\./g, '-')}`;
  let control = '';
  if (def.type === 'toggle') {
    control = `<label class="scary-toggle"><input type="checkbox" id="${id}" data-horror-path="${def.path}" ${value ? 'checked' : ''} /><span>${value ? 'AKTIF' : 'MATI'}</span></label>`;
  } else if (def.type === 'select') {
    control = `<select class="scary-select" id="${id}" data-horror-path="${def.path}">${def.options.map((option) => `<option value="${option.id}" ${String(value) === option.id ? 'selected' : ''}>${option.label}</option>`).join('')}</select>`;
  } else {
    control = `<div class="scary-range"><input type="range" id="${id}" min="${def.min}" max="${def.max}" step="${def.step}" value="${Number(value)}" data-horror-path="${def.path}" /><output>${Number(value)}${def.suffix || ''}</output></div>`;
  }
  return `<div class="scary-row${def.highlight ? ' highlight' : ''}"><label for="${id}"><span>${def.label}</span><small>${def.desc}</small></label>${control}</div>`;
}

function scaryDifficultyCards() {
  const current = horrorSettings().difficulty;
  return `<section class="scary-difficulty">${Object.values(SCARY_DIFFICULTY).map((entry) => `
    <button class="scary-difficulty-card${entry.id === current ? ' active' : ''}" type="button" data-scary-difficulty="${entry.id}" aria-pressed="${entry.id === current}">
      <b>${entry.label}</b><em>${entry.tagline}</em>
      <ul>${entry.rows.map(([key, value]) => `<li>${key}: <strong>${value}</strong></li>`).join('')}</ul>
    </button>`).join('')}</section>`;
}

function scaryJournalPanel() {
  const progressData = horrorJournal.progress();
  const achievements = horrorJournal.achievements();
  return `
    <section class="scary-group"><h3>JURNAL HOROR</h3><div class="scary-journal">${[
      ['Musuh ditemui', progressData.enemies], ['Peristiwa ditemukan', progressData.events],
      ['Area diselesaikan', progressData.areas], ['Bos opsional', progressData.bosses],
      ['Relik tersembunyi', progressData.relics], ['Tantangan', progressData.challenges],
      ['Hadiah kosmetik', progressData.rewards],
    ].map(([label, value]) => `<div class="scary-journal-row"><span>${label}</span><b>${value}</b></div>`).join('')}</div></section>
    <section class="scary-group"><h3>PERISTIWA HOROR</h3><div class="scary-journal">${HORROR_EVENT_LIST.map((eventData) => `<div class="scary-journal-row"><span>${eventData.icon} ${eventData.label}</span><b>${horrorJournal.events[eventData.id] || 0}×</b></div>`).join('')}</div></section>
    <section class="scary-group"><h3>ACHIEVEMENT</h3>${achievements.map((entry) => `<div class="scary-achievement ${entry.unlocked ? 'unlocked' : 'locked'}"><span class="icon">${entry.icon}</span><div><b>${entry.label}</b><small>${entry.desc}</small></div></div>`).join('')}</section>
    <section class="scary-group"><h3>HADIAH KOSMETIK</h3>${HORROR_REWARDS.map((reward) => `<div class="scary-achievement ${horrorJournal.rewards.includes(reward.id) ? 'unlocked' : 'locked'}"><span class="icon">✦</span><div><b>${reward.label}</b><small>${reward.kind} · kosmetik</small></div></div>`).join('')}</section>
    <section class="scary-group"><h3>STATISTIK</h3><div class="scary-journal">${Object.entries(horrorJournal.counters).map(([key, value]) => `<div class="scary-journal-row"><span>${key}</span><b>${value}</b></div>`).join('')}</div></section>`;
}

function hunterShopCard(item) {
  const count = hunterState.items[item.id] || 0;
  const check = hunterCanBuy(hunterState, item.id);
  const label = check.ok ? `BELI · ◈ ${item.price}` : check.poor ? `◈ ${item.price}` : 'STOK PENUH';
  return `
    <article class="shop-card hunter-card${count > 0 ? ' owned' : ''}${check.ok ? '' : ' disabled'}${check.poor ? ' poor' : ''}">
      <span class="shop-icon" aria-hidden="true">${item.glyph}</span>
      <span class="shop-type">PERLENGKAPAN PEMBURU</span>
      <h3 class="shop-name">${esc(item.name)}</h3>
      <p class="shop-desc">${esc(item.desc)}</p>
      <p class="shop-note">${esc(item.effect)}</p>
      <p class="shop-note">STOK RUN INI · ${count}</p>
      <button class="btn ${check.ok ? 'btn-primary' : 'btn-ghost'} btn-small shop-buy" type="button" data-hunter-buy="${item.id}" ${check.ok ? '' : 'disabled'}>${label}</button>
    </article>`;
}

function buildHunterShop() {
  const wrap = $('hunter-shop-items');
  if (!wrap) return;
  const marks = $('hunter-shop-marks');
  if (marks) marks.textContent = hunterState.marks;
  const report = $('hunter-shop-report');
  if (report) {
    const summary = hunterSummary(hunterState);
    report.textContent = `${summary.stock} stok tersimpan · ${summary.banished} roh diusir · ${summary.uses} alat dipakai`;
  }
  wrap.innerHTML = HUNTER_ITEMS.map(hunterShopCard).join('');
}

function openHunterShop() {
  if (dialogueOpen || spectating) return false;
  hunterShopOpen = true;
  clearHeldKeys();
  buildHunterShop();
  syncScreens();
  return true;
}

function closeHunterShop() {
  if (!hunterShopOpen) return;
  hunterShopOpen = false;
  clearHeldKeys();
  lastTime = performance.now();
  accumulator = 0;
  syncScreens();
  updateHud();
}

function buyHunterItem(id) {
  const result = hunterBuy(hunterState, id, Date.now());
  if (!result.ok) {
    showToast(result.reason, 1700);
    return result;
  }
  if (started && menuView === 'none') game.addHunterItem(id, result.item.pack, true);
  saveHunterState();
  buildHunterShop();
  updateHud();
  showToast(`Dibeli: ${result.item.name} · ◈ ${result.marks}`, 1600);
  return result;
}

// ── Update XXV: The Vigil Tree (Scary Mode skill tree) ───────────────────
function horrorTreeState() {
  return horrorTreeSnapshot(horrorJournal.skills, horrorJournal.snapshot());
}

function scaryTreePanel() {
  const state = horrorTreeState();
  const branches = state.branches.map((branch) => {
    const owned = branch.nodes.reduce((sum, node) => sum + node.rank, 0);
    const total = branch.nodes.reduce((sum, node) => sum + node.maxRank, 0);
    const nodes = branch.nodes.map((node) => {
      const pips = Array.from({ length: node.maxRank }, (_, index) => (index < node.rank ? '●' : '○')).join('');
      const label = node.rank >= node.maxRank ? 'MAKSIMUM' : `NAIK · ${node.cost} POIN`;
      return `
        <div class="tree-node${node.rank >= node.maxRank ? ' maxed' : ''}${node.canRank ? '' : ' locked'}">
          <div class="tree-node-top"><span aria-hidden="true">${node.icon}</span><b>${esc(node.label)}</b><span class="rank" aria-label="${node.rank} dari ${node.maxRank} rank">${pips}</span></div>
          <small>${esc(node.description)}${node.next ? `<br><em>Berikutnya: ${esc(node.next)}</em>` : ''}</small>
          <button class="btn btn-ghost btn-small" type="button" data-horror-rank="${node.id}" ${node.canRank ? '' : 'disabled'}>${label}</button>
        </div>`;
    }).join('');
    return `<section class="tree-branch"><header><b>${branch.icon} ${esc(branch.label)}</b><span>${owned}/${total}</span></header><p>${esc(branch.desc)}</p>${nodes}</section>`;
  }).join('');
  return `
    <div class="tree-head">
      <h3>POHON KEWASPADAAN</h3>
      <div class="tree-points"><span>POIN <b>${state.available}</b></span><span>DIPAKAI <b>${state.spent}</b></span><span>RANK <b>${state.ranksOwned}/${state.maxRanks}</b></span></div>
      <button class="btn btn-ghost btn-small" type="button" data-horror-tree-reset ${state.spent ? '' : 'disabled'}>RESET GRATIS</button>
    </div>
    <div class="tree-branches">${branches}</div>
    <p class="micro">Poin terkumpul dari jurnal horor: ${state.earned}. Efek diterapkan sekali saat run Scary Mode dimulai; kampanye dan kesulitan horor tidak berubah.</p>`;
}

function rankHorrorTree(id) {
  const state = horrorTreeState();
  const result = horrorRankUp(horrorJournal.skills, id, state.available);
  if (!result.ok) {
    const reason = result.reason === 'points' ? 'Poin tidak cukup.'
      : result.reason === 'maxed' ? 'Rank sudah maksimum.'
        : 'Butuh prasyarat di tier sebelumnya.';
    showToast(reason, 1600);
    return result;
  }
  horrorJournal.skills = result.ranks;
  saveHorrorState();
  if (menuView === 'scary') buildScaryScreen();
  showToast(`Rank naik · ${horrorTreeState().available} poin tersisa`, 1400);
  return result;
}

function resetHorrorTree() {
  horrorJournal.skills = horrorResetSkills();
  saveHorrorState();
  if (menuView === 'scary') buildScaryScreen();
  showToast('Pohon Kewaspadaan direset · semua poin kembali', 1600);
  return horrorTreeState();
}

function buildScaryScreen() {
  const summary = $('scary-summary');
  const tabs = $('scary-tabs');
  const body = $('scary-body');
  if (!summary || !tabs || !body) return null;
  const presentation = syncHorror();
  const progressData = horrorJournal.progress();
  const snap = horrorDirector ? horrorDirector.snapshot() : null;
  summary.innerHTML = [
    ['Status', presentation.enabled ? 'AKTIF' : 'MATI', !presentation.enabled],
    ['Kesulitan', presentation.profile.label.split(' — ')[0]],
    ['Anti-Jumpscare', presentation.antiJumpscare ? 'AKTIF' : 'MATI', presentation.antiJumpscare],
    ['Intensitas', String(presentation.profile.intensity).toUpperCase()],
    ['Peristiwa', progressData.events],
    ['Achievement', progressData.achievements],
    ['Event aktif', snap?.active ? snap.active.label : '—'],
    ['Sisa scare', `${horrorLedger.remaining()}`],
  ].map(([label, value, warn]) => `<div class="scary-cell${warn ? ' warn' : ''}"><b>${label}</b><span>${esc(String(value))}</span></div>`).join('');
  tabs.innerHTML = HORROR_TABS.map((tab) => `<button class="scary-tab${scaryTab === tab.id ? ' active' : ''}" type="button" role="tab" aria-selected="${scaryTab === tab.id}" data-scary-tab="${tab.id}"><span>${tab.icon}</span> ${tab.label}</button>`).join('');
  const list = horrorSettingsForTab(scaryTab).map(horrorRowHTML).join('');
  const tabLabel = HORROR_TABS.find((tab) => tab.id === scaryTab)?.label || '';
  body.innerHTML = `
    ${scaryTab === 'tree' ? scaryTreePanel() : ''}
    ${scaryTab === 'jumpscare' ? scaryDifficultyCards() : ''}
    ${scaryTab === 'tree' ? '' : `<section class="scary-group"><h3>${tabLabel}</h3>${list}</section>`}
    ${scaryTab === 'jumpscare' ? scaryJournalPanel() : ''}
    <p class="micro">Kontrol horor disimpan di ashen-vow-settings-v1 · jurnal di ${HORROR_SAVE_KEY} · kesulitan horor terpisah dari kampanye.</p>`;
  return presentation;
}

function openScary() {
  menuView = 'scary';
  buildScaryScreen();
  syncScreens();
}

function closeScary() {
  menuView = 'title';
  syncScreens();
}

function startScaryRun() {
  settings.scary.enabled = true;
  applySettings();
  syncHorror();
  horrorSignature = '';
  menuView = 'none';
  startRun(0);
  syncHorror();
  applyHorrorTree(game, horrorTreeBonuses(horrorJournal.skills));
  showToast(`SCARY MODE · ${SCARY_DIFFICULTY[horrorSettings().difficulty].label}`, 2400);
  return true;
}

function setHorrorPath(path, value) {
  setSettingsValue(settings, path, value);
  applySettings();
  syncHorror();
  if (menuView === 'scary') buildScaryScreen();
  return true;
}

function toggleAntiJumpscare(force) {
  const next = typeof force === 'boolean' ? force : !horrorSettings().antiJumpscare;
  settings.scary.antiJumpscare = next;
  if (settings.dread) settings.dread.antiJumpscare = next;
  dreadSignature = '';
  applySettings({ persist: false });
  syncHorror();
  if (next) settings.scary.enabled = true;
  applySettings();
  syncHorror();
  if (menuView === 'scary') buildScaryScreen();
  showToast(`ANTI-JUMPSCARE ${next ? 'AKTIF' : 'MATI'}`, 1600);
  return next;
}

function previewHorrorAudio() {
  audio.init();
  audio.playScare({
    duration: 1.8,
    audio: { type: 'sine', freq: 210, sweepTo: 96, dur: 1.8, gain: 0.07, muted: false },
    gain: 0.07,
  });
  showToast('Pratinjau audio horor · volume mengikuti batas horor', 1800);
}

function previewHorrorVisual() {
  horrorPresence = { nx: 0.74, ny: 0.42, alpha: 1, size: 64, color: '#05070a' };
  showToast('Pratinjau atmosfer · siluet, kabut, dan vignette', 1800);
  if (horrorSettings().jumpscares && !horrorSettings().antiJumpscare) previewScare();
  return horrorPresentation;
}

function resetHorrorSettings() {
  settings.scary = sanitizeHorrorSettings({ enabled: settings.scary.enabled });
  applySettings();
  syncHorror();
  if (menuView === 'scary') buildScaryScreen();
  return horrorSettings();
}

function horrorTick(dt) {
  const presentation = syncHorrorIfChanged();
  // A run reset (Level Select / restart) rebuilds enemies; re-apply the layer.
  if (game.scaryEnabled !== presentation.enabled || game.scaryDifficulty !== presentation.difficulty) {
    game.setScaryMode({ enabled: presentation.enabled, difficulty: presentation.difficulty });
  }
  if (!horrorDirector) return presentation;
  const ctx = horrorContext();
  const snapshot = horrorDirector.update(dt, ctx);
  if (snapshot.last && snapshot.last.phase === 'done') {
    const key = `${snapshot.last.id}:${horrorDirector.completed[snapshot.last.id]}`;
    if (key !== horrorLastDone) {
      horrorLastDone = key;
      if (horrorJournal.record('events', snapshot.last.id)) {
        horrorJournal.grantRewards();
        saveHorrorState();
      }
    }
  }
  for (const change of horrorDirector.drain()) {
    if (change.layer === 'presence') {
      horrorPresence = change.value === 'appear'
        ? { nx: 0.74 + Math.random() * 0.12, ny: 0.38 + Math.random() * 0.12, alpha: 1, size: 58, color: '#05070a' }
        : null;
    } else if (change.layer === 'audio') {
      horrorEventLayer.audio = change.value;
    } else if (change.layer === 'lighting') {
      horrorEventLayer.lighting = change.value;
    } else if (change.layer === 'screen') {
      horrorEventLayer.screen = change.value;
    } else if (change.layer === 'ui') {
      horrorEventLayer.ui = change.value;
    } else if (change.layer === 'route') {
      horrorEventLayer.route = change.value;
    } else if (change.layer === 'pursuer') {
      horrorEventLayer.pursuer = change.value;
      if (change.value === 'spawn' && presentation.enabled) {
        const kind = presentation.difficulty === 'hard' ? 'night_stalker' : 'hollow_wraith';
        game.spawnScaryEnemy(kind, Math.max(80, game.player.x + 320));
      }
    } else if (change.layer === 'ghost') {
      horrorEventLayer.ghost = change.value;
      if (change.value !== 'leave' && presentation.enabled
        && !game.enemies.some((enemy) => !enemy.dead && enemy.scaryKind === change.value)) {
        game.spawnScaryEnemy(change.value, Math.max(80, game.player.x + 340));
      }
    } else if (change.layer === 'rift') {
      horrorEventLayer.rift = change.value;
      if (change.value === 'open' && presentation.enabled) {
        game.spawnScaryEnemy('forgotten_one', Math.max(120, game.player.x + 420));
      }
    }
  }
  if (horrorPresence && horrorPresence.alpha > 0) {
    horrorPresence.alpha = Math.max(0, horrorPresence.alpha - dt * 0.35);
    if (horrorPresence.alpha <= 0.01) horrorPresence = null;
  }
  horrorAutoTimer -= dt;
  if (horrorAutoTimer <= 0) {
    horrorAutoTimer = 8 + Math.random() * 10;
    // Auto-start belongs to real frame steps; a debug/time-skip tick must not
    // spawn an event the caller did not ask for.
    if (dt < 1.5 && presentation.enabled && !snapshot.active && ctx.combat === false && !ctx.menu && !paused) {
      horrorDirector.autoStart(ctx);
    }
  }
  return presentation;
}

function horrorRenderLayer() {
  if (!horrorPresentation || !horrorPresentation.enabled) return null;
  return {
    ...horrorPresentation,
    presence: horrorPresence && horrorPresence.alpha > 0.01
      ? {
        x: (horrorPresence.nx ?? 0.72) * (game.viewW || 1280),
        y: (horrorPresence.ny ?? 0.42) * (game.viewH || 720),
        alpha: horrorPresence.alpha,
        size: horrorPresence.size || 58,
        color: horrorPresence.color,
      }
      : null,
    event: horrorEventLayer,
  };
}

document.addEventListener('click', (event) => {
  const node = event.target instanceof Element ? event.target : null;
  if (!node) return;
  const hunterBuyBtn = node.closest('[data-hunter-buy]');
  if (hunterBuyBtn) { buyHunterItem(hunterBuyBtn.dataset.hunterBuy); return; }
  if (node.closest('#btn-scary-menu')) { openScary(); return; }
  if (node.closest('#btn-scary-close')) { closeScary(); return; }
  if (node.closest('#btn-pause-anti')) { toggleAntiJumpscare(); return; }
  const rankBtn = node.closest('[data-horror-rank]');
  if (rankBtn) { rankHorrorTree(rankBtn.dataset.horrorRank); return; }
  if (node.closest('[data-horror-tree-reset]')) { resetHorrorTree(); return; }
  const tab = node.closest('[data-scary-tab]');
  if (tab) { scaryTab = tab.dataset.scaryTab; buildScaryScreen(); return; }
  const difficulty = node.closest('[data-scary-difficulty]');
  if (difficulty) {
    settings.scary.difficulty = difficulty.dataset.scaryDifficulty;
    applySettings();
    syncHorror();
    buildScaryScreen();
    return;
  }
  const action = node.closest('[data-scary-action]');
  if (!action) return;
  const kind = action.dataset.scaryAction;
  if (kind === 'enter') startScaryRun();
  else if (kind === 'reset') resetHorrorSettings();
  else if (kind === 'preview-audio') previewHorrorAudio();
  else if (kind === 'preview-visual') previewHorrorVisual();
  else if (kind === 'hunter') openHunterShop();
});

document.addEventListener('input', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLElement) || !input.dataset || !input.dataset.horrorPath) return;
  let value = input.type === 'checkbox' ? input.checked : input.value;
  if (input.type === 'range') value = Number(value);
  setSettingsValue(settings, input.dataset.horrorPath, value);
  applySettings({ persist: false });
  syncHorror();
  const output = input.parentElement ? input.parentElement.querySelector('output') : null;
  if (output) output.textContent = `${value}`;
  if (input.type === 'checkbox') {
    const span = input.nextElementSibling;
    if (span) span.textContent = input.checked ? 'AKTIF' : 'MATI';
  }
});

document.addEventListener('change', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLElement) || !input.dataset || !input.dataset.horrorPath) return;
  applySettings();
  syncHorror();
  if (menuView === 'scary') buildScaryScreen();
});

// ── Update XII: The Dread Beyond (Scary Mode expansion) ──────────────────
const DREAD_VIEW_TABS = [
  { id: 'environments', label: 'Lingkungan', icon: '⌂' },
  { id: 'unnatural', label: 'The Unnatural', icon: '☾' },
  { id: 'bosses', label: 'Bos Horor', icon: '♛' },
  { id: 'modes', label: 'Mode', icon: '◇' },
  { id: 'equipment', label: 'Peralatan', icon: '⚒' },
  { id: 'journal', label: 'Jurnal & Misteri', icon: '✦' },
  { id: 'settings', label: 'Pengaturan', icon: '◈' },
];

let dreadTab = 'environments';
let dreadActiveMode = null;
let dreadBossActive = null;
let dreadPresence = null;
let dreadEventLayer = {};
let dreadAutoTimer = 9;
let dreadSignature = '';
let dreadDistance = 0;
let dreadLastX = null;
let dreadEquipmentLoadout = [];

settings.dread = sanitizeDreadSettings(settings.dread || {});
let dreadJournal = loadDreadJournal();
let dreadDirector = new DreadEventDirector(dreadSettings(), { seed: 20261119 });
let dreadAwareness = new AwarenessManager({ config: { enabled: dreadSettings().awarenessEnabled } });

function dreadSettings() {
  return sanitizeDreadSettings(settings.dread || {});
}

function loadDreadJournal() {
  try {
    const raw = localStorage.getItem(DREAD_SAVE_KEY);
    return new DreadJournal(raw ? JSON.parse(raw) : {});
  } catch {
    return new DreadJournal({});
  }
}

function saveDreadState() {
  try {
    localStorage.setItem(DREAD_SAVE_KEY, JSON.stringify(dreadJournal.toJSON()));
  } catch { /* storage unavailable */ }
}

function syncDread() {
  const next = sanitizeDreadSettings(settings.dread || {});
  settings.dread = next;
  const signature = JSON.stringify([next, settings.scary?.antiJumpscare, settings.scary?.enabled]);
  if (signature !== dreadSignature) {
    dreadDirector.configure(next);
    dreadAwareness.setEnabled(next.awarenessEnabled);
    dreadSignature = signature;
  }
  return resolveDreadPresentation(next, settings.scary || {}, { mode3D: false });
}

function dreadContext() {
  const base = horrorContext();
  return { ...base, boss: !!game.boss, dark: true };
}

function firstUndiscovered(category) {
  return DREAD_JOURNAL_ENTRIES.find((entry) => entry.category === category && !dreadJournal.entries[entry.id]) || null;
}

function recordDreadObjective(modeId, objectiveId, amount = 1) {
  if (!modeId) return 0;
  const key = `mode:${modeId}:${objectiveId}`;
  const next = Math.max(0, (Number(dreadJournal.flags[key]) || 0) + amount);
  dreadJournal.flags[key] = next;
  saveDreadState();
  return next;
}

function dreadModeState(modeId) {
  const mode = DREAD_MODES[modeId];
  if (!mode) return { objectives: {} };
  const objectives = {};
  for (const goal of mode.objectives) {
    objectives[goal.id] = Math.max(0, Number(dreadJournal.flags[`mode:${modeId}:${goal.id}`]) || 0);
  }
  return { objectives };
}

function completeDreadMode(modeId) {
  if (!modeId) return null;
  const progressData = dreadModeProgress(modeId, dreadModeState(modeId));
  if (!progressData || !progressData.complete) return progressData;
  if (dreadJournal.recordMode(modeId)) {
    dreadJournal.grantRewards();
    saveDreadState();
    showToast(`MODE SELESAI · ${DREAD_MODES[modeId].label}`, 2400);
  }
  return progressData;
}

function applyDreadChange(change) {
  if (!change) return;
  if (change.layer === 'presence') {
    dreadPresence = change.value === 'clear'
      ? null
      : { nx: 0.6 + Math.random() * 0.24, ny: 0.36 + Math.random() * 0.16, alpha: 1, size: change.value === 'crowd' ? 46 : 56, kind: change.value };
    return;
  }
  if (change.layer !== 'outcome') {
    dreadEventLayer[change.layer] = change.value;
    return;
  }
  const outcome = change.outcome || {};
  if (outcome.kind === 'journal') {
    const entry = firstUndiscovered('mysteries') || firstUndiscovered('entities');
    if (entry) { dreadJournal.discover(entry.id); dreadAwareness.addClue(); }
  } else if (outcome.kind === 'recording') {
    const entry = firstUndiscovered('recordings');
    if (entry) { dreadJournal.discover(entry.id); dreadJournal.recordRecording(entry.slug); }
  } else if (outcome.kind === 'lore') {
    const entry = firstUndiscovered('residents') || firstUndiscovered('events');
    if (entry) dreadJournal.discover(entry.id);
  } else if (outcome.kind === 'collectible') {
    const entry = firstUndiscovered('symbols') || firstUndiscovered('experiments');
    if (entry) { dreadJournal.discover(entry.id); dreadJournal.collect(entry.id, entry.evidence[0]); }
  } else if (outcome.kind === 'encounter') {
    const kind = game.dreadEnvironmentId === 'hollow_hospital' ? 'ceiling_dweller' : 'faceless_visitor';
    game.spawnUnnatural(kind, Math.max(80, game.player.x + 340));
    dreadAwareness.addEncounter();
    if (dreadActiveMode) recordDreadObjective(dreadActiveMode, 'encounters', 1);
  } else if (outcome.kind === 'mirror') {
    game.spawnUnnatural('forgotten_twin', Math.max(120, game.player.x + 380));
    if (dreadActiveMode) recordDreadObjective(dreadActiveMode, 'encounters', 1);
  } else if (outcome.kind === 'route' || outcome.kind === 'objective' || outcome.kind === 'puzzle' || outcome.kind === 'mislead') {
    dreadJournal.recordChallenge('objective');
  }
  if (dreadActiveMode) recordDreadObjective(dreadActiveMode, 'events', 1);
  dreadJournal.grantRewards();
  saveDreadState();
}

function dreadTick(dt) {
  if (!started || paused || menuView !== 'none') return null;
  const presentation = syncDread();
  if (!presentation.enabled) return presentation;
  const ctx = dreadContext();
  dreadDirector.update(dt, ctx);
  for (const change of dreadDirector.drain()) applyDreadChange(change);
  if (dreadPresence) {
    dreadPresence.alpha = Math.max(0, dreadPresence.alpha - dt * 0.4);
    if (dreadPresence.alpha <= 0.02) dreadPresence = null;
  }
  dreadAwareness.tick(dt);
  if (game.player) {
    if (Math.abs(game.player.vx) > 60 && typeof game.emitNoise === 'function') {
      game.emitNoise('step', game.player.x + game.player.w / 2, { loudness: 0.6, ttl: 0.5 });
    }
    if (dreadActiveMode) {
      if (dreadLastX != null) dreadDistance += Math.abs(game.player.x - dreadLastX);
      if (dreadDistance >= 1200) {
        dreadDistance = 0;
        recordDreadObjective(dreadActiveMode, 'distance', 1);
      }
    }
    dreadLastX = game.player.x;
  }
  if (dreadBossActive && !game.boss) {
    if (dreadActiveMode) recordDreadObjective(dreadActiveMode, 'boss', 1);
    dreadJournal.recordBoss(dreadBossActive);
    dreadBossActive = null;
    saveDreadState();
  }
  if (dreadActiveMode) completeDreadMode(dreadActiveMode);
  dreadAutoTimer -= dt;
  if (dreadAutoTimer <= 0) {
    dreadAutoTimer = 10 + Math.random() * 12;
    if (dt < 1.5 && !game.boss && !ctx.combat) dreadDirector.autoStart(ctx);
  }
  return presentation;
}

function dreadRenderLayer() {
  const env = game.dreadEnv || DREAD_ENVIRONMENTS[game.dreadEnvironmentId] || null;
  if (!env || !dreadSettings().enabled) return null;
  const presentation = resolveDreadPresentation(dreadSettings(), settings.scary || {});
  return {
    environment: env,
    cameraX: 0,
    fog: presentation.atmosphere.fog,
    ceilingShadow: game.enemies.some((enemy) => enemy.unnaturalKind === 'ceiling_dweller'),
    mirror: game.boss?.dreadBoss === 'forgotten_twin',
    presence: dreadPresence,
    event: dreadEventLayer,
  };
}

function dreadRowHTML(def) {
  const value = getSettingsValue(settings, def.path);
  const id = `dread-${def.path.replace(/\./g, '-')}`;
  let control;
  if (def.type === 'toggle') {
    control = `<label class="scary-toggle"><input type="checkbox" id="${id}" data-dread-path="${def.path}" ${value ? 'checked' : ''} /><span>${value ? 'AKTIF' : 'MATI'}</span></label>`;
  } else if (def.type === 'select') {
    control = `<select class="scary-select" id="${id}" data-dread-path="${def.path}">${def.options.map((option) => `<option value="${option.id}" ${String(value) === String(option.id) ? 'selected' : ''}>${esc(String(option.label))}</option>`).join('')}</select>`;
  } else {
    control = `<div class="scary-range"><input type="range" id="${id}" min="${def.min}" max="${def.max}" step="${def.step}" value="${Number(value)}" data-dread-path="${def.path}" /><output>${Number(value)}${def.suffix || ''}</output></div>`;
  }
  return `<div class="scary-row"><label for="${id}"><span>${def.label}</span><small>${def.desc}</small></label>${control}</div>`;
}

function dreadEnvironmentCards() {
  return `<div class="dread-grid">${DREAD_ENVIRONMENT_LIST.map((env) => `
    <article class="dread-card">
      <header><h3>${esc(env.label)}</h3><span>${env.mechanics.length} mekanik</span></header>
      <p>${esc(env.tagline)}</p>
      <ul>
        <li>2D: ${env.room.platforms.length} platform · ${env.ceilings.length} langit-langit</li>
        <li>3D: ${env.threeD.props.length} prop · kabut ${Math.round(env.threeD.fog * 100)}%</li>
        <li>Petunjuk: ${env.clues.map((clue) => esc(clue.label)).join(' · ')}</li>
      </ul>
      <button class="btn btn-primary btn-small" type="button" data-dread-enter="${env.id}">MASUKI</button>
    </article>`).join('')}</div>`;
}

function dreadUnnaturalCards() {
  return `<div class="dread-grid">${UNNATURAL_LIST.map((entry) => `
    <article class="dread-card dread-unnatural">
      <header><h3>${esc(entry.name)}</h3><span>${esc(entry.tactic)}</span></header>
      <p>${esc(entry.line)}</p>
      <ul>
        <li>Penglihatan: ${entry.sightRange} px · ${entry.coneDeg}°</li>
        <li>Pendengaran: ${entry.hearingRange} px</li>
        <li>Memori: ${entry.memoryTime} s · Pencarian: ${entry.searchTime} s</li>
        <li>Tanda: ${entry.tells.join(', ')}</li>
      </ul>
      <button class="btn btn-ghost btn-small" type="button" data-dread-spawn="${entry.id}">PANGGIL</button>
    </article>`).join('')}</div>`;
}

function dreadBossCards() {
  return `<div class="dread-grid">${DREAD_BOSS_LIST.map((boss) => `
    <article class="dread-card dread-boss">
      <header><h3>${esc(boss.name)}</h3><span>${boss.phases.length} fase</span></header>
      <p>${esc(boss.title)}</p>
      <ul>
        <li>Fase: ${boss.phases.map((phase) => `${phase.phase}. ${phase.name}`).join(' · ')}</li>
        <li>Arena: ${boss.arena.minX}–${boss.arena.maxX}</li>
        <li>HP: ${boss.maxHp} · Kontak: ${boss.contact}</li>
        ${boss.hiddenPhase ? `<li>Arena tersembunyi: ${esc(boss.hiddenPhase.name)}</li>` : ''}
      </ul>
      <button class="btn btn-primary btn-small" type="button" data-dread-boss="${boss.id}">HADAPI</button>
    </article>`).join('')}</div>`;
}

function dreadModeCards() {
  return `<div class="dread-grid">${DREAD_MODE_LIST.map((mode) => {
    const progressData = dreadModeProgress(mode.id, dreadModeState(mode.id));
    return `
    <article class="dread-card dread-mode">
      <header><h3>${mode.icon} ${esc(mode.label)}</h3><span>${Math.round(progressData.ratio * 100)}%</span></header>
      <p>${esc(mode.desc)}</p>
      <ul>
        <li>${esc(mode.objectives.map((goal) => `${goal.label} ${Math.min(goal.target, dreadModeState(mode.id).objectives[goal.id] || 0)}/${goal.target}`).join(' · '))}</li>
        <li>Lingkungan: ${esc(DREAD_ENVIRONMENTS[mode.environment]?.label || mode.environment)}</li>
        <li>Hadiah: ${esc(mode.reward)} · ${esc(mode.difficulties.join('/'))}</li>
      </ul>
      <button class="btn btn-ghost btn-small" type="button" data-dread-mode="${mode.id}">MULAI MODE</button>
    </article>`;
  }).join('')}</div>`;
}

function dreadEquipmentPanel() {
  return `<div class="dread-grid">${DREAD_EQUIPMENT.map((item) => `
    <article class="dread-card ${dreadEquipmentLoadout.includes(item.id) ? 'active' : ''}">
      <header><h3>${esc(item.label)}</h3><span>${item.kind}</span></header>
      <p>${esc(item.use)}</p>
      <ul><li>Efek: ${esc(item.effect)}</li><li>Membuka: ${esc(item.unlocks.join(', '))}</li><li>Bonus tempur: ${item.combatBonus}</li></ul>
      <button class="btn btn-ghost btn-small" type="button" data-dread-equip="${item.id}">${dreadEquipmentLoadout.includes(item.id) ? 'LEPAS' : 'BAWA'}</button>
    </article>`).join('')}</div>`;
}

function dreadJournalPanel() {
  const progressData = dreadJournal.progress();
  const achievements = dreadJournal.achievements();
  const discovered = DREAD_JOURNAL_ENTRIES.filter((entry) => dreadJournal.entries[entry.id]);
  const connectable = discovered.length >= 2
    ? `<button class="btn btn-ghost btn-small" type="button" data-dread-connect="1">HUBUNGKAN DUA PETUNJUK</button>`
    : '';
  return `
    <section class="scary-group"><h3>JURNAL · ${progressData.percent}% (${progressData.found}/${progressData.total})</h3>
      <div class="dread-board">${progressData.categories.map((category) => `
        <div class="dread-board-row"><span>${esc(category.label)}</span><b>${category.found}/${category.total}</b><em>${category.percent}%</em></div>`).join('')}</div>
    </section>
    <section class="scary-group"><h3>ACHIEVEMENT</h3>${achievements.map((entry) => `<div class="scary-achievement ${entry.unlocked ? 'unlocked' : 'locked'}"><span class="icon">${entry.icon}</span><div><b>${esc(entry.label)}</b><small>${esc(entry.desc)}</small></div></div>`).join('')}</section>
    <section class="scary-group"><h3>PAPAN MISTERI</h3><p class="micro">Koneksi bersifat opsional dan tidak pernah memblokir cerita. ${progressData.connections} koneksi tercatat.</p>${connectable}</section>
    <section class="scary-group"><h3>HADIAH KOSMETIK</h3>${dreadJournal.rewards.map((id) => `<div class="scary-achievement unlocked"><span class="icon">✦</span><div><b>${esc(id)}</b><small>kosmetik · tanpa bonus tempur</small></div></div>`).join('') || '<p class="micro">Belum ada hadiah.</p>'}</section>`;
}

function dreadSettingsPanel() {
  return DREAD_TABS.map((tab) => `
    <section class="scary-group"><h3>${tab.icon} ${tab.label}</h3>${dreadSettingsForTab(tab.id).map(dreadRowHTML).join('')}</section>`).join('');
}

function buildDreadScreen() {
  const summary = $('dread-summary');
  const tabs = $('dread-tabs');
  const body = $('dread-body');
  if (!summary || !tabs || !body) return null;
  const presentation = syncDread();
  const progressData = dreadJournal.progress();
  summary.innerHTML = [
    ['Lingkungan', game.dreadEnv ? game.dreadEnv.label : '—'],
    ['Profil', presentation.activeProfile],
    ['Peristiwa aktif', `${dreadDirector.snapshot().active.length}`],
    ['Awareness', `${dreadAwareness.snapshot().value} (${dreadAwareness.snapshot().level})`],
    ['Jurnal', `${progressData.percent}%`],
    ['Achievement', progressData.achievements],
    ['Mode aktif', dreadActiveMode ? DREAD_MODES[dreadActiveMode].label : '—'],
    ['Anti-Jumpscare', presentation.antiJumpscare ? 'AKTIF' : 'MATI'],
  ].map(([label, value]) => `<div class="scary-cell"><b>${label}</b><span>${esc(String(value))}</span></div>`).join('');
  tabs.innerHTML = DREAD_VIEW_TABS.map((tab) => `<button class="scary-tab${dreadTab === tab.id ? ' active' : ''}" type="button" role="tab" aria-selected="${dreadTab === tab.id}" data-dread-tab="${tab.id}"><span>${tab.icon}</span> ${tab.label}</button>`).join('');
  let content = '';
  if (dreadTab === 'environments') content = dreadEnvironmentCards();
  else if (dreadTab === 'unnatural') content = dreadUnnaturalCards();
  else if (dreadTab === 'bosses') content = dreadBossCards();
  else if (dreadTab === 'modes') content = dreadModeCards();
  else if (dreadTab === 'equipment') content = dreadEquipmentPanel();
  else if (dreadTab === 'journal') content = dreadJournalPanel();
  else content = dreadSettingsPanel();
  body.innerHTML = `${content}<p class="micro">The Dread Beyond disimpan di ${DREAD_SAVE_KEY} · profil 2D/3D terpisah · Anti-Jumpscare menimpa presentasi kejut, bukan perilaku musuh.</p>`;
  return presentation;
}

function openDread() {
  menuView = 'dread';
  buildDreadScreen();
  syncScreens();
  return true;
}

function closeDread() {
  menuView = 'title';
  syncScreens();
  return true;
}

function enterDread(id) {
  const env = DREAD_ENVIRONMENTS[id];
  if (!env) return false;
  settings.scary.enabled = true;
  settings.dread.enabled = true;
  applySettings();
  activeRunKind = 'dread';
  menuView = 'none';
  started = true;
  paused = false;
  spectating = false;
  shopOpen = false;
  syncHorror();
  game.setScaryMode({ enabled: true, difficulty: horrorSettings().difficulty });
  game.loadDreadEnvironment(id);
  syncHunterStockToRun();
  // Entering a Dread location is a fresh session: never inherit a dead or
  // blessing state from the previous run.
  game.state = 'playing';
  game.player.hp = game.player.maxHp;
  game.player.flasks = game.player.maxFlasks;
  const roster = {
    forgotten_village: ['faceless_visitor', 'pale_echo'],
    hollow_hospital: ['empty_knight', 'ceiling_dweller'],
    silent_underground: ['forgotten_twin', 'pale_echo'],
    black_manor: ['empty_knight', 'faceless_visitor'],
    endless_forest: ['pale_echo', 'faceless_visitor'],
  }[id] || ['faceless_visitor'];
  roster.forEach((kind, index) => game.spawnUnnatural(kind, 420 + index * 280));
  dreadJournal.completeArea(id);
  saveDreadState();
  dreadDirector = new DreadEventDirector(dreadSettings(), { seed: 20261119 + game.roomIndex });
  dreadSignature = '';
  dreadEventLayer = {};
  dreadPresence = null;
  dreadLastX = null;
  dreadDistance = 0;
  dreadAutoTimer = 7;
  syncDread();
  syncScreens();
  lastGameState = null;
  showToast(`THE DREAD BEYOND · ${env.label}`, 2600);
  return true;
}

function startDreadBoss(kind) {
  const profile = DREAD_BOSSES[kind];
  if (!profile) return false;
  enterDread(profile.environment);
  game.enemies.length = 0;
  game.projectiles.length = 0;
  game.spawnDreadBoss(kind);
  game.boss.intro = 0.6;
  dreadBossActive = kind;
  dreadActiveMode = 'watcher_challenge';
  syncScreens();
  showToast(`HORROR BOSS · ${profile.name}`, 2600);
  return true;
}

function playDreadMode(modeId) {
  const mode = DREAD_MODES[modeId];
  if (!mode) return false;
  enterDread(mode.environment);
  dreadActiveMode = modeId;
  dreadDistance = 0;
  dreadLastX = game.player.x;
  showToast(`MODE · ${mode.label}`, 2200);
  return true;
}

function toggleDreadEquipment(id) {
  const index = dreadEquipmentLoadout.indexOf(id);
  if (index >= 0) dreadEquipmentLoadout.splice(index, 1);
  else dreadEquipmentLoadout.push(id);
  if (menuView === 'dread') buildDreadScreen();
  return dreadEquipmentLoadout.slice();
}

function connectDreadClues() {
  const discovered = DREAD_JOURNAL_ENTRIES.filter((entry) => dreadJournal.entries[entry.id]);
  if (discovered.length < 2) return { ok: false, reason: 'not-enough-clues' };
  const result = dreadJournal.connect(discovered[0].id, discovered[1].id);
  saveDreadState();
  if (menuView === 'dread') buildDreadScreen();
  return result;
}

function setDreadPath(path, value) {
  setSettingsValue(settings, path, value);
  settings.dread = sanitizeDreadSettings(settings.dread || {});
  applySettings();
  syncDread();
  if (menuView === 'dread') buildDreadScreen();
  return dreadSettings();
}

function resetDreadSettings() {
  settings.dread = sanitizeDreadSettings({ enabled: true, antiJumpscare: !!settings.scary.antiJumpscare });
  applySettings();
  syncDread();
  if (menuView === 'dread') buildDreadScreen();
  return dreadSettings();
}

// ── Update XIII: The Veil of the Forgotten ───────────────────────────
let veilTab = 'campaign';
let veilController = null;
let veilSearch = '';
let veilFilter = { classification: 'all', rarity: 'all', research: 'all' };
let veilSort = 'chapter';
let veilPage = 1;
let veilSelectedGhost = null;
let veilSelectedChapter = VEIL_CHAPTERS[0].id;
let veilSpawnTimer = 12;
let veilSpawnCount = 0;
let veilStageComplete = false;
let veilBossSeen = false;
let veilHudCache = '';
let veilSettingsCache = null;

function veilSettings() {
  const raw = settings.veil && typeof settings.veil === 'object' ? settings.veil : (veilSettingsCache || {});
  veilSettingsCache = sanitizeVeilSettings(raw);
  return veilSettingsCache;
}

function ensureVeil() {
  if (veilController) return veilController;
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(VEIL_SAVE_KEY) || 'null'); } catch { raw = null; }
  let legacyDread = null;
  try { legacyDread = JSON.parse(localStorage.getItem(DREAD_SAVE_KEY) || 'null'); } catch { legacyDread = null; }
  veilController = new VeilController({ save: raw || {}, legacyDread, settings: veilSettings() });
  veilController.sanity.settings = veilSettings().sanity;
  return veilController;
}

function saveVeilProfile() {
  if (!veilController) return false;
  try {
    localStorage.setItem(VEIL_SAVE_KEY, JSON.stringify(veilController.toJSON()));
    return true;
  } catch { return false; }
}

function veilPresentation() {
  return resolveVeilPresentation(veilSettings(), {
    graphicsPreset: veilController?.save?.preferences?.graphicsPreset || 'high',
    accessibility: { reducedMotion: !!settings.gameplay?.reduceMotion },
  });
}

function applyVeilSetting(path, value) {
  const current = veilSettings();
  const next = JSON.parse(JSON.stringify(current));
  const clean = path.replace(/^veil\./, '');
  const parts = clean.split('.');
  let cursor = next;
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (!cursor[parts[i]] || typeof cursor[parts[i]] !== 'object') cursor[parts[i]] = {};
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length - 1]] = value;
  settings.veil = sanitizeVeilSettings(next);
  veilSettingsCache = settings.veil;
  if (veilController) {
    veilController.settings = veilSettingsCache;
    veilController.sanity.settings = veilSettingsCache.sanity;
    veilController.save.sanity.settings = veilSettingsCache.sanity;
  }
  applySettings({ persist: false });
  return veilSettingsCache;
}

function veilSettingsFor(tab) {
  return VEIL_SETTING_DEFINITIONS.filter((def) => def.tab === tab);
}

function veilSettingControl(def) {
  const value = veilSettingValue(veilSettings(), def.path);
  if (def.type === 'toggle') {
    return `<label class="veil-row"><span>${esc(def.label)}</span><input type="checkbox" data-veil-setting="${def.path}" data-veil-type="toggle" ${value ? 'checked' : ''} /><b>${value ? 'AKTIF' : 'MATI'}</b></label>`;
  }
  if (def.type === 'range') {
    return `<label class="veil-row"><span>${esc(def.label)}</span><input type="range" min="${def.min}" max="${def.max}" step="${def.step}" value="${value}" data-veil-setting="${def.path}" data-veil-type="range" /><b>${value}</b></label>`;
  }
  const options = (def.options || []).map((option) => `<option value="${option}" ${String(option) === String(value) ? 'selected' : ''}>${option}</option>`).join('');
  return `<label class="veil-row"><span>${esc(def.label)}</span><select data-veil-setting="${def.path}" data-veil-type="select">${options}</select><b></b></label>`;
}

function buildVeilScreen() {
  const body = $('veil-body');
  if (!body) return;
  const controller = ensureVeil();
  const summary = veilSummary(controller.save, controller);
  const sanity = controller.sanity.snapshot();
  $('veil-summary').innerHTML = `<span>${summary.stages}/30 TAHAP</span><span>${summary.bosses}/7 BOS</span><span>${summary.documented}/${summary.totalGhosts} ENTITAS</span><span>SANITY ${Math.round(summary.sanity)} · ${esc(sanity.label)}</span><span>LEVEL ${controller.progression.level().level}</span>`;
  $('veil-tabs').innerHTML = VEIL_TABS.map((tab) => `<button type="button" class="scary-tab ${tab.id === veilTab ? 'active' : ''}" data-veil-tab="${tab.id}" role="tab" aria-selected="${tab.id === veilTab}">${tab.label}</button>`).join('');
  body.innerHTML = veilBodyFor(veilTab, controller);
  syncScreens();
}

function veilBodyFor(tab, controller) {
  if (tab === 'campaign') return veilCampaignBody(controller);
  if (tab === 'sanity') return veilSanityBody(controller);
  if (tab === 'index') return veilIndexBody(controller);
  if (tab === 'investigation') return veilInvestigationBody(controller);
  if (tab === 'hub') return veilHubBody(controller);
  if (tab === 'mind') return veilMindBody(controller);
  if (tab === 'progress') return veilProgressBody(controller);
  return veilSettingsBody();
}

function veilCampaignBody(controller) {
  const progress = controller.save.campaign;
  const cards = VEIL_CHAPTERS.map((chapter) => {
    const unlocked = chapterUnlocked(chapter.id, progress);
    const stages = stagesForChapter(chapter.id);
    const cleared = stages.filter((s) => progress.completedStages.includes(s.id)).length;
    const bossReady = bossUnlocked(chapter.boss, progress);
    const stageButtons = stages.map((stage) => {
      const open = stageUnlocked(stage.id, progress);
      const done = progress.completedStages.includes(stage.id);
      return `<button type="button" class="btn btn-ghost btn-small" data-veil-stage="${stage.id}" ${open ? '' : 'disabled'}>${done ? '✓ ' : ''}${stage.number}. ${esc(stage.name)}</button>`;
    }).join('');
    return `<article class="veil-card ${veilSelectedChapter === chapter.id ? 'active' : ''}" data-veil-chapter-card="${chapter.id}">
      <header><h3>${esc(chapter.name)}</h3><span>${cleared}/5</span></header>
      <p>${esc(chapter.subtitle)} · ${esc(chapter.mechanic)}</p>
      <div class="veil-toolbar">${stageButtons}</div>
      <button type="button" class="btn btn-ghost btn-small" data-veil-boss="${chapter.boss}" ${bossReady && unlocked ? '' : 'disabled'}>BOS · ${esc(veilBoss(chapter.boss)?.name || chapter.boss)}</button>
    </article>`;
  }).join('');
  const finalReady = bossUnlocked('veil_architect', progress);
  return `<div class="veil-grid">${cards}</div>
    <article class="veil-card ${finalReady ? 'active' : ''}">
      <header><h3>Arsitek Tabir</h3><span>FINAL · 5 FASE</span></header>
      <p>Bos terakhir membuka seluruh arsip dan mengakhiri kampanye The Veil of the Forgotten.</p>
      <button type="button" class="btn btn-primary btn-small" data-veil-boss="veil_architect" ${finalReady ? '' : 'disabled'}>HADAPI ARSITEK TABIR</button>
    </article>`;
}

function veilSanityBody(controller) {
  const meter = controller.sanity;
  const value = Math.round(meter.value);
  const conditions = SANITY_CONDITIONS.map((condition) => `<div class="veil-row"><span>${esc(condition.label)}</span><b>${condition.min}–${condition.max}</b><em>${condition.safe ? 'AMAN' : 'PANTAU'}</em></div>`).join('');
  const consumables = SANITY_CONSUMABLES.map((item) => {
    const owned = Math.floor(meter.settings.enabled ? (controller.save.flags[`item:${item.id}`] || 0) : 0);
    return `<div class="veil-row"><span>${esc(item.name)} · +${item.restore}</span><b>${owned}</b><button type="button" class="btn btn-ghost btn-small" data-veil-consume="${item.id}">PAKAI</button></div>`;
  }).join('');
  const zones = Object.values(meter.zoneDef ? { current: meter.zoneDef } : {}).map((zone) => `<div class="veil-row"><span>${esc(zone.label)}</span><b>${zone.rate > 0 ? '+' : ''}${zone.rate}/s</b><em>${zone.kind}</em></div>`).join('');
  return `<article class="veil-card"><header><h3>Sanity 2.0</h3><span>${esc(meter.condition.label)}</span></header>
      <div class="veil-meter"><i style="width:${value}%"></i></div>
      <div class="veil-stat"><div><span>Sanity</span><b>${value}/100</b></div><div><span>Exposure</span><b>${Math.round(meter.exposure)}/100</b></div><div><span>Focus</span><b>${Math.round(meter.focus)}/100</b></div><div><span>Zona</span><b>${esc(meter.zone)}</b></div><div><span>Kondisi</span><b>${meter.conditions.size}</b></div></div>
      <p>Sanity tidak pernah mengurangi HP, membunuh, atau mengambil kendali. Di nilai 0 pemulihan Veil Anchor otomatis terbuka.</p></article>
    <article class="veil-card"><header><h3>Ambang Kondisi</h3><span>7 TINGKAT</span></header>${conditions}</article>
    <article class="veil-card"><header><h3>Zona Aktif</h3><span>ENVIRONMENT</span></header>${zones || '<p class="veil-muted">Tidak ada zona aktif.</p>'}</article>
    <article class="veil-card"><header><h3>Consumable</h3><span>6 ITEM</span></header>${consumables}</article>
    <div class="veil-grid">${veilSettingsFor('sanity').map((def) => `<article class="veil-card">${veilSettingControl(def)}</article>`).join('')}</div>`;
}

function veilIndexBody(controller) {
  const result = controller.index.query({
    search: veilSearch, classification: veilFilter.classification, rarity: veilFilter.rarity,
    research: veilFilter.research, sort: veilSort, page: veilPage,
    spoilers: !!veilSettings()['index.spoilerMode'],
  });
  const classificationOptions = `<option value="all">SEMUA KLASIFIKASI</option>${GHOST_CLASSIFICATIONS.map((c) => `<option value="${c.id}" ${veilFilter.classification === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}`;
  const rarityOptions = `<option value="all">SEMUA RARITY</option>${GHOST_RARITIES.map((r) => `<option value="${r}" ${veilFilter.rarity === r ? 'selected' : ''}>${r}</option>`).join('')}`;
  const researchOptions = `<option value="all">SEMUA RISET</option>${GHOST_RESEARCH_STAGES.map((r) => `<option value="${r}" ${veilFilter.research === r ? 'selected' : ''}>${r}</option>`).join('')}`;
  const rows = result.rows.map((row) => `<div class="veil-row"><span>${esc(row.name)} · ${esc(row.classification)} · ${esc(row.stage)}</span><b>${row.evidence}/${row.required}</b><button type="button" class="btn btn-ghost btn-small" data-veil-select="${row.id}">LIHAT</button></div>`).join('');
  const selected = veilSelectedGhost ? GHOSTS.find((g) => g.id === veilSelectedGhost) : null;
  let detail = '';
  if (selected) {
    const record = controller.index.get(selected.id);
    const evidence = selected.requiredEvidence.map((type) => {
      const have = record?.evidence.includes(type);
      return `<button type="button" class="btn btn-ghost btn-small" data-veil-evidence="${type}" ${have ? 'disabled' : ''}>${have ? '✓ ' : ''}${type}</button>`;
    }).join('');
    detail = `<article class="veil-card active"><header><h3>${esc(selected.name)}</h3><span>${esc(selected.rarity)}${selected.secret ? ' · RAHASIA' : ''}</span></header>
      <p>${esc(selected.description)}</p>
      <ul>${selected.lore.map((line, index) => `<li>${index < (record?.lore || 0) ? esc(line) : '???'}</li>`).join('')}</ul>
      <div class="veil-toolbar">${evidence}</div>
      <div class="veil-toolbar"><button type="button" class="btn btn-ghost btn-small" data-veil-identify="${selected.id}">IDENTIFIKASI</button><button type="button" class="btn btn-ghost btn-small" data-veil-document="${selected.id}">DOKUMENTASIKAN</button><button type="button" class="btn btn-ghost btn-small" data-veil-master="${selected.id}">MASTER</button><button type="button" class="btn btn-ghost btn-small" data-veil-lore="${selected.id}">CATAT LORE</button></div>
      <p class="veil-muted">Tahap: ${esc(record?.stage || 'rumored')} · Pengamatan: ${record?.encounters || 0}</p></article>`;
  }
  return `<div class="veil-toolbar"><input type="search" placeholder="Cari entitas, lokasi, perilaku…" value="${esc(veilSearch)}" data-veil-search /><select data-veil-filter="classification">${classificationOptions}</select><select data-veil-filter="rarity">${rarityOptions}</select><select data-veil-filter="research">${researchOptions}</select><select data-veil-sort><option value="chapter" ${veilSort === 'chapter' ? 'selected' : ''}>URUT BAB</option><option value="name" ${veilSort === 'name' ? 'selected' : ''}>URUT NAMA</option><option value="rarity" ${veilSort === 'rarity' ? 'selected' : ''}>URUT RARITY</option><option value="research" ${veilSort === 'research' ? 'selected' : ''}>URUT RISET</option></select></div>
    <article class="veil-card"><header><h3>Ghost Index 2.0</h3><span>${controller.index.completion().documented}/${controller.index.completion().total} TERDOKUMENTASI</span></header>${rows || '<p class="veil-muted">Tidak ada entitas yang cocok.</p>'}
      <div class="veil-pager"><button type="button" class="btn btn-ghost btn-small" data-veil-page="${Math.max(1, result.page - 1)}">‹</button><span>Halaman ${result.page}/${result.pages} · ${result.total} entri</span><button type="button" class="btn btn-ghost btn-small" data-veil-page="${Math.min(result.pages, result.page + 1)}">›</button></div></article>${detail}`;
}

function veilInvestigationBody(controller) {
  const save = controller.save.investigation;
  const cases = INVESTIGATION_CASES.map((entry) => {
    const done = save.completedCases.includes(entry.id);
    return `<div class="veil-row"><span>${esc(entry.name)}</span><b>${done ? 'SELESAI' : `${entry.evidenceGoal} bukti`}</b><button type="button" class="btn btn-ghost btn-small" data-veil-case="${entry.id}">${done ? 'ARSIP' : 'MULAI'}</button></div>`;
  }).join('');
  const missions = [...dailyRotation('2026-11-20'), ...weeklyRotation('W47'), ...MISSION_LIBRARY.filter((m) => m.kind === 'contract')].map((mission) => {
    const progress = missionProgress(mission, controller.progression.metrics);
    const claimed = save.claimedMissions.includes(mission.id);
    return `<div class="veil-row"><span>${esc(mission.name)} · ${progress.current}/${progress.target}</span><b>${claimed ? 'DIKLAIM' : esc(mission.kind)}</b><button type="button" class="btn btn-ghost btn-small" data-veil-mission="${mission.id}" ${progress.complete && !claimed ? '' : 'disabled'}>KLAIM</button></div>`;
  }).join('');
  const tools = INVESTIGATION_TOOLS.map((tool) => {
    const rank = controller.save.equipment.mastery[tool.id] || 0;
    return `<div class="veil-row"><span>${esc(tool.name)} · ${esc(tool.category)}</span><b>${rank}/5</b><em>${esc(tool.description)}</em></div>`;
  }).join('');
  const active = save.activeCase ? `<p class="veil-muted">Kasus aktif: ${esc(save.activeCase)}</p><button type="button" class="btn btn-primary btn-small" data-veil-action="solve-case">SELESAIKAN KASUS AKTIF</button>` : '<p class="veil-muted">Pilih kasus untuk memulai investigasi.</p>';
  return `<article class="veil-card"><header><h3>Papan Kasus</h3><span>12 KASUS</span></header>${cases}${active}</article>
    <article class="veil-card"><header><h3>Misi & Kontrak</h3><span>HARIAN · MINGGUAN · KONTRAK</span></header>${missions}</article>
    <article class="veil-card"><header><h3>Peralatan Investigasi</h3><span>5 KATEGORI</span></header>${tools}</article>`;
}

function veilHubBody(controller) {
  const facilities = veilFacilityState(controller.save.hub).map((facility) => `<div class="veil-row"><span>${esc(facility.name)} · ${esc(facility.description)}</span><b>${facility.active ? 'AKTIF' : 'TUTUP'}</b><button type="button" class="btn btn-ghost btn-small" data-veil-hub="${facility.tab}">BUKA</button></div>`).join('');
  const npcs = VEIL_NPCS.map((npc) => `<div class="veil-row"><span>${esc(npc.name)} · ${esc(npc.role)}</span><b>${esc(npc.facility)}</b><button type="button" class="btn btn-ghost btn-small" data-veil-npc="${npc.id}">BICARA</button></div>`).join('');
  return `<article class="veil-card"><header><h3>Investigator's Refuge</h3><span>10 FASILITAS</span></header>${facilities}</article>
    <article class="veil-card"><header><h3>Penghuni Refuge</h3><span>4 NPC</span></header>${npcs}</article>`;
}

function veilMindBody(controller) {
  const mind = controller.progression.mind;
  const branches = ['spirit', 'mind'].map((branch) => {
    const rows = MIND_UPGRADES.filter((u) => u.branch === branch).map((upgrade) => {
      const rank = Math.min(upgrade.maxRank, Math.max(0, Math.round(Number(mind.ranks[upgrade.id]) || 0)));
      const blocked = rank >= upgrade.maxRank || (upgrade.requires || []).some((r) => !(mind.ranks[r] > 0));
      return `<div class="veil-row"><span>${esc(upgrade.name)} · ${rank}/${upgrade.maxRank}</span><b>${upgrade.cost} poin</b><button type="button" class="btn btn-ghost btn-small" data-veil-mind="${upgrade.id}" ${blocked ? 'disabled' : ''}>BELI</button></div>`;
    }).join('');
    return `<article class="veil-card"><header><h3>${branch === 'spirit' ? 'Spirit' : 'Mind'}</h3><span>${branch.toUpperCase()}</span></header><div class="veil-branch">${rows}</div></article>`;
  }).join('');
  return `<article class="veil-card"><header><h3>Poin Mind & Spirit</h3><span>${mind.points} TERSEDIA</span></header><p>Dapatkan poin dari bab, bos, dan kasus. Respec mengembalikan seluruh poin yang sudah dibelanjakan.</p><button type="button" class="btn btn-ghost btn-small" data-veil-action="respec">RESPEC</button></article>${branches}`;
}

function veilProgressBody(controller) {
  const snapshot = controller.progression.snapshot();
  const currencies = VEIL_CURRENCIES.map((currency) => `<div><span>${esc(currency.name)}</span><b>${snapshot.currencies[currency.id] || 0}</b></div>`).join('');
  const achievements = VEIL_ACHIEVEMENTS.map((achievement) => `<div class="veil-row"><span>${esc(achievement.name)} · ${esc(achievement.description)}</span><b>${achievement.target}</b><em>${snapshot.achievements.includes(achievement.id) ? 'TERBUKA' : 'TERKUNCI'}</em></div>`).join('');
  const boards = LEADERBOARDS.map((board) => { const rows = controller.leaderboards.board(board.id, veilController.save.preferences.difficulty); return `<div class="veil-row"><span>${esc(board.name)}</span><b>${rows.length} entri</b><em>${rows[0] ? rows[0].metric : '—'}</em></div>`; }).join('');
  const secrets = SECRET_LOCATIONS.map((secret) => `<div class="veil-row"><span>${esc(secret.name)} · ${esc(secret.clue)}</span><b>${controller.save.secrets.includes(secret.id) ? 'DITEMUKAN' : 'TERSEMBUNYI'}</b><em>${esc(secret.stage)}</em></div>`).join('');
  const collectibles = veilCollectibleTotals(controller.save.collectibles).map((c) => `<div class="veil-row"><span>${esc(c.name)}</span><b>${c.found}/${c.count}</b><em>${c.percent}%</em></div>`).join('');
  return `<article class="veil-card"><header><h3>Progres Penyidik</h3><span>LEVEL ${snapshot.level} · RANK ${snapshot.indexRank} · MASTERY ${snapshot.mastery}</span></header><div class="veil-stat">${currencies}</div></article>
    <article class="veil-card"><header><h3>14 Achievement</h3><span>${snapshot.achievements.length}/14</span></header>${achievements}</article>
    <article class="veil-card"><header><h3>7 Papan Peringkat</h3><span>PER KESULITAN</span></header>${boards}</article>
    <article class="veil-card"><header><h3>8 Lokasi Rahasia</h3><span>EKSPLORASI</span></header>${secrets}</article>
    <article class="veil-card"><header><h3>Koleksi</h3><span>8 KATEGORI</span></header>${collectibles}</article>`;
}

function veilSettingsBody() {
  const groups = [['sanity', 'Sanity'], ['campaign', 'Hantu & Kampanye'], ['investigation', 'Investigasi'], ['index', 'Ghost Index'], ['settings', 'Aksesibilitas & Audio']];
  return groups.map(([tab, label]) => {
    const rows = veilSettingsFor(tab).map((def) => veilSettingControl(def)).join('');
    return `<article class="veil-card"><header><h3>${label}</h3><span>${veilSettingsFor(tab).length} KONTROL</span></header>${rows}</article>`;
  }).join('');
}

function setVeilTab(tab) {
  if (!VEIL_TABS.some((entry) => entry.id === tab)) return veilTab;
  veilTab = tab;
  buildVeilScreen();
  return veilTab;
}

function openVeil() {
  const controller = ensureVeil();
  menuView = 'veil';
  started = false;
  paused = false;
  spectating = false;
  $('veil-hud')?.classList.add('hidden');
  buildVeilScreen();
  syncScreens();
  return controller.snapshot();
}

function closeVeil() {
  if (menuView === 'veil') menuView = 'title';
  syncScreens();
}

function spawnVeilEncounter(initial = false) {
  const controller = veilController;
  const stage = controller ? veilStage(controller.activeStage) : null;
  if (!stage) return null;
  const pool = GHOSTS.filter((g) => g.chapter === stage.chapter && !g.secret);
  if (!pool.length) return null;
  const ghost = pool[veilSpawnCount % pool.length];
  veilSpawnCount += 1;
  const request = controller.director.request(ghost.id, { duration: 30, presentation: veilSettings()['antiJumpscare.enabled'] ? 'softened' : 'full' });
  if (!request.ok && !initial) return null;
  const side = veilSpawnCount % 2 === 0 ? 1 : -1;
  const x = Math.max(80, Math.min(2300, game.player.x + side * (initial ? 320 : 260)));
  const spawned = game.spawnGhost(ghost.id, x, {});
  if (spawned) {
    controller.witness(ghost.id);
    showToast(`ENTITAS TERDETEKSI · ${ghost.name}`, 1800);
  }
  return spawned;
}

function startVeilStage(stageId) {
  const controller = ensureVeil();
  const start = controller.startStage(stageId);
  if (!start.ok) {
    showToast(start.reason === 'locked' ? 'TAHAP MASIH TERKUNCI' : 'TAHAP TIDAK DITEMUKAN', 2000);
    return start;
  }
  veilSearch = '';
  veilStageComplete = false;
  veilBossSeen = false;
  veilSpawnTimer = 12;
  veilSpawnCount = 0;
  game.veilDeathCounted = false;
  if (typeof game.reset === 'function') game.reset();
  applyCharacterToGame();
  game.loadVeilStage(stageId);
  syncHunterStockToRun();
  ensureArchive().progress.recordAttempt(stageId);
  saveArchiveProfile();
  game.player.hp = game.player.maxHp;
  activeRunKind = 'veil';
  started = true;
  paused = false;
  menuView = 'none';
  spectating = false;
  controller.sanity.setZone(start.stage.zone);
  controller.sanity.value = Math.max(controller.sanity.value, 1);
  veilHudCache = '';
  updateVeilHud();
  spawnVeilEncounter(true);
  syncScreens();
  showToast(`THE VEIL · ${start.stage.name}`, 2200);
  saveVeilProfile();
  return start;
}

function startVeilBoss(bossId) {
  const controller = ensureVeil();
  const start = controller.startBoss(bossId);
  if (!start.ok) {
    showToast(start.reason === 'locked' ? 'BOS MASIH TERKUNCI' : 'BOS TIDAK DITEMUKAN', 2000);
    return start;
  }
  veilStageComplete = false;
  veilBossSeen = true;
  game.veilDeathCounted = false;
  if (typeof game.reset === 'function') game.reset();
  applyCharacterToGame();
  game.startVeilBoss(bossId);
  syncHunterStockToRun();
  game.player.hp = game.player.maxHp;
  activeRunKind = 'veil';
  started = true;
  paused = false;
  menuView = 'none';
  controller.sanity.setZone('veil');
  veilHudCache = '';
  updateVeilHud();
  syncScreens();
  showToast(`BOS · ${start.boss.name}`, 2400);
  saveVeilProfile();
  return start;
}

function completeVeilStage() {
  const controller = veilController;
  const stage = controller ? veilStage(controller.activeStage) : null;
  if (!stage) return null;
  const result = controller.completeStage(stage.id, {
    clean: controller.sanity.value >= 30,
    antiJumpscare: !!veilSettings()['antiJumpscare.enabled'],
  });
  saveVeilProfile();
  showToast(`TAHAP SELESAI · ${stage.name}`, 2400);
  window.setTimeout(() => {
    if (activeRunKind !== 'veil') return;
    activeRunKind = 'none';
    started = false;
    openVeil();
  }, 1800);
  return result;
}

function completeVeilBoss() {
  const controller = veilController;
  const bossId = controller?.activeBoss;
  if (!bossId) return null;
  const result = controller.defeatBoss(bossId, { timeMs: 0 });
  saveVeilProfile();
  showToast(`BOS TUMBANG · ${veilBoss(bossId)?.name || bossId}`, 2600);
  window.setTimeout(() => {
    if (activeRunKind !== 'veil') return;
    activeRunKind = 'none';
    started = false;
    openVeil();
  }, 2000);
  return result;
}

function updateVeilHud() {
  const hud = $('veil-hud');
  if (!hud) return;
  const visible = started && menuView === 'none' && (activeRunKind === 'veil' || activeRunKind === 'eternal') && !paused;
  hud.classList.toggle('hidden', !visible);
  if (!visible || !veilController) return;
  const meter = veilController.sanity;
  const condition = meter.condition;
  const key = `${Math.round(meter.value)}|${Math.round(meter.exposure)}|${Math.round(meter.focus)}|${condition.id}|${veilController.activeStage || veilController.activeBoss || eternalController?.activeStage || eternalController?.activeBoss || ''}|${(game.enemies || []).filter((e) => !e.dead).length}`;
  hud.classList.toggle('critical', meter.value <= 29);
  if (key === veilHudCache) return;
  veilHudCache = key;
  const value = $('veil-hud-value');
  const fill = $('veil-hud-fill');
  const label = $('veil-hud-condition');
  const stage = $('veil-hud-stage');
  const ghosts = $('veil-hud-ghost');
  if (value) value.textContent = String(Math.round(meter.value));
  if (fill) fill.style.width = `${Math.max(0, Math.min(100, meter.value))}%`;
  if (label) label.textContent = condition.label.toUpperCase();
  if (stage) stage.textContent = veilController.activeStage ? veilStage(veilController.activeStage)?.name || 'TABIR' : (eternalController?.activeStage ? eternalStage(eternalController.activeStage)?.name || 'MALAM' : 'TABIR');
  if (ghosts) ghosts.textContent = `${(game.enemies || []).filter((e) => !e.dead).length} entitas`;
  const exposure = $('veil-hud-exposure');
  const exposureFill = $('veil-hud-exposure-fill');
  const focus = $('veil-hud-focus');
  const focusFill = $('veil-hud-focus-fill');
  if (exposure) exposure.textContent = String(Math.round(meter.exposure));
  if (exposureFill) exposureFill.style.width = `${Math.max(0, Math.min(100, meter.exposure))}%`;
  if (focus) focus.textContent = String(Math.round(meter.focus));
  if (focusFill) focusFill.style.width = `${Math.max(0, Math.min(100, meter.focus))}%`;
}

function veilRenderLayer() {
  if ((activeRunKind !== 'veil' && activeRunKind !== 'eternal') || !veilController) return null;
  const presentation = veilPresentation();
  return {
    visible: true,
    sanity: veilController.sanity.value,
    distortion: presentation.visual.distortion,
    touched: veilController.sanity.veilTouched || veilController.sanity.value <= 14,
    time: performance.now() / 1000,
  };
}

function veilTick(dt) {
  if (activeRunKind !== 'veil' || !started || paused || menuView !== 'none') return null;
  const controller = veilController;
  if (!controller) return null;
  controller.tick(dt);
  updateVeilHud();
  if (!game.boss) {
    veilSpawnTimer -= dt;
    if (veilSpawnTimer <= 0) {
      veilSpawnTimer = 13;
      spawnVeilEncounter(false);
    }
  }
  if (game.boss && !veilBossSeen) veilBossSeen = true;
  if (veilBossSeen && !game.boss) {
    const result = completeVeilBoss();
    veilBossSeen = false;
    return result;
  }
  if (!game.boss && !veilStageComplete) {
    const alive = (game.enemies || []).filter((e) => !e.dead && !e.ghostKind).length;
    if (alive === 0) {
      veilStageComplete = true;
      completeVeilStage();
    }
  }
  if (game.state === 'dead' && !game.veilDeathCounted) {
    game.veilDeathCounted = true;
    controller.save.campaign.deaths += 1;
    saveVeilProfile();
  }
  return controller.snapshot();
}

function claimVeilMission(missionId) {
  const mission = MISSION_LIBRARY.find((m) => m.id === missionId);
  const controller = veilController;
  if (!mission || !controller) return null;
  if (controller.save.investigation.claimedMissions.includes(missionId)) return { ok: false, reason: 'duplicate' };
  const progress = missionProgress(mission, controller.progression.metrics);
  if (!progress.complete) return { ok: false, reason: 'incomplete' };
  const grant = controller.progression.awardBundle(mission.reward, `mission:${missionId}`);
  if (!grant.ok) return grant;
  controller.save.investigation.claimedMissions.push(missionId);
  controller.progression.checkAchievements();
  saveVeilProfile();
  buildVeilScreen();
  return grant;
}

function solveVeilCase() {
  const controller = veilController;
  const caseId = controller?.save?.investigation?.activeCase;
  if (!caseId) return { ok: false, reason: 'no-case' };
  const def = INVESTIGATION_CASES.find((c) => c.id === caseId);
  if (!def) return { ok: false, reason: 'unknown-case' };
  const evidence = def.ghostPool.reduce((total, ghostId) => total + (controller.index.get(ghostId)?.evidence.length || 0), 0);
  const result = controller.completeCase(caseId, { steps: INVESTIGATION_STEPS.slice(0, 6), evidence });
  if (result.ok) {
    controller.save.investigation.activeCase = null;
    ensureArchive().recordCase({ stageId: controller.activeStage });
    saveArchiveProfile();
    saveVeilProfile();
    buildVeilScreen();
    showToast('KASUS DITUTUP', 2000);
  }
  return result;
}

// ── Update XIV: The Eternal Night (Arc X) ─────────────────────────────
let eternalController = null;
let eternalTab = 'dashboard';
let eternalSettingsCache = null;
let eternalStageComplete = false;
let eternalBossSeen = false;
let eternalRunHunt = null;
let eternalHuntConfig = { variant: 'standard', chapter: 'midnight_city', rarity: 'all', difficulty: 'normal' };

function eternalSettings() {
  const raw = settings.eternal && typeof settings.eternal === 'object' ? settings.eternal : (eternalSettingsCache || {});
  eternalSettingsCache = sanitizeEternalSettings(raw);
  return eternalSettingsCache;
}

function ensureEternal() {
  if (eternalController) return eternalController;
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(ETERNAL_SAVE_KEY) || 'null'); } catch { raw = null; }
  eternalController = new EternalController({ save: raw || {}, veil: ensureVeil(), settings: eternalSettings() });
  eternalController.settings = eternalSettings();
  if (raw && !eternalController.save.campaign.unlocked) {
    // Migration: an Arc IX finale clear opens Arc X without touching its save.
    if (veilController?.save?.campaign?.finalBoss) eternalController.save.campaign.unlocked = true;
  }
  return eternalController;
}

function saveEternalProfile() {
  if (!eternalController) return false;
  try {
    localStorage.setItem(ETERNAL_SAVE_KEY, JSON.stringify(eternalController.toJSON()));
    saveVeilProfile();
    return true;
  } catch { return false; }
}

function applyEternalSetting(path, value) {
  const current = eternalSettings();
  const next = JSON.parse(JSON.stringify(current));
  setEternalSetting(next, path, value);
  settings.eternal = sanitizeEternalSettings(next);
  eternalSettingsCache = settings.eternal;
  if (eternalController) eternalController.settings = eternalSettingsCache;
  applySettings({ persist: false });
  return eternalSettingsCache;
}

function eternalSettingControl(def) {
  const value = eternalSettingValue(eternalSettings(), def.path);
  if (def.type === 'toggle') {
    return `<label class="veil-row"><span>${esc(def.label)}</span><input type="checkbox" data-eternal-setting="${def.path}" data-eternal-type="toggle" ${value ? 'checked' : ''} /><b>${value ? 'AKTIF' : 'MATI'}</b></label>`;
  }
  if (def.type === 'range') {
    return `<label class="veil-row"><span>${esc(def.label)}</span><input type="range" min="${def.min}" max="${def.max}" step="${def.step}" value="${value}" data-eternal-setting="${def.path}" data-eternal-type="range" /><b>${value}</b></label>`;
  }
  const options = (def.options || []).map((option) => `<option value="${option}" ${String(option) === String(value) ? 'selected' : ''}>${option}</option>`).join('');
  return `<label class="veil-row"><span>${esc(def.label)}</span><select data-eternal-setting="${def.path}" data-eternal-type="select">${options}</select><b></b></label>`;
}

function buildEternalScreen() {
  const body = $('eternal-body');
  if (!body) return;
  const controller = ensureEternal();
  const summary = eternalSummary(controller.save);
  const index = controller.veil?.index?.completion?.() || { documented: 0, total: GHOSTS.length };
  $('eternal-summary').innerHTML = `<span>${summary.stages}/${ETERNAL_STAGES.length} TAHAP</span><span>${summary.bosses}/${ETERNAL_BOSSES.length} BOS</span><span>${summary.chapters}/${ETERNAL_CHAPTERS.length} BAB</span><span>${index.documented}/${index.total} ENTITAS</span><span>LEVEL ${controller.level}</span>`;
  $('eternal-tabs').innerHTML = ETERNAL_TABS.map((tab) => `<button type="button" class="scary-tab ${tab.id === eternalTab ? 'active' : ''}" data-eternal-tab="${tab.id}" role="tab" aria-selected="${tab.id === eternalTab}">${tab.label}</button>`).join('');
  body.innerHTML = eternalBodyFor(eternalTab, controller);
  syncScreens();
}

function eternalBodyFor(tab, controller) {
  if (tab === 'dashboard') return eternalDashboardBody(controller);
  if (tab === 'campaign') return eternalCampaignBody(controller);
  if (tab === 'index') return eternalIndexBody(controller);
  if (tab === 'sanity') return eternalSanityBody(controller);
  if (tab === 'investigation') return eternalInvestigationBody(controller);
  if (tab === 'hunts') return eternalHuntsBody(controller);
  if (tab === 'workshop') return eternalWorkshopBody(controller);
  if (tab === 'events') return eternalEventsBody(controller);
  if (tab === 'coop') return eternalCoopBody(controller);
  if (tab === 'progress') return eternalProgressBody(controller);
  return eternalSettingsBody();
}

function eternalDashboardBody(controller) {
  const board = controller.dashboard();
  const o = board.overview;
  const cells = [
    ['Investigator', `Lv. ${o.level}`], ['Ghosts documented', `${o.documented}/${o.totalGhosts}`],
    ['Investigations', String(o.investigations)], ['Chapters', `${o.chapters}/${ETERNAL_CHAPTERS.length}`], ['Bosses', `${o.bosses}/${o.totalBosses}`],
    ['Index Rank', `${board.index.rank}/100`], ['Hunts', String(controller.save.stats.hunts)], ['Events', String(controller.save.stats.events)],
    ['Co-op clears', String(board.multiplayer.clears)], ['Sanity', `${Math.round(controller.veil?.sanity?.value || 0)}`],
    ['Exposure', `${Math.round(controller.veil?.sanity?.exposure || 0)}`], ['Focus', `${Math.round(controller.veil?.sanity?.focus || 0)}`],
  ].map(([label, value]) => `<div><span>${esc(label)}</span><b>${esc(value)}</b></div>`).join('');
  const quick = [['campaign', 'Campaign'], ['index', 'Ghost Index'], ['sanity', 'Sanity & Skills'], ['investigation', 'Investigation Board'], ['workshop', 'Equipment'], ['progress', 'Achievements']]
    .map(([id, label]) => `<button type="button" class="btn btn-ghost btn-small" data-eternal-tab="${id}">${label}</button>`).join('');
  return `<article class="veil-card eternal-card active"><header><h3>INVESTIGATOR PROFILE</h3><span>REAL SAVE DATA</span></header><div class="veil-stat">${cells}</div><div class="veil-toolbar">${quick}</div></article>
    <div class="eternal-section">
      <article class="veil-card"><header><h3>Campaign</h3><span>${o.chapters}/${ETERNAL_CHAPTERS.length}</span></header><p>${o.bosses} bos dikalahkan · ${o.investigations} investigasi selesai.</p></article>
      <article class="veil-card"><header><h3>Ghost Index</h3><span>${o.prose}%</span></header><p>${o.documented} dari ${o.totalGhosts} entitas terdokumentasi.</p></article>
      <article class="veil-card"><header><h3>Sanity 3.0</h3><span>${esc(board.sanity?.label || 'STABLE')}</span></header><p>Sanity ${Math.round(board.sanity?.value || 0)} · Exposure ${Math.round(board.sanity?.exposure || 0)} · Focus ${Math.round(board.sanity?.focus || 0)}.</p></article>
      <article class="veil-card"><header><h3>Multiplayer</h3><span>${board.multiplayer.sessions} SESI</span></header><p>${board.multiplayer.clears} clear · ${board.multiplayer.reconnects} reconnect.</p></article>
    </div>`;
}

function eternalCampaignBody(controller) {
  if (!controller.save.campaign.unlocked) {
    return `<article class="veil-card active"><header><h3>ARC X TERKUNCI</h3><span>PRASYARAT</span></header><p>Arc X terbuka setelah Arsitek Tabir dikalahkan, atau dapat dibuka manual untuk pengujian.</p><button type="button" class="btn btn-primary btn-small" data-eternal-action="unlock">BUKA THE ETERNAL NIGHT</button></article>`;
  }
  const progress = controller.save.campaign;
  const cards = ETERNAL_CHAPTERS.map((chapter) => {
    const unlocked = eternalChapterUnlocked(chapter.id, progress);
    const stages = eternalStagesForChapter(chapter.id);
    const cleared = stages.filter((s) => progress.completedStages.includes(s.id)).length;
    const bossReady = eternalBossUnlocked(chapter.boss, progress);
    const buttons = stages.map((stage) => {
      const open = eternalStageUnlocked(stage.id, progress);
      const done = progress.completedStages.includes(stage.id);
      return `<button type="button" class="btn btn-ghost btn-small" data-eternal-stage="${stage.id}" ${open ? '' : 'disabled'}>${done ? '✓ ' : ''}${stage.number}. ${esc(stage.name)}</button>`;
    }).join('');
    return `<article class="veil-card eternal-card ${unlocked ? '' : 'locked'}"><header><h3>${esc(chapter.name)}</h3><span>${cleared}/5</span></header><p>${esc(chapter.subtitle)} · ${esc(chapter.mechanic)}</p><div class="veil-toolbar">${buttons}</div><button type="button" class="btn btn-ghost btn-small" data-eternal-boss="${chapter.boss}" ${bossReady && unlocked ? '' : 'disabled'}>BOS · ${esc(eternalBoss(chapter.boss)?.name || chapter.boss)}</button></article>`;
  }).join('');
  const final = eternalFinalUnlocked(progress);
  return `<div class="eternal-section">${cards}</div><article class="veil-card eternal-card ${final ? 'active' : ''}"><header><h3>The First Forgotten</h3><span>FINAL · 5 FASE</span></header><p>Bos terakhir Arc X. Kalahkan ${ETERNAL_BOSSES.filter((b) => !b.final).length} bos bab untuk membuka ambang terakhir.</p><button type="button" class="btn btn-primary btn-small" data-eternal-boss="first_forgotten" ${final ? '' : 'disabled'}>HADAPI THE FIRST FORGOTTEN</button></article>`;
}

function eternalIndexBody(controller) {
  const index = controller.veil?.index;
  const completion = index?.completion?.() || { documented: 0, total: GHOSTS.length, documentedStandard: 0, standard: GHOSTS.filter((g) => !g.secret).length, documentedSecret: 0, secret: GHOSTS.filter((g) => g.secret).length, percent: 0 };
  const classifications = GHOST_CLASSIFICATIONS.map((classification) => {
    const rows = GHOSTS.filter((g) => g.classification === classification.id);
    const known = rows.filter((g) => (index?.stageOf(g.id) || 'rumored') !== 'rumored').length;
    return `<div class="veil-row"><span>${esc(classification.label)}</span><b>${known}/${rows.length}</b><em>${esc(classification.id)}</em></div>`;
  }).join('');
  const milestones = INDEX_RANK_MILESTONES.map((m) => `<div class="veil-row"><span>Rank ${m.rank} · ${esc(m.name)}</span><b>${controller.save.rankRewards.includes(m.id) ? 'DITERIMA' : 'TERKUNCI'}</b><em>${esc(m.type)}</em></div>`).join('');
  return `<article class="veil-card"><header><h3>Ghost Index 2.0</h3><span>${completion.documented}/${completion.total} · RANK ${controller.dashboard().index.rank}/100</span></header><div class="veil-stat"><div><span>Standar</span><b>${completion.documentedStandard}/${completion.standard}</b></div><div><span>Rahasia</span><b>${completion.documentedSecret}/${completion.secret}</b></div><div><span>Persen</span><b>${completion.percent}%</b></div></div><button type="button" class="btn btn-ghost btn-small" data-eternal-action="veil-index">BUKA INDEX LENGKAP DI VEIL</button></article><article class="veil-card"><header><h3>12 Klasifikasi</h3><span>FIELD RISET BARU</span></header>${classifications}</article><article class="veil-card"><header><h3>Milestone Rank 1–100</h3><span>10 HADIAH</span></header>${milestones}</article>`;
}
function eternalSanityBody(controller) {
  const meter = controller.veil?.sanity || ensureVeil().sanity;
  const snap = meter.snapshot();
  const bar = (label, value, cls, suffix) => `<div class="eternal-meter"><span>${label}</span><i><b class="${cls}" style="width:${Math.max(0, Math.min(100, value))}%"></b></i><em>${Math.round(value)}${suffix || ''}</em></div>`;
  return `<article class="veil-card active"><header><h3>Sanity 3.0</h3><span>${esc(snap.label)}</span></header>
      ${bar('SANITY', snap.value, '', '/100')}${bar('VEIL EXPOSURE', snap.exposure, 'exposure', '/100')}${bar('MENTAL FOCUS', snap.focus, 'focus', '/100')}
      <p>Sanity mengatur stabilitas; Veil Exposure mengumpulkan pengaruh supernatural per-run; Mental Focus membuka analisis opsional. Tidak ada yang membunuh atau mengambil kendali.</p>
      <div class="veil-toolbar"><button type="button" class="btn btn-ghost btn-small" data-eternal-action="analyze">ANALISIS LANJUTAN · 10 FOCUS</button><button type="button" class="btn btn-ghost btn-small" data-eternal-action="recover">PULIHKAN FOCUS</button><button type="button" class="btn btn-ghost btn-small" data-eternal-action="reduce-exposure">REDAM EXPOSURE</button></div></article>
    <article class="veil-card"><header><h3>Zona & Kondisi</h3><span>${esc(snap.zone)}</span></header><p>Paparan: ${esc(snap.exposureBand)} · Fokus: ${esc(snap.focusLabel)} · Kondisi sementara: ${snap.conditions.length}.</p><p class="veil-muted">Pemulihan: ruang aman, relik pelindung, memori, rest station, checkpoint bab, dan hadiah investigasi.</p></article>
    <div class="veil-grid">${ETERNAL_SETTING_DEFINITIONS.filter((d) => d.tab === 'sanity').map((def) => `<article class="veil-card">${eternalSettingControl(def)}</article>`).join('')}</div>`;
}

function eternalInvestigationBody(controller) {
  const inv = controller.save.investigations;
  const generated = inv.generated.slice(-8).reverse().map((mission) => {
    const done = inv.completed.includes(mission.id);
    const active = inv.activeCase === mission.id;
    return `<div class="veil-row"><span>${esc(mission.name)} · ${mission.evidenceGoal} bukti · Lv.${mission.level}</span><b>${done ? 'SELESAI' : active ? 'AKTIF' : esc(mission.difficulty)}</b><button type="button" class="btn btn-ghost btn-small" data-eternal-case="${mission.id}" ${done ? 'disabled' : ''}>${done ? 'ARSIP' : 'PILIH'}</button></div>`;
  }).join('');
  const active = inv.activeCase ? `<button type="button" class="btn btn-primary btn-small" data-eternal-action="solve-case">SELESAIKAN KASUS AKTIF</button>` : '<p class="veil-muted">Pilih atau generate kasus untuk memulai.</p>';
  return `<article class="veil-card"><header><h3>Procedural Investigation</h3><span>10 TEMPLATE · VALIDATED</span></header><p>Generator memilih template, lokasi, entitas, bukti, dan reward secara deterministik; kombinasi tidak valid ditolak dan fallback selalu tersedia.</p><div class="veil-toolbar"><button type="button" class="btn btn-primary btn-small" data-eternal-action="generate-case">GENERATE KASUS</button><button type="button" class="btn btn-ghost btn-small" data-eternal-action="generate-ancient">GENERATE ANCIENT</button></div>${active}</article>
    <article class="veil-card"><header><h3>Kasus Tersimpan</h3><span>${inv.generated.length} GENERATED · ${inv.completed.length} SELESAI</span></header>${generated || '<p class="veil-muted">Belum ada kasus yang digenerate.</p>'}</article>`;
}

function eternalHuntsBody(controller) {
  const variants = HUNT_VARIANTS.map((variant) => `<article class="veil-card eternal-card ${eternalHuntConfig.variant === variant.id ? 'active' : ''}"><header><h3>${esc(variant.name)}</h3><span>${variant.entities} ENTITAS · ${variant.duration}s</span></header><p>${esc(variant.description)}</p><button type="button" class="btn btn-ghost btn-small" data-eternal-hunt="${variant.id}">MULAI HUNT</button></article>`).join('');
  const history = controller.save.hunts.history.slice(-6).reverse().map((hunt) => `<div class="veil-row"><span>${esc(hunt.variant)} · ${hunt.entities.length} entitas</span><b>${hunt.antiJumpscare ? 'TANPA JUMPSCARE' : 'PENUH'}</b><em>${new Date(hunt.completedAt).toLocaleDateString('id-ID')}</em></div>`).join('');
  const chapterOptions = ETERNAL_CHAPTERS.map((c) => `<option value="${c.id}" ${eternalHuntConfig.chapter === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  return `<div class="veil-toolbar"><select data-eternal-hunt-field="chapter">${chapterOptions}</select><select data-eternal-hunt-field="rarity"><option value="all">SEMUA RARITY</option>${GHOST_RARITIES.map((r) => `<option value="${r}" ${eternalHuntConfig.rarity === r ? 'selected' : ''}>${r}</option>`).join('')}</select><select data-eternal-hunt-field="difficulty">${['story', 'easy', 'normal', 'hard', 'nightmare'].map((d) => `<option value="${d}" ${eternalHuntConfig.difficulty === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div><div class="eternal-section">${variants}</div><article class="veil-card"><header><h3>Riwayat Hunt</h3><span>${controller.save.stats.hunts} SELESAI</span></header>${history || '<p class="veil-muted">Belum ada hunt.</p>'}</article>`;
}

function eternalWorkshopBody(controller) {
  const groups = EQUIPMENT_CATEGORIES.map((category) => {
    const items = ETERNAL_EQUIPMENT.filter((item) => item.category === category.id).map((item) => {
      const tier = controller.save.workshop.tiers[item.id] || 1;
      const cost = tier < 5 ? equipmentCost(item.id, tier + 1) : null;
      return `<div class="veil-row"><span>${esc(item.name)} · Tier ${tier}/5 · ${esc(item.description)}</span><b>${cost ? `${cost.spiritShards} ash` : 'MAX'}</b><button type="button" class="btn btn-ghost btn-small" data-eternal-upgrade="${item.id}" ${cost ? '' : 'disabled'}>${cost ? 'TINGKATKAN' : 'MASTERWORK'}</button></div>`;
    }).join('');
    return `<article class="veil-card"><header><h3>${esc(category.name)}</h3><span>${ETERNAL_EQUIPMENT.filter((i) => i.category === category.id).length} PERALATAN</span></header>${items}</article>`;
  }).join('');
  return `<article class="veil-card"><header><h3>Equipment Workshop 2.0</h3><span>12 ITEM · 5 TIER</span></header><p>Peralatan esensial tersedia pada Tier I tanpa biaya. Upgrade memberi manfaat terukur dan tidak pernah menjadi syarat cerita.</p></article><div class="eternal-section">${groups}</div>`;
}

function eternalEventsBody(controller) {
  const active = controller.events.active;
  const activeDef = active ? WORLD_EVENTS.find((e) => e.id === active.id) : null;
  const activeCard = activeDef ? `<article class="veil-card active"><header><h3>${esc(activeDef.name)}</h3><span>AKTIF</span></header>${active.objectives.map((objective, index) => `<div class="veil-row"><span>${esc(objective.label)}</span><b>${objective.done ? 'SELESAI' : 'TERBUKA'}</b><button type="button" class="btn btn-ghost btn-small" data-eternal-event-step="${index}" ${objective.done ? 'disabled' : ''}>CATAT</button></div>`).join('')}<button type="button" class="btn btn-primary btn-small" data-eternal-action="complete-event">SELESAIKAN EVENT</button></article>` : '<article class="veil-card"><header><h3>Tidak ada event aktif</h3><span>DIRECTOR</span></header><p>Pilih event dari jadwal untuk memulai.</p><button type="button" class="btn btn-ghost btn-small" data-eternal-action="schedule-event">JADWALKAN EVENT</button></article>';
  const cards = WORLD_EVENTS.map((event) => `<div class="veil-row"><span>${esc(event.name)} · ${esc(event.kind)} · ${event.objectives.length} objektif</span><b>${controller.save.events.completed.includes(event.id) ? 'SELESAI' : 'TERSEDIA'}</b><button type="button" class="btn btn-ghost btn-small" data-eternal-event="${event.id}" ${controller.events.active ? 'disabled' : ''}>AKTIFKAN</button></div>`).join('');
  const journal = WORLD_EVENTS.filter((event) => controller.save.events.journal.includes(event.id)).map((event) => `<div class="veil-row"><span>${esc(event.name)}</span><b>TERCATAT</b><em>${esc(event.chapter)}</em></div>`).join('');
  return `${activeCard}<article class="veil-card"><header><h3>Dynamic World Events</h3><span>11 EVENT</span></header>${cards}</article><article class="veil-card"><header><h3>Jurnal Event</h3><span>${controller.save.events.journal.length}/11</span></header>${journal || '<p class="veil-muted">Belum ada event tercatat.</p>'}</article>`;
}

function eternalCoopBody(controller) {
  const roles = EXPEDITION_ROLES.map((role) => `<div class="veil-row"><span>${esc(role.name)} · ${esc(role.ability)}</span><b>SANITY ×${role.sanity}</b><em>${esc(role.id)}</em></div>`).join('');
  const sessions = controller.expedition.sessions.slice(-4).reverse().map((session) => {
    const team = controller.expedition.teamSanity(session.id) || [];
    return `<article class="veil-card"><header><h3>${esc(session.id)}</h3><span>${esc(session.status)} · ${session.members.length} PEMAIN</span></header><p>${team.map((m) => `${esc(m.id)} (${esc(m.role)}) ${Math.round(m.sanity)}`).join(' · ')}</p>${session.tasks.map((task) => `<div class="veil-row"><span>${esc(task.name)}</span><b>${task.done ? 'SELESAI' : `${task.players} pemain`}</b><button type="button" class="btn btn-ghost btn-small" data-eternal-coop-task="${session.id}|${task.id}" ${task.done ? 'disabled' : ''}>CATAT</button></div>`).join('')}<button type="button" class="btn btn-primary btn-small" data-eternal-coop-complete="${session.id}">SELESAIKAN EKSPEDISI</button></article>`;
  }).join('');
  return `<article class="veil-card active"><header><h3>Ghost Research Expedition</h3><span>2–4 PEMAIN · PERAN</span></header><p>Setiap investigator mempertahankan Sanity sendiri; tim hanya menampilkan nilai gabungan untuk koordinasi. Reward diberikan sekali per sesi.</p><button type="button" class="btn btn-primary btn-small" data-eternal-action="create-expedition">BUAT SESI LOKAL</button><p class="veil-muted">Model ini dijalankan secara lokal/otoritatif host; belum ada matchmaking atau verifikasi server produksi.</p></article><article class="veil-card"><header><h3>Peran Investigator</h3><span>5 PERAN</span></header>${roles}</article>${sessions || '<p class="veil-muted">Belum ada sesi ekspedisi.</p>'}`;
}

function eternalProgressBody(controller) {
  const achievements = ETERNAL_ACHIEVEMENTS.map((achievement) => `<div class="veil-row"><span>${esc(achievement.name)} · ${esc(achievement.description)}</span><b>${achievement.target}</b><em>${controller.save.achievements.includes(achievement.id) ? 'TERBUKA' : 'TERKUNCI'}</em></div>`).join('');
  const milestones = INDEX_RANK_MILESTONES.map((m) => `<div class="veil-row"><span>Rank ${m.rank} · ${esc(m.name)}</span><b>${controller.save.rankRewards.includes(m.id) ? 'DITERIMA' : 'TERKUNCI'}</b><em>${esc(m.type)}</em></div>`).join('');
  return `<article class="veil-card"><header><h3>Arc X Progress</h3><span>${controller.save.campaign.chapterClears.length}/${ETERNAL_CHAPTERS.length} BAB</span></header><div class="veil-stat"><div><span>Hunt</span><b>${controller.save.stats.hunts}</b></div><div><span>World events</span><b>${controller.save.stats.events}</b></div><div><span>Co-op</span><b>${controller.save.stats.coopClears}</b></div><div><span>Masterwork</span><b>${controller.save.stats.masterworks}</b></div></div><button type="button" class="btn btn-ghost btn-small" data-eternal-action="claim-ranks">KLAIM HADIAH RANK</button></article><article class="veil-card"><header><h3>10 Achievement Arc X</h3><span>${controller.save.achievements.length}/10</span></header>${achievements}</article><article class="veil-card"><header><h3>Rank Reward</h3><span>${controller.save.rankRewards.length}/10</span></header>${milestones}</article>`;
}

function eternalSettingsBody() {
  const groups = [['sanity', 'Sanity 3.0'], ['hunts', 'Spectral Pursuit'], ['events', 'World Events'], ['coop', 'Ekspedisi'], ['settings', 'Performa & Aksesibilitas']];
  return groups.map(([tab, label]) => {
    const defs = ETERNAL_SETTING_DEFINITIONS.filter((def) => def.tab === tab);
    return `<article class="veil-card"><header><h3>${label}</h3><span>${defs.length} KONTROL</span></header>${defs.map((def) => eternalSettingControl(def)).join('')}</article>`;
  }).join('');
}

function setEternalTab(tab) {
  if (!ETERNAL_TABS.some((entry) => entry.id === tab)) return eternalTab;
  eternalTab = tab;
  buildEternalScreen();
  return eternalTab;
}

function openEternal() {
  ensureEternal();
  menuView = 'eternal';
  started = false;
  paused = false;
  spectating = false;
  $('veil-hud')?.classList.add('hidden');
  buildEternalScreen();
  syncScreens();
  return eternalController.snapshot();
}

function closeEternal() {
  if (menuView === 'eternal') menuView = 'title';
  syncScreens();
}

function startEternalStage(stageId) {
  const controller = ensureEternal();
  const start = controller.startStage(stageId);
  if (!start.ok) {
    showToast(start.reason === 'locked' ? 'TAHAP MASIH TERKUNCI' : start.reason === 'arc-locked' ? 'ARC X BELUM TERBUKA' : 'TAHAP TIDAK DITEMUKAN', 2000);
    return start;
  }
  eternalRunHunt = null;
  eternalStageComplete = false;
  eternalBossSeen = false;
  game.veilDeathCounted = false;
  if (typeof game.reset === 'function') game.reset();
  applyCharacterToGame();
  game.loadEternalStage(stageId);
  syncHunterStockToRun();
  ensureArchive().progress.recordAttempt(stageId);
  saveArchiveProfile();
  game.player.hp = game.player.maxHp;
  activeRunKind = 'eternal';
  started = true;
  paused = false;
  menuView = 'none';
  spectating = false;
  controller.veil?.sanity?.setZone(start.stage.zone);
  controller.veil?.sanity?.setValue(Math.max(controller.veil.sanity.value, 1));
  const pool = GHOSTS.filter((g) => g.chapter === start.stage.chapter && !g.secret);
  if (pool.length) { const ghost = game.spawnGhost(pool[controller.save.campaign.runs % pool.length].id, Math.max(120, game.player.x + 300)); if (ghost) controller.veil?.witness(ghost.ghostKind); }
  veilHudCache = '';
  updateVeilHud();
  syncScreens();
  showToast(`ARC X · ${start.stage.name}`, 2200);
  saveEternalProfile();
  return start;
}

function startEternalBoss(bossId) {
  const controller = ensureEternal();
  const start = controller.startBoss(bossId);
  if (!start.ok) {
    showToast(start.reason === 'locked' ? 'BOS MASIH TERKUNCI' : 'BOS TIDAK DITEMUKAN', 2000);
    return start;
  }
  eternalRunHunt = null;
  eternalStageComplete = false;
  eternalBossSeen = true;
  game.veilDeathCounted = false;
  if (typeof game.reset === 'function') game.reset();
  applyCharacterToGame();
  game.startEternalBoss(bossId);
  syncHunterStockToRun();
  game.player.hp = game.player.maxHp;
  activeRunKind = 'eternal';
  started = true;
  paused = false;
  menuView = 'none';
  controller.veil?.sanity?.setZone('veil');
  veilHudCache = '';
  updateVeilHud();
  syncScreens();
  showToast(`ARC X BOSS · ${start.boss.name}`, 2400);
  saveEternalProfile();
  return start;
}

function startEternalHunt(config = {}) {
  const controller = ensureEternal();
  const hunt = controller.startHunt({ ...eternalHuntConfig, ...config, antiJumpscare: !!eternalSettings()['hunts.antiJumpscare'] });
  if (!hunt.ok) return hunt;
  eternalHuntConfig = { ...hunt.hunt.config };
  eternalRunHunt = hunt.hunt;
  eternalStageComplete = false;
  eternalBossSeen = false;
  game.veilDeathCounted = false;
  controller.activeStage = hunt.hunt.stage;
  if (typeof game.reset === 'function') game.reset();
  applyCharacterToGame();
  game.loadEternalStage(hunt.hunt.stage);
  syncHunterStockToRun();
  game.player.hp = game.player.maxHp;
  activeRunKind = 'eternal';
  started = true;
  paused = false;
  menuView = 'none';
  controller.veil?.sanity?.beginRun({ stage: true });
  controller.veil?.sanity?.setZone('haunted');
  veilHudCache = '';
  updateVeilHud();
  syncScreens();
  showToast(`SPECTRAL PURSUIT · ${hunt.hunt.variant.toUpperCase()}`, 2200);
  saveEternalProfile();
  return hunt;
}

function completeEternalStage() {
  const controller = eternalController;
  const stage = controller?.activeStage ? eternalStage(controller.activeStage) : null;
  if (!controller || !stage) return null;
  if (eternalRunHunt) {
    const hunt = eternalRunHunt;
    hunt.objectives.forEach((objective) => { objective.done = true; });
    const result = controller.completeHunt({ timeMs: hunt.duration * 1000 });
    eternalRunHunt = null;
    saveEternalProfile();
    showToast('HUNT SELESAI · CATATAN DIARSIPKAN', 2200);
    window.setTimeout(() => { if (activeRunKind !== 'eternal') return; activeRunKind = 'none'; started = false; openEternal(); }, 1600);
    return result;
  }
  const result = controller.completeStage(stage.id, {
    clean: (controller.veil?.sanity?.value || 0) >= 30,
    timeMs: Math.max(0, Math.round((game.time || 0) * 1000)),
  });
  saveEternalProfile();
  showToast(`TAHAP SELESAI · ${stage.name}`, 2200);
  window.setTimeout(() => { if (activeRunKind !== 'eternal') return; activeRunKind = 'none'; started = false; openEternal(); }, 1700);
  return result;
}

function completeEternalBoss() {
  const controller = eternalController;
  const bossId = controller?.activeBoss;
  if (!bossId) return null;
  const result = controller.defeatBoss(bossId, { timeMs: Math.max(0, Math.round((game.time || 0) * 1000)) });
  eternalBossSeen = false;
  saveEternalProfile();
  showToast(`BOS TUMBANG · ${eternalBoss(bossId)?.name || bossId}`, 2600);
  window.setTimeout(() => { if (activeRunKind !== 'eternal') return; activeRunKind = 'none'; started = false; openEternal(); }, 1900);
  return result;
}

function eternalTick(dt) {
  if (activeRunKind !== 'eternal' || !started || paused || menuView !== 'none') return null;
  const controller = eternalController;
  if (!controller) return null;
  veilController?.tick(dt);
  updateVeilHud();
  if (game.boss && !eternalBossSeen) eternalBossSeen = true;
  if (eternalBossSeen && !game.boss) return completeEternalBoss();
  if (!game.boss && !eternalStageComplete) {
    const alive = (game.enemies || []).filter((e) => !e.dead && !e.ghostKind).length;
    if (alive === 0) { eternalStageComplete = true; completeEternalStage(); }
  }
  if (game.state === 'dead' && !game.veilDeathCounted) {
    game.veilDeathCounted = true;
    controller.save.campaign.deaths += 1;
    saveEternalProfile();
  }
  return controller.snapshot();
}

// ── Update XV: Stage Archive & Supernatural Research Database ──────────────
let archiveController = null;
let archiveTab = 'stages';
let archiveArc = 'arc9';
let archiveChapter = 'all';
let archiveStageId = null;
let archiveGhostId = null;
let archivePreviewId = null;
let archivePreviewData = null;
let archiveReturnView = 'veil';
let archivePrepareGhost = null;
let archiveToolCategory = 'all';
let archiveGhostFilters = { search: '', classification: 'all', rarity: 'all', discovery: 'all', chapter: 'all', tool: 'all', missing: false };
let archiveScareFilters = { search: '', category: 'all', state: 'all', missing: false };

const ARCHIVE_TAB_DEFS = [
  { id: 'stages', label: 'STAGE ARCHIVE' },
  { id: 'checker', label: 'LEVEL CHECKER' },
  { id: 'ghosts', label: 'GHOST INDEX 3.0' },
  { id: 'jumpscares', label: 'JUMPSCARE INDEX' },
  { id: 'equipment', label: 'EQUIPMENT' },
  { id: 'progress', label: 'PROGRESS' },
];
const ARCHIVE_STATUS_LABEL = { cleared: 'CLEARED', unlocked: 'UNLOCKED', uncleared: 'UNCLEARED', locked: 'LOCKED', perfect: '100% DOCUMENTED' };
const ARCHIVE_STATE_LABEL = { undiscovered: 'UNDISCOVERED', rumored: 'RUMORED', encountered: 'ENCOUNTERED', identified: 'IDENTIFIED', investigated: 'INVESTIGATED', documented: 'DOCUMENTED', mastered: 'MASTERED' };

function ensureArchive() {
  if (archiveController) return archiveController;
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(ARCHIVE_SAVE_KEY) || 'null'); } catch { raw = null; }
  const veil = ensureVeil();
  const eternal = ensureEternal();
  archiveController = new ArchiveController({ save: sanitizeArchiveSave(raw || {}), veil, eternal, index: veil.index });
  return archiveController;
}

function saveArchiveProfile() {
  if (!archiveController) return false;
  try { localStorage.setItem(ARCHIVE_SAVE_KEY, JSON.stringify(archiveController.toJSON())); return true; } catch { return false; }
}

function archiveSelectedStage() {
  const controller = ensureArchive();
  if (archiveStageId && ARCHIVE_STAGES_BY_ID[archiveStageId]) return archiveStageId;
  archiveStageId = controller.stageArchive.stagesFor(archiveArc, archiveChapter)[0]?.id || ARCHIVE_STAGES[0].id;
  return archiveStageId;
}

function archiveStatus(stageId) { return ensureArchive().stageStatus(stageId); }

function archiveStatusBadge(status) {
  return `<span class="archive-status archive-status-${status}">${ARCHIVE_STATUS_LABEL[status] || status.toUpperCase()}</span>`;
}

function openArchive(tab = 'stages') {
  const controller = ensureArchive();
  archiveReturnView = menuView === 'eternal' ? 'eternal' : menuView === 'veil' ? 'veil' : 'title';
  if (ARCHIVE_TAB_DEFS.some((entry) => entry.id === tab)) archiveTab = tab;
  archivePreviewId = null;
  archivePreviewData = null;
  menuView = 'archive';
  started = false;
  paused = false;
  spectating = false;
  $('veil-hud')?.classList.add('hidden');
  archiveSelectedStage();
  buildArchiveScreen();
  syncScreens();
  return controller.dashboard();
}

function closeArchive() {
  archivePreviewId = null;
  archivePreviewData = null;
  if (menuView !== 'archive') return;
  if (archiveReturnView === 'eternal') openEternal();
  else if (archiveReturnView === 'veil') openVeil();
  else { menuView = 'title'; syncScreens(); }
}

function buildArchiveScreen() {
  const body = $('archive-body');
  if (!body) return;
  const controller = ensureArchive();
  const board = controller.dashboard();
  $('archive-summary').innerHTML = `<span>${board.stages.cleared}/${board.stages.total} TAHAP</span><span>${board.stages.perfect} PERFECT</span><span>${board.ghosts.documented}/${board.ghosts.total} ENTITAS</span><span>${board.jumpscares.documented}/${board.jumpscares.total} SCARE</span><span>${board.tools.owned}/${board.tools.total} TOOL</span><span>${board.previews.unique} PREVIEW</span>`;
  $('archive-tabs').innerHTML = ARCHIVE_TAB_DEFS.map((tab) => `<button type="button" class="scary-tab ${tab.id === archiveTab ? 'active' : ''}" data-archive-tab="${tab.id}" role="tab" aria-selected="${tab.id === archiveTab}">${tab.label}</button>`).join('');
  body.innerHTML = archiveBodyFor(archiveTab, controller);
  syncScreens();
}

function archiveBodyFor(tab, controller) {
  if (tab === 'checker') return archiveCheckerBody(controller);
  if (tab === 'ghosts') return archiveGhostsBody(controller);
  if (tab === 'jumpscares') return archiveJumpscaresBody(controller);
  if (tab === 'equipment') return archiveEquipmentBody(controller);
  if (tab === 'progress') return archiveProgressBody(controller);
  return archiveStagesBody(controller);
}

function archiveStagesBody(controller) {
  archiveSelectedStage();
  const arc = ARCHIVE_ARCS.find((a) => a.id === archiveArc) || ARCHIVE_ARCS[0];
  const chapters = controller.stageArchive.chaptersFor(arc.id);
  const stages = controller.stageArchive.stagesFor(arc.id, archiveChapter);
  const selectedId = stages.some((s) => s.id === archiveStageId) ? archiveStageId : stages[0]?.id;
  if (selectedId) archiveStageId = selectedId;
  const selected = ARCHIVE_STAGES_BY_ID[archiveStageId];
  const status = controller.stageStatus(selectedId);
  const arcButtons = ARCHIVE_ARCS.map((entry) => `<button type="button" class="btn btn-ghost btn-small ${entry.id === arc.id ? 'active' : ''}" data-archive-arc="${entry.id}">${esc(entry.short)} · ${esc(entry.label.split('—')[1]?.trim() || entry.label)}</button>`).join('');
  const chapterButtons = chapters.map((chapter) => {
    const rows = controller.stageArchive.stagesFor(arc.id, chapter.id);
    const cleared = rows.filter((s) => ['cleared', 'perfect'].includes(controller.stageStatus(s.id))).length;
    return `<button type="button" class="btn btn-ghost btn-small ${chapter.id === archiveChapter ? 'active' : ''}" data-archive-chapter="${chapter.id}">${esc(chapter.name)} · ${cleared}/5</button>`;
  }).join('');
  const cards = stages.map((stage) => {
    const stageState = controller.stageStatus(stage.id);
    return `<article class="archive-stage-card ${stageState} ${stage.id === archiveStageId ? 'selected' : ''}" data-archive-stage="${stage.id}" tabindex="0">
      <header><span>${String(stage.number).padStart(2, '0')}</span>${archiveStatusBadge(stageState)}</header>
      <h4>${esc(stage.name)}</h4><p>${esc(stage.chapterName)} · ${stage.enemyCount} musuh · ${stage.eliteCount} elite</p>
      <div class="archive-card-actions"><button type="button" class="btn btn-ghost btn-small" data-archive-preview="${stage.id}">SNEAK PEEK</button><button type="button" class="btn btn-ghost btn-small" data-archive-check="${stage.id}">CHECK</button></div>
    </article>`;
  }).join('');
  const docs = selected.ghostIds.map((id) => ({ id, state: controller.ghosts.state(id), ghost: GHOSTS.find((g) => g.id === id) })).filter((row) => row.ghost);
    const known = docs.filter((row) => row.state !== 'undiscovered');
  const boss = ARCHIVE_BOSSES.find((b) => b.id === selected.bossId);
  const bossKnown = boss && controller.stageArchive.bosses(selected.arcId).has(boss.id);
  const check = controller.checkStage(selected.id);
  const detail = `<article class="veil-card archive-detail"><header><h3>${esc(selected.chapterName)} · ${esc(selected.name)}</h3>${archiveStatusBadge(status)}</header>
    <p>${esc(selected.description)}</p>
    <div class="archive-grid">
      <div><span>ARC</span><b>${esc(arc.short)}</b></div><div><span>TYPE</span><b>${esc(selected.stageType || 'standard')}</b></div><div><span>THREAT</span><b>${esc(selected.threat)}</b></div><div><span>ENEMIES</span><b>${selected.enemyCount} + ${selected.eliteCount} elite</b></div><div><span>GHOSTS</span><b>${known.length}/${docs.length} known</b></div><div><span>BOSS</span><b>${bossKnown ? esc(boss.name) : 'UNKNOWN'}</b></div><div><span>OVERALL</span><b>${check.percentages.overall}%</b></div><div><span>ATTEMPTS</span><b>${controller.save.stageRecords[selected.id]?.attempts || 0}</b></div><div><span>DISCOVERIES</span><b>${selected.collectibleIds.length} records</b></div>
    </div>
    <div class="archive-objectives"><strong>OBJEKTIF</strong><p>${esc(selected.objective)}</p><strong>KONDISI</strong><p>${esc(selected.conditions.zone)} · drain ${selected.sanityDrain} · aktivitas ${esc(selected.conditions.supernaturalActivity)}</p><strong>KOLEKSI</strong><p>${selected.collectibleIds.length} fragmen lore · ${selected.jumpscareEventIds.length} peristiwa scare</p></div>
    <div class="veil-toolbar"><button type="button" class="btn btn-primary btn-small" data-archive-preview="${selected.id}">SNEAK PEEK</button><button type="button" class="btn btn-ghost btn-small" data-archive-check="${selected.id}">LEVEL CHECKER</button><button type="button" class="btn btn-ghost btn-small" data-archive-ghosts="${selected.id}">GHOST INDEX</button><button type="button" class="btn btn-ghost btn-small" data-archive-prepare="${selected.ghostIds[0] || ''}">PREPARE INVESTIGATION</button><button type="button" class="btn btn-primary btn-small" data-archive-enter="${selected.id}" ${['unlocked', 'cleared', 'perfect'].includes(status) ? '' : 'disabled'}>${status === 'cleared' || status === 'perfect' ? 'REPLAY STAGE' : 'ENTER STAGE'}</button></div>
  </article>`;
  const bossRows = controller.stageArchive.bossesFor(arc.id).map((row) => {
    const found = controller.stageArchive.bosses(arc.id).has(row.id);
    return `<div class="veil-row"><span>${found ? esc(row.name) : '??? · BOSS TERKUNCI'}</span><b>${row.maxPhases} FASE</b><em>${found ? esc(row.title) : esc(row.chapterName)}</em></div>`;
  }).join('');
  return `<div class="archive-toolbar"><div class="veil-toolbar">${arcButtons}</div><div class="veil-toolbar">${chapterButtons}</div></div><div class="archive-layout"><div class="archive-stage-grid">${cards}</div>${detail}</div><article class="veil-card"><header><h3>Boss Archive</h3><span>${controller.stageArchive.bossesFor(arc.id).length} BOS</span></header>${bossRows}</article>`;
}

function archiveCheckerBody(controller) {
  const stageId = archiveSelectedStage();
  const check = controller.checkStage(stageId);
  const chapter = controller.checkChapter(ARCHIVE_STAGES_BY_ID[stageId].chapterId);
  const arc = controller.checkArc(ARCHIVE_STAGES_BY_ID[stageId].arcId);
  if (!check.ok) return `<p>${esc(check.reason)}</p>`;
  const rows = check.categories.map((category) => `<div class="archive-check-row"><span>${esc(category.label)}</span><div class="archive-bar"><i style="width:${Math.max(0, Math.min(100, Number(category.value) || 0))}%"></i></div><b>${category.status === 'not-available' ? 'N/A' : `${category.value}%`}</b><em>${esc(category.detail)}</em></div>`).join('');
  const summary = [['MAIN', check.percentages.main], ['GHOSTS', check.percentages.ghosts], ['COLLECTIBLES', check.percentages.collectibles], ['SECRETS', check.percentages.secrets], ['OVERALL', check.percentages.overall]].map(([label, value]) => `<div><span>${label}</span><b>${value}%</b></div>`).join('');
  const chapterRows = chapter.categories.map((row) => `<div class="veil-row"><span>${esc(row.id.toUpperCase())}</span><b>${row.complete ? 'SELESAI' : 'BELUM'}</b><em>${row.value}%</em></div>`).join('');
  return `<article class="veil-card active"><header><h3>LEVEL CHECKER · ${esc(check.stage.name)}</h3>${archiveStatusBadge(check.stage.status)}</header><div class="archive-grid archive-percentages">${summary}</div><div class="archive-checks">${rows}</div>${check.issues.length ? `<p class="archive-warning">ISU: ${esc(check.issues.join(' · '))}</p>` : '<p class="archive-ok">Tidak ada konflik progres yang terdeteksi.</p>'}<div class="veil-toolbar"><button type="button" class="btn btn-ghost btn-small" data-archive-tab="stages">KEMBALI KE STAGE</button><button type="button" class="btn btn-ghost btn-small" data-archive-check="${stageId}">PERIKSA ULANG</button></div></article>
    <article class="veil-card"><header><h3>Chapter Report · ${esc(ARCHIVE_STAGES_BY_ID[stageId].chapterName)}</h3><span>${chapter.completeStages}/${chapter.stages.length} CLEAR</span></header>${chapterRows}</article>
    <article class="veil-card"><header><h3>Arc Report</h3><span>${arc.completeStages}/${arc.totalStages}</span></header><p>Laporan bab dihitung dari progres Arc IX/X yang tersimpan. Checker tidak memberikan hadiah otomatis.</p></article>`;
}

function archiveGhostFilterOptions() {
  return `<select data-archive-filter="classification"><option value="all">SEMUA KLASIFIKASI</option>${GHOST_CLASSIFICATIONS.map((c) => `<option value="${c.id}" ${archiveGhostFilters.classification === c.id ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select>
    <select data-archive-filter="rarity"><option value="all">SEMUA RARITY</option>${GHOST_RARITIES.map((r) => `<option value="${r}" ${archiveGhostFilters.rarity === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select>
    <select data-archive-filter="discovery"><option value="all">SEMUA STATUS</option>${ARCHIVE_DISCOVERY_STATES.map((s) => `<option value="${s}" ${archiveGhostFilters.discovery === s ? 'selected' : ''}>${esc(ARCHIVE_STATE_LABEL[s])}</option>`).join('')}</select>
    <select data-archive-filter="chapter"><option value="all">SEMUA LOKASI</option>${ARCHIVE_CHAPTERS.map((c) => `<option value="${c.id}" ${archiveGhostFilters.chapter === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
    <select data-archive-filter="tool"><option value="all">SEMUA TOOL</option>${ARCHIVE_TOOLS.map((t) => `<option value="${t.id}" ${archiveGhostFilters.tool === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>`;
}

function archiveGhostsBody(controller) {
  const rows = controller.ghostQuery({ ...archiveGhostFilters, missing: archiveGhostFilters.missing });
  const visible = rows.slice(0, 40);
  if (!archiveGhostId || !rows.some((row) => row.ghost.id === archiveGhostId)) archiveGhostId = rows[0]?.ghost.id || null;
  const entry = archiveGhostId ? controller.ghostEntry(archiveGhostId) : null;
  const list = visible.map((row, position) => {
    const known = row.state !== 'undiscovered';
    const label = known ? row.ghost.name : `Unknown Entity #${String(position + 1).padStart(3, '0')}`;
    return `<button type="button" class="archive-ghost-row ${row.ghost.id === archiveGhostId ? 'selected' : ''}" data-archive-ghost="${row.ghost.id}"><span class="archive-entity-mark">${known ? row.ghost.name.slice(0, 1).toUpperCase() : '?'}</span><span><b>${esc(label)}</b><em>${known ? esc(row.ghost.classification) : 'Unknown'} · ${esc(row.state)}</em></span><span class="archive-status">${known ? esc(row.ghost.rarity) : '???'}</span></button>`;
  }).join('') || '<p class="veil-muted">Tidak ada entitas yang cocok dengan filter.</p>';
  let detail = '<article class="veil-card"><header><h3>Entity Detail</h3><span>PILIH ENTITAS</span></header><p>Pilih baris untuk melihat bukti, tool, dan tindakan dokumentasi.</p></article>';
  if (entry) {
    const known = entry.state !== 'undiscovered';
    const identified = entry.identity;
    const tools = [...entry.requirements.required.map((id) => ({ id, optional: false })), ...entry.requirements.optional.map((id) => ({ id, optional: true }))].map((row) => {
      const tool = controller.equipment.tool(row.id);
      return `<div class="veil-row"><span>${esc(tool?.name || row.id)}${row.optional ? ' · OPSIONAL' : ''}</span><b>${tool?.owned ? 'OWNED' : 'MISSING'}</b><em>Tier ${tool?.level || 0}</em></div>`;
    }).join('');
    const actions = [
      `<button type="button" class="btn btn-ghost btn-small" data-archive-prepare="${entry.ghost.id}">PREPARE INVESTIGATION</button>`,
      entry.state === 'encountered' ? `<button type="button" class="btn btn-ghost btn-small" data-archive-ghost-identify="${entry.ghost.id}">IDENTIFIKASI</button>` : '',
      entry.record && entry.evidenceOwned >= entry.evidenceRequired && !['documented', 'mastered'].includes(entry.state) ? `<button type="button" class="btn btn-primary btn-small" data-archive-ghost-document="${entry.ghost.id}">DOKUMENTASIKAN</button>` : '',
      ['documented', 'investigated'].includes(entry.state) ? `<button type="button" class="btn btn-ghost btn-small" data-archive-ghost-master="${entry.ghost.id}">MASTER</button>` : '',
      entry.requirements.containable && ['documented', 'investigated'].includes(entry.state) ? `<button type="button" class="btn btn-ghost btn-small" data-archive-ghost-capture="${entry.ghost.id}">CONTAIN</button>` : '',
    ].join('');
    detail = `<article class="veil-card active"><header><h3>${known ? esc(entry.ghost.name) : 'UNKNOWN ENTITY'}</h3>${archiveStatusBadge(entry.state === 'mastered' ? 'perfect' : 'uncleared')}</header><p>${known ? esc(entry.ghost.description || entry.ghost.behavior) : 'Entitas belum ditemukan. Identitas, lokasi, dan perilaku tetap tersembunyi.'}</p><div class="archive-grid"><div><span>STATE</span><b>${esc(ARCHIVE_STATE_LABEL[entry.state])}</b></div><div><span>CLASS</span><b>${identified ? esc(entry.ghost.classification) : 'UNKNOWN'}</b></div><div><span>RARITY</span><b>${known ? esc(entry.ghost.rarity) : 'UNKNOWN'}</b></div><div><span>THREAT</span><b>${known ? entry.ghost.threat : '?'}/5</b></div><div><span>EVIDENCE</span><b>${entry.evidenceOwned}/${entry.evidenceRequired}</b></div><div><span>LOCATION</span><b>${known ? esc(entry.ghost.location) : 'UNKNOWN'}</b></div></div><div class="veil-toolbar">${actions}</div><article class="veil-card archive-subcard"><header><h3>Required Tools</h3><span>${entry.requirements.required.length} WAJIB</span></header>${tools}</article><p class="micro">Metode: ${esc(entry.requirements.methods.join(' · ') || 'Belum diketahui')}.</p></article>`;
  }
  return `<div class="archive-toolbar"><input type="search" data-archive-search placeholder="Cari nama, ID, lokasi, bukti, tool…" value="${esc(archiveGhostFilters.search)}" /><div class="veil-toolbar">${archiveGhostFilterOptions()}<button type="button" class="btn btn-ghost btn-small ${archiveGhostFilters.missing ? 'active' : ''}" data-archive-missing>MISSING ENTRIES</button></div></div><p class="micro">${rows.length} entri cocok · status tidak didokumentasikan tidak disamakan dengan tahap yang sudah clear.</p><div class="archive-ghost-layout"><div class="archive-ghost-list">${list}</div>${detail}</div>`;
}

function archiveJumpscaresBody(controller) {
  const rows = controller.jumpscareQuery(archiveScareFilters);
  if (!archiveScareId || !rows.some((row) => row.id === archiveScareId)) archiveScareId = rows[0]?.id || null;
  const list = rows.map((event, index) => {
    const known = event.state !== 'undiscovered';
    return `<div class="archive-scare-row ${event.id === archiveScareId ? 'selected' : ''}" data-archive-scare="${event.id}"><span class="archive-entity-mark">${JUMPSCARE_CATEGORIES.find((c) => c.id === event.category)?.icon || '?'}</span><span><b>${known ? esc(event.name) : `Unknown Event #${String(index + 1).padStart(3, '0')}`}</b><em>${known ? esc(event.category.replace(/_/g, ' ')) : 'Unknown'} · ${esc(event.state)}</em></span>${event.documented ? '<span class="archive-status">RECORDED</span>' : `<button type="button" class="btn btn-ghost btn-small" data-archive-scare-doc="${event.id}" ${known ? '' : 'disabled'}>CATAT</button>`}</div>`;
  }).join('') || '<p class="veil-muted">Tidak ada peristiwa yang cocok.</p>';
  const selected = JUMPSCARE_EVENTS_BY_ID[archiveScareId];
  let detail = '<p class="veil-muted">Pilih peristiwa untuk melihat syarat bukti.</p>';
  if (selected) {
    const state = controller.jumpscares.state(selected.id);
    const known = state !== 'undiscovered';
    detail = `<article class="veil-card"><header><h3>${known ? esc(selected.name) : 'UNKNOWN EVENT'}</h3><span>${esc(ARCHIVE_STATE_LABEL[state])}</span></header><p>${known ? esc(selected.lore) : 'Belum ada catatan. Peristiwa tidak akan diputar otomatis saat membuka arsip.'}</p><div class="archive-grid"><div><span>CATEGORY</span><b>${esc(selected.category.replace(/_/g, ' '))}</b></div><div><span>RELATED GHOST</span><b>${known ? esc(GHOSTS.find((g) => g.id === selected.ghostId)?.name || selected.ghostId) : 'UNKNOWN'}</b></div><div><span>EVIDENCE</span><b>${esc(selected.evidenceType)}</b></div><div><span>ANTI-JUMPSCARE</span><b>ATMOSPHERIC</b></div></div><p class="micro">Trigger: ${known ? esc(selected.trigger) : 'Hidden until evidence is collected'}.</p></article>`;
  }
  return `<div class="archive-toolbar"><input type="search" data-archive-scare-search placeholder="Cari peristiwa…" value="${esc(archiveScareFilters.search)}" /><div class="veil-toolbar"><select data-archive-scare-filter="category"><option value="all">SEMUA KATEGORI</option>${JUMPSCARE_CATEGORIES.map((c) => `<option value="${c.id}" ${archiveScareFilters.category === c.id ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select><select data-archive-scare-filter="state"><option value="all">SEMUA STATUS</option>${ARCHIVE_DISCOVERY_STATES.map((s) => `<option value="${s}" ${archiveScareFilters.state === s ? 'selected' : ''}>${ARCHIVE_STATE_LABEL[s]}</option>`).join('')}</select><button type="button" class="btn btn-ghost btn-small ${archiveScareFilters.missing ? 'active' : ''}" data-archive-scare-missing>BELUM TERCATAT</button></div></div><div class="archive-ghost-layout"><div class="archive-ghost-list">${list}</div>${detail}</div><p class="micro">Jumpscare Index terpisah dari Ghost Index. Dokumentasi memakai bukti entitas dan tidak mewajibkan pemain mengalami lonjakan kamera atau audio.</p>`;
}

function archiveEquipmentBody(controller) {
  const tools = controller.tools().filter((tool) => archiveToolCategory === 'all' || tool.category === archiveToolCategory);
  const prep = archivePrepareGhost ? controller.prepare(archivePrepareGhost) : null;
  const prepHtml = prep?.ok ? `<article class="veil-card active"><header><h3>Persiapan · ${esc(GHOSTS.find((g) => g.id === prep.ghostId)?.name || prep.ghostId)}</h3><span>${prep.ready ? 'SIAP' : 'TOOL KURANG'}</span></header><p>${prep.ready ? 'Semua peralatan wajib tersedia.' : `Missing: ${prep.highlight.map((id) => ARCHIVE_TOOLS_BY_ID[id]?.name || id).join(', ')}`}</p></article>` : '';
  const rows = tools.map((tool) => `<div class="veil-row ${prep?.highlight?.includes(tool.id) ? 'archive-missing-tool' : ''}"><span>${esc(tool.name)} · ${esc(tool.category)}<em>${esc(tool.functions[0])}</em></span><b>${tool.owned ? `OWNED · T${tool.level}` : 'MISSING'}</b><button type="button" class="btn btn-ghost btn-small" data-archive-upgrade="${tool.id}" ${tool.owned && tool.level < 5 ? '' : 'disabled'}>${tool.owned ? (tool.level >= 5 ? 'MAX' : 'UPGRADE') : 'LOCKED'}</button></div>`).join('');
  return `${prepHtml}<div class="archive-toolbar"><div class="veil-toolbar"><button type="button" class="btn btn-ghost btn-small ${archiveToolCategory === 'all' ? 'active' : ''}" data-archive-tool-category="all">SEMUA</button>${ARCHIVE_TOOL_CATEGORIES.map((category) => `<button type="button" class="btn btn-ghost btn-small ${archiveToolCategory === category ? 'active' : ''}" data-archive-tool-category="${category}">${esc(category)}</button>`).join('')}</div></div><article class="veil-card"><header><h3>Investigation Equipment Index</h3><span>${controller.equipment.owned().size}/${ARCHIVE_TOOLS.length} OWNED</span></header>${rows}</article>`;
}

function archiveProgressBody(controller) {
  const board = controller.dashboard();
  const achievements = ARCHIVE_ACHIEVEMENTS.map((achievement) => {
    const unlocked = controller.save.achievements.includes(achievement.id);
    return `<div class="archive-achievement ${unlocked ? 'unlocked' : ''}"><span>${unlocked ? '✓' : '○'}</span><div><b>${esc(achievement.name)}</b><em>${esc(achievement.requirement)} · ${esc(achievement.reward)}</em></div></div>`;
  }).join('');
  return `<div class="archive-grid"><div><span>STAGES</span><b>${board.stages.cleared}/${board.stages.total}</b></div><div><span>PERFECT</span><b>${board.stages.perfect}</b></div><div><span>GHOSTS</span><b>${board.ghosts.documented}/${board.ghosts.total}</b></div><div><span>SCARES</span><b>${board.jumpscares.documented}/${board.jumpscares.total}</b></div><div><span>PREVIEWS</span><b>${board.previews.unique}</b></div><div><span>ACHIEVEMENTS</span><b>${board.achievements.unlocked}/${board.achievements.total}</b></div></div><article class="veil-card"><header><h3>Archive Achievements</h3><span>${board.achievements.unlocked}/${board.achievements.total}</span></header>${achievements}</article><p class="micro">Semua hadiah arsip bersifat kosmetik/progresi lokal dan tidak membutuhkan Anti-Jumpscare untuk dimatikan.</p>`;
}

function openArchivePreview(stageId) {
  const controller = ensureArchive();
  const preview = controller.openPreview(stageId);
  if (!preview.ok) { showToast(preview.reason === 'unknown-stage' ? 'TAHAP TIDAK DITEMUKAN' : 'PRATINJAU TIDAK TERSEDIA', 1800); return preview; }
  archivePreviewId = stageId;
  archivePreviewData = preview;
  saveArchiveProfile();
  buildArchivePreview();
  syncScreens();
  return preview;
}

function buildArchivePreview() {
  if (!archivePreviewData) return;
  const preview = archivePreviewData;
  const chapter = ARCHIVE_CHAPTERS_BY_ID[preview.stage.chapterId];
  const palette = chapter?.palette || { top: '#080a10', mid: '#131a22', low: '#1d2730', glow: '#9fb8c8' };
  $('archive-preview-title').textContent = `${preview.stage.chapterName} · ${preview.stage.name}`;
  $('archive-preview-sub').textContent = `${ARCHIVE_STATUS_LABEL[preview.stage.status] || preview.stage.status.toUpperCase()} · pratinjau arsip tidak mengubah progres.`;
  const known = preview.knownGhosts.map((g) => `<span class="archive-chip">${esc(g.name)} · ${esc(g.classification)}</span>`).join('') || '<span class="archive-chip muted">Belum ada entitas terdokumentasi</span>';
  const tools = preview.tools.map((tool) => `<div class="veil-row"><span>${esc(tool.name)}</span><b>${tool.owned ? 'OWNED' : 'MISSING'}</b></div>`).join('') || '<p class="veil-muted">Tool rekomendasi muncul setelah entitas diketahui.</p>';
  $('archive-preview-body').innerHTML = `<div class="archive-preview-scene" style="--archive-top:${palette.top};--archive-mid:${palette.mid};--archive-glow:${palette.glow}"><div class="archive-preview-fog"></div><span>${esc(preview.environment.zone)} · ${esc(preview.threat)}</span><b>${preview.unknownPresence ? `${preview.unknownPresence} entitas belum teridentifikasi` : 'Area telah dipetakan'}</b></div><div class="archive-grid"><div><span>THREAT</span><b>${esc(preview.threat)}</b></div><div><span>BOSS</span><b>${preview.boss.unknown ? 'UNKNOWN' : `${esc(preview.boss.name)} · ${preview.boss.phases} FASE`}</b></div><div><span>COLLECTIBLES</span><b>${preview.collectibles.records} records</b></div><div><span>PREVIEW TYPE</span><b>ARCHIVE</b></div></div><article class="veil-card"><header><h3>Environment</h3><span>ISOLATED</span></header><p>${esc(preview.environment.description)}</p><p class="micro">${esc(preview.environment.conditions.zone)} · drain ${preview.environment.conditions.sanityDrain} · supernatural ${esc(preview.environment.conditions.supernaturalActivity)}</p></article><article class="veil-card"><header><h3>Known Ghosts</h3><span>${preview.knownGhosts.length} KNOWN</span></header><div class="archive-chips">${known}</div></article><article class="veil-card"><header><h3>Recommended Tools</h3><span>ARSIP</span></header>${tools}</article><article class="veil-card"><header><h3>Objectives</h3><span>${preview.objectives.length}</span></header>${preview.objectives.map((o) => `<div class="veil-row"><span>${esc(o.kind)}</span><b>${esc(o.text)}</b></div>`).join('')}</article><p class="micro">Tidak ada musuh, hadiah, checkpoint, konsumsi inventory, atau dokumentasi entitas yang berubah dari pratinjau ini.</p>`;
}

function closeArchivePreview() {
  archivePreviewId = null;
  archivePreviewData = null;
  syncScreens();
}

function archiveEnterStage(stageId) {
  const status = archiveStatus(stageId);
  if (!['unlocked', 'cleared', 'perfect'].includes(status)) { showToast('TAHAP MASIH TERKUNCI', 1800); return null; }
  const stage = ARCHIVE_STAGES_BY_ID[stageId];
  if (!stage) return null;
  archivePreviewId = null;
  archivePreviewData = null;
  return stage.arcId === 'arc9' ? startVeilStage(stageId) : startEternalStage(stageId);
}

function archiveGhostAction(kind, ghostId) {
  const controller = ensureArchive();
  const result = kind === 'identify' ? controller.identifyGhost(ghostId) : kind === 'document' ? controller.documentGhost(ghostId) : kind === 'master' ? controller.masterGhost(ghostId) : null;
  if (!result) return null;
  if (result.ok) {
    saveArchiveProfile();
    saveVeilProfile();
    controller.observeGhost(ghostId);
    saveArchiveProfile();
    showToast(kind === 'document' ? 'ENTITAS TERDOKUMENTASI' : kind === 'master' ? 'ENTITAS DIKUASAI' : 'ENTITAS TERIDENTIFIKASI', 1800);
  } else showToast(result.reason === 'missing-evidence' ? 'BUKTI BELUM LENGKAP' : 'TINDAKAN BELUM TERSEDIA', 2000);
  buildArchiveScreen();
  return result;
}

function archiveDocumentScare(eventId) {
  const event = JUMPSCARE_EVENTS_BY_ID[eventId];
  if (!event) return null;
  const controller = ensureArchive();
  const result = controller.documentJumpscare(eventId, { evidenceType: event.evidenceType });
  if (result.ok) { saveArchiveProfile(); showToast('PERISTIWA TERCATAT · TANPA MEMAKSA JUMPSCARE', 2000); }
  else showToast(result.reason === 'missing-evidence' ? 'BUKTI ENTITAS BELUM CUKUP' : result.reason === 'duplicate' ? 'PERISTIWA SUDAH TERCATAT' : 'BUKTI TIDAK COCOK', 2000);
  buildArchiveScreen();
  return result;
}

function archiveUpgradeTool(toolId) {
  const controller = ensureArchive();
  const result = controller.equipment.upgrade(toolId);
  if (result.ok) { saveArchiveProfile(); showToast(`TOOL TIER ${result.level}`, 1600); }
  else showToast(result.reason === 'missing-tool' ? 'TOOL BELUM DIMILIKI' : 'TIDAK DAPAT DITINGKATKAN', 1600);
  buildArchiveScreen();
  return result;
}

function setArchiveTab(tab) {
  if (!ARCHIVE_TAB_DEFS.some((entry) => entry.id === tab)) return archiveTab;
  archiveTab = tab;
  buildArchiveScreen();
  return archiveTab;
}

let archiveScareId = null;

document.addEventListener('click', (event) => {
  const node = event.target instanceof Element ? event.target.closest('[data-archive-open],[data-archive-close],[data-archive-tab],[data-archive-arc],[data-archive-chapter],[data-archive-stage],[data-archive-preview],[data-archive-preview-close],[data-archive-check],[data-archive-ghosts],[data-archive-prepare],[data-archive-enter],[data-archive-ghost],[data-archive-ghost-identify],[data-archive-ghost-document],[data-archive-ghost-master],[data-archive-scare],[data-archive-scare-doc],[data-archive-upgrade],[data-archive-tool-category],[data-archive-missing],[data-archive-scare-missing]') : null;
  if (!node) return;
  if (node.hasAttribute('data-archive-open')) { openArchive(); return; }
  if (node.hasAttribute('data-archive-close')) { closeArchive(); return; }
  if (node.hasAttribute('data-archive-preview-close')) { closeArchivePreview(); return; }
  if (node.dataset.archiveTab) { setArchiveTab(node.dataset.archiveTab); return; }
  if (node.dataset.archiveArc) { archiveArc = node.dataset.archiveArc; archiveChapter = 'all'; archiveStageId = null; buildArchiveScreen(); return; }
  if (node.dataset.archiveChapter) { archiveChapter = node.dataset.archiveChapter; archiveStageId = null; buildArchiveScreen(); return; }
  if (node.dataset.archiveStage) { archiveStageId = node.dataset.archiveStage; buildArchiveScreen(); return; }
  if (node.dataset.archivePreview) { openArchivePreview(node.dataset.archivePreview); return; }
  if (node.dataset.archiveCheck) { archiveStageId = node.dataset.archiveCheck; archiveTab = 'checker'; buildArchiveScreen(); return; }
  if (node.dataset.archiveGhosts) { archiveStageId = node.dataset.archiveGhosts; archiveGhostFilters.chapter = ARCHIVE_STAGES_BY_ID[node.dataset.archiveGhosts]?.chapterId || 'all'; archiveGhostFilters.missing = false; archiveGhostId = null; archiveTab = 'ghosts'; buildArchiveScreen(); return; }
  if (node.dataset.archivePrepare !== undefined) { archivePrepareGhost = node.dataset.archivePrepare || null; archiveTab = 'equipment'; buildArchiveScreen(); return; }
  if (node.dataset.archiveEnter) { archiveEnterStage(node.dataset.archiveEnter); return; }
  if (node.dataset.archiveGhost) { archiveGhostId = node.dataset.archiveGhost; buildArchiveScreen(); return; }
  if (node.dataset.archiveGhostIdentify) { archiveGhostAction('identify', node.dataset.archiveGhostIdentify); return; }
  if (node.dataset.archiveGhostDocument) { archiveGhostAction('document', node.dataset.archiveGhostDocument); return; }
  if (node.dataset.archiveGhostMaster) { archiveGhostAction('master', node.dataset.archiveGhostMaster); return; }
  if (node.dataset.archiveGhostCapture) {
    const result = ensureArchive().captureGhost(node.dataset.archiveGhostCapture);
    if (result.ok) { saveArchiveProfile(); saveVeilProfile(); showToast('ENTITAS TERKANDALIKAN', 1800); } else showToast('ENTITAS BELUM DAPAT DIKANDANGKAN', 1800);
    buildArchiveScreen();
    return;
  }
  if (node.dataset.archiveScare) { archiveScareId = node.dataset.archiveScare; buildArchiveScreen(); return; }
  if (node.dataset.archiveScareDoc) { archiveDocumentScare(node.dataset.archiveScareDoc); return; }
  if (node.dataset.archiveUpgrade) { archiveUpgradeTool(node.dataset.archiveUpgrade); return; }
  if (node.dataset.archiveToolCategory) { archiveToolCategory = node.dataset.archiveToolCategory; buildArchiveScreen(); return; }
  if (node.hasAttribute('data-archive-missing')) { archiveGhostFilters.missing = !archiveGhostFilters.missing; archiveGhostId = null; buildArchiveScreen(); return; }
  if (node.hasAttribute('data-archive-scare-missing')) { archiveScareFilters.missing = !archiveScareFilters.missing; archiveScareId = null; buildArchiveScreen(); }
});

document.addEventListener('change', (event) => {
  const node = event.target instanceof Element ? event.target.closest('[data-archive-filter],[data-archive-scare-filter],[data-archive-search],[data-archive-scare-search]') : null;
  if (!node) return;
  if (node.hasAttribute('data-archive-search')) archiveGhostFilters.search = node.value;
  else if (node.hasAttribute('data-archive-scare-search')) archiveScareFilters.search = node.value;
  else if (node.dataset.archiveScareFilter) archiveScareFilters[node.dataset.archiveScareFilter] = node.value;
  else if (node.dataset.archiveFilter) archiveGhostFilters[node.dataset.archiveFilter] = node.value;
  buildArchiveScreen();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || menuView !== 'archive') return;
  if (archivePreviewId) { event.preventDefault(); closeArchivePreview(); }
});

document.addEventListener('click', (event) => {
  const node = event.target instanceof Element ? event.target : null;
  if (!node) return;
  if (node.closest('[data-eternal-open]')) { openEternal(); return; }
  if (node.closest('[data-eternal-close]')) { closeEternal(); return; }
  const tab = node.closest('[data-eternal-tab]');
  if (tab) { setEternalTab(tab.dataset.eternalTab); return; }
  const stage = node.closest('[data-eternal-stage]');
  if (stage) { startEternalStage(stage.dataset.eternalStage); return; }
  const boss = node.closest('[data-eternal-boss]');
  if (boss) { startEternalBoss(boss.dataset.eternalBoss); return; }
  const hunt = node.closest('[data-eternal-hunt]');
  if (hunt) { startEternalHunt({ variant: hunt.dataset.eternalHunt }); return; }
  const upgrade = node.closest('[data-eternal-upgrade]');
  if (upgrade) {
    const controller = ensureEternal();
    const result = controller.upgradeEquipment(upgrade.dataset.eternalUpgrade);
    showToast(result.ok ? `TIER ${result.tier} · ${result.benefit}` : result.reason === 'funds' ? 'SPIRIT SHARDS TIDAK CUKUP' : 'TIDAK DAPAT DITINGKATKAN', 2000);
    if (result.ok) saveEternalProfile();
    buildEternalScreen();
    return;
  }
  const eventCard = node.closest('[data-eternal-event]');
  if (eventCard) { ensureEternal().activateEvent(eventCard.dataset.eternalEvent); buildEternalScreen(); return; }
  const eventStep = node.closest('[data-eternal-event-step]');
  if (eventStep) { ensureEternal().contributeEvent(Number(eventStep.dataset.eternalEventStep)); buildEternalScreen(); return; }
  const caseNode = node.closest('[data-eternal-case]');
  if (caseNode) { const controller = ensureEternal(); controller.save.investigations.activeCase = caseNode.dataset.eternalCase; saveEternalProfile(); buildEternalScreen(); return; }
  const coopTask = node.closest('[data-eternal-coop-task]');
  if (coopTask) {
    const [sessionId, taskId] = String(coopTask.dataset.eternalCoopTask).split('|');
    const result = ensureEternal().completeExpeditionTask(sessionId, taskId);
    showToast(result.ok ? 'TUGAS TIM TERCATAT' : 'BUTUH PEMAIN TERHUBUNG', 1800);
    buildEternalScreen();
    return;
  }
  const coopDone = node.closest('[data-eternal-coop-complete]');
  if (coopDone) {
    const result = ensureEternal().completeExpedition(coopDone.dataset.eternalCoopComplete);
    showToast(result.ok ? 'EKSPEDISI SELESAI' : 'EKSPEDISI BELUM DAPAT DISELESAIKAN', 2000);
    if (result.ok) saveEternalProfile();
    buildEternalScreen();
    return;
  }
  const action = node.closest('[data-eternal-action]');
  if (!action) return;
  const kind = action.dataset.eternalAction;
  const controller = ensureEternal();
  if (kind === 'unlock') { controller.unlock(); saveEternalProfile(); buildEternalScreen(); showToast('ARC X TERBUKA', 1800); }
  else if (kind === 'save') { saveEternalProfile(); showToast('PROFIL MALAM TERSIMPAN', 1800); }
  else if (kind === 'recover') { controller.veil?.sanity?.recoverFocus(30); saveEternalProfile(); buildEternalScreen(); }
  else if (kind === 'reduce-exposure') { controller.veil?.sanity?.reduceExposure(25); saveEternalProfile(); buildEternalScreen(); }
  else if (kind === 'analyze') {
    const spent = controller.veil?.sanity?.spendFocus(10);
    showToast(spent?.ok ? 'ANALISIS LANJUTAN TERBUKA · PETUNJUK OPSIONAL' : 'FOCUS TIDAK CUKUP', 2000);
    buildEternalScreen();
  } else if (kind === 'generate-case') {
    const result = controller.generateCase({ seed: `ui:${controller.level}:${Date.now()}` });
    saveEternalProfile(); buildEternalScreen(); showToast(result.ok ? 'KASUS BARU DIGENERATE' : 'FALLBACK DIGUNAKAN', 2000);
  } else if (kind === 'generate-ancient') {
    const result = controller.generateCase({ seed: `ancient:${controller.level}:${Date.now()}`, rarity: 'legendary' });
    saveEternalProfile(); buildEternalScreen(); showToast(result.ok ? 'ANCIENT CASE SIAP' : 'FALLBACK DIGUNAKAN', 2000);
  } else if (kind === 'solve-case') {
    const activeId = controller.save.investigations.activeCase;
    const mission = controller.save.investigations.generated.find((m) => m.id === activeId);
    const evidence = mission?.ghostPool?.reduce((total, id) => total + (controller.veil?.index?.get(id)?.evidence.length || 0), 0) || 0;
    const result = controller.completeCase(activeId, { steps: mission?.steps || [], evidence });
    showToast(result.ok ? 'KASUS DITUTUP' : 'BUKTI BELUM LENGKAP', 2000);
    if (result.ok) saveEternalProfile();
    buildEternalScreen();
  } else if (kind === 'schedule-event') {
    const scheduled = controller.eventSchedule(Date.now());
    if (scheduled) controller.activateEvent(scheduled.id, Date.now());
    buildEternalScreen();
  } else if (kind === 'complete-event') {
    const result = controller.completeEvent();
    showToast(result.ok ? 'EVENT SELESAI · TERCATAT DI JURNAL' : 'OBJEKTIF BELUM LENGKAP', 2200);
    if (result.ok) saveEternalProfile();
    buildEternalScreen();
  } else if (kind === 'create-expedition') {
    controller.createExpedition({ seed: `local:${Date.now()}`, difficulty: 'normal' });
    saveEternalProfile(); buildEternalScreen(); showToast('SESI EKSPEDISI DIBUAT', 1800);
  } else if (kind === 'claim-ranks') {
    const granted = controller.claimRankRewards();
    saveEternalProfile(); buildEternalScreen(); showToast(granted.length ? `${granted.length} HADIAH RANK DITERIMA` : 'BELUM ADA HADIAH BARU', 2200);
  } else if (kind === 'veil-index') { openVeil(); setVeilTab('index'); }
});

document.addEventListener('input', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLElement) || !input.dataset) return;
  if (input.dataset.eternalSetting) {
    const value = input.dataset.eternalType === 'toggle' ? input.checked : input.type === 'range' ? Number(input.value) : input.value;
    applyEternalSetting(input.dataset.eternalSetting, value);
    return;
  }
});

document.addEventListener('change', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLElement) || !input.dataset) return;
  if (input.dataset.eternalSetting) { applySettings(); saveEternalProfile(); return; }
  if (input.dataset.eternalHuntField) {
    eternalHuntConfig = { ...eternalHuntConfig, [input.dataset.eternalHuntField]: input.value };
    buildEternalScreen();
  }
});

function veilDebugState() {
  const controller = ensureVeil();
  return {
    ...controller.snapshot(),
    settings: veilSettings(),
    presentation: veilPresentation(),
    tab: veilTab,
    player: { hp: game.player.hp, x: Math.round(game.player.x), sanity: Math.round(controller.sanity.value) },
    entities: (game.enemies || []).filter((e) => e.ghostKind).map((e) => ({ kind: e.ghostKind, x: Math.round(e.x), hp: e.hp, state: e.ghostState })),
    stage: controller.activeStage,
    boss: controller.activeBoss,
    runKind: activeRunKind,
  };
}

document.addEventListener('click', (event) => {
  const node = event.target instanceof Element ? event.target : null;
  if (!node) return;
  if (node.closest('#btn-veil-menu') || node.closest('[data-scary-action="veil"]')) { openVeil(); return; }
  if (node.closest('[data-veil-close]')) { closeVeil(); return; }
  const tab = node.closest('[data-veil-tab]');
  if (tab) { setVeilTab(tab.dataset.veilTab); return; }
  const stage = node.closest('[data-veil-stage]');
  if (stage) { startVeilStage(stage.dataset.veilStage); return; }
  const boss = node.closest('[data-veil-boss]');
  if (boss) { startVeilBoss(boss.dataset.veilBoss); return; }
  const consume = node.closest('[data-veil-consume]');
  if (consume && veilController) {
    const id = consume.dataset.veilConsume;
    const key = `item:${id}`;
    veilController.save.flags[key] = Math.max(0, Number(veilController.save.flags[key]) || 0);
    const inventory = { [id]: veilController.save.flags[key] };
    if (inventory[id] <= 0) inventory[id] = 1;
    const used = veilController.sanity.useConsumable(id, inventory);
    veilController.save.flags[key] = inventory[id];
    if (used.ok) { veilController.save.sanity.value = veilController.sanity.value; saveVeilProfile(); buildVeilScreen(); }
    return;
  }
  const select = node.closest('[data-veil-select]');
  if (select) { veilSelectedGhost = select.dataset.veilSelect; buildVeilScreen(); return; }
  const evidence = node.closest('[data-veil-evidence]');
  if (evidence && veilSelectedGhost) {
    veilController?.evidence(veilSelectedGhost, evidence.dataset.veilEvidence);
    ensureArchive().observeGhost(veilSelectedGhost);
    saveArchiveProfile();
    saveVeilProfile();
    buildVeilScreen();
    return;
  }
  const identify = node.closest('[data-veil-identify]');
  if (identify) { veilController?.index.identify(identify.dataset.veilIdentify); buildVeilScreen(); return; }
  const documentNode = node.closest('[data-veil-document]');
  if (documentNode) {
    const result = veilController?.document(documentNode.dataset.veilDocument);
    if (result?.ok) { ensureArchive().observeGhost(documentNode.dataset.veilDocument); saveArchiveProfile(); saveVeilProfile(); showToast('ENTITAS TERDOKUMENTASI', 1800); } else showToast('BUKTI BELUM LENGKAP', 1600);
    buildVeilScreen();
    return;
  }
  const master = node.closest('[data-veil-master]');
  if (master) { veilController?.master(master.dataset.veilMaster); saveVeilProfile(); buildVeilScreen(); return; }
  const lore = node.closest('[data-veil-lore]');
  if (lore) { veilController?.index.addLore(lore.dataset.veilLore, 1); saveVeilProfile(); buildVeilScreen(); return; }
  const page = node.closest('[data-veil-page]');
  if (page) { veilPage = Math.max(1, Number(page.dataset.veilPage) || 1); buildVeilScreen(); return; }
  const mission = node.closest('[data-veil-mission]');
  if (mission) { claimVeilMission(mission.dataset.veilMission); return; }
  const caseNode = node.closest('[data-veil-case]');
  if (caseNode && veilController) {
    veilController.save.investigation.activeCase = caseNode.dataset.veilCase;
    saveVeilProfile();
    buildVeilScreen();
    return;
  }
  const mind = node.closest('[data-veil-mind]');
  if (mind && veilController) {
    const result = veilController.progression.spendMind(mind.dataset.veilMind);
    if (result.ok) { veilController.sanity.applyMind(veilController.progression.mind.ranks); saveVeilProfile(); buildVeilScreen(); }
    else showToast(result.reason === 'points' ? 'POIN TIDAK CUKUP' : 'PRASYARAT BELUM TERPENUHI', 1800);
    return;
  }
  const npc = node.closest('[data-veil-npc]');
  if (npc) { const dialogue = veilNpcDialogue(npc.dataset.veilNpc); if (dialogue) showToast(`${dialogue.name}: ${dialogue.lines[0]}`, 3200); return; }
  const hub = node.closest('[data-veil-hub]');
  if (hub) { setVeilTab(hub.dataset.veilHub); return; }
  const action = node.closest('[data-veil-action]');
  if (!action) return;
  const kind = action.dataset.veilAction;
  if (kind === 'enter') {
    const controller = ensureVeil();
    const stage = VEIL_STAGES.find((s) => stageUnlocked(s.id, controller.save.campaign));
    if (stage) startVeilStage(stage.id);
  } else if (kind === 'save') { saveVeilProfile(); showToast('PROFIL TABIR TERSIMPAN', 1800); }
  else if (kind === 'recover') { if (veilController) { veilController.sanity.recover(24, 'events'); veilController.save.sanity.value = veilController.sanity.value; saveVeilProfile(); buildVeilScreen(); } }
  else if (kind === 'respec') { if (veilController) { veilController.progression.respec(); saveVeilProfile(); buildVeilScreen(); } }
  else if (kind === 'solve-case') { solveVeilCase(); }
});

document.addEventListener('input', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLElement) || !input.dataset) return;
  if (input.dataset.veilSearch !== undefined) {
    veilSearch = input.value;
    veilPage = 1;
    buildVeilScreen();
    const next = document.querySelector('[data-veil-search]');
    if (next) { next.focus(); next.value = veilSearch; }
    return;
  }
  if (input.dataset.veilSetting) {
    const value = input.dataset.veilType === 'toggle' ? input.checked : input.type === 'range' ? Number(input.value) : input.value;
    applyVeilSetting(input.dataset.veilSetting, value);
    if (input.dataset.veilType === 'toggle') {
      const row = input.closest('.veil-row');
      const badge = row ? row.querySelector('b') : null;
      if (badge) badge.textContent = input.checked ? 'AKTIF' : 'MATI';
    }
    return;
  }
  if (input.dataset.veilFilter) { veilFilter = { ...veilFilter, [input.dataset.veilFilter]: input.value }; veilPage = 1; buildVeilScreen(); }
});

document.addEventListener('change', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLElement) || !input.dataset) return;
  if (input.dataset.veilSort) { veilSort = input.value; buildVeilScreen(); }
  if (input.dataset.veilSetting) {
    applySettings();
    saveVeilProfile();
  }
});

document.addEventListener('click', (event) => {
  const node = event.target instanceof Element ? event.target : null;
  if (!node) return;
  if (node.closest('#btn-dread-menu') || node.closest('[data-scary-action="dread"]')) { openDread(); return; }
  if (node.closest('#btn-dread-close')) { closeDread(); return; }
  const tab = node.closest('[data-dread-tab]');
  if (tab) { dreadTab = tab.dataset.dreadTab; buildDreadScreen(); return; }
  const env = node.closest('[data-dread-enter]');
  if (env) { enterDread(env.dataset.dreadEnter); return; }
  const boss = node.closest('[data-dread-boss]');
  if (boss) { startDreadBoss(boss.dataset.dreadBoss); return; }
  const mode = node.closest('[data-dread-mode]');
  if (mode) { playDreadMode(mode.dataset.dreadMode); return; }
  const spawn = node.closest('[data-dread-spawn]');
  if (spawn) {
    if (menuView === 'none') game.spawnUnnatural(spawn.dataset.dreadSpawn, Math.max(80, game.player.x + 320));
    return;
  }
  const equip = node.closest('[data-dread-equip]');
  if (equip) { toggleDreadEquipment(equip.dataset.dreadEquip); return; }
  if (node.closest('[data-dread-connect]')) { connectDreadClues(); return; }
  const action = node.closest('[data-dread-action]');
  if (!action) return;
  if (action.dataset.dreadAction === 'ground') { dreadAwareness.ground(); buildDreadScreen(); }
  else if (action.dataset.dreadAction === 'reset') resetDreadSettings();
  else if (action.dataset.dreadAction === 'start') enterDread('forgotten_village');
});

document.addEventListener('input', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLElement) || !input.dataset || !input.dataset.dreadPath) return;
  let value = input.type === 'checkbox' ? input.checked : input.value;
  if (input.type === 'range') value = Number(value);
  setSettingsValue(settings, input.dataset.dreadPath, value);
  settings.dread = sanitizeDreadSettings(settings.dread || {});
  applySettings({ persist: false });
  syncDread();
  const output = input.parentElement ? input.parentElement.querySelector('output') : null;
  if (output) output.textContent = `${value}`;
  if (input.type === 'checkbox') {
    const span = input.nextElementSibling;
    if (span) span.textContent = input.checked ? 'AKTIF' : 'MATI';
  }
});

document.addEventListener('change', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLElement) || !input.dataset || !input.dataset.dreadPath) return;
  applySettings();
  syncDread();
  if (menuView === 'dread') buildDreadScreen();
});

function discoverCurrentRoom(index = game.roomIndex) {
  if (activeRunKind === 'hack') return;
  if (!Number.isInteger(index) || index < 0 || index >= ROOMS.length) return;
  const next = discoverRoom(progress.map, index, ROOMS.length);
  if (next !== progress.map) {
    progress.map = next;
    saveProgress();
  }
}

// ── character customization ──────────────────────────────────────────────
function defaultCharacter() {
  return { characterId: 'sera', ...DEFAULT_APPEARANCE };
}

function sanitizeCharacter(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const characterId = CHARACTERS[source.characterId] ? source.characterId : 'sera';
  const race = RACES[source.race] ? source.race : 'human';
  const armor = OUTFITS[source.armor] ? source.armor : 'medieval';
  return {
    characterId,
    race,
    armor,
    skin: SKIN_TONES.includes(source.skin) ? source.skin : RACES[race].skin,
    outfit: OUTFIT_COLORS.includes(source.outfit) ? source.outfit : OUTFITS[armor].color,
  };
}

function loadCharacter() {
  try {
    const raw = localStorage.getItem(CHARACTER_KEY);
    if (!raw) return defaultCharacter();
    return sanitizeCharacter(JSON.parse(raw));
  } catch {
    return defaultCharacter();
  }
}

let character = loadCharacter();

// ── Infinite Realms / Stage Access / Arc VI shell ──────────────────────────
let hackSnapshot = null;
let hackConfig = null;
let hackTeleportIndex = 0;
let playerSyncAt = 0;

function prepareSpecialStage(index, kind) {
  coopGuestMode = false;
  coopGuestRoom = -1;
  attempts = 1;
  activeRunKind = kind;
  activeCourtTrial = null;
  speedrunRun = null;
  speedrunSummaryOpen = false;
  activeFairyStage = -1;
  activeFairyBoss = null;
  labRun = null;
  labDirector = null;
  activeExpansionIndex = null;
  activeModeId = null;
  activeTrialId = null;
  game.labyrinth = false;
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  game.enterRoom(index);
  game.events.length = 0;
  started = true;
  paused = false;
  hunterShopOpen = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  showBanner(game.room.name, game.room.subtitle);
  syncScreens();
  updateHud();
}

function startHackStage(config) {
  if (!config || !Number.isInteger(config.roomId)) return;
  if (!hackSnapshot) hackSnapshot = JSON.parse(JSON.stringify(progress));
  hackConfig = { ...config };
  hackTeleportIndex = 0;
  prepareSpecialStage(config.roomId, 'hack');
  showToast(`HACK · ${game.room.name} — save terisolasi. Tidak ada progres yang ditulis.`, 2800);
}

function exitHackStage() {
  if (hackSnapshot) progress = hackSnapshot;
  hackSnapshot = null;
  hackConfig = null;
  started = false;
  paused = false;
  game.reset();
  game.events.length = 0;
  menuView = 'stage';
  clearHeldKeys();
  syncScreens();
}

function hackTool(action) {
  if (activeRunKind !== 'hack' || !started) return;
  if (action === 'restart' || action === 'enemies') {
    game.enterRoom(game.roomIndex);
    game.events.length = 0;
    showToast(action === 'restart' ? 'Stage di-restart.' : 'Encounter musuh di-reset.', 1400);
  } else if (action === 'phase') {
    const boss = game.boss;
    if (!boss) { showToast('Tidak ada boss di stage ini.', 1400); return; }
    const maxPhases = boss.maxPhases || boss.phaseThresholds?.length + 1 || 2;
    boss.phase = (boss.phase % maxPhases) + 1;
    const threshold = boss.phaseThresholds?.[boss.phase - 2];
    boss.hp = boss.phase === 1 ? boss.maxHp : Math.max(1, Math.round(boss.maxHp * (threshold ?? 0.5) - 1));
    boss.intro = 0;
    boss.state = boss.flying ? 'hover' : 'chase';
    showToast(`Boss phase ${boss.phase}/${maxPhases}.`, 1400);
  } else if (action === 'teleport') {
    const room = game.room || {};
    const points = [room.checkpoint, room.spawn, { x: WORLD_W - 160, y: (room.spawn?.y || 420) }].filter(Boolean);
    const point = points[hackTeleportIndex++ % points.length];
    game.player.x = point.x;
    game.player.y = point.y;
    game.player.vx = 0;
    game.player.vy = 0;
    showToast(`Teleport ke checkpoint ${hackTeleportIndex % points.length || points.length}/${points.length}.`, 1200);
  }
  updateHud();
}

function startEclipseStage(roomId) {
  const room = ECLIPSE_ROOM_BY_ID[roomId];
  if (!room) return;
  progress.eclipse = unlockEclipse(progress.eclipse);
  prepareSpecialStage(roomId, 'eclipse');
  activeEclipseRoom = roomId;
  activeGodfallFloor = 0;
  godfallRun = null;
  activeRaid = null;
  eclipseRunStartedAt = performance.now();
  game.player.relic = true;
  game.player.maxHp = Math.max(game.player.maxHp, 210);
  game.player.hp = game.player.maxHp;
  game.player.maxFlasks = Math.max(game.player.maxFlasks, 4);
  game.player.flasks = game.player.maxFlasks;
  game.player.weapons = [...new Set(['sword', ...ECLIPSE_WEAPONS.map((weapon) => weapon.id)])];
  game.player.weapon = ECLIPSE_CLASSES[character.characterId] ? 'halberd' : 'sword';
  game.ash = Math.max(game.ash, 420);
  saveProgress();
  showToast(`${ECLIPSE_LOCAL_NAME} · ${game.room.name}`, 2600);
}

function startEclipseGodfall(floor, { practice = false } = {}) {
  const safeFloor = clamp(Math.floor(Number(floor) || 1), 1, GODFALL_FLOOR_COUNT);
  progress.godfall = sanitizeGodfallProgress(progress.godfall);
  godfallRun = createGodfallRun({ startFloor: safeFloor, seed: performance.now() | 0, practice });
  prepareSpecialStage(GODFALL_ROOM_START + safeFloor - 1, 'godfall');
  activeGodfallFloor = safeFloor;
  activeEclipseRoom = null;
  activeRaid = null;
  game.player.relic = true;
  game.player.maxHp = Math.max(game.player.maxHp, 230);
  game.player.hp = game.player.maxHp;
  game.player.maxFlasks = Math.max(game.player.maxFlasks, 5);
  game.player.flasks = game.player.maxFlasks;
  game.player.weapons = [...new Set(['sword', ...ECLIPSE_WEAPONS.map((weapon) => weapon.id)])];
  game.ash = Math.max(game.ash, 500);
  if (!practice) saveProgress();
  showToast(`GODFALL · Lantai ${safeFloor}${practice ? ' · PRACTICE' : ''}`, 2200);
}

function startEclipseRaid(encounterId, { practice = false } = {}) {
  const raid = RAID_BY_ID[encounterId];
  if (!raid) return;
  const bossRoom = encounterId === 'forgotten_high_god' ? ECLIPSE_BOSS_BY_ID.forgotten_high_god.roomIndex : ECLIPSE_BOSS_BY_ID[encounterId === 'worldroot_colossus' ? 'obsidian_king' : 'first_chronomancer'].roomIndex;
  activeRaid = createRaidRun(encounterId, { practice, players: [{ id: 'local', name: CHARACTERS[character.characterId]?.name || 'Warden', role: 'dps' }] });
  prepareSpecialStage(bossRoom, 'raid');
  activeEclipseRoom = bossRoom;
  activeGodfallFloor = 0;
  godfallRun = null;
  if (game.boss) {
    game.boss.maxHp = raid.maxHp;
    game.boss.hp = raid.maxHp;
    game.boss.maxPhases = raid.phases;
    game.boss.phaseThresholds = raid.phases === 4 ? [0.75, 0.5, 0.25] : raid.phases === 3 ? [0.66, 0.33] : [0.5];
    game.boss.name = raid.name;
    game.boss.raid = true;
  }
  game.player.relic = true;
  game.player.maxHp = Math.max(game.player.maxHp, 250);
  game.player.hp = game.player.maxHp;
  game.player.flasks = game.player.maxFlasks;
  game.player.weapons = [...new Set(['sword', ...ECLIPSE_WEAPONS.map((weapon) => weapon.id)])];
  showToast(`RAID · ${raid.localName}${practice ? ' · PRACTICE' : ''}`, 2400);
}

function startAstralStage(roomId) {
  progress.astral = sanitizeAstralProgress(progress.astral);
  progress.astral.unlocked = true;
  progress.astral.arcId = 'astral';
  prepareSpecialStage(roomId, 'astral');
  game.player.relic = true;
  game.player.maxHp = Math.max(game.player.maxHp, 220);
  game.player.hp = game.player.maxHp;
  game.player.maxFlasks = Math.max(game.player.maxFlasks, 4);
  game.player.flasks = game.player.maxFlasks;
  game.ash = Math.max(game.ash, 260);
  saveProgress();
  showToast(`${ASTRAL_LOCAL_NAME} · ${game.room.name}`, 2400);
}

const eclipseUI = new EclipseUI({
  getProgress: () => progress,
  saveProgress: () => saveProgress(),
  toast: (message, duration) => showToast(message, duration),
  playerName: () => CHARACTERS[character.characterId]?.name || 'Penjaga',
  classIds: () => Object.keys(CHARACTERS),
  classMeta: (id) => CHARACTERS[id],
  getSettings: () => settings,
  performance: () => framePerf.summary(),
  runtimeErrors: () => runtimeReporter.summary(),
  onMenu: () => showMenu(),
  onOpen: () => {
    menuView = 'eclipse';
    started = false;
    paused = false;
    shopOpen = false;
    mapOpen = false;
    codexOpen = false;
    inventoryOpen = false;
    settingsOpen = false;
    closeDialogue(true);
    clearHeldKeys();
    syncScreens();
  },
  onPlayEclipse: (roomId) => startEclipseStage(roomId),
  onPlayGodfall: (floor, options) => startEclipseGodfall(floor, options),
  onStartRaid: (raidId, options) => startEclipseRaid(raidId, options),
  onApplySettings: ({ gameplay }) => {
    settings = { ...settings, gameplay: { ...settings.gameplay, ...gameplay } };
    // Graphics presets write the legacy gameplay fields. Mirror them into the
    // Settings 2.0 fields so applySettings() and the save sanitizer cannot
    // immediately snap the preset and frame cap back to their old values.
    const graphics = { ...settings.graphics };
    if (gameplay.frameCap !== undefined) graphics.frameRateLimit = gameplay.frameCap;
    if (gameplay.graphicsPreset) graphics.preset = gameplay.graphicsPreset;
    if (gameplay.resolutionScale !== undefined) {
      graphics.renderScale = Math.max(50, Math.min(200, Math.round(Number(gameplay.resolutionScale) * 100)));
    }
    settings = { ...settings, graphics };
    applySettings();
    buildSettings();
  },
});

function showEclipse(tab = 'campaign') {
  eclipseUI.show(tab);
}

const realmsUI = new RealmsUI({
  getProgress: () => progress,
  saveProgress: () => saveProgress(),
  character: () => character,
  playerName: () => CHARACTERS[character.characterId]?.name || 'Penjaga',
  toast: (message, duration) => showToast(message, duration),
  onMenu: () => showMenu(),
  onCoop: () => showCoop(),
  onOpenMenu: (view) => {
    menuView = view;
    started = false;
    paused = false;
    shopOpen = false;
    mapOpen = false;
    codexOpen = false;
    inventoryOpen = false;
    settingsOpen = false;
    closeDialogue(true);
    clearHeldKeys();
    syncScreens();
  },
  onHackStage: (config) => startHackStage(config),
  onExitHack: () => exitHackStage(),
  onHackTool: (action) => hackTool(action),
  onPlayAstral: (roomId) => startAstralStage(roomId),
  getGame: () => game,
  getCameraX: () => clamp(game.player.x - 360, 0, Math.max(0, WORLD_W - VIEW_W)),
});
realmsUI.runDifficulty = 'normal';

function saveCharacter() {
  try {
    localStorage.setItem(CHARACTER_KEY, JSON.stringify(character));
  } catch {
    /* storage unavailable - keep in memory */
  }
}

function setCharacter(next) {
  character = sanitizeCharacter({ ...character, ...next });
  saveCharacter();
  applyCharacterToGame();
  if (renderer && typeof renderer.triggerPreviewSparkle === 'function') {
    renderer.triggerPreviewSparkle(36);
  }
  audio.play('sparkle');
  if (menuView === 'character') buildCharacterScreen();
}

function applyCharacterToGame() {
  game.applyCharacter(character.characterId);
  game.applySkillBonuses(skillBonuses(progress.skills));
  game.setAppearance({
    race: character.race,
    skin: character.skin,
    outfit: character.outfit,
    armor: character.armor,
  });
  const plate = document.querySelector('#hud .char-name');
  if (plate) plate.textContent = CHARACTERS[character.characterId]?.name || 'The Oathbound';
}

let activeStage = null;

function beginStage(index, label) {
  if (!Number.isInteger(index) || index < 0) return;
  const rune = secretSpotFor(activeRunKind, index);
  game.secretRune = rune && !hasSecret(secretsState, rune.id) ? { ...rune } : null;
  activeStage = {
    key: `${activeRunKind}:${index}`,
    index,
    label: label || game.room?.name || `Stage ${index + 1}`,
    startedAt: game.time,
    recorded: false,
  };
}

function recordStageTime(index, label = '') {
  if (!activeStage || activeStage.index !== index || activeStage.recorded) return false;
  const seconds = Math.max(0, Math.round((game.time - activeStage.startedAt) * 10) / 10);
  const key = activeStage.key;
  const entry = progress.stageTimes[key] || { label: label || activeStage.label, best: 0, last: 0, clears: 0 };
  entry.label = label || activeStage.label;
  entry.last = seconds;
  entry.best = entry.best > 0 ? Math.min(entry.best, seconds) : seconds;
  entry.clears = (entry.clears || 0) + 1;
  progress.stageTimes[key] = entry;
  activeStage.recorded = true;
  saveProgress();
  return true;
}

function renderStageTimes(targetId, runKind = 'legacy') {
  const el = $(targetId);
  if (!el) return;
  const prefix = `${runKind}:`;
  const entries = Object.entries(progress.stageTimes || {})
    .filter(([key]) => key.startsWith(prefix))
    .sort(([a], [b]) => Number(a.slice(prefix.length)) - Number(b.slice(prefix.length)));
  if (!entries.length) {
    el.innerHTML = '<h3>WAKTU PER STAGE</h3><p class="micro">Belum ada stage yang tercatat.</p>';
    return;
  }
  el.innerHTML = `
    <h3>WAKTU PER STAGE · ${runKind.toUpperCase()}</h3>
    <div class="run-time-grid">
      ${entries.map(([, entry]) => `
        <div class="run-time-card">
          <span>${esc(entry.label)}</span>
          <b>${formatTime(entry.best)}${entry.last !== entry.best ? ` <em>last ${formatTime(entry.last)}</em>` : ''}</b>
        </div>`).join('')}
    </div>`;
}

function updateLiveClock() {
  const clock = $('live-clock');
  if (!clock) return;
  const now = new Date();
  $('live-clock-time').textContent = now.toLocaleTimeString('id-ID', { hour12: false }).replace(/\./g, ':');
  const stage = $('live-clock-stage');
  const inRun = started && !spectating && menuView === 'none';
  if (inRun && activeStage) {
    stage.textContent = `STAGE ${formatTime(game.time - activeStage.startedAt)} · ${activeStage.label.toUpperCase()}`;
  } else {
    stage.textContent = 'DI LUAR RUN';
  }
}

function markCleared(index, nextIndex = null) {
  if (!Number.isInteger(index) || index < 0 || index >= ROOMS.length) return;
  let changed = false;
  if (!progress.cleared[index]) {
    progress.cleared[index] = true;
    changed = true;
  }
  let nextUnlocked = Math.min(ROOMS.length, index + 2);
  if (Number.isInteger(nextIndex) && nextIndex >= 0 && nextIndex < ROOMS.length) {
    nextUnlocked = Math.max(nextUnlocked, nextIndex + 1);
  }
  if (nextUnlocked > progress.unlocked) {
    progress.unlocked = nextUnlocked;
    changed = true;
  }
  if (changed) {
    saveProgress();
    updateMenuProgress();
    if (menuView === 'levels') buildLevelCards();
  }
  discoverCurrentRoom(index);
}

function updateMenuProgress() {
  const clearedCount = progress.cleared.filter(Boolean).length;
  $('menu-progress').textContent = `LEVEL TERBUKA ${progress.unlocked} / ${ROOMS.length} · ${clearedCount} TUNTAS`;
  const expansion = $('menu-expansion-progress');
  if (expansion) {
    const summary = expansionCompletion(expState());
    expansion.textContent = `ECHOES · ${summary.cleared}/${summary.total} LEVEL · BAB ${(expState().unlockedChapter || 0) + 1}/10 · ${expState().echoes} GEMA`;
  }
  const fallenButton = $('btn-fallen-menu');
  if (fallenButton) {
    const ascended = fallenIsAscended(progress);
    fallenButton.classList.toggle('hidden', !ascended);
    if (ascended) {
      const arc = fallenSummary(fallenState());
      $('fallen-menu-progress').textContent = `${FALLEN_LOCAL_NAME.toUpperCase()} · ${arc.regionsCleared}/${arc.regionTotal} WILAYAH · ${arc.bossesCleared}/${arc.bossTotal} BOS · ${arc.shards} SERPIHAN`;
    }
  }
  const crusadeButton = $('btn-crusade-menu');
  if (crusadeButton) {
    const open = crusadeUnlocked(progress);
    crusadeButton.classList.toggle('hidden', !open);
    const progressLine = $('crusade-menu-progress');
    if (progressLine) progressLine.classList.toggle('hidden', !open);
    if (open) {
      const war = crusadeSummary(crusadeState());
      if (progressLine) progressLine.textContent = `${CRUSADE_LOCAL_NAME.toUpperCase()} · ${war.levelsCleared}/${war.levelTotal} TINGKAT · ${war.bossesCleared}/${war.bossTotal} BOS · ${war.sigils} SIGIL`;
      const link = $('btn-fallen-crusade');
      if (link) link.classList.remove('hidden');
    }
  }
  const riftButton = $('btn-rift-menu');
  if (riftButton) {
    riftButton.classList.toggle('hidden', !riftUnlocked(progress));
  }
}

// ── expansion progression ────────────────────────────────────────────────
const CHAPTER_COMPLETION_SKINS = {
  2: 'skin_first_echo',
  4: 'skin_glass_queen',
  5: 'skin_storm_sovereign',
  6: 'skin_root_mother',
  7: 'skin_mist_sovereign',
  9: 'skin_forgotten',
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function expState() {
  if (!progress.expansion) progress.expansion = defaultExpansionProgress();
  return progress.expansion;
}

function atlasState() {
  if (!progress.atlas) progress.atlas = defaultAtlasProgress();
  return progress.atlas;
}

function syncExpansionUnlocks() {
  const e = expState();
  e.unlockedChapter = clamp(Math.floor(Number(e.unlockedChapter) || 0), 0, CHAPTERS.length - 1);
  for (const settlement of SETTLEMENTS) {
    if (!e.settlements[settlement.id]) {
      e.settlements[settlement.id] = {
        unlocked: settlement.chapter === 0,
        tier: 0,
        upgrades: Object.fromEntries(HAVEN_UPGRADES.map((upgrade) => [upgrade.id, 0])),
        visited: false,
      };
    }
    if (settlement.chapter <= e.unlockedChapter) e.settlements[settlement.id].unlocked = true;
  }
  return e;
}

function havenTier(e = expState()) {
  const haven = e.settlements?.thornveil;
  if (!haven) return 0;
  const total = HAVEN_UPGRADES.reduce(
    (sum, upgrade) => sum + (Number(haven.upgrades?.[upgrade.id]) || 0),
    0,
  );
  return total <= 0 ? 0 : total <= 5 ? 1 : total <= 13 ? 2 : 3;
}

function grantSkin(id) {
  if (!SKIN_BY_ID[id]) return false;
  const e = expState();
  if (!Array.isArray(e.cosmetics)) e.cosmetics = [];
  if (e.cosmetics.includes(id)) return false;
  e.cosmetics.push(id);
  return true;
}

function applySkinToGame() {
  const e = expState();
  game.activeSkin = e.selectedSkin && SKIN_BY_ID[e.selectedSkin] ? SKIN_BY_ID[e.selectedSkin] : null;
}

function expansionChallengeConfig() {
  const e = expState();
  let modifiers = Array.isArray(e.modifiers) ? [...e.modifiers] : [];
  let ngPlus = Math.max(0, Number(e.ngPlus) || 0);
  if (activeModeId && MODE_BY_ID[activeModeId]?.modifiers?.length) {
    modifiers = [...MODE_BY_ID[activeModeId].modifiers];
  }
  if (activeTrialId === 'trial_name') {
    modifiers = CHALLENGE_MODIFIERS.map((modifier) => modifier.id);
    ngPlus = 4;
  } else if (activeTrialId === 'trial_echo') {
    modifiers = ['glass_blade', 'hunter'];
    ngPlus = Math.max(ngPlus, 2);
  } else if (activeTrialId === 'trial_memory') {
    modifiers = ['blind', 'hunter'];
  } else if (activeTrialId === 'trial_thornveil') {
    modifiers = ['iron_skin', 'hunter'];
  }
  return {
    difficulty: e.difficulty,
    modifiers,
    ngPlus,
    bonus: havenBonus(e),
  };
}

function provisionExpansionAsh(localIndex) {
  const level = EXPANSION_LEVELS[localIndex];
  if (!level) return;
  const stipend = 45 + level.chapterIndex * 35 + (level.kind === 'boss' ? 40 : level.kind === 'elite' ? 25 : 0);
  game.ash = Math.max(game.ash, stipend);
}

function transferExpansionStash() {
  const e = expState();
  if (!e.stash || typeof e.stash !== 'object') return;
  let transferred = 0;
  for (const [id, count] of Object.entries(e.stash)) {
    const n = Math.floor(Number(count) || 0);
    if (n <= 0) continue;
    if (!SHOP_ITEMS.some((item) => item.id === id)) continue;
    game.player.consumables[id] = (game.player.consumables[id] || 0) + n;
    transferred += n;
  }
  if (transferred > 0) {
    e.stash = {};
    saveProgress();
    showToast(`Persediaan Thornveil dibawa: ${transferred} item.`, 2200);
  }
}

function startExpansionLevel(localIndex, options = {}) {
  const level = EXPANSION_LEVELS[localIndex];
  if (!level) return;
  audio.init();
  attempts = 1;
  activeRunKind = 'expansion';
  activeExpansionIndex = localIndex;
  activeModeId = options.modeId || null;
  activeTrialId = options.trialId || null;
  modeRunRewarded = false;
  game.reset();
  applyCharacterToGame();
  game.setChallenge(expansionChallengeConfig());
  game.setKnownCollectibles(expState().collectibles);
  applySkinToGame();
  transferExpansionStash();
  game.enterRoom(EXPANSION_ROOM_START + localIndex);
  game.player.relic = true;
  provisionExpansionAsh(localIndex);
  game.events.length = 0;
  started = true;
  paused = false;
  hunterShopOpen = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  beginStage(game.roomIndex, level.name);
  showBanner(level.name, level.subtitle);
  syncScreens();
  updateHud();
  const mode = activeModeId ? MODE_BY_ID[activeModeId] : null;
  if (mode) showToast(`Mode ${mode.name} — ${mode.duration}`, 2800);
  else if (activeTrialId) {
    const trial = ENDGAME_TRIALS.find((entry) => entry.id === activeTrialId);
    if (trial) showToast(`Ujian: ${trial.name}`, 3000);
  } else {
    showToast(`Bab ${level.chapterNumeral} · ${level.chapterLevel}/10 — ${level.kind.toUpperCase()}`, 2200);
  }
}

// ── Atlas runs, quick slots, and consumables ───────────────────────
function startAtlasRoom(roomIndex) {
  const room = ATLAS_ROOM_BY_ID[roomIndex];
  if (!room) return;
  const p = atlasState();
  const zone = ATLAS_ZONE_BY_ID[room.atlasZone];
  if (!zone || !atlasRoomAvailable(roomIndex)) {
    showToast('Ruang itu masih terkunci. Selesaikan ruang sebelumnya dulu.', 2200);
    return;
  }
  const missing = atlasMissingAbilities(zone.id);
  if (missing.length) {
    showToast(`Gerbang ${zone.localName} butuh: ${missing.map((id) => ATLAS_ABILITY_BY_ID[id]?.localName || id).join(', ')}.`, 2800);
    return;
  }
  audio.init();
  attempts = 1;
  activeRunKind = 'atlas';
  activeAtlasRoom = roomIndex;
  activeExpansionIndex = null;
  activeModeId = null;
  activeTrialId = null;
  modeRunRewarded = false;
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  game.atlasRun = true;
  game.setAbilities(p.abilities || []);
  game.enterRoom(roomIndex);
  game.player.relic = true;
  applyAtlasLoadout(game, p);
  game.ash = Math.max(game.ash, 40 + room.atlasLocal * 4);
  atlasQuickCooldown = 0;
  atlasBuffBase = null;
  atlasBuffTimer = 0;
  atlasRegenTimer = 0;
  atlasRegenAmount = 0;
  game.events.length = 0;
  started = true;
  paused = false;
  hunterShopOpen = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  atlasQuickCache = '';
  renderAtlasQuickbar();
  beginStage(game.roomIndex, room.name);
  showBanner(room.name, `${zone.localName} · ${ATLAS_TEMPLATE_LABEL[room.atlasTemplate] || room.atlasTemplate}`);
  syncScreens();
  updateHud();
  showToast(`Atlas · ${zone.localName} — ruang ${room.atlasLocal + 1}/30`, 2200);
}

function atlasEndingFor(p, zoneId = 'foundry') {
  const completion = loreCompletion(p);
  const allAbilities = (p.abilities || []).length >= ATLAS_ABILITY_GATES.length;
  const bosses = new Set([...Object.keys(p.zoneBosses || {}), zoneId]);
  const allBosses = bosses.size >= ATLAS_ZONES.length;
  const anyLore = completion.revealed > 0;
  const allLore = completion.categories.every((category) => category.done);
  if (allAbilities) return 'ending_rule';
  if (allLore) return 'ending_mend';
  if (allBosses) return 'ending_break';
  if (!anyLore) return 'ending_erase';
  return 'ending_mend';
}

function grantAtlasZoneGear(zoneId) {
  const p = atlasState();
  const zone = ATLAS_ZONE_BY_ID[zoneId];
  if (!zone) return;
  const granted = [];
  const armor = ATLAS_ARMOR_SETS.find((item) => item.zone === zoneId);
  if (armor && !(p.ownedArmor || []).includes(armor.id)) {
    if (!Array.isArray(p.ownedArmor)) p.ownedArmor = [];
    p.ownedArmor.push(armor.id);
    granted.push(armor.localName);
  }
  const charm = ATLAS_CHARMS[zone.index];
  if (charm && !(p.ownedCharms || []).includes(charm.id)) {
    if (!Array.isArray(p.ownedCharms)) p.ownedCharms = [];
    p.ownedCharms.push(charm.id);
    granted.push(charm.localName);
  }
  const weapon = ATLAS_WEAPONS.find((item) => item.zone === zoneId);
  if (weapon && !(p.ownedWeapons || []).includes(weapon.id)) {
    if (!Array.isArray(p.ownedWeapons)) p.ownedWeapons = [];
    p.ownedWeapons.push(weapon.id);
    granted.push(weapon.localName);
  }
  if (granted.length) showToast(`Hadiah zona: ${granted.join(' · ')}`, 3400);
}

function handleAtlasBoss(ev) {
  const room = ATLAS_ROOM_BY_ID[ev.room];
  if (!room) return;
  const p = atlasState();
  const finalBoss = room.atlasTemplate === 'boss' && ATLAS_ZONE_BY_ID[room.atlasZone]?.index === ATLAS_ZONES.length - 1;
  const result = completeAtlasRoom(p, room.id, {
    ending: finalBoss ? atlasEndingFor(p, room.atlasZone) : null,
  });
  if (result.firstClear) {
    showToast(`Ruang Atlas tuntas · +✦ ${result.marks} · +${result.fragments} fragmen`, 2400);
  }
  if (room.atlasTemplate === 'boss') grantAtlasZoneGear(room.atlasZone);
  if (result.ability) {
    const ability = ATLAS_ABILITY_BY_ID[result.ability];
    showToast(`Kemampuan baru: ${ability?.localName || result.ability}.`, 3200);
  }
  if (result.unlocked.length) {
    const names = result.unlocked.map((id) => ATLAS_ZONE_BY_ID[id]?.localName || id);
    showToast(`Zona terbuka: ${names.join(', ')}.`, 3200);
  }
  if (result.ending) {
    const ending = ATLAS_ENDINGS.find((entry) => entry.id === result.ending);
    showToast(`Akhiran tercatat: ${ending?.localName || result.ending}.`, 4200);
  }
  saveProgress();
  atlasQuickCache = '';
  if (menuView === 'atlas') buildAtlasScreen();
}

// ── Hearthfall: The Hollow Court ─────────────────────────────────────────
const COURT_TEMPLATE_GLYPH = {
  entry: '◈', combat: '◆', elite: '✹', puzzle: '✧', rest: '⌂', boss: '♛',
};
function courtState() {
  if (!progress.court) progress.court = defaultCourtProgress();
  return progress.court;
}

function courtBonusLines(bonus) {
  const lines = [];
  if (bonus.maxHp) lines.push(`+${bonus.maxHp} HP`);
  if (bonus.flasks) lines.push(`+${bonus.flasks} flask`);
  if (bonus.damage) lines.push(`+${Math.round(bonus.damage * 100)}% damage`);
  if (bonus.speed) lines.push(`+${Math.round(bonus.speed * 100)}% kecepatan`);
  if (bonus.gain) lines.push(`+${Math.round(bonus.gain * 100)}% abu`);
  if (bonus.heal) lines.push(`+${Math.round(bonus.heal * 100)}% penyembuhan`);
  return lines;
}

function formatCourtTime(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(value / 60);
  const rest = value - minutes * 60;
  return `${minutes}:${rest.toFixed(1).padStart(4, '0')}`;
}

function courtTrialSection(p) {
  const result = courtTrialResult;
  return `
    <section class="exp-section court-trial-section">
      <div class="exp-section-head">
        <h3>TANTANGAN PERAPIAN</h3>
        <span>${p.stats.trialClears} kemenangan · rekor waktu tersimpan</span>
      </div>
      ${result ? `
        <div class="court-trial-result" style="--trial-color:${result.trial.color}">
          <span>${result.trial.glyph}</span>
          <div>
            <b>${esc(result.trial.name)} tuntas</b>
            <em>Waktu ${formatCourtTime(result.seconds)}${result.isBest ? ' · REKOR BARU' : ''} · ${result.firstClear ? `+✦ ${result.marks}` : `+✦ ${result.marks} (ulangan)`}</em>
          </div>
        </div>` : ''}
      <div class="court-trial-grid">
        ${COURT_TRIALS.map((trial) => {
          const state = p.trials[trial.id] || { clears: 0, bestTime: 0 };
          const unlocked = courtTrialUnlocked(p, trial.id);
          return `
            <article class="court-trial-card${unlocked ? '' : ' locked'}" style="--trial-color:${trial.color}">
              <span class="court-trial-glyph">${trial.glyph}</span>
              <div class="court-trial-copy">
                <h4>${esc(trial.name)}</h4>
                <em>${esc(trial.subtitle)}</em>
                <p>${esc(trial.desc)}</p>
                <div class="court-boss-meta">
                  <span>KEMENANGAN <b>${state.clears}</b></span>
                  <span>TERBAIK <b>${state.bestTime ? formatCourtTime(state.bestTime) : '—'}</b></span>
                </div>
              </div>
              <button class="btn ${unlocked ? 'btn-primary' : 'btn-ghost'} btn-compact" type="button"
                data-action="start-trial" data-trial="${trial.id}" ${unlocked ? '' : 'disabled'}>
                ${unlocked ? 'MULAI' : trial.requires === 'completion' ? 'TUNTASKAN COURT' : 'KALAHKAN BOS KACA'}
              </button>
            </article>`;
        }).join('')}
      </div>
      <div class="court-ngplus">
        <div>
          <span>SUMPAH BERULANG</span>
          <strong>+${p.ngPlus} / +${COURT_NG_PLUS_MAX}</strong>
          <em>${p.completion ? `HP & damage musuh +${p.ngPlus * 20}%. Hadiah tanda +${p.ngPlus * 40} pada kemenangan pertama.` : 'Selesaikan The Hollow Court untuk membuka NG+.'}</em>
        </div>
        <div class="court-ngplus-actions">
          <button class="btn btn-ghost btn-compact" type="button" data-action="ngplus" data-value="-1" ${p.completion && p.ngPlus > 0 ? '' : 'disabled'}>−</button>
          <button class="btn btn-ghost btn-compact" type="button" data-action="ngplus" data-value="1" ${p.completion && p.ngPlus < COURT_NG_PLUS_MAX ? '' : 'disabled'}>+</button>
        </div>
      </div>
    </section>
  `;
}

function showCourt(tab = 'journey') {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'court';
  courtTab = tab;
  const p = courtState();
  syncCourtUnlocks(p);
  if (!COURT_ZONE_IDS.includes(courtZoneId)) courtZoneId = COURT_ZONE_IDS[0];
  if (!HOUSE_RESIDENT_BY_ID[courtResidentId]) courtResidentId = HOUSE_RESIDENTS[0].id;
  courtTalkLine = '';
  clearHeldKeys();
  buildCourtScreen();
  syncScreens();
}

function closeCourt() {
  showMenu();
}

function buildCourtScreen() {
  const wrap = $('court-body');
  if (!wrap) return;
  const p = courtState();
  syncCourtUnlocks(p);
  const stats = courtStats(p);
  const summary = $('court-summary');
  if (summary) {
    summary.innerHTML = `
      <div><span>RUANG TUNTAS</span><strong>${stats.cleared} / ${stats.total}</strong><em>${stats.percent}% Hearthfall</em></div>
      <div><span>TANDA PERAPIAN</span><strong>✦ ${stats.marks}</strong><em>mata uang court</em></div>
      <div><span>SENJATA &amp; ALAT</span><strong>${stats.weapons} / ${stats.totalWeapons} · ${stats.tools} / ${stats.totalTools}</strong><em>ditempa</em></div>
      <div><span>RUMAH</span><strong>Lv ${stats.rooms} / ${stats.maxRoomLevels}</strong><em>${stats.warmth} kehangatan</em></div>
      <div><span>PENGHUNI</span><strong>${stats.residents} / ${stats.totalResidents}</strong><em>tinggal di perapian</em></div>
      <div><span>ZONA</span><strong>${stats.zones} / ${stats.totalZones}</strong><em>${stats.bosses} bos gugur</em></div>
    `;
  }
  document.querySelectorAll('#court-tabs [data-court-tab]').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.courtTab === courtTab);
  });
  if (courtTab === 'house') buildCourtHouseTab(wrap);
  else if (courtTab === 'residents') buildCourtResidentsTab(wrap);
  else if (courtTab === 'arsenal') buildCourtArsenalTab(wrap);
  else buildCourtJourneyTab(wrap);
}

function buildCourtJourneyTab(wrap) {
  const p = courtState();
  wrap.innerHTML = `
    ${courtTrialSection(p)}
    ${packSection()}
    <section class="exp-section">
      <div class="exp-section-head">
        <h3>LIMA ZONA PERAPIAN</h3>
        <span>${COURT_ROOMS.length} ruang · ${Object.keys(COURT_BOSS_INFO).length} bos · progres per ruang tersimpan</span>
      </div>
      <div class="court-zone-grid">
        ${COURT_ZONES.map((zone) => {
          const cleared = courtZoneCleared(p, zone.id);
          const unlocked = p.zoneUnlocked.includes(zone.id);
          const boss = COURT_BOSS_INFO[zone.boss];
          const mini = COURT_BOSS_INFO[zone.miniBoss];
          return `
            <article class="court-zone-card${unlocked ? '' : ' locked'}" style="--zone-color:${zone.color}">
              <header>
                <div>
                  <h3>${esc(zone.name)}</h3>
                  <span>${esc(zone.localName)} · ${esc(zone.subtitle)}</span>
                </div>
                <b>${cleared} / ${COURT_ROOMS_PER_ZONE}</b>
              </header>
              <p>${esc(zone.hero)}</p>
              <div class="court-zone-bosses">
                <span>ELITE <b>${esc(mini?.name || '—')}</b></span>
                <span>BOS <b>${esc(boss?.name || '—')}</b></span>
              </div>
              <div class="court-room-grid">
                ${Array.from({ length: COURT_ROOMS_PER_ZONE }, (_, local) => {
                  const index = zone.index * COURT_ROOMS_PER_ZONE + local;
                  const room = COURT_ROOMS[index];
                  const status = courtLevelStatus(p, index);
                  return `
                    <button class="court-room ${status}" type="button"
                      data-action="start-room" data-room="${index}" ${status === 'locked' ? 'disabled' : ''}
                      title="${esc(room.name)}">
                      <span>${COURT_TEMPLATE_GLYPH[room.courtTemplate] || '◆'}</span>
                      <b>${local + 1}</b>
                      <em>${status === 'cleared' ? 'TUNTAS' : status === 'available' ? 'MASUK' : 'TERKUNCI'}</em>
                    </button>`;
                }).join('')}
              </div>
              <footer class="court-zone-foot">
                <span>${esc(zone.weather)}</span>
                <em>${unlocked ? 'ZONA TERBUKA' : 'KALAHKAN BOS ZONA SEBELUMNYA'}</em>
              </footer>
            </article>`;
        }).join('')}
      </div>
    </section>
    <section class="exp-section">
      <div class="exp-section-head"><h3>SEPULUH PENJAGA COURT</h3><span>HP · 3–4 fase · pola serangan</span></div>
      <div class="court-boss-grid">
        ${Object.values(COURT_BOSS_INFO).map((boss) => `
          <article class="court-boss-card" style="--boss-color:${boss.color}">
            <span class="court-boss-glyph">${boss.glyph}</span>
            <div>
              <h4>${esc(boss.name)}</h4>
              <em>${esc(boss.title)}</em>
              <p>${esc(boss.localName)} · ${boss.mini ? 'MINI-BOS' : 'BOS ZONA'}</p>
              <div class="court-boss-meta">
                <span>HP <b>${boss.maxHp}</b></span>
                <span>FASE <b>${boss.maxPhases}</b></span>
                <span>POLA <b>${boss.pattern.toUpperCase()}</b></span>
              </div>
            </div>
          </article>`).join('')}
      </div>
    </section>
  `;
}

function buildCourtHouseTab(wrap) {
  const p = courtState();
  const bonus = courtBonuses(p);
  const warmth = houseWarmth(p);
  const lines = courtBonusLines(bonus);
  wrap.innerHTML = `
    <section class="exp-section">
      <div class="exp-section-head"><h3>PERAPIAN YANG KAU BANGUN</h3><span>Kehangatan ${warmth} · ${p.house.furnishings.length} / ${HOUSE_FURNISHINGS.length} perabot</span></div>
      <div class="court-bonus-strip">
        ${lines.length ? lines.map((line) => `<span>${line}</span>`).join('') : '<span>Belum ada bonus rumah. Tingkatkan ruangan.</span>'}
      </div>
      <div class="court-house-grid">
        ${HOUSE_ROOMS.map((room) => {
          const level = p.house.rooms[room.id] || 0;
          const maxed = level >= room.maxLevel;
          const cost = room.costs[Math.min(level + 1, room.costs.length - 1)];
          return `
            <article class="court-house-card" style="--room-color:${room.color}">
              <header><span>${room.glyph}</span><div><h4>${esc(room.name)}</h4><em>${esc(room.desc)}</em></div></header>
              <div class="court-level-pips">${Array.from({ length: room.maxLevel }, (_, i) => `<i class="${i < level ? 'on' : ''}"></i>`).join('')}</div>
              <div class="court-room-actions">
                <span>Lv ${level} / ${room.maxLevel}</span>
                <button class="btn btn-ghost btn-compact" type="button" data-action="upgrade-room" data-room-id="${room.id}" ${maxed ? 'disabled' : ''}>
                  ${maxed ? 'MAKSIMAL' : `↑ ${cost} ✦`}
                </button>
              </div>
              <div class="court-furnishings">
                ${HOUSE_FURNISHINGS.filter((item) => item.room === room.id).map((item) => {
                  const owned = p.house.furnishings.includes(item.id);
                  return `<button class="court-furnishing${owned ? ' owned' : ''}" type="button"
                    data-action="buy-furnishing" data-furnishing="${item.id}" ${owned || level < 1 ? 'disabled' : ''}
                    title="${esc(item.desc)}">${owned ? '✓' : '＋'} ${esc(item.name)} <em>${item.cost}✦</em></button>`;
                }).join('')}
              </div>
              ${level < 1 ? '<p class="micro">Naikkan ruangan ke Lv 1 untuk memasang perabot.</p>' : ''}
            </article>`;
        }).join('')}
      </div>
    </section>
  `;
}

function buildCourtResidentsTab(wrap) {
  const p = courtState();
  const resident = HOUSE_RESIDENT_BY_ID[courtResidentId] || HOUSE_RESIDENTS[0];
  const state = p.residents[resident.id];
  const unlocked = residentUnlocked(p, resident.id);
  const saved = residentDialogue(p, resident.id, new Date().getDate());
  const line = courtTalkLine || (unlocked ? saved.line : 'Penghuni ini belum percaya padamu.');
  const quest = resident.quest;
  const step = quest.steps[state.questStep] || null;
  const reward = quest.reward;
  wrap.innerHTML = `
    <section class="exp-section">
      <div class="exp-section-head"><h3>PENGHUNI PERAPIAN</h3><span>${HOUSE_RESIDENTS.filter((entry) => residentUnlocked(p, entry.id)).length} / ${HOUSE_RESIDENTS.length} tinggal di sini</span></div>
      <div class="court-resident-strip">
        ${HOUSE_RESIDENTS.map((entry) => {
          const open = residentUnlocked(p, entry.id);
          return `<button class="court-resident-chip${entry.id === resident.id ? ' active' : ''}${open ? '' : ' locked'}"
            type="button" data-action="select-resident" data-resident="${entry.id}">
            <span style="--npc-color:${entry.color}">${entry.glyph}</span>
            <b>${esc(entry.name)}</b>
            <em>${open ? esc(entry.role) : 'BELUM TERBUKA'}</em>
          </button>`;
        }).join('')}
      </div>
      <div class="court-resident-detail" style="--npc-color:${resident.color}">
        <div class="court-resident-portrait">${resident.glyph}</div>
        <div class="court-resident-copy">
          <h3>${esc(resident.name)} <small>${esc(resident.role)}</small></h3>
          <p class="court-dialogue">“${esc(line)}”</p>
          <div class="court-affinity">
            <span>IKATAN ${state.affinity} / 100 · ${residentAffinityTier(state.affinity).toUpperCase()}</span>
            <div><i style="width:${state.affinity}%"></i></div>
          </div>
          <div class="court-resident-actions">
            <button class="btn btn-ghost btn-compact" type="button" data-action="talk-resident" data-resident="${resident.id}" ${unlocked ? '' : 'disabled'}>BICARA</button>
            <button class="btn btn-primary btn-compact" type="button" data-action="gift-resident" data-resident="${resident.id}" ${unlocked && p.marks >= GIFT_COST ? '' : 'disabled'}>HADIAH · ${GIFT_COST} ✦</button>
          </div>
          <div class="court-quest">
            <header><span>MISI PRIBADI</span><b>${esc(quest.name)}</b><em>${state.questDone ? 'SELESAI' : `${state.questStep} / ${quest.steps.length}`}</em></header>
            <ol>
              ${quest.steps.map((entry, index) => `<li class="${state.questDone || index < state.questStep ? 'done' : index === state.questStep ? 'current' : ''}">${esc(entry.label)}</li>`).join('')}
            </ol>
            <p>Hadiah: ${reward.marks ? `${reward.marks} ✦` : ''}${reward.weapon ? ` · ${esc(COURT_WEAPON_BY_ID[reward.weapon]?.name || reward.weapon)}` : ''}${reward.tool ? ` · ${esc(COURT_TOOL_BY_ID[reward.tool]?.name || reward.tool)}` : ''}</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function buildCourtArsenalTab(wrap) {
  const p = courtState();
  const equippedTools = new Set(p.equippedTools);
  wrap.innerHTML = `
    <section class="exp-section">
      <div class="exp-section-head"><h3>TEMPA SENJATA</h3><span>${p.weapons.length} / ${COURT_WEAPONS.length} dimiliki · ${COURT_WEAPON_BY_ID[p.equippedWeapon]?.name || 'Pedang Sumpah'} terpasang</span></div>
      <div class="court-weapon-grid">
        ${COURT_WEAPONS.map((weapon) => {
          const owned = p.weapons.includes(weapon.id);
          const equipped = p.equippedWeapon === weapon.id;
          const profile = COURT_WEAPON_PROFILES[weapon.id];
          const damage = profile.attacks.map((attack) => attack.dmg).join(' · ');
          const range = profile.projectile ? 'JAUH' : Math.max(...profile.attacks.map((attack) => attack.range));
          return `
            <article class="court-weapon-card${owned ? ' owned' : ''}${equipped ? ' equipped' : ''}">
              <span class="court-weapon-glyph">${weapon.glyph}</span>
              <div>
                <h4>${esc(weapon.name)}</h4>
                <em>${esc(weapon.style.toUpperCase())} · TIER ${weapon.tier}</em>
                <p>${esc(weapon.desc)}</p>
                <div class="court-boss-meta"><span>DMG <b>${damage}</b></span><span>JANGKAUAN <b>${range}</b></span></div>
              </div>
              <button class="btn btn-ghost btn-compact" type="button" data-action="${owned ? 'equip-weapon' : 'buy-weapon'}" data-weapon="${weapon.id}" ${equipped ? 'disabled' : ''}>
                ${equipped ? 'TERPASANG' : owned ? 'PAKAI' : `${weapon.cost} ✦`}
              </button>
            </article>`;
        }).join('')}
      </div>
    </section>
    <section class="exp-section">
      <div class="exp-section-head"><h3>ALAT PERJALANAN</h3><span>${p.equippedTools.length} / 3 terpasang · slot ${COURT_TOOL_SLOTS.join(' / ')}</span></div>
      <div class="court-tool-grid">
        ${COURT_TOOLS.map((tool) => {
          const owned = p.tools.includes(tool.id);
          const equipped = equippedTools.has(tool.id);
          return `
            <article class="court-tool-card${owned ? ' owned' : ''}${equipped ? ' equipped' : ''}">
              <span>${tool.glyph}</span>
              <div><h4>${esc(tool.name)}</h4><em>${tool.slot.toUpperCase()}</em><p>${esc(tool.desc)}</p></div>
              <button class="btn btn-ghost btn-compact" type="button" data-action="${owned ? 'equip-tool' : 'buy-tool'}" data-tool="${tool.id}">
                ${equipped ? 'LEPAS' : owned ? 'PASANG' : `${tool.cost} ✦`}
              </button>
            </article>`;
        }).join('')}
      </div>
    </section>
  `;
}

function courtToastQuest(quests) {
  for (const quest of quests || []) {
    const resident = HOUSE_RESIDENT_BY_ID[quest.residentId];
    if (resident) showToast(`Misi ${resident.name} selesai — hadiah diterima.`, 3200);
  }
}

function handleCourtAction(target) {
  const action = target.dataset.action;
  if (!action) return;
  const p = courtState();
  if (action === 'start-room') {
    startCourtRoom(Number(target.dataset.room));
    return;
  }
  if (action === 'start-trial') {
    startCourtTrial(target.dataset.trial);
    return;
  }
  if (action === 'start-pack') {
    startPackRun(Number(target.dataset.index) || 0);
    return;
  }
  if (action === 'ngplus') {
    const result = setCourtNgPlus(p, p.ngPlus + Number(target.dataset.value));
    if (!result.ok) showToast('Selesaikan The Hollow Court untuk membuka NG+.', 2200);
    else showToast(`Sumpah Berulang +${result.ngPlus} aktif untuk court.`, 1800);
    saveProgress();
    buildCourtScreen();
    return;
  }
  if (action === 'upgrade-room') {
    const result = upgradeHouseRoom(p, target.dataset.roomId);
    if (!result.ok) {
      showToast(result.reason === 'marks' ? `Butuh ${result.cost} Tanda Perapian.` : 'Ruangan sudah maksimal.', 2200);
    } else {
      showToast(`Ruangan naik ke Lv ${result.level}.`, 1800);
    }
  } else if (action === 'buy-furnishing') {
    const result = buyFurnishing(p, target.dataset.furnishing);
    if (!result.ok) {
      showToast(result.reason === 'marks' ? `Butuh ${result.cost} Tanda Perapian.` : result.reason === 'room' ? 'Naikkan ruangan dulu.' : 'Perabot itu sudah ada.', 2200);
    } else {
      showToast(`Perabot dipasang: ${result.item.name}.`, 1800);
      courtToastQuest(result.quests);
    }
  } else if (action === 'select-resident') {
    courtResidentId = target.dataset.resident;
    courtTalkLine = '';
    buildCourtScreen();
    return;
  } else if (action === 'talk-resident') {
    const result = talkToResident(p, target.dataset.resident, new Date().getDate());
    if (!result.ok) showToast('Penghuni ini belum terbuka.', 1800);
    else courtTalkLine = result.line;
    saveProgress();
    buildCourtScreen();
    return;
  } else if (action === 'gift-resident') {
    const result = giftResident(p, target.dataset.resident);
    if (!result.ok) showToast(result.reason === 'marks' ? 'Tanda Perapian tidak cukup.' : 'Penghuni ini belum terbuka.', 2000);
    else {
      courtTalkLine = result.line;
      showToast('Hadiah diterima. Ikatan menguat.', 1800);
      courtToastQuest(result.quest);
    }
  } else if (action === 'buy-weapon') {
    const result = buyCourtWeapon(p, target.dataset.weapon);
    if (!result.ok) showToast(result.reason === 'marks' ? `Butuh ${result.cost} Tanda Perapian.` : 'Senjata sudah dimiliki.', 2000);
    else showToast(`Senjata ditempa: ${result.weapon.name}.`, 1900);
  } else if (action === 'equip-weapon') {
    const result = equipCourtWeapon(p, target.dataset.weapon);
    if (!result.ok) showToast('Senjata belum dimiliki.', 1800);
    else showToast('Senjata terpasang.', 1500);
  } else if (action === 'buy-tool') {
    const result = buyCourtTool(p, target.dataset.tool);
    if (!result.ok) showToast(result.reason === 'marks' ? `Butuh ${result.cost} Tanda Perapian.` : 'Alat sudah dimiliki.', 2000);
    else showToast(`Alat dibeli: ${result.tool.name}.`, 1800);
  } else if (action === 'equip-tool') {
    const result = equipCourtTool(p, target.dataset.tool);
    if (!result.ok) showToast('Alat belum dimiliki.', 1800);
    else showToast(result.equipped === false ? 'Alat dilepas.' : 'Alat terpasang.', 1500);
  } else {
    return;
  }
  saveProgress();
  buildCourtScreen();
}

function startCourtRoom(localIndex, options = {}) {
  coopGuestMode = false;
  coopGuestRoom = -1;
  const index = Number(localIndex);
  const room = COURT_ROOMS[index];
  const p = courtState();
  const trial = options.trial || null;
  if (!room || (!trial && !courtLevelUnlocked(p, index))) {
    showToast('Ruang itu masih terkunci. Selesaikan ruang sebelumnya dulu.', 2200);
    return;
  }
  if (trial && !courtTrialUnlocked(p, trial.id)) {
    showToast('Tantangan itu belum terbuka.', 2200);
    return;
  }
  audio.init();
  attempts = 1;
  activeRunKind = 'court';
  activeCourtRoom = room.id;
  activeCourtTrial = trial ? { id: trial.id, index: 0, startedAt: 0 } : null;
  courtTrialResult = null;
  activeExpansionIndex = null;
  activeModeId = null;
  activeTrialId = null;
  modeRunRewarded = false;
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  applyCourtLoadout(p, game);
  game.enterRoom(room.id);
  if (activeCourtTrial) activeCourtTrial.startedAt = game.time;
  game.player.relic = true;
  game.ash = Math.max(game.ash, trial ? 90 : 40 + index * 6);
  p.stats.runs += 1;
  syncCourtUnlocks(p);
  saveProgress();
  game.events.length = 0;
  started = true;
  paused = false;
  hunterShopOpen = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  beginStage(game.roomIndex, trial ? trial.name : room.name);
  showBanner(trial ? trial.name : room.name, trial ? trial.subtitle : room.subtitle);
  syncScreens();
  updateHud();
  showToast(trial ? `Tantangan · ${trial.name}${p.ngPlus ? ` · Sumpah +${p.ngPlus}` : ''}` : `Hearthfall · ${room.courtZone} — ruang ${room.courtLocal + 1}/10`, 2400);
}

function startCourtTrial(trialId) {
  const trial = COURT_TRIAL_BY_ID[trialId];
  const p = courtState();
  if (!trial) return;
  if (!courtTrialUnlocked(p, trial.id)) {
    showToast(trial.requires === 'completion' ? 'Tuntaskan The Hollow Court dulu.' : 'Kalahkan bos Kebun Kaca dulu.', 2400);
    return;
  }
  startCourtRoom(trial.start, { trial });
}

// ── Panggung Abadi: six-guardian gauntlet ─────────────────────────────────
function packState() {
  if (!progress.pack) progress.pack = defaultPackProgress();
  return progress.pack;
}

function packArena() {
  return COURT_ROOMS[9] || COURT_ROOMS[0];
}

function startPackRun(index = 0) {
  const boss = PACK_BOSSES[index];
  if (!boss) return;
  if (!packBossUnlocked(packState(), index)) {
    showToast('Kalahkan penjaga sebelumnya dulu.', 2200);
    return;
  }
  const arena = packArena();
  if (!arena) return;
  audio.init();
  attempts = 1;
  coopGuestMode = false;
  coopGuestRoom = -1;
  activeRunKind = 'pack';
  activePackIndex = index;
  packRunActive = true;
  activeCourtRoom = arena.id;
  activeCourtTrial = null;
  courtTrialResult = null;
  activeExpansionIndex = null;
  activeModeId = null;
  activeTrialId = null;
  modeRunRewarded = false;
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  applyCourtLoadout(courtState(), game);
  game.enterRoom(arena.id);
  game.boss = null;
  game.awaitingBlessing = false;
  game.blessingChoices = null;
  game.state = 'playing';
  game.player.relic = true;
  game.ash = Math.max(game.ash, 120);
  packRunStartedAt = game.time;
  game.spawnBoss(boss.kind);
  game.events.length = 0;
  started = true;
  paused = false;
  hunterShopOpen = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  beginStage(arena.id, boss.name);
  showBanner(boss.name, boss.title);
  syncScreens();
  updateHud();
  saveProgress();
  showToast(`Panggung Abadi · ${index + 1}/${PACK_BOSSES.length} — ${boss.name}`, 2600);
}

function handlePackBoss(ev) {
  if (!packRunActive) return;
  const index = activePackIndex;
  const boss = PACK_BOSSES[index];
  if (!boss) return;
  const elapsed = Math.max(0, game.time - packRunStartedAt);
  recordPackBoss(packState(), index, elapsed);
  saveProgress();
  const next = index + 1;
  if (next >= PACK_BOSSES.length) {
    recordPackFinish(packState(), elapsed);
    const bonus = grantSkillPoints(progress.skills, SKILL_POINTS_PACK_CLEAR, 'pack:clear');
    saveProgress();
    applySkillsToGame();
    packRunActive = false;
    activePackIndex = -1;
    game.state = 'playing';
    game.awaitingBlessing = false;
    game.blessingChoices = null;
    game.boss = null;
    showToast(
      `PANGGUNG ABADI TUNTAS · ${formatCourtTime(elapsed)} · +${bonus.granted || SKILL_POINTS_PACK_CLEAR} SKILL POINT`,
      6200,
    );
    showCourt('journey');
    return;
  }
  activePackIndex = next;
  game.state = 'playing';
  game.awaitingBlessing = false;
  game.blessingChoices = null;
  game.boss = null;
  const p = game.player;
  p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.25));
  p.invuln = Math.max(p.invuln, 1.2);
  closeDialogue(true);
  game.spawnBoss(PACK_BOSSES[next].kind);
  showToast(`Penjaga ${next + 1}/${PACK_BOSSES.length} — ${PACK_BOSSES[next].name}`, 2400);
}

function packSection() {
  const summary = packProgressSummary(packState());
  return `
    <section class="exp-section pack-section">
      <div class="exp-section-head">
        <h3>${PACK_NAME.toUpperCase()} — ${PACK_BOSSES.length} PENJAGA AGUNG</h3>
        <span>${summary.cleared} / ${summary.total} gugur · ${summary.gauntletClears} tuntas · ${summary.percent}%</span>
      </div>
      <p class="map-note">
        ${PACK_SUBTITLE}. Setiap penjaga memakai tema musiknya sendiri, memakai pola fase nyata,
        dan meninggalkan Skill Point permanen untuk ultimate-mu.
      </p>
      <div class="pack-grid">
        ${PACK_BOSSES.map((boss, index) => {
          const cleared = packState().cleared[boss.id] === true;
          const unlocked = packBossUnlocked(packState(), index);
          return `
            <article class="pack-card${unlocked ? '' : ' locked'}" style="--pack-color:${boss.color}">
              <span class="pack-glyph" aria-hidden="true">${boss.glyph}</span>
              <div class="pack-copy">
                <h4>${esc(boss.name)}</h4>
                <em>${esc(boss.title)}</em>
                <p>${esc(boss.subtitle)}</p>
                <div class="pack-meta">
                  <span>FASE<b>${boss.phases}</b></span>
                  <span>HP<b>${boss.maxHp}</b></span>
                  <span>STATUS<b>${cleared ? 'GUGUR' : unlocked ? 'MENANTI' : 'TERKUNCI'}</b></span>
                </div>
              </div>
              <button class="btn ${unlocked ? 'btn-primary' : 'btn-ghost'} btn-compact" type="button"
                data-action="start-pack" data-index="${index}" ${unlocked ? '' : 'disabled'}>
                ${cleared ? 'ULANGI' : unlocked ? 'HADAPI' : 'KUNCI'}
              </button>
            </article>`;
        }).join('')}
      </div>
    </section>`;
}

// ── Faewood: ten-stage fairy biome, then the two bosses ───────────────────
function fairyState() {
  if (!progress.fairy) progress.fairy = defaultFairyProgress();
  return progress.fairy;
}

function showFairy() {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'fairy';
  clearHeldKeys();
  buildFairyScreen();
  syncScreens();
}

function closeFairy() {
  showMenu();
}

// ── Tidewrought Cistern: four halls, the tide altar and two wall secrets ───
let activeCisternStage = -1;

function cisternState() {
  if (!progress.cistern) progress.cistern = defaultCisternProgress();
  return progress.cistern;
}

function discoverCisternRoom(local) {
  const p = cisternState();
  const index = Math.trunc(Number(local));
  if (!Number.isInteger(index) || index < 0 || index >= CISTERN_ROOMS.length) return;
  if (p.discovered[index]) return;
  p.discovered[index] = true;
  const room = CISTERN_ROOMS[index];
  if (room.secret) recordCisternSecret(p, room.cisternKey);
  saveProgress();
}

function buildCisternCards() {
  const wrap = $('cistern-cards');
  if (!wrap) return;
  const p = cisternState();
  const chapterOpen = cisternUnlocked(progress);
  const summary = cisternSummary(p);
  const label = $('cistern-progress');
  if (label) {
    label.textContent = chapterOpen
      ? `${summary.stagesCleared}/${summary.stageTotal} TAHAP · ${summary.secretsFound}/${summary.secretTotal} RAHASIA · ${summary.percent}%`
      : 'TERKUNCI';
  }
  const note = $('cistern-lock-note');
  if (note) note.classList.toggle('hidden', chapterOpen);
  wrap.innerHTML = '';
  CISTERN_ROOMS.forEach((room, local) => {
    const meta = CISTERN_STAGE_META[local];
    const hidden = meta.secret && !p.discovered[local];
    const locked = !chapterOpen || hidden || !cisternStageUnlocked(p, local);
    const cleared = cisternStageCleared(p, local);
    const card = document.createElement('article');
    card.className = `level-card cistern-card${locked ? ' locked' : ''}${cleared ? ' cleared' : ''}`;
    card.style.setProperty('--accent', room.accent);
    const badge = cleared
      ? '<span class="level-badge done">TUNTAS</span>'
      : hidden
        ? '<span class="level-badge lock">TERSEMBUNYI</span>'
        : locked
          ? '<span class="level-badge lock">TERKUNCI</span>'
          : '<span class="level-badge">TERBUKA</span>';
    const tags = hidden
      ? '<span>???</span>'
      : meta.tags.map((tag) => `<span>${esc(tag)}</span>`).join('');
    card.innerHTML = `
      <div class="level-art">
        <span class="level-chapter">${hidden ? 'BAB IX · ???' : esc(meta.chapter)}</span>
        ${badge}
        <span class="level-glyph" aria-hidden="true">${hidden ? '?' : esc(meta.glyph)}</span>
      </div>
      <div class="level-body">
        <h3>${hidden ? '???' : esc(room.name)}</h3>
        <span class="level-sub">${hidden ? 'Relung tersembunyi' : esc(room.subtitle)}</span>
        <p class="level-desc">${hidden ? 'Dua dinding berlumut di sistem ini menyembunyikan ruang yang tidak ada di peta.' : esc(meta.desc)}</p>
        <div class="level-tags">${tags}</div>
        <div class="level-actions">
          ${locked ? '' : '<button class="btn btn-primary btn-small play-btn" type="button">MAINKAN</button>'}
        </div>
      </div>`;
    const playBtn = card.querySelector('.play-btn');
    if (playBtn) playBtn.addEventListener('click', () => startCisternStage(local));
    wrap.appendChild(card);
  });
}

function startCisternStage(local) {
  const p = cisternState();
  const index = Math.trunc(Number(local));
  const room = CISTERN_ROOMS[index];
  if (!room) return;
  if (!cisternUnlocked(progress)) {
    showToast('Sistem Air Pasang terkunci sampai The Oathbreaker gugur.', 2400);
    return;
  }
  if (!cisternStageUnlocked(p, index)) {
    showToast('Ruang itu masih terkunci. Selesaikan ruang sebelumnya dulu.', 2200);
    return;
  }
  audio.init();
  attempts = 1;
  coopGuestMode = false;
  coopGuestRoom = -1;
  activeRunKind = 'cistern';
  activeCisternStage = index;
  activeFairyStage = -1;
  activeFairyBoss = null;
  activeCourtRoom = null;
  activeCourtTrial = null;
  activePackIndex = -1;
  activeExpansionIndex = null;
  activeModeId = null;
  activeTrialId = null;
  modeRunRewarded = false;
  packRunActive = false;
  labRun = null;
  labDirector = null;
  speedrunRun = null;
  game.labyrinth = false;
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  game.enterRoom(room.id);
  game.player.relic = true;
  game.ash = Math.max(game.ash, 45 + index * 14);
  discoverCisternRoom(index);
  cutsceneSeen = new Set();
  postCreditTimer = -1;
  saveProgress();
  game.events.length = 0;
  started = true;
  paused = false;
  hunterShopOpen = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  beginStage(game.roomIndex, room.name);
  showBanner(room.name, room.subtitle);
  syncScreens();
  updateHud();
  const label = room.boss ? ' · BOSS' : room.secret ? ' · RAHASIA' : '';
  showToast(`${CISTERN_LOCAL_NAME} · ${room.name}${label}`, 2400);
}

function handleCisternBoss(ev) {
  const p = cisternState();
  const result = recordCisternBoss(p);
  recordCisternRun(p, game.time);
  saveProgress();
  if (result.firstClear) {
    showToast(`VASSKA GUGUR — ${CISTERN_NAME} surut. Pasang terakhir berakhir.`, 3000);
  }
  updateMenuProgress();
}


// ── The Lanternwake: four halls of twenty enemies and the four-phase Wickbearer
let activeLanternStage = -1;

function lanternState() {
  if (!progress.lanternwake) progress.lanternwake = defaultLanternProgress();
  return progress.lanternwake;
}

function discoverLanternRoom(local) {
  const p = lanternState();
  const index = Math.trunc(Number(local));
  if (!Number.isInteger(index) || index < 0 || index >= LANTERN_ROOMS.length) return;
  if (p.discovered[index]) return;
  p.discovered[index] = true;
  saveProgress();
}

function buildLanternwakeCards() {
  const wrap = $('lanternwake-cards');
  if (!wrap) return;
  const p = lanternState();
  const chapterOpen = lanternwakeUnlocked(progress);
  const summary = lanternSummary(p);
  const label = $('lanternwake-progress');
  if (label) {
    label.textContent = chapterOpen
      ? `${summary.stagesCleared}/${summary.stageTotal} TAHAP · ${summary.percent}%`
      : 'TERKUNCI';
  }
  const note = $('lanternwake-lock-note');
  if (note) note.classList.toggle('hidden', chapterOpen);
  wrap.innerHTML = '';
  LANTERN_ROOMS.forEach((room, local) => {
    const meta = LANTERN_STAGE_META[local];
    const locked = !chapterOpen || !lanternStageUnlocked(p, local);
    const cleared = lanternStageCleared(p, local);
    const card = document.createElement('article');
    card.className = `level-card cistern-card lanternwake-card${locked ? ' locked' : ''}${cleared ? ' cleared' : ''}`;
    card.style.setProperty('--accent', room.accent);
    const badge = cleared
      ? '<span class="level-badge done">TUNTAS</span>'
      : locked
        ? '<span class="level-badge lock">TERKUNCI</span>'
        : '<span class="level-badge">TERBUKA</span>';
    const tags = meta.tags.map((tag) => `<span>${esc(tag)}</span>`).join('');
    card.innerHTML = `
      <div class="level-art">
        <span class="level-chapter">${esc(meta.chapter)}</span>
        ${badge}
        <span class="level-glyph" aria-hidden="true">${esc(meta.glyph)}</span>
      </div>
      <div class="level-body">
        <h3>${esc(room.name)}</h3>
        <span class="level-sub">${esc(room.subtitle)}</span>
        <p class="level-desc">${esc(meta.desc)}</p>
        <div class="level-tags">${tags}<span>${meta.enemies} MUSUH</span><span>${meta.elites} ELITE</span></div>
        <div class="level-actions">
          ${locked ? '' : '<button class="btn btn-primary btn-small play-btn" type="button">MAINKAN</button>'}
        </div>
      </div>`;
    const playBtn = card.querySelector('.play-btn');
    if (playBtn) playBtn.addEventListener('click', () => startLanternwakeStage(local));
    wrap.appendChild(card);
  });
}

function startLanternwakeStage(local) {
  const p = lanternState();
  const index = Math.trunc(Number(local));
  const room = LANTERN_ROOMS[index];
  if (!room) return;
  if (!lanternwakeUnlocked(progress)) {
    showToast('The Lanternwake terbuka setelah Vasska gugur di Sistem Air Pasang.', 2600);
    return;
  }
  if (!lanternStageUnlocked(p, index)) {
    showToast('Aula itu masih tertutup. Selesaikan aula sebelumnya dulu.', 2200);
    return;
  }
  audio.init();
  attempts = 1;
  coopGuestMode = false;
  coopGuestRoom = -1;
  activeRunKind = 'lanternwake';
  activeLanternStage = index;
  activeCisternStage = -1;
  activeFairyStage = -1;
  activeFairyBoss = null;
  activeCourtRoom = null;
  activeCourtTrial = null;
  activePackIndex = -1;
  activeExpansionIndex = null;
  activeModeId = null;
  activeTrialId = null;
  modeRunRewarded = false;
  packRunActive = false;
  labRun = null;
  labDirector = null;
  speedrunRun = null;
  game.labyrinth = false;
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  game.enterRoom(room.id);
  game.player.relic = true;
  game.ash = Math.max(game.ash, 50 + index * 18);
  discoverLanternRoom(index);
  cutsceneSeen = new Set();
  postCreditTimer = -1;
  saveProgress();
  game.events.length = 0;
  started = true;
  paused = false;
  hunterShopOpen = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  beginStage(game.roomIndex, room.name);
  showBanner(room.name, room.subtitle);
  syncScreens();
  updateHud();
  const label = room.boss ? ' · BOSS' : '';
  showToast(`${LANTERN_LOCAL_NAME} · ${room.name}${label}`, 2400);
}

function handleLanternwakeBoss() {
  const p = lanternState();
  const result = recordLanternBoss(p);
  recordLanternRun(p, game.time);
  saveProgress();
  if (result.firstClear) {
    showToast(`ORSELLA PADAM — ${LANTERN_NAME} selesai. Sembilan sumbu kembali menyala.`, 3200);
  }
  updateMenuProgress();
}

// ── Speedrun: one life, escalating game speed ─────────────────────────────
function speedrunState() {
  if (!progress.speedrun) progress.speedrun = defaultSpeedrunProgress();
  return progress.speedrun;
}

function speedrunStamp(at) {
  const ms = Number(at);
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ── Campaign Map Editor (lazy-loaded pilot mode) ────────────────────────
let mapEditorCtrl = null;
let mapEditorPromise = null;
let editorOpenToken = 0;
let customIntroCallback = null;
let customBadgeCache = '';

function clearShellOverlays() {
  cancelPrologue();
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
}

function resetArenaStateForCustomRun() {
  attempts = 1;
  coopGuestMode = false;
  coopGuestRoom = -1;
  activeCourtTrial = null;
  activeCourtRoom = null;
  activePackIndex = -1;
  activeFairyStage = -1;
  activeFairyBoss = null;
  speedrunRun = null;
  speedrunSummaryOpen = false;
  labRun = null;
  labDirector = null;
  labGuestMode = false;
  labRewardsOpen = false;
  labSummaryOpen = false;
  activeExpansionIndex = null;
  activeModeId = null;
  activeTrialId = null;
  cutsceneSeen = new Set();
  postCreditTimer = -1;
  horrorEventLayer = {};
  horrorPresence = null;
  horrorLastDone = null;
}

function ensureMapEditor() {
  if (mapEditorCtrl) return Promise.resolve(mapEditorCtrl);
  if (!mapEditorPromise) {
    mapEditorPromise = Promise.all([
      import('./mapeditor_ui.js'),
      ensureStylesheet('./styles-mapeditor.css'),
    ])
      .then(([mod]) => {
        if (!mapEditorCtrl) {
          mapEditorCtrl = mod.createMapEditorController({
            $,
            esc,
            game,
            audio,
            formatTime,
            getMenuView: () => menuView,
            setMenuView: (v) => { menuView = v; },
            isStarted: () => started,
            setStarted: (v) => { started = v; },
            setPaused: (v) => { paused = v; },
            getActiveRunKind: () => activeRunKind,
            setActiveRunKind: (v) => { activeRunKind = v; },
            clearShellOverlays,
            resetArenaStateForCustomRun,
            applyCustomPlayerLoadout: (bp) => {
              game.applyCharacter(bp.classId);
              game.applySkillBonuses(skillBonuses(progress.skills));
              game.setAppearance({
                race: character.race,
                skin: character.skin,
                outfit: character.outfit,
                armor: character.armor,
              });
            },
            applyCustomHunterItems: () => {
              game.setHunterItems(hunterState.items);
            },
            beginCustomStageRecord: (bp, room) => {
              lastGameState = 'playing';
              accumulator = 0;
              lastTime = performance.now();
              activeStage = { key: `custom:${bp.id}`, index: room.index, label: bp.name, startedAt: game.time, recorded: false };
            },
            setCustomIntroCallback: (fn) => { customIntroCallback = fn; },
            startPrologue,
            openTrailer,
            startCutscene,
            syncScreens,
            updateHud,
            clearHeldKeys,
            showBanner,
            showToast,
            showMenu,
            unlockAudio: () => {
              audio.init();
              audioUnlocked = true;
            },
          });
          mapEditorCtrl.bindDom();
        }
        return mapEditorCtrl;
      })
      .catch((err) => {
        mapEditorPromise = null;
        throw err;
      });
  }
  return mapEditorPromise;
}

async function showEditor() {
  const token = ++editorOpenToken;
  clearShellOverlays();
  started = false;
  paused = false;
  menuView = 'editor';
  clearHeldKeys();
  const form = $('editor-form');
  const msg = $('editor-message');
  if (!mapEditorCtrl) {
    if (form) form.innerHTML = '<p class="editor-empty" role="status">Memuat Peta Sumpah…</p>';
    if (msg) {
      msg.textContent = 'Memuat modul Peta Sumpah…';
      msg.className = 'editor-message';
    }
  }
  syncScreens();
  try {
    const ctrl = await ensureMapEditor();
    if (token !== editorOpenToken || menuView !== 'editor') return false;
    return ctrl.open();
  } catch (error) {
    if (token !== editorOpenToken || menuView !== 'editor') return false;
    if (form) {
      form.innerHTML = `<p class="editor-empty">Gagal memuat Peta Sumpah: ${esc(error?.message || 'galat')}</p><button class="btn btn-ghost btn-compact" type="button" data-editor-retry="1">COBA LAGI</button>`;
    }
    if (msg) {
      msg.textContent = 'Gagal memuat modul Peta Sumpah.';
      msg.className = 'editor-message error';
    }
    return false;
  }
}

function isCustomClearOpen() {
  return Boolean(mapEditorCtrl?.isClearOpen());
}

function tickCustomStage(dt) {
  mapEditorCtrl?.tick(dt);
}

function resetCustomRun() {
  mapEditorCtrl?.resetActiveRun();
}

function startCustomStage(id) {
  if (mapEditorCtrl) return mapEditorCtrl.startCustomStage(id);
  return ensureMapEditor().then((ctrl) => ctrl.startCustomStage(id));
}

function retryCustomRun() {
  if (mapEditorCtrl) return mapEditorCtrl.retryCustomStage();
  return ensureMapEditor().then((ctrl) => ctrl.retryCustomStage());
}

function editorSyncOrAsync(fn) {
  if (mapEditorCtrl) return fn(mapEditorCtrl);
  return ensureMapEditor().then(fn);
}

function showSpeedrun() {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  speedrunSummaryOpen = false;
  menuView = 'speedrun';
  clearHeldKeys();
  buildSpeedrunScreen();
  syncScreens();
}

function buildSpeedrunScreen() {
  const summary = speedrunSummary(speedrunState());
  const stats = speedrunStats(speedrunState());
  const history = summary.history || [];
  const box = $('speedrun-summary');
  if (box) {
    box.innerHTML = `
      <div class="stat"><strong>${summary.bestMultiplier ? `${summary.bestMultiplier}×` : '—'}</strong><span>Rekor Kecepatan</span></div>
      <div class="stat"><strong>${summary.bestCycles}</strong><span>Putaran Tuntas</span></div>
      <div class="stat"><strong>${summary.bestTime ? formatTime(summary.bestTime) : '—'}</strong><span>Waktu Bertahan</span></div>
      <div class="stat"><strong>${summary.runs}</strong><span>Run Selesai</span></div>
    `;
  }
  const body = $('speedrun-body');
  if (body) {
    body.innerHTML = `
      <section class="exp-section">
        <div class="exp-section-head">
          <h3>ATURAN SATU NYAWA</h3>
          <span>${SPEEDRUN_LIVES} nyawa · tanpa checkpoint</span>
        </div>
        <ul class="speedrun-rules">
          ${SPEEDRUN_RULES.map((line) => `<li>${esc(line)}</li>`).join('')}
        </ul>
      </section>
      <section class="exp-section">
        <div class="exp-section-head">
          <h3>JALUR KECEPATAN</h3>
          <span>berhenti hanya saat kau gugur</span>
        </div>
        <div class="speedrun-ladder">
          ${[0, 1, 2, 3, 4, 5].map((cycle) => {
            const mult = speedrunMultiplier(cycle);
            return `<div class="speedrun-rung"><span>${cycle === 0 ? 'AWAL' : `SETELAH BOS ${cycle}`}</span><strong>${mult}×</strong></div>`;
          }).join('')}
          <div class="speedrun-rung endless"><span>DAN SETERUSNYA</span><strong>∞</strong></div>
        </div>
      </section>
      <section class="exp-section">
        <div class="exp-section-head">
          <h3>STATISTIK MENDALAM</h3>
          <span>${stats.attempts ? `${stats.attempts} percobaan tercatat` : 'belum ada data'}</span>
        </div>
        <div class="speedrun-stats">
          <div class="sr-stat"><span>RASIO TUNTAS</span><strong>${stats.clearRate}%</strong><em>${stats.clearedRuns} dari ${stats.attempts} percobaan</em></div>
          <div class="sr-stat"><span>RATA-RATA BERTAHAN</span><strong>${stats.averageTime ? formatTime(stats.averageTime) : '—'}</strong><em>total ${formatTime(stats.totalTime)}</em></div>
          <div class="sr-stat"><span>PUTARAN TERPANJANG</span><strong>${stats.longestClear}</strong><em>rata-rata ${stats.averageClears} putaran</em></div>
          <div class="sr-stat"><span>LANGKAH BERIKUT</span><strong>${stats.nextMultiplier}×</strong><em>${stats.bestMultiplier ? `${stats.bestMultiplier}× sudah tercapai` : 'belum ada rekor'}</em></div>
        </div>
        ${stats.ladder.length ? `<div class="speedrun-ladder-detail">
          ${stats.ladder.map((row) => `<div class="sr-rung-row${row.multiplier === stats.bestMultiplier ? ' record' : ''}">
            <strong>${row.multiplier}×</strong>
            <span>${row.attempts} percobaan · ${row.clears} tuntas</span>
            <span>putaran terbaik ${row.bestCycles}</span>
            <span>${row.bestTime ? formatTime(row.bestTime) : '—'}</span>
          </div>`).join('')}
        </div>` : '<p class="speedrun-empty">Statistik per kecepatan muncul setelah percobaan pertamamu.</p>'}
      </section>
      <section class="exp-section">
        <div class="exp-section-head">
          <h3>RIWAYAT RUN</h3>
          <span>${history.length ? `${history.length} percobaan terakhir · terbaru di atas` : 'belum ada percobaan'}</span>
        </div>
        ${history.length ? `<ol class="speedrun-history">
          ${history.map((entry, index) => `<li class="speedrun-history-row${entry.died ? '' : ' cleared'}${entry.multiplier >= summary.bestMultiplier ? ' record' : ''}">
            <span class="sr-index">#${index + 1}</span>
            <strong class="sr-speed">${entry.multiplier}×</strong>
            <span class="sr-meta"><span>${entry.clears} putaran tuntas</span><span>${entry.rooms} ruang</span></span>
            <span class="sr-time">${formatTime(entry.time)}</span>
            <em class="sr-result">${entry.died ? 'GUGUR' : 'TUNTAS'}</em>
            <small class="sr-stamp">${speedrunStamp(entry.at)}</small>
          </li>`).join('')}
        </ol>` : '<p class="speedrun-empty">Belum ada riwayat. Setiap percobaan tercatat di sini dan tersimpan di browser ini.</p>'}
      </section>
    `;
  }
  const start = $('speedrun-start');
  if (start) {
    const label = start.querySelector('span');
    if (label) label.textContent = `MULAI SPEEDRUN ${SPEEDRUN_START_MULTIPLIER}×`;
  }
}

function startSpeedrun(cycle = 0, options = {}) {
  const safeCycle = Math.max(0, Math.min(98, Math.floor(Number(cycle) || 0)));
  const multiplier = speedrunMultiplier(safeCycle);
  audio.init();
  attempts = 1;
  coopGuestMode = false;
  coopGuestRoom = -1;
  activeRunKind = 'speedrun';
  activeCourtTrial = null;
  activeCourtRoom = null;
  activePackIndex = -1;
  activeFairyStage = -1;
  activeFairyBoss = null;
  activeExpansionIndex = null;
  activeModeId = null;
  activeTrialId = null;
  modeRunRewarded = false;
  packRunActive = false;
  labRun = null;
  labDirector = null;
  labGuestMode = false;
  labRewardsOpen = false;
  labSummaryOpen = false;
  game.labyrinth = false;
  game.reset();
  game.oneLife = true;
  applyCharacterToGame();
  applySkinToGame();
  speedrunRoomCount = 0;
  speedrunCleared = false;
  speedrunSummaryOpen = false;
  speedrunRun = { cycle: safeCycle, multiplier, startedAt: performance.now() };
  cutsceneSeen = new Set();
  postCreditTimer = -1;
  game.events.length = 0;
  started = true;
  paused = false;
  hunterShopOpen = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  discoverCurrentRoom(game.roomIndex);
  beginStage(game.roomIndex, game.room.name);
  showBanner(`${multiplier}× SPEEDRUN`, `PUTARAN ${safeCycle + 1} · SATU NYAWA`);
  if (!options.silent) {
    showToast(`⚡ ${multiplier}× — ${SPEEDRUN_LIVES} nyawa, tanpa checkpoint.`, 2600);
  }
  syncScreens();
  updateHud();
}

function finishSpeedrun() {
  if (activeRunKind !== 'speedrun' || !speedrunRun || speedrunSummaryOpen) return;
  const attempt = recordSpeedrun(speedrunState(), {
    multiplier: speedrunRun.multiplier,
    clears: speedrunRun.cycle,
    rooms: speedrunRoomCount,
    time: game.time,
    died: true,
  });
  saveProgress();
  speedrunLastSummary = attempt;
  speedrunSummaryOpen = true;
  speedrunCleared = false;
  buildSpeedrunSummary(attempt);
  syncScreens();
}

function buildSpeedrunSummary(attempt) {
  const sub = $('speedrun-summary-sub');
  if (sub) {
    sub.textContent = attempt.isRecord
      ? `Rekor baru: ${attempt.bestMultiplier}× dengan ${attempt.bestCycles} putaran tuntas.`
      : `Kau gugur pada ${attempt.multiplier}×. Rekor ${attempt.bestMultiplier || attempt.multiplier}× masih berdiri.`;
  }
  const body = $('speedrun-summary-body');
  if (body) {
    body.innerHTML = `${statsHtml([
      [`${attempt.multiplier}×`, 'Kecepatan'],
      [attempt.clears, 'Putaran Tuntas'],
      [attempt.rooms, 'Ruang Dilewati'],
      [formatTime(attempt.time), 'Waktu Bertahan'],
    ])}<p class="micro">Rekor tersimpan di progress.speedrun · satu nyawa, tanpa checkpoint.</p>`;
  }
  const again = $('speedrun-summary-again');
  if (again) {
    const label = again.querySelector('span');
    if (label) label.textContent = `MULAI LAGI ${SPEEDRUN_START_MULTIPLIER}×`;
  }
}

function handleSpeedrunClear() {
  if (activeRunKind !== 'speedrun' || !speedrunRun) return;
  const cleared = speedrunRun.multiplier;
  const nextCycle = speedrunRun.cycle + 1;
  const nextMultiplier = speedrunMultiplier(nextCycle);
  // The run has now reached the *next* speed, so that is the multiplier the
  // record keeps even if the player dies before the new boss falls.
  const attempt = recordSpeedrun(speedrunState(), {
    multiplier: nextMultiplier,
    clears: nextCycle,
    rooms: speedrunRoomCount,
    time: game.time,
    died: false,
  });
  saveProgress();
  speedrunLastSummary = attempt;
  startSpeedrun(nextCycle, { silent: true });
  showToast(`⚡ ${cleared}× tuntas — naik ke ${nextMultiplier}×`, 2800);
}

// ── Fishing: bait shack, reel minigame, illustrated index ───────────────
const FISH_SHAPE_LABELS = {
  slender: 'MEMANJANG',
  round: 'BUNDAR',
  flat: 'PIPIH',
  eel: 'BELUT',
  shell: 'BERCANGKANG',
  squid: 'BERKAKI',
  spiky: 'BERTARING',
};

function fishingState() {
  if (!progress.fishing) progress.fishing = defaultFishingProgress();
  return progress.fishing;
}

function fishingKg(value) {
  const n = Number(value) || 0;
  if (!n) return '—';
  return n >= 10 ? `${n.toFixed(1)} kg` : `${n.toFixed(2)} kg`;
}

function closeFishingOverlays() {
  cancelAnimationFrame(fishingReelFrame);
  fishingReelFrame = 0;
  fishingReel = null;
  $('fishing-cast')?.classList.add('hidden');
}

function showFishing() {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  speedrunSummaryOpen = false;
  closeFishingOverlays();
  menuView = 'fishing';
  fishIndexTab = 0;
  clearHeldKeys();
  buildFishingScreen();
  syncScreens();
}

function closeFishing() {
  closeFishingOverlays();
  showMenu();
}

function buildFishingScreen() {
  const p = fishingState();
  const summary = fishingSummary(p);
  const selected = fishingBaitById(summary.selectedBait) || FISHING_BAITS[0];
  const owned = p.bait[selected.id] || 0;
  const summaryBox = $('fishing-summary');
  if (summaryBox) {
    summaryBox.innerHTML = `
      <div><span>KOIN</span><strong>${summary.coins}</strong><em>${summary.earned} koin dari tangkapan</em></div>
      <div><span>UMPAN</span><strong>${summary.owned}</strong><em>${summary.baitKinds} jenis di tas</em></div>
      <div><span>INDEKS</span><strong>${summary.discovered} / ${summary.total}</strong><em>${summary.completion}% koleksi</em></div>
      <div><span>TANGKAPAN</span><strong>${summary.successRate}%</strong><em>${summary.catches} berhasil · ${summary.escapes} lepas</em></div>
    `;
  }
  const body = $('fishing-body');
  if (body) {
    body.innerHTML = `
      <section class="exp-section">
        <div class="exp-section-head">
          <h3>PILIH UMPAN</h3>
          <span>${summary.hasStarterBait ? 'cacing siap dipakai' : 'umban habis — beli di pondok'}</span>
        </div>
        <div class="bait-rack">
          ${FISHING_BAITS.map((bait) => {
            const count = p.bait[bait.id] || 0;
            const active = summary.selectedBait === bait.id;
            return `<button class="bait-chip tier-${bait.tier}${active ? ' active' : ''}${count ? '' : ' empty'}" type="button" data-fishing-bait="${bait.id}">
              <span class="bait-glyph" style="--bait:${bait.color};--bait-accent:${bait.accent}" aria-hidden="true">${bait.glyph}</span>
              <span class="bait-copy"><strong>${esc(bait.short)}</strong><em>${bait.price} koin · ${count} tersisa</em></span>
              <small>${baitHighTierChance(bait.id)}% langka+</small>
            </button>`;
          }).join('')}
        </div>
      </section>
      <section class="exp-section">
        <div class="exp-section-head">
          <h3>DANAU ABU</h3>
          <span>${summary.casts} lemparan · rekor ${fishingKg(summary.bestKg)}</span>
        </div>
        <div class="fishing-pond">
          <div class="fishing-pond-art" aria-hidden="true">
            <span class="pond-sun"></span>
            <span class="pond-wave w1"></span>
            <span class="pond-wave w2"></span>
            <span class="pond-float"></span>
            <span class="pond-hut"></span>
          </div>
          <div class="fishing-pond-copy">
            <h4>${esc(FISHING_LOCATION)}</h4>
            <p>${esc(FISHING_SUBTITLE)}</p>
            <div class="fishing-pond-meta">
              <span>UMPAN AKTIF<b>${esc(selected.short)} ×${owned}</b></span>
              <span>PELUANG LANGKA+<b>${baitHighTierChance(selected.id)}%</b></span>
              <span>TERTANGKAP<b>${summary.catches}</b></span>
            </div>
          </div>
        </div>
      </section>
    `;
  }
  const cast = $('fishing-cast-start');
  if (cast) {
    const label = cast.querySelector('span');
    if (label) label.textContent = owned ? `LEMPAR KAIL (${selected.short} ×${owned})` : 'UMPAN HABIS';
    cast.disabled = owned <= 0;
  }
}

function selectFishingBait(baitId) {
  if (!fishingSelectBait(fishingState(), baitId)) return false;
  saveProgress();
  buildFishingScreen();
  return true;
}

function paintFishingCastArt(fish, landed) {
  const canvas = $('fishing-cast-canvas');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  if (fish && landed) {
    drawFishingIcon(ctx, fish, 60, 35, 58);
    return;
  }
  ctx.strokeStyle = 'rgba(150, 205, 220, 0.45)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.ellipse(60, 44, 18 + i * 13, 5 + i * 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.fillStyle = '#e0b06a';
  ctx.arc(60, 44, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a5a2a';
  ctx.fillRect(59, 16, 2, 22);
}

function fishingReelLoop(now) {
  if (!fishingReel || fishingReel.resolved) {
    fishingReelFrame = 0;
    return;
  }
  const delta = Math.min(0.05, Math.max(0, (now - (fishingReel.last || now)) / 1000));
  fishingReel.last = now;
  fishingReel.position += (fishingReel.dir * delta) / 0.85;
  if (fishingReel.position >= 1) {
    fishingReel.position = 1;
    fishingReel.dir = -1;
  } else if (fishingReel.position <= 0) {
    fishingReel.position = 0;
    fishingReel.dir = 1;
  }
  const marker = $('fishing-reel-marker');
  if (marker) marker.style.left = `${Math.round(fishingReel.position * 1000) / 10}%`;
  fishingReelFrame = requestAnimationFrame(fishingReelLoop);
}

function beginFishingCast() {
  const p = fishingState();
  const cast = fishingCast(p, p.selectedBait, Math.random());
  if (!cast.ok) {
    showToast(cast.reason === 'empty' ? 'Umpan habis — beli di pondok umpan.' : 'Umpan itu tidak dikenal.', 2200);
    return false;
  }
  saveProgress();
  const bait = fishingBaitById(cast.bait);
  fishingReel = {
    fish: cast.fish,
    zone: reelZone(cast.fish),
    bait: bait ? bait.short : 'umpan',
    position: 0,
    dir: 1,
    last: performance.now(),
    resolved: false,
    result: '',
  };
  buildFishingScreen();
  const overlay = $('fishing-cast');
  if (!overlay) return false;
  overlay.classList.remove('hidden');
  const name = $('fishing-cast-name');
  const sub = $('fishing-cast-sub');
  const result = $('fishing-cast-result');
  if (name) name.textContent = 'SESUATU MENGGIGIT!';
  if (sub) sub.textContent = `Umpan ${fishingReel.bait} · tekan TARIK saat penanda di zona terang`;
  if (result) {
    result.textContent = '';
    result.className = 'fishing-cast-result';
  }
  const zoneEl = $('fishing-reel-zone');
  if (zoneEl) {
    zoneEl.style.left = `${(fishingReel.zone.center - fishingReel.zone.half) * 100}%`;
    zoneEl.style.width = `${fishingReel.zone.half * 2 * 100}%`;
  }
  const marker = $('fishing-reel-marker');
  if (marker) marker.style.left = '0%';
  const strike = $('fishing-strike');
  if (strike) {
    const label = strike.querySelector('span');
    if (label) label.textContent = 'TARIK!';
  }
  paintFishingCastArt(null, false);
  cancelAnimationFrame(fishingReelFrame);
  fishingReelFrame = requestAnimationFrame(fishingReelLoop);
  return true;
}

function strikeFishingReel(position) {
  if (!fishingReel || fishingReel.resolved) return false;
  fishingReel.resolved = true;
  cancelAnimationFrame(fishingReelFrame);
  fishingReelFrame = 0;
  const at = typeof position === 'number' ? position : fishingReel.position;
  const p = fishingState();
  const fish = fishingReel.fish;
  const rarity = fishRarity(fish.tier);
  const hit = reelHit(fish, at);
  const name = $('fishing-cast-name');
  const sub = $('fishing-cast-sub');
  const result = $('fishing-cast-result');
  const strike = $('fishing-strike');
  if (strike) {
    const label = strike.querySelector('span');
    if (label) label.textContent = 'LEMPAR LAGI';
  }
  if (hit) {
    const landed = fishingLandCatch(p, fish, Math.random());
    saveProgress();
    fishingReel.result = 'hit';
    if (name) name.textContent = `${fish.name} · ${fishingKg(landed.kg)}`;
    if (sub) {
      sub.textContent = `${rarity.name} · ${fish.value} koin${landed.isRecord ? ' · REKOR BERAT BARU' : ''} · tertangkap ${landed.caughtCount}×`;
    }
    if (result) {
      result.textContent = 'TERTARIK!';
      result.className = 'fishing-cast-result hit';
    }
    paintFishingCastArt(fish, true);
    showToast(`🎣 ${fish.name} — ${fishingKg(landed.kg)} (+${fish.value} koin)`, 2400);
  } else {
    fishingEscape(p);
    saveProgress();
    fishingReel.result = 'miss';
    if (name) name.textContent = 'IKAN ITU LEPAS';
    if (sub) sub.textContent = `${rarity.name} · penanda meleset dari zona — umpan tetap terpakai`;
    if (result) {
      result.textContent = 'LEPAS';
      result.className = 'fishing-cast-result miss';
    }
    paintFishingCastArt(fish, true);
  }
  return hit;
}

function openBaitShop() {
  closeFishingOverlays();
  menuView = 'baitShop';
  buildBaitShop();
  syncScreens();
}

function closeBaitShop() {
  menuView = 'fishing';
  buildFishingScreen();
  syncScreens();
}

function buildBaitShop() {
  const p = fishingState();
  const summary = fishingSummary(p);
  const wallet = $('bait-shop-wallet');
  if (wallet) {
    wallet.innerHTML = `
      <span class="wallet-coin" aria-hidden="true">◉</span>
      <strong>${summary.coins}</strong>
      <em>koin · ${summary.owned} umpan di tas</em>
    `;
  }
  const body = $('bait-shop-body');
  if (!body) return;
  body.innerHTML = FISHING_BAIT_TIERS.map((tier) => `
    <section class="bait-shelf tier-${tier.tier}">
      <div class="exp-section-head">
        <h3>${esc(tier.name)}</h3>
        <span>${tier.price} koin / unit · ${esc(tier.note)}</span>
      </div>
      <div class="bait-shelf-grid">
        ${FISHING_BAITS.filter((bait) => bait.tier === tier.tier).map((bait) => {
          const count = p.bait[bait.id] || 0;
          const canOne = summary.coins >= bait.price;
          const canFive = summary.coins >= bait.price * 5;
          return `<article class="bait-shop-card${count ? '' : ' unbought'}">
            <span class="bait-shop-glyph" style="--bait:${bait.color};--bait-accent:${bait.accent}" aria-hidden="true">${bait.glyph}</span>
            <div class="bait-shop-copy">
              <h4>${esc(bait.name)}</h4>
              <em>${baitHighTierChance(bait.id)}% peluang ikan langka+</em>
              <p>${esc(bait.blurb)}</p>
              <div class="bait-shop-meta">
                <span>HARGA<b>${bait.price}</b></span>
                <span>DIMILIKI<b>${count}</b></span>
              </div>
            </div>
            <div class="bait-shop-actions">
              <button class="btn btn-primary btn-compact" type="button" data-buy-bait="${bait.id}" data-bait-qty="1"${canOne ? '' : ' disabled'}>BELI ×1</button>
              <button class="btn btn-ghost btn-compact" type="button" data-buy-bait="${bait.id}" data-bait-qty="5"${canFive ? '' : ' disabled'}>BELI ×5</button>
            </div>
          </article>`;
        }).join('')}
      </div>
    </section>
  `).join('');
}

function buyFishingBait(baitId, qty = 1) {
  const result = fishingBuyBait(fishingState(), baitId, qty);
  if (!result.ok) {
    showToast(
      result.reason === 'coins'
        ? `Koin kurang: ${result.name || 'umpan'} butuh ${result.total}, kau punya ${result.coins}.`
        : result.reason === 'full'
          ? 'Tas umpan penuh untuk jenis ini.'
          : 'Umpan itu tidak dijual di sini.',
      2200,
    );
    return result;
  }
  saveProgress();
  buildBaitShop();
  showToast(`+${result.qty} ${result.name} · ${result.total} koin`, 2000);
  return result;
}

function openFishIndex() {
  closeFishingOverlays();
  menuView = 'fishIndex';
  buildFishIndex();
  syncScreens();
}

function closeFishIndex() {
  menuView = 'fishing';
  buildFishingScreen();
  syncScreens();
}

function setFishIndexTab(tier) {
  fishIndexTab = Math.max(0, Math.min(5, Math.floor(Number(tier) || 0)));
  buildFishIndex();
}

function paintFishIcons() {
  for (const canvas of document.querySelectorAll('#fish-index-body canvas[data-fish-icon]')) {
    const fish = fishingFishById(canvas.dataset.fishIcon);
    const ctx = canvas.getContext('2d');
    if (!fish || !ctx) continue;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    drawFishingIcon(ctx, fish, 60, 35, 60);
  }
}

function buildFishIndex() {
  const p = fishingState();
  const index = fishingIndex(p);
  const summary = fishingSummary(p);
  const summaryBox = $('fish-index-summary');
  if (summaryBox) {
    summaryBox.innerHTML = `
      <div><span>SPESIES</span><strong>${summary.discovered} / ${FISH_TOTAL}</strong><em>${summary.completion}% indeks</em></div>
      <div><span>TANGKAPAN</span><strong>${summary.catches}</strong><em>${summary.casts} lemparan</em></div>
      <div><span>REKOR BERAT</span><strong>${fishingKg(summary.bestKg)}</strong><em>${summary.bestFish ? esc(fishingFishById(summary.bestFish)?.name || '—') : 'belum ada'}</em></div>
      <div><span>KOIN</span><strong>${summary.coins}</strong><em>${summary.earned} total didapat</em></div>
    `;
  }
  const tabs = $('fish-index-tabs');
  if (tabs) {
    tabs.innerHTML = [0, 1, 2, 3, 4, 5].map((tier) => `<button class="fish-tab${fishIndexTab === tier ? ' active' : ''}" type="button" data-fish-tier="${tier}">${tier ? fishRarity(tier).name : `SEMUA ${FISH_TOTAL}`}</button>`).join('');
  }
  const body = $('fish-index-body');
  if (!body) return;
  const rows = fishIndexTab ? index.filter((row) => row.fish.tier === fishIndexTab) : index;
  body.innerHTML = rows.map((row) => {
    const fish = row.fish;
    return `<article class="fish-card tier-${fish.tier}${row.discovered ? '' : ' unknown'}">
      <div class="fish-card-art" style="--fish:${fish.body};--fish-accent:${fish.fin}">
        <canvas data-fish-icon="${fish.id}" width="240" height="140" role="img" aria-label="Gambar ${esc(fish.name)}"></canvas>
      </div>
      <div class="fish-card-body">
        <div class="fish-card-head">
          <h4>${esc(fish.name)}</h4>
          <span class="fish-rarity">${row.rarity.name}</span>
        </div>
        <p class="fish-card-note">${esc(fish.note)}</p>
        <div class="fish-meta">
          <span>TIPE<b>${FISH_SHAPE_LABELS[fish.shape] || fish.shape}</b></span>
          <span>BERAT<b>${fish.minKg}–${fish.maxKg} kg</b></span>
          <span>NILAI<b>${fish.value} koin</b></span>
          <span>TERBUKA<b>${row.count > 0 ? 'YA' : 'BELUM'}</b></span>
          <span>TERTANGKAP<b>${row.count}</b></span>
          <span>REKOR<b>${fishingKg(row.bestKg)}</b></span>
        </div>
        <div class="fish-odds">
          <span class="fish-odds-head">PELUANG PER UMPAN</span>
          ${row.chances.map((entry) => `<span class="fish-odds-chip${entry.baitId === row.bestBait ? ' best' : ''}">${esc(entry.baitName)}<b>${entry.chance}%</b></span>`).join('')}
        </div>
      </div>
    </article>`;
  }).join('');
  paintFishIcons();
}

function fairyStageStatus(state, index) {
  if (fairyStageCleared(state, index)) return 'cleared';
  return fairyStageUnlocked(state, index) ? 'available' : 'locked';
}

function buildFairyScreen() {
  const wrap = $('fairy-body');
  const p = fairyState();
  const summary = fairyProgressSummary(p);
  const box = $('fairy-summary');
  if (box) {
    box.innerHTML = `
      <div><span>TAHAP TUNTAS</span><strong>${summary.stagesCleared} / ${summary.stageTotal}</strong><em>${summary.bossesUnlocked ? 'gerbang bos terbuka' : '10 tahap sebelum bos'}</em></div>
      <div><span>BOS GUGUR</span><strong>${summary.bossesCleared} / ${summary.bossTotal}</strong><em>Gelora &amp; Sylvara</em></div>
      <div><span>PROGRES</span><strong>${summary.percent}%</strong><em>${FAIRY_NAME} — ${FAIRY_LOCAL_NAME}</em></div>
      <div><span>RUN</span><strong>${summary.runs}</strong><em>${summary.bestTime ? `rekor ${formatCourtTime(summary.bestTime)}` : 'belum ada rekor'}</em></div>
    `;
  }
  if (!wrap) return;
  wrap.innerHTML = `
    <section class="exp-section">
      <div class="exp-section-head">
        <h3>SEPULUH TAHAP TAMAN PERI</h3>
        <span>${summary.stagesCleared} / ${FAIRY_STAGE_COUNT} tuntas · tahap terbuka berurutan</span>
      </div>
      <p class="map-note">
        ${esc(FAIRY_SUBTITLE)}. Tahap terbuka satu per satu — kau harus melewati seluruh sepuluh
        tahap sebelum singgasana bos terbuka. Setiap tahap menyimpan progresnya sendiri.
      </p>
      <div class="fairy-stage-grid">
        ${FAIRY_STAGES.map((stage) => {
          const status = fairyStageStatus(p, stage.index);
          return `
            <article class="fairy-stage-card ${status}" style="--fairy-color:${FAIRY_ZONE.color}">
              <span class="fairy-stage-glyph" aria-hidden="true">${stage.glyph}</span>
              <div class="fairy-stage-copy">
                <h4>${stage.index + 1}. ${esc(stage.name)}</h4>
                <em>${esc(stage.subtitle)} · ${esc(stage.tag)}</em>
                <p>${esc(stage.hint)}</p>
                <div class="fairy-meta">
                  <span>MOB<b>${stage.enemies.length}</b></span>
                  <span>NPC<b>${stage.npc ? 'ADA' : '—'}</b></span>
                  <span>STATUS<b>${status === 'cleared' ? 'TUNTAS' : status === 'available' ? 'TERBUKA' : 'TERKUNCI'}</b></span>
                </div>
              </div>
              <button class="btn ${status === 'locked' ? 'btn-ghost' : 'btn-primary'} btn-compact" type="button"
                data-fairy-stage="${stage.index}" ${status === 'locked' ? 'disabled' : ''}>
                ${status === 'cleared' ? 'ULANGI' : status === 'available' ? 'MASUK' : 'KUNCI'}
              </button>
            </article>`;
        }).join('')}
      </div>
    </section>
    <section class="exp-section">
      <div class="exp-section-head">
        <h3>DUA BOS DI BALIK GERBANG KESEPULUH</h3>
        <span>${summary.bossesUnlocked ? 'terbuka' : 'selesaikan 10 tahap dulu'} · ${FAIRY_BOSSES.length} bos</span>
      </div>
      <p class="map-note">
        Slime magma Gelora menjaga kuali, lalu Peri Naga Spektral Sylvara menjaga singgasana.
        Keduanya memakai tema musik sendiri dan fase yang naik tiap sepertiga HP.
      </p>
      <div class="fairy-boss-grid">
        ${FAIRY_BOSSES.map((boss) => {
          const info = FAIRY_BOSS_INFO[boss.kind];
          const unlocked = fairyBossUnlocked(p, boss.id);
          const cleared = p.bosses?.[boss.id] === true;
          return `
            <article class="fairy-boss-card${unlocked ? '' : ' locked'}" style="--boss-color:${boss.color}">
              <span class="fairy-boss-glyph" aria-hidden="true">${boss.glyph}</span>
              <div>
                <h4>${esc(info.name)}</h4>
                <em>${esc(info.title)}</em>
                <p>${esc(info.localName)} · ${boss.phases} fase · ${boss.pattern.toUpperCase()}</p>
                <div class="fairy-meta">
                  <span>HP<b>${boss.maxHp}</b></span>
                  <span>FASE<b>${boss.phases}</b></span>
                  <span>STATUS<b>${cleared ? 'GUGUR' : unlocked ? 'MENANTI' : 'TERKUNCI'}</b></span>
                </div>
              </div>
              <button class="btn ${unlocked ? 'btn-primary' : 'btn-ghost'} btn-compact" type="button"
                data-fairy-boss="${boss.id}" ${unlocked ? '' : 'disabled'}>
                ${cleared ? 'ULANGI' : unlocked ? 'HADAPI' : 'KUNCI'}
              </button>
            </article>`;
        }).join('')}
      </div>
    </section>
  `;
  wrap.querySelectorAll('[data-fairy-stage]').forEach((button) => {
    button.addEventListener('click', () => startFairyStage(Number(button.dataset.fairyStage)));
  });
  wrap.querySelectorAll('[data-fairy-boss]').forEach((button) => {
    button.addEventListener('click', () => startFairyBoss(button.dataset.fairyBoss));
  });
}

function startFairyStage(stageIndex) {
  const p = fairyState();
  const index = Math.max(0, Math.min(FAIRY_STAGE_COUNT - 1, Math.floor(Number(stageIndex) || 0)));
  const room = FAIRY_STAGE_ROOMS[index];
  if (!room) return;
  if (!fairyStageUnlocked(p, index)) {
    showToast('Tahap itu masih terkunci. Selesaikan tahap sebelumnya dulu.', 2200);
    return;
  }
  audio.init();
  attempts = 1;
  coopGuestMode = false;
  coopGuestRoom = -1;
  activeRunKind = 'fairy';
  activeFairyStage = index;
  activeFairyBoss = null;
  activeCourtRoom = null;
  activeCourtTrial = null;
  activePackIndex = -1;
  activeExpansionIndex = null;
  activeModeId = null;
  activeTrialId = null;
  modeRunRewarded = false;
  packRunActive = false;
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  game.enterRoom(room.id);
  game.player.relic = true;
  game.ash = Math.max(game.ash, 40 + index * 12);
  recordFairyRun(p, 0, { won: false });
  fairyRunStartedAt = game.time;
  cutsceneSeen = new Set();
  postCreditTimer = -1;
  saveProgress();
  game.events.length = 0;
  started = true;
  paused = false;
  hunterShopOpen = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  beginStage(game.roomIndex, room.name);
  showBanner(room.name, room.subtitle);
  syncScreens();
  updateHud();
  showToast(`Taman Peri · tahap ${index + 1}/${FAIRY_STAGE_COUNT} — ${room.name}`, 2400);
}

function startFairyBoss(bossId) {
  const p = fairyState();
  const boss = FAIRY_BOSSES.find((entry) => entry.id === bossId);
  if (!boss) return;
  if (!fairyBossUnlocked(p, bossId)) {
    showToast('Tuntaskan sepuluh tahap Taman Peri dulu untuk membuka singgasana.', 2600);
    return;
  }
  const room = FAIRY_ROOM_BY_ID[boss.roomIndex];
  if (!room) return;
  audio.init();
  attempts = 1;
  coopGuestMode = false;
  coopGuestRoom = -1;
  activeRunKind = 'fairy';
  activeFairyStage = -1;
  activeFairyBoss = boss.id;
  activeCourtRoom = null;
  activeCourtTrial = null;
  activePackIndex = -1;
  activeExpansionIndex = null;
  activeModeId = null;
  activeTrialId = null;
  modeRunRewarded = false;
  packRunActive = false;
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  game.enterRoom(room.id);
  game.player.relic = true;
  game.ash = Math.max(game.ash, boss.id === 'dragon' ? 260 : 180);
  recordFairyRun(p, 0, { won: false });
  fairyRunStartedAt = game.time;
  saveProgress();
  game.events.length = 0;
  started = true;
  paused = false;
  hunterShopOpen = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  beginStage(game.roomIndex, boss.name);
  showBanner(boss.name, boss.title);
  syncScreens();
  updateHud();
  showToast(`Taman Peri · ${boss.localName} — ${boss.name}`, 2600);
  if (boss.id === 'dragon') playFinalBossCutscene();
}

function handleFairyBoss(ev) {
  const room = FAIRY_ROOM_BY_ID[ev.room];
  if (!room?.fairyBoss) return;
  const p = fairyState();
  const result = recordFairyBoss(p, room.fairyBoss);
  const elapsed = Math.max(0, game.time - fairyRunStartedAt);
  if (room.fairyBoss === 'dragon' && result.ok) {
    recordFairyRun(p, elapsed, { won: true });
    showToast(`SINGGASANA SAYAP TUNTAS · ${formatCourtTime(elapsed)} · Opus bebas`, 6000);
    queuePostCredit();
  }
  saveProgress();
}

function courtTrialHeal(amount) {
  const p = game.player;
  if (!p) return;
  const heal = Math.max(0, Number(amount) || 0) * p.maxHp;
  p.hp = Math.min(p.maxHp, p.hp + heal);
  p.invuln = Math.max(p.invuln, 0.8);
}

function finishCourtTrial() {
  if (!activeCourtTrial) return;
  const trial = COURT_TRIAL_BY_ID[activeCourtTrial.id];
  const seconds = Math.max(0, game.time - activeCourtTrial.startedAt);
  activeCourtTrial = null;
  const result = recordCourtTrial(courtState(), trial.id, seconds, { ngPlus: courtState().ngPlus });
  if (result.ok) {
    courtTrialResult = { ...result, seconds };
    saveProgress();
  }
  showCourt('journey');
  if (result.ok) {
    showToast(`Tantangan tuntas · ${trial.name} · ${formatCourtTime(seconds)}${result.isBest ? ' · REKOR BARU' : ''}${result.firstClear ? ` · +✦ ${result.marks}` : ''}`, 4600);
  }
}

function handleCourtTrialBoss(ev, room) {
  const trial = COURT_TRIAL_BY_ID[activeCourtTrial.id];
  if (!trial) { activeCourtTrial = null; return; }
  if (trial.id === 'boss_rush') {
    const nextIndex = activeCourtTrial.index + 1;
    if (nextIndex >= trial.order.length) {
      finishCourtTrial();
      return;
    }
    activeCourtTrial.index = nextIndex;
    const nextRoom = COURT_ROOMS[trial.order[nextIndex]];
    courtTrialHeal(trial.heal);
    game.state = 'playing';
    game.awaitingBlessing = false;
    game.blessingChoices = null;
    game.enterRoom(nextRoom.id);
    activeCourtRoom = nextRoom.id;
    closeDialogue(true);
    showToast(`Penjaga ${nextIndex + 1} / ${trial.order.length} — ${nextRoom.name}`, 2400);
    saveProgress();
    return;
  }
  if (trial.id === 'glass_gauntlet' && room.id === COURT_ROOMS[trial.end]?.id) {
    finishCourtTrial();
  }
}

function handleCourtBoss(ev) {
  const room = COURT_ROOM_BY_ID[ev.room];
  if (!room) return;
  if (activeCourtTrial) {
    handleCourtTrialBoss(ev, room);
    return;
  }
  const p = courtState();
  const local = ev.room - COURT_ROOM_START;
  const result = recordCourtClear(p, local, { boss: true, mini: !!ev.mini, kind: ev.kind });
  if (result.firstClear) {
    showToast(`Ruang court tuntas · +✦ ${result.marks}${result.quests?.length ? ' · misi penghuni maju' : ''}`, 2600);
    courtToastQuest(result.quests);
  }
  if (room.courtTemplate === 'boss' && room.courtZoneIndex === COURT_ZONES.length - 1) {
    p.completion = true;
    showToast('The Hollow Court tuntas — Perapian Agung menyala kembali.', 4200);
  }
  saveProgress();
  if (menuView === 'court') buildCourtScreen();
}

function applyAtlasConsumableToGame(item) {
  if (!item || !game.player) return;
  const p = game.player;
  if (item.heal) p.hp = Math.min(p.maxHp, p.hp + item.heal);
  if (item.buff) {
    if (!atlasBuffBase) atlasBuffBase = { damage: p.damageMult, speed: p.speedMult };
    atlasBuffTimer = Math.max(atlasBuffTimer, Number(item.buff.duration) || 8);
    p.damageMult = atlasBuffBase.damage * (1 + (Number(item.buff.damage) || 0));
    p.speedMult = atlasBuffBase.speed * (1 + (Number(item.buff.speed) || 0));
  }
  if (item.regen) {
    atlasRegenTimer = Math.max(atlasRegenTimer, Number(item.regen.duration) || 6);
    atlasRegenAmount = Math.max(atlasRegenAmount, Number(item.regen.hp) || 3);
  }
  if (item.damage) {
    const radius = Number(item.radius) || 80;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    for (const enemy of game.enemies) {
      const ex = enemy.x + enemy.w / 2;
      const ey = enemy.y + enemy.h / 2;
      if (Math.hypot(ex - cx, ey - cy) <= radius) {
        game.hurtEnemy(enemy, { dmg: item.damage, knock: 220, name: item.id }, ex >= cx ? 1 : -1);
      }
    }
  }
  if (item.utility === 'shield') {
    p.invuln = Math.max(p.invuln, Number(item.duration) || 5);
  } else if (item.utility === 'haste') {
    if (!atlasBuffBase) atlasBuffBase = { damage: p.damageMult, speed: p.speedMult };
    atlasBuffTimer = Math.max(atlasBuffTimer, Number(item.duration) || 5);
    p.speedMult = atlasBuffBase.speed * 1.25;
  } else if (item.utility === 'purify') {
    p.hp = Math.min(p.maxHp, p.hp + 8);
  }
}

function useAtlasQuickSlot(slotIndex) {
  if (activeRunKind !== 'atlas' || !started || paused || menuView !== 'none' || game.state !== 'playing') return false;
  if (atlasQuickCooldown > 0) return false;
  const p = atlasState();
  const itemId = p.quickSlots?.[slotIndex];
  const item = ATLAS_CONSUMABLE_BY_ID[itemId];
  if (!item) {
    showToast(`Slot cepat ${slotIndex + 1} kosong.`, 1400);
    return false;
  }
  const result = useAtlasConsumable(p, itemId);
  if (!result.ok) {
    showToast(`${item.name} habis.`, 1400);
    return false;
  }
  applyAtlasConsumableToGame(item);
  atlasQuickCooldown = 0.9;
  saveProgress();
  renderAtlasQuickbar();
  updateHud();
  showToast(`Dipakai: ${item.name} · sisa ${result.remaining}`, 1500);
  return true;
}

function renderAtlasQuickbar() {
  const bar = $('atlas-quickbar');
  if (!bar) return;
  const show = activeRunKind === 'atlas' && started && menuView === 'none' && !spectating;
  bar.classList.toggle('hidden', !show);
  if (!show) {
    bar.innerHTML = '';
    atlasQuickCache = '';
    return;
  }
  const p = atlasState();
  const signature = (p.quickSlots || []).map((id) => `${id || ''}:${atlasConsumableCount(p, id)}`).join('|');
  if (signature === atlasQuickCache) return;
  atlasQuickCache = signature;
  bar.innerHTML = ATLAS_QUICK_SLOTS.map((slot) => {
    const itemId = p.quickSlots?.[slot.index];
    const item = ATLAS_CONSUMABLE_BY_ID[itemId];
    const count = atlasConsumableCount(p, itemId);
    return `
      <button class="atlas-quick-slot${item ? '' : ' empty'}" type="button"
        data-atlas-quick-use="${slot.index}" title="${esc(item?.name || 'Slot kosong')}">
        <b>${slot.index + 1}</b>
        <span>${esc(item ? item.name : 'KOSONG')}</span>
        <em>${item ? `x${count}` : ''}</em>
      </button>`;
  }).join('');
}

function tickAtlasRun(dt) {
  if (activeRunKind !== 'atlas') return;
  if (atlasQuickCooldown > 0) atlasQuickCooldown = Math.max(0, atlasQuickCooldown - dt);
  if (atlasBuffTimer > 0) {
    atlasBuffTimer = Math.max(0, atlasBuffTimer - dt);
    if (atlasBuffTimer === 0 && atlasBuffBase && game.player) {
      game.player.damageMult = atlasBuffBase.damage;
      game.player.speedMult = atlasBuffBase.speed;
      atlasBuffBase = null;
    }
  }
  if (atlasRegenTimer > 0 && game.player) {
    atlasRegenTimer = Math.max(0, atlasRegenTimer - dt);
    if (atlasRegenAmount > 0) {
      game.player.hp = Math.min(game.player.maxHp, game.player.hp + atlasRegenAmount * dt);
    }
    if (atlasRegenTimer === 0) atlasRegenAmount = 0;
  }
}

const MODE_LEVEL_INDEX = {
  echo_trials: 7,
  boss_rush: 19,
  horde: 20,
  gauntlet: 30,
  hunt: 48,
  relic_hunt: 57,
  mirror: 69,
  endless: 80,
};

function startExpansionMode(modeId) {
  const e = syncExpansionUnlocks();
  const mode = MODE_BY_ID[modeId];
  if (!mode || mode.unlockChapter > e.unlockedChapter) return;
  startExpansionLevel(MODE_LEVEL_INDEX[modeId] ?? 0, { modeId });
}

function startExpansionTrial(trialId) {
  const e = syncExpansionUnlocks();
  const trial = ENDGAME_TRIALS.find((entry) => entry.id === trialId);
  if (!trial || !e.flags.campaignComplete) return;
  const index = trialId === 'trial_thornveil' ? 7 : trialId === 'trial_memory' ? 68 : 99;
  startExpansionLevel(index, { trialId });
}

function completeModeRun() {
  if (!activeModeId || modeRunRewarded) return;
  const e = syncExpansionUnlocks();
  const mode = MODE_BY_ID[activeModeId];
  if (!mode) return;
  modeRunRewarded = true;
  const state = e.modes[mode.id] || { completions: 0, best: 0 };
  state.completions = (Number(state.completions) || 0) + 1;
  state.best = Math.max(Number(state.best) || 0, 1);
  e.modes[mode.id] = state;
  if (mode.reward?.echoes) e.echoes += mode.reward.echoes;
  if (mode.reward?.skin) grantSkin(mode.reward.skin);
  applyQuestProgress(e, 'mode', { mode: mode.id });
  applyEventProgress(e, 'mode', { mode: mode.id });
  saveProgress();
  showToast(`Mode ${mode.name} tuntas${mode.reward?.echoes ? ` · +${mode.reward.echoes} Gema` : ''}.`, 3600);
}

function completeTrialRun() {
  if (!activeTrialId) return;
  const e = syncExpansionUnlocks();
  const trial = ENDGAME_TRIALS.find((entry) => entry.id === activeTrialId);
  if (!trial) return;
  const key = `trial_${trial.id}`;
  if (e.flags[key]) return;
  e.flags[key] = true;
  if (trial.reward?.echoes) e.echoes += trial.reward.echoes;
  if (trial.reward?.skin) grantSkin(trial.reward.skin);
  saveProgress();
  showToast(`Ujian ${trial.name} tuntas${trial.reward?.echoes ? ` · +${trial.reward.echoes} Gema` : ''}.`, 4000);
}

function markExpansionCleared(localIndex) {
  const e = syncExpansionUnlocks();
  if (!Number.isInteger(localIndex) || localIndex < 0 || localIndex >= TOTAL_LEVELS) return;
  const level = EXPANSION_LEVELS[localIndex];
  const firstClear = !e.cleared[localIndex];
  if (firstClear) {
    e.cleared[localIndex] = true;
    e.stats.levels = (Number(e.stats.levels) || 0) + 1;
    applyQuestProgress(e, 'level', { level: localIndex });
    applyEventProgress(e, 'level', { level: localIndex });
  }
  const chapterIndex = level.chapterIndex;
  const chapterProgress = expansionChapterProgress(e, chapterIndex);
  if (chapterProgress.cleared >= LEVELS_PER_CHAPTER && !e.chapterCleared[chapterIndex]) {
    e.chapterCleared[chapterIndex] = true;
    e.unlockedChapter = Math.min(CHAPTERS.length - 1, Math.max(e.unlockedChapter, chapterIndex + 1));
    const chapterSkin = CHAPTER_COMPLETION_SKINS[chapterIndex];
    if (chapterSkin) grantSkin(chapterSkin);
    e.echoes += 60 + chapterIndex * 25;
    applyQuestProgress(e, 'chapter', { chapter: chapterIndex });
    applyEventProgress(e, 'chapter', { chapter: chapterIndex });
    if (chapterIndex === CHAPTERS.length - 1) {
      e.flags.campaignComplete = true;
      e.flags.ngPlusUnlocked = true;
      grantSkin('skin_forgotten');
    }
    saveProgress();
    showToast(`Bab ${CHAPTERS[chapterIndex].numeral} tuntas — ${CHAPTERS[chapterIndex].name}.`, 3800);
  }
  if (firstClear) saveProgress();
  if (menuView === 'expansion') buildExpansionScreen();
  completeModeRun();
  completeTrialRun();
}

function handleExpansionBoss(localIndex, ev) {
  const e = syncExpansionUnlocks();
  const level = EXPANSION_LEVELS[localIndex];
  if (!level) return;
  if (ev.mini) e.stats.miniBosses = (Number(e.stats.miniBosses) || 0) + 1;
  else e.stats.bosses = (Number(e.stats.bosses) || 0) + 1;
  applyQuestProgress(e, ev.mini ? 'miniBoss' : 'boss', { chapter: level.chapterIndex });
  applyEventProgress(e, ev.mini ? 'miniBoss' : 'boss', { chapter: level.chapterIndex });
  saveProgress();
  markExpansionCleared(localIndex);
}

function handleExpansionCollectible(ev) {
  if (!ev?.id) return;
  const e = syncExpansionUnlocks();
  if (e.collectibles.includes(ev.id)) return;
  e.collectibles.push(ev.id);
  e.stats.collectibles = (Number(e.stats.collectibles) || 0) + 1;
  applyQuestProgress(e, 'collectible', { category: ev.category });
  applyEventProgress(e, 'collectible', { category: ev.category });
  saveProgress();
  showToast(`Koleksi baru: ${ev.name} · ${ev.categoryName}`, 2600);
  if (menuView === 'expansion') buildExpansionScreen();
}

function handleExpansionEcho(ev) {
  const amount = Math.max(0, Number(ev?.amount) || 0);
  if (!amount) return;
  const e = syncExpansionUnlocks();
  e.echoes += amount;
  saveProgress();
}

function handleExpansionCampaignComplete() {
  const e = syncExpansionUnlocks();
  e.flags.campaignComplete = true;
  e.flags.ngPlusUnlocked = true;
  grantSkin('skin_forgotten');
  const bonus = grantSkillPoints(progress.skills, SKILL_POINTS_CAMPAIGN, 'campaign:complete');
  saveProgress();
  applySkillsToGame();
  showToast(
    `Kampanye Echoes selesai — New Game Plus terbuka. +${bonus.granted || SKILL_POINTS_CAMPAIGN} SKILL POINT`,
    4600,
  );
}

function claimQuest(questId) {
  const e = syncExpansionUnlocks();
  const quest = QUEST_BY_ID[questId];
  const state = e.quests[questId];
  if (!quest || !state || state.status !== 'ready') return;
  state.status = 'done';
  if (quest.reward?.echoes) e.echoes += quest.reward.echoes;
  if (quest.reward?.skin) grantSkin(quest.reward.skin);
  if (quest.flag) e.flags[quest.flag] = true;
  saveProgress();
  showToast(`Quest tuntas: ${quest.title}${quest.reward?.echoes ? ` · +${quest.reward.echoes} Gema` : ''}.`, 3400);
  buildExpansionScreen();
}

function buyHavenUpgrade(upgradeId) {
  const e = syncExpansionUnlocks();
  const upgrade = UPGRADE_BY_ID[upgradeId];
  const haven = e.settlements.thornveil;
  if (!upgrade || !haven) return;
  const tier = Number(haven.upgrades[upgradeId]) || 0;
  if (tier >= upgrade.maxTier) return;
  const cost = upgrade.costs[tier];
  if (e.echoes < cost) {
    showToast(`Gema tidak cukup — butuh ${cost}.`, 2200);
    return;
  }
  e.echoes -= cost;
  haven.upgrades[upgradeId] = tier + 1;
  haven.tier = havenTier(e);
  haven.visited = true;
  applyQuestProgress(e, 'upgrade', { upgrade: upgradeId, tier: tier + 1 });
  applyEventProgress(e, 'upgrade', { upgrade: upgradeId, tier: tier + 1 });
  saveProgress();
  showToast(`${upgrade.name} tingkat ${tier + 1} — ${upgrade.effects[tier]}.`, 3000);
  buildExpansionScreen();
}

function equipSkin(skinId) {
  const e = syncExpansionUnlocks();
  if (skinId && !e.cosmetics.includes(skinId)) return;
  e.selectedSkin = e.selectedSkin === skinId ? null : skinId;
  applySkinToGame();
  saveProgress();
  showToast(
    e.selectedSkin ? `Kulit dipakai: ${SKIN_BY_ID[e.selectedSkin]?.name || e.selectedSkin}` : 'Kulit dilepas.',
    2200,
  );
  buildExpansionScreen();
}

function claimEventMission(eventId, missionId) {
  const e = syncExpansionUnlocks();
  const event = EVENT_BY_ID[eventId];
  const state = e.events[eventId];
  const mission = event?.missions.find((entry) => entry.id === missionId);
  if (!event || !state || !mission) return;
  if (state.missionsClaimed.includes(missionId) || !eventMissionReady(state, mission)) return;
  state.missionsClaimed.push(missionId);
  saveProgress();
  showToast(`Misi event: ${mission.name} · +${mission.points} poin.`, 3000);
  buildExpansionScreen();
}

function claimEventTier(eventId, points) {
  const e = syncExpansionUnlocks();
  const event = EVENT_BY_ID[eventId];
  const state = e.events[eventId];
  const tier = event?.rewardTrack.find((entry) => entry.points === points);
  if (!event || !state || !tier) return;
  if (state.tiersClaimed.includes(points) || !eventTierUnlocked(state, event, tier)) return;
  state.tiersClaimed.push(points);
  if (tier.reward?.echoes) e.echoes += tier.reward.echoes;
  if (tier.reward?.skin) grantSkin(tier.reward.skin);
  if (tier.reward?.item) {
    e.stash[tier.reward.item] = (Number(e.stash[tier.reward.item]) || 0) + 1;
  }
  saveProgress();
  showToast(`Hadiah event: ${tier.name}.`, 3000);
  buildExpansionScreen();
}

function buyEventShop(eventId, itemId) {
  const e = syncExpansionUnlocks();
  const event = EVENT_BY_ID[eventId];
  const state = e.events[eventId];
  const item = event?.shop.find((entry) => entry.id === itemId);
  if (!event || !state || !item) return;
  if (state.shopPurchased.includes(itemId)) return;
  const available = eventPoints(state, event) - (Number(state.spent) || 0);
  if (available < item.cost) {
    showToast(`Poin event tidak cukup — butuh ${item.cost}.`, 2200);
    return;
  }
  state.spent = (Number(state.spent) || 0) + item.cost;
  state.shopPurchased.push(itemId);
  if (item.echoes) e.echoes += item.echoes;
  if (item.skin) grantSkin(item.skin);
  saveProgress();
  showToast(`Ditukar: ${item.name}.`, 2600);
  buildExpansionScreen();
}

// ── expansion hub UI ─────────────────────────────────────────────────────
const EXP_KIND_LABEL = {
  standard: 'STANDAR',
  special: 'LINGKUNGAN',
  elite: 'ELITE',
  boss: 'BOSS BESAR',
};

function expBar(value, max) {
  const pct = max > 0 ? clamp(Math.round((value / max) * 100), 0, 100) : 0;
  return `<span class="exp-bar"><i style="width:${pct}%"></i></span>`;
}

function expBossForLevel(level) {
  return level.boss ? EXPANSION_BOSS_INFO[level.boss] || null : null;
}

function expQuestAmount(quest) {
  return quest.objective.amount || quest.objective.tier || 1;
}

function buildExpansionScreen() {
  const wrap = $('expansion-body');
  if (!wrap) return;
  const e = syncExpansionUnlocks();
  const summary = expansionCompletion(e);
  const summaryEl = $('expansion-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div><span>KAMPANYE</span><strong>${summary.cleared} / ${summary.total}</strong><em>${summary.pct}% tuntas</em></div>
      <div><span>GEMA</span><strong>✦ ${e.echoes}</strong><em>mata uang abadi</em></div>
      <div><span>BAB TERBUKA</span><strong>${Math.min(CHAPTERS.length, (e.unlockedChapter || 0) + 1)} / ${CHAPTERS.length}</strong><em>${CHAPTERS[clamp(e.unlockedChapter, 0, CHAPTERS.length - 1)].name}</em></div>
      <div><span>KOLEKSI</span><strong>${e.collectibles.length}</strong><em>${e.cosmetics.length} kulit dimiliki</em></div>
    `;
  }
  document.querySelectorAll('#expansion-tabs [data-tab]').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === expansionTab);
  });
  if (expansionTab === 'haven') buildHavenTab(e, wrap);
  else if (expansionTab === 'chronicle') buildChronicleTab(e, wrap);
  else if (expansionTab === 'wardrobe') buildWardrobeTab(e, wrap);
  else buildCampaignTab(e, wrap);
}

function buildCampaignTab(e, wrap) {
  const chapterIndex = clamp(Number(expansionChapter) || 0, 0, CHAPTERS.length - 1);
  expansionChapter = chapterIndex;
  const chapter = CHAPTERS[chapterIndex];
  const chapterProgress = expansionChapterProgress(e, chapterIndex);
  const ngUnlocked = !!e.flags.ngPlusUnlocked;
  const levels = EXPANSION_LEVELS.slice(
    chapterIndex * LEVELS_PER_CHAPTER,
    chapterIndex * LEVELS_PER_CHAPTER + LEVELS_PER_CHAPTER,
  );
  const modesDone = REPEATABLE_MODES.filter((mode) => (e.modes[mode.id]?.completions || 0) > 0).length;
  const trialsDone = ENDGAME_TRIALS.filter((trial) => e.flags[`trial_${trial.id}`]).length;

  wrap.innerHTML = `
    <section class="exp-section">
      <div class="exp-section-head">
        <h3>KESULITAN</h3>
        <span>${esc(DIFFICULTY_BY_ID[e.difficulty]?.name || 'Normal')} · hadiah ×${DIFFICULTY_BY_ID[e.difficulty]?.reward || 1}</span>
      </div>
      <div class="exp-difficulty-row">
        ${DIFFICULTIES.map((difficulty) => `
          <button class="exp-diff${difficulty.id === e.difficulty ? ' active' : ''}" type="button"
            data-action="difficulty" data-difficulty="${difficulty.id}">
            <strong>${esc(difficulty.name)}</strong>
            <span>${esc(difficulty.subtitle)}</span>
            <em>${esc(difficulty.desc)}</em>
          </button>`).join('')}
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>MODIFIER TANTANGAN</h3>
        <span>${e.modifiers.length} aktif · opsional</span>
      </div>
      <div class="exp-chip-row">
        ${CHALLENGE_MODIFIERS.map((modifier) => `
          <button class="exp-chip${e.modifiers.includes(modifier.id) ? ' active' : ''}" type="button"
            data-action="modifier" data-modifier="${modifier.id}" title="${esc(modifier.desc)}">
            <b>${modifier.glyph}</b> ${esc(modifier.name)}
          </button>`).join('')}
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>NEW GAME PLUS</h3>
        <span>${ngUnlocked ? 'terbuka' : 'selesaikan kampanye untuk membuka'}</span>
      </div>
      <div class="exp-ng-row">
        ${NG_PLUS_TIERS.map((tier) => {
          const locked = tier.tier > 0 && !ngUnlocked;
          return `<button class="exp-ng${e.ngPlus === tier.tier ? ' active' : ''}${locked ? ' locked' : ''}" type="button"
            data-action="ngplus" data-tier="${tier.tier}" ${locked ? 'disabled' : ''}>
            <strong>${tier.tier === 0 ? 'NG' : `NG+${tier.tier}`}</strong>
            <span>${esc(tier.name)}</span>
            <em>${esc(tier.desc)}</em>
          </button>`;
        }).join('')}
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>PILIH BAB</h3>
        <span>${chapterProgress.cleared} / ${chapterProgress.total} level tuntas</span>
      </div>
      <div class="exp-chapter-row">
        ${CHAPTERS.map((entry) => `
          <button class="exp-chapter-btn${entry.index === chapterIndex ? ' active' : ''}${entry.index > e.unlockedChapter ? ' locked' : ''}" type="button"
            data-action="chapter" data-chapter="${entry.index}" style="--accent:${entry.accent}">
            <b>${entry.numeral}</b>
            <span>${esc(entry.name)}</span>
            <em>${entry.index > e.unlockedChapter ? 'TERKUNCI' : `${expansionChapterProgress(e, entry.index).cleared}/10`}</em>
          </button>`).join('')}
      </div>
    </section>

    <section class="exp-chapter-panel" style="--accent:${chapter.accent}">
      <header class="exp-chapter-head">
        <span class="exp-chapter-glyph">${chapter.glyph}</span>
        <div>
          <p class="eyebrow">BAB ${chapter.numeral} · ${esc(chapter.subtitle)}</p>
          <h3>${esc(chapter.name)}</h3>
          <p>${esc(chapter.tagline)}</p>
        </div>
        <div class="exp-chapter-progress">
          <strong>${chapterProgress.cleared}/${chapterProgress.total}</strong>
          ${expBar(chapterProgress.cleared, chapterProgress.total)}
          <span>${esc(BIOMES[chapter.biome]?.weather || '')}</span>
        </div>
      </header>
      <p class="exp-chapter-desc">${esc(chapter.desc)}</p>
      <div class="exp-level-grid">
        ${levels.map((level) => {
          const unlocked = expansionLevelUnlocked(e, level.localIndex);
          const cleared = !!e.cleared[level.localIndex];
          const boss = expBossForLevel(level);
          return `
            <article class="exp-level${cleared ? ' cleared' : ''}${unlocked ? '' : ' locked'}" style="--accent:${level.accent}">
              <div class="exp-level-top">
                <span class="exp-level-num">${level.chapterLevel}</span>
                <span class="exp-kind kind-${level.kind}">${EXP_KIND_LABEL[level.kind] || level.kind}</span>
                ${cleared ? '<span class="exp-clear">✓</span>' : ''}
              </div>
              <h4>${esc(level.name)}</h4>
              <span class="exp-level-sub">${esc(level.subtitle)}</span>
              <p>${esc(level.hint)}</p>
              ${boss ? `<span class="exp-boss-tag">${level.kind === 'boss' ? 'BOSS' : 'MINI-BOSS'} · ${esc(boss.name)} — ${esc(boss.title)}</span>` : ''}
              <div class="exp-level-meta">
                <span>${esc(level.biomeName)}</span>
                <span>✦ ${level.echoReward}</span>
              </div>
              <button class="btn ${unlocked ? 'btn-primary' : 'btn-ghost'} btn-small exp-start" type="button"
                data-action="start-level" data-level="${level.localIndex}" ${unlocked ? '' : 'disabled'}>
                ${unlocked ? (cleared ? 'ULANGI LEVEL' : 'MULAI LEVEL') : 'TERKUNCI'}
              </button>
            </article>`;
        }).join('')}
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>MODE BERULANG</h3>
        <span>${modesDone} / ${REPEATABLE_MODES.length} pernah tuntas</span>
      </div>
      <div class="exp-mode-grid">
        ${REPEATABLE_MODES.map((mode) => {
          const locked = mode.unlockChapter > e.unlockedChapter;
          const state = e.modes[mode.id] || { completions: 0, best: 0 };
          return `
            <article class="exp-mode${locked ? ' locked' : ''}">
              <div class="exp-mode-head">
                <span class="exp-mode-glyph">${mode.glyph}</span>
                <div><h4>${esc(mode.name)}</h4><span>${esc(mode.subtitle)}</span></div>
              </div>
              <p>${esc(mode.desc)}</p>
              <div class="exp-mode-meta">
                <span>${esc(mode.duration)}</span>
                <span>${state.completions}× tuntas</span>
                <span>✦ ${mode.reward?.echoes || 0}</span>
              </div>
              <button class="btn ${locked ? 'btn-ghost' : 'btn-primary'} btn-small" type="button"
                data-action="start-mode" data-mode="${mode.id}" ${locked ? 'disabled' : ''}>
                ${locked ? `TERBUKA DI BAB ${mode.unlockChapter + 1}` : 'MULAI MODE'}
              </button>
            </article>`;
        }).join('')}
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>UJIAN AKHIR</h3>
        <span>${e.flags.campaignComplete ? `${trialsDone} / ${ENDGAME_TRIALS.length} tuntas` : 'selesaikan kampanye'}</span>
      </div>
      <div class="exp-mode-grid">
        ${ENDGAME_TRIALS.map((trial) => {
          const cleared = !!e.flags[`trial_${trial.id}`];
          const locked = !e.flags.campaignComplete;
          return `
            <article class="exp-mode trial${cleared ? ' cleared' : ''}${locked ? ' locked' : ''}">
              <div class="exp-mode-head">
                <span class="exp-mode-glyph">${trial.glyph}</span>
                <div><h4>${esc(trial.name)}</h4><span>${cleared ? 'TUNTAS' : 'UJIAN'}</span></div>
              </div>
              <p>${esc(trial.desc)}</p>
              <div class="exp-mode-meta"><span>✦ ${trial.reward?.echoes || 0}</span>${trial.reward?.skin ? `<span>${esc(SKIN_BY_ID[trial.reward.skin]?.name || 'Kulit')}</span>` : ''}</div>
              <button class="btn ${locked ? 'btn-ghost' : 'btn-primary'} btn-small" type="button"
                data-action="start-trial" data-trial="${trial.id}" ${locked ? 'disabled' : ''}>
                ${locked ? 'TERKUNCI' : cleared ? 'ULANGI UJIAN' : 'MULAI UJIAN'}
              </button>
            </article>`;
        }).join('')}
      </div>
    </section>
  `;
}

function buildHavenTab(e, wrap) {
  const haven = e.settlements.thornveil;
  const tier = havenTier(e);
  const bonus = havenBonus(e);
  const npc = NPC_BY_ID[havenNpcId] || HAVEN_NPCS[0];
  const quest = npc.questId ? QUEST_BY_ID[npc.questId] : null;
  const questState = quest ? e.quests[quest.id] : null;
  const lines = dialogueForNpc(npc, {
    chapter: e.unlockedChapter,
    questDone: questState?.status === 'done',
    flag: !!(quest && e.flags[quest.flag]),
  });
  const tierNames = ['Berlindung', 'Tumbuh', 'Berakar', 'Berkilau'];
  const totalUpgradeTiers = HAVEN_UPGRADES.reduce(
    (sum, upgrade) => sum + (Number(haven.upgrades?.[upgrade.id]) || 0),
    0,
  );
  const maxUpgradeTiers = HAVEN_UPGRADES.reduce((sum, upgrade) => sum + upgrade.maxTier, 0);
  const readyQuests = QUESTS.filter((entry) => e.quests[entry.id]?.status === 'ready').length;

  wrap.innerHTML = `
    <section class="exp-haven-hero">
      <span class="exp-haven-glyph">⌂</span>
      <div>
        <p class="eyebrow">PERMUKIMAN PERMANEN · ${esc(SETTLEMENT_BY_ID.thornveil.subtitle)}</p>
        <h3>Thornveil Haven</h3>
        <p>${esc(SETTLEMENT_BY_ID.thornveil.desc)}</p>
      </div>
      <div class="exp-haven-tier">
        <span>TAHAP ${tier + 1}</span>
        <strong>${tierNames[tier]}</strong>
        <em>${totalUpgradeTiers}/${maxUpgradeTiers} peningkatan</em>
      </div>
    </section>

    <div class="exp-haven-stats">
      <div><span>DAMAGE</span><strong>+${Math.round(bonus.damage * 100)}%</strong></div>
      <div><span>MAX HP</span><strong>+${bonus.maxHp}</strong></div>
      <div><span>FLASK</span><strong>+${bonus.flasks}</strong></div>
      <div><span>ABU &amp; GEMA</span><strong>+${Math.round(bonus.gain * 100)}%</strong></div>
      <div><span>PENYEMBUHAN</span><strong>+${bonus.heal}</strong></div>
      <div><span>QUEST SIAP</span><strong>${readyQuests}</strong></div>
    </div>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>PENDUDUK HAVEN</h3>
        <span>10 NPC tetap · dialog mengikuti progres</span>
      </div>
      <div class="exp-npc-grid">
        ${HAVEN_NPCS.map((entry) => `
          <button class="exp-npc${entry.id === havenNpcId ? ' active' : ''}" type="button"
            data-action="haven-npc" data-npc="${entry.id}">
            <span>${entry.glyph}</span>
            <strong>${esc(entry.name)}</strong>
            <em>${esc(entry.role)}</em>
            ${e.quests[entry.questId]?.status === 'ready' ? '<b class="exp-npc-ready">!</b>' : ''}
          </button>`).join('')}
      </div>
    </section>

    <section class="exp-dialogue">
      <div class="exp-dialogue-head">
        <span>${npc.glyph}</span>
        <div><h4>${esc(npc.name)}</h4><em>${esc(npc.role)}</em></div>
        <b>${esc(npc.chapterReq > e.unlockedChapter ? 'BELUM TERBUKA' : 'DI THORNVEIL')}</b>
      </div>
      <p class="exp-dialogue-desc">${esc(npc.desc)}</p>
      <div class="exp-dialogue-lines">
        ${lines.map((line) => `<p>“${esc(line)}”</p>`).join('')}
      </div>
      ${quest ? `
        <div class="exp-dialogue-quest">
          <div><span>QUEST</span><strong>${esc(quest.title)}</strong><p>${esc(quest.desc)}</p></div>
          <div class="exp-dialogue-quest-state">
            ${questState?.status === 'ready'
              ? `<button class="btn btn-primary btn-small" type="button" data-action="claim-quest" data-quest="${quest.id}">AMBIL HADIAH</button>`
              : questState?.status === 'done'
                ? '<span class="exp-done">SELESAI</span>'
                : `<span>${questState?.status === 'active' ? 'BERLANGSUNG' : 'TERKUNCI'}</span>`}
          </div>
        </div>` : ''}
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>FASILITAS PERMANEN</h3>
        <span>Gema abadi · efek berlaku di semua run</span>
      </div>
      <div class="exp-upgrade-grid">
        ${HAVEN_UPGRADES.map((upgrade) => {
          const current = Number(haven.upgrades?.[upgrade.id]) || 0;
          const max = current >= upgrade.maxTier;
          const cost = max ? 0 : upgrade.costs[current];
          const canBuy = !max && e.echoes >= cost;
          return `
            <article class="exp-upgrade">
              <div class="exp-upgrade-head">
                <span>${upgrade.glyph}</span>
                <div><h4>${esc(upgrade.name)}</h4><p>${esc(upgrade.desc)}</p></div>
              </div>
              <div class="exp-pips">${Array.from({ length: upgrade.maxTier }, (_, i) => `<i class="${i < current ? 'on' : ''}"></i>`).join('')}</div>
              <div class="exp-upgrade-foot">
                <span>${current > 0 ? esc(upgrade.effects[current - 1]) : 'Belum dibangun'}</span>
                ${max ? '<b class="exp-max">MAKS</b>' : `<button class="btn btn-small ${canBuy ? 'btn-primary' : 'btn-ghost'}" type="button" data-action="buy-upgrade" data-upgrade="${upgrade.id}" ${canBuy ? '' : 'disabled'}>✦ ${cost}</button>`}
              </div>
            </article>`;
        }).join('')}
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>QUEST THORNVEIL</h3>
        <span>${readyQuests} siap diambil</span>
      </div>
      <div class="exp-quest-list">
        ${QUESTS.map((entry) => {
          const state = e.quests[entry.id] || { status: 'locked', progress: 0 };
          const amount = expQuestAmount(entry);
          const ready = state.status === 'ready';
          const done = state.status === 'done';
          return `
            <article class="exp-quest${done ? ' done' : ''}${ready ? ' ready' : ''}">
              <div class="exp-quest-main">
                <span>${esc(NPC_BY_ID[entry.npc]?.name || entry.npc)}</span>
                <h4>${esc(entry.title)}</h4>
                <p>${esc(entry.desc)}</p>
              </div>
              <div class="exp-quest-progress">
                <span>${Math.min(state.progress, amount)} / ${amount}</span>
                ${expBar(state.progress, amount)}
              </div>
              ${ready
                ? `<button class="btn btn-primary btn-small" type="button" data-action="claim-quest" data-quest="${entry.id}">AMBIL HADIAH</button>`
                : done
                  ? '<span class="exp-done">SELESAI</span>'
                  : `<span class="exp-quest-status">${state.status === 'active' ? 'BERLANGSUNG' : 'TERKUNCI'}</span>`}
            </article>`;
        }).join('')}
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>POS TERBUKA</h3>
        <span>${SETTLEMENTS.filter((entry) => e.settlements[entry.id]?.unlocked).length} / ${SETTLEMENTS.length} permukiman</span>
      </div>
      <div class="exp-outpost-grid">
        ${SETTLEMENTS.map((settlement) => {
          const unlocked = !!e.settlements[settlement.id]?.unlocked;
          return `
            <article class="exp-outpost${unlocked ? '' : ' locked'}" style="--accent:${settlement.accent}">
              <header><span>${settlement.glyph}</span><div><h4>${esc(settlement.name)}</h4><em>${esc(settlement.subtitle)}</em></div></header>
              <p>${esc(settlement.desc)}</p>
              <div class="exp-outpost-services">${settlement.services.map((service) => `<span>${esc(service)}</span>`).join('')}</div>
              ${unlocked
                ? `<div class="exp-outpost-npcs">${settlement.npcs.slice(0, 6).map((id) => {
                    const outpostNpc = NPC_BY_ID[id];
                    return outpostNpc ? `<button type="button" data-action="haven-npc" data-npc="${id}" class="${havenNpcId === id ? 'active' : ''}">${outpostNpc.glyph} ${esc(outpostNpc.name)}</button>` : '';
                  }).join('')}</div>`
                : '<span class="exp-quest-status">TERBUKA SETELAH BAB LEBIH JAUH</span>'}
            </article>`;
        }).join('')}
      </div>
    </section>
  `;
}

function buildChronicleTab(e, wrap) {
  const activeIds = activeEventIds();
  let selectedId = chronicleEventId && EVENT_BY_ID[chronicleEventId] ? chronicleEventId : activeIds[0] || EVENT_THEMES[0].id;
  if (!EVENT_BY_ID[selectedId]) selectedId = EVENT_THEMES[0].id;
  chronicleEventId = selectedId;
  const event = EVENT_BY_ID[selectedId];
  const state = e.events[selectedId];
  const active = isEventActive(event);
  const points = eventPoints(state, event);
  const spent = Number(state.spent) || 0;
  const available = Math.max(0, points - spent);
  const ownedEventSkins = event.skins.filter((skin) => e.cosmetics.includes(skin.id)).length;
  const claimedTiers = state.tiersClaimed.length;

  wrap.innerHTML = `
    <section class="exp-section">
      <div class="exp-section-head">
        <h3>ASHEN CHRONICLE</h3>
        <span>${activeIds.length} event aktif bulan ini · ${EVENT_THEMES.length} tema</span>
      </div>
      <div class="exp-event-row">
        ${EVENT_THEMES.map((entry) => {
          const entryState = e.events[entry.id];
          const entryPoints = eventPoints(entryState, entry);
          const entryActive = isEventActive(entry);
          return `
            <button class="exp-event-card${entry.id === selectedId ? ' active' : ''}${entryActive ? ' live' : ''}" type="button"
              data-action="event-select" data-event="${entry.id}" style="--accent:${entry.accent}">
              <span>${entry.glyph}</span>
              <strong>${esc(entry.name)}</strong>
              <em>${esc(entry.subtitle)}</em>
              <b>${entryActive ? 'AKTIF' : 'TIDAK AKTIF'} · ✦ ${entryPoints}</b>
            </button>`;
        }).join('')}
      </div>
    </section>

    <section class="exp-event-detail" style="--accent:${event.accent}">
      <header class="exp-event-head">
        <span class="exp-event-glyph">${event.glyph}</span>
        <div>
          <p class="eyebrow">${active ? 'EVENT AKTIF' : 'EVENT TIDAK AKTIF'} · ${esc(event.subtitle)}</p>
          <h3>${esc(event.name)}</h3>
          <p>${esc(event.theme)}</p>
        </div>
        <div class="exp-event-points">
          <span>${esc(event.currency)}</span>
          <strong>✦ ${points}</strong>
          <em>${available} tersedia</em>
        </div>
      </header>
      <p class="exp-event-desc">${esc(event.desc)}</p>
      <div class="exp-haven-stats">
        <div><span>POIN</span><strong>${points}</strong></div>
        <div><span>TERPAKAI</span><strong>${spent}</strong></div>
        <div><span>MISI DIKLAIM</span><strong>${state.missionsClaimed.length} / ${event.missions.length}</strong></div>
        <div><span>JALUR HADIAH</span><strong>${claimedTiers} / ${event.rewardTrack.length}</strong></div>
        <div><span>KULIT EVENT</span><strong>${ownedEventSkins} / ${event.skins.length}</strong></div>
      </div>
      ${active ? '' : '<p class="exp-note">Event ini sedang tidak aktif. Progres misi tidak bertambah, tetapi semua hadiah yang sudah kau klaim tetap tersimpan selamanya.</p>'}
      <div class="exp-event-columns">
        <section class="exp-event-column">
          <h4>MISI EVENT</h4>
          ${event.missions.map((mission) => {
            const progress = eventMissionProgress(state, mission);
            const ready = eventMissionReady(state, mission);
            const claimed = state.missionsClaimed.includes(mission.id);
            return `
              <article class="exp-mission${claimed ? ' claimed' : ''}${ready && !claimed ? ' ready' : ''}">
                <div><strong>${esc(mission.name)}</strong><p>${esc(mission.desc)}</p></div>
                <div class="exp-mission-progress"><span>${progress} / ${mission.amount} · +${mission.points} poin</span>${expBar(progress, mission.amount)}</div>
                ${claimed
                  ? '<span class="exp-done">DIKLAIM</span>'
                  : ready
                    ? `<button class="btn btn-primary btn-small" type="button" data-action="claim-mission" data-event="${event.id}" data-mission="${mission.id}">KLAIM</button>`
                    : '<span class="exp-quest-status">BERLANGSUNG</span>'}
              </article>`;
          }).join('')}
        </section>
        <section class="exp-event-column">
          <h4>JALUR HADIAH</h4>
          ${event.rewardTrack.map((tier) => {
            const unlocked = eventTierUnlocked(state, event, tier);
            const claimed = state.tiersClaimed.includes(tier.points);
            return `
              <article class="exp-tier${claimed ? ' claimed' : ''}${unlocked && !claimed ? ' ready' : ''}">
                <span class="exp-tier-glyph">${tier.glyph}</span>
                <div><strong>${esc(tier.name)}</strong><em>${tier.points} poin</em>
                  <p>${[
                    tier.reward?.echoes ? `✦ ${tier.reward.echoes} Gema` : '',
                    tier.reward?.item ? `${SHOP_ITEMS.find((item) => item.id === tier.reward.item)?.name || tier.reward.item}` : '',
                    tier.reward?.skin ? esc(SKIN_BY_ID[tier.reward.skin]?.name || tier.reward.skin) : '',
                  ].filter(Boolean).join(' · ')}</p>
                </div>
                ${claimed
                  ? '<span class="exp-done">DIKLAIM</span>'
                  : unlocked
                    ? `<button class="btn btn-primary btn-small" type="button" data-action="claim-tier" data-event="${event.id}" data-points="${tier.points}">KLAIM</button>`
                    : '<span class="exp-quest-status">TERKUNCI</span>'}
              </article>`;
          }).join('')}
        </section>
        <section class="exp-event-column">
          <h4>TOKO EVENT</h4>
          ${event.shop.map((item) => {
            const purchased = state.shopPurchased.includes(item.id);
            const canBuy = !purchased && available >= item.cost;
            return `
              <article class="exp-shop-item${purchased ? ' claimed' : ''}">
                <div><strong>${esc(item.name)}</strong><p>${esc(item.desc)}</p></div>
                <div class="exp-shop-foot">
                  <span>✦ ${item.cost}</span>
                  ${purchased
                    ? '<span class="exp-done">DIMILIKI</span>'
                    : `<button class="btn btn-small ${canBuy ? 'btn-primary' : 'btn-ghost'}" type="button" data-action="buy-event" data-event="${event.id}" data-item="${item.id}" ${canBuy ? '' : 'disabled'}>TUKAR</button>`}
                </div>
              </article>`;
          }).join('')}
        </section>
      </div>
      <p class="exp-note">Semua hadiah event bersifat lokal dan permanen. Kulit hanya mengubah tampilan — tidak pernah memberi keuntungan tempur.</p>
    </section>
  `;
}

function buildWardrobeTab(e, wrap) {
  const owned = new Set(e.cosmetics);
  const filters = [
    ['all', 'SEMUA'],
    ['owned', 'DIMILIKI'],
    ['event', 'EVENT'],
    ['milestone', 'MILESTONE'],
  ];
  const skins = COSMETIC_SKINS.filter((skin) => {
    if (wardrobeFilter === 'owned') return owned.has(skin.id);
    if (wardrobeFilter === 'event') return !!skin.eventId;
    if (wardrobeFilter === 'milestone') return !skin.eventId;
    return true;
  });
  const collectionTotal = Object.keys(COLLECTIBLE_BY_ID).length;
  const counts = expansionCollectibleCounts(e);

  wrap.innerHTML = `
    <section class="exp-section">
      <div class="exp-section-head">
        <h3>LEMARI KULIT</h3>
        <span>${owned.size} / ${COSMETIC_SKINS.length} dimiliki · hanya visual</span>
      </div>
      <div class="exp-filter-row">
        ${filters.map(([id, label]) => `<button class="exp-filter${wardrobeFilter === id ? ' active' : ''}" type="button" data-action="wardrobe-filter" data-filter="${id}">${label}</button>`).join('')}
      </div>
      <div class="exp-skin-grid">
        ${skins.length ? skins.map((skin) => {
          const isOwned = owned.has(skin.id);
          const equipped = e.selectedSkin === skin.id;
          return `
            <article class="exp-skin${isOwned ? ' owned' : ' locked'}${equipped ? ' equipped' : ''}">
              <div class="exp-skin-preview" style="--outfit:${skin.outfit};--skin:${skin.skin};--aura:${skin.aura}">
                <span>${skin.glyph || '✦'}</span>
                ${equipped ? '<b>DIPAKAI</b>' : ''}
              </div>
              <div class="exp-skin-body">
                <h4>${esc(skin.name)}</h4>
                <span>${esc(skin.subtitle)}</span>
                <p>${esc(skin.desc)}</p>
                <small>${esc(skin.source)}</small>
              </div>
              ${isOwned
                ? `<button class="btn btn-small ${equipped ? 'btn-ghost' : 'btn-primary'}" type="button" data-action="equip-skin" data-skin="${skin.id}">${equipped ? 'LEPAS' : 'PAKAI'}</button>`
                : '<span class="exp-quest-status">BELUM DIMILIKI</span>'}
            </article>`;
        }).join('') : '<p class="exp-empty">Belum ada kulit pada filter ini.</p>'}
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>JURNAL KOLEKSI</h3>
        <span>${e.collectibles.length} / ${collectionTotal} terkumpul · 12 kategori</span>
      </div>
      <div class="exp-collection-grid">
        ${COLLECTIBLE_CATEGORIES.map((category) => {
          const count = counts[category.id] || 0;
          return `
            <article class="exp-collection" style="--accent:${category.color}">
              <header>
                <span>${category.glyph}</span>
                <div><h4>${esc(category.name)}</h4><em>${count} / ${category.items.length}</em></div>
              </header>
              <div class="exp-collection-bar">${expBar(count, category.items.length)}</div>
              <div class="exp-collection-items">
                ${category.items.map((name, index) => {
                  const id = `${category.id}_${index + 1}`;
                  const has = e.collectibles.includes(id);
                  return `<span class="${has ? 'has' : ''}" title="${has ? esc(name) : 'Belum ditemukan'}">${has ? esc(name) : '???'}</span>`;
                }).join('')}
              </div>
            </article>`;
        }).join('')}
      </div>
    </section>
  `;
}

function handleExpansionAction(target) {
  const action = target.dataset.action;
  if (!action) return;
  const e = syncExpansionUnlocks();
  if (action === 'chapter') {
    expansionChapter = clamp(Number(target.dataset.chapter) || 0, 0, CHAPTERS.length - 1);
    buildExpansionScreen();
  } else if (action === 'start-level') {
    const index = Number(target.dataset.level);
    if (Number.isInteger(index) && expansionLevelUnlocked(e, index)) startExpansionLevel(index);
  } else if (action === 'difficulty') {
    const id = target.dataset.difficulty;
    if (DIFFICULTY_BY_ID[id]) {
      e.difficulty = id;
      saveProgress();
      buildExpansionScreen();
    }
  } else if (action === 'modifier') {
    const id = target.dataset.modifier;
    if (!MODIFIER_BY_ID[id]) return;
    const next = new Set(e.modifiers || []);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    e.modifiers = [...next];
    saveProgress();
    buildExpansionScreen();
  } else if (action === 'ngplus') {
    const tier = clamp(Number(target.dataset.tier) || 0, 0, NG_PLUS_TIERS.length - 1);
    if (tier > 0 && !e.flags.ngPlusUnlocked) {
      showToast('Selesaikan kampanye untuk membuka New Game Plus.', 2400);
      return;
    }
    e.ngPlus = tier;
    saveProgress();
    buildExpansionScreen();
  } else if (action === 'start-mode') {
    startExpansionMode(target.dataset.mode);
  } else if (action === 'start-trial') {
    startExpansionTrial(target.dataset.trial);
  } else if (action === 'haven-npc') {
    if (NPC_BY_ID[target.dataset.npc]) {
      havenNpcId = target.dataset.npc;
      buildExpansionScreen();
    }
  } else if (action === 'buy-upgrade') {
    buyHavenUpgrade(target.dataset.upgrade);
  } else if (action === 'claim-quest') {
    claimQuest(target.dataset.quest);
  } else if (action === 'event-select') {
    if (EVENT_BY_ID[target.dataset.event]) {
      chronicleEventId = target.dataset.event;
      buildExpansionScreen();
    }
  } else if (action === 'claim-mission') {
    claimEventMission(target.dataset.event, target.dataset.mission);
  } else if (action === 'claim-tier') {
    claimEventTier(target.dataset.event, Number(target.dataset.points));
  } else if (action === 'buy-event') {
    buyEventShop(target.dataset.event, target.dataset.item);
  } else if (action === 'wardrobe-filter') {
    wardrobeFilter = target.dataset.filter || 'all';
    buildExpansionScreen();
  } else if (action === 'equip-skin') {
    equipSkin(target.dataset.skin);
  }
}

// ── navigation ───────────────────────────────────────────────────────────
function provisionStartAsh(index) {
  // Level-select runs skip earlier rooms, so grant a small ash stipend for the shop.
  const stipend = index >= 7 ? 240 : index >= 6 ? 190 : index >= 5 ? 155 : index >= 4 ? 120 : index === 3 ? 90 : index === 2 ? 45 : 0;
  if (stipend > 0) game.ash = Math.max(game.ash, stipend);
}

function startRun(index = 0) {
  coopGuestMode = false;
  coopGuestRoom = -1;
  audio.init();
  attempts = 1;
  activeRunKind = 'legacy';
  activeCourtTrial = null;
  speedrunRun = null;
  speedrunSummaryOpen = false;
  speedrunCleared = false;
  activeFairyStage = -1;
  activeFairyBoss = null;
  cutsceneSeen = new Set();
  postCreditTimer = -1;
  labRun = null;
  labDirector = null;
  labGuestMode = false;
  labRewardsOpen = false;
  labSummaryOpen = false;
  game.labyrinth = false;
  horrorEventLayer = {};
  horrorPresence = null;
  horrorLastDone = null;
  activeExpansionIndex = null;
  activeModeId = null;
  activeTrialId = null;
  modeRunRewarded = false;
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  game.setHunterItems(hunterState.items);
  if (index > 0) {
    game.enterRoom(index);
    if (index >= 2) game.player.relic = true;
    provisionStartAsh(index);
  }
  game.events.length = 0;
  started = true;
  paused = false;
  hunterShopOpen = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  discoverCurrentRoom(game.roomIndex);
  beginStage(game.roomIndex, game.room.name);
  showBanner(game.room.name, game.room.subtitle);
  syncScreens();
  updateHud();
}

function retryRun() {
  if (activeRunKind === 'custom') {
    void retryCustomRun();
    return;
  }
  attempts += 1;
  if (activeRunKind === 'eternal') {
    const stageId = eternalController?.activeStage;
    const bossId = eternalController?.activeBoss;
    if (game) game.veilDeathCounted = false;
    if (eternalRunHunt) startEternalHunt(eternalRunHunt.config || {});
    else if (bossId) startEternalBoss(bossId);
    else if (stageId) startEternalStage(stageId);
    else openEternal();
    return;
  }
  if (activeRunKind === 'veil') {
    // Veil stages are synthetic arenas (rooms 9400+), so a generic campaign
    // checkpoint retry would load a legacy room. Restart the exact fight.
    const stageId = veilController?.activeStage;
    const bossId = veilController?.activeBoss;
    if (game) game.veilDeathCounted = false;
    if (bossId) startVeilBoss(bossId);
    else if (stageId) startVeilStage(stageId);
    else openVeil();
    return;
  }
  if (activeRunKind === 'speedrun') {
    // One life: there is nothing to retry, the run is simply over.
    finishSpeedrun();
    return;
  }
  if (activeRunKind === 'court' && activeCourtTrial) {
    startCourtTrial(activeCourtTrial.id);
    return;
  }
  if (activeRunKind === 'fallen') {
    recordFallenDeath(fallenState());
    saveProgress();
    if (activeFallenBoss) startFallenBoss(activeFallenBoss);
    else startFallenRegion(Math.max(0, activeFallenRegion), { slot: Math.max(0, activeFallenSlot) });
    return;
  }
  if (activeRunKind === 'crusade') {
    recordCrusadeDeath(crusadeState());
    saveProgress();
    if (activeCrusadeBoss) startCrusadeBoss(activeCrusadeBoss);
    else startCrusadeLevel(Math.max(0, activeCrusadeLevel));
    return;
  }
  if (activeRunKind === 'rift') {
    startRiftRoom(Math.max(RIFT_ROOM_START, game.roomIndex || RIFT_ROOM_START));
    return;
  }
  if (activeRunKind === 'pack' && activePackIndex >= 0) {
    startPackRun(activePackIndex);
    return;
  }
  if (activeRunKind === 'fairy') {
    if (activeFairyBoss) startFairyBoss(activeFairyBoss);
    else startFairyStage(Math.max(0, activeFairyStage));
    return;
  }
  if (activeRunKind === 'cistern') {
    startCisternStage(activeCisternStage >= 0 ? activeCisternStage : 0);
    return;
  }
  if (activeRunKind === 'lanternwake') {
    startLanternwakeStage(activeLanternStage >= 0 ? activeLanternStage : 0);
    return;
  }
  if (activeRunKind === 'frontiers') {
    const state = frontierState();
    recordFrontierRun(state, 0, true);
    saveProgress();
    startFrontierLevel(activeFrontierIndex >= 0 ? activeFrontierIndex : 0);
    return;
  }
  if (activeRunKind === 'overdrive') {
    const state = overdriveState();
    recordOverdriveRun(state, 0, true);
    saveProgress();
    startOverdriveLevel(activeOverdriveIndex >= 0 ? activeOverdriveIndex : 0);
    return;
  }
  if (activeRunKind === 'eclipse') {
    progress.eclipse.deaths += 1;
    saveProgress();
    if (activeEclipseRoom != null) startEclipseStage(activeEclipseRoom);
    return;
  }
  if (activeRunKind === 'godfall') {
    const failure = failGodfallRun(progress.godfall);
    saveProgress();
    const restartFloor = Math.max(1, failure.checkpoint || activeGodfallFloor);
    showToast(failure.message, 2600);
    startEclipseGodfall(restartFloor, { practice: !!godfallRun?.practice });
    return;
  }
  if (activeRunKind === 'raid' && activeRaid) {
    startEclipseRaid(activeRaid.encounterId, { practice: true });
    return;
  }
  const usedCheckpoint = game.respawnAtCheckpoint();
  if (!usedCheckpoint) {
    const index = game.roomIndex;
    game.reset();
    applyCharacterToGame();
    game.setHunterItems(hunterState.items);
    if (activeRunKind === 'expansion') {
      game.setChallenge(expansionChallengeConfig());
      game.setKnownCollectibles(expState().collectibles);
      applySkinToGame();
    } else if (activeRunKind === 'atlas') {
      const p = atlasState();
      game.atlasRun = true;
      game.setAbilities(p.abilities || []);
      applySkinToGame();
    } else if (activeRunKind === 'court') {
      applyCourtLoadout(courtState(), game);
      game.player.relic = true;
    }
    if (index > 0) {
      game.enterRoom(index);
      if (index >= 2) game.player.relic = true;
      if (index >= ATLAS_ROOM_START) {
        applyAtlasLoadout(game, atlasState());
        game.ash = Math.max(game.ash, 40);
      } else if (index >= EXPANSION_ROOM_START) provisionExpansionAsh(index - EXPANSION_ROOM_START);
      else provisionStartAsh(index);
    }
  }
  game.events.length = 0;
  started = true;
  paused = false;
  hunterShopOpen = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  showBanner(game.room.name, game.room.subtitle);
  if (usedCheckpoint) {
    showToast('Bangkit di Warung Abu — abu, senjata, dan berkah tersimpan.', 2400);
  }
  syncScreens();
  updateHud();
}

function showMenu() {
  resetCustomRun();
  hunterShopOpen = false;
  cancelPrologue();
  if (activeRunKind === 'hack' && hackSnapshot) progress = hackSnapshot;
  hackSnapshot = null;
  hackConfig = null;
  realmsUI?.hideAll();
  eclipseUI?.hideAll();
  godfallRun = null;
  activeRaid = null;
  activeEclipseRoom = null;
  activeGodfallFloor = 0;
  if (labRun && !labRun.ended && started) finishLabRun('quit');
  teardownLabCoop(false);
  labGuestMode = false;
  coopGuestMode = false;
  coopSelfId = '';
  coopGuestRoom = -1;
  labRewardsOpen = false;
  labSummaryOpen = false;
  labSummary = null;
  speedrunRun = null;
  speedrunSummaryOpen = false;
  speedrunCleared = false;
  closeFishingOverlays();
  labRun = null;
  trialRun = null;
  mobaActive = false;
  mobaPaused = false;
  mobaMatch = null;
  mobaResult = null;
  mobaRecorded = false;
  wdActive = false;
  wdPaused = false;
  wdMatch = null;
  wdResult = null;
  wdRecorded = false;
  wdRenderDirty = true;
  pirateActive = false;
  piratePaused = false;
  pirateMatch = null;
  pirateResult = null;
  pirateRecorded = false;
  pirateLastSnapshot = null;
  stopPuzzleTimer();
  puzzleRun = null;
  puzzleSelected = -1;
  labDirector = null;
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  fallenEndingOpen = false;
  fallenRun = null;
  activeFallenRegion = -1;
  activeFallenBoss = null;
  crusadeClearOpen = false;
  crusadeRun = null;
  activeCrusadeBoss = null;
  menuView = defaultMenuView();
  game.reset();
  game.events.length = 0;
  clearHeldKeys();
  updateMenuProgress();
  if (menuView === 'fallenMenu') buildFallenMenu();
  else if (menuView === 'crusadeMenu') buildCrusadeMenu();
  syncScreens();
}

function showLevels() {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'levels';
  clearHeldKeys();
  updateMenuProgress();
  buildLevelCards();
  syncScreens();
}

function showExpansion(tab = 'campaign') {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'expansion';
  expansionTab = tab;
  clearHeldKeys();
  syncExpansionUnlocks();
  buildExpansionScreen();
  syncScreens();
}

function showMode3D(subMode = 'campaign', options = {}) {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'mode3d';
  const region = $('select-3d-region')?.value || 'thornveil';
  const area = $('select-3d-area')?.value || '';
  if (!game3D) {
    game3D = new Ashen3DGame({
      viewW: 960,
      viewH: 540,
      subMode,
      region,
      quality: settings.graphics.preset === 'extreme' ? 'ultra' : settings.graphics.preset,
      visualSettings: settings.graphics,
      hudSettings: settings.hud,
      cameraSensitivity: settings.controls.cameraSensitivity / 100,
    });
  } else {
    game3D.subMode = subMode;
    game3D.setRegion(region);
  }
  if (area && subMode !== 'scary') game3D.setArea(area);
  game3D.player.weaponId = game.player.weapon;
  if (subMode === 'scary') {
    start3DHorrorRun(options.siteId || horror3DSiteId, options);
  } else {
    buildHorror3DPanel();
  }
  clearHeldKeys();
  syncScreens();
}

function start3DHorrorRun(siteId, options = {}) {
  const site = horror3DSite(siteId);
  if (!site || !game3D) return null;
  horror3DSiteId = site.id;
  const anti = options.antiJumpscare ?? $('horror3d-anti')?.checked ?? horror3D.settings.antiJumpscare;
  const intensity = options.intensity || $('horror3d-intensity')?.value || horror3D.settings.intensity;
  horror3D.settings.antiJumpscare = !!anti;
  horror3D.settings.intensity = ['reduced', 'full', 'nightmare'].includes(intensity) ? intensity : 'full';
  horror3D.lastSite = site.id;
  save3DHorrorState();
  const active = game3D.startHorrorSite(site.id, { antiJumpscare: !!anti, intensity: horror3D.settings.intensity });
  if (!active) return null;
  game3D.player.weaponId = game.player.weapon;
  buildHorror3DPanel();
  syncScreens();
  return game3D.horrorSnapshot();
}

function start3DHorror(siteId = horror3DSiteId, options = {}) {
  if (menuView !== 'mode3d' || !game3D) {
    showMode3D('scary', { siteId, ...options });
    return game3D?.horrorSnapshot() || null;
  }
  return start3DHorrorRun(siteId, options);
}

function restart3DHorror() {
  const siteId = game3D?.horror?.siteId || horror3DSiteId;
  return start3DHorror(siteId, {
    antiJumpscare: game3D?.horror?.antiJumpscare,
    intensity: game3D?.horror?.intensity,
  });
}

function buildHorror3DPanel() {
  const summary = horror3DSummary(horror3D);
  const list = $('horror3d-sites');
  if (list) {
    list.innerHTML = summary.sites.map((entry) => `
      <button class="horror3d-card${entry.cleared ? ' cleared' : ''}${entry.id === horror3DSiteId ? ' active' : ''}" type="button" data-horror-site="${entry.id}">
        <span class="horror3d-card-level">SITUS ${String(entry.level).padStart(2, '0')} · ${entry.difficulty.toUpperCase()}</span>
        <strong>${entry.name}</strong>
        <em>${entry.cleared ? `CLEARED · ${entry.bestTime ? entry.bestTime.toFixed(1) + 's' : '—'}` : `${entry.attempts} percobaan · ${entry.deaths} mati`}</em>
      </button>`).join('');
  }
  const summaryEl = $('horror3d-summary');
  if (summaryEl) {
    summaryEl.textContent = `${summary.clearedSites}/${summary.totalSites} situs dibersihkan · ${summary.scares} jumpscare · ${summary.deaths} kematian${summary.bestTime ? ` · rekor ${summary.bestTime.toFixed(1)}s` : ''}`;
  }
  const select = $('horror3d-select');
  if (select && select.options.length !== HORROR3D_SITES.length) {
    select.innerHTML = HORROR3D_SITES.map((entry) => `
      <option value="${entry.id}">${entry.level} · ${entry.name} — ${entry.difficulty}</option>`).join('');
  }
  if (select) select.value = horror3DSiteId;
  const anti = $('horror3d-anti');
  if (anti) anti.checked = !!horror3D.settings.antiJumpscare;
  const intensity = $('horror3d-intensity');
  if (intensity) intensity.value = horror3D.settings.intensity;
}

function drain3DHorrorEvents() {
  if (!game3D) return;
  for (const event of game3D.drainHorrorEvents()) {
    if (event.type === 'horrorStart') {
      horror3D.lastSite = event.siteId;
      horror3D.lastResult = null;
      horror3DSiteId = event.siteId;
      save3DHorrorState();
    } else if (event.type === 'horrorCleared' || event.type === 'horrorDead') {
      const result = record3DHorrorResult(horror3D, {
        siteId: event.siteId,
        result: event.type === 'horrorCleared' ? 'cleared' : 'dead',
        time: event.time,
        scares: event.scares,
        phase: event.phase,
      });
      save3DHorrorState();
      buildHorror3DPanel();
      if (result.ok && result.unlocked.length) showToast(`PENCAPAIAN 3D SCARY · ${result.unlocked.join(' · ')}`, 3200);
    }
  }
}

function closeMode3D() {
  showMenu();
}

function showFrontier(tab = 'campaign200') {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'frontier';
  frontierTab = tab;
  clearHeldKeys();
  buildFrontierScreen();
  syncScreens();
}

function closeFrontier() {
  showMenu();
}

// ── Riftwar: hub, battlefield and result handling ───────────────────────
function mobaState() {
  if (!progress.moba) progress.moba = defaultMobaProgress();
  return progress.moba;
}

function showMoba() {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'moba';
  clearHeldKeys();
  buildMobaScreen();
  syncScreens();
}

function mobaHeroCard(hero) {
  const selected = hero.id === mobaHeroId;
  return `<button class="moba-hero-card${selected ? ' active' : ''}" type="button" data-moba-hero="${hero.id}" style="--hero:${hero.color}" aria-pressed="${selected}">
    <span class="mh-glyph">${hero.glyph}</span>
    <span class="mh-name">${esc(hero.name)}</span>
    <span class="mh-meta"><span>${MOBA_ROLES[hero.role]?.name || hero.role}</span><span>L1</span></span>
    <span class="mh-origin">${hero.source === 'core' ? 'KAMPANYE' : 'FRONTIER'} · ${esc(hero.className)}</span>
  </button>`;
}

function buildMobaScreen() {
  const state = mobaState();
  const summary = mobaSummary(state);
  const content = $('moba-summary');
  if (content) {
    content.innerHTML = `
      <div class="moba-stat"><span>PERTEMPURAN</span><strong>${summary.matches}</strong></div>
      <div class="moba-stat"><span>KEMENANGAN</span><strong>${summary.wins}</strong></div>
      <div class="moba-stat"><span>WIN RATE</span><strong>${summary.winRate}%</strong></div>
      <div class="moba-stat"><span>HERO DIMAINKAN</span><strong>${summary.heroesPlayed}/${summary.heroes}</strong></div>
      <div class="moba-stat"><span>REKOR TERCEPAT</span><strong>${summary.bestTime ? formatPuzzleTime(summary.bestTime) : '—'}</strong></div>`;
  }
  if (!MOBA_HERO_BY_ID[mobaHeroId]) mobaHeroId = MOBA_HEROES[0].id;
  if (!MOBA_MAP_BY_ID[mobaMapId]) mobaMapId = MOBA_MAPS[0].id;
  if (!MOBA_LANES.includes(mobaLane)) mobaLane = 'mid';
  if (!MOBA_DIFFICULTIES.some((entry) => entry.id === mobaDifficulty)) mobaDifficulty = 'knight';
  const roles = $('moba-role-filter');
  if (roles) {
    roles.innerHTML = ['all', ...Object.keys(MOBA_ROLES)].map((role) => `<button class="${mobaRoleFilter === role ? 'active' : ''}" type="button" data-moba-role="${role}">${role === 'all' ? 'SEMUA' : MOBA_ROLES[role].name.toUpperCase()}</button>`).join('');
  }
  const roster = $('moba-roster');
  if (roster) {
    const filtered = MOBA_HEROES.filter((hero) => mobaRoleFilter === 'all' || hero.role === mobaRoleFilter);
    roster.innerHTML = filtered.map(mobaHeroCard).join('');
  }
  const count = $('moba-hero-count');
  if (count) count.textContent = `${MOBA_HEROES.length} HERO · ${MOBA_ROLES[MOBA_HERO_BY_ID[mobaHeroId]?.role]?.name || 'SEMUA'}`;
  const maps = $('moba-maps');
  if (maps) {
    maps.innerHTML = MOBA_MAPS.map((map) => `<button class="moba-map-card${map.id === mobaMapId ? ' active' : ''}" type="button" data-moba-map="${map.id}">
      <strong>${esc(map.name)}</strong><em>${esc(map.subtitle)}</em><span>${esc(map.lore)}</span>
      <span>${map.epics.length} BOS EPIK · ${map.camps.length} JUNGLE CAMP</span>
    </button>`).join('');
  }
  const lanes = $('moba-lanes');
  if (lanes) lanes.innerHTML = MOBA_LANES.map((lane) => `<button class="${lane === mobaLane ? 'active' : ''}" type="button" data-moba-lane="${lane}">${lane.toUpperCase()}</button>`).join('');
  const difficulties = $('moba-difficulties');
  if (difficulties) difficulties.innerHTML = MOBA_DIFFICULTIES.map((entry) => `<button class="${entry.id === mobaDifficulty ? 'active' : ''}" type="button" data-moba-difficulty="${entry.id}" title="${esc(entry.desc)}">${entry.name.toUpperCase()}</button>`).join('');
  const codex = $('moba-codex');
  if (codex) {
    const map = MOBA_MAP_BY_ID[mobaMapId];
    codex.innerHTML = `
      <article><h4>MINION &amp; MENARA</h4><p>${MOBA_MINION_TYPES.length} tipe minion · ${map.towers.filter((tower) => tower.tier !== 'guard').length} menara lane + ${map.towers.filter((tower) => tower.tier === 'guard').length} penjaga nexus. Gelombang berjalan di tiga jalur.</p></article>
      <article><h4>JUNGLE &amp; BOS</h4><p>${MOBA_JUNGLE_MOBS.length} mob jungle · ${MOBA_EPIC_BOSSES.length} bos epik. Bunuh bos untuk memberi seluruh tim buff damage.</p></article>
      <article><h4>${esc(map.name)}</h4><p>${map.epics.map((pit) => esc(MOBA_EPIC_BY_ID[pit.boss]?.name || pit.boss)).join(' · ')}. ${esc(map.lore)}</p></article>`;
  }
  const button = $('btn-moba-start');
  if (button) button.innerHTML = `<span>MULAI PERTEMPURAN</span><em>${esc(MOBA_HERO_BY_ID[mobaHeroId]?.name)} · ${esc(MOBA_MAP_BY_ID[mobaMapId]?.name)} · ${mobaLane.toUpperCase()}</em>`;
}

function startMobaBattle() {
  if (!MOBA_HERO_BY_ID[mobaHeroId]) mobaHeroId = MOBA_HEROES[0].id;
  if (!MOBA_MAP_BY_ID[mobaMapId]) mobaMapId = MOBA_MAPS[0].id;
  mobaMatch = createMobaMatch({
    heroId: mobaHeroId,
    mapId: mobaMapId,
    lane: mobaLane,
    difficulty: mobaDifficulty,
    seed: (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0,
  });
  mobaActive = true;
  mobaPaused = false;
  mobaResult = null;
  mobaRecorded = false;
  mobaUiTimer = 0;
  mobaAim = { x: mobaMatch.player.x, y: mobaMatch.player.y };
  mobaInput.moveX = 0;
  mobaInput.moveY = 0;
  mobaInput.moveTarget = null;
  mobaInput.castSlot = -1;
  mobaInput.recall = false;
  mobaHeld.clear();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  menuView = 'mobaBattle';
  accumulator = 0;
  lastTime = performance.now();
  $('moba-result')?.classList.add('hidden');
  $('moba-pause')?.classList.add('hidden');
  updateMobaHud(true);
  syncScreens();
}

function syncMobaAxes() {
  const left = mobaHeld.has('ArrowLeft') || mobaHeld.has('KeyA');
  const right = mobaHeld.has('ArrowRight') || mobaHeld.has('KeyD');
  const up = mobaHeld.has('ArrowUp');
  const down = mobaHeld.has('ArrowDown');
  mobaInput.moveX = (right ? 1 : 0) - (left ? 1 : 0);
  mobaInput.moveY = (down ? 1 : 0) - (up ? 1 : 0);
  if (mobaInput.moveX || mobaInput.moveY) mobaInput.moveTarget = null;
}

function toggleMobaPause(next = !mobaPaused) {
  if (!mobaActive || !mobaMatch) return;
  mobaPaused = !!next;
  mobaHeld.clear();
  mobaInput.moveX = 0;
  mobaInput.moveY = 0;
  lastTime = performance.now();
  syncScreens();
  updateMobaHud(true);
}

function leaveMoba() {
  mobaActive = false;
  mobaPaused = false;
  mobaMatch = null;
  mobaResult = null;
  mobaRecorded = false;
  mobaHeld.clear();
  showMoba();
}

function completeMobaMatch() {
  if (!mobaMatch || mobaMatch.phase !== 'ended' || mobaRecorded) return;
  mobaRecorded = true;
  const win = mobaMatch.winner === 'blue';
  const p = mobaMatch.player;
  const saved = recordMobaMatch(mobaState(), {
    win,
    heroId: mobaMatch.heroId,
    mapId: mobaMatch.mapId,
    lane: mobaMatch.playerLane,
    duration: mobaMatch.time,
    kills: p?.kills || 0,
    deaths: p?.deaths || 0,
    assists: p?.assists || 0,
  });
  progress.moba = saved.progress;
  saveProgress();
  mobaResult = {
    ...saved,
    win,
    mapName: mobaMatch.map.name,
    heroName: p?.name || 'Penjaga',
    snapshot: mobaSnapshot(mobaMatch),
    heroes: mobaHeroStats(mobaMatch),
    score: { blue: mobaMatch.teams.blue.kills, red: mobaMatch.teams.red.kills },
  };
  renderMobaResult();
  updateMobaHud(true);
}

function renderMobaResult() {
  const overlay = $('moba-result');
  if (!overlay || !mobaResult) return;
  const r = mobaResult;
  const blue = r.heroes.filter((hero) => hero.team === 'blue').sort((a, b) => b.kills - a.kills);
  const red = r.heroes.filter((hero) => hero.team === 'red').sort((a, b) => b.kills - a.kills);
  overlay.innerHTML = `<div class="moba-modal-card moba-result-card ${r.win ? 'victory' : 'defeat'}">
    <p class="eyebrow">RIFTWAR · ${esc(r.mapName)} · ${formatPuzzleTime(r.snapshot.time)}</p>
    <h3 class="moba-result-title">${r.win ? 'NEXUS MUSUH JATUH' : 'NEXUS KITA TERBELAH'}</h3>
    <p>${r.win ? `${esc(r.heroName)} memimpin Penjaga Sumpah menutup celah.` : `${esc(r.heroName)} bertahan sampai nexus terakhir, tetapi pasukan Rift menang.`}</p>
    <div class="moba-result-stats">
      <div><span>KILL</span><b>${r.snapshot.player?.kills || 0}</b></div>
      <div><span>DEATH</span><b>${r.snapshot.player?.deaths || 0}</b></div>
      <div><span>ASSIST</span><b>${r.snapshot.player?.assists || 0}</b></div>
      <div><span>SKOR</span><b>${r.score.blue} : ${r.score.red}</b></div>
    </div>
    <div class="moba-team-table">${blue.map((hero) => `<div><b>${esc(hero.name)}</b><span>${hero.kills}/${hero.deaths}/${hero.assists}</span><span>L${hero.level}</span></div>`).join('')}</div>
    <div class="moba-team-table">${red.map((hero) => `<div><b>${esc(hero.name)}</b><span>${hero.kills}/${hero.deaths}/${hero.assists}</span><span>L${hero.level}</span></div>`).join('')}</div>
    <div class="moba-result-actions">
      <button class="btn btn-primary" type="button" data-moba-action="rematch">COBA LAGI</button>
      <button class="btn btn-ghost" type="button" data-moba-action="leave">KEMBALI KE HUB</button>
    </div>
  </div>`;
  overlay.classList.remove('hidden');
}

function updateMobaHud(force = false) {
  if (!mobaMatch) return;
  if (mobaMatch.phase === 'ended' && !mobaRecorded) completeMobaMatch();
  if (!force && mobaUiTimer < 1 / 15) return;
  mobaUiTimer = 0;
  const p = mobaMatch.player;
  const setText = (id, value) => { const node = $(id); if (node) node.textContent = value; };
  setText('moba-map-name', mobaMatch.map.name.toUpperCase());
  setText('moba-clock', formatPuzzleTime(mobaMatch.time));
  setText('moba-wave', `GELOMBANG ${mobaMatch.wave}`);
  setText('moba-blue-score', mobaMatch.teams.blue.kills);
  setText('moba-red-score', mobaMatch.teams.red.kills);
  if (p) {
    setText('moba-player-name', p.name);
    setText('moba-player-glyph', p.glyph);
    setText('moba-player-role', MOBA_ROLES[p.role]?.name || p.role);
    setText('moba-player-level', `L${p.level}`);
    setText('moba-player-gold', `◈ ${p.gold}`);
    setText('moba-player-hp-text', `${Math.ceil(p.hp)} / ${p.maxHp}`);
    setText('moba-player-mana-text', `${Math.ceil(p.mana)} / ${p.maxMana}`);
    setText('moba-player-kda', `${p.kills} / ${p.deaths} / ${p.assists}`);
    const hp = $('moba-player-hp'); if (hp) hp.style.width = `${Math.max(0, p.hp / p.maxHp) * 100}%`;
    const mana = $('moba-player-mana'); if (mana) mana.style.width = `${Math.max(0, p.mana / p.maxMana) * 100}%`;
    const respawn = $('moba-respawn');
    if (respawn) {
      respawn.classList.toggle('hidden', !p.dead);
      respawn.textContent = p.dead ? `RESPAWN ${Math.max(0, p.respawnTimer || 0).toFixed(1)}` : '';
    }
    const abilities = $('moba-abilities');
    if (abilities) {
      abilities.innerHTML = p.abilities.map((ability, index) => `<button class="moba-ability${p.cooldowns[index] > 0 ? ' cooling' : ''}" type="button" data-moba-cast="${index}">
        <span class="ma-key">${ability.slot}</span><span class="ma-name">${esc(ability.name)}</span><span class="ma-cost">${ability.mana} MP</span><span class="ma-cd">${p.cooldowns[index] > 0 ? `${p.cooldowns[index].toFixed(1)}s` : 'SIAP'}</span>
      </button>`).join('');
    }
  }
  const teamHtml = (team) => mobaHeroStats(mobaMatch).filter((hero) => hero.team === team).map((hero) => `<div class="mt-row${hero.dead ? ' dead' : ''}"><b>${esc(hero.name)}</b><i>L${hero.level}</i><span>${hero.kills}/${hero.deaths}</span></div>`).join('');
  const blue = $('moba-team-blue'); if (blue) blue.innerHTML = teamHtml('blue');
  const red = $('moba-team-red'); if (red) red.innerHTML = teamHtml('red');
  const feed = $('moba-feed');
  if (feed) {
    const events = mobaMatch.texts.slice(-4).reverse();
    feed.innerHTML = events.map((event) => `<span style="color:${event.color}">${esc(event.text)}</span>`).join('');
  }
  const pause = $('moba-pause');
  if (pause) pause.classList.toggle('hidden', !mobaPaused);
}

function mobaPointerWorld(event) {
  const canvas = $('moba-canvas');
  if (!canvas || !mobaMatch) return null;
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * canvas.width;
  const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height;
  return mobaScreenToWorld(mobaMatch, x, y, canvas.width, canvas.height);
}

// ── Wave Defense: hub, castle battlefield and result handling ──────
function waveDefenseState() {
  if (!progress.wavedefense) progress.wavedefense = defaultWaveDefenseProgress();
  return progress.wavedefense;
}

function showWaveDefense() {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  wdActive = false;
  wdPaused = false;
  wdMatch = null;
  wdResult = null;
  wdRecorded = false;
  wdRenderDirty = true;
  menuView = 'wavedefense';
  clearHeldKeys();
  buildWaveDefenseScreen();
  syncScreens();
}

function waveDefenseParticleScale() {
  const level = WAVE_DEFENSE_PARTICLE_LEVELS.find((entry) => entry.id === wdParticleId);
  if (level) return level.scale;
  const mult = Number(settings?.graphics?.particleMultiplier ?? 1);
  return Math.max(0.25, Math.min(4, mult));
}

function buildWaveDefenseScreen() {
  const state = waveDefenseState();
  const summary = waveDefenseSummary(state);
  const storyEl = $('wd-story');
  if (storyEl) {
    storyEl.innerHTML = SPIRAL_STORY.map((chapter) => `<article class="wd-story-chapter">
      <span>TINGKAT ${chapter.tier}</span>
      <strong>${esc(chapter.title)}</strong>
      <p>${esc(chapter.line)}</p>
    </article>`).join('');
  }
  const summaryEl = $('wd-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="wd-stat"><span>PERTAHANAN</span><strong>${summary.runs}</strong><em>${summary.wins} menang · ${summary.losses} kalah</em></div>
      <div class="wd-stat"><span>WIN RATE</span><strong>${summary.winRate}%</strong><em>${summary.mapsPlayed}/${summary.mapsTotal} benteng</em></div>
      <div class="wd-stat"><span>GELOMBANG</span><strong>${summary.bestWave}/${WAVE_DEFENSE_TOTAL_WAVES}</strong><em>rekor tertinggi</em></div>
      <div class="wd-stat"><span>SKOR</span><strong>${summary.bestScore}</strong><em>rekor benteng</em></div>
      <div class="wd-stat"><span>TOTAL KILL</span><strong>${summary.totalKills}</strong><em>${summary.totalLeaks} bocor</em></div>
      <div class="wd-stat"><span>MENARA</span><strong>${summary.towers}</strong><em>${summary.enemies} musuh · ${summary.bosses} bos</em></div>
      <div class="wd-stat"><span>INFINITOWER</span><strong>T${summary.infinitowerBest?.bestTier || 0}</strong><em>gel ${summary.infinitowerBest?.bestWave || 0} · ${summary.infinitowerBest?.bestKills || 0} kill</em></div>`;
  }
  if (!WAVE_DEFENSE_MAP_BY_ID[wdMapId]) wdMapId = WAVE_DEFENSE_MAPS[0].id;
  if (!WAVE_DEFENSE_DIFFICULTIES.some((entry) => entry.id === wdDifficulty)) wdDifficulty = 'knight';
  if (!WAVE_DEFENSE_PARTICLE_LEVELS.some((entry) => entry.id === wdParticleId)) wdParticleId = 'normal';
  if (!WAVE_DEFENSE_TOWER_BY_ID[wdSelectedTowerId]) wdSelectedTowerId = WAVE_DEFENSE_TOWERS[0].id;
  const mapCountEl = $('wd-map-count');
  if (mapCountEl) mapCountEl.textContent = `${WAVE_DEFENSE_MAPS.length} MEDAN · ${WAVE_DEFENSE_MAPS.filter((m) => m.id !== 'eternal_spiral').length} STAGE`;
  const maps = $('wd-maps');
  if (maps) {
    maps.innerHTML = WAVE_DEFENSE_MAPS.map((map) => {
      const record = state.maps?.[map.id] || {};
      const cleared = (record.wins || 0) > 0;
      return `<button class="wd-map-card${map.id === wdMapId ? ' active' : ''}${cleared ? ' cleared' : ''}" type="button" data-wd-map="${map.id}">
        <span class="wm-stage">STAGE ${map.stage || 1}${cleared ? ' · TUNTAS' : ''}${map.id === 'eternal_spiral' ? ' · INFINITOWER' : ''}</span>
        <strong>${esc(map.name)}</strong><em>${esc(map.subtitle)}</em><span>${esc(map.lore)}</span>
        <b>${map.slots.length} POS · REKOR GEL ${record.bestWave || 0} · SKOR ${record.bestScore || 0}</b>
      </button>`;
    }).join('');
  }
  const diffs = $('wd-difficulties');
  if (diffs) diffs.innerHTML = WAVE_DEFENSE_DIFFICULTIES.map((entry) => `<button class="${entry.id === wdDifficulty ? 'active' : ''}" type="button" data-wd-difficulty="${entry.id}" title="${esc(entry.desc)}">${entry.name} · ${entry.castle} HP</button>`).join('');
  const particlesEl = $('wd-particles');
  if (particlesEl) {
    particlesEl.innerHTML = WAVE_DEFENSE_PARTICLE_LEVELS.map((entry) => `<button class="${entry.id === wdParticleId ? 'active' : ''}" type="button" data-wd-particle="${entry.id}" title="${esc(entry.desc)}">${esc(entry.label)}<em>${entry.scale}× partikel</em></button>`).join('');
  }
  const pLabel = $('wd-particle-label');
  if (pLabel) {
    const activeLevel = WAVE_DEFENSE_PARTICLE_LEVELS.find((entry) => entry.id === wdParticleId) || WAVE_DEFENSE_PARTICLE_LEVELS[1];
    pLabel.textContent = `${activeLevel.label.toUpperCase()} (${activeLevel.scale}×)`;
  }
  const modes = $('wd-modes');
  if (modes) {
    const best = summary.endlessBest || {};
    const tower = summary.infinitowerBest || {};
    modes.innerHTML = `
      <button class="${!wdEndless && !wdInfinitower ? 'active' : ''}" type="button" data-wd-mode="classic">KAMPANYE · 24 GELOMBANG<em>Rekor gel ${summary.bestWave}/${WAVE_DEFENSE_TOTAL_WAVES} · skor ${summary.bestScore}</em></button>
      <button class="${wdEndless && !wdInfinitower ? 'active' : ''}" type="button" data-wd-mode="endless">TANPA AKHIR<em>Rekor gel ${best.bestWave || 0} · ${best.bestKills || 0} kill · skor ${best.bestScore || 0}</em></button>
      <button class="${wdInfinitower ? 'active' : ''}" type="button" data-wd-mode="infinitower">INFINITOWER · LINGKAR ABADI<em>Tingkat ${tower.bestTier || 0} · gel ${tower.bestWave || 0} · ${tower.bestKills || 0} kill</em></button>`;
  }
  const towers = $('wd-towers');
  if (towers) {
    towers.innerHTML = WAVE_DEFENSE_TOWERS.map((tower) => `<button class="wd-tower-card${tower.id === wdSelectedTowerId ? ' active' : ''}" type="button" data-wd-tower="${tower.id}" style="--tower-color:${tower.color}">
      <span class="wt-top"><img class="wt-icon" src="${waveDefenseTowerIconDataUrl(tower.id)}" alt="${esc(tower.name)}" /><strong>${esc(tower.name)}</strong></span>
      <em>${tower.cost} EMAS</em>
      <span>${esc(tower.desc)}</span>
      <span class="wt-stats">DMG ${tower.damage} · RANGE ${tower.range} · ${tower.rate.toFixed(2)}/s${tower.splash ? ` · AREA ${tower.splash}` : ''}</span>
    </button>`).join('');
  }
  const count = $('wd-tower-count');
  if (count) count.textContent = `${WAVE_DEFENSE_TOWERS.length} JENIS · ${WAVE_DEFENSE_ENEMY_TYPES.length} MUSUH · ${WAVE_DEFENSE_BOSSES.length} BOS`;
  const button = $('btn-wd-start');
  if (button) button.innerHTML = `<span>${wdInfinitower ? 'MULAI INFINITOWER' : wdEndless ? 'MULAI TANPA AKHIR' : 'MULAI PERTAHANAN'}</span><em>${esc((wdInfinitower ? WAVE_DEFENSE_MAP_BY_ID.eternal_spiral : WAVE_DEFENSE_MAP_BY_ID[wdMapId])?.name || 'ASHEN KEEP')} · ${WAVE_DEFENSE_TOWER_BY_ID[wdSelectedTowerId]?.name || 'BALLISTA'} · ${WAVE_DEFENSE_DIFFICULTIES.find((entry) => entry.id === wdDifficulty)?.name || 'KNIGHT'}${wdInfinitower ? ` · TINGKAT / ${WAVE_DEFENSE_INFINITOWER_TIER_WAVES} GEL` : wdEndless ? ' · ∞' : ''}</em>`;
}

function buildWaveDefensePalette() {
  const palette = $('wd-palette');
  if (!palette) return;
  palette.innerHTML = WAVE_DEFENSE_TOWERS.map((tower) => `<button type="button" data-wd-tower="${tower.id}" style="--tower-color:${tower.color}">
    <img class="wp-icon" src="${waveDefenseTowerIconDataUrl(tower.id)}" alt="${esc(tower.name)}" /><span class="wp-name">${esc(tower.name)}</span><span class="wp-cost">${tower.cost}</span>
  </button>`).join('');
  wdSelectionKey = '';
  wdFeedKey = '';
}

function startWaveDefenseBattle() {
  if (!WAVE_DEFENSE_MAP_BY_ID[wdMapId]) wdMapId = WAVE_DEFENSE_MAPS[0].id;
  if (!WAVE_DEFENSE_TOWER_BY_ID[wdSelectedTowerId]) wdSelectedTowerId = WAVE_DEFENSE_TOWERS[0].id;
  wdMatch = createWaveDefense({
    mapId: wdMapId,
    difficulty: wdDifficulty,
    endless: wdEndless,
    infinitower: wdInfinitower,
    particleScale: waveDefenseParticleScale(),
    seed: (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0,
  });
  waveDefenseSelectTower(wdMatch, wdSelectedTowerId);
  wdActive = true;
  wdBossCutsceneSeen = false;
  wdPaused = false;
  wdResult = null;
  wdRecorded = false;
  wdUiTimer = 0;
  wdRenderDirty = true;
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  menuView = 'wavedefenseBattle';
  accumulator = 0;
  lastTime = performance.now();
  $('wd-result')?.classList.add('hidden');
  $('wd-pause')?.classList.add('hidden');
  buildWaveDefensePalette();
  updateWaveDefenseHud(true);
  syncScreens();
  const canvas = $('wd-canvas');
  const ctx = canvas?.getContext('2d');
  if (canvas && ctx) renderWaveDefense(ctx, wdMatch, { width: canvas.width, height: canvas.height, time: performance.now() / 1000 });
}

// ── Infinitower cinematics ─────────────────────────────────────────────────
function playWaveDefenseCutscene(scene, onDone) {
  if (!scene) return false;
  startCutscene(scene, onDone);
  return true;
}

function playWaveDefenseTrailer() {
  audio.init();
  audioUnlocked = true;
  return playWaveDefenseCutscene(SPIRAL_INTRO_CUTSCENE);
}

function playWaveDefenseIntro() {
  if (wdIntroSeen) return false;
  wdIntroSeen = true;
  if (wdActive) toggleWaveDefensePause(true);
  return playWaveDefenseCutscene(SPIRAL_INTRO_CUTSCENE, () => { if (wdActive) toggleWaveDefensePause(false); });
}

// The first boss of a run gets a full portrait. Later bosses keep the fight
// moving and announce themselves through the battle feed instead.
function maybeWaveDefenseBossCutscene() {
  if (!wdActive || !wdMatch || wdPaused || cutsceneActive || wdBossCutsceneSeen) return false;
  if (!wdMatch.infinitower) return false;
  if (!wdMatch.enemies.some((enemy) => enemy.boss && !enemy.dead)) return false;
  wdBossCutsceneSeen = true;
  toggleWaveDefensePause(true);
  return playWaveDefenseCutscene(SPIRAL_BOSS_CUTSCENE, () => { if (wdActive) toggleWaveDefensePause(false); });
}

function startWaveDefenseFromHub() {
  startWaveDefenseBattle();
  if (wdInfinitower && wdActive && !wdIntroSeen) playWaveDefenseIntro();
}

function toggleWaveDefensePause(next = !wdPaused) {
  if (!wdActive || !wdMatch) return;
  wdPaused = !!next;
  lastTime = performance.now();
  wdRenderDirty = true;
  syncScreens();
  updateWaveDefenseHud(true);
}

function leaveWaveDefense() {
  wdActive = false;
  wdPaused = false;
  wdMatch = null;
  wdResult = null;
  wdRecorded = false;
  wdRenderDirty = true;
  showWaveDefense();
}

function completeWaveDefense() {
  if (!wdMatch || wdMatch.phase !== 'ended' || wdRecorded) return;
  wdRecorded = true;
  const saved = recordWaveDefense(waveDefenseState(), wdMatch);
  progress.wavedefense = saved.progress;
  saveProgress();
  wdResult = {
    ...saved,
    mapName: wdMatch.map.name,
    difficultyName: WAVE_DEFENSE_DIFFICULTIES.find((entry) => entry.id === wdMatch.difficulty)?.name || 'KNIGHT',
    snapshot: waveDefenseSnapshot(wdMatch),
  };
  renderWaveDefenseResult();
  updateWaveDefenseHud(true);
}

function renderWaveDefenseResult() {
  const overlay = $('wd-result');
  if (!overlay || !wdResult) return;
  const r = wdResult;
  const infinitower = !!r.infinitower || !!r.snapshot?.infinitower;
  const endless = !!r.endless || !!r.snapshot?.endless;
  const win = r.win || r.snapshot?.result === 'victory';
  const tier = r.tier || r.snapshot?.tier || 1;
  const title = infinitower ? 'LINGKAR PADAM' : endless ? 'PASANG TANPA AKHIR' : win ? 'MAHKOTA BERTAHAN' : 'GERBANG TERBELAH';
  const body = infinitower
    ? `Infinitower runtuh pada gelombang ${r.snapshot?.wave || 0} — tingkat ${tier}. Rekor ${r.isRecord ? 'diperbarui' : 'tetap berdiri'}; lingkar berikutnya menunggu.`
    : endless
      ? `Benteng jatuh pada gelombang ${r.snapshot?.wave || 0}. Rekor ${r.isRecord ? 'diperbarui' : 'tetap berdiri'}.`
      : win ? 'Dua puluh empat gelombang hancur. Benteng terakhir masih berdiri.' : `Benteng jatuh pada gelombang ${r.snapshot?.wave || 0}. Bangun lebih awal dan tutup jalur dengan area damage.`;
  overlay.innerHTML = `<div class="wd-modal wd-result-card ${endless || win ? 'victory' : 'defeat'}">
    <p class="eyebrow">WAVE DEFENSE · ${esc(infinitower ? `INFINITOWER · TINGKAT ${tier}` : endless ? 'TANPA AKHIR' : r.mapName)} · ${formatPuzzleTime(r.snapshot?.time || 0)}</p>
    <h3 class="wd-result-title">${title}</h3>
    <p>${body}</p>
    <div class="wd-result-stats">
      <div><span>GELOMBANG</span><b>${r.snapshot?.wave || 0}${endless ? '' : `/${WAVE_DEFENSE_TOTAL_WAVES}`}</b></div>
      <div><span>KILL</span><b>${r.snapshot?.stats?.kills || 0}</b></div>
      <div><span>BOCOR</span><b>${r.snapshot?.stats?.leaks || 0}</b></div>
      <div><span>SKOR</span><b>${r.snapshot?.score || 0}</b></div>
    </div>
    <div class="wd-result-actions">
      <button class="btn btn-primary" type="button" data-wd-action="rematch">COBA LAGI</button>
      <button class="btn btn-ghost" type="button" data-wd-action="leave">KEMBALI KE HUB</button>
    </div>
  </div>`;
  overlay.classList.remove('hidden');
}

function waveDefenseSelectionKey() {
  if (!wdMatch) return '';
  const tower = wdMatch.selectedSlot >= 0 ? wdMatch.towers.find((entry) => entry.slot === wdMatch.selectedSlot) : null;
  return tower ? `${tower.id}:${tower.level}:${wdMatch.gold >= waveDefenseUpgradeCost(tower)}` : `slot:${wdMatch.selectedSlot}:${wdMatch.gold}`;
}

function updateWaveDefenseHud(force = false) {
  if (!wdMatch) return;
  if (wdMatch.phase === 'ended' && !wdRecorded) completeWaveDefense();
  if (!force && wdUiTimer < 1 / 8) return;
  wdUiTimer = 0;
  const m = wdMatch;
  const setText = (id, value) => { const node = $(id); if (node) node.textContent = value; };
  const hpRatio = Math.max(0, m.castle.hp / m.castle.maxHp);
  setText('wd-castle-text', `${Math.ceil(m.castle.hp)} / ${m.castle.maxHp}`);
  const fill = $('wd-castle-fill');
  if (fill) fill.style.width = `${hpRatio * 100}%`;
  const bar = $('wd-castle-bar');
  if (bar) bar.classList.toggle('low', hpRatio <= 0.3);
  setText('wd-map-name', m.infinitower ? `${m.map.name} · INFINITOWER T${infinitowerTierFor(m.wave)}` : m.endless ? `${m.map.name} · TANPA AKHIR` : m.map.name);
  setText('wd-wave', m.phase === 'prep' ? 'SIAP' : `${m.infinitower ? 'INFINITOWER' : 'GELOMBANG'} ${m.wave}`);
  setText('wd-phase', m.phase === 'prep'
    ? `${m.infinitower ? `TINGKAT ${infinitowerTierFor(m.wave + 1)} · ` : ''}GELOMBANG ${m.wave + 1}${m.endless ? ' · TANPA AKHIR' : ` / ${m.totalWaves}`} DALAM ${Math.max(0, m.prepTimer).toFixed(1)}`
    : m.phase === 'wave' ? `${m.enemies.length} MUSUH · ${m.stats.kills} KILL${m.infinitower ? ` · T${infinitowerTierFor(m.wave)}` : ''}` : 'PERTAHANAN SELESAI');
  setText('wd-gold', m.gold);
  setText('wd-score', m.score);
  setText('wd-kills', m.stats.kills);

  const next = $('btn-wd-next');
  if (next) {
    next.disabled = m.phase !== 'prep';
    next.textContent = m.phase === 'prep' ? `KIRIM GELOMBANG ${Math.min(m.totalWaves, m.wave + 1)}` : m.phase === 'wave' ? `GELOMBANG ${m.wave} BERJALAN` : 'PERTAHANAN SELESAI';
  }
  document.querySelectorAll('#wd-speed [data-wd-speed]').forEach((button) => button.classList.toggle('active', Number(button.dataset.wdSpeed) === m.speed));
  document.querySelectorAll('#wd-battle-particles [data-wd-pscale]').forEach((button) => button.classList.toggle('active', Math.abs(Number(button.dataset.wdPscale) - (m.particleScale ?? 1)) < 0.15));
  document.querySelectorAll('#wd-palette [data-wd-tower]').forEach((button) => {
    const def = WAVE_DEFENSE_TOWER_BY_ID[button.dataset.wdTower];
    button.classList.toggle('active', button.dataset.wdTower === m.buildTowerId);
    button.classList.toggle('disabled', !def || m.gold < def.cost);
  });

  const boss = m.enemies.find((enemy) => enemy.boss);
  const bossPanel = $('wd-boss-panel');
  if (bossPanel) {
    bossPanel.classList.toggle('hidden', !boss);
    if (boss) {
      setText('wd-boss-name', `${boss.name} · ${Math.ceil(boss.hp)} / ${boss.maxHp}`);
      const bossFill = $('wd-boss-fill');
      if (bossFill) bossFill.style.width = `${Math.max(0, boss.hp / boss.maxHp) * 100}%`;
    }
  }

  const selection = $('wd-selection');
  const key = waveDefenseSelectionKey();
  if (selection && key !== wdSelectionKey) {
    wdSelectionKey = key;
    const tower = m.selectedSlot >= 0 ? m.towers.find((entry) => entry.slot === m.selectedSlot) : null;
    if (tower) {
      const def = WAVE_DEFENSE_TOWER_BY_ID[tower.towerId];
      const cost = waveDefenseUpgradeCost(tower);
      const maxed = tower.level >= 3;
      selection.innerHTML = `<div class="ws-line"><img class="ws-icon" src="${waveDefenseTowerIconDataUrl(def.id)}" alt="${esc(def.name)}" /><strong>${esc(def.name)} · POS ${tower.slot + 1}</strong><span>LEVEL ${tower.level}/3</span><em>${def.cost} emas</em></div>
        <p>${esc(def.desc)}</p>
        <div class="wd-selection-actions">
          <button type="button" data-wd-action="upgrade" ${maxed || m.gold < cost ? 'disabled' : ''}>${maxed ? 'LEVEL MAKSIMUM' : `TINGKATKAN · ${cost} EMAS`}</button>
          <button type="button" data-wd-action="sell">JUAL +${waveDefenseSellValue(tower)}</button>
        </div>`;
    } else {
      const def = WAVE_DEFENSE_TOWER_BY_ID[m.buildTowerId];
      selection.innerHTML = `<div class="ws-line">${def ? `<img class="ws-icon" src="${waveDefenseTowerIconDataUrl(def.id)}" alt="${esc(def.name)}" />` : ''}<strong>POS ${m.selectedSlot >= 0 ? m.selectedSlot + 1 : '—'}</strong><span>${def?.name || 'PILIH MENARA'}</span><em>${def?.cost || 0} emas</em></div>
        <p>Klik pos kosong untuk membangun. Pilih menara di panel kiri, lalu klik pos di sepanjang jalan.</p>
        <div class="wd-selection-actions"><button type="button" data-wd-action="hint" disabled>MENUNGGU POS</button></div>`;
    }
  }

  const feedKey = m.texts.map((entry) => entry.text).join('|');
  if (feedKey !== wdFeedKey) {
    wdFeedKey = feedKey;
    const feed = $('wd-feed');
    if (feed) feed.innerHTML = m.texts.slice(-5).reverse().map((entry) => `<span style="color:${entry.color}">${esc(entry.text)}</span>`).join('');
  }
  const pause = $('wd-pause');
  if (pause) pause.classList.toggle('hidden', !wdPaused);
}

function waveDefensePointerWorld(event) {
  const canvas = $('wd-canvas');
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / Math.max(1, rect.width)) * canvas.width,
    y: ((event.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height,
  };
}

function waveDefenseSlotAt(x, y) {
  if (!wdMatch) return -1;
  let best = -1;
  let bestDist = 27;
  for (const slot of wdMatch.slots) {
    const dist = Math.hypot(slot.x - x, slot.y - y);
    if (dist < bestDist) { bestDist = dist; best = slot.index; }
  }
  return best;
}

function handleWaveDefenseSlot(index) {
  if (!wdMatch || wdMatch.phase === 'ended' || index < 0) return;
  const slot = wdMatch.slots[index];
  if (!slot) return;
  if (slot.towerId === null) {
    const def = WAVE_DEFENSE_TOWER_BY_ID[wdMatch.buildTowerId];
    if (def && wdMatch.gold >= def.cost) waveDefenseBuild(wdMatch, index, wdMatch.buildTowerId);
    else waveDefenseSelect(wdMatch, index);
  } else {
    waveDefenseSelect(wdMatch, index);
  }
  wdRenderDirty = true;
  updateWaveDefenseHud(true);
}

// ── Pirate Tide: open-world hub, voyage and result handling ─────────
function pirateState() {
  if (!progress.pirates) progress.pirates = defaultPirateProgress();
  return progress.pirates;
}

function showPirates() {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  pirateActive = false;
  piratePaused = false;
  pirateMatch = null;
  pirateResult = null;
  pirateRecorded = false;
  pirateLastSnapshot = null;
  pirateHeld.clear();
  menuView = 'pirates';
  if (!pirateStageUnlocked(pirateState(), pirateStageId)) pirateStageId = PIRATE_STAGES[0].id;
  buildPirateScreen();
  syncScreens();
}

function buildPirateScreen() {
  const state = pirateState();
  const summary = pirateSummary(state);
  const summaryEl = $('pirate-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="pirate-stat"><span>PELAYARAN</span><strong>${summary.voyages}</strong><em>${summary.wins} menang · ${summary.losses} kalah</em></div>
      <div class="pirate-stat"><span>KAPTEN</span><strong>${summary.cleared}/${summary.total}</strong><em>rute selesai</em></div>
      <div class="pirate-stat"><span>AKURASI MERIAM</span><strong>${summary.accuracy}%</strong><em>${summary.totalHits}/${summary.totalShots} tembakan</em></div>
      <div class="pirate-stat"><span>KAPAL TENGGELAM</span><strong>${summary.totalKills}</strong><em>${summary.totalGold} emas dirampas</em></div>
      <div class="pirate-stat"><span>SKOR TERBAIK</span><strong>${summary.bestScore}</strong><em>laut terbuka</em></div>
      <div class="pirate-stat"><span>DUNIA</span><strong>${summary.islands}</strong><em>${summary.ports} pelabuhan · ${summary.bosses} kapten</em></div>`;
  }
  const stages = $('pirate-stages');
  if (stages) {
    stages.innerHTML = PIRATE_STAGES.map((stage) => {
      const unlocked = pirateStageUnlocked(state, stage.id);
      const record = state.stages?.[stage.id] || {};
      return `<button class="pirate-stage-card${stage.id === pirateStageId ? ' active' : ''}${unlocked ? '' : ' locked'}" type="button" data-pirate-stage="${stage.id}" ${unlocked ? '' : 'disabled'}>
        <span class="ps-index">${String(stage.index + 1).padStart(2, '0')}</span>
        <strong>${esc(stage.name)}</strong>
        <em>${esc(stage.subtitle)}</em>
        <span>${esc(stage.desc)}</span>
        <b>${unlocked ? `${record.cleared ? 'SELESAI' : `${stage.targetKills} KAPAL + KAPTEN`}${record.bestTime ? ` · ${formatPuzzleTime(record.bestTime)}` : ''}` : 'TERKUNCI · SELESAIKAN RUTE SEBELUMNYA'}</b>
      </button>`;
    }).join('');
  }
  const world = $('pirate-world');
  if (world) {
    world.innerHTML = PIRATE_ISLANDS.map((island) => `<div class="pirate-island${island.port ? ' port' : ''}">
      <strong>${esc(island.name)}</strong><span>${island.port ? 'PELABUHAN · REPARASI' : 'PERAIRAN TERBUKA'}</span>
    </div>`).join('');
  }
  const endlessEl = $('pirate-endless');
  if (endlessEl) {
    const best = summary.endless || {};
    endlessEl.innerHTML = `<div class="pirate-endless-card">
      <div class="pe-copy">
        <strong>PASANG TAK BERUJUNG</strong>
        <span>Tanpa kapten terakhir. Setiap pasang menambah armada, memperkuat lambungmu, dan mendatangkan kapten baru tiap tiga pasang. Berlabuh tetap bisa menyelamatkan lambung.</span>
        <em>REKOR: PASANG ${best.bestSurge || 0} · ${best.bestKills || 0} KAPAL · SKOR ${best.bestScore || 0}</em>
      </div>
      <button id="btn-pirate-endless" class="btn btn-ghost" type="button" data-pirate-endless="start">MULAI PASANG TAK BERUJUNG</button>
    </div>`;
  }
  const count = $('pirate-count');
  if (count) count.textContent = `${PIRATE_SHIP_TYPES.length} JENIS KAPAL · ${PIRATE_BOSS_TYPES.length} KAPTEN · ${PIRATE_PORTS.length} PELABUHAN`;
  const button = $('btn-pirate-start');
  if (button) {
    const stage = PIRATE_STAGE_BY_ID[pirateStageId] || PIRATE_STAGES[0];
    button.innerHTML = `<span>TAK LAYAR</span><em>${esc(stage.name)} · ${stage.targetKills} kapal · ${esc(PIRATE_BOSS_TYPES.find((boss) => boss.id === stage.bossId)?.name || 'KAPTEN')}</em>`;
  }
  const controls = $('pirate-controls');
  if (controls) controls.classList.add('hidden');
}

function syncPirateCanvasSize() {
  const canvas = $('pirate-canvas');
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return canvas;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let width = rect.width * dpr;
  let height = rect.height * dpr;
  const scale = Math.min(1, 1280 / width, 900 / height);
  width = Math.max(320, Math.round(width * scale));
  height = Math.max(240, Math.round(height * scale));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  return canvas;
}

function beginPirateMatch(match) {
  pirateMatch = match;
  pirateActive = true;
  piratePaused = false;
  pirateResult = null;
  pirateRecorded = false;
  pirateLastSnapshot = null;
  pirateUiTimer = 0;
  pirateHeld.clear();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  menuView = 'piratesBattle';
  accumulator = 0;
  lastTime = performance.now();
  $('pirate-result')?.classList.add('hidden');
  $('pirate-pause')?.classList.add('hidden');
  $('pirate-controls')?.classList.remove('hidden');
  updatePirateHud(true);
  syncScreens();
  const canvas = syncPirateCanvasSize();
  const ctx = canvas?.getContext('2d');
  if (canvas && ctx) renderPirateVoyage(ctx, pirateMatch, { width: canvas.width, height: canvas.height, time: performance.now() / 1000 });
  return true;
}

function startPirateVoyage() {
  const stage = PIRATE_STAGE_BY_ID[pirateStageId] || PIRATE_STAGES[0];
  if (!pirateStageUnlocked(pirateState(), stage.id)) return false;
  return beginPirateMatch(createPirateVoyage({
    stageId: stage.id,
    seed: (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0,
  }));
}

function startPirateEndless() {
  return beginPirateMatch(createPirateEndless({
    seed: (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0,
  }));
}

function togglePiratePause(next = !piratePaused) {
  if (!pirateActive || !pirateMatch || pirateMatch.phase !== 'sailing') return;
  piratePaused = !!next;
  pirateHeld.clear();
  setPirateControls(pirateMatch, { throttle: 0, turn: 0 });
  lastTime = performance.now();
  syncScreens();
  updatePirateHud(true);
}

function leavePirates() {
  pirateActive = false;
  piratePaused = false;
  pirateMatch = null;
  pirateResult = null;
  pirateRecorded = false;
  pirateLastSnapshot = null;
  pirateHeld.clear();
  showPirates();
}

function completePirateVoyage() {
  if (!pirateMatch || pirateRecorded) return;
  if (pirateMatch.phase !== 'cleared' && pirateMatch.phase !== 'sunk') return;
  pirateRecorded = true;
  const saved = pirateMatch.endless
    ? recordPirateEndless(pirateState(), pirateMatch)
    : recordPirateVoyage(pirateState(), pirateMatch);
  progress.pirates = saved.progress;
  saveProgress();
  pirateResult = {
    ...saved,
    snapshot: pirateSnapshot(pirateMatch),
    endless: !!pirateMatch.endless,
    bossName: PIRATE_BOSS_TYPES.find((boss) => boss.id === pirateMatch.stage.bossId)?.name || '',
  };
  buildPirateScreen();
  renderPirateResult();
  updatePirateHud(true);
}

function renderPirateResult() {
  const overlay = $('pirate-result');
  if (!overlay || !pirateResult) return;
  const r = pirateResult;
  const endless = !!r.endless;
  const win = r.win;
  const title = endless ? 'PASANG BERAKHIR' : win ? 'KAPTEN JATUH' : 'LAMBUNG TERBELAH';
  const body = endless
    ? `Kau bertahan sampai pasang ${r.surge || r.snapshot?.surge || 1} dan menenggelamkan ${r.kills || 0} kapal. ${r.isRecord ? 'Rekor baru tersimpan.' : 'Rekor lama masih berdiri.'}`
    : win
      ? `${esc(r.bossName)} tenggelam. Laut terbuka dan rute berikutnya menunggu.`
      : `Kau tenggelam setelah ${r.snapshot?.kills || 0} kapal. Pelabuhan dapat memulihkan lambung, tetapi hanya jika masih ada emas.`;
  overlay.innerHTML = `<div class="pirate-modal pirate-result-card ${endless || win ? 'victory' : 'defeat'}">
    <p class="eyebrow">PIRATE TIDE · ${esc(endless ? 'PASANG TAK BERUJUNG' : r.stageName)} · ${formatPuzzleTime(r.time || r.snapshot?.time || 0)}</p>
    <h3>${title}</h3>
    <p>${body}</p>
    <div class="pirate-result-stats">
      ${endless ? `<div><span>PASANG</span><b>${r.surge || 0}</b></div>` : ''}
      <div><span>KAPAL</span><b>${endless ? r.kills || 0 : `${r.snapshot?.kills || 0}/${r.snapshot?.targetKills || 0}`}</b></div>
      <div><span>TEMBAKAN</span><b>${r.snapshot?.shotsFired || 0}</b></div>
      <div><span>KAPTEN</span><b>${r.snapshot?.captains || 0}</b></div>
      <div><span>SKOR</span><b>${r.score || 0}</b></div>
    </div>
    <div class="pirate-result-actions">
      <button class="btn btn-primary" type="button" data-pirate-action="retry">LAYAR LAGI</button>
      <button class="btn btn-ghost" type="button" data-pirate-action="leave">KEMBALI KE HUB</button>
    </div>
  </div>`;
  overlay.classList.remove('hidden');
}

function updatePirateHud(force = false) {
  if (!pirateMatch) return;
  if ((pirateMatch.phase === 'cleared' || pirateMatch.phase === 'sunk') && !pirateRecorded) completePirateVoyage();
  if (!force && pirateUiTimer < 1 / 8) return;
  pirateUiTimer = 0;
  const snapshot = pirateSnapshot(pirateMatch);
  pirateLastSnapshot = snapshot;
  const setText = (id, value) => { const node = $(id); if (node) node.textContent = value; };
  const p = snapshot.player;
  const hpPct = clamp(p.hp / p.maxHp, 0, 1) * 100;
  setText('pirate-hull-text', `${Math.ceil(p.hp)} / ${p.maxHp}`);
  const hull = $('pirate-hull-fill'); if (hull) hull.style.width = `${hpPct}%`;
  setText('pirate-stage-name', snapshot.stageName);
  setText('pirate-objective', snapshot.endless
    ? `${snapshot.kills} KAPAL · PASANG ${snapshot.surge} · ${Math.ceil(snapshot.surgeTimer)}s`
    : snapshot.bossSpawned
      ? (snapshot.bossDefeated ? 'KAPTEN TENGGELAM' : `KAPTEN: ${snapshot.bossName}`)
      : `${snapshot.kills}/${snapshot.targetKills} KAPAL · CARI KAPTEN`);
  setText('pirate-gold', snapshot.gold);
  setText('pirate-kills', snapshot.endless ? snapshot.kills : `${snapshot.kills}/${snapshot.targetKills}`);
  setText('pirate-score', snapshot.score);
  setText('pirate-speed', `${Math.round(Math.abs(pirateMatch.player.speed))} KN`);
  setText('pirate-port-text', snapshot.nearPort?.inRange ? `BERLABUH · ${PIRATE_DOCK_COST} EMAS` : (snapshot.nearPort?.name || 'PELABUHAN'));
  const portButton = $('btn-pirate-dock');
  if (portButton) {
    portButton.disabled = !snapshot.nearPort?.inRange || snapshot.gold < PIRATE_DOCK_COST || p.hp >= p.maxHp || snapshot.phase !== 'sailing';
    portButton.classList.toggle('ready', snapshot.nearPort?.inRange && snapshot.gold >= PIRATE_DOCK_COST && p.hp < p.maxHp);
  }
  const portPanel = $('pirate-port');
  if (portPanel) portPanel.classList.toggle('hidden', !snapshot.nearPort?.inRange);
  const bossPanel = $('pirate-boss-panel');
  if (bossPanel) bossPanel.classList.toggle('hidden', !snapshot.bossSpawned || snapshot.bossDefeated);
  setText('pirate-boss-name', snapshot.bossName);
  const bossFill = $('pirate-boss-fill');
  if (bossFill) bossFill.style.width = `${snapshot.bossMaxHp ? clamp(snapshot.bossHp / snapshot.bossMaxHp, 0, 1) * 100 : 0}%`;
  const portCd = $('pirate-port-cooldown');
  if (portCd) portCd.textContent = snapshot.reloadPort > 0 ? `${snapshot.reloadPort.toFixed(1)}s` : 'SIAP';
  const starboardCd = $('pirate-starboard-cooldown');
  if (starboardCd) starboardCd.textContent = snapshot.reloadStarboard > 0 ? `${snapshot.reloadStarboard.toFixed(1)}s` : 'SIAP';
  const portFire = $('btn-pirate-fire-port');
  if (portFire) portFire.classList.toggle('cooling', snapshot.reloadPort > 0);
  const starboardFire = $('btn-pirate-fire-starboard');
  if (starboardFire) starboardFire.classList.toggle('cooling', snapshot.reloadStarboard > 0);
  const feed = $('pirate-feed');
  if (feed) {
    feed.innerHTML = snapshot.messages.map((message) => `<span class="${message.tone}">${esc(message.text)}</span>`).join('');
  }
  const pause = $('pirate-pause');
  if (pause) pause.classList.toggle('hidden', !piratePaused);
}

function piratePointerWorld(event) {
  const canvas = $('pirate-canvas');
  if (!canvas || !pirateMatch) return null;
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * canvas.width;
  const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height;
  return pirateScreenToWorld(pirateMatch, x, y, canvas.width, canvas.height);
}

const pirateHeld = new Set();
function setPirateControlKey(code, down) {
  if (!pirateActive) return;
  if (down) pirateHeld.add(code);
  else pirateHeld.delete(code);
  if (!pirateMatch) return;
  const throttle = (pirateHeld.has('KeyW') || pirateHeld.has('ArrowUp') ? 1 : 0) - (pirateHeld.has('KeyS') || pirateHeld.has('ArrowDown') ? 1 : 0);
  const turn = (pirateHeld.has('KeyD') || pirateHeld.has('ArrowRight') ? 1 : 0) - (pirateHeld.has('KeyA') || pirateHeld.has('ArrowLeft') ? 1 : 0);
  setPirateControls(pirateMatch, { throttle, turn });
}

function firePirateSide(side) {
  if (!pirateActive || piratePaused || !pirateMatch) return false;
  const fired = pirateFire(pirateMatch, side);
  if (fired) updatePirateHud(true);
  return fired;
}

function dockPirate() {
  if (!pirateActive || piratePaused || !pirateMatch) return;
  const result = pirateDock(pirateMatch);
  if (!result.ok) showToast(result.reason, 1800);
  else showToast(`Lambung dipulihkan +${Math.round(result.healed)}.`, 1600);
  updatePirateHud(true);
}

// ── Overdrive Hub ─────────────────────────────────────────────────
function showOverdrive(tab = 'campaign301') {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'overdrive';
  overdriveTab = tab;
  clearHeldKeys();
  buildOverdriveScreen();
  syncScreens();
}

function closeOverdrive() {
  showMenu();
}

// ── The Sundered Atlas hub ─────────────────────────────────────────
function showAtlas(tab = 'zones') {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'atlas';
  atlasTab = tab;
  const p = atlasState();
  unlockAtlasZones(p);
  if (!ATLAS_ZONE_BY_ID[atlasZoneId]) atlasZoneId = 'vael';
  clearHeldKeys();
  buildAtlasScreen();
  syncScreens();
}

function closeAtlas() {
  showMenu();
}

const ATLAS_TEMPLATE_LABEL = {
  entry: 'GERBANG',
  combat: 'TEMPUR',
  traversal: 'LINTASAN',
  puzzle: 'SEGEL',
  elite: 'ELITE',
  rest: 'ISTIRAHAT',
  tower: 'MENARA',
  secret: 'RAHASIA',
  miniBoss: 'MINI-BOS',
  boss: 'BOS',
};

const ATLAS_TEMPLATE_GLYPH = {
  entry: '◈',
  combat: '◆',
  traversal: '≋',
  puzzle: '✧',
  elite: '✹',
  rest: '⌂',
  tower: '▲',
  secret: '◈',
  miniBoss: '✹',
  boss: '♛',
};

function atlasZoneCleared(zoneId) {
  const p = atlasState();
  const zone = ATLAS_ZONE_BY_ID[zoneId];
  if (!zone) return 0;
  let cleared = 0;
  for (let local = 0; local < 30; local++) {
    if (p.clearedRooms[zone.roomStart + local]) cleared += 1;
  }
  return cleared;
}

function atlasMaxClearedLocal(zoneId) {
  const p = atlasState();
  const zone = ATLAS_ZONE_BY_ID[zoneId];
  if (!zone) return -1;
  let max = -1;
  for (let local = 0; local < 30; local++) {
    if (p.clearedRooms[zone.roomStart + local]) max = Math.max(max, local);
  }
  return max;
}

function atlasRoomAvailable(roomIndex) {
  const room = ATLAS_ROOM_BY_ID[roomIndex];
  if (!room) return false;
  const p = atlasState();
  const zone = ATLAS_ZONE_BY_ID[room.atlasZone];
  if (!zone || !p.unlockedZones.includes(zone.id)) return false;
  if (!canUnlockAtlasZone(p, zone.id)) return false;
  if (room.atlasLocal === 0) return true;
  return room.atlasLocal <= atlasMaxClearedLocal(zone.id) + 2;
}

function atlasMissingAbilities(zoneId) {
  const zone = ATLAS_ZONE_BY_ID[zoneId];
  const p = atlasState();
  if (!zone) return [];
  return zone.requires.filter((id) => !(p.abilities || []).includes(id));
}

function atlasSelectedZone() {
  return ATLAS_ZONE_BY_ID[atlasZoneId] || ATLAS_ZONES[0];
}

function atlasRoomState(roomIndex) {
  const p = atlasState();
  const room = ATLAS_ROOM_BY_ID[roomIndex];
  if (!room) return 'locked';
  if (p.clearedRooms[roomIndex]) return 'cleared';
  if (atlasRoomAvailable(roomIndex)) return 'available';
  return 'locked';
}

function buildAtlasScreen() {
  const wrap = $('atlas-body');
  if (!wrap) return;
  const p = atlasState();
  unlockAtlasZones(p);
  const stats = atlasStats(p);
  const lore = loreCompletion(p);
  const summaryEl = $('atlas-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div><span>RUANG TUNTAS</span><strong>${stats.cleared} / ${stats.totalRooms}</strong><em>${Math.round(stats.percent * 100)}% Atlas</em></div>
      <div><span>TANDA</span><strong>✦ ${stats.marks}</strong><em>mata uang Atlas</em></div>
      <div><span>FRAGMEN LORE</span><strong>${stats.fragments}</strong><em>${lore.revealed} / ${lore.total} tier</em></div>
      <div><span>ZONA TERBUKA</span><strong>${stats.zones} / ${ATLAS_ZONES.length}</strong><em>${stats.bosses} bos gugur</em></div>
      <div><span>KEMAMPUAN</span><strong>${stats.abilities} / ${ATLAS_ABILITY_GATES.length}</strong><em>gerbang terbuka</em></div>
      <div><span>AKHIRAN</span><strong>${p.endings.length} / ${ATLAS_ENDINGS.length}</strong><em>tercatat</em></div>
    `;
  }
  document.querySelectorAll('#atlas-tabs [data-tab]').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === atlasTab);
  });
  if (atlasTab === 'story') buildAtlasStoryTab(wrap);
  else if (atlasTab === 'lore') buildAtlasLoreTab(wrap);
  else if (atlasTab === 'shops') buildAtlasShopsTab(wrap);
  else if (atlasTab === 'gear') buildAtlasGearTab(wrap);
  else if (atlasTab === 'items') buildAtlasItemsTab(wrap);
  else if (atlasTab === 'systems') buildAtlasSystemsTab(wrap);
  else buildAtlasZonesTab(wrap);
}

function buildAtlasZonesTab(wrap) {
  const p = atlasState();
  wrap.innerHTML = `
    <section class="exp-section">
      <div class="exp-section-head">
        <h3>DELAPAN HALAMAN ATLAS</h3>
        <span>Pilih ruang yang tersedia · progres per ruang tersimpan</span>
      </div>
      <div class="atlas-zone-grid">
        ${ATLAS_ZONES.map((zone) => {
          const tier = ATLAS_WORLD_TIERS.find((entry) => entry.id === zone.tier) || ATLAS_WORLD_TIERS[0];
          const boss = ATLAS_BOSS_INFO[zone.boss];
          const unlocked = p.unlockedZones.includes(zone.id) && canUnlockAtlasZone(p, zone.id);
          const missing = atlasMissingAbilities(zone.id);
          const cleared = atlasZoneCleared(zone.id);
          const zoneRooms = ATLAS_ROOMS.filter((room) => room.atlasZone === zone.id);
          const nextRoom = zoneRooms.find((room) => !p.clearedRooms[room.id] && atlasRoomAvailable(room.id))
            || zoneRooms.find((room) => atlasRoomAvailable(room.id))
            || zoneRooms[0];
          return `
            <article class="atlas-zone-card${unlocked ? '' : ' locked'}" style="--zone-color:${zone.color}">
              <div class="atlas-zone-head">
                <div>
                  <h3>${esc(zone.name)}</h3>
                  <span>${esc(zone.localName)} · ${esc(zone.subtitle)}</span>
                </div>
                <span class="atlas-zone-tier">${esc(tier.localName)} · T${tier.level}</span>
              </div>
              <p>${esc(zone.hero)}</p>
              <div class="atlas-zone-meta">
                <span>BOS <b>${esc(boss?.name || '—')}</b></span>
                <span>BAHAYA <b>${esc(zone.hazard.name)}</b></span>
                <span>RUANG <b>${cleared}/30</b></span>
                <span>LEVEL <b>${zone.levelStart}–${zone.levelEnd}</b></span>
              </div>
              <div class="atlas-room-grid">
                ${zoneRooms.map((room) => {
                  const state = atlasRoomState(room.id);
                  const bossRoom = room.atlasTemplate === 'boss' || room.atlasTemplate === 'miniBoss';
                  const label = room.atlasTemplate === 'boss' ? '♛' : room.atlasTemplate === 'miniBoss' ? '✹' : room.atlasLocal + 1;
                  return `<button class="atlas-room-btn ${state}${bossRoom ? ' boss' : ''}" type="button"
                    data-atlas-action="start-room" data-room="${room.id}"
                    title="${esc(room.name)} · ${ATLAS_TEMPLATE_LABEL[room.atlasTemplate] || room.atlasTemplate}"
                    ${state === 'locked' ? 'disabled' : ''}>
                    ${label}<em>${state === 'cleared' ? '✓' : ATLAS_TEMPLATE_GLYPH[room.atlasTemplate] || ''}</em>
                  </button>`;
                }).join('')}
              </div>
              <div class="atlas-zone-actions">
                <span>${unlocked
                  ? (zone.requires.length ? `Gerbang: ${zone.requires.map((id) => ATLAS_ABILITY_BY_ID[id]?.localName || id).join(' · ')}` : 'Tanpa gerbang kemampuan')
                  : `Terkunci — butuh ${missing.map((id) => ATLAS_ABILITY_BY_ID[id]?.localName || id).join(', ') || 'kemampuan zona sebelumnya'}`}</span>
                <button class="atlas-btn primary" type="button" data-atlas-action="enter-zone" data-zone="${zone.id}"
                  ${unlocked && nextRoom ? '' : 'disabled'}>
                  ${cleared >= 30 ? 'ULANGI ZONA' : 'MASUK ZONA'}
                </button>
              </div>
            </article>`;
        }).join('')}
      </div>
    </section>
  `;
}

function buildAtlasStoryTab(wrap) {
  const p = atlasState();
  const unlockedZones = new Set(p.unlockedZones || []);
  wrap.innerHTML = `
    <section class="exp-section">
      <div class="exp-section-head">
        <h3>LINIMASA SUMPAH</h3>
        <span>${ATLAS_TIMELINE.length} babak · dari langit pertama sampai Atlas terbelah</span>
      </div>
      <div class="atlas-grid-2">
        ${ATLAS_TIMELINE.map((entry) => `
          <article class="atlas-card">
            <h4>${esc(entry.year)} — ${esc(entry.title)}</h4>
            <p>${esc(entry.text)}</p>
          </article>`).join('')}
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>PENJAGA &amp; TOKOH</h3>
        <span>${ATLAS_CHARACTERS.length} nama yang tercatat</span>
      </div>
      <div class="atlas-grid-3">
        ${ATLAS_CHARACTERS.map((char) => `
          <article class="atlas-card" style="--lore-color:${char.color}">
            <h4>${esc(char.name)}</h4>
            <span class="atlas-price">${esc(char.role)}</span>
            <p>${esc(char.desc)}</p>
          </article>`).join('')}
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>DELAPAN BAB</h3>
        <span>${unlockedZones.size} zona terbuka</span>
      </div>
      <div class="atlas-list">
        ${ATLAS_CHAPTERS.map((chapter) => {
          const zone = ATLAS_ZONE_BY_ID[chapter.zone];
          const boss = ATLAS_BOSS_INFO[chapter.boss];
          const open = unlockedZones.has(chapter.zone);
          return `
            <div class="atlas-row" style="--lore-color:${zone?.color || '#d0b45a'}">
              <div class="atlas-row-main">
                <strong>BAB ${chapter.number} · ${esc(chapter.title)} — ${esc(chapter.localTitle)}</strong>
                <span>Level ${chapter.levelStart}–${chapter.levelEnd} · ${esc(chapter.summary)}</span>
                <p>${esc(chapter.hook)}</p>
              </div>
              <div class="atlas-row-side">
                <span class="atlas-price">${esc(boss?.name || '—')}</span>
                <span class="atlas-chip ${open ? 'active' : ''}">${open ? 'TERBUKA' : 'TERKUNCI'}</span>
              </div>
            </div>`;
        }).join('')}
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>EMPAT AKHIRAN</h3>
        <span>${p.endings.length} / ${ATLAS_ENDINGS.length} tercatat</span>
      </div>
      <div class="atlas-grid-2">
        ${ATLAS_ENDINGS.map((ending) => {
          const owned = p.endings.includes(ending.id);
          return `
            <article class="atlas-card${owned ? '' : ' locked'}" style="--lore-color:${ending.color}">
              <h4>${owned ? '✦ ' : '◇ '}${esc(ending.localName)}</h4>
              <span class="atlas-price">${esc(ending.name)}</span>
              <p>${owned ? esc(ending.desc) : esc(ending.requirement)}</p>
            </article>`;
        }).join('')}
      </div>
    </section>
  `;
}

function buildAtlasLoreTab(wrap) {
  const p = atlasState();
  const completion = loreCompletion(p);
  const category = atlasLoreCategory === 'all' ? null : atlasLoreCategory;
  const entries = searchLore(atlasLoreQuery, p, { category });
  wrap.innerHTML = `
    <section class="exp-section">
      <div class="exp-section-head">
        <h3>INDEKS SUMPAH</h3>
        <span>${completion.revealed} / ${completion.total} tier terungkap · ${p.loreFragments} fragmen</span>
      </div>
      <div class="atlas-progress-line">
        ${expBar(completion.revealed, completion.total)}
        <span class="atlas-price">${Math.round(completion.percent * 100)}%</span>
      </div>
      <div class="atlas-chip-row" style="margin-top:10px;">
        <button class="atlas-chip${atlasLoreCategory === 'all' ? ' active' : ''}" type="button" data-atlas-action="lore-category" data-category="all">SEMUA</button>
        ${LORE_CATEGORIES.map((entry) => {
          const cat = completion.categories.find((candidate) => candidate.id === entry.id);
          return `<button class="atlas-chip${atlasLoreCategory === entry.id ? ' active' : ''}" type="button"
            data-atlas-action="lore-category" data-category="${entry.id}"
            title="${cat?.complete ? 'Kategori tuntas' : `${cat?.complete || 0}/${cat?.total || 0} entri tuntas`}">
            ${entry.glyph} ${esc(entry.name)} ${cat?.complete || 0}/${cat?.total || 0}
          </button>`;
        }).join('')}
      </div>
      <div style="margin-top:10px;">
        <input id="atlas-lore-search" class="atlas-lore-search" type="search" placeholder="Cari nama, tempat, atau rahasia..."
          value="${esc(atlasLoreQuery)}" autocomplete="off" />
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>CATATAN TERBUKA</h3>
        <span>${entries.length} entri</span>
      </div>
      <div class="atlas-list">
        ${entries.length ? entries.map((entry) => {
          const tier = p.lore[entry.id] || 0;
          const cat = LORE_CATEGORIES.find((candidate) => candidate.id === entry.category);
          const nextTier = Math.min(3, tier + 1);
          const nextCost = entry.tierCosts[nextTier - 1] || 0;
          return `
            <article class="atlas-lore-entry" style="--lore-color:${cat?.color || '#d0b45a'}">
              <header>
                <h4><b>${entry.glyph}</b>${esc(entry.title)}</h4>
                <span class="atlas-price">${cat?.name || entry.category} · ${tier}/3</span>
              </header>
              ${entry.tiers.map((text, index) => {
                const revealed = index < Math.max(1, tier);
                return `<p class="atlas-lore-tier${revealed ? '' : ' locked'}">
                  ${revealed ? esc(text) : `Tier ${index + 1} — butuh ${entry.tierCosts[index]} fragmen untuk mengungkap.`}
                </p>`;
              }).join('')}
              <div class="atlas-lore-actions">
                <span class="atlas-price">${tier >= 3 ? 'TERUNGKAP PENUH' : `Fragmen: ${p.loreFragments}`}</span>
                <button class="atlas-btn${tier < 3 ? ' primary' : ''}" type="button" data-atlas-action="reveal" data-entry="${entry.id}"
                  ${tier >= 3 || p.loreFragments < nextCost ? 'disabled' : ''}>
                  ${tier >= 3 ? 'SELESAI' : `UNGKAP TIER ${nextTier} (${nextCost})`}
                </button>
              </div>
            </article>`;
        }).join('') : '<p class="atlas-row-main span">Tidak ada entri yang cocok dengan pencarian.</p>'}
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>HADIAH KATEGORI</h3>
        <span>Selesaikan semua tier satu kategori untuk hadiah</span>
      </div>
      <div class="atlas-grid-3">
        ${LORE_COMPLETION_REWARDS.map((reward) => {
          const cat = completion.categories.find((candidate) => candidate.id === reward.category);
          return `
            <article class="atlas-card${cat?.done ? '' : ' locked'}">
              <h4>${cat?.glyph || '◇'} ${esc(cat?.name || reward.category)}</h4>
              <p>${cat?.done ? '✓ Hadiah diklaim.' : `${cat?.complete || 0}/${cat?.total || 0} entri tuntas.`}</p>
              <div class="atlas-card-meta"><span>✦ ${reward.marks} tanda</span><span>✧ ${reward.fragment} fragmen</span></div>
            </article>`;
        }).join('')}
      </div>
    </section>
  `;
}

function atlasZoneName(zoneId) {
  return ATLAS_ZONE_BY_ID[zoneId]?.localName || 'Atlas';
}

function atlasConsumableCount(p, id) {
  return Math.max(0, Math.floor(Number(p.consumables?.[id]) || 0));
}

function atlasShopForZone(zoneId) {
  return ATLAS_SHOPS.find((shop) => shop.zone === zoneId) || null;
}

function atlasRecipeCraftable(p, recipe) {
  return recipe.inputs.every((id) => atlasConsumableCount(p, id) > 0);
}

function atlasCraftRecipe(recipeId) {
  const recipe = ATLAS_RECIPES.find((entry) => entry.id === recipeId);
  const p = atlasState();
  if (!recipe) return { ok: false, reason: 'unknown_recipe' };
  if (!atlasRecipeCraftable(p, recipe)) return { ok: false, reason: 'missing_inputs' };
  for (const id of recipe.inputs) p.consumables[id] = atlasConsumableCount(p, id) - 1;
  p.consumables[recipe.output] = atlasConsumableCount(p, recipe.output) + 1;
  saveProgress();
  return { ok: true, recipe, output: ATLAS_CONSUMABLE_BY_ID[recipe.output] };
}

function buildAtlasShopsTab(wrap) {
  const p = atlasState();
  const shop = ATLAS_SHOPS.find((entry) => entry.id === atlasShopId) || ATLAS_SHOPS[0];
  atlasShopId = shop.id;
  const stock = shopStock(shop.id, p);
  const reputation = Math.max(0, Math.floor(Number(p.shopReputation?.[shop.id]) || 0));
  wrap.innerHTML = `
    <section class="exp-section">
      <div class="exp-section-head">
        <h3>ENAM WARUNG ATLAS</h3>
        <span>✦ ${p.marks} tanda · reputasi menurunkan harga</span>
      </div>
      <div class="atlas-chip-row">
        ${ATLAS_SHOPS.map((entry) => `
          <button class="atlas-chip${entry.id === shop.id ? ' active' : ''}" type="button"
            data-atlas-action="shop-select" data-shop="${entry.id}">
            ${esc(entry.name)} · ${esc(atlasZoneName(entry.zone))}
          </button>`).join('')}
      </div>
      <article class="atlas-card" style="margin-top:10px;">
        <h4>${esc(shop.name)} — ${esc(shop.npc)}</h4>
        <p>${esc(shop.dialogue)}</p>
        <div class="atlas-card-meta">
          <span>Zona: ${esc(atlasZoneName(shop.zone))}</span>
          <span>Reputasi: ${reputation}/50</span>
          <span>Spesialis: ${esc(shop.specialty)}</span>
        </div>
      </article>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>STOK HARI INI</h3>
        <span>${stock.length} barang · harga sudah termasuk reputasi</span>
      </div>
      <div class="atlas-list">
        ${stock.map((entry) => {
          const owned = entry.kind === 'armor'
            ? (p.ownedArmor || []).includes(entry.id)
            : entry.kind === 'charm'
              ? (p.ownedCharms || []).includes(entry.id)
              : false;
          const count = entry.kind === 'consumable' ? atlasConsumableCount(p, entry.id) : 0;
          const soldOut = owned;
          const affordable = p.marks >= entry.price;
          const kindLabel = entry.kind === 'consumable' ? 'KONSUMABEL' : entry.kind === 'armor' ? 'ZIRAH' : 'JIMAT';
          return `
            <div class="atlas-row">
              <div class="atlas-row-main">
                <strong>${esc(entry.name)}</strong>
                <span>${kindLabel} · ${esc(entry.data?.tier ? `Tier ${entry.data.tier}` : '')}${count ? ` · dimiliki x${count}` : ''}</span>
                ${entry.data?.desc ? `<p>${esc(entry.data.desc)}</p>` : ''}
              </div>
              <div class="atlas-row-side">
                <span class="atlas-price">✦ ${entry.price}</span>
                <button class="atlas-btn${affordable && !soldOut ? ' primary' : ''}" type="button"
                  data-atlas-action="buy" data-shop="${shop.id}" data-item="${entry.id}"
                  ${soldOut || !affordable ? 'disabled' : ''}>
                  ${soldOut ? 'DIMILIKI' : affordable ? 'BELI' : 'TANDA KURANG'}
                </button>
              </div>
            </div>`;
        }).join('') || '<p class="atlas-row-main span">Warung ini sedang kosong.</p>'}
      </div>
    </section>
  `;
}

function buildAtlasGearTab(wrap) {
  const p = atlasState();
  const tabs = [
    ['armor', `ZIRAH ${(p.ownedArmor || []).length}/${ATLAS_ARMOR_SETS.length}`],
    ['charms', `JIMAT ${(p.ownedCharms || []).length}/${ATLAS_CHARMS.length}`],
    ['weapons', `SENJATA ${(p.ownedWeapons || []).length}/${ATLAS_WEAPONS.length}`],
  ];
  const equippedArmor = ATLAS_ARMOR_SETS.find((item) => item.id === p.equippedArmor) || null;
  const equippedWeapon = ATLAS_WEAPON_BY_ID[p.equippedWeapon] || null;
  const equippedCharms = (p.equippedCharms || [])
    .map((id) => ATLAS_CHARMS.find((item) => item.id === id))
    .filter(Boolean);
  let body = '';
  if (atlasGearTab === 'charms') {
    body = `
      <div class="atlas-list">
        ${ATLAS_CHARMS.map((charm) => {
          const owned = (p.ownedCharms || []).includes(charm.id);
          const active = (p.equippedCharms || []).includes(charm.id);
          const shop = ATLAS_SHOPS.find((entry) => entry.zone === 'foundry') || null;
          return `
            <div class="atlas-row">
              <div class="atlas-row-main">
                <strong style="color:${charm.color}">${esc(charm.localName)}</strong>
                <span>${esc(charm.name)} · efek ${esc(charm.effect)} +${charm.value}</span>
                <p>${owned ? 'Dimiliki.' : `Beli di ${esc(shop?.name || 'warung Atlas')} (✦ ${charm.price}).`}</p>
              </div>
              <div class="atlas-row-side">
                <span class="atlas-price">${active ? 'TERPASANG' : `${(p.equippedCharms || []).length}/3`}</span>
                <button class="atlas-btn${active ? '' : ' primary'}" type="button"
                  data-atlas-action="equip-charm" data-charm="${charm.id}" ${owned ? '' : 'disabled'}>
                  ${active ? 'LEPAS' : 'PASANG'}
                </button>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  } else if (atlasGearTab === 'weapons') {
    body = `
      <div class="atlas-list">
        ${ATLAS_WEAPONS.map((weapon) => {
          const owned = (p.ownedWeapons || []).includes(weapon.id);
          const active = p.equippedWeapon === weapon.id;
          const mastery = weaponMasteryFor(p, weapon.id);
          const infusion = p.weaponInfusions?.[weapon.id] || 'none';
          const infusionData = ATLAS_INFUSION_BY_ID[infusion] || ATLAS_INFUSION_BY_ID.none;
          return `
            <div class="atlas-row">
              <div class="atlas-row-main">
                <strong style="color:${weapon.color}">${esc(weapon.name)}</strong>
                <span>${esc(weapon.localName)} · ${esc(weapon.category)} · T${weapon.tier} · DMG x${weapon.damage.toFixed(2)} · SPD x${weapon.speed.toFixed(2)}</span>
                <div class="atlas-progress-line">
                  ${expBar(mastery.xp, mastery.next || 1)}
                  <span class="atlas-price">Mastery ${mastery.level}/10</span>
                </div>
                ${owned ? `<div class="atlas-chip-row" style="margin-top:6px;">
                  ${ATLAS_INFUSIONS.map((entry) => `
                    <button class="atlas-chip${entry.id === infusion ? ' active' : ''}" type="button"
                      data-atlas-action="infuse" data-weapon="${weapon.id}" data-infusion="${entry.id}"
                      ${entry.id !== 'none' && (p.marks || 0) < entry.cost * 40 ? 'disabled' : ''}>
                      ${esc(entry.name)}${entry.id === 'none' ? '' : ` (✦ ${entry.cost * 40})`}
                    </button>`).join('')}
                </div>` : ''}
              </div>
              <div class="atlas-row-side">
                <span class="atlas-price">${active ? 'TERPASANG' : infusionData.name}</span>
                <button class="atlas-btn${active ? '' : ' primary'}" type="button"
                  data-atlas-action="equip-weapon" data-weapon="${weapon.id}" ${owned ? '' : 'disabled'}>
                  ${active ? 'DIPAKAI' : owned ? 'PASANG' : 'BELUM DIMILIKI'}
                </button>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  } else {
    body = `
      <div class="atlas-list">
        ${ATLAS_ARMOR_SETS.map((armor) => {
          const owned = (p.ownedArmor || []).includes(armor.id);
          const active = p.equippedArmor === armor.id;
          const shop = atlasShopForZone(armor.zone);
          return `
            <div class="atlas-row">
              <div class="atlas-row-main">
                <strong style="color:${armor.color}">${esc(armor.localName)}</strong>
                <span>${esc(armor.name)} · T${armor.tier} · +${armor.hp} HP · +${Math.round(armor.damage * 100)}% DMG · +${Math.round(armor.speed * 100)}% SPD</span>
                <p>${esc(armor.setBonus)}${owned ? '' : ` · Beli di ${esc(shop?.name || 'warung Atlas')} (✦ ${armor.price}).`}</p>
              </div>
              <div class="atlas-row-side">
                <span class="atlas-price">${active ? 'TERPASANG' : owned ? 'DIMILIKI' : 'TERKUNCI'}</span>
                <button class="atlas-btn${active ? '' : ' primary'}" type="button"
                  data-atlas-action="equip-armor" data-armor="${armor.id}" ${owned ? '' : 'disabled'}>
                  ${active ? 'LEPAS' : 'PASANG'}
                </button>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  }
  wrap.innerHTML = `
    <section class="exp-section">
      <div class="exp-section-head">
        <h3>PERLENGKAPAN ATLAS</h3>
        <span>Bonus hanya berlaku di run Atlas</span>
      </div>
      <div class="atlas-chip-row">
        ${tabs.map(([id, label]) => `
          <button class="atlas-chip${atlasGearTab === id ? ' active' : ''}" type="button"
            data-atlas-action="gear-tab" data-tab="${id}">${label}</button>`).join('')}
      </div>
      <div class="atlas-grid-3" style="margin-top:10px;">
        <article class="atlas-card">
          <h4>ZIRAH AKTIF</h4>
          <p>${equippedArmor ? esc(equippedArmor.localName) : 'Belum ada zirah terpasang.'}</p>
        </article>
        <article class="atlas-card">
          <h4>JIMAT AKTIF</h4>
          <p>${equippedCharms.length ? equippedCharms.map((charm) => esc(charm.localName)).join(' · ') : 'Belum ada jimat terpasang.'}</p>
        </article>
        <article class="atlas-card">
          <h4>SENJATA AKTIF</h4>
          <p>${equippedWeapon ? esc(equippedWeapon.localName) : 'Belum ada senjata terpasang.'}</p>
        </article>
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>${atlasGearTab === 'armor' ? 'DUA BELAS SET ZIRAH' : atlasGearTab === 'charms' ? 'LIMA BELAS JIMAT' : 'EMPAT PULUH SENJATA'}</h3>
        <span>Pasang maksimal 1 zirah, 3 jimat, dan 1 senjata</span>
      </div>
      ${body}
    </section>
  `;
}

function buildAtlasItemsTab(wrap) {
  const p = atlasState();
  const owned = ATLAS_CONSUMABLES.filter((item) => atlasConsumableCount(p, item.id) > 0);
  const recipes = ATLAS_RECIPES.filter((recipe) => recipe.kind === atlasCraftTab);
  wrap.innerHTML = `
    <section class="exp-section">
      <div class="exp-section-head">
        <h3>SLOT CEPAT</h3>
        <span>Tekan 1–4 saat run Atlas · item dipakai dari persediaan</span>
      </div>
      <div class="atlas-grid-2">
        ${ATLAS_QUICK_SLOTS.map((slot) => {
          const assigned = p.quickSlots?.[slot.index] || '';
          const item = ATLAS_CONSUMABLE_BY_ID[assigned];
          return `
            <article class="atlas-card">
              <h4>${esc(slot.label)} — ${item ? esc(item.name) : 'KOSONG'}</h4>
              <p>${item ? esc(item.desc || 'Konsumabel Atlas.') : 'Pilih item yang dimiliki untuk slot ini.'}</p>
              <div class="atlas-row-side" style="justify-content:flex-start;margin-top:8px;">
                <select class="atlas-lore-search" data-atlas-quick="${slot.index}" aria-label="${esc(slot.label)}">
                  <option value="">— kosong —</option>
                  ${owned.map((entry) => `<option value="${entry.id}"${entry.id === assigned ? ' selected' : ''}>${esc(entry.name)} (${atlasConsumableCount(p, entry.id)})</option>`).join('')}
                </select>
              </div>
            </article>`;
        }).join('')}
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>PERSEDIAAN</h3>
        <span>${owned.length} jenis · ${owned.reduce((sum, item) => sum + atlasConsumableCount(p, item.id), 0)} item</span>
      </div>
      <div class="atlas-list">
        ${owned.length ? owned.map((item) => `
          <div class="atlas-row">
            <div class="atlas-row-main">
              <strong>${esc(item.name)}</strong>
              <span>${esc(item.type)} · Tier ${item.tier} · x${atlasConsumableCount(p, item.id)}</span>
              <p>${esc(item.desc || '')}</p>
            </div>
            <div class="atlas-row-side">
              ${ATLAS_QUICK_SLOTS.map((slot) => `
                <button class="atlas-btn" type="button" data-atlas-action="assign-quick"
                  data-item="${item.id}" data-slot="${slot.index}">SLOT ${slot.index + 1}</button>`).join('')}
            </div>
          </div>`).join('') : '<p class="atlas-row-main span">Belum ada konsumabel. Beli di warung Atlas.</p>'}
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>MEMASAK &amp; MERAKIT</h3>
        <span>${recipes.length} resep · bahan dikonsumsi saat meracik</span>
      </div>
      <div class="atlas-chip-row">
        <button class="atlas-chip${atlasCraftTab === 'cook' ? ' active' : ''}" type="button" data-atlas-action="craft-tab" data-tab="cook">MEMASAK</button>
        <button class="atlas-chip${atlasCraftTab === 'craft' ? ' active' : ''}" type="button" data-atlas-action="craft-tab" data-tab="craft">MERAKIT</button>
      </div>
      <div class="atlas-list" style="margin-top:10px;">
        ${recipes.map((recipe) => {
          const output = ATLAS_CONSUMABLE_BY_ID[recipe.output];
          const craftable = atlasRecipeCraftable(p, recipe);
          return `
            <div class="atlas-row">
              <div class="atlas-row-main">
                <strong>${esc(recipe.name)} → ${esc(output?.name || recipe.output)}</strong>
                <span>${recipe.inputs.map((id) => `${esc(ATLAS_CONSUMABLE_BY_ID[id]?.name || id)} x1`).join(' + ')}</span>
                <p>Waktu ${recipe.time} detik · Tier ${recipe.tier}</p>
              </div>
              <div class="atlas-row-side">
                <button class="atlas-btn${craftable ? ' primary' : ''}" type="button"
                  data-atlas-action="craft" data-recipe="${recipe.id}" ${craftable ? '' : 'disabled'}>
                  ${craftable ? 'RACIK' : 'BAHAN KURANG'}
                </button>
              </div>
            </div>`;
        }).join('')}
      </div>
    </section>
  `;
}

function buildAtlasSystemsTab(wrap) {
  const p = atlasState();
  const stats = atlasStats(p);
  const quality = ATLAS_QUALITY_PRESETS.find((entry) => entry.id === p.flags?.qualityPreset)
    || ATLAS_QUALITY_PRESETS.find((entry) => entry.id === 'high')
    || ATLAS_QUALITY_PRESETS[0];
  const diag = atlasDiagnostic;
  const bot = atlasBotResult;
  wrap.innerHTML = `
    <section class="exp-section">
      <div class="exp-section-head">
        <h3>STATISTIK ATLAS</h3>
        <span>${stats.cleared}/${stats.totalRooms} ruang · ${stats.bosses}/${stats.totalBosses} bos</span>
      </div>
      <div class="atlas-grid-3">
        <article class="atlas-card"><h4>RUANG</h4><p>${stats.cleared} / ${stats.totalRooms} (${Math.round(stats.percent * 100)}%)</p></article>
        <article class="atlas-card"><h4>TANDA</h4><p>✦ ${stats.marks} · total diperoleh ${p.stats?.marksEarned || 0}</p></article>
        <article class="atlas-card"><h4>KEMATIAN</h4><p>${p.stats?.deaths || 0} kali gugur di Atlas</p></article>
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>GERBANG KEMAMPUAN</h3>
        <span>${p.abilities.length} / ${ATLAS_ABILITY_GATES.length} terbuka</span>
      </div>
      <div class="atlas-list">
        ${ATLAS_ABILITY_GATES.map((gate) => {
          const owned = (p.abilities || []).includes(gate.id);
          const source = ATLAS_ZONE_BY_ID[gate.source];
          return `
            <div class="atlas-row">
              <div class="atlas-row-main">
                <strong>${owned ? '✦ ' : '◇ '}${esc(gate.localName)} — ${esc(gate.name)}</strong>
                <span>Sumber: ${esc(source?.localName || gate.source)}</span>
                <p>${esc(gate.desc)}</p>
              </div>
              <div class="atlas-row-side">
                <span class="atlas-chip ${owned ? 'active' : ''}">${owned ? 'TERBUKA' : 'TERKUNCI'}</span>
              </div>
            </div>`;
        }).join('')}
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>PRESET KUALITAS LATAR</h3>
        <span>Aktif: ${esc(quality.name)} · target ${quality.targetFps} FPS</span>
      </div>
      <div class="atlas-chip-row">
        ${ATLAS_QUALITY_PRESETS.map((preset) => `
          <button class="atlas-chip${preset.id === quality.id ? ' active' : ''}" type="button"
            data-atlas-action="quality" data-quality="${preset.id}"
            title="${preset.layers} layer · ${preset.particles} partikel · ${preset.lighting ? 'lighting' : 'tanpa lighting'}">
            ${esc(preset.name)}
          </button>`).join('')}
      </div>
      <div class="atlas-card" style="margin-top:10px;">
        <h4>${esc(quality.name)}</h4>
        <p>${quality.layers} layer parallax · ${quality.particles} partikel · ${quality.shadows ? 'bayangan aktif' : 'tanpa bayangan'} · ${quality.lighting ? 'pencahayaan aktif' : 'tanpa pencahayaan'} · target ${quality.targetFps} FPS</p>
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>VALIDATOR &amp; BOT BOS</h3>
        <span>Diagnostik deterministik untuk 240 ruang dan 16 bos</span>
      </div>
      <div class="atlas-chip-row">
        <button class="atlas-btn primary" type="button" data-atlas-action="validate">VALIDASI 240 RUANG</button>
        <button class="atlas-btn" type="button" data-atlas-action="boss-bot">JALANKAN BOT 100x</button>
      </div>
      ${diag ? `<div class="atlas-diag" style="margin-top:10px;">${esc(diag)}</div>` : ''}
      ${bot ? `<div class="atlas-diag" style="margin-top:10px;">${esc(bot)}</div>` : ''}
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>RENCANA SERAH TERIMA 15 FASE</h3>
        <span>${ATLAS_PHASES.length} fase</span>
      </div>
      <div class="atlas-grid-2">
        ${ATLAS_PHASES.map((phase) => `
          <article class="atlas-card">
            <h4>${esc(phase.title)}</h4>
            <p>${esc(phase.doneWhen)}</p>
          </article>`).join('')}
      </div>
    </section>

    <section class="exp-section">
      <div class="exp-section-head">
        <h3>CHECKLIST RILIS</h3>
        <span>${ATLAS_CHECKLIST.filter((item) => item.ready).length} / ${ATLAS_CHECKLIST.length} siap</span>
      </div>
      <div class="atlas-chip-row">
        ${ATLAS_CHECKLIST.map((item) => `
          <span class="atlas-chip${item.ready ? ' active' : ''}">${item.ready ? '✓' : '◇'} ${esc(item.label)}</span>`).join('')}
      </div>
    </section>
  `;
}

function runAtlasValidator() {
  const result = validateAtlasRooms();
  const errors = result.errors.slice(0, 8).map((entry) => `- ${entry}`);
  const warnings = result.warnings.slice(0, 5).map((entry) => `- ${entry}`);
  atlasDiagnostic = [
    'VALIDATOR RUANG ATLAS',
    `status: ${result.ok ? 'LULUS' : 'GAGAL'}`,
    `ruang: ${result.count}`,
    `error: ${result.errors.length}`,
    `warning: ${result.warnings.length}`,
    ...errors,
    ...warnings,
  ].join('\n');
}

function runAtlasBossDiagnostics() {
  const lines = ['BOT BOS ATLAS · 100 ITERASI PER BOS'];
  let wins = 0;
  let losses = 0;
  let errors = 0;
  ATLAS_ZONES.forEach((zone, zoneIndex) => {
    const boss = ATLAS_BOSS_INFO[zone.boss];
    const mini = ATLAS_BOSS_INFO[zone.miniBoss];
    for (const [label, entry] of [['BOS', boss], ['MINI', mini]]) {
      if (!entry) continue;
      const result = runBossBot(
        {
          maxHp: entry.maxHp,
          contact: entry.contact,
          maxPhases: entry.maxPhases,
          playerHp: 100,
          playerDps: 34,
        },
        100,
        zoneIndex * 2 + (label === 'MINI' ? 2 : 1),
      );
      wins += result.wins;
      losses += result.losses;
      errors += result.errors.length;
      lines.push(`${label} ${entry.name}: ${result.wins}W/${result.losses}L · ${result.averageTime.toFixed(1)}s · ${result.passed ? 'LULUS' : 'PERIKSA'}`);
    }
  });
  lines.push(`TOTAL: ${wins}W/${losses}L · error ${errors}`);
  atlasBotResult = lines.join('\n');
}

function handleAtlasAction(action, el) {
  const p = atlasState();
  const data = el.dataset || {};
  if (action === 'start-room') {
    const index = Number(data.room);
    if (Number.isInteger(index)) startAtlasRoom(index);
    return true;
  }
  if (action === 'enter-zone') {
    const zone = ATLAS_ZONE_BY_ID[data.zone];
    if (!zone) return true;
    const rooms = ATLAS_ROOMS.filter((room) => room.atlasZone === zone.id);
    const next = rooms.find((room) => !p.clearedRooms[room.id] && atlasRoomAvailable(room.id))
      || rooms.find((room) => atlasRoomAvailable(room.id))
      || rooms[0];
    if (next) startAtlasRoom(next.id);
    return true;
  }
  if (action === 'lore-category') {
    atlasLoreCategory = data.category || 'all';
    buildAtlasScreen();
    return true;
  }
  if (action === 'reveal') {
    const result = revealLore(p, data.entry, 1);
    if (!result.ok) {
      showToast(result.reason === 'insufficient_fragments'
        ? 'Fragmen lore tidak cukup.'
        : 'Entri lore tidak ditemukan.', 1800);
      return true;
    }
    saveProgress();
    showToast(`Lore terungkap: ${LORE_ENTRY_BY_ID[data.entry]?.title || data.entry} (tier ${result.tier}).`, 2200);
    buildAtlasScreen();
    return true;
  }
  if (action === 'shop-select') {
    if (ATLAS_SHOPS.some((shop) => shop.id === data.shop)) atlasShopId = data.shop;
    buildAtlasScreen();
    return true;
  }
  if (action === 'buy') {
    const result = buyAtlasItem(p, data.shop, data.item);
    if (!result.ok) {
      showToast(result.reason === 'insufficient_marks'
        ? `Tanda kurang: butuh ✦ ${result.price}.`
        : 'Barang tidak tersedia di warung ini.', 1800);
      return true;
    }
    saveProgress();
    showToast(`Dibeli: ${result.entry.name}. Sisa ✦ ${result.marks}.`, 2000);
    buildAtlasScreen();
    return true;
  }
  if (action === 'gear-tab') {
    if (['armor', 'charms', 'weapons'].includes(data.tab)) atlasGearTab = data.tab;
    buildAtlasScreen();
    return true;
  }
  if (action === 'equip-armor') {
    const armor = ATLAS_ARMOR_SETS.find((entry) => entry.id === data.armor);
    if (!armor || !(p.ownedArmor || []).includes(armor.id)) return true;
    p.equippedArmor = p.equippedArmor === armor.id ? null : armor.id;
    saveProgress();
    showToast(p.equippedArmor ? `${armor.localName} terpasang.` : `${armor.localName} dilepas.`, 1600);
    buildAtlasScreen();
    return true;
  }
  if (action === 'equip-charm') {
    const charm = ATLAS_CHARMS.find((entry) => entry.id === data.charm);
    if (!charm || !(p.ownedCharms || []).includes(charm.id)) return true;
    const list = Array.isArray(p.equippedCharms) ? [...p.equippedCharms] : [];
    const at = list.indexOf(charm.id);
    if (at >= 0) list.splice(at, 1);
    else if (list.length >= 3) {
      showToast('Maksimal 3 jimat terpasang. Lepas salah satu dulu.', 1800);
      return true;
    } else list.push(charm.id);
    p.equippedCharms = list;
    saveProgress();
    showToast(`${charm.localName} ${at >= 0 ? 'dilepas' : 'terpasang'}.`, 1600);
    buildAtlasScreen();
    return true;
  }
  if (action === 'equip-weapon') {
    const weapon = ATLAS_WEAPON_BY_ID[data.weapon];
    if (!weapon || !(p.ownedWeapons || []).includes(weapon.id)) return true;
    p.equippedWeapon = weapon.id;
    saveProgress();
    showToast(`Senjata aktif: ${weapon.localName}.`, 1600);
    buildAtlasScreen();
    return true;
  }
  if (action === 'infuse') {
    const weapon = ATLAS_WEAPON_BY_ID[data.weapon];
    const infusion = ATLAS_INFUSION_BY_ID[data.infusion];
    if (!weapon || !infusion || !(p.ownedWeapons || []).includes(weapon.id)) return true;
    const cost = infusion.cost * 40;
    if ((p.marks || 0) < cost) {
      showToast(`Tanda kurang: infusi butuh ✦ ${cost}.`, 1800);
      return true;
    }
    p.marks -= cost;
    if (!p.weaponInfusions) p.weaponInfusions = {};
    p.weaponInfusions[weapon.id] = infusion.id;
    saveProgress();
    showToast(`${weapon.name} mendapat ${infusion.name}.`, 1800);
    buildAtlasScreen();
    return true;
  }
  if (action === 'craft-tab') {
    if (data.tab === 'cook' || data.tab === 'craft') atlasCraftTab = data.tab;
    buildAtlasScreen();
    return true;
  }
  if (action === 'craft') {
    const result = atlasCraftRecipe(data.recipe);
    if (!result.ok) {
      showToast('Bahan tidak cukup untuk meracik resep ini.', 1800);
      return true;
    }
    showToast(`Dirakit: ${result.output?.name || result.recipe.name}.`, 2000);
    buildAtlasScreen();
    return true;
  }
  if (action === 'assign-quick') {
    const slot = Number(data.slot);
    if (!Number.isInteger(slot) || slot < 0 || slot >= 4) return true;
    const itemId = data.item && ATLAS_CONSUMABLE_BY_ID[data.item] ? data.item : null;
    if (!p.quickSlots) p.quickSlots = [null, null, null, null];
    p.quickSlots[slot] = itemId;
    saveProgress();
    showToast(itemId
      ? `${ATLAS_CONSUMABLE_BY_ID[itemId].name} dipasang di slot ${slot + 1}.`
      : `Slot ${slot + 1} dikosongkan.`, 1600);
    buildAtlasScreen();
    return true;
  }
  if (action === 'quality') {
    const preset = ATLAS_QUALITY_PRESETS.find((entry) => entry.id === data.quality);
    if (!preset) return true;
    if (!p.flags) p.flags = {};
    p.flags.qualityPreset = preset.id;
    renderer.options.quality = preset;
    game.qualityPreset = preset;
    saveProgress();
    showToast(`Preset kualitas: ${preset.name}.`, 1600);
    buildAtlasScreen();
    return true;
  }
  if (action === 'validate') {
    runAtlasValidator();
    buildAtlasScreen();
    return true;
  }
  if (action === 'boss-bot') {
    runAtlasBossDiagnostics();
    buildAtlasScreen();
    return true;
  }
  return false;
}

const OVERDRIVE_CHAPTERS = [
  { number: 21, levelStart: 201, levelEnd: 210, name: 'The Drowned Capital', boss: 'The Sunken Emperor', color: '#4fc3f7', hazard: 'Rising floodwaters & whirlpools' },
  { number: 22, levelStart: 211, levelEnd: 220, name: 'Crystalheart Depths', boss: 'The Prism Devourer', color: '#ce93d8', hazard: 'Prismatic light beams & crystal spikes' },
  { number: 23, levelStart: 221, levelEnd: 230, name: 'The Infernal Foundry', boss: 'Forge Titan', color: '#ff7043', hazard: 'Molten iron pours & blast furnaces' },
  { number: 24, levelStart: 231, levelEnd: 240, name: 'The Verdant Grave', boss: 'Mother of Thorns', color: '#81c784', hazard: 'Toxic spores & entangling roots' },
  { number: 25, levelStart: 241, levelEnd: 250, name: 'The Astral Citadel', boss: 'The Starbound Regent', color: '#fff176', hazard: 'Gravity inversion & star shards' },
  { number: 26, levelStart: 251, levelEnd: 260, name: 'The Frozen Dominion', boss: 'The Pale Frost Monarch', color: '#80deea', hazard: 'Blizzard walls & permafrost floors' },
  { number: 27, levelStart: 261, levelEnd: 270, name: 'The Clockwork Expanse', boss: 'The Grand Horologist', color: '#ffcc02', hazard: 'Time-shifting gears & chrono mines' },
  { number: 28, levelStart: 271, levelEnd: 280, name: 'The Shattered Void', boss: 'The Unmade', color: '#b388ff', hazard: 'Reality fractures & void rifts' },
  { number: 29, levelStart: 281, levelEnd: 290, name: 'The Sunken Sands', boss: 'The Sandstorm Sovereign', color: '#ffca28', hazard: 'Quicksand pits & sandstorm blindness' },
  { number: 30, levelStart: 291, levelEnd: 300, name: 'The Final Pantheon', boss: 'The First God', color: '#ef9a9a', hazard: 'Divine retribution beams & world-breaking quakes' },
];

const OVERDRIVE_SPELL_SCHOOLS = [
  { name: 'Storm', icon: '⚡', color: '#90caf9', spells: ['Chain Lightning', 'Thunderclap', 'Storm Surge', 'Eye of the Storm'] },
  { name: 'Void', icon: '🌑', color: '#b39ddb', spells: ['Singularity', 'Void Rift', 'Dark Pulse', 'Oblivion'] },
  { name: 'Nature', icon: '🌿', color: '#a5d6a7', spells: ['Thornwall', 'Regrowth', 'Spore Burst', 'Nature\'s Wrath'] },
  { name: 'Infernal', icon: '🔥', color: '#ff8a65', spells: ['Fireball', 'Inferno', 'Lava Geyser', 'Phoenix Strike'] },
  { name: 'Frost', icon: '❄', color: '#80deea', spells: ['Frost Nova', 'Ice Lance', 'Blizzard', 'Absolute Zero'] },
  { name: 'Celestial', icon: '⭐', color: '#fff59d', spells: ['Starfall', 'Divine Light', 'Comet Strike', 'Supernova'] },
  { name: 'Blood', icon: '🩸', color: '#ef9a9a', spells: ['Bloodbolt', 'Crimson Drain', 'Hemorrhage', 'Blood Pact'] },
  { name: 'Chronomancy', icon: '⏳', color: '#ffcc80', spells: ['Time Stop', 'Rewind', 'Haste', 'Temporal Bomb'] },
];

const OVERDRIVE_BOSSES = [
  { name: 'Ashen Dragon', phases: 5, armor: true, shield: true, stagger: true },
  { name: 'The Iron Colossus', phases: 4, armor: true, shield: false, stagger: true },
  { name: 'The Hollow Broodmother', phases: 4, armor: false, shield: true, stagger: true },
  { name: 'The Watching Void', phases: 5, armor: false, shield: true, stagger: false },
  { name: 'The Black Paladin', phases: 3, armor: true, shield: true, stagger: true },
  { name: 'Glacier Wyrm', phases: 4, armor: true, shield: false, stagger: true },
  { name: 'Worldroot Ancient', phases: 4, armor: false, shield: false, stagger: true },
  { name: 'The Fallen Seraph', phases: 5, armor: true, shield: true, stagger: true },
];

const OVERDRIVE_MODES = [
  { name: 'Endless Crucible', desc: 'Bertahan tanpa batas melawan gelombang musuh tak berujung.' },
  { name: 'Nightmare Gauntlet', desc: 'Semua musuh di-buff penuh; tidak ada save di tengah.' },
  { name: 'Speedrun Trial', desc: 'Capai finish sebelum timer habis. Leaderboard global.' },
  { name: 'Soul Drain', desc: 'Tiap serangan mengurangi max HP. Manage ekonomi nyawamu.' },
  { name: 'Elemental Madness', desc: 'Hanya sihir yang bisa melukai musuh, bukan senjata fisik.' },
  { name: 'Iron Vow', desc: 'Mati sekali = permainan berakhir total. Roguelite klasik.' },
  { name: 'Boss Blitz', desc: 'Hanya boss fight, satu per satu, tanpa waktu istirahat.' },
  { name: 'Cursed Run', desc: 'Dua modifier kutukan acak aktif tiap chapter.' },
  { name: 'Colossus Trial', desc: 'Lawan satu Colossus berlapis 10 fase dengan boss gabungan.' },
  { name: 'Treasure Vault', desc: 'Eksplorasi vault tak berujung penuh jebakan dan harta.' },
  { name: 'Covenant of Ash', desc: 'Semua drop digantikan abu; beli blessing dari pedagang.' },
  { name: 'The Final Reckoning', desc: 'Semua 8 bos sekaligus dalam arena terakhir. Tidak ada retry.' },
];

const OVERDRIVE_CHECKLIST = [
  { item: 'Kampanye 201–300 (100 level, 10 Bab)', done: true },
  { item: '8 Sekolah Sihir (32 Mantra)', done: true },
  { item: '8 Bos Multi-Fase (Armor + Shield + Stagger)', done: true },
  { item: 'Multi-Layer Boss HUD (HP/Armor/Shield/Stagger/Fase)', done: true },
  { item: 'Player HUD Mana + Stamina + Spell Slots', done: true },
  { item: 'Diagnostic Profiler HUD (F3 toggle)', done: true },
  { item: 'Overdrive Hub Screen (6 Tab)', done: true },
  { item: 'Main Menu Overdrive Button', done: true },
  { item: 'Settings: Graphics Preset (Low/Med/High/Ultra)', done: true },
  { item: 'Settings: FPS Limit (60/120/Uncapped)', done: true },
  { item: 'Settings: Particle Density (Off/Low/Full)', done: true },
  { item: 'Settings: Screen Shake granularity', done: true },
  { item: '12 Mode Overdrive (Endless, Iron Vow, Boss Blitz…)', done: true },
  { item: '50 Musuh Baru + 10 Elite Modifier (src/overdrive.js)', done: true },
  { item: 'Perf Profiler + Culling + Object Pool (src/perf.js)', done: true },
  { item: 'Boss Combat Engine (src/boss_overdrive.js)', done: true },
  { item: 'Test Suite (tests/overdrive.test.js) hijau', done: true },
  { item: 'Save Migration + Backup Recovery', done: true },
];

let activeOverdriveIndex = -1;
let overdriveChapterView = 21;
let overdriveBadgeCache = '';

function overdriveState() {
  if (!progress.overdrive || !Array.isArray(progress.overdrive.levels)) {
    progress.overdrive = sanitizeOverdriveLadderProgress(progress.overdrive);
  }
  return progress.overdrive;
}

function overdriveChapterMetaFor(number) {
  return OVERDRIVE_CHAPTER_META.find((chapter) => chapter.number === Number(number)) || OVERDRIVE_CHAPTER_META[0];
}

function startOverdriveLevel(index) {
  const room = overdriveRoomForIndex(index);
  if (!room) return;
  if (!overdriveCampaignUnlocked(progress)) {
    showToast('Overdrive (Lv 201–300) terbuka setelah Aethron gugur di Infinite Frontiers.', 2600);
    return;
  }
  const state = overdriveState();
  if (!overdriveLevelUnlocked(state, index)) {
    showToast('Level Overdrive itu masih tertutup. Selesaikan level sebelumnya dulu.', 2200);
    return;
  }
  audio.init();
  attempts = 1;
  coopGuestMode = false;
  coopGuestRoom = -1;
  activeRunKind = 'overdrive';
  activeOverdriveIndex = Number(index);
  overdriveChapterView = room.overdriveChapter;
  activeFrontierIndex = -1;
  activeLanternStage = -1;
  activeCisternStage = -1;
  activeFairyStage = -1;
  activeFairyBoss = null;
  activeCourtRoom = null;
  activeCourtTrial = null;
  activePackIndex = -1;
  activeExpansionIndex = null;
  activeModeId = null;
  activeTrialId = null;
  modeRunRewarded = false;
  packRunActive = false;
  labRun = null;
  labDirector = null;
  speedrunRun = null;
  game.labyrinth = false;
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  game.enterRoom(room.id);
  game.player.relic = true;
  const legendaryBonus = state.equippedLegendary ? 1.25 : 1;
  const variantBoost = room.variant === 'cursed_expedition' ? 1.35 : 1;
  game.player.damageMult *= overdrivePlayerScale(index) * legendaryBonus * variantBoost;
  game.player.maxHp = Math.round(game.player.maxHp * overdriveVitalityScale(index) * (room.variant === 'cursed_expedition' ? 0.85 : 1));
  game.player.hp = game.player.maxHp;
  game.player.maxFlasks = room.variant === 'gauntlet_tower' ? Math.max(2, game.player.maxFlasks) : (game.player.maxFlasks + overdriveFlaskBonus(index));
  game.player.flasks = game.player.maxFlasks;
  game.player.overdriveMaxMana = 120;
  game.player.overdriveMana = 120;
  const treasureBonus = room.variant === 'treasure_vault' ? 180 : 0;
  game.ash = Math.max(game.ash, overdriveAshStipend(index) + treasureBonus);
  state.discovered[index] = true;
  if (state.discovered[index + 1] !== undefined) state.discovered[index + 1] = true;
  recordOverdriveRun(state, 0);
  cutsceneSeen = new Set();
  postCreditTimer = -1;
  saveProgress();
  game.events.length = 0;
  started = true;
  paused = false;
  hunterShopOpen = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  beginStage(game.roomIndex, room.name);
  showBanner(`OVD LV ${room.overdriveLevel} — ${room.name}`, room.subtitle);
  syncScreens();
  updateHud();
  const spellPick = overdriveSpellFor(state.activeSchool, state.activeSpellIndex);
  showToast(`${OVERDRIVE_LOCAL_NAME} · BAB ${room.overdriveChapter} · [Q] ${spellPick.spell.name}`, 2500);
}

function handleOverdriveLevelClear(index) {
  const safeIndex = Number(index);
  if (!Number.isInteger(safeIndex) || safeIndex < 0) return null;
  const state = overdriveState();
  const result = recordOverdriveLevel(state, safeIndex);
  if (!result.ok) return result;
  if (result.firstClear) {
    recordOverdriveRun(state, game.time);
    saveProgress();
    const room = overdriveRoomForIndex(safeIndex);
    if (result.unlockedLegendary) {
      showToast(`SENJATA LEGENDARIS TERBUKA — ${result.unlockedLegendary.name}!`, 3600);
    } else if (result.bossFirstClear) {
      const ch = overdriveChapterMetaFor(result.chapter);
      showToast(`${ch.bossName} GUGUR — ${ch.name} selesai.`, 3200);
    } else if (result.complete) {
      showToast('THE FIRST GOD PADAM — Overdrive Lv 300 tuntas!', 3800);
    } else {
      showToast(`OVD LV ${room?.overdriveLevel ?? '?'} TUNTAS · BAB ${result.chapter}`, 2100);
    }
    buildOverdriveScreen();
    updateMenuProgress();
  }
  return result;
}

function overdriveLevelCard(room, state) {
  const index = room.overdriveIndex;
  const locked = !overdriveCampaignUnlocked(progress) || !overdriveLevelUnlocked(state, index);
  const cleared = overdriveLevelCleared(state, index);
  const boss = room.boss ? overdriveChapterMetaFor(room.overdriveChapter) : null;
  const meta = boss
    ? `BOSS · ${boss.bossPhases} FASE`
    : `${room.enemies.length} MUSUH · ${room.variantName || 'ELITE E7'}`;
  const badge = cleared ? 'TUNTAS' : locked ? 'TERKUNCI' : 'TERBUKA';
  return `<article class="frontier-level${locked ? ' locked' : ''}${cleared ? ' cleared' : ''}${boss ? ' boss' : ''}" style="--accent:${room.accent}">
    <header class="fl-head">
      <span class="fl-num">LV ${room.overdriveLevel}</span>
      <span class="fl-state">${badge}</span>
    </header>
    <h4 class="fl-name">${esc(room.name)}</h4>
    <p class="fl-meta">${esc(meta)}</p>
    <div class="fl-actions">
      ${locked ? '<span class="fl-lock">SELESAIKAN LEVEL SEBELUMNYA</span>' : `<button class="btn btn-primary btn-small" type="button" data-overdrive-play="${index}">MAINKAN</button>`}
    </div>
  </article>`;
}

function buildOverdriveScreen() {
  const state = overdriveState();
  const osummary = overdriveCampaignSummary(state);
  const activeSpell = overdriveSpellFor(state.activeSchool, state.activeSpellIndex);
  const summaryEl = $('overdrive-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="stat-card">
        <span class="stat-label">LEVEL KAMPANYE</span>
        <strong class="stat-value">${osummary.levelsCleared} / ${OVERDRIVE_LEVEL_COUNT}</strong>
        <em class="stat-sub">${osummary.bossesCleared}/${OVERDRIVE_CHAPTER_META.length} BOS · ${osummary.percent}%</em>
      </div>
      <div class="stat-card">
        <span class="stat-label">MANTRA [Q]</span>
        <strong class="stat-value" style="color:${activeSpell.school.color};">${esc(activeSpell.spell.name)}</strong>
        <em class="stat-sub">${esc(activeSpell.school.name)} · Mana ${activeSpell.spell.cost}</em>
      </div>
      <div class="stat-card">
        <span class="stat-label">SENJATA LEGENDARIS</span>
        <strong class="stat-value">${osummary.legendariesCount} / ${OVERDRIVE_LEGENDARY_WEAPONS.length}</strong>
        <em class="stat-sub">${state.equippedLegendary ? esc(OVERDRIVE_LEGENDARY_WEAPONS.find((w) => w.id === state.equippedLegendary)?.name || 'Aktif') : 'Belum dipasang'}</em>
      </div>
      <div class="stat-card">
        <span class="stat-label">STATUS OVERDRIVE</span>
        <strong class="stat-value" style="color:${overdriveCampaignUnlocked(progress) ? '#52b788' : '#ffd166'};">${overdriveCampaignUnlocked(progress) ? 'TERBUKA' : 'TERKUNCI'}</strong>
        <em class="stat-sub">Lv 201–300 · Ruang 774–873</em>
      </div>
    `;
  }

  const tabs = document.querySelectorAll('#overdrive-tabs .exp-tab');
  tabs.forEach((t) => { t.classList.toggle('active', t.dataset.tab === overdriveTab); });

  const bodyEl = $('overdrive-body');
  if (!bodyEl) return;

  if (overdriveTab === 'campaign301') {
    const meta = overdriveChapterMetaFor(overdriveChapterView);
    const chapterState = overdriveChapterProgress(state, meta.number) || { cleared: 0, total: OVERDRIVE_ROOMS_PER_CHAPTER, bossCleared: false };
    const chapterRooms = OVERDRIVE_ROOMS.filter((room) => room.overdriveChapter === meta.number);
    const rail = OVERDRIVE_CHAPTER_META.map((chapter) => {
      const cp = overdriveChapterProgress(state, chapter.number) || { cleared: 0, total: 10, bossCleared: false };
      const active = chapter.number === meta.number;
      return `<button class="frontier-chip${active ? ' active' : ''}${cp.bossCleared ? ' clear' : ''}" type="button" data-overdrive-chapter="${chapter.number}" style="--accent:${chapter.color}">
        <strong>BAB ${chapter.number}</strong>
        <span>${cp.cleared}/${cp.total}</span>
      </button>`;
    }).join('');
    bodyEl.innerHTML = `
      ${!overdriveCampaignUnlocked(progress) ? '<p class="frontier-lock-note">Overdrive (Lv 201–300) terbuka setelah Aethron gugur di Infinite Frontiers (Lv 200).</p>' : ''}
      <div class="frontier-ladder">
        <div class="frontier-rail" role="tablist" aria-label="Bab Overdrive">${rail}</div>
        <div class="frontier-chapter-head" style="--accent:${meta.color}">
          <div>
            <p class="eyebrow">BAB ${meta.number} · ${esc(meta.biome.toUpperCase())}</p>
            <h3>${esc(meta.name)}</h3>
            <p class="micro">${esc(meta.lore)} · Bahaya: ${esc((meta.hazards || []).join(', '))}</p>
          </div>
          <div class="frontier-chapter-side">
            <span class="frontier-progress">${chapterState.cleared}/${chapterState.total} TAHAP</span>
            <span class="micro">${esc(meta.bossName)} · ${meta.bossPhases} FASE${chapterState.bossCleared ? ' · PADAM' : ''}</span>
          </div>
        </div>
        <div class="frontier-levels">${chapterRooms.map((room) => overdriveLevelCard(room, state)).join('')}</div>
      </div>`;
    bodyEl.querySelectorAll('[data-overdrive-chapter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        overdriveChapterView = Number(btn.dataset.overdriveChapter) || 21;
        buildOverdriveScreen();
      });
    });
    bodyEl.querySelectorAll('[data-overdrive-play]').forEach((btn) => {
      btn.addEventListener('click', () => startOverdriveLevel(Number(btn.dataset.overdrivePlay)));
    });
  } else if (overdriveTab === 'spellschools') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-2">
        ${OVERDRIVE_DATA_SCHOOLS.map((school) => {
          const isActiveSchool = state.activeSchool === school.id;
          return `<div class="frontier-card" style="border-top: 3px solid ${school.color};">
            <div class="frontier-card-head">
              <strong style="color:${school.color};font-size:15px;">Sekolah ${esc(school.name)}</strong>
              <span class="frontier-badge" style="background:${school.color}22;color:${school.color};border:1px solid ${school.color}44;">${isActiveSchool ? 'AKTIF [Q]' : 'PILIH'}</span>
            </div>
            <p style="font-size:11px;color:#b7a486;margin:4px 0 8px;">${esc(school.description)}</p>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${school.spells.map((sp, sIdx) => {
                const selected = isActiveSchool && state.activeSpellIndex === sIdx;
                return `<button type="button" class="btn btn-small ${selected ? 'btn-primary' : 'btn-ghost'}" data-overdrive-school="${school.id}" data-overdrive-spell="${sIdx}">${esc(sp.name)} (${sp.cost}M · ${sp.damage}DMG)</button>`;
              }).join('')}
            </div>
          </div>`;
        }).join('')}
      </div>`;
    bodyEl.querySelectorAll('[data-overdrive-school]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeSchool = btn.dataset.overdriveSchool;
        state.activeSpellIndex = Number(btn.dataset.overdriveSpell) || 0;
        saveProgress();
        buildOverdriveScreen();
        showToast(`Mantra [Q]: ${overdriveSpellFor(state.activeSchool, state.activeSpellIndex).spell.name}`, 1600);
      });
    });
  } else if (overdriveTab === 'legendaries') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-2">
        ${OVERDRIVE_LEGENDARY_WEAPONS.map((w) => {
          const owned = state.legendaryWeaponsFound.includes(w.id);
          const equipped = state.equippedLegendary === w.id;
          return `<div class="frontier-card" style="border-left:4px solid ${equipped ? '#ffd166' : owned ? '#52b788' : '#4a4a55'};">
            <div class="frontier-card-head">
              <strong style="color:${owned ? '#ffd166' : '#8e8e9e'};font-size:14px;">${esc(w.name)}</strong>
              <span class="frontier-badge frontier-badge-gold">${esc(w.category)} · ATK ${w.baseAtk}</span>
            </div>
            <p style="font-size:11px;color:#ced4da;margin:4px 0;">${esc(w.perk)}</p>
            <p style="font-size:10px;color:#8e816b;margin:0 0 8px;">${esc(w.lore)}</p>
            ${owned
              ? `<button type="button" class="btn btn-small ${equipped ? 'btn-primary' : 'btn-ghost'}" data-overdrive-legendary="${w.id}">${equipped ? 'TERPASANG (+25% DMG)' : 'PASANG'}</button>`
              : '<span class="micro">Kalahkan bos bab Overdrive untuk membuka senjata ini.</span>'}
          </div>`;
        }).join('')}
      </div>`;
    bodyEl.querySelectorAll('[data-overdrive-legendary]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.overdriveLegendary;
        state.equippedLegendary = state.equippedLegendary === id ? null : id;
        saveProgress();
        buildOverdriveScreen();
      });
    });
  } else if (overdriveTab === 'bossfase') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-2">
        ${OVERDRIVE_CHAPTER_META.map((ch) => {
          const killed = state.bosses[ch.number - 21];
          return `<div class="frontier-card" style="border-left: 4px solid ${ch.color};">
            <div class="frontier-card-head">
              <strong style="color:${ch.color};font-size:14px;">${esc(ch.bossName)}</strong>
              <span class="frontier-badge frontier-badge-purple">BAB ${ch.number} · ${ch.bossPhases} FASE</span>
            </div>
            <div style="font-size:11px;color:#ced4da;margin:4px 0;">
              <b style="color:#a7c957;">Status:</b> ${killed ? 'PADAM' : `Menanti di Lv ${ch.lastLevel}`}
            </div>
            <div style="font-size:11px;color:#817563;">Drop Legendaris: ${esc(ch.legendary?.name || '—')}</div>
          </div>`;
        }).join('')}
      </div>`;
  } else if (overdriveTab === 'modes') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-3">
        ${OVERDRIVE_MODES.map((m, i) => `
          <div class="frontier-card">
            <div class="frontier-card-head">
              <strong style="color:#ffd166;font-size:13px;">${i + 1}. ${esc(m.name)}</strong>
            </div>
            <p style="font-size:11.5px;color:#ced4da;margin:4px 0;">${esc(m.desc)}</p>
          </div>
        `).join('')}
      </div>`;
  } else if (overdriveTab === 'profiler') {
    const done = OVERDRIVE_CHECKLIST.filter((c) => c.done).length;
    bodyEl.innerHTML = `
      <div class="frontier-card" style="max-width:540px;margin:0 auto 12px;">
        <strong style="color:#ffd166;font-size:15px;">⊡ Diagnostic Profiler HUD &amp; Checklist (${done}/${OVERDRIVE_CHECKLIST.length})</strong>
        <p style="font-size:12px;color:#b7a486;margin:8px 0;">
          Tekan <kbd>F3</kbd> saat bermain untuk toggle profiler real-time, dan <kbd>Q</kbd> di Overdrive untuk melepas mantra sekolah terpilih.
        </p>
      </div>
      <div class="overdrive-checklist">
        ${OVERDRIVE_CHECKLIST.map((c) => `
          <div class="checklist-item ${c.done ? 'done' : ''}">
            <span class="checklist-icon">${c.done ? '✅' : '⬜'}</span>
            <span class="checklist-text">${esc(c.item)}</span>
          </div>
        `).join('')}
      </div>`;
  }
}

// ── Infinite Frontiers: the playable ladder (Lv 101–200) ────────────────
// The hub keeps its data tabs; the campaign tab now runs real rooms at
// ids 674–773 through the same engine as every other chapter.
let activeFrontierIndex = -1;
let frontierChapterView = 11;
let frontierBadgeCache = '';

function frontierState() {
  if (!progress.frontiers) progress.frontiers = defaultFrontierCampaignProgress();
  return progress.frontiers;
}

function frontierChapterMetaFor(number) {
  return FRONTIER_CHAPTER_META.find((chapter) => chapter.number === Number(number)) || FRONTIER_CHAPTER_META[0];
}

function frontierLevelCard(room, state) {
  const index = room.frontierIndex;
  const locked = !frontierCampaignUnlocked(progress) || !frontierLevelUnlocked(state, index);
  const cleared = frontierLevelCleared(state, index);
  const boss = room.boss ? FRONTIER_CHAPTER_META.find((chapter) => chapter.bossId === room.boss) : null;
  const elite = room.enemies.find((enemy) => enemy.elite);
  const meta = boss
    ? `BOSS · ${boss.bossPhases} FASE`
    : `${room.enemies.length} MUSUH · ${elite?.eliteRank || 'E1'} ELITE`;
  const badge = cleared ? 'TUNTAS' : locked ? 'TERKUNCI' : 'TERBUKA';
  return `<article class="frontier-level${locked ? ' locked' : ''}${cleared ? ' cleared' : ''}${boss ? ' boss' : ''}" style="--accent:${room.accent}">
    <header class="fl-head">
      <span class="fl-num">LV ${room.frontierLevel}</span>
      <span class="fl-state">${badge}</span>
    </header>
    <h4 class="fl-name">${esc(room.name)}</h4>
    <p class="fl-meta">${esc(meta)}</p>
    <div class="fl-actions">
      ${locked ? '<span class="fl-lock">SELESAIKAN LEVEL SEBELUMNYA</span>' : `<button class="btn btn-primary btn-small" type="button" data-frontier-play="${index}">MAINKAN</button>`}
    </div>
  </article>`;
}

function buildFrontierCampaign(state) {
  const meta = frontierChapterMetaFor(frontierChapterView);
  const chapterState = frontierChapterProgress(state, meta.number) || { cleared: 0, total: FRONTIER_ROOMS_PER_CHAPTER, bossCleared: false };
  const chapterRooms = FRONTIER_ROOMS.filter((room) => room.frontierChapter === meta.number);
  const rail = FRONTIER_CHAPTER_META.map((chapter) => {
    const chapterProgress = frontierChapterProgress(state, chapter.number) || { cleared: 0, total: 10, bossCleared: false };
    const active = chapter.number === meta.number;
    return `<button class="frontier-chip${active ? ' active' : ''}${chapterProgress.bossCleared ? ' clear' : ''}" type="button" data-frontier-chapter="${chapter.number}" style="--accent:${chapter.color}">
      <strong>BAB ${chapter.number}</strong>
      <span>${chapterProgress.cleared}/${chapterProgress.total}</span>
    </button>`;
  }).join('');
  const body = `
    <div class="frontier-ladder">
      <div class="frontier-rail" role="tablist" aria-label="Bab Infinite Frontiers">${rail}</div>
      <div class="frontier-chapter-head" style="--accent:${meta.color}">
        <div>
          <p class="eyebrow">BAB ${meta.number} · ${esc(meta.english.toUpperCase())}</p>
          <h3>${esc(meta.name)}</h3>
          <p class="micro">${esc(meta.mechanic)}</p>
        </div>
        <div class="frontier-chapter-side">
          <span class="frontier-progress">${chapterState.cleared}/${chapterState.total} TAHAP</span>
          <span class="micro">${esc(meta.bossName)} · ${meta.bossPhases} FASE${chapterState.bossCleared ? ' · PADAM' : ''}</span>
        </div>
      </div>
      <div class="frontier-levels">${chapterRooms.map((room) => frontierLevelCard(room, state)).join('')}</div>
    </div>`;
  return body;
}

function startFrontierLevel(index) {
  const room = frontierRoomForIndex(index);
  if (!room) return;
  if (!frontierCampaignUnlocked(progress)) {
    showToast('Infinite Frontiers terbuka setelah The Oathbreaker gugur.', 2600);
    return;
  }
  const state = frontierState();
  if (!frontierLevelUnlocked(state, index)) {
    showToast('Level itu masih tertutup. Selesaikan level sebelumnya dulu.', 2200);
    return;
  }
  audio.init();
  attempts = 1;
  coopGuestMode = false;
  coopGuestRoom = -1;
  activeRunKind = 'frontiers';
  activeFrontierIndex = Number(index);
  frontierChapterView = room.frontierChapter;
  activeLanternStage = -1;
  activeCisternStage = -1;
  activeFairyStage = -1;
  activeFairyBoss = null;
  activeCourtRoom = null;
  activeCourtTrial = null;
  activePackIndex = -1;
  activeExpansionIndex = null;
  activeModeId = null;
  activeTrialId = null;
  modeRunRewarded = false;
  packRunActive = false;
  labRun = null;
  labDirector = null;
  speedrunRun = null;
  game.labyrinth = false;
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  game.enterRoom(room.id);
  game.player.relic = true;
  // The ladder has no character levels: the run carries the growth instead, so
  // Lv 200 is not fought with Lv 101 damage. All of it is run-scoped.
  game.player.damageMult *= frontierPlayerScale(index);
  game.player.maxHp = Math.round(game.player.maxHp * frontierVitalityScale(index));
  game.player.hp = game.player.maxHp;
  game.player.maxFlasks += frontierFlaskBonus(index);
  game.player.flasks = game.player.maxFlasks;
  game.ash = Math.max(game.ash, frontierAshStipend(index));
  state.discovered[index] = true;
  if (state.discovered[index + 1] !== undefined) state.discovered[index + 1] = true;
  recordFrontierRun(state, 0);
  cutsceneSeen = new Set();
  postCreditTimer = -1;
  saveProgress();
  game.events.length = 0;
  started = true;
  paused = false;
  hunterShopOpen = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  beginStage(game.roomIndex, room.name);
  showBanner(`LV ${room.frontierLevel} — ${room.name}`, room.subtitle);
  syncScreens();
  updateHud();
  showToast(`${FRONTIERS_LOCAL_NAME} · BAB ${room.frontierChapter} · LV ${room.frontierLevel}${room.boss ? ' · BOSS' : ''}`, 2400);
}

function handleFrontierLevelClear(index) {
  const safeIndex = Number(index);
  if (!Number.isInteger(safeIndex) || safeIndex < 0) return null;
  const state = frontierState();
  const result = recordFrontierLevel(state, safeIndex);
  if (!result.ok) return result;
  if (result.firstClear) {
    recordFrontierRun(state, game.time);
    saveProgress();
    const room = frontierRoomForIndex(safeIndex);
    if (result.bossFirstClear) {
      const chapter = frontierChapterMetaFor(result.chapter);
      const boss = room?.boss ? FRONTIER_CHAPTER_META.find((meta) => meta.bossId === room.boss) : null;
      showToast(`${boss?.bossName || 'PENJAGA'} PADAM — ${chapter.name} selesai.`, 3200);
    } else if (result.complete) {
      showToast('BATAS TERAKHIR TERLEWATI — Infinite Frontiers tuntas.', 3600);
    } else {
      showToast(`LV ${room?.frontierLevel ?? '?'} TUNTAS · ${chapterStateLabel(safeIndex)}`, 2000);
    }
    buildFrontierScreen();
    updateMenuProgress();
  }
  return result;
}

function chapterStateLabel(index) {
  const chapter = frontierChapterMetaFor(11 + Math.floor(index / FRONTIER_ROOMS_PER_CHAPTER));
  return `BAB ${chapter.number} ${chapter.english.toUpperCase()}`;
}

function buildFrontierScreen() {
  const fstate = frontierState();
  const fsummary = frontierCampaignSummary(fstate);
  const summaryEl = $('frontier-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="stat-card">
        <span class="stat-label">LEVEL KAMPANYE</span>
        <strong class="stat-value">${fsummary.levelsCleared} / ${FRONTIER_LEVEL_COUNT}</strong>
        <em class="stat-sub">${fsummary.bossesCleared}/${FRONTIER_CHAPTER_META.length} BOS · ${fsummary.percent}%</em>
      </div>
      <div class="stat-card">
        <span class="stat-label">KELAS AKTIF</span>
        <strong class="stat-value">${FRONTIER_CLASS_BY_ID[frontierProgress.activeClass]?.name || 'Warden'}</strong>
        <em class="stat-sub">15 Kelas · 45 Spesialisasi</em>
      </div>
      <div class="stat-card">
        <span class="stat-label">ELITE MOBS</span>
        <strong class="stat-value">15 / 15</strong>
        <em class="stat-sub">7 Peringkat E1–E7 · 10 Modifier</em>
      </div>
      <div class="stat-card">
        <span class="stat-label">CHECKLIST RILIS</span>
        <strong class="stat-value" style="color:#52b788;">30 / 30 SIAP</strong>
        <em class="stat-sub">Semua Modul Terverifikasi</em>
      </div>
    `;
  }

  const tabs = document.querySelectorAll('#frontier-tabs .exp-tab');
  tabs.forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === frontierTab);
  });

  const bodyEl = $('frontier-body');
  if (!bodyEl) return;

  if (frontierTab === 'campaign200') {
    const chapter = frontierChapterMetaFor(frontierChapterView);
    bodyEl.innerHTML = `
      ${!frontierCampaignUnlocked(progress) ? '<p class="frontier-lock-note">Infinite Frontiers terbuka setelah The Oathbreaker gugur di Puncak Sumpah. Level terkunci tetap terlihat supaya jalannya jelas.</p>' : ''}
      ${buildFrontierCampaign(fstate)}
      <div class="frontier-grid frontier-grid-2">
        <div class="frontier-card" style="border-left: 4px solid ${chapter.color};">
          <div class="frontier-card-head">
            <strong style="color: ${chapter.color}; font-size: 15px;">BAB ${chapter.number}: ${chapter.english}</strong>
            <span class="frontier-badge frontier-badge-gold">Lv. ${chapter.firstLevel}–${chapter.lastLevel}</span>
          </div>
          <p style="font-size: 11.5px; color: #ced4da; margin: 4px 0;">${esc(chapter.mechanic)}</p>
          <div style="font-size: 11px; color:#a7c957;"><b>👑 Bos Utama:</b> ${esc(chapter.bossName)} · ${chapter.bossPhases} fase</div>
        </div>
      </div>
    `;
    bodyEl.querySelectorAll('[data-frontier-chapter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        frontierChapterView = Number(btn.dataset.frontierChapter) || 11;
        buildFrontierScreen();
      });
    });
    bodyEl.querySelectorAll('[data-frontier-play]').forEach((btn) => {
      btn.addEventListener('click', () => startFrontierLevel(Number(btn.dataset.frontierPlay)));
    });
  } else if (frontierTab === 'classes15') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-3">
        ${FRONTIER_CLASSES.map((cls) => `
          <div class="frontier-card" style="border-top: 3px solid ${cls.color};">
            <div class="frontier-card-head">
              <strong style="color: ${cls.color}; font-size: 14px;">${cls.icon} ${cls.name}</strong>
              <span class="frontier-badge frontier-badge-blue">${cls.mainWeapon}</span>
            </div>
            <div style="font-size: 11px; color: #ffd166;">${cls.title} · ${cls.combatIdentity}</div>
            <div style="font-size: 11px; margin: 4px 0; color: #ced4da;">
              <b>Jurus:</b> ${cls.abilities.map((a) => a.name).join(', ')}
            </div>
            <div style="font-size: 11px; background: rgba(0,0,0,0.35); padding: 6px; border-radius: 4px;">
              <b style="color: #48cae4;">Spesialisasi:</b><br/>
              ${cls.specializations.map((s) => `• <b>${s.name}</b>: ${s.role}`).join('<br/>')}
            </div>
            <div style="font-size: 10px; color: #8ec5fc; margin-top: auto;">
              🔓 <em>${cls.unlockCondition}</em>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (frontierTab === 'elites15') {
    bodyEl.innerHTML = `
      <div style="margin-bottom: 12px; font-size: 12px; color: #b7a486;">
        <b>7 Peringkat Elite:</b> ${ELITE_RANKS.map((r) => `<span class="frontier-badge" style="background:${r.color}22; color:${r.color}; border:1px solid ${r.color}44;">${r.id} ${r.name}</span>`).join(' ')}
      </div>
      <div class="frontier-grid frontier-grid-3">
        ${ELITE_MOBS.map((em) => `
          <div class="frontier-card">
            <div class="frontier-card-head">
              <strong style="color: #ff7043; font-size: 13px;">${em.name}</strong>
              <span class="frontier-badge frontier-badge-purple">${em.rank}</span>
            </div>
            <div style="font-size: 11px; color: #ffd166;">📍 Wilayah: ${em.biome}</div>
            <p style="font-size: 11px; color: #ced4da; margin: 4px 0;"><b>Mekanisme Unik:</b> ${em.uniqueMechanic}</p>
            <p style="font-size: 10.5px; color: #9fb4bd;">${em.ability}</p>
            <div style="font-size: 10px; color: #b7a486; font-style: italic; margin-top: auto;">
              Drop: ${em.dropLore}
            </div>
          </div>
        `).join('')}
      </div>
      <div style="margin-top: 14px; padding: 12px; background: rgba(0,0,0,0.4); border-radius: 6px;">
        <strong style="color: #ffd166; font-size: 13px;">10 Modifier Tempur Elite Acak:</strong>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
          ${ELITE_MODIFIERS.map((m) => `
            <span class="frontier-badge frontier-badge-blue" title="${m.effect}">
              <b>${m.name}</b>: ${m.effect}
            </span>
          `).join('')}
        </div>
      </div>
    `;
  } else if (frontierTab === 'weapons15') {
    bodyEl.innerHTML = `
      <div style="margin-bottom: 10px;">
        <h3 style="color:#ffd166; font-size: 14px; margin-bottom: 6px;">15 Kategori Senjata &amp; Gaya Bertarung</h3>
        <div class="frontier-grid frontier-grid-3">
          ${FRONTIER_WEAPON_CATEGORIES.map((w) => `
            <div class="frontier-card">
              <div class="frontier-card-head">
                <strong style="color: #8ec5fc;">${w.name}</strong>
                <span class="frontier-badge frontier-badge-gold">${w.style}</span>
              </div>
              <p style="font-size: 11px; color: #ced4da;">${w.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
      <div style="margin-top: 16px;">
        <h3 style="color:#ffd166; font-size: 14px; margin-bottom: 6px;">8 Material Regional &amp; Resep Pandai Besi</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
          ${REGIONAL_MATERIALS.map((m) => `
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--line); padding: 6px 10px; border-radius: 4px; font-size: 11px;">
              ${m.icon} <b>${m.name}</b> <span style="color:#8ec5fc;">(${m.region})</span>
            </div>
          `).join('')}
        </div>
        <div class="frontier-grid frontier-grid-2">
          ${CRAFTING_RECIPES.map((r) => `
            <div class="frontier-card">
              <strong style="color: #ffd166;">⚒️ ${r.name}</strong>
              <div style="font-size: 11px; color: #ced4da;">Bahan: ${Object.entries(r.materials).map(([k, v]) => `${v}x ${k}`).join(', ')}</div>
              <div style="font-size: 11px; color: #52b788;">Pasif: ${r.passive}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (frontierTab === 'customization12') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-2">
        <div class="frontier-card">
          <h3 style="color:#ffd166; font-size: 14px;">12 Lapis Visual Zirah</h3>
          <p style="font-size: 11px; color: #ced4da;">Visual zirah terpisah sepenuhnya dari status gameplay. Pemain dapat menyembunyikan atau mengubah tiap lapis secara mandiri:</p>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 11px;">
            ${CUSTOMIZATION_LAYERS.map((l) => `
              <div style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px;">
                <b>${l.name}</b><br/><span style="color:#9fb4bd;">${l.desc}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="frontier-card">
          <h3 style="color:#ffd166; font-size: 14px;">Stasiun Pewarna (10 Dyes Murni)</h3>
          <p style="font-size: 11px; color: #ced4da;">Pilih warna untuk zirah dan jubah tanpa biaya:</p>
          <div class="dye-chip-row">
            ${DYE_PALETTE.map((d) => `
              <div class="dye-chip" style="background:${d.hex};" title="${d.name}: ${d.desc}"></div>
            `).join('')}
          </div>
          <div style="margin-top: 14px;">
            <h4 style="color:#8ec5fc; font-size: 12px; margin-bottom: 4px;">10 Mount &amp; 10 Companion</h4>
            <div style="font-size: 11px; color:#ced4da;">
              <b>Mount:</b> ${MOUNT_ROSTER.map((m) => m.name).join(', ')}<br/>
              <b>Companion:</b> ${COMPANION_ROSTER.map((c) => c.name).join(', ')}
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (frontierTab === 'modes') {
    bodyEl.innerHTML = `
      <div style="margin-bottom: 12px;">
        <h3 style="color:#ffd166; font-size: 14px; margin-bottom: 6px;">Kingdom Defense — 10 Menara Pertahanan</h3>
        <div class="frontier-grid frontier-grid-3">
          ${KINGDOM_DEFENSE_TOWERS.map((t) => `
            <div class="frontier-card">
              <div class="frontier-card-head">
                <strong style="color: #ffd166;">🏰 ${t.name}</strong>
                <span class="frontier-badge frontier-badge-blue">${t.cost} Abu</span>
              </div>
              <div style="font-size: 11px; color: #ced4da;">Dmg: ${t.dmg} · Kecepatan: ${t.rate}/dtk · Jangkauan: ${t.range}px</div>
              <div style="font-size: 10.5px; color: #a7c957;">${t.specialty}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <h3 style="color:#ffd166; font-size: 14px; margin: 16px 0 6px;">Mode Permainan Tambahan</h3>
      <div class="frontier-grid frontier-grid-2">
        ${FRONTIER_EXTRA_MODES.map((m) => `
          <div class="frontier-card">
            <strong style="color: #8ec5fc;">${m.icon} ${m.name}</strong>
            <p style="font-size: 11px; color: #ced4da;">${m.desc}</p>
          </div>
        `).join('')}
      </div>
    `;
  } else if (frontierTab === 'worldbuilder') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-2">
        <div class="frontier-card">
          <h3 style="color:#ffd166; font-size: 14px;">Pembangun Dunia 2D &amp; 3D</h3>
          <p style="font-size: 11px; color: #ced4da;">Editor peta modular dengan dukungan terrain sculpting 3D, penempatan prefab, arena bos, dan batas kamera dinamis.</p>
          <div style="font-size: 11px; color:#52b788; line-height: 1.6;">
            ✔ Terrain Sculpting: Raise, Lower, Smooth, Flatten, Paint Material<br/>
            ✔ Penempatan Bos Terkalahkan dari Kampanye 1–200<br/>
            ✔ 10 Aturan Validasi Otomatis Sebelum Publikasi
          </div>
        </div>
        <div class="frontier-card">
          <h3 style="color:#ffd166; font-size: 14px;">Katalog Node Visual Scripting</h3>
          <p style="font-size: 11px; color: #ced4da;">Sistem scripting berbasis node berizin aman (whitelisted):</p>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${SCRIPTING_NODE_WHITELIST.map((node) => `
              <span class="frontier-badge frontier-badge-purple" style="font-size: 10px;">${node}</span>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (frontierTab === 'checklist') {
    bodyEl.innerHTML = `
      <div style="margin-bottom: 12px; font-size: 12px; color: #b7a486;">
        Semua 30 kriteria penerimaan rilis untuk ekspansi Infinite Frontiers &amp; 3D Mode telah terpenuhi dan terverifikasi secara deterministik.
      </div>
      <div class="checklist-list">
        ${ACCEPTANCE_CHECKLIST_ITEMS.map((item) => `
          <div class="checklist-item">
            <span class="checklist-check">✔</span>
            <div>
              <span style="color:#ffd166; font-weight:bold; font-size:10.5px; text-transform:uppercase;">[${item.group}]</span>
              <span style="color:#ced4da; margin-left: 4px;">${item.label}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

function showCredits() {
  menuView = 'credits';
  renderStageTimes('credits-times', 'legacy');
  syncScreens();
}

// ── update log (lazy-loaded) ─────────────────────────────────────────────
let updateLogCache = null;
let updateLogError = '';
let updateLogRequestToken = 0;

function buildUpdateLog() {
  const badge = $('updates-version');
  if (badge) badge.textContent = `VERSI SAAT INI · v${GAME_VERSION}`;
  const wrap = $('update-log');
  if (!wrap) return;
  if (updateLogCache) {
    wrap.innerHTML = updateLogCache.map((entry, index) => `
    <article class="update-entry${index === 0 ? ' latest' : ''}">
      <header class="update-head">
        <div class="update-version-row">
          <span class="update-version">v${entry.version}</span>
          <span class="update-tag">${entry.tag}</span>
          ${index === 0 ? '<span class="update-current">TERBARU</span>' : ''}
        </div>
        <span class="update-date">${entry.date}</span>
      </header>
      <h3 class="update-title">${entry.title}</h3>
      <p class="update-summary">${entry.summary}</p>
      <ul class="update-list">
        ${entry.highlights.map((line) => `<li>${line}</li>`).join('')}
      </ul>
      ${entry.fixes?.length ? `
        <div class="update-fixes">
          <span>PERBAIKAN &amp; PENYESUAIAN</span>
          <ul>${entry.fixes.map((line) => `<li>${line}</li>`).join('')}</ul>
        </div>` : ''}
    </article>
  `).join('');
    return;
  }
  if (updateLogError) {
    wrap.innerHTML = `<div class="update-entry"><p class="update-summary">Gagal memuat catatan pembaruan: ${esc(updateLogError)}</p><button class="btn btn-ghost btn-compact" type="button" data-updates-retry="1">COBA LAGI</button></div>`;
    return;
  }
  wrap.innerHTML = '<p class="updates-loading" role="status">Memuat catatan pembaruan…</p>';
}

async function loadUpdateLog({ force = false } = {}) {
  if (updateLogCache && !force) {
    if (menuView === 'updates') buildUpdateLog();
    return updateLogCache;
  }
  const token = ++updateLogRequestToken;
  updateLogError = '';
  if (menuView === 'updates') buildUpdateLog();
  try {
    const mod = await import('./updates.js');
    if (token !== updateLogRequestToken) return null;
    updateLogCache = mod.UPDATE_LOG;
    if (menuView === 'updates') buildUpdateLog();
    return updateLogCache;
  } catch (error) {
    if (token !== updateLogRequestToken) return null;
    updateLogError = String(error?.message || 'galat jaringan');
    if (menuView === 'updates') buildUpdateLog();
    return null;
  }
}

function showUpdates() {
  clearShellOverlays();
  started = false;
  paused = false;
  menuView = 'updates';
  clearHeldKeys();
  buildUpdateLog();
  syncScreens();
  return loadUpdateLog();
}

// ── PETA KISAH — storyline map (lazy-loaded) ─────────────────────────────
let storyMapCtrl = null;
let storyMapPromise = null;
let storyMapOpenToken = 0;

function ensureStoryMap() {
  if (storyMapCtrl) return Promise.resolve(storyMapCtrl);
  if (!storyMapPromise) {
    storyMapPromise = import('./storymap_ui.js')
      .then((mod) => {
        if (!storyMapCtrl) {
          storyMapCtrl = mod.createStoryMapController({
            $,
            esc,
            getMenuView: () => menuView,
            setMenuView: (v) => { menuView = v; },
            setStarted: (v) => { started = v; },
            setPaused: (v) => { paused = v; },
            clearShellOverlays,
            clearHeldKeys,
            syncScreens,
            showMenu,
          });
          storyMapCtrl.bindDom();
        }
        return storyMapCtrl;
      })
      .catch((err) => {
        storyMapPromise = null;
        throw err;
      });
  }
  return storyMapPromise;
}

async function showStoryMap(arcId) {
  const token = ++storyMapOpenToken;
  clearShellOverlays();
  started = false;
  paused = false;
  menuView = 'storymap';
  clearHeldKeys();
  const detail = $('storymap-detail');
  if (!storyMapCtrl && detail) {
    detail.innerHTML = '<p class="storymap-summary-text" role="status">Memuat Peta Kisah…</p>';
  }
  syncScreens();
  try {
    const ctrl = await ensureStoryMap();
    if (token !== storyMapOpenToken || menuView !== 'storymap') return false;
    return ctrl.open(arcId);
  } catch (error) {
    if (token !== storyMapOpenToken || menuView !== 'storymap') return false;
    if (detail) {
      detail.innerHTML = `<p class="storymap-summary-text">Gagal memuat Peta Kisah: ${esc(error?.message || 'galat')}</p><button class="btn btn-ghost btn-small" type="button" data-story-retry="1">COBA LAGI</button>`;
    }
    return false;
  }
}

function closeStoryMap() {
  if (storyMapCtrl) {
    storyMapCtrl.close();
    return;
  }
  showMenu();
}

function selectStoryArc(id) {
  if (storyMapCtrl) {
    storyMapCtrl.selectStoryArc(id);
    return true;
  }
  return showStoryMap(id);
}

// ── settings screen ──────────────────────────────────────────────────────
function showSettings(tab = null) {
  settingsOpen = true;
  if (typeof tab === 'string' && SETTINGS_CATEGORIES.some((entry) => entry.id === tab)) settingsTab = tab;
  settingsBaseline = JSON.parse(JSON.stringify(settings));
  settingsSearch = '';
  settingsApplyState = 'saved';
  settingsCapture = null;
  settingsConflict = null;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  clearHeldKeys();
  buildSettings();
  syncScreens();
}

function cancelSettings() {
  if (settingsBaseline) {
    settings = settingsBaseline;
    applySettings({ persist: false });
  }
  closeSettings();
}

function closeSettings() {
  if (!settingsOpen) return;
  settingsOpen = false;
  settingsBaseline = null;
  settingsCapture = null;
  settingsConflict = null;
  lastTime = performance.now();
  accumulator = 0;
  syncScreens();
}

// ── character select / customization ─────────────────────────────────────
function showCharacter() {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'character';
  clearHeldKeys();
  buildCharacterScreen();
  syncScreens();
}

function closeCharacter() {
  showMenu();
}

let previewCtx = null;
let previewDpr = 0;

function statBar(label, value, max) {
  const pct = clamp(value / max, 0, 1) * 100;
  return `<div class="char-stat"><span>${label}</span><i><b style="width:${pct}%"></b></i></div>`;
}

function buildCharacterScreen() {
  const roster = $('char-roster');
  if (!roster) return;

  roster.innerHTML = Object.values(CHARACTERS)
    .map(
      (c) => `
      <button class="char-card${c.id === character.characterId ? ' active' : ''}" type="button" data-char="${c.id}" aria-pressed="${c.id === character.characterId}">
        <span class="char-glyph" aria-hidden="true">${c.glyph}</span>
        <strong>${c.name}</strong>
        <em>${c.title}</em>
      </button>`,
    )
    .join('');

  $('char-races').innerHTML = Object.values(RACES)
    .map(
      (r) => `
      <button class="char-chip${r.id === character.race ? ' active' : ''}" type="button" data-race="${r.id}" aria-pressed="${r.id === character.race}">${r.name}</button>`,
    )
    .join('');

  $('char-armors').innerHTML = Object.values(OUTFITS)
    .map(
      (o) => `
      <button class="char-chip${o.id === character.armor ? ' active' : ''}" type="button" data-armor="${o.id}" aria-pressed="${o.id === character.armor}">
        <i class="chip-dot" style="background:${o.color}"></i>${o.name}
      </button>`,
    )
    .join('');

  $('char-skins').innerHTML = SKIN_TONES.map(
    (color, i) => `
      <button class="char-swatch${color === character.skin ? ' active' : ''}" type="button" data-skin="${color}" aria-label="Warna kulit ${i + 1}" aria-pressed="${color === character.skin}" style="--sw:${color}"></button>`,
  ).join('');

  $('char-colors').innerHTML = OUTFIT_COLORS.map(
    (color, i) => `
      <button class="char-swatch${color === character.outfit ? ' active' : ''}" type="button" data-outfit="${color}" aria-label="Warna pakaian ${i + 1}" aria-pressed="${color === character.outfit}" style="--sw:${color}"></button>`,
  ).join('');

  const c = CHARACTERS[character.characterId] || CHARACTERS.sera;
  $('char-name').textContent = c.name;
  $('char-title').textContent = c.title;
  $('char-desc').textContent = c.desc;
  $('char-stats').innerHTML = [
    statBar('DARAH', c.maxHp, 140),
    statBar('SERANGAN', c.damage, 1.2),
    statBar('KECEPATAN', c.speed, 1.2),
  ].join('');
  if ($('char-ability-name') && c.ability) {
    $('char-ability-name').textContent = `${c.ability.name} (${c.className || 'Kelas'})`;
    $('char-ability-desc').textContent = c.ability.desc;
    const bonus = skillBonuses(progress.skills);
    if ($('char-ability-key')) {
      $('char-ability-key').textContent =
        `[${c.ability.key || 'U / V'}] · CD ${(c.ability.cooldown * bonus.ultCooldown).toFixed(1)}s · ULT ×${bonus.ultDamage.toFixed(2)}`;
    }
  }
  $('char-race-desc').textContent = RACES[character.race]?.desc || '';
  $('char-armor-desc').textContent = OUTFITS[character.armor]?.desc || '';
  buildSkillPanel();

  roster.querySelectorAll('[data-char]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.char;
      const picked = CHARACTERS[id];
      if (!picked) return;
      setCharacter({
        characterId: id,
        race: picked.appearance.race,
        skin: picked.appearance.skin,
        outfit: picked.appearance.outfit,
        armor: picked.appearance.armor,
      });
    });
  });

  $('char-races').querySelectorAll('[data-race]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const race = btn.dataset.race;
      setCharacter({ race, skin: RACES[race]?.skin || character.skin });
    });
  });

  $('char-armors').querySelectorAll('[data-armor]').forEach((btn) => {
    btn.addEventListener('click', () => setCharacter({ armor: btn.dataset.armor }));
  });

  $('char-skins').querySelectorAll('[data-skin]').forEach((btn) => {
    btn.addEventListener('click', () => setCharacter({ skin: btn.dataset.skin }));
  });

  $('char-colors').querySelectorAll('[data-outfit]').forEach((btn) => {
    btn.addEventListener('click', () => setCharacter({ outfit: btn.dataset.outfit }));
  });

  const canvas = $('char-preview');
  if (canvas) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = canvas.clientWidth || 260;
    const cssH = canvas.clientHeight || 330;
    if (previewDpr !== dpr) {
      previewDpr = dpr;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    previewCtx = canvas.getContext('2d');
    previewCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

// ── Skill Points ──────────────────────────────────────────────────────────
function applySkillsToGame() {
  return game.applySkillBonuses(skillBonuses(progress.skills));
}

function spendSkillPointAt(nodeId) {
  const result = spendSkillPoint(progress.skills, nodeId);
  if (!result.ok) {
    showToast(
      result.reason === 'max'
        ? 'Keahlian itu sudah maksimal.'
        : 'Skill Point habis. Kalahkan bos untuk mendapat lebih banyak.',
      2200,
    );
    return result;
  }
  saveProgress();
  applySkillsToGame();
  buildCharacterScreen();
  showToast(`${result.node.name} Lv ${result.rank} · ultimate ×${skillBonuses(progress.skills).ultDamage.toFixed(2)}`, 2000);
  return result;
}

function resetSkills() {
  const result = resetSkillRanks(progress.skills);
  saveProgress();
  applySkillsToGame();
  buildCharacterScreen();
  showToast(result.refunded ? `Skill Point dikembalikan: ${result.refunded}` : 'Tidak ada peringkat untuk direset.', 2000);
  return result;
}

function awardBossSkillPoints(kind, name) {
  const result = grantBossSkillPoints(progress.skills, kind);
  if (!result.ok) return result;
  saveProgress();
  if (result.points > 0) {
    showToast(
      `SKILL POINT +${result.points}${result.first ? ' · penjaga baru' : ''} — total ${progress.skills.points}${name ? ` (${name})` : ''}`,
      2800,
    );
    applySkillsToGame();
  }
  return result;
}

function buildSkillPanel() {
  const list = $('char-skill-list');
  if (!list) return;
  const summary = skillSummary(progress.skills);
  const pointsEl = $('char-skill-points');
  if (pointsEl) pointsEl.textContent = `${summary.points} SKILL POINT`;
  const summaryEl = $('char-skill-summary');
  if (summaryEl) {
    summaryEl.textContent =
      `Ultimate ×${summary.bonuses.ultDamage.toFixed(2)} · CD ×${summary.bonuses.ultCooldown.toFixed(2)}` +
      ` · kritik ${Math.round(summary.bonuses.ultCrit * 100)}% · ${summary.used}/${SKILL_MAX_RANKS} peringkat`;
  }
  list.innerHTML = SKILL_NODES.map((node) => {
    const rank = summary.ranks[node.id] || 0;
    const max = rank >= node.maxRank;
    const affordable = summary.points > 0 && !max;
    return `
      <article class="skill-node${max ? ' maxed' : ''}" style="--skill-color:${node.color}">
        <span class="skill-glyph" aria-hidden="true">${node.glyph}</span>
        <div class="skill-copy">
          <strong>${node.name}</strong>
          <em>${node.branchName} · Lv ${rank}/${node.maxRank}</em>
          <p>${node.desc}</p>
        </div>
        <button class="btn ${affordable ? 'btn-primary' : 'btn-ghost'} btn-compact" type="button"
          data-skill="${node.id}" ${affordable ? '' : 'disabled'}>
          ${max ? 'MAKSIMAL' : affordable ? '+1 POIN' : 'BUTUH POIN'}
        </button>
      </article>`;
  }).join('');
  list.querySelectorAll('[data-skill]').forEach((btn) => {
    btn.addEventListener('click', () => spendSkillPointAt(btn.dataset.skill));
  });
  const resetBtn = $('btn-skill-reset');
  if (resetBtn) {
    resetBtn.disabled = summary.spent <= 0;
    resetBtn.onclick = () => resetSkills();
  }
}

// ── prologue cutscene ────────────────────────────────────────────────────
let prologueDone = null;

function prologueSpeak(text) {
  if (!prologueVoice) return;
  // ElevenLabs when the server has a key, browser speech otherwise.
  void speakVoiceLine(text, 'narrator');
}

function stopPrologueVoice() {
  stopVoice();
}

function paintPrologue() {
  const canvas = $('prologue-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const beat = PROLOGUE_BEATS[Math.max(0, prologueIndex)] || PROLOGUE_BEATS[0];
  drawPrologue(ctx, canvas.width, canvas.height, beat, prologueTimer, prologueTotal);
}

function showPrologueBeat(index) {
  prologueIndex = clamp(index, 0, PROLOGUE_BEATS.length - 1);
  prologueTimer = 0;
  const beat = PROLOGUE_BEATS[prologueIndex];
  $('prologue-label').textContent = beat.label;
  $('prologue-line').textContent = beat.text;
  $('prologue-speaker').textContent = 'NARATOR';
  $('prologue-count').textContent = `${prologueIndex + 1} / ${PROLOGUE_BEATS.length}`;
  audio.prologueBeat(prologueIndex);
  prologueSpeak(beat.text);
  paintPrologue();
}

function startPrologue(onDone) {
  audio.init();
  audioUnlocked = true;
  music.stop(0.8);
  prologueActive = true;
  prologueDone = onDone || (() => startRun(0));
  prologueIndex = 0;
  prologueTimer = 0;
  prologueTotal = 0;
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  game.reset();
  game.events.length = 0;
  clearHeldKeys();
  audio.startPrologue();
  $('btn-prologue-voice').textContent = prologueVoice ? 'SUARA: AKTIF' : 'SUARA: MATI';
  $('btn-prologue-voice').setAttribute('aria-pressed', String(prologueVoice));
  showPrologueBeat(0);
  syncScreens();
}

function advancePrologue() {
  if (!prologueActive) return;
  if (prologueIndex + 1 >= PROLOGUE_BEATS.length) {
    finishPrologue();
    return;
  }
  showPrologueBeat(prologueIndex + 1);
}

function finishPrologue() {
  if (!prologueActive) return;
  prologueActive = false;
  audio.stopPrologue();
  stopPrologueVoice();
  $('prologue-progress').style.width = '0%';
  syncScreens();
  const done = prologueDone;
  prologueDone = null;
  if (done) done();
}

function beginJourney() {
  startPrologue(() => startRun(0));
}

function cancelPrologue() {
  if (!prologueActive) return;
  prologueActive = false;
  prologueDone = null;
  audio.stopPrologue();
  stopPrologueVoice();
  $('prologue-progress').style.width = '0%';
}

// ── cinematic cutscenes (final boss portrait + post-credit epilogue) ─────
function paintCutscene() {
  const canvas = $('cutscene-canvas');
  if (!canvas || !cutsceneScene) return;
  const ctx = canvas.getContext('2d');
  drawCutscene(ctx, canvas.width, canvas.height, cutsceneScene, cutsceneTime);
}

function showCutsceneBeat(force = false) {
  if (!cutsceneScene) return;
  const beat = cutsceneBeatAt(cutsceneScene, cutsceneTime);
  if (!beat) return;
  if (!force && cutsceneBeatIndex === cutsceneScene.beats.indexOf(beat)) return;
  cutsceneBeatIndex = cutsceneScene.beats.indexOf(beat);
  $('cutscene-label').textContent = beat.label;
  $('cutscene-line').textContent = beat.text;
  $('cutscene-count').textContent = `${Math.min(cutsceneScene.beats.length, cutsceneBeatIndex + 1)} / ${cutsceneScene.beats.length}`;
  paintCutscene();
}

function startCutscene(scene, onDone) {
  const cinematic = typeof scene === 'string' ? cutsceneFor(scene) : scene;
  if (!cinematic) return false;
  audio.init();
  audioUnlocked = true;
  cutsceneActive = true;
  cutsceneScene = cinematic;
  cutsceneTime = 0;
  cutsceneBeatIndex = -1;
  cutsceneDone = typeof onDone === 'function' ? onDone : null;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  $('cutscene-eyebrow').textContent = cinematic.eyebrow;
  $('cutscene-title').textContent = cinematic.title;
  $('cutscene-progress').style.width = '0%';
  $('btn-cutscene-skip').textContent = 'LEWATI ▸';
  if (cinematic.music) {
    music.crossfadeTo(cinematic.music, 1.4);
    desiredMusic = cinematic.music;
  }
  showCutsceneBeat(true);
  syncScreens();
  return true;
}

function finishCutscene(skipped = false) {
  if (!cutsceneActive) return;
  cutsceneActive = false;
  cutsceneScene = null;
  cutsceneTime = 0;
  $('cutscene-progress').style.width = '0%';
  $('cutscene-screen').classList.add('hidden');
  const done = cutsceneDone;
  cutsceneDone = null;
  lastTime = performance.now();
  accumulator = 0;
  syncScreens();
  if (done) done(skipped);
}

function playFinalBossCutscene() {
  if (cutsceneSeen.has(BOSS_CUTSCENE.id)) return;
  cutsceneSeen.add(BOSS_CUTSCENE.id);
  // The intro dialogue stays queued beneath the cutscene, so it is already on
  // screen once the portrait finishes — no need to re-emit it.
  startCutscene(BOSS_CUTSCENE, () => {
    if (game.boss) game.boss.intro = Math.max(game.boss.intro || 0, 0.9);
  });
}

function queuePostCredit() {
  if (cutsceneSeen.has(POST_CREDIT.id)) return;
  cutsceneSeen.add(POST_CREDIT.id);
  postCreditTimer = 2.4;
}

function togglePrologueVoice() {
  prologueVoice = !prologueVoice;
  const btn = $('btn-prologue-voice');
  btn.textContent = prologueVoice ? 'SUARA: AKTIF' : 'SUARA: MATI';
  btn.setAttribute('aria-pressed', String(prologueVoice));
  if (!prologueVoice) stopPrologueVoice();
  else if (prologueActive) prologueSpeak(PROLOGUE_BEATS[prologueIndex].text);
}

function startSpectate(index) {
  audio.init();
  spectateRoom = clamp(index, 0, ROOMS.length - 1);
  const peek = new AshenGame();
  peek.enterRoom(spectateRoom);
  if (peek.boss) {
    peek.boss.intro = 0;
    peek.boss.state = peek.boss.flying ? 'hover' : 'chase';
    peek.boss.cooldown = 999;
    peek.boss.hp = peek.boss.maxHp;
  }
  spectateGame = peek;
  spectating = true;
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  menuView = 'none';
  peekOffset = 0;
  peekDir = 0;
  const room = ROOMS[spectateRoom];
  $('peek-name').textContent = room.name;
  $('peek-sub').textContent = (room.subtitle || '').toUpperCase();
  let hint = 'Mode menonton — tidak ada combat. Kamu hanya melihat ruang ini.';
  if (peek.boss) hint = `Boss: ${peek.boss.name} — ${peek.boss.title} · ${peek.boss.maxPhases} fase`;
  else if (room.relic) hint = `Relik: ${room.relic.name} · jurang di tengah balai`;
  else if (room.enemies?.length) hint = `${room.enemies.length} penjaga · ${room.hint}`;
  $('peek-hint').textContent = hint;
  clearHeldKeys();
  syncScreens();
}

function stopSpectate() {
  spectating = false;
  spectateGame = null;
  peekDir = 0;
  menuView = 'levels';
  buildLevelCards();
  syncScreens();
}

function spectateCamera() {
  if (!spectateGame) return 0;
  const max = WORLD_W - VIEW_W;
  const t = spectateGame.time;
  let base;
  if (spectateGame.boss) {
    base = spectateGame.boss.x + spectateGame.boss.w / 2 - VIEW_W / 2 + Math.sin(t * 0.22) * 46;
  } else {
    base = max * (0.5 + 0.5 * Math.sin(t * 0.12 - Math.PI / 2));
  }
  return clamp(base + peekOffset, 0, max);
}

// ── map ──────────────────────────────────────────────────────────────────
let mapPinType = 'note';
let mapDrag = null;

function inActiveRun() {
  return started && !spectating && menuView === 'none' && game.state !== 'dead';
}

function buildMap() {
  const inRun = started && !spectating && menuView === 'none';
  const current = inRun ? game.roomIndex : -1;
  if (inRun) discoverCurrentRoom(game.roomIndex);

  const nodes = mapNodes(ROOMS, undefined, progress.map, progress.cleared);
  mapView.setData({
    nodes,
    pins: progress.map.pins,
    currentIndex: current,
    cleared: progress.cleared,
  });

  const stats = mapStats(progress.map, ROOMS, progress.cleared);
  const statCells = [
    [stats.discovered, 'RUANG DITEMUKAN'],
    [`${stats.discoveredPct}%`, 'EKSPLORASI'],
    [`${stats.bossesDefeated}/${stats.bossesTotal}`, 'BOSS GUGUR'],
    [`${stats.relicsFound}/${stats.relicsTotal}`, 'RELIK'],
    [`${stats.pins}/${MAX_PINS}`, 'PIN'],
    [`${stats.cleared}`, 'RUANG TUNTAS'],
  ];
  $('map-stats').innerHTML = statCells
    .map(([value, label]) => `<div class="map-stat"><b>${value}</b><span>${label}</span></div>`)
    .join('');

  $('map-legend').innerHTML = LEGEND.map(
    (item) =>
      `<span class="map-legend-item" style="--legend-color:${item.color}"><i>${item.glyph}</i>${item.label}</span>`,
  ).join('');

  const tools = $('map-pin-tools');
  if (tools) {
    tools.innerHTML = PIN_TYPES.map(
      (type) =>
        `<button class="map-pin-btn${mapPinType === type.id ? ' active' : ''}" type="button" data-pin="${type.id}" style="--pin-color:${type.color}" title="${type.label}" aria-pressed="${mapPinType === type.id}">${type.glyph}<span>${type.label}</span></button>`,
    ).join('');
    tools.querySelectorAll('[data-pin]').forEach((btn) => {
      btn.addEventListener('click', () => {
        mapPinType = btn.dataset.pin;
        buildMap();
      });
    });
  }

  $('map-current').textContent =
    current >= 0
      ? `POSISI · ${game.room.name.toUpperCase()} · ${zoneForRoom(current).name.toUpperCase()}`
      : `PETA SUMPAH · ${ROOMS.length} RUANG · ${ZONE_LIST.length} ZONA · ${ROOMS.filter((room) => room.boss).length} BOSS`;
  $('map-progress').textContent = `${progress.cleared.filter(Boolean).length} / ${ROOMS.length} RUANG TUNTAS`;
  $('map-zone-count').textContent = String(ZONE_LIST.length);
  $('map-tip').classList.add('hidden');
}

function openMap() {
  if (dialogueOpen || spectating || settingsOpen) return;
  mapOpen = true;
  codexOpen = false;
  inventoryOpen = false;
  clearHeldKeys();
  syncScreens();
  buildMap();
  mapView.resize();
  if (inActiveRun()) mapView.recenterOn(game.roomIndex);
  else mapView.fit();
}

function closeMap() {
  if (!mapOpen) return;
  mapOpen = false;
  mapDrag = null;
  lastTime = performance.now();
  accumulator = 0;
  syncScreens();
}

function toggleMap() {
  if (mapOpen) closeMap();
  else openMap();
}

function mapMovePin(index) {
  const result = removePin(progress.map, index);
  if (result.removed) {
    progress.map = result.state;
    saveProgress();
    buildMap();
  }
}

function placeMapPin(localX, localY) {
  const world = mapView.screenToWorld(localX, localY);
  const node = mapView.nodeAtScreen(localX, localY);
  const result = addPin(
    progress.map,
    { x: Math.round(world.x), y: Math.round(world.y), type: mapPinType, room: node ? node.index : null },
    MAX_PINS,
  );
  if (!result.ok) {
    showToast(result.reason === 'limit' ? `Pin penuh — maksimal ${MAX_PINS}.` : 'Pin tidak valid.', 1800);
    return;
  }
  progress.map = result.state;
  saveProgress();
  buildMap();
  showToast('Pin peta ditambahkan.', 1200);
}

function nearestPinIndex(localX, localY, radius = 14) {
  let best = -1;
  let bestDist = radius;
  progress.map.pins.forEach((pin, index) => {
    const pos = mapView.worldToScreen(pin.x, pin.y);
    const dist = Math.hypot(pos.x - localX, pos.y - localY);
    if (dist < bestDist) {
      best = index;
      bestDist = dist;
    }
  });
  return best;
}

function showMapTip(node, localX, localY) {
  const tip = $('map-tip');
  if (!node || (!node.discovered && !node.adjacent)) {
    tip.classList.add('hidden');
    return;
  }
  const zone = node.zone;
  const features = [];
  if (node.features.includes('shrine')) features.push('Warung Abu');
  if (node.features.includes('boss')) {
    features.push(node.cleared ? 'Boss telah gugur' : 'Boss menanti');
  }
  if (node.features.includes('relic')) features.push(node.cleared ? 'Relik diambil' : 'Relik');
  if (node.features.includes('gate')) features.push('Gerbang terkunci');
  tip.innerHTML = node.discovered
    ? `<strong>${node.room.name}</strong><span>${zone.name} · ${zone.subtitle}</span><br><span>${features.join(' · ') || 'Ruang biasa'}</span>${node.index === mapView.currentIndex ? '<br><span>◆ Kau di sini</span>' : ''}`
    : `<strong>Belum dijelajahi</strong><span>Jejak pintu dari ruang yang kau masuki.</span>`;
  tip.classList.remove('hidden');
  const wrap = tip.parentElement;
  const maxX = (wrap?.clientWidth || 700) - tip.offsetWidth - 8;
  const maxY = (wrap?.clientHeight || 400) - tip.offsetHeight - 8;
  tip.style.left = `${clamp(localX + 14, 8, Math.max(8, maxX))}px`;
  tip.style.top = `${clamp(localY + 14, 8, Math.max(8, maxY))}px`;
}

function wireMapControls() {
  const mapCanvas = $('map-canvas');
  if (!mapCanvas) return;

  mapCanvas.addEventListener('pointerdown', (e) => {
    if (!mapOpen) return;
    const local = mapView.toLocal(e.clientX, e.clientY);
    mapDrag = {
      id: e.pointerId,
      startX: local.x,
      startY: local.y,
      offsetX: mapView.offsetX,
      offsetY: mapView.offsetY,
      moved: false,
    };
    mapCanvas.setPointerCapture?.(e.pointerId);
    mapCanvas.classList.add('dragging');
  });

  mapCanvas.addEventListener('pointermove', (e) => {
    if (!mapOpen) return;
    const local = mapView.toLocal(e.clientX, e.clientY);
    if (mapDrag && mapDrag.id === e.pointerId) {
      const dx = local.x - mapDrag.startX;
      const dy = local.y - mapDrag.startY;
      if (Math.hypot(dx, dy) > 3) mapDrag.moved = true;
      mapView.offsetX = mapDrag.offsetX + dx;
      mapView.offsetY = mapDrag.offsetY + dy;
    }
    const node = mapView.nodeAtScreen(local.x, local.y);
    mapView.hoverIndex = node ? node.index : -1;
    showMapTip(node, local.x, local.y);
  });

  const endDrag = (e) => {
    if (!mapOpen || !mapDrag) return;
    const local = mapView.toLocal(e.clientX, e.clientY);
    const wasClick = !mapDrag.moved;
    mapDrag = null;
    mapCanvas.classList.remove('dragging');
    if (wasClick) placeMapPin(local.x, local.y);
  };
  mapCanvas.addEventListener('pointerup', endDrag);
  mapCanvas.addEventListener('pointercancel', () => {
    mapDrag = null;
    mapCanvas.classList.remove('dragging');
  });
  mapCanvas.addEventListener('pointerleave', () => {
    $('map-tip').classList.add('hidden');
    mapView.hoverIndex = -1;
  });

  mapCanvas.addEventListener(
    'wheel',
    (e) => {
      if (!mapOpen) return;
      e.preventDefault();
      const local = mapView.toLocal(e.clientX, e.clientY);
      mapView.zoomAt(e.deltaY < 0 ? 1.14 : 1 / 1.14, local.x, local.y);
    },
    { passive: false },
  );

  mapCanvas.addEventListener('dblclick', (e) => {
    if (!mapOpen) return;
    e.preventDefault();
    if (inActiveRun()) mapView.recenterOn(game.roomIndex);
    else mapView.fit();
  });

  mapCanvas.addEventListener('contextmenu', (e) => {
    if (!mapOpen) return;
    e.preventDefault();
    const local = mapView.toLocal(e.clientX, e.clientY);
    const index = nearestPinIndex(local.x, local.y, 16);
    if (index >= 0) mapMovePin(index);
  });

  $('map-zoom-in').addEventListener('click', () => mapView.zoomAt(1.22));
  $('map-zoom-out').addEventListener('click', () => mapView.zoomAt(1 / 1.22));
  $('map-recenter').addEventListener('click', () => {
    if (inActiveRun()) mapView.recenterOn(game.roomIndex);
    else mapView.fit();
  });
  $('map-clear-pins').addEventListener('click', () => {
    progress.map.pins = [];
    saveProgress();
    buildMap();
  });
}

// ── codex ────────────────────────────────────────────────────────────────
const CODEX_TABS = [
  { id: 'enemies', label: 'MUSUH', glyph: '◈' },
  { id: 'weapons', label: 'SENJATA', glyph: '†' },
  { id: 'bosses', label: 'BOSS', glyph: '♜' },
  { id: 'items', label: 'BARANG', glyph: '✦' },
];

function buildCodex() {
  const tabs = $('codex-tabs');
  const wrap = $('codex-entries');
  if (!tabs || !wrap) return;
  tabs.innerHTML = CODEX_TABS.map((tab) => `
    <button class="codex-tab${codexTab === tab.id ? ' active' : ''}" type="button" data-codex-tab="${tab.id}">
      <span aria-hidden="true">${tab.glyph}</span>${tab.label}
    </button>
  `).join('');
  tabs.querySelectorAll('[data-codex-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      codexTab = btn.dataset.codexTab;
      buildCodex();
    });
  });
  const entries = CODEX[codexTab] || [];
  wrap.innerHTML = entries.map((entry) => `
    <article class="codex-card" style="--accent:${codexTab === 'bosses' ? '#d98b58' : '#c9a25c'}">
      <div class="codex-card-top">
        <span class="codex-glyph" aria-hidden="true">${entry.glyph}</span>
        <span class="codex-danger">${entry.danger}</span>
      </div>
      <h3>${entry.name}</h3>
      <span class="codex-sub">${entry.subtitle}</span>
      <p>${entry.desc}</p>
      <div class="codex-meta">
        ${entry.meta.map(([k, v]) => `<span><b>${k}</b>${v}</span>`).join('')}
      </div>
      <span class="codex-where">${entry.where}</span>
    </article>
  `).join('');
  $('codex-count').textContent = `${entries.length} ENTRI · INDEKS ${CODEX_TABS.find((t) => t.id === codexTab).label}`;
}

function openCodex(tab) {
  if (dialogueOpen || spectating) return;
  if (tab && CODEX[tab]) codexTab = tab;
  codexOpen = true;
  mapOpen = false;
  inventoryOpen = false;
  clearHeldKeys();
  buildCodex();
  syncScreens();
}

function closeCodex() {
  if (!codexOpen) return;
  codexOpen = false;
  lastTime = performance.now();
  accumulator = 0;
  syncScreens();
}

function toggleCodex() {
  if (codexOpen) closeCodex();
  else openCodex();
}

// ── inventory ────────────────────────────────────────────────────────────
function inventoryCard(item, count, canUse) {
  return `
    <article class="inventory-card" data-item="${item.id}">
      <span class="inv-glyph" aria-hidden="true">${item.glyph || '✦'}</span>
      <div class="inv-body">
        <span class="inv-type">${item.type === 'sigil' ? 'SIGIL PASIF' : item.type === 'ritual' ? 'ITEM RITUAL' : item.type === 'hunter' ? 'PERLENGKAPAN PEMBURU' : 'KONSUMABEL'}</span>
        <h3>${item.name}</h3>
        <p>${item.desc}</p>
        <span class="inv-effect">${item.effect || ''}</span>
      </div>
      <div class="inv-side">
        <span class="inv-count">×${count}</span>
        ${canUse
          ? `<button class="btn btn-ghost btn-small inv-use" type="button" data-use-item="${item.id}">PAKAI</button>`
          : '<span class="inv-passive">AKTIF</span>'}
      </div>
    </article>
  `;
}

function buildInventory() {
  const wrap = $('inventory-list');
  if (!wrap) return;
  const p = game.player;
  const sigils = SHOP_ITEMS.filter((item) => item.type === 'sigil' && p.sigils.includes(item.id));
  const rituals = SHOP_ITEMS.filter((item) => item.type === 'ritual' && game.itemCount(item.id) > 0);
  const consumables = SHOP_ITEMS.filter((item) => item.type === 'consumable' && game.itemCount(item.id) > 0);
  const hunterItems = HUNTER_ITEMS.filter((item) => game.hunterItemCount(item.id) > 0);
  const quick = game.quickItemInfo();
  const quickEl = $('inventory-quick');
  if (quickEl) {
    quickEl.innerHTML = `ITEM CEPAT · <b>${quick.name}</b> <span>×${quick.count}</span> <em>R untuk berganti</em>`;
  }

  const group = (title, note, items, canUse) => `
    <section class="inventory-group">
      <div class="inventory-group-head">
        <h2>${title}</h2>
        <span>${note}</span>
      </div>
      ${items.length
        ? `<div class="inventory-grid">${items.map((item) => inventoryCard(item, game.itemCount(item.id) || 1, canUse)).join('')}</div>`
        : '<p class="inventory-empty">Belum ada item di kategori ini.</p>'}
    </section>
  `;

  wrap.innerHTML = [
    group('SIGIL', `${sigils.length} aktif · efek permanen sampai run berakhir`, sigils, false),
    group('RITUAL', `${rituals.length} jenis · sekali pakai, efek besar`, rituals, true),
    group('KONSUMABEL', `${consumables.length} jenis · stok cepat`, consumables, true),
    group('PEMBURU', `${hunterItems.length} jenis · stun, asap, peluru roh, jimat`, hunterItems, true),
  ].join('');

  const loadout = $('inventory-loadout');
  if (loadout) {
    const weaponNames = (p.weapons || []).map((id) => WEAPONS[id]?.name || id);
    const courtTools = (progress.court?.equippedTools || []).map((id) => COURT_TOOL_BY_ID[id]?.name || id);
    loadout.innerHTML = `
      <h3>PERLENGKAPAN AKTIF</h3>
      <div class="loadout-grid">
        <div class="loadout-cell"><span>KELAS</span><b>${esc(CHARACTERS[p.characterId]?.className || 'Penjaga')}</b><em>${esc(CHARACTERS[p.characterId]?.ability?.name || '—')}</em></div>
        <div class="loadout-cell"><span>SENJATA</span><b>${esc(WEAPONS[p.weapon]?.name || p.weapon)}</b><em>${esc(weaponNames.join(' · ') || 'Pedang Sumpah')}</em></div>
        <div class="loadout-cell"><span>AMUNISI</span><b>${p.arrows || 0} panah · ${p.shurikens || 0} shuriken</b><em>flask ${p.flasks}/${p.maxFlasks}</em></div>
        <div class="loadout-cell"><span>ALAT COURT</span><b>${esc(courtTools.join(' · ') || '—')}</b><em>${progress.court?.equippedWeapon ? `senjata ${esc(COURT_WEAPON_BY_ID[progress.court.equippedWeapon]?.name || progress.court.equippedWeapon)}` : 'loadout kampanye'}</em></div>
      </div>`;
  }

  const bindingWrap = $('inventory-bindings');
  if (bindingWrap) {
    bindingWrap.innerHTML = `
      <h3>KEYBIND AKTIF</h3>
      <div class="binding-mini-grid">
        ${ACTIONS.map((action) => {
          const codes = settings.bindings[action.id] || [];
          return `<div class="binding-mini-row"><span>${esc(action.label)}</span><span><kbd>${formatCode(codes[0])}</kbd>${codes[1] ? ` <kbd>${formatCode(codes[1])}</kbd>` : ''}</span></div>`;
        }).join('')}
      </div>
      <button class="btn btn-ghost btn-small" type="button" data-inventory-controls>ATUR KEYBIND</button>`;
    bindingWrap.querySelector('[data-inventory-controls]').addEventListener('click', () => {
      inventoryOpen = false;
      settingsOpen = true;
      settingsTab = 'controls';
      buildSettings();
      syncScreens();
    });
  }

  wrap.querySelectorAll('[data-use-item]').forEach((btn) => {
    btn.addEventListener('click', () => useInventoryItem(btn.dataset.useItem));
  });
}

function useInventoryItem(id) {
  const result = game.useItem(id);
  if (result.ok) syncHunterFromGame();
  if (!result.ok) {
    showToast(result.reason, 1600);
    return;
  }
  showToast(`Dipakai: ${result.item.name}`, 1500);
  buildInventory();
  updateHud();
}

function openInventory() {
  if (dialogueOpen || spectating || settingsOpen) return;
  inventoryOpen = true;
  mapOpen = false;
  codexOpen = false;
  clearHeldKeys();
  buildInventory();
  syncScreens();
}

function closeInventory() {
  if (!inventoryOpen) return;
  inventoryOpen = false;
  lastTime = performance.now();
  accumulator = 0;
  syncScreens();
  updateHud();
}

function toggleInventory() {
  if (inventoryOpen) closeInventory();
  else openInventory();
}

// ── settings UI ──────────────────────────────────────────────────────────
function detectCapabilities() {
  if (capabilityCache) return capabilityCache;
  let hdr = false;
  let p3 = false;
  let outputDevice = false;
  try {
    hdr = window.matchMedia?.('(dynamic-range: high)')?.matches || false;
    p3 = window.matchMedia?.('(color-gamut: p3)')?.matches || false;
  } catch { /* unsupported media query */ }
  try {
    const probe = document.createElement('canvas').getContext('2d');
    if (probe) probe.drawingBufferColorSpace = 'display-p3';
    hdr = hdr && probe?.drawingBufferColorSpace === 'display-p3';
  } catch { hdr = false; }
  try { outputDevice = typeof AudioContext !== 'undefined' && 'setSinkId' in AudioContext.prototype; } catch { outputDevice = false; }
  // Real adapter/extension probe. Unsupported features stay false and are
  // reported by the diagnostics panel instead of being simulated.
  const gpu = probeCapabilities();
  capabilityCache = {
    hdr,
    p3,
    outputDevice,
    rayTracing: gpu.rayTracing,
    fullscreen: Boolean(document.fullscreenEnabled),
    webgl2: gpu.webgl2,
    gpuRenderer: gpu.renderer,
    gpuVendor: gpu.vendor,
    gpuTier: gpu.adapterTier,
    hdrRenderTarget: gpu.hdrRenderTarget,
    maxAnisotropy: gpu.maxAnisotropy,
    msaa: gpu.msaa,
    timerQuery: gpu.timerQuery,
  };
  return capabilityCache;
}

const LANGUAGE_SHELL = {
  id: { settings: 'PENGATURAN', apply: 'TERAPKAN', cancel: 'BATAL', search: 'Cari pengaturan atau deskripsi…' },
  en: { settings: 'SETTINGS', apply: 'APPLY', cancel: 'CANCEL', search: 'Search settings or descriptions…' },
  ja: { settings: '設定', apply: '適用', cancel: 'キャンセル', search: '設定を検索…' },
  ko: { settings: '설정', apply: '적용', cancel: '취소', search: '설정 검색…' },
  'zh-cn': { settings: '设置', apply: '应用', cancel: '取消', search: '搜索设置…' },
  'zh-tw': { settings: '設定', apply: '套用', cancel: '取消', search: '搜尋設定…' },
  es: { settings: 'AJUSTES', apply: 'APLICAR', cancel: 'CANCELAR', search: 'Buscar ajustes…' },
  fr: { settings: 'PARAMÈTRES', apply: 'APPLIQUER', cancel: 'ANNULER', search: 'Rechercher un paramètre…' },
  de: { settings: 'EINSTELLUNGEN', apply: 'ANWENDEN', cancel: 'ABBRECHEN', search: 'Einstellungen suchen…' },
  pt: { settings: 'CONFIGURAÇÕES', apply: 'APLICAR', cancel: 'CANCELAR', search: 'Pesquisar configurações…' },
  ru: { settings: 'НАСТРОЙКИ', apply: 'ПРИМЕНИТЬ', cancel: 'ОТМЕНА', search: 'Поиск настроек…' },
  ar: { settings: 'الإعدادات', apply: 'تطبيق', cancel: 'إلغاء', search: 'ابحث في الإعدادات…' },
  th: { settings: 'การตั้งค่า', apply: 'ใช้งาน', cancel: 'ยกเลิก', search: 'ค้นหาการตั้งค่า…' },
  vi: { settings: 'CÀI ĐẶT', apply: 'ÁP DỤNG', cancel: 'HỦY', search: 'Tìm cài đặt…' },
};

function applyLanguage() {
  const language = LANGUAGE_BY_ID[settings.language.interface] || LANGUAGE_BY_ID.id;
  const shell = LANGUAGE_SHELL[language.id] || LANGUAGE_SHELL.id;
  document.documentElement.lang = language.id;
  document.documentElement.dir = language.rtl ? 'rtl' : 'ltr';
  const title = $('settings-title');
  if (title) title.textContent = shell.settings;
  const apply = $('btn-settings-apply');
  if (apply) apply.querySelector('span').textContent = shell.apply;
  const cancel = $('btn-settings-cancel');
  if (cancel) cancel.querySelector('span').textContent = shell.cancel;
  const search = $('settings-search');
  if (search) search.placeholder = shell.search;
  document.body.classList.toggle('rtl', language.rtl);
}

function graphicsScore() {
  const steps = { off: 0, low: 1, medium: 2, high: 3, ultra: 4 };
  const values = [settings.graphics.textureQuality, settings.graphics.lightingQuality, settings.graphics.shadowQuality, settings.graphics.foliageQuality, settings.graphics.postProcessing];
  const sum = values.reduce((total, value) => total + (steps[value] ?? 2), 0);
  return Math.round((sum / (values.length * 4)) * 100);
}

let scareDirector = null;
let aiDebugOpen = false;
let debugOpen = false;
let debugPanelGate = 0;

function applySettings({ persist = true } = {}) {
  const capabilities = detectCapabilities();
  // Spatial audio is a real WebAudio listener/panner mode, not a label.
  audio.setSpatial(settings.audio.spatial);
  // Push the graphics controls that the WebGL2 pipeline actually consumes.
  configure3D({
    renderScale: settings.graphics.renderScale,
    upscaling: settings.graphics.upscaling,
    upscaler: settings.graphics.upscaling,
    hdr: settings.graphics.hdr,
    aa: settings.graphics.antiAliasing,
    shadowQuality: settings.graphics.shadowQuality,
    anisotropic: settings.graphics.anisotropicFiltering,
    brightness: settings.graphics.brightness,
    contrast: settings.graphics.contrast,
    gamma: settings.graphics.gamma,
    dynamicResolution: settings.performance.dynamicResolution,
    viewDistance: settings.performance.viewDistance3d,
  });
  audio.applyVolumes({
    master: settings.audio.master / 100,
    music: settings.audio.music / 100,
    sfx: settings.audio.sfx / 100,
    ambient: settings.audio.ambient / 100,
    dialogue: settings.audio.dialogue / 100,
    combat: settings.audio.combat / 100,
    ui: settings.audio.ui / 100,
    footsteps: settings.audio.footsteps / 100,
    voiceChat: settings.audio.voiceChat / 100,
    cinematic: settings.audio.cinematic / 100,
    muted: settings.audio.muted,
    channelMutes: settings.audio.channelMutes,
    dynamicRange: settings.audio.dynamicRange,
    reduceLoudSfx: settings.audio.reduceLoudSfx,
  });
  music.setVolume(1);
  if (!scareDirector) scareDirector = new ScareDirector(settings.scary || {}, { seed: 20261119 });
  scareDirector.configure(settings.scary || {}, settings.accessibility);
  const particleMap = { low: 0.4, medium: 0.7, high: 1, ultra: 1.4 };
  const particleScale = particleMap[settings.graphics.particleQuality] ?? 1;
  const particleMultiplier = Math.max(0.5, Math.min(4, Number(settings.graphics.particleMultiplier ?? 1)));
  const bias = graphicsScore();
  renderer.options = {
    shakeScale: settings.accessibility.reduceShake
      ? 0
      : settings.gameplay.screenShake === 'off' ? 0 : settings.gameplay.screenShake === 'low' ? 0.45 : 1,
    reduceFlashing: settings.accessibility.reduceFlashing,
    highContrast: settings.accessibility.highContrast,
    colorblind: settings.accessibility.colorblind !== 'off',
    antiAliasing: settings.graphics.antiAliasing !== 'off',
    fov: settings.gameplay.fov,
    renderDistance: settings.gameplay.renderDistance,
    qualityBias: bias,
    particleScale,
    particleMultiplier,
    resolutionScale: (settings.graphics.renderScale / 100) * (settings.display.resolutionScaling / 100),
    gamma: settings.graphics.gamma / 100,
  };
  renderer.resize();
  const root = document.documentElement;
  root.classList.toggle('text-large', settings.accessibility.textSize === 'large' || settings.accessibility.textSize === 'xlarge');
  root.classList.toggle('text-xlarge', settings.accessibility.textSize === 'xlarge');
  root.classList.toggle('reduce-flashing', settings.accessibility.reduceFlashing);
  root.classList.toggle('high-contrast', settings.accessibility.highContrast);
  root.classList.toggle('colorblind', settings.accessibility.colorblind !== 'off');
  root.classList.toggle('reduce-motion', settings.accessibility.reduceCameraMotion);
  root.className = root.className.replace(/colorblind-(protanopia|deuteranopia|tritanopia)/g, '').trim();
  if (['protanopia', 'deuteranopia', 'tritanopia'].includes(settings.accessibility.colorblind)) {
    root.classList.add(`colorblind-${settings.accessibility.colorblind}`);
  }
  root.style.setProperty('--ui-scale', String(settings.display.uiScale / 100));
  root.style.setProperty('--hud-scale', String(settings.hud.scale / 100));
  root.style.setProperty('--hud-opacity', String(settings.hud.opacity / 100));
  root.style.setProperty('--safe-area', `${settings.display.safeArea}%`);
  root.style.setProperty('--subtitle-bg', String(settings.accessibility.subtitleBackground / 100));
  canvas.style.filter = `url(#ashen-gamma) brightness(${settings.graphics.brightness}%) contrast(${settings.graphics.contrast}%)`;
  const exponent = String(1 / Math.max(0.5, settings.graphics.gamma / 100));
  for (const id of ['gamma-r', 'gamma-g', 'gamma-b']) {
    const node = $(id);
    if (node) node.setAttribute('exponent', exponent);
  }
  canvas.dataset.hdr = capabilities.hdr && settings.graphics.hdr !== 'off' ? 'on' : 'off';
  try {
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawingBufferColorSpace = capabilities.p3 ? 'display-p3' : 'srgb';
  } catch { /* colour space unsupported */ }
  settings.gameplay.frameCap = settings.graphics.frameRateLimit;
  settings.gameplay.graphicsPreset = settings.graphics.preset;
  settings.gameplay.resolutionScale = settings.graphics.renderScale / 100;
  const hud = $('hud');
  if (hud) {
    hud.classList.toggle('hud-hide-health', !settings.hud.showHealth);
    hud.classList.toggle('hud-hide-stamina', !settings.hud.showStamina);
    hud.classList.toggle('hud-hide-mana', !settings.hud.showMana);
    hud.classList.toggle('hud-hide-boss', !settings.hud.showBoss);
    hud.classList.toggle('hud-hide-quest', !settings.hud.showQuest);
    hud.classList.toggle('hud-hide-map', !settings.hud.showMinimap);
    hud.classList.toggle('hud-hide-prompts', !settings.hud.showPrompts);
    hud.dataset.position = settings.hud.position;
  }
  if (game3D) {
    game3D.quality = settings.graphics.preset === 'extreme' ? 'ultra' : settings.graphics.preset;
    game3D.visualSettings = settings.graphics;
    game3D.hudSettings = settings.hud;
    game3D.cameraSensitivity = settings.controls.cameraSensitivity / 100;
    game3D.region = MODE3D_REGIONS[game3D.region] ? game3D.region : 'thornveil';
  }
  applyLanguage();
  const btn = $('sound-btn');
  if (btn) {
    btn.classList.toggle('muted', settings.audio.muted);
    btn.setAttribute('aria-pressed', String(settings.audio.muted));
    btn.textContent = settings.audio.muted ? '∅' : '♪';
    btn.title = settings.audio.muted ? 'Suara mati (N)' : 'Suara aktif (N)';
  }
  const fps = $('fps-badge');
  if (fps) fps.classList.toggle('hidden', !(settings.display.showFps || settings.gameplay.fpsCounter));
  applyHudLayout();
  try {
    if (settings.display.mode === 'fullscreen' && !document.fullscreenElement && document.fullscreenEnabled) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (settings.display.mode !== 'fullscreen' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  } catch { /* fullscreen requires a user gesture or is unsupported */ }
  if (persist) {
    saveSettings(settingsStore, settings);
    settingsApplyState = 'saved';
  } else {
    settingsApplyState = 'pending';
  }
  const state = $('settings-apply-state');
  if (state) state.textContent = settingsApplyState === 'pending' ? 'BELUM DITERAPKAN' : 'TERSIMPAN';
}

function settingUnsupported(def) {
  const caps = detectCapabilities();
  if (def.path === 'graphics.rayTracing') return !caps.rayTracing;
  if (def.path === 'graphics.upscaling') return !caps.webgl2;
  if (def.path === 'graphics.anisotropicFiltering') return !caps.webgl2 || (caps.maxAnisotropy || 1) <= 1;
  if (def.path === 'graphics.hdr' && settings.graphics.hdr !== 'off') return !caps.hdr;
  if (def.path === 'graphics.hdrCalibration') return !caps.hdr || settings.graphics.hdr === 'off';
  if (def.path === 'audio.outputDevice') return !caps.outputDevice;
  if (def.path === 'display.monitor') return true;
  if (def.path === 'account.cloudSave') return true;
  return false;
}

function settingValueText(def, value) {
  if (def.type === 'toggle') return value ? 'AKTIF' : 'MATI';
  if (def.type === 'select') return def.options.find((option) => option.id === String(value))?.label || String(value);
  return `${value}${def.suffix || ''}`;
}

function settingControl(def) {
  const value = getSettingsValue(settings, def.path);
  const unsupported = settingUnsupported(def);
  const id = `set-${def.path.replace(/\./g, '-')}`;
  if (def.type === 'toggle') {
    return `<label class="settings-toggle settings2-toggle"><input id="${id}" type="checkbox" data-setting-path="${def.path}" ${value ? 'checked' : ''} ${unsupported ? 'disabled' : ''}/><span>${value ? 'AKTIF' : 'MATI'}</span></label>`;
  }
  if (def.type === 'select') {
    return `<select id="${id}" data-setting-path="${def.path}" ${unsupported ? 'disabled' : ''}>${def.options.map((option) => `<option value="${option.id}" ${String(value) === String(option.id) ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select>`;
  }
  return `<span class="settings2-range-wrap"><input id="${id}" type="range" min="${def.min}" max="${def.max}" step="${def.step}" value="${value}" data-setting-path="${def.path}" ${unsupported ? 'disabled' : ''}/><b data-setting-value="${def.path}">${settingValueText(def, value)}</b></span>`;
}

function settingRow(def) {
  const unsupported = settingUnsupported(def);
  return `<div class="settings2-row${unsupported ? ' unsupported' : ''}" data-setting-row="${def.path}">
    <div class="settings2-copy"><label for="set-${def.path.replace(/\./g, '-')}">${esc(def.label)}</label><p>${esc(def.desc)}</p></div>
    ${settingControl(def)}
    <span class="settings2-status">${unsupported ? 'TIDAK DIDUKUNG' : def.type === 'range' ? 'LIVE' : 'SIAP'}</span>
  </div>`;
}

function graphicsPreview() {
  const preset = settings.graphics.preset;
  const rows = ['shadowQuality', 'textureQuality', 'lightingQuality', 'particleQuality', 'postProcessing', 'renderScale'];
  return `<div class="settings2-preview"><div class="settings2-preview-head"><b>PRATINJAU PRESET</b><em>${esc((GRAPHICS_PRESETS[preset] || GRAPHICS_PRESETS.custom).tagline || 'Custom')}</em></div>
    <div class="settings2-compare">${rows.map((key) => {
      const current = getSettingsValue(settings, `graphics.${key}`);
      return `<span><b>${key}</b><em>${String(current)}</em></span>`;
    }).join('')}</div></div>`;
}

function difficultyCards() {
  return `<div class="settings2-difficulty-grid">${CAMPAIGN_DIFFICULTIES.map((entry) => {
    const unlocked = difficultyUnlocked(entry.id, progress);
    return `<button type="button" class="settings2-difficulty${settings.gameplay.difficulty === entry.id ? ' active' : ''}" data-difficulty-choice="${entry.id}" ${unlocked ? '' : 'disabled'}>
      <span>${esc(entry.tag)}</span><strong>${esc(entry.name)}</strong><em>${esc(entry.desc)}</em>
      <small>DMG ×${entry.enemyDamage.toFixed(2)} · HP ×${entry.enemyHp.toFixed(2)} · DETEKSI ×${entry.detection.toFixed(2)} · AGRO ×${entry.aggression.toFixed(2)}</small>
      ${unlocked ? '' : '<i>TERKUNCI · selesaikan 3 ruang atau kampanye Eclipse</i>'}
    </button>`;
  }).join('')}</div>${difficultyWarning(settings.gameplay.difficulty) ? `<p class="settings2-warning">${esc(difficultyWarning(settings.gameplay.difficulty))}</p>` : ''}`;
}

function bindTable() {
  const conflict = settingsConflict ? `<div class="bind-conflict"><span><b>${formatCode(settingsConflict.code)}</b> sudah dipakai oleh <b>${ACTIONS.find((a) => a.id === settingsConflict.other)?.label || settingsConflict.other}</b>.</span><button type="button" data-conflict="swap">TUKAR</button><button type="button" data-conflict="cancel">BATAL</button></div>` : '';
  return `${conflict}<div class="settings2-binding-table"><table class="bind-table"><thead><tr><th>AKSI</th><th>UTAMA</th><th>ALTERNATIF</th><th>GAMEPAD</th><th></th></tr></thead><tbody>${ACTIONS.map((action) => {
    const codes = settings.bindings[action.id] || [];
    const cell = (slot) => {
      const capturing = settingsCapture && settingsCapture.action === action.id && settingsCapture.slot === slot;
      return `<button class="bind-btn${capturing ? ' capturing' : ''}" type="button" data-bind-action="${action.id}" data-slot="${slot}">${capturing ? 'TEKAN…' : formatCode(codes[slot] || '')}</button>`;
    };
    return `<tr><td>${action.label}</td><td>${cell(0)}</td><td>${cell(1)}</td><td>${action.gamepad}</td><td><button class="bind-reset" type="button" data-reset-action="${action.id}">↺</button></td></tr>`;
  }).join('')}</tbody></table></div><div class="settings-actions"><button class="btn btn-ghost btn-small" type="button" data-reset-all-bindings>RESET SEMUA KEYBIND</button></div>`;
}

function buildSettings() {
  const tabs = $('settings-tabs');
  const body = $('settings-body');
  if (!tabs || !body) return;
  const results = settingsSearch.trim() ? searchSettings(settingsSearch) : null;
  tabs.innerHTML = SETTINGS_CATEGORIES.map((tab) => `<button class="settings-tab${settingsTab === tab.id && !results ? ' active' : ''}" type="button" role="tab" aria-selected="${settingsTab === tab.id && !results}" data-settings-tab="${tab.id}"><span>${tab.icon}</span>${tab.label}</button>`).join('');
  tabs.querySelectorAll('[data-settings-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      settingsTab = btn.dataset.settingsTab;
      settingsSearch = '';
      const input = $('settings-search');
      if (input) input.value = '';
      settingsCapture = null;
      settingsConflict = null;
      buildSettings();
    });
  });
  const category = SETTINGS_CATEGORIES.find((entry) => entry.id === settingsTab) || SETTINGS_CATEGORIES[0];
  const defs = results || settingsForCategory(settingsTab);
  const groups = new Map();
  for (const def of defs) {
    if (!groups.has(def.category)) groups.set(def.category, []);
    groups.get(def.category).push(def);
  }
  body.innerHTML = `
    ${results ? `<div class="settings2-results-head"><b>${results.length} HASIL</b><span>untuk “${esc(settingsSearch)}”</span></div>` : `<div class="settings2-category-head"><span>${category.icon}</span><div><b>${category.label}</b><p>${category.desc}</p></div></div>`}
    ${settingsTab === 'difficulty' && !results ? difficultyCards() : ''}
    ${settingsTab === 'graphics' && !results ? graphicsPreview() : ''}
    ${settingsTab === 'audio' && !results ? `<div class="settings2-audio-test"><button class="btn btn-ghost btn-small" type="button" data-audio-test="master">TES MASTER</button><button class="btn btn-ghost btn-small" type="button" data-audio-test="music">TES MUSIK</button><button class="btn btn-ghost btn-small" type="button" data-audio-test="sfx">TES SFX</button><button class="btn btn-ghost btn-small" type="button" data-audio-test="dialogue">TES DIALOG</button></div>` : ''}
    ${settingsTab === 'interface' && !results ? `<div class="settings2-hud-tools"><button class="btn btn-ghost btn-small" type="button" data-open-hud-layout>HUD LAYOUT EDITOR</button><span>Drag-and-drop · simpan per profil</span></div>` : ''}
    ${[...groups.entries()].map(([categoryId, list]) => `<section class="settings2-group"><h3>${SETTINGS_CATEGORIES.find((entry) => entry.id === categoryId)?.label || categoryId}</h3>${list.map(settingRow).join('')}</section>`).join('')}
    ${settingsTab === 'controls' && !results ? bindTable() : ''}
    <p class="settings2-note">${settingsTab === 'language' ? 'Voice hanya tersedia untuk bahasa yang memiliki aset suara; label (teks) menandai fallback subtitle. Arab mengaktifkan tata letak RTL.' : 'Pengaturan disimpan di ashen-vow-settings-v1 dan terpisah dari progres permainan.'}</p>`;

  const search = $('settings-search');
  if (search) {
    search.value = settingsSearch;
    if (document.activeElement !== search) search.addEventListener('input', () => {
      settingsSearch = search.value;
      clearTimeout(search._settingsTimer);
      search._settingsTimer = setTimeout(() => {
        buildSettings();
        const next = $('settings-search');
        if (next) { next.focus(); next.setSelectionRange(next.value.length, next.value.length); }
      }, 120);
    });
  }
  body.querySelectorAll('[data-setting-path]').forEach((input) => {
    input.addEventListener('input', () => {
      const def = SETTING_BY_PATH[input.dataset.settingPath];
      if (!def) return;
      let value = input.type === 'checkbox' ? input.checked : input.value;
      if (def.numeric || def.type === 'range') value = Number(value);
      setSettingsValue(settings, def.path, value);
      if (def.path.startsWith('graphics.') && def.path !== 'graphics.preset') {
        settings.graphics.preset = 'custom';
        markGraphicsCustom(settings);
      }
      if (def.path === 'graphics.preset') applyGraphicsPreset(settings, input.value);
      if (def.path === 'gameplay.difficulty' && game3D) game3D.setDifficulty?.(input.value);
      if (def.path === 'gameplay.difficulty' && game.setDifficulty) game.setDifficulty(input.value);
      const valueEl = body.querySelector(`[data-setting-value="${def.path}"]`);
      if (valueEl) valueEl.textContent = settingValueText(def, getSettingsValue(settings, def.path));
      if (input.type === 'checkbox') input.nextElementSibling.textContent = input.checked ? 'AKTIF' : 'MATI';
      applySettings({ persist: false });
    });
    input.addEventListener('change', () => {
      if (input.dataset.settingPath === 'language.interface') applyLanguage();
      buildSettings();
    });
  });
  body.querySelectorAll('[data-difficulty-choice]').forEach((btn) => {
    btn.addEventListener('click', () => {
      settings.gameplay.difficulty = btn.dataset.difficultyChoice;
      game.setDifficulty(settings.gameplay.difficulty);
      applySettings({ persist: false });
      buildSettings();
    });
  });
  body.querySelectorAll('[data-audio-test]').forEach((btn) => btn.addEventListener('click', () => {
    const channel = btn.dataset.audioTest;
    audio.init();
    audio.testTone(channel === 'master' ? 'master' : channel);
    showToast(`Tes audio: ${AUDIO_CHANNELS.find((entry) => entry.id === channel)?.label || channel}`, 1200);
  }));
  body.querySelectorAll('[data-open-hud-layout]').forEach((btn) => btn.addEventListener('click', openHudLayout));
  body.querySelectorAll('[data-bind-action]').forEach((btn) => btn.addEventListener('click', () => {
    settingsConflict = null;
    settingsCapture = { action: btn.dataset.bindAction, slot: Number(btn.dataset.slot) };
    buildSettings();
  }));
  body.querySelectorAll('[data-reset-action]').forEach((btn) => btn.addEventListener('click', () => {
    settings = resetActionBindings(settings, btn.dataset.resetAction);
    settingsCapture = null; settingsConflict = null;
    applySettings({ persist: false }); buildSettings();
  }));
  body.querySelectorAll('[data-reset-all-bindings]').forEach((btn) => btn.addEventListener('click', () => {
    settings = resetAllBindings(settings);
    applySettings({ persist: false }); buildSettings();
  }));
  body.querySelectorAll('[data-conflict]').forEach((btn) => btn.addEventListener('click', () => {
    if (btn.dataset.conflict === 'swap' && settingsConflict) settings = applyBinding(settings, settingsConflict.action, settingsConflict.slot, settingsConflict.code).settings;
    settingsConflict = null; settingsCapture = null;
    applySettings({ persist: false }); buildSettings();
  }));
  buildDiagnostics();
  applyLanguage();
}

function buildDiagnostics() {
  const panel = $('settings-diagnostics');
  if (!panel) return;
  panel.classList.toggle('hidden', !settingsDiagnosticsOpen);
  if (!settingsDiagnosticsOpen) return;
  const caps = detectCapabilities();
  const rows = [
    ['Brightness / Contrast / Gamma', 'applied', 'Canvas colour transfer (gamma SVG + CSS)'],
    ['HDR', caps.hdrRenderTarget ? 'applied' : caps.hdr ? 'partial' : 'unsupported', caps.hdrRenderTarget ? 'RGBA16F render target + ACES tonemap' : 'Display HDR terdeteksi tetapi render target float tidak tersedia'],
    ['Ray Tracing', 'unsupported', 'WebGL2 tidak menyediakan pipeline ray tracing perangkat keras'],
    ['3D pipeline', gfx3DStatus().state === 'ready' ? 'applied' : 'ready', gfx3DStatus().available ? `WebGL2 + GLB · ${gfx3DStatus().models} model · ${gfx3DStatus().props} prop` : `Fallback Canvas (${gfx3DStatus().reason || gfx3DStatus().state})`],
    ['GPU', caps.gpuRenderer ? 'applied' : 'unsupported', caps.gpuRenderer ? `${caps.gpuRenderer}${caps.gpuTier ? ` · ${caps.gpuTier}` : ''}` : 'Identitas GPU tidak tersedia'],
    ['Anisotropic', caps.maxAnisotropy > 1 ? 'applied' : 'unsupported', caps.maxAnisotropy > 1 ? `maksimum ${caps.maxAnisotropy}×` : 'Ekstensi aniso tidak tersedia'],
    ['Spatial audio', settings.audio.spatial === 'stereo' ? 'off' : 'applied', settings.audio.spatial === 'spatial' ? 'HRTF PannerNode + listener' : settings.audio.spatial === 'surround' ? 'Equal-power panner + listener' : 'Mix stereo non-posisional'],
    ['Anti-Aliasing', settings.graphics.antiAliasing === 'off' ? 'off' : 'applied', 'Canvas smoothing + 3D line detail'],
    ['Audio buses', 'applied', `${AUDIO_CHANNELS.length} bus independen`],
    ['Output device', caps.outputDevice ? 'applied' : 'unsupported', caps.outputDevice ? 'AudioContext.setSinkId tersedia' : 'Browser tidak menyediakan pemilihan output'],
    ['Language', 'applied', `${LANGUAGE_BY_ID[settings.language.interface]?.name || 'Indonesia'} · dir ${document.documentElement.dir}`],
    ['HUD layout', settings.hud.position === 'custom' ? 'applied' : 'ready', 'HUD Layout Editor'],
    ['Frame limit', 'applied', settings.graphics.frameRateLimit ? `${settings.graphics.frameRateLimit} FPS` : 'Unlimited'],
    ['Cloud save', 'unsupported', 'Tidak ada layanan cloud pada build lokal'],
  ];
  const stateLabels = { applied: 'DITERAPKAN', unsupported: 'TIDAK DIDUKUNG', ready: 'SIAP', off: 'MATI', pending: 'MENUNGGU APPLY' };
  panel.innerHTML = `<div class="settings-diag-head"><b>DIAGNOSTIK PENERAPAN</b><span>${settingsApplyState === 'pending' ? 'MENUNGGU APPLY' : 'TERSIMPAN'}</span></div>${rows.map(([label, state, detail]) => `<div class="settings-diag-row ${state}"><b>${label}</b><span>${stateLabels[state] || state.toUpperCase()}</span><em>${detail}</em></div>`).join('')}`;
}

function hudLayoutTargets() {
  return {
    vitals: document.querySelector('.vitals'),
    map: document.querySelector('.hud-right'),
    notifications: $('toast'),
    quest: document.querySelector('.hud-right'),
    boss: null,
  };
}

function applyHudLayout() {
  const layout = settings.hud.layout || {};
  const targets = hudLayoutTargets();
  for (const [id, entry] of Object.entries(layout)) {
    const el = targets[id];
    if (!el || !entry) continue;
    el.style.transform = `translate(${entry.x || 0}px, ${entry.y || 0}px)`;
  }
  const hud = $('hud');
  if (hud) {
    hud.classList.toggle('hud-layout-compact', settings.hud.position === 'compact');
    hud.classList.toggle('hud-layout-split', settings.hud.position === 'split');
    hud.classList.toggle('hud-layout-custom', settings.hud.position === 'custom');
  }
}

function buildHudLayoutEditor() {
  const stage = $('hud-layout-stage');
  if (!stage) return;
  const layout = settings.hud.layout || {};
  stage.querySelectorAll('[data-hud-drag]').forEach((el) => {
    const id = el.dataset.hudDrag;
    const entry = layout[id] || { x: el.offsetLeft || 0, y: el.offsetTop || 0 };
    el.style.left = `${entry.x || 0}px`;
    el.style.top = `${entry.y || 0}px`;
    el.style.transform = 'none';
  });
}

function openHudLayout() {
  hudLayoutOpen = true;
  settingsOpen = false;
  buildHudLayoutEditor();
  syncScreens();
}

function installHudLayoutDrag() {
  const stage = $('hud-layout-stage');
  if (!stage) return;
  let drag = null;
  stage.addEventListener('pointerdown', (event) => {
    const el = event.target.closest('[data-hud-drag]');
    if (!el) return;
    drag = { el, id: el.dataset.hudDrag, startX: event.clientX, startY: event.clientY, x: el.offsetLeft, y: el.offsetTop };
    el.setPointerCapture?.(event.pointerId);
  });
  stage.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const maxX = stage.clientWidth - drag.el.offsetWidth;
    const maxY = stage.clientHeight - drag.el.offsetHeight;
    const x = clamp(drag.x + event.clientX - drag.startX, 0, maxX);
    const y = clamp(drag.y + event.clientY - drag.startY, 0, maxY);
    drag.el.style.left = `${x}px`;
    drag.el.style.top = `${y}px`;
  });
  const finish = () => {
    if (!drag) return;
    settings.hud.layout[drag.id] = { x: drag.el.offsetLeft, y: drag.el.offsetTop };
    settings.hud.position = 'custom';
    applyHudLayout();
    drag = null;
  };
  stage.addEventListener('pointerup', finish);
  stage.addEventListener('pointercancel', finish);
}
installHudLayoutDrag();

function settingsSliderRow(key, label, value) {
  return `
    <div class="settings-row">
      <label for="set-audio-${key}">${label}</label>
      <input id="set-audio-${key}" type="range" min="0" max="100" step="1" value="${value}" data-audio="${key}" />
      <span class="settings-value" data-audio-value="${key}">${value}</span>
    </div>`;
}

function settingsRangeRow(kind, key, label, value, min, max, step, suffix = '') {
  return `
    <div class="settings-row">
      <label for="set-${kind}-${key}">${label}</label>
      <input id="set-${kind}-${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-${kind}-range="${key}" />
      <span class="settings-value" data-${kind}-value="${key}">${value}${suffix}</span>
    </div>`;
}

function settingsCheckboxRow(kind, key, label, checked, hint = '') {
  return `
    <div class="settings-row">
      <span class="settings-label">${label}</span>
      <label class="settings-toggle"><input type="checkbox" data-${kind}="${key}" ${checked ? 'checked' : ''} /> ${checked ? 'AKTIF' : 'MATI'}</label>
      ${hint ? `<span class="settings-hint">${hint}</span>` : '<span></span>'}
    </div>`;
}

function handleCapturedKey(code) {
  if (!settingsCapture) return;
  const { action, slot } = settingsCapture;
  const conflict = findConflict(settings, action, code);
  if (conflict) {
    settingsConflict = { action, slot, code, other: conflict.action, otherSlot: conflict.slot };
    settingsCapture = null;
    buildSettings();
    return;
  }
  const result = applyBinding(settings, action, slot, code);
  settings = result.settings;
  settingsCapture = null;
  applySettings();
  buildSettings();
  showToast(`Binding: ${ACTIONS.find((a) => a.id === action)?.label || action} → ${formatCode(code)}`, 1600);
}

// ── boss dialogue ────────────────────────────────────────────────────────
const DIALOGUE_PHASE_LABEL = {
  intro: 'PERTEMPURAN DIMULAI',
  phase2: 'FASE II',
  phase3: 'FASE III',
  phase4: 'FASE IV',
  phase5: 'FASE V',
  defeat: 'AKHIR PERTEMPURAN',
};

function queueDialogue(ev) {
  if (!ev?.lines?.length) return;
  dialogueLines = ev.lines.map((line) => ({ ...line }));
  dialogueIndex = 0;
  dialogueMeta = ev;
  dialogueOpen = true;
  clearHeldKeys();
  renderDialogue();
  speakDialogueLine();
  syncScreens();
}

// ── Boss voice ────────────────────────────────────────────────────────────
// Boss lines never use plain text-to-speech. Order: a human recording listed
// in assets/voice/manifest.json (processed by the boss's archetype chain),
// then AI speech only if the player allowed it (always processed), then a
// wordless cinematic vocal sting under the subtitle. See src/boss_voice.js.
const BOSS_VOICE_KEY = 'ashen-vow-bossvoice-v1';
let bossVoiceSettings = (() => {
  try {
    return sanitizeBossVoiceSettings(JSON.parse(localStorage.getItem(BOSS_VOICE_KEY) || 'null'));
  } catch {
    return sanitizeBossVoiceSettings(null);
  }
})();
let bossVoiceRecorded = new Set();
let bossVoicePaths = {};
let bossVoiceFx = null;
let bossVoiceHandle = null;
let bossVoiceToken = 0;
let bossVoiceLast = { source: 'none', id: null, archetype: null, error: '' };
const bossVoiceBuffers = new Map();

function saveBossVoiceSettings() {
  try {
    localStorage.setItem(BOSS_VOICE_KEY, JSON.stringify(bossVoiceSettings));
  } catch {
    /* storage unavailable */
  }
  updateBossVoiceButton();
}

async function loadBossVoiceManifest() {
  try {
    const res = await fetch('assets/voice/manifest.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(String(res.status));
    const manifest = sanitizeVoiceManifest(await res.json());
    bossVoiceRecorded = new Set(manifest.files);
    bossVoicePaths = manifest.paths;
  } catch {
    bossVoiceRecorded = new Set();
  }
  return bossVoiceRecorded.size;
}

function ensureBossVoiceFx() {
  audio.init();
  if (!audio.ctx) return null;
  if (!bossVoiceFx || bossVoiceFx.ctx !== audio.ctx) bossVoiceFx = new VoiceFX(audio.ctx, audio.busFor('dialogue'));
  return bossVoiceFx;
}

function stopBossVoice() {
  bossVoiceToken += 1;
  bossVoiceHandle?.stop();
  bossVoiceHandle = null;
}

async function decodeVoice(arrayBuffer) {
  const ctx = audio.ctx;
  return await new Promise((resolve, reject) => {
    const p = ctx.decodeAudioData(arrayBuffer, resolve, reject);
    if (p && typeof p.then === 'function') p.then(resolve, reject);
  });
}

async function playBossLine(kind, key, index, line) {
  stopVoice();
  stopBossVoice();
  const token = bossVoiceToken;
  const fx = ensureBossVoiceFx();
  const row = bossVoiceLine(kind, key, index);
  const isPlayer = (line?.speaker || row?.speaker) === PLAYER_SPEAKER;
  const archetype = isPlayer ? 'hero' : row?.archetype || archetypeForBoss(kind);
  let source = resolveBossVoiceSource({
    settings: bossVoiceSettings,
    recorded: bossVoiceRecorded,
    kind,
    key,
    index,
    text: line?.text ?? null,
    aiConfigured: voiceStatus.configured,
    online: voiceStatus.online,
    voiceEnabled: voiceSave.enabled,
  });
  if (!fx) source = 'none';
  // The player's own lines get no sting: the boss owns the music of the scene.
  if (source === 'sting' && isPlayer) source = 'none';
  bossVoiceLast = { source, id: row?.id || null, archetype, error: '' };
  updateBossVoiceButton();
  if (source === 'none') return source;
  const volume = (voiceSave.volume / 100) * 1.1;
  try {
    if (source === 'recorded' || source === 'ai') {
      let buffer = source === 'recorded' ? bossVoiceBuffers.get(row.id) : null;
      if (!buffer) {
        const res = source === 'recorded'
          ? await fetch(bossVoicePaths[row.id] || row.file)
          : await fetch('/api/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(voiceRequestFor({ text: line.text, cast: VOICE_BOSS_CAST[kind] || 'narrator', save: voiceSave }).body),
          });
        if (!res.ok) throw new Error(`voice HTTP ${res.status}`);
        buffer = await decodeVoice(await res.arrayBuffer());
        if (source === 'recorded') bossVoiceBuffers.set(row.id, buffer);
        if (bossVoiceBuffers.size > 48) bossVoiceBuffers.delete(bossVoiceBuffers.keys().next().value);
      }
      if (token !== bossVoiceToken) return source;
      bossVoiceHandle = fx.play(buffer, archetype, { volume, processing: source === 'ai' ? true : bossVoiceSettings.processing });
    } else {
      bossVoiceHandle = fx.sting(archetype, key, { volume: volume * 0.8 });
    }
    voiceSave.linesPlayed += 1;
  } catch (error) {
    // A missing file or a failed request degrades to the sting, never to TTS.
    bossVoiceLast = { ...bossVoiceLast, source: 'sting', error: String(error.message || error) };
    if (token === bossVoiceToken && !isPlayer && bossVoiceSettings.stings) bossVoiceHandle = fx.sting(archetype, key, { volume: volume * 0.8 });
    updateBossVoiceButton();
    return 'sting';
  }
  return source;
}

const BOSS_VOICE_CYCLE = [
  { mode: 'recorded-first', allowAi: false, label: 'REKAMAN + STING' },
  { mode: 'recorded-first', allowAi: true, label: 'REKAMAN + AI (DIPROSES)' },
  { mode: 'stings-only', allowAi: false, label: 'STING SAJA' },
  { mode: 'off', allowAi: false, label: 'MATI' },
];

function bossVoiceModeLabel() {
  const entry = BOSS_VOICE_CYCLE.find((c) => c.mode === bossVoiceSettings.mode && c.allowAi === bossVoiceSettings.allowAi)
    || BOSS_VOICE_CYCLE.find((c) => c.mode === bossVoiceSettings.mode);
  return entry?.label || 'REKAMAN + STING';
}

function updateBossVoiceButton() {
  const btn = $('btn-dialogue-voice');
  if (!btn) return;
  btn.textContent = `${BOSS_VOICE_SOURCE_LABEL[bossVoiceLast.source] || 'SUARA'} · ${bossVoiceModeLabel()}`;
  btn.setAttribute('aria-label', `Suara boss: ${bossVoiceModeLabel()}. Klik untuk ganti.`);
}

function cycleBossVoiceMode() {
  const i = BOSS_VOICE_CYCLE.findIndex((c) => c.mode === bossVoiceSettings.mode && c.allowAi === bossVoiceSettings.allowAi);
  const next = BOSS_VOICE_CYCLE[(i + 1) % BOSS_VOICE_CYCLE.length];
  bossVoiceSettings = sanitizeBossVoiceSettings({ ...bossVoiceSettings, mode: next.mode, allowAi: next.allowAi });
  saveBossVoiceSettings();
  if (dialogueOpen) speakDialogueLine();
  return bossVoiceSettings;
}

$('btn-dialogue-voice')?.addEventListener('click', (event) => {
  event.stopPropagation();
  cycleBossVoiceMode();
});

function speakDialogueLine() {
  if (!dialogueOpen || !voiceSave.autoplayInDialogue) return;
  const line = dialogueLines[dialogueIndex];
  if (!line?.text) return;
  void playBossLine(dialogueMeta?.kind, dialogueMeta?.phase || 'intro', dialogueIndex, line);
}

function renderDialogue() {
  const screen = $('dialogue-screen');
  if (!screen) return;
  screen.classList.toggle('hidden', !dialogueOpen);
  if (!dialogueOpen) return;
  const line = dialogueLines[dialogueIndex];
  if (!line) {
    closeDialogue();
    return;
  }
  $('dialogue-phase').textContent = DIALOGUE_PHASE_LABEL[dialogueMeta?.phase] || 'SUMPAH';
  $('dialogue-name').textContent = dialogueMeta?.name || '';
  $('dialogue-speaker').textContent = line.speaker || dialogueMeta?.name || '';
  $('dialogue-line').textContent = line.text || '';
  $('dialogue-counter').textContent = `${dialogueIndex + 1} / ${dialogueLines.length}`;
  $('btn-dialogue-next').textContent = dialogueIndex >= dialogueLines.length - 1 ? 'LANJUTKAN' : 'LANJUT';
}

function advanceDialogue() {
  if (!dialogueOpen) return;
  dialogueIndex += 1;
  if (dialogueIndex >= dialogueLines.length) closeDialogue();
  else {
    renderDialogue();
    speakDialogueLine();
  }
}

function closeDialogue(silent = false) {
  const wasOpen = dialogueOpen;
  dialogueOpen = false;
  dialogueLines = [];
  dialogueIndex = 0;
  dialogueMeta = null;
  const screen = $('dialogue-screen');
  if (screen) screen.classList.add('hidden');
  if (!silent && wasOpen) {
    lastTime = performance.now();
    accumulator = 0;
    syncScreens();
    updateHud();
  }
  if (wasOpen) stopVoice();
}

// ── level select cards ───────────────────────────────────────────────────
function buildLevelCards() {
  const wrap = $('level-cards');
  wrap.innerHTML = '';
  ROOMS.forEach((room, i) => {
    const meta = LEVEL_META[i];
    const hidden = !!meta.secret && !progress.map.discovered[i];
    const locked = i >= progress.unlocked || hidden;
    const cleared = !!progress.cleared[i];
    const card = document.createElement('article');
    card.className = `level-card${locked ? ' locked' : ''}${cleared ? ' cleared' : ''}`;
    card.style.setProperty('--accent', room.accent);
    const bossInfo = room.boss ? BOSS_INFO[room.boss] : null;
    const bossTag = bossInfo && !hidden ? `<span class="boss">BOSS · ${bossInfo.maxPhases || 2} FASE</span>` : '';
    const tags = hidden
      ? '<span>???</span>'
      : meta.tags
          .filter((t) => !t.includes('2 FASE'))
          .map((t) => `<span>${t}</span>`)
          .join('');
    const badge = cleared
      ? '<span class="level-badge done">TUNTAS</span>'
      : hidden
        ? '<span class="level-badge lock">TERSEMBUNYI</span>'
        : locked
          ? '<span class="level-badge lock">TERKUNCI</span>'
          : '<span class="level-badge">TERBUKA</span>';
    card.innerHTML = `
      <div class="level-art">
        <span class="level-chapter">${hidden ? 'MYCELIAL ?' : meta.chapter}</span>
        ${badge}
        <span class="level-glyph" aria-hidden="true">${hidden ? '?' : meta.glyph}</span>
      </div>
      <div class="level-body">
        <h3>${hidden ? '???' : room.name}</h3>
        <span class="level-sub">${hidden ? 'Relung tersembunyi' : room.subtitle}</span>
        <p class="level-desc">${hidden ? 'Dinding berdenyut di Sarang Induk mungkin menyembunyikan sesuatu.' : meta.desc}</p>
        <div class="level-tags">${tags}${bossTag}</div>
        <div class="level-actions">
          ${
            locked
              ? ''
              : '<button class="btn btn-primary btn-small play-btn" type="button">MAINKAN</button>'
          }
          ${hidden ? '' : '<button class="btn btn-ghost btn-small peek-btn" type="button">SNEAK PEEK</button>'}
        </div>
      </div>
    `;
    const playBtn = card.querySelector('.play-btn');
    if (playBtn) playBtn.addEventListener('click', () => startRun(i));
    const peekBtn = card.querySelector('.peek-btn');
    if (peekBtn) peekBtn.addEventListener('click', () => startSpectate(i));
    wrap.appendChild(card);
  });
  buildCisternCards();
  buildLanternwakeCards();
}

// ── pause, mute, helpers ─────────────────────────────────────────────────
function clearHeldKeys() {
  for (const k of Object.keys(keys)) keys[k] = false;
  for (const k of Object.keys(touchInput)) touchInput[k] = false;
  document.querySelectorAll('.tbtn.on').forEach((b) => b.classList.remove('on'));
}

function togglePause(force) {
  if (!started || spectating || menuView !== 'none' || shopOpen) return;
  if (game.state !== 'playing') return;
  paused = typeof force === 'boolean' ? force : !paused;
  if (paused) clearHeldKeys();
  syncScreens();
}

function unlockAudio() {
  if (!audioUnlocked) {
    audioUnlocked = true;
    audio.init();
    applySettings({ persist: false });
    music.play(desiredMusic || 'menu', 1.2);
  } else {
    audio.init();
  }
}

function toggleMute() {
  settings.audio.muted = !settings.audio.muted;
  audio.init();
  applySettings();
  showToast(settings.audio.muted ? 'Suara dibisukan.' : 'Suara aktif.', 1200);
  if (settingsOpen) buildSettings();
}

function pollGamepad() {
  if (!settings.gameplay.gamepad || settingsOpen) {
    if (padHeld.size) padHeld = new Set();
    return;
  }
  let pads = [];
  try {
    pads = navigator.getGamepads ? navigator.getGamepads() : [];
  } catch {
    return;
  }
  const pad = Array.from(pads).find((p) => p && p.connected);
  const held = gamepadActions(pad);
  for (const action of held) {
    if (padHeld.has(action)) continue;
    if (action === 'pause' && started && menuView === 'none' && game.state === 'playing') togglePause();
    else if (action === 'map' && started && menuView === 'none') toggleMap();
    else if (action === 'inventory' && started && menuView === 'none') toggleInventory();
  }
  padHeld = held;
}

// ── input ────────────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  unlockAudio();
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }

  if (creditSceneOpen) {
    if (['Space', 'Enter', 'Escape', 'Backspace'].includes(e.code)) closeCreditScene();
    return;
  }

  if (hunterShopOpen) {
    if (e.code === 'Escape' || e.code === 'Backspace') closeHunterShop();
    return;
  }

  // The same quiet sequence works in every mode. It is intentionally not
  // documented in the UI; the toast only whispers, it never names the find.
  if (!e.repeat && !settingsCapture && !settingsOpen && !cutsceneActive) {
    if (advanceSecretSequence(secretBuffer, e.code, performance.now())) claimModeSecret();
  }

  if (pirateActive) {
    e.preventDefault();
    if (pirateMatch?.phase === 'cleared' || pirateMatch?.phase === 'sunk') {
      if (e.code === 'Escape' || e.code === 'Enter') leavePirates();
      return;
    }
    if (e.code === 'Escape') {
      togglePiratePause();
      return;
    }
    if (piratePaused) return;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      setPirateControlKey(e.code, true);
      return;
    }
    if (e.code === 'KeyQ') { if (!e.repeat) firePirateSide(-1); return; }
    if (e.code === 'KeyE') { if (!e.repeat) firePirateSide(1); return; }
    if (e.code === 'Space') { if (!e.repeat) { firePirateSide(-1); firePirateSide(1); } return; }
    if (e.code === 'KeyF') { if (!e.repeat) dockPirate(); return; }
    return;
  }

  if (wdActive) {
    e.preventDefault();
    if (wdMatch?.phase === 'ended') {
      if (e.code === 'Escape' || e.code === 'Enter') leaveWaveDefense();
      return;
    }
    if (e.code === 'Escape') {
      toggleWaveDefensePause();
      return;
    }
    if (wdPaused) return;
    if (e.code === 'Space') {
      if (waveDefenseNextWave(wdMatch)) {
        wdRenderDirty = true;
        updateWaveDefenseHud(true);
      }
      return;
    }
    const towerIndex = Number(e.code.replace('Digit', '')) - 1;
    if (Number.isInteger(towerIndex) && towerIndex >= 0 && towerIndex < 9) {
      wdSelectedTowerId = WAVE_DEFENSE_TOWERS[towerIndex].id;
      waveDefenseSelectTower(wdMatch, wdSelectedTowerId);
      wdRenderDirty = true;
      updateWaveDefenseHud(true);
    }
    return;
  }

  if (mobaActive) {
    e.preventDefault();
    if (mobaMatch?.phase === 'ended') {
      if (e.code === 'Escape' || e.code === 'Enter') leaveMoba();
      return;
    }
    if (e.code === 'Escape') {
      toggleMobaPause();
      return;
    }
    if (mobaPaused) return;
    const cast = { KeyQ: 0, KeyW: 1, KeyE: 2, KeyR: 3, Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 }[e.code];
    if (cast !== undefined) {
      mobaCast(mobaMatch, cast, mobaAim);
      return;
    }
    if (e.code === 'KeyB') {
      mobaInput.recall = true;
      return;
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD'].includes(e.code)) {
      mobaHeld.add(e.code);
      syncMobaAxes();
    }
    return;
  }

  // A running cutscene owns the keyboard: Space/Enter/Escape skips it.
  if (cutsceneActive) {
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape' || e.code === 'Backspace') {
      finishCutscene(true);
    }
    return;
  }

  // Rebinding captures every key except Escape, which always cancels.
  if (settingsCapture) {
    e.preventDefault();
    if (e.code === 'Escape') {
      settingsCapture = null;
      buildSettings();
    } else {
      handleCapturedKey(e.code);
    }
    return;
  }

  if (settingsOpen) {
    if (e.code === 'Escape' || e.code === 'Backspace') closeSettings();
    return;
  }

  if (menuView === 'mode3d') {
    if (e.code === 'Escape' || e.code === 'Backspace') {
      showMenu();
      return;
    }
    if (['KeyW', 'ArrowUp'].includes(e.code)) input3D.up = true;
    if (['KeyS', 'ArrowDown'].includes(e.code)) input3D.down = true;
    if (['KeyA', 'ArrowLeft'].includes(e.code)) input3D.left = true;
    if (['KeyD', 'ArrowRight'].includes(e.code)) input3D.right = true;
    if (['Space'].includes(e.code)) {
      input3D.jump = true;
      input3D.jumpJustPressed = true;
    }
    if (['ShiftLeft', 'ShiftRight'].includes(e.code)) input3D.sprint = true;
    if (['KeyJ', 'Enter'].includes(e.code)) input3D.attackJustPressed = true;
    if (['KeyL', 'KeyC'].includes(e.code)) input3D.dashJustPressed = true;
    if (['KeyE', 'KeyF'].includes(e.code)) input3D.interactJustPressed = true;
    if (['KeyQ', 'Tab'].includes(e.code)) {
      e.preventDefault();
      input3D.lockOnJustPressed = true;
    }
    if (e.code === 'KeyR' && game3D?.horror && !game3D.horror.active) restart3DHorror();
    return;
  }

  if (menuView === 'frontier' || menuView === 'overdrive') {
    if (e.code === 'Escape' || e.code === 'Backspace') {
      showMenu();
      return;
    }
  }

  if (menuView === 'atlas') {
    if (e.code === 'Escape' || e.code === 'Backspace') showMenu();
    return;
  }

  if (menuView === 'labyrinth') {
    if (e.code === 'Escape' || e.code === 'Backspace') showMenu();
    return;
  }

  if (menuView === 'trials' || menuView === 'puzzle' || menuView === 'moba' || menuView === 'wavedefense' || menuView === 'pirates') {
    if (e.code === 'Escape' || e.code === 'Backspace') showMenu();
    return;
  }

  if (menuView === 'puzzlePlay') {
    if (e.code === 'Escape' || e.code === 'Backspace') showPuzzleAdventure();
    return;
  }

  if (labRewardsOpen) {
    if (/^Digit[1-4]$/.test(e.code)) chooseLabReward(Number(e.code.slice(5)) - 1);
    return;
  }

  if (labSummaryOpen) {
    if (e.code === 'Escape' || e.code === 'Enter') closeLabSummary();
    return;
  }

  if (prologueActive) {
    if (e.code === 'Escape' || e.code === 'Backspace') finishPrologue();
    else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyJ') advancePrologue();
    else if (e.code === 'KeyN') togglePrologueVoice();
    return;
  }

  if (dialogueOpen) {
    if (['Space', 'Enter', 'Escape', 'KeyJ', 'KeyE'].includes(e.code)) advanceDialogue();
    return;
  }

  if (inventoryOpen) {
    if (
      e.code === 'Escape' ||
      e.code === 'Backspace' ||
      e.code === 'KeyI' ||
      actionForCode(settings, e.code) === 'inventory'
    ) {
      closeInventory();
    }
    return;
  }

  if (mapOpen) {
    e.preventDefault();
    const action = actionForCode(settings, e.code);
    if (action === 'map' || e.code === 'Escape' || e.code === 'Backspace') closeMap();
    else if (e.code === 'KeyO') openCodex();
    else if (action === 'inventory') openInventory();
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') mapView.panBy(46, 0);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') mapView.panBy(-46, 0);
    else if (e.code === 'ArrowUp' || e.code === 'KeyW') mapView.panBy(0, 46);
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') mapView.panBy(0, -46);
    else if (e.code === 'Equal' || e.code === 'NumpadAdd') mapView.zoomAt(1.16);
    else if (e.code === 'Minus' || e.code === 'NumpadSubtract') mapView.zoomAt(1 / 1.16);
    return;
  }

  if (codexOpen) {
    if (e.code === 'KeyO' || e.code === 'Escape' || e.code === 'Backspace') closeCodex();
    else if (e.code === 'KeyM') openMap();
    else if (actionForCode(settings, e.code) === 'inventory') openInventory();
    return;
  }

  if (actionForCode(settings, e.code) === 'map') {
    e.preventDefault();
    openMap();
    return;
  }
  if (e.code === 'KeyI' || actionForCode(settings, e.code) === 'inventory') {
    openInventory();
    return;
  }
  if (e.code === 'KeyO') {
    openCodex();
    return;
  }
  if (e.code === 'KeyN') {
    toggleMute();
    return;
  }

  // spectate controls
  if (spectating) {
    if (e.code === 'Escape' || e.code === 'Backspace' || e.code === 'KeyQ') {
      stopSpectate();
      return;
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') peekDir = -1;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') peekDir = 1;
    return;
  }

  if (menuView === 'levels' || menuView === 'credits' || menuView === 'updates' || menuView === 'storymap' || menuView === 'character' || menuView === 'expansion') {
    if (e.code === 'Escape' || e.code === 'Backspace') showMenu();
    return;
  }

  if (menuView === 'title' || !started) {
    // Let keyboard users activate the focused menu button with Enter/Space.
    if (e.target instanceof HTMLElement && e.target.tagName === 'BUTTON') return;
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyJ') beginJourney();
    else if (e.code === 'KeyL') showLevels();
    else if (e.code === 'KeyP') showCharacter();
    else if (e.code === 'KeyC') showCredits();
    else if (e.code === 'KeyU') showUpdates();
    else if (e.code === 'KeyV') showStoryMap();
    else if (e.code === 'KeyX') showExpansion();
    return;
  }

  if (shopOpen) {
    if (
      e.code === 'Escape' ||
      e.code === 'Backspace' ||
      actionForCode(settings, e.code) === 'interact'
    ) {
      closeShop();
    }
    return;
  }

  if (e.code === 'Escape' || actionForCode(settings, e.code) === 'pause') {
    if (game.state === 'blessing') return;
    if (paused) togglePause(false);
    else togglePause(true);
    return;
  }

  if (paused) return;

  if (activeRunKind === 'atlas' && game.state === 'playing') {
    const quickSlot = {
      Digit1: 0, Numpad1: 0,
      Digit2: 1, Numpad2: 1,
      Digit3: 2, Numpad3: 2,
      Digit4: 3, Numpad4: 3,
    }[e.code];
    if (quickSlot !== undefined) {
      e.preventDefault();
      useAtlasQuickSlot(quickSlot);
      return;
    }
  }

  if (actionForCode(settings, e.code) === 'interact' && game.state === 'playing') {
    if (tryCollectSecretRune()) return;
    openShop();
    return;
  }

  if (game.state === 'blessing') {
    if (e.code === 'Digit1' || e.code === 'Numpad1') chooseBlessing(0);
    if (e.code === 'Digit2' || e.code === 'Numpad2') chooseBlessing(1);
    if (e.code === 'Digit3' || e.code === 'Numpad3') chooseBlessing(2);
    return;
  }

  if (e.code === 'KeyR' && (game.state === 'dead' || game.state === 'victory')) {
    retryRun();
    return;
  }

  if (e.code === 'KeyQ' && activeRunKind === 'overdrive' && game.state === 'playing' && !e.repeat) {
    const st = overdriveState();
    const { school, spell } = overdriveSpellFor(st.activeSchool, st.activeSpellIndex);
    const castRes = game.castOverdriveSpell(spell, school.color);
    if (castRes.ok) showToast(`${spell.name} · Mana ${Math.round(castRes.mana)}`, 900);
    else if (castRes.reason === 'mana') showToast('Mana Overdrive tidak cukup.', 900);
    return;
  }

  if (e.code === 'KeyF' && game.state === 'playing' && !e.repeat) {
    if (game.phaseShift()) {
      if (progress.rift) progress.rift.phaseShifts = (progress.rift.phaseShifts || 0) + 1;
      updateHud();
      showToast(`◈ PHASE-SHIFT → FASA ${game.fracturePhase === 0 ? 'A' : 'B'}`, 850);
    }
    return;
  }

  const action = actionForCode(settings, e.code);
  if (action && game.state === 'playing') {
    keys[action] = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (pirateActive) {
    setPirateControlKey(e.code, false);
    return;
  }
  if (wdActive) return;
  if (mobaActive) {
    mobaHeld.delete(e.code);
    syncMobaAxes();
    if (e.code === 'KeyB') mobaInput.recall = false;
    return;
  }
  if (menuView === 'mode3d') {
    if (['KeyW', 'ArrowUp'].includes(e.code)) input3D.up = false;
    if (['KeyS', 'ArrowDown'].includes(e.code)) input3D.down = false;
    if (['KeyA', 'ArrowLeft'].includes(e.code)) input3D.left = false;
    if (['KeyD', 'ArrowRight'].includes(e.code)) input3D.right = false;
    if (['Space'].includes(e.code)) input3D.jump = false;
    if (['ShiftLeft', 'ShiftRight'].includes(e.code)) input3D.sprint = false;
    return;
  }
  if (spectating && (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'ArrowRight' || e.code === 'KeyD')) {
    peekDir = 0;
    return;
  }
  const action = actionForCode(settings, e.code);
  if (action) keys[action] = false;
});

function applyFocusMute(hidden) {
  if (!settings.audio.muteOnBlur) return;
  audio.setMuted(hidden ? true : settings.audio.muted);
}

window.addEventListener('blur', () => {
  peekDir = 0;
  clearHeldKeys();
  applyFocusMute(true);
});

window.addEventListener('focus', () => applyFocusMute(false));

// touch buttons
document.querySelectorAll('.tbtn').forEach((btn) => {
  const action = btn.dataset.action;
  const press = (e) => {
    e.preventDefault();
    if (!started || paused || spectating || menuView !== 'none' || game.state !== 'playing') return;
    audio.init();
    touchInput[action] = true;
    btn.classList.add('on');
  };
  const release = (e) => {
    if (e) e.preventDefault();
    touchInput[action] = false;
    btn.classList.remove('on');
  };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointercancel', release);
  btn.addEventListener('pointerleave', release);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
});

function inputSnapshot() {
  const input = {};
  for (const action of ['left', 'right', 'jump', 'attack', 'dash', 'heal', 'swap', 'consume', 'cycleItem', 'ability', 'weaponSkill']) {
    input[action] = !!(keys[action] || touchInput[action] || padHeld.has(action));
  }
  return input;
}

// ── Infinite Labyrinth (Cursed Realms) ──────────────────────────────────
function labState() {
  if (!progress.labyrinth) progress.labyrinth = defaultLabyrinthProgress();
  return progress.labyrinth;
}

function labCheckpointLoad() {
  try {
    const raw = localStorage.getItem(LAB_CHECKPOINT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function labCheckpointSave() {
  if (!labRun || labGuestMode || !canCheckpoint(labRun.cycle)) return;
  try {
    localStorage.setItem(LAB_CHECKPOINT_KEY, JSON.stringify(serializeLabyrinthRun(labRun)));
  } catch {
    /* storage unavailable */
  }
}

function labCheckpointClear() {
  try {
    localStorage.removeItem(LAB_CHECKPOINT_KEY);
  } catch {
    /* ignore */
  }
}

function showCoop() {
  coopRunMode = 'campaign';
  labCoop.runMode = 'campaign';
  showLabyrinth('coop');
}

function showLabyrinth(tab = 'run') {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'labyrinth';
  labTab = tab;
  clearHeldKeys();
  buildLabyrinthScreen();
  syncScreens();
}

function buildLabyrinthScreen() {
  const p = labState();
  const rank = rankForXp(p.mastery.xp);
  const summary = $('lab-summary');
  if (summary) {
    summary.innerHTML = `
      <div class="lab-stat"><span>SIKLUS TERDALAM</span><strong>${p.best.cycle}</strong></div>
      <div class="lab-stat"><span>BOS GUGUR</span><strong>${p.best.bosses}</strong></div>
      <div class="lab-stat"><span>MUSUH GUGUR</span><strong>${p.totals.enemies}</strong></div>
      <div class="lab-stat"><span>PERINGKAT</span><strong>${rank.rank} · ${rank.name}</strong></div>
      <div class="lab-stat"><span>PECAHAN</span><strong>${p.currencies.shards}</strong></div>
      <div class="lab-stat"><span>ZONA</span><strong>${discoverySummary(p).zones}</strong></div>`;
  }
  document.querySelectorAll('[data-lab-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.labTab === labTab);
  });
  const body = $('lab-body');
  if (!body) return;
  if (labTab === 'run') {
    const checkpoint = labCheckpointLoad();
    body.innerHTML = `
      <div class="lab-modes">${LABYRINTH_MODES.map((mode) => `
        <button class="lab-mode-card" type="button" data-lab-mode="${mode.id}">
          <span class="lab-mode-name">${mode.name}</span>
          <span class="lab-mode-sub">${mode.subtitle}</span>
          <p>${mode.desc}</p>
          <em>${mode.rules.coop ? '2–4 PEMAIN' : 'SOLO / SCOUT'}</em>
        </button>`).join('')}</div>
      <div class="lab-run-footer">
        ${checkpoint ? '<button class="btn btn-ghost btn-compact" type="button" data-lab-action="resume">LANJUTKAN CHECKPOINT (tidak masuk leaderboard)</button>' : ''}
        <p class="micro">Run berakhir saat kau gugur. Checkpoint disimpan setiap 5 siklus dan menandai run sebagai tidak layak leaderboard.</p>
      </div>`;
  } else if (labTab === 'modes') {
    body.innerHTML = `
      <div class="lab-grid">${LABYRINTH_ZONES.map((zone) => `
        <article class="lab-zone-card" style="--zone:${zone.color}">
          <span class="lab-zone-index">${String(zone.index + 1).padStart(2, '0')}</span>
          <h4>${zone.localName}</h4>
          <em>${zone.name}</em>
          <p>${zone.lore}</p>
          <span class="lab-zone-boss">BOS · ${LABYRINTH_BOSS_BY_ID[zone.bossId]?.name || zone.bossId}</span>
        </article>`).join('')}</div>
      <h3 class="lab-section-title">30 BOS LABYRINTH</h3>
      <div class="lab-boss-list">${LABYRINTH_BOSSES.map((boss) => `<span class="lab-boss-pill" style="--rarity:${boss.rarityData.color}">${boss.name}<b>${boss.phases} FASE</b></span>`).join('')}</div>`;
  } else if (labTab === 'items') {
    body.innerHTML = `
      <div class="lab-grid">${LABYRINTH_ITEMS.map((item) => `
        <article class="lab-item-card" style="--item:${item.color}">
          <span class="lab-item-cat">${item.categoryName} · ${item.rarity}</span>
          <h4>${item.name}</h4>
          <p>${itemDescription(item)}</p>
          ${item.curse ? `<em class="lab-curse">${item.curse}</em>` : ''}
          <span class="lab-lore">${item.lore}</span>
        </article>`).join('')}</div>
      <h3 class="lab-section-title">FORBIDDEN SYNERGY</h3>
      <div class="lab-synergy-list">${SYNERGIES.map((synergy) => `<article class="lab-synergy"><h4>${synergy.name}</h4><p>${synergy.requires.map((id) => LABYRINTH_ITEM_BY_ID[id]?.name || id).join(' + ')}</p><em>${synergy.desc}</em></article>`).join('')}</div>`;
  } else if (labTab === 'records') {
    const rows = leaderboardRows(p, 10);
    body.innerHTML = `
      <div class="lab-grid lab-grid-narrow">${LABYRINTH_CURRENCIES.map((currency) => `<article class="lab-currency" style="--coin:${currency.color}"><span>${currency.localName}</span><strong>${p.currencies[currency.id] || 0}</strong></article>`).join('')}</div>
      <h3 class="lab-section-title">MASTERY</h3>
      <div class="lab-mastery">${MASTERY_TRACKS.map((track) => `<span>${track.name}</span>`).join('')}</div>
      <h3 class="lab-section-title">RIWAYAT RUN</h3>
      <div class="lab-table">${rows.length ? rows.map((row) => `<div class="lab-row"><b>#${row.position}</b><span>SIKLUS ${row.cycle}</span><span>${row.bosses} BOS</span><span>${row.enemies} MUSUH</span><span>${Math.round(row.time)}s</span><em>${row.modeId}${row.checkpointed ? ' · CP' : ''}</em></div>`).join('') : '<p class="micro">Belum ada run yang tercatat.</p>'}</div>
      <p class="micro">Discovery · ${discoverySummary(p).zones} zona · ${discoverySummary(p).bosses} bos · ${discoverySummary(p).items} barang · ${discoverySummary(p).synergies} sinergi.</p>`;
  } else {
    const lobby = labCoop.lobby;
    const party = lobby?.players || [];
    const activeMode = labCoop.runMode || coopRunMode;
    body.innerHTML = `
      <div class="lab-coop-panel">
        <p class="eyebrow">PARTY · 2–4 PENJAGA · HOST AUTHORITATIVE</p>
        <div class="lab-coop-modes" role="group" aria-label="Mode co-op">
          ${[['campaign', 'KAMPANYE', 'Ruang 1–14'], ['court', 'HEARTHFALL', 'Ruang 354+'], ['labyrinth', 'LABYRINTH', 'Gelombang tanpa akhir']].map(([id, label, sub]) => `
            <button class="lab-coop-mode ${activeMode === id ? 'active' : ''}" type="button" data-coop-mode="${id}">
              <b>${label}</b><em>${sub}</em>
            </button>`).join('')}
        </div>
        <div class="lab-coop-fields">
          <label>ROOM CODE<input id="lab-room-code" maxlength="8" placeholder="KOSONG = ACAK" value="${esc(labCoop.code || '')}" /></label>
          <label>KATA SANDI<input id="lab-room-pass" type="password" placeholder="opsional" /></label>
          <label>START ROOM<input id="lab-start-room" type="number" min="0" max="${ALL_ROOMS.length - 1}" value="${Number(labCoop.campaignStart) || 0}" /></label>
        </div>
        <div class="lab-coop-actions">
          <button class="btn btn-primary btn-compact" type="button" data-lab-action="host">HOST PARTY</button>
          <button class="btn btn-ghost btn-compact" type="button" data-lab-action="join">JOIN PARTY</button>
          <button class="btn btn-ghost btn-compact" type="button" data-lab-action="leave">PUTUSKAN</button>
          ${labCoop.role === 'host' ? '<button class="btn btn-primary btn-compact" type="button" data-lab-action="start-coop">MULAI SESSION</button>' : ''}
        </div>
        <p class="lab-coop-status ${labCoop.error ? 'error' : ''}">${labCoop.status || 'Belum tersambung. Host membuat room; pemain lain memasukkan kode yang sama.'}</p>
        <div class="lab-party">${party.map((player) => `<span class="lab-party-slot ${player.leader ? 'leader' : ''}"><b>${esc(player.name)}</b><em>${player.classId}</em><i>${player.ready || player.leader ? 'SIAP' : 'MENUNGGU'}</i></span>`).join('') || '<span class="lab-party-slot empty">SLOT KOSONG</span>'}</div>
        <p class="micro">${COOP_MAX_PLAYERS} slot · musuh diskalakan (${partyScaling(Math.max(1, party.length)).hp}× HP). Snapshot 20 Hz, input 20 Hz, delta terkuantisasi. Revive dengan menahan INTERACT di dekat kawan yang tumbang.</p>
        <p class="micro">Untuk LAN, jalankan server dengan <kbd>HOST=0.0.0.0</kbd> lalu bagikan alamat host dan room code.</p>
      </div>`;
  }
}

function labAllyFromLobby(player, index) {
  return {
    id: player.id,
    name: player.name,
    classId: player.classId,
    color: ['#8ec5fc', '#8fdcff', '#ffd166', '#b07be8'][index % 4],
    hp: 100,
    maxHp: 100,
    power: 0.9,
    x: 180 + index * 70,
    y: 470 - 46,
  };
}

function startLabyrinth(modeId = 'standard', options = {}) {
  audio.init();
  attempts = 1;
  activeRunKind = 'labyrinth';
  activeExpansionIndex = null;
  activeModeId = null;
  activeTrialId = null;
  const resumed = options.resumed || null;
  labRun = resumed ? resumeLabyrinthRun(resumed) : createLabyrinthRun({
    seed: options.seed,
    modeId,
    partySize: options.partySize || 1,
    difficulty: options.difficulty || 'normal',
  });
  if (!labRun) return;
  labGuestMode = !!options.guest;
  coopGuestMode = false;
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  game.labyrinth = true;
  activeStage = null;
  labBaseStats = captureBaseStats(game);
  applyLoadoutToGame(labRun, game, labBaseStats);
  game.player.relic = true;
  game.ash = Math.max(game.ash, 32);
  labDirector = new WaveDirector(labRun);
  labDirector.begin();
  if (options.allies?.length) game.setAllies(options.allies);
  game.loadArena(arenaForRun(labRun));
  labWaveEngaged = false;
  labWaveTimer = 0;
  labRewardsOpen = false;
  labRewards = [];
  labSummaryOpen = false;
  labSummary = null;
  if (!labGuestMode) spawnLabWave();
  started = true;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  const zone = LABYRINTH_ZONE_BY_ID[labRun.zoneId] || LABYRINTH_ZONES[0];
  showBanner(zone.localName, `Siklus ${labRun.cycle} · ${stageForCycle(labRun.cycle).label}`);
  showToast(`${LABYRINTH_MODE_BY_ID[labRun.modeId]?.name || 'Infinite Labyrinth'} — ${zone.localName}`, 2600);
  syncScreens();
  updateHud();
}

function spawnLabWave() {
  if (!labDirector || !labRun) return;
  const spawned = labDirector.spawnWave();
  if (!spawned) return;
  spawned.enemies.forEach((enemy, index) => {
    game.spawnEnemy({
      type: enemy.type,
      x: clamp(360 + index * 170, 120, WORLD_W - 120),
      minX: 40,
      maxX: WORLD_W - 80,
      variant: enemy.variant,
      hpScale: enemy.hpScale * partyScaling(Math.max(1, labRun.partySize)).hp,
      dmgScale: enemy.dmgScale * partyScaling(Math.max(1, labRun.partySize)).dmg,
      speedScale: enemy.speedScale,
      elite: enemy.elite,
      eliteRank: enemy.eliteRank,
      name: enemy.name,
    });
  });
  if (spawned.boss) game.spawnBoss(spawned.boss.kind, spawned.boss.overrides);
  labWaveEngaged = true;
  showToast(`${spawned.label} · ${spawned.index}/${spawned.total}${spawned.boss ? ` — ${spawned.boss.overrides.name}` : ''}`, 2200);
}

function tickLabyrinth(dt) {
  if (!labRun || labRun.ended || labGuestMode) return;
  labTicks += 1;
  labRun.stats.timeSurvived += dt;
  tickRituals(labRun, dt);
  labRun.stats.damageDealt = Math.max(labRun.stats.damageDealt, game.damageDealt || 0);
  if ((game.damageReceived || 0) > labRun.stats.damageReceived) {
    advanceRituals(labRun, { type: 'damageTaken' });
    labRun.stats.damageReceived = game.damageReceived;
  }
  if (game.kills > labRun.stats.enemiesDefeated) {
    const gained = game.kills - labRun.stats.enemiesDefeated;
    labRun.stats.enemiesDefeated = game.kills;
    for (let i = 0; i < gained; i += 1) advanceRituals(labRun, { type: 'enemyDown' });
  }
  if (game.state === 'dead') {
    finishLabRun('defeat');
    return;
  }
  if (!labWaveEngaged) {
    labWaveTimer += dt;
    if (labWaveTimer >= 0.9) {
      labWaveTimer = 0;
      spawnLabWave();
    }
    return;
  }
  const wave = labDirector?.wave;
  if (wave?.kind === 'boss' || game.boss) return;
  const alive = game.enemies.filter((enemy) => !enemy.dead && enemy.hp > 0).length;
  if (alive > 0) return;
  const result = labDirector.completeWave();
  if (result === 'wave') {
    labWaveEngaged = false;
    labWaveTimer = 0;
    showToast('Gelombang bersih — berikutnya datang.', 1400);
  } else {
    openLabRewards();
  }
}

function handleLabEvent(ev) {
  if (!labRun || labRun.ended) return;
  if (ev.type === 'labyrinthBossDown') {
    labRun.stats.bossesDefeated += 1;
    if (ev.id) labRun.history.bosses.push(ev.id);
    advanceRituals(labRun, { type: 'bossDown' });
    if (labDirector) labDirector.completeWave();
    openLabRewards();
  } else if (ev.type === 'enemyDown') {
    advanceRituals(labRun, { type: 'enemyDown' });
  } else if (ev.type === 'allyDown') {
    showToast(`${ev.name} tumbang — tahan INTERACT untuk menghidupkan.`, 2400);
  } else if (ev.type === 'allyRevived') {
    showToast(`${ev.name} bangkit kembali.`, 1800);
  }
}

function openLabRewards() {
  if (!labRun || labRun.ended) return;
  labRewards = rewardChoices(labRun, 3);
  labRewardsOpen = true;
  labWaveEngaged = false;
  clearHeldKeys();
  const eyebrow = $('lab-reward-eyebrow');
  if (eyebrow) eyebrow.textContent = `SIKLUS ${labRun.cycle} SELESAI · ${LABYRINTH_ZONE_BY_ID[labRun.zoneId]?.localName || ''}`;
  buildLabRewards();
  labCheckpointSave();
  syncScreens();
}

function buildLabRewards() {
  const wrap = $('lab-reward-cards');
  if (!wrap) return;
  wrap.innerHTML = labRewards.map((reward, index) => `
    <button class="lab-reward-card ${reward.cursed ? 'cursed' : ''}" type="button" data-lab-reward="${index}" style="--reward:${reward.color || '#d0a45a'}">
      <span class="lab-reward-kind">${reward.cursed ? 'CURSED BARGAIN' : (reward.type || 'reward').toUpperCase()}</span>
      <h3>${reward.name}</h3>
      <p>${reward.desc}</p>
      ${reward.curse ? `<em>${reward.curse}</em>` : ''}
      ${reward.lore ? `<span class="lab-lore">${reward.lore}</span>` : ''}
      <b>PILIH ${index + 1}</b>
    </button>`).join('');
}

function chooseLabReward(index) {
  if (!labRewardsOpen) return false;
  const reward = labRewards[index];
  if (!reward) return false;
  const p = game.player;
  if (reward.type === 'item' || reward.type === 'bargain') {
    const ok = applyItemToRun(labRun, reward);
    if (!ok) return false;
    applyLoadoutToGame(labRun, game, labBaseStats);
  } else if (reward.type === 'heal') {
    p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * (reward.value || 0.35) * (p.healMult || 1)));
    p.flasks = Math.min(p.maxFlasks, p.flasks + 1);
  } else if (reward.type === 'flask') {
    p.maxFlasks += 1;
    p.flasks = p.maxFlasks;
  } else if (reward.type === 'blessing') {
    p.damageMult *= 1.12;
    labRun.blessings.push('cycle');
  } else if (reward.type === 'currency') {
    game.ash += Number(reward.value) || 0;
    labState().currencies.shards += Math.max(1, Math.round((Number(reward.value) || 0) / 4));
    saveProgress();
  } else if (reward.type === 'material') {
    labState().currencies.ritualFragments += Number(reward.value) || 1;
    saveProgress();
  }
  labRewardsOpen = false;
  labRewards = [];
  const next = labDirector.advanceCycle();
  labRun.cycle = labRun.planCycle;
  labRun.zoneId = next?.zoneId || labRun.zoneId;
  game.loadArena(arenaForRun(labRun));
  labWaveEngaged = false;
  labWaveTimer = 0;
  if (!labGuestMode) spawnLabWave();
  const zone = LABYRINTH_ZONE_BY_ID[labRun.zoneId] || LABYRINTH_ZONES[0];
  showBanner(zone.localName, `Siklus ${labRun.cycle} · ${stageForCycle(labRun.cycle).label}`);
  syncScreens();
  updateHud();
  return true;
}

function finishLabRun(reason = 'defeat') {
  if (!labRun || labRun.ended) return;
  labRun.ended = true;
  labRun.stats.highestCycle = Math.max(labRun.stats.highestCycle, labRun.cycle);
  labRun.stats.enemiesDefeated = Math.max(labRun.stats.enemiesDefeated, game.kills || 0);
  labRun.stats.damageReceived = Math.max(labRun.stats.damageReceived, game.damageReceived || 0);
  labRun.stats.damageDealt = Math.max(labRun.stats.damageDealt, game.damageDealt || 0);
  labRun.partySize = Math.max(1, 1 + (game.allies?.length || 0));
  progress.labyrinth = recordLabyrinthRun(labState(), labRun);
  saveProgress();
  labSummary = runSummary(labRun);
  labSummary.reason = reason;
  labSummaryOpen = true;
  labRewardsOpen = false;
  labRewards = [];
  paused = true;
  buildLabSummary();
  syncScreens();
}

function buildLabSummary() {
  const body = $('lab-summary-body');
  if (!body || !labSummary) return;
  const rows = [
    ['SIKLUS', labSummary.cycle],
    ['BOS', labSummary.bosses],
    ['ELITE', labSummary.elites],
    ['MUSUH', labSummary.enemies],
    ['WAKTU', `${labSummary.time}s`],
    ['DAMAGE', labSummary.damageDealt],
    ['BARANG', labSummary.items],
    ['KUTUKAN', labSummary.curses],
    ['SINERGI', labSummary.synergies],
    ['XP', labSummary.xp],
  ];
  body.innerHTML = rows.map(([label, value]) => `<div class="lab-stat"><span>${label}</span><strong>${value}</strong></div>`).join('')
    + `<p class="micro">${labSummary.checkpointed ? 'Checkpoint dipakai — run tidak layak leaderboard.' : 'Run layak leaderboard.'}</p>`;
}

function closeLabSummary() {
  labSummaryOpen = false;
  labSummary = null;
  started = false;
  activeRunKind = 'legacy';
  game.labyrinth = false;
  game.reset();
  showLabyrinth('records');
}

// ── Fivefold Trials ───────────────────────────────────────────────────────
function trialsState() {
  if (!progress.trials) progress.trials = defaultTrialProgress();
  return progress.trials;
}

function showTrials() {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  trialRun = null;
  activeRunKind = 'legacy';
  menuView = 'trials';
  clearHeldKeys();
  buildTrialsScreen();
  syncScreens();
}

function buildTrialsScreen() {
  const p = trialsState();
  const summary = trialSummary(p);
  const head = $('trials-summary');
  if (head) {
    head.innerHTML = `
      <div class="lab-stat"><span>LEVEL SELESAI</span><strong>${summary.clearedLevels}/${summary.levels}</strong></div>
      <div class="lab-stat"><span>BIOME</span><strong>${summary.biomes}</strong></div>
      <div class="lab-stat"><span>MUSUH DIJADWALKAN</span><strong>${summary.enemies}</strong></div>
      <div class="lab-stat"><span>ELITE DIJAMIN</span><strong>${summary.elites}</strong></div>
      <div class="lab-stat"><span>BOS GUGUR</span><strong>${summary.bosses}/${summary.biomes}</strong></div>
      <div class="lab-stat"><span>PROGRES</span><strong>${summary.completion}%</strong></div>`;
  }
  const body = $('trials-body');
  if (!body) return;
  body.innerHTML = TRIAL_BIOMES.map((biome) => {
    const state = biomeProgress(p, biome.id);
    const zone = LABYRINTH_ZONE_BY_ID[biome.id];
    const levels = biome.levels.map((level, index) => {
      const cleared = p.cleared[biome.id][index];
      const unlocked = trialLevelUnlocked(p, biome.id, index);
      return `<button class="trial-level ${cleared ? 'cleared' : ''}" type="button"
        data-trial-biome="${biome.id}" data-trial-level="${index}" ${unlocked ? '' : 'disabled'}>
        <b>${index + 1}. ${esc(level.name)}</b>
        <span>${cleared ? 'SELESAI' : unlocked ? '20 MUSUH · 4 ARKETIPE · 1 ELITE' : 'TERKUNCI'}</span>
        <span>ELITE: ${esc(level.elite.name)}</span>
      </button>`;
    }).join('');
    return `<article class="trials-biome" style="--zone:${zone?.color || '#d8b06a'}">
      <div class="trials-biome-head">
        <h3>${esc(biome.name)}</h3>
        <em>${esc(biome.localName)} · ${state.cleared}/${TRIAL_LEVELS_PER_BIOME}</em>
        <span class="trials-boss">BOS: ${esc(biome.boss.name)} · ${biome.boss.phases} FASE</span>
      </div>
      <div class="trials-levels">${levels}
        <button class="trial-level boss ${state.bossCleared ? 'cleared' : ''}" type="button" data-trial-boss="${biome.id}" ${state.bossUnlocked ? '' : 'disabled'}>
          <b>${state.bossCleared ? '✔ ' : ''}${esc(biome.boss.name)}</b>
          <span>${state.bossCleared ? 'BOS GUGUR' : state.bossUnlocked ? 'ARENA BOS TERBUKA' : 'SELESAIKAN 5 LEVEL'}</span>
          <span>${biome.boss.phases} fase · ${biome.boss.hp} HP dasar</span>
        </button>
      </div>
    </article>`;
  }).join('');
}

function startTrialLevel(biomeId, levelIndex) {
  audio.init();
  const biome = TRIAL_BIOME_BY_ID[biomeId];
  const level = biome?.levels[levelIndex];
  if (!level || !trialLevelUnlocked(trialsState(), biomeId, levelIndex)) return false;
  activeRunKind = 'trials';
  activeExpansionIndex = null;
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  game.labyrinth = true;
  game.player.relic = true;
  game.ash = Math.max(game.ash, 80);
  trialRun = {
    mode: 'level', biomeId, levelIndex, biome, level,
    encounter: buildEncounter(level), wave: -1, finished: false, clearTimer: 0,
    startedAt: performance.now(), hudTimer: 0,
  };
  game.loadArena(trialArena(biome, level));
  spawnTrialWave();
  started = true;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  showBanner(level.name, `${biome.localName} · 20 musuh · 4 arketipe · 1 elite`);
  syncScreens();
  updateHud();
  updateTrialHud();
  return true;
}

function startTrialBoss(biomeId) {
  audio.init();
  const biome = TRIAL_BIOME_BY_ID[biomeId];
  if (!biome || !trialBossUnlocked(trialsState(), biomeId)) return false;
  activeRunKind = 'trials';
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  game.labyrinth = true;
  game.player.relic = true;
  game.ash = Math.max(game.ash, 160);
  trialRun = {
    mode: 'boss', biomeId, biome, level: biome.levels[biome.levels.length - 1],
    encounter: null, wave: 0, finished: false, clearTimer: 0,
    startedAt: performance.now(), hudTimer: 0,
  };
  game.loadArena(trialArena(biome, biome.levels[biome.levels.length - 1]));
  game.spawnBoss('trial_boss', trialBossOverrides(biome.boss));
  started = true;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  showBanner(biome.boss.name, `${biome.boss.title} · ${biome.boss.phases} fase`);
  syncScreens();
  updateHud();
  updateTrialHud();
  return true;
}

function spawnTrialWave() {
  if (!trialRun?.encounter) return;
  trialRun.wave += 1;
  const units = waveForEncounter(trialRun.encounter, trialRun.wave);
  units.forEach((unit, index) => {
    game.spawnEnemy({
      type: unit.type,
      name: unit.name,
      x: clamp(260 + index * 230, 80, WORLD_W - 120),
      minX: 40,
      maxX: WORLD_W - 80,
      elite: unit.elite,
      eliteRank: unit.eliteRank,
      hpScale: unit.hpScale,
      dmgScale: unit.dmgScale,
    });
  });
  showToast(`Wave ${trialRun.wave + 1}/${trialRun.encounter.waves.length}${units.some((unit) => unit.elite) ? ' — ELITE' : ''}`, 1600);
  updateTrialHud();
}

function trialAliveCount() {
  return game.enemies.filter((enemy) => !enemy.dead && enemy.hp > 0).length;
}

function tickTrials(dt) {
  if (!trialRun) return;
  if (game.state === 'dead') {
    trialsState().stats.deaths += 1;
    saveProgress();
    trialRun = null;
    showTrials();
    showToast('Trial gagal — coba lagi.', 2200);
    return;
  }
  if (trialRun.clearTimer > 0) {
    trialRun.clearTimer -= dt;
    if (trialRun.clearTimer <= 0) {
      trialRun = null;
      showTrials();
    }
    return;
  }
  if (trialRun.mode === 'boss') return;
  trialRun.hudTimer += dt;
  if (trialRun.hudTimer >= 0.25) {
    trialRun.hudTimer = 0;
    updateTrialHud();
  }
  if (trialAliveCount() > 0) return;
  if (trialRun.wave < trialRun.encounter.waves.length - 1) {
    spawnTrialWave();
    return;
  }
  if (!trialRun.finished) {
    trialRun.finished = true;
    const record = recordTrialClear(progress.trials, trialRun.level.id, { time: (performance.now() - trialRun.startedAt) / 1000 });
    progress.trials = record.progress;
    if (record.firstClear) {
      game.ash += 120;
      labState().currencies.shards += 2;
      showToast(`${trialRun.level.name} selesai — 20 musuh, 1 elite. Boss ${record.bossUnlocked ? 'terbuka' : 'terkunci'}.`, 2600);
    } else {
      showToast('Level ini sudah pernah diselesaikan.', 1800);
    }
    saveProgress();
    trialRun.clearTimer = 1.2;
  }
}

function handleTrialBoss(ev) {
  if (!trialRun || trialRun.mode !== 'boss') return;
  const record = recordTrialBoss(progress.trials, trialRun.biomeId);
  progress.trials = record.progress;
  if (record.firstClear && record.reward) {
    game.ash += record.reward.ash;
    labState().currencies.shards += record.reward.shards;
    showToast(`${ev.name} gugur — ${record.reward.name} diraih.`, 2600);
  }
  saveProgress();
  trialRun.clearTimer = 1.8;
}

function updateTrialHud() {
  const hud = $('trial-hud');
  const show = started && !spectating && menuView === 'none' && activeRunKind === 'trials' && !!trialRun;
  if (hud) hud.classList.toggle('hidden', !show);
  if (!show) return;
  const levelEl = $('trial-hud-level');
  const biomeEl = $('trial-hud-biome');
  const waveEl = $('trial-hud-wave');
  const enemyEl = $('trial-hud-enemies');
  const eliteEl = $('trial-hud-elite');
  if (levelEl) levelEl.textContent = trialRun.mode === 'boss' ? 'BOSS' : `LEVEL ${trialRun.levelIndex + 1} / 5`;
  if (biomeEl) biomeEl.textContent = trialRun.biome?.localName || '';
  if (waveEl) waveEl.textContent = trialRun.mode === 'boss' ? 'ARENA BOS' : `WAVE ${Math.max(1, trialRun.wave + 1)} / 4`;
  if (enemyEl) enemyEl.textContent = trialRun.mode === 'boss' ? (game.boss ? `${game.boss.hp}/${game.boss.maxHp}` : 'BOS') : `${Math.max(0, 20 - Math.max(0, trialRun.wave) * 5 - trialAliveCount())} / 20 MUSUH`;
  if (eliteEl) eliteEl.textContent = trialRun.mode === 'boss' ? `${trialRun.biome?.boss?.phases || 3} FASE` : '1 ELITE DIJAMIN';
}

// ── Puzzle Adventure ──────────────────────────────────────────────────────
function puzzleState() {
  if (!progress.puzzle) progress.puzzle = defaultPuzzleProgress();
  return progress.puzzle;
}

function showPuzzleAdventure(tab) {
  const nextTab = typeof tab === 'string' ? tab : puzzleTab;
  stopPuzzleTimer();
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  puzzleRun = null;
  puzzleSelected = -1;
  puzzleTab = nextTab;
  menuView = 'puzzle';
  clearHeldKeys();
  buildPuzzleScreen();
  syncScreens();
}

function buildPuzzleScreen() {
  const p = puzzleState();
  const summary = puzzleSummary(p);
  const wallet = expState();
  const head = $('puzzle-summary');
  if (head) {
    head.innerHTML = `
      <div class="lab-stat"><span>TAHAP</span><strong>${summary.solved}/${summary.stages}</strong></div>
      <div class="lab-stat"><span>ARC</span><strong>${summary.arcs}</strong></div>
      <div class="lab-stat"><span>JENIS TEKA-TEKI</span><strong>${summary.types}</strong></div>
      <div class="lab-stat"><span>KEMAMPUAN</span><strong>${summary.abilities}/${summary.abilityTotal}</strong></div>
      <div class="lab-stat"><span>PROGRES</span><strong>${summary.percent}%</strong></div>
      <div class="lab-stat"><span>BOSS</span><strong>${summary.bosses}</strong></div>
      <div class="lab-stat"><span>GEMA</span><strong>✦ ${wallet.echoes}</strong></div>
      <div class="lab-stat"><span>BERIKUTNYA</span><strong>${summary.next ? summary.next.name : 'SELESAI'}</strong></div>`;
  }
  document.querySelectorAll('[data-puzzle-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.puzzleTab === puzzleTab);
  });
  const body = $('puzzle-body');
  if (!body) return;
  if (puzzleTab === 'index') {
    body.innerHTML = puzzleIndexMarkup(p);
    return;
  }
  if (puzzleTab === 'lore') {
    body.innerHTML = puzzleLoreMarkup();
    return;
  }
  const abilities = PUZZLE_ABILITIES.map((ability) => `<span class="puzzle-ability ${p.abilities.includes(ability.id) ? '' : 'locked'}">${p.abilities.includes(ability.id) ? '✦' : '◇'} ${esc(ability.name)}</span>`).join('');
  let currentArc = 0;
  const stages = PUZZLE_STAGES.map((stage) => {
    const solved = p.solved.includes(stage.id);
    const unlocked = puzzleStageUnlocked(p, stage.index);
    const type = PUZZLE_TYPE_BY_ID[stage.typeId];
    const heading = stage.arc !== currentArc
      ? `<div class="puzzle-arc-head"><span>ARC ${stage.arc}</span><strong>${esc(stage.arcTitle)}</strong><em>${stage.arc === 1 ? '10 TAHAP' : '10 TAHAP · BOS'}</em></div>`
      : '';
    currentArc = stage.arc;
    return `${heading}<article class="puzzle-stage ${solved ? 'cleared' : ''} ${stage.timed ? 'timed' : ''} ${unlocked ? '' : 'locked'}">
      <span class="puzzle-stage-index">${String(stage.index + 1).padStart(2, '0')}</span>
      <div>
        <h3>${esc(stage.name)}</h3>
        <p>${esc(stage.location)} · ${esc(type?.name || stage.typeId)}${stage.boss ? ` · BOS-TIMED ${formatPuzzleTime(stage.timeLimit)}` : ''}</p>
      </div>
      <button class="btn btn-ghost btn-compact" type="button" data-puzzle-stage="${stage.index}" ${unlocked ? '' : 'disabled'}>
        ${solved ? 'SELESAI' : unlocked ? 'MAINKAN' : 'TERKUNCI'}
      </button>
    </article>`;
  }).join('');
  body.innerHTML = `<div class="puzzle-abilities">${abilities}</div>${stages}`;
}

function puzzleIndexMarkup(progress) {
  const counts = {};
  for (const stage of PUZZLE_STAGES) counts[stage.typeId] = (counts[stage.typeId] || 0) + 1;
  const cards = PUZZLE_TYPES.map((type) => `<article class="puzzle-lore-card">
    <div class="puzzle-lore-head"><span>${String(type.index + 1).padStart(2, '0')} · ${esc(type.engine)}</span><strong>${esc(type.name)}</strong><em>${counts[type.id] || 0}x TAHAP</em></div>
    <p>${esc(type.desc)}</p>
    <blockquote>${esc(PUZZLE_TYPE_LORE[type.id] || '')}</blockquote>
  </article>`).join('');
  return `<div class="puzzle-lore-intro"><span>INDEKS MEKANISME</span><p>${esc(PUZZLE_LORE.intro)}</p><em>${PUZZLE_TYPES.length} sistem · ${PUZZLE_STAGES.length} tahap · ${progress.solved.length} tuntas</em></div>
    <div class="puzzle-lore-grid">${cards}</div>`;
}

function puzzleLoreMarkup() {
  const arcs = PUZZLE_ARCS.map((arc) => {
    const stages = PUZZLE_STAGES.filter((stage) => stage.arc === arc.arc);
    const boss = PUZZLE_BOSS_BY_ID[arc.boss];
    return `<article class="puzzle-arc-lore">
      <div class="puzzle-lore-head"><span>ARC ${arc.arc} · ${stages.length} TAHAP</span><strong>${esc(arc.title)}</strong><em>${esc(boss?.name || 'BOS')}</em></div>
      <p>${esc(arc.story)}</p>
      <blockquote>${esc(arc.secret)}</blockquote>
      <small>${esc(boss?.lore || '')}</small>
    </article>`;
  }).join('');
  return `<div class="puzzle-lore-intro"><span>CATATAN LORE</span><p>${esc(PUZZLE_LORE.intro)}</p><em>${PUZZLE_ARCS.length} arc · ${PUZZLE_BOSSES.length} bos</em></div>
    <div class="puzzle-lore-stack">${arcs}</div>
    <div class="puzzle-lore-epilogue"><span>EPILOG</span><p>${esc(PUZZLE_LORE.epilogue)}</p></div>`;
}

function startPuzzleStage(index) {
  const stage = PUZZLE_STAGES[index];
  if (!stage || !puzzleStageUnlocked(puzzleState(), index)) return false;
  const phases = stage.boss ? (PUZZLE_BOSS_BY_ID[stage.boss]?.phases || [stage.typeId]) : [stage.typeId];
  puzzleRun = {
    stageIndex: index, stage, phase: 0, phases,
    puzzle: generatePuzzle(phases[0], stage.difficulty, `arc|${stage.id}|0`), done: false,
    timeLimit: puzzleBossTimer(stage), deadline: 0,
  };
  puzzleSelected = -1;
  menuView = 'puzzlePlay';
  buildPuzzlePlay();
  startPuzzleTimer();
  syncScreens();
  return true;
}

function buildPuzzlePlay() {
  if (!puzzleRun) return;
  const { stage, puzzle, phase, phases } = puzzleRun;
  const eyebrow = $('puzzle-play-eyebrow');
  const title = $('puzzle-play-title');
  const desc = $('puzzle-play-desc');
  const status = $('puzzle-status');
  if (eyebrow) eyebrow.textContent = `ARC ${stage.arc} · ${stage.location.toUpperCase()} · STAGE ${stage.index + 1} / ${PUZZLE_STAGES.length}${phases.length > 1 ? ` · FASE ${phase + 1}/${phases.length}` : ''}`;
  if (title) title.textContent = puzzle.typeName;
  if (desc) desc.textContent = PUZZLE_TYPE_BY_ID[puzzle.typeId]?.desc || '';
  if (status) status.textContent = `Langkah: ${puzzle.moves} · Susun sampai mekanisme menyala.`;
  const wallet = $('puzzle-currency');
  if (wallet) wallet.textContent = `✦ ${expState().echoes} GEMA · PETUNJUK ${PUZZLE_HINT_COST} GEMA`;
  updatePuzzleTimerWidget();
  const board = $('puzzle-board');
  if (!board) return;
  board.innerHTML = puzzleBoardMarkup(puzzle);
}

function puzzleBoardMarkup(puzzle) {
  if (puzzle.engine === 'path') {
    const pathCells = new Set(puzzle.state.path.map(([x, y]) => `${x},${y}`));
    const blocked = new Set(puzzle.blocked);
    const cells = [];
    for (let y = 0; y < puzzle.h; y += 1) {
      for (let x = 0; x < puzzle.w; x += 1) {
        const key = `${x},${y}`;
        const isStart = x === puzzle.start[0] && y === puzzle.start[1];
        const isGoal = x === puzzle.goal[0] && y === puzzle.goal[1];
        const classes = ['puzzle-cell'];
        if (blocked.has(key)) classes.push('blocked');
        if (pathCells.has(key)) classes.push('path');
        if (isStart) classes.push('start');
        if (isGoal) classes.push('goal');
        cells.push(`<button class="${classes.join(' ')}" type="button" data-cell="${x},${y}" ${blocked.has(key) ? 'disabled' : ''}>${isStart ? '●' : isGoal ? '□' : pathCells.has(key) ? '·' : ''}</button>`);
      }
    }
    return `<div class="puzzle-board" style="grid-template-columns:repeat(${puzzle.w},minmax(0,1fr))">${cells.join('')}</div>`;
  }
  if (puzzle.engine === 'pipes') {
    const glyph = { straight: '│', elbow: '└', tee: '┬', cross: '┼', deadend: '╵' };
    const cells = puzzle.pieces.map((kind, index) => {
      const rotation = puzzle.state.rotations[index] || 0;
      const source = index === 0;
      const sink = index === puzzle.base.length - 1;
      return `<button class="puzzle-cell ${source ? 'source' : ''} ${sink ? 'target' : ''}" type="button" data-rotate="${index}" title="Putar pipa">
        <span style="display:inline-block;transform:rotate(${rotation * 90}deg)">${glyph[kind] || '┼'}</span>
      </button>`;
    }).join('');
    return `<div class="puzzle-board" style="grid-template-columns:repeat(${puzzle.w},minmax(0,1fr))">${cells}</div>`;
  }
  if (puzzle.engine === 'beam') {
    const cells = [];
    for (let y = 0; y < puzzle.h; y += 1) {
      for (let x = 0; x < puzzle.w; x += 1) {
        const mirrorIndex = (puzzle.mirrorPositions || []).findIndex(([mx, my]) => mx === x && my === y);
        const isSource = x === puzzle.source[0] && y === puzzle.source[1];
        const isTarget = x === puzzle.target[0] && y === puzzle.target[1];
        if (mirrorIndex >= 0) {
          const glyph = puzzle.mirrors[mirrorIndex] === '/' ? '/' : '\\';
          const rotation = puzzle.state.rotations[mirrorIndex] || 0;
          cells.push(`<button class="puzzle-cell mirror" type="button" data-rotate="${mirrorIndex}"><span style="display:inline-block;transform:rotate(${rotation * 90}deg)">${glyph}</span></button>`);
        } else {
          cells.push(`<button class="puzzle-cell ${isSource ? 'source' : ''} ${isTarget ? 'target' : ''}" type="button" disabled>${isSource ? '◉' : isTarget ? '◈' : ''}</button>`);
        }
      }
    }
    return `<div class="puzzle-board" style="grid-template-columns:repeat(${puzzle.w},minmax(0,1fr))">${cells.join('')}</div>`;
  }
  if (puzzle.engine === 'sequence' || puzzle.engine === 'image' || puzzle.engine === 'swap') {
    const labels = puzzle.engine === 'image'
      ? puzzle.state.order.map((value) => `PETAK ${value + 1}`)
      : puzzle.state.order.map((value) => String(value).replace('rune_', 'RUNE '));
    const tiles = labels.map((label, index) => `<button class="puzzle-tile ${puzzleSelected === index ? 'selected' : ''}" type="button" data-swap="${index}">${esc(label)}</button>`).join('');
    return `<div class="puzzle-sequence">${tiles}</div>`;
  }
  if (puzzle.engine === 'gear' || puzzle.engine === 'toggle') {
    const cells = puzzle.state.state.map((value, index) => `<button class="puzzle-cell ${value ? 'on' : ''}" type="button" data-toggle="${index}">${value ? '✦' : '◇'}<span style="font-size:9px;display:block">${index + 1}</span></button>`).join('');
    return `<div class="puzzle-board" style="grid-template-columns:repeat(${Math.min(6, puzzle.count)},minmax(0,1fr))">${cells}</div>`;
  }
  return '<p class="puzzle-status">Teka-teki ini belum punya papan.</p>';
}

function handlePuzzleBoardClick(event) {
  if (!puzzleRun || puzzleRun.done) return;
  const puzzle = puzzleRun.puzzle;
  let move = null;
  const cell = event.target.closest('[data-cell]');
  if (cell) {
    const [x, y] = cell.dataset.cell.split(',').map(Number);
    move = { cell: [x, y] };
  }
  const rotate = event.target.closest('[data-rotate]');
  if (rotate) move = { rotate: Number(rotate.dataset.rotate), turns: 1 };
  const swap = event.target.closest('[data-swap]');
  if (swap) {
    const index = Number(swap.dataset.swap);
    if (puzzleSelected < 0) {
      puzzleSelected = index;
      buildPuzzlePlay();
      return;
    }
    if (puzzleSelected === index) {
      puzzleSelected = -1;
      buildPuzzlePlay();
      return;
    }
    move = { a: puzzleSelected, b: index };
    puzzleSelected = -1;
  }
  const toggle = event.target.closest('[data-toggle]');
  if (toggle) move = { index: Number(toggle.dataset.toggle) };
  if (!move) return;
  const result = applyPuzzleMove(puzzle, move);
  if (!result.ok) {
    const status = $('puzzle-status');
    if (status) status.textContent = 'Langkah itu tidak valid untuk mekanisme ini.';
    return;
  }
  puzzleRun.puzzle = result.puzzle;
  buildPuzzlePlay();
  if (puzzleIsSolved(result.puzzle)) finishPuzzleStage();
}

function finishPuzzleStage() {
  if (!puzzleRun) return;
  const run = puzzleRun;
  if (run.phase < run.phases.length - 1) {
    run.phase += 1;
    puzzleSelected = -1;
    run.puzzle = generatePuzzle(run.phases[run.phase], run.stage.difficulty, `arc|${run.stage.id}|${run.phase}`);
    resetPuzzleTimer();
    buildPuzzlePlay();
    showToast(`Mekanisme fase ${run.phase + 1} aktif — waktu diatur ulang.`, 2000);
    return;
  }
  run.done = true;
  stopPuzzleTimer();
  const record = recordPuzzleSolve(progress.puzzle, run.stage.id, { moves: run.puzzle.moves });
  progress.puzzle = record.progress;
  if (run.stage.boss) {
    const boss = recordPuzzleBoss(progress.puzzle, run.stage.boss);
    progress.puzzle = boss.progress;
    if (boss.firstClear) showToast(`${PUZZLE_BOSS_BY_ID[run.stage.boss]?.name || 'Bos'} dikalahkan — Ancient Compass diraih.`, 3000);
  }
  saveProgress();
  const status = $('puzzle-status');
  if (status) status.textContent = 'Mekanisme menyala. Jalan terbuka.';
  setTimeout(() => {
    if (menuView === 'puzzlePlay') showPuzzleAdventure('stages');
  }, 900);
}

function updatePuzzleTimerWidget() {
  const widget = $('puzzle-timer');
  const value = $('puzzle-timer-value');
  if (!widget || !value) return;
  const timed = !!puzzleRun?.stage?.timed && !puzzleRun.done;
  widget.classList.toggle('hidden', !timed);
  if (!timed) return;
  const remaining = puzzleRun.deadline > 0 ? (puzzleRun.deadline - Date.now()) / 1000 : puzzleRun.timeLimit;
  value.textContent = formatPuzzleTime(remaining);
  widget.classList.toggle('danger', remaining <= 15);
}

function startPuzzleTimer() {
  stopPuzzleTimer();
  if (!puzzleRun?.stage?.timed) {
    updatePuzzleTimerWidget();
    return;
  }
  puzzleRun.timeLimit = puzzleBossTimer(puzzleRun.stage);
  puzzleRun.deadline = Date.now() + puzzleRun.timeLimit * 1000;
  updatePuzzleTimerWidget();
  puzzleTimerInterval = setInterval(updatePuzzleTimer, 200);
}

function resetPuzzleTimer() {
  if (!puzzleRun?.stage?.timed) return;
  puzzleRun.deadline = Date.now() + puzzleRun.timeLimit * 1000;
  updatePuzzleTimerWidget();
}

function stopPuzzleTimer() {
  if (puzzleTimerInterval) clearInterval(puzzleTimerInterval);
  puzzleTimerInterval = null;
  const widget = $('puzzle-timer');
  if (widget) widget.classList.add('hidden');
}

function updatePuzzleTimer() {
  if (!puzzleRun || puzzleRun.done) {
    stopPuzzleTimer();
    return;
  }
  updatePuzzleTimerWidget();
  if (puzzleRun.deadline > 0 && Date.now() >= puzzleRun.deadline) timeoutPuzzleStage();
}

function timeoutPuzzleStage() {
  if (!puzzleRun || puzzleRun.done) return;
  puzzleRun.done = true;
  stopPuzzleTimer();
  const run = puzzleRun;
  puzzleState().stats.timeouts += 1;
  saveProgress();
  const status = $('puzzle-status');
  if (status) status.textContent = `WAKTU HABIS — ${PUZZLE_BOSS_BY_ID[run.stage.boss]?.name || 'bos'} menutup mekanisme. Coba lagi.`;
  const timer = $('puzzle-timer');
  if (timer) { timer.classList.remove('hidden'); timer.classList.add('danger'); }
  const value = $('puzzle-timer-value');
  if (value) value.textContent = '00:00';
  setTimeout(() => {
    if (menuView === 'puzzlePlay' && puzzleRun === run) showPuzzleAdventure('stages');
  }, 1400);
}

function resetPuzzleBoard() {
  if (!puzzleRun) return;
  puzzleRun.puzzle = generatePuzzle(puzzleRun.puzzle.typeId, puzzleRun.puzzle.difficulty, puzzleRun.puzzle.seed);
  puzzleSelected = -1;
  buildPuzzlePlay();
}

function showPuzzleHint() {
  if (!puzzleRun || puzzleRun.done) return;
  const status = $('puzzle-status');
  const wallet = expState();
  const payment = payPuzzleHint(progress.puzzle, wallet.echoes, puzzleRun.stage.id, PUZZLE_HINT_COST);
  if (!payment.ok) {
    if (status) status.textContent = `Gema tidak cukup. Butuh ✦ ${payment.cost} Gema — kumpulkan dari kampanye utama. (Punya ✦ ${payment.echoes})`;
    return;
  }
  wallet.echoes = payment.echoes;
  progress.puzzle = payment.progress;
  saveProgress();
  if (status) status.textContent = `−✦ ${payment.cost} Gema · ${puzzleHintText(puzzleRun.puzzle)} · Sisa ✦ ${wallet.echoes}.`;
  const balance = $('puzzle-currency');
  if (balance) balance.textContent = `✦ ${wallet.echoes} GEMA · PETUNJUK ${PUZZLE_HINT_COST} GEMA`;
}

function updateLabHud() {
  const hud = $('lab-hud');
  if (!hud) return;
  const show = started && !spectating && menuView === 'none' && activeRunKind === 'labyrinth' && !labSummaryOpen;
  hud.classList.toggle('hidden', !show);
  if (!show || !labRun) return;
  const model = labyrinthHudModel(labRun, labDirector);
  $('lab-hud-cycle').textContent = `SIKLUS ${String(model.cycle).padStart(3, '0')}`;
  $('lab-hud-stage').textContent = `${model.stage.label} · ${model.zone.name}`;
  $('lab-hud-zone').textContent = model.zone.localName;
  $('lab-hud-wave').textContent = `${model.waveLabel} · ${model.wave}/${model.totalWaves}`;
  $('lab-hud-label').textContent = model.boss ? `BOSS · ${model.boss.name}` : (labRun.modifiers.length ? labRun.modifiers.map((id) => LABYRINTH_MODIFIER_BY_ID[id]?.name).filter(Boolean).join(' · ') : 'TANPA MODIFIER');
  $('lab-hud-curses').textContent = `${model.curses} KUTUKAN · ${(labRun.items || []).length} BARANG`;
  $('lab-hud-score').textContent = `${model.score} PTS`;
  const party = [{ id: 'host', name: CHARACTERS[character.characterId]?.name || 'Penjaga', hp: game.player.hp, maxHp: game.player.maxHp }, ...(game.allies || [])];
  $('lab-hud-party').innerHTML = party.map((member) => `<span class="lab-party-hp ${member.downed ? 'downed' : ''}"><b>${esc(member.name)}</b><i style="width:${Math.max(0, Math.min(100, (member.hp / Math.max(1, member.maxHp)) * 100))}%"></i></span>`).join('');
}

function labSnapshotState() {
  const alive = game.enemies.filter((enemy) => !enemy.dead && enemy.hp > 0);
  return {
    t: performance.now() / 1000,
    scene: 'labyrinth',
    roomIndex: game.roomIndex,
    roomName: game.room?.name || '',
    players: [
      { id: labCoop.selfId || 'p1', slot: 0, x: game.player.x, y: game.player.y, hp: game.player.hp, maxHp: game.player.maxHp, stateCode: 0, facing: game.player.facing },
      ...(game.allies || []).map((ally, index) => ({ id: ally.id, slot: index + 1, x: ally.x, y: ally.y, hp: ally.hp, maxHp: ally.maxHp, stateCode: ally.downed ? 4 : 0, facing: ally.facing })),
    ],
    enemies: alive.map((enemy, index) => ({ slot: index, x: enemy.x, y: enemy.y, hp: enemy.hp, maxHp: enemy.maxHp, stateCode: enemy.elite ? 3 : 0, facing: enemy.facing })),
    boss: game.boss && !game.boss.dying ? { slot: 99, x: game.boss.x, y: game.boss.y, hp: game.boss.hp, maxHp: game.boss.maxHp, stateCode: game.boss.phase, facing: game.boss.facing } : null,
    projectiles: game.projectiles.slice(0, 24).map((pr) => ({ x: pr.x, y: pr.y, typeCode: 0 })),
    wave: { index: (labDirector?.waveIndex ?? 0) + 1, total: labDirector?.totalWaves || 4, kindCode: labDirector?.wave?.kind === 'boss' ? 3 : 0 },
    lab: {
      cycle: labRun.cycle,
      zoneId: labRun.zoneId,
      waveIndex: labDirector?.waveIndex ?? 0,
      seed: labRun.seed,
      modeId: labRun.modeId,
      types: alive.map((enemy) => enemy.type),
      bossKind: game.boss?.kind || null,
      bossName: game.boss?.name || null,
      bossPattern: game.boss?.patternType || 'slam',
      bossW: game.boss?.w || 120,
      bossH: game.boss?.h || 130,
    },
  };
}

function coopSnapshotState() {
  if (activeRunKind === 'labyrinth' && labRun) return labSnapshotState();
  const alive = game.enemies.filter((enemy) => !enemy.dead && enemy.hp > 0);
  const boss = game.boss && !game.boss.dying ? game.boss : null;
  return {
    t: performance.now() / 1000,
    scene: activeRunKind === 'court' ? 'court' : 'campaign',
    roomIndex: game.roomIndex,
    roomName: game.room?.name || '',
    players: [
      { id: labCoop.selfId || 'p1', slot: 0, x: game.player.x, y: game.player.y, hp: game.player.hp, maxHp: game.player.maxHp, stateCode: 0, facing: game.player.facing },
      ...(game.allies || []).map((ally, index) => ({ id: ally.id, slot: index + 1, x: ally.x, y: ally.y, hp: ally.hp, maxHp: ally.maxHp, stateCode: ally.downed ? 4 : 0, facing: ally.facing })),
    ],
    enemies: alive.map((enemy, index) => ({ slot: index, x: enemy.x, y: enemy.y, hp: enemy.hp, maxHp: enemy.maxHp, stateCode: enemy.elite ? 3 : 0, facing: enemy.facing })),
    boss: boss ? { slot: 99, x: boss.x, y: boss.y, hp: boss.hp, maxHp: boss.maxHp, stateCode: boss.phase, facing: boss.facing } : null,
    bossMeta: boss ? {
      kind: boss.kind,
      name: boss.name,
      title: boss.title,
      pattern: boss.patternType || 'slam',
      maxPhases: boss.maxPhases || 3,
      phaseThresholds: boss.phaseThresholds || [0.66, 0.33],
      w: boss.w || 120,
      h: boss.h || 130,
    } : null,
    projectiles: game.projectiles.slice(0, 24).map((pr) => ({ x: pr.x, y: pr.y, typeCode: 0 })),
    types: alive.map((enemy) => enemy.type),
    wave: null,
    lab: null,
  };
}

function applyCoopSnapshot() {
  if (!coopGuestMode || !started) return;
  const sample = labCoop.interpolator.sample(performance.now());
  if (!sample) return;
  const roomIndex = Number(sample.roomIndex);
  if (Number.isInteger(roomIndex) && roomIndex !== game.roomIndex && roomIndex >= 0 && roomIndex < ALL_ROOMS.length) {
    game.enterRoom(roomIndex);
    game.events.length = 0;
    coopGuestRoom = roomIndex;
  }
  game.time += 0.016;
  game.state = 'playing';
  const players = sample.players || [];
  const self = players.find((player) => player.id && player.id === coopSelfId) || players[0];
  const others = players.filter((player) => player !== self);
  if (self) {
    game.player.x = self.x;
    game.player.y = self.y;
    game.player.hp = self.hp;
    game.player.maxHp = Math.max(1, self.maxHp);
    game.player.facing = self.facing || 1;
  }
  const lobbyPlayers = labCoop.lobby?.players || [];
  game.allies = others.map((ally, index) => {
    const meta = lobbyPlayers.find((player) => player.id === ally.id);
    return {
      id: ally.id || `guest${index}`,
      name: meta?.name || `Penjaga ${index + 2}`,
      classId: meta?.classId || 'sera',
      color: ['#8ec5fc', '#ffd166', '#b07be8'][index % 3],
      x: ally.x,
      y: ally.y,
      w: 30,
      h: 46,
      vx: 0,
      vy: 0,
      facing: ally.facing || 1,
      hp: ally.hp,
      maxHp: Math.max(1, ally.maxHp),
      downed: ally.stateCode === 4,
      onGround: true,
      invuln: 0,
      attackCooldown: 0,
      input: {},
    };
  });
  const types = sample.types || [];
  const previousBoss = game.boss;
  game.enemies = [];
  (sample.enemies || []).forEach((state, index) => {
    const enemy = game.spawnEnemy({ type: types[index] || 'crawler', x: state.x, minX: 40, maxX: WORLD_W - 80 });
    enemy.x = state.x;
    enemy.y = state.y;
    enemy.hp = state.hp;
    enemy.maxHp = Math.max(1, state.maxHp);
    enemy.facing = state.facing || -1;
    enemy.hitFlash = state.stateCode === 3 ? 0.08 : 0;
    enemy.dead = state.hp <= 0;
  });
  if (sample.boss) {
    const meta = sample.bossMeta || {};
    if (!previousBoss || (meta.kind && previousBoss.kind !== meta.kind)) {
      game.boss = null;
      game.spawnBoss(meta.kind || 'warden', {
        name: meta.name,
        title: meta.title,
        maxHp: Math.max(1, sample.boss.maxHp),
        contact: Math.max(8, Math.round(sample.boss.maxHp / 45)),
        w: meta.w || 120,
        h: meta.h || 130,
        pattern: meta.pattern || 'slam',
        maxPhases: meta.maxPhases || 3,
        phaseThresholds: meta.phaseThresholds || [0.66, 0.33],
      });
      game.events.length = 0;
    }
    if (game.boss) {
      game.boss.x = sample.boss.x;
      game.boss.y = sample.boss.y;
      game.boss.hp = sample.boss.hp;
      game.boss.maxHp = Math.max(1, sample.boss.maxHp);
      game.boss.phase = Math.max(1, sample.boss.stateCode || 1);
      game.boss.intro = 0;
    }
  } else if (game.boss) {
    game.boss = null;
  }
  updateHud();
}

// ── co-op networking (host authoritative, WebSocket relay) ────────────────

function applyGuestSnapshot() {
  if (!labRun || labGuestMode === false) return;
  const sample = labCoop.interpolator.sample(performance.now());
  if (!sample) return;
  const meta = sample.lab;
  if (meta && meta.cycle !== labRun.cycle) {
    labRun.cycle = meta.cycle;
    labRun.zoneId = LABYRINTH_ZONE_BY_ID[meta.zoneId] ? meta.zoneId : labRun.zoneId;
    ensurePlans(labRun, 2);
    game.loadArena(arenaForRun(labRun));
  }
  if (meta?.zoneId && meta.zoneId !== labRun.zoneId && LABYRINTH_ZONE_BY_ID[meta.zoneId]) {
    labRun.zoneId = meta.zoneId;
  }
  game.time += 0.016;
  game.state = 'playing';
  const self = sample.players?.find((player) => player.id && player.id === coopSelfId) || sample.players?.[0];
  if (self) {
    game.player.x = self.x;
    game.player.y = self.y;
    game.player.hp = self.hp;
    game.player.maxHp = Math.max(1, self.maxHp);
    game.player.facing = self.facing || 1;
  }
  const owned = (sample.players || []).filter((player) => player !== self);
  game.allies = owned.map((ally, index) => ({
    id: ally.id || `guest${index}`,
    name: labCoop.lobby?.players?.find((player) => player.id === ally.id)?.name || game.allies[index]?.name || `Penjaga ${index + 2}`,
    classId: 'sera',
    color: ['#8ec5fc', '#ffd166', '#b07be8'][index % 3],
    x: ally.x,
    y: ally.y,
    w: 30,
    h: 46,
    vx: 0,
    vy: 0,
    facing: ally.facing || 1,
    hp: ally.hp,
    maxHp: Math.max(1, ally.maxHp),
    downed: ally.stateCode === 4,
    onGround: true,
    invuln: 0,
    attackCooldown: 0,
    input: {},
  }));
  const types = meta?.types || [];
  const live = (game.enemies || []).filter((enemy) => !enemy.dead);
  while (live.length < (sample.enemies?.length || 0)) {
    const enemy = game.spawnEnemy({ type: types[live.length] || 'crawler', x: 400, minX: 40, maxX: WORLD_W - 80 });
    live.push(enemy);
  }
  (sample.enemies || []).forEach((state, index) => {
    const enemy = live[index];
    if (!enemy) return;
    enemy.x = state.x;
    enemy.y = state.y;
    enemy.hp = state.hp;
    enemy.maxHp = Math.max(1, state.maxHp);
    enemy.facing = state.facing || -1;
    enemy.hitFlash = state.stateCode === 3 ? 0.08 : enemy.hitFlash;
  });
  for (let i = sample.enemies?.length || 0; i < live.length; i += 1) live[i].dead = true;
  game.enemies = game.enemies.filter((enemy) => !enemy.dead);
  if (sample.boss) {
    if (!game.boss) {
      const kind = meta?.bossKind && LABYRINTH_BOSS_BY_ID[meta.bossKind.replace('lab_', '')] ? meta.bossKind : 'lab_guest_boss';
      const info = kind !== 'lab_guest_boss' ? LABYRINTH_BOSS_BY_ID[meta.bossKind.replace('lab_', '')] : null;
      game.spawnBoss(kind, info ? {
        name: info.name,
        title: info.title,
        maxHp: Math.max(1, sample.boss.maxHp),
        contact: Math.max(8, Math.round(sample.boss.maxHp / 40)),
        w: info.w,
        h: info.h,
        pattern: info.pattern,
        maxPhases: info.phases,
        phaseThresholds: info.phaseThresholds,
        dialogueData: info.dialogue,
        labBossId: info.id,
      } : {
        name: meta?.bossName || 'Labyrinth Boss',
        maxHp: Math.max(1, sample.boss.maxHp),
        contact: 20,
        w: 120,
        h: 130,
        pattern: meta?.bossPattern || 'slam',
        maxPhases: 3,
        phaseThresholds: [0.66, 0.33],
      });
    }
    if (game.boss) {
      game.boss.x = sample.boss.x;
      game.boss.y = sample.boss.y;
      game.boss.hp = sample.boss.hp;
      game.boss.maxHp = Math.max(1, sample.boss.maxHp);
      game.boss.phase = Math.max(1, sample.boss.stateCode || 1);
      game.boss.intro = 0;
    }
  } else if (game.boss) {
    game.boss = null;
  }
  updateHud();
}

// ── co-op networking (host authoritative, WebSocket relay) ────────────────
function labCoopSend(message) {
  return labCoop.transport?.send(message) || false;
}

function labCoopStatus(text, error = false) {
  labCoop.status = text;
  labCoop.error = error;
  if (menuView === 'labyrinth' && labTab === 'coop') buildLabyrinthScreen();
}

function teardownLabCoop(notify = true) {
  if (notify && labCoop.role === 'host' && labCoop.transport?.connected) labCoopSend({ type: 'lab_close' });
  try {
    labCoop.transport?.close();
  } catch {
    /* ignore */
  }
  labCoop.transport = null;
  labCoop.role = null;
  labCoop.lobby = null;
  labCoop.code = '';
  labCoop.joined = false;
  labCoop.peers = {};
  labCoop.interpolator = new SnapshotInterpolator({ delay: 0.12 });
}

function connectLabCoop(role) {
  if (!('WebSocket' in window)) {
    labCoopStatus('Browser ini tidak mendukung WebSocket.', true);
    return;
  }
  const rawCode = ($('lab-room-code')?.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  const code = rawCode || roomCodeFromSeed(Date.now());
  const password = $('lab-room-pass')?.value || '';
  const runMode = labCoop.runMode || coopRunMode || 'labyrinth';
  teardownLabCoop(false);
  labCoop.role = role;
  labCoop.code = code;
  labCoop.password = password;
  labCoop.runMode = runMode;
  coopRunMode = runMode;
  labCoop.playerName = CHARACTERS[character.characterId]?.name || 'Penjaga';
  const transport = createWebSocketTransport(coopSocketUrl(window.location.origin, code), {
    WebSocketImpl: window.WebSocket,
    onOpen: () => labCoopStatus(`Tersambung ke room ${code}.`),
    onClose: () => labCoopStatus('Koneksi terputus.', true),
    onError: () => labCoopStatus('Gagal menyambung. Pastikan server berjalan.', true),
  });
  labCoop.transport = transport;
  transport.onMessage(handleLabSocket);
  if (role === 'host') {
    labCoop.lobby = createLobby({
      hostName: labCoop.playerName,
      classId: character.characterId,
      seed: Date.now() & 0x7fffffff,
      modeId: runMode === 'labyrinth' ? 'labyrinth' : 'campaign',
      name: 'ASHEN VOW PARTY',
      password,
      code,
    });
    labCoop.selfId = labCoop.lobby.players[0]?.id || 'p1';
    labCoopStatus(`Room ${code} dibuat (${runMode}). Bagikan kode ini.`);
  } else {
    labCoopStatus(`Bergabung ke ${code}…`);
  }
  buildLabyrinthScreen();
}

function handleLabSocket(message) {
  if (!message || typeof message.type !== 'string') return;
  if (message.type === 'server_welcome') {
    labCoop.serverId = message.id;
    if (labCoop.role === 'guest' && !labCoop.joined) {
      labCoop.joined = true;
      labCoopSend({ type: 'lab_join', name: labCoop.playerName || 'Penjaga', classId: character.characterId, password: labCoop.password || '' });
    }
    labCoopStatus(`Room ${message.room} · ${message.players}/${message.max} pemain.`);
    return;
  }
  if (message.type === 'server_peer') {
    if (message.left && message.leftPeer) {
      const player = labCoop.peers[message.leftPeer];
      delete labCoop.peers[message.leftPeer];
      if (player) {
        if (labCoop.lobby) {
          labCoop.lobby = {
            ...labCoop.lobby,
            players: labCoop.lobby.players.filter((entry) => entry.id !== player.id),
          };
        }
        game.setAllies((game.allies || []).filter((ally) => ally.id !== player.id));
        labCoopStatus(`${player.name} keluar — party ${Math.max(1, message.players)}/${message.max}.`);
      }
    }
    labCoopStatus(`Room ${message.room} · ${message.players}/${message.max} pemain.`);
    return;
  }
  if (message.type === 'server_host') {
    // The old host disconnected. The relay promotes the oldest socket; keep
    // the lobby state already replicated to this guest instead of dropping
    // the whole party.
    if (labCoop.role === 'guest') {
      labCoop.role = 'host';
      labCoop.selfId = labCoop.lobby?.players?.find((player) => !player.host)?.id || labCoop.selfId;
      coopGuestMode = false;
      labGuestMode = false;
      labCoopStatus('Host lama terputus — kau menjadi host baru. Simulasi dilanjutkan dari snapshot terakhir.', true);
      if (labCoop.lobby) labCoopSend({ type: 'lab_lobby', lobby: { ...labCoop.lobby, password: labCoop.lobby.password ? '*' : '' } });
    }
    return;
  }
  if (message.type === 'lab_lobby') {
    labCoop.lobby = message.lobby;
    if (menuView === 'labyrinth' && labTab === 'coop') buildLabyrinthScreen();
    return;
  }
  if (message.type === 'lab_join' && labCoop.role === 'host') {
    if (!labCoop.lobby) return;
    const result = joinLobby(labCoop.lobby, { name: message.name, classId: message.classId, password: message.password });
    if (!result.ok) {
      labCoopSend({ type: 'lab_reject', to: message._from, error: result.error });
      labCoopStatus(result.error, true);
      return;
    }
    result.player.ready = true;
    labCoop.lobby = result.lobby;
    labCoop.peers[message._from || result.player.id] = result.player;
    const ally = labAllyFromLobby(result.player, Object.keys(labCoop.peers).length);
    if (started && !coopGuestMode && (activeRunKind === 'labyrinth' || activeRunKind === 'court' || activeRunKind === 'legacy')) {
      game.setAllies([...(game.allies || []).map((entry) => ({ ...entry })), ally]);
    } else if (labRun) {
      labRun.pendingAllies = [...(labRun.pendingAllies || []), ally];
    }
    labCoopSend({ type: 'lab_lobby', lobby: { ...labCoop.lobby, password: labCoop.lobby.password ? '*' : '' } });
    labCoopStatus(`${result.player.name} bergabung (${labCoop.lobby.players.length}/${COOP_MAX_PLAYERS}).`);
    return;
  }
  if (message.type === 'lab_input' && labCoop.role === 'host') {
    const peerId = message._from;
    if (!peerId) return;
    const lobbyPlayer = labCoop.lobby?.players.find((player) => labCoop.peers[peerId]?.id === player.id);
    const allyId = labCoop.peers[peerId]?.id || lobbyPlayer?.id;
    if (allyId) game.setAllyInput(allyId, message.input || {});
    return;
  }
  if (message.type === 'lab_welcome' && labCoop.role === 'guest') {
    labCoop.lobby = message.lobby;
    if (message.run?.seed) {
      startLabyrinth('multiplayer', {
        seed: message.run.seed,
        guest: true,
        partySize: message.lobby?.players?.length || 2,
      });
      const self = message.lobby?.players?.find((player) => !player.host && player.name.toLowerCase() === String(labCoop.playerName || '').toLowerCase())
        || message.lobby?.players?.find((player) => !player.host);
      coopSelfId = self?.id || '';
      labCoop.selfId = coopSelfId;
      labGuestMode = true;
      coopGuestMode = false;
      labCoopStatus('Session Labyrinth dimulai sebagai guest — input dikirim ke host.');
      showToast('Co-op: kau bergabung ke party host.', 2200);
    }
    return;
  }
  if (message.type === 'coop_start' && labCoop.role === 'guest') {
    startCoopGuest(message);
    return;
  }
  if (message.type === 'lab_reject') {
    labCoopStatus(message.error || 'Ditolak host.', true);
    return;
  }
  if (message.type === 'snapshot' && labCoop.role === 'guest') {
    const decoded = decodeSnapshot(message.delta);
    if (decoded) labCoop.interpolator.push(decoded);
    return;
  }
  if (message.type === 'lab_close') {
    labCoopStatus('Host menutup sesi.', true);
    teardownLabCoop(false);
  }
}

function startLabCoopSession() {
  if (labCoop.role !== 'host' || !labCoop.lobby) {
    labCoopStatus('Buat party dulu sebelum memulai.', true);
    return;
  }
  const check = canStartLobby(labCoop.lobby);
  if (!check.ok) {
    labCoopStatus(check.reason, true);
    return;
  }
  const startedLobby = startLobby(labCoop.lobby);
  if (!startedLobby.ok) {
    labCoopStatus(startedLobby.error, true);
    return;
  }
  labCoop.lobby = startedLobby.lobby;
  const mode = labCoop.runMode || coopRunMode || 'labyrinth';
  coopRunMode = mode;
  const requestedRoom = Number($('lab-start-room')?.value);
  const startRoom = Number.isInteger(requestedRoom) ? clamp(requestedRoom, 0, ALL_ROOMS.length - 1) : (Number(labCoop.campaignStart) || 0);
  labCoop.campaignStart = mode === 'campaign' ? startRoom : 0;
  const allies = labCoop.lobby.players
    .filter((player) => !player.host)
    .map((player, index) => labAllyFromLobby(player, index));
  if (mode === 'campaign') {
    startRun(labCoop.campaignStart);
    game.setAllies(allies);
  } else if (mode === 'court') {
    startCourtRoom(0);
    game.setAllies(allies);
  } else {
    startLabyrinth('multiplayer', { seed: labCoop.lobby.seed, partySize: labCoop.lobby.players.length, allies });
  }
  for (const player of labCoop.lobby.players.filter((entry) => !entry.host)) {
    if (mode === 'labyrinth') {
      labCoopSend({ type: 'lab_welcome', lobby: labCoop.lobby, run: { seed: labCoop.lobby.seed, modeId: 'multiplayer' } });
    } else {
      labCoopSend({
        type: 'coop_start',
        mode,
        lobby: labCoop.lobby,
        seed: labCoop.lobby.seed,
        roomIndex: mode === 'campaign' ? labCoop.campaignStart : game.roomIndex,
        roomLocal: 0,
      });
    }
  }
  labCoopStatus(`Session ${mode} dimulai · ${labCoop.lobby.players.length} penjaga.`);
}

function startCoopGuest(message) {
  const mode = message.mode === 'court' || message.mode === 'campaign' ? message.mode : 'campaign';
  if (message.lobby) labCoop.lobby = message.lobby;
  const lobby = labCoop.lobby;
  const normalizedName = String(labCoop.playerName || '').toLowerCase();
  const self = lobby?.players?.find((player) => !player.host && player.name.toLowerCase() === normalizedName)
    || lobby?.players?.find((player) => !player.host);
  coopSelfId = self?.id || '';
  labCoop.selfId = coopSelfId;
  labCoop.runMode = mode;
  coopRunMode = mode;
  labCoop.interpolator = new SnapshotInterpolator({ delay: 0.12 });
  if (mode === 'court') {
    startCourtRoom(0);
    labGuestMode = false;
    coopGuestMode = true;
  } else {
    startRun(Number.isInteger(message.roomIndex) ? clamp(message.roomIndex, 0, ALL_ROOMS.length - 1) : 0);
    labGuestMode = false;
    coopGuestMode = true;
  }
  game.setAllies([]);
  game.events.length = 0;
  coopGuestRoom = game.roomIndex;
  labCoopStatus(`Session ${mode} dimulai sebagai guest — kendali avatar dikirim ke host.`);
  showToast('Co-op: kau mengendalikan penjaga sendiri.', 2400);
  syncScreens();
  updateHud();
}

function labSendHostSnapshot() {
  if (labCoop.role !== 'host' || !labCoop.transport?.connected || !started || labGuestMode || coopGuestMode) return;
  if (activeRunKind === 'labyrinth' && !labRun) return;
  const now = performance.now();
  if (now - labCoop.snapshotAt < 66) return;
  labCoop.snapshotAt = now;
  labCoopSend({ type: 'snapshot', delta: encodeSnapshot(coopSnapshotState()) });
}

function labSendGuestInput() {
  if (labCoop.role !== 'guest' || !labCoop.transport?.connected || !started) return;
  const now = performance.now();
  if (now - labCoop.inputAt < 1000 / 20) return;
  labCoop.inputAt = now;
  labCoop.seq += 1;
  labCoopSend({ type: 'lab_input', seq: labCoop.seq, input: inputSnapshot() });
}

// ── UI wiring ────────────────────────────────────────────────────────────
$('btn-start').addEventListener('click', beginJourney);
$('btn-court-menu')?.addEventListener('click', () => showCourt('journey'));
$('btn-fairy-menu')?.addEventListener('click', () => showFairy());
$('btn-speedrun-menu')?.addEventListener('click', () => showSpeedrun());
$('btn-speedrun-back')?.addEventListener('click', () => showMenu());
$('speedrun-start')?.addEventListener('click', () => startSpeedrun(0));
$('speedrun-summary-again')?.addEventListener('click', () => startSpeedrun(0));
$('speedrun-summary-menu')?.addEventListener('click', () => {
  speedrunSummaryOpen = false;
  showMenu();
});
$('btn-fallen-menu')?.addEventListener('click', () => showFallenMenu());
$('btn-fallen-back')?.addEventListener('click', () => showFallenMenu());
$('btn-fallen-crusade')?.addEventListener('click', () => showCrusadeMenu());
$('btn-crusade-menu')?.addEventListener('click', () => showCrusadeMenu());
$('btn-crusade-back')?.addEventListener('click', () => showCrusadeMenu());
$('btn-rift-menu')?.addEventListener('click', () => showRiftScreen());
$('btn-rift-back')?.addEventListener('click', () => showMenu());
$('rift-badge')?.addEventListener('click', () => {
  if (started && menuView === 'none' && game.state === 'playing' && game.phaseShift()) updateHud();
});
$('crusade-hud')?.addEventListener('click', (event) => {
  if (event.target.closest('[data-crusade-action="strike"]')) crusadeStrike();
});
$('fallen-hud')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-fallen-action]');
  if (!button) return;
  const action = button.dataset.fallenAction;
  if (action === 'burst') fallenBurst();
  else if (action === 'shadow') fallenShadow();
  else if (action === 'cleanse') fallenCleanse();
});
$('btn-fishing-menu')?.addEventListener('click', () => showFishing());
$('btn-editor-menu')?.addEventListener('click', () => { void showEditor(); });
$('btn-editor-back')?.addEventListener('click', () => showMenu());
$('editor-form')?.addEventListener('click', (event) => {
  if (event.target.closest('[data-editor-retry]')) {
    void showEditor();
  }
});
$('btn-fishing-back')?.addEventListener('click', () => closeFishing());
$('fishing-cast-start')?.addEventListener('click', () => beginFishingCast());
$('fishing-shop-open')?.addEventListener('click', () => openBaitShop());
$('fishing-index-open')?.addEventListener('click', () => openFishIndex());
$('fishing-strike')?.addEventListener('click', () => {
  if (fishingReel && !fishingReel.resolved) strikeFishingReel();
  else beginFishingCast();
});
$('fishing-cast-close')?.addEventListener('click', () => {
  closeFishingOverlays();
  buildFishingScreen();
});
$('btn-bait-shop-back')?.addEventListener('click', () => closeBaitShop());
$('bait-shop-index')?.addEventListener('click', () => openFishIndex());
$('btn-fish-index-back')?.addEventListener('click', () => closeFishIndex());
$('fish-index-shop')?.addEventListener('click', () => openBaitShop());
$('fishing-screen')?.addEventListener('click', (event) => {
  const bait = event.target.closest('[data-fishing-bait]');
  if (bait) selectFishingBait(bait.dataset.fishingBait);
});
$('bait-shop-screen')?.addEventListener('click', (event) => {
  const buy = event.target.closest('[data-buy-bait]');
  if (buy) buyFishingBait(buy.dataset.buyBait, Number(buy.dataset.baitQty) || 1);
});
$('fish-index-screen')?.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-fish-tier]');
  if (tab) setFishIndexTab(tab.dataset.fishTier);
});
window.addEventListener('keydown', (event) => {
  if (menuView !== 'fishing' || $('fishing-cast')?.classList.contains('hidden')) return;
  if (event.code === 'Space' || event.code === 'Enter') {
    if (fishingReel && !fishingReel.resolved) {
      event.preventDefault();
      event.stopPropagation();
      strikeFishingReel();
    }
  } else if (event.code === 'Escape') {
    event.preventDefault();
    closeFishingOverlays();
    buildFishingScreen();
  }
}, true);
$('btn-fairy-back')?.addEventListener('click', () => closeFairy());
$('btn-cutscene-skip')?.addEventListener('click', () => finishCutscene(true));
$('btn-credit-scene-skip')?.addEventListener('click', () => closeCreditScene());
$('btn-court-back')?.addEventListener('click', closeCourt);
$('court-screen')?.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-court-tab]');
  if (tab) {
    courtTab = tab.dataset.courtTab;
    buildCourtScreen();
    return;
  }
  const action = event.target.closest('[data-action]');
  if (action) handleCourtAction(action);
});
$('btn-coop-menu')?.addEventListener('click', () => showCoop());
$('btn-labyrinth-menu')?.addEventListener('click', () => showLabyrinth('run'));
$('btn-lab-back')?.addEventListener('click', () => { teardownLabCoop(); showMenu(); });
$('btn-trials-menu')?.addEventListener('click', showTrials);
$('btn-trials-back')?.addEventListener('click', showMenu);
$('btn-moba-menu')?.addEventListener('click', showMoba);
$('btn-moba-back')?.addEventListener('click', showMenu);
$('btn-moba-start')?.addEventListener('click', startMobaBattle);
$('btn-moba-pause')?.addEventListener('click', () => toggleMobaPause(true));
$('btn-moba-quit')?.addEventListener('click', leaveMoba);
$('btn-moba-resume')?.addEventListener('click', () => toggleMobaPause(false));
$('btn-moba-pause-leave')?.addEventListener('click', leaveMoba);
$('moba-screen')?.addEventListener('click', (event) => {
  const role = event.target.closest('[data-moba-role]');
  if (role) { mobaRoleFilter = role.dataset.mobaRole; buildMobaScreen(); return; }
  const hero = event.target.closest('[data-moba-hero]');
  if (hero) { mobaHeroId = hero.dataset.mobaHero; buildMobaScreen(); return; }
  const map = event.target.closest('[data-moba-map]');
  if (map) { mobaMapId = map.dataset.mobaMap; buildMobaScreen(); return; }
  const lane = event.target.closest('[data-moba-lane]');
  if (lane) { mobaLane = lane.dataset.mobaLane; buildMobaScreen(); return; }
  const difficulty = event.target.closest('[data-moba-difficulty]');
  if (difficulty) { mobaDifficulty = difficulty.dataset.mobaDifficulty; buildMobaScreen(); }
});
$('moba-canvas')?.addEventListener('pointermove', (event) => {
  const point = mobaPointerWorld(event);
  if (point) mobaAim = point;
});
$('moba-canvas')?.addEventListener('pointerdown', (event) => {
  if (!mobaActive || mobaPaused || mobaMatch?.phase !== 'playing') return;
  const point = mobaPointerWorld(event);
  if (!point) return;
  mobaAim = point;
  mobaSetOrder(mobaMatch, point.x, point.y);
});
$('moba-abilities')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-moba-cast]');
  if (button && mobaActive && !mobaPaused) mobaCast(mobaMatch, Number(button.dataset.mobaCast), mobaAim);
});
$('moba-result')?.addEventListener('click', (event) => {
  const action = event.target.closest('[data-moba-action]')?.dataset.mobaAction;
  if (action === 'rematch') startMobaBattle();
  else if (action === 'leave') leaveMoba();
});
$('btn-wd-menu')?.addEventListener('click', showWaveDefense);
$('btn-wd-back')?.addEventListener('click', showMenu);
$('btn-wd-start')?.addEventListener('click', startWaveDefenseFromHub);
$('btn-wd-trailer')?.addEventListener('click', playWaveDefenseTrailer);
$('btn-wd-pause')?.addEventListener('click', () => toggleWaveDefensePause(true));
$('btn-wd-quit')?.addEventListener('click', leaveWaveDefense);
$('btn-wd-resume')?.addEventListener('click', () => toggleWaveDefensePause(false));
$('btn-wd-pause-leave')?.addEventListener('click', leaveWaveDefense);
$('btn-wd-next')?.addEventListener('click', () => {
  if (waveDefenseNextWave(wdMatch)) {
    wdRenderDirty = true;
    updateWaveDefenseHud(true);
  }
});
$('wd-screen')?.addEventListener('click', (event) => {
  const map = event.target.closest('[data-wd-map]');
  if (map) { wdMapId = map.dataset.wdMap; buildWaveDefenseScreen(); return; }
  const difficulty = event.target.closest('[data-wd-difficulty]');
  if (difficulty) { wdDifficulty = difficulty.dataset.wdDifficulty; buildWaveDefenseScreen(); return; }
  const pbtn = event.target.closest('[data-wd-particle]');
  if (pbtn) { wdParticleId = pbtn.dataset.wdParticle; buildWaveDefenseScreen(); return; }
  const mode = event.target.closest('[data-wd-mode]');
  if (mode) {
    wdInfinitower = mode.dataset.wdMode === 'infinitower';
    wdEndless = wdInfinitower || mode.dataset.wdMode === 'endless';
    buildWaveDefenseScreen();
    return;
  }
  const tower = event.target.closest('[data-wd-tower]');
  if (tower) { wdSelectedTowerId = tower.dataset.wdTower; buildWaveDefenseScreen(); }
});
$('wd-battle')?.addEventListener('click', (event) => {
  const tower = event.target.closest('[data-wd-tower]');
  if (tower && wdMatch) {
    wdSelectedTowerId = tower.dataset.wdTower;
    waveDefenseSelectTower(wdMatch, wdSelectedTowerId);
    wdRenderDirty = true;
    updateWaveDefenseHud(true);
    return;
  }
  const speed = event.target.closest('[data-wd-speed]');
  if (speed && wdMatch) {
    waveDefenseSetSpeed(wdMatch, Number(speed.dataset.wdSpeed));
    updateWaveDefenseHud(true);
    return;
  }
  const pscale = event.target.closest('[data-wd-pscale]');
  if (pscale && wdMatch) {
    const scale = Number(pscale.dataset.wdPscale);
    waveDefenseSetParticleScale(wdMatch, scale);
    const matched = WAVE_DEFENSE_PARTICLE_LEVELS.find((entry) => Math.abs(entry.scale - scale) < 0.15);
    if (matched) wdParticleId = matched.id;
    wdRenderDirty = true;
    updateWaveDefenseHud(true);
  }
});
$('wd-selection')?.addEventListener('click', (event) => {
  const action = event.target.closest('[data-wd-action]')?.dataset.wdAction;
  if (action === 'upgrade') waveDefenseUpgrade(wdMatch);
  else if (action === 'sell') waveDefenseSell(wdMatch);
  wdRenderDirty = true;
  updateWaveDefenseHud(true);
});
$('wd-canvas')?.addEventListener('pointerdown', (event) => {
  if (!wdActive || wdPaused || wdMatch?.phase === 'ended') return;
  const point = waveDefensePointerWorld(event);
  if (!point) return;
  handleWaveDefenseSlot(waveDefenseSlotAt(point.x, point.y));
});
$('wd-result')?.addEventListener('click', (event) => {
  const action = event.target.closest('[data-wd-action]')?.dataset.wdAction;
  if (action === 'rematch') startWaveDefenseBattle();
  else if (action === 'leave') leaveWaveDefense();
});
$('btn-pirate-menu')?.addEventListener('click', showPirates);
$('btn-pirate-back')?.addEventListener('click', showMenu);
$('btn-pirate-start')?.addEventListener('click', startPirateVoyage);
$('btn-pirate-pause')?.addEventListener('click', () => togglePiratePause(true));
$('btn-pirate-quit')?.addEventListener('click', leavePirates);
$('btn-pirate-resume')?.addEventListener('click', () => togglePiratePause(false));
$('btn-pirate-pause-leave')?.addEventListener('click', leavePirates);
$('btn-pirate-fire-port')?.addEventListener('click', () => firePirateSide(-1));
$('btn-pirate-fire-starboard')?.addEventListener('click', () => firePirateSide(1));
$('btn-pirate-dock')?.addEventListener('click', dockPirate);
$('pirate-screen')?.addEventListener('click', (event) => {
  if (event.target.closest('[data-pirate-endless]')) {
    startPirateEndless();
    return;
  }
  const card = event.target.closest('[data-pirate-stage]');
  if (!card || card.disabled) return;
  pirateStageId = card.dataset.pirateStage;
  buildPirateScreen();
});
$('pirate-canvas')?.addEventListener('pointerdown', (event) => {
  if (!pirateActive || piratePaused || pirateMatch?.phase !== 'sailing') return;
  const point = piratePointerWorld(event);
  if (!point) return;
  pirateFireAt(pirateMatch, point.x, point.y);
  updatePirateHud(true);
});
$('pirate-controls')?.addEventListener('pointerdown', (event) => {
  const button = event.target.closest('[data-pirate-control]');
  if (!button || !pirateActive || piratePaused) return;
  event.preventDefault();
  const action = button.dataset.pirateControl;
  if (action === 'port') firePirateSide(-1);
  else if (action === 'starboard') firePirateSide(1);
  else if (action === 'dock') dockPirate();
  else {
    const code = { forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD' }[action];
    if (code) setPirateControlKey(code, true);
  }
  button.setPointerCapture?.(event.pointerId);
});
const releasePirateControl = (event) => {
  const button = event.target.closest?.('[data-pirate-control]');
  if (!button) return;
  const code = { forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD' }[button.dataset.pirateControl];
  if (code) setPirateControlKey(code, false);
};
$('pirate-controls')?.addEventListener('pointerup', releasePirateControl);
$('pirate-controls')?.addEventListener('pointercancel', releasePirateControl);
$('pirate-controls')?.addEventListener('pointerleave', releasePirateControl);
$('pirate-result')?.addEventListener('click', (event) => {
  const action = event.target.closest('[data-pirate-action]')?.dataset.pirateAction;
  if (action === 'retry') (pirateMatch?.endless ? startPirateEndless : startPirateVoyage)();
  else if (action === 'leave') leavePirates();
});
$('btn-puzzle-menu')?.addEventListener('click', showPuzzleAdventure);
$('btn-puzzle-back')?.addEventListener('click', showMenu);
$('btn-puzzle-leave')?.addEventListener('click', showPuzzleAdventure);
$('btn-puzzle-reset')?.addEventListener('click', resetPuzzleBoard);
$('btn-puzzle-hint')?.addEventListener('click', showPuzzleHint);
$('puzzle-tabs')?.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-puzzle-tab]');
  if (!tab) return;
  puzzleTab = tab.dataset.puzzleTab;
  buildPuzzleScreen();
});
$('trials-screen')?.addEventListener('click', (event) => {
  const level = event.target.closest('[data-trial-level]');
  if (level && !level.disabled) {
    startTrialLevel(level.dataset.trialBiome, Number(level.dataset.trialLevel));
    return;
  }
  const boss = event.target.closest('[data-trial-boss]');
  if (boss && !boss.disabled) startTrialBoss(boss.dataset.trialBoss);
});
$('puzzle-screen')?.addEventListener('click', (event) => {
  const stage = event.target.closest('[data-puzzle-stage]');
  if (stage && !stage.disabled) startPuzzleStage(Number(stage.dataset.puzzleStage));
});
$('puzzle-board')?.addEventListener('click', handlePuzzleBoardClick);
$('lab-quit')?.addEventListener('click', () => finishLabRun('quit'));
$('lab-summary-again')?.addEventListener('click', () => {
  const mode = labSummary?.modeId || 'standard';
  labSummaryOpen = false;
  startLabyrinth(mode);
});
$('lab-summary-hub')?.addEventListener('click', closeLabSummary);
$('labyrinth-screen')?.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-lab-tab]');
  if (tab) {
    labTab = tab.dataset.labTab;
    buildLabyrinthScreen();
    return;
  }
  const mode = event.target.closest('[data-lab-mode]');
  if (mode) {
    startLabyrinth(mode.dataset.labMode);
    return;
  }
  const coopMode = event.target.closest('[data-coop-mode]');
  if (coopMode) {
    coopRunMode = coopMode.dataset.coopMode;
    labCoop.runMode = coopRunMode;
    buildLabyrinthScreen();
    return;
  }
  const action = event.target.closest('[data-lab-action]')?.dataset.labAction;
  if (!action) return;
  if (action === 'host') connectLabCoop('host');
  else if (action === 'join') connectLabCoop('guest');
  else if (action === 'leave') {
    teardownLabCoop();
    labCoopStatus('Sesi diputuskan.');
    buildLabyrinthScreen();
  } else if (action === 'start-coop') startLabCoopSession();
  else if (action === 'resume') {
    const saved = labCheckpointLoad();
    if (saved) startLabyrinth(saved.modeId, { resumed: saved });
  }
});
$('lab-reward-cards')?.addEventListener('click', (event) => {
  const card = event.target.closest('[data-lab-reward]');
  if (card) chooseLabReward(Number(card.dataset.labReward));
});
$('btn-character-menu').addEventListener('click', showCharacter);
$('btn-character-back').addEventListener('click', closeCharacter);
$('btn-character-save').addEventListener('click', () => {
  saveCharacter();
  applyCharacterToGame();
  showToast('Tampilan penjaga tersimpan.', 1600);
});
$('btn-character-start').addEventListener('click', beginJourney);
$('btn-prologue-skip').addEventListener('click', finishPrologue);
$('btn-prologue-voice').addEventListener('click', togglePrologueVoice);
$('btn-levels').addEventListener('click', showLevels);
$('btn-admin-menu')?.addEventListener('click', () => window.open('/admin', '_blank', 'noopener'));
fetch('/api/admin/session', { credentials: 'same-origin' })
  .then((response) => { if (response.ok) $('btn-admin-menu')?.classList.remove('hidden'); })
  .catch(() => {});
$('btn-settings-menu').addEventListener('click', () => showSettings('graphics'));
$('btn-settings-top')?.addEventListener('click', () => showSettings('graphics'));
$('btn-hud-settings')?.addEventListener('click', () => showSettings('graphics'));
$('btn-difficulty-menu')?.addEventListener('click', () => showSettings('difficulty'));
$('btn-credits').addEventListener('click', showCredits);
$('btn-updates').addEventListener('click', () => { void showUpdates(); });
$('update-log')?.addEventListener('click', (event) => {
  if (event.target.closest('[data-updates-retry]')) void loadUpdateLog({ force: true });
});
$('btn-map-menu').addEventListener('click', openMap);
$('btn-storymap-menu')?.addEventListener('click', () => { void showStoryMap(); });
$('btn-storymap-close')?.addEventListener('click', closeStoryMap);
$('storymap-detail')?.addEventListener('click', (event) => {
  if (event.target.closest('[data-story-retry]')) void showStoryMap();
});
$('btn-codex-menu').addEventListener('click', () => openCodex());
$('btn-expansion-menu').addEventListener('click', () => showExpansion());
$('btn-levels-back').addEventListener('click', showMenu);
$('btn-credits-back').addEventListener('click', showMenu);
$('btn-updates-back').addEventListener('click', showMenu);
$('btn-expansion-back').addEventListener('click', showMenu);
$('btn-mode3d-menu')?.addEventListener('click', () => showMode3D('campaign'));
$('btn-horror3d-menu')?.addEventListener('click', () => showMode3D('scary'));
$('btn-mode3d-back')?.addEventListener('click', closeMode3D);
$('btn-horror3d-start')?.addEventListener('click', () => start3DHorrorRun($('horror3d-select')?.value || horror3DSiteId));
$('horror3d-select')?.addEventListener('change', (event) => {
  horror3DSiteId = event.target.value;
  buildHorror3DPanel();
});
$('horror3d-anti')?.addEventListener('change', (event) => {
  horror3D.settings.antiJumpscare = !!event.target.checked;
  save3DHorrorState();
  if (game3D?.horror) game3D.horror.antiJumpscare = !!event.target.checked;
});
$('horror3d-intensity')?.addEventListener('change', (event) => {
  horror3D.settings.intensity = event.target.value;
  save3DHorrorState();
  if (game3D?.horror) game3D.horror.intensity = event.target.value;
});
$('horror3d-sites')?.addEventListener('click', (event) => {
  const card = event.target.closest('[data-horror-site]');
  if (!card) return;
  start3DHorror(card.dataset.horrorSite);
});
$('btn-frontier-menu')?.addEventListener('click', () => showFrontier('campaign200'));
$('btn-frontier-back')?.addEventListener('click', closeFrontier);
$('btn-overdrive-menu')?.addEventListener('click', () => showOverdrive('campaign301'));
$('btn-overdrive-back')?.addEventListener('click', closeOverdrive);
$('overdrive-tabs')?.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-tab]');
  if (!tab) return;
  overdriveTab = tab.dataset.tab;
  buildOverdriveScreen();
});
$('btn-atlas-menu')?.addEventListener('click', () => showAtlas('zones'));
$('btn-atlas-back')?.addEventListener('click', closeAtlas);

$('atlas-tabs')?.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-tab]');
  if (!tab) return;
  atlasTab = tab.dataset.tab;
  buildAtlasScreen();
});

$('atlas-body')?.addEventListener('click', (event) => {
  const target = event.target.closest('[data-atlas-action]');
  if (!target) return;
  event.preventDefault();
  handleAtlasAction(target.dataset.atlasAction, target);
});

$('atlas-body')?.addEventListener('change', (event) => {
  const select = event.target.closest('[data-atlas-quick]');
  if (!select) return;
  const slot = Number(select.dataset.atlasQuick);
  if (!Number.isInteger(slot) || slot < 0 || slot >= 4) return;
  const p = atlasState();
  const itemId = select.value && ATLAS_CONSUMABLE_BY_ID[select.value] ? select.value : null;
  if (!p.quickSlots) p.quickSlots = [null, null, null, null];
  p.quickSlots[slot] = itemId;
  saveProgress();
  showToast(itemId
    ? `${ATLAS_CONSUMABLE_BY_ID[itemId].name} dipasang di slot ${slot + 1}.`
    : `Slot ${slot + 1} dikosongkan.`, 1600);
  buildAtlasScreen();
});

$('atlas-body')?.addEventListener('input', (event) => {
  if (event.target.id !== 'atlas-lore-search') return;
  atlasLoreQuery = event.target.value;
  clearTimeout(atlasSearchTimer);
  atlasSearchTimer = setTimeout(() => {
    buildAtlasScreen();
    const input = $('atlas-lore-search');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, 220);
});

$('atlas-quickbar')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-atlas-quick-use]');
  if (!button) return;
  useAtlasQuickSlot(Number(button.dataset.atlasQuickUse));
});

$('select-3d-area')?.addEventListener('change', (e) => {
  if (!game3D) return;
  if (game3D.setArea(e.target.value)) showToast(`${game3D.area.name} — ${game3D.area.subtitle}`, 2200);
});
$('select-3d-region')?.addEventListener('change', (e) => {
  if (!game3D) return;
  game3D.setRegion(e.target.value);
  showToast(`3D region: ${MODE3D_REGIONS[e.target.value]?.name || e.target.value}`, 1800);
});
$('select-3d-submode')?.addEventListener('change', (e) => {
  if (game3D) game3D.subMode = e.target.value;
});
$('select-3d-quality')?.addEventListener('change', (e) => {
  if (game3D) game3D.quality = e.target.value;
});

$('frontier-tabs')?.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-tab]');
  if (!tab) return;
  frontierTab = tab.dataset.tab;
  buildFrontierScreen();
});

const canvas3D = $('canvas-3d');
if (canvas3D) {
  let isPointerDown = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  canvas3D.addEventListener('mousedown', (e) => {
    isPointerDown = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    if (!game3D?.horror?.active) input3D.attackJustPressed = true;
  });
  window.addEventListener('mouseup', () => {
    isPointerDown = false;
  });
  window.addEventListener('mousemove', (e) => {
    if (isPointerDown && game3D) {
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      game3D.camera.yaw += dx * 0.004;
      game3D.camera.pitch = clamp(game3D.camera.pitch + dy * 0.004, game3D.horror?.active ? -0.7 : -0.4, 0.7);
    }
  });
}
$('expansion-tabs').addEventListener('click', (event) => {
  const tab = event.target.closest('[data-tab]');
  if (!tab) return;
  expansionTab = tab.dataset.tab;
  buildExpansionScreen();
});
$('expansion-body').addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  event.preventDefault();
  handleExpansionAction(target);
});
$('btn-settings-apply')?.addEventListener('click', () => {
  settingsBaseline = JSON.parse(JSON.stringify(settings));
  applySettings({ persist: true });
  settingsApplyState = 'saved';
  closeSettings();
  showToast('Pengaturan diterapkan dan tersimpan.', 1500);
});
$('btn-settings-cancel')?.addEventListener('click', cancelSettings);
$('btn-settings-reset-category')?.addEventListener('click', () => {
  if (!window.confirm(`Reset kategori “${SETTINGS_CATEGORIES.find((entry) => entry.id === settingsTab)?.label || settingsTab}”?`)) return;
  const defaults = defaultSettings();
  const defs = settingsForCategory(settingsTab);
  for (const def of defs) setSettingsValue(settings, def.path, getSettingsValue(defaults, def.path));
  const map = { interface: 'hud', difficulty: 'gameplay', language: 'language', advanced: 'advanced' };
  const group = map[settingsTab] || settingsTab;
  if (settings[group] && defaults[group]) settings[group] = JSON.parse(JSON.stringify(defaults[group]));
  applySettings({ persist: false });
  buildSettings();
});
$('btn-settings-reset-all')?.addEventListener('click', () => {
  if (!window.confirm('Reset SEMUA pengaturan ke default? Progres permainan tidak dihapus.')) return;
  settings = defaultSettings();
  game.setDifficulty(settings.gameplay.difficulty);
  applySettings({ persist: false });
  buildSettings();
});
$('btn-scare-preview')?.addEventListener('click', () => {
  previewScare();
});
$('btn-debug-close')?.addEventListener('click', () => closeDebug());
$('btn-debug-ai')?.addEventListener('click', (event) => {
  const on = toggleAiDebug();
  event.currentTarget.setAttribute('aria-pressed', String(on));
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'F9' && debugUnlocked()) {
    event.preventDefault();
    if (debugOpen) closeDebug();
    else openDebug();
  }
}, true);

$('btn-settings-diagnostics')?.addEventListener('click', () => {
  settingsDiagnosticsOpen = !settingsDiagnosticsOpen;
  $('btn-settings-diagnostics')?.setAttribute('aria-pressed', String(settingsDiagnosticsOpen));
  buildDiagnostics();
});
$('btn-hud-layout-close')?.addEventListener('click', () => {
  settings.hud.position = 'custom';
  applySettings({ persist: false });
  saveSettings(settingsStore, settings);
  hudLayoutOpen = false;
  settingsOpen = true;
  buildSettings();
  syncScreens();
});
$('btn-hud-layout-reset')?.addEventListener('click', () => {
  settings.hud.layout = {};
  settings.hud.position = 'default';
  applyHudLayout();
  buildHudLayoutEditor();
});
$('btn-peek-back').addEventListener('click', stopSpectate);
$('btn-map-close').addEventListener('click', closeMap);
$('btn-map-codex').addEventListener('click', () => openCodex());
$('btn-codex-close').addEventListener('click', closeCodex);
$('btn-codex-map').addEventListener('click', openMap);
$('btn-inventory-close').addEventListener('click', closeInventory);
$('btn-dialogue-next').addEventListener('click', advanceDialogue);
$('btn-pause-map').addEventListener('click', openMap);
$('btn-pause-codex').addEventListener('click', () => openCodex());
$('btn-pause-inventory').addEventListener('click', openInventory);
$('btn-pause-settings').addEventListener('click', () => showSettings('gameplay'));
wireMapControls();

$('btn-retry').addEventListener('click', retryRun);
$('btn-again').addEventListener('click', () => startRun(0));
$('btn-resume').addEventListener('click', () => togglePause(false));
$('btn-shop').addEventListener('click', () => openShop(true));
$('btn-shop-close').addEventListener('click', closeShop);
$('btn-pause-hunter-shop')?.addEventListener('click', openHunterShop);
$('btn-hunter-shop-close')?.addEventListener('click', closeHunterShop);
$('btn-pause-levels').addEventListener('click', showLevels);
$('btn-pause-menu').addEventListener('click', showMenu);
$('btn-death-levels').addEventListener('click', showLevels);
$('btn-death-menu').addEventListener('click', showMenu);
$('btn-victory-levels').addEventListener('click', showLevels);
$('btn-victory-menu').addEventListener('click', showMenu);
$('sound-btn').addEventListener('click', toggleMute);

window.addEventListener(
  'pointerdown',
  () => {
    unlockAudio();
  },
  { passive: true },
);

function buildBlessings() {
  const wrap = $('blessing-cards');
  wrap.innerHTML = '';
  if (!game.blessingChoices) return;
  game.blessingChoices.forEach((choice, i) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'blessing-card';
    card.dataset.id = choice.id;
    card.innerHTML = `
      <span class="hotkey">${i + 1}</span>
      <span class="icon" aria-hidden="true">${ICONS[choice.id] || '✦'}</span>
      <span class="b-name">${choice.name}</span>
      <p class="b-desc">${choice.desc}</p>
    `;
    card.addEventListener('click', () => chooseBlessing(i));
    wrap.appendChild(card);
  });
}

function chooseBlessing(index) {
  if (game.state !== 'blessing') return;
  if (game.chooseBlessing(index)) {
    paused = false;
    syncScreens();
  }
}

const SHOP_ICONS = {
  pike: '⟋',
  bow: '➶',
  shuriken: '✦',
  knives: '⌁',
  bomb: '◉',
  tonic: '✚',
  smoke: '☁',
  whetstone: '▰',
  arrows: '➳',
  flask: '✚',
  sigil_ember: '✹',
  sigil_iron: '⛊',
  sigil_wind: '≋',
  sigil_vow: '✧',
  ritual_purge: '☼',
  ritual_ward: '☩',
  ritual_ember: '✺',
  ritual_mend: '❈',
};

const SHOP_TYPE_LABEL = {
  weapon: 'SENJATA',
  consumable: 'KONSUMABEL',
  ammo: 'AMUNISI',
  flask: 'BEKAL',
  sigil: 'SIGIL',
  ritual: 'RITUAL',
};

function shopItemState(item) {
  const p = game.player;
  if (item.type === 'weapon' && p.weapons.includes(item.id)) {
    return { disabled: true, label: 'DIMILIKI', note: 'Tekan X untuk berganti senjata.', owned: true };
  }
  if (item.type === 'sigil' && p.sigils.includes(item.id)) {
    return { disabled: true, label: 'AKTIF', note: 'Sigil ini sudah menyatu dengan sumpahmu.', owned: true };
  }
  if (item.type === 'ammo' && !p.weapons.includes('bow')) {
    return { disabled: true, label: 'BUTUH BUSUR', note: 'Beli Busur Abu terlebih dahulu.' };
  }
  if (item.type === 'flask' && p.flasks >= p.maxFlasks) {
    return { disabled: true, label: 'FLASK PENUH', note: 'Bekalmu masih penuh.' };
  }
  if (game.ash < item.cost) {
    return { disabled: true, label: `✦ ${item.cost}`, note: 'Abu tidak cukup.', poor: true };
  }
  return { disabled: false, label: `BELI · ✦ ${item.cost}`, note: '' };
}

function buildShop() {
  const wrap = $('shop-items');
  if (!wrap) return;
  $('shop-ash').textContent = game.ash;
  wrap.innerHTML = SHOP_ITEMS.map((item) => {
    const state = shopItemState(item);
    const cls = [
      'shop-card',
      state.owned ? 'owned' : '',
      state.disabled ? 'disabled' : '',
      state.poor ? 'poor' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return `
      <article class="${cls}" data-item="${item.id}">
        <span class="shop-icon" aria-hidden="true">${item.glyph || SHOP_ICONS[item.id] || '✦'}</span>
        <span class="shop-type">${SHOP_TYPE_LABEL[item.type] || 'BARANG'}</span>
        <h3 class="shop-name">${item.name}</h3>
        <p class="shop-desc">${item.desc}</p>
        ${state.note ? `<p class="shop-note">${state.note}</p>` : ''}
        <button class="btn ${state.disabled ? 'btn-ghost' : 'btn-primary'} btn-small shop-buy" type="button"
          data-buy="${item.id}" ${state.disabled ? 'disabled' : ''}>${state.label}</button>
      </article>
    `;
  }).join('');
  wrap.querySelectorAll('[data-buy]').forEach((btn) => {
    btn.addEventListener('click', () => buyShopItem(btn.dataset.buy));
  });
}

function openShop(force = false) {
  if (!started || spectating || menuView !== 'none' || game.state !== 'playing') return false;
  if (!game.checkpoint || game.checkpointRoom !== game.roomIndex) {
    showToast('Warung Abu hanya ada di ruang menjelang bos.', 2200);
    return false;
  }
  if (!force && !game.canShop()) {
    showToast('Dekati Warung Abu, lalu tekan F.', 2200);
    return false;
  }
  paused = false;
  shopOpen = true;
  clearHeldKeys();
  buildShop();
  syncScreens();
  return true;
}

function closeShop() {
  if (!shopOpen) return;
  shopOpen = false;
  clearHeldKeys();
  lastTime = performance.now();
  accumulator = 0;
  syncScreens();
  updateHud();
}

function buyShopItem(id) {
  if (!shopOpen) return;
  const result = game.buyShopItem(id);
  if (!result.ok) {
    showToast(result.reason, 1800);
    return;
  }
  buildShop();
  updateHud();
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function statsHtml(items) {
  return items
    .map(
      ([value, label]) =>
        `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`,
    )
    .join('');
}

function fillDeathStats() {
  const room = ROOMS[game.roomIndex] || game.room || { name: 'Atlas' };
  if (activeRunKind === 'atlas') {
    const p = atlasState();
    p.stats.deaths = (Number(p.stats.deaths) || 0) + 1;
    saveProgress();
    $('death-sub').textContent = `Kau gugur di ${room.name}. Atlas mencatat kematianmu — bangkit dan coba lagi.`;
  } else {
    $('death-sub').textContent = `Kau gugur di ${room.name}. Sumpah belum tuntas — bangkit dan coba lagi.`;
  }
  $('death-stats').innerHTML = statsHtml([
    [formatTime(game.time), 'Waktu'],
    [game.kills, 'Terbunuh'],
    [game.blessings.length, 'Berkah'],
    [attempts, 'Percobaan'],
  ]);
}

function fillVictoryStats() {
  $('victory-stats').innerHTML = statsHtml([
    [formatTime(game.time), 'Total Waktu'],
    [game.kills, 'Terbunuh'],
    [game.blessings.length, 'Berkah'],
    [attempts, 'Percobaan'],
  ]);
  renderStageTimes('victory-times', activeRunKind);
  if (activeRunKind === 'atlas') {
    const p = atlasState();
    const endingId = p.endings[p.endings.length - 1];
    const ending = ATLAS_ENDINGS.find((entry) => entry.id === endingId);
    $('victory-blessings').textContent = ending
      ? `${ending.localName} — ${ending.desc}`
      : 'Atlas terbelah, dan satu halaman terakhir menutup dirinya.';
    return;
  }
  const names = game.blessings.map((id) => BLESSING_NAMES[id] || id);
  $('victory-blessings').textContent = names.length
    ? `Berkah yang kau bawa: ${names.join(' · ')}.`
    : 'Kau menolak semua berkah. Sumpah tetap tuntas.';
}

function showBanner(name, subtitle) {
  $('banner-name').textContent = name || '';
  $('banner-sub').textContent = (subtitle || '').toUpperCase();
  const el = $('banner');
  el.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

function showToast(text, ms = 1900) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

function syncScreens() {
  const s = game.state;
  const inMenu = menuView !== 'none';
  const inRun = started && !spectating && menuView === 'none';
  const covered = settingsOpen || hudLayoutOpen;

  $('moba-screen')?.classList.toggle('hidden', menuView !== 'moba' || covered);
  $('moba-battle')?.classList.toggle('hidden', !mobaActive || covered);
  $('wd-screen')?.classList.toggle('hidden', menuView !== 'wavedefense' || covered);
  $('wd-battle')?.classList.toggle('hidden', !wdActive || covered);
  $('pirate-screen')?.classList.toggle('hidden', menuView !== 'pirates' || covered);
  $('pirate-battle')?.classList.toggle('hidden', !pirateActive || covered);

  $('title-screen').classList.toggle('hidden', menuView !== 'title' || covered);
  $('levels-screen').classList.toggle('hidden', menuView !== 'levels' || covered);
  $('credits-screen').classList.toggle('hidden', menuView !== 'credits' || covered);
  $('updates-screen').classList.toggle('hidden', menuView !== 'updates' || covered);
  $('storymap-screen')?.classList.toggle('hidden', menuView !== 'storymap' || covered);
  $('character-screen').classList.toggle('hidden', menuView !== 'character' || covered);
  $('scary-screen')?.classList.toggle('hidden', menuView !== 'scary' || covered);
  $('dread-screen')?.classList.toggle('hidden', menuView !== 'dread' || covered);
  $('veil-screen')?.classList.toggle('hidden', menuView !== 'veil' || covered);
  $('eternal-screen')?.classList.toggle('hidden', menuView !== 'eternal' || covered);
  $('archive-screen')?.classList.toggle('hidden', menuView !== 'archive' || covered);
  $('archive-preview-screen')?.classList.toggle('hidden', !(menuView === 'archive' && archivePreviewId) || covered);
  $('expansion-screen').classList.toggle('hidden', menuView !== 'expansion' || covered);
  $('eclipse-screen')?.classList.toggle('hidden', menuView !== 'eclipse' || covered);
  $('frontier-screen').classList.toggle('hidden', menuView !== 'frontier' || covered);
  $('mode3d-screen').classList.toggle('hidden', menuView !== 'mode3d' || covered);
  $('overdrive-screen')?.classList.toggle('hidden', menuView !== 'overdrive' || covered);
  $('atlas-screen')?.classList.toggle('hidden', menuView !== 'atlas' || covered);
  $('labyrinth-screen')?.classList.toggle('hidden', menuView !== 'labyrinth' || covered);
  $('trials-screen')?.classList.toggle('hidden', menuView !== 'trials' || covered);
  $('puzzle-screen')?.classList.toggle('hidden', menuView !== 'puzzle' || covered);
  $('puzzle-play-screen')?.classList.toggle('hidden', menuView !== 'puzzlePlay' || covered);
  $('court-screen')?.classList.toggle('hidden', menuView !== 'court' || covered);
  $('fairy-screen')?.classList.toggle('hidden', menuView !== 'fairy' || covered);
  $('fallen-menu-screen')?.classList.toggle('hidden', menuView !== 'fallenMenu' || covered);
  $('fallen-screen')?.classList.toggle('hidden', menuView !== 'fallen' || covered);
  $('fallen-ending-screen')?.classList.toggle('hidden', !(fallenEndingOpen && started));
  $('crusade-menu-screen')?.classList.toggle('hidden', menuView !== 'crusadeMenu' || covered);
  $('crusade-screen')?.classList.toggle('hidden', menuView !== 'crusade' || covered);
  $('crusade-clear-screen')?.classList.toggle('hidden', !(crusadeClearOpen && started));
  $('rift-screen')?.classList.toggle('hidden', menuView !== 'rift' || covered);
  $('speedrun-screen')?.classList.toggle('hidden', menuView !== 'speedrun' || covered);
  $('editor-screen')?.classList.toggle('hidden', menuView !== 'editor' || covered);
  $('fishing-screen')?.classList.toggle('hidden', menuView !== 'fishing' || covered);
  $('bait-shop-screen')?.classList.toggle('hidden', menuView !== 'baitShop' || covered);
  $('fish-index-screen')?.classList.toggle('hidden', menuView !== 'fishIndex' || covered);
  $('speedrun-summary-screen')?.classList.toggle('hidden', !speedrunSummaryOpen);
  $('custom-clear-screen')?.classList.toggle('hidden', !isCustomClearOpen());
  $('lab-reward-screen')?.classList.toggle('hidden', !labRewardsOpen);
  $('lab-summary-screen')?.classList.toggle('hidden', !labSummaryOpen);
  if (!inRun || activeRunKind !== 'atlas') $('atlas-quickbar')?.classList.add('hidden');
  $('prologue-screen').classList.toggle('hidden', !prologueActive);
  $('cutscene-screen')?.classList.toggle('hidden', !cutsceneActive);
  $('credit-scene-screen')?.classList.toggle('hidden', !creditSceneOpen);
  $('trailer-screen')?.classList.toggle('hidden', menuView !== 'trailer' || covered);
  $('spectate-ui').classList.toggle('hidden', !spectating);
  $('map-screen').classList.toggle('hidden', !mapOpen);
  $('codex-screen').classList.toggle('hidden', !codexOpen);
  $('inventory-screen').classList.toggle('hidden', !inventoryOpen);
  $('settings-screen').classList.toggle('hidden', !settingsOpen);
  $('hud-layout-screen')?.classList.toggle('hidden', !hudLayoutOpen);
  $('dialogue-screen').classList.toggle('hidden', !dialogueOpen);

  $('pause-screen').classList.toggle('hidden', !(inRun && paused && !shopOpen && !hunterShopOpen && s === 'playing') || covered);
  $('shop-screen').classList.toggle('hidden', !(inRun && shopOpen));
  $('hunter-shop-screen')?.classList.toggle('hidden', !hunterShopOpen);
  $('blessing-screen').classList.toggle('hidden', !(inRun && !paused && !shopOpen && s === 'blessing'));
  $('dead-screen').classList.toggle('hidden', !(inRun && s === 'dead' && activeRunKind !== 'labyrinth' && activeRunKind !== 'speedrun'));
  $('victory-screen').classList.toggle('hidden', !(inRun && s === 'victory' && activeRunKind !== 'fallen' && activeRunKind !== 'crusade'));

  const hudVisible = inRun && !paused && !shopOpen && !hunterShopOpen && !mapOpen && !codexOpen && !inventoryOpen && !dialogueOpen
    && !settingsOpen && !cutsceneActive
    && (s === 'playing' || s === 'blessing');
  $('hud').classList.toggle('hidden', !hudVisible);
  $('veil-hud')?.classList.toggle('hidden', !(hudVisible && (activeRunKind === 'veil' || activeRunKind === 'eternal')));
  $('trial-hud')?.classList.toggle('hidden', !(inRun && activeRunKind === 'trials' && !paused && s === 'playing'));
  $('touch').classList.toggle(
    'hidden',
    !(touchEnabled && inRun && !paused && !shopOpen && !mapOpen && !codexOpen && !inventoryOpen && !dialogueOpen && !settingsOpen && s === 'playing'),
  );

  if (inRun && !inMenu && s !== lastGameState) {
    if (s === 'blessing') buildBlessings();
    if (s === 'dead') {
      if (activeRunKind === 'speedrun') finishSpeedrun();
      else fillDeathStats();
    }
    if (s === 'victory') fillVictoryStats();
    lastGameState = s;
  }
  if (!inRun) lastGameState = s;
}

let flaskCache = -1;
let relicCache = null;
let hpCache = '';
let roomHudCache = '';
let speedBadgeCache = '';

function updateHud() {
  if (!started || menuView !== 'none' || spectating) return;
  const hud = game.hud;
  const pct = Math.max(0, Math.min(1, hud.hp / hud.maxHp)) * 100;
  // The HUD updates every frame, so only touch the DOM when a value changed.
  const hpKey = `${hud.hp}/${hud.maxHp}/${Math.round(pct * 10)}`;
  if (hpKey !== hpCache) {
    hpCache = hpKey;
    $('hp-fill').style.width = `${pct}%`;
    $('hp-text').textContent = `${hud.hp} / ${hud.maxHp}`;
  }

  if (flaskCache !== hud.flasks) {
    flaskCache = hud.flasks;
    const slots = [];
    for (let i = 0; i < game.player.maxFlasks; i++) {
      slots.push(`<span class="flask ${i < hud.flasks ? 'filled' : ''}"></span>`);
    }
    $('flasks').innerHTML = slots.join('');
  }

  if (relicCache !== hud.relic) {
    relicCache = hud.relic;
    $('relic-badge').classList.toggle('owned', hud.relic);
    $('relic-badge').textContent = hud.relic ? '✦ BULU BARA' : '✦ TERKUNCI';
  }

  const roomKey = `${hud.roomName}|${game.room.subtitle || ''}`;
  if (roomKey !== roomHudCache) {
    roomHudCache = roomKey;
    $('room-name').textContent = hud.roomName;
    $('room-sub').textContent = (game.room.subtitle || '').toUpperCase();
  }

  const speedBadge = $('speedrun-badge');
  if (speedBadge) {
    if (activeRunKind === 'speedrun' && speedrunRun) {
      speedBadge.classList.remove('hidden');
      const badgeKey = `${speedrunRun.multiplier}/${speedrunRun.cycle}`;
      if (badgeKey !== speedBadgeCache) {
        speedBadgeCache = badgeKey;
        speedBadge.textContent = `⚡ ${speedrunRun.multiplier}× · ${SPEEDRUN_LIVES} NYAWA · PUTARAN ${speedrunRun.cycle + 1}`;
      }
      speedBadge.classList.toggle('danger', speedrunRun.multiplier >= 5);
    } else {
      speedBadgeCache = '';
      speedBadge.classList.add('hidden');
    }
  }

  const customBadge = $('custom-badge');
  if (customBadge) {
    const info = activeRunKind === 'custom' && started ? mapEditorCtrl?.hudBadge() : null;
    if (info) {
      customBadge.classList.remove('hidden');
      if (info.text !== customBadgeCache) {
        customBadgeCache = info.text;
        customBadge.textContent = info.text;
      }
      customBadge.classList.toggle('urgent', info.urgent);
    } else {
      customBadgeCache = '';
      customBadge.classList.add('hidden');
    }
  }

  const frontierBadge = $('frontier-badge');
  if (frontierBadge) {
    if (activeRunKind === 'frontiers' && started && activeFrontierIndex >= 0) {
      const room = frontierRoomForIndex(activeFrontierIndex);
      const text = room
        ? `🜂 LV ${room.frontierLevel} · ${frontierChapterMetaFor(room.frontierChapter).english.toUpperCase()}`
        : '';
      frontierBadge.classList.remove('hidden');
      if (text !== frontierBadgeCache) {
        frontierBadgeCache = text;
        frontierBadge.textContent = text;
      }
    } else {
      frontierBadgeCache = '';
      frontierBadge.classList.add('hidden');
    }
  }

  const overdriveBadge = $('overdrive-badge');
  if (overdriveBadge) {
    if (activeRunKind === 'overdrive' && started && activeOverdriveIndex >= 0) {
      const room = overdriveRoomForIndex(activeOverdriveIndex);
      const st = overdriveState();
      const { spell } = overdriveSpellFor(st.activeSchool, st.activeSpellIndex);
      const mana = Math.round(game.player?.overdriveMana ?? 100);
      const text = room
        ? `⚡ OVD LV ${room.overdriveLevel} · BAB ${room.overdriveChapter} · MANA ${mana} · [Q] ${spell.name.toUpperCase()}`
        : '';
      overdriveBadge.classList.remove('hidden');
      if (text !== overdriveBadgeCache) {
        overdriveBadgeCache = text;
        overdriveBadge.textContent = text;
      }
    } else {
      overdriveBadgeCache = '';
      overdriveBadge.classList.add('hidden');
    }
  }

  const p = game.player;
  $('ash-count').textContent = game.ash;
  const weapon = WEAPONS[p.weapon] || WEAPONS.sword;
  $('weapon-badge').textContent = weapon.short;
  $('weapon-badge').dataset.weapon = p.weapon;
  if (WEAPONS[p.weapon]?.ammo === 'arrows') {
    $('ammo-badge').textContent = `PANAH ${p.arrows}`;
    $('ammo-badge').classList.toggle('empty', p.arrows <= 0);
  } else {
    const quick = game.quickItemInfo();
    $('ammo-badge').textContent = `${quick.name} ${quick.count}`;
    $('ammo-badge').classList.toggle('empty', quick.count <= 0);
  }

  const abilityBadge = $('ability-badge');
  if (abilityBadge) {
    if (p.ability) {
      abilityBadge.classList.remove('hidden');
      if (p.abilityCooldown > 0) {
        abilityBadge.textContent = `⚡ ${p.ability.name.toUpperCase()} (${p.abilityCooldown.toFixed(1)}s)`;
        abilityBadge.classList.add('cooldown');
        abilityBadge.classList.remove('ready');
      } else {
        abilityBadge.textContent = `⚡ ${p.ability.name.toUpperCase()} [${formatCode(settings.bindings.ability?.[0])}]`;
        abilityBadge.classList.add('ready');
        abilityBadge.classList.remove('cooldown');
      }
    } else {
      abilityBadge.classList.add('hidden');
    }
  }

  const resBadge = $('resonance-badge');
  if (resBadge) {
    const rank = game.resonanceRank || 'D';
    const pct = Math.round(game.resonance || 0);
    resBadge.textContent = `✦ RESONANCE ${rank}${pct > 0 ? ` · ${pct}%` : ''}`;
    resBadge.classList.toggle('rank-ashen', rank === 'ASHEN');
    resBadge.classList.toggle('rank-s', rank === 'S');
  }

  const riftBadge = $('rift-badge');
  if (riftBadge) {
    const inRift = !!game.room?.rift;
    riftBadge.classList.toggle('hidden', !inRift);
    if (inRift) {
      const cd = p.phaseShiftCooldown || 0;
      const phaseLabel = game.fracturePhase === 0 ? 'A' : 'B';
      riftBadge.textContent = cd > 0
        ? `◈ FASA ${phaseLabel} (${cd.toFixed(1)}s)`
        : `◈ FASA ${phaseLabel} [F]`;
      riftBadge.classList.toggle('phase-a', game.fracturePhase === 0);
      riftBadge.classList.toggle('cooldown', cd > 0);
    }
  }

  const boss = hud.boss;
  $('boss-wrap').classList.toggle('hidden', !boss);
  if (boss) {
    $('boss-name').textContent = boss.name;
    $('boss-title').textContent = boss.title;
    $('boss-fill').style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
    const phase = $('boss-phase');      const roman = ['I', 'II', 'III', 'IV', 'V', 'VI'][boss.phase - 1] || String(boss.phase);
    phase.textContent = `FASE ${roman}`;
    phase.classList.toggle('on', boss.phase > 1);
  }

  const gate = hud.gate;
  let hint = '';
  if (game.state === 'playing') {
    if (gate && !gate.open && game.isNearGate()) hint = gate.reason;
    else if (hud.boss && game.boss && game.boss.intro > 0) hint = `${hud.boss.name} — ${hud.boss.title}`;
    else hint = hud.hint || '';
    if (game.canShop()) hint = `Tekan ${formatCode(settings.bindings.interact?.[0])} — Warung Abu`;
  }
  $('hint').textContent = hint;
  renderAtlasQuickbar();
  updateLabHud();
}

// ── game loop ────────────────────────────────────────────────────────────
/** Update X: route a confirmed hit into the Scary Mode director. */
function handlePlayerHurt(ev) {
  if (!scareDirector) return null;
  const effect = scareDirector.onPlayerHit(
    { source: ev.source || {}, x: ev.source?.x || 0, y: ev.source?.y || 0 },
    {
      hp: game.player.hp,
      menu: menuView !== 'none' || settingsOpen || mapOpen || codexOpen || inventoryOpen,
      paused,
      uiOpen: shopOpen || labRewardsOpen || labSummaryOpen,
      loading: false,
      cinematic: prologueActive || cutsceneActive || !!game.awaitingBlessing,
      dialogue: dialogueOpen,
      dead: game.state !== 'playing',
      difficultyMul: 1,
    },
  );
  if (effect) audio.playScare(effect);
  return effect;
}

/** Settings-screen preview: real effect + real sting, without combat. */
function previewScare() {
  if (!scareDirector) scareDirector = new ScareDirector(settings.scary || {}, { seed: 20261119 });
  scareDirector.configure(settings.scary || {}, settings.accessibility);
  const effect = scareDirector.preview({ type: 'sentinel' });
  if (!effect) return false;
  audio.playScare(effect);
  const overlay = $('scare-preview');
  if (overlay) {
    overlay.className = `scare-preview active intensity-${effect.intensity} shake-${Math.round(effect.shake * 10)}`;
    overlay.querySelector('[data-scare-line]').textContent = effect.profile.line;
    overlay.querySelector('[data-scare-name]').textContent = effect.profile.label;
    clearTimeout(previewScare.timer);
    previewScare.timer = setTimeout(() => {
      overlay.className = 'scare-preview';
    }, effect.duration * 1000);
  }
  return true;
}

function debugUnlocked() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('dev') === '1' || localStorage.getItem('ashen-vow-dev') === '1';
  } catch {
    return false;
  }
}

function buildDebugPanels() {
  if (!debugOpen) return;
  const aiPanel = $('debug-ai');
  const bossPanel = $('debug-boss');
  const scarePanel = $('debug-scare');
  if (aiPanel) {
    const rows = game.aiDebug();
    aiPanel.innerHTML = rows.length
      ? rows.map((e) => `<div class="debug-row"><b>${esc(e.id)}</b><span>${esc(e.state)}</span><em>${esc(e.profile)}</em><small>aggro ${e.aggro ? 'Y' : 'N'} · path ${e.pathLength} · stuck ${e.stuckEvents} · repath ${e.repaths} · ${e.grounded ? 'grounded' : 'air'}</small></div>`).join('')
      : '<p class="debug-empty">Tidak ada musuh aktif.</p>';
  }
  if (bossPanel) {
    const snap = bossDebugSnapshot(game.boss);
    bossPanel.innerHTML = snap
      ? `<div class="debug-row"><b>${esc(snap.kind)}</b><span>fase ${snap.phase}/${snap.maxPhases}</span><em>${snap.hp}/${snap.maxHp}</em><small>state ${esc(snap.state || '-')} · attack ${esc(snap.activeAttack || '-')} · hitbox ${snap.hitboxes.length} · vx ${snap.velocity.vx} vy ${snap.velocity.vy} · ${snap.grounded ? 'grounded' : 'air'} · arena ${snap.inArena ? 'ok' : 'OUT'} · invuln ${snap.invulnerable ? 'Y' : 'N'}</small></div>`
      : '<p class="debug-empty">Tidak ada boss aktif.</p>';
  }
  if (scarePanel) {
    const snap = scareDirector ? scareDirector.snapshot() : null;
    scarePanel.innerHTML = snap
      ? `<div class="debug-row"><b>${snap.enabled ? 'ON' : 'OFF'}</b><span>${esc(snap.activeState)}</span><em>${esc(snap.intensity)}</em><small>source ${esc(snap.triggerSource || '-')} · fx ${esc(snap.presentation || '-')} · cooldown ${snap.cooldown}s · eligibility ${esc(snap.eligibility)} · audio ${esc(snap.audio)}</small></div>`
      : '<p class="debug-empty">Director belum aktif.</p>';
  }
}

function openDebug() {
  if (!debugUnlocked() && !debugOpen) return false;
  debugOpen = true;
  $('debug-screen')?.classList.add('active');
  buildDebugPanels();
  return true;
}

function closeDebug() {
  debugOpen = false;
  $('debug-screen')?.classList.remove('active');
}

function toggleAiDebug() {
  aiDebugOpen = !aiDebugOpen;
  return aiDebugOpen;
}

function drainEvents() {
  if (!game.events.length) return;    const events = game.events.splice(0, game.events.length);
    for (const ev of events) {
      if (ev.type === 'bossDown' && activeRunKind !== 'custom') maybeCreditScene(ev);
      if (ev.type === 'playerHurt') handlePlayerHurt(ev);
      if (ev.type === 'spiritDown') {
        hunterReward(hunterState, ev.marks, Date.now());
        hunterState.banished = (Number(hunterState.banished) || 0) + 1;
        saveHunterState();
        showToast(`ROH DIUSIR · ${ev.name || ev.kind} · ◈ +${ev.marks}`, 1700);
      } else if (ev.type === 'hunterItemUse') {
        syncHunterFromGame();
        showToast(`${ev.name} · ${ev.stunned ? `${ev.stunned} roh distun` : 'efek aktif'} · sisa ${ev.remaining}`, 1700);
      } else if (ev.type === 'hunterWard') {
        showToast(`JIMAT PENJAGA · damage roh −${ev.reduction}%`, 1300);
      }
      if (ev.type === 'gatePass') recordStageTime(ev.from, activeStage?.label);
      else if (ev.type === 'bossDown' && activeRunKind !== 'custom') recordStageTime(ev.room, ev.name);
      else if (ev.type === 'roomEnter') beginStage(ev.room, ev.name);
      if ((ev.type === 'bossDown' || ev.type === 'labyrinthBossDown') && activeRunKind !== 'custom') awardBossSkillPoints(ev.kind, ev.name);
      const activeRun = started && !spectating && menuView === 'none';
    if (activeRun && !paused) audio.play(ev);
    if (activeRun) {
      if (activeRunKind === 'speedrun') {
        if (ev.type === 'gatePass') speedrunRoomCount += 1;
        if (ev.type === 'bossDown' && ev.kind === 'oathbreaker') speedrunCleared = true;
      } else if (activeRunKind === 'pack') {
        if (ev.type === 'bossDown') handlePackBoss(ev);
      } else if (activeRunKind === 'court') {
        if (ev.type === 'gatePass') {
          const from = ev.from - COURT_ROOM_START;
          if (COURT_ROOM_BY_ID[ev.from] && !activeCourtTrial) {
            recordCourtClear(courtState(), from);
            saveProgress();
          }
          if (activeCourtTrial?.id === 'glass_gauntlet') {
            courtTrialHeal(COURT_TRIAL_BY_ID.glass_gauntlet?.heal || 0);
          }
          if (COURT_ROOM_BY_ID[ev.to]) activeCourtRoom = ev.to;
        } else if (ev.type === 'bossDown') {
          handleCourtBoss(ev);
        } else if (ev.type === 'roomEnter' && COURT_ROOM_BY_ID[ev.room]) {
          activeCourtRoom = ev.room;
        }
      } else if (activeRunKind === 'atlas') {
        if (ev.type === 'gatePass') {
          const p = atlasState();
          if (ATLAS_ROOM_BY_ID[ev.from]) {
            const result = completeAtlasRoom(p, ev.from);
            if (result.firstClear) saveProgress();
          }
          if (ATLAS_ROOM_BY_ID[ev.to]) activeAtlasRoom = ev.to;
        } else if (ev.type === 'bossDown') {
          handleAtlasBoss(ev);
        } else if (ev.type === 'roomEnter' && ATLAS_ROOM_BY_ID[ev.room]) {
          activeAtlasRoom = ev.room;
        }
      } else if (activeRunKind === 'expansion') {
        if (ev.type === 'gatePass') {
          const from = ev.from - EXPANSION_ROOM_START;
          const to = ev.to - EXPANSION_ROOM_START;
          if (Number.isInteger(from) && from >= 0 && from < TOTAL_LEVELS) markExpansionCleared(from);
          if (Number.isInteger(to) && to >= 0 && to < TOTAL_LEVELS) activeExpansionIndex = to;
        } else if (ev.type === 'bossDown') {
          const local = ev.room - EXPANSION_ROOM_START;
          if (Number.isInteger(local) && local >= 0 && local < TOTAL_LEVELS) handleExpansionBoss(local, ev);
        } else if (ev.type === 'collectible') {
          handleExpansionCollectible(ev);
        } else if (ev.type === 'echoGain') {
          handleExpansionEcho(ev);
        } else if (ev.type === 'campaignComplete') {
          handleExpansionCampaignComplete();
        }
      } else if (activeRunKind === 'fairy') {
        if (ev.type === 'gatePass') {
          const from = FAIRY_ROOM_BY_ID[ev.from];
          if (from?.fairyStage) {
            recordFairyStage(fairyState(), from.fairyStage - 1);
            saveProgress();
          }
          const to = FAIRY_ROOM_BY_ID[ev.to];
          if (to?.fairyStage) {
            activeFairyStage = to.fairyStage - 1;
            activeFairyBoss = null;
          } else if (to?.fairyBoss) {
            activeFairyBoss = to.fairyBoss;
            activeFairyStage = -1;
          }
        } else if (ev.type === 'bossDown') {
          handleFairyBoss(ev);
        } else if (ev.type === 'roomEnter') {
          const room = FAIRY_ROOM_BY_ID[ev.room];
          if (room?.fairyStage) {
            activeFairyStage = room.fairyStage - 1;
            activeFairyBoss = null;
          } else if (room?.fairyBoss) {
            activeFairyBoss = room.fairyBoss;
            activeFairyStage = -1;
            if (room.fairyBoss === 'dragon') playFinalBossCutscene();
          }
        }
      } else if (activeRunKind === 'cistern') {
        if (ev.type === 'gatePass') {
          const from = cisternStageForRoom(ev.from);
          if (from) {
            if (from.secret) recordCisternSecret(cisternState(), from.room.cisternKey);
            else recordCisternStage(cisternState(), from.local);
          }
          const to = cisternStageForRoom(ev.to);
          if (to) {
            activeCisternStage = to.local;
            discoverCisternRoom(to.local);
          }
          saveProgress();
          buildCisternCards();
        } else if (ev.type === 'bossDown') {
          if (ev.kind === 'tidebound') handleCisternBoss(ev);
        } else if (ev.type === 'roomEnter') {
          const stage = cisternStageForRoom(ev.room);
          if (stage) {
            activeCisternStage = stage.local;
            discoverCisternRoom(stage.local);
          }
        }
      } else if (activeRunKind === 'lanternwake') {
        if (ev.type === 'gatePass') {
          const from = lanternStageForRoom(ev.from);
          if (from && !from.room.boss) recordLanternStage(lanternState(), from.local);
          const to = lanternStageForRoom(ev.to);
          if (to) {
            activeLanternStage = to.local;
            discoverLanternRoom(to.local);
          }
          saveProgress();
          buildLanternwakeCards();
        } else if (ev.type === 'bossDown') {
          if (ev.kind === 'wickbearer') handleLanternwakeBoss();
        } else if (ev.type === 'roomEnter') {
          const stage = lanternStageForRoom(ev.room);
          if (stage) {
            activeLanternStage = stage.local;
            discoverLanternRoom(stage.local);
          }
        }
      } else if (activeRunKind === 'frontiers') {
        if (ev.type === 'gatePass') {
          const from = frontierIndexForRoom(ev.from);
          if (from >= 0) handleFrontierLevelClear(from);
          const to = frontierIndexForRoom(ev.to);
          if (to >= 0) {
            activeFrontierIndex = to;
            const state = frontierState();
            state.discovered[to] = true;
            saveProgress();
          }
          buildFrontierScreen();
        } else if (ev.type === 'bossDown') {
          const index = frontierIndexForRoom(ev.room);
          if (index >= 0) handleFrontierLevelClear(index);
        } else if (ev.type === 'roomEnter') {
          const index = frontierIndexForRoom(ev.room);
          if (index >= 0) {
            activeFrontierIndex = index;
            frontierState().discovered[index] = true;
          }
        }
      } else if (activeRunKind === 'overdrive') {
        if (ev.type === 'gatePass') {
          const from = overdriveIndexForRoom(ev.from);
          if (from >= 0) handleOverdriveLevelClear(from);
          const to = overdriveIndexForRoom(ev.to);
          if (to >= 0) {
            activeOverdriveIndex = to;
            const state = overdriveState();
            state.discovered[to] = true;
            saveProgress();
          }
          buildOverdriveScreen();
        } else if (ev.type === 'bossDown') {
          const index = overdriveIndexForRoom(ev.room);
          if (index >= 0) handleOverdriveLevelClear(index);
        } else if (ev.type === 'roomEnter') {
          const index = overdriveIndexForRoom(ev.room);
          if (index >= 0) {
            activeOverdriveIndex = index;
            overdriveState().discovered[index] = true;
          }
        }
      } else if (activeRunKind === 'trials') {
        if (ev.type === 'labyrinthBossDown') handleTrialBoss(ev);
      } else if (activeRunKind === 'labyrinth') {
        handleLabEvent(ev);
      } else if (activeRunKind === 'crusade') {
        if (ev.type === 'gatePass') {
          const from = CRUSADE_ROOM_BY_ID[ev.from];
          if (from && !from.crusadeBoss) {
            recordCrusadeRoom(crusadeState(), from.id);
            saveProgress();
          }
          const to = CRUSADE_ROOM_BY_ID[ev.to];
          if (to) {
            activeCrusadeLevel = to.crusadeLevel ? to.crusadeLevel - 1 : 0;
            activeCrusadeBoss = to.crusadeBoss || null;
          }
        } else if (ev.type === 'bossDown') {
          handleCrusadeBoss(ev);
        } else if (ev.type === 'roomEnter') {
          const room = CRUSADE_ROOM_BY_ID[ev.room];
          if (room) {
            activeCrusadeLevel = room.crusadeLevel ? room.crusadeLevel - 1 : 0;
            activeCrusadeBoss = room.crusadeBoss || null;
            for (const enemy of room.enemies || []) {
              const state = crusadeState();
              if (CRUSADE_ENEMY_INFO[enemy.type] && !state.archive.bestiary.includes(enemy.type)) {
                state.archive.bestiary.push(enemy.type);
                saveProgress();
              }
            }
          }
        } else if (ev.type === 'purityHit' && ev.broke) {
          showToast('Purity Shield pecah — barisan itu bisa dilukai.', 1800);
        }
      } else if (activeRunKind === 'astral') {
        if (ev.type === 'gatePass') {
          const room = ALL_ROOMS[ev.from];
          if (room?.astral) {
            recordAstralRoomClear(progress.astral, room);
            saveProgress();
          }
        } else if (ev.type === 'bossDown') {
          const room = ALL_ROOMS[ev.room];
          if (room?.astral) {
            const result = recordAstralRoomClear(progress.astral, room);
            saveProgress();
            if (result?.ok) showToast(result.final ? 'THE ARCHITECT OF ETERNITY GUGUR — The Unwritten Expanse mulai terlihat.' : 'Wilayah Astral ditaklukkan.', 3000);
          }
        }
      } else if (activeRunKind === 'rift') {
        if (ev.type === 'gatePass') {
          progress.rift = recordRiftRoom(progress.rift, ev.from);
          saveProgress();
        } else if (ev.type === 'bossDown') {
          progress.rift = recordRiftBoss(progress.rift, ev.kind);
          saveProgress();
          if (ev.kind === 'rift_devilish_scum') {
            showToast('THE DEVILISH SCUM TUMBANG — Arc IV: The Rift ditaklukkan!', 3200);
          } else {
            showToast(`◈ Bos Celah gugur: ${ev.name}`, 2400);
          }
        }
      } else if (activeRunKind === 'eclipse') {
        if (ev.type === 'gatePass') {
          const room = ECLIPSE_ROOM_BY_ID[ev.from];
          if (room?.eclipseStandard) {
            const result = recordEclipseRoom(progress.eclipse, ev.from);
            if (result.first) saveProgress();
          }
        } else if (ev.type === 'bossDown') {
          const room = ECLIPSE_ROOM_BY_ID[ev.room];
          const source = [...ECLIPSE_BOSSES, ECLIPSE_SECRET_BOSS].find((boss) => boss.kind === ev.kind);
          if (room && source) {
            const result = recordEclipseBoss(progress.eclipse, source.id);
            grantMastery(progress.awakening, character.characterId, 12);
            saveProgress();
            if (result.ok) {
              const fragment = result.fragment;
              showToast(result.first ? `${ev.name} gugur.${fragment ? ` Pecahan terbaca (${progress.eclipse.fragments.length}/6).` : ''}` : `${ev.name} kembali gugur.`, 2800);
              if (result.secret && !progress.eclipse.firstAuthor) showToast('ENAM PECAHAN TERBACA — The First Author menunggu di halaman terakhir.', 3600);
              if (source.final) showToast('ARC VIII SELESAI — Forgotten Pantheon tercatat.', 3400);
            }
          }
        } else if (ev.type === 'perfectDodge') {
          showToast('PERFECT DODGE — counter window terbuka.', 1000);
        } else if (ev.type === 'bossBreak') {
          showToast(`${ev.name} BREAK — stagger ${Math.round((ev.duration || 1.45) * 10) / 10}s.`, 1200);
        } else if (ev.type === 'elementalReaction') {
          showToast(`REACTION · ${ev.name}`, 1100);
        }
      } else if (activeRunKind === 'godfall') {
        if (ev.type === 'gatePass') {
          const floor = ev.from - GODFALL_ROOM_START + 1;
          if (floor >= 1 && floor <= GODFALL_FLOOR_COUNT && !godfallRun?.practice) {
            recordGodfallFloor(progress.godfall, godfallRun, floor);
            saveProgress();
          }
          if (godfallRun) godfallRun.floor = Math.min(GODFALL_FLOOR_COUNT, floor + 1);
          activeGodfallFloor = Math.min(GODFALL_FLOOR_COUNT, floor + 1);
        } else if (ev.type === 'bossDown') {
          const floor = ev.room - GODFALL_ROOM_START + 1;
          if (floor >= 1 && floor <= GODFALL_FLOOR_COUNT) {
            if (!godfallRun?.practice) {
              const result = recordGodfallFloor(progress.godfall, godfallRun, floor);
              saveProgress();
              if (result.reward) showToast(`GODFALL MILESTONE — ${result.reward.name}`, 3000);
            }
            if (floor === GODFALL_FLOOR_COUNT) {
              showToast('GODFALL 100 — The Ascension selesai.', 3600);
              if (godfallRun) godfallRun.state = 'victory';
            }
          }
        } else if (ev.type === 'perfectDodge') {
          if (godfallRun) godfallRun.perfects = (godfallRun.perfects || 0) + 1;
        }
      } else if (activeRunKind === 'raid') {
        if (ev.type === 'bossDown' && activeRaid) {
          activeRaid.state = 'victory';
          for (const objective of activeRaid.objectives) objective.done = true;
          const result = recordRaidResult(progress.guild, activeRaid);
          if (result.ok) {
            progress.guild = result.state;
            progress.guild = advanceGuildWeek(progress.guild, { raid: true, bosses: 1 });
            saveProgress();
            showToast(activeRaid.practice ? 'Raid practice selesai.' : `RAID CLEAR — ${result.reward || 'reward tercatat'}.`, 3000);
          }
        }
      } else if (activeRunKind === 'hack') {
        // Isolated testing session: deliberately no progression side effects.
      } else if (activeRunKind === 'fallen') {
        if (ev.type === 'gatePass') {
          const from = FALLEN_ROOM_BY_ID[ev.from];
          if (from && !from.fallenBoss && !from.fallenOptional) {
            recordFallenRoom(fallenState(), from.id);
            saveProgress();
          }
          const to = FALLEN_ROOM_BY_ID[ev.to];
          if (to) {
            activeFallenRegion = to.fallenRegion ? to.fallenRegion - 1 : 6;
            activeFallenBoss = to.fallenBoss || to.fallenOptional || null;
            if (typeof to.fallenSlot === 'number' && to.fallenSlot >= 0) activeFallenSlot = to.fallenSlot;
          }
        } else if (ev.type === 'bossDown') {
          handleFallenBoss(ev);
        } else if (ev.type === 'roomEnter') {
          const room = FALLEN_ROOM_BY_ID[ev.room];
          if (room) {
            activeFallenRegion = room.fallenRegion ? room.fallenRegion - 1 : 6;
            activeFallenBoss = room.fallenBoss || room.fallenOptional || null;
            if (typeof room.fallenSlot === 'number' && room.fallenSlot >= 0) activeFallenSlot = room.fallenSlot;
            for (const enemy of room.enemies || []) {
              const state = fallenState();
              if (FALLEN_ENEMY_INFO[enemy.type] && !state.archive.bestiary.includes(enemy.type)) {
                state.archive.bestiary.push(enemy.type);
                saveProgress();
              }
            }
          }
        } else if (ev.type === 'purityHit' && ev.broke) {
          showToast('Purity Shield pecah — cahaya pelindungnya padam.', 1800);
        }
      } else {
        if (ev.type === 'gatePass') markCleared(ev.from, ev.to);
        else if (ev.type === 'bossDown') {
          markCleared(ev.room, ev.next);
          if (ev.room === 7) ascendIfEligible();
        }
      }
    }
    if (!started) continue;
    if (ev.type === 'roomEnter') {
      if (activeRunKind === 'expansion' && ev.room >= EXPANSION_ROOM_START && ev.room < EXPANSION_ROOM_START + TOTAL_LEVELS) {
        activeExpansionIndex = ev.room - EXPANSION_ROOM_START;
      }
      if (activeRunKind === 'atlas' && ATLAS_ROOM_BY_ID[ev.room]) activeAtlasRoom = ev.room;
      discoverCurrentRoom(ev.room);
      showBanner(ev.name, ev.subtitle);
    } else if (ev.type === 'bossSpawn') showToast(`⚔ ${ev.name} — ${ev.title}`, 2400);
    else if (ev.type === 'relic') showToast('Relik Bulu Bara — lompat ganda terbuka', 2400);
    else if (ev.type === 'bossDialogue') queueDialogue(ev);
    else if (ev.type === 'bossPhase') {
      const roman = ['I', 'II', 'III'][ev.phase - 1] || String(ev.phase);
      showToast(`FASE ${roman} — ${ev.name} bangkit`, 2200);
    }
    else if (ev.type === 'respawn') showToast('Kau terlempar dari jurang');
    else if (ev.type === 'wallBroken') showToast(game.room?.cistern ? 'Dinding lumut hancur — relung karam terbuka.' : 'Dinding Miselium hancur — relung rahasia terbuka.', 2400);
    else if (ev.type === 'wallHit') showToast(`Dinding retak — ${ev.hp}/${ev.maxHp}`, 900);
    else if (ev.type === 'ultimate' && ev.crit) showToast(`ULTIMATE KRITIS — ${ev.name} ×${ev.scale}`, 1600);
    else if (ev.type === 'flaskReward') showToast(`Tegukan Akar — +1 flask (${ev.charges} total)`, 2600);
    else if (ev.type === 'bossDown') showToast(`${ev.name} gugur.`, 2200);
    else if (ev.type === 'blessingChosen') showToast(`Berkah: ${ev.name}`, 1600);
    else if (ev.type === 'checkpoint') showToast(`Checkpoint aktif — ${ev.name}`, 2000);
    else if (ev.type === 'checkpointRespawn') showToast('Bangkit di checkpoint — abu dan senjata tersimpan.', 2200);
    else if (ev.type === 'ashGain') showToast(`✦ +${ev.amount} ABU · total ${ev.total}`, 1300);
    else if (ev.type === 'shopBuy') showToast(`Dibeli: ${ev.name}`, 1700);
    else if (ev.type === 'itemUse') showToast(`Dipakai: ${ev.name}`, 1700);
    else if (ev.type === 'quickItem') showToast(`Item cepat: ${ev.name} ×${ev.count}`, 1200);
    else if (ev.type === 'explosion') showToast('Bom Bara meledak.', 900);
    else if (ev.type === 'buffEnd') showToast('Efek Batu Asah berakhir.', 1400);
    else if (ev.type === 'noAmmo') {
      const label = { arrow: 'Anak panah', knives: 'Pisau lempar', bomb: 'Bom bara', quick: 'Item cepat' }[ev.kind]
        || 'Shuriken';
      showToast(`${label} habis — beli di Warung Abu.`, 2100);
    } else if (ev.type === 'weaponSwitch') showToast(`Senjata: ${ev.name}`, 1200);
    else if (ev.type === 'roomCondition' && ev.condition) showToast(`${ev.weather ? `${ev.weather} · ` : ''}${ev.condition}`, 2600);
    else if (ev.type === 'npcHello') showToast(ev.line, 4600);
    else if (ev.type === 'bossForm') {
      showBanner(ev.name, ev.title);
      showToast(`${ev.arena === 'heaven' ? '☁ LANGIT TERBELAH' : ev.arena === 'hell' ? '🔥 NERAKA TERBUKA' : 'BENTUK BARU'} — ${ev.name}`, 3200);
    }
    else if (ev.type === 'echoGain' && activeRunKind === 'expansion') showToast(`✦ +${ev.amount} Gema · total ${ev.total}`, 1400);
  }
}

function desiredTrack() {
  if (prologueActive) return null;
  if (cutsceneActive) return cutsceneScene?.music || 'faewood';
  if (menuView === 'wavedefense' || menuView === 'wavedefenseBattle') return wdActive && wdMatch?.enemies.some((enemy) => enemy.boss) ? 'spiralBoss' : 'spiral';
  if (menuView === 'court') return 'hearth';
  if (menuView === 'fairy') return 'faewood';
  if (menuView === 'fallenMenu') return 'forgotten';
  if (menuView === 'fallen') return 'lastvigil';
  if (menuView === 'crusadeMenu') return 'hearth';
  if (menuView === 'crusade') return 'cinderworks';
  if (menuView === 'rift') return 'rift';
  if (menuView === 'eclipse') return 'forgotten';
  if (started && !spectating && menuView === 'none') {
    if (activeRunKind === 'rift') return game.boss && game.state === 'playing' ? 'riftBoss' : 'rift';
    if ((activeRunKind === 'eclipse' || activeRunKind === 'raid') && game.room) return game.boss && game.state === 'playing' ? 'bossJudge' : (game.room.music || 'forgotten');
    if (activeRunKind === 'godfall' && game.room) return game.boss && game.state === 'playing' ? 'bossJudge' : (game.room.music || 'lastvigil');
    if (game.state === 'victory') {
      if (activeRunKind === 'fairy' && game.roomIndex >= FAIRY_ROOM_START) return 'celebration';
      return 'victory';
    }
    if (activeRunKind === 'custom' && mapEditorCtrl) {
      return mapEditorCtrl.desiredTrack();
    }
    if (activeRunKind === 'labyrinth' && labRun) {
      if (game.boss) return 'boss';
      return LABYRINTH_ZONE_BY_ID[labRun.zoneId]?.music || 'ashen';
    }
    if (activeRunKind === 'fallen') {
      if (game.boss && game.state === 'playing') return bossTrackFor(game.boss.kind, game.boss._info?.music || 'bossDawn');
      return FALLEN_ROOM_BY_ID[game.roomIndex]?.music || 'forgotten';
    }
    if (activeRunKind === 'crusade') {
      if (game.boss && game.state === 'playing') return bossTrackFor(game.boss.kind, 'bossJudge');
      return CRUSADE_ROOM_BY_ID[game.roomIndex]?.music || 'cinderworks';
    }
    if (game.boss && game.state === 'playing') {
      return bossTrackFor(game.boss.kind, zoneForRoom(game.roomIndex).bossMusic || 'boss');
    }
    return zoneForRoom(game.roomIndex).music;
  }
  return 'menu';
}

function syncMusic(raw) {
  musicTick += raw;
  if (musicTick < 0.35) return;
  musicTick = 0;
  const wanted = desiredTrack();
  if (wanted) {
    if (audioUnlocked && (wanted !== desiredMusic || music.trackId !== wanted)) {
      music.crossfadeTo(wanted, desiredMusic ? 1.7 : 0.9);
    }
    desiredMusic = wanted;
  }
  if (started && !spectating && menuView === 'none' && game.state === 'playing' && !paused) {
    const bossFight = !!game.boss && !game.boss.dying;
    const near = game.enemies.some(
      (enemy) => Math.abs((enemy.x || 0) - game.player.x) < 380 && enemy.hp > 0,
    );
    music.setLayer('combat', bossFight || near ? 0.85 : 0);
    if (bossFight) music.setBossPhase(game.boss.phase, game.boss.maxPhases);
    else if (music.phaseLevel > 0.01) music.clearBossPhase();
  } else {
    music.setLayer('combat', 0);
    if (music.phaseLevel > 0.01) music.clearBossPhase();
  }
}

let menuRenderGate = 0;
let uiTimer = 0;
let slowFpsSamples = 0;
let fastFpsSamples = 0;

function adaptResolution() {
  const playing = started && menuView === 'none' && !paused && game.state === 'playing';
  if (!playing) {
    slowFpsSamples = 0;
    fastFpsSamples = 0;
    return;
  }
  if (fpsValue < 45) {
    slowFpsSamples += 1;
    fastFpsSamples = 0;
  } else if (fpsValue > 56) {
    fastFpsSamples += 1;
    slowFpsSamples = 0;
  } else {
    slowFpsSamples = 0;
    fastFpsSamples = 0;
  }
  if (slowFpsSamples >= 4 && renderer.pixelScale > 0.71) {
    renderer.setPixelScale(Math.max(0.7, renderer.pixelScale - 0.15));
    slowFpsSamples = 0;
  } else if (fastFpsSamples >= 6 && renderer.pixelScale < 0.99) {
    renderer.setPixelScale(Math.min(1, renderer.pixelScale + 0.1));
    fastFpsSamples = 0;
  }
}

function frame(now) {
  // Schedule first so an exception in a handler cannot permanently stop the loop.
  requestAnimationFrame(frame);
  const raw = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

  // Optional frame cap. Simulation uses a fixed timestep, so skipping a render
  // frame never changes physics.
  if (settings.gameplay.frameCap > 0) {
    const interval = 1000 / settings.gameplay.frameCap;
    if (now - renderGate < interval - 0.6) return;
    renderGate = now;
  }

  framePerf.sample(raw * 1000, performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0);

  // Scary Mode 2.0: events, presence, and difficulty sync. Never runs in menus.
  if (started && !paused && menuView === 'none') horrorTick(raw);
  if (started && !paused && menuView === 'none') dreadTick(raw);
  veilTick(raw);
  eternalTick(raw);

  fpsAccum += raw;
  fpsFrames += 1;
  if (fpsAccum >= 0.5) {
    fpsValue = Math.round(fpsFrames / fpsAccum);
    fpsAccum = 0;
    fpsFrames = 0;
    const badge = $('fps-badge');
    if (badge) badge.textContent = `${fpsValue} FPS`;
    adaptResolution();
  }

  // Battlefield modes return before the shared cutscene tick below, so their
  // cinematics advance here instead.
  if (cutsceneActive && cutsceneScene && (wdActive || pirateActive || mobaActive)) {
    const dt = Math.min(raw, 0.1);
    cutsceneTime += dt;
    const pct = clamp(cutsceneTime / cutsceneScene.duration, 0, 1);
    $('cutscene-progress').style.width = `${pct * 100}%`;
    showCutsceneBeat();
    paintCutscene();
    if (cutsceneTime >= cutsceneScene.duration) finishCutscene(false);
  }

  if (pirateActive) {
    if (pirateMatch && !piratePaused && pirateMatch.phase === 'sailing') {
      updatePirateVoyage(pirateMatch, Math.min(raw, 0.05));
    }
    if (pirateMatch) {
      const canvas = $('pirate-canvas');
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) renderPirateVoyage(ctx, pirateMatch, { width: canvas.width, height: canvas.height, time: now / 1000 });
    }
    if (pirateMatch?.phase === 'cleared' || pirateMatch?.phase === 'sunk') completePirateVoyage();
    pirateUiTimer += raw;
    updatePirateHud();
    return;
  }

  if (wdActive) {
    maybeWaveDefenseBossCutscene();
    if (wdMatch && !wdPaused && wdMatch.phase !== 'ended') {
      updateWaveDefense(wdMatch, Math.min(raw, 0.05));
    }
    if (wdMatch && (!wdPaused || wdRenderDirty)) {
      const canvas = $('wd-canvas');
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) renderWaveDefense(ctx, wdMatch, { width: canvas.width, height: canvas.height, time: now / 1000 });
    }
    wdRenderDirty = false;
    if (wdMatch?.phase === 'ended') completeWaveDefense();
    wdUiTimer += raw;
    updateWaveDefenseHud();
    return;
  }

  if (mobaActive) {
    if (mobaMatch && !mobaPaused && mobaMatch.phase === 'playing') {
      updateMobaMatch(mobaMatch, Math.min(raw, 0.05), mobaInput);
      mobaInput.castSlot = -1;
    }
    const canvas = $('moba-canvas');
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) renderMoba(ctx, mobaMatch, { width: canvas.width, height: canvas.height, time: now / 1000 });
    if (mobaMatch?.phase === 'ended') completeMobaMatch();
    mobaUiTimer += raw;
    updateMobaHud();
    return;
  }

  pollGamepad();
  syncMusic(raw);
  scareDirector?.tick(Math.min(raw, 0.1));
  if (debugOpen && now - debugPanelGate > 250) {
    debugPanelGate = now;
    buildDebugPanels();
  }
  if (activeRunKind === 'fallen' && started && !fallenEndingOpen) updateFallenHud();
  if (activeRunKind === 'crusade' && started && !crusadeClearOpen) updateCrusadeHud();

  if (prologueActive) {
    const dt = Math.min(raw, 0.1);
    prologueTimer += dt;
    prologueTotal += dt;
    const beat = PROLOGUE_BEATS[prologueIndex] || PROLOGUE_BEATS[0];
    const overall = (prologueIndex + clamp(prologueTimer / beat.duration, 0, 1)) / PROLOGUE_BEATS.length;
    $('prologue-progress').style.width = `${overall * 100}%`;
    if (prologueTimer >= beat.duration) advancePrologue();
    if (prologueActive) paintPrologue();
  }

  if (cutsceneActive && cutsceneScene) {
    const dt = Math.min(raw, 0.1);
    cutsceneTime += dt;
    const pct = clamp(cutsceneTime / cutsceneScene.duration, 0, 1);
    $('cutscene-progress').style.width = `${pct * 100}%`;
    showCutsceneBeat();
    paintCutscene();
    if (cutsceneTime >= cutsceneScene.duration) finishCutscene(false);
  }

  // The epilogue waits a beat after the victory screen so the death animation
  // and celebration music land before the credits roll.
  if (postCreditTimer > 0 && !cutsceneActive) {
    postCreditTimer -= raw;
    if (postCreditTimer <= 0) {
      postCreditTimer = -1;
      startCutscene(POST_CREDIT);
    }
  }

  if (spectating && spectateGame) {
    spectateGame.time += Math.min(raw, 0.05);
    if (peekDir !== 0) peekOffset = clamp(peekOffset + peekDir * 330 * raw, -WORLD_W, WORLD_W);
    renderer.render(spectateGame, { spectate: true, cameraX: spectateCamera() });
  } else {
    if (started && !paused && !shopOpen && !hunterShopOpen && !mapOpen && !codexOpen && !inventoryOpen && !dialogueOpen && !settingsOpen && !prologueActive && !cutsceneActive && !labRewardsOpen && !labSummaryOpen && !labGuestMode && !coopGuestMode && !isCustomClearOpen() && menuView === 'none') {
      // Speedrun multiplies the clock, not the timestep: the simulation still
      // advances in 1/120 s slices, just more of them per rendered frame.
      const speedScale = activeRunKind === 'speedrun' && speedrunRun ? speedrunRun.multiplier : 1;
      accumulator += raw * speedScale;
      let steps = 0;
      const stepCap = activeRunKind === 'speedrun' ? speedrunMaxSubsteps(speedScale) : 10;
      while (accumulator >= FIXED && steps < stepCap) {
        game.update(FIXED, inputSnapshot());
        if (activeRunKind === 'atlas') tickAtlasRun(FIXED);
        if (activeRunKind === 'labyrinth') tickLabyrinth(FIXED);
        if (activeRunKind === 'trials') tickTrials(FIXED);
        if (activeRunKind === 'fallen') tickFallen(FIXED);
        if (activeRunKind === 'crusade') tickCrusade(FIXED);
        if (activeRunKind === 'custom') tickCustomStage(FIXED);
        accumulator -= FIXED;
        steps += 1;
        if (game.state !== 'playing') {
          accumulator = 0;
          break;
        }
      }
    } else {
      accumulator = 0;
    }
    if (labGuestMode && started && activeRunKind === 'labyrinth') applyGuestSnapshot();
    if (coopGuestMode && started) applyCoopSnapshot();
    // A full-screen menu hides the playfield, so redraw the canvas at ~20 fps
    // instead of 60 while nothing is simulated. That leaves the main thread to
    // the DOM menus, which keeps them responsive on low-end phones.
    const menuCoversGame = !started && !prologueActive && !cutsceneActive && menuView !== 'none';
    if (!menuCoversGame || now - menuRenderGate >= 1000 / 20 - 0.6) {
      menuRenderGate = menuCoversGame ? now : 0;
      renderer.render(game, { scare: scareDirector?.active || null, aiDebug: aiDebugOpen, horror: horrorRenderLayer(), dread: dreadRenderLayer() });
      if ((activeRunKind === 'veil' || activeRunKind === 'eternal') && veilController) {
        drawVeilAtmosphere(renderer.ctx, veilRenderLayer(), renderer.canvas.width, renderer.canvas.height, renderer.dpr);
      }
    }
    if (mapOpen) mapView.draw(now / 1000);

    if (menuView === 'character' && previewCtx) {
      renderer.drawCharacterPreview(previewCtx, character, character.characterId, now / 1000);
    }

    if (menuView === 'mode3d' && game3D) {
      game3D.update(raw, input3D);
      drain3DHorrorEvents();
      // Position the listener at the live camera and play world effects through
      // HRTF panners when spatial audio is enabled.
      {
        const cam3D = game3D.camera;
        const forwardX = cam3D.targetX - cam3D.x;
        const forwardY = cam3D.targetY - cam3D.y;
        const forwardZ = cam3D.targetZ - cam3D.z;
        const forwardLength = Math.hypot(forwardX, forwardY, forwardZ) || 1;
        audio.setListener(
          { x: cam3D.x, y: cam3D.y, z: cam3D.z },
          { x: forwardX / forwardLength, y: forwardY / forwardLength, z: forwardZ / forwardLength },
        );
        for (const soundEvent of game3D.drainSounds()) {
          audio.playAt(soundEvent.type, { x: soundEvent.x, y: soundEvent.y, z: soundEvent.z });
        }
      }
      const canvas3D = $('canvas-3d');
      if (canvas3D) {
        const ctx3D = canvas3D.getContext('2d');
        if (ctx3D) {
          render3D(ctx3D, game3D);
          // Scary Mode presents in 3D too: same effect data, camera-aware layer.
          const horror3D = horrorRenderLayer();
          if (horror3D) renderer.drawHorrorAtmosphere(ctx3D, horror3D, canvas3D.width, canvas3D.height);
          const scare3D = scareDirector?.active;
          if (scare3D) renderer.drawScareOverlay(ctx3D, scare3D, canvas3D.width, canvas3D.height);
        }
      }
      input3D.jumpJustPressed = false;
      input3D.attackJustPressed = false;
      input3D.dashJustPressed = false;
      input3D.interactJustPressed = false;
      input3D.lockOnJustPressed = false;
    }
  }

  drainEvents();
  if (speedrunCleared) {
    speedrunCleared = false;
    handleSpeedrunClear();
  }
  labSendHostSnapshot();
  labSendGuestInput();
  // HUD and overlay visibility change slowly; 15 Hz is imperceptible and avoids
  // forcing style/layout work on every rendered frame.
  uiTimer += raw;
  if (uiTimer >= 1 / 15) {
    uiTimer = 0;
    syncScreens();
    updateHud();
  }
}

window.addEventListener('resize', () => { renderer.resize(); syncPirateCanvasSize(); });

// ── The Fallen Ones (Arc II: Heavenly Descent) ──────────────────────────
// A second, ascended campaign. All rules live in src/fallen.js; this layer
// only paints the heavenly hub, starts real core rooms, and drains events.
let fallenTab = 'regions';
let activeFallenRegion = -1;
let activeFallenSlot = 0;
let activeFallenBoss = null;
let fallenRun = null;
let fallenStartedAt = 0;
let fallenEndingOpen = false;
let fallenHudKey = '';
let fallenLastBossHp = -1;
let fallenLastHp = -1;
let fallenBaseDamage = 1;
const fallenHints = new Set();

function fallenState() {
  if (!progress.fallen || typeof progress.fallen !== 'object') progress.fallen = defaultFallenProgress();
  return progress.fallen;
}

function fallenMenuDefault() {
  return fallenIsAscended(progress) && fallenState().menuTheme !== 'base' ? 'fallenMenu' : 'title';
}

function ascendIfEligible() {
  const before = fallenState().ascended;
  const result = ascendProgress(progress);
  if (!result.ok) return result;
  if (!before) {
    fallenState().echoes = fallenEchoesFor(progress);
    saveProgress();
    updateMenuProgress();
    showToast(`☼ LANGIT TERBUKA — ${FALLEN_LOCAL_NAME} dimulai.`, 4200);
  }
  return result;
}

function showFallenMenu() {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  fallenEndingOpen = false;
  fallenRun = null;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'fallenMenu';
  game.reset();
  game.events.length = 0;
  clearHeldKeys();
  buildFallenMenu();
  updateMenuProgress();
  syncScreens();
}

function showFallen(tab = 'regions') {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  fallenEndingOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  fallenTab = tab;
  menuView = 'fallen';
  game.reset();
  game.events.length = 0;
  clearHeldKeys();
  buildFallenScreen();
  syncScreens();
}

function showBaseMenu() {
  menuView = 'title';
  game.reset();
  game.events.length = 0;
  updateMenuProgress();
  syncScreens();
}

function fallenMenuAction(id) {
  if (id === 'descent') {
    startFallenRegion(0);
  } else if (id === 'continue') {
    showFallen('regions');
  } else if (id === 'archive') {
    showFallen('archive');
  } else if (id === 'below') {
    showBaseMenu();
  } else if (id === 'options') {
    showSettings();
  } else if (id === 'quit') {
    showToast('Tutup tab ini untuk menutup Ashen Vow.', 2400);
    try { window.close(); } catch { /* browsers refuse for non-scripted tabs */ }
  }
}

function drawFallenFigure(canvas, figure) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0a0a16');
  sky.addColorStop(0.45, '#241a2e');
  sky.addColorStop(1, '#4a3620');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // Broken halo / sun behind the figure.
  const halo = ctx.createRadialGradient(w * 0.5, h * 0.34, 4, w * 0.5, h * 0.34, h * 0.74);
  halo.addColorStop(0, 'rgba(255,232,170,0.55)');
  halo.addColorStop(0.45, 'rgba(255,196,110,0.14)');
  halo.addColorStop(1, 'rgba(255,196,110,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,236,190,0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.34, h * 0.3, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  // Feathers drifting down from the wound in the sky.
  for (let i = 0; i < 16; i += 1) {
    const fx = ((i * 97) % w) + Math.sin(i) * 12;
    const fy = ((i * 53) % (h * 0.7)) + 10;
    ctx.fillStyle = i % 2 ? 'rgba(255,240,214,0.5)' : 'rgba(232,196,106,0.4)';
    ctx.beginPath();
    ctx.ellipse(fx, fy, 4, 1.6, i * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // The kneeling/rising/crowned figure.
  const baseY = h * 0.86;
  const cx = w * 0.5;
  ctx.fillStyle = figure.color || '#2a1414';
  ctx.strokeStyle = 'rgba(255,228,180,0.75)';
  ctx.lineWidth = 2;
  const rising = figure.pose === 'rising';
  const crowned = figure.pose === 'crowned';
  const headY = baseY - (rising ? 74 : crowned ? 80 : 54);
  ctx.beginPath();
  ctx.arc(cx, headY, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Torso.
  ctx.beginPath();
  ctx.moveTo(cx - 16, headY + 14);
  ctx.lineTo(cx + 16, headY + 14);
  ctx.lineTo(cx + (rising ? 22 : 18), baseY - 8);
  ctx.lineTo(cx - (rising ? 22 : 18), baseY - 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Legs: kneeling tucks one under, rising stands tall.
  if (rising) {
    ctx.beginPath();
    ctx.moveTo(cx - 16, baseY - 10);
    ctx.lineTo(cx - 20, baseY + 12);
    ctx.moveTo(cx + 16, baseY - 10);
    ctx.lineTo(cx + 20, baseY + 12);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - 18, baseY - 10);
    ctx.lineTo(cx + 26, baseY + 10);
    ctx.lineTo(cx + 40, baseY + 12);
    ctx.stroke();
  }
  // Wings: cracked and dim until the arc advances.
  ctx.strokeStyle = 'rgba(255,240,210,0.45)';
  ctx.beginPath();
  ctx.moveTo(cx - 14, headY + 20);
  ctx.quadraticCurveTo(cx - 62, headY + 6, cx - 74, baseY - 6);
  ctx.moveTo(cx + 14, headY + 20);
  ctx.quadraticCurveTo(cx + 62, headY + 6, cx + 74, baseY - 6);
  ctx.stroke();
  if (crowned) {
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.moveTo(cx - 16, headY - 12);
    ctx.lineTo(cx - 8, headY - 26);
    ctx.lineTo(cx, headY - 14);
    ctx.lineTo(cx + 8, headY - 26);
    ctx.lineTo(cx + 16, headY - 12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 16, 84, 12, 0, 0, Math.PI * 2);
  ctx.fill();
}

function buildFallenMenu() {
  const el = $('fallen-menu-screen');
  if (!el) return;
  const state = fallenState();
  const summary = fallenSummary(state);
  const figure = fallenMenuFigure(state);
  drawFallenFigure($('fallen-menu-figure'), figure);
  const caption = figure.ending
    ? `Akhir: ${FALLEN_ENDINGS.find((e) => e.id === figure.ending)?.name || figure.ending}`
    : figure.pose === 'rising'
      ? 'Ia berdiri. Langit gemetar.'
      : figure.pose === 'kneeling_alert'
        ? 'Ia mengangkat kepala.'
        : 'Ia masih berlutut.';
  $('fallen-menu-caption').textContent = caption;
  $('fallen-menu-summary').innerHTML = [
    ['WILAYAH', `${summary.regionsCleared}/${summary.regionTotal}`],
    ['BOS', `${summary.bossesCleared}/${summary.bossTotal}`],
    ['RUANG', `${summary.roomsCleared}/${summary.roomTotal}`],
    ['SERPIHAN', String(summary.shards)],
    ['AKHIRAN', `${summary.endingsFound}/${summary.endingTotal}`],
  ].map(([label, value]) => `<div class="fallen-stat"><span>${label}</span><strong>${value}</strong></div>`).join('');
  $('fallen-menu-movement').textContent = FALLEN_MOVEMENTS[summary.movement]?.name || FALLEN_MOVEMENTS[0].name;
  $('fallen-menu-theme').textContent = state.menuTheme === 'base' ? 'TEMA: DUNIA BAWAH' : 'TEMA: LANGIT';
  $('fallen-menu-options').innerHTML = FALLEN_MENU_OPTIONS.map((option) => `
    <button class="fallen-option" type="button" data-fallen-menu="${option.id}">
      <span>${esc(option.label)}</span>
      <em>${esc(option.note)}</em>
    </button>`).join('');
  el.querySelectorAll('[data-fallen-menu]').forEach((button) => {
    button.addEventListener('click', () => fallenMenuAction(button.dataset.fallenMenu));
  });
  $('fallen-menu-theme').addEventListener('click', () => {
    const next = fallenState().menuTheme === 'base' ? 'heavenly' : 'base';
    setFallenMenuTheme(fallenState(), next);
    saveProgress();
    buildFallenMenu();
  });
}

function fallenTabBody(tab, state) {
  if (tab === 'regions') {
    const regions = FALLEN_REGIONS.map((region) => {
      const unlocked = fallenRegionUnlocked(state, region.index);
      const cleared = state.bosses[region.boss] === true;
      const rooms = FALLEN_ROOMS_PER_REGION;
      let done = 0;
      for (let slot = 0; slot < rooms; slot += 1) {
        if (state.rooms[region.roomStart + slot - FALLEN_ROOM_START]) done += 1;
      }
      const bossUnlocked = fallenBossUnlocked(state, region.boss);
      return `
        <article class="fallen-region ${unlocked ? '' : 'locked'} ${cleared ? 'cleared' : ''}">
          <header>
            <span class="fallen-region-glyph" style="color:${region.color}">${region.glyph}</span>
            <div>
              <strong>${esc(region.localName)}</strong>
              <em>${esc(region.name)} · ${region.subtitle}</em>
            </div>
            <span class="fallen-region-state">${cleared ? 'TUNTAS' : unlocked ? 'TERBUKA' : 'TERKUNCI'}</span>
          </header>
          <p>${esc(region.gimmick)}</p>
          <div class="fallen-room-dots">${Array.from({ length: rooms - 1 }, (_, slot) => `<i class="${state.rooms[region.roomStart + slot - FALLEN_ROOM_START] ? 'done' : ''}"></i>`).join('')}<b class="${cleared ? 'done' : ''}">${esc(FALLEN_BOSS_BY_ID[region.boss].localName)}</b></div>
          <div class="fallen-region-actions">
            <button class="btn btn-primary fallen-mini" type="button" data-fallen-region="${region.index}" ${unlocked ? '' : 'disabled'}><span>MASUK WILAYAH</span></button>
            <button class="btn btn-ghost fallen-mini" type="button" data-fallen-boss="${region.boss}" ${bossUnlocked ? '' : 'disabled'}><span>${cleared ? 'ULANGI BOS' : 'HADAPI BOS'}</span></button>
          </div>
        </article>`;
    }).join('');
    const optional = FALLEN_OPTIONAL_BOSSES.map((boss) => {
      const unlocked = fallenBossUnlocked(state, boss.id);
      const cleared = state.bosses[boss.id] === true;
      return `<article class="fallen-region optional ${cleared ? 'cleared' : ''}">
        <header><span class="fallen-region-glyph" style="color:${boss.color}">${boss.glyph}</span><div><strong>${esc(boss.localName)}</strong><em>${esc(boss.title)}</em></div><span class="fallen-region-state">${cleared ? 'TUNTAS' : 'OPSIONAL'}</span></header>
        <p>${esc(boss.name)} — ${boss.optional ? 'bos opsional, bagian dari akhir rahasia.' : ''}</p>
        <div class="fallen-region-actions"><button class="btn btn-ghost fallen-mini" type="button" data-fallen-boss="${boss.id}" ${unlocked ? '' : 'disabled'}><span>${cleared ? 'ULANGI' : 'HADAPI'}</span></button></div>
      </article>`;
    }).join('');
    return `<div class="fallen-regions">${regions}</div><h3 class="fallen-section-title">GERBANG OPSIONAL</h3><div class="fallen-regions optional-grid">${optional}</div>`;
  }
  if (tab === 'bestiary') {
    const archive = fallenArchive(state);
    return `<div class="fallen-grid">${archive.bestiary.map((enemy) => `
      <article class="fallen-card ${enemy.seen ? '' : 'unseen'}">
        <strong>${esc(enemy.name)}</strong>
        <em>${esc(enemy.title)}${enemy.elite ? ' · ELITE' : ''}</em>
        <p>${esc(enemy.desc)}</p>
        <span class="fallen-card-meta">${enemy.seen ? `HP ${enemy.hp} · DMG ${enemy.dmg} · ${enemy.behavior}` : 'Belum terlihat'}</span>
      </article>`).join('')}</div>`;
  }
  if (tab === 'echoes') {
    const archive = fallenArchive(state);
    return `<p class="fallen-note">Gema dibawa dari dunia bawah. Setiap gema permanen, maksimal lima, dan tidak bisa hilang saat kau jatuh.</p>
      <div class="fallen-grid">${archive.echoes.map((echo) => `
        <article class="fallen-card ${echo.earned ? 'earned' : 'unseen'}">
          <strong>${esc(echo.name)}</strong>
          <em>${echo.earned ? 'TERBUKA' : 'TERKUNCI'}</em>
          <p>${esc(echo.desc || '')}</p>
        </article>`).join('')}</div>`;
  }
  if (tab === 'upgrades') {
    const weapons = FALLEN_WEAPONS.map((weapon) => `
      <button class="fallen-card weapon ${state.weapon === weapon.id ? 'earned' : ''}" type="button" data-fallen-weapon="${weapon.id}">
        <strong>${esc(weapon.name)}</strong><em>${weapon.cost ? `${weapon.cost} SERPIHAN` : 'BAWAAN'}</em><p>${esc(weapon.desc || '')}</p>
      </button>`).join('');
    const upgrades = FALLEN_UPGRADES.map((upgrade) => {
      const tier = state.upgrades[upgrade.id] || 0;
      const maxed = tier >= upgrade.tiers.length;
      const cost = maxed ? 0 : upgrade.tiers[tier].cost;
      return `<article class="fallen-card earned">
        <strong>${esc(upgrade.name)}</strong><em>${tier}/${upgrade.tiers.length}${maxed ? ' · MAKS' : ` · ${cost} SERPIHAN`}</em>
        <p>${esc(upgrade.desc || '')}</p>
        <button class="btn btn-ghost fallen-mini" type="button" data-fallen-upgrade="${upgrade.id}" ${maxed ? 'disabled' : ''}><span>NAIKKAN</span></button>
      </article>`;
    }).join('');
    return `<p class="fallen-note">Serpihan Halo: <strong>${state.shards}</strong>. Dibawa dari bos dan dipakai permanen.</p>
      <div class="fallen-grid">${upgrades}</div><h3 class="fallen-section-title">SENJATA LANGIT</h3><div class="fallen-grid">${weapons}</div>`;
  }
  const archive = fallenArchive(state);
  const summary = fallenSummary(state);
  return `<div class="fallen-archive">
    <p class="fallen-note">${esc(FALLEN_SUBTITLE)}</p>
    <p class="fallen-movement">${esc(FALLEN_MOVEMENTS[summary.movement]?.localName || '')}</p>
    <div class="fallen-grid">${archive.endings.map((ending) => `<article class="fallen-card ${ending.found ? 'earned' : 'unseen'}"><strong>${ending.glyph} ${esc(ending.name)}</strong><em>${ending.found ? 'DITEMUKAN' : 'BELUM'}</em><p>${esc(ending.condition)}</p><span class="fallen-card-meta">${esc(ending.result)}</span></article>`).join('')}</div>
    <h3 class="fallen-section-title">STATISTIK TURUN</h3>
    <div class="fallen-stat-row"><span>Turun</span><strong>${summary.runs}</strong><span>Gugur</span><strong>${summary.deaths}</strong><span>Rekor</span><strong>${summary.bestTime ? `${summary.bestTime}s` : '—'}</strong></div>
    <h3 class="fallen-section-title">KEMAMPUAN</h3>
    <div class="fallen-abilities">${FALLEN_ABILITIES.map((ability) => `<span class="${state.abilities.includes(ability.id) ? 'earned' : ''}">${ability.glyph} ${esc(ability.localName)}</span>`).join('')}</div>
    <p class="micro">The Fallen Ones · ${summary.roomsCleared}/${summary.roomTotal} ruang · ${summary.percent}% arsip lengkap · arc ${FALLEN_NAME}.</p>
  </div>`;
}

function buildFallenScreen() {
  const el = $('fallen-screen');
  if (!el) return;
  const state = fallenState();
  const summary = fallenSummary(state);
  $('fallen-summary').innerHTML = [
    ['WILAYAH', `${summary.regionsCleared}/${summary.regionTotal}`],
    ['BOS UTAMA', `${summary.mainCleared}/${summary.mainTotal}`],
    ['OPSIONAL', `${summary.optionalCleared}/${summary.optionalTotal}`],
    ['SERPIHAN', String(summary.shards)],
    ['GERMA', `${state.echoes.length}/5`],
  ].map(([label, value]) => `<div class="fallen-stat"><span>${label}</span><strong>${value}</strong></div>`).join('');
  const tabs = [
    ['regions', 'WILAYAH'],
    ['bestiary', 'BESTIARY'],
    ['echoes', 'GEMA'],
    ['upgrades', 'SERPIHAN'],
    ['archive', 'ARSIP'],
  ];
  $('fallen-tabs').innerHTML = tabs.map(([id, label]) => `<button class="fallen-tab ${fallenTab === id ? 'active' : ''}" type="button" data-fallen-tab="${id}">${label}</button>`).join('');
  const body = $('fallen-body');
  body.innerHTML = fallenTabBody(fallenTab, state);
  $('fallen-tabs').querySelectorAll('[data-fallen-tab]').forEach((button) => {
    button.addEventListener('click', () => { fallenTab = button.dataset.fallenTab; buildFallenScreen(); });
  });
  body.querySelectorAll('[data-fallen-region]').forEach((button) => {
    button.addEventListener('click', () => startFallenRegion(Number(button.dataset.fallenRegion)));
  });
  body.querySelectorAll('[data-fallen-boss]').forEach((button) => {
    button.addEventListener('click', () => startFallenBoss(button.dataset.fallenBoss));
  });
  body.querySelectorAll('[data-fallen-upgrade]').forEach((button) => {
    button.addEventListener('click', () => {
      const result = buyFallenUpgrade(fallenState(), button.dataset.fallenUpgrade);
      if (!result.ok) {
        showToast(result.reason === 'shards' ? `Butuh ${result.cost} Serpihan Halo.` : 'Sudah maksimal.', 1800);
        return;
      }
      saveProgress();
      showToast(`Peningkatan dibeli · ${result.value}`, 1800);
      buildFallenScreen();
    });
  });
  body.querySelectorAll('[data-fallen-weapon]').forEach((button) => {
    button.addEventListener('click', () => {
      const result = equipFallenWeapon(fallenState(), button.dataset.fallenWeapon);
      if (!result.ok) { showToast('Serpihan Halo tidak cukup.', 1600); return; }
      saveProgress();
      buildFallenScreen();
    });
  });
}

function startFallenRegion(regionIndex, { slot = 0 } = {}) {
  const state = fallenState();
  if (!fallenRegionUnlocked(state, regionIndex)) {
    showToast('Wilayah itu masih tertutup — jatuhkan bos sebelumnya.', 2000);
    return;
  }
  const config = fallenRunConfig(state, regionIndex);
  activeFallenRegion = config.region.index;
  activeFallenBoss = null;
  let entry = clamp(Number(slot) || 0, 0, FALLEN_ROOMS_PER_REGION - 1);
  while (entry > 0 && !fallenRoomUnlocked(state, config.region.roomStart + entry)) entry -= 1;
  activeFallenSlot = entry;
  beginFallenRun(config.region.roomStart + entry, config.run);
}

function startFallenBoss(bossId) {
  const state = fallenState();
  const boss = FALLEN_BOSS_BY_ID[bossId];
  if (!boss) return;
  if (!fallenBossUnlocked(state, bossId)) {
    showToast('Bos itu masih tersegel.', 1800);
    return;
  }
  const regionIndex = boss.optional ? FALLEN_REGION_COUNT - 1 : FALLEN_REGIONS.findIndex((region) => region.boss === bossId);
  const config = fallenRunConfig(state, regionIndex);
  activeFallenRegion = Math.max(0, regionIndex);
  activeFallenBoss = boss.id;
  activeFallenSlot = boss.optional ? -1 : FALLEN_ROOMS_PER_REGION - 1;
  beginFallenRun(boss.roomIndex, config.run);
}

function beginFallenRun(roomIndex, run) {
  audio.init();
  attempts = 1;
  coopGuestMode = false;
  coopGuestRoom = -1;
  labRun = null;
  labDirector = null;
  speedrunRun = null;
  fallenEndingOpen = false;
  activeRunKind = 'fallen';
  fallenRun = run;
  fallenStartedAt = performance.now();
  fallenLastBossHp = -1;
  fallenHudKey = '';
  game.labyrinth = false;
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  game.player.relic = true;
  game.enterRoom(roomIndex);
  game.player.maxHp = fallenRun.maxHp;
  game.player.hp = fallenRun.maxHp;
  fallenBaseDamage = game.player.damageMult || 1;
  game.player.damageMult = fallenBaseDamage;
  game.ash = Math.max(game.ash, 45);
  fallenLastHp = game.player.hp;
  game.events.length = 0;
  started = true;
  paused = false;
  hunterShopOpen = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  discoverCurrentRoom(roomIndex);
  showBanner(game.room.name, game.room.subtitle);
  showToast(`☼ ${FALLEN_LOCAL_NAME} — ${FALLEN_REGIONS[activeFallenRegion]?.localName || 'Langit'}`, 2600);
  syncScreens();
  updateHud();
  updateFallenHud(true);
}

function handleFallenBoss(ev) {
  const room = FALLEN_ROOM_BY_ID[ev.room];
  const bossId = room?.fallenBoss || room?.fallenOptional;
  if (!bossId) return;
  const boss = FALLEN_BOSS_BY_ID[bossId];
  const result = recordFallenBoss(fallenState(), bossId);
  activeFallenBoss = null;
  if (!result.ok) return;
  if (result.firstClear) {
    saveProgress();
    showToast(`✧ ${boss.name} gugur · +${result.shards} Serpihan Halo${result.ability ? ' · kemampuan baru' : ''}`, 3000);
  }
  if (boss.final) {
    const optionalCleared = FALLEN_OPTIONAL_BOSSES.every((b) => fallenState().bosses[b.id]);
    recordFallenRun(fallenState(), Math.max(1, (performance.now() - fallenStartedAt) / 1000), { won: optionalCleared });
    saveProgress();
    openFallenEnding();
  }
}

function openFallenEnding() {
  const state = fallenState();
  fallenEndingOpen = true;
  $('fallen-ending-title').textContent = 'LANGIT MENUNGGU KEPUTUSANMU';
  $('fallen-ending-body').innerHTML = `
    <p>Seraphiel jatuh dari singgasananya. Tiga jalan terbuka, dan hanya satu yang bisa kau ambil.</p>
    <div class="fallen-ending-grid">${FALLEN_ENDINGS.map((ending) => {
      const locked = ending.id === 'eclipse' && !FALLEN_OPTIONAL_BOSSES.every((b) => state.bosses[b.id]);
      return `<button class="fallen-ending-card ${ending.found ? 'found' : ''}" type="button" data-fallen-ending="${ending.id}" ${locked ? 'disabled' : ''}>
        <span class="fallen-ending-glyph" style="color:${ending.color}">${ending.glyph}</span>
        <strong>${esc(ending.localName)}</strong>
        <em>${esc(ending.name)}</em>
        <p>${esc(ending.result)}</p>
        <span class="fallen-card-meta">${locked ? 'Butuh keempat bos opsional' : esc(ending.condition)}</span>
      </button>`;
    }).join('')}</div>`;
  $('fallen-ending-options').innerHTML = '';
  $('fallen-ending-body').querySelectorAll('[data-fallen-ending]').forEach((button) => {
    button.addEventListener('click', () => chooseFallenEnding(button.dataset.fallenEnding));
  });
  syncScreens();
}

function chooseFallenEnding(endingId) {
  const result = recordFallenEnding(fallenState(), endingId);
  if (!result.ok) {
    showToast(result.reason === 'optional_required' ? 'Gerhana butuh keempat bos opsional.' : 'Akhiran itu belum terbuka.', 2200);
    return result;
  }
  const ending = result.ending;
  unlockCrusade(progress);
  saveProgress();
  updateMenuProgress();
  $('fallen-ending-title').textContent = `${ending.glyph} ${ending.localName.toUpperCase()} — ${ending.name.toUpperCase()}`;
  $('fallen-ending-body').innerHTML = `
    <p class="fallen-ending-result">${esc(ending.result)}</p>
    <div class="fallen-ending-summary">${fallenSummary(fallenState()).regionsCleared}/${FALLEN_REGION_COUNT} wilayah · ${fallenSummary(fallenState()).bossesCleared}/${FALLEN_BOSSES.length} bos · ${fallenSummary(fallenState()).endingsFound}/3 akhiran</div>
    <p class="micro">The Fallen Ones selesai. Arsip, bestiary, kosmetik, dan Serpihan Halo tetap tersimpan di browser ini.</p>`;
  $('fallen-ending-options').innerHTML = '<button class="btn btn-primary" type="button" id="fallen-ending-return"><span>KEMBALI KE GERBANG LANGIT</span></button>';
  $('fallen-ending-return').addEventListener('click', () => {
    fallenEndingOpen = false;
    fallenRun = null;
    fallenBaseDamage = 1;
    showFallenMenu();
  });
  return result;
}

function fallenBurst() {
  if (activeRunKind !== 'fallen' || !fallenRun) return { ok: false };
  const result = blindingBurst(fallenRun);
  if (!result.ok) {
    showToast('Radiance belum penuh — pukul bos untuk mengisinya.', 1800);
    return result;
  }
  const boss = game.boss;
  if (boss && !boss.dying) {
    boss.purityShield = 0;
    game.hurtBoss(result.damage);
    boss.stunTimer = Math.max(boss.stunTimer || 0, result.stun);
  }
  showToast(`☼ BLINDING BURST — ${Math.round(result.damage)} kerusakan · Purity Shield hancur`, 2400);
  updateFallenHud(true);
  return result;
}

function fallenShadow() {
  if (activeRunKind !== 'fallen' || !fallenRun) return { ok: false };
  const result = toggleShadow(fallenRun);
  if (!result.ok) {
    showToast('Shadow Stance belum terbuka — kalahkan Aurelian atau ambil lima kemampuan.', 2200);
    return result;
  }
  showToast(result.shadow ? '☾ SHADOW STANCE — damage naik, nyawa terkuras.' : '☀ Bayangan padam.', 1800);
  updateFallenHud(true);
  return result;
}

function fallenCleanse() {
  if (activeRunKind !== 'fallen' || !fallenRun) return false;
  fallenRun.marks = 0;
  game.player.invuln = Math.max(game.player.invuln || 0, 1);
  showToast('✧ Absolution — semua Judgment Mark dibersihkan.', 2000);
  updateFallenHud(true);
  return true;
}

function tickFallen(dt) {
  if (activeRunKind !== 'fallen' || !fallenRun) return;
  const player = game.player;
  const boss = game.boss;
  if (boss && !boss.dying) {
    if (fallenLastBossHp < 0) fallenLastBossHp = boss.hp;
    if (boss.hp < fallenLastBossHp) {
      const damage = fallenLastBossHp - boss.hp;
      fallenLastBossHp = boss.hp;
      const gain = radianceGain(fallenRun, damage);
      if (gain.full && !fallenHints.has('radiance')) {
        fallenHints.add('radiance');
        showToast('☼ RADIANCE PENUH — tekan B untuk Blinding Burst.', 2400);
      }
    }
  } else {
    fallenLastBossHp = -1;
  }
  if (player.hp < fallenLastHp) {
    applyJudgment(fallenRun, boss?.phase >= 2 ? 2 : 1);
  }
  fallenLastHp = player.hp;
  const judge = judgmentTick(fallenRun, dt, {
    moved: Math.abs(player.vx || 0) > 14,
    acted: !!player.attack,
  });
  if (judge.detonated) {
    player.hp = Math.max(0, player.hp - judge.damage);
    game.shake = Math.max(game.shake || 0, 0.4);
    showToast(`JUDGMENT — ${judge.damage} kerusakan. Bergerak atau menyerang untuk membatalkan.`, 2200);
  }
  if (fallenRun.shadow) {
    const drain = shadowTick(fallenRun, dt, fallenRun.maxHp);
    const floor = fallenRun.hpFloor || Math.max(1, fallenRun.maxHp * 0.15);
    player.hp = Math.max(floor, player.hp - drain.drain);
    if (player.hp <= floor + 0.01) {
      toggleShadow(fallenRun);
      showToast('☀ Bayangan padam — nyawa terlalu tipis.', 1800);
    }
  }
  player.damageMult = fallenBaseDamage * shadowDamageMul(fallenRun);
  if (fallenRun.stun > 0) fallenRun.stun = Math.max(0, fallenRun.stun - dt);
}

function updateFallenHud(force = false) {
  const hud = $('fallen-hud');
  if (!hud) return;
  if (activeRunKind !== 'fallen' || !fallenRun) {
    hud.classList.add('hidden');
    return;
  }
  hud.classList.remove('hidden');
  const key = `${Math.round(fallenRun.radiance)}|${fallenRun.radianceMax}|${fallenRun.marks}|${fallenRun.shadow}|${fallenRun.shards}|${fallenRun.bursts}`;
  if (!force && key === fallenHudKey) return;
  fallenHudKey = key;
  const pct = Math.max(0, Math.min(1, fallenRun.radiance / (fallenRun.radianceMax || 100))) * 100;
  $('fallen-radiance-fill').style.width = `${pct}%`;
  $('fallen-radiance-text').textContent = radianceFull(fallenRun) ? '☼ BURST SIAP' : `RADIANCE ${Math.floor(fallenRun.radiance)}`;
  $('fallen-marks').innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < fallenRun.marks ? 'on' : ''}"></i>`).join('');
  $('fallen-shards').textContent = `✧ ${fallenRun.shards + (fallenState().shards || 0)}`;
  $('fallen-shadow-state').textContent = fallenRun.shadow ? '☾ SHADOW' : '☀ TERANG';
  $('fallen-shadow-state').classList.toggle('on', fallenRun.shadow);
  $('fallen-abilities').textContent = fallenRun.abilitySet.length
    ? fallenRun.abilitySet.map((id) => FALLEN_ABILITIES.find((a) => a.id === id)?.glyph || '✦').join(' ')
    : 'kemampuan belum terbuka';
}

function fallenKeydown(event) {
  if (activeRunKind !== 'fallen' || !started || menuView !== 'none' || fallenEndingOpen) return;
  if (event.code === 'KeyB') {
    event.preventDefault();
    fallenBurst();
  } else if (event.code === 'KeyV') {
    event.preventDefault();
    fallenShadow();
  } else if (event.code === 'KeyN') {
    event.preventDefault();
    fallenCleanse();
  }
}
window.addEventListener('keydown', fallenKeydown);

// ── Arc III: The Radiant Crusade ─────────────────────────────────────────
// The war camp is a third menu skin. Rules live in src/crusade.js; this is
// menus, the run shell, and the Valor Chain presentation.
let crusadeTab = 'levels';
let crusadeRun = null;
let crusadeStartedAt = 0;
let crusadeClearOpen = false;
let crusadeHudKey = '';
let crusadeLastBossHp = -1;
let crusadeLastHp = -1;
let crusadeBaseDamage = 1;
let activeCrusadeLevel = 0;
let activeCrusadeBoss = null;
let crusadeBreakHintAt = 0;

function crusadeState() {
  if (!progress.crusade || typeof progress.crusade !== 'object') progress.crusade = defaultCrusadeProgress();
  return progress.crusade;
}

function defaultMenuView() {
  if (progress.crusade?.cleared) return 'crusadeMenu';
  if (fallenIsAscended(progress) && fallenState().menuTheme !== 'base') return 'fallenMenu';
  return 'title';
}

function showCrusadeMenu() {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  fallenEndingOpen = false;
  crusadeClearOpen = false;
  fallenRun = null;
  crusadeRun = null;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'crusadeMenu';
  game.reset();
  game.events.length = 0;
  clearHeldKeys();
  buildCrusadeMenu();
  updateMenuProgress();
  syncScreens();
}

function showCrusade(tab = 'levels') {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  fallenEndingOpen = false;
  crusadeClearOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  crusadeTab = tab;
  menuView = 'crusade';
  game.reset();
  game.events.length = 0;
  clearHeldKeys();
  buildCrusadeScreen();
  syncScreens();
}

function crusadeMenuAction(id) {
  if (id === 'continue' || id === 'levels') {
    showCrusade('levels');
  } else if (id === 'camp') {
    showCrusade('camp');
  } else if (id === 'rift') {
    showRiftScreen();
  } else if (id === 'heaven') {
    showFallenMenu();
  } else if (id === 'options') {
    showSettings();
  }
}

function drawCrusadeCamp(canvas, figure) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0e0a06');
  sky.addColorStop(0.5, '#2c1e0c');
  sky.addColorStop(1, '#4a2c10');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  if (figure.pose === 'rift') {
    const crack = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    crack.addColorStop(0, 'rgba(255,90,60,0.85)');
    crack.addColorStop(1, 'rgba(120,20,10,0)');
    ctx.fillStyle = crack;
    ctx.beginPath();
    ctx.moveTo(w * 0.48, 0);
    ctx.lineTo(w * 0.52, 0);
    ctx.lineTo(w * 0.58, h * 0.62);
    ctx.lineTo(w * 0.44, h * 0.62);
    ctx.closePath();
    ctx.fill();
  }
  // Camp tents.
  for (let i = 0; i < 3; i += 1) {
    const tx = w * (0.18 + i * 0.3);
    ctx.fillStyle = i === 1 ? '#5a4020' : '#3c2a12';
    ctx.beginPath();
    ctx.moveTo(tx - 34, h * 0.8);
    ctx.lineTo(tx, h * 0.52);
    ctx.lineTo(tx + 34, h * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(240,200,120,0.35)';
    ctx.stroke();
  }
  // Campfire.
  const fire = ctx.createRadialGradient(w * 0.5, h * 0.83, 2, w * 0.5, h * 0.83, 60);
  fire.addColorStop(0, 'rgba(255,200,110,0.8)');
  fire.addColorStop(1, 'rgba(255,140,40,0)');
  ctx.fillStyle = fire;
  ctx.fillRect(0, 0, w, h);
  // Banner pole.
  ctx.strokeStyle = '#d8b070';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.78, h * 0.28);
  ctx.lineTo(w * 0.78, h * 0.82);
  ctx.stroke();
  if (figure.banner) {
    ctx.fillStyle = figure.pose === 'rift' ? '#8a2a1c' : '#c89438';
    ctx.beginPath();
    ctx.moveTo(w * 0.78, h * 0.28);
    ctx.lineTo(w * 0.94, h * 0.34);
    ctx.lineTo(w * 0.78, h * 0.42);
    ctx.closePath();
    ctx.fill();
  }
  // Embers.
  for (let i = 0; i < 18; i += 1) {
    const ex = ((i * 83) % w) + Math.sin(i * 1.7) * 8;
    const ey = h - ((i * 37) % (h * 0.6));
    ctx.fillStyle = i % 3 ? 'rgba(255,180,80,0.5)' : 'rgba(255,120,60,0.45)';
    ctx.beginPath();
    ctx.arc(ex, ey, i % 4 === 0 ? 2 : 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // The knight at the fire, growing with each cleared level.
  if (figure.levels > 0 || figure.pose === 'rift') {
    const cx = w * 0.5;
    const baseY = h * 0.83;
    ctx.fillStyle = figure.pose === 'rift' ? '#2a1010' : '#241808';
    ctx.strokeStyle = 'rgba(255,220,160,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, baseY - 52, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 13, baseY - 40);
    ctx.lineTo(cx + 13, baseY - 40);
    ctx.lineTo(cx + 16, baseY - 4);
    ctx.lineTo(cx - 16, baseY - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 13, baseY - 36);
    ctx.lineTo(cx + 30, baseY - 60);
    ctx.stroke();
  }
}

function buildCrusadeMenu() {
  const el = $('crusade-menu-screen');
  if (!el) return;
  const state = crusadeState();
  const summary = crusadeSummary(state);
  const figure = crusadeCampFigure(state);
  drawCrusadeCamp($('crusade-menu-figure'), figure);
  const caption = figure.pose === 'rift'
    ? 'Celah itu terbuka. Kau bisa mendengar sesuatu bernapas.'
    : figure.pose === 'marching'
      ? 'Kemah penuh. Barisan menunggu perintahmu.'
      : figure.pose === 'camp'
        ? 'Api kecil menyala. Satu panji berdiri.'
        : 'Kemah itu masih kosong.';
  $('crusade-menu-caption').textContent = caption;
  $('crusade-menu-banner').textContent = figure.banner ? `${summary.banners}/${summary.bannerTotal} PANJI DIKIBARKAN` : 'BELUM ADA PANJI';
  $('crusade-menu-summary').innerHTML = [
    ['TINGKAT', `${summary.levelsCleared}/${summary.levelTotal}`],
    ['BOS', `${summary.bossesCleared}/${summary.bossTotal}`],
    ['PANJI', `${summary.banners}/${summary.bannerTotal}`],
    ['SIGIL', String(summary.sigils)],
    ['CHAIN', String(summary.bestChain)],
  ].map(([label, value]) => `<div class="crusade-stat"><span>${label}</span><strong>${value}</strong></div>`).join('');
  $('crusade-menu-options').innerHTML = CRUSADE_MENU_OPTIONS.map((option) => `
    <button class="crusade-option" type="button" data-crusade-menu="${option.id}" ${option.locked ? 'disabled' : ''}>
      <span>${esc(option.label)}${option.locked ? ' 🔒' : ''}</span>
      <em>${esc(option.note)}</em>
    </button>`).join('');
  el.querySelectorAll('[data-crusade-menu]').forEach((button) => {
    button.addEventListener('click', () => crusadeMenuAction(button.dataset.crusadeMenu));
  });
}

function crusadeTabBody(tab, state) {
  if (tab === 'levels') {
    const levels = CRUSADE_LEVELS.map((level) => {
      const unlocked = crusadeLevelUnlocked(state, level.index);
      const cleared = state.bosses[level.boss] === true;
      const bossUnlocked = crusadeBossUnlocked(state, level.boss);
      const dots = Array.from({ length: CRUSADE_ROOMS_PER_LEVEL - 1 }, (_, slot) =>
        `<i class="${state.rooms[level.roomStart + slot - CRUSADE_ROOM_START] ? 'done' : ''}"></i>`).join('');
      return `<article class="crusade-level ${unlocked ? '' : 'locked'} ${cleared ? 'cleared' : ''}">
        <header>
          <span class="crusade-level-glyph" style="color:${level.color}">${level.glyph}</span>
          <div><strong>${esc(level.localName)}</strong><em>${esc(level.name)} · ${esc(level.subtitle)}</em></div>
          <span class="crusade-level-state">${cleared ? 'TUNTAS' : unlocked ? 'TERBUKA' : 'TERKUNCI'}</span>
        </header>
        <p>${esc(level.gimmick)}</p>
        <div class="crusade-room-dots">${dots}<b class="${cleared ? 'done' : ''}">${esc(CRUSADE_BOSS_BY_ID[level.boss].localName)}</b></div>
        <div class="crusade-level-actions">
          <button class="btn btn-primary crusade-mini" type="button" data-crusade-level="${level.index}" ${unlocked ? '' : 'disabled'}><span>MASUK TINGKAT</span></button>
          <button class="btn btn-ghost crusade-mini" type="button" data-crusade-boss="${level.boss}" ${bossUnlocked ? '' : 'disabled'}><span>${cleared ? 'ULANGI BOS' : 'HADAPI BOS'}</span></button>
        </div>
      </article>`;
    }).join('');
    return `<div class="crusade-levels">${levels}</div>`;
  }
  if (tab === 'banners') {
    const archive = crusadeArchive(state);
    return `<p class="crusade-note">Panji adalah hadiah tetap dari setiap bos. Mereka tidak bisa hilang saat kau gugur.</p>
      <div class="crusade-grid">${archive.banners.map((banner) => `
        <article class="crusade-card ${banner.earned ? 'earned' : 'unseen'}">
          <strong>⚑ ${esc(banner.name)}</strong>
          <em>${banner.earned ? 'DIKIBARKAN' : 'TERKUNCI'}</em>
          <p>${esc(banner.desc)}</p>
          <span class="crusade-card-meta">${esc(banner.localName)}</span>
        </article>`).join('')}</div>`;
  }
  if (tab === 'bestiary') {
    const archive = crusadeArchive(state);
    return `<div class="crusade-grid">${archive.bestiary.map((enemy) => `
      <article class="crusade-card ${enemy.seen ? '' : 'unseen'}">
        <strong>${esc(enemy.name)}</strong>
        <em>${esc(enemy.title)}${enemy.elite ? ' · ELITE' : ''}</em>
        <p>${esc(enemy.desc)}</p>
        <span class="crusade-card-meta">${enemy.seen ? `HP ${enemy.hp} · DMG ${enemy.dmg} · ${enemy.behavior}` : 'Belum terlihat'}</span>
      </article>`).join('')}</div>`;
  }
  if (tab === 'camp') {
    const upgrades = CRUSADE_UPGRADES.map((upgrade) => {
      const tier = state.upgrades[upgrade.id] || 0;
      const maxed = tier >= upgrade.tiers.length;
      const cost = maxed ? 0 : upgrade.tiers[tier].cost;
      return `<article class="crusade-card earned">
        <strong>${esc(upgrade.name)}</strong><em>${tier}/${upgrade.tiers.length}${maxed ? ' · MAKS' : ` · ${cost} SIGIL`}</em>
        <p>${esc(upgrade.desc)}</p>
        <button class="btn btn-ghost crusade-mini" type="button" data-crusade-upgrade="${upgrade.id}" ${maxed ? 'disabled' : ''}><span>NAIKKAN</span></button>
      </article>`;
    }).join('');
    return `<p class="crusade-note">Sigil Perang: <strong>${state.sigils}</strong>. Dibawa dari bos dan dipakai permanen di Kemah Perang.</p>
      <div class="crusade-grid">${upgrades}</div>`;
  }
  const archive = crusadeArchive(state);
  const summary = crusadeSummary(state);
  return `<div class="crusade-archive">
    <p class="crusade-note">${esc(CRUSADE_SUBTITLE)}</p>
    <h3 class="crusade-section-title">PANJI BOS</h3>
    <div class="crusade-grid">${archive.bosses.map((boss) => `<article class="crusade-card ${boss.cleared ? 'earned' : 'unseen'}"><strong>${boss.glyph} ${esc(boss.name)}</strong><em>${boss.cleared ? 'GUGUR' : 'BELUM'}</em><p>${esc(boss.title)}</p><span class="crusade-card-meta">${boss.phases} fase · ${boss.maxHp} HP</span></article>`).join('')}</div>
    <h3 class="crusade-section-title">STATISTIK PERANG</h3>
    <div class="crusade-stat-row"><span>Turun</span><strong>${summary.runs}</strong><span>Gugur</span><strong>${summary.deaths}</strong><span>Chain</span><strong>${summary.bestChain}</strong><span>Strike</span><strong>${summary.strikes}</strong></div>
    <div class="crusade-rift">
      <strong>THE RIFT · ${riftUnlocked(progress) ? 'TERBUKA' : 'TERKUNCI'}</strong>
      <p>${summary.arc4Hook ? 'Zirah Paladin kosong, dan Celah di bawah langit kini terbuka untuk dijelajahi.' : 'Gerbang Penghakiman belum jatuh. Celah di langit masih tertutup.'}</p>
      <p class="crusade-card-meta">${esc(CRUSADE_RIFT.note)}</p>
    </div>
    <p class="micro">The Radiant Crusade · ${summary.roomsCleared}/${summary.roomTotal} ruang · ${summary.percent}% arsip lengkap.</p>
  </div>`;
}

function buildCrusadeScreen() {
  const el = $('crusade-screen');
  if (!el) return;
  const state = crusadeState();
  const summary = crusadeSummary(state);
  $('crusade-summary').innerHTML = [
    ['TINGKAT', `${summary.levelsCleared}/${summary.levelTotal}`],
    ['BOS', `${summary.bossesCleared}/${summary.bossTotal}`],
    ['PANJI', `${summary.banners}/${summary.bannerTotal}`],
    ['SIGIL', String(summary.sigils)],
    ['CHAIN', String(summary.bestChain)],
  ].map(([label, value]) => `<div class="crusade-stat"><span>${label}</span><strong>${value}</strong></div>`).join('');
  const tabs = [
    ['levels', 'TINGKAT'],
    ['banners', 'PANJI'],
    ['bestiary', 'BESTIARY'],
    ['camp', 'KEMAH'],
    ['archive', 'ARSIP'],
  ];
  $('crusade-tabs').innerHTML = tabs.map(([id, label]) => `<button class="crusade-tab ${crusadeTab === id ? 'active' : ''}" type="button" data-crusade-tab="${id}">${label}</button>`).join('');
  const body = $('crusade-body');
  body.innerHTML = crusadeTabBody(crusadeTab, state);
  $('crusade-tabs').querySelectorAll('[data-crusade-tab]').forEach((button) => {
    button.addEventListener('click', () => { crusadeTab = button.dataset.crusadeTab; buildCrusadeScreen(); });
  });
  body.querySelectorAll('[data-crusade-level]').forEach((button) => {
    button.addEventListener('click', () => startCrusadeLevel(Number(button.dataset.crusadeLevel)));
  });
  body.querySelectorAll('[data-crusade-boss]').forEach((button) => {
    button.addEventListener('click', () => startCrusadeBoss(button.dataset.crusadeBoss));
  });
  body.querySelectorAll('[data-crusade-upgrade]').forEach((button) => {
    button.addEventListener('click', () => {
      const result = buyCrusadeUpgrade(crusadeState(), button.dataset.crusadeUpgrade);
      if (!result.ok) {
        showToast(result.reason === 'sigils' ? `Butuh ${result.cost} Sigil Perang.` : 'Sudah maksimal.', 1800);
        return;
      }
      saveProgress();
      showToast(`Peningkatan dibeli · ${result.value}`, 1800);
      buildCrusadeScreen();
    });
  });
}

function startCrusadeLevel(levelIndex, { slot = 0 } = {}) {
  const state = crusadeState();
  if (!crusadeLevelUnlocked(state, levelIndex)) {
    showToast('Tingkat itu masih tertutup — jatuhkan bos sebelumnya.', 2200);
    return;
  }
  const config = crusadeRunConfig(state, levelIndex);
  activeCrusadeLevel = config.level.index;
  activeCrusadeBoss = null;
  let entry = clamp(Number(slot) || 0, 0, CRUSADE_ROOMS_PER_LEVEL - 1);
  while (entry > 0 && !crusadeRoomUnlocked(state, config.level.roomStart + entry)) entry -= 1;
  beginCrusadeRun(config.level.roomStart + entry, config.run);
}

function startCrusadeBoss(bossId) {
  const state = crusadeState();
  const boss = CRUSADE_BOSS_BY_ID[bossId];
  if (!boss) return;
  if (!crusadeBossUnlocked(state, bossId)) {
    showToast('Bos itu masih tertahan di balik barisan.', 2000);
    return;
  }
  const config = crusadeRunConfig(state, boss.levelIndex);
  activeCrusadeLevel = boss.levelIndex;
  activeCrusadeBoss = boss.id;
  beginCrusadeRun(boss.roomIndex, config.run);
}

function beginCrusadeRun(roomIndex, run) {
  audio.init();
  attempts = 1;
  coopGuestMode = false;
  coopGuestRoom = -1;
  labRun = null;
  labDirector = null;
  speedrunRun = null;
  fallenRun = null;
  fallenEndingOpen = false;
  crusadeClearOpen = false;
  activeRunKind = 'crusade';
  crusadeRun = run;
  crusadeStartedAt = performance.now();
  crusadeLastBossHp = -1;
  crusadeLastHp = 0;
  crusadeHudKey = '';
  game.labyrinth = false;
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  game.player.relic = true;
  game.enterRoom(roomIndex);
  game.player.maxHp = run.maxHp;
  game.player.hp = run.maxHp;
  // Seed the damage watcher with the boss that just spawned so the opening
  // hit counts toward the Valor Chain instead of being swallowed.
  crusadeLastBossHp = game.boss ? game.boss.hp : -1;
  crusadeBaseDamage = game.player.damageMult || 1;
  game.player.damageMult = crusadeBaseDamage;
  game.ash = Math.max(game.ash, 60);
  crusadeLastHp = game.player.hp;
  game.events.length = 0;
  started = true;
  paused = false;
  hunterShopOpen = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'none';
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  clearHeldKeys();
  discoverCurrentRoom(roomIndex);
  showBanner(game.room.name, game.room.subtitle);
  showToast(`⚑ ${CRUSADE_LOCAL_NAME} — ${CRUSADE_LEVELS[activeCrusadeLevel]?.localName || 'Barisan'}`, 2600);
  syncScreens();
  updateHud();
  updateCrusadeHud(true);
}

function handleCrusadeBoss(ev) {
  const room = CRUSADE_ROOM_BY_ID[ev.room];
  const bossId = room?.crusadeBoss;
  if (!bossId) return;
  const boss = CRUSADE_BOSS_BY_ID[bossId];
  const result = recordCrusadeBoss(crusadeState(), bossId);
  activeCrusadeBoss = null;
  if (!result.ok) return;
  game.player.hp = Math.min(game.player.maxHp, game.player.hp + game.player.maxHp * 0.25);
  if (result.firstClear) {
    saveProgress();
    updateMenuProgress();
    const banner = result.banner ? ` · panji ${CRUSADE_BANNERS.find((b) => b.id === result.banner)?.name || result.banner}` : '';
    showToast(`⚑ ${boss.name} gugur · +${result.sigils} Sigil${banner}`, 3000);
  }
  if (boss.final) {
    recordCrusadeRun(crusadeState(), Math.max(1, (performance.now() - crusadeStartedAt) / 1000), { won: true });
    saveProgress();
    updateMenuProgress();
    openCrusadeClear();
  }
}

function openCrusadeClear() {
  crusadeClearOpen = true;
  const summary = crusadeSummary(crusadeState());
  $('crusade-clear-title').textContent = 'ZIRAHTU KOSONG';
  $('crusade-clear-body').innerHTML = `
    <p>Paladin Templar jatuh. Zirahnya kosong, dan di dalamnya ada nyala merah yang tidak pernah berasal dari surga.</p>
    <div class="crusade-rift">
      <strong>CELAH TERBUKA</strong>
      <p>Sebuah garis merah membelah langit di atas Gerbang Penghakiman. Paduan suara berhenti di tengah nada. Dari celah itu, satu suara berkata: <em>“Terima kasih telah membuka pintunya.”</em></p>
    </div>
    <p class="crusade-card-meta">${summary.levelsCleared}/5 tingkat · ${summary.bossesCleared}/5 bos · ${summary.banners}/5 panji · ${summary.sigils} Sigil · Arc IV: The Devilish Scum masih terkunci.</p>`;
  $('crusade-clear-options').innerHTML = `
    <button class="btn btn-primary" type="button" id="crusade-clear-camp"><span>KEMBALI KE KEMAH PERANG</span></button>
    <button class="btn btn-ghost" type="button" id="crusade-clear-heaven"><span>MENU LANGIT</span></button>`;
  $('crusade-clear-camp').addEventListener('click', () => {
    crusadeClearOpen = false;
    crusadeRun = null;
    showCrusadeMenu();
  });
  $('crusade-clear-heaven').addEventListener('click', () => {
    crusadeClearOpen = false;
    crusadeRun = null;
    showFallenMenu();
  });
  syncScreens();
}

function crusadeStrike() {
  if (activeRunKind !== 'crusade' || !crusadeRun) return { ok: false };
  const result = crusaderStrike(crusadeRun);
  if (!result.ok) {
    showToast(`Valor Chain butuh ${result.need || 5} untuk Crusader Strike. Pukul tanpa terkena.`, 2200);
    updateCrusadeHud(true);
    return result;
  }
  const boss = game.boss;
  if (boss && !boss.dying) {
    if (boss.purityShield > 0) boss.purityShield = Math.max(0, boss.purityShield - result.shieldBreak);
    const broken = boss.kind === 'crusade_giant_paladin' && boss.phase >= 2 ? breakPaladinChain(boss) : null;
    game.hurtBoss(result.damage);
    if (broken?.broke) showToast('Chain Paladin pecah — ia terhuyung!', 2200);
  }
  showToast(`⚔ CRUSADER STRIKE — ${result.damage} damage · chain ${Math.floor(result.valor)}`, 2200);
  updateCrusadeHud(true);
  return result;
}

function tickCrusade(dt) {
  if (activeRunKind !== 'crusade' || !crusadeRun) return;
  const player = game.player;
  const boss = game.boss;
  if (boss && !boss.dying) {
    if (crusadeLastBossHp < 0) crusadeLastBossHp = boss.hp;
    if (boss.hp < crusadeLastBossHp) {
      const damage = crusadeLastBossHp - boss.hp;
      crusadeLastBossHp = boss.hp;
      valorHit(crusadeRun, { damage });
    }
    if (boss.kind === 'crusade_giant_paladin' && boss.phase >= 2) {
      paladinChainTick(boss, dt, true);
    }
  } else {
    crusadeLastBossHp = -1;
  }
  if (player.hp < crusadeLastHp - 0.01) {
    const broke = valorBreak(crusadeRun);
    const now = performance.now();
    if (broke.lost >= 3 && now - crusadeBreakHintAt > 4000) {
      crusadeBreakHintAt = now;
      showToast(`Valor Chain patah (−${Math.floor(broke.lost)}). Jangan terkena.`, 1800);
    }
  }
  crusadeLastHp = player.hp;
  player.damageMult = crusadeBaseDamage * valorMultiplier(crusadeRun);
}

function updateCrusadeHud(force = false) {
  const hud = $('crusade-hud');
  if (!hud) return;
  if (activeRunKind !== 'crusade' || !crusadeRun) {
    hud.classList.add('hidden');
    return;
  }
  hud.classList.remove('hidden');
  const bossChain = game.boss?.kind === 'crusade_giant_paladin' ? (game.boss.valorChain || 0) : 0;
  const key = `${Math.floor(crusadeRun.valor)}|${crusadeRun.valorMax}|${crusadeRun.strikes}|${crusadeRun.banners.length}|${bossChain}|${crusadeState().sigils}`;
  if (!force && key === crusadeHudKey) return;
  crusadeHudKey = key;
  const pct = Math.max(0, Math.min(1, crusadeRun.valor / (crusadeRun.valorMax || 10))) * 100;
  $('crusade-valor-fill').style.width = `${pct}%`;
  $('crusade-valor-text').textContent = valorStrikeReady(crusadeRun) ? `⚔ STRIKE ${Math.floor(crusadeRun.valor)}` : `CHAIN ${Math.floor(crusadeRun.valor)}`;
  $('crusade-sigils').textContent = `⚑ ${crusadeState().sigils || 0}`;
  $('crusade-banners').textContent = crusadeRun.banners.length ? `PANJI ${crusadeRun.banners.length}` : 'TANPA PANJI';
  $('crusade-boss-chain').textContent = bossChain ? `CHAIN PALADIN ${bossChain}/5` : '';
  const strike = hud.querySelector('[data-crusade-action="strike"]');
  if (strike) strike.disabled = !valorStrikeReady(crusadeRun);
}

function crusadeKeydown(event) {
  if (activeRunKind !== 'crusade' || !started || menuView !== 'none' || crusadeClearOpen) return;
  if (event.code === 'KeyG') {
    event.preventDefault();
    crusadeStrike();
  }
}
window.addEventListener('keydown', crusadeKeydown);

function startRiftRoom(roomIndex = RIFT_ROOM_START) {
  const target = clamp(Math.floor(Number(roomIndex) || RIFT_ROOM_START), RIFT_ROOM_START, RIFT_ROOM_START + RIFT_ROOM_COUNT - 1);
  if (typeof trailerActive !== 'undefined' && trailerActive) closeTrailer();
  cancelPrologue();
  closeDialogue(true);
  started = true;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  spectating = false;
  spectateGame = null;
  activeRunKind = 'rift';
  menuView = 'none';
  progress.rift = sanitizeRiftProgress(progress.rift);
  progress.rift.unlocked = true;
  game.reset();
  game.state = 'playing';
  game.loadRoom(target);
  clearHeldKeys();
  syncScreens();
  updateHud();
}

function buildRiftScreen() {
  const summary = riftSummary(progress);
  const sumEl = $('rift-summary');
  if (sumEl) {
    sumEl.innerHTML = [
      ['RUANG', `${summary.rooms}/${summary.totalRooms}`],
      ['BOS', `${summary.bosses}/${summary.totalBosses}`],
      ['RAHASIA', `${summary.secrets}/${summary.totalSecrets}`],
      ['RESONANCE', summary.bestResonance],
      ['PHASE-SHIFT', String(summary.phaseShifts)],
    ]
      .map(([label, value]) => `<div class="crusade-stat"><span>${label}</span><strong>${value}</strong></div>`)
      .join('');
  }
  const body = $('rift-body');
  if (!body) return;
  body.innerHTML = `<div class="crusade-grid">${RIFT_REGIONS.map((region) => {
    const boss = RIFT_BOSS_INFO[region.boss];
    const bossDown = !!progress.rift?.bosses?.[region.boss];
    return `<article class="crusade-card ${bossDown ? 'earned' : ''}">
      <strong>${region.glyph} ${esc(region.name)}</strong>
      <em>${bossDown ? 'DITAKLUKKAN' : `RUANG ${region.roomStart}–${region.roomEnd}`}</em>
      <p>${esc(region.gimmick)}</p>
      <p class="crusade-card-meta">Bos: ${esc(boss?.name || region.boss)}</p>
      <button type="button" class="btn btn-primary" data-rift-start="${region.roomStart}">MASUK WILAYAH ${region.order}</button>
    </article>`;
  }).join('')}</div>`;
  body.querySelectorAll('[data-rift-start]').forEach((btn) => {
    btn.addEventListener('click', () => startRiftRoom(Number(btn.dataset.riftStart)));
  });
}

function showRiftScreen() {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  settingsOpen = false;
  closeDialogue(true);
  spectating = false;
  spectateGame = null;
  menuView = 'rift';
  game.reset();
  clearHeldKeys();
  buildRiftScreen();
  syncScreens();
}

// ── debug hooks (used by automated smoke tests) ─────────────────────────
window.__ashen = {
  get rift() {
    return {
      ...riftSummary(progress),
      fracturePhase: game.fracturePhase,
      resonance: Math.round(game.resonance || 0),
      resonanceRank: game.resonanceRank || 'D',
      roomIndex: game.roomIndex,
    };
  },
  riftStart(roomIndex = RIFT_ROOM_START) {
    startRiftRoom(roomIndex);
    return { ok: true, room: game.roomIndex };
  },
  riftPhaseShift() {
    return { ok: game.phaseShift(true), phase: game.fracturePhase, resonance: Math.round(game.resonance || 0), rank: game.resonanceRank };
  },
  get resonance() {
    return {
      value: Math.round(game.resonance || 0),
      rank: game.resonanceRank || 'D',
      damageMult: Number(game.resonanceDamageMult().toFixed(3)),
      speedMult: Number(game.resonanceSpeedMult().toFixed(3)),
    };
  },
  get secrets() {
    return {
      state: JSON.parse(JSON.stringify(secretsState)),
      summary: secretSummary(secretsState),
      mode: currentSecretMode(),
      levelRunes: SECRET_LEVEL_RUNES.length,
      modes: SECRET_MODE_KEYS.length,
      rune: game.secretRune ? { ...game.secretRune } : null,
    };
  },
  get secretSpots() {
    return SECRET_LEVEL_RUNES.map((rune) => ({ ...rune }));
  },
  get secretSequence() {
    return SECRET_SEQUENCE.slice();
  },
  claimSecret(id) {
    const result = recordSecret(secretsState, id);
    if (result.ok) { secretsState = result.state; saveSecretsState(); }
    return result;
  },
  get creditScene() {
    return {
      open: creditSceneOpen,
      arc: creditSceneCurrent?.id || null,
      title: creditSceneCurrent?.title || null,
      roles: creditSceneCurrent?.roles?.map((entry) => ({ ...entry })) || [],
    };
  },
  get creditArcs() {
    return CREDIT_ARCS.map((arc) => ({ id: arc.id, numeral: arc.numeral, title: arc.title, bosses: JSON.parse(JSON.stringify(arc.bosses)) }));
  },
  get creditDebug() {
    return {
      lastEvent: lastCreditEvent ? { ...lastCreditEvent } : null,
      lastAttempt: lastCreditAttempt ? { ...lastCreditAttempt } : null,
      pendingTimer: !!creditSceneDelayTimer,
      open: creditSceneOpen,
      started,
      menuView,
      runKind: activeRunKind,
      gameState: game.state,
    };
  },
  creditArcFor(runKind, kind) {
    const arc = creditArcFor(runKind, kind);
    return arc ? { id: arc.id, numeral: arc.numeral, title: arc.title } : null;
  },
  openCreditScene(arcId = 'arc1') {
    return openCreditScene(arcId);
  },
  closeCreditScene,
  get cistern() {
    const p = cisternState();
    return {
      state: JSON.parse(JSON.stringify(p)),
      summary: cisternSummary(p),
      unlocked: cisternUnlocked(progress),
      stage: activeCisternStage,
      stageCount: CISTERN_STAGE_COUNT,
      rooms: CISTERN_ROOMS.map((room) => ({ id: room.id, name: room.name, secret: !!room.secret })),
      stages: CISTERN_STAGE_META.map((stage) => ({ ...stage })),
    };
  },
  startCisternStage(local = 0) {
    startCisternStage(local);
  },
  unlockCistern() {
    progress.cleared[7] = true;
    progress.unlocked = Math.max(progress.unlocked, 8);
    saveProgress();
    buildLevelCards();
    return cisternUnlocked(progress);
  },
  cisternClear(local) {
    const result = recordCisternStage(cisternState(), local);
    saveProgress();
    return result;
  },
  cisternDiscover(local) {
    discoverCisternRoom(local);
    return cisternState().discovered.slice();
  },
  get lanternwake() {
    const p = lanternState();
    return {
      summary: lanternSummary(p),
      unlocked: lanternwakeUnlocked(progress),
      state: { ...p, halls: [...p.halls], discovered: p.discovered.map(Boolean) },
      stageCount: LANTERN_STAGE_COUNT,
      rooms: LANTERN_ROOMS.map((room) => ({ id: room.id, name: room.name, enemies: room.enemies.length })),
      stages: LANTERN_STAGE_META.map((stage) => ({ ...stage })),
    };
  },
  lanternwakeStart(local) {
    startLanternwakeStage(local);
    return { runKind: activeRunKind, stage: activeLanternStage, room: game.roomIndex };
  },
  lanternwakeClear(local) {
    const result = recordLanternStage(lanternState(), local);
    saveProgress();
    buildLanternwakeCards();
    return result;
  },
  lanternwakeBossClear() {
    handleLanternwakeBoss();
    return lanternSummary(lanternState());
  },
  get frontiers() {
    const state = frontierState();
    return {
      summary: frontierCampaignSummary(state),
      unlocked: frontierCampaignUnlocked(progress),
      chapterView: frontierChapterView,
      activeIndex: activeFrontierIndex,
      runKind: activeRunKind,
      level: game.room?.frontierLevel ?? null,
      chapters: FRONTIER_CHAPTER_META.map((chapter) => ({
        ...chapter,
        progress: frontierChapterProgress(state, chapter.number),
      })),
    };
  },
  frontierStart(index) {
    startFrontierLevel(index);
    return {
      runKind: activeRunKind,
      index: activeFrontierIndex,
      room: game.roomIndex,
      level: game.room?.frontierLevel ?? null,
      enemies: game.enemies.length,
      boss: game.boss?.kind ?? null,
    };
  },
  frontierClear(index) {
    const result = handleFrontierLevelClear(index);
    buildFrontierScreen();
    return result;
  },
  frontierChapter(number) {
    frontierChapterView = Math.trunc(Number(number)) || 11;
    buildFrontierScreen();
    return frontierChapterView;
  },
  get overdrive() {
    const state = overdriveState();
    return {
      summary: overdriveCampaignSummary(state),
      unlocked: overdriveCampaignUnlocked(progress),
      chapterView: overdriveChapterView,
      activeIndex: activeOverdriveIndex,
      runKind: activeRunKind,
      level: game.room?.overdriveLevel ?? null,
      chapters: OVERDRIVE_CHAPTER_META.map((chapter) => ({
        ...chapter,
        progress: overdriveChapterProgress(state, chapter.number),
      })),
    };
  },
  showOverdrive,
  closeOverdrive,
  overdriveStart(index) {
    startOverdriveLevel(index);
    return {
      runKind: activeRunKind,
      index: activeOverdriveIndex,
      room: game.roomIndex,
      level: game.room?.overdriveLevel ?? null,
      enemies: game.enemies.length,
      boss: game.boss?.kind ?? null,
    };
  },
  overdriveClear(index) {
    const result = handleOverdriveLevelClear(index);
    buildOverdriveScreen();
    return result;
  },
  overdriveChapter(number) {
    overdriveChapterView = Math.trunc(Number(number)) || 21;
    buildOverdriveScreen();
    return overdriveChapterView;
  },
  overdriveCast() {
    const st = overdriveState();
    const { school, spell } = overdriveSpellFor(st.activeSchool, st.activeSpellIndex);
    return game.castOverdriveSpell(spell, school.color);
  },
  cisternBossDown() {
    handleCisternBoss({ kind: 'tidebound' });
    return cisternSummary(cisternState());
  },
  get veil() {
    return veilDebugState();
  },
  get veilStages() {
    return VEIL_STAGES.map((stage) => ({ id: stage.id, chapter: stage.chapter, name: stage.name, room: stage.room, enemies: 20, elite: 1 }));
  },
  get veilBosses() {
    return VEIL_BOSSES.map((boss) => ({ id: boss.id, name: boss.name, phases: boss.maxPhases }));
  },
  get veilChapters() {
    return VEIL_CHAPTERS.map((chapter) => ({ id: chapter.id, name: chapter.name, boss: chapter.boss }));
  },
  get veilGhosts() {
    return GHOSTS.map((ghost) => ({ id: ghost.id, name: ghost.name, classification: ghost.classification, rarity: ghost.rarity, secret: ghost.secret, evidence: ghost.requiredEvidence.slice() }));
  },
  get veilTabs() {
    return VEIL_TABS.slice();
  },
  get veilFacilities() {
    return VEIL_FACILITIES.slice();
  },
  get veilAchievements() {
    return VEIL_ACHIEVEMENTS.slice();
  },
  get veilSettings() {
    return veilSettings();
  },
  get eternal() {
    const controller = ensureEternal();
    return { ...controller.snapshot(), tab: eternalTab, runKind: activeRunKind, settings: eternalSettings(), stages: ETERNAL_STAGES.length, bosses: ETERNAL_BOSSES.length };
  },
  get eternalSettings() {
    return eternalSettings();
  },
  get eternalChapters() {
    return ETERNAL_CHAPTERS.slice();
  },
  get eternalStages() {
    return ETERNAL_STAGES.slice();
  },
  get eternalBosses() {
    return ETERNAL_BOSSES.slice();
  },
  get eternalEquipment() {
    return ETERNAL_EQUIPMENT.slice();
  },
  get eternalHuntVariants() {
    return HUNT_VARIANTS.slice();
  },
  get eternalWorldEvents() {
    return WORLD_EVENTS.slice();
  },
  get eternalRankMilestones() {
    return INDEX_RANK_MILESTONES.slice();
  },
  showVeil: openVeil,
  openVeil,
  closeVeil,
  buildVeilScreen,
  setVeilTab,
  startVeilStage,
  startVeilBoss,
  veilTick(dt = 1 / 60) {
    return veilTick(dt);
  },
  veilRecover(amount = 20) {
    if (!veilController) return null;
    veilController.sanity.recover(amount, 'events');
    veilController.save.sanity.value = veilController.sanity.value;
    return veilController.sanity.snapshot();
  },
  veilSpawnGhost(kind) {
    if (activeRunKind !== 'veil') return null;
    const ghost = game.spawnGhost(kind, Math.max(80, game.player.x + 260));
    if (ghost) veilController?.witness(kind);
    return ghost;
  },
  veilCompleteBoss() {
    return completeVeilBoss();
  },
  veilEvidence(kind, type) {
    const result = veilController?.evidence(kind, type);
    if (result?.ok) { ensureArchive().observeGhost(kind); saveArchiveProfile(); saveVeilProfile(); }
    return result;
  },
  veilDocument(kind) {
    const result = veilController?.document(kind);
    if (result) { if (result.ok) ensureArchive().observeGhost(kind); saveArchiveProfile(); saveVeilProfile(); }
    return result;
  },
  veilClaimMission(id) {
    return claimVeilMission(id);
  },
  veilSolveCase() {
    return solveVeilCase();
  },
  veilSave: saveVeilProfile,
  veilSetSanity(value) {
    const controller = ensureVeil();
    controller.sanity.setValue(Number(value) || 0);
    controller.save.sanity.value = controller.sanity.value;
    veilHudCache = '';
    updateVeilHud();
    return controller.sanity.snapshot();
  },
  veilSetZone(id) {
    const controller = ensureVeil();
    controller.sanity.setZone(id);
    controller.save.sanity.zone = controller.sanity.zone;
    return controller.sanity.snapshot();
  },
  veilUnlockAll() {
    const controller = ensureVeil();
    controller.save.campaign.completedStages = VEIL_STAGES.map((stage) => stage.id);
    controller.save.campaign.bossClears = VEIL_BOSSES.filter((boss) => !boss.final).map((boss) => boss.id);
    controller.save.campaign.chapterClears = VEIL_CHAPTERS.map((chapter) => chapter.id);
    saveVeilProfile();
    return controller.save.campaign;
  },
  veilSetSetting(path, value) {
    return applyVeilSetting(path, value);
  },
  showEternal: openEternal,
  openEternal,
  closeEternal,
  buildEternalScreen,
  setEternalTab,
  startEternalStage,
  startEternalBoss,
  startEternalHunt,
  eternalTick(dt = 1 / 60) { return eternalTick(dt); },
  eternalCompleteBoss() { return completeEternalBoss(); },
  eternalUnlockAll() {
    const controller = ensureEternal();
    controller.unlock();
    controller.save.campaign.completedStages = ETERNAL_STAGES.map((stage) => stage.id);
    controller.save.campaign.bossClears = ETERNAL_BOSSES.filter((boss) => !boss.final).map((boss) => boss.id);
    controller.save.campaign.chapterClears = ETERNAL_CHAPTERS.map((chapter) => chapter.id);
    saveEternalProfile();
    buildEternalScreen();
    return controller.save.campaign;
  },
  eternalUnlockFinal() {
    const controller = ensureEternal();
    controller.unlock();
    controller.save.campaign.completedStages = ETERNAL_STAGES.map((stage) => stage.id);
    controller.save.campaign.bossClears = ETERNAL_BOSSES.filter((boss) => !boss.final).map((boss) => boss.id);
    controller.save.campaign.chapterClears = ETERNAL_CHAPTERS.map((chapter) => chapter.id);
    saveEternalProfile();
    buildEternalScreen();
    return controller.save.campaign;
  },
  eternalSetSetting(path, value) {
    return applyEternalSetting(path, value);
  },
  eternalSetSanity(value) {
    const controller = ensureVeil();
    controller.sanity.setValue(Number(value) || 0);
    veilHudCache = '';
    updateVeilHud();
    return controller.sanity.snapshot();
  },
  eternalSetExposure(value) {
    const controller = ensureVeil();
    controller.sanity.exposure = Math.max(0, Math.min(100, Number(value) || 0));
    veilHudCache = '';
    return controller.sanity.snapshot();
  },
  eternalSetFocus(value) {
    const controller = ensureVeil();
    controller.sanity.focus = Math.max(0, Math.min(100, Number(value) || 0));
    veilHudCache = '';
    return controller.sanity.snapshot();
  },
  eternalGenerateCase(seed, options = {}) {
    const result = ensureEternal().generateCase({ seed, ...options });
    saveEternalProfile();
    return result;
  },
  eternalCompleteCase(id, evidence = 99) {
    const controller = ensureEternal();
    const mission = controller.save.investigations.generated.find((m) => m.id === id);
    const result = controller.completeCase(id, { steps: mission?.steps || [], evidence });
    if (result.ok) {
      ensureArchive().recordCase({ stageId: controller.activeStage });
      saveArchiveProfile();
      saveEternalProfile();
    }
    return result;
  },
  get archive() {
    const controller = ensureArchive();
    return { ...controller.dashboard(), tab: archiveTab, arc: archiveArc, stage: archiveStageId, save: controller.toJSON(), statuses: Object.fromEntries(ARCHIVE_STAGES.map((s) => [s.id, controller.stageStatus(s.id)])) };
  },
  get archiveData() {
    return { arcs: ARCHIVE_ARCS, chapters: ARCHIVE_CHAPTERS, stages: ARCHIVE_STAGES, bosses: ARCHIVE_BOSSES, ghosts: GHOSTS.length, jumpscares: JUMPSCARE_EVENTS, tools: ARCHIVE_TOOLS, achievements: ARCHIVE_ACHIEVEMENTS };
  },
  openArchive,
  closeArchive,
  buildArchiveScreen,
  setArchiveTab,
  archivePreview(stageId) { return openArchivePreview(stageId); },
  closeArchivePreview,
  archiveCheck(stageId) { archiveStageId = stageId; archiveTab = 'checker'; const result = ensureArchive().checkStage(stageId); buildArchiveScreen(); return result; },
  archiveDocGhost(id) { return archiveGhostAction('document', id); },
  archiveDocScare(id) { return archiveDocumentScare(id); },
  archiveCapture(id) { const result = ensureArchive().captureGhost(id); if (result.ok) { saveArchiveProfile(); saveVeilProfile(); buildArchiveScreen(); } return result; },
  archivePrepare(id) { archivePrepareGhost = id; archiveTab = 'equipment'; buildArchiveScreen(); return ensureArchive().prepare(id); },
  archiveSave: saveArchiveProfile,
  eternalUpgrade(id) {
    const result = ensureEternal().upgradeEquipment(id);
    if (result.ok) saveEternalProfile();
    return result;
  },
  eternalEvent(id) {
    const controller = ensureEternal();
    const result = controller.activateEvent(id, Date.now());
    return result;
  },
  eternalEventStep(index) {
    return ensureEternal().contributeEvent(index);
  },
  eternalEventComplete() {
    const result = ensureEternal().completeEvent();
    if (result.ok) saveEternalProfile();
    return result;
  },
  eternalCreateExpedition(options = {}) {
    const session = ensureEternal().createExpedition(options);
    saveEternalProfile();
    return session;
  },
  eternalJoinExpedition(sessionId, playerId = 'guest', role = 'archivist') {
    const result = ensureEternal().joinExpedition(sessionId, playerId, role);
    if (result.ok) saveEternalProfile();
    return result;
  },
  eternalGrant(currency, amount) {
    const controller = ensureVeil();
    const result = controller.progression.award(currency, amount, `debug:${currency}:${Date.now()}`);
    saveVeilProfile();
    return result;
  },
  eternalCoopTask(sessionId, taskId) {
    return ensureEternal().completeExpeditionTask(sessionId, taskId);
  },
  eternalCoopComplete(sessionId) {
    const result = ensureEternal().completeExpedition(sessionId);
    if (result.ok) saveEternalProfile();
    return result;
  },
  eternalClaimRanks() {
    const result = ensureEternal().claimRankRewards();
    saveEternalProfile();
    return result;
  },
  eternalProfile() {
    return ensureEternal().dashboard();
  },
  eternalSave: saveEternalProfile,
  get gfx3D() {
    return gfx3DStatus();
  },
  get mode3dContent() {
    return content3DSummary();
  },
  get horror3D() {
    return {
      save: horror3D,
      summary: horror3DSummary(horror3D),
      sites: HORROR3D_SITES.map((entry) => ({ id: entry.id, name: entry.name, level: entry.level, difficulty: entry.difficulty, building: entry.building })),
      snapshot: game3D?.horrorSnapshot() || null,
    };
  },
  get horror3DSnapshot() {
    return game3D?.horrorSnapshot() || null;
  },
  get game3D() {
    return game3D;
  },
  horror3DCollect(index = 0) {
    const h = game3D?.horror;
    if (!h || !h.active) return null;
    const echo = h.site.echoes[index];
    if (!echo) return null;
    game3D.player.x = echo.x;
    game3D.player.z = echo.z;
    game3D.update(1 / 60, { interactJustPressed: true });
    drain3DHorrorEvents();
    return game3D.horrorSnapshot();
  },
  horror3DExit() {
    const h = game3D?.horror;
    if (!h || !h.active) return null;
    game3D.player.x = h.site.exit.x;
    game3D.player.z = h.site.exit.z - 10;
    game3D.update(1 / 60, {});
    drain3DHorrorEvents();
    return game3D.horrorSnapshot();
  },
  render3DFrame() {
    const canvas = $('canvas-3d');
    const ctx = canvas?.getContext('2d');
    if (!ctx || !game3D) return null;
    render3D(ctx, game3D);
    return gfx3DStatus();
  },
  start3DHorror,
  restart3DHorror,
  buildHorror3DPanel,
  get mode3dAreas() {
    return game3D
      ? {
          area: game3D.areaId,
          relics: [...game3D.relics],
          echoes: game3D.echoes,
          modifiers: { ...game3D.modifiers },
          vault: game3D.vault ? { ...game3D.vault } : null,
          enemies: game3D.enemies.length,
          elite: game3D.elite ? game3D.elite.name : null,
          boss: game3D.boss ? game3D.boss.name : null,
        }
      : null;
  },
  setArea3D(areaId) {
    return game3D ? game3D.setArea(areaId) : false;
  },
  pickRelic3D(relicId) {
    return game3D ? game3D.pickRelic(relicId) : false;
  },
  get capabilities() {
    return detectCapabilities();
  },
  get scary() {
    return scareDirector ? scareDirector.snapshot() : null;
  },
  get scary2() {
    return horrorPresentation
      ? {
        enabled: horrorPresentation.enabled,
        difficulty: horrorPresentation.difficulty,
        antiJumpscare: horrorPresentation.antiJumpscare,
        suppression: horrorPresentation.suppression.slice(),
        jumpscares: { ...horrorPresentation.jumpscares },
        visual: { ...horrorPresentation.visual },
        audio: { ...horrorPresentation.audio },
        gameplay: { ...horrorPresentation.gameplay },
        enemy: { ...horrorPresentation.enemy },
      }
      : null;
  },
  get horror() {
    return {
      enabled: horrorSettings().enabled,
      difficulty: horrorSettings().difficulty,
      antiJumpscare: horrorSettings().antiJumpscare,
      presentation: horrorPresentation,
      director: horrorDirector ? horrorDirector.snapshot() : null,
      journal: horrorJournal.snapshot(),
      ledger: horrorLedger.snapshot(),
      presence: horrorPresence ? { ...horrorPresence } : null,
      events: horrorEventLayer,
      quickToggle: document.getElementById('btn-pause-anti')?.textContent || null,
    };
  },
  get horrorEvents() {
    return HORROR_EVENT_LIST.map((entry) => ({ id: entry.id, label: entry.label, duration: entry.duration, cooldown: entry.cooldown, antiJumpscare: entry.antiJumpscare, minDifficulty: entry.minDifficulty, requires: entry.requires.slice() }));
  },
  get horrorJournal() {
    return horrorJournal.snapshot();
  },
  get horrorTabs() {
    return HORROR_TABS.map((tab) => ({ ...tab, count: horrorSettingsForTab(tab.id).length }));
  },
  get scaryEnemies() {
    return Object.values(SCARY_ENEMIES).map((entry) => ({ id: entry.id, name: entry.name, tactic: entry.tactic, hp: entry.hp, damage: entry.damage }));
  },
  get dread() {
    return {
      settings: dreadSettings(),
      presentation: resolveDreadPresentation(dreadSettings(), settings.scary || {}),
      environment: game.dreadEnvironmentId,
      environmentLabel: game.dreadEnv ? game.dreadEnv.label : null,
      journal: dreadJournal.snapshot(),
      events: dreadDirector.snapshot(),
      awareness: dreadAwareness.snapshot(),
      boss: game.boss && game.boss.dreadBoss ? { kind: game.boss.dreadBoss, phase: game.boss.phase, hp: game.boss.hp, maxHp: game.boss.maxHp } : null,
      mode: dreadActiveMode,
      equipment: dreadEquipmentLoadout.slice(),
      layer: { ...dreadEventLayer },
    };
  },
  get dreadEnvironments() {
    return DREAD_ENVIRONMENT_LIST.map((env) => ({ id: env.id, label: env.label, mechanics: env.mechanics.slice(), ceilings: env.ceilings.length, platforms: env.room.platforms.length, props3D: env.threeD.props.length }));
  },
  get dreadEnemies() {
    return UNNATURAL_LIST.map((entry) => ({ id: entry.id, name: entry.name, tactic: entry.tactic, sight: entry.sightRange, cone: entry.coneDeg, hearing: entry.hearingRange, memory: entry.memoryTime }));
  },
  get dreadBosses() {
    return DREAD_BOSS_LIST.map((entry) => ({ id: entry.id, name: entry.name, phases: entry.phases.length, arena: { ...entry.arena } }));
  },
  get dreadModes() {
    return DREAD_MODE_LIST.map((entry) => ({ id: entry.id, label: entry.label, objectives: entry.objectives.map((goal) => ({ ...goal })), reward: entry.reward, progress: dreadModeProgress(entry.id, dreadModeState(entry.id)) }));
  },
  get dreadEquipment() {
    return DREAD_EQUIPMENT.map((entry) => ({ ...entry }));
  },
  get dreadJournal2() {
    return dreadJournal.snapshot();
  },
  get dreadTabs() {
    return DREAD_VIEW_TABS.map((tab) => ({ ...tab }));
  },
  openDread,
  closeDread,
  enterDread,
  startDreadBoss,
  playDreadMode,
  buildDreadScreen,
  setDreadPath,
  resetDreadSettings,
  toggleDreadEquipment,
  connectDreadClues,
  groundAwareness() {
    return dreadAwareness.ground();
  },
  setAwareness(value) {
    dreadAwareness.value = Math.max(0, Math.min(100, Number(value) || 0));
    return dreadAwareness.snapshot();
  },
  spawnUnnatural(kind, x = 500) {
    const enemy = game.spawnUnnatural(kind, x);
    return enemy ? { kind: enemy.unnaturalKind, name: enemy.unnaturalName, hp: enemy.hp, tactic: enemy.unnaturalTactic, surface: enemy.surface } : null;
  },
  dreadEvent(id, ctx = {}) {
    return dreadDirector.tryStart(id, { ...dreadContext(), ...ctx });
  },
  cancelDreadEvent(reason = 'manual') {
    return dreadDirector.active.map((entry) => dreadDirector.cancel(entry.id, reason));
  },
  dreadTick(dt = 1 / 60) {
    dreadTick(dt);
    return { events: dreadDirector.snapshot(), awareness: dreadAwareness.snapshot(), journal: dreadJournal.progress() };
  },
  recordDread(kind, id) {
    const ok = kind === 'mode' ? dreadJournal.recordMode(id)
      : kind === 'boss' ? dreadJournal.recordBoss(id)
        : kind === 'area' ? dreadJournal.completeArea(id)
          : kind === 'entry' ? dreadJournal.discover(id).ok
            : false;
    if (ok) { dreadJournal.grantRewards(); saveDreadState(); }
    return ok;
  },
  recordDreadObjective(modeId, objectiveId, amount = 1) {
    return recordDreadObjective(modeId, objectiveId, amount);
  },
  completeDreadMode,
  openScary,
  closeScary,
  startScaryRun,
  buildScaryScreen,
  get horrorTree() {
    return horrorTreeState();
  },
  rankHorrorTree,
  resetHorrorTree,
  applyHorrorTreeBonuses() {
    return applyHorrorTree(game, horrorTreeBonuses(horrorJournal.skills));
  },
  setHorror(partial = {}) {
    settings.scary = { ...settings.scary, ...(partial || {}) };
    applySettings();
    syncHorror();
    if (menuView === 'scary') buildScaryScreen();
    return horrorSettings();
  },
  setHorrorPath,
  startHorrorEvent(id, ctx = {}) {
    if (!horrorDirector) ensureHorrorDirector();
    const started = horrorDirector.tryStart(id, { ...horrorContext(), ...ctx });
    return typeof started === 'string'
      ? started
      : { id: started.id, phase: started.phase, suppressed: started.suppressed, antiJumpscare: started.antiJumpscare };
  },
  cancelHorrorEvent(reason = 'manual') {
    const ended = horrorDirector ? horrorDirector.cancel(reason) : null;
    return ended ? { id: ended.id, reason: ended.reason } : null;
  },
  toggleAntiJumpscare,
  previewHorrorAudio,
  previewHorrorVisual,
  resetHorrorSettings,
  spawnScaryEnemy(kind, x = 400) {
    const enemy = game.spawnScaryEnemy(kind, x);
    return enemy ? { kind: enemy.scaryKind, name: enemy.scaryName, hp: enemy.hp, x: Math.round(enemy.x) } : null;
  },
  horrorTick(dt = 1 / 60) {
    horrorTick(dt);
    return horrorDirector ? horrorDirector.snapshot() : null;
  },
  get horrorSettings() {
    return horrorSettings();
  },
  recordHorror(kind, id) {
    const ok = horrorJournal.record(kind, id);
    if (ok) {
      horrorJournal.grantRewards();
      saveHorrorState();
    }
    return ok;
  },
  previewScare,
  setScary(partial = {}) {
    settings.scary = { ...settings.scary, ...(partial || {}) };
    applySettings();
    return scareDirector ? scareDirector.snapshot() : null;
  },
  simulateHit(type = 'sentinel', force = false) {
    game.player.invuln = 0;
    const before = game.player.hp;
    const dealt = game.damagePlayer(5, game.player.x + 40, {
      source: { type, family: type, name: type },
    });
    drainEvents();
    if (force && scareDirector) {
      const effect = scareDirector.onPlayerHit(
        { source: { type, family: type, name: type } },
        { hp: game.player.hp, force: true },
      );
      if (effect) audio.playScare(effect);
      return { dealt, before, after: game.player.hp, forced: !!effect, scary: scareDirector.snapshot() };
    }
    return { dealt, before, after: game.player.hp, scary: scareDirector ? scareDirector.snapshot() : null };
  },
  openDebug,
  closeDebug,
  toggleAiDebug,
  get aiDebug() {
    return {
      open: aiDebugOpen,
      enemies: game.aiDebug(),
      boss: game.boss ? bossDebugSnapshot(game.boss) : null,
      nav: game.nav ? game.nav.snapshot() : null,
    };
  },
  get speedrun() {
    return {
      run: speedrunRun ? { ...speedrunRun } : null,
      progress: speedrunState(),
      lastSummary: speedrunLastSummary,
      summaryOpen: speedrunSummaryOpen,
      multiplier: speedrunRun?.multiplier || 0,
      rooms: speedrunRoomCount,
    };
  },
  showSpeedrun,
  startSpeedrun,
  finishSpeedrun,
  get fallen() {
    return {
      state: fallenState(),
      summary: fallenSummary(fallenState()),
      archive: fallenArchive(fallenState()),
      figure: fallenMenuFigure(fallenState()),
      tab: fallenTab,
      run: fallenRun
        ? {
            hp: fallenRun.maxHp,
            radiance: Math.round(fallenRun.radiance),
            radianceMax: fallenRun.radianceMax,
            marks: fallenRun.marks,
            shadow: fallenRun.shadow,
            abilities: [...fallenRun.abilitySet],
            echoes: [...fallenRun.echoes],
            bursts: fallenRun.bursts,
          }
        : null,
      activeRegion: activeFallenRegion,
      activeBoss: activeFallenBoss,
      endingOpen: fallenEndingOpen,
      menuTheme: fallenState().menuTheme,
    };
  },
  get crusade() {
    return {
      state: crusadeState(),
      summary: crusadeSummary(crusadeState()),
      archive: crusadeArchive(crusadeState()),
      camp: crusadeCampFigure(crusadeState()),
      tab: crusadeTab,
      run: crusadeRun
        ? {
            hp: crusadeRun.maxHp,
            valor: Math.round(crusadeRun.valor),
            valorMax: crusadeRun.valorMax,
            strikes: crusadeRun.strikes,
            banners: [...crusadeRun.banners],
          }
        : null,
      activeLevel: activeCrusadeLevel,
      activeBoss: activeCrusadeBoss,
      clearOpen: crusadeClearOpen,
      rift: CRUSADE_RIFT,
    };
  },
  showCrusadeMenu,
  showCrusade,
  buildCrusadeMenu,
  buildCrusadeScreen,
  startCrusadeLevel,
  startCrusadeBoss,
  crusadeStrike,
  unlockCrusadeNow() {
    const result = unlockCrusade(progress);
    if (result.ok) saveProgress();
    updateMenuProgress();
    return result;
  },
  buyCrusadeUpgrade(id) {
    const result = buyCrusadeUpgrade(crusadeState(), id);
    if (result.ok) saveProgress();
    return result;
  },
  addCrusadeSigils(n) {
    const result = addCrusadeSigils(crusadeState(), n);
    saveProgress();
    return result;
  },
  showFallenMenu,
  showFallen,
  buildFallenMenu,
  buildFallenScreen,
  startFallenRegion,
  startFallenBoss,
  fallenBurst,
  fallenShadow,
  fallenCleanse,
  chooseFallenEnding,
  ascendIfEligible,
  ascendNow() {
    const result = ascendProgress(progress);
    if (result.ok) {
      const state = fallenState();
      state.echoes = fallenEchoesFor(progress);
      saveProgress();
      updateMenuProgress();
    }
    return result;
  },
  buyFallenUpgrade(id) {
    const result = buyFallenUpgrade(fallenState(), id);
    if (result.ok) saveProgress();
    return result;
  },
  addFallenShards(n) {
    const result = addFallenShards(fallenState(), n);
    saveProgress();
    return result;
  },
  get fishing() {
    return {
      state: fishingState(),
      summary: fishingSummary(fishingState()),
      index: fishingIndex(fishingState()),
      shop: fishingShopItems(),
      reel: fishingReel
        ? {
            fish: fishingReel.fish.id,
            position: fishingReel.position,
            zone: fishingReel.zone,
            resolved: fishingReel.resolved,
            result: fishingReel.result,
          }
        : null,
      tab: fishIndexTab,
    };
  },
  showFishing,
  closeFishing,
  openBaitShop,
  openFishIndex,
  buyBait: buyFishingBait,
  selectFishingBait,
  beginFishingCast,
  strikeFishingReel,
  setFishIndexTab,
  get game() {
    return game;
  },
  get renderer() {
    return renderer;
  },
  get started() {
    return started;
  },
  get paused() {
    return paused;
  },
  get spectating() {
    return spectating;
  },
  get menuView() {
    return menuView;
  },
  get storyMap() {
    if (storyMapCtrl) return storyMapCtrl.snapshot();
    return { loaded: false, open: menuView === 'storymap', selected: 'arc11', summary: null, arcs: [], arc: null };
  },
  get shopOpen() {
    return shopOpen;
  },
  get hunter() {
    return { ...hunterSummary(hunterState), shopOpen: hunterShopOpen, items: { ...game.player.hunterItems } };
  },
  get mapOpen() {
    return mapOpen;
  },
  get codexOpen() {
    return codexOpen;
  },
  get inventoryOpen() {
    return inventoryOpen;
  },
  get version() {
    return GAME_VERSION;
  },
  get dialogueOpen() {
    return dialogueOpen;
  },
  get prologueActive() {
    return prologueActive;
  },
  get prologueIndex() {
    return prologueIndex;
  },
  get prologueBeat() {
    return PROLOGUE_BEATS[prologueIndex] || null;
  },
  get prologueVoice() {
    return prologueVoice;
  },
  get character() {
    return { ...character };
  },
  get progress() {
    return progress;
  },
  get expansion() {
    return expState();
  },
  get settings() {
    return {
      ...JSON.parse(JSON.stringify(settings)),
      bindings: Object.fromEntries(
        Object.entries(settings.bindings).map(([key, codes]) => [key, [...codes]]),
      ),
    };
  },
  get mode3D() {
    return game3D ? {
      region: game3D.region,
      quality: game3D.quality,
      subMode: game3D.subMode,
      canvas: { w: $('canvas-3d')?.width, h: $('canvas-3d')?.height },
      player: { hp: game3D.player.hp, stamina: game3D.player.stamina },
      enemies: game3D.enemies.filter((enemy) => enemy.hp > 0).length,
    } : null;
  },
  get difficulty() {
    return { active: settings.gameplay.difficulty, engine: game.campaignDifficulty, config: game.campaignConfig };
  },
  get musicTrack() {
    return desiredMusic;
  },
  get audioState() {
    return {
      unlocked: audioUnlocked,
      context: !!audio.ctx,
      musicTrack: music.trackId,
      muted: audio.muted,
      channels: { ...audio.channels },
    };
  },
  get mapData() {
    return { ...progress.map, pins: [...progress.map.pins] };
  },
  showSettings,
  closeSettings,
  showDifficulty: () => showSettings('difficulty'),
  showMode3D,
  openHudLayout,
  applyHudLayout,
  buildSettings,
  applySettings,
  showCharacter,
  closeCharacter,
  buildCharacterScreen,
  setCharacter,
  setCharacterField(next) {
    setCharacter(next);
  },
  saveCharacter,
  beginJourney,
  startPrologue,
  advancePrologue,
  finishPrologue,
  togglePrologueVoice,
  openMap,
  closeMap,
  toggleMap,
  openCodex,
  closeCodex,
  showUpdates,
  buildUpdateLog,
  showStoryMap,
  closeStoryMap,
  selectStoryArc,
  openInventory,
  closeInventory,
  toggleInventory,
  useInventoryItem,
  advanceDialogue,
  start: startRun,
  restart: startRun,
  retry: retryRun,
  showMenu,
  showLevels,
  showRealms() { realmsUI.showRealms(); },
  showStageAccess(arcId) { realmsUI.showStageAccess(arcId); },
  showAstral() { realmsUI.showAstral(); },
  showEclipse(tab) { showEclipse(tab); },
  startEclipseStage,
  startEclipseGodfall,
  startEclipseRaid,
  get eclipse() { return progress.eclipse; },
  get godfall() { return progress.godfall; },
  get guild() { return progress.guild; },
  get awakening() { return progress.awakening; },
  get eclipseRuntime() { return { room: activeEclipseRoom, godfallFloor: activeGodfallFloor, godfallRun, raid: activeRaid }; },
  get performance() { return framePerf.summary(); },
  get runtimeErrors() { return runtimeReporter.summary(); },
  get releaseGate() { return releaseChecklist(); },
  grantAwakeningMastery(classId, amount) {
    grantMastery(progress.awakening, classId, amount);
    saveProgress();
    eclipseUI.render();
    return progress.awakening.mastery[classId] || 0;
  },
  startHackStage,
  exitHackStage,
  hackTool,
  startAstralStage,
  get realms() { return progress.realms; },
  get astral() { return progress.astral; },
  showExpansion,
  showAtlas,
  closeAtlas,
  buildAtlasScreen,
  startAtlasRoom,
  atlasAction(action, data = {}) {
    return handleAtlasAction(action, { dataset: data });
  },
  useAtlasQuickSlot,
  get atlas() {
    return atlasState();
  },
  get labyrinth() {
    return {
      run: labRun,
      summary: labSummary,
      rewards: labRewards,
      rewardsOpen: labRewardsOpen,
      summaryOpen: labSummaryOpen,
      guest: labGuestMode,
      ticks: labTicks,
      engaged: labWaveEngaged,
      waveIndex: labDirector?.waveIndex ?? -1,
      totalWaves: labDirector?.totalWaves ?? 0,
      alive: game.enemies.filter((enemy) => !enemy.dead && enemy.hp > 0).length,
      tab: labTab,
      progress: labState(),
      coop: {
        role: labCoop.role,
        code: labCoop.code,
        status: labCoop.status,
        connected: !!labCoop.transport?.connected,
        lobby: labCoop.lobby,
        mode: labCoop.runMode || coopRunMode,
        guest: coopGuestMode,
        selfId: coopSelfId || labCoop.selfId,
      },
    };
  },
  showCourt,
  closeCourt,
  showFairy,
  closeFairy,
  startCutscene,
  finishCutscene,
  get cutscene() {
    return { active: cutsceneActive, id: cutsceneScene?.id || null, time: cutsceneTime, duration: cutsceneScene?.duration || 0 };
  },
  buildFairyScreen,
  startFairyStage,
  startFairyBoss,
  get fairy() {
    return {
      progress: fairyState(),
      summary: fairyProgressSummary(fairyState()),
      activeStage: activeFairyStage,
      activeBoss: activeFairyBoss,
    };
  },
  buildCourtScreen,
  startCourtRoom,
  startCourtTrial,
  startPackRun,
  get skills() {
    return progress.skills;
  },
  get pack() {
    return packState();
  },
  get skillSummary() {
    return skillSummary(progress.skills);
  },
  spendSkill: spendSkillPointAt,
  resetSkills,
  applySkills: applySkillsToGame,
  awardBossSkillPoints,
  get editor() {
    if (mapEditorCtrl) return mapEditorCtrl.snapshot();
    return {
      loaded: false,
      save: null,
      selectedId: null,
      summary: null,
      stage: null,
      message: null,
      activeStage: null,
      chain: [],
      chainIndex: 0,
      activeRunKind,
      clearOpen: false,
      cleared: false,
      engaged: false,
      elapsed: 0,
      selectedPlatform: -1,
      shareMessage: '',
      shareText: '',
      gameState: game.state,
      rating: null,
      difficulty: null,
      objective: null,
      surviveLeft: 0,
    };
  },
  editorRating: (stage) => editorSyncOrAsync((c) => c.editorRating(stage)),
  autoBalanceEditor: () => editorSyncOrAsync((c) => c.autoBalanceEditor()),
  lowerEditorDifficulty: () => editorSyncOrAsync((c) => c.lowerEditorDifficulty()),
  toggleEditorElite: (index) => editorSyncOrAsync((c) => c.toggleEditorElite(index)),
  newEditorFromPreset: (presetId) => editorSyncOrAsync((c) => c.newEditorFromPreset(presetId)),
  showEditor,
  buildEditorScreen: () => editorSyncOrAsync((c) => c.buildEditorScreen()),
  saveEditorStage: () => editorSyncOrAsync((c) => c.saveEditorStage()),
  newEditorStage: () => editorSyncOrAsync((c) => c.newEditorStage()),
  duplicateEditorStage: () => editorSyncOrAsync((c) => c.duplicateEditorStage()),
  deleteEditorStage: () => editorSyncOrAsync((c) => c.deleteEditorStage()),
  startCustomStage,
  finishCustomStage: () => editorSyncOrAsync((c) => c.finishCustomStage()),
  addEditorPlatform: (kind) => editorSyncOrAsync((c) => c.addEditorPlatform(kind)),
  deleteEditorPlatform: () => editorSyncOrAsync((c) => c.deleteEditorPlatform()),
  resetEditorTerrain: () => editorSyncOrAsync((c) => c.resetEditorTerrain()),
  paintEditorCanvas: () => editorSyncOrAsync((c) => c.paintEditorCanvas()),
  copyEditorShare: () => editorSyncOrAsync((c) => c.copyEditorShare()),
  importEditorShare: () => editorSyncOrAsync((c) => c.importEditorShare()),
  editorChain: (id) => editorSyncOrAsync((c) => c.editorChain(id)),
  editorShareCode: (id) => editorSyncOrAsync((c) => c.editorShareCode(id)),
  importEditorCode: (code) => editorSyncOrAsync((c) => c.importEditorCode(code)),
  decodeEditorCode: (code) => editorSyncOrAsync((c) => c.decodeEditorCode(code)),
  validateEditorBlueprint: (stage) => editorSyncOrAsync((c) => c.validateEditorBlueprint(stage)),
  editorBlueprintRoom: (stage) => editorSyncOrAsync((c) => c.editorBlueprintRoom(stage)),
  bossMusicFor(kind) {
    return bossTrackFor(kind);
  },
  get runKind() {
    return activeRunKind;
  },
  courtAction(action, data = {}) {
    const target = { dataset: { action, ...data } };
    handleCourtAction(target);
  },
  get court() {
    return {
      progress: courtState(),
      stats: courtStats(courtState()),
      bonuses: courtBonuses(courtState()),
      zones: courtZoneSummary(courtState()),
      tab: courtTab,
      resident: courtResidentId,
      activeRoom: activeCourtRoom,
      ngPlus: courtState().ngPlus,
      activeTrial: activeCourtTrial ? { ...activeCourtTrial } : null,
      trialResult: courtTrialResult ? { ...courtTrialResult, trial: courtTrialResult.trial.name } : null,
    };
  },
  showTrials,
  buildTrialsScreen,
  startTrialLevel,
  startTrialBoss,
  get trials() {
    return { progress: trialsState(), summary: trialSummary(trialsState()), run: trialRun };
  },
  showPuzzleAdventure,
  buildPuzzleScreen,
  startPuzzleStage,
  solveCurrentPuzzle() {
    if (!puzzleRun || puzzleRun.done) return false;
    let current = puzzleRun.puzzle;
    for (const move of current.solution || []) {
      const result = applyPuzzleMove(current, move);
      if (!result.ok) return false;
      current = result.puzzle;
    }
    if (!puzzleIsSolved(current)) return false;
    puzzleRun.puzzle = current;
    finishPuzzleStage();
    return true;
  },
  get puzzle() {
    return { progress: puzzleState(), summary: puzzleSummary(puzzleState()), run: puzzleRun, tab: puzzleTab };
  },
  get puzzleTimer() {
    if (!puzzleRun?.stage?.timed) return null;
    return {
      timeLimit: puzzleRun.timeLimit,
      remaining: puzzleRun.deadline ? Math.max(0, (puzzleRun.deadline - Date.now()) / 1000) : puzzleRun.timeLimit,
      done: puzzleRun.done,
    };
  },
  get moba() {
    return {
      progress: mobaState(),
      summary: mobaSummary(mobaState()),
      active: mobaActive,
      paused: mobaPaused,
      heroId: mobaHeroId,
      mapId: mobaMapId,
      lane: mobaLane,
      difficulty: mobaDifficulty,
      snapshot: mobaSnapshot(mobaMatch),
      result: mobaResult,
    };
  },
  get waveDefense() {
    return {
      progress: waveDefenseState(),
      summary: waveDefenseSummary(waveDefenseState()),
      active: wdActive,
      paused: wdPaused,
      mapId: wdMapId,
      difficulty: wdDifficulty,
      endless: wdEndless,
      infinitower: wdInfinitower,
      selectedTowerId: wdSelectedTowerId,
      snapshot: waveDefenseSnapshot(wdMatch),
      result: wdResult,
    };
  },
  get pirates() {
    return {
      progress: pirateState(),
      summary: pirateSummary(pirateState()),
      active: pirateActive,
      paused: piratePaused,
      stageId: pirateStageId,
      mode: pirateMatch?.mode || 'route',
      endless: pirateState().endless,
      snapshot: pirateSnapshot(pirateMatch),
      result: pirateResult,
      stages: PIRATE_STAGES,
      islands: PIRATE_ISLANDS,
      shipTypes: PIRATE_SHIP_TYPES,
      bosses: PIRATE_BOSS_TYPES,
    };
  },
  showPirates,
  buildPirateScreen,
  startPirateVoyage,
  startPirateEndless,
  pirateNextSurge() {
    const ok = pirateEndlessSurge(pirateMatch);
    updatePirateHud(true);
    return ok;
  },
  leavePirates,
  setPirateStage(id) {
    if (!PIRATE_STAGE_BY_ID[id]) return false;
    pirateStageId = id;
    buildPirateScreen();
    return true;
  },
  togglePiratePause,
  pirateFire(side) { return firePirateSide(side); },
  pirateDock,
  pirateStep(seconds = 1) {
    if (!pirateMatch) return null;
    const frames = Math.max(1, Math.round(Number(seconds) * 60));
    for (let i = 0; i < frames && pirateMatch.phase === 'sailing'; i += 1) updatePirateVoyage(pirateMatch, 1 / 60);
    if (pirateMatch.phase === 'cleared' || pirateMatch.phase === 'sunk') completePirateVoyage();
    updatePirateHud(true);
    return pirateSnapshot(pirateMatch);
  },
  pirateSetControls(throttle, turn) {
    return setPirateControls(pirateMatch, { throttle, turn });
  },
  pirateSetKills(kills = 0) {
    if (!pirateMatch) return null;
    pirateMatch.kills = Math.max(0, Math.floor(Number(kills) || 0));
    if (pirateMatch.kills >= pirateMatch.stage.targetKills) updatePirateVoyage(pirateMatch, 1 / 60);
    updatePirateHud(true);
    return pirateSnapshot(pirateMatch);
  },
  pirateDamageShip(id, amount = 9999) {
    const ok = pirateDamageShip(pirateMatch, id, amount);
    if (pirateMatch?.phase === 'cleared' || pirateMatch?.phase === 'sunk') completePirateVoyage();
    updatePirateHud(true);
    return ok;
  },
  pirateSinkBoss() {
    const boss = pirateMatch?.enemies.find((enemy) => enemy.type.boss);
    if (!boss) return false;
    pirateDamageShip(pirateMatch, boss.id, 99999);
    completePirateVoyage();
    updatePirateHud(true);
    return true;
  },
  renderPirateFrame() {
    if (!pirateMatch) return false;
    const canvas = $('pirate-canvas');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return false;
    renderPirateVoyage(ctx, pirateMatch, { width: canvas.width, height: canvas.height, time: performance.now() / 1000 });
    return true;
  },
  showWaveDefense,
  buildWaveDefenseScreen,
  waveDefenseStory: SPIRAL_STORY,
  spiralStoryForTier,
  playWaveDefenseIntro,
  playWaveDefenseBossIntro: maybeWaveDefenseBossCutscene,
  playWaveDefenseTrailer,
  startWaveDefenseBattle,
  leaveWaveDefense,
  setWaveDefenseMap(id) {
    if (!WAVE_DEFENSE_MAP_BY_ID[id]) return false;
    wdMapId = id;
    buildWaveDefenseScreen();
    return true;
  },
  setWaveDefenseDifficulty(id) {
    if (!WAVE_DEFENSE_DIFFICULTIES.some((entry) => entry.id === id)) return false;
    wdDifficulty = id;
    buildWaveDefenseScreen();
    return true;
  },
  setWaveDefenseMode(mode) {
    wdInfinitower = mode === 'infinitower';
    wdEndless = wdInfinitower || mode === 'endless';
    buildWaveDefenseScreen();
    return true;
  },
  setWaveDefenseEndless(on = true) {
    wdEndless = !!on;
    wdInfinitower = false;
    buildWaveDefenseScreen();
    return wdEndless;
  },
  setWaveDefenseInfinitower(on = true) {
    wdInfinitower = !!on;
    wdEndless = wdInfinitower;
    buildWaveDefenseScreen();
    return wdInfinitower;
  },
  setWaveDefenseTower(id) {
    if (!WAVE_DEFENSE_TOWER_BY_ID[id]) return false;
    wdSelectedTowerId = id;
    if (wdMatch) waveDefenseSelectTower(wdMatch, id);
    buildWaveDefenseScreen();
    updateWaveDefenseHud(true);
    return true;
  },
  setWaveDefenseParticles(idOrScale) {
    const found = WAVE_DEFENSE_PARTICLE_LEVELS.find((entry) => entry.id === idOrScale);
    if (found) {
      wdParticleId = found.id;
      if (wdMatch) waveDefenseSetParticleScale(wdMatch, found.scale);
    } else if (Number.isFinite(Number(idOrScale))) {
      const scale = Math.max(0.25, Math.min(4, Number(idOrScale)));
      if (wdMatch) waveDefenseSetParticleScale(wdMatch, scale);
    } else {
      return false;
    }
    buildWaveDefenseScreen();
    wdRenderDirty = true;
    updateWaveDefenseHud(true);
    return true;
  },
  waveDefenseBuild(slot, towerId = wdMatch?.buildTowerId) {
    return waveDefenseBuild(wdMatch, slot, towerId);
  },
  waveDefenseGold(amount = 100) {
    if (!wdMatch) return 0;
    wdMatch.gold += Math.max(0, Math.floor(Number(amount) || 0));
    updateWaveDefenseHud(true);
    return wdMatch.gold;
  },
  renderWaveDefenseFrame() {
    if (!wdMatch) return false;
    const canvas = $('wd-canvas');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return false;
    renderWaveDefense(ctx, wdMatch, { width: canvas.width, height: canvas.height, time: performance.now() / 1000 });
    return true;
  },
  waveDefenseUpgrade() {
    return waveDefenseUpgrade(wdMatch);
  },
  waveDefenseSell() {
    return waveDefenseSell(wdMatch);
  },
  waveDefenseNextWave() {
    const ok = waveDefenseNextWave(wdMatch);
    updateWaveDefenseHud(true);
    return ok;
  },
  waveDefenseSetWave(wave = 1) {
    if (!wdMatch) return null;
    wdMatch.wave = Math.max(0, Math.min(wdMatch.totalWaves - 1, Math.floor(Number(wave) || 1) - 1));
    wdMatch.phase = 'prep';
    wdMatch.prepTimer = 0;
    wdMatch.spawnQueue = [];
    wdMatch.spawnCursor = 0;
    wdMatch.enemies = [];
    wdMatch.projectiles = [];
    wdRenderDirty = true;
    updateWaveDefenseHud(true);
    return waveDefenseSnapshot(wdMatch);
  },
  waveDefenseStep(seconds = 1) {
    if (!wdMatch) return null;
    const frames = Math.max(1, Math.round(Number(seconds) * 60));
    for (let i = 0; i < frames && wdMatch.phase !== 'ended'; i += 1) updateWaveDefense(wdMatch, 1 / 60);
    if (wdMatch.phase === 'ended') completeWaveDefense();
    wdRenderDirty = true;
    updateWaveDefenseHud(true);
    return waveDefenseSnapshot(wdMatch);
  },
  waveDefenseWin() {
    if (!wdMatch) return false;
    endWaveDefense(wdMatch, 'victory');
    completeWaveDefense();
    wdRenderDirty = true;
    updateWaveDefenseHud(true);
    return true;
  },
  waveDefenseDamageCastle(amount = 25) {
    if (!wdMatch) return false;
    wdMatch.castle.hp = Math.max(0, wdMatch.castle.hp - Math.max(1, Number(amount) || 1));
    wdMatch.castle.flash = 0.5;
    if (wdMatch.castle.hp <= 0) {
      endWaveDefense(wdMatch, 'defeat');
      completeWaveDefense();
    }
    wdRenderDirty = true;
    updateWaveDefenseHud(true);
    return true;
  },
  showMoba,
  buildMobaScreen,
  startMobaBattle,
  leaveMoba,
  setMobaHero(id) {
    if (!MOBA_HERO_BY_ID[id]) return false;
    mobaHeroId = id;
    buildMobaScreen();
    return true;
  },
  setMobaMap(id) {
    if (!MOBA_MAP_BY_ID[id]) return false;
    mobaMapId = id;
    buildMobaScreen();
    return true;
  },
  setMobaLane(lane) {
    if (!MOBA_LANES.includes(lane)) return false;
    mobaLane = lane;
    buildMobaScreen();
    return true;
  },
  mobaCast(slot, aim = {}) {
    return mobaCast(mobaMatch, Number(slot), aim);
  },
  mobaSetOrder(x, y) {
    return mobaSetOrder(mobaMatch, x, y);
  },
  mobaStep(seconds = 1) {
    if (!mobaMatch) return null;
    const frames = Math.max(1, Math.round(Number(seconds) * 60));
    for (let i = 0; i < frames && mobaMatch.phase === 'playing'; i += 1) updateMobaMatch(mobaMatch, 1 / 60, mobaInput);
    if (mobaMatch.phase === 'ended') completeMobaMatch();
    updateMobaHud(true);
    return mobaSnapshot(mobaMatch);
  },
  mobaWin() {
    if (!mobaMatch) return false;
    endMobaMatch(mobaMatch, 'blue');
    completeMobaMatch();
    return true;
  },
  mobaDamageCore(team = 'red', amount = 9999) {
    if (!mobaMatch) return false;
    const core = mobaMatch.towers.find((tower) => tower.kind === 'core' && tower.team === team);
    if (!core) return false;
    core.hp = Math.max(0, core.hp - Math.max(1, Number(amount) || 1));
    if (core.hp <= 0) {
      endMobaMatch(mobaMatch, team === 'blue' ? 'red' : 'blue');
      completeMobaMatch();
    }
    updateMobaHud(true);
    return true;
  },
  expirePuzzleTimer() {
    if (!puzzleRun || puzzleRun.done || !puzzleRun.stage?.timed) return false;
    puzzleRun.deadline = Date.now() - 1;
    updatePuzzleTimer();
    return true;
  },
  showLabyrinth,
  buildLabyrinthScreen,
  startLabyrinth,
  chooseLabReward,
  finishLabRun,
  closeLabSummary,
  labSnapshotState,
  showCoop,
  labHostCoop() {
    connectLabCoop('host');
  },
  labJoinCoop() {
    connectLabCoop('guest');
  },
  labStartCoopSession() {
    startLabCoopSession();
  },
  startCoopGuestForTest(message) {
    startCoopGuest(message);
  },
  applyCoopTestSnapshot(snapshot) {
    const decoded = decodeSnapshot(snapshot);
    if (!decoded) return null;
    labCoop.interpolator.push(decoded);
    applyCoopSnapshot();
    return { selfId: coopSelfId, room: game.roomIndex, playerX: game.player.x, allies: game.allies.map((ally) => ally.id) };
  },
  atlasEndingFor(zoneId = 'foundry') {
    return atlasEndingFor(atlasState(), zoneId);
  },
  drainEvents,
  fillDeathStats,
  fillVictoryStats,
  showCredits,
  buildExpansionScreen,
  startExpansionLevel,
  startExpansionMode,
  startExpansionTrial,
  claimQuest,
  buyHavenUpgrade,
  equipSkin,
  claimEventMission,
  claimEventTier,
  buyEventShop,
  startSpectate,
  stopSpectate,
  openShop,
  closeShop,
  buyShopItem,
  showHunterShop: openHunterShop,
  closeHunterShop,
  buyHunterItem,
  syncHunterFromGame,
  giveHunterMarks(n) {
    hunterReward(hunterState, n, Date.now());
    saveHunterState();
    if (hunterShopOpen) buildHunterShop();
    return hunterState.marks;
  },
  respawnAtCheckpoint() {
    const ok = game.respawnAtCheckpoint();
    if (ok) {
      lastGameState = 'playing';
      syncScreens();
      updateHud();
    }
    return ok;
  },
  giveAsh(n) {
    game.ash += n;
    updateHud();
  },
  enterRoom(index) {
    started = true;
    paused = false;
    shopOpen = false;
    mapOpen = false;
    codexOpen = false;
    inventoryOpen = false;
    settingsOpen = false;
    closeDialogue(true);
    spectating = false;
    menuView = 'none';
    game.enterRoom(index);
    discoverCurrentRoom(index);
    lastGameState = 'playing';
    syncScreens();
    updateHud();
  },
  chooseBlessing(index) {
    chooseBlessing(index);
  },
  damageBoss(n) {
    game.damageBoss(n);
  },
  clearProgress() {
    progress = defaultProgress();
    saveProgress();
    updateMenuProgress();
    buildLevelCards();
    buildExpansionScreen();
  },
  togglePause,
  step(seconds = 0.1, input = {}) {
    const frames = Math.max(1, Math.round(seconds / FIXED));
    const merged = { ...inputSnapshot(), ...input };
    for (let i = 0; i < frames; i++) {
      game.update(FIXED, merged);
      // Match the render loop so arc resources advance under test too.
      if (activeRunKind === 'atlas') tickAtlasRun(FIXED);
      if (activeRunKind === 'labyrinth') tickLabyrinth(FIXED);
      if (activeRunKind === 'trials') tickTrials(FIXED);
      if (activeRunKind === 'fallen') tickFallen(FIXED);
      if (activeRunKind === 'crusade') tickCrusade(FIXED);
      if (activeRunKind === 'custom') tickCustomStage(FIXED);
    }
    // Drain the same events the render loop drains, so a stepped run records
    // clears, bosses and chapter progress exactly like a played one.
    drainEvents();
    syncScreens();
    updateHud();
  },
  tap(action) {
    game.update(FIXED, { ...inputSnapshot(), [action]: true });
    for (let i = 0; i < 6; i++) game.update(FIXED, inputSnapshot());
    syncScreens();
    updateHud();
  },
  snap() {
    const b = game.boss;
    return {
      state: game.state,
      room: game.roomIndex,
      roomName: game.room.name,
      hp: game.player.hp,
      maxHp: game.player.maxHp,
      flasks: game.player.flasks,
      relic: game.player.relic,
      kills: game.kills,
      ash: game.ash,
      weapon: game.player.weapon,
      weapons: [...game.player.weapons],
      arrows: game.player.arrows,
      shurikens: game.player.shurikens,
      sigils: [...game.player.sigils],
      rituals: { ...game.player.rituals },
      consumables: { ...game.player.consumables },
      hunterItems: { ...game.player.hunterItems },
      hunterWard: game.player.spiritWardTimer,
      quickItem: game.quickItemInfo(),
      checkpointRoom: game.checkpointRoom,
      blessings: [...game.blessings],
      enemies: game.enemies.length,
      projectiles: game.projectiles.length,
      boss: b
        ? {
            name: b.name,
            kind: b.kind,
            hp: b.hp,
            maxHp: b.maxHp,
            phase: b.phase,
            state: b.state,
            dying: b.dying,
          }
        : null,
      gate: game.gate ? { open: game.gate.open, reason: game.gate.reason } : null,
      view: {
        w: VIEW_W,
        started,
        paused,
        spectating,
        menuView,
        startedRun: started,
      },
      progress: {
        unlocked: progress.unlocked,
        cleared: [...progress.cleared],
      },
      expansion: {
        tab: expansionTab,
        chapter: expansionChapter,
        cleared: progress.expansion?.cleared?.filter(Boolean).length || 0,
        echoes: progress.expansion?.echoes || 0,
        difficulty: progress.expansion?.difficulty || 'normal',
        ngPlus: progress.expansion?.ngPlus || 0,
        collectibles: progress.expansion?.collectibles?.length || 0,
        cosmetics: progress.expansion?.cosmetics?.length || 0,
      },
    };
  },
};

// kick off
// A save that already felled The Oathbreaker ascends into the second menu.
if (ascendProgress(progress).ok) saveProgress();
updateMenuProgress();
buildLevelCards();
buildHorror3DPanel();
applyCharacterToGame();
applySettings();
if (progress.crusade?.cleared) {
  menuView = 'crusadeMenu';
  buildCrusadeMenu();
} else if (fallenIsAscended(progress) && fallenState().menuTheme !== 'base') {
  menuView = 'fallenMenu';
  buildFallenMenu();
}
renderer.render(game);
setInterval(updateLiveClock, 250);
updateLiveClock();
syncScreens();
updateHud();
window.__ashenBootProgress?.('Menyiapkan sistem permainan', 72);
requestAnimationFrame(frame);
// ══ Update XXV — voice acting and the cinematic trailer ══════════════════
// Boss kinds map to authored cast members. Anything unknown falls back to the
// narrator so a new chapter never goes silent.
const VOICE_BOSS_CAST = {
  warden: 'warden',
  wyrm: 'wyrm',
  oathbreaker: 'oathbreaker',
  tidebound: 'tidebound',
  wickbearer: 'wickbearer',
  choir: 'ghost',
  sporebound: 'narrator',
  root: 'narrator',
};

function readVoiceSave() {
  try {
    const raw = localStorage.getItem(VOICE_SAVE_KEY);
    return sanitizeVoiceSave(raw ? JSON.parse(raw) : null);
  } catch {
    return sanitizeVoiceSave(null);
  }
}

let voiceSave = readVoiceSave();
let voiceStatus = { configured: false, model: VOICE_MODEL, online: true, checked: false, error: '' };
let trailerBakedShots = new Set();
let voiceStatusPromise = null;
let voiceAudio = null;
let voiceObjectUrl = null;
let voiceSpeaking = false;

function hasBrowserVoice() {
  return typeof window !== 'undefined'
    && !!window.speechSynthesis
    && typeof window.SpeechSynthesisUtterance === 'function';
}

function updateVoiceBadge() {
  const summary = voiceSummary(voiceSave, { ...voiceStatus, browserAvailable: hasBrowserVoice() });
  const label = voiceBadge(summary);
  const engine = $('trailer-engine');
  if (engine) engine.textContent = `${label} · ${summary.model}`;
  const btn = $('btn-trailer-voice');
  if (btn) {
    btn.textContent = label;
    btn.setAttribute('aria-pressed', String(voiceSave.enabled));
  }
  return summary;
}

function saveVoiceSave() {
  voiceSave.updatedAt = Date.now();
  try {
    localStorage.setItem(VOICE_SAVE_KEY, JSON.stringify(voiceSave));
  } catch {
    /* storage unavailable - the session still keeps the setting */
  }
  updateVoiceBadge();
}

function refreshVoiceStatus({ force = false } = {}) {
  if (voiceStatusPromise && !force) return voiceStatusPromise;
  voiceStatusPromise = (async () => {
    try {
      const response = await fetch('/api/voice', { headers: { Accept: 'application/json' } });
      const status = await response.json();
      trailerBakedShots = new Set(Array.isArray(status.trailerBaked) ? status.trailerBaked : []);
      voiceStatus = {
        configured: !!status.configured,
        model: status.model || VOICE_MODEL,
        online: true,
        checked: true,
        error: '',
      };
    } catch {
      trailerBakedShots = new Set();
      voiceStatus = { configured: false, model: VOICE_MODEL, online: false, checked: true, error: 'server-unreachable' };
    }
    return updateVoiceBadge();
  })().finally(() => {
    voiceStatusPromise = null;
  });
  return voiceStatusPromise;
}

function stopVoice() {
  voiceSpeaking = false;
  if (voiceAudio) {
    try { voiceAudio.pause(); } catch { /* already stopped */ }
    voiceAudio = null;
  }
  if (voiceObjectUrl) {
    try { URL.revokeObjectURL(voiceObjectUrl); } catch { /* ignore */ }
    voiceObjectUrl = null;
  }
  if (hasBrowserVoice()) {
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  }
}

function speakBrowser(text, castId, { lang = '' } = {}) {
  if (!hasBrowserVoice()) return false;
  const member = castFor(castId);
  const targetLang = lang || member.fallback.lang;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang;
    utterance.rate = member.fallback.rate;
    utterance.pitch = member.fallback.pitch;
    utterance.volume = voiceSave.volume / 100;
    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    const preferred = /^en/i.test(targetLang)
      ? (voices.find((v) => /^en([-_]|$)/i.test(v.lang)) || voices.find((v) => /english/i.test(v.name)))
      : (voices.find((v) => /^id([-_]|$)/i.test(v.lang)) || voices.find((v) => /indones/i.test(v.name)));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

async function playAudioUrl(url) {
  voiceAudio = new Audio(url);
  voiceAudio.volume = voiceSave.volume / 100;
  voiceAudio.addEventListener('ended', () => { voiceSpeaking = false; }, { once: true });
  await voiceAudio.play();
  voiceSpeaking = true;
  voiceSave.linesPlayed += 1;
  voiceSave.providerUsed = 'elevenlabs';
  saveVoiceSave();
  return 'elevenlabs';
}

// One entry point for every spoken line: boss dialogue, prologue and trailer.
// Returns the provider that actually ran, which the smoke tests assert on.
async function speakVoiceLine(text, castId = 'narrator', { staticUrl = '', lang = '' } = {}) {
  const request = voiceRequestFor({ text, cast: castId, save: voiceSave });
  if (!request.ok) return 'none';
  if (!voiceSave.enabled) return 'none';
  stopVoice();
  if (staticUrl && voiceSave.preferElevenLabs) {
    try {
      return await playAudioUrl(staticUrl);
    } catch {
      /* fall through to live API or browser voice */
    }
  }
  const provider = resolveVoiceProvider({
    save: voiceSave,
    configured: voiceStatus.configured,
    online: voiceStatus.online,
    browserAvailable: hasBrowserVoice(),
  });
  if (provider === 'none') return 'none';
  if (provider === 'browser') {
    const played = speakBrowser(request.body.text, castId, { lang });
    voiceSave.linesPlayed += played ? 1 : 0;
    voiceSave.providerUsed = played ? 'browser' : 'none';
    saveVoiceSave();
    return voiceSave.providerUsed;
  }
  try {
    const response = await fetch('/api/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.body),
    });
    if (!response.ok) throw new Error(`voice HTTP ${response.status}`);
    const blob = await response.blob();
    if (!blob.size) throw new Error('empty audio');
    voiceObjectUrl = URL.createObjectURL(blob);
    return await playAudioUrl(voiceObjectUrl);
  } catch (error) {
    // A missing key, a quota error or a blocked request all degrade to the
    // browser voice instead of failing the scene.
    voiceStatus = { ...voiceStatus, configured: false, error: String(error.message || error) };
    const played = speakBrowser(request.body.text, castId, { lang });
    voiceSave.providerUsed = played ? 'browser' : 'none';
    voiceSave.linesPlayed += played ? 1 : 0;
    saveVoiceSave();
    return voiceSave.providerUsed;
  }
}

// ── trailer playback ─────────────────────────────────────────────────────
let trailerActive = false;
let trailerPaused = false;
let trailerTime = 0;
let trailerStamp = 0;
let trailerHandle = 0;
let trailerIndex = -1;

const trailerClock = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function paintTrailer() {
  const canvas = $('trailer-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const info = drawTrailerFrame(ctx, canvas.width, canvas.height, trailerTime);
  const total = trailerDuration();
  const shotEl = $('trailer-shot');
  if (shotEl) shotEl.textContent = `${info.index + 1} / ${info.count}`;
  const progress = $('trailer-progress');
  if (progress) progress.style.width = `${(trailerTime / total) * 100}%`;
  const timeEl = $('trailer-time');
  if (timeEl) timeEl.textContent = `${trailerClock(trailerTime)} / ${trailerClock(total)}`;
  if (info.index !== trailerIndex) {
    trailerIndex = info.index;
    const eyebrow = $('trailer-eyebrow');
    const line = $('trailer-line');
    if (eyebrow) eyebrow.textContent = info.shot.eyebrow;
    if (line) line.textContent = info.shot.narration;
    if (voiceSave.autoplayInTrailer && voiceSave.enabled) {
      const targetIndex = info.index;
      const targetShot = info.shot;
      const ready = voiceStatus.checked ? Promise.resolve() : refreshVoiceStatus();
      void ready.then(() => {
        if (!trailerActive || trailerIndex !== targetIndex) return;
        const staticUrl = trailerBakedShots.has(targetShot.id) ? `./assets/voice/trailer/${targetShot.id}.mp3` : '';
        void speakVoiceLine(targetShot.narration, targetShot.cast, {
          staticUrl,
          lang: 'en-US',
        });
      });
    }
  }
}

function trailerLoop(now) {
  if (!trailerActive) return;
  const delta = trailerStamp ? Math.min(0.12, (now - trailerStamp) / 1000) : 0;
  trailerStamp = now;
  if (!trailerPaused) {
    trailerTime += delta;
    if (trailerTime >= trailerDuration()) {
      trailerTime = trailerDuration();
      trailerPaused = true;
      const play = $('btn-trailer-play');
      if (play) play.textContent = 'ULANG';
      stopVoice();
    }
  }
  paintTrailer();
  trailerHandle = requestAnimationFrame(trailerLoop);
}

function startTrailerPlayback() {
  trailerTime = 0;
  trailerIndex = -1;
  trailerPaused = false;
  trailerStamp = 0;
  const play = $('btn-trailer-play');
  if (play) play.textContent = 'JEDA';
  cancelAnimationFrame(trailerHandle);
  trailerHandle = requestAnimationFrame(trailerLoop);
}

const TRAILER_SEEN_KEY = 'ashen-vow-trailer-seen-v1';

function openTrailer() {
  menuView = 'trailer';
  audio.init();
  audioUnlocked = true;
  music.stop(0.6);
  stopVoice();
  trailerActive = true;
  syncScreens();
  paintTrailer();
  void refreshVoiceStatus();
  startTrailerPlayback();
}

function closeTrailer() {
  trailerActive = false;
  if (trailerHandle) cancelAnimationFrame(trailerHandle);
  trailerHandle = 0;
  stopVoice();
  try { localStorage.setItem(TRAILER_SEEN_KEY, '1'); } catch { /* ignore */ }
  // A custom stage may use the trailer as its opener: resume the run instead
  // of dropping back to the title screen.
  if (customIntroCallback) {
    const resume = customIntroCallback;
    customIntroCallback = null;
    resume();
    return;
  }
  if (menuView === 'trailer') menuView = 'title';
  syncScreens();
}

function toggleTrailerPause() {
  if (!trailerActive) return;
  if (trailerTime >= trailerDuration()) {
    trailerTime = 0;
    trailerIndex = -1;
    trailerPaused = false;
  } else {
    trailerPaused = !trailerPaused;
  }
  const play = $('btn-trailer-play');
  if (play) play.textContent = trailerPaused ? 'LANJUT' : 'JEDA';
}

function seekTrailer(seconds) {
  trailerTime = Math.max(0, Math.min(trailerDuration(), trailerTime + seconds));
  trailerPaused = true;
  trailerIndex = -1;
  const play = $('btn-trailer-play');
  if (play) play.textContent = 'LANJUT';
  paintTrailer();
}

function setTrailerTime(seconds) {
  trailerTime = Math.max(0, Math.min(trailerDuration(), Number(seconds) || 0));
  trailerIndex = -1;
  paintTrailer();
}

$('btn-trailer-menu')?.addEventListener('click', openTrailer);
$('btn-trailer-close')?.addEventListener('click', closeTrailer);
$('btn-trailer-play')?.addEventListener('click', toggleTrailerPause);
$('btn-trailer-back')?.addEventListener('click', () => seekTrailer(-5));
$('btn-trailer-fwd')?.addEventListener('click', () => seekTrailer(5));
$('btn-trailer-voice')?.addEventListener('click', () => {
  voiceSave.enabled = !voiceSave.enabled;
  saveVoiceSave();
  if (!voiceSave.enabled) stopVoice();
  else if (trailerActive) void speakVoiceLine(trailerShotAt(trailerTime).shot.narration, trailerShotAt(trailerTime).shot.cast);
});

window.addEventListener('keydown', (event) => {
  if (!trailerActive) return;
  if (event.code === 'Escape') {
    event.preventDefault();
    closeTrailer();
  } else if (event.code === 'Space' || event.code === 'Enter') {
    event.preventDefault();
    toggleTrailerPause();
  } else if (event.code === 'ArrowLeft') {
    event.preventDefault();
    seekTrailer(-5);
  } else if (event.code === 'ArrowRight') {
    event.preventDefault();
    seekTrailer(5);
  }
}, true);

// Functions are copied by value; the two state views must be real getters, so
// they are defined below instead of inside Object.assign (which would snapshot
// them once at boot and freeze the trailer/voice reports).
Object.assign(window.__ashen, {
  openTrailer,
  closeTrailer,
  toggleTrailerPause,
  seekTrailer,
  setTrailerTime,
  refreshVoiceStatus,
  voiceStatus: () => ({ ...voiceStatus }),
  narrate: (text, cast = 'narrator') => speakVoiceLine(text, cast),
  stopVoice,
  setVoice: (patch = {}) => {
    voiceSave = sanitizeVoiceSave({ ...voiceSave, ...patch });
    saveVoiceSave();
    return JSON.parse(JSON.stringify(voiceSave));
  },
});

Object.assign(window.__ashen, {
  playBossLine: (kind, key = 'intro', index = 0) => {
    const row = bossVoiceLine(kind, key, index);
    return playBossLine(kind, key, index, row ? { speaker: row.speaker, text: row.text } : { text: '' });
  },
  stopBossVoice,
  cycleBossVoiceMode,
  setBossVoice: (patch = {}) => {
    bossVoiceSettings = sanitizeBossVoiceSettings({ ...bossVoiceSettings, ...patch });
    saveBossVoiceSettings();
    return { ...bossVoiceSettings };
  },
  loadBossVoiceManifest,
});

Object.defineProperties(window.__ashen, {
  bossVoice: {
    configurable: true,
    get() {
      return {
        settings: { ...bossVoiceSettings },
        recorded: bossVoiceRecorded.size,
        last: { ...bossVoiceLast },
        active: bossVoiceFx ? bossVoiceFx.active.size : 0,
        summary: bossVoiceSummary(),
        button: $('btn-dialogue-voice')?.textContent || '',
      };
    },
  },
  voice: {
    configurable: true,
    get() {
      return {
        save: JSON.parse(JSON.stringify(voiceSave)),
        status: { ...voiceStatus },
        summary: voiceSummary(voiceSave, { ...voiceStatus, browserAvailable: hasBrowserVoice() }),
        badge: voiceBadge(voiceSummary(voiceSave, { ...voiceStatus, browserAvailable: hasBrowserVoice() })),
        speaking: voiceSpeaking,
        cast: Object.keys(VOICE_BOSS_CAST).length,
      };
    },
  },
  trailer: {
    configurable: true,
    get() {
      return {
        active: trailerActive,
        paused: trailerPaused,
        time: trailerTime,
        duration: trailerDuration(),
        shots: TRAILER_SHOTS.length,
        shot: trailerShotAt(trailerTime),
        summary: trailerSummary(),
        identity: TRAILER_IDENTITY,
      };
    },
  },
});

updateVoiceBadge();
void refreshVoiceStatus();
updateBossVoiceButton();
void loadBossVoiceManifest();

window.__ashenBootReady?.();
try {
  if (!navigator.webdriver && localStorage.getItem(TRAILER_SEEN_KEY) !== '1') {
    openTrailer();
  }
} catch { /* ignore storage errors */ }
