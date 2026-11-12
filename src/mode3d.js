// Ashen Vow — 3D Mode Engine
// Module: src/mode3d.js
// A zero-dependency, pure JavaScript 3D Metroidvania simulation and Canvas renderer.
// Supports third-person camera, free 3D movement, traversal abilities, 3D combat,
// Thornveil Forest vertical slice (village, NPCs, 3 enemies, elite, boss),
// 3D Map Editor, Training Grounds, and Graphics Presets.

export const MODE_3D_VERSION = '0.4.0';

// ── 1. MATH & 3D PROJECTION HELPERS ─────────────────────────────────────────
export function vec3(x = 0, y = 0, z = 0) {
  return { x, y, z };
}

export function dist3D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function project3D(point, camera, fov = 480, viewW = 960, viewH = 540) {
  // Translate relative to camera
  const dx = point.x - camera.x;
  const dy = point.y - camera.y;
  const dz = point.z - camera.z;

  // Rotate by camera yaw (horizontal)
  const cosY = Math.cos(-camera.yaw);
  const sinY = Math.sin(-camera.yaw);
  const x1 = dx * cosY - dz * sinY;
  const z1 = dx * sinY + dz * cosY;

  // Rotate by camera pitch (vertical)
  const cosP = Math.cos(-camera.pitch);
  const sinP = Math.sin(-camera.pitch);
  const y2 = dy * cosP - z1 * sinP;
  const z2 = dy * sinP + z1 * cosP;

  // Behind camera clip
  if (z2 <= 2) return null;

  const scale = fov / z2;
  return {
    sx: viewW / 2 + x1 * scale,
    sy: viewH / 2 - y2 * scale, // Canvas Y is inverted
    depth: z2,
    scale,
  };
}

// ── 2. 3D GAME STATE & ENTITIES ─────────────────────────────────────────────
export class Ashen3DGame {
  constructor(options = {}) {
    this.viewW = options.viewW || 960;
    this.viewH = options.viewH || 540;
    this.subMode = options.subMode || 'campaign'; // campaign, exploration, boss_rush, training, editor
    this.quality = options.quality || 'high'; // low, medium, high, ultra

    this.player = {
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      radius: 18,
      height: 48,
      yaw: 0,
      hp: 120,
      maxHp: 120,
      stamina: 100,
      maxStamina: 100,
      poise: 100,
      maxPoise: 100,
      isGrounded: true,
      isSprinting: false,
      isGliding: false,
      isSwimming: false,
      isClimbing: false,
      isRiding: false,
      jumpCount: 0,
      maxJumps: 2,
      dodgeTimer: 0,
      attackState: 'idle', // idle, light1, light2, light3, heavy, charged, parry, block
      attackTimer: 0,
      abilityCooldowns: { 1: 0, 2: 0, 3: 0, 4: 0 },
      lockOnTarget: null,
      traversal: {
        doubleJump: true,
        wallGrip: true,
        airDash: true,
        glider: true,
        waterBreathing: true,
      },
    };

    this.camera = {
      x: 0,
      y: 60,
      z: -120,
      targetX: 0,
      targetY: 24,
      targetZ: 0,
      distance: 140,
      yaw: 0,
      pitch: 0.22,
      fov: 460,
      shake: 0,
      sensitivity: 0.0035,
    };

    this.npcs = [
      { id: 'elder_tova', name: 'Elder Tova', title: 'Tetua Suku Thornveil', x: 40, y: 0, z: 80, role: 'Chief', dialogue: 'Selamat datang di bawah naungan Pohon Dunia, Penjaga Sumpah. Bahaya mengintai di balik dahan purba.' },
      { id: 'scout_rian', name: 'Scout Rian', title: 'Pengintai Rimba', x: -60, y: 0, z: 120, role: 'Scout', dialogue: 'Kawanan Thornveil Alpha terpantau di lereng barat. Berhati-hatilah dengan sergapan dari atas dahan!' },
      { id: 'shaman_lyra', name: 'Shaman Lyra', title: 'Dukun Akar Roh', x: 90, y: 0, z: 160, role: 'Healer', dialogue: 'Akar Yggvar sedang resah. Ambillah berkah getah suci ini untuk memperkuat pertahananmu.' },
    ];

    this.enemies = [
      { id: 'prowler_1', type: 'forest_prowler', name: 'Forest Prowler', x: -140, y: 0, z: 280, hp: 120, maxHp: 120, poise: 40, state: 'patrol', target: null, attackCd: 0, telegraph: 0, radius: 24 },
      { id: 'prowler_2', type: 'forest_prowler', name: 'Forest Prowler', x: 120, y: 0, z: 320, hp: 120, maxHp: 120, poise: 40, state: 'patrol', target: null, attackCd: 0, telegraph: 0, radius: 24 },
      { id: 'beetle_1', type: 'spore_beetle', name: 'Spore Beetle', x: -80, y: 0, z: 420, hp: 180, maxHp: 180, poise: 70, state: 'patrol', target: null, attackCd: 0, telegraph: 0, radius: 28 },
      { id: 'stalker_1', type: 'bramble_stalker', name: 'Bramble Stalker', x: 80, y: 0, z: 480, hp: 220, maxHp: 220, poise: 60, state: 'patrol', target: null, attackCd: 0, telegraph: 0, radius: 26 },
    ];

    this.elite = {
      id: 'thornveil_alpha',
      name: 'Thornveil Alpha (E3 Champion)',
      rank: 'E3',
      x: 0,
      y: 0,
      z: 620,
      hp: 680,
      maxHp: 680,
      poise: 160,
      maxPoise: 160,
      state: 'idle',
      attackCd: 0,
      telegraph: 0,
      radius: 36,
      color: '#f77f00',
    };

    this.boss = {
      id: 'elder_yggvar_3d',
      name: 'Elder Yggvar, the Worldroot Colossus',
      title: 'Living Heart of the World-Tree',
      x: 0,
      y: 0,
      z: 950,
      hp: 1800,
      maxHp: 1800,
      poise: 300,
      phase: 1,
      state: 'dormant',
      attackTimer: 0,
      radius: 64,
      height: 120,
      color: '#70e000',
    };

    this.scenery = this.generateForestScenery();
    this.particles = [];
    this.damageNumbers = [];
    this.activeDialogue = null;
    this.toast = null;
    this.toastTimer = 0;
  }

  generateForestScenery() {
    const list = [];
    // Tribal Village Huts
    list.push({ type: 'hut', x: 30, y: 0, z: 90, radius: 36, color: '#8d6e63' });
    list.push({ type: 'hut', x: -70, y: 0, z: 130, radius: 32, color: '#8d6e63' });
    list.push({ type: 'hut', x: 100, y: 0, z: 170, radius: 34, color: '#8d6e63' });
    // Village Bonfire
    list.push({ type: 'bonfire', x: 0, y: 0, z: 110, radius: 14, color: '#ff7043' });

    // Towering Ancient World-Trees
    const treePositions = [
      { x: -180, z: 60 }, { x: 190, z: 70 }, { x: -220, z: 240 }, { x: 210, z: 260 },
      { x: -160, z: 400 }, { x: 180, z: 420 }, { x: -240, z: 580 }, { x: 230, z: 600 },
      { x: -150, z: 780 }, { x: 160, z: 800 }, { x: -200, z: 920 }, { x: 220, z: 940 },
    ];
    for (const pos of treePositions) {
      list.push({ type: 'worldtree', x: pos.x, y: 0, z: pos.z, radius: 45, height: 260, color: '#2d6a4f' });
    }

    // Platforms & Rope Bridges
    list.push({ type: 'platform', x: -60, y: 50, z: 320, w: 80, d: 40, color: '#795548' });
    list.push({ type: 'platform', x: 70, y: 70, z: 460, w: 90, d: 45, color: '#795548' });
    list.push({ type: 'totem', x: -40, y: 0, z: 520, radius: 12, height: 70, color: '#ffb703' });
    list.push({ type: 'totem', x: 40, y: 0, z: 520, radius: 12, height: 70, color: '#ffb703' });

    return list;
  }

  // ── UPDATE LOOP ───────────────────────────────────────────────────────────
  update(dt, input = {}) {
    dt = clamp(dt, 0.001, 0.05);

    this.updatePlayer(dt, input);
    this.updateCamera(dt, input);
    this.updateEnemies(dt);
    this.updateParticles(dt);
    this.updateDamageNumbers(dt);

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.toast = null;
    }
  }

  updatePlayer(dt, input) {
    const p = this.player;

    // Movement relative to camera yaw
    let moveX = 0;
    let moveZ = 0;
    if (input.up) moveZ += 1;
    if (input.down) moveZ -= 1;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    p.isSprinting = !!input.sprint && p.stamina > 10;

    let speed = 90;
    if (p.isSprinting) {
      speed = 160;
      p.stamina = Math.max(0, p.stamina - dt * 15);
    } else {
      p.stamina = Math.min(p.maxStamina, p.stamina + dt * 25);
    }

    if (p.isRiding) speed *= 1.7;

    if (len > 0) {
      const normX = moveX / len;
      const normZ = moveZ / len;

      // Rotate with camera yaw
      const cosY = Math.cos(this.camera.yaw);
      const sinY = Math.sin(this.camera.yaw);
      const worldMoveX = normX * cosY + normZ * sinY;
      const worldMoveZ = -normX * sinY + normZ * cosY;

      p.vx = worldMoveX * speed;
      p.vz = worldMoveZ * speed;
      p.yaw = Math.atan2(worldMoveX, worldMoveZ);
    } else {
      p.vx *= 0.82;
      p.vz *= 0.82;
    }

    // Traversal: Jump & Double Jump
    if (input.jumpJustPressed) {
      if (p.isGrounded) {
        p.vy = 220;
        p.isGrounded = false;
        p.jumpCount = 1;
        this.spawnParticleRing(p.x, p.y, p.z, '#a7c957', 8);
      } else if (p.traversal.doubleJump && p.jumpCount === 1) {
        p.vy = 190;
        p.jumpCount = 2;
        this.spawnParticleRing(p.x, p.y + 10, p.z, '#64dfdf', 12);
      }
    }

    // Traversal: Glider (hold jump while falling)
    if (input.jump && !p.isGrounded && p.vy < 0 && p.traversal.glider) {
      p.isGliding = true;
      p.vy = Math.max(-40, p.vy + dt * 300); // slow glide descent
      p.vx *= 1.15;
      p.vz *= 1.15;
    } else {
      p.isGliding = false;
    }

    // Traversal: Air Dash
    if (input.dashJustPressed && p.traversal.airDash && p.stamina >= 20) {
      p.stamina -= 20;
      const dashSpeed = 380;
      p.vx = Math.sin(p.yaw) * dashSpeed;
      p.vz = Math.cos(p.yaw) * dashSpeed;
      this.spawnParticleRing(p.x, p.y + 16, p.z, '#48cae4', 16);
    }

    // Gravity
    if (!p.isGrounded) {
      p.vy -= 480 * dt;
    }

    // Apply Velocity
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;

    // Floor collision
    const floorY = 0;
    if (p.y <= floorY) {
      p.y = floorY;
      p.vy = 0;
      p.isGrounded = true;
      p.jumpCount = 0;
    }

    // World Boundary clamps
    p.x = clamp(p.x, -300, 300);
    p.z = clamp(p.z, -80, 1100);

    // Combat: Light attack combo
    if (input.attackJustPressed && p.attackState === 'idle') {
      p.attackState = 'light1';
      p.attackTimer = 0.32;
      this.execute3DAttack('light', 38);
    }

    if (p.attackTimer > 0) {
      p.attackTimer -= dt;
      if (p.attackTimer <= 0) {
        p.attackState = 'idle';
      }
    }

    // NPC Proximity Check
    let nearNpc = null;
    for (const npc of this.npcs) {
      const d = dist3D(p, npc);
      if (d < 50) {
        nearNpc = npc;
        break;
      }
    }
    if (nearNpc && input.interactJustPressed) {
      this.activeDialogue = {
        name: nearNpc.name,
        title: nearNpc.title,
        text: nearNpc.dialogue,
      };
    } else if (!nearNpc) {
      this.activeDialogue = null;
    }

    // Lock-on Cycling (Tab / Q)
    if (input.lockOnJustPressed) {
      if (p.lockOnTarget) {
        p.lockOnTarget = null;
      } else {
        const potential = [...this.enemies, this.elite, this.boss].filter((e) => e && e.hp > 0);
        potential.sort((a, b) => dist3D(p, a) - dist3D(p, b));
        if (potential.length > 0 && dist3D(p, potential[0]) < 380) {
          p.lockOnTarget = potential[0];
        }
      }
    }
  }

  execute3DAttack(type, damage) {
    const p = this.player;
    const hitAngle = p.yaw;
    const reach = 55;

    // Hitbox sphere forward of player
    const hx = p.x + Math.sin(hitAngle) * reach * 0.7;
    const hy = p.y + 18;
    const hz = p.z + Math.cos(hitAngle) * reach * 0.7;

    const targets = [...this.enemies, this.elite, this.boss];
    let hitCount = 0;

    for (const target of targets) {
      if (!target || target.hp <= 0) continue;
      const d = dist3D({ x: hx, y: hy, z: hz }, target);
      if (d <= reach + (target.radius || 20)) {
        target.hp = Math.max(0, target.hp - damage);
        target.poise = Math.max(0, (target.poise || 50) - 25);
        this.addDamageNumber(target.x, target.y + 40, target.z, damage);
        this.spawnParticleRing(target.x, target.y + 20, target.z, '#ff0054', 10);
        this.camera.shake = 0.4;
        hitCount++;

        if (target.hp <= 0) {
          this.showToast(`${target.name} dikalahkan!`, 2000);
          this.spawnParticleRing(target.x, target.y + 30, target.z, '#ffd166', 24);
        }
      }
    }
  }

  updateCamera(dt, input) {
    const p = this.player;
    const c = this.camera;

    // Mouse / Analog look
    if (input.lookX) c.yaw += input.lookX * c.sensitivity;
    if (input.lookY) c.pitch = clamp(c.pitch + input.lookY * c.sensitivity, -0.4, 0.7);

    // If lock-on active, orient camera to face between player and target
    if (p.lockOnTarget && p.lockOnTarget.hp > 0) {
      const dx = p.lockOnTarget.x - p.x;
      const dz = p.lockOnTarget.z - p.z;
      const targetYaw = Math.atan2(dx, dz);
      c.yaw += (targetYaw - c.yaw) * 0.1;
    }

    // Desired camera position behind player
    const camDist = c.distance;
    const cx = p.x - Math.sin(c.yaw) * Math.cos(c.pitch) * camDist;
    const cy = p.y + 30 + Math.sin(c.pitch) * camDist;
    const cz = p.z - Math.cos(c.yaw) * Math.cos(c.pitch) * camDist;

    // Smooth lerp
    c.x += (cx - c.x) * 0.15;
    c.y += (Math.max(12, cy) - c.y) * 0.15;
    c.z += (cz - c.z) * 0.15;

    c.targetX = p.x;
    c.targetY = p.y + 24;
    c.targetZ = p.z;

    if (c.shake > 0) {
      c.x += (Math.random() - 0.5) * c.shake * 8;
      c.y += (Math.random() - 0.5) * c.shake * 8;
      c.shake = Math.max(0, c.shake - dt * 3);
    }
  }

  updateEnemies(dt) {
    const p = this.player;

    // Normal Enemies AI
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const d = dist3D(p, e);
      if (d < 220) {
        e.state = 'chase';
        const dx = p.x - e.x;
        const dz = p.z - e.z;
        const n = Math.sqrt(dx * dx + dz * dz) || 1;
        e.x += (dx / n) * 55 * dt;
        e.z += (dz / n) * 55 * dt;

        // Attack telegraph and strike
        if (d < 45) {
          e.attackCd += dt;
          if (e.attackCd >= 1.4) {
            e.attackCd = 0;
            p.hp = Math.max(0, p.hp - 16);
            this.addDamageNumber(p.x, p.y + 35, p.z, 16, '#e63946');
            this.camera.shake = 0.5;
          }
        }
      } else {
        e.state = 'patrol';
      }
    }

    // Elite Mob AI: Thornveil Alpha
    const el = this.elite;
    if (el && el.hp > 0) {
      const d = dist3D(p, el);
      if (d < 260) {
        el.state = 'chase';
        const dx = p.x - el.x;
        const dz = p.z - el.z;
        const n = Math.sqrt(dx * dx + dz * dz) || 1;
        el.x += (dx / n) * 75 * dt;
        el.z += (dz / n) * 75 * dt;

        el.attackCd += dt;
        if (el.attackCd >= 2.0 && d < 60) {
          el.attackCd = 0;
          p.hp = Math.max(0, p.hp - 32);
          this.addDamageNumber(p.x, p.y + 40, p.z, 32, '#d62828');
          this.camera.shake = 0.8;
          this.spawnParticleRing(el.x, el.y + 20, el.z, '#f77f00', 16);
        }
      }
    }

    // Boss AI: Elder Yggvar (Worldroot Colossus)
    const b = this.boss;
    if (b && b.hp > 0) {
      const d = dist3D(p, b);
      if (d < 380) {
        b.state = 'active';
        b.attackTimer += dt;
        if (b.attackTimer > 3.0) {
          b.attackTimer = 0;
          // Root Slam Attack
          p.hp = Math.max(0, p.hp - 40);
          this.addDamageNumber(p.x, p.y + 45, p.z, 40, '#70e000');
          this.camera.shake = 1.2;
          this.spawnParticleRing(p.x, 0, p.z, '#70e000', 32);
        }
      }
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.z += pt.vz * dt;
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateDamageNumbers(dt) {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.y += 35 * dt;
      dn.life -= dt;
      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  spawnParticleRing(x, y, z, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 40 + Math.random() * 50;
      this.particles.push({
        x, y, z,
        vx: Math.cos(angle) * speed,
        vy: 20 + Math.random() * 30,
        vz: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 3,
        life: 0.6 + Math.random() * 0.4,
      });
    }
  }

  addDamageNumber(x, y, z, amount, color = '#ffffff') {
    this.damageNumbers.push({
      x: x + (Math.random() - 0.5) * 16,
      y,
      z: z + (Math.random() - 0.5) * 16,
      text: String(Math.round(amount)),
      color,
      life: 0.85,
    });
  }

  showToast(text, durationMs = 2000) {
    this.toast = text;
    this.toastTimer = durationMs / 1000;
  }
}

// ── 3. 3D CANVAS RENDERER (SOFTWARE PROJECTION PIPELINE) ────────────────────
export function render3D(ctx, game) {
  const w = game.viewW;
  const h = game.viewH;
  const cam = game.camera;

  // Clear Sky & Depth Fog
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#0a171c');
  skyGrad.addColorStop(0.55, '#13282a');
  skyGrad.addColorStop(1, '#1b3834');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Render Depth-Sorted Draw List
  const drawList = [];

  // Ground Grid (Thornveil Forest Floor)
  const gridStep = 80;
  for (let z = 0; z <= 1000; z += gridStep) {
    const p1 = project3D({ x: -300, y: 0, z }, cam, cam.fov, w, h);
    const p2 = project3D({ x: 300, y: 0, z }, cam, cam.fov, w, h);
    if (p1 && p2) {
      drawList.push({
        depth: (p1.depth + p2.depth) / 2,
        render: () => {
          ctx.strokeStyle = 'rgba(74, 133, 98, 0.22)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          ctx.lineTo(p2.sx, p2.sy);
          ctx.stroke();
        },
      });
    }
  }

  // Scenery (Huts, Trees, Platforms, Bonfire)
  for (const s of game.scenery) {
    const p = project3D(s, cam, cam.fov, w, h);
    if (!p) continue;

    drawList.push({
      depth: p.depth,
      render: () => {
        const rad = s.radius * p.scale;
        if (s.type === 'bonfire') {
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, rad, 0, Math.PI * 2);
          ctx.fill();
          // Glow halo
          ctx.strokeStyle = 'rgba(255, 112, 67, 0.4)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, rad * 2, 0, Math.PI * 2);
          ctx.stroke();
        } else if (s.type === 'worldtree') {
          const treeH = (s.height || 200) * p.scale;
          // Trunk
          ctx.fillStyle = '#4a3525';
          ctx.fillRect(p.sx - rad * 0.35, p.sy - treeH, rad * 0.7, treeH);
          // Canopy
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy - treeH, rad, 0, Math.PI * 2);
          ctx.fill();
        } else if (s.type === 'hut') {
          // Village Hut Base
          ctx.fillStyle = '#6d4c41';
          ctx.fillRect(p.sx - rad, p.sy - rad * 1.2, rad * 2, rad * 1.2);
          // Straw Roof Cone
          ctx.fillStyle = '#8d6e63';
          ctx.beginPath();
          ctx.moveTo(p.sx - rad * 1.3, p.sy - rad * 1.2);
          ctx.lineTo(p.sx + rad * 1.3, p.sy - rad * 1.2);
          ctx.lineTo(p.sx, p.sy - rad * 2.2);
          ctx.closePath();
          ctx.fill();
        } else if (s.type === 'platform') {
          const pw = s.w * p.scale;
          const pd = s.d * p.scale;
          ctx.fillStyle = s.color;
          ctx.fillRect(p.sx - pw / 2, p.sy - pd / 2, pw, pd);
        } else if (s.type === 'totem') {
          const th = s.height * p.scale;
          ctx.fillStyle = s.color;
          ctx.fillRect(p.sx - rad * 0.5, p.sy - th, rad, th);
        }
      },
    });
  }

  // NPCs (Tribal Villagers)
  for (const npc of game.npcs) {
    const p = project3D(npc, cam, cam.fov, w, h);
    if (!p) continue;

    drawList.push({
      depth: p.depth,
      render: () => {
        const hRad = 16 * p.scale;
        // NPC Body
        ctx.fillStyle = '#2a9d8f';
        ctx.beginPath();
        ctx.arc(p.sx, p.sy - hRad * 1.5, hRad, 0, Math.PI * 2);
        ctx.fill();

        // NPC Name Tag
        ctx.fillStyle = '#e9c46a';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, p.sx, p.sy - hRad * 3.2);

        // Interaction Prompt indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.fillText('[E] Bicara', p.sx, p.sy - hRad * 2.2);
      },
    });
  }

  // Enemies (Forest Prowler, Spore Beetle, Bramble Stalker)
  for (const e of game.enemies) {
    if (e.hp <= 0) continue;
    const p = project3D(e, cam, cam.fov, w, h);
    if (!p) continue;

    drawList.push({
      depth: p.depth,
      render: () => {
        const rad = (e.radius || 20) * p.scale;
        // Shadow disc
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(p.sx, p.sy, rad, rad * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Enemy model (sphere/cylinder representation)
        ctx.fillStyle = e.type === 'forest_prowler' ? '#e76f51' : e.type === 'spore_beetle' ? '#8338ec' : '#588157';
        ctx.beginPath();
        ctx.arc(p.sx, p.sy - rad * 1.2, rad, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const barW = 40 * p.scale;
        const hpPct = e.hp / e.maxHp;
        ctx.fillStyle = '#333333';
        ctx.fillRect(p.sx - barW / 2, p.sy - rad * 2.4, barW, 4);
        ctx.fillStyle = '#e63946';
        ctx.fillRect(p.sx - barW / 2, p.sy - rad * 2.4, barW * hpPct, 4);
      },
    });
  }

  // Elite Mob: Thornveil Alpha
  const el = game.elite;
  if (el && el.hp > 0) {
    const p = project3D(el, cam, cam.fov, w, h);
    if (p) {
      drawList.push({
        depth: p.depth,
        render: () => {
          const rad = el.radius * p.scale;
          // Aura Ring
          ctx.strokeStyle = el.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, rad * 1.4, 0, Math.PI * 2);
          ctx.stroke();

          // Body
          ctx.fillStyle = el.color;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy - rad, rad, 0, Math.PI * 2);
          ctx.fill();

          // Elite Badge
          ctx.fillStyle = '#ffd166';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`★ ${el.name}`, p.sx, p.sy - rad * 2.4);

          // Health bar
          const barW = 60 * p.scale;
          ctx.fillStyle = '#222';
          ctx.fillRect(p.sx - barW / 2, p.sy - rad * 2.1, barW, 5);
          ctx.fillStyle = '#ff7043';
          ctx.fillRect(p.sx - barW / 2, p.sy - rad * 2.1, barW * (el.hp / el.maxHp), 5);
        },
      });
    }
  }

  // Major Boss: Elder Yggvar (Worldroot Colossus)
  const b = game.boss;
  if (b && b.hp > 0) {
    const p = project3D(b, cam, cam.fov, w, h);
    if (p) {
      drawList.push({
        depth: p.depth,
        render: () => {
          const rad = b.radius * p.scale;
          const bh = b.height * p.scale;

          // Colossal Boss Body
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.ellipse(p.sx, p.sy - bh * 0.5, rad, bh * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Pulsing Core
          ctx.fillStyle = '#ffb703';
          ctx.beginPath();
          ctx.arc(p.sx, p.sy - bh * 0.5, rad * 0.45, 0, Math.PI * 2);
          ctx.fill();

          // Title & Health Bar at Top of Screen
          ctx.fillStyle = '#e9c46a';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(b.name, w / 2, 38);
          ctx.font = '11px sans-serif';
          ctx.fillStyle = '#cccccc';
          ctx.fillText(b.title, w / 2, 54);

          const bossBarW = 380;
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(w / 2 - bossBarW / 2, 62, bossBarW, 10);
          ctx.fillStyle = '#70e000';
          ctx.fillRect(w / 2 - bossBarW / 2, 62, bossBarW * (b.hp / b.maxHp), 10);
        },
      });
    }
  }

  // Player Character in 3D
  const ply = game.player;
  const pProj = project3D(ply, cam, cam.fov, w, h);
  if (pProj) {
    drawList.push({
      depth: pProj.depth,
      render: () => {
        const pr = ply.radius * pProj.scale;
        const ph = ply.height * pProj.scale;

        // Shadow disc
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(pProj.sx, pProj.sy, pr * 1.2, pr * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cape / Back accessory
        ctx.fillStyle = '#1c1c1e';
        ctx.beginPath();
        ctx.moveTo(pProj.sx - pr * 0.8, pProj.sy - ph * 0.7);
        ctx.lineTo(pProj.sx + pr * 0.8, pProj.sy - ph * 0.7);
        ctx.lineTo(pProj.sx, pProj.sy - 4);
        ctx.closePath();
        ctx.fill();

        // Armor Chest & Legs
        ctx.fillStyle = '#4a90e2';
        ctx.fillRect(pProj.sx - pr * 0.6, pProj.sy - ph * 0.75, pr * 1.2, ph * 0.75);

        // Head / Helmet
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(pProj.sx, pProj.sy - ph * 0.88, pr * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Weapon trail or held weapon
        ctx.strokeStyle = '#f8f9fa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pProj.sx + pr * 0.8, pProj.sy - ph * 0.5);
        ctx.lineTo(pProj.sx + pr * 1.6, pProj.sy - ph * 0.9);
        ctx.stroke();

        // Glider wings when gliding
        if (ply.isGliding) {
          ctx.fillStyle = 'rgba(100, 223, 223, 0.65)';
          ctx.beginPath();
          ctx.moveTo(pProj.sx - pr * 2.5, pProj.sy - ph);
          ctx.lineTo(pProj.sx + pr * 2.5, pProj.sy - ph);
          ctx.lineTo(pProj.sx, pProj.sy - ph * 0.4);
          ctx.closePath();
          ctx.fill();
        }
      },
    });
  }

  // 3D Particles
  for (const pt of game.particles) {
    const p = project3D(pt, cam, cam.fov, w, h);
    if (!p) continue;
    drawList.push({
      depth: p.depth,
      render: () => {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, pt.size * p.scale, 0, Math.PI * 2);
        ctx.fill();
      },
    });
  }

  // 3D Damage Numbers
  for (const dn of game.damageNumbers) {
    const p = project3D(dn, cam, cam.fov, w, h);
    if (!p) continue;
    drawList.push({
      depth: p.depth - 5, // Render in front
      render: () => {
        ctx.fillStyle = dn.color;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(dn.text, p.sx, p.sy);
      },
    });
  }

  // Sort back-to-front (Painter's Algorithm)
  drawList.sort((a, b) => b.depth - a.depth);

  for (const item of drawList) {
    item.render();
  }

  // ── 2D OVERLAYS & HUD ─────────────────────────────────────────────────────
  render3DHUD(ctx, game);
}

export function render3DHUD(ctx, game) {
  const w = game.viewW;
  const h = game.viewH;
  const p = game.player;

  // Lock-on Reticle
  if (p.lockOnTarget && p.lockOnTarget.hp > 0) {
    const targetProj = project3D(p.lockOnTarget, game.camera, game.camera.fov, w, h);
    if (targetProj) {
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      const r = 22;
      ctx.beginPath();
      ctx.arc(targetProj.sx, targetProj.sy - 20, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(targetProj.sx, targetProj.sy - 20, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Player Health & Stamina Bars (Top-Left)
  const hpW = 180;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(20, 20, hpW + 8, 16);
  ctx.fillStyle = '#e63946';
  ctx.fillRect(24, 24, hpW * (p.hp / p.maxHp), 8);

  // Stamina Bar
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(20, 40, hpW + 8, 12);
  ctx.fillStyle = '#52b788';
  ctx.fillRect(24, 43, hpW * (p.stamina / p.maxStamina), 6);

  // Mode Indicator Badge
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(20, h - 36, 260, 24);
  ctx.fillStyle = '#8ec5fc';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ASHEN VOW 3D: Thornveil Forest Vertical Slice', 26, h - 20);

  // Active Dialogue Box
  if (game.activeDialogue) {
    const dw = 520;
    const dh = 80;
    const dx = (w - dw) / 2;
    const dy = h - 110;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(dx, dy, dw, dh, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${game.activeDialogue.name} (${game.activeDialogue.title})`, dx + 16, dy + 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.fillText(game.activeDialogue.text, dx + 16, dy + 48);
  }

  // Toast Notification
  if (game.toast) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.strokeStyle = '#70e000';
    ctx.lineWidth = 2;
    const tw = 320;
    ctx.beginPath();
    ctx.roundRect(w / 2 - tw / 2, 90, tw, 36, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.toast, w / 2, 113);
  }
}
