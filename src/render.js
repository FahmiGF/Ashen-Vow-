// Canvas renderer — procedural medieval art, no external assets.
import { VIEW_W, VIEW_H, WORLD_W, FLOOR_Y, ROOMS, ATTACKS, BOSS_INFO, RACES, CHARACTERS, DEFAULT_APPEARANCE } from './core.js';

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;

const PALETTES = [
  { top: '#0c0a09', mid: '#1b1410', low: '#2a1a11', glow: '#d07a35', fog: '#3a2a1f' },
  { top: '#090b0e', mid: '#151317', low: '#241712', glow: '#b9562f', fog: '#2c2530' },
  { top: '#120806', mid: '#24110c', low: '#3a180e', glow: '#e0913c', fog: '#4a2415' },
  { top: '#080a10', mid: '#131019', low: '#2a1214', glow: '#cf5a45', fog: '#301c25' },
  { top: '#0b0907', mid: '#1d1712', low: '#2b2118', glow: '#b88c5c', fog: '#3a2d21' },
  { top: '#0a0912', mid: '#171426', low: '#241b30', glow: '#9a8fd0', fog: '#312744' },
  { top: '#0c0a08', mid: '#211a12', low: '#332515', glow: '#d6ac66', fog: '#44331f' },
  { top: '#0d0806', mid: '#25140e', low: '#3d1a10', glow: '#e8b46a', fog: '#4d2617' },
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

  render(game, opts = {}) {
    const ctx = this.ctx;
    const dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.imageSmoothingEnabled = true;

    const spectate = !!opts.spectate;
    const t = game.time;
    const room = ROOMS[game.roomIndex];
    const pal = PALETTES[game.roomIndex];
    const p = game.player;
    const followCam = clamp(p.x + p.w / 2 - VIEW_W / 2, 0, WORLD_W - VIEW_W);
    const targetCam =
      opts.cameraX === undefined ? followCam : clamp(opts.cameraX, 0, WORLD_W - VIEW_W);
    const shakeAmt = spectate ? 0 : game.shake;
    const sx = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt * 20 : 0;
    const sy = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt * 12 : 0;

    this.drawBackground(ctx, room, pal, targetCam, t, game);

    ctx.save();
    ctx.translate(-targetCam + sx, sy);
    this.drawGate(ctx, game, t);
    this.drawCheckpoint(ctx, game, t);
    this.drawRelic(ctx, game, t);
    this.drawPlatforms(ctx, room, pal, t);
    this.drawProjectiles(ctx, game, t);
    this.drawEnemies(ctx, game, t);
    this.drawBoss(ctx, game, t);
    if (!spectate) this.drawPlayer(ctx, game, t);
    this.drawFx(ctx, game);
    ctx.restore();

    this.drawForeground(ctx, game, pal, t, targetCam, spectate);
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
      const glowingChasm = room.id === 3 || room.id === 4 || room.id === 7;
      g.addColorStop(1, glowingChasm ? 'rgba(180,60,20,0.55)' : 'rgba(10,4,3,0.95)');
      ctx.fillStyle = g;
      ctx.fillRect(x0, FLOOR_Y, x1 - x0, VIEW_H + 140 - FLOOR_Y);
      if (glowingChasm) {
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

  drawCheckpoint(ctx, game, t) {
    const c = game.checkpoint;
    if (!c) return;
    const cx = c.x + c.w / 2;
    const base = c.y + c.h;
    const pulse = 0.55 + Math.sin(t * 2.4) * 0.2;

    const glow = ctx.createRadialGradient(cx, base - 30, 3, cx, base - 30, 86);
    glow.addColorStop(0, `rgba(255,196,110,${0.4 * pulse})`);
    glow.addColorStop(0.5, 'rgba(220,130,60,0.12)');
    glow.addColorStop(1, 'rgba(220,130,60,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, base - 30, 86, 0, Math.PI * 2);
    ctx.fill();

    // stone shrine
    ctx.fillStyle = '#2b241d';
    ctx.beginPath();
    ctx.moveTo(cx - 20, base);
    ctx.lineTo(cx - 14, base - 52);
    ctx.lineTo(cx - 7, base - 60);
    ctx.lineTo(cx + 7, base - 60);
    ctx.lineTo(cx + 14, base - 52);
    ctx.lineTo(cx + 20, base);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(201,162,92,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ember bowl
    ctx.fillStyle = '#4b3524';
    ctx.beginPath();
    ctx.ellipse(cx, base - 58, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    const flame = ctx.createLinearGradient(cx, base - 82, cx, base - 56);
    flame.addColorStop(0, `rgba(255,238,180,${0.9 * pulse})`);
    flame.addColorStop(0.55, 'rgba(255,146,60,0.8)');
    flame.addColorStop(1, 'rgba(180,60,20,0.15)');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(cx - 8, base - 58);
    ctx.quadraticCurveTo(cx - 9, base - 74, cx + Math.sin(t * 5) * 3, base - 84);
    ctx.quadraticCurveTo(cx + 10, base - 70, cx + 8, base - 58);
    ctx.closePath();
    ctx.fill();

    const m = game.room.merchant;
    if (m) {
      const mx = m.x + m.w / 2;
      const my = m.y + m.h;
      // merchant shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(mx, my + 2, 20, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // cloak
      ctx.fillStyle = '#3e3a2c';
      ctx.beginPath();
      ctx.moveTo(mx - 16, my);
      ctx.lineTo(mx - 11, my - 46);
      ctx.quadraticCurveTo(mx, my - 62, mx + 11, my - 46);
      ctx.lineTo(mx + 16, my);
      ctx.closePath();
      ctx.fill();
      // hood
      ctx.fillStyle = '#24211a';
      ctx.beginPath();
      ctx.ellipse(mx, my - 52, 11, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      // eyes
      ctx.fillStyle = '#ffbe76';
      ctx.fillRect(mx - 5, my - 53, 3, 2);
      ctx.fillRect(mx + 2, my - 53, 3, 2);
      // lantern
      const lx = mx + 21;
      const ly = my - 30 + Math.sin(t * 2) * 2;
      ctx.strokeStyle = '#6b5840';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx + 14, my - 48);
      ctx.lineTo(lx, ly - 10);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,190,100,${0.4 + pulse * 0.4})`;
      ctx.beginPath();
      ctx.arc(lx, ly, 7, 0, Math.PI * 2);
      ctx.fill();
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
      } else if (pr.type === 'arrow') {
        ctx.save();
        ctx.translate(pr.x, pr.y);
        ctx.scale(pr.vx < 0 ? -1 : 1, 1);
        ctx.strokeStyle = '#d9c9a2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
        ctx.fillStyle = '#e8dcc0';
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(8, -4);
        ctx.lineTo(8, 4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#9a7440';
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(-20, -4);
        ctx.moveTo(-16, 0);
        ctx.lineTo(-20, 4);
        ctx.stroke();
        ctx.restore();
      } else if (pr.type === 'shuriken') {
        ctx.save();
        ctx.translate(pr.x, pr.y);
        ctx.rotate(t * 18 * (pr.vx < 0 ? -1 : 1));
        ctx.fillStyle = '#cfd6dd';
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, -2);
          ctx.lineTo(9, 0);
          ctx.lineTo(0, 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = '#8f6d3c';
        ctx.beginPath();
        ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (pr.type === 'note') {
        const glow = ctx.createRadialGradient(pr.x, pr.y, 1, pr.x, pr.y, pr.r * 3);
        glow.addColorStop(0, 'rgba(245,235,255,0.95)');
        glow.addColorStop(0.4, 'rgba(174,145,255,0.55)');
        glow.addColorStop(1, 'rgba(110,80,220,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.r * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#efe8ff';
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(205,185,255,0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.r * 1.45, t * 4, t * 4 + Math.PI * 1.3);
        ctx.stroke();
      } else if (pr.type === 'wisp') {
        const glow = ctx.createRadialGradient(pr.x, pr.y, 1, pr.x, pr.y, pr.r * 3.4);
        glow.addColorStop(0, 'rgba(240,230,255,0.9)');
        glow.addColorStop(0.35, 'rgba(155,130,225,0.55)');
        glow.addColorStop(1, 'rgba(100,70,190,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.r * 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e9e2ff';
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (pr.type === 'beam') {
        if (pr.warmup > 0) {
          const a = 1 - pr.warmup / 0.4;
          ctx.fillStyle = `rgba(150,120,240,${0.08 + a * 0.12})`;
          ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
          ctx.strokeStyle = `rgba(205,185,255,${0.25 + a * 0.5})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 7]);
          ctx.strokeRect(pr.x, pr.y, pr.w, pr.h);
          ctx.setLineDash([]);
        } else {
          const life = clamp(pr.life / 1.25, 0, 1);
          const grad = ctx.createLinearGradient(pr.x, pr.y, pr.x, pr.y + pr.h);
          grad.addColorStop(0, `rgba(190,170,255,${0.08 * life})`);
          grad.addColorStop(0.45, `rgba(160,130,255,${0.45 * life})`);
          grad.addColorStop(1, `rgba(245,235,255,${0.85 * life})`);
          ctx.fillStyle = grad;
          ctx.fillRect(pr.x + Math.sin(t * 22 + pr.x) * 3, pr.y, pr.w, pr.h);
          ctx.fillStyle = `rgba(250,245,255,${0.62 * life})`;
          ctx.fillRect(pr.x + pr.w / 2 - 5, pr.y, 10, pr.h);
        }
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
    const look = p.appearance || DEFAULT_APPEARANCE;
    const race = RACES[look.race] || RACES.human;
    const skin = look.skin || race.skin;
    const eye = race.eye || '#ffb060';
    const armor = look.armor || 'medieval';
    const outfit = look.outfit || '#6d2323';
    const build = p.build || 1;
    ctx.scale(flip * build, build);
    if (p.invuln > 0 && p.dashTimer <= 0 && Math.floor(t * 30) % 2 === 0) ctx.globalAlpha = 0.55;

    const run = Math.abs(p.vx) > 20 && p.onGround;
    const bob = run ? Math.sin(t * 16) * 1.5 : Math.sin(t * 2.4) * 1;
    const legSwing = run ? Math.sin(t * 16) * 5 : 0;

    // cape / back cloth
    ctx.beginPath();
    ctx.moveTo(2, -40);
    ctx.quadraticCurveTo(-14 - p.vx * 0.03, -26, -16 - p.vx * 0.035, -5 + bob);
    ctx.quadraticCurveTo(-4, -12, 4, -18);
    ctx.closePath();
    const capeG = ctx.createLinearGradient(-16, -40, 4, -8);
    capeG.addColorStop(0, armor === 'royal' ? '#c9a25c' : outfit);
    capeG.addColorStop(1, armor === 'ashen' ? '#211d1a' : this.shade(outfit, -0.45));
    ctx.fillStyle = capeG;
    ctx.fill();

    // legs
    const legColor = armor === 'modern' ? '#2b3038' : armor === 'tribal' ? '#5a422c' : '#2c3138';
    ctx.fillStyle = legColor;
    rr(ctx, -9 + legSwing, -18, 7, 18, 3);
    ctx.fill();
    rr(ctx, 3 - legSwing, -18, 7, 18, 3);
    ctx.fill();
    ctx.fillStyle = armor === 'royal' ? '#6b5322' : '#1b1e22';
    rr(ctx, -10 + legSwing, -4, 9, 4, 2);
    ctx.fill();
    rr(ctx, 2 - legSwing, -4, 9, 4, 2);
    ctx.fill();

    // body per outfit style
    const body = ctx.createLinearGradient(-12, -42, 12, -16);
    if (armor === 'medieval') {
      body.addColorStop(0, '#aebcc7');
      body.addColorStop(0.55, '#717f8b');
      body.addColorStop(1, '#3d474f');
    } else if (armor === 'modern') {
      body.addColorStop(0, '#59636e');
      body.addColorStop(0.55, '#333b44');
      body.addColorStop(1, '#1b2025');
    } else if (armor === 'tribal') {
      body.addColorStop(0, '#b98a58');
      body.addColorStop(0.55, '#7c5836');
      body.addColorStop(1, '#4a3220');
    } else if (armor === 'royal') {
      body.addColorStop(0, '#f0d69a');
      body.addColorStop(0.55, '#b8913f');
      body.addColorStop(1, '#6b4f1c');
    } else {
      body.addColorStop(0, '#7b6f63');
      body.addColorStop(0.55, '#4b423a');
      body.addColorStop(1, '#26201c');
    }
    ctx.fillStyle = body;
    rr(ctx, -12, -40 + bob, 24, 24, 5);
    ctx.fill();

    // chest detail
    if (armor === 'medieval') {
      ctx.fillStyle = outfit;
      ctx.beginPath();
      ctx.moveTo(-7, -36 + bob);
      ctx.lineTo(7, -36 + bob);
      ctx.lineTo(5, -18);
      ctx.lineTo(0, -14);
      ctx.lineTo(-5, -18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(220,190,140,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -35 + bob);
      ctx.lineTo(0, -17);
      ctx.stroke();
    } else if (armor === 'modern') {
      ctx.fillStyle = outfit;
      rr(ctx, -9, -35 + bob, 18, 5, 2);
      ctx.fill();
      rr(ctx, -3, -33 + bob, 6, 15, 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(180,200,215,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-8, -40 + bob);
      ctx.lineTo(-4, -17);
      ctx.moveTo(7, -40 + bob);
      ctx.lineTo(5, -18);
      ctx.stroke();
    } else if (armor === 'tribal') {
      ctx.strokeStyle = this.alpha(outfit, 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, -36 + bob);
      ctx.lineTo(8, -30 + bob);
      ctx.moveTo(-8, -26 + bob);
      ctx.lineTo(7, -20);
      ctx.stroke();
      ctx.fillStyle = '#d8c8a0';
      ctx.beginPath();
      ctx.arc(0, -25 + bob, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (armor === 'royal') {
      ctx.strokeStyle = outfit;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, -36 + bob);
      ctx.quadraticCurveTo(0, -30 + bob, 9, -36 + bob);
      ctx.stroke();
      ctx.fillStyle = '#f5e3b0';
      rr(ctx, -3, -38 + bob, 6, 10, 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = `rgba(255,140,70,${0.35 + 0.25 * Math.sin(t * 5)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-7, -37 + bob);
      ctx.lineTo(-2, -27 + bob);
      ctx.lineTo(-6, -18);
      ctx.moveTo(6, -37 + bob);
      ctx.lineTo(2, -26 + bob);
      ctx.lineTo(7, -19);
      ctx.stroke();
    }

    // pauldrons
    const pauldron = armor === 'royal' ? '#d6b268' : armor === 'tribal' ? '#8a6238' : armor === 'modern' ? '#46505a' : armor === 'ashen' ? '#574d44' : '#8b99a5';
    ctx.fillStyle = pauldron;
    ctx.beginPath();
    ctx.ellipse(-12, -38 + bob, 7, 5, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12, -38 + bob, 7, 5, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // head and racial features
    if (race.id === 'elf') {
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.moveTo(-8, -49 + bob);
      ctx.lineTo(-19, -54 + bob);
      ctx.lineTo(-8, -43 + bob);
      ctx.moveTo(8, -49 + bob);
      ctx.lineTo(19, -54 + bob);
      ctx.lineTo(8, -43 + bob);
      ctx.fill();
    } else if (race.id === 'goblin') {
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.moveTo(-8, -48 + bob);
      ctx.lineTo(-25, -58 + bob);
      ctx.lineTo(-9, -40 + bob);
      ctx.moveTo(8, -48 + bob);
      ctx.lineTo(25, -58 + bob);
      ctx.lineTo(9, -40 + bob);
      ctx.fill();
    } else if (race.id === 'orc') {
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.moveTo(-8, -48 + bob);
      ctx.lineTo(-17, -51 + bob);
      ctx.lineTo(-8, -42 + bob);
      ctx.moveTo(8, -48 + bob);
      ctx.lineTo(17, -51 + bob);
      ctx.lineTo(8, -42 + bob);
      ctx.fill();
    }

    // face
    ctx.fillStyle = skin;
    rr(ctx, -9, -55 + bob, 18, 17, 7);
    ctx.fill();
    // eyes
    ctx.fillStyle = eye;
    ctx.fillRect(1, -47 + bob, 5, 2);
    ctx.fillStyle = 'rgba(20,16,14,0.55)';
    ctx.fillRect(-7, -47 + bob, 5, 1.4);

    // tusks / horns / headgear
    if (race.id === 'orc') {
      ctx.fillStyle = '#e8dcc0';
      ctx.beginPath();
      ctx.moveTo(-6, -41 + bob);
      ctx.lineTo(-4, -35 + bob);
      ctx.lineTo(-2, -41 + bob);
      ctx.moveTo(6, -41 + bob);
      ctx.lineTo(4, -35 + bob);
      ctx.lineTo(2, -41 + bob);
      ctx.fill();
    }
    if (race.id === 'devil') {
      ctx.fillStyle = '#3b1a16';
      ctx.beginPath();
      ctx.moveTo(-7, -55 + bob);
      ctx.quadraticCurveTo(-16, -68 + bob, -20, -57 + bob);
      ctx.quadraticCurveTo(-11, -60 + bob, -5, -53 + bob);
      ctx.moveTo(7, -55 + bob);
      ctx.quadraticCurveTo(16, -68 + bob, 20, -57 + bob);
      ctx.quadraticCurveTo(11, -60 + bob, 5, -53 + bob);
      ctx.fill();
    }

    if (armor === 'medieval') {
      ctx.fillStyle = '#9dabb6';
      ctx.beginPath();
      ctx.moveTo(-10, -53 + bob);
      ctx.quadraticCurveTo(0, -63 + bob, 10, -53 + bob);
      ctx.lineTo(10, -49 + bob);
      ctx.lineTo(-10, -49 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#6d7a85';
      ctx.fillRect(-1.5, -55 + bob, 3, 8);
    } else if (armor === 'royal') {
      ctx.fillStyle = '#e3c27a';
      ctx.beginPath();
      ctx.moveTo(-9, -54 + bob);
      ctx.lineTo(-9, -63 + bob);
      ctx.lineTo(-3, -58 + bob);
      ctx.lineTo(0, -66 + bob);
      ctx.lineTo(3, -58 + bob);
      ctx.lineTo(9, -63 + bob);
      ctx.lineTo(9, -54 + bob);
      ctx.closePath();
      ctx.fill();
    } else if (armor === 'tribal') {
      ctx.fillStyle = outfit;
      ctx.fillRect(-9, -55 + bob, 18, 3);
      ctx.strokeStyle = '#d8c8a0';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(8, -55 + bob);
      ctx.quadraticCurveTo(14, -66 + bob, 20, -62 + bob);
      ctx.stroke();
    } else if (armor === 'modern') {
      ctx.fillStyle = '#22282e';
      rr(ctx, -10, -55 + bob, 20, 6, 2);
      ctx.fill();
      ctx.fillStyle = this.alpha(eye, 0.8);
      ctx.fillRect(-6, -53 + bob, 12, 1.6);
    } else {
      // ashen hood
      ctx.fillStyle = '#3a332d';
      ctx.beginPath();
      ctx.moveTo(-11, -43 + bob);
      ctx.quadraticCurveTo(-13, -62 + bob, 0, -65 + bob);
      ctx.quadraticCurveTo(13, -62 + bob, 11, -43 + bob);
      ctx.lineTo(7, -50 + bob);
      ctx.lineTo(-7, -50 + bob);
      ctx.closePath();
      ctx.fill();
    }

    if (armor === 'medieval') {
      // plume
      ctx.beginPath();
      ctx.moveTo(-2, -55 + bob);
      ctx.quadraticCurveTo(-4, -66, -14, -63);
      ctx.quadraticCurveTo(-6, -60, -3, -54);
      ctx.fillStyle = outfit;
      ctx.fill();
    }

    // shield arm
    ctx.fillStyle = '#5c4a32';
    ctx.beginPath();
    ctx.ellipse(-13, -27, 7, 10, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a98b52';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // weapon + swing arc
    const atk = p.attack;
    const weapon = p.weapon || 'sword';
    const def = atk ? atk.def || ATTACKS[atk.combo] || ATTACKS[0] : ATTACKS[0];
    let angle = -0.15 + Math.sin(t * 2.2) * 0.03;
    let weaponLen = weapon === 'pike' ? 104 : weapon === 'bow' ? 30 : 46;
    if (atk) {
      if (weapon === 'pike') weaponLen = 112;
      else if (weapon === 'sword') weaponLen = atk.combo === 2 ? 56 : 46;
      const total = def.windup + def.active + def.recover;
      if (atk.t < def.windup) {
        angle = lerp(-0.2, -2.1, atk.t / def.windup);
      } else if (atk.t < def.windup + def.active) {
        const a = (atk.t - def.windup) / def.active;
        angle = lerp(-2.1, 1.25, a * (0.55 + a * 0.45));
      } else {
        const a = (atk.t - def.windup - def.active) / Math.max(0.001, def.recover);
        angle = lerp(1.25, -0.15, a);
      }
      if (
        weapon !== 'bow' &&
        atk.t >= def.windup &&
        atk.t < def.windup + def.active + 0.08
      ) {
        ctx.save();
        const arc = ctx.createRadialGradient(6, -26, 12, 6, -26, weaponLen + 26);
        arc.addColorStop(0, 'rgba(255,230,180,0)');
        arc.addColorStop(
          0.7,
          def.name === 'heavy' || def.name === 'pierce'
            ? 'rgba(255,150,70,0.38)'
            : 'rgba(230,220,200,0.28)',
        );
        arc.addColorStop(1, 'rgba(255,220,160,0)');
        ctx.fillStyle = arc;
        ctx.beginPath();
        ctx.arc(6, -26, weaponLen + 26, -2.2, angle + 0.3);
        ctx.lineTo(6, -26);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    if (weapon === 'bow') {
      ctx.save();
      ctx.translate(9, -28 + bob);
      ctx.rotate(atk ? angle * 0.18 - 0.1 : angle);
      ctx.strokeStyle = '#9b7640';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 25, -1.15, 1.15);
      ctx.stroke();
      ctx.strokeStyle = '#d9c9a2';
      ctx.lineWidth = 1;
      const draw = atk && atk.t < def.windup ? 5 + (atk.t / def.windup) * 8 : 4;
      ctx.beginPath();
      ctx.moveTo(11, -23);
      ctx.lineTo(11 - draw, 0);
      ctx.lineTo(11, 23);
      ctx.stroke();
      if (atk && !atk.shot) {
        ctx.strokeStyle = '#e8dcc0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(11 - draw, 0);
        ctx.lineTo(38, 0);
        ctx.stroke();
        ctx.fillStyle = '#e8dcc0';
        ctx.beginPath();
        ctx.moveTo(44, 0);
        ctx.lineTo(36, -3.5);
        ctx.lineTo(36, 3.5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(9, -28 + bob);
      ctx.rotate(angle);
      if (weapon === 'pike') {
        ctx.fillStyle = '#5a432a';
        ctx.fillRect(-12, -2.5, weaponLen - 14, 5);
        ctx.fillStyle = '#b78b3e';
        ctx.fillRect(weaponLen - 26, -5, 4, 10);
        const blade = ctx.createLinearGradient(weaponLen - 20, 0, weaponLen + 20, 0);
        blade.addColorStop(0, '#cfd8df');
        blade.addColorStop(0.7, '#f2f6f8');
        blade.addColorStop(1, '#ffffff');
        ctx.fillStyle = blade;
        ctx.beginPath();
        ctx.moveTo(weaponLen - 22, -4);
        ctx.lineTo(weaponLen + 16, -1.5);
        ctx.lineTo(weaponLen + 26, 0);
        ctx.lineTo(weaponLen + 16, 1.5);
        ctx.lineTo(weaponLen - 22, 4);
        ctx.closePath();
        ctx.fill();
      } else {
        // blade
        const blade = ctx.createLinearGradient(0, 0, weaponLen, 0);
        blade.addColorStop(0, '#8e9aa4');
        blade.addColorStop(0.6, '#e6edf2');
        blade.addColorStop(1, '#ffffff');
        ctx.fillStyle = blade;
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.lineTo(weaponLen - 8, -3);
        ctx.lineTo(weaponLen, 0);
        ctx.lineTo(weaponLen - 8, 3);
        ctx.lineTo(0, 3);
        ctx.closePath();
        ctx.fill();
        // guard + hilt
        ctx.fillStyle = '#b78b3e';
        ctx.fillRect(-2, -7, 4, 14);
        ctx.fillStyle = '#4b3427';
        ctx.fillRect(-10, -2.5, 9, 5);
      }
      ctx.restore();
    }

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
      } else if (e.type === 'wraith') {
        const drift = Math.sin(t * 2.2 + e.x * 0.02) * 5;
        const cast = e.state === 'castWind' || e.state === 'cast';
        ctx.globalAlpha = 0.82;
        // tattered lower body
        ctx.beginPath();
        ctx.moveTo(-20, -46 + drift);
        ctx.quadraticCurveTo(-29, -18, -15, -1 + drift);
        ctx.quadraticCurveTo(-4, -12, 0, -4 + drift);
        ctx.quadraticCurveTo(6, -16, 18, -2 + drift);
        ctx.quadraticCurveTo(28, -24, 19, -46 + drift);
        ctx.closePath();
        const robe = ctx.createLinearGradient(0, -62, 0, -2);
        robe.addColorStop(0, flash ? '#e8e0ff' : '#8f88a8');
        robe.addColorStop(0.55, flash ? '#c9b8ff' : '#4e4762');
        robe.addColorStop(1, 'rgba(20,17,30,0.15)');
        ctx.fillStyle = robe;
        ctx.fill();
        ctx.strokeStyle = 'rgba(180,165,230,0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
        // tattered hood
        ctx.beginPath();
        ctx.moveTo(-14, -48 + drift);
        ctx.quadraticCurveTo(-17, -70 + drift, 0, -73 + drift);
        ctx.quadraticCurveTo(17, -70 + drift, 14, -48 + drift);
        ctx.closePath();
        ctx.fillStyle = flash ? '#fff' : '#3d384d';
        ctx.fill();
        // mask
        ctx.fillStyle = '#d8cfbc';
        ctx.beginPath();
        ctx.ellipse(0, -57 + drift, 8, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#241f2e';
        ctx.beginPath();
        ctx.ellipse(-3, -58 + drift, 1.8, 3.4, 0, 0, Math.PI * 2);
        ctx.ellipse(3, -58 + drift, 1.8, 3.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // wisp in hand
        if (cast) {
          const pulse = 0.6 + Math.sin(t * 16) * 0.3;
          ctx.fillStyle = `rgba(205,185,255,${pulse})`;
          ctx.beginPath();
          ctx.arc(20, -34 + drift, 6 + pulse * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else if (e.type === 'brute') {
        const wind = e.state === 'slamWind';
        const slam = e.state === 'slam';
        const stomp = slam ? 1 : Math.sin(t * 3 + e.x) * 0.5;
        // massive legs
        ctx.fillStyle = '#30251c';
        ctx.fillRect(-24, -26, 17, 26);
        ctx.fillRect(7, -26, 17, 26);
        ctx.fillStyle = '#17110d';
        ctx.fillRect(-28, -5, 23, 5);
        ctx.fillRect(5, -5, 24, 5);
        // body
        const body = ctx.createLinearGradient(-30, -70, 30, -25);
        body.addColorStop(0, flash ? '#fff4d8' : '#a86a3d');
        body.addColorStop(0.6, flash ? '#ffd9a0' : '#67351e');
        body.addColorStop(1, '#2a150d');
        ctx.fillStyle = body;
        rr(ctx, -31, -69, 62, 45, 10);
        ctx.fill();
        ctx.strokeStyle = '#b98b4e';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // arms
        ctx.fillStyle = flash ? '#fff0c8' : '#5a2e1a';
        rr(ctx, -44, -65 - stomp * 4, 17, 36, 7);
        ctx.fill();
        rr(ctx, 27, -65 + stomp * 4, 17, 36, 7);
        ctx.fill();
        // ember seams
        ctx.strokeStyle = `rgba(255,130,50,${0.55 + 0.25 * Math.sin(t * 7)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-16, -62);
        ctx.lineTo(-4, -48);
        ctx.lineTo(-13, -34);
        ctx.moveTo(13, -61);
        ctx.lineTo(5, -45);
        ctx.lineTo(15, -31);
        ctx.stroke();
        // head
        ctx.fillStyle = flash ? '#fff' : '#4a2b19';
        rr(ctx, -17, -91, 34, 26, 8);
        ctx.fill();
        ctx.fillStyle = wind ? '#ffcf6a' : '#ff8038';
        ctx.fillRect(-10, -82, 8, 4);
        ctx.fillRect(4, -82, 8, 4);
        // horns
        ctx.fillStyle = '#c2a170';
        ctx.beginPath();
        ctx.moveTo(-14, -89);
        ctx.lineTo(-27, -101);
        ctx.lineTo(-9, -94);
        ctx.moveTo(14, -89);
        ctx.lineTo(27, -101);
        ctx.lineTo(9, -94);
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
    else if (b.kind === 'wyrm') this.drawWyrm(ctx, game, b, t, cx, b.y + b.h / 2);
    else if (b.kind === 'choir') this.drawChoir(ctx, game, b, t, cx, b.y + b.h / 2);
    else this.drawOathbreaker(ctx, game, b, t, cx, feet);

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
    if (b.state === 'beamWind') {
      ctx.strokeStyle = `rgba(185,165,255,${0.35 + 0.3 * Math.sin(t * 20)})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(b.targetX, b.y + b.h);
      ctx.lineTo(b.targetX, FLOOR_Y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(b.targetX, FLOOR_Y - 4, 40, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (b.state === 'chordWind' || b.state === 'echoWind') {
      ctx.strokeStyle = `rgba(205,185,255,${0.25 + 0.25 * Math.sin(t * 14)})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, b.y + b.h / 2, 48 + i * 32 + (t * 60) % 32, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    if (b.state === 'dashWind') {
      ctx.fillStyle = `rgba(255,150,80,${0.12 + 0.1 * Math.sin(t * 16)})`;
      ctx.fillRect(b.targetX - 50, b.y, 100, b.h);
      ctx.strokeStyle = 'rgba(255,190,120,0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.targetX - 50, b.y, 100, b.h);
    }
    if (b.state === 'novaWind') {
      const a = 1 - Math.min(1, b.timer / 0.55);
      ctx.strokeStyle = `rgba(255,140,70,${0.25 + a * 0.55})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, FLOOR_Y - 20, 50 + a * 190, 0, Math.PI * 2);
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

  drawChoir(ctx, game, b, t, cx, cy) {
    const flash = b.hitFlash > 0;
    const phase2 = b.phase === 2;
    const dying = b.dying;
    const alpha = dying ? clamp(b.deathTimer / 1.25, 0, 1) : 1;
    const drift = Math.sin(t * 1.4) * 8;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy + drift);
    ctx.scale(b.facing, 1);

    // outer spectral ring
    const ringGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, 100);
    ringGlow.addColorStop(0, phase2 ? 'rgba(220,120,180,0.2)' : 'rgba(150,130,235,0.18)');
    ringGlow.addColorStop(1, 'rgba(100,80,190,0)');
    ctx.fillStyle = ringGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, Math.PI * 2);
    ctx.fill();

    // rotating masks
    for (let i = 0; i < 6; i++) {
      const a = t * 0.55 + (Math.PI * 2 * i) / 6;
      const mx = Math.cos(a) * 66;
      const my = Math.sin(a) * 34;
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(Math.sin(a) * 0.22);
      ctx.fillStyle = flash ? '#fff4dc' : phase2 ? '#d6a0ae' : '#c9c2d8';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1424';
      ctx.beginPath();
      ctx.ellipse(-2.6, -1, 1.4, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(2.6, -1, 1.4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // floating robe
    ctx.beginPath();
    ctx.moveTo(-30, -58);
    ctx.quadraticCurveTo(-48, 8, -26, 54);
    ctx.quadraticCurveTo(-10, 30, 0, 52);
    ctx.quadraticCurveTo(12, 26, 28, 56);
    ctx.quadraticCurveTo(50, 4, 30, -58);
    ctx.closePath();
    const robe = ctx.createLinearGradient(0, -70, 0, 55);
    robe.addColorStop(0, flash ? '#fff' : phase2 ? '#b56174' : '#77719b');
    robe.addColorStop(0.5, flash ? '#ffe6f0' : phase2 ? '#63293f' : '#3b3556');
    robe.addColorStop(1, 'rgba(14,11,22,0.18)');
    ctx.fillStyle = robe;
    ctx.fill();
    ctx.strokeStyle = phase2 ? 'rgba(255,160,190,0.4)' : 'rgba(190,175,245,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // inner glowing seams
    ctx.strokeStyle = phase2
      ? `rgba(255,140,180,${0.45 + 0.3 * Math.sin(t * 5)})`
      : `rgba(180,160,255,${0.4 + 0.25 * Math.sin(t * 4)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -52);
    ctx.lineTo(-4, -20);
    ctx.lineTo(-14, 10);
    ctx.moveTo(13, -50);
    ctx.lineTo(5, -16);
    ctx.lineTo(16, 16);
    ctx.stroke();

    // hood and central mask
    ctx.beginPath();
    ctx.moveTo(-25, -44);
    ctx.quadraticCurveTo(-32, -96, 0, -108);
    ctx.quadraticCurveTo(32, -96, 25, -44);
    ctx.closePath();
    ctx.fillStyle = flash ? '#fff' : phase2 ? '#3d1c2b' : '#29243d';
    ctx.fill();
    ctx.fillStyle = flash ? '#fff' : phase2 ? '#f0c7d2' : '#ddd8e8';
    ctx.beginPath();
    ctx.ellipse(0, -72, 15, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#231b31';
    ctx.beginPath();
    ctx.ellipse(-5, -75, 2.4, 5.4, 0, 0, Math.PI * 2);
    ctx.ellipse(5, -75, 2.4, 5.4, 0, 0, Math.PI * 2);
    ctx.fill();
    // singing mouth
    ctx.fillStyle = b.state === 'beamWind' || b.state === 'chordWind' ? '#ff9bc2' : '#4c3857';
    ctx.beginPath();
    ctx.ellipse(0, -61, 4, 7 + Math.sin(t * 9) * 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // halo
    ctx.strokeStyle = phase2 ? 'rgba(255,150,180,0.75)' : 'rgba(205,190,255,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -112, 34, 9, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawOathbreaker(ctx, game, b, t, cx, feet) {
    const flash = b.hitFlash > 0;
    const phase = b.phase;
    const dying = b.dying;
    const alpha = dying ? clamp(b.deathTimer / 1.25, 0, 1) : 1;
    const bob = b.state === 'chase' ? Math.sin(t * 4.5) * 2 : 0;
    const glow = phase >= 3 ? '#ff6b3d' : phase === 2 ? '#e09a4a' : '#d8bd80';

    ctx.save();
    ctx.globalAlpha = alpha;
    // floor shadow
    ctx.globalAlpha *= 0.45;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx, FLOOR_Y + 2, 58, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha;

    ctx.translate(cx, feet);
    ctx.scale(b.facing, 1);

    // broken cape
    ctx.beginPath();
    ctx.moveTo(-10, -112);
    ctx.quadraticCurveTo(-66, -80, -58, 2);
    ctx.lineTo(-34, -18);
    ctx.lineTo(-20, 6);
    ctx.lineTo(-2, -28);
    ctx.closePath();
    const cape = ctx.createLinearGradient(-58, -100, 0, 0);
    cape.addColorStop(0, phase >= 3 ? '#7a2318' : '#4a2020');
    cape.addColorStop(1, '#140807');
    ctx.fillStyle = cape;
    ctx.fill();

    // legs and boots
    ctx.fillStyle = '#202126';
    rr(ctx, -27, -46, 20, 46, 4);
    ctx.fill();
    rr(ctx, 9, -46, 20, 46, 4);
    ctx.fill();
    ctx.fillStyle = '#0e0e10';
    rr(ctx, -32, -10, 29, 10, 3);
    ctx.fill();
    rr(ctx, 5, -10, 30, 10, 3);
    ctx.fill();

    // torso
    const armor = ctx.createLinearGradient(-34, -112, 34, -40);
    armor.addColorStop(0, flash ? '#fff5dc' : '#8b7b5d');
    armor.addColorStop(0.45, flash ? '#ffdca6' : '#46392c');
    armor.addColorStop(1, '#181410');
    ctx.fillStyle = armor;
    rr(ctx, -34, -110, 68, 68, 10);
    ctx.fill();
    ctx.strokeStyle = glow;
    ctx.lineWidth = 2;
    ctx.stroke();

    // gold ribs
    ctx.strokeStyle = `rgba(232,193,132,${0.45 + 0.2 * Math.sin(t * 3)})`;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-24, -100 + i * 15);
      ctx.quadraticCurveTo(0, -92 + i * 15, 24, -100 + i * 15);
      ctx.stroke();
    }

    // pauldrons with spikes
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.fillStyle = flash ? '#fff' : '#3a3025';
      ctx.beginPath();
      ctx.ellipse(38, -101, 21, 14, 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = glow;
      ctx.stroke();
      ctx.fillStyle = '#c6ab79';
      ctx.beginPath();
      ctx.moveTo(36, -112);
      ctx.lineTo(52, -132);
      ctx.lineTo(48, -108);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // helm with broken crown
    ctx.fillStyle = flash ? '#fff' : '#2c2724';
    rr(ctx, -20, -148, 40, 40, 12);
    ctx.fill();
    ctx.strokeStyle = glow;
    ctx.stroke();
    ctx.fillStyle = glow;
    ctx.fillRect(-10, -133, 22, 4);
    ctx.fillStyle = '#c9b07a';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 13 - 5, -148);
      ctx.lineTo(i * 13, -168 - Math.abs(i) * 3);
      ctx.lineTo(i * 13 + 5, -148);
      ctx.closePath();
      ctx.fill();
    }

    // greatsword
    const angle = b.state === 'slashActive'
      ? 1.15
      : b.state === 'slashWind'
        ? lerp(-0.7, -2.2, 1 - clamp(b.timer / (phase >= 3 ? 0.2 : phase === 2 ? 0.3 : 0.44), 0, 1))
        : -0.55 + Math.sin(t * 2.6) * 0.06;
    ctx.save();
    ctx.translate(28, -92 + bob);
    ctx.rotate(angle);
    const blade = ctx.createLinearGradient(0, 0, 112, 0);
    blade.addColorStop(0, '#6c655d');
    blade.addColorStop(0.45, '#e9ddc6');
    blade.addColorStop(1, '#fff8e8');
    ctx.fillStyle = blade;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(96, -6);
    ctx.lineTo(118, 0);
    ctx.lineTo(96, 6);
    ctx.lineTo(0, 7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = phase >= 3 ? 'rgba(255,130,70,0.8)' : 'rgba(220,180,120,0.45)';
    ctx.stroke();
    ctx.fillStyle = '#b28a48';
    ctx.fillRect(-4, -16, 8, 32);
    ctx.fillStyle = '#34251a';
    ctx.fillRect(-25, -5, 23, 10);
    ctx.restore();

    // phase III halo cracks
    if (phase >= 3) {
      ctx.strokeStyle = `rgba(255,110,60,${0.45 + 0.3 * Math.sin(t * 8)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -130, 54, -2.5, -0.6);
      ctx.arc(0, -130, 54, 0.6, 2.5);
      ctx.stroke();
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

  drawForeground(ctx, game, pal, t, camX, spectate = false) {
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
    if (!spectate && p.hp / p.maxHp < 0.34 && game.state === 'playing') {
      const pulse = 0.12 + 0.1 * Math.sin(t * 5);
      const d = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 180, VIEW_W / 2, VIEW_H / 2, 600);
      d.addColorStop(0, 'rgba(120,10,10,0)');
      d.addColorStop(1, `rgba(140,16,16,${pulse})`);
      ctx.fillStyle = d;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    // gate direction chevrons when far from gate and open
    const gate = game.gate;
    if (!spectate && gate && gate.open) {
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

  drawCharacterPreview(ctx, appearance, characterId, t) {
    const dpr = ctx.getTransform().a || 1;
    const w = ctx.canvas.width / dpr;
    const h = ctx.canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w / 2, h * 0.42, 8, w / 2, h * 0.42, w * 0.6);
    glow.addColorStop(0, 'rgba(208,122,53,0.16)');
    glow.addColorStop(1, 'rgba(208,122,53,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.9, w * 0.22, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    const fake = {
      state: 'playing',
      deathTimer: 0,
      player: {
        x: 0,
        y: 0,
        w: 30,
        h: 46,
        vx: 0,
        vy: 0,
        facing: 1,
        onGround: true,
        attack: null,
        weapon: 'sword',
        invuln: 0,
        dashTimer: 0,
        characterId,
        build: CHARACTERS[characterId]?.build || 1,
        appearance,
      },
    };
    ctx.save();
    ctx.translate(w / 2, h * 0.9);
    const scale = Math.min(w / 120, h / 150) * (CHARACTERS[characterId]?.build || 1);
    ctx.scale(scale, scale);
    this.drawPlayer(ctx, fake, t);
    ctx.restore();
  }

  shade(hex, amount) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    const clampByte = (v) => Math.max(0, Math.min(255, Math.round(v)));
    const r = clampByte(((n >> 16) & 255) * (1 + amount));
    const g = clampByte(((n >> 8) & 255) * (1 + amount));
    const b = clampByte((n & 255) * (1 + amount));
    return `rgb(${r},${g},${b})`;
  }

  alpha(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
}

export const RENDER_META = { PALETTES, BOSS_INFO };
