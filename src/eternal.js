// Update XIV — Eternal Night: rules, progression and systems.
// Pure ES module (no DOM). Arc X owns its own save key while reading the
// shared Arc IX Ghost Index and Sanity meter passed in by the shell.
export * from './eternal_data.js';

import {
  ETERNAL_CHAPTERS, ETERNAL_CHAPTERS_BY_ID, ETERNAL_STAGES, ETERNAL_STAGES_BY_ID,
  ETERNAL_BOSSES, ETERNAL_BOSSES_BY_ID, ETERNAL_SAVE_KEY, ETERNAL_SAVE_VERSION,
  ETERNAL_ROOM_START, ETERNAL_BOSS_ROOM_START, ETERNAL_TABS, ETERNAL_DEFAULTS,
  ETERNAL_SETTING_DEFINITIONS, HUNT_VARIANTS, HUNT_CONFIG_DEFAULTS,
  INVESTIGATION_TEMPLATES, INVESTIGATION_DIFFICULTY, ETERNAL_EQUIPMENT,
  ETERNAL_EQUIPMENT_BY_ID, WORLD_EVENTS, WORLD_EVENTS_BY_ID, EXPEDITION_ROLES,
  COOP_TASKS, COOP_DIFFICULTIES, INDEX_RANK_MILESTONES, ETERNAL_ACHIEVEMENTS,
  PERFORMANCE_THRESHOLDS,
} from './eternal_data.js';
import { GHOSTS, GHOSTS_BY_ID, INDEX_MAX_RANK, DIFFICULTIES, VEIL_STAGES_BY_ID, VEIL_WORLD } from './veil.js';

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const finite = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
const arr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

function hash01(text) {
  let h = 2166136261;
  const value = String(text);
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export function seededOrder(seed, rows, key = (row) => row.id) {
  return [...rows]
    .map((row) => ({ row, order: hash01(`${seed}:${key(row)}`), tie: String(key(row)) }))
    .sort((a, b) => a.order - b.order || a.tie.localeCompare(b.tie))
    .map((entry) => entry.row);
}

// ---------------------------------------------------------------------------
// Campaign helpers
// ---------------------------------------------------------------------------
export const eternalStage = (id) => ETERNAL_STAGES_BY_ID[id] || null;
export const eternalChapter = (id) => ETERNAL_CHAPTERS_BY_ID[id] || null;
export const eternalBoss = (id) => ETERNAL_BOSSES_BY_ID[id] || null;

export function eternalChapterClear(chapterId, progress = {}) {
  const chapter = ETERNAL_CHAPTERS_BY_ID[chapterId];
  if (!chapter) return false;
  if (chapter.index === ETERNAL_CHAPTERS.length - 1) return !!progress.finalBoss;
  return (progress.bossClears || []).includes(chapter.boss);
}

export function eternalChapterUnlocked(chapterId, progress = {}) {
  const chapter = ETERNAL_CHAPTERS_BY_ID[chapterId];
  if (!chapter) return false;
  if (chapter.index === 0) return progress.unlocked !== false;
  return eternalChapterClear(ETERNAL_CHAPTERS[chapter.index - 1].id, progress);
}

export function eternalStageUnlocked(stageId, progress = {}) {
  const stage = eternalStage(stageId);
  if (!stage || !eternalChapterUnlocked(stage.chapter, progress)) return false;
  if (stage.localIndex === 0) return true;
  const previous = ETERNAL_STAGES[stage.index - 1];
  return (progress.completedStages || []).includes(previous?.id);
}

export function eternalBossUnlocked(bossId, progress = {}) {
  const boss = eternalBoss(bossId);
  if (!boss || boss.final || !eternalChapterUnlocked(boss.chapterId, progress)) return false;
  return ETERNAL_STAGES.filter((s) => s.chapter === boss.chapterId)
    .every((s) => (progress.completedStages || []).includes(s.id));
}

export function eternalFinalUnlocked(progress = {}) {
  return ETERNAL_BOSSES.filter((b) => !b.final).every((b) => (progress.bossClears || []).includes(b.id));
}

const platformsFor = (chapterIndex, worldW, floorY) => {
  const variants = [
    [{ x: 300, y: floorY - 130, w: 230, h: 18 }, { x: 760, y: floorY - 210, w: 200, h: 18 }, { x: 1300, y: floorY - 140, w: 250, h: 18 }],
    [{ x: 260, y: floorY - 170, w: 210, h: 18 }, { x: 680, y: floorY - 90, w: 270, h: 18 }, { x: 1220, y: floorY - 220, w: 200, h: 18 }],
    [{ x: 380, y: floorY - 100, w: 240, h: 18 }, { x: 800, y: floorY - 190, w: 230, h: 18 }, { x: 1340, y: floorY - 120, w: 210, h: 18 }],
    [{ x: 320, y: floorY - 150, w: 260, h: 18 }, { x: 760, y: floorY - 70, w: 200, h: 18 }, { x: 1280, y: floorY - 200, w: 240, h: 18 }],
    [{ x: 360, y: floorY - 200, w: 210, h: 18 }, { x: 720, y: floorY - 110, w: 280, h: 18 }, { x: 1240, y: floorY - 80, w: 250, h: 18 }],
    [{ x: 280, y: floorY - 120, w: 280, h: 18 }, { x: 740, y: floorY - 200, w: 210, h: 18 }, { x: 1320, y: floorY - 130, w: 220, h: 18 }],
    [{ x: 340, y: floorY - 160, w: 230, h: 18 }, { x: 820, y: floorY - 90, w: 250, h: 18 }, { x: 1300, y: floorY - 210, w: 220, h: 18 }],
  ];
  return [{ x: 0, y: floorY, w: worldW, h: 48 }, ...(variants[chapterIndex % variants.length] || [])];
};

export function eternalRoom(stageId, options = {}) {
  const stage = eternalStage(stageId);
  if (!stage) return null;
  const chapter = ETERNAL_CHAPTERS_BY_ID[stage.chapter];
  const worldW = finite(options.worldW, VEIL_WORLD.width);
  const floorY = finite(options.floorY, VEIL_WORLD.floor);
  return {
    index: stage.room,
    name: stage.name,
    subtitle: `${chapter.name} · Tahap ${stage.number}`,
    zone: chapter.zone,
    palette: chapter.palette,
    spawn: { x: 120, y: floorY - 52 },
    platforms: platformsFor(stage.chapterIndex, worldW, floorY),
    gates: [],
    merchant: null,
    checkpoint: stage.investigation ? { x: 180, name: 'Refuge Lapangan' } : null,
    eternalStage: stage.id,
    eternalChapter: stage.chapter,
    eternalBoss: null,
    investigationSpot: stage.investigation ? { x: Math.round(worldW * 0.55), y: floorY - 60 } : null,
    secretSpot: stage.secret ? { x: Math.round(worldW * 0.82), y: floorY - 60 } : null,
    relic: null,
    ambient: chapter.zone,
  };
}

export function eternalArena(bossId, options = {}) {
  const boss = eternalBoss(bossId);
  if (!boss) return null;
  const worldW = finite(options.worldW, VEIL_WORLD.width);
  const floorY = finite(options.floorY, VEIL_WORLD.floor);
  const chapter = ETERNAL_CHAPTERS_BY_ID[boss.chapterId];
  const index = ETERNAL_BOSSES.findIndex((b) => b.id === bossId);
  return {
    index: ETERNAL_BOSS_ROOM_START + Math.max(0, index),
    name: boss.name,
    subtitle: boss.title,
    zone: chapter.zone,
    palette: chapter.palette,
    spawn: { x: 110, y: floorY - 52 },
    platforms: [{ x: 0, y: floorY, w: worldW, h: 48 }, { x: 400, y: floorY - 130, w: 260, h: 18 }, { x: 960, y: floorY - 130, w: 260, h: 18 }, { x: 1440, y: floorY - 220, w: 220, h: 18 }],
    gates: [],
    merchant: null,
    checkpoint: { x: 110, name: 'Ambang Malam' },
    eternalBoss: boss.id,
    eternalStage: null,
  };
}

/** The invariant is enforced here: 19 normal + exactly 1 elite = 20. */
export function eternalStageEnemies(stageId, options = {}) {
  const stage = eternalStage(stageId);
  if (!stage) return [];
  const worldW = finite(options.worldW, VEIL_WORLD.width);
  const rows = [];
  for (let i = 0; i < 19; i += 1) {
    rows.push({
      type: stage.archetypes[i % stage.archetypes.length],
      x: Math.round(260 + ((i * 97) % Math.max(200, worldW - 520))),
      minX: 120,
      maxX: worldW - 80,
      hpScale: 0.88 + stage.chapterIndex * 0.05,
      dmgScale: 0.85 + stage.chapterIndex * 0.06,
    });
  }
  rows.push({
    type: options.elite || stage.archetypes[0],
    x: Math.round(worldW * 0.74),
    minX: 120,
    maxX: worldW - 80,
    hpScale: 1.8 + stage.chapterIndex * 0.14,
    dmgScale: 1.3 + stage.chapterIndex * 0.1,
    elite: true,
    eliteRank: `E${Math.min(7, stage.chapterIndex + 1)}`,
  });
  return rows;
}

export function eternalBossSpawn(bossId) {
  const boss = eternalBoss(bossId);
  if (!boss) return null;
  return {
    kind: boss.id,
    name: boss.name,
    title: boss.title,
    maxHp: boss.maxHp,
    maxPhases: boss.maxPhases,
    phaseThresholds: boss.phaseThresholds.slice(),
    dialogueData: boss.dialogueData,
    reward: boss.reward,
    patterns: boss.patterns.slice(),
    color: boss.chapterId === 'eternal_nightfall' ? '#b0a0e0' : null,
  };
}

export function eternalSummary(save = {}) {
  const stages = save.campaign?.completedStages?.length || 0;
  const bosses = save.campaign?.bossClears?.length || 0;
  return {
    stages,
    totalStages: ETERNAL_STAGES.length,
    bosses,
    totalBosses: ETERNAL_BOSSES.length,
    chapters: save.campaign?.chapterClears?.length || 0,
    totalChapters: ETERNAL_CHAPTERS.length,
    finalBoss: !!save.campaign?.finalBoss,
    hunts: save.hunts?.history?.length || 0,
    events: save.events?.completed?.length || 0,
    percent: Math.round((stages / ETERNAL_STAGES.length) * 100),
  };
}

// ---------------------------------------------------------------------------
// Procedural investigation generation
// ---------------------------------------------------------------------------
export class InvestigationGenerator {
  constructor(options = {}) {
    this.fallbackId = options.fallbackId || 'vesper_hollow_case_1';
  }

  /** Deterministic, prevalidated case. Never invents an unknown ghost. */
  generate(seed, level = 1, options = {}) {
    const cleanSeed = String(seed || 'seed').slice(0, 96);
    const difficulty = INVESTIGATION_DIFFICULTY[options.difficulty] ? options.difficulty : 'normal';
    const diff = INVESTIGATION_DIFFICULTY[difficulty];
    const pools = INVESTIGATION_TEMPLATES.filter((t) => t.minLevel <= Math.max(1, level));
    const template = seededOrder(cleanSeed, pools, (t) => t.id)[0] || INVESTIGATION_TEMPLATES[0];
    const chapterIds = ETERNAL_CHAPTERS.map((c) => c.id);
    const chapter = options.chapter && ETERNAL_CHAPTERS_BY_ID[options.chapter]
      ? options.chapter
      : seededOrder(`${cleanSeed}:chapter`, ETERNAL_CHAPTERS, (c) => c.id)[0].id;
    let pool = GHOSTS.filter((g) => !g.secret && (options.classification ? g.classification === options.classification : true));
    if (options.rarity) pool = pool.filter((g) => g.rarity === options.rarity);
    if (!pool.length) pool = GHOSTS.filter((g) => !g.secret);
    const ghostCount = template.id === 'multi_ghost' ? 2 : 1;
    const ghosts = seededOrder(`${cleanSeed}:ghost`, pool, (g) => g.id).slice(0, ghostCount).map((g) => g.id);
    const evidenceGoal = Math.max(template.evidenceGoal, diff.evidence);
    const targetStage = ETERNAL_STAGES.find((s) => s.chapter === chapter && s.investigation)
      || ETERNAL_STAGES.find((s) => s.chapter === chapter)
      || ETERNAL_STAGES[0];
    const levelScale = 1 + Math.max(0, level - 1) * 0.03;
    const reward = {
      spiritShards: Math.round((130 + template.evidenceGoal * 25) * diff.reward * levelScale),
      veilFragments: Math.round((8 + template.evidenceGoal * 2) * diff.reward),
      investigationMarks: 1 + Math.floor(template.evidenceGoal / 4),
    };
    const mission = {
      id: `gen:${cleanSeed}:${template.id}:${ghosts.join('+')}`,
      generated: true,
      seed: cleanSeed,
      template: template.id,
      name: `${template.name} · ${chapterIds.includes(chapter) ? ETERNAL_CHAPTERS_BY_ID[chapter].name : chapter}`,
      objective: template.objective,
      chapter,
      stage: targetStage.id,
      steps: template.steps.slice(),
      evidenceGoal,
      ghostPool: ghosts,
      reward,
      difficulty,
      timeLimit: template.timed || diff.time,
      level: Math.max(1, Math.floor(level)),
      description: `${template.objective} di ${ETERNAL_CHAPTERS_BY_ID[chapter]?.name || chapter}. Seed ${cleanSeed}.`,
    };
    const checked = this.validate(mission);
    return checked.ok ? { ok: true, mission } : { ok: false, reason: checked.reason, mission: this.fallback() };
  }

  validate(mission) {
    if (!mission || typeof mission !== 'object') return { ok: false, reason: 'missing' };
    if (!INVESTIGATION_TEMPLATES.some((t) => t.id === mission.template)) return { ok: false, reason: 'template' };
    if (!ETERNAL_STAGES_BY_ID[mission.stage]) return { ok: false, reason: 'stage' };
    if (!ETERNAL_CHAPTERS_BY_ID[mission.chapter]) return { ok: false, reason: 'chapter' };
    if (!Array.isArray(mission.ghostPool) || !mission.ghostPool.length) return { ok: false, reason: 'ghosts' };
    if (!mission.ghostPool.every((id) => !!GHOSTS_BY_ID[id])) return { ok: false, reason: 'ghost-id' };
    if (!Number.isFinite(mission.evidenceGoal) || mission.evidenceGoal < 1 || mission.evidenceGoal > 12) return { ok: false, reason: 'evidence' };
    if (!Array.isArray(mission.steps) || !mission.steps.length) return { ok: false, reason: 'steps' };
    if (!mission.reward || !Object.values(mission.reward).every((v) => Number.isFinite(v) && v >= 0)) return { ok: false, reason: 'reward' };
    if (mission.timeLimit && mission.timeLimit < 60) return { ok: false, reason: 'time' };
    return { ok: true };
  }

  fallback() {
    const original = VEIL_STAGES_BY_ID ? null : null;
    const base = GHOSTS.find((g) => g.id === 'pale_resident') || GHOSTS[0];
    void original;
    return {
      id: `gen:fallback:${base.id}`,
      generated: true,
      fallback: true,
      seed: 'fallback',
      template: 'entity_identification',
      name: 'Entity Identification · Vesper Hollow',
      objective: 'Identifikasi entitas tak dikenal',
      chapter: 'midnight_city',
      stage: 'midnight_city_3',
      steps: ['detect', 'identify', 'record', 'analyze', 'document'],
      evidenceGoal: 3,
      ghostPool: [base.id],
      reward: { spiritShards: 120, veilFragments: 6, investigationMarks: 1 },
      difficulty: 'normal',
      timeLimit: 300,
      level: 1,
      description: 'Fallback yang selalu dapat diselesaikan jika generator gagal.',
    };
  }
}

// ---------------------------------------------------------------------------
// Spectral Pursuit
// ---------------------------------------------------------------------------
export function sanitizeHuntConfig(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const variant = HUNT_VARIANTS.some((v) => v.id === src.variant) ? src.variant : HUNT_CONFIG_DEFAULTS.variant;
  const variantDef = HUNT_VARIANTS.find((v) => v.id === variant);
  return {
    variant,
    chapter: ETERNAL_CHAPTERS_BY_ID[src.chapter] ? src.chapter : HUNT_CONFIG_DEFAULTS.chapter,
    classification: src.classification && src.classification !== 'all' ? String(src.classification) : 'all',
    rarity: src.rarity && src.rarity !== 'all' ? String(src.rarity) : 'all',
    duration: clamp(Math.round(finite(src.duration, variantDef.duration)), 120, 900),
    evidenceDifficulty: INVESTIGATION_DIFFICULTY[src.evidenceDifficulty] ? src.evidenceDifficulty : 'normal',
    sanityRules: ['standard', 'reduced', 'disabled'].includes(src.sanityRules) ? src.sanityRules : 'standard',
    equipmentRestrictions: ['none', 'essentials', 'category'].includes(src.equipmentRestrictions) ? src.equipmentRestrictions : 'none',
    environmentalEvents: src.environmentalEvents !== false,
    difficulty: DIFFICULTIES.includes(src.difficulty) ? src.difficulty : 'normal',
    antiJumpscare: src.antiJumpscare !== false,
  };
}

export function createHunt(config, level = 1, options = {}) {
  const clean = sanitizeHuntConfig(config);
  const variantDef = HUNT_VARIANTS.find((v) => v.id === clean.variant);
  const seed = String(options.seed || `hunt:${clean.variant}:${clean.chapter}:${level}`).slice(0, 96);
  let pool = GHOSTS.filter((g) => !g.secret);
  if (clean.classification !== 'all') pool = pool.filter((g) => g.classification === clean.classification);
  if (clean.rarity !== 'all') pool = pool.filter((g) => g.rarity === clean.rarity);
  if (variantDef.rarities) pool = pool.filter((g) => variantDef.rarities.includes(g.rarity));
  if (!pool.length) pool = GHOSTS.filter((g) => !g.secret);
  const entities = seededOrder(`${seed}:entities`, pool, (g) => g.id)
    .slice(0, Math.max(1, variantDef.entities)).map((g) => g.id);
  const stages = ETERNAL_STAGES.filter((s) => s.chapter === clean.chapter);
  const stage = stages.find((s) => s.investigation) || stages[0] || ETERNAL_STAGES[0];
  return {
    id: `hunt:${seed}`,
    seed,
    variant: clean.variant,
    config: clean,
    entities,
    stage: stage.id,
    chapter: clean.chapter,
    duration: clamp(clean.duration, 120, 900),
    objectives: [
      { id: 'enter', label: 'Masuki lokasi', done: false },
      { id: 'gather', label: 'Kumpulkan informasi lingkungan', done: false },
      { id: 'classify', label: 'Tentukan klasifikasi entitas', done: false },
      { id: 'investigate', label: `Selesaikan ${variantDef.evidence} bukti`, done: false },
      { id: 'resolve', label: 'Selesaikan pertemuan', done: false },
      { id: 'return', label: 'Kembali ke hub dengan catatan', done: false },
    ],
    evidenceGoal: variantDef.evidence,
    status: 'active',
    startedAt: 0,
    completedAt: 0,
    antiJumpscare: clean.antiJumpscare,
    reward: {
      spiritShards: 120 + variantDef.evidence * 30 + (clean.variant === 'ancient' ? 150 : 0),
      veilFragments: 8 + variantDef.evidence * 3,
      investigationMarks: 1 + (clean.variant === 'endless' ? 3 : 0),
    },
  };
}

export function advanceHunt(hunt, step, value = true) {
  if (!hunt || hunt.status !== 'active') return { ok: false, reason: 'inactive' };
  const objective = hunt.objectives.find((o) => o.id === step);
  if (!objective) return { ok: false, reason: 'unknown-step' };
  objective.done = !!value;
  return { ok: true, completed: hunt.objectives.every((o) => o.done) };
}

export function completeHunt(hunt, result = {}) {
  if (!hunt || hunt.status !== 'active') return { ok: false, reason: 'inactive' };
  const all = hunt.objectives.every((o) => o.done);
  if (!all && !result.peaceful) return { ok: false, reason: 'incomplete' };
  hunt.status = 'complete';
  hunt.completedAt = Math.max(0, finite(result.timeMs, 0));
  return { ok: true, hunt, reward: hunt.reward, antiJumpscare: hunt.antiJumpscare };
}

// ---------------------------------------------------------------------------
// Workshop
// ---------------------------------------------------------------------------
export function equipmentCost(itemId, tier) {
  const item = ETERNAL_EQUIPMENT_BY_ID[itemId];
  if (!item) return null;
  const next = clamp(Math.round(finite(tier, 1)), 1, 5);
  if (next <= 1) return null;
  const row = item.tiers[next - 1];
  return {
    tier: next,
    name: row.name,
    spiritShards: Math.round(row.cost),
    veilFragments: Math.round(row.cost / 24),
    benefit: row.benefit,
  };
}

export function equipmentBonuses(tiers = {}) {
  const out = { detection: 0, recording: 0, protection: 0, investigation: 0, exploration: 0, utility: 0 };
  for (const item of ETERNAL_EQUIPMENT) {
    const tier = clamp(Math.round(finite(tiers[item.id], 1)), 1, 5);
    out[item.category] += (tier - 1) * 0.08;
  }
  return {
    detectionRange: 1 + out.detection,
    evidenceRadius: 1 + out.investigation,
    sanityProtection: clamp(1 - out.protection * 0.5, 0.6, 1),
    exposureResistance: clamp(1 - out.protection * 0.6, 0.55, 1),
    focusRecovery: 1 + out.investigation * 0.75,
    huntDuration: 1 + out.exploration * 0.5,
  };
}

// ---------------------------------------------------------------------------
// World event director
// ---------------------------------------------------------------------------
export class WorldEventDirector {
  constructor(raw = {}, options = {}) {
    const src = raw && typeof raw === 'object' ? raw : {};
    this.enabled = src.enabled !== false;
    this.active = null;
    this.completed = arr(src.completed).filter((id) => !!WORLD_EVENTS_BY_ID[id]);
    this.claimed = arr(src.claimed);
    this.journal = arr(src.journal).filter((id) => !!WORLD_EVENTS_BY_ID[id]);
    this.progress = {};
    for (const [id, value] of Object.entries(src.progress || {})) {
      if (WORLD_EVENTS_BY_ID[id]) this.progress[id] = clamp(Math.floor(finite(value, 0)), 0, 99);
    }
    if (src.active && WORLD_EVENTS_BY_ID[src.active.id]) {
      this.active = { id: src.active.id, startedAt: Math.max(0, finite(src.active.startedAt, 0)), objectives: Array.isArray(src.active.objectives) ? src.active.objectives.slice() : [] };
    }
    this.seed = String(options.seed || 'eternal-events');
  }

  schedule(now = 0) {
    if (!this.enabled) return null;
    const def = seededOrder(`${this.seed}:${Math.floor(now / 3600000)}`, WORLD_EVENTS, (e) => e.id)[0];
    return def || null;
  }

  activate(eventId, now = 0) {
    if (!this.enabled) return { ok: false, reason: 'disabled' };
    const def = WORLD_EVENTS_BY_ID[eventId] || this.schedule(now);
    if (!def) return { ok: false, reason: 'unknown' };
    if (this.active) return { ok: false, reason: 'busy', active: this.active.id };
    if (this.completed.includes(def.id) && this.claimed.includes(def.id)) return { ok: false, reason: 'completed' };
    this.active = {
      id: def.id,
      startedAt: Math.max(0, finite(now, 0)),
      objectives: def.objectives.map((label, index) => ({ index, label, done: false })),
    };
    return { ok: true, event: def, active: this.active };
  }

  contribute(objectiveIndex, amount = 1) {
    if (!this.active) return { ok: false, reason: 'inactive' };
    const objective = this.active.objectives[objectiveIndex];
    if (!objective) return { ok: false, reason: 'objective' };
    objective.done = true;
    const def = WORLD_EVENTS_BY_ID[this.active.id];
    this.progress[def.id] = clamp((this.progress[def.id] || 0) + Math.max(0, Math.floor(amount)), 0, 99);
    return { ok: true, complete: this.active.objectives.every((o) => o.done) };
  }

  complete(txId = null) {
    if (!this.active) return { ok: false, reason: 'inactive' };
    if (!this.active.objectives.every((o) => o.done)) return { ok: false, reason: 'objectives' };
    const def = WORLD_EVENTS_BY_ID[this.active.id];
    if (!def) return { ok: false, reason: 'unknown' };
    if (txId && this.claimed.includes(txId)) return { ok: false, reason: 'duplicate' };
    if (txId) this.claimed.push(txId);
    if (!this.completed.includes(def.id)) this.completed.push(def.id);
    if (!this.journal.includes(def.id)) this.journal.push(def.id);
    this.active = null;
    return { ok: true, event: def, reward: def.rewards, replayable: true };
  }

  toJSON() {
    return {
      enabled: this.enabled, active: this.active, completed: this.completed.slice(), claimed: this.claimed.slice(),
      journal: this.journal.slice(), progress: { ...this.progress },
    };
  }
}

// ---------------------------------------------------------------------------
// Multiplayer expedition model
// ---------------------------------------------------------------------------
export class GhostResearchExpedition {
  constructor(raw = {}) {
    const src = raw && typeof raw === 'object' ? raw : {};
    this.sessions = Array.isArray(src.sessions) ? src.sessions.filter((s) => s && typeof s.id === 'string').slice(-20) : [];
    this.claimed = arr(src.claimed);
    this.stats = {
      clears: Math.max(0, finite(src.stats?.clears, 0)),
      revives: Math.max(0, finite(src.stats?.revives, 0)),
      reconnects: Math.max(0, finite(src.stats?.reconnects, 0)),
    };
  }

  create(options = {}) {
    const role = EXPEDITION_ROLES.some((r) => r.id === options.role) ? options.role : 'lead';
    const difficulty = COOP_DIFFICULTIES.includes(options.difficulty) ? options.difficulty : 'normal';
    const session = {
      id: `expedition:${String(options.seed || Date.now()).slice(0, 48)}`,
      seed: String(options.seed || Date.now()),
      authority: 'host',
      serverValidated: false,
      private: options.private !== false,
      difficulty,
      role,
      members: [{ id: String(options.playerId || 'host'), role, ready: true, connected: true, sanity: 100, records: [] }],
      shared: { objectives: [], discovered: [], votes: {} },
      tasks: COOP_TASKS.map((t) => ({ ...t, done: false, assigned: [] })),
      status: 'lobby',
      reconnectTokens: {},
      rewardsGranted: [],
    };
    this.sessions.push(session);
    return session;
  }

  join(sessionId, playerId, role = 'archivist') {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return { ok: false, reason: 'unknown-session' };
    if (session.members.length >= 4) return { ok: false, reason: 'full' };
    if (!EXPEDITION_ROLES.some((r) => r.id === role)) return { ok: false, reason: 'role' };
    if (session.members.some((m) => m.id === playerId)) return { ok: false, reason: 'duplicate' };
    const token = `reconnect:${session.id}:${playerId}:${hash01(`${session.id}:${playerId}`).toString(36).slice(2, 10)}`;
    session.members.push({ id: playerId, role, ready: false, connected: true, sanity: 100, records: [] });
    session.reconnectTokens[playerId] = token;
    return { ok: true, session, token };
  }

  reconnect(sessionId, playerId, token) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return { ok: false, reason: 'unknown-session' };
    if (session.reconnectTokens[playerId] !== token) return { ok: false, reason: 'token' };
    const member = session.members.find((m) => m.id === playerId);
    if (!member) return { ok: false, reason: 'member' };
    member.connected = true;
    this.stats.reconnects += 1;
    return { ok: true, session, member };
  }

  vote(sessionId, playerId, option) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return { ok: false, reason: 'unknown-session' };
    const member = session.members.find((m) => m.id === playerId);
    if (!member || !member.connected) return { ok: false, reason: 'member' };
    if (typeof option !== 'string' || !option) return { ok: false, reason: 'option' };
    session.shared.votes[playerId] = option.slice(0, 48);
    const tally = {};
    for (const value of Object.values(session.shared.votes)) tally[value] = (tally[value] || 0) + 1;
    const winner = Object.entries(tally).sort((a, b) => b[1] - a[1])[0] || null;
    return { ok: true, tally, winner: winner ? winner[0] : null };
  }

  teamSanity(sessionId) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return null;
    return session.members.map((m) => ({ id: m.id, role: m.role, sanity: clamp(finite(m.sanity, 100), 0, 100), connected: m.connected }));
  }

  completeTask(sessionId, taskId) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return { ok: false, reason: 'unknown-session' };
    const task = session.tasks.find((t) => t.id === taskId);
    if (!task) return { ok: false, reason: 'task' };
    if (task.done) return { ok: false, reason: 'duplicate' };
    const active = session.members.filter((m) => m.connected).length;
    if (active < task.players) return { ok: false, reason: 'players', required: task.players, active };
    task.done = true;
    return { ok: true, complete: session.tasks.every((t) => t.done) };
  }

  complete(sessionId, result = {}) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return { ok: false, reason: 'unknown-session' };
    const tx = `expedition:${session.id}`;
    if (this.claimed.includes(tx)) return { ok: false, reason: 'duplicate' };
    this.claimed.push(tx);
    session.status = 'complete';
    this.stats.clears += 1;
    return { ok: true, reward: { spiritShards: 260, veilFragments: 20, ancientSeals: 1 }, participants: session.members.map((m) => m.id), result };
  }

  toJSON() {
    return { sessions: this.sessions.slice(-20), claimed: this.claimed.slice(), stats: { ...this.stats } };
  }
}

// ---------------------------------------------------------------------------
// Project Eternal Performance instrumentation
// ---------------------------------------------------------------------------
export class EternalPerfMonitor {
  constructor(raw = {}, options = {}) {
    const src = raw && typeof raw === 'object' ? raw : {};
    this.thresholds = { ...PERFORMANCE_THRESHOLDS, ...(options.thresholds || {}) };
    this.enabled = src.enabled === true;
    this.samples = Array.isArray(src.samples) ? src.samples.slice(-120) : [];
    this.warnings = Array.isArray(src.warnings) ? src.warnings.slice(-40) : [];
    this.counters = {
      pathRequests: Math.max(0, finite(src.counters?.pathRequests, 0)),
      aiUpdates: Math.max(0, finite(src.counters?.aiUpdates, 0)),
      saveMs: Math.max(0, finite(src.counters?.saveMs, 0)),
    };
    this.last = null;
  }

  sample(raw = {}) {
    const frameMs = clamp(finite(raw.frameMs, 16.67), 0, 500);
    const row = {
      at: Math.max(0, finite(raw.at, Date.now())),
      frameMs,
      fps: clamp(finite(raw.fps, frameMs > 0 ? 1000 / frameMs : 60), 0, 1000),
      ghosts: Math.max(0, Math.floor(finite(raw.ghosts, 0))),
      aiUpdates: Math.max(0, Math.floor(finite(raw.aiUpdates, 0))),
      pathRequests: Math.max(0, Math.floor(finite(raw.pathRequests, 0))),
      particles: Math.max(0, Math.floor(finite(raw.particles, 0))),
      audioEmitters: Math.max(0, Math.floor(finite(raw.audioEmitters, 0))),
      sections: Math.max(0, Math.floor(finite(raw.sections, 0))),
      heapMb: Math.max(0, finite(raw.heapMb, 0)),
      latencyMs: Math.max(0, finite(raw.latencyMs, 0)),
      replicationKb: Math.max(0, finite(raw.replicationKb, 0)),
      saveMs: Math.max(0, finite(raw.saveMs, 0)),
    };
    this.last = row;
    this.samples.push(row);
    while (this.samples.length > 120) this.samples.shift();
    const warnings = [];
    const checks = [
      ['frameMs', row.frameMs, '>'], ['fps', row.fps, '<'], ['ghosts', row.ghosts, '>'],
      ['aiUpdates', row.aiUpdates, '>'], ['pathRequests', row.pathRequests, '>'],
      ['particles', row.particles, '>'], ['audioEmitters', row.audioEmitters, '>'],
      ['loadedSections', row.sections, '>'], ['heapMb', row.heapMb, '>'],
      ['latencyMs', row.latencyMs, '>'], ['replicationKb', row.replicationKb, '>'], ['saveMs', row.saveMs, '>'],
    ];
    for (const [key, value, dir] of checks) {
      const threshold = this.thresholds[key] ?? this.thresholds[key === 'loadedSections' ? 'loadedSections' : key];
      if (threshold === undefined) continue;
      if ((dir === '>' && value > threshold) || (dir === '<' && value < threshold)) {
        warnings.push({ key, value, threshold, at: row.at });
      }
    }
    if (warnings.length) {
      this.warnings.push(...warnings);
      while (this.warnings.length > 40) this.warnings.shift();
    }
    return { row, warnings };
  }

  recordPath(count = 1) { this.counters.pathRequests += Math.max(0, Math.floor(count)); }
  recordAi(count = 1) { this.counters.aiUpdates += Math.max(0, Math.floor(count)); }
  recordSave(ms) { this.counters.saveMs = Math.max(0, finite(ms, 0)); }

  snapshot() {
    const rows = this.samples;
    const avg = rows.length ? rows.reduce((sum, r) => sum + r.frameMs, 0) / rows.length : 0;
    return {
      enabled: this.enabled,
      avgFrameMs: Math.round(avg * 100) / 100,
      fps: rows.length ? Math.round(rows[rows.length - 1].fps) : 0,
      last: this.last,
      warnings: this.warnings.slice(-8),
      counters: { ...this.counters },
      thresholds: { ...this.thresholds },
    };
  }

  toJSON() { return { enabled: this.enabled, samples: this.samples.slice(-120), warnings: this.warnings.slice(-40), counters: { ...this.counters } }; }
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export function sanitizeEternalSettings(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  for (const def of ETERNAL_SETTING_DEFINITIONS) {
    const path = def.path.replace(/^eternal\./, '');
    const keys = path.split('.');
    let value = src;
    for (const key of keys) value = value && typeof value === 'object' ? value[key] : undefined;
    if (value === undefined) value = src[def.path] ?? src[path];
    if (def.type === 'toggle') out[path] = typeof value === 'boolean' ? value : def.value;
    else if (def.type === 'range') out[path] = clamp(finite(value, def.value), def.min, def.max);
    else out[path] = def.options.includes(String(value)) ? String(value) : String(def.value);
  }
  return out;
}

export function eternalSettingValue(settings, path) {
  const clean = String(path || '').replace(/^eternal\./, '');
  if (settings && settings[clean] !== undefined) return settings[clean];
  return clean.split('.').reduce((value, key) => (value && typeof value === 'object' ? value[key] : undefined), settings);
}

export function setEternalSetting(settings, path, value) {
  const def = ETERNAL_SETTING_DEFINITIONS.find((d) => d.path === path || d.path.replace(/^eternal\./, '') === path);
  if (!def) return null;
  const clean = def.path.replace(/^eternal\./, '');
  const keys = clean.split('.');
  let cursor = settings;
  for (let i = 0; i < keys.length - 1; i += 1) {
    if (!cursor[keys[i]] || typeof cursor[keys[i]] !== 'object') cursor[keys[i]] = {};
    cursor = cursor[keys[i]];
  }
  if (def.type === 'toggle') cursor[keys[keys.length - 1]] = !!value;
  else if (def.type === 'range') cursor[keys[keys.length - 1]] = clamp(finite(value, def.value), def.min, def.max);
  else cursor[keys[keys.length - 1]] = def.options.includes(String(value)) ? String(value) : String(def.value);
  const cleanSettings = sanitizeEternalSettings(settings);
  Object.keys(settings).forEach((key) => delete settings[key]);
  Object.assign(settings, cleanSettings);
  return settings;
}

export function resolveEternalPresentation(settings = {}, context = {}) {
  const clean = sanitizeEternalSettings(settings);
  const reduced = !!context.reducedMotion || clean['accessibility.reducedMotion'];
  return {
    huntAntiJumpscare: clean['hunts.antiJumpscare'] || !!context.antiJumpscare,
    eventsEnabled: clean['events.enabled'],
    eventIntensity: clean['events.intensity'],
    overlay: clean['performance.overlay'] || !!context.dev,
    adaptive: clean['performance.adaptive'],
    motion: reduced ? 'reduced' : 'full',
    highContrast: !!clean['accessibility.highContrast'],
    sanity: {
      exposureEnabled: clean['sanity.exposureEnabled'],
      exposureGain: clean['sanity.exposureGain'],
      exposureDecay: clean['sanity.exposureDecay'],
      focusRecovery: clean['sanity.focusRecovery'],
    },
  };
}

// ---------------------------------------------------------------------------
// Save model
// ---------------------------------------------------------------------------
export function defaultEternalSave() {
  return {
    schemaVersion: ETERNAL_SAVE_VERSION,
    savedAt: 0,
    campaign: {
      unlocked: false, completedStages: [], bossClears: [], chapterClears: [],
      finalBoss: false, deaths: 0, runs: 0, bestTimeMs: 0,
    },
    investigations: { generated: [], completed: [], activeCase: null, claimed: [] },
    hunts: { active: null, history: [], runs: 0, config: { ...HUNT_CONFIG_DEFAULTS } },
    workshop: { tiers: Object.fromEntries(ETERNAL_EQUIPMENT.map((e) => [e.id, 1])), loadout: ['resonance_scanner', 'spirit_microphone', 'spectral_lens'], purchased: [] },
    events: { enabled: true, active: null, completed: [], claimed: [], journal: [], progress: {} },
    coop: { sessions: [], claimed: [], stats: { clears: 0, revives: 0, reconnects: 0 } },
    rankRewards: [],
    achievements: [],
    perf: { enabled: false, samples: [], warnings: [], counters: { pathRequests: 0, aiUpdates: 0, saveMs: 0 } },
    stats: { hunts: 0, events: 0, coopClears: 0, masterworks: 0, generated: 0, completedCases: 0 },
  };
}

export function sanitizeEternalSave(raw = {}) {
  const base = defaultEternalSave();
  const src = raw && typeof raw === 'object' ? raw : {};
  const campaign = src.campaign && typeof src.campaign === 'object' ? src.campaign : {};
  base.campaign.unlocked = campaign.unlocked === true;
  base.campaign.completedStages = [...new Set(arr(campaign.completedStages))].filter((id) => !!eternalStage(id));
  base.campaign.bossClears = [...new Set(arr(campaign.bossClears))].filter((id) => !!eternalBoss(id));
  base.campaign.chapterClears = [...new Set(arr(campaign.chapterClears))].filter((id) => !!ETERNAL_CHAPTERS_BY_ID[id]);
  base.campaign.finalBoss = !!campaign.finalBoss || base.campaign.bossClears.includes('first_forgotten');
  base.campaign.deaths = Math.max(0, Math.floor(finite(campaign.deaths, 0)));
  base.campaign.runs = Math.max(0, Math.floor(finite(campaign.runs, 0)));
  base.campaign.bestTimeMs = Math.max(0, Math.floor(finite(campaign.bestTimeMs, 0)));

  const inv = src.investigations && typeof src.investigations === 'object' ? src.investigations : {};
  const generator = new InvestigationGenerator();
  base.investigations.generated = Array.isArray(inv.generated)
    ? inv.generated.filter((m) => generator.validate(m).ok).slice(-60)
    : [];
  base.investigations.completed = [...new Set(arr(inv.completed))].filter((id) => base.investigations.generated.some((m) => m.id === id) || !!INVESTIGATION_TEMPLATES.find((t) => id.includes(t.id)));
  base.investigations.activeCase = typeof inv.activeCase === 'string' ? inv.activeCase : null;
  base.investigations.claimed = arr(inv.claimed).slice(-200);

  const hunts = src.hunts && typeof src.hunts === 'object' ? src.hunts : {};
  base.hunts.config = sanitizeHuntConfig(hunts.config || {});
  base.hunts.history = Array.isArray(hunts.history) ? hunts.history.filter((h) => h && typeof h.id === 'string').slice(-30) : [];
  base.hunts.runs = Math.max(0, Math.floor(finite(hunts.runs, 0)));
  base.hunts.active = hunts.active && typeof hunts.active.id === 'string' ? hunts.active : null;

  const workshop = src.workshop && typeof src.workshop === 'object' ? src.workshop : {};
  for (const item of ETERNAL_EQUIPMENT) {
    base.workshop.tiers[item.id] = clamp(Math.round(finite(workshop.tiers?.[item.id], 1)), 1, 5);
  }
  base.workshop.loadout = arr(workshop.loadout).filter((id) => !!ETERNAL_EQUIPMENT_BY_ID[id]).slice(0, 6);
  if (!base.workshop.loadout.length) base.workshop.loadout = ['resonance_scanner', 'spirit_microphone', 'spectral_lens'];
  base.workshop.purchased = arr(workshop.purchased).slice(-200);

  const events = src.events && typeof src.events === 'object' ? src.events : {};
  base.events = new WorldEventDirector(events).toJSON();
  base.coop = new GhostResearchExpedition(src.coop || {}).toJSON();
  base.rankRewards = arr(src.rankRewards).filter((id) => INDEX_RANK_MILESTONES.some((m) => m.id === id));
  base.achievements = arr(src.achievements).filter((id) => ETERNAL_ACHIEVEMENTS.some((a) => a.id === id));
  base.perf = new EternalPerfMonitor(src.perf || {}).toJSON();
  for (const key of Object.keys(base.stats)) base.stats[key] = Math.max(0, finite(src.stats?.[key], 0));
  base.savedAt = Math.max(0, finite(src.savedAt, 0));
  return base;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------
export class EternalController {
  constructor(options = {}) {
    this.save = sanitizeEternalSave(options.save || {});
    this.veil = options.veil || null;
    this.settings = sanitizeEternalSettings(options.settings || {});
    this.events = new WorldEventDirector(this.save.events);
    this.expedition = new GhostResearchExpedition(this.save.coop);
    this.perf = new EternalPerfMonitor(this.save.perf);
    this.generator = new InvestigationGenerator();
    this.activeStage = null;
    this.activeBoss = null;
    this.activeHunt = this.save.hunts.active || null;
    this.clock = 0;
  }

  get level() {
    const veilLevel = this.veil?.progression?.level?.().level;
    if (Number.isFinite(veilLevel)) return veilLevel;
    return this.save.campaign.runs >= 1 ? Math.min(100, 1 + Math.floor(this.save.campaign.completedStages.length * 2)) : 1;
  }

  unlock() {
    this.save.campaign.unlocked = true;
    return this.save.campaign.unlocked;
  }

  startStage(stageId, options = {}) {
    const stage = eternalStage(stageId);
    if (!stage) return { ok: false, reason: 'unknown-stage' };
    if (!this.save.campaign.unlocked) return { ok: false, reason: 'arc-locked' };
    if (!eternalStageUnlocked(stageId, this.save.campaign)) return { ok: false, reason: 'locked' };
    this.activeStage = stage.id;
    this.activeBoss = null;
    this.save.campaign.runs += 1;
    this.veil?.sanity?.beginRun?.({ stage: true });
    return {
      ok: true, stage, room: eternalRoom(stage.id, options), enemies: eternalStageEnemies(stage.id, options),
    };
  }

  startBoss(bossId) {
    const boss = eternalBoss(bossId);
    if (!boss) return { ok: false, reason: 'unknown-boss' };
    if (!this.save.campaign.unlocked) return { ok: false, reason: 'arc-locked' };
    const unlocked = boss.final ? eternalFinalUnlocked(this.save.campaign) : eternalBossUnlocked(bossId, this.save.campaign);
    if (!unlocked) return { ok: false, reason: 'locked' };
    this.activeStage = null;
    this.activeBoss = bossId;
    this.veil?.sanity?.beginRun?.({ boss: true });
    return { ok: true, boss, room: eternalArena(bossId), spawn: eternalBossSpawn(bossId) };
  }

  completeStage(stageId, options = {}) {
    const stage = eternalStage(stageId);
    if (!stage) return { ok: false, reason: 'unknown-stage' };
    const first = !this.save.campaign.completedStages.includes(stage.id);
    if (first) this.save.campaign.completedStages.push(stage.id);
    let chapterCompleted = null;
    const chapter = ETERNAL_CHAPTERS_BY_ID[stage.chapter];
    const all = ETERNAL_STAGES.filter((s) => s.chapter === stage.chapter)
      .every((s) => this.save.campaign.completedStages.includes(s.id));
    if (all && chapter && !this.save.campaign.chapterClears.includes(chapter.id)) {
      this.save.campaign.chapterClears.push(chapter.id);
      chapterCompleted = chapter.id;
    }
    if (first) this.veil?.progression?.awardBundle(stage.reward, `eternal:stage:${stage.id}`);
    if (first) this.veil?.progression?.addMetric?.('stages', 1);
    if (options.clean) this.veil?.progression?.addMetric?.('cleanStages', 1);
    if (options.timeMs && (!this.save.campaign.bestTimeMs || options.timeMs < this.save.campaign.bestTimeMs)) {
      this.save.campaign.bestTimeMs = Math.round(options.timeMs);
    }
    this.activeStage = null;
    this.checkAchievements();
    return { ok: true, first, chapterCompleted, reward: first ? stage.reward : null };
  }

  defeatBoss(bossId, options = {}) {
    const boss = eternalBoss(bossId);
    if (!boss) return { ok: false, reason: 'unknown-boss' };
    const first = !this.save.campaign.bossClears.includes(bossId);
    if (first) this.save.campaign.bossClears.push(bossId);
    if (boss.final) this.save.campaign.finalBoss = true;
    if (first) this.veil?.progression?.awardBundle(boss.reward, `eternal:boss:${boss.id}`);
    if (first) this.veil?.progression?.addMetric?.('bosses', 1);
    if (options.timeMs && (!this.save.campaign.bestTimeMs || options.timeMs < this.save.campaign.bestTimeMs)) {
      this.save.campaign.bestTimeMs = Math.round(options.timeMs);
    }
    this.activeBoss = null;
    this.checkAchievements();
    return { ok: true, first, boss };
  }

  generateCase(options = {}) {
    const seed = String(options.seed || `case:${this.level}:${this.save.stats.generated + 1}`);
    const result = this.generator.generate(seed, this.level, options);
    if (result.ok) {
      if (!this.save.investigations.generated.some((m) => m.id === result.mission.id)) {
        this.save.investigations.generated.push(result.mission);
        while (this.save.investigations.generated.length > 60) this.save.investigations.generated.shift();
        this.save.stats.generated += 1;
      }
      this.save.investigations.activeCase = result.mission.id;
    }
    return result;
  }

  completeCase(caseId, result = {}) {
    const mission = this.save.investigations.generated.find((m) => m.id === caseId);
    if (!mission) return { ok: false, reason: 'unknown-case' };
    if (this.save.investigations.completed.includes(caseId)) return { ok: false, reason: 'duplicate' };
    const steps = new Set(result.steps || []);
    const complete = mission.steps.every((s) => steps.has(s)) && finite(result.evidence, 0) >= mission.evidenceGoal;
    if (!complete) return { ok: false, reason: 'incomplete', evidence: finite(result.evidence, 0), goal: mission.evidenceGoal };
    const tx = `eternal:case:${caseId}`;
    if (this.save.investigations.claimed.includes(tx)) return { ok: false, reason: 'duplicate' };
    const grant = this.veil?.progression?.awardBundle(mission.reward, tx);
    if (grant && !grant.ok) return { ok: false, reason: grant.reason };
    this.save.investigations.claimed.push(tx);
    this.save.investigations.completed.push(caseId);
    this.save.investigations.activeCase = null;
    this.save.stats.completedCases += 1;
    this.checkAchievements();
    return { ok: true, caseId, reward: mission.reward };
  }

  startHunt(config = {}) {
    const hunt = createHunt(config, this.level);
    this.activeHunt = hunt;
    this.save.hunts.active = hunt;
    this.save.hunts.config = hunt.config;
    this.save.hunts.runs += 1;
    return { ok: true, hunt, stage: eternalStage(hunt.stage), room: eternalRoom(hunt.stage), enemies: eternalStageEnemies(hunt.stage) };
  }

  completeHunt(result = {}) {
    const hunt = this.activeHunt;
    const completed = completeHunt(hunt, result);
    if (!completed.ok) return completed;
    const tx = `eternal:hunt:${hunt.id}`;
    if (!this.save.hunts.history.some((h) => h.id === hunt.id)) {
      this.save.hunts.history.push({
        id: hunt.id, variant: hunt.variant, entities: hunt.entities, duration: hunt.duration,
        antiJumpscare: hunt.antiJumpscare, completedAt: Date.now(),
      });
      while (this.save.hunts.history.length > 30) this.save.hunts.history.shift();
      this.save.stats.hunts += 1;
      this.veil?.progression?.awardBundle(hunt.reward, tx);
    }
    this.activeHunt = null;
    this.save.hunts.active = null;
    this.checkAchievements();
    return { ok: true, hunt, reward: hunt.reward };
  }

  upgradeEquipment(itemId) {
    const item = ETERNAL_EQUIPMENT_BY_ID[itemId];
    if (!item) return { ok: false, reason: 'unknown' };
    const current = clamp(Math.round(finite(this.save.workshop.tiers[itemId], 1)), 1, 5);
    if (current >= 5) return { ok: false, reason: 'maxed' };
    const cost = equipmentCost(itemId, current + 1);
    if (!cost) return { ok: false, reason: 'cost' };
    const progression = this.veil?.progression;
    if (!progression) return { ok: false, reason: 'no-progression' };
    if ((progression.currencies.spiritShards || 0) < cost.spiritShards) return { ok: false, reason: 'funds' };
    const tx = `eternal:equip:${itemId}:${current + 1}`;
    if (progression.hasTransaction(tx)) return { ok: false, reason: 'duplicate' };
    const paid = progression.award('spiritShards', -cost.spiritShards, tx);
    if (!paid.ok) return { ok: false, reason: paid.reason };
    if (cost.veilFragments) progression.award('veilFragments', -cost.veilFragments, `${tx}:fragments`);
    this.save.workshop.tiers[itemId] = current + 1;
    this.save.workshop.purchased.push(itemId);
    if (current + 1 >= 5) this.save.stats.masterworks += 1;
    this.checkAchievements();
    return { ok: true, tier: current + 1, cost, benefit: cost.benefit };
  }

  setLoadout(ids = []) {
    const loadout = arr(ids).filter((id) => !!ETERNAL_EQUIPMENT_BY_ID[id]).slice(0, 6);
    if (!loadout.length) return { ok: false, reason: 'empty' };
    this.save.workshop.loadout = loadout;
    return { ok: true, loadout: loadout.slice() };
  }

  eventSchedule(now = 0) { return this.events.schedule(now); }
  activateEvent(id, now = 0) {
    const result = this.events.activate(id, now);
    this.save.events = this.events.toJSON();
    return result;
  }
  contributeEvent(index) { return this.events.contribute(index); }
  completeEvent() {
    const result = this.events.complete(`eternal:event:${this.events.active?.id}`);
    if (result.ok) {
      this.veil?.progression?.awardBundle(result.reward, `eternal:event:${result.event.id}`);
      this.save.stats.events = this.events.completed.length;
      this.checkAchievements();
    }
    this.save.events = this.events.toJSON();
    return result;
  }

  createExpedition(options = {}) { const session = this.expedition.create(options); this.save.coop = this.expedition.toJSON(); return session; }
  joinExpedition(...args) { const result = this.expedition.join(...args); this.save.coop = this.expedition.toJSON(); return result; }
  reconnectExpedition(...args) { const result = this.expedition.reconnect(...args); this.save.coop = this.expedition.toJSON(); return result; }
  voteExpedition(...args) { return this.expedition.vote(...args); }
  completeExpeditionTask(...args) { const result = this.expedition.completeTask(...args); this.save.coop = this.expedition.toJSON(); return result; }
  completeExpedition(sessionId) {
    const result = this.expedition.complete(sessionId);
    if (result.ok) {
      this.veil?.progression?.awardBundle(result.reward, `eternal:expedition:${sessionId}`);
      this.save.stats.coopClears += 1;
      this.checkAchievements();
    }
    this.save.coop = this.expedition.toJSON();
    return result;
  }

  claimRankRewards() {
    const documented = this.veil?.index?.completion?.().documented || 0;
    const rank = clamp(1 + Math.floor(documented * 1.375), 1, INDEX_MAX_RANK);
    const granted = [];
    for (const milestone of INDEX_RANK_MILESTONES) {
      if (rank < milestone.rank || this.save.rankRewards.includes(milestone.id)) continue;
      this.save.rankRewards.push(milestone.id);
      this.veil?.progression?.awardBundle(milestone.reward, `eternal:rank:${milestone.rank}`);
      granted.push(milestone);
    }
    return granted;
  }

  checkAchievements(extra = {}) {
    const metrics = {
      runs: this.save.campaign.runs,
      chapterClears: this.save.campaign.chapterClears.length,
      finalBoss: this.save.campaign.finalBoss ? 1 : 0,
      hunts: this.save.stats.hunts,
      masterworks: this.save.stats.masterworks,
      events: this.save.events.completed.length,
      coopClears: this.save.stats.coopClears,
      documented: this.veil?.index?.completion?.().documented || 0,
      indexRank: this.veil ? clamp(1 + Math.floor((this.veil.index?.completion?.().documented || 0) * 1.375), 1, INDEX_MAX_RANK) : 1,
      ...extra,
    };
    const unlocked = [];
    for (const achievement of ETERNAL_ACHIEVEMENTS) {
      if (this.save.achievements.includes(achievement.id)) continue;
      if (finite(metrics[achievement.metric], 0) >= achievement.target) {
        this.save.achievements.push(achievement.id);
        unlocked.push(achievement);
      }
    }
    return unlocked;
  }

  dashboard() {
    const summary = eternalSummary(this.save);
    const index = this.veil?.index?.completion?.() || { documented: 0, total: GHOSTS.length, percent: 0 };
    const progression = this.veil?.progression?.snapshot?.() || { level: this.level, currencies: {}, indexRank: 1 };
    const equipmentRows = ETERNAL_EQUIPMENT.map((item) => ({
      id: item.id, name: item.name, category: item.category, tier: this.save.workshop.tiers[item.id] || 1, essential: item.essential,
    }));
    return {
      overview: {
        level: this.level, documented: index.documented, totalGhosts: index.total,
        investigations: this.save.stats.completedCases, chapters: summary.chapters, totalChapters: ETERNAL_CHAPTERS.length,
        bosses: summary.bosses, totalBosses: summary.totalBosses, prose: index.percent,
      },
      campaign: summary,
      index: { ...index, rank: clamp(1 + Math.floor(index.documented * 1.375), 1, INDEX_MAX_RANK), maxRank: INDEX_MAX_RANK },
      sanity: this.veil?.sanity?.snapshot?.() || null,
      investigations: { generated: this.save.investigations.generated.length, completed: this.save.investigations.completed.length, active: this.save.investigations.activeCase },
      equipment: equipmentRows,
      missions: this.save.events,
      achievements: { unlocked: this.save.achievements.length, total: ETERNAL_ACHIEVEMENTS.length, list: this.save.achievements.slice() },
      leaderboards: this.veil?.leaderboards?.toJSON?.() || { buckets: {} },
      multiplayer: { ...this.save.coop.stats, sessions: this.save.coop.sessions.length },
      settings: this.settings,
      rewards: this.save.rankRewards.slice(),
      currencies: progression.currencies,
    };
  }

  toJSON() {
    this.save.events = this.events.toJSON();
    this.save.coop = this.expedition.toJSON();
    this.save.perf = this.perf.toJSON();
    this.save.hunts.active = this.activeHunt;
    this.save.savedAt = Date.now();
    return this.save;
  }

  snapshot() {
    return {
      summary: eternalSummary(this.save),
      stage: this.activeStage,
      boss: this.activeBoss,
      hunt: this.activeHunt,
      achievements: this.save.achievements.slice(),
      indexRankRewards: this.save.rankRewards.slice(),
      dashboard: this.dashboard(),
    };
  }
}

export { ETERNAL_SAVE_KEY, ETERNAL_SAVE_VERSION, ETERNAL_TABS, ETERNAL_DEFAULTS, ETERNAL_SETTING_DEFINITIONS };
