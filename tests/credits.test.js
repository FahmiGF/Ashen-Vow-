import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CREDIT_ARCS,
  CREDIT_ROLES,
  CREDIT_SCENE_FOOTER,
  creditArcFor,
  creditSceneFor,
  isArcFinalBoss,
} from '../src/credits.js';

test('every arc has a final-boss mapping and a credit scene', () => {
  assert.ok(CREDIT_ARCS.length >= 11);
  const ids = new Set();
  for (const arc of CREDIT_ARCS) {
    assert.ok(!ids.has(arc.id), `duplicate arc ${arc.id}`);
    ids.add(arc.id);
    assert.ok(arc.numeral && arc.title && arc.subtitle && arc.line);
    const mappings = Object.entries(arc.bosses);
    assert.ok(mappings.length > 0);
    for (const [runKind, kinds] of mappings) {
      assert.ok(kinds.length > 0);
      for (const kind of kinds) {
        assert.equal(creditArcFor(runKind, kind)?.id, arc.id, `${runKind}:${kind} must map to ${arc.id}`);
        assert.equal(isArcFinalBoss(runKind, kind), true);
      }
    }
  }
});

test('the real final boss kinds are recognised across campaign arcs', () => {
  const expected = [
    ['legacy', 'oathbreaker', 'arc1'],
    ['speedrun', 'oathbreaker', 'arc1'],
    ['expansion', 'echo_boss_10', 'echoes'],
    ['fairy', 'dragon', 'faewood'],
    ['fallen', 'fallen_seraphiel', 'fallen'],
    ['crusade', 'crusade_giant_paladin', 'crusade'],
    ['astral', 'astral_architect_of_eternity', 'astral'],
    ['eclipse', 'eclipse_forgotten_high_god', 'eclipse'],
    ['eclipse', 'eclipse_first_author', 'eclipse'],
    ['veil', 'veil_architect', 'veil'],
    ['eternal', 'first_forgotten', 'eternal'],
    ['atlas', 'atlas_boss_foundry', 'atlas'],
    ['court', 'court_boss_firstvow', 'hearthfall'],
  ];
  for (const [runKind, kind, arcId] of expected) {
    assert.equal(creditArcFor(runKind, kind)?.id, arcId, `${runKind}:${kind}`);
  }
  assert.equal(creditArcFor('legacy', 'warden'), null);
  assert.equal(creditArcFor('court', 'atlas_boss_foundry'), null);
});

test('Sealius is credited in every role, including technical lead and artist designer', () => {
  const roles = CREDIT_ROLES.map((entry) => entry.role);
  assert.ok(roles.includes('Technical Lead'));
  assert.ok(roles.includes('Artist & Designer'));
  assert.ok(roles.length >= 8);
  for (const entry of CREDIT_ROLES) assert.equal(entry.name, 'Sealius');
  const scene = creditSceneFor('arc1');
  assert.equal(scene.roles.length, CREDIT_ROLES.length);
  for (const entry of scene.roles) assert.equal(entry.name, 'Sealius');
});

test('the canonical footer remains exact and each scene is a copy', () => {
  assert.equal(CREDIT_SCENE_FOOTER, 'Made by SealiusHQ with a lot of support from Contributors');
  const a = creditSceneFor('eternal');
  const b = creditSceneFor('eternal');
  assert.equal(a.footer, CREDIT_SCENE_FOOTER);
  assert.notEqual(a.roles, b.roles);
  a.roles[0].name = 'Mutated';
  assert.equal(b.roles[0].name, 'Sealius');
  assert.equal(creditSceneFor('nope'), null);
});
