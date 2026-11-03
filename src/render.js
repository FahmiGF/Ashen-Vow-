// Canvas renderer — procedural medieval art, no external assets.
import { VIEW_W, VIEW_H, WORLD_W, FLOOR_Y, ROOMS, ATTACKS, BOSS_INFO } from './core.js';

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;

const PALETTES = [
  { top: '#0c0a09', mid: '#1b1410', low: '#2a1a11', glow: '#d07a35', fog: '#3a2a1f' },
  { top: '#090b0e', mid: '#151317', low: '#241712', glow: '#b9562f', fog: '#2c2530' },
  { top: '#120806', mid: '#24110c', low: '#3a180e', glow: '#e0913c', fog: '#4a2415' },
  { top: '#080a10', mid: '#131019', low: '#2a1214', glow: '#cf5a45', fog: '#301c25' },
];

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = 1;
    this.resize();
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    this.canvas.width = Math.round(VIEW_W * dpr);
    this.canvas.height = Math.round(VIEW_H * dpr);
  }

  render(game) {
    const ctx = this.ctx;
    const dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.imageSmoothingEnabled = true;

    const t = game.time;
    const room = ROOMS[game.roomIndex];
    const pal = PALETTES[game.roomIndex];
    const p = game.player;
    const targetCam = clamp(p.x + p.w / 2 - VIEW_W / 2, 0, WORLD_W - VIEW_W);
    const shakeAmt = game.shake;
    const sx = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt * 20 : 0;
    const sy = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt * 12 : 0;

    this.drawBackground(ctx, room, pal, targetCam, t, game);

    ctx.save();
    ctx.translate(-targetCam + sx, sy);
    this.drawGate(ctx, game, t);
    this.drawRelic(ctx, game, t);
    this.drawPlatforms(ctx, room, pal, t);
    this.drawProjectiles(ctx, game, t);
    this.drawEnemies(ctx, game, t);
    this.drawBoss(ctx, game, t);
    this.drawPlayer(ctx, game, t);
    this.drawFx(ctx, game);
    ctx.restore();

    this.drawForeground(ctx, game, pal, t, targetCam);
  }

  // ── background ───────────────────────────────────────────────────────────
  drawBackground(ctx, room, pal, camX, t, game) {
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grad.addColorStop(0, pal.top);
    grad.addColorStop(0.55, pal.mid);
    grad.addColorStop(1, pal.low);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // distant ember moon / rift
    const moonX = 760 - camX * 0.12;
    const moonY = 104;
    const halo = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 190);
    halo.addColorStop(0, this.alpha(pal.glow, 0.34));
    halo.addColorStop(0.4, this.alpha(pal.glow, 0.1));
    halo.addColorStop(1, this.alpha(pal.glow, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.beginPath();
    ctx.arc(moonX, moonY, 46, 0, Math.PI * 2);
    ctx.fillStyle = this.alpha('#e8c895', 0.22);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX - 14, moonY - 8, 38, 0, Math.PI * 2);
    ctx.fillStyle = this.alpha(pal.top, 0.55);
    ctx.fill();

    // parallax cathedral arches
    ctx.save();
    ctx.translate(-camX * 0.28, 0);
    for (let i = 0; i < 7; i++) {
      const x = i * 300 - 120;
      this.drawArch(ctx, x, 120, 190, 400, '#0f0c0b', 0.9);
      this.drawArch(ctx, x + 46, 180, 100, 350, this.alpha(pal.fog, 0.35), 1);
    }
    ctx.restore();

    // mid columns + chains
    ctx.save();
    ctx.translate(-camX * 0.55, 0);
    for (let i = 0; i < 6; i++) {
      const x = i * 360 + 80;
      ctx.fillStyle = '#0d0a09';
      ctx.fillRect(x, 80, 34, 390);
      ctx.fillStyle = this.alpha('#4a3a2c', 0.5);
      ctx.fillRect(x + 4, 80, 4, 390);
      ctx.fillStyle = '#0b0808';
      ctx.fillRect(x - 10, 70, 54, 18);
      // chain
      ctx.strokeStyle = this.alpha('#5b4d3c', 0.55);
      ctx.lineWidth = 2;
      const sway = Math.sin(t * 0.8 + i) * 6;
      ctx.beginPath();
      ctx.moveTo(x + 16, 86);
      ctx.quadraticCurveTo(x + 16 + sway, 150, x + 16 + sway, 214);
      ctx.stroke();
    }
    ctx.restore();

    // fog bands
    for (let i = 0; i < 3; i++) {
      const y = 300 + i * 70;
      const fg = ctx.createLinearGradient(0, y, 0, y + 80);
      fg.addColorStop(0, this.alpha(pal.fog, 0));
      fg.addColorStop(0.5, this.alpha(pal.fog, 0.1));
      fg.addColorStop(1, this.alpha(pal.fog, 0));
      ctx.fillStyle = fg;
      ctx.fillRect(0, y, VIEW_W, 80);
    }

    // drifting ash
    ctx.fillStyle = this.alpha('#e5b678', 0.5);
    for (let i = 0; i < 48; i++) {
      const seed = i * 97.3;
      const drift = (t * (14 + (i % 7) * 4) + seed) % (VIEW_W + 60);
      const x = VIEW_W + 30 - ((drift + i * 41) % (VIEW_W + 60));
      const y = ((seed * 3.1 + Math.sin(t * 0.7 + i) * 30) % 470) + 20;
      const s = 1 + (i % 3) * 0.7;
      ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(t * 0.9 + i));
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;
  }

  drawArch(ctx, x, y, w, h, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + w / 2);
    ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    const inset = 18;
    ctx.beginPath();
    ctx.moveTo(x + inset, y + h);
    ctx.lineTo(x + inset, y + w / 2);
    ctx.arc(x + w / 2, y + w / 2, w / 2 - inset, Math.PI, 0);
    ctx.lineTo(x + w - inset, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ── world objects ────────────────────────────────────────────────────────
  drawPlatforms(ctx, room, pal, t) {
    for (const plat of room.platforms) {
      const isFloor = plat.h > 40;
      const g = ctx.createLinearGradient(0, plat.y, 0, plat.y + plat.h);
      g.addColorStop(0, '#3a342c');
      g.addColorStop(0.12, '#292319');
      g.addColorStop(1, '#0d0b09');
      ctx.fillStyle = g;
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

      // stone top lip
      ctx.fillStyle = '#5a5040';
      ctx.fillRect(plat.x, plat.y, plat.w, 4);
      ctx.fillStyle = this.alpha('#c9b07a', 0.35);
      ctx.fillRect(plat.x, plat.y, plat.w, 2);

      // cracks / ember veins
      ctx.strokeStyle = this.alpha(pal.glow, 0.22);
      ctx.lineWidth = 1.5;
      for (let x = plat.x + 30; x < plat.x + plat.w; x += 92) {
        ctx.beginPath();
        ctx.moveTo(x, plat.y + 6);
        ctx.lineTo(x + 12, plat.y + (isFloor ? 26 : 10));
        ctx.lineTo(x + 4, plat.y + (isFloor ? 46 : 16));
        ctx.stroke();
      }
      // bricks
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      const rows = isFloor ? 3 : 1;
      for (let r = 0; r < rows; r++) {
        const y = plat.y + 8 + r * 20;
        ctx.beginPath();
        ctx.moveTo(plat.x, y);
        ctx.lineTo(plat.x + plat.w, y);
        ctx.stroke();
      }

      // torch sconces on floor platforms
      if (isFloor) {
        for (let x = plat.x + 160; x < plat.x + plat.w; x += 380) {
          this.drawTorch(ctx, x, plat.y, t);
        }
      }
    }

    // glowing chasm
    const gaps = [];
    const floorSlabs = room.platforms.filter((pl) => pl.h > 40).sort((a, b) => a.x - b.x);
    for (let i = 0; i < floorSlabs.length - 1; i++) {
      const a = floorSlabs[i];
      const b = floorSlabs[i + 1];
      if (b.x > a.x + a.w + 10) gaps.push([a.x + a.w, b.x]);
    }
    for (const [x0, x1] of gaps) {
      const g = ctx.createLinearGradient(0, FLOOR_Y, 0, VIEW_H + 120);
      g.addColorStop(0, 'rgba(6,4,3,0.9)');
      g.addColorStop(0.6, 'rgba(30,8,4,0.9)');
      g.addColorStop(1, room.id === 3 ? 'rgba(180,60,20,0.55)' : 'rgba(10,4,3,0.95)');
      ctx.fillStyle = g;
      ctx.fillRect(x0, FLOOR_Y, x1 - x0, VIEW_H + 140 - FLOOR_Y);
      if (room.id === 3) {
        ctx.fillStyle = `rgba(255,110,40,${0.18 + 0.06 * Math.sin(t * 3)})`;
        ctx.fillRect(x0, VIEW_H - 8, x1 - x0, 10);
      }
    }
  }

  drawTorch(ctx, x, floorY, t) {
    ctx.fillStyle = '#241c14';
    ctx.fillRect(x - 3, floorY - 74, 6, 74);
    ctx.fillStyle = '#4b3a25';
    ctx.fillRect(x - 9, floorY - 80, 18, 8);
    const flick = 0.7 + Math.sin(t * 9 + x) * 0.18 + Math.sin(t * 23 + x * 2) * 0.08;
    const r = 16 * flick;
    const glow = ctx.createRadialGradient(x, floorY - 88, 2, x, floorY - 88, r * 3.6);
    glow.addColorStop(0, 'rgba(255,190,100,0.5)');
    glow.addColorStop(0.5, 'rgba(220,110,40,0.16)');
    glow.addColorStop(1, 'rgba(220,110,40,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, floorY - 88, r * 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, floorY - 90, 5 + flick * 3, 12 * flick, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffcf7a';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, floorY - 92, 2.4, 7 * flick, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fff3cf';
    ctx.fill();
  }

  drawGate(ctx, game, t) {
    const g = game.gate;
    if (!g) return;
    const x = g.x;
    const y = g.y;
    const w = g.w;
    const h = g.h;

    // arch frame
    ctx.fillStyle = '#1b1712';
    ctx.beginPath();
    ctx.moveTo(x - 16, y + h);
    ctx.lineTo(x - 16, y + 32);
    ctx.quadraticCurveTo(x + w / 2, y - 34, x + w + 16, y + 32);
    ctx.lineTo(x + w + 16, y + h);
    ctx.closePath();
    ctx.fill();

    if (g.open) {
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, 'rgba(120,70,40,0.15)');
      grad.addColorStop(0.5, `rgba(255,180,100,${0.18 + 0.08 * Math.sin(t * 2.4)})`);
      grad.addColorStop(1, 'rgba(60,30,20,0.15)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + 34);
      ctx.quadraticCurveTo(x + w / 2, y + 4, x + w, y + 34);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,205,140,0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const py = y + 40 + ((t * 26 + i * 33) % (h - 50));
        ctx.globalAlpha = 0.3 + 0.3 * Math.sin(t * 2 + i);
        ctx.fillStyle = '#ffd79a';
        ctx.fillRect(x + w / 2 + Math.sin(t * 1.6 + i * 2) * 10, py, 2, 5);
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#0a0807';
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + 34);
      ctx.quadraticCurveTo(x + w / 2, y + 4, x + w, y + 34);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();
      // iron bars
      ctx.strokeStyle = '#4d453a';
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        const bx = x + 5 + i * (w - 10) / 3;
        ctx.beginPath();
        ctx.moveTo(bx, y + 20);
        ctx.lineTo(bx, y + h);
        ctx.stroke();
      }
      // rune seal
      const pulse = 0.55 + Math.sin(t * 3) * 0.25;
      ctx.strokeStyle = `rgba(200,90,60,${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h * 0.46, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 8, y + h * 0.46 - 6);
      ctx.lineTo(x + w / 2 + 8, y + h * 0.46 + 6);
      ctx.moveTo(x + w / 2 + 8, y + h * 0.46 - 6);
      ctx.lineTo(x + w / 2 - 8, y + h * 0.46 + 6);
      ctx.stroke();
    }
  }

  drawRelic(ctx, game, t) {
    const relic = game.room.relic;
    if (!relic || game.player.relic) return;
    const cx = relic.x + relic.w / 2;
    const cy = relic.y + relic.h / 2 + Math.sin(t * 2.2) * 6;
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 54);
    glow.addColorStop(0, 'rgba(255,220,150,0.55)');
    glow.addColorStop(0.4, 'rgba(230,150,60,0.18)');
    glow.addColorStop(1, 'rgba(230,150,60,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 54, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(t * 1.4) * 0.18);
    // feather / ember quill
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(13, -4, 2, 15);
    ctx.quadraticCurveTo(-3, 4, 0, -16);
    ctx.fillStyle = '#f6c87e';
    ctx.fill();
    ctx.strokeStyle = '#fff0c8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(1, 14);
    ctx.stroke();
    ctx.restore();

    // pedestal
    ctx.fillStyle = '#2a231b';
    ctx.fillRect(cx - 17, relic.y + relic.h + 4, 34, 9);
    ctx.fillStyle = '#4b3e2d';
    ctx.fillRect(cx - 22, relic.y + relic.h + 13, 44, 5);
  }

  drawProjectiles(ctx, game, t) {
    for (const pr of game.projectiles) {
      if (pr.type === 'fireball') {
        const glow = ctx.createRadialGradient(pr.x, pr.y, 2, pr.x, pr.y, pr.r * 3.2);
        glow.addColorStop(0, 'rgba(255,240,190,0.9)');
        glow.addColorStop(0.35, 'rgba(255,140,60,0.6)');
        glow.addColorStop(1, 'rgba(255,90,30,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pr.x - pr.vx * 0.02, pr.y - pr.vy * 0.02, pr.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd08a';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.r * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff8e2';
        ctx.fill();
      } else if (pr.type === 'shockwave') {
        const y = pr.y;
        ctx.save();
        ctx.translate(pr.x + pr.w / 2, y + pr.h);
        const dir = pr.vx > 0 ? 1 : -1;
        ctx.scale(dir, 1);
        ctx.beginPath();
        ctx.moveTo(-24, 0);
        ctx.lineTo(10, -pr.h - 6);
        ctx.lineTo(24, -pr.h * 0.4);
        ctx.lineTo(18, 0);
        ctx.closePath();
        ctx.fillStyle = 'rgba(230,150,80,0.45)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,200,130,0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      } else if (pr.type === 'pillar') {
        if (pr.warmup > 0) {
          const a = 1 - pr.warmup / 0.5;
          ctx.fillStyle = `rgba(220,80,40,${0.12 + a * 0.18})`;
          ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
          ctx.strokeStyle = `rgba(255,120,60,${0.3 + a * 0.5})`;
          ctx.lineWidth = 2;
          ctx.strokeRect(pr.x, pr.y, pr.w, pr.h);
        } else {
          const life = clamp(pr.life / 1.0, 0, 1);
          const grad = ctx.createLinearGradient(pr.x, pr.y, pr.x, pr.y + pr.h);
          grad.addColorStop(0, `rgba(255,180,80,${0.15 * life})`);
          grad.addColorStop(0.5, `rgba(255,120,50,${0.55 * life})`);
          grad.addColorStop(1, `rgba(255,220,140,${0.8 * life})`);
          ctx.fillStyle = grad;
          ctx.fillRect(pr.x + Math.sin(t * 18 + pr.x) * 3, pr.y, pr.w, pr.h);
          ctx.fillStyle = `rgba(255,240,200,${0.5 * life})`;
          ctx.fillRect(pr.x + pr.w / 2 - 4, pr.y, 8, pr.h);
        }
      }
    }
  }

  // ── actors ───────────────────────────────────────────────────────────────
  drawPlayer(ctx, game, t) {
    const p = game.player;
    if (game.state === 'dead' && game.deathTimer > 1.4) return;
    const cx = p.x + p.w / 2;
    const baseY = p.y + p.h;
    const flip = p.facing < 0 ? -1 : 1;

    // shadow
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx, baseY + 2, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, baseY);
    ctx.scale(flip, 1);
    if (p.invuln > 0 && p.dashTimer <= 0 && Math.floor(t * 30) % 2 === 0) ctx.globalAlpha = 0.55;

    const run = Math.abs(p.vx) > 20 && p.onGround;
    const bob = run ? Math.sin(t * 16) * 1.5 : Math.sin(t * 2.4) * 1;
    const legSwing = run ? Math.sin(t * 16) * 5 : 0;

    // cape
    ctx.beginPath();
    ctx.moveTo(2, -40);
    ctx.quadraticCurveTo(-14 - p.vx * 0.03, -26, -16 - p.vx * 0.035, -5 + bob);
    ctx.quadraticCurveTo(-4, -12, 4, -18);
    ctx.closePath();
    const capeG = ctx.createLinearGradient(-16, -40, 4, -8);
    capeG.addColorStop(0, '#6d2323');
    capeG.addColorStop(1, '#3b1414');
    ctx.fillStyle = capeG;
    ctx.fill();

    // legs
    ctx.fillStyle = '#2c3138';
    rr(ctx, -9 + legSwing, -18, 7, 18, 3);
    ctx.fill();
    rr(ctx, 3 - legSwing, -18, 7, 18, 3);
    ctx.fill();
    ctx.fillStyle = '#1b1e22';
    rr(ctx, -10 + legSwing, -4, 9, 4, 2);
    ctx.fill();
    rr(ctx, 2 - legSwing, -4, 9, 4, 2);
    ctx.fill();

    // body armor
    const body = ctx.createLinearGradient(-12, -42, 12, -16);
    body.addColorStop(0, '#aebcc7');
    body.addColorStop(0.55, '#717f8b');
    body.addColorStop(1, '#3d474f');
    ctx.fillStyle = body;
    rr(ctx, -12, -40 + bob, 24, 24, 5);
    ctx.fill();

    // tabard
    ctx.fillStyle = '#c4ad7c';
    ctx.beginPath();
    ctx.moveTo(-7, -36 + bob);
    ctx.lineTo(7, -36 + bob);
    ctx.lineTo(5, -18);
    ctx.lineTo(0, -14);
    ctx.lineTo(-5, -18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,40,30,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -35 + bob);
    ctx.lineTo(0, -17);
    ctx.stroke();

    // pauldrons
    ctx.fillStyle = '#8b99a5';
    ctx.beginPath();
    ctx.ellipse(-12, -38 + bob, 7, 5, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12, -38 + bob, 7, 5, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // head / helm
    ctx.fillStyle = '#9dabb6';
    rr(ctx, -9, -55 + bob, 18, 17, 7);
    ctx.fill();
    ctx.fillStyle = '#2a3138';
    rr(ctx, -7, -48 + bob, 15, 4, 2);
    ctx.fill();
    // eye glow
    ctx.fillStyle = '#ffb060';
    ctx.fillRect(1, -47 + bob, 5, 2);
    // plume
    ctx.beginPath();
    ctx.moveTo(-2, -55 + bob);
    ctx.quadraticCurveTo(-4, -66, -14, -63);
    ctx.quadraticCurveTo(-6, -60, -3, -54);
    ctx.fillStyle = '#b8562f';
    ctx.fill();

    // shield arm
    ctx.fillStyle = '#5c4a32';
    ctx.beginPath();
    ctx.ellipse(-13, -27, 7, 10, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a98b52';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // sword + swing arc
    const atk = p.attack;
    let angle = -0.15 + Math.sin(t * 2.2) * 0.03;
    let swordLen = 46;
    if (atk) {
      const def = ATTACKS[atk.combo];
      swordLen = atk.combo === 2 ? 56 : 46;
      const total = def.windup + def.active + def.recover;
      if (atk.t < def.windup) {
        angle = lerp(-0.2, -2.1, atk.t / def.windup);
      } else if (atk.t < def.windup + def.active) {
        const a = (atk.t - def.windup) / def.active;
        angle = lerp(-2.1, 1.25, a * (0.55 + a * 0.45));
      } else {
        const a = (atk.t - def.windup - def.active) / def.recover;
        angle = lerp(1.25, -0.15, a);
      }
      if (atk.t >= def.windup && atk.t < def.windup + def.active + 0.08) {
        ctx.save();
        const arc = ctx.createRadialGradient(6, -26, 12, 6, -26, swordLen + 26);
        arc.addColorStop(0, 'rgba(255,230,180,0)');
        arc.addColorStop(0.7, atk.combo === 2 ? 'rgba(255,150,70,0.38)' : 'rgba(230,220,200,0.28)');
        arc.addColorStop(1, 'rgba(255,220,160,0)');
        ctx.fillStyle = arc;
        ctx.beginPath();
        ctx.arc(6, -26, swordLen + 26, -2.2, angle + 0.3);
        ctx.lineTo(6, -26);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.save();
    ctx.translate(9, -28 + bob);
    ctx.rotate(angle);
    // blade
    const blade = ctx.createLinearGradient(0, 0, swordLen, 0);
    blade.addColorStop(0, '#8e9aa4');
    blade.addColorStop(0.6, '#e6edf2');
    blade.addColorStop(1, '#ffffff');
    ctx.fillStyle = blade;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(swordLen - 8, -3);
    ctx.lineTo(swordLen, 0);
    ctx.lineTo(swordLen - 8, 3);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();
    // guard + hilt
    ctx.fillStyle = '#b78b3e';
    ctx.fillRect(-2, -7, 4, 14);
    ctx.fillStyle = '#4b3427';
    ctx.fillRect(-10, -2.5, 9, 5);
    ctx.restore();

    ctx.restore();
  }

  drawEnemies(ctx, game, t) {
    for (const e of game.enemies) {
      const cx = e.x + e.w / 2;
      const feet = e.y + e.h;
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(cx, feet + 2, e.w * 0.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, feet);
      ctx.scale(e.facing, 1);
      if (e.hitFlash > 0) {
        ctx.globalCompositeOperation = 'source-over';
      }
      const flash = e.hitFlash > 0;

      if (e.type === 'crawler') {
        const wob = Math.sin(t * 12 + e.x) * 2;
        // legs
        ctx.strokeStyle = '#3a2c24';
        ctx.lineWidth = 3;
        for (let i = -2; i <= 2; i++) {
          const lx = i * 9;
          const swing = Math.sin(t * 14 + i * 1.7 + e.x) * 4;
          ctx.beginPath();
          ctx.moveTo(lx, -18);
          ctx.lineTo(lx + swing, -10);
          ctx.lineTo(lx + swing * 1.6, 0);
          ctx.stroke();
        }
        // body
        ctx.fillStyle = flash ? '#ffd9a8' : '#4a352a';
        ctx.beginPath();
        ctx.ellipse(0, -20 + wob, 22, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = flash ? '#fff' : '#33241d';
        ctx.beginPath();
        ctx.ellipse(4, -22 + wob, 12, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        // ember cracks
        ctx.strokeStyle = 'rgba(230,120,50,0.75)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-14, -24);
        ctx.lineTo(-6, -19);
        ctx.lineTo(-10, -14);
        ctx.moveTo(10, -26);
        ctx.lineTo(6, -18);
        ctx.stroke();
        // eyes
        ctx.fillStyle = '#ffb060';
        ctx.beginPath();
        ctx.arc(13, -24 + wob, 2.4, 0, Math.PI * 2);
        ctx.arc(6, -25 + wob, 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // sentinel
        const wind = e.state === 'windup';
        const lunge = e.state === 'lunge';
        const bob = Math.sin(t * 3 + e.x) * 1.2;
        // legs
        ctx.fillStyle = '#2d2b26';
        ctx.fillRect(-11, -20, 8, 20);
        ctx.fillRect(4, -20, 8, 20);
        // body
        ctx.fillStyle = flash ? '#ffe0b0' : '#5b584e';
        rr(ctx, -15, -48 + bob, 30, 30, 5);
        ctx.fill();
        ctx.strokeStyle = '#8c8068';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // rib lines
        ctx.strokeStyle = 'rgba(20,18,15,0.6)';
        ctx.beginPath();
        ctx.moveTo(-11, -40 + bob);
        ctx.lineTo(11, -40 + bob);
        ctx.moveTo(-11, -33 + bob);
        ctx.lineTo(11, -33 + bob);
        ctx.stroke();
        // helm
        ctx.fillStyle = flash ? '#fff' : '#3f3d36';
        rr(ctx, -9, -60 + bob, 18, 14, 5);
        ctx.fill();
        ctx.fillStyle = wind ? '#ff7a3a' : '#d2a253';
        ctx.fillRect(0, -55 + bob, 7, 2.5);
        // spear
        ctx.save();
        ctx.translate(13, -44 + bob);
        const sa = wind ? -0.9 : lunge ? 0.05 : -0.35;
        ctx.rotate(sa);
        ctx.fillStyle = '#4a3524';
        ctx.fillRect(0, -2, 48, 4);
        ctx.fillStyle = '#cfd8dd';
        ctx.beginPath();
        ctx.moveTo(48, -4);
        ctx.lineTo(60, 0);
        ctx.lineTo(48, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        if (wind) {
          ctx.strokeStyle = `rgba(255,120,60,${0.35 + 0.2 * Math.sin(t * 14)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(12, -30, 28, -1.2, 0.7);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  drawBoss(ctx, game, t) {
    const b = game.boss;
    if (!b) return;
    const cx = b.x + b.w / 2;
    const feet = b.y + b.h;

    if (b.kind === 'warden') this.drawWarden(ctx, game, b, t, cx, feet);
    else this.drawWyrm(ctx, game, b, t, cx, b.y + b.h / 2);

    // telegraphs
    if (b.state === 'slamWind') {
      const a = 1 - Math.min(1, b.timer / 0.66);
      ctx.strokeStyle = `rgba(255,120,50,${0.25 + a * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, FLOOR_Y, 40 + a * 150, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (b.state === 'slashWind') {
      ctx.save();
      ctx.globalAlpha = 0.28 + 0.2 * Math.sin(t * 20);
      ctx.fillStyle = '#ff7a45';
      const dir = b.facing > 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(cx, feet);
      ctx.arc(cx, feet - 40, 150, dir > 0 ? -1.1 : Math.PI - 1.1, dir > 0 ? 0.45 : Math.PI + 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    if (b.state === 'diveWind') {
      ctx.strokeStyle = `rgba(255,110,70,${0.4 + 0.25 * Math.sin(t * 18)})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(cx, feet);
      ctx.lineTo(b.targetX, FLOOR_Y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(b.targetX, FLOOR_Y - 4, 34, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawWarden(ctx, game, b, t, cx, feet) {
    const flash = b.hitFlash > 0;
    const phase2 = b.phase === 2;
    const bob = b.state === 'chase' ? Math.sin(t * 4) * 2 : 0;
    const dying = b.dying;

    ctx.save();
    ctx.globalAlpha = dying ? clamp(b.deathTimer / 1.25, 0, 1) : 1;
    // shadow
    ctx.globalAlpha *= 0.4;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx, FLOOR_Y + 2, 54, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = dying ? clamp(b.deathTimer / 1.25, 0, 1) : 1;

    ctx.translate(cx, feet);
    ctx.scale(b.facing, 1);

    // tattered cape
    ctx.beginPath();
    ctx.moveTo(-12, -96);
    ctx.quadraticCurveTo(-52, -74, -44, -8);
    ctx.lineTo(-26, -18);
    ctx.lineTo(-16, -6);
    ctx.quadraticCurveTo(0, -52, 8, -92);
    ctx.closePath();
    const cape = ctx.createLinearGradient(-44, -90, 0, -10);
    cape.addColorStop(0, '#4a1717');
    cape.addColorStop(1, '#1d0808');
    ctx.fillStyle = cape;
    ctx.fill();

    // legs
    ctx.fillStyle = '#2a2e33';
    rr(ctx, -24, -40, 18, 40, 4);
    ctx.fill();
    rr(ctx, 8, -40, 18, 40, 4);
    ctx.fill();
    ctx.fillStyle = '#171a1d';
    rr(ctx, -28, -9, 26, 9, 3);
    ctx.fill();
    rr(ctx, 4, -9, 28, 9, 3);
    ctx.fill();

    // torso
    const armor = ctx.createLinearGradient(-30, -100, 30, -34);
    armor.addColorStop(0, flash ? '#fff2d8' : '#78848d');
    armor.addColorStop(0.5, flash ? '#ffd9a0' : '#4b555e');
    armor.addColorStop(1, '#232a30');
    ctx.fillStyle = armor;
    rr(ctx, -30, -96, 60, 62, 9);
    ctx.fill();
    ctx.strokeStyle = '#a88b4b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // ember cracks in phase 2
    if (phase2) {
      ctx.strokeStyle = `rgba(255,120,45,${0.5 + 0.3 * Math.sin(t * 6)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-18, -90);
      ctx.lineTo(-6, -74);
      ctx.lineTo(-14, -58);
      ctx.moveTo(14, -88);
      ctx.lineTo(6, -70);
      ctx.lineTo(16, -52);
      ctx.stroke();
    }

    // pauldrons
    ctx.fillStyle = '#59646d';
    ctx.beginPath();
    ctx.ellipse(-32, -86, 17, 12, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(32, -86, 17, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b1904c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // helm
    ctx.fillStyle = flash ? '#fff' : '#3c454d';
    rr(ctx, -17, -126, 34, 34, 12);
    ctx.fill();
    ctx.strokeStyle = '#a88b4b';
    ctx.stroke();
    // horns
    ctx.fillStyle = '#c9b483';
    ctx.beginPath();
    ctx.moveTo(-14, -120);
    ctx.quadraticCurveTo(-34, -136, -28, -152);
    ctx.quadraticCurveTo(-16, -140, -7, -126);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(14, -120);
    ctx.quadraticCurveTo(34, -136, 28, -152);
    ctx.quadraticCurveTo(16, -140, 7, -126);
    ctx.fill();
    // visor
    ctx.fillStyle = phase2 ? '#ff7a35' : '#e2a24e';
    ctx.fillRect(-6, -116, 20, 4);
    ctx.fillStyle = 'rgba(255,200,120,0.3)';
    ctx.fillRect(-6, -115, 20, 2);

    // greatsword
    const angle = this.wardenSwordAngle(b, t);
    ctx.save();
    ctx.translate(24, -82 + bob);
    ctx.rotate(angle);
    // blade
    const blade = ctx.createLinearGradient(0, 0, 96, 0);
    blade.addColorStop(0, '#7d8992');
    blade.addColorStop(0.5, '#dfe7ec');
    blade.addColorStop(1, '#f7fbfd');
    ctx.fillStyle = blade;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(82, -5);
    ctx.lineTo(100, 0);
    ctx.lineTo(82, 5);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,60,30,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // guard
    ctx.fillStyle = '#b08c45';
    ctx.fillRect(-4, -14, 7, 28);
    ctx.fillStyle = '#3a2a1e';
    ctx.fillRect(-22, -4, 20, 8);
    ctx.restore();

    ctx.restore();
  }

  wardenSwordAngle(b, t) {
    switch (b.state) {
      case 'chase':
        return -0.5 + Math.sin(t * 2.4) * 0.05;
      case 'slashWind': {
        const prog = 1 - clamp(b.timer / (b.phase === 2 ? 0.32 : 0.46), 0, 1);
        return lerp(-0.6, -2.3, prog);
      }
      case 'slashActive':
        return 1.1;
      case 'recover':
        return lerp(1.1, -0.5, clamp(1 - b.timer / 0.5, 0, 1));
      case 'slamWind': {
        const prog = 1 - clamp(b.timer / 0.66, 0, 1);
        return lerp(-0.5, -1.7, prog);
      }
      default:
        return -0.5;
    }
  }

  drawWyrm(ctx, game, b, t, cx, cy) {
    const flash = b.hitFlash > 0;
    const phase2 = b.phase === 2;
    const dying = b.dying;
    const alpha = dying ? clamp(b.deathTimer / 1.25, 0, 1) : 1;
    const face = b.facing;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.scale(face, 1);

    // wings
    const flap = Math.sin(t * 4.2) * 0.25;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(1, side);
      ctx.rotate(0.2 + flap * side);
      ctx.beginPath();
      ctx.moveTo(-6, -10);
      ctx.quadraticCurveTo(-56, -80, -104, -40);
      ctx.quadraticCurveTo(-70, -30, -88, -8);
      ctx.quadraticCurveTo(-54, -16, -44, 2);
      ctx.quadraticCurveTo(-26, -10, -6, -10);
      const wg = ctx.createLinearGradient(-90, -50, -10, 0);
      wg.addColorStop(0, phase2 ? 'rgba(120,36,28,0.85)' : 'rgba(70,44,50,0.85)');
      wg.addColorStop(1, 'rgba(30,14,16,0.9)');
      ctx.fillStyle = wg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(190,140,100,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // segmented tail / body
    const segments = 9;
    for (let i = segments - 1; i >= 0; i--) {
      const f = i / segments;
      const sx = -12 - i * 20;
      const sy = Math.sin(t * 3.4 - i * 0.55) * (6 + i * 2.2) - i * 2;
      const r = 17 - i * 1.1;
      // membrane / body
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(5, r), 0, Math.PI * 2);
      const seg = ctx.createRadialGradient(sx - 4, sy - 4, 2, sx, sy, r);
      seg.addColorStop(0, flash ? '#fff2dc' : phase2 ? '#b4563c' : '#8a6a58');
      seg.addColorStop(0.6, flash ? '#ffd9a0' : phase2 ? '#6e2a22' : '#4b372f');
      seg.addColorStop(1, '#22120e');
      ctx.fillStyle = seg;
      ctx.fill();
      if (i % 2 === 0) {
        ctx.strokeStyle = phase2 ? 'rgba(255,120,55,0.65)' : 'rgba(220,170,110,0.32)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx - r * 0.5, sy - r * 0.5);
        ctx.lineTo(sx + r * 0.4, sy + r * 0.2);
        ctx.stroke();
      }
    }

    // neck + head
    ctx.beginPath();
    ctx.moveTo(-22, -12);
    ctx.quadraticCurveTo(12, -34, 34, -14);
    ctx.quadraticCurveTo(24, 8, -12, 10);
    ctx.closePath();
    const head = ctx.createLinearGradient(0, -30, 30, 10);
    head.addColorStop(0, flash ? '#fff' : phase2 ? '#c96848' : '#9a7863');
    head.addColorStop(1, '#2a1611');
    ctx.fillStyle = head;
    ctx.fill();

    // snout
    ctx.beginPath();
    ctx.moveTo(24, -22);
    ctx.quadraticCurveTo(64, -18, 74, -4);
    ctx.quadraticCurveTo(56, 6, 26, 2);
    ctx.closePath();
    ctx.fillStyle = flash ? '#fff' : '#7a5a48';
    ctx.fill();
    // jaw
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(66, 0);
    ctx.lineTo(50, 10);
    ctx.lineTo(28, 8);
    ctx.closePath();
    ctx.fillStyle = '#3a241c';
    ctx.fill();

    // teeth
    ctx.fillStyle = '#e8dcc0';
    for (let i = 0; i < 5; i++) {
      const x = 34 + i * 7;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 3, 5);
      ctx.lineTo(x + 6, 0);
      ctx.fill();
    }

    // eye
    const eyePulse = 0.7 + Math.sin(t * 6) * 0.3;
    const eyeG = ctx.createRadialGradient(34, -16, 1, 34, -16, 12);
    eyeG.addColorStop(0, '#fff4cf');
    eyeG.addColorStop(0.4, phase2 ? '#ff6b2e' : '#ffb04e');
    eyeG.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = eyeG;
    ctx.beginPath();
    ctx.arc(34, -16, 12 * eyePulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a0d05';
    ctx.beginPath();
    ctx.ellipse(34, -16, 2, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // horns
    ctx.strokeStyle = phase2 ? '#ffb47a' : '#c9b48c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(6, -30);
    ctx.quadraticCurveTo(-4, -50, -20, -52);
    ctx.moveTo(18, -30);
    ctx.quadraticCurveTo(16, -52, 2, -58);
    ctx.stroke();

    // maw charge glow
    if (b.state === 'volley' && b.timer > 0) {
      const a = 1 - b.timer / 0.5;
      const g = ctx.createRadialGradient(62, -4, 2, 62, -4, 22 + a * 16);
      g.addColorStop(0, 'rgba(255,240,190,0.95)');
      g.addColorStop(0.4, 'rgba(255,140,50,0.55)');
      g.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(62, -4, 22 + a * 16, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawFx(ctx, game) {
    for (const f of game.fx) {
      const a = clamp(f.life / f.maxLife, 0, 1);
      if (f.type === 'dash') {
        ctx.globalAlpha = a * 0.3;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.ellipse(f.x, f.y, f.size * a, f.size * 1.4 * a, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (f.type === 'dust') {
        ctx.globalAlpha = a * 0.5;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size * (1.4 - a * 0.4), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = a;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size * a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  drawForeground(ctx, game, pal, t, camX) {
    // vignette
    const v = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 220, VIEW_W / 2, VIEW_H / 2, 620);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.62)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // bottom haze
    const hz = ctx.createLinearGradient(0, VIEW_H - 120, 0, VIEW_H);
    hz.addColorStop(0, 'rgba(0,0,0,0)');
    hz.addColorStop(1, this.alpha(pal.glow, 0.05));
    ctx.fillStyle = hz;
    ctx.fillRect(0, VIEW_H - 120, VIEW_W, 120);

    // damage vignette when low hp
    const p = game.player;
    if (p.hp / p.maxHp < 0.34 && game.state === 'playing') {
      const pulse = 0.12 + 0.1 * Math.sin(t * 5);
      const d = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 180, VIEW_W / 2, VIEW_H / 2, 600);
      d.addColorStop(0, 'rgba(120,10,10,0)');
      d.addColorStop(1, `rgba(140,16,16,${pulse})`);
      ctx.fillStyle = d;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    // gate direction chevrons when far from gate and open
    const gate = game.gate;
    if (gate && gate.open) {
      const gateScreen = gate.x - camX;
      if (gateScreen > VIEW_W - 40) {
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4);
        ctx.fillStyle = '#e8c184';
        for (let i = 0; i < 3; i++) {
          const x = VIEW_W - 46 + i * 10;
          ctx.beginPath();
          ctx.moveTo(x, VIEW_H / 2 - 10);
          ctx.lineTo(x + 8, VIEW_H / 2);
          ctx.lineTo(x, VIEW_H / 2 + 10);
          ctx.closePath();
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }

    if (game.state === 'dead') {
      ctx.fillStyle = `rgba(40,4,4,${clamp(game.deathTimer * 0.5, 0, 0.55)})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  alpha(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
}

export const RENDER_META = { PALETTES, BOSS_INFO };
