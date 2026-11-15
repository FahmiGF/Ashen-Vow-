import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COOP_MODES,
  COOP_MAX_PLAYERS,
  PARTY_SCALING,
  partyScaling,
  scaledEncounter,
  REVIVE_RULES,
  createPartyState,
  applyPartyDamage,
  tickParty,
  createLobby,
  joinLobby,
  setReady,
  setPartyLeader,
  canStartLobby,
  startLobby,
  sanitizePlayerName,
  roomCodeFromSeed,
  hashPassword,
  encodeSnapshot,
  decodeSnapshot,
  encodeDelta,
  applyDelta,
  filterByInterest,
  SnapshotInterpolator,
  interpolateSnapshots,
  validateMovement,
  createRateLimiter,
  allocateLoot,
  claimReward,
  CoopSession,
  createMemoryTransportPair,
  CoopClient,
  coopSocketUrl,
  sanitizeRoomCode,
  COOP_TICK_HZ,
} from '../src/coop.js';

function sampleState(t = 1) {
  return {
    t,
    players: [{ slot: 1, x: 320.25, y: 411.5, hp: 92, maxHp: 120, stateCode: 1, facing: 1 }],
    enemies: [
      { slot: 10, x: 600, y: 430, hp: 34, maxHp: 34, stateCode: 0, facing: -1 },
      { slot: 11, x: 900, y: 430, hp: 60, maxHp: 60, stateCode: 2, facing: -1 },
    ],
    boss: { slot: 99, x: 760, y: 300, hp: 500, maxHp: 720, stateCode: 5, facing: -1 },
    projectiles: [{ x: 410, y: 300, typeCode: 2 }],
    wave: { index: 2, total: 4, kindCode: 1 },
  };
}

test('co-op modes, party scaling, and encounter scaling are wired', () => {
  assert.equal(COOP_MODES.length, 8);
  assert.equal(COOP_MAX_PLAYERS, 4);
  assert.equal(PARTY_SCALING.length, 4);
  assert.deepEqual(partyScaling(1), PARTY_SCALING[0]);
  assert.equal(partyScaling(2).hp, 1.65);
  assert.equal(partyScaling(99).size, 4);
  const scaled = scaledEncounter(
    {
      enemies: [{ hpScale: 1, dmgScale: 1 }],
      boss: { overrides: { maxHp: 1000, contact: 20 } },
    },
    4,
  );
  assert.equal(scaled.enemies[0].hpScale, 2.8);
  assert.equal(scaled.enemies[0].dmgScale, 1.35);
  assert.equal(scaled.boss.overrides.maxHp, 2800);
  assert.ok(COOP_TICK_HZ >= 15 && COOP_TICK_HZ <= 30);
});

test('lobby creation, passwords, capacity, ready checks, and leader transfer', () => {
  const lobby = createLobby({ hostName: 'Sera', classId: 'sera', seed: 98765, modeId: 'labyrinth', password: 'oath' });
  assert.equal(lobby.players.length, 1);
  assert.equal(lobby.players[0].host, true);
  assert.equal(lobby.code.length, 5);
  assert.match(lobby.code, /^[A-Z2-9]+$/);
  const wrong = joinLobby(lobby, { name: 'Kael', password: 'wrong' });
  assert.equal(wrong.ok, false);
  const guest = joinLobby(lobby, { name: 'Kael', password: 'oath', classId: 'kael' });
  assert.ok(guest.ok);
  assert.equal(guest.player.id, 'p2');
  assert.equal(canStartLobby(guest.lobby).ok, false, 'guest not ready');
  const ready = setReady(guest.lobby, 'p2', true);
  assert.ok(canStartLobby(ready).ok);
  const started = startLobby(ready);
  assert.ok(started.ok && started.lobby.started);
  assert.equal(startLobby(started.lobby).ok, false);

  let full = lobby;
  for (let i = 0; i < 4; i += 1) {
    const joined = joinLobby(full, { name: `P${i}`, password: 'oath' });
    if (joined.ok) full = joined.lobby;
  }
  assert.equal(full.players.length, 4);
  assert.equal(joinLobby(full, { name: 'Late', password: 'oath' }).ok, false);
  const transferred = setPartyLeader(full, 'p3');
  assert.equal(transferred.players.find((p) => p.id === 'p3').leader, true);
  assert.equal(transferred.players.find((p) => p.id === 'p1').leader, false);
  assert.equal(sanitizePlayerName('<script>Ash</script>'), 'scriptAshscript');
  assert.equal(hashPassword('oath'), hashPassword('oath'));
  assert.notEqual(roomCodeFromSeed(1), '');
});

test('downed, bleedout, team lives, helpers, and wipes resolve once', () => {
  const lobby = createLobby({ hostName: 'A', seed: 1 });
  const joined = joinLobby(lobby, { name: 'B' });
  const party = createPartyState(joined.lobby);
  assert.equal(Object.keys(party.players).length, 2);
  const hit = applyPartyDamage(party, 'p1', 999);
  assert.equal(hit.downed, true);
  assert.equal(hit.wiped, false);
  let result;
  const revivedIds = [];
  for (let i = 0; i < 60; i += 1) {
    result = tickParty(party, 0.1, { p2: { target: 'p1', active: true } });
    revivedIds.push(...result.revived);
  }
  assert.ok(revivedIds.includes('p1'));
  assert.equal(party.players.p1.downed, false);
  assert.equal(party.players.p1.hp, Math.round(party.players.p1.maxHp * REVIVE_RULES.reviveHp));
  assert.ok(party.players.p2.contribution > 0);

  // No helper: bleedout consumes a team life, then the next down wipes.
  applyPartyDamage(party, 'p2', 999);
  for (let i = 0; i < 300; i += 1) result = tickParty(party, 0.1, {});
  assert.equal(party.players.p2.alive, true, 'team life revived p2 once');
  party.teamLives = 0;
  applyPartyDamage(party, 'p2', 999);
  for (let i = 0; i < 300; i += 1) result = tickParty(party, 0.1, {});
  assert.equal(party.players.p2.alive, false);
  assert.equal(result.wiped, true);
});

test('snapshot codec quantizes without losing gameplay state and deltas reconstruct', () => {
  const state = sampleState(1);
  const key = encodeSnapshot(state);
  const decoded = decodeSnapshot(key);
  assert.ok(Math.abs(decoded.players[0].x - 320.25) < 0.13);
  assert.equal(decoded.players[0].hp, 92);
  assert.equal(decoded.players[0].id, '', 'legacy snapshots without ids still decode');
  assert.equal(decoded.enemies.length, 2);
  assert.equal(decoded.boss.maxHp, 720);
  assert.equal(decoded.wave.index, 2);

  const next = sampleState(1.1);
  next.enemies[0].x = 640;
  next.enemies[0].hp = 20;
  next.enemies.pop();
  next.players[0].x = 340;
  const delta = encodeDelta(decoded, next);
  assert.equal(delta.k, 0);
  assert.ok(JSON.stringify(delta).length < JSON.stringify(encodeSnapshot(next)).length);
  assert.deepEqual(delta.x, [11]);
  const merged = applyDelta(decoded, delta);
  assert.equal(merged.enemies.length, 1);
  assert.ok(Math.abs(merged.enemies[0].x - 640) < 0.13);
  assert.ok(Math.abs(merged.players[0].x - 340) < 0.13);
  assert.equal(merged.players[0].hp, 92);

  const keyframe = encodeDelta(null, next);
  assert.equal(keyframe.k, 1);

  const bossGone = { ...next, boss: null };
  const bossDelta = encodeDelta(decoded, bossGone);
  assert.equal(bossDelta.br, 1);
  assert.equal(applyDelta(decoded, bossDelta).boss, null, 'boss removal must not resurrect the old boss');

  const partyState = { ...next, players: [{ ...next.players[0] }, { ...next.players[0], slot: 2, id: 'p2', x: 700 }] };
  const partyDelta = encodeDelta(merged, partyState);
  assert.equal(partyDelta.p.length, 1, 'only the changed ally is sent');
  const withAlly = applyDelta(merged, partyDelta);
  assert.equal(withAlly.players.find((player) => player.slot === 2)?.x, 700);
  const removedAlly = { ...partyState, players: [partyState.players[0]] };
  assert.equal(applyDelta(withAlly, encodeDelta(partyState, removedAlly)).players.length, 1);
});

test('interest management filters far enemies but keeps players and boss', () => {
  const state = sampleState(1);
  state.enemies.push({ slot: 12, x: 4000, y: 430, hp: 10, maxHp: 10, stateCode: 0, facing: 1 });
  const filtered = filterByInterest(state, 500, 430, 500);
  assert.equal(filtered.enemies.length, 2);
  assert.equal(filtered.boss.slot, 99);
  assert.equal(filtered.players.length, 1);
});

test('snapshot interpolation samples between two frames with a render delay', () => {
  const a = { ...sampleState(1), enemies: [{ slot: 1, x: 0, y: 0, hp: 10, maxHp: 10, stateCode: 0, facing: 1 }], players: [{ slot: 1, x: 0, y: 0, hp: 10, maxHp: 10 }] };
  const b = { ...sampleState(2), enemies: [{ slot: 1, x: 100, y: 50, hp: 10, maxHp: 10, stateCode: 0, facing: 1 }], players: [{ slot: 1, x: 100, y: 50, hp: 10, maxHp: 10 }] };
  const interp = new SnapshotInterpolator({ delay: 0.1 });
  interp.push(a);
  interp.push(b);
  const sampled = interp.sample(1550);
  assert.ok(sampled.enemies[0].x > 0 && sampled.enemies[0].x < 100);
  assert.ok(sampled.players[0].y > 0 && sampled.players[0].y < 50);
  const midpoint = interpolateSnapshots(a, b, 0.5);
  assert.equal(Math.round(midpoint.enemies[0].x), 50);
  assert.equal(interp.sample(0).enemies.length, 1);
});

test('movement validation rejects teleports and rate limiting is bounded', () => {
  assert.equal(validateMovement({ x: 0, y: 0 }, { x: 10, y: 0 }, 1 / 20), true);
  assert.equal(validateMovement({ x: 0, y: 0 }, { x: 5000, y: 0 }, 1 / 20), false);
  let now = 0;
  const limiter = createRateLimiter({ tokens: 3, refillPerSecond: 1, now: () => now });
  assert.ok(limiter.take('p1'));
  assert.ok(limiter.take('p1'));
  assert.ok(limiter.take('p1'));
  assert.equal(limiter.take('p1'), false);
  now = 1000;
  assert.ok(limiter.take('p1'));
  limiter.reset();
  assert.ok(limiter.take('p1'));
});

test('personal loot is fair, unique, and claim-checked', () => {
  const players = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }];
  const rewards = [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }, { id: 'r4' }];
  const split = allocateLoot(players, rewards, { cursor: 1 });
  assert.equal(split.length, 4);
  assert.equal(split[0].owner, 'p2');
  assert.equal(split[1].owner, 'p3');
  assert.equal(new Set(split.map((entry) => entry.owner)).size, 3);
  let state = { claimed: [], cursor: 0 };
  const first = claimReward(state, 'r1', 'p1');
  assert.ok(first.ok);
  state = first.state;
  assert.equal(claimReward(state, 'r1', 'p2').ok, false);
  const deduped = allocateLoot(players, rewards, state);
  assert.ok(!deduped.some((entry) => entry.reward.id === 'r1'));
});

test('session registry enforces capacity, input ordering, reconnection, and lobby view', () => {
  const lobby = createLobby({ hostName: 'Host', seed: 44 });
  const session = new CoopSession({ lobby, now: () => 1000 });
  assert.ok(session.registerPeer({ name: 'Host', classId: 'sera', token: 't1' }).ok);
  for (let i = 0; i < 3; i += 1) assert.ok(session.registerPeer({ name: `P${i}`, token: `t${i + 2}` }).ok);
  assert.equal(session.registerPeer({ name: 'Fifth' }).ok, false);
  assert.ok(session.receiveInput('p1', { seq: 1, right: true, jump: true }).ok);
  assert.equal(session.receiveInput('p1', { seq: 1, right: false }).error, 'stale');
  assert.ok(session.receiveInput('p1', { seq: 2, right: false }).ok);
  assert.equal(session.receiveInput('p1', { seq: 1, right: true }).error, 'stale');
  assert.deepEqual(session.inputFor('p1'), { left: false, right: false, jump: false, attack: false, dash: false, interact: false, special: false });
  session.disconnect('p2');
  assert.equal(session.reconnect('t3').ok, true);
  assert.equal(session.reconnect('bad').ok, false);
  assert.equal(session.lobbyView().players.length, 4);
  const snapshot = session.snapshotFor('p1', sampleState(1));
  assert.ok(snapshot);
  const decoded = applyDelta(null, snapshot);
  assert.equal(decoded.players.length, 1);
  assert.equal(snapshot.s.peers, 4);

  const identified = { ...sampleState(1), players: [{ ...sampleState(1).players[0], id: 'p2' }] };
  const identifiedSnapshot = encodeSnapshot(identified);
  assert.equal(decodeSnapshot(identifiedSnapshot).players[0].id, 'p2');
  assert.equal(applyDelta(null, identifiedSnapshot).players[0].id, 'p2');
});

test('memory transport and CoopClient exchange join and snapshots', () => {
  const [clientEnd, serverEnd] = createMemoryTransportPair();
  const client = new CoopClient({ transport: clientEnd, name: 'Lyna', classId: 'lyna', lobbyCode: 'abc-123' });
  const received = [];
  serverEnd.onMessage((message) => {
    received.push(message);
    if (message.type === 'join') {
      serverEnd.send({ type: 'welcome', token: 'tok', lobby: { code: 'ABCDE' } });
      serverEnd.send({ type: 'snapshot', delta: encodeSnapshot(sampleState(1)) });
    }
  });
  client.join('oath');
  assert.equal(received[0].type, 'join');
  assert.equal(received[0].room, 'ABC123');
  assert.equal(received[0].classId, 'lyna');
  assert.equal(client.connected, true);
  assert.ok(client.latest.enemies.length >= 2);
  client.sendInput({ right: true }, 1000);
  assert.equal(received.filter((message) => message.type === 'input').length, 1);
  client.sendInput({ right: false }, 1000);
  assert.equal(received.filter((message) => message.type === 'input').length, 1, 'cadence gate');
  assert.equal(sanitizeRoomCode(' ab-c 12 '), 'ABC12');
  assert.equal(sanitizeRoomCode(''), 'LOBBY');
  assert.match(coopSocketUrl('http://127.0.0.1:4300', 'ABCDE'), /^ws:\/\/127\.0\.0\.1:4300\/ws\?room=ABCDE$/);
});
