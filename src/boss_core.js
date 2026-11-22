// Ashen Vow — Update X: boss combat core.
// Independent attack hitboxes, a movement controller that owns gravity /
// ground / boundaries / knockback, and a phase controller with explicit guards
// against loops, duplicate transitions, negative HP and post-defeat attacks.
//
// Everything here is pure and deterministic so the whole boss roster can be
// validated in Node without a browser.

export const HITBOX_KINDS = Object.freeze({
  ARC: 'arc',
  CIRCLE: 'circle',
  BOX: 'box',
  LINE: 'line',
});

export const PHASE_EVENTS = Object.freeze({
  ADVANCE: 'advance',
  BLOCKED_DYING: 'blocked-dying',
  BLOCKED_COOLDOWN: 'blocked-cooldown',
  BLOCKED_INVALID: 'blocked-invalid',
});

function clamp(value, lo, hi) {
  return value < lo ? lo : value > hi ? hi : value;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * A named attack instance: windup → active → recovery. A hitbox can damage each
 * target once per activation unless the attack explicitly declares
 * `continuous` with a repeat interval.
 *
 * def = {
 *   windup, active, recovery,       // seconds
 *   shape, range, width, height,    // geometry (world units)
 *   offsetX, offsetY,               // relative to the owner centre
 *   damage, knock,                  // damage configuration
 *   hitReaction: 'knockback'|'stagger'|'none',
 *   continuous: false, repeat: 0,   // optional multi-hit design
 *   cancelOn: ['death','stagger'],
 *   sound: string,
 * }
 */
export class AttackHitbox {
  constructor(id, def = {}, owner = null) {
    this.id = id;
    this.def = {
      windup: Number(def.windup) || 0,
      active: Math.max(0.01, Number(def.active) || 0.12),
      recovery: Math.max(0, Number(def.recovery) || 0.2),
      shape: def.shape || HITBOX_KINDS.BOX,
      range: Number(def.range) || 90,
      width: Number(def.width) || 90,
      height: Number(def.height) || 60,
      offsetX: Number(def.offsetX) || 0,
      offsetY: Number(def.offsetY) || 0,
      damage: Math.max(0, Number(def.damage) || 0),
      knock: Number(def.knock) || 0,
      hitReaction: def.hitReaction || 'knockback',
      continuous: !!def.continuous,
      repeat: Math.max(0.05, Number(def.repeat) || 0.35),
      cancelOn: def.cancelOn || ['death', 'stagger'],
      sound: def.sound || null,
    };
    this.owner = owner;
    this.time = 0;
    this.closed = false;
    this.hit = new Map(); // targetId → last hit time
  }

  get duration() {
    return this.def.windup + this.def.active + this.def.recovery;
  }

  get phase() {
    if (this.closed) return 'closed';
    if (this.time < this.def.windup) return 'windup';
    if (this.time < this.def.windup + this.def.active) return 'active';
    if (this.time < this.duration) return 'recovery';
    return 'done';
  }

  get isActive() {
    return this.phase === 'active';
  }

  cancel(reason = 'cancel') {
    this.closed = true;
    this.cancelReason = reason;
  }

  update(dt) {
    if (this.closed) return;
    this.time += dt;
    if (this.time >= this.duration) this.closed = true;
    if (this.def.cancelOn.includes('stagger') && this.owner?.stagger > 0) this.cancel('stagger');
    if (this.def.cancelOn.includes('death') && (this.owner?.dying || this.owner?.hp <= 0)) this.cancel('death');
  }

  /** World-space hitbox for the owner's current position and facing. */
  box() {
    const o = this.owner || { x: 0, y: 0, w: 60, h: 60, facing: 1 };
    const cx = o.x + (o.w || 0) / 2;
    const cy = o.y + (o.h || 0) / 2;
    const facing = o.facing || 1;
    const width = this.def.shape === HITBOX_KINDS.CIRCLE ? this.def.range * 2 : (this.def.width || this.def.range);
    const height = this.def.shape === HITBOX_KINDS.CIRCLE ? this.def.range * 2 : (this.def.height || 60);
    return {
      x: cx + facing * this.def.offsetX - width / 2,
      y: cy + this.def.offsetY - height / 2,
      w: width,
      h: height,
      facing,
    };
  }

  /**
   * Test a target and report whether it should take damage this frame.
   * Returns true at most once per activation for non-continuous attacks.
   */
  tryHit(target, time = this.time) {
    if (this.closed || !this.isActive || !target) return false;
    const id = target.id ?? 'player';
    const last = this.hit.get(id);
    if (last !== undefined) {
      if (!this.def.continuous) return false;
      if (time - last < this.def.repeat) return false;
    }
    if (!rectsOverlap(this.box(), target)) return false;
    this.hit.set(id, time);
    return true;
  }

  snapshot() {
    return {
      id: this.id,
      phase: this.phase,
      time: Number(this.time.toFixed(3)),
      active: this.isActive,
      hits: this.hit.size,
      damage: this.def.damage,
    };
  }
}

/** Registry that owns every hitbox a boss can open. */
export class HitboxSet {
  constructor(owner = null) {
    this.owner = owner;
    this.boxes = new Map();
  }

  open(id, def) {
    const box = new AttackHitbox(id, def, this.owner);
    this.boxes.set(id, box);
    return box;
  }

  get(id) {
    return this.boxes.get(id) || null;
  }

  active(id) {
    return !!this.boxes.get(id)?.isActive;
  }

  update(dt) {
    for (const box of [...this.boxes.values()]) {
      box.update(dt);
      if (box.closed) this.boxes.delete(box.id);
    }
  }

  closeAll(reason = 'cancel') {
    for (const box of this.boxes.values()) box.cancel(reason);
    this.boxes.clear();
  }

  snapshot() {
    return [...this.boxes.values()].map((box) => box.snapshot());
  }
}

const PHYSICS_DEFAULTS = Object.freeze({
  gravity: 2200,
  maxFall: 1400,
  groundTolerance: 14,
  stepHeight: 26,
  friction: 0.86,
  turnRate: 12,
  arenaPad: 24,
  wallPad: 20,
  knockDecay: 6,
});

/**
 * Deterministic movement controller for large bosses. It owns ground detection,
 * gravity, wall/arena boundaries, knockback decay and smooth turning, so the
 * attack state machine never has to touch physics.
 */
export class BossPhysics {
  constructor(options = {}) {
    this.config = { ...PHYSICS_DEFAULTS, ...options };
    this.grounded = true;
    this.wall = 0;
    this.arena = true;
    this.vy = 0;
    this.vx = 0;
    this.knockVx = 0;
    this.knockTimer = 0;
    this.errors = [];
  }

  reset(boss) {
    this.grounded = true;
    this.wall = 0;
    this.arena = true;
    this.vy = 0;
    this.vx = 0;
    this.knockTimer = 0;
    if (boss) {
      boss.vx = 0;
      boss.vy = 0;
      boss.onGround = true;
    }
    return this;
  }

  applyKnockback(dir, force = 240, duration = 0.22) {
    this.knockVx = (dir || 1) * Math.abs(force);
    this.vx = this.knockVx;
    this.vy = Math.min(this.vy, -Math.abs(force) * 0.35);
    this.knockTimer = duration;
    this.grounded = false;
    return this;
  }

  /** Advance one step. Mutates boss position/velocity and returns diagnostics. */
  step(boss, room, dt) {
    if (!boss || !Number.isFinite(dt) || dt <= 0) {
      return { grounded: this.grounded, vy: this.vy, wallClamped: false, inArena: this.arena };
    }
    const cfg = this.config;
    const platforms = (room?.platforms || []).filter((pl) => pl && pl.h >= 8);
    const minX = Math.max(cfg.wallPad, Number(room?.minX) || 0) + cfg.wallPad;
    const maxX = (Number(room?.maxX) || (Number(room?.width) || 1280)) - (boss.w || 0) - cfg.wallPad;
    const previousBottom = boss.y + (boss.h || 0);

    // Horizontal motion: intent plus a decaying knockback impulse.
    if (this.knockTimer > 0) this.knockTimer = Math.max(0, this.knockTimer - dt);
    this.knockVx *= Math.exp(-cfg.knockDecay * dt);
    if (Math.abs(this.knockVx) < 2) this.knockVx = 0;
    this.vx = (boss.vx || 0) + this.knockVx;
    const nextX = boss.x + this.vx * dt;
    let wallClamped = false;
    if (nextX < minX) {
      boss.x = minX;
      this.vx = 0;
      this.knockVx = 0;
      wallClamped = true;
    } else if (nextX > maxX) {
      boss.x = maxX;
      this.vx = 0;
      this.knockVx = 0;
      wallClamped = true;
    } else {
      boss.x = nextX;
    }
    this.wall = boss.x <= minX + 0.5 ? -1 : boss.x >= maxX - 0.5 ? 1 : 0;
    this.arena = boss.x >= minX - 0.5 && boss.x <= maxX + 0.5;

    // Vertical motion and ground detection.
    if (boss.flying) {
      this.vy = boss.vy || 0;
      boss.y += this.vy * dt;
      this.grounded = false;
    } else {
      this.vy = clamp(this.vy + cfg.gravity * dt, -cfg.maxFall, cfg.maxFall);
      boss.y += this.vy * dt;
      this.grounded = false;
      for (const plat of platforms) {
        if (boss.x + (boss.w || 0) <= plat.x || boss.x >= plat.x + plat.w) continue;
        if (this.vy >= 0 && previousBottom <= plat.y + cfg.groundTolerance && boss.y + (boss.h || 0) >= plat.y) {
          boss.y = plat.y - (boss.h || 0);
          this.vy = 0;
          this.grounded = true;
        }
      }
      // Slope/step assist: snap up small ledges instead of snagging on them.
      if (!this.grounded) {
        for (const plat of platforms) {
          if (boss.x + (boss.w || 0) <= plat.x || boss.x >= plat.x + plat.w) continue;
          const delta = plat.y - (boss.y + (boss.h || 0));
          if (delta > 0 && delta <= cfg.stepHeight && this.vy >= 0) {
            boss.y = plat.y - (boss.h || 0);
            this.vy = 0;
            this.grounded = true;
          }
        }
      }
    }
    if (!Number.isFinite(boss.x) || !Number.isFinite(boss.y)) {
      this.errors.push('non-finite boss position');
      boss.x = clamp(Number(boss.x) || minX, minX, maxX);
      boss.y = clamp(Number(boss.y) || 0, 0, 2000);
      this.vy = 0;
    }
    boss.vx = this.vx;
    boss.vy = this.vy;
    boss.onGround = this.grounded;
    return { grounded: this.grounded, vy: this.vy, wallClamped, inArena: this.arena };
  }
}

/**
 * Phase controller with hard guards:
 *  • never transitions twice for the same HP threshold,
 *  • never transitions after death or with hp <= 0,
 *  • respects a short cooldown so simultaneous hits cannot double-fire,
 *  • clamps phase into [1, maxPhases].
 */
export class PhaseController {
  constructor(info = {}, options = {}) {
    this.maxPhases = Math.max(1, Math.floor(Number(info.maxPhases) || 1));
    this.thresholds = (Array.isArray(info.phaseThresholds) ? info.phaseThresholds : [])
      .map((value) => clamp(Number(value) || 0.5, 0.01, 0.99))
      .slice(0, Math.max(0, this.maxPhases - 1))
      .sort((a, b) => b - a);
    this.cooldown = options.cooldown ?? 0.12;
    this.fired = new Set();
    this.lastTransition = -Infinity;
    this.time = 0;
    this.transitions = 0;
    this.blocked = [];
  }

  thresholdFor(phase) {
    return this.thresholds[phase - 1] ?? null;
  }

  /** How many phase advances are due right now (without committing). */
  evaluate(boss, dt = 0) {
    this.time += dt;
    if (!boss) return { advance: 0, reason: PHASE_EVENTS.BLOCKED_INVALID };
    if (boss.dying || boss.hp <= 0) return { advance: 0, reason: PHASE_EVENTS.BLOCKED_DYING };
    if (boss.phase >= this.maxPhases || this.maxPhases <= 1) return { advance: 0, reason: PHASE_EVENTS.BLOCKED_INVALID };
    if (this.time - this.lastTransition < this.cooldown) return { advance: 0, reason: PHASE_EVENTS.BLOCKED_COOLDOWN };
    const fraction = boss.hp / Math.max(1, boss.maxHp || 1);
    let advance = 0;
    let phase = boss.phase;
    while (phase < this.maxPhases) {
      const threshold = this.thresholdFor(phase);
      if (threshold === null) break;
      if (fraction > threshold) break;
      if (this.fired.has(phase)) break;
      advance += 1;
      phase += 1;
      if (advance > this.maxPhases) break;
    }
    return { advance, phase, reason: advance > 0 ? PHASE_EVENTS.ADVANCE : 'none', fraction };
  }

  /**
   * Commit the transition, invoking `onPhase(boss, nextPhase)` for each step.
   * Returns the list of phases that were entered.
   */
  commit(boss, onPhase, dt = 0) {
    const result = this.evaluate(boss, dt);
    if (!result.advance) {
      if (result.reason !== 'none') this.blocked.push(result.reason);
      return [];
    }
    const entered = [];
    for (let i = 0; i < result.advance; i += 1) {
      this.fired.add(boss.phase);
      boss.phase += 1;
      entered.push(boss.phase);
      this.lastTransition = this.time;
      this.transitions += 1;
      if (typeof onPhase === 'function') onPhase(boss, boss.phase);
    }
    boss.phase = clamp(boss.phase, 1, this.maxPhases);
    return entered;
  }
}

/** Static validation for a boss definition. Returns a list of problems. */
export function validateBossConfig(kind, info, options = {}) {
  const errors = [];
  if (!info || typeof info !== 'object') return [`${kind}: missing definition`];
  const hp = Number(info.hp ?? info.maxHp);
  if (!(hp > 0)) errors.push(`${kind}: hp must be > 0`);
  if (!(Number(info.contact) >= 0)) errors.push(`${kind}: contact must be >= 0`);
  const phases = Number(info.maxPhases) || (Array.isArray(info.phaseThresholds) ? info.phaseThresholds.length + 1 : 2);
  if (phases < 1 || phases > 8) errors.push(`${kind}: maxPhases out of range (${phases})`);
  const thresholds = Array.isArray(info.phaseThresholds) ? info.phaseThresholds : (phases === 2 ? [0.5] : []);
  if (thresholds.length < phases - 1) errors.push(`${kind}: needs ${phases - 1} phase thresholds, has ${thresholds.length}`);
  for (let i = 0; i < thresholds.length - 1; i += 1) {
    if (!(thresholds[i] > thresholds[i + 1])) errors.push(`${kind}: phase thresholds must descend (${thresholds.join(', ')})`);
  }
  for (const threshold of thresholds) {
    if (!(threshold > 0 && threshold < 1)) errors.push(`${kind}: threshold ${threshold} outside (0,1)`);
  }
  const dialogue = info.dialogue || {};
  if (options.requireDialogue !== false) {
    if (!dialogue.intro) errors.push(`${kind}: missing intro dialogue`);
    if (!dialogue.defeat) errors.push(`${kind}: missing defeat dialogue`);
    for (let phase = 2; phase <= phases; phase += 1) {
      if (!dialogue[`phase${phase}`]) errors.push(`${kind}: missing phase${phase} dialogue`);
    }
  }
  if (!(Number(info.w) > 0) || !(Number(info.h) > 0)) errors.push(`${kind}: missing hitbox size`);
  return errors;
}

/**
 * Headless combat simulation: drives the phase controller and hitbox set for a
 * boss and asserts the invariants the release criteria call out.
 */
export function simulateBossCombat(config = {}, options = {}) {
  const phases = Math.max(1, Math.floor(
    Number(config.maxPhases)
    || (Array.isArray(config.phaseThresholds) ? config.phaseThresholds.length + 1 : 2),
  ));
  const maxHp = Math.max(1, Number(config.maxHp) || Number(config.hp) || 1000);
  const dps = Math.max(1, Number(options.dps) || 120);
  const dt = 1 / 120;
  const boss = {
    hp: maxHp,
    maxHp,
    phase: 1,
    dying: false,
    stagger: 0,
    x: 400,
    y: 400,
    w: Number(config.w) || 120,
    h: Number(config.h) || 120,
    facing: 1,
  };
  const controller = new PhaseController(
    { maxPhases: phases, phaseThresholds: config.phaseThresholds || (phases === 2 ? [0.5] : []) },
    { cooldown: 0.1 },
  );
  const hitboxes = new HitboxSet(boss);
  const events = { phases: [], attacks: 0, doubleHits: 0, afterDeath: 0, negativeHp: 0 };
  let time = 0;
  let attackTimer = 0;

  while (boss.hp > 0 && time < 240) {
    time += dt;
    boss.hp = Math.max(0, boss.hp - dps * dt);
    const entered = controller.commit(boss, (b, phase) => events.phases.push({ phase, at: Number(time.toFixed(2)) }), dt);
    if (entered.length > phases) events.doubleHits += 1;

    attackTimer -= dt;
    if (attackTimer <= 0 && boss.hp > 0) {
      attackTimer = 1.1;
      events.attacks += 1;
      hitboxes.open('strike', { windup: 0.2, active: 0.12, recovery: 0.3, damage: 10, width: 120, height: 90 });
    }
    hitboxes.update(dt);
    const box = hitboxes.get('strike');
    if (box) {
      const target = { id: 'player', x: boss.x - 10, y: boss.y, w: 30, h: 46 };
      let hits = 0;
      for (let step = 0; step < 8; step += 1) if (box.tryHit(target)) hits += 1;
      if (hits > 1) events.doubleHits += hits - 1;
      if (boss.hp <= 0 && box.isActive) events.afterDeath += 1;
    }
    if (boss.hp < 0) events.negativeHp += 1;
    if (!boss.dying && boss.hp <= 0) {
      boss.dying = true;
      boss.hp = 0;
      hitboxes.closeAll('death');
    }
  }

  const finalPhase = boss.phase;
  return {
    time: Number(time.toFixed(2)),
    finalPhase,
    expectedPhases: phases,
    reachedFinalPhase: finalPhase === phases,
    attacks: events.attacks,
    phaseTransitions: events.phases.length,
    doubleTransitions: Math.max(0, events.phases.length - (phases - 1)),
    doubleHits: events.doubleHits,
    attacksAfterDeath: events.afterDeath,
    negativeHp: events.negativeHp,
    blocked: controller.blocked.length,
    passed: finalPhase === phases
      && events.doubleHits === 0
      && events.afterDeath === 0
      && events.negativeHp === 0
      && events.phases.length === phases - 1,
  };
}

export function bossDebugSnapshot(boss) {
  if (!boss) return null;
  return {
    id: boss.id,
    kind: boss.kind,
    name: boss.name,
    phase: boss.phase,
    maxPhases: boss.maxPhases,
    hp: Math.max(0, Math.round(boss.hp)),
    maxHp: boss.maxHp,
    state: boss.state,
    activeAttack: boss.activeAttack || null,
    hitboxes: boss.hitboxes ? boss.hitboxes.snapshot() : [],
    grounded: !!boss.onGround,
    velocity: { vx: Number((boss.vx || 0).toFixed(1)), vy: Number((boss.vy || 0).toFixed(1)) },
    inArena: boss.arenaState?.inArena ?? true,
    transitioning: !!boss.transitioning,
    invulnerable: (boss.invuln || 0) > 0,
    dying: !!boss.dying,
  };
}
