// Portrait studio for the illustrated Index and the class roster.
//
// Portraits are painted with the game's own renderer: a private AshenGame
// spawns the enemy or boss, the shared Renderer draws it into an offscreen
// canvas, and the result is framed with a lit backdrop and stored as a small
// WebP data URL. Nothing here runs per frame. Each portrait is painted once,
// on demand, and the browser can drop decoded images it no longer shows.

const POSE_TIME = 1.3;

/** Which drawn weapon reads best for each class in a still portrait. */
export const CLASS_WEAPON = { lyna: 'bow', retiarius: 'pike', warden: 'pike', worldroot_druid: 'pike' };

function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

function rgba(hex, a) {
  const h = String(hex || '#c9a25c').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0').slice(0, 6);
  const n = parseInt(full, 16) || 0;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export class PortraitStudio {
  constructor({ Renderer, AshenGame, characters = {} } = {}) {
    this.Renderer = Renderer;
    this.AshenGame = AshenGame;
    this.characters = characters;
    this.cache = new Map();
    this.renderer = null;
    this.game = null;
    this.canvas = null;
  }

  ensure() {
    if (this.renderer) return true;
    if (typeof document === 'undefined' || !this.Renderer || !this.AshenGame) return false;
    const scratch = document.createElement('canvas');
    this.renderer = new this.Renderer(scratch);
    // The renderer sizes its own canvas to the view; the studio only borrows
    // its draw methods, so release that backing store immediately.
    scratch.width = 1;
    scratch.height = 1;
    this.game = new this.AshenGame();
    this.canvas = document.createElement('canvas');
    return true;
  }

  get size() {
    return this.cache.size;
  }

  /** Data URL for an enemy or boss portrait (cached by category/id/size). */
  creature(category, id, accent, size = 176) {
    const key = `${category}:${id}:${size}`;
    if (this.cache.has(key)) return this.cache.get(key);
    if (!this.ensure()) return '';
    let url = '';
    try {
      url = this.paint(size, accent, `${category}:${id}`, (ctx, box) => this.drawCreature(ctx, category, id, box));
    } catch {
      url = this.paint(size, accent, `${category}:${id}`, (ctx, box) => this.drawGlyph(ctx, category === 'bosses' ? '♜' : '◈', accent, box));
    }
    this.cache.set(key, url);
    return url;
  }

  /** Data URL for a playable class in its saved or default appearance. */
  hero(characterId, appearance, accent, size = 176) {
    const look = appearance || this.characters[characterId]?.appearance || {};
    const key = `hero:${characterId}:${look.race}:${look.armor}:${look.skin}:${look.outfit}:${size}`;
    if (this.cache.has(key)) return this.cache.get(key);
    if (!this.ensure()) return '';
    const url = this.paint(size, accent, `hero:${characterId}`, (ctx, box) => {
      const build = this.characters[characterId]?.build || 1;
      const fake = {
        state: 'playing',
        deathTimer: 0,
        player: {
          x: 0, y: -46, w: 30, h: 46, vx: 0, vy: 0, facing: 1, onGround: true,
          attack: null, weapon: CLASS_WEAPON[characterId] || 'sword', invuln: 0, dashTimer: 0,
          characterId, build, appearance: look,
        },
      };
      const scale = Math.min((box.h * 0.5) / (46 * build), 3.2) * build;
      ctx.translate(box.cx, box.floor);
      ctx.scale(scale, scale);
      ctx.translate(-15 - 6, 0);
      this.renderer.drawPlayer(ctx, fake, POSE_TIME);
    });
    this.cache.set(key, url);
    return url;
  }

  /** Emblem portrait for weapons and items. */
  emblem(kind, glyph, accent, size = 176) {
    const key = `emblem:${kind}:${glyph}:${size}`;
    if (this.cache.has(key)) return this.cache.get(key);
    if (!this.ensure()) return '';
    const url = this.paint(size, accent, key, (ctx, box) => {
      if (kind === 'sword' || kind === 'pike' || kind === 'bow') this.drawWeapon(ctx, kind, accent, box);
      else this.drawGlyph(ctx, glyph, accent, box);
    });
    this.cache.set(key, url);
    return url;
  }

  paint(size, accent, seedKey, drawSubject) {
    const c = this.canvas;
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const box = { w: size, h: size, cx: size / 2, floor: size * 0.84 };
    this.drawBackdrop(ctx, accent, box, seedKey);
    ctx.save();
    drawSubject(ctx, box);
    ctx.restore();
    this.drawForeground(ctx, accent, box);
    try {
      const webp = c.toDataURL('image/webp', 0.86);
      if (webp.startsWith('data:image/webp')) return webp;
    } catch {
      /* fall through */
    }
    return c.toDataURL('image/png');
  }

  drawBackdrop(ctx, accent, box, seedKey) {
    const { w, h, cx, floor } = box;
    const base = ctx.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, '#120d09');
    base.addColorStop(0.65, '#0b0806');
    base.addColorStop(1, '#050403');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    const halo = ctx.createRadialGradient(cx, h * 0.5, 4, cx, h * 0.5, w * 0.62);
    halo.addColorStop(0, rgba(accent, 0.38));
    halo.addColorStop(0.5, rgba(accent, 0.12));
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);

    // Soft key light falling from the upper left.
    ctx.save();
    ctx.globalAlpha = 0.16;
    const shaft = ctx.createLinearGradient(w * 0.15, 0, w * 0.55, h);
    shaft.addColorStop(0, '#fff1cf');
    shaft.addColorStop(1, 'rgba(255,241,207,0)');
    ctx.fillStyle = shaft;
    ctx.beginPath();
    ctx.moveTo(w * 0.08, 0);
    ctx.lineTo(w * 0.42, 0);
    ctx.lineTo(w * 0.78, h);
    ctx.lineTo(w * 0.36, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Deterministic dust motes so each portrait has its own texture.
    const rand = rng(hashString(seedKey));
    for (let i = 0; i < 14; i++) {
      ctx.globalAlpha = 0.15 + rand() * 0.35;
      ctx.fillStyle = rand() < 0.5 ? accent : '#f3dfb5';
      ctx.beginPath();
      ctx.arc(rand() * w, rand() * h * 0.8, 0.6 + rand() * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Stone dais with a rune ring.
    const dais = ctx.createRadialGradient(cx, floor, 2, cx, floor, w * 0.42);
    dais.addColorStop(0, rgba(accent, 0.3));
    dais.addColorStop(0.6, 'rgba(30,22,15,0.55)');
    dais.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = dais;
    ctx.beginPath();
    ctx.ellipse(cx, floor, w * 0.42, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba(accent, 0.5);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.ellipse(cx, floor, w * 0.3, h * 0.045, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawForeground(ctx, accent, box) {
    const { w, h } = box;
    const vignette = ctx.createRadialGradient(w / 2, h * 0.48, w * 0.3, w / 2, h * 0.48, w * 0.78);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
    const fog = ctx.createLinearGradient(0, h * 0.78, 0, h);
    fog.addColorStop(0, 'rgba(0,0,0,0)');
    fog.addColorStop(1, rgba(accent, 0.16));
    ctx.fillStyle = fog;
    ctx.fillRect(0, h * 0.78, w, h * 0.22);
  }

  drawCreature(ctx, category, id, box) {
    const game = this.game;
    game.time = POSE_TIME;
    let ent;
    if (category === 'bosses') {
      game.boss = null;
      ent = game.spawnBoss(id);
      if (!ent) throw new Error(`unknown boss ${id}`);
      ent.intro = 0;
      ent.facing = -1;
      ent.state = 'idle';
      game.boss = ent;
    } else {
      game.enemies = [];
      ent = game.spawnEnemy({ type: id, x: 400 });
      ent.facing = 1;
    }
    // Art overhangs the hitbox (horns, wings, weapons), so fit with headroom.
    const boss = category === 'bosses';
    const artW = ent.w * (boss ? 1.8 : 1.5);
    const artH = ent.h * (boss ? 1.6 : 1.4);
    const scale = Math.min((box.w * 0.82) / artW, (box.h * 0.74) / artH, 3.4);
    const lift = ent.flying ? box.h * 0.1 : 0;
    ctx.translate(box.cx, box.floor - lift);
    ctx.scale(scale, scale);
    ctx.translate(-(ent.x + ent.w / 2), -(ent.y + ent.h));
    if (category === 'bosses') this.renderer.drawBoss(ctx, game, POSE_TIME);
    else this.renderer.drawEnemies(ctx, game, POSE_TIME);
    game.enemies = [];
    game.boss = null;
    game.projectiles = [];
    game.fx = [];
    game.events = [];
  }

  drawGlyph(ctx, glyph, accent, box) {
    const { cx, h } = box;
    const r = h * 0.26;
    const cy = h * 0.48;
    ctx.fillStyle = 'rgba(14,10,7,0.9)';
    ctx.strokeStyle = rgba(accent, 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i + Math.PI / 8;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#f6e3b4';
    ctx.font = `${Math.round(r * 1.05)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph || '✦', cx, cy + 1);
    ctx.shadowBlur = 0;
  }

  drawWeapon(ctx, kind, accent, box) {
    const { cx, h } = box;
    ctx.translate(cx, h * 0.5);
    ctx.rotate(-Math.PI / 4);
    ctx.shadowColor = rgba(accent, 0.8);
    ctx.shadowBlur = 12;
    const steel = ctx.createLinearGradient(-6, 0, 6, 0);
    steel.addColorStop(0, '#8d97a0');
    steel.addColorStop(0.5, '#f1f4f6');
    steel.addColorStop(1, '#6c757d');
    if (kind === 'sword') {
      ctx.fillStyle = steel;
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.36);
      ctx.lineTo(6, -h * 0.3);
      ctx.lineTo(6, h * 0.12);
      ctx.lineTo(-6, h * 0.12);
      ctx.lineTo(-6, -h * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c9a25c';
      ctx.fillRect(-20, h * 0.12, 40, 6);
      ctx.fillStyle = '#4a2f1d';
      ctx.fillRect(-4, h * 0.12 + 6, 8, h * 0.14);
      ctx.fillStyle = '#e4c27f';
      ctx.beginPath();
      ctx.arc(0, h * 0.28 + 8, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'pike') {
      ctx.fillStyle = '#5b3a22';
      ctx.fillRect(-3, -h * 0.26, 6, h * 0.64);
      ctx.fillStyle = steel;
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.42);
      ctx.lineTo(9, -h * 0.26);
      ctx.lineTo(0, -h * 0.22);
      ctx.lineTo(-9, -h * 0.26);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c9a25c';
      ctx.fillRect(-7, -h * 0.22, 14, 5);
    } else {
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = '#7a4c2a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(-h * 0.08, 0, h * 0.32, -Math.PI / 2.4, Math.PI / 2.4);
      ctx.stroke();
      ctx.strokeStyle = '#efe2c4';
      ctx.lineWidth = 1.2;
      const a = Math.PI / 2.4;
      ctx.beginPath();
      ctx.moveTo(-h * 0.08 + Math.cos(-a) * h * 0.32, Math.sin(-a) * h * 0.32);
      ctx.lineTo(-h * 0.08 + Math.cos(a) * h * 0.32, Math.sin(a) * h * 0.32);
      ctx.stroke();
      ctx.strokeStyle = '#d8d0c0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-h * 0.14, 0);
      ctx.lineTo(h * 0.3, 0);
      ctx.stroke();
      ctx.fillStyle = steel;
      ctx.beginPath();
      ctx.moveTo(h * 0.34, 0);
      ctx.lineTo(h * 0.28, -5);
      ctx.lineTo(h * 0.28, 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}

/**
 * Paint queued portraits during idle time so opening a 262-entry Index never
 * blocks a frame. Each task returns a URL and is applied to its <img>.
 */
export function createPortraitQueue(budgetMs = 8) {
  const tasks = [];
  let scheduled = false;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const schedule = (fn) => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(fn, { timeout: 120 });
    else setTimeout(fn, 16);
  };
  const run = () => {
    scheduled = false;
    const start = now();
    while (tasks.length && now() - start < budgetMs) {
      const { img, make } = tasks.shift();
      if (!img.isConnected || img.src) continue;
      const url = make();
      if (url) img.src = url;
    }
    if (tasks.length) {
      scheduled = true;
      schedule(run);
    }
  };
  return {
    push(img, make) {
      tasks.push({ img, make });
      if (!scheduled) {
        scheduled = true;
        schedule(run);
      }
    },
    clear() {
      tasks.length = 0;
    },
    get pending() {
      return tasks.length;
    },
  };
}
