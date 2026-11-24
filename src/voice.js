// Ashen Vow — voice acting layer (Update XXV).
//
// Pure: no DOM, no audio objects, no fetch. `main.js` owns playback; this
// module owns the cast, the request contract and the saved preferences.
//
// Two providers are supported and both are real:
//
//   elevenlabs — the local server proxies /api/voice to the ElevenLabs
//                text-to-speech endpoint with ELEVENLABS_API_KEY. Audio comes
//                back as MP3 and is cached server-side by text+voice hash.
//   browser    — window.speechSynthesis, used when no key is configured, when
//                the request fails, or when the player turns acting off.
//
// Nothing here fabricates a voice: if neither path is available the game keeps
// its subtitles and stays silent.

export const VOICE_SAVE_KEY = 'ashen-vow-voice-v1';
export const VOICE_SCHEMA_VERSION = 1;

// eleven_multilingual_v2 handles Indonesian; turbo is a cheaper fallback that
// the server may select with ELEVENLABS_MODEL.
export const VOICE_MODEL = 'eleven_multilingual_v2';
export const VOICE_MAX_CHARS = 600;

// Default voice ids are the public ElevenLabs library voices. Any of them can
// be overridden per cast member through environment variables on the server,
// so a project with its own cloned voices does not need a code change.
export const VOICE_CAST = [
  {
    id: 'narrator', name: 'Narator', role: 'narration',
    elevenVoiceId: '21m00Tcm4TlvDq8ikWAM', fallback: { lang: 'id-ID', rate: 0.9, pitch: 0.85 },
    description: 'Suara pembuka dan trailer. Tenang, berat, tidak teatrikal.',
  },
  {
    id: 'warden', name: 'Sir Mordrake', role: 'boss',
    elevenVoiceId: 'pNInz6obpgDQGcFmaJgB', fallback: { lang: 'id-ID', rate: 0.82, pitch: 0.7 },
    description: 'Warden yang jatuh. Nada kelelahan, bukan kemarahan.',
  },
  {
    id: 'wyrm', name: 'Vhael', role: 'boss',
    elevenVoiceId: 'VR6AewLTigWG4xSOukaG', fallback: { lang: 'id-ID', rate: 0.78, pitch: 0.55 },
    description: 'Wyrm abu. Resonansi rendah dan desis panjang.',
  },
  {
    id: 'oathbreaker', name: 'The Oathbreaker', role: 'boss',
    elevenVoiceId: 'ErXwobaYiN019PkySvjV', fallback: { lang: 'id-ID', rate: 0.86, pitch: 0.65 },
    description: 'Suara sumpah yang patah. Sangat jelas, tanpa emosi.',
  },
  {
    id: 'tidebound', name: 'Vasska', role: 'boss',
    elevenVoiceId: 'yoZ06aMxZJJ28mfd3POQ', fallback: { lang: 'id-ID', rate: 0.8, pitch: 0.6 },
    description: 'Bocor, basah, seperti berbicara di bawah air.',
  },
  {
    id: 'wickbearer', name: 'Orsella', role: 'boss',
    elevenVoiceId: 'EXAVITQu4vr4xnSDxMaL', fallback: { lang: 'id-ID', rate: 0.84, pitch: 0.95 },
    description: 'Pembawa sumbu terakhir. Lembut dan mengerikan.',
  },
  {
    id: 'ghost', name: 'Arsip Hantu', role: 'horror',
    elevenVoiceId: 'TX3LPaxmHKxFdv7VOQHJ', fallback: { lang: 'id-ID', rate: 0.72, pitch: 0.5 },
    description: 'Bisikan Scary Mode. Hampir tidak terdengar sebagai kata.',
  },
  {
    id: 'trailer', name: 'Trailer', role: 'promo',
    elevenVoiceId: 'onwK4e9ZLuTAKqWW03F9', fallback: { lang: 'id-ID', rate: 0.95, pitch: 0.75 },
    description: 'Narasi trailer. Lebih cepat dan lebih tegas dari narator.',
  },
];

export const VOICE_CAST_BY_ID = Object.fromEntries(VOICE_CAST.map((member) => [member.id, member]));

const DELIVERY = {
  narration: { stability: 0.45, similarity_boost: 0.8, style: 0.28, use_speaker_boost: true },
  boss: { stability: 0.38, similarity_boost: 0.82, style: 0.45, use_speaker_boost: true },
  horror: { stability: 0.3, similarity_boost: 0.75, style: 0.6, use_speaker_boost: true },
  promo: { stability: 0.42, similarity_boost: 0.85, style: 0.5, use_speaker_boost: true },
};

const clamp = (value, min, max) => (Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min);

export function castFor(id) {
  return VOICE_CAST_BY_ID[id] || VOICE_CAST[0];
}

export function defaultVoiceSave() {
  return {
    version: VOICE_SCHEMA_VERSION,
    enabled: true,
    preferElevenLabs: true,
    volume: 85,
    autoplayInDialogue: true,
    autoplayInTrailer: true,
    castOverrides: {},
    linesPlayed: 0,
    providerUsed: 'unknown',
    updatedAt: 0,
  };
}

export function sanitizeVoiceSave(raw) {
  const defaults = defaultVoiceSave();
  if (!raw || typeof raw !== 'object') return defaults;
  const overrides = {};
  const source = raw.castOverrides && typeof raw.castOverrides === 'object' ? raw.castOverrides : {};
  for (const [id, voiceId] of Object.entries(source)) {
    if (!VOICE_CAST_BY_ID[id]) continue;
    if (typeof voiceId !== 'string') continue;
    const trimmed = voiceId.trim().slice(0, 64);
    // ElevenLabs ids are alphanumeric tokens; reject anything else so a bad
    // save cannot be turned into a request path.
    if (!/^[A-Za-z0-9]{8,64}$/.test(trimmed)) continue;
    overrides[id] = trimmed;
  }
  return {
    version: VOICE_SCHEMA_VERSION,
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : defaults.enabled,
    preferElevenLabs: typeof raw.preferElevenLabs === 'boolean' ? raw.preferElevenLabs : defaults.preferElevenLabs,
    volume: Math.round(clamp(Number(raw.volume), 0, 100)),
    autoplayInDialogue: typeof raw.autoplayInDialogue === 'boolean' ? raw.autoplayInDialogue : defaults.autoplayInDialogue,
    autoplayInTrailer: typeof raw.autoplayInTrailer === 'boolean' ? raw.autoplayInTrailer : defaults.autoplayInTrailer,
    castOverrides: overrides,
    linesPlayed: Math.round(clamp(Number(raw.linesPlayed), 0, 1e6)),
    providerUsed: ['elevenlabs', 'browser', 'none', 'unknown'].includes(raw.providerUsed) ? raw.providerUsed : 'unknown',
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0,
  };
}

export function voiceIdFor(save, castId) {
  const member = castFor(castId);
  const override = save?.castOverrides?.[member.id];
  return override || member.elevenVoiceId;
}

// Produces the body the server expects, or a reason it will not be sent.
export function voiceRequestFor({ text, cast = 'narrator', save = null } = {}) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return { ok: false, reason: 'empty' };
  if (clean.length > VOICE_MAX_CHARS) return { ok: false, reason: 'too-long', chars: clean.length };
  const member = castFor(cast);
  return {
    ok: true,
    chars: clean.length,
    body: {
      text: clean,
      cast: member.id,
      voiceId: voiceIdFor(save, member.id),
      modelId: VOICE_MODEL,
      delivery: DELIVERY[member.role] || DELIVERY.narration,
    },
  };
}

// Which engine actually runs a line. ElevenLabs wins only when the server
// reports a key, the player left it enabled and the request can be made.
export function resolveVoiceProvider({ save, configured = false, online = true, browserAvailable = true } = {}) {
  const prefs = save || defaultVoiceSave();
  if (!prefs.enabled) return 'none';
  if (prefs.preferElevenLabs && configured && online) return 'elevenlabs';
  if (browserAvailable) return 'browser';
  return 'none';
}

export function voiceSummary(save, status = {}) {
  const prefs = sanitizeVoiceSave(save);
  return {
    enabled: prefs.enabled,
    provider: resolveVoiceProvider({
      save: prefs,
      configured: !!status.configured,
      online: status.online !== false,
      browserAvailable: status.browserAvailable !== false,
    }),
    model: status.model || VOICE_MODEL,
    cast: VOICE_CAST.length,
    overrides: Object.keys(prefs.castOverrides).length,
    volume: prefs.volume,
    linesPlayed: prefs.linesPlayed,
    maxChars: VOICE_MAX_CHARS,
  };
}

// Short caption used by the UI so a missing key is visible instead of silent.
export function voiceBadge(summary) {
  if (!summary || !summary.enabled) return 'SUARA: MATI';
  if (summary.provider === 'elevenlabs') return 'SUARA: ELEVENLABS';
  if (summary.provider === 'browser') return 'SUARA: BROWSER';
  return 'SUARA: TIDAK TERSEDIA';
}
