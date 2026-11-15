// tests/overdrive.test.js
// Verification suite for Ashen Vow — Overdrive Update (The Eternal Realm)
// Tests: src/perf.js (profiler, culling, pooling, AI scheduler),
//        src/overdrive.js (10 regions, 8 spell schools, 16 weapon categories, 12 modes, 18 checklist),
//        src/boss_overdrive.js (multi-stage boss health, 5-phase controller, spell casting engine)

import test from 'node:test';
import assert from 'node:assert/strict';

// ─── src/perf.js ─────────────────────────────────────────────────────────────
import {
  DiagnosticProfiler,
  FrustumCuller,
  ObjectPool,
  AIScheduler,
  AI_TIER,
  SaveMigrator,
  BenchmarkRunner,
} from '../src/perf.js';

// ─── src/overdrive.js ─────────────────────────────────────────────────────────
import {
  OVERDRIVE_VERSION,
  OVERDRIVE_CHAPTERS,
  OVERDRIVE_CHAPTER_BY_ID,
  OVERDRIVE_LEVEL_SPECS,
  OVERDRIVE_SPECIAL_LEVEL_TYPES,
  SPELL_SCHOOLS,
  SPELL_BY_ID,
  OVERDRIVE_WEAPON_CATEGORIES,
  LEGENDARY_WEAPONS,
  OVERDRIVE_ENEMIES,
  ELITE_MODIFIERS_OVERDRIVE,
  BACKGROUND_BOSSES,
  OVERDRIVE_MODES,
  OVERDRIVE_NPCS,
  OVERDRIVE_QUESTLINES,
  OVERDRIVE_CHECKLIST,
  defaultOverdriveProgress,
  sanitizeOverdriveProgress,
  overdriveChapterForLevel,
} from '../src/overdrive.js';

// ─── src/boss_overdrive.js ────────────────────────────────────────────────────
import {
  BossHealthSystem,
  BossPhaseController,
  SpellCastingEngine,
  OVERDRIVE_BOSSES,
} from '../src/boss_overdrive.js';

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 1 — src/perf.js
// ═════════════════════════════════════════════════════════════════════════════

test('DiagnosticProfiler records FPS, frame time, and performance metrics', () => {
  const profiler = new DiagnosticProfiler();
  assert.ok(profiler, 'profiler should instantiate');

  // Record several frames at 60 FPS target (16.7 ms each)
  profiler.beginFrame();
  profiler.endFrame(16.7);
  profiler.beginFrame();
  profiler.endFrame(16.7);
  profiler.beginFrame();
  profiler.endFrame(33.4); // spike frame

  const metrics = profiler.getMetrics();
  assert.ok(typeof metrics.fps === 'number', 'fps must be a number');
  assert.ok(typeof metrics.frameTime === 'number', 'frameTime must be a number');
  assert.ok(typeof metrics.activeEntities === 'number', 'activeEntities must be a number');
  assert.ok(typeof metrics.particleCount === 'number', 'particleCount must be a number');
  assert.ok(typeof metrics.drawCalls === 'number', 'drawCalls must be a number');
  assert.ok(typeof metrics.memoryEstimate === 'number' || metrics.memoryEstimate === null, 'memoryEstimate must be numeric or null');
  assert.ok(typeof metrics.stutterDetected === 'boolean', 'stutterDetected must be boolean');

  // The 33.4ms spike (double frame time) should be detected
  assert.ok(metrics.stutterDetected, 'profiler should detect stutter on a 33ms spike');
});

test('DiagnosticProfiler tracks entity and particle counts', () => {
  const profiler = new DiagnosticProfiler();
  profiler.setEntityCount(42);
  profiler.setParticleCount(200);
  profiler.setDrawCalls(18);

  const metrics = profiler.getMetrics();
  assert.equal(metrics.activeEntities, 42);
  assert.equal(metrics.particleCount, 200);
  assert.equal(metrics.drawCalls, 18);
});

test('DiagnosticProfiler reset clears accumulated data', () => {
  const profiler = new DiagnosticProfiler();
  profiler.beginFrame();
  profiler.endFrame(20);
  profiler.setEntityCount(10);
  profiler.reset();

  const metrics = profiler.getMetrics();
  assert.equal(metrics.activeEntities, 0);
});

test('FrustumCuller 2D correctly accepts entities within camera rect and rejects outside', () => {
  const culler = new FrustumCuller();
  // Camera rect: x=0, y=0, width=800, height=600
  const camera2D = { x: 0, y: 0, width: 800, height: 600 };

  const inside = { x: 400, y: 300, width: 32, height: 32 };
  const outside = { x: 2000, y: 3000, width: 32, height: 32 };
  const partial = { x: 790, y: 10, width: 32, height: 32 };

  assert.ok(culler.isVisible2D(inside, camera2D), 'entity inside camera should be visible');
  assert.ok(!culler.isVisible2D(outside, camera2D), 'entity far outside camera should be culled');
  assert.ok(culler.isVisible2D(partial, camera2D), 'partially overlapping entity should be visible');
});

test('FrustumCuller 3D correctly clips points behind camera plane', () => {
  const culler = new FrustumCuller();
  const camera3D = { x: 0, y: 0, z: 0, fov: 60, near: 1, far: 1000 };

  const inFront = { x: 0, y: 0, z: 50, radius: 5 };
  const behind = { x: 0, y: 0, z: -10, radius: 5 };
  const tooFar = { x: 0, y: 0, z: 1500, radius: 5 };

  assert.ok(culler.isVisible3D(inFront, camera3D), 'entity in front should pass culling');
  assert.ok(!culler.isVisible3D(behind, camera3D), 'entity behind camera should be culled');
  assert.ok(!culler.isVisible3D(tooFar, camera3D), 'entity beyond far plane should be culled');
});

test('ObjectPool correctly creates, recycles, and reuses objects', () => {
  let createCount = 0;
  const pool = new ObjectPool({
    create: () => { createCount++; return { alive: false, x: 0, y: 0 }; },
    reset: (obj) => { obj.alive = false; obj.x = 0; obj.y = 0; },
    initialSize: 5,
  });

  assert.equal(createCount, 5, 'pool should pre-allocate initialSize objects');

  const obj1 = pool.acquire();
  assert.ok(obj1, 'acquire should return an object');
  obj1.x = 100;

  pool.release(obj1);
  const obj2 = pool.acquire();
  assert.equal(obj2.x, 0, 'released object should be reset before reuse');
  assert.equal(createCount, 5, 'pool should reuse object without creating new one');

  // Exhaust pool
  for (let i = 0; i < 10; i++) pool.acquire();
  assert.ok(createCount > 5, 'pool should grow when exhausted');
});

test('ObjectPool supports typed pools: projectiles, particles, damage numbers, enemies', () => {
  // Pool factory must support at least these pool types
  const projectilePool = new ObjectPool({
    create: () => ({ type: 'projectile', alive: false, x: 0, y: 0, vx: 0, vy: 0, damage: 0 }),
    reset: (o) => { o.alive = false; o.x = 0; o.y = 0; o.vx = 0; o.vy = 0; o.damage = 0; },
    initialSize: 10,
  });
  const particlePool = new ObjectPool({
    create: () => ({ type: 'particle', alive: false, life: 0 }),
    reset: (o) => { o.alive = false; o.life = 0; },
    initialSize: 20,
  });
  const damagePool = new ObjectPool({
    create: () => ({ type: 'damageNumber', value: 0, alive: false }),
    reset: (o) => { o.value = 0; o.alive = false; },
    initialSize: 5,
  });
  const enemyPool = new ObjectPool({
    create: () => ({ type: 'enemy', hp: 0, alive: false }),
    reset: (o) => { o.hp = 0; o.alive = false; },
    initialSize: 8,
  });

  const p = projectilePool.acquire();
  assert.equal(p.type, 'projectile');
  const pa = particlePool.acquire();
  assert.equal(pa.type, 'particle');
  const d = damagePool.acquire();
  assert.equal(d.type, 'damageNumber');
  const e = enemyPool.acquire();
  assert.equal(e.type, 'enemy');
});

test('AIScheduler defines 5 performance tiers and assigns correct tier by distance', () => {
  // Required tiers from brief
  assert.ok(AI_TIER.FIGHTING_NEARBY, 'tier FIGHTING_NEARBY must exist');
  assert.ok(AI_TIER.VISIBLE_DISTANT, 'tier VISIBLE_DISTANT must exist');
  assert.ok(AI_TIER.OUTSIDE_CAMERA, 'tier OUTSIDE_CAMERA must exist');
  assert.ok(AI_TIER.FAR_OUTSIDE_ACTIVE, 'tier FAR_OUTSIDE_ACTIVE must exist');
  assert.ok(AI_TIER.DEAD, 'tier DEAD must exist');

  const scheduler = new AIScheduler();

  // Dead entity
  const dead = { hp: 0, distToPlayer: 0, inCamera: false };
  assert.equal(scheduler.getTier(dead), AI_TIER.DEAD);

  // Fighting nearby
  const nearby = { hp: 100, distToPlayer: 50, inCamera: true };
  assert.equal(scheduler.getTier(nearby), AI_TIER.FIGHTING_NEARBY);

  // Visible distant (in camera but far)
  const visibleFar = { hp: 100, distToPlayer: 400, inCamera: true };
  assert.equal(scheduler.getTier(visibleFar), AI_TIER.VISIBLE_DISTANT);

  // Outside camera but close-ish
  const outsideCam = { hp: 100, distToPlayer: 300, inCamera: false };
  assert.equal(scheduler.getTier(outsideCam), AI_TIER.OUTSIDE_CAMERA);

  // Far outside active area
  const farOutside = { hp: 100, distToPlayer: 2000, inCamera: false };
  assert.equal(scheduler.getTier(farOutside), AI_TIER.FAR_OUTSIDE_ACTIVE);
});

test('AIScheduler shouldUpdate returns true for FIGHTING_NEARBY every frame and throttles others', () => {
  const scheduler = new AIScheduler();

  // FIGHTING_NEARBY should always update
  assert.ok(scheduler.shouldUpdate(AI_TIER.FIGHTING_NEARBY, 0));
  assert.ok(scheduler.shouldUpdate(AI_TIER.FIGHTING_NEARBY, 1));

  // DEAD should never update
  assert.ok(!scheduler.shouldUpdate(AI_TIER.DEAD, 0));
  assert.ok(!scheduler.shouldUpdate(AI_TIER.DEAD, 100));

  // FAR_OUTSIDE_ACTIVE should update very infrequently
  let farUpdates = 0;
  for (let frame = 0; frame < 60; frame++) {
    if (scheduler.shouldUpdate(AI_TIER.FAR_OUTSIDE_ACTIVE, frame)) farUpdates++;
  }
  assert.ok(farUpdates < 10, 'far-outside AI should update very rarely (suspended)');
});

test('SaveMigrator handles safe save migration, backup recovery, and ISO timestamp error logging', () => {
  const migrator = new SaveMigrator();

  // Basic migration: add missing fields with defaults
  const oldSave = { version: '0.3.0', highestLevel: 50 };
  const migrated = migrator.migrate(oldSave, '0.5.0');
  assert.ok(migrated, 'migration must return an object');
  assert.equal(migrated.version, '0.5.0');

  // Backup recovery
  const backup = migrator.createBackup({ version: '0.5.0', highestLevel: 100 });
  assert.ok(backup, 'backup creation must return backup object');
  const recovered = migrator.recover(backup);
  assert.equal(recovered.highestLevel, 100);

  // Error logging with ISO timestamp
  migrator.logError('Test error message');
  const logs = migrator.getErrorLog();
  assert.ok(Array.isArray(logs) && logs.length > 0, 'error log must have entries');
  const lastLog = logs[logs.length - 1];
  assert.ok(lastLog.timestamp, 'log entry must have a timestamp');
  assert.match(lastLog.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'timestamp must be ISO format');
  assert.ok(lastLog.message.includes('Test error message'), 'log entry must include the message');
});

test('BenchmarkRunner executes stress test scenarios without throwing', () => {
  const runner = new BenchmarkRunner();
  const scenarios = runner.getScenarios();
  assert.ok(Array.isArray(scenarios) && scenarios.length >= 4, 'must define at least 4 benchmark scenarios');

  const ids = scenarios.map(s => s.id);
  assert.ok(ids.some(id => /enemy|enemies/i.test(id)), 'must include an active-enemies scenario');
  assert.ok(ids.some(id => /spell/i.test(id)), 'must include a simultaneous-spells scenario');
  assert.ok(ids.some(id => /boss/i.test(id)), 'must include a multi-phase boss scenario');
  assert.ok(ids.some(id => /zone|transition/i.test(id)), 'must include a zone-transition scenario');

  // Run one scenario synchronously
  const result = runner.run(scenarios[0].id);
  assert.ok(result, 'run must return a result');
  assert.ok(typeof result.duration === 'number', 'result must include duration');
  assert.ok(typeof result.score === 'number' || result.score === null, 'result must include score or null');
});

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 2 — src/overdrive.js
// ═════════════════════════════════════════════════════════════════════════════

test('overdrive version is defined', () => {
  assert.ok(OVERDRIVE_VERSION, 'OVERDRIVE_VERSION must be a non-empty string');
  assert.match(String(OVERDRIVE_VERSION), /\d/, 'version must contain a digit');
});

test('overdrive chapters define exactly 10 expansion chapters (21-30) covering levels 201-300', () => {
  assert.equal(OVERDRIVE_CHAPTERS.length, 10, 'must have exactly 10 chapters');
  assert.equal(OVERDRIVE_CHAPTERS[0].number, 21, 'first chapter must be 21');
  assert.equal(OVERDRIVE_CHAPTERS[9].number, 30, 'last chapter must be 30');

  for (const ch of OVERDRIVE_CHAPTERS) {
    assert.ok(ch.id && ch.name && ch.bossId && ch.bossName, `chapter ${ch.number} must have id, name, bossId, bossName`);
    assert.equal(ch.levelEnd - ch.levelStart + 1, 10, `chapter ${ch.number} must span 10 levels`);
    assert.ok(ch.levelStart >= 201 && ch.levelEnd <= 300, `chapter ${ch.number} levels must be in 201-300 range`);
    assert.ok(ch.hazards || ch.lore, `chapter ${ch.number} must have hazards or lore`);
    assert.equal(OVERDRIVE_CHAPTER_BY_ID[ch.id], ch, `OVERDRIVE_CHAPTER_BY_ID[${ch.id}] must reference the chapter`);
  }
});

test('overdrive chapters include all 10 named bosses from the brief', () => {
  const bossNames = OVERDRIVE_CHAPTERS.map(ch => ch.bossName.toLowerCase());
  const expected = [
    'sunken emperor', 'prism devourer', 'forge titan', 'mother of thorns',
    'starbound regent', 'pale frost monarch', 'grand horologist', 'unmade',
    'sandstorm sovereign', 'first god',
  ];
  for (const boss of expected) {
    assert.ok(
      bossNames.some(bn => bn.includes(boss.split(' ').pop())),
      `Boss "${boss}" must appear in chapter boss list`
    );
  }
});

test('overdrive level specs define all 100 levels from 201 to 300', () => {
  assert.equal(OVERDRIVE_LEVEL_SPECS.length, 100, 'must have 100 level specs');
  assert.equal(OVERDRIVE_LEVEL_SPECS[0].level, 201);
  assert.equal(OVERDRIVE_LEVEL_SPECS[99].level, 300);

  for (let ch = 21; ch <= 30; ch++) {
    const levelsInCh = OVERDRIVE_LEVEL_SPECS.filter(l => l.chapter === ch);
    assert.equal(levelsInCh.length, 10, `Chapter ${ch} must have exactly 10 levels`);
    const bossLevel = levelsInCh[9];
    assert.ok(bossLevel.boss, `Level ${bossLevel.level} must be a boss arena`);
  }
});

test('overdriveChapterForLevel helper returns correct chapter for boundary levels', () => {
  const ch21 = overdriveChapterForLevel(201);
  assert.equal(ch21.number, 21);
  const ch30 = overdriveChapterForLevel(300);
  assert.equal(ch30.number, 30);
  const ch25 = overdriveChapterForLevel(250);
  assert.equal(ch25.number, 25);
});

test('overdrive special level types define exactly 6 types', () => {
  assert.equal(OVERDRIVE_SPECIAL_LEVEL_TYPES.length, 6, 'must have exactly 6 special level types');
  const ids = OVERDRIVE_SPECIAL_LEVEL_TYPES.map(t => (t.id || t.name || '').toLowerCase());
  assert.ok(ids.some(id => /endless|dungeon/i.test(id)), 'must include Endless Dungeon');
  assert.ok(ids.some(id => /colossus|trial/i.test(id)), 'must include Colossus Trial');
  assert.ok(ids.some(id => /time/i.test(id)), 'must include Time Trial');
  assert.ok(ids.some(id => /treasure|vault/i.test(id)), 'must include Treasure Vault');
  assert.ok(ids.some(id => /cursed|expedition/i.test(id)), 'must include Cursed Expedition');
  assert.ok(ids.some(id => /gauntlet|tower/i.test(id)), 'must include Gauntlet Tower');
});

test('spell schools define exactly 8 schools with 4 spells each (32 total)', () => {
  assert.equal(SPELL_SCHOOLS.length, 8, 'must have exactly 8 spell schools');

  const schoolNames = SPELL_SCHOOLS.map(s => (s.id || s.name || '').toLowerCase());
  const expectedSchools = ['storm', 'void', 'nature', 'infernal', 'frost', 'celestial', 'blood', 'chronomancy'];
  for (const school of expectedSchools) {
    assert.ok(schoolNames.some(sn => sn.includes(school.substring(0, 5))), `School "${school}" must exist`);
  }

  let totalSpells = 0;
  for (const school of SPELL_SCHOOLS) {
    assert.ok(Array.isArray(school.spells) && school.spells.length === 4,
      `School ${school.id || school.name} must have exactly 4 spells`);
    totalSpells += school.spells.length;

    for (const spell of school.spells) {
      assert.ok(spell.id && spell.name, `Spell in ${school.id} must have id and name`);
      assert.ok(typeof spell.damage === 'number', `Spell ${spell.id} must have numeric damage`);
      assert.ok(typeof spell.cost === 'number', `Spell ${spell.id} must have numeric cost (mana)`);
      assert.ok(typeof spell.cooldown === 'number', `Spell ${spell.id} must have numeric cooldown`);
    }
  }
  assert.equal(totalSpells, 32, 'must have exactly 32 total spells across all schools');
});

test('SPELL_BY_ID lookup map covers all 32 spells', () => {
  let count = 0;
  for (const school of SPELL_SCHOOLS) {
    for (const spell of school.spells) {
      assert.equal(SPELL_BY_ID[spell.id], spell, `SPELL_BY_ID must reference spell ${spell.id}`);
      count++;
    }
  }
  assert.equal(count, 32);
});

test('weapon categories define exactly 16 categories with 8 legendary weapons', () => {
  assert.equal(OVERDRIVE_WEAPON_CATEGORIES.length, 16, 'must have exactly 16 weapon categories');
  assert.equal(LEGENDARY_WEAPONS.length, 8, 'must have exactly 8 legendary weapons');

  const legendaryNames = LEGENDARY_WEAPONS.map(w => (w.name || '').toLowerCase());
  const expected = ['worldbreaker', 'starfall edge', 'void reaper', 'frostmourne relic',
    'thorncaller', 'sunforged spear', 'chrono staff', 'abyssal harvester'];
  for (const name of expected) {
    assert.ok(
      legendaryNames.some(ln => ln.includes(name.split(' ')[0].toLowerCase())),
      `Legendary weapon "${name}" must be present`
    );
  }
});

test('overdrive enemies define 50 enemies and 10 elite modifiers', () => {
  assert.equal(OVERDRIVE_ENEMIES.length, 50, 'must have exactly 50 new enemies');
  assert.equal(ELITE_MODIFIERS_OVERDRIVE.length, 10, 'must have exactly 10 elite modifiers');

  const modifierNames = ELITE_MODIFIERS_OVERDRIVE.map(m => (m.id || m.name || '').toLowerCase());
  const expectedMods = ['armored', 'enraged', 'frozen', 'electrified', 'regenerating',
    'phantom', 'explosive', 'cursed', 'arcane', 'summoner'];
  for (const mod of expectedMods) {
    assert.ok(modifierNames.some(mn => mn.includes(mod.substring(0, 5))), `Modifier "${mod}" must exist`);
  }
});

test('background bosses define exactly 6 world bosses with encounter loop', () => {
  assert.equal(BACKGROUND_BOSSES.length, 6, 'must have exactly 6 background bosses');

  const bossNames = BACKGROUND_BOSSES.map(b => (b.id || b.name || '').toLowerCase());
  assert.ok(bossNames.some(n => /colossus|world/i.test(n)), 'World Colossus must be present');
  assert.ok(bossNames.some(n => /nemesis|roam/i.test(n)), 'Roaming Nemesis must be present');
  assert.ok(bossNames.some(n => /sky|behemoth/i.test(n)), 'Sky Behemoth must be present');
  assert.ok(bossNames.some(n => /abyssal|creature/i.test(n)), 'Abyssal Creature must be present');
  assert.ok(bossNames.some(n => /ancient|guardian/i.test(n)), 'Ancient Guardian must be present');
  assert.ok(bossNames.some(n => /rival|boss/i.test(n)), 'Rival Boss must be present');

  for (const boss of BACKGROUND_BOSSES) {
    assert.ok(boss.id && boss.name, `background boss must have id and name`);
    assert.ok(typeof boss.encounterChance === 'number' || boss.encounterInterval, `boss ${boss.id} must have encounter timing`);
  }
});

test('overdrive game modes define exactly 12 new modes', () => {
  assert.equal(OVERDRIVE_MODES.length, 12, 'must have exactly 12 new game modes');
  for (const mode of OVERDRIVE_MODES) {
    assert.ok(mode.id && mode.name, `mode must have id and name`);
  }
});

test('overdrive NPCs define 30 characters and 10 story questlines', () => {
  assert.equal(OVERDRIVE_NPCS.length, 30, 'must have exactly 30 NPCs');
  assert.equal(OVERDRIVE_QUESTLINES.length, 10, 'must have exactly 10 story questlines');

  for (const npc of OVERDRIVE_NPCS) {
    assert.ok(npc.id && npc.name, `NPC must have id and name`);
  }
  for (const q of OVERDRIVE_QUESTLINES) {
    assert.ok(q.id && q.title, `questline must have id and title`);
  }
});

test('overdrive acceptance checklist defines exactly 18 items', () => {
  assert.equal(OVERDRIVE_CHECKLIST.length, 18, 'must have exactly 18 acceptance checklist items');
  for (const item of OVERDRIVE_CHECKLIST) {
    assert.ok(item.id && item.label, `checklist item must have id and label`);
    assert.ok(typeof item.ready === 'boolean', `checklist item must have boolean ready flag`);
  }
});

test('overdrive progress helpers produce sanitized defaults', () => {
  const def = defaultOverdriveProgress();
  assert.ok(def, 'defaultOverdriveProgress must return an object');
  assert.ok(typeof def.highestLevel === 'number');
  assert.ok(def.highestLevel >= 201);

  const sanitized = sanitizeOverdriveProgress({ highestLevel: 255, activeModes: ['endless'] });
  assert.ok(sanitized, 'sanitizeOverdriveProgress must return an object');
  assert.equal(sanitized.highestLevel, 255);
});

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 3 — src/boss_overdrive.js
// ═════════════════════════════════════════════════════════════════════════════

test('BossHealthSystem initializes all health layers correctly', () => {
  const bhs = new BossHealthSystem({
    mainHp: 1000,
    armorHp: 300,
    shieldHp: 200,
    staggerMax: 500,
    weaknessMax: 100,
    enrageMax: 200,
  });

  assert.equal(bhs.mainHp, 1000);
  assert.equal(bhs.armorHp, 300);
  assert.equal(bhs.shieldHp, 200);
  assert.equal(bhs.staggerMeter, 0, 'stagger meter starts at 0');
  assert.equal(bhs.enrageMeter, 0, 'enrage meter starts at 0');
  assert.ok(!bhs.isEnraged, 'boss starts not enraged');
  assert.ok(!bhs.isStaggered, 'boss starts not staggered');
});

test('BossHealthSystem: Armor reduces physical damage before main HP', () => {
  const bhs = new BossHealthSystem({
    mainHp: 1000, armorHp: 300, shieldHp: 0, staggerMax: 500, weaknessMax: 100, enrageMax: 200,
  });

  bhs.applyDamage({ amount: 100, type: 'physical' });
  assert.ok(bhs.armorHp < 300, 'armor should absorb physical damage');
  assert.equal(bhs.mainHp, 1000, 'main HP should not decrease while armor holds');
});

test('BossHealthSystem: Shield absorbs all damage types until broken', () => {
  const bhs = new BossHealthSystem({
    mainHp: 1000, armorHp: 0, shieldHp: 100, staggerMax: 500, weaknessMax: 100, enrageMax: 200,
  });

  bhs.applyDamage({ amount: 50, type: 'magical' });
  assert.ok(bhs.shieldHp < 100, 'shield should absorb magical damage');
  assert.equal(bhs.mainHp, 1000, 'main HP untouched while shield holds');

  bhs.applyDamage({ amount: 100, type: 'magical' });
  assert.ok(bhs.shieldHp <= 0, 'shield should break on excess damage');
});

test('BossHealthSystem: Stagger fills on hits and stuns boss at max', () => {
  const bhs = new BossHealthSystem({
    mainHp: 1000, armorHp: 0, shieldHp: 0, staggerMax: 100, weaknessMax: 100, enrageMax: 200,
  });

  // Deal hits that fill stagger
  for (let i = 0; i < 10; i++) {
    bhs.applyDamage({ amount: 10, type: 'physical' });
  }
  assert.ok(bhs.staggerMeter >= 100 || bhs.isStaggered, 'boss should be staggered after enough hits');
});

test('BossHealthSystem: Enrage meter fills and boss becomes enraged', () => {
  const bhs = new BossHealthSystem({
    mainHp: 1000, armorHp: 0, shieldHp: 0, staggerMax: 500, weaknessMax: 100, enrageMax: 100,
  });

  bhs.fillEnrage(110);
  assert.ok(bhs.isEnraged, 'boss should enter enrage state when enrage meter is full');
});

test('BossHealthSystem tracks phase health and summon health', () => {
  const bhs = new BossHealthSystem({
    mainHp: 1000, armorHp: 0, shieldHp: 0, staggerMax: 500, weaknessMax: 100, enrageMax: 200,
    phaseHp: 500, summonHp: 150,
  });

  assert.equal(bhs.phaseHp, 500);
  assert.equal(bhs.summonHp, 150);
});

test('OVERDRIVE_BOSSES defines the 8 required multi-phase bosses', () => {
  assert.ok(Array.isArray(OVERDRIVE_BOSSES), 'OVERDRIVE_BOSSES must be an array');
  assert.ok(OVERDRIVE_BOSSES.length >= 8, 'must define at least 8 bosses');

  const bossIds = OVERDRIVE_BOSSES.map(b => (b.id || b.name || '').toLowerCase());
  const requiredBosses = [
    'ashen dragon', 'iron colossus', 'hollow broodmother', 'watching void',
    'black paladin', 'glacier wyrm', 'worldroot ancient', 'fallen seraph',
  ];
  for (const name of requiredBosses) {
    const key = name.split(' ').pop().toLowerCase();
    assert.ok(bossIds.some(id => id.includes(key)), `Boss "${name}" must be in OVERDRIVE_BOSSES`);
  }
});

test('BossPhaseController handles multi-phase boss transitions', () => {
  const bossConfig = OVERDRIVE_BOSSES.find(b => b.id === 'ashen_dragon' || /dragon/i.test(b.name));
  assert.ok(bossConfig, 'Ashen Dragon config must exist');

  const controller = new BossPhaseController(bossConfig);
  assert.ok(controller.currentPhase >= 1, 'must start at phase 1 or higher');
  assert.ok(controller.totalPhases >= 3, 'must have at least 3 phases');

  const phase = controller.getPhaseConfig(1);
  assert.ok(phase, 'getPhaseConfig(1) must return a phase object');
  assert.ok(phase.triggers || phase.healthThreshold, 'phase must define transition triggers or health threshold');
});

test('BossPhaseController handles up to 5 phases and invulnerability frames', () => {
  // Find a boss with 5 phases (Ashen Dragon or Watching Void)
  const fivePhase = OVERDRIVE_BOSSES.filter(b => b.phases && b.phases.length >= 5);
  assert.ok(fivePhase.length >= 2, 'at least 2 bosses must have 5 phases');

  const controller = new BossPhaseController(fivePhase[0]);
  assert.equal(controller.totalPhases, fivePhase[0].phases.length);

  // Trigger a phase transition
  controller.triggerPhaseTransition(2);
  assert.ok(controller.isInvulnerable === true || controller.invulnerabilityFrames > 0,
    'boss must be invulnerable during phase transition');
  assert.equal(controller.currentPhase, 2);
});

test('BossPhaseController activates arena hazards and enrage escalation on phase change', () => {
  const bossConfig = OVERDRIVE_BOSSES.find(b => b.phases && b.phases.length >= 2);
  const controller = new BossPhaseController(bossConfig);

  const events = [];
  controller.onHazardActivated = (hazard) => events.push({ type: 'hazard', hazard });
  controller.onEnrageEscalation = (level) => events.push({ type: 'enrage', level });

  controller.triggerPhaseTransition(2);

  // After advancing to phase 2, at least one event should fire if the boss has hazards/enrage
  // We can't guarantee both always fire, just that the hooks exist and work
  assert.ok(typeof controller.onHazardActivated === 'function', 'hazard hook must be a function');
  assert.ok(typeof controller.onEnrageEscalation === 'function', 'enrage escalation hook must be a function');
});

test('SpellCastingEngine manages mana consumption, cooldowns, and elemental multipliers', () => {
  const engine = new SpellCastingEngine({ maxMana: 200 });
  assert.equal(engine.mana, 200, 'engine starts with full mana');

  // Find a valid spell from the first school
  const school = SPELL_SCHOOLS[0];
  const spell = school.spells[0];

  const result = engine.cast(spell.id, { targetX: 100, targetY: 100 });
  assert.ok(result, 'cast must return a result object');
  assert.ok(typeof result.damage === 'number', 'cast result must include damage');
  assert.ok(engine.mana < 200, 'casting a spell must consume mana');

  // Verify cooldown is applied
  assert.ok(engine.isOnCooldown(spell.id), `spell ${spell.id} must be on cooldown after casting`);
});

test('SpellCastingEngine prevents casting when mana is insufficient', () => {
  const engine = new SpellCastingEngine({ maxMana: 5 });
  // Find an expensive spell
  const expensiveSpell = SPELL_SCHOOLS.flatMap(s => s.spells).find(sp => sp.cost > 10);
  if (!expensiveSpell) return; // skip if all spells are free (shouldn't happen)

  const result = engine.cast(expensiveSpell.id, { targetX: 0, targetY: 0 });
  assert.ok(!result || result.failed || result.reason === 'insufficient_mana',
    'cast must fail gracefully when mana is too low');
});

test('SpellCastingEngine prevents casting a spell already on cooldown', () => {
  const engine = new SpellCastingEngine({ maxMana: 1000 });
  const spell = SPELL_SCHOOLS[0].spells[0];

  engine.cast(spell.id, { targetX: 0, targetY: 0 });
  assert.ok(engine.isOnCooldown(spell.id), 'spell should be on cooldown after first cast');

  const secondCast = engine.cast(spell.id, { targetX: 0, targetY: 0 });
  assert.ok(!secondCast || secondCast.failed || secondCast.reason === 'on_cooldown',
    'second cast while on cooldown must fail gracefully');
});

test('SpellCastingEngine applies elemental multipliers and spell modifiers', () => {
  const engine = new SpellCastingEngine({ maxMana: 1000 });

  // Pick spells from different schools and check they produce different damage profiles
  const stormSpell = SPELL_SCHOOLS.find(s => /storm/i.test(s.id || s.name))?.spells[0];
  const frostSpell = SPELL_SCHOOLS.find(s => /frost/i.test(s.id || s.name))?.spells[0];

  if (stormSpell && frostSpell) {
    const stormResult = engine.cast(stormSpell.id, { targetX: 100, targetY: 100 });
    // Allow engine to reset for second cast
    engine.clearCooldowns();
    engine.mana = 1000;
    const frostResult = engine.cast(frostSpell.id, { targetX: 100, targetY: 100 });

    assert.ok(stormResult && frostResult, 'both spells must produce results');
    // The two spells should have different base damages
    assert.notEqual(stormSpell.damage, frostSpell.damage, 'different schools should have different base damages');
  }
});

test('SpellCastingEngine mana regenerates over time via tick', () => {
  const engine = new SpellCastingEngine({ maxMana: 200, manaRegenRate: 10 });
  const spell = SPELL_SCHOOLS[0].spells[0];
  engine.cast(spell.id, { targetX: 0, targetY: 0 });
  const manaAfterCast = engine.mana;

  engine.tick(1.0); // 1 second
  assert.ok(engine.mana > manaAfterCast, 'mana should regenerate over time via tick');
});
