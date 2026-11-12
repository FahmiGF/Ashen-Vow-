import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIONS,
  SETTINGS_KEY,
  defaultSettings,
  sanitizeSettings,
  loadSettings,
  saveSettings,
  actionForCode,
  findConflict,
  applyBinding,
  resetActionBindings,
  resetAllBindings,
  formatCode,
  gamepadActions,
} from '../src/settings.js';
import {
  MAP_LAYOUT,
  MAX_PINS,
  defaultMapState,
  sanitizeMapState,
  discoverRoom,
  addPin,
  removePin,
  mapNodes,
  mapStats,
  roomFeatures,
} from '../src/map.js';
import { ROOMS } from '../src/core.js';
import { ZONES, ZONE_IDS, ROOM_ZONES, zoneForRoom, zoneMusicForRoom } from '../src/zones.js';
import { TRACKS, trackForZone, MusicManager } from '../src/music.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

test('default settings define one or two unique bindings per action', () => {
  const settings = defaultSettings();
  assert.equal(ACTIONS.length, 14);
  const used = new Set();
  for (const action of ACTIONS) {
    const codes = settings.bindings[action.id];
    assert.ok(codes.length >= 1 && codes.length <= 2, `${action.id} needs one or two slots`);
    for (const code of codes) {
      assert.ok(!used.has(code), `${code} must be unique`);
      used.add(code);
    }
  }
  assert.deepEqual(settings.bindings.inventory, ['KeyI']);
  assert.deepEqual(settings.bindings.cycleItem, ['KeyR']);
  assert.deepEqual(settings.bindings.ability, ['KeyU', 'KeyV']);
  assert.equal(settings.audio.master, 80);
  assert.equal(settings.gameplay.screenShake, 'full');
});

test('sanitizeSettings clamps values, rejects unknown keys, and fills missing bindings', () => {
  const settings = sanitizeSettings({
    audio: { master: 999, music: -20, sfx: 'x', muted: 1 },
    gameplay: { screenShake: 'nope', frameCap: 999, textSize: 'huge' },
    bindings: { left: ['KeyQ', 'KeyQ', 'NotAKey'], jump: [] },
  });
  assert.equal(settings.audio.master, 100);
  assert.equal(settings.audio.music, 0);
  assert.equal(settings.audio.sfx, 80);
  assert.equal(settings.audio.muted, true);
  assert.equal(settings.gameplay.screenShake, 'full');
  assert.equal(settings.gameplay.frameCap, 60);
  assert.equal(settings.gameplay.textSize, 'normal');
  assert.equal(settings.bindings.left.length, 2);
  assert.equal(settings.bindings.left[0], 'KeyQ');
  assert.notEqual(settings.bindings.left[0], settings.bindings.left[1]);
  assert.equal(settings.bindings.jump.length, 2);
});

test('settings persist under their own key and survive a reload', () => {
  const storage = memoryStorage();
  const settings = defaultSettings();
  settings.audio.music = 12;
  settings.bindings.attack = ['KeyO', 'KeyP'];
  assert.equal(saveSettings(storage, settings), true);
  assert.ok(storage.getItem(SETTINGS_KEY));
  const loaded = loadSettings(storage);
  assert.equal(loaded.audio.music, 12);
  assert.deepEqual(loaded.bindings.attack, ['KeyO', 'KeyP']);
  assert.equal(loadSettings(memoryStorage({ [SETTINGS_KEY]: '{broken' })).audio.music, 55);
});

test('actionForCode follows the current bindings', () => {
  const settings = defaultSettings();
  assert.equal(actionForCode(settings, 'KeyA'), 'left');
  assert.equal(actionForCode(settings, 'Escape'), 'pause');
  assert.equal(actionForCode(settings, 'KeyO'), null);
  settings.bindings.left = ['KeyO', 'KeyI'];
  assert.equal(actionForCode(settings, 'KeyO'), 'left');
});

test('rebinding swaps with the conflicting action instead of losing a control', () => {
  const settings = defaultSettings();
  // KeyA belongs to left; bind it to right's primary slot.
  assert.deepEqual(findConflict(settings, 'right', 'KeyA'), { action: 'left', slot: 0 });
  const result = applyBinding(settings, 'right', 0, 'KeyA');
  assert.equal(result.conflict, 'left');
  assert.equal(result.settings.bindings.right[0], 'KeyA');
  assert.equal(result.settings.bindings.left[0], 'KeyD');
  assert.equal(actionForCode(result.settings, 'KeyA'), 'right');
  // No duplicate keys anywhere.
  const all = Object.values(result.settings.bindings).flat().filter(Boolean);
  assert.equal(new Set(all).size, all.length);
});

test('reset helpers restore defaults', () => {
  let settings = defaultSettings();
  settings.bindings.attack = ['KeyO', 'KeyP'];
  const one = resetActionBindings(settings, 'attack');
  assert.deepEqual(one.bindings.attack, ['KeyJ', 'KeyZ']);
  const all = resetAllBindings(settings);
  assert.deepEqual(all.bindings, defaultSettings().bindings);
});

test('formatCode produces readable labels', () => {
  assert.equal(formatCode('KeyJ'), 'J');
  assert.equal(formatCode('Space'), 'SPACE');
  assert.equal(formatCode('ShiftLeft'), 'LSHIFT');
  assert.equal(formatCode('ArrowLeft'), '←');
  assert.equal(formatCode(''), '—');
});

test('gamepadActions maps standard buttons and axis deadzones', () => {
  const buttons = Array.from({ length: 16 }, () => ({ pressed: false }));
  buttons[0].pressed = true;
  buttons[9].pressed = true;
  const held = gamepadActions({ buttons, axes: [-0.9, 0] });
  assert.ok(held.has('jump'));
  assert.ok(held.has('pause'));
  assert.ok(held.has('left'));
  assert.ok(!held.has('right'));
  assert.equal(gamepadActions(null).size, 0);
});

test('map layout covers every room with valid exits', () => {
  assert.equal(MAP_LAYOUT.length, ROOMS.length);
  MAP_LAYOUT.forEach((node, index) => {
    assert.ok(Number.isInteger(node.gridX));
    assert.ok(Number.isInteger(node.gridY));
    for (const exit of node.exits) {
      assert.ok(exit >= 0 && exit < ROOMS.length, `exit ${exit} of ${index} exists`);
      assert.ok(MAP_LAYOUT[exit].exits.includes(index), `exit ${index} <-> ${exit} is two-way`);
    }
  });
});

test('fog of war reveals neighbours as faint outlines', () => {
  let state = defaultMapState(ROOMS.length);
  assert.equal(mapNodes(ROOMS, MAP_LAYOUT, state).every((n) => !n.discovered && !n.adjacent), true);
  state = discoverRoom(state, 0);
  let nodes = mapNodes(ROOMS, MAP_LAYOUT, state);
  assert.equal(nodes[0].discovered, true);
  assert.equal(nodes[1].adjacent, true);
  assert.equal(nodes[2].adjacent, false);
  state = discoverRoom(state, 1);
  nodes = mapNodes(ROOMS, MAP_LAYOUT, state);
  assert.equal(nodes[2].adjacent, true);
  // Immutable update: the original state is untouched.
  assert.equal(defaultMapState(ROOMS.length).discovered[0], false);
});

test('map stats count discovery, bosses, relics and pins', () => {
  let state = defaultMapState(ROOMS.length);
  state = discoverRoom(state, 0);
  state = discoverRoom(state, 1);
  state = discoverRoom(state, 2);
  const cleared = ROOMS.map(() => false);
  cleared[1] = true;
  cleared[2] = true;
  const stats = mapStats(state, ROOMS, cleared);
  assert.equal(stats.discovered, 3);
  assert.equal(stats.discoveredPct, 21);
  assert.equal(stats.cleared, 2);
  assert.equal(stats.bossesTotal, 6);
  assert.equal(stats.bossesDefeated, 1);
  assert.equal(stats.relicsTotal, 1);
  assert.equal(stats.relicsFound, 1);
});

test('pins are sanitized, capped and removable', () => {
  let state = defaultMapState(ROOMS.length);
  for (let i = 0; i < MAX_PINS + 2; i++) {
    const result = addPin(state, { x: i * 10, y: 20, type: 'note' });
    state = result.state;
    if (i >= MAX_PINS) assert.equal(result.ok, false);
  }
  assert.equal(state.pins.length, MAX_PINS);
  const removed = removePin(state, 0);
  assert.equal(removed.removed, true);
  assert.equal(removed.state.pins.length, MAX_PINS - 1);
  const sanitized = sanitizeMapState({ pins: [{ x: 1, y: 2, type: 'bogus' }, { x: 'no' }] });
  assert.equal(sanitized.pins.length, 1);
  assert.equal(sanitized.pins[0].type, 'note');
});

test('room features derive from room config', () => {
  assert.deepEqual(roomFeatures(ROOMS[2]), ['shrine', 'boss', 'gate']);
  assert.deepEqual(roomFeatures(ROOMS[1]), ['relic', 'gate']);
});

test('every room maps to a known zone with its own track', () => {
  assert.equal(ROOM_ZONES.length, ROOMS.length);
  for (let i = 0; i < ROOMS.length; i++) {
    const zone = zoneForRoom(i);
    assert.ok(ZONE_IDS.includes(zone.id));
    assert.equal(zoneMusicForRoom(i), zone.music);
    assert.ok(TRACKS[zone.music], `${zone.id} has a track`);
    assert.ok(zone.palette.top && zone.palette.glow);
    assert.ok(zone.particle);
  }
  assert.ok(ZONES.mycelial && ZONES.cistern && ZONES.frostglass && ZONES.cinder);
  assert.equal(trackForZone('mycelial').id, 'mycelial');
  assert.equal(trackForZone('unknown').id, 'ashen');
});

test('music manager is safe without an AudioContext', () => {
  const manager = new MusicManager(null);
  assert.equal(manager.play('menu'), false);
  assert.equal(manager.crossfadeTo('boss'), false);
  manager.setVolume(0.4);
  manager.setLayer('combat', 0.5);
  manager.stop();
  assert.equal(manager.trackId, null);
});
