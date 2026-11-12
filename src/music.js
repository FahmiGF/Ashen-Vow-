// Ashen Vow — procedural music engine.
// Zero audio assets: every track is synthesised from oscillators and filtered
// noise. MusicManager owns its own gain bus, crossfades between tracks, and
// exposes an optional combat layer that fades in near enemies.
export const TRACKS = {
  menu: {
    id: 'menu',
    label: 'Menu — Solemn, hopeful',
    bpm: 60,
    root: 73.42,
    chord: [0, 7, 12, 19],
    arp: [0, 7, 12, 15, 12, 7, 3, 7],
    wave: 'sine',
    pad: 0.05,
    melody: 0.022,
    bass: true,
    drums: false,
    filter: 900,
    color: '#d07a35',
  },
  ashen: {
    id: 'ashen',
    label: 'Ashen Hall — Warm, haunted',
    bpm: 70,
    root: 110,
    chord: [0, 3, 7, 10],
    arp: [0, 3, 7, 10, 12, 10, 7, 3],
    wave: 'triangle',
    pad: 0.042,
    melody: 0.02,
    bass: true,
    drums: false,
    filter: 700,
    color: '#d07a35',
  },
  mycelial: {
    id: 'mycelial',
    label: 'Mycelial Hollow — Dreamy, eerie',
    bpm: 80,
    root: 98,
    chord: [0, 5, 7, 12],
    arp: [0, 5, 12, 15, 12, 7, 5, 2],
    wave: 'sine',
    pad: 0.046,
    melody: 0.024,
    bass: false,
    drums: false,
    filter: 1200,
    color: '#a86bd8',
  },
  cistern: {
    id: 'cistern',
    label: 'Tidewrought Cistern — Cold, echoing',
    bpm: 65,
    root: 82.41,
    chord: [0, 7, 10, 14],
    arp: [0, 10, 7, 12, 19, 12, 7, 10],
    wave: 'sine',
    pad: 0.04,
    melody: 0.02,
    bass: true,
    drums: false,
    filter: 600,
    color: '#3fa89a',
  },
  frostglass: {
    id: 'frostglass',
    label: 'Frostglass Cathedral — Majestic, fragile',
    bpm: 75,
    root: 130.81,
    chord: [0, 4, 7, 12],
    arp: [0, 4, 7, 12, 16, 12, 7, 4],
    wave: 'triangle',
    pad: 0.045,
    melody: 0.017,
    bass: false,
    drums: false,
    filter: 1600,
    color: '#7fc9e8',
  },
  cinder: {
    id: 'cinder',
    label: 'Cinder Maw — Heavy, urgent',
    bpm: 95,
    root: 73.42,
    chord: [0, 3, 7, 10],
    arp: [0, 0, 3, 7, 3, 10, 7, 3],
    wave: 'sawtooth',
    pad: 0.038,
    melody: 0.022,
    bass: true,
    drums: true,
    filter: 520,
    color: '#e0553b',
  },
  ashenwood: {
    id: 'ashenwood',
    label: 'Hutan Abu — Warm, watchful',
    bpm: 72,
    root: 110,
    chord: [0, 3, 7, 10],
    arp: [0, 3, 7, 10, 12, 10, 7, 3],
    wave: 'triangle',
    pad: 0.04,
    melody: 0.019,
    bass: true,
    drums: false,
    filter: 680,
    color: '#d07a35',
  },
  bonemarsh: {
    id: 'bonemarsh',
    label: 'Rawa Tulang — Murky, patient',
    bpm: 64,
    root: 98,
    chord: [0, 2, 7, 9],
    arp: [0, 2, 7, 9, 12, 9, 7, 2],
    wave: 'sine',
    pad: 0.045,
    melody: 0.016,
    bass: true,
    drums: false,
    filter: 520,
    color: '#8fae6a',
  },
  echocrater: {
    id: 'echocrater',
    label: 'Kawah Gema — Forge-hot, relentless',
    bpm: 104,
    root: 73.42,
    chord: [0, 3, 7, 10],
    arp: [0, 0, 3, 7, 3, 10, 7, 3],
    wave: 'sawtooth',
    pad: 0.036,
    melody: 0.024,
    bass: true,
    drums: true,
    filter: 500,
    color: '#e0553b',
  },
  buriedcity: {
    id: 'buriedcity',
    label: 'Kota Terkubur — Dusty, ceremonial',
    bpm: 68,
    root: 87.31,
    chord: [0, 4, 7, 11],
    arp: [0, 4, 7, 11, 14, 11, 7, 4],
    wave: 'triangle',
    pad: 0.042,
    melody: 0.018,
    bass: true,
    drums: false,
    filter: 760,
    color: '#c9a25c',
  },
  crystalcave: {
    id: 'crystalcave',
    label: 'Gua Kristal — Glassy, remembering',
    bpm: 78,
    root: 130.81,
    chord: [0, 5, 7, 12],
    arp: [0, 5, 12, 17, 19, 17, 12, 5],
    wave: 'sine',
    pad: 0.046,
    melody: 0.02,
    bass: false,
    drums: false,
    filter: 1800,
    color: '#7fc9e8',
  },
  stormexpanse: {
    id: 'stormexpanse',
    label: 'Padang Badai — Charged, restless',
    bpm: 112,
    root: 82.41,
    chord: [0, 2, 7, 10],
    arp: [0, 2, 7, 10, 14, 10, 7, 2],
    wave: 'sawtooth',
    pad: 0.038,
    melody: 0.023,
    bass: true,
    drums: true,
    filter: 700,
    color: '#6fa8dc',
  },
  roottemple: {
    id: 'roottemple',
    label: 'Kuil Akar — Breathing, ancient',
    bpm: 58,
    root: 92.5,
    chord: [0, 5, 7, 10],
    arp: [0, 5, 7, 10, 12, 10, 7, 5],
    wave: 'triangle',
    pad: 0.05,
    melody: 0.017,
    bass: true,
    drums: false,
    filter: 620,
    color: '#a86bd8',
  },
  mistsea: {
    id: 'mistsea',
    label: 'Lautan Kabut — Vast, mournful',
    bpm: 60,
    root: 116.54,
    chord: [0, 3, 7, 14],
    arp: [0, 3, 7, 14, 15, 14, 7, 3],
    wave: 'sine',
    pad: 0.048,
    melody: 0.016,
    bass: true,
    drums: false,
    filter: 560,
    color: '#8ba8a0',
  },
  clockwork: {
    id: 'clockwork',
    label: 'Menara Waktu — Ticking, inevitable',
    bpm: 120,
    root: 98,
    chord: [0, 4, 7, 10],
    arp: [0, 4, 7, 10, 12, 10, 7, 4],
    wave: 'square',
    pad: 0.032,
    melody: 0.02,
    bass: true,
    drums: true,
    filter: 900,
    color: '#d6ac66',
  },
  forgotten: {
    id: 'forgotten',
    label: 'Singgasana Terlupakan — Final, luminous',
    bpm: 54,
    root: 146.83,
    chord: [0, 4, 7, 11],
    arp: [0, 4, 7, 11, 12, 19, 24, 19],
    wave: 'sine',
    pad: 0.052,
    melody: 0.022,
    bass: true,
    drums: false,
    filter: 1400,
    color: '#e8b46a',
  },
  boss: {
    id: 'boss',
    label: 'Boss — Intense, rhythmic',
    bpm: 132,
    root: 82.41,
    chord: [0, 1, 7, 8],
    arp: [0, 1, 7, 8, 12, 8, 7, 1],
    wave: 'sawtooth',
    pad: 0.042,
    melody: 0.028,
    bass: true,
    drums: true,
    filter: 640,
    color: '#e0553b',
  },
  mycelialBoss: {
    id: 'mycelialBoss',
    label: 'Sporebound — Swarming, organic',
    bpm: 124,
    root: 87.31,
    chord: [0, 5, 6, 10],
    arp: [0, 5, 10, 12, 15, 12, 10, 6],
    wave: 'triangle',
    pad: 0.048,
    melody: 0.03,
    bass: true,
    drums: true,
    filter: 760,
    color: '#b07be8',
  },
  victory: {
    id: 'victory',
    label: 'Victory — Bittersweet',
    bpm: 55,
    root: 130.81,
    chord: [0, 4, 7, 11],
    arp: [0, 7, 12, 16, 19, 16, 12, 7],
    wave: 'sine',
    pad: 0.05,
    melody: 0.024,
    bass: true,
    drums: false,
    filter: 1100,
    color: '#e0b45f',
  },
};

export const TRACK_IDS = Object.keys(TRACKS);

export function trackForZone(zoneId) {
  return TRACKS[zoneId] || TRACKS.ashen;
}

export function isKnownTrack(trackId) {
  return Object.prototype.hasOwnProperty.call(TRACKS, trackId);
}

const semitone = (root, semis) => root * Math.pow(2, semis / 12);

export class MusicManager {
  constructor(kit) {
    this.kit = kit;
    this.bus = null;
    this.current = null;
    this.trackId = null;
    this.volume = 1;
    this.layerVolumes = { combat: 0 };
    this.enabled = true;
  }

  ensureBus() {
    if (!this.kit) return null;
    this.kit.init();
    const ctx = this.kit.ctx;
    if (!ctx) return null;
    if (!this.bus) {
      this.bus = ctx.createGain();
      this.bus.gain.value = this.volume;
      // If the SoundKit exposes a dedicated music bus, use it so Settings can
      // mix music independently from SFX. Otherwise fall back to master.
      const destination = this.kit.music || this.kit.master;
      if (destination) this.bus.connect(destination);
    }
    return ctx;
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, Number(value) || 0));
    if (this.bus && this.kit?.ctx) {
      const now = this.kit.ctx.currentTime;
      this.bus.gain.cancelScheduledValues(now);
      this.bus.gain.linearRampToValueAtTime(this.volume, now + 0.15);
    }
  }

  setLayer(name, volume, seconds = 0.8) {
    this.layerVolumes[name] = Math.max(0, Math.min(1, Number(volume) || 0));
    const track = this.current;
    if (!track?.layerGain || !this.kit?.ctx) return;
    const now = this.kit.ctx.currentTime;
    track.layerGain.gain.cancelScheduledValues(now);
    track.layerGain.gain.setValueAtTime(track.layerGain.gain.value, now);
    track.layerGain.gain.linearRampToValueAtTime(this.layerVolumes[name], now + seconds);
  }

  play(trackId, fade = 1.4) {
    const def = TRACKS[trackId];
    if (!def) return false;
    const ctx = this.ensureBus();
    if (!ctx) return false;
    if (this.current && this.trackId === trackId) {
      // Same track: just make sure it is audible again (e.g. after stop()).
      const now = ctx.currentTime;
      this.current.gain.gain.cancelScheduledValues(now);
      this.current.gain.gain.linearRampToValueAtTime(1, now + fade);
      return true;
    }
    const previous = this.current;
    if (previous) this.fadeOut(previous, Math.min(1.2, fade));
    const built = this.build(trackId, def);
    if (!built) return false;
    this.current = built;
    this.trackId = trackId;
    const now = ctx.currentTime;
    built.gain.gain.setValueAtTime(0.0001, now);
    built.gain.gain.linearRampToValueAtTime(1, now + fade);
    return true;
  }

  crossfadeTo(trackId, fade = 1.8) {
    return this.play(trackId, fade);
  }

  stop(fade = 1.2) {
    if (!this.current) {
      this.trackId = null;
      return;
    }
    this.fadeOut(this.current, fade);
    this.current = null;
    this.trackId = null;
  }

  fadeOut(track, seconds) {
    const ctx = this.kit?.ctx;
    if (!ctx || !track) return;
    const now = ctx.currentTime;
    try {
      track.gain.gain.cancelScheduledValues(now);
      track.gain.gain.setValueAtTime(Math.max(0.0001, track.gain.gain.value), now);
      track.gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    } catch {
      /* already silent */
    }
    clearInterval(track.interval);
    setTimeout(() => {
      for (const osc of track.oscillators) {
        try {
          osc.stop();
        } catch {
          /* already stopped */
        }
      }
      try {
        track.gain.disconnect();
      } catch {
        /* already disconnected */
      }
    }, Math.max(60, seconds * 1000 + 120));
  }

  build(trackId, def) {
    const ctx = this.kit?.ctx;
    if (!ctx || !this.bus) return null;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.connect(this.bus);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = def.filter || 800;
    filter.Q.value = 0.9;
    filter.connect(gain);

    const pad = ctx.createGain();
    pad.gain.value = def.pad || 0.04;
    pad.connect(filter);

    const oscillators = [];
    for (const semis of def.chord) {
      const osc = ctx.createOscillator();
      osc.type = def.wave;
      osc.frequency.value = semitone(def.root, semis);
      osc.detune.value = (Math.random() - 0.5) * 9;
      const voice = ctx.createGain();
      voice.gain.value = 0.32;
      osc.connect(voice).connect(pad);
      osc.start(now);
      oscillators.push(osc);
    }

    // Slow filter movement keeps pads from sounding static.
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.055;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = (def.filter || 800) * 0.22;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start(now);
    oscillators.push(lfo);

    const layerGain = ctx.createGain();
    layerGain.gain.value = this.layerVolumes.combat || 0;
    layerGain.connect(gain);

    const track = {
      id: trackId,
      def,
      gain,
      layerGain,
      oscillators,
      interval: 0,
      step: 0,
      nextTime: now + 0.08,
    };
    this.schedule(track);
    track.interval = setInterval(() => this.schedule(track), 320);
    return track;
  }

  schedule(track) {
    const ctx = this.kit?.ctx;
    if (!ctx || !track) return;
    const now = ctx.currentTime;
    if (track.nextTime < now - 0.4) track.nextTime = now + 0.05;
    const stepDur = 60 / track.def.bpm / 2;
    while (track.nextTime < now + 1.1) {
      const pattern = track.def.arp;
      const step = track.step % pattern.length;
      const semis = pattern[step];
      if (semis !== null) {
        this.note(
          track,
          semitone(track.def.root * 2, semis),
          track.nextTime,
          stepDur * 1.5,
          track.def.melody || 0.02,
          track.def.wave,
          track.gain,
        );
      }
      if (track.def.bass && step % 4 === 0) {
        this.note(
          track,
          semitone(track.def.root / 2, 0),
          track.nextTime,
          stepDur * 3,
          (track.def.melody || 0.02) * 1.15,
          'sine',
          track.gain,
        );
      }
      if (track.def.drums) {
        if (step % 4 === 0) this.kick(track, track.nextTime, track.gain);
        if (step % 2 === 1) this.hat(track, track.nextTime, track.layerGain);
      } else if (step % 8 === 0) {
        // A sparse pulse only becomes audible when the combat layer fades in.
        this.hat(track, track.nextTime, track.layerGain);
      }
      track.nextTime += stepDur;
      track.step += 1;
    }
  }

  note(track, freq, time, dur, level, type, destination) {
    const ctx = this.kit?.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0005, level), time + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(env).connect(destination);
    osc.start(time);
    osc.stop(time + dur + 0.03);
  }

  kick(track, time, destination) {
    const ctx = this.kit?.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.16);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.11, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    osc.connect(env).connect(destination);
    osc.start(time);
    osc.stop(time + 0.24);
    void track;
  }

  hat(track, time, destination) {
    const ctx = this.kit?.ctx;
    if (!ctx || !this.kit.noiseBuffer) return;
    const src = ctx.createBufferSource();
    src.buffer = this.kit.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4200;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.05, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
    src.connect(filter).connect(env).connect(destination);
    src.start(time);
    src.stop(time + 0.11);
    void track;
  }
}
