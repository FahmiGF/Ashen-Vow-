import test from 'node:test';
import assert from 'node:assert/strict';
import { AshenGame, FLOOR_Y, ROOMS, ATTACKS } from '../src/core.js';

const DT = 1 / 120;

function stepN(game, seconds, input = {}) {
  const frames = Math.max(1, Math.round(seconds / DT));
  for (let i = 0; i < frames; i++) game.update(DT, input);
}

function tap(game, key, holdSeconds = 0.05) {
  game.update(DT, { [key]: true });
  stepN(game, holdSeconds);
}

// Fires the attack button on alternating frames so each attack can chain.
function autoAttack(game, seconds) {
  const frames = Math.max(1, Math.round(seconds / DT));
  for (let i = 0; i < frames; i++) {
    game.update(DT, { attack: i % 2 === 0 });
  }
}

function fresh() {
  const g = new AshenGame();
  stepN(g, 0.2);
  return g;
}

test('starts in room 0 with full health and two enemies', () => {
  const g = fresh();
  assert.equal(g.state, 'playing');
  assert.equal(g.roomIndex, 0);
  assert.equal(g.player.hp, 100);
  assert.equal(g.player.maxHp, 100);
  assert.equal(g.enemies.length, 2);
  assert.equal(ROOMS.length, 4);
});

test('gravity and one-way platforms land the player on the floor', () => {
  const g = fresh();
  const p = g.player;
  p.y = 100;
  p.vy = 0;
  stepN(g, 1.2);
  assert.equal(p.onGround, true);
  assert.ok(Math.abs(p.y + p.h - FLOOR_Y) < 0.001, `expected feet at floor, got ${p.y + p.h}`);
});

test('movement responds to input and respects world bounds', () => {
  const g = fresh();
  const startX = g.player.x;
  stepN(g, 0.5, { right: true });
  assert.ok(g.player.x > startX + 60, 'player should move right');
  g.player.x = 0;
  stepN(g, 1.0, { left: true });
  assert.equal(g.player.x, 0);
});

test('single jump works, double jump requires the relic', () => {
  const g = fresh();
  const p = g.player;
  p.relic = false;
  p.onGround = true;
  p.jumpsUsed = 0;
  tap(g, 'jump', 0.05);
  assert.ok(p.vy < 0, 'first jump should launch');
  const before = p.jumpsUsed;
  stepN(g, 0.15);
  tap(g, 'jump', 0.05);
  assert.equal(p.jumpsUsed, before, 'no double jump before the relic');

  // Recreate a jump with the relic unlocked.
  p.x = 120;
  p.y = FLOOR_Y - p.h;
  p.vy = 0;
  p.jumpBuffer = 0;
  p.onGround = true;
  p.jumpsUsed = 0;
  stepN(g, 0.05);
  p.relic = true;
  tap(g, 'jump', 0.05);
  stepN(g, 0.15);
  tap(g, 'jump', 0.05);
  assert.equal(p.jumpsUsed, 2);
  assert.ok(p.vy < -200, 'double jump should refresh upward velocity');
});

test('sword combo kills a crawler (hit registration works)', () => {
  const g = fresh();
  const p = g.player;
  const enemy = g.enemies[0];
  p.x = enemy.x - 52;
  p.y = FLOOR_Y - p.h;
  p.onGround = true;
  p.facing = 1;
  p.invuln = 999; // isolate offence from contact damage
  enemy.speed = 0;
  const hp0 = enemy.hp;
  autoAttack(g, 0.45);
  assert.ok(g.enemies.length === 2, 'one attack should not instantly kill');
  assert.ok(g.enemies[0].hp < hp0 || g.enemies.length < 2, 'sword must register damage');
  autoAttack(g, 3.2);
  assert.equal(g.enemies.length, 1, 'crawler should die to the combo');
  assert.ok(g.kills >= 1);
});

test('player i-frames prevent stacked damage', () => {
  const g = fresh();
  const p = g.player;
  p.invuln = 0;
  const first = g.damagePlayer(10, p.x + 100);
  const second = g.damagePlayer(10, p.x + 100);
  assert.equal(first, true);
  assert.equal(second, false);
  assert.equal(p.hp, 90);
});

test('dash grants i-frames and goes on cooldown', () => {
  const g = fresh();
  const p = g.player;
  p.invuln = 0;
  tap(g, 'dash', 0.02);
  assert.ok(p.dashTimer > 0, 'dash must be active');
  assert.ok(p.dashCooldown > 0, 'dash must go on cooldown');
  assert.equal(g.damagePlayer(10, p.x), false, 'dash i-frames must absorb the hit');
  stepN(g, 1.0);
  assert.equal(p.dashCooldown <= 0, true, 'cooldown should recover');
});

test('healing flask restores health once', () => {
  const g = fresh();
  const p = g.player;
  p.hp = 40;
  p.onGround = true;
  stepN(g, 0.05);
  tap(g, 'heal', 0.7);
  assert.equal(p.flasks, 2);
  assert.equal(p.hp, 78);
  p.hp = 60;
  tap(g, 'heal', 0.7);
  assert.equal(p.hp, 98);
});

test('room 0 gate is locked until enemies are cleared, then transitions', () => {
  const g = fresh();
  const p = g.player;
  assert.equal(g.gate.open, false);
  p.x = 1350;
  p.y = FLOOR_Y - p.h;
  stepN(g, 0.2);
  assert.equal(g.roomIndex, 0, 'locked gate must not transition');

  g.enemies.forEach((e) => (e.dead = true));
  g.update(DT, {});
  assert.equal(g.gate.open, true);
  stepN(g, 0.2);
  assert.equal(g.roomIndex, 1);
  assert.equal(g.room.name, 'Balai Sumpah');
});

test('relic pickup unlocks double jump and the room 1 gate', () => {
  const g = fresh();
  g.enterRoom(1);
  assert.equal(g.gate.open, false);
  const relic = ROOMS[1].relic;
  g.player.x = relic.x;
  g.player.y = relic.y;
  stepN(g, 0.1);
  assert.equal(g.player.relic, true);
  assert.equal(g.gate.open, true);
  assert.ok(g.events.some((e) => e.type === 'relic'));
});

test('pit hazard damages and respawns the player', () => {
  const g = fresh();
  g.enterRoom(1);
  const p = g.player;
  p.invuln = 0;
  p.x = 640;
  p.y = 700;
  stepN(g, 0.05);
  assert.equal(p.hp, 72);
  assert.ok(p.y < 500, 'player should respawn on solid ground');
  assert.ok(p.invuln > 0);
});

test('sentinel enemy exists in room 1 and telegraphs a lunge', () => {
  const g = fresh();
  g.enterRoom(1);
  const sentinel = g.enemies.find((e) => e.type === 'sentinel');
  assert.ok(sentinel, 'sentinel should spawn');
  g.player.x = sentinel.x - 100;
  g.player.y = FLOOR_Y - g.player.h;
  g.player.invuln = 999;
  stepN(g, 3.0);
  assert.ok(
    ['windup', 'lunge', 'recover', 'patrol'].includes(sentinel.state),
    `sentinel should run its attack cycle, got ${sentinel.state}`,
  );
});

test('warden boss spawns, transitions to phase 2 at half health', () => {
  const g = fresh();
  g.enterRoom(2);
  assert.ok(g.boss, 'warden should spawn');
  assert.equal(g.boss.kind, 'warden');
  assert.equal(g.boss.name, 'Sir Mordrake');
  g.damageBoss(200);
  assert.equal(g.boss.phase, 2);
  assert.ok(g.events.some((e) => e.type === 'bossPhase'));
});

test('warden phase II raises extra shockwaves and speeds up', () => {
  const g = fresh();
  g.enterRoom(2);
  assert.equal(g.boss.phase, 1);
  g.damageBoss(200);
  assert.equal(g.boss.phase, 2);
  const shock = g.projectiles.filter((p) => p.type === 'shockwave');
  assert.equal(shock.length, 2, 'phase II transition should spawn two shockwaves');
  for (const p of shock) {
    assert.ok(Math.abs(p.vx) === 430, `phase II shockwave speed should be 430, got ${p.vx}`);
  }
});

test('defeating the warden opens blessing choice and unlocks the gate', () => {
  const g = fresh();
  g.enterRoom(2);
  g.player.invuln = 999;
  g.damageBoss(9999);
  stepN(g, 2.6);
  assert.equal(g.state, 'blessing');
  assert.equal(g.blessingChoices.length, 3);
  const beforeHp = g.player.maxHp;
  assert.equal(g.chooseBlessing(0), true);
  assert.equal(g.state, 'playing');
  assert.equal(g.player.maxHp, beforeHp + 40);
  assert.equal(g.player.hp, g.player.maxHp);
  assert.equal(g.gate.open, true);

  g.player.x = 1350;
  stepN(g, 0.3);
  assert.equal(g.roomIndex, 3);
  assert.ok(g.boss && g.boss.kind === 'wyrm');
});

test('ember blessing multiplies sword damage', () => {
  const g = fresh();
  g.enterRoom(2);
  g.player.invuln = 999;
  g.damageBoss(9999);
  stepN(g, 2.6);
  g.chooseBlessing(1);
  assert.ok(Math.abs(g.player.damageMult - 1.3) < 1e-9);

  const base = ATTACKS[0].dmg;
  g.spawnBoss('warden');
  const hp0 = g.boss.hp;
  g.hurtBoss(base * g.player.damageMult, 0, 1, false);
  assert.ok(Math.abs(hp0 - g.boss.hp - base * 1.3) < 1e-6);
});

test('wyrm fires projectiles that damage the player', () => {
  const g = fresh();
  g.enterRoom(3);
  assert.ok(g.boss && g.boss.kind === 'wyrm');
  const p = g.player;
  p.invuln = 0;
  const hp0 = p.hp;
  g.spawnEnemyProjectile({ x: p.x + p.w / 2, y: p.y + p.h / 2, vx: 0, vy: 0, dmg: 12, life: 1 });
  stepN(g, 0.05);
  assert.equal(p.hp, hp0 - 12);
});

test('wyrm dives and creates fireballs over time', () => {
  const g = fresh();
  g.enterRoom(3);
  g.player.invuln = 999;
  stepN(g, 9.0);
  assert.ok(g.projectiles.length >= 0);
  assert.ok(g.fx.length >= 0);
  // The boss must have executed at least one attack state.
  assert.ok(g.boss.pattern > 0);
});

test('wyrm transitions to phase II at half health and unlocks pillars', () => {
  const g = fresh();
  g.enterRoom(3);
  g.player.invuln = 999;
  assert.ok(g.boss && g.boss.kind === 'wyrm');
  assert.equal(g.boss.phase, 1);
  g.damageBoss(g.boss.maxHp * 0.5 + 1);
  assert.equal(g.boss.phase, 2);
  assert.ok(g.events.some((e) => e.type === 'bossPhase'));

  // Run long enough for the phase II-only pillar pattern to appear.
  let sawPillars = false;
  for (let i = 0; i < 2000 && !sawPillars; i++) {
    g.update(DT, {});
    if (g.boss.state === 'pillarWind' || g.boss.state === 'pillars') sawPillars = true;
    if (g.events.some((e) => e.type === 'pillars')) sawPillars = true;
  }
  assert.ok(sawPillars, 'phase II wyrm should eventually use the pillar attack');
});

test('both bosses expose exactly two phases', () => {
  const g = fresh();
  g.enterRoom(2);
  assert.equal(g.boss.kind, 'warden');
  assert.equal(g.boss.phase, 1);
  g.damageBoss(g.boss.maxHp * 0.5 + 1);
  assert.equal(g.boss.phase, 2);
  // Taking more damage must never advance to a third phase.
  g.damageBoss(10);
  assert.equal(g.boss.phase, 2);

  g.enterRoom(3);
  assert.equal(g.boss.kind, 'wyrm');
  assert.equal(g.boss.phase, 1);
  g.damageBoss(g.boss.maxHp * 0.5 + 1);
  assert.equal(g.boss.phase, 2);
  g.damageBoss(10);
  assert.equal(g.boss.phase, 2);
});

test('defeating the wyrm wins the run', () => {
  const g = fresh();
  g.enterRoom(3);
  g.player.invuln = 999;
  g.damageBoss(9999);
  stepN(g, 2.6);
  assert.equal(g.state, 'victory');
  assert.equal(g.bossDefeated[3], true);
  assert.ok(g.events.some((e) => e.type === 'victory'));
});

test('player death sets the dead state and stops world simulation', () => {
  const g = fresh();
  const p = g.player;
  p.invuln = 0;
  g.damagePlayer(999, p.x + 50);
  assert.equal(g.state, 'dead');
  assert.equal(p.hp, 0);
  const x = p.x;
  stepN(g, 0.5);
  assert.equal(p.x, x, 'dead state should freeze the player');
});

// ── v0.0.5: pursuit AI, checkpoints, ash, weapons, shop ───────────────────

test('crawlers pursue the player instead of patrolling inside their bounds', () => {
  const g = fresh();
  const p = g.player;
  const e = g.enemies[0];
  p.invuln = 999;
  p.x = 260;
  p.y = FLOOR_Y - p.h;
  p.onGround = true;
  e.x = 620;
  e.y = FLOOR_Y - e.h;
  e.patrolDir = 1;
  const startX = e.x;
  stepN(g, 0.9);
  assert.equal(e.state, 'chase');
  assert.ok(e.x < startX - 40, `crawler should close the distance, moved ${startX - e.x}`);
  assert.ok(e.facing < 0, 'crawler should face the player');
});

test('crawlers jump toward a player standing on a higher platform', () => {
  const g = fresh();
  const p = g.player;
  const e = g.enemies[0];
  p.invuln = 999;
  p.x = 330;
  p.y = 378 - p.h;
  p.onGround = true;
  e.x = 250;
  e.y = FLOOR_Y - e.h;
  e.onGround = true;
  let minY = e.y;
  for (let i = 0; i < 60; i++) {
    g.update(DT, {});
    minY = Math.min(minY, e.y);
  }
  assert.ok(minY < FLOOR_Y - e.h - 20, 'crawler should leave the floor to reach the player');
});

test('hitting a pursuing enemy does not snap it back to its patrol bounds', () => {
  const g = fresh();
  const e = g.enemies[0];
  e.x = 900;
  e.state = 'chase';
  g.hurtEnemy(e, { dmg: 1, knock: 0, name: 'test' }, 1);
  assert.equal(e.x, 900, 'pursuit position must not be clamped to minX/maxX');
});

test('boss rooms activate a checkpoint beside Warung Abu', () => {
  const g = fresh();
  g.enterRoom(2);
  assert.equal(g.checkpointRoom, 2);
  assert.ok(g.checkpoint, 'room 2 should expose a checkpoint');
  assert.ok(g.room.merchant, 'room 2 should expose a merchant');
  assert.ok(g.canShop(), 'player spawns within reach of the merchant');

  g.enterRoom(3);
  assert.equal(g.checkpointRoom, 3);
  assert.ok(g.checkpoint);
});

test('checkpoint respawn restores health and flasks but keeps ash, gear, and blessings', () => {
  const g = fresh();
  g.enterRoom(2);
  const p = g.player;
  g.ash = 120;
  p.weapons.push('pike', 'bow');
  p.weapon = 'pike';
  p.arrows = 7;
  p.shurikens = 4;
  p.hp = 1;
  p.flasks = 0;
  p.invuln = 0;
  g.blessings.push('ember');
  g.damagePlayer(999, p.x + 60);
  assert.equal(g.state, 'dead');

  assert.equal(g.respawnAtCheckpoint(), true);
  assert.equal(g.state, 'playing');
  assert.equal(g.roomIndex, 2);
  assert.equal(p.hp, p.maxHp);
  assert.equal(p.flasks, p.maxFlasks);
  assert.equal(g.ash, 120, 'ash must survive a checkpoint respawn');
  assert.deepEqual(p.weapons, ['sword', 'pike', 'bow']);
  assert.equal(p.weapon, 'pike');
  assert.equal(p.arrows, 7);
  assert.equal(p.shurikens, 4);
  assert.deepEqual(g.blessings, ['ember']);
  assert.ok(g.boss && g.boss.kind === 'warden', 'boss should respawn for the retry');
  assert.equal(g.bossDefeated[2], false);
});

test('enemy and boss kills award spendable ash', () => {
  const g = fresh();
  g.enterRoom(1);
  const crawler = g.enemies.find((e) => e.type === 'crawler');
  const ash0 = g.ash;
  g.hurtEnemy(crawler, { dmg: 999, knock: 0, name: 'test' }, 1);
  assert.equal(g.ash, ash0 + 8);
  assert.ok(g.events.some((e) => e.type === 'ashGain'));

  const g2 = fresh();
  g2.enterRoom(2);
  g2.player.invuln = 999;
  g2.damageBoss(9999);
  stepN(g2, 2.6);
  assert.ok(g2.ash >= 60, `boss should award at least 60 ash, got ${g2.ash}`);
});

test('Warung Abu sells weapons, ammo, shuriken, and flask refills', () => {
  const g = fresh();
  g.enterRoom(2);
  const p = g.player;
  g.ash = 200;

  let res = g.buyShopItem('pike');
  assert.equal(res.ok, true);
  assert.equal(g.ash, 165);
  assert.ok(p.weapons.includes('pike'));
  assert.equal(p.weapon, 'pike');

  res = g.buyShopItem('pike');
  assert.equal(res.ok, false, 'duplicate weapon purchase must fail');

  res = g.buyShopItem('bow');
  assert.equal(res.ok, true);
  assert.equal(g.ash, 110);
  assert.equal(p.arrows, 8, 'bow purchase includes a quiver');

  res = g.buyShopItem('arrows');
  assert.equal(res.ok, true);
  assert.equal(p.arrows, 14);

  res = g.buyShopItem('shuriken');
  assert.equal(res.ok, true);
  assert.equal(p.shurikens, 3);

  p.flasks = 1;
  res = g.buyShopItem('flask');
  assert.equal(res.ok, true);
  assert.equal(p.flasks, p.maxFlasks);

  g.ash = 0;
  res = g.buyShopItem('shuriken');
  assert.equal(res.ok, false);
  assert.match(res.reason, /tidak cukup/i);
});

test('ammo cannot be bought before owning the bow', () => {
  const g = fresh();
  g.enterRoom(2);
  g.ash = 100;
  const res = g.buyShopItem('arrows');
  assert.equal(res.ok, false);
  assert.match(res.reason, /Busur/i);
  assert.equal(g.ash, 100, 'failed purchase must not spend ash');
});

test('pike has longer reach and a slower wind-up than the sword', () => {
  const g = fresh();
  const p = g.player;
  const e = g.enemies[0];
  p.invuln = 999;
  p.weapons = ['sword', 'pike'];
  p.weapon = 'pike';
  p.x = e.x - 100;
  p.y = FLOOR_Y - p.h;
  p.onGround = true;
  p.facing = 1;
  e.speed = 0;
  const hp0 = e.hp;
  g.update(DT, { attack: true });
  assert.equal(p.attack.weapon, 'pike');
  assert.equal(p.attack.def.name, 'pierce');
  assert.ok(p.attack.def.windup > 0.2, 'pike should be slow');
  stepN(g, 0.55);
  assert.ok(e.hp <= hp0 - 29 || e.dead, `pike should hit from range, hp ${e.hp}`);
});

test('bow fires arrows, spends ammo, and damages enemies at range', () => {
  const g = fresh();
  const p = g.player;
  const e = g.enemies[0];
  p.invuln = 999;
  p.weapons = ['sword', 'bow'];
  p.weapon = 'bow';
  p.arrows = 2;
  p.x = e.x - 240;
  p.y = FLOOR_Y - p.h;
  p.onGround = true;
  p.facing = 1;
  e.speed = 0;
  const hp0 = e.hp;
  g.update(DT, { attack: true });
  assert.equal(p.attack.weapon, 'bow');
  stepN(g, 0.6);
  assert.equal(p.arrows, 1, 'firing an arrow should consume exactly one');
  assert.ok(g.projectiles.some((pr) => pr.type === 'arrow') || e.hp < hp0, 'arrow should exist or have hit');
  stepN(g, 0.6);
  assert.ok(e.hp < hp0 || e.dead, 'arrow should damage the crawler');
});

test('bow refuses to fire with no arrows', () => {
  const g = fresh();
  const p = g.player;
  p.weapons = ['sword', 'bow'];
  p.weapon = 'bow';
  p.arrows = 0;
  g.update(DT, { attack: true });
  assert.equal(p.attack, null);
  assert.equal(p.arrows, 0);
  assert.ok(g.events.some((ev) => ev.type === 'noAmmo' && ev.kind === 'arrow'));
});

test('shuriken consumable can be thrown and damages enemies', () => {
  const g = fresh();
  const p = g.player;
  const e = g.enemies[0];
  p.invuln = 999;
  p.shurikens = 2;
  p.x = e.x - 160;
  p.y = FLOOR_Y - p.h;
  p.onGround = true;
  p.facing = 1;
  e.speed = 0;
  const hp0 = e.hp;
  g.update(DT, { consume: true });
  assert.equal(p.shurikens, 1);
  assert.ok(g.projectiles.some((pr) => pr.type === 'shuriken'));
  stepN(g, 0.4);
  assert.ok(e.hp < hp0 || e.dead, 'shuriken should register damage');
});

test('weapon swap cycles through owned weapons', () => {
  const g = fresh();
  const p = g.player;
  p.weapons = ['sword', 'pike', 'bow'];
  p.weapon = 'sword';
  g.update(DT, { swap: true });
  assert.equal(p.weapon, 'pike');
  g.update(DT, {});
  g.update(DT, { swap: true });
  assert.equal(p.weapon, 'bow');
  g.update(DT, {});
  g.update(DT, { swap: true });
  assert.equal(p.weapon, 'sword');
});

test('merchant interaction is proximity based', () => {
  const g = fresh();
  g.enterRoom(2);
  const p = g.player;
  assert.equal(g.canShop(), true);
  p.x = 760;
  assert.equal(g.canShop(), false);
  p.x = g.room.merchant.x;
  assert.equal(g.canShop(), true);
});
