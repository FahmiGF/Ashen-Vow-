import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WAVE_DEFENSE_MAPS,
  WAVE_DEFENSE_MAP_BY_ID,
  WAVE_DEFENSE_TOWERS,
  WAVE_DEFENSE_TOWER_BY_ID,
  WAVE_DEFENSE_DIFFICULTIES,
  WAVE_DEFENSE_DIFFICULTY_BY_ID,
  WAVE_DEFENSE_RIGS,
  rigPoseFor,
  waveDefenseRigFor,
  SPIRAL_STORY,
  spiralStoryForTier,
  waveDefenseRefreshFields,
  waveDefenseDamageEnemy,
  WAVE_DEFENSE_ENEMY_TYPES,
  WAVE_DEFENSE_BOSSES,
  WAVE_DEFENSE_WAVES,
  WAVE_DEFENSE_TOTAL_WAVES,
  WAVE_DEFENSE_ENDLESS_WAVES,
  WAVE_DEFENSE_INFINITOWER_TIER_WAVES,
  WAVE_DEFENSE_PARTICLE_LEVELS,
  WAVE_DEFENSE_TOWER_ICONS,
  waveDefenseTowerIconSvg,
  waveDefenseTowerIconDataUrl,
  waveDefenseSetParticleScale,
  infinitowerTierFor,
  WAVE_DEFENSE_MAX_TOWER_LEVEL,
  waveDefenseRefreshAuras,
  waveDefenseIncomingDamage,
  waveDefenseRefreshArmor,
  createWaveDefense,
  updateWaveDefense,
  waveDefenseBuild,
  waveDefenseUpgrade,
  waveDefenseUpgradeCost,
  waveDefenseSell,
  waveDefenseSellValue,
  waveDefenseSelect,
  waveDefenseSelectTower,
  waveDefenseNextWave,
  waveDefenseSetSpeed,
  waveDefenseTowerStats,
  waveDefenseSnapshot,
  defaultWaveDefenseProgress,
  sanitizeWaveDefenseProgress,
  recordWaveDefense,
  waveDefenseSummary,
  endWaveDefense,
  renderWaveDefense,
} from '../src/wavedefense.js';
import { SPIRAL_INTRO_CUTSCENE, SPIRAL_BOSS_CUTSCENE, cutsceneFor, cutsceneBeatAt, drawCutscene } from '../src/cutscene.js';
import { TRACKS } from '../src/music.js';

test('wave defense ships 9 maps, 20 towers, 31 enemies, 9 bosses, 4 difficulties and 24 waves', () => {
  assert.equal(WAVE_DEFENSE_MAPS.length, 9);
  for (const map of WAVE_DEFENSE_MAPS) {
    assert.ok(map.slots.length >= 20, `${map.id} needs plenty of build sites`);
    assert.ok(map.path.length >= 8);
    assert.ok(map.pathLength > 1000);
  }
  assert.equal(WAVE_DEFENSE_TOWERS.length, 20);
  assert.equal(WAVE_DEFENSE_ENEMY_TYPES.length, 31);
  assert.equal(WAVE_DEFENSE_BOSSES.length, 9);
  assert.equal(WAVE_DEFENSE_DIFFICULTIES.length, 4);
  assert.equal(WAVE_DEFENSE_WAVES.length, WAVE_DEFENSE_TOTAL_WAVES);
  assert.equal(WAVE_DEFENSE_TOTAL_WAVES, 24);
  for (const name of ['Ballista', 'Catapult', 'Trebuchet', 'Mage Tower', 'Cannon Tower']) {
    assert.ok(WAVE_DEFENSE_TOWERS.some((tower) => tower.name === name), name);
  }
  assert.equal(WAVE_DEFENSE_WAVES.filter((wave) => wave.groups.some(([type]) => WAVE_DEFENSE_TOWER_BY_ID[type])).length, 0);
  assert.equal(WAVE_DEFENSE_WAVES.filter((wave) => wave.groups.some(([type]) => WAVE_DEFENSE_ENEMY_TYPES.find((enemy) => enemy.id === type)?.boss)).length, 6);
});

test('a match starts in prep with a real castle, gold, slots and deterministic state', () => {
  const a = createWaveDefense({ mapId: 'ember_bastion', difficulty: 'warlord', seed: 42 });
  const b = createWaveDefense({ mapId: 'ember_bastion', difficulty: 'warlord', seed: 42 });
  assert.equal(a.mapId, 'ember_bastion');
  assert.equal(a.phase, 'prep');
  assert.equal(a.wave, 0);
  assert.equal(a.castle.maxHp, 100);
  assert.equal(a.castle.hp, 100);
  assert.equal(a.gold, 225);
  assert.equal(a.slots.length, WAVE_DEFENSE_MAP_BY_ID.ember_bastion.slots.length);
  assert.equal(a.enemies.length, 0);
  assert.equal(a.towers.length, 0);
  assert.deepEqual(a.slots.map((slot) => [slot.x, slot.y]), b.slots.map((slot) => [slot.x, slot.y]));
  assert.equal(a.rng(), b.rng());
});

test('tower construction, upgrades, selection and selling respect the economy', () => {
  const m = createWaveDefense({ gold: 1000 });
  m.gold = 1000;
  const slot = m.slots[0];
  assert.ok(waveDefenseBuild(m, slot.index, 'ballista'));
  assert.equal(m.slots[0].towerId !== null, true);
  assert.equal(m.towers.length, 1);
  assert.equal(m.gold, 930);
  assert.equal(waveDefenseBuild(m, slot.index, 'cannon_tower'), null, 'slot is occupied');
  assert.equal(waveDefenseBuild(m, 999, 'ballista'), null, 'slot must exist');
  assert.equal(waveDefenseBuild(m, 1, 'unknown_tower'), null, 'tower must exist');

  m.selectedSlot = 0;
  const tower = m.towers[0];
  assert.equal(waveDefenseUpgradeCost(tower), 63);
  assert.ok(waveDefenseUpgrade(m));
  assert.equal(tower.level, 2);
  assert.ok(waveDefenseUpgrade(m));
  assert.equal(tower.level, WAVE_DEFENSE_MAX_TOWER_LEVEL);
  assert.equal(waveDefenseUpgrade(m), null, 'max level');
  const refund = waveDefenseSellValue(tower);
  assert.equal(waveDefenseSell(m), refund);
  assert.equal(m.towers.length, 0);
  assert.equal(m.slots[0].towerId, null);
  assert.equal(m.gold, 930 - 63 - 95 + refund - 0);
});

test('waves count down, spawn real enemies and a tower earns bounty without crashing', () => {
  const m = createWaveDefense({ mapId: 'ashen_keep', difficulty: 'squire', seed: 7 });
  m.gold = 500;
  for (let i = 0; i < 12; i += 1) waveDefenseBuild(m, i, i % 3 === 0 ? 'catapult' : 'ballista');
  assert.ok(waveDefenseNextWave(m));
  assert.equal(m.phase, 'wave');
  assert.equal(m.wave, 1);
  for (let i = 0; i < 60 * 25; i += 1) updateWaveDefense(m, 1 / 60);
  assert.ok(m.stats.spawned >= 6);
  assert.ok(m.stats.kills >= 1, 'towers must kill enemies');
  assert.ok(m.gold > 0);
  assert.ok(m.score > 0);
  assert.ok(m.stats.damage > 0);
});

test('a boss wave inserts the boss and reaches the castle when undefended', () => {
  const m = createWaveDefense({ difficulty: 'squire' });
  m.wave = 3;
  m.phase = 'prep';
  m.prepTimer = 0;
  assert.ok(waveDefenseNextWave(m));
  assert.equal(m.wave, 4);
  for (let i = 0; i < 60 * 2; i += 1) updateWaveDefense(m, 1 / 60);
  assert.ok(m.enemies.some((enemy) => enemy.boss), 'Bone Colossus must spawn');
  for (let i = 0; i < 60 * 120; i += 1) updateWaveDefense(m, 1 / 60);
  assert.ok(m.castle.hp < m.castle.maxHp);
  assert.ok(m.stats.leaks >= 1);
});

test('losing the castle ends the match, and speed is clamped', () => {
  const m = createWaveDefense({ difficulty: 'warlord' });
  m.castle.hp = 1;
  m.phase = 'prep';
  m.prepTimer = 0;
  waveDefenseNextWave(m);
  for (let i = 0; i < 60 * 90; i += 1) updateWaveDefense(m, 1 / 60);
  assert.equal(m.phase, 'ended');
  assert.equal(m.result, 'defeat');
  assert.equal(m.castle.hp, 0);
  assert.ok(m.stats.leaks >= 1);

  const s = createWaveDefense();
  assert.equal(waveDefenseSetSpeed(s, 9), true);
  assert.equal(s.speed, 3);
  assert.equal(waveDefenseSetSpeed(s, 0), true);
  assert.equal(s.speed, 1);
});

test('all tower upgrades and the final wave can produce victory', () => {
  const m = createWaveDefense({ mapId: 'frostgate', difficulty: 'squire', seed: 11 });
  m.gold = 999999;
  m.wave = 23;
  m.phase = 'prep';
  m.prepTimer = 0;
  for (const slot of m.slots) {
    waveDefenseBuild(m, slot.index, slot.index % 2 ? 'trebuchet' : 'sniper_nest');
    waveDefenseSelect(m, slot.index);
    waveDefenseUpgrade(m);
    waveDefenseUpgrade(m);
  }
  assert.equal(m.towers.length, m.slots.length);
  for (let i = 0; i < 60 * 300; i += 1) {
    if (m.phase === 'ended') break;
    updateWaveDefense(m, 1 / 60);
  }
  assert.equal(m.phase, 'ended');
  assert.equal(m.result, 'victory');
  assert.equal(m.wave, 24);
  assert.equal(m.stats.bossesDown, 1);
  assert.ok(m.score > 0);
});

test('save data sanitizes, records records and survives junk fields', () => {
  const base = defaultWaveDefenseProgress();
  const dirty = {
    ...base,
    runs: '12',
    wins: -4,
    bestWave: 99,
    bestScore: -10,
    bestTime: 88,
    maps: {
      ashen_keep: { runs: 3, wins: 1, bestWave: 24, bestScore: 1000 },
      unknown_map: { runs: 999 },
    },
    futureField: { keep: true },
  };
  const clean = sanitizeWaveDefenseProgress(dirty);
  assert.equal(clean.runs, 12);
  assert.equal(clean.wins, 0);
  assert.equal(clean.bestWave, WAVE_DEFENSE_TOTAL_WAVES);
  assert.equal(clean.bestScore, 0);
  assert.equal(clean.maps.ashen_keep.bestWave, 24);
  assert.equal(clean.maps.unknown_map, undefined);
  assert.deepEqual(clean.futureField, { keep: true });
  assert.equal(sanitizeWaveDefenseProgress('bad').runs, 0);
});

test('match records, summaries and snapshots expose the real battlefield', () => {
  const m = createWaveDefense({ mapId: 'ashen_keep', seed: 2 });
  m.gold = 500;
  waveDefenseBuild(m, 2, 'mage_tower');
  waveDefenseSelect(m, 2);
  waveDefenseUpgrade(m);
  m.wave = 10;
  m.score = 1234;
  m.stats.kills = 54;
  m.stats.leaks = 2;
  m.result = 'victory';
  m.time = 420;
  const saved = recordWaveDefense(defaultWaveDefenseProgress(), m);
  assert.equal(saved.isRecord, true);
  assert.equal(saved.progress.runs, 1);
  assert.equal(saved.progress.wins, 1);
  assert.equal(saved.progress.bestWave, 10);
  assert.equal(saved.progress.maps.ashen_keep.bestWave, 10);
  assert.equal(saved.progress.totalKills, 54);
  assert.equal(saved.progress.totalLeaks, 2);
  const summary = waveDefenseSummary(saved.progress);
  assert.equal(summary.winRate, 100);
  assert.equal(summary.mapsPlayed, 1);
  assert.equal(summary.towers, 20);
  const snap = waveDefenseSnapshot(m);
  assert.equal(snap.mapName, 'ASHEN KEEP');
  assert.equal(snap.towers.length, 1);
  assert.equal(snap.selectedTower.name, 'Mage Tower');
  assert.equal(snap.selectedTower.level, 2);
  assert.equal(snap.castle.maxHp, 120);
  assert.equal(snap.totalWaves, 24);
});

test('banner auras buff nearby towers and drop when the banner is sold', () => {
  const m = createWaveDefense({ mapId: 'ashen_keep' });
  m.gold = 2000;
  const banner = waveDefenseBuild(m, 0, 'vow_banner');
  assert.ok(banner);
  const neighbour = m.slots.find((slot) => slot.index > 0 && Math.hypot(slot.x - banner.x, slot.y - banner.y) < 136);
  assert.ok(neighbour, 'a build site sits inside the banner radius');
  const ballista = waveDefenseBuild(m, neighbour.index, 'ballista');
  waveDefenseRefreshAuras(m);
  assert.equal(ballista.buffDamage, 0.2);
  assert.equal(ballista.buffRate, 0.12);
  assert.ok(waveDefenseTowerStats(ballista).damage > 34, 'the banner raises real tower damage');
  assert.ok(waveDefenseTowerStats(ballista).rate > 1.05, 'the banner raises real tower rate');
  waveDefenseSelect(m, banner.slot);
  waveDefenseSell(m);
  waveDefenseRefreshAuras(m);
  assert.equal(ballista.buffDamage, 0, 'selling the banner clears the buff');
  assert.equal(waveDefenseTowerStats(ballista).damage, 34);
  assert.equal(WAVE_DEFENSE_TOWER_BY_ID.vow_banner.damage, 0, 'the banner never shoots');
});

test('lantern marks and herald armour flow through the damage pipeline', () => {
  assert.equal(waveDefenseIncomingDamage(100, { armor: 0 }), 100);
  assert.equal(waveDefenseIncomingDamage(100, { armor: 0, markTimer: 2 }), 120);
  assert.equal(waveDefenseIncomingDamage(100, { armor: 0, markTimer: 0 }), 100);
  assert.equal(waveDefenseIncomingDamage(100, { armor: 0.2, armorBonus: 0.12 }), 68);
  assert.equal(waveDefenseIncomingDamage(100, { armor: 0.2, armorBonus: 0.12 }, { magic: true }), 89);
  assert.ok(Math.abs(waveDefenseIncomingDamage(100, { armor: 0.9, armorBonus: 0.4 }) - 15) < 1e-6, 'armour is capped at 85%');
  assert.ok(WAVE_DEFENSE_TOWER_BY_ID.spirit_lantern.mark >= 3);

  const m = createWaveDefense();
  const herald = { x: 200, y: 200, armorAura: 0.12, armorBonus: 0, dead: false };
  const ghoul = { x: 230, y: 200, armor: 0, armorBonus: 0, dead: false };
  const far = { x: 600, y: 200, armor: 0, armorBonus: 0, dead: false };
  m.enemies = [herald, ghoul, far];
  waveDefenseRefreshArmor(m);
  assert.equal(ghoul.armorBonus, 0.12);
  assert.equal(far.armorBonus, 0);
  herald.dead = true;
  waveDefenseRefreshArmor(m);
  assert.equal(ghoul.armorBonus, 0, 'the aura dies with the herald');
});

test('endless mode keeps sending procedural waves past wave 24 and records its own best', () => {
  const m = createWaveDefense({ mapId: 'sunken_causeway', endless: true, seed: 404 });
  assert.equal(m.endless, true);
  assert.equal(m.totalWaves, WAVE_DEFENSE_ENDLESS_WAVES);
  m.gold = 999999;
  for (const slot of m.slots) {
    waveDefenseBuild(m, slot.index, slot.index % 3 ? 'sniper_nest' : 'trebuchet');
    waveDefenseSelect(m, slot.index);
    waveDefenseUpgrade(m);
  }
  m.wave = 24;
  m.phase = 'prep';
  m.prepTimer = 0;
  assert.ok(waveDefenseNextWave(m));
  assert.equal(m.wave, 25, 'endless continues past the campaign');
  assert.ok(m.spawnQueue.length > 10, 'the procedural wave has a real roster');
  assert.ok(m.spawnQueue.some((entry) => entry.type && WAVE_DEFENSE_ENEMY_TYPES.some((enemy) => enemy.id === entry.type)));
  for (let i = 0; i < 60 * 240 && m.phase !== 'ended'; i += 1) updateWaveDefense(m, 1 / 60);
  assert.ok(m.wave >= 25, 'waves keep coming');
  assert.ok(m.stats.kills > 20);

  const saved = recordWaveDefense(defaultWaveDefenseProgress(), m);
  assert.equal(saved.endless, true);
  assert.equal(saved.win, false, 'endless never claims a campaign victory');
  assert.equal(saved.isRecord, true);
  assert.equal(saved.progress.endless.runs, 1);
  assert.equal(saved.progress.endless.bestWave, m.wave);
  assert.ok(saved.progress.endless.bestScore > 0);
  assert.equal(saved.progress.endless.bestTime, Math.round(m.time * 10) / 10);
  assert.equal(saved.progress.wins, 0, 'endless runs never inflate the campaign win rate');
  assert.equal(sanitizeWaveDefenseProgress(saved.progress).endless.bestWave, m.wave);
  const junk = sanitizeWaveDefenseProgress({ endless: { runs: -2, bestWave: 99999, bestScore: 'x' } });
  assert.equal(junk.endless.runs, 0);
  assert.equal(junk.endless.bestWave, WAVE_DEFENSE_ENDLESS_WAVES);
  assert.equal(junk.endless.bestScore, 0);
});

test('eternal spiral, the new towers and the new bodies carry real mechanics', () => {
  const spiral = WAVE_DEFENSE_MAP_BY_ID.eternal_spiral;
  assert.ok(spiral, 'the Infinitower arena exists');
  assert.ok(spiral.slots.length >= 20);
  assert.equal(spiral.pathLength, Math.max(...WAVE_DEFENSE_MAPS.map((map) => map.pathLength)), 'the spiral is the longest road');

  for (const id of ['echo_monolith', 'grave_bell', 'ash_forge', 'watcher_eye']) {
    assert.ok(WAVE_DEFENSE_TOWER_BY_ID[id], `${id} must exist`);
  }
  assert.ok(WAVE_DEFENSE_TOWER_BY_ID.echo_monolith.chain >= 3, 'the monolith chains');
  assert.ok(WAVE_DEFENSE_TOWER_BY_ID.grave_bell.stun > 0, 'the bell stuns');
  assert.ok(WAVE_DEFENSE_TOWER_BY_ID.ash_forge.shred > 0, 'the forge shreds armour');
  assert.ok(WAVE_DEFENSE_TOWER_BY_ID.watcher_eye.execute > 0, 'the eye executes');

  for (const id of ['mirror_thrall', 'cinder_wraith', 'grave_chorister', 'tower_breaker', 'obsidian_golem']) {
    assert.ok(WAVE_DEFENSE_ENEMY_TYPES.some((enemy) => enemy.id === id), `${id} must exist`);
  }
  assert.ok(WAVE_DEFENSE_ENEMY_TYPES.some((enemy) => enemy.id === 'spiral_tyrant' && enemy.boss));
  assert.ok(WAVE_DEFENSE_ENEMY_TYPES.some((enemy) => enemy.id === 'lantern_devourer' && enemy.boss));

  // Shred strips armour before the damage pipeline.
  assert.equal(waveDefenseIncomingDamage(100, { armor: 0.4 }), 60);
  assert.equal(waveDefenseIncomingDamage(100, { armor: 0.4, shred: 0.2, shredTimer: 2 }), 80);

  // Chorister haste feeds the same aura refresh as herald armour.
  const m = createWaveDefense();
  const chorister = { x: 300, y: 300, hasteAura: 0.22, hasteBonus: 0, armorBonus: 0, dead: false };
  const ghoul = { x: 330, y: 300, armor: 0, armorBonus: 0, hasteBonus: 0, dead: false };
  m.enemies = [chorister, ghoul];
  waveDefenseRefreshArmor(m);
  assert.equal(ghoul.hasteBonus, 0.22);
});

test('stunned enemies hold position and tower breakers silence the nearest tower', () => {
  const m = createWaveDefense({ phase: 'wave' });
  m.phase = 'wave';
  m.spawnQueue = [];
  m.spawnCursor = 0;
  const enemy = {
    id: 99, type: 'ashen_ghoul', name: 'Ashen Ghoul', x: m.map.path[0].x, y: m.map.path[0].y,
    radius: 10, hp: 100, maxHp: 100, speed: 60, bounty: 5, damage: 2, armor: 0,
    armorBonus: 0, hasteBonus: 0, slowTimer: 0, slowFactor: 1, poisonTimer: 0,
    markTimer: 0, stunTimer: 1, shred: 0, shredTimer: 0, regen: 0, regenTimer: 2,
    healAura: 0, healTimer: 1, pathIndex: 1, traveled: 0, dead: false, leaked: false, angle: 0,
  };
  m.enemies = [enemy];
  const startX = enemy.x;
  updateWaveDefense(m, 1 / 60);
  assert.equal(enemy.x, startX, 'a stunned body does not move');
  enemy.stunTimer = 0;
  updateWaveDefense(m, 1 / 60);
  assert.ok(Math.hypot(enemy.x - startX, enemy.y - m.map.path[0].y) > 0, 'momentum resumes after the stun');

  const br = createWaveDefense({ gold: 1000 });
  br.gold = 1000;
  const tower = waveDefenseBuild(br, 0, 'ballista');
  const breaker = {
    ...enemy,
    x: tower.x + 40, y: tower.y, stunTimer: 0, dead: false,
    disabler: { radius: 96, cooldown: 3.6, duration: 2.4, timer: 0 },
  };
  br.enemies = [breaker];
  br.phase = 'wave';
  br.spawnQueue = [];
  br.spawnCursor = 0;
  updateWaveDefense(br, 1 / 60);
  assert.ok(tower.disabled > 2, 'the tower breaker disables the turret');
});

test('infinitower escalates a tier every ten waves and keeps its own ledger', () => {
  assert.equal(WAVE_DEFENSE_INFINITOWER_TIER_WAVES, 10);
  assert.equal(infinitowerTierFor(1), 1);
  assert.equal(infinitowerTierFor(10), 1);
  assert.equal(infinitowerTierFor(11), 2);
  assert.equal(infinitowerTierFor(21), 3);

  const m = createWaveDefense({ infinitower: true, difficulty: 'squire', seed: 9 });
  assert.equal(m.mode, 'infinitower');
  assert.equal(m.endless, true);
  assert.equal(m.mapId, 'eternal_spiral');
  assert.equal(m.totalWaves, WAVE_DEFENSE_ENDLESS_WAVES);
  assert.equal(m.tier, 1);
  assert.equal(m.phase, 'prep');

  m.wave = 9;
  m.phase = 'prep';
  m.prepTimer = 0;
  assert.ok(waveDefenseNextWave(m));
  assert.equal(m.wave, 10);
  assert.equal(m.tier, 1);
  assert.ok(m.spawnQueue.length >= 10, 'the first tier already sends a crowd');

  m.wave = 14;
  m.phase = 'prep';
  m.prepTimer = 0;
  waveDefenseNextWave(m);
  assert.equal(m.wave, 15);
  assert.ok(m.spawnQueue.some((entry) => WAVE_DEFENSE_BOSSES.some((boss) => boss.id === entry.type)), 'every fifth wave brings a boss');

  m.wave = 20;
  m.phase = 'prep';
  m.prepTimer = 0;
  waveDefenseNextWave(m);
  assert.equal(m.tier, 3, 'wave 21 opens tier three');
  assert.ok(m.spawnQueue.length >= 12, 'tier three adds an elite group');

  const snap = waveDefenseSnapshot(m);
  assert.equal(snap.mode, 'infinitower');
  assert.equal(snap.infinitower, true);
  assert.equal(snap.tier, 3);

  const saved = recordWaveDefense(defaultWaveDefenseProgress(), m);
  assert.equal(saved.infinitower, true);
  assert.equal(saved.win, false, 'Infinitower never claims a campaign victory');
  assert.equal(saved.progress.infinitower.runs, 1);
  assert.equal(saved.progress.infinitower.bestWave, 21);
  assert.equal(saved.progress.infinitower.bestTier, 3);
  assert.equal(saved.progress.wins, 0);
  assert.equal(saved.progress.runs, 0, 'Infinitower does not inflate the campaign ledger');

  const clean = sanitizeWaveDefenseProgress({ infinitower: { runs: '3', bestWave: 99999, bestTier: 999, bestScore: -5 } });
  assert.equal(clean.infinitower.runs, 3);
  assert.equal(clean.infinitower.bestWave, WAVE_DEFENSE_ENDLESS_WAVES);
  assert.equal(clean.infinitower.bestTier, Math.ceil(WAVE_DEFENSE_ENDLESS_WAVES / WAVE_DEFENSE_INFINITOWER_TIER_WAVES));
  assert.equal(clean.infinitower.bestScore, 0);

  const doomed = createWaveDefense({ infinitower: true, difficulty: 'warlord', seed: 5 });
  for (let i = 0; i < 60 * 400 && doomed.phase !== 'ended'; i += 1) updateWaveDefense(doomed, 1 / 60);
  assert.equal(doomed.phase, 'ended');
  assert.equal(doomed.result, 'defeat', 'there is no victory state in the spiral');
});

test('the Spiral Choir update adds rigged bodies, two towers and the Eternal difficulty', () => {
  assert.ok(WAVE_DEFENSE_TOWER_BY_ID.spiral_anchor, 'the anchor exists');
  assert.ok(WAVE_DEFENSE_TOWER_BY_ID.hourglass, 'the hourglass exists');
  assert.equal(WAVE_DEFENSE_TOWER_BY_ID.hourglass.damage, 0, 'the hourglass never shoots');
  assert.ok(WAVE_DEFENSE_TOWER_BY_ID.hourglass.field.slow > 0.2, 'the hourglass projects a real slow field');
  assert.ok(WAVE_DEFENSE_TOWER_BY_ID.spiral_anchor.slow > 0.5, 'the anchor slows hard');

  for (const id of ['rift_hopper', 'lantern_moth', 'grave_taxer']) {
    assert.ok(WAVE_DEFENSE_ENEMY_TYPES.some((enemy) => enemy.id === id), `${id} must exist`);
  }
  const choir = WAVE_DEFENSE_ENEMY_TYPES.find((enemy) => enemy.id === 'spiral_choir');
  assert.ok(choir?.boss, 'the choir is a boss');
  assert.ok(choir.summon && choir.summon.count >= 1, 'the choir summons');

  const eternal = WAVE_DEFENSE_DIFFICULTY_BY_ID.eternal;
  assert.ok(eternal, 'the fourth difficulty exists');
  assert.ok(eternal.hp > WAVE_DEFENSE_DIFFICULTY_BY_ID.warlord.hp, 'ETERNAL is harsher than WARLORD');
  assert.ok(eternal.castle < WAVE_DEFENSE_DIFFICULTY_BY_ID.warlord.castle, 'ETERNAL gives the castle less HP');

  // Rigs are pure and deterministic, and every enemy kind resolves to one.
  assert.ok(Object.keys(WAVE_DEFENSE_RIGS).length >= 5);
  const a = rigPoseFor('ashen_ghoul', 1.2, { moving: true });
  const b = rigPoseFor('ashen_ghoul', 1.2, { moving: true });
  assert.deepEqual(a, b);
  assert.notEqual(rigPoseFor('ashen_ghoul', 1.5).stride, a.stride, 'the walk cycle moves');
  assert.equal(waveDefenseRigFor('ember_hound').legs, 4);
  assert.equal(waveDefenseRigFor('spiral_choir').float, true);
  for (const enemy of WAVE_DEFENSE_ENEMY_TYPES) {
    assert.ok(waveDefenseRigFor(enemy.id), `${enemy.id} needs a rig`);
  }

  // Six chronicle chapters, clamped for any tier the spiral reaches.
  assert.equal(SPIRAL_STORY.length, 6);
  assert.equal(spiralStoryForTier(1).tier, 1);
  assert.equal(spiralStoryForTier(4).title, SPIRAL_STORY[3].title);
  assert.equal(spiralStoryForTier(999), SPIRAL_STORY[SPIRAL_STORY.length - 1]);
  assert.equal(spiralStoryForTier(-3).tier, 1);
});

test('field slow, blink, death blind, toll and summon all change the simulation', () => {
  // Hourglass field: enemies inside the radius carry a slow, and it scales.
  const m = createWaveDefense({ gold: 1000 });
  const tower = waveDefenseBuild(m, 0, 'hourglass');
  const enemy = { x: tower.x + 20, y: tower.y, dead: false, fieldSlow: 0 };
  const far = { x: tower.x + 400, y: tower.y, dead: false, fieldSlow: 0 };
  m.enemies = [enemy, far];
  waveDefenseRefreshFields(m);
  assert.equal(enemy.fieldSlow, 0.24);
  assert.equal(far.fieldSlow, 0);
  tower.level = 2;
  waveDefenseRefreshFields(m);
  assert.equal(enemy.fieldSlow, 0.48);
  tower.disabled = 2;
  waveDefenseRefreshFields(m);
  assert.equal(enemy.fieldSlow, 0, 'a silenced hourglass stops slowing');

  // Rift Hopper blinks forward along the road.
  const hop = createWaveDefense({ infinitower: true });
  hop.phase = 'wave';
  hop.wave = 1;
  hop.spawnQueue = [{ type: 'rift_hopper', at: 0 }];
  hop.spawnCursor = 0;
  hop.waveTime = 0;
  updateWaveDefense(hop, 0.02);
  const hopper = hop.enemies.find((entry) => entry.type === 'rift_hopper');
  assert.ok(hopper, 'the hopper spawned');
  const before = hopper.traveled;
  hopper.blinkTimer = 0.001;
  updateWaveDefense(hop, 0.02);
  assert.ok(hopper.traveled - before > 30, 'the hop skips about 34 units of road');

  // Lantern Moth blinds towers when it dies.
  const blind = createWaveDefense({ gold: 1000 });
  const turret = waveDefenseBuild(blind, 0, 'ballista');
  const moth = {
    id: 900, type: 'lantern_moth', name: 'Lantern Moth', x: turret.x + 30, y: turret.y,
    hp: 5, maxHp: 10, bounty: 7, armor: 0, dead: false, summoned: false,
    deathBlind: { radius: 100, duration: 1.6 }, color: '#ffe19a',
  };
  blind.enemies = [moth];
  waveDefenseDamageEnemy(blind, moth, 99, { magic: true });
  assert.equal(moth.dead, true);
  assert.ok(turret.disabled >= 1.5, 'the death flash silences nearby towers');

  // Grave Taxer steals gold when it reaches the gate.
  const tax = createWaveDefense({ difficulty: 'knight' });
  const startGold = tax.gold;
  const taxer = {
    id: 901, type: 'grave_taxer', name: 'Grave Taxer', x: tax.castle.x, y: tax.castle.y,
    radius: 11, hp: 100, maxHp: 100, speed: 40, bounty: 10, damage: 3, armor: 0,
    armorBonus: 0, hasteBonus: 0, fieldSlow: 0, slowTimer: 0, slowFactor: 1,
    poisonTimer: 0, markTimer: 0, stunTimer: 0, shred: 0, shredTimer: 0,
    regen: 0, regenTimer: 2, healAura: 0, healTimer: 1, summon: null,
    blink: null, blinkTimer: 0, toll: 14, disabler: null, pathIndex: tax.map.path.length,
    traveled: tax.map.pathLength, dead: false, leaked: false, angle: 0, color: '#c9d18a',
  };
  tax.phase = 'wave';
  tax.spawnQueue = [{ type: 'ashen_ghoul', at: 999 }];
  tax.spawnCursor = 0;
  tax.enemies = [taxer];
  updateWaveDefense(tax, 1 / 60);
  assert.equal(tax.gold, startGold - 14, 'the toll is paid from the war chest');
  assert.ok(tax.castle.hp < tax.castle.maxHp);

  // The Spiral Choir sings Mirror Thralls onto the road.
  const choir = createWaveDefense({ infinitower: true });
  choir.phase = 'wave';
  choir.spawnQueue = [{ type: 'spiral_choir', at: 0 }];
  choir.spawnCursor = 0;
  updateWaveDefense(choir, 0.02);
  const boss = choir.enemies.find((entry) => entry.type === 'spiral_choir');
  assert.ok(boss, 'the choir spawned');
  boss.summonTimer = 0.0001;
  updateWaveDefense(choir, 0.02);
  assert.ok(choir.enemies.some((entry) => entry.type === 'mirror_thrall'), 'the choir summons thralls');
});

test('Infinitower tiers advance the Spiral Chronicle and the cinematics stay playable', () => {
  const m = createWaveDefense({ infinitower: true });
  m.wave = 9;
  m.phase = 'prep';
  m.prepTimer = 0;
  waveDefenseNextWave(m);
  assert.equal(m.story.tier, 1);
  assert.deepEqual(m.storyLog, []);
  m.wave = 10;
  m.phase = 'prep';
  m.prepTimer = 0;
  waveDefenseNextWave(m);
  assert.equal(m.tier, 2);
  assert.equal(m.story.tier, 2);
  assert.deepEqual(m.storyLog, [2]);
  assert.equal(waveDefenseSnapshot(m).story.title, SPIRAL_STORY[1].title);

  for (const scene of [SPIRAL_INTRO_CUTSCENE, SPIRAL_BOSS_CUTSCENE]) {
    assert.equal(cutsceneFor(scene.id), scene);
    assert.ok(scene.duration >= 10, 'the cinematic is long enough to read');
    assert.ok(TRACKS[scene.music], `${scene.music} must be a real procedural track`);
    assert.ok(scene.beats.length >= 4);
    let last = -1;
    for (const beat of scene.beats) {
      assert.ok(beat.at > last, 'beats are ordered');
      assert.ok(beat.at < scene.duration, 'every beat fits inside the scene');
      assert.ok(beat.text.length > 10);
      last = beat.at;
    }
    assert.equal(cutsceneBeatAt(scene, 0), scene.beats[0]);
    assert.equal(cutsceneBeatAt(scene, scene.duration + 5), scene.beats[scene.beats.length - 1]);
  }
  assert.ok(TRACKS.spiral && TRACKS.spiralBoss && TRACKS.spiralTrailer, 'all three spiral tracks exist');

  // The new art renders through the same canvas contract as the other scenes.
  const calls = [];
  const ctx = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'canvas') return { width: 1280, height: 720 };
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (prop === 'measureText') return () => ({ width: 10 });
      if (['fillStyle', 'strokeStyle', 'lineWidth', 'font', 'textAlign', 'globalAlpha'].includes(prop)) return '';
      return (...args) => { calls.push([prop, ...args]); };
    },
    set() { return true; },
  });
  assert.doesNotThrow(() => drawCutscene(ctx, 1280, 720, SPIRAL_INTRO_CUTSCENE, 6));
  assert.doesNotThrow(() => drawCutscene(ctx, 1280, 720, SPIRAL_BOSS_CUTSCENE, 4));
  assert.ok(calls.length > 20, 'the spiral art issues real draw calls');
});

test('an ended match stays ended and the renderer draws a real battlefield', () => {
  const m = createWaveDefense();
  assert.equal(endWaveDefense(m, 'victory').result, 'victory');
  assert.equal(endWaveDefense(m, 'defeat').result, 'victory');
  const calls = [];
  const ctx = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'canvas') return { width: 960, height: 540 };
      if (prop === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (prop === 'measureText') return () => ({ width: 10 });
      if (['fillStyle', 'strokeStyle', 'lineWidth', 'font', 'textAlign', 'globalAlpha'].includes(prop)) return '';
      return (...args) => { calls.push([prop, ...args]); };
    },
    set() { return true; },
  });
  m.gold = 2000;
  waveDefenseBuild(m, 0, 'hourglass');
  waveDefenseBuild(m, 1, 'spiral_anchor');
  m.enemies = [
    { id: 1, type: 'rift_hopper', x: 120, y: 120, radius: 9, hp: 10, maxHp: 20, angle: 0.2, color: '#b39cff', stunTimer: 0, boss: false },
    { id: 2, type: 'spiral_choir', x: 200, y: 160, radius: 31, hp: 50, maxHp: 100, angle: 1.1, color: '#c8d4ff', stunTimer: 0, boss: true },
  ];
  assert.doesNotThrow(() => renderWaveDefense(ctx, m, { width: 960, height: 540, time: 1 }));
  assert.ok(calls.length > 0);
  assert.ok(calls.some(([name]) => name === 'lineTo'), 'rigged limbs are stroked');
});

test('every tower provides a distinct SVG icon and particle scale expands particle caps', () => {
  assert.equal(Object.keys(WAVE_DEFENSE_TOWER_ICONS).length, WAVE_DEFENSE_TOWERS.length);
  assert.equal(WAVE_DEFENSE_PARTICLE_LEVELS.length, 5);
  const seenSvg = new Set();
  for (const tower of WAVE_DEFENSE_TOWERS) {
    const svg = waveDefenseTowerIconSvg(tower.id, 40);
    assert.match(svg, /^<svg[^>]*viewBox="0 0 40 40"/);
    assert.ok(!seenSvg.has(svg), `tower ${tower.id} icon must be unique`);
    seenSvg.add(svg);
    const dataUrl = waveDefenseTowerIconDataUrl(tower.id);
    assert.ok(dataUrl.startsWith('data:image/svg+xml;utf8,'));
  }

  const lowMatch = createWaveDefense({ mapId: 'rift_chasm', particleScale: 0.45, seed: 7 });
  const highMatch = createWaveDefense({ mapId: 'rift_chasm', particleScale: 4, seed: 7 });
  assert.equal(lowMatch.mapId, 'rift_chasm');
  assert.ok(highMatch.maxParticles > lowMatch.maxParticles * 5);
  lowMatch.gold = 2000;
  highMatch.gold = 2000;
  waveDefenseBuild(lowMatch, 0, 'flame_keep');
  waveDefenseBuild(highMatch, 0, 'flame_keep');
  waveDefenseNextWave(lowMatch);
  waveDefenseNextWave(highMatch);
  for (let i = 0; i < 90; i += 1) {
    updateWaveDefense(lowMatch, 1 / 30);
    updateWaveDefense(highMatch, 1 / 30);
  }
  assert.ok(highMatch.particles.length > lowMatch.particles.length, `expected more particles (${highMatch.particles.length} vs ${lowMatch.particles.length})`);
  waveDefenseSetParticleScale(highMatch, 0.25);
  assert.equal(highMatch.particleScale, 0.25);
});
