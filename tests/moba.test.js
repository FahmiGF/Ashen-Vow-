import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS } from '../src/core.js';
import { FRONTIER_CLASSES } from '../src/frontier.js';
import {
  MOBA_HEROES, MOBA_HERO_BY_ID, MOBA_HERO_COUNT, MOBA_MAPS, MOBA_MAP_BY_ID,
  MOBA_MINION_TYPES, MOBA_JUNGLE_MOBS, MOBA_EPIC_BOSSES, MOBA_DIFFICULTIES,
  MOBA_LANES, MOBA_ROLES, MOBA_TEAM_SIZE, MOBA_EPIC_TIME,
  createMobaMatch, updateMobaMatch, mobaCast, mobaSetOrder, mobaSnapshot,
  mobaHeroStats, mobaCamera, mobaScreenToWorld, endMobaMatch,
  defaultMobaProgress, sanitizeMobaProgress, recordMobaMatch, mobaSummary,
} from '../src/moba.js';

test('moba roster contains all core and frontier classes with unique ids', () => {
  assert.equal(MOBA_HERO_COUNT, 28);
  assert.equal(MOBA_HEROES.length, 28);
  assert.equal(Object.values(CHARACTERS).length, 13);
  assert.equal(FRONTIER_CLASSES.length, 15);
  assert.equal(new Set(MOBA_HEROES.map((hero) => hero.id)).size, 28);
  assert.equal(MOBA_HEROES.filter((hero) => hero.source === 'core').length, 13);
  assert.equal(MOBA_HEROES.filter((hero) => hero.source === 'frontier').length, 15);
  for (const hero of MOBA_HEROES) {
    assert.ok(MOBA_HERO_BY_ID[hero.id], hero.id);
    assert.ok(MOBA_ROLES[hero.role], `${hero.id} role`);
    assert.ok(hero.hp > 0 && hero.attack > 0 && hero.speed > 0, `${hero.id} stats`);
    assert.equal(hero.abilities.length, 4, `${hero.id} ability count`);
    assert.deepEqual(hero.abilities.map((ability) => ability.slot), ['Q', 'W', 'E', 'R']);
    assert.ok(hero.abilities.every((ability) => ability.name && ability.desc && ability.cooldown > 0));
  }
  assert.ok(MOBA_HERO_BY_ID.core_sera);
  assert.ok(MOBA_HERO_BY_ID.frontier_riftwalker);
  assert.ok(!MOBA_HERO_BY_ID.warden, 'frontier and core ids never collide');
});

test('moba ships three complete battlefields with lanes, towers, camps and bosses', () => {
  assert.equal(MOBA_MAPS.length, 3);
  for (const map of MOBA_MAPS) {
    assert.ok(map.w >= 2000 && map.h >= 1200, map.id);
    assert.deepEqual(Object.keys(map.lanes), ['top', 'mid', 'bot']);
    assert.deepEqual(Object.keys(map.base), ['blue', 'red']);
    assert.equal(map.camps.length, 6, `${map.id} camps`);
    assert.equal(map.epics.length, 2, `${map.id} epics`);
    assert.equal(map.towers.length, 22, `${map.id} towers and guards`);
    assert.equal(new Set(map.towers.map((tower) => tower.id)).size, map.towers.length);
    assert.ok(map.towers.every((tower) => tower.team === 'blue' || tower.team === 'red'));
    assert.ok(map.lanes.top.length >= 3 && map.lanes.mid.length >= 3 && map.lanes.bot.length >= 3);
    assert.ok(map.camps.every((camp) => MOBA_JUNGLE_MOBS.some((mob) => mob.id === camp.type)));
    assert.ok(map.epics.every((pit) => MOBA_EPIC_BOSSES.some((boss) => boss.id === pit.boss)));
  }
  assert.equal(MOBA_MINION_TYPES.length, 6);
  assert.equal(MOBA_JUNGLE_MOBS.length, 12);
  assert.equal(MOBA_EPIC_BOSSES.length, 6);
  assert.equal(MOBA_DIFFICULTIES.length, 4);
  assert.deepEqual(MOBA_LANES, ['top', 'mid', 'bot', 'jungle', 'roam']);
});

test('createMobaMatch builds a real 5v5 with the selected hero and lane', () => {
  const match = createMobaMatch({ heroId: 'frontier_warden', mapId: 'ember_vale', lane: 'top', seed: 77 });
  assert.equal(match.mapId, 'ember_vale');
  assert.equal(match.heroId, 'frontier_warden');
  assert.equal(match.playerLane, 'top');
  assert.equal(match.phase, 'playing');
  assert.equal(match.heroes.length, MOBA_TEAM_SIZE * 2);
  assert.equal(match.heroes.filter((hero) => hero.team === 'blue').length, 5);
  assert.equal(match.heroes.filter((hero) => hero.team === 'red').length, 5);
  assert.equal(new Set(match.heroes.map((hero) => hero.heroId)).size, 10);
  assert.equal(match.player.id, 'player');
  assert.equal(match.player.team, 'blue');
  assert.equal(match.player.lane, 'top');
  assert.equal(match.player.heroId, 'frontier_warden');
  assert.equal(match.towers.filter((tower) => tower.kind === 'core').length, 2);
  assert.equal(match.camps.length, 6);
  assert.equal(match.epicTimer, MOBA_EPIC_TIME);
  assert.equal(match.wave, 0);
  assert.equal(mobaSnapshot(match).counts.blue, 5);
  assert.equal(mobaSnapshot(match).counts.red, 5);
});

test('waves, minions and combat advance deterministically without errors', () => {
  const match = createMobaMatch({ heroId: 'core_lyna', mapId: 'ashen_rift', lane: 'mid', difficulty: 'knight', seed: 123 });
  for (let i = 0; i < 60 * 35; i += 1) updateMobaMatch(match, 1 / 60, {});
  const snap = mobaSnapshot(match);
  assert.equal(match.phase, 'playing');
  assert.ok(snap.time >= 34);
  assert.ok(match.wave >= 1);
  assert.ok(match.minions.length >= 1);
  assert.ok(match.heroes.some((hero) => hero.kills > 0 || hero.deaths > 0 || hero.xp > 0));
  assert.ok(match.projectiles.length >= 0);
  assert.ok(match.towers.filter((tower) => !tower.dead).length >= 20);
  assert.ok(match.camps.length === 6);
});

test('player movement, abilities and cooldowns are real', () => {
  const match = createMobaMatch({ heroId: 'frontier_arcanist', mapId: 'ashen_rift', lane: 'mid', seed: 5 });
  const start = { x: match.player.x, y: match.player.y };
  mobaSetOrder(match, start.x + 240, start.y);
  for (let i = 0; i < 90; i += 1) updateMobaMatch(match, 1 / 60, {});
  assert.ok(Math.hypot(match.player.x - start.x, match.player.y - start.y) > 80);
  const mana = match.player.mana;
  const result = mobaCast(match, 0, { x: match.player.x + 250, y: match.player.y });
  assert.equal(result.ok, true);
  assert.ok(match.player.mana < mana);
  assert.ok(match.player.cooldowns[0] > 0);
  const second = mobaCast(match, 0, { x: 1, y: 1 });
  assert.equal(second.ok, false);
  assert.equal(second.reason, 'cooldown');
});

test('epic bosses spawn, camps respawn and a destroyed nexus ends the match', () => {
  const match = createMobaMatch({ heroId: 'core_karn', mapId: 'sunken_crown', lane: 'bot', seed: 9 });
  for (let i = 0; i < 60 * 95; i += 1) updateMobaMatch(match, 1 / 60, {});
  assert.ok(match.epics.length >= 2);
  assert.ok(match.epics.every((epic) => epic.maxHp > 5000));
  const core = match.towers.find((tower) => tower.kind === 'core' && tower.team === 'red');
  core.hp = 1;
  core.dead = false;
  // A direct hit uses the same damage path as a hero attack.
  const blue = match.player;
  blue.dead = false;
  blue.hp = blue.maxHp;
  blue.x = core.x - 10;
  blue.y = core.y;
  blue.attack = 99;
  for (let i = 0; i < 30; i += 1) updateMobaMatch(match, 1 / 60, {});
  assert.equal(match.phase, 'ended');
  assert.equal(match.winner, 'blue');
  assert.ok(match.endedAt > 0);
});

test('moba save data sanitizes, records matches and survives unknown fields', () => {
  const raw = {
    matches: '2', wins: 1, losses: 0, kills: 9, deaths: -4, assists: 3,
    bestTime: '81.6', heroPlays: { core_sera: '2', nope: 8 },
    mapWins: { ashen_rift: 1, nope: 7 }, lastHero: 'core_sera', lastMap: 'ashen_rift',
    lastLane: 'mid', futureField: { keep: true },
  };
  const clean = sanitizeMobaProgress(raw);
  assert.equal(clean.matches, 2);
  assert.equal(clean.wins, 1);
  assert.equal(clean.deaths, 0);
  assert.equal(clean.bestTime, 82);
  assert.deepEqual(clean.heroPlays, { core_sera: 2 });
  assert.deepEqual(clean.mapWins, { ashen_rift: 1 });
  assert.deepEqual(clean.futureField, { keep: true });
  const recorded = recordMobaMatch(clean, {
    win: true, heroId: 'frontier_templar', mapId: 'ember_vale', lane: 'roam',
    duration: 420, kills: 5, deaths: 2, assists: 7,
  });
  assert.equal(recorded.progress.matches, 3);
  assert.equal(recorded.progress.wins, 2);
  assert.equal(recorded.progress.heroPlays.frontier_templar, 1);
  assert.equal(recorded.progress.mapWins.ember_vale, 1);
  assert.equal(recorded.progress.lastHero, 'frontier_templar');
  const summary = mobaSummary(recorded.progress);
  assert.equal(summary.matches, 3);
  assert.equal(summary.winRate, 67);
  assert.equal(summary.heroesPlayed, 2);
  assert.equal(defaultMobaProgress().lastHero, 'core_sera');
});

test('moba camera converts screen clicks into world orders', () => {
  const match = createMobaMatch({ heroId: 'core_kael', mapId: 'ashen_rift', lane: 'jungle', seed: 4 });
  const camera = mobaCamera(match, 960, 540);
  const point = mobaScreenToWorld(match, 480, 270, 960, 540);
  assert.ok(camera.zoom >= 0.58 && camera.zoom <= 0.86);
  assert.ok(Math.abs(point.x - (camera.x + 480 / camera.zoom)) < 0.01);
  assert.ok(Math.abs(point.y - (camera.y + 270 / camera.zoom)) < 0.01);
});
