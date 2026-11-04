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
import { PROLOGUE_BEATS, PROLOGUE_TOTAL, drawPrologue } from './prologue.js';

const $ = (id) => document.getElementById(id);
const FIXED = 1 / 120;
const PROGRESS_KEY = 'ashen-vow-progress-v1';
const CHARACTER_KEY = 'ashen-vow-character-v1';
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

const canvas = $('game');
const renderer = new Renderer(canvas);
const audio = new SoundKit();
const game = new AshenGame();

let started = false;
let paused = false;
let menuView = 'title'; // title | levels | credits | none
let spectating = false;
let shopOpen = false;
let mapOpen = false;
let codexOpen = false;
let codexTab = 'enemies';
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
];

// ── progress ─────────────────────────────────────────────────────────────
function defaultProgress() {
  return { unlocked: 1, cleared: ROOMS.map(() => false) };
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    const cleared = ROOMS.map((_, i) => !!parsed.cleared?.[i]);
    const unlocked = clamp(Number(parsed.unlocked) || 1, 1, ROOMS.length);
    return { unlocked, cleared };
  } catch {
    return defaultProgress();
  }
}

function saveProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* storage unavailable — keep in memory */
  }
}

let progress = loadProgress();

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

function markCleared(index) {
  if (!Number.isInteger(index) || index < 0 || index >= ROOMS.length) return;
  let changed = false;
  if (!progress.cleared[index]) {
    progress.cleared[index] = true;
    changed = true;
  }
  const nextUnlocked = Math.min(ROOMS.length, index + 2);
  if (nextUnlocked > progress.unlocked) {
    progress.unlocked = nextUnlocked;
    changed = true;
  }
  if (changed) {
    saveProgress();
    updateMenuProgress();
    if (menuView === 'levels') buildLevelCards();
  }
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

// ── character select / customization ─────────────────────────────────────
function showCharacter() {
  cancelPrologue();
  started = false;
  paused = false;
  shopOpen = false;
  mapOpen = false;
  codexOpen = false;
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
function buildMap() {
  const wrap = $('map-rooms');
  if (!wrap) return;
  const inRun = started && !spectating && menuView === 'none';
  const current = inRun ? game.roomIndex : -1;
  wrap.innerHTML = ROOMS.map((room, i) => {
    const meta = LEVEL_META[i];
    const info = room.boss ? BOSS_INFO[room.boss] : null;
    const unlocked = i < progress.unlocked;
    const cleared = !!progress.cleared[i];
    const isCurrent = i === current;
    const tags = [];
    if (info) tags.push(`BOSS · ${info.maxPhases || 2} FASE`);
    if (room.relic) tags.push('RELIK');
    if (room.checkpoint) tags.push('WARUNG');
    if (!room.gate && i === ROOMS.length - 1) tags.push('FINALE');
    const status = isCurrent ? 'KAU DI SINI' : cleared ? 'TUNTAS' : unlocked ? 'TERBUKA' : 'TERKUNCI';
    return `
      <article class="map-room${isCurrent ? ' current' : ''}${cleared ? ' cleared' : ''}${unlocked ? '' : ' locked'}" style="--accent:${room.accent}">
        <div class="map-room-top">
          <span class="map-chapter">${meta.chapter}</span>
          <span class="map-status">${status}</span>
        </div>
        <span class="map-glyph" aria-hidden="true">${meta.glyph}</span>
        <h3>${room.name}</h3>
        <p>${meta.desc}</p>
        <div class="map-tags">${tags.map((t) => `<span>${t}</span>`).join('')}</div>
      </article>
    `;
  }).join('');
  $('map-current').textContent = inRun
    ? `POSISI · ${game.room.name.toUpperCase()}`
    : 'PETA SUMPAH · 8 RUANG · 4 BOSS';
  $('map-progress').textContent = `${progress.cleared.filter(Boolean).length} / ${ROOMS.length} RUANG TUNTAS`;
}

function openMap() {
  if (dialogueOpen || spectating) return;
  mapOpen = true;
  codexOpen = false;
  clearHeldKeys();
  buildMap();
  syncScreens();
}

function closeMap() {
  if (!mapOpen) return;
  mapOpen = false;
  lastTime = performance.now();
  accumulator = 0;
  syncScreens();
}

function toggleMap() {
  if (mapOpen) closeMap();
  else openMap();
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
    const locked = i >= progress.unlocked;
    const cleared = !!progress.cleared[i];
    const meta = LEVEL_META[i];
    const card = document.createElement('article');
    card.className = `level-card${locked ? ' locked' : ''}${cleared ? ' cleared' : ''}`;
    card.style.setProperty('--accent', room.accent);
    const bossInfo = room.boss ? BOSS_INFO[room.boss] : null;
    const bossTag = bossInfo ? `<span class="boss">BOSS · ${bossInfo.maxPhases || 2} FASE</span>` : '';
    const tags = meta.tags
      .filter((t) => !t.includes('2 FASE'))
      .map((t) => `<span>${t}</span>`)
      .join('');
    const badge = cleared
      ? '<span class="level-badge done">TUNTAS</span>'
      : locked
        ? '<span class="level-badge lock">TERKUNCI</span>'
        : '<span class="level-badge">TERBUKA</span>';
    card.innerHTML = `
      <div class="level-art">
        <span class="level-chapter">${meta.chapter}</span>
        ${badge}
        <span class="level-glyph" aria-hidden="true">${meta.glyph}</span>
      </div>
      <div class="level-body">
        <h3>${room.name}</h3>
        <span class="level-sub">${room.subtitle}</span>
        <p class="level-desc">${meta.desc}</p>
        <div class="level-tags">${tags}${bossTag}</div>
        <div class="level-actions">
          ${
            locked
              ? ''
              : '<button class="btn btn-primary btn-small play-btn" type="button">MAINKAN</button>'
          }
          <button class="btn btn-ghost btn-small peek-btn" type="button">SNEAK PEEK</button>
        </div>
      </div>
    `;
    const playBtn = card.querySelector('.play-btn');
    if (playBtn) playBtn.addEventListener('click', () => startRun(i));
    card.querySelector('.peek-btn').addEventListener('click', () => startSpectate(i));
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

function toggleMute() {
  audio.init();
  const muted = audio.toggleMuted();
  const btn = $('sound-btn');
  btn.classList.toggle('muted', muted);
  btn.setAttribute('aria-pressed', String(muted));
  btn.textContent = muted ? '∅' : '♪';
}

// ── input ────────────────────────────────────────────────────────────────
const KEY_ACTIONS = {
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  Space: 'jump',
  KeyW: 'jump',
  ArrowUp: 'jump',
  KeyJ: 'attack',
  KeyZ: 'attack',
  KeyK: 'dash',
  ShiftLeft: 'dash',
  ShiftRight: 'dash',
  KeyE: 'heal',
  KeyQ: 'heal',
  KeyX: 'swap',
  KeyC: 'consume',
  KeyU: 'ability',
  KeyV: 'ability',
  KeyR: 'ability',
};

window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
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

  if (mapOpen) {
    if (e.code === 'KeyM' || e.code === 'Escape' || e.code === 'Backspace') closeMap();
    else if (e.code === 'KeyI') openCodex();
    return;
  }

  if (codexOpen) {
    if (e.code === 'KeyI' || e.code === 'Escape' || e.code === 'Backspace') closeCodex();
    else if (e.code === 'KeyM') openMap();
    return;
  }

  if (e.code === 'KeyM') {
    openMap();
    return;
  }
  if (e.code === 'KeyI') {
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

  if (menuView === 'levels' || menuView === 'credits' || menuView === 'character') {
    if (e.code === 'Escape' || e.code === 'Backspace') showMenu();
    return;
  }

  if (menuView === 'title' || !started) {
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyJ') beginJourney();
    else if (e.code === 'KeyL') showLevels();
    else if (e.code === 'KeyP') showCharacter();
    else if (e.code === 'KeyC') showCredits();
    return;
  }

  if (shopOpen) {
    if (e.code === 'Escape' || e.code === 'KeyF' || e.code === 'Backspace') closeShop();
    return;
  }

  if (e.code === 'Escape') {
    if (game.state === 'blessing') return;
    if (paused) togglePause(false);
    else togglePause(true);
    return;
  }

  if (paused) return;

  if (e.code === 'KeyF' && game.state === 'playing') {
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

  const action = KEY_ACTIONS[e.code];
  if (action && game.state === 'playing') {
    keys[action] = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (spectating && (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'ArrowRight' || e.code === 'KeyD')) {
    peekDir = 0;
    return;
  }
  const action = KEY_ACTIONS[e.code];
  if (action) keys[action] = false;
});

window.addEventListener('blur', () => {
  peekDir = 0;
  clearHeldKeys();
});

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
  for (const action of ['left', 'right', 'jump', 'attack', 'dash', 'heal', 'swap', 'consume', 'ability']) {
    input[action] = !!(keys[action] || touchInput[action]);
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
$('btn-credits').addEventListener('click', showCredits);
$('btn-map-menu').addEventListener('click', openMap);
$('btn-codex-menu').addEventListener('click', () => openCodex());
$('btn-levels-back').addEventListener('click', showMenu);
$('btn-credits-back').addEventListener('click', showMenu);
$('btn-peek-back').addEventListener('click', stopSpectate);
$('btn-map-close').addEventListener('click', closeMap);
$('btn-map-codex').addEventListener('click', () => openCodex());
$('btn-codex-close').addEventListener('click', closeCodex);
$('btn-codex-map').addEventListener('click', openMap);
$('btn-dialogue-next').addEventListener('click', advanceDialogue);
$('btn-pause-map').addEventListener('click', openMap);
$('btn-pause-codex').addEventListener('click', () => openCodex());

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
    if (started) audio.init();
  },
  { once: true },
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
  arrows: '➳',
  flask: '✚',
};

const SHOP_TYPE_LABEL = {
  weapon: 'SENJATA',
  consumable: 'KONSUMABEL',
  ammo: 'AMUNISI',
  flask: 'BEKAL',
};

function shopItemState(item) {
  const p = game.player;
  if (item.type === 'weapon' && p.weapons.includes(item.id)) {
    return { disabled: true, label: 'DIMILIKI', note: 'Tekan X untuk berganti senjata.', owned: true };
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
        <span class="shop-icon" aria-hidden="true">${SHOP_ICONS[item.id] || '✦'}</span>
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

  $('title-screen').classList.toggle('hidden', menuView !== 'title');
  $('levels-screen').classList.toggle('hidden', menuView !== 'levels');
  $('credits-screen').classList.toggle('hidden', menuView !== 'credits');
  $('character-screen').classList.toggle('hidden', menuView !== 'character');
  $('prologue-screen').classList.toggle('hidden', !prologueActive);
  $('spectate-ui').classList.toggle('hidden', !spectating);
  $('map-screen').classList.toggle('hidden', !mapOpen);
  $('codex-screen').classList.toggle('hidden', !codexOpen);
  $('dialogue-screen').classList.toggle('hidden', !dialogueOpen);

  $('pause-screen').classList.toggle('hidden', !(inRun && paused && !shopOpen && s === 'playing'));
  $('shop-screen').classList.toggle('hidden', !(inRun && shopOpen));
  $('blessing-screen').classList.toggle('hidden', !(inRun && !paused && !shopOpen && s === 'blessing'));
  $('dead-screen').classList.toggle('hidden', !(inRun && s === 'dead'));
  $('victory-screen').classList.toggle('hidden', !(inRun && s === 'victory'));

  const hudVisible = inRun && !paused && !shopOpen && !mapOpen && !codexOpen && !dialogueOpen
    && (s === 'playing' || s === 'blessing');
  $('hud').classList.toggle('hidden', !hudVisible);
  $('touch').classList.toggle(
    'hidden',
    !(touchEnabled && inRun && !paused && !shopOpen && !mapOpen && !codexOpen && !dialogueOpen && s === 'playing'),
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
    $('ammo-badge').textContent = `SHURIKEN ${p.shurikens}`;
    $('ammo-badge').classList.toggle('empty', p.shurikens <= 0);
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
        abilityBadge.textContent = `⚡ ${p.ability.name.toUpperCase()} [U]`;
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
    if (game.canShop()) hint = 'Tekan F — Warung Abu';
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
      if (ev.type === 'gatePass') markCleared(ev.from);
      else if (ev.type === 'bossDown') markCleared(ev.room);
    }
    if (!started) continue;
    if (ev.type === 'roomEnter') showBanner(ev.name, ev.subtitle);
    else if (ev.type === 'bossSpawn') showToast(`⚔ ${ev.name} — ${ev.title}`, 2400);
    else if (ev.type === 'relic') showToast('Relik Bulu Bara — lompat ganda terbuka', 2400);
    else if (ev.type === 'bossDialogue') queueDialogue(ev);
    else if (ev.type === 'bossPhase') {
      const roman = ['I', 'II', 'III'][ev.phase - 1] || String(ev.phase);
      showToast(`FASE ${roman} — ${ev.name} bangkit`, 2200);
    }
    else if (ev.type === 'respawn') showToast('Kau terlempar dari jurang');
    else if (ev.type === 'blessingChosen') showToast(`Berkah: ${ev.name}`, 1600);
    else if (ev.type === 'checkpoint') showToast(`Checkpoint aktif — ${ev.name}`, 2000);
    else if (ev.type === 'checkpointRespawn') showToast('Bangkit di checkpoint — abu dan senjata tersimpan.', 2200);
    else if (ev.type === 'ashGain') showToast(`✦ +${ev.amount} ABU · total ${ev.total}`, 1300);
    else if (ev.type === 'shopBuy') showToast(`Dibeli: ${ev.name}`, 1700);
    else if (ev.type === 'noAmmo') {
      showToast(
        ev.kind === 'arrow'
          ? 'Anak panah habis — beli di Warung Abu.'
          : 'Shuriken habis — beli di Warung Abu.',
        2100,
      );
    } else if (ev.type === 'weaponSwitch') showToast(`Senjata: ${ev.name}`, 1200);
  }
}

function frame(now) {
  // Schedule first so an exception in a handler cannot permanently stop the loop.
  requestAnimationFrame(frame);
  const raw = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

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
    if (started && !paused && !shopOpen && !mapOpen && !codexOpen && !dialogueOpen && !prologueActive && menuView === 'none') {
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
    closeDialogue(true);
    spectating = false;
    menuView = 'none';
    game.enterRoom(index);
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
renderer.render(game);
syncScreens();
updateHud();
requestAnimationFrame(frame);
