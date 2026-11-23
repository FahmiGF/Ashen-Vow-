import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PIRATE_STAGES,
  PIRATE_STAGE_BY_ID,
  PIRATE_ISLANDS,
  PIRATE_PORTS,
  PIRATE_SHIP_TYPES,
  PIRATE_BOSS_TYPES,
  PIRATE_WORLD_W,
  PIRATE_WORLD_H,
  PIRATE_MAX_BALLS,
  PIRATE_DOCK_COST,
  createPirateVoyage,
  updatePirateVoyage,
  setPirateControls,
  pirateFire,
  pirateFireAt,
  pirateDamageShip,
  pirateDock,
  pirateNearPort,
  pirateSnapshot,
  pirateStageUnlocked,
  pirateSummary,
  defaultPirateProgress,
  sanitizePirateProgress,
  recordPirateVoyage,
  renderPirateVoyage,
  pirateScreenToWorld,
  pirateVisibleIslands,
  pirateEnemyPool,
  createPirateEndless,
  pirateEndlessSurge,
  recordPirateEndless,
  PIRATE_ENDLESS_CAPTAIN_EVERY,
  PIRATE_ENDLESS_STAGE,
} from '../src/pirates.js';

test('pirate tide ships one open world, ten stages, ten islands and ten captains', () => {
  assert.equal(PIRATE_STAGES.length, 10);
  assert.equal(PIRATE_ISLANDS.length, 10);
  assert.equal(PIRATE_PORTS.length, 7);
  assert.equal(PIRATE_BOSS_TYPES.length, 10);
  assert.ok(PIRATE_SHIP_TYPES.length >= 8);
  assert.ok(PIRATE_WORLD_W >= 3000 && PIRATE_WORLD_H >= 2000);
  for (const stage of PIRATE_STAGES) {
    assert.ok(PIRATE_STAGE_BY_ID[stage.id]);
    assert.ok(PIRATE_BOSS_TYPES.some((boss) => boss.id === stage.bossId));
    assert.ok(stage.targetKills >= 4);
    assert.ok(!isInsideIsland(stage.start.x, stage.start.y, 30), `${stage.id} must not start inside an island`);
    assert.deepEqual([stage.index], [PIRATE_STAGES.indexOf(stage)], `${stage.id} keeps its route order`);
  }
  assert.equal(new Set(PIRATE_STAGES.map((stage) => stage.id)).size, PIRATE_STAGES.length);
  assert.equal(new Set(PIRATE_BOSS_TYPES.map((boss) => boss.id)).size, PIRATE_BOSS_TYPES.length);
});

test('act two routes stay locked behind the first five clears', () => {
  const actOne = defaultPirateProgress();
  for (const stage of PIRATE_STAGES.slice(0, 5)) actOne.stages[stage.id] = { runs: 1, cleared: true, bestScore: 100, bestTime: 60 };
  assert.equal(pirateStageUnlocked(actOne, 'mist_hunt'), true, 'stage six opens after stage five');
  assert.equal(pirateStageUnlocked(actOne, 'hollow_tide'), false, 'stage seven still needs stage six');
  assert.equal(pirateStageUnlocked(actOne, 'first_vow'), false, 'the finale needs all nine previous routes');
  const forged = sanitizePirateProgress({
    stages: {
      first_tide: { cleared: true, runs: 1 },
      first_vow: { cleared: true, runs: 1 },
      salt_throne: { cleared: true, runs: 1 },
    },
  });
  assert.equal(forged.stages.first_vow?.cleared || false, false, 'the finale cannot skip stages two through nine');
  assert.equal(forged.stages.salt_throne?.cleared || false, false, 'stage eight cannot skip stages two through seven');
  for (let i = 1; i < PIRATE_STAGES.length; i += 1) {
    const chain = sanitizePirateProgress({ stages: Object.fromEntries(PIRATE_STAGES.slice(0, i + 1).map((stage) => [stage.id, { cleared: true, runs: 1 }])) });
    assert.equal(chain.stages[PIRATE_STAGES[i].id].cleared, true, `a full chain clears ${PIRATE_STAGES[i].id}`);
  }
});

test('new hull classes only enter the pool on their own act two routes', () => {
  const early = pirateEnemyPool('first_tide').map((type) => type.id);
  assert.ok(!early.includes('storm_cutter'), 'the storm cutter arrives in act two');
  assert.ok(!early.includes('iron_leviathan'), 'the iron leviathan arrives in act two');
  assert.ok(early.includes('ash_raider'));
  const mist = pirateEnemyPool('mist_hunt').map((type) => type.id);
  assert.ok(mist.includes('storm_cutter'), 'stage six fields the storm cutter');
  assert.ok(!mist.includes('iron_leviathan'), 'the leviathan waits for stage seven');
  const finale = pirateEnemyPool(9).map((type) => type.id);
  assert.ok(finale.includes('storm_cutter') && finale.includes('iron_leviathan'));
  assert.ok(finale.includes('ghost_galleon') && finale.includes('hunter_frigate'));
});

test('the renderer only draws islands inside the camera view', () => {
  const m = createPirateVoyage({ stageId: 'first_tide', seed: 5 });
  const visible = pirateVisibleIslands(m, 960, 540, 0.9);
  assert.ok(visible.length > 0);
  assert.ok(visible.length < PIRATE_ISLANDS.length, 'a zoomed view culls distant islands');
  assert.ok(visible.some((island) => island.id === 'ash_harbor'), 'the nearby port stays visible');
  assert.ok(!visible.some((island) => island.id === 'starfall_cay'), 'the far act two cay is culled');
  m.player.x = 2920;
  m.player.y = 1120;
  assert.ok(pirateVisibleIslands(m, 960, 540, 0.9).some((island) => island.id === 'starfall_cay'), 'the cull follows the ship');
});

test('stage unlocks are sequential and sanitizers reject forged clears', () => {
  const fresh = defaultPirateProgress();
  assert.equal(pirateStageUnlocked(fresh, 'first_tide'), true);
  assert.equal(pirateStageUnlocked(fresh, 'bell_below'), false);
  const forged = sanitizePirateProgress({
    stages: {
      first_tide: { cleared: true, runs: 1 },
      bell_below: { cleared: true, runs: 1 },
      drowned_crown: { cleared: true, runs: 1 },
    },
  });
  assert.equal(forged.stages.first_tide.cleared, true);
  assert.equal(forged.stages.bell_below.cleared, true);
  assert.equal(forged.stages.drowned_crown?.cleared || false, false, 'stage five cannot skip stage three and four');
  assert.equal(pirateStageUnlocked(forged, 'widow_wake'), true, 'stage three is legal once stage two is cleared');
  assert.equal(pirateStageUnlocked(forged, 'iron_tide'), false, 'stage four still needs stage three');
});

test('a voyage starts on the selected stage with a real ship, enemies and deterministic world', () => {
  const a = createPirateVoyage({ stageId: 'widow_wake', seed: 77 });
  const b = createPirateVoyage({ stageId: 'widow_wake', seed: 77 });
  assert.equal(a.stageId, 'widow_wake');
  assert.equal(a.phase, 'sailing');
  assert.equal(a.player.hp, 300);
  assert.equal(a.enemies.length, 3);
  assert.equal(a.gold, 0);
  assert.deepEqual([a.player.x, a.player.y], [1990, 1040]);
  assert.deepEqual(a.enemies.map((enemy) => [Math.round(enemy.x), Math.round(enemy.y)]), b.enemies.map((enemy) => [Math.round(enemy.x), Math.round(enemy.y)]));
  for (const enemy of a.enemies) assert.ok(!isInsideIsland(enemy.x, enemy.y, enemy.hullRadius));
});

test('WASD throttle and turn move the player without crossing an island', () => {
  const m = createPirateVoyage({ seed: 9 });
  setPirateControls(m, { throttle: 1, turn: 0 });
  const start = { x: m.player.x, y: m.player.y };
  for (let i = 0; i < 30; i += 1) updatePirateVoyage(m, 1 / 60);
  assert.ok(Math.hypot(m.player.x - start.x, m.player.y - start.y) > 20, 'ship should move forward');
  assert.ok(m.player.x >= 0 && m.player.x <= PIRATE_WORLD_W);
  assert.ok(!isInsideIsland(m.player.x, m.player.y, m.player.hullRadius + 1));

  // Point straight into the nearest island and confirm the hull is pushed out.
  const island = PIRATE_ISLANDS[0];
  m.player.x = island.x + island.r + m.player.hullRadius + 4;
  m.player.y = island.y;
  m.player.angle = Math.PI;
  m.player.speed = 120;
  setPirateControls(m, { throttle: 1, turn: 0 });
  for (let i = 0; i < 30; i += 1) updatePirateVoyage(m, 1 / 60);
  assert.ok(!isInsideIsland(m.player.x, m.player.y, m.player.hullRadius - 1));
});

test('port and starboard broadsides respect reload timers and fire real cannonballs', () => {
  const m = createPirateVoyage({ seed: 12 });
  m.player.reloadPort = 0;
  m.player.reloadStarboard = 0;
  assert.equal(pirateFire(m, -1), true);
  assert.equal(m.cannonballs.length, m.player.type.cannons);
  assert.equal(pirateFire(m, -1), false, 'the same side must reload');
  assert.equal(pirateFire(m, 1), true);
  assert.equal(m.cannonballs.length, m.player.type.cannons * 2);
  assert.ok(m.shotsFired >= 6);
  assert.equal(pirateFireAt(m, m.player.x, m.player.y - 400), false, 'empty sides still obey cooldowns');
});

test('player cannonballs damage enemy ships at broadside range', () => {
  const m = createPirateVoyage({ seed: 22 });
  const target = m.enemies[0];
  m.enemies = [target];
  target.x = m.player.x + 180;
  target.y = m.player.y;
  target.speed = 0;
  target.throttle = -1;
  m.player.angle = -Math.PI / 2;
  m.player.reloadStarboard = 0;
  pirateFire(m, 1);
  const before = target.hp;
  for (let i = 0; i < 20; i += 1) updatePirateVoyage(m, 1 / 60);
  assert.ok(target.hp < before, 'a broadside must hit a ship beside the player');
  assert.ok(m.hits > 0);
});

test('a stage boss spawns after the bounty and clearing it completes the stage', () => {
  const m = createPirateVoyage({ stageId: 'first_tide', seed: 31 });
  m.kills = m.stage.targetKills;
  updatePirateVoyage(m, 0.02);
  assert.equal(m.bossSpawned, true);
  const boss = m.enemies.find((enemy) => enemy.type.boss);
  assert.ok(boss);
  boss.hp = 0.1;
  boss.dead = false;
  // Use a direct player cannonball against the flagship.
  m.player.x = boss.x - 150;
  m.player.y = boss.y;
  m.player.angle = -Math.PI / 2;
  m.player.reloadStarboard = 0;
  pirateFire(m, 1);
  for (let i = 0; i < 45 && m.phase === 'sailing'; i += 1) updatePirateVoyage(m, 1 / 60);
  assert.equal(m.bossDefeated, true);
  assert.equal(m.phase, 'cleared');
  assert.equal(m.kills, m.stage.targetKills, 'the captain is not an extra bounty kill');
  assert.ok(m.score >= m.stage.score);
});

test('all ten captains spawn on their own route and can be sunk', () => {
  for (const stage of PIRATE_STAGES) {
    const m = createPirateVoyage({ stageId: stage.id, seed: 100 + stage.index });
    m.kills = stage.targetKills;
    updatePirateVoyage(m, 0.02);
    const boss = m.enemies.find((enemy) => enemy.type.boss);
    assert.ok(boss, `${stage.id} must spawn a captain`);
    assert.equal(boss.type.id, stage.bossId);
    assert.equal(m.kills, stage.targetKills, 'bounty count stays exact');
    assert.equal(m.bossSpawned, true);
    assert.equal(pirateDamageShip(m, boss.id, 99999), true);
    assert.equal(m.bossDefeated, true);
    assert.equal(m.phase, 'cleared');
    assert.equal(m.kills, stage.targetKills);
  }
});

test('a captain fight stops regular reinforcements and never double-spawns the captain', () => {
  const m = createPirateVoyage({ stageId: 'first_tide', seed: 37 });
  m.kills = m.stage.targetKills;
  updatePirateVoyage(m, 0.02);
  assert.equal(m.bossSpawned, true);
  const count = m.enemies.length;
  m.spawnTimer = 0;
  for (let i = 0; i < 90; i += 1) updatePirateVoyage(m, 1 / 60);
  assert.equal(m.enemies.length, count, 'no new trash ships once the captain arrives');
  assert.equal(m.enemies.filter((enemy) => enemy.type.boss).length, 1, 'only one captain exists');
});

test('docking repairs the hull for gold and refuses when out of range or funds', () => {
  const m = createPirateVoyage({ seed: 41 });
  const port = m.ports[0];
  m.player.x = port.x + port.r + 40;
  m.player.y = port.y;
  m.player.hp = 90;
  m.gold = 80;
  const near = pirateNearPort(m);
  assert.equal(near.inRange, true);
  const result = pirateDock(m);
  assert.equal(result.ok, true);
  assert.equal(m.gold, 80 - PIRATE_DOCK_COST);
  assert.ok(m.player.hp > 90);
  m.player.hp = 100;
  m.gold = 0;
  assert.equal(pirateDock(m).ok, false);
  m.player.x = 1600;
  m.player.y = 1200;
  assert.equal(pirateDock(m).ok, false);
});

test('sinking the player ends the voyage as a defeat and never unlocks the next route', () => {
  const m = createPirateVoyage({ seed: 51 });
  m.player.hp = 0;
  updatePirateVoyage(m, 0.02);
  assert.equal(m.phase, 'sunk');
  const saved = recordPirateVoyage(defaultPirateProgress(), m);
  assert.equal(saved.win, false);
  assert.equal(saved.progress.losses, 1);
  assert.equal(saved.progress.wins, 0);
  assert.equal(saved.progress.stages.first_tide.cleared, false);
  assert.equal(pirateStageUnlocked(saved.progress, 'bell_below'), false);
});

test('ship hulls collide, separate and the black sloop rams for damage', () => {
  const m = createPirateVoyage({ seed: 53 });
  const enemy = m.enemies[0];
  const ramType = PIRATE_SHIP_TYPES.find((type) => type.ram);
  assert.ok(ramType, 'a ramming hull exists');
  enemy.type = { ...ramType };
  enemy.hullRadius = ramType.radius;
  enemy.hp = ramType.hp;
  enemy.maxHp = ramType.hp;
  m.enemies = [enemy];
  enemy.x = m.player.x + m.player.hullRadius + enemy.hullRadius - 8;
  enemy.y = m.player.y;
  enemy.angle = Math.PI;
  enemy.speed = 100;
  m.player.angle = 0;
  m.player.speed = 120;
  const before = m.player.hp;
  updatePirateVoyage(m, 1 / 60);
  assert.ok(m.player.hp < before, 'a ramming sloop must damage the player hull');
  const gap = Math.hypot(enemy.x - m.player.x, enemy.y - m.player.y);
  assert.ok(gap >= m.player.hullRadius + enemy.hullRadius - 2, 'colliding hulls are pushed apart');
  assert.ok(!isInsideIsland(m.player.x, m.player.y, m.player.hullRadius - 1));
});

test('the cannonball pool hard-caps without spending a reload', () => {
  const m = createPirateVoyage({ seed: 57 });
  m.cannonballs = Array.from({ length: PIRATE_MAX_BALLS - 1 }, (_, i) => ({ id: `filler_${i}`, dead: false }));
  m.player.reloadStarboard = 0;
  assert.equal(pirateFire(m, 1), true, 'the last free slot still fires');
  assert.equal(m.cannonballs.length, PIRATE_MAX_BALLS);
  assert.ok(m.shotsFired >= 1);
  m.player.reloadPort = 0;
  const shots = m.shotsFired;
  assert.equal(pirateFire(m, -1), false, 'a full pool fires nothing');
  assert.equal(m.shotsFired, shots);
  assert.equal(m.player.reloadPort, 0, 'a blocked shot must not start a reload');
});

test('progress records wins, losses, accuracy and sequential stage clears', () => {
  const win = createPirateVoyage({ stageId: 'first_tide', seed: 61 });
  win.kills = win.stage.targetKills;
  updatePirateVoyage(win, 0.02);
  const boss = win.enemies.find((enemy) => enemy.type.boss);
  boss.hp = 0;
  win.player.x = boss.x - 120;
  win.player.y = boss.y;
  win.player.angle = -Math.PI / 2;
  win.player.reloadStarboard = 0;
  pirateFire(win, 1);
  for (let i = 0; i < 40 && win.phase === 'sailing'; i += 1) updatePirateVoyage(win, 1 / 60);
  const saved = recordPirateVoyage(defaultPirateProgress(), win);
  assert.equal(saved.win, true);
  assert.equal(saved.progress.wins, 1);
  assert.equal(saved.progress.stages.first_tide.cleared, true);
  assert.equal(pirateStageUnlocked(saved.progress, 'bell_below'), true);
  const summary = pirateSummary(saved.progress);
  assert.equal(summary.cleared, 1);
  assert.equal(summary.total, 10);
  assert.ok(summary.accuracy >= 0 && summary.accuracy <= 100);
});

test('forged pirate saves are clamped, including impossible accuracy and junk stages', () => {
  const p = sanitizePirateProgress({
    voyages: -4,
    wins: '3',
    totalShots: 10,
    totalHits: 999,
    bestScore: -9,
    stages: {
      first_tide: { runs: -2, cleared: true, bestScore: -5, bestTime: Infinity },
      bell_below: { runs: 1.9, cleared: true },
      drowned_crown: { runs: 'x', cleared: true },
      unknown_stage: { cleared: true, runs: 99 },
    },
  });
  assert.equal(p.totalHits, 10, 'hit count can never exceed shots');
  assert.equal(pirateSummary(p).accuracy, 100);
  assert.equal(p.voyages, 0);
  assert.equal(p.bestScore, 0);
  assert.equal(p.stages.first_tide.runs, 0);
  assert.equal(p.stages.first_tide.bestTime, 0);
  assert.equal(p.stages.bell_below.runs, 1);
  assert.equal(p.stages.drowned_crown?.cleared || false, false, 'stage five cannot skip stages three and four');
  assert.equal(p.stages.unknown_stage, undefined, 'unknown route ids are dropped');
});

test('snapshots expose HUD data and camera conversion stays invertible', () => {
  const m = createPirateVoyage({ stageId: 'iron_tide', seed: 71 });
  const snap = pirateSnapshot(m);
  assert.equal(snap.stageName, 'Pasang Baja');
  assert.equal(snap.player.maxHp, 300);
  assert.ok(snap.enemies.length >= 3);
  assert.ok(snap.world.width >= 3000);
  const point = pirateScreenToWorld(m, 300, 220, 960, 540);
  assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
  assert.ok(point.x >= 0 && point.x <= PIRATE_WORLD_W);
});

test('the procedural renderer draws the open sea with a mock canvas context', () => {
  const m = createPirateVoyage({ seed: 81 });
  const calls = [];
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, {
    get(target, key) {
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
      if (key === 'measureText') return () => ({ width: 12 });
      if (key in target) return target[key];
      return (...args) => { calls.push([key, args.length]); };
    },
    set(target, key, value) {
      target[key] = value;
      return true;
    },
  });
  assert.doesNotThrow(() => renderPirateVoyage(ctx, m, { width: 960, height: 540, time: 2 }));
  assert.ok(calls.some(([name]) => name === 'fillRect'));
  assert.ok(calls.some(([name]) => name === 'arc'));
  assert.ok(calls.some(([name]) => name === 'stroke'));
});

test('endless tide escalates, pays hull upgrades and never clears a route', () => {
  const m = createPirateEndless({ seed: 303 });
  assert.equal(m.mode, 'endless');
  assert.equal(m.stageId, PIRATE_ENDLESS_STAGE.id);
  assert.equal(m.endless.surge, 1);
  assert.equal(m.phase, 'sailing');
  assert.ok(m.enemies.length >= 3);
  assert.equal(m.bossSpawned, false);
  const startHp = m.player.maxHp;
  const startDamage = m.player.damageScale || 1;

  for (let i = 1; i <= 5; i += 1) {
    assert.equal(pirateEndlessSurge(m), true);
    assert.equal(m.endless.surge, 1 + i);
  }
  assert.ok(m.player.maxHp > startHp, 'every surge raises the hull ceiling');
  assert.ok((m.player.damageScale || 1) > startDamage, 'every surge sharpens the cannons');
  assert.equal(m.endless.surge % PIRATE_ENDLESS_CAPTAIN_EVERY, 0, 'surge six is a captain surge');
  const captain = m.enemies.find((enemy) => enemy.type.boss);
  assert.ok(captain, 'a captain joins the endless tide');
  assert.equal(m.endless.captains, 0, 'nobody counts as sunk until the hull goes down');

  // A captain is a bounty here, not a finish line.
  for (const enemy of [...m.enemies]) {
    if (enemy.type.boss) pirateDamageShip(m, enemy.id, 999999);
  }
  assert.equal(m.phase, 'sailing');
  assert.equal(m.bossDefeated, false);
  assert.ok(m.endless.captains >= 1);
  assert.ok(m.score > 0);
  assert.equal(pirateSnapshot(m).bossSpawned, false, 'the boss bar hides once the captain is sunk');

  m.player.hp = 0;
  updatePirateVoyage(m, 1 / 60);
  assert.equal(m.phase, 'sunk');
  const saved = recordPirateEndless(defaultPirateProgress(), m);
  assert.equal(saved.isRecord, true);
  assert.equal(saved.progress.endless.runs, 1);
  assert.equal(saved.progress.endless.bestSurge, 6);
  assert.equal(saved.progress.endless.bestKills, m.kills);
  assert.equal(pirateStageUnlocked(saved.progress, 'bell_below'), false, 'endless never unlocks a captain route');
  assert.equal(saved.progress.voyages, 0, 'endless is not counted as a route voyage');
  assert.equal(pirateSummary(saved.progress).endlessBest.bestSurge, 6);
});

test('endless records clamp junk and survive a save round-trip', () => {
  const clean = sanitizePirateProgress({
    endless: { runs: -3, bestScore: '9x', bestSurge: 5000, bestKills: -4, bestTime: Infinity, totalKills: 77 },
    stages: {},
  });
  assert.equal(clean.endless.runs, 0);
  assert.equal(clean.endless.bestScore, 0);
  assert.equal(clean.endless.bestSurge, 999);
  assert.equal(clean.endless.bestKills, 0);
  assert.equal(clean.endless.bestTime, 0);
  assert.equal(clean.endless.totalKills, 77);
  assert.deepEqual(sanitizePirateProgress(clean).endless, clean.endless);
  assert.equal(sanitizePirateProgress(null).endless.bestSurge, 0);
  assert.equal(sanitizePirateProgress({ endless: 'junk' }).endless.runs, 0);
});

function isInsideIsland(x, y, pad = 0) {
  return PIRATE_ISLANDS.some((island) => Math.hypot(x - island.x, y - island.y) < island.r + pad);
}
