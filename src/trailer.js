// Ashen Vow — in-engine cinematic trailer, cut 2 ("Sumpah Abu").
//
// Pure module: the edit decision list (shots, cuts, camera moves, grades,
// music and sound cues), the narration script, and a deterministic Canvas
// renderer for title cards and the film overlay (letterbox, grain, vignette,
// flashes, kinetic type). No DOM, no audio objects, no network.
//
// Scene shots are *live engine footage*: `src/trailer_director.js` loads the
// real room, spawns the real boss and lets a scripted actor fight it through
// the real simulation, then hands the frame back to `drawTrailerFrame`. In
// Node (tests) and anywhere the director is missing, scene shots fall back to
// a stylised plate so the cut still plays.

export const TRAILER_SCHEMA_VERSION = 2;

export const TRAILER_IDENTITY = {
  studio: 'SEALIUSHQ',
  title: 'ASHEN VOW',
  tagline: 'Sumpah yang tidak bisa ditarik kembali.',
  // Requirement 8 wording — must stay exact.
  footer: 'Made by SealiusHQ with a lot of support from Contributors',
  endCard: {
    eyebrow: 'SEKARANG DAPAT DIMAINKAN',
    title: 'ASHEN VOW',
    line: 'Delapan belas penjaga · seratus enam belas boss · enam ratus tujuh puluh empat ruang.',
    cta: 'MULAI PERJALANAN',
  },
};

// Colour grades, applied to live footage through `ctx.filter` plus a tinted
// soft-light wash. Kept as data so the edit can be re-graded in one place.
export const TRAILER_GRADES = {
  ember: { filter: 'contrast(1.14) saturate(0.82) brightness(0.96)', wash: '#ff9a4a', washAlpha: 0.16 },
  cold: { filter: 'contrast(1.12) saturate(0.7) brightness(0.92)', wash: '#5f8fd8', washAlpha: 0.18 },
  spore: { filter: 'contrast(1.1) saturate(0.9) brightness(0.95)', wash: '#7fd48a', washAlpha: 0.14 },
  blood: { filter: 'contrast(1.2) saturate(0.75) brightness(0.9)', wash: '#ff4a2e', washAlpha: 0.2 },
  gold: { filter: 'contrast(1.16) saturate(0.9) brightness(1)', wash: '#ffd27a', washAlpha: 0.16 },
  clean: { filter: 'contrast(1.1) saturate(1.05)', wash: '#ffffff', washAlpha: 0 },
  bleach: { filter: 'contrast(1.3) saturate(0.35) brightness(0.95)', wash: '#d8d2c4', washAlpha: 0.1 },
};

// `kind: 'scene'` shots carry `cuts`: each cut names a real room index in
// ALL_ROOMS (`room`), how long it holds (`hold`), the camera move, a speed
// ramp and what the actor does. `kind: 'card'` shots are typography.
// `music` is a TRACKS id from src/music.js (null = silence). `sfx` is a cue
// the shell turns into a procedural sound at the shot's first frame.
export const TRAILER_SHOTS = [
  {
    id: 'cold_open', kind: 'card', at: 0, duration: 5, cast: 'narrator', music: null, sfx: 'drone',
    eyebrow: 'SEALIUSHQ MEMPERSEMBAHKAN', title: 'DI OPUS, SUMPAH TIDAK PERNAH MATI',
    style: 'whisper', accent: ['#030304', '#0d0a09', '#c9a25c'],
    narration: 'Di Opus, sumpah tidak pernah mati.',
  },
  {
    id: 'ashen_gate', kind: 'scene', at: 5, duration: 6, cast: 'narrator', music: 'ashen', sfx: 'whoosh',
    eyebrow: 'BAB I · GERBANG ABU', title: 'GERBANG ABU',
    accent: ['#0b0a0c', '#2a2118', '#e8b45a'], grade: 'ember',
    narration: 'Ia hanya menunggu seseorang yang cukup keras kepala untuk mengucapkannya lagi.',
    cuts: [
      { room: 0, hold: 6, actor: 'advance', camera: { pan: [-220, 120], zoom: [1.32, 1.08], focus: 'player' }, ramp: { until: 1.4, rate: 0.4 } },
    ],
  },
  {
    id: 'hall_of_oaths', kind: 'scene', at: 11, duration: 5, cast: 'narrator', music: 'ashen', sfx: 'cut',
    eyebrow: 'BALAI SUMPAH', title: 'SETIAP RUANG MENUNTUT HARGA',
    accent: ['#08090c', '#1e2230', '#9fb6d8'], grade: 'cold',
    narration: 'Setiap ruang menuntut harga.',
    cuts: [
      { room: 1, hold: 2.5, actor: 'fight', camera: { pan: [0, 80], zoom: [1.18, 1.3], focus: 'player' } },
      { room: 4, hold: 2.5, actor: 'fight', camera: { pan: [40, -40], zoom: [1.4, 1.2], focus: 'enemy' }, ramp: { until: 0.8, rate: 0.35 } },
    ],
  },
  {
    id: 'mycelial', kind: 'scene', at: 16, duration: 5, cast: 'narrator', music: 'mycelial', sfx: 'cut',
    eyebrow: 'CABANG · MYCELIAL HOLLOW', title: 'AKAR YANG MENGINGAT',
    accent: ['#07100c', '#12301f', '#8ad48a'], grade: 'spore',
    narration: 'Setiap akar mengingat nama yang gugur di atasnya.',
    cuts: [
      { room: 9, hold: 5, actor: 'fight', camera: { pan: [-60, 160], zoom: [1.05, 1.25], focus: 'player' } },
    ],
  },
  {
    id: 'curse', kind: 'card', at: 21, duration: 4, cast: 'narrator', music: 'mycelial', sfx: 'hit',
    eyebrow: '', title: 'MEREKA MENYEBUTNYA KUTUKAN',
    style: 'slam', accent: ['#050404', '#140c0a', '#d98b58'],
    narration: 'Mereka menyebutnya kutukan.',
  },
  {
    id: 'warden', kind: 'scene', at: 25, duration: 6, cast: 'warden', music: 'boss', sfx: 'boom',
    eyebrow: 'SIR MORDRAKE · THE FALLEN WARDEN', title: 'PENJAGA YANG JATUH',
    accent: ['#0d0b10', '#3a2320', '#f0704d'], grade: 'blood',
    narration: 'Kau membawa pedang ke singgasana yang sudah mati.',
    cuts: [
      { room: 2, hold: 6, actor: 'fight', camera: { pan: [0, 0], zoom: [1.9, 1.12], focus: 'boss' }, ramp: { until: 2, rate: 0.3 } },
    ],
  },
  {
    id: 'promise', kind: 'card', at: 31, duration: 3.5, cast: 'narrator', music: 'boss', sfx: 'hit',
    eyebrow: '', title: 'AKU MENYEBUTNYA JANJI',
    style: 'slam', accent: ['#050404', '#140c0a', '#ffd27a'],
    narration: 'Aku menyebutnya janji.',
  },
  {
    id: 'montage_bosses', kind: 'scene', at: 34.5, duration: 6, cast: 'narrator', music: 'boss', sfx: 'cut',
    eyebrow: 'NAGA · PADUAN SUARA · HUTAN · LAUT', title: 'MEREKA SEMUA MENUNGGU',
    accent: ['#0b0a0e', '#2a1d26', '#e0a070'], grade: 'ember', covers: ['wyrm', 'choir', 'sporebound', 'cistern'],
    narration: 'Naga yang lupa langit. Paduan suara orang mati. Hutan yang lapar. Laut yang tak pernah mengembalikan.',
    cuts: [
      { room: 3, hold: 1.5, actor: 'fight', camera: { pan: [0, 30], zoom: [1.45, 1.3], focus: 'boss' }, grade: 'ember' },
      { room: 5, hold: 1.5, actor: 'fight', camera: { pan: [0, -30], zoom: [1.3, 1.5], focus: 'boss' }, grade: 'cold' },
      { room: 13, hold: 1.5, actor: 'fight', camera: { pan: [20, 0], zoom: [1.5, 1.3], focus: 'boss' }, grade: 'spore' },
      { room: 666, hold: 1.5, actor: 'fight', camera: { pan: [0, 40], zoom: [1.3, 1.45], focus: 'boss' }, grade: 'cold' },
    ],
  },
  {
    id: 'montage_arcs', kind: 'scene', at: 40.5, duration: 6, cast: 'narrator', music: 'bossDawn', sfx: 'cut',
    eyebrow: 'KAWAH GEMA · GUA KRISTAL · KUIL AKAR · MENARA WAKTU', title: 'SEBELAS BAB',
    accent: ['#120b06', '#3a2412', '#ffc25a'], grade: 'clean', covers: ['echoes', 'echocrater', 'crystalcave', 'roottemple', 'clockwork'],
    narration: 'Sebelas bab. Seratus enam belas penguasa. Tidak satu pun berniat minggir.',
    cuts: [
      { room: 43, hold: 1.5, actor: 'fight', camera: { pan: [0, 30], zoom: [1.5, 1.3], focus: 'boss' } },
      { room: 63, hold: 1.5, actor: 'fight', camera: { pan: [-20, 20], zoom: [1.25, 1.45], focus: 'boss' } },
      { room: 83, hold: 1.5, actor: 'fight', camera: { pan: [30, -10], zoom: [1.5, 1.3], focus: 'boss' } },
      { room: 103, hold: 1.5, actor: 'fight', camera: { pan: [0, 0], zoom: [1.3, 1.55], focus: 'boss' } },
    ],
  },
  {
    id: 'world', kind: 'card', at: 46.5, duration: 5, cast: 'narrator', music: 'bossDawn', sfx: 'hit',
    eyebrow: 'SATU SUMPAH', title: 'DUNIA YANG TIDAK PERNAH SELESAI',
    style: 'stats', accent: ['#060505', '#17110c', '#e8c27a'],
    stats: [['674', 'RUANG'], ['116', 'BOSS'], ['262', 'MUSUH'], ['18', 'PENJAGA']],
    narration: 'Enam ratus tujuh puluh empat ruang, dan satu sumpah yang mengikat semuanya.',
  },
  {
    id: 'modes', kind: 'card', at: 51.5, duration: 5, cast: 'narrator', music: 'bossDawn', sfx: 'whoosh',
    eyebrow: 'DAN DI LUAR GERBANG', title: 'JALAN LAIN',
    style: 'words', accent: ['#05070b', '#101828', '#9fc4ff'],
    covers: ['pirates', 'wave', 'moba', 'scary', 'blackveil', 'faewood', 'fallen', 'crusade', 'lanternwake'],
    words: ['SEMBILAN SUMBU', 'TAMAN PERI', 'LANGIT YANG TURUN', 'PERANG SUMPAH', 'LAUT TERBUKA', 'BENTENG TERAKHIR', 'RIFTWAR 5V5', 'MALAM TANPA CAHAYA'],
    narration: 'Laut yang tidak menghitung mayat. Benteng terakhir. Dan malam yang tidak punya cahaya.',
  },
  {
    id: 'oathbreaker', kind: 'scene', at: 56.5, duration: 7, cast: 'oathbreaker', music: 'boss', sfx: 'boom',
    eyebrow: 'THE OATHBREAKER', title: 'PEMUTUS SUMPAH',
    accent: ['#0a0608', '#2a0f12', '#ff6a4a'], grade: 'blood',
    narration: 'Sumpah adalah rantai. Aku sudah memutus milikku. Sekarang giliranmu.',
    cuts: [
      { room: 7, hold: 4, actor: 'fight', bossHp: 0.3, camera: { pan: [0, 0], zoom: [1.15, 1.6], focus: 'boss' }, ramp: { until: 4, rate: 0.45 } },
      { room: 7, hold: 3, actor: 'fight', bossHp: 0.3, camera: { pan: [40, -40], zoom: [1.7, 1.25], focus: 'player' }, ramp: { until: 3, rate: 0.25 }, grade: 'bleach' },
    ],
  },
  {
    id: 'silence', kind: 'card', at: 63.5, duration: 3, cast: 'narrator', music: null, sfx: 'heartbeat',
    eyebrow: '', title: 'LALU KAU?',
    style: 'whisper', accent: ['#000000', '#050404', '#e8c27a'],
    narration: 'Lalu kau?',
  },
  {
    id: 'title', kind: 'card', at: 66.5, duration: 6, cast: 'narrator', music: 'victory', sfx: 'titleHit',
    eyebrow: 'SEALIUSHQ', title: 'ASHEN VOW',
    style: 'title', accent: ['#050403', '#1a1208', '#e8c27a'],
    narration: 'Ashen Vow.',
  },
  {
    id: 'summit', kind: 'scene', at: 72.5, duration: 6, cast: 'narrator', music: 'victory', sfx: null,
    eyebrow: 'PUNCAK SUMPAH', title: 'UCAPKAN SUMPAHMU',
    accent: ['#0b0908', '#2a1d16', '#f0c070'], grade: 'gold',
    narration: 'Ucapkan sumpahmu.',
    cuts: [
      { room: 7, hold: 6, actor: 'stand', clear: true, playerX: 640, camera: { pan: [80, -40], zoom: [1.7, 1.05], focus: 'player' }, ramp: { until: 6, rate: 0.5 } },
    ],
  },
  {
    id: 'endcard', kind: 'card', at: 78.5, duration: 7, cast: 'narrator', music: 'victory', sfx: null,
    eyebrow: 'ASHEN VOW', title: 'MULAI PERJALANAN',
    style: 'end', accent: ['#050505', '#1a1208', '#e8c27a'],
    narration: 'Ashen Vow. Sumpah yang tidak bisa ditarik kembali.',
  },
];

export const TRAILER_SHOT_BY_ID = Object.fromEntries(TRAILER_SHOTS.map((shot) => [shot.id, shot]));

export function trailerDuration() {
  const last = TRAILER_SHOTS[TRAILER_SHOTS.length - 1];
  return last.at + last.duration;
}

export function trailerShotIndexAt(time) {
  const t = Math.max(0, Math.min(trailerDuration() - 1e-6, Number(time) || 0));
  let index = 0;
  for (let i = 0; i < TRAILER_SHOTS.length; i += 1) {
    if (t >= TRAILER_SHOTS[i].at) index = i;
  }
  return index;
}

/** Which cut of a scene shot is on screen at `local` seconds, and its own clock. */
export function trailerCutAt(shot, local) {
  const cuts = shot?.cuts || [];
  if (!cuts.length) return null;
  let start = 0;
  for (let i = 0; i < cuts.length; i += 1) {
    const end = start + cuts[i].hold;
    if (local < end || i === cuts.length - 1) {
      const cutLocal = Math.max(0, Math.min(cuts[i].hold, local - start));
      return { index: i, cut: cuts[i], local: cutLocal, progress: cutLocal / cuts[i].hold, key: `${shot.id}:${i}` };
    }
    start = end;
  }
  return null;
}

/**
 * Simulated seconds elapsed inside a cut after `local` real seconds. A ramp
 * runs the engine slower for its first `until` seconds (slow motion), then at
 * full speed. Analytic, so seeking lands on the same frame every time.
 */
export function trailerSimTime(cut, local) {
  const t = Math.max(0, Number(local) || 0);
  const ramp = cut?.ramp;
  if (!ramp) return t;
  const until = Math.max(0, ramp.until);
  const rate = Math.max(0.05, Math.min(1, ramp.rate));
  return t <= until ? t * rate : until * rate + (t - until);
}

export function trailerShotAt(time) {
  const t = Math.max(0, Math.min(trailerDuration(), Number(time) || 0));
  const index = trailerShotIndexAt(t);
  const shot = TRAILER_SHOTS[index];
  const local = t - shot.at;
  return {
    index,
    count: TRAILER_SHOTS.length,
    shot,
    local,
    progress: Math.max(0, Math.min(1, local / shot.duration)),
    overall: t / trailerDuration(),
    cut: trailerCutAt(shot, local),
  };
}

export function trailerNarrationAt(time) {
  return trailerShotAt(time).shot.narration;
}

/** Real rooms the live footage needs (for preloading and for tests). */
export function trailerRooms() {
  return [...new Set(TRAILER_SHOTS.flatMap((shot) => (shot.cuts || []).map((cut) => cut.room)))];
}

export function trailerSummary() {
  const scenes = TRAILER_SHOTS.filter((shot) => shot.kind === 'scene');
  return {
    shots: TRAILER_SHOTS.length,
    duration: trailerDuration(),
    scenes: scenes.length,
    cuts: scenes.reduce((sum, shot) => sum + shot.cuts.length, 0),
    rooms: trailerRooms().length,
    modes: new Set(TRAILER_SHOTS.flatMap((shot) => [shot.id, ...(shot.covers || [])])).size,
    cast: new Set(TRAILER_SHOTS.map((shot) => shot.cast)).size,
    schema: TRAILER_SCHEMA_VERSION,
  };
}

// ── deterministic rendering ───────────────────────────────────────────────
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
export const easeInOut = (t) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};
const easeOut = (t) => 1 - (1 - clamp01(t)) ** 3;

function rand(i) {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

function rgba(hex, a) {
  const h = String(hex || '#000').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0').slice(0, 6);
  const n = parseInt(full, 16) || 0;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function spacedText(ctx, text, x, y, { size = 26, weight = 700, color = '#f4e8d0', spacing = 6, align = 'center', family = 'Cinzel, Georgia, serif' } = {}) {
  const chars = [...String(text)];
  ctx.font = `${weight} ${size}px ${family}`;
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((sum, value) => sum + value, 0) + spacing * Math.max(0, chars.length - 1);
  let cursor = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  chars.forEach((char, i) => {
    ctx.fillText(char, cursor, y);
    cursor += widths[i] + spacing;
  });
  return total;
}

/** Fit a line into `maxWidth` by shrinking the size, never below `min`. */
function fittedSize(ctx, text, size, maxWidth, spacing, family = 'Cinzel, Georgia, serif', weight = 700, min = 12) {
  let s = size;
  for (let i = 0; i < 12; i += 1) {
    ctx.font = `${weight} ${s}px ${family}`;
    const w = ctx.measureText(String(text)).width + spacing * Math.max(0, String(text).length - 1);
    if (w <= maxWidth || s <= min) break;
    s = Math.max(min, Math.round(s * 0.9));
  }
  return s;
}

function embers(ctx, w, h, time, color, count = 46) {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < count; i += 1) {
    const frac = rand(i);
    const x = ((frac * 1.7 + time * (0.01 + frac * 0.02)) % 1) * w;
    const drift = Math.sin(time * 0.8 + i) * 12;
    const y = h - (((frac * 0.9 + time * (0.04 + frac * 0.05)) % 1) * h * 0.92);
    ctx.globalAlpha = 0.14 + (i % 5) * 0.07;
    ctx.beginPath();
    ctx.arc(x + drift, y, 1 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Backdrop for title cards and the no-engine fallback plate. */
function plate(ctx, w, h, shot, time) {
  const [top, mid, low] = shot.accent;
  const g = ctx.createLinearGradient(0, 0, w * 0.35, h);
  g.addColorStop(0, top);
  g.addColorStop(0.62, mid);
  g.addColorStop(1, top);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w / 2, h * 0.55, 4, w / 2, h * 0.55, w * 0.55);
  glow.addColorStop(0, rgba(low, 0.16));
  glow.addColorStop(1, rgba(low, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  embers(ctx, w, h, time, low, shot.style === 'whisper' ? 22 : 46);
}

function drawCard(ctx, w, h, shot, local, time) {
  plate(ctx, w, h, shot, time);
  const low = shot.accent[2];
  const p = clamp01(local / shot.duration);
  const fadeIn = clamp01(local / 0.6);
  const fadeOut = clamp01((shot.duration - local) / 0.5);
  const a = Math.min(fadeIn, fadeOut);
  const maxW = w * 0.86;
  ctx.save();
  ctx.textAlign = 'left';

  if (shot.style === 'title') {
    // Title drop: a flash, a shockwave ring and a slow push on the logotype.
    const hit = clamp01(local / 0.25);
    const ring = easeOut(clamp01(local / 1.4));
    ctx.strokeStyle = rgba(low, 0.55 * (1 - ring));
    ctx.lineWidth = 3 + 10 * (1 - ring);
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.5, w * 0.08 + ring * w * 0.55, h * 0.05 + ring * h * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
    const scale = 1.12 - easeOut(clamp01(local / 5)) * 0.1;
    ctx.translate(w / 2, h * 0.53);
    ctx.scale(scale, scale);
    ctx.globalAlpha = a;
    ctx.shadowColor = rgba(low, 0.7);
    ctx.shadowBlur = 30;
    const size = fittedSize(ctx, 'ASHEN', Math.round(h * 0.2), maxW, h * 0.03, undefined, 800);
    spacedText(ctx, 'ASHEN', 0, -h * 0.02, { size, weight: 800, color: '#f6eddc', spacing: h * 0.03 });
    ctx.shadowBlur = 18;
    spacedText(ctx, 'VOW', 0, h * 0.13, { size: Math.round(size * 0.55), weight: 700, color: low, spacing: h * 0.06 });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = a * clamp01((local - 1.2) / 0.8);
    spacedText(ctx, TRAILER_IDENTITY.tagline.toUpperCase(), 0, h * 0.22, { size: Math.round(h * 0.024), weight: 600, color: '#cdb68c', spacing: 3 });
    ctx.restore();
    // White hit frame on the cut.
    if (hit < 1) {
      ctx.fillStyle = `rgba(255,248,230,${0.9 * (1 - hit)})`;
      ctx.fillRect(0, 0, w, h);
    }
    return;
  }

  if (shot.style === 'end') {
    ctx.globalAlpha = a;
    spacedText(ctx, TRAILER_IDENTITY.endCard.eyebrow, w / 2, h * 0.3, { size: Math.round(h * 0.024), weight: 600, color: low, spacing: 5 });
    const size = fittedSize(ctx, 'ASHEN VOW', Math.round(h * 0.13), maxW, 14, undefined, 800);
    ctx.shadowColor = rgba(low, 0.55);
    ctx.shadowBlur = 24;
    spacedText(ctx, 'ASHEN VOW', w / 2, h * 0.47, { size, weight: 800, color: '#f6eddc', spacing: 14 });
    ctx.shadowBlur = 0;
    const lineSize = fittedSize(ctx, TRAILER_IDENTITY.endCard.line, Math.round(h * 0.026), maxW, 1, 'Georgia, serif', 400);
    spacedText(ctx, TRAILER_IDENTITY.endCard.line, w / 2, h * 0.56, { size: lineSize, weight: 400, color: '#cdb68c', spacing: 1, family: 'Georgia, serif' });
    // CTA plate
    const cw = Math.min(w * 0.36, 360);
    const ch = h * 0.075;
    ctx.globalAlpha = a * clamp01((local - 0.8) / 0.6);
    ctx.strokeStyle = low;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w / 2 - cw / 2, h * 0.63, cw, ch);
    spacedText(ctx, TRAILER_IDENTITY.endCard.cta, w / 2, h * 0.63 + ch * 0.64, { size: Math.round(h * 0.026), weight: 700, color: '#f6eddc', spacing: 5 });
    ctx.globalAlpha = a * clamp01((local - 1.6) / 0.8);
    const footSize = fittedSize(ctx, TRAILER_IDENTITY.footer, Math.round(h * 0.02), maxW, 1, 'Georgia, serif', 400);
    spacedText(ctx, TRAILER_IDENTITY.footer, w / 2, h * 0.8, { size: footSize, weight: 400, color: '#9c8766', spacing: 1, family: 'Georgia, serif' });
    ctx.restore();
    return;
  }

  if (shot.style === 'stats') {
    ctx.globalAlpha = a;
    spacedText(ctx, shot.eyebrow, w / 2, h * 0.28, { size: Math.round(h * 0.024), weight: 600, color: low, spacing: 6 });
    const stats = shot.stats || [];
    const colW = Math.min(w * 0.2, 240);
    stats.forEach(([value, label], i) => {
      const x = w / 2 + (i - (stats.length - 1) / 2) * colW;
      const reveal = clamp01((local - 0.35 * i) / 0.7);
      const shown = Math.round(Number(value) * easeOut(reveal));
      ctx.globalAlpha = a * reveal;
      spacedText(ctx, String(shown), x, h * 0.5, { size: Math.round(h * 0.09), weight: 800, color: '#f6eddc', spacing: 2 });
      spacedText(ctx, label, x, h * 0.57, { size: Math.round(h * 0.022), weight: 600, color: low, spacing: 4 });
    });
    ctx.globalAlpha = a * clamp01((local - 2) / 0.8);
    const size = fittedSize(ctx, shot.title, Math.round(h * 0.034), maxW, 5);
    spacedText(ctx, shot.title, w / 2, h * 0.7, { size, weight: 700, color: '#e8dcc2', spacing: 5 });
    ctx.restore();
    return;
  }

  if (shot.style === 'words') {
    // Rapid word cuts: each phrase holds a beat, then the next slams in.
    const words = shot.words || [];
    const beat = (shot.duration - 0.6) / Math.max(1, words.length);
    const i = Math.min(words.length - 1, Math.floor(local / beat));
    const wl = local - i * beat;
    ctx.globalAlpha = a * 0.8;
    spacedText(ctx, shot.eyebrow, w / 2, h * 0.32, { size: Math.round(h * 0.022), weight: 600, color: low, spacing: 6 });
    const pop = 1 + 0.18 * (1 - easeOut(clamp01(wl / 0.18)));
    ctx.globalAlpha = a;
    ctx.translate(w / 2, h * 0.53);
    ctx.scale(pop, pop);
    const size = fittedSize(ctx, words[i] || '', Math.round(h * 0.09), maxW, 8, undefined, 800);
    spacedText(ctx, words[i] || '', 0, 0, { size, weight: 800, color: '#f6eddc', spacing: 8 });
    ctx.restore();
    return;
  }

  // 'whisper' and 'slam'
  const slam = shot.style === 'slam';
  const scale = slam ? 1 + 0.25 * (1 - easeOut(clamp01(local / 0.22))) : 1 + p * 0.04;
  ctx.globalAlpha = slam ? a : a * 0.92;
  if (shot.eyebrow) spacedText(ctx, shot.eyebrow, w / 2, h * 0.4, { size: Math.round(h * 0.022), weight: 600, color: low, spacing: 6 });
  ctx.translate(w / 2, h * 0.52);
  ctx.scale(scale, scale);
  const size = fittedSize(ctx, shot.title, Math.round(h * (slam ? 0.075 : 0.05)), maxW, slam ? 8 : 6, undefined, slam ? 800 : 600);
  if (slam) {
    ctx.shadowColor = rgba(low, 0.6);
    ctx.shadowBlur = 22;
  }
  spacedText(ctx, shot.title, 0, 0, { size, weight: slam ? 800 : 600, color: slam ? '#f6eddc' : '#d8cbb0', spacing: slam ? 8 : 6 });
  ctx.restore();
}

function lowerThird(ctx, w, h, shot, local, bar) {
  const inT = easeOut(clamp01((local - 0.25) / 0.7));
  const out = clamp01((shot.duration - local) / 0.45);
  const a = inT * out;
  if (a <= 0) return;
  const low = shot.accent[2];
  const x = w * 0.07;
  const y = h - bar - h * 0.1;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = low;
  ctx.fillRect(x, y - h * 0.062, Math.max(2, w * 0.05 * inT), 2);
  spacedText(ctx, shot.eyebrow, x, y - h * 0.075, { size: Math.round(h * 0.019), weight: 600, color: low, spacing: 4, align: 'left' });
  const size = fittedSize(ctx, shot.title, Math.round(h * 0.05), w * 0.8, 6);
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 12;
  spacedText(ctx, shot.title, x, y, { size, weight: 700, color: '#f6eddc', spacing: 6 + (1 - inT) * 10, align: 'left' });
  ctx.restore();
}

/**
 * Film layer shared by every shot: vignette, grain, letterbox and a flash on
 * each cut. `grain` is optional (an offscreen noise tile); without it the
 * layer stays deterministic and allocation-free, which the tests rely on.
 */
function filmOverlay(ctx, w, h, time, info, opts) {
  const { shot, local } = info;
  const vignette = ctx.createRadialGradient(w / 2, h * 0.47, h * 0.25, w / 2, h * 0.47, h * 0.95);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.78)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  if (opts.grain && typeof ctx.drawImage === 'function') {
    ctx.save();
    ctx.globalAlpha = 0.07;
    const gx = -Math.floor(rand(Math.floor(time * 24)) * 96);
    const gy = -Math.floor(rand(Math.floor(time * 24) + 7) * 96);
    for (let y = gy; y < h; y += opts.grain.height) {
      for (let x = gx; x < w; x += opts.grain.width) ctx.drawImage(opts.grain, x, y);
    }
    ctx.restore();
  }

  // Cut flash: a few frames of light at every hard cut inside scene shots.
  const cutLocal = info.cut ? info.cut.local : local;
  if (shot.kind === 'scene' && cutLocal < 0.12) {
    ctx.fillStyle = `rgba(255,244,224,${0.35 * (1 - cutLocal / 0.12)})`;
    ctx.fillRect(0, 0, w, h);
  }
  // Dip to black at shot edges.
  const edge = Math.min(local / 0.18, (shot.duration - local) / 0.18);
  if (edge < 1) {
    ctx.fillStyle = `rgba(0,0,0,${1 - clamp01(edge)})`;
    ctx.fillRect(0, 0, w, h);
  }

  const bar = Math.round(h * 0.1);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, bar);
  ctx.fillRect(0, h - bar, w, bar);
  return bar;
}

/**
 * Draw one trailer frame. `opts.scene(ctx, w, h, info)` paints live engine
 * footage for scene shots; without it a stylised plate stands in. Returns the
 * timeline info so the shell can update captions and progress.
 */
export function drawTrailerFrame(ctx, w, h, time, opts = {}) {
  const info = trailerShotAt(time);
  const { shot, index, count, progress, local } = info;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  if (shot.kind === 'scene') {
    let painted = false;
    if (typeof opts.scene === 'function') {
      try {
        painted = opts.scene(ctx, w, h, info) !== false;
      } catch {
        painted = false;
      }
    }
    if (!painted) plate(ctx, w, h, shot, time);
  } else {
    drawCard(ctx, w, h, shot, local, time);
  }
  const bar = filmOverlay(ctx, w, h, time, info, opts);
  if (shot.kind === 'scene') lowerThird(ctx, w, h, shot, local, bar);

  // Shot ticks inside the bottom bar.
  const tickWidth = (w * 0.6) / count;
  for (let i = 0; i < count; i += 1) {
    const x = w * 0.2 + i * tickWidth;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(x, h - bar / 2, tickWidth - 3, 2);
    if (i <= index) {
      ctx.fillStyle = i < index ? 'rgba(232,194,122,0.7)' : '#f6eddc';
      ctx.fillRect(x, h - bar / 2, i === index ? (tickWidth - 3) * progress : tickWidth - 3, 2);
    }
  }
  if (opts.timecode !== false) {
    ctx.font = '500 12px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(246,237,220,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText(`${String(Math.floor(time / 60)).padStart(2, '0')}:${String(Math.floor(time % 60)).padStart(2, '0')}`, w * 0.8 - 8, h - bar / 2 - 8);
    ctx.textAlign = 'left';
  }
  ctx.restore();
  return info;
}

/** Camera for a cut at progress `p`: pan offset (world px) and zoom. */
export function trailerCamera(cut, p) {
  const cam = cut?.camera || {};
  const e = easeInOut(p);
  const [z0, z1] = cam.zoom || [1, 1];
  const [p0, p1] = cam.pan || [0, 0];
  return { zoom: lerp(z0, z1, e), pan: lerp(p0, p1, e), focus: cam.focus || 'player' };
}
