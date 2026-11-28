// Boss voice direction — pure data and rules, no DOM, no audio objects.
//
// Every one of the 116 bosses already speaks at its intro, at each phase and
// on defeat (613 lines). This module turns those lines into a voice script:
// a stable id and recording path per line, a voice archetype per boss (who
// they sound like and how the line is processed), and the rule that decides
// which audio source plays.
//
// Source order, by design:
//   1. recorded  — a human-recorded file listed in assets/voice/manifest.json
//   2. ai        — ElevenLabs, ONLY when the player explicitly allows AI voices,
//                  and always through the cinematic processing chain
//   3. sting     — a procedural, wordless vocal swell (choir / growl / breath)
//                  under the subtitle, so a phase change is never silent
//   4. none      — voice turned off
// Plain, unprocessed text-to-speech is never used for bosses.

import { ALL_BOSS_INFO, BOSS_INFO } from './core.js';

export const BOSS_VOICE_SCHEMA = 1;
export const BOSS_VOICE_ROOT = 'assets/voice/boss';
export const BOSS_VOICE_MODES = ['recorded-first', 'stings-only', 'off'];
export const PLAYER_SPEAKER = 'The Oathbound';

// Processing profiles. `pitch` is playbackRate (also the sting's base shift),
// `low` a low-shelf boost in dB, `reverb` seconds of tail, `wet` reverb mix,
// `drive` waveshaper amount, `double` a detuned doubling layer (cents, mix),
// `echo` slap-back in ms. `vowel` picks the sting formants.
export const VOICE_ARCHETYPES = {
  titan: {
    label: 'Titan Berzirah', pitch: 0.86, low: 7, reverb: 3.2, wet: 0.34, drive: 0.12, double: [-1200, 0.28], echo: 0,
    vowel: 'o', sting: { base: 55, type: 'sawtooth', voices: 3 },
    direction: 'Baritone dalam dan lelah. Tiap kalimat seperti beban baja yang diangkat. Jangan berteriak; tekan dari dada.',
  },
  wyrm: {
    label: 'Naga / Wyrm', pitch: 0.78, low: 9, reverb: 3.8, wet: 0.38, drive: 0.22, double: [-700, 0.32], echo: 120,
    vowel: 'a', sting: { base: 41, type: 'sawtooth', voices: 4 },
    direction: 'Suara sangat rendah, berdesis di akhir kata. Ambil napas panjang sebelum kalimat; biarkan huruf S memanjang.',
  },
  choir: {
    label: 'Paduan Suara', pitch: 1, low: 2, reverb: 5.5, wet: 0.55, drive: 0, double: [12, 0.45], echo: 180,
    vowel: 'a', sting: { base: 220, type: 'triangle', voices: 5 },
    direction: 'Direkam tiga kali (rendah, tengah, tinggi) lalu ditumpuk. Datar, hampir dinyanyikan, tanpa emosi pribadi.',
  },
  regal: {
    label: 'Bangsawan / Hakim', pitch: 0.94, low: 4, reverb: 2.6, wet: 0.28, drive: 0, double: [0, 0], echo: 0,
    vowel: 'e', sting: { base: 98, type: 'sawtooth', voices: 3 },
    direction: 'Tenang, berwibawa, artikulasi bersih. Bicara seolah hasilnya sudah diputuskan.',
  },
  feral: {
    label: 'Buas', pitch: 0.82, low: 6, reverb: 1.8, wet: 0.22, drive: 0.35, double: [-500, 0.25], echo: 0,
    vowel: 'a', sting: { base: 65, type: 'square', voices: 2 },
    direction: 'Kasar, dari tenggorokan, terengah. Potong kalimat dengan geraman kecil.',
  },
  spectral: {
    label: 'Arwah', pitch: 0.96, low: 0, reverb: 4.6, wet: 0.5, drive: 0, double: [25, 0.4], echo: 260,
    vowel: 'u', sting: { base: 147, type: 'sine', voices: 4 },
    direction: 'Separuh berbisik, dekat mikrofon. Akhir kalimat hilang seperti napas di udara dingin.',
  },
  fae: {
    label: 'Peri Purba', pitch: 1.04, low: 0, reverb: 3.4, wet: 0.42, drive: 0, double: [700, 0.22], echo: 140,
    vowel: 'i', sting: { base: 330, type: 'triangle', voices: 4 },
    direction: 'Ringan dan menggoda, tetapi dingin di bawahnya. Senyum terdengar dalam suara.',
  },
  radiant: {
    label: 'Malaikat Jatuh', pitch: 0.98, low: 2, reverb: 5, wet: 0.48, drive: 0, double: [1200, 0.18], echo: 200,
    vowel: 'a', sting: { base: 196, type: 'sawtooth', voices: 5 },
    direction: 'Agung dan sedih. Terlalu tenang untuk manusia. Setiap kata seperti doa yang tidak lagi dipercaya.',
  },
  abyssal: {
    label: 'Kekosongan', pitch: 0.74, low: 10, reverb: 6, wet: 0.5, drive: 0.18, double: [-1200, 0.4], echo: 320,
    vowel: 'o', sting: { base: 36.7, type: 'sawtooth', voices: 4 },
    direction: 'Sangat pelan dan rendah. Ruang kosong lebih penting dari kata. Jeda panjang sebelum kata terakhir.',
  },
  drowned: {
    label: 'Tenggelam', pitch: 0.84, low: 6, reverb: 4.2, wet: 0.46, drive: 0.08, double: [-300, 0.3], echo: 90,
    vowel: 'u', sting: { base: 49, type: 'sawtooth', voices: 3 },
    direction: 'Basah, berat, seperti bicara dengan air di paru-paru. Gelembung napas di antara frasa.',
  },
  matron: {
    label: 'Ibu / Penjaga Api', pitch: 1, low: 3, reverb: 3, wet: 0.36, drive: 0, double: [-1200, 0.15], echo: 0,
    vowel: 'e', sting: { base: 175, type: 'triangle', voices: 3 },
    direction: 'Alto yang hangat lalu tiba-tiba dingin. Lembut seperti lagu pengantar tidur yang mengancam.',
  },
  hero: {
    label: 'The Oathbound (pemain)', pitch: 1, low: 2, reverb: 1.4, wet: 0.16, drive: 0, double: [0, 0], echo: 0,
    vowel: 'a', sting: null,
    direction: 'Pendek, tegas, sedikit lelah. Bukan pahlawan yang berpidato; prajurit yang menepati janji.',
  },
};

// Named bosses with a deliberate voice; everything else is assigned by arc.
const BOSS_ARCHETYPE = {
  warden: 'titan',
  wyrm: 'wyrm',
  choir: 'choir',
  oathbreaker: 'regal',
  sporebound: 'feral',
  root: 'abyssal',
  tidebound: 'drowned',
  wickbearer: 'matron',
  fairy_magma_slime: 'feral',
  fairy_spectral_dragon: 'wyrm',
  court_boss_hearthmother: 'matron',
};

/** Which voice a boss uses: explicit choice, then its arc, then its body. */
export function archetypeForBoss(kind, info = ALL_BOSS_INFO[kind]) {
  if (BOSS_ARCHETYPE[kind]) return BOSS_ARCHETYPE[kind];
  if (!info) return 'regal';
  if (info.fallen) return 'radiant';
  if (info.crusade || info.court || info.pack) return 'regal';
  if (info.astral || info.eclipse || info.godfall) return 'abyssal';
  if (info.fairy) return 'fae';
  if (info.atlas) return info.flying ? 'spectral' : 'titan';
  if (/choir|chorist|cantor|bell/i.test(kind)) return 'choir';
  if (info.mini) return info.flying ? 'spectral' : 'feral';
  if (info.flying) return 'spectral';
  return 'titan';
}

export function voiceLineId(kind, key, index) {
  return `${kind}.${key}.${index + 1}`;
}

export function voiceLinePath(kind, key, index, ext = 'mp3') {
  return `${BOSS_VOICE_ROOT}/${kind}/${key}-${index + 1}.${ext}`;
}

function lineText(line) {
  return typeof line === 'string' ? line : String(line?.text || '');
}

function lineSpeaker(line, info) {
  return typeof line === 'string' ? info.name : String(line?.speaker || info.name);
}

const KEY_ORDER = ['intro', 'phase2', 'phase3', 'phase4', 'phase5', 'defeat'];

let scriptCache = null;

/** Every boss line as a voice-script row (stable order, stable ids). */
export function bossVoiceScript() {
  if (scriptCache) return scriptCache;
  const rows = [];
  for (const [kind, info] of Object.entries(ALL_BOSS_INFO)) {
    const archetype = archetypeForBoss(kind, info);
    const dialogue = info.dialogue || {};
    const keys = [...KEY_ORDER.filter((k) => dialogue[k]), ...Object.keys(dialogue).filter((k) => !KEY_ORDER.includes(k))];
    for (const key of keys) {
      (dialogue[key] || []).forEach((line, index) => {
        const speaker = lineSpeaker(line, info);
        const isPlayer = speaker === PLAYER_SPEAKER;
        rows.push({
          id: voiceLineId(kind, key, index),
          kind,
          boss: info.name,
          legacy: !!BOSS_INFO[kind],
          key,
          index,
          speaker,
          text: lineText(line),
          archetype: isPlayer ? 'hero' : archetype,
          file: voiceLinePath(kind, key, index),
        });
      });
    }
  }
  scriptCache = rows;
  return rows;
}

export function bossVoiceLine(kind, key, index) {
  const id = voiceLineId(kind, key, index);
  return bossVoiceScript().find((row) => row.id === id) || null;
}

export function bossVoiceSummary() {
  const rows = bossVoiceScript();
  const bosses = new Set(rows.map((r) => r.kind));
  const archetypes = {};
  for (const r of rows) archetypes[r.archetype] = (archetypes[r.archetype] || 0) + 1;
  return {
    lines: rows.length,
    bosses: bosses.size,
    bossLines: rows.filter((r) => r.archetype !== 'hero').length,
    playerLines: rows.filter((r) => r.archetype === 'hero').length,
    archetypes,
  };
}

/** Sanitize the recorded-file manifest (assets/voice/manifest.json). */
export function sanitizeVoiceManifest(raw) {
  const known = new Set(bossVoiceScript().map((r) => r.id));
  const files = Array.isArray(raw?.files) ? raw.files : [];
  const recorded = [...new Set(files.filter((id) => typeof id === 'string' && known.has(id)))];
  // Optional per-line paths (a recording may be .ogg/.wav/.m4a). Only paths
  // inside the voice folder with an audio extension are accepted.
  const paths = {};
  const rawPaths = raw?.paths && typeof raw.paths === 'object' ? raw.paths : {};
  for (const id of recorded) {
    const path = rawPaths[id];
    if (typeof path === 'string' && path.startsWith(`${BOSS_VOICE_ROOT}/`) && !path.includes('..') && /\.(mp3|ogg|wav|m4a)$/i.test(path)) paths[id] = path;
  }
  return { version: BOSS_VOICE_SCHEMA, files: recorded, paths };
}

export function defaultBossVoiceSettings() {
  return { mode: 'recorded-first', allowAi: false, processing: true, stings: true };
}

export function sanitizeBossVoiceSettings(raw) {
  const d = defaultBossVoiceSettings();
  if (!raw || typeof raw !== 'object') return d;
  return {
    mode: BOSS_VOICE_MODES.includes(raw.mode) ? raw.mode : d.mode,
    allowAi: typeof raw.allowAi === 'boolean' ? raw.allowAi : d.allowAi,
    // AI speech is only ever played through the processing chain.
    processing: raw.allowAi === true ? true : typeof raw.processing === 'boolean' ? raw.processing : d.processing,
    stings: typeof raw.stings === 'boolean' ? raw.stings : d.stings,
  };
}

/**
 * Decide what plays for one line. `recorded` is the sanitized manifest's set
 * of ids; `lineText` lets a run with overridden dialogue (Labyrinth, events)
 * skip a recording whose words no longer match.
 */
export function resolveBossVoiceSource({ settings, recorded, kind, key, index, text = null, aiConfigured = false, online = true, voiceEnabled = true } = {}) {
  const prefs = sanitizeBossVoiceSettings(settings);
  if (!voiceEnabled || prefs.mode === 'off') return 'none';
  const row = bossVoiceLine(kind, key, index);
  const sameWords = row && (text == null || row.text === text);
  if (prefs.mode === 'recorded-first' && row && sameWords && recorded?.has?.(row.id)) return 'recorded';
  if (prefs.mode === 'recorded-first' && prefs.allowAi && aiConfigured && online) return 'ai';
  if (prefs.stings) return 'sting';
  return 'none';
}

export const BOSS_VOICE_SOURCE_LABEL = {
  recorded: 'SUARA: REKAMAN',
  ai: 'SUARA: AI + FX',
  sting: 'SUARA: STING SINEMATIK',
  none: 'SUARA: MATI',
};
