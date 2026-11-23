// Ashen Vow — hidden secrets.
//
// Secrets are deliberately absent from menus, tutorials, the codex and the
// update log. Two kinds exist:
//   • level runes hidden in a handful of campaign rooms
//   • one quiet mode mark earned by the same sequence in every mode
//
// Nothing here grants combat stats. The ledger only remembers that a player
// found the thing, so a secret can never unbalance a run or multiplayer.

export const SECRETS_SAVE_KEY = 'ashen-vow-secrets-v1';
export const SECRETS_SCHEMA_VERSION = 1;
export const SECRET_SEQUENCE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA',
];
export const SECRET_SEQUENCE_WINDOW_MS = 4500;

export const SECRET_MODE_KEYS = [
  'title', 'legacy', 'speedrun', 'expansion', 'atlas', 'court', 'labyrinth',
  'fairy', 'fallen', 'crusade', 'astral', 'eclipse', 'godfall', 'raid',
  'veil', 'eternal', 'pack', 'trials', 'puzzle', 'moba', 'wavedefense',
  'realms', 'fishing', 'baitShop', 'fishIndex', 'mode3d', 'horror3d',
  'frontier', 'overdrive', 'scary', 'dread', 'archive',
];

const MODE_WHISPERS = {
  title: 'Sesuatu di balik layar judul mengucapkan terima kasih.',
  legacy: 'Abu pertama mengingat tangan yang menyalakannya.',
  speedrun: 'Satu nyawa. Satu nama. Satu kesempatan untuk didengar.',
  expansion: 'Ada gema yang tidak pernah masuk ke dalam indeks.',
  atlas: 'Peta ini pernah punya satu halaman yang tidak digambar.',
  court: 'Perapian terbesar menyimpan satu bara yang tidak pernah padam.',
  labyrinth: 'Dinding labirin menghitung langkah yang tidak pernah kau ambil.',
  fairy: 'Satu peri kecil mengingat nama yang tidak ada di buku.',
  fallen: 'Langit pernah menulis namamu sebelum kau jatuh.',
  crusade: 'Panji yang tidak dikibarkan tetap punya bayangan.',
  astral: 'Di antara bintang ada satu titik yang tidak pernah bergerak.',
  eclipse: 'Gerhana menyembunyikan satu huruf dari setiap nama dewa.',
  godfall: 'Lantai yang tidak pernah kau injak masih menyimpan jejak.',
  raid: 'Satu suara di paduan suara selalu bernyanyi lebih pelan.',
  veil: 'Tabir punya satu halaman yang tidak pernah dibaca.',
  eternal: 'Malam pertama punya satu bintang yang tidak pernah padam.',
  pack: 'Di panggung terakhir ada kursi yang tidak pernah kosong.',
  trials: 'Ujian kelima punya satu penonton yang tidak terdaftar.',
  puzzle: 'Satu keping selalu kembali ke tempat yang sama.',
  moba: 'Di dasar sungai ada satu altar yang tidak pernah dikunjungi.',
  wavedefense: 'Benteng terakhir punya satu lorong yang tidak ada di peta.',
  realms: 'Di antara enam dunia ada satu pintu yang tidak punya tujuan.',
  fishing: 'Di dasar danau ada sesuatu yang tidak mau dipancing.',
  baitShop: 'Satu umpan di rak belakang tidak punya harga.',
  fishIndex: 'Satu halaman indeks selalu kosong, lalu terisi saat kau menutupnya.',
  mode3d: 'Di balik kabut ada pohon yang tumbuh terbalik.',
  horror3d: 'Lampu terakhir di Blackveil menyala untuk seseorang yang tidak ada.',
  frontier: 'Perbatasan keseratus menyimpan satu nama yang tidak pernah ditulis.',
  overdrive: 'Mesin yang berhenti tetap berdetak satu kali.',
  scary: 'Satu bisikan memakai suaramu sendiri.',
  dread: 'Langit-langit rumah kosong menyimpan satu jejak kaki.',
  archive: 'Arsip punya satu rak yang tidak muncul di katalog.',
};

/** A quiet mark for every mode the game exposes. */
export const SECRET_MODE_MARKS = SECRET_MODE_KEYS.map((mode) => ({
  id: `mode:${mode}`,
  kind: 'mode',
  mode,
  name: `Mode mark — ${mode}`,
  whisper: MODE_WHISPERS[mode],
}));

/**
 * Level runes. These are hidden, not highlighted: no minimap marker, no quest,
 * no prompt. A faint glyph is drawn where it lives and only responds to the
 * same interaction key used at Warung Abu.
 */
export const SECRET_LEVEL_RUNES = [
  { id: 'level:ash_gate_whisper', kind: 'level', mode: 'legacy', room: 0, x: 286, y: 448, glyph: 'ᛉ', whisper: 'Gerbang pertama mencatat nama yang tidak pernah lewat.' },
  { id: 'level:bone_bridge_whisper', kind: 'level', mode: 'legacy', room: 4, x: 612, y: 448, glyph: 'ᚨ', whisper: 'Tulang-tulang itu menyusun satu kata yang tidak bisa diucapkan.' },
  { id: 'level:summit_whisper', kind: 'level', mode: 'legacy', room: 7, x: 1014, y: 448, glyph: 'ᛟ', whisper: 'Di puncak sumpah, angin mengulang janji yang tidak pernah dibuat.' },
  { id: 'level:alcove_whisper', kind: 'level', mode: 'legacy', room: 12, x: 354, y: 448, glyph: 'ᛞ', whisper: 'Relung tersembunyi menyimpan nama sebelum relung itu ada.' },
  { id: 'level:spore_altar_whisper', kind: 'level', mode: 'legacy', room: 13, x: 1284, y: 448, glyph: 'ᚱ', whisper: 'Altar spora bernapas sekali setiap kali ada yang mengingat.' },
  { id: 'level:sunken_alcove_whisper', kind: 'level', mode: 'cistern', room: 667, x: 356, y: 448, glyph: 'ᛇ', whisper: 'Relung karam mencatat setiap nama yang tenggelam sebelum sempat diucapkan.' },
  { id: 'level:low_cave_whisper', kind: 'level', mode: 'cistern', room: 668, x: 1210, y: 448, glyph: 'ᛜ', whisper: 'Dasar sistem berdenyut seperti jantung yang lupa cara berhenti.' },
];

export const SECRET_EGGS = [...SECRET_MODE_MARKS, ...SECRET_LEVEL_RUNES];
export const SECRET_EGG_IDS = new Set(SECRET_EGGS.map((entry) => entry.id));

export function secretForMode(mode) {
  return SECRET_MODE_MARKS.find((entry) => entry.mode === mode) || null;
}

/** Campaign runes also exist in Speedrun, which reuses the same rooms. */
export function secretSpotFor(mode, roomIndex) {
  if (!Number.isInteger(roomIndex)) return null;
  return SECRET_LEVEL_RUNES.find(
    (entry) => entry.room === roomIndex && (entry.mode === mode || (entry.mode === 'legacy' && mode === 'speedrun')),
  ) || null;
}

export function createSecretBuffer() {
  return { buffer: [], lastAt: 0 };
}

/**
 * Advances the hidden sequence. Returns true exactly once, on the key that
 * completes it. Keys outside the sequence reset the buffer instead of being
 * remembered, so ordinary play cannot accidentally fill it.
 */
export function advanceSecretSequence(state, code, now = Date.now(), windowMs = SECRET_SEQUENCE_WINDOW_MS) {
  if (!state || typeof state !== 'object') return false;
  if (!SECRET_SEQUENCE.includes(code)) {
    state.buffer = [];
    state.lastAt = 0;
    return false;
  }
  const expired = !state.lastAt || now - state.lastAt > windowMs;
  if (expired) {
    state.buffer = [];
  }
  state.lastAt = now;
  const next = SECRET_SEQUENCE[state.buffer.length];
  if (code !== next) {
    state.buffer = code === SECRET_SEQUENCE[0] ? [code] : [];
    return false;
  }
  state.buffer.push(code);
  if (state.buffer.length < SECRET_SEQUENCE.length) return false;
  state.buffer = [];
  state.lastAt = 0;
  return true;
}

export function defaultSecretsSave() {
  return {
    schemaVersion: SECRETS_SCHEMA_VERSION,
    found: [],
    sequenceTriggers: 0,
    levelFinds: 0,
    modeFinds: 0,
    lastAt: 0,
  };
}

export function sanitizeSecretsSave(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const found = Array.isArray(source.found)
    ? [...new Set(source.found.filter((id) => typeof id === 'string' && SECRET_EGG_IDS.has(id)))]
    : [];
  const levelFinds = found.filter((id) => id.startsWith('level:')).length;
  const modeFinds = found.filter((id) => id.startsWith('mode:')).length;
  return {
    schemaVersion: SECRETS_SCHEMA_VERSION,
    found,
    sequenceTriggers: Math.max(0, Math.floor(Number(source.sequenceTriggers) || 0)),
    levelFinds,
    modeFinds,
    lastAt: Number.isFinite(Number(source.lastAt)) ? Math.max(0, Number(source.lastAt)) : 0,
  };
}

export function recordSecret(state, id, { at = Date.now() } = {}) {
  const save = sanitizeSecretsSave(state);
  if (!SECRET_EGG_IDS.has(id)) return { ok: false, firstTime: false, state: save };
  const firstTime = !save.found.includes(id);
  if (firstTime) {
    save.found.push(id);
    save.levelFinds = save.found.filter((entry) => entry.startsWith('level:')).length;
    save.modeFinds = save.found.filter((entry) => entry.startsWith('mode:')).length;
    if (id.startsWith('mode:')) save.sequenceTriggers += 1;
    save.lastAt = Math.max(0, Number(at) || 0);
  }
  return { ok: true, firstTime, state: save };
}

export function hasSecret(state, id) {
  return !!state && Array.isArray(state.found) && state.found.includes(id);
}

export function secretSummary(state) {
  const save = sanitizeSecretsSave(state);
  return {
    found: save.found.length,
    total: SECRET_EGGS.length,
    levels: save.levelFinds,
    levelTotal: SECRET_LEVEL_RUNES.length,
    modes: save.modeFinds,
    modeTotal: SECRET_MODE_MARKS.length,
    complete: save.found.length >= SECRET_EGGS.length,
  };
}
