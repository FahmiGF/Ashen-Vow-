// Ashen Vow — settings, keybindings, and accessibility state.
// Pure data + storage helpers so the whole module is testable in Node.
export const SETTINGS_KEY = 'ashen-vow-settings-v1';
export const SETTINGS_VERSION = 1;

// Every player action that can be rebound. `gamepad` is informational for the
// settings table; the Gamepad API mapping lives in GAMEPAD_MAP below.
export const ACTIONS = [
  { id: 'left', label: 'Gerak Kiri', defaults: ['KeyA', 'ArrowLeft'], gamepad: 'D-Pad Kiri' },
  { id: 'right', label: 'Gerak Kanan', defaults: ['KeyD', 'ArrowRight'], gamepad: 'D-Pad Kanan' },
  { id: 'jump', label: 'Lompat', defaults: ['Space', 'KeyW'], gamepad: 'A / Cross' },
  { id: 'dash', label: 'Dash', defaults: ['ShiftLeft', 'KeyL'], gamepad: 'B / Circle' },
  { id: 'attack', label: 'Serangan Pedang', defaults: ['KeyJ', 'KeyZ'], gamepad: 'X / Square' },
  { id: 'consume', label: 'Lempar Item Cepat', defaults: ['KeyK', 'KeyX'], gamepad: 'RB / R1' },
  { id: 'cycleItem', label: 'Ganti Item Cepat', defaults: ['KeyR'], gamepad: 'L3' },
  { id: 'ability', label: 'Keahlian Khusus', defaults: ['KeyU', 'KeyV'], gamepad: 'Y / Triangle' },
  { id: 'heal', label: 'Minum Flask', defaults: ['KeyE', 'KeyH'], gamepad: 'LB / L1' },
  { id: 'swap', label: 'Ganti Senjata', defaults: ['KeyQ', 'KeyC'], gamepad: 'D-Pad Atas' },
  { id: 'interact', label: 'Interaksi / Warung', defaults: ['KeyF', 'Enter'], gamepad: 'D-Pad Bawah' },
  { id: 'inventory', label: 'Buka Inventaris', defaults: ['KeyI'], gamepad: 'Select / View' },
  { id: 'map', label: 'Buka Peta', defaults: ['KeyM', 'Tab'], gamepad: 'R3' },
  { id: 'pause', label: 'Jeda / Pengaturan', defaults: ['Escape', 'KeyP'], gamepad: 'Start' },
];

export const ACTION_IDS = ACTIONS.map((a) => a.id);

export function defaultBindings() {
  const bindings = {};
  for (const action of ACTIONS) bindings[action.id] = [...action.defaults];
  return bindings;
}

export function defaultSettings() {
  return {
    version: SETTINGS_VERSION,
    audio: { master: 80, music: 55, sfx: 80, muted: false, muteOnBlur: true },
    gameplay: {
      screenShake: 'full',
      reduceFlashing: false,
      highContrast: false,
      colorblind: false,
      textSize: 'normal',
      fpsCounter: false,
      frameCap: 60,
      gamepad: true,
    },
    bindings: defaultBindings(),
  };
}

export function cloneSettings(settings) {
  return {
    version: SETTINGS_VERSION,
    audio: { ...settings.audio },
    gameplay: { ...settings.gameplay },
    bindings: Object.fromEntries(
      Object.entries(settings.bindings || {}).map(([key, codes]) => [key, [...codes]]),
    ),
  };
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const CODE_RE =
  /^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|F([1-9]|1[0-2])|Arrow(Up|Down|Left|Right)|Space|Enter|Escape|Tab|Backspace|CapsLock|Backquote|Minus|Equal|Bracket(Left|Right)|Semicolon|Quote|Comma|Period|Slash|Backslash|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right)|Meta(Left|Right))$/;

export function isBindableCode(code) {
  return typeof code === 'string' && CODE_RE.test(code);
}

function sanitizeBindings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const bindings = {};
  // Track who already owns a code so imported/legacy duplicates cannot make an
  // action unreachable.
  const used = new Set();
  for (const action of ACTIONS) {
    const incoming = Array.isArray(source[action.id]) ? source[action.id] : [];
    const codes = [];
    for (const code of incoming) {
      if (!isBindableCode(code) || used.has(code)) continue;
      codes.push(code);
      used.add(code);
      if (codes.length >= 2) break;
    }
    const fallback = action.defaults.filter((code) => !used.has(code));
    while (codes.length < 2) {
      const next = fallback.shift();
      if (!next) break;
      codes.push(next);
      used.add(next);
    }
    if (!codes.length) {
      codes.push(action.defaults[0]);
      used.add(action.defaults[0]);
    }
    bindings[action.id] = codes;
  }
  return bindings;
}

export function sanitizeSettings(raw) {
  const defaults = defaultSettings();
  const source = raw && typeof raw === 'object' ? raw : {};
  const audio = source.audio && typeof source.audio === 'object' ? source.audio : {};
  const gameplay = source.gameplay && typeof source.gameplay === 'object' ? source.gameplay : {};

  const screenShake = ['off', 'low', 'full'].includes(gameplay.screenShake)
    ? gameplay.screenShake
    : defaults.gameplay.screenShake;
  const frameCap = [0, 60, 120].includes(Number(gameplay.frameCap))
    ? Number(gameplay.frameCap)
    : defaults.gameplay.frameCap;

  return {
    version: SETTINGS_VERSION,
    audio: {
      master: clamp(Math.round(num(audio.master, defaults.audio.master)), 0, 100),
      music: clamp(Math.round(num(audio.music, defaults.audio.music)), 0, 100),
      sfx: clamp(Math.round(num(audio.sfx, defaults.audio.sfx)), 0, 100),
      muted: Boolean(audio.muted),
      muteOnBlur: audio.muteOnBlur === undefined ? defaults.audio.muteOnBlur : Boolean(audio.muteOnBlur),
    },
    gameplay: {
      screenShake,
      reduceFlashing: Boolean(gameplay.reduceFlashing),
      highContrast: Boolean(gameplay.highContrast),
      colorblind: Boolean(gameplay.colorblind),
      textSize: gameplay.textSize === 'large' ? 'large' : 'normal',
      fpsCounter: Boolean(gameplay.fpsCounter),
      frameCap,
      gamepad: gameplay.gamepad === undefined ? true : Boolean(gameplay.gamepad),
    },
    bindings: sanitizeBindings(source.bindings),
  };
}

// Storage is injected so tests (and private-mode browsers) never depend on a
// real localStorage implementation.
export function loadSettings(storage) {
  try {
    const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!store) return defaultSettings();
    const raw = store.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(storage, settings) {
  try {
    const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!store) return false;
    store.setItem(SETTINGS_KEY, JSON.stringify(sanitizeSettings(settings)));
    return true;
  } catch {
    return false;
  }
}

export function codesForAction(settings, actionId) {
  return settings?.bindings?.[actionId] ? [...settings.bindings[actionId]] : [];
}

export function actionForCode(settings, code) {
  if (!settings?.bindings) return null;
  for (const [actionId, codes] of Object.entries(settings.bindings)) {
    if (codes.includes(code)) return actionId;
  }
  return null;
}

export function findConflict(settings, actionId, code) {
  if (!code) return null;
  for (const [otherId, codes] of Object.entries(settings.bindings || {})) {
    if (otherId === actionId) continue;
    const slot = codes.indexOf(code);
    if (slot !== -1) return { action: otherId, slot };
  }
  return null;
}

// Applies a binding immediately, swapping with the conflicting action when one
// exists (the caller is expected to ask Swap / Cancel first via findConflict).
export function applyBinding(settings, actionId, slot, code) {
  const next = cloneSettings(sanitizeSettings(settings));
  if (!next.bindings[actionId]) return { settings: next, conflict: null, replaced: null };
  if (!isBindableCode(code)) return { settings: next, conflict: null, replaced: null };
  const target = clamp(Number(slot) || 0, 0, 1);
  const old = next.bindings[actionId][target] || '';
  const conflict = findConflict(next, actionId, code);
  let replaced = null;
  if (conflict) {
    replaced = next.bindings[conflict.action][conflict.slot];
    next.bindings[conflict.action][conflict.slot] = old;
  }
  next.bindings[actionId][target] = code;
  // Never allow the same action to own one key twice.
  next.bindings[actionId] = next.bindings[actionId].map((entry, i) =>
    i !== target && entry === code ? '' : entry,
  );
  return { settings: next, conflict: conflict?.action || null, replaced };
}

export function resetActionBindings(settings, actionId) {
  const next = cloneSettings(sanitizeSettings(settings));
  next.bindings[actionId] = [...(ACTIONS.find((a) => a.id === actionId)?.defaults || [])];
  // Keep the rest of the layout reachable: if the restored defaults collide,
  // fall back through the sanitizer, which borrows the next free default.
  return sanitizeSettings(next);
}

export function resetAllBindings(settings) {
  const next = cloneSettings(sanitizeSettings(settings));
  next.bindings = defaultBindings();
  return next;
}

const KEY_LABELS = {
  Space: 'SPACE',
  Enter: 'ENTER',
  Escape: 'ESC',
  Tab: 'TAB',
  Backspace: 'BACKSPACE',
  CapsLock: 'CAPS',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  ShiftLeft: 'LSHIFT',
  ShiftRight: 'RSHIFT',
  ControlLeft: 'LCTRL',
  ControlRight: 'RCTRL',
  AltLeft: 'LALT',
  AltRight: 'RALT',
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backslash: '\\',
};

export function formatCode(code) {
  if (!code) return '—';
  if (KEY_LABELS[code]) return KEY_LABELS[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `NUM${code.slice(6)}`;
  return code.toUpperCase();
}

// Standard Gamepad API button indices -> game actions.
export const GAMEPAD_MAP = {
  0: 'jump',
  1: 'dash',
  2: 'attack',
  3: 'ability',
  4: 'heal',
  5: 'consume',
  8: 'inventory',
  9: 'pause',
  10: 'cycleItem',
  11: 'map',
  12: 'swap',
  13: 'interact',
  14: 'left',
  15: 'right',
};

export const GAMEPAD_AXIS_DEADZONE = 0.35;

// Returns the action set currently held on a Gamepad. Kept pure (takes a
// "standard" gamepad snapshot) so it can be unit tested without hardware.
export function gamepadActions(pad) {
  const held = new Set();
  if (!pad) return held;
  if (pad.buttons) {
    for (const [index, action] of Object.entries(GAMEPAD_MAP)) {
      if (pad.buttons[Number(index)]?.pressed) held.add(action);
    }
  }
  const axisX = pad.axes?.[0] ?? 0;
  if (axisX <= -GAMEPAD_AXIS_DEADZONE) held.add('left');
  if (axisX >= GAMEPAD_AXIS_DEADZONE) held.add('right');
  const axisY = pad.axes?.[1] ?? 0;
  if (axisY <= -GAMEPAD_AXIS_DEADZONE) held.add('jump');
  return held;
}
