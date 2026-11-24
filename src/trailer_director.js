// Live-footage director for the cinematic trailer.
//
// Each scene cut in src/trailer.js names a real room. The director loads it
// into a private AshenGame, lets a scripted actor play it through the real
// fixed-step simulation, renders it with the real Renderer into an offscreen
// canvas, and composites it into the trailer frame with the cut's camera move
// and colour grade. Seeking resets the cut and re-simulates to the requested
// moment, so scrubbing always lands on believable footage.
//
// It only runs while the trailer screen is open; gameplay never pays for it.

import { trailerCamera, trailerSimTime, TRAILER_GRADES } from './trailer.js';

const STEP = 1 / 120;
const MAX_STEPS_PER_FRAME = 900;

export class TrailerDirector {
  constructor({ Renderer, AshenGame, viewW = 960, viewH = 540, worldW = 2400 } = {}) {
    this.Renderer = Renderer;
    this.AshenGame = AshenGame;
    this.viewW = viewW;
    this.viewH = viewH;
    this.worldW = worldW;
    this.renderer = null;
    this.key = '';
    this.game = null;
    this.simTime = 0;
    this.frame = 0;
    this.stats = { builds: 0, steps: 0, lastPaintMs: 0 };
  }

  ensure(w, h) {
    if (typeof document === 'undefined' || !this.Renderer || !this.AshenGame) return false;
    if (!this.renderer) {
      const canvas = document.createElement('canvas');
      this.renderer = new this.Renderer(canvas);
      this.renderer.options = { ...this.renderer.options, shakeScale: 0.35, particleScale: 1, qualityBias: 70 };
    }
    const r = this.renderer;
    const dpr = w / this.viewW;
    if (r.dpr !== dpr || r.canvas.width !== Math.round(w) || r.canvas.height !== Math.round(h)) {
      r.dpr = dpr;
      r.canvas.width = Math.round(this.viewW * dpr);
      r.canvas.height = Math.round(this.viewH * dpr);
    }
    return true;
  }

  build(cut) {
    const game = new this.AshenGame();
    game.enterRoom(cut.room);
    game.bossIntro = 0;
    const b = game.boss;
    if (b) {
      b.intro = 0;
      if (Number.isFinite(cut.bossHp)) {
        // Drive the boss through its real phase transitions.
        const target = Math.max(1, Math.round(b.maxHp * cut.bossHp));
        game.hurtBoss(Math.max(0, b.hp - target), 0, 1);
        b.invuln = 0;
        b.hitFlash = 0;
      }
    }
    if (cut.clear) {
      // An emptied room: the summit after the last oath is broken.
      game.enemies = [];
      game.boss = null;
      game.projectiles = [];
    }
    if (Number.isFinite(cut.playerX)) game.player.x = cut.playerX;
    game.events.length = 0;
    this.game = game;
    this.simTime = 0;
    this.frame = 0;
    this.stats.builds += 1;
  }

  /** Scripted actor: approach the threat, strike, hop and dash like a player. */
  actorInput(game, mode) {
    const p = game.player;
    const input = { left: false, right: false, jump: false, attack: false, dash: false };
    this.frame += 1;
    if (mode === 'stand') return input;
    const px = p.x + p.w / 2;
    let target = null;
    if (game.boss && !game.boss.dying) target = { x: game.boss.x + game.boss.w / 2, y: game.boss.y + game.boss.h / 2 };
    else {
      let best = Infinity;
      for (const e of game.enemies) {
        if (e.dead) continue;
        const d = Math.abs(e.x + e.w / 2 - px);
        if (d < best) {
          best = d;
          target = { x: e.x + e.w / 2, y: e.y + e.h / 2 };
        }
      }
    }
    if (mode === 'advance' && !target) target = { x: px + 300, y: p.y };
    if (!target) return input;
    const dx = target.x - px;
    const dy = target.y - (p.y + p.h / 2);
    const reach = mode === 'advance' ? 40 : 78;
    if (Math.abs(dx) > reach) {
      input.right = dx > 0;
      input.left = dx < 0;
    } else if (this.frame % 40 < 6) {
      // Step back a little between combos so the fight reads.
      input.left = dx > 0;
      input.right = dx < 0;
    }
    if (Math.abs(dx) < 120) input.attack = this.frame % 22 < 2;
    if (dy < -60 || this.frame % 170 === 0) input.jump = this.frame % 30 < 14;
    if (Math.abs(dx) > 260 && this.frame % 150 < 2) input.dash = true;
    return input;
  }

  advance(cut, target) {
    const game = this.game;
    let steps = 0;
    while (this.simTime + STEP <= target && steps < MAX_STEPS_PER_FRAME) {
      const p = game.player;
      // Footage, not a fight to the death: the actor and the boss both survive
      // the cut, and gates never pull the camera into another room.
      p.hp = p.maxHp;
      game.gateLock = 999;
      if (game.boss && game.boss.hp < game.boss.maxHp * 0.06) game.boss.hp = Math.round(game.boss.maxHp * 0.06);
      if (game.state !== 'playing') game.state = 'playing';
      game.update(STEP, this.actorInput(game, cut.actor));
      game.events.length = 0;
      this.simTime += STEP;
      steps += 1;
    }
    this.stats.steps += steps;
  }

  focusPoint(game, focus) {
    const p = game.player;
    if (focus === 'boss' && game.boss) return { x: game.boss.x + game.boss.w / 2, y: game.boss.y + game.boss.h * 0.45 };
    if (focus === 'enemy') {
      const e = game.enemies.find((n) => !n.dead);
      if (e) return { x: e.x + e.w / 2, y: e.y + e.h / 2 };
    }
    return { x: p.x + p.w / 2, y: p.y + p.h / 2 };
  }

  /**
   * Paint the live frame for `info` (from trailerShotAt). Returns false when
   * live footage is unavailable so the caller can fall back to a plate.
   */
  paint(ctx, w, h, info, { reducedMotion = false } = {}) {
    const started = typeof performance !== 'undefined' ? performance.now() : 0;
    const cutInfo = info.cut;
    if (!cutInfo || !this.ensure(w, h)) return false;
    const { cut, key, local, progress } = cutInfo;
    const target = trailerSimTime(cut, local);
    if (key !== this.key || !this.game || target + 1e-6 < this.simTime) {
      this.key = key;
      this.build(cut);
    }
    this.advance(cut, target);

    const game = this.game;
    const cam = trailerCamera(cut, progress);
    const zoom = reducedMotion ? 1 : cam.zoom;
    const focus = this.focusPoint(game, cam.focus);
    const camX = Math.max(0, Math.min(this.worldW - this.viewW, focus.x - this.viewW / 2 + cam.pan));
    const r = this.renderer;
    r.render(game, { cameraX: camX });

    // Sky: the renderer paints it as a CSS gradient on its own canvas element.
    const stops = String(r.canvas.style.background || '').match(/#[0-9a-f]{3,8}|rgba?\([^)]*\)/gi) || ['#1a120c', '#0c0907'];
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    stops.forEach((color, i) => sky.addColorStop(stops.length === 1 ? 0 : i / (stops.length - 1), color));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Camera: scale around the focus point's screen position, with a slow
    // handheld drift. Clamp so the frame never shows past the world edges.
    const scale = w / this.viewW;
    const fx = (focus.x - camX) * scale;
    const fy = focus.y * scale;
    const t = info.local;
    const driftX = reducedMotion ? 0 : Math.sin(t * 0.9) * 4 + Math.sin(t * 2.3) * 1.5;
    const driftY = reducedMotion ? 0 : Math.cos(t * 0.7) * 3;
    const dw = w * zoom;
    const dh = h * zoom;
    let dx = fx - fx * zoom + driftX;
    let dy = fy - fy * zoom + driftY;
    dx = Math.min(0, Math.max(w - dw, dx));
    dy = Math.min(0, Math.max(h - dh, dy));

    const grade = TRAILER_GRADES[cut.grade || info.shot.grade] || null;
    ctx.save();
    if (grade && 'filter' in ctx) ctx.filter = grade.filter;
    ctx.drawImage(r.canvas, dx, dy, dw, dh);
    ctx.restore();
    if (grade) {
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = grade.washAlpha;
      ctx.fillStyle = grade.wash;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
    // Anamorphic streak across the brightest band of the frame.
    const streak = ctx.createLinearGradient(0, h * 0.44, 0, h * 0.56);
    streak.addColorStop(0, 'rgba(255,220,170,0)');
    streak.addColorStop(0.5, `rgba(255,220,170,${0.05 + 0.03 * Math.sin(t * 1.7)})`);
    streak.addColorStop(1, 'rgba(255,220,170,0)');
    ctx.fillStyle = streak;
    ctx.fillRect(0, h * 0.44, w, h * 0.12);

    if (started) this.stats.lastPaintMs = performance.now() - started;
    return true;
  }

  reset() {
    this.key = '';
    this.game = null;
    this.simTime = 0;
  }
}

/** A small tile of film grain, generated once. */
export function makeGrainTile(size = 96) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  let s = 1234567;
  for (let i = 0; i < img.data.length; i += 4) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    const v = (s >>> 0) % 255;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
