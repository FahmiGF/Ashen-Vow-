// Ashen Vow — Campaign Map Editor (Update XXX, v0.40.0).
// Pure data model: no DOM, no storage. The browser shell owns localStorage,
// the form UI and the live run; this module validates a blueprint and converts
// it into a room the existing engine can load through `game.loadArena()`.
// No campaign room, save key or progression array changes.
import {
  ALL_ENEMY_INFO,
  ALL_BOSS_INFO,
  WEAPONS,
  CHARACTERS,
  WORLD_W,
  FLOOR_Y,
} from './core.js';
import { ZONES, ZONE_IDS } from './zones.js';
import { TRACKS } from './music.js';
import { DIFFICULTIES, DIFFICULTY_BY_ID, DIFFICULTY_IDS } from './difficulty.js';

export const MAP_EDITOR_SAVE_KEY = 'ashen-vow-mapeditor-v1';
export const MAP_EDITOR_SCHEMA = 3;
export const MAP_EDITOR_MAX_STAGES = 20;
export const MAP_EDITOR_MAX_ENEMIES = 28;
export const MAP_EDITOR_MAX_PLATFORMS = 26;
export const MAP_EDITOR_MAX_CHAIN = 6;
export const MAP_EDITOR_GRID = 20;
export const MAP_EDITOR_NAME_MAX = 44;
export const MAP_EDITOR_SUBTITLE_MAX = 64;
export const MAP_EDITOR_MAX_WEAPONS = 5;
export const MAP_EDITOR_MAX_ARROWS = 60;
export const MAP_EDITOR_MAX_FLASKS = 6;
export const MAP_EDITOR_MAX_ASH = 500;
export const MAP_EDITOR_WORLD_H = 540;
export const MAP_EDITOR_SHARE_PREFIX = 'AVME1.';
export const MAP_EDITOR_SHARE_MAX = 24000;
export const MAP_EDITOR_NAME = 'PETA SUMPAH — MAP EDITOR KAMPANYE';
export const MAP_EDITOR_SURVIVE_MIN = 20;
export const MAP_EDITOR_SURVIVE_MAX = 180;
export const MAP_EDITOR_MAX_ELITES = 8;

// The balance target the AUTO-SEIMBANG button aims for: the upper half of the
// "seimbang" band, so an auto-tuned map still has teeth.
export const MAP_EDITOR_BALANCE_TARGET = 1.8;

// Takaran (map difficulty) reuses the six campaign profiles. The map multiplier
// is absolute (normal = 1) and stacks on top of the player's global setting, so
// a "story" map stays light even for someone playing on Hard.
export const MAP_EDITOR_DIFFICULTY_OPTIONS = DIFFICULTIES.map((entry) => ({
  id: entry.id,
  name: entry.localName || entry.name,
  note: `HP musuh ×${entry.enemyHp.toFixed(2)} · damage ×${entry.enemyDamage.toFixed(2)} · bos HP ×${entry.bossHp.toFixed(2)}`,
}));

export const MAP_EDITOR_OBJECTIVES = [
  { id: 'clear', label: 'Bersihkan ruang', note: 'Ruang selesai saat semua musuh dan bos gugur.' },
  { id: 'survive', label: 'Bertahan', note: 'Ruang selesai saat hitungan waktu habis — asal kau masih hidup.' },
];

// Threat bands. Ratio = total enemy load ÷ player power.
export const MAP_EDITOR_THREAT_BANDS = [
  { id: 'ringan', max: 1.2, label: 'Ringan', tone: 'ok', note: 'Terlalu longgar untuk pemain berpengalaman.' },
  { id: 'seimbang', max: 2.4, label: 'Seimbang', tone: 'ok', note: 'Tekanan dan sumber daya saling mengimbangi.' },
  { id: 'berat', max: 3.6, label: 'Berat', tone: 'warn', note: 'Butuh flask dan posisi yang rapi.' },
  { id: 'brutal', max: Infinity, label: 'Brutal', tone: 'error', note: 'Kemungkinan besar mustahil tanpa peta yang lebih ringan.' },
];

// Layout templates seed the free-form canvas. Painting replaces the platforms
// but keeps the template id as the stage's label and its RESET target.
export const MAP_EDITOR_LAYOUTS = [
  {
    id: 'flat',
    label: 'Aula Datar',
    note: 'Satu lantai penuh, tiga pijakan gantung.',
    platforms: [
      { x: 0, y: 470, w: WORLD_W, h: 70 },
      { x: 300, y: 372, w: 190, h: 18 },
      { x: 640, y: 318, w: 180, h: 18 },
      { x: 1000, y: 386, w: 160, h: 18 },
    ],
  },
  {
    id: 'terraces',
    label: 'Teras Bertingkat',
    note: 'Empat pijakan menanjak ke kanan.',
    platforms: [
      { x: 0, y: 470, w: WORLD_W, h: 70 },
      { x: 180, y: 392, w: 170, h: 18 },
      { x: 430, y: 330, w: 170, h: 18 },
      { x: 690, y: 268, w: 180, h: 18 },
      { x: 980, y: 344, w: 200, h: 18 },
    ],
  },
  {
    id: 'chasm',
    label: 'Jurang Tengah',
    note: 'Dua lantai, jurang di tengah, dua jembatan sempit.',
    platforms: [
      { x: 0, y: 470, w: 520, h: 70 },
      { x: 880, y: 470, w: 520, h: 70 },
      { x: 520, y: 402, w: 160, h: 16 },
      { x: 720, y: 402, w: 160, h: 16 },
      { x: 600, y: 300, w: 200, h: 18 },
    ],
  },
  {
    id: 'towers',
    label: 'Menara Gantung',
    note: 'Pilar tinggi dengan pijakan di ketinggian.',
    platforms: [
      { x: 0, y: 470, w: WORLD_W, h: 70 },
      { x: 220, y: 360, w: 120, h: 18 },
      { x: 420, y: 250, w: 120, h: 18 },
      { x: 640, y: 200, w: 140, h: 18 },
      { x: 860, y: 250, w: 120, h: 18 },
      { x: 1060, y: 360, w: 120, h: 18 },
    ],
  },
];

// Openers reuse the cutscenes the game already ships: the 60 s prologue, the
// 80 s in-engine trailer, or the 18 s Infinitower trailer.
export const MAP_EDITOR_INTROS = [
  { id: 'none', label: 'Tanpa pembuka' },
  { id: 'prologue', label: 'Prolog 60 detik' },
  { id: 'trailer', label: 'Trailer sinematik 80 detik' },
  { id: 'spiral', label: 'Trailer Lingkar 18 detik' },
];

export const MAP_EDITOR_ZONE_OPTIONS = ZONE_IDS.map((id) => ({
  id,
  name: ZONES[id].name,
  subtitle: ZONES[id].subtitle,
  color: ZONES[id].color,
}));

export const MAP_EDITOR_MUSIC_OPTIONS = Object.keys(TRACKS).map((id) => ({
  id,
  name: TRACKS[id].label || id,
}));

export const MAP_EDITOR_WEAPON_OPTIONS = Object.keys(WEAPONS)
  .filter((id) => WEAPONS[id] && typeof WEAPONS[id] === 'object')
  .map((id) => ({ id, name: WEAPONS[id].name || id }));

export const MAP_EDITOR_CLASS_OPTIONS = Object.keys(CHARACTERS).map((id) => ({
  id,
  name: CHARACTERS[id].name || id,
  role: CHARACTERS[id].role || CHARACTERS[id].title || '',
}));

export const MAP_EDITOR_ENEMY_OPTIONS = Object.keys(ALL_ENEMY_INFO)
  .map((id) => ({ id, name: ALL_ENEMY_INFO[id].name || id }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const MAP_EDITOR_BOSS_OPTIONS = Object.keys(ALL_BOSS_INFO)
  .map((id) => ({ id, name: ALL_BOSS_INFO[id].name || id, title: ALL_BOSS_INFO[id].title || '' }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const MAP_EDITOR_PRESETS = [
  {
    id: 'preset_hall',
    name: 'Aula Latihan',
    subtitle: 'Peta pertama',
    layout: 'flat',
    zone: 'ashen',
    music: 'ashen',
    bossMusic: 'boss',
    intro: 'none',
    classId: 'sera',
    weapons: ['sword'],
    arrows: 0,
    flasks: 3,
    ash: 60,
    relic: false,
    checkpoint: true,
    boss: null,
    difficulty: 'normal',
    objective: 'clear',
    surviveSeconds: 60,
    enemies: ['crawler', 'crawler', 'sentinel'],
  },
  {
    id: 'preset_duel',
    name: 'Duel Penjaga',
    subtitle: 'Satu bos, tanpa bala bantuan',
    layout: 'towers',
    zone: 'frostglass',
    music: 'frostglass',
    bossMusic: 'boss',
    intro: 'trailer',
    classId: 'sera',
    weapons: ['sword'],
    arrows: 0,
    flasks: 4,
    ash: 80,
    relic: false,
    checkpoint: true,
    boss: 'warden',
    difficulty: 'hard',
    objective: 'clear',
    surviveSeconds: 60,
    enemies: [],
  },
  {
    id: 'preset_gauntlet',
    name: 'Gelombang Abu',
    subtitle: 'Enam tubuh, satu jurang',
    layout: 'chasm',
    zone: 'cinder',
    music: 'cinder',
    bossMusic: 'boss',
    intro: 'none',
    classId: 'lyna',
    weapons: ['sword', 'bow'],
    arrows: 16,
    flasks: 3,
    ash: 120,
    relic: true,
    checkpoint: false,
    boss: null,
    difficulty: 'normal',
    objective: 'clear',
    surviveSeconds: 60,
    enemies: ['crawler', 'crawler', 'sentinel', 'wraith', 'brute', 'sporeling'],
  },
  {
    id: 'preset_siege',
    name: 'Pengepungan 60 Detik',
    subtitle: 'Bertahan, bukan menuntaskan',
    layout: 'chasm',
    zone: 'frostglass',
    music: 'frostglass',
    bossMusic: 'boss',
    intro: 'none',
    classId: 'bram',
    weapons: ['sword'],
    arrows: 0,
    flasks: 4,
    ash: 90,
    relic: false,
    checkpoint: true,
    boss: null,
    difficulty: 'normal',
    objective: 'survive',
    surviveSeconds: 60,
    enemies: ['crawler', 'sentinel', 'wraith', 'crawler'],
  },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const number = (value, fallback, min, max) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(Math.round(parsed), min, max);
};

const idShape = (value) => typeof value === 'string' && /^[a-z0-9_]+$/i.test(value);

export function layoutFor(id) {
  return MAP_EDITOR_LAYOUTS.find((layout) => layout.id === id) || MAP_EDITOR_LAYOUTS[0];
}

export function spawnForBlueprint() {
  return { x: 90, y: FLOOR_Y - 46 };
}

/** Absolute multipliers for one map difficulty (normal = all 1). */
export function mapDifficultyScale(id) {
  const config = DIFFICULTY_BY_ID[id] || DIFFICULTY_BY_ID.normal;
  return {
    id: config.id,
    name: config.localName || config.name,
    hp: config.enemyHp,
    dmg: config.enemyDamage,
    speed: config.enemySpeed,
    bossHp: config.bossHp,
    bossDmg: config.bossDamage,
    reward: config.reward,
  };
}

/**
 * How much punishment the chosen loadout can absorb and dish out. Class HP and
 * damage are the base; every extra flask, weapon, quiver and the relic scale it.
 * This is a tuning heuristic, not a combat simulation — it exists so the editor
 * can say "this map is brutal" before the player finds out the hard way.
 */
export function playerPower(raw) {
  return playerPowerForBlueprint(sanitizeBlueprint(raw, 0));
}

function playerPowerForBlueprint(blueprint) {
  const cls = CHARACTERS[blueprint.classId] || CHARACTERS.sera;
  const hp = Number(cls.maxHp) || 100;
  const dmg = Number(cls.damage) || 1;
  const flasks = 1 + (blueprint.flasks - 1) * 0.2;
  const weapons = 1 + (blueprint.weapons.length - 1) * 0.15;
  const quiver = blueprint.weapons.includes('bow') ? 1 + Math.min(0.25, blueprint.arrows / 240) : 1;
  const relic = blueprint.relic ? 1.05 : 1;
  const ash = 1 + Math.min(0.12, blueprint.ash / 4000);
  return Math.max(1, Math.round(hp * dmg * flasks * weapons * quiver * relic * ash));
}

/** Total effective HP the map throws at the player, at its own takaran. */
export function enemyLoad(raw) {
  const blueprint = sanitizeBlueprint(raw, 0);
  return enemyLoadForBlueprint(blueprint, mapDifficultyScale(blueprint.difficulty));
}

function enemyLoadForBlueprint(blueprint, scale) {
  let load = 0;
  for (const enemy of blueprint.enemies) {
    const info = ALL_ENEMY_INFO[enemy.type] || {};
    load += (Number(info.hp) || 50) * (enemy.elite ? 1.8 : 1);
  }
  if (blueprint.boss) {
    load += (Number(ALL_BOSS_INFO[blueprint.boss]?.maxHp) || 500) * 0.9;
  }
  return Math.round(load * scale.hp);
}

function balanceMetrics(blueprint) {
  const scale = mapDifficultyScale(blueprint.difficulty);
  const power = playerPowerForBlueprint(blueprint);
  const load = enemyLoadForBlueprint(blueprint, scale);
  const ratio = Math.round((load / power) * 100) / 100;
  return { power, load, ratio, scale };
}

/**
 * Live balance read-out for one blueprint: threat ratio, band and concrete tips.
 * Deterministic and pure, so the editor meter and the Node tests share it.
 */
export function threatRating(raw) {
  return threatRatingForBlueprint(sanitizeBlueprint(raw, 0));
}

function threatRatingForBlueprint(blueprint) {
  const { power, load, ratio, scale } = balanceMetrics(blueprint);
  const band = MAP_EDITOR_THREAT_BANDS.find((entry) => ratio <= entry.max) || MAP_EDITOR_THREAT_BANDS[MAP_EDITOR_THREAT_BANDS.length - 1];
  const elites = blueprint.enemies.filter((enemy) => enemy.elite).length;
  const tips = [];
  if (!blueprint.enemies.length && !blueprint.boss) {
    tips.push('Tambah musuh atau bos: ruang tanpa lawan langsung selesai.');
  }
  if (band.id === 'ringan' && (blueprint.enemies.length || blueprint.boss)) {
    tips.push('Tambah 2–4 musuh, atau naikkan takaran satu tingkat.');
  }
  if (band.id === 'berat') tips.push('Tambah satu flask atau pilih takaran yang lebih ringan.');
  if (band.id === 'brutal') tips.push('Kurangi musuh, turunkan takaran, atau tambah flask dan abu awal.');
  if (elites > MAP_EDITOR_MAX_ELITES) tips.push(`Elite lebih dari ${MAP_EDITOR_MAX_ELITES} membuat ruang sangat berat.`);
  if (blueprint.objective === 'survive' && !blueprint.enemies.length && !blueprint.boss) {
    tips.push('Ruang bertahan tanpa lawan tidak punya tekanan sama sekali.');
  }
  if (blueprint.boss && blueprint.enemies.length > 12) tips.push('Bos dengan lebih dari 12 musuh sulit dibaca di layar.');
  return {
    score: load,
    power,
    ratio,
    band: band.id,
    label: band.label,
    tone: band.tone,
    note: band.note,
    elites,
    difficulty: scale.id,
    difficultyName: scale.name,
    tips,
  };
}

const DIFFICULTY_ORDER = ['abyssal', 'nightmare', 'hard', 'normal', 'easy', 'story'];

/**
 * Nudge a blueprint toward the balance target by adding sustain, trimming or
 * adding bodies, and only then changing the takaran. Every step is reported so
 * the editor can show exactly what it did instead of silently rewriting a map.
 */
export function autoBalanceBlueprint(raw) {
  const blueprint = sanitizeBlueprint(raw, 0);
  const steps = [];
  const rate = () => balanceMetrics(blueprint).ratio;
  let guard = 0;

  while (rate() > MAP_EDITOR_THREAT_BANDS[1].max && guard < 60) {
    guard += 1;
    if (blueprint.flasks < MAP_EDITOR_MAX_FLASKS) {
      blueprint.flasks += 1;
      steps.push('flask +1');
      continue;
    }
    if (blueprint.enemies.length) {
      blueprint.enemies.pop();
      steps.push('musuh −1');
      continue;
    }
    const index = DIFFICULTY_ORDER.indexOf(blueprint.difficulty);
    if (index < DIFFICULTY_ORDER.length - 1) {
      blueprint.difficulty = DIFFICULTY_ORDER[index + 1];
      steps.push(`takaran → ${mapDifficultyScale(blueprint.difficulty).name}`);
      continue;
    }
    break;
  }

  while (rate() <= MAP_EDITOR_THREAT_BANDS[0].max && guard < 120) {
    guard += 1;
    if (blueprint.enemies.length < MAP_EDITOR_MAX_ENEMIES) {
      const source = blueprint.enemies.length
        ? blueprint.enemies[blueprint.enemies.length - 1].type
        : Object.keys(ALL_ENEMY_INFO)[0] || 'crawler';
      blueprint.enemies.push({
        type: source,
        x: Math.min(WORLD_W - 80, 260 + blueprint.enemies.length * 84),
        elite: false,
      });
      steps.push('musuh +1');
      continue;
    }
    const index = DIFFICULTY_ORDER.indexOf(blueprint.difficulty);
    if (index > 0) {
      blueprint.difficulty = DIFFICULTY_ORDER[index - 1];
      steps.push(`takaran → ${mapDifficultyScale(blueprint.difficulty).name}`);
      continue;
    }
    break;
  }

  blueprint.updatedAt = Date.now();
  return { blueprint, steps, rating: threatRatingForBlueprint(blueprint) };
}

/** Fresh, detached copy of a layout template. */
export function terrainFromLayout(layoutId) {
  return layoutFor(layoutId).platforms.map((platform) => ({ ...platform }));
}

export function newBlueprintId(save) {
  const used = new Set((save?.stages || []).map((stage) => stage.id));
  for (let i = 1; i <= MAP_EDITOR_MAX_STAGES + 1; i += 1) {
    const id = `stage_${i}`;
    if (!used.has(id)) return id;
  }
  return `stage_${Date.now().toString(36)}`;
}

/** The top-most platform under an x, used by the preview and by grounding. */
export function groundYFor(platforms, x, fromY = spawnForBlueprint().y) {
  let best = null;
  for (const platform of platforms || []) {
    if (x < platform.x || x > platform.x + platform.w) continue;
    if (platform.y < fromY) continue;
    if (best == null || platform.y < best) best = platform.y;
  }
  return best;
}

/** True when at least one platform can hold the fixed spawn point. */
export function supportsSpawn(platforms) {
  const spawn = spawnForBlueprint();
  return (platforms || []).some(
    (platform) => spawn.x >= platform.x && spawn.x <= platform.x + platform.w && platform.y >= spawn.y + 40,
  );
}

export function isTemplateTerrain(raw) {
  const blueprint = sanitizeBlueprint(raw, 0);
  const template = terrainFromLayout(blueprint.layout);
  if (template.length !== blueprint.platforms.length) return false;
  return template.every((platform, index) => {
    const other = blueprint.platforms[index];
    return platform.x === other.x && platform.y === other.y && platform.w === other.w && platform.h === other.h;
  });
}

/**
 * Free-form terrain. Anything painted stays where it was drawn (snapped to the
 * 20 px grid by the shell). An empty list falls back to the layout template;
 * the sanitizer never invents geometry, so `validateBlueprint` stays the one
 * place that decides whether the spawn point has ground under it.
 */
export function sanitizePlatforms(raw, layoutId) {
  const list = Array.isArray(raw) ? raw : [];
  const platforms = [];
  for (const entry of list) {
    if (platforms.length >= MAP_EDITOR_MAX_PLATFORMS) break;
    const x = number(entry?.x, 0, 0, WORLD_W - 40);
    const y = number(entry?.y, FLOOR_Y, 140, FLOOR_Y);
    const w = number(entry?.w, 200, 40, WORLD_W - x);
    const h = number(entry?.h, 18, 12, 80);
    platforms.push({ x, y, w, h });
  }
  if (!platforms.length) return terrainFromLayout(layoutId);
  return platforms;
}

/** Deterministic, clamped blueprint. Unknown ids fall back to safe defaults. */
export function sanitizeBlueprint(raw, index = 0) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const id = idShape(source.id) ? source.id : `stage_${index + 1}`;
  const name = String(source.name ?? '').trim().slice(0, MAP_EDITOR_NAME_MAX) || `Peta ${index + 1}`;
  const subtitle = String(source.subtitle ?? '').trim().slice(0, MAP_EDITOR_SUBTITLE_MAX) || 'Peta buatan';
  const layout = MAP_EDITOR_LAYOUTS.some((entry) => entry.id === source.layout) ? source.layout : 'flat';
  const zone = ZONE_IDS.includes(source.zone) ? source.zone : 'ashen';
  const music = TRACKS[source.music] ? source.music : ZONES[zone].music || 'ashen';
  const bossMusic = TRACKS[source.bossMusic] ? source.bossMusic : ZONES[zone].bossMusic || 'boss';
  const intro = MAP_EDITOR_INTROS.some((entry) => entry.id === source.intro) ? source.intro : 'none';
  const classId = CHARACTERS[source.classId] ? source.classId : 'sera';
  const difficulty = DIFFICULTY_IDS.includes(source.difficulty) ? source.difficulty : 'normal';
  const objective = source.objective === 'survive' ? 'survive' : 'clear';
  const surviveSeconds = number(source.surviveSeconds, 60, MAP_EDITOR_SURVIVE_MIN, MAP_EDITOR_SURVIVE_MAX);

  const weaponList = Array.isArray(source.weapons) ? source.weapons : [];
  const weapons = [];
  for (const weapon of weaponList) {
    if (!WEAPONS[weapon] || weapons.includes(weapon)) continue;
    weapons.push(weapon);
    if (weapons.length >= MAP_EDITOR_MAX_WEAPONS) break;
  }
  if (!weapons.length) weapons.push('sword');

  const boss = source.boss && ALL_BOSS_INFO[source.boss] ? source.boss : null;
  const nextStageId = idShape(source.nextStageId) ? source.nextStageId : null;

  const enemies = [];
  const rawEnemies = Array.isArray(source.enemies) ? source.enemies : [];
  for (const entry of rawEnemies) {
    if (enemies.length >= MAP_EDITOR_MAX_ENEMIES) break;
    const type = typeof entry === 'string' ? entry : entry?.type;
    if (!type || !ALL_ENEMY_INFO[type]) continue;
    const fallbackX = 260 + enemies.length * 84;
    const x = number(typeof entry === 'object' ? entry.x : fallbackX, fallbackX, 60, WORLD_W - 60);
    const elite = typeof entry === 'object' && entry ? !!entry.elite : false;
    enemies.push({ type, x, elite });
  }

  return {
    id,
    name,
    subtitle,
    layout,
    platforms: sanitizePlatforms(source.platforms, layout),
    zone,
    music,
    bossMusic,
    intro,
    classId,
    difficulty,
    objective,
    surviveSeconds,
    weapons,
    arrows: number(source.arrows, 0, 0, MAP_EDITOR_MAX_ARROWS),
    flasks: number(source.flasks, 3, 1, MAP_EDITOR_MAX_FLASKS),
    ash: number(source.ash, 45, 0, MAP_EDITOR_MAX_ASH),
    relic: !!source.relic,
    checkpoint: !!source.checkpoint,
    boss,
    nextStageId,
    enemies,
    createdAt: Number.isFinite(Number(source.createdAt)) ? Number(source.createdAt) : Date.now(),
    updatedAt: Number.isFinite(Number(source.updatedAt)) ? Number(source.updatedAt) : Date.now(),
  };
}

/** A fresh blueprint from one of the three authored presets. */
export function blueprintFromPreset(presetId, save = null, index = 0) {
  const preset = MAP_EDITOR_PRESETS.find((entry) => entry.id === presetId) || MAP_EDITOR_PRESETS[0];
  return sanitizeBlueprint(
    {
      ...preset,
      id: newBlueprintId(save || { stages: [] }),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      enemies: preset.enemies.map((type, slot) => ({ type, x: 260 + slot * 84 })),
    },
    index,
  );
}

function chainWalk(nextById, startId, limit = 64) {
  const order = [];
  const seen = new Set();
  let id = startId;
  while (id && nextById.has(id) && !seen.has(id) && order.length < limit) {
    seen.add(id);
    order.push(id);
    id = nextById.get(id) || null;
  }
  return { order, cycle: !!id && seen.has(id) };
}

/**
 * Ordered rooms of a chain starting at `startId`. Cycles and dangling links
 * stop the walk instead of looping, so a broken save still runs.
 */
export function chainFor(save, startId) {
  const state = sanitizeEditorSave(save);
  const byId = new Map(state.stages.map((stage) => [stage.id, stage]));
  const nextById = new Map(state.stages.map((stage) => [stage.id, stage.nextStageId]));
  const { order } = chainWalk(nextById, startId, MAP_EDITOR_MAX_CHAIN);
  const chain = order.map((id) => byId.get(id)).filter(Boolean);
  if (!chain.length && byId.has(startId)) chain.push(byId.get(startId));
  return chain;
}

export function chainLength(save, startId) {
  return chainFor(save, startId).length;
}

/**
 * Real, actionable validation. Errors block a run; warnings do not.
 * `spawn` must sit on a platform, so a stage can never start in the void.
 * Pass the editor save to validate chain links and cycles as well.
 */
export function validateBlueprint(raw, save = null) {
  const blueprint = sanitizeBlueprint(raw, 0);
  const errors = [];
  const warnings = [];

  const rawName = String(raw?.name ?? '').trim();
  if (!rawName) errors.push('Nama peta tidak boleh kosong.');
  else if (rawName.length > MAP_EDITOR_NAME_MAX) errors.push(`Nama maksimal ${MAP_EDITOR_NAME_MAX} karakter.`);

  if (raw?.zone && !ZONE_IDS.includes(raw.zone)) errors.push('Latar tidak dikenal.');
  if (raw?.music && !TRACKS[raw.music]) errors.push('Track musik tidak dikenal.');
  if (raw?.bossMusic && !TRACKS[raw.bossMusic]) errors.push('Track musik bos tidak dikenal.');
  if (raw?.classId && !CHARACTERS[raw.classId]) errors.push('Kelas tidak dikenal.');
  if (raw?.difficulty && !DIFFICULTY_IDS.includes(raw.difficulty)) errors.push('Takaran kesulitan tidak dikenal.');
  if (raw?.objective && !MAP_EDITOR_OBJECTIVES.some((entry) => entry.id === raw.objective)) {
    errors.push('Objektif tidak dikenal.');
  }
  const surviveRaw = Number(raw?.surviveSeconds);
  if (Number.isFinite(surviveRaw) && (surviveRaw < MAP_EDITOR_SURVIVE_MIN || surviveRaw > MAP_EDITOR_SURVIVE_MAX)) {
    errors.push(`Waktu bertahan ${MAP_EDITOR_SURVIVE_MIN}–${MAP_EDITOR_SURVIVE_MAX} detik.`);
  }
  if (raw?.boss && !ALL_BOSS_INFO[raw.boss]) errors.push('Bos tidak dikenal.');
  if (Array.isArray(raw?.enemies) && raw.enemies.length > MAP_EDITOR_MAX_ENEMIES) {
    errors.push(`Maksimal ${MAP_EDITOR_MAX_ENEMIES} musuh per peta.`);
  }
  if (Array.isArray(raw?.platforms) && raw.platforms.length > MAP_EDITOR_MAX_PLATFORMS) {
    errors.push(`Maksimal ${MAP_EDITOR_MAX_PLATFORMS} pijakan per peta.`);
  }
  for (const entry of raw?.enemies || []) {
    const type = typeof entry === 'string' ? entry : entry?.type;
    if (type && !ALL_ENEMY_INFO[type]) errors.push(`Musuh tidak dikenal: ${type}.`);
  }
  for (const weapon of raw?.weapons || []) {
    if (!WEAPONS[weapon]) errors.push(`Senjata tidak dikenal: ${weapon}.`);
  }

  if (!supportsSpawn(blueprint.platforms)) {
    errors.push('Titik awal tidak berada di atas pijakan.');
  }

  if (blueprint.nextStageId) {
    if (blueprint.nextStageId === blueprint.id) {
      errors.push('Rantai peta tidak boleh menunjuk ke dirinya sendiri.');
    } else if (save) {
      const state = sanitizeEditorSave(save);
      const byId = new Map(state.stages.map((stage) => [stage.id, stage]));
      if (!byId.has(blueprint.nextStageId)) {
        errors.push('Peta lanjutan tidak ditemukan.');
      } else {
        const nextById = new Map(state.stages.map((stage) => [stage.id, stage.nextStageId]));
        nextById.set(blueprint.id, blueprint.nextStageId);
        const walk = chainWalk(nextById, blueprint.id);
        if (walk.cycle) errors.push('Rantai peta berputar dan tidak akan pernah selesai.');
        else if (walk.order.length > MAP_EDITOR_MAX_CHAIN) {
          errors.push(`Rantai maksimal ${MAP_EDITOR_MAX_CHAIN} ruang.`);
        }
      }
    }
  }

  if (!blueprint.enemies.length && !blueprint.boss) warnings.push('Peta tidak punya musuh maupun bos.');
  if (blueprint.arrows > 0 && !blueprint.weapons.includes('bow')) warnings.push('Anak panah diberikan tanpa busur.');
  if (blueprint.ash === 0) warnings.push('Abu awal nol: Warung Abu tidak bisa dipakai.');
  if (blueprint.boss && blueprint.enemies.length > 16) warnings.push('Bos dengan lebih dari 16 musuh bisa sangat berat.');
  if (blueprint.music === blueprint.bossMusic) warnings.push('Musik biasa dan musik bos sama.');
  if (blueprint.platforms.length === 1) warnings.push('Peta hanya punya satu pijakan.');
  const elites = blueprint.enemies.filter((enemy) => enemy.elite).length;
  if (elites > MAP_EDITOR_MAX_ELITES) warnings.push(`Lebih dari ${MAP_EDITOR_MAX_ELITES} elite: ruang ini akan sangat berat.`);
  if (blueprint.objective === 'survive' && !blueprint.enemies.length && !blueprint.boss) {
    warnings.push('Ruang bertahan tanpa lawan hanya menunggu waktu.');
  }
  const rating = threatRating(blueprint);
  if (rating.band === 'brutal') warnings.push(`Takaran ${rating.ratio}× kekuatan pemain: pertimbangkan AUTO-SEIMBANG.`);

  return { ok: errors.length === 0, errors, warnings, blueprint, rating };
}

/**
 * Convert a blueprint into a synthetic room for `game.loadArena()`.
 * `index: -1` keeps the engine away from any campaign slot, and the gate's
 * `next: -1` makes the exit decorative — the shell ends the run itself.
 */
export function customRoomFromBlueprint(raw) {
  const blueprint = sanitizeBlueprint(raw, 0);
  const zone = ZONES[blueprint.zone] || ZONES.ashen;
  const scale = mapDifficultyScale(blueprint.difficulty);
  const room = {
    id: 'custom_stage',
    custom: true,
    editorId: blueprint.id,
    index: -1,
    name: blueprint.name,
    subtitle: blueprint.subtitle,
    accent: zone.color,
    zone: zone.id,
    palette: { ...zone.palette },
    particle: zone.particle,
    music: blueprint.music,
    bossMusic: blueprint.bossMusic,
    difficulty: blueprint.difficulty,
    objective: blueprint.objective,
    surviveSeconds: blueprint.surviveSeconds,
    spawn: spawnForBlueprint(),
    platforms: blueprint.platforms.map((platform) => ({ ...platform })),
    enemies: blueprint.enemies.map((enemy) => ({
      type: enemy.type,
      x: enemy.x,
      minX: Math.max(40, enemy.x - 170),
      maxX: Math.min(WORLD_W - 40, enemy.x + 170),
      elite: enemy.elite,
      eliteRank: enemy.elite ? 'custom' : null,
      hpScale: scale.hp,
      dmgScale: scale.dmg,
      speedScale: scale.speed,
    })),
    relic: blueprint.relic
      ? { x: 1180, y: 254, w: 26, h: 26, name: 'Relik Peta' }
      : null,
    boss: blueprint.boss,
    gate: {
      x: 1362,
      y: 286,
      w: 34,
      h: 184,
      requires: blueprint.boss ? 'boss' : 'clear',
      next: -1,
    },
    hint: blueprint.subtitle,
  };
  if (blueprint.checkpoint) {
    room.checkpoint = { x: 88, y: FLOOR_Y - 78, w: 38, h: 78, name: 'Warung Abu' };
    room.merchant = { x: 168, y: FLOOR_Y - 96, w: 46, h: 96 };
  }
  return room;
}

/**
 * Boss overrides for one map. Core multiplies the base boss by the global
 * difficulty, so the map's own takaran rides on top as a data override.
 */
export function customBossOverrides(raw) {
  const blueprint = sanitizeBlueprint(raw, 0);
  const scale = mapDifficultyScale(blueprint.difficulty);
  const info = blueprint.boss ? ALL_BOSS_INFO[blueprint.boss] : null;
  const overrides = { rewardOverride: 'blessing' };
  if (info) {
    overrides.maxHp = Math.max(1, Math.round((Number(info.maxHp) || 400) * scale.bossHp));
    overrides.contact = Math.max(1, Math.round((Number(info.contact) || 16) * scale.bossDmg));
  }
  return overrides;
}

export function defaultEditorSave() {
  const stage = sanitizeBlueprint(
    {
      ...MAP_EDITOR_PRESETS[0],
      id: 'stage_1',
      enemies: MAP_EDITOR_PRESETS[0].enemies.map((type, slot) => ({ type, x: 260 + slot * 84 })),
    },
    0,
  );
  return {
    version: MAP_EDITOR_SCHEMA,
    stages: [stage],
    selectedId: stage.id,
    plays: {},
    clears: {},
  };
}

export function sanitizeEditorSave(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const stages = [];
  const seen = new Set();
  for (const entry of Array.isArray(source.stages) ? source.stages : []) {
    if (stages.length >= MAP_EDITOR_MAX_STAGES) break;
    const stage = sanitizeBlueprint(entry, stages.length);
    if (seen.has(stage.id)) stage.id = newBlueprintId({ stages });
    seen.add(stage.id);
    stages.push(stage);
  }
  if (!stages.length) return defaultEditorSave();

  // Chain links must survive the sanitizer or point nowhere, never at a
  // missing stage. A link into a cycle is dropped instead of freezing a run.
  const nextById = new Map(stages.map((stage) => [stage.id, stage.nextStageId]));
  for (const stage of stages) {
    if (!stage.nextStageId) continue;
    if (!seen.has(stage.nextStageId) || stage.nextStageId === stage.id) {
      stage.nextStageId = null;
      continue;
    }
    const walk = chainWalk(nextById, stage.id);
    if (walk.cycle) stage.nextStageId = null;
  }

  const plays = {};
  for (const [id, value] of Object.entries(source.plays && typeof source.plays === 'object' ? source.plays : {})) {
    if (!seen.has(id)) continue;
    plays[id] = number(value, 0, 0, 100000);
  }
  const clears = {};
  for (const [id, value] of Object.entries(source.clears && typeof source.clears === 'object' ? source.clears : {})) {
    if (!seen.has(id)) continue;
    const count = number(value?.count, 0, 0, 100000);
    const best = Number(value?.best);
    clears[id] = { count, best: Number.isFinite(best) && best > 0 ? Math.round(best * 10) / 10 : 0 };
  }
  const selectedId = seen.has(source.selectedId) ? source.selectedId : stages[0].id;
  return { version: MAP_EDITOR_SCHEMA, stages, selectedId, plays, clears };
}

export function upsertBlueprint(save, raw) {
  const state = sanitizeEditorSave(save);
  const index = state.stages.findIndex((stage) => stage.id === raw?.id);
  const blueprint = sanitizeBlueprint(raw, index >= 0 ? index : state.stages.length);
  if (index >= 0) state.stages[index] = blueprint;
  else if (state.stages.length < MAP_EDITOR_MAX_STAGES) state.stages.push(blueprint);
  else return state;
  state.selectedId = blueprint.id;
  return sanitizeEditorSave(state);
}

export function removeBlueprint(save, id) {
  const state = sanitizeEditorSave(save);
  if (state.stages.length <= 1) return state;
  state.stages = state.stages.filter((stage) => stage.id !== id);
  for (const stage of state.stages) if (stage.nextStageId === id) stage.nextStageId = null;
  delete state.plays[id];
  delete state.clears[id];
  if (state.selectedId === id) state.selectedId = state.stages[0].id;
  return state;
}

export function recordEditorPlay(save, id) {
  const state = sanitizeEditorSave(save);
  if (!state.stages.some((stage) => stage.id === id)) return state;
  state.plays[id] = (state.plays[id] || 0) + 1;
  return state;
}

export function recordEditorClear(save, id, seconds) {
  const state = sanitizeEditorSave(save);
  if (!state.stages.some((stage) => stage.id === id)) return state;
  const entry = state.clears[id] || { count: 0, best: 0 };
  const time = Math.max(0, Math.round((Number(seconds) || 0) * 10) / 10);
  entry.count += 1;
  entry.best = entry.best > 0 ? Math.min(entry.best, time) : time;
  state.clears[id] = entry;
  return state;
}

export function editorSummary(save) {
  const state = sanitizeEditorSave(save);
  const enemies = state.stages.reduce((total, stage) => total + stage.enemies.length, 0);
  const elites = state.stages.reduce(
    (total, stage) => total + stage.enemies.filter((enemy) => enemy.elite).length,
    0,
  );
  const bosses = state.stages.filter((stage) => stage.boss).length;
  const chained = state.stages.filter((stage) => stage.nextStageId).length;
  const platforms = state.stages.reduce((total, stage) => total + stage.platforms.length, 0);
  const survive = state.stages.filter((stage) => stage.objective === 'survive').length;
  const brutal = state.stages.filter((stage) => threatRating(stage).band === 'brutal').length;
  const plays = Object.values(state.plays).reduce((total, value) => total + value, 0);
  const clears = Object.values(state.clears).reduce((total, value) => total + value.count, 0);
  const best = Object.values(state.clears).reduce(
    (lowest, value) => (value.best > 0 && (lowest === 0 || value.best < lowest) ? value.best : lowest),
    0,
  );
  return { stages: state.stages.length, enemies, elites, bosses, chained, platforms, survive, brutal, plays, clears, best };
}

export function blueprintSummary(stage) {
  const blueprint = sanitizeBlueprint(stage, 0);
  const bossName = blueprint.boss ? ALL_BOSS_INFO[blueprint.boss]?.name || blueprint.boss : null;
  const rating = threatRating(blueprint);
  return {
    name: blueprint.name,
    subtitle: blueprint.subtitle,
    zone: ZONES[blueprint.zone]?.name || blueprint.zone,
    music: TRACKS[blueprint.music]?.label || blueprint.music,
    boss: bossName,
    enemies: blueprint.enemies.length,
    elites: rating.elites,
    platforms: blueprint.platforms.length,
    weapons: blueprint.weapons.length,
    difficulty: rating.difficulty,
    difficultyName: rating.difficultyName,
    objective: blueprint.objective,
    surviveSeconds: blueprint.surviveSeconds,
    threat: rating.ratio,
    band: rating.band,
    next: blueprint.nextStageId,
  };
}

// ── Share codes ──────────────────────────────────────────────────────────
// A map (or a whole chain) travels as `AVME1.` + base64url of a compact JSON
// payload. No storage, no network: the player pastes the code themselves.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const B64_LOOKUP = new Map([...B64].map((char, index) => [char, index]));

function bytesToBase64Url(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    out += B64[a >> 2];
    out += B64[((a & 3) << 4) | ((b ?? 0) >> 4)];
    if (b === undefined) break;
    out += B64[((b & 15) << 2) | ((c ?? 0) >> 6)];
    if (c === undefined) break;
    out += B64[c & 63];
  }
  return out;
}

function base64UrlToBytes(text) {
  const bytes = [];
  let buffer = 0;
  let bits = 0;
  for (const char of text) {
    const value = B64_LOOKUP.get(char);
    if (value === undefined) throw new Error('invalid base64url');
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return Uint8Array.from(bytes);
}

const encodeUtf8 = (text) => {
  if (typeof TextEncoder === 'function') return new TextEncoder().encode(text);
  const escaped = unescape(encodeURIComponent(text));
  return Uint8Array.from(escaped, (char) => char.charCodeAt(0));
};

const decodeUtf8 = (bytes) => {
  if (typeof TextDecoder === 'function') return new TextDecoder().decode(bytes);
  let text = '';
  for (const byte of bytes) text += String.fromCharCode(byte);
  return decodeURIComponent(escape(text));
};

/** Encode one map or an ordered chain into a pasteable share code. */
export function encodeShareCode(stages) {
  const list = (Array.isArray(stages) ? stages : [stages]).filter(Boolean).slice(0, MAP_EDITOR_MAX_CHAIN);
  if (!list.length) return '';
  const blueprints = list.map((stage, index) => sanitizeBlueprint(stage, index));
  const indexById = new Map(blueprints.map((stage, index) => [stage.id, index]));
  const payload = {
    v: MAP_EDITOR_SCHEMA,
    stages: blueprints.map((stage) => ({
      n: stage.name,
      s: stage.subtitle,
      l: stage.layout,
      p: stage.platforms,
      z: stage.zone,
      m: stage.music,
      bm: stage.bossMusic,
      i: stage.intro,
      c: stage.classId,
      d: stage.difficulty,
      o: stage.objective,
      sv: stage.surviveSeconds,
      w: stage.weapons,
      a: stage.arrows,
      f: stage.flasks,
      ash: stage.ash,
      r: stage.relic,
      k: stage.checkpoint,
      bo: stage.boss,
      e: stage.enemies,
      nx: indexById.has(stage.nextStageId) ? indexById.get(stage.nextStageId) : -1,
    })),
  };
  return MAP_EDITOR_SHARE_PREFIX + bytesToBase64Url(encodeUtf8(JSON.stringify(payload)));
}

/** Decode a share code into fresh, unlinked-then-relinked blueprints. */
export function decodeShareCode(code) {
  const text = String(code ?? '').replace(/\s+/g, '');
  if (!text) return { ok: false, stages: [], error: 'Kode kosong.' };
  if (!text.startsWith(MAP_EDITOR_SHARE_PREFIX)) {
    return { ok: false, stages: [], error: `Kode harus diawali ${MAP_EDITOR_SHARE_PREFIX}` };
  }
  if (text.length > MAP_EDITOR_SHARE_MAX) {
    return { ok: false, stages: [], error: 'Kode terlalu panjang.' };
  }
  let payload;
  try {
    payload = JSON.parse(decodeUtf8(base64UrlToBytes(text.slice(MAP_EDITOR_SHARE_PREFIX.length))));
  } catch {
    return { ok: false, stages: [], error: 'Kode rusak atau tidak lengkap.' };
  }
  // Schema 2 codes (v0.40.0) carry no takaran or objective; they import with
  // the safe defaults instead of being rejected.
  if (!payload || (payload.v !== MAP_EDITOR_SCHEMA && payload.v !== 2)) {
    return { ok: false, stages: [], error: 'Versi kode tidak dikenal.' };
  }
  const rawStages = Array.isArray(payload.stages) ? payload.stages.slice(0, MAP_EDITOR_MAX_CHAIN) : [];
  if (!rawStages.length) return { ok: false, stages: [], error: 'Kode tidak berisi peta.' };

  const stages = rawStages.map((entry, index) => sanitizeBlueprint(
    {
      id: `stage_${index + 1}`,
      name: entry?.n,
      subtitle: entry?.s,
      layout: entry?.l,
      platforms: entry?.p,
      zone: entry?.z,
      music: entry?.m,
      bossMusic: entry?.bm,
      intro: entry?.i,
      classId: entry?.c,
      difficulty: entry?.d,
      objective: entry?.o,
      surviveSeconds: entry?.sv,
      weapons: entry?.w,
      arrows: entry?.a,
      flasks: entry?.f,
      ash: entry?.ash,
      relic: entry?.r,
      checkpoint: entry?.k,
      boss: entry?.bo,
      enemies: entry?.e,
      nextStageId: null,
    },
    index,
  ));
  rawStages.forEach((entry, index) => {
    const next = Number(entry?.nx);
    if (!Number.isInteger(next) || next < 0 || next >= stages.length || next === index) return;
    stages[index].nextStageId = stages[next].id;
  });
  return { ok: true, stages, error: null };
}

// ── Canvas preview ───────────────────────────────────────────────────────
// Draws the exact room the engine will load: terrain, spawn, roster, boss,
// exit gate and the optional checkpoint. Deterministic, no randomness.
export function drawEditorPreview(ctx, raw, width, height, options = {}) {
  if (!ctx || !width || !height) return;
  const blueprint = sanitizeBlueprint(raw, 0);
  const zone = ZONES[blueprint.zone] || ZONES.ashen;
  const palette = zone.palette;
  const scaleX = width / WORLD_W;
  const scaleY = height / MAP_EDITOR_WORLD_H;
  const selected = Number.isInteger(options.selected) ? options.selected : -1;
  const pending = options.pending || null;

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, palette.top || '#0c0a09');
  sky.addColorStop(0.55, palette.mid || '#1b1410');
  sky.addColorStop(1, palette.low || '#2a1a11');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Grid: one cell per 100 world units.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= WORLD_W; x += 100) {
    const px = Math.round(x * scaleX) + 0.5;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
    ctx.stroke();
  }
  for (let y = 0; y <= MAP_EDITOR_WORLD_H; y += 100) {
    const py = Math.round(y * scaleY) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(width, py);
    ctx.stroke();
  }

  const drawPlatform = (platform, active, ghost) => {
    const x = platform.x * scaleX;
    const y = platform.y * scaleY;
    const w = Math.max(2, platform.w * scaleX);
    const h = Math.max(3, platform.h * scaleY);
    ctx.fillStyle = ghost ? 'rgba(229, 182, 120, 0.28)' : active ? 'rgba(229, 182, 120, 0.9)' : 'rgba(176, 137, 96, 0.62)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = active ? '#f6d7a8' : 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = active ? 2 : 1;
    ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.max(1, Math.round(w) - 1), Math.max(1, Math.round(h) - 1));
  };

  blueprint.platforms.forEach((platform, index) => drawPlatform(platform, index === selected, false));
  if (pending) drawPlatform(pending, false, true);

  // Spawn.
  const spawn = spawnForBlueprint();
  ctx.fillStyle = '#8fd8a0';
  ctx.beginPath();
  ctx.arc(spawn.x * scaleX, (spawn.y + 40) * scaleY, Math.max(3, 6 * scaleX), 0, Math.PI * 2);
  ctx.fill();

  // Exit gate.
  const gateX = 1362 * scaleX;
  const gateY = 286 * scaleY;
  ctx.strokeStyle = 'rgba(240, 214, 176, 0.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(gateX, gateY, Math.max(3, 34 * scaleX), Math.max(6, 184 * scaleY));

  // Checkpoint.
  if (blueprint.checkpoint) {
    ctx.fillStyle = 'rgba(240, 170, 90, 0.75)';
    ctx.fillRect(88 * scaleX, (FLOOR_Y - 78) * scaleY, Math.max(2, 38 * scaleX), Math.max(3, 78 * scaleY));
  }

  // Roster: one dot per enemy, resting on the highest platform under its x.
  // Elites are bigger and ringed in gold so a heavy roster reads at a glance.
  for (const enemy of blueprint.enemies) {
    const ground = groundYFor(blueprint.platforms, enemy.x, spawn.y) ?? FLOOR_Y;
    const info = ALL_ENEMY_INFO[enemy.type] || {};
    const base = clamp(3 + Math.sqrt(Math.max(20, info.hp || 40)) * 0.28, 3, 9) * scaleX * 1.4;
    const radius = enemy.elite ? base * 1.35 : base;
    const cx = enemy.x * scaleX;
    const cy = ground * scaleY - radius;
    ctx.fillStyle = enemy.elite ? 'rgba(226, 168, 84, 0.95)' : 'rgba(214, 92, 74, 0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    if (enemy.elite) {
      ctx.strokeStyle = 'rgba(246, 215, 168, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Boss marker above the gate.
  if (blueprint.boss) {
    const cx = 1240 * scaleX;
    const cy = 300 * scaleY;
    const size = Math.max(6, 14 * scaleX);
    ctx.fillStyle = 'rgba(226, 138, 84, 0.95)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size, cy);
    ctx.closePath();
    ctx.fill();
  }

  // Objective bar: full width for a survival timer, a thin rule for a clear.
  const barY = Math.max(4, 6 * scaleY);
  const barH = Math.max(3, 7 * scaleY);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, barY, width, barH);
  const share = blueprint.objective === 'survive'
    ? clamp((blueprint.surviveSeconds - MAP_EDITOR_SURVIVE_MIN) / (MAP_EDITOR_SURVIVE_MAX - MAP_EDITOR_SURVIVE_MIN), 0.08, 1)
    : 0;
  if (share > 0) {
    ctx.fillStyle = 'rgba(140, 208, 216, 0.9)';
    ctx.fillRect(0, barY, width * share, barH);
  }

  // Glow vignette so the frame reads as a stage, not a diagram.
  const glow = ctx.createRadialGradient(width * 0.5, height * 0.65, 0, width * 0.5, height * 0.65, width * 0.75);
  glow.addColorStop(0, 'rgba(0, 0, 0, 0)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}
