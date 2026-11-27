import { PIRATE_STAGES, PIRATE_STAGE_BY_ID, sanitizePirateProgress } from './pirate-progress.js';
export { PIRATE_STAGES, PIRATE_STAGE_BY_ID, defaultPirateProgress, sanitizePirateProgress } from './pirate-progress.js';

// Ashen Vow — Pirate Tide: Open Sea
// Pure, deterministic naval combat and open-world sailing. No DOM access.
// The browser shell owns input, persistence, audio and screen flow.

export const PIRATE_VERSION = '1.0.0';
export const PIRATE_WORLD_W = 3200;
export const PIRATE_WORLD_H = 2200;
export const PIRATE_MAX_BALLS = 180;
export const PIRATE_MAX_ENEMIES = 10;
export const PIRATE_DOCK_COST = 25;
export const PIRATE_ENDLESS_SURGE_TIME = 34;
export const PIRATE_ENDLESS_START_GOLD = 70;
export const PIRATE_ENDLESS_CAPTAIN_EVERY = 3;

// Endless keeps its own pseudo-stage so route cards, unlocks and the final
// captain chain stay untouched.
export const PIRATE_ENDLESS_STAGE = {
  id: 'endless_tide',
  index: 10,
  name: 'Pasang Tak Berujung',
  subtitle: 'LAUT TANPA AKAR',
  desc: 'Tidak ada kapten terakhir. Setiap pasang membawa armada yang lebih berat.',
  targetKills: 0,
  bossId: '',
  gold: 0,
  score: 0,
  start: { x: 1500, y: 900, angle: -Math.PI / 2 },
};

const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const num = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
function compact(list, keep) {
  let write = 0;
  for (let read = 0; read < list.length; read += 1) {
    const item = list[read];
    if (keep(item)) list[write++] = item;
  }
  list.length = write;
  return list;
}
const wrap = (angle) => {
  let out = angle % TAU;
  if (out > Math.PI) out -= TAU;
  if (out < -Math.PI) out += TAU;
  return out;
};

function makeRng(seed) {
  let state = (Number(seed) >>> 0) || 0x9e3779b9;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Open world geography ───────────────────────────────────────────────────
export const PIRATE_ISLANDS = [
  { id: 'ash_harbor', name: 'Pelabuhan Abu', x: 430, y: 1080, r: 176, port: true, color: '#8d7457', accent: '#d2ad70' },
  { id: 'bonespire', name: 'Pulau Menara Tulang', x: 1050, y: 520, r: 146, port: false, color: '#78776c', accent: '#d8d0b3' },
  { id: 'lantern_cay', name: 'Karang Lentera', x: 1680, y: 330, r: 112, port: true, color: '#6d7865', accent: '#f0c675' },
  { id: 'widow_reef', name: 'Karang Janda', x: 2140, y: 770, r: 184, port: false, color: '#5a6662', accent: '#9d7963' },
  { id: 'drowned_steps', name: 'Tangga Tenggelam', x: 2700, y: 410, r: 138, port: true, color: '#7a6e5c', accent: '#c4a878' },
  { id: 'cinder_key', name: 'Kunci Bara', x: 1480, y: 1540, r: 158, port: true, color: '#826050', accent: '#df8353' },
  { id: 'last_lantern', name: 'Lentera Terakhir', x: 2580, y: 1730, r: 194, port: true, color: '#626d66', accent: '#e8cc8a' },
  // Act II waters: the mist shoal, the mourning isle and the starfall cay.
  { id: 'ember_shoal', name: 'Gosong Bara', x: 650, y: 380, r: 120, port: false, color: '#7d6753', accent: '#e2a06a' },
  { id: 'mourning_isle', name: 'Pulau Duka', x: 1120, y: 1900, r: 170, port: true, color: '#5f6a63', accent: '#c8b48c' },
  { id: 'starfall_cay', name: 'Karang Bintang Jatuh', x: 2920, y: 1120, r: 118, port: true, color: '#6b6f60', accent: '#cfd6b0' },
];

export const PIRATE_PORTS = PIRATE_ISLANDS.filter((island) => island.port).map((island) => ({
  id: island.id,
  name: island.name,
  x: island.x,
  y: island.y,
  r: island.r,
  dockRadius: island.r + 92,
}));

export const PIRATE_PORT_BY_ID = Object.fromEntries(PIRATE_PORTS.map((port) => [port.id, port]));

// ── Ships ──────────────────────────────────────────────────────────────────
export const PIRATE_SHIP_TYPES = [
  { id: 'ash_raider', name: 'Perompak Abu', hp: 120, speed: 92, turn: 1.35, damage: 11, reload: 1.65, range: 410, gold: 28, cannons: 2, radius: 24, length: 54, color: '#9f8468', sail: '#b8a17d', ai: true },
  { id: 'salt_corsair', name: 'Korsar Garam', hp: 185, speed: 112, turn: 1.55, damage: 14, reload: 1.45, range: 450, gold: 38, cannons: 3, radius: 26, length: 60, color: '#7f8f91', sail: '#d4c7a2', ai: true },
  { id: 'black_sloop', name: 'Sloop Hitam', hp: 155, speed: 128, turn: 1.75, damage: 10, reload: 1.2, range: 380, gold: 34, cannons: 2, radius: 23, length: 52, color: '#4e4b4b', sail: '#6d5d55', ai: true, ram: true },
  { id: 'gun_brig', name: 'Brig Meriam', hp: 260, speed: 86, turn: 1.05, damage: 18, reload: 1.9, range: 510, gold: 52, cannons: 4, radius: 30, length: 70, color: '#73614d', sail: '#a88f69', ai: true },
  { id: 'ghost_galleon', name: 'Galiung Roh', hp: 340, speed: 78, turn: 0.92, damage: 20, reload: 2.05, range: 470, gold: 68, cannons: 4, radius: 34, length: 80, color: '#576b67', sail: '#86b0a1', ai: true, spectral: true },
  { id: 'hunter_frigate', name: 'Fregat Pemburu', hp: 300, speed: 108, turn: 1.25, damage: 16, reload: 1.35, range: 520, gold: 60, cannons: 3, radius: 31, length: 72, color: '#685d57', sail: '#c1a177', ai: true },
  { id: 'storm_cutter', name: 'Pemotong Badai', hp: 220, speed: 138, turn: 1.8, damage: 13, reload: 1.15, range: 430, gold: 46, cannons: 3, radius: 24, length: 56, color: '#5c6b70', sail: '#c9d8cf', ai: true },
  { id: 'iron_leviathan', name: 'Lewiatan Baja', hp: 560, speed: 74, turn: 0.86, damage: 27, reload: 2.1, range: 560, gold: 95, cannons: 5, radius: 36, length: 86, color: '#4d4f4b', sail: '#8f9280', ai: true },
];

export const PIRATE_BOSS_TYPES = [
  { id: 'captain_morrow', name: 'Kapten Morrow, Perompak Pertama', hp: 520, speed: 96, turn: 1.2, damage: 20, reload: 1.5, range: 520, gold: 180, cannons: 4, radius: 38, length: 88, color: '#8a6546', sail: '#d0a15f', boss: true, title: 'PENJAGA PASANG' },
  { id: 'the_tolling_bell', name: 'Lonceng yang Menagih', hp: 760, speed: 88, turn: 1.08, damage: 24, reload: 1.65, range: 500, gold: 240, cannons: 5, radius: 41, length: 94, color: '#55716e', sail: '#8fc1b3', boss: true, spectral: true, title: 'KAPAL HANTU' },
  { id: 'widow_reef', name: 'Janda Karang', hp: 980, speed: 104, turn: 1.18, damage: 28, reload: 1.45, range: 540, gold: 320, cannons: 5, radius: 43, length: 98, color: '#72584f', sail: '#c9876d', boss: true, title: 'RATU KARANG' },
  { id: 'admiral_vane', name: 'Laksamana Vane', hp: 1260, speed: 112, turn: 1.32, damage: 32, reload: 1.3, range: 560, gold: 420, cannons: 6, radius: 45, length: 102, color: '#555d68', sail: '#d3b16f', boss: true, title: 'ARMADA TERAKHIR' },
  { id: 'the_drowned_king', name: 'Raja Tenggelam', hp: 1680, speed: 120, turn: 1.28, damage: 38, reload: 1.18, range: 590, gold: 600, cannons: 6, radius: 50, length: 112, color: '#3e5659', sail: '#7cb6ad', boss: true, spectral: true, title: 'MAHKOTA LAUT' },
  // Act II captains. Each route ends with its own flagship.
  { id: 'captain_heron', name: 'Kapten Heron, Pemburu Kabut', hp: 1900, speed: 118, turn: 1.34, damage: 34, reload: 1.3, range: 600, gold: 700, cannons: 7, radius: 46, length: 104, color: '#5a655c', sail: '#b7c7ad', boss: true, title: 'PEMBURU KABUT' },
  { id: 'the_hollow_tide', name: 'Pasang Kosong', hp: 2200, speed: 110, turn: 1.16, damage: 36, reload: 1.32, range: 580, gold: 820, cannons: 7, radius: 48, length: 108, color: '#4c6166', sail: '#7fb3aa', boss: true, spectral: true, title: 'ARMADA KOSONG' },
  { id: 'salt_queen', name: 'Ratu Garam', hp: 2500, speed: 122, turn: 1.3, damage: 38, reload: 1.28, range: 610, gold: 960, cannons: 7, radius: 50, length: 112, color: '#7d7462', sail: '#dccba6', boss: true, title: 'TAKHTA KARAM' },
  { id: 'marshal_kade', name: 'Marsekal Kade, Tangan Baja', hp: 2850, speed: 114, turn: 1.24, damage: 38, reload: 1.3, range: 630, gold: 1120, cannons: 8, radius: 52, length: 116, color: '#525761', sail: '#c0a06c', boss: true, title: 'TANGAN BAJA' },
  { id: 'the_first_captain', name: 'Kapten Pertama, Penjaga Sumpah Laut', hp: 3200, speed: 128, turn: 1.36, damage: 40, reload: 1.25, range: 660, gold: 1400, cannons: 8, radius: 56, length: 124, color: '#39544f', sail: '#8fd0c0', boss: true, spectral: true, title: 'SUMPAH LAUT' },
];

const SHIP_BY_ID = Object.fromEntries([...PIRATE_SHIP_TYPES, ...PIRATE_BOSS_TYPES].map((type) => [type.id, type]));

export function pirateStageUnlocked(progress, stageId) {
  const stage = typeof stageId === 'string' ? PIRATE_STAGE_BY_ID[stageId] : stageId;
  if (!stage) return false;
  if (stage.index === 0) return true;
  const p = sanitizePirateProgress(progress);
  return !!PIRATE_STAGES[stage.index - 1] && !!p.stages[PIRATE_STAGES[stage.index - 1].id]?.cleared;
}

// ── Helpers ────────────────────────────────────────────────────────────────
// Axis rejection before the square-distance test keeps this cheap even with a
// ten-island sea and a screen full of cannonballs.
function islandBlocked(x, y, pad = 0) {
  for (const island of PIRATE_ISLANDS) {
    const limit = island.r + pad;
    const dx = x - island.x;
    if (dx > limit || dx < -limit) continue;
    const dy = y - island.y;
    if (dy > limit || dy < -limit) continue;
    if (dx * dx + dy * dy < limit * limit) return true;
  }
  return false;
}

function pointClearOfIslands(m, x, y, pad = 34) {
  if (x < 70 || x > PIRATE_WORLD_W - 70 || y < 70 || y > PIRATE_WORLD_H - 70) return false;
  if (islandBlocked(x, y, pad)) return false;
  if (Math.hypot(x - m.player.x, y - m.player.y) < 190) return false;
  return true;
}

function findSpawnPoint(m, minDistance = 460, maxDistance = 920) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const angle = m.rng() * TAU;
    const radius = minDistance + m.rng() * (maxDistance - minDistance);
    const x = m.player.x + Math.cos(angle) * radius;
    const y = m.player.y + Math.sin(angle) * radius;
    if (pointClearOfIslands(m, x, y, 46)) return { x, y };
  }
  // Ring search keeps the fallback valid even when the player is boxed in by islands.
  for (let ring = 0; ring < 8; ring += 1) {
    const radius = 260 + ring * 150;
    for (let step = 0; step < 24; step += 1) {
      const angle = (step / 24) * TAU + ring * 0.37;
      const x = m.player.x + Math.cos(angle) * radius;
      const y = m.player.y + Math.sin(angle) * radius;
      if (pointClearOfIslands(m, x, y, 46)) return { x, y };
    }
  }
  return { x: 80, y: 80 };
}

function projectShip(ship) {
  return {
    id: ship.id,
    typeId: ship.type.id,
    name: ship.type.name,
    x: Math.round(ship.x * 10) / 10,
    y: Math.round(ship.y * 10) / 10,
    angle: Math.round(ship.angle * 1000) / 1000,
    hp: Math.round(ship.hp * 10) / 10,
    maxHp: ship.maxHp,
    boss: !!ship.type.boss,
    dead: !!ship.dead,
  };
}

function enemyLimit(m) {
  if (m.endless) return Math.min(PIRATE_MAX_ENEMIES, 4 + Math.floor(m.endless.surge / 2));
  return Math.min(PIRATE_MAX_ENEMIES, 4 + Math.floor(m.stage.index / 2));
}

function enemyPool(m) {
  if (m.endless) {
    const surge = m.endless.surge;
    return PIRATE_SHIP_TYPES.filter((type) => {
      if (type.id === 'iron_leviathan') return surge >= 4;
      if (type.id === 'storm_cutter') return surge >= 2;
      if (type.id === 'hunter_frigate') return surge >= 2;
      if (type.id === 'gun_brig') return surge >= 1;
      return true;
    });
  }
  const pool = PIRATE_SHIP_TYPES.filter((type) => {
    if (type.id === 'iron_leviathan') return m.stage.index >= 6;
    if (type.id === 'storm_cutter') return m.stage.index >= 5;
    if (type.id === 'ghost_galleon') return m.stage.index >= 1;
    if (type.id === 'hunter_frigate') return m.stage.index >= 2;
    if (type.id === 'gun_brig') return m.stage.index >= 1;
    return true;
  });
  return pool;
}

// Exposed for tests and tooling: which hulls a route can spawn.
export function pirateEnemyPool(matchOrStage) {
  if (!matchOrStage) return [];
  const stage = typeof matchOrStage === 'number'
    ? PIRATE_STAGES[matchOrStage]
    : typeof matchOrStage === 'string'
      ? PIRATE_STAGE_BY_ID[matchOrStage]
      : (matchOrStage.stage || matchOrStage);
  return stage ? enemyPool({ stage }) : [];
}

function spawnEnemy(m, type = null) {
  if (!type) {
    const pool = enemyPool(m);
    type = pool[Math.floor(m.rng() * pool.length)] || PIRATE_SHIP_TYPES[0];
  }
  const point = findSpawnPoint(m);
  const ship = makeShip(m, type, {
    x: point.x,
    y: point.y,
    angle: Math.atan2(m.player.y - point.y, m.player.x - point.x),
    owner: 'enemy',
  });
  if (m.endless) {
    const steps = Math.max(0, m.endless.surge - 1);
    ship.maxHp = Math.round(ship.hp * (1 + steps * 0.085));
    ship.hp = ship.maxHp;
    ship.damageScale = 1 + steps * 0.045;
  }
  m.enemies.push(ship);
  return ship;
}

function makeShip(m, type, { x, y, angle, owner }) {
  m.shipId += 1;
  return {
    id: `ship_${m.shipId}`,
    type,
    owner,
    x,
    y,
    angle,
    speed: owner === 'player' ? type.speed * 0.35 : type.speed * 0.55,
    targetSpeed: 0,
    throttle: 0,
    turn: 0,
    hp: type.hp,
    maxHp: type.hp,
    hullRadius: type.radius,
    reloadPort: 0.6,
    reloadStarboard: 0.9,
    hitFlash: 0,
    dead: false,
    contactCooldown: 0,
    aiSide: m.rng() < 0.5 ? -1 : 1,
    aiSideTimer: 5 + m.rng() * 3,
    fireDelay: 0.7 + m.rng() * 0.8,
    wake: [],
  };
}

function pushEffect(m, effect) {
  m.effects.push({ life: 0.6, maxLife: 0.6, ...effect });
  if (m.effects.length > 70) m.effects.splice(0, m.effects.length - 70);
}

function pushMessage(m, text, tone = 'normal') {
  m.messages.push({ text, tone, at: m.time });
  if (m.messages.length > 5) m.messages.splice(0, m.messages.length - 5);
}

export function createPirateVoyage({ stageId = 'first_tide', seed = 1 } = {}) {
  const stage = PIRATE_STAGE_BY_ID[stageId] || PIRATE_STAGES[0];
  const rng = makeRng(seed);
  const m = {
    version: 1,
    stageId: stage.id,
    stage,
    seed: Number(seed) >>> 0,
    rng,
    time: 0,
    phase: 'sailing',
    shipId: 0,
    player: null,
    enemies: [],
    cannonballs: [],
    effects: [],
    messages: [],
    kills: 0,
    score: 0,
    gold: 0,
    shotsFired: 0,
    hits: 0,
    bossSpawned: false,
    bossDefeated: false,
    bossShipId: '',
    spawnTimer: 2.5,
    shake: 0,
    paused: false,
    controls: { throttle: 0, turn: 0 },
    ports: PIRATE_PORTS.map((port) => ({ ...port, dockedAt: -999 })),
  };
  const playerType = {
    id: 'ashen_corsair',
    name: 'Korsar Sumpah',
    hp: 300,
    speed: 170,
    turn: 1.9,
    damage: 17,
    reload: 1.35,
    range: 540,
    cannons: 3,
    radius: 28,
    length: 68,
    color: '#b08a5c',
    sail: '#e2cf9e',
  };
  m.player = makeShip(m, playerType, {
    x: stage.start.x,
    y: stage.start.y,
    angle: stage.start.angle,
    owner: 'player',
  });
  m.player.hp = 300;
  m.player.maxHp = 300;
  m.player.reloadPort = 0;
  m.player.reloadStarboard = 0;
  for (let i = 0; i < 3; i += 1) spawnEnemy(m);
  pushMessage(m, `${stage.name} — cari ${stage.targetKills} kapal lalu tenggelamkan kapten.`, 'gold');
  return m;
}

// Endless tide: one open sea, no final captain, and a fleet that grows every
// surge. Every third surge fields a captain, every surge upgrades your hull.
export function createPirateEndless({ seed = 1 } = {}) {
  const m = createPirateVoyage({ stageId: PIRATE_STAGES[9].id, seed });
  m.mode = 'endless';
  m.stageId = PIRATE_ENDLESS_STAGE.id;
  m.stage = { ...PIRATE_ENDLESS_STAGE, start: { ...PIRATE_ENDLESS_STAGE.start } };
  m.player.x = PIRATE_ENDLESS_STAGE.start.x;
  m.player.y = PIRATE_ENDLESS_STAGE.start.y;
  m.player.angle = PIRATE_ENDLESS_STAGE.start.angle;
  m.endless = { surge: 1, surgeTimer: PIRATE_ENDLESS_SURGE_TIME, captains: 0 };
  m.gold = PIRATE_ENDLESS_START_GOLD;
  m.score = 0;
  m.kills = 0;
  m.bossSpawned = false;
  m.bossDefeated = false;
  m.messages.length = 0;
  pushMessage(m, 'PASANG TAK BERUJUNG — bertahan selama mungkin, tiap pasang memperkuat armada.', 'gold');
  return m;
}

function endlessSurgeLength(surge) {
  return Math.max(20, PIRATE_ENDLESS_SURGE_TIME - surge * 0.55);
}

function spawnEndlessCaptain(m) {
  const roster = PIRATE_BOSS_TYPES.slice(0, 5);
  const type = roster[(m.endless.captains + m.endless.surge) % roster.length];
  const point = findSpawnPoint(m, 440, 660);
  const boss = makeShip(m, type, {
    x: point.x,
    y: point.y,
    angle: Math.atan2(m.player.y - point.y, m.player.x - point.x) + Math.PI / 2,
    owner: 'enemy',
  });
  const steps = Math.max(0, m.endless.surge - 3);
  boss.maxHp = Math.round(type.hp * Math.min(1.7, 1 + steps * 0.08));
  boss.hp = boss.maxHp;
  boss.damageScale = 1 + steps * 0.03;
  boss.aiSideTimer = 8;
  boss.fireDelay = 1.2;
  m.enemies.push(boss);
  pushMessage(m, `${type.title}: ${type.name} memasuki pasang!`, 'danger');
  return boss;
}

// Advances the tide immediately. Exported for tests and the debug hooks.
export function pirateEndlessSurge(match) {
  if (!match?.endless || match.phase !== 'sailing') return false;
  const e = match.endless;
  e.surge += 1;
  e.surgeTimer = endlessSurgeLength(e.surge);
  match.player.maxHp += 12;
  match.player.hp = Math.min(match.player.maxHp, match.player.hp + 24);
  match.player.damageScale = (match.player.damageScale || 1) * 1.06;
  match.score += 60 + e.surge * 20;
  const extra = 1 + Math.floor(e.surge / 2);
  for (let i = 0; i < extra; i += 1) {
    if (match.enemies.length >= enemyLimit(match)) break;
    spawnEnemy(match);
  }
  if (e.surge % PIRATE_ENDLESS_CAPTAIN_EVERY === 0) spawnEndlessCaptain(match);
  pushMessage(match, `PASANG ${e.surge} — lambung +12 maksimum, armada menguat.`, 'gold');
  return true;
}

function updateEndlessDirector(m, step) {
  m.endless.surgeTimer -= step;
  if (m.endless.surgeTimer <= 0) pirateEndlessSurge(m);
}

// ── Movement and combat ────────────────────────────────────────────────────
export function setPirateControls(match, { throttle, turn } = {}) {
  if (!match || match.phase !== 'sailing') return false;
  if (throttle !== undefined) match.controls.throttle = clamp(num(throttle), -1, 1);
  if (turn !== undefined) match.controls.turn = clamp(num(turn), -1, 1);
  return true;
}

function integrateShip(m, ship, dt, { player = false } = {}) {
  if (ship.dead) return;
  let throttle = player ? m.controls.throttle : ship.throttle;
  let turnInput = player ? m.controls.turn : ship.turn;
  if (player && ship.hp <= 0) return;
  const speedFactor = 0.42 + 0.58 * clamp(Math.abs(ship.speed) / ship.type.speed, 0, 1);
  ship.angle = wrap(ship.angle + turnInput * ship.type.turn * speedFactor * dt);
  const targetSpeed = throttle >= 0
    ? throttle * ship.type.speed
    : throttle * ship.type.speed * 0.42;
  const acceleration = (Math.abs(targetSpeed) > Math.abs(ship.speed) ? 100 : 150) * dt;
  ship.speed += clamp(targetSpeed - ship.speed, -acceleration, acceleration);
  if (Math.abs(ship.speed) < 1.5 && throttle === 0) ship.speed = 0;

  const nx = ship.x + Math.cos(ship.angle) * ship.speed * dt;
  const ny = ship.y + Math.sin(ship.angle) * ship.speed * dt;

  // Island collision: slide along the shore instead of teleporting through it.
  let resolved = false;
  for (const island of PIRATE_ISLANDS) {
    const limit = island.r + ship.hullRadius;
    const dx = nx - island.x;
    if (dx > limit || dx < -limit) continue;
    const dy = ny - island.y;
    if (dy > limit || dy < -limit) continue;
    if (dx * dx + dy * dy >= limit * limit) continue;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const push = limit - dist;
    ship.x += (dx / dist) * push;
    ship.y += (dy / dist) * push;
    ship.speed *= 0.42;
    if (player) m.shake = Math.max(m.shake, 0.22);
    pushEffect(m, { type: 'splash', x: ship.x + (dx / dist) * ship.hullRadius, y: ship.y + (dy / dist) * ship.hullRadius, color: '#c9d8cf' });
    resolved = true;
    break;
  }
  if (!resolved) {
    ship.x = nx;
    ship.y = ny;
  }
  ship.x = clamp(ship.x, ship.hullRadius, PIRATE_WORLD_W - ship.hullRadius);
  ship.y = clamp(ship.y, ship.hullRadius, PIRATE_WORLD_H - ship.hullRadius);

  if (ship.owner === 'player') {
    ship.wake.push({ x: ship.x, y: ship.y, life: 1.2 });
    if (ship.wake.length > 22) ship.wake.shift();
  }
  for (const wake of ship.wake) wake.life -= dt;
  compact(ship.wake, (wake) => wake.life > 0);
  ship.reloadPort = Math.max(0, ship.reloadPort - dt);
  ship.reloadStarboard = Math.max(0, ship.reloadStarboard - dt);
  ship.hitFlash = Math.max(0, ship.hitFlash - dt);
  ship.contactCooldown = Math.max(0, ship.contactCooldown - dt);
}

function pushShipOutOfIslands(ship) {
  for (const island of PIRATE_ISLANDS) {
    const limit = island.r + ship.hullRadius;
    const dx = ship.x - island.x;
    if (dx > limit || dx < -limit) continue;
    const dy = ship.y - island.y;
    if (dy > limit || dy < -limit) continue;
    const distSq = dx * dx + dy * dy;
    if (distSq >= limit * limit) continue;
    const dist = Math.sqrt(distSq);
    if (dist < 0.001) {
      ship.x = island.x + limit;
      ship.y = island.y;
    } else {
      ship.x = island.x + (dx / dist) * limit;
      ship.y = island.y + (dy / dist) * limit;
    }
  }
  ship.x = clamp(ship.x, ship.hullRadius, PIRATE_WORLD_W - ship.hullRadius);
  ship.y = clamp(ship.y, ship.hullRadius, PIRATE_WORLD_H - ship.hullRadius);
}

// Hulls collide instead of sailing through one another. The black sloop's ram
// flag becomes real damage, while every other contact is a harmless bump.
function resolveShipCollisions(m) {
  const ships = [m.player, ...m.enemies];
  for (let i = 0; i < ships.length; i += 1) {
    const a = ships[i];
    if (a.dead) continue;
    for (let j = i + 1; j < ships.length; j += 1) {
      const b = ships[j];
      if (b.dead) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const minDist = a.hullRadius + b.hullRadius;
      const distSq = dx * dx + dy * dy;
      if (distSq >= minDist * minDist) continue;
      const dist = Math.sqrt(distSq);
      const nx = dist > 0.001 ? dx / dist : 1;
      const ny = dist > 0.001 ? dy / dist : 0;
      const overlap = minDist - dist;
      const massA = a.type.boss ? 2.8 : 1;
      const massB = b.type.boss ? 2.8 : 1;
      const total = massA + massB;
      a.x -= nx * overlap * (massB / total);
      a.y -= ny * overlap * (massB / total);
      b.x += nx * overlap * (massA / total);
      b.y += ny * overlap * (massA / total);
      pushShipOutOfIslands(a);
      pushShipOutOfIslands(b);
      const avx = Math.cos(a.angle) * a.speed;
      const avy = Math.sin(a.angle) * a.speed;
      const bvx = Math.cos(b.angle) * b.speed;
      const bvy = Math.sin(b.angle) * b.speed;
      const closing = Math.abs((avx - bvx) * nx + (avy - bvy) * ny);
      a.speed *= 0.52;
      b.speed *= 0.52;
      if (a.owner === b.owner) continue;
      const alreadyHot = a.contactCooldown > 0 || b.contactCooldown > 0;
      a.contactCooldown = 0.42;
      b.contactCooldown = 0.42;
      if (alreadyHot) continue;
      pushEffect(m, { type: 'splash', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, color: '#d7e3d8' });
      m.shake = Math.max(m.shake, 0.3);
      const player = a.owner === 'player' ? a : b.owner === 'player' ? b : null;
      const enemy = player === a ? b : a;
      if (player && enemy?.type.ram && closing > 34) {
        damageShip(m, player, Math.max(6, Math.round(enemy.type.damage * 0.6)), enemy.x, enemy.y);
        pushMessage(m, `${enemy.type.name} meram lambungmu!`, 'danger');
      }
    }
  }
}

function nearestPort(m) {
  let best = null;
  let bestDist = Infinity;
  for (const port of m.ports) {
    const dist = Math.hypot(port.x - m.player.x, port.y - m.player.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = port;
    }
  }
  return best ? { port: best, distance: bestDist } : null;
}

export function pirateNearPort(match) {
  if (!match) return null;
  const near = nearestPort(match);
  if (!near) return null;
  return { ...near, inRange: near.distance <= near.port.dockRadius };
}

export function pirateDock(match) {
  if (!match || match.phase !== 'sailing') return { ok: false, reason: 'Tidak sedang berlayar.' };
  const near = nearestPort(match);
  if (!near || near.distance > near.port.dockRadius) return { ok: false, reason: 'Tidak ada pelabuhan di dekat kapal.' };
  if (match.player.hp >= match.player.maxHp) return { ok: false, reason: 'Lambung sudah penuh.' };
  if (match.gold < PIRATE_DOCK_COST) return { ok: false, reason: `Butuh ${PIRATE_DOCK_COST} emas untuk reparasi.` };
  match.gold -= PIRATE_DOCK_COST;
  const healed = Math.min(match.player.maxHp - match.player.hp, match.player.maxHp * 0.5);
  match.player.hp += healed;
  const port = match.ports.find((entry) => entry.id === near.port.id);
  if (port) port.dockedAt = match.time;
  pushEffect(match, { type: 'repair', x: match.player.x, y: match.player.y, color: '#9fe0ae' });
  pushMessage(match, `Berlabuh di ${near.port.name}: +${Math.round(healed)} lambung.`, 'heal');
  return { ok: true, healed, port: near.port.id, gold: match.gold };
}

export function pirateFire(match, side) {
  if (!match || match.phase !== 'sailing') return false;
  const ship = match.player;
  if (!ship || ship.hp <= 0) return false;
  const normalized = Number(side) < 0 ? -1 : 1;
  const timerKey = normalized < 0 ? 'reloadPort' : 'reloadStarboard';
  if (ship[timerKey] > 0) return false;
  const fired = fireBroadside(match, ship, normalized);
  if (!fired) return false;
  ship[timerKey] = ship.type.reload;
  match.shake = Math.max(match.shake, 0.18);
  return true;
}

export function pirateFireAt(match, worldX, worldY) {
  if (!match || match.phase !== 'sailing') return false;
  const bearing = Math.atan2(num(worldY) - match.player.y, num(worldX) - match.player.x);
  const relative = wrap(bearing - match.player.angle);
  return pirateFire(match, relative >= 0 ? 1 : -1);
}

function fireBroadside(m, ship, side) {
  const room = PIRATE_MAX_BALLS - m.cannonballs.length;
  if (room <= 0) return 0;
  const type = ship.type;
  const normal = ship.angle + side * Math.PI / 2;
  const forwardX = Math.cos(ship.angle);
  const forwardY = Math.sin(ship.angle);
  const normalX = Math.cos(normal);
  const normalY = Math.sin(normal);
  const count = Math.min(room, Math.max(1, type.cannons || 2));
  for (let i = 0; i < count; i += 1) {
    const offset = (i - (count - 1) / 2) * (type.length * 0.34);
    const muzzleX = ship.x + forwardX * offset + normalX * (type.radius * 0.82);
    const muzzleY = ship.y + forwardY * offset + normalY * (type.radius * 0.82);
    const spread = (m.rng() - 0.5) * 0.075;
    m.cannonballs.push({
      id: `${ship.id}_ball_${m.cannonballs.length}_${Math.round(m.time * 1000)}`,
      owner: ship.owner,
      sourceId: ship.id,
      x: muzzleX,
      y: muzzleY,
      vx: Math.cos(normal + spread) * 560,
      vy: Math.sin(normal + spread) * 560,
      damage: type.damage * (ship.damageScale || 1),
      life: 2.4,
      radius: 6,
      color: ship.owner === 'player' ? '#ffd37a' : type.spectral ? '#85e0cf' : '#f09a64',
      dead: false,
    });
  }
  pushEffect(m, { type: 'muzzle', x: ship.x + normalX * type.radius, y: ship.y + normalY * type.radius, color: ship.owner === 'player' ? '#ffd37a' : '#f09a64', side });
  if (ship.owner === 'player') m.shotsFired += count;
  return count;
}

function damageShip(m, ship, amount, sourceX, sourceY) {
  if (!ship || ship.dead) return;
  ship.hp = Math.max(0, ship.hp - Math.max(0, amount));
  ship.hitFlash = 0.22;
  pushEffect(m, { type: 'hit', x: sourceX, y: sourceY, color: ship.type.spectral ? '#85e0cf' : '#ffb06c' });
  if (ship.owner === 'player') {
    m.shake = Math.max(m.shake, Math.min(0.5, 0.18 + amount / 70));
  }
  if (ship.hp <= 0) sinkShip(m, ship);
}

function sinkShip(m, ship) {
  if (ship.dead) return;
  ship.dead = true;
  pushEffect(m, { type: 'sink', x: ship.x, y: ship.y, color: ship.type.spectral ? '#85e0cf' : '#c8d5cf', big: !!ship.type.boss });
  if (ship.owner === 'player') {
    m.phase = 'sunk';
    m.player.speed = 0;
    pushMessage(m, 'Lambung terbelah. Laut menutup sumpahmu.', 'danger');
    return;
  }
  if (!ship.type.boss || m.endless) m.kills += 1;
  m.gold += ship.type.gold;
  m.score += ship.type.gold * 4;
  pushMessage(m, `${ship.type.name} tenggelam. +${ship.type.gold} emas.`, 'gold');
  if (ship.type.boss && m.endless) {
    // In the endless tide a captain is a bounty, never a finish line.
    m.endless.captains += 1;
    m.score += 700 + m.endless.surge * 40;
    m.gold += Math.round(ship.type.gold * 0.35);
    pushMessage(m, `${ship.type.name} tenggelam. Laut mengirim penggantinya.`, 'victory');
    return;
  }
  if (ship.type.boss) {
    m.bossDefeated = true;
    m.phase = 'cleared';
    m.score += m.stage.score;
    m.gold += m.stage.gold;
    pushMessage(m, `${ship.type.name} jatuh. ${m.stage.name} selesai.`, 'victory');
  }
}

function updateEnemyAi(m, ship, dt) {
  if (ship.dead) return;
  const dx = m.player.x - ship.x;
  const dy = m.player.y - ship.y;
  const dist = Math.hypot(dx, dy) || 1;
  const bearing = Math.atan2(dy, dx);
  ship.aiSideTimer -= dt;
  if (ship.aiSideTimer <= 0) {
    ship.aiSide *= -1;
    ship.aiSideTimer = 5 + m.rng() * 5;
  }
  const broadside = wrap(bearing - ship.aiSide * Math.PI / 2);
  const delta = wrap(broadside - ship.angle);
  ship.turn = clamp(delta * 1.8, -1, 1);
  const idealMin = 200;
  const idealMax = 340;
  if (dist > idealMax) ship.throttle = 1;
  else if (dist < idealMin) ship.throttle = -0.45;
  else ship.throttle = 0.35;

  // Turn away from a shoreline directly ahead.
  const ahead = 90;
  if (islandBlocked(ship.x + Math.cos(ship.angle) * ahead, ship.y + Math.sin(ship.angle) * ahead, ship.hullRadius)) {
    ship.turn = ship.aiSide * 0.9;
    ship.throttle = Math.max(ship.throttle, 0.4);
  }

  const sideBearing = ship.angle + ship.aiSide * Math.PI / 2;
  const targetBearing = Math.atan2(m.player.y - ship.y, m.player.x - ship.x);
  const aimError = Math.abs(wrap(targetBearing - sideBearing));
  ship.fireDelay -= dt;
  if (dist < ship.type.range && aimError < 0.34 && ship.fireDelay <= 0) {
    const timerKey = ship.aiSide < 0 ? 'reloadPort' : 'reloadStarboard';
    if (ship[timerKey] <= 0 && fireBroadside(m, ship, ship.aiSide)) {
      ship[timerKey] = ship.type.reload;
      ship.fireDelay = 0.08;
    }
  }
}

function updateCannonballs(m, dt) {
  for (const ball of m.cannonballs) {
    if (ball.dead) continue;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.life -= dt;
    if (ball.life <= 0 || ball.x < -40 || ball.x > PIRATE_WORLD_W + 40 || ball.y < -40 || ball.y > PIRATE_WORLD_H + 40) {
      ball.dead = true;
      continue;
    }
    if (islandBlocked(ball.x, ball.y, 0)) {
      ball.dead = true;
      pushEffect(m, { type: 'splash', x: ball.x, y: ball.y, color: '#c9d8cf' });
      continue;
    }
    if (ball.owner === 'player') {
      for (const enemy of m.enemies) {
        if (enemy.dead) continue;
        if (Math.hypot(ball.x - enemy.x, ball.y - enemy.y) <= enemy.hullRadius + ball.radius) {
          ball.dead = true;
          m.hits += 1;
          damageShip(m, enemy, ball.damage, ball.x, ball.y);
          break;
        }
      }
    } else if (ball.sourceId !== m.player.id) {
      if (Math.hypot(ball.x - m.player.x, ball.y - m.player.y) <= m.player.hullRadius + ball.radius) {
        ball.dead = true;
        damageShip(m, m.player, ball.damage, ball.x, ball.y);
      }
    }
  }
  compact(m.cannonballs, (ball) => !ball.dead);
}

export function updatePirateVoyage(match, dt) {
  if (!match || match.paused || match.phase !== 'sailing') return match;
  const step = clamp(num(dt), 0, 0.05);
  if (step <= 0) return match;
  match.time += step;
  integrateShip(match, match.player, step, { player: true });
  for (const enemy of match.enemies) {
    if (enemy.dead) continue;
    updateEnemyAi(match, enemy, step);
    integrateShip(match, enemy, step);
  }
  resolveShipCollisions(match);
  updateCannonballs(match, step);
  compact(match.enemies, (enemy) => !enemy.dead);

  for (const effect of match.effects) effect.life -= step;
  compact(match.effects, (effect) => effect.life > 0);
  match.shake = Math.max(0, match.shake - step * 1.6);

  if (match.endless) {
    updateEndlessDirector(match, step);
  } else if (!match.bossSpawned && match.kills >= match.stage.targetKills) {
    spawnBoss(match);
  }

  match.spawnTimer -= step;
  if (match.spawnTimer <= 0 && (match.endless || (!match.bossSpawned && !match.bossDefeated))) {
    match.spawnTimer = match.endless
      ? Math.max(1.1, 2.6 - match.endless.surge * 0.08)
      : Math.max(1.4, 3.4 - match.stage.index * 0.25);
    if (match.enemies.length < enemyLimit(match)) spawnEnemy(match);
  }

  if (match.player.hp <= 0 && match.phase === 'sailing') match.phase = 'sunk';
  return match;
}

function spawnBoss(m) {
  const type = SHIP_BY_ID[m.stage.bossId];
  if (!type) return;
  const point = findSpawnPoint(m, 440, 640);
  const boss = makeShip(m, type, {
    x: point.x,
    y: point.y,
    angle: Math.atan2(m.player.y - point.y, m.player.x - point.x) + Math.PI / 2,
    owner: 'enemy',
  });
  boss.aiSide = m.rng() < 0.5 ? -1 : 1;
  boss.aiSideTimer = 8;
  boss.fireDelay = 1.2;
  m.enemies.push(boss);
  m.bossSpawned = true;
  m.bossShipId = boss.id;
  m.score += 300;
  pushMessage(m, `${type.title}: ${type.name} muncul di cakrawala!`, 'danger');
}

export function pirateDamageShip(match, shipId, amount = 9999) {
  if (!match) return false;
  const ship = shipId === match.player?.id ? match.player : match.enemies.find((entry) => entry.id === shipId);
  if (!ship) return false;
  damageShip(match, ship, Math.max(0, num(amount, 9999)), ship.x, ship.y);
  return true;
}

export function pirateSnapshot(match) {
  if (!match) return null;
  const near = pirateNearPort(match);
  const liveBoss = match.enemies.find((enemy) => enemy.type.boss && !enemy.dead);
  return {
    stageId: match.stageId,
    stageName: match.stage.name,
    stageIndex: match.stage.index,
    mode: match.mode || 'route',
    endless: !!match.endless,
    surge: match.endless?.surge || 0,
    surgeTimer: Math.max(0, Math.round((match.endless?.surgeTimer || 0) * 10) / 10),
    surgeNext: match.endless ? PIRATE_ENDLESS_CAPTAIN_EVERY - (match.endless.surge % PIRATE_ENDLESS_CAPTAIN_EVERY) : 0,
    captains: match.endless?.captains || 0,
    phase: match.phase,
    time: Math.round(match.time * 10) / 10,
    kills: match.kills,
    targetKills: match.stage.targetKills,
    bossSpawned: match.bossSpawned || (!!match.endless && !!liveBoss),
    bossDefeated: match.bossDefeated,
    bossId: match.stage.bossId,
    bossName: (match.endless ? liveBoss?.type.name : SHIP_BY_ID[match.stage.bossId]?.name) || '',
    bossHp: Math.round((liveBoss?.hp || 0) * 10) / 10,
    bossMaxHp: liveBoss?.maxHp || SHIP_BY_ID[match.stage.bossId]?.hp || 0,
    gold: match.gold,
    score: match.score,
    shotsFired: match.shotsFired,
    hits: match.hits,
    player: projectShip(match.player),
    reloadPort: Math.round(match.player.reloadPort * 100) / 100,
    reloadStarboard: Math.round(match.player.reloadStarboard * 100) / 100,
    nearPort: near ? { id: near.port.id, name: near.port.name, inRange: near.inRange, cost: PIRATE_DOCK_COST } : null,
    enemies: match.enemies.map((enemy) => ({ ...projectShip(enemy), spectral: !!enemy.type.spectral })),
    messages: match.messages.slice(-3),
    world: { width: PIRATE_WORLD_W, height: PIRATE_WORLD_H },
    islands: PIRATE_ISLANDS.map((island) => ({ id: island.id, name: island.name, x: island.x, y: island.y, r: island.r, port: !!island.port })),
  };
}

export function recordPirateEndless(progress, match) {
  const p = sanitizePirateProgress(progress);
  if (!match?.endless) return { progress: p, isRecord: false, endless: false };
  const score = Math.floor(match.score || 0);
  const surge = Math.max(1, Math.floor(match.endless.surge || 1));
  const kills = Math.max(0, Math.floor(match.kills || 0));
  const time = Math.round(match.time * 10) / 10;
  const isRecord = score > p.endless.bestScore;
  p.endless.runs += 1;
  p.endless.bestScore = Math.max(p.endless.bestScore, score);
  p.endless.bestSurge = Math.max(p.endless.bestSurge, surge);
  p.endless.bestKills = Math.max(p.endless.bestKills, kills);
  p.endless.totalKills += kills;
  if (!p.endless.bestTime || time > p.endless.bestTime) p.endless.bestTime = time;
  p.totalKills += kills;
  p.totalGold += Math.max(0, Math.floor(match.gold || 0));
  p.totalShots += Math.max(0, Math.floor(match.shotsFired || 0));
  p.totalHits = Math.min(p.totalShots, p.totalHits + Math.max(0, Math.floor(match.hits || 0)));
  p.bestScore = Math.max(p.bestScore, score);
  return {
    progress: p,
    isRecord,
    endless: true,
    win: false,
    stageName: PIRATE_ENDLESS_STAGE.name,
    score,
    surge,
    kills,
    time,
  };
}

export function recordPirateVoyage(progress, match) {
  const p = sanitizePirateProgress(progress);
  if (!match) return { progress: p, isRecord: false, win: false };
  const win = match.phase === 'cleared';
  const isRecord = match.score > p.bestScore;
  p.voyages += 1;
  if (win) p.wins += 1;
  else p.losses += 1;
  p.totalKills += Math.max(0, Math.floor(match.kills || 0));
  p.totalGold += Math.max(0, Math.floor(match.gold || 0));
  p.totalShots += Math.max(0, Math.floor(match.shotsFired || 0));
  p.totalHits += Math.max(0, Math.floor(match.hits || 0));
  p.bestScore = Math.max(p.bestScore, Math.floor(match.score || 0));
  const record = p.stages[match.stageId] || { runs: 0, cleared: false, bestScore: 0, bestTime: 0 };
  record.runs += 1;
  if (win) {
    record.cleared = true;
    record.bestScore = Math.max(record.bestScore, Math.floor(match.score || 0));
    if (!record.bestTime || match.time < record.bestTime) record.bestTime = Math.round(match.time * 10) / 10;
  }
  p.stages[match.stageId] = record;
  return {
    progress: p,
    isRecord,
    win,
    stageId: match.stageId,
    stageName: match.stage.name,
    time: Math.round(match.time * 10) / 10,
    score: Math.floor(match.score || 0),
    kills: match.kills,
  };
}

export function pirateSummary(progress) {
  const p = sanitizePirateProgress(progress);
  const cleared = PIRATE_STAGES.filter((stage) => p.stages[stage.id]?.cleared).length;
  const accuracy = p.totalShots ? Math.max(0, Math.min(100, Math.round((p.totalHits / p.totalShots) * 100))) : 0;
  return {
    ...p,
    cleared,
    total: PIRATE_STAGES.length,
    winRate: p.voyages ? Math.round((p.wins / p.voyages) * 100) : 0,
    accuracy,
    islands: PIRATE_ISLANDS.length,
    ports: PIRATE_PORTS.length,
    shipTypes: PIRATE_SHIP_TYPES.length,
    bosses: PIRATE_BOSS_TYPES.length,
    endlessBest: { ...p.endless },
  };
}

// ── Renderer ───────────────────────────────────────────────────────────────
// View culling: the sea is bigger than any screen, so only islands that can
// actually be seen are drawn. Exported so the tests can prove the cull works.
export function pirateVisibleIslands(match, width = 960, height = 540, zoom = 0.9) {
  const camera = pirateCamera(match, width, height, zoom);
  const margin = 100;
  const left = camera.x - camera.viewW / 2 - margin;
  const right = camera.x + camera.viewW / 2 + margin;
  const top = camera.y - camera.viewH / 2 - margin;
  const bottom = camera.y + camera.viewH / 2 + margin;
  return PIRATE_ISLANDS.filter((island) => (
    island.x + island.r >= left && island.x - island.r <= right
    && island.y + island.r >= top && island.y - island.r <= bottom
  ));
}

export function pirateCamera(match, width, height, zoom = 0.9) {
  const viewW = width / zoom;
  const viewH = height / zoom;
  const px = match?.player?.x || 0;
  const py = match?.player?.y || 0;
  return {
    zoom,
    x: viewW >= PIRATE_WORLD_W ? PIRATE_WORLD_W / 2 : clamp(px, viewW / 2, PIRATE_WORLD_W - viewW / 2),
    y: viewH >= PIRATE_WORLD_H ? PIRATE_WORLD_H / 2 : clamp(py, viewH / 2, PIRATE_WORLD_H - viewH / 2),
    viewW,
    viewH,
  };
}

export function pirateScreenToWorld(match, x, y, width, height, zoom = 0.9) {
  const camera = pirateCamera(match, width, height, zoom);
  return {
    x: camera.x + (x - width / 2) / camera.zoom,
    y: camera.y + (y - height / 2) / camera.zoom,
  };
}

function screenShake(match) {
  if (!match.shake) return { x: 0, y: 0 };
  const amount = match.shake * 9;
  return { x: Math.sin(match.time * 71) * amount, y: Math.cos(match.time * 53) * amount };
}

// One gradient per canvas and size; recreating it every frame was wasted work.
const seaGradientCache = new WeakMap();

function drawSeaBackground(ctx, width, height, time) {
  let cached = seaGradientCache.get(ctx);
  if (!cached || cached.width !== width || cached.height !== height) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#11252a');
    gradient.addColorStop(0.55, '#16383d');
    gradient.addColorStop(1, '#0b2025');
    cached = { width, height, gradient };
    seaGradientCache.set(ctx, cached);
  }
  ctx.fillStyle = cached.gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = '#9ac8c1';
  ctx.lineWidth = 1;
  for (let row = 0; row < 14; row += 1) {
    const y = ((row * 67 + time * 9) % (height + 80)) - 40;
    ctx.beginPath();
    for (let x = -20; x <= width + 20; x += 26) {
      const wave = Math.sin((x + row * 31 + time * 24) * 0.025) * 5;
      if (x === -20) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// Reusing one radial gradient per island saves ten gradient objects a frame
// while keeping the same raster path.
const islandGradientCache = new WeakMap();

function islandSand(ctx, island) {
  let cache = islandGradientCache.get(ctx);
  if (!cache) {
    cache = new Map();
    islandGradientCache.set(ctx, cache);
  }
  let gradient = cache.get(island.id);
  if (!gradient) {
    gradient = ctx.createRadialGradient(-island.r * 0.25, -island.r * 0.3, 6, 0, 0, island.r);
    gradient.addColorStop(0, island.accent);
    gradient.addColorStop(0.58, '#a58b63');
    gradient.addColorStop(1, island.color);
    cache.set(island.id, gradient);
  }
  return gradient;
}

function drawIsland(ctx, island, time) {
  ctx.save();
  ctx.translate(island.x, island.y);
  islandArt(ctx, island, time);
  ctx.restore();
}

function islandArt(ctx, island, time) {
  ctx.fillStyle = 'rgba(6, 18, 20, 0.48)';
  ctx.beginPath();
  ctx.arc(8, 14, island.r + 6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = islandSand(ctx, island);
  ctx.beginPath();
  ctx.arc(0, 0, island.r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(38, 56, 43, 0.92)';
  ctx.beginPath();
  ctx.arc(-island.r * 0.12, -island.r * 0.16, island.r * 0.58, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(61, 82, 56, 0.86)';
  ctx.beginPath();
  ctx.arc(island.r * 0.18, island.r * 0.12, island.r * 0.38, 0, TAU);
  ctx.fill();

  // Palm silhouettes, deterministic per island.
  const palms = island.id.length % 3 + 2;
  for (let i = 0; i < palms; i += 1) {
    const angle = island.id.charCodeAt(i % island.id.length) * 0.7 + i * 2.1;
    const px = Math.cos(angle) * island.r * 0.32;
    const py = Math.sin(angle) * island.r * 0.26;
    const sway = Math.sin(time * 1.4 + i) * 2;
    ctx.strokeStyle = '#2b2d22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(px + sway, py - 23, px + sway * 1.5, py - 42);
    ctx.stroke();
    ctx.strokeStyle = '#435038';
    for (let leaf = 0; leaf < 5; leaf += 1) {
      const la = leaf * 1.25 + angle * 0.2;
      ctx.beginPath();
      ctx.moveTo(px + sway * 1.5, py - 42);
      ctx.lineTo(px + sway * 1.5 + Math.cos(la) * 18, py - 42 + Math.sin(la) * 11);
      ctx.stroke();
    }
  }

  if (island.port) {
    ctx.fillStyle = '#4a3423';
    ctx.fillRect(island.r * 0.36, -8, 54, 14);
    ctx.fillStyle = '#755238';
    for (let i = 0; i < 4; i += 1) ctx.fillRect(island.r * 0.36 + i * 14, -8, 7, 14);
    ctx.strokeStyle = '#d7c499';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(island.r * 0.36 + 48, -9);
    ctx.lineTo(island.r * 0.36 + 48, -62);
    ctx.stroke();
    ctx.fillStyle = '#d3a65d';
    ctx.beginPath();
    ctx.moveTo(island.r * 0.36 + 48, -62);
    ctx.lineTo(island.r * 0.36 + 88, -52);
    ctx.lineTo(island.r * 0.36 + 48, -41);
    ctx.closePath();
    ctx.fill();
  }
}

function drawShip(ctx, ship, time, player = false) {
  if (ship.dead) return;
  const type = ship.type;
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  if (player) {
    ctx.strokeStyle = 'rgba(255, 213, 132, 0.24)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, ship.hullRadius + 13, 0, TAU);
    ctx.stroke();
  }
  if (type.spectral) {
    ctx.shadowColor = '#7ad7c6';
    ctx.shadowBlur = 18;
  }
  // Wake: one path and one stroke per hull instead of one per segment.
  if (ship.wake?.length > 1) {
    ctx.strokeStyle = player ? 'rgba(223, 239, 225, 0.34)' : 'rgba(184, 215, 206, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.wake[0].x - ship.x, ship.wake[0].y - ship.y);
    for (let i = 1; i < ship.wake.length; i += 1) {
      ctx.lineTo(ship.wake[i].x - ship.x, ship.wake[i].y - ship.y);
    }
    ctx.stroke();
  }

  const half = type.length / 2;
  const beam = type.radius * 0.86;
  ctx.fillStyle = ship.hitFlash > 0 ? '#ffe2b0' : type.color;
  ctx.strokeStyle = '#1b1b17';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(half, 0);
  ctx.quadraticCurveTo(half * 0.58, -beam, -half * 0.55, -beam * 0.78);
  ctx.lineTo(-half, 0);
  ctx.lineTo(-half * 0.55, beam * 0.78);
  ctx.quadraticCurveTo(half * 0.58, beam, half, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(38, 29, 22, 0.8)';
  ctx.fillRect(-half * 0.28, -beam * 0.45, half * 0.48, beam * 0.9);

  // Masts and sails.
  const mastX = [half * 0.32, -half * 0.28];
  for (const mx of mastX) {
    ctx.strokeStyle = '#3b2b1e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx, -beam * 0.1);
    ctx.lineTo(mx, -beam * 0.85);
    ctx.stroke();
    ctx.fillStyle = type.sail;
    ctx.globalAlpha = type.spectral ? 0.68 : 0.92;
    ctx.beginPath();
    ctx.moveTo(mx - 2, -beam * 0.75);
    ctx.quadraticCurveTo(mx + 20, -beam * 0.6, mx + 2, -beam * 0.2);
    ctx.lineTo(mx - 12, -beam * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (type.boss) {
    ctx.fillStyle = '#d6ba78';
    ctx.font = 'bold 15px serif';
    ctx.textAlign = 'center';
    ctx.fillText('☠', 0, 5);
  }
  ctx.shadowBlur = 0;
  ctx.restore();

  if (!player) {
    const pct = clamp(ship.hp / ship.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(8, 10, 10, 0.72)';
    ctx.fillRect(ship.x - 32, ship.y - type.radius - 25, 64, 6);
    ctx.fillStyle = type.boss ? '#e4b65f' : '#c56f55';
    ctx.fillRect(ship.x - 31, ship.y - type.radius - 24, 62 * pct, 4);
    if (type.boss) {
      ctx.fillStyle = '#f1ddaf';
      ctx.font = 'bold 9px serif';
      ctx.textAlign = 'center';
      ctx.fillText(type.title, ship.x, ship.y - type.radius - 31);
    }
  }
}

function drawCannonball(ctx, ball) {
  ctx.save();
  ctx.strokeStyle = ball.color;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ball.x - ball.vx * 0.025, ball.y - ball.vy * 0.025);
  ctx.lineTo(ball.x, ball.y);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = ball.color;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(ball.x - 1.6, ball.y - 1.6, 2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawEffects(ctx, m, onScreen = null) {
  for (const effect of m.effects) {
    if (onScreen && !onScreen(effect.x, effect.y, 200)) continue;
    const t = clamp(effect.life / effect.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = t;
    if (effect.type === 'splash' || effect.type === 'muzzle') {
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 2;
      const radius = (1 - t) * (effect.type === 'sink' ? 70 : 24) + 5;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, TAU);
      ctx.stroke();
    } else if (effect.type === 'hit') {
      ctx.fillStyle = effect.color;
      for (let i = 0; i < 5; i += 1) {
        const angle = i * 1.256 + (1 - t);
        ctx.fillRect(effect.x + Math.cos(angle) * (1 - t) * 19, effect.y + Math.sin(angle) * (1 - t) * 19, 2, 2);
      }
    } else if (effect.type === 'sink') {
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = effect.big ? 4 : 2;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, (1 - t) * (effect.big ? 120 : 52) + 4, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = t * 0.4;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, (1 - t) * (effect.big ? 190 : 82) + 8, 0, TAU);
      ctx.stroke();
    } else if (effect.type === 'repair') {
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, (1 - t) * 62 + 16, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawMiniMap(ctx, m, width, height) {
  const w = 164;
  const h = 104;
  const x = width - w - 14;
  const y = height - h - 14;
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = 'rgba(8, 15, 16, 0.78)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(219, 194, 138, 0.38)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const sx = w / PIRATE_WORLD_W;
  const sy = h / PIRATE_WORLD_H;
  for (const island of PIRATE_ISLANDS) {
    ctx.fillStyle = island.port ? 'rgba(218, 184, 115, 0.65)' : 'rgba(105, 129, 103, 0.55)';
    ctx.beginPath();
    ctx.arc(x + island.x * sx, y + island.y * sy, Math.max(2, island.r * sx), 0, TAU);
    ctx.fill();
  }
  for (const enemy of m.enemies) {
    ctx.fillStyle = enemy.type.boss ? '#f0c068' : '#cf765e';
    ctx.fillRect(x + enemy.x * sx - 1.5, y + enemy.y * sy - 1.5, 3, 3);
  }
  ctx.fillStyle = '#f5e1ad';
  ctx.beginPath();
  ctx.arc(x + m.player.x * sx, y + m.player.y * sy, 3.2, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#f5e1ad';
  ctx.beginPath();
  ctx.moveTo(x + m.player.x * sx, y + m.player.y * sy);
  ctx.lineTo(x + m.player.x * sx + Math.cos(m.player.angle) * 9, y + m.player.y * sy + Math.sin(m.player.angle) * 9);
  ctx.stroke();
  ctx.fillStyle = '#9d8e70';
  ctx.font = '7px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('PETA LAUT TERBUKA', x + 7, y + 12);
  ctx.restore();
}

export function renderPirateVoyage(ctx, match, { width = 960, height = 540, zoom = 0.9, time = 0 } = {}) {
  if (!ctx || !match) return;
  const w = Math.max(1, num(width, 960));
  const h = Math.max(1, num(height, 540));
  drawSeaBackground(ctx, w, h, match.time || time);
  const camera = pirateCamera(match, w, h, zoom);
  const shake = screenShake(match);
  ctx.save();
  ctx.translate(w / 2 + shake.x, h / 2 + shake.y);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  // Sea lanes and shallows.
  ctx.strokeStyle = 'rgba(151, 190, 180, 0.08)';
  ctx.lineWidth = 20;
  ctx.setLineDash([34, 26]);
  ctx.beginPath();
  ctx.moveTo(240, 1380);
  ctx.bezierCurveTo(900, 1180, 1620, 1250, 2140, 1010);
  ctx.bezierCurveTo(2520, 840, 2800, 990, 3100, 820);
  ctx.stroke();
  ctx.setLineDash([]);

  // Everything outside the camera is skipped; the minimap still shows the world.
  const left = camera.x - camera.viewW / 2;
  const right = camera.x + camera.viewW / 2;
  const top = camera.y - camera.viewH / 2;
  const bottom = camera.y + camera.viewH / 2;
  const onScreen = (x, y, margin) => x >= left - margin && x <= right + margin && y >= top - margin && y <= bottom + margin;

  for (const island of pirateVisibleIslands(match, w, h, zoom)) drawIsland(ctx, island, match.time || time);
  drawEffects(ctx, match, onScreen);
  for (const ship of match.enemies) if (onScreen(ship.x, ship.y, 160)) drawShip(ctx, ship, match.time || time);
  drawShip(ctx, match.player, match.time || time, true);
  for (const ball of match.cannonballs) if (onScreen(ball.x, ball.y, 24)) drawCannonball(ctx, ball);

  // Direction ribbon used by touch players.
  ctx.strokeStyle = 'rgba(247, 219, 158, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(match.player.x, match.player.y);
  ctx.lineTo(match.player.x + Math.cos(match.player.angle) * 120, match.player.y + Math.sin(match.player.angle) * 120);
  ctx.stroke();
  ctx.restore();

  drawMiniMap(ctx, match, w, h);

  // Compass.
  ctx.save();
  ctx.translate(36, 42);
  ctx.strokeStyle = 'rgba(229, 203, 146, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 19, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#f0d9a2';
  ctx.font = 'bold 10px serif';
  ctx.textAlign = 'center';
  ctx.fillText('U', 0, -25);
  ctx.restore();
}

export { SHIP_BY_ID as PIRATE_SHIP_BY_ID };
