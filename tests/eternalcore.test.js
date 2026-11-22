// Update XVI — live engine coverage for The Unwritten Wing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { AshenGame } from '../src/core.js';
import { ETERNAL_STAGES, ETERNAL_BOSSES } from '../src/eternal_data.js';

const game = () => {
  const g = new AshenGame();
  g.reset();
  return g;
};

test('all five Unwritten Wing anomaly stages spawn the 20-enemy contract', () => {
  const stages = ETERNAL_STAGES.filter((stage) => stage.chapter === 'unwritten_wing');
  assert.equal(stages.length, 5);
  for (const stage of stages) {
    assert.equal(stage.stageType, 'anomaly');
    const g = game();
    const room = g.loadEternalStage(stage.id);
    assert.ok(room, stage.id);
    assert.equal(g.enemies.length, 20, stage.id);
    assert.equal(g.enemies.filter((e) => e.elite).length, 1, stage.id);
    assert.equal(g.enemies.filter((e) => !e.elite).length, 19, stage.id);
    assert.equal(g.eternalStageId, stage.id);
    assert.equal(g.roomIndex, stage.room);
    const event = g.events.find((e) => e.type === 'eternalStageEnter');
    assert.ok(event && event.enemies === 20 && event.elite === 1, stage.id);
  }
});

test('The Unwritten spawns with four phases and advances through the generic loop', () => {
  const g = game();
  const boss = g.startEternalBoss('the_unwritten');
  assert.ok(boss);
  assert.equal(boss.maxPhases, 4);
  assert.deepEqual(boss.phaseThresholds, [0.8, 0.55, 0.3]);
  assert.equal(boss.phase, 1);
  assert.equal(boss.eternalBoss, 'the_unwritten');
  assert.ok(boss.dialogueData?.phase4, 'phase 4 dialogue exists');
  g.boss.intro = 0;
  for (let i = 0; i < 3; i += 1) {
    g.boss.invuln = 0;
    g.hurtBoss(Math.ceil(g.boss.maxHp * 0.26));
  }
  assert.equal(g.boss.phase, 4);
  assert.ok(g.events.filter((e) => e.type === 'bossPhase').length >= 3);
});

test('all nine Arc X bosses spawn through the existing engine path', () => {
  for (const boss of ETERNAL_BOSSES) {
    const g = game();
    const spawned = g.startEternalBoss(boss.id);
    assert.ok(spawned, boss.id);
    assert.equal(spawned.name, boss.name);
    assert.equal(spawned.maxPhases, boss.maxPhases);
    assert.deepEqual(spawned.phaseThresholds, boss.phaseThresholds);
    assert.ok(spawned.dialogueData?.intro, boss.id);
  }
});
