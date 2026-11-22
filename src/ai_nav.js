// Ashen Vow — Update X: enemy navigation, perception and the shared AI state
// machine. Pure and deterministic: no DOM, no timers, no randomness beyond an
// injected seeded RNG, so Node tests and the browser run identical logic.
//
// The navigation layer is a hybrid:
//   • a surface navigation graph sampled from the room's solid platforms,
//     connected by typed walk / jump / drop / door / ladder edges, and searched
//     with A* — this is the "grid/graph" half;
//   • line-of-sight tests against the same platform rectangles, so enemies
//     cannot see or attack through walls.
//
// Every enemy gets one EnemyBrain. The brain owns perception, the state machine,
// path following, separation and stuck recovery; the engine keeps ownership of
// physics and the per-type attack animations.

export const AI_STATES = Object.freeze({
  IDLE: 'idle',
  PATROL: 'patrol',
  DETECT: 'detect',
  CHASE: 'chase',
  ATTACK: 'attack',
  SEARCH: 'search',
  RETURN: 'return',
  RETREAT: 'retreat',
  GUARD: 'guard',
  ASSIST: 'assist',
  STUNNED: 'stunned',
  RECOVER: 'recover',
});

/** Legal transitions. Anything not listed is rejected by setState(). */
export const AI_TRANSITIONS = Object.freeze({
  idle: ['patrol', 'detect', 'guard', 'assist', 'stunned', 'return'],
  patrol: ['detect', 'idle', 'guard', 'assist', 'stunned', 'return'],
  detect: ['chase', 'patrol', 'idle', 'stunned', 'return'],
  chase: ['attack', 'search', 'retreat', 'stunned', 'return', 'detect', 'recover'],
  attack: ['chase', 'recover', 'retreat', 'stunned', 'return'],
  search: ['chase', 'return', 'idle', 'stunned', 'detect'],
  return: ['patrol', 'idle', 'detect', 'chase', 'stunned'],
  retreat: ['chase', 'search', 'recover', 'stunned', 'return'],
  guard: ['detect', 'chase', 'patrol', 'stunned', 'return'],
  assist: ['chase', 'detect', 'return', 'stunned', 'patrol'],
  stunned: ['chase', 'patrol', 'idle', 'search', 'return'],
  recover: ['chase', 'retreat', 'search', 'patrol', 'stunned'],
});

const DEFAULTS = Object.freeze({
  aggroRange: 540,
  verticalRange: 300,
  attackRange: 78,
  preferredRange: 160,
  minRange: 0,
  memory: 3.2,
  reaction: 0.22,
  searchTime: 6,
  returnTime: 14,
  retreatHealth: 0,
  retreatTime: 1.1,
  attackCooldown: 0.9,
  speedMul: 1,
  canFly: false,
  flank: false,
  separation: 26,
  repathInterval: 0.22,
  stuckLimit: 0.7,
  unstickCooldown: 1.4,
});

/**
 * Behaviour profiles. These are intentionally different per family: a ranged
 * caster keeps distance, an assassin flanks, a heavy commits slowly. `kind`
 * selects the archetype used by the brain; the attack animation stays in core.
 */
export const AI_PROFILES = Object.freeze({
  melee: { ...DEFAULTS, kind: 'melee', aggroRange: 540, attackRange: 84, preferredRange: 56, reaction: 0.34 },
  ranged: { ...DEFAULTS, kind: 'ranged', aggroRange: 720, attackRange: 420, preferredRange: 250, minRange: 150, reaction: 0.28, speedMul: 0.85 },
  magic: { ...DEFAULTS, kind: 'magic', aggroRange: 620, attackRange: 380, preferredRange: 300, minRange: 190, reaction: 0.28, retreatHealth: 0.35, retreatTime: 1.6 },
  flyer: { ...DEFAULTS, kind: 'flyer', aggroRange: 700, verticalRange: 460, attackRange: 360, preferredRange: 240, minRange: 130, canFly: true, reaction: 0.28 },
  heavy: { ...DEFAULTS, kind: 'heavy', aggroRange: 480, attackRange: 120, preferredRange: 70, reaction: 0.34, speedMul: 0.8, attackCooldown: 1.4, stuckLimit: 1.1 },
  assassin: { ...DEFAULTS, kind: 'assassin', aggroRange: 600, attackRange: 70, preferredRange: 44, reaction: 0.14, speedMul: 1.15, flank: true, retreatHealth: 0.25 },
  elite: { ...DEFAULTS, kind: 'elite', aggroRange: 660, attackRange: 118, preferredRange: 90, reaction: 0.18, speedMul: 1.05, retreatHealth: 0.3, flank: true },
  boss: { ...DEFAULTS, kind: 'boss', aggroRange: 900, verticalRange: 500, attackRange: 170, preferredRange: 90, reaction: 0.2, speedMul: 1 },
});

const ARCHETYPE_TO_PROFILE = {
  chaser: 'melee',
  lunge: 'melee',
  ranged: 'ranged',
  slam: 'heavy',
  burrower: 'assassin',
  spawner: 'magic',
  hopper: 'melee',
};

/** Resolve the profile for a spawned enemy without mutating it. */
export function profileFor(enemy) {
  if (!enemy) return AI_PROFILES.melee;
  if (enemy.boss) return AI_PROFILES.boss;
  if (enemy.elite) return AI_PROFILES.elite;
  const ai = enemy.ai || enemy.type;
  if (ai === 'wraith') return AI_PROFILES.flyer;
  if (ai === 'brute') return AI_PROFILES.heavy;
  if (ai === 'broodmother') return AI_PROFILES.magic;
  if (ai === 'stalker') return AI_PROFILES.assassin;
  if (ARCHETYPE_TO_PROFILE[enemy.archetype]) return AI_PROFILES[ARCHETYPE_TO_PROFILE[enemy.archetype]];
  return AI_PROFILES[ARCHETYPE_TO_PROFILE[ai]] || AI_PROFILES.melee;
}

function clamp(value, lo, hi) {
  return value < lo ? lo : value > hi ? hi : value;
}

function sign(value) {
  return value < 0 ? -1 : 1;
}

function seededRandom(seed) {
  let state = (Number(seed) || 1) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

// ── geometry ────────────────────────────────────────────────────────────────

/** True when the axis-aligned rectangle blocks the segment (a→b). */
export function segmentHitsRect(ax, ay, bx, by, rect) {
  const { x, y, w, h } = rect;
  const inside = (px, py) => px >= x && px <= x + w && py >= y && py <= y + h;
  if (inside(ax, ay) || inside(bx, by)) return true;
  const dx = bx - ax;
  const dy = by - ay;
  let t0 = 0;
  let t1 = 1;
  const clip = (p, q) => {
    if (Math.abs(p) < 1e-9) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  return clip(-dx, ax - x)
    && clip(dx, x + w - ax)
    && clip(-dy, ay - y)
    && clip(dy, y + h - ay);
}

/**
 * Sample a solid-platform room into a navigation graph.
 * Nodes sit on platform surfaces; edges are typed so jump and drop routes are
 * distinguishable and can be disabled independently.
 */
export class NavGraph {
  constructor(room, options = {}) {
    this.spacing = Math.max(18, Number(options.spacing) || 40);
    this.stepHeight = Number(options.stepHeight) || 26;
    this.jumpHeight = Number(options.jumpHeight) || 190;
    this.jumpRange = Number(options.jumpRange) || 280;
    this.dropHeight = Number(options.dropHeight) || 420;
    this.dropRange = Number(options.dropRange) || 320;
    this.room = room || { platforms: [] };
    this.platforms = (this.room.platforms || [])
      .filter((pl) => pl && Number.isFinite(pl.x) && Number.isFinite(pl.y) && pl.w > 0)
      .map((pl) => ({ x: pl.x, y: pl.y, w: pl.w, h: Math.max(0, pl.h || 0) }));
    this.nodes = [];
    this.edges = new Map();
    this.blockedPlatforms = new Set();
    this.version = 1;
    this.build();
  }

  build() {
    this.nodes = [];
    this.edges = new Map();
    this.platforms.forEach((pl, platformIndex) => {
      const samples = Math.max(1, Math.floor(pl.w / this.spacing));
      for (let i = 0; i < samples; i += 1) {
        const x = pl.x + this.spacing / 2 + i * this.spacing;
        if (x > pl.x + pl.w) break;
        const node = {
          id: this.nodes.length,
          platform: platformIndex,
          x,
          y: pl.y,
          w: this.spacing,
        };
        this.nodes.push(node);
        this.edges.set(node.id, []);
      }
    });
    this.connect();
    return this;
  }

  connect() {
    const add = (a, b, kind, cost) => {
      const bucket = this.edges.get(a.id);
      if (!bucket) return;
      const existing = bucket.find((edge) => edge.to === b.id);
      if (existing) {
        if (cost < existing.cost) Object.assign(existing, { kind, cost });
        return;
      }
      bucket.push({ from: a.id, to: b.id, kind, cost });
    };

    for (const a of this.nodes) {
      for (const b of this.nodes) {
        if (a.id === b.id) continue;
        const gap = Math.abs(a.x - b.x);
        const dy = b.y - a.y;
        const samePlatform = a.platform === b.platform;
        const adjacent = samePlatform && Math.abs(a.x - b.x) <= this.spacing * 1.05;
        if (adjacent) {
          add(a, b, 'walk', 1);
          continue;
        }
        if (gap > this.jumpRange) continue;
        if (Math.abs(dy) <= this.stepHeight && gap <= this.spacing * 1.4) {
          add(a, b, 'walk', 1 + gap * 0.01);
        } else if (dy < -this.stepHeight && -dy <= this.jumpHeight) {
          add(a, b, 'jump', 1.7 + gap * 0.004 + -dy * 0.002);
        } else if (dy > this.stepHeight && dy <= this.dropHeight && gap <= this.dropRange) {
          add(a, b, 'drop', 1.15 + gap * 0.003 + dy * 0.0008);
        }
      }
    }
  }

  /** Multiply the graph revision so brains know to repath. */
  invalidate() {
    this.version += 1;
  }

  setBlocked(platformIndex, blocked = true) {
    if (blocked) this.blockedPlatforms.add(platformIndex);
    else this.blockedPlatforms.delete(platformIndex);
    this.invalidate();
    return this;
  }

  nearest(x, y, maxDistance = Infinity) {
    let best = null;
    let bestDist = maxDistance;
    for (const node of this.nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = node;
      }
    }
    return best;
  }

  node(id) {
    return this.nodes[id] || null;
  }

  lineOfSight(ax, ay, bx, by) {
    for (let i = 0; i < this.platforms.length; i += 1) {
      const pl = this.platforms[i];
      // Zero-height strips are surfaces, not walls: they never block sight.
      if (pl.h < 8) continue;
      if (segmentHitsRect(ax, ay, bx, by, pl)) return false;
    }
    return true;
  }

  /** True when a foot position has solid ground below it (within tolerance). */
  groundAt(x, footY, tolerance = 12) {
    for (const pl of this.platforms) {
      if (x < pl.x || x > pl.x + pl.w) continue;
      if (Math.abs(pl.y - footY) <= tolerance) return pl.y;
    }
    return null;
  }

  /**
   * A* over the surface graph.
   * @returns {{path:number[], waypoints:Array<{x:number,y:number,platform:number}>, cost:number, kinds:string[]}|null}
   */
  path(from, to, options = {}) {
    const start = typeof from === 'number' ? this.node(from) : this.nearest(from?.x ?? 0, from?.y ?? 0);
    const goal = typeof to === 'number' ? this.node(to) : this.nearest(to?.x ?? 0, to?.y ?? 0);
    if (!start || !goal) return null;
    if (this.blockedPlatforms.has(start.platform) || this.blockedPlatforms.has(goal.platform)) return null;
    if (start.id === goal.id) {
      return { path: [start.id], waypoints: [{ x: start.x, y: start.y, platform: start.platform }], cost: 0, kinds: [] };
    }

    const allowed = new Set(options.kinds || ['walk', 'jump', 'drop', 'door', 'ladder']);
    const heuristic = (id) => {
      const node = this.nodes[id];
      return Math.hypot(node.x - goal.x, node.y - goal.y) / 60;
    };
    const open = new Set([start.id]);
    const cameFrom = new Map();
    const gScore = new Map([[start.id, 0]]);
    const fScore = new Map([[start.id, heuristic(start.id)]]);
    const iterations = { value: 0 };

    while (open.size) {
      if (iterations.value++ > 4000) return null;
      let current = null;
      let best = Infinity;
      for (const id of open) {
        const score = fScore.get(id) ?? Infinity;
        if (score < best) {
          best = score;
          current = id;
        }
      }
      if (current === null) break;
      if (current === goal.id) {
        const path = [current];
        const kinds = [];
        let cursor = current;
        while (cameFrom.has(cursor)) {
          const previous = cameFrom.get(cursor);
          const edge = this.edges.get(previous)?.find((candidate) => candidate.to === cursor);
          if (edge) kinds.unshift(edge.kind);
          path.unshift(previous);
          cursor = previous;
        }
        return {
          path,
          kinds,
          cost: gScore.get(goal.id) ?? 0,
          waypoints: path.map((id) => {
            const node = this.nodes[id];
            return { x: node.x, y: node.y, platform: node.platform };
          }),
        };
      }
      open.delete(current);
      for (const edge of this.edges.get(current) || []) {
        if (!allowed.has(edge.kind)) continue;
        const next = this.nodes[edge.to];
        if (!next || this.blockedPlatforms.has(next.platform)) continue;
        const tentative = (gScore.get(current) ?? Infinity) + edge.cost;
        if (tentative < (gScore.get(edge.to) ?? Infinity)) {
          cameFrom.set(edge.to, current);
          gScore.set(edge.to, tentative);
          fScore.set(edge.to, tentative + heuristic(edge.to));
          open.add(edge.to);
        }
      }
    }
    return null;
  }

  snapshot() {
    return {
      nodes: this.nodes.length,
      edges: [...this.edges.values()].reduce((sum, list) => sum + list.length, 0),
      platforms: this.platforms.length,
      version: this.version,
      blocked: [...this.blockedPlatforms],
    };
  }
}

export function buildRoomNav(room, options = {}) {
  return new NavGraph(room, options);
}

// ── brain ───────────────────────────────────────────────────────────────────

/**
 * One brain per enemy. `update()` returns a movement intent; it never mutates
 * physics. The engine applies the intent and keeps its own collision rules.
 */
export class EnemyBrain {
  constructor(enemy, options = {}) {
    this.enemy = enemy;
    this.profile = options.profile || profileFor(enemy);
    this.nav = options.nav || null;
    this.rng = seededRandom(options.seed ?? 7);
    this.state = enemy.state === 'patrol' ? AI_STATES.PATROL : AI_STATES.IDLE;
    this.stateTime = 0;
    this.awareness = 0;
    this.lastSeen = Infinity;
    this.lastKnown = null;
    this.homeX = Number.isFinite(enemy.homeX) ? enemy.homeX : enemy.x;
    this.homeY = Number.isFinite(enemy.y) ? enemy.y : 0;
    this.patrolDir = enemy.patrolDir || -1;
    this.path = [];
    this.pathIndex = 0;
    this.pathVersion = -1;
    this.repathTimer = 0;
    this.stuckTimer = 0;
    this.unstickTimer = 0;
    this.unstickDir = 0;
    this.separationDir = 0;
    this.detectedAt = 0;
    this.transitions = [];
    this.repaths = 0;
    this.stuckEvents = 0;
    this.lastMoveX = enemy.x;
    this.lastMoveY = enemy.y;
    this.historyTimer = 0;
    this.assistTimer = 0;
    this.guardPoint = options.guardPoint || { x: enemy.x, y: enemy.y };
    this.reachable = true;
  }

  reset(state = AI_STATES.PATROL) {
    this.state = state;
    this.stateTime = 0;
    this.awareness = 0;
    this.lastSeen = Infinity;
    this.lastKnown = null;
    this.path = [];
    this.pathIndex = 0;
    this.pathVersion = -1;
    this.transitions = [];
  }

  setState(next, reason = '') {
    if (next === this.state) return false;
    const allowed = AI_TRANSITIONS[this.state] || [];
    if (!allowed.includes(next)) return false;
    this.onExit(this.state);
    const previous = this.state;
    this.state = next;
    this.stateTime = 0;
    this.transitions.push({ from: previous, to: next, at: Number(this.enemy.time || 0), reason });
    if (this.transitions.length > 24) this.transitions.shift();
    this.onEnter(next);
    return true;
  }

  onEnter(state) {
    if (state === AI_STATES.CHASE) {
      this.repathTimer = 0;
    } else if (state === AI_STATES.SEARCH) {
      this.path = [];
      this.pathIndex = 0;
    } else if (state === AI_STATES.RETREAT) {
      this.repathTimer = 0;
    }
  }

  onExit(state) {
    if (state === AI_STATES.RETREAT) this.unstickTimer = 0;
  }

  get center() {
    const e = this.enemy;
    return { x: e.x + (e.w || 0) / 2, y: e.y + (e.h || 0) / 2 };
  }

  canSeePlayer(player) {
    const e = this.enemy;
    if (!player) return false;
    const c = this.center;
    const pcx = player.x + (player.w || 0) / 2;
    const pcy = player.y + (player.h || 0) / 2;
    const dist = Math.hypot(pcx - c.x, pcy - c.y);
    const range = this.profile.aggroRange * (e.aggroMul || 1);
    if (dist > range) return false;
    if (Math.abs(pcy - c.y) > this.profile.verticalRange) return false;
    if (this.nav && !this.nav.lineOfSight(c.x, c.y, pcx, pcy)) return false;
    return true;
  }

  /** Perception + memory + state selection. */
  perceive(dt, player) {
    const e = this.enemy;
    const c = this.center;
    const pcx = player ? player.x + (player.w || 0) / 2 : c.x;
    const pcy = player ? player.y + (player.h || 0) / 2 : c.y;
    const dist = Math.hypot(pcx - c.x, pcy - c.y);
    const seen = this.canSeePlayer(player);

    if (seen) {
      this.lastSeen = 0;
      this.lastKnown = { x: pcx, y: pcy, time: Number(e.time || 0) };
      this.awareness = Math.min(1.4, this.awareness + dt / Math.max(0.05, this.profile.reaction));
    } else {
      this.lastSeen += dt;
      this.awareness = Math.max(0, this.awareness - dt * 0.7);
    }

    this.awareness = clamp(this.awareness, 0, 1.4);
    this.stateTime += dt;

    return { dist, seen, estimatedX: this.lastKnown?.x ?? pcx };
  }

  /** Combat-range test that respects walls. */
  inAttackRange(player) {
    if (!player) return false;
    const c = this.center;
    const pcx = player.x + (player.w || 0) / 2;
    const pcy = player.y + (player.h || 0) / 2;
    const reach = this.profile.attackRange + (player.w || 0) / 2;
    if (Math.hypot(pcx - c.x, pcy - c.y) > reach) return false;
    if (this.nav && !this.nav.lineOfSight(c.x, c.y, pcx, pcy)) return false;
    return true;
  }

  /** Too close for a ranged/caster profile: it should back off. */
  tooClose(player) {
    if (!player || !this.profile.minRange) return false;
    const c = this.center;
    const pcx = player.x + (player.w || 0) / 2;
    const pcy = player.y + (player.h || 0) / 2;
    return Math.hypot(pcx - c.x, pcy - c.y) < this.profile.minRange;
  }

  /** Flank target: approach from behind the player, biased by profile. */
  flankTarget(player, dirX) {
    if (!player) return null;
    const px = player.x + (player.w || 0) / 2;
    const behind = player.facing ? -player.facing : sign(dirX);
    return { x: px + behind * (this.profile.preferredRange + 20), y: player.y };
  }

  /** Compute the direction the enemy should travel this frame. */
  desiredMove(player, ctx = {}) {
    const e = this.enemy;
    const c = this.center;
    let goal = null;
    if (this.state === AI_STATES.SEARCH) {
      goal = this.lastKnown ? { x: this.lastKnown.x, y: this.lastKnown.y } : null;
    } else if (this.state === AI_STATES.RETURN) {
      goal = { x: this.homeX, y: this.homeY };
    } else if (this.state === AI_STATES.GUARD) {
      goal = this.guardPoint;
    } else if (this.state === AI_STATES.RETREAT && player) {
      const px = player.x + (player.w || 0) / 2;
      goal = { x: c.x + (c.x - px) * 2, y: c.y };
    } else if (this.state === AI_STATES.ASSIST && ctx.assistTarget) {
      goal = ctx.assistTarget;
    } else if (player) {
      if (this.profile.flank && this.state === AI_STATES.CHASE) goal = this.flankTarget(player, c.x);
      else if (this.profile.minRange && this.tooClose(player)) {
        const px = player.x + (player.w || 0) / 2;
        goal = { x: c.x + (c.x - px) * 2 + sign(c.x - px) * this.profile.preferredRange, y: c.y };
      } else if (this.state === AI_STATES.CHASE && this.profile.minRange) {
        goal = { x: player.x + (player.w || 0) / 2 + sign(c.x - player.x) * this.profile.preferredRange, y: player.y };
      } else {
        goal = { x: player.x + (player.w || 0) / 2, y: player.y };
      }
    }
    if (!goal) return { dir: 0, jump: false, waypoint: null, target: null };
    return this.followGoal(goal, ctx);
  }

  /** Path-aware steering toward a world goal. */
  followGoal(goal, ctx = {}) {
    const e = this.enemy;
    const c = this.center;
    if (!this.nav || this.nav.nodes.length === 0) {
      return { dir: Math.abs(goal.x - c.x) > 6 ? sign(goal.x - c.x) : 0, jump: false, waypoint: null, target: goal };
    }
    // A* is budgeted: repath only when the route is stale, the goal actually
    // moved, or the previous path was invalidated — never every frame.
    const stale = this.pathVersion !== this.nav.version || this.path.length === 0;
    const goalMoved = !this.goal || Math.hypot(goal.x - this.goal.x, goal.y - this.goal.y) > 48;
    if ((stale || goalMoved) && this.repathTimer <= 0) {
      this.goal = { x: goal.x, y: goal.y };
      this.repath(goal);
      this.repathTimer = this.profile.repathInterval;
    }
    // Advance the waypoint cursor once we are horizontally close enough.
    while (this.path.length && this.pathIndex < this.path.length) {
      const node = this.nav.node(this.path[this.pathIndex]);
      if (!node) { this.pathIndex += 1; continue; }
      if (Math.abs(node.x - c.x) < 18) this.pathIndex += 1;
      else break;
    }
    if (this.pathIndex >= this.path.length) {
      if (this.path.length) this.path = [];
      return { dir: Math.abs(goal.x - c.x) > 6 ? sign(goal.x - c.x) : 0, jump: false, waypoint: null, target: goal };
    }
    const node = this.nav.node(this.path[this.pathIndex]);
    const dir = Math.abs(node.x - c.x) > 4 ? sign(node.x - c.x) : 0;
    const jump = node.y < c.y - 18;
    return { dir, jump, waypoint: node, target: goal };
  }

  repath(goal) {
    if (!this.nav) return null;
    const result = this.nav.path({ x: this.center.x, y: this.enemy.y + (this.enemy.h || 0) }, { x: goal.x, y: goal.y });
    this.pathVersion = this.nav.version;
    this.repaths += 1;
    if (!result) {
      this.reachable = false;
      this.path = [];
      this.pathIndex = 0;
      return null;
    }
    this.reachable = true;
    this.path = result.path;
    this.pathIndex = 0;
    return result;
  }

  /** Local avoidance: push apart from other enemies that are too close. */
  separation(enemies) {
    const e = this.enemy;
    const c = this.center;
    let push = 0;
    for (const other of enemies || []) {
      if (other === e || other.dead) continue;
      const ox = other.x + (other.w || 0) / 2;
      const oy = other.y + (other.h || 0) / 2;
      const dx = c.x - ox;
      const dy = c.y - oy;
      const dist = Math.hypot(dx, dy);
      if (dist > this.profile.separation || dist < 0.001) continue;
      push += dx / dist * (1 - dist / this.profile.separation);
    }
    this.separationDir = clamp(push, -1, 1);
    return this.separationDir;
  }

  /** Detect lack of progress and produce a deterministic recovery nudge. */
  updateStuck(dt, moving, dir) {
    const e = this.enemy;
    this.historyTimer += dt;
    if (this.historyTimer >= 0.25) {
      const moved = Math.hypot(e.x - this.lastMoveX, (e.y || 0) - this.lastMoveY);
      this.historyTimer = 0;
      this.lastMoveX = e.x;
      this.lastMoveY = e.y;
      if (moving && dir !== 0 && moved < 2.2) this.stuckTimer += 0.25;
      else this.stuckTimer = Math.max(0, this.stuckTimer - 0.25);
    }
    if (this.unstickTimer > 0) this.unstickTimer = Math.max(0, this.unstickTimer - dt);
    if (this.stuckTimer >= this.profile.stuckLimit && this.unstickTimer <= 0) {
      this.stuckTimer = 0;
      this.unstickTimer = this.profile.unstickCooldown;
      this.stuckEvents += 1;
      // Try the opposite side first: corners resolve by stepping away.
      this.unstickDir = dir !== 0 ? -dir : (this.rng() < 0.5 ? -1 : 1);
      this.pathVersion = -1;
      this.repath(this.lastKnown || { x: this.homeX, y: this.homeY });
      return true;
    }
    return false;
  }

  /** Full decision + movement intent for one frame. */
  update(dt, ctx = {}) {
    const player = ctx.player || null;
    const enemies = ctx.enemies || [];
    const perception = this.perceive(dt, player);
    this.repathTimer = Math.max(0, this.repathTimer - dt);
    this.separation(enemies);
    this.chooseState(perception, player, ctx);

    const moving = [AI_STATES.CHASE, AI_STATES.SEARCH, AI_STATES.RETURN, AI_STATES.RETREAT, AI_STATES.ASSIST, AI_STATES.GUARD, AI_STATES.PATROL].includes(this.state);
    const move = moving && this.state !== AI_STATES.STUNNED
      ? this.desiredMove(player, ctx)
      : { dir: 0, jump: false, waypoint: null, target: null };
    let dir = move.dir;
    if (dir === 0 && this.separationDir !== 0 && moving) dir = sign(this.separationDir);
    const stuck = this.updateStuck(dt, moving, dir);
    if (this.unstickTimer > 0 && this.unstickDir !== 0) dir = this.unstickDir;

    const canAttack = this.state === AI_STATES.CHASE
      && this.profile.attackRange
      && this.inAttackRange(player)
      && !(this.profile.minRange && this.tooClose(player) && this.profile.kind !== 'melee');

    return {
      state: this.state,
      aggro: this.isAggro(),
      dir,
      jump: move.jump,
      speed: this.speedScale(),
      waypoint: move.waypoint,
      target: move.target,
      stuck,
      canAttack,
      reachable: this.reachable,
      perception,
    };
  }

  isAggro() {
    if (this.state === AI_STATES.CHASE || this.state === AI_STATES.ATTACK) return true;
    return this.awareness >= 0.5 && this.lastSeen <= this.profile.memory;
  }

  speedScale() {
    let scale = this.profile.speedMul;
    if (this.state === AI_STATES.PATROL) scale *= 0.55;
    if (this.state === AI_STATES.SEARCH) scale *= 0.8;
    if (this.state === AI_STATES.RETURN) scale *= 0.9;
    if (this.state === AI_STATES.RETREAT) scale *= 1.1;
    return scale;
  }

  chooseState(perception, player, ctx) {
    const e = this.enemy;
    const hpFraction = e.maxHp ? e.hp / e.maxHp : 1;
    const engaged = perception.seen || this.lastSeen <= this.profile.memory;
    const t = this.stateTime;

    switch (this.state) {
      case AI_STATES.IDLE:
        if (perception.seen) this.setState(AI_STATES.DETECT, 'notice');
        else if (t > 1.4) this.setState(AI_STATES.PATROL, 'idle timeout');
        break;
      case AI_STATES.PATROL:
        if (perception.seen) this.setState(AI_STATES.DETECT, 'notice');
        else if (t > 10) this.setState(AI_STATES.IDLE, 'patrol rest');
        break;
      case AI_STATES.DETECT:
        if (!engaged) this.setState(AI_STATES.PATROL, 'lost during detect');
        else if (this.awareness >= 0.6 || t >= this.profile.reaction * 2.5) this.setState(AI_STATES.CHASE, 'acquired');
        break;
      case AI_STATES.CHASE:
        if (this.profile.retreatHealth && hpFraction <= this.profile.retreatHealth && perception.seen) {
          this.setState(AI_STATES.RETREAT, 'low health');
        } else if (!engaged) {
          this.setState(AI_STATES.SEARCH, 'lost target');
        } else if (this.profile.minRange && perception.seen && this.tooClose(player) && this.profile.kind !== 'melee') {
          // Stay in the preferred band by re-entering chase with a back-off goal.
          this.pathVersion = -1;
          this.setState(AI_STATES.RECOVER, 'reposition');
        } else if (t > 20 && !perception.seen) {
          this.setState(AI_STATES.RETURN, 'give up');
        }
        break;
      case AI_STATES.RECOVER:
        if (t > 0.35) this.setState(engaged ? AI_STATES.CHASE : AI_STATES.SEARCH, 'recovered');
        break;
      case AI_STATES.ATTACK:
        if (t > 0.7) this.setState(AI_STATES.CHASE, 'attack done');
        break;
      case AI_STATES.SEARCH:
        if (perception.seen) this.setState(AI_STATES.CHASE, 'reacquired');
        else if (t > this.profile.searchTime) this.setState(AI_STATES.RETURN, 'search timeout');
        break;
      case AI_STATES.RETURN:
        if (perception.seen) this.setState(AI_STATES.CHASE, 'reacquired on return');
        else if (Math.abs(this.center.x - this.homeX) < 26 && t > 0.4) this.setState(AI_STATES.PATROL, 'home');
        else if (t > this.profile.returnTime) this.setState(AI_STATES.PATROL, 'return timeout');
        break;
      case AI_STATES.RETREAT:
        if (t > this.profile.retreatTime) this.setState(AI_STATES.CHASE, 'retreat done');
        break;
      case AI_STATES.GUARD:
        if (perception.seen && this.awareness >= 1) this.setState(AI_STATES.CHASE, 'guard engage');
        break;
      case AI_STATES.ASSIST:
        if (perception.seen) this.setState(AI_STATES.CHASE, 'assist engage');
        else if (t > 3) this.setState(AI_STATES.RETURN, 'assist done');
        break;
      case AI_STATES.STUNNED:
        if (t > (this.stunTime || 0.5)) this.setState(AI_STATES.CHASE, 'stun end');
        break;
      default:
        this.state = AI_STATES.PATROL;
    }
  }

  /** Called by the engine when the enemy is staggered. */
  stun(duration = 0.6) {
    this.stunTime = duration;
    this.setState(AI_STATES.STUNNED, 'stagger');
  }

  /** Called when an ally is hurt nearby. */
  assist(allyX, allyY) {
    this.assistTimer = 3;
    if ([AI_STATES.PATROL, AI_STATES.IDLE, AI_STATES.GUARD].includes(this.state)) {
      this.assistTarget = { x: allyX, y: allyY };
      this.setState(AI_STATES.ASSIST, 'ally in trouble');
    }
  }

  debugSnapshot() {
    const e = this.enemy;
    return {
      id: e.id,
      type: e.type,
      state: this.state,
      profile: this.profile.kind,
      aggro: this.isAggro(),
      awareness: Number(this.awareness.toFixed(2)),
      target: this.lastKnown ? { x: Math.round(this.lastKnown.x), y: Math.round(this.lastKnown.y) } : null,
      destination: this.path.length
        ? { x: Math.round(this.nav?.node(this.path[Math.min(this.pathIndex, this.path.length - 1)])?.x ?? e.x), y: 0 }
        : null,
      pathLength: this.path.length,
      pathIndex: this.pathIndex,
      reachable: this.reachable,
      detectionRange: this.profile.aggroRange,
      attackRange: this.profile.attackRange,
      speed: Math.round((e.speed || 0) * this.speedScale()),
      grounded: !!e.onGround,
      stuck: this.stuckTimer > 0.15,
      stuckEvents: this.stuckEvents,
      repaths: this.repaths,
      transitions: this.transitions.slice(-4),
    };
  }
}

/**
 * Build the complete AI population for a room and step it headlessly. Used by
 * tests and the AI debug panel to prove navigation without a browser.
 */
export function simulateNavigation(room, options = {}) {
  const nav = buildRoomNav(room, options);
  const player = options.player || { x: 120, y: (room?.platforms?.[0]?.y ?? 400) - 46, w: 30, h: 46 };
  const goal = options.goal || { x: player.x, y: player.y };
  const start = options.start || { x: 700, y: 400 };
  const path = nav.path(start, goal);
  return {
    nav,
    path,
    reachable: !!path,
    nodes: nav.nodes.length,
    stats: nav.snapshot(),
  };
}

export { seededRandom, clamp as aiClamp };
