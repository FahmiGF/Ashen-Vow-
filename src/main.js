// Ashen Vow v0.0.6 — browser shell: menus, level select, spectate, fixed-step loop.
import {
  AshenGame,
  ROOMS,
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
import { MusicManager } from './music.js';
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

const $ = (id) => document.getElementById(id);
const FIXED = 1 / 120;
const PROGRESS_KEY = 'ashen-vow-progress-v1';
const CHARACTER_KEY = 'ashen-vow-character-v1';
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

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
let menuView = 'title'; // title | levels | credits | updates | character | expansion | none
let expansionTab = 'campaign';
let expansionChapter = 0;
let havenNpcId = 'sari';
let chronicleEventId = null;
let wardrobeFilter = 'all';
let activeRunKind = 'legacy';
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
let accumulator = 0;
let lastTime = performance.now();

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
  };
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
    const { version, unlocked: _unlocked, cleared: _cleared, map: _map, expansion: _expansion, ...extras } = parsed;
    return {
      ...extras,
      version: 1,
      unlocked,
      cleared,
      map,
      expansion: sanitizeExpansionProgress(parsed.expansion),
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
  game.setAppearance({
    race: character.race,
    skin: character.skin,
    outfit: character.outfit,
    armor: character.armor,
  });
  const plate = document.querySelector('#hud .char-name');
  if (plate) plate.textContent = CHARACTERS[character.characterId]?.name || 'The Oathbound';
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
  saveProgress();
  showToast('Kampanye Echoes selesai — New Game Plus terbuka.', 4600);
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
  audio.init();
  attempts = 1;
  activeRunKind = 'legacy';
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
  showBanner(game.room.name, game.room.subtitle);
  syncScreens();
  updateHud();
}

function retryRun() {
  attempts += 1;
  const usedCheckpoint = game.respawnAtCheckpoint();
  if (!usedCheckpoint) {
    const index = game.roomIndex;
    game.reset();
    applyCharacterToGame();
    if (activeRunKind === 'expansion') {
      game.setChallenge(expansionChallengeConfig());
      game.setKnownCollectibles(expState().collectibles);
      applySkinToGame();
    }
    if (index > 0) {
      game.enterRoom(index);
      if (index >= 2) game.player.relic = true;
      if (index >= EXPANSION_ROOM_START) provisionExpansionAsh(index - EXPANSION_ROOM_START);
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
  menuView = 'title';
  game.reset();
  game.events.length = 0;
  clearHeldKeys();
  updateMenuProgress();
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

function showCredits() {
  menuView = 'credits';
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
    if ($('char-ability-key')) $('char-ability-key').textContent = `[${c.ability.key || 'U / V'}] · CD ${c.ability.cooldown}s`;
  }
  $('char-race-desc').textContent = RACES[character.race]?.desc || '';
  $('char-armor-desc').textContent = OUTFITS[character.armor]?.desc || '';

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
  renderer.options = {
    shakeScale:
      settings.gameplay.screenShake === 'off' ? 0 : settings.gameplay.screenShake === 'low' ? 0.45 : 1,
    reduceFlashing: settings.gameplay.reduceFlashing,
    highContrast: settings.gameplay.highContrast,
    colorblind: settings.gameplay.colorblind,
  };
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

// ── UI wiring ────────────────────────────────────────────────────────────
$('btn-start').addEventListener('click', beginJourney);
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

function formatTime(seconds) {  const s = Math.max(0, Math.floor(seconds));
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
  const room = ROOMS[game.roomIndex];
  $('death-sub').textContent = `Kau gugur di ${room.name}. Sumpah belum tuntas — bangkit dan coba lagi.`;
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
  $('prologue-screen').classList.toggle('hidden', !prologueActive);
  $('spectate-ui').classList.toggle('hidden', !spectating);
  $('map-screen').classList.toggle('hidden', !mapOpen);
  $('codex-screen').classList.toggle('hidden', !codexOpen);
  $('inventory-screen').classList.toggle('hidden', !inventoryOpen);
  $('settings-screen').classList.toggle('hidden', !settingsOpen);
  $('dialogue-screen').classList.toggle('hidden', !dialogueOpen);

  $('pause-screen').classList.toggle('hidden', !(inRun && paused && !shopOpen && s === 'playing') || covered);
  $('shop-screen').classList.toggle('hidden', !(inRun && shopOpen));
  $('blessing-screen').classList.toggle('hidden', !(inRun && !paused && !shopOpen && s === 'blessing'));
  $('dead-screen').classList.toggle('hidden', !(inRun && s === 'dead'));
  $('victory-screen').classList.toggle('hidden', !(inRun && s === 'victory'));

  const hudVisible = inRun && !paused && !shopOpen && !mapOpen && !codexOpen && !inventoryOpen && !dialogueOpen
    && !settingsOpen
    && (s === 'playing' || s === 'blessing');
  $('hud').classList.toggle('hidden', !hudVisible);
  $('touch').classList.toggle(
    'hidden',
    !(touchEnabled && inRun && !paused && !shopOpen && !mapOpen && !codexOpen && !inventoryOpen && !dialogueOpen && !settingsOpen && s === 'playing'),
  );

  if (inRun && !inMenu && s !== lastGameState) {
    if (s === 'blessing') buildBlessings();
    if (s === 'dead') fillDeathStats();
    if (s === 'victory') fillVictoryStats();
    lastGameState = s;
  }
  if (!inRun) lastGameState = s;
}

let flaskCache = -1;
let relicCache = null;

function updateHud() {
  if (!started || menuView !== 'none' || spectating) return;
  const hud = game.hud;
  const pct = Math.max(0, Math.min(1, hud.hp / hud.maxHp)) * 100;
  $('hp-fill').style.width = `${pct}%`;
  $('hp-text').textContent = `${hud.hp} / ${hud.maxHp}`;

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

  $('room-name').textContent = hud.roomName;
  $('room-sub').textContent = (game.room.subtitle || '').toUpperCase();

  const p = game.player;
  $('ash-count').textContent = game.ash;
  const weapon = WEAPONS[p.weapon] || WEAPONS.sword;
  $('weapon-badge').textContent = weapon.short;
  $('weapon-badge').dataset.weapon = p.weapon;
  if (p.weapon === 'bow') {
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
    const phase = $('boss-phase');
    const roman = ['I', 'II', 'III'][boss.phase - 1] || 'I';
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
}

// ── game loop ────────────────────────────────────────────────────────────
function drainEvents() {
  if (!game.events.length) return;
  const events = game.events.splice(0, game.events.length);
  for (const ev of events) {
    const activeRun = started && !spectating && menuView === 'none';
    if (activeRun && !paused) audio.play(ev);
    if (activeRun) {
      if (activeRunKind === 'expansion') {
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
      } else {
        if (ev.type === 'gatePass') markCleared(ev.from, ev.to);
        else if (ev.type === 'bossDown') markCleared(ev.room, ev.next);
      }
    }
    if (!started) continue;
    if (ev.type === 'roomEnter') {
      if (activeRunKind === 'expansion' && ev.room >= EXPANSION_ROOM_START && ev.room < EXPANSION_ROOM_START + TOTAL_LEVELS) {
        activeExpansionIndex = ev.room - EXPANSION_ROOM_START;
      }
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
    else if (ev.type === 'echoGain' && activeRunKind === 'expansion') showToast(`✦ +${ev.amount} Gema · total ${ev.total}`, 1400);
  }
}

function desiredTrack() {
  if (prologueActive) return null;
  if (started && !spectating && menuView === 'none') {
    if (game.state === 'victory') return 'victory';
    if (game.boss && game.state === 'playing') return zoneForRoom(game.roomIndex).bossMusic || 'boss';
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
  } else {
    music.setLayer('combat', 0);
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

  if (spectating && spectateGame) {
    spectateGame.time += Math.min(raw, 0.05);
    if (peekDir !== 0) peekOffset = clamp(peekOffset + peekDir * 330 * raw, -WORLD_W, WORLD_W);
    renderer.render(spectateGame, { spectate: true, cameraX: spectateCamera() });
  } else {
    if (started && !paused && !shopOpen && !mapOpen && !codexOpen && !inventoryOpen && !dialogueOpen && !settingsOpen && !prologueActive && menuView === 'none') {
      accumulator += raw;
      let steps = 0;
      while (accumulator >= FIXED && steps < 10) {
        game.update(FIXED, inputSnapshot());
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
    renderer.render(game);
    if (mapOpen) mapView.draw(now / 1000);

    if (menuView === 'character' && previewCtx) {
      renderer.drawCharacterPreview(previewCtx, character, character.characterId, now / 1000);
    }
  }

  drainEvents();
  syncScreens();
  updateHud();
}

window.addEventListener('resize', () => renderer.resize());

// ── debug hooks (used by automated smoke tests) ─────────────────────────
window.__ashen = {
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
    for (let i = 0; i < frames; i++) game.update(FIXED, merged);
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
updateMenuProgress();
buildLevelCards();
applyCharacterToGame();
applySettings();
renderer.render(game);
syncScreens();
updateHud();
requestAnimationFrame(frame);
