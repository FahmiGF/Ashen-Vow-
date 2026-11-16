import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BAIT_TOTAL,
  FISH,
  FISHING_BAITS,
  FISHING_BAIT_MAX,
  FISHING_STARTER_BAIT,
  FISHING_STARTER_BAIT_COUNT,
  FISH_TOTAL,
  baitHighTierChance,
  baitTierChances,
  defaultFishingProgress,
  fishingBaitById,
  fishingBaitCount,
  fishingBuyBait,
  fishingCast,
  fishingCatchTable,
  fishingChanceFor,
  fishingEscape,
  fishingIndex,
  fishingLandCatch,
  fishingSelectBait,
  fishingSummary,
  reelHit,
  reelZone,
  rollFishWeight,
  rollFishingCatch,
  sanitizeFishingProgress,
} from '../src/fishing.js';

const sum = (values) => values.reduce((total, value) => total + value, 0);
const round = (value) => Math.round(value * 10) / 10;

test('fishing ships nine baits at 25/50/100 coins and twenty-five fish', () => {
  assert.equal(BAIT_TOTAL, 9);
  assert.equal(FISH_TOTAL, 25);
  const ids = new Set(FISHING_BAITS.map((bait) => bait.id));
  assert.equal(ids.size, FISHING_BAITS.length);
  for (const bait of FISHING_BAITS) {
    assert.ok([1, 2, 3].includes(bait.tier));
    assert.equal(bait.price, [25, 50, 100][bait.tier - 1]);
    assert.equal(bait.chances.length, 5);
  }
  assert.ok(FISHING_BAITS.some((bait) => bait.id === 'worm'));
  assert.ok(FISHING_BAITS.some((bait) => bait.id === 'cricket'));
  assert.ok(FISHING_BAITS.some((bait) => bait.id === 'squid'));
  assert.ok(FISHING_BAITS.some((bait) => bait.id === 'clam'));
  assert.ok(FISHING_BAITS.some((bait) => bait.id === 'cheese'));
  assert.ok(FISHING_BAITS.some((bait) => bait.id === 'minnow'));
  assert.ok(FISHING_BAITS.some((bait) => bait.id === 'slicedfish'));
  const tiers = [1, 2, 3, 4, 5].map((tier) => FISH.filter((fish) => fish.tier === tier).length);
  assert.deepEqual(tiers.map((count) => count > 0), [true, true, true, true, true]);
  for (const fish of FISH) {
    assert.ok(fish.minKg > 0 && fish.maxKg >= fish.minKg);
    assert.ok(fish.value > 0 && fish.weight > 0);
  }
});

test('every bait splits into five tiers that add up to exactly 100 percent', () => {
  for (const bait of FISHING_BAITS) {
    const tiers = baitTierChances(bait.id);
    assert.equal(tiers.length, 5);
    assert.equal(round(sum(tiers.map((entry) => entry.chance))), 100);
    for (const entry of tiers) assert.ok(entry.chance >= 0);
  }
});

test('per-fish odds sum to 100 and favour the higher bait tiers', () => {
  for (const bait of FISHING_BAITS) {
    const table = fishingCatchTable(bait.id);
    assert.equal(table.length, FISH_TOTAL);
    assert.equal(round(sum(table.map((entry) => entry.chance))), 100);
    for (const row of table) assert.ok(row.chance >= 0);
  }
  const wormHigh = baitHighTierChance('worm');
  const cricketHigh = baitHighTierChance('cricket');
  const premiumHigh = baitHighTierChance('glowworm');
  assert.ok(wormHigh < cricketHigh, 'better tier-1 bait improves the tail');
  assert.ok(cricketHigh < baitHighTierChance('minnow'));
  assert.ok(baitHighTierChance('squid') > baitHighTierChance('clam'));
  assert.ok(premiumHigh > baitHighTierChance('shrimp'));
  assert.ok(premiumHigh >= 30, 'glowworm should reach tier 4–5 about a third of the time');
  assert.ok(wormHigh <= 5);
  // The index never disagrees with the computed table.
  assert.equal(fishingChanceFor('worm', 'anchovy'), fishingCatchTable('worm').find((row) => row.id === 'anchovy').chance);
  assert.equal(fishingChanceFor('worm', 'leviathan_fry') < fishingChanceFor('worm', 'anchovy'), true);
  assert.equal(fishingChanceFor('nope', 'anchovy'), 0);
});

test('rollFishingCatch respects the low and high edges of the table', () => {
  for (const bait of FISHING_BAITS) {
    const table = fishingCatchTable(bait.id);
    const first = rollFishingCatch(bait.id, 0);
    const last = rollFishingCatch(bait.id, 0.9999);
    assert.equal(first.id, table[0].id);
    assert.ok(table.some((row) => row.id === last.id));
  }
  assert.equal(rollFishingCatch('unknown', 0.5), null);
  // Deterministic sampling: the same seed always gives the same fish.
  assert.equal(rollFishingCatch('worm', 0.42).id, rollFishingCatch('worm', 0.42).id);
  const counts = new Map();
  let seed = 0.13;
  for (let i = 0; i < 4000; i++) {
    seed = (seed * 9301 + 49297) % 233280 / 233280;
    const fish = rollFishingCatch('glowworm', seed);
    counts.set(fish.tier, (counts.get(fish.tier) || 0) + 1);
  }
  const high = (counts.get(4) || 0) + (counts.get(5) || 0);
  assert.ok(high / 4000 > 0.2, `expected a healthy tier-4/5 share, got ${high / 4000}`);
});

test('reel windows tighten with rarity and hit only inside the zone', () => {
  const common = FISH.find((fish) => fish.tier === 1);
  const mythic = FISH.find((fish) => fish.tier === 5);
  assert.ok(reelZone(common).half > reelZone(mythic).half);
  assert.equal(reelHit(common, 0.5), true);
  assert.equal(reelHit(common, 0.95), false);
  assert.equal(reelHit(mythic, 0.5), true);
  assert.equal(reelHit(mythic, 0.62), false);
  assert.equal(reelHit(common, 2), false);
  assert.equal(reelHit(common, -1), false);
});

test('fish weight rolls stay inside the species range', () => {
  const fish = FISH.find((entry) => entry.id === 'marlin');
  assert.equal(rollFishWeight(fish, 0), fish.minKg);
  assert.equal(rollFishWeight(fish, 0.9999), fish.maxKg);
  const mid = rollFishWeight(fish, 0.5);
  assert.ok(mid >= fish.minKg && mid <= fish.maxKg);
});

test('a fresh save starts with ten worms and 250 coins', () => {
  const p = defaultFishingProgress();
  assert.equal(p.bait[FISHING_STARTER_BAIT], FISHING_STARTER_BAIT_COUNT);
  assert.equal(FISHING_STARTER_BAIT_COUNT, 10);
  assert.equal(p.selectedBait, 'worm');
  assert.equal(p.coins, 250);
  assert.deepEqual(p.caught, {});
  assert.equal(p.casts, 0);
});

test('the starter grant repairs an old save once and never refills spent worms', () => {
  const repaired = sanitizeFishingProgress({ coins: 40 });
  assert.equal(repaired.bait.worm, 10);
  assert.equal(repaired.starter, true);
  const spent = sanitizeFishingProgress({ starter: true, coins: 40, bait: { worm: 0, squid: 3 } });
  assert.equal(spent.bait.worm || 0, 0, 'spent worms stay spent');
  assert.equal(spent.bait.squid, 3);
  const junk = sanitizeFishingProgress({ coins: -50, bait: { worm: 99999, ghost: 4 }, caught: { anchovy: -2, salmon: 3.9, nope: 5 }, records: { marlin: 'x' } });
  assert.equal(junk.coins, 0);
  assert.equal(junk.bait.worm, FISHING_BAIT_MAX);
  assert.equal(junk.bait.ghost, undefined);
  assert.equal(junk.caught.anchovy, undefined);
  assert.equal(junk.caught.salmon, 3);
  assert.equal(junk.caught.nope, undefined);
  assert.equal(junk.records.marlin, undefined);
  assert.equal(sanitizeFishingProgress(null).bait.worm, 10);
  assert.equal(sanitizeFishingProgress({ selectedBait: 'ghost' }).selectedBait, 'worm');
});

test('the bait shack charges 25, 50 and 100 per unit and refuses bad purchases', () => {
  const p = defaultFishingProgress();
  const bought = fishingBuyBait(p, 'cricket', 1);
  assert.equal(bought.ok, true);
  assert.equal(bought.total, 25);
  assert.equal(p.coins, 225);
  assert.equal(p.bait.cricket, 1);
  assert.equal(fishingBaitCount(p, 'cricket'), 1);

  const premium = fishingBuyBait(p, 'glowworm', 2);
  assert.equal(premium.ok, true);
  assert.equal(premium.total, 200);
  assert.equal(p.coins, 25);
  assert.equal(p.bait.glowworm, 2);

  const broke = fishingBuyBait(p, 'slicedfish', 1);
  assert.equal(broke.ok, false);
  assert.equal(broke.reason, 'coins');
  assert.equal(p.coins, 25, 'a refused purchase never touches the wallet');
  assert.equal(p.bait.slicedfish, undefined);

  const unknown = fishingBuyBait(p, 'ghost-bait', 1);
  assert.equal(unknown.ok, false);
  assert.equal(unknown.reason, 'unknown');

  p.coins = 1e9;
  const capped = fishingBuyBait(p, 'worm', 25);
  assert.equal(capped.ok, true, 'buying 25 worms at once works');
  p.bait.worm = FISHING_BAIT_MAX;
  assert.equal(fishingBuyBait(p, 'worm', 1).reason, 'full');
  assert.equal(fishingBaitCount(p, 'ghost'), 0);
});

test('casting spends one bait and rolls a fish from that bait table', () => {
  const p = defaultFishingProgress();
  const cast = fishingCast(p, 'worm', 0.5);
  assert.equal(cast.ok, true);
  assert.equal(p.bait.worm, 9);
  assert.equal(p.casts, 1);
  assert.ok(cast.fish && cast.fish.id);
  assert.ok(fishingCatchTable('worm').some((row) => row.id === cast.fish.id));
  assert.equal(p.selectedBait, 'worm');

  for (let i = 0; i < 9; i++) fishingCast(p, 'worm', 0.2);
  assert.equal(p.bait.worm, undefined, 'the last worm is spent and the stack disappears');
  const empty = fishingCast(p, 'worm', 0.2);
  assert.equal(empty.ok, false);
  assert.equal(empty.reason, 'empty');
  assert.equal(p.casts, 10);

  // An unknown bait falls back to the selected one; with none selected it fails.
  const q = defaultFishingProgress();
  fishingSelectBait(q, 'squid');
  q.bait.squid = 2;
  assert.equal(fishingCast(q, 'ghost', 0.1).ok, true);
  assert.equal(q.bait.squid, 1);
});

test('landing a catch pays its value, records discoveries and keeps the heaviest', () => {
  const p = defaultFishingProgress();
  const marlin = FISH.find((fish) => fish.id === 'marlin');
  const first = fishingLandCatch(p, marlin, 0);
  assert.equal(first.ok, true);
  assert.equal(first.kg, marlin.minKg);
  assert.equal(first.value, marlin.value);
  assert.equal(p.coins, 250 + marlin.value);
  assert.equal(p.earned, marlin.value);
  assert.equal(p.caught.marlin, 1);
  assert.equal(p.catches, 1);
  assert.equal(p.bestFish, 'marlin');
  assert.equal(p.bestKg, marlin.minKg);

  const heavier = fishingLandCatch(p, 'marlin', 0.9999);
  assert.equal(heavier.isRecord, true);
  assert.equal(p.records.marlin, marlin.maxKg);
  assert.equal(p.caught.marlin, 2);
  const lighter = fishingLandCatch(p, 'marlin', 0.1);
  assert.equal(lighter.isRecord, false);
  assert.equal(p.records.marlin, marlin.maxKg, 'a lighter fish never overwrites the record');
  assert.equal(fishingLandCatch(p, 'ghost', 0).ok, false);
  assert.equal(p.escapes, 0);
  fishingEscape(p);
  assert.equal(p.escapes, 1);
});

test('the summary reports wallet, completion and success rate', () => {
  const p = defaultFishingProgress();
  assert.equal(fishingSummary(p).owned, 10);
  assert.equal(fishingSummary(p).baitKinds, 1);
  assert.equal(fishingSummary(p).completion, 0);
  fishingLandCatch(p, 'anchovy', 0.5);
  fishingLandCatch(p, 'leviathan_fry', 0.5);
  fishingEscape(p);
  const summary = fishingSummary(p);
  assert.equal(summary.discovered, 2);
  assert.equal(summary.catches, 2);
  assert.equal(summary.escapes, 1);
  assert.equal(summary.successRate, round((2 / 3) * 100));
  assert.ok(summary.completion > 0 && summary.completion < 100);
  assert.equal(summary.bestFish, 'leviathan_fry');
  assert.equal(summary.coins, 250 + 8 + 900);
});

test('the index lists all twenty-five fish with odds on every bait', () => {
  const p = defaultFishingProgress();
  fishingLandCatch(p, 'salmon', 0.5);
  const index = fishingIndex(p);
  assert.equal(index.length, FISH_TOTAL);
  const salmon = index.find((row) => row.fish.id === 'salmon');
  assert.equal(salmon.discovered, true);
  assert.equal(salmon.count, 1);
  assert.ok(salmon.bestKg > 0);
  assert.equal(salmon.chances.length, BAIT_TOTAL);
  // Each bait column across the whole index still adds up to 100 percent.
  for (const bait of FISHING_BAITS) {
    const column = sum(index.map((row) => row.chances.find((entry) => entry.baitId === bait.id).chance));
    assert.equal(round(column), 100, `${bait.id} column should total 100`);
  }
  // Shrimp and glowworm share a tier-3 share, so either can top the list.
  assert.ok(['shrimp', 'glowworm'].includes(salmon.bestBait));
  assert.ok(salmon.bestChance > 1);
  const anchovy = index.find((row) => row.fish.id === 'anchovy');
  assert.equal(anchovy.discovered, false);
  assert.equal(anchovy.count, 0);
  assert.equal(anchovy.rarity.id, 'common');
  assert.equal(index[0].fish.tier, 1, 'the index is sorted by tier');
  assert.equal(index[index.length - 1].fish.tier, 5);
  const unknown = fishingIndex({ caught: { ghost: 3 } });
  assert.equal(unknown.length, FISH_TOTAL);
});

test('bait helpers are defensive about unknown ids', () => {
  assert.equal(fishingBaitById('worm').price, 25);
  assert.equal(fishingBaitById('nope'), null);
  assert.equal(baitTierChances('nope').length, 0);
  assert.equal(fishingCatchTable('nope').length, 0);
  assert.equal(baitHighTierChance('nope'), 0);
  assert.equal(fishingSelectBait({}, 'ghost'), false);
  assert.equal(fishingSelectBait(defaultFishingProgress(), 'clam'), true);
});
