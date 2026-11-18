// Ashen Vow — INFINITE REALMS
// Pure, deterministic data and simulations for the six expansion modes,
// campaign/stage catalogues, and Stage Access rules. No DOM or audio.
import { ALL_ROOMS, ALL_ENEMY_INFO, ALL_BOSS_INFO, ROOMS } from './core.js';
import {
  ASTRAL_ROOMS,
  ASTRAL_REGION_COUNT,
  ASTRAL_REGIONS,
  ASTRAL_BOSS_BY_ID,
  ASTRAL_ENEMY_INFO,
} from './astral.js';

export const REALMS_VERSION = '1.0.0';
export const REALM_TOTAL_MODES = 6;

const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);
const asInt = (value, fallback = 0) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
};
const round1 = (value) => Math.round((Number(value) || 0) * 10) / 10;

function makeRng(seed) {
  let state = (Number(seed) >>> 0) || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── mode catalogue ─────────────────────────────────────────────────────────
export const REALM_DIFFICULTIES = [
  { id: 'easy', name: 'EASY', localName: 'Mudah', hp: 0.8, damage: 0.8, reward: 0.8, desc: 'Untuk mengenal aturan baru.' },
  { id: 'normal', name: 'NORMAL', localName: 'Normal', hp: 1, damage: 1, reward: 1, desc: 'Pengalaman yang disarankan.' },
  { id: 'hard', name: 'HARD', localName: 'Sulit', hp: 1.25, damage: 1.2, reward: 1.25, desc: 'Musuh lebih cepat dan reward lebih besar.' },
  { id: 'nightmare', name: 'NIGHTMARE', localName: 'Mimpi Buruk', hp: 1.6, damage: 1.5, reward: 1.6, desc: 'Hanya untuk yang menguasai mode.' },
];
export const REALM_DIFFICULTY_BY_ID = Object.fromEntries(REALM_DIFFICULTIES.map((entry) => [entry.id, entry]));

export const REALM_MODES = [
  {
    id: 'riftfall',
    name: 'Riftfall',
    localName: 'Kejatuhan Celah',
    subtitle: 'Dimensional Survival',
    glyph: '◈',
    color: '#b78cff',
    accent: '#e0c8ff',
    tagline: 'Arena berganti setiap gelombang. Kau hanya bertahan.',
    desc: 'Bertahan di dimensi yang tidak stabil. Setiap gelombang mengubah arena, menambah hazard, dan mengirim elite serta bos.',
    loop: '10 gelombang · arena berubah · upgrade sementara · bos di gelombang 5 dan 10',
    objective: 'Survive 10 waves',
    rewardId: 'riftbound_armor',
    rewardName: 'Riftbound Armor',
    cosmeticId: 'skin_riftbound_armor',
    controls: 'A/D gerak · W/S naik-turun · J serang otomatis · SHIFT dash · Space gelombang',
    minWave: 10,
    minScore: 2000,
    unlock: 'Selalu terbuka',
  },
  {
    id: 'relic_expedition',
    name: 'Relic Expedition',
    localName: 'Ekspedisi Relik',
    subtitle: 'Treasure Hunting',
    glyph: '✦',
    color: '#e0b56a',
    accent: '#ffe7b0',
    tagline: 'Ambil sebanyak mungkin. Keluar sebelum keserakahan menguburmu.',
    desc: 'Jelajahi reruntuhan bercabang, pilih rute, temukan relik kuno, dan putuskan kapan harus ekstraksi.',
    loop: '5 lapis rute · combat/trap/puzzle/treasure · relik kombinasi · ekstraksi lebih awal',
    objective: 'Extract with at least 3 relics',
    rewardId: 'ancient_relic_cache',
    rewardName: 'Ancient Relic Cache',
    cosmeticId: 'skin_relic_explorer',
    controls: 'Pilih simpul rute · EKSTRAKSI kapan saja setelah lapis 2',
    minRelics: 3,
    minScore: 800,
    unlock: 'Selalu terbuka',
  },
  {
    id: 'last_bastion',
    name: 'Last Bastion',
    localName: 'Benteng Terakhir',
    subtitle: 'Kingdom Defense',
    glyph: '⛨',
    color: '#8fc7e8',
    accent: '#d8f4ff',
    tagline: 'Tiga jalur. Satu mahkota. Tidak ada jalan mundur.',
    desc: 'Pertahankan benteng pusat melawan invasi multi-jalur. Bangun menara, pasang jebakan, dan kerahkan hero.',
    loop: '3 jalur · menara & hero · 10 gelombang · siege boss',
    objective: 'Defend the fortress for 10 waves',
    rewardId: 'fortress_sigil',
    rewardName: 'Fortress Sigil',
    cosmeticId: 'skin_fortress_warden',
    controls: 'Pilih jalur · bangun menara · kerahkan hero · J ability',
    minWave: 10,
    minScore: 1200,
    unlock: 'Selalu terbuka',
  },
  {
    id: 'echo_maze',
    name: 'Echo Maze',
    localName: 'Labirin Gema',
    subtitle: 'Living Labyrinth',
    glyph: '⌘',
    color: '#99d6a4',
    accent: '#dbffdf',
    tagline: 'Labirin mengingat setiap langkahmu — lalu mengubah dindingnya.',
    desc: 'Cari tiga kunci, hindari Pursuer, dan capai pintu keluar sebelum labirin menutup jalannya.',
    loop: 'Grid berubah · 3 kunci · pursuer · escape · secret ending',
    objective: 'Collect 3 keys and escape',
    rewardId: 'labyrinth_key',
    rewardName: 'Labyrinth Key',
    cosmeticId: 'skin_maze_walker',
    controls: 'WASD / panah · E interaksi · dinding bergeser tiap 8 langkah',
    minKeys: 3,
    minScore: 600,
    unlock: 'Selalu terbuka',
  },
  {
    id: 'shadow_duel',
    name: 'Shadow Duel',
    localName: 'Duel Bayangan',
    subtitle: 'Mirror Combat',
    glyph: '⚔',
    color: '#e8a0a0',
    accent: '#ffdada',
    tagline: 'Lawannya adalah dirimu yang tidak pernah kau pilih.',
    desc: 'Duel taktis melawan salinan kelasmu. Baca telegraph, patahkan guard, dan susun build mirror.',
    loop: 'Turn-based duel · 8 ronde · stamina · counter · performance score',
    objective: 'Defeat your shadow',
    rewardId: 'mirror_edge',
    rewardName: 'Mirror Edge',
    cosmeticId: 'skin_mirror_duelist',
    controls: '1 serang · 2 heavy · 3 guard · 4 counter · 5 feint',
    minScore: 900,
    unlock: 'Selalu terbuka',
  },
  {
    id: 'chrono_fracture',
    name: 'Chrono Fracture',
    localName: 'Fraktur Krono',
    subtitle: 'Timeline Challenges',
    glyph: '◷',
    color: '#9ad8e0',
    accent: '#d8fbff',
    tagline: 'Waktu bukan garis. Ia adalah ruangan yang bisa kau pecahkan.',
    desc: 'Aktifkan lima anchor waktu dalam tiga loop. Cooldown bisa dibalik, dan setiap detik mengulang masa lalu.',
    loop: '3 loop · 5 anchor · timer · reverse cooldown · alternate formations',
    objective: 'Activate 5 anchors within 3 loops',
    rewardId: 'chrono_armor',
    rewardName: 'Chrono Armor',
    cosmeticId: 'skin_chrono_warden',
    controls: 'A/D gerak · E aktifkan anchor · Space pulse (menambah waktu)',
    minAnchors: 5,
    minScore: 500,
    unlock: 'Selalu terbuka',
  },
];
export const REALM_MODE_BY_ID = Object.fromEntries(REALM_MODES.map((mode) => [mode.id, mode]));

export const REALM_REWARDS = REALM_MODES.map((mode) => ({
  id: mode.rewardId,
  modeId: mode.id,
  name: mode.rewardName,
  cosmeticId: mode.cosmeticId,
  exclusive: true,
  desc: `Hadiah eksklusif ${mode.name}; hanya diberikan setelah hasil run divalidasi server.`,
}));
export const REALM_REWARD_BY_ID = Object.fromEntries(REALM_REWARDS.map((reward) => [reward.id, reward]));

// ── Riftfall data ──────────────────────────────────────────────────────────
const RIFT_ENEMIES = [
  { id: 'rift_mote', name: 'Rift Mote', hp: 28, speed: 72, damage: 5, glyph: '·', color: '#b9a6ff' },
  { id: 'rift_hound', name: 'Rift Hound', hp: 48, speed: 116, damage: 8, glyph: '◆', color: '#e0a06a' },
  { id: 'rift_brute', name: 'Rift Brute', hp: 110, speed: 58, damage: 13, glyph: '●', color: '#9a7ad8' },
  { id: 'rift_wisp', name: 'Rift Wisp', hp: 66, speed: 92, damage: 10, glyph: '✦', color: '#8ee8e0' },
  { id: 'rift_champion', name: 'Rift Champion', hp: 260, speed: 78, damage: 20, glyph: '✹', color: '#ffd166', elite: true },
  { id: 'rift_maw', name: 'The Rift Maw', hp: 900, speed: 46, damage: 24, glyph: '♛', color: '#d88cff', boss: true },
  { id: 'rift_sovereign', name: 'The Rift Sovereign', hp: 1800, speed: 52, damage: 30, glyph: '♚', color: '#ffbd6a', boss: true },
];
const RIFT_ENEMY_BY_ID = Object.fromEntries(RIFT_ENEMIES.map((enemy) => [enemy.id, enemy]));
const RIFT_UPGRADES = [
  { id: 'edge', name: 'Rift Edge', desc: '+35% auto-attack damage', apply: (run) => { run.player.damage *= 1.35; } },
  { id: 'vitality', name: 'Vitality Echo', desc: '+30 max HP and heal', apply: (run) => { run.player.maxHp += 30; run.player.hp = Math.min(run.player.maxHp, run.player.hp + 30); } },
  { id: 'haste', name: 'Fractured Haste', desc: '+18% movement speed', apply: (run) => { run.player.speed *= 1.18; } },
  { id: 'reach', name: 'Long Reach', desc: '+25% attack range', apply: (run) => { run.player.range *= 1.25; } },
  { id: 'phase', name: 'Phase Skin', desc: 'Dash cooldown halved', apply: (run) => { run.player.dashMax *= 0.5; } },
  { id: 'leech', name: 'Rift Leech', desc: 'Heal 2 HP per kill', apply: (run) => { run.player.leech += 2; } },
];

// ── construction ───────────────────────────────────────────────────────────
function seededId(seed, index) {
  return `r${seed.toString(36)}${index.toString(36)}`;
}

function baseRun(modeId, options = {}) {
  const mode = REALM_MODE_BY_ID[modeId] || REALM_MODES[0];
  const seed = Math.max(1, asInt(options.seed, Date.now()));
  const difficulty = REALM_DIFFICULTY_BY_ID[options.difficulty] ? options.difficulty : 'normal';
  return {
    version: 1,
    id: seededId(seed, Math.floor(seed % 997)),
    modeId: mode.id,
    modeName: mode.name,
    seed,
    difficulty,
    classId: options.classId || 'sera',
    party: Math.max(1, Math.min(4, asInt(options.party, 1))),
    phase: 'playing',
    time: 0,
    score: 0,
    result: null,
    objectives: [],
    completed: false,
    log: [],
    rewardClaimed: false,
    rng: makeRng(seed),
    nextId: 1,
    lastAction: '',
  };
}

export function createRealmRun(modeId, options = {}) {
  const run = baseRun(modeId, options);
  const diff = REALM_DIFFICULTY_BY_ID[run.difficulty];
  if (run.modeId === 'riftfall') {
    run.player = {
      x: 480, y: 430, hp: Math.round(120 * diff.hp), maxHp: Math.round(120 * diff.hp),
      speed: 230, damage: 26, range: 260, dash: 0, dashMax: 2.2, attackCd: 0.55, leech: 0,
    };
    run.wave = 0;
    run.waveTotal = 10;
    run.waveState = 'intermission';
    run.waveTimer = 2.2;
    run.enemies = [];
    run.hazard = 'stable';
    run.hazardTimer = 4;
    run.upgrades = [];
    run.upgradeChoices = [];
    run.eliteKills = 0;
    run.bossKills = 0;
    run.maxWave = 0;
  } else if (run.modeId === 'relic_expedition') {
    run.player = { hp: Math.round(100 * diff.hp), maxHp: Math.round(100 * diff.hp), power: 12, guard: 0 };
    run.layer = 1;
    run.maxLayer = 5;
    run.relics = [];
    run.alarm = 0;
    run.choices = [];
    run.extracted = false;
    run.secretRooms = 0;
    run.traps = 0;
    run.puzzles = 0;
    run.generateChoices = true;
  } else if (run.modeId === 'last_bastion') {
    run.castle = { hp: Math.round(140 * diff.hp), maxHp: Math.round(140 * diff.hp) };
    run.gold = 180;
    run.wave = 0;
    run.waveTotal = 10;
    run.waveState = 'prep';
    run.waveTimer = 3;
    run.lane = 1;
    run.lanes = [0, 1, 2].map((id) => ({ id, name: `LANE ${id + 1}`, tower: 0, hero: false, pressure: 0 }));
    run.towers = [];
    run.heroes = [];
    run.enemies = [];
    run.spawnQueue = [];
    run.spawnTimer = 0;
    run.bossKills = 0;
    run.heroCool = 0;
    run.abilityCool = 0;
  } else if (run.modeId === 'echo_maze') {
    run.size = 9;
    run.player = { x: 1, y: 7, hp: Math.round(100 * diff.hp), maxHp: Math.round(100 * diff.hp) };
    run.keys = 0;
    run.keysNeeded = 3;
    run.steps = 0;
    run.pursuer = { x: 7, y: 1, timer: 0 };
    run.walls = new Set();
    run.keyCells = [];
    run.exit = { x: 7, y: 7 };
    run.shiftAt = 8;
    run.secret = false;
    run.generateMaze = true;
    generateMaze(run);
  } else if (run.modeId === 'shadow_duel') {
    run.player = { hp: Math.round(100 * diff.hp), maxHp: Math.round(100 * diff.hp), stamina: 4, guard: 0, combo: 0, feint: false };
    run.shadow = { hp: Math.round(100 * diff.hp), maxHp: Math.round(100 * diff.hp), intent: 'attack', guard: 0 };
    run.round = 1;
    run.maxRounds = 8;
    run.telegraph = 'attack';
    run.log = [];
    run.perfects = 0;
    run.counters = 0;
    run.build = options.build || 'balanced';
  } else {
    run.player = { x: 110, y: 450, hp: Math.round(100 * diff.hp), maxHp: Math.round(100 * diff.hp), speed: 235 };
    run.anchors = [0, 1, 2, 3, 4].map((index) => ({
      id: index,
      x: 110 + index * 180,
      y: 350 + (index % 3) * 40,
      active: false,
    }));
    run.timeLimit = 30;
    run.timeLeft = run.timeLimit;
    run.loops = 3;
    run.maxLoops = 3;
    run.pulse = 8;
    run.reverse = false;
    run.activated = 0;
    run.maxAnchor = 0;
  }
  if (options.party > 1) {
    run.partyMembers = Array.from({ length: run.party - 1 }, (_, index) => ({
      id: `party${index + 2}`,
      name: `Echo ${index + 2}`,
      hp: run.player?.maxHp || 100,
      maxHp: run.player?.maxHp || 100,
    }));
  }
  if (run.modeId === 'relic_expedition') run.choices = relicChoices(run);
  run.log.push({ text: `${run.modeName} dimulai — ${diff.name}.`, color: '#e8d6b0' });
  return run;
}

// ── utility ────────────────────────────────────────────────────────────────
function pushLog(run, text, color = '#d8c9aa') {
  run.log.push({ text, color, at: round1(run.time) });
  if (run.log.length > 8) run.log.shift();
}

function endRun(run, result) {
  if (run.phase === 'ended') return run;
  run.phase = 'ended';
  run.result = result;
  run.completed = result === 'victory';
  run.objectives = realmObjectives(run);
  return run;
}

function aliveEnemies(run) {
  return run.enemies.filter((enemy) => enemy.hp > 0);
}

function addScore(run, amount) {
  run.score += Math.max(0, Math.round(Number(amount) || 0));
}

// ── Riftfall ───────────────────────────────────────────────────────────────
function riftSpawnWave(run) {
  run.wave += 1;
  run.maxWave = Math.max(run.maxWave, run.wave);
  run.waveState = 'wave';
  run.hazard = ['stable', 'meteor', 'frost', 'void'][run.wave % 4];
  run.hazardTimer = 4.5;
  const diff = REALM_DIFFICULTY_BY_ID[run.difficulty];
  const count = 3 + run.wave;
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const id = run.wave % 3 === 0 && i === 0 ? 'rift_brute' : RIFT_ENEMIES[(run.wave + i) % 4].id;
    const def = RIFT_ENEMY_BY_ID[id];
    list.push({
      id: run.nextId++, type: id, ...def,
      hp: Math.round(def.hp * diff.hp * (1 + run.wave * 0.08)),
      maxHp: Math.round(def.hp * diff.hp * (1 + run.wave * 0.08)),
      x: 80 + ((i * 113 + run.wave * 47) % 800),
      y: 110 + ((i * 71 + run.wave * 29) % 310),
      damage: Math.round(def.damage * diff.damage),
      hitTimer: 0,
    });
  }
  const bossId = run.wave === 10 ? 'rift_sovereign' : run.wave === 5 ? 'rift_maw' : null;
  if (bossId) {
    const def = RIFT_ENEMY_BY_ID[bossId];
    list.push({
      id: run.nextId++, type: bossId, ...def,
      hp: Math.round(def.hp * diff.hp),
      maxHp: Math.round(def.hp * diff.hp),
      x: 480, y: 310, damage: Math.round(def.damage * diff.damage), hitTimer: 0,
    });
  } else if (run.wave === 3 || run.wave === 7) {
    const def = RIFT_ENEMY_BY_ID.rift_champion;
    list.push({
      id: run.nextId++, type: def.id, ...def,
      hp: Math.round(def.hp * diff.hp), maxHp: Math.round(def.hp * diff.hp),
      x: 480, y: 220, damage: Math.round(def.damage * diff.damage), hitTimer: 0, elite: true,
    });
  }
  run.enemies = list;
  pushLog(run, `GELOMBANG ${run.wave}: ${run.hazard.toUpperCase()} — ${list.length} entitas.`, '#c8a6ff');
}

function riftUpdate(run, dt, input) {
  run.time += dt;
  if (run.phase === 'upgrade') return;
  if (run.waveState === 'intermission') {
    run.waveTimer -= dt;
    if (run.waveTimer <= 0) riftSpawnWave(run);
    return;
  }
  if (run.phase !== 'playing') return;
  const p = run.player;
  const speed = p.speed * (input.left || input.right ? 1 : 1);
  const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  p.x = clamp(p.x + dx * speed * dt, 24, 936);
  p.y = clamp(p.y + dy * speed * dt, 90, 490);
  p.dash = Math.max(0, p.dash - dt);
  if (input.dash && p.dash <= 0) {
    p.dash = p.dashMax;
    p.x = clamp(p.x + (dx || 1) * 90, 20, 940);
  }
  p.attackCd = Math.max(0, p.attackCd - dt);
  let target = null;
  let best = p.range;
  for (const enemy of aliveEnemies(run)) {
    const distance = Math.hypot(enemy.x - p.x, enemy.y - p.y);
    if (distance < best) { best = distance; target = enemy; }
  }
  if (target && p.attackCd <= 0) {
    p.attackCd = 0.55;
    target.hp -= p.damage;
    target.hitTimer = 0.14;
    addScore(run, target.hp <= 0 ? 40 : 8);
    if (target.hp <= 0) {
      p.hp = Math.min(p.maxHp, p.hp + p.leech);
      if (target.elite) run.eliteKills += 1;
      if (target.boss) run.bossKills += 1;
      pushLog(run, `${target.name} hancur.`, target.color);
    }
  }
  for (const enemy of aliveEnemies(run)) {
    enemy.hitTimer = Math.max(0, (enemy.hitTimer || 0) - dt);
    const ex = p.x - enemy.x;
    const ey = p.y - enemy.y;
    const distance = Math.hypot(ex, ey) || 1;
    const move = enemy.speed * dt;
    enemy.x += (ex / distance) * move;
    enemy.y += (ey / distance) * move;
    enemy.hitTimer = Math.max(0, enemy.hitTimer - dt);
    if (distance < 26 && (enemy.hitTimer || 0) <= 0) {
      p.hp = Math.max(0, p.hp - enemy.damage);
      enemy.hitTimer = 0.8;
      if (p.hp <= 0) { endRun(run, 'defeat'); return; }
    }
  }
  run.enemies = run.enemies.filter((enemy) => enemy.hp > 0);
  run.hazardTimer -= dt;
  if (run.hazardTimer <= 0) {
    run.hazardTimer = 4.5;
    if (run.hazard === 'meteor' && p.dash <= 0.3) {
      p.hp = Math.max(0, p.hp - Math.round(8 * REALM_DIFFICULTY_BY_ID[run.difficulty].damage));
      pushLog(run, 'Meteor rift menghantam arena.', '#ff9d8a');
    } else if (run.hazard === 'frost') {
      p.speed = Math.max(120, p.speed * 0.94);
    } else if (run.hazard === 'void') {
      p.x = clamp(p.x + (run.rng() > 0.5 ? 55 : -55), 24, 936);
      pushLog(run, 'Void anomaly memindahkanmu.', '#c8a6ff');
    }
    if (p.hp <= 0) { endRun(run, 'defeat'); return; }
  }
  if (!aliveEnemies(run).length) {
    addScore(run, 250 + run.wave * 45);
    if (run.wave >= run.waveTotal) {
      addScore(run, 1200);
      endRun(run, 'victory');
      pushLog(run, 'SEPULUH GELOMBANG SELESAI. Celah menutup.', '#ffe4a8');
      return;
    }
    run.phase = 'upgrade';
    run.upgradeChoices = [...RIFT_UPGRADES].sort(() => run.rng() - 0.5).slice(0, 3);
    pushLog(run, 'Pilih satu upgrade sementara.', '#f0d48a');
  }
}

// ── Relic Expedition ───────────────────────────────────────────────────────
function relicChoices(run) {
  const rng = makeRng(run.seed + run.layer * 71);
  const pool = ['combat', 'trap', 'puzzle', 'treasure', 'combat', 'hidden'];
  const list = [];
  for (let i = 0; i < 3; i += 1) {
    const type = run.layer >= 4 ? 'extraction' : pool[Math.floor(rng() * pool.length)];
    const value = 1 + Math.floor(rng() * 3);
    list.push({
      id: `${run.layer}-${i}`,
      type,
      name: type === 'extraction' ? 'PINTU EKSTRAKSI' : type === 'combat' ? 'Reruntuhan Penjaga' : type === 'trap' ? 'Koridor Jebakan' : type === 'puzzle' ? 'Segel Kuno' : type === 'hidden' ? 'Relung Tersembunyi' : 'Peti Relik',
      desc: type === 'combat' ? `Penjaga lapis ${run.layer}; hadiah relik.` : type === 'trap' ? 'Kehilangan HP atau alarm.' : type === 'puzzle' ? 'Tantangan kuno; hadiah relik.' : type === 'hidden' ? 'Risiko tinggi, relik langka.' : type === 'extraction' ? 'Bawa semua relik keluar.' : 'Relik aman.',
      glyph: type === 'combat' ? '⚔' : type === 'trap' ? '⚠' : type === 'puzzle' ? '⌘' : type === 'hidden' ? '◈' : type === 'extraction' ? '⇥' : '✦',
    });
  }
  return list;
}

function relicChoose(run, index) {
  const choice = run.choices[index];
  if (!choice || run.phase !== 'playing') return false;
  run.lastAction = choice.type;
  const diff = REALM_DIFFICULTY_BY_ID[run.difficulty];
  if (choice.type === 'extraction') {
    return relicExtract(run);
  }
  if (choice.type === 'combat') {
    const take = Math.round((10 + run.layer * 4) * diff.damage - run.player.power * 0.25);
    run.player.hp = Math.max(0, run.player.hp - Math.max(2, take));
    run.relics.push({ id: `relic_${run.layer}_${index}`, name: `Relic ${run.relics.length + 1}`, value: 80 + run.layer * 30 });
    addScore(run, 120 + run.layer * 25);
    pushLog(run, `Penjaga lapis ${run.layer} gugur. Relik ditemukan.`, '#e8c480');
  } else if (choice.type === 'trap') {
    run.traps += 1;
    run.player.hp = Math.max(0, run.player.hp - Math.round((4 + run.layer * 2) * diff.damage));
    run.alarm += 1;
    addScore(run, 40);
    pushLog(run, 'Jebakan kuno melukai dan menaikkan alarm.', '#ff9d8a');
  } else if (choice.type === 'puzzle') {
    const success = (run.seed + run.layer * 11 + index * 7) % 100 < 72;
    if (success) {
      run.puzzles += 1;
      run.relics.push({ id: `relic_p_${run.layer}_${index}`, name: `Astral Relic ${run.relics.length + 1}`, value: 110 + run.layer * 35 });
      addScore(run, 160);
      pushLog(run, 'Segel kuno terbuka; relik bercahaya muncul.', '#b8e8ff');
    } else {
      run.player.hp = Math.max(0, run.player.hp - Math.round(8 * diff.damage));
      pushLog(run, 'Segel menolakmu. Cahaya menyayat lengan.', '#ff9d8a');
    }
  } else if (choice.type === 'hidden') {
    const success = (run.seed + run.layer * 23 + index) % 100 < 55;
    if (success) {
      run.secretRooms += 1;
      run.relics.push({ id: `relic_h_${run.layer}_${index}`, name: `Hidden Relic ${run.relics.length + 1}`, value: 180 + run.layer * 45 });
      addScore(run, 260);
      pushLog(run, 'Relung tersembunyi terbuka — relik kuno!', '#b8a0ff');
    } else {
      run.player.hp = Math.max(0, run.player.hp - Math.round(12 * diff.damage));
      run.alarm += 2;
      pushLog(run, 'Jebakan tersembunyi. Alarm menjerit.', '#ff8a8a');
    }
  } else {
    run.relics.push({ id: `relic_t_${run.layer}_${index}`, name: `Relic ${run.relics.length + 1}`, value: 90 + run.layer * 30 });
    addScore(run, 100);
    pushLog(run, 'Peti relik terbuka tanpa perlawanan.', '#e8c480');
  }
  run.layer += 1;
  if (run.player.hp <= 0) { endRun(run, 'defeat'); return true; }
  if (run.layer >= run.maxLayer) {
    run.choices = relicChoices(run);
    return true;
  }
  run.choices = relicChoices(run);
  return true;
}

function relicExtract(run) {
  if (run.relics.length < 1) {
    pushLog(run, 'Tidak ada relik untuk diekstrak.', '#ff9d8a');
    return false;
  }
  run.extracted = true;
  const bonus = run.relics.reduce((sum, relic) => sum + relic.value, 0) + run.secretRooms * 80;
  addScore(run, bonus + Math.max(0, 300 - run.alarm * 40));
  endRun(run, 'victory');
  pushLog(run, `EKSTRAKSI BERHASIL — ${run.relics.length} relik diselamatkan.`, '#ffe4a8');
  return true;
}

// ── Last Bastion ───────────────────────────────────────────────────────────
const BASTION_TOWERS = [
  { id: 'bulwark', name: 'Bulwark', cost: 55, damage: 10, color: '#9fc8e8' },
  { id: 'flame', name: 'Flame Keep', cost: 80, damage: 17, splash: true, color: '#f0a060' },
  { id: 'frost', name: 'Frost Spire', cost: 70, damage: 8, slow: true, color: '#8ee8e0' },
];
const BASTION_TOWER_BY_ID = Object.fromEntries(BASTION_TOWERS.map((tower) => [tower.id, tower]));

function bastionStartWave(run) {
  run.wave += 1;
  run.waveState = 'wave';
  run.spawnTimer = 0;
  const count = 4 + run.wave;
  run.spawnQueue = Array.from({ length: count * 3 }, (_, index) => ({
    at: index * 0.45,
    lane: index % 3,
    hp: Math.round((34 + run.wave * 14) * REALM_DIFFICULTY_BY_ID[run.difficulty].hp),
    speed: 0.07 + run.wave * 0.004,
  }));
  if (run.wave === 10) {
    run.spawnQueue.push({ at: 2, lane: 1, hp: 2200, speed: 0.028, boss: true, name: 'Siege Colossus' });
  }
  run.enemies = [];
  pushLog(run, `GELOMBANG ${run.wave} — tiga jalur bergerak.`, '#b8e0ff');
}

function bastionUpdate(run, dt) {
  run.time += dt;
  if (run.phase === 'prep') {
    run.waveTimer -= dt;
    if (run.waveTimer <= 0) bastionStartWave(run);
    return;
  }
  if (run.phase !== 'playing') return;
  run.spawnTimer += dt;
  while (run.spawnQueue.length && run.spawnQueue[0].at <= run.spawnTimer) {
    const spawn = run.spawnQueue.shift();
    run.enemies.push({
      id: run.nextId++, lane: spawn.lane, progress: 0, hp: spawn.hp, maxHp: spawn.hp,
      speed: spawn.speed, boss: !!spawn.boss, name: spawn.name || 'Rift Raider', slow: 0,
    });
  }
  for (const tower of run.towers) {
    tower.cd = (tower.cd || 0) - dt;
    if (tower.cd > 0) continue;
    const target = run.enemies.find((enemy) => enemy.lane === tower.lane && enemy.progress < 1 && enemy.hp > 0);
    if (!target) continue;
    tower.cd = tower.def.slow ? 0.85 : tower.def.splash ? 1.1 : 0.7;
    target.hp -= tower.def.damage * (1 + tower.level * 0.55);
    if (tower.def.slow) target.slow = Math.max(target.slow, 0.8);
    if (target.hp <= 0) {
      addScore(run, target.boss ? 600 : 30);
      if (target.boss) run.bossKills += 1;
      run.gold += target.boss ? 60 : 7;
      pushLog(run, `${target.name} dihentikan di jalur ${target.lane + 1}.`, '#b8e8c0');
    }
  }
  for (const hero of run.heroes) {
    hero.cd -= dt;
    if (hero.cd > 0) continue;
    const target = run.enemies.find((enemy) => enemy.lane === hero.lane && enemy.progress < 1);
    if (!target) continue;
    hero.cd = 2.2;
    target.hp -= 25 + hero.level * 10;
    addScore(run, target.hp <= 0 ? 50 : 10);
  }
  run.abilityCool = Math.max(0, run.abilityCool - dt);
  run.heroCool = Math.max(0, run.heroCool - dt);
  for (const enemy of run.enemies) {
    enemy.slow = Math.max(0, enemy.slow - dt);
    enemy.progress += enemy.speed * (enemy.slow > 0 ? 0.55 : 1) * dt;
    if (enemy.progress >= 1 && enemy.hp > 0) {
      enemy.hp = 0;
      run.castle.hp = Math.max(0, run.castle.hp - (enemy.boss ? 36 : 7));
      addScore(run, 0);
      pushLog(run, `Gerbang bocor — ${enemy.boss ? 36 : 7} damage kastil.`, '#ff9d8a');
    }
  }
  run.enemies = run.enemies.filter((enemy) => enemy.hp > 0);
  if (run.castle.hp <= 0) { endRun(run, 'defeat'); return; }
  if (!run.spawnQueue.length && !run.enemies.length) {
    addScore(run, 260 + run.wave * 60);
    if (run.wave >= run.waveTotal) {
      addScore(run, 900);
      endRun(run, 'victory');
      pushLog(run, 'BENTENG BERTAHAN. Sepuluh gelombang hancur.', '#ffe4a8');
      return;
    }
    run.waveState = 'prep';
    run.waveTimer = 3.2;
    run.gold += 35;
  }
}

function bastionBuild(run, typeId, laneId) {
  const def = BASTION_TOWER_BY_ID[typeId];
  const lane = clamp(asInt(laneId, run.lane), 0, 2);
  if (!def || run.phase !== 'playing' && run.phase !== 'prep') return false;
  if (run.gold < def.cost) { pushLog(run, 'Emas tidak cukup untuk menara.', '#ff9d8a'); return false; }
  const existing = run.towers.filter((tower) => tower.lane === lane);
  if (existing.length >= 2) { pushLog(run, 'Jalur itu sudah penuh.', '#ff9d8a'); return false; }
  run.gold -= def.cost;
  run.towers.push({ id: run.nextId++, lane, type: def.id, def, level: 1, cd: 0 });
  run.lanes[lane].tower = existing.length + 1;
  addScore(run, 20);
  pushLog(run, `${def.name} dibangun di jalur ${lane + 1}.`, def.color);
  return true;
}

function bastionUpgrade(run, laneId) {
  const lane = clamp(asInt(laneId, run.lane), 0, 2);
  const tower = run.towers.find((entry) => entry.lane === lane && entry.level < 3);
  const cost = 65 + (tower?.level || 1) * 25;
  if (!tower) return false;
  if (run.gold < cost) { pushLog(run, 'Emas tidak cukup untuk upgrade.', '#ff9d8a'); return false; }
  run.gold -= cost;
  tower.level += 1;
  addScore(run, 35);
  pushLog(run, `Menara jalur ${lane + 1} naik ke level ${tower.level}.`, '#ffe0a0');
  return true;
}

function bastionDeploy(run, laneId) {
  const lane = clamp(asInt(laneId, run.lane), 0, 2);
  if (run.heroes.some((hero) => hero.lane === lane)) return false;
  if (run.gold < 90) { pushLog(run, 'Butuh 90 emas untuk mengerahkan hero.', '#ff9d8a'); return false; }
  run.gold -= 90;
  run.heroes.push({ lane, level: 1, cd: 0 });
  run.lanes[lane].hero = true;
  addScore(run, 50);
  pushLog(run, `Hero dikerahkan ke jalur ${lane + 1}.`, '#b8e8ff');
  return true;
}

// ── Echo Maze ──────────────────────────────────────────────────────────────
function mazeKey(x, y) { return `${x},${y}`; }

function mazeOpen(run, x, y) {
  return x >= 0 && y >= 0 && x < run.size && y < run.size && !run.walls.has(mazeKey(x, y));
}

function mazePathExists(run) {
  const queue = [[run.player.x, run.player.y]];
  const seen = new Set([mazeKey(run.player.x, run.player.y)]);
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === run.exit.x && y === run.exit.y) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (!mazeOpen(run, nx, ny)) continue;
      const id = mazeKey(nx, ny);
      if (seen.has(id)) continue;
      seen.add(id);
      queue.push([nx, ny]);
    }
  }
  return false;
}

function generateMaze(run) {
  run.walls = new Set();
  run.keyCells = [];
  const rng = makeRng(run.seed + 991);
  const candidates = [];
  for (let y = 0; y < run.size; y += 1) {
    for (let x = 0; x < run.size; x += 1) {
      if (x === run.player.x && y === run.player.y) continue;
      if (x === run.exit.x && y === run.exit.y) continue;
      candidates.push([x, y]);
    }
  }
  for (let i = 0; i < 19; i += 1) {
    const cell = candidates.splice(Math.floor(rng() * candidates.length), 1)[0];
    if (cell) run.walls.add(mazeKey(cell[0], cell[1]));
  }
  if (!mazePathExists(run)) run.walls = new Set();
  const keyCandidates = candidates.filter(([x, y]) => Math.abs(x - run.player.x) + Math.abs(y - run.player.y) > 4);
  for (let i = 0; i < 3; i += 1) {
    const cell = keyCandidates.splice(Math.floor(rng() * keyCandidates.length), 1)[0];
    if (cell) run.keyCells.push({ x: cell[0], y: cell[1], taken: false });
  }
  run.generateMaze = false;
}

function mazeShift(run) {
  const rng = makeRng(run.seed + run.steps * 37);
  for (let k = 0; k < 4; k += 1) {
    const candidates = [];
    for (let y = 0; y < run.size; y += 1) {
      for (let x = 0; x < run.size; x += 1) {
        if (Math.abs(x - run.player.x) < 2 && Math.abs(y - run.player.y) < 2) continue;
        if (x === run.exit.x && y === run.exit.y) continue;
        if (run.keyCells.some((key) => !key.taken && key.x === x && key.y === y)) continue;
        if (run.walls.has(mazeKey(x, y))) candidates.push([x, y, 'remove']);
        else candidates.push([x, y, 'add']);
      }
    }
    const pick = candidates[Math.floor(rng() * candidates.length)];
    if (!pick) continue;
    if (pick[2] === 'remove') run.walls.delete(mazeKey(pick[0], pick[1]));
    else {
      run.walls.add(mazeKey(pick[0], pick[1]));
      if (!mazePathExists(run)) run.walls.delete(mazeKey(pick[0], pick[1]));
    }
  }
  pushLog(run, 'DINDING BERGESER — labirin menutup satu jalur.', '#b8ffc8');
}

function mazeStep(run, dx, dy) {
  if (run.phase !== 'playing') return false;
  const nx = run.player.x + dx;
  const ny = run.player.y + dy;
  if (!mazeOpen(run, nx, ny)) { pushLog(run, 'Dinding menolak langkah itu.', '#ff9d8a'); return false; }
  run.player.x = nx;
  run.player.y = ny;
  run.steps += 1;
  const key = run.keyCells.find((cell) => !cell.taken && cell.x === nx && cell.y === ny);
  if (key) { key.taken = true; run.keys += 1; addScore(run, 180); pushLog(run, `Kunci ${run.keys}/3 ditemukan.`, '#b8ffc8'); }
  if (run.steps % run.shiftAt === 0) mazeShift(run);
  run.pursuer.timer += 1;
  if (run.pursuer.timer >= 2) {
    run.pursuer.timer = 0;
    const options = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([mx, my]) => [run.pursuer.x + mx, run.pursuer.y + my])
      .filter(([x, y]) => mazeOpen(run, x, y));
    options.sort((a, b) => Math.hypot(a[0] - nx, a[1] - ny) - Math.hypot(b[0] - nx, b[1] - ny));
    if (options[0]) { run.pursuer.x = options[0][0]; run.pursuer.y = options[0][1]; }
  }
  if (run.pursuer.x === nx && run.pursuer.y === ny) {
    endRun(run, 'defeat');
    pushLog(run, 'PURSUER MENANGKAPMU. Labirin menutup.', '#ff8a8a');
    return true;
  }
  if (nx === run.exit.x && ny === run.exit.y) {
    if (run.keys >= run.keysNeeded) {
      run.secret = run.steps <= 34;
      addScore(run, 450 + run.keys * 100 + (run.secret ? 500 : 0));
      endRun(run, 'victory');
      pushLog(run, run.secret ? 'SECRET ENDING — kau keluar sebelum labirin selesai berubah.' : 'PINTU KELUAR TERBUKA. Kau lolos.', '#ffe4a8');
      return true;
    }
    pushLog(run, `Butuh ${run.keysNeeded - run.keys} kunci lagi.`, '#ff9d8a');
  }
  return true;
}

// ── Shadow Duel ────────────────────────────────────────────────────────────
function shadowIntentFor(run) {
  const table = ['attack', 'attack', 'heavy', 'guard', 'attack', 'counter', 'heavy', 'guard'];
  return table[(run.seed + run.round * 3) % table.length];
}

function shadowDuelAction(run, action) {
  if (run.phase !== 'playing') return false;
  const p = run.player;
  const s = run.shadow;
  const intent = run.telegraph;
  let damage = 0;
  let text = '';
  if (action === 'attack') {
    damage = 12 + p.combo * 2;
    p.stamina = Math.max(0, p.stamina - 1);
    text = `Tebasan cepat — ${damage} damage.`;
  } else if (action === 'heavy') {
    if (p.stamina < 2) { pushLog(run, 'Stamina tidak cukup untuk heavy.', '#ff9d8a'); return false; }
    damage = 24 + p.combo * 3;
    p.stamina -= 2;
    text = `Heavy strike — ${damage} damage.`;
  } else if (action === 'guard') {
    p.guard = 1;
    text = 'Kau mengangkat guard.';
  } else if (action === 'counter') {
    if (intent === 'attack' || intent === 'heavy') {
      damage = 26;
      run.perfects += 1;
      run.counters += 1;
      text = 'PERFECT COUNTER — bayangan terhuyung.';
    } else {
      text = 'Counter meleset; bayangan membaca gerakmu.';
      p.guard = 0;
    }
  } else if (action === 'feint') {
    p.feint = true;
    text = 'Feint disiapkan — serangan berikutnya memotong guard.';
    p.combo += 1;
  }
  if (damage > 0) {
    s.hp = Math.max(0, s.hp - damage);
    p.combo += 1;
    addScore(run, damage * (run.perfects ? 4 : 2));
    if (s.hp <= 0) {
      run.objectives = realmObjectives(run);
      endRun(run, 'victory');
      pushLog(run, 'Bayanganmu hancur. Duel selesai.', '#ffe4a8');
      return true;
    }
  }
  const incoming = intent === 'heavy' ? 22 : intent === 'attack' ? 14 : intent === 'counter' ? 18 : 0;
  const reduced = p.guard ? Math.round(incoming * 0.25) : incoming;
  if (reduced > 0) {
    p.hp = Math.max(0, p.hp - reduced);
    addScore(run, 0);
    text += ` Bayangan membalas ${reduced}.`;
  }
  p.guard = 0;
  if (p.hp <= 0) {
    endRun(run, 'defeat');
    pushLog(run, 'Bayangan menembus guard terakhirmu.', '#ff8a8a');
    return true;
  }
  run.round += 1;
  p.stamina = Math.min(4, p.stamina + 1);
  if (run.round > run.maxRounds) {
    const win = p.hp >= s.hp;
    endRun(run, win ? 'victory' : 'defeat');
    pushLog(run, win ? 'Duel selesai — kau masih berdiri.' : 'Duel selesai — bayangan lebih kuat.', win ? '#ffe4a8' : '#ff8a8a');
    return true;
  }
  run.telegraph = shadowIntentFor(run);
  pushLog(run, text, '#e8d6b0');
  return true;
}

// ── Chrono Fracture ────────────────────────────────────────────────────────
function chronoActivate(run) {
  if (run.phase !== 'playing') return false;
  const anchor = run.anchors.find((entry) => !entry.active && Math.abs(entry.x - run.player.x) < 66);
  if (!anchor) { pushLog(run, 'Tidak ada anchor dalam jangkauan.', '#ff9d8a'); return false; }
  anchor.active = true;
  run.activated += 1;
  run.maxAnchor = Math.max(run.maxAnchor, run.activated);
  addScore(run, 100);
  pushLog(run, `ANCHOR ${run.activated}/5 aktif.`, '#b8f4ff');
  if (run.activated >= 5) {
    endRun(run, 'victory');
    pushLog(run, 'LIMA ANCHOR MENYALA. Fraktur distabilkan.', '#ffe4a8');
    return true;
  }
  return true;
}

function chronoLoop(run) {
  if (run.anchors.every((anchor) => anchor.active)) {
    endRun(run, 'victory');
    return;
  }
  run.loops -= 1;
  if (run.loops <= 0) {
    endRun(run, 'defeat');
    pushLog(run, 'TIGA LOOP HABIS. Waktu menutup fraktur.', '#ff8a8a');
    return;
  }
  run.timeLeft = run.timeLimit;
  run.player.x = 110;
  run.pulse = 8;
  run.reverse = !run.reverse;
  addScore(run, 50);
  pushLog(run, `LOOP ${run.maxLoops - run.loops + 1} — anchor tetap menyala. Waktu kembali.`, '#b8f4ff');
}

function chronoUpdate(run, dt, input) {
  run.time += dt;
  if (run.phase !== 'playing') return;
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  run.player.x = clamp(run.player.x + dir * run.player.speed * (run.reverse ? -1 : 1) * dt, 30, 930);
  run.timeLeft -= dt;
  run.pulse = Math.max(0, run.pulse - dt);
  if (input.jump && run.pulse <= 0) {
    run.pulse = 8;
    run.timeLeft = Math.min(run.timeLimit, run.timeLeft + 4);
    addScore(run, 25);
    pushLog(run, 'PULSE — waktu membengkak empat detik.', '#b8f4ff');
  }
  if (run.timeLeft <= 0) chronoLoop(run);
}

// ── public simulation API ──────────────────────────────────────────────────
export function updateRealmRun(run, dt, input = {}) {
  if (!run || run.phase === 'ended') return run;
  const step = clamp(Number(dt) || 0, 0, 0.08);
  if (!step) return run;
  if (run.modeId === 'riftfall') riftUpdate(run, step, input);
  else if (run.modeId === 'last_bastion') bastionUpdate(run, step);
  else if (run.modeId === 'chrono_fracture') chronoUpdate(run, step, input);
  else run.time += step;
  return run;
}

export function realmAction(run, action, payload = {}) {
  if (!run || run.phase === 'ended') return false;
  if (run.modeId === 'riftfall') {
    if (run.phase === 'upgrade' && action === 'upgrade') {
      const choice = run.upgradeChoices[clamp(asInt(payload.index, 0), 0, 2)];
      if (!choice) return false;
      choice.apply(run);
      run.upgrades.push(choice.id);
      run.phase = 'playing';
      run.waveState = 'intermission';
      run.waveTimer = 2.4;
      run.upgradeChoices = [];
      addScore(run, 80);
      pushLog(run, `UPGRADE: ${choice.name}.`, '#f0d48a');
      return true;
    }
    if (action === 'skip-upgrade' && run.phase === 'upgrade') {
      run.phase = 'playing';
      run.waveState = 'intermission';
      run.waveTimer = 2.4;
      run.upgradeChoices = [];
      return true;
    }
    return false;
  }
  if (run.modeId === 'relic_expedition') {
    if (action === 'choose') return relicChoose(run, clamp(asInt(payload.index, 0), 0, 2));
    if (action === 'extract') return relicExtract(run);
    return false;
  }
  if (run.modeId === 'last_bastion') {
    if (action === 'lane') { run.lane = clamp(asInt(payload.lane, run.lane), 0, 2); return true; }
    if (action === 'build') return bastionBuild(run, payload.type, payload.lane ?? run.lane);
    if (action === 'upgrade') return bastionUpgrade(run, payload.lane ?? run.lane);
    if (action === 'deploy') return bastionDeploy(run, payload.lane ?? run.lane);
    if (action === 'ability' && run.abilityCool <= 0) {
      run.abilityCool = 12;
      for (const enemy of run.enemies) {
        if (enemy.progress > 0.4) enemy.hp -= 45;
      }
      addScore(run, 60);
      pushLog(run, 'SIGNAL FLARE — semua jalur terbakar.', '#ffe0a0');
      return true;
    }
    return false;
  }
  if (run.modeId === 'echo_maze') {
    if (run.generateMaze) generateMaze(run);
    if (action === 'move') return mazeStep(run, clamp(asInt(payload.dx, 0), -1, 1), clamp(asInt(payload.dy, 0), -1, 1));
    if (action === 'interact') return mazeStep(run, 0, 0);
    return false;
  }
  if (run.modeId === 'shadow_duel') {
    return shadowDuelAction(run, action);
  }
  if (run.modeId === 'chrono_fracture') {
    if (action === 'activate') return chronoActivate(run);
    if (action === 'pulse' && run.pulse <= 0) {
      run.pulse = 8;
      run.timeLeft = Math.min(run.timeLimit, run.timeLeft + 4);
      addScore(run, 25);
      pushLog(run, 'PULSE — waktu membengkak empat detik.', '#b8f4ff');
      return true;
    }
    if (action === 'reverse') { run.reverse = !run.reverse; return true; }
    return false;
  }
  return false;
}

export function realmObjectives(run) {
  if (!run) return [];
  if (run.modeId === 'riftfall') {
    return [{ id: 'waves', label: 'Survive 10 waves', value: run.maxWave || 0, target: 10, done: run.maxWave >= 10 }];
  }
  if (run.modeId === 'relic_expedition') {
    return [
      { id: 'relics', label: 'Extract 3 relics', value: run.relics.length, target: 3, done: run.completed && run.relics.length >= 3 },
      { id: 'extract', label: 'Extract alive', value: run.extracted ? 1 : 0, target: 1, done: !!run.extracted },
    ];
  }
  if (run.modeId === 'last_bastion') {
    return [{ id: 'waves', label: 'Defend 10 waves', value: run.wave || 0, target: 10, done: run.wave >= 10 && run.completed }];
  }
  if (run.modeId === 'echo_maze') {
    return [
      { id: 'keys', label: 'Collect 3 keys', value: run.keys || 0, target: 3, done: run.keys >= 3 },
      { id: 'escape', label: 'Escape the maze', value: run.completed ? 1 : 0, target: 1, done: run.completed },
    ];
  }
  if (run.modeId === 'shadow_duel') {
    return [{ id: 'duel', label: 'Defeat your shadow', value: run.completed ? 1 : 0, target: 1, done: run.completed }];
  }
  return [{ id: 'anchors', label: 'Activate 5 anchors', value: run.activated || 0, target: 5, done: run.activated >= 5 }];
}

export function realmEligibility(run) {
  if (!run || run.phase !== 'ended' || run.result !== 'victory') return { ok: false, reason: 'Run belum selesai.' };
  if (run.modeId === 'riftfall' && (run.maxWave || 0) < 10) return { ok: false, reason: 'Butuh 10 gelombang.' };
  if (run.modeId === 'last_bastion' && (run.wave || 0) < 10) return { ok: false, reason: 'Butuh 10 gelombang.' };
  if (run.modeId === 'relic_expedition' && run.relics.length < 3) return { ok: false, reason: 'Butuh minimal 3 relik.' };
  if (run.modeId === 'echo_maze' && run.keys < 3) return { ok: false, reason: 'Butuh 3 kunci.' };
  if (run.modeId === 'chrono_fracture' && run.activated < 5) return { ok: false, reason: 'Butuh 5 anchor.' };
  return { ok: true, reward: REALM_MODE_BY_ID[run.modeId]?.rewardId || null };
}

export function realmSnapshot(run) {
  if (!run) return null;
  return {
    id: run.id,
    modeId: run.modeId,
    modeName: run.modeName,
    phase: run.phase,
    result: run.result,
    time: round1(run.time),
    score: run.score,
    difficulty: run.difficulty,
    classId: run.classId,
    party: run.party,
    objectives: realmObjectives(run),
    log: run.log.slice(-5).map((entry) => ({ ...entry })),
  };
}

// ── persistence ────────────────────────────────────────────────────────────
export function defaultRealmsProgress() {
  return {
    version: 1,
    totalRuns: 0,
    rewards: [],
    unlockedCosmetics: [],
    modes: Object.fromEntries(REALM_MODES.map((mode) => [
      mode.id,
      { runs: 0, wins: 0, losses: 0, bestScore: 0, bestTime: 0, bestValue: 0, rewards: [] },
    ])),
    lastModeId: null,
    lastRunAt: 0,
  };
}

export function sanitizeRealmsProgress(raw) {
  const base = defaultRealmsProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const safe = (value, cap = 1e9) => clamp(asInt(value, 0), 0, cap);
  const modes = {};
  for (const mode of REALM_MODES) {
    const entry = raw.modes?.[mode.id] || {};
    modes[mode.id] = {
      runs: safe(entry.runs, 99999),
      wins: safe(entry.wins, 99999),
      losses: safe(entry.losses, 99999),
      bestScore: safe(entry.bestScore),
      bestTime: Math.max(0, Math.min(86400, Number(entry.bestTime) || 0)),
      bestValue: safe(entry.bestValue),
      rewards: Array.isArray(entry.rewards) ? entry.rewards.filter((id) => REALM_REWARD_BY_ID[id]) : [],
    };
  }
  const rewards = Array.isArray(raw.rewards) ? [...new Set(raw.rewards.filter((id) => REALM_REWARD_BY_ID[id] && modes[REALM_REWARD_BY_ID[id].modeId]?.wins > 0))] : [];
  const cosmetics = Array.isArray(raw.unlockedCosmetics) ? [...new Set(raw.unlockedCosmetics.filter((id) => REALM_REWARDS.some((reward) => reward.cosmeticId === id)))] : [];
  return {
    ...base,
    version: 1,
    totalRuns: safe(raw.totalRuns, 999999),
    rewards,
    unlockedCosmetics: cosmetics,
    modes,
    lastModeId: REALM_MODE_BY_ID[raw.lastModeId] ? raw.lastModeId : null,
    lastRunAt: Math.max(0, Number(raw.lastRunAt) || 0),
  };
}

export function recordRealmRun(progress, run, { verified = false } = {}) {
  const state = progress || defaultRealmsProgress();
  const mode = REALM_MODE_BY_ID[run?.modeId];
  if (!mode) return { ok: false, reason: 'unknown_mode', progress: state };
  const modeState = state.modes[mode.id] || { runs: 0, wins: 0, losses: 0, bestScore: 0, bestTime: 0, bestValue: 0, rewards: [] };
  const win = run.result === 'victory';
  modeState.runs += 1;
  if (win) modeState.wins += 1;
  else modeState.losses += 1;
  modeState.bestScore = Math.max(modeState.bestScore, Math.round(Number(run.score) || 0));
  if (win) {
    modeState.bestTime = modeState.bestTime ? Math.min(modeState.bestTime, round1(run.time)) : round1(run.time);
    const value = run.modeId === 'relic_expedition' ? run.relics.length
      : run.modeId === 'echo_maze' ? run.keys
        : run.modeId === 'chrono_fracture' ? run.activated
          : run.modeId === 'shadow_duel' ? run.perfects
            : run.maxWave || run.wave || 0;
    modeState.bestValue = Math.max(modeState.bestValue, value || 0);
  }
  state.modes[mode.id] = modeState;
  state.totalRuns += 1;
  state.lastModeId = mode.id;
  state.lastRunAt = Date.now();
  let reward = null;
  if (verified && win) {
    const eligibility = realmEligibility(run);
    if (eligibility.ok && !state.rewards.includes(mode.rewardId)) {
      reward = REALM_REWARD_BY_ID[mode.rewardId];
      state.rewards.push(mode.rewardId);
      if (!state.unlockedCosmetics.includes(reward.cosmeticId)) state.unlockedCosmetics.push(reward.cosmeticId);
      if (!modeState.rewards.includes(mode.rewardId)) modeState.rewards.push(mode.rewardId);
    }
  }
  return { ok: true, win, mode: mode.id, reward, progress: state, verified: !!verified };
}

export function realmsSummary(progress) {
  const safe = sanitizeRealmsProgress(progress);
  return {
    totalRuns: safe.totalRuns,
    modesPlayed: REALM_MODES.filter((mode) => safe.modes[mode.id].runs > 0).length,
    modesTotal: REALM_MODES.length,
    wins: REALM_MODES.reduce((sum, mode) => sum + safe.modes[mode.id].wins, 0),
    rewards: safe.rewards.length,
    rewardsTotal: REALM_REWARDS.length,
    modes: safe.modes,
    lastModeId: safe.lastModeId,
  };
}

// ── Stage Access / HACK ────────────────────────────────────────────────────
export const STAGE_ACCESS_ARCS = [
  { id: 'arc1', label: 'ARC I', name: 'Forgotten Kingdom', localName: 'Kerajaan Terlupakan', start: 0, end: 7, color: '#d07a35' },
  { id: 'arc2', label: 'ARC II', name: 'Mycelial Hollow', localName: 'Rongga Miselium', start: 8, end: 13, color: '#8fbf7a' },
  { id: 'arc3', label: 'ARC III', name: 'Echoes of the Forgotten World', localName: 'Gema Dunia Terlupakan', start: 14, end: 113, color: '#8a86e8' },
  { id: 'arc4', label: 'ARC IV', name: 'The Fallen Ones', localName: 'Yang Terjatuh', start: 426, end: 484, color: '#d8c890' },
  { id: 'arc5', label: 'ARC V', name: 'The Radiant Crusade', localName: 'Perang Salib Bersinar', start: 485, end: 504, color: '#e8c46a' },
  { id: 'arc6', label: 'ARC VI', name: 'The Astral Dominion', localName: 'Dominion Astral', start: 505, end: 524, color: '#9fc8ff' },
];
export const STAGE_ACCESS_SIDE = [
  { id: 'atlas', label: 'ATLAS', name: 'The Sundered Atlas', localName: 'Atlas Terbelah', start: 114, end: 353, color: '#c8a2e8' },
  { id: 'court', label: 'COURT', name: 'The Hollow Court', localName: 'Istana Kosong', start: 354, end: 413, color: '#a89078' },
  { id: 'fairy', label: 'FAEWOOD', name: 'Taman Peri', localName: 'Taman Peri', start: 414, end: 425, color: '#9edc9a' },
];

function stageInfoForRoom(roomId) {
  const room = ALL_ROOMS[roomId];
  if (!room) return null;
  const enemies = (room.enemies || []).map((enemy) => ALL_ENEMY_INFO[enemy.type] || { id: enemy.type, name: enemy.type });
  const bossInfo = room.boss ? ALL_BOSS_INFO[room.boss] : null;
  const elite = enemies.find((enemy) => enemy.elite) || (room.enemies || []).find((enemy) => enemy.elite);
  const arc = STAGE_ACCESS_ARCS.find((entry) => roomId >= entry.start && roomId <= entry.end)
    || STAGE_ACCESS_SIDE.find((entry) => roomId >= entry.start && roomId <= entry.end);
  return {
    id: roomId,
    kind: room.boss ? 'boss' : 'stage',
    arcId: arc?.id || 'other',
    arcLabel: arc?.label || 'SIDE',
    arcName: arc?.name || 'Ashen Vow',
    name: room.name,
    subtitle: room.subtitle,
    roomName: room.name,
    description: room.hint || room.subtitle || '',
    enemies: enemies.map((enemy) => ({ id: enemy.id, name: enemy.name, localName: enemy.localName, role: enemy.behavior, elite: !!enemy.elite })),
    enemyCount: room.astralBoss ? 0 : enemies.length,
    archetypes: new Set(enemies.filter((enemy) => !enemy.elite).map((enemy) => enemy.behavior)).size,
    elite: elite ? { id: elite.id, name: elite.name, localName: elite.localName } : null,
    boss: bossInfo ? {
      id: bossInfo.id,
      kind: bossInfo.kind,
      name: bossInfo.name,
      localName: bossInfo.localName,
      phases: bossInfo.maxPhases,
      title: bossInfo.title,
      desc: bossInfo.desc,
    } : null,
    modifiers: room.condition ? [room.condition] : [],
    rewards: bossInfo ? [bossInfo.reward === 'victory' ? 'Campaign completion' : 'Blessing'] : ['Ash', 'Relic chance'],
    recommendedClass: ['sera', 'lyna', 'kael', 'karn'][roomId % 4],
    recommendedDifficulty: roomId > 500 ? 'normal' : 'easy',
    preview: {
      palette: room.palette || null,
      particle: room.particle || 'motes',
      weather: room.weather || '',
      platforms: (room.platforms || []).slice(0, 8),
      spawn: room.spawn || null,
    },
    astral: !!room.astral,
    crusade: !!room.crusade,
    fallen: !!room.fallen,
    legacy: roomId < ROOMS.length,
  };
}

export function stageInfo(stageId) {
  if (REALM_MODE_BY_ID[stageId]) {
    const mode = REALM_MODE_BY_ID[stageId];
    return {
      id: mode.id,
      kind: 'mode',
      arcId: 'modes',
      arcLabel: 'MODES',
      arcName: 'Infinite Realms',
      name: mode.name,
      subtitle: mode.subtitle,
      description: mode.desc,
      enemies: [],
      enemyCount: 0,
      archetypes: 0,
      elite: null,
      boss: null,
      modifiers: [mode.loop],
      rewards: [mode.rewardName],
      recommendedClass: 'sera',
      recommendedDifficulty: 'normal',
      preview: { palette: null, particle: 'stars', weather: mode.tagline, platforms: [], spawn: null },
      mode: { ...mode },
    };
  }
  const numeric = Number(stageId);
  return Number.isInteger(numeric) ? stageInfoForRoom(numeric) : null;
}

export function stageAccessCatalog() {
  return [...STAGE_ACCESS_ARCS, ...STAGE_ACCESS_SIDE].map((arc) => ({
    ...arc,
    stages: Array.from({ length: arc.end - arc.start + 1 }, (_, index) => stageInfoForRoom(arc.start + index)).filter(Boolean),
  }));
}

export function stageArc(arcId) {
  return [...STAGE_ACCESS_ARCS, ...STAGE_ACCESS_SIDE].find((arc) => arc.id === arcId) || null;
}

export function stageAccessStats(progress) {
  const count = ALL_ROOMS.length;
  return {
    totalRooms: count,
    campaignArcs: STAGE_ACCESS_ARCS.length,
    sideArcs: STAGE_ACCESS_SIDE.length,
    modes: REALM_MODES.length,
    hackIsolated: true,
    progressRooms: progress?.cleared?.filter(Boolean).length || 0,
  };
}

export function hackSessionConfig(stageId, options = {}) {
  const info = stageInfo(stageId);
  if (!info) return null;
  return {
    version: 1,
    stageId: info.id,
    roomId: info.kind === 'mode' ? null : info.id,
    modeId: info.kind === 'mode' ? info.mode.id : null,
    difficulty: REALM_DIFFICULTY_BY_ID[options.difficulty] ? options.difficulty : 'normal',
    classId: options.classId || info.recommendedClass || 'sera',
    modifiers: Array.isArray(options.modifiers) ? options.modifiers.slice(0, 6) : [],
    isolated: true,
    testRewardSimulation: false,
    createdAt: Date.now(),
  };
}

export function realmClaimPayload(run) {
  return {
    modeId: run?.modeId,
    runId: run?.id,
    seed: run?.seed,
    difficulty: run?.difficulty,
    score: Math.round(Number(run?.score) || 0),
    time: round1(run?.time),
    result: run?.result,
    completed: run?.completed === true,
    waves: run?.maxWave || run?.wave || 0,
    relics: run?.relics?.length || 0,
    keys: run?.keys || 0,
    anchors: run?.activated || 0,
    perfects: run?.perfects || 0,
    objectives: realmObjectives(run),
  };
}

export function realmsClaimEligibility(payload) {
  const mode = REALM_MODE_BY_ID[payload?.modeId];
  if (!mode) return { ok: false, reason: 'unknown_mode' };
  if (payload.result !== 'victory' || payload.completed !== true) return { ok: false, reason: 'not_completed' };
  if (payload.score < mode.minScore) return { ok: false, reason: 'score_too_low' };
  if (mode.minWave && payload.waves < mode.minWave) return { ok: false, reason: 'waves_incomplete' };
  if (mode.minRelics && payload.relics < mode.minRelics) return { ok: false, reason: 'relics_incomplete' };
  if (mode.minKeys && payload.keys < mode.minKeys) return { ok: false, reason: 'keys_incomplete' };
  if (mode.minAnchors && payload.anchors < mode.minAnchors) return { ok: false, reason: 'anchors_incomplete' };
  return { ok: true, reward: REALM_REWARD_BY_ID[mode.rewardId] };
}
