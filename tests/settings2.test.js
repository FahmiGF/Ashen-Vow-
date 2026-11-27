import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SETTINGS_CATEGORIES, SETTING_DEFINITIONS, GRAPHICS_PRESETS, AUDIO_CHANNELS,
  LANGUAGES, defaultExtendedSettings, sanitizeExtendedSettings,
  applyGraphicsPreset, markGraphicsCustom, searchSettings, getSettingsValue,
  setSettingsValue,
} from '../src/settings2.js';
import {
  DIFFICULTIES, DIFFICULTY_BY_ID, difficultyConfig, difficultyUnlocked,
} from '../src/difficulty.js';
import { defaultSettings, sanitizeSettings, loadSettings, saveSettings, SETTINGS_KEY } from '../src/settings.js';
import { AshenGame } from '../src/core.js';
import { Ashen3DGame, MODE3D_REGIONS, MODE3D_REGION_LIST, render3D } from '../src/mode3d.js';

test('Settings 2.0 exposes all fourteen categories and unique searchable definitions', () => {
  assert.equal(SETTINGS_CATEGORIES.length, 14);
  assert.deepEqual(SETTINGS_CATEGORIES.map((entry) => entry.id), [
    'graphics', 'display', 'audio', 'controls', 'gameplay', 'difficulty', 'accessibility',
    'language', 'performance', 'interface', 'notifications', 'privacy', 'account', 'advanced',
  ]);
  assert.ok(SETTING_DEFINITIONS.length >= 100);
  const paths = SETTING_DEFINITIONS.map((entry) => entry.path);
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(searchSettings('shadow').some((entry) => entry.path === 'graphics.shadowQuality'));
  assert.ok(searchSettings('music').some((entry) => entry.category === 'audio'));
  assert.equal(searchSettings('').length, 0);
});

test('graphics presets update real settings and manual edits become Custom', () => {
  const settings = defaultExtendedSettings();
  applyGraphicsPreset(settings, 'low');
  assert.equal(settings.graphics.preset, 'low');
  assert.equal(settings.graphics.renderScale, 65);
  assert.equal(settings.graphics.particleQuality, 'low');
  assert.equal(settings.graphics.rayTracing, 'off');
  applyGraphicsPreset(settings, 'ultra');
  assert.equal(settings.graphics.renderScale, 115);
  assert.equal(settings.graphics.volumetricFog, 'high');
  settings.graphics.shadowQuality = 'medium';
  markGraphicsCustom(settings);
  assert.equal(settings.graphics.preset, 'custom');
  assert.equal(settings.graphics.shadowQuality, 'medium');
});

test('audio channels are independent, clamped, and survive sanitization', () => {
  assert.equal(AUDIO_CHANNELS.length, 10);
  const settings = defaultExtendedSettings();
  settings.audio.music = 0;
  settings.audio.sfx = 91;
  settings.audio.master = 999;
  settings.audio.ambient = -10;
  const result = sanitizeExtendedSettings(settings);
  assert.equal(result.audio.music, 0);
  assert.equal(result.audio.sfx, 91);
  assert.equal(result.audio.master, 100);
  assert.equal(result.audio.ambient, 0);
  result.audio.dialogue = 74;
  assert.equal(result.audio.sfx, 91, 'changing dialogue must not touch SFX');
});

test('settings v2 persist under the existing key and preserve legacy fields', () => {
  const settings = defaultSettings();
  assert.equal(settings.version, 2);
  settings.audio.music = 12;
  settings.graphics.preset = 'custom';
  settings.display.uiScale = 130;
  settings.language.interface = 'ar';
  const storage = new Map();
  const store = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)) };
  assert.equal(saveSettings(store, settings), true);
  assert.ok(storage.get(SETTINGS_KEY));
  const loaded = loadSettings(store);
  assert.equal(loaded.audio.music, 12);
  assert.equal(loaded.graphics.preset, 'custom');
  assert.equal(loaded.display.uiScale, 130);
  assert.equal(loaded.language.interface, 'ar');
  assert.equal(loaded.gameplay.screenShake, 'full');
});

test('six difficulty profiles change actual enemy, boss, and incoming-damage behavior', () => {
  assert.equal(DIFFICULTIES.length, 6);
  assert.equal(DIFFICULTY_BY_ID.abyssal.enemyDamage > DIFFICULTY_BY_ID.story.enemyDamage, true);
  assert.equal(difficultyUnlocked('nightmare', { cleared: [] }), false);
  assert.equal(difficultyUnlocked('nightmare', { cleared: [true, true, true] }), true);
  const normal = new AshenGame();
  const easy = new AshenGame();
  const abyssal = new AshenGame();
  easy.setDifficulty('easy');
  abyssal.setDifficulty('abyssal');
  const base = normal.spawnEnemy({ type: 'crawler', x: 100, minX: 40, maxX: 700 });
  const easyEnemy = easy.spawnEnemy({ type: 'crawler', x: 100, minX: 40, maxX: 700 });
  const hardEnemy = abyssal.spawnEnemy({ type: 'crawler', x: 100, minX: 40, maxX: 700 });
  assert.ok(easyEnemy.maxHp < base.maxHp);
  assert.ok(hardEnemy.maxHp > base.maxHp);
  assert.equal(hardEnemy.aggroMul, 1.4);
  assert.equal(hardEnemy.attackRate, 1.38);
  const story = new AshenGame();
  story.setDifficulty('story');
  story.player.invuln = 0;
  story.damagePlayer(20, 0);
  assert.equal(story.player.hp, story.player.maxHp - 10);
  const hard = new AshenGame();
  hard.setDifficulty('abyssal');
  hard.player.invuln = 0;
  hard.damagePlayer(20, 0);
  assert.equal(hard.player.hp, hard.player.maxHp - 32);
  normal.reset();
  assert.equal(normal.campaignDifficulty, 'normal');
});

test('all six illustrated 3D regions are playable and render more than primitives', () => {
  assert.equal(Object.keys(MODE3D_REGIONS).length, 6);
  assert.equal(MODE3D_REGION_LIST.length, 6);
  const game = new Ashen3DGame({ region: 'infernal' });
  assert.equal(game.region, 'infernal');
  assert.ok(game.scenery.length >= 10);
  assert.equal(game.setRegion('astral'), true);
  assert.equal(game.region, 'astral');
  const ops = [];
  const gradient = { addColorStop() {} };
  const mock = new Proxy({
    createLinearGradient: () => gradient, createRadialGradient: () => gradient,
    measureText: () => ({ width: 40 }), fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '',
  }, {
    get(target, key) {
      if (key in target) return target[key];
      return (...args) => ops.push([String(key), ...args]);
    },
    set(target, key, value) { target[key] = value; return true; },
  });
  render3D(mock, game);
  assert.ok(ops.length > 200, `illustrated renderer produced ${ops.length} draw operations`);
});

test('settings value helpers resolve nested paths without mutating unrelated sections', () => {
  const settings = defaultExtendedSettings();
  setSettingsValue(settings, 'hud.opacity', 45);
  assert.equal(getSettingsValue(settings, 'hud.opacity'), 45);
  assert.equal(settings.hud.scale, 100);
  assert.equal(LANGUAGES.length, 14);
});

test('particle multiplier, budget, and hard cap scale smoothly for dense effects', () => {
  const settings = defaultExtendedSettings();
  assert.equal(settings.graphics.particleMultiplier, 1);
  applyGraphicsPreset(settings, 'extreme');
  assert.equal(settings.graphics.particleMultiplier, 2.5);
  const maxed = sanitizeExtendedSettings({
    graphics: { particleMultiplier: 10 },
    performance: { particleBudget: 99999 },
    advanced: { maxParticles: 99999 },
  });
  assert.equal(maxed.graphics.particleMultiplier, 4);
  assert.equal(maxed.performance.particleBudget, 6000);
  assert.equal(maxed.advanced.maxParticles, 12000);
});
