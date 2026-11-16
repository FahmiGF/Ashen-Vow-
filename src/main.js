// Ashen Vow v0.6.0 — browser shell: menus, level select, spectate, fixed-step loop.
import {
  AshenGame,
  ROOMS,
  ALL_ROOMS,
  WORLD_W,
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
  formatCode,
  gamepadActions,
} from './settings.js';
import { ZONE_LIST, zoneForRoom } from './zones.js';
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
} from './cutscene.js';
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
import { UPDATE_LOG, GAME_VERSION } from './updates.js';
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
import { Ashen3DGame, render3D } from './mode3d.js';
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
let menuView = 'title'; // title | fallenMenu | fallen | levels | credits | updates | character | expansion | frontier | overdrive | mode3d | court | labyrinth | fairy | speedrun | fishing | baitShop | fishIndex | none
let fishingReel = null;
let fishingReelFrame = 0;
let fishIndexTab = 0;
let expansionTab = 'campaign';
let expansionChapter = 0;
let havenNpcId = 'sari';
let chronicleEventId = null;
let wardrobeFilter = 'all';
let activeRunKind = 'legacy';
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
let settingsTab = 'audio';
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
    speedrun: defaultSpeedrunProgress(),
    fishing: defaultFishingProgress(),
    fallen: defaultFallenProgress(),
    crusade: defaultCrusadeProgress(),
    stageTimes: {},
  };
}

function sanitizeStageTimes(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!/^(legacy|court|expansion|atlas):\d+$/.test(key) || !value || typeof value !== 'object') continue;
    result[key] = {
      label: typeof value.label === 'string' ? value.label.slice(0, 80) : key,
      best: Math.max(0, Math.round((Number(value.best) || 0) * 10) / 10),
      last: Math.max(0, Math.round((Number(value.last) || 0) * 10) / 10),
      clears: Math.max(0, Math.floor(Number(value.clears) || 0)),
    };
  }
  return result;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
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
    const { version, unlocked: _unlocked, cleared: _cleared, map: _map, expansion: _expansion, atlas: _atlas, labyrinth: _labyrinth, court: _court, skills: _skills, pack: _pack, fairy: _fairy, speedrun: _speedrun, fishing: _fishing, fallen: _fallen, crusade: _crusade, stageTimes: _stageTimes, ...extras } = parsed;
    return {
      ...extras,
      version: 1,
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
      speedrun: sanitizeSpeedrunProgress(parsed.speedrun),
      fishing: sanitizeFishingProgress(parsed.fishing),
      fallen: sanitizeFallenProgress(parsed.fallen),
      crusade: sanitizeCrusadeProgress(parsed.crusade),
      stageTimes: sanitizeStageTimes(parsed.stageTimes),
    };
  } catch {
    return defaultProgress();
  }
}

function saveProgress() {
  try {
    progress.version = 1;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* storage unavailable — keep in memory */
  }
}

let progress = loadProgress();

function discoverCurrentRoom(index = game.roomIndex) {
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
  activeExpansionIndex = null;
  activeModeId = null;
  activeTrialId = null;
  modeRunRewarded = false;
  game.reset();
  applyCharacterToGame();
  applySkinToGame();
  if (index > 0) {
    game.enterRoom(index);
    if (index >= 2) game.player.relic = true;
    provisionStartAsh(index);
  }
  game.events.length = 0;
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
  discoverCurrentRoom(game.roomIndex);
  beginStage(game.roomIndex, game.room.name);
  showBanner(game.room.name, game.room.subtitle);
  syncScreens();
  updateHud();
}

function retryRun() {
  attempts += 1;
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
  if (activeRunKind === 'pack' && activePackIndex >= 0) {
    startPackRun(activePackIndex);
    return;
  }
  if (activeRunKind === 'fairy') {
    if (activeFairyBoss) startFairyBoss(activeFairyBoss);
    else startFairyStage(Math.max(0, activeFairyStage));
    return;
  }
  const usedCheckpoint = game.respawnAtCheckpoint();
  if (!usedCheckpoint) {
    const index = game.roomIndex;
    game.reset();
    applyCharacterToGame();
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
  cancelPrologue();
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

function showMode3D(subMode = 'campaign') {
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
  if (!game3D) {
    game3D = new Ashen3DGame({ viewW: 960, viewH: 540, subMode });
  } else {
    game3D.subMode = subMode;
  }
  clearHeldKeys();
  syncScreens();
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

function buildOverdriveScreen() {
  const summaryEl = $('overdrive-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="stat-card">
        <span class="stat-label">LEVEL BARU</span>
        <strong class="stat-value">100</strong>
        <em class="stat-sub">Level 201–300 · 10 Bab</em>
      </div>
      <div class="stat-card">
        <span class="stat-label">MANTRA</span>
        <strong class="stat-value">32</strong>
        <em class="stat-sub">8 Sekolah Sihir · 4 Mantra/sekolah</em>
      </div>
      <div class="stat-card">
        <span class="stat-label">BOS MULTI-FASE</span>
        <strong class="stat-value">8</strong>
        <em class="stat-sub">Armor · Shield · Stagger</em>
      </div>
      <div class="stat-card">
        <span class="stat-label">CHECKLIST RILIS</span>
        <strong class="stat-value" style="color:#52b788;">18 / 18 SIAP</strong>
        <em class="stat-sub">Semua Modul Terverifikasi</em>
      </div>
    `;
  }

  const tabs = document.querySelectorAll('#overdrive-tabs .exp-tab');
  tabs.forEach((t) => { t.classList.toggle('active', t.dataset.tab === overdriveTab); });

  const bodyEl = $('overdrive-body');
  if (!bodyEl) return;

  if (overdriveTab === 'campaign301') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-2">
        ${OVERDRIVE_CHAPTERS.map((ch) => `
          <div class="frontier-card" style="border-left: 4px solid ${ch.color};">
            <div class="frontier-card-head">
              <strong style="color:${ch.color};font-size:14px;">BAB ${ch.number}: ${ch.name}</strong>
              <span class="frontier-badge frontier-badge-gold">Lv. ${ch.levelStart}–${ch.levelEnd}</span>
            </div>
            <div style="font-size:11.5px;color:#ced4da;margin:4px 0;">
              <b style="color:#a7c957;">👑 Bos:</b> ${ch.boss}
            </div>
            <div style="font-size:11px;background:rgba(0,0,0,0.3);padding:6px 10px;border-radius:4px;">
              <span style="color:#ffd166;">⚠ Bahaya:</span> ${ch.hazard}
            </div>
          </div>
        `).join('')}
      </div>`;
  } else if (overdriveTab === 'spellschools') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-2">
        ${OVERDRIVE_SPELL_SCHOOLS.map((school) => `
          <div class="frontier-card" style="border-top: 3px solid ${school.color};">
            <div class="frontier-card-head">
              <strong style="color:${school.color};font-size:15px;">${school.icon} Sekolah ${school.name}</strong>
              <span class="frontier-badge" style="background:${school.color}22;color:${school.color};border:1px solid ${school.color}44;">4 Mantra</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
              ${school.spells.map((sp) => `<span class="frontier-badge frontier-badge-blue">${sp}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>`;
  } else if (overdriveTab === 'bossfase') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-2">
        ${OVERDRIVE_BOSSES.map((b) => `
          <div class="frontier-card">
            <div class="frontier-card-head">
              <strong style="color:#ef9a9a;font-size:14px;">${b.name}</strong>
              <span class="frontier-badge frontier-badge-purple">${b.phases} FASE</span>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
              ${b.armor ? '<span class="frontier-badge" style="background:#78909c33;color:#90a4ae;border:1px solid #546e7a;">⛊ ARMOR</span>' : ''}
              ${b.shield ? '<span class="frontier-badge" style="background:#1565c033;color:#64b5f6;border:1px solid #0d47a1;">🛡 SHIELD</span>' : ''}
              ${b.stagger ? '<span class="frontier-badge" style="background:#e65c0033;color:#ffab91;border:1px solid #bf360c;">💥 STAGGER</span>' : ''}
            </div>
            <div class="boss-minibars" style="margin-top:8px;">
              <div class="boss-minibar-row"><span class="boss-minibar-lbl">HP</span><div class="boss-minibar-track"><div class="boss-minibar-fill" style="width:100%;background:#ef5350;"></div></div></div>
              ${b.armor ? '<div class="boss-minibar-row"><span class="boss-minibar-lbl">ARM</span><div class="boss-minibar-track"><div class="boss-minibar-fill" style="width:100%;background:#607d8b;"></div></div></div>' : ''}
              ${b.shield ? '<div class="boss-minibar-row"><span class="boss-minibar-lbl">SHD</span><div class="boss-minibar-track"><div class="boss-minibar-fill" style="width:100%;background:#1565c0;"></div></div></div>' : ''}
              ${b.stagger ? '<div class="boss-minibar-row"><span class="boss-minibar-lbl">STG</span><div class="boss-minibar-track"><div class="boss-minibar-fill" style="width:30%;background:#ff6d00;"></div></div></div>' : ''}
            </div>
          </div>
        `).join('')}
      </div>`;
  } else if (overdriveTab === 'profiler') {
    bodyEl.innerHTML = `
      <div class="frontier-card" style="max-width:520px;margin:0 auto;">
        <strong style="color:#ffd166;font-size:15px;">⊡ Diagnostic Profiler HUD</strong>
        <p style="font-size:12px;color:#b7a486;margin:8px 0;">
          Tekan <kbd>F3</kbd> atau tombol ⊡ di pojok HUD untuk toggle profiler saat bermain.
        </p>
        <div class="profiler-hud profiler-demo" style="position:relative;display:block;margin:12px 0;">
          <div class="profiler-row"><span class="profiler-key">FPS</span><span class="profiler-val">60</span><span class="profiler-key">MS</span><span class="profiler-val">16.7</span></div>
          <div class="profiler-row"><span class="profiler-key">ENT</span><span class="profiler-val">12</span><span class="profiler-key">PTL</span><span class="profiler-val">48</span></div>
          <div class="profiler-row"><span class="profiler-key">MEM</span><span class="profiler-val">~24 MB</span></div>
        </div>
        <ul style="font-size:11.5px;color:#ced4da;padding-left:18px;margin:4px 0;">
          <li>FPS rata-rata + frame time (ms)</li>
          <li>Jumlah entitas aktif + partikel</li>
          <li>Estimasi memori (KB/MB)</li>
          <li>⚠ STUTTER alert jika frame > 50ms</li>
        </ul>
      </div>`;
  } else if (overdriveTab === 'modes') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-3">
        ${OVERDRIVE_MODES.map((m, i) => `
          <div class="frontier-card">
            <div class="frontier-card-head">
              <strong style="color:#ffd166;font-size:13px;">${i + 1}. ${m.name}</strong>
            </div>
            <p style="font-size:11.5px;color:#ced4da;margin:4px 0;">${m.desc}</p>
          </div>
        `).join('')}
      </div>`;
  } else if (overdriveTab === 'checklist') {
    const done = OVERDRIVE_CHECKLIST.filter((c) => c.done).length;
    bodyEl.innerHTML = `
      <div style="margin-bottom:12px;text-align:center;">
        <strong style="color:#52b788;font-size:20px;">${done} / ${OVERDRIVE_CHECKLIST.length} SIAP RILIS</strong>
      </div>
      <div class="overdrive-checklist">
        ${OVERDRIVE_CHECKLIST.map((c) => `
          <div class="checklist-item ${c.done ? 'done' : ''}">
            <span class="checklist-icon">${c.done ? '✅' : '⬜'}</span>
            <span class="checklist-text">${c.item}</span>
          </div>
        `).join('')}
      </div>`;
  }
}

function buildFrontierScreen() {
  const summaryEl = $('frontier-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="stat-card">
        <span class="stat-label">LEVEL KAMPANYE</span>
        <strong class="stat-value">200 / 200</strong>
        <em class="stat-sub">100 Asli · 100 Beyond the Veil</em>
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
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-2">
        ${FRONTIER_CHAPTERS.map((ch) => `
          <div class="frontier-card" style="border-left: 4px solid ${ch.color};">
            <div class="frontier-card-head">
              <strong style="color: ${ch.color}; font-size: 15px;">BAB ${ch.number}: ${ch.english}</strong>
              <span class="frontier-badge frontier-badge-gold">Lv. ${ch.levelStart}–${ch.levelEnd}</span>
            </div>
            <div style="font-size: 12px; color: #b7a486;">${ch.name} — Kesulitan: <b style="color:#ff7043;">${ch.difficulty}</b></div>
            <p style="font-size: 11.5px; color: #ced4da; margin: 4px 0;">${ch.lore}</p>
            <div style="font-size: 11px; background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 4px;">
              <span style="color:#ffd166;">⚡ Mekanisme Wilayah:</span> ${ch.mechanic}
            </div>
            <div style="font-size: 11px; color:#a7c957;">
              <b>👑 Bos Utama:</b> ${ch.bossName} (${ch.bossTitle})
            </div>
          </div>
        `).join('')}
      </div>
    `;
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

// ── update log ───────────────────────────────────────────────────────────
function buildUpdateLog() {
  const wrap = $('update-log');
  if (!wrap) return;
  wrap.innerHTML = UPDATE_LOG.map((entry, index) => `
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
  const badge = $('updates-version');
  if (badge) badge.textContent = `VERSI SAAT INI · v${GAME_VERSION}`;
}

function showUpdates() {
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
  menuView = 'updates';
  clearHeldKeys();
  buildUpdateLog();
  syncScreens();
}

// ── settings screen ──────────────────────────────────────────────────────
function showSettings() {
  settingsOpen = true;
  settingsCapture = null;
  settingsConflict = null;
  mapOpen = false;
  codexOpen = false;
  inventoryOpen = false;
  clearHeldKeys();
  buildSettings();
  syncScreens();
}

function closeSettings() {
  if (!settingsOpen) return;
  settingsOpen = false;
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
  const synth = window.speechSynthesis;
  if (!synth || typeof window.SpeechSynthesisUtterance !== 'function') return;
  try {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.92;
    utterance.pitch = 0.85;
    utterance.volume = 1;
    const voices = synth.getVoices ? synth.getVoices() : [];
    const indo = voices.find((v) => /^id([-_]|$)/i.test(v.lang)) || voices.find((v) => /indones/i.test(v.name));
    if (indo) utterance.voice = indo;
    synth.speak(utterance);
  } catch {
    /* speech unavailable - subtitles carry the story */
  }
}

function stopPrologueVoice() {
  const synth = window.speechSynthesis;
  if (!synth) return;
  try {
    synth.cancel();
  } catch {
    /* ignore */
  }
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
        <span class="inv-type">${item.type === 'sigil' ? 'SIGIL PASIF' : item.type === 'ritual' ? 'ITEM RITUAL' : 'KONSUMABEL'}</span>
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
const SETTINGS_TABS = [
  { id: 'audio', label: 'AUDIO' },
  { id: 'graphics', label: 'GRAFIK' },
  { id: 'controls', label: 'KONTROL' },
  { id: 'gameplay', label: 'GAMEPLAY & AKSESIBILITAS' },
];

function applySettings({ persist = true } = {}) {
  audio.applyVolumes({
    master: settings.audio.master / 100,
    music: settings.audio.music / 100,
    sfx: settings.audio.sfx / 100,
    muted: settings.audio.muted,
  });
  music.setVolume(1);
  const particleScale = settings.gameplay.particleDensity === 'off'
    ? 0
    : settings.gameplay.particleDensity === 'low'
      ? 0.45
      : 1;
  renderer.options = {
    shakeScale:
      settings.gameplay.screenShake === 'off' ? 0 : settings.gameplay.screenShake === 'low' ? 0.45 : 1,
    reduceFlashing: settings.gameplay.reduceFlashing,
    highContrast: settings.gameplay.highContrast,
    colorblind: settings.gameplay.colorblind,
    antiAliasing: settings.gameplay.antiAliasing,
    fov: settings.gameplay.fov,
    renderDistance: settings.gameplay.renderDistance,
    qualityBias: settings.gameplay.qualityBias,
    particleScale,
  };
  renderer.resize();
  const root = document.documentElement;
  root.classList.toggle('text-large', settings.gameplay.textSize === 'large');
  root.classList.toggle('reduce-flashing', settings.gameplay.reduceFlashing);
  root.classList.toggle('high-contrast', settings.gameplay.highContrast);
  root.classList.toggle('colorblind', settings.gameplay.colorblind);

  const btn = $('sound-btn');
  if (btn) {
    btn.classList.toggle('muted', settings.audio.muted);
    btn.setAttribute('aria-pressed', String(settings.audio.muted));
    btn.textContent = settings.audio.muted ? '∅' : '♪';
    btn.title = settings.audio.muted ? 'Suara mati (N)' : 'Suara aktif (N)';
  }
  const fps = $('fps-badge');
  if (fps) fps.classList.toggle('hidden', !settings.gameplay.fpsCounter);
  if (persist) saveSettings(settingsStore, settings);
}

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

function buildSettings() {
  const tabs = $('settings-tabs');
  const body = $('settings-body');
  if (!tabs || !body) return;

  tabs.innerHTML = SETTINGS_TABS.map(
    (tab) =>
      `<button class="settings-tab${settingsTab === tab.id ? ' active' : ''}" type="button" role="tab" aria-selected="${settingsTab === tab.id}" data-settings-tab="${tab.id}">${tab.label}</button>`,
  ).join('');
  tabs.querySelectorAll('[data-settings-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      settingsTab = btn.dataset.settingsTab;
      settingsCapture = null;
      settingsConflict = null;
      buildSettings();
    });
  });

  if (settingsTab === 'audio') {
    body.innerHTML = `
      <div class="settings-group">
        <span class="settings-group-title">VOLUME</span>
        ${settingsSliderRow('master', 'Master', settings.audio.master)}
        ${settingsSliderRow('music', 'Musik', settings.audio.music)}
        ${settingsSliderRow('sfx', 'Efek Suara (SFX)', settings.audio.sfx)}
      </div>
      <div class="settings-group">
        <span class="settings-group-title">PERILAKU AUDIO</span>
        ${settingsCheckboxRow('audio-toggle', 'muted', 'Bisukan semua suara', settings.audio.muted, 'Tombol musik di HUD tetap sinkron dengan pengaturan ini.')}
        ${settingsCheckboxRow('audio-toggle', 'muteOnBlur', 'Bisukan saat tab kehilangan fokus', settings.audio.muteOnBlur)}
      </div>
      <p class="map-note">Musik dihasilkan langsung lewat Web Audio — tidak ada file audio yang perlu diunduh. Zona yang sedang aktif memutar track-nya sendiri dan crossfade saat kau berpindah ruang.</p>
    `;
    body.querySelectorAll('[data-audio]').forEach((input) => {
      input.addEventListener('input', () => {
        const key = input.dataset.audio;
        settings.audio[key] = clamp(Math.round(Number(input.value) || 0), 0, 100);
        const label = body.querySelector(`[data-audio-value="${key}"]`);
        if (label) label.textContent = String(settings.audio[key]);
        applySettings();
      });
    });
    body.querySelectorAll('[data-audio-toggle]').forEach((input) => {
      input.addEventListener('change', () => {
        settings.audio[input.dataset.audioToggle] = input.checked;
        if (input.dataset.audioToggle === 'muted') {
          audio.init();
          audio.setMuted(settings.audio.muted);
        }
        applySettings();
        buildSettings();
      });
    });
    return;
  }

  if (settingsTab === 'graphics') {
    body.innerHTML = `
      <div class="settings-group">
        <span class="settings-group-title">PRESET & BEBAN RENDER</span>
        <div class="settings-row">
          <label for="set-graphics-preset">Preset grafis</label>
          <select id="set-graphics-preset" data-graphics-select="graphicsPreset">
            ${['low', 'med', 'high', 'ultra'].map((id) => `<option value="${id}" ${settings.gameplay.graphicsPreset === id ? 'selected' : ''}>${id.toUpperCase()}</option>`).join('')}
          </select>
          <span class="settings-hint">Preset awal; slider di bawah tetap bisa menimpa beban render.</span>
        </div>
        ${settingsRangeRow('graphics', 'qualityBias', 'Performance ↔ Quality', settings.gameplay.qualityBias, 0, 100, 1, '%')}
        <div class="graphics-bias-labels"><span>PERFORMA</span><span>SEIMBANG</span><span>KUALITAS</span></div>
        ${settingsRangeRow('graphics', 'fov', 'Field of View', settings.gameplay.fov, 80, 120, 1, '°')}
        ${settingsRangeRow('graphics', 'renderDistance', 'Render distance', settings.gameplay.renderDistance, 50, 100, 5, '%')}
      </div>
      <div class="settings-group">
        <span class="settings-group-title">KUALITAS GAMBAR</span>
        ${settingsCheckboxRow('graphics-toggle', 'antiAliasing', 'Anti-aliasing canvas', settings.gameplay.antiAliasing, 'Menghaluskan tepi sprite dan teks canvas; matikan untuk performa.')}
        <div class="settings-row">
          <label for="set-particles">Kepadatan partikel</label>
          <select id="set-particles" data-graphics-select="particleDensity">
            <option value="off" ${settings.gameplay.particleDensity === 'off' ? 'selected' : ''}>OFF</option>
            <option value="low" ${settings.gameplay.particleDensity === 'low' ? 'selected' : ''}>LOW</option>
            <option value="full" ${settings.gameplay.particleDensity === 'full' ? 'selected' : ''}>FULL</option>
          </select>
          <span></span>
        </div>
        ${settingsCheckboxRow('gameplay-toggle', 'fpsCounter', 'Tampilkan penghitung FPS', settings.gameplay.fpsCounter)}
      </div>
      <p class="map-note">Bias di bawah 25% membatasi resolusi internal ke 1× dan menipiskan cuaca; di atas 65% canvas memakai resolusi perangkat penuh. FOV mengubah zoom dunia, render distance menambah kabut tepi dan mengurangi partikel jauh.</p>
    `;
    body.querySelectorAll('[data-graphics-range]').forEach((input) => {
      input.addEventListener('input', () => {
        const key = input.dataset.graphicsRange;
        settings.gameplay[key] = Math.round(Number(input.value) || 0);
        if (key === 'qualityBias') {
          const bias = settings.gameplay.qualityBias;
          settings.gameplay.graphicsPreset = bias < 25 ? 'low' : bias < 55 ? 'med' : bias < 85 ? 'high' : 'ultra';
        }
        const label = body.querySelector(`[data-graphics-value="${key}"]`);
        if (label) label.textContent = `${settings.gameplay[key]}${key === 'fov' ? '°' : '%'}`;
        applySettings();
        if (key === 'qualityBias') {
          const preset = body.querySelector('[data-graphics-select="graphicsPreset"]');
          if (preset) preset.value = settings.gameplay.graphicsPreset;
        }
      });
    });
    body.querySelectorAll('[data-graphics-select]').forEach((select) => {
      select.addEventListener('change', () => {
        settings.gameplay[select.dataset.graphicsSelect] = select.value;
        applySettings();
        buildSettings();
      });
    });
    body.querySelectorAll('[data-graphics-toggle]').forEach((input) => {
      input.addEventListener('change', () => {
        settings.gameplay[input.dataset.graphicsToggle] = input.checked;
        applySettings();
        buildSettings();
      });
    });
    return;
  }

  if (settingsTab === 'controls') {
    const conflict = settingsConflict
      ? `<div class="bind-conflict">
          <span><b>${formatCode(settingsConflict.code)}</b> sudah dipakai oleh <b>${ACTIONS.find((a) => a.id === settingsConflict.other)?.label || settingsConflict.other}</b>. Tukar binding?</span>
          <button type="button" data-conflict="swap">TUKAR</button>
          <button type="button" data-conflict="cancel">BATAL</button>
        </div>`
      : '';
    const rows = ACTIONS.map((action) => {
      const codes = settings.bindings[action.id] || [];
      const cell = (slot) => {
        const capturing =
          settingsCapture && settingsCapture.action === action.id && settingsCapture.slot === slot;
        const code = codes[slot] || '';
        return `<button class="bind-btn${capturing ? ' capturing' : ''}${code ? '' : ' empty'}" type="button" data-bind-action="${action.id}" data-slot="${slot}">${capturing ? 'TEKAN…' : formatCode(code)}</button>`;
      };
      return `<tr>
        <td>${action.label}</td>
        <td>${cell(0)}</td>
        <td>${cell(1)}</td>
        <td>${action.gamepad}</td>
        <td><button class="bind-reset" type="button" data-reset-action="${action.id}" title="Reset ${action.label}" aria-label="Reset ${action.label}">↺</button></td>
      </tr>`;
    }).join('');
    body.innerHTML = `
      ${conflict}
      <div class="settings-group">
        <span class="settings-group-title">KEYBIND — DUA SLOT PER AKSI</span>
        <table class="bind-table">
          <thead><tr><th>AKSI</th><th>UTAMA</th><th>ALTERNATIF</th><th>GAMEPAD</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="map-note">Klik tombol lalu tekan tombol baru. <kbd>ESC</kbd> membatalkan. Jika tombol sudah dipakai, pilih TUKAR atau BATAL.</p>
      </div>
      <div class="settings-group">
        <span class="settings-group-title">GAMEPAD</span>
        ${settingsCheckboxRow('gameplay-toggle', 'gamepad', 'Aktifkan Gamepad API', settings.gameplay.gamepad, 'Gamepad standar: A lompat, B dash, X serang, Y skill, LB flask, RB shuriken, Start jeda.')}
      </div>
      <div class="settings-actions">
        <button class="bind-conflict button" type="button" data-reset-all>RESET SEMUA KEYBIND</button>
      </div>
    `;
    body.querySelectorAll('[data-bind-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        settingsConflict = null;
        settingsCapture = { action: btn.dataset.bindAction, slot: Number(btn.dataset.slot) };
        buildSettings();
      });
    });
    body.querySelectorAll('[data-reset-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        settings = resetActionBindings(settings, btn.dataset.resetAction);
        settingsCapture = null;
        settingsConflict = null;
        applySettings();
        buildSettings();
      });
    });
    body.querySelectorAll('[data-conflict]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.conflict === 'swap' && settingsConflict) {
          const result = applyBinding(
            settings,
            settingsConflict.action,
            settingsConflict.slot,
            settingsConflict.code,
          );
          settings = result.settings;
          applySettings();
          showToast('Binding ditukar.', 1500);
        }
        settingsConflict = null;
        settingsCapture = null;
        buildSettings();
      });
    });
    const resetAll = body.querySelector('[data-reset-all]');
    if (resetAll) {
      resetAll.addEventListener('click', () => {
        settings = resetAllBindings(settings);
        settingsCapture = null;
        settingsConflict = null;
        applySettings();
        buildSettings();
        showToast('Semua keybind kembali ke bawaan.', 1600);
      });
    }
    body.querySelectorAll('[data-gameplay-toggle]').forEach((input) => {
      input.addEventListener('change', () => {
        settings.gameplay[input.dataset.gameplayToggle] = input.checked;
        applySettings();
        buildSettings();
      });
    });
    return;
  }

  // Gameplay & accessibility
  body.innerHTML = `
    <div class="settings-group">
      <span class="settings-group-title">GAMEPLAY</span>
      <div class="settings-row">
        <label for="set-shake">Screen shake</label>
        <select id="set-shake" data-gameplay-select="screenShake">
          <option value="off" ${settings.gameplay.screenShake === 'off' ? 'selected' : ''}>OFF</option>
          <option value="low" ${settings.gameplay.screenShake === 'low' ? 'selected' : ''}>LOW</option>
          <option value="full" ${settings.gameplay.screenShake === 'full' ? 'selected' : ''}>FULL</option>
        </select>
        <span></span>
      </div>
      <div class="settings-row">
        <label for="set-fps">Batas frame</label>
        <select id="set-fps" data-gameplay-select="frameCap">
          <option value="60" ${settings.gameplay.frameCap === 60 ? 'selected' : ''}>60 FPS</option>
          <option value="120" ${settings.gameplay.frameCap === 120 ? 'selected' : ''}>120 FPS</option>
          <option value="0" ${settings.gameplay.frameCap === 0 ? 'selected' : ''}>UNCAPPED</option>
        </select>
        <span></span>
      </div>
      ${settingsCheckboxRow('gameplay-toggle', 'fpsCounter', 'Tampilkan penghitung FPS', settings.gameplay.fpsCounter)}
    </div>
    <div class="settings-group">
      <span class="settings-group-title">AKSESIBILITAS</span>
      ${settingsCheckboxRow('gameplay-toggle', 'reduceFlashing', 'Kurangi kilatan cahaya', settings.gameplay.reduceFlashing, 'Vignette darah rendah dan denyut UI menjadi statis.')}
      ${settingsCheckboxRow('gameplay-toggle', 'highContrast', 'Kontras tinggi', settings.gameplay.highContrast, 'Garis tepi UI, bar darah, dan proyektil dipertegas.')}
      ${settingsCheckboxRow('gameplay-toggle', 'colorblind', 'Mode ramah buta warna', settings.gameplay.colorblind, 'Proyektil musuh menjadi biru, proyektilmu kuning — warna zona tidak berubah.')}
      <div class="settings-row">
        <label for="set-text">Ukuran teks</label>
        <select id="set-text" data-gameplay-select="textSize">
          <option value="normal" ${settings.gameplay.textSize === 'normal' ? 'selected' : ''}>NORMAL</option>
          <option value="large" ${settings.gameplay.textSize === 'large' ? 'selected' : ''}>BESAR</option>
        </select>
        <span></span>
      </div>
    </div>
    <p class="map-note">Pengaturan disimpan di <code>ashen-vow-settings-v1</code>, terpisah dari progres permainan. Menghapus progres tidak menghapus kontrol atau audio.</p>
  `;
  body.querySelectorAll('[data-gameplay-select]').forEach((select) => {
    select.addEventListener('change', () => {
      const key = select.dataset.gameplaySelect;
      settings.gameplay[key] = key === 'frameCap' ? Number(select.value) : select.value;
      applySettings();
    });
  });
  body.querySelectorAll('[data-gameplay-toggle]').forEach((input) => {
    input.addEventListener('change', () => {
      settings.gameplay[input.dataset.gameplayToggle] = input.checked;
      applySettings();
      buildSettings();
    });
  });
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
  syncScreens();
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
  else renderDialogue();
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
    return;
  }

  if (menuView === 'frontier') {
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

  if (menuView === 'levels' || menuView === 'credits' || menuView === 'updates' || menuView === 'character' || menuView === 'expansion') {
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

  const action = actionForCode(settings, e.code);
  if (action && game.state === 'playing') {
    keys[action] = true;
  }
});

window.addEventListener('keyup', (e) => {
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
  for (const action of ['left', 'right', 'jump', 'attack', 'dash', 'heal', 'swap', 'consume', 'cycleItem', 'ability']) {
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
  const allies = labCoop.lobby.players
    .filter((player) => !player.host)
    .map((player, index) => labAllyFromLobby(player, index));
  if (mode === 'campaign') {
    startRun(0);
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
        roomIndex: game.roomIndex,
        roomLocal: mode === 'court' ? 0 : 0,
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
    startRun(0);
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
$('btn-settings-menu').addEventListener('click', () => showSettings(false));
$('btn-credits').addEventListener('click', showCredits);
$('btn-updates').addEventListener('click', showUpdates);
$('btn-map-menu').addEventListener('click', openMap);
$('btn-codex-menu').addEventListener('click', () => openCodex());
$('btn-expansion-menu').addEventListener('click', () => showExpansion());
$('btn-levels-back').addEventListener('click', showMenu);
$('btn-credits-back').addEventListener('click', showMenu);
$('btn-updates-back').addEventListener('click', showMenu);
$('btn-expansion-back').addEventListener('click', showMenu);
$('btn-mode3d-menu')?.addEventListener('click', () => showMode3D('campaign'));
$('btn-mode3d-back')?.addEventListener('click', closeMode3D);
$('btn-frontier-menu')?.addEventListener('click', () => showFrontier('campaign200'));
$('btn-frontier-back')?.addEventListener('click', closeFrontier);
$('btn-overdrive-menu')?.addEventListener('click', () => showOverdrive('campaign301'));
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
    input3D.attackJustPressed = true;
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
      game3D.camera.pitch = clamp(game3D.camera.pitch + dy * 0.004, -0.4, 0.7);
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
$('btn-settings-back').addEventListener('click', closeSettings);
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
$('btn-pause-settings').addEventListener('click', () => showSettings(true));
wireMapControls();

$('btn-retry').addEventListener('click', retryRun);
$('btn-again').addEventListener('click', () => startRun(0));
$('btn-resume').addEventListener('click', () => togglePause(false));
$('btn-shop').addEventListener('click', () => openShop(true));
$('btn-shop-close').addEventListener('click', closeShop);
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
  const covered = settingsOpen;

  $('title-screen').classList.toggle('hidden', menuView !== 'title' || covered);
  $('levels-screen').classList.toggle('hidden', menuView !== 'levels' || covered);
  $('credits-screen').classList.toggle('hidden', menuView !== 'credits' || covered);
  $('updates-screen').classList.toggle('hidden', menuView !== 'updates' || covered);
  $('character-screen').classList.toggle('hidden', menuView !== 'character' || covered);
  $('expansion-screen').classList.toggle('hidden', menuView !== 'expansion' || covered);
  $('frontier-screen').classList.toggle('hidden', menuView !== 'frontier' || covered);
  $('mode3d-screen').classList.toggle('hidden', menuView !== 'mode3d' || covered);
  $('overdrive-screen')?.classList.toggle('hidden', menuView !== 'overdrive' || covered);
  $('atlas-screen')?.classList.toggle('hidden', menuView !== 'atlas' || covered);
  $('labyrinth-screen')?.classList.toggle('hidden', menuView !== 'labyrinth' || covered);
  $('court-screen')?.classList.toggle('hidden', menuView !== 'court' || covered);
  $('fairy-screen')?.classList.toggle('hidden', menuView !== 'fairy' || covered);
  $('fallen-menu-screen')?.classList.toggle('hidden', menuView !== 'fallenMenu' || covered);
  $('fallen-screen')?.classList.toggle('hidden', menuView !== 'fallen' || covered);
  $('fallen-ending-screen')?.classList.toggle('hidden', !(fallenEndingOpen && started));
  $('crusade-menu-screen')?.classList.toggle('hidden', menuView !== 'crusadeMenu' || covered);
  $('crusade-screen')?.classList.toggle('hidden', menuView !== 'crusade' || covered);
  $('crusade-clear-screen')?.classList.toggle('hidden', !(crusadeClearOpen && started));
  $('speedrun-screen')?.classList.toggle('hidden', menuView !== 'speedrun' || covered);
  $('fishing-screen')?.classList.toggle('hidden', menuView !== 'fishing' || covered);
  $('bait-shop-screen')?.classList.toggle('hidden', menuView !== 'baitShop' || covered);
  $('fish-index-screen')?.classList.toggle('hidden', menuView !== 'fishIndex' || covered);
  $('speedrun-summary-screen')?.classList.toggle('hidden', !speedrunSummaryOpen);
  $('lab-reward-screen')?.classList.toggle('hidden', !labRewardsOpen);
  $('lab-summary-screen')?.classList.toggle('hidden', !labSummaryOpen);
  if (!inRun || activeRunKind !== 'atlas') $('atlas-quickbar')?.classList.add('hidden');
  $('prologue-screen').classList.toggle('hidden', !prologueActive);
  $('cutscene-screen')?.classList.toggle('hidden', !cutsceneActive);
  $('spectate-ui').classList.toggle('hidden', !spectating);
  $('map-screen').classList.toggle('hidden', !mapOpen);
  $('codex-screen').classList.toggle('hidden', !codexOpen);
  $('inventory-screen').classList.toggle('hidden', !inventoryOpen);
  $('settings-screen').classList.toggle('hidden', !settingsOpen);
  $('dialogue-screen').classList.toggle('hidden', !dialogueOpen);

  $('pause-screen').classList.toggle('hidden', !(inRun && paused && !shopOpen && s === 'playing') || covered);
  $('shop-screen').classList.toggle('hidden', !(inRun && shopOpen));
  $('blessing-screen').classList.toggle('hidden', !(inRun && !paused && !shopOpen && s === 'blessing'));
  $('dead-screen').classList.toggle('hidden', !(inRun && s === 'dead' && activeRunKind !== 'labyrinth' && activeRunKind !== 'speedrun'));
  $('victory-screen').classList.toggle('hidden', !(inRun && s === 'victory' && activeRunKind !== 'fallen' && activeRunKind !== 'crusade'));

  const hudVisible = inRun && !paused && !shopOpen && !mapOpen && !codexOpen && !inventoryOpen && !dialogueOpen
    && !settingsOpen && !cutsceneActive
    && (s === 'playing' || s === 'blessing');
  $('hud').classList.toggle('hidden', !hudVisible);
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
function drainEvents() {
  if (!game.events.length) return;    const events = game.events.splice(0, game.events.length);
    for (const ev of events) {
      if (ev.type === 'gatePass') recordStageTime(ev.from, activeStage?.label);
      else if (ev.type === 'bossDown') recordStageTime(ev.room, ev.name);
      else if (ev.type === 'roomEnter') beginStage(ev.room, ev.name);
      if (ev.type === 'bossDown' || ev.type === 'labyrinthBossDown') awardBossSkillPoints(ev.kind, ev.name);
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
    else if (ev.type === 'wallBroken') showToast('Dinding Miselium hancur — relung rahasia terbuka.', 2400);
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
  if (menuView === 'court') return 'hearth';
  if (menuView === 'fairy') return 'faewood';
  if (menuView === 'fallenMenu') return 'forgotten';
  if (menuView === 'fallen') return 'lastvigil';
  if (menuView === 'crusadeMenu') return 'hearth';
  if (menuView === 'crusade') return 'cinderworks';
  if (started && !spectating && menuView === 'none') {
    if (game.state === 'victory') {
      if (activeRunKind === 'fairy' && game.roomIndex >= FAIRY_ROOM_START) return 'celebration';
      return 'victory';
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

  fpsAccum += raw;
  fpsFrames += 1;
  if (fpsAccum >= 0.5) {
    fpsValue = Math.round(fpsFrames / fpsAccum);
    fpsAccum = 0;
    fpsFrames = 0;
    const badge = $('fps-badge');
    if (badge) badge.textContent = `${fpsValue} FPS`;
  }

  pollGamepad();
  syncMusic(raw);
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
    if (started && !paused && !shopOpen && !mapOpen && !codexOpen && !inventoryOpen && !dialogueOpen && !settingsOpen && !prologueActive && !cutsceneActive && !labRewardsOpen && !labSummaryOpen && !labGuestMode && !coopGuestMode && menuView === 'none') {
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
        if (activeRunKind === 'fallen') tickFallen(FIXED);
        if (activeRunKind === 'crusade') tickCrusade(FIXED);
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
      renderer.render(game);
    }
    if (mapOpen) mapView.draw(now / 1000);

    if (menuView === 'character' && previewCtx) {
      renderer.drawCharacterPreview(previewCtx, character, character.characterId, now / 1000);
    }

    if (menuView === 'mode3d' && game3D) {
      game3D.update(raw, input3D);
      const canvas3D = $('canvas-3d');
      if (canvas3D) {
        const ctx3D = canvas3D.getContext('2d');
        if (ctx3D) render3D(ctx3D, game3D);
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
  syncScreens();
  updateHud();
}

window.addEventListener('resize', () => renderer.resize());

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
    showToast('Celah itu belum bisa dibuka. Sesuatu di bawah sedang menunggu.', 2400);
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
      <strong>THE RIFT · ${CRUSADE_RIFT.locked ? 'TERKUNCI' : 'TERBUKA'}</strong>
      <p>${summary.arc4Hook ? 'Zirah Paladin kosong, dan sesuatu di dalamnya sudah pergi. Celah di langit masih hangat.' : 'Gerbang Penghakiman belum jatuh. Celah di langit masih tertutup.'}</p>
      <p class="crusade-card-meta">${esc(CRUSADE_RIFT.note)} · Arc IV belum dirancang.</p>
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

// ── debug hooks (used by automated smoke tests) ─────────────────────────
window.__ashen = {
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
  get shopOpen() {
    return shopOpen;
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
      audio: { ...settings.audio },
      gameplay: { ...settings.gameplay },
      bindings: Object.fromEntries(
        Object.entries(settings.bindings).map(([key, codes]) => [key, [...codes]]),
      ),
    };
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
      if (activeRunKind === 'fallen') tickFallen(FIXED);
      if (activeRunKind === 'crusade') tickCrusade(FIXED);
    }
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
requestAnimationFrame(frame);
