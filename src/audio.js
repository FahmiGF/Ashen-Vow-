// Procedural WebAudio SFX — no audio files required.
export class SoundKit {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambient = null;
    this.muted = false;
    this.noiseBuffer = null;
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
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      this.noiseBuffer = this.makeNoise();
      this.startAmbient();
    } catch {
      this.ctx = null;
    }
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
    g.connect(this.master);
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
    g.connect(this.master);
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
    if (this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.linearRampToValueAtTime(m ? 0 : 0.5, now + 0.15);
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
    node.connect(g).connect(this.master);
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
    src.connect(f).connect(g).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
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
      default:
        break;
    }
  }
}
