import { test } from 'node:test';
import assert from 'node:assert/strict';

import { AshenGame } from '../src/core.js';
import { UNNATURAL, UNNATURAL_IDS, DREAD_BOSSES } from '../src/dread.js';

function dread(id = 'forgotten_village') {
  const game = new AshenGame();
  game.loadDreadEnvironment(id);
  game.player.hp = 900;
  game.player.maxHp = 900;
  game.player.invuln = 0;
  game.enemies.length = 0;
  game.projectiles.length = 0;
  return game;
}

test('a horror environment loads a real arena, navigation graph and environment metadata', () => {
  const game = dread('black_manor');
  assert.equal(game.dreadEnvironmentId, 'black_manor');
  assert.ok(game.dreadEnv && game.dreadEnv.mechanics.length >= 3);
  assert.ok(game.room.platforms.length >= 4);
  assert.ok(game.room.ceilingSpans.length >= 1);
  assert.ok(game.nav && game.nav.nodes.length > 0, 'the nav graph is built from the real platforms');
  assert.ok(game.events.some((event) => event.type === 'dreadEnvironment' && event.environment === 'black_manor'));
  for (let i = 0; i < 120; i += 1) game.update(1 / 120, {});
  assert.ok(game.player.y < 900 && Number.isFinite(game.player.x), 'the player lands inside the arena');
});

test('all seven Unnatural enemies spawn with perception data and valid positions', () => {
  const game = dread();
  const spawned = UNNATURAL_IDS.map((kind, index) => {
    const enemy = game.spawnUnnatural(kind, 260 + index * 180);
    assert.ok(enemy, `${kind} spawned`);
    assert.equal(enemy.unnaturalKind, kind);
    assert.equal(enemy.unnaturalName, UNNATURAL[kind].name);
    assert.equal(enemy.sightRange, UNNATURAL[kind].sightRange);
    assert.ok(enemy.hp > 0 && enemy.dmg > 0 && enemy.speed > 0);
    assert.ok(enemy.x >= 0 && enemy.x <= 1900);
    return enemy;
  });
  assert.equal(spawned.length, 7);
  assert.equal(new Set(spawned.map((enemy) => enemy.unnaturalTactic)).size, 5);
  const ceiling = spawned.find((enemy) => enemy.unnaturalKind === 'ceiling_dweller');
  assert.equal(ceiling.surface, 'ceiling');
  assert.ok(ceiling.y <= 200, 'the dweller starts on the ceiling');
});

test('sight and hearing drive the live hunting and investigating states', () => {
  const game = dread();
  const visitor = game.spawnUnnatural('faceless_visitor', 500);
  visitor.facing = 1;
  game.player.x = 640;
  game.player.y = 390;
  game.update(1 / 120, {});
  assert.equal(visitor.aiState, 'hunt', `sight starts a hunt (${visitor.aiState})`);

  const knight = game.spawnUnnatural('empty_knight', 1000);
  knight.facing = 1;
  game.player.x = 300;
  game.emitNoise('step', 940, { loudness: 1, radius: 1 });
  game.update(1 / 120, {});
  assert.equal(knight.aiState, 'investigate', `hearing starts an investigation (${knight.aiState})`);
  assert.ok(knight.dreadBrain.memory.size >= 1, 'the heard position is remembered');
});

test('the Ceiling Dweller stays on its ceiling span and only descends through its drop move', () => {
  const game = dread('silent_underground');
  const dweller = game.spawnUnnatural('ceiling_dweller', 600);
  // Out of both sight and hearing range, so this phase is pure patrol.
  game.player.x = 1380;
  const span = dweller.ceilingSpan;
  let ceilingY = [];
  for (let i = 0; i < 360; i += 1) {
    game.update(1 / 120, {});
    ceilingY.push(dweller.y);
  }
  assert.ok(ceilingY.every((y) => y === dweller.ceilingY), 'it never leaves the ceiling while patrolling');
  assert.ok(dweller.x >= span.x1 && dweller.x + dweller.w <= span.x2, 'it stays inside the designated span');

  game.player.x = dweller.x;
  game.player.y = 300;
  game.player.hp = 900;
  let descended = false;
  for (let i = 0; i < 480; i += 1) {
    game.update(1 / 120, {});
    game.player.hp = 900;
    if (dweller.y > dweller.ceilingY + 40) descended = true;
  }
  assert.ok(descended, 'it eventually drops toward the player');
  assert.ok(dweller.x >= span.x1 && dweller.x + dweller.w <= span.x2, 'it never leaves the span horizontally');
});

test('the Empty Knight telegraphs, lunges, and its damage is attributed to it', () => {
  const game = dread();
  const knight = game.spawnUnnatural('empty_knight', 400);
  knight.facing = 1;
  knight.lungeCooldown = 0;
  game.player.x = 460;
  game.player.y = knight.y;
  game.player.hp = 900;
  let sawWind = false;
  for (let i = 0; i < 720; i += 1) {
    game.update(1 / 120, {});
    game.player.hp = Math.max(1, game.player.hp);
    if (knight.unnaturalState === 'wind') sawWind = true;
    if (game.player.hp < 900) break;
  }
  assert.ok(sawWind, 'the guard telegraphs before attacking');
  assert.ok(game.player.hp < 900, 'the lunge lands');
  assert.ok(
    game.events.some((event) => event.type === 'playerHurt' && event.source?.type === 'empty_knight'),
    'damage source is the Unnatural enemy, not a generic type',
  );
});

test('the Pale Echo emits real decoy signals near remembered locations', () => {
  const game = dread();
  const echo = game.spawnUnnatural('pale_echo', 300);
  echo.facing = 1;
  game.player.x = 1000;
  for (let i = 0; i < 480; i += 1) game.update(1 / 120, {});
  const decoy = game.events.find((event) => event.type === 'dreadDecoy');
  assert.ok(decoy, 'a decoy event was emitted');
  assert.equal(decoy.enemy, 'pale_echo');
  assert.ok(Number.isFinite(decoy.x));
});

test('the Faceless Visitor vanishes in place and returns at a valid navigation point away from the player', () => {
  const game = dread();
  const visitor = game.spawnUnnatural('faceless_visitor', 520);
  visitor.facing = -1;
  game.player.x = 400;
  game.player.y = 400;
  game.player.facing = 1;
  game.player.hp = 900;
  let vanished = false;
  for (let i = 0; i < 600; i += 1) {
    game.update(1 / 120, {});
    game.player.hp = 900;
    if (visitor.hidden) { vanished = true; break; }
  }
  assert.ok(vanished, 'it fades out when approached');
  assert.ok(game.events.some((event) => event.type === 'unnaturalVanish'));
  const beforeX = game.player.x;
  for (let i = 0; i < 600; i += 1) {
    game.update(1 / 120, {});
    game.player.hp = 900;
    game.player.x = beforeX;
    if (!visitor.hidden) break;
  }
  assert.equal(visitor.hidden, false, 'it returns');
  assert.ok(Math.abs(visitor.x - beforeX) > 180, `it returned away from the player (${Math.round(visitor.x)})`);
  assert.ok(game.events.some((event) => event.type === 'unnaturalReappear'));
  assert.ok(game.nav.nearest(visitor.x, visitor.y + visitor.h), 'the return point sits on the nav graph');
});

test('the Forgotten Twin mirrors the player inside its arena', () => {
  const game = dread('silent_underground');
  game.dreadArena = { minX: 200, maxX: 1200 };
  const twin = game.spawnUnnatural('forgotten_twin', 900);
  game.player.x = 300;
  game.player.y = 400;
  for (let i = 0; i < 240; i += 1) {
    game.update(1 / 120, {});
    game.player.hp = 900;
  }
  assert.ok(twin.x > game.player.x, `mirrored to the opposite side (${Math.round(twin.x)} vs ${Math.round(game.player.x)})`);
  const rightSide = twin.x;
  game.player.x = 1000;
  for (let i = 0; i < 300; i += 1) {
    game.update(1 / 120, {});
    game.player.hp = 900;
  }
  assert.ok(twin.x < rightSide, 'it follows the mirror, not the player');
  assert.ok(twin.x >= 200 && twin.x + twin.w <= 1220, 'it stays inside its arena');
});

test('dread bosses spawn with all phases, stay in their arena and end with a real boss-down event', () => {
  const game = dread('black_manor');
  const boss = game.spawnDreadBoss('watcher_beyond');
  assert.ok(boss);
  assert.equal(boss.phase, 1);
  assert.equal(boss.maxPhases, 4);
  assert.deepEqual(boss.arena, DREAD_BOSSES.watcher_beyond.arena);
  assert.ok(game.events.some((event) => event.type === 'dreadBossSpawn'));

  boss.hp = boss.maxHp * 0.7;
  boss.invuln = 0;
  game.damageBoss(1);
  assert.equal(boss.phase, 2, 'first threshold crossed');
  boss.hp = boss.maxHp * 0.45;
  boss.invuln = 0;
  game.damageBoss(1);
  assert.equal(boss.phase, 3, 'second threshold crossed');

  boss.intro = 0;
  boss.stagger = 0;
  boss.x = -500;
  game.hitstop = 0;
  game.update(1 / 120, {});
  assert.ok(boss.x >= DREAD_BOSSES.watcher_beyond.arena.minX, 'arena containment');

  boss.dreadManager.openHitbox('test', 0.05, { rect: { x: 0, y: 0, w: 10, h: 10 } });
  game.updateDreadBoss(0.2, boss);
  assert.equal(boss.dreadManager.snapshot().activeHitboxes.length, 0, 'hitboxes expire with the attack');

  boss.invuln = 0;
  game.damageBoss(boss.hp + 1);
  assert.equal(boss.dying, true);
  for (let i = 0; i < 240; i += 1) {
    game.update(1 / 120, {});
    game.player.hp = 900;
  }
  assert.equal(game.boss, null, 'the fight ends');
  assert.ok(game.events.some((event) => event.type === 'dreadBossDown' && event.kind === 'watcher_beyond'));
  assert.equal(game.state, 'playing', 'no campaign blessing is opened');
});

test('the Hollow King summons real Unnatural guardians and moves to its hidden arena', () => {
  const game = dread('black_manor');
  const boss = game.spawnDreadBoss('hollow_king');
  boss.intro = 0;
  boss.patternTimer = 0;
  boss.invuln = 0;
  game.player.x = 500;
  for (let i = 0; i < 200; i += 1) {
    game.update(1 / 120, {});
    game.player.hp = 900;
  }
  assert.ok(game.enemies.some((enemy) => enemy.unnaturalKind), 'spectral guardians were summoned');
  const guardian = game.enemies.find((enemy) => enemy.unnaturalKind);
  assert.ok(guardian.hp > 0 && Number.isFinite(guardian.x));

  game.damageBoss(boss.maxHp * 0.86);
  boss.intro = 0;
  boss.stagger = 0;
  game.hitstop = 0;
  for (let i = 0; i < 8; i += 1) {
    game.hitstop = 0;
    game.update(1 / 120, {});
  }
  assert.equal(boss.dreadManager.boss.hiddenPhaseEntered, true);
  assert.deepEqual(boss.arena, DREAD_BOSSES.hollow_king.hiddenPhase.arena);
});

test('noises expire and never accumulate forever', () => {
  const game = dread();
  for (let i = 0; i < 40; i += 1) game.emitNoise('step', 300 + i, { ttl: 0.2 });
  assert.ok(game.noises.length <= 24, 'hard cap on live noises');
  for (let i = 0; i < 60; i += 1) game.update(1 / 120, {});
  assert.equal(game.noises.length, 0, 'expired noises are removed');
});

test('a full Dread room simulates cleanly with all seven enemies for 600 frames', () => {
  const game = dread('endless_forest');
  game.player.hp = 9999;
  game.player.maxHp = 9999;
  for (const [index, kind] of UNNATURAL_IDS.entries()) game.spawnUnnatural(kind, 240 + index * 200);
  game.player.x = 700;
  for (let i = 0; i < 600; i += 1) {
    game.update(1 / 120, {});
    game.player.hp = 9999;
  }
  const enemies = game.enemies.filter((enemy) => !enemy.dead);
  assert.equal(enemies.length, 7);
  for (const enemy of enemies) {
    assert.ok(Number.isFinite(enemy.x) && Number.isFinite(enemy.y), `${enemy.unnaturalKind} finite`);
    assert.ok(enemy.y < 1200, `${enemy.unnaturalKind} did not fall through the world`);
    assert.ok(enemy.x > -200 && enemy.x < 1800, `${enemy.unnaturalKind} stayed inside the world`);
    assert.ok(enemy.aiState, `${enemy.unnaturalKind} reports an AI state`);
  }
});
