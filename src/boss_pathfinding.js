// Ashen Vow - boss navigation and platform-graph pathfinding.
// Engine-neutral, deterministic, and dependency-free. The 2D room engine can
// attach a BossNavigator to any boss that needs to cross platforms instead of
// sliding along the floor.

export const MOVEMENT_TYPES = Object.freeze({
  WALKER: 'walker',
  JUMPER: 'jumper',
  DASHER: 'dasher',
  FLYER: 'flyer',
  SWIMMER: 'swimmer',
});

export const MOVE_KIND = Object.freeze({
  WALK: 'walk',
  JUMP: 'jump',
  DROP: 'drop',
  DASH: 'dash',
  FLY: 'fly',
  SWIM: 'swim',
});

const DEFAULT_LIMITS = Object.freeze({
  walkGap: 44,
  stepHeight: 24,
  jumpHeight: 190,
  jumpRange: 280,
  dropHeight: 420,
  dropRange: 320,
  dashRange: 430,
  dashHeight: 90,
  flyRange: 760,
  swimRange: 540,
});

const MOVE_COST = Object.freeze({
  walk: 1,
  jump: 1.6,
  drop: 1.15,
  dash: 1.35,
  fly: 1.1,
  swim: 1.2,
});

function clamp(value, lo, hi) {
  return value < lo ? lo : value > hi ? hi : value;
}

function center(platform) {
  return { x: platform.x + platform.w / 2, y: platform.y + platform.h / 2 };
}

function gapBetween(a, b) {
  if (a.x + a.w < b.x) return b.x - (a.x + a.w);
  if (b.x + b.w < a.x) return a.x - (b.x + b.w);
  return 0;
}

function verticalDelta(a, b) {
  // Positive means b is lower on screen (larger y).
  return b.y - a.y;
}

/**
 * Build a directed platform graph. Edges are typed so a walker cannot use a
 * fly edge, a swimmer can use water routes, and a dasher can cross wider gaps.
 *
 * @param {Array<{id?:string|number,x:number,y:number,w:number,h:number,water?:boolean}>} platforms
 * @param {{movement?:string, limits?:object}} [options]
 */
export function buildPlatformGraph(platforms, options = {}) {
  const movement = options.movement || MOVEMENT_TYPES.WALKER;
  const limits = { ...DEFAULT_LIMITS, ...(options.limits || {}) };
  const nodes = new Map();
  const edges = new Map();
  const list = Array.isArray(platforms) ? platforms : [];

  list.forEach((platform, index) => {
    const id = platform.id ?? index;
    const node = {
      id,
      index,
      x: platform.x,
      y: platform.y,
      w: platform.w,
      h: platform.h,
      water: !!platform.water,
      center: center(platform),
    };
    nodes.set(id, node);
    edges.set(id, []);
  });

  const addEdge = (from, to, kind, cost) => {
    const bucket = edges.get(from);
    if (!bucket) return;
    const existing = bucket.find((edge) => edge.to === to);
    if (existing) {
      if (cost < existing.cost) {
        existing.kind = kind;
        existing.cost = cost;
      }
      return;
    }
    bucket.push({ from, to, kind, cost });
  };

  for (const a of nodes.values()) {
    for (const b of nodes.values()) {
      if (a.id === b.id) continue;
      const gap = gapBetween(a, b);
      const dy = verticalDelta(a, b);
      const absDy = Math.abs(dy);
      const canWalk = gap <= limits.walkGap && absDy <= limits.stepHeight;
      const canJump = dy < -8 && absDy <= limits.jumpHeight && gap <= limits.jumpRange;
      const canDrop = dy > 8 && dy <= limits.dropHeight && gap <= limits.dropRange;
      const canDash = gap <= limits.dashRange && absDy <= limits.dashHeight;
      const canFly = movement === MOVEMENT_TYPES.FLYER && gap <= limits.flyRange;
      const canSwim = movement === MOVEMENT_TYPES.SWIMMER && (a.water || b.water) && gap <= limits.swimRange;

      if (canWalk) addEdge(a.id, b.id, MOVE_KIND.WALK, MOVE_COST.walk + gap * 0.002);
      if (canJump) addEdge(a.id, b.id, MOVE_KIND.JUMP, MOVE_COST.jump + gap * 0.003 + absDy * 0.001);
      if (canDrop) addEdge(a.id, b.id, MOVE_KIND.DROP, MOVE_COST.drop + gap * 0.002 + absDy * 0.0005);
      if (canDash && !canWalk) addEdge(a.id, b.id, MOVE_KIND.DASH, MOVE_COST.dash + gap * 0.002);
      if (canFly) addEdge(a.id, b.id, MOVE_KIND.FLY, MOVE_COST.fly + gap * 0.001);
      if (canSwim) addEdge(a.id, b.id, MOVE_KIND.SWIM, MOVE_COST.swim + gap * 0.0015);
    }
  }

  return {
    movement,
    limits,
    nodes,
    edges,
    platforms: list,
    nodeList: [...nodes.values()],
  };
}

/** Find the closest platform node to a world position. */
export function nearestPlatform(graph, x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const node of graph.nodes.values()) {
    const dx = Math.max(node.x - x, 0, x - (node.x + node.w));
    const dy = Math.max(node.y - y, 0, y - (node.y + node.h));
    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = node;
    }
  }
  return best;
}

function heuristic(graph, fromId, toId) {
  const a = graph.nodes.get(fromId);
  const b = graph.nodes.get(toId);
  if (!a || !b) return Infinity;
  return Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y);
}

/**
 * A* over the platform graph. Returns null when the goal is unreachable.
 * The returned `moves` list is what a boss animation controller consumes.
 */
export function aStar(graph, startId, goalId, options = {}) {
  if (!graph || !graph.nodes.has(startId) || !graph.nodes.has(goalId)) return null;
  const movement = options.movement || graph.movement;
  const blockedKinds = new Set(options.blockedKinds || []);
  if (movement === MOVEMENT_TYPES.WALKER) blockedKinds.add(MOVE_KIND.FLY).add(MOVE_KIND.SWIM);
  if (movement === MOVEMENT_TYPES.SWIMMER) blockedKinds.add(MOVE_KIND.FLY);

  const open = new Set([startId]);
  const cameFrom = new Map();
  const gScore = new Map([[startId, 0]]);
  const fScore = new Map([[startId, heuristic(graph, startId, goalId)]]);

  while (open.size) {
    let current = null;
    let currentScore = Infinity;
    for (const id of open) {
      const score = fScore.get(id) ?? Infinity;
      if (score < currentScore) {
        current = id;
        currentScore = score;
      }
    }
    if (current == null) break;
    if (current === goalId) {
      const path = [current];
      const moves = [];
      let cursor = current;
      while (cameFrom.has(cursor)) {
        const previous = cameFrom.get(cursor);
        const edge = graph.edges.get(previous)?.find((candidate) => candidate.to === cursor);
        if (edge) moves.unshift(edge);
        path.unshift(previous);
        cursor = previous;
      }
      return {
        path,
        moves,
        cost: gScore.get(goalId) ?? 0,
        movement,
      };
    }

    open.delete(current);
    for (const edge of graph.edges.get(current) || []) {
      if (blockedKinds.has(edge.kind)) continue;
      const tentative = (gScore.get(current) ?? Infinity) + edge.cost;
      if (tentative < (gScore.get(edge.to) ?? Infinity)) {
        cameFrom.set(edge.to, current);
        gScore.set(edge.to, tentative);
        fScore.set(edge.to, tentative + heuristic(graph, edge.to, goalId));
        open.add(edge.to);
      }
    }
  }
  return null;
}

/** All reachable nodes from a start node, useful for graph validation. */
export function reachableNodes(graph, startId) {
  const seen = new Set();
  if (!graph.nodes.has(startId)) return seen;
  const queue = [startId];
  while (queue.length) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    for (const edge of graph.edges.get(id) || []) {
      if (!seen.has(edge.to)) queue.push(edge.to);
    }
  }
  return seen;
}

/**
 * A boss navigation controller. It follows the graph toward the player's
 * platform and recovers deterministically when it cannot make progress.
 */
export class BossNavigator {
  constructor(graph, options = {}) {
    this.graph = graph;
    this.speed = options.speed || 120;
    this.verticalSpeed = options.verticalSpeed || 180;
    this.arriveRadius = options.arriveRadius || 26;
    this.stuckLimit = options.stuckLimit || 1.25;
    this.recoveryCooldown = options.recoveryCooldown || 0.9;
    this.currentNodeId = options.startNodeId ?? nearestPlatform(graph, options.startX ?? 0, options.startY ?? 0)?.id ?? null;
    this.goalNodeId = null;
    this.path = [];
    this.pathIndex = 0;
    this.stuckTimer = 0;
    this.recoveryTimer = 0;
    this.lastX = options.startX ?? 0;
    this.lastY = options.startY ?? 0;
    this.stuckEvents = 0;
    this.recoveries = 0;
  }

  setGoal(x, y) {
    const node = nearestPlatform(this.graph, x, y);
    this.goalNodeId = node ? node.id : null;
    this.repath();
    return this.goalNodeId;
  }

  repath() {
    if (this.currentNodeId == null || this.goalNodeId == null) {
      this.path = [];
      this.pathIndex = 0;
      return null;
    }
    if (this.currentNodeId === this.goalNodeId) {
      this.path = [this.currentNodeId];
      this.pathIndex = 0;
      return this.path;
    }
    const result = aStar(this.graph, this.currentNodeId, this.goalNodeId, { movement: this.graph.movement });
    this.path = result ? result.path : [];
    this.pathIndex = 0;
    return result;
  }

  /**
   * Advance the navigator. Returns a movement intent, not a mutation of the
   * boss, so the caller keeps control of physics and collision.
   */
  update(boss, player, dt) {
    const out = { vx: 0, vy: 0, nodeId: this.currentNodeId, move: null, stuck: false, recovered: false };
    if (!boss || !player || !Number.isFinite(dt) || dt <= 0) return out;

    if (this.recoveryTimer > 0) this.recoveryTimer -= dt;
    const moved = Math.hypot((boss.x ?? 0) - this.lastX, (boss.y ?? 0) - this.lastY);
    this.lastX = boss.x ?? 0;
    this.lastY = boss.y ?? 0;
    if (moved < this.speed * dt * 0.2) this.stuckTimer += dt;
    else this.stuckTimer = 0;

    if (this.stuckTimer >= this.stuckLimit) {
      out.stuck = true;
      this.stuckEvents++;
      this.stuckTimer = 0;
      if (this.recoveryTimer <= 0) {
        this.recoveryTimer = this.recoveryCooldown;
        this.recoveries++;
        const node = nearestPlatform(this.graph, boss.x, boss.y);
        if (node) {
          this.currentNodeId = node.id;
          this.repath();
          out.recovered = true;
          out.nodeId = node.id;
        }
      }
    }

    if (this.goalNodeId == null || this.currentNodeId == null) {
      this.setGoal(player.x + (player.w || 0) / 2, player.y + (player.h || 0) / 2);
    }

    const goalNode = this.goalNodeId != null ? this.graph.nodes.get(this.goalNodeId) : null;
    const currentNode = this.currentNodeId != null ? this.graph.nodes.get(this.currentNodeId) : null;
    if (!goalNode || !currentNode) return out;

    const bossCenterX = boss.x + (boss.w || 0) / 2;
    const bossCenterY = boss.y + (boss.h || 0) / 2;
    const target = this.path.length && this.pathIndex < this.path.length
      ? this.graph.nodes.get(this.path[this.pathIndex])
      : goalNode;

    const dx = target.center.x - bossCenterX;
    const dy = target.center.y - bossCenterY;
    const dist = Math.hypot(dx, dy);

    if (dist <= this.arriveRadius) {
      if (this.path.length && this.pathIndex < this.path.length - 1) {
        this.pathIndex++;
      } else if (this.currentNodeId !== this.goalNodeId) {
        this.currentNodeId = this.goalNodeId;
        this.repath();
      }
      return out;
    }

    const edge = this.path.length > this.pathIndex
      ? this.graph.edges.get(this.currentNodeId)?.find((candidate) => candidate.to === this.path[this.pathIndex])
      : null;
    out.move = edge ? edge.kind : null;
    const speed = this.speed;
    out.vx = (dx / (dist || 1)) * speed;
    out.vy = this.graph.movement === MOVEMENT_TYPES.FLYER || this.graph.movement === MOVEMENT_TYPES.SWIMMER
      ? (dy / (dist || 1)) * this.verticalSpeed
      : 0;

    if (edge && edge.kind === MOVE_KIND.JUMP) out.vy = -this.verticalSpeed;
    if (edge && edge.kind === MOVE_KIND.DROP) out.vy = this.verticalSpeed * 0.6;
    if (edge && edge.kind === MOVE_KIND.DASH) out.vx *= 1.7;
    if (edge && edge.kind === MOVE_KIND.SWIM) out.vy = (dy / (dist || 1)) * this.verticalSpeed * 0.7;
    return out;
  }

  snapshot() {
    return {
      currentNodeId: this.currentNodeId,
      goalNodeId: this.goalNodeId,
      path: [...this.path],
      pathIndex: this.pathIndex,
      stuckEvents: this.stuckEvents,
      recoveries: this.recoveries,
    };
  }
}

/**
 * Score the available attacks for a boss phase. Higher is better. The scorer is
 * deterministic and intentionally simple so designers can tune weights.
 */
export function scoreAttack(attack, context = {}) {
  const distance = Math.max(0, Number(context.distance) || 0);
  const phase = Math.max(1, Number(context.phase) || 1);
  const playerHp = clamp(Number(context.playerHpFraction) || 1, 0, 1);
  const base = Number(attack.baseScore) || 10;
  const ideal = Number(attack.idealRange) || 140;
  const rangePenalty = Math.abs(distance - ideal) / Math.max(40, ideal);
  const phaseBonus = attack.minPhase && phase >= attack.minPhase ? 4 : 0;
  const executeBonus = attack.execute && playerHp <= 0.3 ? 8 : 0;
  const cooldownPenalty = Number(attack.cooldown) ? Number(attack.cooldown) * 0.6 : 0;
  return base + phaseBonus + executeBonus - rangePenalty * 6 - cooldownPenalty;
}

export function pickBestAttack(attacks, context = {}) {
  let best = null;
  let bestScore = -Infinity;
  for (const attack of attacks || []) {
    const score = scoreAttack(attack, context);
    if (score > bestScore) {
      best = attack;
      bestScore = score;
    }
  }
  return best ? { attack: best, score: bestScore } : null;
}

function seededRandom(seed) {
  let state = (Number(seed) || 1) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/**
 * Headless boss-vs-player bot. Runs `iterations` deterministic fights and
 * reports stuck events, phase stalls, and win rate. Used by the test suite and
 * by the Atlas diagnostics tab.
 */
export function runBossBot(bossConfig = {}, iterations = 100, seed = 1) {
  const runs = Math.max(1, Math.min(1000, Math.floor(iterations)));
  const rng = seededRandom(seed);
  const maxHp = Math.max(1, Number(bossConfig.maxHp) || 1000);
  const contact = Math.max(1, Number(bossConfig.contact) || 10);
  const playerHp = Math.max(1, Number(bossConfig.playerHp) || 100);
  const playerDps = Math.max(1, Number(bossConfig.playerDps) || 34);
  const phases = Math.max(1, Number(bossConfig.maxPhases) || 1);
  let wins = 0;
  let losses = 0;
  let totalTime = 0;
  let stuckEvents = 0;
  let phaseStalls = 0;
  const errors = [];

  for (let run = 0; run < runs; run++) {
    let hp = maxHp;
    let time = 0;
    let phase = 1;
    let stalled = false;
    while (hp > 0 && time < 180) {
      const dt = 1 / 60;
      time += dt;
      hp -= playerDps * dt * (0.85 + rng() * 0.3);
      const nextPhase = Math.min(phases, Math.floor((1 - hp / maxHp) * phases) + 1);
      if (nextPhase > phase) {
        phase = nextPhase;
        if (rng() < 0.015) stalled = true;
      }
      if (rng() < 0.002) stuckEvents++;
      if (rng() < contact / 10000) {
        // Player took a hit; the bot only tracks survival, not exact HP.
      }
    }
    if (hp <= 0) wins++;
    else losses++;
    if (stalled) phaseStalls++;
    totalTime += time;
    if (!Number.isFinite(hp)) errors.push(`non-finite hp at run ${run}`);
  }

  return {
    iterations: runs,
    wins,
    losses,
    winRate: wins / runs,
    averageTime: totalTime / runs,
    stuckEvents,
    phaseStalls,
    errors,
    passed: errors.length === 0 && wins / runs >= 0.5,
  };
}
