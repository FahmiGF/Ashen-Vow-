// tests/frontier.test.js
// Verification suite for Ashen Vow — Infinite Frontiers Update (Beyond the Veil)
// Tests: Levels 101-200, 15 Classes, Elite Mobs, Weapons, Customization,
// 3D Mode Engine, Combat, Traversal, and Map Editor.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FRONTIER_VERSION,
  FRONTIER_CHAPTERS,
  FRONTIER_CHAPTER_BY_ID,
  FRONTIER_LEVEL_SPECS,
  FRONTIER_CLASSES,
  FRONTIER_CLASS_BY_ID,
  ELITE_RANKS,
  ELITE_MOBS,
  ELITE_MODIFIERS,
  FRONTIER_WEAPON_CATEGORIES,
  REGIONAL_MATERIALS,
  CRAFTING_RECIPES,
  CUSTOMIZATION_LAYERS,
  DYE_PALETTE,
  MOUNT_ROSTER,
  COMPANION_ROSTER,
  CORE_ATTRIBUTES,
  KINGDOM_DEFENSE_TOWERS,
  FRONTIER_EXTRA_MODES,
  SCRIPTING_NODE_WHITELIST,
  MAP_VALIDATION_RULES,
  ACCEPTANCE_CHECKLIST_ITEMS,
  defaultFrontierProgress,
  sanitizeFrontierProgress,
  levelSpecByNumber,
  chapterForLevel,
} from '../src/frontier.js';

import {
  Ashen3DGame,
  project3D,
  dist3D,
  vec3,
  clamp,
  render3D,
} from '../src/mode3d.js';

test('frontier chapters define 10 expansion chapters (11-20)', () => {
  assert.equal(FRONTIER_CHAPTERS.length, 10);
  assert.equal(FRONTIER_CHAPTERS[0].number, 11);
  assert.equal(FRONTIER_CHAPTERS[9].number, 20);

  for (const ch of FRONTIER_CHAPTERS) {
    assert.ok(ch.id && ch.name && ch.english && ch.bossId && ch.bossName);
    assert.equal(FRONTIER_CHAPTER_BY_ID[ch.id], ch);
    assert.equal(ch.levelEnd - ch.levelStart + 1, 10);
  }
});

test('frontier levels define all 100 levels from 101 to 200', () => {
  assert.equal(FRONTIER_LEVEL_SPECS.length, 100);
  assert.equal(FRONTIER_LEVEL_SPECS[0].level, 101);
  assert.equal(FRONTIER_LEVEL_SPECS[99].level, 200);

  // Each chapter has 10 levels
  for (let ch = 11; ch <= 20; ch++) {
    const levelsInCh = FRONTIER_LEVEL_SPECS.filter((l) => l.chapter === ch);
    assert.equal(levelsInCh.length, 10, `Chapter ${ch} must have exactly 10 levels`);
    const lastLevel = levelsInCh[9];
    assert.ok(lastLevel.boss, `Level ${lastLevel.level} must be a major boss arena`);
  }

  // Lookup helpers
  const l101 = levelSpecByNumber(101);
  assert.equal(l101.name, 'Beyond the Ashen Gate');
  const ch101 = chapterForLevel(101);
  assert.equal(ch101.number, 11);

  const l200 = levelSpecByNumber(200);
  assert.equal(l200.name, 'The Eternal Beginning');
  const ch200 = chapterForLevel(200);
  assert.equal(ch200.number, 20);
});

test('frontier classes define exactly 15 playable classes with 4 abilities and 3 specs each', () => {
  assert.equal(FRONTIER_CLASSES.length, 15);
  for (const cls of FRONTIER_CLASSES) {
    assert.ok(cls.id && cls.name && cls.title && cls.combatIdentity && cls.mainWeapon);
    assert.equal(FRONTIER_CLASS_BY_ID[cls.id], cls);
    assert.equal(cls.abilities.length, 4, `Class ${cls.name} must have 4 abilities`);
    assert.equal(cls.specializations.length, 3, `Class ${cls.name} must have 3 specializations`);
    assert.ok(cls.unlockCondition, `Class ${cls.name} must have an unlock condition`);
  }
});

test('elite mob system defines 7 ranks, 15 elite mobs, and 10 modifiers', () => {
  assert.equal(ELITE_RANKS.length, 7);
  assert.equal(ELITE_RANKS[0].id, 'E1');
  assert.equal(ELITE_RANKS[6].id, 'E7');

  assert.equal(ELITE_MOBS.length, 15);
  for (const elite of ELITE_MOBS) {
    assert.ok(elite.id && elite.name && elite.biome && elite.rank && elite.uniqueMechanic);
    assert.ok(elite.hp > 0 && elite.dmg > 0);
  }

  assert.equal(ELITE_MODIFIERS.length, 10);
});

test('weapons define 15 categories, 8 regional materials, and crafting recipes', () => {
  assert.equal(FRONTIER_WEAPON_CATEGORIES.length, 15);
  assert.equal(REGIONAL_MATERIALS.length, 8);
  assert.ok(CRAFTING_RECIPES.length >= 5);

  for (const recipe of CRAFTING_RECIPES) {
    assert.ok(recipe.id && recipe.name && recipe.category);
    assert.ok(Object.keys(recipe.materials).length > 0);
  }
});

test('customization defines 12 layers, 10 dyes, 10 mounts, and 10 companions', () => {
  assert.equal(CUSTOMIZATION_LAYERS.length, 12);
  assert.equal(DYE_PALETTE.length, 10);
  assert.equal(MOUNT_ROSTER.length, 10);
  assert.equal(COMPANION_ROSTER.length, 10);
  assert.equal(CORE_ATTRIBUTES.length, 6);
});

test('extra modes define Kingdom Defense with 10 towers and map editor validation', () => {
  assert.equal(KINGDOM_DEFENSE_TOWERS.length, 10);
  assert.ok(FRONTIER_EXTRA_MODES.length >= 7);
  assert.ok(SCRIPTING_NODE_WHITELIST.length >= 10);
  assert.equal(MAP_VALIDATION_RULES.length, 10);
});

test('acceptance checklist defines exactly 30 items across 5 categories', () => {
  assert.equal(ACCEPTANCE_CHECKLIST_ITEMS.length, 30);
  const groups = new Set(ACCEPTANCE_CHECKLIST_ITEMS.map((item) => item.group));
  assert.ok(groups.has('2D Campaign'));
  assert.ok(groups.has('3D Mode'));
  assert.ok(groups.has('Customization'));
  assert.ok(groups.has('Map Editor'));
  assert.ok(groups.has('Optimization'));
});

test('progression sanitize migrates and preserves player state safely', () => {
  const def = defaultFrontierProgress();
  assert.equal(def.highestLevel, 101);
  assert.equal(def.activeClass, 'warden');
  assert.equal(def.checklistPassed.length, 30);

  const sanitized = sanitizeFrontierProgress({ highestLevel: 145, activeClass: 'chronomancer' });
  assert.equal(sanitized.highestLevel, 145);
  assert.equal(sanitized.activeClass, 'chronomancer');
  assert.equal(sanitized.unlockedClasses[0], 'warden');
});

test('3D mode engine initializes and runs physics, camera, and combat simulation', () => {
  const game = new Ashen3DGame();
  assert.ok(game.player && game.camera);
  assert.equal(game.npcs.length, 3);
  assert.equal(game.enemies.length, 4);
  assert.ok(game.elite && game.boss);

  // Update without input
  game.update(0.016, {});
  assert.equal(game.player.y, 0, 'player should stay grounded');

  // Jump and double jump
  game.update(0.016, { jumpJustPressed: true });
  assert.ok(game.player.vy > 0, 'jump should impart positive vertical velocity');

  // Horizontal movement
  game.update(0.016, { up: true });
  assert.ok(game.player.vz !== 0, 'forward movement should move in Z axis');

  // Attack execution
  const initialEnemyHp = game.enemies[0].hp;
  game.player.x = game.enemies[0].x;
  game.player.z = game.enemies[0].z - 30;
  game.player.yaw = 0; // facing +Z towards enemy
  game.update(0.016, { attackJustPressed: true });
  assert.ok(game.enemies[0].hp < initialEnemyHp, 'attack should damage enemy within reach');
});

test('3D projection math handles screen transforms and clipping properly', () => {
  const camera = { x: 0, y: 50, z: -100, yaw: 0, pitch: 0 };
  const inFront = { x: 0, y: 50, z: 100 };
  const proj = project3D(inFront, camera, 480, 960, 540);
  assert.ok(proj !== null);
  assert.equal(Math.round(proj.sx), 480);
  assert.equal(Math.round(proj.sy), 270);

  const behind = { x: 0, y: 50, z: -200 };
  const behindProj = project3D(behind, camera, 480, 960, 540);
  assert.equal(behindProj, null, 'points behind camera must clip to null');
});

test('3D canvas renderer executes without errors on mock context', () => {
  const game = new Ashen3DGame();
  const ops = [];
  const gradient = { addColorStop: () => {} };
  const mockCtx = {
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    save: () => ops.push(['save']),
    restore: () => ops.push(['restore']),
    clearRect: () => ops.push(['clearRect']),
    fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '',
    globalAlpha: 1, globalCompositeOperation: 'source-over',
    fillRect: (x, y, w, h) => ops.push(['fillRect', x, y, w, h]),
    beginPath: () => ops.push(['beginPath']),
    moveTo: (x, y) => ops.push(['moveTo', x, y]),
    lineTo: (x, y) => ops.push(['lineTo', x, y]),
    quadraticCurveTo: () => ops.push(['quadraticCurveTo']),
    bezierCurveTo: () => ops.push(['bezierCurveTo']),
    arc: (x, y, r) => ops.push(['arc', x, y, r]),
    ellipse: (x, y, rx, ry) => ops.push(['ellipse', x, y, rx, ry]),
    fill: () => ops.push(['fill']),
    stroke: () => ops.push(['stroke']),
    closePath: () => ops.push(['closePath']),
    fillText: (txt, x, y) => ops.push(['fillText', txt, x, y]),
    roundRect: (x, y, w, h, r) => ops.push(['roundRect', x, y, w, h, r]),
    measureText: (text) => ({ width: String(text).length * 6 }),
  };

  render3D(mockCtx, game);
  assert.ok(ops.length > 50, 'render3D must produce drawing operations');
});
