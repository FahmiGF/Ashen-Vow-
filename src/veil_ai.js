// Update XIII — Ghost AI modules. Pure, deterministic, no DOM.
// The brain is deliberately independent from the shell: core passes a small
// context (player, nav graph, noise) and receives one intention per frame.
import { ghostProfile } from './veil_data.js';

export const GHOST_BEHAVIORS = [
  'roaming', 'observation', 'investigation', 'guardian', 'echoing',
  'pursuit', 'displacement', 'manifestation', 'memory', 'retreat',
];

export const VEIL_AI_DEFAULTS = {
  sightRange: 280,
  hearingRange: 220,
  attackRange: 44,
  attackCooldown: 2.2,
  damage: 7,
  speed: 74,
  memoryLimit: 6,
  memoryTtl: 12,
  repathInterval: 0.35,
  stuckLimit: 1.6,
  maxConcurrent: 3,
  encounterCooldown: 8,
};

export const GHOST_COMBAT = {
  wraith: { hp: 70, damage: 8, speed: 88, attackRange: 48, flying: true },
  apparition: { hp: 58, damage: 6, speed: 76, attackRange: 42, flying: true },
  phantom: { hp: 92, damage: 10, speed: 82, attackRange: 52, flying: false },
  shade: { hp: 66, damage: 7, speed: 96, attackRange: 40, flying: false },
  lost_spirit: { hp: 52, damage: 5, speed: 70, attackRange: 38, flying: true },
  ancient_entity: { hp: 150, damage: 13, speed: 64, attackRange: 58, flying: false },
};

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const finite = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
const center = (entity) => ({ x: finite(entity?.x) + finite(entity?.w) / 2, y: finite(entity?.y) + finite(entity?.h) / 2 });
const hash = (value) => {
  let h = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
};

export function makeGhost(kind, x, options = {}) {
  const profile = ghostProfile(kind);
  if (!profile) return null;
  const base = GHOST_COMBAT[profile.classification] || GHOST_COMBAT.lost_spirit;
  const scaling = VEIL_AI_DEFAULTS;
  return {
    kind,
    ghostKind: kind,
    name: profile.name,
    classification: profile.classification,
    rarity: profile.rarity,
    secret: !!profile.secret,
    x: finite(x, 200),
    y: finite(options.y, 0),
    w: 38,
    h: 52,
    hp: Math.round(base.hp * finite(options.hpScale, 1)),
    maxHp: Math.round(base.hp * finite(options.hpScale, 1)),
    damage: Math.round(base.damage * finite(options.damageScale, 1)),
    speed: base.speed,
    flying: base.flying,
    attackRange: options.attackRange ?? base.attackRange,
    sightRange: options.sightRange ?? scaling.sightRange,
    hearingRange: options.hearingRange ?? scaling.hearingRange,
    attackCooldown: options.attackCooldown ?? scaling.attackCooldown,
    behavior: options.behavior || behaviorFor(profile),
    ash: 0,
    score: 0,
    hostile: options.hostile !== false,
    minX: options.minX ?? 40,
    maxX: options.maxX ?? 1120,
  };
}

export function behaviorFor(profile) {
  switch (profile?.classification) {
    case 'wraith': return 'pursuit';
    case 'apparition': return 'observation';
    case 'phantom': return 'memory';
    case 'shade': return 'roaming';
    case 'lost_spirit': return 'investigation';
    case 'ancient_entity': return 'guardian';
    default: return 'roaming';
  }
}

export class GhostMemory {
  constructor(limit = VEIL_AI_DEFAULTS.memoryLimit, ttl = VEIL_AI_DEFAULTS.memoryTtl) {
    this.limit = Math.max(1, limit);
    this.ttl = ttl;
    this.points = [];
  }

  add(x, y, clock, meta = {}) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    const point = { x, y, t: clock, meta };
    this.points.push(point);
    while (this.points.length > this.limit) this.points.shift();
    return point;
  }

  last() { return this.points[this.points.length - 1] || null; }

  prune(clock) {
    const cutoff = clock - this.ttl;
    this.points = this.points.filter((p) => p.t >= cutoff);
    return this.points.length;
  }

  nearestTo(x) {
    let best = null;
    let bestScore = Infinity;
    for (const point of this.points) {
      const score = Math.abs(point.x - x);
      if (score < bestScore) { best = point; bestScore = score; }
    }
    return best;
  }

  clear() { this.points = []; }
  get size() { return this.points.length; }
}

export class GhostPerception {
  constructor(profile = null) {
    this.profile = profile;
    this.sightRange = profile?.sightRange ?? VEIL_AI_DEFAULTS.sightRange;
    this.hearingRange = profile?.hearingRange ?? VEIL_AI_DEFAULTS.hearingRange;
  }

  sense(entity, ctx = {}) {
    const self = center(entity);
    const player = ctx.player;
    if (!player) return { seen: false, heard: false, distance: Infinity, noise: null };
    const target = center(player);
    const distance = Math.hypot(target.x - self.x, target.y - self.y);
    const open = typeof ctx.los === 'function' ? !!ctx.los(self.x, self.y, target.x, target.y) : ctx.los !== false;
    const visible = entity.ghostVisible !== false && !entity.ghostHidden;
    const seen = visible && distance <= (entity.sightRange || this.sightRange) && open;
    let noise = null;
    const source = ctx.noise;
    if (source && finite(source.ttl, 0) > 0) {
      const noiseDistance = Math.hypot(finite(source.x) - self.x, finite(source.y) - self.y);
      if (noiseDistance <= (entity.hearingRange || this.hearingRange) * clamp(finite(source.loudness, 1), 0.2, 2)) {
        noise = { x: finite(source.x), y: finite(source.y), ttl: finite(source.ttl), distance: noiseDistance };
      }
    }
    return { seen, heard: !!noise || (ctx.noisy === true && distance <= this.hearingRange), distance, noise, target };
  }
}

export class GhostNavigation {
  constructor(nav = null) {
    this.nav = nav;
    this.repathTimer = 0;
    this.lastTargetX = null;
  }

  setGraph(nav) {
    this.nav = nav;
    this.repathTimer = 0;
  }

  canStand(x, footY) {
    if (!Number.isFinite(x)) return false;
    if (!this.nav || typeof this.nav.groundAt !== 'function') return true;
    try {
      const ground = this.nav.groundAt(x, footY);
      return ground !== null && ground !== undefined;
    } catch {
      return true;
    }
  }

  /** Move one step toward dir, refusing edges/walls. Never teleports. */
  step(entity, dir, dt, ctx = {}) {
    if (!entity || !Number.isFinite(dir) || dir === 0) return { dx: 0, blocked: false };
    const speed = Math.max(0, finite(entity.speed, VEIL_AI_DEFAULTS.speed));
    const step = dir * speed * Math.min(finite(dt, 0), 0.1);
    const minX = finite(entity.minX, 0);
    const maxX = finite(entity.maxX, 1200);
    const nextX = clamp(entity.x + step, minX, Math.max(minX, maxX - finite(entity.w, 0)));
    if (Math.abs(nextX - entity.x) < 0.001) return { dx: 0, blocked: true };
    const ground = this.canStand(nextX + finite(entity.w) / 2, entity.y + finite(entity.h) + 6);
    if (!ground) return { dx: 0, blocked: true };
    const dx = nextX - entity.x;
    entity.x = nextX;
    return { dx, blocked: false };
  }

  /** Validated reposition used by displacement ghosts only after a telegraphed tell. */
  blinkTarget(entity, player, ctx = {}) {
    if (!entity) return null;
    const minX = finite(entity.minX, 0);
    const maxX = finite(entity.maxX, 1200);
    const anchor = finite(player?.x, entity.x);
    const candidates = [anchor - 140, anchor + 140, entity.x - 90, entity.x + 90];
    for (const candidate of candidates) {
      const x = clamp(candidate, minX, Math.max(minX, maxX - finite(entity.w, 0)));
      if (this.canStand(x + finite(entity.w) / 2, entity.y + finite(entity.h) + 6)) {
        const open = typeof ctx.los === 'function' ? ctx.los(x, entity.y, finite(player?.x, x), finite(player?.y, entity.y)) : true;
        if (open) return { x };
      }
    }
    return null;
  }
}

export class GhostManifestation {
  constructor(size = 12) {
    this.size = Math.max(1, size);
    this.slots = Array.from({ length: this.size }, (_, i) => ({ id: i, uid: null, kind: null, alpha: 0, fade: 0, age: 0, active: false }));
    this.reuseCount = 0;
  }

  acquire(uid, kind, options = {}) {
    const key = String(uid);
    const existing = this.slots.find((slot) => slot.uid === key);
    if (existing) { this.reuseCount += 1; return existing; }
    const slot = this.slots.find((s) => !s.active) || this.slots.reduce((a, b) => (a.age > b.age ? a : b), this.slots[0]);
    Object.assign(slot, {
      uid: key, kind, active: true, alpha: 1, fade: options.fade ?? 1.4, age: 0,
      pooled: slot.uid !== null,
    });
    return slot;
  }

  release(uid) {
    const slot = this.slots.find((s) => s.uid === String(uid));
    if (!slot) return false;
    slot.active = false; slot.alpha = 0; slot.fade = 0; slot.uid = null; slot.kind = null;
    return true;
  }

  update(dt) {
    let active = 0;
    for (const slot of this.slots) {
      if (!slot.active) continue;
      slot.age += Math.max(0, finite(dt));
      slot.alpha = Math.max(0, 1 - slot.age / Math.max(0.01, slot.fade));
      if (slot.alpha <= 0) { slot.active = false; slot.uid = null; }
      else active += 1;
    }
    return active;
  }

  stats() {
    return { size: this.size, active: this.slots.filter((s) => s.active).length, reused: this.reuseCount };
  }

  reset() {
    for (const slot of this.slots) { slot.active = false; slot.uid = null; slot.alpha = 0; slot.age = 0; }
  }
}

export class GhostInvestigation {
  constructor(options = {}) {
    this.cooldown = finite(options.cooldown, 12);
    this.triggers = new Map();
  }

  inspect(ghostId, evidenceType, allowed = [], clock = 0) {
    const key = `${ghostId}:${evidenceType}`;
    if (!allowed.includes(evidenceType)) return { ok: false, reason: 'invalid-evidence' };
    const last = this.triggers.get(key);
    if (last !== undefined && clock - last < this.cooldown) return { ok: false, reason: 'cooldown' };
    this.triggers.set(key, clock);
    return { ok: true, ghostId, evidenceType, clock };
  }

  reset(ghostId = null) {
    if (ghostId) {
      for (const key of [...this.triggers.keys()]) if (key.startsWith(`${ghostId}:`)) this.triggers.delete(key);
      return;
    }
    this.triggers.clear();
  }
}

export class GhostEncounterDirector {
  constructor(settings = {}) {
    this.cooldown = finite(settings.encounterCooldown, VEIL_AI_DEFAULTS.encounterCooldown);
    this.maxConcurrent = clamp(finite(settings.maxConcurrent, VEIL_AI_DEFAULTS.maxConcurrent), 1, 6);
    this.rate = clamp(finite(settings.encounterRate, 1), 0, 2);
    this.active = new Map();
    this.lastEncounter = new Map();
    this.clock = 0;
    this.suppressed = 0;
  }

  tick(dt) {
    const step = Math.max(0, finite(dt));
    this.clock += step;
    for (const [id, entry] of this.active) {
      if (entry.endsAt <= this.clock) this.active.delete(id);
    }
  }

  request(ghostId, options = {}) {
    if (!ghostId) return { ok: false, reason: 'invalid' };
    if (this.active.has(ghostId)) { this.suppressed += 1; return { ok: false, reason: 'duplicate' }; }
    if (this.active.size >= this.maxConcurrent) { this.suppressed += 1; return { ok: false, reason: 'concurrent' }; }
    const last = this.lastEncounter.get(ghostId);
    const cooldown = this.cooldown / Math.max(0.1, this.rate || 1);
    if (last !== undefined && this.clock - last < cooldown) { this.suppressed += 1; return { ok: false, reason: 'cooldown' }; }
    const duration = finite(options.duration, 18);
    this.lastEncounter.set(ghostId, this.clock);
    this.active.set(ghostId, { endsAt: this.clock + duration, startedAt: this.clock });
    return { ok: true, ghostId, duration, presentation: options.presentation || 'full' };
  }

  release(ghostId) { return this.active.delete(ghostId); }
  isActive(ghostId) { return this.active.has(ghostId); }
  get count() { return this.active.size; }

  snapshot() {
    return { clock: this.clock, active: [...this.active.keys()], suppressed: this.suppressed, maxConcurrent: this.maxConcurrent };
  }

  reset() {
    this.active.clear(); this.lastEncounter.clear(); this.clock = 0; this.suppressed = 0;
  }
}

export class GhostReplication {
  constructor() {
    this.seen = new Set();
    this.lastSnapshot = null;
    this.frames = 0;
  }

  snapshot(ghosts = [], tick = 0) {
    const rows = [];
    for (const ghost of ghosts) {
      if (!ghost) continue;
      const uid = String(ghost.uid || ghost.instanceId || ghost.ghostKind || ghost.kind || 'ghost');
      rows.push({ uid, kind: ghost.ghostKind || ghost.kind || 'ghost', x: Math.round(finite(ghost.x)), y: Math.round(finite(ghost.y)), hp: Math.round(finite(ghost.hp)), state: ghost.ghostState || 'idle', phase: finite(ghost.ghostPhase, 0) });
    }
    return { tick, ghosts: rows };
  }

  delta(previous, next) {
    const before = new Map((previous?.ghosts || []).map((g) => [g.uid, g]));
    const rows = [];
    for (const ghost of next?.ghosts || []) {
      const old = before.get(ghost.uid);
      if (!old || old.x !== ghost.x || old.y !== ghost.y || old.hp !== ghost.hp || old.state !== ghost.state) rows.push(ghost);
    }
    return { tick: next?.tick ?? 0, ghosts: rows };
  }

  apply(snapshot = {}) {
    const applied = [];
    const duplicate = [];
    for (const ghost of snapshot.ghosts || []) {
      if (!ghost || !ghost.uid) continue;
      const uid = `${snapshot.session || 'local'}:${ghost.uid}`;
      if (this.seen.has(uid)) { duplicate.push(uid); continue; }
      this.seen.add(uid);
      applied.push(ghost);
    }
    this.lastSnapshot = snapshot;
    this.frames += 1;
    return { applied, duplicate };
  }

  reconnect() {
    return { existing: [...this.seen], frames: this.frames };
  }

  reset() { this.seen.clear(); this.lastSnapshot = null; this.frames = 0; }
}

export class GhostBrain {
  constructor(profile, options = {}) {
    this.profile = profile || {};
    this.id = options.id || profile?.id || 'ghost';
    this.perception = new GhostPerception({ sightRange: options.sightRange || VEIL_AI_DEFAULTS.sightRange, hearingRange: options.hearingRange || VEIL_AI_DEFAULTS.hearingRange });
    this.memory = new GhostMemory();
    this.navigation = new GhostNavigation(options.nav || null);
    this.clock = 0;
    this.state = 'idle';
    this.alert = 0;
    this.attackTimer = 0;
    this.attacks = 0;
    this.stuckTimer = 0;
    this.lastDir = 0;
    this.tell = 0;
    this.vanishCooldown = 0;
    this.patrolDir = hash(`${this.id}:dir`) > 0.5 ? 1 : -1;
    this.stuck = false;
    this.manifested = true;
  }

  setNav(nav) { this.navigation.setGraph(nav); }

  update(dt, ctx = {}) {
    const step = clamp(finite(dt), 0, 0.1);
    this.clock += step;
    this.attackTimer = Math.max(0, this.attackTimer - step);
    this.tell = Math.max(0, this.tell - step);
    this.vanishCooldown = Math.max(0, this.vanishCooldown - step);
    this.memory.prune(this.clock);

    const entity = ctx.entity;
    const sense = this.perception.sense(entity, ctx);
    this.alert = sense.seen ? 1 : sense.heard ? 0.65 : Math.max(0, this.alert - step * 0.25);
    if (sense.seen || sense.heard) {
      const point = sense.noise || sense.target;
      if (point) this.memory.add(point.x, point.y, this.clock, { heard: !sense.seen });
    }

    const behavior = ctx.behavior || entity?.behavior || this.profile.behavior || behaviorFor(this.profile);
    const self = center(entity);
    const player = ctx.player;
    const target = player ? center(player) : null;
    const gap = target ? Math.hypot(target.x - self.x, target.y - self.y) : Infinity;
    let dir = 0;
    let teleport = null;
    let visible = entity?.ghostHidden ? false : true;

    switch (behavior) {
      case 'observation':
        if (target) {
          if (gap < 70 && this.vanishCooldown <= 0) { this.tell = 0.6; this.vanishCooldown = 7; }
          dir = target.x > self.x ? (gap > 190 ? 1 : gap < 130 ? -1 : 0) : (gap > 190 ? -1 : gap < 130 ? 1 : 0);
        }
        break;
      case 'investigation': {
        const point = this.memory.nearestTo(self.x);
        dir = point && Math.abs(point.x - self.x) > 24 ? Math.sign(point.x - self.x) : this.patrolDir;
        if (!point && this.clock > 6) this.patrolDir *= -1;
        break;
      }
      case 'guardian':
        dir = Math.abs(self.x - (ctx.anchorX ?? self.x)) > 80 ? Math.sign((ctx.anchorX ?? self.x) - self.x) : 0;
        if (target && gap < (ctx.guardRadius || 260)) dir = Math.sign(target.x - self.x);
        break;
      case 'echoing':
        dir = Math.sin(this.clock * 0.8 + hash(this.id) * 6.28) > 0 ? 1 : -1;
        break;
      case 'pursuit':
      case 'memory':
      case 'retreat':
        if (target && (this.alert > 0.2 || behavior === 'retreat')) dir = Math.sign(target.x - self.x);
        else {
          const point = this.memory.nearestTo(self.x);
          dir = point ? Math.sign(point.x - self.x) : this.patrolDir;
        }
        if (behavior === 'retreat' && this.attacks >= 2) {
          return this.finish({ dir: 0, state: 'retreat', attack: null, visible, teleport, despawn: true, sense });
        }
        break;
      case 'displacement':
        if (this.vanishCooldown <= 0 && target) {
          this.vanishCooldown = 5.5;
          this.tell = 0.5;
          teleport = this.navigation.blinkTarget(entity, player, ctx);
          if (teleport) visible = false;
        }
        break;
      case 'manifestation':
        visible = ctx.dark !== false;
        dir = target ? Math.sign(target.x - self.x) : this.patrolDir;
        break;
      case 'roaming':
      default: {
        const minX = finite(entity?.minX, 0);
        const maxX = finite(entity?.maxX, 1200);
        if (self.x <= minX + 24) this.patrolDir = 1;
        if (self.x >= maxX - finite(entity?.w, 0) - 24) this.patrolDir = -1;
        dir = this.patrolDir;
        break;
      }
    }

    if (behavior === 'retreat' && this.attacks >= 2) {
      return this.finish({ dir: 0, state: 'retreat', attack: null, visible, teleport, despawn: true, sense });
    }

    // Attack: once per cooldown, only with line of sight and in range.
    let attack = null;
    const canAttack = entity?.hostile !== false && this.attackTimer <= 0 && gap <= (entity?.attackRange || VEIL_AI_DEFAULTS.attackRange) && (ctx.los === undefined || ctx.los === true || (typeof ctx.los === 'function' && ctx.los(self.x, self.y, target.x, target.y)));
    if (canAttack) {
      this.attackTimer = (entity?.attackCooldown || VEIL_AI_DEFAULTS.attackCooldown);
      this.attacks += 1;
      attack = { kind: this.profile.classification === 'ancient_entity' ? 'slam' : 'touch', damage: finite(entity?.damage, VEIL_AI_DEFAULTS.damage), range: entity?.attackRange || VEIL_AI_DEFAULTS.attackRange };
    }

    const move = this.navigation.step(entity, dir, step, ctx);
    if (move.blocked && dir !== 0) {
      this.stuckTimer += step;
      this.stuck = this.stuckTimer > VEIL_AI_DEFAULTS.stuckLimit;
      this.patrolDir = -this.patrolDir;
      if (this.stuck) {
        this.stuck = false;
        this.stuckTimer = 0;
        this.state = 'unsticking';
        const blink = this.navigation.blinkTarget(entity, player, ctx);
        if (blink) teleport = blink;
      }
    } else if (dir !== 0) {
      this.stuckTimer = 0;
      this.stuck = false;
    }

    this.lastDir = dir;
    const state = this.alert > 0.6 ? (behavior === 'guardian' ? 'guarding' : 'pursuing') : behavior;
    return this.finish({ dir: move.dx, state, attack, visible, teleport, despawn: false, sense });
  }

  finish({ dir, state, attack, visible, teleport, despawn, sense }) {
    this.state = state;
    return {
      dir,
      state,
      attack,
      visible,
      teleport,
      despawn,
      alert: this.alert,
      seen: !!sense?.seen,
      heard: !!sense?.heard,
      distance: sense?.distance ?? Infinity,
      stuck: this.stuck,
      tell: this.tell,
      clock: this.clock,
    };
  }

  snapshot() {
    return { id: this.id, state: this.state, alert: this.alert, attacks: this.attacks, stuck: this.stuck, memory: this.memory.size, clock: this.clock };
  }
}
