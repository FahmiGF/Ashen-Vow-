import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HUNTER_ITEMS,
  HUNTER_ITEM_IDS,
  HUNTER_MAX_STACK,
  HUNTER_SAVE_KEY,
  HUNTER_START_MARKS,
  defaultHunterSave,
  hunterBuy,
  hunterCanBuy,
  hunterConsume,
  hunterGrant,
  hunterItem,
  hunterReward,
  hunterSanitizeMissing,
  hunterSummary,
  isSpiritEnemy,
  isSpiritSource,
  sanitizeHunterSave,
  spiritBounty,
} from '../src/hunter.js';

test('the hunter kit exposes five unique, priced, ghost-only tools', () => {
  assert.equal(HUNTER_SAVE_KEY, 'ashen-vow-hunter-v1');
  assert.equal(HUNTER_ITEMS.length, 5);
  assert.equal(new Set(HUNTER_ITEM_IDS).size, 5);
  for (const item of HUNTER_ITEMS) {
    assert.ok(item.name && item.desc && item.glyph);
    assert.equal(item.type, 'hunter');
    assert.ok(item.price > 0);
    assert.ok(item.pack >= 1);
  }
  assert.ok(hunterItem('spirit_bane').spiritDamage > hunterItem('spirit_bane').damage);
  assert.equal(hunterItem('missing'), null);
});

test('a fresh save starts with marks and no stock', () => {
  const save = defaultHunterSave();
  assert.equal(save.marks, HUNTER_START_MARKS);
  assert.deepEqual(save.items, {});
  assert.equal(save.schemaVersion, 1);
});

test('sanitize rejects unknown ids, clamps stock, and repairs junk fields', () => {
  const clean = sanitizeHunterSave({
    marks: -100,
    items: { salt_flare: 99, spirit_bane: -2, not_real: 7 },
    purchases: 'x',
    banished: 3.6,
    uses: Number.POSITIVE_INFINITY,
  });
  assert.equal(clean.marks, 0);
  assert.equal(clean.items.salt_flare, HUNTER_MAX_STACK);
  assert.equal(clean.items.spirit_bane, undefined);
  assert.equal(clean.items.not_real, undefined);
  assert.equal(clean.purchases, 0);
  assert.equal(clean.banished, 4);
  assert.equal(clean.uses, 0);
});

test('a purchase spends marks, adds stock, and refuses poverty or a full stack', () => {
  const save = defaultHunterSave();
  assert.equal(hunterCanBuy(save, 'salt_flare').ok, true);
  const result = hunterBuy(save, 'salt_flare', 123);
  assert.equal(result.ok, true);
  assert.equal(save.marks, HUNTER_START_MARKS - 30);
  assert.equal(save.items.salt_flare, 1);
  assert.equal(save.purchases, 1);
  assert.equal(save.lastAt, 123);

  save.items.salt_flare = HUNTER_MAX_STACK;
  assert.equal(hunterCanBuy(save, 'salt_flare').ok, false);
  assert.match(hunterCanBuy(save, 'salt_flare').reason, /penuh/i);

  save.marks = 0;
  assert.equal(hunterCanBuy(save, 'spirit_bane').poor, true);
  const failed = hunterBuy(save, 'spirit_bane');
  assert.equal(failed.ok, false);
  assert.equal(save.items.spirit_bane, undefined);
});

test('consuming decrements stock and removes empty stacks', () => {
  const save = defaultHunterSave();
  hunterGrant(save, 'smoke_grenade', 1);
  assert.equal(save.items.smoke_grenade, 1);
  const used = hunterConsume(save, 'smoke_grenade');
  assert.equal(used.ok, true);
  assert.equal(save.items.smoke_grenade, undefined);
  assert.equal(save.uses, 1);
  assert.equal(hunterConsume(save, 'smoke_grenade').ok, false);
});

test('rewards add marks without ever going negative', () => {
  const save = sanitizeHunterSave({ marks: 3 });
  assert.equal(hunterReward(save, 18), 18);
  assert.equal(save.marks, 21);
  assert.equal(hunterReward(save, -90), 0);
  assert.equal(save.marks, 21);
});

test('summary counts only known stock', () => {
  const save = sanitizeHunterSave({ marks: 9, items: { salt_flare: 2, grave_bell: 1, nope: 4 } });
  const summary = hunterSummary(save);
  assert.equal(summary.marks, 9);
  assert.equal(summary.stock, 3);
  assert.equal(summary.items.nope, undefined);
});

test('spirit detection covers every horror family and ignores ordinary enemies', () => {
  assert.equal(isSpiritEnemy({ scaryKind: 'hollow_wraith' }), true);
  assert.equal(isSpiritEnemy({ unnaturalKind: 'pale_echo' }), true);
  assert.equal(isSpiritEnemy({ ghostKind: 'weeping_bride' }), true);
  assert.equal(isSpiritEnemy({ dreadBoss: 'the_governess' }), true);
  assert.equal(isSpiritEnemy({ veilBoss: 'the_first_author' }), true);
  assert.equal(isSpiritEnemy({ eternalBoss: 'first_forgotten' }), true);
  assert.equal(isSpiritEnemy({ type: 'crawler', hp: 34 }), false);
  assert.equal(isSpiritEnemy(null), false);
});

test('spirit sources include legacy strings and current object shapes', () => {
  assert.equal(isSpiritSource('ghost:weeping_bride'), true);
  assert.equal(isSpiritSource('ghost'), true);
  assert.equal(isSpiritSource({ scaryKind: 'hollow_wraith' }), true);
  assert.equal(isSpiritSource({ type: 'spirit_bane', family: 'wraith' }), true);
  assert.equal(isSpiritSource({ type: 'crawler', family: 'crawler' }), false);
  assert.equal(isSpiritSource(null), false);
});

test('bounties scale from common ghosts to horror bosses', () => {
  assert.equal(spiritBounty({ type: 'crawler' }), 0);
  assert.ok(spiritBounty({ scaryKind: 'hollow_wraith' }) > 0);
  assert.ok(spiritBounty({ scaryKind: 'forgotten_one' }) > spiritBounty({ scaryKind: 'hollow_wraith' }));
  assert.equal(spiritBounty({ dreadBoss: 'the_governess' }), 120);
  assert.ok(spiritBounty({ ghostRarity: 'mythic' }) > spiritBounty({ ghostRarity: 'common' }));
});

test('exports a defensive missing-save cleanup alias', () => {
  assert.equal(typeof hunterSanitizeMissing, 'function');
  assert.deepEqual(hunterSanitizeMissing(null), defaultHunterSave());
});
