// Cinematic voice processing and wordless boss stings (WebAudio).
//
// `VoiceFX.play()` runs a decoded voice clip (a human recording, or AI speech
// when the player allows it) through the boss's archetype chain: pitch, a
// low-shelf for weight, a detuned/octave doubling layer, drive, slap-back echo,
// a generated convolution reverb and a compressor. `VoiceFX.sting()` makes a
// short wordless vocal swell (formant-filtered choir or growl with a sub hit)
// so a boss phase is voiced even when no recording exists.
//
// No audio files are bundled. Impulse responses are generated once per tail
// length and cached.

import { VOICE_ARCHETYPES } from './boss_voice.js';

const VOWELS = {
  a: [800, 1150, 2900],
  e: [400, 1600, 2700],
  i: [300, 2200, 3000],
  o: [450, 800, 2830],
  u: [325, 700, 2530],
};

function driveCurve(amount) {
  const n = 1024;
  const curve = new Float32Array(n);
  const k = Math.max(0.0001, amount) * 60;
  for (let i = 0; i < n; i += 1) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

export class VoiceFX {
  constructor(audioCtx, destination) {
    this.ctx = audioCtx;
    this.destination = destination || audioCtx?.destination;
    this.impulses = new Map();
    this.active = new Set();
  }

  impulse(seconds) {
    const key = Math.round(seconds * 10) / 10;
    if (this.impulses.has(key)) return this.impulses.get(key);
    const rate = this.ctx.sampleRate;
    const length = Math.max(1, Math.floor(rate * key));
    const buffer = this.ctx.createBuffer(2, length, rate);
    let seed = 987654321;
    for (let ch = 0; ch < 2; ch += 1) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i += 1) {
        seed ^= seed << 13;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        const noise = ((seed >>> 0) / 4294967295) * 2 - 1;
        // Exponential decay with a short pre-delay: reads as stone halls.
        const t = i / length;
        data[i] = i < rate * 0.02 ? 0 : noise * (1 - t) ** 2.6;
      }
    }
    this.impulses.set(key, buffer);
    return buffer;
  }

  /** Bus shared by the voice and its reverb, ending in a compressor. */
  chainOut(profile, volume) {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = volume;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.25;
    out.connect(comp);
    comp.connect(this.destination);

    const dry = ctx.createGain();
    dry.gain.value = 1 - profile.wet * 0.5;
    dry.connect(out);
    const wet = ctx.createGain();
    wet.gain.value = profile.wet;
    const verb = ctx.createConvolver();
    verb.buffer = this.impulse(profile.reverb);
    verb.connect(wet);
    wet.connect(out);
    return { out, dry, verb, nodes: [out, comp, dry, wet, verb] };
  }

  /**
   * Play an AudioBuffer through the archetype chain. Returns a handle whose
   * `ended` promise resolves when the clip (not the reverb tail) finishes.
   */
  play(buffer, archetypeId = 'regal', { volume = 0.9, processing = true } = {}) {
    const ctx = this.ctx;
    if (!ctx || !buffer) return null;
    const profile = processing ? (VOICE_ARCHETYPES[archetypeId] || VOICE_ARCHETYPES.regal) : VOICE_ARCHETYPES.hero;
    const bus = this.chainOut(profile, volume);
    const now = ctx.currentTime + 0.02;
    const sources = [];

    const shelf = ctx.createBiquadFilter();
    shelf.type = 'lowshelf';
    shelf.frequency.value = 220;
    shelf.gain.value = profile.low;
    const presence = ctx.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.value = 3200;
    presence.Q.value = 0.9;
    presence.gain.value = 3;
    shelf.connect(presence);
    let head = presence;
    if (profile.drive > 0) {
      const shaper = ctx.createWaveShaper();
      shaper.curve = driveCurve(profile.drive);
      shaper.oversample = '2x';
      presence.connect(shaper);
      head = shaper;
    }
    head.connect(bus.dry);
    head.connect(bus.verb);
    if (profile.echo > 0) {
      const delay = ctx.createDelay(1);
      delay.delayTime.value = profile.echo / 1000;
      const fb = ctx.createGain();
      fb.gain.value = 0.28;
      head.connect(delay);
      delay.connect(fb);
      fb.connect(delay);
      delay.connect(bus.verb);
      bus.nodes.push(delay, fb);
    }

    const main = ctx.createBufferSource();
    main.buffer = buffer;
    main.playbackRate.value = profile.pitch;
    main.connect(shelf);
    main.start(now);
    sources.push(main);

    const [cents, mix] = profile.double || [0, 0];
    if (mix > 0) {
      // Doubling layer: same clip, same speed, pitched by `detune` so it
      // stacks as an octave/fifth shadow under the voice.
      const twin = ctx.createBufferSource();
      twin.buffer = buffer;
      twin.playbackRate.value = profile.pitch;
      twin.detune.value = cents;
      const g = ctx.createGain();
      g.gain.value = mix;
      twin.connect(g);
      g.connect(shelf);
      twin.start(now + 0.012);
      sources.push(twin);
      bus.nodes.push(g);
    }

    const handle = {
      sources,
      ended: new Promise((resolve) => {
        main.onended = () => resolve();
      }),
      stop: () => {
        for (const s of sources) {
          try { s.stop(); } catch { /* already stopped */ }
        }
        bus.out.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
      },
    };
    this.active.add(handle);
    handle.ended.then(() => {
      this.active.delete(handle);
      // Let the reverb tail ring, then free the graph.
      setTimeout(() => bus.nodes.forEach((n) => { try { n.disconnect(); } catch { /* gone */ } }), profile.reverb * 1000 + 200);
    });
    return handle;
  }

  /**
   * Wordless vocal swell for a boss line: formant-shaped voices (a choir for
   * radiant/choral bosses, a growl for feral/titan ones), a sub-bass hit on
   * phase changes, all through the archetype's reverb. ~1.6–2.6 s.
   */
  sting(archetypeId = 'regal', key = 'intro', { volume = 0.7 } = {}) {
    const ctx = this.ctx;
    const profile = VOICE_ARCHETYPES[archetypeId] || VOICE_ARCHETYPES.regal;
    if (!ctx || !profile.sting) return null;
    const { base, type, voices } = profile.sting;
    const bus = this.chainOut({ ...profile, wet: Math.max(0.35, profile.wet) }, volume);
    const now = ctx.currentTime + 0.02;
    const dur = key === 'defeat' ? 2.6 : key === 'intro' ? 2.2 : 1.8;
    // Phase lines rise a step; defeat falls.
    const shift = key === 'defeat' ? 0.84 : /phase(\d)/.test(key) ? 1 + (Number(key.slice(5)) - 1) * 0.06 : 1;
    const formants = VOWELS[profile.vowel] || VOWELS.a;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(0.9, now + 0.18);
    env.gain.setValueAtTime(0.9, now + dur * 0.55);
    env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    const filters = formants.map((f, i) => {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f;
      bp.Q.value = 9;
      const g = ctx.createGain();
      g.gain.value = [1, 0.55, 0.25][i];
      bp.connect(g);
      g.connect(env);
      bus.nodes.push(bp, g);
      return bp;
    });
    env.connect(bus.dry);
    env.connect(bus.verb);
    bus.nodes.push(env);

    const chord = [1, 1.5, 2, 1.2599, 3];
    const oscs = [];
    for (let i = 0; i < voices; i += 1) {
      const osc = ctx.createOscillator();
      osc.type = type;
      const f = base * shift * chord[i % chord.length];
      osc.frequency.setValueAtTime(f, now);
      if (key === 'defeat') osc.frequency.exponentialRampToValueAtTime(f * 0.7, now + dur);
      osc.detune.value = (i - voices / 2) * 7;
      const vib = ctx.createOscillator();
      vib.frequency.value = 4.6 + i * 0.3;
      const vibGain = ctx.createGain();
      vibGain.gain.value = 6;
      vib.connect(vibGain);
      vibGain.connect(osc.detune);
      for (const bp of filters) osc.connect(bp);
      osc.start(now);
      vib.start(now);
      osc.stop(now + dur + 0.05);
      vib.stop(now + dur + 0.05);
      oscs.push(osc, vib);
      bus.nodes.push(vibGain);
    }

    if (key !== 'intro') {
      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(70, now);
      sub.frequency.exponentialRampToValueAtTime(30, now + 1.1);
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(0.0001, now);
      sg.gain.exponentialRampToValueAtTime(0.8, now + 0.02);
      sg.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      sub.connect(sg);
      sg.connect(bus.out);
      sub.start(now);
      sub.stop(now + 1.3);
      oscs.push(sub);
      bus.nodes.push(sg);
    }

    const handle = {
      sources: oscs,
      ended: new Promise((resolve) => setTimeout(resolve, dur * 1000)),
      stop: () => {
        for (const o of oscs) {
          try { o.stop(); } catch { /* already stopped */ }
        }
        bus.out.gain.setTargetAtTime(0, ctx.currentTime, 0.06);
      },
    };
    this.active.add(handle);
    handle.ended.then(() => {
      this.active.delete(handle);
      setTimeout(() => bus.nodes.forEach((n) => { try { n.disconnect(); } catch { /* gone */ } }), profile.reverb * 1000 + 300);
    });
    return handle;
  }

  stopAll() {
    for (const handle of this.active) handle.stop();
    this.active.clear();
  }
}
