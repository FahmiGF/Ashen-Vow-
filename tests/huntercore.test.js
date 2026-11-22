import test from 'node:test';
import assert from 'node:assert/strict';
import { AshenGame } from '../src/core.js';
import { HUNTER_ITEM_BY_ID, HUNTER_MAX_STACK, spiritBounty } from '../src/hunter.js';

function quietGame() {
  const game = new AshenGame();
  game.enemies.length = 0;
  game.projectiles.length = 0;
  game.events.length = 0;
  game.player.x = 100;
  game.player.y = 400;
  game.player.hp = 100;
  game.player.invuln = 0;
  game.player.consumeCooldown = 0;
  game.scaryDifficulty = 'normal';
  return game;
}

test('hunter stock is copied into a run and bounded', () => {
  const game = quietGame();
  game.setHunterItems({ salt_flare: 2, smoke_grenade: 99, fake: 4 });
  assert.equal(game.hunterItemCount('salt_flare'), 2);
  assert.equal(game.hunterItemCount('smoke_grenade'), HUNTER_MAX_STACK);
  assert.equal(game.hunterItemCount('fake'), 0);
  assert.equal(game.quickItemInfo().id, 'salt_flare');
});

test('salt flare only affects spirits, revealing and marking them', () => {
  const game = quietGame();
  game.setHunterItems({ salt_flare: 2 });
  const ghost = game.spawnScaryEnemy('hollow_wraith', 260);
  ghost.stunTimer = 0;
  const normal = game.spawnEnemy({ type: 'crawler', x: 250, minX: 200, maxX: 500 });
  const maxHp = ghost.hp;
  const result = game.useHunterItem('salt_flare');
  assert.equal(result.ok, true);
  assert.equal(game.hunterItemCount('salt_flare'), 1);
  assert.ok(ghost.hp < maxHp);
  assert.ok(ghost.stunTimer > 2);
  assert.ok(ghost.spiritMarkTimer > 0);
  assert.equal(normal.stunTimer || 0, 0);
  assert.equal(normal.spiritMarkTimer || 0, 0);
});

test('a spirit round deals bonus damage and stuns a spirit on hit', () => {
  const game = quietGame();
  game.setHunterItems({ spirit_bane: 1 });
  const ghost = game.spawnScaryEnemy('silent_knight', 220);
  ghost.stunTimer = 8;
  ghost.x = 220;
  const maxHp = ghost.hp;
  const result = game.useHunterItem('spirit_bane');
  assert.equal(result.ok, true);
  const shot = game.projectiles.find((pr) => pr.type === 'spirit_bane');
  assert.ok(shot);
  const uses = game.events.filter((ev) => ev.type === 'hunterItemUse');
  assert.equal(uses.length, 1);
  assert.equal(uses[0].id, 'spirit_bane');
  assert.equal(uses[0].remaining, 0);
  assert.equal(shot.spiritDamage, HUNTER_ITEM_BY_ID.spirit_bane.spiritDamage);
  for (let i = 0; i < 30 && !ghost.dead; i += 1) game.updateProjectiles(1 / 120);
  assert.ok(ghost.hp < maxHp - 50, `expected heavy spirit hit, got ${maxHp - ghost.hp}`);
  assert.ok(ghost.stunTimer > 0);
});

test('a marked spirit takes extra damage from ordinary attacks', () => {
  const game = quietGame();
  const a = game.spawnScaryEnemy('night_stalker', 260);
  const b = game.spawnScaryEnemy('night_stalker', 620);
  a.stunTimer = 9;
  b.stunTimer = 9;
  a.spiritMarkTimer = 6;
  const beforeA = a.hp;
  const beforeB = b.hp;
  game.hurtEnemy(a, { dmg: 20, knock: 0, name: 'sword' }, 1);
  game.hurtEnemy(b, { dmg: 20, knock: 0, name: 'sword' }, 1);
  assert.ok(beforeA - a.hp > beforeB - b.hp);
});

test('smoke stuns nearby spirits and grants a short escape invulnerability', () => {
  const game = quietGame();
  game.setHunterItems({ smoke_grenade: 1 });
  const ghost = game.spawnScaryEnemy('hollow_wraith', 250);
  const result = game.useHunterItem('smoke_grenade');
  assert.equal(result.ok, true);
  assert.ok(ghost.stunTimer > 1);
  assert.ok(ghost.spiritMarkTimer > 0);
  assert.ok(game.player.invuln >= 1.3);
});

test('ward charm cuts only spirit damage', () => {
  const game = quietGame();
  game.setHunterItems({ ward_charm: 1 });
  assert.equal(game.useHunterItem('ward_charm').ok, true);
  const hp = game.player.hp;
  game.damagePlayer(30, 200, { source: { type: 'ghost:hollow_wraith', ghostKind: 'hollow_wraith' }, knock: false });
  assert.equal(game.player.hp, hp - 12);
  game.player.invuln = 0;
  const hp2 = game.player.hp;
  game.damagePlayer(30, 200, { source: { type: 'crawler', family: 'crawler' }, knock: false });
  assert.equal(game.player.hp, hp2 - 30);
});

test('quick-item cycling includes hunter stock without duplicates', () => {
  const game = quietGame();
  game.setHunterItems({ salt_flare: 1, ward_charm: 1 });
  game.player.quickItem = 'salt_flare';
  assert.deepEqual(game.ownedQuickItems().slice(0, 2), ['salt_flare', 'ward_charm']);
  game.cycleItem();
  assert.equal(game.player.quickItem, 'ward_charm');
});

test('spirit death emits exactly one bounty and adds no double reward', () => {
  const game = quietGame();
  const ghost = game.spawnScaryEnemy('hollow_wraith', 300);
  game.hurtEnemy(ghost, { dmg: 9999, knock: 0, name: 'spirit_bane' }, 1);
  game.banishGhost(ghost);
  const downs = game.events.filter((ev) => ev.type === 'spiritDown');
  assert.equal(downs.length, 1);
  assert.equal(downs[0].marks, spiritBounty(ghost));
  assert.ok(downs[0].marks > 0);
});

test('normal rooms and normal enemies remain unaffected by anti-ghost tools', () => {
  const game = quietGame();
  game.setHunterItems({ salt_flare: 1 });
  game.spawnEnemy({ type: 'crawler', x: 260, minX: 200, maxX: 500 });
  const result = game.useHunterItem('salt_flare');
  assert.equal(result.ok, false);
  assert.equal(game.hunterItemCount('salt_flare'), 1);
});
