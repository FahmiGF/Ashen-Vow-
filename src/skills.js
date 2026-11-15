// Ashen Vow — Skill Point model.
// Pure data + pure functions. No DOM, no audio, no imports.
//
// Skill Points are earned by defeating bosses and finishing campaigns. They are
// spent on permanent ranks under `progress.skills`, and the biggest payoff is
// the ultimate ability: every rank of `ult_damage` multiplies its damage.
//
// Nothing here mutates anything except the state object passed in, which mirrors
// how src/court.js and src/expansion.js handle their own progress slices.

export const SKILL_VERSION = 1;

export const SKILL_BRANCHES = [
  { id: 'ultimate', name: 'SUMPAH ULTIMATE', glyph: '✹', color: '#ffb066' },
  { id: 'vow', name: 'SUMPAH TUBUH', glyph: '✠', color: '#8fc9a8' },
];

const NODE_SOURCE = [
  {
    id: 'ult_damage',
    name: 'Tebasan Membara',
    branch: 'ultimate',
    glyph: '⚔',
    maxRank: 5,
    desc: 'Setiap peringkat menambah 15% damage ultimate.',
  },
  {
    id: 'ult_cooldown',
    name: 'Napas Kedua',
    branch: 'ultimate',
    glyph: '◷',
    maxRank: 5,
    desc: 'Setiap peringkat mengurangi cooldown ultimate 6%.',
  },
  {
    id: 'ult_crit',
    name: 'Titik Hancur',
    branch: 'ultimate',
    glyph: '✦',
    maxRank: 4,
    desc: 'Setiap peringkat menambah 5% peluang ultimate kritikal (×1.75 damage).',
  },
  {
    id: 'vow_vigor',
    name: 'Sumpah Badan',
    branch: 'vow',
    glyph: '⛊',
    maxRank: 4,
    desc: 'Setiap peringkat menambah 12 HP maksimum.',
  },
  {
    id: 'ash_harvest',
    name: 'Panen Abu',
    branch: 'vow',
    glyph: '🜂',
    maxRank: 3,
    desc: 'Setiap peringkat menambah 10% abu dari musuh dan bos.',
  },
  {
    id: 'flask_bearer',
    name: 'Pembawa Tegukan',
    branch: 'vow',
    glyph: '⌁',
    maxRank: 2,
    desc: 'Setiap peringkat menambah satu tegukan flask maksimum.',
  },
];

export const SKILL_NODES = NODE_SOURCE.map((node) => {
  const branch = SKILL_BRANCHES.find((entry) => entry.id === node.branch);
  return {
    ...node,
    branchName: branch?.name || node.branch,
    color: branch?.color || '#ffb066',
  };
});

export const SKILL_NODE_BY_ID = Object.fromEntries(SKILL_NODES.map((node) => [node.id, node]));
export const SKILL_NODE_IDS = SKILL_NODES.map((node) => node.id);
export const SKILL_MAX_RANKS = SKILL_NODES.reduce((sum, node) => sum + node.maxRank, 0);

// Point economy. First defeat of a boss kind pays double; repeat defeats of the
// same kind pay one point every third kill so grinding is possible but slow.
export const SKILL_POINTS_FIRST_BOSS = 2;
export const SKILL_POINTS_REPEAT_EVERY = 3;
export const SKILL_POINTS_PACK_CLEAR = 5;
export const SKILL_POINTS_CAMPAIGN = 4;

const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);
const asInt = (value, fallback = 0) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
};

export const DEFAULT_SKILL_BONUSES = Object.freeze({
  ultDamage: 1,
  ultCooldown: 1,
  ultCrit: 0,
  maxHp: 0,
  ash: 1,
  flasks: 0,
});

export function defaultSkillState() {
  return {
    version: SKILL_VERSION,
    points: 0,
    earned: 0,
    spent: 0,
    ranks: {},
    credited: {},
    repeats: {},
    resets: 0,
  };
}

function sanitizeRankMap(raw) {
  const result = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
  for (const node of SKILL_NODES) {
    const rank = clamp(asInt(raw[node.id], 0), 0, node.maxRank);
    if (rank > 0) result[node.id] = rank;
  }
  return result;
}

function sanitizeCounterMap(raw, limit = 9999) {
  const result = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
  for (const [key, value] of Object.entries(raw)) {
    if (typeof key !== 'string' || !/^[a-z0-9_]{1,48}$/i.test(key)) continue;
    const count = clamp(asInt(value, 0), 0, limit);
    if (count > 0) result[key] = count;
  }
  return result;
}

export function sanitizeSkillState(raw) {
  const base = defaultSkillState();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const ranks = sanitizeRankMap(raw.ranks);
  const spent = Object.values(ranks).reduce((sum, rank) => sum + rank, 0);
  const earned = Math.max(spent, clamp(asInt(raw.earned, 0), 0, 100000));
  const points = clamp(asInt(raw.points, earned - spent), 0, 100000);
  return {
    version: SKILL_VERSION,
    points: Math.max(points, 0),
    earned: Math.max(earned, spent + points),
    spent,
    ranks,
    credited: sanitizeCounterMap(raw.credited),
    repeats: sanitizeCounterMap(raw.repeats, 999),
    resets: clamp(asInt(raw.resets, 0), 0, 9999),
  };
}

export function skillRank(state, nodeId) {
  if (!state?.ranks) return 0;
  const node = SKILL_NODE_BY_ID[nodeId];
  if (!node) return 0;
  return clamp(asInt(state.ranks[nodeId], 0), 0, node.maxRank);
}

export function skillBonuses(state) {
  const damageRank = skillRank(state, 'ult_damage');
  const cooldownRank = skillRank(state, 'ult_cooldown');
  const critRank = skillRank(state, 'ult_crit');
  return {
    ultDamage: 1 + damageRank * 0.15,
    ultCooldown: Math.max(0.55, 1 - cooldownRank * 0.06),
    ultCrit: Math.min(0.5, critRank * 0.05),
    maxHp: skillRank(state, 'vow_vigor') * 12,
    ash: 1 + skillRank(state, 'ash_harvest') * 0.1,
    flasks: skillRank(state, 'flask_bearer'),
  };
}

// Ultimate damage shown to the player, including the average critical bonus.
export function ultimatePreview(baseDamage, state) {
  const bonuses = skillBonuses(state);
  const average = bonuses.ultDamage * (1 + bonuses.ultCrit * 0.75);
  return Math.round(Number(baseDamage || 0) * average * 10) / 10;
}

export function spendSkillPoint(state, nodeId) {
  const node = SKILL_NODE_BY_ID[nodeId];
  if (!state || !node) return { ok: false, reason: 'unknown' };
  const rank = skillRank(state, nodeId);
  if (rank >= node.maxRank) return { ok: false, reason: 'max', node };
  if (asInt(state.points, 0) <= 0) return { ok: false, reason: 'points', node };
  state.ranks[nodeId] = rank + 1;
  state.points = asInt(state.points, 0) - 1;
  state.spent = asInt(state.spent, 0) + 1;
  return { ok: true, node, rank: rank + 1, points: state.points };
}

// Free respec: every spent point comes back, ranks reset to zero.
export function resetSkillRanks(state) {
  if (!state) return { ok: false, refunded: 0 };
  const refunded = asInt(state.spent, 0);
  state.points = asInt(state.points, 0) + refunded;
  state.spent = 0;
  state.ranks = {};
  state.resets = asInt(state.resets, 0) + 1;
  return { ok: true, refunded, points: state.points };
}

export function grantSkillPoints(state, amount, reason = 'reward') {
  if (!state) return { ok: false, granted: 0 };
  const granted = clamp(asInt(amount, 0), 0, 100);
  if (granted <= 0) return { ok: false, granted: 0 };
  state.points = asInt(state.points, 0) + granted;
  state.earned = asInt(state.earned, 0) + granted;
  state.lastReason = typeof reason === 'string' ? reason.slice(0, 40) : 'reward';
  return { ok: true, granted, points: state.points, reason };
}

export function grantBossSkillPoints(state, kind) {
  if (!state || typeof kind !== 'string' || !kind) return { ok: false, points: 0, first: false };
  const key = kind.slice(0, 48);
  if (!state.credited[key]) {
    state.credited[key] = 1;
    const result = grantSkillPoints(state, SKILL_POINTS_FIRST_BOSS, `boss:${key}`);
    return { ...result, first: true, points: result.granted };
  }
  const repeats = clamp(asInt(state.repeats[key], 0) + 1, 0, 999);
  state.repeats[key] = repeats;
  if (repeats % SKILL_POINTS_REPEAT_EVERY !== 0) {
    return { ok: true, granted: 0, points: 0, first: false, repeats };
  }
  const result = grantSkillPoints(state, 1, `boss-repeat:${key}`);
  return { ...result, first: false, repeats, points: result.granted };
}

export function skillSummary(state) {
  const ranks = {};
  let used = 0;
  for (const node of SKILL_NODES) {
    const rank = skillRank(state, node.id);
    ranks[node.id] = rank;
    used += rank;
  }
  const bonuses = skillBonuses(state);
  return {
    points: asInt(state?.points, 0),
    earned: asInt(state?.earned, 0),
    spent: asInt(state?.spent, 0),
    used,
    max: SKILL_MAX_RANKS,
    percent: Math.round((used / SKILL_MAX_RANKS) * 100),
    ranks,
    bonuses,
    bossKinds: Object.keys(state?.credited || {}).length,
  };
}
