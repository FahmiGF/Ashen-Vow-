// tests/atlas.test.js
// Verification suite for Ashen Vow - The Sundered Atlas (v0.6.0).
// Covers Parts V-VII: zones/rooms, story/lore, boss navigation, consumables,
// shops/economy, armor/charms/weapons, progression, and the 15-phase plan.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ATLAS_VERSION,
  ATLAS_ROOM_START,
  ATLAS_ROOM_COUNT,
  ATLAS_ZONES,
  ATLAS_ZONE_BY_ID,
  ATLAS_WORLD_TIERS,
  ATLAS_ABILITY_GATES,
  ATLAS_ABILITY_BY_ID,
  ATLAS_ROOMS,
  ATLAS_ROOM_BY_ID,
  ATLAS_ENEMY_INFO,
  ATLAS_BOSS_INFO,
  ATLAS_TIMELINE,
  ATLAS_CHARACTERS,
  ATLAS_CHAPTERS,
  ATLAS_ENDINGS,
  LORE_CATEGORIES,
  LORE_ENTRIES,
  LORE_COMPLETION_REWARDS,
  ATLAS_CONSUMABLES,
  ATLAS_CONSUMABLE_BY_ID,
  ATLAS_QUICK_SLOTS,
  ATLAS_ITEM_WHEEL,
  ATLAS_RECIPES,
  ATLAS_SHOPS,
  ATLAS_ARMOR_SETS,
  ATLAS_CHARMS,
  ATLAS_WEAPONS,
  ATLAS_WEAPON_BY_ID,
  ATLAS_INFUSIONS,
  ATLAS_PHASES,
  ATLAS_CHECKLIST,
  ATLAS_QUALITY_PRESETS,
  validateAtlasRooms,
  atlasZoneForRoom,
  atlasRoomLocalIndex,
  atlasRoomForZone,
  revealLore,
  loreCompletion,
  searchLore,
  priceForItem,
  sellPrice,
  shopStock,
  buyAtlasItem,
  useAtlasConsumable,
  applyInfusion,
  weaponMasteryFor,
  grantWeaponXp,
  defaultAtlasProgress,
  sanitizeAtlasProgress,
  canUnlockAtlasZone,
  unlockAtlasZones,
  completeAtlasRoom,
  atlasStats,
  applyAtlasLoadout,
} from '../src/atlas.js';

import {
  buildPlatformGraph,
  aStar,
  reachableNodes,
  BossNavigator,
  scoreAttack,
  pickBestAttack,
  runBossBot,
} from '../src/boss_pathfinding.js';

// ── zones and rooms ────────────────────────────────────────────────────────
test('atlas defines 8 zones across 4 world tiers with ability gates', () => {
  assert.equal(ATLAS_VERSION, '0.6.0');
  assert.equal(ATLAS_ZONES.length, 8);
  assert.equal(ATLAS_WORLD_TIERS.length, 4);
  assert.equal(ATLAS_ABILITY_GATES.length, 6);
  assert.equal(Object.keys(ATLAS_ZONE_BY_ID).length, 8);
  assert.equal(Object.keys(ATLAS_ABILITY_BY_ID).length, 6);

  const expected = ['vael', 'aviary', 'starfall', 'witherwood', 'sandglass', 'catacombs', 'abyss', 'foundry'];
  assert.deepEqual(ATLAS_ZONES.map((zone) => zone.id), expected);
  for (const zone of ATLAS_ZONES) {
    assert.ok(ATLAS_WORLD_TIERS.some((tier) => tier.id === zone.tier), `${zone.id} has a valid tier`);
    assert.ok(Array.isArray(zone.requires), `${zone.id} declares ability requirements`);
    for (const ability of zone.requires) {
      assert.ok(ATLAS_ABILITY_BY_ID[ability], `${zone.id} requires known ability ${ability}`);
    }
  }
});

test('atlas generates exactly 240 rooms, 30 per zone, starting at index 114', () => {
  assert.equal(ATLAS_ROOM_START, 114);
  assert.equal(ATLAS_ROOM_COUNT, 240);
  assert.equal(ATLAS_ROOMS.length, 240);
  assert.equal(Object.keys(ATLAS_ROOM_BY_ID).length, 240);
  assert.equal(ATLAS_ROOMS[0].id, ATLAS_ROOM_START);
  assert.equal(ATLAS_ROOMS[ATLAS_ROOMS.length - 1].id, ATLAS_ROOM_START + 239);

  for (const zone of ATLAS_ZONES) {
    const rooms = ATLAS_ROOMS.filter((room) => room.atlasZone === zone.id);
    assert.equal(rooms.length, 30, `${zone.id} must have exactly 30 rooms`);
    assert.equal(rooms[0].id, zone.roomStart);
    assert.equal(rooms[rooms.length - 1].id, zone.roomEnd);
    assert.ok(rooms.some((room) => room.atlasTemplate === 'boss' && room.boss === zone.boss));
    assert.ok(rooms.some((room) => room.checkpoint), `${zone.id} has a checkpoint`);
  }
});

test('atlas room validator accepts every generated room and rejects broken rooms', () => {
  const result = validateAtlasRooms();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.count, 240);
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);

  const broken = [{ id: 999, name: '', spawn: null, platforms: [], enemies: [{ type: 'missing', x: 0 }] }];
  const invalid = validateAtlasRooms(broken);
  assert.equal(invalid.ok, false);
  assert.ok(invalid.errors.length >= 4);
});

test('atlas room lookup helpers map global indices to zones and local indices', () => {
  assert.equal(atlasZoneForRoom(114).id, 'vael');
  assert.equal(atlasZoneForRoom(143).id, 'vael');
  assert.equal(atlasZoneForRoom(144).id, 'aviary');
  assert.equal(atlasZoneForRoom(353).id, 'foundry');
  assert.equal(atlasZoneForRoom(113), null);
  assert.equal(atlasZoneForRoom(354), null);
  assert.equal(atlasRoomLocalIndex(114), 0);
  assert.equal(atlasRoomLocalIndex(353), 239);
  assert.equal(atlasRoomLocalIndex(999), null);
  assert.equal(atlasRoomForZone('vael', 29).id, 143);
  assert.equal(atlasRoomForZone('missing', 0), null);
});

test('atlas rooms carry enemies, bosses, hazards, checkpoints, and gates', () => {
  for (const room of ATLAS_ROOMS) {
    assert.ok(room.name.length > 0);
    assert.ok(room.platforms.length > 0);
    assert.ok(room.gate || Array.isArray(room.gates));
    for (const enemy of room.enemies) {
      assert.ok(ATLAS_ENEMY_INFO[enemy.type], `${room.id} enemy ${enemy.type} exists`);
    }
    if (room.boss) assert.ok(ATLAS_BOSS_INFO[room.boss], `${room.id} boss ${room.boss} exists`);
    if (room.atlasTemplate === 'boss') {
      assert.ok(room.boss);
      assert.equal(room.gate.requires, 'boss');
    }
    if (room.atlasTemplate === 'puzzle') assert.ok(room.relic);
    if (room.hazards.length) {
      for (const hazard of room.hazards) {
        assert.ok(['spore', 'wind', 'saw', 'fog'].includes(hazard.type));
        assert.ok(hazard.dmg > 0);
      }
    }
    if (room.merchant) assert.ok(room.checkpoint, `${room.id} merchant has a checkpoint`);
    for (const key of ['top', 'mid', 'low', 'glow', 'fog']) {
      assert.ok(room.palette[key], `${room.id} palette has ${key}`);
    }
  }
});

test('atlas enemies and bosses cover all eight zones', () => {
  assert.equal(Object.keys(ATLAS_ENEMY_INFO).length, 24);
  assert.equal(Object.keys(ATLAS_BOSS_INFO).length, 16);
  for (const zone of ATLAS_ZONES) {
    const enemies = Object.values(ATLAS_ENEMY_INFO).filter((enemy) => enemy.atlasZone === zone.id);
    assert.equal(enemies.length, 3, `${zone.id} has three enemies`);
    assert.ok(ATLAS_BOSS_INFO[zone.boss], `${zone.id} boss info exists`);
    assert.ok(ATLAS_BOSS_INFO[zone.miniBoss], `${zone.id} mini boss info exists`);
    assert.ok(ATLAS_BOSS_INFO[zone.boss].maxPhases >= 2);
    assert.ok(ATLAS_BOSS_INFO[zone.boss].dialogue.intro.length > 0);
  }
  assert.equal(ATLAS_BOSS_INFO.atlas_boss_foundry.atlasFinal, true);
  assert.equal(ATLAS_BOSS_INFO.atlas_boss_foundry.reward, 'victory');
});

// ── story and lore ─────────────────────────────────────────────────────────
test('atlas story defines timeline, characters, 8 chapters, and 4 endings', () => {
  assert.ok(ATLAS_TIMELINE.length >= 8);
  assert.ok(ATLAS_CHARACTERS.length >= 8);
  assert.equal(ATLAS_CHAPTERS.length, 8);
  assert.equal(ATLAS_ENDINGS.length, 4);
  for (const chapter of ATLAS_CHAPTERS) {
    assert.ok(ATLAS_ZONE_BY_ID[chapter.zone]);
    assert.ok(ATLAS_BOSS_INFO[chapter.boss]);
    assert.equal(chapter.levelStart, ATLAS_ZONE_BY_ID[chapter.zone].levelStart);
  }
  for (const ending of ATLAS_ENDINGS) {
    assert.ok(ending.requirement.length > 0);
    assert.ok(ending.localName.length > 0);
  }
});

test('lore encyclopedia defines 11 categories and 33 three-tier entries', () => {
  assert.equal(LORE_CATEGORIES.length, 11);
  assert.equal(LORE_ENTRIES.length, 33);
  assert.equal(LORE_COMPLETION_REWARDS.length, 11);
  for (const category of LORE_CATEGORIES) {
    const entries = LORE_ENTRIES.filter((entry) => entry.category === category.id);
    assert.equal(entries.length, 3, `${category.id} has three entries`);
    assert.ok(LORE_COMPLETION_REWARDS.some((reward) => reward.category === category.id));
  }
  for (const entry of LORE_ENTRIES) {
    assert.equal(entry.tiers.length, 3);
    assert.deepEqual(entry.tierCosts, [0, 1, 2]);
  }
});

test('lore reveal enforces tier order and pays completion rewards once', () => {
  const progress = defaultAtlasProgress();
  progress.loreFragments = 50;
  assert.equal(revealLore(progress, 'missing', 1).reason, 'unknown_entry');
  assert.equal(revealLore(progress, 'lore_1', 2).reason, 'tier_order');
  assert.equal(revealLore(progress, 'lore_1', 1).tier, 1);
  assert.equal(revealLore(progress, 'lore_1', 1).changed, false);
  assert.equal(revealLore(progress, 'lore_1', 2).tier, 2);
  assert.equal(revealLore(progress, 'lore_1', 3).tier, 3);

  for (const id of ['lore_2', 'lore_3']) {
    for (const tier of [1, 2, 3]) revealLore(progress, id, tier);
  }
  assert.equal(progress.flags.lore_sejarah, true);
  const marksAfterReward = progress.marks;
  assert.ok(marksAfterReward >= 120);

  const again = revealLore(progress, 'lore_3', 3);
  assert.equal(again.changed, false);
  assert.equal(progress.marks, marksAfterReward);
});

test('lore completion and search helpers report progress and filter tiers', () => {
  const progress = defaultAtlasProgress();
  progress.loreFragments = 50;
  revealLore(progress, 'lore_1', 1);
  const completion = loreCompletion(progress);
  assert.equal(completion.total, 99);
  assert.equal(completion.revealed, 1);
  assert.equal(completion.complete, false);
  assert.equal(completion.categories.length, 11);
  assert.equal(completion.categories.find((entry) => entry.id === 'sejarah').done, false);

  const hidden = searchLore('akar', progress);
  assert.ok(hidden.length >= 1);
  const revealedOnly = searchLore('akar', progress, { onlyRevealed: true });
  assert.equal(revealedOnly.length, 1);
  assert.equal(revealedOnly[0].id, 'lore_1');
  assert.equal(searchLore('akar', progress, { category: 'sejarah' }).every((entry) => entry.category === 'sejarah'), true);
  assert.equal(searchLore('pohon', progress, { category: 'bos' }).length, 0);
});

// ── consumables and crafting ───────────────────────────────────────────────
test('atlas defines 55 consumables, 4 quick slots, an item wheel, and 12 recipes', () => {
  assert.equal(ATLAS_CONSUMABLES.length, 55);
  assert.equal(Object.keys(ATLAS_CONSUMABLE_BY_ID).length, 55);
  assert.equal(ATLAS_QUICK_SLOTS.length, 4);
  assert.equal(ATLAS_ITEM_WHEEL.length, 8);
  assert.equal(ATLAS_RECIPES.length, 12);
  assert.equal(ATLAS_RECIPES.filter((recipe) => recipe.kind === 'cook').length, 6);
  assert.equal(ATLAS_RECIPES.filter((recipe) => recipe.kind === 'craft').length, 6);
  for (const recipe of ATLAS_RECIPES) {
    assert.ok(ATLAS_CONSUMABLE_BY_ID[recipe.output], `${recipe.id} output exists`);
    for (const input of recipe.inputs) assert.ok(ATLAS_CONSUMABLE_BY_ID[input], `${recipe.id} input ${input} exists`);
  }
  for (const item of ATLAS_CONSUMABLES) {
    assert.ok(item.price > 0);
    assert.ok(item.tier >= 1);
    assert.ok(item.type.length > 0);
  }
});

test('consumables can be bought, used, and counted safely', () => {
  const progress = defaultAtlasProgress();
  const item = ATLAS_CONSUMABLES[0];
  assert.equal(useAtlasConsumable(progress, item.id).reason, 'empty');
  assert.equal(useAtlasConsumable(progress, 'missing').reason, 'unknown_item');
  progress.marks = 1000;
  const stock = shopStock('shop_vael', progress);
  const entry = stock.find((candidate) => candidate.id === item.id);
  assert.ok(entry);
  assert.equal(buyAtlasItem(progress, 'shop_vael', item.id).ok, true);
  assert.equal(progress.consumables[item.id], 1);
  const used = useAtlasConsumable(progress, item.id);
  assert.equal(used.ok, true);
  assert.equal(used.remaining, 0);
  assert.equal(progress.consumables[item.id], 0);
});

// ── shops, armor, charms, weapons ──────────────────────────────────────────
test('atlas defines 6 shops with stock, reputation, and economy helpers', () => {
  assert.equal(ATLAS_SHOPS.length, 6);
  for (const shop of ATLAS_SHOPS) {
    assert.ok(ATLAS_ZONE_BY_ID[shop.zone]);
    assert.ok(shop.npc.length > 0);
    const stock = shopStock(shop.id, defaultAtlasProgress());
    assert.ok(stock.length >= 4, `${shop.id} has stock`);
    for (const entry of stock) {
      assert.ok(entry.price > 0);
      assert.ok(['consumable', 'armor', 'charm'].includes(entry.kind));
    }
  }
  assert.equal(shopStock('missing').length, 0);

  const base = priceForItem(100, { shopMultiplier: 1.2, demand: 1.1 });
  assert.ok(base > 100);
  const discounted = priceForItem(100, { shopMultiplier: 1, reputation: 20 });
  assert.ok(discounted < 100);
  assert.ok(sellPrice(100) < priceForItem(100));
  assert.ok(sellPrice(1) >= 1);
});

test('shop purchases reject unknown stock and insufficient marks', () => {
  const progress = defaultAtlasProgress();
  progress.marks = 0;
  assert.equal(buyAtlasItem(progress, 'shop_vael', 'missing').reason, 'not_stocked');
  const stock = shopStock('shop_vael', progress);
  const expensive = stock.reduce((best, entry) => (entry.price > best.price ? entry : best), stock[0]);
  assert.equal(buyAtlasItem(progress, 'shop_vael', expensive.id).reason, 'insufficient_marks');
});

test('atlas defines 12 armor sets and 15 charms with valid bonuses', () => {
  assert.equal(ATLAS_ARMOR_SETS.length, 12);
  assert.equal(ATLAS_CHARMS.length, 15);
  assert.equal(new Set(ATLAS_ARMOR_SETS.map((item) => item.id)).size, 12);
  assert.equal(new Set(ATLAS_CHARMS.map((item) => item.id)).size, 15);
  for (const armor of ATLAS_ARMOR_SETS) {
    assert.ok(armor.hp >= 0);
    assert.ok(armor.damage >= 0);
    assert.ok(armor.speed >= 0);
    assert.ok(armor.price > 0);
  }
  for (const charm of ATLAS_CHARMS) {
    assert.ok(charm.effect.length > 0);
    assert.ok(charm.value > 0);
    assert.ok(charm.price > 0);
  }
});

test('atlas defines 40 weapons with mastery and infusions', () => {
  assert.equal(ATLAS_WEAPONS.length, 40);
  assert.equal(Object.keys(ATLAS_WEAPON_BY_ID).length, 40);
  assert.equal(ATLAS_INFUSIONS.length, 6);
  for (const weapon of ATLAS_WEAPONS) {
    assert.ok(['sword', 'pike', 'bow'].includes(weapon.base));
    assert.ok(weapon.damage > 0);
    assert.ok(weapon.speed > 0);
    assert.equal(weapon.masteryMax, 10);
    assert.ok(weapon.infusions.includes('none'));
  }

  const progress = defaultAtlasProgress();
  const weapon = ATLAS_WEAPONS[0];
  assert.deepEqual(weaponMasteryFor(progress, weapon.id), { level: 0, xp: 0, next: 120, bonus: 1 });
  const after = grantWeaponXp(progress, weapon.id, 500);
  assert.ok(after.level >= 2);
  assert.ok(after.bonus > 1);
  grantWeaponXp(progress, weapon.id, 100000);
  assert.equal(weaponMasteryFor(progress, weapon.id).level, 10);

  const infused = applyInfusion(weapon, 'ember');
  assert.equal(infused.infusion, 'ember');
  assert.equal(infused.element, 'fire');
  assert.ok(infused.damage > weapon.damage);
  assert.equal(applyInfusion(null, 'ember'), null);
  assert.equal(applyInfusion(weapon, 'missing').infusion, 'none');
});

// ── progression ────────────────────────────────────────────────────────────
test('atlas progress defaults and sanitizes hostile save data', () => {
  const base = defaultAtlasProgress();
  assert.deepEqual(base.unlockedZones, ['vael', 'aviary']);
  assert.equal(base.marks, 0);
  assert.equal(base.ownedWeapons.length, 3);
  assert.equal(base.quickSlots.length, 4);

  const raw = {
    version: 99,
    unlockedZones: ['vael', 'vael', 'missing'],
    clearedRooms: { 114: true, 113: true, 354: true, 999: true, 143: false },
    zoneBosses: { vael: true, missing: true },
    abilities: ['vow_dash', 'vow_dash', 'cheat'],
    marks: -50,
    loreFragments: '12',
    lore: { lore_1: 2, lore_2: 99, missing: 3 },
    consumables: { atlas_heal_1: 2, atlas_heal_2: 500, missing: 1 },
    ownedArmor: ['armor_1', 'armor_1', 'missing'],
    ownedCharms: ['charm_1', 'missing'],
    equippedArmor: 'missing',
    equippedCharms: ['charm_1', 'charm_2', 'charm_3', 'charm_4'],
    ownedWeapons: ['atlas_weapon_1', 'missing'],
    equippedWeapon: 'missing',
    weaponInfusions: { atlas_weapon_1: 'ember', atlas_weapon_2: 'ember', atlas_weapon_1x: 'cheat' },
    quickSlots: ['atlas_heal_1', 'missing', 'atlas_heal_2', 'atlas_heal_3'],
    stats: { rooms: -1, bosses: '2', deaths: -3, marksEarned: 50 },
    endings: ['ending_mend', 'ending_mend', 'missing'],
    flags: { custom: true },
  };
  const sanitized = sanitizeAtlasProgress(raw);
  assert.deepEqual(sanitized.unlockedZones, ['vael']);
  assert.deepEqual(sanitized.clearedRooms, { 114: true });
  assert.deepEqual(sanitized.zoneBosses, { vael: true });
  assert.deepEqual(sanitized.abilities, ['vow_dash']);
  assert.equal(sanitized.marks, 0);
  assert.equal(sanitized.loreFragments, 12);
  assert.deepEqual(sanitized.lore, { lore_1: 2, lore_2: 3 });
  assert.deepEqual(sanitized.consumables, { atlas_heal_1: 2, atlas_heal_2: 99 });
  assert.deepEqual(sanitized.ownedArmor, ['armor_1']);
  assert.deepEqual(sanitized.ownedCharms, ['charm_1']);
  assert.equal(sanitized.equippedArmor, null);
  assert.deepEqual(sanitized.equippedCharms, ['charm_1']);
  assert.equal(sanitized.equippedWeapon, 'atlas_weapon_1');
  assert.deepEqual(sanitized.weaponInfusions, { atlas_weapon_1: 'ember' });
  assert.deepEqual(sanitized.quickSlots, ['atlas_heal_1', 'atlas_heal_2', 'atlas_heal_2', 'atlas_heal_3']);
  assert.deepEqual(sanitized.stats, { rooms: 0, bosses: 2, deaths: 0, marksEarned: 50 });
  assert.deepEqual(sanitized.endings, ['ending_mend']);
  assert.equal(sanitized.flags.custom, true);
  assert.equal(sanitizeAtlasProgress(null).version, 1);
});

test('atlas zone unlocks respect ability gates', () => {
  const progress = defaultAtlasProgress();
  assert.equal(canUnlockAtlasZone(progress, 'vael'), true);
  assert.equal(canUnlockAtlasZone(progress, 'aviary'), true);
  assert.equal(canUnlockAtlasZone(progress, 'starfall'), false);
  assert.equal(canUnlockAtlasZone(progress, 'missing'), false);

  progress.abilities.push('vow_dash', 'echo_sight');
  assert.equal(canUnlockAtlasZone(progress, 'starfall'), true);
  assert.equal(canUnlockAtlasZone(progress, 'witherwood'), true);
  assert.equal(canUnlockAtlasZone(progress, 'sandglass'), false);

  progress.abilities.push('time_slow', 'grave_step');
  const unlocked = unlockAtlasZones(progress);
  assert.ok(unlocked.includes('sandglass'));
  assert.ok(unlocked.includes('catacombs'));
  assert.equal(new Set(unlocked).size, unlocked.length);
});

test('clearing atlas rooms is idempotent and boss clears grant abilities', () => {
  const progress = defaultAtlasProgress();
  const first = completeAtlasRoom(progress, 114);
  assert.equal(first.ok, true);
  assert.equal(first.firstClear, true);
  assert.equal(first.marks, 24);
  assert.equal(progress.stats.rooms, 1);
  const again = completeAtlasRoom(progress, 114);
  assert.equal(again.firstClear, false);
  assert.equal(again.marks, 0);
  assert.equal(progress.stats.rooms, 1);

  const vaelBoss = ATLAS_ZONE_BY_ID.vael.roomStart + 29;
  const bossClear = completeAtlasRoom(progress, vaelBoss);
  assert.equal(bossClear.ok, true);
  assert.equal(bossClear.ability, 'vow_dash');
  assert.equal(progress.zoneBosses.vael, true);
  assert.equal(progress.stats.bosses, 1);
  assert.equal(progress.abilities.includes('vow_dash'), true);

  const aviaryBoss = ATLAS_ZONE_BY_ID.aviary.roomStart + 29;
  const aviaryClear = completeAtlasRoom(progress, aviaryBoss);
  assert.equal(aviaryClear.ability, 'echo_sight');
  assert.ok(aviaryClear.unlocked.includes('starfall'));
  assert.equal(completeAtlasRoom(progress, 9999).reason, 'unknown_room');

  const stats = atlasStats(progress);
  assert.equal(stats.totalRooms, 240);
  assert.equal(stats.totalBosses, 8);
  assert.equal(stats.bosses, 2);
  assert.ok(stats.percent > 0);
});

test('final atlas boss records an ending exactly once', () => {
  const progress = defaultAtlasProgress();
  const finalRoom = ATLAS_ZONE_BY_ID.foundry.roomStart + 29;
  const result = completeAtlasRoom(progress, finalRoom, { ending: 'ending_rule' });
  assert.equal(result.ending, 'ending_rule');
  assert.deepEqual(progress.endings, ['ending_rule']);
  completeAtlasRoom(progress, finalRoom, { ending: 'ending_rule' });
  assert.deepEqual(progress.endings, ['ending_rule']);
});

test('atlas loadout applies armor, charm, weapon, and mastery bonuses', () => {
  const progress = defaultAtlasProgress();
  progress.ownedArmor = ['armor_1'];
  progress.ownedCharms = ['charm_1', 'charm_2'];
  progress.ownedWeapons = ['atlas_weapon_1'];
  progress.equippedArmor = 'armor_1';
  progress.equippedCharms = ['charm_1', 'charm_2'];
  progress.equippedWeapon = 'atlas_weapon_1';
  grantWeaponXp(progress, 'atlas_weapon_1', 360);

  const player = {
    maxHp: 100,
    hp: 100,
    damageMult: 1,
    speedMult: 1,
    dashCooldownMax: 1,
    maxFlasks: 3,
    flasks: 3,
    weapon: 'sword',
    weapons: ['sword', 'pike', 'bow'],
  };
  const game = { player };
  const bonus = applyAtlasLoadout(game, progress);
  assert.ok(bonus);
  assert.equal(player.maxHp, 100 + ATLAS_ARMOR_SETS[0].hp + ATLAS_CHARMS[0].value);
  assert.equal(player.hp, player.maxHp);
  assert.ok(player.damageMult > 1);
  assert.ok(player.speedMult > 1);
  assert.ok(player.dashCooldownMax < 1);
  assert.equal(player.flasks, player.maxFlasks);
  assert.equal(player.weapon, ATLAS_WEAPONS[0].base);
  assert.equal(game.atlasWeapon.id, 'atlas_weapon_1');
  assert.equal(applyAtlasLoadout(null, progress), null);
});

// ── boss pathfinding and bot ───────────────────────────────────────────────
const TEST_PLATFORMS = [
  { x: 0, y: 470, w: 320, h: 70 },
  { x: 400, y: 410, w: 170, h: 18 },
  { x: 650, y: 330, w: 160, h: 18 },
  { x: 890, y: 400, w: 170, h: 18 },
  { x: 1140, y: 330, w: 260, h: 70 },
  { x: 520, y: 240, w: 150, h: 18 },
];

test('platform graph connects walkable, jumpable, and dashable platforms', () => {
  const graph = buildPlatformGraph(TEST_PLATFORMS, { movement: 'walker' });
  assert.equal(graph.nodes.size, 6);
  assert.ok(graph.edges.get(0).length > 0);
  const path = aStar(graph, 0, 4);
  assert.ok(path);
  assert.equal(path.path[0], 0);
  assert.equal(path.path[path.path.length - 1], 4);
  assert.ok(path.moves.length >= 1);
  assert.ok(reachableNodes(graph, 0).size >= 4);
  assert.equal(aStar(graph, 0, 99), null);
  assert.equal(aStar(graph, 99, 0), null);
});

test('platform graph keeps flyers and walkers on different routes', () => {
  const platforms = [
    { x: 0, y: 470, w: 100, h: 20 },
    { x: 700, y: 470, w: 100, h: 20 },
    { x: 0, y: 100, w: 100, h: 20 },
  ];
  const walker = buildPlatformGraph(platforms, { movement: 'walker' });
  assert.equal(aStar(walker, 0, 1), null);
  const flyer = buildPlatformGraph(platforms, { movement: 'flyer' });
  assert.ok(aStar(flyer, 0, 1));
});

test('boss navigator follows a path and recovers when stuck', () => {
  const graph = buildPlatformGraph(TEST_PLATFORMS, { movement: 'walker' });
  const navigator = new BossNavigator(graph, { startX: 80, startY: 440, stuckLimit: 0.2, recoveryCooldown: 0.1 });
  const boss = { x: 80, y: 420, w: 80, h: 100 };
  const player = { x: 1150, y: 380, w: 30, h: 50 };
  navigator.setGoal(player.x, player.y);
  const snapshot = navigator.snapshot();
  assert.equal(snapshot.currentNodeId, 0);
  assert.equal(snapshot.goalNodeId, 4);
  assert.ok(snapshot.path.length >= 2);

  let recovered = false;
  for (let i = 0; i < 120; i++) {
    const intent = navigator.update(boss, player, 1 / 60);
    if (intent.recovered) recovered = true;
  }
  assert.equal(recovered, true);
  assert.ok(navigator.snapshot().recoveries >= 1);
  assert.equal(navigator.update(null, player, 1 / 60).vx, 0);
  assert.equal(navigator.update(boss, player, 0).vx, 0);
});

test('attack scoring and selection pick the best phase-appropriate attack', () => {
  const attacks = [
    { id: 'jab', baseScore: 10, idealRange: 60, cooldown: 0.4 },
    { id: 'slam', baseScore: 14, idealRange: 150, cooldown: 1.5 },
    { id: 'execute', baseScore: 9, idealRange: 80, cooldown: 2, execute: true, minPhase: 2 },
  ];
  const near = pickBestAttack(attacks, { distance: 60, phase: 1, playerHpFraction: 1 });
  assert.equal(near.attack.id, 'jab');
  const execute = pickBestAttack(attacks, { distance: 80, phase: 3, playerHpFraction: 0.1 });
  assert.equal(execute.attack.id, 'execute');
  assert.equal(pickBestAttack([], {}), null);
  assert.ok(scoreAttack(attacks[0], { distance: 60 }) > scoreAttack(attacks[0], { distance: 400 }));
});

test('boss bot runs 100 deterministic iterations without errors', () => {
  const result = runBossBot({ maxHp: 640, contact: 12, maxPhases: 3, playerDps: 34 }, 100, 7);
  assert.equal(result.iterations, 100);
  assert.equal(result.wins + result.losses, 100);
  assert.equal(result.errors.length, 0);
  assert.equal(result.passed, true);
  assert.ok(result.averageTime > 0);
  const repeat = runBossBot({ maxHp: 640, contact: 12, maxPhases: 3, playerDps: 34 }, 100, 7);
  assert.deepEqual(repeat, result);
  assert.equal(runBossBot({}, 1, 1).iterations, 1);
});

// ── delivery plan ──────────────────────────────────────────────────────────
test('atlas handoff defines 15 phases, a checklist, and quality presets', () => {
  assert.equal(ATLAS_PHASES.length, 15);
  assert.equal(ATLAS_CHECKLIST.length, 28);
  assert.equal(ATLAS_QUALITY_PRESETS.length, 5);
  assert.deepEqual(ATLAS_PHASES.map((phase) => phase.id), ATLAS_PHASES.map((_, index) => `phase_${index}`));
  for (const phase of ATLAS_PHASES) assert.ok(phase.doneWhen.length > 0);
  for (const preset of ATLAS_QUALITY_PRESETS) {
    assert.ok(preset.layers >= 1);
    assert.ok(preset.particles > 0);
    assert.ok(preset.targetFps >= 30);
  }
  assert.equal(ATLAS_QUALITY_PRESETS.find((preset) => preset.id === 'auto').id, 'auto');
});
