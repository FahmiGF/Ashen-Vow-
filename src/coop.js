// Ashen Vow — Co-op (v0.7.0)
// Host-authoritative cooperative session layer for 2–4 players.
//
// This module is intentionally transport-agnostic and DOM-free: the browser
// shell injects a WebSocket constructor, the Node test suite uses an in-memory
// transport. It owns the lobby, party scaling, snapshot compression/delta,
// interpolation, revival rules, rate limits and fair loot allocation. Combat
// remains authoritative in src/core.js on the host.

export const COOP_VERSION = '0.7.0';
export const COOP_MAX_PLAYERS = 4;
export const COOP_TICK_HZ = 20;
export const COOP_INTEREST_RADIUS = 900;
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// ── modes and scaling ───────────────────────────────────────────────────────
export const COOP_MODES = [
  { id: 'campaign', name: 'Campaign Co-op', players: '2–4', desc: 'Selesaikan kampanye bersama.' },
  { id: 'labyrinth', name: 'Infinite Labyrinth Co-op', players: '2–4', desc: 'Bertahan dari gelombang tanpa akhir.' },
  { id: 'boss_rush', name: 'Boss Rush Co-op', players: '2–4', desc: 'Bos berurutan tanpa jeda.' },
  { id: 'world_boss', name: 'World Boss Hunt', players: '2–4', desc: 'Lacak dan kalahkan bos dunia.' },
  { id: 'survival', name: 'Survival Arena', players: '2–4', desc: 'Gelombang yang semakin sulit.' },
  { id: 'custom', name: 'Custom Dungeon', players: '2–4', desc: 'Mainkan peta buatan pemain.' },
  { id: 'training', name: 'Training Arena', players: '2–4', desc: 'Latih build dan kombat.' },
  { id: 'expedition', name: 'Challenge Expedition', players: '2–4', desc: 'Misi acak dengan modifier.' },
];

export const COOP_MODE_BY_ID = Object.fromEntries(COOP_MODES.map((m) => [m.id, m]));

/** Starting tuning values; deliberately not simple health multiplication. */
export const PARTY_SCALING = [
  { size: 1, hp: 1, dmg: 1, elites: 1 },
  { size: 2, hp: 1.65, dmg: 1.15, elites: 1.15 },
  { size: 3, hp: 2.2, dmg: 1.25, elites: 1.3 },
  { size: 4, hp: 2.8, dmg: 1.35, elites: 1.45 },
];

export function partyScaling(size) {
  const n = Math.max(1, Math.min(COOP_MAX_PLAYERS, Math.round(Number(size) || 1)));
  return PARTY_SCALING[n - 1];
}

export function scaledEncounter(encounter, partySize) {
  const scaling = partyScaling(partySize);
  if (!encounter) return encounter;
  return {
    ...encounter,
    enemies: (encounter.enemies || []).map((enemy) => ({
      ...enemy,
      hpScale: (enemy.hpScale || 1) * scaling.hp,
      dmgScale: (enemy.dmgScale || 1) * scaling.dmg,
    })),
    boss: encounter.boss
      ? {
          ...encounter.boss,
          overrides: {
            ...(encounter.boss.overrides || {}),
            maxHp: Math.round((encounter.boss.overrides?.maxHp || 1) * scaling.hp),
            contact: Math.round((encounter.boss.overrides?.contact || 1) * scaling.dmg),
          },
        }
      : null,
  };
}

// ── revival ─────────────────────────────────────────────────────────────────
export const REVIVE_RULES = {
  downedBleedout: 25,
  reviveTime: 2.4,
  reviveRange: 120,
  reviveHp: 0.5,
  tokensPerPlayer: 1,
  bossInterrupt: true,
};

export function createPartyState(lobby) {
  const players = {};
  for (const player of lobby?.players || []) {
    players[player.id] = {
      id: player.id,
      name: player.name,
      classId: player.classId,
      hp: 100,
      maxHp: 100,
      downed: false,
      bleedout: 0,
      reviveProgress: 0,
      tokens: REVIVE_RULES.tokensPerPlayer,
      contribution: 0,
      damageDealt: 0,
      damageTaken: 0,
      revives: 0,
      alive: true,
    };
  }
  return {
    players,
    teamLives: lobby?.rules?.ironbound ? 0 : Math.max(1, (lobby?.players?.length || 1) - 1),
    wipe: false,
  };
}

export function partyIsWiped(party) {
  return !!party && Object.values(party.players).every((p) => p.downed || p.hp <= 0 || !p.alive);
}

export function applyPartyDamage(party, playerId, amount) {
  const player = party?.players?.[playerId];
  if (!player || player.downed || !player.alive) return { applied: 0, downed: false, wiped: false };
  const applied = Math.max(0, Math.round(Number(amount) || 0));
  player.hp = Math.max(0, player.hp - applied);
  player.damageTaken += applied;
  if (player.hp <= 0) {
    player.downed = true;
    player.bleedout = REVIVE_RULES.downedBleedout;
    player.reviveProgress = 0;
    return { applied, downed: true, wiped: partyIsWiped(party) };
  }
  return { applied, downed: false, wiped: false };
}

/**
 * Advance downed timers and revival beams. `helpers` are player ids currently
 * holding the revive interaction; they must be alive, in range, and not downed.
 */
export function tickParty(party, dt, helpers = {}) {
  if (!party) return { revived: [], wiped: false, expired: [] };
  const revived = [];
  const expired = [];
  for (const player of Object.values(party.players)) {
    if (!player.downed) continue;
    player.bleedout = Math.max(0, player.bleedout - dt);
    const helperIds = Object.entries(helpers)
      .filter(([, helper]) => helper?.target === player.id && helper?.active)
      .map(([id]) => id)
      .filter((id) => {
        const helper = party.players[id];
        return helper && !helper.downed && helper.alive && helper.hp > 0;
      });
    if (helperIds.length) {
      player.reviveProgress += dt * (1 + (helperIds.length - 1) * 0.5);
      if (player.reviveProgress >= REVIVE_RULES.reviveTime) {
        player.downed = false;
        player.reviveProgress = 0;
        player.hp = Math.max(1, Math.round(player.maxHp * REVIVE_RULES.reviveHp));
        player.bleedout = 0;
        player.revives += 1;
        for (const id of helperIds) party.players[id].contribution += 25;
        revived.push(player.id);
      }
    } else {
      player.reviveProgress = Math.max(0, player.reviveProgress - dt * 0.5);
      if (player.bleedout <= 0) {
        player.alive = false;
        if (party.teamLives > 0) {
          party.teamLives -= 1;
          player.alive = true;
          player.downed = false;
          player.hp = Math.round(player.maxHp * 0.35);
          player.tokens = Math.max(0, player.tokens - 1);
          revived.push(player.id);
        } else {
          expired.push(player.id);
        }
      }
    }
  }
  party.wipe = partyIsWiped(party) || Object.values(party.players).some((p) => !p.alive);
  return { revived, wiped: party.wipe, expired };
}

// ── lobby ────────────────────────────────────────────────────────────────────
export function roomCodeFromSeed(seed) {
  let value = Math.abs(Math.floor(Number(seed) || 1)) || 1;
  let code = '';
  for (let i = 0; i < 5; i += 1) {
    code += ROOM_CODE_ALPHABET[value % ROOM_CODE_ALPHABET.length];
    value = Math.floor(value / ROOM_CODE_ALPHABET.length) + 7;
  }
  return code;
}

export function hashPassword(password) {
  const text = String(password || '');
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function sanitizePlayerName(name) {
  const clean = String(name || '').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 18);
  return clean || 'Penjaga Tanpa Nama';
}

export function createLobby(options = {}) {
  const seed = Math.abs(Math.floor(Number(options.seed) || Date.now())) || 1;
  const modeId = COOP_MODE_BY_ID[options.modeId] ? options.modeId : 'labyrinth';
  const host = {
    id: options.hostId || 'p1',
    name: sanitizePlayerName(options.hostName || 'Warden'),
    classId: options.classId || 'sera',
    leader: true,
    ready: true,
    host: true,
    joinedAt: Date.now(),
  };
  return {
    version: 1,
    code: options.code || roomCodeFromSeed(seed),
    seed,
    name: options.name ? String(options.name).slice(0, 28) : 'ASHEN VOW PARTY',
    modeId,
    difficulty: options.difficulty || 'normal',
    visible: options.visible !== false,
    password: options.password ? hashPassword(options.password) : '',
    players: [host],
    rules: { ironbound: !!options.ironbound, friendlyFire: false, sharedCurrency: !!options.sharedCurrency },
    started: false,
    createdAt: Date.now(),
  };
}

export function findOpenSlot(lobby) {
  if (!lobby) return null;
  if (lobby.players.length >= COOP_MAX_PLAYERS) return null;
  const used = new Set(lobby.players.map((p) => p.id));
  for (let i = 1; i <= COOP_MAX_PLAYERS; i += 1) if (!used.has(`p${i}`)) return `p${i}`;
  return null;
}

export function joinLobby(lobby, options = {}) {
  if (!lobby) return { ok: false, error: 'Lobi tidak ditemukan.' };
  if (lobby.started) return { ok: false, error: 'Sesi sudah dimulai.' };
  if (lobby.players.length >= COOP_MAX_PLAYERS) return { ok: false, error: 'Party penuh (4/4).' };
  if (lobby.password && hashPassword(options.password || '') !== lobby.password) {
    return { ok: false, error: 'Kata sandi salah.' };
  }
  const id = findOpenSlot(lobby);
  if (!id) return { ok: false, error: 'Tidak ada slot kosong.' };
  const player = {
    id,
    name: sanitizePlayerName(options.name || `Penjaga ${id.slice(1)}`),
    classId: options.classId || 'sera',
    leader: false,
    ready: false,
    host: false,
    joinedAt: Date.now(),
  };
  return {
    ok: true,
    player,
    lobby: { ...lobby, players: [...lobby.players, player] },
  };
}

export function setReady(lobby, playerId, ready) {
  if (!lobby) return lobby;
  return {
    ...lobby,
    players: lobby.players.map((player) => (player.id === playerId ? { ...player, ready: !!ready } : player)),
  };
}

export function setPartyLeader(lobby, playerId) {
  if (!lobby) return lobby;
  return {
    ...lobby,
    players: lobby.players.map((player) => ({ ...player, leader: player.id === playerId })),
  };
}

export function canStartLobby(lobby) {
  if (!lobby || lobby.started) return { ok: false, reason: 'Sesi tidak tersedia.' };
  if (lobby.players.length < 1) return { ok: false, reason: 'Butuh minimal satu pemain.' };
  if (lobby.players.some((player) => !player.leader && !player.ready)) {
    return { ok: false, reason: 'Masih ada pemain yang belum siap.' };
  }
  return { ok: true, reason: '' };
}

export function startLobby(lobby) {
  const check = canStartLobby(lobby);
  if (!check.ok) return { ok: false, error: check.reason, lobby };
  return { ok: true, lobby: { ...lobby, started: true, startedAt: Date.now() } };
}

// ── snapshot codec (quantized, delta-capable) ───────────────────────────────
const encodeCoord = (value) => Math.max(-32768, Math.min(32767, Math.round((Number(value) || 0) * 4)));
const decodeCoord = (value) => (Number(value) || 0) / 4;

export function sanitizeRoomCode(value) {
  const code = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  return code || 'LOBBY';
}

function encodeEntity(entity) {
  return [
    entity.slot ?? 0,
    encodeCoord(entity.x),
    encodeCoord(entity.y),
    Math.round(entity.hp || 0),
    Math.round(entity.maxHp || 0),
    Math.round(entity.stateCode || 0),
    Math.round(entity.facing || 1),
    entity.id ? String(entity.id).slice(0, 18) : '',
  ];
}

function decodeEntity(row) {
  return {
    slot: row[0] | 0,
    x: decodeCoord(row[1]),
    y: decodeCoord(row[2]),
    hp: row[3] | 0,
    maxHp: row[4] | 0,
    stateCode: row[5] | 0,
    facing: row[6] || 1,
    id: typeof row[7] === 'string' ? row[7] : '',
  };
}

/** Quantized full keyframe. Roughly 5-8x smaller than raw JSON floats. */
export function encodeSnapshot(state) {
  if (!state) return null;
  return {
    v: 1,
    t: Math.round(Number(state.t) || 0),
    k: 1,
    sc: state.scene || null,
    ri: Number.isInteger(state.roomIndex) ? state.roomIndex : null,
    rn: state.roomName || '',
    ty: state.types || [],
    p: (state.players || []).map(encodeEntity),
    e: (state.enemies || []).map(encodeEntity),
    b: state.boss ? encodeEntity(state.boss) : null,
    bm: state.bossMeta || null,
    pr: (state.projectiles || []).map((pr) => [encodeCoord(pr.x), encodeCoord(pr.y), Math.round(pr.typeCode || 0)]),
    w: state.wave ? { i: Math.round(state.wave.index || 0), n: Math.round(state.wave.total || 0), k: Math.round(state.wave.kindCode || 0) } : null,
    l: state.lab || null,
    s: state.session ? { ...state.session } : null,
  };
}

export function decodeSnapshot(data) {
  if (!data || data.v !== 1) return null;
  return {
    t: data.t || 0,
    scene: data.sc || null,
    roomIndex: Number.isInteger(data.ri) ? data.ri : null,
    roomName: data.rn || '',
    types: data.ty || [],
    players: (data.p || []).map(decodeEntity),
    enemies: (data.e || []).map(decodeEntity),
    boss: data.b ? decodeEntity(data.b) : null,
    bossMeta: data.bm || null,
    projectiles: (data.pr || []).map((row) => ({ x: decodeCoord(row[0]), y: decodeCoord(row[1]), typeCode: row[2] | 0 })),
    wave: data.w ? { index: data.w.i | 0, total: data.w.n | 0, kindCode: data.w.k | 0 } : null,
    lab: data.l || null,
    session: data.s || null,
  };
}

/**
 * Delta frame against a keyframe. Entities are matched by slot; missing slots
 * are treated as removed. Only changed entities are sent, which keeps a busy
 * boss fight affordable without dropping gameplay state.
 */
export function encodeDelta(base, next) {
  if (!next) return null;
  if (!base) return encodeSnapshot(next);
  const prevEnemies = new Map((base.enemies || []).map((entity) => [entity.slot, entity]));
  const enemies = [];
  for (const entity of next.enemies || []) {
    const before = prevEnemies.get(entity.slot);
    if (!before || before.x !== entity.x || before.y !== entity.y || before.hp !== entity.hp || before.stateCode !== entity.stateCode) {
      enemies.push(encodeEntity(entity));
    }
    prevEnemies.delete(entity.slot);
  }
  const removed = [...prevEnemies.keys()];
  const prevPlayers = new Map((base.players || []).map((player) => [player.slot ?? player.id, player]));
  const changedPlayers = [];
  for (const player of next.players || []) {
    const key = player.slot ?? player.id;
    const before = prevPlayers.get(key);
    prevPlayers.delete(key);
    if (!before || before.x !== player.x || before.y !== player.y || before.hp !== player.hp || before.facing !== player.facing || before.stateCode !== player.stateCode) {
      changedPlayers.push(encodeEntity(player));
    }
  }
  const removedPlayers = [...prevPlayers.keys()];
  const bossChanged = !base.boss || !next.boss
    ? !!base.boss !== !!next.boss
    : base.boss.x !== next.boss.x || base.boss.y !== next.boss.y || base.boss.hp !== next.boss.hp || base.boss.stateCode !== next.boss.stateCode;
  const waveChanged = JSON.stringify(base.wave || null) !== JSON.stringify(next.wave || null);
  const sameProjectiles = JSON.stringify(base.projectiles || []) === JSON.stringify(next.projectiles || []);
  return {
    v: 1,
    k: 0,
    t: Math.round(Number(next.t) || 0),
    sc: next.scene || undefined,
    ri: Number.isInteger(next.roomIndex) ? next.roomIndex : undefined,
    rn: next.roomName || undefined,
    ty: next.types || undefined,
    p: changedPlayers,
    px: removedPlayers.length ? removedPlayers : undefined,
    e: enemies,
    x: removed,
    b: bossChanged && next.boss ? encodeEntity(next.boss) : null,
    br: bossChanged && !next.boss ? 1 : undefined,
    bm: bossChanged ? next.bossMeta || null : undefined,
    pr: sameProjectiles ? undefined : (next.projectiles || []).map((pr) => [encodeCoord(pr.x), encodeCoord(pr.y), Math.round(pr.typeCode || 0)]),
    ps: sameProjectiles ? 1 : 0,
    w: waveChanged && next.wave ? { i: Math.round(next.wave.index || 0), n: Math.round(next.wave.total || 0), k: Math.round(next.wave.kindCode || 0) } : null,
    l: next.lab || null,
    s: next.session ? { ...next.session } : null,
  };
}

export function applyDelta(base, delta) {
  if (!delta) return base;
  if (delta.k === 1) return decodeSnapshot(delta);
  const next = decodeSnapshot({ ...delta, k: 1 });
  const removedPlayers = new Set(delta.px || []);
  const players = (base?.players || [])
    .filter((player) => !removedPlayers.has(player.slot ?? player.id))
    .map((player) => ({ ...player }));
  for (const changed of next.players) {
    const index = players.findIndex((player) => player.slot === changed.slot);
    if (index >= 0) players[index] = changed;
    else players.push(changed);
  }
  const enemies = new Map((base?.enemies || []).map((entity) => [entity.slot, { ...entity }]));
  for (const removed of delta.x || []) enemies.delete(removed);
  for (const changed of next.enemies) enemies.set(changed.slot, changed);
  return {
    t: next.t,
    scene: delta.sc || base?.scene || null,
    roomIndex: Number.isInteger(delta.ri) ? delta.ri : (base?.roomIndex ?? null),
    roomName: delta.rn || base?.roomName || '',
    types: delta.ty || base?.types || [],
    players,
    enemies: [...enemies.values()],
    boss: delta.br ? null : (next.boss || base?.boss || null),
    bossMeta: delta.br ? null : (next.bossMeta || base?.bossMeta || null),
    projectiles: delta.ps ? (base?.projectiles || []) : next.projectiles,
    wave: next.wave || base?.wave || null,
    lab: next.lab || base?.lab || null,
    session: next.session || base?.session || null,
  };
}

/** Interest management: clients only receive nearby enemies. */
export function filterByInterest(state, centerX, centerY = 300, radius = COOP_INTEREST_RADIUS) {
  if (!state) return state;
  const enemies = (state.enemies || []).filter((enemy) => {
    const dx = (enemy.x || 0) - centerX;
    const dy = (enemy.y || 0) - centerY;
    return dx * dx + dy * dy <= radius * radius;
  });
  return { ...state, enemies };
}

// ── interpolation ───────────────────────────────────────────────────────────
export class SnapshotInterpolator {
  constructor({ delay = 0.11, maxSamples = 8 } = {}) {
    this.delay = delay;
    this.maxSamples = maxSamples;
    this.samples = [];
  }

  push(snapshot) {
    if (!snapshot) return;
    if (this.samples.length && snapshot.t < this.samples[this.samples.length - 1].t) return;
    this.samples.push(snapshot);
    while (this.samples.length > this.maxSamples) this.samples.shift();
  }

  sampleTime(nowMs) {
    return (Number(nowMs) || 0) / 1000 - this.delay;
  }

  sample(nowMs) {
    if (!this.samples.length) return null;
    const target = this.sampleTime(nowMs);
    if (this.samples.length === 1) return this.samples[0];
    let a = this.samples[0];
    let b = this.samples[this.samples.length - 1];
    for (let i = 0; i < this.samples.length - 1; i += 1) {
      if (this.samples[i].t <= target && this.samples[i + 1].t >= target) {
        a = this.samples[i];
        b = this.samples[i + 1];
        break;
      }
    }
    const span = b.t - a.t || 0.001;
    const alpha = Math.max(0, Math.min(1, (target - a.t) / span));
    return interpolateSnapshots(a, b, alpha);
  }
}

export function interpolateSnapshots(a, b, alpha) {
  if (!a) return b;
  if (!b) return a;
  const lerp = (from, to) => from + (to - from) * alpha;
  const enemyMap = new Map((b.enemies || []).map((enemy) => [enemy.slot, enemy]));
  const enemies = (a.enemies || []).map((enemy) => {
    const other = enemyMap.get(enemy.slot) || enemy;
    enemyMap.delete(enemy.slot);
    return { ...other, x: lerp(enemy.x, other.x), y: lerp(enemy.y, other.y) };
  });
  for (const enemy of enemyMap.values()) enemies.push(enemy);
  const p = (a.players || [])[0];
  const q = (b.players || [])[0];
  const player = p && q ? { ...q, x: lerp(p.x, q.x), y: lerp(p.y, q.y) } : q || p;
  return {
    t: b.t,
    players: player ? [player] : [],
    enemies,
    boss: b.boss || a.boss,
    projectiles: b.projectiles || [],
    wave: b.wave || a.wave,
    session: b.session || a.session,
  };
}

// ── validation, rate limits, loot ──────────────────────────────────────────
export const MAX_MOVE_SPEED = 1200;

/** Reject teleports / impossible movement reported by a client. */
export function validateMovement(prev, next, dt) {
  if (!prev || !next) return false;
  const dtSafe = Math.max(1 / 120, Number(dt) || 0);
  const dx = (Number(next.x) || 0) - (Number(prev.x) || 0);
  const dy = (Number(next.y) || 0) - (Number(prev.y) || 0);
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= MAX_MOVE_SPEED * dtSafe * 1.6 + 4;
}

export function createRateLimiter({ tokens = 60, refillPerSecond = 30, now = () => Date.now() } = {}) {
  const buckets = new Map();
  return {
    take(id, cost = 1) {
      const t = now();
      const bucket = buckets.get(id) || { tokens, updated: t };
      bucket.tokens = Math.min(tokens, bucket.tokens + ((t - bucket.updated) / 1000) * refillPerSecond);
      bucket.updated = t;
      if (bucket.tokens < cost) {
        buckets.set(id, bucket);
        return false;
      }
      bucket.tokens -= cost;
      buckets.set(id, bucket);
      return true;
    },
    reset(id) {
      if (id) buckets.delete(id);
      else buckets.clear();
    },
  };
}

/**
 * Personal loot: every player gets a reward slot, hostile items rotate so the
 * same player cannot claim two rounds in a row. Rewards are never duplicated.
 */
export function allocateLoot(players, rewards, state = {}) {
  const ids = (players || []).map((p) => p.id);
  if (!ids.length) return [];
  const claimed = new Set(state.claimed || []);
  const cursor = Number(state.cursor) || 0;
  const result = [];
  let index = 0;
  for (const reward of rewards || []) {
    if (!reward || claimed.has(reward.id)) continue;
    const owner = ids[(cursor + index) % ids.length];
    result.push({ reward, owner, round: index });
    index += 1;
  }
  return result;
}

export function claimReward(state, rewardId, owner) {
  const claimed = new Set(state?.claimed || []);
  if (claimed.has(rewardId)) return { ok: false, state };
  claimed.add(rewardId);
  return { ok: true, state: { ...state, claimed: [...claimed], lastOwner: owner } };
}

// ── session registry ───────────────────────────────────────────────────────
export class CoopSession {
  constructor({ lobby, now = () => Date.now() } = {}) {
    this.lobby = lobby;
    this.now = now;
    this.peers = new Map();
    this.inputs = new Map();
    this.rate = createRateLimiter({ now });
    this.lootState = { claimed: [], cursor: 0 };
    this.sequence = 0;
    this.startedAt = now();
    this.lastSnapshots = new Map();
    this.deadPeers = new Set();
    this.reconnectTokens = new Map();
  }

  registerPeer({ id, name, classId, token }) {
    if (this.peers.size >= COOP_MAX_PLAYERS) return { ok: false, error: 'Party penuh.' };
    const existing = token ? this.reconnectTokens.get(token) : null;
    if (existing && this.peers.has(existing)) {
      return { ok: false, error: 'Token reconnect duplikat.' };
    }
    const peer = {
      id: id || `p${this.peers.size + 1}`,
      name: sanitizePlayerName(name || 'Penjaga'),
      classId: classId || 'sera',
      token: token || null,
      joinedAt: this.now(),
      lastSeen: this.now(),
      latencyMs: 0,
      connected: true,
    };
    this.peers.set(peer.id, peer);
    if (peer.token) this.reconnectTokens.set(peer.token, peer.id);
    return { ok: true, peer };
  }

  reconnect(token) {
    const id = this.reconnectTokens.get(token);
    if (!id) return { ok: false };
    const peer = this.peers.get(id);
    if (!peer) return { ok: false };
    peer.connected = true;
    peer.lastSeen = this.now();
    this.deadPeers.delete(id);
    return { ok: true, peer };
  }

  disconnect(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    peer.connected = false;
    this.deadPeers.add(peerId);
    peer.lastSeen = this.now();
  }

  /** Accept one client input packet; oldest packets are dropped, not queued. */
  receiveInput(peerId, packet) {
    if (!this.rate.take(peerId)) return { ok: false, error: 'rate_limited' };
    const peer = this.peers.get(peerId);
    if (!peer) return { ok: false, error: 'unknown_peer' };
    const seq = Number(packet?.seq) || 0;
    const prev = this.inputs.get(peerId);
    if (prev && seq <= prev.seq) return { ok: false, error: 'stale' };
    const input = {
      left: !!packet.left,
      right: !!packet.right,
      jump: !!packet.jump,
      attack: !!packet.attack,
      dash: !!packet.dash,
      interact: !!packet.interact,
      special: !!packet.special,
    };
    this.inputs.set(peerId, { seq, input, at: this.now() });
    peer.lastSeen = this.now();
    peer.latencyMs = Math.max(0, Math.round(Number(packet.latency) || 0));
    return { ok: true };
  }

  inputFor(peerId) {
    return this.inputs.get(peerId)?.input || {};
  }

  /** Build the next authoritative snapshot for a specific peer. */
  snapshotFor(peerId, state) {
    this.sequence += 1;
    const payload = {
      ...state,
      t: (this.now() - this.startedAt) / 1000,
      session: { seq: this.sequence, serverNow: this.now(), peer: peerId, peers: this.peers.size },
    };
    const filtered = filterByInterest(payload, state?.focusX ?? state?.players?.[0]?.x ?? 640);
    const previous = this.lastSnapshots.get(peerId) || null;
    const delta = previous ? encodeDelta(previous, filtered) : encodeSnapshot(filtered);
    this.lastSnapshots.set(peerId, filtered);
    return delta;
  }

  pruneStale(maxIdleMs = 15000) {
    const t = this.now();
    const removed = [];
    for (const peer of this.peers.values()) {
      if (t - peer.lastSeen > maxIdleMs) {
        this.peers.delete(peer.id);
        removed.push(peer.id);
      }
    }
    return removed;
  }

  lobbyView() {
    return {
      code: this.lobby?.code,
      modeId: this.lobby?.modeId,
      players: [...this.peers.values()].map((peer) => ({
        id: peer.id,
        name: peer.name,
        classId: peer.classId,
        connected: peer.connected,
        latencyMs: peer.latencyMs,
        ready: this.lobby?.players?.find((player) => player.id === peer.id)?.ready ?? false,
      })),
      maxPlayers: COOP_MAX_PLAYERS,
    };
  }
}

// ── transports ──────────────────────────────────────────────────────────────
export function createMemoryTransportPair() {
  const listeners = { a: new Set(), b: new Set() };
  const make = (side, other) => ({
    side,
    send(message) {
      for (const listener of listeners[other]) listener(message);
    },
    onMessage(handler) {
      listeners[side].add(handler);
      return () => listeners[side].delete(handler);
    },
    close() {
      listeners[side].clear();
      listeners[other].clear();
    },
    get connected() {
      return true;
    },
  });
  return [make('a', 'b'), make('b', 'a')];
}

/**
 * WebSocket transport. `WebSocketImpl` is injected so this module never touches
 * `window` directly and can be tested with a fake socket.
 */
export function createWebSocketTransport(url, options = {}) {
  const Impl = options.WebSocketImpl;
  if (!Impl) throw new Error('WebSocket implementation required');
  const socket = new Impl(url);
  const handlers = new Set();
  const state = { open: false, error: null };
  socket.addEventListener('open', () => {
    state.open = true;
    options.onOpen?.();
  });
  socket.addEventListener('close', () => {
    state.open = false;
    options.onClose?.();
  });
  socket.addEventListener('error', (err) => {
    state.error = err;
    options.onError?.(err);
  });
  socket.addEventListener('message', (event) => {
    let payload = event.data;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        return;
      }
    }
    for (const handler of handlers) handler(payload);
  });
  return {
    socket,
    get connected() {
      return state.open;
    },
    get error() {
      return state.error;
    },
    send(message) {
      if (!state.open) return false;
      socket.send(JSON.stringify(message));
      return true;
    },
    onMessage(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    close() {
      handlers.clear();
      try {
        socket.close();
      } catch {
        /* ignore */
      }
    },
  };
}

export function coopSocketUrl(origin, roomCode, protocol = 'ws') {
  const base = String(origin || 'http://127.0.0.1:4300').replace(/^http/, protocol).replace(/\/$/, '');
  return `${base}/ws?room=${encodeURIComponent(String(roomCode || 'LOBBY').toUpperCase())}`;
}

/** Thin client wrapper: sends inputs at a fixed cadence, exposes latest state. */
export class CoopClient {
  constructor({ transport, name = 'Penjaga', classId = 'sera', token = null, lobbyCode = '', clock = () => Date.now() } = {}) {
    this.transport = transport;
    this.name = name;
    this.classId = classId;
    this.token = token;
    this.lobbyCode = lobbyCode;
    this.clock = clock;
    this.seq = 0;
    this.lobby = null;
    this.latest = null;
    this.interpolator = new SnapshotInterpolator();
    this.lastSentAt = 0;
    this.connected = false;
    this.listeners = new Set();
    transport.onMessage((message) => this.handle(message));
  }

  handle(message) {
    if (!message || typeof message !== 'object') return;
    if (message.type === 'welcome') {
      this.connected = true;
      this.lobby = message.lobby || null;
      if (message.token) this.token = message.token;
    } else if (message.type === 'lobby') {
      this.lobby = message.lobby;
    } else if (message.type === 'snapshot') {
      const decoded = applyDelta(this.latest, message.delta);
      this.latest = decoded;
      this.interpolator.push(decoded);
    } else if (message.type === 'event') {
      for (const listener of this.listeners) listener(message.event);
    }
    for (const listener of this.listeners) listener(message);
  }

  onEvent(handler) {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  join(password = '') {
    const room = sanitizeRoomCode(this.lobbyCode);
    this.transport.send({ type: 'join', room, name: this.name, classId: this.classId, password, token: this.token });
  }

  sendInput(input, nowMs = this.clock()) {
    if (nowMs - this.lastSentAt < 1000 / COOP_TICK_HZ) return false;
    this.lastSentAt = nowMs;
    this.seq += 1;
    this.transport.send({ type: 'input', seq: this.seq, ...input });
    return true;
  }

  sample(nowMs = this.clock()) {
    return this.interpolator.sample(nowMs);
  }
}
