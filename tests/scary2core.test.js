import { test } from 'node:test';
import assert from 'node:assert/strict';

import { AshenGame } from '../src/core.js';
import { HorrorEventDirector, SCARY_ENEMIES, resolveHorrorPresentation } from '../src/scary2.js';

function fresh() {
  const game = new AshenGame();
  game.enterRoom(0);
  game.player.hp = 900;
  game.player.maxHp = 900;
  return game;
}

test('scary difficulty scales live enemies and never touches campaign difficulty', () => {
  const game = fresh();
  game.difficulty = 'normal';
  game.setScaryMode({ enabled: true, difficulty: 'hard' });
  const enemy = game.enemies.find((entry) => !entry.dead);
  assert.ok(enemy, 'room has an enemy');
  assert.ok(enemy.aggroMul > 1, `hard detection raised (${enemy.aggroMul})`);
  assert.equal(game.difficulty, 'normal', 'campaign difficulty untouched');
  const hardAggro = enemy.aggroMul;
  const hardSpeed = enemy.speed;

  game.setScaryMode({ enabled: true, difficulty: 'easy' });
  assert.ok(enemy.aggroMul < hardAggro, 'easy lowers detection');
  assert.ok(enemy.speed < hardSpeed, 'easy lowers speed');
  assert.equal(game.difficulty, 'normal', 'still untouched');

  game.setScaryMode({ enabled: false, difficulty: 'easy' });
  assert.equal(game.scaryEnabled, false);
});

test('the eight horror enemies spawn with real stats and valid world positions', () => {
  const game = fresh();
  game.setScaryMode({ enabled: true, difficulty: 'normal' });
  const created = [];
  for (const kind of Object.keys(SCARY_ENEMIES)) {
    const enemy = game.spawnScaryEnemy(kind, 320 + created.length * 120);
    assert.ok(enemy, `${kind} spawned`);
    assert.equal(enemy.scaryKind, kind);
    assert.equal(enemy.scaryTactic, SCARY_ENEMIES[kind].tactic);
    assert.ok(enemy.hp > 0 && enemy.dmg > 0 && enemy.speed > 0);
    created.push(enemy);
  }
  assert.equal(created.length, 8);
  assert.equal(new Set(created.map((e) => e.scaryTactic)).size, 8);
  for (const enemy of created) {
    assert.ok(enemy.x >= 0 && enemy.x <= 1900, `${enemy.scaryKind} inside the world`);
    assert.ok(enemy.y >= 0, `${enemy.scaryKind} not above the ceiling`);
  }
  const events = game.events.filter((event) => event.type === 'scarySpawn');
  assert.equal(events.length, 8, 'spawning emits telemetry');
});

test('scary enemies navigate and never fall out of the world', () => {
  const game = fresh();
  game.setScaryMode({ enabled: true, difficulty: 'hard' });
  for (const kind of Object.keys(SCARY_ENEMIES)) {
    game.spawnScaryEnemy(kind, 420);
  }
  game.player.x = 900;
  for (let i = 0; i < 600; i += 1) game.update(1 / 120, {});
  const scary = game.enemies.filter((enemy) => enemy.scaryKind);
  assert.equal(scary.length, 8);
  for (const enemy of scary) {
    assert.ok(Number.isFinite(enemy.x) && Number.isFinite(enemy.y), `${enemy.scaryKind} stays finite`);
    assert.ok(enemy.y < 900, `${enemy.scaryKind} did not fall through the floor (${Math.round(enemy.y)})`);
    assert.ok(enemy.brain, `${enemy.scaryKind} has a brain`);
    assert.ok(enemy.aiState, `${enemy.scaryKind} reports a state`);
  }
});

test('the hollow wraith fades when approached and reappears far away at a nav point', () => {
  const game = fresh();
  game.setScaryMode({ enabled: true, difficulty: 'normal' });
  const wraith = game.spawnScaryEnemy('hollow_wraith', 500);
  game.enemies = game.enemies.filter((entry) => entry.scaryKind);
  game.projectiles.length = 0;
  game.player.x = wraith.x + wraith.w / 2 - game.player.w / 2;
  let faded = false;
  for (let i = 0; i < 400; i += 1) {
    game.update(1 / 120, {});
    game.player.hp = 900;
    if (wraith.hidden) { faded = true; break; }
  }
  assert.ok(faded, 'wraith fades when the player stands inside its fade range');

  var hiddenStart = wraith.x; // eslint-disable-line no-var
  const before = { x: game.player.x + game.player.w / 2 };
  game.reappearScary(wraith);
  assert.equal(wraith.hidden, false);
  assert.ok(Math.abs(wraith.x - before.x) > 180, `reappeared away from the player (${Math.round(hiddenStart)} → ${Math.round(wraith.x)})`);
  assert.ok(wraith.x >= 0 && wraith.x <= 1900);
  assert.ok(game.events.some((event) => event.type === 'scaryReappear'));
  // The reappearance must land on the navigation graph, not inside geometry.
  const node = game.nav.nearest(wraith.x, wraith.y + wraith.h);
  assert.ok(node, 'a nav node exists near the reappearance point');
});

test('the silent knight telegraphs and then lands a lunge', () => {
  const game = fresh();
  game.setScaryMode({ enabled: true, difficulty: 'normal' });
  const knight = game.spawnScaryEnemy('silent_knight', 320);
  game.enemies = game.enemies.filter((entry) => entry.scaryKind);
  game.projectiles.length = 0;
  knight.cooldown = 0;
  game.player.x = knight.x + 46;
  game.player.y = knight.y;
  let sawWind = false;
  for (let i = 0; i < 480; i += 1) {
    game.update(1 / 120, {});
    if (knight.state === 'wind') sawWind = true;
    if (knight.state === 'lunge') {
      for (let j = 0; j < 40; j += 1) game.update(1 / 120, {});
      break;
    }
  }
  assert.ok(sawWind, 'the knight telegraphs before striking');
  assert.ok(game.player.hp < 900, 'the lunge lands damage');
  assert.ok(
    game.events.some((event) => event.type === 'playerHurt' && event.source.type === 'silent_knight'),
    'damage is attributed to the horror enemy',
  );
});

test('the forgotten one enters phase two and fires a real volley', () => {
  const game = fresh();
  game.setScaryMode({ enabled: true, difficulty: 'hard' });
  const boss = game.spawnScaryEnemy('forgotten_one', 500);
  boss.hp = Math.floor(boss.maxHp * 0.4);
  boss.volleyCooldown = 0;
  game.player.x = boss.x - 150;
  const before = game.projectiles.length;
  for (let i = 0; i < 160; i += 1) {
    game.update(1 / 120, {});
    game.player.hp = 900;
  }
  assert.equal(boss.phase, 2, 'phase transition happened');
  assert.ok(game.projectiles.length > before, 'the volley created projectiles');
  assert.ok(game.events.some((event) => event.type === 'bossPhase'));
});

test('the mirror double repositions and the lantern eater freezes under observation', () => {
  const game = fresh();
  game.setScaryMode({ enabled: true, difficulty: 'hard' });
  const mirror = game.spawnScaryEnemy('mirror_double', 360);
  game.enemies = game.enemies.filter((entry) => entry.scaryKind === 'mirror_double');
  game.projectiles.length = 0;
  game.player.x = 900;
  game.player.y = mirror.y;
  game.player.facing = 1;
  mirror.mirrorCooldown = 0;
  let mirrored = false;
  for (let i = 0; i < 240; i += 1) {
    game.update(1 / 120, {});
    game.player.hp = 900;
    if (game.events.some((event) => event.type === 'scaryMirror')) { mirrored = true; break; }
  }
  assert.ok(mirrored, 'the mirror double found a valid position behind the player');

  game.enemies = [];
  const eater = game.spawnScaryEnemy('lantern_eater', 580);
  game.player.x = 500;
  game.player.y = eater.y;
  game.player.facing = 1;
  eater.lungeCooldown = 9;
  for (let i = 0; i < 60; i += 1) {
    game.update(1 / 120, {});
    game.player.hp = 900;
  }
  assert.ok(eater.ghostAlpha < 0.35, `lantern eater fades while watched (${eater.ghostAlpha})`);
  const frozenX = eater.x;
  for (let i = 0; i < 30; i += 1) game.update(1 / 120, {});
  assert.ok(Math.abs(eater.x - frozenX) < 6, 'it does not advance while the player faces it');
  game.player.facing = -1;
  for (let i = 0; i < 30; i += 1) game.update(1 / 120, {});
  assert.ok(eater.ghostAlpha > 0.5, 'it becomes solid when the player looks away');
  assert.ok(Math.abs(eater.x - frozenX) > 4, 'it moves only when unobserved');
});

test('the drowned bell tolls and the weeping mother launches a real wail', () => {
  const game = fresh();
  game.setScaryMode({ enabled: true, difficulty: 'normal' });
  const bell = game.spawnScaryEnemy('drowned_bell', 420);
  game.enemies = game.enemies.filter((entry) => entry.scaryKind === 'drowned_bell');
  game.projectiles.length = 0;
  game.player.x = 500;
  game.player.y = bell.y;
  bell.tollCooldown = 0;
  for (let i = 0; i < 180; i += 1) {
    game.update(1 / 120, {});
    game.player.hp = 900;
    if (game.events.some((event) => event.type === 'scaryToll')) break;
  }
  assert.ok(game.events.some((event) => event.type === 'scaryToll'), 'the bell emitted a toll');

  game.enemies = game.enemies.filter((entry) => entry.scaryKind === 'drowned_bell');
  const mother = game.spawnScaryEnemy('weeping_mother', 520);
  game.projectiles.length = 0;
  game.player.x = 400;
  game.player.y = mother.y;
  mother.wailCooldown = 0;
  for (let i = 0; i < 180; i += 1) {
    game.update(1 / 120, {});
    game.player.hp = 900;
    if (game.events.some((event) => event.type === 'scaryWail')) break;
  }
  assert.ok(game.events.some((event) => event.type === 'scaryWail'), 'the mother emitted a wail');
  assert.ok(game.projectiles.some((shot) => shot.source && shot.source.type === 'weeping_mother'), 'tears are real projectiles');
});

test('the night stalker moves to flank instead of charging head-on', () => {
  const game = fresh();
  game.setScaryMode({ enabled: true, difficulty: 'normal' });
  const stalker = game.spawnScaryEnemy('night_stalker', 300);
  game.player.x = 620;
  const startX = stalker.x;
  for (let i = 0; i < 240; i += 1) {
    game.update(1 / 120, {});
    game.player.hp = 900;
  }
  assert.ok(stalker.x > startX + 10, `stalker repositioned (${Math.round(startX)} → ${Math.round(stalker.x)})`);
  assert.ok(stalker.x < game.player.x, 'it did not overshoot the player');
});

test('anti-jumpscare takes effect on a live director without a restart', () => {
  const settings = { enabled: true, difficulty: 'hard', jumpscares: true, antiJumpscare: false };
  const director = new HorrorEventDirector(settings, { seed: 3 });
  let presentation = director.configure(settings);
  assert.equal(presentation.jumpscares.possible, true);
  assert.ok(presentation.visual.flash > 0);

  presentation = director.configure({ ...settings, antiJumpscare: true });
  assert.equal(presentation.jumpscares.possible, false, 'turning it on suppresses startling presentation');
  assert.equal(presentation.visual.flash, 0);
  assert.ok(presentation.visual.fog > 0, 'atmosphere survives');
  assert.equal(presentation.difficulty, 'hard', 'difficulty is independent');

  presentation = director.configure({ ...settings, antiJumpscare: false });
  assert.equal(presentation.jumpscares.possible, true, 'turning it off restores the configured scares');
});

test('scary difficulty is applied independently from campaign difficulty on the live engine', () => {
  const game = fresh();
  game.setDifficulty('nightmare');
  const campaign = game.difficulty;
  game.setScaryMode({ enabled: true, difficulty: 'easy' });
  assert.equal(game.difficulty, campaign, 'campaign difficulty kept');
  assert.equal(game.scaryDifficulty, 'easy');
  const detection = resolveHorrorPresentation({ enabled: true, difficulty: 'easy' }).gameplay.detection;
  assert.equal(detection, 0.78);
  game.setDifficulty('normal');
  assert.equal(game.scaryDifficulty, 'easy', 'campaign change does not touch horror difficulty');
});
