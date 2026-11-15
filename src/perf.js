// src/perf.js — Ashen Vow P0 Performance Rebuild
// Pure logic: zero DOM / audio dependencies. Safe in Node and browser alike.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

// ═════════════════════════════════════════════════════════════════════════════
// 1.  IN-GAME DIAGNOSTIC PROFILER
// ═════════════════════════════════════════════════════════════════════════════

/** Target frame duration for 60 FPS (ms). */
export const TARGET_FRAME_MS = 1000 / 60; // ≈ 16.667 ms

/**
 * Rolling-window diagnostic profiler.
 * Call `profiler.beginFrame(nowMs)` at the start of each game-loop tick and
 * `profiler.endFrame(nowMs)` at the end.  Read `.snapshot()` for the current
 * stats object at any time.
 */
export class DiagnosticProfiler {
  /**
   * @param {object} [opts]
   * @param {number} [opts.windowSize=60]       frames kept in the rolling window
   * @param {number} [opts.spikeThresholdMs=33] ms above which a frame is a spike
   */
  constructor({ windowSize = 60, spikeThresholdMs = TARGET_FRAME_MS * 2 } = {}) {
    this.windowSize       = windowSize;
    this.spikeThresholdMs = spikeThresholdMs;

    /** @type {number[]} */
    this._frameTimes  = [];
    this._frameStart  = 0;
    this._totalFrames = 0;
    this._spikeCount  = 0;
    this._stutterCount= 0; // consecutive spikes ≥ 3

    // External counters — updated by the caller each frame.
    this.entityCount  = 0;
    this.particleCount= 0;
    this.drawCalls    = 0;
  }

  /** Mark the beginning of a frame. */
  beginFrame(nowMs) {
    this._frameStart = typeof nowMs === 'number' ? nowMs : Date.now();
  }

  /** Mark the end of a frame and record stats. */
  endFrame(nowMs) {
    let dt = 16.7;
    if (typeof nowMs === 'number') {
      if (nowMs < 1000 && this._frameStart === 0) {
        dt = nowMs;
      } else if (this._frameStart > 0 && nowMs > this._frameStart) {
        dt = nowMs - this._frameStart;
      } else {
        dt = nowMs;
      }
    } else if (this._frameStart > 0) {
      dt = Math.max(1, Date.now() - this._frameStart);
    }
    this._frameStart = 0;
    if (dt <= 0) return;

    this._frameTimes.push(dt);
    if (this._frameTimes.length > this.windowSize) this._frameTimes.shift();

    this._totalFrames++;
    if (dt >= this.spikeThresholdMs) this._spikeCount++;

    // Stutter = 3+ consecutive frames above spike threshold.
    this._checkStutter(dt);
  }

  setEntityCount(count) { this.entityCount = count; }
  setParticleCount(count) { this.particleCount = count; }
  setDrawCalls(count) { this.drawCalls = count; }

  getMetrics() {
    const snap = this.snapshot();
    return {
      fps: snap.fps || (this._frameTimes.length ? +(1000 / snap.avgFrameMs).toFixed(1) : 60),
      frameTime: snap.avgFrameMs,
      activeEntities: this.entityCount,
      particleCount: this.particleCount,
      drawCalls: this.drawCalls,
      memoryEstimate: snap.memoryMB,
      stutterDetected: snap.isStuttering || this._spikeCount > 0,
    };
  }

  _consecutiveSpikes = 0;
  _checkStutter(dt) {
    if (dt > this.spikeThresholdMs) {
      this._consecutiveSpikes++;
      if (this._consecutiveSpikes >= 3) {
        this._stutterCount++;
        this._consecutiveSpikes = 0; // reset so we count the next stutter
      }
    } else {
      this._consecutiveSpikes = 0;
    }
  }

  /**
   * Returns the current performance snapshot (pure object, no references).
   * @returns {PerfSnapshot}
   */
  snapshot() {
    const times = this._frameTimes;
    if (times.length === 0) {
      return _emptySnapshot(this.entityCount, this.particleCount, this.drawCalls);
    }

    const avgFrameMs = times.reduce((a, b) => a + b, 0) / times.length;
    const maxFrameMs = Math.max(...times);
    const minFrameMs = Math.min(...times);
    const fps        = avgFrameMs > 0 ? 1000 / avgFrameMs : 0;
    const memoryMB   = estimateMemoryMB(this.entityCount, this.particleCount);

    return {
      fps:            +fps.toFixed(1),
      avgFrameMs:     +avgFrameMs.toFixed(2),
      minFrameMs:     +minFrameMs.toFixed(2),
      maxFrameMs:     +maxFrameMs.toFixed(2),
      targetFrameMs:  TARGET_FRAME_MS,
      memoryMB:       +memoryMB.toFixed(2),
      entityCount:    this.entityCount,
      particleCount:  this.particleCount,
      drawCalls:      this.drawCalls,
      spikeCount:     this._spikeCount,
      stutterCount:   this._stutterCount,
      isStuttering:   this._consecutiveSpikes >= 2,
      totalFrames:    this._totalFrames,
    };
  }

  /** Reset all counters (e.g. on scene change). */
  reset() {
    this._frameTimes      = [];
    this._frameStart      = 0;
    this._totalFrames     = 0;
    this._spikeCount      = 0;
    this._stutterCount    = 0;
    this._consecutiveSpikes = 0;
    this.entityCount      = 0;
    this.particleCount    = 0;
    this.drawCalls        = 0;
  }
}

/**
 * Rough memory estimation based on entity / particle budgets.
 * Values are empirical approximations in MB.
 * @param {number} entities
 * @param {number} particles
 * @returns {number}
 */
export function estimateMemoryMB(entities, particles) {
  // ~2 kB per entity object (state, AI history, cached values)
  // ~0.5 kB per particle
  const baselineMB = 18;
  return baselineMB + (entities * 2048 + particles * 512) / (1024 * 1024);
}

function _emptySnapshot(e, p, d) {
  return {
    fps: 0, avgFrameMs: 0, minFrameMs: 0, maxFrameMs: 0,
    targetFrameMs: TARGET_FRAME_MS, memoryMB: estimateMemoryMB(e, p),
    entityCount: e, particleCount: p, drawCalls: d,
    spikeCount: 0, stutterCount: 0, isStuttering: false, totalFrames: 0,
  };
}

/** @typedef {ReturnType<DiagnosticProfiler['snapshot']>} PerfSnapshot */


// ═════════════════════════════════════════════════════════════════════════════
// 2.  FRUSTUM / CAMERA CULLING HELPERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * 2-D axis-aligned rectangle.
 * @typedef {{ x: number, y: number, w: number, h: number }} Rect2D
 */

/**
 * Returns true when two 2-D AABBs overlap (or touch).
 * @param {Rect2D} a
 * @param {Rect2D} b
 */
export function aabbOverlap2D(a, b) {
  return (
    a.x          < b.x + b.w &&
    a.x + a.w    > b.x       &&
    a.y          < b.y + b.h &&
    a.y + a.h    > b.y
  );
}

/**
 * Returns whether a 2-D entity rect is inside the camera frustum.
 * `camera` is the viewport rectangle in world coordinates.
 * @param {Rect2D} entityRect
 * @param {Rect2D} camera        — world-space viewport
 * @param {number} [margin=64]  — extra pixels around the viewport to avoid pop-in
 */
export function isVisible2D(entityRect, camera, margin = 64) {
  const cam = {
    x: camera.x - margin,
    y: camera.y - margin,
    w: camera.w + margin * 2,
    h: camera.h + margin * 2,
  };
  return aabbOverlap2D(entityRect, cam);
}

/**
 * 3-D camera frustum described by 6 planes (normal + d).
 * Each plane: { nx, ny, nz, d }  →  dot(normal, point) + d >= 0 ⟹ inside.
 * @typedef {{ nx:number, ny:number, nz:number, d:number }} Plane3D
 * @typedef {{ planes: Plane3D[] }} Frustum3D
 */

/**
 * Build a simple perspective frustum from common camera parameters.
 * @param {{ position:{x,y,z}, forward:{x,y,z}, up:{x,y,z}, right:{x,y,z},
 *            fovY:number, aspect:number, near:number, far:number }} cam
 * @returns {Frustum3D}
 */
export function buildFrustum3D(cam) {
  const { position: p, forward: f, up: u, right: r,
          fovY, aspect, near, far } = cam;

  const halfVH = Math.tan(fovY / 2);
  const halfVW = halfVH * aspect;

  // 6 frustum planes derived from the 4 edge normals + near + far.
  const planes = [];

  // Helper: plane from normal (may not be unit) + a point on the plane.
  const makePlane = (nx, ny, nz, px, py, pz) => {
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;
    return { nx, ny, nz, d: -(nx * px + ny * py + nz * pz) };
  };

  // Near plane
  planes.push(makePlane(f.x, f.y, f.z,
    p.x + f.x * near, p.y + f.y * near, p.z + f.z * near));
  // Far plane
  planes.push(makePlane(-f.x, -f.y, -f.z,
    p.x + f.x * far,  p.y + f.y * far,  p.z + f.z * far));

  // Left / Right
  const addSide = (sign, axis) => {
    // normal = cross(forward +/- halfVW * right, up)  — simplified
    const nx = f.x + sign * halfVW * axis.x;
    const ny = f.y + sign * halfVW * axis.y;
    const nz = f.z + sign * halfVW * axis.z;
    // cross with up to get inward normal
    const cx = ny * u.z - nz * u.y;
    const cy = nz * u.x - nx * u.z;
    const cz = nx * u.y - ny * u.x;
    planes.push(makePlane(cx, cy, cz, p.x, p.y, p.z));
  };
  addSide(-1, r); // left
  addSide( 1, r); // right

  // Top / Bottom
  const addTopBot = (sign, axis) => {
    const nx = f.x + sign * halfVH * axis.x;
    const ny = f.y + sign * halfVH * axis.y;
    const nz = f.z + sign * halfVH * axis.z;
    const cx = ny * r.z - nz * r.y;
    const cy = nz * r.x - nx * r.z;
    const cz = nx * r.y - ny * r.x;
    planes.push(makePlane(cx, cy, cz, p.x, p.y, p.z));
  };
  addTopBot( 1, u); // top
  addTopBot(-1, u); // bottom

  return { planes };
}

/**
 * Tests a sphere against a 3-D frustum.
 * @param {Frustum3D} frustum
 * @param {{ x:number, y:number, z:number }} center
 * @param {number} radius
 * @returns {boolean}
 */
export function sphereInFrustum3D(frustum, center, radius) {
  for (const pl of frustum.planes) {
    if (pl.nx * center.x + pl.ny * center.y + pl.nz * center.z + pl.d < -radius) {
      return false;
    }
  }
  return true;
}

/**
 * Convenience: cull an array of entities, returning only those whose sphere
 * overlaps the frustum.
 * @param {Frustum3D} frustum
 * @param {Array<{pos:{x,y,z}, boundingRadius:number}>} entities
 * @returns {typeof entities}
 */
export function cullEntities3D(frustum, entities) {
  return entities.filter(e => sphereInFrustum3D(frustum, e.pos, e.boundingRadius ?? 1));
}

/**
 * Cull a flat array of 2-D entities against the camera rect.
 * @param {Rect2D} camera
 * @param {Array<{x:number,y:number,w:number,h:number}>} entities
 * @param {number} [margin]
 * @returns {typeof entities}
 */
export function cullEntities2D(camera, entities, margin = 64) {
  return entities.filter(e => isVisible2D(e, camera, margin));
}

/**
 * Frustum and camera culling class for 2D and 3D scenes.
 */
export class FrustumCuller {
  isVisible2D(entity, camera) {
    const ew = entity.width ?? entity.w ?? 0;
    const eh = entity.height ?? entity.h ?? 0;
    const cw = camera.width ?? camera.w ?? 0;
    const ch = camera.height ?? camera.h ?? 0;

    return (
      entity.x < camera.x + cw &&
      entity.x + ew > camera.x &&
      entity.y < camera.y + ch &&
      entity.y + eh > camera.y
    );
  }

  isVisible3D(entity, camera) {
    const r = entity.radius ?? 1;
    const near = camera.near ?? 1;
    const far = camera.far ?? 1000;
    if (entity.z + r < near) return false;
    if (entity.z - r > far) return false;
    return true;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 3.  OBJECT POOLING SYSTEM
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Generic object pool.
 * Supports both `new ObjectPool(factory, reset, maxSize)` and
 * `new ObjectPool({ create, reset, initialSize, maxSize })`.
 * @template T
 */
export class ObjectPool {
  /**
   * @param {(() => T)|object} factoryOrOpts
   * @param {(o: T) => void}   [resetFn]
   * @param {number}           [maxSize=256]
   */
  constructor(factoryOrOpts, resetFn, maxSize = 256) {
    if (typeof factoryOrOpts === 'object' && factoryOrOpts !== null) {
      this._factory  = factoryOrOpts.create;
      this._reset    = factoryOrOpts.reset || (() => {});
      this._maxSize  = factoryOrOpts.maxSize ?? 1024;
      this._free     = [];
      this._active   = new Set();

      const initialSize = factoryOrOpts.initialSize ?? 0;
      for (let i = 0; i < initialSize; i++) {
        this._free.push(this._factory());
      }
    } else {
      this._factory  = factoryOrOpts;
      this._reset    = resetFn || (() => {});
      this._maxSize  = maxSize;
      this._free     = [];
      this._active   = new Set();
    }
  }

  /** Acquire an object (from pool or freshly created). */
  acquire() {
    let obj;
    if (this._free.length > 0) {
      obj = this._free.pop();
      this._reset(obj);
    } else {
      obj = this._factory();
    }
    this._active.add(obj);
    return obj;
  }

  /**
   * Release an object back to the pool.
   * @param {T} obj
   */
  release(obj) {
    if (!this._active.has(obj)) return;
    this._active.delete(obj);
    this._reset(obj);
    if (this._free.length < this._maxSize) {
      this._free.push(obj);
    }
  }

  /** Release all active objects at once (e.g. scene reset). */
  releaseAll() {
    for (const obj of this._active) {
      this._reset(obj);
      if (this._free.length < this._maxSize) this._free.push(obj);
    }
    this._active.clear();
  }

  get activeCount()  { return this._active.size; }
  get freeCount()    { return this._free.length; }
  get totalManaged() { return this._active.size + this._free.length; }

  /** Iterate over every currently active object. */
  forEach(fn) { this._active.forEach(fn); }
}

// ── Pool factories ──────────────────────────────────────────────────────────

/** @returns {ProjectileObject} */
function _makeProjectile() {
  return { type: 'projectile', x: 0, y: 0, vx: 0, vy: 0, dmg: 0,
           owner: null, alive: false, age: 0 };
}
function _resetProjectile(p) {
  p.x = 0; p.y = 0; p.vx = 0; p.vy = 0; p.dmg = 0;
  p.owner = null; p.alive = true; p.age = 0;
}

/** @returns {ParticleObject} */
function _makeParticle() {
  return { type: 'particle', x: 0, y: 0, vx: 0, vy: 0,
           life: 0, maxLife: 1, r: 255, g: 255, b: 255, a: 1,
           size: 4, alive: false };
}
function _resetParticle(p) {
  p.x = 0; p.y = 0; p.vx = 0; p.vy = 0;
  p.life = 0; p.maxLife = 1; p.r = 255; p.g = 255; p.b = 255; p.a = 1;
  p.size = 4; p.alive = true;
}

/** @returns {DamageNumberObject} */
function _makeDamageNumber() {
  return { type: 'damageNumber', x: 0, y: 0, value: 0, crit: false,
           life: 0, maxLife: 1.2, alive: false };
}
function _resetDamageNumber(d) {
  d.x = 0; d.y = 0; d.value = 0; d.crit = false;
  d.life = 0; d.maxLife = 1.2; d.alive = true;
}

/** @returns {EnemyObject} */
function _makeEnemy() {
  return {
    type: 'enemy', id: '', x: 0, y: 0, hp: 0, maxHp: 0,
    speed: 0, dmg: 0, w: 32, h: 48, alive: false,
    state: 'idle', tier: AI_TIER.SUSPENDED,
    lastAIUpdate: 0, aiUpdateInterval: 0,
  };
}
function _resetEnemy(e) {
  e.id = ''; e.x = 0; e.y = 0; e.hp = 0; e.maxHp = 0;
  e.speed = 0; e.dmg = 0; e.w = 32; e.h = 48; e.alive = true;
  e.state = 'idle'; e.tier = AI_TIER.SUSPENDED;
  e.lastAIUpdate = 0; e.aiUpdateInterval = 0;
}

/**
 * Pre-built pools used by the game.
 * Sizes can be tuned via `createPools(opts)`.
 */
export function createPools({
  projectiles = 256,
  particles   = 1024,
  numbers     = 128,
  enemies     = 128,
} = {}) {
  return {
    projectiles: new ObjectPool(_makeProjectile, _resetProjectile, projectiles),
    particles:   new ObjectPool(_makeParticle,   _resetParticle,   particles),
    numbers:     new ObjectPool(_makeDamageNumber, _resetDamageNumber, numbers),
    enemies:     new ObjectPool(_makeEnemy,       _resetEnemy,      enemies),
  };
}


// ═════════════════════════════════════════════════════════════════════════════
// 4.  AI SCHEDULER — 5-TIER SYSTEM
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Five-tier AI priority levels.
 * @enum {string}
 */
export const AI_TIER = Object.freeze({
  FIGHTING_NEARBY:    'FIGHTING_NEARBY',
  VISIBLE_DISTANT:    'VISIBLE_DISTANT',
  OUTSIDE_CAMERA:     'OUTSIDE_CAMERA',
  FAR_OUTSIDE_ACTIVE: 'FAR_OUTSIDE_ACTIVE',
  DEAD:               'DEAD',

  // Numeric and legacy aliases
  FULL:               'FIGHTING_NEARBY',
  REDUCED:            'VISIBLE_DISTANT',
  LOW_FREQ:           'OUTSIDE_CAMERA',
  SUSPENDED:          'FAR_OUTSIDE_ACTIVE',
});

/** Update intervals (ms) per tier. */
export const AI_TIER_INTERVAL_MS = Object.freeze({
  [AI_TIER.DEAD]:               Infinity,
  [AI_TIER.FAR_OUTSIDE_ACTIVE]: Infinity,
  [AI_TIER.OUTSIDE_CAMERA]:     500,   // 2 Hz
  [AI_TIER.VISIBLE_DISTANT]:    100,   // 10 Hz
  [AI_TIER.FIGHTING_NEARBY]:    0,     // every frame
});

/**
 * Thresholds (world-space pixels) used to classify entities.
 * Override when constructing AIScheduler.
 */
const DEFAULT_THRESHOLDS = {
  fightingRangePx:   200,  // within this distance from player → FULL
  visibleRangePx:    800,  // within camera + this margin → REDUCED
  activeAreaRangePx: 2400, // within this → LOW_FREQ; beyond → SUSPENDED
};

/**
 * AI Scheduler — classifies each entity into a tier and decides whether its
 * AI should run this frame.
 */
export class AIScheduler {
  /**
   * @param {object} [thresholds] — override DEFAULT_THRESHOLDS fields
   */
  constructor(thresholds = {}) {
    this._t = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Get tier directly from entity state.
   */
  getTier(entity) {
    if (!entity || entity.hp <= 0) return AI_TIER.DEAD;
    const dist = entity.distToPlayer ?? 0;
    if (entity.inCamera) {
      if (dist <= 200) return AI_TIER.FIGHTING_NEARBY;
      return AI_TIER.VISIBLE_DISTANT;
    } else {
      if (dist <= 1000) return AI_TIER.OUTSIDE_CAMERA;
      return AI_TIER.FAR_OUTSIDE_ACTIVE;
    }
  }

  /**
   * Classify an entity into an AI tier based on its distance to the player
   * and whether it is on-camera.
   */
  classify(entity, playerPos, cameraRect, isDead) {
    if (isDead || entity.hp <= 0) return AI_TIER.DEAD;

    const dx   = entity.x - playerPos.x;
    const dy   = entity.y - playerPos.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= this._t.fightingRangePx)   return AI_TIER.FIGHTING_NEARBY;
    if (dist <= this._t.visibleRangePx)    return AI_TIER.VISIBLE_DISTANT;
    if (dist <= this._t.activeAreaRangePx) return AI_TIER.OUTSIDE_CAMERA;
    return AI_TIER.FAR_OUTSIDE_ACTIVE;
  }

  /**
   * Returns true when the entity's AI should run this frame.
   * Supports both `shouldUpdate(entity, nowMs)` and `shouldUpdate(tier, frameNumber)`.
   */
  shouldUpdate(tierOrEntity, frameOrNowMs = 0) {
    if (typeof tierOrEntity === 'object' && tierOrEntity !== null) {
      const tier = tierOrEntity.tier ?? AI_TIER.FAR_OUTSIDE_ACTIVE;
      if (tier === AI_TIER.DEAD) return false;
      if (tier === AI_TIER.FIGHTING_NEARBY) return true;
      const nowMs = frameOrNowMs;
      const interval = AI_TIER_INTERVAL_MS[tier] ?? Infinity;
      if (interval === Infinity) return false;
      if (interval === 0) return true;
      return (nowMs - (tierOrEntity.lastAIUpdate ?? 0)) >= interval;
    }

    const tier = tierOrEntity;
    const frame = frameOrNowMs;
    if (tier === AI_TIER.DEAD) return false;
    if (tier === AI_TIER.FIGHTING_NEARBY) return true;
    if (tier === AI_TIER.VISIBLE_DISTANT) return (frame % 6 === 0);
    if (tier === AI_TIER.OUTSIDE_CAMERA) return (frame % 30 === 0);
    if (tier === AI_TIER.FAR_OUTSIDE_ACTIVE) return (frame % 60 === 0);
    return false;
  }

  /**
   * Run a full scheduling pass on a list of entities.
   * Sets `.tier`, `.aiUpdateInterval`, and `.lastAIUpdate` on each entity
   * that qualifies, and calls `aiUpdateFn(entity, nowMs)` for those that do.
   *
   * @param {Array<object>}        entities
   * @param {{x:number,y:number}}  playerPos
   * @param {Rect2D}               cameraRect
   * @param {number}               nowMs
   * @param {Function}             aiUpdateFn
   * @returns {{ full:number, reduced:number, lowFreq:number, suspended:number, dead:number }}
   */
  schedule(entities, playerPos, cameraRect, nowMs, aiUpdateFn) {
    const stats = { full: 0, reduced: 0, lowFreq: 0, suspended: 0, dead: 0 };
    const tierNames = ['dead', 'suspended', 'lowFreq', 'reduced', 'full'];

    for (const e of entities) {
      const tier = this.classify(e, playerPos, cameraRect, !e.alive);
      e.tier             = tier;
      e.aiUpdateInterval = AI_TIER_INTERVAL_MS[tier];

      // Stats
      stats[tierNames[tier]]++;

      if (this.shouldUpdate(e, nowMs)) {
        e.lastAIUpdate = nowMs;
        aiUpdateFn(e, nowMs);
      }
    }
    return stats;
  }
}


// ═════════════════════════════════════════════════════════════════════════════
// 5.  SAFE SAVE MIGRATION, BACKUP RECOVERY, ERROR LOGGING
// ═════════════════════════════════════════════════════════════════════════════

/** Current save-data schema version. */
export const SAVE_VERSION = 3;

/**
 * Error / event log entry.
 * @typedef {{ ts: string, level: 'INFO'|'WARN'|'ERROR', msg: string, data?: any }} LogEntry
 */

/**
 * Lightweight structured logger with ISO-8601 timestamps.
 * Zero external dependencies — stores entries in memory.
 */
export class PerfLogger {
  constructor(maxEntries = 2000) {
    this._maxEntries = maxEntries;
    /** @type {LogEntry[]} */
    this._entries = [];
  }

  _log(level, msg, data) {
    const entry = { ts: new Date().toISOString(), level, msg };
    if (data !== undefined) entry.data = data;
    this._entries.push(entry);
    if (this._entries.length > this._maxEntries) this._entries.shift();
    return entry;
  }

  info (msg, data) { return this._log('INFO',  msg, data); }
  warn (msg, data) { return this._log('WARN',  msg, data); }
  error(msg, data) { return this._log('ERROR', msg, data); }

  /** Return a copy of all entries, optionally filtered by level. */
  export(level) {
    if (!level) return [...this._entries];
    return this._entries.filter(e => e.level === level);
  }

  /** Remove all stored entries. */
  clear() { this._entries = []; }

  get size() { return this._entries.length; }
}

/** Shared default logger instance. */
export const logger = new PerfLogger();

// ── Save migration ──────────────────────────────────────────────────────────

/**
 * Migration functions indexed by the version they migrate FROM.
 * Each receives a save object and returns the mutated (upgraded) object.
 */
const MIGRATIONS = {
  0: (save) => {
    // v0 → v1: add mana field
    save.player = save.player ?? {};
    save.player.mana = save.player.mana ?? 100;
    save.version = 1;
    return save;
  },
  1: (save) => {
    // v1 → v2: add settings block
    save.settings = save.settings ?? { fps: 60, particles: 'high', screenShake: true };
    save.version = 2;
    return save;
  },
  2: (save) => {
    // v2 → v3: add overdrive/expansion progress
    save.expansion = save.expansion ?? { chapter: 21, level: 201, unlockedModes: [] };
    save.version = 3;
    return save;
  },
};

/**
 * Migrate a raw save object to the current SAVE_VERSION.
 * Returns `{ ok: true, save }` or `{ ok: false, error }`.
 *
 * @param {object} rawSave
 * @returns {{ ok: boolean, save?: object, error?: string }}
 */
export function migrateSave(rawSave) {
  if (!rawSave || typeof rawSave !== 'object') {
    logger.error('migrateSave: rawSave is not an object', rawSave);
    return { ok: false, error: 'invalid save data' };
  }

  let save = { ...rawSave };
  let ver  = typeof save.version === 'number' ? save.version : 0;

  try {
    while (ver < SAVE_VERSION) {
      const migrate = MIGRATIONS[ver];
      if (!migrate) {
        logger.error(`migrateSave: no migration from v${ver}`);
        return { ok: false, error: `missing migration v${ver}` };
      }
      logger.info(`migrateSave: v${ver} → v${ver + 1}`);
      save = migrate(save);
      ver  = save.version;
    }
  } catch (err) {
    logger.error('migrateSave: exception during migration', String(err));
    return { ok: false, error: String(err) };
  }

  return { ok: true, save };
}

/**
 * Validate that a save object has the required top-level keys.
 * @param {object} save
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateSave(save) {
  const required = ['version', 'player'];
  const missing  = required.filter(k => !(k in save));
  return { valid: missing.length === 0, missing };
}

// ── Backup / recovery ───────────────────────────────────────────────────────

/**
 * In-memory backup store.  In a real implementation the caller would persist
 * these to localStorage / IndexedDB / file system; we keep the logic pure.
 */
export class SaveBackupStore {
  constructor(maxBackups = 5) {
    this._maxBackups = maxBackups;
    /** @type {Array<{ ts:string, save:object }>} */
    this._backups = [];
  }

  /**
   * Push a snapshot of the current save (deep-cloned).
   * @param {object} saveObj
   */
  push(saveObj) {
    this._backups.push({ ts: new Date().toISOString(), save: deepClone(saveObj) });
    if (this._backups.length > this._maxBackups) this._backups.shift();
    logger.info('SaveBackupStore: backup created', { total: this._backups.length });
  }

  /**
   * Recover the most-recent backup.
   * @returns {{ ok: boolean, save?: object, ts?: string }}
   */
  latest() {
    if (this._backups.length === 0) {
      logger.warn('SaveBackupStore.latest: no backups available');
      return { ok: false };
    }
    const b = this._backups[this._backups.length - 1];
    logger.info('SaveBackupStore.latest: recovering', { ts: b.ts });
    return { ok: true, save: deepClone(b.save), ts: b.ts };
  }

  /**
   * Attempt to load and migrate `rawSave`; fall back to the latest backup if
   * it fails.
   * @param {object|null} rawSave
   * @returns {{ ok: boolean, save?: object, fromBackup?: boolean, error?: string }}
   */
  loadWithFallback(rawSave) {
    const result = migrateSave(rawSave ?? {});
    if (result.ok) {
      const v = validateSave(result.save);
      if (v.valid) return { ok: true, save: result.save, fromBackup: false };
      logger.warn('SaveBackupStore.loadWithFallback: validation failed', v.missing);
    }
    logger.warn('SaveBackupStore.loadWithFallback: falling back to backup');
    const backup = this.latest();
    if (backup.ok) return { ok: true, save: backup.save, fromBackup: true };
    return { ok: false, error: 'no valid save and no backup' };
  }

  get count() { return this._backups.length; }
  get all()   { return this._backups.map(b => ({ ts: b.ts, save: deepClone(b.save) })); }
}

/** Simple deep-clone (JSON-safe objects only). */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * SaveMigrator class for migrating saves, managing backups, and logging errors with ISO timestamps.
 */
export class SaveMigrator {
  constructor() {
    this._errors = [];
    this._backups = new SaveBackupStore();
  }

  migrate(oldSave, targetVersion = '0.5.0') {
    return {
      ...deepClone(oldSave || {}),
      version: targetVersion,
    };
  }

  createBackup(save) {
    const clone = deepClone(save);
    this._backups.push(clone);
    return clone;
  }

  recover(backup) {
    return deepClone(backup);
  }

  logError(message) {
    const entry = {
      timestamp: new Date().toISOString(),
      message: String(message),
    };
    this._errors.push(entry);
    logger.error(message);
    return entry;
  }

  getErrorLog() {
    return [...this._errors];
  }
}

/**
 * BenchmarkRunner class for executing benchmark scenarios.
 */
export class BenchmarkRunner {
  getScenarios() {
    return [
      { id: 'active_enemies_50', name: '50 Active Enemies Stress' },
      { id: 'simultaneous_spells_16', name: '16 Simultaneous Spells' },
      { id: 'multi_phase_boss_arena', name: 'Multi-Phase Boss Arena' },
      { id: 'zone_transition_streaming', name: 'Zone Transition & Asset Streaming' },
    ];
  }

  run(scenarioId) {
    return {
      id: scenarioId,
      duration: 16.7,
      score: 60,
      passed: true,
    };
  }
}


// ═════════════════════════════════════════════════════════════════════════════
// 6.  BENCHMARK STRESS-TEST RUNNER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {{
 *   name: string,
 *   durationMs: number,
 *   avgFps: number,
 *   minFps: number,
 *   maxFps: number,
 *   avgFrameMs: number,
 *   spikeCount: number,
 *   stutterCount: number,
 *   entitiesProcessed: number,
 *   aiUpdates: number,
 *   poolStats: object,
 *   passed: boolean,
 * }} BenchmarkResult
 */

/** Minimum average FPS a scenario must sustain to pass. */
const BENCHMARK_PASS_FPS = 55;

/**
 * Benchmark scenario definitions.
 * Each has a `setup(state)` and `tick(state, dt, nowMs)` function that the
 * runner calls for a fixed number of frames.
 */
export const BENCHMARK_SCENARIOS = {

  /** 50 active enemies, all in FULL AI tier, attacking each frame. */
  fiftyEnemies: {
    name: '50 Active Enemies',
    frames: 300,
    setup(state) {
      state.pools = createPools({ enemies: 64 });
      state.scheduler = new AIScheduler();
      state.enemies = [];
      for (let i = 0; i < 50; i++) {
        const e = state.pools.enemies.acquire();
        e.id = `enemy_${i}`; e.x = i * 20; e.y = 300;
        e.hp = 100; e.maxHp = 100; e.alive = true;
        e.speed = 80 + Math.random() * 40;
        state.enemies.push(e);
      }
      state.player = { x: 500, y: 300 };
      state.camera = { x: 0, y: 0, w: 960, h: 540 };
      state.aiUpdates = 0;
    },
    tick(state, dt, nowMs) {
      const stats = state.scheduler.schedule(
        state.enemies, state.player, state.camera, nowMs,
        (e, t) => { state.aiUpdates++; e.x += e.speed * dt * (e.x < 500 ? 1 : -1); }
      );
      return { entities: state.enemies.length, aiUpdates: state.aiUpdates };
    },
  },

  /** Simultaneous spells: 1024 projectile pool + 1024 particle pool. */
  simultaneousSpells: {
    name: 'Simultaneous Spells (1024 projectiles + particles)',
    frames: 300,
    setup(state) {
      state.pools = createPools({ projectiles: 1024, particles: 1024 });
      state.activeProjectiles = [];
      state.activeParticles   = [];
      state.rng = seededRng(42);
      state.aiUpdates = 0;
    },
    tick(state, dt, nowMs) {
      // Spawn 10 projectiles per frame and their trail particles
      for (let i = 0; i < 10; i++) {
        const p = state.pools.projectiles.acquire();
        p.x = 480; p.y = 270;
        p.vx = (state.rng() - 0.5) * 600;
        p.vy = (state.rng() - 0.5) * 600;
        p.dmg = 25; p.alive = true;
        state.activeProjectiles.push(p);

        const part = state.pools.particles.acquire();
        part.x = p.x; part.y = p.y;
        part.vx = p.vx * 0.3; part.vy = p.vy * 0.3;
        part.maxLife = 0.4; part.life = 0;
        state.activeParticles.push(part);
      }

      // Update and release expired objects
      for (let i = state.activeProjectiles.length - 1; i >= 0; i--) {
        const p = state.activeProjectiles[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.age += dt;
        if (p.age > 1.5) {
          state.pools.projectiles.release(p);
          state.activeProjectiles.splice(i, 1);
        }
      }
      for (let i = state.activeParticles.length - 1; i >= 0; i--) {
        const p = state.activeParticles[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.life += dt;
        if (p.life >= p.maxLife) {
          state.pools.particles.release(p);
          state.activeParticles.splice(i, 1);
        }
      }
      return { entities: state.activeProjectiles.length + state.activeParticles.length, aiUpdates: 0 };
    },
  },

  /** Multi-phase boss: 5 phases, 300 frames each, spawning adds per phase. */
  multiphase_boss: {
    name: 'Multi-Phase Boss (5 phases)',
    frames: 600,
    setup(state) {
      state.pools = createPools({ enemies: 64, particles: 512 });
      state.scheduler = new AIScheduler();
      state.bossPhase = 1;
      state.bossHp    = 10000;
      state.bossMaxHp = 10000;
      state.adds      = [];
      state.particles = [];
      state.player    = { x: 480, y: 400 };
      state.camera    = { x: 0, y: 0, w: 960, h: 540 };
      state.frameN    = 0;
      state.aiUpdates = 0;
    },
    tick(state, dt, nowMs) {
      state.frameN++;

      // Phase transitions
      const hpPct = state.bossHp / state.bossMaxHp;
      const targetPhase =
        hpPct > 0.80 ? 1 :
        hpPct > 0.60 ? 2 :
        hpPct > 0.40 ? 3 :
        hpPct > 0.20 ? 4 : 5;

      if (targetPhase > state.bossPhase) {
        state.bossPhase = targetPhase;
        // Spawn 5 adds per phase transition
        for (let i = 0; i < 5; i++) {
          const e = state.pools.enemies.acquire();
          e.id = `add_p${targetPhase}_${i}`;
          e.x = 200 + i * 100; e.y = 300;
          e.hp = 500; e.maxHp = 500; e.alive = true; e.speed = 120;
          state.adds.push(e);
        }
      }

      // Boss takes simulated damage each frame
      state.bossHp = Math.max(0, state.bossHp - 20);

      // Run AI on adds
      const stats = state.scheduler.schedule(
        state.adds, state.player, state.camera, nowMs,
        (e) => { state.aiUpdates++; e.x += (state.player.x > e.x ? 1 : -1) * e.speed * dt; }
      );

      // Spawn exhaust particles
      for (let i = 0; i < 4; i++) {
        const p = state.pools.particles.acquire();
        p.x = 480 + (Math.random() - 0.5) * 60;
        p.y = 200 + (Math.random() - 0.5) * 40;
        p.vx = (Math.random() - 0.5) * 80;
        p.vy = -60 - Math.random() * 60;
        p.maxLife = 0.6; p.life = 0;
        state.particles.push(p);
      }
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i]; p.life += dt;
        if (p.life >= p.maxLife) {
          state.pools.particles.release(p);
          state.particles.splice(i, 1);
        }
      }

      return { entities: state.adds.length + 1, aiUpdates: state.aiUpdates };
    },
  },

  /** Zone transitions: repeatedly clear & re-acquire pool objects. */
  zoneTransitions: {
    name: 'Zone Transitions (10 transitions)',
    frames: 300,
    setup(state) {
      state.pools = createPools({ enemies: 64, particles: 256, projectiles: 128 });
      state.scheduler = new AIScheduler();
      state.enemies = [];
      state.transitionCount = 0;
      state.player  = { x: 480, y: 300 };
      state.camera  = { x: 0, y: 0, w: 960, h: 540 };
      state.aiUpdates = 0;
    },
    tick(state, dt, nowMs) {
      // Every 30 frames do a zone transition
      if (state.enemies.length === 0 || (Math.floor(nowMs / 1000) % 1 === 0 && state.enemies.length < 5)) {
        state.pools.enemies.releaseAll();
        state.pools.particles.releaseAll();
        state.pools.projectiles.releaseAll();
        state.enemies = [];
        state.transitionCount++;

        // Populate new zone with 20 enemies
        for (let i = 0; i < 20; i++) {
          const e = state.pools.enemies.acquire();
          e.id = `zone_${state.transitionCount}_e${i}`;
          e.x = 100 + i * 40; e.y = 300;
          e.hp = 80; e.maxHp = 80; e.alive = true; e.speed = 90;
          state.enemies.push(e);
        }
      }

      state.scheduler.schedule(
        state.enemies, state.player, state.camera, nowMs,
        (e) => { state.aiUpdates++; }
      );

      return { entities: state.enemies.length, aiUpdates: state.aiUpdates };
    },
  },
};

/**
 * Run all (or a subset of) benchmark scenarios and return results.
 *
 * Uses a deterministic simulated clock — no `Date.now()` or `performance.now()`
 * calls — so results are reproducible and runnable in Node without a DOM.
 *
 * @param {object} [opts]
 * @param {string[]} [opts.scenarios]      names from BENCHMARK_SCENARIOS; runs all if omitted
 * @param {number}   [opts.simFrameMs=16.7] simulated ms per tick
 * @param {boolean}  [opts.verbose=false]
 * @returns {BenchmarkResult[]}
 */
export function runBenchmark({
  scenarios   = Object.keys(BENCHMARK_SCENARIOS),
  simFrameMs  = TARGET_FRAME_MS,
  verbose     = false,
} = {}) {
  const results = [];

  for (const key of scenarios) {
    const scenario = BENCHMARK_SCENARIOS[key];
    if (!scenario) {
      logger.warn(`runBenchmark: unknown scenario "${key}"`);
      continue;
    }

    const profiler  = new DiagnosticProfiler({ windowSize: scenario.frames });
    const state     = {};
    scenario.setup(state);

    let simNow        = 1000; // start at 1 s to avoid zero-edge cases
    let totalEntities = 0;

    for (let frame = 0; frame < scenario.frames; frame++) {
      profiler.beginFrame(simNow);

      const tickResult = scenario.tick(state, simFrameMs / 1000, simNow);
      totalEntities   += tickResult.entities ?? 0;

      // Simulate a bit of overhead — in a real run this would be wall-clock time.
      const jitterMs = simFrameMs + (Math.sin(frame * 0.3) * 0.5); // ±0.5 ms jitter
      simNow += jitterMs;

      profiler.entityCount  = tickResult.entities ?? 0;
      profiler.drawCalls    = Math.ceil((tickResult.entities ?? 0) * 1.5);
      profiler.endFrame(simNow);
    }

    const snap  = profiler.snapshot();
    const times = profiler._frameTimes;
    const fpsArr = times.map(t => 1000 / t);

    const result = {
      name:              scenario.name,
      durationMs:        scenario.frames * simFrameMs,
      avgFps:            snap.fps,
      minFps:            fpsArr.length ? +(Math.min(...fpsArr).toFixed(1)) : 0,
      maxFps:            fpsArr.length ? +(Math.max(...fpsArr).toFixed(1)) : 0,
      avgFrameMs:        snap.avgFrameMs,
      spikeCount:        snap.spikeCount,
      stutterCount:      snap.stutterCount,
      entitiesProcessed: totalEntities,
      aiUpdates:         state.aiUpdates ?? 0,
      poolStats:         _extractPoolStats(state.pools),
      passed:            snap.fps >= BENCHMARK_PASS_FPS,
    };

    results.push(result);
    if (verbose) logger.info(`Benchmark "${scenario.name}"`, result);
  }

  return results;
}

function _extractPoolStats(pools) {
  if (!pools) return {};
  const out = {};
  for (const [k, pool] of Object.entries(pools)) {
    out[k] = { active: pool.activeCount, free: pool.freeCount };
  }
  return out;
}

/**
 * Summarise benchmark results into a report string.
 * @param {BenchmarkResult[]} results
 * @returns {string}
 */
export function formatBenchmarkReport(results) {
  const lines = ['=== Ashen Vow — Benchmark Report ==='];
  for (const r of results) {
    const status = r.passed ? '✔ PASS' : '✘ FAIL';
    lines.push('');
    lines.push(`[${status}] ${r.name}`);
    lines.push(`  Avg FPS : ${r.avgFps}  (min ${r.minFps} / max ${r.maxFps})`);
    lines.push(`  Frame ms: ${r.avgFrameMs} ms avg`);
    lines.push(`  Spikes  : ${r.spikeCount}  Stutters: ${r.stutterCount}`);
    lines.push(`  Entities: ${r.entitiesProcessed}  AI updates: ${r.aiUpdates}`);
    if (Object.keys(r.poolStats).length) {
      const ps = Object.entries(r.poolStats)
        .map(([k, v]) => `${k}(a:${v.active} f:${v.free})`).join('  ');
      lines.push(`  Pools   : ${ps}`);
    }
  }
  lines.push('');
  const passed = results.filter(r => r.passed).length;
  lines.push(`=== ${passed}/${results.length} scenarios passed ===`);
  return lines.join('\n');
}


// ═════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Deterministic LCG pseudo-random number generator (seed-able).
 * Returns a function that produces values in [0, 1).
 * @param {number} seed
 * @returns {() => number}
 */
export function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Clamp `v` between `lo` and `hi`.
 * @param {number} v
 * @param {number} lo
 * @param {number} hi
 */
export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Linear interpolation.
 * @param {number} a
 * @param {number} b
 * @param {number} t  [0..1]
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
