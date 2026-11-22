// Update XIII — live engine coverage for Veil stages, ghosts and bosses.
import test from 'node:test';
import assert from 'node:assert/strict';
import { AshenGame } from '../src/core.js';
import { VEIL_STAGES, VEIL_BOSSES, veilStageEnemies } from '../src/veil.js';

const game = () => {
  const g = new AshenGame();
  g.reset();
  return g;
};

test('loadVeilStage spawns exactly the 20-enemy contract with one elite', () => {
  for (const stage of [VEIL_STAGES[0], VEIL_STAGES[10], VEIL_STAGES[29]]) {
    const g = game();
    const room = g.loadVeilStage(stage.id);
    assert.ok(room, stage.id);
    assert.equal(g.enemies.length, 20, stage.id);
    assert.equal(g.enemies.filter((e) => e.elite).length, 1, stage.id);
    assert.equal(g.enemies.filter((e) => !e.elite).length, 19, stage.id);
    assert.equal(g.veilStageId, stage.id);
    assert.equal(g.roomIndex, stage.room);
    const event = g.events.find((e) => e.type === 'veilStageEnter');
    assert.ok(event && event.enemies === 20 && event.elite === 1);
  }
});

test('veil boss spawns with five phases and the generic phase loop advances them', () => {
  const g = game();
  const boss = g.startVeilBoss('veil_architect');
  assert.ok(boss);
  assert.equal(boss.maxPhases, 5);
  assert.deepEqual(boss.phaseThresholds, [0.8, 0.6, 0.4, 0.2]);
  assert.equal(boss.phase, 1);
  assert.equal(boss.veilBoss, 'veil_architect');
  g.boss.intro = 0;
  g.boss.invuln = 0;
  for (let i = 0; i < 4; i += 1) {
    g.boss.invuln = 0;
    g.hurtBoss(Math.ceil(g.boss.maxHp * 0.25));
  }
  assert.ok(g.boss.phase >= 3, `phase advanced to ${g.boss.phase}`);
  const phases = g.events.filter((e) => e.type === 'bossPhase').length;
  assert.ok(phases >= 1);
});

test('all seven veil bosses can be spawned from the engine without legacy data', () => {
  for (const boss of VEIL_BOSSES) {
    const g = game();
    const spawned = g.startVeilBoss(boss.id);
    assert.ok(spawned, boss.id);
    assert.equal(spawned.name, boss.name);
    assert.equal(spawned.maxPhases, boss.maxPhases);
    assert.deepEqual(spawned.phaseThresholds, boss.phaseThresholds);
    assert.ok(spawned.dialogueData?.intro, boss.id);
  }
});

test('spawnGhost registers a navigable, non-lethal entity with its index identity', () => {
  const g = game();
  g.loadVeilStage(VEIL_STAGES[0].id);
  const ghost = g.spawnGhost('pale_resident', 300);
  assert.ok(ghost);
  assert.equal(ghost.ghostKind, 'pale_resident');
  assert.equal(ghost.ghostClassification, 'lost_spirit');
  assert.equal(ghost.name, 'Penduduk Pucat');
  assert.ok(ghost.hp > 0 && ghost.maxHp === ghost.hp);
  assert.ok(ghost.uid.startsWith('ghost_'));
  assert.ok(g.veilGhosts.includes(ghost));
  const event = g.events.find((e) => e.type === 'ghostSpawn');
  assert.ok(event && event.kind === 'pale_resident');
});

test('ghost damage lands once per attack window and respects invulnerability', () => {
  const g = game();
  g.loadVeilStage(VEIL_STAGES[0].id);
  g.player.hp = 100;
  g.player.invuln = 0;
  const ghost = g.spawnGhost('corridor_shade', g.player.x);
  ghost.x = g.player.x;
  ghost.y = g.player.y;
  ghost.maxX = 2000;
  g.updateGhost(ghost, 1 / 60);
  const afterFirst = g.player.hp;
  assert.ok(afterFirst < 100, `player took damage (${afterFirst})`);
  assert.equal(ghost.ghostPhase, 1);
  for (let i = 0; i < 30; i += 1) {
    g.player.invuln = 0;
    g.updateGhost(ghost, 1 / 60);
  }
  assert.equal(ghost.ghostPhase, 1, 'the attack timer prevents duplicate hits');
});

test('ghost movement stays inside its navigable bounds', () => {
  const g = game();
  g.loadVeilStage(VEIL_STAGES[0].id);
  const ghost = g.spawnGhost('bark_watcher', 200);
  ghost.minX = 150;
  ghost.maxX = 400;
  for (let i = 0; i < 600; i += 1) {
    g.player.invuln = 1;
    g.updateGhost(ghost, 1 / 60);
    assert.ok(ghost.x >= ghost.minX - 0.01 && ghost.x + ghost.w <= ghost.maxX + 0.01, `x=${ghost.x}`);
  }
});

test('a ghost at zero HP is banished and stops damaging', () => {
  const g = game();
  g.loadVeilStage(VEIL_STAGES[0].id);
  const ghost = g.spawnGhost('hollow_walker', 300);
  ghost.hp = 0;
  g.updateGhost(ghost, 1 / 60);
  assert.equal(ghost.dead, true);
  assert.equal(ghost.ghostBanished, true);
  assert.ok(g.events.some((e) => e.type === 'ghostBanished'));
});

test('stage enemy plan scales by chapter without breaking the 20/1 contract', () => {
  const first = veilStageEnemies(VEIL_STAGES[0].id);
  const last = veilStageEnemies(VEIL_STAGES[29].id);
  assert.equal(first.length, last.length);
  assert.ok(last[last.length - 1].hpScale > first[first.length - 1].hpScale);
  assert.equal(last[last.length - 1].elite, true);
  assert.equal(first.filter((d) => d.elite).length, 1);
});
