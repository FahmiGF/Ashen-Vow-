import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ROOMS } from '../src/core.js';
import {
  AI_PROFILES,
  AI_STATES,
  AI_TRANSITIONS,
  EnemyBrain,
  NavGraph,
  buildRoomNav,
  profileFor,
  segmentHitsRect,
} from '../src/ai_nav.js';

const floorRoom = {
  platforms: [
    { x: 0, y: 560, w: 1280, h: 40 },
    { x: 300, y: 440, w: 180, h: 18 },
  ],
};

const wallRoom = {
  platforms: [
    { x: 0, y: 560, w: 1280, h: 40 },
    { x: 620, y: 300, w: 40, h: 260 }, // solid wall from the floor upward
  ],
};

function makeEnemy(overrides = {}) {
  return {
    id: 'e1',
    type: 'crawler',
    ai: 'crawler',
    w: 46,
    h: 30,
    x: 900,
    y: 530,
    vx: 0,
    vy: 0,
    speed: 120,
    facing: -1,
    onGround: true,
    hp: 34,
    maxHp: 34,
    homeX: 900,
    minX: 40,
    maxX: 1240,
    aggroMul: 1,
    time: 0,
    state: 'patrol',
    ...overrides,
  };
}

const player = { x: 120, y: 514, w: 30, h: 46, facing: 1 };

test('the navigation graph samples platforms into typed edges', () => {
  const nav = buildRoomNav(floorRoom, { spacing: 40 });
  assert.ok(nav.nodes.length > 20);
  assert.ok(nav.edges.size === nav.nodes.length);
  const kinds = new Set();
  for (const list of nav.edges.values()) for (const edge of list) kinds.add(edge.kind);
  assert.ok(kinds.has('walk'));
  assert.ok(kinds.has('jump') || kinds.has('drop'));
});

test('A* finds a two-way route across a flat room', () => {
  const nav = buildRoomNav(floorRoom);
  const right = nav.path({ x: 120, y: 560 }, { x: 1180, y: 560 });
  assert.ok(right && right.path.length > 4);
  const back = nav.path({ x: 1180, y: 560 }, { x: 120, y: 560 });
  assert.ok(back && back.path.length > 4);
  // Reversing the route must not invent a cheaper fantasy path.
  assert.ok(Math.abs(right.cost - back.cost) < 0.001);
});

test('A* routes up onto a raised platform instead of through it', () => {
  const nav = buildRoomNav(floorRoom);
  const route = nav.path({ x: 120, y: 560 }, { x: 390, y: 440 });
  assert.ok(route, 'raised platform is reachable');
  assert.ok(route.kinds.includes('jump'), `expected a jump edge, got ${route.kinds.join(',')}`);
  assert.ok(route.waypoints.some((point) => point.y === 440));
});

test('line of sight is blocked by solid geometry but not by thin surfaces', () => {
  const nav = buildRoomNav(wallRoom);
  assert.equal(nav.lineOfSight(200, 500, 900, 500), false, 'wall blocks sight');
  assert.equal(nav.lineOfSight(200, 620, 400, 620), true, 'floor below nobody blocks');
  assert.equal(segmentHitsRect(0, 0, 100, 100, { x: 40, y: 40, w: 20, h: 20 }), true);
  assert.equal(segmentHitsRect(0, 0, 20, 20, { x: 40, y: 40, w: 20, h: 20 }), false);
});

test('an enemy follows its path and closes distance to a destination', () => {
  const nav = buildRoomNav(floorRoom);
  const enemy = makeEnemy({ x: 1120 });
  const brain = new EnemyBrain(enemy, { nav, seed: 3 });
  const dt = 1 / 60;
  let covered = Infinity;
  for (let frame = 0; frame < 900; frame += 1) {
    enemy.time += dt;
    const view = brain.update(dt, { player, enemies: [] });
    if (view.dir !== 0) enemy.x += view.dir * enemy.speed * view.speed * dt;
    covered = Math.min(covered, Math.abs(enemy.x + enemy.w / 2 - (player.x + 15)));
    if (covered < 25) break;
  }
  assert.ok(covered < 60, `enemy should approach the player, closest ${covered.toFixed(1)}px`);
  assert.ok(brain.transitions.length > 0);
  assert.ok(['chase', 'attack', 'detect', 'search', 'return'].includes(brain.state));
});

test('perception requires line of sight and forgets after memory expires', () => {
  const nav = buildRoomNav(wallRoom);
  const enemy = makeEnemy({ x: 300, y: 530 });
  const brain = new EnemyBrain(enemy, { nav, seed: 5 });
  const walledPlayer = { ...player, x: 900, y: 514 };
  brain.update(1 / 60, { player: walledPlayer, enemies: [] });
  assert.equal(brain.canSeePlayer(walledPlayer), false, 'the wall hides the player');

  const openPlayer = { ...player, x: 300, y: 514 };
  for (let i = 0; i < 40; i += 1) brain.update(1 / 60, { player: openPlayer, enemies: [] });
  assert.equal(brain.canSeePlayer(openPlayer), true);
  assert.ok(brain.lastKnown);

  // The player vanishes: the brain must search, then give up and return home.
  for (let i = 0; i < 60 * 8; i += 1) brain.update(1 / 60, { player: null, enemies: [] });
  assert.ok([AI_STATES.SEARCH, AI_STATES.RETURN, AI_STATES.PATROL].includes(brain.state));
});

test('losing the player ends combat instead of chasing forever', () => {
  const nav = buildRoomNav(floorRoom);
  const enemy = makeEnemy({ x: 400, y: 530 });
  const brain = new EnemyBrain(enemy, { nav, seed: 9 });
  for (let i = 0; i < 60; i += 1) brain.update(1 / 60, { player: { ...player, x: 380 }, enemies: [] });
  assert.ok(['chase', 'detect', 'attack'].includes(brain.state));
  const far = { ...player, x: 1240, y: 514 };
  brain.lastSeen = 999; // simulate the player leaving the encounter
  for (let i = 0; i < 60 * 12; i += 1) brain.update(1 / 60, { player: far, enemies: [] });
  assert.ok(!brain.isAggro(), 'awareness must decay once the target is gone');
  assert.equal(brain.path.length === 0 || !brain.reachable || brain.state !== AI_STATES.CHASE, true);
});

test('attacks never reach through a wall', () => {
  const nav = buildRoomNav(wallRoom);
  const enemy = makeEnemy({ x: 560, y: 530 });
  const brain = new EnemyBrain(enemy, { nav, seed: 11 });
  const behindWall = { x: 700, y: 514, w: 30, h: 46, facing: -1 };
  assert.equal(brain.inAttackRange(behindWall), false);
  const adjacent = { x: 570, y: 500, w: 30, h: 46 };
  assert.equal(brain.inAttackRange(adjacent), true);
});

test('stuck enemies recover with a deterministic unstick nudge', () => {
  const nav = buildRoomNav(floorRoom);
  const enemy = makeEnemy({ x: 640, y: 530 });
  const brain = new EnemyBrain(enemy, { nav, seed: 13 });
  // Force a chase decision, then ignore the movement intent: the brain must
  // notice zero progress and try to recover.
  let nudge = false;
  for (let i = 0; i < 240; i += 1) {
    const view = brain.update(1 / 60, { player: { ...player, x: 120 }, enemies: [] });
    if (view.stuck) nudge = true;
  }
  assert.ok(nudge, 'stuck detection must fire when the enemy cannot move');
  assert.ok(brain.stuckEvents > 0);
  assert.ok(brain.repaths > 0, 'recovery repaths');
});

test('separation keeps crowd members from overlapping', () => {
  const enemy = makeEnemy({ x: 600 });
  const brain = new EnemyBrain(enemy, { nav: buildRoomNav(floorRoom) });
  const pack = [
    { ...makeEnemy({ x: 612 }), id: 'e2' },
    { ...makeEnemy({ x: 622 }), id: 'e3' },
  ];
  const push = brain.separation([enemy, ...pack]);
  assert.notEqual(push, 0);
  assert.ok(Math.abs(push) <= 1);
});

test('every state transition used at runtime is legal', () => {
  const nav = buildRoomNav(floorRoom);
  const brain = new EnemyBrain(makeEnemy({ x: 800 }), { nav, seed: 17 });
  let target = { ...player, x: 700 };
  for (let i = 0; i < 600; i += 1) {
    brain.update(1 / 60, { player: target, enemies: [] });
    if (i === 200) target = null;
    if (i === 400) target = { ...player, x: 400 };
  }
  for (const transition of brain.transitions) {
    const allowed = AI_TRANSITIONS[transition.from] || [];
    assert.ok(
      allowed.includes(transition.to),
      `illegal transition ${transition.from} → ${transition.to}`,
    );
  }
});

test('profiles differentiate enemy families', () => {
  const ranged = profileFor({ type: 'wraith', ai: 'wraith' });
  const heavy = profileFor({ type: 'brute', ai: 'brute' });
  const assassin = profileFor({ type: 'stalker', ai: 'stalker' });
  const elite = profileFor({ type: 'echo_1_1', elite: true });
  assert.equal(ranged.kind, 'flyer');
  assert.ok(ranged.minRange > 100);
  assert.equal(heavy.kind, 'heavy');
  assert.ok(heavy.attackRange > AI_PROFILES.melee.attackRange);
  assert.equal(assassin.flank, true);
  assert.equal(elite.kind, 'elite');
});

test('brains reset cleanly between scenes', () => {
  const brain = new EnemyBrain(makeEnemy(), { nav: buildRoomNav(floorRoom) });
  brain.setState(AI_STATES.DETECT);
  brain.update(1 / 60, { player, enemies: [] });
  brain.reset(AI_STATES.IDLE);
  assert.equal(brain.state, AI_STATES.IDLE);
  assert.equal(brain.path.length, 0);
  assert.equal(brain.transitions.length, 0);
  assert.equal(brain.awareness, 0);
});

test('the room navigation graph covers every legacy room', () => {
  for (const room of ROOMS) {
    const nav = new NavGraph(room);
    assert.ok(nav.nodes.length > 0, `room ${room.name} must produce nav nodes`);
    const start = nav.nodes[0];
    const end = nav.nodes[nav.nodes.length - 1];
    const route = nav.path(start.id, end.id);
    assert.ok(route, `room ${room.name} should connect its first and last surface`);
  }
});

test('the debug snapshot exposes the fields the AI panel needs', () => {
  const brain = new EnemyBrain(makeEnemy(), { nav: buildRoomNav(floorRoom) });
  brain.update(1 / 60, { player, enemies: [] });
  const snap = brain.debugSnapshot();
  for (const key of ['id', 'state', 'aggro', 'target', 'pathLength', 'detectionRange', 'attackRange', 'stuckEvents', 'grounded']) {
    assert.ok(key in snap, `snapshot.${key} missing`);
  }
});
