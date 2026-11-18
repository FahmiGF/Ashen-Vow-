import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REALM_MODES,
  REALM_DIFFICULTIES,
  REALM_REWARDS,
  createRealmRun,
  updateRealmRun,
  realmAction,
  realmObjectives,
  realmEligibility,
  realmClaimPayload,
  realmsClaimEligibility,
  recordRealmRun,
  defaultRealmsProgress,
  sanitizeRealmsProgress,
  stageInfo,
  stageAccessCatalog,
  hackSessionConfig,
} from '../src/realms.js';

test('Infinite Realms exposes six distinct modes and exclusive reward tracks', () => {
  assert.equal(REALM_MODES.length, 6);
  assert.equal(REALM_DIFFICULTIES.length, 4);
  assert.equal(REALM_REWARDS.length, 6);
  assert.deepEqual(REALM_MODES.map((mode) => mode.id), [
    'riftfall', 'relic_expedition', 'last_bastion', 'echo_maze', 'shadow_duel', 'chrono_fracture',
  ]);
  for (const mode of REALM_MODES) {
    assert.ok(mode.rewardId);
    assert.ok(mode.cosmeticId);
    assert.ok(mode.minScore > 0);
    const run = createRealmRun(mode.id, { seed: 11, difficulty: 'hard' });
    assert.equal(run.modeId, mode.id);
    assert.equal(run.phase, 'playing');
    assert.equal(run.difficulty, 'hard');
    assert.ok(realmObjectives(run).length > 0);
  }
});

test('Riftfall advances waves and offers a temporary upgrade', () => {
  const run = createRealmRun('riftfall', { seed: 3 });
  for (let i = 0; i < 40; i += 1) updateRealmRun(run, 0.08, { right: true });
  assert.ok(run.wave >= 1);
  assert.ok(run.enemies.length > 0);
  run.enemies = [];
  updateRealmRun(run, 0.08, {});
  assert.equal(run.phase, 'upgrade');
  assert.equal(run.upgradeChoices.length, 3);
  assert.equal(realmAction(run, 'upgrade', { index: 0 }), true);
  assert.equal(run.phase, 'playing');
  assert.equal(run.upgrades.length, 1);
});

test('Relic Expedition branches, collects relics, and extracts', () => {
  const run = createRealmRun('relic_expedition', { seed: 9 });
  assert.equal(run.choices.length, 3);
  assert.equal(realmAction(run, 'choose', { index: 0 }), true);
  assert.ok(run.relics.length >= 1 || run.player.hp < run.player.maxHp);
  run.relics.push({ id: 'test_relic', name: 'Test Relic', value: 100 });
  assert.equal(realmAction(run, 'extract'), true);
  assert.equal(run.phase, 'ended');
  assert.equal(run.result, 'victory');
  assert.ok(run.score > 0);
});

test('Last Bastion builds towers, upgrades, and deploys a hero', () => {
  const run = createRealmRun('last_bastion', { seed: 5 });
  run.gold = 500;
  assert.equal(realmAction(run, 'build', { type: 'bulwark', lane: 0 }), true);
  assert.equal(run.towers.length, 1);
  assert.equal(realmAction(run, 'upgrade', { lane: 0 }), true);
  assert.equal(run.towers[0].level, 2);
  assert.equal(realmAction(run, 'deploy', { lane: 1 }), true);
  assert.equal(run.heroes.length, 1);
  assert.equal(realmAction(run, 'lane', { lane: 2 }), true);
  assert.equal(run.lane, 2);
});

test('Echo Maze generates a connected maze with three keys and a pursuer', () => {
  const run = createRealmRun('echo_maze', { seed: 13 });
  assert.ok(run.walls.size > 0);
  assert.equal(run.keyCells.length, 3);
  assert.ok(run.pursuer);
  assert.equal(realmAction(run, 'move', { dx: 0, dy: -1 }), true);
  const before = run.player.x + run.player.y;
  assert.ok(run.player.x + run.player.y >= 0);
  assert.equal(typeof before, 'number');
  run.keys = 3;
  run.player.x = run.exit.x;
  run.player.y = run.exit.y - 1;
  run.walls.delete(`${run.exit.x},${run.exit.y}`);
  run.walls.delete(`${run.exit.x},${run.exit.y - 1}`);
  realmAction(run, 'move', { dx: 0, dy: 1 });
  assert.equal(run.result, 'victory');
});

test('Shadow Duel resolves combat actions and Chrono Fracture activates five anchors', () => {
  const duel = createRealmRun('shadow_duel', { seed: 2 });
  const hp = duel.shadow.hp;
  assert.equal(realmAction(duel, 'attack'), true);
  assert.ok(duel.shadow.hp < hp);

  const chrono = createRealmRun('chrono_fracture', { seed: 4 });
  for (const anchor of chrono.anchors) {
    chrono.player.x = anchor.x;
    assert.equal(realmAction(chrono, 'activate'), true);
  }
  assert.equal(chrono.activated, 5);
  assert.equal(chrono.phase, 'ended');
  assert.equal(chrono.result, 'victory');
  assert.equal(realmEligibility(chrono).ok, true);
});

test('exclusive rewards require an eligible completed run and verified record', () => {
  const run = createRealmRun('chrono_fracture', { seed: 4 });
  for (const anchor of run.anchors) {
    run.player.x = anchor.x;
    realmAction(run, 'activate');
  }
  const payload = realmClaimPayload(run);
  assert.equal(realmsClaimEligibility(payload).ok, true);
  assert.equal(realmsClaimEligibility({ ...payload, anchors: 0 }).ok, false);
  const progress = defaultRealmsProgress();
  const unverified = recordRealmRun(progress, run, { verified: false });
  assert.equal(unverified.progress.rewards.length, 0);
  const verified = recordRealmRun(progress, run, { verified: true });
  assert.equal(verified.reward.id, 'chrono_armor');
  assert.ok(verified.progress.rewards.includes('chrono_armor'));
  assert.ok(verified.progress.unlockedCosmetics.includes('skin_chrono_warden'));
  assert.equal(verified.progress.modes.chrono_fracture.wins, 2);
  const safe = sanitizeRealmsProgress(verified.progress);
  assert.deepEqual(safe.rewards, ['chrono_armor']);
});

test('Stage Access exposes Arc VI, stage facts, and isolated HACK sessions', () => {
  const catalog = stageAccessCatalog();
  assert.equal(catalog.find((arc) => arc.id === 'arc6').stages.length, 20);
  const info = stageInfo(505);
  assert.equal(info.enemyCount, 20);
  assert.equal(info.archetypes, 4);
  assert.equal(info.elite.name, 'Astral Executioner');
  assert.equal(stageInfo(524).boss.name, 'The Architect of Eternity');
  assert.equal(stageInfo(524).boss.phases, 4);
  const config = hackSessionConfig(505, { difficulty: 'nightmare', classId: 'lyna' });
  assert.equal(config.isolated, true);
  assert.equal(config.testRewardSimulation, false);
  assert.equal(config.roomId, 505);
  assert.equal(config.difficulty, 'nightmare');
  assert.equal(config.classId, 'lyna');
  assert.equal(hackSessionConfig('riftfall').modeId, 'riftfall');
});
