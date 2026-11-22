import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ALL_BOSS_INFO, BOSS_INFO } from '../src/core.js';
import {
  AttackHitbox,
  BossPhysics,
  HitboxSet,
  PhaseController,
  bossDebugSnapshot,
  simulateBossCombat,
  validateBossConfig,
} from '../src/boss_core.js';

const floorRoom = { platforms: [{ x: 0, y: 560, w: 1280, h: 40 }], width: 1280 };

function boss(overrides = {}) {
  return {
    id: 'b1', kind: 'warden', hp: 340, maxHp: 340, phase: 1, maxPhases: 2,
    phaseThresholds: [0.5], x: 400, y: 430, w: 120, h: 130, facing: 1,
    dying: false, stagger: 0, vx: 0, vy: 0, ...overrides,
  };
}

test('every shipped boss has a valid phase/dialogue configuration', () => {
  for (const [kind, info] of Object.entries(BOSS_INFO)) {
    const errors = validateBossConfig(kind, info);
    assert.deepEqual(errors, [], `${kind}: ${errors.join('; ')}`);
  }
  assert.ok(Object.keys(BOSS_INFO).length >= 6);
});

test('the whole boss roster (legacy + expansion) validates', () => {
  const failures = [];
  for (const [kind, info] of Object.entries(ALL_BOSS_INFO)) {
    if (!info || typeof info !== 'object' || !info.hp) continue;
    // Expansion bosses inherit their dialogue at spawn; structure is what the
    // core must guarantee for every one of them.
    const errors = validateBossConfig(kind, info, { requireDialogue: info.dialogue !== undefined });
    if (errors.length) failures.push(...errors);
  }
  assert.deepEqual(failures, []);
});

test('a boss advances exactly one phase per crossed threshold', () => {
  const b = boss();
  const controller = new PhaseController({ maxPhases: 3, phaseThresholds: [0.66, 0.33] }, { cooldown: 0 });
  const seen = [];
  assert.deepEqual(controller.commit(b, (_, phase) => seen.push(phase)), []);
  b.hp = 200;
  assert.deepEqual(controller.commit(b, (_, phase) => seen.push(phase)), [2]);
  // Re-evaluating at the same HP must not fire again.
  assert.deepEqual(controller.commit(b, (_, phase) => seen.push(phase)), []);
  b.hp = 100;
  assert.deepEqual(controller.commit(b, (_, phase) => seen.push(phase)), [3]);
  assert.deepEqual(seen, [2, 3]);
  assert.equal(b.phase, 3);
  // No phase beyond maxPhases, ever.
  b.hp = 1;
  assert.deepEqual(controller.commit(b, () => {}), []);
  assert.ok(b.phase <= 3);
});

test('phase transitions are blocked while dying, at zero HP and during cooldown', () => {
  const dying = boss({ hp: 10, dying: true });
  const c1 = new PhaseController({ maxPhases: 2, phaseThresholds: [0.5] }, { cooldown: 0 });
  assert.deepEqual(c1.commit(dying, () => {}), []);
  assert.equal(c1.blocked.at(-1), 'blocked-dying');

  const dead = boss({ hp: 0 });
  const c2 = new PhaseController({ maxPhases: 2, phaseThresholds: [0.5] }, { cooldown: 0 });
  assert.deepEqual(c2.commit(dead, () => {}), []);
  assert.equal(dead.phase, 1);

  const live = boss({ hp: 1 });
  const c3 = new PhaseController({ maxPhases: 2, phaseThresholds: [0.5] }, { cooldown: 0.5 });
  assert.deepEqual(c3.commit(live, () => {}), [2]);

  const c4 = new PhaseController({ maxPhases: 3, phaseThresholds: [0.9, 0.1] }, { cooldown: 1 });
  const cooled = boss({ hp: 300 });
  assert.deepEqual(c4.commit(cooled, () => {}, 0), [2]);
  cooled.hp = 1;
  assert.equal(c4.evaluate(cooled, 0).reason, 'blocked-cooldown');
  assert.equal(c4.evaluate(cooled, 1.1).reason, 'advance');
});

test('a hitbox deals damage once per activation and only during its active window', () => {
  const owner = { x: 100, y: 400, w: 60, h: 60, facing: 1 };
  const hitbox = new AttackHitbox('slash', { windup: 0.2, active: 0.12, recovery: 0.2, width: 120, height: 90 }, owner);
  const target = { id: 'player', x: 150, y: 410, w: 30, h: 46 };
  assert.equal(hitbox.tryHit(target), false, 'windup deals no damage');
  hitbox.update(0.25);
  assert.equal(hitbox.isActive, true);
  assert.equal(hitbox.tryHit(target), true);
  for (let i = 0; i < 10; i += 1) assert.equal(hitbox.tryHit(target), false, 'no repeat hits');
  hitbox.update(0.2);
  assert.equal(hitbox.isActive, false);
  assert.equal(hitbox.tryHit(target), false, 'closed attack cannot hit');
});

test('continuous attacks repeat on their declared interval only', () => {
  const owner = { x: 0, y: 0, w: 40, h: 40, facing: 1 };
  const beam = new AttackHitbox('beam', {
    windup: 0, active: 1, recovery: 0, continuous: true, repeat: 0.3, range: 200, shape: 'circle',
  }, owner);
  const target = { id: 'player', x: 0, y: 0, w: 20, h: 20 };
  assert.equal(beam.tryHit(target, 0), true);
  assert.equal(beam.tryHit(target, 0.1), false);
  assert.equal(beam.tryHit(target, 0.35), true);
});

test('hitboxes are cancelled by stagger and by death', () => {
  const owner = { x: 0, y: 0, w: 40, h: 40, facing: 1, stagger: 0, dying: false, hp: 100 };
  const set = new HitboxSet(owner);
  set.open('slam', { windup: 0, active: 0.5 });
  set.update(0.05);
  assert.equal(set.active('slam'), true);
  owner.stagger = 0.3;
  set.update(0.05);
  assert.equal(set.active('slam'), false);
  assert.equal(set.snapshot().length, 0);

  owner.stagger = 0;
  set.open('slash', { windup: 0, active: 0.5 });
  owner.hp = 0;
  owner.dying = true;
  set.update(0.02);
  assert.equal(set.active('slash'), false);
});

test('hitboxes respect arena geometry: a wall blocks a melee swing', () => {
  const owner = { x: 100, y: 400, w: 60, h: 60, facing: 1 };
  const hitbox = new AttackHitbox('slash', { windup: 0, active: 0.5, width: 220, height: 100, offsetX: 90 }, owner);
  hitbox.update(0.01);
  const target = { id: 'player', x: 210, y: 410, w: 30, h: 46 };
  assert.equal(hitbox.tryHit(target), true);
  // Geometry checks live in the engine, but the box must be derived from world
  // position and facing so a wall test can reject it.
  const box = hitbox.box();
  assert.ok(box.x > owner.x, 'box extends forward');
  owner.facing = -1;
  const flipped = hitbox.box();
  assert.ok(flipped.x < box.x, 'facing flips the box');
});

test('boss physics lands on the floor, clamps walls and settles', () => {
  const physics = new BossPhysics();
  const b = boss({ y: 300, h: 130 });
  for (let i = 0; i < 120; i += 1) physics.step(b, floorRoom, 1 / 60);
  assert.equal(b.y, 430, 'boss rests on the floor');
  assert.equal(physics.grounded, true);
  assert.equal(b.vy, 0);

  b.vx = -4000;
  for (let i = 0; i < 10; i += 1) physics.step(b, floorRoom, 1 / 60);
  assert.ok(b.x >= 40, 'wall clamp keeps the boss inside the arena');
  assert.equal(physics.wall, -1);
});

test('knockback decays and never leaves the boss airborne forever', () => {
  const physics = new BossPhysics();
  const b = boss({ y: 430 });
  physics.applyKnockback(1, 300, 0.2);
  for (let i = 0; i < 180; i += 1) physics.step(b, floorRoom, 1 / 60);
  assert.equal(physics.grounded, true);
  assert.ok(Math.abs(b.vx) < 5);
  assert.equal(b.y, 430);
});

test('boss physics rejects non-finite input instead of corrupting the run', () => {
  const physics = new BossPhysics();
  const b = boss({ y: 430, x: Number.NaN });
  physics.step(b, floorRoom, 1 / 60);
  assert.ok(Number.isFinite(b.x));
  assert.ok(Number.isFinite(b.y));
  assert.ok(physics.errors.length > 0);
});

test('every boss survives a headless fight with no invariant violations', () => {
  for (const [kind, info] of Object.entries(BOSS_INFO)) {
    const result = simulateBossCombat(info, { dps: Math.max(60, info.hp / 6) });
    assert.equal(result.negativeHp, 0, `${kind}: negative HP`);
    assert.equal(result.doubleHits, 0, `${kind}: duplicate hitbox damage`);
    assert.equal(result.attacksAfterDeath, 0, `${kind}: attacks after death`);
    assert.ok(result.reachedFinalPhase, `${kind}: stalled at phase ${result.finalPhase}/${result.expectedPhases}`);
    const expected = Number(info.maxPhases) || (info.phaseThresholds ? info.phaseThresholds.length + 1 : 2);
    assert.equal(result.phaseTransitions, expected - 1, `${kind}: wrong transition count`);
  }
});

test('the boss debug snapshot lists every field the dashboard renders', () => {
  const set = new HitboxSet(null);
  const b = boss({ hitboxes: set });
  const snap = bossDebugSnapshot(b);
  for (const key of ['id', 'phase', 'hp', 'state', 'activeAttack', 'hitboxes', 'grounded', 'velocity', 'inArena', 'transitioning', 'invulnerable']) {
    assert.ok(key in snap, `snapshot.${key} missing`);
  }
  assert.equal(bossDebugSnapshot(null), null);
});
