// Ashen Vow — Update XXV: The Vigil Tree (Scary Mode skill tree).
//
// Pure model: no DOM, no storage access. Points come from the horror journal
// (events found, achievements, clears) and every node maps to a real field the
// deterministic simulation already reads — max HP, flasks, crit chance, move
// speed, hunter stock, spirit ward and the automatic horror-event interval.
//
// The tree never changes horror difficulty, never weakens campaign enemies and
// is separate from the campaign Skill Point tree in src/skills.js.

export const HORROR_TREE_SCHEMA = 1;

/** A new hunter can already spend three points, so the tree is never a dead tab. */
export const HORROR_TREE_BASE_POINTS = 3;

export const HORROR_TREE_BRANCHES = Object.freeze([
  { id: 'resolve', label: 'KETEGUHAN', icon: '⛨', desc: 'Tubuh dan stok yang menahan gigitan malam.' },
  { id: 'hunt', label: 'PERBURUAN', icon: '⌖', desc: 'Peralatan dan naluri untuk membalas roh.' },
  { id: 'vigil', label: 'KEWASPADAAN', icon: '◉', desc: 'Langkah dan saraf yang tidak mudah dikagetkan.' },
]);

/**
 * Every effect is additive and applied once when a Scary run starts.
 * `perRank` values are multiplied by the node rank.
 */
export const HORROR_TREE_NODES = Object.freeze([
  // ── resolve ──────────────────────────────────────────────────────────────
  {
    id: 'vow_iron',
    branch: 'resolve',
    tier: 1,
    label: 'Sumpah Baja',
    icon: '⛨',
    cost: 1,
    maxRank: 3,
    perRank: { hpPct: 0.1 },
    describe: (r) => `+${r * 10}% HP maksimum saat run dimulai`,
  },
  {
    id: 'dusk_flask',
    branch: 'resolve',
    tier: 2,
    label: 'Tampuk Senja',
    icon: '⚱',
    cost: 2,
    maxRank: 2,
    requires: 'vow_iron',
    perRank: { flasks: 1 },
    describe: (r) => `+${r} flask maksimum`,
  },
  {
    id: 'ward_of_ash',
    branch: 'resolve',
    tier: 2,
    label: 'Ward Abu',
    icon: '◈',
    cost: 2,
    maxRank: 2,
    requires: 'vow_iron',
    perRank: { wardSeconds: 6, wardReduction: 0.15 },
    describe: (r) => `Ward roh ${r * 6} dtk (−${Math.round((0.55 + (r - 1) * 0.15) * 100)}% damage roh) saat run dimulai`,
  },
  // ── hunt ─────────────────────────────────────────────────────────────────
  {
    id: 'hunters_eye',
    branch: 'hunt',
    tier: 1,
    label: 'Mata Pemburu',
    icon: '⌖',
    cost: 1,
    maxRank: 3,
    perRank: { crit: 0.04 },
    describe: (r) => `+${r * 4}% peluang kritikal`,
  },
  {
    id: 'salt_pouch',
    branch: 'hunt',
    tier: 2,
    label: 'Kantung Garam',
    icon: '✷',
    cost: 2,
    maxRank: 2,
    requires: 'hunters_eye',
    perRank: { items: { salt_flare: 1 } },
    describe: (r) => `Mulai dengan ${r}× Suluh Garam`,
  },
  {
    id: 'silver_round',
    branch: 'hunt',
    tier: 2,
    label: 'Peluru Perak',
    icon: '➶',
    cost: 2,
    maxRank: 2,
    requires: 'hunters_eye',
    perRank: { items: { spirit_bane: 1 } },
    describe: (r) => `Mulai dengan ${r}× Peluru Roh`,
  },
  // ── vigil ────────────────────────────────────────────────────────────────
  {
    id: 'swift_vigil',
    branch: 'vigil',
    tier: 1,
    label: 'Langkah Waspada',
    icon: '◉',
    cost: 1,
    maxRank: 3,
    perRank: { speed: 0.06 },
    describe: (r) => `+${r * 6}% kecepatan gerak`,
  },
  {
    id: 'ash_stipend',
    branch: 'vigil',
    tier: 2,
    label: 'Persembahan Abu',
    icon: '✧',
    cost: 2,
    maxRank: 2,
    requires: 'swift_vigil',
    perRank: { ash: 80 },
    describe: (r) => `+${r * 80} abu saat run dimulai`,
  },
  {
    id: 'quiet_nerve',
    branch: 'vigil',
    tier: 2,
    label: 'Saraf Tenang',
    icon: '☾',
    cost: 2,
    maxRank: 2,
    requires: 'swift_vigil',
    perRank: { eventDelay: 0.18 },
    describe: (r) => `Jeda peristiwa horor otomatis +${r * 18}%`,
  },
]);

export const HORROR_TREE_NODE_BY_ID = Object.freeze(
  Object.fromEntries(HORROR_TREE_NODES.map((node) => [node.id, node])),
);
export const HORROR_TREE_NODE_IDS = HORROR_TREE_NODES.map((node) => node.id);
export const HORROR_TREE_MAX_RANKS = HORROR_TREE_NODES.reduce((sum, node) => sum + node.maxRank, 0);

const clampRank = (value, max) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(0, Math.floor(n)));
};

/** Points earned from real journal progress. Never invent a point. */
export function horrorTreePointsEarned(journal = {}) {
  const source = journal && typeof journal === 'object' ? journal : {};
  const events = source.events && typeof source.events === 'object'
    ? Object.keys(source.events).filter((id) => Number(source.events[id]) > 0).length
    : 0;
  const achievements = Array.isArray(source.achievements)
    ? source.achievements.filter((entry) => entry && entry.unlocked).length
    : Array.isArray(source.unlocked)
      ? source.unlocked.length
      : 0;
  const clears = source.clears && typeof source.clears === 'object' ? source.clears : {};
  const easy = clampRank(clears.easy, 6);
  const normal = clampRank(clears.normal, 6);
  const hard = clampRank(clears.hard, 6);
  return HORROR_TREE_BASE_POINTS + events + achievements * 2 + easy + normal + hard * 2;
}

/** Spent points only count ranks that still exist (old saves, edited saves). */
export function horrorTreeSpent(ranks = {}) {
  let spent = 0;
  for (const [id, value] of Object.entries(ranks || {})) {
    const node = HORROR_TREE_NODE_BY_ID[id];
    if (!node) continue;
    spent += clampRank(value, node.maxRank) * node.cost;
  }
  return spent;
}

/** Drop unknown ids, clamp ranks and refuse a rank whose prerequisite is missing. */
export function sanitizeHorrorSkills(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const ranks = {};
  for (const node of HORROR_TREE_NODES) {
    const value = clampRank(source[node.id], node.maxRank);
    if (value > 0) ranks[node.id] = value;
  }
  // Prerequisites are resolved in tier order, so a sanitizer never keeps a
  // rank that an edited save could not legally buy.
  for (const node of HORROR_TREE_NODES) {
    if (!node.requires) continue;
    if (!ranks[node.requires] && ranks[node.id]) delete ranks[node.id];
  }
  return ranks;
}

export function horrorCanRank(ranks = {}, id, available = 0) {
  const node = HORROR_TREE_NODE_BY_ID[id];
  if (!node) return { ok: false, reason: 'unknown' };
  const clean = sanitizeHorrorSkills(ranks);
  const rank = clean[id] || 0;
  if (rank >= node.maxRank) return { ok: false, reason: 'maxed' };
  if (node.requires && !clean[node.requires]) return { ok: false, reason: 'locked' };
  if (available < node.cost) return { ok: false, reason: 'points' };
  return { ok: true, reason: null, cost: node.cost };
}

export function horrorRankUp(ranks = {}, id, available = 0) {
  const check = horrorCanRank(ranks, id, available);
  if (!check.ok) return { ok: false, reason: check.reason, ranks: sanitizeHorrorSkills(ranks) };
  const next = sanitizeHorrorSkills(ranks);
  next[id] = (next[id] || 0) + 1;
  return { ok: true, ranks: next, cost: check.cost };
}

/** Full, free respec — nothing is ever lost permanently. */
export function horrorResetSkills() {
  return {};
}

/** Sum every owned node into the object the run start applies. */
export function horrorTreeBonuses(ranks = {}) {
  const clean = sanitizeHorrorSkills(ranks);
  const bonuses = {
    hpPct: 0,
    flasks: 0,
    crit: 0,
    speed: 0,
    ash: 0,
    wardSeconds: 0,
    wardReduction: 0,
    eventDelay: 0,
    items: {},
    ranks: { ...clean },
  };
  for (const node of HORROR_TREE_NODES) {
    const rank = clean[node.id] || 0;
    if (rank <= 0) continue;
    for (const [key, value] of Object.entries(node.perRank)) {
      if (key === 'items') {
        for (const [itemId, count] of Object.entries(value)) {
          bonuses.items[itemId] = (bonuses.items[itemId] || 0) + count * rank;
        }
        continue;
      }
      bonuses[key] = (bonuses[key] || 0) + value * rank;
    }
  }
  // Ward reduction stays inside the hunter layer's own 0–0.9 ceiling.
  bonuses.wardReduction = Math.min(0.9, Math.max(0, 0.55 + bonuses.wardReduction));
  if (!bonuses.wardSeconds) bonuses.wardReduction = 0;
  return bonuses;
}

/**
 * Apply the tree to a live run. Only fields the simulation already reads are
 * touched, so a tree point can never invent a new combat rule.
 */
export function applyHorrorTree(game, bonuses) {
  if (!game || !game.player || !bonuses) return null;
  const p = game.player;
  const applied = {};
  if (bonuses.hpPct > 0) {
    const before = p.maxHp;
    p.maxHp = Math.round(p.maxHp * (1 + bonuses.hpPct));
    p.hp = Math.min(p.maxHp, p.hp + (p.maxHp - before));
    applied.hp = p.maxHp;
  }
  if (bonuses.flasks > 0) {
    p.maxFlasks = Math.max(1, p.maxFlasks + bonuses.flasks);
    p.flasks = p.maxFlasks;
    applied.flasks = p.maxFlasks;
  }
  if (bonuses.crit > 0) {
    p.critChance = Math.min(0.75, (p.critChance || 0) + bonuses.crit);
    applied.crit = p.critChance;
  }
  if (bonuses.speed > 0) {
    p.speedMult = Math.max(0.5, (p.speedMult || 1) * (1 + bonuses.speed));
    applied.speed = p.speedMult;
  }
  if (bonuses.ash > 0) {
    game.ash += Math.round(bonuses.ash);
    game.emit({ type: 'ashGain', amount: Math.round(bonuses.ash), total: game.ash });
    applied.ash = game.ash;
  }
  if (bonuses.wardSeconds > 0) {
    p.spiritWardTimer = Math.max(p.spiritWardTimer || 0, bonuses.wardSeconds);
    p.spiritWardReduction = bonuses.wardReduction;
    applied.ward = bonuses.wardSeconds;
  }
  const items = {};
  for (const [id, count] of Object.entries(bonuses.items || {})) {
    if (typeof game.addHunterItem === 'function') game.addHunterItem(id, count, true);
    items[id] = count;
  }
  if (Object.keys(items).length) applied.items = items;
  game.horrorTreeApplied = applied;
  return applied;
}

export function horrorTreeSummary(ranks = {}, journal = {}) {
  const clean = sanitizeHorrorSkills(ranks);
  const earned = horrorTreePointsEarned(journal);
  const spent = horrorTreeSpent(clean);
  const ranksOwned = Object.values(clean).reduce((sum, rank) => sum + rank, 0);
  return {
    schema: HORROR_TREE_SCHEMA,
    earned,
    spent,
    available: Math.max(0, earned - spent),
    ranksOwned,
    maxRanks: HORROR_TREE_MAX_RANKS,
    complete: ranksOwned >= HORROR_TREE_MAX_RANKS,
    ranks: clean,
    bonuses: horrorTreeBonuses(clean),
  };
}

export function horrorTreeSnapshot(ranks = {}, journal = {}) {
  const summary = horrorTreeSummary(ranks, journal);
  return {
    ...summary,
    branches: HORROR_TREE_BRANCHES.map((branch) => ({
      ...branch,
      nodes: HORROR_TREE_NODES.filter((node) => node.branch === branch.id).map((node) => {
        const rank = summary.ranks[node.id] || 0;
        const check = horrorCanRank(summary.ranks, node.id, summary.available);
        return {
          ...node,
          rank,
          description: node.describe(Math.max(1, rank)),
          next: rank >= node.maxRank ? null : node.describe(rank + 1),
          canRank: check.ok,
          blockedBy: check.reason,
        };
      }),
    })),
  };
}
