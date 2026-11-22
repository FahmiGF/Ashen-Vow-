// Ashen Vow — Update XII: Scary Mode — The Dread Beyond.
//
// A second, independent horror expansion layered on top of Update XI. It adds
// five explorable horror environments, five "Unnatural" enemies with real
// perception and memory, a psychological event director, three horror bosses,
// exploration equipment, an optional Awareness system, ten modes, a ten
// category journal with a mystery board, achievements and cosmetics.
//
// Everything in this file is pure: no DOM, no storage, no audio, no canvas.
// The shell persists `settings.dread` and `ashen-vow-dread-v1`; the simulation
// consumes only the environment layouts, enemy profiles and boss arenas.

export const DREAD_SAVE_KEY = 'ashen-vow-dread-v1';

const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));
const num = (value, fallback, lo, hi) => {
  const n = Number(value);
  return Number.isFinite(n) ? clamp(n, lo, hi) : fallback;
};
const bool = (value, fallback) => (typeof value === 'boolean' ? value : fallback);
const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);

export function seededRandom(seed) {
  let state = (Number(seed) || 1) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/* ══════════════════════════ 1. environments ══════════════════════════ */

const FLOOR_Y = 470;

/**
 * Five horror locations. Each carries a real 2D room (platforms, spawn, ceiling
 * surfaces for the Ceiling Dweller) and a separate 3D description, because the
 * two modes need different layouts and presentation.
 */
export const DREAD_ENVIRONMENTS = Object.freeze({
  forgotten_village: {
    id: 'forgotten_village',
    label: 'The Forgotten Village',
    tagline: 'Desa yang lupa cara dihuni.',
    palette: { sky: '#0a0c10', fog: '#14171c', accent: '#c0a06a', light: '#ffcf86' },
    mechanics: ['changing_doors', 'moving_windows', 'empty_voices', 'path_shift'],
    landmark: 'Lonceng tanpa penara',
    ambience: { wind: 0.7, voices: 0.35, steps: 0.45 },
    room: {
      name: 'Kampung yang Terlupakan',
      subtitle: 'The Forgotten Village',
      platforms: [
        { x: 0, y: FLOOR_Y, w: 1400, h: 70 },
        { x: 170, y: 380, w: 190, h: 18 },
        { x: 610, y: 330, w: 200, h: 18 },
        { x: 1040, y: 372, w: 190, h: 18 },
      ],
      spawn: { x: 90, y: 380 },
      enemies: [],
      gates: [],
    },
    ceilings: [{ x1: 120, x2: 520, y: 150 }, { x1: 760, x2: 1280, y: 132 }],
    clues: [
      { id: 'door_count', label: 'Jumlah pintu berubah', kind: 'puzzle' },
      { id: 'window_face', label: 'Wajah di jendela kosong', kind: 'entity' },
      { id: 'bell_toll', label: 'Lonceng berbunyi tanpa angin', kind: 'recording' },
    ],
    residents: ['Penjaga Lonceng', 'Ibu Tanpa Nama', 'Anak yang Menunggu'],
    threeD: {
      props: ['well', 'bell_tower', 'fences', 'hollow_houses'],
      ground: 'cobblestone',
      fog: 0.55,
      light: 'moon',
      features: ['doors shift on revisit', 'window silhouettes', 'distant voices from empty houses'],
    },
  },
  hollow_hospital: {
    id: 'hollow_hospital',
    label: 'The Hollow Hospital',
    tagline: 'Rumah sakit yang berhenti merawat.',
    palette: { sky: '#0b0f11', fog: '#16201f', accent: '#8fb8a8', light: '#d7f0e4' },
    mechanics: ['emergency_lights', 'monitor_signals', 'locked_rooms', 'reacts_to_exploration'],
    landmark: 'Ruang operasi 3B',
    ambience: { wind: 0.35, voices: 0.25, steps: 0.7 },
    room: {
      name: 'Rumah Sakit Berongga',
      subtitle: 'The Hollow Hospital',
      platforms: [
        { x: 0, y: FLOOR_Y, w: 620, h: 70 },
        { x: 860, y: FLOOR_Y, w: 540, h: 70 },
        { x: 640, y: 400, w: 200, h: 18 },
        { x: 300, y: 336, w: 180, h: 18 },
        { x: 960, y: 330, w: 200, h: 18 },
      ],
      spawn: { x: 70, y: 380 },
      enemies: [],
      gates: [],
    },
    ceilings: [{ x1: 60, x2: 1340, y: 120 }],
    clues: [
      { id: 'patient_tape', label: 'Rekaman pasien 46', kind: 'recording' },
      { id: 'monitor_signal', label: 'Monitor menampilkan detak kedua', kind: 'symbol' },
      { id: 'locked_ward', label: 'Bangsal terkunci dari dalam', kind: 'puzzle' },
    ],
    residents: ['Dokter Jaga', 'Pasien 46', 'Perawat Malam'],
    threeD: {
      props: ['beds', 'monitors', 'wheelchairs', 'surgical_lamp'],
      ground: 'tile',
      fog: 0.4,
      light: 'flicker',
      features: ['emergency lights', 'signal monitors', 'exploration-reactive environment'],
    },
  },
  silent_underground: {
    id: 'silent_underground',
    label: 'The Silent Underground',
    tagline: 'Peron yang tidak lagi menunggu kereta.',
    palette: { sky: '#07090b', fog: '#101518', accent: '#7f9ab0', light: '#bcd6e8' },
    mechanics: ['phantom_train', 'false_signs', 'tunnel_patterns', 'secret_passages'],
    landmark: 'Peron 9¾ yang salah',
    ambience: { wind: 0.5, voices: 0.2, steps: 0.8 },
    room: {
      name: 'Bawah Tanah Sunyi',
      subtitle: 'The Silent Underground',
      platforms: [
        { x: 0, y: FLOOR_Y, w: 460, h: 70 },
        { x: 940, y: FLOOR_Y, w: 460, h: 70 },
        { x: 500, y: 396, w: 200, h: 18 },
        { x: 760, y: 396, w: 160, h: 18 },
        { x: 600, y: 300, w: 220, h: 18 },
      ],
      spawn: { x: 60, y: 380 },
      enemies: [],
      gates: [],
    },
    ceilings: [{ x1: 40, x2: 1360, y: 110 }],
    clues: [
      { id: 'tunnel_map', label: 'Peta jalur yang tidak ada', kind: 'symbol' },
      { id: 'train_whistle', label: 'Peluit kereta dari arah tertutup', kind: 'recording' },
      { id: 'wrong_platform', label: 'Papan peron menunjuk ke bawah', kind: 'puzzle' },
    ],
    residents: ['Petugas Peron', 'Penumpang Terakhir'],
    threeD: {
      props: ['rails', 'platform_benches', 'tunnel_lamps', 'signs'],
      ground: 'concrete',
      fog: 0.6,
      light: 'tunnel',
      features: ['train pass-by event', 'misleading signs', 'light pattern shifts', 'hidden rooms'],
    },
  },
  black_manor: {
    id: 'black_manor',
    label: 'The Black Manor',
    tagline: 'Rumah yang menyimpan lebih banyak ruang daripada dinding.',
    palette: { sky: '#0a0808', fog: '#181211', accent: '#b48b5f', light: '#ffb066' },
    mechanics: ['changing_paintings', 'moving_furniture', 'hidden_doors', 'roaming_threat'],
    landmark: 'Potret tanpa wajah',
    ambience: { wind: 0.3, voices: 0.4, steps: 0.6 },
    room: {
      name: 'Kediaman Hitam',
      subtitle: 'The Black Manor',
      platforms: [
        { x: 0, y: FLOOR_Y, w: 1400, h: 70 },
        { x: 300, y: 378, w: 190, h: 18 },
        { x: 650, y: 318, w: 190, h: 18 },
        { x: 1000, y: 386, w: 180, h: 18 },
        { x: 470, y: 244, w: 170, h: 18 },
      ],
      spawn: { x: 90, y: 380 },
      enemies: [],
      gates: [],
    },
    ceilings: [{ x1: 180, x2: 620, y: 140 }, { x1: 780, x2: 1320, y: 128 }],
    clues: [
      { id: 'painting_faces', label: 'Potret berubah wajah', kind: 'entity' },
      { id: 'hidden_mechanism', label: 'Mekanisme di balik rak', kind: 'puzzle' },
      { id: 'king_seal', label: 'Segel raja tanpa mahkota', kind: 'symbol' },
    ],
    residents: ['Tuan Rumah', 'Pelayan Tanpa Wajah', 'Raja Berongga'],
    threeD: {
      props: ['grand_stair', 'portraits', 'candelabra', 'bookshelves'],
      ground: 'parquet',
      fog: 0.45,
      light: 'candle',
      features: ['paintings change on revisit', 'furniture moves', 'puzzle doors', 'roaming threat'],
    },
  },
  endless_forest: {
    id: 'endless_forest',
    label: 'The Endless Forest',
    tagline: 'Jalan yang kau kenal berubah di belakangmu.',
    palette: { sky: '#06080a', fog: '#0f1512', accent: '#7f9c78', light: '#c6e0b4' },
    mechanics: ['moving_landmarks', 'vanishing_figures', 'hidden_routes', 'navigation_by_clues'],
    landmark: 'Pohon berlubang tujuh',
    ambience: { wind: 0.9, voices: 0.2, steps: 0.55 },
    room: {
      name: 'Hutan Tanpa Ujung',
      subtitle: 'The Endless Forest',
      platforms: [
        { x: 0, y: FLOOR_Y, w: 1400, h: 70 },
        { x: 140, y: 382, w: 180, h: 18 },
        { x: 420, y: 316, w: 180, h: 18 },
        { x: 700, y: 254, w: 180, h: 18 },
        { x: 980, y: 320, w: 180, h: 18 },
        { x: 1220, y: 386, w: 160, h: 18 },
      ],
      spawn: { x: 70, y: 380 },
      enemies: [],
      gates: [],
    },
    ceilings: [{ x1: 80, x2: 1320, y: 100 }],
    clues: [
      { id: 'seven_tree', label: 'Lubang ketujuh di pohon', kind: 'puzzle' },
      { id: 'lost_lantern', label: 'Lentera yang menyala sendiri', kind: 'entity' },
      { id: 'forest_voice', label: 'Suara yang memanggil namamu', kind: 'recording' },
    ],
    residents: ['Penjaga Hutan', 'Anak yang Tersesat'],
    threeD: {
      props: ['hollow_trees', 'roots', 'fog_banks', 'stone_markers'],
      ground: 'moss',
      fog: 0.75,
      light: 'moon',
      features: ['landmarks move', 'figures vanish when approached', 'hidden routes', 'landmark navigation'],
    },
  },
});

export const DREAD_ENVIRONMENT_LIST = Object.values(DREAD_ENVIRONMENTS);
export const DREAD_ENVIRONMENT_IDS = DREAD_ENVIRONMENT_LIST.map((entry) => entry.id);

export function dreadEnvironment(id) {
  return DREAD_ENVIRONMENTS[id] || null;
}

/**
 * Build a synthetic arena for `game.loadArena`. The layout is data, so both the
 * browser and the tests run the exact same surfaces.
 */
export function dreadRoom(id, options = {}) {
  const env = DREAD_ENVIRONMENTS[id];
  if (!env) return null;
  return {
    index: options.index ?? 9100 + DREAD_ENVIRONMENT_IDS.indexOf(id),
    name: env.room.name,
    subtitle: env.room.subtitle,
    platforms: env.room.platforms.map((pl) => ({ ...pl })),
    spawn: { ...env.room.spawn },
    enemies: [],
    gates: [],
    dreadEnvironment: env.id,
    ceilingSpans: (env.ceilings || []).map((span) => ({ ...span })),
    palette: { ...env.palette },
    ambience: { ...env.ambience },
  };
}

/* ══════════════════════ 2. the Unnatural ══════════════════════ */

/**
 * Five enemies that are not ordinary monsters. Each has its own perception
 * numbers, memory, patrol style, tactic and sound signature. `baseType` only
 * selects a body/archetype for physics; behaviour lives in the fields below and
 * in core.updateUnnatural().
 */
export const UNNATURAL = Object.freeze({
  faceless_visitor: {
    id: 'faceless_visitor',
    name: 'The Faceless Visitor',
    baseType: 'sentinel',
    hp: 180, damage: 14, speed: 96, w: 36, h: 52,
    sightRange: 620, coneDeg: 150, hearingRange: 340,
    memoryTime: 14, investigateTime: 4.5, searchTime: 6, loseTime: 2.4,
    patrol: 'distant',
    tactic: 'observe-and-reposition',
    observeRange: 420, disappearRange: 130, repositionDistance: 380,
    sound: { kind: 'choir_hum', freq: 320, gain: 0.09 },
    tells: ['head tilt', 'window silhouette'],
    line: 'Ia berdiri di kejauhan. Saat kau menoleh, tempat itu kosong.',
    signature: 'Nada rendah yang berhenti tepat sebelum kau mendengarnya.',
  },
  pale_echo: {
    id: 'pale_echo',
    name: 'The Pale Echo',
    baseType: 'wraith',
    hp: 160, damage: 12, speed: 110, w: 34, h: 46,
    sightRange: 420, coneDeg: 120, hearingRange: 520,
    memoryTime: 18, investigateTime: 5, searchTime: 7, loseTime: 3,
    patrol: 'memory',
    tactic: 'imitate-and-mislead',
    decoyCount: 3, decoyRange: 300, imitationRange: 240,
    sound: { kind: 'voice_echo', freq: 440, gain: 0.11 },
    tells: ['slightly wrong voice', 'pale outline'],
    line: 'Suara itu memakai nada orang yang sudah lama pergi.',
    signature: 'Gema suara yang datang sebelum sumbernya.',
  },
  empty_knight: {
    id: 'empty_knight',
    name: 'The Empty Knight',
    baseType: 'sentinel',
    hp: 340, damage: 24, speed: 88, w: 42, h: 58,
    sightRange: 460, coneDeg: 100, hearingRange: 420,
    memoryTime: 12, investigateTime: 3.5, searchTime: 8, loseTime: 2,
    patrol: 'guard',
    tactic: 'guard-and-punish',
    guardRadius: 260, windup: 0.65, lungeSpeed: 380, lungeDamage: 26, lungeCooldown: 3,
    sound: { kind: 'metal_drag', freq: 180, gain: 0.14 },
    tells: ['drag mark', 'blade tilt'],
    line: 'Baju besi itu kosong, tetapi ia menjaga ruangan ini seperti punya alasan.',
    signature: 'Gesekan logam yang berhenti saat kau berhenti.',
  },
  ceiling_dweller: {
    id: 'ceiling_dweller',
    name: 'The Ceiling Dweller',
    baseType: 'crawler',
    hp: 260, damage: 20, speed: 150, w: 44, h: 30,
    sightRange: 380, coneDeg: 220, hearingRange: 460,
    memoryTime: 10, investigateTime: 2.5, searchTime: 4.5, loseTime: 1.6,
    patrol: 'ceiling',
    tactic: 'ceiling-ambush',
    ceilingSpeed: 190, dropRange: 120, dropCooldown: 4.5, climbSpeed: 220,
    sound: { kind: 'scuttle', freq: 900, gain: 0.1 },
    tells: ['shadow above', 'dust fall'],
    line: 'Sesuatu berjalan di langit-langit, mengikuti irama langkahmu.',
    signature: 'Klik kuku di atas, selalu tiga langkah di belakang.',
  },
  forgotten_twin: {
    id: 'forgotten_twin',
    name: 'The Forgotten Twin',
    baseType: 'sentinel',
    hp: 420, damage: 22, speed: 118, w: 30, h: 46,
    sightRange: 520, coneDeg: 160, hearingRange: 500,
    memoryTime: 20, investigateTime: 4, searchTime: 9, loseTime: 2.6,
    patrol: 'mirror',
    tactic: 'mirror-and-counter',
    mirrorOffset: 180, copyDelay: 0.22, illusionCount: 2, counterWindow: 0.9,
    sound: { kind: 'reverse_step', freq: 260, gain: 0.08 },
    tells: ['mirrored stance', 'delayed footfall'],
    line: 'Ia meniru caramu berdiri, lalu memilih gerakan yang belum kau lakukan.',
    signature: 'Langkah yang berbunyi terbalik.',
  },
  mirror_mourner: {
    id: 'mirror_mourner',
    name: 'The Mirror Mourner',
    baseType: 'sentinel',
    hp: 290, damage: 18, speed: 102, w: 34, h: 50,
    sightRange: 560, coneDeg: 150, hearingRange: 460,
    memoryTime: 16, investigateTime: 4, searchTime: 7.5, loseTime: 2.5,
    patrol: 'mirror',
    tactic: 'mirror-and-counter',
    mirrorOffset: 210, copyDelay: 0.28, illusionCount: 1, counterWindow: 0.8,
    sound: { kind: 'glass_hum', freq: 700, gain: 0.07 },
    tells: ['cracked reflection', 'tilted veil'],
    line: 'Ia berduka untuk wajah yang kau lihat di cermin, bukan wajahmu.',
    signature: 'Suara kaca yang menangis tanpa retak.',
  },
  hollow_nurse: {
    id: 'hollow_nurse',
    name: 'The Hollow Nurse',
    baseType: 'wraith',
    hp: 240, damage: 15, speed: 108, w: 34, h: 48,
    sightRange: 480, coneDeg: 130, hearingRange: 500,
    memoryTime: 15, investigateTime: 5, searchTime: 7, loseTime: 2.8,
    patrol: 'memory',
    tactic: 'imitate-and-mislead',
    decoyCount: 2, decoyRange: 260, imitationRange: 220,
    sound: { kind: 'heart_monitor', freq: 380, gain: 0.09 },
    tells: ['wrong heartbeat', 'pale uniform'],
    line: 'Ia memanggil nama pasien yang sudah tiga puluh tahun tidak dirawat.',
    signature: 'Detak monitor yang berhenti sebelum pasiennya.',
  },
});

export const UNNATURAL_LIST = Object.values(UNNATURAL);
export const UNNATURAL_IDS = UNNATURAL_LIST.map((entry) => entry.id);
export const UNNATURAL_BOSS = 'forgotten_twin';

export function unnaturalProfile(kind) {
  return UNNATURAL[kind] || null;
}

/** Real difficulty scaling, independent from the campaign. */
export function makeUnnatural(kind, x, difficulty = 'normal', extra = {}) {
  const profile = UNNATURAL[kind];
  if (!profile) return null;
  const diff = typeof difficulty === 'string' ? difficulty : 'normal';
  const factor = diff === 'hard' ? 1.18 : diff === 'easy' ? 0.85 : 1;
  return {
    type: profile.baseType,
    name: profile.name,
    x,
    minX: Math.max(24, x - 300),
    maxX: Math.min(1900, x + 300),
    hpScale: (profile.hp / 64) * factor,
    dmgScale: (profile.damage / 14) * factor,
    speedScale: (profile.speed / 64) * factor,
    unnaturalKind: kind,
    ...extra,
  };
}

const centerOf = (entity) => ({
  x: entity.x + (entity.w || 0) / 2,
  y: entity.y + (entity.h || 0) / 2,
});

/**
 * Sight requires range, a facing cone and a clear line of sight. It never
 * grants knowledge through a wall.
 */
export function canSee(observer, target, options = {}) {
  if (!observer || !target) return false;
  const o = centerOf(observer);
  const t = centerOf(target);
  const dx = t.x - o.x;
  const dy = t.y - o.y;
  const distance = Math.hypot(dx, dy);
  const range = options.range ?? observer.sightRange ?? 420;
  if (distance > range) return false;
  if (distance <= 24) return true;
  const coneDeg = options.coneDeg ?? observer.coneDeg ?? 120;
  if (coneDeg < 360 && observer.facing != null) {
    const facingAngle = observer.facing >= 0 ? 0 : Math.PI;
    const targetAngle = Math.atan2(dy, dx);
    let delta = Math.abs(targetAngle - facingAngle);
    if (delta > Math.PI) delta = Math.PI * 2 - delta;
    if (delta > (coneDeg * Math.PI) / 360) return false;
  }
  const nav = options.nav ?? null;
  if (nav && typeof nav.lineOfSight === 'function' && !nav.lineOfSight(o.x, o.y, t.x, t.y)) return false;
  return true;
}

/** Hearing ignores facing and walls but respects range and loudness. */
export function canHear(observer, noise, options = {}) {
  if (!observer || !noise) return false;
  const o = centerOf(observer);
  const n = centerOf(noise);
  const range = (options.range ?? observer.hearingRange ?? 320) * (noise.loudness ?? 1);
  return Math.hypot(n.x - o.x, n.y - o.y) <= range;
}

/** Bounded memory of where the player has recently been. */
export class PerceptionMemory {
  constructor(options = {}) {
    this.limit = Math.max(1, Number(options.limit) || 6);
    this.memoryTime = Math.max(0.5, Number(options.memoryTime) || 12);
    this.entries = [];
  }

  add(x, y, time = 0, meta = {}) {
    this.entries.push({ x, y, time, ...meta });
    while (this.entries.length > this.limit) this.entries.shift();
    return this.entries[this.entries.length - 1];
  }

  last() {
    return this.entries.length ? this.entries[this.entries.length - 1] : null;
  }

  nearestTo(x) {
    let best = null;
    let bestDistance = Infinity;
    for (const entry of this.entries) {
      const distance = Math.abs(entry.x - x);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = entry;
      }
    }
    return best;
  }

  prune(clock) {
    this.entries = this.entries.filter((entry) => clock - entry.time <= this.memoryTime);
    return this.entries.length;
  }

  clear() {
    this.entries = [];
  }

  get size() {
    return this.entries.length;
  }
}

const STATE_ORDER = { patrol: 0, investigate: 1, search: 2, hunt: 3, recover: 4 };

/**
 * Perception + memory + investigation state machine shared by every Unnatural
 * enemy. It returns intent only; core applies movement through the platform
 * navigation so nothing can walk through a wall.
 */
export class UnnaturalBrain {
  constructor(enemy, options = {}) {
    const profile = UNNATURAL[enemy?.unnaturalKind] || {};
    this.e = enemy;
    this.profile = profile;
    this.nav = options.nav || null;
    this.rng = seededRandom(options.seed ?? 1337);
    this.memory = new PerceptionMemory({
      limit: options.memoryLimit || 6,
      memoryTime: profile.memoryTime || 12,
    });
    this.state = 'patrol';
    this.stateTime = 0;
    this.clock = 0;
    this.dir = 0;
    this.alert = 0;
    this.seen = false;
    this.heard = false;
    this.lostTime = 0;
    this.stuckTime = 0;
    this.lastX = enemy?.x ?? 0;
    this.recoveries = 0;
    this.investigations = 0;
    this.patrolDir = enemy?.patrolDir ?? -1;
    this.pauseTimer = 0;
    this.targetX = null;
    this.history = [];
  }

  setState(next) {
    if (this.state === next) return;
    this.history.push({ from: this.state, to: next, at: Number(this.clock.toFixed(2)) });
    while (this.history.length > 8) this.history.shift();
    this.state = next;
    this.stateTime = 0;
  }

  nearestNode(x) {
    const nodes = this.nav?.nodes || [];
    let best = null;
    let bestDistance = Infinity;
    for (const node of nodes) {
      const distance = Math.abs(node.x - x);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = node;
      }
    }
    return best;
  }

  /** Returns the perceived noise with the highest effective loudness. */
  loudestNoise(noises = []) {
    let best = null;
    let bestScore = 0;
    for (const noise of noises) {
      if (!noise || noise.consumed) continue;
      if (!canHear(this.e, noise, { range: this.profile.hearingRange })) continue;
      const score = (noise.loudness ?? 1) * (noise.radius ?? 1);
      if (score > bestScore) {
        bestScore = score;
        best = noise;
      }
    }
    return best;
  }

  update(dt, ctx = {}) {
    if (!this.e || !Number.isFinite(dt) || dt <= 0) return this.snapshot();
    this.clock += dt;
    this.stateTime += dt;
    const player = ctx.player;
    const nav = ctx.nav || this.nav;
    this.seen = !!player && canSee(this.e, player, {
      nav,
      range: this.profile.sightRange,
      coneDeg: this.profile.coneDeg,
    });
    const noise = this.loudestNoise(ctx.noises || []);
    this.heard = !!noise;
    this.memory.prune(this.clock);

    if (this.seen) {
      const target = centerOf(player);
      this.memory.add(target.x, target.y, this.clock, { source: 'sight' });
      this.alert = Math.min(1, this.alert + dt * 0.8);
      this.lostTime = 0;
      if (this.state !== 'hunt' && this.state !== 'recover') {
        this.setState('hunt');
        this.investigations += 1;
      }
    } else if (noise) {
      const target = centerOf(noise);
      this.memory.add(target.x, target.y, this.clock, { source: 'hearing' });
      this.alert = Math.min(0.8, this.alert + dt * 0.5);
      if (this.state === 'patrol' || this.state === 'search') {
        this.setState('investigate');
        this.targetX = target.x;
      }
    } else {
      this.lostTime += dt;
      this.alert = Math.max(0, this.alert - dt * 0.25);
    }

    if (this.state === 'hunt' && !this.seen && this.lostTime > (this.profile.loseTime || 2.4)) {
      this.setState('investigate');
      this.targetX = this.memory.last()?.x ?? this.e.x;
    }

    if (this.state === 'patrol') {
      this.pauseTimer = Math.max(0, this.pauseTimer - dt);
      const minX = this.e.minX ?? 40;
      const maxX = Math.max(minX + 40, (this.e.maxX ?? 1900) - (this.e.w || 0));
      if (this.e.x <= minX + 4) this.patrolDir = 1;
      if (this.e.x >= maxX - 4) this.patrolDir = -1;
      this.dir = this.pauseTimer > 0 ? 0 : this.patrolDir;
      if (this.stateTime > 4 && this.rng() < dt * 0.35) {
        this.pauseTimer = 0.6 + this.rng() * 1.4;
        this.stateTime = 0;
      }
    } else if (this.state === 'investigate') {
      const targetX = this.targetX ?? this.memory.last()?.x ?? this.e.x;
      this.dir = Math.abs(targetX - (this.e.x + (this.e.w || 0) / 2)) > 18
        ? Math.sign(targetX - (this.e.x + (this.e.w || 0) / 2))
        : 0;
      if (this.dir === 0 || this.stateTime > (this.profile.investigateTime || 4)) this.setState('search');
    } else if (this.state === 'search') {
      if (this.stateTime > 0.7) {
        const node = this.nearestNode(this.memory.nearestTo(this.e.x)?.x ?? this.e.x);
        this.dir = node ? Math.sign(node.x - (this.e.x + (this.e.w || 0) / 2)) : 0;
      }
      if (this.stateTime > (this.profile.searchTime || 6)) {
        this.setState('patrol');
        this.targetX = null;
      }
    } else if (this.state === 'hunt') {
      const target = player ? centerOf(player) : null;
      const dx = target ? target.x - (this.e.x + (this.e.w || 0) / 2) : 0;
      this.dir = Math.abs(dx) > 12 ? Math.sign(dx) : 0;
      if (this.stateTime > 22) this.setState('search');
    } else if (this.state === 'recover') {
      const node = this.nearestNode(this.lastX);
      const dx = node ? node.x - (this.e.x + (this.e.w || 0) / 2) : 0;
      this.dir = Math.abs(dx) > 10 ? Math.sign(dx) : 0;
      if (this.stateTime > 0.45) this.setState('patrol');
    }

    return this.snapshot({ stuck: false, noise });
  }

  snapshot(extra = {}) {
    return {
      state: this.state,
      aggro: this.state === 'hunt',
      seen: this.seen,
      heard: this.heard,
      alert: Number(this.alert.toFixed(2)),
      dir: this.dir,
      targetX: this.targetX,
      memory: this.memory.entries.map((entry) => ({ x: Math.round(entry.x), source: entry.source || 'unknown' })),
      stuck: !!extra.stuck,
      recovered: this.state === 'recover',
      recoveries: this.recoveries,
      investigations: this.investigations,
      noise: extra.noise ? { x: Math.round(extra.noise.x), kind: extra.noise.kind } : null,
    };
  }
}

/* ══════════════════════ 3. psychological events ══════════════════════ */

const EVENT_REQUIREMENTS = {
  explore: (ctx) => !ctx.combat && !ctx.paused && !ctx.menu,
  alive: (ctx) => (ctx.hp ?? 1) > 0 && !ctx.dead,
  cleared: (ctx) => ctx.roomCleared !== false,
  hasEnemySlot: (ctx) => (ctx.enemySlots ?? 6) > (ctx.enemyCount ?? 0),
  darkness: (ctx) => ctx.dark !== false,
  noBoss: (ctx) => !ctx.boss,
};

export const DREAD_EVENT_RARITY = Object.freeze({ uncommon: 1, rare: 0.55, veryRare: 0.28 });

/**
 * Fourteen dynamic events. Each has activation requirements, a duration, a
 * cooldown, repetition protection, at least one outcome, an accessibility rule
 * and a documented safe exit (the `end` overrides).
 */
export const PSYCHOLOGICAL_EVENTS = Object.freeze({
  someone_behind_you: {
    id: 'someone_behind_you', label: 'Someone Is Behind You', icon: '☾',
    rarity: 'uncommon', duration: 12, cooldown: 150, weight: 1.2,
    requires: ['explore', 'alive', 'noBoss'],
    mechanic: 'A distant silhouette appears behind the player.',
    outcomes: [
      { id: 'journal', kind: 'journal', label: 'Catatan jurnal tersembunyi' },
      { id: 'encounter', kind: 'encounter', label: 'Pertemuan faceless_visitor' },
      { id: 'nothing', kind: 'nothing', label: 'Tidak ada apa-apa' },
    ],
    antiJumpscare: 'soften',
    start: [{ layer: 'presence', value: 'behind' }],
    end: [{ layer: 'presence', value: 'clear' }],
    line: 'Siluet di latar belakang. Saat kau kembali, ia sudah pergi.',
  },
  the_wrong_room: {
    id: 'the_wrong_room', label: 'The Wrong Room', icon: '⌂',
    rarity: 'rare', duration: 18, cooldown: 300, weight: 0.8,
    requires: ['explore', 'alive', 'cleared'],
    mechanic: 'A familiar room is subtly rearranged.',
    outcomes: [
      { id: 'passage', kind: 'route', label: 'Jalur rahasia terbuka' },
      { id: 'puzzle', kind: 'puzzle', label: 'Teka-teki lingkungan' },
      { id: 'collectible', kind: 'collectible', label: 'Koleksi tersembunyi' },
    ],
    antiJumpscare: 'soften',
    start: [{ layer: 'room', value: 'displaced' }],
    end: [{ layer: 'room', value: 'restore' }],
    line: 'Perabot berpindah. Pintu yang tadi di kiri kini di kanan.',
  },
  the_unanswered_call: {
    id: 'the_unanswered_call', label: 'The Unanswered Call', icon: '☎',
    rarity: 'uncommon', duration: 15, cooldown: 180, weight: 1,
    requires: ['explore', 'alive'],
    mechanic: 'An old telephone rings in a silent building.',
    outcomes: [
      { id: 'lore', kind: 'lore', label: 'Petunjuk cerita' },
      { id: 'misleading', kind: 'mislead', label: 'Pesan menyesatkan' },
      { id: 'objective', kind: 'objective', label: 'Objektif baru' },
    ],
    antiJumpscare: 'soften',
    start: [{ layer: 'audio', value: 'telephone' }],
    end: [{ layer: 'audio', value: 'restore' }],
    line: 'Telepon berdering. Tidak ada kabel yang menghubungkannya.',
  },
  the_missing_reflection: {
    id: 'the_missing_reflection', label: 'The Missing Reflection', icon: '◫',
    rarity: 'rare', duration: 10, cooldown: 240, weight: 0.7,
    requires: ['explore', 'alive'],
    mechanic: 'A mirror shows an empty room or an altered place.',
    outcomes: [
      { id: 'puzzle', kind: 'puzzle', label: 'Teka-teki cermin' },
      { id: 'collectible', kind: 'collectible', label: 'Koleksi di balik pantulan' },
      { id: 'mirror_encounter', kind: 'mirror', label: 'Pertemuan cermin' },
    ],
    antiJumpscare: 'suppress',
    start: [{ layer: 'screen', value: 'mirror' }],
    end: [{ layer: 'screen', value: 'restore' }],
    line: 'Pantulan itu menunjukkan ruangan yang tidak kau tempati.',
  },
  the_last_footstep: {
    id: 'the_last_footstep', label: 'The Last Footstep', icon: '⌁',
    rarity: 'uncommon', duration: 8, cooldown: 120, weight: 1,
    requires: ['explore', 'alive'],
    mechanic: 'A footstep repeats after the player stops moving.',
    outcomes: [
      { id: 'journal', kind: 'journal', label: 'Catatan jurnal' },
      { id: 'nothing', kind: 'nothing', label: 'Hanya gema' },
    ],
    antiJumpscare: 'soften',
    start: [{ layer: 'audio', value: 'footsteps' }],
    end: [{ layer: 'audio', value: 'restore' }],
    line: 'Kau berhenti. Langkah itu terlambat satu ketukan.',
  },
  the_empty_elevator: {
    id: 'the_empty_elevator', label: 'The Empty Elevator', icon: '▤',
    rarity: 'rare', duration: 20, cooldown: 320, weight: 0.6,
    requires: ['explore', 'alive', 'cleared'],
    mechanic: 'An elevator opens onto an unexpected location.',
    outcomes: [
      { id: 'passage', kind: 'route', label: 'Rute alternatif' },
      { id: 'lore', kind: 'lore', label: 'Lantai yang tidak ada di peta' },
    ],
    antiJumpscare: 'soften',
    start: [{ layer: 'route', value: 'elevator' }],
    end: [{ layer: 'route', value: 'restore' }],
    line: 'Pintu lift terbuka ke lorong yang tidak ada di gedung ini.',
  },
  the_watching_windows: {
    id: 'the_watching_windows', label: 'The Watching Windows', icon: '▥',
    rarity: 'uncommon', duration: 14, cooldown: 160, weight: 1.1,
    requires: ['explore', 'alive', 'noBoss'],
    mechanic: 'Silhouettes appear in distant windows.',
    outcomes: [
      { id: 'journal', kind: 'journal', label: 'Entitas tak dikenal' },
      { id: 'encounter', kind: 'encounter', label: 'Pertemuan pale_echo' },
    ],
    antiJumpscare: 'soften',
    start: [{ layer: 'presence', value: 'windows' }],
    end: [{ layer: 'presence', value: 'clear' }],
    line: 'Setiap jendela punya satu bayangan. Semuanya menghadap ke sini.',
  },
  the_broken_broadcast: {
    id: 'the_broken_broadcast', label: 'The Broken Broadcast', icon: '≋',
    rarity: 'uncommon', duration: 16, cooldown: 200, weight: 0.9,
    requires: ['explore', 'alive'],
    mechanic: 'A radio reveals fragments of forgotten history.',
    outcomes: [
      { id: 'recording', kind: 'recording', label: 'Rekaman sejarah' },
      { id: 'lore', kind: 'lore', label: 'Fragmen cerita' },
    ],
    antiJumpscare: 'soften',
    start: [{ layer: 'audio', value: 'radio' }],
    end: [{ layer: 'audio', value: 'restore' }],
    line: 'Radio hanya memutar suara ruangan ini, tiga puluh tahun lalu.',
  },
  the_disappearing_corridor: {
    id: 'the_disappearing_corridor', label: 'The Disappearing Corridor', icon: '⇥',
    rarity: 'rare', duration: 25, cooldown: 340, weight: 0.7,
    requires: ['explore', 'alive', 'cleared'],
    mechanic: 'A route changes after the player leaves the room.',
    outcomes: [
      { id: 'passage', kind: 'route', label: 'Koridor baru' },
      { id: 'puzzle', kind: 'puzzle', label: 'Jalan buntu yang bisa dibuka' },
    ],
    antiJumpscare: 'soften',
    start: [{ layer: 'route', value: 'shift' }],
    end: [{ layer: 'route', value: 'restore' }],
    line: 'Lorong yang kau lewati tadi kini berakhir di dinding.',
  },
  the_silent_crowd: {
    id: 'the_silent_crowd', label: 'The Silent Crowd', icon: '☰',
    rarity: 'uncommon', duration: 12, cooldown: 190, weight: 0.9,
    requires: ['explore', 'alive', 'hasEnemySlot'],
    mechanic: 'Several figures appear in the distance and do not move.',
    outcomes: [
      { id: 'journal', kind: 'journal', label: 'Kumpulan entitas' },
      { id: 'encounter', kind: 'encounter', label: 'Pertemuan empty_knight' },
      { id: 'nothing', kind: 'nothing', label: 'Mereka menghilang' },
    ],
    antiJumpscare: 'soften',
    start: [{ layer: 'presence', value: 'crowd' }],
    end: [{ layer: 'presence', value: 'clear' }],
    line: 'Mereka berdiri berjajar, menghadap ke arah yang salah.',
  },
  the_forgotten_door: {
    id: 'the_forgotten_door', label: 'The Forgotten Door', icon: '⚿',
    rarity: 'rare', duration: 40, cooldown: 300, weight: 0.8,
    requires: ['explore', 'alive', 'cleared'],
    mechanic: 'A previously inaccessible door becomes available.',
    outcomes: [
      { id: 'passage', kind: 'route', label: 'Pintu terbuka' },
      { id: 'collectible', kind: 'collectible', label: 'Barang di balik pintu' },
    ],
    antiJumpscare: 'soften',
    start: [{ layer: 'route', value: 'door' }],
    end: [{ layer: 'route', value: 'restore' }],
    line: 'Pintu yang selalu terkunci kini sedikit terbuka.',
  },
  the_repeated_minute: {
    id: 'the_repeated_minute', label: 'The Repeated Minute', icon: '◷',
    rarity: 'veryRare', duration: 22, cooldown: 420, weight: 0.45,
    requires: ['explore', 'alive'],
    mechanic: 'A small environmental sequence repeats exactly.',
    outcomes: [
      { id: 'journal', kind: 'journal', label: 'Anomali waktu' },
      { id: 'puzzle', kind: 'puzzle', label: 'Pola berulang' },
    ],
    antiJumpscare: 'soften',
    start: [{ layer: 'room', value: 'repeat' }],
    end: [{ layer: 'room', value: 'restore' }],
    line: 'Lampu berkedip dengan urutan yang sama. Lagi.',
  },
  the_uninvited_guest: {
    id: 'the_uninvited_guest', label: 'The Uninvited Guest', icon: '☗',
    rarity: 'rare', duration: 9, cooldown: 260, weight: 0.7,
    requires: ['explore', 'alive', 'cleared', 'hasEnemySlot'],
    mechanic: 'A figure appears briefly inside a safe-looking room.',
    outcomes: [
      { id: 'encounter', kind: 'encounter', label: 'Tamu tak diundang' },
      { id: 'journal', kind: 'journal', label: 'Catatan tamu' },
      { id: 'nothing', kind: 'nothing', label: 'Kursi kosong' },
    ],
    antiJumpscare: 'suppress',
    start: [{ layer: 'presence', value: 'guest' }],
    end: [{ layer: 'presence', value: 'clear' }],
    line: 'Seseorang duduk di kursi yang tadi kosong. Ia tidak bergerak.',
  },
  the_blackout: {
    id: 'the_blackout', label: 'The Blackout', icon: '◼',
    rarity: 'uncommon', duration: 18, cooldown: 220, weight: 1,
    requires: ['explore', 'alive', 'darkness'],
    mechanic: 'Lighting changes and the environment enters an alternate state.',
    outcomes: [
      { id: 'journal', kind: 'journal', label: 'Kondisi alternatif' },
      { id: 'encounter', kind: 'encounter', label: 'Sesuatu bergerak dalam gelap' },
      { id: 'lore', kind: 'lore', label: 'Tulisan hanya terlihat dalam gelap' },
    ],
    antiJumpscare: 'soften',
    start: [{ layer: 'lighting', value: 'blackout' }],
    end: [{ layer: 'lighting', value: 'restore' }],
    line: 'Seluruh cahaya padam. Tidak ada yang berubah selain itu.',
  },
  the_bell_that_answers: {
    id: 'the_bell_that_answers', label: 'The Bell That Answers', icon: '♢',
    rarity: 'uncommon', duration: 14, cooldown: 180, weight: 0.9,
    requires: ['explore', 'alive'],
    mechanic: 'A buried bell rings once, and the room answers with a second toll.',
    outcomes: [
      { id: 'journal', kind: 'journal', label: 'Lonceng tanpa penara' },
      { id: 'lore', kind: 'lore', label: 'Nama di prasasti bawah tanah' },
      { id: 'nothing', kind: 'nothing', label: 'Hanya gema' },
    ],
    antiJumpscare: 'soften',
    start: [{ layer: 'audio', value: 'bell_answer' }],
    end: [{ layer: 'audio', value: 'restore' }],
    line: 'Lonceng berbunyi sekali. Jawabannya datang dari bawah kakimu.',
  },
  the_empty_choir: {
    id: 'the_empty_choir', label: 'The Empty Choir', icon: '♪',
    rarity: 'rare', duration: 17, cooldown: 250, weight: 0.7,
    requires: ['explore', 'alive', 'cleared'],
    mechanic: 'A hymn rises from a room with no singers in it.',
    outcomes: [
      { id: 'recording', kind: 'recording', label: 'Rekaman paduan suara' },
      { id: 'journal', kind: 'journal', label: 'Daftar nama penyanyi' },
      { id: 'misleading', kind: 'mislead', label: 'Suara dari arah yang salah' },
    ],
    antiJumpscare: 'soften',
    start: [{ layer: 'audio', value: 'empty_choir' }],
    end: [{ layer: 'audio', value: 'restore' }],
    line: 'Paduan suara menyanyi tanpa napas. Tidak ada mulut yang bergerak.',
  },
  the_floor_face: {
    id: 'the_floor_face', label: 'The Floor Face', icon: '☟',
    rarity: 'rare', duration: 8, cooldown: 260, weight: 0.55,
    requires: ['explore', 'alive'],
    mechanic: 'A pale face looks up through the floorboards.',
    outcomes: [
      { id: 'encounter', kind: 'encounter', label: 'Sesuatu di bawah lantai' },
      { id: 'journal', kind: 'journal', label: 'Wajah tanpa tubuh' },
      { id: 'nothing', kind: 'nothing', label: 'Papan lantai kosong' },
    ],
    antiJumpscare: 'suppress',
    start: [{ layer: 'screen', value: 'floor_face' }],
    end: [{ layer: 'screen', value: 'restore' }],
    line: 'Wajah itu menatap ke atas, menunggu kau menginjaknya.',
  },
  the_second_reflection: {
    id: 'the_second_reflection', label: 'The Second Reflection', icon: '◫',
    rarity: 'uncommon', duration: 11, cooldown: 210, weight: 0.8,
    requires: ['explore', 'alive'],
    mechanic: 'Two reflections move independently in the same mirror.',
    outcomes: [
      { id: 'puzzle', kind: 'puzzle', label: 'Pola cermin kedua' },
      { id: 'mirror_encounter', kind: 'mirror', label: 'Pertemuan mirror_mourner' },
      { id: 'journal', kind: 'journal', label: 'Catatan pantulan' },
    ],
    antiJumpscare: 'suppress',
    start: [{ layer: 'screen', value: 'mirror_hall' }],
    end: [{ layer: 'screen', value: 'restore' }],
    line: 'Pantulanmu berhenti. Pantulan yang lain terus berjalan.',
  },
});

export const PSYCHOLOGICAL_EVENT_LIST = Object.values(PSYCHOLOGICAL_EVENTS);
export const PSYCHOLOGICAL_EVENT_IDS = PSYCHOLOGICAL_EVENT_LIST.map((entry) => entry.id);

const RARITY_ORDER = { common: 0, uncommon: 0, rare: 1, veryRare: 2 };

/**
 * Runs one or more psychological events. Repetition protection, per-event
 * frequency overrides, hard timeouts, safe exits and accessibility rules are
 * all enforced here; a cancelled event always drains its `end` overrides.
 */
export class DreadEventDirector {
  constructor(settings = {}, options = {}) {
    this.clock = 0;
    this.rng = seededRandom(options.seed ?? 20261119);
    this.active = [];
    this.last = null;
    this.cooldowns = {};
    this.seen = {};
    this.history = [];
    this.pending = [];
    this.started = 0;
    this.cancelled = 0;
    this.completed = 0;
    this.maxConcurrent = 1;
    this.frequency = 1;
    this.perEvent = {};
    this.repeatProtection = true;
    this.antiJumpscare = false;
    this.roomIndex = options.roomIndex ?? 0;
    this.configure(settings);
  }

  configure(settings = {}) {
    this.settings = sanitizeDreadSettings(settings);
    this.maxConcurrent = this.settings.maxConcurrentEvents;
    this.frequency = { off: 0, low: 0.6, medium: 1, high: 1.5 }[this.settings.eventFrequency] ?? 1;
    this.perEvent = { ...this.settings.perEventFrequency };
    this.repeatProtection = this.settings.eventRepeatProtection;
    this.antiJumpscare = !!this.settings.antiJumpscare;
    return this.settings;
  }

  requirementState(event, ctx) {
    if (!this.settings.environmentEvents) return 'disabled';
    if (this.active.some((entry) => entry.id === event.id)) return 'already-active';
    if (this.active.length >= this.maxConcurrent) return 'limit';
    if ((this.cooldowns[event.id] || 0) > 0) return 'cooldown';
    for (const key of event.requires) {
      const rule = EVENT_REQUIREMENTS[key];
      if (rule && !rule(ctx)) return `requires:${key}`;
    }
    return null;
  }

  /** Pick a real outcome; anti-jumpscare removes startling outcomes first. */
  resolveOutcome(event, random = this.rng) {
    const pool = event.outcomes.filter((outcome) => {
      if (!this.antiJumpscare) return true;
      return outcome.kind !== 'mirror' && outcome.kind !== 'encounter';
    });
    const usable = pool.length ? pool : event.outcomes.filter((entry) => entry.kind === 'nothing');
    if (!usable.length) return { id: 'nothing', kind: 'nothing', label: 'Tidak ada apa-apa' };
    return usable[Math.min(usable.length - 1, Math.floor(random() * usable.length))];
  }

  tryStart(eventId, ctx = {}) {
    const event = PSYCHOLOGICAL_EVENTS[eventId];
    if (!event) return 'unknown';
    const blocked = this.requirementState(event, ctx);
    if (blocked) return blocked;
    const outcome = this.resolveOutcome(event);
    const entry = {
      id: event.id,
      label: event.label,
      phase: 'active',
      elapsed: 0,
      duration: event.duration,
      hardTimeout: event.duration * 1.6 + 3,
      outcome,
      suppressed: this.antiJumpscare && event.antiJumpscare === 'suppress',
      startedAt: this.clock,
    };
    this.active.push(entry);
    this.started += 1;
    this.seen[event.id] = (this.seen[event.id] || 0) + 1;
    for (const change of event.start) this.pending.push({ ...change, event: event.id, phase: 'start', outcome: outcome.kind });
    return entry;
  }

  /** Weighted automatic selection, respecting measured frequency. */
  autoStart(ctx = {}) {
    if (this.active.length >= this.maxConcurrent) return null;
    const roll = this.rng();
    if (roll > 0.55 * this.frequency) return 'roll';
    const candidates = PSYCHOLOGICAL_EVENT_LIST.filter((event) => !this.requirementState(event, ctx));
    if (!candidates.length) return 'no-candidates';
    let pool = candidates;
    if (this.repeatProtection) {
      const fresh = pool.filter((event) => !this.history.includes(event.id));
      if (fresh.length) pool = fresh;
    }
    const weighted = pool.map((event) => {
      const base = event.weight * (DREAD_EVENT_RARITY[event.rarity] ?? 1);
      const override = this.perEvent[event.id];
      return Math.max(0, base * (override == null ? 1 : override));
    });
    const total = weighted.reduce((sum, value) => sum + value, 0);
    if (total <= 0) return 'zero-weight';
    let target = this.rng() * total;
    let chosen = pool[pool.length - 1];
    for (let index = 0; index < pool.length; index += 1) {
      target -= weighted[index];
      if (target <= 0) { chosen = pool[index]; break; }
    }
    return this.tryStart(chosen.id, ctx);
  }

  endOverride(event) {
    for (const change of event.end) this.pending.push({ ...change, event: event.id, phase: 'end' });
  }

  cancel(eventId, reason = 'cancelled') {
    const index = this.active.findIndex((entry) => entry.id === eventId);
    if (index < 0) return null;
    const entry = this.active[index];
    const event = PSYCHOLOGICAL_EVENTS[entry.id];
    this.active.splice(index, 1);
    this.endOverride(event);
    this.cooldowns[event.id] = event.cooldown;
    this.cancelled += 1;
    this.last = { id: event.id, phase: 'cancelled', reason };
    return this.last;
  }

  finish(eventId) {
    const index = this.active.findIndex((entry) => entry.id === eventId);
    if (index < 0) return null;
    const entry = this.active[index];
    const event = PSYCHOLOGICAL_EVENTS[entry.id];
    this.active.splice(index, 1);
    this.endOverride(event);
    this.cooldowns[event.id] = event.cooldown;
    this.completed += 1;
    this.history.push(event.id);
    while (this.history.length > 6) this.history.shift();
    this.last = { id: event.id, phase: 'done', outcome: entry.outcome };
    this.pending.push({ layer: 'outcome', value: entry.outcome.kind, event: event.id, phase: 'outcome', outcome: entry.outcome });
    return this.last;
  }

  update(dt, ctx = {}) {
    if (!Number.isFinite(dt) || dt <= 0) return this.snapshot();
    this.clock += dt;
    for (const id of Object.keys(this.cooldowns)) this.cooldowns[id] = Math.max(0, this.cooldowns[id] - dt);
    if (ctx.roomIndex != null && ctx.roomIndex !== this.roomIndex) {
      this.roomIndex = ctx.roomIndex;
      for (const entry of this.active.slice()) this.cancel(entry.id, 'room-change');
      return this.snapshot();
    }
    const death = ctx.dead || (ctx.hp ?? 1) <= 0;
    for (const entry of this.active.slice()) {
      const event = PSYCHOLOGICAL_EVENTS[entry.id];
      if (death) { this.cancel(entry.id, 'death'); continue; }
      if (ctx.menu || ctx.paused) { this.cancel(entry.id, 'menu'); continue; }
      if (this.settings.disableDuringBoss && ctx.boss) { this.cancel(entry.id, 'boss'); continue; }
      entry.elapsed += dt;
      if (entry.elapsed >= entry.duration) this.finish(entry.id);
      else if (entry.elapsed >= entry.hardTimeout) this.cancel(entry.id, 'timeout');
    }
    return this.snapshot();
  }

  drain() {
    const changes = this.pending.slice();
    this.pending = [];
    return changes;
  }

  snapshot() {
    return {
      active: this.active.map((entry) => ({ ...entry })),
      activeIds: this.active.map((entry) => entry.id),
      last: this.last,
      started: this.started,
      cancelled: this.cancelled,
      completed: this.completed,
      cooldowns: Object.fromEntries(Object.entries(this.cooldowns).filter(([, value]) => value > 0).map(([id, value]) => [id, Math.round(value)])),
      seen: { ...this.seen },
      history: this.history.slice(-5),
      maxConcurrent: this.maxConcurrent,
    };
  }
}

/* ══════════════════════ 4. horror bosses ══════════════════════ */

export const DREAD_BOSSES = Object.freeze({
  watcher_beyond: {
    id: 'watcher_beyond',
    name: 'The Watcher Beyond',
    title: 'Yang Mengawasi Dari Luar',
    environment: 'black_manor',
    kind: 'dread',
    maxHp: 1800,
    contact: 18,
    w: 120,
    h: 150,
    speed: 92,
    arena: { minX: 140, maxX: 1260 },
    phases: [
      { phase: 1, name: 'Observation', threshold: 0.75, pattern: 'gaze', tells: ['eye opens'], hitboxTtl: 0.3 },
      { phase: 2, name: 'Arena Manipulation', threshold: 0.5, pattern: 'shift', tells: ['room tilts'], hitboxTtl: 0.34 },
      { phase: 3, name: 'Direct Confrontation', threshold: 0.25, pattern: 'reach', tells: ['arm unfolds'], hitboxTtl: 0.28 },
      { phase: 4, name: 'Final Challenge', threshold: 0, pattern: 'unblinking', tells: ['no shadow left'], hitboxTtl: 0.26 },
    ],
    phaseThresholds: [0.75, 0.5, 0.25],
    dialogue: {
      intro: [{ speaker: 'The Watcher Beyond', text: 'Aku sudah melihat setiap langkahmu sebelum kau mengambilnya.' }],
      phase2: [{ speaker: 'The Watcher Beyond', text: 'Ruangan ini milikku. Dindingnya mendengarku.' }],
      phase3: [{ speaker: 'The Watcher Beyond', text: 'Cukup menonton.' }],
      phase4: [{ speaker: 'The Watcher Beyond', text: 'Sekarang kau tidak bisa berpaling.' }],
      defeat: [{ speaker: 'The Watcher Beyond', text: 'Aku akan tetap melihat, meski tanpa mata.' }],
    },
  },
  hollow_king: {
    id: 'hollow_king',
    name: 'The Hollow King',
    title: 'Raja Tanpa Mahkota',
    environment: 'black_manor',
    kind: 'dread',
    maxHp: 2400,
    contact: 20,
    w: 130,
    h: 160,
    speed: 74,
    arena: { minX: 120, maxX: 1280 },
    phases: [
      { phase: 1, name: 'Court', threshold: 0.6, pattern: 'summon', tells: ['crown lifts'], hitboxTtl: 0.36 },
      { phase: 2, name: 'Throne', threshold: 0, pattern: 'arena', tells: ['floor cracks'], hitboxTtl: 0.32 },
    ],
    phaseThresholds: [0.6],
    hiddenPhase: { threshold: 0.15, arena: { minX: 320, maxX: 1080 }, name: 'Hidden Court' },
    summons: ['empty_knight', 'faceless_visitor'],
    dialogue: {
      intro: [{ speaker: 'The Hollow King', text: 'Kau masuk ke istanaku tanpa mahkota. Itu cukup untuk dihukum.' }],
      phase2: [{ speaker: 'The Hollow King', text: 'Pengawal, tunjukkan tamu kita apa itu kesetiaan.' }],
      defeat: [{ speaker: 'The Hollow King', text: 'Tahta ini kosong sejak lama. Kau boleh mengambilnya.' }],
    },
  },
  forgotten_twin: {
    id: 'forgotten_twin',
    name: 'The Forgotten Twin',
    title: 'Pantulan Yang Terlupakan',
    environment: 'silent_underground',
    kind: 'dread',
    maxHp: 1500,
    contact: 16,
    w: 34,
    h: 48,
    speed: 118,
    arena: { minX: 200, maxX: 1200 },
    mirror: true,
    phases: [
      { phase: 1, name: 'Imitation', threshold: 0.66, pattern: 'mirror', tells: ['stance copies'], hitboxTtl: 0.24 },
      { phase: 2, name: 'Illusion', threshold: 0.33, pattern: 'illusions', tells: ['three shadows'], hitboxTtl: 0.26 },
      { phase: 3, name: 'Counter', threshold: 0, pattern: 'counter', tells: ['blade behind'], hitboxTtl: 0.22 },
    ],
    phaseThresholds: [0.66, 0.33],
    illusions: 2,
    dialogue: {
      intro: [{ speaker: 'The Forgotten Twin', text: 'Aku adalah gerakan yang kau tahan.' }],
      phase2: [{ speaker: 'The Forgotten Twin', text: 'Kau tidak bisa membedakan kami sekarang.' }],
      phase3: [{ speaker: 'The Forgotten Twin', text: 'Setiap tebakanmu adalah milikku.' }],
      defeat: [{ speaker: 'The Forgotten Twin', text: 'Kau menang. Aku akan menunggu pantulan berikutnya.' }],
    },
  },
});

export const DREAD_BOSS_LIST = Object.values(DREAD_BOSSES);
export const DREAD_BOSS_IDS = DREAD_BOSS_LIST.map((entry) => entry.id);

export function dreadBossProfile(kind) {
  return DREAD_BOSSES[kind] || null;
}

/** Spawn overrides consumed by `game.spawnBoss(kind, overrides)`. */
export function dreadBossSpawn(kind, extra = {}) {
  const profile = DREAD_BOSSES[kind];
  if (!profile) return null;
  return {
    name: profile.name,
    title: profile.title,
    maxHp: profile.maxHp,
    contact: profile.contact,
    w: profile.w,
    h: profile.h,
    maxPhases: profile.phases.length,
    phaseThresholds: profile.phaseThresholds.slice(),
    spawn: { x: profile.mirror ? 900 : 760, y: FLOOR_Y - profile.h },
    flying: false,
    reward: 'none',
    dialogueData: profile.dialogue,
    dreadBoss: kind,
    arena: { ...profile.arena },
    ...extra,
  };
}

/**
 * Tracks boss phases, arena containment and hitbox lifetimes. Active hitboxes
 * are closed on phase change, stagger, death and expiry, so no hitbox can stay
 * dangerous after its attack ends.
 */
export class DreadBossManager {
  constructor() {
    this.boss = null;
    this.hitboxes = [];
    this.events = [];
    this.dead = false;
  }

  begin(kind) {
    const profile = DREAD_BOSSES[kind];
    if (!profile) return null;
    this.boss = {
      kind,
      hp: profile.maxHp,
      maxHp: profile.maxHp,
      phase: 1,
      arena: { ...profile.arena },
      illusionCount: 0,
      lastPattern: null,
      hiddenPhaseEntered: false,
    };
    this.hitboxes = [];
    this.events = [{ type: 'dreadBossBegin', kind }];
    this.dead = false;
    return this.boss;
  }

  /** Clamp the boss and any illusion into its arena without touching physics. */
  clamp(entity) {
    if (!this.boss || !entity) return entity;
    const { minX, maxX } = this.boss.arena;
    entity.x = clamp(entity.x, minX, Math.max(minX, maxX - (entity.w || 0)));
    return entity;
  }

  openHitbox(id, ttl, data = {}) {
    if (!this.boss || this.dead) return null;
    const hitbox = { id, ttl: Math.max(0, ttl), maxTtl: Math.max(0, ttl), data };
    this.hitboxes.push(hitbox);
    return hitbox;
  }

  closeAll(reason = 'attack-end') {
    const closed = this.hitboxes.length;
    this.hitboxes = [];
    if (closed) this.events.push({ type: 'dreadHitboxesClosed', reason, count: closed });
    return closed;
  }

  damage(amount) {
    if (!this.boss || this.dead) return this.boss;
    this.boss.hp = Math.max(0, this.boss.hp - Math.max(0, Number(amount) || 0));
    return this.evaluate();
  }

  /** Re-derive phases, the hidden arena and death from the boss's current HP. */
  evaluate() {
    if (!this.boss) return null;
    const profile = DREAD_BOSSES[this.boss.kind];
    const ratio = this.boss.hp / this.boss.maxHp;
    const nextPhase = profile.phases[this.boss.phase];
    // phaseThresholds[i] is the HP fraction that enters phase i + 2, matching
    // the campaign boss contract in core.hurtBoss().
    const enterAt = profile.phaseThresholds[this.boss.phase - 1];
    if (nextPhase && this.boss.hp > 0 && enterAt != null && ratio <= enterAt) {
      this.boss.phase = nextPhase.phase;
      this.boss.lastPattern = nextPhase.pattern;
      this.closeAll('phase');
      this.events.push({ type: 'dreadBossPhase', kind: this.boss.kind, phase: nextPhase.phase, name: nextPhase.name });
    }
    const hidden = profile.hiddenPhase;
    if (hidden && !this.boss.hiddenPhaseEntered && this.boss.hp > 0 && ratio <= hidden.threshold) {
      this.boss.hiddenPhaseEntered = true;
      this.boss.arena = { ...hidden.arena };
      this.events.push({ type: 'dreadBossArena', kind: this.boss.kind, arena: hidden.name });
    }
    if (this.boss.hp <= 0) {
      this.dead = true;
      this.closeAll('death');
      this.events.push({ type: 'dreadBossDown', kind: this.boss.kind, name: profile.name });
    }
    return this.boss;
  }

  tick(dt) {
    for (const hitbox of this.hitboxes) hitbox.ttl -= dt;
    const expired = this.hitboxes.filter((hitbox) => hitbox.ttl <= 0);
    if (expired.length) {
      this.closeAll('expired');
      this.events.push({ type: 'dreadHitboxesExpired', count: expired.length });
    }
    return this.snapshot();
  }

  snapshot() {
    return {
      boss: this.boss ? { ...this.boss, arena: { ...this.boss.arena }, ratio: Number((this.boss.hp / this.boss.maxHp).toFixed(3)) } : null,
      activeHitboxes: this.hitboxes.map((hitbox) => ({ id: hitbox.id, ttl: Number(hitbox.ttl.toFixed(2)) })),
      dead: this.dead,
    };
  }
}

/* ══════════════════════ 5. exploration equipment ══════════════════════ */

export const DREAD_EQUIPMENT = Object.freeze([
  { id: 'old_lantern', label: 'Old Lantern', use: 'Menerangi area gelap.', effect: 'light_radius', kind: 'exploration', combatBonus: 0, unlocks: ['dark_passage'] },
  { id: 'signal_detector', label: 'Signal Detector', use: 'Mendeteksi sinyal lingkungan tak wajar.', effect: 'signal_ping', kind: 'exploration', combatBonus: 0, unlocks: ['hidden_signal'] },
  { id: 'echo_recorder', label: 'Echo Recorder', use: 'Merekam dan memutar ulang suara lingkungan.', effect: 'replay_audio', kind: 'exploration', combatBonus: 0, unlocks: ['recording_clue'] },
  { id: 'broken_compass', label: 'Broken Compass', use: 'Bereaksi terhadap peristiwa tersembunyi di dekat.', effect: 'proximity_alarm', kind: 'exploration', combatBonus: 0, unlocks: ['hidden_route'] },
  { id: 'spectral_lens', label: 'Spectral Lens', use: 'Mengungkap petunjuk tersembunyi tertentu.', effect: 'reveal_clue', kind: 'exploration', combatBonus: 0, unlocks: ['symbol_clue', 'mirror_clue'] },
  { id: 'portable_radio', label: 'Portable Radio', use: 'Menerima siaran misterius.', effect: 'broadcast', kind: 'exploration', combatBonus: 0, unlocks: ['radio_fragment'] },
  { id: 'memory_camera', label: 'Memory Camera', use: 'Mengambil gambar petunjuk supranatural.', effect: 'capture_clue', kind: 'exploration', combatBonus: 0, unlocks: ['photo_evidence'] },
  { id: 'ancient_keyring', label: 'Ancient Keyring', use: 'Menyimpan kunci khusus yang ditemukan.', effect: 'store_keys', kind: 'exploration', combatBonus: 0, unlocks: ['special_key'] },
  { id: 'journal_scanner', label: 'Journal Scanner', use: 'Mencatat simbol yang belum dikenali.', effect: 'scan_symbols', kind: 'exploration', combatBonus: 0, unlocks: ['symbol_entry'] },
  { id: 'emergency_beacon', label: 'Emergency Beacon', use: 'Menandai titik kembali sementara.', effect: 'return_point', kind: 'exploration', combatBonus: 0, unlocks: ['safe_return'] },
]);

export const DREAD_EQUIPMENT_IDS = DREAD_EQUIPMENT.map((entry) => entry.id);

export function dreadEquipment(id) {
  return DREAD_EQUIPMENT.find((entry) => entry.id === id) || null;
}

/** Every piece is explicitly non-combat: no damage, defence or mobility power. */
export function equipmentExplorationOnly(loadout = []) {
  return loadout.every((id) => {
    const item = dreadEquipment(id);
    return !!item && item.kind === 'exploration' && item.combatBonus === 0;
  });
}

export function equipmentUnlocks(loadout = []) {
  const set = new Set();
  for (const id of loadout) {
    const item = dreadEquipment(id);
    if (item) for (const unlock of item.unlocks) set.add(unlock);
  }
  return [...set];
}

/* ══════════════════════ 6. awareness ══════════════════════ */

export const AWARENESS_DEFAULTS = Object.freeze({
  enabled: false,
  max: 100,
  start: 0,
  perClue: 8,
  perEvent: 5,
  perEncounter: 3,
  decayPerSecond: 0.5,
  stabilizedFloor: 0,
  threshold: 60,
});

/**
 * Optional Awareness. It only ever adds information and atmosphere; it never
 * damages the player, never removes control and never blocks progression.
 */
export class AwarenessManager {
  constructor(options = {}) {
    this.config = { ...AWARENESS_DEFAULTS, ...(options.config || options) };
    this.config.enabled = !!this.config.enabled;
    this.value = clamp(Number(this.config.start) || 0, 0, this.config.max);
    this.sources = [];
    this.stabilizations = 0;
    this.clock = 0;
  }

  setEnabled(enabled) {
    this.config.enabled = !!enabled;
    return this.snapshot();
  }

  add(amount, source = 'unknown') {
    if (!this.config.enabled) return this.value;
    const delta = Number(amount);
    if (!Number.isFinite(delta)) return this.value;
    this.value = clamp(this.value + delta, 0, this.config.max);
    this.sources.push({ source, delta, value: this.value });
    while (this.sources.length > 12) this.sources.shift();
    return this.value;
  }

  addClue() { return this.add(this.config.perClue, 'clue'); }
  addEvent() { return this.add(this.config.perEvent, 'event'); }
  addEncounter() { return this.add(this.config.perEncounter, 'encounter'); }

  tick(dt) {
    if (!this.config.enabled || !Number.isFinite(dt) || dt <= 0) return this.value;
    this.clock += dt;
    this.value = Math.max(this.config.stabilizedFloor, this.value - this.config.decayPerSecond * dt);
    return this.value;
  }

  /** Explicit stabilization: the player can always bring the meter back down. */
  ground() {
    this.value = 0;
    this.sources = [];
    this.stabilizations += 1;
    return this.snapshot();
  }

  level() {
    if (this.value >= 85) return 'open';
    if (this.value >= this.config.threshold) return 'attuned';
    if (this.value >= 25) return 'calm';
    return 'flat';
  }

  effects() {
    const attuned = this.value >= this.config.threshold;
    return {
      clueGlow: this.value >= 40,
      audioClarity: this.value >= 55,
      eventAccess: attuned,
      journalEntries: this.value >= 70,
      extraSilhouettes: false,
      controlBlocked: false,
      damageOverTime: 0,
      healthPenalty: 0,
      imperceptible: this.value >= 25 && !this.config.enabled,
    };
  }

  snapshot() {
    return {
      enabled: this.config.enabled,
      value: Math.round(this.value),
      max: this.config.max,
      level: this.level(),
      effects: this.effects(),
      stabilizations: this.stabilizations,
      config: { ...this.config },
    };
  }
}

/* ══════════════════════ 7. modes ══════════════════════ */

const MODE_GOAL = (id, label, target) => ({ id, label, target });

export const DREAD_MODES = Object.freeze({
  night_shift: {
    id: 'night_shift', label: 'Night Shift', environment: 'hollow_hospital', icon: '☾',
    desc: 'Selesaikan objektif sambil menjelajahi fasilitas berhantu.',
    objectives: [MODE_GOAL('tasks', 'Tugas malam', 3), MODE_GOAL('rooms', 'Ruang diperiksa', 5)],
    completion: 'Semua tugas malam selesai dan lima ruang diperiksa.',
    reward: 'cosmetic_nightfall', difficulties: ['easy', 'normal', 'hard'],
    awareness: 'optional', saveKey: 'night_shift',
  },
  the_pursuit: {
    id: 'the_pursuit', label: 'The Pursuit', environment: 'endless_forest', icon: '➤',
    desc: 'Navigasi lokasi berbahaya sambil diikuti.',
    objectives: [MODE_GOAL('distance', 'Jarak ditempuh', 3), MODE_GOAL('evades', 'Kejaran dilewati', 2)],
    completion: 'Bertahan dari dua kejaran penuh.',
    reward: 'title_silent_explorer', difficulties: ['normal', 'hard'],
    awareness: 'optional', saveKey: 'the_pursuit',
  },
  lost_memories: {
    id: 'lost_memories', label: 'Lost Memories', environment: 'forgotten_village', icon: '✦',
    desc: 'Jelajahi lokasi dan rekonstruksi ceritanya.',
    objectives: [MODE_GOAL('memories', 'Fragmen ingatan', 6)],
    completion: 'Enam fragmen ingatan dipulihkan.',
    reward: 'outfit_archivist', difficulties: ['easy', 'normal', 'hard'],
    awareness: 'helpful', saveKey: 'lost_memories',
  },
  endless_haunted: {
    id: 'endless_haunted', label: 'Endless Haunted', environment: 'black_manor', icon: '∞',
    desc: 'Pertemuan horor yang tersusun secara prosedural.',
    objectives: [MODE_GOAL('waves', 'Gelombang', 5)],
    completion: 'Lima gelombang horor diselesaikan.',
    reward: 'companion_watcher', difficulties: ['normal', 'hard'],
    awareness: 'optional', saveKey: 'endless_haunted',
  },
  watcher_challenge: {
    id: 'watcher_challenge', label: 'The Watcher Challenge', environment: 'black_manor', icon: '👁',
    desc: 'Bertahan dari rangkaian pertemuan musuh cerdas.',
    objectives: [MODE_GOAL('encounters', 'Pertemuan cerdas', 4), MODE_GOAL('boss', 'Bos diawasi', 1)],
    completion: 'Empat pertemuan dan satu bos diselesaikan.',
    reward: 'frame_mirror', difficulties: ['normal', 'hard'],
    awareness: 'optional', saveKey: 'watcher_challenge',
  },
  haunted_investigation: {
    id: 'haunted_investigation', label: 'Haunted Investigation', environment: 'silent_underground', icon: '⌕',
    desc: 'Temukan bukti dan pecahkan misteri supranatural.',
    objectives: [MODE_GOAL('evidence', 'Bukti', 8), MODE_GOAL('mysteries', 'Misteri', 2)],
    completion: 'Delapan bukti dan dua misteri terpecahkan.',
    reward: 'title_investigator', difficulties: ['easy', 'normal', 'hard'],
    awareness: 'helpful', saveKey: 'haunted_investigation',
  },
  no_signal: {
    id: 'no_signal', label: 'No Signal', environment: 'silent_underground', icon: '≋',
    desc: 'Jelajahi tanpa bantuan navigasi biasa.',
    objectives: [MODE_GOAL('landmarks', 'Penanda ditemukan', 4), MODE_GOAL('exit', 'Jalan keluar', 1)],
    completion: 'Empat penanda ditemukan dan jalan keluar dicapai.',
    reward: 'emote_echo', difficulties: ['normal', 'hard'],
    awareness: 'optional', saveKey: 'no_signal',
  },
  blackout_protocol: {
    id: 'blackout_protocol', label: 'Blackout Protocol', environment: 'hollow_hospital', icon: '◼',
    desc: 'Selesaikan objektif dengan pencahayaan terbatas.',
    objectives: [MODE_GOAL('tasks', 'Objektif', 4), MODE_GOAL('lantern', 'Lentera bertahan', 1)],
    completion: 'Empat objektif selesai tanpa kehilangan lentera.',
    reward: 'accessory_dark_lantern', difficulties: ['normal', 'hard'],
    awareness: 'off', saveKey: 'blackout_protocol',
  },
  last_visitor: {
    id: 'last_visitor', label: 'The Last Visitor', environment: 'forgotten_village', icon: '☗',
    desc: 'Investigasi lokasi dengan urutan peristiwa yang berubah.',
    objectives: [MODE_GOAL('visits', 'Kunjungan', 3), MODE_GOAL('events', 'Peristiwa', 4)],
    completion: 'Tiga kunjungan dan empat peristiwa tercatat.',
    reward: 'title_silent_explorer', difficulties: ['easy', 'normal', 'hard'],
    awareness: 'helpful', saveKey: 'last_visitor',
  },
  echoes_of_past: {
    id: 'echoes_of_past', label: 'Echoes of the Past', environment: 'endless_forest', icon: '◷',
    desc: 'Putar ulang peristiwa lingkungan untuk menemukan lore tersembunyi.',
    objectives: [MODE_GOAL('replays', 'Peristiwa diputar ulang', 3), MODE_GOAL('lore', 'Lore', 4)],
    completion: 'Tiga peristiwa diputar ulang dan empat lore ditemukan.',
    reward: 'outfit_archivist', difficulties: ['easy', 'normal', 'hard'],
    awareness: 'helpful', saveKey: 'echoes_of_past',
  },
});

export const DREAD_MODE_LIST = Object.values(DREAD_MODES);
export const DREAD_MODE_IDS = DREAD_MODE_LIST.map((entry) => entry.id);

export function dreadModeProgress(modeId, state = {}) {
  const mode = DREAD_MODES[modeId];
  if (!mode) return null;
  const counters = state.objectives || state || {};
  const objectives = mode.objectives.map((goal) => {
    const value = Math.max(0, Number(counters[goal.id]) || 0);
    return { ...goal, value, done: value >= goal.target };
  });
  const done = objectives.filter((goal) => goal.done).length;
  return {
    id: mode.id,
    objectives,
    complete: done === objectives.length,
    ratio: objectives.length ? done / objectives.length : 0,
  };
}

/* ══════════════════════ 8. journal 2.0 ══════════════════════ */

export const DREAD_CATEGORIES = Object.freeze([
  { id: 'entities', label: 'Unidentified Entities', icon: '☠' },
  { id: 'locations', label: 'Haunted Locations', icon: '⌂' },
  { id: 'recordings', label: 'Strange Recordings', icon: '≋' },
  { id: 'residents', label: 'Forgotten Residents', icon: '☗' },
  { id: 'events', label: 'Supernatural Events', icon: '✧' },
  { id: 'symbols', label: 'Ancient Symbols', icon: 'ᛝ' },
  { id: 'encounters', label: 'Secret Encounters', icon: '⚔' },
  { id: 'bosses', label: 'Boss Records', icon: '♛' },
  { id: 'experiments', label: 'Hidden Experiments', icon: '⚗' },
  { id: 'mysteries', label: 'Unsolved Mysteries', icon: '?' },
]);

export const DREAD_CATEGORY_IDS = DREAD_CATEGORIES.map((entry) => entry.id);

const ENTRY_SEEDS = {
  entities: [
    ['faceless_visitor', 'The Faceless Visitor', 'Sosok yang hanya terlihat dari jauh.'],
    ['pale_echo', 'The Pale Echo', 'Meniru suara yang pernah kau dengar.'],
    ['empty_knight', 'The Empty Knight', 'Armor tanpa isi yang tetap menjaga.'],
    ['ceiling_dweller', 'The Ceiling Dweller', 'Berjalan di permukaan yang tidak seharusnya.'],
    ['forgotten_twin', 'The Forgotten Twin', 'Pantulan yang memilih gerakanmu.'],
    ['watcher_beyond', 'The Watcher Beyond', 'Mengawasi dari luar ruangan.'],
  ],
  locations: [
    ['forgotten_village', 'The Forgotten Village', 'Desa yang pintunya berpindah.'],
    ['hollow_hospital', 'The Hollow Hospital', 'Fasilitas yang berhenti merawat.'],
    ['silent_underground', 'The Silent Underground', 'Peron tanpa jadwal.'],
    ['black_manor', 'The Black Manor', 'Rumah dengan ruang berlebih.'],
    ['endless_forest', 'The Endless Forest', 'Hutan yang mengubah jalan pulang.'],
    ['hidden_wing', 'The Hidden Wing', 'Sayap bangunan yang tidak ada di denah.'],
  ],
  recordings: [
    ['call_1', 'Panggilan Pertama', 'Dering tanpa kabel.'],
    ['call_2', 'Panggilan Kedua', 'Suara yang menyebut namamu.'],
    ['tape_46', 'Rekaman Pasien 46', 'Detak kedua di monitor.'],
    ['train_whistle', 'Peluit Tanpa Kereta', 'Terdengar dari arah tertutup.'],
    ['radio_ash', 'Siaran Abu', 'Berita dari tiga puluh tahun lalu.'],
    ['last_voicemail', 'Pesan Terakhir', 'Belum sempat diputar.'],
  ],
  residents: [
    ['bell_keeper', 'Penjaga Lonceng', 'Menghitung denting yang tidak ada.'],
    ['patient_46', 'Pasien 46', 'Tidak pernah keluar dari bangsal.'],
    ['platform_attendant', 'Petugas Peron', 'Menunggu kereta yang salah.'],
    ['hollow_king', 'Raja Berongga', 'Memerintah ruangan kosong.'],
    ['forest_guardian', 'Penjaga Hutan', 'Menandai jalan yang berubah.'],
    ['nameless_mother', 'Ibu Tanpa Nama', 'Memanggil dari rumah kosong.'],
  ],
  events: [
    ['someone_behind_you', 'Someone Is Behind You', 'Siluet yang hilang saat didekati.'],
    ['the_wrong_room', 'The Wrong Room', 'Perabot yang berpindah.'],
    ['the_unanswered_call', 'The Unanswered Call', 'Telepon di gedung sunyi.'],
    ['the_missing_reflection', 'The Missing Reflection', 'Cermin yang salah kamar.'],
    ['the_blackout', 'The Blackout', 'Cahaya padam tanpa sebab.'],
    ['the_repeated_minute', 'The Repeated Minute', 'Urutan yang berulang.'],
  ],
  symbols: [
    ['seven_hollow', 'Tujuh Lubang', 'Pola pada pohon tua.'],
    ['crown_seal', 'Segel Mahkota', 'Lambang raja tanpa mahkota.'],
    ['tunnel_glyph', 'Glyph Terowongan', 'Menunjuk ke bawah, bukan ke luar.'],
    ['mirror_frame', 'Bingkai Cermin', 'Simetri yang salah satu sisinya kosong.'],
    ['ward_mark', 'Tanda Bangsal', 'Dibuat dari dalam.'],
    ['ash_script', 'Aksara Abu', 'Hanya terbaca saat gelap.'],
  ],
  encounters: [
    ['mirror_meeting', 'Mirror Meeting', 'Pertemuan di balik pantulan.'],
    ['corridor_chase', 'Corridor Chase', 'Kejaran di lorong yang berubah.'],
    ['empty_bench', 'The Empty Bench', 'Seseorang duduk, lalu tidak.'],
    ['ceiling_drop', 'Ceiling Drop', 'Serangan dari langit-langit.'],
    ['guarded_relic', 'Guarded Relic', 'Relik yang dijaga armor kosong.'],
    ['twin_duel', 'Twin Duel', 'Duel melawan gerakan sendiri.'],
  ],
  bosses: [
    ['watcher_beyond', 'The Watcher Beyond', 'Empat fase pengamatan.'],
    ['hollow_king', 'The Hollow King', 'Tahta dan pengawal spektral.'],
    ['forgotten_twin', 'The Forgotten Twin', 'Tiga fase pantulan.'],
    ['hidden_court', 'The Hidden Court', 'Arena kedua di bawah ambang.'],
    ['gaze_phase', 'The Unblinking Gaze', 'Fase akhir tanpa bayangan.'],
    ['mirror_arena', 'Mirror Arena', 'Ruang yang memantulkan serangan.'],
  ],
  experiments: [
    ['ward_46', 'Ward 46', 'Perawatan yang tidak tercatat.'],
    ['signal_trial', 'Signal Trial', 'Monitor menerima sinyal dari lantai bawah.'],
    ['door_test', 'Door Test', 'Pintu dipindahkan, bukan dibuka.'],
    ['memory_scan', 'Memory Scan', 'Pemindaian ingatan tanpa izin.'],
    ['echo_chamber', 'Echo Chamber', 'Ruangan yang menyimpan suara.'],
    ['twin_project', 'Twin Project', 'Proyek pantulan yang dihentikan.'],
  ],
  mysteries: [
    ['who_called', 'Who Called?', 'Tidak ada nomor, tidak ada kabel.'],
    ['why_doors_move', 'Why Do The Doors Move?', 'Pintu berpindah saat tidak dilihat.'],
    ['missing_floor', 'The Missing Floor', 'Lantai yang tidak ada di denah.'],
    ['twin_origin', 'Origin of the Twin', 'Dari mana pantulan itu berasal.'],
    ['forest_exit', 'The Forest Exit', 'Jalan keluar yang selalu berubah.'],
    ['last_visitor', 'The Last Visitor', 'Siapa yang datang terakhir.'],
  ],
};

const ENTRY_LOCATION = {
  entities: 'forgotten_village', locations: 'black_manor', recordings: 'hollow_hospital',
  residents: 'forgotten_village', events: 'endless_forest', symbols: 'silent_underground',
  encounters: 'silent_underground', bosses: 'black_manor', experiments: 'hollow_hospital',
  mysteries: 'endless_forest',
};
const ENTRY_ACHIEVEMENT = {
  entities: 'first_encounter', locations: 'silent_explorer', recordings: 'unanswered_calls',
  residents: 'forgotten_history', events: 'night_without_fear', symbols: 'forgotten_history',
  encounters: 'beyond_the_mirror', bosses: 'watcher_knows', experiments: 'master_investigator',
  mysteries: 'master_investigator',
};

/** 60 entries: ten categories × six. Deterministic, so tests can rely on it. */
export const DREAD_JOURNAL_ENTRIES = Object.freeze(
  DREAD_CATEGORIES.flatMap((category) => ENTRY_SEEDS[category.id].map(([slug, title, summary], index) => ({
    id: `${category.id}.${slug}`,
    category: category.id,
    slug,
    title,
    summary,
    location: DREAD_ENVIRONMENTS[ENTRY_LOCATION[category.id]]?.label || 'Unknown',
    environment: ENTRY_LOCATION[category.id],
    characters: [DREAD_ENVIRONMENTS[ENTRY_LOCATION[category.id]]?.residents?.[index % 3] || 'Unknown'],
    evidence: [`${slug}_note`, `${slug}_trace`],
    recordings: category.id === 'recordings' ? [slug] : [`${slug}_echo`],
    fragment: `${title} — ${summary}`,
    achievement: ENTRY_ACHIEVEMENT[category.id],
    related: index % 2 === 0 ? ['the_wrong_room'] : ['someone_behind_you'],
  }))),
);

export const DREAD_JOURNAL_ENTRY_IDS = DREAD_JOURNAL_ENTRIES.map((entry) => entry.id);
export const DREAD_JOURNAL_BY_ID = Object.fromEntries(DREAD_JOURNAL_ENTRIES.map((entry) => [entry.id, entry]));

const DREAD_ACHIEVEMENT_DEFS = [
  { id: 'first_encounter', label: 'First Encounter', desc: 'Temukan satu entitas supranatural.', icon: '☠', reward: 'accessory_dark_lantern' },
  { id: 'silent_explorer', label: 'Silent Explorer', desc: 'Selesaikan satu eksplorasi lokasi.', icon: '◌', reward: 'title_silent_explorer' },
  { id: 'beyond_the_mirror', label: 'Beyond the Mirror', desc: 'Selesaikan misteri cermin.', icon: '◫', reward: 'frame_mirror' },
  { id: 'unanswered_calls', label: 'Unanswered Calls', desc: 'Temukan semua rekaman telepon.', icon: '☎', reward: 'emote_echo' },
  { id: 'forgotten_history', label: 'Forgotten History', desc: 'Lengkapi satu kategori jurnal.', icon: 'ᛝ', reward: 'outfit_archivist' },
  { id: 'watcher_knows', label: 'The Watcher Knows', desc: 'Selesaikan pertemuan The Watcher.', icon: '👁', reward: 'companion_watcher' },
  { id: 'master_investigator', label: 'Master Investigator', desc: 'Selesaikan semua objektif investigasi.', icon: '⌕', reward: 'title_investigator' },
  { id: 'night_without_fear', label: 'Night Without Fear', desc: 'Selesaikan tantangan dengan pengaturan kenyamanan sendiri.', icon: '◐', reward: 'cosmetic_nightfall' },
];

export const DREAD_ACHIEVEMENTS = Object.freeze(DREAD_ACHIEVEMENT_DEFS.map((entry) => ({ ...entry, accessibilitySafe: true })));
export const DREAD_ACHIEVEMENT_IDS = DREAD_ACHIEVEMENTS.map((entry) => entry.id);

export const DREAD_REWARDS = Object.freeze([
  { id: 'accessory_dark_lantern', label: 'Dark Lantern', kind: 'accessory', cosmetic: true },
  { id: 'title_silent_explorer', label: 'Silent Explorer', kind: 'title', cosmetic: true },
  { id: 'frame_mirror', label: 'Mirror Profile Frame', kind: 'profile frame', cosmetic: true },
  { id: 'emote_echo', label: 'Echo Emote', kind: 'emote', cosmetic: true },
  { id: 'outfit_archivist', label: 'Archivist Outfit', kind: 'outfit', cosmetic: true },
  { id: 'companion_watcher', label: 'Watcher Companion Skin', kind: 'companion skin', cosmetic: true },
  { id: 'title_investigator', label: 'Investigator Title', kind: 'title', cosmetic: true },
  { id: 'cosmetic_nightfall', label: 'Nightfall Cosmetic', kind: 'cosmetic set', cosmetic: true },
]);
export const DREAD_REWARD_IDS = DREAD_REWARDS.map((entry) => entry.id);
export const DREAD_REWARD_BY_ACHIEVEMENT = Object.fromEntries(DREAD_ACHIEVEMENTS.map((entry) => [entry.id, entry.reward]));

function achievementUnlocked(id, journal, state) {
  const discovered = journal.entries;
  switch (id) {
    case 'first_encounter':
      return DREAD_JOURNAL_ENTRIES.some((entry) => entry.category === 'entities' && discovered[entry.id]);
    case 'silent_explorer':
      return journal.areas.length >= 1;
    case 'beyond_the_mirror':
      return !!discovered['mysteries.twin_origin'] || !!discovered['encounters.mirror_meeting'];
    case 'unanswered_calls':
      return ENTRY_SEEDS.recordings.every(([slug]) => !!discovered[`recordings.${slug}`]);
    case 'forgotten_history':
      return DREAD_CATEGORIES.some((category) => {
        const entries = DREAD_JOURNAL_ENTRIES.filter((entry) => entry.category === category.id);
        return entries.every((entry) => discovered[entry.id]);
      });
    case 'watcher_knows':
      return journal.bosses.includes('watcher_beyond');
    case 'master_investigator':
      return journal.evidence.length >= 12 && journal.modes.length >= 5;
    case 'night_without_fear':
      return journal.challenges.includes('comfort_settings');
    default:
      return false;
  }
}

/**
 * Dread journal: discovery dates, evidence, recordings, fragments, completion
 * percentages, achievements and an optional mystery board. Connections never
 * gate story progress.
 */
export class DreadJournal {
  constructor(raw = {}) {
    const clean = sanitizeDreadProgress(raw);
    this.entries = clean.entries;
    this.evidence = clean.evidence;
    this.recordings = clean.recordings;
    this.areas = clean.areas;
    this.bosses = clean.bosses;
    this.modes = clean.modes;
    this.connections = clean.connections;
    this.challenges = clean.challenges;
    this.rewards = clean.rewards;
    this.counters = clean.counters;
    this.dates = clean.dates;
    this.flags = clean.flags;
  }

  discover(entryId, options = {}) {
    const entry = DREAD_JOURNAL_BY_ID[entryId];
    if (!entry) return { ok: false, reason: 'unknown-entry' };
    const first = !this.entries[entryId];
    if (first) {
      this.entries[entryId] = options.date || new Date().toISOString().slice(0, 10);
      this.dates[entryId] = this.entries[entryId];
      this.counters.discoveries += 1;
    }
    return { ok: true, first, entry };
  }

  collect(entryId, evidenceId) {
    const entry = DREAD_JOURNAL_BY_ID[entryId];
    if (!entry || !entry.evidence.includes(evidenceId)) return false;
    if (!this.entries[entryId]) this.discover(entryId);
    if (this.evidence.includes(`${entryId}:${evidenceId}`)) return false;
    this.evidence.push(`${entryId}:${evidenceId}`);
    return true;
  }

  recordRecording(id) {
    const known = DREAD_JOURNAL_ENTRIES.some((entry) => entry.recordings.includes(id));
    if (!known || this.recordings.includes(id)) return false;
    this.recordings.push(id);
    return true;
  }

  completeArea(id) {
    if (!DREAD_ENVIRONMENT_IDS.includes(id) || this.areas.includes(id)) return false;
    this.areas.push(id);
    return true;
  }

  recordBoss(id) {
    if (!DREAD_BOSS_IDS.includes(id) || this.bosses.includes(id)) return false;
    this.bosses.push(id);
    return true;
  }

  recordMode(id) {
    if (!DREAD_MODE_IDS.includes(id) || this.modes.includes(id)) return false;
    this.modes.push(id);
    return true;
  }

  recordChallenge(id) {
    const value = String(id || '');
    if (!value || this.challenges.includes(value)) return false;
    this.challenges.push(value);
    return true;
  }

  /** Optional clue linking. Never blocks the story and never deletes progress. */
  connect(aId, bId) {
    if (aId === bId) return { ok: false, reason: 'same-entry' };
    const a = DREAD_JOURNAL_BY_ID[aId];
    const b = DREAD_JOURNAL_BY_ID[bId];
    if (!a || !b) return { ok: false, reason: 'unknown-entry' };
    if (!this.entries[aId] || !this.entries[bId]) return { ok: false, reason: 'not-discovered' };
    const key = [aId, bId].sort().join('|');
    if (this.connections.some((connection) => connection.key === key)) return { ok: false, reason: 'already-connected' };
    this.connections.push({ key, a: aId, b: bId, category: a.category === b.category ? a.category : 'cross' });
    return { ok: true, key, optional: true };
  }

  board() {
    return DREAD_CATEGORIES.map((category) => ({
      ...category,
      total: DREAD_JOURNAL_ENTRIES.filter((entry) => entry.category === category.id).length,
      found: DREAD_JOURNAL_ENTRIES.filter((entry) => entry.category === category.id && this.entries[entry.id]).length,
      connections: this.connections.filter((connection) => {
        const entry = DREAD_JOURNAL_BY_ID[connection.a];
        return entry?.category === category.id;
      }).length,
    }));
  }

  completion() {
    const categories = this.board().map((category) => ({
      id: category.id,
      label: category.label,
      found: category.found,
      total: category.total,
      percent: Math.round((category.found / category.total) * 100),
    }));
    const found = categories.reduce((sum, category) => sum + category.found, 0);
    return {
      categories,
      found,
      total: DREAD_JOURNAL_ENTRIES.length,
      percent: Math.round((found / DREAD_JOURNAL_ENTRIES.length) * 100),
      evidence: this.evidence.length,
      recordings: this.recordings.length,
      connections: this.connections.length,
    };
  }

  achievements() {
    return DREAD_ACHIEVEMENTS.map((entry) => ({
      ...entry,
      unlocked: achievementUnlocked(entry.id, this),
    }));
  }

  unlockedAchievements() {
    return this.achievements().filter((entry) => entry.unlocked).map((entry) => entry.id);
  }

  /** Cosmetic only, granted once, available with anti-jumpscare enabled. */
  grantRewards() {
    const granted = [];
    for (const id of this.unlockedAchievements()) {
      const reward = DREAD_REWARD_BY_ACHIEVEMENT[id];
      if (reward && !this.rewards.includes(reward)) {
        this.rewards.push(reward);
        granted.push(reward);
      }
    }
    return granted;
  }

  progress() {
    const completion = this.completion();
    const unlocked = this.unlockedAchievements();
    return {
      ...completion,
      achievements: `${unlocked.length}/${DREAD_ACHIEVEMENTS.length}`,
      unlocked,
      rewards: `${this.rewards.length}/${DREAD_REWARDS.length}`,
      bosses: `${this.bosses.length}/${DREAD_BOSS_IDS.length}`,
      modes: `${this.modes.length}/${DREAD_MODE_IDS.length}`,
    };
  }

  snapshot() {
    return {
      ...this.progress(),
      entries: { ...this.entries },
      evidence: [...this.evidence],
      recordings: [...this.recordings],
      areas: [...this.areas],
      bosses: [...this.bosses],
      modes: [...this.modes],
      challenges: [...this.challenges],
      rewards: [...this.rewards],
      connections: this.connections.map((connection) => ({ ...connection })),
      counters: { ...this.counters },
      achievements: this.achievements(),
      board: this.board(),
    };
  }

  toJSON() {
    return {
      version: 1,
      entries: this.entries,
      evidence: this.evidence,
      recordings: this.recordings,
      areas: this.areas,
      bosses: this.bosses,
      modes: this.modes,
      connections: this.connections,
      challenges: this.challenges,
      rewards: this.rewards,
      counters: this.counters,
      flags: this.flags,
    };
  }
}

export function sanitizeDreadProgress(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const entries = {};
  if (source.entries && typeof source.entries === 'object') {
    for (const [id, date] of Object.entries(source.entries)) {
      if (DREAD_JOURNAL_BY_ID[id] && typeof date === 'string' && date.length <= 24) entries[id] = date;
    }
  }
  const list = (value, allowed) => (Array.isArray(value) ? [...new Set(value.filter((id) => allowed.includes(id)))] : []);
  const strings = (value) => (Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === 'string' && id.length > 0))] : []);
  const connections = Array.isArray(source.connections)
    ? source.connections.filter((connection) => connection && DREAD_JOURNAL_BY_ID[connection.a] && DREAD_JOURNAL_BY_ID[connection.b])
      .map((connection) => ({ key: String(connection.key || [connection.a, connection.b].sort().join('|')), a: connection.a, b: connection.b, category: String(connection.category || 'cross') }))
    : [];
  const counters = source.counters && typeof source.counters === 'object' ? source.counters : {};
  return {
    entries,
    evidence: strings(source.evidence),
    recordings: strings(source.recordings),
    areas: list(source.areas, DREAD_ENVIRONMENT_IDS),
    bosses: list(source.bosses, DREAD_BOSS_IDS),
    modes: list(source.modes, DREAD_MODE_IDS),
    connections,
    challenges: strings(source.challenges),
    rewards: list(source.rewards, DREAD_REWARD_IDS),
    counters: { discoveries: Math.max(0, Math.floor(Number(counters.discoveries) || 0)) },
    dates: { ...entries },
    flags: source.flags && typeof source.flags === 'object' ? { ...source.flags } : {},
  };
}

/* ══════════════════════ 9. settings 2.0 ══════════════════════ */

export const DREAD_TABS = [
  { id: 'atmosphere', label: 'Atmosfer', icon: '◈' },
  { id: 'events', label: 'Peristiwa', icon: '✧' },
  { id: 'enemies', label: 'Musuh', icon: '☾' },
  { id: 'bosses', label: 'Bos', icon: '♛' },
  { id: 'profiles', label: 'Profil 2D/3D', icon: '▣' },
  { id: 'modes', label: 'Mode', icon: '◇' },
];

const ALL_EVENT_IDS = PSYCHOLOGICAL_EVENT_IDS;
const ENEMY_KEYS = [...UNNATURAL_IDS];
const PROFILE_LEVELS = ['off', 'reduced', 'full'];

export const DREAD_DEFAULTS = Object.freeze({
  enabled: true,
  environmentEvents: true,
  eventFrequency: 'medium',
  eventRepeatProtection: true,
  maxConcurrentEvents: 1,
  disableDuringBoss: true,
  perEventFrequency: {},
  darknessAdd: 10,
  fogAdd: 10,
  environmentMovement: true,
  unusualLighting: true,
  silhouetteEvents: true,
  ambientIntensity: 60,
  enemyScares: Object.fromEntries(ENEMY_KEYS.map((id) => [id, true])),
  enemyDetection: 'auto',
  enemyMemory: true,
  bossHorror: true,
  bossTells: 'clear',
  bossCinematics: true,
  profile2D: { darkness: 50, fog: 50, effects: 'full' },
  profile3D: { darkness: 45, fog: 40, effects: 'reduced' },
  awarenessEnabled: false,
  awarenessSensitivity: 1,
  awarenessAssist: true,
  perMode: {},
  journalAssist: true,
  mysteryBoard: true,
  overrideExplanations: true,
  antiJumpscare: false,
});

export function sanitizeDreadSettings(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const d = DREAD_DEFAULTS;
  const profile = (value, fallback) => {
    const input = value && typeof value === 'object' ? value : {};
    return {
      darkness: num(input.darkness, fallback.darkness, 0, 100),
      fog: num(input.fog, fallback.fog, 0, 100),
      effects: pick(input.effects, PROFILE_LEVELS, fallback.effects),
    };
  };
  const perEventFrequency = {};
  if (source.perEventFrequency && typeof source.perEventFrequency === 'object') {
    for (const [id, value] of Object.entries(source.perEventFrequency)) {
      if (ALL_EVENT_IDS.includes(id)) perEventFrequency[id] = num(value, 1, 0, 2);
    }
  }
  const enemyScares = {};
  for (const id of ENEMY_KEYS) {
    const input = source.enemyScares && typeof source.enemyScares === 'object' ? source.enemyScares[id] : undefined;
    enemyScares[id] = bool(input, true);
  }
  const perMode = {};
  if (source.perMode && typeof source.perMode === 'object') {
    for (const [id, value] of Object.entries(source.perMode)) {
      if (!DREAD_MODE_IDS.includes(id) || !value || typeof value !== 'object') continue;
      perMode[id] = {
        difficulty: pick(value.difficulty, ['easy', 'normal', 'hard'], 'normal'),
        awareness: pick(value.awareness, ['off', 'on'], 'off'),
        eventFrequency: pick(value.eventFrequency, ['low', 'medium', 'high'], 'medium'),
      };
    }
  }
  return {
    enabled: bool(source.enabled, d.enabled),
    environmentEvents: bool(source.environmentEvents, d.environmentEvents),
    eventFrequency: pick(source.eventFrequency, ['off', 'low', 'medium', 'high'], d.eventFrequency),
    eventRepeatProtection: bool(source.eventRepeatProtection, d.eventRepeatProtection),
    maxConcurrentEvents: num(source.maxConcurrentEvents, d.maxConcurrentEvents, 1, 3),
    disableDuringBoss: bool(source.disableDuringBoss, d.disableDuringBoss),
    perEventFrequency,
    darknessAdd: num(source.darknessAdd, d.darknessAdd, 0, 40),
    fogAdd: num(source.fogAdd, d.fogAdd, 0, 40),
    environmentMovement: bool(source.environmentMovement, d.environmentMovement),
    unusualLighting: bool(source.unusualLighting, d.unusualLighting),
    silhouetteEvents: bool(source.silhouetteEvents, d.silhouetteEvents),
    ambientIntensity: num(source.ambientIntensity, d.ambientIntensity, 0, 100),
    enemyScares,
    enemyDetection: pick(source.enemyDetection, ['auto', 'forgiving', 'standard', 'advanced'], d.enemyDetection),
    enemyMemory: bool(source.enemyMemory, d.enemyMemory),
    bossHorror: bool(source.bossHorror, d.bossHorror),
    bossTells: pick(source.bossTells, ['clear', 'standard'], d.bossTells),
    bossCinematics: bool(source.bossCinematics, d.bossCinematics),
    profile2D: profile(source.profile2D, d.profile2D),
    profile3D: profile(source.profile3D, d.profile3D),
    awarenessEnabled: bool(source.awarenessEnabled, d.awarenessEnabled),
    awarenessSensitivity: num(source.awarenessSensitivity, d.awarenessSensitivity, 0.25, 2),
    awarenessAssist: bool(source.awarenessAssist, d.awarenessAssist),
    perMode,
    journalAssist: bool(source.journalAssist, d.journalAssist),
    mysteryBoard: bool(source.mysteryBoard, d.mysteryBoard),
    overrideExplanations: bool(source.overrideExplanations, d.overrideExplanations),
    antiJumpscare: bool(source.antiJumpscare, d.antiJumpscare),
  };
}

const row = (path, label, desc, tab, extra = {}) => ({ path: `dread.${path}`, label, desc, tab, ...extra });
const toggle = (path, label, desc, tab) => row(path, label, desc, tab, { type: 'toggle' });
const select = (path, label, desc, tab, options) => row(path, label, desc, tab, { type: 'select', options });
const range = (path, label, desc, tab, min, max, step, suffix = '') => row(path, label, desc, tab, { type: 'range', min, max, step, suffix });

export const DREAD_SETTING_DEFINITIONS = [
  toggle('enabled', 'Aktifkan The Dread Beyond', 'Mengaktifkan lapisan ekspansi horor. Default aktif.', 'atmosphere'),
  range('darknessAdd', 'Kegelapan Tambahan', 'Tambahan kegelapan khusus Dread Beyond.', 'atmosphere', 0, 40, 2, '%'),
  range('fogAdd', 'Kabut Tambahan', 'Tambahan kabut khusus Dread Beyond.', 'atmosphere', 0, 40, 2, '%'),
  range('ambientIntensity', 'Intensitas Ambience', 'Kekuatan ambient horor ekspansi.', 'atmosphere', 0, 100, 5, '%'),
  toggle('environmentMovement', 'Gerakan Lingkungan', 'Pintu, perabot, dan penanda bergerak.', 'atmosphere'),
  toggle('unusualLighting', 'Peristiwa Cahaya Tak Wajar', 'Lampu darurat dan blackout.', 'atmosphere'),
  toggle('silhouetteEvents', 'Siluet Latar', 'Siluet jauh di jendela dan pepohonan.', 'atmosphere'),

  toggle('environmentEvents', 'Peristiwa Lingkungan', 'Saklar utama seluruh peristiwa psikologis.', 'events'),
  select('eventFrequency', 'Frekuensi Peristiwa', 'Seberapa sering peristiwa dipilih.', 'events', [
    { id: 'off', label: 'Off' }, { id: 'low', label: 'Low' }, { id: 'medium', label: 'Medium' }, { id: 'high', label: 'High' },
  ]),
  range('maxConcurrentEvents', 'Maksimum Peristiwa Bersamaan', 'Batas keras peristiwa aktif.', 'events', 1, 3, 1, ''),
  toggle('eventRepeatProtection', 'Cegah Pengulangan', 'Peristiwa yang sama tidak berulang beruntun.', 'events'),
  toggle('disableDuringBoss', 'Matikan Saat Bos', 'Tidak ada peristiwa selama pertarungan bos.', 'events'),

  toggle('enemyMemory', 'Memori Musuh', 'Unnatural mengingat lokasi terakhir.', 'enemies'),
  select('enemyDetection', 'Deteksi Unnatural', 'Auto mengikuti kesulitan horor.', 'enemies', [
    { id: 'auto', label: 'Auto' }, { id: 'forgiving', label: 'Forgiving' }, { id: 'standard', label: 'Standard' }, { id: 'advanced', label: 'Advanced' },
  ]),
  ...UNNATURAL_IDS.map((id) => toggle(`enemyScares.${id}`, `Kejutan — ${UNNATURAL[id].name}`, 'Presentasi khusus untuk musuh ini.', 'enemies')),

  toggle('bossHorror', 'Presentasi Horor Bos', 'Lapisan atmosfer saat bos horor aktif.', 'bosses'),
  select('bossTells', 'Kejelasan Attack Tell', 'Clear menjaga indikator serangan tetap terbaca.', 'bosses', [
    { id: 'clear', label: 'Clear' }, { id: 'standard', label: 'Standard' },
  ]),
  toggle('bossCinematics', 'Sinematik Bos', 'Kejutan pengantar bos (anti-jumpscare menimpanya).', 'bosses'),

  select('profile2D.darkness', 'Kegelapan 2D', 'Profil terpisah untuk mode 2D.', 'profiles', [
    { id: 0, label: '0%' }, { id: 25, label: '25%' }, { id: 50, label: '50%' }, { id: 75, label: '75%' }, { id: 100, label: '100%' },
  ]),
  select('profile2D.fog', 'Kabut 2D', 'Profil terpisah untuk mode 2D.', 'profiles', [
    { id: 0, label: '0%' }, { id: 25, label: '25%' }, { id: 50, label: '50%' }, { id: 75, label: '75%' }, { id: 100, label: '100%' },
  ]),
  select('profile2D.effects', 'Efek 2D', 'Intensitas efek 2D.', 'profiles', [
    { id: 'off', label: 'Off' }, { id: 'reduced', label: 'Reduced' }, { id: 'full', label: 'Full' },
  ]),
  select('profile3D.darkness', 'Kegelapan 3D', 'Profil terpisah untuk mode 3D.', 'profiles', [
    { id: 0, label: '0%' }, { id: 25, label: '25%' }, { id: 50, label: '50%' }, { id: 75, label: '75%' }, { id: 100, label: '100%' },
  ]),
  select('profile3D.fog', 'Kabut 3D', 'Profil terpisah untuk mode 3D.', 'profiles', [
    { id: 0, label: '0%' }, { id: 25, label: '25%' }, { id: 50, label: '50%' }, { id: 75, label: '75%' }, { id: 100, label: '100%' },
  ]),
  select('profile3D.effects', 'Efek 3D', 'Intensitas efek 3D.', 'profiles', [
    { id: 'off', label: 'Off' }, { id: 'reduced', label: 'Reduced' }, { id: 'full', label: 'Full' },
  ]),

  toggle('awarenessEnabled', 'Aktifkan Awareness', 'Sistem opsional; tidak pernah menghukum eksplorasi.', 'modes'),
  range('awarenessSensitivity', 'Sensitivitas Awareness', 'Pengali perolehan Awareness.', 'modes', 0.25, 2, 0.25, '×'),
  toggle('awarenessAssist', 'Bantuan Stabilisasi', 'Menambah cara menenangkan meter.', 'modes'),
  toggle('journalAssist', 'Bantuan Jurnal', 'Menandai petunjuk yang belum ditemukan.', 'modes'),
  toggle('mysteryBoard', 'Papan Misteri', 'Menghubungkan petunjuk; opsional dan tidak memblokir cerita.', 'modes'),
  toggle('overrideExplanations', 'Penjelasan Override', 'Menampilkan pengaturan mana yang menimpa yang lain.', 'modes'),
];

export const DREAD_SETTING_BY_PATH = Object.fromEntries(DREAD_SETTING_DEFINITIONS.map((entry) => [entry.path, entry]));

export function dreadSettingsForTab(tabId) {
  return DREAD_SETTING_DEFINITIONS.filter((entry) => entry.tab === tabId);
}

/**
 * Merge the Dread layer with the Update XI horror presentation. Accessibility
 * can only remove effects, never add them. Every entry in `overrides` explains a
 * real precedence rule; `cleanup` lists the paths the shell must restore.
 */
export function resolveDreadPresentation(dread = {}, horror = {}, ctx = {}) {
  const s = sanitizeDreadSettings(dread);
  const anti = !!s.antiJumpscare || !!horror.antiJumpscare;
  const horrorEnabled = horror.enabled !== false;
  const threeD = !!ctx.mode3D;
  const profile = threeD ? s.profile3D : s.profile2D;
  const mode = ctx.modeId && s.perMode[ctx.modeId] ? s.perMode[ctx.modeId] : null;
  const effectsScale = anti ? 'reduced' : profile.effects;
  const overrides = [];
  if (anti) overrides.push({ setting: 'antiJumpscare', overriddenBy: 'accessibility', reason: 'Startling presentation removed; atmosphere kept.' });
  if (horror.antiJumpscare) overrides.push({ setting: 'dread.profile2D.effects', overriddenBy: 'horror.antiJumpscare', reason: 'Comfort mode reduces effects.' });
  if (mode) overrides.push({ setting: 'eventFrequency', overriddenBy: `mode:${ctx.modeId}`, reason: 'Per-mode settings win over global frequency.' });
  if (horror.enabled === false) overrides.push({ setting: 'dread.enabled', overriddenBy: 'horror.enabled', reason: 'Scary Mode off disables the Dread layer.' });

  return {
    enabled: s.enabled && horrorEnabled,
    antiJumpscare: anti,
    activeProfile: threeD ? '3D' : '2D',
    profile2D: { ...s.profile2D },
    profile3D: { ...s.profile3D },
    atmosphere: {
      darkness: clamp((threeD ? s.profile3D.darkness : s.profile2D.darkness) + s.darknessAdd, 0, 140),
      fog: clamp((threeD ? s.profile3D.fog : s.profile2D.fog) + s.fogAdd, 0, 140),
      ambience: Math.round(s.ambientIntensity * (anti ? 0.7 : 1)),
      movement: s.environmentMovement && !anti,
      lighting: s.unusualLighting && !anti,
      silhouettes: s.silhouetteEvents,
      effects: effectsScale,
    },
    events: {
      enabled: s.environmentEvents && !(mode && mode.eventFrequency === 'off'),
      frequency: mode?.eventFrequency || s.eventFrequency,
      perEvent: { ...s.perEventFrequency },
      maxConcurrent: s.maxConcurrentEvents,
      repeatProtection: s.eventRepeatProtection,
      duringBoss: !s.disableDuringBoss,
    },
    enemies: {
      detection: s.enemyDetection,
      memory: s.enemyMemory,
      scares: { ...s.enemyScares },
      active: UNNATURAL_IDS.filter((id) => s.enemyScares[id]),
    },
    boss: {
      presentation: s.bossHorror && !anti,
      tells: s.bossTells === 'clear' ? 'clear' : 'standard',
      cinematics: s.bossCinematics && !anti,
    },
    awareness: {
      enabled: s.awarenessEnabled,
      sensitivity: s.awarenessSensitivity,
      assist: s.awarenessAssist,
    },
    accessibility: {
      antiJumpscare: anti,
      startlingSuppressed: anti,
      controlPreserved: true,
      rewardsUnaffected: true,
      mode: ctx.antiJumpscareMode || (anti ? 'comfort' : 'full'),
    },
    overrides,
    cleanup: ['atmosphere.darkness', 'atmosphere.fog', 'atmosphere.movement', 'atmosphere.lighting', 'events.maxConcurrent', 'boss.cinematics'],
  };
}

/* ══════════════════════ 10. controller ══════════════════════ */

/**
 * Session controller that owns the modules instead of one giant script:
 * environment, event director, awareness, bosses and journal. `stop()` restores
 * every temporary override and cancels every active event.
 */
export class ScaryModeController {
  constructor(options = {}) {
    this.horror = options.horror || {};
    this.settings = sanitizeDreadSettings(options.settings);
    this.settings.antiJumpscare = !!this.horror.antiJumpscare || this.settings.antiJumpscare;
    this.events = new DreadEventDirector(this.settings, { seed: options.seed ?? 71 });
    this.awareness = new AwarenessManager({
      config: { enabled: this.settings.awarenessEnabled, ...(options.awareness || {}) },
    });
    this.bosses = new DreadBossManager();
    this.journal = new DreadJournal(options.journal);
    this.environmentId = null;
    this.session = null;
    this.overrides = new Map();
    this.tickCount = 0;
  }

  configure(settings = {}, horror = this.horror) {
    this.horror = horror || this.horror;
    this.settings = sanitizeDreadSettings({ ...this.settings, ...settings });
    this.settings.antiJumpscare = !!this.horror.antiJumpscare || this.settings.antiJumpscare;
    this.events.configure(this.settings);
    this.awareness.setEnabled(this.settings.awarenessEnabled);
    return this.presentation();
  }

  presentation(mode3D = false) {
    return resolveDreadPresentation(this.settings, this.horror, { mode3D });
  }

  start(options = {}) {
    this.session = {
      modeId: options.modeId || null,
      environmentId: options.environmentId || null,
      startedAt: 0,
      endedAt: null,
      reason: options.reason || 'manual',
    };
    if (options.environmentId) this.enterEnvironment(options.environmentId);
    return this.snapshot();
  }

  enterEnvironment(id) {
    const env = DREAD_ENVIRONMENTS[id];
    if (!env) return null;
    this.environmentId = id;
    this.journal.completeArea(id);
    this.applyOverride('environment', id, null);
    return { ...env, room: dreadRoom(id) };
  }

  applyOverride(key, value, restore) {
    if (!this.overrides.has(key)) this.overrides.set(key, { previous: restore ?? null });
    this.overrides.get(key).value = value;
    return this.overrides.get(key);
  }

  /** Stops the session and restores every temporary override. */
  stop(reason = 'manual') {
    const cancelled = this.events.active.map((entry) => entry.id);
    for (const id of cancelled) this.events.cancel(id, reason);
    this.overrides.clear();
    this.bosses.closeAll(reason);
    if (this.session) {
      this.session.endedAt = this.tickCount;
      this.session.stoppedBecause = reason;
    }
    return { cancelled, session: this.session ? { ...this.session } : null };
  }

  tick(dt, ctx = {}) {
    if (!Number.isFinite(dt) || dt <= 0) return this.snapshot();
    this.tickCount += 1;
    this.events.update(dt, ctx);
    this.awareness.tick(dt);
    this.bosses.tick(dt);
    for (const change of this.events.drain()) {
      if (change.phase !== 'outcome') continue;
      if (change.outcome?.kind === 'journal') this.awareness.addEvent();
      if (change.outcome?.kind === 'mirror') this.journal.recordChallenge('mirror_outcome');
      if (change.outcome?.kind === 'encounter') this.awareness.addEncounter();
    }
    return this.snapshot();
  }

  completeMode(modeId, state = {}) {
    const progress = dreadModeProgress(modeId, state);
    if (!progress || !progress.complete) return { ok: false, progress };
    const first = this.journal.recordMode(modeId);
    if (first) this.journal.grantRewards();
    return { ok: true, first, progress, reward: DREAD_MODES[modeId].reward };
  }

  grantAchievementRewards() {
    return this.journal.grantRewards();
  }

  snapshot() {
    return {
      session: this.session ? { ...this.session } : null,
      environmentId: this.environmentId,
      settings: { ...this.settings },
      events: this.events.snapshot(),
      awareness: this.awareness.snapshot(),
      bosses: this.bosses.snapshot(),
      journal: this.journal.progress(),
      overrides: [...this.overrides.keys()],
      presentation: resolveDreadPresentation(this.settings, this.horror),
    };
  }
}

export function dreadSummary(settings = {}, journal = null) {
  const s = sanitizeDreadSettings(settings);
  return {
    enabled: !!s.enabled,
    environments: DREAD_ENVIRONMENT_IDS.length,
    enemies: UNNATURAL_IDS.length,
    events: PSYCHOLOGICAL_EVENT_IDS.length,
    bosses: DREAD_BOSS_IDS.length,
    modes: DREAD_MODE_IDS.length,
    equipment: DREAD_EQUIPMENT_IDS.length,
    awareness: !!s.awarenessEnabled,
    journal: journal ? journal.progress() : null,
  };
}
