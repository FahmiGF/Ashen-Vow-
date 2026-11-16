// Ashen Vow — Pondok Umpan (fishing).
//
// Pure data and arithmetic: nine baits in three price tiers, twenty-five fish in
// five rarity tiers, exact catch odds for every bait, the reel timing window,
// the bait-shack economy and the index/progress model. No DOM, no canvas hooks
// beyond `drawFishingIcon(ctx, ...)`, which takes a context the caller owns, so
// the Node suite can prove every number without a browser.

export const FISHING_NAME = 'PONDOK UMPAN';
export const FISHING_LOCATION = 'Pondok Tepi Danau Abu';
export const FISHING_SUBTITLE = 'Umpan lebih baik, ikan lebih besar. Koin dari tangkapan membeli umpan berikutnya.';

export const FISHING_STARTER_BAIT = 'worm';
export const FISHING_STARTER_BAIT_COUNT = 10;
export const FISHING_START_COINS = 250;
export const FISHING_BAIT_MAX = 999;
export const FISHING_REEL_SWEEP = 1.35; // seconds for one full left→right pass

// ── Baits ────────────────────────────────────────────────────────────────
// `chances` is the tier-1…tier-5 split in percent. Better bait shifts weight
// upward; the index shows the resulting per-fish odds.
export const FISHING_BAITS = [
  {
    id: 'worm',
    name: 'Cacing Tanah',
    short: 'Cacing',
    tier: 1,
    price: 25,
    color: '#9d6b46',
    accent: '#e6b98c',
    glyph: '〰',
    blurb: 'Umpan pemula yang murah dan selalu tersedia. Ikan kecil menyukainya.',
    chances: [62, 24, 10, 3.5, 0.5],
  },
  {
    id: 'cricket',
    name: 'Jangkrik Hidup',
    short: 'Jangkrik',
    tier: 1,
    price: 25,
    color: '#6f7f3a',
    accent: '#c9dd8a',
    glyph: '⌇',
    blurb: 'Berisik di kail, disukai ikan permukaan yang cepat menyambar.',
    chances: [58, 26, 11, 4, 1],
  },
  {
    id: 'cheese',
    name: 'Umpan Keju',
    short: 'Keju',
    tier: 1,
    price: 25,
    color: '#c9a13f',
    accent: '#ffe9a8',
    glyph: '▣',
    blurb: 'Aroma tajam menahan ikan di sekitar kail lebih lama.',
    chances: [54, 28, 12, 5, 1],
  },
  {
    id: 'minnow',
    name: 'Ikan Kecil (Minnow)',
    short: 'Minnow',
    tier: 2,
    price: 50,
    color: '#7d94a8',
    accent: '#d6e6f2',
    glyph: '><>',
    blurb: 'Umpan hidup untuk predator kecil. Mulai memancing ikan bertaring.',
    chances: [40, 32, 18, 8, 2],
  },
  {
    id: 'clam',
    name: 'Kerang Segar',
    short: 'Kerang',
    tier: 2,
    price: 50,
    color: '#a98f7c',
    accent: '#f0dcc8',
    glyph: '◗',
    blurb: 'Bau laut yang kuat; kerang dan kepiting datang lebih sering.',
    chances: [36, 32, 20, 9, 3],
  },
  {
    id: 'squid',
    name: 'Cumi-cumi',
    short: 'Cumi',
    tier: 2,
    price: 50,
    color: '#b8788c',
    accent: '#f3c6d4',
    glyph: '⋔',
    blurb: 'Kenyal dan berdarah; ikan malam menganggapnya hidangan.',
    chances: [32, 30, 24, 10, 4],
  },
  {
    id: 'slicedfish',
    name: 'Irisan Ikan',
    short: 'Irisan',
    tier: 3,
    price: 100,
    color: '#c4785f',
    accent: '#ffcdb4',
    glyph: '≡',
    blurb: 'Potongan daging tebal untuk ikan besar yang malas mengejar.',
    chances: [22, 28, 26, 16, 8],
  },
  {
    id: 'shrimp',
    name: 'Udang Mentah',
    short: 'Udang',
    tier: 3,
    price: 100,
    color: '#c96a5a',
    accent: '#ffc6b4',
    glyph: '≈',
    blurb: 'Umpan premium: ikan langka dan raksasa sama-sama tertarik.',
    chances: [18, 26, 28, 18, 10],
  },
  {
    id: 'glowworm',
    name: 'Cacing Cahaya',
    short: 'Cahaya',
    tier: 3,
    price: 100,
    color: '#5fb7c9',
    accent: '#d8fbff',
    glyph: '✦',
    blurb: 'Bercahaya di air keruh. Satu-satunya umpan yang benar-benar memanggil ikan mitos.',
    chances: [12, 22, 28, 24, 14],
  },
];

export const FISHING_BAIT_TIERS = [
  { tier: 1, name: 'UMPAN DASAR', price: 25, note: 'ikan kecil & sedang' },
  { tier: 2, name: 'UMPAN LANJUTAN', price: 50, note: 'predator & kerang' },
  { tier: 3, name: 'UMPAN PREMIUM', price: 100, note: 'ikan langka & mitos' },
];

// ── Fish ──────────────────────────────────────────────────────────────────
export const FISH_RARITIES = [
  { tier: 1, id: 'common', name: 'UMUM', color: '#93b47c', reelHalf: 0.3 },
  { tier: 2, id: 'uncommon', name: 'TIDAK UMUM', color: '#74aecb', reelHalf: 0.24 },
  { tier: 3, id: 'rare', name: 'LANGKA', color: '#a688d8', reelHalf: 0.17 },
  { tier: 4, id: 'epic', name: 'EPIK', color: '#d99a55', reelHalf: 0.11 },
  { tier: 5, id: 'mythic', name: 'MITOS', color: '#e7677b', reelHalf: 0.07 },
];

// weight is relative inside a tier; minKg/maxKg drive the catch size roll.
export const FISH = [
  { id: 'anchovy', name: 'Ikan Teri', tier: 1, weight: 30, minKg: 0.02, maxKg: 0.08, value: 8, shape: 'slender', body: '#9fb6c4', fin: '#d7e6ef', accent: '#3f5561', pattern: 'stripe', note: 'Bergerombol di tepi dermaga dan nyaris tidak pernah sendirian.' },
  { id: 'carp_small', name: 'Ikan Mas Muda', tier: 1, weight: 26, minKg: 0.2, maxKg: 0.9, value: 11, shape: 'round', body: '#c08a4a', fin: '#f0c286', accent: '#6b3f1f', pattern: 'scales', note: 'Sisik keemasannya masih tipis; sering dilepas lagi oleh pemancing lama.' },
  { id: 'eel_small', name: 'Belut Lumpur', tier: 1, weight: 18, minKg: 0.15, maxKg: 0.7, value: 10, shape: 'eel', body: '#6d6a4c', fin: '#a9a679', accent: '#2f2f1f', pattern: 'plain', note: 'Bersembunyi di dasar, menelan umpan tanpa menarik pelampung.' },
  { id: 'crab_small', name: 'Kepiting Kecil', tier: 1, weight: 12, minKg: 0.1, maxKg: 0.4, value: 12, shape: 'shell', body: '#b2683f', fin: '#e2a077', accent: '#4d2416', pattern: 'spots', note: 'Mencapit kail dan menolak melepas sampai kau menariknya.' },
  { id: 'river_shrimp', name: 'Udang Sungai', tier: 1, weight: 8, minKg: 0.02, maxKg: 0.1, value: 9, shape: 'squid', body: '#c47a68', fin: '#ffc0ac', accent: '#5b2a20', pattern: 'plain', note: 'Transparan seperti kaca, hampir tak terlihat di air keruh.' },
  { id: 'green_mussel', name: 'Kerang Hijau', tier: 1, weight: 6, minKg: 0.05, maxKg: 0.25, value: 13, shape: 'shell', body: '#5f7d5a', fin: '#a6c39c', accent: '#25301f', pattern: 'stripe', note: 'Menempel di tiang dermaga; dibuka dengan pisau kecil.' },

  { id: 'tilapia', name: 'Ikan Nila', tier: 2, weight: 28, minKg: 0.4, maxKg: 1.8, value: 22, shape: 'round', body: '#8a9aa0', fin: '#c9d7dc', accent: '#3c4a50', pattern: 'stripe', note: 'Ikan pekerja keras dari danau yang tenang.' },
  { id: 'catfish', name: 'Ikan Lele', tier: 2, weight: 24, minKg: 0.6, maxKg: 3.2, value: 26, shape: 'slender', body: '#5f5747', fin: '#a2957c', accent: '#2a251c', pattern: 'spots', note: 'Kumisnya meraba dasar danau sebelum menyambar.' },
  { id: 'mackerel', name: 'Ikan Kembung', tier: 2, weight: 20, minKg: 0.3, maxKg: 1.2, value: 24, shape: 'slender', body: '#7d9cb0', fin: '#d3e6f0', accent: '#28414f', pattern: 'stripe', note: 'Punggung biru bergaris, disukai pasar.' },
  { id: 'squid_small', name: 'Cumi Kecil', tier: 2, weight: 14, minKg: 0.2, maxKg: 0.8, value: 28, shape: 'squid', body: '#b8849a', fin: '#f4cade', accent: '#4a2436', pattern: 'spots', note: 'Menyemprotkan tinta saat diangkat dari air.' },
  { id: 'stone_crab', name: 'Kepiting Batu', tier: 2, weight: 9, minKg: 0.8, maxKg: 2.4, value: 30, shape: 'shell', body: '#8d7a63', fin: '#cbb79c', accent: '#3b3125', pattern: 'plain', note: 'Cangkangnya keras seperti batu sungai.' },
  { id: 'clownfish', name: 'Ikan Badut', tier: 2, weight: 5, minKg: 0.1, maxKg: 0.35, value: 32, shape: 'round', body: '#e08a3c', fin: '#ffd9a8', accent: '#f5f1e6', pattern: 'band', note: 'Belang putihnya tetap cerah walau diangkat dari air gelap.' },

  { id: 'snapper', name: 'Ikan Kakap', tier: 3, weight: 26, minKg: 1.5, maxKg: 6, value: 55, shape: 'round', body: '#c9695a', fin: '#f4b8a4', accent: '#5b2318', pattern: 'scales', note: 'Mata merah menyala, tarikannya menguji senar.' },
  { id: 'salmon', name: 'Ikan Salmon', tier: 3, weight: 22, minKg: 2, maxKg: 8, value: 62, shape: 'slender', body: '#d98a7c', fin: '#ffd0c4', accent: '#6b2d24', pattern: 'spots', note: 'Berenang melawan arus sampai ke hulu sungai.' },
  { id: 'young_tuna', name: 'Tuna Muda', tier: 3, weight: 18, minKg: 3, maxKg: 12, value: 70, shape: 'slender', body: '#4f6f8c', fin: '#9fc3d8', accent: '#1d2f3d', pattern: 'plain', note: 'Tubuhnya hangat saat disentuh, seperti mesin kecil.' },
  { id: 'octopus_small', name: 'Gurita Kecil', tier: 3, weight: 14, minKg: 0.9, maxKg: 4, value: 66, shape: 'squid', body: '#9a6f88', fin: '#d9b6c8', accent: '#3a2033', pattern: 'spots', note: 'Melepas satu lengannya untuk kabur; lengannya tumbuh lagi.' },
  { id: 'young_lobster', name: 'Lobster Muda', tier: 3, weight: 12, minKg: 0.7, maxKg: 2.5, value: 74, shape: 'shell', body: '#b8503f', fin: '#f0917c', accent: '#4d1a12', pattern: 'band', note: 'Capitnya sudah sekuat kepiting dewasa.' },
  { id: 'stingray', name: 'Ikan Pari', tier: 3, weight: 8, minKg: 1.2, maxKg: 5, value: 78, shape: 'flat', body: '#6f6f5c', fin: '#a8a890', accent: '#2d2d22', pattern: 'spots', note: 'Terbang di dasar danau seperti layar lepas.' },

  { id: 'marlin', name: 'Ikan Marlin', tier: 4, weight: 34, minKg: 12, maxKg: 45, value: 180, shape: 'spiky', body: '#3f5f86', fin: '#9cc0e0', accent: '#16283a', pattern: 'stripe', note: 'Moncongnya seperti tombak dan lompatannya membelah kabut.' },
  { id: 'young_shark', name: 'Hiu Muda', tier: 4, weight: 28, minKg: 18, maxKg: 60, value: 210, shape: 'spiky', body: '#6b7784', fin: '#c3cdd6', accent: '#232b33', pattern: 'plain', note: 'Belum dewasa, tapi sudah tahu bahwa kau yang mengail.' },
  { id: 'giant_crab', name: 'Kepiting Raksasa', tier: 4, weight: 22, minKg: 8, maxKg: 30, value: 195, shape: 'shell', body: '#8a4a32', fin: '#d98a66', accent: '#3a170e', pattern: 'spots', note: 'Capitnya bisa memutus senar sejari.' },
  { id: 'electric_eel', name: 'Belut Listrik', tier: 4, weight: 16, minKg: 6, maxKg: 22, value: 230, shape: 'eel', body: '#4c5560', fin: '#8fd8e0', accent: '#1a2026', pattern: 'stripe', note: 'Air di sekitarnya bergetar sebelum kau melihatnya.' },

  { id: 'silver_dragon', name: 'Ikan Naga Perak', tier: 5, weight: 40, minKg: 30, maxKg: 90, value: 620, shape: 'eel', body: '#c9d3dc', fin: '#ffffff', accent: '#6b8fa8', pattern: 'scales', note: 'Sisiknya dingin seperti logam dan bersinar di bawah bulan.' },
  { id: 'moonfish', name: 'Ikan Bulan', tier: 5, weight: 34, minKg: 20, maxKg: 70, value: 680, shape: 'flat', body: '#dfe7f5', fin: '#a8c4ff', accent: '#5b6f9c', pattern: 'glow', note: 'Hanya muncul saat danau memantulkan cahaya paling terang.' },
  { id: 'leviathan_fry', name: 'Leviathan Kecil', tier: 5, weight: 26, minKg: 60, maxKg: 180, value: 900, shape: 'spiky', body: '#2f4a52', fin: '#7fd3c8', accent: '#0f2226', pattern: 'glow', note: 'Anak dari sesuatu yang seharusnya tidak muat di danau ini.' },
];

export const FISH_TOTAL = FISH.length;
export const BAIT_TOTAL = FISHING_BAITS.length;

export function fishingBaitById(id) {
  return FISHING_BAITS.find((bait) => bait.id === id) || null;
}

export function fishingFishById(id) {
  return FISH.find((fish) => fish.id === id) || null;
}

export function fishRarity(tier) {
  return FISH_RARITIES.find((entry) => entry.tier === tier) || FISH_RARITIES[0];
}

export function fishTierOf(fish) {
  return Math.max(1, Math.min(5, Math.floor(Number(fish?.tier) || 1)));
}

// Split a total percentage across one tier's fish, proportional to weight.
function normalizeChances(entries) {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.value) || 0), 0);
  if (!entries.length) return [];
  if (total <= 0) return entries.map((entry) => ({ key: entry.key, chance: 0 }));
  const out = entries.map((entry) => ({
    key: entry.key,
    chance: Math.round((Math.max(0, Number(entry.value) || 0) / total) * 1000) / 10,
  }));
  const sum = out.reduce((acc, entry) => acc + entry.chance, 0);
  const diff = Math.round((100 - sum) * 10) / 10;
  if (Math.abs(diff) >= 0.05) {
    let target = 0;
    for (let i = 1; i < out.length; i++) if (out[i].chance > out[target].chance) target = i;
    out[target].chance = Math.round((out[target].chance + diff) * 10) / 10;
  }
  return out;
}

// Normalized tier-1…tier-5 percentages for a bait (always sums to 100).
export function baitTierChances(baitId) {
  const bait = fishingBaitById(baitId);
  if (!bait) return [];
  return normalizeChances(bait.chances.map((value, index) => ({ key: index + 1, value })))
    .map((entry) => ({ tier: entry.key, chance: entry.chance }));
}

// Split a percentage across weighted members so the parts add up to exactly
// `total` on a tenth-of-a-percent grid (largest-remainder rounding).
function splitPercent(total, members, weightOf) {
  const units = Math.max(0, Math.round((Number(total) || 0) * 10));
  const weightTotal = members.reduce((sum, member) => sum + Math.max(0, weightOf(member)), 0);
  if (!members.length) return [];
  if (weightTotal <= 0) return members.map((member, index) => ({ member, chance: index === 0 ? units / 10 : 0 }));
  const raw = members.map((member) => (Math.max(0, weightOf(member)) / weightTotal) * units);
  const parts = raw.map((value) => Math.floor(value));
  let remainder = units - parts.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index);
  for (let i = 0; i < order.length && remainder > 0; i++, remainder--) parts[order[i].index] += 1;
  return members.map((member, index) => ({ member, chance: parts[index] / 10 }));
}

// Every fish with its exact catch chance for one bait; sums to 100.
export function fishingCatchTable(baitId) {
  const bait = fishingBaitById(baitId);
  if (!bait) return [];
  const tierShare = new Map(baitTierChances(baitId).map((entry) => [entry.tier, entry.chance]));
  const rows = [];
  for (const tier of [1, 2, 3, 4, 5]) {
    const share = tierShare.get(tier) || 0;
    const members = FISH.filter((fish) => fish.tier === tier);
    if (!members.length) continue;
    for (const part of splitPercent(share, members, (fish) => fish.weight)) {
      rows.push({ id: part.member.id, name: part.member.name, tier, chance: part.chance });
    }
  }
  return rows.sort((a, b) => b.chance - a.chance || a.tier - b.tier);
}

export function fishingChanceFor(baitId, fishId) {
  const row = fishingCatchTable(baitId).find((entry) => entry.id === fishId);
  return row ? row.chance : 0;
}

// Chance of landing tier 4–5 on this bait: the number the shop advertises.
export function baitHighTierChance(baitId) {
  return baitTierChances(baitId)
    .filter((entry) => entry.tier >= 4)
    .reduce((sum, entry) => sum + entry.chance, 0);
}

export function rollFishingCatch(baitId, rand = Math.random) {
  const table = fishingCatchTable(baitId);
  if (!table.length) return null;
  const total = table.reduce((sum, entry) => sum + entry.chance, 0);
  const roll = Math.max(0, Math.min(0.999999, Number(rand) || 0)) * total;
  let cursor = 0;
  for (const entry of table) {
    cursor += entry.chance;
    if (roll < cursor) return fishingFishById(entry.id);
  }
  return fishingFishById(table[0].id);
}

// ── Reel minigame ─────────────────────────────────────────────────────────
export function reelZone(fish) {
  const rarity = fishRarity(fishTierOf(fish));
  return { center: 0.5, half: rarity.reelHalf };
}

export function reelHit(fish, position) {
  const zone = reelZone(fish);
  const pos = Math.max(0, Math.min(1, Number(position) || 0));
  return Math.abs(pos - zone.center) <= zone.half;
}

export function rollFishWeight(fish, rand = Math.random) {
  const f = fish || FISH[0];
  const min = Math.max(0, Number(f.minKg) || 0);
  const max = Math.max(min, Number(f.maxKg) || min);
  const roll = Math.max(0, Math.min(0.999999, Number(rand) || 0));
  return Math.round((min + (max - min) * roll) * 100) / 100;
}

// ── Progress ──────────────────────────────────────────────────────────────
export function defaultFishingProgress() {
  return {
    version: 1,
    starter: true,
    selectedBait: FISHING_STARTER_BAIT,
    coins: FISHING_START_COINS,
    bait: { [FISHING_STARTER_BAIT]: FISHING_STARTER_BAIT_COUNT },
    caught: {},
    records: {},
    casts: 0,
    catches: 0,
    escapes: 0,
    earned: 0,
    bestKg: 0,
    bestFish: '',
  };
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function wholeNumber(value, min, max) {
  return Math.floor(clampNumber(value, min, max));
}

function sanitizeBaitCounts(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const bait of FISHING_BAITS) {
    const count = wholeNumber(raw[bait.id], 0, FISHING_BAIT_MAX);
    if (count > 0) out[bait.id] = count;
  }
  return out;
}

function sanitizeFishMap(raw, max) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const fish of FISH) {
    const value = wholeNumber(raw[fish.id], 0, max);
    if (value > 0) out[fish.id] = value;
  }
  return out;
}

function sanitizeRecords(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const fish of FISH) {
    const kg = Math.round(clampNumber(raw[fish.id], 0, 9999) * 100) / 100;
    if (kg > 0) out[fish.id] = kg;
  }
  return out;
}

function sanitizeSelectedBait(raw) {
  return fishingBaitById(raw) ? raw : FISHING_STARTER_BAIT;
}

// The starter grant happens exactly once: a save that already recorded its
// starter keeps whatever bait it has left, including zero worms.
export function sanitizeFishingProgress(raw) {
  const base = defaultFishingProgress();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const starter = raw.starter === true;
  const bait = sanitizeBaitCounts(raw.bait);
  if (!starter) bait[FISHING_STARTER_BAIT] = Math.max(bait[FISHING_STARTER_BAIT] || 0, FISHING_STARTER_BAIT_COUNT);
  const caught = sanitizeFishMap(raw.caught, 100000);
  const records = sanitizeRecords(raw.records);
  const bestFish = fishingFishById(raw.bestFish) ? raw.bestFish : '';
  return {
    ...raw,
    version: 1,
    starter: true,
    selectedBait: sanitizeSelectedBait(raw.selectedBait),
    coins: wholeNumber(raw.coins, 0, 1e9),
    bait,
    caught,
    records,
    casts: wholeNumber(raw.casts, 0, 1e7),
    catches: wholeNumber(raw.catches, 0, 1e7),
    escapes: wholeNumber(raw.escapes, 0, 1e7),
    earned: wholeNumber(raw.earned, 0, 1e9),
    bestKg: Math.round(clampNumber(raw.bestKg, 0, 9999) * 100) / 100,
    bestFish,
  };
}

export function fishingBaitCount(progress, baitId) {
  const safe = sanitizeFishingProgress(progress);
  return safe.bait[baitId] || 0;
}

export function fishingSelectBait(progress, baitId) {
  if (!fishingBaitById(baitId)) return false;
  if (progress && typeof progress === 'object') {
    progress.selectedBait = baitId;
    return true;
  }
  return false;
}

export function fishingShopItems() {
  return FISHING_BAITS.map((bait) => ({
    id: bait.id,
    name: bait.name,
    short: bait.short,
    tier: bait.tier,
    price: bait.price,
    color: bait.color,
    accent: bait.accent,
    glyph: bait.glyph,
    blurb: bait.blurb,
    highTierChance: baitHighTierChance(bait.id),
  }));
}

export function fishingBuyBait(progress, baitId, qty = 1) {
  const p = sanitizeFishingProgress(progress);
  const bait = fishingBaitById(baitId);
  if (!bait) return { ok: false, reason: 'unknown' };
  const amount = wholeNumber(qty, 1, 25);
  const total = bait.price * amount;
  if (p.coins < total) return { ok: false, reason: 'coins', coins: p.coins, total, price: bait.price };
  const current = p.bait[bait.id] || 0;
  if (current + amount > FISHING_BAIT_MAX) return { ok: false, reason: 'full', coins: p.coins, total, price: bait.price };
  const next = { ...p, coins: p.coins - total, bait: { ...p.bait, [bait.id]: current + amount } };
  if (progress && typeof progress === 'object') Object.assign(progress, next);
  return {
    ok: true,
    id: bait.id,
    name: bait.name,
    price: bait.price,
    qty: amount,
    total,
    coins: next.coins,
    owned: next.bait[bait.id],
  };
}

// One cast: consumes a single bait and rolls the fish that bites.
export function fishingCast(progress, baitId, rand = Math.random) {
  const p = sanitizeFishingProgress(progress);
  const id = fishingBaitById(baitId) ? baitId : p.selectedBait;
  const bait = fishingBaitById(id);
  if (!bait) return { ok: false, reason: 'unknown' };
  const owned = p.bait[id] || 0;
  if (owned <= 0) return { ok: false, reason: 'empty', bait: id };
  const fish = rollFishingCatch(id, rand);
  const nextBait = { ...p.bait, [id]: owned - 1 };
  if (nextBait[id] <= 0) delete nextBait[id];
  const next = { ...p, selectedBait: id, bait: nextBait, casts: p.casts + 1 };
  if (progress && typeof progress === 'object') Object.assign(progress, next);
  return { ok: true, bait: id, baitName: bait.name, fish, zone: reelZone(fish) };
}

export function fishingLandCatch(progress, fish, rand = Math.random) {
  const p = sanitizeFishingProgress(progress);
  const target = typeof fish === 'string' ? fishingFishById(fish) : fish;
  if (!target) return { ok: false, reason: 'unknown' };
  const kg = Math.round(rollFishWeight(target, rand) * 100) / 100;
  const previous = p.records[target.id] || 0;
  const next = {
    ...p,
    caught: { ...p.caught, [target.id]: (p.caught[target.id] || 0) + 1 },
    records: { ...p.records, [target.id]: Math.max(previous, kg) },
    catches: p.catches + 1,
    coins: p.coins + target.value,
    earned: p.earned + target.value,
  };
  if (kg > p.bestKg) {
    next.bestKg = kg;
    next.bestFish = target.id;
  }
  if (progress && typeof progress === 'object') Object.assign(progress, next);
  return {
    ok: true,
    fish: target,
    kg,
    value: target.value,
    isRecord: kg > previous,
    coins: next.coins,
    caughtCount: next.caught[target.id],
  };
}

export function fishingEscape(progress) {
  const p = sanitizeFishingProgress(progress);
  const next = { ...p, escapes: p.escapes + 1 };
  if (progress && typeof progress === 'object') Object.assign(progress, next);
  return { ok: true, escapes: next.escapes };
}

export function fishingSummary(progress) {
  const p = sanitizeFishingProgress(progress);
  const discovered = Object.keys(p.caught).length;
  const owned = Object.values(p.bait).reduce((sum, count) => sum + count, 0);
  const attempts = p.catches + p.escapes;
  return {
    coins: p.coins,
    owned,
    baitKinds: Object.keys(p.bait).length,
    discovered,
    total: FISH_TOTAL,
    completion: Math.round((discovered / FISH_TOTAL) * 1000) / 10,
    casts: p.casts,
    catches: p.catches,
    escapes: p.escapes,
    earned: p.earned,
    successRate: attempts ? Math.round((p.catches / attempts) * 1000) / 10 : 0,
    bestKg: p.bestKg,
    bestFish: p.bestFish,
    selectedBait: p.selectedBait,
    hasStarterBait: (p.bait[FISHING_STARTER_BAIT] || 0) > 0,
  };
}

// Index rows: every fish, whether it is discovered, how often and how heavy,
// plus the exact odds on each of the nine baits.
export function fishingIndex(progress) {
  const p = sanitizeFishingProgress(progress);
  return FISH.map((fish) => {
    const chances = FISHING_BAITS.map((bait) => ({
      baitId: bait.id,
      baitName: bait.short,
      tier: bait.tier,
      chance: fishingChanceFor(bait.id, fish.id),
    }));
    const best = chances.reduce((top, entry) => (entry.chance > top.chance ? entry : top), chances[0]);
    return {
      fish,
      rarity: fishRarity(fish.tier),
      discovered: (p.caught[fish.id] || 0) > 0,
      count: p.caught[fish.id] || 0,
      bestKg: p.records[fish.id] || 0,
      chances,
      bestBait: best ? best.baitId : FISHING_STARTER_BAIT,
      bestChance: best ? best.chance : 0,
    };
  }).sort((a, b) => a.fish.tier - b.fish.tier || b.fish.weight - a.fish.weight);
}

// ── Procedural art ────────────────────────────────────────────────────────
// Draws one fish into a caller-owned 2D context. Pure drawing: no globals.
export function drawFishingIcon(ctx, fish, x, y, size) {
  if (!ctx || !fish) return;
  const f = fish;
  const s = Math.max(4, Number(size) || 32);
  const cx = Number(x) || 0;
  const cy = Number(y) || 0;
  const pattern = f.pattern || 'plain';

  ctx.save();
  ctx.translate(cx, cy);

  if (f.tier >= 5) {
    ctx.shadowColor = f.fin || '#fff';
    ctx.shadowBlur = s * 0.5;
  }

  const tail = (dir) => {
    ctx.beginPath();
    ctx.moveTo(dir * s * 0.34, 0);
    ctx.lineTo(dir * s * 0.58, -s * 0.2);
    ctx.lineTo(dir * s * 0.52, 0);
    ctx.lineTo(dir * s * 0.58, s * 0.2);
    ctx.closePath();
    ctx.fillStyle = f.fin || '#cbd6dd';
    ctx.fill();
  };

  if (f.shape === 'eel' || f.shape === 'squid') {
    ctx.beginPath();
    ctx.moveTo(-s * 0.44, 0);
    ctx.bezierCurveTo(-s * 0.2, -s * 0.22, s * 0.05, s * 0.2, s * 0.34, 0);
    ctx.bezierCurveTo(s * 0.05, s * 0.1, -s * 0.2, -s * 0.08, -s * 0.44, 0);
    ctx.closePath();
    ctx.fillStyle = f.body || '#9a8a6a';
    ctx.fill();
    tail(-1);
    if (f.shape === 'squid') {
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.strokeStyle = f.fin || '#e6c6d2';
        ctx.lineWidth = Math.max(1, s * 0.04);
        ctx.moveTo(s * 0.24, (i - 1.5) * s * 0.06);
        ctx.lineTo(s * 0.5, (i - 1.5) * s * 0.14);
        ctx.stroke();
      }
    }
  } else if (f.shape === 'shell') {
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.34, s * 0.26, 0, 0, Math.PI * 2);
    ctx.fillStyle = f.body || '#a06a4a';
    ctx.fill();
    ctx.strokeStyle = f.fin || '#e0a882';
    ctx.lineWidth = Math.max(1, s * 0.05);
    ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * s * 0.28, -s * 0.16);
      ctx.lineTo(side * s * 0.52, -s * 0.3);
      ctx.moveTo(side * s * 0.3, s * 0.02);
      ctx.lineTo(side * s * 0.54, s * 0.02);
      ctx.moveTo(side * s * 0.28, s * 0.18);
      ctx.lineTo(side * s * 0.5, s * 0.3);
      ctx.strokeStyle = f.accent || '#4d2416';
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.fillStyle = f.accent || '#3a2418';
    ctx.arc(-s * 0.12, -s * 0.08, s * 0.028, 0, Math.PI * 2);
    ctx.arc(s * 0.12, -s * 0.08, s * 0.028, 0, Math.PI * 2);
    ctx.fill();
  } else if (f.shape === 'flat') {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.36);
    ctx.quadraticCurveTo(s * 0.42, 0, 0, s * 0.3);
    ctx.quadraticCurveTo(-s * 0.42, 0, 0, -s * 0.36);
    ctx.closePath();
    ctx.fillStyle = f.body || '#77775f';
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = f.fin || '#b9b9a0';
    ctx.lineWidth = Math.max(1, s * 0.05);
    ctx.moveTo(0, -s * 0.34);
    ctx.lineTo(0, s * 0.34);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = f.accent || '#2d2d22';
    ctx.arc(-s * 0.08, -s * 0.12, s * 0.03, 0, Math.PI * 2);
    ctx.arc(s * 0.08, -s * 0.12, s * 0.03, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const height = f.shape === 'spiky' ? 0.3 : f.shape === 'round' ? 0.32 : 0.22;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.36, s * height, 0, 0, Math.PI * 2);
    ctx.fillStyle = f.body || '#8fa3b0';
    ctx.fill();
    tail(1);
    // dorsal fin
    ctx.beginPath();
    ctx.fillStyle = f.fin || '#cfe0e8';
    if (f.shape === 'spiky') {
      ctx.moveTo(-s * 0.06, -s * height * 0.9);
      ctx.lineTo(s * 0.12, -s * 0.5);
      ctx.lineTo(s * 0.2, -s * height * 0.9);
    } else {
      ctx.moveTo(-s * 0.14, -s * height * 0.9);
      ctx.lineTo(-s * 0.02, -s * (height + 0.16));
      ctx.lineTo(s * 0.14, -s * height * 0.9);
    }
    ctx.closePath();
    ctx.fill();
    if (f.shape === 'spiky') {
      ctx.beginPath();
      ctx.moveTo(-s * 0.36, 0);
      ctx.lineTo(-s * 0.74, -s * 0.1);
      ctx.strokeStyle = f.fin || '#cfe0e8';
      ctx.lineWidth = Math.max(1, s * 0.045);
      ctx.stroke();
    }
    // patterns
    if (pattern === 'stripe') {
      ctx.strokeStyle = f.accent || '#3a4a52';
      ctx.lineWidth = Math.max(1, s * 0.035);
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.12 - s * 0.03, -s * height * 0.75);
        ctx.lineTo(i * s * 0.12 + s * 0.03, s * height * 0.75);
        ctx.stroke();
      }
    } else if (pattern === 'spots') {
      ctx.fillStyle = f.accent || '#3a4a52';
      for (const [dx, dy, r] of [[-0.14, -0.08, 0.04], [0.02, 0.1, 0.035], [0.16, -0.1, 0.03], [-0.02, -0.16, 0.025]]) {
        ctx.beginPath();
        ctx.arc(dx * s, dy * s, Math.max(1, r * s), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (pattern === 'band') {
      ctx.fillStyle = f.accent || '#f4f1e4';
      for (const dx of [-0.16, 0.06]) {
        ctx.beginPath();
        ctx.ellipse(dx * s, 0, s * 0.035, s * height * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (pattern === 'scales') {
      ctx.strokeStyle = f.fin || '#d9b98c';
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = Math.max(1, s * 0.025);
      for (let row = -1; row <= 1; row++) {
        for (let col = -1; col <= 2; col++) {
          ctx.beginPath();
          ctx.arc(col * s * 0.12 - s * 0.06, row * s * 0.1, s * 0.055, 0.2, Math.PI - 0.2);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    } else if (pattern === 'glow') {
      ctx.fillStyle = f.fin || '#d8fbff';
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc((i - 1) * s * 0.16, (i % 2 ? 1 : -1) * s * 0.06, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // eye
    ctx.beginPath();
    ctx.fillStyle = '#f7f2e6';
    ctx.arc(s * 0.24, -s * 0.04, s * 0.055, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = '#10151a';
    ctx.arc(s * 0.255, -s * 0.04, s * 0.028, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
