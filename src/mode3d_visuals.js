// Ashen Vow — illustrated 3D presentation layer.
// The engine is a dependency-free Canvas 2D software projection renderer, so
// "models" are hand-built procedural meshes: layered silhouettes, lit planes,
// material bands, articulated limbs, cloth, bark, metal, and foliage. No plain
// rectangles or colored balls are used as final character/environment art.
import { MODE3D_REGIONS } from './mode3d.js';

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function project(point, game) {
  const camera = game.camera;
  const viewW = game.viewW;
  const viewH = game.viewH;
  const dx = point.x - camera.x;
  const dy = point.y - camera.y;
  const dz = point.z - camera.z;
  const cosY = Math.cos(-camera.yaw);
  const sinY = Math.sin(-camera.yaw);
  const x1 = dx * cosY - dz * sinY;
  const z1 = dx * sinY + dz * cosY;
  const cosP = Math.cos(-camera.pitch);
  const sinP = Math.sin(-camera.pitch);
  const y2 = dy * cosP - z1 * sinP;
  const z2 = dy * sinP + z1 * cosP;
  if (z2 <= 2) return null;
  const scale = camera.fov / z2;
  const sx = viewW / 2 + x1 * scale;
  const sy = viewH / 2 - y2 * scale;
  if (![x1, y2, z2, scale, sx, sy].every(Number.isFinite) || scale <= 0) return null;
  return { sx, sy, depth: z2, scale };
}

function profileFor(game) {
  return MODE3D_REGIONS[game.region] || MODE3D_REGIONS.thornveil;
}

function shade(hex, amount = 0) {
  const value = String(hex || '#888888').replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value.padEnd(6, '0');
  const n = parseInt(full.slice(0, 6), 16);
  const r = clamp(((n >> 16) & 255) + amount, 0, 255);
  const g = clamp(((n >> 8) & 255) + amount, 0, 255);
  const b = clamp((n & 255) + amount, 0, 255);
  return `rgb(${r},${g},${b})`;
}

function poly(ctx, points, fill, stroke = null, width = 1) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.3, rx), Math.max(0.3, ry), 0, 0, TAU);
  ctx.fill();
}

function detailed(game) {
  const map = { low: 0.45, medium: 0.7, high: 1, ultra: 1.3 };
  return map[game.quality] || 1;
}

function shadow(ctx, x, y, rx, ry, alpha = 0.3) {
  if (![x, y, rx, ry, alpha].every(Number.isFinite)) return;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
  grad.addColorStop(0, `rgba(0,0,0,${alpha})`);
  grad.addColorStop(0.65, `rgba(0,0,0,${alpha * 0.55})`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
}

function drawSky(ctx, game, w, h, p) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  for (const [stop, color] of p.sky) grad.addColorStop(stop, color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Celestial body with atmospheric halo instead of a flat disc.
  const bodyX = w * p.sun[0];
  const bodyY = h * p.sun[1];
  const halo = ctx.createRadialGradient(bodyX, bodyY, 2, bodyX, bodyY, h * 0.5);
  halo.addColorStop(0, p.sunGlow);
  halo.addColorStop(0.2, p.sunGlow.replace('0.72', '0.22'));
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);
  ellipse(ctx, bodyX, bodyY, 34 * p.scale, 34 * p.scale, p.sunColor);
  ellipse(ctx, bodyX - 10 * p.scale, bodyY - 12 * p.scale, 22 * p.scale, 18 * p.scale, shade(p.sunColor, 22));

  // Cloud bands / aurora ribbons.
  ctx.save();
  ctx.globalAlpha = 0.38;
  for (let i = 0; i < 5; i += 1) {
    const y = h * (0.12 + i * 0.07);
    const ribbon = ctx.createLinearGradient(0, y, w, y + 40);
    ribbon.addColorStop(0, 'rgba(255,255,255,0)');
    ribbon.addColorStop(0.4, p.haze);
    ribbon.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = ribbon;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(w * 0.25, y - 24, w * 0.6, y + 36, w, y + 8);
    ctx.lineTo(w, y + 22);
    ctx.bezierCurveTo(w * 0.65, y + 56, w * 0.3, y + 2, 0, y + 18);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Layered mountain/cliff silhouettes for depth.
  for (let layer = 0; layer < 3; layer += 1) {
    const base = h * (0.51 + layer * 0.045);
    ctx.fillStyle = p.mountains[layer];
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, base);
    for (let x = 0; x <= w + 80; x += 90) {
      const peak = base - (40 + layer * 18) * (0.4 + Math.abs(Math.sin(x * 0.011 + layer * 1.7)));
      ctx.quadraticCurveTo(x + 28, base - 12, x + 46, peak);
      ctx.quadraticCurveTo(x + 68, base - 16, x + 90, base + 8);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }
}

function drawGround(ctx, game, w, h, p) {
  const horizon = h * 0.58;
  const grad = ctx.createLinearGradient(0, horizon, 0, h);
  grad.addColorStop(0, p.groundFar);
  grad.addColorStop(0.45, p.ground);
  grad.addColorStop(1, p.groundNear);
  ctx.fillStyle = grad;
  ctx.fillRect(0, horizon, w, h - horizon);

  // Perspective path with irregular edges.
  ctx.beginPath();
  ctx.moveTo(w * 0.48, horizon);
  ctx.bezierCurveTo(w * 0.44, h * 0.68, w * 0.58, h * 0.78, w * 0.64, h + 20);
  ctx.lineTo(w * 0.36, h + 20);
  ctx.bezierCurveTo(w * 0.42, h * 0.78, w * 0.52, h * 0.68, w * 0.48, horizon);
  ctx.closePath();
  const path = ctx.createLinearGradient(0, horizon, 0, h);
  path.addColorStop(0, p.pathFar);
  path.addColorStop(1, p.path);
  ctx.fillStyle = path;
  ctx.fill();

  // Grass, stones, and roots reduce the empty-ground look.
  const detail = detailed(game);
  const count = Math.round(80 * detail);
  for (let i = 0; i < count; i += 1) {
    const n = i * 12.9898;
    const x = ((Math.sin(n) * 43758.5453) % 1 + 1) % 1 * w;
    const y = horizon + (((Math.cos(n) * 24634.6345) % 1 + 1) % 1) * (h - horizon);
    const depth = (y - horizon) / (h - horizon);
    const len = 3 + depth * 18;
    ctx.strokeStyle = i % 4 === 0 ? p.accent : p.grass;
    ctx.lineWidth = 0.6 + depth * 1.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - 4, y - len * 0.55, x + 2, y - len);
    ctx.stroke();
  }
  const rocks = Math.round(16 * detail);
  for (let i = 0; i < rocks; i += 1) {
    const n = i * 7.31;
    const x = ((Math.sin(n) * 999) % 1 + 1) % 1 * w;
    const y = horizon + 20 + (((Math.cos(n) * 777) % 1 + 1) % 1) * (h - horizon - 30);
    const r = 2 + ((y - horizon) / (h - horizon)) * 12;
    poly(ctx, [[x - r, y], [x - r * 0.45, y - r * 0.8], [x + r * 0.3, y - r], [x + r, y - r * 0.2], [x + r * 0.4, y + r * 0.2]], p.rock, shade(p.rock, -12));
  }
}

function drawWorldTree(ctx, x, y, s, scale, p, d) {
  const trunkW = Math.max(4, 24 * scale);
  const treeH = Math.max(20, 190 * scale);
  shadow(ctx, x, y, trunkW * 2.6, trunkW * 0.55, 0.28);
  // Buttress roots.
  for (const dir of [-1, 1]) {
    poly(ctx, [
      [x + dir * trunkW * 0.35, y],
      [x + dir * trunkW * 2.2, y + trunkW * 0.1],
      [x + dir * trunkW * 0.8, y - treeH * 0.16],
      [x + dir * trunkW * 0.2, y - treeH * 0.04],
    ], p.trunkDark, shade(p.trunkDark, -10));
  }
  // Tapered trunk with bark bands.
  const topW = trunkW * 0.34;
  poly(ctx, [[x - trunkW / 2, y], [x - topW / 2, y - treeH], [x + topW / 2, y - treeH], [x + trunkW / 2, y]], p.trunk, shade(p.trunk, -22));
  poly(ctx, [[x, y], [x + topW * 0.2, y - treeH], [x + topW / 2, y - treeH], [x + trunkW * 0.3, y]], p.trunkLight);
  const bands = Math.max(2, Math.round(7 * d));
  for (let i = 0; i < bands; i += 1) {
    const t = i / bands;
    const yy = y - treeH * t;
    ctx.strokeStyle = shade(p.trunkDark, i % 2 ? -8 : 10);
    ctx.lineWidth = Math.max(0.5, 1.2 * scale);
    ctx.beginPath();
    ctx.moveTo(x - trunkW * (0.42 - t * 0.25), yy);
    ctx.quadraticCurveTo(x, yy + 2 * scale, x + trunkW * (0.34 - t * 0.2), yy - scale);
    ctx.stroke();
  }
  // Massive branching crown.
  const branches = Math.round(7 * d);
  for (let i = 0; i < branches; i += 1) {
    const side = i % 2 ? 1 : -1;
    const t = 0.55 + (i / branches) * 0.35;
    const bx = x + side * trunkW * (0.3 + t * 0.2);
    const by = y - treeH * t;
    ctx.strokeStyle = shade(p.trunk, -10);
    ctx.lineWidth = Math.max(1, 5 * scale * (1 - i / branches));
    ctx.beginPath();
    ctx.moveTo(x, by);
    ctx.quadraticCurveTo(bx + side * 24 * scale, by - 16 * scale, bx + side * 38 * scale, by - 42 * scale);
    ctx.stroke();
    ellipse(ctx, bx + side * 40 * scale, by - 48 * scale, 30 * scale, 20 * scale, i % 3 === 0 ? p.canopyLight : p.canopy);
    ellipse(ctx, bx + side * 29 * scale, by - 56 * scale, 22 * scale, 15 * scale, shade(p.canopy, 10));
  }
  for (let i = 0; i < 5; i += 1) {
    ellipse(ctx, x - 34 * scale + i * 18 * scale, y - treeH - (i % 2) * 12 * scale, 36 * scale, 25 * scale, i % 2 ? p.canopy : p.canopyDark);
  }
  // Bioluminescent sap.
  ellipse(ctx, x + 3 * scale, y - treeH * 0.42, 2.2 * scale, 5 * scale, p.glow);
  ellipse(ctx, x - 4 * scale, y - treeH * 0.2, 1.8 * scale, 3.4 * scale, p.glow);
}

function drawHut(ctx, x, y, s, scale, p) {
  const w = Math.max(10, s.radius * 1.9 * scale);
  const h = w * 0.72;
  shadow(ctx, x, y, w * 0.85, w * 0.2, 0.32);
  // Stilts and crossbeams.
  for (const off of [-0.35, -0.1, 0.18, 0.38]) {
    ctx.strokeStyle = p.woodDark;
    ctx.lineWidth = Math.max(1, w * 0.045);
    ctx.beginPath();
    ctx.moveTo(x + w * off, y);
    ctx.lineTo(x + w * off * 0.75, y - h * 0.3);
    ctx.stroke();
  }
  // Plaster walls and timber frame.
  poly(ctx, [[x - w * 0.42, y - h * 0.3], [x - w * 0.38, y - h * 0.82], [x + w * 0.36, y - h * 0.84], [x + w * 0.42, y - h * 0.3]], p.wall, shade(p.wall, -18));
  for (const off of [-0.28, 0, 0.28]) {
    ctx.strokeStyle = p.wood;
    ctx.lineWidth = Math.max(1, w * 0.035);
    ctx.beginPath();
    ctx.moveTo(x + w * off, y - h * 0.3);
    ctx.lineTo(x + w * off * 0.9, y - h * 0.82);
    ctx.stroke();
  }
  // Thatched roof with layered straw.
  for (let layer = 0; layer < 4; layer += 1) {
    const lift = layer * h * 0.055;
    poly(ctx, [
      [x - w * (0.54 - lift / w), y - h * (0.76 + layer * 0.02)],
      [x + w * (0.52 - lift / w), y - h * (0.78 + layer * 0.02)],
      [x + w * (0.32 - lift / w), y - h * (1.05 + layer * 0.02)],
      [x - w * (0.34 - lift / w), y - h * (1.04 + layer * 0.02)],
    ], layer % 2 ? p.thatchDark : p.thatch, shade(p.thatchDark, -8));
  }
  // Door, window, hanging charm.
  poly(ctx, [[x - w * 0.08, y - h * 0.3], [x - w * 0.08, y - h * 0.56], [x + w * 0.08, y - h * 0.56], [x + w * 0.08, y - h * 0.3]], p.door);
  ellipse(ctx, x + w * 0.22, y - h * 0.58, w * 0.05, w * 0.05, '#f5c66a');
  ctx.strokeStyle = p.glow;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.35, y - h * 1.0);
  ctx.lineTo(x - w * 0.35, y - h * 0.78);
  ctx.stroke();
}

function drawBonfire(ctx, x, y, s, scale, game, p) {
  shadow(ctx, x, y, 26 * scale, 8 * scale, 0.4);
  const t = game.time || 0;
  for (let i = 0; i < 3; i += 1) {
    const sway = Math.sin(t * 6 + i) * 3 * scale;
    poly(ctx, [
      [x - 8 * scale, y],
      [x - 3 * scale + sway, y - (16 + i * 5) * scale],
      [x + 3 * scale + sway, y - (11 + i * 4) * scale],
      [x + 8 * scale, y],
    ], i === 0 ? '#b9441b' : i === 1 ? '#f07b2d' : '#ffd166');
  }
  for (let i = 0; i < 2; i += 1) {
    ctx.strokeStyle = p.woodDark;
    ctx.lineWidth = Math.max(1, 3 * scale);
    ctx.beginPath();
    ctx.moveTo(x - 14 * scale, y);
    ctx.lineTo(x + 12 * scale, y - 6 * scale);
    ctx.moveTo(x + 14 * scale, y);
    ctx.lineTo(x - 12 * scale, y - 6 * scale);
    ctx.stroke();
  }
}

function drawTotem(ctx, x, y, s, scale, p) {
  const h = (s.height || 70) * scale;
  const w = 14 * scale;
  shadow(ctx, x, y, w, 3 * scale, 0.3);
  poly(ctx, [[x - w / 2, y], [x - w * 0.38, y - h], [x + w * 0.38, y - h], [x + w / 2, y]], p.wood, shade(p.wood, -20));
  for (let i = 0; i < 3; i += 1) {
    const yy = y - h * (0.25 + i * 0.24);
    ellipse(ctx, x - w * 0.18, yy, 1.6 * scale, 2.2 * scale, p.glow);
    ellipse(ctx, x + w * 0.18, yy, 1.6 * scale, 2.2 * scale, p.glow);
    ctx.strokeStyle = shade(p.wood, -28);
    ctx.beginPath();
    ctx.moveTo(x - w * 0.2, yy + 4 * scale);
    ctx.lineTo(x + w * 0.2, yy + 4 * scale);
    ctx.stroke();
  }
}

function drawPlatform(ctx, x, y, s, scale, p) {
  const w = s.w * scale;
  const d = s.d * scale;
  // Planks.
  for (let i = -2; i <= 2; i += 1) {
    poly(ctx, [[x - w / 2, y - d / 2 + i * 3 * scale], [x + w / 2, y - d / 2 + i * 3 * scale], [x + w / 2, y - d / 2 + 2.2 * scale + i * 3 * scale], [x - w / 2, y - d / 2 + 2.2 * scale + i * 3 * scale]], i % 2 ? p.wood : p.woodDark);
  }
  // Rope rails.
  ctx.strokeStyle = '#b9a27a';
  ctx.lineWidth = 1.2 * scale;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - d / 2);
  ctx.quadraticCurveTo(x, y - d * 1.8, x + w / 2, y - d / 2);
  ctx.stroke();
}

function drawRuin(ctx, x, y, scale, p) {
  const h = 70 * scale;
  const w = 46 * scale;
  for (const off of [-0.4, 0, 0.4]) {
    poly(ctx, [[x + w * off - 5 * scale, y], [x + w * off - 4 * scale, y - h * (1 - Math.abs(off))], [x + w * off + 4 * scale, y - h * (1 - Math.abs(off))], [x + w * off + 5 * scale, y]], p.stone, shade(p.stone, -25));
    poly(ctx, [[x + w * off - 4 * scale, y - h * (1 - Math.abs(off))], [x + w * off - 8 * scale, y - h * (1 - Math.abs(off)) - 6 * scale], [x + w * off + 4 * scale, y - h * (1 - Math.abs(off)) - 4 * scale]], p.stoneLight);
  }
  ctx.strokeStyle = p.moss;
  ctx.lineWidth = 1.4 * scale;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.45, y - h * 0.2);
  ctx.quadraticCurveTo(x, y - h * 0.35, x + w * 0.4, y - h * 0.16);
  ctx.stroke();
}

function drawCrystal(ctx, x, y, scale, p) {
  const colors = [p.crystal, shade(p.crystal, 30), shade(p.crystal, -30)];
  for (let i = 0; i < 4; i += 1) {
    const w = (4 + i * 2) * scale;
    const h = (20 + i * 14) * scale;
    poly(ctx, [[x - w, y], [x, y - h], [x + w * 0.4, y - h * 0.25], [x, y]], colors[i % 3], 'rgba(255,255,255,0.35)');
  }
  const glow = ctx.createRadialGradient(x, y - 8 * scale, 0, x, y - 8 * scale, 30 * scale);
  glow.addColorStop(0, 'rgba(160,230,255,0.35)');
  glow.addColorStop(1, 'rgba(160,230,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 40 * scale, y - 55 * scale, 80 * scale, 65 * scale);
}

function drawHorrorBuilding(ctx, item, p, x, y, scale, game) {
  const type = item.type;
  const t = game.clock3D || 0;
  const isChapel = type === 'chapel';
  const isMill = type === 'mill';
  const isLight = type === 'lighthouse';
  const isAsylum = type === 'asylum';
  const w = (isAsylum ? 280 : isChapel ? 170 : isLight ? 120 : isMill ? 150 : 230) * scale;
  const h = (isLight ? 300 : isAsylum ? 220 : isChapel ? 190 : isMill ? 210 : 185) * scale;
  shadow(ctx, x, y, w * 0.62, w * 0.16, 0.5);
  const dark = shade(item.color || p.stone, -35);
  const mid = shade(item.color || p.stone, -8);
  const lit = shade(item.color || p.stone, 18);
  if (isMill || isLight) {
    poly(ctx, [[x - w * 0.33, y], [x - w * 0.24, y - h], [x + w * 0.24, y - h], [x + w * 0.33, y]], dark, mid, 1.2);
    for (let i = 0; i < 5; i += 1) {
      const yy = y - h * (0.18 + i * 0.14);
      ctx.strokeStyle = shade(mid, i % 2 ? 10 : -12);
      ctx.lineWidth = Math.max(0.5, scale * 1.2);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.25, yy);
      ctx.lineTo(x + w * 0.25, yy);
      ctx.stroke();
    }
    poly(ctx, [[x - w * 0.42, y - h], [x + w * 0.42, y - h], [x + w * 0.27, y - h * 1.22], [x - w * 0.27, y - h * 1.22]], dark, lit, 1);
    if (isLight) {
      poly(ctx, [[x - w * 0.2, y - h * 1.22], [x + w * 0.2, y - h * 1.22], [x + w * 0.1, y - h * 1.55], [x - w * 0.1, y - h * 1.55]], shade(p.crystal || '#d9c6ff', 12), p.glow, 1);
      const beam = ctx.createLinearGradient(x, y - h * 1.3, x + w, y - h * 0.2);
      beam.addColorStop(0, 'rgba(220,205,255,0.24)');
      beam.addColorStop(1, 'rgba(220,205,255,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(x, y - h * 1.32);
      ctx.lineTo(x + w * 0.85, y - h * 0.12);
      ctx.lineTo(x + w * 0.4, y - h * 0.08);
      ctx.closePath();
      ctx.fill();
    } else {
      for (let i = 0; i < 4; i += 1) {
        const a = t * 0.18 + (i / 4) * TAU;
        const bx = x + Math.cos(a) * w * 0.34;
        const by = y - h * 0.42 + Math.sin(a) * w * 0.22;
        ctx.strokeStyle = p.wood || '#5b4630';
        ctx.lineWidth = Math.max(1, scale * 5);
        ctx.beginPath();
        ctx.moveTo(x, by);
        ctx.lineTo(bx, by);
        ctx.stroke();
        poly(ctx, [[bx, by], [bx + Math.cos(a) * w * 0.1, by + Math.sin(a) * w * 0.08], [bx + Math.cos(a) * w * 0.16, by + Math.sin(a) * w * 0.14]], p.woodDark || '#302318');
      }
    }
  } else {
    const wing = isChapel ? 0.22 : 0.4;
    poly(ctx, [[x - w * 0.55, y], [x - w * 0.48, y - h * 0.7], [x - w * 0.2, y - h * 0.84], [x + w * 0.2, y - h * 0.84], [x + w * 0.48, y - h * 0.7], [x + w * 0.55, y]], mid, dark, 1.2);
    if (isAsylum) {
      poly(ctx, [[x - w * 0.1, y], [x - w * 0.1, y - h * 1.18], [x + w * 0.08, y - h * 1.18], [x + w * 0.08, y]], dark, lit, 1);
      poly(ctx, [[x - w * 0.16, y - h * 1.18], [x + w * 0.14, y - h * 1.18], [x + w * 0.1, y - h * 1.34], [x - w * 0.12, y - h * 1.34]], '#c8c1ad');
    } else if (isChapel) {
      poly(ctx, [[x - w * 0.32, y - h * 0.8], [x, y - h * 1.18], [x + w * 0.32, y - h * 0.8]], '#2b292b', lit, 1);
    } else {
      poly(ctx, [[x - w * 0.55, y - h * 0.7], [x - w * 0.26, y - h * 1.02], [x - w * 0.05, y - h * 0.78], [x + w * 0.22, y - h * 1.08], [x + w * 0.55, y - h * 0.7]], '#242126', lit, 1);
      poly(ctx, [[x - w * 0.18, y], [x - w * 0.18, y - h * 1.12], [x - w * 0.03, y - h * 1.12], [x - w * 0.03, y]], dark);
    }
    // Door and lit windows. The windows flicker on a slow deterministic pulse.
    const doorW = Math.max(4, w * 0.08);
    poly(ctx, [[x - doorW, y], [x - doorW * 0.8, y - h * 0.34], [x + doorW * 0.8, y - h * 0.34], [x + doorW, y]], p.door || '#161218');
    const pulse = 0.45 + Math.sin(t * 1.7) * 0.15;
    for (let i = 0; i < 5; i += 1) {
      const wx = x - w * 0.36 + i * w * 0.18;
      const wy = y - h * 0.55;
      ctx.fillStyle = `rgba(232,190,112,${pulse})`;
      ctx.fillRect(wx - doorW * 0.5, wy, doorW, Math.max(2, h * 0.06));
    }
  }
  // Dead foreground iron fence.
  ctx.strokeStyle = 'rgba(12,12,14,0.82)';
  ctx.lineWidth = Math.max(1, scale * 2.4);
  for (let i = 0; i < 9; i += 1) {
    const fx = x - w * 0.58 + i * w * 0.145;
    ctx.beginPath();
    ctx.moveTo(fx, y);
    ctx.lineTo(fx, y - h * 0.18);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x - w * 0.58, y - h * 0.1);
  ctx.lineTo(x + w * 0.58, y - h * 0.1);
  ctx.stroke();
}

function drawEchoRune(ctx, item, p, x, y, scale, game) {
  const t = game.clock3D || 0;
  const glow = item.color || p.glow || '#d9c6ff';
  ctx.save();
  const halo = ctx.createRadialGradient(x, y - 34 * scale, 0, x, y - 34 * scale, 52 * scale);
  halo.addColorStop(0, `${glow}cc`);
  halo.addColorStop(0.4, `${glow}55`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x - 54 * scale, y - 90 * scale, 108 * scale, 140 * scale);
  ctx.translate(x, y - 34 * scale + Math.sin(t * 1.8) * 4 * scale);
  ctx.rotate(t * 0.4);
  poly(ctx, [[0, -26 * scale], [17 * scale, 0], [0, 26 * scale], [-17 * scale, 0]], glow, '#f6e8c9', 1.5);
  ctx.rotate(-t * 0.8);
  poly(ctx, [[0, -13 * scale], [9 * scale, 0], [0, 13 * scale], [-9 * scale, 0]], '#fff3d4');
  ctx.restore();
  ctx.strokeStyle = `${glow}66`;
  ctx.lineWidth = Math.max(1, scale);
  ctx.beginPath();
  ctx.ellipse(x, y, 25 * scale, 8 * scale, 0, 0, TAU);
  ctx.stroke();
}

function drawExitGate(ctx, item, p, x, y, scale, game) {
  const glow = item.color || p.glow || '#d9c6ff';
  const w = 46 * scale;
  const h = 78 * scale;
  const pulse = 0.5 + Math.sin((game.clock3D || 0) * 2.1) * 0.2;
  shadow(ctx, x, y, w * 1.2, w * 0.3, 0.45);
  poly(ctx, [[x - w, y], [x - w, y - h], [x - w * 0.55, y - h * 1.2], [x - w * 0.55, y]], '#1a171e', '#4b4353', 1);
  poly(ctx, [[x + w * 0.55, y], [x + w * 0.55, y - h * 1.2], [x + w, y - h], [x + w, y]], '#1a171e', '#4b4353', 1);
  poly(ctx, [[x - w * 0.55, y - h * 1.2], [x + w * 0.55, y - h * 1.2], [x + w * 0.4, y - h * 1.32], [x - w * 0.4, y - h * 1.32]], '#2b2533', '#4b4353', 1);
  const portal = ctx.createLinearGradient(x, y, x, y - h * 1.1);
  portal.addColorStop(0, `${glow}cc`);
  portal.addColorStop(0.65, `${glow}55`);
  portal.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = pulse;
  ctx.fillStyle = portal;
  ctx.fillRect(x - w * 0.5, y - h * 1.12, w, h * 1.12);
  ctx.globalAlpha = 1;
  ctx.fillStyle = glow;
  ctx.font = `bold ${Math.max(7, 9 * scale)}px serif`;
  ctx.textAlign = 'center';
  ctx.fillText('KELUAR', x, y - h * 1.42);
}

function sceneryModel(ctx, item, p, game, x, y, scale) {
  const d = detailed(game);
  if (item.type === 'echo_rune') drawEchoRune(ctx, item, p, x, y, scale, game);
  else if (item.type === 'exitgate') drawExitGate(ctx, item, p, x, y, scale, game);
  else if (item.type === 'worldtree') drawWorldTree(ctx, x, y, item, scale, p, d);
  else if (item.type === 'manor' || item.type === 'asylum' || item.type === 'chapel' || item.type === 'mill' || item.type === 'lighthouse') drawHorrorBuilding(ctx, item, p, x, y, scale, game);
  else if (item.type === 'hut') drawHut(ctx, x, y, item, scale, p);
  else if (item.type === 'bonfire') drawBonfire(ctx, x, y, item, scale, game, p);
  else if (item.type === 'totem') drawTotem(ctx, x, y, item, scale, p);
  else if (item.type === 'platform') drawPlatform(ctx, x, y, item, scale, p);
  else if (item.type === 'crystal') drawCrystal(ctx, x, y, scale, p);
  else drawRuin(ctx, x, y, scale, p);
}

function drawNpc(ctx, npc, p, game, x, y, scale) {
  const robe = npc.id === 'shaman_lyra' ? '#5b3d72' : npc.id === 'scout_rian' ? '#415d43' : '#75513b';
  const bob = Math.sin((game.time || 0) * 1.7 + npc.x) * 1.2 * scale;
  y += bob;
  shadow(ctx, x, y, 15 * scale, 4 * scale, 0.35);
  // Boots, robe, belt.
  poly(ctx, [[x - 10 * scale, y], [x - 8 * scale, y - 34 * scale], [x + 8 * scale, y - 34 * scale], [x + 10 * scale, y]], robe, shade(robe, -35));
  poly(ctx, [[x - 9 * scale, y - 30 * scale], [x + 9 * scale, y - 30 * scale], [x + 7 * scale, y - 24 * scale], [x - 7 * scale, y - 24 * scale]], '#c9a25c');
  // Shoulders and arms.
  ellipse(ctx, x - 12 * scale, y - 44 * scale, 6 * scale, 4 * scale, shade(robe, 15));
  ellipse(ctx, x + 12 * scale, y - 44 * scale, 6 * scale, 4 * scale, shade(robe, 15));
  poly(ctx, [[x - 14 * scale, y - 45 * scale], [x - 10 * scale, y - 26 * scale], [x - 6 * scale, y - 28 * scale], [x - 8 * scale, y - 44 * scale]], robe);
  poly(ctx, [[x + 14 * scale, y - 45 * scale], [x + 10 * scale, y - 26 * scale], [x + 6 * scale, y - 28 * scale], [x + 8 * scale, y - 44 * scale]], robe);
  // Head, hair, face.
  ellipse(ctx, x, y - 55 * scale, 8 * scale, 9 * scale, '#b98058');
  poly(ctx, [[x - 9 * scale, y - 57 * scale], [x - 5 * scale, y - 64 * scale], [x + 9 * scale, y - 60 * scale], [x + 5 * scale, y - 51 * scale]], '#2f241e');
  ellipse(ctx, x - 3 * scale, y - 56 * scale, 1 * scale, 1 * scale, '#1b1410');
  ellipse(ctx, x + 3 * scale, y - 56 * scale, 1 * scale, 1 * scale, '#1b1410');
  // Staff / spear silhouette.
  ctx.strokeStyle = '#5c4630';
  ctx.lineWidth = Math.max(1, 1.6 * scale);
  ctx.beginPath();
  ctx.moveTo(x + 16 * scale, y);
  ctx.lineTo(x + 18 * scale, y - 68 * scale);
  ctx.stroke();
  if (npc.id === 'shaman_lyra') {
    ellipse(ctx, x + 18 * scale, y - 70 * scale, 4 * scale, 5 * scale, p.glow);
  }
  // Name plate with readable backing.
  ctx.fillStyle = 'rgba(8,11,12,0.72)';
  ctx.beginPath();
  ctx.roundRect(x - 42 * scale, y - 88 * scale, 84 * scale, 13 * scale, 3 * scale);
  ctx.fill();
  ctx.fillStyle = '#f4d89b';
  ctx.font = `bold ${Math.max(7, 10 * scale)}px serif`;
  ctx.textAlign = 'center';
  ctx.fillText(npc.name, x, y - 78 * scale);
  ctx.fillStyle = '#d8e7dc';
  ctx.font = `${Math.max(6, 8 * scale)}px sans-serif`;
  ctx.fillText('E · Bicara', x, y - 69 * scale);
}

function playerWeapon(weaponId) {
  if (weaponId === 'bow') return 'bow';
  if (weaponId === 'staff' || weaponId === 'spellbook') return 'staff';
  if (weaponId === 'scythe') return 'scythe';
  if (weaponId === 'spear' || weaponId === 'halberd' || weaponId === 'pike') return 'polearm';
  if (weaponId === 'dagger' || weaponId === 'twin_blades') return 'dagger';
  return 'sword';
}

function drawPlayer(ctx, player, p, game, x, y, scale) {
  const moving = Math.abs(player.vx || 0) + Math.abs(player.vz || 0) > 4;
  const gait = moving ? Math.sin((game.time || 0) * (player.isSprinting ? 13 : 8)) : 0;
  const bob = moving ? Math.abs(Math.sin((game.time || 0) * 8)) * 2 * scale : Math.sin((game.time || 0) * 2) * 0.6 * scale;
  const swing = player.attackState && player.attackState !== 'idle' ? 1 : 0;
  y += bob;
  shadow(ctx, x, y, 18 * scale, 5 * scale, 0.45);

  // Cape with two lit planes and a torn hem.
  poly(ctx, [
    [x - 12 * scale, y - 46 * scale], [x + 9 * scale, y - 46 * scale],
    [x + 15 * scale + gait * 2 * scale, y - 6 * scale], [x + 5 * scale, y - 12 * scale],
    [x - 3 * scale, y - 3 * scale], [x - 15 * scale - gait * 2 * scale, y - 9 * scale],
  ], '#382c31', '#171316', 0.8 * scale);
  poly(ctx, [[x - 9 * scale, y - 44 * scale], [x + 4 * scale, y - 44 * scale], [x + 3 * scale, y - 12 * scale], [x - 8 * scale, y - 18 * scale]], '#523842');

  // Legs with articulated greaves.
  for (const dir of [-1, 1]) {
    const leg = dir * (3 + gait * dir * 2) * scale;
    poly(ctx, [[x + leg - 3.4 * scale, y - 24 * scale], [x + leg + 3.2 * scale, y - 24 * scale], [x + leg + 3.8 * scale, y - 3 * scale], [x + leg - 2.4 * scale, y - 3 * scale]], '#777f88');
    poly(ctx, [[x + leg - 3.6 * scale, y - 8 * scale], [x + leg + 3.5 * scale, y - 8 * scale], [x + leg + 4 * scale, y], [x + leg - 4 * scale, y]], '#3e3a3b');
  }
  // Faulds and chest plate.
  poly(ctx, [[x - 13 * scale, y - 31 * scale], [x + 13 * scale, y - 31 * scale], [x + 10 * scale, y - 22 * scale], [x - 10 * scale, y - 22 * scale]], '#4f5964');
  poly(ctx, [[x - 12 * scale, y - 46 * scale], [x + 12 * scale, y - 46 * scale], [x + 9 * scale, y - 29 * scale], [x - 9 * scale, y - 29 * scale]], '#7d8b96', '#39424c', 0.8 * scale);
  poly(ctx, [[x - 7 * scale, y - 44 * scale], [x + 3 * scale, y - 44 * scale], [x + 5 * scale, y - 32 * scale], [x - 6 * scale, y - 32 * scale]], '#a7b2b8');
  // Pauldrons with rivets.
  ellipse(ctx, x - 13 * scale, y - 47 * scale, 7 * scale, 5 * scale, '#8d99a3');
  ellipse(ctx, x + 13 * scale, y - 47 * scale, 7 * scale, 5 * scale, '#8d99a3');
  for (const dir of [-1, 1]) ellipse(ctx, x + dir * 13 * scale, y - 48 * scale, 1.4 * scale, 1.4 * scale, '#e4c77b');
  // Arms, gauntlets, weapon grip.
  const armSwing = swing ? 18 : gait * 5;
  poly(ctx, [[x + 13 * scale, y - 44 * scale], [x + 18 * scale, y - 39 * scale], [x + 19 * scale + armSwing * 0.3 * scale, y - 22 * scale], [x + 14 * scale, y - 23 * scale]], '#707c86');
  ellipse(ctx, x + 18 * scale + armSwing * 0.35 * scale, y - 21 * scale, 4 * scale, 4 * scale, '#3e4248');
  // Helmet with nasal guard and plume.
  ellipse(ctx, x, y - 58 * scale, 9 * scale, 10 * scale, '#8f9aa4');
  poly(ctx, [[x - 9 * scale, y - 58 * scale], [x - 5 * scale, y - 68 * scale], [x + 7 * scale, y - 67 * scale], [x + 9 * scale, y - 58 * scale], [x + 2 * scale, y - 55 * scale]], '#a9b4bd');
  poly(ctx, [[x - 1 * scale, y - 60 * scale], [x + 2 * scale, y - 60 * scale], [x + 2 * scale, y - 51 * scale], [x - 1 * scale, y - 51 * scale]], '#d8b56a');
  ctx.strokeStyle = '#8f1f2c';
  ctx.lineWidth = Math.max(1, 2.2 * scale);
  ctx.beginPath();
  ctx.moveTo(x + 2 * scale, y - 68 * scale);
  ctx.quadraticCurveTo(x + 10 * scale, y - 78 * scale, x + 16 * scale, y - 72 * scale);
  ctx.stroke();

  // Weapon models: distinct silhouettes, not a single stroke.
  const weapon = playerWeapon(player.weaponId || 'sword');
  const gripX = x + 19 * scale + armSwing * 0.35 * scale;
  const gripY = y - 24 * scale;
  if (weapon === 'staff') {
    ctx.strokeStyle = '#5a3e2b';
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.moveTo(gripX, y);
    ctx.lineTo(gripX + 4 * scale, y - 64 * scale);
    ctx.stroke();
    ellipse(ctx, gripX + 4 * scale, y - 67 * scale, 5 * scale, 7 * scale, p.glow);
    ellipse(ctx, gripX + 4 * scale, y - 67 * scale, 2 * scale, 3 * scale, '#fff7cf');
  } else if (weapon === 'bow') {
    ctx.strokeStyle = '#8a6135';
    ctx.lineWidth = 2.4 * scale;
    ctx.beginPath();
    ctx.arc(gripX + 8 * scale, gripY, 18 * scale, -Math.PI * 0.55, Math.PI * 0.55);
    ctx.stroke();
    ctx.strokeStyle = '#ded6c4';
    ctx.lineWidth = 0.7 * scale;
    ctx.beginPath();
    ctx.moveTo(gripX + 14 * scale, gripY - 15 * scale);
    ctx.lineTo(gripX + 14 * scale, gripY + 15 * scale);
    ctx.stroke();
  } else if (weapon === 'polearm') {
    ctx.strokeStyle = '#60452f';
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.moveTo(gripX - 4 * scale, y);
    ctx.lineTo(gripX + 10 * scale, y - 74 * scale);
    ctx.stroke();
    poly(ctx, [[gripX + 9 * scale, y - 74 * scale], [gripX + 16 * scale, y - 84 * scale], [gripX + 15 * scale, y - 68 * scale]], '#d7dee4', '#5d6870', 0.6 * scale);
  } else if (weapon === 'scythe') {
    ctx.strokeStyle = '#4a3225';
    ctx.lineWidth = 2.4 * scale;
    ctx.beginPath();
    ctx.moveTo(gripX - 2 * scale, y);
    ctx.lineTo(gripX + 8 * scale, y - 68 * scale);
    ctx.stroke();
    ctx.strokeStyle = '#d8e2dc';
    ctx.lineWidth = 2.4 * scale;
    ctx.beginPath();
    ctx.arc(gripX + 6 * scale, y - 68 * scale, 22 * scale, -0.1, Math.PI * 0.85);
    ctx.stroke();
  } else if (weapon === 'dagger') {
    poly(ctx, [[gripX, gripY], [gripX + 5 * scale, gripY - 15 * scale], [gripX + 8 * scale, gripY - 10 * scale], [gripX + 2 * scale, gripY + 4 * scale]], '#dbe6ea', '#59636a', 0.5 * scale);
  } else {
    poly(ctx, [[gripX - 2 * scale, gripY], [gripX + 1 * scale, gripY - 7 * scale], [gripX + 9 * scale, gripY - 55 * scale], [gripX + 13 * scale, gripY - 52 * scale], [gripX + 4 * scale, gripY]], '#e4edf2', '#66727a', 0.7 * scale);
    ctx.strokeStyle = '#c8a45c';
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    ctx.moveTo(gripX - 3 * scale, gripY - 3 * scale);
    ctx.lineTo(gripX + 5 * scale, gripY - 8 * scale);
    ctx.stroke();
  }

  if (player.isGliding) {
    for (const dir of [-1, 1]) {
      poly(ctx, [[x, y - 48 * scale], [x + dir * 34 * scale, y - 62 * scale], [x + dir * 28 * scale, y - 32 * scale], [x + dir * 4 * scale, y - 38 * scale]], 'rgba(197,236,240,0.62)', 'rgba(255,255,255,0.45)', 0.8 * scale);
    }
  }
  if (player.isSprinting) {
    ctx.strokeStyle = 'rgba(220,240,255,0.3)';
    ctx.lineWidth = 1 * scale;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x - 18 * scale - i * 5 * scale, y - (12 + i * 7) * scale);
      ctx.lineTo(x - 32 * scale - i * 6 * scale, y - (12 + i * 7) * scale);
      ctx.stroke();
    }
  }
}

function drawProwler(ctx, enemy, x, y, scale) {
  const stride = Math.sin((enemy.phase = (enemy.phase || 0) + 0.08)) * 4 * scale;
  shadow(ctx, x, y, 24 * scale, 6 * scale, 0.4);
  for (const dir of [-1, 1]) {
    for (const side of [-1, 1]) {
      ctx.strokeStyle = '#3b332d';
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.moveTo(x + dir * 12 * scale, y - 18 * scale);
      ctx.lineTo(x + dir * 14 * scale + side * stride, y - 2 * scale);
      ctx.stroke();
    }
  }
  poly(ctx, [[x - 24 * scale, y - 26 * scale], [x - 12 * scale, y - 36 * scale], [x + 8 * scale, y - 38 * scale], [x + 22 * scale, y - 28 * scale], [x + 16 * scale, y - 15 * scale], [x - 12 * scale, y - 14 * scale]], '#78624c');
  poly(ctx, [[x - 20 * scale, y - 29 * scale], [x - 4 * scale, y - 36 * scale], [x + 7 * scale, y - 34 * scale], [x, y - 25 * scale]], '#9a8062');
  // Head, ears, jaw, eyes.
  poly(ctx, [[x + 17 * scale, y - 33 * scale], [x + 32 * scale, y - 30 * scale], [x + 35 * scale, y - 23 * scale], [x + 24 * scale, y - 20 * scale], [x + 15 * scale, y - 24 * scale]], '#6b5744');
  poly(ctx, [[x + 21 * scale, y - 33 * scale], [x + 23 * scale, y - 42 * scale], [x + 27 * scale, y - 34 * scale]], '#4e4034');
  ellipse(ctx, x + 28 * scale, y - 27 * scale, 1.5 * scale, 1.5 * scale, '#ffd166');
  // Tail.
  ctx.strokeStyle = '#6d5844';
  ctx.lineWidth = 5 * scale;
  ctx.beginPath();
  ctx.moveTo(x - 22 * scale, y - 25 * scale);
  ctx.quadraticCurveTo(x - 42 * scale, y - 34 * scale, x - 48 * scale, y - 18 * scale);
  ctx.stroke();
}

function drawBeetle(ctx, enemy, x, y, scale) {
  shadow(ctx, x, y, 27 * scale, 7 * scale, 0.4);
  for (const dir of [-1, 1]) {
    for (const side of [-1, 1]) {
      ctx.strokeStyle = '#2c2733';
      ctx.lineWidth = 2.4 * scale;
      ctx.beginPath();
      ctx.moveTo(x + dir * 14 * scale, y - 10 * scale);
      ctx.lineTo(x + dir * 25 * scale, y + side * 2 * scale);
      ctx.stroke();
    }
  }
  ellipse(ctx, x, y - 22 * scale, 25 * scale, 16 * scale, '#49375d');
  ellipse(ctx, x, y - 28 * scale, 21 * scale, 12 * scale, '#6d4c91');
  ctx.strokeStyle = '#c9a7f2';
  ctx.lineWidth = 1.1 * scale;
  ctx.beginPath();
  ctx.moveTo(x, y - 39 * scale);
  ctx.lineTo(x, y - 12 * scale);
  ctx.stroke();
  poly(ctx, [[x - 20 * scale, y - 36 * scale], [x - 30 * scale, y - 54 * scale], [x - 23 * scale, y - 42 * scale]], '#d9c2f2');
  poly(ctx, [[x + 20 * scale, y - 36 * scale], [x + 30 * scale, y - 54 * scale], [x + 23 * scale, y - 42 * scale]], '#d9c2f2');
  ellipse(ctx, x - 21 * scale, y - 20 * scale, 1.8 * scale, 2.2 * scale, '#f3c969');
  ellipse(ctx, x + 21 * scale, y - 20 * scale, 1.8 * scale, 2.2 * scale, '#f3c969');
}

function drawStalker(ctx, enemy, x, y, scale) {
  shadow(ctx, x, y, 20 * scale, 6 * scale, 0.4);
  for (const dir of [-1, 1]) {
    ctx.strokeStyle = '#4b5a3a';
    ctx.lineWidth = 3.5 * scale;
    ctx.beginPath();
    ctx.moveTo(x + dir * 5 * scale, y - 28 * scale);
    ctx.quadraticCurveTo(x + dir * 16 * scale, y - 15 * scale, x + dir * 14 * scale, y);
    ctx.stroke();
  }
  poly(ctx, [[x - 10 * scale, y - 24 * scale], [x - 6 * scale, y - 52 * scale], [x + 5 * scale, y - 56 * scale], [x + 11 * scale, y - 25 * scale]], '#5f7248');
  // Spore sacs and thorn arms.
  ellipse(ctx, x - 7 * scale, y - 39 * scale, 4 * scale, 6 * scale, '#a86bd8');
  ellipse(ctx, x + 7 * scale, y - 34 * scale, 3.5 * scale, 5 * scale, '#c49af0');
  for (const dir of [-1, 1]) {
    ctx.strokeStyle = '#7a8b5c';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(x + dir * 6 * scale, y - 48 * scale);
    ctx.quadraticCurveTo(x + dir * 24 * scale, y - 42 * scale, x + dir * 28 * scale, y - 26 * scale);
    ctx.stroke();
  }
  ellipse(ctx, x, y - 59 * scale, 8 * scale, 9 * scale, '#6f8052');
  ellipse(ctx, x - 3 * scale, y - 60 * scale, 1.4 * scale, 1.7 * scale, '#f2e28a');
  ellipse(ctx, x + 3 * scale, y - 60 * scale, 1.4 * scale, 1.7 * scale, '#f2e28a');
}

function drawAlpha(ctx, elite, x, y, scale, p, game) {
  const pulse = 1 + Math.sin((game.time || 0) * 4) * 0.03;
  shadow(ctx, x, y, 46 * scale, 10 * scale, 0.5);
  // Thorn antlers.
  for (const dir of [-1, 1]) {
    ctx.strokeStyle = '#e8d3a3';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(x + dir * 9 * scale, y - 58 * scale);
    ctx.quadraticCurveTo(x + dir * 28 * scale, y - 78 * scale, x + dir * 23 * scale, y - 94 * scale);
    ctx.moveTo(x + dir * 18 * scale, y - 75 * scale);
    ctx.lineTo(x + dir * 33 * scale, y - 82 * scale);
    ctx.stroke();
  }
  // Powerful quadruped body.
  poly(ctx, [[x - 35 * scale, y - 34 * scale], [x - 20 * scale, y - 53 * scale], [x + 12 * scale, y - 55 * scale], [x + 33 * scale, y - 38 * scale], [x + 24 * scale, y - 19 * scale], [x - 20 * scale, y - 18 * scale]], '#b35418');
  poly(ctx, [[x - 32 * scale, y - 36 * scale], [x - 8 * scale, y - 50 * scale], [x + 14 * scale, y - 47 * scale], [x + 2 * scale, y - 30 * scale], [x - 16 * scale, y - 27 * scale]], '#e57a2e');
  for (const dir of [-1, 1]) {
    for (const side of [-1, 1]) {
      poly(ctx, [[x + dir * 22 * scale, y - 24 * scale], [x + dir * 26 * scale, y - 8 * scale], [x + dir * 20 * scale, y], [x + dir * 17 * scale, y - 14 * scale]], '#5d361f');
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(x + dir * 27 * scale, y - 8 * scale);
      ctx.lineTo(x + dir * (27 + side * 4) * scale, y - 2 * scale);
      ctx.stroke();
    }
  }
  poly(ctx, [[x + 26 * scale, y - 49 * scale], [x + 45 * scale, y - 45 * scale], [x + 49 * scale, y - 34 * scale], [x + 32 * scale, y - 29 * scale], [x + 21 * scale, y - 35 * scale]], '#8f4b1e');
  ellipse(ctx, x + 39 * scale, y - 40 * scale, 2.2 * scale, 2.2 * scale, '#ffe08a');
  // Aura.
  ctx.strokeStyle = `rgba(255,164,71,${0.24 + Math.sin((game.time || 0) * 3) * 0.08})`;
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.ellipse(x, y - 2 * scale, 42 * pulse * scale, 12 * pulse * scale, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.font = `bold ${Math.max(7, 10 * scale)}px serif`;
  ctx.textAlign = 'center';
  ctx.fillText('★ E3 · THORNVEIL ALPHA', x, y - 104 * scale);
}

function drawBoss(ctx, boss, x, y, scale, p, game) {
  const pulse = 1 + Math.sin((game.time || 0) * 2.2) * 0.025;
  const h = (boss.height || 120) * scale;
  shadow(ctx, x, y, 95 * scale, 18 * scale, 0.5);
  // Colossal root legs.
  for (const dir of [-1, 1]) {
    poly(ctx, [[x + dir * 20 * scale, y], [x + dir * 52 * scale, y - h * 0.08], [x + dir * 37 * scale, y - h * 0.38], [x + dir * 12 * scale, y - h * 0.3]], '#4a3a28');
    for (let i = 0; i < 3; i += 1) {
      ctx.strokeStyle = '#6b5234';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(x + dir * (24 + i * 8) * scale, y - h * 0.06);
      ctx.quadraticCurveTo(x + dir * (38 + i * 8) * scale, y - h * 0.17, x + dir * (54 + i * 9) * scale, y - h * 0.02);
      ctx.stroke();
    }
  }
  // Huge trunk torso with bark plates.
  poly(ctx, [[x - 42 * scale, y - h * 0.31], [x - 30 * scale, y - h * 0.82], [x - 4 * scale, y - h * 0.95], [x + 30 * scale, y - h * 0.81], [x + 44 * scale, y - h * 0.33], [x + 12 * scale, y - h * 0.2], [x - 16 * scale, y - h * 0.22]], '#60482d');
  for (let i = 0; i < 7; i += 1) {
    const yy = y - h * (0.32 + i * 0.08);
    poly(ctx, [[x - 30 * scale, yy], [x - 14 * scale, yy - 5 * scale], [x + 8 * scale, yy], [x + 28 * scale, yy - 7 * scale], [x + 26 * scale, yy + 3 * scale], [x - 2 * scale, yy + 8 * scale], [x - 29 * scale, yy + 4 * scale]], i % 2 ? '#7b5e38' : '#4b3823');
  }
  // Root arms with claw fingers.
  for (const dir of [-1, 1]) {
    ctx.strokeStyle = '#5b432a';
    ctx.lineWidth = 12 * scale;
    ctx.beginPath();
    ctx.moveTo(x + dir * 28 * scale, y - h * 0.72);
    ctx.quadraticCurveTo(x + dir * 72 * scale, y - h * 0.68, x + dir * 78 * scale, y - h * 0.38);
    ctx.stroke();
    for (let i = 0; i < 3; i += 1) {
      ctx.strokeStyle = '#8a6b42';
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.moveTo(x + dir * 76 * scale, y - h * 0.39);
      ctx.lineTo(x + dir * (82 + i * 3) * scale, y - h * (0.35 - i * 0.035));
      ctx.stroke();
    }
  }
  // Head, antlers, face.
  poly(ctx, [[x - 22 * scale, y - h * 0.84], [x - 12 * scale, y - h * 1.0], [x + 15 * scale, y - h * 0.99], [x + 24 * scale, y - h * 0.83], [x, y - h * 0.76]], '#6f5432');
  for (const dir of [-1, 1]) {
    ctx.strokeStyle = '#d9c492';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(x + dir * 8 * scale, y - h * 0.98);
    ctx.quadraticCurveTo(x + dir * 34 * scale, y - h * 1.2, x + dir * 26 * scale, y - h * 1.34);
    ctx.moveTo(x + dir * 20 * scale, y - h * 1.13);
    ctx.lineTo(x + dir * 41 * scale, y - h * 1.22);
    ctx.stroke();
  }
  ellipse(ctx, x - 8 * scale, y - h * 0.89, 3 * scale, 4 * scale, '#d8ff6a');
  ellipse(ctx, x + 8 * scale, y - h * 0.89, 3 * scale, 4 * scale, '#d8ff6a');
  // Glowing heart core.
  const coreY = y - h * 0.6;
  const glow = ctx.createRadialGradient(x, coreY, 0, x, coreY, 36 * scale);
  glow.addColorStop(0, 'rgba(220,255,150,0.88)');
  glow.addColorStop(0.3, 'rgba(130,220,70,0.46)');
  glow.addColorStop(1, 'rgba(80,150,40,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, coreY, 38 * pulse * scale, 0, TAU);
  ctx.fill();
  ellipse(ctx, x, coreY, 10 * pulse * scale, 14 * pulse * scale, '#d9ff7a');
  ellipse(ctx, x - 3 * scale, coreY - 3 * scale, 4 * scale, 5 * scale, '#ffffd1');
  // Name and boss bar.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4d89b';
  ctx.font = `bold ${Math.max(9, 12 * scale)}px serif`;
  ctx.fillText(boss.name, x, y - h * 1.38);
}

function drawEnemy(ctx, enemy, p, game, x, y, scale) {
  const model = enemy.type;
  if (model === 'forest_prowler') drawProwler(ctx, enemy, x, y, scale);
  else if (model === 'spore_beetle') drawBeetle(ctx, enemy, x, y, scale);
  else drawStalker(ctx, enemy, x, y, scale);
  if (game.hudSettings?.showEnemyHealth !== false && game.hudSettings?.showHealth !== false) {
    const bw = 34 * scale;
    ctx.fillStyle = 'rgba(10,8,8,0.75)';
    ctx.fillRect(x - bw / 2, y - 76 * scale, bw, 3.6 * scale);
    ctx.fillStyle = '#cf3b32';
    ctx.fillRect(x - bw / 2, y - 76 * scale, bw * clamp(enemy.hp / enemy.maxHp, 0, 1), 3.6 * scale);
  }
}

function weather(ctx, game, w, h, p) {
  const count = Math.round(60 * detailed(game) * (game.quality === 'low' ? 0.4 : 1));
  const t = game.time || 0;
  ctx.save();
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < count; i += 1) {
    const seed = i * 13.17;
    const x = (((Math.sin(seed) * 1271 + t * (8 + (i % 5) * 4)) % w) + w) % w;
    const y = (((Math.cos(seed) * 541 + t * (16 + (i % 7) * 9)) % h) + h) % h;
    if (p.weather === 'ash' || p.weather === 'snow') {
      ellipse(ctx, x, y, 1.1, 2.2, p.weather === 'snow' ? 'rgba(235,250,255,0.8)' : 'rgba(220,180,140,0.7)');
    } else if (p.weather === 'rain') {
      ctx.strokeStyle = 'rgba(180,220,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + 12);
      ctx.stroke();
    } else if (p.weather === 'embers' || p.weather === 'spores') {
      ellipse(ctx, x, y, 1.2, 1.2, p.weather === 'embers' ? 'rgba(255,150,70,0.75)' : 'rgba(190,245,180,0.6)');
    }
  }
  ctx.restore();
}

function postProcess(ctx, game, w, h, p) {
  const v = ctx.createRadialGradient(w * 0.5, h * 0.48, h * 0.22, w * 0.5, h * 0.5, h * 0.92);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(0.72, 'rgba(0,0,0,0.05)');
  v.addColorStop(1, 'rgba(0,0,0,0.48)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);

  // Atmospheric depth haze.
  const fog = ctx.createLinearGradient(0, h * 0.42, 0, h * 0.72);
  fog.addColorStop(0, 'rgba(210,225,210,0)');
  fog.addColorStop(0.5, p.fog);
  fog.addColorStop(1, 'rgba(210,225,210,0)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, h * 0.4, w, h * 0.36);

  const brightness = clamp((game.visualSettings?.brightness ?? 100) / 100, 0, 2);
  const contrast = clamp((game.visualSettings?.contrast ?? 100) / 100, 0, 2);
  const gamma = clamp((game.visualSettings?.gamma ?? 100) / 100, 0.5, 2.5);
  // Canvas 2D has no shader pass, so apply a calibrated screen blend instead of
  // pretending a PBR post stack exists. UI is drawn after this and stays clean.
  if (brightness !== 1 || contrast !== 1 || gamma !== 1) {
    ctx.save();
    if (brightness > 1) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(255,246,226,${clamp((brightness - 1) * 0.16, 0, 0.3)})`;
      ctx.fillRect(0, 0, w, h);
    } else if (brightness < 1) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgba(255,255,255,${clamp(brightness, 0, 1)})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (gamma > 1) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(40,38,34,${clamp((gamma - 1) * 0.12, 0, 0.18)})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (contrast !== 1) {
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = `rgba(120,120,120,${clamp(Math.abs(contrast - 1) * 0.14, 0, 0.2)})`;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }
}

export function render3DScene(ctx, game) {
  const w = game.viewW;
  const h = game.viewH;
  const cam = game.camera;
  const p = profileFor(game);
  const detail = detailed(game);

  ctx.save();
  ctx.clearRect(0, 0, w, h);
  drawSky(ctx, game, w, h, p);
  drawGround(ctx, game, w, h, p);
  weather(ctx, game, w, h, p);

  const drawList = [];
  // Region-specific landmark forest, ruins, crystals, and machinery.
  for (const item of p.landmarks || []) {
    const proj = project({ x: item.x, y: item.y || 0, z: item.z }, game);
    if (!proj) continue;
    drawList.push({
      depth: proj.depth,
      render: () => sceneryModel(ctx, item, p, game, proj.sx, proj.sy, proj.scale * (item.scale || 1)),
    });
  }
  for (const item of game.scenery) {
    if (item.collected) continue;
    const proj = project(item, game);
    if (!proj) continue;
    drawList.push({ depth: proj.depth, render: () => sceneryModel(ctx, item, p, game, proj.sx, proj.sy, proj.scale) });
  }
  for (const npc of game.npcs) {
    const proj = project(npc, game);
    if (!proj) continue;
    drawList.push({ depth: proj.depth, render: () => drawNpc(ctx, npc, p, game, proj.sx, proj.sy, proj.scale) });
  }
  for (const enemy of game.enemies) {
    if (enemy.hp <= 0) continue;
    const proj = project(enemy, game);
    if (!proj) continue;
    drawList.push({ depth: proj.depth, render: () => drawEnemy(ctx, enemy, p, game, proj.sx, proj.sy, proj.scale) });
  }
  if (game.elite && game.elite.hp > 0) {
    const proj = project(game.elite, game);
    if (proj) drawList.push({ depth: proj.depth, render: () => drawAlpha(ctx, game.elite, proj.sx, proj.sy, proj.scale, p, game) });
  }
  if (game.boss && game.boss.hp > 0) {
    const proj = project(game.boss, game);
    if (proj) drawList.push({ depth: proj.depth, render: () => drawBoss(ctx, game.boss, proj.sx, proj.sy, proj.scale, p, game) });
  }
  const playerProj = game.firstPerson ? null : project(game.player, game);
  if (playerProj) {
    drawList.push({ depth: playerProj.depth + 1, render: () => drawPlayer(ctx, game.player, p, game, playerProj.sx, playerProj.sy, playerProj.scale) });
  }
  for (const particle of game.particles) {
    const proj = project(particle, game);
    if (!proj) continue;
    drawList.push({
      depth: proj.depth - 2,
      render: () => {
        const glow = ctx.createRadialGradient(proj.sx, proj.sy, 0, proj.sx, proj.sy, particle.size * proj.scale * 2.4);
        glow.addColorStop(0, particle.color);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(proj.sx, proj.sy, particle.size * proj.scale * 2.4, 0, TAU);
        ctx.fill();
      },
    });
  }
  for (const number of game.damageNumbers) {
    if (game.hudSettings?.showDamageNumbers === false || game.hudSettings?.floatingDamage === false) continue;
    const proj = project(number, game);
    if (!proj) continue;
    drawList.push({
      depth: proj.depth - 6,
      render: () => {
        ctx.font = `bold ${Math.max(10, 14 * detail)}px serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillText(number.text, proj.sx + 1, proj.sy + 1);
        ctx.fillStyle = number.color;
        ctx.fillText(number.text, proj.sx, proj.sy);
      },
    });
  }

  drawList.sort((a, b) => b.depth - a.depth);
  for (const item of drawList) item.render();

  postProcess(ctx, game, w, h, p);
  ctx.restore();
  renderHorrorOverlay(ctx, game);
  renderHud(ctx, game, p);
}

function renderHorrorOverlay(ctx, game) {
  const h = game.horror;
  if (!h) return;
  const w = game.viewW;
  const vh = game.viewH;
  const fear = clamp(h.fear / 100, 0, 1);
  const t = game.clock3D || 0;
  ctx.save();
  // Darkness lives at the edges; the centre remains readable as a flashlight.
  const darkness = ctx.createRadialGradient(w * 0.5, vh * 0.48, Math.min(w, vh) * 0.12, w * 0.5, vh * 0.5, Math.max(w, vh) * 0.7);
  darkness.addColorStop(0, 'rgba(0,0,0,0)');
  darkness.addColorStop(0.45, `rgba(2,2,5,${0.24 + fear * 0.12})`);
  darkness.addColorStop(0.78, `rgba(0,0,0,${0.7 + fear * 0.12})`);
  darkness.addColorStop(1, 'rgba(0,0,0,0.96)');
  ctx.fillStyle = darkness;
  ctx.fillRect(0, 0, w, vh);
  const red = ctx.createRadialGradient(w * 0.5, vh * 0.5, Math.min(w, vh) * 0.3, w * 0.5, vh * 0.5, Math.max(w, vh) * 0.75);
  red.addColorStop(0, 'rgba(90,8,18,0)');
  red.addColorStop(1, `rgba(90,8,18,${0.2 + fear * 0.34})`);
  ctx.fillStyle = red;
  ctx.fillRect(0, 0, w, vh);

  if (h.scare) {
    const progress = 1 - h.scare.timer / Math.max(0.01, h.scare.duration);
    if (h.scare.flash > 0 && progress < 0.16) {
      ctx.fillStyle = `rgba(236,226,210,${h.scare.flash})`;
      ctx.fillRect(0, 0, w, vh);
    }
    const alpha = clamp(1 - Math.abs(progress - 0.42), 0, 1);
    ctx.globalAlpha = alpha;
    const cx = w * (0.57 + Math.sin(t * 19) * 0.012);
    const cy = vh * 0.48;
    if (h.scare.shape === 'face') {
      const face = ctx.createRadialGradient(cx, cy, 8, cx, cy, 92);
      face.addColorStop(0, '#ddd6c8');
      face.addColorStop(0.7, '#a69b8e');
      face.addColorStop(1, 'rgba(10,8,10,0)');
      ctx.fillStyle = face;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 72, 98, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#050407';
      ctx.beginPath();
      ctx.ellipse(cx - 24, cy - 13, 10, 17, -0.2, 0, TAU);
      ctx.ellipse(cx + 24, cy - 13, 10, 17, 0.2, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, cy + 42, 22, 30, 0, 0, TAU);
      ctx.fill();
    } else if (h.scare.shape === 'hand') {
      ctx.fillStyle = '#08070a';
      ctx.beginPath();
      ctx.roundRect(cx - 22, cy, 44, 120, 14);
      ctx.fill();
      for (let i = 0; i < 5; i += 1) {
        const fx = cx - 34 + i * 17;
        const len = 70 + (i % 3) * 22;
        ctx.strokeStyle = '#08070a';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(fx, cy + 6);
        ctx.quadraticCurveTo(fx - 9, cy - len * 0.6, fx - 4, cy - len);
        ctx.stroke();
      }
    } else if (h.scare.shape === 'mirror') {
      ctx.fillStyle = 'rgba(13,16,18,0.95)';
      ctx.fillRect(cx - 86, cy - 120, 172, 240);
      ctx.strokeStyle = 'rgba(206,196,168,0.65)';
      ctx.lineWidth = 3;
      ctx.strokeRect(cx - 80, cy - 114, 160, 228);
      ctx.fillStyle = 'rgba(205,199,186,0.85)';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 10, 38, 55, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#08070a';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo(cx - 70 + i * 30, cy - 110);
        ctx.lineTo(cx + 52 - i * 20, cy + 108);
        ctx.stroke();
      }
    } else if (h.scare.shape === 'static') {
      for (let i = 0; i < 34; i += 1) {
        const sy = (i / 34) * vh + Math.sin(i * 5 + t * 31) * 6;
        ctx.fillStyle = i % 3 ? 'rgba(210,206,196,0.08)' : 'rgba(255,255,255,0.16)';
        ctx.fillRect(0, sy, w, 2 + (i % 4));
      }
    } else if (h.scare.shape === 'atmospheric') {
      const fog = ctx.createRadialGradient(cx, cy + 40, 10, cx, cy + 40, 260);
      fog.addColorStop(0, 'rgba(150,140,155,0.16)');
      fog.addColorStop(1, 'rgba(10,8,12,0)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, w, vh);
    } else {
      ctx.fillStyle = '#050407';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 46, 25, 38, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(cx - 30, cy + 56, 60, 190);
      ctx.strokeStyle = '#050407';
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(cx - 28, cy + 86);
      ctx.lineTo(cx - 88, cy + 156);
      ctx.moveTo(cx + 28, cy + 86);
      ctx.lineTo(cx + 82, cy + 154);
      ctx.stroke();
      ctx.fillStyle = 'rgba(231,222,207,0.72)';
      ctx.beginPath();
      ctx.arc(cx - 8, cy + 42, 2.6, 0, TAU);
      ctx.arc(cx + 8, cy + 42, 2.6, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(8,8,10,0.88)';
    const lineW = Math.min(w * 0.78, 560);
    ctx.beginPath();
    ctx.roundRect(w / 2 - lineW / 2, vh - 92, lineW, 34, 4);
    ctx.fill();
    ctx.fillStyle = '#e4d7c4';
    ctx.font = 'bold 12px serif';
    ctx.textAlign = 'center';
    ctx.fillText(h.scare.line || 'Jangan menoleh.', w / 2, vh - 70);
  }

  // Stage strip, fear and objective.
  ctx.fillStyle = 'rgba(7,8,11,0.82)';
  ctx.fillRect(0, 0, w, 34);
  ctx.fillStyle = '#d9c6a1';
  ctx.font = 'bold 11px serif';
  ctx.textAlign = 'center';
  const phase = h.site.phases[Math.min(2, h.phaseIndex)];
  ctx.fillText(`3D SCARY MODE · ${h.site.name.toUpperCase()} · FASE ${h.phaseIndex + 1}/3 · ${phase.title.toUpperCase()}`, w / 2, 21);
  const barW = 170;
  ctx.fillStyle = 'rgba(8,8,10,0.76)';
  ctx.fillRect(20, vh - 54, barW + 12, 36);
  ctx.fillStyle = '#3a141c';
  ctx.fillRect(26, vh - 45, barW, 8);
  ctx.fillStyle = `rgb(${150 + Math.round(fear * 90)},${70 - Math.round(fear * 45)},70)`;
  ctx.fillRect(26, vh - 45, barW * (1 - fear), 8);
  ctx.fillStyle = '#d8c8b0';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`FEAR ${Math.round(h.fear)} · SANITY ${Math.round(h.sanity)}`, 26, vh - 23);
  ctx.textAlign = 'right';
  ctx.fillText(`GEMA ${h.collected.length}/3 · SCARES ${h.scares}`, w - 24, vh - 23);
  if (h.active) {
    const nearEcho = h.site.echoes.find((echo) => !h.collected.includes(echo.id) && Math.hypot(game.player.x - echo.x, game.player.z - echo.z) < 62);
    const nearExit = h.phaseIndex === 2 && Math.hypot(game.player.x - h.site.exit.x, game.player.z - h.site.exit.z) < 68;
    const prompt = nearEcho ? `E · AMBIL ${nearEcho.label.toUpperCase()}` : nearExit ? 'E · KELUAR DARI BLACKVEIL' : `OBJEKTIF · ${phase.objective}`;
    ctx.fillStyle = 'rgba(8,8,10,0.8)';
    const pw = Math.min(w - 40, 640);
    ctx.beginPath();
    ctx.roundRect(w / 2 - pw / 2, 44, pw, 27, 3);
    ctx.fill();
    ctx.fillStyle = '#e4d7c4';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(prompt, w / 2, 62);
  } else {
    ctx.fillStyle = 'rgba(6,5,8,0.9)';
    ctx.fillRect(w * 0.2, vh * 0.4, w * 0.6, 112);
    ctx.strokeStyle = h.result === 'cleared' ? 'rgba(130,190,130,0.7)' : 'rgba(190,70,70,0.7)';
    ctx.strokeRect(w * 0.2, vh * 0.4, w * 0.6, 112);
    ctx.fillStyle = h.result === 'cleared' ? '#cfe6c5' : '#f0b0a0';
    ctx.font = 'bold 20px serif';
    ctx.textAlign = 'center';
    ctx.fillText(h.result === 'cleared' ? 'KELUAR HIDUP' : 'THE UNLIT MENEMUKANMU', w / 2, vh * 0.4 + 42);
    ctx.fillStyle = '#d8c8b0';
    ctx.font = '11px sans-serif';
    ctx.fillText(`${h.site.name} · ${h.elapsed.toFixed(1)}s · ${h.scares} scares · tekan R untuk ulang`, w / 2, vh * 0.4 + 68);
  }
  ctx.restore();
}

// Public HUD entry used by the WebGL2 path, which renders geometry itself and
// only needs this overlay on top of the composited frame.
export function render3DHudOverlay(ctx, game) {
  renderHorrorOverlay(ctx, game);
  renderHud(ctx, game, profileFor(game));
  // Area / relic / echo strip. Uses game data only so this overlay stays free
  // of renderer-specific state.
  if (game.area) {
    const w = game.viewW;
    const h = game.viewH;
    const relics = game.relics ? game.relics.length : 0;
    ctx.save();
    ctx.fillStyle = 'rgba(8,10,11,0.72)';
    ctx.beginPath();
    ctx.roundRect(20, h - 34, 300, 22, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(210,180,120,0.3)';
    ctx.stroke();
    ctx.fillStyle = '#d6c39b';
    ctx.font = 'bold 9px serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${String(game.area.name).toUpperCase()} · ${relics} RELIK · ${game.echoes || 0} ECHO`, 30, h - 19);
    ctx.restore();
    void w;
  }
}

function renderHud(ctx, game, p) {
  const w = game.viewW;
  const h = game.viewH;
  const player = game.player;
  const hud = game.hudSettings || {};
  if (hud.showHealth !== false) {
    const hpW = 210;
    ctx.fillStyle = 'rgba(7,9,11,0.72)';
    ctx.beginPath();
    ctx.roundRect(20, 20, hpW + 66, 48, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(210,180,120,0.35)';
    ctx.stroke();
    ctx.fillStyle = '#e8d8b5';
    ctx.font = 'bold 9px serif';
    ctx.textAlign = 'left';
    ctx.fillText('SERA · PENJAGA SUMPAH', 30, 34);
    ctx.fillStyle = '#2a1616';
    ctx.fillRect(30, 40, hpW, 9);
    const hpGrad = ctx.createLinearGradient(30, 0, 30 + hpW, 0);
    hpGrad.addColorStop(0, '#7e1f2b');
    hpGrad.addColorStop(0.6, '#d84b45');
    hpGrad.addColorStop(1, '#f08b5b');
    ctx.fillStyle = hpGrad;
    ctx.fillRect(30, 40, hpW * clamp(player.hp / player.maxHp, 0, 1), 9);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(30, 40, hpW * clamp(player.hp / player.maxHp, 0, 1), 2);
    ctx.fillStyle = '#f4e6c8';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, 280, 49);
  }
  if (hud.showStamina !== false) {
    ctx.fillStyle = 'rgba(7,9,11,0.7)';
    ctx.fillRect(30, 55, 210, 6);
    ctx.fillStyle = '#5fbf8a';
    ctx.fillRect(30, 55, 210 * clamp(player.stamina / player.maxStamina, 0, 1), 6);
  }
  if (hud.showCrosshair !== false) {
    ctx.strokeStyle = 'rgba(240,225,195,0.62)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 6, 0, TAU);
    ctx.moveTo(w / 2 - 12, h / 2);
    ctx.lineTo(w / 2 - 7, h / 2);
    ctx.moveTo(w / 2 + 7, h / 2);
    ctx.lineTo(w / 2 + 12, h / 2);
    ctx.stroke();
  }
  if (player.lockOnTarget && player.lockOnTarget.hp > 0) {
    const proj = project(player.lockOnTarget, game);
    if (proj) {
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(proj.sx, proj.sy - 20, 23, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(proj.sx - 5, proj.sy - 20);
      ctx.lineTo(proj.sx + 5, proj.sy - 20);
      ctx.moveTo(proj.sx, proj.sy - 25);
      ctx.lineTo(proj.sx, proj.sy - 15);
      ctx.stroke();
    }
  }
  if (game.boss && game.boss.hp > 0 && hud.showBoss !== false) {
    const bw = Math.min(440, w * 0.5);
    const bx = (w - bw) / 2;
    ctx.fillStyle = 'rgba(7,9,10,0.72)';
    ctx.beginPath();
    ctx.roundRect(bx - 10, 20, bw + 20, 44, 4);
    ctx.fill();
    ctx.fillStyle = '#f0d59b';
    ctx.font = 'bold 12px serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.boss.name, w / 2, 36);
    ctx.fillStyle = '#251414';
    ctx.fillRect(bx, 43, bw, 7);
    ctx.fillStyle = '#7fc94b';
    ctx.fillRect(bx, 43, bw * clamp(game.boss.hp / game.boss.maxHp, 0, 1), 7);
    ctx.fillStyle = '#bfe7a0';
    ctx.font = '8px sans-serif';
    ctx.fillText(`FASE ${game.boss.phase || 1} · ${game.boss.title || ''}`, w / 2, 59);
  }
  if (game.activeDialogue) {
    const dw = Math.min(620, w * 0.74);
    const dx = (w - dw) / 2;
    const dy = h - 122;
    ctx.fillStyle = 'rgba(9,11,12,0.9)';
    ctx.strokeStyle = 'rgba(214,183,114,0.75)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(dx, dy, dw, 82, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f0d59b';
    ctx.font = 'bold 11px serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${game.activeDialogue.name} · ${game.activeDialogue.title}`, dx + 18, dy + 23);
    ctx.fillStyle = '#e6e0d3';
    ctx.font = '11px sans-serif';
    wrapText(ctx, game.activeDialogue.text, dx + 18, dy + 44, dw - 36, 15);
  }
  if (game.toast) {
    ctx.fillStyle = 'rgba(8,10,11,0.9)';
    ctx.strokeStyle = 'rgba(132,204,84,0.75)';
    ctx.lineWidth = 1.2;
    const tw = Math.min(420, w * 0.6);
    ctx.beginPath();
    ctx.roundRect((w - tw) / 2, 82, tw, 34, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#edf5e7';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.toast, w / 2, 104);
  }
  if (game.subMode === 'editor') {
    ctx.fillStyle = 'rgba(10,13,14,0.86)';
    ctx.fillRect(16, h - 72, 260, 52);
    ctx.fillStyle = p.accent;
    ctx.font = 'bold 10px serif';
    ctx.textAlign = 'left';
    ctx.fillText('3D MAP EDITOR · LIVE SCENE', 28, h - 52);
    ctx.fillStyle = '#c8d4ce';
    ctx.font = '9px sans-serif';
    ctx.fillText('Pilih region, lalu gunakan kontrol untuk memeriksa dunia.', 28, h - 36);
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || '').split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = next;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}
