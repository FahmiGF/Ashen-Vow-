// Ashen Vow — settings, keybindings, and accessibility state.
// Pure data + storage helpers so the whole module is testable in Node.
import {
  SETTINGS2_VERSION,
  defaultExtendedSettings,
  sanitizeExtendedSettings,
} from './settings2.js';

export const SETTINGS_KEY = 'ashen-vow-settings-v1';
export const SETTINGS_VERSION = SETTINGS2_VERSION;

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
  { id: 'weaponSkill', label: 'Weapon Skill', defaults: ['KeyG', 'KeyT'], gamepad: 'LB + Y' },
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
  const ext = defaultExtendedSettings();
  return {
    ...ext,
    version: SETTINGS_VERSION,
    audio: { ...ext.audio },
    graphics: { ...ext.graphics },
    gameplay: {
      ...ext.gameplay,
      reduceFlashing: ext.accessibility.reduceFlashing,
      highContrast: ext.accessibility.highContrast,
      colorblind: ext.accessibility.colorblind !== 'off',
      textSize: ext.accessibility.textSize,
      graphicsPreset: ext.graphics.preset,
      particleDensity: ext.graphics.particleQuality === 'low' ? 'low' : ext.graphics.particleQuality === 'medium' ? 'low' : 'full',
      qualityBias: 55,
      antiAliasing: ext.graphics.antiAliasing !== 'off',
      fov: 100,
      renderDistance: 100,
      shadowQuality: ext.graphics.shadowQuality === 'off' ? 'off' : ext.graphics.shadowQuality === 'low' ? 'low' : ext.graphics.shadowQuality === 'medium' ? 'medium' : 'high',
      lightingQuality: ext.graphics.lightingQuality,
      textureQuality: ext.graphics.textureQuality,
      vfxQuality: ext.graphics.particleQuality,
      animationQuality: ext.performance.animationQuality,
      resolutionScale: ext.graphics.renderScale / 100,
      backgroundEffects: true,
    },
    bindings: defaultBindings(),
  };
}

export function cloneSettings(settings) {
  const source = settings && typeof settings === 'object' ? settings : defaultSettings();
  return {
    ...source,
    version: SETTINGS_VERSION,
    audio: { ...source.audio, channelMutes: { ...(source.audio?.channelMutes || {}) } },
    graphics: { ...source.graphics },
    display: { ...source.display },
    controls: { ...source.controls },
    gameplay: { ...source.gameplay },
    accessibility: { ...source.accessibility },
    language: { ...source.language },
    performance: { ...source.performance },
    hud: { ...source.hud, layout: { ...(source.hud?.layout || {}) } },
    notifications: { ...source.notifications },
    privacy: { ...source.privacy },
    account: { ...source.account },
    advanced: { ...source.advanced },
    bindings: Object.fromEntries(
      Object.entries(source.bindings || {}).map(([key, codes]) => [key, [...codes]]),
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
  const ext = sanitizeExtendedSettings(source);
  const gameplay = source.gameplay && typeof source.gameplay === 'object' ? source.gameplay : {};
  const quality = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
  const legacyPreset = source.graphics?.preset
    ? ext.graphics.preset
    : ['low', 'medium', 'med', 'high', 'ultra', 'custom'].includes(gameplay.graphicsPreset)
      ? gameplay.graphicsPreset === 'med' ? 'medium' : gameplay.graphicsPreset
      : ext.graphics.preset;
  const particleDensity = ['off', 'low', 'full'].includes(gameplay.particleDensity)
    ? gameplay.particleDensity
    : ext.graphics.particleQuality === 'low' ? 'low' : ext.graphics.particleQuality === 'medium' ? 'low' : 'full';
  const screenShake = ['off', 'low', 'full'].includes(gameplay.screenShake)
    ? gameplay.screenShake
    : ext.accessibility.reduceShake ? 'low' : ext.gameplay.screenShake;
  const resolutionScale = clamp(num(gameplay.resolutionScale, ext.graphics.renderScale / 100), 0.5, 2);

  return {
    ...ext,
    version: SETTINGS_VERSION,
    audio: { ...ext.audio },
    graphics: { ...ext.graphics, preset: legacyPreset },
    gameplay: {
      ...ext.gameplay,
      screenShake,
      reduceFlashing: gameplay.reduceFlashing === undefined ? ext.accessibility.reduceFlashing : Boolean(gameplay.reduceFlashing),
      highContrast: gameplay.highContrast === undefined ? ext.accessibility.highContrast : Boolean(gameplay.highContrast),
      colorblind: gameplay.colorblind === undefined ? ext.accessibility.colorblind !== 'off' : Boolean(gameplay.colorblind),
      textSize: gameplay.textSize === 'large' ? 'large' : ext.accessibility.textSize,
      fpsCounter: gameplay.fpsCounter === undefined ? ext.display.showFps : Boolean(gameplay.fpsCounter),
      frameCap: [0, 30, 60, 90, 120, 144].includes(Number(gameplay.frameCap)) ? Number(gameplay.frameCap) : ext.graphics.frameRateLimit,
      gamepad: gameplay.gamepad === undefined ? ext.controls.gamepad : Boolean(gameplay.gamepad),
      graphicsPreset: legacyPreset,
      particleDensity,
      qualityBias: clamp(Math.round(num(gameplay.qualityBias, defaults.gameplay.qualityBias)), 0, 100),
      antiAliasing: gameplay.antiAliasing === undefined ? ext.graphics.antiAliasing !== 'off' : Boolean(gameplay.antiAliasing),
      fov: clamp(Math.round(num(gameplay.fov, 100)), 80, 120),
      renderDistance: clamp(Math.round(num(gameplay.renderDistance, 100)), 50, 100),
      shadowQuality: quality(gameplay.shadowQuality, ['off', 'low', 'medium', 'high'], ext.graphics.shadowQuality === 'ultra' ? 'high' : ext.graphics.shadowQuality),
      lightingQuality: quality(gameplay.lightingQuality, ['low', 'medium', 'high', 'ultra'], ext.graphics.lightingQuality),
      textureQuality: quality(gameplay.textureQuality, ['low', 'medium', 'high', 'ultra'], ext.graphics.textureQuality),
      vfxQuality: quality(gameplay.vfxQuality, ['low', 'medium', 'high', 'ultra'], ext.graphics.particleQuality),
      animationQuality: quality(gameplay.animationQuality, ['low', 'medium', 'high', 'ultra'], ext.performance.animationQuality),
      resolutionScale: Math.round(resolutionScale * 100) / 100,
      backgroundEffects: gameplay.backgroundEffects === undefined ? true : Boolean(gameplay.backgroundEffects),
      difficulty: ext.gameplay.difficulty,
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
