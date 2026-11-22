// Update XVII — 3D Scary Mode: Blackveil Nightfall.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  HORROR3D_SAVE_KEY,
  HORROR3D_SITES,
  HORROR3D_SITE_BY_ID,
  HORROR3D_SCHEMA_VERSION,
  HORROR3D_ACHIEVEMENTS,
  default3DHorrorSave,
  sanitize3DHorrorSave,
  record3DHorrorResult,
  horror3DSummary,
  horror3DScenery,
} from '../src/mode3d_horror.js';
import { MODE3D_AREAS, contentSummary } from '../src/mode3d_content.js';
import { Ashen3DGame } from '../src/mode3d.js';

test('five 3D sites cover manor, asylum, chapel, mill and lighthouse', () => {
  assert.equal(HORROR3D_SITES.length, 5);
  assert.equal(HORROR3D_SAVE_KEY, 'ashen-vow-3dhorror-v1');
  assert.equal(HORROR3D_SCHEMA_VERSION, 1);
  assert.deepEqual(HORROR3D_SITES.map((site) => site.building), ['manor', 'asylum', 'chapel', 'mill', 'lighthouse']);
  assert.equal(new Set(HORROR3D_SITES.map((site) => site.id)).size, 5);
  assert.equal(new Set(HORROR3D_SITES.map((site) => site.areaId)).size, 5);
  assert.equal(new Set(HORROR3D_SITES.map((site) => site.exit.z)).size >= 1, true);
});

test('each site has three phases, four authored scares and three collectible echoes', () => {
  for (const site of HORROR3D_SITES) {
    assert.equal(site.phases.length, 3, `${site.id} has three phases`);
    assert.equal(site.scares.length, 4, `${site.id} has four scares`);
    assert.equal(site.echoes.length, 3, `${site.id} has three echoes`);
    assert.equal(new Set(site.echoes.map((echo) => echo.id)).size, 3);
    assert.ok(site.entity.name && site.entity.speed > 0 && site.entity.damage > 0);
    assert.ok(site.exit.x >= -300 && site.exit.x <= 300);
    assert.ok(site.exit.z > 0 && site.exit.z <= 1100);
    for (const phase of site.phases) assert.ok(phase.title && phase.objective);
    for (const scare of site.scares) assert.ok(scare.id && scare.shape && scare.line);
  }
});

test('the 3D content pack appends real horror areas without touching authored areas', () => {
  assert.equal(MODE3D_AREAS.length, 15);
  assert.equal(contentSummary().horrorSites, 5);
  for (const site of HORROR3D_SITES) {
    const area = MODE3D_AREAS.find((entry) => entry.id === site.areaId);
    assert.ok(area, `${site.areaId} is a real 3D area`);
    assert.equal(area.horror, true);
    assert.equal(area.horrorSite, site.id);
    assert.equal(area.boss, null);
    assert.deepEqual(area.enemies, []);
  }
  assert.equal(new Set(MODE3D_AREAS.map((area) => area.id)).size, 15);
});

test('scenery places one authored building and the site props at world positions', () => {
  for (const site of HORROR3D_SITES) {
    const scenery = horror3DScenery(site.id);
    assert.equal(scenery.length, site.props.length + 5);
    const building = scenery[0];
    assert.equal(building.type, site.building);
    assert.equal(building.horrorSite, site.id);
    assert.ok(building.z > 700 && building.scale > 0);
    const echoes = scenery.filter((item) => item.type === 'echo_rune');
    assert.equal(echoes.length, 3);
    assert.deepEqual(echoes.map((item) => item.echoId), site.echoes.map((echo) => echo.id));
    assert.ok(scenery.some((item) => item.type === 'exitgate' && item.z === site.exit.z));
    for (const prop of scenery.slice(1)) assert.equal(prop.horrorSite, site.id);
  }
  assert.deepEqual(horror3DScenery('missing'), []);
});

test('save sanitizer fills defaults, clamps junk and preserves valid records', () => {
  const empty = sanitize3DHorrorSave(null);
  assert.deepEqual(empty, default3DHorrorSave());
  const repaired = sanitize3DHorrorSave({
    runs: -4,
    clears: 3.9,
    deaths: '12',
    scares: 99999999,
    bestTime: -1,
    lastSite: 'not_real',
    lastResult: 'nope',
    achievements: ['nightfall_first', 'nightfall_first', 7, 'ghost'],
    settings: { intensity: 'nope', antiJumpscare: true, firstPerson: false },
    sites: {
      blackveil_manor: { attempts: 2, clears: 1, deaths: -2, scares: 8, bestTime: 140.4, lastResult: 'cleared' },
      missing: { attempts: 10 },
    },
  });
  assert.equal(repaired.runs, 0);
  assert.equal(repaired.clears, 4);
  assert.equal(repaired.deaths, 12);
  assert.equal(repaired.scares, 1000000);
  assert.equal(repaired.bestTime, null);
  assert.equal(repaired.lastSite, null);
  assert.deepEqual(repaired.achievements, ['nightfall_first']);
  assert.equal(repaired.settings.intensity, 'full');
  assert.equal(repaired.settings.antiJumpscare, true);
  assert.equal(repaired.settings.firstPerson, false);
  assert.equal(repaired.sites.blackveil_manor.attempts, 2);
  assert.equal(repaired.sites.blackveil_manor.deaths, 0);
  assert.equal(repaired.sites.missing, undefined);
});

test('recording a clear updates totals, per-site records and achievements', () => {
  const save = default3DHorrorSave();
  const first = record3DHorrorResult(save, { siteId: 'blackveil_manor', result: 'cleared', time: 154.2, scares: 4, phase: 2 });
  assert.equal(first.ok, true);
  assert.equal(save.runs, 1);
  assert.equal(save.clears, 1);
  assert.equal(save.deaths, 0);
  assert.equal(save.bestTime, 154.2);
  assert.equal(save.sites.blackveil_manor.clears, 1);
  assert.ok(save.achievements.includes('nightfall_first'));
  assert.ok(save.achievements.includes('nightfall_clear'));
  assert.ok(save.achievements.includes('nightfall_speed'));

  record3DHorrorResult(save, { siteId: 'blackveil_manor', result: 'dead', time: 90, scares: 2, phase: 1 });
  assert.equal(save.deaths, 1);
  assert.equal(save.sites.blackveil_manor.deaths, 1);
  assert.equal(save.sites.blackveil_manor.bestTime, 154.2);
  assert.equal(record3DHorrorResult(save, { siteId: 'missing', result: 'cleared' }).ok, false);
  assert.equal(record3DHorrorResult(save, { siteId: 'blackveil_manor', result: 'other' }).ok, false);
});

test('summary reports all five sites and earned progress', () => {
  const save = default3DHorrorSave();
  record3DHorrorResult(save, { siteId: 'blackveil_manor', result: 'cleared', time: 120, scares: 3, phase: 2 });
  record3DHorrorResult(save, { siteId: 'saint_orra', result: 'dead', time: 80, scares: 5, phase: 1 });
  const summary = horror3DSummary(save);
  assert.equal(summary.totalSites, 5);
  assert.equal(summary.clearedSites, 1);
  assert.equal(summary.runs, 2);
  assert.equal(summary.deaths, 1);
  assert.equal(summary.scares, 8);
  assert.equal(summary.sites.find((site) => site.id === 'blackveil_manor').cleared, true);
  assert.equal(summary.sites.find((site) => site.id === 'saint_orra').cleared, false);
  assert.equal(summary.totalAchievements, HORROR3D_ACHIEVEMENTS.length);
});

test('the live 3D engine starts a horror site in first person with the site entity', () => {
  const game = new Ashen3DGame({});
  const active = game.startHorrorSite('hollow_lighthouse', { antiJumpscare: false, intensity: 'full' });
  assert.ok(active);
  assert.equal(game.subMode, 'scary');
  assert.equal(game.areaId, 'horror_hollow_lighthouse');
  assert.equal(game.firstPerson, true);
  assert.equal(game.horror.siteId, 'hollow_lighthouse');
  assert.equal(game.player.hp, game.player.maxHp);
  assert.equal(game.enemies.length, 1);
  assert.equal(game.enemies[0].unkillable, true);
  assert.equal(game.enemies[0].name, HORROR3D_SITE_BY_ID.hollow_lighthouse.entity.name);
  assert.equal(game.scenery[0].type, 'lighthouse');
  const snapshot = game.horrorSnapshot();
  assert.equal(snapshot.phase, 0);
  assert.equal(snapshot.firstPerson, true);
  assert.equal(snapshot.collected, 0);
  const startEvents = game.drainHorrorEvents();
  assert.ok(startEvents.some((event) => event.type === 'horrorStart'));
  assert.ok(startEvents.some((event) => event.type === 'horrorScare'));
});

test('collecting all three echoes advances phases and reaching the exit clears', () => {
  const game = new Ashen3DGame({});
  game.startHorrorSite('drowned_chapel', { antiJumpscare: false });
  const site = HORROR3D_SITE_BY_ID.drowned_chapel;
  for (const echo of site.echoes) {
    game.player.x = echo.x;
    game.player.z = echo.z;
    game.update(1 / 60, { interactJustPressed: true, up: false, down: false, left: false, right: false });
    assert.equal(game.scenery.find((item) => item.echoId === echo.id).collected, true);
  }
  game.update(1 / 60, {});
  assert.equal(game.horror.collected.length, 3);
  assert.equal(game.horror.phaseIndex, 2);
  assert.ok(game.horror.scares >= 3);
  game.player.x = site.exit.x;
  game.player.z = site.exit.z - 20;
  game.update(1 / 60, {});
  assert.equal(game.horror.active, false);
  assert.equal(game.horror.result, 'cleared');
  const events = game.drainHorrorEvents();
  const cleared = events.find((event) => event.type === 'horrorCleared');
  assert.ok(cleared);
  assert.equal(cleared.siteId, 'drowned_chapel');
});

test('anti-jumpscare keeps every scare atmospheric and flash-free', () => {
  const game = new Ashen3DGame({});
  game.startHorrorSite('blackveil_manor', { antiJumpscare: true });
  assert.equal(game.horror.scare.shape, 'atmospheric');
  assert.equal(game.horror.scare.flash, 0);
  assert.equal(game.horror.scare.antiJumpscare, true);
  assert.equal(game.horror.scares, 1);
});

test('the entity damages the player and a lethal hit records horrorDead', () => {
  const game = new Ashen3DGame({});
  game.startHorrorSite('saint_orra', { antiJumpscare: true });
  const entity = game.horror.entity;
  game.horror.collected.push('orra_echo_1');
  entity.x = game.player.x;
  entity.z = game.player.z;
  entity.attackCd = 10;
  game.player.hp = 1;
  game.update(1 / 60, {});
  assert.equal(game.player.hp, 0);
  assert.equal(game.horror.result, 'dead');
  assert.equal(game.horror.dead, true);
  assert.ok(game.drainHorrorEvents().some((event) => event.type === 'horrorDead'));
});

test('first person hides the player but combat still staggers the unkillable entity', () => {
  const game = new Ashen3DGame({});
  game.startHorrorSite('cinder_mill', { antiJumpscare: true });
  assert.equal(game.firstPerson, true);
  const entity = game.enemies[0];
  entity.x = game.player.x + 20;
  entity.z = game.player.z;
  game.player.yaw = 0;
  game.update(1 / 60, { attackJustPressed: true });
  assert.equal(entity.hp, entity.maxHp);
  assert.ok(entity.stagger > 0);
});
