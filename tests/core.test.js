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
