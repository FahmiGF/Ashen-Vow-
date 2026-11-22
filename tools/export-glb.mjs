// Ashen Vow — 3D asset authoring pipeline.
// Generates real binary glTF 2.0 (.glb) files with:
//   · indexed triangle meshes with per-vertex UVs and PBR metallic-roughness materials
//   · a joint hierarchy + skin (JOINTS_0 / WEIGHTS_0) and inverse bind matrices
//   · authored animation clips (Idle / Walk / Attack) as sampled rotation samplers
//   · three LOD variants and a collision proxy mesh per character
// Run: node tools/export-glb.mjs
// Everything is generated from code, so there are no binary source assets in git
// history and the runtime still has zero dependencies.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'assets', '3d');

// ── vector helpers ────────────────────────────────────────────────────────
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const length = (a) => Math.hypot(a[0], a[1], a[2]);
function norm(a) {
  const l = length(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
function rotateVec(v, rot) {
  const [rx, ry, rz] = rot;
  let [x, y, z] = v;
  let c = Math.cos(rz);
  let s = Math.sin(rz);
  [x, y] = [x * c - y * s, x * s + y * c];
  c = Math.cos(ry);
  s = Math.sin(ry);
  [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(rx);
  s = Math.sin(rx);
  [y, z] = [y * c - z * s, y * s + z * c];
  return [x, y, z];
}
function eulerQuat(rx, ry, rz) {
  const cx = Math.cos(rx / 2), sx = Math.sin(rx / 2);
  const cy = Math.cos(ry / 2), sy = Math.sin(ry / 2);
  const cz = Math.cos(rz / 2), sz = Math.sin(rz / 2);
  return [
    sx * cy * cz + cx * sy * sz,
    cx * sy * cz - sx * cy * sz,
    cx * cy * sz + sx * sy * cz,
    cx * cy * cz - sx * sy * sz,
  ];
}

// ── materials ─────────────────────────────────────────────────────────────
const MATERIALS = {
  steel: { base: [0.56, 0.58, 0.62, 1], metallic: 0.92, roughness: 0.32 },
  steelLight: { base: [0.74, 0.76, 0.8, 1], metallic: 0.95, roughness: 0.22 },
  steelDark: { base: [0.3, 0.32, 0.36, 1], metallic: 0.85, roughness: 0.45 },
  gold: { base: [0.85, 0.68, 0.28, 1], metallic: 1, roughness: 0.26, emissive: [0.06, 0.04, 0.01] },
  cloth: { base: [0.52, 0.16, 0.16, 1], metallic: 0, roughness: 0.88 },
  clothBlue: { base: [0.17, 0.24, 0.42, 1], metallic: 0, roughness: 0.9 },
  clothGreen: { base: [0.22, 0.33, 0.22, 1], metallic: 0, roughness: 0.9 },
  leather: { base: [0.28, 0.19, 0.12, 1], metallic: 0.05, roughness: 0.78 },
  skin: { base: [0.66, 0.49, 0.38, 1], metallic: 0, roughness: 0.72 },
  dark: { base: [0.07, 0.07, 0.08, 1], metallic: 0.2, roughness: 0.6 },
  bone: { base: [0.82, 0.79, 0.68, 1], metallic: 0.05, roughness: 0.6 },
  bark: { base: [0.3, 0.22, 0.14, 1], metallic: 0, roughness: 0.94 },
  barkDark: { base: [0.18, 0.13, 0.09, 1], metallic: 0, roughness: 0.96 },
  leaf: { base: [0.2, 0.36, 0.19, 1], metallic: 0, roughness: 0.85 },
  hide: { base: [0.35, 0.22, 0.16, 1], metallic: 0, roughness: 0.82 },
  hideDark: { base: [0.2, 0.13, 0.1, 1], metallic: 0, roughness: 0.86 },
  chitin: { base: [0.31, 0.19, 0.42, 1], metallic: 0.35, roughness: 0.38 },
  chitinLight: { base: [0.48, 0.34, 0.6, 1], metallic: 0.5, roughness: 0.3 },
  glow: { base: [0.5, 0.85, 0.55, 1], metallic: 0, roughness: 0.4, emissive: [0.42, 0.85, 0.36] },
  ember: { base: [0.8, 0.35, 0.12, 1], metallic: 0, roughness: 0.5, emissive: [0.85, 0.3, 0.05] },
  stone: { base: [0.42, 0.43, 0.42, 1], metallic: 0.02, roughness: 0.95 },
  wood: { base: [0.34, 0.24, 0.14, 1], metallic: 0, roughness: 0.92 },
  thatch: { base: [0.48, 0.37, 0.2, 1], metallic: 0, roughness: 0.98 },
  crystal: { base: [0.55, 0.78, 0.95, 1], metallic: 0.1, roughness: 0.12, emissive: [0.18, 0.36, 0.55] },
};

// ── mesh builder ──────────────────────────────────────────────────────────
class Mesh {
  constructor(detail, matIndex) {
    this.detail = detail;
    this.matIndex = matIndex;
    this.pos = [];
    this.nrm = [];
    this.uv = [];
    this.jnt = [];
    this.groups = new Map();
  }

  get segments() {
    return this.detail === 0 ? 14 : this.detail === 1 ? 9 : 5;
  }

  vert(p, n, uv, joint) {
    this.pos.push(p[0], p[1], p[2]);
    this.nrm.push(n[0], n[1], n[2]);
    this.uv.push(uv[0], uv[1]);
    this.jnt.push(joint);
    return this.pos.length / 3 - 1;
  }

  tri(a, b, c, material) {
    const index = this.matIndex(material);
    if (!this.groups.has(index)) this.groups.set(index, []);
    this.groups.get(index).push(a, b, c);
  }

  quad(a, b, c, d, material) {
    this.tri(a, b, c, material);
    this.tri(a, c, d, material);
  }

  // Quad with an explicit normal and UV rectangle; used by boxes and slabs.
  face(p0, p1, p2, p3, normal, material, uvScale = 1) {
    const n = norm(normal);
    const a = this.vert(p0, n, [0, 0], this.currentJoint);
    const b = this.vert(p1, n, [uvScale, 0], this.currentJoint);
    const c = this.vert(p2, n, [uvScale, uvScale], this.currentJoint);
    const d = this.vert(p3, n, [0, uvScale], this.currentJoint);
    this.quad(a, b, c, d, material);
  }

  box(center, size, joint, material, rot = [0, 0, 0]) {
    this.currentJoint = joint;
    const hx = size[0] / 2;
    const hy = size[1] / 2;
    const hz = size[2] / 2;
    const corners = [];
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1]) {
          corners.push(add(center, rotateVec([sx * hx, sy * hy, sz * hz], rot)));
        }
      }
    }
    // index layout: x*major + y + z with -1 first
    const c = (ix, iy, iz) => corners[ix * 4 + iy * 2 + iz];
    const rotN = (v) => norm(rotateVec(v, rot));
    this.face(c(0, 0, 1), c(1, 0, 1), c(1, 1, 1), c(0, 1, 1), rotN([0, 0, 1]), material); // front
    this.face(c(1, 0, 0), c(0, 0, 0), c(0, 1, 0), c(1, 1, 0), rotN([0, 0, -1]), material); // back
    this.face(c(1, 0, 1), c(1, 0, 0), c(1, 1, 0), c(1, 1, 1), rotN([1, 0, 0]), material); // right
    this.face(c(0, 0, 0), c(0, 0, 1), c(0, 1, 1), c(0, 1, 0), rotN([-1, 0, 0]), material); // left
    this.face(c(0, 1, 1), c(1, 1, 1), c(1, 1, 0), c(0, 1, 0), rotN([0, 1, 0]), material); // top
    this.face(c(0, 0, 0), c(1, 0, 0), c(1, 0, 1), c(0, 0, 1), rotN([0, -1, 0]), material); // bottom
  }

  // Tapered slab between two rectangular cross-sections; used for crests, capes,
  // tree trunks, blades and roots.
  taper(bottomCenter, bottomSize, topCenter, topSize, joint, material) {
    this.currentJoint = joint;
    const ring = (center, size) => {
      const [hx, , hz] = size;
      return [
        [center[0] - hx, center[1], center[2] + hz],
        [center[0] + hx, center[1], center[2] + hz],
        [center[0] + hx, center[1], center[2] - hz],
        [center[0] - hx, center[1], center[2] - hz],
      ];
    };
    const b = ring(bottomCenter, bottomSize);
    const t = ring(topCenter, topSize);
    const up = norm(sub(topCenter, bottomCenter));
    this.face(b[0], b[1], t[1], t[0], [0, 0, 1], material);
    this.face(b[1], b[2], t[2], t[1], [1, 0, 0], material);
    this.face(b[2], b[3], t[3], t[2], [0, 0, -1], material);
    this.face(b[3], b[0], t[0], t[3], [-1, 0, 0], material);
    this.face(t[0], t[1], t[2], t[3], up, material);
    this.face(b[3], b[2], b[1], b[0], mul(up, -1), material);
  }

  cylinder(p0, p1, r0, r1, joint, material, segments = this.segments, caps = true) {
    this.currentJoint = joint;
    const axis = norm(sub(p1, p0));
    const reference = Math.abs(axis[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
    const u = norm(cross(reference, axis));
    const v = cross(axis, u);
    const ring = (center, radius) => {
      const out = [];
      for (let i = 0; i < segments; i += 1) {
        const a = (i / segments) * Math.PI * 2;
        const dir = add(mul(u, Math.cos(a)), mul(v, Math.sin(a)));
        out.push({ p: add(center, mul(dir, radius)), n: dir, uv: [i / segments, 0] });
      }
      return out;
    };
    const low = ring(p0, r0);
    const high = ring(p1, r1);
    for (let i = 0; i < segments; i += 1) {
      const j = (i + 1) % segments;
      const a = this.vert(low[i].p, low[i].n, low[i].uv, joint);
      const b = this.vert(low[j].p, low[j].n, low[j].uv, joint);
      const c = this.vert(high[j].p, high[j].n, high[j].uv, joint);
      const d = this.vert(high[i].p, high[i].n, high[i].uv, joint);
      this.quad(a, b, c, d, material);
    }
    if (caps) {
      const capLow = norm(mul(axis, -1));
      const capHigh = axis;
      const centerLow = this.vert(p0, capLow, [0.5, 0.5], joint);
      const centerHigh = this.vert(p1, capHigh, [0.5, 0.5], joint);
      for (let i = 0; i < segments; i += 1) {
        const j = (i + 1) % segments;
        const a = this.vert(low[i].p, capLow, [0, 0], joint);
        const b = this.vert(low[j].p, capLow, [1, 0], joint);
        this.tri(centerLow, b, a, material);
        const c = this.vert(high[i].p, capHigh, [0, 1], joint);
        const d = this.vert(high[j].p, capHigh, [1, 1], joint);
        this.tri(centerHigh, c, d, material);
      }
    }
  }

  sphere(center, radius, joint, material, squash = [1, 1, 1], segments = this.segments, rings = Math.max(4, Math.round(this.segments / 2))) {
    this.currentJoint = joint;
    const grid = [];
    for (let r = 0; r <= rings; r += 1) {
      const phi = (r / rings) * Math.PI;
      const row = [];
      for (let s = 0; s <= segments; s += 1) {
        const theta = (s / segments) * Math.PI * 2;
        const n = [
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta),
        ];
        const p = [
          center[0] + n[0] * radius * squash[0],
          center[1] + n[1] * radius * squash[1],
          center[2] + n[2] * radius * squash[2],
        ];
        row.push(this.vert(p, n, [s / segments, r / rings], joint));
      }
      grid.push(row);
    }
    for (let r = 0; r < rings; r += 1) {
      for (let s = 0; s < segments; s += 1) {
        this.quad(grid[r][s], grid[r][s + 1], grid[r + 1][s + 1], grid[r + 1][s], material);
      }
    }
  }

  cone(center, radius, height, joint, material) {
    this.cylinder(center, add(center, [0, height, 0]), radius, radius * 0.08, joint, material, this.segments, true);
  }
}

// ── skeletons ─────────────────────────────────────────────────────────────
const HUMANOID = [
  { name: 'root', parent: null, t: [0, 0.95, 0] },
  { name: 'spine', parent: 'root', t: [0, 0.2, 0] },
  { name: 'chest', parent: 'spine', t: [0, 0.2, 0] },
  { name: 'neck', parent: 'chest', t: [0, 0.18, 0] },
  { name: 'head', parent: 'neck', t: [0, 0.12, 0] },
  { name: 'shoulderL', parent: 'chest', t: [-0.22, 0.12, 0] },
  { name: 'armL', parent: 'shoulderL', t: [0, -0.08, 0] },
  { name: 'forearmL', parent: 'armL', t: [0, -0.26, 0] },
  { name: 'handL', parent: 'forearmL', t: [0, -0.24, 0] },
  { name: 'shoulderR', parent: 'chest', t: [0.22, 0.12, 0] },
  { name: 'armR', parent: 'shoulderR', t: [0, -0.08, 0] },
  { name: 'forearmR', parent: 'armR', t: [0, -0.26, 0] },
  { name: 'handR', parent: 'forearmR', t: [0, -0.24, 0] },
  { name: 'thighL', parent: 'root', t: [-0.11, -0.06, 0] },
  { name: 'shinL', parent: 'thighL', t: [0, -0.42, 0] },
  { name: 'footL', parent: 'shinL', t: [0, -0.4, 0.03] },
  { name: 'thighR', parent: 'root', t: [0.11, -0.06, 0] },
  { name: 'shinR', parent: 'thighR', t: [0, -0.42, 0] },
  { name: 'footR', parent: 'shinR', t: [0, -0.4, 0.03] },
  { name: 'cape', parent: 'chest', t: [0, 0.04, -0.13] },
];
const HUMAN_ANIM = {
  spine: ['spine'], chest: ['chest'], head: ['head'],
  arms: ['armL', 'armR'], legs: ['thighL', 'thighR'], tail: [], wings: [],
};

const BEAST = [
  { name: 'root', parent: null, t: [0, 0.8, 0] },
  { name: 'body', parent: 'root', t: [0, 0.08, 0] },
  { name: 'neck', parent: 'body', t: [0, 0.1, 0.34] },
  { name: 'head', parent: 'neck', t: [0, 0.02, 0.22] },
  { name: 'tail', parent: 'body', t: [0, 0.02, -0.4] },
  { name: 'legFL', parent: 'body', t: [-0.2, -0.06, 0.3] },
  { name: 'shinFL', parent: 'legFL', t: [0, -0.34, 0] },
  { name: 'legFR', parent: 'body', t: [0.2, -0.06, 0.3] },
  { name: 'shinFR', parent: 'legFR', t: [0, -0.34, 0] },
  { name: 'legBL', parent: 'body', t: [-0.2, -0.06, -0.26] },
  { name: 'shinBL', parent: 'legBL', t: [0, -0.34, 0] },
  { name: 'legBR', parent: 'body', t: [0.2, -0.06, -0.26] },
  { name: 'shinBR', parent: 'legBR', t: [0, -0.34, 0] },
];
const BEAST_ANIM = {
  spine: ['body'], chest: ['body'], head: ['head'],
  arms: [], legs: ['legFL', 'legBR', 'legFR', 'legBL'], tail: ['tail'], wings: [],
};

const TITAN = [
  { name: 'root', parent: null, t: [0, 2.1, 0] },
  { name: 'trunk', parent: 'root', t: [0, 1.3, 0] },
  { name: 'chest', parent: 'trunk', t: [0, 1.5, 0] },
  { name: 'head', parent: 'chest', t: [0, 0.95, 0] },
  { name: 'canopy', parent: 'head', t: [0, 0.7, 0] },
  { name: 'armL', parent: 'chest', t: [-1.15, 0.55, 0] },
  { name: 'forearmL', parent: 'armL', t: [-1.3, 0.05, 0] },
  { name: 'armR', parent: 'chest', t: [1.15, 0.55, 0] },
  { name: 'forearmR', parent: 'armR', t: [1.3, 0.05, 0] },
  { name: 'legL', parent: 'root', t: [-0.75, -0.7, 0] },
  { name: 'legR', parent: 'root', t: [0.75, -0.7, 0] },
];
const TITAN_ANIM = {
  spine: ['trunk'], chest: ['chest'], head: ['head'],
  arms: ['armL', 'armR'], legs: ['legL', 'legR'], tail: [], wings: ['canopy'],
};

function jointWorld(skeleton) {
  const byName = new Map(skeleton.map((joint) => [joint.name, joint]));
  const cache = new Map();
  const world = (name) => {
    if (cache.has(name)) return cache.get(name);
    const joint = byName.get(name);
    const parent = joint.parent ? world(joint.parent) : [0, 0, 0];
    const value = add(parent, joint.t);
    cache.set(name, value);
    return value;
  };
  const out = new Map();
  for (const joint of skeleton) out.set(joint.name, world(joint.name));
  return out;
}

// ── character part authoring ──────────────────────────────────────────────
// Every part is authored in bind-pose world space so the inverse bind matrices
// stay exact translations of each joint origin.
function humanoid(m, opts) {
  const d = m.detail;
  const skin = opts.skin || 'skin';
  const plate = opts.plate || 'steel';
  const plateDark = opts.plateDark || 'steelDark';
  const cloth = opts.cloth || 'cloth';
  const trim = opts.trim || 'gold';
  const J = { x: 0 };

  // Pelvis + belt
  m.box([0, 0.93, 0], [0.32, 0.2, 0.24], 'root', plateDark);
  m.box([0, 1.02, 0], [0.34, 0.05, 0.26], 'root', 'leather');
  m.box([0, 1.0, 0.13], [0.09, 0.07, 0.03], 'root', trim);

  // Torso, chest plate and tabard
  m.box([0, 1.22, 0], [0.4, 0.32, 0.26], 'chest', plate);
  if (d < 2) {
    m.box([0, 1.25, 0.135], [0.28, 0.26, 0.035], 'chest', plateDark);
    m.box([0, 1.36, 0.15], [0.3, 0.04, 0.03], 'chest', trim);
  }
  m.taper([0, 1.2, 0.14], [0.13, 0, 0.01], [0, 0.86, 0.15], [0.11, 0, 0.01], 'chest', cloth);

  // Neck
  m.cylinder([0, 1.46, 0], [0, 1.58, 0], 0.07, 0.065, 'neck', skin);

  // Head, helm and visor
  m.box([0, 1.66, 0], [0.21, 0.23, 0.22], 'head', skin);
  m.sphere([0, 1.72, 0], 0.135, 'head', plate, [1, 0.95, 1.02]);
  m.box([0, 1.65, 0.11], [0.19, 0.045, 0.03], 'head', 'dark');
  if (d < 2) {
    m.box([0, 1.79, -0.02], [0.05, 0.09, 0.16], 'head', trim);
    m.taper([0, 1.82, -0.03], [0.06, 0, 0.12], [0, 1.92, -0.06], [0.01, 0, 0.02], 'head', cloth);
  }

  // Pauldrons, arms, gauntlets
  for (const side of [-1, 1]) {
    const label = side < 0 ? 'L' : 'R';
    m.sphere([side * 0.24, 1.42, 0], 0.11, `shoulder${label}`, plate, [1.15, 0.85, 1.1]);
    m.box([side * 0.24, 1.27, 0], [0.12, 0.26, 0.13], `arm${label}`, plateDark);
    m.box([side * 0.24, 1.02, 0], [0.11, 0.24, 0.12], `forearm${label}`, plate);
    m.box([side * 0.24, 0.88, 0], [0.1, 0.1, 0.12], `hand${label}`, 'leather');
    if (d < 2) m.box([side * 0.24, 1.13, 0], [0.13, 0.04, 0.14], `forearm${label}`, trim);
  }

  // Legs and sabatons
  for (const side of [-1, 1]) {
    const label = side < 0 ? 'L' : 'R';
    m.box([side * 0.11, 0.68, 0], [0.16, 0.42, 0.18], `thigh${label}`, plateDark);
    m.box([side * 0.11, 0.28, 0], [0.14, 0.4, 0.15], `shin${label}`, plate);
    m.box([side * 0.11, 0.06, 0.04], [0.15, 0.1, 0.26], `foot${label}`, 'leather');
    if (d < 2) m.box([side * 0.11, 0.5, 0.06], [0.13, 0.05, 0.03], `shin${label}`, trim);
  }

  // Cape: two tapered slabs for a folded silhouette
  m.taper([0, 1.4, -0.13], [0.2, 0, 0.01], [0, 0.72, -0.2], [0.26, 0, 0.02], 'cape', cloth);
  if (d < 2) m.taper([-0.09, 1.36, -0.15], [0.08, 0, 0.01], [-0.1, 0.78, -0.23], [0.1, 0, 0.02], 'cape', 'clothBlue');

  if (opts.weapon === 'sword') {
    m.cylinder([0.24, 0.9, 0.02], [0.24, 0.98, 0.02], 0.022, 0.02, 'handR', 'leather');
    m.box([0.24, 0.99, 0.02], [0.14, 0.03, 0.04], 'handR', trim);
    m.taper([0.24, 1.0, 0.02], [0.045, 0, 0.008], [0.24, 1.5, 0.02], [0.012, 0, 0.004], 'handR', 'steelLight');
  }
  if (opts.weapon === 'staff') {
    m.cylinder([0.24, 1.55, 0.02], [0.24, 0.72, 0.02], 0.018, 0.022, 'handR', 'bark');
    m.sphere([0.24, 1.6, 0.02], 0.06, 'handR', 'glow');
  }
  if (opts.weapon === 'spear') {
    m.cylinder([0.24, 1.65, 0.02], [0.24, 0.75, 0.02], 0.017, 0.02, 'handR', 'bark');
    m.taper([0.24, 1.65, 0.02], [0.03, 0, 0.006], [0.24, 1.82, 0.02], [0.004, 0, 0.004], 'handR', 'steelLight');
  }
  if (opts.shield) {
    m.cylinder([-0.24, 1.05, 0.04], [-0.24, 1.05, 0.09], 0.22, 0.2, 'handL', plateDark, d === 0 ? 12 : 7);
    m.sphere([-0.24, 1.05, 0.1], 0.055, 'handL', trim, [1, 1, 0.6]);
  }
  return J;
}

function prowlerParts(m, opts = {}) {
  const d = m.detail;
  const hide = opts.hide || 'hide';
  const dark = opts.dark || 'hideDark';
  m.sphere([0, 0.86, 0], 0.28, 'body', hide, [0.82, 0.72, 1.5]);
  m.sphere([0, 0.92, 0.2], 0.2, 'body', hide, [1, 1, 1.1]);
  m.sphere([0, 0.95, 0.4], 0.19, 'neck', hide, [0.95, 0.9, 0.9]);
  m.sphere([0, 0.98, 0.56], 0.17, 'head', hide, [1, 0.95, 1.15]);
  m.taper([0, 0.96, 0.62], [0.09, 0, 0.05], [0, 0.9, 0.8], [0.05, 0, 0.02], 'head', dark);
  for (const side of [-1, 1]) {
    m.box([side * 0.07, 1.12, 0.55], [0.07, 0.12, 0.1], 'head', dark);
    if (d < 2) m.cylinder([side * 0.07, 1.2, 0.55], [side * 0.09, 1.36, 0.5], 0.018, 0.008, 'head', 'bone');
  }
  m.taper([0, 0.86, -0.34], [0.07, 0, 0.04], [0, 0.98, -0.78], [0.02, 0, 0.02], 'tail', dark);
  for (const [leg, side, front] of [['legFL', -1, 1], ['legFR', 1, 1], ['legBL', -1, -1], ['legBR', 1, -1]]) {
    const shin = `shin${leg.slice(3)}`;
    const z = front > 0 ? 0.3 : -0.26;
    m.cylinder([side * 0.2, 0.8, z], [side * 0.22, 0.46, z + 0.02], 0.06, 0.045, leg, hide);
    m.cylinder([side * 0.22, 0.46, z + 0.02], [side * 0.22, 0.1, z + 0.04], 0.045, 0.03, shin, dark);
    m.box([side * 0.22, 0.05, z + 0.08], [0.09, 0.07, 0.14], shin, dark);
  }
  if (d < 2) m.sphere([0, 0.9, 0.02], 0.255, 'body', 'glow', [0.35, 0.35, 0.9]);
}

function beetleParts(m) {
  const d = m.detail;
  m.sphere([0, 0.78, 0], 0.3, 'body', 'chitin', [1.05, 0.62, 1.35]);
  m.sphere([0, 0.86, 0], 0.24, 'body', 'chitinLight', [0.9, 0.6, 1.15]);
  m.sphere([0, 0.82, 0.36], 0.16, 'head', 'chitin', [1, 0.85, 1]);
  m.taper([0, 0.9, 0.42], [0.05, 0, 0.04], [0, 1.16, 0.62], [0.015, 0, 0.015], 'head', 'bone');
  for (const side of [-1, 1]) {
    m.cylinder([side * 0.12, 0.78, 0.44], [side * 0.26, 0.7, 0.62], 0.02, 0.012, 'head', 'bone');
  }
  for (const [leg, side, front] of [['legFL', -1, 1], ['legFR', 1, 1], ['legBL', -1, -1], ['legBR', 1, -1]]) {
    const shin = `shin${leg.slice(3)}`;
    const z = front > 0 ? 0.2 : -0.18;
    m.cylinder([side * 0.24, 0.74, z], [side * 0.36, 0.44, z + 0.06], 0.035, 0.025, leg, 'chitin');
    m.cylinder([side * 0.36, 0.44, z + 0.06], [side * 0.4, 0.06, z + 0.1], 0.025, 0.018, shin, 'dark');
  }
  if (d === 0) m.sphere([0, 0.72, 0.05], 0.12, 'body', 'glow', [1, 0.7, 1]);
}

function stalkerParts(m) {
  const d = m.detail;
  m.sphere([0, 1.5, 0], 0.3, 'body', 'barkDark', [0.9, 1.5, 0.9]);
  m.sphere([0, 2.0, 0.02], 0.17, 'head', 'bark', [1, 1.1, 1]);
  m.sphere([0, 2.02, 0.13], 0.07, 'head', 'glow');
  for (const side of [-1, 1]) {
    m.cylinder([side * 0.24, 1.62, 0], [side * 0.6, 1.2, 0.1], 0.07, 0.05, 'body', 'bark');
    if (d < 2) m.cylinder([side * 0.6, 1.2, 0.1], [side * 0.74, 0.86, 0.2], 0.05, 0.02, 'body', 'barkDark');
  }
  for (const [leg, side] of [['legFL', -1], ['legFR', 1], ['legBL', -1], ['legBR', 1]]) {
    const shin = `shin${leg.slice(3)}`;
    const z = leg.includes('F') ? 0.14 : -0.12;
    m.cylinder([side * 0.14, 1.3, z], [side * 0.3, 0.66, z], 0.06, 0.04, leg, 'barkDark');
    m.cylinder([side * 0.3, 0.66, z], [side * 0.24, 0.06, z + 0.05], 0.04, 0.025, shin, 'bark');
  }
  if (d < 2) {
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      m.cylinder(
        [Math.cos(a) * 0.22, 1.6 + i * 0.06, Math.sin(a) * 0.22],
        [Math.cos(a) * 0.44, 1.9 + i * 0.06, Math.sin(a) * 0.44],
        0.03, 0.005, 'body', 'bone',
      );
    }
  }
}

function alphaParts(m) {
  prowlerParts(m, { hide: 'hideDark', dark: 'ember' });
  // Oversized antlers and a scarred mane mark the E3 champion.
  for (const side of [-1, 1]) {
    m.cylinder([side * 0.1, 1.16, 0.5], [side * 0.26, 1.5, 0.42], 0.04, 0.025, 'head', 'bone');
    m.cylinder([side * 0.26, 1.5, 0.42], [side * 0.44, 1.72, 0.3], 0.025, 0.008, 'head', 'bone');
    m.cylinder([side * 0.26, 1.5, 0.42], [side * 0.2, 1.74, 0.52], 0.018, 0.006, 'head', 'bone');
  }
  m.sphere([0, 0.92, 0.02], 0.3, 'body', 'ember', [0.4, 0.42, 0.95]);
}

function titanParts(m) {
  const d = m.detail;
  m.cylinder([0, 0.2, 0], [0, 3.2, 0], 0.85, 0.5, 'trunk', 'bark', d === 0 ? 12 : 7);
  m.cylinder([0, 3.2, 0], [0, 4.4, 0], 0.5, 0.32, 'chest', 'bark', d === 0 ? 12 : 7);
  for (let i = 0; i < 3; i += 1) {
    m.box([0, 1.1 + i * 1.0, 0], [1.5 - i * 0.3, 0.16, 1.3 - i * 0.25], 'trunk', 'barkDark');
  }
  // Face hollow with two ember eyes.
  m.sphere([0, 4.35, 0.2], 0.42, 'head', 'barkDark', [1, 1.1, 0.75]);
  for (const side of [-1, 1]) m.sphere([side * 0.16, 4.4, 0.5], 0.11, 'head', 'glow');
  // Branch arms with claw splays.
  for (const side of [-1, 1]) {
    const arm = side < 0 ? 'armL' : 'armR';
    const fore = side < 0 ? 'forearmL' : 'forearmR';
    m.cylinder([side * 0.6, 4.0, 0], [side * 1.9, 3.5, 0.2], 0.3, 0.2, arm, 'bark', d === 0 ? 10 : 6);
    m.cylinder([side * 1.9, 3.5, 0.2], [side * 2.5, 2.4, 0.5], 0.2, 0.12, fore, 'barkDark', d === 0 ? 10 : 6);
    if (d < 2) {
      for (let i = 0; i < 3; i += 1) {
        m.cylinder([side * 2.5, 2.4, 0.5], [side * (2.7 + i * 0.1), 1.7 + i * 0.15, 0.4 + i * 0.2], 0.06, 0.01, fore, 'bone');
      }
    }
  }
  // Root legs.
  for (const side of [-1, 1]) {
    const leg = side < 0 ? 'legL' : 'legR';
    m.cylinder([side * 0.55, 1.6, 0], [side * 1.1, 0.1, 0.15], 0.3, 0.22, leg, 'barkDark', d === 0 ? 10 : 6);
    if (d < 2) {
      for (let i = 0; i < 3; i += 1) {
        m.cylinder([side * 1.1, 0.12, 0.15], [side * (1.3 + i * 0.2), 0.02, 0.1 + i * 0.25], 0.11, 0.04, leg, 'bark');
      }
    }
  }
  // Canopy crown.
  m.sphere([0, 5.5, 0], 1.5, 'canopy', 'leaf', [1.2, 0.8, 1.2], d === 0 ? 14 : 7);
  if (d < 2) {
    m.sphere([-1.0, 5.1, 0.3], 0.9, 'canopy', 'leaf', [1, 0.7, 1], 8, 5);
    m.sphere([1.0, 5.2, -0.2], 0.95, 'canopy', 'leaf', [1, 0.7, 1], 8, 5);
  }
  m.sphere([0, 2.6, 0.55], 0.35, 'trunk', 'glow', [1, 1.2, 0.5]);
}

// ── animation clips ───────────────────────────────────────────────────────
function clipsFor(skeleton, groups) {
  const ids = new Map(skeleton.map((joint, index) => [joint.name, index]));
  const rotChannel = (jointName, times, angles) => ({
    joint: ids.get(jointName),
    times,
    quats: angles.map(([rx, ry, rz]) => eulerQuat(rx, ry, rz)),
  });
  // Each clip owns its own channel list; sharing one array would leak walk keys
  // into the idle loop.
  const idle = [];
  const walk = [];
  const attack = [];

  // Idle — 1.8 s breathing loop.
  const idleTimes = [0, 0.9, 1.8];
  for (const jointName of groups.spine) idle.push(rotChannel(jointName, idleTimes, [[0.02, 0, 0], [0.05, 0.02, 0], [0.02, 0, 0]]));
  for (const jointName of groups.chest) idle.push(rotChannel(jointName, idleTimes, [[0, 0, 0], [-0.02, -0.03, 0], [0, 0, 0]]));
  for (const jointName of groups.head) idle.push(rotChannel(jointName, idleTimes, [[0, -0.06, 0], [0.03, 0.08, 0], [0, -0.06, 0]]));
  groups.arms.forEach((jointName, i) => {
    const sign = i === 0 ? 1 : -1;
    idle.push(rotChannel(jointName, idleTimes, [[0.04, 0, sign * 0.05], [0.09, 0, sign * 0.08], [0.04, 0, sign * 0.05]]));
  });
  for (const jointName of groups.tail) idle.push(rotChannel(jointName, idleTimes, [[0, -0.12, 0.05], [0, 0.12, -0.05], [0, -0.12, 0.05]]));
  for (const jointName of groups.wings) idle.push(rotChannel(jointName, idleTimes, [[0, 0.02, 0], [0, -0.02, 0], [0, 0.02, 0]]));

  // Walk — 1.0 s cycle with counter-swinging limbs.
  const walkTimes = [0, 0.25, 0.5, 0.75, 1.0];
  groups.legs.forEach((jointName, i) => {
    const sign = i % 2 === 0 ? 1 : -1;
    walk.push(rotChannel(jointName, walkTimes, [
      [0.5 * sign, 0, 0], [0, 0, 0], [-0.5 * sign, 0, 0], [0, 0, 0], [0.5 * sign, 0, 0],
    ]));
  });
  groups.arms.forEach((jointName, i) => {
    const sign = i === 0 ? -1 : 1;
    walk.push(rotChannel(jointName, walkTimes, [
      [0.42 * sign, 0, 0], [0, 0, 0], [-0.42 * sign, 0, 0], [0, 0, 0], [0.42 * sign, 0, 0],
    ]));
  });
  for (const jointName of groups.spine) walk.push(rotChannel(jointName, walkTimes, [[0, 0.07, 0], [0, 0, 0], [0, -0.07, 0], [0, 0, 0], [0, 0.07, 0]]));

  // Attack — 0.62 s wind-up, strike and recovery.
  const attackTimes = [0, 0.16, 0.3, 0.46, 0.62];
  const rightArm = groups.arms[1] || groups.arms[0];
  if (rightArm) {
    attack.push(rotChannel(rightArm, attackTimes, [
      [0, 0, 0], [-1.5, 0.35, 0], [-1.2, 0.5, 0.1], [0.85, 0.1, 0], [0, 0, 0],
    ]));
  }
  const leftArm = groups.arms[0];
  if (leftArm && groups.arms.length > 1) {
    attack.push(rotChannel(leftArm, attackTimes, [[0, 0, 0], [0.3, -0.3, 0], [0.4, -0.4, 0], [-0.2, 0.2, 0], [0, 0, 0]]));
  }
  for (const jointName of groups.spine) attack.push(rotChannel(jointName, attackTimes, [[0, 0, 0], [0, -0.35, 0], [0, -0.42, 0], [0.1, 0.3, 0], [0, 0, 0]]));
  for (const jointName of groups.head) attack.push(rotChannel(jointName, attackTimes, [[0, 0, 0], [0, 0.2, 0], [0, 0.25, 0], [0.12, -0.2, 0], [0, 0, 0]]));

  return [
    { name: 'Idle', channels: idle, duration: 1.8 },
    { name: 'Walk', channels: walk, duration: 1.0 },
    { name: 'Attack', channels: attack, duration: 0.62 },
  ].filter((clip) => clip.channels.length > 0);
}

// ── GLB packing ───────────────────────────────────────────────────────────
function createPacker() {
  const chunks = [];
  let byteLength = 0;
  const json = {
    asset: { version: '2.0', generator: 'Ashen Vow procedural asset pipeline' },
    scene: 0,
    scenes: [{ nodes: [] }],
    nodes: [],
    meshes: [],
    materials: [],
    accessors: [],
    bufferViews: [],
    buffers: [],
    skins: [],
    animations: [],
  };

  function align() {
    const pad = (4 - (byteLength % 4)) % 4;
    if (pad) {
      chunks.push(Buffer.alloc(pad));
      byteLength += pad;
    }
  }

  function addView(typedArray, target) {
    align();
    const bytes = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    const view = { buffer: 0, byteOffset: byteLength, byteLength: bytes.byteLength };
    if (target) view.target = target;
    json.bufferViews.push(view);
    chunks.push(Buffer.from(bytes));
    byteLength += bytes.byteLength;
    return json.bufferViews.length - 1;
  }

  function addAccessor(typedArray, type, componentType, target, extra = {}) {
    const bufferView = addView(typedArray, target);
    const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[type];
    const accessor = {
      bufferView,
      componentType,
      count: typedArray.length / components,
      type,
      ...extra,
    };
    json.accessors.push(accessor);
    return json.accessors.length - 1;
  }

  function finish() {
    json.buffers.push({ byteLength });
    let jsonText = Buffer.from(JSON.stringify(json), 'utf8');
    const jsonPad = (4 - (jsonText.length % 4)) % 4;
    if (jsonPad) jsonText = Buffer.concat([jsonText, Buffer.alloc(jsonPad, 0x20)]);
    const bin = Buffer.concat(chunks);
    const binPad = (4 - (bin.length % 4)) % 4;
    const binPadded = binPad ? Buffer.concat([bin, Buffer.alloc(binPad)]) : bin;
    const header = Buffer.alloc(12);
    const total = 12 + 8 + jsonText.length + 8 + binPadded.length;
    header.writeUInt32LE(0x46546c67, 0);
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(total, 8);
    const jsonHeader = Buffer.alloc(8);
    jsonHeader.writeUInt32LE(jsonText.length, 0);
    jsonHeader.writeUInt32LE(0x4e4f534a, 4);
    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(binPadded.length, 0);
    binHeader.writeUInt32LE(0x004e4942, 4);
    return Buffer.concat([header, jsonHeader, jsonText, binHeader, binPadded]);
  }

  return { json, addAccessor, finish };
}

function materialTable(names) {
  const packer = null;
  return names.map((name) => ({
    name,
    pbrMetallicRoughness: {
      baseColorFactor: MATERIALS[name].base,
      metallicFactor: MATERIALS[name].metallic,
      roughnessFactor: MATERIALS[name].roughness,
    },
    ...(MATERIALS[name].emissive ? { emissiveFactor: MATERIALS[name].emissive } : {}),
    doubleSided: false,
  }));
}

function buildCharacter({ name, skeleton, animGroups, parts, materialNames, extras = {} }) {
  const packer = createPacker();
  const { json, addAccessor } = packer;
  json.materials = materialTable(materialNames);
  const matIndex = (material) => {
    const index = materialNames.indexOf(material);
    return index === -1 ? 0 : index;
  };

  // Joint nodes
  const armatureNode = { name: `${name}_Armature`, children: [], translation: [0, 0, 0] };
  json.nodes.push(armatureNode);
  const nodeByJoint = new Map();
  for (const joint of skeleton) {
    const node = { name: `${name}_${joint.name}`, translation: joint.t, rotation: [0, 0, 0, 1], scale: [1, 1, 1] };
    if (!joint.parent) armatureNode.children.push(json.nodes.length);
    json.nodes.push(node);
    nodeByJoint.set(joint.name, json.nodes.length - 1);
  }
  for (const joint of skeleton) {
    if (!joint.parent) continue;
    const parent = json.nodes[nodeByJoint.get(joint.parent)];
    (parent.children || (parent.children = [])).push(nodeByJoint.get(joint.name));
  }

  // Skinned LOD meshes
  const lodNodes = [];
  for (let lod = 0; lod < 3; lod += 1) {
    const mesh = new Mesh(lod, matIndex);
    parts(mesh, lod);
    const position = new Float32Array(mesh.pos);
    const normal = new Float32Array(mesh.nrm);
    const uv = new Float32Array(mesh.uv);
    const joints = new Uint16Array(mesh.jnt.length * 4);
    const weights = new Float32Array(mesh.jnt.length * 4);
    mesh.jnt.forEach((joint, i) => {
      joints[i * 4] = nodeByJoint.get(joint) ?? 0;
      weights[i * 4] = 1;
    });
    let min = [Infinity, Infinity, Infinity];
    let max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < position.length; i += 3) {
      for (let c = 0; c < 3; c += 1) {
        min[c] = Math.min(min[c], position[i + c]);
        max[c] = Math.max(max[c], position[i + c]);
      }
    }
    const attributes = {
      POSITION: addAccessor(position, 'VEC3', 5126, 34962, { min, max }),
      NORMAL: addAccessor(normal, 'VEC3', 5126, 34962),
      TEXCOORD_0: addAccessor(uv, 'VEC2', 5126, 34962),
      JOINTS_0: addAccessor(joints, 'VEC4', 5123, 34962),
      WEIGHTS_0: addAccessor(weights, 'VEC4', 5126, 34962),
    };
    const primitives = [];
    for (const [material, indexList] of mesh.groups) {
      const indices = new Uint16Array(indexList);
      primitives.push({
        attributes,
        indices: addAccessor(indices, 'SCALAR', 5123, 34963),
        material,
        mode: 4,
      });
    }
    json.meshes.push({ name: `${name}_Mesh_LOD${lod}`, primitives });
    const node = { name: `${name}_LOD${lod}`, mesh: json.meshes.length - 1, skin: 0 };
    json.nodes.push(node);
    lodNodes.push(json.nodes.length - 1);
  }

  // Collision proxy: one low-poly capsule-ish box set, never drawn.
  {
    const mesh = new Mesh(2, matIndex);
    const bounds = characterBounds(parts);
    mesh.box([0, bounds.mid, 0], [bounds.width, bounds.height, bounds.depth], skeleton[0].name, materialNames[0]);
    const position = new Float32Array(mesh.pos);
    const normal = new Float32Array(mesh.nrm);
    const uv = new Float32Array(mesh.uv);
    const indices = new Uint16Array([...mesh.groups.values()].flat());
    json.meshes.push({
      name: `${name}_Collision`,
      primitives: [{
        attributes: {
          POSITION: addAccessor(position, 'VEC3', 5126, 34962),
          NORMAL: addAccessor(normal, 'VEC3', 5126, 34962),
          TEXCOORD_0: addAccessor(uv, 'VEC2', 5126, 34962),
        },
        indices: addAccessor(indices, 'SCALAR', 5123, 34963),
        material: 0,
      }],
    });
    json.nodes.push({ name: `${name}_COL`, mesh: json.meshes.length - 1 });
    json.scenes[0].nodes.push(json.nodes.length - 1);
  }

  // Skin with inverse bind matrices = inverse of each joint's bind world matrix.
  const world = jointWorld(skeleton);
  const ibm = new Float32Array(skeleton.length * 16);
  skeleton.forEach((joint, i) => {
    const p = world.get(joint.name);
    ibm.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -p[0], -p[1], -p[2], 1], i * 16);
  });
  json.skins.push({
    name: `${name}_Skin`,
    skeleton: armatureNode.children[0] ?? 1,
    joints: skeleton.map((joint) => nodeByJoint.get(joint.name)),
    inverseBindMatrices: addAccessor(ibm, 'MAT4', 5126),
  });

  // Animation clips
  for (const clip of clipsFor(skeleton, animGroups)) {
    const channels = [];
    const samplers = [];
    for (const channel of clip.channels) {
      if (channel.joint === undefined) continue;
      const timeArray = new Float32Array(channel.times);
      const valueArray = new Float32Array(channel.quats.flat());
      const input = addAccessor(timeArray, 'SCALAR', 5126, null, {
        min: [channel.times[0]],
        max: [channel.times[channel.times.length - 1]],
      });
      const output = addAccessor(valueArray, 'VEC4', 5126);
      samplers.push({ input, output, interpolation: 'LINEAR' });
      channels.push({ sampler: samplers.length - 1, target: { node: channel.joint, path: 'rotation' } });
    }
    if (!channels.length) continue;
    json.animations.push({ name: clip.name, channels, samplers });
  }

  json.scenes[0].nodes.unshift(0);
  json.scenes[0].nodes.push(...lodNodes);
  json.nodes[0].extras = { ...extras, lods: 3, collision: `${name}_COL` };
  return packer.finish();
}

function characterBounds(parts) {
  // Authored bounds are stable per character family; measure the LOD2 build.
  const mesh = new Mesh(2, () => 0);
  parts(mesh, 2);
  let minY = Infinity;
  let maxY = -Infinity;
  let maxX = 0;
  let maxZ = 0;
  for (let i = 0; i < mesh.pos.length; i += 3) {
    minY = Math.min(minY, mesh.pos[i + 1]);
    maxY = Math.max(maxY, mesh.pos[i + 1]);
    maxX = Math.max(maxX, Math.abs(mesh.pos[i]));
    maxZ = Math.max(maxZ, Math.abs(mesh.pos[i + 2]));
  }
  return {
    mid: (minY + maxY) / 2,
    height: maxY - minY,
    width: maxX * 2,
    depth: maxZ * 2,
  };
}

// ── prop kit (static meshes, instanced by the renderer) ───────────────────
function propMesh(name, build, materials) {
  const mesh = new Mesh(0, (material) => (materials.indexOf(material) === -1 ? 0 : materials.indexOf(material)));
  build(mesh);
  return { name, mesh, materials };
}

const PROPS = [
  propMesh('worldtree', (m) => {
    m.cylinder([0, 0, 0], [0, 7.5, 0], 0.9, 0.55, 'root', 'bark', 12);
    m.cylinder([0, 7.5, 0], [0, 9, 0], 0.55, 0.35, 'root', 'barkDark', 10);
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      m.cylinder([Math.cos(a) * 1.4, 0.1, Math.sin(a) * 1.4], [Math.cos(a) * 0.2, 1.4, Math.sin(a) * 0.2], 0.34, 0.16, 'root', 'bark', 6);
    }
    m.sphere([0, 9.4, 0], 2.6, 'root', 'leaf', [1.3, 0.75, 1.3], 10, 6);
    m.sphere([-1.8, 8.6, 0.6], 1.5, 'root', 'leaf', [1, 0.8, 1], 8, 5);
    m.sphere([1.7, 8.8, -0.5], 1.6, 'root', 'leaf', [1, 0.8, 1], 8, 5);
  }, ['bark', 'barkDark', 'leaf']),
  propMesh('hut', (m) => {
    m.cylinder([0, 0, 0], [0, 2.2, 0], 1.9, 1.8, 'root', 'stone', 10);
    m.cylinder([0, 2.2, 0], [0, 2.5, 0], 2.0, 2.0, 'root', 'wood', 10);
    m.cylinder([0, 2.4, 0], [0, 4.1, 0], 2.5, 0.25, 'root', 'thatch', 12);
    m.box([0, 1.1, 1.85], [0.8, 1.5, 0.2], 'root', 'dark');
    m.box([0, 2.6, 1.7], [0.4, 0.4, 0.3], 'root', 'ember');
  }, ['stone', 'wood', 'thatch', 'dark', 'ember']),
  propMesh('ruin', (m) => {
    m.box([-1.6, 2.4, 0], [1.0, 4.8, 1.0], 'root', 'stone');
    m.box([1.6, 2.4, 0], [1.0, 4.8, 1.0], 'root', 'stone');
    m.box([0, 5.1, 0], [4.4, 0.7, 1.2], 'root', 'stone');
    m.box([0, 5.6, 0.1], [3.2, 0.4, 0.9], 'root', 'stone');
    m.box([-1.6, 0.4, 1.2], [1.3, 0.8, 1.3], 'root', 'stone');
  }, ['stone']),
  propMesh('totem', (m) => {
    m.cylinder([0, 0, 0], [0, 3.4, 0], 0.4, 0.34, 'root', 'bark', 8);
    m.box([0, 2.2, 0], [0.9, 0.6, 0.7], 'root', 'bone');
    m.box([0, 2.2, 0.36], [0.2, 0.14, 0.06], 'root', 'ember');
    m.box([0, 1.4, 0], [0.7, 0.5, 0.6], 'root', 'bone');
    m.sphere([0, 3.6, 0], 0.3, 'root', 'ember');
  }, ['bark', 'bone', 'ember']),
  propMesh('crystal', (m) => {
    m.cylinder([0, 0, 0], [0, 3.4, 0], 0.55, 0.06, 'root', 'crystal', 6);
    m.cylinder([0.5, 0, 0.3], [1.1, 1.9, 0.5], 0.26, 0.03, 'root', 'crystal', 5);
    m.cylinder([-0.5, 0, -0.2], [-0.9, 1.5, -0.4], 0.2, 0.03, 'root', 'crystal', 5);
  }, ['crystal']),
  propMesh('rock', (m) => {
    m.sphere([0, 0.35, 0], 1.0, 'root', 'stone', [1.2, 0.6, 1], 8, 4);
  }, ['stone']),
  propMesh('bridge', (m) => {
    for (let i = 0; i < 9; i += 1) m.box([0, 0, i * 0.7 - 2.8], [2.6, 0.14, 0.55], 'root', 'wood');
    m.cylinder([-1.3, 0, -3], [-1.3, 1.1, 3], 0.06, 0.06, 'root', 'wood', 5);
    m.cylinder([1.3, 0, -3], [1.3, 1.1, 3], 0.06, 0.06, 'root', 'wood', 5);
  }, ['wood']),
  // Update XVII — 3D Scary Mode architecture. The renderer instances these
  // static meshes through the same PBR/shadow path as every other prop.
  propMesh('horror_manor', (m) => {
    m.box([0, 2.2, 0], [9, 4.4, 6], 'root', 'stone');
    m.box([-5.2, 1.6, 0], [3, 3.2, 4.5], 'root', 'stone');
    m.box([5.2, 1.6, 0], [3, 3.2, 4.5], 'root', 'stone');
    m.box([0, 4.7, 0], [10, 1.1, 6.8], 'root', 'dark');
    m.box([0, 5.6, -0.4], [7, 1.2, 5.2], 'root', 'dark');
    m.box([-3.6, 6.1, 0], [0.6, 2.2, 0.6], 'root', 'stone');
    m.box([0, 1.1, 3.05], [1.6, 2.2, 0.18], 'root', 'wood');
    for (const x of [-3, 0, 3]) m.box([x, 2.4, 3.04], [0.65, 1.05, 0.12], 'root', 'ember');
  }, ['stone', 'dark', 'wood', 'ember']),
  propMesh('horror_asylum', (m) => {
    m.box([0, 2.4, 0], [13, 4.8, 5], 'root', 'stone');
    m.box([0, 5.25, 0], [13.6, 0.9, 5.6], 'root', 'dark');
    m.box([-4.6, 7.4, 0], [2.4, 10, 3], 'root', 'stone');
    m.box([-4.6, 12.6, 0], [2.8, 1.2, 3.4], 'root', 'dark');
    m.box([0, 1.2, 2.56], [1.8, 2.4, 0.2], 'root', 'wood');
    for (const x of [-4.8, -2.4, 2.4, 4.8]) m.box([x, 2.6, 2.56], [0.55, 0.95, 0.12], 'root', 'ember');
  }, ['stone', 'dark', 'wood', 'ember']),
  propMesh('horror_chapel', (m) => {
    m.box([0, 2.2, 0], [6, 4.4, 10], 'root', 'stone');
    m.box([0, 4.85, 0], [7, 1.1, 11], 'root', 'dark');
    m.box([-4.2, 5.8, 0], [2.1, 8.8, 2.8], 'root', 'stone');
    m.cylinder([-4.2, 10.2, 0], [-4.2, 13.6, 0], 1.1, 0.04, 'root', 'dark', 4);
    m.box([0, 1.2, 5.06], [1.5, 2.4, 0.18], 'root', 'wood');
    for (const z of [-2.5, 0.5, 3]) m.box([3.04, 2.6, z], [0.12, 1.2, 0.7], 'root', 'crystal');
  }, ['stone', 'dark', 'wood', 'crystal']),
  propMesh('horror_mill', (m) => {
    m.cylinder([0, 0, 0], [0, 7.2, 0], 3.6, 2.4, 'root', 'stone', 12);
    m.cylinder([0, 7.2, 0], [0, 8.3, 0], 2.9, 0.1, 'root', 'dark', 12);
    m.box([0, 1.4, 3.5], [1.8, 2.8, 0.18], 'root', 'wood');
    for (let i = 0; i < 4; i += 1) {
      const a = (i / 4) * Math.PI * 2;
      m.box([Math.cos(a) * 3.4, 9.2, Math.sin(a) * 0.6], [0.35, 4.4, 0.7], 'root', 'wood');
    }
    m.sphere([0, 9.2, 0], 0.8, 'root', 'ember');
  }, ['stone', 'dark', 'wood', 'ember']),
  propMesh('horror_lighthouse', (m) => {
    m.cylinder([0, 0, 0], [0, 10, 0], 2.8, 1.6, 'root', 'stone', 12);
    m.cylinder([0, 10, 0], [0, 11.2, 0], 1.9, 1.9, 'root', 'dark', 8);
    m.box([0, 11.6, 0], [2.2, 0.9, 2.2], 'root', 'crystal');
    m.cylinder([0, 12, 0], [0, 14.2, 0], 2.1, 0.15, 'root', 'dark', 8);
    m.box([0, 1.4, 2.5], [1.4, 2.8, 0.18], 'root', 'wood');
    for (const y of [3, 5.2, 7.4]) m.box([0, y, 2.65], [0.7, 0.8, 0.12], 'root', 'ember');
  }, ['stone', 'dark', 'wood', 'crystal', 'ember']),
];

function buildPropsFile() {
  const packer = createPacker();
  const { json, addAccessor } = packer;
  const materialNames = [...new Set(PROPS.flatMap((prop) => prop.materials))];
  json.materials = materialTable(materialNames);
  for (const prop of PROPS) {
    const mesh = prop.mesh;
    const position = new Float32Array(mesh.pos);
    const normal = new Float32Array(mesh.nrm);
    const uv = new Float32Array(mesh.uv);
    const attributes = {
      POSITION: addAccessor(position, 'VEC3', 5126, 34962),
      NORMAL: addAccessor(normal, 'VEC3', 5126, 34962),
      TEXCOORD_0: addAccessor(uv, 'VEC2', 5126, 34962),
    };
    const primitives = [];
    for (const [material, indexList] of mesh.groups) {
      primitives.push({
        attributes,
        indices: addAccessor(new Uint16Array(indexList), 'SCALAR', 5123, 34963),
        material,
      });
    }
    json.meshes.push({ name: `prop_${prop.name}`, primitives });
    json.nodes.push({ name: prop.name, mesh: json.meshes.length - 1 });
    json.scenes[0].nodes.push(json.nodes.length - 1);
  }
  return packer.finish();
}

// ── character registry ────────────────────────────────────────────────────
const HUMANOID_MATERIALS = ['steel', 'steelLight', 'steelDark', 'gold', 'cloth', 'clothBlue', 'leather', 'skin', 'dark', 'bone', 'bark', 'glow', 'hide', 'hideDark'];
const BEAST_MATERIALS = ['hide', 'hideDark', 'bone', 'glow', 'ember', 'bark', 'leaf'];
const CHITIN_MATERIALS = ['chitin', 'chitinLight', 'bone', 'dark', 'glow'];
const TITAN_MATERIALS = ['bark', 'barkDark', 'leaf', 'bone', 'glow'];

const CHARACTERS = [
  {
    file: 'sera.glb', name: 'Sera',
    skeleton: HUMANOID, animGroups: HUMAN_ANIM, materialNames: HUMANOID_MATERIALS,
    parts: (m) => humanoid(m, { weapon: 'sword', shield: true }),
    extras: { role: 'knight', class: 'Sera', archetype: 'humanoid' },
  },
  {
    file: 'villager.glb', name: 'Villager',
    skeleton: HUMANOID, animGroups: HUMAN_ANIM, materialNames: HUMANOID_MATERIALS,
    parts: (m) => humanoid(m, { weapon: 'staff', plate: 'clothGreen', plateDark: 'bark', cloth: 'clothGreen' }),
    extras: { role: 'npc', class: 'Villager', archetype: 'humanoid' },
  },
  {
    file: 'prowler.glb', name: 'Prowler',
    skeleton: BEAST, animGroups: BEAST_ANIM, materialNames: BEAST_MATERIALS,
    parts: prowlerParts,
    extras: { role: 'enemy', class: 'Prowler', archetype: 'beast' },
  },
  {
    file: 'beetle.glb', name: 'Beetle',
    skeleton: BEAST, animGroups: BEAST_ANIM, materialNames: CHITIN_MATERIALS,
    parts: beetleParts,
    extras: { role: 'enemy', class: 'Beetle', archetype: 'beast' },
  },
  {
    file: 'stalker.glb', name: 'Stalker',
    skeleton: HUMANOID, animGroups: { ...HUMAN_ANIM, arms: ['shoulderL', 'shoulderR'] }, materialNames: [...CHITIN_MATERIALS, ...BEAST_MATERIALS, 'barkDark'],
    parts: stalkerParts,
    extras: { role: 'enemy', class: 'Stalker', archetype: 'spindly' },
  },
  {
    file: 'alpha.glb', name: 'Alpha',
    skeleton: BEAST, animGroups: BEAST_ANIM, materialNames: [...BEAST_MATERIALS, 'bone'],
    parts: alphaParts,
    extras: { role: 'elite', class: 'Alpha', archetype: 'beast' },
  },
  {
    file: 'yggvar.glb', name: 'Yggvar',
    skeleton: TITAN, animGroups: TITAN_ANIM, materialNames: [...TITAN_MATERIALS, 'stone'],
    parts: titanParts,
    extras: { role: 'boss', class: 'Yggvar', archetype: 'titan', height: 6.4 },
  },
];

mkdirSync(OUT_DIR, { recursive: true });
let total = 0;
for (const character of CHARACTERS) {
  const buffer = buildCharacter(character);
  writeFileSync(join(OUT_DIR, character.file), buffer);
  total += buffer.length;
  console.log(`  ${character.file.padEnd(16)} ${(buffer.length / 1024).toFixed(1)} KB`);
}
const propsBuffer = buildPropsFile();
writeFileSync(join(OUT_DIR, 'props.glb'), propsBuffer);
total += propsBuffer.length;
console.log(`  ${'props.glb'.padEnd(16)} ${(propsBuffer.length / 1024).toFixed(1)} KB`);
console.log(`exported ${CHARACTERS.length + 1} GLB files, ${(total / 1024).toFixed(1)} KB total into assets/3d/`);
