// Update XXV — The Vigil Tree (Scary Mode skill tree).
// The tree is a pure model; these tests cover the economy, the prerequisites,
// the sanitizer, the journal round-trip and the real core fields it touches.

import test from 'node:test';
import assert from 'node:assert/strict';

import { AshenGame } from '../src/core.js';
import { HorrorJournal, sanitizeHorrorProgress } from '../src/scary2.js';
import {
  HORROR_TREE_BASE_POINTS,
  HORROR_TREE_BRANCHES,
  HORROR_TREE_MAX_RANKS,
  HORROR_TREE_NODES,
  HORROR_TREE_NODE_BY_ID,
  applyHorrorTree,
  horrorCanRank,
  horrorRankUp,
  horrorResetSkills,
  horrorTreeBonuses,
  horrorTreePointsEarned,
  horrorTreeSnapshot,
  horrorTreeSpent,
  horrorTreeSummary,
  sanitizeHorrorSkills,
} from '../src/horror_tree.js';

function fresh() {
  const game = new AshenGame();
  game.enterRoom(0);
  return game;
}

test('the tree has three branches, nine real nodes and valid prerequisites', () => {
  assert.equal(HORROR_TREE_BRANCHES.length, 3);
  assert.equal(HORROR_TREE_NODES.length, 9);
  assert.equal(new Set(HORROR_TREE_NODES.map((node) => node.id)).size, 9);
  assert.equal(HORROR_TREE_MAX_RANKS, HORROR_TREE_NODES.reduce((sum, node) => sum + node.maxRank, 0));
  for (const branch of HORROR_TREE_BRANCHES) {
    const nodes = HORROR_TREE_NODES.filter((node) => node.branch === branch.id);
    assert.equal(nodes.length, 3, `${branch.id} has three nodes`);
    assert.ok(nodes.some((node) => node.tier === 1), `${branch.id} has an entry node`);
  }
  for (const node of HORROR_TREE_NODES) {
    assert.ok(node.cost >= 1 && node.maxRank >= 1);
    assert.ok(node.label && typeof node.describe === 'function');
    assert.ok(node.describe(1).length > 3, `${node.id} describes its first rank`);
    assert.ok(node.describe(node.maxRank).length > 3, `${node.id} describes its final rank`);
    if (node.requires) {
      assert.ok(HORROR_TREE_NODE_BY_ID[node.requires], `${node.id} requires a real node`);
      assert.equal(HORROR_TREE_NODE_BY_ID[node.requires].branch, node.branch, `${node.id} stays in its branch`);
    }
  }
});

test('points come from real journal progress and are never invented', () => {
  assert.equal(horrorTreePointsEarned({}), HORROR_TREE_BASE_POINTS);
  assert.equal(horrorTreePointsEarned(null), HORROR_TREE_BASE_POINTS);
  const journal = {
    events: { the_watcher: 2, the_pursuit: 1, broken: 0 },
    achievements: [{ unlocked: true }, { unlocked: false }, { unlocked: true }],
    clears: { easy: 1, normal: 2, hard: 1 },
  };
  // 3 base + 2 events + 2 achievements × 2 + 1 + 2 + 1 × 2
  assert.equal(horrorTreePointsEarned(journal), 3 + 2 + 4 + 1 + 2 + 2);
  const capped = horrorTreePointsEarned({ clears: { easy: 99, normal: 99, hard: 99 } });
  assert.equal(capped, HORROR_TREE_BASE_POINTS + 6 + 6 + 12);
});

test('rank up spends the node cost and respects prerequisites and the cap', () => {
  const locked = horrorCanRank({}, 'dusk_flask', 50);
  assert.equal(locked.ok, false);
  assert.equal(locked.reason, 'locked');
  assert.equal(horrorCanRank({}, 'vow_iron', 0).reason, 'points');
  assert.equal(horrorCanRank({}, 'vow_iron', 1).ok, true);

  const first = horrorRankUp({}, 'vow_iron', 4);
  assert.equal(first.ok, true);
  assert.deepEqual(first.ranks, { vow_iron: 1 });
  assert.equal(first.cost, 1);

  const second = horrorRankUp(first.ranks, 'dusk_flask', 3);
  assert.equal(second.ok, true);
  assert.deepEqual(second.ranks, { vow_iron: 1, dusk_flask: 1 });
  assert.equal(second.cost, 2);

  const maxed = horrorRankUp({ vow_iron: 3 }, 'vow_iron', 9);
  assert.equal(maxed.ok, false);
  assert.equal(maxed.reason, 'maxed');
  assert.equal(horrorTreeSpent({ vow_iron: 3, dusk_flask: 2 }), 3 + 4);
});

test('the sanitizer clamps ranks, drops unknown ids and removes orphaned children', () => {
  assert.deepEqual(sanitizeHorrorSkills({}), {});
  assert.deepEqual(sanitizeHorrorSkills(null), {});
  assert.deepEqual(sanitizeHorrorSkills({ vow_iron: 99 }), { vow_iron: 3 });
  assert.deepEqual(sanitizeHorrorSkills({ ghost_node: 2, vow_iron: 1 }), { vow_iron: 1 });
  assert.deepEqual(sanitizeHorrorSkills({ dusk_flask: 2 }), {}, 'a child without its prerequisite is dropped');
  assert.deepEqual(sanitizeHorrorSkills({ vow_iron: -4.7 }), {});
});

test('bonuses sum every owned rank into fields the simulation already reads', () => {
  const bonuses = horrorTreeBonuses({ vow_iron: 2, dusk_flask: 1, hunters_eye: 2, salt_pouch: 1 });
  assert.equal(bonuses.hpPct, 0.2);
  assert.equal(bonuses.flasks, 1);
  assert.equal(bonuses.crit, 0.08);
  assert.equal(bonuses.items.salt_flare, 1);
  assert.equal(bonuses.wardSeconds, 0);
  assert.equal(bonuses.wardReduction, 0, 'no ward without the ward node');
  const ward = horrorTreeBonuses({ vow_iron: 1, ward_of_ash: 2 });
  assert.equal(ward.wardSeconds, 12);
  assert.ok(ward.wardReduction > 0.55 && ward.wardReduction <= 0.9);
  assert.deepEqual(horrorTreeBonuses({}), {
    hpPct: 0, flasks: 0, crit: 0, speed: 0, ash: 0,
    wardSeconds: 0, wardReduction: 0, eventDelay: 0, items: {}, ranks: {},
  });
});

test('a free respec returns every point without touching progress', () => {
  assert.deepEqual(horrorResetSkills(), {});
  const summary = horrorTreeSummary({ vow_iron: 2, hunters_eye: 1 }, {});
  assert.equal(summary.spent, 3);
  assert.equal(summary.available, 0, 'every starting point is spent');
  assert.equal(summary.ranksOwned, 3);
  assert.equal(summary.complete, false);
  assert.equal(horrorTreeSummary({}, {}).available, HORROR_TREE_BASE_POINTS);
});

test('the snapshot blocks a node the player cannot afford or unlock', () => {
  const snapshot = horrorTreeSnapshot({}, {});
  assert.equal(snapshot.available, HORROR_TREE_BASE_POINTS);
  assert.equal(snapshot.branches.length, 3);
  const flat = snapshot.branches.flatMap((branch) => branch.nodes);
  assert.equal(flat.length, 9);
  const vow = flat.find((node) => node.id === 'vow_iron');
  assert.equal(vow.canRank, true);
  assert.equal(vow.description, HORROR_TREE_NODE_BY_ID.vow_iron.describe(1));
  assert.equal(vow.next, HORROR_TREE_NODE_BY_ID.vow_iron.describe(1));
  assert.match(vow.next, /\+10%/);
  const flask = flat.find((node) => node.id === 'dusk_flask');
  assert.equal(flask.canRank, false);
  assert.equal(flask.blockedBy, 'locked');
  const poor = horrorTreeSnapshot({}, { clears: {} }).branches
    .flatMap((branch) => branch.nodes)
    .find((node) => node.id === 'salt_pouch');
  assert.equal(poor.canRank, false);
});

test('the journal persists ranks inside ashen-vow-horror-v1 and sanitizes junk', () => {
  const journal = new HorrorJournal({ skills: { vow_iron: 2, hunters_eye: 1, bogus: 5, dusk_flask: 1 } });
  assert.deepEqual(journal.skills, { vow_iron: 2, hunters_eye: 1, dusk_flask: 1 });
  const saved = JSON.parse(JSON.stringify(journal.toJSON()));
  assert.deepEqual(saved.skills, { vow_iron: 2, hunters_eye: 1, dusk_flask: 1 });
  const reloaded = new HorrorJournal(saved);
  assert.deepEqual(reloaded.skills, { vow_iron: 2, hunters_eye: 1, dusk_flask: 1 });
  assert.deepEqual(reloaded.snapshot().skills, { vow_iron: 2, hunters_eye: 1, dusk_flask: 1 });

  const repaired = sanitizeHorrorProgress({ skills: { vow_iron: 9, dusk_flask: 2 } });
  assert.deepEqual(repaired.skills, { vow_iron: 3, dusk_flask: 2 }, 'clamped ranks keep their legal prerequisite');
  assert.deepEqual(sanitizeHorrorProgress({ skills: { dusk_flask: 2 } }).skills, {}, 'orphaned ranks are removed on load');
  assert.deepEqual(sanitizeHorrorProgress({}).skills, {});
});

test('applying the tree changes real player fields and leaves horror difficulty alone', () => {
  const game = fresh();
  game.difficulty = 'normal';
  game.setScaryMode({ enabled: true, difficulty: 'hard' });
  const baseHp = game.player.maxHp;
  const baseFlasks = game.player.maxFlasks;
  const baseCrit = game.player.critChance || 0;
  const baseSpeed = game.player.speedMult;

  const applied = applyHorrorTree(game, horrorTreeBonuses({ vow_iron: 2, dusk_flask: 1, hunters_eye: 2, swift_vigil: 1 }));
  assert.equal(game.player.maxHp, Math.round(baseHp * 1.2));
  assert.ok(game.player.hp <= game.player.maxHp);
  assert.equal(game.player.maxFlasks, baseFlasks + 1);
  assert.equal(game.player.flasks, game.player.maxFlasks);
  assert.ok(Math.abs((game.player.critChance || 0) - (baseCrit + 0.08)) < 1e-9);
  assert.ok(game.player.speedMult > baseSpeed);
  assert.equal(applied.hp, game.player.maxHp);
  assert.equal(game.difficulty, 'normal', 'campaign difficulty untouched');
  assert.equal(game.scaryDifficulty, 'hard', 'horror difficulty untouched');
  assert.equal(game.scaryEnabled, true);
});

test('an empty tree applies nothing and a missing game is refused', () => {
  const game = fresh();
  const before = game.player.maxHp;
  assert.deepEqual(applyHorrorTree(game, horrorTreeBonuses({})), {});
  assert.equal(game.player.maxHp, before);
  assert.equal(applyHorrorTree(null, horrorTreeBonuses({ vow_iron: 1 })), null);
  assert.equal(applyHorrorTree(game, null), null);
});
