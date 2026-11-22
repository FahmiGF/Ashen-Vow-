// Ashen Vow — Update X: Scary Mode.
// Optional, off by default, and presentation-only. A scare is requested by a
// *confirmed* player hit from the combat system; this module never applies
// damage, never blocks input, and never fires while a menu, dialogue, cinematic
// or loading screen is running.
//
// The director is pure/deterministic so the whole feature is testable in Node.

export const SCARE_INTENSITY = Object.freeze({
  mild: {
    id: 'mild', label: 'Mild', duration: 0.55, shake: 0.25, scale: 0.72, gain: 0.7, distortion: 0.25, flash: 0.12,
  },
  standard: {
    id: 'standard', label: 'Standard', duration: 0.9, shake: 0.45, scale: 1, gain: 1, distortion: 0.5, flash: 0.25,
  },
  intense: {
    id: 'intense', label: 'Intense', duration: 1.35, shake: 0.72, scale: 1.22, gain: 1.15, distortion: 0.8, flash: 0.4,
  },
});

export const SCARE_FREQUENCY = Object.freeze({
  low: { id: 'low', label: 'Low', chance: 0.22 },
  medium: { id: 'medium', label: 'Medium', chance: 0.45 },
  high: { id: 'high', label: 'High', chance: 0.75 },
});

export const SCARE_DEFAULTS = Object.freeze({
  enabled: false,
  intensity: 'standard',
  frequency: 'medium',
  screenEffects: 'full',
  suddenAudio: 'full',
  cameraShake: 'full',
  surpriseEvents: true,
  ambience: false,
  warnings: true,
  cooldown: 12,
  notifications: true,
});

export const SCARE_OPTIONS = Object.freeze({
  intensity: Object.values(SCARE_INTENSITY).map((entry) => ({ id: entry.id, label: entry.label })),
  frequency: Object.values(SCARE_FREQUENCY).map((entry) => ({ id: entry.id, label: entry.label })),
  level3: [
    { id: 'off', label: 'Off' },
    { id: 'reduced', label: 'Reduced' },
    { id: 'full', label: 'Full' },
  ],
});

/**
 * Per-family scare presentations. Every family gets its own silhouette, colour,
 * sting and subtitle line instead of a single reused image.
 */
export const SCARE_PROFILES = Object.freeze({
  crawler: {
    label: 'Crawler',
    portrait: 'swarm',
    color: '#c9a06a',
    motion: 'lunge-zoom',
    sting: { type: 'noise', freq: 1500, sweepTo: 180, dur: 0.5, gain: 0.16 },
    line: 'Sesuatu merangkak di kegelapan.',
  },
  sentinel: {
    label: 'Undead Knight',
    portrait: 'helmet',
    color: '#d8cfa8',
    motion: 'helmet-reveal',
    sting: { type: 'metal', freq: 320, sweepTo: 90, dur: 0.7, gain: 0.18 },
    line: 'Besi berderit. Helm itu menatapmu.',
  },
  wraith: {
    label: 'Wraith',
    portrait: 'spectral',
    color: '#9fd8ff',
    motion: 'spectral-fade',
    sting: { type: 'sine', freq: 620, sweepTo: 110, dur: 1.1, gain: 0.12 },
    line: 'Arwah itu menembus dinding jiwamu.',
  },
  brute: {
    label: 'Cinder Brute',
    portrait: 'golem',
    color: '#ff8a4a',
    motion: 'golem-step',
    sting: { type: 'sawtooth', freq: 90, sweepTo: 40, dur: 0.9, gain: 0.2 },
    line: 'Bara bergerak. Lantai bergetar.',
  },
  sporeling: {
    label: 'Sporeling',
    portrait: 'bloom',
    color: '#b07be8',
    motion: 'spore-burst',
    sting: { type: 'noise', freq: 2400, sweepTo: 520, dur: 0.35, gain: 0.1 },
    line: 'Spora memenuhi udara. Kau menahan napas.',
  },
  stalker: {
    label: 'Shadow Stalker',
    portrait: 'silhouette',
    color: '#7d6bd6',
    motion: 'silhouette-blink',
    sting: { type: 'noise', freq: 900, sweepTo: 120, dur: 0.45, gain: 0.14 },
    line: 'Siluet itu sudah ada di belakangmu.',
  },
  broodmother: {
    label: 'Brood Mother',
    portrait: 'nest',
    color: '#c982ff',
    motion: 'nest-open',
    sting: { type: 'sawtooth', freq: 130, sweepTo: 55, dur: 0.8, gain: 0.15 },
    line: 'Sarang itu terbuka. Ia menghitung anaknya.',
  },
  boss: {
    label: 'Boss',
    portrait: 'crown',
    color: '#ff5c4a',
    motion: 'boss-tower',
    sting: { type: 'metal', freq: 70, sweepTo: 35, dur: 1.4, gain: 0.24 },
    line: 'Kehadirannya menekan seluruh ruangan.',
  },
  boss_warden: {
    label: 'The Fallen Warden', portrait: 'helmet', color: '#e8d9b0', motion: 'helmet-reveal',
    sting: { type: 'metal', freq: 260, sweepTo: 70, dur: 1.0, gain: 0.2 }, line: 'Sumpahnya belum selesai.',
  },
  boss_wyrm: {
    label: 'The Ashen Wyrm', portrait: 'dragon', color: '#ff9a3d', motion: 'jaw-reveal',
    sting: { type: 'sawtooth', freq: 110, sweepTo: 40, dur: 1.3, gain: 0.22 }, line: 'Sisik bara terbuka.',
  },
  boss_choir: {
    label: 'The Hollow Choir', portrait: 'spectral', color: '#bcd4ff', motion: 'choir-surround',
    sting: { type: 'sine', freq: 520, sweepTo: 220, dur: 1.6, gain: 0.14 }, line: 'Suara itu datang dari dalam kepalamu.',
  },
  boss_oathbreaker: {
    label: 'The Oathbreaker', portrait: 'crown', color: '#ff4f3f', motion: 'boss-tower',
    sting: { type: 'metal', freq: 60, sweepTo: 28, dur: 1.8, gain: 0.26 }, line: 'Kau mendengar sumpah itu patah.',
  },
  boss_sporebound: {
    label: 'The Sporebound', portrait: 'nest', color: '#c982ff', motion: 'nest-open',
    sting: { type: 'noise', freq: 700, sweepTo: 90, dur: 1.2, gain: 0.18 }, line: 'Akar itu bernapas.',
  },
  boss_root: {
    label: 'Root of the First Vow', portrait: 'nest', color: '#8fd08f', motion: 'root-crawl',
    sting: { type: 'sawtooth', freq: 95, sweepTo: 45, dur: 1.0, gain: 0.16 }, line: 'Akar pertama mengingat namamu.',
  },
  unknown: {
    label: 'Something',
    portrait: 'silhouette',
    color: '#c9c2b4',
    motion: 'silhouette-blink',
    sting: { type: 'noise', freq: 1200, sweepTo: 200, dur: 0.5, gain: 0.12 },
    line: 'Kau tidak sendirian.',
  },
});

const LEVEL3 = new Set(['off', 'reduced', 'full']);
const INTENSITY_IDS = new Set(Object.keys(SCARE_INTENSITY));
const FREQUENCY_IDS = new Set(Object.keys(SCARE_FREQUENCY));

function clamp(value, lo, hi) {
  return value < lo ? lo : value > hi ? hi : value;
}

function seededRandom(seed) {
  let state = (Number(seed) || 1) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/** Resolve the presentation profile for a hit source. */
export function scareProfileFor(source = {}) {
  const kind = source.bossKind || source.kind;
  if (kind && SCARE_PROFILES[`boss_${kind}`]) return SCARE_PROFILES[`boss_${kind}`];
  const family = source.family || source.ai || source.type;
  if (family && SCARE_PROFILES[`boss_${family}`]) return SCARE_PROFILES[`boss_${family}`];
  return SCARE_PROFILES[family] || (source.boss ? SCARE_PROFILES.boss : SCARE_PROFILES.unknown);
}

export function sanitizeScarySettings(raw = {}) {
  const merged = { ...SCARE_DEFAULTS, ...(raw && typeof raw === 'object' ? raw : {}) };
  const cooldown = Number(merged.cooldown);
  return {
    enabled: !!merged.enabled,
    intensity: INTENSITY_IDS.has(merged.intensity) ? merged.intensity : SCARE_DEFAULTS.intensity,
    frequency: FREQUENCY_IDS.has(merged.frequency) ? merged.frequency : SCARE_DEFAULTS.frequency,
    screenEffects: LEVEL3.has(merged.screenEffects) ? merged.screenEffects : SCARE_DEFAULTS.screenEffects,
    suddenAudio: LEVEL3.has(merged.suddenAudio) ? merged.suddenAudio : SCARE_DEFAULTS.suddenAudio,
    cameraShake: LEVEL3.has(merged.cameraShake) ? merged.cameraShake : SCARE_DEFAULTS.cameraShake,
    surpriseEvents: merged.surpriseEvents !== false,
    ambience: !!merged.ambience,
    warnings: merged.warnings !== false,
    cooldown: Number.isFinite(cooldown) ? clamp(Math.round(cooldown), 2, 120) : SCARE_DEFAULTS.cooldown,
    notifications: merged.notifications !== false,
  };
}

/** Reasons a scare may be skipped. Exported so tests are explicit. */
export const SCARE_BLOCKERS = Object.freeze({
  DISABLED: 'disabled',
  COOLDOWN: 'cooldown',
  MENU: 'menu',
  LOADING: 'loading',
  CINEMATIC: 'cinematic',
  DEAD: 'dead',
  NO_HIT: 'no-hit',
  ROLL: 'roll',
  SAVED_BY_ACCESSIBILITY: 'silent-presentation',
});

/**
 * Scare director. `onPlayerHit` is the only entry point; it is called by the
 * browser shell after the simulation has already applied damage.
 */
export class ScareDirector {
  constructor(settings = {}, options = {}) {
    this.settings = sanitizeScarySettings(settings);
    this.rng = seededRandom(options.seed ?? 1337);
    this.clock = 0;
    this.cooldown = 0;
    this.effect = null;
    this.lastEffect = null;
    this.lastBlocked = null;
    this.count = 0;
    this.previewCount = 0;
    this.accessibility = options.accessibility || {};
    this.history = [];
  }

  configure(scarySettings = {}, accessibility = null) {
    this.settings = sanitizeScarySettings({ ...this.settings, ...(scarySettings || {}) });
    if (accessibility) this.accessibility = { ...this.accessibility, ...accessibility };
    return this.settings;
  }

  setAccessibility(accessibility = {}) {
    this.accessibility = { ...this.accessibility, ...(accessibility || {}) };
    return this;
  }

  /** Check whether a scare is allowed right now. */
  evaluate(context = {}) {
    if (!this.settings.enabled && !context.preview) return SCARE_BLOCKERS.DISABLED;
    if (context.dead || context.hp === 0) return SCARE_BLOCKERS.DEAD;
    if (context.menu || context.paused || context.uiOpen) return SCARE_BLOCKERS.MENU;
    if (context.loading) return SCARE_BLOCKERS.LOADING;
    if (context.cinematic || context.dialogue || context.cutscene) return SCARE_BLOCKERS.CINEMATIC;
    if (!context.preview && this.cooldown > 0) return SCARE_BLOCKERS.COOLDOWN;
    if (!context.hit) return SCARE_BLOCKERS.NO_HIT;
    return null;
  }

  /** True when the visual/audio layers should stay completely silent. */
  isSilent() {
    return this.settings.screenEffects === 'off'
      && this.settings.suddenAudio === 'off'
      && this.settings.cameraShake === 'off';
  }

  /**
   * Request a scare for a confirmed hit.
   * @param {object} hit { source:{type,family,bossKind,kind}, x, y, damage }
   * @param {object} context { difficulty, hp, menu, paused, uiOpen, loading, cinematic, dialogue, preview, force }
   * @returns {object|null} presentation effect — never contains damage.
   */
  onPlayerHit(hit = {}, context = {}) {
    const blocked = this.evaluate({ ...context, hit: true });
    if (blocked) {
      this.lastBlocked = { reason: blocked, at: this.clock };
      return null;
    }
    const profile = scareProfileFor(hit.source || {});
    const intensity = SCARE_INTENSITY[this.settings.intensity] || SCARE_INTENSITY.standard;
    const frequency = SCARE_FREQUENCY[this.settings.frequency] || SCARE_FREQUENCY.medium;
    const roll = this.rng();
    if (!context.preview && !context.force && roll > frequency.chance * (context.difficultyMul ?? 1)) {
      this.lastBlocked = { reason: SCARE_BLOCKERS.ROLL, at: this.clock, roll };
      return null;
    }

    const accessibility = this.accessibility || {};
    const reduceMotion = !!accessibility.reduceCameraMotion;
    const reduceShake = !!accessibility.reduceShake || reduceMotion;
    const reduceFlash = !!accessibility.reduceFlashing;

    const screenLevel = this.settings.screenEffects === 'off' ? 0 : this.settings.screenEffects === 'reduced' ? 0.5 : 1;
    const audioLevel = this.settings.suddenAudio === 'off' ? 0 : this.settings.suddenAudio === 'reduced' ? 0.55 : 1;
    const shakeLevel = this.settings.cameraShake === 'off' ? 0 : this.settings.cameraShake === 'reduced' ? 0.5 : 1;

    let shake = intensity.shake * shakeLevel;
    if (reduceShake) shake *= 0.2;
    let gain = profile.sting.gain * intensity.gain * audioLevel;
    if (accessibility.reduceLoudSfx) gain = Math.min(gain, 0.08);
    let flash = intensity.flash * screenLevel;
    if (reduceFlash) flash = 0;
    let distortion = intensity.distortion * screenLevel;
    if (reduceMotion) distortion *= 0.15;

    const effect = {
      kind: 'jumpscare',
      id: `scare_${this.count + 1}`,
      preview: !!context.preview,
      source: {
        type: hit.source?.type || 'unknown',
        name: hit.source?.name || profile.label,
        family: hit.source?.family || hit.source?.type || 'unknown',
        boss: !!hit.source?.boss,
        x: Number(hit.x) || 0,
        y: Number(hit.y) || 0,
      },
      profile: {
        label: profile.label,
        portrait: profile.portrait,
        color: profile.color,
        motion: profile.motion,
        line: profile.line,
      },
      duration: intensity.duration * (this.settings.intensity === 'mild' ? 0.85 : 1),
      elapsed: 0,
      intensity: intensity.id,
      shake,
      gain,
      flash,
      distortion,
      chromatic: this.settings.screenEffects === 'full' && !reduceMotion ? intensity.distortion * 0.6 : 0,
      motion: reduceMotion ? 'still' : profile.motion,
      audio: {
        type: profile.sting.type,
        freq: profile.sting.freq,
        sweepTo: profile.sting.sweepTo,
        dur: profile.sting.dur,
        gain,
        muted: gain <= 0,
      },
      accessibility: {
        reducedMotion: reduceMotion,
        reducedShake: reduceShake,
        reducedFlashing: reduceFlash,
        silent: this.isSilent(),
      },
      // Hard guarantee: the presentation layer never carries damage.
      damage: 0,
      blocksInput: false,
    };

    this.cooldown = this.settings.cooldown;
    this.count += 1;
    this.effect = effect;
    this.lastEffect = effect;
    this.history.push({ at: Number(this.clock.toFixed(2)), type: effect.source.type, intensity: effect.intensity });
    if (this.history.length > 20) this.history.shift();
    return effect;
  }

  /** Demonstrate the effect from the settings screen without combat. */
  preview(source = { type: 'sentinel' }) {
    this.previewCount += 1;
    return this.onPlayerHit({ source, x: 0, y: 0, damage: 0 }, { preview: true, force: true });
  }

  /** Advance timers. Returns the active effect (or null when finished). */
  tick(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return this.effect;
    this.clock += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.effect) {
      this.effect.elapsed += dt;
      if (this.effect.elapsed >= this.effect.duration) {
        this.effect = null;
      }
    }
    return this.effect;
  }

  get active() {
    return this.effect;
  }

  /** Camera offset for the active effect (0 when none). */
  cameraKick() {
    if (!this.effect) return { x: 0, y: 0, zoom: 1 };
    const progress = clamp(this.effect.elapsed / this.effect.duration, 0, 1);
    const falloff = 1 - progress;
    const wave = Math.sin(progress * Math.PI * 6);
    return {
      x: wave * this.effect.shake * 10 * falloff,
      y: Math.cos(progress * Math.PI * 4) * this.effect.shake * 6 * falloff,
      zoom: 1 + this.effect.shake * 0.04 * falloff,
    };
  }

  snapshot() {
    return {
      enabled: this.settings.enabled,
      intensity: this.settings.intensity,
      frequency: this.settings.frequency,
      cooldown: Number(this.cooldown.toFixed(2)),
      activeState: this.effect ? 'playing' : 'idle',
      triggerSource: this.effect?.source?.type || this.lastEffect?.source?.type || null,
      presentation: this.effect?.profile?.motion || null,
      eligibility: this.lastBlocked?.reason || 'ready',
      count: this.count,
      previews: this.previewCount,
      audio: this.effect?.audio?.muted === false ? 'audible' : 'silent',
      accessibility: {
        reducedMotion: !!this.accessibility.reduceCameraMotion,
        reducedShake: !!this.accessibility.reduceShake,
        reducedFlashing: !!this.accessibility.reduceFlashing,
        reducedLoudSfx: !!this.accessibility.reduceLoudSfx,
      },
      history: this.history.slice(-6),
    };
  }
}

/** Convenience for tests/UI: does this configuration permit any scare? */
export function scaryModeActive(settings = {}) {
  return sanitizeScarySettings(settings).enabled;
}
