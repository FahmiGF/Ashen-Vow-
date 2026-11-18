import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAdminService, totpCode, verifyTotp } from '../src/admin_server.js';

test('admin authentication, roles, moderation, reward verification, and audit persistence', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'ashen-admin-test-'));
  let now = 1_700_000_000_000;
  const service = createAdminService({
    dataDir: dir,
    bootstrapPassword: 'correct-horse-battery',
    clock: () => now,
    metrics: () => ({ status: 'healthy', requests: 12 }),
    log: () => {},
  });
  await service.ready;
  t.after(async () => {
    service.close();
    await rm(dir, { recursive: true, force: true });
  });

  const wrong = await service.login({ username: 'admin', password: 'nope' }, '10.0.0.1');
  assert.equal(wrong.status, 401);
  const login = await service.login({ username: 'admin', password: 'correct-horse-battery' }, '10.0.0.2');
  assert.equal(login.status, 200);
  assert.equal(login.body.user.role, 'super_admin');
  assert.ok(login.body.permissions.includes('roles.write'));
  assert.equal(login.body.nav.length, 16);
  const admin = service.state.users.find((user) => user.id === 'u_superadmin');
  assert.equal(service.hasPermission(admin, 'settings.write'), true);
  const analyst = { role: 'analyst', suspended: false, permissions: [] };
  assert.equal(service.hasPermission(analyst, 'overview.read'), true);
  assert.equal(service.hasPermission(analyst, 'players.moderate'), false);
  assert.equal(service.hasPermission({ ...analyst, suspended: true }, 'overview.read'), false);

  const player = service.registerPlayer({ name: 'Test Warden', classId: 'lyna' }, '10.0.1.1');
  assert.equal(player.status, 200);
  assert.ok(player.body.token);
  assert.equal(service.state.players[player.body.id].name, 'Test Warden');
  const authRequest = { headers: { authorization: `Bearer ${player.body.token}` } };
  const sync = service.syncPlayer(authRequest, {
    progress: { unlocked: 9, cleared: [true, true, true], astral: { arcId: 'astral', cleared: [true] }, realms: { totalRuns: 2, rewards: ['chrono_armor'] } },
  });
  assert.equal(sync.status, 200);
  assert.equal(service.state.players[player.body.id].progress.cleared, 3);
  assert.equal(service.state.players[player.body.id].progress.astralCleared, 1);

  assert.ok(service.state.audit.some((entry) => entry.action === 'admin.login'));
  service.audit(admin, 'player.note', player.body.id, 'Reviewed');
  service.state.players[player.body.id].status = 'suspended';
  service.state.players[player.body.id].moderation.push({ at: now, action: 'suspend', by: 'admin', reason: 'test' });
  service.touch();
  const blocked = service.syncPlayer(authRequest, { progress: {} });
  assert.equal(blocked.status, 403);
  service.state.players[player.body.id].status = 'active';

  const run = service.registerRun({ modeId: 'riftfall', seed: 77, difficulty: 'normal', classId: 'sera' }, '10.0.2.1');
  assert.equal(run.status, 200);
  now += 9000;
  const payload = {
    runId: run.body.runId, modeId: 'riftfall', seed: 77, difficulty: 'normal',
    score: 2500, time: 70, result: 'victory', completed: true,
    waves: 10, relics: 0, keys: 0, anchors: 0, perfects: 0, objectives: [],
  };
  const claim = service.claimRun(payload, '10.0.2.1', service.state.players[player.body.id]);
  assert.equal(claim.status, 200);
  assert.equal(claim.body.reward.id, 'riftbound_armor');
  assert.equal(claim.body.claim.verified, true);
  const again = service.claimRun(payload, '10.0.2.1', null);
  assert.equal(again.status, 400);
  assert.equal(again.body.error, 'already_claimed');
  const forged = service.registerRun({ modeId: 'riftfall', seed: 78 }, '10.0.3.1');
  now += 9000;
  const forgedClaim = service.claimRun({ ...payload, runId: forged.body.runId, score: 1 }, '10.0.3.1', null);
  assert.equal(forgedClaim.status, 400);
  assert.equal(forgedClaim.body.error, 'score_too_low');

  const validation = service.contentValidation();
  assert.equal(validation.ok, true);
  assert.equal(validation.astral.count, 20);
  const event = service.validEvent({ name: 'Astral Rift Event', startAt: now, endAt: now + 86400000, status: 'active', rewards: ['skin_riftbound_armor'] });
  assert.ok(event.value.id);
  service.state.events.push(event.value);

  const secret = 'JBSWY3DPEHPK3PXP';
  assert.equal(verifyTotp(secret, totpCode(secret, now), now), true);
  assert.equal(verifyTotp(secret, '000000', now), false);
  const withMfa = {
    id: 'u_mfa', username: 'mfa-admin', displayName: 'MFA Admin', role: 'analyst',
    permissions: [], password: service.hashPassword('mfa-password'), createdAt: now,
    lastLoginAt: 0, suspended: false, totp: secret,
  };
  service.state.users.push(withMfa);
  const withoutCode = await service.login({ username: 'mfa-admin', password: 'mfa-password' }, '10.0.4.1');
  assert.equal(withoutCode.status, 401);
  assert.equal(withoutCode.body.mfa, true);
  const withCode = await service.login({ username: 'mfa-admin', password: 'mfa-password', totp: totpCode(secret, now) }, '10.0.4.2');
  assert.equal(withCode.status, 200);

  await service.persist(true);
  const reloaded = createAdminService({ dataDir: dir, bootstrapPassword: 'correct-horse-battery', clock: () => now, log: () => {} });
  await reloaded.ready;
  assert.equal(reloaded.state.players[player.body.id].name, 'Test Warden');
  assert.equal(reloaded.state.rewards.claims.length, 1);
  assert.ok(reloaded.state.audit.some((entry) => entry.action === 'reward.claim_verified'));
  assert.ok(reloaded.state.audit.some((entry) => entry.action === 'player.note'));
  assert.ok(reloaded.state.events.some((entry) => entry.name === 'Astral Rift Event'));
  reloaded.close();
});
