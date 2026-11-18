// Ashen Vow — Admin Control Center backend
// Zero-dependency authentication, role permissions, audit logging, player
// directory, live-ops configuration, server monitoring and reward validation.
//
// Security model:
//   • passwords are scrypt hashed, sessions are random 256-bit cookies stored
//     server-side as SHA-256 hashes and never exposed to JavaScript (HttpOnly)
//   • every mutating admin request requires the session CSRF token
//   • every admin API independently checks a server-side permission
//   • login and reward endpoints are rate limited; bodies are size capped
//   • optional TOTP MFA for privileged accounts
//   • audit entries are append-only and persisted atomically
import { createHash, createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { validateAstralRooms } from './astral.js';
import { REALM_MODES, REALM_MODE_BY_ID, realmsClaimEligibility } from './realms.js';
import { CHARACTERS, ALL_ROOMS, ALL_ENEMY_INFO, ALL_BOSS_INFO } from './core.js';

export const ADMIN_VERSION = '1.0.0';
export const ADMIN_PERMISSIONS = [
  'overview.read',
  'players.read',
  'players.moderate',
  'campaign.read',
  'campaign.write',
  'modes.read',
  'modes.write',
  'classes.read',
  'classes.write',
  'enemies.read',
  'enemies.write',
  'bosses.read',
  'bosses.write',
  'economy.read',
  'economy.write',
  'events.read',
  'events.write',
  'stage_access.use',
  'reports.read',
  'reports.write',
  'announcements.write',
  'analytics.read',
  'server.read',
  'audit.read',
  'roles.write',
  'settings.write',
];

export const ADMIN_ROLES = {
  super_admin: {
    name: 'Super Admin',
    desc: 'Full platform administration.',
    permissions: ADMIN_PERMISSIONS,
  },
  game_admin: {
    name: 'Game Admin',
    desc: 'Campaign and game configuration.',
    permissions: ['overview.read', 'players.read', 'campaign.read', 'campaign.write', 'modes.read', 'modes.write', 'classes.read', 'classes.write', 'enemies.read', 'enemies.write', 'bosses.read', 'bosses.write', 'events.read', 'stage_access.use', 'analytics.read', 'server.read', 'audit.read'],
  },
  content_manager: {
    name: 'Content Manager',
    desc: 'Arcs, stages, enemies, bosses, items and events.',
    permissions: ['overview.read', 'campaign.read', 'campaign.write', 'modes.read', 'modes.write', 'classes.read', 'classes.write', 'enemies.read', 'enemies.write', 'bosses.read', 'bosses.write', 'economy.read', 'economy.write', 'events.read', 'events.write', 'stage_access.use'],
  },
  moderator: {
    name: 'Moderator',
    desc: 'Reports and player moderation.',
    permissions: ['overview.read', 'players.read', 'players.moderate', 'reports.read', 'reports.write', 'audit.read'],
  },
  event_manager: {
    name: 'Event Manager',
    desc: 'Live events and announcements.',
    permissions: ['overview.read', 'events.read', 'events.write', 'announcements.write', 'server.read'],
  },
  analyst: {
    name: 'Analyst',
    desc: 'Read-only analytics and monitoring.',
    permissions: ['overview.read', 'analytics.read', 'server.read', 'players.read', 'campaign.read', 'modes.read', 'economy.read'],
  },
  developer: {
    name: 'Developer',
    desc: 'Authorized testing tools and isolated debug sessions.',
    permissions: ['overview.read', 'campaign.read', 'modes.read', 'stage_access.use', 'server.read', 'audit.read'],
  },
};

export const ADMIN_NAV = [
  { id: 'overview', label: 'Overview', icon: '▦', permission: 'overview.read' },
  { id: 'players', label: 'Player Management', icon: '♟', permission: 'players.read' },
  { id: 'campaign', label: 'Campaign Manager', icon: '⌘', permission: 'campaign.read' },
  { id: 'modes', label: 'Game Modes', icon: '◈', permission: 'modes.read' },
  { id: 'classes', label: 'Classes Manager', icon: '⚔', permission: 'classes.read' },
  { id: 'enemies', label: 'Enemy Manager', icon: '☠', permission: 'enemies.read' },
  { id: 'bosses', label: 'Boss Manager', icon: '♛', permission: 'bosses.read' },
  { id: 'economy', label: 'Item & Economy', icon: '◉', permission: 'economy.read' },
  { id: 'events', label: 'Event Manager', icon: '✦', permission: 'events.read' },
  { id: 'stage', label: 'Stage Access', icon: '⌖', permission: 'stage_access.use' },
  { id: 'reports', label: 'Reports', icon: '⚑', permission: 'reports.read' },
  { id: 'announcements', label: 'Announcements', icon: '✎', permission: 'announcements.write' },
  { id: 'analytics', label: 'Analytics', icon: '◔', permission: 'analytics.read' },
  { id: 'monitor', label: 'Server Monitor', icon: '▤', permission: 'server.read' },
  { id: 'audit', label: 'Audit Logs', icon: '⟳', permission: 'audit.read' },
  { id: 'settings', label: 'Settings', icon: '⚙', permission: 'settings.write' },
];

const SESSION_TTL = 1000 * 60 * 60 * 2;
const LOGIN_WINDOW = 1000 * 60 * 10;
const LOGIN_LIMIT = 6;
const BODY_LIMIT = 64 * 1024;
const MAX_AUDIT = 3000;
const MAX_PLAYERS = 5000;

const nowMs = () => Date.now();
const sha = (value) => createHash('sha256').update(String(value)).digest('hex');
const safeInt = (value, fallback = 0, min = 0, max = 1e12) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const text = (value, max = 120) => String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const parseCookies = (header) => {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    out[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return out;
};

// ── TOTP (RFC 6238) ─────────────────────────────────────────────────────────
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32Decode(input) {
  const clean = String(input || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out = [];
  for (const char of clean) {
    value = (value << 5) | B32.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function totpCode(secret, at = Date.now(), step = 30) {
  const key = base32Decode(secret);
  if (!key.length) return '';
  const counter = Math.floor(at / 1000 / step);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0xf;
  const binary = ((digest[offset] & 0x7f) << 24)
    | ((digest[offset + 1] & 0xff) << 16)
    | ((digest[offset + 2] & 0xff) << 8)
    | (digest[offset + 3] & 0xff);
  return String(binary % 1000000).padStart(6, '0');
}

export function verifyTotp(secret, code, at = Date.now()) {
  const supplied = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(supplied)) return false;
  for (const drift of [-1, 0, 1]) {
    const expected = totpCode(secret, at + drift * 30000);
    if (expected.length === supplied.length && timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) return true;
  }
  return false;
}

// ── service ────────────────────────────────────────────────────────────────
export class AdminService {
  constructor(options = {}) {
    this.dataDir = options.dataDir || join(process.cwd(), 'data');
    this.statePath = join(this.dataDir, 'admin-state.json');
    this.log = options.log || ((...args) => console.log(...args));
    this.env = options.env || process.env;
    this.metrics = options.metrics || (() => ({}));
    this.clock = options.clock || nowMs;
    this.sessions = new Map();
    this.loginHits = new Map();
    this.claimRuns = new Map();
    this.state = null;
    this.ready = null;
    this._dirty = false;
    this._writing = null;
    this.bootstrapPassword = null;
    this._bootstrapOverride = options.bootstrapPassword ? String(options.bootstrapPassword) : null;
    this.ready = this.init();
  }

  async init() {
    await mkdir(this.dataDir, { recursive: true });
    let loaded = null;
    try {
      loaded = JSON.parse(await readFile(this.statePath, 'utf8'));
    } catch {
      loaded = null;
    }
    this.state = this.sanitizeState(loaded);
    if (!this.state.users.length) {
      const configuredPassword = this._bootstrapOverride || String(this.env.ASHEN_ADMIN_PASSWORD || '');
      const password = configuredPassword || randomBytes(9).toString('base64url');
      this.bootstrapPassword = configuredPassword ? null : password;
      const username = text(this.env.ASHEN_ADMIN_USER || 'admin', 32) || 'admin';
      this.state.users.push({
        id: 'u_superadmin',
        username,
        displayName: 'Super Admin',
        role: 'super_admin',
        permissions: [],
        password: this.hashPassword(password),
        createdAt: this.clock(),
        lastLoginAt: 0,
        suspended: false,
        totp: String(this.env.ASHEN_ADMIN_TOTP || ''),
      });
      if (this.bootstrapPassword) {
        this.log(`[admin] bootstrap account "${username}" created. Password: ${password}`);
        this.log('[admin] set ASHEN_ADMIN_PASSWORD before public deployment.');
      }
      await this.persist(true);
    } else if (this.env.ASHEN_ADMIN_PASSWORD) {
      // Environment credentials are authoritative for the built-in super admin.
      const user = this.state.users.find((entry) => entry.id === 'u_superadmin');
      if (user && !this.verifyPassword(this.env.ASHEN_ADMIN_PASSWORD, user.password)) {
        user.password = this.hashPassword(this.env.ASHEN_ADMIN_PASSWORD);
        await this.persist(true);
      }
    }
    return this;
  }

  sanitizeState(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const users = Array.isArray(source.users) ? source.users
      .filter((user) => user && typeof user.id === 'string' && typeof user.password === 'string')
      .slice(0, 200)
      .map((user) => ({
        id: text(user.id, 40),
        username: text(user.username, 32),
        displayName: text(user.displayName, 48) || text(user.username, 32),
        role: ADMIN_ROLES[user.role] ? user.role : 'analyst',
        permissions: Array.isArray(user.permissions) ? user.permissions.filter((permission) => ADMIN_PERMISSIONS.includes(permission)) : [],
        password: String(user.password).slice(0, 256),
        createdAt: safeInt(user.createdAt),
        lastLoginAt: safeInt(user.lastLoginAt),
        suspended: user.suspended === true,
        totp: text(user.totp, 64),
      })) : [];
    const players = source.players && typeof source.players === 'object' ? source.players : {};
    return {
      version: 1,
      users,
      roles: Object.fromEntries(Object.entries(ADMIN_ROLES).map(([id, role]) => {
        const custom = source.roles?.[id];
        return [id, {
          ...role,
          permissions: Array.isArray(custom?.permissions)
            ? custom.permissions.filter((permission) => ADMIN_PERMISSIONS.includes(permission))
            : [...role.permissions],
        }];
      })),
      players: Object.fromEntries(Object.entries(players).slice(0, MAX_PLAYERS).map(([id, player]) => [id, {
        id,
        name: text(player?.name, 32) || 'Unnamed',
        classId: text(player?.classId, 24) || 'sera',
        tokenHash: String(player?.tokenHash || ''),
        createdAt: safeInt(player?.createdAt),
        lastSeen: safeInt(player?.lastSeen),
        status: player?.status === 'suspended' ? 'suspended' : 'active',
        moderation: Array.isArray(player?.moderation) ? player.moderation.slice(-20) : [],
        notes: text(player?.notes, 500),
        progress: player?.progress && typeof player.progress === 'object' ? player.progress : {},
      }])),
      reports: Array.isArray(source.reports) ? source.reports.slice(-500) : [],
      audit: Array.isArray(source.audit) ? source.audit.slice(-MAX_AUDIT) : [],
      events: Array.isArray(source.events) ? source.events.slice(-100) : [],
      announcements: Array.isArray(source.announcements) ? source.announcements.slice(-100) : [],
      economy: source.economy && typeof source.economy === 'object' ? source.economy : {
        currencies: [
          { id: 'ash', name: 'Ash', symbol: '✦', tradeable: false },
          { id: 'echo', name: 'Echo', symbol: '◈', tradeable: false },
          { id: 'sigil', name: 'Sigil', symbol: '✧', tradeable: false },
        ],
        items: [
          { id: 'pike', name: 'Pike Penjaga', price: 35, rarity: 'common', enabled: true },
          { id: 'bow', name: 'Busur Abu', price: 55, rarity: 'rare', enabled: true },
          { id: 'shuriken', name: 'Shuriken ×3', price: 14, rarity: 'common', enabled: true },
        ],
        crafting: [],
        dropTables: [
          { id: 'boss_default', name: 'Boss reward table', rolls: 2, entries: [{ id: 'ash', weight: 70 }, { id: 'relic', weight: 30 }] },
        ],
        flags: { doubleRewards: false, maintenanceRewards: false },
      },
      content: source.content && typeof source.content === 'object' ? source.content : {
        arcs: [],
        overrides: {},
        drafts: [],
        published: [],
        scheduled: [],
      },
      settings: source.settings && typeof source.settings === 'object' ? source.settings : {
        maintenance: false,
        maintenanceMessage: 'Ashen Vow sedang dalam pemeliharaan. Sesi yang ada akan diselesaikan dengan tenang.',
        registrationOpen: true,
        matchmakingOpen: true,
        eventSubmissions: true,
        maxSessions: 500,
        announcement: '',
        backups: [],
      },
      rewards: source.rewards && typeof source.rewards === 'object' ? source.rewards : { claims: [], rejected: [], runs: [] },
      createdAt: safeInt(source.createdAt) || this.clock(),
      updatedAt: this.clock(),
    };
  }

  hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    return `scrypt$${salt}$${scryptSync(String(password), salt, 64).toString('hex')}`;
  }

  verifyPassword(password, stored) {
    try {
      const [kind, salt, hash] = String(stored).split('$');
      if (kind !== 'scrypt' || !salt || !hash) return false;
      const expected = Buffer.from(hash, 'hex');
      const actual = scryptSync(String(password), salt, expected.length);
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    } catch {
      return false;
    }
  }

  async persist(force = false) {
    if (!force && !this._dirty) return;
    this._dirty = false;
    this.state.updatedAt = this.clock();
    const temporary = `${this.statePath}.tmp`;
    const body = JSON.stringify(this.state, null, 2);
    this._writing = writeFile(temporary, body, 'utf8')
      .then(() => rename(temporary, this.statePath))
      .catch((error) => this.log('[admin] persist failed', error.message));
    await this._writing;
  }

  touch() {
    this._dirty = true;
    queueMicrotask(() => this.persist());
  }

  userPermissions(user) {
    if (!user) return [];
    const role = this.state.roles[user.role] || ADMIN_ROLES[user.role];
    return [...new Set([...(role?.permissions || []), ...(user.permissions || [])])].filter((permission) => ADMIN_PERMISSIONS.includes(permission));
  }

  hasPermission(user, permission) {
    if (!user || user.suspended) return false;
    if (user.role === 'super_admin') return true;
    return this.userPermissions(user).includes(permission);
  }

  audit(user, action, target = '', details = '', reason = '') {
    const entry = {
      id: randomUUID(),
      at: this.clock(),
      actorId: user?.id || 'anonymous',
      actor: user?.username || 'anonymous',
      role: user?.role || 'none',
      action: text(action, 80),
      target: text(target, 120),
      details: text(details, 500),
      reason: text(reason, 240),
      ip: text(this.currentIp || '', 64),
    };
    this.state.audit.push(entry);
    if (this.state.audit.length > MAX_AUDIT) this.state.audit.splice(0, this.state.audit.length - MAX_AUDIT);
    this.touch();
    return entry;
  }

  rateLimited(ip, bucket = 'login') {
    const now = this.clock();
    const key = `${bucket}:${ip}`;
    let hit = this.loginHits.get(key);
    if (!hit || now - hit.at > LOGIN_WINDOW) {
      hit = { at: now, count: 0 };
      this.loginHits.set(key, hit);
    }
    hit.count += 1;
    if (this.loginHits.size > 2000) this.loginHits.clear();
    return hit.count > LOGIN_LIMIT;
  }

  createSession(user, ip) {
    const token = randomBytes(32).toString('base64url');
    const csrf = randomBytes(24).toString('base64url');
    this.sessions.set(sha(token), {
      tokenHash: sha(token),
      userId: user.id,
      csrf,
      ip,
      createdAt: this.clock(),
      expiresAt: this.clock() + SESSION_TTL,
      lastSeen: this.clock(),
    });
    user.lastLoginAt = this.clock();
    this.touch();
    return { token, csrf };
  }

  sessionFrom(req) {
    const token = parseCookies(req.headers.cookie).ashen_admin;
    if (!token) return null;
    const session = this.sessions.get(sha(token));
    if (!session) return null;
    if (session.expiresAt <= this.clock()) {
      this.sessions.delete(session.tokenHash);
      return null;
    }
    const user = this.state.users.find((entry) => entry.id === session.userId);
    if (!user || user.suspended) return null;
    session.lastSeen = this.clock();
    return { session, user, token };
  }

  async login(body, ip) {
    if (this.rateLimited(ip)) return { status: 429, body: { error: 'Terlalu banyak percobaan. Coba lagi nanti.' } };
    const username = text(body.username, 32);
    const password = String(body.password || '');
    const user = this.state.users.find((entry) => entry.username.toLowerCase() === username.toLowerCase());
    if (!user || !this.verifyPassword(password, user.password)) {
      this.audit(null, 'admin.login_failed', username, 'Invalid credentials');
      return { status: 401, body: { error: 'Username atau password salah.' } };
    }
    if (user.suspended) return { status: 403, body: { error: 'Akun administratif ditangguhkan.' } };
    const mfaSecret = user.totp || String(this.env.ASHEN_ADMIN_TOTP || '');
    if (mfaSecret && !verifyTotp(mfaSecret, body.totp, this.clock())) {
      this.audit(user, 'admin.mfa_failed', user.username, 'TOTP rejected');
      return { status: 401, body: { error: 'Kode MFA tidak valid.', mfa: true } };
    }
    const { token, csrf } = this.createSession(user, ip);
    this.audit(user, 'admin.login', user.username, 'Administrative session opened');
    await this.persist(true);
    return {
      status: 200,
      cookie: this.cookie(token),
      body: { ok: true, csrf, user: this.publicUser(user), permissions: this.userPermissions(user), nav: ADMIN_NAV },
    };
  }

  cookie(token, clear = false) {
    return `ashen_admin=${encodeURIComponent(clear ? '' : token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear ? 0 : Math.floor(SESSION_TTL / 1000)}${this.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
  }

  publicUser(user) {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      roleName: this.state.roles[user.role]?.name || user.role,
      permissions: this.userPermissions(user),
      mfa: !!(user.totp || this.env.ASHEN_ADMIN_TOTP),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      suspended: user.suspended,
    };
  }

  playerSummary(player) {
    return {
      id: player.id,
      name: player.name,
      classId: player.classId,
      createdAt: player.createdAt,
      lastSeen: player.lastSeen,
      status: player.status,
      notes: player.notes,
      moderation: player.moderation.slice(-10),
      progress: player.progress,
    };
  }

  overview() {
    const players = Object.values(this.state.players);
    const metrics = this.metrics() || {};
    const activeSince = this.clock() - 1000 * 60 * 5;
    const sessions = [...this.sessions.values()].filter((session) => session.expiresAt > this.clock()).length;
    return {
      version: ADMIN_VERSION,
      registeredPlayers: players.length,
      playersOnline: players.filter((player) => player.lastSeen >= activeSince).length,
      activeSessions: sessions,
      openReports: this.state.reports.filter((report) => report.status !== 'closed').length,
      suspendedPlayers: players.filter((player) => player.status === 'suspended').length,
      rewardClaims: this.state.rewards.claims.length,
      rejectedClaims: this.state.rewards.rejected.length,
      events: this.state.events.length,
      liveEvents: this.state.events.filter((event) => event.status === 'active').length,
      maintenance: !!this.state.settings.maintenance,
      server: metrics,
      recentAudit: this.state.audit.slice(-8).reverse(),
      modeProgress: REALM_MODES.map((mode) => ({
        id: mode.id,
        name: mode.name,
        claims: this.state.rewards.claims.filter((claim) => claim.modeId === mode.id).length,
      })),
    };
  }

  parseStageId(value) {
    if (REALM_MODE_BY_ID[value]) return { mode: REALM_MODE_BY_ID[value] };
    const id = safeInt(value, -1);
    if (id < 0) return null;
    return { roomId: id };
  }

  registerRun(body, ip) {
    if (this.rateLimited(ip, 'realm-start')) return { status: 429, body: { error: 'Terlalu banyak run. Tunggu sebentar.' } };
    const mode = REALM_MODE_BY_ID[body.modeId];
    if (!mode) return { status: 400, body: { error: 'Mode tidak dikenal.' } };
    const id = `run_${randomUUID()}`;
    const run = {
      id,
      modeId: mode.id,
      seed: safeInt(body.seed, 1, 1, 0xffffffff),
      difficulty: ['easy', 'normal', 'hard', 'nightmare'].includes(body.difficulty) ? body.difficulty : 'normal',
      classId: text(body.classId, 24) || 'sera',
      startedAt: this.clock(),
      ip,
      claimed: false,
      playerId: null,
    };
    this.claimRuns.set(id, run);
    if (this.claimRuns.size > 5000) this.claimRuns.delete(this.claimRuns.keys().next().value);
    this.state.rewards.runs.push({ id, modeId: run.modeId, startedAt: run.startedAt, difficulty: run.difficulty });
    if (this.state.rewards.runs.length > 2000) this.state.rewards.runs.splice(0, this.state.rewards.runs.length - 2000);
    this.touch();
    return { status: 200, body: { ok: true, runId: id, startedAt: run.startedAt } };
  }

  claimRun(body, ip, player) {
    if (this.rateLimited(ip, 'realm-claim')) return { status: 429, body: { error: 'Terlalu banyak klaim.' } };
    const run = this.claimRuns.get(String(body.runId || ''));
    if (!run) return this.rejectClaim(body, 'unknown_run', ip, player);
    if (run.claimed) return this.rejectClaim(body, 'already_claimed', ip, player);
    if (run.ip !== ip) return this.rejectClaim(body, 'session_mismatch', ip, player);
    const elapsed = (this.clock() - run.startedAt) / 1000;
    if (elapsed < 8) return this.rejectClaim(body, 'too_fast', ip, player);
    if (body.modeId !== run.modeId) return this.rejectClaim(body, 'mode_mismatch', ip, player);
    const eligibility = realmsClaimEligibility(body);
    if (!eligibility.ok) return this.rejectClaim(body, eligibility.reason, ip, player);
    const mode = REALM_MODE_BY_ID[run.modeId];
    const claim = {
      id: `claim_${randomUUID()}`,
      runId: run.id,
      modeId: run.modeId,
      rewardId: mode.rewardId,
      cosmeticId: mode.cosmeticId,
      playerId: player?.id || null,
      score: safeInt(body.score),
      time: Math.max(0, Number(body.time) || 0),
      at: this.clock(),
      verified: true,
    };
    run.claimed = true;
    this.state.rewards.claims.push(claim);
    if (this.state.rewards.claims.length > 2000) this.state.rewards.claims.splice(0, this.state.rewards.claims.length - 2000);
    this.audit(player ? { id: player.id, username: player.name, role: 'player' } : null, 'reward.claim_verified', run.modeId, `${claim.id} score=${claim.score}`);
    this.touch();
    return { status: 200, body: { ok: true, claim, reward: { id: mode.rewardId, name: mode.rewardName, cosmeticId: mode.cosmeticId } } };
  }

  rejectClaim(body, reason, ip, player) {
    this.state.rewards.rejected.push({ runId: text(body.runId, 80), modeId: text(body.modeId, 40), reason, at: this.clock() });
    if (this.state.rewards.rejected.length > 1000) this.state.rewards.rejected.splice(0, this.state.rewards.rejected.length - 1000);
    this.audit(player ? { id: player.id, username: player.name, role: 'player' } : null, 'reward.claim_rejected', text(body.modeId, 40), reason);
    this.touch();
    return { status: 400, body: { ok: false, error: reason } };
  }

  registerPlayer(body, ip) {
    if (!this.state.settings.registrationOpen) return { status: 403, body: { error: 'Registrasi ditutup.' } };
    if (this.rateLimited(ip, 'player-register')) return { status: 429, body: { error: 'Terlalu banyak registrasi.' } };
    if (Object.keys(this.state.players).length >= MAX_PLAYERS) return { status: 507, body: { error: 'Kapasitas pemain penuh.' } };
    const id = `p_${randomUUID()}`;
    const token = randomBytes(24).toString('base64url');
    const player = {
      id,
      name: text(body.name, 32) || `Penjaga-${id.slice(2, 7)}`,
      classId: text(body.classId, 24) || 'sera',
      tokenHash: sha(token),
      createdAt: this.clock(),
      lastSeen: this.clock(),
      status: 'active',
      moderation: [],
      notes: '',
      progress: {},
    };
    this.state.players[id] = player;
    this.touch();
    return { status: 200, body: { ok: true, id, token, player: this.playerSummary(player) } };
  }

  playerFromRequest(req) {
    const header = String(req.headers.authorization || '');
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return null;
    const hash = sha(token);
    return Object.values(this.state.players).find((player) => player.tokenHash === hash) || null;
  }

  syncPlayer(req, body) {
    const player = this.playerFromRequest(req);
    if (!player) return { status: 401, body: { error: 'Token pemain tidak valid.' } };
    if (player.status === 'suspended') return { status: 403, body: { error: 'Akun ditangguhkan.' } };
    player.lastSeen = this.clock();
    player.name = text(body.name, 32) || player.name;
    player.classId = text(body.classId, 24) || player.classId;
    const p = body.progress && typeof body.progress === 'object' ? body.progress : {};
    player.progress = {
      version: safeInt(p.version, 1),
      unlocked: safeInt(p.unlocked, 1, 1, 2000),
      cleared: Array.isArray(p.cleared) ? p.cleared.filter(Boolean).length : 0,
      astralArc: text(p.astral?.arcId, 20),
      astralCleared: Array.isArray(p.astral?.cleared) ? p.astral.cleared.filter(Boolean).length : 0,
      realmsRuns: safeInt(p.realms?.totalRuns, 0),
      realmsRewards: Array.isArray(p.realms?.rewards) ? p.realms.rewards.filter((id) => REALM_MODE_BY_ID[REALM_MODE_BY_ID[id]?.modeId] || REALM_MODES.some((mode) => mode.rewardId === id)).slice(0, 20) : [],
      expansionLevels: Array.isArray(p.expansion?.clearedLevels) ? p.expansion.clearedLevels.length : 0,
      skins: Array.isArray(p.expansion?.skins) ? p.expansion.skins.length : 0,
      updatedAt: this.clock(),
    };
    this.touch();
    return { status: 200, body: { ok: true, syncedAt: player.lastSeen } };
  }

  permissionOr403(context, permission) {
    if (!this.hasPermission(context.user, permission)) {
      this.audit(context.user, 'admin.denied', permission, 'Insufficient permission');
      return { status: 403, body: { error: 'Izin tidak cukup untuk tindakan ini.' } };
    }
    return null;
  }

  async readBody(req) {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > BODY_LIMIT) throw new Error('body_too_large');
    }
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  json(res, status, body, headers = {}) {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    });
    res.end(payload);
  }

  requireCsrf(req, context) {
    const header = String(req.headers['x-csrf-token'] || '');
    if (!context || !header || header !== context.session.csrf) {
      return { status: 403, body: { error: 'CSRF token tidak valid.' } };
    }
    return null;
  }

  async handle(req, res, url, ip = '') {
    await this.ready;
    this.currentIp = ip;
    const path = url.pathname;
    if (!path.startsWith('/api/')) return false;

    // Public platform + player endpoints.
    if (path === '/api/platform/status' && req.method === 'GET') {
      this.json(res, 200, {
        version: ADMIN_VERSION,
        maintenance: !!this.state.settings.maintenance,
        message: this.state.settings.maintenanceMessage,
        registrationOpen: !!this.state.settings.registrationOpen,
        matchmakingOpen: !!this.state.settings.matchmakingOpen,
        announcement: this.state.settings.announcement,
      });
      return true;
    }
    if (path === '/api/players/register' && req.method === 'POST') {
      const body = await this.readBody(req);
      const result = this.registerPlayer(body, ip);
      this.json(res, result.status, result.body);
      return true;
    }
    if (path === '/api/players/sync' && req.method === 'POST') {
      const body = await this.readBody(req);
      const result = this.syncPlayer(req, body);
      this.json(res, result.status, result.body);
      return true;
    }
    if (path === '/api/realms/start' && req.method === 'POST') {
      const body = await this.readBody(req);
      const result = this.registerRun(body, ip);
      this.json(res, result.status, result.body);
      return true;
    }
    if (path === '/api/realms/claim' && req.method === 'POST') {
      const body = await this.readBody(req);
      const player = this.playerFromRequest(req);
      const result = this.claimRun(body, ip, player);
      this.json(res, result.status, result.body);
      return true;
    }

    if (!path.startsWith('/api/admin/') && path !== '/api/admin') return false;

    if (path === '/api/admin/login' && req.method === 'POST') {
      const body = await this.readBody(req);
      const result = await this.login(body, ip);
      this.json(res, result.status, result.body, result.cookie ? { 'Set-Cookie': result.cookie } : {});
      return true;
    }
    if (path === '/api/admin/logout' && req.method === 'POST') {
      const context = this.sessionFrom(req);
      if (context) {
        const csrfError = this.requireCsrf(req, context);
        if (csrfError) { this.json(res, csrfError.status, csrfError.body); return true; }
        this.audit(context.user, 'admin.logout', context.user.username, 'Administrative session closed');
        this.sessions.delete(context.session.tokenHash);
        await this.persist(true);
      }
      this.json(res, 200, { ok: true }, { 'Set-Cookie': this.cookie('', true) });
      return true;
    }

    const context = this.sessionFrom(req);
    if (!context) {
      if (path === '/api/admin/session' && req.method === 'GET') {
        this.json(res, 200, { authenticated: false, user: null, permissions: [], nav: [] });
      } else {
        this.json(res, 401, { error: 'Sesi admin tidak valid atau kedaluwarsa.' });
      }
      return true;
    }
    this.currentIp = ip;
    const method = req.method || 'GET';
    let body = {};
    if (method !== 'GET' && method !== 'HEAD') {
      const csrfError = this.requireCsrf(req, context);
      if (csrfError) { this.json(res, csrfError.status, csrfError.body); return true; }
      body = await this.readBody(req);
    }

    if (path === '/api/admin/session' && method === 'GET') {
      this.json(res, 200, {
        user: this.publicUser(context.user),
        permissions: this.userPermissions(context.user),
        csrf: context.session.csrf,
        nav: ADMIN_NAV.filter((entry) => this.hasPermission(context.user, entry.permission)),
        roles: this.state.roles,
        permissionsList: ADMIN_PERMISSIONS,
      });
      return true;
    }

    const deny = (permission) => {
      const error = this.permissionOr403(context, permission);
      if (error) this.json(res, error.status, { error: error.body.error });
      return !!error;
    };

    if (path === '/api/admin/overview' && method === 'GET') {
      if (deny('overview.read')) return true;
      this.json(res, 200, this.overview());
      return true;
    }

    if (path === '/api/admin/players' && method === 'GET') {
      if (deny('players.read')) return true;
      const q = text(url.searchParams.get('q') || '', 40).toLowerCase();
      const players = Object.values(this.state.players)
        .filter((player) => !q || player.name.toLowerCase().includes(q) || player.id.toLowerCase().includes(q))
        .sort((a, b) => b.lastSeen - a.lastSeen)
        .slice(0, 100)
        .map((player) => this.playerSummary(player));
      this.json(res, 200, { players, total: Object.keys(this.state.players).length });
      return true;
    }

    const playerMatch = path.match(/^\/api\/admin\/players\/([^/]+)\/(suspend|restore|note|report)$/);
    if (playerMatch && method === 'POST') {
      if (deny(playerMatch[2] === 'note' ? 'players.read' : 'players.moderate')) return true;
      const player = this.state.players[decodeURIComponent(playerMatch[1])];
      if (!player) { this.json(res, 404, { error: 'Pemain tidak ditemukan.' }); return true; }
      const reason = text(body.reason, 240);
      if (playerMatch[2] === 'suspend') {
        if (!reason) { this.json(res, 400, { error: 'Alasan wajib diisi untuk penangguhan.' }); return true; }
        player.status = 'suspended';
        player.moderation.push({ at: this.clock(), action: 'suspend', by: context.user.username, reason });
        this.audit(context.user, 'player.suspend', player.id, player.name, reason);
      } else if (playerMatch[2] === 'restore') {
        player.status = 'active';
        player.moderation.push({ at: this.clock(), action: 'restore', by: context.user.username, reason: reason || 'Review complete' });
        this.audit(context.user, 'player.restore', player.id, player.name, reason);
      } else if (playerMatch[2] === 'note') {
        player.notes = text(body.note, 500);
        this.audit(context.user, 'player.note', player.id, player.name, player.notes);
      } else {
        const report = {
          id: `rep_${randomUUID()}`,
          playerId: player.id,
          reason: reason || 'Player report',
          status: 'open',
          at: this.clock(),
          by: context.user.username,
        };
        this.state.reports.push(report);
        this.audit(context.user, 'report.create', player.id, player.name, report.reason);
      }
      this.touch();
      this.json(res, 200, { ok: true, player: this.playerSummary(player) });
      return true;
    }

    if (path === '/api/admin/reports' && method === 'GET') {
      if (deny('reports.read')) return true;
      this.json(res, 200, { reports: [...this.state.reports].reverse().slice(0, 200) });
      return true;
    }
    const reportMatch = path.match(/^\/api\/admin\/reports\/([^/]+)$/);
    if (reportMatch && method === 'PUT') {
      if (deny('reports.write')) return true;
      const report = this.state.reports.find((entry) => entry.id === reportMatch[1]);
      if (!report) { this.json(res, 404, { error: 'Laporan tidak ditemukan.' }); return true; }
      report.status = ['open', 'reviewing', 'closed'].includes(body.status) ? body.status : report.status;
      report.resolution = text(body.resolution, 300);
      report.updatedAt = this.clock();
      this.audit(context.user, 'report.update', report.id, report.status, report.resolution);
      this.touch();
      this.json(res, 200, { ok: true, report });
      return true;
    }

    if (path === '/api/admin/roles' && method === 'GET') {
      if (deny('settings.write')) return true;
      this.json(res, 200, { roles: this.state.roles, permissions: ADMIN_PERMISSIONS });
      return true;
    }
    const roleMatch = path.match(/^\/api\/admin\/roles\/([^/]+)$/);
    if (roleMatch && method === 'PUT') {
      if (deny('roles.write')) return true;
      const id = decodeURIComponent(roleMatch[1]);
      const role = this.state.roles[id];
      if (!role) { this.json(res, 404, { error: 'Role tidak ditemukan.' }); return true; }
      if (id === 'super_admin') { this.json(res, 400, { error: 'Super Admin selalu memiliki semua izin.' }); return true; }
      const permissions = Array.isArray(body.permissions) ? body.permissions.filter((permission) => ADMIN_PERMISSIONS.includes(permission)) : role.permissions;
      role.permissions = [...new Set(permissions)];
      this.audit(context.user, 'role.permissions', id, role.permissions.join(','), text(body.reason, 240));
      this.touch();
      this.json(res, 200, { ok: true, role });
      return true;
    }

    if (path === '/api/admin/catalog' && method === 'GET') {
      if (deny('overview.read')) return true;
      this.json(res, 200, {
        campaign: {
          rooms: ALL_ROOMS.length,
          astralRooms: ALL_ROOMS.filter((room) => room.astral).length,
          bosses: Object.keys(ALL_BOSS_INFO).length,
          enemies: Object.keys(ALL_ENEMY_INFO).length,
        },
        modes: REALM_MODES.map((mode) => ({
          id: mode.id, name: mode.name, subtitle: mode.subtitle, objective: mode.objective,
          rewardId: mode.rewardId, rewardName: mode.rewardName, loop: mode.loop,
        })),
        classes: Object.values(CHARACTERS).map((entry) => ({
          id: entry.id, name: entry.name, title: entry.title, hp: entry.hp, damage: entry.damage, speed: entry.speed,
        })),
        enemies: Object.values(ALL_ENEMY_INFO).slice(0, 300).map((enemy) => ({
          id: enemy.id, name: enemy.name, hp: enemy.hp, dmg: enemy.dmg, behavior: enemy.behavior,
          elite: !!enemy.elite, astral: !!enemy.astral, where: enemy.where || '',
        })),
        bosses: Object.values(ALL_BOSS_INFO).slice(0, 150).map((boss) => ({
          id: boss.id, kind: boss.kind, name: boss.name, hp: boss.maxHp || boss.hp, phases: boss.maxPhases || boss.phases,
          astral: !!boss.astral,
        })),
      });
      return true;
    }

    if (path === '/api/admin/content' && method === 'GET') {
      if (deny('campaign.read')) return true;
      this.json(res, 200, {
        validation: this.contentValidation(),
        overrides: this.state.content.overrides,
        drafts: this.state.content.drafts,
        published: this.state.content.published,
        scheduled: this.state.content.scheduled,
      });
      return true;
    }
    if (path === '/api/admin/content/validate' && method === 'POST') {
      if (deny('campaign.write')) return true;
      this.json(res, 200, this.contentValidation());
      return true;
    }
    const contentMatch = path.match(/^\/api\/admin\/content\/([a-z_]+)\/([^/]+)$/);
    if (contentMatch && method === 'PUT') {
      if (deny('campaign.write')) return true;
      const domain = contentMatch[1];
      const id = decodeURIComponent(contentMatch[2]);
      const allowed = ['stage', 'enemy', 'boss', 'item', 'event', 'mode', 'class', 'arc'];
      if (!allowed.includes(domain)) { this.json(res, 400, { error: 'Domain konten tidak dikenal.' }); return true; }
      if (domain === 'stage' && body.enemies) {
        const count = Array.isArray(body.enemies) ? body.enemies.length : 0;
        const elites = Array.isArray(body.enemies) ? body.enemies.filter((enemy) => enemy.elite).length : 0;
        const archetypes = Array.isArray(body.enemies) ? new Set(body.enemies.map((enemy) => enemy.role)).size : 0;
        if (count !== 20 || elites !== 1 || archetypes < 4) {
          this.json(res, 422, { error: 'Validasi gagal: setiap stage standar membutuhkan tepat 20 musuh, 4 archetype, dan 1 elite.' });
          return true;
        }
      }
      this.state.content.overrides[`${domain}:${id}`] = { ...body, updatedAt: this.clock(), updatedBy: context.user.username };
      this.audit(context.user, `content.${domain}.update`, id, 'Content override saved', text(body.reason, 240));
      this.touch();
      this.json(res, 200, { ok: true, override: this.state.content.overrides[`${domain}:${id}`] });
      return true;
    }

    if (path === '/api/admin/economy' && method === 'GET') {
      if (deny('economy.read')) return true;
      this.json(res, 200, this.state.economy);
      return true;
    }
    if (path === '/api/admin/economy' && method === 'PUT') {
      if (deny('economy.write')) return true;
      if (!body || typeof body !== 'object') { this.json(res, 400, { error: 'Data ekonomi tidak valid.' }); return true; }
      this.state.economy = {
        currencies: Array.isArray(body.currencies) ? body.currencies.slice(0, 20) : this.state.economy.currencies,
        items: Array.isArray(body.items) ? body.items.slice(0, 500).map((item) => ({ ...item, price: safeInt(item.price, 0, 0, 1000000) })) : this.state.economy.items,
        crafting: Array.isArray(body.crafting) ? body.crafting.slice(0, 200) : this.state.economy.crafting,
        dropTables: Array.isArray(body.dropTables) ? body.dropTables.slice(0, 200) : this.state.economy.dropTables,
        flags: body.flags && typeof body.flags === 'object' ? { ...this.state.economy.flags, ...body.flags } : this.state.economy.flags,
      };
      this.audit(context.user, 'economy.update', 'economy', 'Economy configuration changed', text(body.reason, 240));
      this.touch();
      this.json(res, 200, { ok: true, economy: this.state.economy });
      return true;
    }

    if (path === '/api/admin/events' && method === 'GET') {
      if (deny('events.read')) return true;
      this.json(res, 200, { events: this.state.events, now: this.clock() });
      return true;
    }
    if (path === '/api/admin/events' && method === 'POST') {
      if (deny('events.write')) return true;
      const event = this.validEvent(body);
      if (event.error) { this.json(res, 422, { error: event.error }); return true; }
      this.state.events.push(event.value);
      this.audit(context.user, 'event.create', event.value.id, event.value.name, text(body.reason, 240));
      this.touch();
      this.json(res, 200, { ok: true, event: event.value });
      return true;
    }
    const eventMatch = path.match(/^\/api\/admin\/events\/([^/]+)$/);
    if (eventMatch && method === 'PUT') {
      if (deny('events.write')) return true;
      const event = this.state.events.find((entry) => entry.id === eventMatch[1]);
      if (!event) { this.json(res, 404, { error: 'Event tidak ditemukan.' }); return true; }
      const updated = this.validEvent({ ...event, ...body });
      if (updated.error) { this.json(res, 422, { error: updated.error }); return true; }
      Object.assign(event, updated.value);
      this.audit(context.user, 'event.update', event.id, event.name, text(body.reason, 240));
      this.touch();
      this.json(res, 200, { ok: true, event });
      return true;
    }
    const eventEndMatch = path.match(/^\/api\/admin\/events\/([^/]+)\/(end|pause|resume)$/);
    if (eventEndMatch && method === 'POST') {
      if (deny('events.write')) return true;
      const event = this.state.events.find((entry) => entry.id === eventEndMatch[1]);
      if (!event) { this.json(res, 404, { error: 'Event tidak ditemukan.' }); return true; }
      event.status = eventEndMatch[2] === 'end' ? 'ended' : eventEndMatch[2] === 'pause' ? 'paused' : 'active';
      event.updatedAt = this.clock();
      this.audit(context.user, `event.${eventEndMatch[2]}`, event.id, event.name, text(body.reason, 240));
      this.touch();
      this.json(res, 200, { ok: true, event });
      return true;
    }

    if (path === '/api/admin/monitor' && method === 'GET') {
      if (deny('server.read')) return true;
      this.json(res, 200, { ...this.metrics(), maintenance: this.state.settings.maintenance, sessions: this.sessions.size, at: this.clock() });
      return true;
    }

    if (path === '/api/admin/audit' && method === 'GET') {
      if (deny('audit.read')) return true;
      const q = text(url.searchParams.get('q') || '', 40).toLowerCase();
      const entries = this.state.audit
        .filter((entry) => !q || entry.actor.toLowerCase().includes(q) || entry.action.toLowerCase().includes(q) || entry.target.toLowerCase().includes(q))
        .slice(-300)
        .reverse();
      this.json(res, 200, { entries });
      return true;
    }

    if (path === '/api/admin/settings' && method === 'GET') {
      if (deny('settings.write')) return true;
      this.json(res, 200, { settings: this.state.settings, roles: this.state.roles, permissions: ADMIN_PERMISSIONS });
      return true;
    }
    if (path === '/api/admin/settings' && method === 'PUT') {
      if (deny('settings.write')) return true;
      const allowed = ['maintenance', 'maintenanceMessage', 'registrationOpen', 'matchmakingOpen', 'eventSubmissions', 'maxSessions', 'announcement'];
      for (const key of allowed) {
        if (!(key in body)) continue;
        if (typeof this.state.settings[key] === 'boolean') this.state.settings[key] = body[key] === true;
        else if (key === 'maxSessions') this.state.settings[key] = safeInt(body[key], 500, 10, 100000);
        else this.state.settings[key] = text(body[key], 500);
      }
      this.audit(context.user, 'settings.update', 'platform', 'Platform settings changed', text(body.reason, 240));
      this.touch();
      this.json(res, 200, { ok: true, settings: this.state.settings });
      return true;
    }

    if (path === '/api/admin/announcements' && method === 'POST') {
      if (deny('announcements.write')) return true;
      const message = text(body.message, 500);
      if (!message) { this.json(res, 400, { error: 'Pesan pengumuman wajib diisi.' }); return true; }
      const announcement = { id: `ann_${randomUUID()}`, message, at: this.clock(), by: context.user.username };
      this.state.announcements.push(announcement);
      this.state.settings.announcement = message;
      this.audit(context.user, 'announcement.publish', announcement.id, message);
      this.touch();
      this.json(res, 200, { ok: true, announcement });
      return true;
    }

    if (path === '/api/admin/stage-sessions' && method === 'POST') {
      if (deny('stage_access.use')) return true;
      const stage = this.parseStageId(body.stageId);
      if (!stage) { this.json(res, 400, { error: 'Stage tidak dikenal.' }); return true; }
      const session = {
        id: `hack_${randomUUID()}`,
        stageId: body.stageId,
        isolated: true,
        mode: text(body.mode, 20) || 'hack',
        startedAt: this.clock(),
        by: context.user.username,
        testRewardSimulation: body.testRewardSimulation === true,
      };
      this.audit(context.user, 'stage.session', String(body.stageId), `isolated=${session.isolated}`);
      this.touch();
      this.json(res, 200, { ok: true, session });
      return true;
    }

    this.json(res, 404, { error: 'Endpoint admin tidak ditemukan.' });
    return true;
  }

  contentValidation() {
    const astral = validateAstralRooms();
    return {
      ok: astral.ok,
      astral,
      rules: [
        'Standard stages require exactly 20 enemies.',
        'Exactly four base archetypes plus one guaranteed elite.',
        'Boss stages must reference a known boss and phase table.',
        'Gate destinations must resolve inside the same arc.',
      ],
      checkedAt: this.clock(),
    };
  }

  validEvent(body) {
    const name = text(body.name, 80);
    if (!name) return { error: 'Nama event wajib diisi.' };
    const startAt = Math.max(0, Number(body.startAt) || this.clock());
    const endAt = Math.max(startAt + 60000, Number(body.endAt) || startAt + 86400000);
    const status = ['draft', 'scheduled', 'active', 'paused', 'ended'].includes(body.status) ? body.status : 'draft';
    return {
      value: {
        id: text(body.id, 40) || `evt_${randomUUID()}`,
        name,
        desc: text(body.desc, 400),
        startAt,
        endAt,
        status,
        rewards: Array.isArray(body.rewards) ? body.rewards.slice(0, 30).map((reward) => text(reward, 80)) : [],
        challenges: Array.isArray(body.challenges) ? body.challenges.slice(0, 30).map((challenge) => ({
          id: text(challenge.id, 40) || `ch_${randomUUID()}`,
          name: text(challenge.name, 80),
          target: safeInt(challenge.target, 1, 1, 100000),
        })) : [],
        createdAt: this.clock(),
        updatedAt: this.clock(),
      },
    };
  }

  close() {
    for (const session of this.sessions.values()) session.expiresAt = 0;
  }
}

export function createAdminService(options) {
  return new AdminService(options);
}
