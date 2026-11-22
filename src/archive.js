// Update XV — Stage Archive, Level Checker, Ghost/Jumpscare Index and
// investigation preparation. Pure and deterministic: no DOM, storage, audio or
// gameplay mutation. The browser shell supplies the live Arc IX / Arc X saves.
import {
  ARCHIVE_ARCS, ARCHIVE_CHAPTERS, ARCHIVE_CHAPTERS_BY_ID, ARCHIVE_STAGES,
  ARCHIVE_STAGES_BY_ID, ARCHIVE_BOSSES, ARCHIVE_BOSSES_BY_ID, ARCHIVE_TOOLS,
  ARCHIVE_TOOLS_BY_ID, ARCHIVE_TOOL_IDS, ARCHIVE_ACHIEVEMENTS,
  GHOST_TOOL_REQUIREMENTS, JUMPSCARE_EVENTS, JUMPSCARE_EVENTS_BY_ID,
  JUMPSCARE_CATEGORIES, JUMPSCARE_CATEGORY_IDS, ARCHIVE_SCHEMA_VERSION,
  ARCHIVE_LIMITS, ARCHIVE_DISCOVERY_STATES, GHOSTS, GHOSTS_BY_ID,
  GHOST_CLASSIFICATIONS, GHOST_RARITIES,
} from './archive_data.js';
import { ETERNAL_EQUIPMENT } from './eternal_data.js';

const finite = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const arr = (value) => (Array.isArray(value) ? value.filter((v) => typeof v === 'string') : []);
const unique = (values) => [...new Set(values.filter(Boolean))];
const stageIndex = (state) => {
  const index = ARCHIVE_DISCOVERY_STATES.indexOf(state);
  return index < 0 ? 0 : index;
};
const maxState = (a, b) => (stageIndex(a) >= stageIndex(b) ? a : b);
// GhostIndex reports `rumored` for a missing record; the archive must show
// those entries as genuinely undiscovered, not as already hinted.
const indexState = (index, id) => (index?.get?.(id) ? (index.stageOf?.(id) || 'undiscovered') : 'undiscovered');

// ---------------------------------------------------------------------------
// Save model
// ---------------------------------------------------------------------------
export function defaultArchiveSave() {
  return {
    schemaVersion: ARCHIVE_SCHEMA_VERSION,
    savedAt: 0,
    previews: {},
    jumpscares: {},
    equipment: { owned: [], upgrades: {}, loadout: [] },
    stageRecords: {},
    achievements: [],
    stats: { previews: 0, uniquePreviews: 0, eventsDiscovered: 0, eventsDocumented: 0, archiveXp: 0, hardCases: 0, checks: 0 },
    flags: {},
  };
}

const sanitizeRecord = (record) => {
  if (!record || typeof record !== 'object') return { collectibles: [], secrets: [], investigation: false, rewardClaims: [], attempts: 0, bestCompletion: 0, lastCheckedAt: 0, notes: '' };
  return {
    collectibles: [...new Set(arr(record.collectibles))].slice(0, 400),
    secrets: [...new Set(arr(record.secrets))].slice(0, 100),
    investigation: record.investigation === true,
    rewardClaims: [...new Set(arr(record.rewardClaims))].slice(0, 100),
    attempts: Math.max(0, Math.floor(finite(record.attempts, 0))),
    bestCompletion: clamp(finite(record.bestCompletion, 0), 0, 100),
    lastCheckedAt: Math.max(0, finite(record.lastCheckedAt, 0)),
    notes: typeof record.notes === 'string' ? record.notes.slice(0, ARCHIVE_LIMITS.maxNotes) : '',
  };
};

export function sanitizeArchiveSave(raw = {}) {
  const base = defaultArchiveSave();
  const src = raw && typeof raw === 'object' ? raw : {};
  // v0 migration: an early archive payload may only contain previews/events.
  const previews = src.previews && typeof src.previews === 'object' ? src.previews : {};
  for (const [id, value] of Object.entries(previews)) {
    if (!ARCHIVE_STAGES_BY_ID[id] || !value || typeof value !== 'object') continue;
    if (Object.keys(base.previews).length >= ARCHIVE_LIMITS.maxPreviewRecords) break;
    base.previews[id] = {
      count: clamp(Math.round(finite(value.count, 1)), 1, 999999),
      firstAt: Math.max(0, finite(value.firstAt, 0)),
      lastAt: Math.max(0, finite(value.lastAt, 0)),
      type: value.type === 'developer' ? 'developer' : 'archive',
    };
  }
  const scareSource = src.jumpscares && typeof src.jumpscares === 'object' ? src.jumpscares : {};
  for (const event of JUMPSCARE_EVENTS) {
    const value = scareSource[event.id];
    if (!value || typeof value !== 'object') continue;
    const state = ['rumored', 'encountered', 'documented', 'mastered'].includes(value.state) ? value.state : 'undiscovered';
    if (state === 'undiscovered') continue;
    base.jumpscares[event.id] = {
      state,
      evidence: [...new Set(arr(value.evidence))].slice(0, 12),
      discoveredAt: Math.max(0, finite(value.discoveredAt, 0)),
      documentedAt: Math.max(0, finite(value.documentedAt, 0)),
      source: ['play', 'evidence', 'multiplayer', 'migration'].includes(value.source) ? value.source : 'evidence',
      rewardClaimed: value.rewardClaimed === true,
    };
  }
  const equipment = src.equipment && typeof src.equipment === 'object' ? src.equipment : {};
  base.equipment.owned = [...new Set(arr(equipment.owned))].filter((id) => ARCHIVE_TOOL_IDS.includes(id)).slice(0, ARCHIVE_TOOL_IDS.length);
  if (equipment.upgrades && typeof equipment.upgrades === 'object') {
    for (const [id, value] of Object.entries(equipment.upgrades)) {
      if (ARCHIVE_TOOL_IDS.includes(id)) base.equipment.upgrades[id] = clamp(Math.round(finite(value, 1)), 1, ARCHIVE_LIMITS.maxToolUpgrades);
    }
  }
  for (const id of base.equipment.owned) if (!base.equipment.upgrades[id]) base.equipment.upgrades[id] = 1;
  base.equipment.loadout = [...new Set(arr(equipment.loadout))].filter((id) => ARCHIVE_TOOL_IDS.includes(id)).slice(0, 6);
  const records = src.stageRecords && typeof src.stageRecords === 'object' ? src.stageRecords : {};
  for (const [id, record] of Object.entries(records)) {
    if (ARCHIVE_STAGES_BY_ID[id]) base.stageRecords[id] = sanitizeRecord(record);
  }
  base.achievements = [...new Set(arr(src.achievements))].filter((id) => ARCHIVE_ACHIEVEMENTS.some((a) => a.id === id));
  for (const key of Object.keys(base.stats)) base.stats[key] = Math.max(0, finite(src.stats?.[key], 0));
  base.stats.eventsDiscovered = Math.max(base.stats.eventsDiscovered, Object.keys(base.jumpscares).length);
  base.stats.eventsDocumented = Math.max(base.stats.eventsDocumented, Object.values(base.jumpscares).filter((e) => e.state === 'documented' || e.state === 'mastered').length);
  base.savedAt = Math.max(0, finite(src.savedAt, 0));
  return base;
}

// ---------------------------------------------------------------------------
// Stage Archive
// ---------------------------------------------------------------------------
export class StageArchiveManager {
  constructor(options = {}) {
    this.veil = options.veil || null;
    this.eternal = options.eternal || null;
    this.archive = options.archive || defaultArchiveSave();
  }

  get veilCampaign() { return this.veil?.save?.campaign || this.veil?.campaign || {}; }
  get eternalCampaign() { return this.eternal?.save?.campaign || this.eternal?.campaign || {}; }
  completed(arcId) {
    const campaign = arcId === 'arc9' ? this.veilCampaign : this.eternalCampaign;
    return new Set(Array.isArray(campaign.completedStages) ? campaign.completedStages : []);
  }
  bosses(arcId) {
    const campaign = arcId === 'arc9' ? this.veilCampaign : this.eternalCampaign;
    return new Set(Array.isArray(campaign.bossClears) ? campaign.bossClears : []);
  }
  arcUnlocked(arcId) { return arcId === 'arc9' || !!(this.eternalCampaign.unlocked || this.eternalCampaign.finalBoss); }
  chapterUnlocked(chapterId) {
    const chapter = ARCHIVE_CHAPTERS_BY_ID[chapterId];
    if (!chapter) return false;
    if (chapter.arcId === 'arc9') return true;
    return this.arcUnlocked('arc10');
  }
  stageEnterable(stage) {
    if (!this.arcUnlocked(stage.arcId)) return false;
    const completed = this.completed(stage.arcId);
    if (completed.has(stage.id)) return true;
    const first = ARCHIVE_STAGES.find((s) => s.chapterId === stage.chapterId && s.number === 1);
    if (first?.id === stage.id) return true;
    const previous = ARCHIVE_STAGES.find((s) => s.chapterId === stage.chapterId && s.number === stage.number - 1);
    return !!previous && completed.has(previous.id);
  }
  status(stageId) {
    const stage = ARCHIVE_STAGES_BY_ID[stageId];
    if (!stage) return 'locked';
    const completed = this.completed(stage.arcId);
    if (!completed.has(stage.id)) {
      if (!this.chapterUnlocked(stage.chapterId)) return 'locked';
      return this.stageEnterable(stage) ? 'unlocked' : 'uncleared';
    }
    return this.perfect(stage.id) ? 'perfect' : 'cleared';
  }
  perfect(stageId) {
    const stage = ARCHIVE_STAGES_BY_ID[stageId];
    if (!stage || !this.completed(stage.arcId).has(stageId)) return false;
    const record = this.archive.stageRecords?.[stageId] || {};
    const ghostIndex = this.ghosts?.index || this.index;
    const docs = stage.ghostIds.every((id) => {
      const state = indexState(ghostIndex, id);
      return stageIndex(state) >= stageIndex('documented');
    });
    const lore = stage.ghostIds.every((id) => {
      const found = (ghostIndex?.get?.(id)?.lore || 0);
      return found >= 4 || stage.collectibleIds.filter((c) => c.startsWith(`${id}:lore:`)).every((c) => (record.collectibles || []).includes(c));
    });
    const events = stage.jumpscareEventIds.every((id) => this.archive.jumpscares?.[id]?.state === 'documented' || this.archive.jumpscares?.[id]?.state === 'mastered');
    return docs && lore && events;
  }
  stagesFor(arcId, chapterId = 'all') {
    return ARCHIVE_STAGES.filter((s) => (!arcId || s.arcId === arcId) && (chapterId === 'all' || s.chapterId === chapterId));
  }
  chaptersFor(arcId) { return ARCHIVE_CHAPTERS.filter((c) => c.arcId === arcId); }
  bossesFor(arcId) { return ARCHIVE_BOSSES.filter((b) => b.arcId === arcId); }
  statistics() {
    const counts = { total: ARCHIVE_STAGES.length, cleared: 0, perfect: 0, unlocked: 0, uncleared: 0, locked: 0 };
    for (const stage of ARCHIVE_STAGES) {
      const status = this.status(stage.id);
      if (status === 'perfect') { counts.perfect += 1; counts.cleared += 1; }
      else if (status === 'cleared') counts.cleared += 1;
      else counts[status] += 1;
    }
    counts.completion = Math.round((counts.cleared / Math.max(1, counts.total)) * 1000) / 10;
    counts.perfectCompletion = Math.round((counts.perfect / Math.max(1, counts.total)) * 1000) / 10;
    return counts;
  }
}

// ---------------------------------------------------------------------------
// Safe Sneak Peek
// ---------------------------------------------------------------------------
export class StagePreviewManager {
  constructor(manager, options = {}) {
    this.manager = manager;
    this.archive = options.archive || manager.archive;
    this.index = options.index || null;
  }

  preview(stageId, options = {}) {
    const stage = ARCHIVE_STAGES_BY_ID[stageId];
    if (!stage) return { ok: false, reason: 'unknown-stage' };
    const developer = options.developer === true && options.authorized === true;
    if (options.developer === true && !developer) return { ok: false, reason: 'developer-only' };
    const state = this.manager.status(stageId);
    const knownGhosts = stage.ghostIds
      .map((id) => ({ ghost: GHOSTS_BY_ID[id], state: indexState(this.index, id) }))
      .filter((row) => developer || stageIndex(row.state) >= stageIndex('documented'));
    const boss = ARCHIVE_BOSSES_BY_ID[stage.bossId];
    const bossKnown = developer || this.manager.bosses(stage.arcId).has(stage.bossId);    const toolIds = unique(knownGhosts.flatMap((row) => GHOST_TOOL_REQUIREMENTS[row.ghost.id]?.required || []));
    const tools = (developer ? ARCHIVE_TOOLS : ARCHIVE_TOOLS.filter((t) => toolIds.includes(t.id))).map((tool) => ({
      id: tool.id, name: tool.name, owned: this.equipment ? this.equipment.status(tool.id) === 'owned' : false,
      note: developer ? tool.functions[0] : 'Rekomendasi arsip',
    }));
    return {
      ok: true,
      type: developer ? 'developer' : 'archive',
      stage: {
        id: stage.id, arcId: stage.arcId, chapterId: stage.chapterId, name: stage.name,
        chapterName: stage.chapterName, number: stage.number, status: state,
      },
      environment: { zone: stage.zone, conditions: stage.conditions, description: stage.description },
      knownGhosts: knownGhosts.map((row) => ({ id: row.ghost.id, name: row.ghost.name, classification: row.ghost.classification, state: row.state })),
      unknownPresence: developer ? 0 : Math.max(0, stage.ghostIds.length - knownGhosts.length),
      threat: stage.threat,
      tools,
      objectives: [{ kind: 'main', text: stage.objective }, ...(stage.investigation ? [{ kind: 'optional', text: 'Kumpulkan bukti investigasi' }] : [])],
      collectibles: {
        records: stage.collectibleIds.length,
        categories: ['lore', 'clue', 'relic'],
      },
      boss: bossKnown ? { id: boss.id, name: boss.name, phases: boss.maxPhases } : { unknown: true },
      rewards: Object.keys(stage.rewards || {}).map((id) => ({ id, category: id })),
      conditions: stage.conditions,
      accessibility: { antiJumpscare: true, noAudioAutoplay: true, noGameplay: true, isolated: true },
      developer,
    };
  }

  /** Records only archive metadata. It never enters a stage or changes progress. */
  open(stageId, options = {}) {
    const preview = this.preview(stageId, options);
    if (!preview.ok) return preview;
    if (preview.developer) return preview;
    const now = finite(options.now, Date.now());
    const existing = this.archive.previews[stageId];
    this.archive.previews[stageId] = {
      count: (existing?.count || 0) + 1,
      firstAt: existing?.firstAt || now,
      lastAt: now,
      type: 'archive',
    };
    this.archive.stats.previews += 1;
    this.archive.stats.uniquePreviews = Object.keys(this.archive.previews).length;
    return preview;
  }
}

// ---------------------------------------------------------------------------
// Level Checker
// ---------------------------------------------------------------------------
export class LevelCheckerService {
  constructor(manager, options = {}) {
    this.manager = manager;
    this.archive = options.archive || manager.archive;
    this.index = options.index || null;
    this.investigation = options.investigation || null;
  }

  ghostState(ghostId) { return indexState(this.index, ghostId) || this.archive.ghosts?.[ghostId] || 'undiscovered'; }

  stage(stageId) {
    const stage = ARCHIVE_STAGES_BY_ID[stageId];
    if (!stage) return { ok: false, reason: 'unknown-stage' };
    const campaign = stage.arcId === 'arc9' ? this.manager.veilCampaign : this.manager.eternalCampaign;
    const cleared = (campaign.completedStages || []).includes(stageId);
    const bossClear = (campaign.bossClears || []).includes(stage.bossId);
    const record = this.archive.stageRecords?.[stageId] || {};
    const states = stage.ghostIds.map((id) => this.ghostState(id));
    const documented = states.filter((s) => stageIndex(s) >= stageIndex('documented')).length;
    const mastered = states.filter((s) => s === 'mastered').length;
    const lore = stage.ghostIds.reduce((total, id) => {
      const stored = stage.collectibleIds.filter((c) => c.startsWith(`${id}:lore:`) && (record.collectibles || []).includes(c)).length;
      return total + Math.max(stored, clamp(Math.round(finite(this.index?.get?.(id)?.lore, 0)), 0, 4));
    }, 0);
    const events = stage.jumpscareEventIds.map((id) => this.archive.jumpscares?.[id]?.state || 'undiscovered');
    const eventsDocumented = events.filter((s) => s === 'documented' || s === 'mastered').length;
    const recordRewards = record.rewardClaims || [];
    const issues = [];
    if (cleared && !campaign.completedStages) issues.push('campaign completedStages missing');
    if (cleared && !this.manager.arcUnlocked(stage.arcId)) issues.push('cleared stage sits inside a locked arc');
    if (new Set(recordRewards).size !== recordRewards.length) issues.push('duplicate reward transaction');
    if (recordRewards.length > 1) issues.push('multiple reward claims for one stage');
    if (!ARCHIVE_STAGES_BY_ID[stageId]) issues.push('unknown stage reference');
    if (stage.ghostIds.some((id) => !GHOSTS_BY_ID[id])) issues.push('unknown ghost reference');
    const category = (id, label, status, value, detail, applicable = true) => ({ id, label, status: applicable ? status : 'not-available', value, detail: applicable ? detail : 'Tidak tersedia untuk tahap ini.' });
    const categories = [
      category('main', 'Main Objective', cleared ? 'complete' : 'incomplete', cleared ? 100 : 0, stage.objective),
      category('enemies', 'Enemy Completion', cleared ? 'complete' : 'incomplete', cleared ? 100 : 0, `${stage.enemyCount} musuh`),
      category('elite', 'Elite Completion', cleared ? 'complete' : 'incomplete', cleared ? 100 : 0, `${stage.eliteCount} elite terjamin`),
      category('boss', 'Boss Completion', bossClear ? 'complete' : 'incomplete', bossClear ? 100 : 0, stage.bossId || 'Tidak ada bos bab'),
      category('investigation', 'Investigation', record.investigation ? 'complete' : 'incomplete', record.investigation ? 100 : 0, stage.investigation ? 'Bukti investigasi tahap' : 'Tahap ini tidak memiliki investigasi wajib', !!stage.investigation),
      category('ghosts', 'Ghost Documentation', stage.ghostIds.length && documented === stage.ghostIds.length ? 'complete' : 'incomplete', Math.round((documented / Math.max(1, stage.ghostIds.length)) * 1000) / 10, `${documented}/${stage.ghostIds.length} terdokumentasi`),
      category('collectibles', 'Collectibles', lore === stage.collectibleIds.length ? 'complete' : 'incomplete', Math.round((lore / Math.max(1, stage.collectibleIds.length)) * 1000) / 10, `${lore}/${stage.collectibleIds.length} fragmen lore`),
      category('secrets', 'Secret Areas', stage.secret ? (cleared ? 'complete' : 'incomplete') : 'not-available', stage.secret ? (cleared ? 100 : 0) : 0, stage.secret ? 'Tahap rahasia' : 'Tidak ada area rahasia terpisah', !!stage.secret),
      category('jumpscares', 'Jumpscare Records', events.length && eventsDocumented === events.length ? 'complete' : 'incomplete', Math.round((eventsDocumented / Math.max(1, events.length)) * 1000) / 10, `${eventsDocumented}/${events.length} peristiwa tercatat`, events.length > 0),
      category('rewards', 'Stage Rewards', cleared ? 'complete' : 'incomplete', cleared ? 100 : 0, cleared ? 'Hadiah tahap sudah diproses' : 'Belum diklaim karena tahap belum selesai'),
      category('integrity', 'Stage Integrity', issues.length ? 'incomplete' : 'complete', issues.length ? 0 : 100, issues.length ? issues.join('; ') : 'Tidak ada konflik progres'),
    ];
    const applicable = categories.filter((c) => c.status !== 'not-available');
    const main = categories[0];
    const ghosts = categories.find((c) => c.id === 'ghosts');
    const collectibles = categories.find((c) => c.id === 'collectibles');
    const secrets = categories.find((c) => c.id === 'secrets');
    const overall = Math.round(applicable.reduce((sum, c) => sum + (Number(c.value) || 0), 0) / Math.max(1, applicable.length) * 10) / 10;
    this.archive.stats.checks += 1;
    return {
      ok: true,
      stage: { ...stage, status: this.manager.status(stageId) },
      categories,
      percentages: {
        main: main.value,
        ghosts: ghosts.value,
        collectibles: collectibles.value,
        secrets: secrets.value,
        overall,
        documentedEntities: documented, masteredEntities: mastered,
      },
      issues,
      missing: categories.filter((c) => c.status === 'incomplete').map((c) => c.label),
      cleared,
    };
  }

  chapter(chapterId) {
    const stages = ARCHIVE_STAGES.filter((s) => s.chapterId === chapterId);
    if (!stages.length) return { ok: false, reason: 'unknown-chapter' };
    const checks = stages.map((s) => this.stage(s.id));
    const valid = checks.filter((c) => c.ok);
    const categories = ['main', 'ghosts', 'collectibles', 'secrets', 'jumpscares', 'integrity'].map((id) => {
      const rows = valid.map((c) => c.categories.find((x) => x.id === id)).filter((x) => x && x.status !== 'not-available');
      const value = rows.length ? Math.round(rows.reduce((sum, x) => sum + Number(x.value || 0), 0) / rows.length * 10) / 10 : 0;
      return { id, value, complete: rows.length > 0 && rows.every((x) => x.status === 'complete') };
    });
    return {
      ok: true, chapterId, stages: checks, categories,
      percentages: Object.fromEntries(categories.map((c) => [c.id, c.value])),
      completeStages: valid.filter((c) => c.cleared).length,
    };
  }

  arc(arcId) {
    const chapters = ARCHIVE_CHAPTERS.filter((c) => c.arcId === arcId);
    if (!chapters.length) return { ok: false, reason: 'unknown-arc' };
    const checks = chapters.map((c) => this.chapter(c.id));
    const valid = checks.filter((c) => c.ok);
    return {
      ok: true, arcId, chapters: checks,
      completeStages: valid.reduce((sum, c) => sum + c.completeStages, 0),
      totalStages: valid.reduce((sum, c) => sum + c.stages.length, 0),
    };
  }

  missingRecord(stageId) {
    const check = this.stage(stageId);
    if (!check.ok) return check;
    return { stageId, missing: check.missing, issues: check.issues };
  }
}

// ---------------------------------------------------------------------------
// Ghost Index 3.0 view over the real Arc IX/X GhostIndex
// ---------------------------------------------------------------------------
export class GhostArchiveManager {
  constructor(index, options = {}) {
    this.index = index;
    this.archive = options.archive || defaultArchiveSave();
  }
  state(id) { return indexState(this.index, id); }
  documented(id) { return stageIndex(this.state(id)) >= stageIndex('documented'); }
  mastered(id) { return this.state(id) === 'mastered'; }
  entry(id) {
    const ghost = GHOSTS_BY_ID[id];
    if (!ghost) return null;
    const state = this.state(id);
    const record = this.index?.get?.(id) || null;
    const requirements = GHOST_TOOL_REQUIREMENTS[id] || { required: [], optional: [], methods: [], containable: false, multiPlayer: false, jumpscareRelated: false };
    return {
      ghost, state, record,
      known: state !== 'undiscovered',
      identity: stageIndex(state) >= stageIndex('identified'),
      loreUnlocked: stageIndex(state) >= stageIndex('documented'),
      requirements,
      evidenceOwned: record?.evidence?.length || 0,
      evidenceRequired: ghost.requiredEvidence?.length || ghost.evidence?.length || 0,
      jumpscares: JUMPSCARE_EVENTS.filter((e) => e.ghostId === id).map((e) => e.id),
    };
  }
  query(options = {}) {
    const search = String(options.search || '').trim().toLowerCase();
    const missing = !!options.missing;
    const undiscovered = !!options.undiscovered;
    const classification = options.classification && options.classification !== 'all' ? options.classification : null;
    const rarity = options.rarity && options.rarity !== 'all' ? options.rarity : null;
    const discovery = options.discovery && options.discovery !== 'all' ? options.discovery : null;
    const chapter = options.chapter && options.chapter !== 'all' ? options.chapter : null;
    const arc = options.arc && options.arc !== 'all' ? options.arc : null;
    const tool = options.tool && options.tool !== 'all' ? options.tool : null;
    const threat = options.threat && options.threat !== 'all' ? Number(options.threat) : null;
    const behavior = options.behavior && options.behavior !== 'all' ? options.behavior : null;
    return GHOSTS.filter((ghost) => {
      const state = this.state(ghost.id);
      const requirements = GHOST_TOOL_REQUIREMENTS[ghost.id] || { required: [], multiPlayer: false, jumpscareRelated: false };
      const chapterDef = ARCHIVE_CHAPTERS_BY_ID[ghost.chapter];
      if (classification && ghost.classification !== classification) return false;
      if (rarity && ghost.rarity !== rarity) return false;
      if (discovery && state !== discovery) return false;
      if (chapter && ghost.chapter !== chapter) return false;
      if (arc && chapterDef?.arcId !== arc) return false;
      if (tool && !requirements.required.includes(tool)) return false;
      if (threat && Number(ghost.threat) < threat) return false;
      if (behavior && ghost.behavior !== behavior) return false;
      if (options.boss && !(ghost.id === stage_owner(ghost.chapter) || ghost.rarity === 'legendary')) return false;
      if (options.jumpscare && !requirements.jumpscareRelated) return false;
      if (options.multiplayer && !requirements.multiPlayer) return false;
      if (missing && this.documented(ghost.id)) return false;
      if (undiscovered && state !== 'undiscovered') return false;
      if (search && !`${ghost.id} ${ghost.name} ${ghost.location} ${ghost.behavior} ${ghost.classification} ${(ghost.requiredEvidence || []).join(' ')} ${requirements.required.join(' ')}`.toLowerCase().includes(search)) return false;
      return true;
    }).map((ghost) => this.entry(ghost.id));
  }
  counts() {
    const out = Object.fromEntries(ARCHIVE_DISCOVERY_STATES.map((state) => [state, 0]));
    for (const ghost of GHOSTS) out[this.state(ghost.id)] += 1;
    return { ...out, total: GHOSTS.length, documented: out.documented + out.mastered, missing: GHOSTS.length - out.documented - out.mastered };
  }
  identify(id) { return this.index?.identify?.(id) || { ok: false, reason: 'no-index' }; }
  addEvidence(id, type) { return this.index?.addEvidence?.(id, type) || { ok: false, reason: 'no-index' }; }
  document(id) { return this.index?.document?.(id) || { ok: false, reason: 'no-index' }; }
  master(id) { return this.index?.master?.(id) || { ok: false, reason: 'no-index' }; }
}

const stage_owner = (chapterId) => ARCHIVE_BOSSES.find((b) => b.chapterId === chapterId)?.id || '';

// ---------------------------------------------------------------------------
// Jumpscare Index
// ---------------------------------------------------------------------------
export class JumpscareIndexManager {
  constructor(archive, options = {}) {
    this.archive = archive;
    this.index = options.index || null;
  }
  state(id) { return this.archive.jumpscares?.[id]?.state || 'undiscovered'; }
  isDocumented(id) { return this.state(id) === 'documented' || this.state(id) === 'mastered'; }
  record(id, state, source = 'play', now = Date.now()) {
    const event = JUMPSCARE_EVENTS_BY_ID[id];
    if (!event) return { ok: false, reason: 'unknown-event' };
    const current = this.archive.jumpscares[id] || { state: 'undiscovered', evidence: [], discoveredAt: 0, documentedAt: 0, rewardClaimed: false };
    const next = maxState(current.state, state);
    if (next === current.state && stageIndex(next) < stageIndex('encountered')) return { ok: false, reason: 'no-change' };
    this.archive.jumpscares[id] = {
      ...current, state: next,
      discoveredAt: current.discoveredAt || now,
      documentedAt: stageIndex(next) >= stageIndex('documented') ? (current.documentedAt || now) : current.documentedAt,
      source: current.source === 'evidence' ? current.source : source,
    };
    this.archive.stats.eventsDiscovered = Object.keys(this.archive.jumpscares).length;
    return { ok: true, event, state: next };
  }
  discover(id, source = 'play', now = Date.now()) {
    const result = this.record(id, 'encountered', source, now);
    if (!result.ok && this.isDocumented(id)) return { ok: false, reason: 'already-documented' };
    return result;
  }
  document(id, options = {}) {
    const event = JUMPSCARE_EVENTS_BY_ID[id];
    if (!event) return { ok: false, reason: 'unknown-event' };
    if (this.isDocumented(id)) return { ok: false, reason: 'duplicate' };
    const evidence = options.evidenceType ? [options.evidenceType] : [];
    if (!evidence.includes(event.evidenceType)) return { ok: false, reason: 'evidence-mismatch', required: event.evidenceType };
    const ghostState = indexState(this.index, event.ghostId);
    const hasEvidence = (this.index?.get?.(event.ghostId)?.evidence?.length || 0) > 0;
    if (stageIndex(ghostState) < stageIndex('encountered') && !hasEvidence) return { ok: false, reason: 'missing-evidence' };
    const result = this.record(id, 'documented', 'evidence', finite(options.now, Date.now()));
    if (!result.ok) return result;
    const record = this.archive.jumpscares[id];
    if (!record.rewardClaimed) {
      record.rewardClaimed = true;
      this.archive.stats.archiveXp += event.reward?.archiveXp || 0;
    }
    this.archive.stats.eventsDocumented = Object.values(this.archive.jumpscares)
      .filter((e) => e.state === 'documented' || e.state === 'mastered').length;
    return { ok: true, event, state: 'documented', xp: event.reward?.archiveXp || 0 };
  }
  master(id) {
    const current = this.archive.jumpscares?.[id];
    if (!current || !this.isDocumented(id)) return { ok: false, reason: 'not-documented' };
    current.state = 'mastered';
    return { ok: true, state: 'mastered' };
  }
  query(options = {}) {
    const category = options.category && options.category !== 'all' ? options.category : null;
    const state = options.state && options.state !== 'all' ? options.state : null;
    const missing = !!options.missing;
    const search = String(options.search || '').trim().toLowerCase();
    return JUMPSCARE_EVENTS.filter((event) => {
      const current = this.state(event.id);
      if (category && event.category !== category) return false;
      if (state && current !== state) return false;
      if (missing && this.isDocumented(event.id)) return false;
      if (search && !`${event.id} ${event.name} ${event.trigger} ${event.ghostId}`.toLowerCase().includes(search)) return false;
      return true;
    }).map((event) => ({
      ...event, state: this.state(event.id),
      documented: this.isDocumented(event.id),
      relatedGhost: this.index?.get?.(event.ghostId)?.stage || 'undiscovered',
      accessible: true,
    }));
  }
  counts() {
    const states = { undiscovered: 0, rumored: 0, encountered: 0, documented: 0, mastered: 0 };
    for (const event of JUMPSCARE_EVENTS) states[this.state(event.id)] += 1;
    return { ...states, total: JUMPSCARE_EVENTS.length };
  }
}

// ---------------------------------------------------------------------------
// Investigation Equipment
// ---------------------------------------------------------------------------
export class InvestigationEquipmentManager {
  constructor(options = {}) {
    this.archive = options.archive || defaultArchiveSave();
    this.veil = options.veil || null;
    this.eternal = options.eternal || null;
  }
  legacyOwned() {
    const owned = new Set();
    const veilOwned = this.veil?.save?.equipment?.owned || this.veil?.equipment?.owned || [];
    for (const id of veilOwned) if (ARCHIVE_TOOL_IDS.includes(id)) owned.add(id);
    const tiers = this.eternal?.save?.workshop?.tiers || this.eternal?.workshop?.tiers || {};
    for (const item of ETERNAL_EQUIPMENT) {
      const toolId = item.id === 'portable_lantern' ? 'portable_lantern' : item.id;
      if (!ARCHIVE_TOOL_IDS.includes(toolId)) continue;
      if (Number(tiers[item.id] || 1) >= 2 || item.essential) owned.add(toolId);
    }
    // The five core investigation tools are part of the starting field kit once
    // the Arc IX profile owns them; the archive itself never silently grants them.
    return owned;
  }
  owned() {
    return new Set([...this.legacyOwned(), ...(this.archive.equipment?.owned || [])]);
  }
  status(toolId) {
    if (!ARCHIVE_TOOLS_BY_ID[toolId]) return 'not-applicable';
    return this.owned().has(toolId) ? 'owned' : 'missing';
  }
  level(toolId) {
    if (!this.owned().has(toolId)) return 0;
    return clamp(Math.round(finite(this.archive.equipment?.upgrades?.[toolId], 1)), 1, ARCHIVE_LIMITS.maxToolUpgrades);
  }
  tool(toolId) {
    const tool = ARCHIVE_TOOLS_BY_ID[toolId];
    if (!tool) return null;
    return { ...tool, owned: this.owned().has(toolId), level: this.level(toolId), status: this.status(toolId) };
  }
  all() { return ARCHIVE_TOOLS.map((tool) => this.tool(tool.id)); }
  requirementsFor(ghostId) {
    const req = GHOST_TOOL_REQUIREMENTS[ghostId];
    if (!req) return null;
    const rows = (ids, optional) => ids.map((id) => ({ ...(ARCHIVE_TOOLS_BY_ID[id] || { id, name: id }), optional, status: this.status(id), owned: this.owned().has(id), level: this.level(id) }));
    return {
      ghostId,
      required: rows(req.required, false),
      optional: rows(req.optional, true),
      methods: req.methods,
      containable: req.containable,
      missing: req.required.filter((id) => !this.owned().has(id)),
      missingOptional: req.optional.filter((id) => !this.owned().has(id)),
    };
  }
  prepare(ghostId) {
    const requirements = this.requirementsFor(ghostId);
    if (!requirements) return { ok: false, reason: 'unknown-ghost' };
    return {
      ok: true, ghostId, requirements,
      ready: requirements.missing.length === 0,
      loadout: requirements.required.filter((id) => this.owned().has(id)),
      highlight: requirements.missing,
    };
  }
  upgrade(toolId) {
    if (!ARCHIVE_TOOLS_BY_ID[toolId]) return { ok: false, reason: 'unknown-tool' };
    if (!this.owned().has(toolId)) return { ok: false, reason: 'missing-tool' };
    const current = this.level(toolId);
    if (current >= ARCHIVE_LIMITS.maxToolUpgrades) return { ok: false, reason: 'max-level', level: current };
    this.archive.equipment.upgrades[toolId] = current + 1;
    return { ok: true, level: current + 1 };
  }
  own(toolId) {
    if (!ARCHIVE_TOOLS_BY_ID[toolId]) return { ok: false, reason: 'unknown-tool' };
    if (!this.archive.equipment.owned.includes(toolId)) this.archive.equipment.owned.push(toolId);
    if (!this.archive.equipment.upgrades[toolId]) this.archive.equipment.upgrades[toolId] = 1;
    return { ok: true, tool: this.tool(toolId) };
  }
}

// ---------------------------------------------------------------------------
// Evidence / capture / progress lifecycle
// ---------------------------------------------------------------------------
export class EvidenceAnalyzer {
  constructor(index, ghosts) { this.index = index; this.ghosts = ghosts; }
  analyze(ghostId) {
    const ghost = GHOSTS_BY_ID[ghostId];
    const entry = this.index?.get?.(ghostId);
    if (!ghost) return { ok: false, reason: 'unknown-ghost' };
    const owned = new Set(entry?.evidence || []);
    const required = ghost.requiredEvidence || ghost.evidence || [];
    return {
      ok: true, ghostId,
      owned: required.filter((id) => owned.has(id)),
      missing: required.filter((id) => !owned.has(id)),
      required,
      percent: Math.round((required.filter((id) => owned.has(id)).length / Math.max(1, required.length)) * 1000) / 10,
      canIdentify: !!(this.index?.get?.(ghostId) && (entry?.evidence?.length || 0) > 0),
      canDocument: !!(this.index?.hasAllEvidence?.(ghostId)),
      methods: GHOST_TOOL_REQUIREMENTS[ghostId]?.methods || [],
    };
  }
}

export class CaptureSystem {
  constructor(index, ghosts) { this.index = index; this.ghosts = ghosts; }
  eligible(ghostId) {
    const req = GHOST_TOOL_REQUIREMENTS[ghostId];
    const state = indexState(this.index, ghostId);
    return !!req?.containable && stageIndex(state) >= stageIndex('documented');
  }
  contain(ghostId) {
    if (!this.eligible(ghostId)) return { ok: false, reason: 'not-eligible' };
    const entry = this.index?.master?.(ghostId);
    return { ok: !!entry?.ok, state: entry?.ok ? 'mastered' : 'documented' };
  }
}

export class InvestigationProgressManager {
  constructor(archive) { this.archive = archive; }
  recordInvestigation(stageId, evidence = []) {
    if (!ARCHIVE_STAGES_BY_ID[stageId]) return { ok: false, reason: 'unknown-stage' };
    const record = this.archive.stageRecords[stageId] || (this.archive.stageRecords[stageId] = sanitizeRecord({}));
    record.investigation = true;
    record.notes = (record.notes || '').slice(0, ARCHIVE_LIMITS.maxNotes);
    record.lastCheckedAt = Date.now();
    record.collectibles = unique([...(record.collectibles || []), ...arr(evidence)]).slice(0, 400);
    return { ok: true, record };
  }
  recordAttempt(stageId) {
    if (!ARCHIVE_STAGES_BY_ID[stageId]) return { ok: false, reason: 'unknown-stage' };
    const record = this.archive.stageRecords[stageId] || (this.archive.stageRecords[stageId] = sanitizeRecord({}));
    record.attempts += 1;
    return { ok: true, attempts: record.attempts };
  }

  recordCollectible(stageId, collectibleId) {
    const stage = ARCHIVE_STAGES_BY_ID[stageId];
    if (!stage || !stage.collectibleIds.includes(collectibleId)) return { ok: false, reason: 'unknown-collectible' };
    const record = this.archive.stageRecords[stageId] || (this.archive.stageRecords[stageId] = sanitizeRecord({}));
    if (record.collectibles.includes(collectibleId)) return { ok: false, reason: 'duplicate' };
    record.collectibles.push(collectibleId);
    return { ok: true, collectibles: record.collectibles.length };
  }
}

// ---------------------------------------------------------------------------
// Archive Controller
// ---------------------------------------------------------------------------
export class ArchiveController {
  constructor(options = {}) {
    this.save = sanitizeArchiveSave(options.save || {});
    this.veil = options.veil || null;
    this.eternal = options.eternal || null;
    this.index = options.index || this.veil?.index || null;
    this.stageArchive = new StageArchiveManager({ veil: this.veil, eternal: this.eternal, archive: this.save });
    this.ghosts = new GhostArchiveManager(this.index, { archive: this.save });
    this.stageArchive.ghosts = this.ghosts;
    this.stageArchive.index = this.index;
    this.previews = new StagePreviewManager(this.stageArchive, { archive: this.save, index: this.index });
    this.previews.equipment = this.equipment = new InvestigationEquipmentManager({ archive: this.save, veil: this.veil, eternal: this.eternal });
    this.checker = new LevelCheckerService(this.stageArchive, { archive: this.save, index: this.index });
    this.jumpscares = new JumpscareIndexManager(this.save, { index: this.index });
    this.evidence = new EvidenceAnalyzer(this.index, this.ghosts);
    this.capture = new CaptureSystem(this.index, this.ghosts);
    this.progress = new InvestigationProgressManager(this.save);
  }

  stageStatus(stageId) { return this.stageArchive.status(stageId); }
  statistics() { return this.stageArchive.statistics(); }
  preview(stageId, options = {}) { return this.previews.preview(stageId, options); }
  openPreview(stageId, options = {}) { return this.previews.open(stageId, options); }
  checkStage(stageId) { return this.checker.stage(stageId); }
  checkChapter(chapterId) { return this.checker.chapter(chapterId); }
  checkArc(arcId) { return this.checker.arc(arcId); }
  ghostQuery(options = {}) { return this.ghosts.query(options); }
  ghostEntry(id) { return this.ghosts.entry(id); }
  jumpscareQuery(options = {}) { return this.jumpscares.query(options); }
  tools() { return this.equipment.all(); }
  prepare(ghostId) { return this.equipment.prepare(ghostId); }
  identifyGhost(id) { return this.ghosts.identify(id); }
  documentGhost(id) { return this.ghosts.document(id); }
  masterGhost(id) { return this.ghosts.master(id); }
  captureGhost(id) {
    const result = this.capture.contain(id);
    if (result.ok) this.save.stats.archiveXp += 25;
    return result;
  }

  observeGhost(id, now = Date.now()) {
    const events = JUMPSCARE_EVENTS.filter((e) => e.ghostId === id);
    let changed = 0;
    for (const event of events) {
      const current = this.jumpscares.state(event.id);
      if (current === 'undiscovered') { this.jumpscares.record(event.id, 'rumored', 'play', now); changed += 1; }
    }
    return { ok: true, changed, events: events.map((e) => e.id) };
  }

  documentJumpscare(id, options = {}) {
    const result = this.jumpscares.document(id, options);
    if (result.ok) this.evaluateAchievements();
    return result;
  }

  recordCase(options = {}) {
    if (options.hard) this.save.stats.hardCases += 1;
    if (options.stageId) this.progress.recordInvestigation(options.stageId, options.evidence || []);
    return this.save.stats;
  }

  evaluateAchievements(now = Date.now()) {
    const counts = this.ghosts.counts();
    const toolsOwned = this.equipment.owned().size;
    const stats = {
      encountered: counts.encountered + counts.identified + counts.investigated + counts.documented + counts.mastered,
      identified: counts.identified + counts.investigated + counts.documented + counts.mastered,
      documented: counts.documented + counts.mastered,
      mastered: counts.mastered,
      previews: this.save.stats.uniquePreviews,
      perfectChapters: ARCHIVE_CHAPTERS.filter((chapter) => {
        const stages = ARCHIVE_STAGES.filter((s) => s.chapterId === chapter.id);
        return stages.length > 0 && stages.every((s) => this.stageArchive.perfect(s.id));
      }).length,
      hardCases: this.save.stats.hardCases,
      documentedEvents: Object.values(this.save.jumpscares).filter((e) => e.state === 'documented' || e.state === 'mastered').length,
      toolsOwned,
    };
    const unlocked = [];
    for (const achievement of ARCHIVE_ACHIEVEMENTS) {
      if (this.save.achievements.includes(achievement.id)) continue;
      if ((Number(stats[achievement.metric]) || 0) >= achievement.target) {
        this.save.achievements.push(achievement.id);
        unlocked.push({ ...achievement, at: now });
      }
    }
    return { stats, unlocked, achievements: this.save.achievements };
  }

  dashboard() {
    const stats = this.statistics();
    const ghosts = this.ghosts.counts();
    const events = this.jumpscares.counts();
    const tools = this.equipment.all();
    const achievements = this.evaluateAchievements();
    return {
      stages: stats, ghosts, jumpscares: events,
      tools: { total: tools.length, owned: tools.filter((t) => t.owned).length },
      previews: { total: this.save.stats.previews, unique: this.save.stats.uniquePreviews },
      achievements: { unlocked: this.save.achievements.length, total: ARCHIVE_ACHIEVEMENTS.length, stats: achievements.stats },
      archiveXp: this.save.stats.archiveXp,
    };
  }

  toJSON() {
    this.save.savedAt = Date.now();
    return this.save;
  }
}
