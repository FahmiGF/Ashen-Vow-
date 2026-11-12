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
let menuView = 'title'; // title | levels | credits | none
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
  };
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
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
    return { version: 1, unlocked, cleared, map };
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
  game.reset();
  applyCharacterToGame();
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
    if (index > 0) {
      game.enterRoom(index);
      if (index >= 2) game.player.relic = true;
      provisionStartAsh(index);
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

  if (menuView === 'levels' || menuView === 'credits' || menuView === 'updates' || menuView === 'character') {
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
$('btn-levels-back').addEventListener('click', showMenu);
$('btn-credits-back').addEventListener('click', showMenu);
$('btn-updates-back').addEventListener('click', showMenu);
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
      if (ev.type === 'gatePass') markCleared(ev.from, ev.to);
      else if (ev.type === 'bossDown') markCleared(ev.room, ev.next);
    }
    if (!started) continue;
    if (ev.type === 'roomEnter') {
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
  showCredits,
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
