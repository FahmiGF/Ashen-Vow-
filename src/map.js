// Ashen Vow — interactive Map v1.
// Pure model helpers (tested in Node) plus a canvas view. The model is
// generated from the same ROOMS config the game uses, so new rooms and zones
// appear on the map automatically.
import { ROOMS } from './core.js';
import { zoneForRoom } from './zones.js';

export const MAP_CELL = 64;
export const MAX_PINS = 10;
export const MIN_SCALE = 0.5;
export const MAX_SCALE = 3.6;

// Spatial layout for the v0.1.0 room set. Coordinates are in map-grid units.
// The mycelial branch loops out of room 2 and rejoins it through the altar.
export const MAP_LAYOUT = [
  { gridX: 0, gridY: 3, w: 2, h: 1, exits: [1] },
  { gridX: 2, gridY: 3, w: 2, h: 1, exits: [0, 2] },
  { gridX: 4, gridY: 3, w: 2, h: 1, exits: [1, 3, 8, 13] },
  { gridX: 6, gridY: 3, w: 2, h: 1, exits: [2, 4] },
  { gridX: 6, gridY: 1, w: 2, h: 1, exits: [3, 5] },
  { gridX: 6, gridY: -1, w: 2, h: 1, exits: [4, 6] },
  { gridX: 4, gridY: -1, w: 2, h: 1, exits: [5, 7] },
  { gridX: 2, gridY: -1, w: 2, h: 1, exits: [6] },
  { gridX: 4, gridY: 5, w: 2, h: 1, exits: [2, 9] },
  { gridX: 4, gridY: 7, w: 2, h: 1, exits: [8, 10] },
  { gridX: 2, gridY: 7, w: 2, h: 1, exits: [9, 11] },
  { gridX: 0, gridY: 7, w: 2, h: 1, exits: [10, 13, 12] },
  { gridX: 0, gridY: 9, w: 2, h: 1, exits: [11] },
  { gridX: 2, gridY: 5, w: 2, h: 1, exits: [11, 2] },
];

export const PIN_TYPES = [
  { id: 'note', label: 'Catatan', glyph: '✎', color: '#e8c895' },
  { id: 'water', label: 'Air', glyph: '≈', color: '#5fd3c2' },
  { id: 'key', label: 'Butuh Kunci', glyph: '⚿', color: '#e0b45f' },
  { id: 'return', label: 'Kembali Nanti', glyph: '↻', color: '#b07be8' },
];

export const LEGEND = [
  { id: 'shrine', glyph: '⌂', label: 'Warung / Shrine', color: '#e0b45f' },
  { id: 'boss', glyph: '☠', label: 'Boss', color: '#e0553b' },
  { id: 'relic', glyph: '✦', label: 'Relik', color: '#8fd0ff' },
  { id: 'gate', glyph: '⌐', label: 'Gerbang Terkunci', color: '#c7b28a' },
  { id: 'pin', glyph: '✎', label: 'Pin Pemain', color: '#e8c895' },
];

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

export function defaultMapState(roomCount = ROOMS.length) {
  return { discovered: Array.from({ length: roomCount }, () => false), pins: [] };
}

export function sanitizeMapState(raw, roomCount = ROOMS.length) {
  const discovered = Array.from({ length: roomCount }, (_, i) => !!raw?.discovered?.[i]);
  const pins = [];
  if (Array.isArray(raw?.pins)) {
    for (const pin of raw.pins.slice(0, MAX_PINS)) {
      if (!pin || !Number.isFinite(pin.x) || !Number.isFinite(pin.y)) continue;
      const type = PIN_TYPES.some((t) => t.id === pin.type) ? pin.type : 'note';
      pins.push({
        x: Number(pin.x),
        y: Number(pin.y),
        type,
        room: Number.isInteger(pin.room) ? pin.room : null,
      });
    }
  }
  return { discovered, pins };
}

// Immutable discovery so React-style diffing / tests stay simple.
export function discoverRoom(state, index, roomCount = ROOMS.length) {
  if (!Number.isInteger(index) || index < 0 || index >= roomCount) return state;
  if (state?.discovered?.[index]) return state;
  const next = sanitizeMapState(state, roomCount);
  next.discovered[index] = true;
  return next;
}

export function addPin(state, pin, maxPins = MAX_PINS) {
  const next = sanitizeMapState(state, state?.discovered?.length || ROOMS.length);
  if (next.pins.length >= maxPins) return { state: next, ok: false, reason: 'limit' };
  if (!pin || !Number.isFinite(pin.x) || !Number.isFinite(pin.y)) {
    return { state: next, ok: false, reason: 'invalid' };
  }
  const type = PIN_TYPES.some((t) => t.id === pin.type) ? pin.type : 'note';
  next.pins.push({
    x: Number(pin.x),
    y: Number(pin.y),
    type,
    room: Number.isInteger(pin.room) ? pin.room : null,
  });
  return { state: next, ok: true, reason: null };
}

export function removePin(state, index) {
  const next = sanitizeMapState(state, state?.discovered?.length || ROOMS.length);
  if (!Number.isInteger(index) || index < 0 || index >= next.pins.length) {
    return { state: next, removed: false };
  }
  next.pins.splice(index, 1);
  return { state: next, removed: true };
}

export function roomFeatures(room) {
  const features = [];
  if (room?.checkpoint) features.push('shrine');
  if (room?.boss) features.push('boss');
  if (room?.relic) features.push('relic');
  if (room?.gate || (Array.isArray(room?.gates) && room.gates.length)) features.push('gate');
  return features;
}

function neighbours(index, layout) {
  const out = new Set(layout[index]?.exits || []);
  layout.forEach((node, i) => {
    if ((node.exits || []).includes(index)) out.add(i);
  });
  return out;
}

export function mapNodes(
  rooms = ROOMS,
  layout = MAP_LAYOUT,
  mapState = defaultMapState(rooms.length),
  cleared = [],
) {
  const discovered = Array.from({ length: rooms.length }, (_, i) => !!mapState?.discovered?.[i]);
  return rooms.map((room, index) => {
    const node = layout[index] || { gridX: index, gridY: 0, w: 2, h: 1, exits: [] };
    const adjacent =
      !discovered[index] &&
      [...neighbours(index, layout)].some((other) => discovered[other]);
    return {
      index,
      room,
      zone: zoneForRoom(index),
      x: node.gridX * MAP_CELL,
      y: node.gridY * MAP_CELL,
      w: (node.w || 1) * MAP_CELL,
      h: (node.h || 1) * MAP_CELL,
      centerX: node.gridX * MAP_CELL + ((node.w || 1) * MAP_CELL) / 2,
      centerY: node.gridY * MAP_CELL + ((node.h || 1) * MAP_CELL) / 2,
      exits: [...(node.exits || [])],
      discovered: discovered[index],
      adjacent,
      cleared: !!cleared?.[index],
      features: roomFeatures(room),
    };
  });
}

export function mapContentBounds(nodes) {
  if (!nodes.length) return { minX: 0, minY: 0, maxX: MAP_CELL, maxY: MAP_CELL };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.w);
    maxY = Math.max(maxY, node.y + node.h);
  }
  return { minX, minY, maxX, maxY };
}

export function mapStats(mapState, rooms = ROOMS, cleared = []) {
  const discovered = rooms.filter((_, i) => !!mapState?.discovered?.[i]).length;
  const bosses = rooms.filter((room) => room.boss);
  const relics = rooms.filter((room) => room.relic);
  const bossIndices = rooms.map((room, i) => (room.boss ? i : -1)).filter((i) => i >= 0);
  const relicIndices = rooms.map((room, i) => (room.relic ? i : -1)).filter((i) => i >= 0);
  return {
    discovered,
    total: rooms.length,
    discoveredPct: rooms.length ? Math.round((discovered / rooms.length) * 100) : 0,
    cleared: rooms.filter((_, i) => !!cleared?.[i]).length,
    bossesTotal: bosses.length,
    bossesDefeated: bossIndices.filter((i) => !!cleared?.[i]).length,
    relicsTotal: relics.length,
    relicsFound: relicIndices.filter((i) => !!cleared?.[i]).length,
    pins: mapState?.pins?.length || 0,
  };
}

export function hitTestNode(nodes, worldX, worldY) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (
      worldX >= node.x &&
      worldX <= node.x + node.w &&
      worldY >= node.y &&
      worldY <= node.y + node.h
    ) {
      return node;
    }
  }
  return null;
}

function hexToRgba(hex, alpha) {
  const clean = String(hex || '#ffffff').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full.slice(0, 6), 16);
  if (!Number.isFinite(n)) return `rgba(255,255,255,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

// Canvas view. DOM-free at module scope so Node tests can import the model.
export class MapView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext ? canvas.getContext('2d') : null;
    this.nodes = [];
    this.pins = [];
    this.currentIndex = -1;
    this.cleared = [];
    this.pinType = 'note';
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.fitted = false;
    this.hoverIndex = -1;
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const cssW = Math.max(240, Math.round(rect.width || this.canvas.clientWidth || 720));
    const cssH = Math.max(220, Math.round(rect.height || this.canvas.clientHeight || 460));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.width = cssW;
    this.height = cssH;
    this.dpr = dpr;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    if (!this.fitted) this.fit();
  }

  setData({ nodes, pins, currentIndex, cleared }) {
    this.nodes = nodes || [];
    this.pins = pins || [];
    this.currentIndex = Number.isInteger(currentIndex) ? currentIndex : -1;
    this.cleared = cleared || [];
    this.resize();
  }

  fit() {
    if (!this.width || !this.height || !this.nodes.length) return;
    const bounds = mapContentBounds(this.nodes);
    const pad = 56;
    const scale = Math.min(
      (this.width - pad * 2) / Math.max(1, bounds.maxX - bounds.minX),
      (this.height - pad * 2) / Math.max(1, bounds.maxY - bounds.minY),
    );
    this.scale = clamp(scale, MIN_SCALE, MAX_SCALE);
    this.offsetX = this.width / 2 - ((bounds.minX + bounds.maxX) / 2) * this.scale;
    this.offsetY = this.height / 2 - ((bounds.minY + bounds.maxY) / 2) * this.scale;
    this.fitted = true;
  }

  recenterOn(index = this.currentIndex) {
    const node = this.nodes.find((n) => n.index === index);
    if (!node) {
      this.fit();
      return;
    }
    this.scale = clamp(1.8, MIN_SCALE, MAX_SCALE);
    this.offsetX = this.width / 2 - node.centerX * this.scale;
    this.offsetY = this.height / 2 - node.centerY * this.scale;
    this.fitted = true;
  }

  worldToScreen(x, y) {
    return { x: this.offsetX + x * this.scale, y: this.offsetY + y * this.scale };
  }

  screenToWorld(x, y) {
    return { x: (x - this.offsetX) / this.scale, y: (y - this.offsetY) / this.scale };
  }

  toLocal(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  nodeAtScreen(x, y) {
    const world = this.screenToWorld(x, y);
    return hitTestNode(this.nodes, world.x, world.y);
  }

  panBy(dx, dy) {
    this.offsetX += dx;
    this.offsetY += dy;
  }

  zoomAt(factor, sx = this.width / 2, sy = this.height / 2) {
    const before = this.screenToWorld(sx, sy);
    this.scale = clamp(this.scale * factor, MIN_SCALE, MAX_SCALE);
    this.offsetX = sx - before.x * this.scale;
    this.offsetY = sy - before.y * this.scale;
  }

  draw(time = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const { width, height, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#0a0807');
    bg.addColorStop(1, '#120d09');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Grid dots
    const step = 28;
    ctx.fillStyle = 'rgba(200,170,120,0.06)';
    for (let x = step; x < width; x += step) {
      for (let y = step; y < height; y += step) ctx.fillRect(x, y, 1, 1);
    }

    // Connections first so rooms sit on top.
    ctx.lineWidth = 2;
    for (const node of this.nodes) {
      if (!node.discovered) continue;
      for (const exit of node.exits) {
        const other = this.nodes.find((n) => n.index === exit);
        if (!other) continue;
        if (!other.discovered && !other.adjacent) continue;
        const a = this.worldToScreen(node.centerX, node.centerY);
        const b = this.worldToScreen(other.centerX, other.centerY);
        ctx.setLineDash(other.discovered ? [] : [5, 6]);
        ctx.strokeStyle = hexToRgba(node.zone.color, other.discovered ? 0.5 : 0.24);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    for (const node of this.nodes) {
      if (!node.discovered && !node.adjacent) continue;
      this.drawNode(ctx, node, time);
    }

    for (let i = 0; i < this.pins.length; i++) this.drawPin(ctx, this.pins[i], i);
  }

  drawNode(ctx, node, time) {
    const pos = this.worldToScreen(node.x, node.y);
    const w = node.w * this.scale;
    const h = node.h * this.scale;
    const hovered = this.hoverIndex === node.index;
    const color = node.zone.color;

    ctx.save();
    rr(ctx, pos.x, pos.y, w, h, 8);
    ctx.fillStyle = hexToRgba(color, node.discovered ? (hovered ? 0.3 : 0.2) : 0.05);
    ctx.fill();
    ctx.lineWidth = hovered ? 2.4 : 1.6;
    ctx.strokeStyle = hexToRgba(color, node.discovered ? 0.95 : 0.4);
    if (!node.discovered) ctx.setLineDash([4, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Zone stripe
    ctx.fillStyle = hexToRgba(color, node.discovered ? 0.8 : 0.3);
    ctx.fillRect(pos.x + 6, pos.y + 6, Math.max(10, w - 12), 3);

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    if (node.discovered) {
      ctx.fillStyle = '#f1e3c8';
      ctx.font = `600 ${Math.max(9, Math.min(13, w / 11))}px Cinzel, Georgia, serif`;
      const label = node.room.name;
      const max = Math.max(30, w - 18);
      let text = label;
      while (text.length > 3 && ctx.measureText(text).width > max) text = text.slice(0, -1);
      if (text !== label) text = `${text.slice(0, -1)}…`;
      ctx.fillText(text, pos.x + 9, pos.y + h / 2 + 1);
    } else {
      ctx.fillStyle = 'rgba(210,190,160,0.5)';
      ctx.font = '600 11px Cinzel, Georgia, serif';
      ctx.fillText('?', pos.x + w / 2 - 3, pos.y + h / 2 + 1);
    }

    // Feature glyphs
    const glyphSize = Math.max(10, Math.min(14, h * 0.26));
    let gx = pos.x + 9;
    const gy = pos.y + h - glyphSize * 0.75;
    ctx.font = `${glyphSize}px Georgia, serif`;
    ctx.textAlign = 'left';
    for (const feature of node.features) {
      if (feature === 'shrine') {
        ctx.fillStyle = '#e0b45f';
        ctx.fillText('⌂', gx, gy);
        gx += glyphSize + 2;
      } else if (feature === 'relic') {
        ctx.fillStyle = '#8fd0ff';
        ctx.fillText('✦', gx, gy);
        gx += glyphSize + 2;
      } else if (feature === 'gate') {
        ctx.fillStyle = 'rgba(199,178,138,0.7)';
        ctx.fillText('⌐', gx, gy);
        gx += glyphSize + 2;
      }
    }

    if (node.features.includes('boss')) {
      ctx.textAlign = 'right';
      ctx.font = `${Math.max(12, glyphSize + 2)}px Georgia, serif`;
      ctx.fillStyle = node.cleared ? 'rgba(120,112,100,0.8)' : '#e0553b';
      ctx.fillText('☠', pos.x + w - 8, pos.y + 17);
    }
    ctx.restore();

    if (node.index === this.currentIndex) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 3);
      const cx = pos.x + w - 13;
      const cy = pos.y + h - 13;
      ctx.beginPath();
      ctx.arc(cx, cy, 5 + pulse * 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,196,110,${0.12 + pulse * 0.2})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffce85';
      ctx.fill();
    }
  }

  drawPin(ctx, pin, index) {
    const pos = this.worldToScreen(pin.x, pin.y);
    const type = PIN_TYPES.find((t) => t.id === pin.type) || PIN_TYPES[0];
    ctx.save();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(type.color, 0.22);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = type.color;
    ctx.stroke();
    ctx.fillStyle = type.color;
    ctx.font = '10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type.glyph, pos.x, pos.y + 0.5);
    ctx.restore();
    void index;
  }
}
