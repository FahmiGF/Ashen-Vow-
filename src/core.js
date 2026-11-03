// Ashen Vow v0.0.5 — deterministic 2D combat simulation.
// Pure logic: no DOM, no canvas, no audio. Runs identically in Node and the browser.

export const VIEW_W = 960;
export const VIEW_H = 540;
export const WORLD_W = 1400;
export const FLOOR_Y = 470;
export const GRAVITY = 2200;

const ATTACKS = [
  { windup: 0.045, active: 0.115, recover: 0.13, range: 60, height: 46, dmg: 12, knock: 150, name: 'slash' },
  { windup: 0.045, active: 0.115, recover: 0.13, range: 62, height: 46, dmg: 14, knock: 180, name: 'slash' },
  { windup: 0.09, active: 0.16, recover: 0.2, range: 76, height: 56, dmg: 24, knock: 300, name: 'heavy' },
];

const BLESSINGS = [
  { id: 'iron', name: 'Vow of Iron', desc: '+40 Max HP. Sembuh sepenuhnya.' },
  { id: 'ember', name: 'Vow of Embers', desc: 'Kerusakan pedang +30%.' },
  { id: 'wind', name: 'Vow of Wind', desc: 'Cooldown dash -35%, i-frame dash lebih lama.' },
];

export const ROOMS = [
  {
    id: 0,
    name: 'Gerbang Abu',
    subtitle: 'The Ashen Gate',
    accent: '#d07a35',
    spawn: { x: 90, y: FLOOR_Y - 46 },
    platforms: [
      { x: 0, y: 470, w: 1400, h: 70 },
      { x: 300, y: 378, w: 190, h: 18 },
      { x: 650, y: 328, w: 180, h: 18 },
      { x: 1000, y: 392, w: 160, h: 18 },
    ],
    enemies: [
      { type: 'crawler', x: 470, minX: 380, maxX: 600 },
      { type: 'crawler', x: 1120, minX: 1030, maxX: 1220 },
    ],
    relic: null,
    boss: null,
    gate: { x: 1362, y: 286, w: 34, h: 184, requires: 'clear' },
    hint: 'Bersihkan gerbang dari abu yang hidup.',
  },
  {
    id: 1,
    name: 'Balai Sumpah',
    subtitle: 'Hall of Oaths',
    accent: '#b9562f',
    spawn: { x: 90, y: FLOOR_Y - 46 },
    platforms: [
      { x: 0, y: 470, w: 560, h: 70 },
      { x: 730, y: 470, w: 670, h: 70 },
      { x: 200, y: 368, w: 180, h: 18 },
      { x: 470, y: 306, w: 190, h: 18 },
      { x: 900, y: 382, w: 150, h: 18 },
      { x: 1100, y: 300, w: 210, h: 18 },
    ],
    enemies: [
      { type: 'crawler', x: 330, minX: 200, maxX: 470 },
      { type: 'sentinel', x: 1000, minX: 860, maxX: 1180 },
    ],
    relic: { x: 1194, y: 254, w: 26, h: 26, name: 'Ember Feather' },
    boss: null,
    gate: { x: 1362, y: 286, w: 34, h: 184, requires: 'relic' },
    hint: 'Ambil relik Bulu Bara di ujung balai. Dash melewati jurang.',
  },
  {
    id: 2,
    name: 'Singgasana Bara',
    subtitle: 'Throne of Cinders',
    accent: '#e0913c',
    spawn: { x: 96, y: FLOOR_Y - 46 },
    platforms: [
      { x: 0, y: 470, w: 1400, h: 70 },
      { x: 120, y: 352, w: 190, h: 18 },
      { x: 1090, y: 352, w: 190, h: 18 },
      { x: 600, y: 318, w: 200, h: 18 },
    ],
    enemies: [],
    relic: null,
    boss: 'warden',
    gate: { x: 1362, y: 286, w: 34, h: 184, requires: 'boss' },
    hint: 'Sir Mordrake, Penjaga yang Gugur, menanti di tengah bara.',
  },
  {
    id: 3,
    name: 'Sarang Wyrm',
    subtitle: "Wyrm's Roost",
    accent: '#cf5a45',
    spawn: { x: 150, y: FLOOR_Y - 46 },
    platforms: [
      { x: 0, y: 470, w: 430, h: 70 },
      { x: 970, y: 470, w: 430, h: 70 },
      { x: 500, y: 360, w: 200, h: 18 },
      { x: 800, y: 360, w: 200, h: 18 },
      { x: 640, y: 268, w: 190, h: 18 },
    ],
    enemies: [],
    relic: null,
    boss: 'wyrm',
    gate: null,
    hint: 'Vhael, Wyrm Abu, bangkit dari dasar jurang.',
  },
];

const BOSS_INFO = {
  warden: {
    name: 'Sir Mordrake',
    title: 'The Fallen Warden',
    maxHp: 340,
    w: 88,
    h: 112,
    contact: 12,
  },
  wyrm: {
    name: 'Vhael',
    title: 'The Ashen Wyrm',
    maxHp: 480,
    w: 118,
    h: 74,
    contact: 13,
  },
};

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);
const rand = (a, b) => a + Math.random() * (b - a);

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function rectHitsRect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class AshenGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.time = 0;
    this.state = 'playing';
    this.roomIndex = 0;
    this.events = [];
    this.fx = [];
    this.hitstop = 0;
    this.shake = 0;
    this.kills = 0;
    this.bossDefeated = {};
    this.awaitingBlessing = false;
    this.blessingChoices = null;
    this.blessings = [];
    this.projectiles = [];
    this.enemies = [];
    this.boss = null;
    this.bossIntro = 0;
    this.deathTimer = 0;
    this.prevInput = {};

    this.player = {
      x: 0,
      y: 0,
      w: 30,
      h: 46,
      vx: 0,
      vy: 0,
      facing: 1,
      hp: 100,
      maxHp: 100,
      onGround: false,
      coyote: 0,
      jumpBuffer: 0,
      jumpsUsed: 0,
      relic: false,
      invuln: 0,
      attack: null,
      comboTimer: 0,
      comboIndex: 0,
      attackCooldown: 0,
      dashTimer: 0,
      dashCooldown: 0,
      dashCooldownMax: 0.78,
      dashIframes: 0.2,
      dashDir: 1,
      flasks: 3,
      maxFlasks: 3,
      healing: 0,
      damageMult: 1,
      hitFlash: 0,
      pitGrace: false,
    };

    this.loadRoom(0, true);
  }

  // ── setup ────────────────────────────────────────────────────────────────
  loadRoom(index, initial = false) {
    const room = ROOMS[index];
    if (!room) return;
    this.roomIndex = index;
    this.room = room;
    this.projectiles = [];
    this.enemies = [];
    this.boss = null;
    this.blessingChoices = null;
    this.awaitingBlessing = false;
    this.bossIntro = room.boss ? 1.0 : 0;
    const p = this.player;
    p.x = room.spawn.x;
    p.y = room.spawn.y;
    p.vx = 0;
    p.vy = 0;
    p.onGround = false;
    p.attack = null;
    p.attackCooldown = 0;
    p.comboTimer = 0;
    p.dashTimer = 0;
    p.dashCooldown = 0;
    p.healing = 0;
    p.invuln = Math.max(p.invuln, 0.35);
    p.pitGrace = false;
    this.shake = 0;

    for (const def of room.enemies) this.spawnEnemy(def);

    if (room.boss && !this.bossDefeated[index]) {
      this.spawnBoss(room.boss);
    }
    this.emit({ type: 'roomEnter', room: index, name: room.name, subtitle: room.subtitle });
  }

  enterRoom(index) {
    this.state = 'playing';
    this.loadRoom(index);
  }

  spawnEnemy(def) {
    const base = {
      id: `e${this.enemies.length}_${Math.floor(this.time * 1000)}`,
      type: def.type,
      x: def.x,
      y: 0,
      vx: 0,
      vy: 0,
      facing: -1,
      hitFlash: 0,
      dead: false,
      state: 'patrol',
      timer: 0,
      cooldown: 0,
      minX: def.minX,
      maxX: def.maxX,
      patrolDir: -1,
      attackLanded: false,
    };
    let e;
    if (def.type === 'crawler') {
      e = { ...base, w: 46, h: 30, hp: 34, maxHp: 34, dmg: 8, speed: 78 };
    } else {
      e = { ...base, w: 44, h: 54, hp: 64, maxHp: 64, dmg: 14, speed: 88 };
    }
    e.y = FLOOR_Y - e.h;
    this.enemies.push(e);
  }

  spawnBoss(kind) {
    const info = BOSS_INFO[kind];
    const b = {
      kind,
      name: info.name,
      title: info.title,
      x: kind === 'warden' ? 760 : 700,
      y: kind === 'warden' ? FLOOR_Y - info.h : 150,
      w: info.w,
      h: info.h,
      vx: 0,
      vy: 0,
      maxHp: info.maxHp,
      hp: info.maxHp,
      contact: info.contact,
      facing: -1,
      phase: 1,
      state: 'idle',
      timer: 0,
      cooldown: 1.2,
      hitFlash: 0,
      invuln: 0,
      attackLanded: false,
      pattern: 0,
      hoverT: 0,
      shotsLeft: 0,
      shotTimer: 0,
      targetX: 700,
      dying: false,
      deathTimer: 0,
      intro: 1.0,
    };
    this.boss = b;
    this.emit({ type: 'bossSpawn', name: info.name, title: info.title, kind });
    this.shake = 0.5;
  }

  emit(ev) {
    if (this.events.length > 240) this.events.shift();
    this.events.push(ev);
  }

  spawnFx(type, x, y, opts = {}) {
    if (this.fx.length > 260) this.fx.shift();
    this.fx.push({
      type,
      x,
      y,
      vx: opts.vx ?? 0,
      vy: opts.vy ?? 0,
      life: opts.life ?? 0.45,
      maxLife: opts.life ?? 0.45,
      size: opts.size ?? 4,
      color: opts.color ?? '#f0a34c',
      rot: opts.rot ?? 0,
    });
  }

  burst(x, y, count, color = '#f0a34c', power = 160) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(power * 0.25, power);
      this.spawnFx('spark', x, y, {
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 40,
        life: rand(0.2, 0.55),
        size: rand(2, 5),
        color,
      });
    }
  }

  // ── helpers ──────────────────────────────────────────────────────────────
  get playerCenter() {
    return { x: this.player.x + this.player.w / 2, y: this.player.y + this.player.h / 2 };
  }

  get gate() {
    const g = this.room.gate;
    if (!g) return null;
    const requires = g.requires;
    let open = false;
    let reason = '';
    if (requires === 'clear') {
      open = this.enemies.length === 0;
      reason = open ? '' : `Sisa abu: ${this.enemies.length}. Bersihkan dulu.`;
    } else if (requires === 'relic') {
      open = this.player.relic;
      reason = open ? '' : 'Segel kuno. Butuh Relik Bulu Bara.';
    } else if (requires === 'boss') {
      open = !!this.bossDefeated[2] && !this.awaitingBlessing;
      reason = open ? '' : this.awaitingBlessing ? 'Pilih berkahmu dahulu.' : 'Kalahkan Penjaga Agung.';
    }
    return { ...g, open, reason };
  }

  get bossActive() {
    return this.boss && !this.boss.dying;
  }

  isNearGate() {
    const g = this.gate;
    if (!g) return false;
    const p = this.player;
    return Math.abs(p.x + p.w / 2 - (g.x + g.w / 2)) < 170 && p.y + p.h > g.y;
  }

  // ── main update ──────────────────────────────────────────────────────────
  update(dt, input = {}) {
    if (!dt || dt <= 0) return;
    dt = Math.min(dt, 0.05);
    const pressed = (name) => !!input[name] && !this.prevInput[name];

    if (this.state === 'playing') {
      this.time += dt;
      if (this.hitstop > 0) {
        this.hitstop = Math.max(0, this.hitstop - dt);
      } else {
        this.player.invuln = Math.max(0, this.player.invuln - dt);
        this.player.hitFlash = Math.max(0, this.player.hitFlash - dt);
        this.shake = Math.max(0, this.shake - dt * 2.2);
        this.updatePlayer(dt, input, pressed);
        this.updateEnemies(dt);
        this.updateBoss(dt);
        this.updateProjectiles(dt);
        this.checkContacts();
        this.updateRelic();
        this.updateGate();
        this.cleanup();
      }
      this.updateFx(dt);
    } else {
      this.updateFx(dt);
    }

    this.prevInput = { ...input };
  }

  // ── player ───────────────────────────────────────────────────────────────
  updatePlayer(dt, input, pressed) {
    const p = this.player;

    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.comboTimer > 0) p.comboTimer -= dt;
    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (p.jumpBuffer > 0) p.jumpBuffer -= dt;
    if (p.coyote > 0) p.coyote -= dt;

    if (p.healing > 0) {
      p.healing -= dt;
      p.vx *= Math.pow(0.001, dt);
      if (p.healing <= 0) {
        p.flasks -= 1;
        p.hp = Math.min(p.maxHp, p.hp + 38);
        this.emit({ type: 'heal' });
        this.burst(p.x + p.w / 2, p.y + p.h / 2, 10, '#8fd98a', 110);
      }
    } else if (pressed('heal') && p.flasks > 0 && p.hp < p.maxHp && p.onGround && p.dashTimer <= 0 && !p.attack) {
      p.healing = 0.46;
      this.emit({ type: 'healStart' });
    }

    // dash
    if (pressed('dash') && p.dashCooldown <= 0 && p.dashTimer <= 0 && p.healing <= 0) {
      p.dashTimer = 0.17;
      p.dashCooldown = p.dashCooldownMax;
      p.dashDir = input.left && !input.right ? -1 : input.right && !input.left ? 1 : p.facing;
      p.facing = p.dashDir;
      p.vy = 0;
      this.emit({ type: 'dash' });
      this.spawnFx('dash', p.x + p.w / 2, p.y + p.h / 2, { life: 0.22, size: 22, color: '#9fc4d8' });
    }

    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      p.vx = p.dashDir * 640;
      p.vy = 0;
      if (Math.random() < 0.5) {
        this.spawnFx('dash', p.x + p.w / 2, p.y + p.h / 2, {
          life: 0.25,
          size: 16,
          color: '#8fb6cc',
          vx: -p.dashDir * 40,
        });
      }
      if (p.dashTimer <= 0) {
        p.vx *= 0.4;
        p.dashCooldown = Math.max(p.dashCooldown, 0.05);
      }
    }

    // attack input
    if (pressed('attack') && !p.attack && p.attackCooldown <= 0 && p.dashTimer <= 0 && p.healing <= 0) {
      this.startAttack();
    }

    if (p.attack) this.updatePlayerAttack(dt);

    // horizontal movement
    const moving = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    const control = p.dashTimer > 0 ? 0 : p.attack ? 0.35 : 1;
    if (p.healing > 0) {
      // rooted while drinking
    } else if (moving !== 0) {
      p.facing = moving;
      const target = moving * 255 * control;
      const accel = (p.onGround ? 2400 : 1500) * dt;
      p.vx += clamp(target - p.vx, -accel, accel);
      p.vx = clamp(p.vx, -300, 300);
    } else if (p.dashTimer <= 0) {
      const fric = (p.onGround ? 2800 : 900) * dt;
      if (Math.abs(p.vx) <= fric) p.vx = 0;
      else p.vx -= sign(p.vx) * fric;
    }

    // jump
    if (pressed('jump')) p.jumpBuffer = 0.13;
    if (p.jumpBuffer > 0 && p.healing <= 0) {
      if (p.onGround || p.coyote > 0) {
        p.vy = -720;
        p.onGround = false;
        p.coyote = 0;
        p.jumpsUsed = 1;
        p.jumpBuffer = 0;
        this.emit({ type: 'jump' });
        this.spawnFx('dust', p.x + p.w / 2, p.y + p.h, { life: 0.3, size: 9, color: '#8a7a63' });
      } else if (p.relic && p.jumpsUsed < 2) {
        p.vy = -660;
        p.jumpsUsed = 2;
        p.jumpBuffer = 0;
        this.emit({ type: 'doubleJump' });
        this.burst(p.x + p.w / 2, p.y + p.h, 8, '#e8b46a', 90);
      }
    }
    // variable jump height
    if (!input.jump && p.vy < -220) p.vy += GRAVITY * 1.9 * dt;

    // integrate
    const wasGround = p.onGround;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 0, WORLD_W - p.w);
    const prevBottom = p.y + p.h;
    p.vy += GRAVITY * dt;
    p.y += p.vy * dt;

    p.onGround = false;
    for (const plat of this.room.platforms) {
      if (p.x + p.w <= plat.x || p.x >= plat.x + plat.w) continue;
      if (p.vy >= 0 && prevBottom <= plat.y + 4 && p.y + p.h >= plat.y) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.onGround = true;
      }
    }
    if (p.onGround) {
      p.coyote = 0.1;
      p.jumpsUsed = 0;
      p.pitGrace = false;
    } else if (wasGround) {
      p.coyote = Math.max(p.coyote, 0.1);
    }

    // pit hazard
    if (p.y > 640) {
      if (!p.pitGrace) {
        p.pitGrace = true;
        this.damagePlayer(28, p.x + p.w / 2, { knock: false });
        if (this.state === 'playing') {
          p.x = this.room.spawn.x;
          p.y = this.room.spawn.y;
          p.vx = 0;
          p.vy = 0;
          p.invuln = Math.max(p.invuln, 1.0);
          this.emit({ type: 'respawn' });
        }
      }
    }
  }

  startAttack() {
    const p = this.player;
    const idx = p.comboTimer > 0 ? (p.comboIndex + 1) % 3 : 0;
    p.comboIndex = idx;
    p.attack = { t: 0, combo: idx, hitIds: [], landed: false };
    p.x += p.facing * 3;
    this.emit({ type: 'swing', combo: idx });
    if (idx === 2) this.shake = Math.max(this.shake, 0.16);
  }

  updatePlayerAttack(dt) {
    const p = this.player;
    const a = p.attack;
    const def = ATTACKS[a.combo];
    a.t += dt;
    if (a.t >= def.windup + def.active + def.recover) {
      p.attack = null;
      p.comboTimer = 0.5;
      p.attackCooldown = 0.06;
      return;
    }
    if (a.t >= def.windup && a.t < def.windup + def.active) {
      const hb = this.playerHitbox();
      for (const e of this.enemies) {
        if (e.dead || a.hitIds.includes(e.id)) continue;
        if (rectHitsRect(hb, e)) {
          a.hitIds.push(e.id);
          a.landed = true;
          this.hurtEnemy(e, def, p.facing);
        }
      }
      const b = this.boss;
      if (b && !b.dying && !a.hitIds.includes('boss') && rectHitsRect(hb, b)) {
        a.hitIds.push('boss');
        a.landed = true;
        this.hurtBoss(def.dmg * p.damageMult, def.knock, p.facing, a.combo === 2);
      }
      // cut down fireballs
      for (const pr of this.projectiles) {
        if (pr.owner !== 'boss' || pr.type !== 'fireball') continue;
        if (a.hitIds.includes(pr.id)) continue;
        if (rectHitsRect(hb, { x: pr.x - pr.r, y: pr.y - pr.r, w: pr.r * 2, h: pr.r * 2 })) {
          a.hitIds.push(pr.id);
          pr.dead = true;
          this.burst(pr.x, pr.y, 8, '#ffb066', 120);
          this.emit({ type: 'deflect', x: pr.x, y: pr.y });
        }
      }
    }
  }

  playerHitbox() {
    const p = this.player;
    const def = ATTACKS[p.attack ? p.attack.combo : 0];
    const w = def.range;
    const h = def.height;
    const y = p.y + p.h / 2 - h / 2 + 4;
    return {
      x: p.facing > 0 ? p.x + p.w - 6 : p.x - w + 6,
      y,
      w,
      h,
    };
  }

  hurtEnemy(e, def, dir) {
    const p = this.player;
    e.hp -= def.dmg * p.damageMult;
    e.hitFlash = 0.12;
    e.x = clamp(e.x + dir * def.knock * 0.12, e.minX - 50, e.maxX + 50);
    e.state = 'hurt';
    e.timer = 0.16;
    this.hitstop = Math.max(this.hitstop, 0.035);
    this.shake = Math.max(this.shake, 0.18);
    this.emit({ type: 'hit', crit: def.name === 'heavy', x: e.x + e.w / 2, y: e.y + e.h / 2 });
    this.burst(e.x + e.w / 2, e.y + e.h / 2, def.name === 'heavy' ? 14 : 8, '#d8b06a', 180);
    if (e.hp <= 0) {
      e.dead = true;
      this.kills += 1;
      this.burst(e.x + e.w / 2, e.y + e.h / 2, 16, '#c96a3a', 220);
      this.emit({ type: 'enemyDown' });
    }
  }

  hurtBoss(amount, knock = 0, dir = 1, crit = false) {
    const b = this.boss;
    if (!b || b.dying || b.invuln > 0) return;
    b.hp = Math.max(0, b.hp - amount);
    b.hitFlash = 0.1;
    b.x = clamp(b.x + dir * knock * 0.03, 40, WORLD_W - b.w - 40);
    this.hitstop = Math.max(this.hitstop, crit ? 0.07 : 0.035);
    this.shake = Math.max(this.shake, crit ? 0.35 : 0.2);
    this.emit({ type: 'bossHit', crit, x: b.x + b.w / 2, y: b.y + b.h * 0.35 });
    this.burst(b.x + b.w / 2, b.y + b.h * 0.4, crit ? 16 : 9, '#e9c46a', 200);
    if (b.phase === 1 && b.hp <= b.maxHp * 0.5) {
      b.phase = 2;
      b.invuln = 0.4;
      this.shake = 0.7;
      this.emit({ type: 'bossPhase', name: b.name });
      this.burst(b.x + b.w / 2, b.y + b.h / 2, 26, '#ff7b3d', 280);
      if (b.kind === 'warden') this.spawnShockwaves(b);
    }
    if (b.hp <= 0) {
      b.dying = true;
      b.deathTimer = 1.25;
      this.projectiles = [];
      this.shake = 0.8;
      this.emit({ type: 'bossDie', name: b.name });
      this.burst(b.x + b.w / 2, b.y + b.h / 2, 34, '#ffb066', 300);
    }
  }

  damageBoss(n) {
    this.hurtBoss(n, 0, 1, true);
  }

  damagePlayer(amount, sourceX = 0, opts = {}) {
    const p = this.player;
    if (this.state !== 'playing' || p.invuln > 0 || p.dashTimer > 0 || p.hp <= 0) return false;
    p.hp = Math.max(0, p.hp - amount);
    p.invuln = 0.75;
    p.hitFlash = 0.25;
    p.attack = null;
    p.healing = 0;
    if (opts.knock !== false) {
      const dir = p.x + p.w / 2 < sourceX ? -1 : 1;
      p.vx = dir * 230;
      p.vy = -260;
      p.onGround = false;
    }
    this.hitstop = Math.max(this.hitstop, 0.055);
    this.shake = Math.max(this.shake, 0.4);
    this.emit({ type: 'playerHurt' });
    this.burst(p.x + p.w / 2, p.y + p.h / 2, 12, '#b84040', 200);
    if (p.hp <= 0) {
      this.state = 'dead';
      this.deathTimer = 0;
      this.emit({ type: 'death' });
      this.burst(p.x + p.w / 2, p.y + p.h / 2, 24, '#8e2f2f', 260);
    }
    return true;
  }

  // ── enemies ──────────────────────────────────────────────────────────────
  updateEnemies(dt) {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.timer > 0) e.timer -= dt;
      if (e.cooldown > 0) e.cooldown -= dt;
      const pcx = p.x + p.w / 2;
      const ecx = e.x + e.w / 2;
      const distX = pcx - ecx;
      const near = Math.abs(distX) < 260 && Math.abs(p.y + p.h - (e.y + e.h)) < 110;

      if (e.type === 'crawler') {
        if (e.state === 'hurt') {
          e.vx = 0;
          if (e.timer <= 0) e.state = 'patrol';
        } else if (near) {
          e.patrolDir = sign(distX) || e.patrolDir;
          e.vx = e.patrolDir * e.speed * 1.35;
          e.state = 'chase';
        } else {
          e.vx = e.patrolDir * e.speed;
          e.state = 'patrol';
        }
        e.facing = e.vx < 0 ? -1 : 1;
        e.x += e.vx * dt;
        if (e.x < e.minX) {
          e.x = e.minX;
          e.patrolDir = 1;
        }
        if (e.x + e.w > e.maxX) {
          e.x = e.maxX - e.w;
          e.patrolDir = -1;
        }
      } else if (e.type === 'sentinel') {
        if (e.state === 'hurt') {
          e.vx = 0;
          if (e.timer <= 0) e.state = 'patrol';
        } else if (e.state === 'windup') {
          e.vx = 0;
          if (e.timer <= 0) {
            e.state = 'lunge';
            e.timer = 0.3;
            e.vx = e.facing * 430;
            this.emit({ type: 'enemyLunge' });
          }
        } else if (e.state === 'lunge') {
          e.x += e.vx * dt;
          if (e.timer <= 0) {
            e.state = 'recover';
            e.timer = 0.55;
            e.vx = 0;
          }
        } else if (e.state === 'recover') {
          e.vx = 0;
          if (e.timer <= 0) {
            e.state = 'patrol';
            e.cooldown = 1.0;
          }
        } else {
          if (near && e.cooldown <= 0) {
            e.facing = sign(distX) || e.facing;
            e.state = 'windup';
            e.timer = 0.48;
            e.vx = 0;
            this.emit({ type: 'enemyTelegraph' });
          } else if (near) {
            e.facing = sign(distX) || e.facing;
            e.vx = e.facing * e.speed * 0.7;
          } else {
            e.vx = e.patrolDir * e.speed * 0.6;
            e.facing = e.vx < 0 ? -1 : 1;
            if (e.x < e.minX) e.patrolDir = 1;
            if (e.x + e.w > e.maxX) e.patrolDir = -1;
          }
          e.x += e.vx * dt;
        }
        e.x = clamp(e.x, e.minX, Math.max(e.minX, e.maxX - e.w));
        e.y = FLOOR_Y - e.h;
      }
    }
  }

  // ── bosses ───────────────────────────────────────────────────────────────
  updateBoss(dt) {
    const b = this.boss;
    if (!b) return;
    if (b.hitFlash > 0) b.hitFlash -= dt;
    if (b.invuln > 0) b.invuln -= dt;
    if (b.intro > 0) {
      b.intro -= dt;
      return;
    }
    if (b.dying) {
      b.deathTimer -= dt;
      if (Math.random() < 0.4) {
        this.spawnFx('spark', b.x + rand(10, b.w - 10), b.y + rand(10, b.h - 10), {
          vx: rand(-30, 30),
          vy: rand(-140, -30),
          life: rand(0.3, 0.8),
          size: rand(2, 6),
          color: '#ffb066',
        });
      }
      if (b.deathTimer <= 0) this.finishBoss();
      return;
    }
    if (b.kind === 'warden') this.updateWarden(b, dt);
    else this.updateWyrm(b, dt);
  }

  updateWarden(b, dt) {
    const p = this.player;
    const pcx = p.x + p.w / 2;
    const bcx = b.x + b.w / 2;
    const dist = Math.abs(pcx - bcx);
    const dir = sign(pcx - bcx) || b.facing;
    if (b.timer > 0) b.timer -= dt;
    if (b.cooldown > 0) b.cooldown -= dt;
    b.y = FLOOR_Y - b.h;

    switch (b.state) {
      case 'chase': {
        b.facing = dir;
        if (b.cooldown <= 0) {
          if (dist < 155) {
            b.state = 'slashWind';
            b.timer = b.phase === 2 ? 0.32 : 0.46;
            b.attackLanded = false;
            this.emit({ type: 'bossTelegraph', kind: 'slash' });
          } else {
            b.state = 'slamWind';
            b.timer = 0.66;
            b.attackLanded = false;
            this.emit({ type: 'bossTelegraph', kind: 'slam' });
          }
        } else {
          const spd = b.phase === 2 ? 118 : 78;
          if (dist > 66) b.x += dir * spd * dt;
        }
        break;
      }
      case 'slashWind': {
        b.facing = dir;
        if (b.timer <= 0) {
          b.state = 'slashActive';
          b.timer = 0.16;
          b.attackLanded = false;
          this.emit({ type: 'bossSlash' });
          this.shake = Math.max(this.shake, 0.18);
        }
        break;
      }
      case 'slashActive': {
        if (!b.attackLanded) {
          const hb = {
            x: b.facing > 0 ? b.x + b.w - 12 : b.x - 118,
            y: b.y + 8,
            w: 130,
            h: b.h - 6,
          };
          if (rectHitsRect(hb, p)) {
            b.attackLanded = true;
            this.damagePlayer(b.phase === 2 ? 26 : 19, bcx);
          }
        }
        if (b.timer <= 0) {
          b.state = 'recover';
          b.timer = 0.5;
          b.cooldown = b.phase === 2 ? 0.9 : 1.45;
          if (b.phase === 2) this.spawnShockwaves(b);
        }
        break;
      }
      case 'slamWind': {
        if (b.timer <= 0) {
          this.spawnShockwaves(b);
          b.state = 'recover';
          b.timer = 0.62;
          b.cooldown = b.phase === 2 ? 1.7 : 2.3;
          this.shake = 0.65;
          this.emit({ type: 'bossSlam' });
          this.burst(b.x + b.w / 2, FLOOR_Y - 8, 20, '#d08a4a', 260);
        }
        break;
      }
      case 'recover': {
        if (b.timer <= 0) b.state = 'chase';
        break;
      }
      default:
        b.state = 'chase';
    }
    b.x = clamp(b.x, 20, WORLD_W - b.w - 20);
  }

  spawnShockwaves(b) {
    const y = FLOOR_Y - 26;
    for (const dir of [-1, 1]) {
      this.projectiles.push({
        id: `shock_${this.time}_${dir}`,
        owner: 'boss',
        type: 'shockwave',
        x: b.x + b.w / 2 - 20,
        y,
        vx: dir * (b.phase === 2 ? 430 : 330),
        vy: 0,
        w: 46,
        h: 26,
        r: 22,
        dmg: 15,
        life: 2.6,
        warmup: 0,
      });
    }
    this.emit({ type: 'shockwave' });
  }

  updateWyrm(b, dt) {
    const p = this.player;
    const pcx = p.x + p.w / 2;
    const bcx = b.x + b.w / 2;
    b.hoverT += dt;
    if (b.timer > 0) b.timer -= dt;
    if (b.cooldown > 0) b.cooldown -= dt;

    switch (b.state) {
      case 'hover':
      case 'idle': {
        b.state = 'hover';
        const targetY = 160 + Math.sin(b.hoverT * 1.7) * 42;
        b.y += (targetY - b.y) * Math.min(1, dt * 2.2);
        const desiredX = clamp(pcx - b.w / 2 + Math.sin(b.hoverT * 0.9) * 90, 80, WORLD_W - b.w - 80);
        b.x += clamp(desiredX - b.x, -170 * dt, 170 * dt);
        b.facing = pcx < bcx ? -1 : 1;
        if (b.cooldown <= 0) {
          const patterns = b.phase === 2 ? ['volley', 'dive', 'pillars', 'volley'] : ['volley', 'dive'];
          const next = b.pattern % patterns.length;
          b.pattern += 1;
          b.state = patterns[next];
          b.attackLanded = false;
          if (b.state === 'volley') {
            b.timer = 0.5;
            b.shotsLeft = b.phase === 2 ? 5 : 3;
            b.shotTimer = 0;
            this.emit({ type: 'bossTelegraph', kind: 'volley' });
          } else if (b.state === 'dive') {
            b.state = 'diveWind';
            b.timer = 0.52;
            b.targetX = pcx;
            this.emit({ type: 'bossTelegraph', kind: 'dive' });
          } else {
            b.timer = 0.42;
            b.state = 'pillarWind';
            this.emit({ type: 'bossTelegraph', kind: 'pillars' });
          }
        }
        break;
      }
      case 'volley': {
        if (b.timer > 0) break;
        b.shotTimer -= dt;
        if (b.shotTimer <= 0 && b.shotsLeft > 0) {
          b.shotsLeft -= 1;
          b.shotTimer = 0.19;
          this.spawnFireball(b, pcx, p.y + p.h / 2);
        }
        if (b.shotsLeft <= 0) {
          b.state = 'recover';
          b.timer = 0.55;
          b.cooldown = 1.5;
        }
        break;
      }
      case 'diveWind': {
        b.facing = p.x + p.w / 2 < bcx ? -1 : 1;
        if (b.timer <= 0) {
          b.state = 'dive';
          b.targetX = p.x + p.w / 2;
          const frames = 0.42;
          b.vx = clamp((b.targetX - bcx) / frames, -420, 420);
          b.vy = 860;
          this.emit({ type: 'wyrmDive' });
        }
        break;
      }
      case 'dive': {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (!b.attackLanded && rectHitsRect(b, p)) {
          b.attackLanded = true;
          this.damagePlayer(24, bcx);
        }
        if (b.y + b.h >= FLOOR_Y - 12) {
          b.y = FLOOR_Y - 12 - b.h;
          b.state = 'rise';
          b.timer = 0.58;
          b.vy = -560;
          b.vx *= 0.3;
          this.shake = 0.55;
          this.emit({ type: 'bossSlam' });
          this.burst(b.x + b.w / 2, FLOOR_Y - 10, 18, '#d98a58', 240);
        }
        break;
      }
      case 'rise': {
        b.y += b.vy * dt;
        b.x += b.vx * dt;
        if (b.y < 210 || b.timer <= 0) {
          b.state = 'hover';
          b.cooldown = 1.1;
        }
        break;
      }
      case 'pillarWind': {
        if (b.timer <= 0) {
          const base = clamp(pcx, 120, WORLD_W - 120);
          for (const off of [-150, 0, 150]) {
            const x = clamp(base + off, 40, WORLD_W - 90);
            this.projectiles.push({
              id: `pillar_${this.time}_${off}`,
              owner: 'boss',
              type: 'pillar',
              x: x - 25,
              y: FLOOR_Y - 200,
              vx: 0,
              vy: 0,
              w: 50,
              h: 200,
              r: 25,
              dmg: 17,
              life: 1.5,
              warmup: 0.5,
            });
          }
          this.emit({ type: 'pillars' });
          b.state = 'recover';
          b.timer = 0.7;
          b.cooldown = 1.35;
        }
        break;
      }
      case 'recover': {
        const targetY = 170;
        b.y += (targetY - b.y) * Math.min(1, dt * 2);
        if (b.timer <= 0) b.state = 'hover';
        break;
      }
      default:
        b.state = 'hover';
    }
    b.x = clamp(b.x, 20, WORLD_W - b.w - 20);
    b.y = clamp(b.y, 50, FLOOR_Y - b.h - 20);
  }

  spawnFireball(b, tx, ty) {
    const sx = b.x + b.w / 2 + (b.facing > 0 ? 34 : -34);
    const sy = b.y + b.h * 0.55;
    const ang = Math.atan2(ty - sy, tx - sx);
    const speed = b.phase === 2 ? 340 : 280;
    this.projectiles.push({
      id: `fire_${this.time}_${Math.random().toString(36).slice(2, 6)}`,
      owner: 'boss',
      type: 'fireball',
      x: sx,
      y: sy,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      r: 13,
      dmg: b.phase === 2 ? 18 : 14,
      life: 3.4,
      warmup: 0,
    });
    this.emit({ type: 'fireball' });
  }

  spawnEnemyProjectile(opts) {
    const pr = {
      id: `dbg_${this.time}_${this.projectiles.length}`,
      owner: 'boss',
      type: 'fireball',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 13,
      dmg: 14,
      life: 2,
      warmup: 0,
      ...opts,
      w: (opts.r ?? 13) * 2,
      h: (opts.r ?? 13) * 2,
    };
    this.projectiles.push(pr);
    return pr;
  }

  finishBoss() {
    const b = this.boss;
    if (!b) return;
    const room = this.roomIndex;
    this.bossDefeated[room] = true;
    this.boss = null;
    this.projectiles = [];
    if (b.kind === 'warden') {
      this.awaitingBlessing = true;
      this.blessingChoices = BLESSINGS.map((x) => ({ ...x }));
      this.state = 'blessing';
      this.emit({ type: 'blessingOpen' });
    } else {
      this.state = 'victory';
      this.deathTimer = 0;
      this.emit({ type: 'victory' });
    }
    this.shake = 0.9;
  }

  chooseBlessing(index) {
    if (this.state !== 'blessing' || !this.blessingChoices) return false;
    const choice = this.blessingChoices[index];
    if (!choice) return false;
    const p = this.player;
    if (choice.id === 'iron') {
      p.maxHp += 40;
      p.hp = p.maxHp;
    } else if (choice.id === 'ember') {
      p.damageMult *= 1.3;
    } else if (choice.id === 'wind') {
      p.dashCooldownMax *= 0.65;
      p.dashIframes += 0.08;
    }
    this.blessings.push(choice.id);
    this.awaitingBlessing = false;
    this.blessingChoices = null;
    this.state = 'playing';
    this.emit({ type: 'blessingChosen', id: choice.id, name: choice.name });
    this.burst(p.x + p.w / 2, p.y + p.h / 2, 18, '#ffe2a8', 180);
    return true;
  }

  // ── projectiles, contacts, relics, gates ─────────────────────────────────
  updateProjectiles(dt) {
    const p = this.player;
    for (const pr of this.projectiles) {
      if (pr.dead) continue;
      pr.life -= dt;
      if (pr.type === 'pillar') {
        if (pr.warmup > 0) pr.warmup -= dt;
      } else {
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;
        if (pr.type === 'shockwave') {
          if (Math.random() < 0.7) {
            this.spawnFx('dust', pr.x + rand(0, pr.w), FLOOR_Y - 4, {
              vx: -pr.vx * 0.1,
              vy: rand(-70, -20),
              life: 0.3,
              size: rand(2, 5),
              color: '#b57a4a',
            });
          }
        }
        if (pr.type === 'fireball' && Math.random() < 0.6) {
          this.spawnFx('spark', pr.x, pr.y, {
            vx: rand(-30, 30),
            vy: rand(-30, 30),
            life: 0.25,
            size: rand(2, 4),
            color: '#ff9d55',
          });
        }
      }
      if (pr.x < -80 || pr.x > WORLD_W + 80 || (pr.life <= 0)) {
        pr.dead = true;
        continue;
      }
      if (pr.owner === 'boss' && pr.life > 0) {
        const box = pr.type === 'pillar' || pr.type === 'shockwave'
          ? { x: pr.x, y: pr.y, w: pr.w, h: pr.h }
          : { x: pr.x - pr.r, y: pr.y - pr.r, w: pr.r * 2, h: pr.r * 2 };
        if (pr.warmup > 0) continue;
        if (rectHitsRect(box, p)) {
          if (this.damagePlayer(pr.dmg, pr.x + (pr.w || 0) / 2)) {
            if (pr.type === 'fireball') pr.dead = true;
            this.burst(pr.x, pr.y, 10, '#ff9d55', 170);
          }
        }
      }
    }
    this.projectiles = this.projectiles.filter((pr) => !pr.dead);
  }

  checkContacts() {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (rectHitsRect(e, p)) {
        const dmg = e.type === 'sentinel' && e.state === 'lunge' ? 18 : e.dmg;
        this.damagePlayer(dmg, e.x + e.w / 2);
      }
    }
    const b = this.boss;
    if (b && !b.dying && b.intro <= 0 && rectHitsRect(b, p)) {
      this.damagePlayer(b.kind === 'wyrm' && b.state === 'dive' ? 24 : b.contact, b.x + b.w / 2);
    }
  }

  updateRelic() {
    const relic = this.room.relic;
    if (!relic || this.player.relic) return;
    const p = this.player;
    if (rectHitsRect(relic, p)) {
      this.player.relic = true;
      this.player.maxFlasks = 3;
      this.emit({ type: 'relic', name: relic.name });
      this.burst(relic.x + relic.w / 2, relic.y + relic.h / 2, 26, '#ffd98a', 230);
      this.shake = 0.3;
    }
  }

  updateGate() {
    const g = this.gate;
    if (!g || !g.open) return;
    const p = this.player;
    if (p.x + p.w > g.x + 6 && p.x < g.x + g.w + 20) {
      const next = this.roomIndex + 1;
      if (next < ROOMS.length) {
        this.emit({ type: 'gatePass' });
        this.loadRoom(next);
      }
    }
  }

  cleanup() {
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.fx = this.fx.filter((f) => f.life > 0);
  }

  updateFx(dt) {
    for (const f of this.fx) {
      f.life -= dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.type === 'spark') f.vy += 900 * dt;
      if (f.type === 'dust') f.vy += 120 * dt;
      if (f.type === 'dash') {
        f.vx *= 0.92;
        f.vy *= 0.92;
      }
    }
    this.fx = this.fx.filter((f) => f.life > 0);
    if (this.state === 'dead' || this.state === 'victory') this.deathTimer += dt;
  }

  // ── HUD helpers ──────────────────────────────────────────────────────────
  get hud() {
    const p = this.player;
    const b = this.boss;
    return {
      hp: Math.max(0, Math.round(p.hp)),
      maxHp: p.maxHp,
      flasks: p.flasks,
      relic: p.relic,
      roomIndex: this.roomIndex,
      roomName: this.room.name,
      boss: b
        ? {
            name: b.name,
            title: b.title,
            hp: Math.max(0, b.hp),
            maxHp: b.maxHp,
            phase: b.phase,
          }
        : null,
      gate: this.gate,
      hint: this.room.hint,
      blessings: [...this.blessings],
      state: this.state,
    };
  }
}

export { ATTACKS, BLESSINGS, BOSS_INFO };
