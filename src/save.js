// Ashen Vow — save layer (Master Plan 3.0 Phase 1, v0.38.0).
//
// Owns every localStorage key the game writes. Pure apart from the storage
// object it is given, so Node tests drive it with an in-memory store.
//
// Layout
//   ashen-vow-slot<N>-<area>-v1     per-profile data, N = 1..SAVE_SLOT_COUNT
//   ashen-vow-active-slot-v1        which profile is loaded
//   ashen-vow-slot-backup-<area>-v1 automatic copy of the last profile that
//                                   was switched away from, imported over or
//                                   deleted (24 h undo window for deletes)
//   ashen-vow-settings-v1 / ashen-vow-voice-v1  global, never per slot
//
// Legacy keys (v0.36 and earlier, one profile) migrate into slot 1 on first
// boot and are kept untouched for one release so an older build still loads.

export const SAVE_SLOT_COUNT = 3;
export const SAVE_FORMAT = 'ashen-vow-save';
export const SAVE_FORMAT_VERSION = 1;
export const SAVE_DEBOUNCE_MS = 2000;
export const SAVE_UNDO_MS = 24 * 60 * 60 * 1000;
export const ACTIVE_SLOT_KEY = 'ashen-vow-active-slot-v1';

/** Per-slot areas and the single-profile key each one used before v0.38. */
export const SAVE_AREAS = Object.freeze({
  progress: 'ashen-vow-progress-v1',
  character: 'ashen-vow-character-v1',
  horror: 'ashen-vow-horror-v1',
  dread: 'ashen-vow-dread-v1',
  veil: 'ashen-vow-veil-v1',
  eternal: 'ashen-vow-eternal-v1',
  archive: 'ashen-vow-archive-v1',
  horror3d: 'ashen-vow-3dhorror-v1',
  hunter: 'ashen-vow-hunter-v1',
  secrets: 'ashen-vow-secrets-v1',
  labCheckpoint: 'ashen-vow-labyrinth-checkpoint-v1',
});
export const SAVE_AREA_IDS = Object.freeze(Object.keys(SAVE_AREAS));
/** Keys that stay global across profiles. */
export const GLOBAL_KEYS = Object.freeze(['ashen-vow-settings-v1', 'ashen-vow-voice-v1']);

const LEGACY_TO_AREA = new Map(Object.entries(SAVE_AREAS).map(([area, key]) => [key, area]));

export function slotKey(slot, area) {
  return `ashen-vow-slot${slot}-${area}-v1`;
}

export function backupKey(area) {
  return `ashen-vow-slot-backup-${area}-v1`;
}

export function clampSlot(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 1 && n <= SAVE_SLOT_COUNT ? n : 1;
}

/** Area id for a legacy key, or null for keys the save layer does not own. */
export function areaForLegacyKey(key) {
  return LEGACY_TO_AREA.get(key) || null;
}

/** FNV-1a 32-bit over a string, as 8 hex digits. Detects edits, not attacks. */
export function checksum(text) {
  let h = 0x811c9dc5;
  const s = String(text);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function canonicalAreas(areas) {
  return JSON.stringify(SAVE_AREA_IDS.filter((id) => typeof areas[id] === 'string').map((id) => [id, areas[id]]));
}

function safeGet(storage, key) {
  try { return storage.getItem(key); } catch { return null; }
}

function safeSet(storage, key, value) {
  try { storage.setItem(key, value); return true; } catch { return false; }
}

function safeRemove(storage, key) {
  try { storage.removeItem(key); } catch { /* storage unavailable */ }
}

function parseJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

/**
 * Create the save store.
 * @param {Storage} storage  localStorage or a compatible object
 * @param {{ debounceMs?: number, now?: () => number, setTimer?: Function, clearTimer?: Function, mirrorLegacy?: boolean }} options
 */
export function createSaveStore(storage, options = {}) {
  const debounceMs = Number.isFinite(options.debounceMs) ? Math.max(0, options.debounceMs) : SAVE_DEBOUNCE_MS;
  const now = options.now || (() => Date.now());
  const setTimer = options.setTimer || ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = options.clearTimer || ((id) => clearTimeout(id));
  const pending = new Map(); // key -> value
  const lastWrite = new Map(); // key -> timestamp
  let timer = null;
  let writes = 0;
  let activeSlot = clampSlot(safeGet(storage, ACTIVE_SLOT_KEY) || 1);

  function keyFor(area) {
    if (!SAVE_AREAS[area]) throw new Error(`unknown save area ${area}`);
    return slotKey(activeSlot, area);
  }

  const mirrorLegacy = options.mirrorLegacy === true;
  const resolve = (value) => (typeof value === 'function' ? value() : value);

  // Slot 1 is mirrored to the pre-v0.38 keys for one release, so a downgrade
  // (or a tool that reads the old key) still finds the first profile.
  function legacyFor(key) {
    const match = /^ashen-vow-slot(\d)-([a-zA-Z0-9]+)-v1$/.exec(key);
    return match && Number(match[1]) === 1 && SAVE_AREAS[match[2]] ? SAVE_AREAS[match[2]] : null;
  }

  function writeNow(key, value) {
    const text = resolve(value);
    if (text === null || text === undefined) safeRemove(storage, key);
    else safeSet(storage, key, String(text));
    const legacy = mirrorLegacy ? legacyFor(key) : null;
    if (legacy) {
      if (text === null || text === undefined) safeRemove(storage, legacy);
      else safeSet(storage, legacy, String(text));
    }
    if (/-progress-v1$/.test(key)) safeSet(storage, key.replace(/-progress-v1$/, '-meta-v1'), JSON.stringify({ updatedAt: now() }));
    lastWrite.set(key, now());
    writes += 1;
  }

  function schedule() {
    if (timer !== null) return;
    let wait = debounceMs;
    for (const key of pending.keys()) {
      const since = now() - (lastWrite.get(key) || -Infinity);
      wait = Math.min(wait, Math.max(0, debounceMs - since));
    }
    timer = setTimer(() => { timer = null; flushDue(); }, wait);
  }

  function flushDue() {
    const t = now();
    for (const [key, value] of [...pending]) {
      if (t - (lastWrite.get(key) || -Infinity) >= debounceMs) {
        pending.delete(key);
        writeNow(key, value);
      }
    }
    if (pending.size) schedule();
  }

  /** Read an area of the active slot (pending writes win over storage). */
  function read(area) {
    const key = keyFor(area);
    if (pending.has(key)) {
      const value = resolve(pending.get(key));
      return value === null || value === undefined ? null : String(value);
    }
    return safeGet(storage, key);
  }

  /**
   * Write an area of the active slot. The first write of a key goes straight
   * to storage; later ones are coalesced to at most one per debounce window.
   * `value` may be a function: it is only serialized when the write lands, so
   * a burst of saves costs one JSON.stringify instead of one per call.
   */
  function write(area, value) {
    const key = keyFor(area);
    const text = typeof value === 'function' ? value : value === null || value === undefined ? null : String(value);
    const since = now() - (lastWrite.get(key) || -Infinity);
    if (since >= debounceMs && !pending.has(key)) {
      writeNow(key, text);
      return;
    }
    pending.set(key, text);
    schedule();
  }

  function remove(area) {
    write(area, null);
  }

  /** Write everything that is pending, now. Call on pagehide/visibilitychange. */
  function flush() {
    if (timer !== null) { clearTimer(timer); timer = null; }
    for (const [key, value] of [...pending]) {
      pending.delete(key);
      writeNow(key, value);
    }
  }

  function readSlotAreas(slot) {
    const areas = {};
    for (const id of SAVE_AREA_IDS) {
      const key = slotKey(slot, id);
      const value = pending.has(key) ? resolve(pending.get(key)) : safeGet(storage, key);
      if (typeof value === 'string') areas[id] = value;
    }
    return areas;
  }

  function slotHasData(slot) {
    return Object.keys(readSlotAreas(slot)).length > 0;
  }

  /**
   * Copy the single-profile keys into slot 1 when slot 1 is still empty.
   * Legacy keys are left in place for one release.
   */
  function migrateLegacy() {
    if (slotHasData(1)) return { migrated: false, areas: [] };
    const moved = [];
    for (const [area, legacy] of Object.entries(SAVE_AREAS)) {
      const value = safeGet(storage, legacy);
      if (typeof value === 'string') {
        safeSet(storage, slotKey(1, area), value);
        moved.push(area);
      }
    }
    if (moved.length && !safeGet(storage, ACTIVE_SLOT_KEY)) safeSet(storage, ACTIVE_SLOT_KEY, '1');
    return { migrated: moved.length > 0, areas: moved };
  }

  function backupSlot(slot) {
    const areas = readSlotAreas(slot);
    for (const id of SAVE_AREA_IDS) {
      if (typeof areas[id] === 'string') safeSet(storage, backupKey(id), areas[id]);
      else safeRemove(storage, backupKey(id));
    }
    safeSet(storage, backupKey('meta'), JSON.stringify({ slot, at: now() }));
  }

  function setActiveSlot(slot) {
    const next = clampSlot(slot);
    flush();
    activeSlot = next;
    safeSet(storage, ACTIVE_SLOT_KEY, String(next));
    return next;
  }

  /** Card data for the slot picker. Never throws on corrupt data. */
  function slotSummary(slot) {
    const n = clampSlot(slot);
    const areas = readSlotAreas(n);
    const progress = parseJson(areas.progress || 'null');
    const character = parseJson(areas.character || 'null');
    const empty = Object.keys(areas).length === 0;
    const cleared = Array.isArray(progress?.cleared) ? progress.cleared.filter(Boolean).length : 0;
    const playSeconds = progress && typeof progress.stageTimes === 'object' && progress.stageTimes
      ? Object.values(progress.stageTimes).reduce((sum, entry) => sum + (Number(entry?.best) || 0) * Math.max(1, Number(entry?.clears) || 1), 0)
      : 0;
    const arcs = [
      ['crusade', 'Arc III · Radiant Crusade'], ['fallen', 'Arc II · The Fallen Ones'],
      ['lanternwake', 'BAB X · Lanternwake'], ['cistern', 'BAB IX · Tidewrought Cistern'],
    ];
    let furthest = cleared >= 8 ? 'Puncak Sumpah' : cleared > 0 ? `${cleared} ruang` : 'Belum mulai';
    for (const [key, label] of arcs) {
      const block = progress?.[key];
      if (block && (block.boss === true || block.ascended || (block.bosses && Object.values(block.bosses).some(Boolean)))) { furthest = label; break; }
    }
    const meta = parseJson(safeGet(storage, slotKey(n, 'meta')) || 'null');
    return {
      slot: n,
      empty,
      active: n === activeSlot,
      characterId: character?.characterId || null,
      cleared,
      furthest,
      playSeconds: Math.round(playSeconds),
      updatedAt: Number(meta?.updatedAt) || 0,
    };
  }

  /** One JSON document per slot, versioned and checksummed. */
  function exportSlot(slot = activeSlot) {
    flush();
    const n = clampSlot(slot);
    const areas = readSlotAreas(n);
    return JSON.stringify({
      format: SAVE_FORMAT,
      version: SAVE_FORMAT_VERSION,
      slot: n,
      exportedAt: now(),
      areas,
      checksum: checksum(canonicalAreas(areas)),
    }, null, 2);
  }

  /**
   * Validate an export file. `sanitizers[area](parsedJson)` may repair each
   * area; anything they cannot parse is dropped rather than trusted.
   */
  function parseExport(text, sanitizers = {}) {
    const doc = parseJson(text);
    if (!doc || typeof doc !== 'object') return { ok: false, error: 'not-json' };
    if (doc.format !== SAVE_FORMAT) return { ok: false, error: 'wrong-format' };
    if (Number(doc.version) > SAVE_FORMAT_VERSION) return { ok: false, error: 'newer-version' };
    if (!doc.areas || typeof doc.areas !== 'object') return { ok: false, error: 'no-areas' };
    const areas = {};
    for (const id of SAVE_AREA_IDS) if (typeof doc.areas[id] === 'string') areas[id] = doc.areas[id];
    if (checksum(canonicalAreas(areas)) !== doc.checksum) return { ok: false, error: 'checksum' };
    const clean = {};
    for (const [id, value] of Object.entries(areas)) {
      const sanitize = sanitizers[id];
      if (!sanitize) { clean[id] = value; continue; }
      const parsed = parseJson(value);
      if (parsed === null) continue;
      try { clean[id] = JSON.stringify(sanitize(parsed)); } catch { /* drop the area */ }
    }
    if (!Object.keys(clean).length) return { ok: false, error: 'empty' };
    return { ok: true, areas: clean };
  }

  /** Import into a slot. The slot's previous contents go to the backup. */
  function importSlot(slot, text, sanitizers = {}) {
    const result = parseExport(text, sanitizers);
    if (!result.ok) return result;
    flush();
    const n = clampSlot(slot);
    backupSlot(n);
    for (const id of SAVE_AREA_IDS) {
      if (typeof result.areas[id] === 'string') safeSet(storage, slotKey(n, id), result.areas[id]);
      else safeRemove(storage, slotKey(n, id));
    }
    safeSet(storage, slotKey(n, 'meta'), JSON.stringify({ updatedAt: now() }));
    return { ok: true, slot: n, areas: Object.keys(result.areas) };
  }

  /** Delete a slot, keeping a backup that `undoDelete` restores for 24 h. */
  function deleteSlot(slot) {
    flush();
    const n = clampSlot(slot);
    backupSlot(n);
    safeSet(storage, backupKey('deleted'), JSON.stringify({ slot: n, at: now() }));
    for (const id of [...SAVE_AREA_IDS, 'meta']) safeRemove(storage, slotKey(n, id));
    return { ok: true, slot: n, undoUntil: now() + SAVE_UNDO_MS };
  }

  function undoDelete() {
    const info = parseJson(safeGet(storage, backupKey('deleted')) || 'null');
    if (!info || now() - Number(info.at) > SAVE_UNDO_MS) return { ok: false, error: 'expired' };
    const n = clampSlot(info.slot);
    if (slotHasData(n)) return { ok: false, error: 'slot-in-use' };
    for (const id of SAVE_AREA_IDS) {
      const value = safeGet(storage, backupKey(id));
      if (typeof value === 'string') safeSet(storage, slotKey(n, id), value);
    }
    safeRemove(storage, backupKey('deleted'));
    return { ok: true, slot: n };
  }

  return {
    get activeSlot() { return activeSlot; },
    get pendingCount() { return pending.size; },
    get writeCount() { return writes; },
    keyFor,
    read,
    write,
    remove,
    flush,
    migrateLegacy,
    setActiveSlot,
    slotHasData,
    slotSummary,
    slots: () => Array.from({ length: SAVE_SLOT_COUNT }, (_, i) => slotSummary(i + 1)),
    exportSlot,
    parseExport,
    importSlot,
    deleteSlot,
    undoDelete,
  };
}

/** In-memory Storage for tests and for browsers that block localStorage. */
export function memoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); },
    key: (i) => [...map.keys()][i] ?? null,
    get length() { return map.size; },
    _map: map,
  };
}
