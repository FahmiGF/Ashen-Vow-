import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CRUSADE_NAME,
  CRUSADE_ARC_ID,
  CRUSADE_ROOM_START,
  CRUSADE_ROOM_COUNT,
  CRUSADE_LEVEL_COUNT,
  CRUSADE_ROOMS_PER_LEVEL,
  CRUSADE_ROOMS,
  CRUSADE_ROOM_BY_ID,
  CRUSADE_LEVELS,
  CRUSADE_LEVEL_ROOMS,
  CRUSADE_ENEMY_INFO,
  CRUSADE_ELITES,
  CRUSADE_BOSSES,
  CRUSADE_BOSS_BY_ID,
  CRUSADE_BOSS_INFO,
  CRUSADE_MAIN_BOSSES,
  CRUSADE_BANNERS,
  CRUSADE_UPGRADES,
  CRUSADE_RIFT,
  VALOR_MAX,
  VALOR_STRIKE_MIN,
  VALOR_STRIKE_COST,
  PALADIN_CHAIN_MAX,
  defaultCrusadeProgress,
  sanitizeCrusadeProgress,
  crusadeUnlocked,
  unlockCrusade,
  crusadeLevelUnlocked,
  crusadeRoomUnlocked,
  crusadeBossUnlocked,
  recordCrusadeRoom,
  recordCrusadeBoss,
  recordCrusadeDeath,
  recordCrusadeRun,
  buyCrusadeUpgrade,
  addCrusadeSigils,
  crusadeSummary,
  crusadeArchive,
  crusadeCampFigure,
  crusadeRunConfig,
  createCrusadeRun,
  valorGain,
  valorHit,
  valorBreak,
  valorMultiplier,
  valorStrikeReady,
  crusaderStrike,
  paladinChainTick,
  breakPaladinChain,
  validateCrusadeRooms,
} from '../src/crusade.js';
import { AshenGame, ALL_ROOMS, ALL_ENEMY_INFO, ALL_BOSS_INFO, ROOMS } from '../src/core.js';

const defaultFallen = (ending = 'dawn') => ({
  ascended: true,
  ending,
  endings: { dawn: ending === 'dawn', dusk: ending === 'dusk', eclipse: ending === 'eclipse' },
});

const clearHalls = (state, levelIndex) => {
  const level = CRUSADE_LEVELS[levelIndex];
  for (let slot = 0; slot < CRUSADE_ROOMS_PER_LEVEL - 1; slot += 1) recordCrusadeRoom(state, level.roomStart + slot);
  return level;
};

test('arc III defines five levels and twenty contiguous rooms after the fallen arc', () => {
  assert.equal(CRUSADE_LEVEL_COUNT, 5);
  assert.equal(CRUSADE_ROOM_COUNT, 20);
  assert.equal(CRUSADE_ROOMS.length, 20);
  assert.equal(CRUSADE_ROOM_START, 485);
  CRUSADE_ROOMS.forEach((room, i) => assert.equal(room.id, CRUSADE_ROOM_START + i));
  assert.equal(validateCrusadeRooms().ok, true);
  assert.equal(validateCrusadeRooms([{ id: 1, name: 'x', spawn: { x: 0 }, platforms: [] }]).ok, false);
  assert.equal(ROOMS.length, 14, 'legacy campaign untouched');
});

test('each level owns three halls and a boss room with chained gates', () => {
  assert.equal(CRUSADE_LEVEL_ROOMS.length, 5);
  for (const [index, level] of CRUSADE_LEVELS.entries()) {
    const rooms = CRUSADE_LEVEL_ROOMS[index];
    assert.equal(rooms.length, 4);
    assert.equal(rooms[0].id, level.roomStart);
    assert.equal(rooms[3].id, level.bossRoom);
    assert.equal(rooms[0].checkpoint.name, 'Kemah Perang');
    assert.equal(rooms[2].checkpoint.name, 'Banner Shrine');
    assert.equal(rooms[3].boss, CRUSADE_BOSS_INFO[rooms[3].boss].kind);
    for (let slot = 0; slot < 3; slot += 1) {
      assert.equal(rooms[slot].gate.next, rooms[slot].id + 1);
      assert.equal(rooms[slot].gate.requires, 'clear');
    }
  }
  for (let i = 0; i < CRUSADE_LEVEL_COUNT - 1; i += 1) {
    const bossGate = CRUSADE_ROOM_BY_ID[CRUSADE_LEVELS[i].bossRoom].gate;
    assert.equal(bossGate.next, CRUSADE_LEVELS[i + 1].roomStart);
    assert.equal(bossGate.requires, 'boss');
  }
  assert.equal(CRUSADE_ROOM_BY_ID[CRUSADE_LEVELS[4].bossRoom].gate, null);
});

test('bestiary holds fifteen mobs and six elites on engine archetypes', () => {
  const ids = Object.keys(CRUSADE_ENEMY_INFO);
  assert.equal(ids.length, 21);
  assert.equal(CRUSADE_ELITES.length, 6);
  for (const id of ids) {
    const info = CRUSADE_ENEMY_INFO[id];
    assert.ok(['chaser', 'lunge', 'ranged', 'slam', 'spawner', 'hopper'].includes(info.behavior), `${id} archetype`);
    assert.ok(info.hp > 0 && info.dmg > 0 && info.reward > 0, `${id} stats`);
  }
  assert.equal(CRUSADE_ENEMY_INFO.hollow_crusader.elite, true);
});

test('five bosses expose real phases, patterns, shields and dialogue', () => {
  assert.equal(CRUSADE_BOSSES.length, 5);
  assert.equal(CRUSADE_MAIN_BOSSES.length, 5);
  assert.equal(new Set(CRUSADE_BOSSES.map((b) => b.kind)).size, 5);
  for (const boss of CRUSADE_BOSSES) {
    const info = CRUSADE_BOSS_INFO[boss.kind];
    assert.ok(info.maxPhases >= 2);
    assert.ok(info.purityShield > 0);
    assert.ok(['slam', 'volley', 'ring', 'charge', 'summon', 'rain'].includes(info.pattern));
    assert.equal(info.phaseThresholds.length, info.maxPhases - 1);
    info.phaseThresholds.forEach((v, i) => { if (i) assert.ok(v < info.phaseThresholds[i - 1]); });
    assert.ok(info.dialogue.intro.length && info.dialogue.defeat.length);
    for (let phase = 2; phase <= info.maxPhases; phase += 1) assert.ok(info.dialogue[`phase${phase}`]);
  }
  const final = CRUSADE_BOSS_BY_ID.giant_paladin;
  assert.equal(final.phases, 3);
  assert.equal(CRUSADE_BOSS_INFO[final.kind].reward, 'victory');
  assert.equal(CRUSADE_BOSS_INFO[final.kind].purityShield, 200);
});

test('default progress is empty, shaped, and rift-locked', () => {
  const state = defaultCrusadeProgress();
  assert.equal(state.unlocked, false);
  assert.equal(state.cleared, false);
  assert.equal(state.rooms.length, CRUSADE_ROOM_COUNT);
  assert.equal(Object.keys(state.bosses).length, 5);
  assert.equal(state.levels.length, 5);
  assert.equal(state.riftLocked, true);
  assert.deepEqual(state.upgrades, { health: 0, damage: 0, valor: 0 });
});

test('Valor Chain builds from hits, decays on damage, and unlocks strikes', () => {
  const run = createCrusadeRun();
  assert.equal(run.valor, 0);
  assert.equal(valorMultiplier(run), 1);
  valorHit(run);
  assert.equal(run.valor, 1);
  assert.equal(valorMultiplier(run), 1.06);
  valorHit(run, { parry: true });
  assert.equal(run.valor, 3);
  assert.equal(valorStrikeReady(run), false);
  assert.equal(crusaderStrike(run).reason, 'chain_low');
  const capped = valorGain(run, 1000);
  assert.equal(capped.valor, VALOR_MAX);
  assert.equal(run.valor, VALOR_MAX);
  assert.equal(valorStrikeReady(run), true);
  const strike = crusaderStrike(run);
  assert.equal(strike.ok, true);
  assert.equal(run.valor, VALOR_MAX - VALOR_STRIKE_COST);
  assert.ok(strike.damage >= 80);
  const broke = valorBreak(run);
  assert.equal(broke.lost, VALOR_MAX - VALOR_STRIKE_COST);
  assert.equal(run.valor, 0);
  assert.equal(valorMultiplier(run), 1);
  assert.equal(run.breaks, 1);
});

test('banners change the opening chain, parry value, and strike profile', () => {
  const run = createCrusadeRun({ banners: ['banner_of_dawn', 'mercy_edge', 'siege_break', 'wall_breaker'] });
  assert.equal(run.valor, 2);
  assert.equal(run.parryValor, 2);
  assert.equal(run.strikeDamageBonus, 0.35);
  assert.equal(run.strikeShieldBonus, 0.5);
  valorGain(run, VALOR_STRIKE_MIN);
  const strike = crusaderStrike(run);
  assert.ok(strike.damage > 100, 'wall-breaker raises strike damage');
  assert.ok(strike.shieldBreak > 60, 'siege-break raises shield damage');
});

test('Valor upgrades raise the cap and run config applies them', () => {
  const run = createCrusadeRun({ upgrades: { valor: 3, health: 2, damage: 1 } });
  assert.equal(run.valorMax, VALOR_MAX + 6);
  assert.equal(run.maxHp, 140 + 28);
  assert.equal(run.damageMul, 1.08);
  const progress = { crusade: defaultCrusadeProgress() };
  progress.crusade.upgrades.health = 2;
  const config = crusadeRunConfig(progress.crusade, 0);
  assert.equal(config.level.index, 0);
  assert.equal(config.run.maxHp, 168);
  assert.ok(CRUSADE_UPGRADES.length >= 3);
});

test('the Paladin chain grows in phase two and breaking it staggers', () => {
  const boss = { phase: 2, chainTimer: 1, valorChain: 0, stunTimer: 0 };
  for (let i = 0; i < 12; i += 1) paladinChainTick(boss, 0.5, true);
  assert.ok(boss.valorChain > 0);
  assert.ok(boss.valorChain <= PALADIN_CHAIN_MAX);
  paladinChainTick(boss, 99, false);
  const chain = boss.valorChain;
  const result = breakPaladinChain(boss);
  assert.equal(result.broke, chain >= 2);
  assert.equal(boss.valorChain, 0);
  assert.ok(boss.stunTimer >= 2 || !result.broke);
});

test('Arc III unlocks only after a Fallen Ones ending', () => {
  assert.equal(crusadeUnlocked({}), false);
  assert.equal(crusadeUnlocked({ fallen: { endings: {} } }), false);
  assert.equal(crusadeUnlocked({ fallen: defaultFallen('dusk') }), true);
  const first = { fallen: defaultFallen('dawn') };
  const opened = unlockCrusade(first);
  assert.equal(opened.ok, true);
  assert.equal(opened.firstTime, true);
  assert.equal(first.crusade.unlocked, true);
  assert.equal(first.crusade.arcId, CRUSADE_ARC_ID);
  const again = unlockCrusade(first);
  assert.equal(again.firstTime, false);
  const locked = { fallen: { endings: {} } };
  assert.equal(unlockCrusade(locked).ok, false);
  assert.equal(locked.crusade.unlocked, false);
});

test('levels, rooms and bosses unlock in sequence inside the crusade', () => {
  const state = defaultCrusadeProgress();
  assert.equal(crusadeLevelUnlocked(state, 0), true);
  assert.equal(crusadeLevelUnlocked(state, 1), false);
  const level = CRUSADE_LEVELS[0];
  assert.equal(crusadeRoomUnlocked(state, level.roomStart), true);
  assert.equal(crusadeRoomUnlocked(state, level.roomStart + 1), false);
  assert.equal(crusadeBossUnlocked(state, level.boss), false);
  recordCrusadeRoom(state, level.roomStart);
  assert.equal(crusadeRoomUnlocked(state, level.roomStart + 1), true);
  clearHalls(state, 0);
  assert.equal(crusadeBossUnlocked(state, level.boss), true);
  assert.equal(crusadeBossUnlocked(state, CRUSADE_LEVELS[1].boss), false);
});

test('clearing a level records its halls, banner and sigils once', () => {
  const state = defaultCrusadeProgress();
  const level = clearHalls(state, 0);
  const room = recordCrusadeRoom(state, level.roomStart);
  assert.equal(room.firstClear, false, 'already cleared by the helper');
  const first = recordCrusadeBoss(state, level.boss);
  assert.equal(first.ok, true);
  assert.equal(first.firstClear, true);
  assert.equal(first.banner, 'banner_of_dawn');
  assert.ok(state.banners.includes('banner_of_dawn'));
  assert.ok(state.sigils >= 14);
  assert.equal(state.bosses[level.boss], true);
  assert.equal(state.levels[0], true);
  const again = recordCrusadeBoss(state, level.boss);
  assert.equal(again.firstClear, false);
  assert.equal(again.sigils, 0);
  assert.equal(again.banner, 'banner_of_dawn', 'banner stays referenced after the first clear');
  assert.equal(recordCrusadeBoss(defaultCrusadeProgress(), 'lady_vesperine').reason, 'locked');
});

test('the Paladin clears the crusade and unlocks the rift', () => {
  const state = defaultCrusadeProgress();
  for (let i = 0; i < CRUSADE_LEVEL_COUNT; i += 1) {
    clearHalls(state, i);
    recordCrusadeBoss(state, CRUSADE_LEVELS[i].boss);
  }
  assert.equal(state.cleared, true);
  assert.equal(state.riftLocked, false);
  assert.equal(state.arc4Hook, true);
  assert.ok(state.banners.includes('final_verdict'));
  const summary = crusadeSummary(state);
  assert.equal(summary.cleared, true);
  assert.equal(summary.levelsCleared, 5);
  assert.equal(summary.bossesCleared, 5);
  assert.equal(summary.percent, 100);
  assert.equal(summary.arc4Hook, true);
  assert.equal(crusadeCampFigure(state).pose, 'rift');
});

test('death and run counters persist', () => {
  const state = defaultCrusadeProgress();
  recordCrusadeDeath(state);
  recordCrusadeRun(state, 300, { won: true });
  recordCrusadeRun(state, 260, { won: true });
  recordCrusadeRun(state, 200, { won: false });
  assert.equal(state.deaths, 1);
  assert.equal(state.runs, 3);
  assert.equal(state.bestTime, 260);
});

test('sigils buy upgrades and refuse overspend or unknown tracks', () => {
  const state = defaultCrusadeProgress();
  const upgrade = CRUSADE_UPGRADES[0];
  assert.equal(buyCrusadeUpgrade(state, upgrade.id).reason, 'sigils');
  addCrusadeSigils(state, 500);
  const bought = buyCrusadeUpgrade(state, upgrade.id);
  assert.equal(bought.ok, true);
  assert.equal(state.upgrades[upgrade.id], 1);
  assert.equal(buyCrusadeUpgrade(state, 'nope').reason, 'unknown');
  while (state.upgrades[upgrade.id] < upgrade.tiers.length) buyCrusadeUpgrade(state, upgrade.id);
  assert.equal(buyCrusadeUpgrade(state, upgrade.id).reason, 'maxed');
});

test('sanitizer repairs impossible halls, phantom bosses and stray banners', () => {
  const raw = defaultCrusadeProgress();
  raw.rooms[2] = true;
  raw.bosses.marshal_aurion = true;
  raw.banners = CRUSADE_BANNERS.map((b) => b.id);
  raw.sigils = -90;
  raw.upgrades = { health: 9, damage: -2, valor: 2 };
  raw.riftLocked = false;
  raw.arc4Hook = true;
  raw.cleared = true;
  const clean = sanitizeCrusadeProgress(raw);
  assert.equal(clean.rooms[2], false, 'hall three needs hall two');
  assert.equal(clean.bosses.marshal_aurion, false, 'boss needs all three halls');
  assert.deepEqual(clean.banners, [], 'banners need their boss');
  assert.equal(clean.sigils, 0);
  assert.deepEqual(clean.upgrades, { health: 3, damage: 0, valor: 2 });
  assert.equal(clean.riftLocked, true, 'rift stays shut without the Paladin');
  assert.equal(clean.arc4Hook, false);
  assert.equal(clean.cleared, false);
});

test('sanitizer keeps earned banners and a real clear', () => {
  const state = defaultCrusadeProgress();
  for (let i = 0; i < CRUSADE_LEVEL_COUNT; i += 1) {
    clearHalls(state, i);
    recordCrusadeBoss(state, CRUSADE_LEVELS[i].boss);
  }
  state.sigils = 33;
  const clean = sanitizeCrusadeProgress(state);
  assert.equal(clean.cleared, true);
  assert.equal(clean.riftLocked, false);
  assert.equal(clean.banners.length, CRUSADE_BANNERS.length);
  assert.equal(clean.sigils, 33);
  assert.equal(clean.levels.filter(Boolean).length, 5);
});

test('archive, summary and camp figure react to progress', () => {
  const state = defaultCrusadeProgress();
  assert.equal(crusadeCampFigure(state).pose, 'empty');
  const level = clearHalls(state, 0);
  recordCrusadeBoss(state, level.boss);
  assert.equal(crusadeCampFigure(state).pose, 'camp');
  const summary = crusadeSummary(state);
  assert.equal(summary.levelsCleared, 1);
  assert.equal(summary.banners, 1);
  assert.equal(summary.bossesCleared, 1);
  const archive = crusadeArchive(state);
  assert.equal(archive.bestiary.length, 21);
  assert.equal(archive.bosses.filter((b) => b.cleared).length, 1);
  assert.equal(archive.banners.filter((b) => b.earned).length, 1);
  assert.equal(archive.upgrades.length, CRUSADE_UPGRADES.length);
});

test('the engine registers every crusade room, enemy, and boss', () => {
  const start = ALL_ROOMS.indexOf(CRUSADE_ROOMS[0]);
  assert.deepEqual(ALL_ROOMS.slice(start, start + CRUSADE_ROOM_COUNT), CRUSADE_ROOMS);
  assert.equal(ALL_ROOMS.length, 662);
  assert.equal(ALL_ROOMS[start + CRUSADE_ROOM_COUNT - 1].id, CRUSADE_ROOM_START + CRUSADE_ROOM_COUNT - 1);
  assert.ok(ALL_ENEMY_INFO.crusader_recruit.crusade);
  assert.equal(Object.keys(ALL_BOSS_INFO).filter((k) => k.startsWith('crusade_')).length, 5);
  assert.equal(CRUSADE_RIFT.locked, true);
  assert.equal(CRUSADE_NAME, 'The Radiant Crusade');
});

test('a crusade boss spawns with a purity shield in the real engine', () => {
  const game = new AshenGame();
  game.player.relic = true;
  game.enterRoom(CRUSADE_LEVELS[0].bossRoom);
  const boss = game.boss;
  assert.ok(boss);
  assert.equal(boss.kind, 'crusade_marshal_aurion');
  assert.equal(boss.purityShield, 140);
  const hp = boss.hp;
  game.hurtBoss(100);
  assert.equal(boss.purityShield, 40);
  assert.ok(hp - boss.hp < 30, 'raw swings barely dent the marshal');
  game.hurtBoss(100);
  assert.equal(boss.purityShield, 0);
  const after = boss.hp;
  game.hurtBoss(100);
  assert.ok(after - boss.hp >= 100);
});

test('the Giant Paladin runs three phases and ends the run in victory', () => {
  const game = new AshenGame();
  game.player.relic = true;
  game.enterRoom(CRUSADE_LEVELS[4].bossRoom);
  const boss = game.boss;
  assert.equal(boss.kind, 'crusade_giant_paladin');
  assert.equal(boss.maxPhases, 3);
  assert.equal(boss.purityShield, 200);
  boss.purityShield = 0;
  const third = boss.maxHp * 0.3;
  game.hurtBoss(boss.maxHp - third + 1);
  assert.ok(boss.phase >= 2, 'phase two entered');
  boss.invuln = 0;
  game.hurtBoss(boss.hp - boss.maxHp * 0.2 + 1);
  assert.ok(boss.phase >= 3, 'phase three entered');
  boss.invuln = 0;
  boss.intro = 0;
  game.damageBoss(99999);
  for (let i = 0; i < 360; i += 1) game.update(1 / 120, {});
  assert.equal(game.state, 'victory');
  assert.ok(game.events.some((e) => e.type === 'bossDown' && e.room === CRUSADE_LEVELS[4].bossRoom));
  assert.ok(game.events.some((e) => e.type === 'bossDialogue' && e.phase === 'defeat'));
});

test('crusade hall rooms spawn only registered crusade enemies', () => {
  const game = new AshenGame();
  game.enterRoom(CRUSADE_LEVELS[2].roomStart + 2);
  const room = CRUSADE_ROOM_BY_ID[CRUSADE_LEVELS[2].roomStart + 2];
  assert.equal(game.roomIndex, room.id);
  assert.ok(game.enemies.length > 0);
  game.enemies.forEach((e) => assert.ok(ALL_ENEMY_INFO[e.type]?.crusade));
  assert.ok(game.enemies.some((e) => e.type === 'twin_blades' || e.type === 'blade_acolyte'));
});
