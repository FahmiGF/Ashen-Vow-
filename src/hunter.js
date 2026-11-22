// Ashen Vow — Update XIX: The Hunter's Kit.
//
// A small, pure anti-ghost combat layer shared by Scary Mode, The Dread Beyond,
// The Veil of the Forgotten and The Eternal Night. It deliberately owns no DOM
// and no save access: the browser shell persists the returned state, while the
// deterministic simulation applies the effects.

export const HUNTER_SAVE_KEY = 'ashen-vow-hunter-v1';
export const HUNTER_START_MARKS = 180;
export const HUNTER_SCHEMA_VERSION = 1;
export const HUNTER_MAX_STACK = 12;
export const HUNTER_MARK_BONUS = 1.4;

/** Ghost-only tools. Every price is in Hunter's Marks, earned by banishing. */
export const HUNTER_ITEMS = Object.freeze([
  {
    id: 'salt_flare',
    name: 'Suluh Garam',
    shortName: 'SULUH',
    glyph: '✷',
    type: 'hunter',
    price: 30,
    pack: 1,
    color: '#ffd27a',
    desc: 'Membakar lingkaran garam. Menstun roh di sekitar, menandainya, dan menembus manifestasi.',
    effect: 'Stun 2,6 dtk · damage 18 · mark 6 dtk',
    radius: 250,
    damage: 18,
    stun: 2.6,
    mark: 6,
    cooldown: 0.65,
  },
  {
    id: 'grave_bell',
    name: 'Lonceng Kubur',
    shortName: 'LONCENG',
    glyph: '◉',
    type: 'hunter',
    price: 45,
    pack: 1,
    color: '#d6c7a1',
    desc: 'Gema perunggu yang memaksa roh berhenti dan menampakkan wujudnya.',
    effect: 'Stun 3,8 dtk · mark 8 dtk · radius 210',
    radius: 210,
    damage: 8,
    stun: 3.8,
    mark: 8,
    cooldown: 0.9,
  },
  {
    id: 'smoke_grenade',
    name: 'Granat Asap',
    shortName: 'ASAP',
    glyph: '☁',
    type: 'hunter',
    price: 42,
    pack: 1,
    color: '#b8c6d4',
    desc: 'Asap dingin memutus penglihatan roh. Kau tak terlihat sebentar, dan mereka kehilangan arah.',
    effect: 'Kabut 5 dtk · stun 1,8 dtk · kebal 1,4 dtk',
    radius: 300,
    damage: 0,
    stun: 1.8,
    mark: 3,
    smoke: 5,
    invuln: 1.4,
    aggroReset: true,
    cooldown: 0.8,
  },
  {
    id: 'spirit_bane',
    name: 'Peluru Roh',
    shortName: 'PELURU',
    glyph: '➶',
    type: 'hunter',
    price: 55,
    pack: 1,
    color: '#e8f6ff',
    desc: 'Proyektil perak berlapis doa. Menembus beberapa roh dan membakar manifestasi mereka.',
    effect: 'Damage 42 · 120 ke roh · pierce 3',
    damage: 42,
    spiritDamage: 120,
    stun: 1.2,
    mark: 6,
    pierce: true,
    maxHits: 3,
    projectile: { speed: 840, r: 6, life: 0.95 },
    cooldown: 0.45,
  },
  {
    id: 'ward_charm',
    name: 'Jimat Penjaga',
    shortName: 'JIMAT',
    glyph: '◈',
    type: 'hunter',
    price: 50,
    pack: 1,
    color: '#d8b96c',
    desc: 'Jimat yang menahan cakar roh. Damage roh turun drastis selama delapan detik.',
    effect: 'Damage roh −60% · 8 dtk',
    duration: 8,
    reduction: 0.6,
    cooldown: 1.1,
  },
]);

export const HUNTER_ITEM_BY_ID = Object.freeze(
  Object.fromEntries(HUNTER_ITEMS.map((item) => [item.id, item])),
);
export const HUNTER_ITEM_IDS = HUNTER_ITEMS.map((item) => item.id);

const clampInt = (value, fallback, lo, hi) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, Math.round(n)));
};

export function hunterItem(id) {
  return HUNTER_ITEM_BY_ID[id] || null;
}

export function defaultHunterSave() {
  return {
    schemaVersion: HUNTER_SCHEMA_VERSION,
    marks: HUNTER_START_MARKS,
    items: {},
    purchases: 0,
    banished: 0,
    uses: 0,
    lastAt: 0,
  };
}

/** Defensive save boundary: unknown item ids never enter the live stock. */
export function sanitizeHunterSave(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const items = {};
  const rawItems = source.items && typeof source.items === 'object' ? source.items : {};
  for (const id of HUNTER_ITEM_IDS) {
    const count = clampInt(rawItems[id], 0, 0, HUNTER_MAX_STACK);
    if (count > 0) items[id] = count;
  }
  return {
    schemaVersion: HUNTER_SCHEMA_VERSION,
    marks: clampInt(source.marks, HUNTER_START_MARKS, 0, 999999),
    items,
    purchases: clampInt(source.purchases, 0, 0, 999999),
    banished: clampInt(source.banished, 0, 0, 999999),
    uses: clampInt(source.uses, 0, 0, 999999),
    lastAt: clampInt(source.lastAt, 0, 0, Number.MAX_SAFE_INTEGER),
  };
}

export const hunterSanitizeMissing = (raw) => sanitizeHunterSave(raw || {});

export function hunterMarkCount(save = {}) {
  return sanitizeHunterSave(save).marks;
}

export function hunterStockCount(save = {}, id) {
  return sanitizeHunterSave(save).items[id] || 0;
}

export function hunterCanBuy(save = {}, id) {
  const item = hunterItem(id);
  if (!item) return { ok: false, reason: 'Barang tidak ditemukan.' };
  const current = save?.items?.[id] || 0;
  if (current >= HUNTER_MAX_STACK) return { ok: false, reason: 'Stok barang ini sudah penuh.', item };
  if ((Number(save?.marks) || 0) < item.price) return { ok: false, reason: 'Tanda Pemburu tidak cukup.', item, poor: true };
  return { ok: true, item, current };
}

/** Mutates the supplied save (main.js stores it), matching the shop economy. */
export function hunterBuy(save, id, at = 0) {
  const check = hunterCanBuy(save, id);
  if (!check.ok) return check;
  save.marks = Math.max(0, (Number(save.marks) || 0) - check.item.price);
  save.items = save.items && typeof save.items === 'object' ? save.items : {};
  save.items[id] = Math.min(HUNTER_MAX_STACK, (Number(save.items[id]) || 0) + check.item.pack);
  save.purchases = (Number(save.purchases) || 0) + 1;
  save.lastAt = at || Date.now();
  return { ok: true, item: check.item, count: save.items[id], marks: save.marks };
}

export function hunterGrant(save, id, amount = 1, at = 0) {
  const item = hunterItem(id);
  if (!item) return { ok: false, reason: 'Barang tidak ditemukan.' };
  save.items = save.items && typeof save.items === 'object' ? save.items : {};
  save.items[id] = Math.min(HUNTER_MAX_STACK, (Number(save.items[id]) || 0) + Math.max(0, Math.round(amount)));
  save.lastAt = at || Date.now();
  return { ok: true, item, count: save.items[id] || 0 };
}

export function hunterConsume(save, id, at = 0) {
  const item = hunterItem(id);
  if (!item) return { ok: false, reason: 'Barang tidak ditemukan.' };
  const count = Number(save?.items?.[id]) || 0;
  if (count <= 0) return { ok: false, reason: 'Stok habis.' };
  save.items[id] = count - 1;
  if (save.items[id] <= 0) delete save.items[id];
  save.uses = (Number(save.uses) || 0) + 1;
  save.lastAt = at || Date.now();
  return { ok: true, item, count: save.items[id] || 0 };
}

export function hunterReward(save, marks, at = 0) {
  const gain = clampInt(marks, 0, 0, 9999);
  if (!gain) return 0;
  save.marks = Math.min(999999, (Number(save.marks) || 0) + gain);
  save.lastAt = at || Date.now();
  return gain;
}

export function hunterSummary(save = {}) {
  const clean = sanitizeHunterSave(save);
  const stock = HUNTER_ITEMS.reduce((total, item) => total + (clean.items[item.id] || 0), 0);
  return {
    marks: clean.marks,
    stock,
    items: { ...clean.items },
    purchases: clean.purchases,
    banished: clean.banished,
    uses: clean.uses,
  };
}

/** True for every real ghost family currently shipped in the game. */
export function isSpiritEnemy(entity) {
  if (!entity) return false;
  return !!(
    entity.spiritEntity
    || entity.ghostKind
    || entity.ghostRarity
    || entity.scaryKind
    || entity.unnaturalKind
    || entity.dreadBoss
    || entity.veilBoss
    || entity.eternalBoss
  );
}

/** DamagePlayer receives either an object or the legacy `ghost:kind` string. */
export function isSpiritSource(source) {
  if (!source) return false;
  if (typeof source === 'string') return source === 'ghost' || source.startsWith('ghost:') || source.includes('spirit') || source.includes('wraith');
  if (source.spirit === true || source.ghost || source.ghostKind || source.scaryKind || source.unnaturalKind) return true;
  const type = String(source.type || source.kind || source.family || '');
  return type.startsWith('ghost:') || type.includes('spirit') || type.includes('wraith') || type === 'ghost';
}

/** Marks are earned only from hostile spirits, never from scenery or bosses twice. */
export function spiritBounty(entity) {
  if (!isSpiritEnemy(entity)) return 0;
  if (entity.dreadBoss || entity.veilBoss || entity.eternalBoss) return 120;
  const kind = entity.scaryKind || entity.unnaturalKind;
  const table = {
    hollow_wraith: 14,
    night_stalker: 18,
    silent_knight: 22,
    forgotten_one: 46,
    faceless_visitor: 16,
    pale_echo: 14,
    empty_knight: 20,
    ceiling_dweller: 24,
    forgotten_twin: 26,
  };
  if (kind && table[kind]) return table[kind];
  const rarity = String(entity.ghostRarity || '').toLowerCase();
  if (rarity === 'mythic') return 40;
  if (rarity === 'legendary') return 28;
  if (rarity === 'rare') return 18;
  return 12;
}
