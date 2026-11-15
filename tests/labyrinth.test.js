import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LABYRINTH_ZONES,
  LABYRINTH_ZONE_BY_ID,
  LABYRINTH_BOSSES,
  LABYRINTH_BOSS_BY_ID,
  LABYRINTH_ITEMS,
  LABYRINTH_ITEM_BY_ID,
  LABYRINTH_ENEMIES,
  LABYRINTH_MODES,
  LABYRINTH_MODIFIERS,
  RITUALS,
  RITUAL_BY_ID,
  SYNERGIES,
  BOSS_RARITY,
  ELITE_TIERS,
  CYCLE_STAGES,
  MASTERY_TRACKS,
  LABYRINTH_CURRENCIES,
  createLabyrinthRun,
  ensurePlans,
  cycleScaling,
  stageForCycle,
  WaveDirector,
  arenaForRun,
  itemTotals,
  itemDescription,
  synergyIdsFor,
  combineTotals,
  advanceRituals,
  ritualTotals,
  tickRituals,
  rewardChoices,
  applyItemToRun,
  captureBaseStats,
  applyLoadoutToGame,
  eliteTierForCycle,
  canCheckpoint,
  serializeLabyrinthRun,
  resumeLabyrinthRun,
  sanitizeLabyrinthProgress,
  recordLabyrinthRun,
  runSummary,
  leaderboardRows,
  discoverySummary,
  labyrinthHudModel,
  defaultLabyrinthProgress,
} from '../src/labyrinth.js';
import { AshenGame } from '../src/core.js';

test('labyrinth content targets are present', () => {
  assert.equal(LABYRINTH_ZONES.length, 20);
  assert.equal(LABYRINTH_BOSSES.length, 30);
  assert.equal(LABYRINTH_ITEMS.length, 40);
  assert.equal(LABYRINTH_ENEMIES.length, 40);
  assert.equal(LABYRINTH_MODES.length, 10);
  assert.equal(LABYRINTH_MODIFIERS.length, 11);
  assert.equal(RITUALS.length, 8);
  assert.equal(SYNERGIES.length, 6);
  assert.equal(ELITE_TIERS.length, 7);
  assert.equal(CYCLE_STAGES.length, 8);
  assert.equal(MASTERY_TRACKS.length, 8);
  assert.equal(LABYRINTH_CURRENCIES.length, 6);
  for (const zone of LABYRINTH_ZONES) {
    assert.ok(LABYRINTH_BOSS_BY_ID[zone.bossId], `${zone.id} boss exists`);
    assert.ok(zone.palette.top && zone.music);
  }
  assert.ok(Object.keys(BOSS_RARITY).length === 5);
});

test('every labyrinth boss has phase dialogue for every phase and a defeat line', () => {
  for (const boss of LABYRINTH_BOSSES) {
    assert.ok(boss.phases >= 3 && boss.phases <= 7, `${boss.id} phases`);
    assert.ok(boss.dialogue.intro.length >= 2, `${boss.id} intro`);
    assert.ok(boss.dialogue.defeat.length >= 1, `${boss.id} defeat`);
    for (let phase = 2; phase <= boss.phases; phase += 1) {
      assert.ok(boss.dialogue[`phase${phase}`]?.length, `${boss.id} phase ${phase}`);
    }
    assert.equal(boss.phaseThresholds.length, boss.phases - 1);
    assert.match(boss.pattern, /^(slam|volley|ring|charge|summon|rain)$/);
    assert.ok(BOSS_RARITY[boss.rarity]);
  }
});

test('seeded runs are deterministic and pre-compute two cycles', () => {
  const a = createLabyrinthRun({ seed: 1234 });
  const b = createLabyrinthRun({ seed: 1234 });
  assert.deepEqual(a.planQueue, b.planQueue);
  assert.equal(a.planQueue.length, 2);
  assert.equal(a.cycle, 1);
  assert.equal(a.zoneId, a.planQueue[0].zoneId);
  assert.notEqual(a.planQueue[0].zoneId || 'x', '');
  const c = createLabyrinthRun({ seed: 1235 });
  assert.notDeepEqual(a.planQueue[0].waves, c.planQueue[0].waves);
});

test('wave plans keep 2-3 enemies, an elite wave, and a final boss', () => {
  const run = createLabyrinthRun({ seed: 77, modeId: 'standard' });
  const plan = run.planQueue[0];
  assert.ok(plan.waves.length >= 4);
  const bossWave = plan.waves[plan.waves.length - 1];
  assert.equal(bossWave.kind, 'boss');
  assert.ok(bossWave.boss);
  for (const wave of plan.waves.slice(0, -1)) {
    assert.ok(wave.enemies.length >= 2 && wave.enemies.length <= 3, '2-3 enemies');
    for (const enemy of wave.enemies) {
      assert.ok(enemy.hpScale > 0 && enemy.dmgScale > 0);
      assert.ok(LABYRINTH_ITEM_BY_ID || enemy.type);
    }
  }
  assert.ok(plan.waves.some((wave) => wave.kind === 'elite'));
});

test('scaling grows with cycle and grants extra boss phases', () => {
  const c1 = cycleScaling(1);
  const c20 = cycleScaling(20);
  const c120 = cycleScaling(120);
  assert.ok(c20.hp > c1.hp);
  assert.ok(c120.hp > c20.hp);
  assert.ok(c120.dmg > c1.dmg);
  assert.ok(c120.extraPhases >= c20.extraPhases);
  assert.ok(c1.eliteChance >= 0 && c120.eliteChance <= 0.85);
  assert.equal(stageForCycle(1).label, 'Reruntuhan Awal');
  assert.equal(stageForCycle(500).label, 'Tanpa Batas');
  assert.ok(eliteTierForCycle(1).hp <= eliteTierForCycle(140).hp);
});

test('WaveDirector walks combat, elite, boss, then the next cycle', () => {
  const run = createLabyrinthRun({ seed: 9 });
  const director = new WaveDirector(run);
  director.begin();
  const total = director.totalWaves;
  const seen = [];
  for (let i = 0; i < total; i += 1) {
    const spawn = director.spawnWave();
    seen.push(spawn.kind);
    assert.ok(spawn.enemies.length || spawn.boss);
    if (spawn.boss) {
      assert.ok(spawn.boss.overrides.maxHp > 0);
      assert.ok(spawn.boss.overrides.dialogueData.intro);
    }
    const result = director.completeWave();
    if (i < total - 1) assert.equal(result, 'wave');
    else assert.equal(result, 'cycle');
  }
  assert.equal(seen[seen.length - 1], 'boss');
  const before = run.cycle;
  const next = director.advanceCycle();
  assert.equal(run.cycle, before + 1);
  assert.ok(next);
  assert.equal(run.planQueue.length, 2);
});

test('long runs keep the pre-computed plan queue bounded', () => {
  const run = createLabyrinthRun({ seed: 3 });
  const director = new WaveDirector(run);
  director.begin();
  for (let cycle = 0; cycle < 120; cycle += 1) {
    const plan = director.plan;
    director.waveIndex = plan.waves.length - 1;
    director.completeWave();
    director.advanceCycle();
  }
  assert.ok(run.planQueue.length <= 2);
  assert.equal(run.cycle, 121);
  assert.ok(run.planQueue.every((plan) => plan.waves.length >= 4));
});

test('item modifiers aggregate, curses are visible, and synergies apply', () => {
  const totals = itemTotals(['ring_hollow_king', 'crimson_covenant']);
  assert.ok(totals.damage > 0);
  assert.ok(totals.maxHp < 0);
  assert.ok(totals.heal < 0);
  const text = itemDescription(LABYRINTH_ITEM_BY_ID.ring_hollow_king);
  assert.match(text, /\+12% Damage/);
  assert.match(text, /-10% Max HP/);
  const synergy = synergyIdsFor(['ring_hollow_king', 'crimson_covenant']);
  assert.deepEqual(synergy, ['blood_monarch']);
  const withSynergy = itemTotals(['ring_hollow_king', 'crimson_covenant'], synergy);
  assert.ok(withSynergy.lifesteal > totals.lifesteal);
  assert.deepEqual(synergyIdsFor(['ring_hollow_king', 'void_eye']), []);
  const triple = synergyIdsFor(['ancient_skull_1', 'ancient_skull_2', 'ancient_skull_3']);
  assert.ok(triple.includes('gravebound_ascension'));
});

test('rituals charge, activate, grant totals, and expire', () => {
  const run = createLabyrinthRun({ seed: 11 });
  run.items.push('ritual_bone_dice');
  run.rituals.ritual_untouched = { progress: 0, completed: false, timer: 0 };
  let completed = [];
  for (let i = 0; i < 10; i += 1) {
    completed = advanceRituals(run, { type: 'enemyDown' });
  }
  assert.deepEqual(completed, ['ritual_untouched']);
  assert.ok(ritualTotals(run).damage > 0);
  const totals = combineTotals(run);
  assert.ok(totals.damage > 0);
  tickRituals(run, 40);
  assert.equal(ritualTotals(run).damage, 0);
  // Taking damage resets the untouched-vow streak.
  const second = createLabyrinthRun({ seed: 12 });
  second.rituals.ritual_untouched = { progress: 6, completed: false, timer: 0 };
  advanceRituals(second, { type: 'damageTaken' });
  assert.equal(second.rituals.ritual_untouched.progress, 0);
  assert.ok(RITUAL_BY_ID.ritual_boss_oath);
});

test('reward choices are unique items plus an occasional cursed bargain', () => {
  const run = createLabyrinthRun({ seed: 5, modeId: 'cursed' });
  const rewards = rewardChoices(run, 3);
  assert.ok(rewards.length >= 3);
  const itemIds = rewards.filter((r) => r.type === 'item').map((r) => r.itemId);
  assert.equal(new Set(itemIds).size, itemIds.length);
  const bargain = rewards.find((r) => r.type === 'bargain');
  assert.ok(bargain);
  assert.match(bargain.desc, /%|HP/);
  const accepted = applyItemToRun(run, bargain);
  assert.ok(accepted);
  assert.ok(run.curses.includes(bargain.id));
  assert.ok(run.stats.cursesAccepted >= 1);
  const item = rewards.find((r) => r.type === 'item');
  if (item) {
    assert.ok(applyItemToRun(run, item));
    assert.ok(run.items.includes(item.itemId));
    assert.ok(run.history.items.includes(item.itemId));
    assert.equal(applyItemToRun(run, item), false, 'duplicates rejected');
  }
});

test('loadout applies real combat stats to an AshenGame', () => {
  const game = new AshenGame();
  game.applyCharacter('sera');
  const base = captureBaseStats(game);
  const run = createLabyrinthRun({ seed: 6 });
  run.items.push('ring_hollow_king', 'hourglass_lost_time');
  run.synergies = synergyIdsFor(run.items);
  const totals = applyLoadoutToGame(run, game, base);
  assert.ok(totals.damage > 0);
  assert.ok(game.player.maxHp < base.maxHp);
  assert.ok(game.player.speedMult > base.speedMult);
  assert.ok(game.player.critChance > 0);
  assert.ok(game.player.incomingMult > 1);
  // Core consumes the incoming multiplier on real damage.
  game.player.invuln = 0;
  const before = game.player.hp;
  game.damagePlayer(10, 0);
  assert.ok(game.player.hp <= before - 10);
  assert.ok(game.damageReceived > 0);
});

test('arena configuration varies by zone and cycle and adds hazards', () => {
  const run = createLabyrinthRun({ seed: 8 });
  run.cycle = 1;
  const early = arenaForRun(run);
  assert.ok(early.platforms.length >= 3);
  assert.equal(early.hazards.length, 0);
  assert.ok(early.labyrinth);
  run.cycle = 20;
  const late = arenaForRun(run);
  assert.ok(late.hazards.length >= 1);
  assert.equal(late.gates.length, 0);
  assert.ok(early.name.includes('Siklus 1'));
});

test('save shape sanitizes, records runs, ranks history, and preserves unknown fields', () => {
  const dirty = {
    best: { cycle: 12.8, bosses: -3, enemies: 100, time: 40 },
    totals: { runs: '3', enemies: 50 },
    history: [{ cycle: 12, bosses: 2, modeId: 'cursed' }, { bad: true }],
    discovery: { zones: ['forgotten_crypt', 'nope'], items: ['ring_hollow_king', 'nope'] },
    currencies: { shards: 99 },
    unlocks: { modes: ['standard', 'bogus'] },
    coop: { sessions: 2 },
    legacyField: { keep: true },
  };
  const safe = sanitizeLabyrinthProgress(dirty);
  assert.equal(safe.best.cycle, 13);
  assert.equal(safe.best.bosses, 0);
  assert.deepEqual(safe.discovery.zones, ['forgotten_crypt']);
  assert.deepEqual(safe.discovery.items, ['ring_hollow_king']);
  assert.deepEqual(safe.unlocks.modes, ['standard']);
  assert.equal(safe.currencies.shards, 99);
  assert.deepEqual(safe.legacyField, { keep: true });
  assert.equal(safe.history.length, 1);

  const run = createLabyrinthRun({ seed: 13 });
  run.cycle = 7;
  run.stats.bossesDefeated = 3;
  run.stats.enemiesDefeated = 44;
  run.stats.timeSurvived = 320;
  run.history.zones.push(run.zoneId);
  run.items.push('void_eye');
  const raised = recordLabyrinthRun(safe, run);
  assert.equal(raised.best.cycle, 13);
  assert.equal(raised.totals.runs, 4);
  assert.ok(raised.mastery.xp > 0);
  assert.ok(raised.currencies.shards > 99);
  assert.ok(raised.discovery.items.includes('void_eye'));
  assert.equal(leaderboardRows(raised)[0].position, 1);
  assert.match(discoverySummary(raised).zones, /\/20$/);
  assert.equal(defaultLabyrinthProgress().best.cycle, 0);
});

test('checkpoint serialization is bounded and resume is leaderboard-ineligible', () => {
  const run = createLabyrinthRun({ seed: 21 });
  run.cycle = 10;
  run.items.push('ring_hollow_king');
  run.zoneId = run.planQueue[0].zoneId;
  const saved = serializeLabyrinthRun(run);
  assert.ok(saved);
  assert.equal(saved.eligible, false);
  assert.ok(saved.checkpointed);
  const resumed = resumeLabyrinthRun(saved);
  assert.ok(resumed);
  assert.equal(resumed.eligible, false);
  assert.ok(resumed.items.includes('ring_hollow_king'));
  assert.ok(resumed.planQueue.length >= 1);
  assert.equal(canCheckpoint(10), true);
  assert.equal(canCheckpoint(11), false);
  assert.equal(runSummary(run).cycle, 10);
  assert.ok(labyrinthHudModel(run, new WaveDirector(run)).zone.localName);
});

test('the arena integrates with core spawning, phases, and labyrinth boss rewards', () => {
  const game = new AshenGame();
  game.labyrinth = true;
  const run = createLabyrinthRun({ seed: 31 });
  const arena = arenaForRun(run);
  game.loadArena(arena);
  assert.equal(game.room.name, arena.name);
  const enemy = game.spawnEnemy({ type: 'crawler', x: 300, minX: 40, maxX: 1300, hpScale: 4, elite: true, eliteRank: 'E3' });
  assert.ok(enemy.elite);
  assert.ok(enemy.hp >= 34 * 4);
  const boss = game.spawnBoss('lab_gravebound_king', {
    name: 'The Gravebound King',
    maxHp: 400,
    maxPhases: 3,
    phaseThresholds: [0.66, 0.33],
    pattern: 'summon',
    dialogueData: { intro: [{ speaker: 'x', text: 'intro' }], phase2: [{ speaker: 'x', text: 'p2' }], phase3: [{ speaker: 'x', text: 'p3' }], defeat: [{ speaker: 'x', text: 'down' }] },
  });
  assert.equal(boss.maxHp, 400);
  game.damageBoss(150);
  assert.equal(game.boss.phase, 2);
  assert.ok(game.events.some((event) => event.type === 'bossDialogue' && event.phase === 'phase2'));
  game.boss.invuln = 0;
  game.player.invuln = 999;
  game.player.maxHp = 9999;
  game.player.hp = 9999;
  game.damageBoss(300);
  for (let i = 0; i < 400; i += 1) game.update(1 / 120, {});
  assert.ok(game.events.some((event) => event.type === 'labyrinthBossDown'));
  assert.notEqual(game.state, 'blessing');
  assert.notEqual(game.state, 'victory');
});

test('core co-op allies move, attack, take contact damage, and can be revived', () => {
  const game = new AshenGame();
  game.labyrinth = true;
  const run = createLabyrinthRun({ seed: 41 });
  game.loadArena(arenaForRun(run));
  const [ally] = game.setAllies([{ id: 'p2', name: 'Lyna', classId: 'lyna', power: 1 }]);
  const enemy = game.spawnEnemy({ type: 'crawler', x: 300, minX: 40, maxX: 1300 });
  enemy.dmg = 500;
  ally.x = 290;
  const hpBefore = ally.hp;
  game.setAllyInput('p2', { attack: true });
  for (let i = 0; i < 20; i += 1) game.update(1 / 120, {});
  assert.ok(ally.hp < hpBefore, 'contact damage applied');
  assert.ok(ally.downed, 'ally downed');
  assert.ok(game.events.some((event) => event.type === 'allyDown'));
  // Clear the encounter so the helper can stand safely and hold interact.
  enemy.dead = true;
  game.player.hp = game.player.maxHp;
  game.player.x = ally.x;
  game.player.y = ally.y;
  game.state = 'playing';
  game.prevInput.interact = false;
  for (let i = 0; i < 400; i += 1) {
    game.player.x = ally.x;
    game.player.y = ally.y;
    game.update(1 / 120, { interact: true });
    if (!ally.downed) break;
  }
  assert.equal(ally.downed, false);
  assert.ok(ally.hp > 0);
  assert.ok(game.events.some((event) => event.type === 'allyRevived'));
});
