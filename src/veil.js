// Update XIII — The Veil of the Forgotten: rules, save model and controller.
// Pure ES module: no DOM, no canvas, no audio. The shell owns presentation.
export * from './veil_data.js';
export * from './veil_ai.js';

import {
  VEIL_CHAPTERS, VEIL_CHAPTERS_BY_ID, VEIL_STAGES, VEIL_STAGES_BY_ID, VEIL_BOSSES, VEIL_BOSSES_BY_ID,
  VEIL_SAVE_KEY, VEIL_SAVE_VERSION, GHOSTS, GHOSTS_BY_ID, GHOST_RESEARCH_STAGES,
  SANITY_MAX, SANITY_DEFAULT, SANITY_CONDITIONS, sanityCondition, SANITY_ZONES, SANITY_EVENTS,
  SANITY_CONSUMABLES_BY_ID, TEMP_CONDITIONS, MIND_UPGRADES, MIND_UPGRADE_IDS, VEIL_CURRENCIES,
  CURRENCY_IDS, EVIDENCE_TYPE_IDS, VEIL_ACHIEVEMENTS, VEIL_DEFAULTS, VEIL_SETTING_DEFINITIONS,
  DAILY_MISSIONS, WEEKLY_MISSIONS, SPECIAL_CONTRACTS, SECRET_LOCATIONS, VEIL_COLLECTIBLES,
  LEADERBOARDS, DIFFICULTIES, INVESTIGATOR_MAX_LEVEL, INDEX_MAX_RANK, MASTERY_MAX,
  xpForInvestigatorLevel, VEIL_DIFFICULTY_SCALING, VEIL_FACILITIES, VEIL_NPCS,
} from './veil_data.js';
import { INDEX_RANK_MILESTONES } from './eternal_data.js';
import { GhostBrain, GhostEncounterDirector, GHOST_BEHAVIORS, makeGhost, VEIL_AI_DEFAULTS } from './veil_ai.js';

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const finite = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
const hash01 = (text) => {
  let h = 2166136261;
  const value = String(text);
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
};

export const VEIL_ROOM_START = 9400;
export const VEIL_WORLD = { width: 2400, floor: 600 };
export const VEIL_TITLE = 'THE VEIL OF THE FORGOTTEN';

export const VEIL_PERF = {
  perceptionHz: 6,
  pathBudgetPerFrame: 3,
  indexPageSize: 24,
  replicationHz: 8,
  manifestationPool: 12,
  fogDistance: 620,
  evidenceDistance: 420,
};

// ---------------------------------------------------------------------------
// Campaign helpers
// ---------------------------------------------------------------------------
export const veilStage = (id) => VEIL_STAGES_BY_ID[id] || null;
export const veilChapter = (id) => VEIL_CHAPTERS_BY_ID[id] || null;
export const veilBoss = (id) => VEIL_BOSSES_BY_ID[id] || null;

export function chapterClear(chapterId, progress = {}) {
  const boss = VEIL_CHAPTERS_BY_ID[chapterId]?.boss;
  if (chapterId === 'veil_citadel') return !!progress.finalBoss;
  return !!boss && (progress.bossClears || []).includes(boss);
}

export function chapterUnlocked(chapterId, progress = {}) {
  const chapter = VEIL_CHAPTERS_BY_ID[chapterId];
  if (!chapter) return false;
  if (chapter.index === 0) return true;
  const previous = VEIL_CHAPTERS[chapter.index - 1];
  return chapterClear(previous.id, progress);
}

export function stageUnlocked(stageId, progress = {}) {
  const stage = veilStage(stageId);
  if (!stage) return false;
  if (!chapterUnlocked(stage.chapter, progress)) return false;
  if (stage.localIndex === 0) return true;
  const previous = VEIL_STAGES[stage.index - 1];
  return (progress.completedStages || []).includes(previous?.id);
}

export function bossUnlocked(bossId, progress = {}) {
  const boss = veilBoss(bossId);
  if (!boss) return false;
  const chapter = VEIL_CHAPTERS_BY_ID[boss.chapterId];
  if (!chapter) return false;
  const required = VEIL_STAGES.filter((s) => s.chapter === chapter.id).slice(0, 5);
  return required.every((s) => (progress.completedStages || []).includes(s.id));
}

const chapterPlatforms = (chapterIndex, worldW, floorY) => {
  const base = [{ x: 0, y: floorY, w: worldW, h: 48 }];
  const ledges = [
    [{ x: 320, y: floorY - 120, w: 240, h: 18 }, { x: 760, y: floorY - 210, w: 210, h: 18 }, { x: 1280, y: floorY - 150, w: 260, h: 18 }],
    [{ x: 280, y: floorY - 160, w: 200, h: 18 }, { x: 620, y: floorY - 90, w: 280, h: 18 }, { x: 1160, y: floorY - 220, w: 190, h: 18 }],
    [{ x: 360, y: floorY - 90, w: 220, h: 18 }, { x: 700, y: floorY - 180, w: 250, h: 18 }, { x: 1240, y: floorY - 120, w: 240, h: 18 }],
    [{ x: 300, y: floorY - 140, w: 260, h: 18 }, { x: 780, y: floorY - 70, w: 200, h: 18 }, { x: 1320, y: floorY - 200, w: 220, h: 18 }],
    [{ x: 340, y: floorY - 190, w: 220, h: 18 }, { x: 740, y: floorY - 110, w: 280, h: 18 }, { x: 1200, y: floorY - 70, w: 260, h: 18 }],
    [{ x: 260, y: floorY - 110, w: 300, h: 18 }, { x: 720, y: floorY - 200, w: 220, h: 18 }, { x: 1300, y: floorY - 130, w: 240, h: 18 }],
  ];
  return [...base, ...(ledges[chapterIndex % ledges.length] || [])];
};

export function veilRoom(stageId, options = {}) {
  const stage = veilStage(stageId);
  if (!stage) return null;
  const chapter = VEIL_CHAPTERS_BY_ID[stage.chapter];
  const worldW = finite(options.worldW, VEIL_WORLD.width);
  const floorY = finite(options.floorY, VEIL_WORLD.floor);
  return {
    index: stage.room,
    name: stage.name,
    subtitle: `${chapter.name} · Tahap ${stage.number}`,
    zone: chapter.zone,
    palette: chapter.palette,
    spawn: { x: 120, y: floorY - 52 },
    platforms: chapterPlatforms(stage.chapterIndex, worldW, floorY),
    gates: [],
    merchant: null,
    checkpoint: stage.investigation ? { x: 180, name: 'Refuge Lapangan' } : null,
    veilStage: stage.id,
    veilChapter: stage.chapter,
    veilBoss: null,
    investigationSpot: stage.investigation ? { x: Math.round(worldW * 0.55), y: floorY - 60 } : null,
    secretSpot: stage.secret ? { x: Math.round(worldW * 0.82), y: floorY - 60 } : null,
    relic: null,
    ambient: chapter.zone,
  };
}

export function veilArena(bossId, options = {}) {
  const boss = veilBoss(bossId);
  if (!boss) return null;
  const worldW = finite(options.worldW, VEIL_WORLD.width);
  const floorY = finite(options.floorY, VEIL_WORLD.floor);
  const chapter = VEIL_CHAPTERS_BY_ID[boss.chapterId];
  return {
    index: VEIL_ROOM_START + 100 + VEIL_BOSSES.findIndex((b) => b.id === bossId),
    name: boss.name,
    subtitle: boss.title,
    zone: chapter.zone,
    palette: chapter.palette,
    spawn: { x: 110, y: floorY - 52 },
    platforms: [{ x: 0, y: floorY, w: worldW, h: 48 }, { x: 420, y: floorY - 120, w: 260, h: 18 }, { x: 980, y: floorY - 120, w: 260, h: 18 }],
    gates: [],
    merchant: null,
    checkpoint: { x: 110, name: 'Ambang Tabir' },
    veilBoss: bossId,
    veilStage: null,
  };
}

/** Exactly 20 enemies per standard stage: 19 normal + 1 guaranteed elite. */
export function veilStageEnemies(stageId, options = {}) {
  const stage = veilStage(stageId);
  if (!stage) return [];
  const worldW = finite(options.worldW, VEIL_WORLD.width);
  const eliteId = options.elite || stage.archetypes[0];
  const rows = [];
  for (let i = 0; i < 19; i += 1) {
    const type = stage.archetypes[i % stage.archetypes.length];
    rows.push({
      type,
      x: Math.round(260 + ((i * 97) % Math.max(200, worldW - 500))),
      minX: 120,
      maxX: worldW - 80,
      hpScale: 0.82 + stage.chapterIndex * 0.06,
      dmgScale: 0.8 + stage.chapterIndex * 0.07,
      name: null,
    });
  }
  rows.push({
    type: eliteId,
    x: Math.round(worldW * 0.72),
    minX: 120,
    maxX: worldW - 80,
    hpScale: 1.7 + stage.chapterIndex * 0.12,
    dmgScale: 1.25 + stage.chapterIndex * 0.08,
    elite: true,
    eliteRank: `E${Math.min(7, stage.chapterIndex + 1)}`,
  });
  return rows;
}

// ---------------------------------------------------------------------------
// Sanity 2.0
// ---------------------------------------------------------------------------
const sanityDefaults = () => ({
  enabled: VEIL_DEFAULTS['veil.sanity.enabled'],
  drainMultiplier: VEIL_DEFAULTS['veil.sanity.drainMultiplier'],
  recoveryMultiplier: VEIL_DEFAULTS['veil.sanity.recoveryMultiplier'],
  hudEnabled: VEIL_DEFAULTS['veil.sanity.hudEnabled'],
  warningThreshold: VEIL_DEFAULTS['veil.sanity.warningThreshold'],
  environmentalIntensity: VEIL_DEFAULTS['veil.sanity.environmentalIntensity'],
  cameraEffects: VEIL_DEFAULTS['veil.sanity.cameraEffects'],
  visualDistortion: VEIL_DEFAULTS['veil.sanity.visualDistortion'],
  unexpectedAudio: VEIL_DEFAULTS['veil.sanity.unexpectedAudio'],
  safeRoomStrength: VEIL_DEFAULTS['veil.sanity.safeRoomStrength'],
  temporaryConditions: VEIL_DEFAULTS['veil.sanity.temporaryConditions'],
  exposureEnabled: VEIL_DEFAULTS['veil.sanity.exposureEnabled'],
  exposureGain: VEIL_DEFAULTS['veil.sanity.exposureGain'],
  exposureDecay: VEIL_DEFAULTS['veil.sanity.exposureDecay'],
  focusRecovery: VEIL_DEFAULTS['veil.sanity.focusRecovery'],
});

export function sanitizeSanitySettings(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const n = (value, fallback, lo, hi) => clamp(finite(value, fallback), lo, hi);
  return {
    enabled: src.enabled !== false,
    drainMultiplier: n(src.drainMultiplier, 1, 0.2, 2),
    recoveryMultiplier: n(src.recoveryMultiplier, 1, 0.5, 3),
    hudEnabled: src.hudEnabled !== false,
    warningThreshold: n(src.warningThreshold, 30, 5, 60),
    environmentalIntensity: n(src.environmentalIntensity, 0.6, 0, 1),
    cameraEffects: src.cameraEffects !== false,
    visualDistortion: src.visualDistortion !== false,
    unexpectedAudio: src.unexpectedAudio !== false,
    safeRoomStrength: n(src.safeRoomStrength, 1, 0.5, 2),
    temporaryConditions: src.temporaryConditions !== false,
    exposureEnabled: src.exposureEnabled !== false,
    exposureGain: n(src.exposureGain, 1, 0, 2),
    exposureDecay: n(src.exposureDecay, 1, 0, 2),
    focusRecovery: n(src.focusRecovery, 1, 0.2, 2),
  };
}

export function mindBonuses(ranks = {}) {
  const out = { sanityDrain: 0, sanityRecovery: 0, indexXp: 0, evidenceRadius: 0, veilDamage: 0, attackCooldown: 0, ghostCalm: 0, missionReward: 0 };
  for (const upgrade of MIND_UPGRADES) {
    const rank = clamp(Math.round(finite(ranks[upgrade.id], 0)), 0, upgrade.maxRank);
    if (rank > 0) out[upgrade.effect] += upgrade.perRank * rank;
  }
  return {
    sanityDrain: clamp(1 - out.sanityDrain, 0.7, 1),
    sanityRecovery: 1 + out.sanityRecovery,
    indexXp: 1 + out.indexXp,
    evidenceRadius: 1 + out.evidenceRadius,
    veilDamage: clamp(1 + out.veilDamage, 0.6, 1),
    attackCooldown: clamp(1 + out.attackCooldown, 0.8, 1),
    ghostCalm: clamp(out.ghostCalm, 0, 0.4),
    missionReward: 1 + out.missionReward,
  };
}

export function spendMindPoint(state, upgradeId) {
  const upgrade = MIND_UPGRADES.find((u) => u.id === upgradeId);
  if (!upgrade) return { ok: false, reason: 'unknown' };
  const ranks = state.ranks || {};
  const current = clamp(Math.round(finite(ranks[upgradeId], 0)), 0, upgrade.maxRank);
  if (current >= upgrade.maxRank) return { ok: false, reason: 'maxed' };
  for (const requirement of upgrade.requires || []) {
    if (clamp(Math.round(finite(ranks[requirement], 0)), 0, 99) < 1) return { ok: false, reason: 'requires' };
  }
  const points = Math.max(0, Math.floor(finite(state.points, 0)));
  if (points < upgrade.cost) return { ok: false, reason: 'points' };
  state.points = points - upgrade.cost;
  state.ranks = { ...ranks, [upgradeId]: current + 1 };
  state.spent = Math.max(0, Math.floor(finite(state.spent, 0))) + upgrade.cost;
  return { ok: true, rank: current + 1, points: state.points };
}

export function respecMind(state) {
  const spent = Math.max(0, Math.floor(finite(state.spent, 0)));
  state.ranks = {};
  state.spent = 0;
  state.points = Math.max(0, Math.floor(finite(state.points, 0))) + spent;
  return { ok: true, refunded: spent, points: state.points };
}

export class SanityMeter {
  constructor(options = {}) {
    this.settings = sanitizeSanitySettings(options.settings || options);
    this.value = clamp(finite(options.value, SANITY_DEFAULT), 0, SANITY_MAX);
    // Sanity 3.0: exposure and focus are independent attributes. Exposure is
    // run-scoped; focus is a spendable investigation resource.
    this.exposure = clamp(finite(options.exposure, 0), 0, SANITY_MAX);
    this.focus = clamp(finite(options.focus, SANITY_MAX), 0, SANITY_MAX);
    this.zone = SANITY_ZONES[options.zone] ? options.zone : 'neutral';
    this.clock = 0;
    this.accumulator = 0;
    this.lastEvent = new Map();
    this.conditions = new Map();
    this.veilTouched = false;
    this.sources = { events: 0, zones: 0, consumables: 0 };
    this.mind = mindBonuses(options.mindRanks || {});
  }

  applyMind(ranks) {
    this.mind = mindBonuses(ranks || {});
    return this.mind;
  }

  get condition() { return sanityCondition(this.value); }
  get zoneDef() { return SANITY_ZONES[this.zone] || SANITY_ZONES.neutral; }
  get focusLabel() { return this.focus >= 70 ? 'Focused' : this.focus >= 35 ? 'Strained' : 'Depleted'; }

  /** Exposure never carries across unrelated sessions. */
  beginRun(context = {}) {
    this.exposure = 0;
    this.focus = SANITY_MAX;
    this.veilTouched = false;
    this.accumulator = 0;
    this.lastEvent.clear();
    if (context.boss) this.exposure = 8;
    return { exposure: this.exposure, focus: this.focus };
  }

  addExposure(amount, source = 'zone') {
    if (!this.settings.enabled || !this.settings.exposureEnabled) return this.exposure;
    const delta = Math.max(0, finite(amount)) * this.settings.exposureGain;
    this.exposure = clamp(this.exposure + delta, 0, SANITY_MAX);
    this.exposureSource = source;
    return this.exposure;
  }

  reduceExposure(amount) {
    const delta = Math.max(0, finite(amount)) * this.settings.exposureDecay;
    this.exposure = clamp(this.exposure - delta, 0, SANITY_MAX);
    return this.exposure;
  }

  /** Advanced clue analysis only; never blocks basic controls or objectives. */
  spendFocus(amount = 10) {
    const cost = Math.max(1, Math.round(finite(amount, 10)));
    if (this.focus < cost) return { ok: false, reason: 'focus', focus: this.focus };
    this.focus = clamp(this.focus - cost, 0, SANITY_MAX);
    return { ok: true, spent: cost, focus: this.focus };
  }

  recoverFocus(amount = 10) {
    const gain = Math.max(0, finite(amount)) * this.settings.focusRecovery;
    this.focus = clamp(this.focus + gain, 0, SANITY_MAX);
    return this.focus;
  }

  setValue(next) {
    const before = this.value;
    this.value = clamp(finite(next, this.value), 0, SANITY_MAX);
    if (before > 0 && this.value <= 0) this.veilTouched = true;
    if (this.value > 0 && before <= 0) this.veilTouched = false;
    return this.value;
  }

  setZone(id) {
    if (!SANITY_ZONES[id]) return this.zone;
    this.zone = id;
    return this.zone;
  }

  recoveryFactor() {
    const strength = this.zoneDef.kind === 'recovery' ? this.settings.safeRoomStrength : 1;
    return this.settings.recoveryMultiplier * this.mind.sanityRecovery * strength;
  }

  applyEvent(kind, options = {}) {
    const def = SANITY_EVENTS[kind];
    if (!def) return { ok: false, reason: 'unknown' };
    if (!this.settings.enabled) return { ok: false, reason: 'disabled' };
    const last = this.lastEvent.get(kind);
    const cooldown = Math.max(0, finite(options.cooldown, def.cooldown));
    if (last !== undefined && this.clock - last < cooldown) return { ok: false, reason: 'cooldown' };
    this.lastEvent.set(kind, this.clock);
    const scale = finite(options.scale, 1);
    const delta = def.delta * scale * (def.delta >= 0 ? this.recoveryFactor() : this.settings.drainMultiplier * this.mind.sanityDrain);
    this.setValue(this.value + delta);
    this.sources.events += 1;
    return { ok: true, delta, value: this.value, condition: this.condition };
  }

  recover(amount, source = 'recovery') {
    if (!this.settings.enabled) return this.value;
    const gain = Math.max(0, finite(amount)) * this.recoveryFactor();
    this.setValue(this.value + gain);
    this.sources[source] = (this.sources[source] || 0) + 1;
    return gain;
  }

  tick(dt) {
    const step = clamp(finite(dt), 0, 0.25);
    this.clock += step;
    this.tickConditions(step);
    if (!this.settings.enabled) return { value: this.value, condition: this.condition };
    this.accumulator += step;
    // Zone effects are event-driven at 4 Hz rather than per frame, so a long
    // frame can never double-charge sanity.
    if (this.accumulator < 0.25) return { value: this.value, condition: this.condition, batched: true };
    const slice = this.accumulator;
    this.accumulator = 0;
    const rate = finite(this.zoneDef.rate, 0);
    const scaled = rate < 0
      ? rate * this.settings.drainMultiplier * this.mind.sanityDrain * (this.zone === 'veil' ? this.mind.veilDamage : 1)
      : rate * this.settings.safeRoomStrength * this.mind.sanityRecovery;
    if (scaled !== 0) {
      this.setValue(this.value + scaled * slice);
      this.sources.zones += 1;
    }
    // Exposure rises only in designated supernatural zones and decays in
    // safe/neutral zones; focus recovers slowly in safe rooms.
    if (this.settings.exposureEnabled) {
      const zoneKind = this.zoneDef.kind;
      if (zoneKind === 'drain' && this.zone !== 'neutral') this.addExposure(0.55 * slice * (this.zone === 'veil' ? 1.4 : 1), 'zone');
      else this.reduceExposure(0.35 * slice);
    }
    if (this.zoneDef.kind === 'recovery') this.recoverFocus(3.5 * slice);
    return { value: this.value, condition: this.condition, veilTouched: this.veilTouched, exposure: this.exposure, focus: this.focus };
  }

  useConsumable(id, inventory = {}) {
    const item = SANITY_CONSUMABLES_BY_ID[id];
    if (!item) return { ok: false, reason: 'unknown' };
    if (!this.settings.enabled) return { ok: false, reason: 'disabled' };
    const owned = Math.max(0, Math.floor(finite(inventory[id], 0)));
    if (owned <= 0) return { ok: false, reason: 'empty' };
    const last = this.lastEvent.get(`item:${id}`);
    if (last !== undefined && this.clock - last < item.cooldown) return { ok: false, reason: 'cooldown' };
    this.lastEvent.set(`item:${id}`, this.clock);
    inventory[id] = owned - 1;
    this.recover(item.restore, 'consumables');
    if (item.clearsCondition) this.conditions.delete(item.clearsCondition);
    this.veilTouched = this.value <= 0;
    return { ok: true, value: this.value, consumed: id, remaining: inventory[id] };
  }

  addCondition(id, options = {}) {
    const def = TEMP_CONDITIONS.find((c) => c.id === id);
    if (!def) return { ok: false, reason: 'unknown' };
    if (!this.settings.temporaryConditions) return { ok: false, reason: 'disabled' };
    const current = this.conditions.get(id);
    const stacks = current ? current.stacks + 1 : 1;
    if (!def.stack && current) return { ok: false, reason: 'already' };
    const maxStacks = def.stack ? def.maxStacks || 1 : 1;
    if (stacks > maxStacks) return { ok: false, reason: 'max-stacks' };
    this.conditions.set(id, { stacks, ttl: finite(options.duration, def.duration) });
    return { ok: true, stacks };
  }

  tickConditions(dt) {
    for (const [id, entry] of this.conditions) {
      entry.ttl -= dt;
      if (entry.ttl <= 0) this.conditions.delete(id);
    }
  }

  clearedConditions(ids = []) {
    let changed = false;
    for (const id of ids) if (this.conditions.delete(id)) changed = true;
    return changed;
  }

  /** Never kills and never removes control: at zero it opens a recovery path. */
  rescue() {
    if (!this.settings.enabled || !this.veilTouched) return null;
    this.setValue(Math.max(this.value, 24));
    this.veilTouched = false;
    return { kind: 'veil_anchor', recoveredTo: this.value, nonLethal: true };
  }

  snapshot() {
    return {
      value: Math.round(this.value * 10) / 10,
      condition: this.condition.id,
      label: this.condition.label,
      zone: this.zone,
      conditions: [...this.conditions.keys()],
      veilTouched: this.veilTouched,
      enabled: this.settings.enabled,
      exposure: Math.round(this.exposure * 10) / 10,
      exposureBand: this.exposure >= 75 ? 'saturated' : this.exposure >= 40 ? 'exposed' : 'contained',
      focus: Math.round(this.focus * 10) / 10,
      focusLabel: this.focusLabel,
    };
  }
}

// ---------------------------------------------------------------------------
// Ghost Index 2.0
// ---------------------------------------------------------------------------
const stageIndex = (stage) => {
  const i = GHOST_RESEARCH_STAGES.indexOf(stage);
  return i < 0 ? 0 : i;
};
const laterStage = (a, b) => (stageIndex(a) >= stageIndex(b) ? a : b);

export class GhostIndex {
  constructor(raw = {}) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const records = src.records && typeof src.records === 'object' ? src.records : {};
    this.records = {};
    for (const ghost of GHOSTS) {
      const entry = records[ghost.id];
      if (!entry || typeof entry !== 'object') continue;
      const evidence = [...new Set((Array.isArray(entry.evidence) ? entry.evidence : []).filter((e) => EVIDENCE_TYPE_IDS.includes(e)))];
      this.records[ghost.id] = {
        stage: GHOST_RESEARCH_STAGES.includes(entry.stage) ? entry.stage : 'rumored',
        firstSeen: Math.max(0, finite(entry.firstSeen, 0)),
        evidence,
        lore: clamp(Math.round(finite(entry.lore, 0)), 0, 4),
        favorite: !!entry.favorite,
        rare: !!entry.rare,
        encounters: Math.max(0, Math.floor(finite(entry.encounters, 0))),
        notes: typeof entry.notes === 'string' ? entry.notes.slice(0, 480) : '',
        documentedAt: Math.max(0, finite(entry.documentedAt, 0)),
      };
    }
    this.claimed = Array.isArray(src.claimed) ? src.claimed.filter((id) => typeof id === 'string').slice(0, 64) : [];
    this.completed = 0;
    for (const entry of Object.values(this.records)) if (entry.stage !== 'rumored') this.completed += 1;
  }

  get(id) { return this.records[id] || null; }
  stageOf(id) { return this.records[id]?.stage || 'rumored'; }
  record(id) {
    if (!this.records[id]) this.records[id] = { stage: 'rumored', firstSeen: 0, evidence: [], lore: 0, favorite: false, rare: false, encounters: 0, notes: '', documentedAt: 0 };
    return this.records[id];
  }

  discover(id, clock = 0) {
    const ghost = GHOSTS_BY_ID[id];
    if (!ghost) return { ok: false, reason: 'unknown' };
    const entry = this.record(id);
    const first = !entry.encounters;
    entry.encounters += 1;
    entry.stage = laterStage(entry.stage, 'encountered');
    if (first) entry.firstSeen = Math.max(0, finite(clock));
    return { ok: true, first, stage: entry.stage, ghost };
  }

  identify(id) {
    const entry = this.get(id);
    if (!entry || stageIndex(entry.stage) < stageIndex('encountered')) return { ok: false, reason: 'not-encountered' };
    entry.stage = laterStage(entry.stage, 'identified');
    return { ok: true, stage: entry.stage };
  }

  addEvidence(id, type) {
    const ghost = GHOSTS_BY_ID[id];
    const entry = this.get(id);
    if (!ghost || !entry) return { ok: false, reason: 'unknown' };
    if (!ghost.evidence.includes(type)) return { ok: false, reason: 'wrong-evidence' };
    if (stageIndex(entry.stage) < stageIndex('encountered')) return { ok: false, reason: 'not-encountered' };
    if (entry.evidence.includes(type)) return { ok: false, reason: 'duplicate', evidence: entry.evidence.length };
    entry.evidence.push(type);
    entry.stage = laterStage(entry.stage, 'investigated');
    return { ok: true, evidence: entry.evidence.length, required: ghost.requiredEvidence.length, stage: entry.stage };
  }

  addLore(id, amount = 1) {
    const entry = this.record(id);
    if (!GHOSTS_BY_ID[id]) return { ok: false, reason: 'unknown' };
    const before = entry.lore;
    entry.lore = clamp(entry.lore + Math.max(0, Math.round(finite(amount, 1))), 0, 4);
    return { ok: entry.lore > before, lore: entry.lore };
  }

  hasAllEvidence(id) {
    const ghost = GHOSTS_BY_ID[id];
    const entry = this.get(id);
    if (!ghost || !entry) return false;
    return ghost.requiredEvidence.every((type) => entry.evidence.includes(type));
  }

  document(id) {
    const entry = this.get(id);
    if (!entry) return { ok: false, reason: 'unknown' };
    if (!this.hasAllEvidence(id)) return { ok: false, reason: 'missing-evidence' };
    entry.stage = laterStage(entry.stage, 'documented');
    entry.documentedAt = Math.max(entry.documentedAt, 1);
    return { ok: true, stage: entry.stage, ghost: GHOSTS_BY_ID[id] };
  }

  master(id) {
    const entry = this.get(id);
    if (!entry) return { ok: false, reason: 'unknown' };
    if (stageIndex(entry.stage) < stageIndex('documented')) return { ok: false, reason: 'not-documented' };
    entry.stage = 'mastered';
    return { ok: true, stage: entry.stage };
  }

  toggleFavorite(id) {
    const entry = this.record(id);
    entry.favorite = !entry.favorite;
    return entry.favorite;
  }

  markRare(id) {
    const entry = this.record(id);
    entry.rare = true;
    return entry.rare;
  }

  counts() {
    const out = { standard: 0, secret: 0, documentedStandard: 0, documentedSecret: 0, mastered: 0, encountered: 0, total: GHOSTS.length };
    for (const ghost of GHOSTS) {
      const entry = this.records[ghost.id];
      const stage = entry ? stageIndex(entry.stage) : 0;
      if (ghost.secret) { out.secret += 1; if (stage >= stageIndex('documented')) out.documentedSecret += 1; }
      else { out.standard += 1; if (stage >= stageIndex('documented')) out.documentedStandard += 1; }
      if (stage >= stageIndex('encountered')) out.encountered += 1;
      if (stage >= stageIndex('mastered')) out.mastered += 1;
    }
    return out;
  }

  completion() {
    const counts = this.counts();
    const documented = counts.documentedStandard + counts.documentedSecret;
    return {
      ...counts,
      documented,
      percent: Math.round((documented / Math.max(1, counts.total)) * 1000) / 10,
      standardPercent: Math.round((counts.documentedStandard / Math.max(1, counts.standard)) * 1000) / 10,
    };
  }

  query(options = {}) {
    const search = String(options.search || '').trim().toLowerCase();
    const classification = options.classification && options.classification !== 'all' ? options.classification : null;
    const chapter = options.chapter && options.chapter !== 'all' ? options.chapter : null;
    const rarity = options.rarity && options.rarity !== 'all' ? options.rarity : null;
    const research = options.research && options.research !== 'all' ? options.research : null;
    const spoilers = !!options.spoilers;
    let rows = GHOSTS.filter((ghost) => {
      if (classification && ghost.classification !== classification) return false;
      if (chapter && ghost.chapter !== chapter) return false;
      if (rarity && ghost.rarity !== rarity) return false;
      const entry = this.records[ghost.id];
      const stage = entry?.stage || 'rumored';
      if (research && stage !== research) return false;
      if (search && !`${ghost.name} ${ghost.location} ${ghost.behavior}`.toLowerCase().includes(search)) return false;
      return true;
    });
    const sort = options.sort || 'chapter';
    const rarityRank = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythic: 5, unknown: 6 };
    rows = rows.slice().sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'rarity') return (rarityRank[b.rarity] ?? 0) - (rarityRank[a.rarity] ?? 0);
      if (sort === 'research') return stageIndex(this.stageOf(b.id)) - stageIndex(this.stageOf(a.id));
      return a.chapter.localeCompare(b.chapter) || a.name.localeCompare(b.name);
    });
    rows = rows.map((ghost) => {
      const entry = this.records[ghost.id];
      const stage = entry?.stage || 'rumored';
      const known = stage !== 'rumored';
      return {
        id: ghost.id,
        name: known || spoilers ? ghost.name : '???',
        classification: ghost.classification,
        chapter: ghost.chapter,
        rarity: ghost.rarity,
        secret: ghost.secret,
        stage,
        evidence: entry ? entry.evidence.length : 0,
        required: ghost.requiredEvidence.length,
        lore: entry ? entry.lore : 0,
        favorite: !!entry?.favorite,
        silhouette: !known,
        location: known || spoilers ? ghost.location : 'Tidak diketahui',
        subclassification: ghost.subclassification,
        threat: ghost.threat,
        sanityInfluence: ghost.sanityInfluence,
        preferredEnvironment: ghost.preferredEnvironment,
        activeConditions: ghost.activeConditions.slice(),
        behaviorProfile: ghost.behaviorProfile,
        abilities: ghost.abilities.slice(),
        weaknesses: ghost.weaknesses.slice(),
        variants: ghost.variants.slice(),
        masteryChallenges: ghost.masteryChallenges.slice(),
        loreCollection: entry ? entry.lore : 0,
      };
    });
    return paginate(rows, options.page || 1, clamp(Math.round(finite(options.pageSize, VEIL_PERF.indexPageSize)), 6, 60));
  }

  rewards() {
    const counts = this.counts();
    const out = [];
    if (counts.documentedStandard >= 10 && !this.claimed.includes('index_ten')) out.push({ id: 'index_ten', reward: { veilFragments: 10 } });
    if (counts.documentedStandard >= 30 && !this.claimed.includes('index_thirty')) out.push({ id: 'index_thirty', reward: { ancientSeals: 1 } });
    if (counts.documentedStandard >= 36 && !this.claimed.includes('index_complete')) out.push({ id: 'index_complete', reward: { ancientSeals: 2, veilFragments: 40 } });
    if (counts.documentedSecret >= 6 && !this.claimed.includes('secret_hunter')) out.push({ id: 'secret_hunter', reward: { ancientSeals: 3 } });
    const rank = indexRank(counts.documentedStandard + counts.documentedSecret);
    for (const milestone of INDEX_RANK_MILESTONES) {
      if (rank >= milestone.rank && !this.claimed.includes(milestone.id)) out.push({ id: milestone.id, reward: milestone.reward, rank: milestone.rank });
    }
    return out;
  }

  claim(id) {
    if (this.claimed.includes(id)) return { ok: false, reason: 'duplicate' };
    this.claimed.push(id);
    return { ok: true, id };
  }

  toJSON() {
    return { records: this.records, claimed: this.claimed.slice() };
  }
}

// ---------------------------------------------------------------------------
// Investigation and missions
// ---------------------------------------------------------------------------
export const INVESTIGATION_CASES = VEIL_CHAPTERS.flatMap((chapterDef) => [1, 2].map((n) => ({
  id: `${chapterDef.id}_case_${n}`,
  name: `${chapterDef.name} · Kasus ${n}`,
  chapter: chapterDef.id,
  stage: `${chapterDef.id}_${n === 1 ? 3 : 5}`,
  steps: ['detect', 'identify', 'record', 'analyze', 'document'],
  evidenceGoal: 3 + n,
  ghostPool: GHOSTS.filter((g) => g.chapter === chapterDef.id && !g.secret).map((g) => g.id),
  reward: { spiritShards: 140 + n * 60, veilFragments: 8 + n * 4, investigationMarks: 2 },
  description: `Selidiki rangkaian kejadian di ${chapterDef.name} dan tutup berkas sebelum tabir menebal.`,
})));
export const CASE_IDS = INVESTIGATION_CASES.map((c) => c.id);
export const caseById = (id) => INVESTIGATION_CASES.find((c) => c.id === id) || null;

export function missionProgress(mission, stats = {}) {
  const target = Math.max(1, finite(mission?.target, 1));
  const current = clamp(finite(stats?.[mission?.metric], 0), 0, target);
  return { current, target, complete: current >= target, percent: Math.round((current / target) * 100) };
}

export function rollMissions(seed, library, count) {
  return [...library]
    .map((mission) => ({ mission, order: hash01(`${seed}:${mission.id}`) }))
    .sort((a, b) => a.order - b.order)
    .slice(0, count)
    .map((row) => row.mission);
}
export const dailyRotation = (dateKey) => rollMissions(`daily:${dateKey}`, DAILY_MISSIONS, 3);
export const weeklyRotation = (weekKey) => rollMissions(`weekly:${weekKey}`, WEEKLY_MISSIONS, 2);

export function resolveInvestigation(caseDef, result = {}, progression = null) {
  if (!caseDef) return { ok: false, reason: 'unknown-case' };
  const steps = new Set(result.steps || []);
  const complete = caseDef.steps.every((step) => steps.has(step)) && finite(result.evidence, 0) >= caseDef.evidenceGoal;
  if (!complete) return { ok: false, reason: 'incomplete', evidence: finite(result.evidence, 0), goal: caseDef.evidenceGoal };
  const tx = `case:${caseDef.id}`;
  if (progression) {
    const grant = progression.awardBundle(caseDef.reward, tx);
    if (!grant.ok) return { ok: false, reason: grant.reason, duplicate: grant.reason === 'duplicate' };
    progression.addMetric('cases', 1);
  }
  return { ok: true, caseId: caseDef.id, reward: caseDef.reward, peaceful: !!result.peaceful };
}

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------
const emptyMetrics = () => ({
  encounters: 0, documented: 0, standardDocumented: 0, secrets: 0, mastered: 0, chapterClears: 0,
  finalBoss: 0, cleanStages: 0, cases: 0, safeClears: 0, collectibles: 0, secretsFound: 0,
  stages: 0, bosses: 0, cleanSanityStages: 0, photos: 0, audio: 0, evidence: 0, hauntedTime: 0, grounding: 0,
});

export function investigatorLevelFromXp(xp) {
  let level = 1;
  let remaining = Math.max(0, finite(xp, 0));
  while (level < INVESTIGATOR_MAX_LEVEL && remaining >= xpForInvestigatorLevel(level)) {
    remaining -= xpForInvestigatorLevel(level);
    level += 1;
  }
  return { level, xp: Math.max(0, finite(xp, 0)), next: level >= INVESTIGATOR_MAX_LEVEL ? 0 : xpForInvestigatorLevel(level) };
}
// 72 documented records map to rank 100 with the Update XIV curve.
export const indexRank = (documented) => clamp(1 + Math.floor(Math.max(0, finite(documented)) * 1.375), 1, INDEX_MAX_RANK);
export const masteryRank = (cases) => clamp(1 + Math.floor(Math.max(0, finite(cases)) * 2.4), 1, MASTERY_MAX);

export class VeilProgression {
  constructor(raw = {}) {
    const src = raw && typeof raw === 'object' ? raw : {};
    this.currencies = {};
    for (const currency of VEIL_CURRENCIES) {
      this.currencies[currency.id] = clamp(Math.floor(finite(src.currencies?.[currency.id], 0)), 0, currency.cap);
    }
    this.xp = Math.max(0, finite(src.xp, 0));
    this.metrics = { ...emptyMetrics(), ...(src.metrics && typeof src.metrics === 'object' ? src.metrics : {}) };
    for (const key of Object.keys(this.metrics)) this.metrics[key] = Math.max(0, finite(this.metrics[key], 0));
    this.transactions = Array.isArray(src.transactions) ? src.transactions.filter((t) => typeof t === 'string').slice(-600) : [];
    this.achievements = Array.isArray(src.achievements) ? src.achievements.filter((id) => VEIL_ACHIEVEMENTS.some((a) => a.id === id)) : [];
    this.rewards = Array.isArray(src.rewards) ? src.rewards.filter((id) => typeof id === 'string') : [];
    this.mind = {
      points: Math.max(0, Math.floor(finite(src.mind?.points, 0))),
      spent: Math.max(0, Math.floor(finite(src.mind?.spent, 0))),
      ranks: src.mind?.ranks && typeof src.mind.ranks === 'object' ? { ...src.mind.ranks } : {},
      awarded: Math.max(0, Math.floor(finite(src.mind?.awarded, 0))),
    };
  }

  hasTransaction(txId) { return !!txId && this.transactions.includes(txId); }

  award(currency, amount, txId = null) {
    if (!CURRENCY_IDS.includes(currency)) return { ok: false, reason: 'unknown-currency' };
    if (txId && this.hasTransaction(txId)) return { ok: false, reason: 'duplicate' };
    const delta = Math.round(finite(amount));
    if (!delta) return { ok: false, reason: 'zero' };
    const cap = VEIL_CURRENCIES.find((c) => c.id === currency).cap;
    const before = this.currencies[currency];
    this.currencies[currency] = clamp(before + delta, 0, cap);
    if (txId) {
      this.transactions.push(txId);
      while (this.transactions.length > 600) this.transactions.shift();
    }
    return { ok: true, currency, delta: this.currencies[currency] - before, total: this.currencies[currency] };
  }

  awardBundle(bundle = {}, txId = null) {
    if (txId && this.hasTransaction(txId)) return { ok: false, reason: 'duplicate' };
    const results = [];
    for (const [key, value] of Object.entries(bundle || {})) {
      if (key === 'indexXp') continue;
      if (!CURRENCY_IDS.includes(key)) continue;
      const grant = this.award(key, value, null);
      if (grant.ok) results.push(grant);
    }
    if (finite(bundle?.indexXp, 0) > 0) this.xp += Math.round(bundle.indexXp);
    if (txId) {
      this.transactions.push(txId);
      while (this.transactions.length > 600) this.transactions.shift();
    }
    return { ok: true, results, txId: txId || null };
  }

  addMetric(key, amount = 1) {
    if (!(key in this.metrics)) return 0;
    this.metrics[key] = Math.max(0, this.metrics[key] + finite(amount));
    return this.metrics[key];
  }

  awardMindPoints(amount = 1) {
    const points = Math.max(0, Math.round(finite(amount, 1)));
    this.mind.points += points;
    this.mind.awarded += points;
    return this.mind.points;
  }

  spendMind(upgradeId) {
    const result = spendMindPoint(this.mind, upgradeId);
    return result;
  }

  respec() { return respecMind(this.mind); }

  checkAchievements(extra = {}) {
    const metrics = { ...this.metrics, ...extra };
    const unlocked = [];
    for (const achievement of VEIL_ACHIEVEMENTS) {
      if (this.achievements.includes(achievement.id)) continue;
      if (finite(metrics[achievement.metric], 0) >= achievement.target) {
        this.achievements.push(achievement.id);
        this.awardBundle(achievement.reward, `achievement:${achievement.id}`);
        unlocked.push(achievement);
        const linked = VEIL_REWARD_LINKS[achievement.id];
        if (linked && !this.rewards.includes(linked)) this.rewards.push(linked);
      }
    }
    return unlocked;
  }

  level() { return investigatorLevelFromXp(this.xp); }

  snapshot() {
    return {
      currencies: { ...this.currencies },
      xp: this.xp,
      level: this.level().level,
      metrics: { ...this.metrics },
      achievements: this.achievements.slice(),
      mind: { points: this.mind.points, spent: this.mind.spent, ranks: { ...this.mind.ranks } },
      indexRank: indexRank(this.metrics.documented),
      mastery: masteryRank(this.metrics.cases),
    };
  }

  toJSON() {
    return {
      currencies: this.currencies, xp: this.xp, metrics: this.metrics, transactions: this.transactions.slice(),
      achievements: this.achievements.slice(), rewards: this.rewards.slice(),
      mind: { points: this.mind.points, spent: this.mind.spent, ranks: this.mind.ranks, awarded: this.mind.awarded },
    };
  }
}

const VEIL_REWARD_LINKS = {
  first_contact: 'title_witness',
  index_ten: 'relic_lantern',
  chapter_all: 'relic_lens',
  case_closed: 'outfit_field',
  architect_down: 'outfit_veil',
  index_complete: 'title_archivist',
};

// ---------------------------------------------------------------------------
// Leaderboards (separate difficulty buckets, server-validated only)
// ---------------------------------------------------------------------------
export function sanitizeSubmission(raw = {}, boardId = null) {
  const board = LEADERBOARDS.find((b) => b.id === (boardId || raw.boardId));
  if (!board) return { ok: false, reason: 'unknown-board' };
  const difficulty = DIFFICULTIES.includes(raw.difficulty) ? raw.difficulty : 'normal';
  const metric = finite(raw[board.metric], NaN);
  if (!Number.isFinite(metric) || metric < 0) return { ok: false, reason: 'invalid-metric' };
  if (board.metric === 'timeMs' && metric <= 0) return { ok: false, reason: 'invalid-metric' };
  if (!raw.submissionId || typeof raw.submissionId !== 'string') return { ok: false, reason: 'missing-submission' };
  const submittedAt = finite(raw.submittedAt, 0);
  if (submittedAt > Date.now() + 5 * 60 * 1000) return { ok: false, reason: 'future-timestamp' };
  return {
    ok: true,
    entry: {
      boardId: board.id, difficulty, submissionId: raw.submissionId.slice(0, 96),
      metric: Math.round(metric), player: String(raw.player || 'Penyidik').slice(0, 32),
      stage: Math.max(0, Math.floor(finite(raw.stage, 0))), submittedAt,
      verified: raw.serverValidated === true,
    },
  };
}

export function rankLeaderboard(entries = [], boardId, difficulty = 'normal') {
  const board = LEADERBOARDS.find((b) => b.id === boardId);
  if (!board) return [];
  const dir = board.direction === 'asc' ? 1 : -1;
  return entries
    .filter((e) => e && e.boardId === boardId && e.difficulty === difficulty && Number.isFinite(e.metric))
    .sort((a, b) => (a.metric - b.metric) * dir || a.player.localeCompare(b.player))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export class VeilLeaderboards {
  constructor(raw = {}) {
    this.buckets = {};
    this.seen = new Set(Array.isArray(raw.seen) ? raw.seen : []);
    for (const [key, rows] of Object.entries(raw.buckets || {})) {
      if (Array.isArray(rows)) this.buckets[key] = rows.slice(0, 100);
    }
  }

  key(boardId, difficulty) { return `${boardId}:${difficulty}`; }

  submit(raw = {}) {
    const check = sanitizeSubmission(raw);
    if (!check.ok) return check;
    if (!check.entry.verified) return { ok: false, reason: 'unverified' };
    if (this.seen.has(check.entry.submissionId)) return { ok: false, reason: 'duplicate' };
    this.seen.add(check.entry.submissionId);
    const key = this.key(check.entry.boardId, check.entry.difficulty);
    const rows = this.buckets[key] || [];
    rows.push(check.entry);
    this.buckets[key] = rankLeaderboard(rows, check.entry.boardId, check.entry.difficulty).slice(0, 100);
    return { ok: true, rank: this.buckets[key].find((e) => e.submissionId === check.entry.submissionId)?.rank || null };
  }

  board(boardId, difficulty = 'normal') {
    return rankLeaderboard(this.buckets[this.key(boardId, difficulty)] || [], boardId, difficulty);
  }

  toJSON() { return { buckets: this.buckets, seen: [...this.seen] }; }
}

// ---------------------------------------------------------------------------
// Save model
// ---------------------------------------------------------------------------
export function defaultVeilSave() {
  return {
    schemaVersion: VEIL_SAVE_VERSION,
    savedAt: 0,
    campaign: { completedStages: [], bossClears: [], chapterClears: [], finalBoss: false, deaths: 0, runs: 0, bestTimeMs: 0 },
    sanity: { value: SANITY_DEFAULT, exposure: 0, focus: SANITY_MAX, settings: sanityDefaults(), zone: 'neutral' },
    ghostIndex: { records: {}, claimed: [] },
    investigation: { completedCases: [], activeCase: null, missionProgress: {}, claimedMissions: [], contracts: [] },
    equipment: { owned: ['spectral_detector', 'spirit_camera', 'investigator_journal'], mastery: {}, loadout: ['spectral_detector', 'spirit_camera', 'investigator_journal'] },
    progression: new VeilProgression().toJSON(),
    leaderboards: { buckets: {}, seen: [] },
    secrets: [],
    collectibles: {},
    hub: { facilities: Object.fromEntries(VEIL_FACILITIES.map((f) => [f.id, true])), visited: [] },
    preferences: { antiJumpscare: false, difficulty: 'normal', graphicsPreset: 'high' },
    flags: { 'item:breathing_tonic': 3, 'item:warm_tea': 5, 'item:veil_anchor': 1 },
  };
}

export function sanitizeVeilSave(raw = {}) {
  const base = defaultVeilSave();
  const src = raw && typeof raw === 'object' ? raw : {};
  const arr = (value) => (Array.isArray(value) ? value.filter((v) => typeof v === 'string') : []);
  const campaign = src.campaign && typeof src.campaign === 'object' ? src.campaign : {};
  base.campaign.completedStages = [...new Set(arr(campaign.completedStages))].filter((id) => !!veilStage(id));
  base.campaign.bossClears = [...new Set(arr(campaign.bossClears))].filter((id) => !!veilBoss(id));
  base.campaign.chapterClears = [...new Set(arr(campaign.chapterClears))].filter((id) => !!VEIL_CHAPTERS_BY_ID[id]);
  base.campaign.finalBoss = !!campaign.finalBoss || base.campaign.bossClears.includes('veil_architect');
  base.campaign.deaths = Math.max(0, Math.floor(finite(campaign.deaths, 0)));
  base.campaign.runs = Math.max(0, Math.floor(finite(campaign.runs, 0)));
  base.campaign.bestTimeMs = Math.max(0, Math.floor(finite(campaign.bestTimeMs, 0)));

  const sanity = src.sanity && typeof src.sanity === 'object' ? src.sanity : {};
  base.sanity.settings = sanitizeSanitySettings(sanity.settings || {});
  base.sanity.value = clamp(finite(sanity.value, SANITY_DEFAULT), 0, SANITY_MAX);
  base.sanity.exposure = clamp(finite(sanity.exposure, 0), 0, SANITY_MAX);
  base.sanity.focus = clamp(finite(sanity.focus, SANITY_MAX), 0, SANITY_MAX);
  base.sanity.zone = SANITY_ZONES[sanity.zone] ? sanity.zone : 'neutral';

  const indexSource = src.ghostIndex && typeof src.ghostIndex === 'object' ? src.ghostIndex : {};
  base.ghostIndex = new GhostIndex(indexSource).toJSON();

  const investigation = src.investigation && typeof src.investigation === 'object' ? src.investigation : {};
  base.investigation.completedCases = [...new Set(arr(investigation.completedCases))].filter((id) => !!caseById(id));
  base.investigation.activeCase = caseById(investigation.activeCase) ? investigation.activeCase : null;
  base.investigation.claimedMissions = [...new Set(arr(investigation.claimedMissions))];
  base.investigation.contracts = [...new Set(arr(investigation.contracts))];
  if (investigation.missionProgress && typeof investigation.missionProgress === 'object') {
    for (const [id, value] of Object.entries(investigation.missionProgress)) {
      if (typeof id === 'string') base.investigation.missionProgress[id] = clamp(finite(value, 0), 0, 9999);
    }
  }

  const equipment = src.equipment && typeof src.equipment === 'object' ? src.equipment : {};
  const knownTools = ['spectral_detector', 'spirit_camera', 'echo_recorder', 'veil_lens', 'investigator_journal'];
  base.equipment.owned = [...new Set([...base.equipment.owned, ...arr(equipment.owned)])].filter((id) => knownTools.includes(id));
  base.equipment.loadout = arr(equipment.loadout).filter((id) => base.equipment.owned.includes(id)).slice(0, 3);
  if (base.equipment.loadout.length === 0) base.equipment.loadout = base.equipment.owned.slice(0, 3);
  if (equipment.mastery && typeof equipment.mastery === 'object') {
    for (const [id, value] of Object.entries(equipment.mastery)) {
      if (knownTools.includes(id)) base.equipment.mastery[id] = clamp(Math.floor(finite(value, 0)), 0, 5);
    }
  }

  base.progression = new VeilProgression(src.progression || {}).toJSON();
  base.leaderboards = new VeilLeaderboards(src.leaderboards || {}).toJSON();
  base.secrets = [...new Set(arr(src.secrets))].filter((id) => SECRET_LOCATIONS.some((s) => s.id === id));
  if (src.collectibles && typeof src.collectibles === 'object') {
    for (const [id, value] of Object.entries(src.collectibles)) {
      if (VEIL_COLLECTIBLES.some((c) => c.id === id)) base.collectibles[id] = clamp(Math.floor(finite(value, 0)), 0, 999);
    }
  }
  if (src.hub && typeof src.hub === 'object') {
    for (const facility of VEIL_FACILITIES) {
      if (typeof src.hub.facilities?.[facility.id] === 'boolean') base.hub.facilities[facility.id] = src.hub.facilities[facility.id];
    }
    base.hub.visited = arr(src.hub.visited).filter((id) => VEIL_FACILITIES.some((f) => f.id === id));
  }
  if (src.preferences && typeof src.preferences === 'object') {
    base.preferences.antiJumpscare = !!src.preferences.antiJumpscare;
    base.preferences.difficulty = DIFFICULTIES.includes(src.preferences.difficulty) ? src.preferences.difficulty : 'normal';
    base.preferences.graphicsPreset = ['low', 'medium', 'high'].includes(src.preferences.graphicsPreset) ? src.preferences.graphicsPreset : 'high';
  }
  if (src.flags && typeof src.flags === 'object') {
    for (const [key, value] of Object.entries(src.flags)) {
      if (typeof key === 'string' && key.length < 64) base.flags[key] = typeof value === 'boolean' ? value : clamp(finite(value, 0), -1e9, 1e9);
    }
  }
  base.savedAt = Math.max(0, finite(src.savedAt, 0));
  return base;
}

export function migrateVeilSave(raw = {}, options = {}) {
  const fromVersion = Math.max(0, Math.min(VEIL_SAVE_VERSION, Math.floor(finite(raw?.schemaVersion, 1))));
  const log = [];
  let working = raw && typeof raw === 'object' ? { ...raw } : {};
  if (fromVersion < 2) {
    working = {
      ...working,
      leaderboards: working.leaderboards || { buckets: {}, seen: [] },
      collectibles: working.collectibles || {},
      flags: { ...(working.flags || {}), migratedV1: true },
    };
    log.push('v1→v2: leaderboards, collectibles and flags initialised');
  }
  if (working.legacyDread && typeof working.legacyDread === 'object') {
    working.flags = { ...(working.flags || {}), dreadCarryOver: true };
    log.push('legacy Dread Beyond progress preserved');
  }
  if (options.legacyDread && typeof options.legacyDread === 'object') {
    working.flags = { ...(working.flags || {}), dreadCarryOver: true };
    log.push('legacy Dread Beyond profile linked');
  }
  const save = sanitizeVeilSave(working);
  save.schemaVersion = VEIL_SAVE_VERSION;
  return { save, fromVersion, migrated: fromVersion < VEIL_SAVE_VERSION || log.length > 0, log };
}

export function recordVeilTransaction(save, currency, amount, txId) {
  const progression = new VeilProgression(save.progression || {});
  const result = progression.award(currency, amount, txId);
  save.progression = progression.toJSON();
  return result;
}

// ---------------------------------------------------------------------------
// Settings and presentation policy
// ---------------------------------------------------------------------------
export function sanitizeVeilSettings(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  for (const def of VEIL_SETTING_DEFINITIONS) {
    const path = def.path.replace(/^veil\./, '');
    const keys = path.split('.');
    let value = src;
    for (const key of keys) value = value && typeof value === 'object' ? value[key] : undefined;
    if (value === undefined) value = src[def.path] ?? src[path];
    if (def.type === 'toggle') out[path] = typeof value === 'boolean' ? value : def.value;
    else if (def.type === 'range') out[path] = clamp(finite(value, def.value), def.min, def.max);
    else if (def.type === 'select') out[path] = def.options.includes(String(value)) ? String(value) : String(def.value);
    else out[path] = value ?? def.value;
  }
  out.sanity = sanitizeSanitySettings({
    enabled: out['sanity.enabled'], drainMultiplier: out['sanity.drainMultiplier'], recoveryMultiplier: out['sanity.recoveryMultiplier'],
    hudEnabled: out['sanity.hudEnabled'], warningThreshold: out['sanity.warningThreshold'],
    environmentalIntensity: out['sanity.environmentalIntensity'], cameraEffects: out['sanity.cameraEffects'],
    visualDistortion: out['sanity.visualDistortion'], unexpectedAudio: out['sanity.unexpectedAudio'],
    safeRoomStrength: out['sanity.safeRoomStrength'], temporaryConditions: out['sanity.temporaryConditions'],
  });
  return out;
}

export function veilSettingValue(settings, path) {
  const clean = String(path || '').replace(/^veil\./, '');
  if (settings && settings[clean] !== undefined) return settings[clean];
  return clean.split('.').reduce((value, key) => (value && typeof value === 'object' ? value[key] : undefined), settings);
}

export function setVeilSetting(settings, path, value) {
  const definition = VEIL_SETTING_DEFINITIONS.find((d) => d.path === path);
  if (!definition) return null;
  const clean = definition.path.replace(/^veil\./, '');
  const keys = clean.split('.');
  let cursor = settings;
  for (let i = 0; i < keys.length - 1; i += 1) {
    if (!cursor[keys[i]] || typeof cursor[keys[i]] !== 'object') cursor[keys[i]] = {};
    cursor = cursor[keys[i]];
  }
  if (definition.type === 'toggle') cursor[keys[keys.length - 1]] = !!value;
  else if (definition.type === 'range') cursor[keys[keys.length - 1]] = clamp(finite(value, definition.value), definition.min, definition.max);
  else if (definition.type === 'select') cursor[keys[keys.length - 1]] = definition.options.includes(String(value)) ? String(value) : String(definition.value);
  const sanitized = sanitizeVeilSettings(settings);
  Object.keys(settings).forEach((key) => delete settings[key]);
  Object.assign(settings, sanitized);
  return settings;
}

export function resolveVeilPresentation(settings = {}, context = {}) {
  const clean = sanitizeVeilSettings(settings);
  const accessibility = context.accessibility || {};
  const preset = context.graphicsPreset || 'high';
  const anti = clean['antiJumpscare.enabled'];
  return {
    enabled: context.enabled !== false,
    sanity: clean.sanity,
    ghost: {
      maxConcurrent: clean['ghosts.maxConcurrent'],
      encounterRate: clean['ghosts.encounterRate'],
      manifestationQuality: clean['ghosts.manifestationQuality'],
    },
    visual: {
      distortion: clean['sanity.visualDistortion'] && !accessibility.reducedMotion,
      cameraKick: clean['sanity.cameraEffects'] && !accessibility.reducedMotion && !anti,
      fogDensity: preset === 'low' ? 0.55 : preset === 'medium' ? 0.75 : 1,
      evidencePings: clean['investigation.evidencePings'],
      hintMarkers: clean['investigation.hintMarkers'],
      particles: preset === 'low' ? 0.4 : preset === 'medium' ? 0.7 : 1,
    },
    audio: {
      ambience: clean['audio.ambience'],
      hrtf: clean['audio.hrtf'],
      unexpected: clean['sanity.unexpectedAudio'] && !anti,
      softening: anti ? clean['antiJumpscare.audioSoftening'] : 0,
    },
    accessibility: {
      reducedMotion: !!accessibility.reducedMotion,
      highContrast: !!accessibility.highContrast || clean['accessibility.highContrast'],
      subtitles: clean['accessibility.subtitles'] !== false,
      screenReader: !!clean['accessibility.screenReader'],
    },
    hud: { sanity: clean.sanity.hudEnabled, warningThreshold: clean.sanity.warningThreshold },
    pageSize: Number(clean['index.pageSize']) || VEIL_PERF.indexPageSize,
    antiJumpscare: anti,
  };
}

// ---------------------------------------------------------------------------
// Performance helpers
// ---------------------------------------------------------------------------
export function createPool(factory, size = 16) {
  const items = Array.from({ length: Math.max(1, Math.floor(size)) }, (_, i) => factory(i));
  let cursor = 0;
  return {
    items,
    acquire() {
      const free = items.find((item) => !item.active);
      if (free) { free.active = true; return free; }
      // Exhausted pools reuse round-robin instead of allocating new objects.
      const reused = items[cursor % items.length];
      cursor += 1;
      reused.active = true;
      return reused;
    },
    release(item) { if (item) item.active = false; },
    get active() { return items.filter((item) => item.active).length; },
  };
}

export function staggerSchedule(ids = [], frame = 0, buckets = 6) {
  const out = [];
  const n = Math.max(1, Math.floor(buckets));
  for (let i = 0; i < ids.length; i += 1) {
    if ((i + Math.floor(frame)) % n === 0) out.push(ids[i]);
  }
  return out;
}

export function paginate(rows = [], page = 1, pageSize = VEIL_PERF.indexPageSize) {
  const size = Math.max(1, Math.floor(finite(pageSize, VEIL_PERF.indexPageSize)));
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = clamp(Math.floor(finite(page, 1)), 1, pages);
  return {
    rows: rows.slice((current - 1) * size, current * size),
    page: current,
    pages,
    total: rows.length,
    pageSize: size,
  };
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------
export function veilSummary(save = null, controller = null) {
  const data = save || controller?.save || defaultVeilSave();
  const index = controller?.index || new GhostIndex(data.ghostIndex || {});
  const completion = index.completion();
  const stageCount = data.campaign?.completedStages?.length || 0;
  const bossCount = data.campaign?.bossClears?.length || 0;
  return {
    stages: stageCount,
    totalStages: VEIL_STAGES.length,
    bosses: bossCount,
    totalBosses: VEIL_BOSSES.length,
    chapters: data.campaign?.chapterClears?.length || 0,
    documented: completion.documented,
    totalGhosts: completion.total,
    percent: Math.round((completion.documented / Math.max(1, completion.total)) * 100),
    finalBoss: !!data.campaign?.finalBoss,
    sanity: Math.round(finite(data.sanity?.value, SANITY_DEFAULT)),
  };
}

export class VeilController {
  constructor(options = {}) {
    const migration = options.migrated === false
      ? { save: sanitizeVeilSave(options.save || {}), log: [], migrated: false }
      : migrateVeilSave(options.save || {}, { legacyDread: options.legacyDread });
    this.save = migration.save;
    this.migration = { fromVersion: migration.fromVersion, log: migration.log, migrated: migration.migrated };
    this.settings = sanitizeVeilSettings(options.settings || {});
    this.sanity = new SanityMeter({
      settings: this.save.sanity.settings,
      value: this.save.sanity.value,
      exposure: this.save.sanity.exposure,
      focus: this.save.sanity.focus,
      zone: this.save.sanity.zone,
      mindRanks: this.save.progression?.mind?.ranks || {},
    });
    this.index = new GhostIndex(this.save.ghostIndex);
    this.progression = new VeilProgression(this.save.progression);
    this.leaderboards = new VeilLeaderboards(this.save.leaderboards);
    this.director = new (options.Director || GhostEncounterDirector)({
      encounterCooldown: VEIL_AI_DEFAULTS.encounterCooldown,
      maxConcurrent: this.settings['ghosts.maxConcurrent'],
      encounterRate: this.settings['ghosts.encounterRate'],
    });
    this.brains = new Map();
    this.manifests = new Map();
    this.activeStage = null;
    this.activeBoss = null;
    this.clock = 0;
    this.lastSnapshot = null;
    this.replication = null;
  }

  startStage(stageId, options = {}) {
    const stage = veilStage(stageId);
    if (!stage) return { ok: false, reason: 'unknown-stage' };
    if (!stageUnlocked(stageId, this.save.campaign)) return { ok: false, reason: 'locked' };
    this.activeStage = stage.id;
    this.activeBoss = null;
    this.save.campaign.runs += 1;
    this.sanity.beginRun({ stage: true });
    this.sanity.setZone(stage.zone);
    this.sanity.value = clamp(this.sanity.value || SANITY_DEFAULT, 1, SANITY_MAX);
    this.director.reset?.();
    const presentation = resolveVeilPresentation(this.settings, {
      accessibility: options.accessibility,
      graphicsPreset: this.save.preferences.graphicsPreset,
    });
    return { ok: true, stage, room: veilRoom(stage.id, options), enemies: veilStageEnemies(stage.id, options), presentation };
  }

  startBoss(bossId) {
    const boss = veilBoss(bossId);
    if (!boss) return { ok: false, reason: 'unknown-boss' };
    if (!bossUnlocked(bossId, this.save.campaign)) return { ok: false, reason: 'locked' };
    this.activeStage = null;
    this.activeBoss = bossId;
    this.sanity.beginRun({ boss: true });
    this.sanity.setZone('veil');
    return { ok: true, boss, room: veilArena(bossId), spawn: veilBossSpawn(bossId) };
  }

  ghostBrain(kind) {
    if (!this.brains.has(kind)) this.brains.set(kind, new GhostBrain(ghostProfileLocal(kind), { id: kind }));
    return this.brains.get(kind);
  }

  witness(kind, clock = this.clock) {
    const result = this.index.discover(kind, clock);
    if (result.ok) {
      this.progression.addMetric('encounters', 1);
      if (result.first) this.progression.addMetric('evidence', 0);
    }
    return result;
  }

  evidence(kind, type) {
    const result = this.index.addEvidence(kind, type);
    if (result.ok) {
      this.progression.addMetric('evidence', 1);
      if (type === 'audio') this.progression.addMetric('audio', 1);
      if (type === 'visual') this.progression.addMetric('photos', 1);
    }
    return result;
  }

  document(kind) {
    const result = this.index.document(kind);
    if (result.ok) {
      const ghost = result.ghost;
      this.progression.addMetric('documented', 1);
      if (ghost && !ghost.secret) this.progression.addMetric('standardDocumented', 1);
      if (ghost?.secret) this.progression.addMetric('secrets', 1);
      this.progression.xp += Math.round(ghost.xp);
      this.progression.checkAchievements();
    }
    return result;
  }

  master(kind) {
    const result = this.index.master(kind);
    if (result.ok) this.progression.addMetric('mastered', 1);
    return result;
  }

  completeStage(stageId, options = {}) {
    const stage = veilStage(stageId);
    if (!stage) return { ok: false, reason: 'unknown-stage' };
    const first = !this.save.campaign.completedStages.includes(stage.id);
    if (first) this.save.campaign.completedStages.push(stage.id);
    this.progression.addMetric('stages', 1);
    if (options.clean) {
      this.progression.addMetric('cleanStages', 1);
      this.progression.addMetric('cleanSanityStages', 1);
    }
    if (options.antiJumpscare) this.progression.addMetric('safeClears', 1);
    let chapterCompleted = null;
    const chapter = VEIL_CHAPTERS_BY_ID[stage.chapter];
    const all = VEIL_STAGES.filter((s) => s.chapter === stage.chapter).every((s) => this.save.campaign.completedStages.includes(s.id));
    if (all && chapter && !this.save.campaign.chapterClears.includes(chapter.id)) {
      this.save.campaign.chapterClears.push(chapter.id);
      chapterCompleted = chapter.id;
      this.progression.addMetric('chapterClears', 1);
      this.progression.awardMindPoints(2);
    }
    if (first) this.progression.awardBundle(stage.reward, `stage:${stage.id}`);
    this.progression.checkAchievements();
    this.save.sanity.value = this.sanity.value;
    return { ok: true, first, chapterCompleted, reward: first ? stage.reward : null };
  }

  defeatBoss(bossId, options = {}) {
    const boss = veilBoss(bossId);
    if (!boss) return { ok: false, reason: 'unknown-boss' };
    const first = !this.save.campaign.bossClears.includes(boss.id);
    if (first) this.save.campaign.bossClears.push(boss.id);
    this.progression.addMetric('bosses', 1);
    if (boss.final) {
      this.save.campaign.finalBoss = true;
      this.progression.addMetric('finalBoss', 1);
      this.progression.awardMindPoints(3);
    }
    if (first) this.progression.awardBundle(boss.reward, `boss:${boss.id}`);
    if (options.timeMs) {
      const best = this.save.campaign.bestTimeMs;
      if (!best || options.timeMs < best) this.save.campaign.bestTimeMs = Math.round(options.timeMs);
    }
    this.progression.checkAchievements();
    this.activeBoss = null;
    return { ok: true, first, boss };
  }

  completeCase(caseId, result = {}) {
    const def = caseById(caseId);
    if (!def) return { ok: false, reason: 'unknown-case' };
    if (this.save.investigation.completedCases.includes(caseId)) return { ok: false, reason: 'duplicate' };
    const resolved = resolveInvestigation(def, result, this.progression);
    if (!resolved.ok) return resolved;
    this.save.investigation.completedCases.push(caseId);
    this.progression.awardMindPoints(1);
    this.sanity.recover(12, 'events');
    this.progression.checkAchievements();
    return resolved;
  }

  tick(dt, context = {}) {
    const step = clamp(finite(dt), 0, 0.25);
    this.clock += step;
    this.director.tick?.(step);
    const sanity = this.sanity.tick(step);
    let rescue = null;
    if (this.sanity.veilTouched) rescue = this.sanity.rescue();
    this.save.sanity.value = this.sanity.value;
    this.save.sanity.exposure = this.sanity.exposure;
    this.save.sanity.focus = this.sanity.focus;
    this.save.sanity.zone = this.sanity.zone;
    return {
      ...sanity,
      rescue,
      conditions: [...this.sanity.conditions.entries()].map(([id, entry]) => ({ id, ...entry })),
      director: this.director.snapshot?.() || null,
      context,
    };
  }

  snapshot() {
    return {
      stage: this.activeStage,
      boss: this.activeBoss,
      sanity: this.sanity.snapshot(),
      index: this.index.completion(),
      progression: this.progression.snapshot(),
      migration: this.migration,
      summary: veilSummary(this.save, this),
    };
  }

  toJSON() {
    this.save.ghostIndex = this.index.toJSON();
    this.save.progression = this.progression.toJSON();
    this.save.leaderboards = this.leaderboards.toJSON();
    this.save.sanity.value = this.sanity.value;
    this.save.sanity.exposure = this.sanity.exposure;
    this.save.sanity.focus = this.sanity.focus;
    this.save.sanity.zone = this.sanity.zone;
    this.save.savedAt = Date.now();
    return this.save;
  }
}

// Small indirections keep the controller independent from direct data lookups.
function ghostProfileLocal(kind) { return GHOSTS_BY_ID[kind] || null; }

export function veilBossSpawn(bossId) {
  const boss = veilBoss(bossId);
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
    color: boss.chapterId === 'veil_citadel' ? '#b79ad6' : null,
  };
}

export function veilEquipmentEffects(mastery = {}) {
  return {
    detectionRange: 1 + clamp(finite(mastery.spectral_detector, 0), 0, 5) * 0.1,
    captureQuality: 1 + clamp(finite(mastery.spirit_camera, 0), 0, 5) * 0.1,
    audioClarity: 1 + clamp(finite(mastery.echo_recorder, 0), 0, 5) * 0.1,
    veilDepth: 1 + clamp(finite(mastery.veil_lens, 0), 0, 5) * 0.1,
    deduction: 1 + clamp(finite(mastery.investigator_journal, 0), 0, 5) * 0.1,
  };
}

export function veilFacilityState(hub = {}) {
  return VEIL_FACILITIES.map((facility) => ({ ...facility, active: hub.facilities?.[facility.id] !== false, visited: (hub.visited || []).includes(facility.id) }));
}

export function veilNpcDialogue(npcId) {
  const npc = VEIL_NPCS.find((n) => n.id === npcId);
  return npc ? { ...npc, lines: npc.lines.slice() } : null;
}

export function veilSecretForStage(stageId) {
  return SECRET_LOCATIONS.find((s) => s.stage === stageId) || null;
}

export function veilCollectibleTotals(collectibles = {}) {
  return VEIL_COLLECTIBLES.map((category) => ({
    ...category,
    found: clamp(Math.floor(finite(collectibles[category.id], 0)), 0, category.count),
    percent: Math.round((clamp(Math.floor(finite(collectibles[category.id], 0)), 0, category.count) / category.count) * 100),
  }));
}

export function veilDifficultyProfile(id) {
  return VEIL_DIFFICULTY_SCALING[id] || VEIL_DIFFICULTY_SCALING.normal;
}

export function veilSpawnGhost(kind, x, options = {}) {
  return makeGhost(kind, x, options);
}

export const VEIL_GHOST_BEHAVIORS = GHOST_BEHAVIORS;
export const VEIL_SANITY_MAX = SANITY_MAX;
export const VEIL_SANITY_DEFAULT = SANITY_DEFAULT;
export const VEIL_SAVE_DEFAULTS = defaultVeilSave;
export const VEIL_MIND_IDS = MIND_UPGRADE_IDS;
export const VEIL_NPCS_LIST = VEIL_NPCS;
export const VEIL_SPECIAL_CONTRACTS = SPECIAL_CONTRACTS;
export const VEIL_CHAPTER_LIST = VEIL_CHAPTERS;
export const VEIL_STAGE_LIST = VEIL_STAGES;
export const VEIL_BOSS_LIST = VEIL_BOSSES;
export const VEIL_GHOST_LIST = GHOSTS;
export const VEIL_CONDITION_LIST = SANITY_CONDITIONS;
export const VEIL_SAVE_KEY_VALUE = VEIL_SAVE_KEY;
export const VEIL_SAVE_SCHEMA = VEIL_SAVE_VERSION;
export const VEIL_SETTINGS_DEFINITIONS = VEIL_SETTING_DEFINITIONS;
