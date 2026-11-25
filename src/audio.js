// Procedural WebAudio SFX — no audio files required.
export class SoundKit {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.music = null;
    this.sfx = null;
    this.ambient = null;
    this.buses = {};
    this.muted = false;
    this.noiseBuffer = null;
    this.channels = {
      master: 0.8, music: 0.55, sfx: 0.8, ambient: 0.55, dialogue: 0.85, combat: 0.75,
      ui: 0.65, footsteps: 0.55, voiceChat: 0.7, cinematic: 0.8,
    };
    this.mutedChannels = { dialogue: false, voiceChat: false };
    this.dynamicRange = 'normal';
  }

  /** Build the audio graph early without resuming it (no user gesture needed). */
  prewarm() {
    if (this.ctx) return;
    this.init();
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.channels.master;
      this.master.connect(this.ctx.destination);
      this.music = this.ctx.createGain();
      this.music.gain.value = this.channels.music;
      this.music.connect(this.master);
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = this.channels.sfx;
      this.sfx.connect(this.master);
      for (const id of ['ambient', 'dialogue', 'combat', 'ui', 'footsteps', 'voiceChat', 'cinematic']) {
        const bus = this.ctx.createGain();
        bus.gain.value = this.channels[id];
        bus.connect(this.master);
        this.buses[id] = bus;
      }
      this.noiseBuffer = this.makeNoise();
      this.startAmbient();
    } catch {
      this.ctx = null;
    }
  }

  // Applies the Settings audio panel. Master is a 0..1 gain, music/SFX are
  // independent child buses so the HUD mute never destroys their levels.
  applyVolumes(values = {}) {
    const { muted, channelMutes, dynamicRange, reduceLoudSfx, ...levels } = values;
    for (const [key, value] of Object.entries(levels)) {
      if (this.channels[key] !== undefined && value !== undefined) {
        this.channels[key] = Math.max(0, Math.min(1, Number(value) || 0));
      }
    }
    if (muted !== undefined) this.muted = Boolean(muted);
    if (channelMutes) this.mutedChannels = { ...this.mutedChannels, ...channelMutes };
    if (dynamicRange) this.dynamicRange = dynamicRange;
    if (reduceLoudSfx !== undefined) this.reduceLoudSfx = Boolean(reduceLoudSfx);
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const ramp = (node, target) => {
      if (!node) return;
      node.gain.cancelScheduledValues(now);
      node.gain.linearRampToValueAtTime(target, now + 0.12);
    };
    ramp(this.master, this.muted ? 0 : this.channels.master);
    ramp(this.music, this.channels.music);
    ramp(this.sfx, this.channels.sfx);
    for (const [id, bus] of Object.entries(this.buses)) ramp(bus, this.mutedChannels[id] ? 0 : this.channels[id]);
  }

  // ── spatial audio ─────────────────────────────────────────────────────
  // `stereo` keeps the existing non-positional mix. `surround` and `spatial`
  // install a WebAudio listener and route positioned effects through per-sound
  // PannerNodes (HRTF for `spatial`). This is real binaural panning, not a
  // volume trick.
  setSpatial(mode = 'stereo') {
    this.spatialMode = ['stereo', 'surround', 'spatial'].includes(mode) ? mode : 'stereo';
    if (!this.ctx) return this.spatialMode;
    if (this.spatialMode !== 'stereo' && !this.listenerReady) {
      const listener = this.ctx.listener;
      if (listener.positionX) {
        listener.positionX.value = 0;
        listener.positionY.value = 0;
        listener.positionZ.value = 0;
        listener.forwardX.value = 0;
        listener.forwardY.value = 0;
        listener.forwardZ.value = -1;
        listener.upX.value = 0;
        listener.upY.value = 1;
        listener.upZ.value = 0;
      } else if (listener.setPosition) {
        listener.setPosition(0, 0, 0);
        listener.setOrientation(0, 0, -1, 0, 1, 0);
      }
      this.listenerReady = true;
    }
    return this.spatialMode;
  }

  setListener(position = { x: 0, y: 0, z: 0 }, forward = { x: 0, y: 0, z: -1 }) {
    if (!this.ctx || this.spatialMode === 'stereo') return;
    const listener = this.ctx.listener;
    if (listener.positionX) {
      const now = this.ctx.currentTime;
      listener.positionX.setTargetAtTime(position.x || 0, now, 0.02);
      listener.positionY.setTargetAtTime(position.y || 0, now, 0.02);
      listener.positionZ.setTargetAtTime(position.z || 0, now, 0.02);
      listener.forwardX.setTargetAtTime(forward.x || 0, now, 0.02);
      listener.forwardY.setTargetAtTime(forward.y || 0, now, 0.02);
      listener.forwardZ.setTargetAtTime(forward.z || -1, now, 0.02);
      listener.upX.value = 0;
      listener.upY.value = 1;
      listener.upZ.value = 0;
    } else if (listener.setPosition) {
      listener.setPosition(position.x || 0, position.y || 0, position.z || 0);
      listener.setOrientation(forward.x || 0, forward.y || 0, forward.z || -1, 0, 1, 0);
    }
  }

  createPanner(at = {}) {
    if (!this.ctx || !this.ctx.createPanner) return null;
    const panner = this.ctx.createPanner();
    panner.panningModel = this.spatialMode === 'spatial' ? 'HRTF' : 'equalpower';
    panner.distanceModel = 'inverse';
    panner.refDistance = 80;
    panner.maxDistance = 1400;
    panner.rolloffFactor = 1.1;
    if (panner.positionX) {
      panner.positionX.value = at.x || 0;
      panner.positionY.value = at.y || 0;
      panner.positionZ.value = at.z || 0;
    } else if (panner.setPosition) {
      panner.setPosition(at.x || 0, at.y || 0, at.z || 0);
    }
    panner.connect(this.sfx || this.master);
    return panner;
  }

  // Plays an effect at a world position. The existing non-positional `play()`
  // path is untouched; this swaps the SFX destination for a PannerNode so every
  // tone/noise inside the event is binaurally positioned.
  playAt(event, at = null) {
    if (!at || this.spatialMode === 'stereo') return this.play(event);
    this.init();
    if (!this.ctx) return undefined;
    const panner = this.createPanner(at);
    if (!panner) return this.play(event);
    const previous = this.sfx;
    this.sfx = panner;
    try {
      this.play(event);
    } finally {
      this.sfx = previous;
    }
    setTimeout(() => {
      try {
        panner.disconnect();
      } catch {
        /* already disconnected */
      }
    }, 2500);
    return undefined;
  }

  busFor(kind = 'sfx') {
    return this.buses?.[kind] || (kind === 'music' ? this.music : this.sfx) || this.master;
  }

  testTone(kind = 'master') {
    this.init();
    if (!this.ctx) return false;
    const bus = kind === 'master' ? this.master : this.busFor(kind);
    if (!bus) return false;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc.connect(gain).connect(bus);
    osc.start(now);
    osc.stop(now + 0.5);
    return true;
  }

  makeNoise() {
    const len = Math.floor(this.ctx.sampleRate * 1.5);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  startAmbient() {
    if (!this.ctx || this.ambient) return;
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.value = 0.0;
    g.connect(this.busFor('ambient'));
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 240;
    filter.Q.value = 2;
    filter.connect(g);

    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = 55;
    const o2 = ctx.createOscillator();
    o2.type = 'sawtooth';
    o2.frequency.value = 55 * 1.5;
    o2.detune.value = -9;
    const o2g = ctx.createGain();
    o2g.gain.value = 0.22;
    o2.connect(o2g).connect(filter);
    o1.connect(filter);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.018;
    lfo.connect(lfoGain).connect(g.gain);

    o1.start();
    o2.start();
    lfo.start();
    g.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 3);
    this.ambient = { g, o1, o2, lfo };
  }

  // Low, slow prologue score. Kept separate so gameplay ambience can keep running.
  startPrologue() {
    this.init();
    if (!this.ctx || this.prologue) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.connect(this.busFor('cinematic'));
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.linearRampToValueAtTime(620, now + 30);
    filter.Q.value = 1.2;
    filter.connect(g);

    const oscs = [];
    const freqs = [
      [73.42, 'sine', 0.9],
      [110, 'triangle', 0.5],
      [146.83, 'sawtooth', 0.18],
      [220, 'sine', 0.12],
    ];
    for (const [freq, type, level] of freqs) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 8;
      const og = ctx.createGain();
      og.gain.value = level;
      osc.connect(og).connect(filter);
      osc.start();
      oscs.push(osc);
    }
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain).connect(g.gain);
    lfo.start();
    g.gain.linearRampToValueAtTime(0.055, now + 2.5);
    this.prologue = { g, filter, oscs, lfo };
  }

  prologueBeat(index) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    if (this.prologue) {
      this.prologue.filter.frequency.cancelScheduledValues(now);
      this.prologue.filter.frequency.setValueAtTime(Math.min(620, 240 + index * 34), now);
      this.prologue.filter.frequency.linearRampToValueAtTime(Math.min(900, 320 + index * 42), now + 3.5);
    }
    this.tone({ freq: 146.83, to: 110, type: 'sine', dur: 2.4, gain: 0.03 });
    this.tone({ freq: 220, to: 164.81, type: 'triangle', dur: 2.8, gain: 0.016, delay: 0.25 });
  }

  stopPrologue() {
    if (!this.ctx || !this.prologue) return;
    const { g, oscs, lfo } = this.prologue;
    const now = this.ctx.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    this.prologue = null;
    setTimeout(() => {
      for (const osc of oscs) {
        try {
          osc.stop();
        } catch {
          /* already stopped */
        }
      }
      try {
        lfo.stop();
      } catch {
        /* already stopped */
      }
    }, 1000);
  }

  setMuted(m) {
    this.muted = m;
    if (this.muted) this.channels.master = this.channels.master || 0.8;
    if (this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.linearRampToValueAtTime(m ? 0 : this.channels.master, now + 0.15);
    }
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  tone({ freq = 300, to = null, type = 'sine', dur = 0.15, gain = 0.12, delay = 0, filter = null }) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0005, gain), t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = osc;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = filter.type || 'lowpass';
      f.frequency.value = filter.freq || 800;
      f.Q.value = filter.q || 1;
      node.connect(f);
      node = f;
    }
    node.connect(g).connect(this.sfx || this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise({ dur = 0.12, gain = 0.1, freq = 900, type = 'bandpass', q = 1, delay = 0, sweepTo = null }) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t0);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t0 + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(Math.max(0.0005, gain), t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.sfx || this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  /**
   * Scary Mode sting. Parameters come from the effect descriptor so the mix
   * already reflects intensity, sudden-audio level and accessibility caps.
   */
  playScare(effect) {
    if (!this.ctx || this.muted || !effect) return;
    const a = effect.audio || {};
    const gain = Number(a.gain);
    if (a.muted || !Number.isFinite(gain) || gain <= 0) return;
    const dur = Math.max(0.1, Number(a.dur) || 0.5);
    const freq = Math.max(30, Number(a.freq) || 400);
    const sweepTo = Math.max(20, Number(a.sweepTo) || 80);
    if (a.type === 'metal') {
      this.tone({ freq, to: sweepTo, type: 'square', dur, gain });
      this.noise({ dur: 0.14, gain: gain * 0.55, freq: 2400, type: 'highpass' });
    } else if (a.type === 'noise') {
      this.noise({ dur, gain, freq, sweepTo, type: 'bandpass', q: 1.1 });
    } else if (a.type === 'sine') {
      this.tone({ freq, to: sweepTo, type: 'sine', dur, gain });
      this.tone({ freq: freq * 1.5, to: sweepTo, type: 'triangle', dur: dur * 0.8, gain: gain * 0.4, delay: 0.05 });
    } else {
      this.tone({ freq, to: sweepTo, type: 'sawtooth', dur, gain });
    }
  }

  play(event) {
    if (!this.ctx || this.muted) return;
    const type = typeof event === 'string' ? event : event.type;
    switch (type) {
      case 'swing':
        this.noise({ dur: 0.12, gain: 0.09, freq: 2200, sweepTo: 500, type: 'bandpass', q: 0.8 });
        this.tone({ freq: 210, to: 90, type: 'sawtooth', dur: 0.09, gain: 0.045 });
        break;
      case 'hit':
      case 'bossHit':
        this.tone({ freq: 180, to: 62, type: 'square', dur: 0.1, gain: type === 'bossHit' ? 0.14 : 0.11 });
        this.noise({ dur: 0.07, gain: 0.1, freq: 1400, type: 'lowpass' });
        break;
      case 'enemyDown':
        this.noise({ dur: 0.3, gain: 0.12, freq: 700, sweepTo: 90, type: 'lowpass' });
        this.tone({ freq: 130, to: 55, type: 'sawtooth', dur: 0.28, gain: 0.08 });
        break;
      case 'playerHurt':
        this.tone({ freq: 190, to: 70, type: 'sawtooth', dur: 0.26, gain: 0.15 });
        this.noise({ dur: 0.18, gain: 0.1, freq: 500, type: 'lowpass' });
        break;
      case 'death':
        this.tone({ freq: 110, to: 32, type: 'sawtooth', dur: 1.4, gain: 0.16 });
        this.tone({ freq: 55, to: 24, type: 'sine', dur: 1.6, gain: 0.14, delay: 0.15 });
        this.noise({ dur: 1.1, gain: 0.08, freq: 400, sweepTo: 60, type: 'lowpass' });
        break;
      case 'jump':
        this.tone({ freq: 280, to: 460, type: 'triangle', dur: 0.12, gain: 0.05 });
        break;
      case 'doubleJump':
        this.tone({ freq: 380, to: 720, type: 'triangle', dur: 0.16, gain: 0.06 });
        this.noise({ dur: 0.16, gain: 0.05, freq: 1200, sweepTo: 2800, type: 'bandpass' });
        break;
      case 'dash':
        this.noise({ dur: 0.22, gain: 0.1, freq: 700, sweepTo: 3200, type: 'bandpass', q: 1.4 });
        break;
      case 'ability':
        this.noise({ dur: 0.28, gain: 0.12, freq: 1600, sweepTo: 380, type: 'bandpass', q: 1.2 });
        this.tone({ freq: 280, to: 720, type: 'sawtooth', dur: 0.22, gain: 0.09 });
        this.tone({ freq: 520, to: 1080, type: 'triangle', dur: 0.26, gain: 0.08, delay: 0.04 });
        break;
      case 'sparkle':
        this.tone({ freq: 880, to: 1760, type: 'sine', dur: 0.18, gain: 0.05 });
        this.tone({ freq: 1320, to: 2200, type: 'triangle', dur: 0.2, gain: 0.04, delay: 0.05 });
        break;
      case 'deflect':
        this.tone({ freq: 880, to: 1320, type: 'triangle', dur: 0.12, gain: 0.07 });
        break;
      case 'healStart':
        this.tone({ freq: 300, to: 420, type: 'sine', dur: 0.4, gain: 0.04 });
        break;
      case 'heal':
        [523, 659, 784].forEach((f, i) =>
          this.tone({ freq: f, type: 'sine', dur: 0.3, gain: 0.055, delay: i * 0.06 }),
        );
        break;
      case 'relic':
        [392, 523, 659, 880].forEach((f, i) =>
          this.tone({ freq: f, type: 'triangle', dur: 0.5, gain: 0.06, delay: i * 0.09 }),
        );
        break;
      case 'roomEnter':
      case 'gatePass':
        this.tone({ freq: 196, type: 'sine', dur: 0.7, gain: 0.05 });
        this.tone({ freq: 294, type: 'sine', dur: 0.7, gain: 0.04, delay: 0.1 });
        this.noise({ dur: 0.4, gain: 0.04, freq: 900, type: 'lowpass' });
        break;
      case 'bossSpawn':
        this.tone({ freq: 62, to: 48, type: 'sawtooth', dur: 1.2, gain: 0.16 });
        this.tone({ freq: 93, to: 55, type: 'sawtooth', dur: 1.1, gain: 0.08, delay: 0.1 });
        this.noise({ dur: 0.9, gain: 0.1, freq: 300, sweepTo: 120, type: 'lowpass' });
        break;
      case 'bossPhase':
        this.tone({ freq: 70, to: 110, type: 'sawtooth', dur: 0.7, gain: 0.16 });
        this.noise({ dur: 0.6, gain: 0.12, freq: 400, sweepTo: 2200, type: 'bandpass' });
        break;
      case 'bossDialogue':
        this.tone({ freq: 98, to: 74, type: 'sine', dur: 0.9, gain: 0.07 });
        this.tone({ freq: 147, to: 110, type: 'triangle', dur: 0.8, gain: 0.035, delay: 0.08 });
        break;
      case 'note':
        this.tone({ freq: 660, to: 880, type: 'sine', dur: 0.22, gain: 0.045 });
        break;
      case 'beam':
        this.tone({ freq: 55, to: 120, type: 'sawtooth', dur: 0.55, gain: 0.1 });
        this.noise({ dur: 0.5, gain: 0.07, freq: 500, sweepTo: 2600, type: 'bandpass' });
        break;
      case 'bossDie':
        this.tone({ freq: 140, to: 40, type: 'sawtooth', dur: 1.8, gain: 0.18 });
        this.noise({ dur: 1.6, gain: 0.14, freq: 1200, sweepTo: 90, type: 'lowpass' });
        break;
      case 'bossTelegraph':
        this.tone({ freq: 220, to: 260, type: 'square', dur: 0.12, gain: 0.035 });
        break;
      case 'bossSlash':
        this.noise({ dur: 0.2, gain: 0.12, freq: 1800, sweepTo: 400, type: 'bandpass' });
        break;
      case 'bossSlam':
        this.tone({ freq: 90, to: 30, type: 'sine', dur: 0.5, gain: 0.2 });
        this.noise({ dur: 0.45, gain: 0.14, freq: 500, sweepTo: 80, type: 'lowpass' });
        break;
      case 'shockwave':
        this.noise({ dur: 0.4, gain: 0.08, freq: 300, sweepTo: 90, type: 'lowpass' });
        break;
      case 'fireball':
        this.tone({ freq: 520, to: 180, type: 'sine', dur: 0.18, gain: 0.05 });
        break;
      case 'wyrmDive':
        this.noise({ dur: 0.5, gain: 0.11, freq: 300, sweepTo: 1800, type: 'bandpass' });
        break;
      case 'pillars':
        this.tone({ freq: 80, to: 50, type: 'sawtooth', dur: 0.6, gain: 0.1 });
        break;
      case 'enemyTelegraph':
        this.tone({ freq: 330, type: 'square', dur: 0.08, gain: 0.03 });
        break;
      case 'enemyLunge':
        this.noise({ dur: 0.16, gain: 0.06, freq: 1000, sweepTo: 400, type: 'bandpass' });
        break;
      case 'respawn':
        this.tone({ freq: 220, to: 120, type: 'sine', dur: 0.4, gain: 0.06 });
        break;
      case 'blessingOpen':
        [261, 329, 392, 523].forEach((f, i) =>
          this.tone({ freq: f, type: 'sine', dur: 1.4, gain: 0.045, delay: i * 0.12 }),
        );
        break;
      case 'blessingChosen':
        [392, 523, 659, 784, 1047].forEach((f, i) =>
          this.tone({ freq: f, type: 'triangle', dur: 0.8, gain: 0.06, delay: i * 0.07 }),
        );
        break;
      case 'victory':
        [261, 329, 392, 523, 659, 784].forEach((f, i) =>
          this.tone({ freq: f, type: 'sine', dur: 2.2, gain: 0.055, delay: i * 0.14 }),
        );
        break;
      case 'horrorSting':
        this.playScare({ audio: { type: 'metal', freq: 240, sweepTo: 42, dur: 1.5, gain: 0.15 } });
        this.noise({ dur: 0.8, gain: 0.1, freq: 1200, sweepTo: 90, type: 'lowpass' });
        break;
      case 'horrorWhisper':
        this.noise({ dur: 1.4, gain: 0.07, freq: 880, sweepTo: 260, type: 'bandpass', q: 2.4 });
        this.tone({ freq: 96, to: 58, type: 'sine', dur: 1.2, gain: 0.035 });
        break;
      case 'horrorHit':
        this.tone({ freq: 120, to: 38, type: 'sawtooth', dur: 0.45, gain: 0.16 });
        this.noise({ dur: 0.32, gain: 0.12, freq: 420, sweepTo: 70, type: 'lowpass' });
        break;
      case 'horrorSiteEnter':
        this.tone({ freq: 72, to: 48, type: 'sine', dur: 2.2, gain: 0.09 });
        this.noise({ dur: 1.8, gain: 0.05, freq: 500, sweepTo: 140, type: 'lowpass' });
        break;
      default:
        break;
    }
  }
}
